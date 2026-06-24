const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { Document } = require('../models');

// Pastikan direktori uploads ada
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada berkas yang diunggah.' });
    }

    const { title } = req.body;
    const documentTitle = title || req.file.originalname.replace(/\.[^/.]+$/, ""); // Default ke nama file tanpa ekstensi

    const filePath = req.file.path;
    const fileName = req.file.filename;

    // Membaca file PDF dan mengekstrak teks
    let textContent = '';
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      textContent = pdfData.text;

      // Bersihkan teks dari spasi berlebih atau karakter aneh jika perlu
      if (!textContent || textContent.trim().length === 0) {
        // Hapus file jika teks kosong / gagal diekstrak
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: 'Gagal mengekstrak teks dari PDF. Berkas mungkin kosong atau berupa hasil scan gambar tanpa OCR.' });
      }
    } catch (parseError) {
      console.error('Error saat parsing PDF:', parseError);
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Gagal memproses file PDF. Format file tidak valid.' });
    }

    // Simpan ke database
    const document = await Document.create({
      title: documentTitle,
      fileName,
      filePath: filePath.replace(/\\/g, '/'), // Ubah backslash Windows ke slash standard
      textContent,
      uploadedBy: req.user ? req.user.id : null
    });

    return res.status(201).json({
      message: 'Dokumen berhasil diunggah dan diproses.',
      document: {
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        createdAt: document.createdAt
      }
    });
  } catch (error) {
    console.error('Error saat upload document:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server saat mengunggah dokumen.' });
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      attributes: ['id', 'title', 'fileName', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    return res.json({ documents });
  } catch (error) {
    console.error('Error saat mengambil dokumen:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil data dokumen.' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findByPk(id);

    if (!document) {
      return res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
    }

    // Hapus file fisik dari disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Hapus dari database
    await document.destroy();

    return res.json({ message: 'Dokumen berhasil dihapus.' });
  } catch (error) {
    console.error('Error saat menghapus dokumen:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server saat menghapus dokumen.' });
  }
};
