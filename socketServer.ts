import { Server as SocketIOServer } from "socket.io";
import http from "http";

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server);

  io.on("connetction", (socket) => {
    console.log("A user is connected!");

    socket.on("notification", (data: any) => {
      io.emit("newNotification", data);
    });
    socket.on("disconnect", () => {
      console.log("A user disconnected!");
    });
  });
};
