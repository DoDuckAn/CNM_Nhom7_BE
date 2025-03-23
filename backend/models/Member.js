const mongoose=require('mongoose');

const MemberSchema=new mongoose.Schema({
    userID:{type:String,required:true,index:true},
    groupID:{type:String,required:true,index:true},
    memberRole:{type:String,default:"Member"},
})

const Member=mongoose.model("Member",MemberSchema);
module.exports=Member;