# Worker 1144 - N-API metadata JSON adapter

## Status

- Started in `/Users/user/Developer/Developer/fast-react-worktrees/worker-1144-napi-metadata-json-adapter` on branch `worker/1144-napi-metadata-json-adapter`.
- Read `WORKER_BRIEF.md`.
- Inspected the Rust metadata builder/tests and the existing JS placeholder factory shape.
- Implemented the crate-private JSON value adapter and focused Rust tests.
- Verification passed.

## Summary

- Added `root_work_loop_finished_work_metadata_json_value(&RootWorkLoopFinishedWorkMetadata)` in `crates/fast-react-napi/src/root_work_loop_metadata.rs`.
- The adapter projects only the already validated metadata struct into the JS-facing camelCase shape used by the placeholder factory, including `metadataRevision`, `completeWork`, `recordsFinishedWork`, `finishedWorkAfterCommit`, `renderPhaseWorkAfterCommit`, `applyKind`, and `siblingStatus`.
- Added a diagnostic-backed JSON shape test with canonical `<div>text</div>` values and explicit snake_case absence checks.
- Added a validation-before-conversion test proving hostile diagnostic evidence fails in the existing builder before the JSON adapter runs.

## Changed Files

- `crates/fast-react-napi/src/root_work_loop_metadata.rs`
- `crates/fast-react-napi/src/tests.rs`
- `worker-progress/worker-1144-napi-metadata-json-adapter.md`

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-napi --lib`
- `cargo fmt --all --check`
- `npm --prefix bindings/node run check`
- `git diff --check`

## Evidence Gathered

- `cargo test -p fast-react-napi --lib`: 91 tests passed, including the new JSON shape and fail-closed conversion tests.
- `npm --prefix bindings/node run check`: native private metadata factory, loader, no-load guard, and ESM loader checks passed.
- `cargo fmt --all --check` and `git diff --check` passed.

## Audit, Review, Or Nested-Agent Findings

- No nested agents used.
- Read-only comparison against `bindings/node/index.cjs` and native loader tests confirmed the exact existing JS placeholder factory field names.

## Risks Or Blockers

- No blockers.
- Residual risk is limited to future drift if the JS placeholder factory changes without updating this private Rust adapter; the new exact-shape test should make drift visible on the Rust side once expected fields are updated.

## Recommended Next Tasks

- When the native binding is introduced, route its object creation through this adapter or a direct equivalent rather than accepting raw JS maps.
