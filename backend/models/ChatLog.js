const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const ChatThread = require('./ChatThread');

const ChatLog = sequelize.define('ChatLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
    references: {
      model: User,
      key: 'id'
    }
  },
  threadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'thread_id',
    references: {
      model: ChatThread,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'chat_logs'
});

// Relasi
User.hasMany(ChatLog, { foreignKey: 'userId', as: 'chatLogs' });
ChatLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

ChatThread.hasMany(ChatLog, { foreignKey: 'threadId', as: 'messages' });
ChatLog.belongsTo(ChatThread, { foreignKey: 'threadId', as: 'thread' });

module.exports = ChatLog;
