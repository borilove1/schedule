import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { X } from 'lucide-react';
import api from '../../utils/api';

const POSITIONS = ['사원', '대리', '과장', '차장', '부장', '실장', '처장', '본부장', '관리자'];
const ROLES = [
  { value: 'USER', label: '일반 사용자' },
  { value: 'DEPT_LEAD', label: '부서장' },
  { value: 'ADMIN', label: '관리자' },
];
const SCOPES = [
  { value: 'DEPARTMENT', label: '부서' },
  { value: 'OFFICE', label: '처/실' },
  { value: 'DIVISION', label: '본부' },
];

export default function UserDetailModal({ user, onClose, onSaved }) {
  const { isDarkMode } = useTheme();
  const [form, setForm] = useState({
    name: user.name || '',
    position: user.position || '',
    role: user.role || 'USER',
    scope: user.scope || '',
    divisionId: '',
    officeId: '',
    departmentId: '',
  });
  const [divisions, setDivisions] = useState([]);
  const [offices, setOffices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const cardBg = isDarkMode ? '#283548' : '#ffffff';
  const textColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const secondaryText = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#475569' : '#cbd5e1';
  const inputBg = isDarkMode ? '#1e293b' : '#f8fafc';

  // 조직 구조 로드
  useEffect(() => {
    const loadOrg = async () => {
      try {
        const divResult = await api.getDivisions();
        const divList = divResult.divisions || divResult || [];
        setDivisions(divList);

        // 사용자의 현재 소속 기반으로 초기값 설정
        // user 객체에서 division/office/department는 이름이므로 ID를 찾아야 함
        if (user.division) {
          const matchDiv = divList.find(d => d.name === user.division);
          if (matchDiv) {
            setForm(prev => ({ ...prev, divisionId: matchDiv.id }));
            const offResult = await api.getOffices(matchDiv.id);
            const offList = offResult.offices || offResult || [];
            setOffices(offList);

            if (user.office) {
              const matchOff = offList.find(o => o.name === user.office);
              if (matchOff) {
                setForm(prev => ({ ...prev, officeId: matchOff.id }));
                const deptResult = await api.request(`/organizations/departments?officeId=${matchOff.id}`);
                const deptList = deptResult.departments || deptResult || [];
                setDepartments(deptList);

                if (user.department) {
                  const matchDept = deptList.find(d => d.name === user.department);
                  if (matchDept) {
                    setForm(prev => ({ ...prev, departmentId: matchDept.id }));
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('조직 구조 로드 실패:', err);
      }
    };
    loadOrg();
  }, [user]);

  const handleDivisionChange = async (divisionId) => {
    setForm(prev => ({ ...prev, divisionId, officeId: '', departmentId: '' }));
    setOffices([]);
    setDepartments([]);
    if (divisionId) {
      try {
        const result = await api.getOffices(divisionId);
        setOffices(result.offices || result || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOfficeChange = async (officeId) => {
    setForm(prev => ({ ...prev, officeId, departmentId: '' }));
    setDepartments([]);
    if (officeId) {
      try {
        const result = await api.request(`/organizations/departments?officeId=${officeId}`);
        setDepartments(result.departments || result || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.updateUser(user.id, {
        name: form.name,
        position: form.position,
        role: form.role,
        scope: form.role === 'DEPT_LEAD' ? (form.scope || 'DEPARTMENT') : null,
        divisionId: form.divisionId || null,
        officeId: form.officeId || null,
        departmentId: form.departmentId || null,
      });
      onSaved();
    } catch (err) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

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

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: secondaryText,
    marginBottom: '4px',
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: cardBg, borderRadius: '12px', padding: '24px',
        maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: textColor }}>사용자 수정</h3>
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
          {/* 이메일 (읽기전용) */}
          <div>
            <label style={labelStyle}>이메일</label>
            <input type="text" value={user.email} disabled style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
          </div>

          {/* 이름 */}
          <div>
            <label style={labelStyle}>이름</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* 직급 */}
          <div>
            <label style={labelStyle}>직급</label>
            <select
              value={form.position}
              onChange={e => setForm(prev => ({ ...prev, position: e.target.value }))}
              style={inputStyle}
            >
              <option value="">선택하세요</option>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* 역할 */}
          <div>
            <label style={labelStyle}>역할</label>
            <select
              value={form.role}
              onChange={e => setForm(prev => ({ ...prev, role: e.target.value, scope: '' }))}
              style={inputStyle}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* Scope (DEPT_LEAD일 때만) */}
          {form.role === 'DEPT_LEAD' && (
            <div>
              <label style={labelStyle}>관리 범위</label>
              <select
                value={form.scope}
                onChange={e => setForm(prev => ({ ...prev, scope: e.target.value }))}
                style={inputStyle}
              >
                <option value="">선택하세요</option>
                {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}

          {/* 본부 */}
          <div>
            <label style={labelStyle}>본부</label>
            <select
              value={form.divisionId}
              onChange={e => handleDivisionChange(e.target.value)}
              style={inputStyle}
            >
              <option value="">선택하세요</option>
              {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* 처 */}
          <div>
            <label style={labelStyle}>처/실</label>
            <select
              value={form.officeId}
              onChange={e => handleOfficeChange(e.target.value)}
              style={inputStyle}
              disabled={!form.divisionId}
            >
              <option value="">선택하세요</option>
              {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          {/* 부서 */}
          <div>
            <label style={labelStyle}>부서</label>
            <select
              value={form.departmentId}
              onChange={e => setForm(prev => ({ ...prev, departmentId: e.target.value }))}
              style={inputStyle}
              disabled={!form.officeId}
            >
              <option value="">선택하세요</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button onClick={onClose} style={{
            padding: '8px 20px', border: `1px solid ${borderColor}`, borderRadius: '6px',
            backgroundColor: 'transparent', color: textColor, cursor: 'pointer', fontSize: '14px',
          }}>취소</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '8px 20px', border: 'none', borderRadius: '6px',
            backgroundColor: '#3B82F6', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px', opacity: saving ? 0.7 : 1,
          }}>{saving ? '저장 중...' : '저장'}</button>
        </div>
      </div>
    </div>
  );
}
