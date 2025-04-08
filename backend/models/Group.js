const { dynamoDB } = require("../utils/aws-helper");

const TABLE_NAME = 'Groups';

const GroupModel = {
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
};

module.exports = GroupModel;