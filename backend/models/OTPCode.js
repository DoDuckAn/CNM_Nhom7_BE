const mongoose=require('mongoose');

const OTPCodeSchema = new mongoose.Schema({
    gmail: { type: String, required: true, index: true },
    OTP: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: '5m' } 
});

const OTPCode=mongoose.model('OTPCode',OTPCodeSchema);

module.exports=OTPCode;