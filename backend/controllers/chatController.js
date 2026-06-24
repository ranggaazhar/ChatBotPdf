const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Document, ChatLog } = require('../models');
require('dotenv').config();

exports.handleChat = async (req, res) => {
  try {
    const { documentId, query, mode } = req.body; // mode: 'chat' atau 'summary'

    if (!documentId) {
      return res.status(400).json({ message: 'ID dokumen wajib disertakan.' });
    }

    if (mode === 'chat' && (!query || query.trim() === '')) {
      return res.status(400).json({ message: 'Pertanyaan tidak boleh kosong.' });
    }

    // Ambil dokumen dari database
    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Dokumen tidak ditemukan.' });
    }

    // Pastikan API Key Gemini terkonfigurasi
    const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
    if (!apiKey) {
      return res.status(400).json({
        message: 'Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi di berkas .env backend. Harap masukkan kunci API Anda di sana agar chatbot dapat berfungsi.'
      });
    }

    // Inisialisasi Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);

    let prompt = '';
    let finalQuery = query;

    if (mode === 'summary') {
      finalQuery = 'Minta Ringkasan Dokumen';
      prompt = `Berikut adalah teks isi dokumen PDF yang bernama "${document.title}":
      
--- MULAI TEKS DOKUMEN ---
${document.textContent}
--- SELESAI TEKS DOKUMEN ---

Tugas Anda adalah:
1. Buat ringkasan (summary) yang komprehensif, terstruktur dengan baik (gunakan poin-poin/bullet points jika perlu), dan mudah dimengerti dalam Bahasa Indonesia.
2. Jelaskan poin-poin penting, tujuan dokumen, dan kesimpulan utama dari teks dokumen di atas.
3. Pastikan ringkasan HANYA didasarkan pada teks dokumen yang disediakan di atas.

Ringkasan:`;
    } else {
      // Mode chat biasa
      prompt = `Anda adalah asisten chatbot AI yang ramah, profesional, dan cerdas. Tugas Anda adalah membantu user menjawab pertanyaan mengenai isi dokumen PDF bernama "${document.title}".

Berikut adalah teks isi dokumen sebagai referensi Anda:

--- MULAI TEKS DOKUMEN ---
${document.textContent}
--- SELESAI TEKS DOKUMEN ---

Ketentuan menjawab:
1. Jawab pertanyaan user secara sopan, ramah, dan mendalam dalam Bahasa Indonesia.
2. Jawab HANYA berdasarkan informasi yang tertera di dalam teks dokumen di atas.
3. Jika jawaban dari pertanyaan user tidak ada di dalam dokumen, katakan secara jujur dan sopan: "Maaf, saya tidak menemukan informasi tersebut di dalam dokumen." Jangan mencoba mengarang jawaban di luar isi dokumen.
4. Gunakan pemformatan markdown yang bersih (misal tebal, miring, atau daftar poin) untuk membuat jawaban Anda mudah dibaca.

Pertanyaan User: ${query}

Jawaban Anda:`;
    }

    // Panggil API Gemini dengan Multi-Model Fallback & Retry (Mengatasi 503 / 429 pada Free Tier)
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-pro'];
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
      documentId: document.id,
      query: finalQuery,
      response: responseText
    });

    return res.json({
      message: mode === 'summary' ? 'Ringkasan berhasil dibuat.' : 'Pesan berhasil dibalas.',
      response: responseText
    });

  } catch (error) {
    console.error('Error saat memproses chatbot/summary:', error);
    return res.status(500).json({
      message: 'Terjadi kesalahan saat memproses chatbot. Pastikan GEMINI_API_KEY Anda valid.'
    });
  }
};
