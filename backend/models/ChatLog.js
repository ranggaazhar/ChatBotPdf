const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Document = require('./Document');

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
  documentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'document_id',
    references: {
      model: Document,
      key: 'id'
    }
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

Document.hasMany(ChatLog, { foreignKey: 'documentId', as: 'chatLogs' });
ChatLog.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });

module.exports = ChatLog;
