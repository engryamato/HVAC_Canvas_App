# SizeWise HVAC Canvas

**Professional HVAC design and estimation desktop application for HVAC estimators, designers, and kitchen ventilation specialists.**

[![CI Pipeline](https://github.com/engryamato/HVAC_Canvas_App/actions/workflows/ci.yml/badge.svg)](https://github.com/engryamato/HVAC_Canvas_App/actions/workflows/ci.yml)
[![CodeQL](https://github.com/engryamato/HVAC_Canvas_App/actions/workflows/codeql.yml/badge.svg)](https://github.com/engryamato/HVAC_Canvas_App/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/engryamato/HVAC_Canvas_App/releases)

## Overview

SizeWise HVAC Canvas is a **modern, local-first desktop application** that empowers HVAC professionals to design, size, and estimate ventilation systems with precision and speed. Built for the real-world needs of commercial kitchen ventilation specialists, HVAC estimators, and mechanical designers, it combines intuitive visual design with powerful engineering calculations—all without requiring an internet connection or cloud subscription.

### Who Is This For?

- **HVAC Estimators** — Quickly lay out ductwork, calculate airflow requirements, and generate accurate Bills of Materials for bids
- **Kitchen Ventilation Specialists** — Design exhaust hood systems with proper CFM calculations for commercial kitchens
- **Mechanical Designers** — Create professional HVAC layouts with real-time engineering feedback
- **Small to Mid-Size Contractors** — Get enterprise-level design capabilities without enterprise pricing

### Why SizeWise HVAC Canvas?

| Traditional Tools | SizeWise HVAC Canvas |
|-------------------|----------------------|
| Expensive CAD subscriptions | **Free and open source** (MIT License) |
| Cloud-dependent, requires internet | **Local-first** — your data stays on your machine |
| Steep learning curve | **Intuitive canvas interface** — draw rooms in seconds |
| Manual calculations in spreadsheets | **Automatic HVAC calculations** — CFM, ACH, and more |
| Web apps with performance issues | **Native desktop performance** — 60fps canvas rendering |

### Key Value Proposition

> **Design faster. Calculate automatically. Own your data.**

SizeWise HVAC Canvas bridges the gap between complex CAD software and simple diagramming tools, delivering a purpose-built solution for HVAC layout and estimation. The application runs entirely on your local machine, ensuring your project files and client data never leave your control—critical for contractors handling sensitive commercial projects.

## ✨ Features

### 🎨 Visual Canvas Design
Draw rooms, ductwork, and equipment on an **infinite canvas** with intuitive drag-and-drop tools. See your HVAC layout come to life in real-time with 60fps rendering performance.

### 📐 Automatic HVAC Calculations
Let the app do the math. As you design, the **calculation engine** automatically computes:
- **CFM (Cubic Feet per Minute)** — Airflow requirements based on room dimensions
- **ACH (Air Changes per Hour)** — Ventilation rates for code compliance
- **Duct sizing** — Proper dimensions for your specified airflow

### 📦 Bill of Materials Generation
Generate accurate **Bills of Materials** directly from your design. Export equipment lists, ductwork quantities, and material specifications for bidding and procurement.

### 🔒 Local-First Architecture
Your data **never leaves your machine**. All project files are stored locally in a validated `.sws` format—no cloud accounts, no subscriptions, no internet required.

### 💻 Native Cross-Platform Desktop
Built with **Tauri** for true native performance on:
- ✅ Windows 10/11
- ✅ macOS (Intel & Apple Silicon)
- ✅ Linux (Ubuntu, Fedora, Arch)

### ↩️ Robust Undo/Redo
Made a mistake? No problem. The **command-based history system** supports up to 100 undo steps, so you can experiment freely without fear of losing work.

### 🗂️ Project File Management
Save your entire project as a single `.sws` file with **automatic validation**. The app creates backups automatically, ensuring your work is always protected.

### 📚 Equipment Library
Access a built-in library of **HVAC equipment types** including exhaust hoods, fans, and ductwork components—complete with default specifications you can customize.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Installation |
|-------------|---------|--------------|
| **Node.js** | 18.0.0+ | [nodejs.org](https://nodejs.org/) |
| **Rust** | 1.70.0+ | [rustup.rs](https://rustup.rs/) |
| **npm** | 9.0.0+ | Included with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### Installation

```bash
# Clone the repository
git clone https://github.com/engryamato/HVAC_Canvas_App.git
cd HVAC_Canvas_App/hvac-design-app

# Install dependencies
npm install
```

### Development

```bash
# Start the web development server
npm run dev
# Open http://localhost:3000 in your browser

# Or run the full desktop app in dev mode
npm run tauri:dev
```

### Build for Production

```bash
# Build the desktop application
npm run tauri:build
# Output: src-tauri/target/release/
```

> 📖 **Need more details?** See the full [Quick Start Guide](docs/QUICK_START.md) for step-by-step instructions, debugging tips, and your first 15 minutes with the app.

## 🛠️ Tech Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **[Next.js](https://nextjs.org/)** | 15.0 | React framework with SSR, routing, and optimizations |
| **[React](https://react.dev/)** | 18.2 | UI component library |
| **[Tauri](https://tauri.app/)** | 1.x | Native desktop wrapper (Rust-based, lightweight) |
| **[Rust](https://www.rust-lang.org/)** | 2021 Edition | Backend runtime for native file system access |
| **[TypeScript](https://www.typescriptlang.org/)** | 5.3 | Type-safe JavaScript |

### State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| **[Zustand](https://zustand-demo.pmnd.rs/)** | 4.4 | Lightweight, performant state management |
| **[Immer](https://immerjs.github.io/immer/)** | 11.0 | Immutable state updates with mutable syntax |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **[Material UI](https://mui.com/)** | 5.15 | React component library |
| **[Emotion](https://emotion.sh/)** | 11.11 | CSS-in-JS styling solution |

### Data Validation & Utilities

| Technology | Version | Purpose |
|------------|---------|---------|
| **[Zod](https://zod.dev/)** | 4.2 | Schema validation for project files |
| **[nanoid](https://github.com/ai/nanoid)** | 5.1 | Unique ID generation |

### Testing

| Technology | Version | Purpose |
|------------|---------|---------|
| **[Vitest](https://vitest.dev/)** | 1.6 | Unit and integration testing |
| **[Testing Library](https://testing-library.com/)** | 16.3 | React component testing utilities |
| **[Playwright](https://playwright.dev/)** | 1.40 | End-to-end browser testing |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **[ESLint](https://eslint.org/)** | 8.56 | Code linting |
| **[Prettier](https://prettier.io/)** | 3.1 | Code formatting |
| **[Husky](https://typicode.github.io/husky/)** | 9.1 | Git hooks for pre-commit checks |

## 📖 Documentation

### Getting Started

| Document | Description |
|----------|-------------|
| **[Quick Start Guide](docs/QUICK_START.md)** | Get up and running in 15 minutes |
| **[Architecture Overview](docs/ARCHITECTURE.md)** | Understand the system design and data flow |
| **[User Journeys](docs/UserJourney.md)** | See the app from a user's perspective |

### For Contributors

| Document | Description |
|----------|-------------|
| **[Contributing Guide](CONTRIBUTING.md)** | How to contribute code, report bugs, and suggest features |
| **[Testing Guide](docs/TESTING.md)** | Comprehensive testing strategies and examples |
| **[CI/CD Pipeline](docs/CI_CD.md)** | Automated testing, builds, and deployments |
| **[Release Process](docs/RELEASE_PROCESS.md)** | How releases are versioned and published |

### Reference

| Document | Description |
|----------|-------------|
| **[Full Documentation Hub](docs/README.md)** | Central index of all documentation |
| **[Product Requirements (PRD)](docs/PRD.md)** | Detailed product vision and requirements |
| **[HVAC Glossary](docs/GLOSSARY.md)** | HVAC and technical terminology reference |
| **[Changelog](CHANGELOG.md)** | Version history and release notes |
| **[Security Policy](SECURITY.md)** | Vulnerability reporting and security practices |

