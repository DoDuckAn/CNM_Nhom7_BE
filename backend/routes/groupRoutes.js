const express=require('express');
const GroupController=require('../controllers/groupController');
const router=express.Router();

router.post('/',GroupController.createGroup);
router.get('/:userID',GroupController.getUserGroups);
router.get('/',GroupController.getAllGroup);
router.get('/:groupID/users',GroupController.getAllGroupUsers)
module.exports=router;