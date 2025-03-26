const express=require('express')
require('dotenv').config()
const cors=require('cors')
const http=require('http')
const {Server}=require('socket.io')
const connectDB = require('./database/connect')
const userRoutes=require('./routes/userRoutes')
const messageTypeRoutes=require('./routes/messageTypeRoutes')
const messageRoutes=require('./routes/messageRoutes')
const groupRoutes=require('./routes/groupRoutes')
const authRoutes=require('./routes/authRoutes')
const Message=require('./models/Message')
const User = require('./models/User')
const MessageController=require('./controllers/messageController')
const GroupController=require('./controllers/groupController')
const fs = require("fs");
const path = require("path");

const app=express()
const server=http.createServer(app)
const io=new Server(server,{
    connectionStateRecovery:{},
    cors:{origin:"*"},
    maxHttpBufferSize: 1e8, // 100MB cho Socket.io
    pingTimeout: 60000,
})

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use('/api/user',userRoutes)
app.use('/api/messageType',messageTypeRoutes)
app.use('/api/message',messageRoutes)
app.use('/api/group',groupRoutes)
app.use('/api/auth',authRoutes)

connectDB();

io.use((socket,next)=>{
    const token=socket.handshake.auth.token;
    if(!token)
        return next(new Error('Athentication error'));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) 
            return next(new Error('Invalid token'));

        socket.user = user;
        next();
    });
})

