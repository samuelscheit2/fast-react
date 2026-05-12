# worker-1147-napi-root-work-loop-json-roundtrip

## Progress

- Read `WORKER_BRIEF.md`.
- Inspected `crates/fast-react-napi/src/root_work_loop_metadata.rs` and existing root work-loop metadata tests.
- Plan: add crate-private JSON string and admission helpers that validate exact JS-keyed metadata shapes and reject broadened/private capability claims via structured `serde_json::Value` checks.
- Implemented crate-private JSON string, `Value` admission, and string admission helpers.
- Added focused Rust tests for adapter JSON roundtrip and hostile JSON rejection.

## Verification

- `cargo test -p fast-react-napi --lib root_work_loop_finished_work_metadata` passed: 13 passed, 80 filtered.
- `cargo test -p fast-react-napi --lib` passed: 93 passed.
- `npm --prefix bindings/node run check` passed; npm emitted the existing `minimum-release-age` config warning.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` passed: 77 passed.
- `cargo fmt --all --check` passed after applying rustfmt to the touched Rust files.
- `git diff --check` passed.

## Notes

- Scope limited to `crates/fast-react-napi/src/root_work_loop_metadata.rs`, `crates/fast-react-napi/src/tests.rs`, and this progress file.
- No N-API dependency, `.node` loading, public React DOM facade, or DOM mutation path was added.
