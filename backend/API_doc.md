# API Documentation

## User API

### Get All Users
**Endpoint:** `GET /api/user`
- **Description:** Lấy danh sách tất cả người dùng (ẩn mật khẩu).
- **Response:** Trả về danh sách user.

**Example:**
GET http://localhost:3000/api/user

### Get User by ID
**Endpoint:** `GET /api/user/:userID`
- **Description:** Lấy thông tin của user theo `userID`.
- **Response:** Trả về thông tin user.

**Example:**
```
GET http://localhost:3000/api/user/921946bf
```
_Response:_
```json
{"_id":"67cdacfbacba3e9189a75bfc",
"userID":"921946bf",
"phoneNumber":"00087654321",
"username":"testuser",
"accountRole":"USER",
"DOB":"2000-01-01T00:00:00.000Z",
"__v":0}
```

### Add User
**Endpoint:** `POST /api/user`
- **Description:** Tạo mới một user.
- **Request Body:**
  ```json
  {
    "phoneNumber": "string",
    "password": "string",
    "username": "string",
    "DOB": "string"
  }
  ```
- **Response:** Trả về thông tin user vừa tạo.

**Example:**
```
POST http://localhost:3000/api/user
```
_Request Body_:
```json
{
  "phoneNumber": "0123456789",
  "password": "securepassword",
  "username": "John Doe",
  "DOB": "2000-01-01"
}
```

### Forgot Password(Change Password)
**Endpoint:** `PUT /api/user/changePassword/:phoneNumber`  
- **Description:** Đổi mật khẩu của người dùng dựa trên số điện thoại.  
- **Request Parameters:**  
  - `phoneNumber` _(string)_: Số điện thoại của người dùng cần đổi mật khẩu.  
- **Request Body:**  
  ```json
  {
    "newPassword": "string"
  }
  ```
- **Response:** Trả về thông báo đổi mật khẩu thành công hoặc lỗi.  

**Example:**
```
PUT http://localhost:3000/api/user/changePassword/0123456789
```
_Request Body_:
```json
{
  "newPassword": "newsecurepassword"
}
```
_Response_:
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

---

### Update UserInfo
**Endpoint:** `PUT /api/user/:userID`  
- **Description:** Cập nhật thông tin cá nhân của người dùng.  
- **Request Parameters:**  
  - `userID` _(string)_: ID của người dùng cần cập nhật.  
- **Request Body:**  
  ```json
  {
    "username": "string",
    "DOB": "string"
  }
  ```
- **Response:** Trả về thông báo cập nhật thành công hoặc lỗi.  

**Example:**
```
PUT http://localhost:3000/api/user/921946bf
```
_Request Body_:
```json
{
  "username": "Updated User",
  "DOB": "1999-12-31"
}
```
_Response_:
```json
{
  "message": "Đã cập nhật thông tin user",
  "user": {
    "userID": "921946bf",
    "username": "Updated User",
    "DOB": "1999-12-31"
  }
}
```

## Message API

### Get All Chats of a User
**Endpoint:** `GET /api/message/:userID`
- **Description:** Lấy danh sách các cuộc trò chuyện của một user.
- **Response:** Trả về danh sách các user đã chat cùng và tin nhắn của chatbox đó.

**Example:**
```
GET http://localhost:3000/api/message/4ba34dec
```
_Response:_
```json
[
    {
        "conversation": {
            "_id": "67cfdf4de8497358d54a7970",
            "userID": "75e9f681",
            "username": "John Doe"
        },
        "messages": [
            {
                "_id": "67d446a7448f8a0be686985d",
                "senderID": "41cf6b7a",
                "receiverID": "75e9f681",
                "groupID": null,
                "seenStatus": [],
                "deleteStatus": false,
                "recallStatus": false,
                "messageTypeID": "type1",
                "context": "chào, t là 0",
                "createdAt": "2025-03-14T15:09:27.552Z",
                "updatedAt": "2025-03-14T15:09:27.552Z",
                "__v": 0
            },{...}
        ]
    },
    {
        "conversation": {
            "_id": "0",
            "userID": "0",
            "username": "0"
        },
        "messages": [
            {
                "_id": "67d446a7448f8a0be686985d",
                "senderID": "0",
                "receiverID": "0",
                "groupID": null,
                "seenStatus": [],
                "deleteStatus": false,
                "recallStatus": false,
                "messageTypeID": "type1",
                "context": "0",
                "createdAt": "2025-03-14T15:09:27.552Z",
                "updatedAt": "2025-03-14T15:09:27.552Z",
                "__v": 0
            },{...}
        ]
    }
]
```

