// backend/src/utils/recurringEvents.js
// 기존 DB 구조에 맞춘 반복 일정 헬퍼 함수

/**
 * event_series로부터 개별 occurrence 생성
 * @param {Object} series - event_series 레코드
 * @param {Date} startDate - 조회 시작일
 * @param {Date} endDate - 조회 종료일
 * @param {Array} exceptions - 제외할 날짜 목록
 * @returns {Array} - 생성된 occurrence 목록
 */
function generateOccurrencesFromSeries(series, startDate, endDate, exceptions = []) {
  const occurrences = [];
  const recurrenceType = series.recurrence_type; // 'day', 'week', 'month', 'year'
  const interval = series.recurrence_interval || 1;
  const recurrenceEndDate = series.recurrence_end_date 
    ? new Date(series.recurrence_end_date) 
    : new Date(endDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 기본 90일

  // 첫 occurrence 날짜
  let currentDate = new Date(series.first_occurrence_date);

  // 시작일 이전까지 건너뛰기
  while (currentDate < startDate) {
    currentDate = getNextOccurrenceDate(currentDate, recurrenceType, interval);
  }

  // 범위 내 모든 occurrence 생성
  while (currentDate <= endDate && currentDate <= recurrenceEndDate) {
    const occurrenceDateStr = currentDate.toISOString().split('T')[0];

    // 예외 날짜 체크
    const isException = exceptions.some(exc => 
      new Date(exc.exception_date).toISOString().split('T')[0] === occurrenceDateStr
    );

    if (!isException) {
      // 타임존 없는 로컬 시간 문자열로 생성하여 프론트엔드에서 정확한 시간 표시
      const startAtStr = `${occurrenceDateStr}T${series.start_time}`;

      // 다일 일정: duration_days만큼 종료 날짜를 offset
      const durationDays = series.duration_days || 0;
      let endDateStr = occurrenceDateStr;
      if (durationDays > 0) {
        const endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + durationDays);
        endDateStr = endDate.toISOString().split('T')[0];
      }
      const endAtStr = `${endDateStr}T${series.end_time}`;

      occurrences.push({
        id: `series-${series.id}-${currentDate.getTime()}`, // 임시 ID
        title: series.title,
        content: series.content,
        start_at: startAtStr,
        end_at: endAtStr,
        status: series.status || 'PENDING',
        completed_at: series.completed_at || null,
        alert: series.alert,
        series_id: series.id,
        occurrence_date: occurrenceDateStr,
        is_exception: false,
        creator_id: series.creator_id,
        creator_name: series.creator_name || null,
        department_id: series.department_id,
        office_id: series.office_id,
        division_id: series.division_id,
        created_at: series.created_at,
        updated_at: series.updated_at,
        is_generated: true, // 프론트엔드 구분용
        is_recurring: true // 반복 일정 표시
      });
    }

    currentDate = getNextOccurrenceDate(currentDate, recurrenceType, interval);
  }

  return occurrences;
}

/**
 * 다음 occurrence 날짜 계산
 * @param {Date} currentDate - 현재 날짜
 * @param {String} recurrenceType - 반복 유형 (day, week, month, year)
 * @param {Number} interval - 반복 간격
 * @returns {Date} - 다음 occurrence 날짜
 */
function getNextOccurrenceDate(currentDate, recurrenceType, interval) {
  const nextDate = new Date(currentDate);

  switch (recurrenceType) {
    case 'day':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'week':
      nextDate.setDate(nextDate.getDate() + (7 * interval));
      break;
    case 'month':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'year':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
    default:
      throw new Error(`Unknown recurrence type: ${recurrenceType}`);
  }

  return nextDate;
}

module.exports = {
  generateOccurrencesFromSeries,
  getNextOccurrenceDate
};
