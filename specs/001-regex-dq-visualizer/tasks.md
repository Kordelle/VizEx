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
6. Phase 7 → example patterns + quick-start presets ✓ — discoverability

---

## Phase 7: User Story 4 — Example Regex Patterns & Quick-Start Presets (Priority: P2)

**Goal**: Provide a library of named, categorised example patterns that users can load with
one click. Lowers the barrier to entry — a new user can explore highlighting and DQ rules
without writing a single regex.

**Scope**: Pure data + minimal UI. No new engine logic. Categories cover the most common
real-world DQ use cases: identifiers, dates, emails/URLs, numbers, data-quality sentinels,
and log formats.

### Tests for User Story 4 — Write First, Must Fail Before Implementation ⚠️

- [x] T040 [P] [US4] Write unit tests for `examples.ts` in `tests/unit/examples.test.ts`:
  - every entry has a non-empty `label`, `pattern`, and `sampleText`
  - every `pattern` compiles without throwing (valid regex)
  - every `sampleText` produces ≥1 match against its `pattern`
  - categories array is non-empty and every category has ≥1 example
  - no duplicate `id` values across the full flat list

- [x] T041 [P] [US4] Write Playwright e2e test in `tests/e2e/examples.spec.ts`:
  - examples panel is visible in the sidebar
  - clicking "Use" for an example loads its `pattern` into `#pattern-input`
  - clicking "Use sample" for an example loads its `sampleText` into `#raw-input`
  - highlights update within 300ms of loading an example
  - at least 5 categories are rendered

**Verify**: `npm run test:run` — T040 must **fail** before T042. `npm run test:e2e` — T041 must **fail** before T043.

### Implementation for User Story 4

- [x] T042 [US4] Create `src/examples/examples.ts`: export `EXAMPLE_CATEGORIES: ExampleCategory[]` and
  flat `ALL_EXAMPLES: ExampleEntry[]`. Each `ExampleEntry` has:
  `id`, `label`, `description`, `pattern`, `flags` (partial `RegexFlags`), `sampleText`, `dqRules?` (optional pre-wired `DQRule[]`).
  Include ≥5 categories with ≥3 examples each — see example list below.

- [x] T043 [US4] Add `ExamplesPanel.ts` in `src/ui/`: collapsible `<details>` panel rendered
  inside `#dq-panel` below the add-rule form. Renders categories as `<optgroup>`-style sections;
  each entry shows label, description, and two buttons: **"↗ Pattern"** (dispatch `PATTERN_CHANGE`)
  and **"↗ Sample"** (dispatch `INPUT_CHANGE`).

- [x] T044 [US4] Wire `initExamplesPanel()` in `main.ts`.

- [x] T045 [US4] Add `ExamplesPanel` integration to `index.html`: `<div id="examples-panel"></div>`
  below `#add-rule-form` in the right sidebar.

**Checkpoint**: Examples panel renders in sidebar. Clicking any entry populates pattern and/or
sample text. All T040–T041 tests pass.

---

### Example Pattern Library (reference for T042)

#### Category: Identifiers
| id | Label | Pattern | Sample |
|---|---|---|---|
| `id-email` | Email address | `[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}` | `user@example.com, bad@, admin@corp.org` |
| `id-uuid` | UUID v4 | `[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}` | `550e8400-e29b-41d4-a716-446655440000` |
| `id-ssn` | US SSN | `\d{3}-\d{2}-\d{4}` | `123-45-6789, 000-00-0000` |
| `id-phone-us` | US phone | `\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4}` | `(555) 123-4567, 800-555-0100` |
| `id-ip4` | IPv4 address | `\b(?:\d{1,3}\.){3}\d{1,3}\b` | `192.168.1.1, 10.0.0.255, 999.999.999.999` |

#### Category: Dates & Times
| id | Label | Pattern | Sample |
|---|---|---|---|
| `dt-iso8601` | ISO 8601 datetime | `\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?` | `2024-01-15T09:30:00Z` |
| `dt-us` | US date (MM/DD/YYYY) | `\b(0?[1-9]\|1[0-2])\/(0?[1-9]\|[12]\d\|3[01])\/\d{4}\b` | `01/15/2024, 12/31/1999` |
| `dt-iso-date` | ISO date only (YYYY-MM-DD) | `\b\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])\b` | `2024-01-15, 1999-12-31` |
| `dt-time24` | 24-hour time | `\b([01]\d\|2[0-3]):[0-5]\d(:[0-5]\d)?\b` | `09:30, 23:59:59` |

