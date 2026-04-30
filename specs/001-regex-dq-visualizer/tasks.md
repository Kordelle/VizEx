# Tasks: Interactive RegEx Visualizer for Data Quality

**Input**: Design documents from `/specs/001-regex-dq-visualizer/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contract.md ✅, quickstart.md ✅

**TDD Approach**: Constitution III requires tests written and failing **before** implementation.
All test tasks precede their implementation counterparts within each phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)
- Setup/Foundational phases have no story label

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Vite + TypeScript project, install dev dependencies, and
establish the directory structure defined in `plan.md` and `quickstart.md`.

- [x] T001 Initialize Vite + TypeScript project (`npm create vite@latest . -- --template vanilla-ts`)
- [x] T002 Install dev dependencies: `vitest`, `@vitest/coverage-v8`, `playwright`, `@playwright/test` (`npm install -D`)
- [x] T003 [P] Configure `vite.config.ts` with Vitest test settings (globals, coverage, jsdom environment)
- [x] T004 [P] Configure `playwright.config.ts` for Chromium + Firefox + WebKit (baseURL `http://localhost:5173`)
- [x] T005 [P] Create directory structure: `src/engine/`, `src/storage/`, `src/ui/`, `src/styles/`, `tests/unit/`, `tests/e2e/`
- [x] T006 [P] Add `.gitignore` entries for `node_modules/`, `dist/`, `playwright-report/`, `coverage/`
- [x] T007 Add `npm` scripts to `package.json`: `dev`, `build`, `test`, `test:e2e`, `test:coverage`

**Checkpoint**: `npm run dev` serves the default Vite page; `npm test` runs (no test files yet)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript type definitions, shared CSS, and the `index.html` shell.
These block **all** user stories — no story can begin until this phase is complete.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Create `src/types.ts` with all interfaces from `data-model.md`: `RegexPattern`, `RegexFlags`, `MatchSpan`, `OverlapInfo`, `MatchResult`, `PatternError`, `DQRule`, `DQRuleCondition`, `RuleResult`, `RuleSet`
- [x] T009 [P] Create `src/styles/palette.css` with 8-pair WCAG color palette as CSS custom properties at `:root` and `[data-theme="dark"]` (from research.md Decision 6)
- [x] T010 [P] Create `src/styles/main.css` with split-pane + right-sidebar layout (FR-013): left column flex-column, right sidebar fixed width, full-viewport-height grid
- [x] T011 Create `index.html` with three-panel shell: `#regex-pane` (top), `#data-pane` (bottom), `#dq-panel` (right sidebar); link `main.css` and `palette.css`
- [x] T012 Create `src/state.ts` with reactive state manager: holds `RegexPattern`, `RegexFlags`, `string` (raw input), `DQRule[]`; exposes `subscribe(listener)` and `dispatch(action)` methods
- [x] T013 Create `src/main.ts` entry point: imports state, imports all three UI modules, calls panel init functions, wires `subscribe` → re-render cycle

**Checkpoint**: `npm run dev` shows the three-panel shell with correct layout; no logic yet

---

## Phase 3: User Story 1 — Real-Time Regex Match Highlighting (Priority: P1) 🎯 MVP

**Goal**: Paste text into the bottom pane, type a regex in the top pane, and see
color-coded match highlights update live within 200ms.

**Independent Test**: A user can paste any text, type a regex, and see colored highlights
update with every keystroke — fully usable as a regex scratchpad with no DQ rules needed.

### Tests for User Story 1 — Write First, Must Fail Before Implementation ⚠️

- [x] T014 [P] [US1] Write unit tests for `resolveMatches` in `tests/unit/resolveMatches.test.ts`: test valid match, zero matches, invalid regex (throws `PatternError`), overlapping match resolution (greedy non-overlapping), `OverlapInfo` tooltip data, 50k-char performance (≤1s)
- [x] T015 [P] [US1] Write unit tests for `buildHighlightSpans` in `tests/unit/buildHighlightSpans.test.ts`: test HTML-escaping of `<`, `>`, `&`; correct `<mark data-group="N">` wrapping; no-match passthrough; multi-capture-group coloring
- [x] T016 [P] [US1] Write Playwright e2e test for US1 full flow in `tests/e2e/highlight.spec.ts`: paste text → type regex → assert `mark` elements appear; assert inline error on invalid regex; assert "No matches" indicator on zero matches; snapshot test for highlight rendering; assert ≤200ms update time for 10k-char input

