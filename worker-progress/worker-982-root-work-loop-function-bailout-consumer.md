# Worker 982 - Root Work Loop FunctionComponent Bailout Consumer

Date: 2026-05-11

## Summary

Added a root-work-loop-level private canary that consumes Worker 921's
FunctionComponent begin-work bailout blocker after an accepted
FunctionComponent single-child mount path.

The proof is intentionally test-only. It does not open public renderer behavior,
public root behavior, React DOM/native/test-renderer compatibility, Scheduler
compatibility, package compatibility, component invocation, host mutation, or a
root current switch.

## Changed Files

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-982-root-work-loop-function-bailout-consumer.md`

## Evidence Gathered

- Exposed Worker 921's private FunctionComponent bailout blocker through a
  `#[cfg(test)] pub(crate)` wrapper in `begin_work.rs`; the underlying helper
  remains private.
- Recorded source-owned mount evidence from the accepted FunctionComponent
  single-child mount path, including HostRoot render identity, the
  FunctionComponent fiber, the accepted single child, complete-work handoff
  evidence, finished-work commit handoff evidence, root currentness, lane state,
  and compatibility blockers.
- Added a root-work-loop consumer that validates the accepted mount source,
  validates the next HostRoot render/currentness, rejects non-FunctionComponent
  root children, validates the FunctionComponent work-in-progress alternate, and
  then delegates to Worker 921's bailout blocker.
- Recorded host operation count and root current before/after consumption to
  prove the bailout consumer does not invoke the component, mutate host output,
  switch root current, or claim renderer compatibility.
- Added negative coverage for changed props, scheduled component lanes, context
  dependency lanes, child lanes, memo/simple memo tag smuggling, ViewTransition
  smuggling, stale/cloned/caller-shaped/missing source evidence, and public
  renderer/root/Scheduler/package compatibility claims.

## Related Worker Context

- Worker 921 is the direct producer: this worker consumes its begin-work
  FunctionComponent bailout blocker and keeps the original blocker private.
- Workers 878 and 879 are adjacent root-work-loop execution/currentness context:
  this worker follows the same private source-owned evidence pattern and stays
  separate from deletion and broader host mutation execution claims.
- Worker 917 is adjacent committed-fiber currentness context only; this worker
  does not consume its direct inspection rows.
- Worker 943 is adjacent FunctionComponent render-phase currentness context
  only; this worker does not stage or expose render-phase updates.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features begin_work_function_component_bailout_blocker
cargo test -p fast-react-reconciler --all-features root_work_loop_function_component_bailout
cargo test -p fast-react-reconciler --all-features root_work_loop
cargo test -p fast-react-reconciler --all-features
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

## Verification

- `begin_work_function_component_bailout_blocker`: passed, 4 tests.
- `root_work_loop_function_component_bailout`: passed, 5 tests.
- `root_work_loop`: passed, 114 tests.
- Full `fast-react-reconciler` package: passed, 859 unit tests and 1 doctest.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- This remains a private/test-only root-work-loop canary. Public renderer,
  public root, React DOM/native/test-renderer, Scheduler, package, and broader
  bailout compatibility remain blocked.
- The positive path is intentionally narrow: accepted FunctionComponent mount,
  single child, same props, no relevant component lanes, no context lane, and no
  child lane traversal.
