# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

반복 일정 기능이 있는 업무 일정 관리 시스템. React 프론트엔드와 Node.js 백엔드로 구성된 풀스택 애플리케이션이며 Docker로 배포됩니다.

**기술 스택:**
- **백엔드**: Node.js 18+ + Express + PostgreSQL 14+
- **프론트엔드**: React (폴더명: `schedule-frontend`)
- **인증**: JWT (jsonwebtoken) + bcrypt
- **보안**: helmet, cors, express-rate-limit
- **데이터베이스**: PostgreSQL (`schedule_management`)
- **배포**: Docker (컨테이너: backend, frontend, database)
- **배포 경로**: `/var/www/schedule-app`

## 로컬 개발 환경 설정

### 1. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 DB_PASSWORD, JWT_SECRET 수정 필요

# PostgreSQL 데이터베이스 생성
psql -U postgres
CREATE DATABASE schedule_management;
\q

# 스키마 생성 (프로젝트 루트에 database-schema.sql 필요)
psql -U postgres -d schedule_management -f ../database-schema.sql

# 개발 모드 실행 (nodemon - 자동 재시작)
npm run dev

# 프로덕션 모드 실행
npm start
```

### 2. 프론트엔드 설정

```bash
cd schedule-frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

### 3. Health Check

```bash
# 백엔드 서버 확인
curl http://localhost:3000/health

# 응답: {"success": true, "message": "Server is running", "timestamp": "..."}
```

## 배포 명령어 (Docker)

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
docker-compose logs backend --tail=50 -f

# 프론트엔드 로그
docker-compose logs frontend --tail=50 -f

# 전체 로그
docker-compose logs --tail=50 -f
```

### 데이터베이스 접속
```bash
# Docker 환경
docker-compose exec database psql -U scheduleuser -d schedule_management

# 로컬 환경
psql -U postgres -d schedule_management
```

## 아키텍처

### 프로젝트 구조

```
schedule/
├── backend/
│   ├── server.js                     # Express 서버 진입점
│   ├── routes/
│   │   └── events.js                 # 이벤트 API 라우트
│   └── src/
│       ├── controllers/
│       │   └── eventController.js    # 이벤트 CRUD + 완료 처리
│       └── utils/
│           └── recurringEvents.js    # 반복 일정 확장 로직
├── schedule-frontend/
│   └── src/
│       ├── components/
│       │   └── events/
│       │       ├── EventModal.jsx          # 일정 생성 모달
│       │       └── EventDetailModal.jsx    # 일정 상세 + 완료 처리
│       └── utils/
│           └── api.js                # API 클라이언트
└── docs/
    ├── claude.md                     # 반복 일정 프로젝트 개요
    └── CLAUDE_CODE_GUIDE.md          # 배포 및 트러블슈팅 가이드
