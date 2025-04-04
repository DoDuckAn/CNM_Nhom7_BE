# Socket Documentation

## **1. Kết nối với Socket Server**
```javascript
import { io } from "socket.io-client";

const socket = io("http://your-server-url");

socket.on("connect", () => {
    console.log("Connected to server", socket.id);
});
```

---

## **2. Sự kiện Socket**

### **2.1. Tham gia phòng cá nhân**
- **Sự kiện:** `joinUserRoom`
- **Mô tả:** Người dùng sẽ tham gia vào phòng riêng của họ để nhận tin nhắn cá nhân.
- **Client gửi:**
```javascript
socket.emit("joinUserRoom", userID);
```
- **Server xử lý:**
```javascript
socket.on("joinUserRoom", (userID) => {
    socket.join(userID);
    console.log(`User ${userID} joined personal room: ${userID}`);
});
```

---

### **2.2. Gửi tin nhắn**
- **Sự kiện:** `sendMessage`
- **Mô tả:** Gửi tin nhắn từ người dùng A đến người dùng B hoặc nhóm.
- **Client gửi:**
```javascript
const message = {
    senderID: "userA",
    receiverID: "userB", // hoặc null nếu là tin nhắn nhóm
    groupID: null, // Nếu gửi tin nhắn nhóm, truyền groupID
    messageTypeID: "type1", // Loại tin nhắn, nếu là file thì kèm theo file
    context: "Xin chào!", // Nội dung tin nhắn, nếu gửi file thì server sẽ lưu link cloudinary của file vào context
    messageID: "unique_message_id", // ID duy nhất của tin nhắn
    file: {
        name: "image.png", // Tên file
        data: "iVBORw0KGgoAAAANSUhEUg...", // File dưới dạng base64
    }
};

socket.emit("sendMessage", message, (response) => {
    console.log("Server response:", response);
});
```
**Lưu ý:**
- File gửi lên phải ở dạng **base64**(chỗ file.data)
- Nếu file quá lớn (>100MB), server sẽ từ chối xử lý.

- **Server xử lý:**
```javascript
socket.on("sendMessage", async (message, callback) => {
    try {
        const { senderID, receiverID, groupID, messageTypeID, context, messageID, file } = message;

        // Kiểm tra tin nhắn đã tồn tại chưa
        const checkMessageID = await Message.findOne({ messageID });
        if (checkMessageID) {
            if (callback) callback("Tin nhắn đã tồn tại");
            return;
        }

        let filePath = null;
        
        // Nếu có file trong tin nhắn
        if (file) {
            // Kiểm tra file có quá lớn không
            if (file.data.length > 100 * 1024 * 1024) {
                if (callback) return callback({ status: "error", message: "File quá lớn! Giới hạn 100MB." });
                return;
            }

            // Tạo thư mục lưu trữ file nếu chưa tồn tại
            const uploadDir = "C:\\Users\\Windows\\Desktop\\uploads"; // Thay đổi đường dẫn theo hệ thống của bạn
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Chuyển đổi file từ Base64 thành Buffer
            const buffer = Buffer.from(file.data, "base64");
            const fileName = `${Date.now()}-${file.name}`;
            filePath = path.join(uploadDir, fileName);
            
            // Ghi file vào thư mục uploads
            fs.writeFileSync(filePath, buffer);
        }

        let newMessage;

        if (!groupID) {
            // Trường hợp chat đơn
            const sender = await User.findOne({ userID: senderID });
            const receiver = await User.findOne({ userID: receiverID });
            if (!sender.conversationsID.includes(receiverID)) {
                sender.conversationsID.push(receiverID);
                receiver.conversationsID.push(senderID);
                await sender.save();
                await receiver.save();
            }
            newMessage = await MessageController.saveMessage(senderID, receiverID, groupID, messageTypeID, context, messageID, filePath);
            io.to(senderID).to(receiverID).emit("receiveMessage", newMessage);
        } else {
            // Trường hợp chat nhóm
            newMessage = await MessageController.saveMessage(senderID, receiverID, groupID, messageTypeID, context, messageID, filePath);
            io.to(groupID).emit("receiveMessage", newMessage);
        }

        if (callback) callback("Đã nhận");
    } catch (error) {
        console.log("Lỗi khi gửi tin nhắn:", error);
    }
});
```

