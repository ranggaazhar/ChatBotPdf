const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const host = process.env.DB_HOST || '127.0.0.1';
const user = process.env.DB_USERNAME || 'root';
const password = process.env.DB_PASS || '';
const port = process.env.DB_PORT || 3306;
const database = process.env.DB_NAME || 'chatbot_pdf_db';

async function initializeDatabase() {
  // Hubungkan ke MySQL tanpa memilih database untuk memastikan database ada
  const connection = await mysql.createConnection({ host, port, user, password });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();
}

const sequelize = new Sequelize(database, user, password, {
  host: host,
  port: port,
  dialect: 'mysql',
  logging: false, // Set to console.log to see SQL queries
  define: {
    timestamps: true,
    underscored: true
  }
});

module.exports = {
  sequelize,
  initializeDatabase
};
