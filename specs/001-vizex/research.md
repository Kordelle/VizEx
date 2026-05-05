# Research: VizEx — Regex Data Quality Visualizer

**Feature**: `001-vizex`
**Date**: 2026-04-30

---

## Decision 1: Technology Stack

**Decision**: Vite + TypeScript, no UI framework (vanilla TS)

**Rationale**: The entire UI is a single screen with three panels. There are no routes,
no server, and no complex state tree. A vanilla TS + Vite setup delivers instant HMR,
static build output (open `index.html` in any browser), and zero runtime framework
overhead. Adding React/Vue would violate Constitution V (YAGNI) with no tangible gain.

**Alternatives considered**:
- React + Vite: rejected — component abstraction overhead not justified for single-screen tool
- Svelte: rejected — smaller but still adds a compiler step with no UX benefit here
- Plain HTML/JS (no build): rejected — TypeScript type safety needed for regex/DQ logic correctness; Vite adds minimal overhead

---

## Decision 2: Real-Time Highlighting Strategy

**Decision**: Debounced input (150ms) → render highlighted HTML into a read-only
`<div>` panel using escaped `textContent` split at match boundaries, wrapped in
`<mark data-group="N">` spans. The raw string `<textarea>` and the rendered highlight
panel are overlaid via CSS (textarea transparent, highlight div behind).

**Rationale**: This is the canonical approach used by regex101 and RegExr. It avoids
`contenteditable` mutation complexity while giving pixel-perfect highlight positioning.
The 150ms debounce keeps CPU usage negligible for all string sizes within the soft cap.

**Alternatives considered**:
- `contenteditable` with DOM mutations: rejected — complex, cursor position management is fragile
- Canvas rendering: rejected — massive complexity, no accessibility benefit
- Web Worker for regex: deferred to v2 — not needed under 50k chars on modern engines

---

## Decision 3: Overlapping Match Resolution

**Decision**: Use JavaScript `RegExp` with `g` flag and `exec` loop. When matches
overlap (possible with lookahead patterns), apply a greedy non-overlapping pass:
iterate matches in index order, skip any match whose start index falls within the span
of the previously accepted match. Store skipped alternatives per-span for tooltip display.

**Rationale**: Matches from `exec` are returned left-to-right. A single linear pass
resolves overlaps in O(n) over match count. Tooltip data is cheap to compute at the
same time.

**Alternatives considered**:
- XRegExp library: rejected — adds a dependency just for overlap handling; native solution sufficient
- Show all overlapping matches simultaneously: rejected — produces unreadable highlight stacking

---

## Decision 4: DQ Rule Evaluation Engine

**Decision**: A pure function `evaluateRule(rule: DQRule, input: string): RuleResult`
that constructs a `RegExp` from `rule.pattern` and applies the match condition:
- `must-match`: `regex.test(input)` → pass if true
- `must-not-match`: `!regex.test(input)` → pass if true
- `match-count-equals`: count all non-overlapping matches via `exec` loop, compare to `rule.expectedCount`

Rules are evaluated synchronously in a `rules.map(evaluateRule)` call triggered by
the same debounce as highlighting.

**Rationale**: Pure function is trivially unit-testable (aligns with Constitution III).
No async needed — ECMAScript regex is synchronous and fast enough at v1 scale.

**Alternatives considered**:
- Async Web Worker per rule: rejected — latency overhead greater than gain at v1 scale
- Third-party DQ rule library: rejected — YAGNI; requirements are fully covered by native RegExp

---

## Decision 5: Persistence (Rule Sets)

**Decision**: `localStorage` with a single key `dq-visualizer:rule-sets` storing a
JSON array of `RuleSet` objects. Read on load, write on every save/delete mutation.

**Rationale**: No server, no IndexedDB schema migrations, no quota concerns at expected
data volumes (rule sets are tiny text objects). Synchronous read/write is acceptable
for user-triggered actions.

**Alternatives considered**:
- IndexedDB: rejected — async complexity not justified for small text payloads
- `sessionStorage`: rejected — rule sets must persist across sessions (US3 requirement)
- File export/import: deferred to v2 — out of scope per spec assumptions

---

## Decision 6: Color Palette

**Decision**: 8 CSS custom property pairs (background + foreground) defined at `:root`
and overridden in `[data-theme="dark"]`. Colors chosen from a WCAG AA-compliant set
with ≥4.5:1 contrast ratio for text on highlight background.

Palette (light mode backgrounds / dark mode backgrounds):
1. `#FFD700` / `#7B6000` — gold
2. `#90EE90` / `#1A5C1A` — green
3. `#ADD8E6` / `#003D5C` — blue
4. `#FFB6C1` / `#7A0020` — pink
5. `#DDA0DD` / `#4B0082` — plum
6. `#FFDAB9` / `#7A3B00` — peach
7. `#B0E0E6` / `#003E50` — powder blue
8. `#98FB98` / `#145214` — pale green

**Rationale**: Familiar pastel/saturated pairs are conventional for syntax/regex
highlighting tools. Overriding via CSS custom properties makes dark mode a single
attribute toggle with no JS required.

---

## Decision 7: Testing Strategy

**Decision**:
- **Unit tests (Vitest)**: `evaluateRule`, `resolveMatches` (overlap resolution),
  `buildHighlightSpans`, localStorage serialization helpers
- **Integration/visual tests (Playwright)**: full user flows per user story; snapshot
  tests for highlight rendering correctness across browsers

**Rationale**: Aligns with Constitution III as amended in v1.0.1 — unit tests for pure
logic functions, visual/integration tests for real-time UI behavior. Both layers must
be written and failing before implementation begins (TDD).

**Alternatives considered**:
- Jest: rejected — Vitest is native to Vite, no config translation needed
- Cypress: viable alternative to Playwright; Playwright chosen for better cross-browser support
