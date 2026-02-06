import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import EventModal from '../events/EventModal';
import EventDetailModal from '../events/EventDetailModal';
import api from '../../utils/api';

export default function Calendar() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [loading, setLoading] = useState(false);

  const textColor = isDarkMode ? '#e2e8f0' : '#1e293b';
  const secondaryTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const cardBg = isDarkMode ? '#283548' : '#ffffff';
  const borderColor = isDarkMode ? '#475569' : '#cbd5e1';
  const fontFamily = '-apple-system, BlinkMacSystemFont, "Pretendard", "Inter", sans-serif';

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // Monday-start week range
      const firstDow = firstDay.getDay();
      const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;
      const startDate = new Date(year, month, 1 - mondayOffset);

      const lastDow = lastDay.getDay();
      const sundayOffset = lastDow === 0 ? 0 : 7 - lastDow;
      const endDate = new Date(year, month + 1, sundayOffset);

      const data = await api.getEvents({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      setEvents(data.data?.events || data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---

  const norm = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const firstDow = firstDay.getDay();
    const mondayOffset = firstDow === 0 ? 6 : firstDow - 1;
    const start = new Date(year, month, 1 - mondayOffset);

    const lastDow = lastDay.getDay();
    const sundayOffset = lastDow === 0 ? 0 : 7 - lastDow;
    const end = new Date(year, month + 1, sundayOffset);

    const totalDays = Math.round((end - start) / 86400000) + 1;
    const weekCount = Math.max(5, Math.ceil(totalDays / 7));

    const days = [];
    for (let i = 0; i < weekCount * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getWeeks = (days) => {
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const isMultiDay = (event) => {
    return norm(new Date(event.startAt)).getTime() !== norm(new Date(event.endAt)).getTime();
  };

  const getMultiDayEventsForWeek = (weekDays) => {
    const wStart = norm(weekDays[0]);
    const wEnd = norm(weekDays[6]);

    return events
      .filter(ev => {
        if (!isMultiDay(ev)) return false;
        const s = norm(new Date(ev.startAt));
        const e = norm(new Date(ev.endAt));
        return e >= wStart && s <= wEnd;
      })
      .map(ev => {
        const s = norm(new Date(ev.startAt));
        const e = norm(new Date(ev.endAt));
        let startCol = 1, endCol = 7;

        for (let i = 0; i < 7; i++) {
          const dn = norm(weekDays[i]);
          if (dn.getTime() === s.getTime()) startCol = i + 1;
          if (dn.getTime() === e.getTime()) endCol = i + 1;
        }
        if (s < wStart) startCol = 1;
        if (e > wEnd) endCol = 7;

        const isStartInWeek = s >= wStart;
        const isEndInWeek = e <= wEnd;

        return { event: ev, startCol, endCol, isStartInWeek, isEndInWeek };
      })
      .sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));
  };

  const getSingleDayEventsForDate = (date) => {
    if (!date) return [];
    const dn = norm(date);
    return events.filter(ev => {
      if (isMultiDay(ev)) return false;
      return norm(new Date(ev.startAt)).getTime() === dn.getTime();
    });
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dn = norm(date);
    return events.filter(ev => {
      const s = norm(new Date(ev.startAt));
      const e = norm(new Date(ev.endAt));
      return dn >= s && dn <= e;
    });
  };

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

  // 다일 이벤트를 겹치지 않는 행(lane)에 배치
  const assignLanes = (multiDayBars) => {
    const lanes = [];
    for (const bar of multiDayBars) {
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        const canFit = lanes[i].every(existing =>
          bar.startCol > existing.endCol || bar.endCol < existing.startCol
        );
        if (canFit) {
          lanes[i].push(bar);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lanes.push([bar]);
      }
    }
    return lanes;
  };

  const filterEventsByTab = (list) => {
    switch (selectedTab) {
      case 'ongoing': return list.filter(e => e.status === 'PENDING' || e.status === 'IN_PROGRESS');
      case 'completed': return list.filter(e => e.status === 'DONE');
      case 'overdue': return list.filter(e => e.status === 'OVERDUE');
      default: return list;
    }
  };

  // --- Handlers ---

  const handleEventSuccess = () => loadEvents();

  const handleNewEvent = (date = null) => {
    const t = date || new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
    setShowModal(true);
  };

  const handleEventClick = (eventId) => {
    setSelectedEventId(eventId);
    setShowDetailModal(true);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
  };

  // --- Computed ---

  const days = getCalendarDays();
  const weeks = getWeeks(days);
  const isMobile = window.innerWidth < 768;
  const today = new Date();
  const curMonth = currentDate.getMonth();

  // Event list data
  const listEvents = selectedDay ? getEventsForDate(selectedDay) : events;
  const filteredListEvents = filterEventsByTab(listEvents);

  return (
    <div style={{ color: textColor, fontFamily }}>

      {/* ===== Header ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h1 style={{ fontSize: isMobile ? '40px' : '48px', fontWeight: '700', margin: 0, lineHeight: 1 }}>
            {currentDate.getMonth() + 1}
          </h1>
          <span style={{ fontSize: '16px', color: secondaryTextColor }}>
            {currentDate.getFullYear()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            style={{ background: 'none', border: 'none', color: secondaryTextColor, cursor: 'pointer', padding: '6px', display: 'flex', borderRadius: '6px' }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            style={{ background: 'none', border: 'none', color: secondaryTextColor, cursor: 'pointer', padding: '6px', display: 'flex', borderRadius: '6px' }}
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              border: `1px solid ${borderColor}`,
              backgroundColor: cardBg,
              color: textColor,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '4px'
            }}
          >
            <span style={{ fontSize: '11px', letterSpacing: '0.05em' }}>TODAY</span>
          </button>
          <button
            onClick={() => handleNewEvent(selectedDay)}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#3B82F6',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '4px'
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* ===== Day Headers (Mon start) ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: `1px solid ${borderColor}60`,
        marginBottom: '0'
      }}>
        {['월', '화', '수', '목', '금', '토', '일'].map((name, i) => (
          <div key={name} style={{
            textAlign: 'center',
            padding: '8px 0',
            fontSize: '12px',
            fontWeight: '600',
            color: i === 5 ? (isDarkMode ? '#60A5FA' : '#3B82F6') : i === 6 ? (isDarkMode ? '#F87171' : '#ef4444') : (isDarkMode ? '#94a3b8' : '#94a3b8'),
            letterSpacing: '0.05em'
          }}>
            {name}
          </div>
        ))}
      </div>

      {/* ===== Calendar Grid ===== */}
      <div style={{ marginBottom: '32px' }}>
        {weeks.map((week, weekIdx) => {
          const weekMultiDay = getMultiDayEventsForWeek(week);
          const lanes = assignLanes(weekMultiDay);
          const maxMultiLanes = 3;
          const visibleLanes = lanes.slice(0, maxMultiLanes);
          const hiddenLanes = lanes.slice(maxMultiLanes);
          const laneHeight = 19;
          const multiAreaHeight = visibleLanes.length * laneHeight;

          return (
            <div key={weekIdx} style={{ position: 'relative', minHeight: '130px' }}>
              {/* Background layer: cell highlights for selected/today */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                position: 'absolute',
                top: 0, bottom: 0, left: 0, right: 0,
                gap: '0 4px'
              }}>
                {week.map((day, col) => {
                  const dayIsToday = day.toDateString() === today.toDateString();
                  const dayIsSelected = selectedDay && day.toDateString() === selectedDay.toDateString();

                  let bg = 'transparent';
                  let border = 'none';
                  if (dayIsToday && dayIsSelected) {
                    bg = isDarkMode ? '#3B82F630' : '#3B82F635';
                    border = `1px solid ${isDarkMode ? '#3B82F670' : '#3B82F680'}`;
                  } else if (dayIsToday) {
                    bg = isDarkMode ? '#3B82F620' : '#3B82F625';
                    border = `1px solid ${isDarkMode ? '#3B82F650' : '#3B82F660'}`;
                  } else if (dayIsSelected) {
                    bg = isDarkMode ? '#1e3a5f' : '#ffffff';
                    border = `1px solid ${isDarkMode ? borderColor : '#3B82F6'}`;
                  }

                  return (
                    <div
                      key={col}
                      onClick={() => handleDayClick(day)}
                      onDoubleClick={() => handleNewEvent(day)}
                      style={{
                        backgroundColor: bg,
                        border,
                        borderRadius: '10px',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer'
                      }}
                    />
                  );
                })}
              </div>

              {/* Content layer */}
              <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>
                {/* Day numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {week.map((day, col) => {
                    const dayIsToday = day.toDateString() === today.toDateString();
                    const dayInMonth = day.getMonth() === curMonth;
                    const isSat = col === 5;
                    const isSun = col === 6;

                    let numColor = dayInMonth ? textColor : (isDarkMode ? '#64748b' : '#cbd5e1');
                    if (isSat && dayInMonth) numColor = '#3B82F6';
                    if (isSun && dayInMonth) numColor = '#ef4444';
                    if (!dayInMonth && isSat) numColor = isDarkMode ? '#3B82F680' : '#93bbfd';
                    if (!dayInMonth && isSun) numColor = isDarkMode ? '#ef444480' : '#fca5a5';

                    return (
                      <div
                        key={col}
                        style={{
                          padding: '8px 0 2px 8px',
                          textAlign: 'left'
                        }}
                      >
                        <span style={{
                          fontSize: '14px',
                          fontWeight: dayIsToday ? '700' : '400',
                          color: dayIsToday ? '#3B82F6' : numColor
                        }}>
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Multi-day spanning bars (absolute positioning) */}
                {visibleLanes.length > 0 && (
                  <div style={{ position: 'relative', height: `${multiAreaHeight}px` }}>
                    {visibleLanes.map((lane, laneIdx) =>
                      lane.map(bar => {
                        const isOwn = bar.event.creator?.id === user?.id;
                        const barColor = isOwn ? getStatusColor(bar.event.status) : '#94a3b8';
                        const colWidth = 100 / 7;
                        const left = (bar.startCol - 1) * colWidth;
                        const width = (bar.endCol - bar.startCol + 1) * colWidth;
                        return (
                          <div
                            key={bar.event.id}
                            style={{
                              position: 'absolute',
                              top: `${laneIdx * laneHeight}px`,
                              left: `calc(${left}% + ${bar.isStartInWeek ? 3 : 0}px)`,
                              width: `calc(${width}% - ${(bar.isStartInWeek ? 3 : 0) + (bar.isEndInWeek ? 3 : 0)}px)`,
                              height: '18px',
                              fontSize: '10px',
                              padding: '2px 6px',
                              backgroundColor: barColor + (isDarkMode ? '45' : '30'),
                              color: isOwn ? barColor : (isDarkMode ? '#cbd5e1' : '#64748b'),
                              borderLeft: bar.isStartInWeek ? `3px solid ${barColor}` : 'none',
                              borderRadius: `${bar.isStartInWeek ? '4px' : '0'} ${bar.isEndInWeek ? '4px' : '0'} ${bar.isEndInWeek ? '4px' : '0'} ${bar.isStartInWeek ? '4px' : '0'}`,
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              fontWeight: '600',
                              lineHeight: '14px',
                              boxSizing: 'border-box'
                            }}
                          >
                            {!isOwn && bar.isStartInWeek && <span>{bar.event.creator?.name} </span>}
                            {bar.event.title}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Single-day events per cell */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  paddingBottom: '8px',
                  minHeight: '4px'
                }}>
                  {week.map((day, col) => {
                    const visibleMultiInCell = visibleLanes.reduce((count, lane) =>
                      count + lane.filter(bar => (col + 1) >= bar.startCol && (col + 1) <= bar.endCol).length
                    , 0);
                    const hiddenMultiInCell = hiddenLanes.reduce((count, lane) =>
                      count + lane.filter(bar => (col + 1) >= bar.startCol && (col + 1) <= bar.endCol).length
                    , 0);

                    const singles = getSingleDayEventsForDate(day);
                    const remainingSlots = Math.max(0, 4 - visibleMultiInCell);
                    const showSingles = Math.min(singles.length, remainingSlots);
                    const hiddenCount = hiddenMultiInCell + (singles.length - showSingles);

                    if (showSingles === 0 && hiddenCount === 0) return <div key={col} />;

                    return (
                      <div key={col} style={{ padding: '0 3px' }}>
                        {singles.slice(0, showSingles).map(ev => {
                          const isOwn = ev.creator?.id === user?.id;
                          const barColor = isOwn ? getStatusColor(ev.status) : '#94a3b8';
                          return (
                            <div
                              key={ev.id}
                              style={{
                                fontSize: '10px',
                                padding: '2px 4px',
                                borderRadius: '3px',
                                backgroundColor: barColor + (isDarkMode ? '35' : '28'),
                                color: isOwn ? barColor : (isDarkMode ? '#cbd5e1' : '#64748b'),
                                borderLeft: `3px solid ${barColor}`,
                                marginBottom: '1px',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                fontWeight: '500',
                                lineHeight: '14px'
                              }}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                        {hiddenCount > 0 && (
                          <div style={{ fontSize: '10px', color: secondaryTextColor, textAlign: 'center' }}>
                            +{hiddenCount}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Event List ===== */}
      <div id="event-list">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '600', margin: 0 }}>
            {selectedDay
              ? `${selectedDay.getMonth() + 1}월 ${selectedDay.getDate()}일 일정`
              : `이번 달 일정 (${events.length}개)`
            }
          </h3>
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                backgroundColor: 'transparent',
                color: textColor,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500'
              }}
            >
              전체 보기
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '16px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {[
            { key: 'all', label: '전체' },
            { key: 'ongoing', label: '진행중' },
            { key: 'completed', label: '완료' },
            { key: 'overdue', label: '지연' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              style={{
                padding: '7px 16px',
                borderRadius: '20px',
                border: selectedTab === tab.key ? 'none' : `1px solid ${borderColor}`,
                backgroundColor: selectedTab === tab.key ? '#3B82F6' : (isDarkMode ? 'transparent' : '#ffffff'),
                color: selectedTab === tab.key ? '#fff' : secondaryTextColor,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Event Cards */}
        {filteredListEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: secondaryTextColor,
            fontSize: '14px'
          }}>
            {selectedDay ? '해당 날짜에 일정이 없습니다.' : '일정이 없습니다. 새 일정을 추가해보세요!'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredListEvents.slice(0, 20).map(event => {
              const startDate = new Date(event.startAt);
              const endDate = new Date(event.endAt);
              const isMultiDayEvent = norm(startDate).getTime() !== norm(endDate).getTime();
              const isOwnEvent = event.creator?.id === user?.id;

              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event.id)}
                  style={{
                    padding: isMobile ? '14px' : '16px',
                    borderRadius: '10px',
                    backgroundColor: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderLeft: `4px solid ${isOwnEvent ? getStatusColor(event.status) : '#94a3b8'}`,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: '600', color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.title}
                      </div>
                      {!isOwnEvent && event.creator?.name && (
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                          color: secondaryTextColor,
                          fontWeight: '500',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {event.creator.name}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      backgroundColor: getStatusColor(event.status) + '30',
                      color: getStatusColor(event.status),
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {getStatusText(event.status)}
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: secondaryTextColor }}>
                    {isMultiDayEvent ? (
                      <>
                        {startDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        {' ~ '}
                        {endDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </>
                    ) : (
                      startDate.toLocaleString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    )}
                  </div>
                  {event.content && (
                    <div style={{
                      fontSize: '13px',
                      color: isDarkMode ? secondaryTextColor : '#94a3b8',
                      marginTop: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {event.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Modals ===== */}
      <EventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleEventSuccess}
        selectedDate={selectedDate}
      />
      <EventDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        eventId={selectedEventId}
        onSuccess={handleEventSuccess}
      />
    </div>
  );
}
