const express=require('express')
require('dotenv').config()
const cors=require('cors')
const http=require('http')
const {Server}=require('socket.io')
const connectDB = require('./database/connect')
const userRoutes=require('./routes/userRoutes')
const messageTypeRoutes=require('./routes/messageTypeRoutes')
const messageRoutes=require('./routes/messageRoutes')
const Message=require('./models/Message')
const User = require('./models/User')

const app=express()
const server=http.createServer(app)
const io=new Server(server,{
    connectionStateRecovery:{},
    cors:{origin:"*"},
})

app.use(express.json())

app.use('/api/user',userRoutes)
app.use('/api/messageType',messageTypeRoutes)
app.use('/api/message',messageRoutes)

connectDB();

io.on("connection",async (socket)=>{
    console.log("User connected: ",socket.id);

    socket.on("joinUserRoom",(userID)=>{
        socket.join(userID);
        console.log(`User ${userID} joined personal room: ${userID}`);
    });
    
    socket.on('sendTextMessage',async (message,callback)=>{
        try {
            const {senderID,receiverID,groupID,messageTypeID,context,messageID}=message;
            const checkMessageID=await Message.findOne({messageID:messageID});
            console.log('check:',checkMessageID);
            
            //check xem tin nhắn buffer đã được gửi chưa 
            if(checkMessageID){
                console.log('tin nhắn buffer đã tồn tại:',messageID);
                if (callback) callback("tin nhắn đã tồn tại");//tin nhắn đã tồn tại, callback lại cho client biết
                return;
            }
            if (callback) callback('đang gửi');//callback lại tình trạng tin nhắn

            //check xem 2 user đã từng chat với nhau chưa, chưa thì add userID vào conversations của nhau
            const  sender= await User.findOne({userID:senderID});
            const receiver=await User.findOne({userID:receiverID});
            if(!sender.conversationsID){
                sender.conversationsID=[];
                await sender.save();
            }
            if(!sender.conversationsID.includes(receiverID)){
                sender.conversationsID.push(receiverID);
                await sender.save();
                receiver.conversationsID.push(senderID);
                await receiver.save();
                console.log('đã thêm conversations');
            }
            if (callback) callback('đã gửi')

            const newMessage=new Message({senderID,receiverID,groupID,messageTypeID:'type1',context,messageID})
            let response=await newMessage.save(); 
            if (!response) {
                throw new Error("Lưu tin nhắn vào DB thất bại");
            } 
            console.log('đã lưu mess bên server, tiếp theo sẽ emit lại:',newMessage.context);
            
            io.to(senderID).to(receiverID).emit("receiveTextMessage",newMessage);
            callback("đã nhận");

            console.log('đã gửi cho sender:'+senderID+' và receiver:'+receiverID);
        } catch (error) {
            console.log('lỗi khi socket.on sendTextMessage bên server: ',error); 
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

    socket.on("disconnect",()=>{
        console.log("User disconnceted: ",socket.id);        
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