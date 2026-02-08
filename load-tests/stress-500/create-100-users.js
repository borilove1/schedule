// 100명 테스트 유저 생성 스크립트
// Docker backend 컨테이너 내에서 실행
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST || 'database',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'schedule_management',
  user: process.env.DB_USER || 'scheduleuser',
  password: process.env.DB_PASSWORD || 'schedulepass123',
});

const PASSWORD = 'LoadTest1!';
const DIVISION_ID = 1; // 부산울산본부

// 19개 부서에 100명 분산 (부서당 5~6명)
const departments = [
  { id: 1, officeId: 1, divisionId: 1 },
  { id: 2, officeId: 1, divisionId: 1 },
  { id: 3, officeId: 1, divisionId: 1 },
  { id: 4, officeId: 1, divisionId: 1 },
  { id: 5, officeId: 2, divisionId: 1 },
  { id: 6, officeId: 2, divisionId: 1 },
  { id: 7, officeId: 2, divisionId: 1 },
  { id: 8, officeId: 2, divisionId: 1 },
  { id: 9, officeId: 2, divisionId: 1 },
  { id: 10, officeId: 2, divisionId: 1 },
  { id: 11, officeId: 2, divisionId: 1 },
  { id: 12, officeId: 3, divisionId: 1 },
  { id: 13, officeId: 3, divisionId: 1 },
  { id: 14, officeId: 3, divisionId: 1 },
  { id: 15, officeId: 3, divisionId: 1 },
  { id: 16, officeId: 3, divisionId: 1 },
  { id: 17, officeId: 3, divisionId: 1 },
  { id: 18, officeId: 3, divisionId: 1 },
  { id: 19, officeId: 3, divisionId: 1 },
];

const positions = ['사원', '대리', '과장', '차장', '부장'];

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  console.log('bcrypt hash generated');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 기존 부하테스트 유저 정리
    await client.query("DELETE FROM users WHERE email LIKE 'loadtest%@test.com'");
    console.log('Cleaned up existing loadtest users');

    const csvLines = ['email,password'];

    for (let i = 1; i <= 100; i++) {
      const dept = departments[(i - 1) % departments.length];
      const position = positions[(i - 1) % positions.length];
      const email = `loadtest${String(i).padStart(3, '0')}@test.com`;
      const name = `부하테스트${i}`;

      await client.query(
        `INSERT INTO users (email, password_hash, name, position, role, department_id, office_id, division_id, is_active, approved_at)
         VALUES ($1, $2, $3, $4, 'USER', $5, $6, $7, true, NOW())`,
        [email, hash, name, position, dept.id, dept.officeId, dept.divisionId]
      );

      csvLines.push(`${email},${PASSWORD}`);
    }

    await client.query('COMMIT');
    console.log('100 users created successfully');

    // CSV 출력
    console.log('---CSV_START---');
    console.log(csvLines.join('\n'));
    console.log('---CSV_END---');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
