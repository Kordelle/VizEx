# UI Contract: VizEx — Regex Data Quality Visualizer

**Feature**: `001-vizex`
**Date**: 2026-04-30
**Type**: UI Component & Internal Module Contracts

---

## Layout Contract

The application MUST render as a single viewport with three always-visible regions:

```
┌─────────────────────────────────────┬─────────────────┐
│  TOP PANE: RegexInputPanel          │                  │
│  [pattern input] [i] [m] [s]        │  RIGHT SIDEBAR   │
│  [error message if invalid]         │  DQRulesPanel    │
├─────────────────────────────────────│                  │
│  BOTTOM PANE: DataPane              │  [rule list]     │
│  [highlighted raw string display]   │  [add rule btn]  │
│  [no-matches / perf warning banner] │  [rule sets]     │
└─────────────────────────────────────┴─────────────────┘
```

- Pane split is resizable (drag handle between top and bottom panes)
- Sidebar width is fixed at 320px (resizable in v2)
- All three regions remain visible without horizontal scrolling at ≥1024px viewport width

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
| `pattern:change` | User keystroke in top pane | Updates `state.pattern`; debounce 150ms | Re-runs `resolveMatches`; re-renders highlights |
| `flags:toggle` | User clicks flag toggle | Updates `state.pattern.flags` | Re-runs `resolveMatches`; re-renders highlights |
| `input:change` | User edits raw string pane | Updates `state.rawInput`; debounce 150ms | Re-runs `resolveMatches` + all `evaluateRule`; re-renders |
| `rule:add` | User submits new rule form | Appends to `state.rules` | Re-runs `evaluateRule` for new rule; re-renders sidebar |
| `rule:edit` | User saves rule edit | Replaces rule in `state.rules` | Re-runs `evaluateRule`; re-renders sidebar |
| `rule:delete` | User confirms delete | Removes from `state.rules` | Re-renders sidebar |
| `ruleset:save` | User saves rule set | Calls `RuleSetStorage.upsert` | Updates saved list in sidebar |
| `ruleset:load` | User selects rule set | Replaces `state.rules` | Confirmation if current rules present; re-evaluates all |
| `ruleset:delete` | User deletes rule set | Calls `RuleSetStorage.remove` | Updates saved list |
