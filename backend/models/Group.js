const { dynamoDB } = require("../utils/aws-helper");

const TABLE_NAME = 'Groups';

const GroupModel = {
  async getAllGroup(){
    const params={
      TableName:TABLE_NAME
    }
    let data=await dynamoDB.scan(params).promise();
    return data.Items;
  },

  async createGroup(groupID, groupName) {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        groupID,
        groupName,
        totalMembers: 1, // mặc định 1 khi tạo
      },
    };
    console.log(params);
    
    await dynamoDB.put(params).promise();
    return params.Item;
  },

  async findByGroupID(groupID) {
    const params = {
      TableName: TABLE_NAME,
      Key: { groupID },
    };
    const data = await dynamoDB.get(params).promise();
    return data.Item || null;
  },

  async deleteGroup(groupID) {
    const params = {
      TableName: TABLE_NAME,
      Key: { groupID },
    };
    await dynamoDB.delete(params).promise();
    return true;
  },

  async updateGroup(groupID, updateFields) {
    if (!groupID || !updateFields || Object.keys(updateFields).length === 0) {
      throw new Error("Thiếu groupID hoặc không có trường nào để cập nhật");
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
      Key: { groupID },
      UpdateExpression: `SET ${attributeUpdates.join(', ')}`,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };
  
    const result = await dynamoDB.update(params).promise();
    return result.Attributes;
  }  
};

module.exports = GroupModel;