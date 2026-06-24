import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, FileText, Trash2, ListFilter, Search, 
  Database, User as UserIcon, LogOut, RefreshCw, CheckCircle2, AlertCircle 
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, token, logout, API_URL } = useAuth();
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' atau 'logs'
  const [documents, setDocuments] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // State Upload
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // State List & Log
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  useEffect(() => {
    fetchDocuments();
    fetchLogs();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
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
      setError('Gagal menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Gagal mengambil data log:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setUploadError('Hanya file PDF yang diperbolehkan!');
        setFile(null);
        return;
      }
      setUploadError('');
      setFile(selectedFile);
      if (!title) {
        // Otomatis isi title dengan nama file (tanpa ekstensi)
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Silakan pilih berkas PDF terlebih dahulu.');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      const response = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengunggah berkas.');
      }

      setUploadSuccess('Dokumen berhasil diunggah dan diekstrak!');
      setFile(null);
      setTitle('');
      // Reset input file manual
      const fileInput = document.getElementById('pdf-file-input');
      if (fileInput) fileInput.value = '';

      // Muat ulang daftar dokumen
      fetchDocuments();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDoc = async (id, docTitle) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${docTitle}"? Semua riwayat chat terkait dokumen ini juga akan terhapus.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert('Dokumen berhasil dihapus.');
        fetchDocuments();
        fetchLogs(); // refresh log
      } else {
        alert(data.message || 'Gagal menghapus dokumen.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi server.');
    }
  };

  // Filter Log berdasarkan input pencarian (nama user, email, query, atau judul dokumen)
  const filteredLogs = logs.filter(log => {
    const query = logSearchQuery.toLowerCase();
    const username = log.user?.username?.toLowerCase() || '';
    const email = log.user?.email?.toLowerCase() || '';
    const docTitle = log.document?.title?.toLowerCase() || 'pertanyaan umum';
    const userQuery = log.query?.toLowerCase() || '';
    
    return username.includes(query) || 
           email.includes(query) || 
           docTitle.includes(query) || 
           userQuery.includes(query);
  });

  return (
    <div className="app-container">
      {/* Sidebar Admin */}
      <div className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">🔒</div>
          <span className="logo-text">PDF Admin</span>
        </div>

        <div className="nav-links">
          <button 
            onClick={() => setActiveTab('documents')}
            className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
          >
            <Database size={18} />
            <span>Kelola Dokumen</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('logs')}
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
          >
            <ListFilter size={18} />
            <span>Log Pencarian User</span>
          </button>
        </div>

        <div className="user-profile-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glass)' }}>
              <UserIcon size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.username}</span>
              <span className="user-role-badge" style={{ color: 'var(--accent)', backgroundColor: 'rgba(217, 70, 239, 0.15)' }}>Admin</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {activeTab === 'documents' ? (
          /* ==================== TAB KELOLA DOKUMEN ==================== */
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Kelola Dokumen PDF</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Unggah dokumen PDF baru untuk diekstrak isinya, atau hapus berkas yang sudah tidak digunakan.</p>
            </div>

            <div style={styles.dashboardGrid}>
              {/* Form Upload */}
              <div className="glass-panel" style={{ padding: '30px', flex: 1 }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Upload size={20} style={{ color: 'var(--primary-color)' }} />
                  Unggah Dokumen Baru
                </h3>

                {uploadError && (
                  <div style={styles.alertError}>
                    <AlertCircle size={18} />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div style={styles.alertSuccess}>
                    <CheckCircle2 size={18} />
                    <span>{uploadSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={styles.fieldLabel}>Judul Dokumen</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan nama/judul dokumen" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={styles.fieldLabel}>Berkas PDF</label>
                    <div style={styles.fileDropZone}>
                      <input 
                        type="file" 
                        id="pdf-file-input" 
                        accept=".pdf" 
                        onChange={handleFileChange}
                        required
                        style={styles.fileInputHidden}
                      />
                      <label htmlFor="pdf-file-input" style={styles.fileInputLabel}>
                        <Upload size={32} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                          {file ? file.name : 'Klik atau Seret Berkas PDF di Sini'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Maksimal 10 MB (Hanya PDF)
                        </span>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={uploadLoading || !file}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                  >
                    {uploadLoading ? (
                      <span>Memproses & Mengekstrak PDF...</span>
                    ) : (
                      <>
                        <Upload size={18} />
                        <span>Mulai Ekstrak & Unggah</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Daftar Dokumen */}
              <div className="glass-panel" style={{ padding: '30px', flex: 1.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={20} style={{ color: 'var(--primary-color)' }} />
                    Dokumen Terunggah
                  </h3>
                  <button onClick={fetchDocuments} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                    <RefreshCw size={14} />
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat berkas...</div>
                ) : documents.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
                    Belum ada dokumen. Silakan unggah file PDF pertama Anda di form sebelah kiri.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Judul</th>
                          <th style={styles.th}>Nama Berkas</th>
                          <th style={styles.th}>Tanggal Unggah</th>
                          <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.id} className="glass-card" style={styles.tr}>
                            <td style={{ ...styles.td, fontWeight: 600 }}>{doc.title}</td>
                            <td style={{ ...styles.td, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{doc.fileName}</td>
                            <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {new Date(doc.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <button 
                                onClick={() => handleDeleteDoc(doc.id, doc.title)}
                                className="btn-danger" 
                                style={{ padding: '8px', borderRadius: '6px' }}
                                title="Hapus Dokumen"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ==================== TAB LOG PENCARIAN USER ==================== */
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Log Aktivitas & Pencarian User</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Pantau pertanyaan pengguna beserta jawaban yang diberikan oleh Chatbot AI secara real-time.</p>
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
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, width: '15%' }}>Pengguna</th>
                        <th style={{ ...styles.th, width: '20%' }}>Dokumen PDF</th>
                        <th style={{ ...styles.th, width: '30%' }}>Pertanyaan User (Query)</th>
                        <th style={{ ...styles.th, width: '20%' }}>Jawaban AI (Chatbot)</th>
                        <th style={{ ...styles.th, width: '15%' }}>Waktu Percakapan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} style={{ ...styles.tr, borderBottom: '1px solid var(--border-glass)', cursor: 'default' }}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: 600 }}>{log.user ? log.user.username : 'Guest'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user ? log.user.email : '-'}</div>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: 'var(--primary-color)' }}>
                              <FileText size={14} />
                              <span>{log.document ? log.document.title : 'Pertanyaan Umum'}</span>
                            </div>
                          </td>
                          <td style={{ ...styles.td, fontSize: '0.9rem', verticalAlign: 'top', wordBreak: 'break-word' }}>
                            {log.query}
                          </td>
                          <td style={{ ...styles.td, fontSize: '0.85rem', color: 'var(--text-secondary)', verticalAlign: 'top', wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                            {log.response?.length > 150 ? `${log.response.substring(0, 150)}...` : log.response}
                          </td>
                          <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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
        )}
      </div>
    </div>
  );
};

const styles = {
  dashboardGrid: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
  },
  fieldLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  fileDropZone: {
    position: 'relative',
    height: '160px',
    border: '2px dashed var(--border-glass)',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  fileInputHidden: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
  fileInputLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    width: '100%',
    cursor: 'pointer',
  },
  alertError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--danger)',
    fontSize: '0.9rem',
    marginBottom: '20px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  alertSuccess: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    borderRadius: '8px',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    color: 'var(--success)',
    fontSize: '0.9rem',
    marginBottom: '20px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '16px',
    borderBottom: '2px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    transition: 'var(--transition)',
  },
  td: {
    padding: '16px',
    verticalAlign: 'middle',
  }
};

export default AdminDashboard;
