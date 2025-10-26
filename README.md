# CRDT Cards

A collaborative card application built with React, TypeScript, Vite, and YJS for real-time CRDT (Conflict-free Replicated Data Type) management.

## Setup

### Install Dependencies

```bash
cd crdt-cards
npm install
```

**Note:** If you encounter issues with `npm install` in WSL, try running the command directly from within the WSL terminal rather than through VS Code.

### Development

Start the development server:

```bash
npm run dev
```

Then open your browser to the URL shown (typically `http://localhost:5173`)

### Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
crdt-cards/
├── src/
│   ├── main.tsx       # React entry point
│   ├── App.tsx        # Main React component
│   ├── store.ts       # YJS document initialization
│   └── vite-env.d.ts  # Vite type definitions
├── index.html         # HTML entry point
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── vite.config.ts     # Vite configuration
└── .gitignore         # Git ignore rules
```

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **YJS** - CRDT library for collaborative features

## Next Steps

The basic scaffolding is complete! You can now:

1. Add card components and UI
2. Implement CRDT-based card state management
3. Add sync providers (WebSocket, WebRTC, etc.) for real-time collaboration
4. Style the application
5. Add persistence layer

## YJS Integration

The YJS document is initialized in `src/store.ts`. A shared map called `cardsMap` is ready to store card data. You can use YJS types like Y.Map, Y.Array, Y.Text to build collaborative features.
