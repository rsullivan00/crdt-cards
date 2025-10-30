# CRDT Cards

A real-time multiplayer card game built with CRDTs (Conflict-free Replicated Data Types) using YJS and WebRTC. Players join game rooms via URL, and all game state syncs peer-to-peer without a central server. Up to 4 players per room with persistent identity via localStorage.

Built with React, TypeScript, YJS, and y-webrtc for distributed state management.

## ⚠️ VIBE CODE WARNING

This app is completely coded with AI agents. I'm reviewing changes only as well as I can while playing MTG Arena at the same time.

Do with that information what you will.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5174/your-room-name` in your browser. Enter your name to join. Share the URL with friends to play together - all game state syncs automatically in real-time.
