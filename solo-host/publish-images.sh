#!/bin/bash
# =============================================================================
# Pi Merchant Framework 鈥?Docker Image Publishing Script
# Builds and pushes app images to GitHub Container Registry.
# Run this before first SoloHost deployment, and after any app code change.
#
# Prerequisites:
#   1. GitHub Personal Access Token with "write:packages" scope
#   2. Login: docker login ghcr.io -u YOUR_USERNAME --password-stdin
#   3. GHCR packages must be set to "Public" in GitHub package settings.
#
# Usage:
#   bash solo-host/publish-images.sh
# =============================================================================

set -euo pipefail

REGISTRY="ghcr.io/chunmeiyunqi-stack"
TIMESTAMP=$(date +%Y%m%d-%H%M)

echo "=========================================="
echo " Pi Merchant Framework 鈥?Publish Images"
echo " Registry: $REGISTRY"
echo "=========================================="
echo ""

# Check login
docker pull "$REGISTRY/pi-merchant-framework:latest" 2>/dev/null && echo "  鈫?Registry reachable" || {
  echo "  鈿狅笍  Cannot reach GHCR. Run: echo \$GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
}
echo ""

# 鈹€鈹€ 1. Build main app image 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
echo "---[1/4] Building pi-merchant-framework:latest ---"
docker build \
  --platform linux/amd64 \
  -t "$REGISTRY/pi-merchant-framework:latest" \
  -t "$REGISTRY/pi-merchant-framework:${TIMESTAMP}" \
  -f Dockerfile \
  .
echo ""

# 鈹€鈹€ 2. Push main app image 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
echo "---[2/4] Pushing pi-merchant-framework:latest ---"
docker push "$REGISTRY/pi-merchant-framework:latest"
docker push "$REGISTRY/pi-merchant-framework:${TIMESTAMP}"
echo ""

# 鈹€鈹€ 3. Build admin image 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
echo "---[3/4] Building pi-merchant-framework-admin:latest ---"
docker build \
  --platform linux/amd64 \
  -t "$REGISTRY/pi-merchant-framework-admin:latest" \
  -t "$REGISTRY/pi-merchant-framework-admin:${TIMESTAMP}" \
  -f Dockerfile.admin \
  .
echo ""

# 鈹€鈹€ 4. Push admin image 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
echo "---[4/4] Pushing pi-merchant-framework-admin:latest ---"
docker push "$REGISTRY/pi-merchant-framework-admin:latest"
docker push "$REGISTRY/pi-merchant-framework-admin:${TIMESTAMP}"
echo ""

# 鈹€鈹€ Verification 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
echo "=========================================="
echo " 鉁?Publish complete"
echo " Images:"
echo "   $REGISTRY/pi-merchant-framework:latest"
echo "   $REGISTRY/pi-merchant-framework:${TIMESTAMP}"
echo "   $REGISTRY/pi-merchant-framework-admin:latest"
echo "   $REGISTRY/pi-merchant-framework-admin:${TIMESTAMP}"
echo ""
echo " Verify with:"
echo "   docker pull $REGISTRY/pi-merchant-framework:latest"
echo "   docker pull $REGISTRY/pi-merchant-framework-admin:latest"
echo "=========================================="
