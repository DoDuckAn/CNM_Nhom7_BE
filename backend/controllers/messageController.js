const { default: mongoose } = require('mongoose');
const Message = require('../models/Message');
const MessageType = require('../models/MessageType');
const User = require('../models/User');
const fs = require('fs');
const cloudinary = require('../configs/cloudinaryConfig');
const Group = require('../models/Group');
const MessageModel = require('../models/Message');
const GroupModel = require('../models/Group');
const UserModel = require('../models/User');
const MessageTypeModel = require('../models/MessageType');
const { uploadFileToS3, deleteLocalFile } = require('../utils/aws-helper');

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
const getAllMessageInSingleChat = async (req, res) => {
    try {
        const { userID1, userID2 } = req.params;
        if (!userID1 || !userID2) {
            console.log('thiếu userid khi get all message trong chat đơn');
            return res.status(404).json({ message: 'thiếu userid' });            
        }
        const messageList = await MessageModel.getMessagesBetweenUsers(userID1, userID2);
        res.status(200).json(messageList);
    } catch (error) {
        console.log('lỗi khi get all message trong chat đơn');
        res.status(500).json({ message: `Lỗi server: ${error}` });
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
const getAllMessageInGroupChat = async (req, res) => {
    try {
        const { groupID } = req.params;
        if (!groupID)
            return res.status(404).json({ message: "thiếu groupID" });

        const checkGroup = await GroupModel.findByGroupID(groupID);
        if (!checkGroup)
            return res.status(403).json({ message: "không tìm thấy group" });

        const messageList = await MessageModel.getMessagesInGroup(groupID);
        res.status(200).json(messageList);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server", error: error });
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
const getAllUserMessage = async (req, res) => {
    try {
        //tìm user
        const { userID } = req.params;
        if (!userID) {
            console.log('thiếu userid khi getAllUserMessage trong chat đơn');
            return res.status(404).json({ message: 'thiếu userID' });            
        }
        const user = await UserModel.GetUserByID(userID);
        if (!user) {
            console.log('không tìm thấy user với id:', userID);
            return res.status(404).json({ message: 'không tìm thấy user' });
        }
        
        const conversationIDs = user.conversationsID || [];
        const ConversationsAndMessages = await Promise.all(conversationIDs.map(async (id) => {
            const partner = await UserModel.GetUserByID(id);
            const messages = await MessageModel.getMessagesBetweenUsers(userID, id);
            return {
                conversation: { userID: partner?.userID, username: partner?.username },
                messages
            };
        }));

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
        const checkMessageType = await MessageTypeModel.findById(messageTypeID);
        if (!checkMessageType) {
            console.log('Không tìm thấy messageTypeID phù hợp');
            throw new Error("Loại tin nhắn không hợp lệ");
        }

        let finalContext = context;
        // Nếu có file, upload lên S3
        if (filePath && ["type2", "type3", "type5"].includes(messageTypeID)) {
            const uploadURL = await uploadFileToS3(filePath);
            finalContext = uploadURL; 
            // Xóa file tạm sau khi upload
            await deleteLocalFile(filePath);
        }

        // Lưu tin nhắn vào DB, gán groupID mặc định là "NONE" nếu null
        const newMessage = { 
            messageID,
            senderID, 
            receiverID, 
            groupID: groupID || "NONE", // Sửa ở đây: đảm bảo groupID không là null
            seenStatus: [],
            deleteStatus: false,
            recallStatus: false,
            messageTypeID, 
            context: finalContext,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        
        await MessageModel.saveMessage(newMessage);
        return newMessage;
    } catch (error) {
        console.log('Lỗi khi saveMessage:', error);
        return null;
    }
};

module.exports = { getAllMessageInSingleChat, saveMessage, getAllUserMessage };