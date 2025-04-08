const { v4: uuidv4 } = require('uuid');
const { dynamoDB } = require('../utils/aws-helper');

const TABLE_NAME = 'RefreshTokens';

const RefreshTokenModel = {
  async create(userID, refreshToken) {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        tokenID: uuidv4(),          
        userID,
        refreshToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // TTL: 7 ngày
      }
    };
    await dynamoDB.put(params).promise();
    return params.Item;
  },

  async findByToken(refreshToken) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'RefreshTokenIndex', // tạo GSI với key là refreshToken
      KeyConditionExpression: 'refreshToken = :token',
      ExpressionAttributeValues: {
        ':token': refreshToken
      }
    };
    const data = await dynamoDB.query(params).promise();
    return data.Items && data.Items.length > 0 ? data.Items[0] : null;
  },

  async delete(refreshToken) {
    const tokenItem = await this.findByToken(refreshToken);
    if (!tokenItem) return null;

    const params = {
      TableName: TABLE_NAME,
      Key: {
        tokenID: tokenItem.tokenID
      }
    };
    await dynamoDB.delete(params).promise();
    return true;
  }
};

module.exports = RefreshTokenModel;