require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt=require('bcrypt');
const OTPCode = require('../models/OTPCode');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODE_MAILER_GMAIL,
    pass: process.env.NODE_MAILER_APPPASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  }
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();//random OTP

/**
 * Gửi OTP qua email
 *
 * @async
 * @route   POST /api/OTP/send
 * @method  sendOTP
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.gmail - Địa chỉ email của người nhận OTP
 * @returns {JSON} Trạng thái gửi OTP hoặc lỗi server
 */
const sendOTP=async(req,res)=>{
    const {gmail}=req.body;
    let OTP=generateOTP();
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(OTP, saltRounds);
    
    //kiểm tra xem gmail đã được gửi OTP chưa
    const checkGmail=await OTPCode.findOne({gmail});
    
    //nếu có rồi thì xóa đi tạo OTP mới
    if(checkGmail){
        await OTPCode.deleteOne({ gmail });
        const newOTPCode = new OTPCode({gmail,OTP:hashedOTP});
        await newOTPCode.save();
    } else{//chưa có thì tạo OTP mới
        const newOTPCode=new OTPCode({gmail,OTP:hashedOTP});
        await newOTPCode.save();
    }

    const mailOptions = {
    from: process.env.NODE_MAILER_GMAIL,
    to: gmail,
    subject: 'CloneZaloApp: mã xác thực OTP',
    text: OTP
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
      return res.status(500).json({message:'Lỗi khi gửi OTP',error:error})
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).json({message:"Đã gửi OTP, vui lòng kiểm tra thư rác nếu không thấy, OTP có giới hạn 5p"});
    }
  });
}

/**
 * Xác thực OTP
 *
 * @async
 * @route   POST /api/OTP/verify
 * @method  verifyOTP
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.gmail - Địa chỉ email của người dùng
 * @param   {string} req.body.OTP - Mã OTP do người dùng nhập
 * @returns {JSON} Kết quả xác thực OTP hoặc lỗi server
 */
const verifyOTP=async(req,res)=>{
    try {
        const {gmail,OTP}=req.body;
        const checkOTP=await OTPCode.findOne({gmail});
        const result=await bcrypt.compare(OTP,checkOTP.OTP);
        
        if(result)
            res.status(200).json({message:"OTP đúng"});
        else
            res.status(400).json("OTP sai");
    } catch (error) {
        console.log("lỗi khi xác thực OTP:",error);
        res.status(500).json({message:"Lỗi server",error:error});
    }
}

module.exports={sendOTP,verifyOTP};