**Verify**: `npm test` and `npm run test:e2e` — ALL T014–T016 tests must **fail** before proceeding.

### Implementation for User Story 1

- [x] T017 [US1] Implement `src/engine/resolveMatches.ts`: export `resolveMatches(pattern: RegexPattern, flags: RegexFlags, input: string): MatchResult | PatternError` — construct `RegExp`, run `exec` loop with `g` flag, apply greedy non-overlapping pass (O(n)), populate `OverlapInfo` for skipped spans; enforce 50k soft cap (return performance warning flag)
- [x] T018 [US1] Implement `src/engine/buildHighlightSpans.ts`: export `buildHighlightSpans(input: string, matches: MatchSpan[]): string` — split input at match boundaries, HTML-escape text segments, wrap matches in `<mark data-group="N" data-overlaps="...">` spans with tooltip `title` attribute
- [x] T019 [US1] Implement `src/ui/RegexInputPanel.ts`: render top pane with `<textarea>` for pattern input, inline flag toggle buttons (`i`, `m`, `s`) per FR-014, 150ms debounce on input → `dispatch({ type: 'PATTERN_CHANGE' })`; display `PatternError` inline below input
- [x] T020 [US1] Implement `src/ui/DataPane.ts`: render bottom pane with `<textarea>` (transparent, overlaid) + `<div class="highlight-layer">` behind; on state update call `resolveMatches` + `buildHighlightSpans`, inject HTML into highlight div; show "No matches" indicator; show performance warning banner if input >50k chars (FR-015)
- [x] T021 [US1] Wire `state.subscribe` in `main.ts`: on `PATTERN_CHANGE` or `INPUT_CHANGE` events trigger `DataPane` re-render; connect `RegexInputPanel` and `DataPane` init

**Checkpoint**: US1 fully functional — paste text, type regex, see live highlights. All T014–T016 tests pass.

---

## Phase 4: User Story 2 — DQ Rule Pass/Fail Evaluation (Priority: P2)

**Goal**: Define named DQ rules with regex + condition; see real-time Pass/Fail/Error
badges for each rule as the raw string or rules change.

**Independent Test**: Define two DQ rules (one pass, one fail), paste a test string, and
see accurate Pass/Fail badges — independently verifiable without saved rule sets.

### Tests for User Story 2 — Write First, Must Fail Before Implementation ⚠️

- [x] T022 [P] [US2] Write unit tests for `evaluateRule` in `tests/unit/evaluateRule.test.ts`: test `must-match` pass, `must-match` fail, `must-not-match` pass, `must-not-match` fail, `match-count-equals` pass/fail, invalid rule regex → `RuleResult` with `status: 'error'`, real-time update on input change
- [x] T023 [P] [US2] Write Playwright e2e test for US2 full flow in `tests/e2e/dq-rules.spec.ts`: add rule → paste matching string → assert Pass badge; change string to non-match → assert Fail badge; add rule with invalid regex → assert Error badge; assert all badges update within 300ms (SC-002); test add/edit/delete rule interactions (FR-009)

**Verify**: `npm test` and `npm run test:e2e` — ALL T022–T023 tests must **fail** before proceeding.

### Implementation for User Story 2

