import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, Building2, Building, FolderOpen } from 'lucide-react';
import api from '../../utils/api';
import OrgNodeEditModal from './OrgNodeEditModal';

export default function OrganizationManagement() {
  const { isDarkMode } = useTheme();
  const [divisions, setDivisions] = useState([]);
  const [offices, setOffices] = useState({});
  const [departments, setDepartments] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const cardBg = isDarkMode ? '#283548' : '#ffffff';
  const textColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const secondaryText = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#475569' : '#cbd5e1';
  const hoverBg = isDarkMode ? '#334155' : '#f1f5f9';

  const loadStructure = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const divResult = await api.getDivisions();
      const divList = divResult.divisions || divResult || [];
      setDivisions(divList);

      // 각 본부별 처 로드
      const officeMap = {};
      const deptMap = {};
      for (const div of divList) {
        const offResult = await api.getOffices(div.id);
        const offList = offResult.offices || offResult || [];
        officeMap[div.id] = offList;

        for (const off of offList) {
          const deptResult = await api.request(`/organizations/departments?officeId=${off.id}`);
          const deptList = deptResult.departments || deptResult || [];
          deptMap[off.id] = deptList;
        }
      }
      setOffices(officeMap);
      setDepartments(deptMap);
    } catch (err) {
      setError(err.message || '조직 구조를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStructure();
  }, [loadStructure]);

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    try {
      if (type === 'division') await api.deleteDivision(id);
      else if (type === 'office') await api.deleteOffice(id);
      else if (type === 'department') await api.deleteDepartment(id);
      setDeleteConfirm(null);
      loadStructure();
    } catch (err) {
      setError(err.message);
      setDeleteConfirm(null);
    }
  };

  const handleSaved = () => {
    setEditModal(null);
    loadStructure();
  };

  const nodeStyle = (level) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    paddingLeft: `${16 + level * 24}px`,
    borderBottom: `1px solid ${borderColor}`,
    cursor: 'pointer',
    fontSize: '14px',
  });

  const actionBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: secondaryText }}>조직 구조 로딩 중...</div>;
  }

  return (
    <div>
      {error && (
        <div style={{
          padding: '12px', marginBottom: '16px', borderRadius: '6px',
          backgroundColor: isDarkMode ? '#3b1c1c' : '#fef2f2', color: '#ef4444', fontSize: '13px',
        }}>{error}</div>
      )}

      {/* 본부 추가 버튼 */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setEditModal({ type: 'division', mode: 'create' })}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', backgroundColor: '#3B82F6', color: '#fff',
            border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
          }}
        >
          <Plus size={16} /> 본부 추가
        </button>
      </div>

      {/* 조직 트리 */}
      <div style={{
        backgroundColor: cardBg, borderRadius: '8px',
        border: `1px solid ${borderColor}`, overflow: 'hidden',
        transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden',
      }}>
        {divisions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: secondaryText }}>
            등록된 조직이 없습니다.
          </div>
        ) : divisions.map(div => {
          const divKey = `div-${div.id}`;
          const isExpanded = expanded[divKey];
          const divOffices = offices[div.id] || [];

          return (
            <div key={div.id}>
              {/* 본부 노드 */}
              <div style={nodeStyle(0)}>
                <span onClick={() => toggleExpand(divKey)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  {divOffices.length > 0 ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span style={{ width: 16 }} />}
                </span>
                <Building2 size={16} color="#3B82F6" />
                <span style={{ flex: 1, fontWeight: '600', color: textColor }}>{div.name}</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'office', mode: 'create', parentId: div.id, parentName: div.name }); }}
                    style={{ ...actionBtnStyle, color: '#10b981' }}
                    title="하위 처 추가"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'division', mode: 'edit', data: div }); }}
                    style={{ ...actionBtnStyle, color: '#3B82F6' }}
                    title="수정"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'division', id: div.id, name: div.name }); }}
                    style={{ ...actionBtnStyle, color: '#ef4444' }}
                    title="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* 처 노드들 */}
              {isExpanded && divOffices.map(off => {
                const offKey = `off-${off.id}`;
                const isOffExpanded = expanded[offKey];
                const offDepts = departments[off.id] || [];

                return (
                  <div key={off.id}>
                    <div style={nodeStyle(1)}>
                      <span onClick={() => toggleExpand(offKey)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        {offDepts.length > 0 ? (isOffExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span style={{ width: 16 }} />}
                      </span>
                      <Building size={16} color="#8b5cf6" />
                      <span style={{ flex: 1, fontWeight: '500', color: textColor }}>{off.name}</span>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'department', mode: 'create', parentId: off.id, parentName: off.name }); }}
                          style={{ ...actionBtnStyle, color: '#10b981' }}
                          title="하위 부서 추가"
                        >
                          <Plus size={15} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'office', mode: 'edit', data: off, parentId: div.id }); }}
                          style={{ ...actionBtnStyle, color: '#3B82F6' }}
                          title="수정"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'office', id: off.id, name: off.name }); }}
                          style={{ ...actionBtnStyle, color: '#ef4444' }}
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* 부서 노드들 */}
                    {isOffExpanded && offDepts.map(dept => (
                      <div key={dept.id} style={nodeStyle(2)}>
                        <span style={{ width: 16 }} />
                        <FolderOpen size={16} color="#f59e0b" />
                        <span style={{ flex: 1, color: textColor }}>{dept.name}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'department', mode: 'edit', data: dept, parentId: off.id }); }}
                            style={{ ...actionBtnStyle, color: '#3B82F6' }}
                            title="수정"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'department', id: dept.id, name: dept.name }); }}
                            style={{ ...actionBtnStyle, color: '#ef4444' }}
                            title="삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: cardBg, borderRadius: '12px', padding: '24px',
            maxWidth: '400px', width: '90%',
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: textColor }}>
              {deleteConfirm.type === 'division' ? '본부' : deleteConfirm.type === 'office' ? '처' : '부서'} 삭제
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: secondaryText }}>
              <strong>{deleteConfirm.name}</strong>을(를) 삭제하시겠습니까?
              {deleteConfirm.type !== 'department' && (
                <><br />하위 조직도 함께 삭제됩니다.</>
              )}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 16px', border: `1px solid ${borderColor}`, borderRadius: '6px',
                  backgroundColor: 'transparent', color: textColor, cursor: 'pointer', fontSize: '13px',
                }}
              >취소</button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px', border: 'none', borderRadius: '6px',
                  backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: '13px',
                }}
              >삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 생성/수정 모달 */}
      {editModal && (
        <OrgNodeEditModal
          {...editModal}
          divisions={divisions}
          onClose={() => setEditModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
