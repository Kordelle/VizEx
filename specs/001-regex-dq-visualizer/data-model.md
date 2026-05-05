# Data Model: VizEx — Regex Data Quality Visualizer

**Feature**: `001-regex-dq-visualizer`
**Date**: 2026-04-30

---

## Entities

### RegexPattern

The live pattern the user types into the top pane. Drives highlighting only.
Not persisted.

```typescript
interface RegexPattern {
  raw: string;           // Raw pattern string as typed by user
  flags: RegexFlags;     // Active flag toggles
}

interface RegexFlags {
  caseInsensitive: boolean;  // i flag
  multiline: boolean;        // m flag — ^ and $ match per line
  dotAll: boolean;           // s flag — . matches \n
}
```

**Validation rules**:
- `raw` may be empty (no evaluation performed when empty)
- If `raw` produces an invalid `RegExp`, a `PatternError` is returned instead of matches

---

### MatchResult

The computed output of evaluating `RegexPattern` against `RawString`. Not persisted.

```typescript
interface MatchResult {
  spans: MatchSpan[];         // Non-overlapping highlighted spans, in index order
  totalMatchCount: number;    // Count of all matches (including skipped overlaps)
  hasOverlaps: boolean;       // True if any overlapping matches were resolved
  durationMs: number;         // Evaluation time in milliseconds
}

interface MatchSpan {
  start: number;              // Character index (inclusive)
  end: number;                // Character index (exclusive)
  groupIndex: number;         // 0 = full match, 1–N = capture group number
  text: string;               // Matched substring
  overlappingAlternatives: OverlapInfo[];
}

interface OverlapInfo {
  start: number;
  end: number;
  text: string;
}
```

---

### PatternError

Returned when regex compilation fails. Not persisted.

```typescript
interface PatternError {
  message: string;   // Human-readable error from browser's RegExp engine
  raw: string;       // The pattern string that caused the error
}
```

---

### DQRule

A named data quality rule. Lives in session state and in persisted `RuleSet`.

```typescript
interface DQRule {
  id: string;                         // UUID, generated on creation
  name: string;                       // User-provided label (non-empty)
  pattern: string;                    // Regex pattern string
  condition: DQRuleCondition;         // Match condition type
  expectedCount?: number;             // Required only when condition === 'match-count-equals'
}

type DQRuleCondition =
  | 'must-match'
  | 'must-not-match'
  | 'match-count-equals';
```

**Validation rules**:
- `name` must be non-empty (max 100 chars)
- `pattern` may be empty (rule shows Error state if empty)
- `expectedCount` must be a non-negative integer when condition is `match-count-equals`

---

### RuleResult

The computed pass/fail outcome of a single `DQRule` against the current `RawString`.
Not persisted.

```typescript
interface RuleResult {
  ruleId: string;
  status: 'pass' | 'fail' | 'error';
  explanation?: string;   // Required on 'fail' and 'error'; absent on 'pass'
  matchCount?: number;    // Actual match count (for match-count-equals condition)
}
```

---

### RuleSet

A named, persisted collection of `DQRule` objects.

```typescript
interface RuleSet {
  id: string;           // UUID, generated on creation
  name: string;         // User-provided name (non-empty, max 100 chars, unique in storage)
  createdAt: string;    // ISO 8601 datetime
  updatedAt: string;    // ISO 8601 datetime
  rules: DQRule[];      // Ordered list; order is preserved on load
}
```

**Storage key**: `dq-visualizer:rule-sets`
**Storage format**: `JSON.stringify(RuleSet[])`

**Validation rules**:
- `name` must be unique across all stored rule sets
- `rules` may be empty (empty rule set is valid)
- Max rule sets: no hard limit at v1 (soft limit governed by `localStorage` quota ~5MB)

---

## State Transitions

### DQRule Status

```
[defined] → evaluate against RawString → [pass | fail | error]
           ↑___________________________________|
           (re-evaluate on every RawString or rule change)
```

### RuleSet Lifecycle

```
[unsaved rules] → Save → [persisted RuleSet]
                              ↓
                    [loaded into session] ← Load
                              ↓
                    [modified in session] → Save (upsert by id)
                              ↓
                          [deleted] → Delete (removed from storage)
```

---

## Relationships

```
RegexPattern  ──evaluates against──▶  RawString  ──produces──▶  MatchResult
                                          │
                                          │ (same RawString)
                                          ▼
DQRule[]      ──each evaluates against──▶ RawString ──produces──▶ RuleResult[]
    │
    └── persisted as ──▶ RuleSet (localStorage)
```
