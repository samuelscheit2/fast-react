# Worker 659: Layout Effect Destroy Create Commit Execution

## Goal Evidence

- `create_goal` was called first with objective: "add a private commit-phase layout effect execution gate for one update path, proving destroy-before-create ordering and error capture metadata without opening public layout effect behavior".
- `get_goal` confirmed the active goal status is `active`.
- Active objective from `get_goal`: add a private commit-phase layout effect execution gate for one update path, proving destroy-before-create ordering and error capture metadata without opening public layout effect behavior.

## Summary

- Added a separate crate-private layout effect update destroy/create execution gate on `HostRootCommitRecord`.
- The new gate validates the accepted update layout-create effect-list record, finds the matching mutation layout-destroy record, and invokes destroy before create under test control.
- Added local layout callback error-capture metadata carrying root, fiber, effect, callback, error handle, commit phase, and root error option callback handles.
- Kept public `useLayoutEffect`, public act aggregation, root error callbacks, passive callback execution, scheduler queues, React DOM, and test-renderer behavior blocked.
- Preserved the older create-only private layout gate so passive lifecycle evidence remains separate.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-659-layout-effect-destroy-create-commit-execution.md`

## Verification

- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-reconciler layout function_component root_commit -- --nocapture` was attempted, but Cargo rejected the extra filters with `unexpected argument 'function_component'`.
- `cargo test -p fast-react-reconciler -- --nocapture layout function_component root_commit` passed: 173 passed.
- Equivalent focused filters passed:
  - `cargo test -p fast-react-reconciler layout -- --nocapture`: 10 passed.
  - `cargo test -p fast-react-reconciler function_component -- --nocapture`: 100 passed.
  - `cargo test -p fast-react-reconciler root_commit -- --nocapture`: 77 passed.
- Earlier focused check passed: `cargo test -p fast-react-reconciler layout_effect -- --nocapture`: 7 passed.
- `git diff --check` passed.
- `git diff --check` with the new progress file included by `git add --intent-to-add` passed.

## Notes

- No nested managed agents were spawned.
- No changes were needed in `function_component.rs`; existing layout update metadata already carries the previous effect, destroy callback, dependency status, and lanes needed by the new gate.
