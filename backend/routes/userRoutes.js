const express=require('express');
const UserController=require('../controllers/userController');
const upload = require('../configs/multerConfig');
const router=express.Router();

router.get('/',UserController.getAllUsers);
router.post('/',UserController.addUser);
router.get('/:userID',UserController.findUserByUserID);
router.get('/:userID/contacts',UserController.getAllContacts);
router.get('/:phoneNumber/gmail',UserController.getGmailByPhoneNumber)
router.put('/changePassword/:phoneNumber',UserController.changePassword);
router.put('/:userID',UserController.updateUserInfo);
router.put('/:userID/contacts',UserController.addContacts);
router.put('/:userID/avatar', upload.single('avatar'), UserController.updateUserAvatar);
router.post('/resetPassword/:phoneNumber',UserController.resetPassword);
module.exports=router;