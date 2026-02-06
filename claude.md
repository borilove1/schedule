# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

업무 일정 관리 시스템. 반복 일정, 알림, 관리자 페이지, 다크모드를 지원하는 풀스택 웹 애플리케이션이며 Docker로 배포됩니다.

**기술 스택:**
- **백엔드**: Node.js 18+ / Express 4 / PostgreSQL 13+
- **프론트엔드**: React 18 (CRA) / lucide-react (아이콘)
- **인증**: JWT (jsonwebtoken) + bcrypt
- **보안**: helmet, cors, express-rate-limit (현재 비활성화), express-validator
- **알림**: node-cron 기반 리마인더 + 인앱 알림
- **배포**: Docker Compose (3 컨테이너: backend, frontend, database)
- **배포 경로**: `/var/www/schedule-app`

## 프로젝트 구조

```
schedule/
├── CLAUDE.md                           # Claude Code 가이드 (이 파일)
├── docker-compose.yml                  # Docker 오케스트레이션
├── .env                                # Docker 환경변수 (DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, CORS_ORIGIN)
│
├── backend/
│   ├── server.js                       # Express 진입점 + Cron jobs
│   ├── Dockerfile                      # node:18-alpine, production 빌드
│   ├── package.json
│   ├── .env                            # 백엔드 환경변수
│   ├── config/
│   │   └── database.js                 # PG Pool + query/transaction 헬퍼
│   ├── middleware/
│   │   ├── auth.js                     # JWT 인증 + 역할 권한(authorize) + 일정 권한(canViewEvent/canEditEvent)
│   │   └── errorHandler.js             # 중앙 에러 처리 (Validation/JWT/PG/커스텀 에러)
│   ├── routes/
│   │   ├── auth.js                     # 회원가입/로그인/로그아웃/내정보
│   │   ├── events.js                   # 일정 CRUD + 완료/완료취소
│   │   ├── users.js                    # 사용자 관리 (ADMIN 전용)
│   │   ├── organizations.js            # 조직 구조 CRUD (본부/처/부서)
│   │   ├── comments.js                 # 댓글 CRUD (일정/시리즈)
│   │   ├── notifications.js            # 알림 조회/읽음/삭제/리마인더체크
│   │   └── settings.js                 # 시스템 설정 (ADMIN 전용)
│   └── src/
│       ├── controllers/
│       │   ├── eventController.js      # 일정 CRUD + 반복 일정 처리 (핵심)
│       │   └── notificationController.js # 알림 CRUD + createNotification 헬퍼
│       └── utils/
│           ├── recurringEvents.js      # 반복 일정 확장 로직
│           └── reminderService.js      # Cron 기반 마감 임박 알림 생성
│
├── schedule-frontend/
│   ├── Dockerfile                      # node:18-alpine 빌드 → nginx:alpine
│   ├── nginx.conf                      # SPA 라우팅 + /api/ 리버스 프록시 → backend:3000
│   ├── package.json
│   └── src/
│       ├── App.js                      # 루트 (ThemeProvider → AuthProvider → AppContent)
│       ├── index.js
│       ├── contexts/
│       │   ├── AuthContext.js          # 인증 상태 (user, login, register, logout)
│       │   ├── ThemeContext.jsx         # 다크모드 토글 (localStorage 저장)
│       │   └── NotificationContext.jsx  # 읽지 않은 알림 개수 (60초 폴링)
│       ├── components/
│       │   ├── auth/
│       │   │   ├── LoginPage.jsx       # 로그인 폼
│       │   │   └── SignupPage.jsx      # 회원가입 폼 (조직 구조 연동)
│       │   ├── layout/
│       │   │   └── MainLayout.jsx      # 헤더(사용자정보/다크모드/알림벨/관리자/로그아웃) + 컨텐츠
│       │   ├── calendar/
│       │   │   └── Calendar.jsx        # 월간 캘린더 뷰
│       │   ├── events/
│       │   │   ├── EventModal.jsx      # 일정 생성 모달 (반복 설정 포함)
│       │   │   └── EventDetailModal.jsx # 일정 상세/수정/삭제/완료 모달
│       │   ├── notifications/
│       │   │   ├── NotificationBell.jsx # 헤더 알림 벨 아이콘 + 뱃지
│       │   │   └── NotificationModal.jsx # 알림 목록 모달
│       │   └── admin/
│       │       ├── AdminPage.jsx        # 관리자 탭 (사용자/조직/설정)
│       │       ├── UserManagement.jsx   # 사용자 목록/검색/역할 변경
│       │       ├── UserDetailModal.jsx  # 사용자 상세/수정 모달
│       │       ├── OrganizationManagement.jsx # 본부/처/부서 트리 관리
│       │       ├── OrgNodeEditModal.jsx # 조직 노드 편집 모달
│       │       └── SystemSettings.jsx   # 시스템 설정 관리
│       └── utils/
│           └── api.js                   # ApiClient 클래스 (fetch 기반)
│
├── database/
│   ├── init.sql                        # 전체 스키마 + 시드 데이터
│   └── migrations/
│       └── add_notifications_table.sql  # 알림 테이블 마이그레이션
│
└── docs/
    ├── claude.md                       # (구) 반복 일정 프로젝트 개요
    └── CLAUDE_CODE_GUIDE.md            # (구) 배포 및 트러블슈팅 가이드
```

