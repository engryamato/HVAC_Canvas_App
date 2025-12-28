# SizeWise HVAC Canvas Documentation

Welcome to the technical documentation for the SizeWise HVAC Canvas App. This documentation is designed to help developers understand the architecture, data models, and implementation details of the application.

## 🚀 Quick Start

- **[System Architecture](./ARCHITECTURE.md)**: Start here to understand how the app works at a high level.
- **[Element Index](./elements/INDEX.md)**: A complete list of all components, stores, hooks, and utilities.
- **[Contributor Guide](../CONTRIBUTING.md)**: Setup, testing, and contribution standards.
- **[How to Add Entities](./guides/HOW_TO_ADD_ENTITY.md)**: Step-by-step guide for extending the system.
- **[User Journeys](./UserJourney.md)**: Understand the application from a user's perspective.

## 📁 Documentation Structure

- **[`/elements`](./elements/)**: Detailed documentation for every code element.
- **[`/guides`](./guides/)**: "How-to" cookbooks for common development tasks.
- **[`/archive`](./archive/)**: Historical implementation plans.
- **[`/PR_Documentation`](./PR_Documentation/)**: Documentation related to specific pull requests and features.

## 🛠 Tech Stack

- **Core**: Next.js 14 (React 18), TypeScript 5, Tauri 1.x (Desktop Runtime)
- **State**: Zustand (Normalized state management)
- **Validation**: Zod (Runtime schema validation)
- **Rendering**: Pure HTML5 Canvas 2D
- **Testing**: Vitest (Unit/Integration), Playwright (E2E)

## 📐 Development Standards

We follow a **Feature-Slice Architecture**:
1. **Core**: Shared infrastructure (schemas, persistence, math)
2. **Features**: Self-contained modules (canvas, dashboard, export)
3. **Components**: Generic UI primitives

For details on how to document new elements, see the **[Documentation README](./elements/README.md)**.
