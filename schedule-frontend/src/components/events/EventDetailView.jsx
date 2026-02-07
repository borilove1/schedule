import React from 'react';
import { Edit2, Trash2, Check, Calendar, Clock, User, Repeat, Eye, Users } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { getStatusColor, getStatusText, getRecurrenceDescription } from '../../utils/eventHelpers';
import ErrorAlert from '../common/ErrorAlert';

const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Pretendard", "Inter", sans-serif';

export default function EventDetailView({
  event, currentUser, onEdit, onDelete, onComplete, loading, actionInProgress, error
}) {
  const { isDarkMode, textColor, secondaryTextColor, inputBg } = useThemeColors();

  const isOwner = event.isOwner ?? (event.creator?.id === currentUser?.id);
  const canEdit = event.canEdit ?? isOwner;
  const recurrenceDesc = getRecurrenceDescription(event);

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          display: 'inline-block', padding: '6px 12px', borderRadius: '6px',
          backgroundColor: getStatusColor(event.status), color: '#fff', fontSize: '13px', fontWeight: '600'
        }}>
          {getStatusText(event.status)}
        </div>
        {!canEdit && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '6px 12px', borderRadius: '6px',
            backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
            color: secondaryTextColor, fontSize: '13px', fontWeight: '500'
          }}>
            <Eye size={14} />
            조회 전용
          </div>
        )}
      </div>

      <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: textColor }}>
        제목: {event.title || '(없음)'}
      </h3>

      {event.content && (
        <div style={{
          padding: '16px', borderRadius: '8px', backgroundColor: inputBg,
          marginBottom: '16px', color: textColor, whiteSpace: 'pre-wrap'
        }}>
          {event.content}
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: secondaryTextColor, fontSize: '14px', marginBottom: '8px' }}>
          <Calendar size={16} />
          <span>{event.startAt ? new Date(event.startAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: secondaryTextColor, fontSize: '14px', marginBottom: '8px' }}>
          <Clock size={16} />
          <span>
            {event.startAt && event.endAt
              ? `${new Date(event.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ ${new Date(event.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
              : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: secondaryTextColor, fontSize: '14px' }}>
          <User size={16} />
          <span>{event.creator?.name || '알 수 없음'} {event.department && `(${event.department})`}</span>
        </div>
        {recurrenceDesc && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3B82F6', fontSize: '14px', marginTop: '8px' }}>
            <Repeat size={16} /><span>{recurrenceDesc}</span>
          </div>
        )}
        {event.sharedOffices && event.sharedOffices.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8B5CF6', fontSize: '14px', marginTop: '8px' }}>
            <Users size={16} />
            <span>공유: {event.sharedOffices.map(o => o.name || o.officeName || o.office_name).join(', ')}</span>
          </div>
        )}
      </div>

      <ErrorAlert message={error} />

      {actionInProgress && (
        <div style={{
          padding: '12px', borderRadius: '8px', backgroundColor: '#1e40af',
          color: '#93c5fd', fontSize: '14px', marginBottom: '16px', textAlign: 'center'
        }}>
          처리 중...
        </div>
      )}

      {canEdit ? (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onComplete}
            disabled={loading || actionInProgress}
            style={{
              flex: 1, padding: '12px 24px', borderRadius: '8px', border: 'none',
              backgroundColor: (loading || actionInProgress) ? '#64748b' : (event.status === 'DONE' ? '#64748b' : '#10B981'),
              color: '#fff', cursor: (loading || actionInProgress) ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px', opacity: (loading || actionInProgress) ? 0.5 : 1, fontFamily: FONT_FAMILY
            }}
          >
            <Check size={18} />{event.status === 'DONE' ? '완료 취소' : '완료 처리'}
          </button>
          <button
            onClick={onEdit}
            disabled={loading || actionInProgress}
            style={{
              flex: 1, padding: '12px 24px', borderRadius: '8px',
              border: `1px solid ${isDarkMode ? '#475569' : '#cbd5e1'}`,
              backgroundColor: 'transparent', color: textColor,
              cursor: (loading || actionInProgress) ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px', opacity: (loading || actionInProgress) ? 0.5 : 1, fontFamily: FONT_FAMILY
            }}
          >
            <Edit2 size={18} />수정
          </button>
          <button
            onClick={onDelete}
            disabled={loading || actionInProgress}
            style={{
              padding: '12px 24px', borderRadius: '8px', border: 'none',
              backgroundColor: (loading || actionInProgress) ? '#991b1b' : '#ef4444',
              color: '#fff', cursor: (loading || actionInProgress) ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px', opacity: (loading || actionInProgress) ? 0.5 : 1, fontFamily: FONT_FAMILY
            }}
          >
            <Trash2 size={18} />삭제
          </button>
        </div>
      ) : (
        <div style={{
          padding: '12px', borderRadius: '8px',
          backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
          color: secondaryTextColor, fontSize: '14px', textAlign: 'center'
        }}>
          다른 사용자의 일정은 조회만 가능합니다.
        </div>
      )}
    </>
  );
}
