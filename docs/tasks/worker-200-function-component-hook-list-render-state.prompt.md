# Worker 200: Function Component Hook List Render State

Objective: add a private function-component render-state foundation that
connects the accepted core `HookListArena` model to the reconciler
function-component render skeleton as inert metadata, without implementing
public hooks, a dispatcher, `renderWithHooks`, context propagation, child
reconciliation, effects, DOM/test-renderer integration, or public React hook
facades.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 136, 157, 158, 192, and 194.
- Inspect `crates/fast-react-core/src/hook_list.rs`,
  `crates/fast-react-reconciler/src/function_component.rs`, and
  `begin_work.rs`.
- Inspect React 19.2.6 `ReactFiberHooks.js` for mount/update hook list
  traversal invariants only.

## Write Scope

- Primary: `crates/fast-react-reconciler/src/function_component.rs`.
- Optional new private module if it reduces complexity:
  `crates/fast-react-reconciler/src/function_hooks.rs` plus a `lib.rs` module
  declaration.
- Report: `worker-progress/worker-200-function-component-hook-list-render-state.md`.
- Do not edit root work loop, root commit, sync flush, host work, JS packages,
  or master docs.

## Implementation Notes

- This is metadata-only. Do not add a hook dispatcher or public JS API.
- Prefer a narrow store/cursor record that can be tested independently.
- Tests should prove hook-list mount/update metadata can be associated with a
  FunctionComponent render request without mutating host output or committing.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo test -p fast-react-core --all-features hook_list`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

