const express=require('express');
const GroupController=require('../controllers/groupController');
const router=express.Router();

router.post('/',GroupController.createGroup);
router.get('/:userID',GroupController.getUserGroups);

module.exports=router;