## 데이터베이스 스키마

### ENUM 타입
- `user_role`: USER, DEPT_LEAD, ADMIN
- `admin_scope`: DEPARTMENT, OFFICE, DIVISION
- `event_status`: PENDING, DONE
- `recurrence_type`: day, week, month, year
- `alert_time`: none, 30min, 1hour, 3hour, 1day

### 테이블 요약

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `divisions` | 본부 | name (UNIQUE) |
| `offices` | 처/실/지사 | name, division_id (FK) |
| `departments` | 부서 | name, office_id (FK) |
| `users` | 사용자 | email, password_hash, name, position, role, scope, department_id, office_id, division_id, is_active |
| `event_series` | 반복 일정 템플릿 | title, content, recurrence_type/interval/end_date, start_time, end_time, first_occurrence_date, **status**, **completed_at**, alert, creator_id |
| `events` | 단일+예외 일정 | title, content, start_at, end_at, status, completed_at, alert, series_id (FK), occurrence_date, is_exception, original_series_id |
| `event_exceptions` | 반복 일정 예외 날짜 | series_id (FK), exception_date |
| `comments` | 댓글 | content, event_id (FK) XOR series_id (FK), author_id |
| `notifications` | 인앱 알림 | user_id, type, title, message, is_read, related_event_id, metadata (JSONB) |
| `system_settings` | 시스템 설정 | key (UNIQUE), value (JSONB), description |
| `sessions` | 세션 (미사용) | user_id, token, expires_at |

### 주요 제약 조건
- `users.check_admin_scope`: DEPT_LEAD는 scope 필수, USER는 scope NULL, ADMIN은 scope 무관
- `events.check_time_range`: end_at > start_at
- `events.check_series_occurrence`: series_id와 occurrence_date는 둘 다 있거나 둘 다 NULL

### 뷰 (View)
- `v_users_with_org`: 사용자 + 조직 정보 조인
- `v_events_with_details`: 일정 + 작성자/조직 정보 조인
- `v_comments_with_details`: 댓글 + 작성자 정보 조인

### 트리거
- 모든 테이블에 `update_updated_at_column()` 트리거: UPDATE 시 `updated_at` 자동 갱신

### 시드 데이터
- 부산울산본부 1개, 20개 처/실/지사, 19개 부서 (기획관리실 4부서, 전력사업처 7부서, 전력관리처 8부서)
- 시스템 설정 기본값 6개

## 핵심 아키텍처

### 인증/권한 체계
- **USER**: 같은 부서의 일정만 조회 가능
- **DEPT_LEAD**: scope에 따라 DEPARTMENT/OFFICE/DIVISION 범위 조회
- **ADMIN**: 모든 일정 조회/수정 가능, 관리자 페이지 접근

미들웨어 체인: `authenticate` (JWT 검증 → req.user 설정) → `authorize(...roles)` (역할 체크)

