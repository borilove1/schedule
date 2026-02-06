import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import MainLayout from './components/layout/MainLayout';
import Calendar from './components/calendar/Calendar';
import AdminPage from './components/admin/AdminPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [authPage, setAuthPage] = useState('login');
  const [currentPage, setCurrentPage] = useState('calendar');

  // 로그아웃 시 로그인 페이지로 리셋
  React.useEffect(() => {
    if (!user && !loading) {
      setAuthPage('login');
      setCurrentPage('calendar');
    }
  }, [user, loading]);

  const { isDarkMode } = useTheme();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDarkMode ? '#e2e8f0' : '#1e293b'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: isDarkMode ? '4px solid #475569' : '4px solid #cbd5e1',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <div>로딩 중...</div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!user) {
    if (authPage === 'signup') {
      return <SignupPage onBackClick={() => setAuthPage('login')} />;
    }
    return <LoginPage onSignupClick={() => setAuthPage('signup')} />;
  }

  // 인증된 경우
  return (
    <NotificationProvider>
      <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === 'admin' && user.role === 'ADMIN' ? (
          <AdminPage />
        ) : (
          <Calendar />
        )}
      </MainLayout>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
