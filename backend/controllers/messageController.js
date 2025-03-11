const { default: mongoose } = require('mongoose');
const Message=require('../models/Message');
const MessageType=require('../models/messageType');

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

module.exports={getAllMessageInSingleChat,postMessageInSingleChat};