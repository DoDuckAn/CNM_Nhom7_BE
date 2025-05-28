const express = require("express");
require("dotenv").config();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const messageTypeRoutes = require("./routes/messageTypeRoutes");
const messageRoutes = require("./routes/messageRoutes");
const groupRoutes = require("./routes/groupRoutes");
const authRoutes = require("./routes/authRoutes");
const OTPCodeRoutes = require("./routes/OTPRoute");
const MessageController = require("./controllers/messageController");
const GroupController = require("./controllers/groupController");
const fs = require("fs");
const path = require("path");
const UserModel = require("./models/User");
const MemberModel = require("./models/Member");
const MessageModel = require("./models/Message");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8, // 100MB cho Socket.io
  pingTimeout: 60000,
});

app.use("/uploads", express.static("D:\\CNM\\uploads"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", userRoutes);
app.use("/api/messageType", messageTypeRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/OTP", OTPCodeRoutes);

// Map để lưu sessionID và socket.id của web client đang chờ login
const qrSessions = new Map();

const userSocketMap = new Map(); // userID → socket.id

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  // Cho phép kết nối không cần token (dành cho QR login)
  if (!token) {
    socket.user = null; // Gắn user null nếu không xác thực
    return next();
  }

  // Nếu có token thì xác thực như bình thường
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) {
      console.log("invalid token");
      return next(new Error("Invalid token"));
    }
    socket.user = user;
    next();
  });
});

