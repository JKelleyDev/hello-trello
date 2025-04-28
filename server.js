import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = undefined;
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const nextHandler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    nextHandler(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("cardCreated", () => {
      console.log("cardCreated received");
      socket.broadcast.emit("cardCreated");
    });

    socket.on("cardDeleted", () => {
      console.log("cardDeleted received");
      socket.broadcast.emit("cardDeleted");
    });

    socket.on("cardMoved", () => {
      console.log("cardMoved received");
      socket.broadcast.emit("cardMoved");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
