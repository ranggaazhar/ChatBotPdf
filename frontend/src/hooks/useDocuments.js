import { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await documentService.getAll();
      setDocuments(data.documents);
    } catch (err) {
      setError(err.message || 'Gagal memuat dokumen.');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file, title) => {
    setLoading(true);
    setError('');
    try {
      const data = await documentService.upload(file, title);
      await fetchDocuments();
      return data;
    } catch (err) {
      setError(err.message || 'Gagal mengunggah dokumen.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id) => {
    setLoading(true);
    setError('');
    try {
      const data = await documentService.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      return data;
    } catch (err) {
      setError(err.message || 'Gagal menghapus dokumen.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments
  };
};
