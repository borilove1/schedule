# 업무일정 관리 시스템 - Backend API

Node.js + Express + PostgreSQL 기반의 REST API 서버입니다.

## 📋 목차

- [기술 스택](#기술-스택)
- [설치 방법](#설치-방법)
- [환경 설정](#환경-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [서버 실행](#서버-실행)
- [API 문서](#api-문서)
- [프로젝트 구조](#프로젝트-구조)

---

## 🛠 기술 스택

- **Runtime:** Node.js (>= 18.0.0)
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 14+
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt
- **Validation:** express-validator
- **Security:** helmet, cors
- **Development:** nodemon

---

## 📦 설치 방법

### 1. 저장소 클론 (또는 파일 다운로드)

```bash
cd backend
```

### 2. 의존성 설치

```bash
npm install
```

---

## ⚙️ 환경 설정

### 1. `.env` 파일 생성

```bash
cp .env.example .env
```

### 2. `.env` 파일 수정

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=schedule_management
DB_USER=postgres
DB_PASSWORD=your_actual_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**⚠️ 중요:** 
- `DB_PASSWORD`를 실제 PostgreSQL 비밀번호로 변경하세요
- `JWT_SECRET`을 강력한 랜덤 문자열로 변경하세요
- 프로덕션 환경에서는 `.env` 파일을 절대 커밋하지 마세요

---

## 💾 데이터베이스 설정

### 1. PostgreSQL 설치

```bash
# macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql-14

# Windows
# https://www.postgresql.org/download/windows/ 에서 다운로드
```

### 2. 데이터베이스 생성

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE schedule_management;

# 종료
\q
```

### 3. 스키마 생성

프로젝트 루트에 있는 `database-schema.sql` 파일을 실행하세요:

```bash
psql -U postgres -d schedule_management -f ../database-schema.sql
```

또는 직접 PostgreSQL에서 실행:

```bash
psql -U postgres -d schedule_management
\i ../database-schema.sql
\q
```

### 4. 데이터베이스 확인

```bash
psql -U postgres -d schedule_management

# 테이블 목록 확인
\dt

# 샘플 데이터 확인
SELECT * FROM users;
SELECT * FROM divisions;
```

---

## 🚀 서버 실행

### 개발 모드 (nodemon - 자동 재시작)

```bash
npm run dev
```

### 프로덕션 모드

```bash
npm start
```

서버가 정상적으로 실행되면 다음과 같은 메시지가 표시됩니다:

```
╔═══════════════════════════════════════════╗
║   업무일정 관리 시스템 API 서버          ║
╠═══════════════════════════════════════════╣
║   Environment: development                ║
║   Port: 3000                              ║
║   URL: http://localhost:3000              ║
╚═══════════════════════════════════════════╝

✓ PostgreSQL 데이터베이스에 연결되었습니다.
```

### Health Check

서버가 정상 작동하는지 확인:

```bash
curl http://localhost:3000/health
```

응답:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-31T10:00:00.000Z"
}
```

---

## 📚 API 문서

자세한 API 문서는 `api-specification.md` 파일을 참조하세요.

### 주요 엔드포인트

#### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

#### 사용자
- `GET /api/users` - 사용자 목록 (ADMIN)
- `GET /api/users/:id` - 사용자 상세
- `PUT /api/users/:id` - 사용자 수정 (ADMIN)
- `DELETE /api/users/:id` - 사용자 삭제 (ADMIN)

#### 조직
- `GET /api/organizations/structure` - 전체 조직 구조
- `GET /api/organizations/divisions` - 본부 목록
- `POST /api/organizations/divisions` - 본부 추가 (ADMIN)
- `GET /api/organizations/offices` - 처/실 목록
- `GET /api/organizations/departments` - 부서 목록

#### 일정
- `GET /api/events` - 일정 목록
- `GET /api/events/:id` - 일정 상세
- `POST /api/events` - 일정 생성
- `PUT /api/events/:id` - 일정 수정
- `DELETE /api/events/:id` - 일정 삭제
- `POST /api/events/:id/complete` - 일정 완료
- `POST /api/events/:id/uncomplete` - 일정 완료 취소
- `GET /api/events/dashboard/stats` - 현황판 데이터

#### 댓글
- `POST /api/comments/events/:eventId` - 댓글 추가
- `PUT /api/comments/:id` - 댓글 수정
- `DELETE /api/comments/:id` - 댓글 삭제

#### 설정
- `GET /api/settings` - 설정 조회 (ADMIN)
- `PUT /api/settings` - 설정 수정 (ADMIN)

---

## 📁 프로젝트 구조

```
backend/
├── config/
│   └── database.js          # PostgreSQL 연결 설정
├── middleware/
│   ├── auth.js              # JWT 인증 미들웨어
│   └── errorHandler.js      # 에러 핸들러
├── routes/
│   ├── auth.js              # 인증 라우터
│   ├── users.js             # 사용자 관리 라우터
│   ├── organizations.js     # 조직 관리 라우터
│   ├── events.js            # 일정 관리 라우터
│   ├── comments.js          # 댓글 라우터
│   └── settings.js          # 시스템 설정 라우터
├── .env.example             # 환경 변수 예시
├── .gitignore               # Git 제외 파일
├── package.json             # 프로젝트 정보 및 의존성
├── server.js                # 메인 서버 파일
└── README.md                # 이 파일
```

---

## 🧪 테스트

### Postman으로 테스트

1. **회원가입**
   ```
   POST http://localhost:3000/api/auth/register
   Content-Type: application/json

   {
     "email": "test@company.com",
     "password": "1234",
     "name": "테스트사원",
     "position": "사원",
     "divisionId": 1,
     "officeId": 1,
     "departmentId": 1
   }
   ```

2. **로그인**
   ```
   POST http://localhost:3000/api/auth/login
   Content-Type: application/json

   {
     "email": "admin@company.com",
     "password": "admin"
   }
   ```

3. **일정 조회** (토큰 필요)
   ```
   GET http://localhost:3000/api/events
   Authorization: Bearer <your_token_here>
   ```

---

## 🔒 보안

### 비밀번호 해싱

- `bcrypt`를 사용하여 비밀번호를 안전하게 해싱합니다
- Salt rounds: 10

### JWT 토큰

- 기본 만료 시간: 7일
- `.env` 파일에서 `JWT_SECRET`을 **반드시** 변경하세요

### CORS

- 프론트엔드 도메인만 허용
- `.env`의 `CORS_ORIGIN` 설정

### SQL Injection 방지

- Parameterized queries 사용
- `pg` 라이브러리의 자동 이스케이프 기능 활용

---

## 🐛 문제 해결

### 데이터베이스 연결 실패

```
✗ PostgreSQL 연결 오류: ...
```

**해결 방법:**
1. PostgreSQL이 실행 중인지 확인
   ```bash
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. `.env` 파일의 DB 설정 확인
3. PostgreSQL 비밀번호 확인

### 포트 이미 사용 중

```
Error: listen EADDRINUSE: address already in use :::3000
```

**해결 방법:**
1. 포트 변경: `.env`의 `PORT` 수정
2. 기존 프로세스 종료:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### JWT 토큰 오류

```
{
  "error": {
    "code": "AUTH_004",
    "message": "토큰이 유효하지 않거나 만료되었습니다."
  }
}
```

**해결 방법:**
1. 다시 로그인하여 새 토큰 발급
2. Authorization 헤더 형식 확인: `Bearer <token>`

---

## 📝 라이선스

MIT

---

## 👥 기여

이슈 및 Pull Request를 환영합니다!

---

## 📞 문의

문제가 있으시면 이슈를 등록해주세요.
