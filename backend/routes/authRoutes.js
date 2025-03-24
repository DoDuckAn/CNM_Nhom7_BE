const express=require('express');
const router=express.Router();
const AuthController=require('../controllers/authController');

router.post('/login',AuthController.loginUser);
router.post('/refreshToken',AuthController.newAccessToken);
router.post('/logout', AuthController.logout);

module.exports=router;