import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = undefined; 
const port = process.env.PORT || 3000;
const app = next({ dev, hostname, port });
const nextHandler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer();

  // Create and attach Socket.IO server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Set this to your frontend URL in production
      methods: ["GET", "POST"],
    },
  });

  // Handle socket events
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

  // Handle HTTP requests
  httpServer.on("request", (req, res) => {
    if (req.url?.startsWith("/socket.io")) {
      // Let socket.io handle socket.io requests
      io.engine.handleRequest(req, res);
    } else {
      // Let Next.js handle everything else
      nextHandler(req, res);
    }
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
