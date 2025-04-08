const {v4:uuidv4}=require('uuid')
const bcrypt=require('bcrypt');
const UserModel = require('../models/User');

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.GetAllUsers();
    const usersWithoutPassword = users.map(({ password, ...rest }) => rest);
    res.json(usersWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const findUserByUserID = async (req, res) => {
  try {
    const { userID } = req.params;
    const user = await UserModel.GetUserByID(userID);
    if (!user) return res.status(404).json({ message: `Không tìm thấy user có ID ${userID}` });
    const { password, ...rest } = user;
    res.status(200).json(rest);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const addUser = async (req, res) => {
  try {
    const { phoneNumber, password, username, DOB } = req.body;
    const existingUser = await UserModel.GetUserByPhone(phoneNumber);
    if (existingUser) return res.status(400).json({ message: 'SĐT đã được đăng ký' });

    const userID = uuidv4().split('-')[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      userID,
      phoneNumber,
      password: hashedPassword,
      username,
      accountRole: 'USER',
      DOB,
      conversationsID: [],
      groupsID: [],
      contacts: [],
    };

    await UserModel.CreateUser(newUser);
    res.status(201).json({ message: 'Thêm user thành công', userID });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { newPassword } = req.body;
    const user = await UserModel.GetUserByPhone(phoneNumber);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy số điện thoại' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.UpdateUser(user.userID, phoneNumber,{ password: hashedNewPassword });
    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const updateUserInfo = async (req, res) => {
  try {
    const { userID } = req.params;
    const { username, DOB } = req.body;
    const user = await UserModel.GetUserByID(userID);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy userID' });

    const updatedUser = await UserModel.UpdateUser(userID, user.phoneNumber,{ username, DOB });
    res.status(200).json({ message: 'Đã cập nhật thông tin user', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const getAllContacts = async (req, res) => {
  try {
    const { userID } = req.params;
    const user = await UserModel.GetUserByID(userID);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy userID' });
    res.status(200).json(user.contacts || []);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const addContacts = async (req, res) => {
  try {
    const { userID } = req.params;
    const { contactID } = req.body;
    if (!contactID) return res.status(400).json({ message: 'Thiếu contactID' });

    const user = await UserModel.GetUserByID(userID);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy userID' });

    if ((user.contacts || []).some((contact) => contact.userID === contactID)) {
      return res.status(400).json({ message: 'Contact đã tồn tại' });
    }

    const contact = await UserModel.GetUserByID(contactID);
    if (!contact) return res.status(404).json({ message: 'Không tìm thấy contact' });

    await UserModel.AddContact(userID, { userID: contact.userID, username: contact.username });
    res.status(200).json({ message: 'Thêm contact thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports={getAllUsers,findUserByUserID,addUser,changePassword,updateUserInfo,getAllContacts,addContacts}