io.on("connection",async (socket)=>{
    console.log("User connected: ",socket.id);

    socket.on("joinUserRoom",(userID)=>{
        socket.join(userID);
        console.log(`User ${userID} joined personal room: ${userID}`);
    });
    
    socket.on('sendMessage', async (message, callback) => {
        try {
            const { senderID, receiverID, groupID, messageTypeID, context, messageID, file } = message;

            // Kiểm tra tin nhắn đã tồn tại chưa
            const checkMessageID = await Message.findOne({ messageID });
            if (checkMessageID) {
                console.log('Tin nhắn buffer đã tồn tại:', messageID);
                if (callback) callback("Tin nhắn đã tồn tại");
                return;
            }

            let filePath = null;

            // Nếu có file trong tin nhắn
            if (file) {
                // Kiểm tra file có quá lớn không
                if (message.file && message.file.data.length > 100 * 1024 * 1024) {
                    console.log("file quá lớn");
                    
                    if(callback) return callback({ status: "error", message: "File quá lớn! Giới hạn 100MB." });
                    else return;
                }

                // Tạo thư mục 'uploads' nếu chưa tồn tại
                const uploadDir = "C:\\Users\\Windows\\Desktop\\CNM\\project\\uploads";//sửa lại đường dẫn này tới chỗ nào mà nằm ngoài folder đang chứa project là dc, vd; C:\\Users\\Windows\\Desktop\\uploads
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                    console.log("Thư mục uploads đã được tạo");
                }

                // Chuyển đổi file từ Base64 thành Buffer
                const buffer = Buffer.from(file.data, "base64");

                // Lưu file tạm vào server trước khi upload Cloudinary
                const fileName = `${Date.now()}-${file.name}`;
                filePath = path.join(uploadDir, fileName);
                
                // Ghi file vào thư mục uploads
                fs.writeFileSync(filePath, buffer);        
            }

            let newMessage;

            // Trường hợp chat đơn
            if (!groupID) {
                // Kiểm tra danh sách bạn chat
                const sender = await User.findOne({ userID: senderID });
                const receiver = await User.findOne({ userID: receiverID });
                if (!sender.conversationsID.includes(receiverID)) {
                    sender.conversationsID.push(receiverID);
                    await sender.save();
                    receiver.conversationsID.push(senderID);
                    await receiver.save();
                }

                // Gọi hàm saveMessage, truyền đường dẫn file nếu có
                newMessage = await MessageController.saveMessage(senderID, receiverID, groupID, messageTypeID, context, messageID, filePath);
                if(!newMessage)
                    return
                console.log('Đã lưu mess chat đơn, emit lại:', newMessage);

                io.to(senderID).to(receiverID).emit("receiveMessage", newMessage);
                if (callback) callback("Đã nhận");
            }
            // Trường hợp chat nhóm
            else {
                newMessage = await MessageController.saveMessage(senderID, receiverID, groupID, messageTypeID, context, messageID, filePath);
                if(!newMessage)
                    return
                console.log('Đã lưu mess chat nhóm, emit lại:', newMessage);

                io.to(groupID).emit("receiveMessage", newMessage);
                if (callback) callback("Đã nhận");
            }

        } catch (error) {
            console.log('Lỗi khi socket.on sendMessage:', error);
        }
    });

    socket.on('seenMessage',async(messageID,seenUserID,callback)=>{
        try {
            //tìm message
            const message=await Message.findOne({messageID});
            if(!message){
                console.log("không tìm thấy tin nhắn");
                callback("không tìm thấy tin nhắn");
                return;
            }

            //kiểm tra seenStatus
            if(message.seenStatus.includes(seenUserID)){
                console.log("seenUserID đã tổn tại trong seenStatus");
                if (callback) callback("seenUserID đã tổn tại trong seenStatus")
                return;
            }

            //trường hợp chat đơn
            if(!message.groupID){
                message.seenStatus.push(seenUserID);
                await message.save();

                io.to(message.senderID).to(message.receiverID).emit("updateSingleChatSeenStatus",(messageID));
                if (callback) callback("Đã cập nhật seenStatus chat đơn");
            }
            //trường hợp chat nhóm
            else{
                message.seenStatus.push(seenUserID);
                await message.save();

                io.to(message.groupID).emit("updateGroupChatSeenStatus",(messageID,seenUserID));
                if (callback) callback("Đã cập nhật seenStatus chat nhóm");
            }
        } catch (error) {
            console.log("Lỗi khi on seenMessage:",error);            
        }   
    })

    socket.on("joinGroup",async(userID,groupID,callback)=>{
        //gọi hàm joinGroup để xử lý
        const joinStatus=await GroupController.joinGroup(userID,groupID);
        
        //nếu lỗi, callback lỗi cho client
        if(joinStatus!==true){
            if(callback) callback(joinStatus);
            return;
        }
        
        // Thêm user vào room socket
        socket.join(groupID);

        //emit sự kiện newMember cho group
        io.to(groupID).emit("newMember",userID);
        if (callback) callback("Tham gia nhóm thành công");
    });

    socket.on("addGroupMember",async(userID,groupID,callback)=>{
        //gọi hàm joinGroup để xử lý
        const addStatus=await GroupController.joinGroup(userID,groupID);
        
        //nếu lỗi, callback lỗi cho client
        if(addStatus!==true){
            if(callback) callback(addStatus);
            return;
        }
        
        // Thêm user vào room socket
        socket.join(groupID);
        
        //emit sự kiện newMember cho group
        io.to(groupID).emit("newMember",userID);
        if (callback) callback("Thêm thành viên thành công");
    });

    socket.on("leaveGroup",async(userID,groupID,callback)=>{
        //gọi hàm leaveGroup để xử lý
        const leaveStatus=await GroupController.leaveGroup(userID,groupID);
        
        //nếu lỗi, callback lỗi cho client
        if(leaveStatus!==true){
            if(callback) callback(leaveStatus);
            return;
        }
        
        // thoát khỏi room socket
        socket.leave(groupID);
        
        //emit sự kiện memberLeft cho group
        io.to(groupID).emit("memberLeft",userID);
        if (callback) callback("Rời nhóm thành công");
    });

    socket.on("kickMember",async(leaderID,userID,groupID,callback)=>{
        //kiểm tra xem người kick có phải LEADER không
        const leader = await Member.findOne({ userID: leaderID, groupID });
        if (!leader || leader.memberRole!=="LEADER") {
             if(callback) callback("Bạn không có quyền kick thành viên");
             return;
        }

        //gọi hàm kickMember để xử lý
        const kickStatus=await GroupController.kickMember(userID,groupID);
        
        //nếu lỗi, callback lỗi cho client
        if(kickStatus!==true){
            if(callback) callback(kickStatus);
            return;
        }
        
        // gửi sự kiện forceLeaveGroup đến group, client nào có userID tương ứng thì tự socket.leave, các client khác thì nhận thông báo user đã bị kick
        io.to(groupID).emit('forceLeaveGroup',userID,groupID);

        if (callback) callback("kick thành công");
    });

    socket.on("deleteGroup",async(userID,groupID,callback)=>{
        //kiểm tra xem người xóa group có phải LEADER không
        const leader = await Member.findOne({ userID, groupID });
        if (!leader || leader.memberRole!=="LEADER") {
             if(callback) callback("Bạn không có quyền xóa group");
             return;
        }

        //gọi hàm deleteGroup để xử lý
        const deleteStatus=await GroupController.deleteGroup(groupID);
        
        //nếu lỗi, callback lỗi cho client
        if(deleteStatus!==true){
            if(callback) callback(deleteStatus);
            return;
        }
        
        //emit sự kiện groupDeleted cho group
        io.to(groupID).emit("groupDeleted",groupID);
        if (callback) callback("xóa nhóm thành công");
    });

    socket.on("disconnect", (reason) => {
        console.log(`Client disconnected: ${socket.id} - Reason: ${reason}`);
    });

    if(!socket.recovered){
        try{
            socket.emit('reloadMessage');//fetch api lại để lấy đủ tin nhắn đã mất trong lúc disconnect
        }catch(err){
            console.log('lỗi khi emit reloadMessage:',err);            
        }
    }
})

const PORT=process.env.PORT||5000
server.listen(PORT,()=>console.log(`Server running on port ${PORT}`))