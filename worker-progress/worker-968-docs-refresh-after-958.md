# Worker 968 - Docs Refresh After Worker 958

## Summary

- Refreshed `MASTER_PLAN.md` for accepted main baseline `b625e49c`
  (`Merge worker 965 private admission 739-745 evidence refresh`).
- Removed Worker 958 from future/current review sections and added it as
  accepted private React DOM input/change currentness evidence.
- Added accepted history for Worker 963's docs refresh, Worker 958's
  source-owned input/change extraction and controlled-restore currentness path,
  and Worker 965's private admission 739-745 evidence refresh.
- Kept Worker 910 and Worker 949 as active unresolved blockers, recorded
  Workers 964, 966, and 967 as active conformance repair lanes, and kept Worker
  966 unaccepted after its source-authority audit returned DO NOT MERGE.

## Changed Files

- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-968-docs-refresh-after-958.md`

## Evidence Gathered

- Read `ORCHESTRATOR.md`, `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read Worker 958, Worker 963, and Worker 965 progress reports.
- Reviewed recent accepted React DOM/resource/form/event reports for Workers
  883, 912, 927, 939, 944, 947, and 952.
- Reviewed merge history for `8b2bbeeb`
  (`Merge worker 963 docs refresh after workers 957 953 954`) and `43379920`
  (`Merge worker 958 input change currentness`), then fast-forwarded to
  `b625e49c` (`Merge worker 965 private admission 739-745 evidence refresh`)
  after Worker 965 was accepted.
- Checked live worker state: Worker 910 and Worker 949 remain active unresolved
  blockers; Workers 964, 966, and 967 are active or pending conformance repair
  lanes and are not accepted history until merged. Worker 966 is active repair
  after caller-shaped/non-source evidence-context audit blockers.

## Checks

- `rg -n "...markdown/prose patterns..." package.json scripts .github docs README.md`
  found no markdown/prose lint script relevant to these docs.
- Package script scan found only markdown-print helper scripts under
  `tests/conformance/package.json`, not markdown/prose validation commands.
- Line-length scan for changed docs passed:
  `awk 'length($0) > 100 { ... }' MASTER_PLAN.md MASTER_PROGRESS.md
  worker-progress/worker-968-docs-refresh-after-958.md`.
- Stale current-queue scan no longer finds Worker 958 as unaccepted in
  `MASTER_PLAN.md`.
- `git diff --check` passed.
- `git diff --cached --check` passed after staging.

## Risks Or Blockers

- No docs blocker found.
- Worker 910, Worker 949, and Workers 964, 966, and 967 remain unaccepted and
  should not be used as accepted evidence until fresh reviewed merges land.
- Public roots, event dispatch, controlled inputs, hydration, resources/forms,
  Scheduler timing, native/test-renderer behavior, and package compatibility
  remain blocked.
