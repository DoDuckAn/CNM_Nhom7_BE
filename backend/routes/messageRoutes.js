const express=require('express');
const router=express.Router();
const MessageController=require('../controllers/messageController')
const upload=require('../configs/multerConfig');

router.get('/:userID1/:userID2',MessageController.getAllMessageInSingleChat);
router.get('/:userID',MessageController.getAllUserMessage);
router.get('/group/:groupID',MessageController.getAllMessageInGroupChat);

module.exports=router;