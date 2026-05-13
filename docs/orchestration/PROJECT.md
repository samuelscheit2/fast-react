# Orchestration Project

Project name: Fast React
Worker report dir: worker-progress
Worktree root: ../fast-react-worktrees
Branch prefix: worker
Session prefix: fr
Worker worktree marker: fast-react-worktrees/worker-
Plan head regex: Current root head is main `([0-9a-f]+)`
Active worker regex: Active Worker\s+(\d+)
Task worker id regex: ^worker-(\d+)
Gate keywords: gate, currentness, ledger, blocker, alias, denylist

## Context Files

- docs/orchestration/PROJECT.md
- MASTER_PLAN.md
- MASTER_PROGRESS.md
- docs/orchestration/state.json

## Seeder Guidance

Seed tasks from the current queue and near-term sequencing in `MASTER_PLAN.md`.
Avoid active workers, reserved idle worktrees, rejected/superseded branches, and
anything that would claim broader public compatibility without accepted evidence
from `MASTER_PROGRESS.md`. Prefer narrow behavior, repair, audit, docs, cleanup,
or scout tasks with explicit write scope, non-scope, verification, and hostile
cases.
