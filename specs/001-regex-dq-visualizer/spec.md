# Feature Specification: Interactive RegEx Visualizer for Data Quality

**Feature Branch**: `001-regex-dq-visualizer`
**Created**: 2026-04-30
**Status**: Draft
**Input**: User description: "build a tool where you paste a raw data string (like a SAP HANA log or a dirty CSV row) and write a Regex pattern. The UI should highlight matches in real-time and show Pass/Fail indicators based on DQ rules you define."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Regex Match Highlighting (Priority: P1)

A data engineer pastes a raw string (e.g., a SAP HANA log line or a dirty CSV row) into
the bottom pane of a split-pane interface, then types a regex pattern into the top pane.
As they type, the tool instantly highlights all matching substrings within the bottom
data pane using distinct color coding — no submit button required. The DQ rules panel
is always visible in a right sidebar alongside both panes. The engineer can refine the
pattern and see matches update live.

**Why this priority**: This is the core interaction. Without real-time highlighting,
the tool has no value. All other stories build on this foundation.

**Independent Test**: A user can paste any text, type a regex, and see colored match
highlights update with every keystroke — fully usable and valuable on its own as a
regex scratchpad.

**Acceptance Scenarios**:

1. **Given** a raw string in the input panel and a valid regex in the pattern field, **When** the user types or edits the pattern, **Then** all matching substrings are highlighted in the raw string within 200ms of the last keystroke.
2. **Given** a regex pattern with multiple capture groups, **When** matches are found, **Then** each capture group is highlighted in a distinct color.
3. **Given** an invalid regex pattern (e.g., unmatched parenthesis), **When** the user types it, **Then** a clear inline error message is shown and no highlights are applied (the raw string remains unstyled).
4. **Given** a valid regex that matches zero substrings, **When** evaluated, **Then** the raw string is shown unstyled and a "No matches" indicator is displayed.
5. **Given** a regex that matches the entire raw string, **When** evaluated, **Then** the full string is highlighted correctly.

---

### User Story 2 - Data Quality Rule Pass/Fail Evaluation (Priority: P2)

