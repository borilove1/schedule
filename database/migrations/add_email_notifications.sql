-- Migration: 이메일 알림 기능 추가
-- Date: 2026-02-08
-- Description: SMTP 시스템 설정 + 사용자별 이메일 수신 설정 컬럼

-- ========================================
-- 1. SMTP 시스템 설정 추가
-- ========================================
INSERT INTO system_settings (key, value, description) VALUES
    ('email_enabled', 'false', '이메일 알림 활성화 여부'),
    ('smtp_auth_type', '"LOGIN"', 'SMTP 인증 방식 (LOGIN, NONE, API_KEY)'),
    ('smtp_host', '""', 'SMTP 서버 호스트'),
    ('smtp_port', '587', 'SMTP 서버 포트'),
    ('smtp_secure', 'false', 'SSL/TLS 사용 여부 (포트 465인 경우 true)'),
    ('smtp_user', '""', 'SMTP 사용자명'),
    ('smtp_password', '""', 'SMTP 비밀번호'),
    ('smtp_api_key', '""', 'SMTP API 키 (SendGrid/Mailgun)'),
    ('smtp_from_email', '""', '발신 이메일 주소'),
    ('smtp_from_name', '"업무일정 관리 시스템"', '발신자 이름')
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- 2. 사용자 이메일 수신 설정 컬럼 추가
-- ========================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
    "EVENT_REMINDER": true,
    "EVENT_UPDATED": true,
    "EVENT_COMPLETED": true,
    "EVENT_DELETED": true,
    "USER_REGISTERED": true,
    "ACCOUNT_APPROVED": true
}'::jsonb;

COMMENT ON COLUMN users.email_notifications_enabled IS '이메일 알림 마스터 토글';
COMMENT ON COLUMN users.email_preferences IS '알림 타입별 이메일 수신 설정';
