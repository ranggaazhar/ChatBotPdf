import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      login(data.token, data.user);
      
      // Arahkan berdasarkan role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glow-bg"></div>
      <div className="glass-panel animate-fade login-card">
        <div className="login-logo-header">
          <div className="login-logo-icon">🤖</div>
          <h2 className="login-logo-text">Chatbot PDF</h2>
        </div>
        <p className="login-subtitle">Selamat datang kembali. Silakan masuk ke akun Anda.</p>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={20} style={{ minWidth: 20 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-group">
            <label className="login-label">Email</label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input-with-icon"
              />
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-label">Password</label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input-with-icon"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="login-loader">Memproses...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Masuk</span>
              </>
            )}
          </button>
        </form>

        <p className="login-footer-text">
          Belum punya akun? <Link to="/register" className="login-link">Daftar Sekarang</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
