# Worker 688: Function Component Effect Dependency Update

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from latest `get_goal`: `active`.
- Active goal objective from latest `get_goal`: add private Rust evidence that
  effect dependency comparison schedules/skips destroy/create work correctly
  across function-component updates, without enabling public passive or layout
  effect behavior.

## Summary

- Added a private passive-effects canary that drives a function-component update
  through `update_effect_metadata_with_dependency_check`.
- The test proves changed dependencies schedule one passive destroy/create pair,
  while equal dependencies remain in the update queue as unchanged metadata and
  never reach pending passive callback execution.
- Public passive execution, public act compatibility, scheduler-driven passive
  execution, layout-effect behavior, host operations, and JS package facades
  remain untouched.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-688-function-component-effect-dependency-update.md`

## Commands Run And Results

- `cargo test -p fast-react-reconciler --all-features passive_effects_dependency_comparison_executes_changed_update_and_skips_equal -- --nocapture`: passed, 1 test.
- `cargo fmt --all --check`: initially failed on rustfmt wrapping in the new test.
- `cargo fmt --all`: passed and formatted the wrapping.
- `cargo test -p fast-react-reconciler --all-features function_component -- --nocapture`: passed, 102 tests.
- `cargo test -p fast-react-reconciler --all-features passive -- --nocapture`: passed, 74 tests.
- `cargo fmt --all --check`: passed after formatting.
- `git diff --check`: passed.
- `if rg -n "^(<<<<<<<|=======|>>>>>>>)" . --glob '!target/**' --glob '!node_modules/**'; then exit 1; else test $? -eq 1; fi`: passed with no conflict markers.

## Evidence Gathered

- The new test seeds two current passive effects on a function component, then
  updates both through dependency comparison: one with changed dependencies and
  one with equal dependencies.
- The function-component effect update queue records exactly one changed and one
  unchanged dependency result; only the changed record is accepted for pending
  passive work, and no layout effects are accepted.
- The pending passive handoff contains exactly one unmount and one mount, both
  for the changed effect. The unchanged effect's destroy callback remains in
  its hook effect instance but is absent from private destroy/create executor
  calls.
- The private callback executor path records destroy before create for the
  changed effect, preserves pending passive order, reports `TestControlOnly`,
  and keeps public effect, act, and scheduler-driven passive flags false.

## Risks Or Blockers

- No blockers.
- This is private Rust evidence only. It does not enable public `useEffect`,
  public `useLayoutEffect`, public act behavior, scheduler-driven passive
  behavior, root deletion cleanup changes, or JS package facade behavior.

## Recommended Next Tasks

- Add returned passive create destroy-handle persistence when the reconciler is
  ready to model committed effect instance mutation.
- Extend comparison-driven passive execution evidence to ordered multi-fiber
  traversal once broader committed effect-list ownership is settled.

## Nested Agents

- None.