A data quality analyst defines one or more named DQ rules, each consisting of a regex
pattern and an expected match behavior (e.g., "must match", "must not match", "match
count equals N"). After pasting a raw string, the tool evaluates each rule and displays
a Pass/Fail indicator alongside the rule name. The analyst can see at a glance which
quality checks the string satisfies.

**Why this priority**: This is what differentiates the tool from a plain regex tester.
DQ rule evaluation is the core data quality use case and the primary reason the tool
exists in an enterprise data context.

**Independent Test**: A user can define two DQ rules (one pass, one fail), paste a test
string, and see accurate Pass/Fail badges for each rule — independently verifiable
without saved rule sets.

**Acceptance Scenarios**:

1. **Given** a DQ rule with a "must match" condition and a raw string that contains a match, **When** the string is evaluated, **Then** the rule shows a "Pass" indicator.
2. **Given** a DQ rule with a "must match" condition and a raw string with no match, **When** evaluated, **Then** the rule shows a "Fail" indicator with a brief explanation.
3. **Given** a DQ rule with a "must not match" condition and a raw string that contains a match, **When** evaluated, **Then** the rule shows a "Fail" indicator.
4. **Given** multiple DQ rules defined, **When** the raw string is updated or the pattern changes, **Then** all Pass/Fail indicators update in real-time.
5. **Given** a DQ rule with an invalid regex, **When** displayed, **Then** the rule shows an "Error" indicator (distinct from Pass/Fail) with the regex error message.

---

### User Story 3 - Save and Reuse Rule Sets (Priority: P3)

A data engineer saves a named collection of DQ rules (a "rule set") for a specific data
source (e.g., "HANA Audit Log Rules", "Provisioning CSV Rules"). On a future visit they
can load a saved rule set, which populates all DQ rules automatically, ready to test
against a new raw string.

**Why this priority**: Enables repeated use of validated rule sets across sessions.
Valuable once rule sets are established, but the tool is fully usable without persistence
(P1 + P2 deliver the core value first).

**Independent Test**: A user can save a rule set with two rules, clear the current
session, reload the saved rule set, and confirm the rules are restored and evaluate
correctly against a new test string.

**Acceptance Scenarios**:

1. **Given** one or more DQ rules defined, **When** the user clicks Save Rule Set and provides a name, **Then** the rule set is persisted and appears in the saved rule sets list.
2. **Given** a saved rule set, **When** the user selects and loads it, **Then** all rules from the set are populated in the DQ rules panel, replacing any current rules (with a confirmation if rules are present).
3. **Given** a saved rule set, **When** the user edits or deletes it, **Then** the change is reflected in the list immediately.
4. **Given** multiple saved rule sets, **When** the user browses the list, **Then** each entry shows its name and rule count.

---

### Edge Cases

- What happens when the raw string is very large (e.g., a multi-thousand-line log dump)? → The tool evaluates strings up to 50,000 characters; beyond that a performance warning is shown above the data pane but evaluation still proceeds.
- How are multi-line raw strings handled — does the regex apply per-line or across the full string?
- What happens if two overlapping regex matches are found — how are they visually distinguished? → Longest non-overlapping match is highlighted; a hover tooltip on the highlighted span reveals the count and text of any overlapping alternatives.
- How does the tool behave when the user pastes content with special HTML characters (e.g., `<`, `>`, `&`)?
- What happens if local storage is unavailable or full when saving a rule set?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to paste or type a raw text string into the bottom pane of a split-pane layout.
- **FR-002**: Users MUST be able to enter a regex pattern in the top pane of the split-pane layout, which is evaluated against the raw string in the bottom pane.
- **FR-003**: The system MUST highlight all regex matches within the raw string in real-time as the pattern is edited.
- **FR-004**: Each distinct capture group in the regex MUST be highlighted in a visually distinct color drawn from a fixed accessible palette of 6–8 colors. Colors MUST meet WCAG contrast requirements and adapt to both dark and light display modes.
- **FR-005**: The system MUST display a clear inline error when the regex pattern is syntactically invalid.
- **FR-006**: Users MUST be able to define one or more named DQ rules, each with a regex pattern and a match condition (must match / must not match / match count equals N).
- **FR-007**: The system MUST evaluate all DQ rules against the current raw string and display a Pass/Fail/Error indicator per rule in real-time.
- **FR-008**: Pass/Fail/Error indicators MUST update automatically when the raw string or any rule is changed.
- **FR-009**: Users MUST be able to add, edit, and delete individual DQ rules.
- **FR-010**: Users MUST be able to save a named rule set containing all current DQ rules.
- **FR-011**: Users MUST be able to load a saved rule set, which replaces the current DQ rule panel content.
- **FR-012**: Users MUST be able to delete a saved rule set.
- **FR-013**: The UI MUST present a split-pane layout with the regex pattern input in the top pane, the raw data string in the bottom pane, and the DQ rules panel fixed in a right sidebar — all visible simultaneously without scrolling or tab switching.
- **FR-015**: The system MUST display a visible performance warning above the data pane when the raw string exceeds 50,000 characters. Evaluation MUST still proceed — input is never blocked or truncated.

### Key Entities

- **Raw String**: The input text to be tested — a single paste area accepting any plain text (log lines, CSV rows, JSON fragments, etc.).
- **Regex Pattern**: A regular expression authored by the user, evaluated against the raw string for live highlighting. Separate from DQ rule patterns.
- **DQ Rule**: A named rule consisting of a regex pattern and a match condition (must match / must not match / match count = N). Produces a Pass/Fail/Error result.
- **Rule Set**: A named, persistable collection of DQ rules associated with a data source or use case.
- **Match Result**: The set of substrings (with positions) found by a regex evaluation, used to drive highlighting and Pass/Fail logic.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Match highlights update within 200ms of the user's last keystroke for raw strings up to 10,000 characters. For strings between 10,000 and 50,000 characters a performance warning is shown and updates MUST still complete within 1 second.
- **SC-002**: Pass/Fail indicators for all defined DQ rules update within 300ms of any change to the raw string or rule definitions.
- **SC-003**: 100% of invalid regex patterns surface a human-readable error — no unhandled exceptions or blank UI states.
- **SC-004**: A user can define a DQ rule, paste a test string, and read a Pass/Fail result in under 30 seconds from first opening the tool.
- **SC-005**: Saved rule sets can be loaded and are ready to evaluate within 2 seconds of selection.
- **SC-006**: The tool is fully usable in a modern web browser with no installation, plugins, or local tooling required.

## Clarifications

### Session 2026-04-30

- Q: What is the layout of the UI? → A: Split-pane — regex pattern input on top, raw data string display on bottom, with instant color-coded match highlighting.
- Q: Where does the DQ Rules panel live in the split-pane layout? → A: Right sidebar — DQ rules panel fixed to the right, always visible alongside both panes.
- Q: Should regex flag controls be exposed in the UI? → A: Yes — compact toggles inline in the top pane: `i` (case-insensitive), `m` (multiline), `s` (dotAll).
- Q: How should overlapping regex matches be rendered? → A: Longest non-overlapping match wins for highlighting; overlapping alternatives shown in a hover tooltip on the highlighted span.
- Q: What color palette is used for match highlighting? → A: Fixed accessible palette of 6–8 distinct colors, WCAG contrast compliant, adapting to dark and light mode.
- Q: What is the raw string size limit and behavior beyond it? → A: Soft cap at 50,000 characters — evaluation continues but a performance warning is shown above the data pane.

## Assumptions

- The tool is a single-page web application running entirely in the browser; no server-side processing is required for regex evaluation or highlighting (all logic is client-side).
- Rule set persistence uses browser local storage; cloud sync and shared rule sets across users are out of scope for v1.
- The raw string input is treated as plain text only — no binary, file upload, or streaming log ingestion in v1.
- Regex flavor is the browser's native ECMAScript regex engine; PCRE or HANA-specific regex extensions are out of scope for v1.
- Multi-line mode behavior (whether `.` matches newlines, `^`/`$` per-line vs. full string) is user-configurable via inline flag toggles (`i`, `m`, `s`) in the top pane, defaulting to all flags off (full-string, case-sensitive, dotAll off).
- No user authentication or access control is required — the tool is for internal developer/analyst use only.
- The tool is desktop-browser-first; mobile/tablet layout is a nice-to-have but not a v1 requirement.
