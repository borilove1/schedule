# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

업무 일정 관리 시스템. 반복 일정, 알림, 일정 공유, 댓글, 사용자 승인, 관리자 페이지, 프로필 관리, 다크모드를 지원하는 풀스택 웹 애플리케이션이며 Docker로 배포됩니다.

**기술 스택:**
- **백엔드**: Node.js 18+ / Express 4 / PostgreSQL 13+
- **프론트엔드**: React 18 (CRA) / lucide-react (아이콘)
- **인증**: JWT (jsonwebtoken) + bcrypt
- **보안**: helmet, cors, express-rate-limit, express-validator, compression
- **알림**: node-cron 기반 리마인더 + 인앱 알림
- **배포**: Docker Compose (3 컨테이너: backend, frontend, database)
- **배포 경로**: `/var/www/schedule-app`
- **프로덕션 URL**: `https://1.215.38.118`

## 프로젝트 구조

```
schedule/
├── CLAUDE.md                           # Claude Code 가이드 (이 파일)
├── docker-compose.yml                  # Docker 오케스트레이션 (SSL 포함)
├── .env                                # Docker 환경변수
│
├── backend/
│   ├── server.js                       # Express 진입점 + Rate Limit + Cron jobs
│   ├── Dockerfile                      # node:18-alpine, production 빌드
│   ├── package.json
│   ├── .env                            # 백엔드 환경변수
│   ├── config/
│   │   └── database.js                 # PG Pool (max:20) + query/transaction 헬퍼
│   ├── middleware/
│   │   ├── auth.js                     # JWT 인증 + 역할 권한(authorize) + 일정 권한(canViewEvent/canEditEvent)
│   │   └── errorHandler.js             # 중앙 에러 처리 (Validation/JWT/PG/커스텀 에러)
│   ├── routes/
│   │   ├── auth.js                     # 회원가입/로그인/로그아웃/내정보/프로필수정/비밀번호변경
│   │   ├── events.js                   # 일정 CRUD + 완료/완료취소
│   │   ├── users.js                    # 사용자 관리 + 승인 (ADMIN 전용)
│   │   ├── organizations.js            # 조직 구조 CRUD (본부/처/부서)
│   │   ├── comments.js                 # 댓글 조회/CRUD + 댓글 알림 (일정/시리즈)
│   │   ├── notifications.js            # 알림 조회/읽음/삭제/리마인더체크
│   │   └── settings.js                 # 시스템 설정 (ADMIN 전용)
│   └── src/
│       ├── controllers/
│       │   ├── eventController.js      # 일정 CRUD + 반복 일정 처리 + 공유 (핵심, ~1400줄)
│       │   └── notificationController.js # 알림 CRUD + createNotification 헬퍼
│       └── utils/
│           ├── recurringEvents.js      # 반복 일정 확장 로직 (duration_days 지원)
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
│       │   ├── AuthContext.js          # 인증 상태 (user, login, register, logout, updateProfile)
│       │   ├── ThemeContext.jsx         # 다크모드 토글 (localStorage 저장)
│       │   └── NotificationContext.jsx  # 읽지 않은 알림 개수 (60초 폴링)
│       ├── hooks/
│       │   ├── useThemeColors.js       # 다크/라이트 색상 팔레트 반환
│       │   ├── useIsMobile.js          # 모바일 뷰포트 감지 (768px)
│       │   ├── useResponsive.js        # 반응형 screen/isMobile/isTablet/isDesktop
│       │   ├── useActionGuard.js       # 중복 클릭 방지 (execute/isGuarded/reset)
│       │   └── useCommonStyles.js      # 공통 스타일 객체 (fontFamily, input, label 등)
│       ├── components/
│       │   ├── common/
│       │   │   ├── Button.jsx          # 범용 버튼 (variant/size/loading/fullWidth)
│       │   │   ├── Input.jsx           # 입력 필드 (label/error/required)
│       │   │   ├── LoadingSpinner.jsx   # 로딩 스피너
│       │   │   ├── ErrorAlert.jsx      # 에러 알림 박스
│       │   │   ├── SuccessAlert.jsx    # 성공 알림 박스
│       │   │   ├── ConfirmDialog.jsx   # 확인 다이얼로그 (actions 배열)
│       │   │   └── Skeleton.jsx        # 로딩 플레이스홀더 (pulse 애니메이션)
│       │   ├── auth/
│       │   │   ├── LoginPage.jsx       # 로그인 폼 (비밀번호 토글, 다크모드 토글)
│       │   │   └── SignupPage.jsx      # 회원가입 폼 (조직 구조 연동, 승인 필요 안내)
│       │   ├── layout/
│       │   │   └── MainLayout.jsx      # 헤더(사용자정보/다크모드/알림벨/관리자/로그아웃) + 컨텐츠
│       │   ├── calendar/
│       │   │   ├── Calendar.jsx        # 월간 캘린더 뷰 (메인 컨테이너)
│       │   │   ├── CalendarHeader.jsx  # 월/년 표시, 이전/다음 월, TODAY, + 버튼
│       │   │   ├── CalendarGrid.jsx    # 캘린더 그리드 (유연 레인: 멀티→단일 배치)
│       │   │   ├── calendarHelpers.js  # 날짜/주/멀티데이/단일/레인 할당 유틸
│       │   │   └── EventList.jsx       # 일정 목록 (탭 필터/날짜 필터/더보기/댓글 카운트 뱃지)
│       │   ├── events/
│       │   │   ├── EventModal.jsx      # 일정 생성 모달 (반복 설정 + 처/실 공유)
│       │   │   ├── EventDetailModal.jsx # 일정 상세/수정/삭제/완료 모달
│       │   │   ├── EventDetailView.jsx # 일정 상세 표시 (상태/제목/시간/작성자/반복/공유/댓글)
│       │   │   ├── CommentSection.jsx  # 댓글 인라인 섹션 (조회/작성/수정/삭제)
│       │   │   └── EventEditForm.jsx   # 일정 수정 폼 (반복/공유 설정 포함)
│       │   ├── notifications/
│       │   │   ├── NotificationBell.jsx # 헤더 알림 벨 아이콘 + 뱃지 (99+)
│       │   │   └── NotificationModal.jsx # 알림 목록 모달 (전체/읽지않음 탭)
│       │   ├── admin/
│       │   │   ├── AdminPage.jsx        # 관리자 탭 (사용자/조직/설정)
│       │   │   ├── UserManagement.jsx   # 사용자 목록/검색/역할/상태 필터/승인/페이징
│       │   │   ├── UserDetailModal.jsx  # 사용자 상세/수정 모달 (직급→역할 자동매핑)
│       │   │   ├── OrganizationManagement.jsx # 본부/처/부서 트리 관리
│       │   │   ├── OrgNodeEditModal.jsx # 조직 노드 편집 모달
│       │   │   └── SystemSettings.jsx   # 시스템 설정 관리 (6개 항목)
│       │   └── profile/
│       │       └── ProfilePage.jsx      # 내 정보 수정 (기본정보 + 비밀번호 변경)
│       └── utils/
│           ├── api.js                   # ApiClient 클래스 (fetch 기반, 싱글톤)
│           ├── eventHelpers.js          # 상태 색상/텍스트, 반복 설명, 날짜 정규화
│           ├── mockNotifications.js     # 알림 타입 enum, 상대시간, 아이콘 매핑
│           └── design-tokens.js         # 디자인 토큰 (spacing/fontSize/shadow/breakpoints)
│
├── database/
│   ├── init.sql                        # 전체 스키마 + 시드 데이터
│   └── migrations/
│       ├── add_notifications_table.sql  # 알림 테이블
│       ├── add_event_shared_offices.sql # 일정 공유 테이블
│       └── add_user_approval.sql        # 사용자 승인 (approved_at)
│
├── load-tests/                         # Artillery 부하 테스트
│   ├── scenario1-login.yml             # 로그인 부하 (bcrypt CPU)
│   ├── scenario2-events-query.yml      # 반복 일정 조회 부하
│   ├── scenario3-crud.yml              # CRUD 동시 트랜잭션
│   ├── scenario4-notifications.yml     # 알림 폴링 부하
│   └── production/                     # 프로덕션 URL 버전
│
├── docs/
│   ├── TEST_PLAN.md                    # 종합 점검계획 (12단계 100+ 케이스)
│   ├── claude.md                       # (구) 반복 일정 프로젝트 개요
│   └── CLAUDE_CODE_GUIDE.md            # (구) 배포 및 트러블슈팅 가이드
│
└── .claude/
    └── agents/                         # Claude Code 에이전트 설정
        ├── security-expert.md          # 보안 취약점 분석
        ├── ui-designer.md              # UI/UX 디자인 가이드
        └── code-reviewer.md            # 코드 리뷰/디버깅
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
| `offices` | 처/실/지사 | name, division_id (FK), UNIQUE(name, division_id) |
| `departments` | 부서 | name, office_id (FK), UNIQUE(name, office_id) |
| `users` | 사용자 | email, password_hash, name, position, role, scope, department_id, office_id, division_id, is_active, **approved_at**, last_login_at |
| `event_series` | 반복 일정 템플릿 | title, content, recurrence_type/interval/end_date, start_time, end_time, first_occurrence_date, **duration_days**, status, completed_at, alert, creator_id, department_id, office_id, division_id |
| `events` | 단일+예외 일정 | title, content, start_at, end_at, status, completed_at, alert, series_id (FK), occurrence_date, is_exception, original_series_id, creator_id, department_id, office_id, division_id |
| `event_exceptions` | 반복 일정 예외 날짜 | series_id (FK), exception_date, UNIQUE(series_id, exception_date) |
| `event_shared_offices` | 일정 공유 처/실 | event_id XOR series_id, office_id (FK) |
| `comments` | 댓글 | content, event_id XOR series_id, author_id, is_edited |
| `notifications` | 인앱 알림 | user_id, type, title, message, is_read, related_event_id, related_series_id, metadata (JSONB) |
| `system_settings` | 시스템 설정 | key (UNIQUE), value (JSONB), description, updated_by |
| `sessions` | 세션 (미사용) | user_id, token, expires_at |

### 주요 제약 조건
- `users.check_admin_scope`: DEPT_LEAD는 scope 필수, USER는 scope NULL, ADMIN은 scope 무관
- `events.check_time_range`: end_at > start_at
- `events.check_series_occurrence`: series_id와 occurrence_date는 둘 다 있거나 둘 다 NULL
- `event_shared_offices.check_event_or_series`: event_id XOR series_id (정확히 하나만)
- `comments.check_comment_target`: event_id XOR series_id

### 뷰 (View)
- `v_users_with_org`: 사용자 + 조직 정보 + approved_at 조인
- `v_events_with_details`: 일정 + 작성자/조직 정보 조인
- `v_comments_with_details`: 댓글 + 작성자 정보 조인

### 트리거
- 모든 테이블에 `update_updated_at_column()` 트리거: UPDATE 시 `updated_at` 자동 갱신

### PG 함수
- `can_view_event(user_id, division_id, office_id, department_id)`: 역할 기반 일정 조회 권한 확인

### 시드 데이터
- 부산울산본부 1개, 20개 처/실/지사, 19개 부서 (기획관리실 4, 전력사업처 7, 전력관리처 8)
- 기본 관리자: `admin@admin.com` / `admin1234`
- 시스템 설정 기본값 6개

## 핵심 아키텍처

### 인증/권한 체계
- **USER**: 같은 부서 + 공유된 처/실의 일정만 조회 가능
- **DEPT_LEAD**: scope에 따라 DEPARTMENT/OFFICE/DIVISION 범위 조회
- **ADMIN**: 모든 일정 조회/수정 가능, 관리자 페이지 접근

미들웨어 체인: `authenticate` (JWT 검증 → req.user 설정) → `authorize(...roles)` (역할 체크)

**스코프 필터링** (`buildScopeFilter()`):
- ADMIN → 필터 없음 (1=1)
- DEPT_LEAD(DIVISION) → division_id 일치
- DEPT_LEAD(OFFICE) → office_id 일치
- 기타 → department_id 일치 OR creator_id 일치
- 추가로 `event_shared_offices`를 통한 공유 일정도 조회 가능

### 사용자 승인 워크플로우
1. 회원가입 → `is_active=false`, `approved_at=NULL`
2. 로그인 시도 → AUTH_006 ("관리자 승인 필요")
3. 관리자가 `PATCH /users/:id/approve` → `is_active=true`, `approved_at=NOW()`
4. ACCOUNT_APPROVED 알림 → 사용자에게 전달
5. 승인 후 로그인 가능

### 반복 일정 시스템

**데이터 흐름:**
1. 반복 일정 생성 → `event_series`에 템플릿 저장 (duration_days로 다일 지원)
2. 조회 시 `generateOccurrencesFromSeries()`가 날짜 범위에 맞게 가상 일정 생성
3. 가상 일정 ID 형식: `series-{seriesId}-{occurrenceTimestamp}` (예: `series-1-1770076800000`)
4. "이번만 수정/삭제/완료" → `event_exceptions`에 날짜 추가 + `events`에 예외 이벤트 생성
5. "전체 수정" → `event_series` 직접 UPDATE
6. "전체 완료" → `event_series.status = 'DONE'` + 관련 예외 이벤트도 DONE
7. 단일→반복 변환: transaction 내에서 series INSERT + 기존 event 삭제

**중요 패턴:**
- series-* ID를 가진 이벤트에 "이번만" 작업 시, 새 예외 이벤트(숫자 ID)가 생성됨
- 따라서 프론트엔드에서 series-* 이벤트 작업 후에는 **모달을 닫고 캘린더를 새로고침** (원래 series-* ID로는 수정 결과 조회 불가)
- `event_series`의 `status`/`completed_at`이 가상 일정 생성 시 기본값으로 사용됨

### 일정 공유 시스템
- `event_shared_offices` 테이블: event_id 또는 series_id + office_id
- 생성/수정 시 선택한 처/실을 INSERT (기존 DELETE 후 재INSERT)
- "이번만 수정" 시 시리즈 공유 처를 예외 이벤트로 복사
- 조회 시 `buildScopeFilter()`에서 shared office도 포함하여 필터링

### 타임존 처리
- Docker(UTC) 환경에서 PG가 나이브 문자열을 UTC로 저장
- 읽을 때 `toNaiveDateTimeString()`으로 getUTC*를 사용하여 원래 입력값 복원
- 프론트엔드에 타임존 없는 `YYYY-MM-DDTHH:mm:ss` 문자열로 전달

### 알림 시스템
- **자동 알림**: Cron job이 매시간 + 매일 9시에 실행 → 24시간 이내 시작 일정에 리마인더 생성
- **이벤트 알림**: 일정 생성/수정/완료/삭제 시 `createNotification()` 호출
- **가입 알림**: 회원가입 시 ADMIN에게 USER_REGISTERED, 승인 시 사용자에게 ACCOUNT_APPROVED
- **프론트엔드**: `NotificationContext`에서 60초마다 읽지 않은 알림 개수 폴링
- **댓글 알림**: 댓글 작성 시 일정 작성자에게 EVENT_COMMENTED 알림 (자기 댓글 제외)
- **알림 타입**: EVENT_REMINDER, EVENT_COMPLETED, EVENT_UPDATED, EVENT_DELETED, EVENT_COMMENTED, USER_REGISTERED, ACCOUNT_APPROVED, SYSTEM
- **중복 방지**: 48시간 윈도우 내 동일 이벤트 리마인더 중복 생성 방지

### 댓글 시스템
- **인라인 UI**: EventDetailView 하단에 CommentSection 컴포넌트 (구분선 아래)
- **데이터 흐름**: eventId가 `series-*` 형식이면 seriesId 추출 → 시리즈 댓글 API 호출
- **CRUD**: 조회(GET)/작성(POST)/수정(PUT, 본인만)/삭제(DELETE, 본인 또는 ADMIN)
- **알림**: 타인 일정에 댓글 시 작성자에게 EVENT_COMMENTED 알림 (자기 댓글 제외)
- **EventList 뱃지**: `getEvents()` 응답에 `commentCount` 포함 → 카드에 💬 N 뱃지 표시
- **UX**: Enter 전송/Shift+Enter 줄바꿈, 이니셜 아바타(작성자별 색상), 상대 시간, (수정됨) 뱃지
- **권한**: canEdit=true면 댓글 작성 가능, 수정은 본인만, 삭제는 본인 또는 ADMIN

### 캘린더 그리드 레인 시스템
- 멀티데이 이벤트를 `assignLanes()`로 비충돌 레인 배치 (최대 PC:5, 모바일:3)
- **유연 레인 배치**: 멀티데이 우선 배치 후 각 셀의 빈 레인에 단일 일정을 절대 위치로 배치
- 빈 레인이 부족한 셀은 +n 오버플로우로 표시
- 소유 일정: 상태 색상 표시 / 타인 일정: 회색 + 작성자명

### 프론트엔드 네비게이션
- SPA (라우터 미사용), `currentPage` state로 페이지 전환
- `calendar`: 기본 캘린더 뷰
- `admin`: ADMIN 역할 전용 관리자 페이지
- `profile`: 내 정보 수정 페이지
- Context Provider 순서: ThemeProvider → AuthProvider → NotificationProvider

### 프론트엔드 공통 컴포넌트
- `Button`: primary/secondary/danger/success/ghost 변형, loading 상태
- `Input`: label + error + required 지원
- `ConfirmDialog`: 확인/취소 다이얼로그 (actions 배열)
- `Skeleton`: 로딩 플레이스홀더 (pulse 애니메이션)
- `ErrorAlert`, `SuccessAlert`: 알림 박스

## API 엔드포인트

모든 API는 `/api/v1` 프리픽스. 인증 필요 시 `Authorization: Bearer {token}` 헤더.

### 인증 (`/auth`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /register | X | 회원가입 → is_active=false, 관리자 알림 |
| POST | /login | X | 로그인 → token + user (승인 상태 검증) |
| POST | /logout | O | 로그아웃 |
| GET | /me | O | 현재 사용자 정보 (조직 포함) |
| PUT | /me | O | 프로필 수정 (이름, 직급, 소속) |
| PUT | /change-password | O | 비밀번호 변경 (현재 비밀번호 검증) |

### 일정 (`/events`)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | / | O | 일정 목록 (startDate, endDate 쿼리, 반복 자동 확장, 공유 일정 포함) |
| GET | /:id | O | 일정 상세 (series-* ID 지원) |
| POST | / | O | 일정 생성 (isRecurring + sharedOfficeIds) |
| PUT | /:id | O | 일정 수정 (seriesEditType: 'this'/'all', isRecurring으로 단일→반복 변환) |
| DELETE | /:id | O | 일정 삭제 (deleteType: 'this'/'all' 또는 'single'/'series') |
| POST | /:id/complete | O | 완료 처리 (completeType: 'this'/'all') |
| POST | /:id/uncomplete | O | 완료 취소 |

### 사용자 (`/users`) - ADMIN 전용
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | / | O (ADMIN) | 사용자 목록 (search, role, active, departmentId 등 필터 + 페이징) |
| GET | /pending-count | O (ADMIN) | 승인 대기 사용자 수 |
| GET | /:id | O | 사용자 상세 (본인 또는 ADMIN) |
| PUT | /:id | O (ADMIN) | 사용자 수정 (직급→역할 자동매핑) |
| PATCH | /:id/approve | O (ADMIN) | 사용자 승인 (is_active=true, approved_at) |
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
| GET | /events/:eventId | O | 일정 댓글 목록 (v_comments_with_details, ASC) |
| GET | /series/:seriesId | O | 시리즈 댓글 목록 |
| POST | /events/:eventId | O | 일정에 댓글 추가 (canViewEvent 확인) + 작성자에게 EVENT_COMMENTED 알림 |
| POST | /series/:seriesId | O | 시리즈에 댓글 추가 + 작성자에게 EVENT_COMMENTED 알림 |
| PUT | /:id | O | 댓글 수정 (본인만, is_edited=true) |
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

**주요 에러 코드**: AUTH_003 (토큰 없음), AUTH_004 (토큰 만료), AUTH_005 (권한 없음), AUTH_006 (승인 대기), AUTH_007 (비활성화), VALIDATION_ERROR, DUPLICATE_EMAIL, DUPLICATE_NAME, INVALID_PASSWORD, USER_001 (사용자 없음), HAS_USERS (소속원 존재)

## Rate Limiting

3개 Rate Limiter 활성화 (`server.js`):
- **로그인**: 15분당 10회 (`/api/v1/auth/login`)
- **인증 전체**: 15분당 N회 (`/api/v1/auth`, `RATE_LIMIT_MAX_REQUESTS` 환경변수)
- **일정**: 1분당 100회 (`/api/v1/events`)

## 주요 코드 패턴

### 프론트엔드 api.js
- `ApiClient` 클래스, 싱글톤 `export const api = new ApiClient()`
- `API_BASE_URL`은 `REACT_APP_API_URL` 환경변수 또는 `/api/v1` (nginx 프록시 사용 시)
- **중요**: `getEvent()`는 `response?.event || response` 반환
- `request()` 메서드가 `{ success: true, data: {...} }` 형태면 `data`만 자동 추출
- 메서드 그룹: Auth, Events, Users, Organizations, Settings, Comments (getEventComments/getSeriesComments/addEventComment/addSeriesComment/updateComment/deleteComment), Notifications

### 프론트엔드 상태 관리
- React Context API만 사용 (외부 상태 관리 라이브러리 없음)
- `AuthContext`: user 객체, login/register/logout/updateProfile
- `ThemeContext`: isDarkMode, toggleDarkMode (localStorage 연동)
- `NotificationContext`: unreadCount, refreshNotifications (60초 폴링)

### 프론트엔드 스타일링
- CSS-in-JS (인라인 스타일), 외부 CSS 파일 없음
- lucide-react 아이콘만 사용
- 다크모드: `useThemeColors()` 훅으로 색상 팔레트 공급
- 디자인 토큰: `design-tokens.js` (spacing, fontSize, shadow, breakpoints)
- 폰트: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- 반응형: `useIsMobile()` / `useResponsive()` 훅

### 프론트엔드 UX 패턴
- `useActionGuard()`: 중복 클릭 방지 (execute/isGuarded/reset)
- `React.memo`: CalendarGrid, EventList 등 무거운 컴포넌트 메모이제이션
- ESC 키: 모든 모달 닫기 지원
- 클릭 외부 감지: 드롭다운/모달 닫기 (useRef + useEffect)
- requestAnimationFrame: 모달 열림 애니메이션

### 백엔드 eventController.js
- `toNaiveDateTimeString()`: PG TIMESTAMPTZ → 나이브 문자열 변환 (UTC 기준)
- `formatEventRow()`: DB row의 모든 타임스탬프 필드를 나이브 문자열로 변환
- `buildScopeFilter()`: 역할 기반 SQL WHERE절 동적 생성
- camelCase(프론트엔드)와 snake_case(DB) 양방향 지원
- `getEvents()`에서 반복 일정 자동 확장 + 예외 이벤트 상태 반영 + 공유 일정 포함

### 백엔드 database.js
- `query(text, params)`: 파라미터화된 쿼리 실행 (SQL injection 방지)
- `transaction(callback)`: BEGIN/COMMIT/ROLLBACK 자동 처리
- 개발 모드에서 쿼리 실행 시간 로깅
- Pool: max 20, idle 30s, connect timeout 2s

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
- `database`: postgres:13-alpine (포트 5433:5432), healthcheck 포함
- `backend`: node:18-alpine (포트 3001:3000), database healthy 이후 시작
- `frontend`: nginx:alpine (포트 8080:80, 443:443), SSL 인증서 마운트, /api/ → backend:3000 프록시

### 프론트엔드 배포
```bash
cd /var/www/schedule-app
docker-compose build --no-cache frontend
docker-compose up -d frontend
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
NODE_ENV=production
DB_NAME=schedule_management
DB_USER=scheduleuser
DB_PASSWORD=<비밀번호>
JWT_SECRET=<시크릿>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://1.215.38.118
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### `backend/.env` (로컬 개발용)
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=schedule_management
DB_USER=scheduleuser
DB_PASSWORD=<비밀번호>
JWT_SECRET=<시크릿>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 부하 테스트

