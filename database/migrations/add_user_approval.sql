-- 사용자 승인 기능 마이그레이션
-- 회원가입 후 관리자 승인이 필요하도록 approved_at 컬럼 추가

-- 1. approved_at 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 2. 기존 사용자 전체를 승인 처리 (기존 사용자는 이미 승인된 것으로 간주)
UPDATE users SET approved_at = created_at WHERE approved_at IS NULL;

-- 3. v_users_with_org 뷰 재생성 (approved_at 포함)
DROP VIEW IF EXISTS v_users_with_org CASCADE;
CREATE VIEW v_users_with_org AS
SELECT
    u.id,
    u.email,
    u.name,
    u.position,
    u.role,
    u.scope,
    d.name AS department_name,
    o.name AS office_name,
    div.name AS division_name,
    u.is_active,
    u.approved_at,
    u.last_login_at,
    u.created_at
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN offices o ON u.office_id = o.id
LEFT JOIN divisions div ON u.division_id = div.id;
