const {v4:uuidv4}=require('uuid');
const User = require('../models/User');
const Group = require('../models/Group');
const Member = require('../models/Member');

/**
 * Tạo một nhóm mới và thêm người tạo nhóm làm LEADER
 * 
 * @async
 * @route   POST /api/group
 * @method  createGroup
 * @param   {string} req.body.groupName - Tên của nhóm
 * @param   {string} req.body.userID - ID của người tạo nhóm
 * @returns {JSON} Thông tin nhóm vừa tạo hoặc lỗi server
 */
const createGroup=async(req,res)=>{
    try {
        const {groupName,userID}=req.body;
        //kiểm tra groupName
        if(!groupName||!groupName.trim()){
            console.log("thiếu groupName khi tạo group");
            return res.status(400).json({message:"thiếu groupName khi tạo group"});
        }

        //kiểm tra userID
        const checkUser= await User.findOne({userID});
        if(!checkUser){
            console.log("không tìm thấy userID khi tạo group");
            return res.status(400).json({message:"không tìm thấy userID"});
        }
        
        //tạo group, lưu vào db
        const groupID=`group-${uuidv4().split('-')[0]}`;
        const newGroup=new Group({groupID,groupName})
        await newGroup.save();

        //thêm user vào member của group với memberRole là LEADER
        const leader=new Member({groupID,userID,memberRole:"LEADER"});
        await leader.save();

        res.status(200).json({message:"tạo group thành công",group:newGroup,leader:leader})
    } catch (error) {
        console.log("lỗi khi tạo group:",error);
        res.status(500).json({message:"Lỗi server khi tạo group",error:error})
    }
}

/**
 * Cho phép một người dùng tham gia nhóm
 *
 * @method  joinGroup
 * @param   {string} userID - ID của người dùng muốn tham gia nhóm
 * @param   {string} groupID - ID của nhóm mà người dùng muốn tham gia
 * @returns {boolean|string} Trả về true nếu tham gia thành công, ngược lại trả về lỗi
 */
const joinGroup=async(userID,groupID)=>{
    try {
        //kiểm tra groupID
        const checkGroup=await Group.findOne({groupID});
        if(!checkGroup){
            console.log("không tìm thấy groupID");
            return "không tìm thấy groupID";
        }

        //kiểm tra userID
        const checkUser= await User.findOne({userID});
        if(!checkUser){
            console.log("không tìm thấy userID");
            return "không tìm thấy userID";
        }

        //kiểm tra xem user đã là member của group chưa
        const checkMember=await Member.findOne({userID,groupID});
        if(checkMember){
            console.log("user đã là thành viên của nhóm này");
            return "user đã là thành viên của nhóm này";
        }

        //tạo member với memberRole là "MEMBER", lưu vào db
        const newMember=new Member({userID,groupID,memberRole:"MEMBER"});
        await newMember.save();

        return true;
    } catch (error) {
        console.log(`lỗi khi user ${userID} tham gia nhóm ${groupID}: ${error}`);
        return `Lỗi server:${error}`;
    }
}

/**
 * Cho phép một người dùng rời nhóm
 *
 * @async
 * @method  leaveGroup
 * @param   {string} userID - ID của người dùng muốn rời nhóm
 * @param   {string} groupID - ID của nhóm mà người dùng muốn rời
 * @returns {boolean|string} Trả về true nếu rời nhóm thành công, ngược lại trả về lỗi
 */
const leaveGroup=async(userID,groupID)=>{
    try {
        //kiểm tra groupID
        const checkGroup=await Group.findOne({groupID});
        if(!checkGroup){
            console.log("không tìm thấy groupID");
            return "không tìm thấy groupID";
        }

        //kiểm tra userID
        const checkUser= await User.findOne({userID});
        if(!checkUser){
            console.log("không tìm thấy userID");
            return "không tìm thấy userID";
        }

        //kiểm tra xem user có phải member của group không
        const checkMember=await Member.findOne({userID,groupID});
        if(!checkMember){
            console.log("user không phải thành viên của nhóm này");
            return "user không phải thành viên của nhóm này";
        }

        //đẩy 1 thành viên bất kỳ lên làm LEADER
        const randomMember=await Member.findOne({groupID,userID:{$ne:userID}});
        
        //nếu nhóm không còn ai thì xóa nhóm luôn
        if(!randomMember)
            await Group.deleteOne({groupID});

        //xóa user khỏi nhóm
        await Member.deleteOne({userID,groupID})

        return true;
    } catch (error) {
        console.log(`lỗi khi user ${userID} rời nhóm ${groupID}: ${error}`);
        return `Lỗi server:${error}`;
    }
}

/**
 * Xóa một thành viên khỏi nhóm
 *
 * @async
 * @method  kickMember
 * @param   {string} userID - ID của người dùng bị kick khỏi nhóm
 * @param   {string} groupID - ID của nhóm mà người dùng bị kick khỏi
 * @returns {boolean|string} Trả về true nếu kick thành công, ngược lại trả về lỗi
 */

const kickMember=async(userID,groupID)=>{
    try {
        //kiểm tra groupID
        const checkGroup=await Group.findOne({groupID});
        if(!checkGroup){
            console.log("không tìm thấy groupID");
            return "không tìm thấy groupID";
        }

        //kiểm tra userID
        const checkUser= await User.findOne({userID});
        if(!checkUser){
            console.log("không tìm thấy userID");
            return "không tìm thấy userID";
        }

        //kiểm tra xem user có phải member của group không
        const checkMember=await Member.findOne({userID,groupID});
        if(!checkMember){
            console.log("user không phải thành viên của nhóm này");
            return "user không phải thành viên của nhóm này";
        }

        //xóa user khỏi nhóm
        await Member.deleteOne({userID,groupID})

        return true;
    } catch (error) {
        console.log(`lỗi khi kick user ${userID} khỏi nhóm ${groupID}: ${error}`);
        return `Lỗi server:${error}`;
    }
}

/**
 * Xóa nhóm và tất cả thành viên của nhóm đó
 *
 * @async
 * @method  deleteGroup
 * @param   {string} groupID - ID của nhóm cần xóa
 * @returns {boolean|string} Trả về true nếu xóa thành công, ngược lại trả về lỗi
 */
const deleteGroup=async(groupID)=>{
    const session = await Group.startSession();
    session.startTransaction();

    try {
        //kiểm tra groupID
        const checkGroup=await Group.findOne({groupID});
        if(!checkGroup){
            console.log("không tìm thấy groupID");
            await session.abortTransaction(); // Rollback nếu không tìm thấy
            session.endSession();
            return "không tìm thấy groupID";
        }

        //xóa các user khỏi group
        await Member.deleteMany({groupID:groupID}).session(session);

        //xóa nhóm
        await Group.deleteOne({groupID}).session(session);;

        // Xác nhận xóa thành công
        await session.commitTransaction();
        session.endSession();

        return true;
    } catch (error) {
        // Nếu có lỗi, rollback transaction
        await session.abortTransaction();
        session.endSession();

        console.log(`lỗi khi xóa nhóm ${groupID}: ${error}`);
        return `Lỗi server:${error}`;
    }
}
module.exports={createGroup,joinGroup,leaveGroup,kickMember,deleteGroup};