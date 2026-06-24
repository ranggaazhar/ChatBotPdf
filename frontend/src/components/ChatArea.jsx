import React, { useRef, useEffect } from 'react';
import { MessageSquare, ArrowRight, Send } from 'lucide-react';

/**
 * Main chat panel workspace for messaging and rendering conversation logs.
 */
const ChatArea = ({
  activeThread,
  messages,
  loading,
  input,
  setInput,
  onSendMessage
}) => {
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage(e);
  };

  const handleSuggestionClick = (text) => {
    onSendMessage(null, text);
  };

  // Simple Markdown-to-HTML parser helper
  const formatMessageText = (text) => {
    if (!text) return '';
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br />');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div style={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Chat */}
      <div className="user-chat-header glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <MessageSquare size={20} style={{ color: 'var(--primary-color)' }} />
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeThread ? activeThread.title : 'Percakapan Baru'}
          </span>
        </div>
      </div>

      {/* Chat Body panel */}
      <div className="user-chat-body">
        {messages.length === 0 ? (
          /* Empty state - welcome screen */
          <div className="user-welcome-container">
            <div className="user-welcome-glow"></div>
            <div className="glass-panel user-welcome-card">
              <div className="user-welcome-icon">🤖</div>
              <h2 style={{ marginBottom: '8px', fontSize: '1.8rem' }}>Ada yang bisa saya bantu hari ini?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '28px' }}>
                Tanyakan apa saja seputar berkas dokumen yang telah diunggah oleh admin. Jika di luar konteks dokumen tersebut, saya tidak akan menjawabnya.
              </p>

              <div className="user-suggestions-grid">
                <div
                  onClick={() => handleSuggestionClick('Berikan ringkasan mengenai seluruh dokumen yang ada.')}
                  className="glass-card user-suggestion-card"
                >
                  <span>Ringkas Semua Dokumen</span>
                  <ArrowRight size={14} style={{ color: 'var(--primary-color)' }} />
                </div>
                <div
                  onClick={() => handleSuggestionClick('Apa saja topik utama yang dibahas di dalam berkas dokumen?')}
                  className="glass-card user-suggestion-card"
                >
                  <span>Tanyakan Topik Utama</span>
                  <ArrowRight size={14} style={{ color: 'var(--primary-color)' }} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Messages feed */
          <div className="user-chat-message-list">
            {messages.map((msg, index) => (
              <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* User query bubble */}
                <div className="user-chat-row" style={{ justifyContent: 'flex-end', marginLeft: 'auto' }}>
                  <div className="user-chat-bubble" style={{ backgroundColor: 'var(--primary-color)', borderRadius: '16px 16px 2px 16px', border: 'none' }}>
                    <div className="user-chat-text">{msg.query}</div>
                  </div>
                </div>

                {/* AI response bubble */}
                {msg.response ? (
                  <div className="user-chat-row" style={{ justifyContent: 'flex-start' }}>
                    <div className="user-ai-avatar">🤖</div>
                    <div className="user-chat-bubble" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px 16px 16px 2px', border: '1px solid var(--border-glass)' }}>
                      <div className="user-chat-text">{formatMessageText(msg.response)}</div>
                    </div>
                  </div>
                ) : (
                  loading && index === messages.length - 1 && (
                    <div className="user-chat-row" style={{ justifyContent: 'flex-start' }}>
                      <div className="user-ai-avatar">🤖</div>
                      <div className="user-chat-bubble" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '16px 16px 16px 2px' }}>
                        <div className="user-typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <div className="user-chat-input-container glass-panel">
        <form onSubmit={handleSubmit} className="user-chat-form">
          <input
            type="text"
            placeholder="Tanyakan sesuatu dari isi dokumen..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="user-chat-input"
          />
          <button
            type="submit"
            className="btn-primary user-send-btn"
            disabled={loading || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
