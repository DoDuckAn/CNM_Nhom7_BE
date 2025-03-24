const jwt=require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware xác thực Access Token
 *
 * @async
 * @middleware authenticateAcessToken
 * @param   {Object} req - Request từ client
 * @param   {Object} req.headers.authorization - Header chứa token dạng "Bearer <token>"
 * @param   {Object} res - Response trả về cho client
 * @param   {Function} next - Hàm tiếp theo trong middleware stack
 * @returns {JSON} Lỗi nếu không có token hoặc token không hợp lệ, nếu hợp lệ thì tiếp tục request
 */
const authenticateAcessToken=(req,res,next)=>{
    //lấy token từ header
    const token=req.headers.authorization?.split(' ')[1];

    //không có token từ thì báo lại client
    if(!token)
        return res.status(401).json({message:"không có token"});

    //xác thực token
    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,user)=>{
        if(err)
            return res.status(403).json({message:"token không hợp lệ"});

        req.user=user;
        next();
    });
}

module.exports={authenticateAcessToken};