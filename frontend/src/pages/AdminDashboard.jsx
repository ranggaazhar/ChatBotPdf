import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDocuments } from '../hooks/useDocuments';
import { adminService } from '../services/adminService';
import DashboardLayout from '../components/DashboardLayout';
import DocumentManager from '../components/DocumentManager';
import LogTable from '../components/LogTable';
import { Database, ListFilter } from 'lucide-react';

/**
 * Admin Dashboard Page acting as layout container and state provider.
 */
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { 
    documents, 
    loading: docsLoading, 
    error: docsError, 
    uploadDocument, 
    deleteDocument, 
    refreshDocuments 
  } = useDocuments();

  const [activeTab, setActiveTab] = useState('documents'); // 'documents' atau 'logs'
  const [logs, setLogs] = useState([]);
  
  // State Upload
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // State List & Log
  const [logSearchQuery, setLogSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await adminService.getSearchLogs();
      setLogs(data.logs);
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

    try {
      await uploadDocument(file, title);
      setUploadSuccess('Dokumen berhasil diunggah dan diekstrak!');
      setFile(null);
      setTitle('');
      // Reset input file manual
      const fileInput = document.getElementById('pdf-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setUploadError(err.message || 'Gagal mengunggah berkas.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteDoc = async (id, docTitle) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${docTitle}"? Semua riwayat chat terkait dokumen ini juga akan terhapus.`)) {
      return;
    }

    try {
      await deleteDocument(id);
      alert('Dokumen berhasil dihapus.');
      fetchLogs(); // refresh log
    } catch (err) {
      alert(err.message || 'Gagal menghapus dokumen.');
    }
  };

  return (
    <DashboardLayout
      logoIcon="🔒"
      logoText="PDF Admin"
      user={user}
      logout={logout}
      sidebarContent={
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
      }
    >
      <div className="main-content">
        {activeTab === 'documents' ? (
          <DocumentManager
            documents={documents}
            docsLoading={docsLoading}
            docsError={docsError}
            file={file}
            title={title}
            uploadLoading={uploadLoading}
            uploadError={uploadError}
            uploadSuccess={uploadSuccess}
            setTitle={setTitle}
            handleFileChange={handleFileChange}
            handleUpload={handleUpload}
            handleDeleteDoc={handleDeleteDoc}
            refreshDocuments={refreshDocuments}
          />
        ) : (
          <LogTable
            logs={logs}
            logSearchQuery={logSearchQuery}
            setLogSearchQuery={setLogSearchQuery}
            fetchLogs={fetchLogs}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
