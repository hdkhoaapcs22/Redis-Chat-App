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
  let onlineUsers = [];

  io.on("connection", (socket) => {

    //add new user
    socket.on('addNewUser', (kindeUser) => {
      kindeUser && !onlineUsers
      .some(user => user?.userId === kindeUser.id) && onlineUsers.push({
        userId: kindeUser.id,
        socketId: socket.id,
        profile: kindeUser
      });

      // send active user
      socket.emit("getUsers", onlineUsers);
    })

    // remove disconnect user from onlineUsers list
    socket.on("disconnect", () => {
      onlineUsers = onlineUsers.filter(user => user.socketId !== socket.id),

      // send active users
      io.emit("getUsers", onlineUsers)
    })
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