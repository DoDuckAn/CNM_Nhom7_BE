const jwt=require('jsonwebtoken');
const UserModel = require('../models/User');
const RefreshTokenModel=require('../models/RefreshToken')
const bcrypt=require('bcrypt');

require('dotenv').config();

/**
 * Tạo Access Token mới
 *
 * @function generateAccessToken
 * @param   {string} userID - ID của người dùng
 * @returns {string} Access Token có thời hạn 1 giờ
 */
const generateAccessToken=(userID)=>{
    return jwt.sign(
        {userID},
        process.env.JWT_SECRET_KEY,
        {
            expiresIn:'1h'
        }
    );
}

/**
 * Tạo Refresh Token mới và lưu vào database
 *
 * @async
 * @function generateRefreshToken
 * @param   {string} userID - ID của người dùng
 * @returns {Promise<string>} Refresh Token có thời hạn 7 ngày
 */
const generateRefreshToken=async(userID)=>{
    const refreshToken=jwt.sign(
        {userID},
        process.env.JWT_REFRESH_SECRET_KEY,
        {
            expiresIn:'7d'
        }
    );
    
    await RefreshTokenModel.create(userID,refreshToken);
    return refreshToken;
}

/**
 * Đăng nhập
 *
 * @async
 * @route   POST /api/auth/login
 * @method  loginUser
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.phoneNumber - Số điện thoại của user
 * @param   {string} req.body.password - Mật khẩu của user
 * @returns {JSON} Kết quả đăng nhập và token, hoặc lỗi server
 */

const loginUser=async(req,res)=>{
    try {
        const{phoneNumber,password}=req.body;
        const user=await UserModel.GetUserByPhone(phoneNumber);
        if(!user)
            return res.status(400).json({message:'số điện thoại chưa được đăng ký'})
        const checkPassword=await bcrypt.compare(password,user.password);
        if(!checkPassword)
            return res.status(400).json({message:'mật khẩu sai'});

        const accessToken=generateAccessToken(user.userID);
        const refreshToken=await generateRefreshToken(user.userID);
    
        res.status(200).json({message:'đăng nhập thành công ',user:user,accessToken:accessToken,refreshToken:refreshToken});
    } catch (error) {
        res.status(500).json({message:'Lỗi server', error: error.message })
    }
}

/**
 * Tạo Access Token mới từ Refresh Token
 *
 * @async
 * @route   POST /api/auth/refreshToken
 * @method  newAccessToken
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.refreshToken - Refresh token hợp lệ của user
 * @returns {JSON} Access Token mới hoặc lỗi nếu refresh token không hợp lệ hoặc hết hạn
 */
const newAccessToken=async(req,res)=>{
    const {refreshToken}=req.body;
    if(!refreshToken)
        return res.status(401).json({message:"không có refresh token"});

    const storedRefreshToken=await RefreshTokenModel.findByToken(refreshToken);
    if (!storedRefreshToken) 
        return res.status(403).json({ message: 'Refresh Token không hợp lệ' });

    jwt.verify(refreshToken,process.env.JWT_REFRESH_SECRET_KEY,(err,user)=>{
        if(err)
            return res.status(403).json({message:"refresh token hết hạn"});

        const newAccessToken=generateAccessToken(user.userID);
        res.status(200).json({accessToken:newAccessToken});
    })
}

/**
 * Đăng xuất người dùng, xóa refresh token hiện tại
 *
 * @async
 * @route   POST /api/auth/logout
 * @method  logout
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.refreshToken - Refresh token cần xóa
 * @returns {JSON} Thông báo đăng xuất thành công
 */
const logout=async(req,res)=>{
    const {refreshToken}=req.body;
    await RefreshTokenModel.delete(refreshToken);
    res.status(200).json({message:"đăng xuất thành công"})
}

module.exports={loginUser,newAccessToken,logout};