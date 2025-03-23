const mongoose=require('mongoose');

const GroupSchema=new mongoose.Schema({
    groupID:{type:String,required:true,index:true,unique:true},
    groupName:{type:String,required:true},
    totalMembers:{type:Number,default:3}
});;

const Group=mongoose.model("Group",GroupSchema);
module.exports=Group;