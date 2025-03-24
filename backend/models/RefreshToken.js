const mongoose=require('mongoose');

const RefreshTokenSchema=new mongoose.Schema({
    userID: { type: String, required: true },
    refreshToken: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '7d' } // Token hết hạn sau 7 ngày
})

const RefreshToken=mongoose.model("RefreshToken",RefreshTokenSchema);

module.exports=RefreshToken;