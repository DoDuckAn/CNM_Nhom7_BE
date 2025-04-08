const { dynamoDB } = require("../utils/aws-helper");

const TABLE_NAME = 'Users';

const UserModel = {
  async GetAllUsers() {
    const params = {
      TableName: TABLE_NAME,
    };
    const data = await dynamoDB.scan(params).promise();
    return data.Items || [];
  },

  async GetUserByID(userID) {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'userID = :uid',
      ExpressionAttributeValues: {
        ':uid': userID
      }
    };
  
    const data = await dynamoDB.query(params).promise();
    return data.Items?.[0] || null; // vì query trả về mảng
  },

  async GetUserByPhone(phoneNumber) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'phoneNumber = :phoneNumber',
      ExpressionAttributeValues: {
        ':phoneNumber': phoneNumber,
      },
    };
    const data = await dynamoDB.scan(params).promise();
    return data.Items?.[0];
  },

  async CreateUser(userData) {
    const params = {
      TableName: TABLE_NAME,
      Item: userData,
    };
    await dynamoDB.put(params).promise();
    return userData;
  },

  async UpdateUser(userID, phoneNumber, updateFields) {
    const attributeUpdates = Object.entries(updateFields).map(([key, val], i) => `#key${i} = :val${i}`);
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    Object.keys(updateFields).forEach((key, i) => {
      ExpressionAttributeNames[`#key${i}`] = key;
      ExpressionAttributeValues[`:val${i}`] = updateFields[key];
    });

    const params = {
      TableName: TABLE_NAME,
      Key: { 
        userID,
        phoneNumber
    },
      UpdateExpression: `SET ${attributeUpdates.join(', ')}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    const result = await dynamoDB.update(params).promise();
    return result.Attributes;
  },

  async AddContact(userID, newContact) {
    const user = await this.GetUserByID(userID);
    if (!user) return null;

    const updatedContacts = [...(user.contacts || []), newContact];
    return this.UpdateUser(userID, user.phoneNumber, { contacts: updatedContacts });
  },
};

module.exports=UserModel