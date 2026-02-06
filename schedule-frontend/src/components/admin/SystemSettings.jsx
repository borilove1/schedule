import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Save, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

const SETTING_CONFIG = {
  due_soon_threshold: {
    label: '마감임박 기준 시간',
    description: '일정이 마감 임박으로 표시되는 기준 시간 (시간 단위)',
    type: 'number',
    unit: '시간',
  },
  max_events_per_month: {
    label: '월 최대 일정 수',
    description: '사용자당 월별 최대 일정 생성 가능 수',
    type: 'number',
    unit: '개',
  },
  allow_past_events: {
    label: '과거 일정 생성 허용',
    description: '과거 날짜에 일정을 생성할 수 있도록 허용',
    type: 'boolean',
  },
  default_alert: {
    label: '기본 알림 시간',
    description: '새 일정 생성 시 기본 알림 설정',
    type: 'select',
    options: [
      { value: 'none', label: '없음' },
      { value: '30min', label: '30분 전' },
      { value: '1hour', label: '1시간 전' },
      { value: '3hour', label: '3시간 전' },
      { value: '1day', label: '1일 전' },
    ],
  },
  password_min_length: {
    label: '비밀번호 최소 길이',
    description: '회원가입 시 비밀번호 최소 길이 제한',
    type: 'number',
    unit: '자',
  },
  session_timeout: {
    label: '세션 타임아웃',
    description: '비활동 시 자동 로그아웃되는 시간 (분 단위)',
    type: 'number',
    unit: '분',
  },
};

export default function SystemSettings() {
  const { isDarkMode } = useTheme();
  const [settings, setSettings] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const cardBg = isDarkMode ? '#283548' : '#ffffff';
  const textColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const secondaryText = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#475569' : '#cbd5e1';
  const inputBg = isDarkMode ? '#1e293b' : '#f8fafc';

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSettings();
      setSettings(data);
      setOriginal(data);
    } catch (err) {
      setError(err.message || '설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // 변경된 설정만 전송
      const changed = {};
      for (const key of Object.keys(settings)) {
        if (JSON.stringify(settings[key]) !== JSON.stringify(original[key])) {
          changed[key] = settings[key];
        }
      }

      if (Object.keys(changed).length === 0) {
        setSuccess('변경된 설정이 없습니다.');
        setSaving(false);
        return;
      }

      await api.updateSettings(changed);
      setOriginal({ ...settings });
      setSuccess('설정이 저장되었습니다.');
    } catch (err) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...original });
    setSuccess('');
    setError('');
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original);

  const inputStyle = {
    padding: '8px 12px',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    backgroundColor: inputBg,
    color: textColor,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: secondaryText }}>설정 로딩 중...</div>;
  }

  return (
    <div>
      {error && (
        <div style={{
          padding: '12px', marginBottom: '16px', borderRadius: '6px',
          backgroundColor: isDarkMode ? '#3b1c1c' : '#fef2f2', color: '#ef4444', fontSize: '13px',
        }}>{error}</div>
      )}

      {success && (
        <div style={{
          padding: '12px', marginBottom: '16px', borderRadius: '6px',
          backgroundColor: isDarkMode ? '#1c3b2a' : '#f0fdf4', color: '#10b981', fontSize: '13px',
        }}>{success}</div>
      )}

      <div style={{
        backgroundColor: cardBg, borderRadius: '8px',
        border: `1px solid ${borderColor}`, overflow: 'hidden',
        transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden',
      }}>
        {Object.entries(SETTING_CONFIG).map(([key, config], index) => {
          const value = settings[key];
          const isLast = index === Object.entries(SETTING_CONFIG).length - 1;

          return (
            <div key={key} style={{
              padding: '20px 24px',
              borderBottom: isLast ? 'none' : `1px solid ${borderColor}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '24px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: textColor, marginBottom: '4px' }}>
                  {config.label}
                </div>
                <div style={{ fontSize: '12px', color: secondaryText }}>
                  {config.description}
                </div>
              </div>

              <div style={{ minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                {config.type === 'number' && (
                  <>
                    <input
                      type="number"
                      value={value ?? ''}
                      onChange={e => handleChange(key, parseInt(e.target.value) || 0)}
                      style={{ ...inputStyle, width: '80px', textAlign: 'right' }}
                      min={0}
                    />
                    {config.unit && <span style={{ fontSize: '13px', color: secondaryText }}>{config.unit}</span>}
                  </>
                )}

                {config.type === 'boolean' && (
                  <button
                    onClick={() => handleChange(key, !value)}
                    style={{
                      width: '48px', height: '26px', borderRadius: '13px',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      backgroundColor: value ? '#3B82F6' : (isDarkMode ? '#475569' : '#cbd5e1'),
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      backgroundColor: '#fff', position: 'absolute', top: '3px',
                      left: value ? '25px' : '3px', transition: 'left 0.2s',
                    }} />
                  </button>
                )}

                {config.type === 'select' && (
                  <select
                    value={value ?? ''}
                    onChange={e => handleChange(key, e.target.value)}
                    style={{ ...inputStyle, minWidth: '120px' }}
                  >
                    {config.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 20px', border: `1px solid ${borderColor}`, borderRadius: '6px',
            backgroundColor: 'transparent', color: hasChanges ? textColor : secondaryText,
            cursor: hasChanges ? 'pointer' : 'not-allowed', fontSize: '14px',
            opacity: hasChanges ? 1 : 0.5,
          }}
        >
          <RefreshCw size={16} /> 초기화
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 20px', border: 'none', borderRadius: '6px',
            backgroundColor: '#3B82F6', color: '#fff',
            cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer', fontSize: '14px',
            opacity: (saving || !hasChanges) ? 0.6 : 1,
          }}
        >
          <Save size={16} /> {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
