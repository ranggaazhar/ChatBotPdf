const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Document, ChatThread, ChatLog } = require('../models');
require('dotenv').config();

// 1. Kirim Pesan / Tanya Jawab Global
exports.handleChat = async (req, res) => {
  try {
    let { threadId, query } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Pertanyaan tidak boleh kosong.' });
    }

    // Pastikan API Key Gemini terkonfigurasi
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
    if (!apiKey) {
      return res.status(400).json({
        message: 'Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi di berkas .env backend. Harap masukkan kunci API Anda di sana agar chatbot dapat berfungsi.'
      });
    }

    // Ambil atau buat ChatThread baru
    let thread;
    if (!threadId || threadId === 'new') {
      const threadTitle = query.length > 30 ? `${query.substring(0, 30)}...` : query;
      thread = await ChatThread.create({
        userId: req.user.id,
        title: threadTitle
      });
      threadId = thread.id;
    } else {
      thread = await ChatThread.findOne({
        where: { id: threadId, userId: req.user.id }
      });
      if (!thread) {
        return res.status(404).json({ message: 'Sesi percakapan tidak ditemukan.' });
      }
    }

    // Ambil seluruh dokumen yang diunggah oleh admin
    const allDocs = await Document.findAll({
      attributes: ['title', 'textContent']
    });

    if (allDocs.length === 0) {
      const responseText = 'Maaf, administrator belum mengunggah dokumen referensi apapun di database kami. Silakan hubungi admin Anda untuk mengunggah dokumen PDF terlebih dahulu.';
      
      // Catat log
      await ChatLog.create({
        userId: req.user.id,
        threadId: threadId,
        query: query,
        response: responseText
      });

      return res.json({
        message: 'Pesan berhasil dibalas (No document fallback).',
        threadId,
        threadTitle: thread.title,
        response: responseText
      });
    }

    // Satukan isi dokumen sebagai satu context besar
    const contextText = allDocs.map((doc, index) => 
      `--- DOKUMEN REFERENSI ${index + 1}: ${doc.title} ---\n${doc.textContent}`
    ).join('\n\n');

    // Buat strict system prompt
    const prompt = `Anda adalah asisten chatbot AI khusus yang membantu user dengan memberikan jawaban HANYA berdasarkan isi dokumen-dokumen PDF di bawah ini.

Berikut adalah teks isi dari seluruh dokumen PDF referensi Anda:

${contextText}

--- SELESAI DOKUMEN ---

ATURAN MENJAWAB (MANDATORI):
1. **Sapaan & Basa-basi Ringan**: Anda diperbolehkan membalas sapaan, salam, perkenalan diri, dan basa-basi ringan dari user secara ramah, hangat, singkat, dan alami (seperti: "Halo! Ada yang bisa saya bantu hari ini?", "Hai! Selamat pagi. Bagaimana saya bisa membantu Anda hari ini?", dll.). **JANGAN** menyebutkan batasan dokumen, larangan menjawab, atau nama berkas PDF dalam sapaan ramah Anda ini. Buatlah sapaan tersebut terdengar natural dan menyenangkan.
2. **Pertanyaan Spesifik/Informasi**: Untuk pertanyaan yang mencari informasi, data faktual, bantuan tugas, pembuatan kode, resep, atau pengetahuan umum lainnya, Anda HANYA boleh menjawab jika jawabannya tertulis secara eksplisit atau implisit di dalam dokumen referensi di atas.
3. **Penolakan di Luar Konteks**: Jika user menanyakan informasi spesifik yang tidak tertera di dalam dokumen di atas, Anda WAJIB menolak menjawab dengan kalimat berikut secara persis:
   "Maaf, saya tidak dapat menjawab pertanyaan tersebut karena di luar konteks dokumen yang sedang kita bahas."
4. Jangan pernah memberikan jawaban dari pengetahuan umum Anda sendiri untuk hal-hal spesifik. Batasi referensi Anda 100% pada teks dokumen di atas.
5. Jawab dalam Bahasa Indonesia yang sopan dan terstruktur rapi menggunakan pemformatan markdown yang bersih.

Pertanyaan User: ${query}

Jawaban Anda:`;

    // Inisialisasi Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Panggil API Gemini dengan Multi-Model Fallback & Retry (Mengatasi 503 / 429 pada Free Tier)
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];
    let result = null;
    let success = false;
    let lastError = null;

    for (const modelName of modelsToTry) {
      console.log(`[Gemini API] Mencoba model: ${modelName}`);
      let retries = 2; // Coba 2 kali per model
      let delayMs = 1000;
      const model = genAI.getGenerativeModel({ model: modelName });

      while (retries > 0) {
        try {
          result = await model.generateContent(prompt);
          success = true;
          break; // Sukses, keluar dari loop retry
        } catch (apiError) {
          retries--;
          lastError = apiError;
          console.warn(`[Gemini API] Error pada model ${modelName} (Sisa percobaan: ${retries}):`, apiError.message);
          
          if (apiError.status && apiError.status !== 503 && apiError.status !== 429) {
            retries = 0; // Jangan retry jika error bukan karena overload/rate limit (misal API key salah)
          } else {
            await new Promise(resolve => setTimeout(resolve, delayMs));
            delayMs *= 2;
          }
        }
      }

      if (success) {
        console.log(`[Gemini API] Sukses menggunakan model: ${modelName}`);
        break; // Keluar dari loop model
      }
    }

    if (!success) {
      throw lastError || new Error('Seluruh model Gemini sedang sibuk dan tidak dapat diakses.');
    }

    const response = await result.response;
    const responseText = response.text();

    // Catat ke log percakapan di database MySQL
    await ChatLog.create({
      userId: req.user ? req.user.id : null,
      threadId: threadId,
      query: query,
      response: responseText
    });

    return res.json({
      message: 'Pesan berhasil dibalas.',
      threadId,
      threadTitle: thread.title,
      response: responseText
    });

  } catch (error) {
    console.error('Error saat memproses chatbot:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan saat memproses chatbot. Hubungi administrator.'
    });
  }
};

// 2. Ambil Semua Sesi Chat (Threads) Milik User Aktif
exports.getThreads = async (req, res) => {
  try {
    const threads = await ChatThread.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    return res.json({ threads });
  } catch (error) {
    console.error('Error getThreads:', error);
    return res.status(500).json({ message: 'Gagal mengambil riwayat sesi percakapan.' });
  }
};

// 3. Ambil Pesan-Pesan di dalam Satu Thread
exports.getThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await ChatThread.findOne({
      where: { id: threadId, userId: req.user.id }
    });

    if (!thread) {
      return res.status(404).json({ message: 'Sesi percakapan tidak ditemukan.' });
    }

    const messages = await ChatLog.findAll({
      where: { threadId },
      order: [['createdAt', 'ASC']]
    });

    return res.json({
      thread,
      messages
    });
  } catch (error) {
    console.error('Error getThreadMessages:', error);
    return res.status(500).json({ message: 'Gagal mengambil riwayat pesan.' });
  }
};

// 4. Hapus Sesi Chat (Thread)
exports.deleteThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await ChatThread.findOne({
      where: { id: threadId, userId: req.user.id }
    });

    if (!thread) {
      return res.status(404).json({ message: 'Sesi percakapan tidak ditemukan.' });
    }

    await thread.destroy(); // Cascade menghapus chat_logs yang terhubung
    return res.json({ message: 'Sesi percakapan berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleteThread:', error);
    return res.status(500).json({ message: 'Gagal menghapus riwayat percakapan.' });
  }
};