### 반복 일정 시스템

**데이터 흐름:**
1. 반복 일정 생성 → `event_series`에 템플릿 저장
2. 조회 시 `generateOccurrencesFromSeries()`가 날짜 범위에 맞게 가상 일정 생성
3. 가상 일정 ID 형식: `series-{seriesId}-{occurrenceTimestamp}` (예: `series-1-1770076800000`)
4. "이번만 수정/삭제/완료" → `event_exceptions`에 날짜 추가 + `events`에 예외 이벤트 생성
5. "전체 수정" → `event_series` 직접 UPDATE
6. "전체 완료" → `event_series.status = 'DONE'` + 관련 예외 이벤트도 DONE

**중요 패턴:**
- series-* ID를 가진 이벤트에 "이번만" 작업 시, 새 예외 이벤트(숫자 ID)가 생성됨
- 따라서 프론트엔드에서 series-* 이벤트 작업 후에는 **모달을 닫고 캘린더를 새로고침** (원래 series-* ID로는 수정 결과 조회 불가)
- `event_series`의 `status`/`completed_at`이 가상 일정 생성 시 기본값으로 사용됨

### 타임존 처리
- Docker(UTC) 환경에서 PG가 나이브 문자열을 UTC로 저장
- 읽을 때 `toNaiveDateTimeString()`으로 getUTC*를 사용하여 원래 입력값 복원
- 프론트엔드에 타임존 없는 `YYYY-MM-DDTHH:mm:ss` 문자열로 전달

### 알림 시스템
- **자동 알림**: Cron job이 매시간 + 매일 9시에 실행 → 24시간 이내 시작 일정에 리마인더 생성
- **이벤트 알림**: 일정 생성/수정/완료/삭제 시 `createNotification()` 호출
- **프론트엔드**: `NotificationContext`에서 60초마다 읽지 않은 알림 개수 폴링
- **알림 타입**: EVENT_REMINDER, EVENT_COMPLETED, EVENT_UPDATED, EVENT_DELETED, SYSTEM

### 프론트엔드 네비게이션
- SPA (라우터 미사용), `currentPage` state로 페이지 전환
- `calendar`: 기본 캘린더 뷰
- `admin`: ADMIN 역할 전용 관리자 페이지
- Context Provider 순서: ThemeProvider → AuthProvider → NotificationProvider

## API 엔드포인트

모든 API는 `/api/v1` 프리픽스. 인증 필요 시 `Authorization: Bearer {token}` 헤더.

### 인증 (`/auth`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /register | X | 회원가입 (email, password, name, position, division, office, department) |
| POST | /login | X | 로그인 → token + user 반환 |
| POST | /logout | O | 로그아웃 |
| GET | /me | O | 현재 사용자 정보 |

### 일정 (`/events`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | / | O | 일정 목록 (startDate, endDate 쿼리, 반복 자동 확장) |
| GET | /:id | O | 일정 상세 (series-* ID 지원) |
| POST | / | O | 일정 생성 (isRecurring으로 반복 여부 결정) |
| PUT | /:id | O | 일정 수정 (seriesEditType: 'this'/'all') |
| DELETE | /:id | O | 일정 삭제 (deleteType: 'this'/'all') |
| POST | /:id/complete | O | 완료 처리 (completeType: 'this'/'all') |
| POST | /:id/uncomplete | O | 완료 취소 |

### 사용자 (`/users`) - ADMIN 전용
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | / | O (ADMIN) | 사용자 목록 (search, role, departmentId 등 필터) |
| GET | /:id | O | 사용자 상세 (본인 또는 ADMIN) |
| PUT | /:id | O (ADMIN) | 사용자 수정 |
| PATCH | /:id/toggle-active | O (ADMIN) | 활성화/비활성화 토글 |
| DELETE | /:id | O (ADMIN) | 사용자 삭제 |

