# Y-WebRTC Signaling Server for Azure

This directory contains the Docker configuration and deployment scripts for running the y-webrtc signaling server on Azure Container Apps.

## Overview

The signaling server facilitates WebRTC peer discovery and connection establishment for the CRDT Cards multiplayer game. It acts as a coordination point for players to find each other before establishing direct peer-to-peer connections.

## Prerequisites

- Docker installed locally
- Azure CLI installed (`az`)
- Azure subscription with permissions to create:
  - Resource Groups
  - Azure Container Registry
  - Azure Container Apps

## Environment Variables

All scripts support the following environment variables for customization:

| Variable | Default | Description |
|----------|---------|-------------|
| `ACR_NAME` | `crdtcards` | Azure Container Registry name |
| `VERSION` | `latest` | Image version tag |
| `RESOURCE_GROUP` | `crdt-cards-rg` | Azure resource group name |
| `LOCATION` | `eastus` | Azure region |
| `CONTAINER_APP_NAME` | `crdt-cards-signaling` | Container app name |
| `CONTAINER_APP_ENV` | `crdt-cards-env` | Container Apps environment name |

## Quick Start

### 1. Build the Docker Image

```bash
cd server
./build.sh
```

Or with custom version:
```bash
VERSION=v1.0.0 ./build.sh
```

### 2. Test Locally

```bash
docker run -p 4444:4444 crdt-cards-signaling:latest
```

The server will be available at `ws://localhost:4444`

### 3. Push to Azure Container Registry

First, ensure you're logged into Azure:
```bash
az login
```

Then push the image:
```bash
ACR_NAME=myregistry ./push.sh
```

### 4. Deploy to Azure Container Apps

```bash
ACR_NAME=myregistry RESOURCE_GROUP=my-rg ./deploy.sh
```

The script will:
- Create the resource group if needed
- Create the Container Apps environment if needed
- Deploy or update the container app
- Output the public URL for your signaling server

## Full Deployment Example

```bash
# Set your configuration
export ACR_NAME="mycrdtregistry"
export RESOURCE_GROUP="crdt-cards-production"
export LOCATION="westus2"
export VERSION="v1.0.0"

# Build, push, and deploy
./build.sh
./push.sh
./deploy.sh
```

## Updating Your Frontend

After deployment, update `src/store.ts` to use your new signaling server:

```typescript
const provider = new WebrtcProvider(roomName, doc, {
  signaling: ['wss://your-app-name.azurecontainerapps.io'],
  // ... other options
})
```

## Dockerfile Details

The Dockerfile uses a multi-stage build to:
1. Install dependencies from your project's `package.json` (including y-webrtc)
2. Create a minimal runtime image with only the necessary files
3. Run the y-webrtc signaling server from `node_modules/y-webrtc/bin/server.js`

### Key Features

- **Base Image**: Node.js 20 Alpine (minimal size)
- **Port**: 4444 (configurable via `PORT` environment variable)
- **Health Check**: HTTP endpoint on `/` returns "okay"
- **Auto-scaling**: Configured for 1-3 replicas based on load

## Container App Configuration

The deployment creates a container app with:
- **Ingress**: External (publicly accessible)
- **Target Port**: 4444
- **CPU**: 0.25 cores
- **Memory**: 0.5 GB
- **Replicas**: 1-3 (auto-scales)
- **Protocol**: WebSocket support enabled

## Monitoring and Logs

View real-time logs:
```bash
az containerapp logs show \
  --name crdt-cards-signaling \
  --resource-group crdt-cards-rg \
  --follow
```

View app details:
```bash
az containerapp show \
  --name crdt-cards-signaling \
  --resource-group crdt-cards-rg
```

## Troubleshooting

### Build fails with "COPY package.json: no such file"
The Dockerfile must be built from the project root. The build script handles this automatically, but if building manually:
```bash
cd /path/to/crdt-cards
docker build -f server/Dockerfile -t crdt-cards-signaling .
```

### Push fails with "unauthorized"
Login to your Azure Container Registry:
```bash
az acr login --name your-registry-name
```

### Deployment fails with permission errors
Ensure your Azure account has the required roles:
- Contributor role on the subscription or resource group
- AcrPull role on the Container Registry

### WebSocket connections fail
- Verify the Container App ingress is set to "external"
- Check that the frontend is using `wss://` (not `ws://`)
- Verify firewall/network security groups allow WebSocket traffic

## Cost Optimization

To reduce costs in development:

1. **Scale to zero** when not in use:
```bash
az containerapp update \
  --name crdt-cards-signaling \
  --resource-group crdt-cards-rg \
  --min-replicas 0
```

2. **Use smaller resource allocation**:
```bash
az containerapp update \
  --name crdt-cards-signaling \
  --resource-group crdt-cards-rg \
  --cpu 0.25 \
  --memory 0.5Gi
```

3. **Delete when not needed**:
```bash
az containerapp delete \
  --name crdt-cards-signaling \
  --resource-group crdt-cards-rg
```

## Security Considerations

For production deployments:

1. **Use a custom domain** with SSL/TLS
2. **Implement authentication** at the application level or via Azure Front Door
3. **Enable diagnostic logging** for audit trails
4. **Use managed identities** instead of registry passwords where possible
5. **Implement rate limiting** to prevent abuse

## License

This configuration is part of the CRDT Cards project and uses the y-webrtc signaling server from the y-webrtc npm package.
