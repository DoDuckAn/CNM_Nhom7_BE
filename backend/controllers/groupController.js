const {v4:uuidv4}=require('uuid');
const Member = require('../models/Member');
const UserModel = require('../models/User');
const GroupModel = require('../models/Group');
const MemberModel = require('../models/Member');

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
        console.log(req.body);
        
        //kiểm tra groupName
        if(!groupName||!groupName.trim()){
            console.log("thiếu groupName khi tạo group");
            return res.status(400).json({message:"thiếu groupName khi tạo group"});
        }

        //kiểm tra userID
        const checkUser= await UserModel.GetUserByID(userID);
        if(!checkUser){
            console.log("không tìm thấy userID khi tạo group");
            return res.status(400).json({message:"không tìm thấy userID"});
        }
        
        //tạo group, lưu vào db
        const groupID=`group-${uuidv4().split('-')[0]}`;
        const newGroup=await GroupModel.createGroup(groupID,groupName);

        //thêm user vào member của group với memberRole là LEADER
        await MemberModel.create(userID,groupID,"LEADER")

        res.status(200).json({message:"tạo group thành công",group:newGroup})
    } catch (error) {
        console.log("lỗi khi tạo group:",error);
        res.status(500).json({message:"Lỗi server khi tạo group",error:error})
    }
}

/**
 * Tìm các nhóm mà người dùng tham gia
 * 
 * @async
 * @route   GET /api/group/:userID
 * @method  getUserGroups
 * @param   {string} req.params.userID - ID của user
 * @returns {JSON} Danh sách groupID của các nhóm đã tham gia hoặc lỗi server
 */
