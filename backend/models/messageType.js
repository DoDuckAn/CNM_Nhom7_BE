const mongoose=require('mongoose');

const messageTypeSchema=new mongoose.Schema({
    typeID:{type:String,required:true,unique:true},
    typeName:{type:String,require:true}
})

const MessageType=mongoose.model('MessageType',messageTypeSchema);

module.exports=MessageType;