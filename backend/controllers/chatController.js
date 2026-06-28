const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Document, ChatThread, ChatLog } = require('../models');
require('dotenv').config();

// 1. Kirim Pesan / Tanya Jawab Global
exports.handleChat = async (req, res) => {
  try {
    let { threadId, query, model } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Pertanyaan tidak boleh kosong.' });
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
        response: responseText,
        model: model || 'gemini'
      });

      return res.json({
        message: 'Pesan berhasil dibalas (No document fallback).',
        threadId,
        threadTitle: thread.title,
        response: responseText,
        model: model || 'gemini'
      });
    }

    // Satukan isi dokumen sebagai satu context besar
    const contextText = allDocs.map((doc, index) => 
      `--- DOKUMEN REFERENSI ${index + 1}: ${doc.title} ---\n${doc.textContent}`
    ).join('\n\n');

    // Buat strict system instruction
    const systemInstruction = `Anda adalah asisten chatbot AI khusus yang membantu user dengan memberikan jawaban HANYA berdasarkan isi dokumen-dokumen PDF di bawah ini.

Berikut adalah teks isi dari seluruh dokumen PDF referensi Anda:

${contextText}

--- SELESAI DOKUMEN ---

ATURAN MENJAWAB (MANDATORI & SANGAT KETAT):
1. **Ringkas & Padat**: Berikan jawaban yang ringkas, padat, dan langsung ke intinya (straight to the point). Hindari penjelasan bertele-tele atau pengulangan informasi yang tidak perlu.
2. **Larangan Menyebut Dokumen**: Anda DILARANG KERAS menyebutkan kata "dokumen", "referensi", "berkas", "file", atau sejenisnya di dalam jawaban Anda. Jawablah langsung secara alami dan faktual seolah-olah Anda adalah pakar yang sudah mengetahui jawabannya secara mandiri, tanpa merujuk pada keberadaan dokumen fisik.
   - Contoh Salah: "Dalam dokumen referensi, akidah sahihah didefinisikan sebagai..." atau "Berdasarkan dokumen yang tersedia..."
   - Contoh Benar: "Akidah sahihah (akidah yang benar) didefinisikan sebagai..."
3. **Salam & Basa-basi**: Jika user melakukan sapaan, salam, perkenalan diri, atau basa-basi ringan, Anda diperbolehkan membalasnya dengan ramah, hangat, singkat, dan alami (misalnya: "Halo! Ada yang bisa saya bantu hari ini?"). JANGAN pernah menyebutkan tentang batasan dokumen atau aturan di atas saat membalas sapaan ramah ini.
4. **Keberadaan Jawaban & Larangan Informasi Eksternal**:
   - Jika jawaban dari pertanyaan user TERDAPAT (baik tersurat maupun tersirat) di dalam teks referensi di atas, maka Anda harus menjawab pertanyaan tersebut HANYA menggunakan informasi tersebut. Anda DILARANG KERAS menambahkan detail, nama tokoh, tanggal, fakta, atau penjelasan historis apa pun yang TIDAK tertulis secara eksplisit dalam teks referensi di atas (meskipun Anda mengetahuinya dari pengetahuan umum Anda). JANGAN menambahkan kalimat penolakan di bagian akhir jawaban Anda.
   - Jika jawaban dari pertanyaan user SAMA SEKALI TIDAK ADA di dalam teks referensi di atas, Anda WAJIB menolak menjawab dengan kalimat berikut secara persis (tanpa modifikasi apa pun):
     "Maaf, saya tidak dapat menjawab pertanyaan tersebut karena di luar konteks dokumen yang sedang kita bahas."
5. Dilarang menggabungkan jawaban valid dengan kalimat penolakan. Jangan pernah menulis jawaban di paragraf awal lalu menulis kalimat penolakan "Maaf, saya tidak dapat menjawab..." di paragraf akhir. Pilih salah satu secara tegas sesuai ada tidaknya informasi di dokumen.
6. Jawab dalam Bahasa Indonesia yang sopan dan menggunakan pemformatan markdown yang bersih.`;

    let responseText = '';
    const selectedModel = model ? model.trim().toLowerCase() : 'gemini';

    if (selectedModel === 'gpt-4o') {
      const openAiKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.trim() : '';
      if (!openAiKey) {
        return res.status(400).json({
          message: 'Kunci API OpenAI (OPENAI_API_KEY) belum dikonfigurasi di berkas .env backend. Harap masukkan kunci API Anda di sana agar chatbot dengan model GPT-4o dapat berfungsi.'
        });
      }

      console.log(`[OpenAI API] Mencoba model: gpt-4o`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: query }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`OpenAI API Error: ${errData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      responseText = data.choices[0].message.content;

    } else if (selectedModel === 'claude') {
      const anthropicKey = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.trim() : '';
      if (!anthropicKey) {
        return res.status(400).json({
          message: 'Kunci API Anthropic (ANTHROPIC_API_KEY) belum dikonfigurasi di berkas .env backend. Harap masukkan kunci API Anda di sana agar chatbot dengan model Claude dapat berfungsi.'
        });
      }

      console.log(`[Anthropic API] Mencoba model: claude-3-5-sonnet-20241022`);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: systemInstruction,
          messages: [
            { role: 'user', content: query }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Anthropic API Error: ${errData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      responseText = data.content[0].text;

    } else {
      // Default / Fallback: Gemini AI
      const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
      if (!apiKey) {
        return res.status(400).json({
          message: 'Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi di berkas .env backend. Harap masukkan kunci API Anda di sana agar chatbot dapat berfungsi.'
        });
      }

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
        
        // Menggunakan getGenerativeModel dengan systemInstruction & generationConfig (temperature rendah)
        const modelObj = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            temperature: 0.1
          }
        });

        while (retries > 0) {
          try {
            result = await modelObj.generateContent(query);
            success = true;
            break; // Sukses, keluar dari loop retry
          } catch (apiError) {
            retries--;
            lastError = apiError;
            console.warn(`[Gemini API] Error pada model ${modelName} (Sisa percobaan: ${retries}):`, apiError.message);
            
            if (apiError.status && apiError.status !== 503 && apiError.status !== 429) {
              retries = 0; // Jangan retry jika error bukan karena overload/rate limit
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

      const responseObj = await result.response;
      responseText = responseObj.text();
    }

    // Catat ke log percakapan di database MySQL
    await ChatLog.create({
      userId: req.user ? req.user.id : null,
      threadId: threadId,
      query: query,
      response: responseText,
      model: selectedModel
    });

    return res.json({
      message: 'Pesan berhasil dibalas.',
      threadId,
      threadTitle: thread.title,
      response: responseText,
      model: selectedModel
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
