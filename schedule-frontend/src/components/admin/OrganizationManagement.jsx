import React, { useState, useEffect, useCallback } from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, Building2, Building, FolderOpen } from 'lucide-react';
import ErrorAlert from '../common/ErrorAlert';
import ConfirmDialog from '../common/ConfirmDialog';
import api from '../../utils/api';
import OrgNodeEditModal from './OrgNodeEditModal';

export default function OrganizationManagement() {
  const { cardBg, textColor, secondaryTextColor, borderColor } = useThemeColors();
  const [divisions, setDivisions] = useState([]);
  const [offices, setOffices] = useState({});
  const [departments, setDepartments] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadStructure = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const divResult = await api.getDivisions();
      const divList = divResult.divisions || divResult || [];
      setDivisions(divList);

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

  useEffect(() => { loadStructure(); }, [loadStructure]);

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

  const handleSaved = () => { setEditModal(null); loadStructure(); };

  const nodeStyle = (level) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', paddingLeft: `${16 + level * 24}px`,
    borderBottom: `1px solid ${borderColor}`, cursor: 'pointer', fontSize: '14px',
  });

  const actionBtnStyle = {
    background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: secondaryTextColor }}>조직 구조 로딩 중...</div>;
  }

  return (
    <div>
      <ErrorAlert message={error} />

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

      <div style={{
        backgroundColor: cardBg, borderRadius: '8px',
        border: `1px solid ${borderColor}`, overflow: 'hidden',
        transform: 'translateZ(0)', WebkitBackfaceVisibility: 'hidden',
      }}>
        {divisions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: secondaryTextColor }}>등록된 조직이 없습니다.</div>
        ) : divisions.map(div => {
          const divKey = `div-${div.id}`;
          const isExpanded = expanded[divKey];
          const divOffices = offices[div.id] || [];

          return (
            <div key={div.id}>
              <div style={nodeStyle(0)}>
                <span onClick={() => toggleExpand(divKey)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  {divOffices.length > 0 ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span style={{ width: 16 }} />}
                </span>
                <Building2 size={16} color="#3B82F6" />
                <span style={{ flex: 1, fontWeight: '600', color: textColor }}>{div.name}</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'office', mode: 'create', parentId: div.id, parentName: div.name }); }} style={{ ...actionBtnStyle, color: '#10b981' }} title="하위 처 추가"><Plus size={15} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'division', mode: 'edit', data: div }); }} style={{ ...actionBtnStyle, color: '#3B82F6' }} title="수정"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'division', id: div.id, name: div.name }); }} style={{ ...actionBtnStyle, color: '#ef4444' }} title="삭제"><Trash2 size={14} /></button>
                </div>
              </div>

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
                        <button onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'department', mode: 'create', parentId: off.id, parentName: off.name }); }} style={{ ...actionBtnStyle, color: '#10b981' }} title="하위 부서 추가"><Plus size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'office', mode: 'edit', data: off, parentId: div.id }); }} style={{ ...actionBtnStyle, color: '#3B82F6' }} title="수정"><Edit2 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'office', id: off.id, name: off.name }); }} style={{ ...actionBtnStyle, color: '#ef4444' }} title="삭제"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {isOffExpanded && offDepts.map(dept => (
                      <div key={dept.id} style={nodeStyle(2)}>
                        <span style={{ width: 16 }} />
                        <FolderOpen size={16} color="#f59e0b" />
                        <span style={{ flex: 1, color: textColor }}>{dept.name}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          <button onClick={(e) => { e.stopPropagation(); setEditModal({ type: 'department', mode: 'edit', data: dept, parentId: off.id }); }} style={{ ...actionBtnStyle, color: '#3B82F6' }} title="수정"><Edit2 size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'department', id: dept.id, name: dept.name }); }} style={{ ...actionBtnStyle, color: '#ef4444' }} title="삭제"><Trash2 size={14} /></button>
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

      {deleteConfirm && (
        <ConfirmDialog
          title={`${deleteConfirm.type === 'division' ? '본부' : deleteConfirm.type === 'office' ? '처' : '부서'} 삭제`}
          message={`${deleteConfirm.name}을(를) 삭제하시겠습니까?${deleteConfirm.type !== 'department' ? '\n하위 조직도 함께 삭제됩니다.' : ''}`}
          actions={[{ label: '삭제', onClick: handleDelete, variant: 'danger' }]}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {editModal && (
        <OrgNodeEditModal {...editModal} divisions={divisions} onClose={() => setEditModal(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
