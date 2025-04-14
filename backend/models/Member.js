const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'Members';

const MemberModel = {
   /**
   * Thêm một thành viên mới vào nhóm
   * */
  async create(userID, groupID, memberRole = 'MEMBER') {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        userID,
        groupID,
        memberRole,
      }
    };

    await dynamoDB.put(params).promise();
  },

  /**
   * kiểm tra xem user có tham gia nhóm này không
   */
  async findByUserAndGroup(userID, groupID) {
    const params = {
      TableName: TABLE_NAME,
      Key: { userID, groupID },
    };

    const data = await dynamoDB.get(params).promise();
    return data.Item || null;
  },

  /**
   * Tìm tất cả nhóm mà user tham gia
   */
  async findAllByUser(userID) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'UserIndex',
      KeyConditionExpression: 'userID = :uid',
      ExpressionAttributeValues: {
        ':uid': userID,
      },
    };

    const data = await dynamoDB.query(params).promise();
    return data.Items || [];
  },

  /**
   * Tìm tất cả thành viên trong một group
   */
  async findAllByGroup(groupID) {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'GroupIndex',
      KeyConditionExpression: 'groupID = :gid',
      ExpressionAttributeValues: {
        ':gid': groupID,
      },
    };

    const data = await dynamoDB.query(params).promise();
    return data.Items || [];
  },

  /**
   * Cập nhật role cho member
   */
  async updateRole(userID, groupID, newRole) {
    const params = {
      TableName: TABLE_NAME,
      Key: { userID, groupID },
      UpdateExpression: 'set memberRole = :r',
      ExpressionAttributeValues: {
        ':r': newRole,
      },
    };
  
    await dynamoDB.update(params).promise();
    return true;
  },
  
  /**
   * Xóa một thành viên khỏi nhóm
   */
  async delete(userID, groupID) {
    const params = {
      TableName: TABLE_NAME,
      Key: { userID, groupID },
    };

    await dynamoDB.delete(params).promise();
    return true;
  },

   /**
   * Xóa tất cả thành viên trong nhóm
   */
   async deleteAllByGroup(groupID) {
    const members = await this.findAllByGroup(groupID);

    if (members.length === 0) return true;

    const deleteRequests = members.map(member => ({
      DeleteRequest: {
        Key: {
          userID: member.userID,
          groupID: member.groupID,
        },
      },
    }));

    const params = {
      RequestItems: {
        [TABLE_NAME]: deleteRequests,
      },
    };

    await dynamoDB.batchWrite(params).promise();
    return true;
  },
};

module.exports = MemberModel;