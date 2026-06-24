import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, MessageSquare, Send, Sparkles, LogOut, 
  User as UserIcon, BookOpen, Trash2, ArrowRight, Search 
} from 'lucide-react';

const UserDashboard = () => {
  const { user, token, logout, API_URL } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages] = useState({}); // Memetakan documentId ke daftar pesan
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch dokumen saat komponen dipasang
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Scroll otomatis ke chat terbawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedDoc, loading]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_URL}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setDocuments(data.documents);
      } else {
        setError(data.message || 'Gagal memuat dokumen.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungkan ke server.');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(docSearch.toLowerCase())
  );

  const getDocMessages = (docId) => {
    if (!messages[docId]) {
      return [
        {
          id: 'welcome',
          sender: 'ai',
          text: `Halo ${user?.username}! Saya asisten chatbot Anda. Saya siap membantu Anda menganalisis dokumen ini. Silakan ajukan pertanyaan atau klik tombol **Ringkas Dokumen** di atas untuk mendapatkan rangkuman isi file secara instan.`,
          timestamp: new Date()
        }
      ];
    }
    return messages[docId];
  };

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setError('');
  };

  // Helper untuk format pesan sederhana (bold, newlines)
  const formatMessageText = (text) => {
    if (!text) return '';
    // Format bold **teks**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Format newline ke br
    formatted = formatted.replace(/\n/g, '<br />');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const handleSendMessage = async (e, modeOverride = null) => {
    if (e) e.preventDefault();
    
    const mode = modeOverride || 'chat';
    if (mode === 'chat' && (!input || input.trim() === '')) return;
    if (!selectedDoc) return;

    const userMessageText = mode === 'summary' ? 'Tolong buatkan ringkasan untuk dokumen ini.' : input;
    const currentDocId = selectedDoc.id;

    // Buat pesan user baru
    const newUserMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      timestamp: new Date()
    };

    // Update state pesan lokal secara langsung
    const currentChat = getDocMessages(currentDocId);
    setMessages(prev => ({
      ...prev,
      [currentDocId]: [...currentChat, newUserMsg]
    }));

    if (mode === 'chat') {
      setInput('');
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: currentDocId,
          query: userMessageText,
          mode: mode // 'chat' atau 'summary'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal membalas pesan.');
      }

      // Tambahkan jawaban AI
      const aiReply = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.response,
        timestamp: new Date()
      };

      setMessages(prev => ({
        ...prev,
        [currentDocId]: [...getDocMessages(currentDocId), newUserMsg, aiReply]
      }));

    } catch (err) {
      // Tambahkan pesan error sebagai chat bubble dari AI
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ Maaf, terjadi kesalahan: ${err.message}`,
        timestamp: new Date()
      };
      setMessages(prev => ({
        ...prev,
        [currentDocId]: [...getDocMessages(currentDocId), newUserMsg, errorMsg]
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Dokumen */}
      <div className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">🤖</div>
          <span className="logo-text">Chatbot PDF</span>
        </div>

        <div style={{ marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Daftar Dokumen PDF
        </div>

        {/* Input Pencarian Dokumen */}
        {documents.length > 0 && (
          <div style={styles.sidebarSearchWrapper}>
            <Search size={16} style={styles.sidebarSearchIcon} />
            <input
              type="text"
              placeholder="Cari dokumen..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              style={styles.sidebarSearchInput}
            />
          </div>
        )}

        <div className="nav-links" style={{ overflowY: 'auto', marginBottom: '20px' }}>
          {filteredDocs.length === 0 ? (
            <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {docSearch ? 'Dokumen tidak ditemukan.' : 'Belum ada dokumen yang tersedia. Silakan hubungi admin untuk mengunggah berkas.'}
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleSelectDoc(doc)}
                className={`nav-link ${selectedDoc?.id === doc.id ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
              >
                <FileText size={18} style={{ minWidth: 18 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.title}
                </span>
              </button>
            ))
          )}
        </div>

        {/* User Profile Info & Logout */}
        <div className="user-profile-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glass)' }}>
              <UserIcon size={18} style={{ color: 'var(--primary-color)' }} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.username}</span>
              <span className="user-role-badge">User</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-content" style={{ padding: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {selectedDoc ? (
          <>
            {/* Header Chat */}
            <div style={styles.chatHeader} className="glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                <FileText size={24} style={{ color: 'var(--primary-color)', minWidth: 24 }} />
                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedDoc.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nama File: {selectedDoc.fileName}</p>
                </div>
              </div>
              <button 
                onClick={() => handleSendMessage(null, 'summary')}
                disabled={loading}
                className="btn-secondary" 
                style={styles.summaryBtn}
              >
                <Sparkles size={16} />
                <span>Ringkas Dokumen</span>
              </button>
            </div>

            {/* Chat Messages List */}
            <div style={styles.chatBody}>
              {getDocMessages(selectedDoc.id).map((msg) => (
                <div 
                  key={msg.id} 
                  style={{
                    ...styles.chatRow,
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  {msg.sender === 'ai' && (
                    <div style={styles.aiAvatar}>🤖</div>
                  )}
                  <div 
                    style={{
                      ...styles.chatBubble,
                      backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.03)',
                      border: msg.sender === 'user' ? 'none' : '1px solid var(--border-glass)',
                      borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    }}
                  >
                    <div style={styles.chatText}>{formatMessageText(msg.text)}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div style={styles.chatRow}>
                  <div style={styles.aiAvatar}>🤖</div>
                  <div style={{ ...styles.chatBubble, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
                    <div style={styles.typingIndicator}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div style={styles.chatInputContainer} className="glass-panel">
              <form onSubmit={handleSendMessage} style={styles.chatForm}>
                <input
                  type="text"
                  placeholder={`Tanyakan tentang isi "${selectedDoc.title}"...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  style={styles.chatInput}
                />
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading || !input.trim()}
                  style={styles.sendBtn}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Tampilan Kosong / Panduan Pilih Dokumen */
          <div style={styles.emptyStateContainer}>
            <div style={styles.emptyStateGlow}></div>
            <div className="glass-panel" style={styles.emptyCard}>
              <div style={styles.emptyIcon}>🤖</div>
              <h2 style={{ marginBottom: '12px', fontSize: '1.6rem' }}>Mari Mulai Analisis PDF Anda!</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', marginBottom: '24px', fontSize: '0.95rem' }}>
                Silakan pilih salah satu dokumen PDF yang tersedia di sidebar sebelah kiri untuk mulai melakukan tanya jawab atau membuat ringkasan secara cepat dan cerdas.
              </p>
              <div style={styles.tutorialStep}>
                <div style={styles.stepNum}>1</div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>Pilih Dokumen PDF</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Klik dokumen pada panel kiri</p>
                </div>
              </div>
              <div style={styles.tutorialStep}>
                <div style={styles.stepNum}>2</div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>Dapatkan Ringkasan</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Klik tombol "Ringkas Dokumen" untuk membacanya lebih cepat</p>
                </div>
              </div>
              <div style={styles.tutorialStep}>
                <div style={{ ...styles.stepNum, backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-color)' }}>3</div>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>Tanya Jawab Bebas</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ketik pertanyaan apapun seputar isi dokumen tersebut</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  sidebarSearchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    width: '100%',
  },
  sidebarSearchIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  sidebarSearchInput: {
    padding: '8px 12px 8px 36px',
    fontSize: '0.85rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    width: '100%',
  },
  chatHeader: {
    padding: '16px 30px',
    borderBottom: '1px solid var(--border-glass)',
    borderRadius: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '20px',
    backgroundColor: 'var(--bg-secondary)',
    zIndex: 10,
  },
  summaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: 'var(--primary-color)',
  },
  chatBody: {
    flexGrow: 1,
    padding: '30px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: '#0a0d17',
  },
  chatRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    maxWidth: '85%',
    animation: 'fadeIn 0.3s ease-out forwards',
  },
  aiAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  chatBubble: {
    padding: '14px 20px',
    maxWidth: '100%',
    wordBreak: 'break-word',
  },
  chatText: {
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
  },
  chatInputContainer: {
    padding: '20px 30px',
    borderTop: '1px solid var(--border-glass)',
    borderRadius: 0,
    backgroundColor: 'var(--bg-secondary)',
  },
  chatForm: {
    display: 'flex',
    gap: '12px',
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%',
  },
  chatInput: {
    flexGrow: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-glass)',
    fontSize: '0.95rem',
  },
  sendBtn: {
    padding: '12px',
    aspectRatio: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emptyStateContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
    textAlign: 'center',
    position: 'relative',
  },
  emptyStateGlow: {
    position: 'absolute',
    width: '450px',
    height: '450px',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
    zIndex: -1,
  },
  emptyCard: {
    padding: '48px 40px',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
  },
  emptyIcon: {
    fontSize: '3.5rem',
    marginBottom: '20px',
  },
  tutorialStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    width: '100%',
    padding: '12px 20px',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    marginBottom: '10px',
  },
  stepNum: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 10px',
  }
};

// CSS untuk Typing Indicator (dimasukkan lewat dynamic tag jika ingin rapi, tapi bisa ditaruh di index.css. Mari tambahkan keyframe styling nya di index.css atau definisikan inline)
const typingStyles = `
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.typing-indicator span {
  width: 6px;
  height: 6px;
  background-color: var(--text-secondary);
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.2s infinite ease-in-out;
}
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = typingStyles;
  document.head.appendChild(styleSheet);
}

export default UserDashboard;
