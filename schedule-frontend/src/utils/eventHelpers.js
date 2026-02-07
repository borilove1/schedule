export const getStatusColor = (status) => {
  switch (status) {
    case 'DONE': return '#10B981';
    case 'OVERDUE': return '#ef4444';
    default: return '#3B82F6';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'DONE': return '완료';
    case 'OVERDUE': return '지연';
    default: return '진행중';
  }
};

export const getRecurrenceDescription = (ev) => {
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

export const norm = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const formatDateTimeForInput = (dateString) => {
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
