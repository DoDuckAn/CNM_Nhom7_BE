const MessageTypeModel = require('../models/MessageType');

/**
 * Lấy danh sách tất cả messageType
 * 
 * @route   GET /api/messageType
 * @method  getAllMessageType
 * @returns {JSON} Danh sách tất cả messageType hoặc lỗi server
 */
const getAllMessageType = async (req, res) => {
    try {
      const messageTypes = await MessageTypeModel.getAll();
      res.status(200).json(messageTypes);
    } catch (error) {
      console.error('Lỗi khi getAllMessageType:', error);
      res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
  };

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
const addMessageType = async (req, res) => {
    try {
      const { typeID, typeName } = req.body;
  
      if (!typeID || !typeName) {
        return res.status(400).json({ message: 'Thiếu typeID hoặc typeName' });
      }
  
      const existing = await MessageTypeModel.findById(typeID);
      if (existing) {
        return res.status(400).json({ message: 'typeID đã tồn tại' });
      }
  
      const newItem = await MessageTypeModel.create({ typeID, typeName });
      res.status(200).json({ message: 'Thêm messageType thành công', data: newItem });
    } catch (error) {
      console.error('Lỗi khi addMessageType:', error);
      res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
  };

/**
 * Xóa messageType theo ID
 * 
 * @route   DELETE /api/messageType/:id
 * @method  deleteMessageTypeById
 * @param   {string} req.params.id - ID của messageType cần xóa
 * @returns {JSON} Kết quả xóa messageType hoặc lỗi server
 */
const deleteMessageTypeById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const existing = await MessageTypeModel.findById(id);
      if (!existing) {
        return res.status(404).json({ message: 'messageType không tồn tại' });
      }
  
      await MessageTypeModel.delete(id);
      res.status(200).json({ message: 'Xóa messageType thành công' });
    } catch (error) {
      console.error('Lỗi khi deleteMessageTypeById:', error);
      res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
};

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
const renameMessageType = async (req, res) => {
    try {
      const { id } = req.params;
      const { typeName } = req.body;
  
      if (!id || !typeName) {
        return res.status(400).json({ message: 'Thiếu typeID hoặc typeName' });
      }
  
      const updatedItem = await MessageTypeModel.update(id, typeName);
      if (!updatedItem) {
        return res.status(404).json({ message: 'Không tìm thấy messageType để cập nhật' });
      }
  
      res.status(200).json({ message: 'Cập nhật messageType thành công', data: updatedItem });
    } catch (error) {
      console.error('Lỗi khi renameMessageType:', error);
      res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
  };

module.exports={getAllMessageType,addMessageType,deleteMessageTypeById,renameMessageType};