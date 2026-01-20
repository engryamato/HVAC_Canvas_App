# Pilot Task: E2E Test Analysis

## Overview
Analyze the current state of E2E tests in the HVAC Canvas App to identify flaky tests, coverage gaps, and execution reliability issues. This is a pilot task to validate the Antigravity Kit workflow.

## Project Type
**WEB** (Next.js / Playwright)

## Success Criteria
- [ ] Complete inventory of all E2E test files
- [ ] Identification of at least 3 duplicate or flaky test patterns
- [ ] detailed report on test health
- [ ] Recommendations for stability improvements

## Tech Stack
- **Framework**: Playwright
- **Language**: TypeScript
- **Runner**: Node.js

## Task Breakdown

### 1. Discovery & Mapping
- **Agent**: `explorer-agent`
- **Input**: `e2e/` directory
- **Output**: List of test suites and their current status (based on recent runs if available, or static analysis)
- **Verify**: Map of `spec.ts` files matches file system

### 2. Log Analysis
- **Agent**: `test-engineer`
- **Input**: Recent test run logs (or run a fresh pass if needed)
- **Output**: List of failed/flaky tests with error signatures
- **Verify**: Identified errors correlate with code locations

### 3. Synthesis
- **Agent**: `orchestrator`
- **Input**: Findings from Discovery and Log Analysis
- **Output**: Final `E2E_HEALTH_REPORT.md`
- **Verify**: Report contains actionable items

## ✅ PHASE X COMPLETE
- [ ] Lint: N/A (Analysis only)
- [ ] Security: N/A
- [ ] Build: N/A
- [ ] Date: TBD
