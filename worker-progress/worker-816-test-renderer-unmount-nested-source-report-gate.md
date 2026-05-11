# Worker 816 - test-renderer unmount/nested source-report gate

## Summary

- Added a Rust-only private `TestRendererPrivateUnmountNestedSourceReportAdmissionGate`
  that consumes Worker 736 nested `toJSON` source-report finished-work identity
  and Worker 733 unmount finished-work/deletion-cleanup identity before any
  wider serialization or native bridge claim.
- The gate requires accepted `finished_work`/`finished_lanes` identity,
  nested update route admission, committed nested source-report ownership,
  unmount route admission, deletion handoff, cleanup ordering, and host-node
  cleanup metadata.
- Added negative coverage for missing, stale, foreign, and tampered identity
  or handoff evidence, broad multichild identity, public `toJSON`/`toTree`/
  `TestInstance` flags, JS/CJS/package compatibility flags, native bridge
  loading/execution flags, and public compatibility flags.
- Kept the scope private. No JS/CJS/package surface, public serialization,
  native bridge loading, or native execution path was opened.
- Audit follow-up: tightened nested source-report ownership by requiring the
  placed nested text source node to match the committed second HostText fiber
  from nested output inspection, and requiring nested text source nodes to have
  no child ordinals.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
  - Added private diagnostic constants, gate record/accessors, validation
    helpers, source-report ownership checks, and focused tests.
- `worker-progress/worker-816-test-renderer-unmount-nested-source-report-gate.md`
  - This report.

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-test-renderer private_unmount_nested_source_report --all-targets --all-features`
- `cargo test -p fast-react-test-renderer root_private_to_json_nested --all-targets --all-features`
- `cargo test -p fast-react-test-renderer unmount --all-targets --all-features`
- `cargo test -p fast-react-test-renderer serialization_finished_work_identity --all-targets --all-features`
- `cargo test -p fast-react-test-renderer --all-targets --all-features`
- `cargo fmt --all --check`
- `git diff --check`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" crates/fast-react-test-renderer/src/lib.rs worker-progress || true`

Audit follow-up:

- `cargo fmt --all`
- `cargo test -p fast-react-test-renderer private_unmount_nested_source_report --all-targets --all-features`
- `cargo test -p fast-react-test-renderer root_private_to_json_nested --all-targets --all-features`
- `cargo test -p fast-react-test-renderer unmount --all-targets --all-features`
- `cargo fmt --all --check`
- `git diff --check`

## Evidence Gathered

- Focused gate tests passed: 3 tests covering accepted Worker 733/736 evidence,
  stale/foreign/tampered handoffs, public/native/package claims, and broad
  multichild rejection.
- Audit follow-up focused gate tests passed, including a tampered placed-text
  source-node fiber negative case.
- Adjacent nested, unmount, and generic finished-work identity filters passed.
- Full `fast-react-test-renderer` crate test passed: 166 tests.
- Clippy, formatting, diff whitespace, and conflict-marker checks passed.

## Risks Or Blockers

- Test-renderer overlap is expected. Merge conflicts are likely around
  `crates/fast-react-test-renderer/src/lib.rs` because several workers are
  adding adjacent private diagnostics and tests.
- This gate intentionally does not claim public `toJSON`, `toTree`,
  `TestInstance`, JS/CJS/package compatibility, or native bridge loading/
  execution.
- The gate validates the accepted nested source-report shape only
  (`NestedHostText`) and keeps broad multichild identity unavailable.

## Recommended Next Tasks

- Merge after resolving any nearby test-renderer diagnostic conflicts.
- Keep future public/native/package admission work separate and require this
  gate or equivalent evidence before widening surface claims.
