# Worker 844 - test-renderer package-root native execution parity

## Progress

- Added package-root private `react-test-renderer` native execution metadata for
  `toJSON` and `toTree`, matching the accepted CJS private facade shape without
  opening public bridge execution.
- Added package-root private native diagnostic creators, execution-record
  consumers, and accepted shape validators for minimal, nested, sibling-text,
  and unmount serialization evidence.
- Added strict package-root unmount cleanup/deletion/passive-ref evidence
  validation while keeping public `create`, `update`, `unmount`, `toJSON`,
  `toTree`, `ReactTestInstance`, and native bridge loading/execution blocked.
- Broadened conformance gates so package-root create/update facade metadata is
  validated alongside CJS/Rust-backed evidence for sibling text, nested trees,
  and unmount paths.

## Changed Files

- `packages/react-test-renderer/index.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-844-test-renderer-package-root-native-execution-parity.md`

## Verification

- `node --check packages/react-test-renderer/index.js`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
  - 15 tests passed.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
  - 35 tests passed.
- `git diff --check`

## Risks

- No Rust source was changed, and no `cargo` verification was run for this
  package-root-only parity step.
- Native execution remains private diagnostic evidence only. Public serializer,
  TestInstance, native bridge loading/execution, and broad compatibility claims
  are intentionally still blocked.
- `packages/react-test-renderer/index.js` has a large existing diff from this
  worker branch and may require careful conflict handling if adjacent
  test-renderer workers land first.
