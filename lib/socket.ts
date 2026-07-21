import { io } from "socket.io-client";

let socket: ReturnType<
  typeof io
> | null = null;

export function getSocket() {

  if (!socket) {

    socket = io(
      typeof window === "undefined"
        ? undefined
        : window.location.origin
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Falha ao conectar ao servidor em tempo real:",
          error.message
        );
      }
    );

  }

  return socket;
}