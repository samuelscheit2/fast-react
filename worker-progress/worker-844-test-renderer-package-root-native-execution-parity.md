# Worker 844 - test-renderer package-root native execution parity

## Progress

- Added package-root private `react-test-renderer` native execution metadata for
  the committed `toJSON`/`toTree` single-host and unmount rows without opening
  public bridge execution.
- Added package-root private native diagnostic creators, execution-record
  consumers, and accepted shape validators for minimal and unmount
  serialization evidence.
- Added strict package-root unmount cleanup/deletion/passive-ref evidence
  validation while keeping public `create`, `update`, `unmount`, `toJSON`,
  `toTree`, `ReactTestInstance`, and native bridge loading/execution blocked.
- Broadened conformance gates so package-root create/update facade metadata is
  validated alongside CJS/Rust-backed evidence while nested/sibling rows remain
  private JS serialization/admission evidence rather than package-root native
  execution evidence.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
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
  JS package/CJS parity step.
- Native execution remains private diagnostic evidence only. Public serializer,
  TestInstance, native bridge loading/execution, and broad compatibility claims
  are intentionally still blocked.
- `packages/react-test-renderer/index.js` has a large existing diff from this
  worker branch and may require careful conflict handling if adjacent
  test-renderer workers land first.

## Audit Follow-up

- Kept package-root nested-row and sibling-text evidence on private JS
  serialization/admission paths rather than claiming package-root native
  execution reachability.
- Required direct `hostOutputRowId` evidence to match embedded
  `hostOutputRow.id` exactly, and added negative package-root coverage for that
  mismatch.
- Added focused package-root negative coverage that rejects nested/sibling rows
  on native update execution while preserving their private row/admission
  metadata.

## Read-only Audit Follow-up

- Made accepted native execution records source-owned through the private root
  bridge and rejected cloned/plain caller-built records.
- Narrowed package-root native `toJSON` update execution claims to the committed
  single-host-text and unmount rows while keeping nested/sibling private row
  serialization and JS admission coverage.
- Required exact native execution `kind`/`status` for `toJSON` and `toTree`, and
  kept create records stale after a later package-root native update.
- Required identity-only direct row ids to match embedded `hostOutputRow.id` and
  required explicit `hostOutputShape` on update/unmount rows.
- Follow-up tightened identity-only update/unmount reports to require embedded
  `hostOutputRow` metadata and narrowed package-root `toTree` metadata so
  sibling-text remains a JS admission path, not native execution evidence.
- Mirrored the embedded-row identity checks and explicit update/unmount row
  shape checks into the CJS development and production bundles, with package
  root plus CJS negative coverage for direct-only, missing, mismatched, and
  incomplete host output row evidence.
- Verified with `node --check packages/react-test-renderer/index.js`,
  `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`,
  `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`,
  package-root/CJS import smoke,
  `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`,
  `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`,
  `git diff --check`, and `git diff --cached --check`.
