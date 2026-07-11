#!/bin/bash
# =============================================================================
# Pi Merchant Framework v2.1.0 — SoloHost 健康检查脚本
# =============================================================================
# 检查所有容器状态和关键服务可用性
# 用法: ./solo-host/healthcheck.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SERVICES=("pi-merchant-db" "pi-merchant-redis" "pi-merchant-app" "pi-merchant-admin" "pi-merchant-worker" "pi-merchant-nginx")
APP_URL="${APP_URL:-http://localhost:3000}"
PASS=0
FAIL=0

echo "=========================================="
echo " Pi Merchant Framework — Health Check"
echo " Version: v2.1.0"
echo "=========================================="
echo ""

# ── 1. Docker Container Status ──────────────────────────────
echo "─── Container Status ───"
for svc in "${SERVICES[@]}"; do
  STATUS=$(docker inspect --format="{{.State.Status}}" "$svc" 2>/dev/null || echo "not_found")
  if [ "$STATUS" = "running" ]; then
    echo -e "  ${GREEN}✓${NC} $svc  running"
    PASS=$((PASS + 1))
  elif [ "$STATUS" = "exited" ] || [ "$STATUS" = "not_found" ]; then
    echo -e "  ${RED}✗${NC} $svc  $STATUS"
    FAIL=$((FAIL + 1))
  else
    echo -e "  ${YELLOW}~${NC} $svc  $STATUS"
    FAIL=$((FAIL + 1))
  fi
done

echo ""

# ── 2. API Health Endpoint ──────────────────────────────────
echo "─── API Health ───"
if command -v curl &>/dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${APP_URL}/api/health" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓${NC} ${APP_URL}/api/health → 200"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} ${APP_URL}/api/health → $HTTP_CODE"
    FAIL=$((FAIL + 1))
  fi
else
  echo -e "  ${YELLOW}~${NC} curl not available, skipping HTTP check"
fi

echo ""

# ── 3. Database Connection ──────────────────────────────────
echo "─── Database ───"
DB_CHECK=$(docker exec pi-merchant-db pg_isready -U pimerchant 2>/dev/null || echo "unreachable")
if echo "$DB_CHECK" | grep -q "accepting connections"; then
  echo -e "  ${GREEN}✓${NC} PostgreSQL accepting connections"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} PostgreSQL: $DB_CHECK"
  FAIL=$((FAIL + 1))
fi

echo ""

# ── 4. Redis ─────────────────────────────────────────────────
echo "─── Redis ───"
REDIS_CHECK=$(docker exec pi-merchant-redis redis-cli ping 2>/dev/null || echo "unreachable")
if echo "$REDIS_CHECK" | grep -q "PONG"; then
  echo -e "  ${GREEN}✓${NC} Redis responding"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} Redis: $REDIS_CHECK"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=========================================="
echo -e " Result: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
