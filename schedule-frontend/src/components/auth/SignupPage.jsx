import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';

export default function SignupPage({ onBackClick }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    position: '',
    division: '',
    office: '',
    department: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState({
    divisions: [],
    offices: {},
    departments: {}
  });
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // 조직 구조 로드
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const data = await api.request('/organizations/structure');
        setOrganizations(data.organization || {
          divisions: ['기술본부', '경영본부'],
          offices: { '기술본부': ['IT처', '기획관리실'], '경영본부': ['재무처', '인사처'] },
          departments: { 'IT처': ['개발1부서', '개발2부서'], '기획관리실': ['기획부서'], '재무처': ['재무부서'], '인사처': ['인사부서'] }
        });
        setLoadingOrgs(false);
      } catch (error) {
        console.error('Failed to load organizations:', error);
        // 기본값 사용
        setOrganizations({
          divisions: ['기술본부', '경영본부'],
          offices: { '기술본부': ['IT처', '기획관리실'], '경영본부': ['재무처', '인사처'] },
          departments: { 'IT처': ['개발1부서', '개발2부서'], '기획관리실': ['기획부서'], '재무처': ['재무부서'], '인사처': ['인사부서'] }
        });
        setLoadingOrgs(false);
      }
    };
    loadOrganizations();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 본부 변경 시 처와 부서 초기화
    if (name === 'division') {
      setFormData({
        ...formData,
        division: value,
        office: '',
        department: ''
      });
    }
    // 처 변경 시 부서 초기화
    else if (name === 'office') {
      setFormData({
        ...formData,
        office: value,
        department: ''
      });
    }
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // 선택 가능한 처 목록
  const availableOffices = formData.division ? (organizations.offices[formData.division] || []) : [];
  
  // 선택 가능한 부서 목록
  const availableDepartments = formData.office ? (organizations.departments[formData.office] || []) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#e2e8f0',
    marginBottom: '8px'
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
        maxWidth: '500px',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
      }}>
        <button
          onClick={onBackClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            padding: '4px'
          }}
        >
          <ArrowLeft size={20} /> 로그인으로 돌아가기
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Calendar size={48} color="#3B82F6" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#e2e8f0', margin: 0 }}>
            회원가입
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>이름 *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="홍길동"
              />
            </div>
            <div>
              <label style={labelStyle}>직급 *</label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                <option value="">선택</option>
                <option value="사원">사원</option>
                <option value="대리">대리</option>
                <option value="과장">과장</option>
                <option value="차장">차장</option>
                <option value="부장">부장</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>이메일 *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="email@example.com"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>비밀번호 *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              style={inputStyle}
              placeholder="최소 6자 이상"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>본부 *</label>
            <select
              name="division"
              value={formData.division}
              onChange={handleChange}
              required
              disabled={loadingOrgs}
              style={inputStyle}
            >
              <option value="">선택하세요</option>
              {organizations.divisions.map(division => (
                <option key={division} value={division}>{division}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>처 *</label>
            <select
              name="office"
              value={formData.office}
              onChange={handleChange}
              required
              disabled={!formData.division || loadingOrgs}
              style={inputStyle}
            >
              <option value="">선택하세요</option>
              {availableOffices.map(office => (
                <option key={office} value={office}>{office}</option>
              ))}
            </select>
            {!formData.division && (
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                먼저 본부를 선택하세요
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>부서 *</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              disabled={!formData.office || loadingOrgs}
              style={inputStyle}
            >
              <option value="">선택하세요</option>
              {availableDepartments.map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            {!formData.office && (
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                먼저 처를 선택하세요
              </div>
            )}
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
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}
