# Worker 639: Test Renderer toJSON After Native Execution

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Add private toJSON evidence that
  consumes accepted native create/update/unmount execution records for a
  minimal tree without exposing public serialization compatibility.
- Latest `get_goal` before finalizing still reported status `active` with the
  same objective.
- No nested managed agents, explorers, or subagents were spawned.

## Summary

- Added Rust private `toJSON` native-execution evidence records for create,
  update, and unmount. The records consume the accepted create-route admission,
  update-route admission, and unmount native-bridge admission diagnostics, then
  tie them to minimal private `toJSON` output evidence.
- Added Rust rejection coverage for stale update execution evidence.
- Extended the CJS development private `toJSON` facade with hidden helpers that
  consume accepted private root execution results for create/update/unmount and
  produce a private diagnostic result without opening public `toJSON`.
- Added production CJS static/private helper parity for the new hidden evidence
  path while keeping broader public/private compatibility claims unchanged.
- Public serialization, public routing, native addon loading, and compatibility
  flags remain blocked.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-639-test-renderer-tojson-after-native-execution.md`

## Commands Run And Results

- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`: passed.
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`: passed.
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`: passed.
- `cargo fmt --all`: applied formatting.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-test-renderer --all-features to_json -- --nocapture`: passed, 14 tests.
- `cargo test -p fast-react-test-renderer --all-features json -- --nocapture`: passed, 20 tests. Existing `fast-react-reconciler` dead-code warnings were emitted.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`: passed, 22 tests.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`: passed, 7 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed. npm printed the existing `minimum-release-age` warning.
- `git diff --check`: passed.
- `git status --short`: showed only this worker's scoped files before commit.

## Evidence Gathered

- Read `WORKER_BRIEF.md`.
- Read relevant worker reports for workers 610, 611, 612, 540, and 424.
- Also read worker reports for workers 423, 332, 307, and 391 to align the new
  private `toJSON` evidence with the private root execution bridge and existing
  private serialization facade.
- Inspected Rust `toJSON` diagnostics, create-route admission, update-route
  admission, unmount native-bridge admission, and focused unit tests.
- Inspected CJS private root execution result consumption and the hidden
  `fast.react_test_renderer.private_tojson_serialization_facade` path.
- Confirmed the new CJS test consumes accepted private root execution results
  for create, update, and unmount and still reports
  `publicSerializationAvailable`, `nativeExecution`, and
  `compatibilityClaimed` as false.

## Risks Or Blockers

- No blockers remain for this worker objective.
- The create-side Rust admission evidence is accepted canary metadata from the
  private create-route admission path; it is used as native-route evidence for
  the same minimal host tree shape, not as proof of public `create().toJSON()`.
- The new CJS helpers are hidden behind private symbols and require caller
  supplied accepted execution and private host-output diagnostics. Public
  `create().toJSON()` still throws.

## Recommended Next Tasks

- Keep public `toJSON`, `toTree`, TestInstance, act, and root lifecycle
  compatibility blocked until a real native addon/export and public dual-run
  React 19.2.6 evidence exist.
- When native host-output traversal broadens beyond the minimal tree, add a
  separate private evidence gate for non-minimal create/update/unmount shapes.
