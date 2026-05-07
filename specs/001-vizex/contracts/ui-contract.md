# UI Contract: VizEx — Regex Data Quality Visualizer

**Feature**: `001-vizex`
**Date**: 2026-04-30
**Type**: UI Component & Internal Module Contracts

---

## Layout Contract

The application MUST render as a single viewport with a fixed header and three always-visible panel regions:

```
┌──────────────────────────────────────────────────────────┐
│  APP HEADER: VizEx branding + tagline + theme toggle     │
├─────────────────────────────────────┬────────────────────┤
│  LEFT / MAIN COLUMN                 │  RIGHT SIDEBAR     │
│                                     │                    │
│  RegexInputPanel                    │  DQRulesPanel      │
│  [pattern input] [i] [m] [s]        │  [rule list]       │
│  [error message if invalid]         │  [add rule btn]    │
│  RegexQuickRef (collapsible)        │                    │
│                                     │  ExamplesPanel     │
│  DataPane                           │  [search input]    │
│  [toolbar: upload | clear | stats]  │  [example list]    │
│  [highlighted raw string display]   │                    │
│  [no-matches / perf warning banner] │  InputStatsPanel   │
│                                     │  [4-stat grid]     │
│                                     │  [density bar]     │
└─────────────────────────────────────┴────────────────────┘
```

- Header height: 48px fixed; `#app` fills `calc(100vh - 48px)`
- Sidebar width is fixed at 320px
- All regions remain visible without horizontal scrolling at ≥1024px viewport width
- Rule Sets UI was removed in Phase 11c — not present in sidebar

---

## Module Contracts

### `resolveMatches(pattern: RegexPattern, input: string): MatchResult | PatternError`

**Purpose**: Compile the regex, run it against `input`, return non-overlapping spans.

**Behaviour**:
- Returns `PatternError` if `new RegExp(pattern.raw, flags)` throws
- Returns `MatchResult` with empty `spans` if no matches found
- Applies greedy non-overlapping resolution: iterates `exec` results left-to-right;
  skips a match if its `index` falls within `[prevStart, prevEnd)`; stores skipped
  matches in `overlappingAlternatives` on the accepted span
- `groupIndex` 0 = full match; 1–N = named/numbered capture group
- Hard cap: 2,000 matches per evaluation to protect render performance

**Performance contract**: MUST complete in ≤200ms for inputs ≤10,000 chars;
MUST complete in ≤1000ms for inputs ≤50,000 chars.

---

### `evaluateRule(rule: DQRule, input: string): RuleResult`

**Purpose**: Apply a single DQ rule's condition against the input string.

**Behaviour**:
- Returns `status: 'error'` with message if `rule.pattern` is empty or invalid regex
- `must-match`: `status: 'pass'` if `regex.test(input)`, else `'fail'`
  - `explanation` on fail: `"Pattern did not match any substring"`
- `must-not-match`: `status: 'pass'` if `!regex.test(input)`, else `'fail'`
  - `explanation` on fail: `"Pattern matched when it must not"`
- `match-count-equals`: count non-overlapping matches via `exec` loop;
  `status: 'pass'` if count === `rule.expectedCount`, else `'fail'`
  - `explanation` on fail: `"Expected N match(es), found M"`

---

### `RuleSetStorage`

**Purpose**: Read/write `RuleSet[]` from `localStorage`.

| Method | Signature | Behaviour |
|--------|-----------|-----------|
| `load` | `(): RuleSet[]` | Returns parsed array; returns `[]` on missing key or parse error |
| `save` | `(sets: RuleSet[]): void` | Serializes and writes; throws `StorageError` if quota exceeded |
| `upsert` | `(set: RuleSet): RuleSet[]` | Adds or replaces by `id`; returns updated array |
| `remove` | `(id: string): RuleSet[]` | Removes by `id`; returns updated array; no-op if not found |

**Error handling**: `StorageError` surfaces to UI as "Unable to save — storage full or unavailable."

---

## Event / Reactivity Contract

All UI updates are driven by a single reactive state object. Components do not mutate
state directly — they dispatch events to a central state manager.

| Event | Trigger | State mutation | UI effect |
|-------|---------|---------------|-----------|
| `PATTERN_CHANGE` | User keystroke in pattern input | Updates `state.pattern`; debounce 300ms | Re-runs `resolveMatches`; re-renders highlights |
| `flags:toggle` | User clicks flag toggle | Updates `state.pattern.flags` | Re-runs `resolveMatches`; re-renders highlights |
| `INPUT_CHANGE` | User edits data pane / uploads file / clears | Updates `state.rawInput`; debounce 300ms | Re-runs `resolveMatches` + all `evaluateRule`; re-renders |
| `rule:add` | User submits new rule form | Appends to `state.rules` | Re-runs `evaluateRule` for new rule; re-renders sidebar |
| `rule:edit` | User saves rule edit | Replaces rule in `state.rules` | Re-runs `evaluateRule`; re-renders sidebar |
| `rule:delete` | User confirms delete | Removes from `state.rules` | Re-renders sidebar |

---

## Post-v1 Module Contracts

### `initExamplesPanel()`

**Purpose**: Render the built-in pattern library with live search filtering.

**Behaviour**:
- Renders all example categories and entries from `EXAMPLE_CATEGORIES` on init
- Search input filters entries by `label`, `description`, or `pattern` (case-insensitive, live on `input` event)
- Badge updates to show `N / Total patterns` when a filter is active
- "↗ Pattern" button dispatches `PATTERN_CHANGE` and updates the visible pattern input
- "↗ Sample" button dispatches `INPUT_CHANGE` and updates the visible data pane

---

### `initRegexQuickRef()`

**Purpose**: Render a collapsible cheat sheet of clickable regex token chips.

**Behaviour**:
- Rendered as a `<details>` element, collapsed by default
- Tokens grouped by category (anchors, quantifiers, character classes, groups, lookarounds)
- Clicking a token chip inserts it at the cursor position in the pattern input and dispatches `PATTERN_CHANGE`

---

### `initInputStatsPanel()`

**Purpose**: Display live statistics about the current data pane contents.

**Behaviour**:
- Subscribes to state; re-renders on every `INPUT_CHANGE` or `PATTERN_CHANGE`
- Displays: total lines, total characters, non-empty rows, matched rows
- Renders a colour-coded match density progress bar: green ≥80%, amber 40–79%, red <40%
- Shows `—` for all values when input is empty
