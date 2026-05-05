# Implementation Plan: VizEx — Regex Data Quality Visualizer

**Branch**: `001-vizex` | **Date**: 2026-04-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-vizex/spec.md`

## Summary

A single-page, client-side web tool that lets data engineers paste raw text (HANA logs,
CSV rows) into a bottom pane, type a regex into a top pane, and see real-time color-coded
match highlighting. A right sidebar hosts named DQ rules (must-match / must-not-match /
match-count-equals) with live Pass/Fail/Error badges. Rule sets are persisted to
`localStorage`. Built with Vite + TypeScript, no UI framework, tested with Vitest
(unit) and Playwright (visual/integration).

## Technical Context

**Language/Version**: TypeScript 5.x (compiled by Vite, targets ES2022)
**Primary Dependencies**: Vite 5, Vitest, Playwright
**Storage**: `localStorage` (JSON serialization of `RuleSet[]`)
**Testing**: Vitest (unit), Playwright (integration/visual)
**Target Platform**: Modern desktop browsers (Chrome, Firefox, Edge) — static file deployment
**Project Type**: Web application (single-page, fully client-side)
**Performance Goals**: ≤200ms highlight update for ≤10k chars; ≤1s for ≤50k chars
**Constraints**: No server, no backend, no authentication; output is a static `dist/`
**Scale/Scope**: Single-user, in-browser; localStorage quota (~5MB) governs rule set volume

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Specification-First | ✅ Pass | spec.md complete and clarified before this plan |
| II. AI-Assisted, Human-Approved | ✅ Pass | Spec and plan AI-generated; human review required before tasks |
| III. Test-First | ✅ Pass | Vitest unit + Playwright visual tests defined before implementation; tests written first per TDD |
| IV. Git Discipline | ✅ Pass | Branch `001-vizex` active; artifacts committed before implementation |
| V. Simplicity & YAGNI | ✅ Pass | Vanilla TS + Vite; no framework; no server; no complex state library |

**Post-design re-check**: All gates still pass. No complexity violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-vizex/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-contract.md   # UI layout + module + event contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── index.html
├── src/
│   ├── main.ts                 # Entry point
│   ├── state.ts                # Central reactive state manager
│   ├── types.ts                # TypeScript interfaces (data model)
│   ├── engine/
│   │   ├── resolveMatches.ts   # Regex evaluation + non-overlapping match resolution
│   │   └── evaluateRule.ts     # DQ rule pass/fail/error evaluation
│   ├── storage/
│   │   └── ruleSetStorage.ts   # localStorage CRUD for RuleSet[]
│   ├── ui/
│   │   ├── RegexInputPanel.ts  # Top pane + flag toggles (i, m, s)
│   │   ├── DataPane.ts         # Bottom pane + highlight span rendering
│   │   └── DQRulesPanel.ts     # Right sidebar + rule set management UI
│   └── styles/
│       ├── main.css            # Layout (split-pane + sidebar)
│       └── palette.css         # WCAG color palette CSS custom properties
tests/
├── unit/
│   ├── resolveMatches.test.ts  # Engine unit tests
│   ├── evaluateRule.test.ts    # DQ rule logic unit tests
│   └── ruleSetStorage.test.ts  # Storage unit tests
└── e2e/
    ├── highlight.spec.ts       # P1 Playwright visual tests
    ├── dq-rules.spec.ts        # P2 Playwright integration tests
    └── rule-sets.spec.ts       # P3 Playwright integration tests
```

**Structure Decision**: Option 1 (single project). All source under `src/`, tests
under `tests/`. Static SPA — no backend directory needed.

## Complexity Tracking

*No constitution violations requiring justification.*
