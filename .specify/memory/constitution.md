<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.0.1
Modified principles:
  - III. Test-First: Clarified that TDD applies to logic units; UI/real-time features
    use integration/visual testing as the equivalent discipline.
Added sections: none
Removed sections: none
Templates reviewed:
  - .specify/templates/plan-template.md ✅ no change needed
  - .specify/templates/spec-template.md ✅ no change needed
  - .specify/templates/tasks-template.md ✅ no change needed
Deferred TODOs:
  - TODO(RATIFICATION_DATE): Original ratification date unknown — set once team agrees on adoption date.
-->

# VizEx Constitution

## Core Principles

### I. Specification-First

Every feature MUST begin with a written specification before any implementation work starts.
Specifications MUST capture user stories with acceptance scenarios, functional requirements,
and measurable success criteria. No code is written without an approved spec. This ensures
all work is traceable to an explicit, agreed-upon intent and prevents scope creep.

### II. AI-Assisted, Human-Approved

AI agents (GitHub Copilot, Speckit commands) MUST be used to generate drafts of specs,
plans, tasks, and implementation artifacts. However, every generated artifact MUST be
reviewed and approved by a human before it gates subsequent workflow stages. AI output
is input, not output.

### III. Test-First (NON-NEGOTIABLE)

When tests are requested in a specification, TDD is mandatory:
Tests MUST be written and confirmed failing before implementation begins.
The Red-Green-Refactor cycle MUST be enforced. No implementation task is considered
complete if the associated tests do not pass. This principle is non-negotiable and
overrides delivery pressure.

For features with real-time UI or visual behavior (e.g., live highlighting, interactive
rendering), integration and visual/snapshot tests serve as the TDD-equivalent discipline.
The same Red-Green-Refactor obligation applies — tests MUST be authored before
implementation, even when the test form is visual rather than unit-based.

### IV. Git Discipline

All work MUST live in a Git repository. Features MUST be developed on dedicated branches
following the project's sequential numbering convention (e.g., `001-feature-name`).
Commits MUST be atomic and descriptive. Constitution, spec, plan, and task artifacts
MUST be committed before implementation begins. History is the project's audit trail.

### V. Simplicity & YAGNI

Solutions MUST start as simple as possible. Complexity MUST be explicitly justified
in the implementation plan's Complexity Tracking table. Abstractions, patterns, and
additional dependencies are only introduced when a simpler alternative has been
demonstrably insufficient. "You Aren't Gonna Need It" is the default posture.

## Development Standards

All workflow stages MUST follow the Speckit command sequence:
`/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`

Skipping stages is only permitted when the skipped stage's outputs already exist and
are up to date. Any skip MUST be documented in the relevant plan or spec file.

Agents and prompts in `.github/agents/` and `.github/prompts/` define the canonical
behavior for each stage. These files MUST be kept in sync with any constitution amendments
that change workflow requirements.

## Tooling & Workflow

- **AI Integration**: GitHub Copilot (configured in `.specify/init-options.json`)
- **Scripting**: PowerShell is the primary scripting language for automation hooks
- **Branch Strategy**: Sequential branch numbering (`001-`, `002-`, …)
- **Context File**: `.github/copilot-instructions.md` is the runtime guidance file
  and MUST reference the current plan for active feature work
- **Extension Hooks**: Git hooks defined in `.specify/extensions.yml` MUST remain
  enabled unless explicitly disabled with documented justification

## Governance

This constitution supersedes all other practices and informal agreements.
Any amendment MUST:
1. Update this file with an incremented semantic version
2. Include an updated Sync Impact Report (HTML comment at top of file)
3. Propagate changes to all affected templates and agent files
4. Be committed with a message of the form:
   `docs: amend constitution to vX.Y.Z (<summary of change>)`

Version policy:
- **MAJOR**: Removal or incompatible redefinition of a core principle
- **MINOR**: New principle or section added; materially expanded guidance
- **PATCH**: Clarifications, wording, or non-semantic refinements

All pull requests MUST include a Constitution Check confirming no principles are violated.
Complexity violations MUST be documented in the plan's Complexity Tracking table before
the PR is approved.

Refer to `.github/copilot-instructions.md` for runtime development guidance during
active feature work.

**Version**: 1.0.1 | **Ratified**: TODO(RATIFICATION_DATE): set adoption date | **Last Amended**: 2026-04-30
