const { dynamoDB } = require("../utils/aws-helper");

const TABLE_NAME = 'Messages'; // bạn có thể đổi tên bảng nếu cần

const MessageModel = {
  /**
   * Lưu tin nhắn mới vào DynamoDB
   */
  async saveMessage({
    senderID,
    receiverID,
    groupID = null,
    seenStatus = [],
    deleteStatus = false,
    recallStatus = false,
    messageTypeID,
    context,
    messageID,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
  }) {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        messageID,
        senderID,
        receiverID,
        groupID,
        seenStatus,
        deleteStatus,
        recallStatus,
        messageTypeID,
        context,
        createdAt,
        updatedAt,
      },
    };

    await dynamoDB.put(params).promise();
    return params.Item;
  },

  /**
   * Lấy tất cả tin nhắn giữa hai người trong chat đơn
   */
  async getMessagesBetweenUsers(userID1, userID2) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: '(senderID = :u1 AND receiverID = :u2) OR (senderID = :u2 AND receiverID = :u1)',
      ExpressionAttributeValues: {
        ':u1': userID1,
        ':u2': userID2,
      },
    };

    const result = await dynamoDB.scan(params).promise();
    return result.Items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  /**
   * Lấy tất cả tin nhắn trong group
   */
  async getMessagesInGroup(groupID) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GroupIndex',
      KeyConditionExpression: 'groupID = :gid',
      ExpressionAttributeValues: {
        ':gid': groupID,
      },
    };

    const result = await dynamoDB.query(params).promise();
    return result.Items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  /**
   * Lấy tin nhắn theo ID
   */
  async getMessageByID(messageID) {
    const params = {
      TableName: TABLE_NAME,
      Key: { messageID },
    };

    const result = await dynamoDB.get(params).promise();
    return result.Item;
  },

  /**
   * Cập nhật tin nhắn theo ID
   */
  async updateMessage(messageID, updateFields) {
    if (!messageID || !updateFields || Object.keys(updateFields).length === 0) {
      throw new Error("Thiếu messageID hoặc không có trường nào để cập nhật");
    }
  
    const attributeUpdates = Object.entries(updateFields).map(
      ([key, val], i) => `#key${i} = :val${i}`
    );
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
  
    Object.keys(updateFields).forEach((key, i) => {
      ExpressionAttributeNames[`#key${i}`] = key;
      ExpressionAttributeValues[`:val${i}`] = updateFields[key];
    });
  
    const params = {
      TableName: TABLE_NAME,
      Key: { messageID },
      UpdateExpression: `SET ${attributeUpdates.join(', ')}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };
  
    const result = await dynamoDB.update(params).promise();
    return result.Attributes;
  }
  
};

module.exports = MessageModel;