### Get All Messages in a Single Chat
**Endpoint:** `GET /api/message/:userID1/:userID2`
- **Description:** Lấy tất cả tin nhắn giữa hai user.
- **Response:** Trả về danh sách tin nhắn.

**Example:**
```
GET http://localhost:3000/api/message/4ba34dec/921946bf
```
_Response:_
```json
[
  {
    "senderID": "4ba34dec",
    "receiverID": "921946bf",
    "messageTypeID": "type1",
    "context": "Hello!",
    "createdAt": "2025-03-11T12:00:00Z"
  }
]
```

### Get All Messages in Group Chat
**Endpoint:** `GET /api/message/group/:groupID`
- **Description:** Lấy tất cả tin nhắn trong nhóm theo `groupID`.
- **Parameters:**
  - `groupID` (string, required): ID của nhóm cần lấy tin nhắn.
- **Response:** Trả về danh sách tin nhắn trong nhóm hoặc lỗi server.

**Example:**
```
GET http://localhost:3000/api/message/group/group-a1b2c3
```

_Response:_
```json
[
  {
    "messageID": "msg-123",
    "groupID": "group-a1b2c3",
    "senderID": "user-456",
    "content": "Chào mọi người!",
    "createdAt": "2025-03-27T08:30:00.000Z"
  },
  {
    "messageID": "msg-124",
    "groupID": "group-a1b2c3",
    "senderID": "user-789",
    "content": "Chào bạn!",
    "createdAt": "2025-03-27T08:31:00.000Z"
  }
]
```

## Message Type API

### Get All Message Types
**Endpoint:** `GET /api/messageType`
- **Description:** Lấy danh sách tất cả các loại tin nhắn.
- **Response:** Trả về danh sách message type.

**Example:**
```
GET http://localhost:3000/api/messageType
```
_Response:_
```json
[
  {
    "typeID": "type1",
    "typeName": "text"
  }
]
```

### Add Message Type
**Endpoint:** `POST /api/messageType`
- **Description:** Thêm một loại tin nhắn mới.
- **Request Body:**
  ```json
  {
    "typeID": "string",
    "typeName": "string"
  }
  ```
- **Response:** Trả về message type vừa thêm.

**Example:**
```
POST http://localhost:3000/api/messageType
```
_Request Body_:
```json
  {
    "typeID": "type5",
    "typeName": "emoji"
  }
```


### Delete Message Type by ID
**Endpoint:** `DELETE /api/messageType/:id`
- **Description:** Xóa một loại tin nhắn theo `id`.
- **Response:** Trả về thông báo thành công hoặc lỗi.

**Example:**
```
DELETE http://localhost:3000/api/messageType/type5
```
_Response:_
```json
{
  "message": "Xóa messageType thành công"
}
```

### Rename Message Type
**Endpoint:** `PUT /api/messageType/:id`
- **Description:** Đổi tên loại tin nhắn.
- **Request Body:**
  ```json
  {
    "typeName": "string"
  }
  ```
- **Response:** Trả về thông báo thành công hoặc lỗi.

**Example:**
```
PUT http://localhost:3000/api/messageType/type5
```
_Request Body:_
```json
{
  "typeName": "new name"
}
```
_Response:_
```json
{
  "message": "Rename messageType thành công"
}
```

## Group API

### Create Group
**Endpoint:** `POST /api/group`
- **Description:** Tạo một nhóm mới và thêm người tạo nhóm làm LEADER.
- **Request Body:**
  ```json
  {
    "groupName": "string",
    "userID": "string"
  }
  ```
- **Response:** Trả về thông tin nhóm vừa tạo hoặc lỗi server.

**Example:**
```
POST http://localhost:3000/api/group
```
_Request Body:_
```json
{
  "groupName": "Nhóm Học Tập",
  "userID": "user-123456"
}
```

_Response:_
```json
{
  "message": "Tạo nhóm thành công",
  "group": {
    "groupID": "group-a1b2c3",
    "groupName": "Nhóm Học Tập"
  },
  "leader": {
    "groupID": "group-a1b2c3",
    "userID": "user-123456",
    "memberRole": "LEADER"
  }
}
```

### Get User Groups  
**Endpoint:** `GET /api/group/:userID`  
- **Description:** Tìm các nhóm mà người dùng tham gia.  
- **Path Parameter:**  
  - `userID` (string, required) - ID của người dùng cần lấy danh sách nhóm.  
- **Response:** Trả về danh sách groupID của cá nhóm đã tham gia hoặc lỗi server.  

**Example:**  
```
GET http://localhost:3000/api/group/user-123456
```  

