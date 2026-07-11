#!/bin/bash
# =============================================================================
# Pi Merchant Framework 鈥?Docker Image Verification Script
# Checks whether the required GHCR images are publicly pullable.
# Run after publishing to confirm SoloHost can pull them.
#
# Usage:
#   bash solo-host/verify-images.sh
# =============================================================================

set -euo pipefail

IMAGES=(
  "ghcr.io/chunmeiyunqi-stack/pi-merchant-framework:latest"
  "ghcr.io/chunmeiyunqi-stack/pi-merchant-framework-admin:latest"
)
PASS=0
FAIL=0

echo "=========================================="
echo " Pi Merchant Framework 鈥?Image Verify"
echo "=========================================="
echo ""

for img in "${IMAGES[@]}"; do
  echo -n "Checking $img ... "
  if docker pull "$img" 2>/dev/null; then
    echo "  鉁?PULLABLE"
    PASS=$((PASS + 1))
  else
    echo "  鉂?DENIED or NOT FOUND"
    FAIL=$((FAIL + 1))
  fi
  echo ""
done

echo "=========================================="
echo " Results: $PASS pullable, $FAIL failed"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo " Possible causes:"
  echo "   1. Packages are PRIVATE on GHCR 鈫?set to Public"
  echo "      https://github.com/orgs/chunmeiyunqi-stack/packages"
  echo "   2. Images not pushed yet 鈫?run: bash solo-host/publish-images.sh"
  echo "   3. Not logged in 鈫?run: docker login ghcr.io"
  echo ""
  exit 1
fi

echo " 鉁?All images are publicly pullable 鈥?SoloHost ready."
echo "=========================================="
