# Worker 362: Passive Effect Unmount Destroy Order Private

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active status from `get_goal`: `active`.
- Active objective from `get_goal`: strengthen private passive destroy
  execution so multiple unmount records execute in React-like deterministic
  order before mount creates, with errors recorded without stopping later
  eligible records.

## Summary

- Strengthened private passive callback invocation so accepted destroy requests
  are collected and sorted by pending passive order before any accepted create
  request runs.
- Strengthened the private destroy-executor path to collect eligible unmount
  destroy records and sort by pending passive order before execution, instead
  of relying on the current flush record vector shape.
- Added a focused canary with two update unmount destroys and two mount creates:
  the first destroy reports an error, the second destroy still runs, and both
  creates run only after all destroys.
- Kept public passive effect execution, scheduler-driven passive execution, and
  public `act` compatibility blocked.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-362-passive-effect-unmount-destroy-order-private.md`

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read worker reports 157, 173, 326, 331, and 349. Worker report 361 was not
  present in this worktree.
- Inspected the existing pending passive state, passive flush skeleton,
  function-component passive handoff records, and accepted private callback
  invocation/destroy executor paths.
- Checked React 19.2.6 reference source:
  `flushPassiveEffectsImpl` runs passive unmount effects before passive mount
  effects; hook passive unmount traverses the effect ring in order; destroy
  callback errors are captured without becoming public `act` behavior.
- No nested agents were used.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features passive_effects
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features
git diff --check
git add --intent-to-add worker-progress/worker-362-passive-effect-unmount-destroy-order-private.md && git diff --check; rc=$?; git reset -- worker-progress/worker-362-passive-effect-unmount-destroy-order-private.md >/dev/null; exit $rc
```

Additional inspection used `sed`, `rg`, `ls`, `git status --short`,
`git diff --stat`, `git diff`, and `get_goal` against the required docs,
worker reports, local reconciler files, and pinned React reference source.

## Verification Results

- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-reconciler --all-features passive_effects` passed:
  18 matching tests.
- `cargo test -p fast-react-reconciler --all-features` passed: 299 unit tests
  and 1 compile-fail doctest.
- `git diff --check` passed, including a report-inclusive run with the new
  progress file intent-to-add.

## Risks Or Blockers

- No blockers.
- The path remains private and test-controlled. It does not wire public
  `useEffect`, renderer passive flushing, scheduler-driven passive execution,
  DOM/test-renderer facades, or public `act`.
- Returned destroy handles from create callbacks are still recorded only in the
  private gate snapshot and are not written back to committed hook-effect
  storage.

## Recommended Next Tasks

- Add committed hook-effect ownership/traversal so passive destroy/create
  records can be discovered without caller-supplied canary handoff metadata.
- Define the committed lifecycle for clearing executed destroy handles and
  storing create-returned destroy handles.
- Keep public effect and renderer `act` compatibility behind separate
  conformance gates until the private lifecycle is complete.
