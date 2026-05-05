<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current implementation plan at:
`specs/001-vizex/plan.md`

Key references for this feature:
- Spec: `specs/001-vizex/spec.md`
- Data model: `specs/001-vizex/data-model.md`
- UI contract: `specs/001-vizex/contracts/ui-contract.md`
- Quickstart: `specs/001-vizex/quickstart.md`

## Agent Enforcement Rule (Constitution I — Specification-First)

BEFORE implementing any feature, change, or addition, the agent MUST:
1. Check whether a task entry exists in `specs/001-vizex/tasks.md` for the requested work.
2. If no task exists, STOP and offer to add the task (and any needed spec/plan updates) first.
3. Only proceed with implementation after the human confirms the task is documented.

This applies to every implementation request without exception.
<!-- SPECKIT END -->
