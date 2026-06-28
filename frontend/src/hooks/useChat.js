import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';

export const useChat = () => {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState('new');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [error, setError] = useState('');

  // Muat daftar thread chat pada saat pertama kali hook dipasang
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setThreadsLoading(true);
    try {
      const data = await chatService.getThreads();
      setThreads(data.threads);
      // Auto-select thread terbaru jika halaman baru dimuat dan chat masih kosong
      if (data.threads && data.threads.length > 0 && activeThreadId === 'new' && messages.length === 0) {
        selectThread(data.threads[0].id);
      }
    } catch (err) {
      console.error('Gagal memuat threads:', err);
    } finally {
      setThreadsLoading(false);
    }
  };

  const fetchThreadMessages = async (threadId) => {
    setLoading(true);
    setError('');
    try {
      const data = await chatService.getThreadMessages(threadId);
      setMessages(data.messages);
    } catch (err) {
      setError(err.message || 'Gagal memuat pesan.');
    } finally {
      setLoading(false);
    }
  };

  const selectThread = (threadId) => {
    setActiveThreadId(threadId);
    if (threadId === 'new') {
      setMessages([]);
      setError('');
    } else {
      fetchThreadMessages(threadId);
    }
  };

  const deleteThread = async (threadId) => {
    try {
      await chatService.deleteThread(threadId);
      setThreads(prev => prev.filter(t => t.id !== threadId));
      if (activeThreadId === threadId) {
        selectThread('new');
      }
    } catch (err) {
      alert(err.message || 'Gagal menghapus percakapan.');
    }
  };

  const sendMessage = async (queryText, model = 'gemini') => {
    if (!queryText || queryText.trim() === '') return;

    // Tambahkan pesan user secara lokal
    const userMessage = {
      id: `temp-user-${Date.now()}`,
      query: queryText,
      response: '',
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setError('');

    try {
      const data = await chatService.sendMessage(activeThreadId, queryText, model);

      // Perbarui respons AI secara lokal
      setMessages(prev => {
        const copy = [...prev];
        const lastMsg = copy[copy.length - 1];
        if (lastMsg) {
          lastMsg.id = data.chatLogId || lastMsg.id;
          lastMsg.response = data.response;
          lastMsg.model = data.model || model;
        }
        return copy;
      });

      // Jika merupakan thread baru, set active thread ID dan segarkan sidebar
      if (activeThreadId === 'new') {
        setActiveThreadId(data.threadId);
        fetchThreads();
      }
    } catch (err) {
      // Tampilkan pesan error di chat bubble AI
      setMessages(prev => {
        const copy = [...prev];
        const lastMsg = copy[copy.length - 1];
        if (lastMsg) {
          lastMsg.response = `⚠️ ${err.message}`;
        }
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    threads,
    activeThreadId,
    messages,
    loading,
    threadsLoading,
    error,
    selectThread,
    deleteThread,
    sendMessage,
    refreshThreads: fetchThreads
  };
};
