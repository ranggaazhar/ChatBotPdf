import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { User, Mail, Lock, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.register(username, email, password);
      setSuccess('Registrasi berhasil! Mengalihkan ke halaman masuk...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-glow-bg"></div>
      <div className="glass-panel animate-fade register-card">
        <div className="register-logo-header">
          <div className="register-logo-icon">🤖</div>
          <h2 className="register-logo-text">Chatbot PDF</h2>
        </div>
        <p className="register-subtitle">Daftar akun baru untuk mulai menjelajahi dokumen Anda.</p>

        {error && (
          <div className="register-error-alert">
            <AlertCircle size={20} style={{ minWidth: 20 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="register-success-alert">
            <ShieldCheck size={20} style={{ minWidth: 20 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-input-group">
            <label className="register-label">Username</label>
            <div className="register-input-wrapper">
              <User size={18} className="register-input-icon" />
              <input
                type="text"
                placeholder="Rangga"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="register-input-with-icon"
              />
            </div>
          </div>

          <div className="register-input-group">
            <label className="register-label">Email</label>
            <div className="register-input-wrapper">
              <Mail size={18} className="register-input-icon" />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="register-input-with-icon"
              />
            </div>
          </div>

          <div className="register-input-group">
            <label className="register-label">Password</label>
            <div className="register-input-wrapper">
              <Lock size={18} className="register-input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="register-input-with-icon"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary register-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Daftar Akun</span>
              </>
            )}
          </button>
        </form>

        <p className="register-footer-text">
          Sudah punya akun? <Link to="/login" className="register-link">Masuk</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
