const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { initializeDatabase, sequelize } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rute API
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Folder uploads dijadikan static (jika user ingin mendownload berkas PDF)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Uji Rute Utama
app.get('/', (req, res) => {
  res.json({ message: 'Selamat datang di API Chatbot PDF!' });
});

// Penanganan Route Not Found (404)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server.' });
});

// Inisialisasi Database dan Menjalankan Server
async function startServer() {
  try {
    // 1. Pastikan database MySQL sudah dibuat
    console.log('Menghubungkan ke MySQL...');
    await initializeDatabase();
    console.log('Database berhasil diinisialisasi/diverifikasi.');

    // 2. Sinkronisasi model Sequelize dengan MySQL database
    console.log('Sinkronisasi model database...');
    await sequelize.sync({ alter: true });
    console.log('Sinkronisasi database selesai.');

    // 2.5. Seed admin user jika belum ada
    const { User } = require('./models');
    const bcrypt = require('bcryptjs');
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      console.log('Tidak ada akun admin yang terdaftar. Menanam (seeding) default akun admin...');
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await User.create({
        username: 'admin',
        email: 'admin@chatbot.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('\n=============================================');
      console.log('--- DEFAULT AKUN ADMIN BERHASIL DIBUAT ---');
      console.log('Email: admin@chatbot.com');
      console.log('Password: adminpassword');
      console.log('=============================================\n');
    }

    // 3. Jalankan server
    app.listen(PORT, () => {
      console.log(`Server backend berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Gagal memulai server backend:', error);
    process.exit(1);
  }
}

startServer();
