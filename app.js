import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const roomUsers = {};

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User ${socket.id} connected`);

  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    if (!roomUsers[roomName]) {
      roomUsers[roomName] = [];
    }
    roomUsers[roomName].push(socket.id);

    console.log(`User ${socket.id} joined room ${roomName}`);
    io.to(roomName).emit(
      "joined_Successfully",
      `User ${socket.id} has joined the room`
    );
    // Emit the updated user list to the room
    io.to(roomName).emit("UsersInRoom", roomUsers[roomName]);
  });

  socket.on("code_change", (data) => {
    socket.to(data.room).emit("Code_changing", {
      code: data.input,
    });
  });

  socket.on("cursor_track", (data) => {
    console.log(data);
    socket.to(data.room).emit("cursor_changing", data.cursor);
  });

  socket.on("disconnect", () => {
    for (const roomName in roomUsers) {
      const userIndex = roomUsers[roomName].indexOf(socket.id);
      if (userIndex !== -1) {
        roomUsers[roomName].splice(userIndex, 1);
        io.to(roomName).emit("UsersInRoom", roomUsers[roomName]);
        break;
      }
    }
  });
});

app.get("/", (req, res) => {
  res.send("hi");
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
