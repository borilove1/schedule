// routes/events.js - 반복 일정 지원 버전
const express = require('express');
const { authenticate } = require('../middleware/auth');
const eventController = require('../src/controllers/eventController');

const router = express.Router();
router.use(authenticate);

// ========== 일정 목록 조회 (반복 일정 자동 확장) ==========
router.get('/', eventController.getEvents);

// ========== 일정 상세 조회 ==========
router.get('/:id', eventController.getEventById);

// ========== 일정 생성 (일반 또는 반복) ==========
router.post('/', eventController.createEvent);

// ========== 일정 수정 (반복 일정 처리) ==========
router.put('/:id', eventController.updateEvent);

// ========== 일정 삭제 (반복 일정 처리) ==========
router.delete('/:id', eventController.deleteEvent);

// ========== 일정 완료 처리 ==========
router.post('/:id/complete', eventController.completeEvent);

// ========== 일정 완료 취소 ==========
router.post('/:id/uncomplete', eventController.uncompleteEvent);

module.exports = router;
