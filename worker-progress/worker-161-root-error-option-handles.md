Worker 161: Root Error Option Handles

Goal status: complete
Goal objective: strengthen root option storage for uncaught/caught/recoverable error callback handles and option parsing records, without implementing actual render error capture or public React DOM warnings

Progress:
- Initialized worker goal and recorded active status/objective.
- Read `WORKER_BRIEF.md`, worker 138 refresh notes, worker 135 root bridge refresh notes, local root option/root store code, and React 19.2.6 `ReactDOMRoot.js` option parsing reference. Did not read `ORCHESTRATOR.md`.
- Updated `RootOptions` storage to wrap a typed `RootOptionsRecord` with a nested `RootErrorCallbackHandles` record for `onUncaughtError`, `onCaughtError`, and `onRecoverableError`.
- Kept root error callbacks inert: no render error capture, callback invocation, React DOM warnings, DOM package changes, native handle tables, or test-renderer public errors were added.
- Added default/custom handle coverage in `root_config` and extended root creation storage tests in `fiber_store`.

Changed files:
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `worker-progress/worker-161-root-error-option-handles.md`

Verification:
- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-reconciler --all-features root_config` passed.
- `cargo test -p fast-react-reconciler --all-features fiber_root` passed.
- `cargo test -p fast-react-reconciler --all-features fiber_store` passed.
- `cargo test -p fast-react-reconciler --all-features` passed: 95 unit tests and 1 doc-test after integrating current `main`.
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings` passed.
- `git diff --check` passed.

Integration with current main:
- Merged current `main` after implementation and reran the full verification
  set above on the integrated worker branch.

Risks / notes:
- The new typed records are crate-internal because this worker's write scope excluded public crate export wiring. A future native/JS bridge worker can expose or convert into this record shape when that bridge is implemented.
- `RootErrorCallbackHandle` remains the shared opaque type for uncaught and caught callbacks; the root option fields and nested record keep the handles distinct by name.
