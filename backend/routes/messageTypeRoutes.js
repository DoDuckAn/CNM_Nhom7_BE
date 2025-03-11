const express=require('express');
const router=express.Router();
const MessageTypeController=require('../controllers/messageTypeController');

router.get('/',MessageTypeController.getAllMessageType);
router.post('/',MessageTypeController.addMessageType);
router.put('/:id',MessageTypeController.renameMessageType);
router.delete('/:id',MessageTypeController.deleteMessageTypeById);

module.exports=router;