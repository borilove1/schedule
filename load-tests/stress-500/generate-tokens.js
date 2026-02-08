// 100명 유저의 JWT 토큰을 사전 생성하는 스크립트
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'database',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'schedule_management',
  user: process.env.DB_USER || 'scheduleuser',
  password: process.env.DB_PASSWORD || 'schedulepass123',
});

const JWT_SECRET = process.env.JWT_SECRET || '2b74d27ad07faa433aea82e648f136aa986a6d33cab3dd3a2231db48a9e8bb7dc20a5493ca4ed1e7d030c33e2f6a5f59e826882590bc2d53d2ac12741997c26e';

async function main() {
  const { rows } = await pool.query(
    "SELECT id, email FROM users WHERE email LIKE 'loadtest%@test.com' ORDER BY id"
  );

  const csvLines = ['token'];
  for (const user of rows) {
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    csvLines.push(token);
  }

  console.log(csvLines.join('\n'));
  await pool.end();
}

main();
