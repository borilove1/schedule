# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

반복 일정 기능이 있는 업무 일정 관리 시스템. React 프론트엔드와 Node.js 백엔드로 구성된 풀스택 애플리케이션이며 Docker로 배포됩니다.

- **백엔드**: Node.js + PostgreSQL (Docker 컨테이너: `schedule-api`)
- **프론트엔드**: React (Docker 컨테이너: `schedule-frontend`)
- **데이터베이스**: PostgreSQL (`schedule_management`)
- **배포 경로**: `/var/www/schedule-app`

## 빌드 및 배포 명령어

### 프론트엔드 빌드 및 배포
```bash
cd /var/www/schedule-app/schedule-frontend
npm run build
cd /var/www/schedule-app
rm -rf frontend/build/*
cp -r schedule-frontend/build/* frontend/build/
docker-compose restart frontend
```

### 백엔드 빌드 및 배포
```bash
cd /var/www/schedule-app
docker-compose build --no-cache backend
docker-compose restart backend
```

### 전체 재시작
```bash
cd /var/www/schedule-app
docker-compose restart backend frontend
```

### 로그 확인
```bash
# 백엔드 로그
docker-compose logs backend --tail=50

# 프론트엔드 로그
docker-compose logs frontend --tail=50
```

### 데이터베이스 접속
```bash
docker-compose exec database psql -U scheduleuser -d schedule_management
```

## 아키텍처

### 반복 일정 시스템

핵심 기능은 3개의 데이터베이스 테이블로 구성된 반복 일정 관리입니다:

1. **`event_series`**: 반복 일정 템플릿 저장
   - `recurrence_type`: day, week, month, year
   - `recurrence_interval`: 반복 주기 (예: 2주마다)
   - `recurrence_end_date`: 반복 종료일
   - `first_occurrence_date`: 시작일

2. **`event_exceptions`**: 삭제/수정된 특정 일정 추적
   - `series_id`: event_series의 FK
   - `exception_date`: 제외할 날짜

3. **`events`**: 단일 일정과 반복 일정 인스턴스 모두 저장
   - `series_id`: 반복 일정용 FK (nullable)
   - `occurrence_date`: 이번 일정의 특정 날짜
   - `is_exception`: 시리즈에서 수정된 경우 true
   - `original_series_id`: 예외의 원본 시리즈 추적

### 주요 백엔드 파일

- **`src/utils/recurringEvents.js`**: 일정 확장 로직
  - `generateOccurrencesFromSeries()`: 반복 일정을 개별 일정으로 확장
  - `getNextOccurrenceDate()`: 다음 일정 날짜 계산

- **`src/controllers/eventController.js`**: 메인 CRUD 작업
  - camelCase(프론트엔드)와 snake_case(데이터베이스) 모두 지원
  - `getEvents()`: 날짜 범위에 대해 반복 일정 자동 확장
  - `completeEvent()`: 반복 일정 완료 시 예외 이벤트 생성
  - 수정/삭제는 "이번만" vs "전체 시리즈" 지원

- **`routes/events.js`**: `/complete`, `/uncomplete` 포함 API 라우트

### 주요 프론트엔드 파일

- **`components/events/EventModal.jsx`**: useEffect로 폼 리셋하는 일정 생성 모달
- **`components/events/EventDetailModal.jsx`**: 완료 처리 및 중복 클릭 방지(`actionInProgress` 상태)가 있는 상세 뷰
- **`utils/api.js`**: `response.event` 반환 (단순 `response`가 아님)

## API 패턴

### 이벤트 ID 형식
반복 일정은 복합 ID 사용: `series-{seriesId}-{occurrenceTimestamp}`
예시: `series-1-1770076800000`

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

### 일정 완료/완료 취소
```bash
POST /api/v1/events/{eventId}/complete
POST /api/v1/events/{eventId}/uncomplete
```

## 알려진 문제 및 해결 방법

### 문제: 일정 상세가 표시되지 않음
**원인**: 프론트엔드 캐시 또는 빌드가 업데이트되지 않음
**해결**:
1. 프론트엔드 재빌드
2. 브라우저 캐시 클리어 (Ctrl+Shift+R)

### 문제: 완료 처리가 작동하지 않음
**확인 사항**:
1. 백엔드 로그: `docker-compose logs backend --tail=50`
2. 데이터베이스 상태: `events` 테이블에서 series_id 쿼리
3. 백엔드 재시작: `docker-compose restart backend`

### 문제: Rate limit 에러 (429)
**해결**: 60초 대기 후 재시도, 또는 rate limiter 설정 조정

## 남은 작업

기존 문서 기준:
1. `getEvents()`가 완료된 예외 이벤트 상태를 반영해야 함
2. 반복 일정 수정/삭제 UI 추가 (이번만 vs 전체 시리즈)
3. 알림/경고 기능 추가
4. v4 디자인 업데이트 적용

## 추가 문서

상세 문서 참고:
- [docs/claude-context.md](docs/claude-context.md): 전체 프로젝트 개요, DB 스키마 상세
- [docs/CLAUDE_CODE_GUIDE.md](docs/CLAUDE_CODE_GUIDE.md): 배포 절차, 트러블슈팅
