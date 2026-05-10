# Worker 296: Passive Effect Callback Handle Flush Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active status recorded from `get_goal`: `active`.
- Active objective recorded from `get_goal`: Extend the passive effect flush
  gate with data-only create/destroy callback handle metadata. Prove
  unmount-before-mount ordering and effect ID carry remain stable while actual
  effect callback execution stays blocked.

## Summary

- Threaded passive hook `create` and existing instance `destroy` callback
  handles through function-component passive metadata without taking or invoking
  either handle.
- Extended function-component passive commit handoff records with data-only
  callback handles while preserving existing effect id, instance id, lane,
  pending-order, and pending passive count validation.
- Extended passive flush effect records with phase-specific callback metadata:
  unmount records carry only the destroy handle, mount records carry only the
  create handle, and both expose inert `*_callback_invoked()` blockers that
  remain false.
- Added focused tests proving update unmount-before-mount ordering, effect id
  carry, create/destroy handle carry, and unchanged no-host/no-callback
  execution behavior.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-296-passive-effect-callback-handle-flush-gate.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`; did not
  read `ORCHESTRATOR.md`.
- Read worker reports 173, 250, 279, 284, and 285.
- Inspected current `function_component.rs`, `root_commit.rs`, and
  `passive_effects.rs` passive metadata, handoff, and flush paths.
- Checked the pinned React 19.2.6 reference source around passive mount/unmount
  effect list helpers. React stores create on the effect node, destroy on the
  effect instance, runs passive unmount before passive mount, and executes the
  callbacks in those later commit helpers. This worker only mirrors the data
  shape and keeps execution blocked.
- No nested agents or explorer subagents were used.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features function_component
cargo test -p fast-react-reconciler --all-features root_commit
cargo test -p fast-react-reconciler --all-features passive_effects
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features
git diff --check
```

Additional inspection commands used `sed`, `rg`, `git status --short`, and
`git diff` reads of required docs, worker reports, reconciler files, and the
pinned React reference source.

## Verification Results

Passed:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features function_component`: 39
  matching tests passed.
- `cargo test -p fast-react-reconciler --all-features root_commit`: 21
  matching tests passed.
- `cargo test -p fast-react-reconciler --all-features passive_effects`: 9
  matching tests passed.
- `cargo test -p fast-react-reconciler --all-features`: 240 unit tests passed
  plus 1 compile-fail doctest.
- `git diff --check`

## Risks Or Blockers

- No blockers.
- This remains a private data-only flush gate. It does not discover passive
  effects from committed fibers, execute create/destroy callbacks, schedule
  public `act`, mutate host output, or integrate JS renderers.
- Destroy handles are copied from the current hook effect instance metadata and
  intentionally left in place; future real execution must own when a destroy is
  taken, cleared, or replaced by a create return value.

## Recommended Next Tasks

- Define committed fiber storage and traversal for function-component effect
  rings before removing caller-supplied handoff records from the flush canary.
- Add a later guarded worker for actual passive create/destroy execution, with
  explicit error handling and callback lifetime rules.
- Keep public `useEffect`, renderer integration, scheduler-driven passive
  execution, and public `act` behavior separate until the private execution path
  is proven.
