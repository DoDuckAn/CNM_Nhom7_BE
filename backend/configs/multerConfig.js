const multer = require("multer");
const path = require("path");

// Kiểm tra loại file hợp lệ
const fileFilter = (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/mkv", "video/quicktime", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    
    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(new Error("Loại file không được hỗ trợ!"), false);
    }
};

// Cấu hình lưu trữ tạm thời trên server
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "uploads/"); // Lưu file tạm trước khi upload lên Cloudinary
    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + "-" + file.originalname); // Tạo tên file không trùng lặp
    },
});

// Cấu hình multer với giới hạn dung lượng file
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // Giới hạn file 50MB
    fileFilter,
});

module.exports = upload;