import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, Trash2, Check, Calendar, Clock, User, Repeat } from 'lucide-react';
import api from '../../utils/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function EventDetailModal({ isOpen, onClose, eventId, onSuccess }) {
  const { refreshNotifications } = useNotification();
  const { isDarkMode } = useTheme();
  const [event, setEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false); // UI용
  const actionInProgressRef = useRef(false); // 중복 클릭 방지용 ref
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // 삭제 확인 다이얼로그
  const [showCompleteDialog, setShowCompleteDialog] = useState(false); // 완료 유형 선택 다이얼로그
  const [showEditTypeDialog, setShowEditTypeDialog] = useState(false); // 수정 유형 선택 다이얼로그
  const [editType, setEditType] = useState('this'); // 'this' 또는 'all'
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    recurrenceType: 'week',
    recurrenceInterval: 1,
    recurrenceEndDate: ''
  });

  const bgColor = isDarkMode ? '#1e293b' : '#f8fafc';
  const cardBg = isDarkMode ? '#283548' : '#ffffff';
  const textColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const secondaryTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const borderColor = isDarkMode ? '#475569' : '#cbd5e1';

  useEffect(() => {
    if (isOpen && eventId) {
      setIsEditing(false);
      setError('');
      setShowDeleteDialog(false);
      setShowCompleteDialog(false);
      setShowEditTypeDialog(false);
      setEditType('this');
      setActionInProgress(false);
      actionInProgressRef.current = false;
      loadEvent();
    }
  }, [isOpen, eventId]);

  const formatDateTimeForInput = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return { date: '', time: '' };
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`
      };
    } catch (err) {
      return { date: '', time: '' };
    }
  };

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await api.getEvent(eventId);

      // 데이터 검증 및 설정
      if (data && data.id) {
        setEvent(data);
        const start = formatDateTimeForInput(data.startAt);
        const end = formatDateTimeForInput(data.endAt);
        setFormData({
          title: data.title || '',
          content: data.content || '',
          startDate: start.date,
          startTime: start.time,
          endDate: end.date,
          endTime: end.time,
          recurrenceType: data.recurrenceType || 'week',
          recurrenceInterval: data.recurrenceInterval || 1,
          recurrenceEndDate: data.recurrenceEndDate
            ? new Date(data.recurrenceEndDate).toISOString().split('T')[0]
            : ''
        });
      } else {
        setError('일정 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError(`오류: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (actionInProgressRef.current) return; // 중복 방지

    setError('');
    setLoading(true);
    setActionInProgress(true);
    actionInProgressRef.current = true;

    try {
      if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
        setError('모든 날짜와 시간을 입력해주세요.');
        return;
      }
      const startAt = `${formData.startDate}T${formData.startTime}:00`;
      const endAt = `${formData.endDate}T${formData.endTime}:00`;

      if (new Date(endAt) <= new Date(startAt)) {
        setError('종료 시간은 시작 시간보다 이후여야 합니다.');
        return;
      }

      const updateData = {
        title: formData.title,
        content: formData.content,
        startAt,
        endAt,
        priority: 'NORMAL'
      };

      // 반복 일정인 경우 editType 전송
      if (eventId && String(eventId).startsWith('series-')) {
        updateData.editType = editType;
        if (editType === 'all') {
          updateData.recurrenceType = formData.recurrenceType;
          updateData.recurrenceInterval = parseInt(formData.recurrenceInterval, 10);
          updateData.recurrenceEndDate = formData.recurrenceEndDate || null;
        }
      }

      await api.updateEvent(eventId, updateData);
      setIsEditing(false);
      onSuccess();

      // "이번만 수정"은 새 이벤트가 생성되므로 모달 닫기 (원래 시리즈 ID로는 수정 결과 조회 불가)
      if (eventId && String(eventId).startsWith('series-') && editType === 'this') {
        refreshNotifications();
        onClose();
        return;
      }

      await loadEvent();

      // 알림 카운트 즉시 새로고침
      refreshNotifications();
    } catch (err) {
      setError(err.message || '일정 수정에 실패했습니다.');
    } finally {
      setLoading(false);
      setActionInProgress(false);
      actionInProgressRef.current = false;
    }
  };

  const handleDeleteClick = () => {
    if (actionInProgressRef.current) return;
    setShowDeleteDialog(true);
  };

  const handleDelete = async (deleteType) => {
    if (actionInProgressRef.current) return;

    setShowDeleteDialog(false);
    setLoading(true);
    setActionInProgress(true);
    actionInProgressRef.current = true;

    try {
      // 두 경우 모두 eventId를 사용하되 deleteType만 다르게 전달
      await api.deleteEvent(eventId, { deleteType });
      onSuccess();
      onClose();

      // 알림 카운트 즉시 새로고침
      refreshNotifications();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || '일정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
      setActionInProgress(false);
      actionInProgressRef.current = false;
    }
  };

  const handleCompleteClick = () => {
    if (actionInProgressRef.current) return;
    // 반복 일정이고 완료 처리(취소가 아닌)인 경우 다이얼로그 표시
    const isRecurring = event.seriesId || event.isRecurring || (eventId && String(eventId).startsWith('series-'));
    if (isRecurring && event.status !== 'DONE') {
      setShowCompleteDialog(true);
    } else {
      executeComplete('this');
    }
  };

  const executeComplete = async (completeType) => {
    if (actionInProgressRef.current) return;

    setShowCompleteDialog(false);
    setLoading(true);
    setActionInProgress(true);
    actionInProgressRef.current = true;
    setError('');

    try {
      if (event.status === 'DONE') {
        await api.uncompleteEvent(eventId);
      } else {
        await api.completeEvent(eventId, { completeType });
      }

      // 시리즈 이벤트의 "이번만 완료/완료취소"는 새 예외 이벤트가 생성되므로 모달 닫기
      // "전체 완료/완료취소"도 시리즈 전체 상태가 변경되므로 모달 닫기
      if (eventId && String(eventId).startsWith('series-')) {
        onSuccess();
        refreshNotifications();
        onClose();
        return;
      }

      // 일반 일정은 상태 업데이트 후 다시 로드
      await loadEvent();
      onSuccess();

      // 알림 카운트 즉시 새로고침
      refreshNotifications();

    } catch (err) {
      setError(err.message || '상태 변경에 실패했습니다.');
    } finally {
      setLoading(false);
      setActionInProgress(false);
      actionInProgressRef.current = false;
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE': return '#10B981';
      case 'OVERDUE': return '#ef4444';
      default: return '#3B82F6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'DONE': return '완료';
      case 'OVERDUE': return '지연';
      default: return '진행중';
    }
  };

  const getRecurrenceDescription = (ev) => {
    if (!ev?.isRecurring && !ev?.seriesId) return null;
    const type = ev.recurrenceType;
    if (!type) return null;
    const interval = ev.recurrenceInterval || 1;
    const endDate = ev.recurrenceEndDate;
    let desc = '';
    if (interval === 1) {
      desc = type === 'day' ? '매일' : type === 'week' ? '매주' : type === 'month' ? '매월' : type === 'year' ? '매년' : type;
    } else {
      const unit = type === 'day' ? '일' : type === 'week' ? '주' : type === 'month' ? '개월' : '년';
      desc = `${interval}${unit}마다`;
    }
    desc += ' 반복';
    if (endDate) {
      desc += ` (${new Date(endDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지)`;
    }
    return desc;
  };

  const fontFamily = '-apple-system, BlinkMacSystemFont, "Pretendard", "Inter", sans-serif';
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: bgColor, color: textColor, fontSize: '14px', outline: 'none', fontFamily };
  const labelStyle = { display: 'block', fontSize: '14px', fontWeight: '500', color: textColor, marginBottom: '8px', fontFamily };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: cardBg, borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", "Inter", sans-serif' }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0, color: textColor }}>{isEditing ? (editType === 'all' ? '반복 일정 수정' : '일정 수정') : '일정 상세'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: textColor, cursor: 'pointer' }}><X size={24} /></button>
        </div>
        {loading && !event ? (
          <div style={{ padding: '40px', textAlign: 'center', color: secondaryTextColor }}>로딩 중...</div>
        ) : event ? (
          <div style={{ padding: '24px' }}>
            {!isEditing ? (
              <>
                <div style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '6px', backgroundColor: getStatusColor(event.status), color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>{getStatusText(event.status)}</div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: textColor }}>제목: {event.title || '(없음)'}</h3>
                {event.content && <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: bgColor, marginBottom: '16px', color: textColor, whiteSpace: 'pre-wrap' }}>{event.content}</div>}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: secondaryTextColor, fontSize: '14px', marginBottom: '8px' }}>
                    <Calendar size={16} /><span>{event.startAt ? new Date(event.startAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: secondaryTextColor, fontSize: '14px', marginBottom: '8px' }}>
                    <Clock size={16} /><span>{event.startAt && event.endAt ? `${new Date(event.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ ${new Date(event.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: secondaryTextColor, fontSize: '14px' }}>
                    <User size={16} /><span>{event.creator?.name || '알 수 없음'} {event.department && `(${event.department})`}</span>
                  </div>
                  {getRecurrenceDescription(event) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3B82F6', fontSize: '14px', marginTop: '8px' }}>
                      <Repeat size={16} /><span>{getRecurrenceDescription(event)}</span>
                    </div>
                  )}
                </div>
                {error && <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2', color: isDarkMode ? '#fca5a5' : '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}
                {actionInProgress && <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#1e40af', color: '#93c5fd', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>처리 중...</div>}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={handleCompleteClick} disabled={loading || actionInProgress} style={{ flex: 1, padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: (loading || actionInProgress) ? '#64748b' : (event.status === 'DONE' ? '#64748b' : '#10B981'), color: '#fff', cursor: (loading || actionInProgress) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (loading || actionInProgress) ? 0.5 : 1, fontFamily }}><Check size={18} />{event.status === 'DONE' ? '완료 취소' : '완료 처리'}</button>
                  <button onClick={() => { if (event.seriesId || event.isRecurring) { setShowEditTypeDialog(true); } else { setEditType('this'); setIsEditing(true); } }} disabled={loading || actionInProgress} style={{ flex: 1, padding: '12px 24px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: textColor, cursor: (loading || actionInProgress) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (loading || actionInProgress) ? 0.5 : 1, fontFamily }}><Edit2 size={18} />수정</button>
                  <button onClick={handleDeleteClick} disabled={loading || actionInProgress} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: (loading || actionInProgress) ? '#991b1b' : '#ef4444', color: '#fff', cursor: (loading || actionInProgress) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (loading || actionInProgress) ? 0.5 : 1, fontFamily }}><Trash2 size={18} />삭제</button>
                </div>
              </>
            ) : (
              <form onSubmit={handleUpdate}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>제목 *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>내용</label>
                  <textarea name="content" value={formData.content} onChange={handleChange} rows={4} style={{ ...inputStyle, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={labelStyle}>시작 날짜 *</label>
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>시작 시간 *</label>
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={labelStyle}>종료 날짜 *</label>
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>종료 시간 *</label>
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
                  </div>
                </div>
                {editType === 'all' && (event?.isRecurring || event?.seriesId) && (
                  <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: bgColor, marginBottom: '24px', border: `1px solid ${borderColor}` }}>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>반복 주기</label>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input type="number" name="recurrenceInterval" value={formData.recurrenceInterval} onChange={handleChange} min="1" max="99" style={{ ...inputStyle, width: '80px', textAlign: 'center', boxSizing: 'border-box' }} />
                        <select name="recurrenceType" value={formData.recurrenceType} onChange={handleChange} style={{ ...inputStyle, width: 'auto', flex: 1, boxSizing: 'border-box' }}>
                          <option value="day">일마다</option>
                          <option value="week">주마다</option>
                          <option value="month">개월마다</option>
                          <option value="year">년마다</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>반복 종료일</label>
                      <input type="date" name="recurrenceEndDate" value={formData.recurrenceEndDate} onChange={handleChange} style={{ ...inputStyle, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                )}
                {error && <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2', color: isDarkMode ? '#fca5a5' : '#dc2626', fontSize: '14px', marginBottom: '20px' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '12px 24px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: textColor, cursor: 'pointer', fontSize: '14px', fontWeight: '500', fontFamily }}>취소</button>
                  <button type="submit" disabled={loading || actionInProgress} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: (loading || actionInProgress) ? '#1e40af' : '#3B82F6', color: '#fff', cursor: (loading || actionInProgress) ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500', fontFamily }}>{(loading || actionInProgress) ? '저장 중...' : '저장'}</button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: secondaryTextColor }}>일정을 찾을 수 없습니다.</div>
        )}
      </div>

      {/* 수정 유형 선택 다이얼로그 */}
      {showEditTypeDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            fontFamily
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: textColor }}>
              반복 일정 수정
            </h3>
            <p style={{ fontSize: '14px', color: secondaryTextColor, marginBottom: '24px', lineHeight: '1.5' }}>
              이 일정은 반복 일정입니다. 어떻게 수정하시겠습니까?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => { setEditType('this'); setShowEditTypeDialog(false); setIsEditing(true); }}
                style={{ padding: '12px 24px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: textColor, cursor: 'pointer', fontSize: '14px', fontWeight: '500', fontFamily }}
              >
                이번 일정만 수정
              </button>
              <button
                onClick={() => { setEditType('all'); setShowEditTypeDialog(false); setIsEditing(true); }}
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', fontFamily }}
              >
                전체 반복 일정 수정
              </button>
              <button
                onClick={() => setShowEditTypeDialog(false)}
                style={{ padding: '12px 24px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: textColor, cursor: 'pointer', fontSize: '14px', fontWeight: '500', fontFamily }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 완료 유형 선택 다이얼로그 */}
      {showCompleteDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            fontFamily
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: textColor }}>
              반복 일정 완료
            </h3>
            <p style={{ fontSize: '14px', color: secondaryTextColor, marginBottom: '24px', lineHeight: '1.5' }}>
              이 일정은 반복 일정입니다. 어떻게 완료하시겠습니까?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => executeComplete('this')}
                style={{ padding: '12px 24px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: textColor, cursor: 'pointer', fontSize: '14px', fontWeight: '500', fontFamily }}
              >
                이번 일정만 완료
              </button>
              <button
                onClick={() => executeComplete('all')}
                style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', fontFamily }}
              >
                반복 일정 전체 완료
              </button>
              <button
                onClick={() => setShowCompleteDialog(false)}
                style={{ padding: '12px 24px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: textColor, cursor: 'pointer', fontSize: '14px', fontWeight: '500', fontFamily }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: cardBg,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            fontFamily
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: textColor
            }}>
              {event?.seriesId ? '반복 일정 삭제' : '일정 삭제'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: secondaryTextColor,
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              {event?.seriesId
                ? '이 일정은 반복 일정입니다. 어떻게 삭제하시겠습니까?'
                : '정말 이 일정을 삭제하시겠습니까?'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {event?.seriesId ? (
                <>
                  <button
                    onClick={() => handleDelete('single')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      backgroundColor: 'transparent',
                      color: textColor,
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily
                    }}
                  >
                    이 일정만 삭제
                  </button>
                  <button
                    onClick={() => handleDelete('series')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      fontFamily
                    }}
                  >
                    반복일정 전체 삭제
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleDelete('single')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily
                  }}
                >
                  삭제
                </button>
              )}
              <button
                onClick={() => setShowDeleteDialog(false)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  backgroundColor: 'transparent',
                  color: textColor,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
