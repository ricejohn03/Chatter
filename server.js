const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  UserJoin,
  getCurrentUser,
  getRoomUsers,
  userLeave,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set Static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Chatter Bot";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = UserJoin(socket.id, username, room);

    socket.join(user.room);
    console.log(socket.id);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to Chatter!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and Room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });

    // Runs when user disconnects
    socket.on("disconnect", () => {
      const user = userLeave(socket.id);
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );

        // Send users and Room info
        io.to(user.room).emit("roomuser", {
          room: user.room,
          users: getRoomUsers(user.room),
        });
      }
    });

    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      const user = getCurrentUser(socket.id);
      console.log(msg);
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