const getUserGroups=async(req,res)=>{
    try {
        const {userID}=req.params;

        //kiểm tra userID
        const checkUser= await UserModel.GetUserByID(userID);
        if(!checkUser){
            console.log("không tìm thấy userID");
            return res.status(400).json({message:"không tìm thấy userID"});
        }
        
        //tìm các group mà user tham gia
        const groupList=await MemberModel.findAllByUser(userID)

        res.status(200).json(groupList);
    } catch (error) {
        console.log("lỗi khi tìm các group user tham gia:",error);
        res.status(500).json({message:"Lỗi server khi tìm các group user tham gia",error:error})
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
        const checkGroup=await GroupModel.findByGroupID(groupID);
        if(!checkGroup){
            console.log("không tìm thấy groupID");
            return "không tìm thấy groupID";
        }

        //kiểm tra userID
        const checkUser= await UserModel.GetUserByID(userID);
        if(!checkUser){
            console.log("không tìm thấy userID");
            return "không tìm thấy userID";
        }

        //kiểm tra xem user đã là member của group chưa
        const checkMember=await MemberModel.findByUserAndGroup(userID,groupID);
        if(checkMember){
            console.log("user đã là thành viên của nhóm này");
            return "user đã là thành viên của nhóm này";
        }

        //tạo member với memberRole là "MEMBER", lưu vào db
        await MemberModel.create(userID,groupID,"MEMBER");
        //cập nhật số lượng thành viên của nhóm
        await GroupModel.updateGroup(groupID, {
            totalMembers: checkGroup.totalMembers + 1
        });
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
        const checkGroup=await GroupModel.findByGroupID(groupID);
        if(!checkGroup){
            console.log("không tìm thấy groupID");
            return "không tìm thấy groupID";
        }

        //kiểm tra userID
        const checkUser= await UserModel.GetUserByID(userID);
        if(!checkUser){
            console.log("không tìm thấy userID");
            return "không tìm thấy userID";
        }

        //kiểm tra xem user có phải member của group không
        const checkMember=await MemberModel.findByUserAndGroup(userID,groupID);
        if(!checkMember){
            console.log("user không phải thành viên của nhóm này");
            return "user không phải thành viên của nhóm này";
        }
        //nếu nhóm không còn ai thì xóa nhóm luôn
        const allMembers=await MemberModel.findAllByGroup(groupID);
        const remainingMembers = allMembers.filter(member => member.userID !== userID);
        if(remainingMembers.length===0)
            await GroupModel.deleteGroup(groupID);
        else{
            //nếu người rời nhóm là LEADER, đẩy 1 thành viên bất kỳ lên làm LEADER
            if(checkMember.memberRole==="LEADER"){
                const newLeader=remainingMembers[0];
                await MemberModel.updateRole(newLeader.userID,groupID,"LEADER")
            }
        }
        
        //xóa user khỏi nhóm
        await MemberModel.delete(userID,groupID)
        await GroupModel.updateGroup(groupID, {
            totalMember: checkGroup.totalMember-1
        });
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
        const checkGroup=await GroupModel.findByGroupID(groupID);
        if(!checkGroup){
            console.log("không tìm thấy groupID");
            return "không tìm thấy groupID";
        }

        //kiểm tra userID
        const checkUser= await UserModel.GetUserByID(userID);
        if(!checkUser){
            console.log("không tìm thấy userID");
            return "không tìm thấy userID";
        }

        //kiểm tra xem user có phải member của group không
        const checkMember=await MemberModel.findByUserAndGroup(userID,groupID);
        if(!checkMember){
            console.log("user không phải thành viên của nhóm này");
            return "user không phải thành viên của nhóm này";
        }

        //xóa user khỏi nhóm
        await MemberModel.delete(userID,groupID);
        await GroupModel.updateGroup(groupID, {
            totalMember: checkGroup.totalMember-1
        });

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
    try {
        //kiểm tra groupID
        const checkGroup=await GroupModel.findByGroupID(groupID);
        if(!checkGroup){
            console.log("không tìm thấy groupID");
            return "không tìm thấy groupID";
        }

        //xóa các user khỏi group
        await MemberModel.deleteAllByGroup(groupID)

        //xóa nhóm
        await GroupModel.deleteGroup(groupID);

        return true;
    } catch (error) {
        console.log(`lỗi khi xóa nhóm ${groupID}: ${error}`);
        return `Lỗi server:${error}`;
    }
}

/**
 * Lấy danh sách tất cả nhóm hiện có trong hệ thống
 * 
 * @async
 * @route   GET /api/group
 * @method  getAllGroup
 * @returns {JSON} Trả về danh sách tất cả các nhóm hoặc lỗi server
 */
const getAllGroup=async(req,res)=>{
    try {
        let data=await GroupModel.getAllGroup();
        res.status(200).json({data:data})
    } catch (error) {
        res.status(500).json({message:`Lỗi server: ${error}`})
    }
}

/**
 * Lấy danh sách tất cả thành viên trong một nhóm
 * 
 * @async
 * @route   GET /api/group/:groupID/users
 * @method  getAllGroupUsers
 * @param   {string} req.params.groupID - ID của nhóm cần lấy thành viên
 * @returns {JSON} Danh sách thành viên trong nhóm hoặc lỗi nếu không tìm thấy groupID hoặc lỗi server
 */
const getAllGroupUsers=async(req,res)=>{
    try {
        const {groupID}=req.params;
        const group=await GroupModel.findByGroupID(groupID);
        if(!group){
            console.log(`không tìm thấy groupID: ${groupID}`);
            res.status(404).json({message:`không tìm thấy groupID: ${groupID}`})
        }

        const data=await MemberModel.findAllByGroup(groupID);
        res.status(200).json({data:data})
    } catch (error) {
        
    }
}

/**
 * Chuyển quyền LEADER trong nhóm cho thành viên khác
 *
 * @async
 * @method  switchRoleInGroup
 * @param   {string} userID - ID của người hiện tại là LEADER
 * @param   {string} targetUserID - ID của thành viên sẽ trở thành LEADER
 * @param   {string} groupID - ID của nhóm
 * @returns {boolean|string} Trả về true nếu chuyển thành công, hoặc thông báo lỗi
 */
const switchRoleInGroup = async (userID, targetUserID, groupID) => {
    try {
      // Kiểm tra nhóm có tồn tại không
      const group = await GroupModel.findByGroupID(groupID);
      if (!group) {
        return "Không tìm thấy nhóm";
      }
  
      // Kiểm tra cả hai người dùng có là thành viên của nhóm không
      const currentLeader = await MemberModel.findByUserAndGroup(userID, groupID);
      const targetMember = await MemberModel.findByUserAndGroup(targetUserID, groupID);
  
      if (!currentLeader || !targetMember) {
        return "Một trong hai người dùng không phải thành viên nhóm";
      }
  
      // Kiểm tra userID hiện tại có phải LEADER không
      if (currentLeader.memberRole !== "LEADER") {
        return "Người dùng hiện tại không phải là LEADER";
      }
  
      // Cập nhật quyền
      await MemberModel.updateRole(targetUserID, groupID, "LEADER"); // LEADER mới
      await MemberModel.updateRole(userID, groupID, "MEMBER");       // LEADER cũ thành MEMBER
  
      return true;
    } catch (error) {
      console.log(`Lỗi khi chuyển quyền trong nhóm ${groupID}: ${error}`);
      return `Lỗi server: ${error}`;
    }
  };

  /**
 * Lấy thông tin nhóm theo groupID
 * 
 * @async
 * @route   GET /api/group/:groupID/info
 * @method  getGroupByID
 * @param   {string} req.params.groupID - ID của nhóm cần lấy thông tin
 * @returns {JSON} Thông tin nhóm hoặc lỗi nếu không tìm thấy groupID hoặc lỗi server
 */
  const getGroupByID=async(req,res)=>{
    try {
        const {groupID}=req.params;
        const group=await GroupModel.findByGroupID(groupID);
        if(!group){
            console.log(`không tìm thấy groupID: ${groupID}`);
            res.status(404).json({message:`không tìm thấy groupID: ${groupID}`})
        }
        res.status(200).json({data:group})
    } catch (error) {
        console.log(`lỗi khi lấy thông tin nhóm ${groupID}: ${error}`);
        res.status(500).json({message:`Lỗi server: ${error}`})
    }
}

/**
 * Đổi tên nhóm
 *
 * @async
 * @method  renameGroup
 * @param   {string} groupID - ID của nhóm cần đổi tên
 * @param   {string} newGroupName - Tên mới cho nhóm
 * @returns {boolean|string} Trả về true nếu cập nhật thành công, hoặc thông báo lỗi
 */
const renameGroup = async (groupID, newGroupName) => {
    try {
      // Kiểm tra group có tồn tại không
      const group = await GroupModel.findByGroupID(groupID);
      if (!group) {
        return "Không tìm thấy nhóm";
      }
  
      // Cập nhật tên nhóm
      await GroupModel.updateGroup(groupID, { groupName: newGroupName });
      return true;
    } catch (error) {
      console.log(`Lỗi khi đổi tên nhóm ${groupID}: ${error}`);
      return `Lỗi server: ${error}`;
    }
  };
  
module.exports={createGroup,joinGroup,leaveGroup,kickMember,deleteGroup,getUserGroups,getAllGroup,getAllGroupUsers,switchRoleInGroup,getGroupByID,renameGroup};