# Worker 781: Passive Destroy/Create Scheduler Preflight

## Summary

- Added a crate-private passive destroy/create scheduler preflight record in
  `passive_effects.rs`.
- The preflight consumes an accepted passive scheduler flush request only after
  validating it against the commit pending-passive handoff.
- It then runs the existing private test-control passive callback gate over the
  scheduled flush result, proving destroy-before-create callback order without
  claiming public passive effect, public act, public root work, or public
  Scheduler behavior.
- Rejection coverage proves foreign scheduler gates and stale committed fibers
  fail before callback invocation or pending-passive consumption.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-781-passive-destroy-create-scheduler-preflight.md`

## Commands Run

- `cargo fmt --all`: passed.
- `cargo test -p fast-react-reconciler --all-features scheduler_preflight -- --nocapture`: passed, 3 tests.
- `cargo test -p fast-react-reconciler --all-features passive -- --nocapture`: passed, 79 tests.
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`: passed.
- `cargo fmt --all --check`: passed after applying formatter output for the long test name.
- `npm run check:package-surface`: passed; npm emitted the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `git diff --check`: passed.

## Evidence Gathered

- `passive_effects_scheduler_preflight_invokes_private_destroy_before_create_without_public_claim`
  schedules a private passive flush, validates request metadata, flushes
  committed passive records, invokes test-control destroy/create callbacks, and
  proves destroy invocation order and pending passive order both precede create.
- The same canary asserts public passive flushing, public act compatibility,
  public root work, public Scheduler package behavior, and scheduler-driven
  public passive execution claims remain false.
- `passive_effects_scheduler_preflight_rejects_foreign_scheduler_gate_before_consuming`
  rejects a scheduler gate from another root before callbacks and keeps the
  target root pending passive handoff intact.
- `passive_effects_scheduler_preflight_rejects_stale_committed_fiber_before_callbacks`
  rejects committed passive records for a function fiber outside the committed
  finished-work subtree before callbacks and before clearing pending passive
  state.

## Risks Or Blockers

- No blocker remains for this worker scope.
- This is still private Rust canary evidence. It does not enable public
  `useEffect`, public `act`, public root execution, React DOM/test-renderer
  behavior, or package surface changes.

## Recommended Next Tasks

- Wire public passive scheduling only after renderer roots, public act timing,
  root work execution, and callback error semantics are admitted together.
