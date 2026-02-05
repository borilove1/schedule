import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Sun, Moon, LogOut, Menu, X } from 'lucide-react';

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isMobile] = useState(window.innerWidth <= 768);

  const bgColor = darkMode ? '#0f172a' : '#f1f5f9';
  const cardBg = darkMode ? '#1e293b' : '#fff';
  const textColor = darkMode ? '#e2e8f0' : '#1e293b';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bgColor, color: textColor }}>
      {/* Header */}
      <header style={{
        padding: isMobile ? '12px 16px' : '16px 24px',
        borderBottom: `1px solid ${borderColor}`,
        backgroundColor: cardBg,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              style={{
                background: 'none',
                border: 'none',
                color: textColor,
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
          <Calendar size={isMobile ? 24 : 28} color="#3B82F6" />
          <h1 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '600', margin: 0 }}>
            업무일정 관리
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
          {!isMobile && user && (
            <div style={{ textAlign: 'right', marginRight: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                {user.division} {user.office}
              </div>
              <div style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                {user.department} {user.position} {user.name}님
              </div>
            </div>
          )}
          
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: 'none',
              border: 'none',
              color: textColor,
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: textColor,
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="로그아웃"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Mobile User Info */}
      {isMobile && user && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: cardBg,
          borderBottom: `1px solid ${borderColor}`,
          fontSize: '13px'
        }}>
          <div style={{ fontWeight: '500' }}>
            {user.division} {user.office}
          </div>
          <div style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
            {user.department} {user.position} {user.name}님
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ padding: isMobile ? '16px' : '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