Artillery 기반 4개 시나리오 (`load-tests/`):
- **시나리오1**: 로그인 부하 (bcrypt CPU, 5→20→50 req/s)
- **시나리오2**: 반복 일정 조회 (generateOccurrences 성능, 5→15→30 req/s)
- **시나리오3**: CRUD 동시 트랜잭션 (생성→조회→수정→삭제 라이프사이클, 3→10→20 req/s)
- **시나리오4**: 알림 폴링 (60 동시 사용자, 60초 간격)

```bash
npx artillery run load-tests/scenario1-login.yml
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
SELECT id, title, status, completed_at, duration_days FROM event_series WHERE creator_id = <userId>;

-- 예외 이벤트 확인
SELECT id, title, status, series_id, is_exception, occurrence_date FROM events WHERE series_id = <seriesId>;

-- 예외 날짜 확인
SELECT * FROM event_exceptions WHERE series_id = <seriesId>;

-- 공유 처/실 확인
SELECT eso.*, o.name FROM event_shared_offices eso JOIN offices o ON eso.office_id = o.id WHERE series_id = <seriesId>;
```

### JWT 토큰 오류
다시 로그인하여 새 토큰 발급. Authorization 헤더 형식: `Bearer <token>`

### Rate Limit 429 에러
`.env`에서 `RATE_LIMIT_MAX_REQUESTS` 값 조정. 현재 설정: 로그인 10/15분, 인증 100/15분, 일정 100/1분.

