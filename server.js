import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Set this to your frontend URL in production
      methods: ["GET", "POST"]
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

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
