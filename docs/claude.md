# 반복 일정 기능 프로젝트

## 프로젝트 개요
업무일정 관리 시스템에 반복 일정 기능 추가 작업

## 완료된 작업

### ✅ 백엔드 (Node.js + PostgreSQL)
1. **recurringEvents.js** - 반복 일정 헬퍼 함수
   - `generateOccurrencesFromSeries()` - 반복 일정 확장
   - `getNextOccurrenceDate()` - 다음 날짜 계산

2. **eventController.js** - 반복 일정 컨트롤러
   - `getEvents()` - 일정 목록 조회 (반복 자동 확장)
   - `createEvent()` - 일반/반복 일정 생성 (camelCase & snake_case 지원)
   - `updateEvent()` - 수정 (이번만/전체)
   - `deleteEvent()` - 삭제 (이번만/전체)
   - `getEventById()` - 상세 조회 (완료 상태 체크 포함)
   - `completeEvent()` - 완료 처리 (반복 일정은 예외 이벤트 생성)
   - `uncompleteEvent()` - 완료 취소

3. **routes/events.js** - 라우터
   - 컨트롤러 연결
   - `/complete`, `/uncomplete` 라우트 추가

### ✅ 프론트엔드 (React)
1. **api.js** - API 클라이언트
   - `getEvent()` 수정: `response.event` 반환
   
2. **EventModal.jsx** - 일정 생성 모달
   - `useEffect`로 모달 열 때마다 폼 초기화
   
3. **EventDetailModal.jsx** - 일정 상세 모달
   - 완료 처리 기능
   - 반복 일정 지원

## DB 스키마

### event_series
```sql
- id
- title, content
- recurrence_type (enum: day, week, month, year)
- recurrence_interval
- recurrence_end_date
- start_time, end_time
- first_occurrence_date
- alert
- creator_id, department_id, office_id, division_id
```

### event_exceptions
```sql
- id
- series_id (FK)
- exception_date
```

### events
```sql
- series_id (FK, nullable)
- occurrence_date (nullable)
- is_exception (boolean)
- original_series_id (nullable)
```

## API 엔드포인트

### 반복 일정 생성
```bash
POST /api/v1/events
{
  "title": "주간 스탠드업",
  "startAt": "2026-02-03T10:00:00",
  "endAt": "2026-02-03T11:00:00",
  "isRecurring": true,
  "recurrenceType": "week",
  "recurrenceInterval": 1,
  "recurrenceEndDate": "2026-03-31"
}
```

### 완료 처리
```bash
POST /api/v1/events/series-1-1770076800000/complete
```

### 완료 취소
```bash
POST /api/v1/events/series-1-1770076800000/uncomplete
```

## 현재 문제 및 다음 단계

### 🚧 남은 작업
1. getEvents()에서 완료된 예외 이벤트 상태 반영
2. 프론트엔드 재빌드 및 캐시 클리어
3. 반복 일정 수정/삭제 UI 추가
4. 알림 기능 추가

## 파일 위치

### 백엔드
```
backend/
├── src/
│   ├── controllers/
│   │   └── eventController.js
│   └── utils/
│       └── recurringEvents.js
├── routes/
│   └── events.js
└── config/
    └── database.js
```

### 프론트엔드
```
frontend/
└── src/
    ├── components/
    │   └── events/
    │       ├── EventModal.jsx
    │       └── EventDetailModal.jsx
    └── utils/
        └── api.js
```

## 배포 정보

- 백엔드: Docker 컨테이너 (schedule-api)
- 프론트엔드: Docker 컨테이너 (schedule-frontend)
- DB: PostgreSQL (schedule_management)
- 배포 경로: `/var/www/schedule-app`

## 재빌드 명령어

```bash
# 백엔드
cd /var/www/schedule-app
docker-compose build backend
docker-compose up -d

# 프론트엔드
cd /var/www/schedule-app/schedule-frontend
npm run build
cd /var/www/schedule-app
rm -rf frontend/build/*
cp -r schedule-frontend/build/* frontend/build/
docker-compose restart frontend
```
