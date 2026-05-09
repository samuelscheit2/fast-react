# Worker Progress Files

Each worker owns exactly one progress file named `worker-progress/<worker-id>.md`.

Workers must record:

- Assigned objective
- Files and directories they are allowed to modify
- Current hypothesis or implementation plan
- Commands run and relevant output
- Decisions made
- Blockers or questions for the orchestrator
- Final changed files
- Tests or checks run before handoff

Workers should keep their writes inside their assigned scope unless the orchestrator explicitly expands it.
