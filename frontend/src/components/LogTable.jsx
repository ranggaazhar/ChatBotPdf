import React from 'react';
import { RefreshCw, Search, MessageSquare } from 'lucide-react';

/**
 * Component for admin to browse and search user query/session logs.
 */
const LogTable = ({
  logs,
  logSearchQuery,
  setLogSearchQuery,
  fetchLogs
}) => {
  // Filter logs locally based on search terms
  const filteredLogs = logs.filter(log => {
    const query = logSearchQuery.toLowerCase();
    const username = log.user?.username?.toLowerCase() || '';
    const email = log.user?.email?.toLowerCase() || '';
    const threadTitle = log.thread?.title?.toLowerCase() || 'sesi chat';
    const userQuery = log.query?.toLowerCase() || '';
    
    return username.includes(query) || 
           email.includes(query) || 
           threadTitle.includes(query) || 
           userQuery.includes(query);
  });

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Log Aktivitas & Pencarian User</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Pantau pertanyaan pengguna beserta jawaban yang diberikan oleh ChatAI Tarjih secara real-time.</p>
        </div>
        <button 
          onClick={fetchLogs} 
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
        >
          <RefreshCw size={16} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Search Log */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={20} style={{ color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Cari berdasarkan nama user, email, judul dokumen, atau kata kunci pertanyaan..." 
          value={logSearchQuery}
          onChange={(e) => setLogSearchQuery(e.target.value)}
          style={{ border: 'none', background: 'transparent', padding: '8px 0', fontSize: '1rem', width: '100%' }}
        />
      </div>

      {/* List Log */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {logs.length === 0 ? 'Belum ada aktivitas percakapan dari user.' : 'Tidak ada log pencarian yang cocok dengan kata kunci Anda.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th" style={{ width: '15%' }}>Pengguna</th>
                  <th className="admin-th" style={{ width: '20%' }}>Sesi Percakapan (Thread)</th>
                  <th className="admin-th" style={{ width: '30%' }}>Pertanyaan User (Query)</th>
                  <th className="admin-th" style={{ width: '20%' }}>Jawaban AI (ChatAI Tarjih)</th>
                  <th className="admin-th" style={{ width: '15%' }}>Waktu Percakapan</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="admin-tr" style={{ borderBottom: '1px solid var(--border-glass)', cursor: 'default' }}>
                    <td className="admin-td">
                      <div style={{ fontWeight: 600 }}>{log.user ? log.user.username : 'Guest'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user ? log.user.email : '-'}</div>
                    </td>
                    <td className="admin-td">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: 'var(--primary-color)' }}>
                        <MessageSquare size={14} />
                        <span>{log.thread ? log.thread.title : 'Sesi Chat'}</span>
                      </div>
                    </td>
                    <td className="admin-td" style={{ fontSize: '0.9rem', verticalAlign: 'top', wordBreak: 'break-word' }}>
                      {log.query}
                    </td>
                    <td className="admin-td" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', verticalAlign: 'top', wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                      {log.response?.length > 150 ? `${log.response.substring(0, 150)}...` : log.response}
                    </td>
                    <td className="admin-td" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(log.createdAt).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogTable;
