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
```

> Unit tests cover `resolveMatches`, `evaluateRule`, and `ruleSetStorage`.
> Playwright e2e tests are planned but not yet implemented.

---

## Project Structure

```
src/
├── index.html
├── src/
│   ├── main.ts               # Entry point, mounts all panels
│   ├── state.ts              # Central reactive state manager
│   ├── types.ts              # All TypeScript interfaces (data model)
│   ├── engine/
│   │   ├── resolveMatches.ts       # Regex evaluation + overlap resolution
│   │   ├── evaluateRule.ts         # DQ rule pass/fail logic
│   │   ├── buildHighlightSpans.ts  # Viewport-aware highlight span builder
│   │   └── matchWorker.ts          # Web worker for off-thread evaluation
│   ├── storage/
│   │   └── ruleSetStorage.ts       # localStorage read/write
│   ├── ui/
│   │   ├── RegexInputPanel.ts      # Pattern input + flag toggles
│   │   ├── DataPane.ts             # Data editor + highlight rendering
│   │   ├── DQRulesPanel.ts         # DQ rules sidebar
│   │   ├── ExamplesPanel.ts        # Example patterns library with search
│   │   ├── RegexQuickRef.ts        # Collapsible token cheat sheet
│   │   └── InputStatsPanel.ts      # Live input statistics
│   ├── examples/
│   │   └── examples.ts             # Built-in pattern library
│   └── styles/
│       ├── main.css                # Layout + full design system
│       └── palette.css             # WCAG color palette custom properties
```

---

## Validation Checklist (run after implementation)

- [ ] `npm run test:run` — all unit tests pass
- [ ] Open `dist/index.html` directly in browser (no server) — app loads
- [ ] Paste a 50,000+ char string — performance warning appears, highlights still render
- [ ] Toggle `i`, `m`, `s` flags — highlights update correctly
- [ ] Test in Chrome, Firefox, Edge — consistent rendering
- [ ] Search bar in Examples panel filters live by name and pattern
- [ ] QuickRef token chips insert at cursor in pattern input
- [ ] Input Stats panel updates on every keystroke
