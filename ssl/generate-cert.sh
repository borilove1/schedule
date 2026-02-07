#!/bin/bash
# 자체 서명 SSL 인증서 생성 스크립트
# 서버에서 1회 실행: chmod +x ssl/generate-cert.sh && ./ssl/generate-cert.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout "$SCRIPT_DIR/server.key" \
  -out "$SCRIPT_DIR/server.crt" \
  -subj "/C=KR/ST=Busan/L=Busan/O=Schedule/CN=localhost"

echo "SSL 인증서가 생성되었습니다:"
echo "  인증서: $SCRIPT_DIR/server.crt"
echo "  개인키: $SCRIPT_DIR/server.key"
echo "  유효기간: 365일"
