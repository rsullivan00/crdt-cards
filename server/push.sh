#!/bin/bash
set -e

# Configuration
IMAGE_NAME="crdt-cards-signaling"
REGISTRY="${ACR_NAME:-crdtcardsregistry}.azurecr.io"
VERSION="${VERSION:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"

echo "=========================================="
echo "Pushing Docker image to Azure Container Registry"
echo "=========================================="
echo "Image: ${FULL_IMAGE}"
echo "Registry: ${REGISTRY}"
echo "=========================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI (az) is not installed."
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure Container Registry
echo "Logging in to Azure Container Registry..."
az acr login --name "${ACR_NAME:-crdtcardsregistry}"

# Push the image
echo "Pushing image..."
docker push "${FULL_IMAGE}"

# Also push latest tag if VERSION is not "latest"
if [ "${VERSION}" != "latest" ]; then
    LATEST_IMAGE="${REGISTRY}/${IMAGE_NAME}:latest"
    echo "Pushing latest tag..."
    docker push "${LATEST_IMAGE}"
fi

echo "=========================================="
echo "✓ Push complete!"
echo "=========================================="
echo "Pushed images:"
echo "  - ${FULL_IMAGE}"
if [ "${VERSION}" != "latest" ]; then
    echo "  - ${REGISTRY}/${IMAGE_NAME}:latest"
fi
echo "=========================================="
echo ""
echo "Next steps:"
echo "  Deploy to Azure: ./server/deploy.sh"
echo "=========================================="
