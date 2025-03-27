const { default: mongoose } = require('mongoose');
const Message=require('../models/Message');
const MessageType=require('../models/messageType');
const User = require('../models/User');
const fs=require('fs');
const cloudinary=require('../configs/cloudinaryConfig');
const Group = require('../models/Group');

/**
 * Lấy tất cả tin nhắn giữa hai người dùng trong chat đơn
 * 
 * @async
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
 * Lấy tất cả tin nhắn trong nhóm
 * 
 * @async
 * @route   GET /api/message/group/:groupID
 * @method  getAllMessageInGroupChat
 * @param   {string} req.params.groupID - ID của nhóm
 * @returns {JSON} Danh sách tin nhắn nhóm hoặc lỗi server
 */
const getAllMessageInGroupChat=async(req,res)=>{
    try {
        const {groupID}=req.params;
        if(!groupID)
            return res.status(404).json({message:"thiếu groupID"});

        const checkGroup=await Group.findOne({groupID});
        if(!checkGroup)
            return res.status(403).json({message:"không tìm thấy group"});

        const messageList=await Message.find({groupID}).sort({createdAt:1});

        res.status(200).json(messageList);
    } catch (error) {
        res.status(500).json({message:"Lỗi server",error:error});
    }
}

/**
 * Lấy danh sách tất cả cuộc trò chuyện của một người dùng và tin nhắn tương ứng
 * 
 * @async
 * @route   GET /api/message/:userID
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
 * Lưu tin nhắn vào database và xử lý upload file lên Cloudinary (nếu có).
 * 
 * @async
 * @function saveMessage
 * @param   {string} senderID - ID của người gửi tin nhắn.
 * @param   {string} receiverID - ID của người nhận tin nhắn (có thể là user hoặc group).
 * @param   {string|null} groupID - ID của nhóm chat (nếu là tin nhắn nhóm).
 * @param   {string} messageTypeID - Loại tin nhắn (text, image, video, file, ...).
 * @param   {string} context - Nội dung tin nhắn (hoặc link file sau khi upload).
 * @param   {string} messageID - ID duy nhất của tin nhắn.
 * @param   {string|null} filePath - Đường dẫn file tạm thời trên server (nếu có file).
 */

const saveMessage = async (senderID, receiverID, groupID, messageTypeID, context, messageID, filePath) => {
    try {
        const checkMessageType = await MessageType.findOne({ typeID: messageTypeID });
        if (!checkMessageType) {
            console.log('Không tìm thấy messageTypeID phù hợp');
            throw new Error("Loại tin nhắn không hợp lệ");
        }

        let finalContext = context;
        // Nếu có file, upload lên Cloudinary
        if (filePath && ["type2", "type3", "type5"].includes(messageTypeID)) {
            let result;
            if (messageTypeID === "type2") {
                result = await cloudinary.uploader.upload(filePath, { folder: "CNM_ZaloApp" });
            } else if (messageTypeID === "type3") {
                result = await cloudinary.uploader.upload(filePath, { folder: "CNM_ZaloApp", resource_type: "video" });
            } else {
                result = await cloudinary.uploader.upload(filePath, { folder: "CNM_ZaloApp", resource_type: "raw" });
            }
            // Xóa file tạm sau khi upload
            try {
                if (fs.existsSync(filePath)) {
                    console.log("File tồn tại, tiến hành xóa...");
                    await fs.promises.unlink(filePath);
                    console.log("File đã bị xóa.");
                } else {
                    console.log("File không tồn tại:", filePath);
                }                
            } catch (err) {
                console.log('File chưa được xóa, lỗi khi xóa file tạm:', err);
            }        

            //gán link cloudinary vào context
            finalContext = result.secure_url;
        }

        // Lưu tin nhắn vào DB
        const newMessage = new Message({ senderID, receiverID, groupID, messageTypeID, context: finalContext, messageID });
        const response = await newMessage.save();
        if (!response) 
            throw new Error("Lưu tin nhắn thất bại");

        return newMessage;
    } catch (error) {
        console.log('Lỗi khi saveMessage:', error);
        return null;
    }
};

module.exports={getAllMessageInSingleChat,saveMessage,getAllUserMessage};