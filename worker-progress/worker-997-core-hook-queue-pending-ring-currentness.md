# Worker 997 - Core Hook Queue Pending-Ring Currentness

## Summary

- Added a crate-private, source-owned hook state queue source record that binds
  a state hook slot/list, queue id, queue generation, and base queue snapshot
  before a pending update can use the hardened drain path.
- Added a crate-private pending-update source record in the hook queue store and
  a source-currentness drain for staged hook updates. The hardened drain
  preflights hook-list source ownership, queue/update generations, lane/source
  identity, duplicate staged ids, already linked updates, existing pending-ring
  integrity, and consumed source records for both staged updates and existing
  pending-ring nodes before mutating pending-ring links or clearing staging.
- Added focused core canaries for missing and caller-shaped currentness,
  no-source and caller-shaped existing pending rings, cross-queue and
  cross-list smuggling, stale hook/list/queue/update ids, duplicate staged ids,
  pre-linked updates, corrupt existing rings, replay, and success one-shot
  consumption.

## Changed Files

- `crates/fast-react-core/src/hook_list.rs`
- `crates/fast-react-core/src/hook_state_queue.rs`
- `worker-progress/worker-997-core-hook-queue-pending-ring-currentness.md`

## Evidence

- The positive path remains crate-private/test-only and does not expose a public
  hook dispatcher, root scheduling, Scheduler/act behavior, renderer behavior,
  or package compatibility.
- Existing `HookUpdateStaging::finish_queueing` behavior remains intact for
  accepted render-phase users; the new hardened path is a narrower source-owned
  canary layer for pending-ring currentness and failure preservation.
- Audit repair: the hardened path now rejects existing pending rings whose
  nodes lack consumed source-owned metadata or whose source points at a
  different queue/list.
- Failed hardened drains leave staged rows, queue pending tails, and unlinked
  staged updates observable.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-core --all-features source_owned_finish
cargo test -p fast-react-core --all-features hook
cargo test -p fast-react-core --all-features
cargo check -p fast-react-core --all-features
cargo fmt --all --check
git diff --check
```

## Verification Results

- Focused source-owned canaries: passed, 12 tests.
- Hook-filtered core tests: passed, 50 tests.
- Full `fast-react-core` tests: passed, 153 tests plus 0 doctests.
- Core check, formatting check, and whitespace diff check passed.

## Risks Or Blockers

- No blockers.
- The hardened path is intentionally private core/test-only evidence. It does
  not claim public hook execution, root scheduling, Scheduler/act behavior,
  renderer behavior, or package compatibility.
- The new source-owned path is additive; future render-phase or public hook work
  can opt into it once those layers mint source-owned hook-list/queue evidence.

## Recommended Next Tasks

- If a later worker wires this source-owned drain into reconciler render-phase
  canaries, keep the existing failure-preservation assertions before opening
  any public dispatcher or scheduler-visible behavior.
