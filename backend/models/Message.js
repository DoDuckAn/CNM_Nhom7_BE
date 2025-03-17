const mongoose=require('mongoose');

const MessageSchema=new mongoose.Schema({
    senderID:{type:String,required:true,index:true},
    receiverID:{type:String,required:true,index:true},
    groupID:{type:String,default:null},
    seenStatus:{type:[String],default:[]},
    deleteStatus:{type:Boolean,default:false},
    recallStatus:{type:Boolean,default:false},
    messageTypeID:{type:String,required:true},
    context:{type:mongoose.Schema.Types.Mixed,required:true},
    messageID:{type:String,unique:true}//messageID do bên client tạo=socket.id+counter
    },
    {timestamps:true}
);

const Message=mongoose.model('Message',MessageSchema);
module.exports=Message;