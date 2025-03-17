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
- **Sự kiện:** `sendTextMessage`
- **Mô tả:** Gửi tin nhắn từ người dùng A đến người dùng B.
- **Client gửi:**
```javascript
const message = {
    senderID: "userA",
    receiverID: "userB",
    groupID: null, // Nếu gửi tin nhắn nhóm, truyền groupID
    messageTypeID: "type1",
    context: "Xin chào!",
    messageID: "unique_message_id"
};

socket.emit("sendTextMessage", message, (response) => {
    console.log("Server response:", response);
});
```
- **Server xử lý:**
```javascript
socket.on("sendTextMessage", async (message, callback) => {
    try {
        const { senderID, receiverID, messageID, context } = message;
        const checkMessageID = await Message.findOne({ messageID });
        
        if (checkMessageID) {
            callback("tin nhắn đã tồn tại");
            return;
        }
        
        callback("đang gửi");
        
        const newMessage = new Message({ senderID, receiverID, context, messageID });
        await newMessage.save();
        
        io.to(senderID).to(receiverID).emit("receiveTextMessage", newMessage);
        callback("đã nhận");
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

## **3. Lưu ý**
- Luôn kiểm tra `callback` response khi gửi tin nhắn để biết trạng thái gửi.
- Khi mất kết nối, client nên gọi API để tải lại tin nhắn cũ nếu cần.
- Nếu sử dụng trong React, đặt socket vào context để có thể truy cập từ nhiều component.