_Response (User có nhóm tham gia):_  
```json
[
  {
    "groupID": "group-a1b2c3"
  },
  {
    "groupID": "group-d4e5f6"
  }
]
```  

_Response (User không tồn tại):_  
```json
{
  "message": "Không tìm thấy userID"
}
```  

_Response (Lỗi server):_  
```json
{
  "message": "Lỗi server khi tìm các group user tham gia",
  "error": "Chi tiết lỗi"
}
```

---
## Authentication API

### Login User  
**Endpoint:** `POST /api/auth/login`  
- **Description:** Đăng nhập user bằng số điện thoại và mật khẩu.  
- **Request Body:**  
  ```json
  {
    "phoneNumber": "string",
    "password": "string"
  }
  ```
- **Response:**  
  - **200 OK**: Trả về thông tin user và token nếu đăng nhập thành công.  
  - **400 Bad Request**: Nếu số điện thoại chưa được đăng ký hoặc mật khẩu sai.  
  - **500 Internal Server Error**: Nếu có lỗi từ server.  

**Example:**  
```
POST http://localhost:3000/api/auth/login
```
_Request Body_:  
```json
{
  "phoneNumber": "0123456789",
  "password": "securepassword"
}
```
_Response (Success)_:  
```json
{
  "message": "đăng nhập thành công",
  "user": {
    "userID": "abc123",
    "phoneNumber": "0123456789",
    "username": "John Doe",
    "DOB": "2000-01-01"
  },
  "accessToken": "your-access-token",
  "refreshToken": "your-refresh-token"
}
```
_Response (Số điện thoại chưa đăng ký)_:  
```json
{
  "message": "số điện thoại chưa được đăng ký"
}
```
_Response (Mật khẩu sai)_:  
```json
{
  "message": "mật khẩu sai"
}
```
_Response (Lỗi server)_:  
```json
{
  "message": "Lỗi server",
  "error": "Chi tiết lỗi"
}
```

---

### Refresh Access Token  
**Endpoint:** `POST /api/auth/refreshToken`  
- **Description:** Tạo Access Token mới bằng Refresh Token.  
- **Request Body:**  
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response:** Trả về Access Token mới nếu Refresh Token hợp lệ.  

**Example:**  
```
POST http://localhost:3000/api/auth/refreshToken
```
_Request Body_:  
```json
{
  "refreshToken": "your-refresh-token"
}
```

---

### Logout User  
**Endpoint:** `POST /api/auth/logout`  
- **Description:** Đăng xuất user và xóa Refresh Token khỏi hệ thống.  
- **Request Body:**  
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response:** Trả về thông báo đăng xuất thành công.  

**Example:**  
```
POST http://localhost:3000/api/auth/logout
```
_Request Body_:  
```json
{
  "refreshToken": "your-refresh-token"
}
```

---

### Authenticate Access Token (Middleware)  
**Middleware Name:** `authenticateAcessToken`  
- **Description:** Xác thực Access Token để bảo vệ các API yêu cầu xác thực.  
- **Usage:** Middleware này được sử dụng trước các route cần xác thực user.  
- **Request Header:**  
  ```
  Authorization: Bearer <access_token>
  ```
- **Response:**  
  - 401 nếu không có token.  
  - 403 nếu token không hợp lệ.  
  - Tiếp tục request nếu token hợp lệ.  

**Example Usage:**  
```js
router.get('/protected-route', authenticateAcessToken, (req, res) => {
    res.json({ message: "Bạn đã truy cập vào route bảo vệ!" });
});
```

---

### Send OTP
**Endpoint:** `POST /api/OTP/send`
- **Description:** Gửi mã OTP đến email của người dùng.
- **Request Body:**
  ```json
  {
    "gmail": "string"
  }
  ```
- **Response:** Trả về thông báo gửi thành công hoặc lỗi server.

**Example:**
```
POST http://localhost:3000/api/OTP/send
```
_Request Body:_
```json
{
  "gmail": "user@example.com"
}
```

_Response:_
```json
{
  "message": "Đã gửi OTP, vui lòng kiểm tra thư rác nếu không thấy, OTP có giới hạn 5p"
}
```

### Verify OTP
**Endpoint:** `POST /api/OTP/verify`
- **Description:** Xác thực mã OTP do người dùng nhập.
- **Request Body:**
  ```json
  {
    "gmail": "string",
    "OTP": "string"
  }
  ```
- **Response:** Trả về kết quả xác thực OTP hoặc lỗi server.

**Example:**
```
POST http://localhost:3000/api/OTP/verify
```
_Request Body:_
```json
{
  "gmail": "user@example.com",
  "OTP": "123456"
}
```

_Response:_
```json
{
  "message": "OTP đúng"
}
```