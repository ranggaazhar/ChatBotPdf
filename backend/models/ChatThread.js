const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const ChatThread = sequelize.define('ChatThread', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: User,
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Chat Baru'
  }
}, {
  tableName: 'chat_threads'
});

// Relasi
User.hasMany(ChatThread, { foreignKey: 'userId', as: 'threads' });
ChatThread.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = ChatThread;
