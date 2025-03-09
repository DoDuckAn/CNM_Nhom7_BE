const express=require('express');
const UserController=require('../controllers/userController');
const router=express.Router()

router.get('/',UserController.getAllUsers);
router.post('/',UserController.addUser);
router.post('/login',UserController.loginUser)
router.get('/:userID',UserController.findUserByUserID)
module.exports=router;