### 사용자 승인 관련
```sql
-- 승인 대기 사용자 확인
SELECT id, name, email, is_active, approved_at FROM users WHERE is_active = false AND approved_at IS NULL;

-- 수동 승인
UPDATE users SET is_active = true, approved_at = NOW() WHERE id = <userId>;
```

## 해결된 이슈

1. camelCase/snake_case 불일치 → 양방향 지원
2. 반복 일정 "전체 완료" 시 일정 삭제됨 → DELETE를 UPDATE로 변경, event_series에 status/completed_at 컬럼 추가
3. 시리즈 관계 끊어진 일정에 "undefined 반복" 표시 → recurrenceType null 체크 추가
4. "이번만 완료" 후 모달 미갱신 → series-* ID 이벤트 작업 후 모달 닫기 패턴 적용
5. 반복 일정 수정 시 종료 시간 변경됨 → 타임존 변환 문제 해결 (naiveDateTimeString)
6. 중복 클릭으로 다중 요청 → useActionGuard 훅 도입
7. Rate Limit 비활성화 → 재활성화 (로그인/인증/일정 3단계) + 프론트엔드 입력 검증 추가
8. 캘린더 레인 고정 배치로 단일 일정 +n 과다 → 유연 레인 배치 (멀티데이 우선 → 빈 레인에 단일 일정)
9. 댓글 UI 미구현 → CommentSection 인라인 컴포넌트 구현 (조회/작성/수정/삭제 + 알림 + EventList 뱃지)

## 알려진 이슈 및 남은 작업

1. 테스트 코드 작성 (유닛/통합 테스트 미구현)
2. 예외 이벤트에서 "전체 완료" 시 시리즈 미전파 (BUG-003)
3. DEPT_LEAD 스코프별 일정 조회 실제 테스트 필요