---

### **2.3. Nhận tin nhắn**
- **Sự kiện:** `receiveTextMessage`
- **Mô tả:** Nhận tin nhắn từ server.
- **Client lắng nghe:**
```javascript
socket.on("receiveTextMessage", (message) => {
    console.log("Tin nhắn nhận được:", message);
});
```

---

### **2.4. Đánh dấu tin nhắn đã đọc**
- **Sự kiện:** `seenMessage`
- **Mô tả:** Khi người dùng xem tin nhắn, sự kiện này sẽ được gửi lên server để cập nhật trạng thái đã đọc
- **Gợi ý:** khi vào trong chatbox, lúc fetch data tin nhắn thì có thể emit sự kiện này cho các tin nhắn mà seenStatus chưa có userID đang seen
- **Client gửi:**
```javascript
socket.emit("seenMessage", messageID, seenUserID, (response) => {
    console.log("Server response:", response);
});
```
- **Server xử lý:**
```javascript
socket.on("seenMessage", async (messageID, seenUserID, callback) => {
    try {
        const message = await Message.findOne({ messageID });
        if (!message) {
            console.log("không tìm thấy tin nhắn");
            callback("không tìm thấy tin nhắn");
            return;
        }

        if (message.seenStatus.includes(seenUserID)) {
            console.log("User đã tồn tại trong seenStatus");
            callback("User đã tồn tại trong seenStatus");
            return;
        }

        // Cập nhật trạng thái đã xem
        message.seenStatus.push(seenUserID);
        await message.save();

        // Phát sự kiện cập nhật UI
        if (!message.groupID) {
            io.to(message.senderID).to(seenUserID).emit("updateSingleChatSeenStatus", messageID);
            callback("Đã cập nhật seenStatus chat đơn");
        } else {
            io.to(message.groupID).emit("updateGroupChatSeenStatus", messageID, seenUserID);
            callback("Đã cập nhật seenStatus chat nhóm");
        }
    } catch (error) {
        console.log("Lỗi khi xử lý seenMessage:", error);
    }
});
```
- **Client lắng nghe sự kiện cập nhật UI:**
```javascript
socket.on("updateSingleChatSeenStatus", (messageID) => {
    console.log("Tin nhắn đã được đọc:", messageID);
    // Cập nhật giao diện tin nhắn
});

socket.on("updateGroupChatSeenStatus", (messageID, seenUserID) => {
    console.log(`User ${seenUserID} đã đọc tin nhắn:`, messageID);
    // Cập nhật giao diện tin nhắn nhóm
});
```

---

### **2.5. Xử lý mất kết nối và tải lại tin nhắn**
- **Sự kiện:** `reloadMessage`
- **Mô tả:** Khi client bị mất kết nối, server sẽ yêu cầu client tải lại tin nhắn.
- **Client lắng nghe:**
```javascript
socket.on("reloadMessage", () => {
    console.log("Server yêu cầu tải lại tin nhắn");
    // Gọi API để tải lại tin nhắn nếu cần
});
```
- **Server xử lý:**
```javascript
if (!socket.recovered) {
    socket.emit("reloadMessage");
}
```

---

### **2.6. Ngắt kết nối**
- **Sự kiện:** `disconnect`
- **Mô tả:** Khi người dùng thoát ứng dụng hoặc mất kết nối.
- **Client lắng nghe:**
```javascript
socket.on("disconnect", () => {
    console.log("Ngắt kết nối từ server");
});
```
- **Server xử lý:**
```javascript
socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
});
```

---

### **2.7. Tham gia nhóm**
- **Sự kiện:** `joinGroup`
- **Mô tả:** Người dùng tham gia vào nhóm bằng `groupID`.
- **Client gửi:**
```javascript
socket.emit("joinGroup", userID, groupID, (response) => {
    console.log("Server response:", response);
});
```
- **Client lắng nghe:**
```javascript
socket.on("newMember", (userID) => {
    console.log("Thành viên mới tham gia:", userID);
});
```
- **Server xử lý:**
```javascript
socket.on("joinGroup", async (userID, groupID, callback) => {
    const joinStatus = await GroupController.joinGroup(userID, groupID);
    if (joinStatus !== true) {
        if (callback) callback(joinStatus);
        return;
    }
    socket.join(groupID);
    io.to(groupID).emit("newMember", userID);
    if (callback) callback("Tham gia nhóm thành công");
});
```

