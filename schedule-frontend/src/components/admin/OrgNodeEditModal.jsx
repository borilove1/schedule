import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { X } from 'lucide-react';
import api from '../../utils/api';

const TYPE_LABELS = { division: '본부', office: '처/실', department: '부서' };

export default function OrgNodeEditModal({ type, mode, data, parentId, parentName, divisions, onClose, onSaved }) {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState(data?.name || '');
  const [selectedParent, setSelectedParent] = useState(parentId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cardBg = isDarkMode ? '#283548' : '#ffffff';
  const textColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const secondaryText = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#475569' : '#cbd5e1';
  const inputBg = isDarkMode ? '#1e293b' : '#f8fafc';

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    backgroundColor: inputBg,
    color: textColor,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('이름을 입력하세요.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (type === 'division') {
        if (mode === 'create') {
          await api.createDivision(name.trim());
        } else {
          await api.updateDivision(data.id, name.trim());
        }
      } else if (type === 'office') {
        if (mode === 'create') {
          await api.createOffice(name.trim(), parentId);
        } else {
          await api.updateOffice(data.id, { name: name.trim(), divisionId: selectedParent || undefined });
        }
      } else if (type === 'department') {
        if (mode === 'create') {
          await api.createDepartment(name.trim(), parentId);
        } else {
          await api.updateDepartment(data.id, { name: name.trim(), officeId: selectedParent || undefined });
        }
      }
      onSaved();
    } catch (err) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'create'
    ? `${TYPE_LABELS[type]} 추가`
    : `${TYPE_LABELS[type]} 수정`;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1001,
    }}>
      <div style={{
        backgroundColor: cardBg, borderRadius: '12px', padding: '24px',
        maxWidth: '420px', width: '90%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: textColor }}>{title}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: secondaryText, cursor: 'pointer', padding: '4px',
          }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px', marginBottom: '16px', borderRadius: '6px',
            backgroundColor: isDarkMode ? '#3b1c1c' : '#fef2f2', color: '#ef4444', fontSize: '13px',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 상위 조직 표시 (생성 모드) */}
          {mode === 'create' && type !== 'division' && parentName && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: secondaryText, marginBottom: '4px' }}>
                상위 조직
              </label>
              <input type="text" value={parentName} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
          )}

          {/* 이름 입력 */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: secondaryText, marginBottom: '4px' }}>
              {TYPE_LABELS[type]} 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`${TYPE_LABELS[type]} 이름을 입력하세요`}
              style={inputStyle}
              autoFocus
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', border: `1px solid ${borderColor}`, borderRadius: '6px',
            backgroundColor: 'transparent', color: textColor, cursor: 'pointer', fontSize: '14px',
          }}>취소</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '8px 20px', border: 'none', borderRadius: '6px',
            backgroundColor: '#3B82F6', color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px',
            opacity: saving ? 0.7 : 1,
          }}>{saving ? '저장 중...' : '저장'}</button>
        </div>
      </div>
    </div>
  );
}
