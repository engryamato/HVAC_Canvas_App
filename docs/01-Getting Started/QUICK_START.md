# Quick Start Guide

## Overview

This guide will get you up and running with the SizeWise HVAC Canvas App in 15 minutes. Follow these steps to set up your development environment, understand the project structure, and make your first contribution.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher ([download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** for version control
- **Rust** 1.70+ (for Tauri desktop builds - [install](https://rustup.rs/))
- Code editor (VS Code recommended)

## 📦 Installation (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/hvac-canvas-app.git
cd hvac-canvas-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

This installs:
- Next.js 14 framework
- React 18 with TypeScript
- Zustand state management
- Zod validation
- Tauri desktop runtime
- Vitest testing framework

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` if needed (most defaults work for development).

### 4. Verify Installation

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the dashboard page with "No active projects yet".

## 🎯 Your First 15 Minutes

### Minute 1-3: Create Your First Project

1. Click **"New Project"** button
2. Fill in project details:
   - Name: "My First HVAC Design"
   - Client: "Test Client"
   - Location: "123 Main St"
3. Click **"Create"**

You're now in the canvas editor!

### Minute 4-7: Draw Your First Room

1. Press **`R`** key (or click Room tool in toolbar)
2. Click on canvas to set first corner
3. Drag to set size (e.g., 20ft × 15ft)
4. Release to create room

The room appears with:
- Blue outline
- Centered name "Room 1"
- Dimensions label

### Minute 8-10: Inspect Room Properties

1. Press **`V`** key (Select tool) or click Select icon
2. Click on your room to select it
3. Look at **Right Sidebar** (Inspector Panel)

You'll see editable properties:
- Name
- Dimensions (width, height, ceiling height)
- Occupancy type (office, retail, etc.)
- Required ACH (air changes per hour)
- Calculated CFM (cubic feet per minute)

### Minute 11-13: Add a Duct

1. Press **`D`** key (Duct tool)
2. Click inside room to start duct
3. Drag to create duct length
4. Release to finish

The duct shows:
- Gray rounded rectangle (for round duct)
- Diameter label
- Airflow direction arrow
- CFM value

### Minute 14-15: Test Undo/Redo

1. Press **`Ctrl/Cmd + Z`** to undo duct creation
2. Press **`Ctrl/Cmd + Shift + Z`** to redo

Notice the undo history maintains up to 100 steps.

---

## 🗂️ Project Structure (What Goes Where)

```
hvac-canvas-app/
├── app/                          # Next.js 14 app directory
│   ├── (main)/dashboard/         # Dashboard page
│   └── (main)/canvas/[id]/       # Canvas editor (dynamic route)
│
├── src/
│   ├── core/                     # Shared infrastructure
│   │   ├── schema/               # Zod schemas (validation)
│   │   ├── store/                # Zustand stores (state)
│   │   ├── persistence/          # File I/O, serialization
│   │   └── commands/             # Command pattern (undo/redo)
│   │
│   ├── features/                 # Feature modules
│   │   ├── canvas/               # Canvas editor feature
│   │   │   ├── components/       # Canvas UI components
│   │   │   ├── tools/            # Drawing tools (Room, Duct, etc.)
│   │   │   ├── renderers/        # Entity renderers
│   │   │   ├── hooks/            # Canvas-specific hooks
│   │   │   └── store/            # Canvas-specific state
│   │   │
│   │   └── dashboard/            # Dashboard feature
│   │
│   └── components/               # Shared UI components
│       └── ui/                   # Generic primitives
│
├── docs/                         # Documentation
│   ├── elements/                 # Element documentation
│   ├── guides/                   # How-to guides
│   └── ARCHITECTURE.md           # System architecture
│
└── tests/                        # Test files
    ├── unit/                     # Unit tests
    ├── integration/              # Integration tests
    └── e2e/                      # Playwright E2E tests
```

## 🎨 Key Concepts (What Makes This App Tick)

### 1. Normalized State (Performance)

All entities stored by ID for O(1) lookups:

```typescript
// entityStore structure
{
  byId: {
    'room-123': { id: 'room-123', type: 'room', props: {...} },
    'duct-456': { id: 'duct-456', type: 'duct', props: {...} }
  },
  allIds: ['room-123', 'duct-456']
}
```

### 2. Tool System (User Interactions)

Each tool handles mouse/keyboard input:

```typescript
class RoomTool extends BaseTool {
  onMouseDown(event) { /* Start drawing */ }
  onMouseMove(event) { /* Show preview */ }
  onMouseUp(event) { /* Create room */ }
}
```

Tools available:
- **SelectTool** - Select and move entities (`V`)
- **RoomTool** - Draw rooms (`R`)
- **DuctTool** - Draw ducts (`D`)
- **EquipmentTool** - Place equipment (`E`)

### 3. Command Pattern (Undo/Redo)

Every state change wrapped in a command:

```typescript
// Instead of direct mutation:
entityStore.addEntity(room);

// Use command:
createEntity(room); // Undo-able
```

### 4. Pure Canvas 2D Rendering

No React rendering for performance:

```typescript
// Renders at 60fps
const render = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  // Render all entities
  entities.forEach(entity => {
    if (entity.type === 'room') renderRoom(entity, ctx);
    if (entity.type === 'duct') renderDuct(entity, ctx);
  });

  ctx.restore();
};
```

## 🔧 Common Development Tasks

### Add a New Entity Type

See [HOW_TO_ADD_ENTITY.md](./guides/HOW_TO_ADD_ENTITY.md) for step-by-step instructions.

### Run Tests

```bash
# Unit tests (Vitest)
npm run test

# Watch mode
npm run test:watch

# E2E tests (Playwright)
npm run test:e2e
```

### Build Desktop App

```bash
# Development build
npm run tauri dev

# Production build
npm run tauri build
```

### Lint and Format

```bash
# ESLint
npm run lint

# Prettier
npm run format

# Fix all
npm run lint:fix && npm run format:write
```

## 🐛 Debugging Tips

### 1. Enable Zustand DevTools

```typescript
// In any store file
import { devtools } from 'zustand/middleware';

export const useEntityStore = create(
  devtools(
    (set) => ({ /* ... */ }),
    { name: 'EntityStore' }
  )
);
```

Then use Redux DevTools extension in browser.

### 2. Canvas Rendering Debug

Add to CanvasContainer.tsx:

```typescript
// Show FPS counter
const fps = useRef(0);
const lastFrameTime = useRef(performance.now());

const render = () => {
  const now = performance.now();
  fps.current = 1000 / (now - lastFrameTime.current);
  lastFrameTime.current = now;

  console.log('FPS:', fps.current.toFixed(1));
  // ... rest of render
};
```

### 3. Entity State Inspector

```typescript
// Add to useEffect in any component
console.log('Entities:', useEntityStore.getState().byId);
console.log('Selection:', useSelectionStore.getState().selectedIds);
```

## 📚 Next Steps

Now that you're set up, dive deeper:

1. **Read Architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **Learn State Management** → [docs/elements/02-stores/](./elements/02-stores/)
3. **Understand Tools** → [docs/elements/04-tools/](./elements/04-tools/)
4. **Study Calculators** → [docs/elements/06-calculators/](./elements/06-calculators/)
5. **Write Tests** → [TESTING.md](./TESTING.md)

## 🎓 Learning Path

### Beginner (Week 1)
- [ ] Complete this Quick Start
- [ ] Create and save a project
- [ ] Draw rooms and ducts
- [ ] Understand project structure
- [ ] Read ARCHITECTURE.md

### Intermediate (Week 2-3)
- [ ] Add a new entity type
- [ ] Write unit tests for a store
- [ ] Implement a custom tool
- [ ] Add a new calculator
- [ ] Contribute to documentation

### Advanced (Month 1+)
- [ ] Optimize canvas rendering
- [ ] Add new export formats
- [ ] Implement advanced HVAC calculations
- [ ] Build desktop installers
- [ ] Lead feature development

## ❓ Common Pitfalls

### ❌ Don't: Mutate store state directly

```typescript
// BAD
useEntityStore.getState().byId['room-123'].props.name = 'New Name';
```

### ✅ Do: Use store actions

```typescript
// GOOD
useEntityStore.getState().updateEntity('room-123', {
  props: { ...room.props, name: 'New Name' }
});
```

---

### ❌ Don't: Select entire store in components

```typescript
// BAD - Re-renders on ANY store change
const allState = useEntityStore();
```

### ✅ Do: Use specific selectors

```typescript
// GOOD - Only re-renders when rooms change
const rooms = useEntitiesByType('room');
```

---

### ❌ Don't: Render entities with React

```typescript
// BAD - Terrible performance
return entities.map(e => <EntityComponent entity={e} />);
```

### ✅ Do: Use Canvas 2D rendering

```typescript
// GOOD - 60fps performance
entities.forEach(e => renderEntity(e, ctx));
```

## 🆘 Getting Help

- **Documentation**: [docs/](./README.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/hvac-canvas-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/hvac-canvas-app/discussions)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)

## 🎉 You're Ready!

You now have:
- ✅ A running development environment
- ✅ Understanding of project structure
- ✅ Hands-on experience with the canvas
- ✅ Knowledge of key concepts
- ✅ Resources for next steps

Start building! 🚀
