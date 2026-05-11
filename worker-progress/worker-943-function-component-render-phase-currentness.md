# Worker 943 - FunctionComponent Render-Phase Currentness

## Summary

- Strengthened the private FunctionComponent render-phase canary path so
  state/reducer render-phase updates stage through a source-owned
  `HookUpdateStaging` gate before entering hook queue pending rings.
- Bound render-phase evidence to the active FunctionComponent fiber/current
  alternate, hook list, hook queue/update generations, render attempt id,
  staging generation, render lanes, and the bailout/context blocker state from
  the Worker 921 path.
- Preserved the public compatibility boundary: no public hook dispatcher, public
  root, Scheduler, act, renderer, effect execution, or root scheduling claim was
  opened.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `worker-progress/worker-943-function-component-render-phase-currentness.md`

## Currentness Path

`enqueue_*_render_phase_update_for_canary` now validates the dispatch binding
against the active render state, checks that the update lane is included in the
active render lanes, records queue/update generation evidence, and stages a
source-owned row in `FunctionComponentRenderPhaseUpdateGate`.

`finish_staged_render_phase_updates_for_canary` rejects stale render attempts,
stale staging generations, bailout/context aliases, wrong fiber/hook queue rows,
caller-built rows, and lane mismatches before delegating to
`HookUpdateStaging::finish_queueing`. Core staging failure preservation remains
observable: failed drains leave staged rows and queue pending rings unchanged.

## Tests And Checks

- `cargo test -p fast-react-reconciler --all-features render_phase`
- `cargo test -p fast-react-reconciler --all-features hook_staging`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`

## Evidence

- Positive canary: current render-phase update staging records attempt,
  queue/update generation, lanes, blocker state, source-owned currentness, and
  non-escape to the root scheduler.
- Negative canaries: stale render attempt, replay after staging failure,
  wrong fiber/hook queue, lane mismatch, bailout/context alias, caller-built
  rows, and public hook/root/Scheduler/act/renderer compatibility claims.
- Existing unsupported hook behavior, root scheduling behavior, effect metadata
  boundaries, and renderer compatibility blockers remain covered by the
  `function_component` filter.

## Risks Or Blockers

- This is intentionally private/test-only canary hardening. Render-phase updates
  still do not expose a public hook dispatcher or scheduler-visible renderer
  behavior.
- Overlap risk is limited to nearby private FunctionComponent canaries and any
  future workers touching the same render-phase gate or begin-work bailout
  blocker evidence shape.

## Recommended Next Tasks

- When public hook dispatch/root scheduling work begins, keep this staged
  currentness gate as the private regression layer before exposing any
  renderer-facing compatibility.
