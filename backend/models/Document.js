const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_name'
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'file_path'
  },
  textContent: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    field: 'text_content'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'uploaded_by',
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'documents'
});

// Relasi
User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'documents' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

module.exports = Document;
