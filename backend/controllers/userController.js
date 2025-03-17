const User=require('../models/User')
const {v4:uuidv4}=require('uuid')
const bcrypt=require('bcrypt')

/**
 * Lấy danh sách tất cả người dùng (ẩn mật khẩu)
 *
 * @route   GET /api/user
 * @method  getAllUsers
 * @returns {JSON} Danh sách user hoặc lỗi server
 */
const getAllUsers=async(req,res)=>{
    try {
        const users=await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({message:'lỗi server', error: error.message });
    }
}

/**
 * Tìm user theo userID
 *
 * @route   GET /api/users/:userID
 * @method  findUserByUserID
 * @param   {Object} req - Request từ client
 * @param   {string} req.params.userID - ID của user cần tìm
 * @returns {JSON} Thông tin user hoặc lỗi server
 */
const findUserByUserID=async(req,res)=>{
    try {
        const userID=req.params.userID;
        const user=await User.findOne({userID}).select('-password');
        if(!user)
            return res.status(404).json({message:`không tìm thấy user có ID ${userID}`});
        res.status(200).json(user);
    } catch (error) {
        console.log('lỗi khi tìm user');
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}

/**
 * Thêm user mới
 *
 * @route   POST /api/user
 * @method  addUser
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.phoneNumber - Số điện thoại của user
 * @param   {string} req.body.password - Mật khẩu của user
 * @param   {string} req.body.username - Tên người dùng
 * @param   {string} req.body.DOB - Ngày sinh của user
 * @returns {JSON} Kết quả thêm user hoặc lỗi server
 */
const addUser=async(req,res)=>{
    try {
        const {phoneNumber,password,username,DOB}=req.body;

        //check sdt trùng
        const existingPhoneNumber=await User.findOne({phoneNumber});
        if(existingPhoneNumber){
            return res.status(400).json({message:'SĐT đã được đăng ký'})
        }
        //Tạo userID bằng uuid
        const userID=uuidv4().split('-')[0]
        //băm mật khẩu
        const saltRound=10;
        const hashedPassword=await  bcrypt.hash(password,saltRound)

        const newUser=new User({userID,phoneNumber,password:hashedPassword,username,accountRole:'USER',DOB})
        await newUser.save();
        res.status(201).json('thêm user thành công: '+newUser);
    } catch (error) {
        res.status(500).json({message:'lỗi server', error: error.message })
    }
}

/**
 * Đăng nhập
 *
 * @route   POST /api/user/login
 * @method  loginUser
 * @param   {Object} req - Request từ client
 * @param   {string} req.body.phoneNumber - Số điện thoại của user
 * @param   {string} req.body.password - Mật khẩu của user
 * @returns {JSON} Kết quả đăng nhập hoặc lỗi server
 */

const loginUser=async(req,res)=>{
    try {
        const{phoneNumber,password}=req.body;
        const user=await User.findOne({phoneNumber});
        if(!user)
            return res.status(400).json({message:'số điện thoại chưa được đăng ký'})
        const checkPassword=await bcrypt.compare(password,user.password);
        if(!checkPassword)
            return res.status(400).json({message:'mật khẩu sai'});
        res.status(200).json({message:'đăng nhập thành công ',user})
    } catch (error) {
        res.status(500).json({message:'Lỗi server', error: error.message })
    }
}

/**
 * Đổi mật khẩu người dùng
 *
 * @route   PUT /api/user/changePassword/:phoneNumber
 * @method  changePassword
 * @param   {Object} req - Request từ client
 * @param   {string} req.params.phoneNumber - Số điện thoại của user cần đổi mật khẩu
 * @param   {string} req.body.newPassword - Mật khẩu mới của user
 * @returns {JSON} Thông báo kết quả đổi mật khẩu hoặc lỗi server
 */

const changePassword = async (req, res) => {
    try {
        const {phoneNumber} = req.params;
        const {newPassword} = req.body;

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            console.log("Không tìm thấy user khi đổi password");
            return res.status(404).json({ message: "Không tìm thấy số điện thoại", phoneNumber });
        }

        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Lỗi khi đổi mật khẩu:", error);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};


/**
 * Cập nhật thông tin người dùng
 *
 * @route   PUT /api/user
 * @method  updateUserInfo
 * @param   {Object} req - Request từ client
 * @param   {string} req.params.userID - ID của người dùng cần cập nhật
 * @param   {string} req.body.username - Tên người dùng mới
 * @param   {string} req.body.DOB - Ngày sinh mới của người dùng
 * @returns {JSON} Trả về thông báo cập nhật thành công hoặc lỗi server
 */
const updateUserInfo=async(req,res)=>{
    try {
        const {userID}=req.params;
        const {username,DOB}=req.body;
        const user=await User.findOneAndUpdate(
            {userID:userID},
            {
                username:username,
                DOB:DOB
            },
            {new:true}
        );

        res.status(200).json({message:"Đã cập nhật thông tin user",user});
    } catch (error) {
        console.log("Lỗi khi upadateUserInfo");
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
}
module.exports={getAllUsers,addUser,loginUser,findUserByUserID,changePassword,updateUserInfo};