### 조직 (`/organizations`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /structure | X | 전체 조직 구조 (계층형) |
| GET | /divisions | X | 본부 목록 |
| GET | /offices | X | 처 목록 (?divisionId 필터) |
| GET | /departments | X | 부서 목록 (?officeId 필터) |
| POST | /divisions | O (ADMIN) | 본부 생성 |
| PUT | /divisions/:id | O (ADMIN) | 본부 수정 |
| DELETE | /divisions/:id | O (ADMIN) | 본부 삭제 (소속 사용자 있으면 거부) |
| POST | /offices | O (ADMIN) | 처 생성 |
| PUT | /offices/:id | O (ADMIN) | 처 수정 |
| DELETE | /offices/:id | O (ADMIN) | 처 삭제 |
| POST | /departments | O (ADMIN) | 부서 생성 |
| PUT | /departments/:id | O (ADMIN) | 부서 수정 |
| DELETE | /departments/:id | O (ADMIN) | 부서 삭제 |

### 댓글 (`/comments`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /events/:eventId | O | 일정에 댓글 추가 |
| POST | /series/:seriesId | O | 시리즈에 댓글 추가 |
| PUT | /:id | O | 댓글 수정 (본인만) |
| DELETE | /:id | O | 댓글 삭제 (본인 또는 ADMIN) |

### 알림 (`/notifications`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | / | O | 알림 목록 (?limit, ?isRead 필터) |
| GET | /unread-count | O | 읽지 않은 알림 수 |
| PATCH | /:id/read | O | 알림 읽음 처리 |
| POST | /read-all | O | 전체 읽음 처리 |
| DELETE | /:id | O | 알림 삭제 |
| POST | /check-reminders | O | 수동 리마인더 체크 |

### 시스템 설정 (`/settings`) - ADMIN 전용
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | / | O (ADMIN) | 전체 설정 조회 |
| PUT | / | O (ADMIN) | 설정 일괄 수정 |
| GET | /:key | O (ADMIN) | 개별 설정 조회 |
| PUT | /:key | O (ADMIN) | 개별 설정 수정 |

## API 응답 패턴

```json
// 성공
{ "success": true, "data": { ... } }

// 에러
{ "success": false, "error": { "code": "ERROR_CODE", "message": "에러 메시지" } }
```

**주요 에러 코드**: AUTH_003 (토큰 없음), AUTH_004 (토큰 만료), AUTH_005 (권한 없음), VALIDATION_ERROR, DUPLICATE_EMAIL, USER_001 (사용자 없음)

## 주요 코드 패턴

### 프론트엔드 api.js
- `ApiClient` 클래스, 싱글톤 `export const api = new ApiClient()`
- `API_BASE_URL`은 `REACT_APP_API_URL` 환경변수 또는 `/api/v1` (nginx 프록시 사용 시)
- **중요**: `getEvent()`는 `response?.event || response` 반환
- `request()` 메서드가 `{ success: true, data: {...} }` 형태면 `data`만 자동 추출

### 프론트엔드 상태 관리
- React Context API만 사용 (외부 상태 관리 라이브러리 없음)
- `AuthContext`: user 객체, login/register/logout
- `ThemeContext`: isDarkMode, toggleDarkMode (localStorage 연동)
- `NotificationContext`: unreadCount, refreshNotifications (60초 폴링)

### 프론트엔드 스타일링
- CSS-in-JS (인라인 스타일), 외부 CSS 파일 없음
- lucide-react 아이콘만 사용
- 다크모드: `isDarkMode`에 따라 색상값 조건부 설정
- 폰트: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

### 백엔드 eventController.js
- `toNaiveDateTimeString()`: PG TIMESTAMPTZ → 나이브 문자열 변환 (UTC 기준)
- `formatEventRow()`: DB row의 모든 타임스탬프 필드를 나이브 문자열로 변환
- camelCase(프론트엔드)와 snake_case(DB) 양방향 지원
- `getEvents()`에서 반복 일정 자동 확장 + 예외 이벤트 상태 반영

### 백엔드 database.js
- `query(text, params)`: 파라미터화된 쿼리 실행 (SQL injection 방지)
- `transaction(callback)`: BEGIN/COMMIT/ROLLBACK 자동 처리
- 개발 모드에서 쿼리 로깅

