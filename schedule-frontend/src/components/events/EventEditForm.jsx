import React from 'react';
import { Share2 } from 'lucide-react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useCommonStyles } from '../../hooks/useCommonStyles';
import ErrorAlert from '../common/ErrorAlert';

export default function EventEditForm({
  formData, onChange, onSubmit, onCancel, editType, event, loading, actionInProgress, error,
  offices = [], selectedOfficeIds = [], onOfficeToggle
}) {
  const { inputBg, borderColor, textColor, bgColor, secondaryTextColor } = useThemeColors();
  const { inputStyle, labelStyle, fontFamily } = useCommonStyles();

  return (
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>제목 *</label>
        <input type="text" name="title" value={formData.title} onChange={onChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>내용</label>
        <textarea name="content" value={formData.content} onChange={onChange} rows={4} style={{ ...inputStyle, resize: 'vertical', boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>시작 날짜 *</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={onChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={labelStyle}>시작 시간 *</label>
          <input type="time" name="startTime" value={formData.startTime} onChange={onChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={labelStyle}>종료 날짜 *</label>
          <input type="date" name="endDate" value={formData.endDate} onChange={onChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={labelStyle}>종료 시간 *</label>
          <input type="time" name="endTime" value={formData.endTime} onChange={onChange} required style={{ ...inputStyle, boxSizing: 'border-box' }} />
        </div>
      </div>

      {editType === 'all' && (event?.isRecurring || event?.seriesId) && (
        <div style={{
          padding: '20px', borderRadius: '12px', backgroundColor: inputBg,
          marginBottom: '24px', border: `1px solid ${borderColor}`
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>반복 주기</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number" name="recurrenceInterval" value={formData.recurrenceInterval}
                onChange={onChange} min="1" max="99"
                style={{ ...inputStyle, width: '80px', textAlign: 'center', boxSizing: 'border-box' }}
              />
              <select
                name="recurrenceType" value={formData.recurrenceType} onChange={onChange}
                style={{ ...inputStyle, width: 'auto', flex: 1, boxSizing: 'border-box', cursor: 'pointer' }}
              >
                <option value="day">일마다</option>
                <option value="week">주마다</option>
                <option value="month">개월마다</option>
                <option value="year">년마다</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>반복 종료일</label>
            <input
              type="date" name="recurrenceEndDate" value={formData.recurrenceEndDate}
              onChange={onChange} style={{ ...inputStyle, boxSizing: 'border-box' }}
            />
          </div>
        </div>
      )}

      {offices.length > 0 && onOfficeToggle && (
        <div style={{ marginBottom: '20px' }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Share2 size={14} /> 일정 공유 (선택사항)
          </label>
          <div style={{
            padding: '12px', borderRadius: '8px', border: `1px solid ${borderColor}`,
            backgroundColor: bgColor, maxHeight: '150px', overflowY: 'auto'
          }}>
            {offices.map(office => (
              <label key={office.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px',
                cursor: 'pointer', fontFamily, fontSize: '14px', color: textColor
              }}>
                <input
                  type="checkbox"
                  checked={selectedOfficeIds.includes(office.id)}
                  onChange={() => onOfficeToggle(office.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3B82F6' }}
                />
                {office.name}
              </label>
            ))}
          </div>
          <p style={{ marginTop: '6px', fontSize: '12px', color: secondaryTextColor, fontFamily }}>
            {selectedOfficeIds.length > 0
              ? `${selectedOfficeIds.length}개 처/실 소속 전원이 이 일정을 볼 수 있습니다.`
              : '같은 부서원은 항상 볼 수 있습니다. 다른 처/실과 공유하려면 선택하세요.'}
          </p>
        </div>
      )}

      <ErrorAlert message={error} />

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button" onClick={onCancel}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: `1px solid ${borderColor}`,
            backgroundColor: 'transparent', color: textColor, cursor: 'pointer',
            fontSize: '14px', fontWeight: '500', fontFamily
          }}
        >
          취소
        </button>
        <button
          type="submit" disabled={loading || actionInProgress}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: 'none',
            backgroundColor: (loading || actionInProgress) ? '#1e40af' : '#3B82F6',
            color: '#fff', cursor: (loading || actionInProgress) ? 'not-allowed' : 'pointer',
            fontSize: '14px', fontWeight: '500', fontFamily
          }}
        >
          {(loading || actionInProgress) ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
