const nodemailer = require('nodemailer');
const { query } = require('../../config/database');

// 트랜스포터 캐시 (설정 변경 전까지 재사용)
let cachedTransporter = null;
let cachedConfigHash = null;

/**
 * system_settings에서 SMTP 설정 로드
 */
async function loadSmtpConfig() {
  const result = await query(
    "SELECT key, value FROM system_settings WHERE key LIKE 'smtp_%' OR key = 'email_enabled'"
  );
  const config = {};
  result.rows.forEach(row => {
    config[row.key] = row.value;
  });
  return config;
}

/**
 * 인증 방식별 nodemailer transporter 생성
 * LOGIN: 사용자명/비밀번호
 * NONE: 인증 없음 (내부 릴레이)
 * API_KEY: SendGrid/Mailgun 방식 (user='apikey')
 */
function createTransporter(config) {
  const transportOptions = {
    host: config.smtp_host,
    port: parseInt(config.smtp_port) || 587,
    secure: config.smtp_secure === true || config.smtp_secure === 'true',
  };

  const authType = config.smtp_auth_type;

  if (authType === 'LOGIN') {
    transportOptions.auth = {
      user: config.smtp_user,
      pass: config.smtp_password,
    };
  } else if (authType === 'API_KEY') {
    transportOptions.auth = {
      user: 'apikey',
      pass: config.smtp_api_key,
    };
  }
  // NONE: auth 미설정

  return nodemailer.createTransport(transportOptions);
}

/**
 * 캐시된 transporter 반환 (설정 변경 시 자동 재생성)
 */
async function getTransporter() {
  const config = await loadSmtpConfig();
  const configHash = JSON.stringify(config);

  if (cachedTransporter && cachedConfigHash === configHash) {
    return { transporter: cachedTransporter, config };
  }

  cachedTransporter = createTransporter(config);
  cachedConfigHash = configHash;
  return { transporter: cachedTransporter, config };
}

/**
 * 설정 변경 시 캐시 무효화
 */
function invalidateTransporterCache() {
  cachedTransporter = null;
  cachedConfigHash = null;
}

/**
 * 알림 이메일 HTML 템플릿
 */
function generateEmailHtml(title, message) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f1f5f9;">
  <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
    <div style="border-bottom: 2px solid #3B82F6; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #1e293b; margin: 0; font-size: 18px;">${title}</h2>
    </div>
    <p style="color: #475569; font-size: 14px; line-height: 1.8; margin: 0; white-space: pre-line;">${message}</p>
  </div>
  <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">
    업무일정 관리 시스템에서 발송된 알림입니다.
  </p>
</body>
</html>`;
}

/**
 * 이메일 발송
 * @returns {{ success: boolean, messageId?: string, error?: string }}
 */
async function sendEmail(toEmail, title, message) {
  try {
    const { transporter, config } = await getTransporter();

    if (!config.email_enabled || config.email_enabled === 'false') {
      return { success: false, error: 'Email notifications disabled' };
    }

    const fromEmail = config.smtp_from_email;
    if (!fromEmail) {
      return { success: false, error: 'From email not configured' };
    }

    const fromName = config.smtp_from_name || '업무일정 관리 시스템';

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: title,
      html: generateEmailHtml(title, message),
    });

    console.log(`[Email] Sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Failed to send to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * SMTP 연결 테스트
 * @param {object|null} testConfig - 저장 전 테스트용 설정 (null이면 DB에서 로드)
 */
async function testConnection(testConfig = null) {
  try {
    let transporter;
    if (testConfig) {
      transporter = createTransporter(testConfig);
    } else {
      const result = await getTransporter();
      transporter = result.transporter;
    }

    await transporter.verify();
    return { success: true, message: 'SMTP 연결 성공' };
  } catch (error) {
    return { success: false, message: `SMTP 연결 실패: ${error.message}` };
  }
}

module.exports = {
  sendEmail,
  testConnection,
  loadSmtpConfig,
  invalidateTransporterCache,
};