- [x] T024 [US2] Implement `src/engine/evaluateRule.ts`: export pure function `evaluateRule(rule: DQRule, input: string): RuleResult` — handle `must-match`, `must-not-match`, `match-count-equals` conditions via `exec` loop; catch `RegExp` constructor errors → `status: 'error'`; include `explanation` string on fail/error
- [x] T025 [US2] Implement `src/ui/DQRulesPanel.ts` — rule list section: render `DQRule[]` from state as list items with name, condition summary, and Pass/Fail/Error badge; wire add/edit/delete controls (FR-009); dispatch `RULE_ADD`, `RULE_EDIT`, `RULE_DELETE` actions to state
- [x] T026 [US2] Wire DQ evaluation in `state.ts`: on `INPUT_CHANGE`, `RULE_ADD`, `RULE_EDIT`, `RULE_DELETE` events, run `rules.map(r => evaluateRule(r, input))` and store `RuleResult[]` in state; trigger `DQRulesPanel` re-render via `subscribe`
- [x] T027 [US2] Update `src/ui/DQRulesPanel.ts` badge rendering: Pass = green badge, Fail = red badge with `explanation` tooltip, Error = amber badge with regex error message — all WCAG contrast compliant

**Checkpoint**: US1 + US2 both functional — DQ rules evaluate live alongside highlighting. All T022–T023 tests pass.

---

## Phase 5: User Story 3 — Save and Reuse Rule Sets (Priority: P3)

**Goal**: Save named rule set collections to `localStorage`; load them on future
visits to restore all DQ rules automatically.

**Independent Test**: Save a rule set with two rules, clear the session, reload the saved
rule set, confirm rules are restored and evaluate correctly.

### Tests for User Story 3 — Write First, Must Fail Before Implementation ⚠️

- [x] T028 [P] [US3] Write unit tests for `RuleSetStorage` in `tests/unit/ruleSetStorage.test.ts`: test `save` → `load` round-trip, `upsert` updates existing, `remove` deletes by id, `load` returns `[]` when key absent, `load` handles corrupted JSON gracefully, name + rule count per entry
- [x] T029 [P] [US3] Write Playwright e2e test for US3 full flow in `tests/e2e/rule-sets.spec.ts`: define rules → save rule set → reload page → load saved set → assert rules restored and evaluate correctly; test delete rule set; test browse list shows name + rule count (FR-012); assert load completes within 2s (SC-005)

**Verify**: `npm test` and `npm run test:e2e` — ALL T028–T029 tests must **fail** before proceeding.

### Implementation for User Story 3

- [x] T030 [US3] Implement `src/storage/ruleSetStorage.ts`: export `RuleSetStorage` object with `load(): RuleSet[]`, `save(ruleSets: RuleSet[]): void`, `upsert(ruleSet: RuleSet): void`, `remove(id: string): void` — key `dq-visualizer:rule-sets`; handle `localStorage` unavailable / quota exceeded with graceful error (FR-012)
- [x] T031 [US3] Extend `src/ui/DQRulesPanel.ts` — rule set management section: Save Rule Set button + name input, saved rule sets list (name + rule count per entry per FR-012), Load button (replace current rules with confirmation if rules present), Delete button; dispatch `RULESET_SAVE`, `RULESET_LOAD`, `RULESET_DELETE` actions
- [x] T032 [US3] Wire rule set actions in `state.ts`: `RULESET_SAVE` → `RuleSetStorage.upsert`, `RULESET_LOAD` → replace `rules` in state + re-evaluate, `RULESET_DELETE` → `RuleSetStorage.remove`; update `DQRulesPanel` saved sets list on each mutation
- [x] T033 [US3] Handle `localStorage` quota exceeded and unavailable: show inline error banner in `DQRulesPanel` on save failure; load errors fall back to empty list silently

**Checkpoint**: All three user stories functional. T028–T029 tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, dark mode, edge-case hardening, and final validation.

