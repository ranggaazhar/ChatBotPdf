import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';

/**
 * Reusable Dashboard Layout containing the responsive sidebar and right-hand main content panel.
 * @param {Object} props
 * @param {React.ReactNode} props.logoIcon - The icon or emoji representing the app section
 * @param {string} props.logoText - The title of the app logo
 * @param {React.ReactNode} props.sidebarContent - Rendered navigation or sidebar-specific content
 * @param {Object} props.user - The logged-in user object
 * @param {Function} props.logout - The logout dispatch handler
 * @param {React.ReactNode} props.children - Main panel children nodes
 */
const DashboardLayout = ({ 
  logoIcon, 
  logoText, 
  sidebarContent, 
  user, 
  logout, 
  children 
}) => {
  const isAdmin = user?.role === 'admin';

  return (
    <div className="app-container">
      {/* Sidebar Frame */}
      <div className="sidebar" style={{ minWidth: '260px', flexShrink: 0 }}>
        <div className="logo-container">
          <div className="logo-icon">{logoIcon}</div>
          <span className="logo-text">{logoText}</span>
        </div>

        {/* Dynamic Sidebar Content */}
        {sidebarContent}

        {/* Profile Card Section at Bottom */}
        <div className="user-profile-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.05)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '1px solid var(--border-glass)' 
            }}>
              <UserIcon size={16} style={{ color: isAdmin ? 'var(--accent)' : 'var(--primary-color)' }} />
            </div>
            <div className="user-info">
              <span className="user-name" style={{ fontSize: '0.9rem' }}>{user?.username}</span>
              <span 
                className="user-role-badge" 
                style={isAdmin ? { color: 'var(--accent)', backgroundColor: 'rgba(217, 70, 239, 0.15)' } : undefined}
              >
                {isAdmin ? 'Admin' : 'User'}
              </span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {children}
    </div>
  );
};

export default DashboardLayout;