io.on("connection", async (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("joinUserRoom", (userID) => {
    socket.join(userID);
    console.log(`User ${userID} joined personal room: ${userID}`);
  });

  // Khi client yêu cầu socket join room with groupID
  socket.on("joinGroupRoom", (groupID) => {
    socket.join(groupID);
    console.log(`Socket ${socket.id} joined group room: ${groupID}`);
  });

  socket.on("sendMessage", async (message, callback) => {
    console.log("Send message called");
    try {
      const {
        senderID,
        receiverID,
        groupID,
        messageTypeID,
        context,
        messageID,
        file,
      } = message;

      // Kiểm tra tin nhắn đã tồn tại chưa
      const checkMessageID = await MessageModel.getMessageByID(messageID);
      if (checkMessageID) {
        console.log("Tin nhắn buffer đã tồn tại:", messageID);
        if (callback) callback("Tin nhắn đã tồn tại");
        return;
      }

      let filePath = null;

      // Xử lý file (giữ nguyên logic cũ)
      if (file) {
        if (file.data.length > 100 * 1024 * 1024) {
          console.log("File quá lớn:", file.name);
          if (callback) callback("File quá lớn! Giới hạn 100MB.");
          return;
        }
        const uploadDir = "D:\\CNM\\uploads";
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const buffer = Buffer.from(file.data, "base64");
        const fileName = `${Date.now()}-${file.name}`;
        filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
      }

      let newMessage;

      // Trường hợp chat đơn
      if (!groupID) {
        const sender = await UserModel.GetUserByID(senderID);
        const receiver = await UserModel.GetUserByID(receiverID);
        if (!sender || !receiver) {
          console.log("Sender or receiver not found:", {
            senderID,
            receiverID,
          });
          if (callback) callback("User không tồn tại");
          return;
        }
        if (!sender.conversationsID?.includes(receiverID)) {
          sender.conversationsID = [
            ...(sender.conversationsID || []),
            receiverID,
          ];
          await UserModel.UpdateUser(senderID, sender.phoneNumber, {
            conversationsID: sender.conversationsID,
          });
          receiver.conversationsID = [
            ...(receiver.conversationsID || []),
            senderID,
          ];
          await UserModel.UpdateUser(receiverID, receiver.phoneNumber, {
            conversationsID: receiver.conversationsID,
          });
        }

        newMessage = await MessageController.saveMessage(
          senderID,
          receiverID,
          groupID || "NONE",
          messageTypeID,
          context,
          messageID,
          filePath
        );
        if (!newMessage) {
          console.log("Lưu tin nhắn chat đơn thất bại:", {
            messageID,
          });
          if (callback) callback("Lỗi lưu tin nhắn");
          return;
        }
        console.log("Đã lưu mess chat đơn, emit lại:", newMessage);
        // Gửi đến cả phòng cá nhân của sender và receiver
        io.to(senderID).to(receiverID).emit("receiveMessage", newMessage);
        if (callback) callback("Đã nhận");
      }
      // Trường hợp chat nhóm
      else {
        newMessage = await MessageController.saveMessage(
          senderID,
          receiverID || "NONE",
          groupID,
          messageTypeID,
          context,
          messageID,
          filePath
        );
        if (!newMessage) {
          console.log("Lưu tin nhắn chat nhóm thất bại:", {
            messageID,
          });
          if (callback) callback("Lỗi lưu tin nhắn");
          return;
        }
        console.log("Đã lưu mess chat nhóm, emit lại:", newMessage);
        // Gửi đến phòng nhóm
        io.to(groupID).emit("receiveMessage", newMessage);
        if (callback) callback("Đã nhận");
      }
    } catch (error) {
      console.log("Lỗi khi socket.on sendMessage:", error.message, error.stack);
      if (callback) callback("Lỗi server");
    }
  });

  socket.on("shareMessage", async (messageData, callback) => {
    try {
      const { messageID, sharerID, receiverID, groupID } = messageData;

      if (!messageID || !sharerID) {
        console.log("Thiếu messageID hoặc sharerID");
        if (callback) callback("Thiếu thông tin messageID hoặc sharerID");
        return;
      }

      const sharedMessage = await MessageModel.getMessageByID(messageID);
      if (!sharedMessage) {
        console.log("Không tìm thấy tin nhắn cần chuyển tiếp");
        if (callback) callback("Không tìm thấy tin nhắn cần chuyển tiếp");
        return;
      }

      if (!receiverID && !groupID) {
        console.log("Thiếu receiverID hoặc groupID");
        if (callback) callback("Thiếu thông tin receiverID hoặc groupID");
        return;
      }

      let newMessage;
      let newMessageID = `${messageID}-share-${sharerID}-${Date.now()}`; //tạo messageID mới
      //trường hợp chuyển tiếp tin nhắn vào chat đơn
      if (receiverID && !groupID) {
        newMessage = await MessageController.saveMessage(
          sharerID, //senderID giờ là sharerID,ID của người chuyển tiếp tin nhắn
          receiverID,
          groupID || "NONE",
          sharedMessage.messageTypeID,
          sharedMessage.context,
          newMessageID,
          null
        );
        if (!newMessage) {
          console.log("Chuyển tiếp tin nhắn vào chat đơn thất bại:", {
            newMessageID,
          });
          if (callback) callback("Lỗi chuyển tiếp tin nhắn");
          return;
        }
        console.log(
          "Đã chuyển tiếp tin nhắn vào chat đơn, emit lại:",
          newMessage
        );
        // Gửi đến cả phòng cá nhân của sharer và receiver
        io.to(sharerID).to(receiverID).emit("receiveMessage", newMessage);
        if (callback) callback("Đã nhận");
      }
      // Trường hợp chat nhóm
      else if (groupID) {
        newMessage = await MessageController.saveMessage(
          sharerID, //senderID giờ là sharerID,ID của người chuyển tiếp tin nhắn
          receiverID || "NONE",
          groupID,
          sharedMessage.messageTypeID,
          sharedMessage.context,
          newMessageID,
          null
        );
        if (!newMessage) {
          console.log("Chuyển tiếp tin nhắn vào chat nhóm thất bại:", {
            messageID,
          });
          if (callback) callback("Lỗi chuyển tiếp tin nhắn");
          return;
        }
        console.log(
          "Đã chuyển tiếp tin nhắn vào chat nhóm, emit lại:",
          newMessage
        );
        // Gửi đến phòng nhóm
        io.to(groupID).emit("receiveMessage", newMessage);
        if (callback) callback("Đã nhận");
      }
    } catch (error) {
      console.log(
        "Lỗi khi socket.on shareMessage:",
        error.message,
        error.stack
      );
      if (callback) callback("Lỗi server");
    }
  });

  socket.on("seenMessage", async (messageID, seenUserID, callback) => {
    try {
      const message = await MessageModel.getMessageByID(messageID);
      if (!message) {
        console.log("không tìm thấy tin nhắn");
        callback("không tìm thấy tin nhắn");
        return;
      }

      if (message.seenStatus.includes(seenUserID)) {
        console.log("seenUserID đã tồn tại trong seenStatus");
        if (callback) callback("seenUserID đã tồn tại trong seenStatus");
        return;
      }

      const newSeenStatus = [...message.seenStatus, seenUserID];
      await MessageModel.updateMessage(messageID, {
        seenStatus: newSeenStatus,
      });

      const isSingleChat = !message.groupID || message.groupID === "NONE";
      if (isSingleChat) {
        console.log(
          "Emit updateSingleChatSeenStatus to:",
          message.senderID,
          message.receiverID
        );
        io.to(message.senderID)
          .to(message.receiverID)
          .emit("updateSingleChatSeenStatus", messageID); // Chỉ gửi messageID
        if (callback) callback("Đã cập nhật seenStatus chat đơn");
      } else {
        console.log("Emit updateGroupChatSeenStatus to:", message.groupID);
        io.to(message.groupID).emit(
          "updateGroupChatSeenStatus",
          messageID,
          seenUserID
        );
        if (callback) callback("Đã cập nhật seenStatus chat nhóm");
      }
    } catch (error) {
      console.log("Lỗi khi on seenMessage:", error);
      if (callback) callback("Lỗi server khi cập nhật seenStatus");
    }
  });

  socket.on("deleteMessage", async (messageID, userID, callback) => {
    try {
      const message = await MessageModel.getMessageByID(messageID);
      if (!message) {
        console.log("Không tìm thấy tin nhắn");
        if (callback) callback("Không tìm thấy tin nhắn");
        return;
      }

      if (message.deleteStatusByUser.includes(userID)) {
        if (callback) callback("Tin nhắn đã bị xóa trước đó");
        return;
      }

      await MessageModel.updateMessage(messageID, {
        deleteStatusByUser: [...message.deleteStatusByUser, userID],
      });

      if (message.groupID && message.groupID !== "NONE") {
        io.to(userID).emit("deletedGroupMessage", messageID);
      } else {
        io.to(userID).emit("deletedSingleMessage", messageID);
      }

      if (callback) callback("Đã xóa tin nhắn thành công");
    } catch (error) {
      console.error("Lỗi khi xử lý deleteMessage:", error);
      if (callback) callback("Lỗi server khi xóa tin nhắn");
    }
  });

  socket.on("recallMessage", async (messageID, userID, callback) => {
    try {
      const message = await MessageModel.getMessageByID(messageID);
      if (!message) {
        console.log("Không tìm thấy tin nhắn");
        if (callback) callback("Không tìm thấy tin nhắn");
        return;
      }

      if (message.senderID !== userID) {
        console.log("Người dùng không có quyền thu hồi tin nhắn");
        if (callback) callback("Bạn không có quyền thu hồi tin nhắn này");
        return;
      }

      await MessageModel.RecallMessage(messageID);

      if (message.groupID && message.groupID !== "NONE") {
        io.to(message.groupID).emit("recalledGroupMessage", messageID);
      } else {
        io.to(message.senderID)
          .to(message.receiverID)
          .emit("recalledSingleMessage", messageID);
      }

      if (callback) callback("Thu hồi tin nhắn thành công");
    } catch (error) {
      console.error("Lỗi khi xử lý recallMessage:", error);
      if (callback) callback("Lỗi server khi thu hồi tin nhắn");
    }
  });

  socket.on("joinGroup", async (userID, groupID, callback) => {
    console.log("joinGroup request", { userID, groupID });
    const joinStatus = await GroupController.joinGroup(userID, groupID);
    if (joinStatus !== true) {
      if (callback) callback(joinStatus);
      return;
    }

    socket.join(groupID);
    //gui thong tin user
    io.to(groupID).emit("newMember", userID);
    if (callback) callback("Tham gia nhóm thành công");
  });

  //them vao nhom
  socket.on("addGroupMember", async (userID, groupID, callback) => {
    const addStatus = await GroupController.joinGroup(userID, groupID);
    if (addStatus !== true) {
      if (callback) callback(addStatus);
      return;
    }

    socket.join(groupID);
    socket.join(userID); // Đảm bảo socket cũng join vào phòng cá nhân của user
    io.to(userID).emit("newMember", userID);
    io.to(groupID).emit("newMember", userID);
    if (callback) callback("Thêm thành viên thành công");
  });

  socket.on("leaveGroup", async (userID, groupID, callback) => {
    const leaveStatus = await GroupController.leaveGroup(userID, groupID);
    if (leaveStatus !== true) {
      if (callback) callback(leaveStatus);
      return;
    }

    socket.leave(groupID);
    io.to(groupID).emit("memberLeft", userID);
    if (callback) callback("Rời nhóm thành công");
  });

  socket.on("kickMember", async (leaderID, userID, groupID, callback) => {
    const leader = await MemberModel.findByUserAndGroup(leaderID, groupID);
    if (!leader || leader.memberRole !== "LEADER") {
      if (callback) callback("Bạn không có quyền kick thành viên");
      return;
    }

    const kickStatus = await GroupController.kickMember(userID, groupID);
    if (kickStatus !== true) {
      if (callback) callback(kickStatus);
      return;
    }

    io.to(groupID).emit("forceLeaveGroup", userID, groupID);
    if (callback) callback("kick thành công");
  });

  socket.on("deleteGroup", async (userID, groupID, callback) => {
    const leader = await MemberModel.findByUserAndGroup(userID, groupID);
    if (!leader || leader.memberRole !== "LEADER") {
      if (callback) callback("Bạn không có quyền xóa group");
      return;
    }

    const deleteStatus = await GroupController.deleteGroup(groupID);
    if (deleteStatus !== true) {
      if (callback) callback(deleteStatus);
      return;
    }

    io.to(groupID).emit("groupDeleted", groupID);
    if (callback) callback("xóa nhóm thành công");
  });

  socket.on("renameGroup", async (groupID, newGroupName, callback) => {
    try {
      const renameStatus = await GroupController.renameGroup(
        groupID,
        newGroupName
      );
      if (renameStatus !== true) {
        if (callback) callback(renameStatus);
        return;
      }

      // Phát sự kiện để tất cả thành viên trong nhóm biết tên nhóm đã thay đổi
      io.to(groupID).emit("groupRenamed", { groupID, newGroupName });

      if (callback) callback("Đổi tên nhóm thành công");
    } catch (error) {
      console.error("Lỗi khi đổi tên nhóm:", error);
      if (callback) callback("Lỗi server khi đổi tên nhóm");
    }
  });

  socket.on("switchRole", async (userID, targetUserID, groupID, callback) => {
    try {
      const switchRoleStatus = await GroupController.switchRoleInGroup(
        userID,
        targetUserID,
        groupID
      );

      if (switchRoleStatus !== true) {
        if (callback) callback(switchRoleStatus);
        return;
      }

      // Phát sự kiện để tất cả thành viên trong nhóm biết có sự thay đổi vai trò
      io.to(groupID).emit("roleSwitched", {
        userID,
        targetUserID,
        groupID,
      });

      if (callback) callback("Thay đổi quyền LEADER thành công");
    } catch (error) {
      console.error("Lỗi khi thay đổi quyền LEADER:", error);
      if (callback) callback("Lỗi server khi thay đổi quyền LEADER");
    }
  });

  // Web gửi sessionID khi render QR
  socket.on("qr-session", ({ sessionID }) => {
    // Ghi sessionID mới cho socket
    qrSessions.set(socket.id, sessionID);
    console.log(`📲 QR session set: ${socket.id} → ${sessionID}`);
  });

  // App gửi thông tin đăng nhập sau khi quét QR
  socket.on("qr-login", ({ sessionID, accessToken, refreshToken, user }) => {
    // Tìm socketID tương ứng với sessionID
    const targetSocketID = [...qrSessions.entries()].find(
      ([_, sID]) => sID === sessionID
    )?.[0];

    if (targetSocketID) {
      io.to(targetSocketID).emit("qr-authenticated", {
        accessToken,
        refreshToken,
        user,
      });
      console.log(`✅ Sent tokens to web session ${sessionID}`);

      qrSessions.delete(targetSocketID); // cleanup sau khi đăng nhập xong
    } else {
      console.log(`❌ Invalid or expired session: ${sessionID}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id} - Reason: ${reason}`);
    const sessionID = qrSessions.get(socket.id);
    if (sessionID) {
      qrSessions.delete(socket.id);
      console.log(`🗑️ Cleaned session ${sessionID} for socket ${socket.id}`);
    }
  });

  if (!socket.recovered) {
    try {
      socket.emit("reloadMessage");
    } catch (err) {
      console.log("lỗi khi emit reloadMessage:", err);
    }
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
