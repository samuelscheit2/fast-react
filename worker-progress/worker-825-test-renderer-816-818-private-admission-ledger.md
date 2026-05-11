# Worker 825 - test-renderer 816/818 private admission ledger

## Summary

- Added a static/read-only conformance ledger for Worker 816 private
  test-renderer unmount/nested source-report admission evidence and Worker 818
  733-736 bridge ledger evidence.
- The ledger pins source-owned identifiers, status IDs, function names, field
  names, and source-owned constants only. It does not use worker progress
  reports, test files, panic text, or error-message reason text as evidence.
- The evaluator fails closed for missing/extra/duplicate workers, stale status
  IDs, missing required evidence, row-contract drift, bridge-ledger regression,
  static/read-only mode drift, public serialization/toJSON/toTree/TestInstance
  claims, JS/CJS/package claims, native bridge loading/execution claims,
  root/act/Scheduler claims, broad multichild identity claims, and public
  compatibility claims.
- No production Rust, package, native bridge, or renderer runtime code was
  changed.
- Audit follow-up: replaced Rust syntax-bearing `sliceStart`/`sliceEnd` anchors
  with durable source-owned names or unsliced source-token checks, and extended
  the evidence durability guard to cover `sliceStart` and `sliceEnd` as well as
  evidence tokens.

## Changed Files

- `tests/conformance/src/private-admission-825-test-renderer-816-818-ledger.mjs`
  - New static ledger and evaluator.
- `tests/conformance/test/private-admission-825-test-renderer-816-818-ledger.test.mjs`
  - New focused tests for accepted evidence and fail-closed cases.
- `worker-progress/worker-825-test-renderer-816-818-private-admission-ledger.md`
  - This report.

## Commands Run

- `node --check tests/conformance/src/private-admission-825-test-renderer-816-818-ledger.mjs`
- `node --check tests/conformance/test/private-admission-825-test-renderer-816-818-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-825-test-renderer-816-818-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-733-736-bridge-ledger.test.mjs`
- `node -e "import('./tests/conformance/src/private-admission-825-test-renderer-816-818-ledger.mjs').then((m) => { const ledger = m.evaluatePrivateAdmission825TestRenderer816818Ledger(); if (ledger.status !== m.PRIVATE_ADMISSION_825_LEDGER_STATUS) process.exit(1); })"`
- `cargo test -p fast-react-test-renderer private_unmount_nested_source_report --all-targets --all-features`
- `git diff --check`

Audit follow-up:

- `node --check tests/conformance/src/private-admission-825-test-renderer-816-818-ledger.mjs`
- `node --check tests/conformance/test/private-admission-825-test-renderer-816-818-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-825-test-renderer-816-818-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-733-736-bridge-ledger.test.mjs`
- `node --input-type=module - <<'EOF' ... anchor durability smoke ... EOF`
- `cargo test -p fast-react-test-renderer private_unmount_nested_source_report --all-targets --all-features`
- `git diff --check`

## Evidence Gathered

- The new ledger recognizes exactly Worker 816 and Worker 818 rows and rejects
  unexpected or duplicate worker IDs.
- Worker 816 evidence is read from
  `crates/fast-react-test-renderer/src/lib.rs` and pins the private
  unmount/nested gate status constants, gate fields, public/native/package
  blocker accessors, route/admission validators, nested source-report ownership
  validator, and gate validator.
- Worker 818 evidence is read from the existing 733-736 bridge ledger and pins
  bridge ledger IDs/status, required bindings, required evidence, row contract,
  evaluator result flags, and bridge violation IDs.
- The new test mutates copied source evidence to prove stale Worker 816 status
  evidence fails closed without consuming progress reports or test-title text.
- The new test passes bridge row overrides to prove Worker 818 bridge-ledger
  regressions fail closed.
- The audit follow-up test guard now rejects source syntax in `tokens`,
  `sliceStart`, and `sliceEnd`, including whitespace-bearing declaration
  anchors and punctuation-bearing snippets.
- Focused Rust tests for Worker 816's private gate passed: 3 tests, all ok.

## Risks Or Blockers

- This ledger intentionally stays static/read-only. It does not claim public
  `toJSON`, `toTree`, `TestInstance`, JS/CJS/package compatibility, native
  bridge loading/execution, root/act/Scheduler compatibility, broad multichild
  identity, or public compatibility.
- Merge conflict risk should be limited to nearby new conformance ledger files.
  No existing source or test files were edited.

## Recommended Next Tasks

- Keep future public/native/package admission work separate from this ledger and
  require this static ledger plus Worker 818's bridge ledger before widening
  test-renderer surfaces.
- Re-run the full conformance suite after merge if adjacent private-admission
  ledgers land concurrently.
