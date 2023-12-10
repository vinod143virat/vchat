const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// global.onlineUsers = new Map();
// io.on("connection", (socket) => {
//   global.chatSocket = socket;
//   socket.on("add-user", (userId) => {
//     onlineUsers.set(userId, socket.id);
//     // send all active users to new user
//     io.emit("get-users", onlineUsers);
//   });


global.onlineUsers = [];

io.on("connection", (socket) => {
  global.chatSocket = socket;


  // add new user
  socket.on("add-user", (newUserId) => {
    if (!onlineUsers.some((user) => user.userId === newUserId)) {  
      // if user is not added before
      onlineUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("new user is here!", onlineUsers);
    }
    // send all active users to new user
    io.emit("get-users", onlineUsers);
  });
  
  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
    console.log("user disconnected", onlineUsers);
    // send all online users to all users
    io.emit("get-users", onlineUsers);
  });
  
  socket.on("offline", () => {
    // remove user from active users
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id)
    console.log("user is offline", onlineUsers);
    // send all online users to all users
    io.emit("get-users", onlineUsers);
  });


  socket.on("send-msg", (data) => {
    const sendUser = onlineUsers.find(user => user.userId === data.to);
    if (sendUser) {
      io.to(sendUser.socketId).emit("msg-recieve", data.msg);
    }
  });
});
