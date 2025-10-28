#!/bin/bash
set -e

# Configuration
IMAGE_NAME="crdt-cards-signaling"
REGISTRY="${ACR_NAME:-crdtcardsregistry}.azurecr.io"
VERSION="${VERSION:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"

echo "=========================================="
echo "Building Docker image for y-webrtc signaling server"
echo "=========================================="
echo "Image: ${FULL_IMAGE}"
echo "Build context: $(pwd)/.."
echo "=========================================="

# Build from project root (need access to package.json)
cd "$(dirname "$0")/.."

# Build the image
docker build \
  -f server/Dockerfile \
  -t "${IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  -t "${FULL_IMAGE}" \
  .

echo "=========================================="
echo "✓ Build complete!"
echo "=========================================="
echo "Local tags:"
echo "  - ${IMAGE_NAME}:${VERSION}"
echo "  - ${IMAGE_NAME}:latest"
echo "Registry tag:"
echo "  - ${FULL_IMAGE}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Test locally: docker run -p 4444:4444 ${IMAGE_NAME}:latest"
echo "  2. Push to registry: ./server/push.sh"
echo "=========================================="
