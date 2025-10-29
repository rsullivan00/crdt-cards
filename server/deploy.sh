#!/bin/bash
set -e

# Configuration
IMAGE_NAME="crdt-cards-signaling"
REGISTRY="${ACR_NAME:-crdtcardsregistry}.azurecr.io"
VERSION="${VERSION:-latest}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"
RESOURCE_GROUP="${RESOURCE_GROUP:-crdt-cards}"
LOCATION="${LOCATION:-westus2}"
CONTAINER_APP_NAME="${CONTAINER_APP_NAME:-crdt-cards-signaling}"
CONTAINER_APP_ENV="${CONTAINER_APP_ENV:-crdt-cards-env}"

echo "=========================================="
echo "Deploying to Azure Container Apps"
echo "=========================================="
echo "Resource Group: ${RESOURCE_GROUP}"
echo "Location: ${LOCATION}"
echo "Container App: ${CONTAINER_APP_NAME}"
echo "Environment: ${CONTAINER_APP_ENV}"
echo "Image: ${FULL_IMAGE}"
echo "=========================================="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI (az) is not installed."
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
echo "Checking Azure login status..."
az account show > /dev/null 2>&1 || {
    echo "Not logged in to Azure. Please run: az login"
    exit 1
}

# Create resource group if it doesn't exist
echo "Ensuring resource group exists..."
az group create \
    --name "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --output none

# Create Container Apps environment if it doesn't exist
echo "Ensuring Container Apps environment exists..."
if ! az containerapp env show \
    --name "${CONTAINER_APP_ENV}" \
    --resource-group "${RESOURCE_GROUP}" \
    --output none 2>/dev/null; then
    echo "Creating Container Apps environment..."
    az containerapp env create \
        --name "${CONTAINER_APP_ENV}" \
        --resource-group "${RESOURCE_GROUP}" \
        --location "${LOCATION}" \
        --output none
fi

# Check if container app exists by trying to get its properties
echo "Checking if container app exists..."
EXISTING_APP=$(az containerapp show \
    --name "${CONTAINER_APP_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query name \
    --output tsv 2>/dev/null || echo "")

if [ -n "${EXISTING_APP}" ]; then
    echo "Container app exists, configuring authentication before update..."

    # Ensure system-assigned identity is enabled
    echo "Enabling managed identity..."
    az containerapp identity assign \
        --name "${CONTAINER_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --system-assigned \
        --output none 2>/dev/null || true

    # Get the managed identity principal ID
    echo "Retrieving managed identity..."
    PRINCIPAL_ID=$(az containerapp identity show \
        --name "${CONTAINER_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query principalId \
        --output tsv 2>/dev/null || echo "")

    if [ -z "${PRINCIPAL_ID}" ]; then
        echo "Error: Failed to retrieve managed identity principal ID"
        echo "The container app may not have a managed identity enabled yet."
        exit 1
    fi

    # Get ACR resource ID
    echo "Retrieving ACR resource ID..."
    ACR_ID=$(az acr show \
        --name "${ACR_NAME:-crdtcardsregistry}" \
        --query id \
        --output tsv)

    if [ -z "${ACR_ID}" ]; then
        echo "Error: Failed to retrieve ACR resource ID"
        exit 1
    fi

    # Assign AcrPull role to the managed identity
    echo "Assigning AcrPull role to managed identity..."
    az role assignment create \
        --assignee "${PRINCIPAL_ID}" \
        --role "AcrPull" \
        --scope "${ACR_ID}" \
        --output none 2>/dev/null || echo "  (Role assignment may already exist)"

    # Configure the container app to use ACR with managed identity
    echo "Configuring ACR authentication..."
    az containerapp registry set \
        --name "${CONTAINER_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --server "${REGISTRY}" \
        --identity system \
        --output none

    # Wait a moment for permissions to propagate
    echo "Waiting for permissions to propagate..."
    sleep 10

    # Now update the image
    echo "Updating container app image..."
    az containerapp update \
        --name "${CONTAINER_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --image "${FULL_IMAGE}" \
        --output none

else
    echo "Creating new container app..."

    # Get ACR resource ID first
    echo "Retrieving ACR resource ID..."
    ACR_ID=$(az acr show \
        --name "${ACR_NAME:-crdtcardsregistry}" \
        --query id \
        --output tsv)

    if [ -z "${ACR_ID}" ]; then
        echo "Error: Failed to retrieve ACR resource ID"
        exit 1
    fi

    # Create container app with system-assigned identity and registry authentication
    az containerapp create \
        --name "${CONTAINER_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --environment "${CONTAINER_APP_ENV}" \
        --image "${FULL_IMAGE}" \
        --target-port 4444 \
        --ingress external \
        --min-replicas 1 \
        --max-replicas 3 \
        --cpu 0.25 \
        --memory 0.5Gi \
        --env-vars PORT=4444 \
        --system-assigned \
        --registry-server "${REGISTRY}" \
        --registry-identity system \
        --output none

    # Get the managed identity principal ID
    echo "Retrieving managed identity..."
    PRINCIPAL_ID=$(az containerapp identity show \
        --name "${CONTAINER_APP_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query principalId \
        --output tsv)

    if [ -z "${PRINCIPAL_ID}" ]; then
        echo "Error: Failed to retrieve managed identity principal ID"
        exit 1
    fi

    # Assign AcrPull role to the managed identity
    echo "Assigning AcrPull role to managed identity..."
    az role assignment create \
        --assignee "${PRINCIPAL_ID}" \
        --role "AcrPull" \
        --scope "${ACR_ID}" \
        --output none 2>/dev/null || echo "  (Role assignment may already exist)"
fi

# Get the FQDN
echo "=========================================="
echo "✓ Deployment complete!"
echo "=========================================="
FQDN=$(az containerapp show \
    --name "${CONTAINER_APP_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --query properties.configuration.ingress.fqdn \
    --output tsv)

echo "Signaling server URL: https://${FQDN}"
echo "=========================================="
echo ""
echo "To view logs:"
echo "  az containerapp logs show \\"
echo "    --name ${CONTAINER_APP_NAME} \\"
echo "    --resource-group ${RESOURCE_GROUP} \\"
echo "    --follow"
echo ""
echo "To update your frontend code:"
echo "  Replace signaling servers in src/store.ts with:"
echo "  wss://${FQDN}"
echo "=========================================="