#### Category: Numbers & Currency
| id | Label | Pattern | Sample |
|---|---|---|---|
| `num-integer` | Integer (pos/neg) | `-?\d+` | `42, -7, 0, 1000000` |
| `num-decimal` | Decimal number | `-?\d+\.\d+` | `3.14, -0.5, 100.00` |
| `num-currency-usd` | USD currency | `\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?` | `$1,234.56, $99, $ 0.99` |
| `num-percent` | Percentage | `\d+(?:\.\d+)?%` | `99%, 3.5%, 100%` |
| `num-scientific` | Scientific notation | `-?\d+(?:\.\d+)?[eE][+\-]?\d+` | `1.5e10, -3.2E-4` |

#### Category: Web & Network
| id | Label | Pattern | Sample |
|---|---|---|---|
| `web-url` | URL (http/https) | `https?:\/\/[^\s<>"{}|\\^`[\]]+` | `https://example.com/path?q=1` |
| `web-ip6` | IPv6 address | `([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}` | `2001:0db8:85a3:0000:0000:8a2e:0370:7334` |
| `web-mac` | MAC address | `([0-9A-Fa-f]{2}[:\-]){5}[0-9A-Fa-f]{2}` | `00:1A:2B:3C:4D:5E` |
| `web-html-tag` | HTML tag | `<[^>]+>` | `<div class="x">, <br/>, </p>` |

#### Category: Data Quality Sentinels
| id | Label | Pattern | Sample |
|---|---|---|---|
| `dq-null-literal` | NULL / null literal | `\bNULL\b\|\bnull\b\|\bNone\b\|\bNA\b\|\bN\/A\b` | `NULL, null, None, NA, N/A` |
| `dq-whitespace-only` | Whitespace-only field | `^\s+$` | `   , \t\t` |
| `dq-leading-trailing-ws` | Leading/trailing whitespace | `^\s+\|\s+$` | `  hello , world  ` |
| `dq-repeated-delimiter` | Repeated CSV delimiter | `,,+\|;;\+` | `a,,b,,,c` |
| `dq-control-chars` | Control characters (non-printable) | `[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]` | Paste a string with embedded NUL or BEL |

#### Category: Log Formats
| id | Label | Pattern | Sample |
|---|---|---|---|
| `log-level` | Log level keyword | `\b(DEBUG\|INFO\|WARN\|ERROR\|FATAL\|TRACE)\b` | `2024-01-15 ERROR failed to connect` |
| `log-apache-combined` | Apache combined log | `^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3}) (\d+\|-)` | `127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326` |
| `log-sap-hana` | SAP HANA trace header | `^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+\]\s+\w+\s+\(\w+\)` | `[2024-01-15 09:30:00.123] INFO (indexserver)` |
| `log-json-field` | JSON key-value pair | `"(\w+)"\s*:\s*("[^"]*"\|\d+\|true\|false\|null)` | `{"id": 42, "active": true, "name": "Alice"}` |

## Task Summary

| Phase | Tasks | Parallelizable | Story |
|---|---|---|---|
| Phase 1: Setup | T001–T007 | T003–T006 | — |
| Phase 2: Foundational | T008–T013 | T009–T010 | — |
| Phase 3: US1 (P1) | T014–T021 | T014–T016 | US1 |
| Phase 4: US2 (P2) | T022–T027 | T022–T023 | US2 |
| Phase 5: US3 (P3) | T028–T033 | T028–T029 | US3 |
| Phase 6: Polish | T034–T039 | T034–T036 | — |
| Phase 7: Examples | T040–T045 | T040–T041 | US4 |
| Phase 8: Performance & Render Fidelity | T046–T053 | T046–T047 | — |
| **Total** | **53 tasks** | **18 parallelizable** | |

---

## Phase 8: Performance & Render Fidelity