---

### **2.8. Thêm thành viên vào nhóm**
- **Sự kiện:** `addGroupMember`
- **Mô tả:** Thêm một người dùng mới vào nhóm.
- **Client gửi:**
```javascript
socket.emit("addGroupMember", userID, groupID, (response) => {
    console.log("Server response:", response);
});
```
- **Client lắng nghe:**
```javascript
socket.on("newMember", (userID) => {
    console.log("Thành viên mới được thêm:", userID);
});
```
- **Server xử lý:**
```javascript
socket.on("addGroupMember", async (userID, groupID, callback) => {
    const addStatus = await GroupController.joinGroup(userID, groupID);
    if (addStatus !== true) {
        if (callback) callback(addStatus);
        return;
    }
    socket.join(groupID);
    io.to(groupID).emit("newMember", userID);
    if (callback) callback("Thêm thành viên thành công");
});
```

---

### **2.9. Rời nhóm**
- **Sự kiện:** `leaveGroup`
- **Mô tả:** Người dùng rời khỏi nhóm.
- **Client gửi:**
```javascript
socket.emit("leaveGroup", userID, groupID, (response) => {
    console.log("Server response:", response);
});
```
- **Client lắng nghe:**
```javascript
socket.on("memberLeft", (userID) => {
    console.log("Thành viên rời nhóm:", userID);
});
```
- **Server xử lý:**
```javascript
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
```

---

### **2.10. Kick thành viên khỏi nhóm**
- **Sự kiện:** `kickMember`
- **Mô tả:** Leader có quyền kick thành viên khỏi nhóm.
- **Client gửi:**
```javascript
socket.emit("kickMember", leaderID, userID, groupID, (response) => {
    console.log("Server response:", response);
});
```
- **Client lắng nghe:**
```javascript
socket.on("forceLeaveGroup", (userID, groupID) => {
    if (currentUserID === userID) {
        socket.leave(groupID);
        console.log("Bạn đã bị kick khỏi nhóm");
    } else {
        console.log("Thành viên bị kick:", userID);
    }
});
```
- **Server xử lý:**
```javascript
socket.on("kickMember", async (leaderID, userID, groupID, callback) => {
    const leader = await Member.findOne({ userID: leaderID, groupID });
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
    if (callback) callback("Kick thành công");
});
```

---

### **2.11. Xóa nhóm**
- **Sự kiện:** `deleteGroup`
- **Mô tả:** Leader có thể xóa nhóm.
- **Client gửi:**
```javascript
socket.emit("deleteGroup", userID, groupID, (response) => {
    console.log("Server response:", response);
});
```
- **Client lắng nghe:**
```javascript
socket.on("groupDeleted", (groupID) => {
    console.log("Nhóm đã bị xóa:", groupID);
    socket.leave(groupID);
    // Điều hướng về danh sách nhóm hoặc trang chính
});
```
- **Server xử lý:**
```javascript
socket.on("deleteGroup", async (userID, groupID, callback) => {
    const leader = await Member.findOne({ userID, groupID });
    if (!leader || leader.memberRole !== "LEADER") {
        if (callback) callback("Bạn không có quyền xóa nhóm");
        return;
    }
    const deleteStatus = await GroupController.deleteGroup(groupID);
    if (deleteStatus !== true) {
        if (callback) callback(deleteStatus);
        return;
    }
    io.to(groupID).emit("groupDeleted", groupID);
    if (callback) callback("Xóa nhóm thành công");
});
```

## **3. Lưu ý**
- Luôn kiểm tra `callback` response khi gửi tin nhắn để biết trạng thái gửi.
- Khi mất kết nối, client nên gọi API để tải lại tin nhắn cũ nếu cần.
- Nếu sử dụng trong React, đặt socket vào context để có thể truy cập từ nhiều component.

