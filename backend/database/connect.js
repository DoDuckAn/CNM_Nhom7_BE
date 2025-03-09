const mongoose=require('mongoose')
require('dotenv').config()

const connectDB=async()=>{
    try {
        await mongoose.connect(process.env.CONNECTION_STRING,{
            // useNewUrlParser:true,
            // useUnifiedTopology:true,
        })
        console.log('kết nối DB thành công '+mongoose.connection.host+' '+mongoose.connection.name)        
    } catch (error) {
        console.log('lỗi kết nối:'+error);
        process.exit(1)
    }
}

module.exports=connectDB;

