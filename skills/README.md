# Skills Library

This folder contains workflow skills for reproducible local setup, testing, orchestration, and CI readiness.

## How to Use

1. Load `skills/index.json`.
2. Select skill(s) by trigger and phase.
3. Execute skill steps exactly.
4. Record each checkpoint in `skills/usage_log.md`.
5. If no skill matches, create a new file in `skills/skills/` and register it in `skills/index.json`.

## Required Conventions

- Keep all skill files inside `skills/skills/`.
- Do not store app source code in this folder.
- Keep commands copy/paste ready and deterministic.
- Keep secrets out of logs and examples.
