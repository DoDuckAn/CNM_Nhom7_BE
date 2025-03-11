const MessageType=require('../models/messageType');

/**
 * Lấy danh sách tất cả messageType
 * 
 * @route   GET /api/messageType
 * @method  getAllMessageType
 * @returns {JSON} Danh sách tất cả messageType hoặc lỗi server
 */
const getAllMessageType=async(req,res)=>{
    try {
        const messageTypeList=await MessageType.find();
        res.status(200).json(messageTypeList);
    } catch (error) {
        console.log('lỗi khi getAllMessageType');
        res.status(500).json({message:`Lỗi server: ${error}`})
    }
}

/**
 * Thêm một messageType mới
 * 
 * @route   POST /api/messageType
 * @method  addMessageType
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.typeID - ID của messageType
 * @param   {string} req.body.typeName - Tên của messageType
 * @returns {JSON} Kết quả thêm messageType hoặc lỗi server
 */
const addMessageType=async(req,res)=>{
    try {
        const {typeID,typeName}=req.body;
        const checkTypeID=await MessageType.findOne({typeID});
        if(checkTypeID){
            console.log('typeID đã tồn tại');
            return res.status(400).json({message:'typeID đã tồn tại'});
        }
        const newMessageType=new MessageType({typeID,typeName});
        await newMessageType.save();
        res.status(200).json({message:`Thêm messageType thành công: ${newMessageType}`})
    } catch (error) {
        console.log('Lỗi khi addMessageType');        
        res.status(500).json({message:`Lỗi server: ${error}`});
    }
}

/**
 * Xóa messageType theo ID
 * 
 * @route   DELETE /api/messageType/:id
 * @method  deleteMessageTypeById
 * @param   {string} req.params.id - ID của messageType cần xóa
 * @returns {JSON} Kết quả xóa messageType hoặc lỗi server
 */
const deleteMessageTypeById=async(req,res)=>{
    try {
        const {id}=req.params;
        const delMessageType=await MessageType.findOneAndDelete({typeID:id});
        if(!delMessageType){
            console.log('Không tìm thấy messagetype cần xóa');            
            return res.status(404).json({message:'messageType không tồn tại'});
        }
        res.status(200).json({message:'Xóa messageType thành công'});
    } catch (error) {
        res.status(500).json({message: `Lỗi server: ${error}`});
    }
}

/**
 * Đổi tên messageType theo ID
 * 
 * @route   PUT /api/messageType/:id
 * @method  renameMessageType
 * @param   {Object} req - Request từ client
 * @param   {string} req.params.id - ID của messageType cần đổi tên
 * @param   {string} req.body.typeName - Tên mới của messageType
 * @returns {JSON} Kết quả cập nhật messageType hoặc lỗi server
 */
const renameMessageType=async(req,res)=>{
    try {
        const {id}=req.params;
        const {typeName}=req.body;

        if(!id||!typeName){
            console.log('thiếu typeid hoặc typename khi rename messageType');
            return res.status(404).json({message:'thiếu typeid hoặc typename'});
        }

        const updatedMessageType=await MessageType.findOneAndUpdate(
            {typeID:id},
            {$set:{typeName}},
            {new:true}
        )

        if(!updatedMessageType){
            console.log('Không tìm thấy messageType cần rename');            
            return res.status(404).json({message:'Không tìm thấy messageType cần rename'});
        }

        res.status(200).json({message:`Rename messageType thành công`});
    } catch (error) {
        console.log('Lỗi khi rename messageType');
        res.status(500).json({message:`Lỗi server: ${error}`});
    }
}

module.exports={getAllMessageType,addMessageType,deleteMessageTypeById,renameMessageType};