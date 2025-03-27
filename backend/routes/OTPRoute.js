const express=require('express');
const router=express.Router();
const OTPCodeController=require('../controllers/OTPCodeController');

router.post('/send', OTPCodeController.sendOTP);
router.post('/verify', OTPCodeController.verifyOTP);

module.exports=router;