import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar } from 'lucide-react';

export default function LoginPage({ onSignupClick }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Calendar size={48} color="#3B82F6" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>
            업무일정 관리
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
            로그인하여 시작하세요
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#e2e8f0',
              marginBottom: '8px'
            }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="email@example.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#e2e8f0',
              marginBottom: '8px'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#7f1d1d',
              color: '#fca5a5',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: loading ? '#1e40af' : '#3B82F6',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#94a3b8'
        }}>
          계정이 없으신가요?{' '}
          <button
            onClick={onSignupClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#3B82F6',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
