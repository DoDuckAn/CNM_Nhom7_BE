const aws=require('aws-sdk');
require('dotenv').config();

aws.config.update({
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey:process.env.AWS_SECRET_KEY,
    region:process.env.REGION
});

const dynamoDB=new aws.DynamoDB.DocumentClient();
const s3=new aws.S3()

module.exports={dynamoDB,s3};