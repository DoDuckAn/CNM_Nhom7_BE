const mongoose=require('mongoose');

const userSchema=new mongoose.Schema({
    userID:{type:String,required:true,unique:true},
    phoneNumber:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    username:{type:String,required:true},
    accountRole:{type:String,required:true},
    DOB:{type:Date,required:true}
});

const User=mongoose.model("User",userSchema);

module.exports=User;
