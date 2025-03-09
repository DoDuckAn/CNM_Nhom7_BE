const User=require('../models/User')
const {v4:uuidv4}=require('uuid')
const brcypt=require('bcrypt')

const getAllUsers=async(req,res)=>{
    try {
        const users=await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({message:'lỗi server', error: error.message });
    }
}

const findUserByUserID=async(req,res)=>{
    try {
        const userID=req.params.userID;
        const user=await User.findOne({userID}).select('-password');
        if(!user)
            return res.status(404).json({message:`không tìm thấy user có ID ${userID}`});
        res.status(200).json(user);
    } catch (error) {
        console.log('lỗi khi tìm user');
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}

const addUser=async(req,res)=>{
    try {
        const {phoneNumber,password,username,DOB}=req.body;

        //check sdt trùng
        const existingPhoneNumber=await User.findOne({phoneNumber});
        if(existingPhoneNumber){
            return res.status(400).json({message:'SĐT đã được đăng ký'})
        }
        //Tạo userID bằng uuid
        const userID=uuidv4().split('-')[0]
        //băm mật khẩu
        const saltRound=10;
        const hashedPassword=await  brcypt.hash(password,saltRound)

        const newUser=new User({userID,phoneNumber,password:hashedPassword,username,accountRole:'USER',DOB})
        await newUser.save();
        res.status(201).json('thêm user thành công: '+newUser);
    } catch (error) {
        res.status(500).json({message:'lỗi server', error: error.message })
    }
}

const loginUser=async(req,res)=>{
    try {
        const{phoneNumber,password}=req.body;
        const user=await User.findOne({phoneNumber});
        if(!user)
            return res.status(400).json({message:'số điện thoại chưa được đăng ký'})
        const checkPassword=await brcypt.compare(password,user.password);
        if(!checkPassword)
            return res.status(400).json({message:'mật khẩu sai'});
        res.status(200).json({message:'đăng nhập thành công ',user})
    } catch (error) {
        res.status(500).json({message:'Lỗi server', error: error.message })
    }
}
module.exports={getAllUsers,addUser,loginUser,findUserByUserID}