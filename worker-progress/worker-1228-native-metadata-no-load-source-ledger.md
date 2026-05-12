# worker-1228-native-metadata-no-load-source-ledger

## Scope

Completed the private no-load/source-currentness ledger for the symbol-only
root work-loop finished-work metadata factory. The ledger stays attached to the
existing private factory function and is reached only after obtaining that
factory through the existing `Symbol.for(...)` module key.

## Implementation

- Added a hidden, non-enumerable source-currentness ledger on the private
  metadata factory.
- The ledger maps the JS factory shape to source-owned Rust identifiers and JS
  factory shape evidence in
  `crates/fast-react-napi/src/root_work_loop_metadata.rs`.
- Exact evidence phrase: source-owned Rust identifiers and JS factory shape.
- Covered source/status/revision constants, JSON field names, canary values,
  and private blocker booleans.
- Rejected stale source paths, missing Rust identifiers, fake JS-only rows,
  public/native/package claims, worker/network execution claims, renderer or
  reconciler output claims, prose evidence, source-syntax-only evidence, and
  canonical-set drift.
- Kept the CommonJS and ESM public surface unchanged: no enumerable CommonJS
  key, no ESM named export, no package export, no public native compatibility
  claim, and no `.node` load path.

## Tests

- `node bindings/node/test/native-no-load-guard.test.cjs` - passed.
- `node bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs` - passed.
- `npm --prefix bindings/node run check` - passed.
- `node tests/smoke/package-surface-guard.mjs` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `cargo test -p fast-react-napi --lib root_work_loop_finished_work_metadata` - passed, 13 tests.
- `git diff --check` - passed.

## Residual Risk

Low. The ledger remains static source evidence and intentionally does not load
native artifacts or prove public React/native compatibility.
