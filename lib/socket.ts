import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      path: "/api/socket",
      autoConnect: false,
    });
  }
  const socketName = typeof window !== "undefined" ? localStorage.getItem("fyp_username") || "Anonymous" : "Anonymous";
  socketInstance.io.opts.query = { name: socketName };
  return socketInstance;
};
