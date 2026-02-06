// backend/src/controllers/eventController.js
// 기존 DB 구조에 맞춘 반복 일정 컨트롤러

const { query, transaction } = require('../../config/database');
const { generateOccurrencesFromSeries } = require('../utils/recurringEvents');
const { createNotification } = require('./notificationController');

/**
 * PG의 TIMESTAMP WITH TIME ZONE → 타임존 없는 나이브 문자열 변환
 * Docker(UTC) 환경에서 PG가 나이브 문자열을 UTC로 저장하므로,
 * 읽을 때 getUTC*로 원래 입력값을 복원하여 프론트엔드에 전달
 */
function toNaiveDateTimeString(date) {
  if (!date) return null;
  if (typeof date === 'string') return date;
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const sec = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}:${sec}`;
}

/**
 * DB에서 RETURNING *로 받은 raw event row의 타임스탬프 필드를 나이브 문자열로 변환
 */
function formatEventRow(row) {
  if (!row) return row;
  return {
    ...row,
    start_at: toNaiveDateTimeString(row.start_at),
    end_at: toNaiveDateTimeString(row.end_at),
    completed_at: toNaiveDateTimeString(row.completed_at),
    created_at: toNaiveDateTimeString(row.created_at),
    updated_at: toNaiveDateTimeString(row.updated_at)
  };
}

/**
 * 일정 목록 조회 (반복 일정 자동 확장)
 */
exports.getEvents = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // 1. 일반 일정 조회 (series_id가 null인 것)
    const regularEventsQuery = `
      SELECT e.*, 
             u.name as creator_name, 
             d.name as department_name, 
             o.name as office_name, 
             dv.name as division_name
      FROM events e
      JOIN users u ON e.creator_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN offices o ON e.office_id = o.id
      LEFT JOIN divisions dv ON e.division_id = dv.id
      WHERE e.creator_id = $1
      AND e.series_id IS NULL
      AND e.start_at BETWEEN $2 AND $3
      ORDER BY e.start_at
    `;
    const regularResult = await query(regularEventsQuery, [userId, startDate, endDate]);
    const regularEvents = regularResult.rows;

    // 2. 예외 일정 조회 (is_exception = true)
    const exceptionEventsQuery = `
      SELECT e.*, 
             u.name as creator_name, 
             d.name as department_name, 
             o.name as office_name, 
             dv.name as division_name
      FROM events e
      JOIN users u ON e.creator_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN offices o ON e.office_id = o.id
      LEFT JOIN divisions dv ON e.division_id = dv.id
      WHERE e.creator_id = $1
      AND e.is_exception = true
      AND e.start_at BETWEEN $2 AND $3
      ORDER BY e.start_at
    `;
    const exceptionResult = await query(exceptionEventsQuery, [userId, startDate, endDate]);
    const exceptionEvents = exceptionResult.rows;

    // 3. 반복 일정 시리즈 조회
    const seriesQuery = `
      SELECT * FROM event_series
      WHERE creator_id = $1
      AND (
        recurrence_end_date IS NULL 
        OR recurrence_end_date >= $2
      )
      AND first_occurrence_date <= $3
    `;
    const seriesResult = await query(seriesQuery, [userId, startDate, endDate]);
    const seriesList = seriesResult.rows;

    // 4. 예외 날짜 조회
    const seriesIds = seriesList.map(s => s.id);
    let exceptions = [];
    if (seriesIds.length > 0) {
      const exceptionsQuery = `
        SELECT series_id, exception_date
        FROM event_exceptions
        WHERE series_id = ANY($1)
      `;
      const exceptionsResult = await query(exceptionsQuery, [seriesIds]);
      exceptions = exceptionsResult.rows;
    }

    // 5. 반복 일정 확장
    const recurringEvents = [];
    for (const series of seriesList) {
      const seriesExceptions = exceptions.filter(exc => exc.series_id === series.id);
      const occurrences = generateOccurrencesFromSeries(
        series,
        new Date(startDate),
        new Date(endDate),
        seriesExceptions
      );
      recurringEvents.push(...occurrences);
    }

    // 6. 모든 일정 합치기
    const allEvents = [...regularEvents, ...exceptionEvents, ...recurringEvents];

    // 7. 날짜순 정렬
    allEvents.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));

    // 8. 필드명 camelCase로 변환 (프론트엔드 호환)
    const formattedEvents = allEvents.map(event => ({
      id: event.id,
      title: event.title,
      content: event.content,
      startAt: toNaiveDateTimeString(event.start_at),
      endAt: toNaiveDateTimeString(event.end_at),
      status: event.status,
      completedAt: toNaiveDateTimeString(event.completed_at),
      alert: event.alert,
      priority: event.priority,
      seriesId: event.series_id,
      occurrenceDate: event.occurrence_date,
      isException: event.is_exception,
      originalSeriesId: event.original_series_id,
      isGenerated: event.is_generated,
      // series_id가 있거나 is_recurring이 true면 반복 일정으로 표시
      isRecurring: event.is_recurring || !!event.series_id,
      creator: {
        id: event.creator_id,
        name: event.creator_name
      },
      department: event.department_name,
      office: event.office_name,
      division: event.division_name,
      createdAt: toNaiveDateTimeString(event.created_at),
      updatedAt: toNaiveDateTimeString(event.updated_at)
    }));

    res.json({
      success: true,
      data: { events: formattedEvents }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, message: 'Failed to get events' });
  }
};

/**
 * 일정 생성 (일반 또는 반복) - camelCase와 snake_case 둘 다 지원
 */
exports.createEvent = async (req, res) => {
  try {
    const { 
      title, content, 
      start_at, end_at, startAt, endAt,  // 둘 다 받기
      status, alert,
      is_recurring, isRecurring,  // 둘 다 받기
      recurrence_type, recurrenceType,  // 둘 다 받기
      recurrence_interval, recurrenceInterval,  // 둘 다 받기
      recurrence_end_date, recurrenceEndDate  // 둘 다 받기
    } = req.body;
    
    // camelCase 우선, snake_case 대체
    const actualStartAt = startAt || start_at;
    const actualEndAt = endAt || end_at;
    const actualIsRecurring = isRecurring || is_recurring;
    const actualRecurrenceType = recurrenceType || recurrence_type;
    const actualRecurrenceInterval = recurrenceInterval || recurrence_interval;
    const actualRecurrenceEndDate = recurrenceEndDate || recurrence_end_date;
    
    // 시간 유효성 검증
    if (actualStartAt && actualEndAt && new Date(actualEndAt) <= new Date(actualStartAt)) {
      return res.status(400).json({ success: false, message: '종료 시간은 시작 시간보다 이후여야 합니다.' });
    }

    const userId = req.user.id;

    // 사용자 부서 정보 조회
    const userQuery = 'SELECT department_id, office_id, division_id FROM users WHERE id = $1';
    const userResult = await query(userQuery, [userId]);
    const user = userResult.rows[0];

    if (actualIsRecurring) {
      // 반복 일정 생성
      const result = await transaction(async (client) => {
        const startDate = new Date(actualStartAt);
        const endDate = new Date(actualEndAt);

        const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}:00`;
        const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`;
        const firstOccurrenceDate = startDate.toISOString().split('T')[0];

        // 시작일과 종료일의 날짜 차이 계산 (다일 일정 지원)
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const durationDays = Math.round((endDateOnly - startDateOnly) / (24 * 60 * 60 * 1000));

        const seriesQuery = `
          INSERT INTO event_series (
            title, content, recurrence_type, recurrence_interval, recurrence_end_date,
            start_time, end_time, first_occurrence_date, alert, duration_days,
            creator_id, department_id, office_id, division_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `;

        const seriesValues = [
          title, content, actualRecurrenceType, actualRecurrenceInterval, actualRecurrenceEndDate,
          startTime, endTime, firstOccurrenceDate, alert || 'none', durationDays,
          userId, user.department_id, user.office_id, user.division_id
        ];

        const seriesResult = await client.query(seriesQuery, seriesValues);
        return seriesResult;
      });

      res.status(201).json({
        success: true,
        data: { series: result.rows[0] }
      });
    } else {
      // 일반 일정 생성
      const eventQuery = `
        INSERT INTO events (
          title, content, start_at, end_at, status, alert,
          creator_id, department_id, office_id, division_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const eventValues = [
        title, content, actualStartAt, actualEndAt, status || 'PENDING', alert || 'none',
        userId, user.department_id, user.office_id, user.division_id
      ];

      const eventResult = await query(eventQuery, eventValues);

      res.status(201).json({
        success: true,
        data: { event: formatEventRow(eventResult.rows[0]) }
      });
    }
  } catch (error) {
    console.error('Create event error:', error);
    if (error.constraint === 'check_time_range') {
      return res.status(400).json({ success: false, message: '종료 시간은 시작 시간보다 이후여야 합니다.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

/**
 * 일정 수정 (반복 일정 처리)
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, content,
      start_at, end_at, startAt, endAt,
      status, edit_type, editType, occurrence_date, occurrenceDate,
      recurrence_type, recurrenceType: recurrenceTypeField,
      recurrence_interval, recurrenceInterval: recurrenceIntervalField,
      recurrence_end_date, recurrenceEndDate: recurrenceEndDateField
    } = req.body;

    const actualStartAt = startAt || start_at;
    const actualEndAt = endAt || end_at;
    const actualEditType = editType || edit_type;
    const actualOccurrenceDate = occurrenceDate || occurrence_date;
    const actualRecurrenceType = recurrenceTypeField || recurrence_type;
    const actualRecurrenceInterval = recurrenceIntervalField || recurrence_interval;
    const actualRecurrenceEndDate = recurrenceEndDateField !== undefined ? recurrenceEndDateField : recurrence_end_date;

    // 시간 유효성 검증
    if (actualStartAt && actualEndAt && new Date(actualEndAt) <= new Date(actualStartAt)) {
      return res.status(400).json({ success: false, message: '종료 시간은 시작 시간보다 이후여야 합니다.' });
    }

    const userId = req.user.id;

    // 반복 일정인 경우 (ID가 series-로 시작)
    if (id.startsWith('series-')) {
      const parts = id.split('-');
      const seriesId = parts[1];

      // editType이 없으면 기본값 'this' 사용
      const seriesEditType = actualEditType || 'this';

      // event_series 조회
      const seriesQuery = 'SELECT * FROM event_series WHERE id = $1 AND creator_id = $2';
      const seriesResult = await query(seriesQuery, [seriesId, userId]);

      if (seriesResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Event series not found' });
      }

      const series = seriesResult.rows[0];

      if (seriesEditType === 'this') {
        // 이 날짜만 수정 - 시리즈에서 분리하여 독립 이벤트 생성
        const occurrenceTimestamp = parts[2];
        const occurrenceDate = new Date(parseInt(occurrenceTimestamp));
        const occurrenceDateStr = occurrenceDate.toISOString().split('T')[0];

        const result = await transaction(async (client) => {
          const insertQuery = `
            INSERT INTO events (
              title, content, start_at, end_at, status, alert,
              is_exception, original_series_id,
              creator_id, department_id, office_id, division_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, false, $7,
              $8, $9, $10, $11)
            RETURNING *
          `;

          const values = [
            title, content, actualStartAt, actualEndAt, status || 'PENDING', series.alert,
            seriesId, userId,
            series.department_id, series.office_id, series.division_id
          ];

          const insertResult = await client.query(insertQuery, values);

          // 원래 반복 일정에서 이 날짜 제외
          const exceptionQuery = `
            INSERT INTO event_exceptions (series_id, exception_date)
            VALUES ($1, $2)
            ON CONFLICT (series_id, exception_date) DO NOTHING
          `;
          await client.query(exceptionQuery, [seriesId, occurrenceDateStr]);

          return insertResult;
        });

        const updatedEvent = result.rows[0];

        // 알림 생성
        try {
          await createNotification(
            userId,
            'EVENT_UPDATED',
            '일정 수정',
            `"${updatedEvent.title}" 일정이 수정되었습니다.`,
            updatedEvent.id
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        return res.json({ success: true, data: { event: formatEventRow(updatedEvent) } });
      } else if (seriesEditType === 'all') {
        // 전체 반복 일정 수정 (동적 SET 절)
        const setClauses = ['updated_at = CURRENT_TIMESTAMP'];
        const values = [];
        let paramIndex = 1;

        if (title !== undefined) {
          setClauses.push(`title = $${paramIndex++}`);
          values.push(title);
        }
        if (content !== undefined) {
          setClauses.push(`content = $${paramIndex++}`);
          values.push(content);
        }
        if (actualRecurrenceType) {
          setClauses.push(`recurrence_type = $${paramIndex++}`);
          values.push(actualRecurrenceType);
        }
        if (actualRecurrenceInterval) {
          setClauses.push(`recurrence_interval = $${paramIndex++}`);
          values.push(parseInt(actualRecurrenceInterval, 10));
        }
        if (actualRecurrenceEndDate !== undefined) {
          setClauses.push(`recurrence_end_date = $${paramIndex++}`);
          values.push(actualRecurrenceEndDate || null);
        }
        if (actualStartAt) {
          const startTime = new Date(actualStartAt);
          const startTimeStr = `${startTime.getHours().toString().padStart(2,'0')}:${startTime.getMinutes().toString().padStart(2,'0')}:00`;
          setClauses.push(`start_time = $${paramIndex++}`);
          values.push(startTimeStr);
        }
        if (actualEndAt) {
          const endTime = new Date(actualEndAt);
          const endTimeStr = `${endTime.getHours().toString().padStart(2,'0')}:${endTime.getMinutes().toString().padStart(2,'0')}:00`;
          setClauses.push(`end_time = $${paramIndex++}`);
          values.push(endTimeStr);
        }
        // duration_days 계산 (시작일과 종료일의 날짜 차이)
        if (actualStartAt && actualEndAt) {
          const s = new Date(actualStartAt);
          const e = new Date(actualEndAt);
          const sDate = new Date(s.getFullYear(), s.getMonth(), s.getDate());
          const eDate = new Date(e.getFullYear(), e.getMonth(), e.getDate());
          const durationDays = Math.round((eDate - sDate) / (24 * 60 * 60 * 1000));
          setClauses.push(`duration_days = $${paramIndex++}`);
          values.push(durationDays);
        }

        values.push(seriesId);
        values.push(userId);

        const updateQuery = `
          UPDATE event_series
          SET ${setClauses.join(', ')}
          WHERE id = $${paramIndex++} AND creator_id = $${paramIndex++}
          RETURNING *
        `;
        const result = await query(updateQuery, values);

        const updatedSeries = result.rows[0];

        // 알림 생성
        try {
          await createNotification(
            userId,
            'EVENT_UPDATED',
            '반복 일정 수정',
            `"${updatedSeries.title}" 반복 일정이 수정되었습니다.`,
            null
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        return res.json({ success: true, data: { series: updatedSeries } });
      }
    }

    // 일반 일정인 경우 - 원본 이벤트 조회
    const originalQuery = 'SELECT * FROM events WHERE id = $1 AND creator_id = $2';
    const originalResult = await query(originalQuery, [id, userId]);

    if (originalResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const originalEvent = originalResult.rows[0];

    // 반복 일정 수정
    if (originalEvent.series_id && actualEditType === 'this') {
      // 이 날짜만 수정 - 예외 이벤트 생성
      const result = await transaction(async (client) => {
        const insertQuery = `
          INSERT INTO events (
            title, content, start_at, end_at, status, alert,
            is_exception, original_series_id,
            creator_id, department_id, office_id, division_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11)
          RETURNING *
        `;
        
        const values = [
          title, content, actualStartAt, actualEndAt, status, originalEvent.alert,
          originalEvent.series_id, userId,
          originalEvent.department_id, originalEvent.office_id, originalEvent.division_id
        ];

        const insertResult = await client.query(insertQuery, values);

        // 원래 반복 일정에서 이 날짜 제외
        const exceptionQuery = `
          INSERT INTO event_exceptions (series_id, exception_date)
          VALUES ($1, $2)
          ON CONFLICT (series_id, exception_date) DO NOTHING
        `;
        await client.query(exceptionQuery, [originalEvent.series_id, actualOccurrenceDate]);

        return insertResult;
      });

      const updatedEvent = result.rows[0];

      // 알림 생성
      try {
        await createNotification(
          userId,
          'EVENT_UPDATED',
          '일정 수정',
          `"${updatedEvent.title}" 일정이 수정되었습니다.`,
          updatedEvent.id
        );
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      return res.json({ success: true, data: { event: formatEventRow(updatedEvent) } });
    } else if (originalEvent.series_id && actualEditType === 'all') {
      // 전체 반복 일정 수정
      const updateQuery = `
        UPDATE event_series
        SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND creator_id = $4
        RETURNING *
      `;
      const result = await query(updateQuery, [title, content, originalEvent.series_id, userId]);

      const updatedSeries = result.rows[0];

      // 알림 생성
      try {
        await createNotification(
          userId,
          'EVENT_UPDATED',
          '반복 일정 수정',
          `"${updatedSeries.title}" 반복 일정이 수정되었습니다.`,
          null
        );
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      return res.json({ success: true, data: { series: updatedSeries } });
    } else {
      // 일반 일정 수정
      const updateQuery = `
        UPDATE events
        SET title = $1, content = $2, start_at = $3, end_at = $4, status = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND creator_id = $7
        RETURNING *
      `;
      const result = await query(updateQuery, [title, content, actualStartAt, actualEndAt, status || originalEvent.status, id, userId]);

      const updatedEvent = result.rows[0];

      // 알림 생성
      try {
        await createNotification(
          userId,
          'EVENT_UPDATED',
          '일정 수정',
          `"${updatedEvent.title}" 일정이 수정되었습니다.`,
          updatedEvent.id
        );
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      return res.json({ success: true, data: { event: formatEventRow(updatedEvent) } });
    }
  } catch (error) {
    console.error('Update event error:', error);
    if (error.constraint === 'check_time_range') {
      return res.status(400).json({ success: false, message: '종료 시간은 시작 시간보다 이후여야 합니다.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

/**
 * 일정 삭제 (반복 일정 처리)
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { delete_type, deleteType, occurrence_date, occurrenceDate } = req.body;

    const actualDeleteType = deleteType || delete_type || 'single';
    const actualOccurrenceDate = occurrenceDate || occurrence_date;

    const userId = req.user.id;

    // 반복 일정인 경우 (ID가 series-로 시작)
    if (id.startsWith('series-')) {
      const parts = id.split('-');
      const seriesId = parts[1];
      const occurrenceTimestamp = parts[2];

      // event_series 조회
      const seriesQuery = 'SELECT * FROM event_series WHERE id = $1 AND creator_id = $2';
      const seriesResult = await query(seriesQuery, [seriesId, userId]);

      if (seriesResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Event series not found' });
      }

      const occurrenceDate = new Date(parseInt(occurrenceTimestamp));
      const occurrenceDateStr = occurrenceDate.toISOString().split('T')[0];

      const series = seriesResult.rows[0];

      if (actualDeleteType === 'single') {
        // 이 날짜만 삭제 - 예외 추가
        const exceptionQuery = `
          INSERT INTO event_exceptions (series_id, exception_date)
          VALUES ($1, $2)
          ON CONFLICT (series_id, exception_date) DO NOTHING
        `;
        await query(exceptionQuery, [seriesId, occurrenceDateStr]);

        // 알림 생성
        try {
          await createNotification(
            userId,
            'EVENT_DELETED',
            '일정 삭제',
            `"${series.title}" 일정 (${occurrenceDateStr})이 삭제되었습니다.`,
            null
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        return res.json({ success: true, message: 'Event occurrence deleted' });
      } else if (actualDeleteType === 'series') {
        // 전체 반복 일정 삭제
        await transaction(async (client) => {
          const deleteSeriesQuery = 'DELETE FROM event_series WHERE id = $1 AND creator_id = $2';
          await client.query(deleteSeriesQuery, [seriesId, userId]);
        });

        // 알림 생성
        try {
          await createNotification(
            userId,
            'EVENT_DELETED',
            '반복 일정 삭제',
            `"${series.title}" 반복 일정이 모두 삭제되었습니다.`,
            null
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        return res.json({ success: true, message: 'All recurring events deleted' });
      }
    }

    // 일반 일정인 경우
    const originalQuery = 'SELECT * FROM events WHERE id = $1 AND creator_id = $2';
    const originalResult = await query(originalQuery, [id, userId]);

    if (originalResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const originalEvent = originalResult.rows[0];

    // 반복 일정의 예외 이벤트 삭제
    if (originalEvent.series_id && actualDeleteType === 'single') {
      // 이 날짜만 삭제 - 예외 추가
      const exceptionQuery = `
        INSERT INTO event_exceptions (series_id, exception_date)
        VALUES ($1, $2)
        ON CONFLICT (series_id, exception_date) DO NOTHING
      `;
      await query(exceptionQuery, [originalEvent.series_id, actualOccurrenceDate]);

      // 알림 생성
      try {
        await createNotification(
          userId,
          'EVENT_DELETED',
          '일정 삭제',
          `"${originalEvent.title}" 일정이 삭제되었습니다.`,
          null
        );
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      return res.json({ success: true, message: 'Event occurrence deleted' });
    } else if (originalEvent.series_id && actualDeleteType === 'series') {
      // 전체 반복 일정 삭제
      await transaction(async (client) => {
        const deleteSeriesQuery = 'DELETE FROM event_series WHERE id = $1 AND creator_id = $2';
        await client.query(deleteSeriesQuery, [originalEvent.series_id, userId]);
      });

      // 알림 생성
      try {
        await createNotification(
          userId,
          'EVENT_DELETED',
          '반복 일정 삭제',
          `"${originalEvent.title}" 반복 일정이 모두 삭제되었습니다.`,
          null
        );
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      return res.json({ success: true, message: 'All recurring events deleted' });
    } else {
      // 일반 일정 삭제
      const eventTitle = originalEvent.title;

      const deleteQuery = 'DELETE FROM events WHERE id = $1 AND creator_id = $2';
      await query(deleteQuery, [id, userId]);

      // 알림 생성
      try {
        await createNotification(
          userId,
          'EVENT_DELETED',
          '일정 삭제',
          `"${eventTitle}" 일정이 삭제되었습니다.`,
          null
        );
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      return res.json({ success: true, message: 'Event deleted' });
    }
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
};

/**
 * 일정 상세 조회
 */
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 반복 일정인 경우 (ID가 series-로 시작)
    if (id.startsWith('series-')) {
      const parts = id.split('-');
      const seriesId = parts[1];
      const occurrenceTimestamp = parts[2];
      
      // event_series 조회
      const seriesQuery = `
        SELECT es.*, 
               u.name as creator_name, 
               d.name as department_name, 
               o.name as office_name, 
               dv.name as division_name
        FROM event_series es
        JOIN users u ON es.creator_id = u.id
        LEFT JOIN departments d ON es.department_id = d.id
        LEFT JOIN offices o ON es.office_id = o.id
        LEFT JOIN divisions dv ON es.division_id = dv.id
        WHERE es.id = $1 AND es.creator_id = $2
      `;
      
      const result = await query(seriesQuery, [seriesId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Event series not found' });
      }

      const series = result.rows[0];
      
      // occurrence 날짜 계산
      const occurrenceDate = new Date(parseInt(occurrenceTimestamp));
      const occurrenceDateStr = occurrenceDate.toISOString().split('T')[0];
      
      // 이 날짜에 완료된 예외 이벤트가 있는지 확인
      const exceptionEventQuery = `
        SELECT * FROM events
        WHERE series_id = $1 
        AND is_exception = true 
        AND DATE(start_at) = $2
        AND creator_id = $3
      `;
      const exceptionResult = await query(exceptionEventQuery, [seriesId, occurrenceDateStr, userId]);
      
      // 시리즈 자체의 상태를 기본값으로 사용
      let status = series.status || 'PENDING';
      let completedAt = series.completed_at || null;

      // 개별 예외 이벤트가 있으면 그 상태를 우선 적용
      if (exceptionResult.rows.length > 0) {
        const exceptionEvent = exceptionResult.rows[0];
        status = exceptionEvent.status;
        completedAt = exceptionEvent.completed_at;
      }
      
      // start_time과 end_time을 사용하여 timestamp 생성 (타임존 변환 없이 직접 조합)
      const startTimeStr = series.start_time.substring(0, 5); // 'HH:MM'
      const endTimeStr = series.end_time.substring(0, 5);

      // 필드명 camelCase로 변환
      const formattedEvent = {
        id: id,
        title: series.title,
        content: series.content,
        startAt: `${occurrenceDateStr}T${startTimeStr}:00`,
        endAt: `${occurrenceDateStr}T${endTimeStr}:00`,
        status: status,
        completedAt: completedAt,
        alert: series.alert,
        seriesId: series.id,
        occurrenceDate: occurrenceDateStr,
        isRecurring: true,
        isGenerated: true,
        recurrenceType: series.recurrence_type,
        recurrenceInterval: series.recurrence_interval,
        recurrenceEndDate: series.recurrence_end_date,
        firstOccurrenceDate: series.first_occurrence_date,
        creator: {
          id: series.creator_id,
          name: series.creator_name
        },
        department: series.department_name,
        office: series.office_name,
        division: series.division_name,
        createdAt: series.created_at,
        updatedAt: series.updated_at
      };

      return res.json({
        success: true,
        data: { event: formattedEvent }
      });
    }

    // 일반 일정인 경우
    const eventQuery = `
      SELECT e.*, 
             u.name as creator_name, 
             d.name as department_name, 
             o.name as office_name, 
             dv.name as division_name
      FROM events e
      JOIN users u ON e.creator_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN offices o ON e.office_id = o.id
      LEFT JOIN divisions dv ON e.division_id = dv.id
      WHERE e.id = $1 AND e.creator_id = $2
    `;
    
    const result = await query(eventQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const event = result.rows[0];

    // 필드명 camelCase로 변환
    const formattedEvent = {
      id: event.id,
      title: event.title,
      content: event.content,
      startAt: toNaiveDateTimeString(event.start_at),
      endAt: toNaiveDateTimeString(event.end_at),
      status: event.status,
      completedAt: toNaiveDateTimeString(event.completed_at),
      alert: event.alert,
      priority: event.priority,
      seriesId: event.series_id,
      occurrenceDate: event.occurrence_date,
      isException: event.is_exception,
      originalSeriesId: event.original_series_id,
      creator: {
        id: event.creator_id,
        name: event.creator_name
      },
      department: event.department_name,
      office: event.office_name,
      division: event.division_name,
      createdAt: toNaiveDateTimeString(event.created_at),
      updatedAt: toNaiveDateTimeString(event.updated_at)
    };

    res.json({
      success: true,
      data: { event: formattedEvent }
    });
  } catch (error) {
    console.error('Get event by id error:', error);
    res.status(500).json({ success: false, message: 'Failed to get event' });
  }
};

/**
 * 일정 완료 처리
 */
exports.completeEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { completeType } = req.body || {};
    const userId = req.user.id;

    // 반복 일정인 경우 (ID가 series-로 시작)
    if (id.startsWith('series-')) {
      const parts = id.split('-');
      const seriesId = parts[1];
      const occurrenceTimestamp = parts[2];

      // event_series 조회
      const seriesQuery = 'SELECT * FROM event_series WHERE id = $1 AND creator_id = $2';
      const seriesResult = await query(seriesQuery, [seriesId, userId]);

      if (seriesResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Event series not found' });
      }

      const series = seriesResult.rows[0];
      const occurrenceDate = new Date(parseInt(occurrenceTimestamp));
      const occurrenceDateStr = occurrenceDate.toISOString().split('T')[0];

      // 전체 완료: 시리즈 상태를 DONE으로 변경 + 기존 예외 이벤트도 DONE으로
      if (completeType === 'all') {
        await transaction(async (client) => {
          // 시리즈 상태를 DONE으로 변경
          await client.query(
            `UPDATE event_series SET status = 'DONE', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND creator_id = $2`,
            [seriesId, userId]
          );
          // 시리즈에 속한 기존 예외 이벤트도 DONE으로 변경
          await client.query(
            `UPDATE events SET status = 'DONE', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE series_id = $1 AND creator_id = $2 AND status != 'DONE'`,
            [seriesId, userId]
          );
        });

        // 알림 생성
        try {
          await createNotification(
            userId,
            'EVENT_COMPLETED',
            '반복 일정 전체 완료',
            `"${series.title}" 반복 일정을 전체 완료했습니다.`,
            null
          );
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }

        return res.json({
          success: true,
          message: 'All recurring events completed',
        });
      }

      // start_time과 end_time을 사용하여 timestamp 생성 (타임존 변환 없이 직접 조합)
      const startTimeStr = series.start_time.substring(0, 5);
      const endTimeStr = series.end_time.substring(0, 5);
      const startAtStr = `${occurrenceDateStr}T${startTimeStr}:00`;
      const endAtStr = `${occurrenceDateStr}T${endTimeStr}:00`;

      // 예외 이벤트 생성 (완료 상태)
      const result = await transaction(async (client) => {
        const insertQuery = `
          INSERT INTO events (
            title, content, start_at, end_at, status, completed_at, alert,
            is_exception, series_id, occurrence_date,
            creator_id, department_id, office_id, division_id
          )
          VALUES ($1, $2, $3, $4, 'DONE', CURRENT_TIMESTAMP, $5, true, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;

        const values = [
          series.title, series.content,
          startAtStr, endAtStr,
          series.alert, seriesId, occurrenceDateStr, userId,
          series.department_id, series.office_id, series.division_id
        ];

        const insertResult = await client.query(insertQuery, values);

        // event_exceptions에 추가 (이 날짜는 원래 반복 일정에서 제외)
        const exceptionQuery = `
          INSERT INTO event_exceptions (series_id, exception_date)
          VALUES ($1, $2)
          ON CONFLICT (series_id, exception_date) DO NOTHING
        `;
        await client.query(exceptionQuery, [seriesId, occurrenceDateStr]);

        return insertResult;
      });

      // 알림 생성
      try {
        await createNotification(
          userId,
          'EVENT_COMPLETED',
          '일정 완료',
          `"${series.title}" 일정을 완료했습니다.`,
          null,
          { occurrenceDate: occurrenceDateStr }
        );
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }

      return res.json({
        success: true,
        message: 'Event completed',
        data: { event: formatEventRow(result.rows[0]) }
      });
    }

    // 일반 일정인 경우
    const updateQuery = `
      UPDATE events
      SET status = 'DONE', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND creator_id = $2
      RETURNING *
    `;
    const result = await query(updateQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const completedEvent = result.rows[0];

    // 알림 생성
    try {
      await createNotification(
        userId,
        'EVENT_COMPLETED',
        '일정 완료',
        `"${completedEvent.title}" 일정을 완료했습니다.`,
        completedEvent.id
      );
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    res.json({
      success: true,
      message: 'Event completed',
      data: { event: formatEventRow(completedEvent) }
    });
  } catch (error) {
    console.error('Complete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete event' });
  }
};

/**
 * 일정 완료 취소
 */
exports.uncompleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 반복 일정인 경우 (ID가 series-로 시작)
    if (id.startsWith('series-')) {
      const parts = id.split('-');
      const seriesId = parts[1];
      const occurrenceTimestamp = parts[2];
      const occurrenceDate = new Date(parseInt(occurrenceTimestamp));
      const occurrenceDateStr = occurrenceDate.toISOString().split('T')[0];

      // 시리즈 조회하여 전체 완료 상태인지 확인
      const seriesCheck = await query('SELECT status FROM event_series WHERE id = $1 AND creator_id = $2', [seriesId, userId]);

      if (seriesCheck.rows.length > 0 && seriesCheck.rows[0].status === 'DONE') {
        // 전체 완료된 시리즈 → 전체를 PENDING으로 되돌림
        await transaction(async (client) => {
          await client.query(
            `UPDATE event_series SET status = 'PENDING', completed_at = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND creator_id = $2`,
            [seriesId, userId]
          );
          // 시리즈에 속한 기존 예외 이벤트도 PENDING으로 되돌림
          await client.query(
            `UPDATE events SET status = 'PENDING', completed_at = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE series_id = $1 AND creator_id = $2 AND status = 'DONE'`,
            [seriesId, userId]
          );
        });

        return res.json({
          success: true,
          message: 'All recurring events uncompleted'
        });
      }

      // 개별 완료된 예외 이벤트 삭제
      await transaction(async (client) => {
        // events 테이블에서 이 날짜의 완료 예외 삭제
        const deleteEventQuery = `
          DELETE FROM events
          WHERE series_id = $1
          AND is_exception = true
          AND DATE(start_at) = $2
          AND creator_id = $3
        `;
        await client.query(deleteEventQuery, [seriesId, occurrenceDateStr, userId]);

        // event_exceptions에서 제거 (다시 반복 일정에 포함)
        const deleteExceptionQuery = `
          DELETE FROM event_exceptions
          WHERE series_id = $1 AND exception_date = $2
        `;
        await client.query(deleteExceptionQuery, [seriesId, occurrenceDateStr]);
      });

      return res.json({
        success: true,
        message: 'Event uncompleted'
      });
    }

    // 일반 일정인 경우
    const updateQuery = `
      UPDATE events
      SET status = 'PENDING', completed_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND creator_id = $2
      RETURNING *
    `;
    const result = await query(updateQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({
      success: true,
      message: 'Event uncompleted',
      data: { event: formatEventRow(result.rows[0]) }
    });
  } catch (error) {
    console.error('Uncomplete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to uncomplete event' });
  }
};
