import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("cardCreated", (data) => {
      socket.broadcast.emit("cardCreated", data);
    });

    socket.on("cardDeleted", (data) => {
      socket.broadcast.emit("cardDeleted", data);
    });

    socket.on("cardUpdated", (data) => {
      socket.broadcast.emit("cardUpdated", data);
    });

    socket.on("cardMoved", (data) => {
      socket.broadcast.emit("cardMoved", data);
    });

    socket.on("boardCreated", (data) => {
      socket.broadcast.emit("boardCreated", data);
    });

    socket.on("userInvited", (data) => {
      socket.broadcast.emit("userInvited", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
