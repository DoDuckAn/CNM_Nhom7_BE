const { dynamoDB } = require("../utils/aws-helper");

const TABLE_NAME = 'OTPCodes';

const OTPCodeModel = {
  async saveOTP(gmail, hashedOTP) {
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const expireAt = now + 300; // 5 minutes

    const params={
      TableName: TABLE_NAME,
      Item: {
        gmail,
        OTP: hashedOTP,
        expireAt
      }
    };
    await dynamoDB.put(params).promise();
  },

  async getOTPByGmail(gmail) {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        gmail
      }
    };

    const result = await dynamoDB.get(params).promise();
    return result.Item;
  },

  async deleteOTPByGmail(gmail) {
    const params={
      TableName: TABLE_NAME,
      Key: { gmail }
    };
    await dynamoDB.delete(params).promise();
  }
};

module.exports = OTPCodeModel;