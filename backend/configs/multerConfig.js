const cloudinary=require('./cloudinaryConfig');
const multer=require('multer');
const path=require('path');

const storage=multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null, "uploads/");
    },
    filename:(req,file,callback)=>{
        callback(null, Date.now() + "-" + file.originalname);// Tạo tên file không trùng lặp
    },
});

const upload=multer({storage});

module.exports=upload;