# worker-1228-native-metadata-no-load-source-ledger

## Summary

- Kept the exact-claim-blocker repair because current `main` would accept a
  full canonical source-currentness row set when omitted claim fields such as
  `nativeLoadAttempted`, `workerThreadLoadAttempted`, or
  `packageExportsChanged` were set to `true`; accepted-row freezing then erased
  those hostile fields.
- The product validator now rejects the omitted runtime/public-runtime,
  native-load, cleanup-hook, worker/child/network-load, and package-export
  claim names before canonical row acceptance.
- Added focused hostile tests for every newly listed exact field. Also covered
  the practical earlier gaps for standalone `packageExportCompatibility`,
  direct `proseEvidence`, and direct `errorMessageEvidence`.
- Merged current `main` before final verification, so the branch diff against
  `main` is limited to this follow-up repair.

## Changed Files

- `bindings/node/index.cjs`
- `bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs`
- `tests/conformance/src/private-admission-1228-native-metadata-no-load-source-ledger.mjs`
- `tests/conformance/test/private-admission-1228-native-metadata-no-load-source-ledger.test.mjs`
- `worker-progress/worker-1228-native-metadata-no-load-source-ledger.md`

## Evidence Gathered

- The accepted rows remain a source-owned Rust identifiers and JS factory shape
  check; no native artifact, worker, child process, network module, package
  export, renderer, cleanup hook, or public native execution is loaded or
  claimed.
- Direct native hostile coverage mutates one canonical row in a complete
  canonical set and proves each new exact claim field yields zero accepted rows,
  the expected rejection code, and no leaked hostile field on the frozen row.
- Known-field hostile coverage proves standalone `packageExportCompatibility`
  is rejected as a package-export claim and direct `proseEvidence` /
  `errorMessageEvidence` are rejected as prose evidence without relying on
  `evidenceKind`.
- Conformance now lists and classifies the exact omitted names in the 1228
  blocked-claim manifest and asserts the practical gap fields in the public
  blocker and non-source-evidence paths.

## Commands Run

- `git status --short --branch` - passed after merging `main`; only intended
  follow-up files were dirty.
- `git diff --check main..HEAD` - passed.
- `git diff --check` - passed.
- `node --check bindings/node/index.cjs` - passed.
- `node --check bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs` - passed.
- `node --check tests/conformance/src/private-admission-1228-native-metadata-no-load-source-ledger.mjs` - passed.
- `node --check tests/conformance/test/private-admission-1228-native-metadata-no-load-source-ledger.test.mjs` - passed.
- `node --test tests/conformance/test/private-admission-1228-native-metadata-no-load-source-ledger.test.mjs` - passed, 6 tests.
- `node bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs` - passed.
- `node bindings/node/test/native-no-load-guard.test.cjs` - passed.
- `npm --prefix bindings/node run check` - passed; npm emitted the existing
  `minimum-release-age` warning.
- `node tests/smoke/package-surface-guard.mjs` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `cargo test -p fast-react-napi --lib root_work_loop_finished_work_metadata` - passed, 13 tests.

## Audit, Review, Or Nested-Agent Findings

- No nested agents were used.
- The preexisting exact-claim-blocker edits were needed and were kept.
- The branch already contained the exact blocker product repair relative to
  `main`; this follow-up added the remaining focused hostile coverage and kept
  the conformance ledger aligned.

## Risks Or Blockers

- No remaining blockers found in the required verification set.
- Residual risk is limited to the intended static source-currentness model:
  these checks prove source/currentness and no-load guard metadata, not runtime
  React compatibility or native execution.

## Recommended Next Tasks

- Re-run the orchestrator source audit against the committed follow-up before
  merge.
