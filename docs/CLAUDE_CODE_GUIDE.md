# 반복 일정 기능 프로젝트 - Claude Code 가이드

## 📁 프로젝트 구조

```
recurring-events-project/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── eventController.js      # 반복 일정 CRUD + 완료 처리
│   │   └── utils/
│   │       └── recurringEvents.js      # 반복 일정 확장 헬퍼
│   └── routes/
│       └── events.js                   # API 라우터
├── frontend/
│   └── src/
│       ├── components/
│       │   └── events/
│       │       ├── EventModal.jsx      # 일정 생성 모달 (폼 초기화)
│       │       └── EventDetailModal.jsx # 일정 상세 모달 (중복 클릭 방지)
│       └── utils/
│           └── api.js                  # API 클라이언트 (response.event 반환)
├── docs/
│   ├── README.md                       # 프로젝트 개요
│   ├── DEPLOYMENT.md                   # 배포 가이드
│   └── API.md                          # API 문서
└── .claude/
    └── context.md                      # Claude Code 컨텍스트
```

## 🚀 빠른 시작

### 1. 서버에 파일 배포

```bash
# 백엔드
cp backend/src/controllers/eventController.js /var/www/schedule-app/backend/src/controllers/
cp backend/src/utils/recurringEvents.js /var/www/schedule-app/backend/src/utils/
cp backend/routes/events.js /var/www/schedule-app/backend/routes/

# 프론트엔드
cp frontend/src/components/events/EventModal.jsx /var/www/schedule-app/schedule-frontend/src/components/events/
cp frontend/src/components/events/EventDetailModal.jsx /var/www/schedule-app/schedule-frontend/src/components/events/
cp frontend/src/utils/api.js /var/www/schedule-app/schedule-frontend/src/utils/

# 재빌드
cd /var/www/schedule-app

# 프론트엔드 빌드
cd schedule-frontend
npm run build
cd ..
rm -rf frontend/build/*
cp -r schedule-frontend/build/* frontend/build/

# 백엔드 재빌드
docker-compose build --no-cache backend
docker-compose restart backend frontend
```

### 2. 로컬 개발 환경

```bash
# 백엔드 (로컬)
cd backend
npm install
npm run dev

# 프론트엔드 (로컬)
cd frontend
npm install
npm start
```

## 📝 완료된 작업

### ✅ 백엔드
- [x] recurringEvents.js - 반복 일정 확장 헬퍼
- [x] eventController.js - 반복 일정 CRUD (camelCase & snake_case 지원)
- [x] completeEvent() - 반복 일정 완료 처리 (예외 이벤트 생성)
- [x] uncompleteEvent() - 완료 취소
- [x] getEventById() - 완료 상태 체크 포함
- [x] routes/events.js - 라우터 연결

### ✅ 프론트엔드
- [x] EventModal.jsx - 폼 초기화 (useEffect)
- [x] EventDetailModal.jsx - 중복 클릭 방지 (actionInProgress)
- [x] api.js - response.event 반환 수정

### ✅ DB 스키마
- [x] event_series 테이블
- [x] event_exceptions 테이블
- [x] events 테이블 (series_id, occurrence_date 추가)

## 🐛 해결된 문제

1. ✅ camelCase vs snake_case 불일치 → 양쪽 모두 지원
2. ✅ 반복 일정 완료 처리 불가 → 예외 이벤트 생성 방식 구현
3. ✅ 일정 상세 모달 데이터 안 보임 → api.js response.event 반환
4. ✅ 완료 버튼 중복 클릭 → actionInProgress 상태 추가
5. ✅ Rate Limit 429 에러 → Debounce 처리

## 📋 남은 작업

### 🚧 프론트엔드
- [ ] getEvents()에서 완료된 예외 이벤트 상태 반영
- [ ] 반복 일정 수정 UI (이번만/전체 선택 모달)
- [ ] 반복 일정 삭제 UI (이번만/전체 선택 모달)
- [ ] 반복 일정 생성 UI 개선 (반복 설정 폼)

### 🚧 백엔드
- [ ] getEvents()에서 완료된 예외 이벤트 포함
- [ ] 알림 기능 추가
- [ ] Rate Limit 설정 조정

### 🚧 기타
- [ ] v4 디자인 적용
- [ ] 테스트 코드 작성
- [ ] 문서화 완료

## 🔧 트러블슈팅

### 문제: 일정 상세가 안 보여요
```bash
# 1. API 응답 확인
curl -X GET "http://localhost:3001/api/v1/events/ID" -H "Authorization: Bearer $TOKEN" | jq '.'

# 2. 프론트엔드 재빌드
cd /var/www/schedule-app/schedule-frontend
npm run build

# 3. 브라우저 캐시 클리어 (Ctrl+Shift+R)
```

### 문제: 완료 처리가 안 돼요
```bash
# 1. 백엔드 로그 확인
docker-compose logs backend --tail=50

# 2. DB 확인
docker-compose exec database psql -U scheduleuser -d schedule_management -c "SELECT * FROM events WHERE series_id = 1 LIMIT 5;"

# 3. 백엔드 재시작
docker-compose restart backend
```

### 문제: Rate Limit 에러 (429)
```bash
# 1분 대기 후 재시도
sleep 60

# 또는 Rate Limit 설정 수정
# backend/middleware/rateLimiter.js
```

## 📞 다음 단계

1. **getEvents() 완료 상태 반영** - 가장 중요!
2. 반복 일정 수정/삭제 UI
3. v4 디자인 적용
4. 알림 기능 추가

## 🔗 참고 링크

- API 문서: `docs/API.md`
- 배포 가이드: `docs/DEPLOYMENT.md`
- DB 스키마: `docs/DATABASE.md`