**Problem 1 — Highlight misalignment on scroll**: The mirror-div technique requires the
highlight layer and the input element to render text identically at the pixel level.
`<textarea>` is an OS-native form control whose internal metrics (subpixel padding,
scrollbar gutter, line-height quantization) are not guaranteed to match a plain `<div>`.
The only reliable fix is replacing `<textarea>` with `<div contenteditable="plaintext-only">`;
both elements then use the same rendering engine and identical CSS applies cleanly.

**Problem 2 — Main-thread freeze on large inputs**: `resolveMatches` + `buildHighlightSpans`
run synchronously on the UI thread inside the `subscribe` callback. A 500-row CSV with
an email regex produces thousands of `exec` iterations plus a large HTML string assignment —
all blocking scroll, input, and repaints. Fix: move the engine work into a **Web Worker**
so the UI thread never blocks. The worker receives `{ pattern, rawInput }` and posts back
`{ spans, html }`. A match-count cap (default 2 000) ensures the HTML string stays bounded.

### Tests — Write First, Must Fail Before Implementation ⚠️

- [ ] T046 [P] Write unit tests for the 2 000-match cap in `resolveMatches.test.ts`:
  assert that when match count exceeds cap, result includes `truncated: true` and
  `spans.length <= 2000`; assert normal results are unaffected.

- [ ] T047 [P] Write a Playwright e2e test `tests/e2e/performance.spec.ts`:
  paste 500-row CSV, apply email pattern, assert page stays interactive (no
  `page.waitForTimeout` > 500ms needed), assert highlight marks appear within 2s,
  assert scroll does not lock up (simulate mouse scroll, assert `scrollTop` changes).

### Implementation

- [ ] T048 Replace `<textarea id="raw-input">` with `<div id="raw-input" contenteditable="plaintext-only" role="textbox" aria-multiline="true" spellcheck="false">` in `index.html`.
  Update `DataPane.ts` to read `.textContent` / `.innerText` instead of `.value`;
  dispatch `INPUT_CHANGE` on `input` event. Remove all textarea-specific CSS hacks
  (`scrollbar-gutter`, `overflow-x: hidden`, `white-space`/`word-break` duplications)
  — the layer and input are now the same element type so CSS is naturally identical.

- [ ] T049 Add a `MATCH_CAP = 2_000` guard to `resolveMatches.ts`: after the exec loop,
  if `group0.length > MATCH_CAP` truncate to first 2 000 and set `truncated: true` on
  the result. Add `truncated?: boolean` to the `MatchResult` type in `types.ts`.

- [ ] T050 Create `src/engine/matchWorker.ts` (Web Worker entry):
  listens for `{ id, pattern, rawInput }` messages, calls `resolveMatches` +
  `buildHighlightSpans`, posts back `{ id, html, spans, truncated, durationMs }`.
  Export nothing — this is a worker entry point only.

- [ ] T051 Update `DataPane.ts` to use the worker: instantiate `new Worker(new URL('../engine/matchWorker.ts', import.meta.url), { type: 'module' })` once on init; on state change post a job with an incrementing `id`; on message only apply if `id` matches the latest posted (drop stale results). Show a subtle `calculating…` indicator while the worker is busy.

- [ ] T052 Update `main.css`: remove the textarea-specific alignment hacks added in
  previous fix attempts (`scrollbar-gutter`, duplicate `white-space`/`word-break` on
  `#raw-input`). Add `user-select: text` and `cursor: text` to `#raw-input` (now a div).
  Add `.truncation-warning` banner style (same visual as `.perf-warning`).

- [ ] T053 Add `truncation-warning` banner to `index.html` (hidden by default, shown by
  `DataPane.ts` when `truncated === true`): "⚠ Showing first 2 000 of N matches — refine
  your pattern to see more."

**Checkpoint**: Paste 500-row CSV, apply email regex — highlights appear within ~1s, page
remains scrollable throughout, highlights align precisely with text at all scroll positions.
T046–T047 tests pass.

---

## Notes

- `[P]` tasks target different files with no shared dependencies — safe to parallelize
- TDD is **mandatory** per Constitution III: every test task must be written and failing before its implementation task
- Commit after each checkpoint (Speckit git hooks will prompt)
- The `state.ts` reactive core is the integration seam — US2 and US3 build on top of US1's state events
- `evaluateRule` and `resolveMatches` are pure functions — highest-priority test targets
