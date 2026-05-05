# Tasks: VizEx — Regex Data Quality Visualizer

**Input**: Design documents from `/specs/001-regex-dq-visualizer/`

---

## Phase 1: Setup

- [x] T001 Initialize Vite + TypeScript project
- [x] T002 Install dev dependencies
- [x] T003 Configure `vite.config.ts`
- [x] T004 Configure `playwright.config.ts`
- [x] T005 Create directory structure
- [x] T006 Add `.gitignore`
- [x] T007 Add `npm` scripts to `package.json`

---

## Phase 2: Foundational

- [x] T008 Create `src/types.ts`
- [x] T009 Create `src/styles/palette.css`
- [x] T010 Create `src/styles/main.css`
- [x] T011 Create `index.html` three-panel shell
- [x] T012 Create `src/state.ts` reactive state manager
- [x] T013 Create `src/main.ts` entry point

---

## Phase 3: US1 — Real-Time Regex Match Highlighting

- [x] T017 Implement `src/engine/resolveMatches.ts`
- [x] T018 Implement `src/engine/buildHighlightSpans.ts`
- [x] T019 Implement `src/ui/RegexInputPanel.ts`
- [x] T020 Implement `src/ui/DataPane.ts`
- [x] T021 Wire state in `main.ts`

---

## Phase 4: US2 — DQ Rule Pass/Fail Evaluation

- [x] T024 Implement `src/engine/evaluateRule.ts`
- [x] T025 Implement `src/ui/DQRulesPanel.ts` — rule list
- [x] T026 Wire DQ evaluation in `state.ts`
- [x] T027 Badge rendering (Pass/Fail/Error)

---

## Phase 5: US3 — Save and Reuse Rule Sets

- [x] T030 Implement `src/storage/ruleSetStorage.ts`
- [x] T031 Extend `DQRulesPanel.ts` — rule set management
- [x] T032 Wire rule set actions in `state.ts`
- [x] T033 Handle localStorage errors

---

## Phase 6: Polish

- [ ] T034 Dark mode toggle — verify palette.css overrides
- [ ] T035 Verify no XSS injection in highlight div
- [ ] T036 Keyboard accessibility audit
- [ ] T037 Manual end-to-end validation checklist

---

## Phase 7: US4 — Example Patterns Library

- [x] T042 Create `src/examples/examples.ts`
- [x] T043 Add `ExamplesPanel.ts`
- [x] T044 Wire `initExamplesPanel()` in `main.ts`
- [x] T045 Add `#examples-panel` anchor in `index.html`

---

## Phase 8: Performance & Render Fidelity

- [x] T048 Replace `<textarea>` with `<div contenteditable="plaintext-only">`
- [x] T049 Add 2,000 match cap to `resolveMatches.ts`
- [x] T052 Update `main.css` — shared layout block for highlight layer + input
- [x] T053 Add truncation warning banner

---

## Remaining

- [ ] T054 Validate ↗ Pattern and ↗ Sample buttons populate fields correctly
- [ ] T055 Verify highlight alignment on large inputs (500+ rows)

---

## Phase 9: Performance Optimization

- [x] T056 Increase debounce 150ms → 300ms in DataPane.ts
- [x] T057 Add render cache to DataPane — skip re-render when pattern/input/flags unchanged
- [x] T058 Add viewport-aware mark rendering to buildHighlightSpans.ts (skip off-screen marks)
- [x] T059 Wire scroll-triggered re-render in DataPane.ts with rAF throttle

---

## Phase 10: Visual Overhaul

- [x] T060 Add Inter + JetBrains Mono fonts via Google Fonts in index.html
- [x] T061 CSS design system — spacing scale, surface depth, refined colors, Inter font vars
- [x] T062 Styled panel headers — branded toolbar, pill badges, section dividers
- [x] T063 Monospace pattern input — pill shape, glow on focus, cleaner flag buttons
- [x] T064 Match count + timing readout in data pane toolbar
- [x] T065 Dark mode deep polish — surface hierarchy, muted borders, correct badge tints
