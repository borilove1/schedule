// backend/src/utils/reminderService.js
// 일정 리마인더 알림 생성 서비스

const { query } = require('../../config/database');
const { createNotification } = require('../controllers/notificationController');

/**
 * 마감 임박 일정을 확인하고 알림 생성
 * @param {number} hoursAhead - 몇 시간 전에 알림을 보낼지 (기본: 24시간)
 */
async function checkUpcomingEvents(hoursAhead = 24) {
  try {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // 마감 임박 일정 조회 (아직 완료되지 않은 일정)
    const upcomingQuery = `
      SELECT e.*, u.id as user_id
      FROM events e
      JOIN users u ON e.creator_id = u.id
      WHERE e.status != 'DONE'
      AND e.start_at > $1
      AND e.start_at <= $2
      ORDER BY e.start_at
    `;

    const result = await query(upcomingQuery, [now.toISOString(), futureTime.toISOString()]);
    const upcomingEvents = result.rows;

    console.log(`Found ${upcomingEvents.length} upcoming events in the next ${hoursAhead} hours`);

    // 각 일정에 대해 이미 알림이 생성되었는지 확인
    for (const event of upcomingEvents) {
      // 이미 이 일정에 대한 리마인더 알림이 있는지 확인
      const existingNotifQuery = `
        SELECT id FROM notifications
        WHERE user_id = $1
        AND type = 'EVENT_REMINDER'
        AND related_event_id = $2
        AND created_at > NOW() - INTERVAL '48 hours'
      `;

      const existingResult = await query(existingNotifQuery, [event.user_id, event.id]);

      if (existingResult.rows.length === 0) {
        // 알림이 없으면 생성
        const startDate = new Date(event.start_at);
        const hoursUntil = Math.round((startDate - now) / (1000 * 60 * 60));
        const minutesUntil = Math.round((startDate - now) / (1000 * 60));

        let timeMessage;
        if (hoursUntil >= 1) {
          timeMessage = `${hoursUntil}시간 후`;
        } else {
          timeMessage = `${minutesUntil}분 후`;
        }

        await createNotification(
          event.user_id,
          'EVENT_REMINDER',
          '일정 알림',
          `"${event.title}" 일정이 ${timeMessage}에 시작됩니다.`,
          event.id
        );

        console.log(`Created reminder for event: ${event.title} (ID: ${event.id})`);
      }
    }

    return { success: true, count: upcomingEvents.length };
  } catch (error) {
    console.error('Check upcoming events error:', error);
    throw error;
  }
}

/**
 * 반복 일정의 마감 임박 알림 체크
 * (반복 일정 시리즈를 확장하여 확인)
 */
async function checkUpcomingRecurringEvents(hoursAhead = 24) {
  try {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    // 활성화된 반복 일정 시리즈 조회
    const seriesQuery = `
      SELECT es.*, u.id as user_id
      FROM event_series es
      JOIN users u ON es.creator_id = u.id
      WHERE (es.recurrence_end_date IS NULL OR es.recurrence_end_date >= $1)
    `;

    const seriesResult = await query(seriesQuery, [now.toISOString().split('T')[0]]);
    const seriesList = seriesResult.rows;

    let notificationCount = 0;

    for (const series of seriesList) {
      // 간단한 확인: 오늘과 내일의 일정만 체크
      for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
        const checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + dayOffset);
        const checkDateStr = checkDate.toISOString().split('T')[0];

        // 이 날짜가 예외인지 확인
        const exceptionQuery = `
          SELECT id FROM event_exceptions
          WHERE series_id = $1 AND exception_date = $2
        `;
        const exceptionResult = await query(exceptionQuery, [series.id, checkDateStr]);

        if (exceptionResult.rows.length > 0) {
          continue; // 예외 날짜는 건너뜀
        }

        // 이 날짜에 완료된 예외 이벤트가 있는지 확인
        const completedExceptionQuery = `
          SELECT id FROM events
          WHERE series_id = $1
          AND is_exception = true
          AND DATE(start_at) = $2
          AND status = 'DONE'
        `;
        const completedResult = await query(completedExceptionQuery, [series.id, checkDateStr]);

        if (completedResult.rows.length > 0) {
          continue; // 이미 완료된 일정은 건너뜀
        }

        // start_time을 사용하여 정확한 시작 시간 계산
        const [startHour, startMin] = series.start_time.split(':');
        const startAt = new Date(checkDate);
        startAt.setHours(parseInt(startHour), parseInt(startMin), 0);

        // 시작 시간이 now와 futureTime 사이인지 확인
        if (startAt > now && startAt <= futureTime) {
          // 복합 ID 생성
          const compositeId = `series-${series.id}-${startAt.getTime()}`;

          // 이미 알림이 있는지 확인
          const existingNotifQuery = `
            SELECT id FROM notifications
            WHERE user_id = $1
            AND type = 'EVENT_REMINDER'
            AND metadata->>'seriesId' = $2
            AND metadata->>'occurrenceDate' = $3
            AND created_at > NOW() - INTERVAL '48 hours'
          `;
          const existingResult = await query(existingNotifQuery, [
            series.user_id,
            series.id.toString(),
            checkDateStr
          ]);

          if (existingResult.rows.length === 0) {
            const hoursUntil = Math.round((startAt - now) / (1000 * 60 * 60));
            const minutesUntil = Math.round((startAt - now) / (1000 * 60));

            let timeMessage;
            if (hoursUntil >= 1) {
              timeMessage = `${hoursUntil}시간 후`;
            } else {
              timeMessage = `${minutesUntil}분 후`;
            }

            await createNotification(
              series.user_id,
              'EVENT_REMINDER',
              '일정 알림',
              `"${series.title}" 일정이 ${timeMessage}에 시작됩니다.`,
              null,
              {
                seriesId: series.id,
                occurrenceDate: checkDateStr,
                compositeId: compositeId
              }
            );

            notificationCount++;
            console.log(`Created reminder for recurring event: ${series.title} on ${checkDateStr}`);
          }
        }
      }
    }

    return { success: true, count: notificationCount };
  } catch (error) {
    console.error('Check upcoming recurring events error:', error);
    throw error;
  }
}

/**
 * 모든 마감 임박 일정 체크 (일반 + 반복)
 */
async function checkAllUpcomingEvents(hoursAhead = 24) {
  try {
    const result1 = await checkUpcomingEvents(hoursAhead);
    const result2 = await checkUpcomingRecurringEvents(hoursAhead);

    return {
      success: true,
      regularEventsCount: result1.count,
      recurringEventsCount: result2.count,
      totalCount: result1.count + result2.count
    };
  } catch (error) {
    console.error('Check all upcoming events error:', error);
    throw error;
  }
}

module.exports = {
  checkUpcomingEvents,
  checkUpcomingRecurringEvents,
  checkAllUpcomingEvents
};
