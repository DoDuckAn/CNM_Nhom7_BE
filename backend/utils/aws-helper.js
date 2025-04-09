const aws=require('aws-sdk');
require('dotenv').config();
const path=require('path')
const fs=require('fs')

aws.config.update({
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey:process.env.AWS_SECRET_KEY,
    region:process.env.REGION
});

const dynamoDB=new aws.DynamoDB.DocumentClient();
const s3=new aws.S3()

// Hàm upload file lên S3
const uploadFileToS3 = async (filePath) => {
    const fileContent = fs.readFileSync(filePath);
    const fileExtension = path.extname(filePath);
    const uniqueFileName = path.basename(filePath);

    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: uniqueFileName,
        Body: fileContent,
        ContentType: getMimeType(fileExtension),
    };

    try {
        const result = await s3.upload(params).promise();
        return result.Location;
    } catch (err) {
        console.error("Upload S3 lỗi:", err);
        throw err;
    }
};

// Hàm xóa file local sau khi upload
const deleteLocalFile = async (filePath) => {
    try {
        await fs.promises.unlink(filePath);
        console.log("Đã xóa file local:", filePath);
    } catch (err) {
        console.error("Lỗi khi xóa file local:", err);
    }
};

// Hàm xác định MIME type từ đuôi file
const getMimeType = (ext) => {
    const map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".mp4": "video/mp4",
        ".mkv": "video/x-matroska",
        ".mov": "video/quicktime",
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };
    return map[ext.toLowerCase()] || "application/octet-stream";
};

module.exports={dynamoDB,s3,uploadFileToS3,deleteLocalFile};