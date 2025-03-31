const express=require('express');
const UserController=require('../controllers/userController');
const router=express.Router();

router.get('/',UserController.getAllUsers);
router.post('/',UserController.addUser);
router.get('/:userID',UserController.findUserByUserID);
router.get('./:userID/contacts',UserController.getAllContacts);
router.put('/changePassword/:phoneNumber',UserController.changePassword);
router.put('/:userID',UserController.updateUserInfo);
router.put('/:userID/contacts',UserController.addContacts);

module.exports=router;