import React from 'react';
import { Plus, Search, MessageSquare, Trash2 } from 'lucide-react';

/**
 * Sidebar navigation component for user chat threads.
 */
const ChatSidebar = ({
  threads,
  activeThreadId,
  threadsLoading,
  docSearch,
  setDocSearch,
  onSelectThread,
  onDeleteThread
}) => {
  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(docSearch.toLowerCase())
  );

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    onDeleteThread(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'hidden' }}>
      {/* New Conversation Button */}
      <button
        onClick={() => onSelectThread('new')}
        className="btn-primary user-new-chat-btn"
      >
        <Plus size={18} />
        <span>Percakapan Baru</span>
      </button>

      <div className="user-history-label">
        Riwayat Percakapan
      </div>

      {/* Search Threads input */}
      {threads.length > 0 && (
        <div className="user-sidebar-search-wrapper">
          <Search size={16} className="user-sidebar-search-icon" />
          <input
            type="text"
            placeholder="Cari percakapan..."
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
            className="user-sidebar-search-input"
          />
        </div>
      )}

      {/* Thread list scroll panel */}
      <div className="nav-links" style={{ overflowY: 'auto', marginBottom: '20px', flexGrow: 1 }}>
        {threadsLoading && threads.length === 0 ? (
          <div className="user-sidebar-status-text">Memuat riwayat...</div>
        ) : filteredThreads.length === 0 ? (
          <div className="user-sidebar-status-text">
            {docSearch ? 'Percakapan tidak ditemukan.' : 'Belum ada riwayat chat.'}
          </div>
        ) : (
          filteredThreads.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectThread(t.id)}
              className={`nav-link user-thread-link ${activeThreadId === t.id ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flexGrow: 1 }}>
                <MessageSquare size={16} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.title}
                </span>
              </div>
              <button
                onClick={(e) => handleDeleteClick(e, t.id)}
                className="user-delete-thread-btn delete-btn-class"
                title="Hapus Percakapan"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