- [ ] T034 [P] Add `data-theme` toggle button to `index.html`; verify `palette.css` dark-mode overrides apply correctly; manual WCAG contrast check for all 8 highlight colors in both modes
- [ ] T035 [P] HTML-escape hardening in `buildHighlightSpans.ts`: add fuzz test for strings containing `<script>`, `&amp;`, `"`, `'` — verify no XSS injection in rendered highlight div
- [ ] T036 [P] Keyboard accessibility: ensure all interactive controls (flag toggles, add/edit/delete rule, save/load/delete rule set) are reachable and operable via keyboard; add ARIA labels to badge elements
- [ ] T037 Run `quickstart.md` validation checklist end-to-end: `npm run dev` → paste 10k-char test string → verify ≤200ms highlight (SC-001); verify ≤300ms DQ badge update (SC-002); verify "No matches" indicator; verify invalid-regex error (SC-003); verify 50k-char performance warning (FR-015)
- [x] T038 Run `npm run test:coverage` — confirm unit test coverage ≥80% on `src/engine/` and `src/storage/`
- [x] T039 Run `npm run build` — confirm `dist/` builds cleanly with no TypeScript errors; verify `index.html` in `dist/` opens in browser with no console errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — TDD: write tests → fail → implement
- **Phase 4 (US2)**: Depends on Phase 2 — TDD: write tests → fail → implement (can parallel-start with US1 at T022–T023 only)
- **Phase 5 (US3)**: Depends on Phase 2 — TDD: write tests → fail → implement (can parallel-start with US1/US2 at T028–T029 only)
- **Phase 6 (Polish)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Foundational complete → `types.ts`, `state.ts`, layout shell ready
- **US2 (P2)**: Foundational complete → additionally integrates with US1 state events (but independently testable)
- **US3 (P3)**: Foundational complete → `RuleSetStorage` is standalone; integrates with US2 `DQRule[]`

### Within Each User Story

1. Write tests → verify they **fail** → implement → verify they **pass**
2. Engine/pure functions before UI modules
3. UI modules before state wiring
4. State wiring before integration checkpoint

### Parallel Opportunities

- T003, T004, T005, T006 — all Phase 1 setup tasks (different files)
- T009, T010 — CSS files (independent)
- T014, T015, T016 — US1 test files (independent, different files)
- T022, T023 — US2 test files (independent)
- T028, T029 — US3 test files (independent)
- T034, T035, T036 — Polish tasks (independent)

---

## Parallel Example: User Story 1 Test Phase

```
# All three test files can be written simultaneously:
T014 → tests/unit/resolveMatches.test.ts
T015 → tests/unit/buildHighlightSpans.test.ts
T016 → tests/e2e/highlight.spec.ts

# Run to confirm all fail:
npm test               # T014, T015 must fail
npm run test:e2e       # T016 must fail

# Then implement in order:
T017 → src/engine/resolveMatches.ts
T018 → src/engine/buildHighlightSpans.ts   (parallel with T017)
T019 → src/ui/RegexInputPanel.ts
T020 → src/ui/DataPane.ts
T021 → wire in main.ts

# Re-run: all T014–T016 must now pass
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Write T014–T016 (tests, fail) → Complete Phase 3 (implementation)
4. **STOP and VALIDATE**: `npm test` + `npm run test:e2e` all pass; manual browser check
5. Demo: paste text, type regex, see live highlights — shippable regex scratchpad

### Incremental Delivery

1. Phase 1 + 2 → three-panel shell ✓
2. Phase 3 → live regex highlighting (MVP) ✓ — demo/deliver
3. Phase 4 → DQ rule badges ✓ — demo/deliver
4. Phase 5 → saved rule sets ✓ — demo/deliver
5. Phase 6 → polish + a11y ✓ — final delivery

---

## Task Summary

| Phase | Tasks | Parallelizable | Story |
|---|---|---|---|
| Phase 1: Setup | T001–T007 | T003–T006 | — |
| Phase 2: Foundational | T008–T013 | T009–T010 | — |
| Phase 3: US1 (P1) | T014–T021 | T014–T016 | US1 |
| Phase 4: US2 (P2) | T022–T027 | T022–T023 | US2 |
| Phase 5: US3 (P3) | T028–T033 | T028–T029 | US3 |
| Phase 6: Polish | T034–T039 | T034–T036 | — |
| **Total** | **39 tasks** | **14 parallelizable** | |

---

## Notes

- `[P]` tasks target different files with no shared dependencies — safe to parallelize
- TDD is **mandatory** per Constitution III: every test task must be written and failing before its implementation task
- Commit after each checkpoint (Speckit git hooks will prompt)
- The `state.ts` reactive core is the integration seam — US2 and US3 build on top of US1's state events
- `evaluateRule` and `resolveMatches` are pure functions — highest-priority test targets
