const { createServer } = require("http");
const { createHmac, timingSafeEqual } = require("crypto");
const next = require("next");
const { Server } = require("socket.io");

// Sem isso, qualquer erro não tratado (ex.: numa promise de um handler de
// socket) derruba o processo inteiro e o Railway fica reiniciando em loop
// sem deixar rastro do motivo real no log.
process.on("uncaughtException", (error) => {
  console.error("Erro não tratado (uncaughtException):", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Promise rejeitada sem tratamento (unhandledRejection):", reason);
});

const dev = process.env.NODE_ENV !== "production";

const hostname = "0.0.0.0";
const port = process.env.PORT || 3000;

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "dev-only-insecure-secret-change-me";

if (!process.env.SESSION_SECRET) {
  console.warn(
    "Aviso: SESSION_SECRET não definido, usando segredo de desenvolvimento inseguro."
  );
}

function verifySessionToken(token, userId) {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  const [id, expiresAt, signature] = parts;
  const payload = `${id}.${expiresAt}`;

  const expectedSignature = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return false;
  }

  if (Number(expiresAt) < Date.now()) {
    return false;
  }

  return Number(id) === userId;
}

const app = next({
  dev,
  hostname,
  port,
});

const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const onlineUsers = {};
  const socketUsers = new Map();
  const socketCallRoom = new Map();

  function getUserBySocketId(socketId) {
    return Object.values(onlineUsers).find(
      (user) => user.socketId === socketId
    );
  }

  // Acha o primeiro número de assento livre numa sala — os assentos são
  // só números (0, 1, 2...), sem precisar o servidor conhecer o layout
  // visual de cada sala (isso fica só no componente de cada sala no
  // cliente, que ignora um número de assento maior do que os lugares que
  // ela desenha).
  function assignFreeSeat(room, excludeUserId) {
    const occupied = new Set(
      Object.values(onlineUsers)
        .filter(
          (user) =>
            user.room === room &&
            user.id !== excludeUserId &&
            typeof user.seat === "number"
        )
        .map((user) => user.seat)
    );

    let seat = 0;

    while (occupied.has(seat)) {
      seat++;
    }

    return seat;
  }

  function leaveCurrentCall(socket) {
    const callKey = socketCallRoom.get(socket.id);

    if (!callKey) {
      return;
    }

    socket.leave(callKey);

    socket.to(callKey).emit("user-left-meeting", {
      socketId: socket.id,
    });

    socketCallRoom.delete(socket.id);
  }

  io.on("connection", (socket) => {
    socket.on("user-connected", (user) => {
      if (!verifySessionToken(user.token, user.id)) {
        console.warn(
          "Conexão rejeitada: token de sessão inválido para",
          user.nome
        );
        return;
      }

      socketUsers.set(socket.id, user.id);

      onlineUsers[user.id] = {
        id: user.id,
        nome: user.nome,
        room: user.room,
        status: user.status,
        portasAbertas: Boolean(user.portasAbertas),
        seat: assignFreeSeat(user.room, user.id),
        socketId: socket.id,
      };

      io.emit("presence-update", Object.values(onlineUsers));

      console.log("Entrou:", user.nome);
    });

    socket.on("room-change", ({ userId, room }) => {
      if (socketUsers.get(socket.id) !== userId) {
        console.warn(
          "Mudança de sala rejeitada: socket não corresponde ao usuário",
          userId
        );
        return;
      }

      if (onlineUsers[userId]) {
        onlineUsers[userId].room = room;

        // O assento é sempre por sala — ao mudar de sala, reatribui
        // automaticamente o primeiro lugar livre na sala de destino (o
        // usuário ainda pode clicar em outro lugar depois pra trocar).
        onlineUsers[userId].seat = assignFreeSeat(
          room,
          userId
        );

        io.emit("presence-update", Object.values(onlineUsers));

        console.log("Mudou de sala:", onlineUsers[userId].nome, room);
      }
    });

    // Troca de assento dentro da mesma sala (clique em um lugar livre).
    // Se o lugar já estiver ocupado por outra pessoa, ignora silenciosamente
    // — evita duas pessoas caindo no mesmo lugar por uma corrida de cliques.
    socket.on("seat-change", ({ userId, seat }) => {
      if (socketUsers.get(socket.id) !== userId) {
        console.warn(
          "Mudança de assento rejeitada: socket não corresponde ao usuário",
          userId
        );
        return;
      }

      const user = onlineUsers[userId];

      if (!user || typeof seat !== "number") {
        return;
      }

      const seatTaken = Object.values(onlineUsers).some(
        (other) =>
          other.id !== userId &&
          other.room === user.room &&
          other.seat === seat
      );

      if (seatTaken) {
        return;
      }

      user.seat = seat;

      io.emit("presence-update", Object.values(onlineUsers));
    });

    socket.on("status-change", ({ userId, status }) => {
      if (socketUsers.get(socket.id) !== userId) {
        console.warn(
          "Mudança de status rejeitada: socket não corresponde ao usuário",
          userId
        );
        return;
      }

      if (onlineUsers[userId]) {
        onlineUsers[userId].status = status;

        io.emit("presence-update", Object.values(onlineUsers));
      }
    });

    socket.on("door-toggle", ({ userId, aberta }) => {
      if (socketUsers.get(socket.id) !== userId) {
        console.warn(
          "Mudança de portas abertas rejeitada: socket não corresponde ao usuário",
          userId
        );
        return;
      }

      if (onlineUsers[userId]) {
        onlineUsers[userId].portasAbertas = Boolean(aberta);

        io.emit("presence-update", Object.values(onlineUsers));
      }
    });

    // "Cutucar": avisa um usuário específico, esteja ele em qual sala
    // estiver, com um som e uma notificação — o nome de quem chamou vem
    // do registro do servidor, nunca do payload do cliente, para não
    // permitir que alguém se passe por outra pessoa.
    socket.on("poke", ({ to }) => {
      const senderId = socketUsers.get(socket.id);
      const sender = onlineUsers[senderId];
      const target = onlineUsers[to];

      if (!sender || !target) {
        return;
      }

      io.to(target.socketId).emit("poked", {
        fromId: sender.id,
        fromNome: sender.nome,
      });
    });

    // Pede pra um participante da chamada mutar o próprio microfone. Não
    // dá pra silenciar a faixa de áudio de outra pessoa à força (WebRTC
    // não permite isso sem cooperação de quem está enviando) — então isso
    // é um pedido que o cliente-alvo atende sozinho.
    socket.on("mute-user", ({ to }) => {
      const senderId = socketUsers.get(socket.id);
      const sender = onlineUsers[senderId];

      if (!sender || !to) {
        return;
      }

      io.to(to).emit("muted-by-someone", {
        fromNome: sender.nome,
      });
    });

    // Remove um participante da chamada — só funciona se quem pediu e o
    // alvo estiverem na mesma sala de chamada (não dá pra expulsar alguém
    // de uma chamada que você nem está). O alvo recebe um aviso e, do lado
    // dele, encerra a própria captura de câmera/microfone (o servidor só
    // consegue tirar o socket da sala de sinalização).
    socket.on("kick-from-meeting", ({ to }) => {
      const senderId = socketUsers.get(socket.id);
      const sender = onlineUsers[senderId];

      if (!sender || !to) {
        return;
      }

      const callKey = socketCallRoom.get(socket.id);
      const targetCallKey = socketCallRoom.get(to);

      if (!callKey || targetCallKey !== callKey) {
        return;
      }

      const targetSocket = io.sockets.sockets.get(to);

      if (!targetSocket) {
        return;
      }

      io.to(to).emit("kicked-from-meeting", {
        fromNome: sender.nome,
      });

      leaveCurrentCall(targetSocket);
    });

    // Avisa quem está na chamada se o microfone local está ligado ou
    // desligado — mostra um selo de "mutado" no card de cada participante.
    // Com `to`, avisa só um participante específico (usado quando alguém
    // novo entra na chamada e precisa saber o estado atual de quem já
    // estava lá, já que esse estado não é transmitido em broadcast).
    socket.on("mic-state", ({ micOn, to }) => {
      if (to) {
        io.to(to).emit("mic-state-changed", {
          socketId: socket.id,
          micOn: Boolean(micOn),
        });
        return;
      }

      const callKey = socketCallRoom.get(socket.id);

      if (!callKey) {
        return;
      }

      socket.to(callKey).emit("mic-state-changed", {
        socketId: socket.id,
        micOn: Boolean(micOn),
      });
    });

    // Convida um usuário (esteja ele em qual sala estiver) pra vir até a
    // sala de quem está convidando.
    socket.on("invite-to-room", ({ to, room }) => {
      const senderId = socketUsers.get(socket.id);
      const sender = onlineUsers[senderId];
      const target = onlineUsers[to];

      if (!sender || !target || !room) {
        return;
      }

      io.to(target.socketId).emit("invited-to-room", {
        fromNome: sender.nome,
        room,
      });
    });

    // Sinalização WebRTC em malha, isolada por sala do escritório: cada
    // par de participantes negocia sua própria conexão, endereçada pelo
    // socket id de destino (`to`), em vez de transmitir para toda a sala
    // — permite mais de 2 participantes por chamada.
    socket.on("join-meeting", ({ room }) => {
      if (!room) {
        return;
      }

      leaveCurrentCall(socket);

      const callKey = `call:${room}`;

      const existingRoom =
        io.sockets.adapter.rooms.get(callKey);

      const existingParticipants = existingRoom
        ? Array.from(existingRoom).map((socketId) => ({
            socketId,
            nome: getUserBySocketId(socketId)?.nome,
          }))
        : [];

      socket.join(callKey);
      socketCallRoom.set(socket.id, callKey);

      socket.emit(
        "existing-participants",
        existingParticipants
      );

      const joiner = getUserBySocketId(socket.id);

      socket.to(callKey).emit("user-joined-meeting", {
        socketId: socket.id,
        nome: joiner?.nome,
      });

      console.log("Entrou na chamada:", room, socket.id);
    });

    socket.on("leave-meeting", () => {
      leaveCurrentCall(socket);
    });

    socket.on("offer", ({ to, offer }) => {
      io.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      io.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("disconnecting", () => {
      leaveCurrentCall(socket);
    });

    socket.on("disconnect", () => {
      Object.keys(onlineUsers).forEach((id) => {
        if (onlineUsers[id].socketId === socket.id) {
          delete onlineUsers[id];
        }
      });

      socketUsers.delete(socket.id);

      io.emit("presence-update", Object.values(onlineUsers));
    });
  });

  httpServer.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
});
