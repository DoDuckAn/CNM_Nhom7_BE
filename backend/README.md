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

## Message API

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

### Post Message in Single Chat
**Endpoint:** `POST /api/message`
- **Description:** Gửi tin nhắn giữa hai user.
- **Request Body:**
  ```json
  {
    "senderID": "string",
    "receiverID": "string",
    "groupID": "string",  // Optional
    "messageTypeID": "string",
    "context": "mixed"
  }
  ```
- **Response:** Trả về tin nhắn vừa tạo.

**Example:**
```
POST http://localhost:3000/api/message
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