# Contributing to SizeWise HVAC Canvas App

Thank you for your interest in contributing! This document provides guidelines for setting up your environment and submitting contributions.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.x or higher
- **Package Manager**: pnpm (v8.x recommended)
- **Rust**: Required for Tauri (see [tauri.app](https://tauri.app/v1/guides/getting-started/prerequisites))

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/engryamato/HVAC_Canvas_App.git
   cd hvac-design-app
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

## 📐 Development Workflow

### Branch Naming
Use the following prefixes for your branches:
- `feat/`: New features (e.g., `feat/add-curved-ducts`)
- `fix/`: Bug fixes (e.g., `fix/canvas-zoom-glitch`)
- `docs/`: Documentation updates
- `refactor/`: Code restructuring without behavior change
- `test/`: Adding missing tests

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat: add room tool`
- `fix: correct ventilation calculation formula`
- `docs: update architecture diagram`

## 🧪 Testing

We have a high standard for testing. Please ensure your changes are verified.

### Unit & Integration Tests (Vitest)
Run unit tests for logic, hooks, and stores:
```bash
pnpm test
```

### End-to-End Tests (Playwright)
Run E2E tests for user flows:
```bash
pnpm test:e2e
```

## 📝 Code Standards

- **Formatting**: We use Prettier. Run `pnpm format` before committing.
- **Linting**: We use ESLint. Run `pnpm lint` to check for issues.
- **Documentation**: New components/stores must be documented in `docs/elements/`.

## 📁 Project Structure

See [docs/README.md](docs/README.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a deep dive into the system architecture.
