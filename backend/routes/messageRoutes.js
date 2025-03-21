const express=require('express');
const router=express.Router();
const MessageController=require('../controllers/messageController')
const upload=require('../configs/multerConfig');

router.get('/:userID1/:userID2',MessageController.getAllMessageInSingleChat);
router.post('/',MessageController.postMessageInSingleChat);
router.get('/:userID',MessageController.getAllUserMessage);
router.post('/upload',upload.single("file"),MessageController.postFileMessageInSingleChat);

module.exports=router;