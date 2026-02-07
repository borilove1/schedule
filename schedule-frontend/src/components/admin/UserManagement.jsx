import React, { useState, useEffect, useCallback } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Edit2, ToggleLeft, ToggleRight, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import ErrorAlert from '../common/ErrorAlert';
import ConfirmDialog from '../common/ConfirmDialog';
import api from '../../utils/api';
import UserDetailModal from './UserDetailModal';

const ROLE_LABELS = { USER: '일반 사용자', DEPT_LEAD: '부서장', ADMIN: '관리자' };

export default function UserManagement() {
  const { isDarkMode, cardBg, textColor, secondaryTextColor, borderColor, inputBg } = useThemeColors();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState('');

  const selectStyle = {
    padding: '8px 12px',
    border: `1px solid ${borderColor}`,
    borderRadius: '6px',
    backgroundColor: inputBg,
    color: textColor,
    fontSize: '13px',
    outline: 'none',
  };

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const result = await api.getUsers(params);
      let filteredUsers = result.users || [];
      if (activeFilter === 'active') {
        filteredUsers = filteredUsers.filter(u => u.is_active);
      } else if (activeFilter === 'inactive') {
        filteredUsers = filteredUsers.filter(u => !u.is_active);
      }
      setUsers(filteredUsers);
      setPagination(result.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 });
    } catch (err) {
      setError(err.message || '사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  const handleSearch = (e) => { e.preventDefault(); fetchUsers(1); };

  const handleToggleActive = async (userId) => {
    try { await api.toggleUserActive(userId); fetchUsers(pagination.page); }
    catch (err) { setError(err.message); }
  };

  const handleDelete = async (userId) => {
    try { await api.deleteUser(userId); setDeleteConfirm(null); fetchUsers(pagination.page); }
    catch (err) { setError(err.message); }
  };

  const handleUserSaved = () => { setSelectedUser(null); fetchUsers(pagination.page); };

  return (
    <div>
      {/* 검색 및 필터 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '200px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: secondaryTextColor }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 또는 이메일 검색..."
              style={{ ...selectStyle, width: '100%', paddingLeft: '34px', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{
            padding: '8px 16px', backgroundColor: '#3B82F6', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
          }}>검색</button>
        </form>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={selectStyle}>
          <option value="">전체 역할</option>
          <option value="USER">일반 사용자</option>
          <option value="DEPT_LEAD">부서장</option>
          <option value="ADMIN">관리자</option>
        </select>
        <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)} style={selectStyle}>
          <option value="">전체 상태</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
      </div>

      <ErrorAlert message={error} />

      {/* 사용자 테이블 */}
      <div style={{
        backgroundColor: cardBg, borderRadius: '8px', border: `1px solid ${borderColor}`,
        overflow: 'hidden', transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${borderColor}` }}>
                {['이름', '이메일', '직급', '소속', '역할', '상태', '최근 로그인', '액션'].map(header => (
                  <th key={header} style={{
                    padding: '12px 16px', textAlign: 'left', fontWeight: '600',
                    color: secondaryTextColor, fontSize: '12px', textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: secondaryTextColor }}>로딩 중...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: secondaryTextColor }}>사용자가 없습니다.</td></tr>
              ) : users.map(user => {
                const isSelf = currentUser && currentUser.id === user.id;
                return (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${borderColor}` }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{user.name}</td>
                    <td style={{ padding: '12px 16px', color: secondaryTextColor }}>{user.email}</td>
                    <td style={{ padding: '12px 16px' }}>{user.position}</td>
                    <td style={{ padding: '12px 16px', color: secondaryTextColor, whiteSpace: 'nowrap' }}>
                      {[user.division, user.office, user.department].filter(Boolean).join(' > ')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                        backgroundColor: user.role === 'ADMIN' ? '#7c3aed20' : user.role === 'DEPT_LEAD' ? '#3b82f620' : isDarkMode ? '#475569' : '#e2e8f0',
                        color: user.role === 'ADMIN' ? '#a78bfa' : user.role === 'DEPT_LEAD' ? '#60a5fa' : secondaryTextColor,
                      }}>{ROLE_LABELS[user.role] || user.role}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                        backgroundColor: user.is_active ? '#10b98120' : '#ef444420',
                        color: user.is_active ? '#10b981' : '#ef4444',
                      }}>{user.is_active ? '활성' : '비활성'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: secondaryTextColor, whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setSelectedUser(user)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#3B82F6', padding: '4px', display: 'flex', alignItems: 'center',
                        }} title="수정"><Edit2 size={15} /></button>
                        <button onClick={() => handleToggleActive(user.id)} disabled={isSelf} style={{
                          background: 'none', border: 'none',
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                          color: isSelf ? borderColor : user.is_active ? '#10b981' : '#ef4444',
                          padding: '4px', display: 'flex', alignItems: 'center', opacity: isSelf ? 0.4 : 1,
                        }} title={user.is_active ? '비활성화' : '활성화'}>
                          {user.is_active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        </button>
                        <button onClick={() => setDeleteConfirm(user)} disabled={isSelf} style={{
                          background: 'none', border: 'none',
                          cursor: isSelf ? 'not-allowed' : 'pointer',
                          color: isSelf ? borderColor : '#ef4444',
                          padding: '4px', display: 'flex', alignItems: 'center', opacity: isSelf ? 0.4 : 1,
                        }} title="삭제"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px', borderTop: `1px solid ${borderColor}` }}>
            <button onClick={() => fetchUsers(pagination.page - 1)} disabled={pagination.page <= 1} style={{
              background: 'none', border: 'none', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              color: pagination.page <= 1 ? borderColor : textColor, padding: '4px', display: 'flex',
            }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '13px', color: secondaryTextColor }}>{pagination.page} / {pagination.totalPages}</span>
            <button onClick={() => fetchUsers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} style={{
              background: 'none', border: 'none',
              cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
              color: pagination.page >= pagination.totalPages ? borderColor : textColor, padding: '4px', display: 'flex',
            }}><ChevronRight size={18} /></button>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="사용자 삭제"
          message={`${deleteConfirm.name} (${deleteConfirm.email})님을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`}
          actions={[{ label: '삭제', onClick: () => handleDelete(deleteConfirm.id), variant: 'danger' }]}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onSaved={handleUserSaved} />
      )}
    </div>
  );
}
