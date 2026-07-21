const { createServer } = require("http");
const { createHmac, timingSafeEqual } = require("crypto");
const next = require("next");
const { Server } = require("socket.io");

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

        io.emit("presence-update", Object.values(onlineUsers));

        console.log("Mudou de sala:", onlineUsers[userId].nome, room);
      }
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

    // Sinalização WebRTC em malha: cada par de participantes negocia sua
    // própria conexão, endereçada pelo socket id de destino (`to`), em vez
    // de transmitir para toda a sala — permite mais de 2 participantes.
    socket.on("join-meeting", () => {
      const existingRoom =
        io.sockets.adapter.rooms.get("meeting-room");

      const existingParticipants = existingRoom
        ? Array.from(existingRoom)
        : [];

      socket.join("meeting-room");

      socket.emit(
        "existing-participants",
        existingParticipants
      );

      socket.to("meeting-room").emit("user-joined-meeting", {
        socketId: socket.id,
      });

      console.log("Entrou na reunião:", socket.id);
    });

    socket.on("leave-meeting", () => {
      socket.leave("meeting-room");

      socket.to("meeting-room").emit("user-left-meeting", {
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
      if (socket.rooms.has("meeting-room")) {
        socket.to("meeting-room").emit("user-left-meeting", {
          socketId: socket.id,
        });
      }
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
