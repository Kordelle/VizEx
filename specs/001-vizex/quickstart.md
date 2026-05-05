# VizEx — Quickstart Guide

**Feature**: `001-vizex`
**Date**: 2026-04-30

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

---

## Setup

```powershell
cd src
npm install
```

---

## Run (Development)

```powershell
npm run dev
```

Opens at `http://localhost:5173`. Hot module reload is active — changes to TypeScript
and CSS are reflected instantly without a page refresh.

---

## Run (Production Build)

```powershell
npm run build        # Outputs to dist/
npm run preview      # Serve dist/ locally to validate build
```

The `dist/` folder is fully static — open `dist/index.html` in any modern browser
with no server required.

---

## Run Tests

```powershell
npm run test         # Vitest unit tests (watch mode)
npm run test:run     # Vitest unit tests (single pass, CI mode)
npm run test:e2e     # Playwright integration/visual tests
```

> **Constitution III**: Tests MUST be written and confirmed failing before
> implementation. Run `npm run test:run` after writing each test to verify it fails.

---

## Project Structure

```
src/
├── index.html
├── src/
│   ├── main.ts               # Entry point, mounts app
│   ├── state.ts              # Central reactive state manager
│   ├── types.ts              # All TypeScript interfaces (data model)
│   ├── engine/
│   │   ├── resolveMatches.ts # Regex evaluation + overlap resolution
│   │   └── evaluateRule.ts   # DQ rule pass/fail logic
│   ├── storage/
│   │   └── ruleSetStorage.ts # localStorage read/write
│   ├── ui/
│   │   ├── RegexInputPanel.ts  # Top pane + flag toggles
│   │   ├── DataPane.ts         # Bottom pane + highlight rendering
│   │   └── DQRulesPanel.ts     # Right sidebar + rule set management
│   └── styles/
│       ├── main.css
│       └── palette.css        # WCAG color palette custom properties
tests/
├── unit/
│   ├── resolveMatches.test.ts
│   ├── evaluateRule.test.ts
│   └── ruleSetStorage.test.ts
└── e2e/
    ├── highlight.spec.ts      # P1 user story visual tests
    ├── dq-rules.spec.ts       # P2 user story integration tests
    └── rule-sets.spec.ts      # P3 user story integration tests
```

---

## Validation Checklist (run after implementation)

- [ ] `npm run test:run` — all unit tests pass
- [ ] `npm run test:e2e` — all Playwright tests pass
- [ ] Open `dist/index.html` directly in browser (no server) — app loads
- [ ] Paste a 50,000+ char string — performance warning appears, highlights still render
- [ ] Toggle `i`, `m`, `s` flags — highlights update correctly
- [ ] Save a rule set, refresh page, reload rule set — rules restored correctly
- [ ] Open browser DevTools → Application → Local Storage — rule sets visible
- [ ] Test in Chrome, Firefox, Edge — consistent rendering
