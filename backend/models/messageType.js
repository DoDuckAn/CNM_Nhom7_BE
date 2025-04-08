const { dynamoDB } = require("../utils/aws-helper");

const TABLE_NAME = 'MessageTypes';

const MessageTypeModel = {
  async getAll() {
    const params = {
      TableName: TABLE_NAME,
    };
    const data = await dynamoDB.scan(params).promise();
    return data.Items;
  },

  async findById(typeID) {
    const params = {
      TableName: TABLE_NAME,
      Key: { typeID },
    };
    const data = await dynamoDB.get(params).promise();
    return data.Item;
  },

  async create({ typeID, typeName }) {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        typeID,
        typeName,
      },
      ConditionExpression: 'attribute_not_exists(typeID)',
    };
    await dynamoDB.put(params).promise();
    return { typeID, typeName };
  },

  async delete(typeID) {
    const params = {
      TableName: TABLE_NAME,
      Key: { typeID },
    };
    await dynamoDB.delete(params).promise();
  },

  async update(typeID, typeName) {
    const params = {
      TableName: TABLE_NAME,
      Key: { typeID },
      UpdateExpression: 'SET typeName = :typeName',
      ExpressionAttributeValues: {
        ':typeName': typeName,
      },
      ReturnValues: 'ALL_NEW',
    };
    const data = await dynamoDB.update(params).promise();
    return data.Attributes;
  },
};

module.exports = MessageTypeModel;