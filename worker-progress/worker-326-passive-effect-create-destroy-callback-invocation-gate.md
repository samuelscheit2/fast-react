# Worker 326: Passive Effect Create/Destroy Callback Invocation Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report. It returned status `active`.
- Active objective recorded from `get_goal`: add a private passive-effect
  callback invocation gate that consumes accepted create/destroy callback
  handles only under explicit test control, records callback ordering and
  errors, and keeps public effect execution and act compatibility blocked.

## Summary

- Added a crate-private passive-effect callback invocation gate in
  `passive_effects.rs`.
- The existing passive flush path remains data-only: flush records still report
  `create_callback_invoked()` and `destroy_callback_invoked()` as false.
- The new gate consumes a `PassiveEffectsFlushResult` by value and requires an
  explicit `PassiveEffectCallbackInvocationTestControl` implementation before
  any accepted create/destroy handle can be invoked.
- Gate snapshots record invocation order, source flush metadata, create vs
  destroy phase, callback handle, returned destroy handle for create callbacks,
  and per-callback error handles.
- Public effect execution, scheduler-driven passive execution, and public `act`
  compatibility remain blocked and are exposed as explicit false blockers on
  the gate snapshot.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-326-passive-effect-create-destroy-callback-invocation-gate.md`

`crates/fast-react-reconciler/src/function_component.rs` was inspected through
the accepted passive metadata path; no code change was needed there because the
existing handoff already carries create and destroy callback handles.

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read required worker reports 173, 197, 224, 250, 279, 296, 301, and 303.
- Inspected the current passive flush, function-component passive metadata, root
  passive commit handoff, and root callback/ref callback gate patterns.
- Checked the pinned React 19.2.6 reference source for passive flush ordering:
  passive unmounts run before passive mounts, create callbacks store destroy
  callbacks, and commit-phase errors are captured instead of exposed through
  public `act`.
- No nested agents or explorer subagents were used.

## Tests Added

- Callback-less passive flush records are skipped and no test-control callbacks
  run.
- Update passive effects invoke destroy before create under explicit test
  control, preserving source flush order and callback metadata.
- Create and destroy callback errors are recorded in invocation order without
  scheduling public callbacks, host operations, or act work.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features passive_effects
cargo fmt --all --check
git diff --check
cargo test -p fast-react-reconciler --all-features
```

Additional inspection commands included `sed`, `nl`, `rg`, `wc`, `git status
--short`, `git diff --stat`, and `get_goal` reads of project context, worker
reports, local reconciler/core files, and the pinned React reference source.

## Verification Results

Passed:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features passive_effects
cargo test -p fast-react-reconciler --all-features
git diff --check
```

Focused passive-effects result: 14 matching tests passed.

Full reconciler result: 275 unit tests passed plus 1 compile-fail doctest.

## Risks Or Blockers

- No blockers.
- The gate intentionally models private test-controlled invocation only. It does
  not wire public `useEffect`, scheduler-driven passive execution, DOM or
  test-renderer effect behavior, or public `act`.
- Returned destroy handles are recorded in the gate snapshot but are not yet
  written back to hook-effect instances. A later hook-effect ownership worker
  should define that lifecycle rule.

## Recommended Next Tasks

- Add committed hook-effect storage and traversal so passive handoff records can
  be discovered without caller-provided canary metadata.
- Define how create-returned destroy handles are stored, replaced, and cleared
  in hook-effect instances after private invocation succeeds.
- Keep public React hook/effect compatibility and renderer `act` behavior behind
  separate conformance gates until the private lifecycle is complete.