## 로컬 개발 환경

### 백엔드
```bash
cd backend
npm install
cp .env.example .env   # DB_PASSWORD, JWT_SECRET 수정
npm run dev             # nodemon 자동 재시작 (포트 3000)
```

### 프론트엔드
```bash
cd schedule-frontend
npm install
npm start               # CRA 개발 서버
```

### Health Check
```bash
curl http://localhost:3000/health
# → {"success": true, "message": "Server is running", "timestamp": "..."}
```

## 배포 (Docker)

### Docker Compose 구성
- `database`: postgres:13-alpine (포트 5433:5432)
- `backend`: node:18-alpine (포트 3001:3000), database healthy 이후 시작
- `frontend`: nginx:alpine (포트 8080:80), nginx가 /api/ 요청을 backend:3000으로 프록시

### 프론트엔드 배포
```bash
cd /var/www/schedule-app/schedule-frontend
npm run build
cd /var/www/schedule-app
rm -rf frontend/build/*
cp -r schedule-frontend/build/* frontend/build/
docker-compose restart frontend
```

### 백엔드 배포
```bash
cd /var/www/schedule-app
docker-compose build --no-cache backend
docker-compose up -d backend
```

### 전체 재시작
```bash
cd /var/www/schedule-app
docker-compose restart backend frontend
```

### 로그 확인
```bash
docker-compose logs backend --tail=50 -f
docker-compose logs frontend --tail=50 -f
```

### DB 접속
```bash
docker-compose exec database psql -U scheduleuser -d schedule_management
```

### DB 마이그레이션 실행
```bash
docker-compose exec database psql -U scheduleuser -d schedule_management -f /path/to/migration.sql
```

## 환경 변수

### 프로젝트 루트 `.env` (Docker Compose용)
```
DB_NAME=schedule_management
DB_USER=scheduleuser
DB_PASSWORD=<비밀번호>
JWT_SECRET=<시크릿>
CORS_ORIGIN=http://localhost:8080
```

### `backend/.env` (로컬 개발용)
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedule_management
DB_USER=postgres
DB_PASSWORD=<비밀번호>
JWT_SECRET=<시크릿>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

## 트러블슈팅

### Docker 프론트엔드 빌드에서 새 파일이 포함 안 되는 경우
```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### 반복 일정 관련 디버깅
```sql
-- event_series 상태 확인
SELECT id, title, status, completed_at FROM event_series WHERE creator_id = <userId>;

-- 예외 이벤트 확인
SELECT id, title, status, series_id, is_exception, occurrence_date FROM events WHERE series_id = <seriesId>;

-- 예외 날짜 확인
SELECT * FROM event_exceptions WHERE series_id = <seriesId>;
```

### JWT 토큰 오류
다시 로그인하여 새 토큰 발급. Authorization 헤더 형식: `Bearer <token>`

### Rate Limit 429 에러
현재 rate-limit은 server.js에서 비활성화 상태. 활성화 시 `.env`에서 `RATE_LIMIT_MAX_REQUESTS` 조정.

## 해결된 이슈

1. camelCase/snake_case 불일치 → 양방향 지원
2. 반복 일정 "전체 완료" 시 일정 삭제됨 → DELETE를 UPDATE로 변경, event_series에 status/completed_at 컬럼 추가
3. 시리즈 관계 끊어진 일정에 "undefined 반복" 표시 → recurrenceType null 체크 추가
4. "이번만 완료" 후 모달 미갱신 → series-* ID 이벤트 작업 후 모달 닫기 패턴 적용
5. 반복 일정 수정 시 종료 시간 변경됨 → 타임존 변환 문제 해결 (naiveDateTimeString)
6. 중복 클릭으로 다중 요청 → actionInProgressRef 도입

## 알려진 이슈 및 남은 작업

1. Rate Limiting 재활성화 (프론트엔드 중복 클릭 방지 확인 후)
2. 테스트 코드 작성
3. 댓글 UI (프론트엔드에 아직 댓글 표시/작성 UI 미구현)
4. 반복 일정 생성 모달에서 다일(multi-day) 일정 UI 개선
