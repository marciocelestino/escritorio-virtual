const { createServer } = require("http");
const { createHmac, timingSafeEqual } = require("crypto");
const fs = require("fs");
const path = require("path");
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

// Identifica esta "execução" do servidor — muda toda vez que o processo
// sobe (ex.: um novo deploy no Railway substitui o processo antigo pelo
// novo). O cliente usa isso pra saber que reconectou num servidor
// DIFERENTE do que estava antes (não só uma queda de rede passageira) e
// recarregar a página sozinho, pegando a versão nova sem precisar pedir
// pra cada pessoa apertar Ctrl+F5.
const SERVER_BOOT_ID = `${Date.now()}-${Math.random()
  .toString(36)
  .slice(2)}`;

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

  // Sala pessoal trancada: só quem está neste conjunto (por nome de sala)
  // pode entrar, além do próprio dono. Preenchido quando o dono convida
  // alguém ("Chamar aqui") ou aceita um pedido de entrada — consumido (uso
  // único) na primeira troca de sala bem-sucedida pra aquela sala.
  const allowedGuests = new Map();

  function getUserBySocketId(socketId) {
    return Object.values(onlineUsers).find(
      (user) => user.socketId === socketId
    );
  }

  // server.js roda com Node puro (sem passar pelo build do Next), então
  // não dá pra importar lib/db.ts (TypeScript) direto — lê o mesmo
  // arquivo JSON de usuários igual o scripts/create-user.js já faz, só
  // pra checagens pontuais (quem é admin, de quem é uma sala pessoal).
  function resolveUsersFilePath() {
    if (process.env.DATABASE_PATH) {
      return process.env.DATABASE_PATH;
    }

    if (fs.existsSync("/data")) {
      return path.join("/data", "usuarios.json");
    }

    return path.join(
      process.cwd(),
      "data",
      "usuarios-db.json"
    );
  }

  function loadAllUsersFromDisk() {
    try {
      const usersPath = resolveUsersFilePath();

      if (!fs.existsSync(usersPath)) {
        return [];
      }

      return JSON.parse(
        fs.readFileSync(usersPath, "utf8")
      );
    } catch (error) {
      console.error(
        "Erro ao ler arquivo de usuários:",
        error
      );
      return [];
    }
  }

  function isUserAdmin(userId) {
    const users = loadAllUsersFromDisk();
    const user = users.find(
      (u) => u.id === userId
    );
    return Boolean(user && user.isAdmin);
  }

  // Dono de uma sala pessoal: quem tem esse nome de sala (customizado ou
  // "Espaço {nome}" padrão) associado ao próprio cadastro.
  function getPersonalRoomOwnerId(room) {
    const users = loadAllUsersFromDisk();

    const owner = users.find(
      (u) =>
        (u.salaNome || `Espaço ${u.nome}`) ===
        room
    );

    return owner ? owner.id : null;
  }

  const COMMON_ROOMS = [
    "Recepção",
    "Sala de Reunião",
    "Espaço Natureza",
  ];

  // Salas comuns só o admin pode limpar (não têm um "dono" único); salas
  // pessoais só quem é dono delas.
  function canClearChat(userId, room) {
    if (COMMON_ROOMS.includes(room)) {
      return isUserAdmin(userId);
    }

    return (
      getPersonalRoomOwnerId(room) === userId
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

    socket.emit("server-info", {
      bootId: SERVER_BOOT_ID,
    });

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
        salaTrancada: Boolean(user.salaTrancada),
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

      // Sala pessoal trancada: só o dono entra livremente. Qualquer outra
      // pessoa precisa ter sido liberada antes (convite do dono ou pedido
      // de entrada aceito) — ver `allowedGuests`.
      const ownerId = getPersonalRoomOwnerId(room);

      if (ownerId && ownerId !== userId) {
        const owner = onlineUsers[ownerId];

        if (owner && owner.salaTrancada) {
          const allowed = allowedGuests.get(room);

          if (!allowed || !allowed.has(userId)) {
            socket.emit("room-change-denied", { room });
            return;
          }

          allowed.delete(userId);
        }
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

    // Tranca/destranca a própria sala pessoal — só o dono pode mudar (a
    // checagem userId === dono da sala não é necessária aqui porque
    // qualquer usuário só tranca a SUA PRÓPRIA sala pessoal por definição,
    // já que o campo é sempre onlineUsers[userId], nunca o de outra
    // pessoa).
    socket.on("sala-lock-change", ({ userId, trancada }) => {
      if (socketUsers.get(socket.id) !== userId) {
        console.warn(
          "Mudança de trava de sala rejeitada: socket não corresponde ao usuário",
          userId
        );
        return;
      }

      if (onlineUsers[userId]) {
        onlineUsers[userId].salaTrancada = Boolean(trancada);

        io.emit("presence-update", Object.values(onlineUsers));
      }
    });

    // Pede pra entrar numa sala pessoal trancada — avisa o dono, que aceita
    // ou recusa. Só funciona se a sala tiver um dono conectado; sem isso
    // (dono offline) já responde negado na hora.
    socket.on("request-room-entry", ({ room, seat }) => {
      const senderId = socketUsers.get(socket.id);
      const sender = onlineUsers[senderId];

      if (!sender || typeof room !== "string") {
        return;
      }

      const ownerId = getPersonalRoomOwnerId(room);

      if (!ownerId || ownerId === senderId) {
        return;
      }

      const owner = onlineUsers[ownerId];

      if (!owner) {
        socket.emit("room-entry-response", {
          room,
          approved: false,
          reason: "offline",
        });
        return;
      }

      io.to(owner.socketId).emit("room-entry-requested", {
        requesterId: sender.id,
        requesterNome: sender.nome,
        room,
        seat: typeof seat === "number" ? seat : null,
      });
    });

    // Resposta do dono a um pedido de entrada — só o dono da sala em
    // questão pode responder por ela.
    socket.on(
      "respond-room-entry",
      ({ requesterId, room, approve }) => {
        const senderId = socketUsers.get(socket.id);

        const ownerId = getPersonalRoomOwnerId(room);

        if (!ownerId || ownerId !== senderId) {
          return;
        }

        const requester = onlineUsers[requesterId];

        if (!requester) {
          return;
        }

        if (approve) {
          const allowed =
            allowedGuests.get(room) ?? new Set();

          allowed.add(requesterId);
          allowedGuests.set(room, allowed);
        }

        io.to(requester.socketId).emit(
          "room-entry-response",
          {
            room,
            approved: Boolean(approve),
          }
        );
      }
    );

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

    // Chat de texto por sala — sem histórico persistente (só existe
    // enquanto a pessoa está com a página aberta) e sem @menção por
    // enquanto. Manda pra todo mundo e cada cliente filtra pela sala,
    // igual já acontece com o presence-update.
    socket.on("chat-message", ({ room, message }) => {
      const senderId = socketUsers.get(socket.id);
      const sender = onlineUsers[senderId];

      if (
        !sender ||
        typeof message !== "string" ||
        typeof room !== "string" ||
        sender.room !== room
      ) {
        return;
      }

      const trimmed = message.trim().slice(0, 500);

      if (!trimmed) {
        return;
      }

      io.emit("chat-message", {
        room,
        fromId: sender.id,
        fromNome: sender.nome,
        message: trimmed,
        at: Date.now(),
      });
    });

    // Zera o histórico do chat de uma sala — só quem tem permissão (dono
    // da sala pessoal, ou admin nas salas comuns) via canClearChat.
    socket.on("clear-chat", ({ room }) => {
      const senderId = socketUsers.get(socket.id);
      const sender = onlineUsers[senderId];

      if (!sender || typeof room !== "string") {
        return;
      }

      if (!canClearChat(senderId, room)) {
        socket.emit("chat-clear-denied");
        return;
      }

      io.emit("chat-cleared", { room });
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
    // sala de quem está convidando. Se for a própria sala pessoal de quem
    // convida e ela estiver trancada, o convite já libera a entrada
    // (equivalente a "eu chamar" no controle de acesso) — só funciona
    // assim quando quem convida É o dono da sala, senão um convidado
    // qualquer poderia usar o convite pra driblar a trava de outra pessoa.
    socket.on("invite-to-room", ({ to, room }) => {
      const senderId = socketUsers.get(socket.id);
      const sender = onlineUsers[senderId];
      const target = onlineUsers[to];

      if (!sender || !target || !room) {
        return;
      }

      const ownerId = getPersonalRoomOwnerId(room);

      if (ownerId && ownerId === senderId) {
        const allowed =
          allowedGuests.get(room) ?? new Set();

        allowed.add(to);
        allowedGuests.set(room, allowed);
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
            userId: getUserBySocketId(socketId)?.id,
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
        userId: joiner?.id,
        nome: joiner?.nome,
      });

      console.log("Entrou na chamada:", room, socket.id);
    });

    socket.on("leave-meeting", () => {
      leaveCurrentCall(socket);
    });

    // Avisa explicitamente quem está na chamada que o compartilhamento de
    // tela acabou — sem isso, o card da tela compartilhada dependia só do
    // navegador detectar a falta de vídeo (replaceTrack(null) -> mute),
    // que não é tão imediato/confiável quanto avisar direto pelo socket.
    socket.on("screen-share-stopped", () => {
      const callKey = socketCallRoom.get(socket.id);

      if (!callKey) {
        return;
      }

      socket.to(callKey).emit("screen-share-stopped", {
        socketId: socket.id,
      });
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
