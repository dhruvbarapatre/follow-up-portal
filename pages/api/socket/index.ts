import { Server } from "socket.io";
import type { NextApiRequest } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Persistent online registry across Hot Reloads
const onlineUsers = (global as any).onlineUsers || new Map<string, Set<string>>();
(global as any).onlineUsers = onlineUsers;

export default function SocketHandler(req: NextApiRequest, res: any) {
  if (res.socket.server.io) {
    console.log("Socket is already running");
    // Ensure new connection gets initial list
    const io = res.socket.server.io;
  } else {
    console.log("Socket is initializing");
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    res.socket.server.io = io;
  }

  const io = res.socket.server.io;

  // Set up listeners (only once, if they aren't already set up)
  // Wait, Next.js dev hot reload re-runs SocketHandler, but res.socket.server.io might already be set up.
  // To prevent multiple listener registration, we can check if we've already attached our connection listeners.
  if (!res.socket.server.io.listeners("connection").length) {
    io.on("connection", (socket: any) => {
      const socketName = socket.handshake.query.name || "Anonymous";
      console.log(`Client connected: ${socketName} (ID: ${socket.id})`);

      if (socketName && socketName !== "Anonymous") {
        if (!onlineUsers.has(socketName)) {
          onlineUsers.set(socketName, new Set());
        }
        onlineUsers.get(socketName).add(socket.id);
        io.emit("online-users-list", Array.from(onlineUsers.keys()));
      } else {
        // Emit current online users to Anonymous connections too
        socket.emit("online-users-list", Array.from(onlineUsers.keys()));
      }

      socket.on("calling-start", (data: any) => {
        console.log("calling-start received:", data);
        socket.broadcast.emit("calling-start", data);
      });

      socket.on("calling-stop", (data: any) => {
        console.log("calling-stop received:", data);
        socket.broadcast.emit("calling-stop", data);
      });

      socket.on("customer-update", (data: any) => {
        console.log("customer-update received:", data);
        socket.broadcast.emit("customer-update", data);
      });

      socket.on("attendance-update", (data: any) => {
        console.log("attendance-update received:", data);
        socket.broadcast.emit("attendance-update", data);
      });

      socket.on("new-notification", (data: any) => {
        console.log("new-notification received:", data);
        socket.broadcast.emit("new-notification", data);
      });

      socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socketName} (ID: ${socket.id})`);
        if (socketName && socketName !== "Anonymous" && onlineUsers.has(socketName)) {
          const socketIds = onlineUsers.get(socketName);
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            onlineUsers.delete(socketName);
          }
          io.emit("online-users-list", Array.from(onlineUsers.keys()));
        }
      });
    });
  }
  res.end();
}
