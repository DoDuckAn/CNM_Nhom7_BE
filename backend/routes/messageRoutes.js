const express=require('express');
const router=express.Router();
const MessageController=require('../controllers/messageController')

router.get('/:userID1/:userID2',MessageController.getAllMessageInSingleChat);
router.post('/',MessageController.postMessageInSingleChat);

module.exports=router;