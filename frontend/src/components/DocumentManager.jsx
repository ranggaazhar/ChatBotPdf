import React from 'react';
import { Upload, FileText, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Component for admin to upload new PDF files and view currently managed documents.
 */
const DocumentManager = ({
  documents,
  docsLoading,
  docsError,
  file,
  title,
  uploadLoading,
  uploadError,
  uploadSuccess,
  setTitle,
  handleFileChange,
  handleUpload,
  handleDeleteDoc,
  refreshDocuments
}) => {
  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Kelola Dokumen PDF</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Unggah dokumen PDF baru untuk diekstrak isinya, atau hapus berkas yang sudah tidak digunakan.</p>
      </div>

      <div className="admin-dashboard-grid">
        {/* Form Upload Panel */}
        <div className="glass-panel" style={{ padding: '30px', flex: 1 }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Upload size={20} style={{ color: 'var(--primary-color)' }} />
            Unggah Dokumen Baru
          </h3>

          {uploadError && (
            <div className="admin-alert-error">
              <AlertCircle size={18} />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="admin-alert-success">
              <CheckCircle2 size={18} />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="admin-field-label">Judul Dokumen</label>
              <input 
                type="text" 
                placeholder="Masukkan nama/judul dokumen" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="admin-field-label">Berkas PDF</label>
              <div className="admin-file-drop-zone">
                <input 
                  type="file" 
                  id="pdf-file-input" 
                  accept=".pdf" 
                  onChange={handleFileChange}
                  required
                  className="admin-file-input-hidden"
                />
                <label htmlFor="pdf-file-input" className="admin-file-input-label">
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

        {/* Uploaded Documents Inventory Panel */}
        <div className="glass-panel" style={{ padding: '30px', flex: 1.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} style={{ color: 'var(--primary-color)' }} />
              Dokumen Terunggah
            </h3>
            <button onClick={refreshDocuments} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              <RefreshCw size={14} />
            </button>
          </div>

          {docsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Memuat berkas...</div>
          ) : docsError ? (
            <div className="admin-alert-error">
              <AlertCircle size={18} />
              <span>{docsError}</span>
            </div>
          ) : documents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
              Belum ada dokumen. Silakan unggah file PDF pertama Anda di form sebelah kiri.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">Judul</th>
                    <th className="admin-th">Nama Berkas</th>
                    <th className="admin-th">Tanggal Unggah</th>
                    <th className="admin-th" style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="glass-card admin-tr">
                      <td className="admin-td" style={{ fontWeight: 600 }}>{doc.title}</td>
                      <td className="admin-td" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{doc.fileName}</td>
                      <td className="admin-td" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {new Date(doc.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="admin-td" style={{ textAlign: 'center' }}>
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
  );
};

export default DocumentManager;
