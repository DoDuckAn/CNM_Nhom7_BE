const { default: mongoose } = require('mongoose');
const Message=require('../models/Message');
const MessageType=require('../models/messageType');
const User = require('../models/User');
const fs=require('fs');
const cloudinary=require('../configs/cloudinaryConfig');

/**
 * Lấy tất cả tin nhắn giữa hai người dùng trong chat đơn
 * 
 * @route   GET /api/message/:userID1/:userID2
 * @method  getAllMessageInSingleChat
 * @param   {string} req.params.userID1 - ID của người dùng 1
 * @param   {string} req.params.userID2 - ID của người dùng 2
 * @returns {JSON} Danh sách tin nhắn giữa 2 user hoặc lỗi server
 */
const getAllMessageInSingleChat=async(req,res)=>{
    try {
        const {userID1,userID2}=req.params;
        if(!userID1||!userID2){
            console.log('thiếu userid khi get all message trong chat đơn');
            return res.status(404).json({message:'thiếu userid'});            
        }
        const messageList=await Message.find({
            $or:[
                {senderID:userID1,receiverID:userID2},
                {senderID:userID2,receiverID:userID1}
            ]
        }).sort({createdAt:1});
        res.status(200).json(messageList);
    } catch (error) {
        console.log('lỗi khi get all message trong chat đơn');
        res.status(500).json({message:`Lỗi server: ${error}`});
    }
}

/**
 * Lấy danh sách tất cả cuộc trò chuyện của một người dùng và tin nhắn tương ứng
 * 
 * @route   GET /api/message/user/:userID
 * @method  getAllUserMessage
 * @param   {string} req.params.userID - ID của người dùng
 * @returns {JSON} Danh sách các cuộc trò chuyện và tin nhắn tương ứng hoặc lỗi server
 */
const getAllUserMessage=async(req,res)=>{
    try {
        //tìm user
        const {userID}=req.params;
        if(!userID){
            console.log('thiếu userid khi getAllUserMessage trong chat đơn');
            return res.status(404).json({message:'thiếu userID'});            
        }
        const user=await User.findOne({userID});
        if(!user){
            console.log('không tìm thấy user với id:',userID);
            return res.status(404).json({message:'không tìm thấy user'});
        }
        
        //lấy danh sách conversationsID
        const {conversationsID}=user;
        if(!conversationsID||conversationsID.length===0){
            console.log('user chưa chat với ai');
            return res.status(200).json([]);
        }
        //lấy thông tin cơ bản của các conversations
        const conversationsInfo=await Promise.all(
            conversationsID.map(async(ID)=>{
                const conversationInfo=await User.findOne({userID:ID}).select("userID username");
                return conversationInfo;
            })
        )
        //lấy các message giữa user và các conversations
        const ConversationsAndMessages=await Promise.all(
            conversationsInfo.map(async (conversation)=>{

                const userMessages=await Message.find({
                    $or:[
                        {senderID:userID,receiverID:conversation.userID},
                        {senderID:conversation.userID,receiverID:userID}
                    ]
                }).sort({createdAt:1});

                return {conversation:conversation,messages:userMessages};
            })
        )
        
        res.status(200).json(ConversationsAndMessages);
    } catch (error) {
        console.error("Lỗi khi getAllUserMessage:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
}

/**
 * Gửi tin nhắn mới trong cuộc trò chuyện đơn
 * 
 * @route   POST /api/message/
 * @method  postMessageInSingleChat
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.senderID - ID của người gửi
 * @param   {string} req.body.receiverID - ID của người nhận
 * @param   {string} req.body.messageTypeID - Loại tin nhắn
 * @param   {String} req.body.context - Nội dung tin nhắn
 * @returns {JSON} Kết quả lưu tin nhắn hoặc lỗi server
 */
const postMessageInSingleChat=async(req,res)=>{
    try {
        const {senderID,receiverID,groupID,messageTypeID,context}=req.body;
        const checkMessageType=await MessageType.find({typeID:messageTypeID});
        if(!checkMessageType){
            console.log('không tìm thấy messageTypeID phù hợp mà message cung cấp khi postMessage');
            return res.status(404).json({message:'messageTypeID không hợp lệ'})
        }
        const newMessage=new Message({senderID,receiverID,groupID,messageTypeID,context});
        await newMessage.save();
        res.status(200).json({message:`thêm thành công message: ${newMessage}`});
    } catch (error) {
        console.log('lỗi khi post message trong chat đơn');
        res.status(500).json({message:`Lỗi server: ${error}`});
    }
}


/**
 * Gửi tin nhắn hình ảnh trong cuộc trò chuyện đơn
 * 
 * @route   POST /api/message/image
 * @method  postImageMessageInSingleChat
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.senderID - ID của người gửi
 * @param   {string} req.body.receiverID - ID của người nhận
 * @param   {string} req.body.groupID - ID của nhóm (nếu có)
 * @param   {Object} req.file - File ảnh được gửi từ client (được Multer xử lý)
 * @returns {JSON} Kết quả upload ảnh và lưu tin nhắn hoặc lỗi server
 */

const postImageMessageInSingleChat=async(req,res)=>{
    try {
        const {senderID,receiverID,groupID}=req.body;
        const context="";
        //kiểm tra file từ multer
        if(!req.file){
            console.log("thiếu file khi upload");
            return res.status(400).json({message:"Thiếu file khi upload"});
        }
        
        //lấy ra đường dẫn của ảnh được lưu tạm trong local storage(folder uploads)
        const filePath=req.file.path;

        /// Upload ảnh lên Cloudinary
        const result = await cloudinary.uploader.upload(filePath, { folder: "CNM_ZaloApp" });

        // Xóa ảnh tạm sau khi upload xong
        fs.unlink(filePath, (err) => {
            if (err) console.log("Lỗi khi xóa file tạm:", err);
        });

        // Lưu tin nhắn vào database
        const newMessage = new Message({
            senderID,
            receiverID,
            groupID,
            messageTypeID: "type2",
            context: result.secure_url // context là URL của ảnh lưu trên cloudinary
        });

        await newMessage.save();
        res.status(200).json({message:"Upload thành công",ImageURL:result.secure_url});
    } catch (error) {
        console.log("Lỗi khi postImageMessageInSingleChat:",error);
        res.status(500).json({message:"Lỗi khi postImageMessageInSingleChat",error:error});
    }
}

module.exports={getAllMessageInSingleChat,postMessageInSingleChat,getAllUserMessage,postImageMessageInSingleChat};