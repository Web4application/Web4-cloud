import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export const subscribeToTaskUpdates = (callback: (tasks: any) => void) => {
  socket.on("taskUpdates", callback);
};

export const disconnectSocket = () => {
  socket.disconnect();
};
