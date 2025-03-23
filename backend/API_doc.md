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


### Login User
**Endpoint:** `POST /api/user/login`
- **Description:** Đăng nhập user bằng số điện thoại và mật khẩu.
- **Request Body:**
  ```json
  {
    "phoneNumber": "string",
    "password": "string"
  }
  ```
- **Response:** Trả về thông tin user nếu đăng nhập thành công.

**Example:**
```
POST http://localhost:3000/api/user/login
```
_Request Body_:
 ```json
  {
    "phoneNumber": "0123456789",
    "password": "securepassword"
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