```

**중요 노트**:
- middleware와 config 파일들은 routes 폴더에서 상대 경로로 import됨
- 인증 미들웨어는 `../middleware/auth.js`에서 import

### 반복 일정 시스템

핵심 기능은 3개의 데이터베이스 테이블로 구성된 반복 일정 관리입니다:

#### 1. `event_series` 테이블
반복 일정 템플릿을 저장합니다.
- `recurrence_type`: 반복 유형 (day, week, month, year)
- `recurrence_interval`: 반복 주기 (예: 2 = 2주마다)
- `recurrence_end_date`: 반복 종료일
- `first_occurrence_date`: 시작일
- `start_time`, `end_time`: 시간 정보

#### 2. `event_exceptions` 테이블
삭제/수정된 특정 일정을 추적합니다.
- `series_id`: event_series의 FK
- `exception_date`: 제외할 날짜

#### 3. `events` 테이블
단일 일정과 반복 일정 인스턴스 모두 저장합니다.
- `series_id`: 반복 일정용 FK (nullable)
- `occurrence_date`: 이번 일정의 특정 날짜
- `is_exception`: 시리즈에서 수정된 경우 true
- `original_series_id`: 예외의 원본 시리즈 추적
- `status`: 일정 상태 (PENDING, COMPLETED 등)

### 주요 백엔드 파일

**`src/utils/recurringEvents.js`** - 반복 일정 확장 로직
- `generateOccurrencesFromSeries()`: 반복 일정을 날짜 범위 내의 개별 일정으로 확장
- `getNextOccurrenceDate()`: 다음 일정 날짜 계산 (day/week/month/year 지원)

**`src/controllers/eventController.js`** - 메인 CRUD 작업
- **중요**: camelCase(프론트엔드)와 snake_case(데이터베이스) 모두 지원
- `getEvents()`: 날짜 범위에 대해 반복 일정 자동 확장
- `createEvent()`: 일반/반복 일정 생성
- `completeEvent()`: 반복 일정 완료 시 예외 이벤트 생성
- `uncompleteEvent()`: 완료 취소
- 수정/삭제는 "이번만" vs "전체 시리즈" 지원

**`routes/events.js`** - API 라우트
- 인증 미들웨어 적용
- `/complete`, `/uncomplete` 엔드포인트 포함

### 주요 프론트엔드 파일

**`components/events/EventModal.jsx`** - 일정 생성 모달
- `useEffect`로 모달 열 때마다 폼 리셋

**`components/events/EventDetailModal.jsx`** - 일정 상세 모달
- 완료 처리 기능
- `actionInProgress` 상태로 중복 클릭 방지
- 반복 일정 지원

**`utils/api.js`** - API 클라이언트
- **중요**: `getEvent()` 함수는 `response.event`를 반환 (단순 `response`가 아님)

## API 패턴

### 이벤트 ID 형식
반복 일정은 복합 ID 사용: `series-{seriesId}-{occurrenceTimestamp}`
- 예시: `series-1-1770076800000`
- 일반 일정: 숫자 ID (예: `123`)

### 반복 일정 생성
```bash
POST /api/v1/events
Content-Type: application/json
Authorization: Bearer {token}

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
Authorization: Bearer {token}
```

### 주요 엔드포인트
- `GET /api/v1/events` - 일정 목록 (반복 자동 확장)
- `GET /api/v1/events/:id` - 일정 상세
- `POST /api/v1/events` - 일정 생성
- `PUT /api/v1/events/:id` - 일정 수정
- `DELETE /api/v1/events/:id` - 일정 삭제
- `POST /api/v1/events/:id/complete` - 완료
- `POST /api/v1/events/:id/uncomplete` - 완료 취소

## 환경 변수 (.env)

백엔드 루트에 `.env` 파일 생성:

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedule_management
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 트러블슈팅

### 문제: 일정 상세가 표시되지 않음
**원인**: 프론트엔드 캐시 또는 빌드가 업데이트되지 않음

**해결**:
```bash
# 1. 프론트엔드 재빌드
cd /var/www/schedule-app/schedule-frontend
npm run build
cd ..
rm -rf frontend/build/*
cp -r schedule-frontend/build/* frontend/build/
docker-compose restart frontend

# 2. 브라우저 캐시 클리어 (Ctrl+Shift+R)
```

### 문제: 완료 처리가 작동하지 않음
**확인 사항**:
```bash
# 1. 백엔드 로그 확인
docker-compose logs backend --tail=50

# 2. 데이터베이스 상태 확인
docker-compose exec database psql -U scheduleuser -d schedule_management
SELECT * FROM events WHERE series_id = 1 LIMIT 5;

# 3. 백엔드 재시작
docker-compose restart backend
```

### 문제: Rate limit 에러 (429)
**해결**: 60초 대기 후 재시도, 또는 `.env`에서 `RATE_LIMIT_MAX_REQUESTS` 증가

### 문제: 데이터베이스 연결 실패
```bash
# PostgreSQL이 실행 중인지 확인
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Docker
docker-compose ps database
```

### 문제: JWT 토큰 오류
**해결**: 다시 로그인하여 새 토큰 발급. Authorization 헤더 형식 확인: `Bearer <token>`

## 알려진 이슈 및 남은 작업

### 🚧 남은 작업
1. `getEvents()`가 완료된 예외 이벤트 상태를 반영해야 함
2. 반복 일정 수정/삭제 UI 추가 (이번만 vs 전체 시리즈 선택)
3. 알림/경고 기능 추가
4. v4 디자인 업데이트 적용

## 추가 문서

상세 문서 참고:
- [docs/claude.md](docs/claude.md): 반복 일정 프로젝트 개요, DB 스키마
- [docs/CLAUDE_CODE_GUIDE.md](docs/CLAUDE_CODE_GUIDE.md): 배포 절차, 트러블슈팅
- [backend/README.md](backend/README.md): 백엔드 설치 및 설정 가이드
