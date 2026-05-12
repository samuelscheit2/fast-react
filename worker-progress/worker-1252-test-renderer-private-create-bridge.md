# Worker 1252 - Test Renderer Private Create Bridge

## Summary

- Added a hidden package-root `react-test-renderer` create bridge path that
  exposes private root-create preflight, create-route admission, and a private
  package-root create bridge result through the existing non-enumerable root
  request bridge symbol.
- The new bridge consumes the existing create native host-output handoff
  diagnostics and requires source-owned create-route admission consumption before
  returning a private root handle/evidence record.
- Public `create()`, `root`, serialization, TestInstance, act, native loading,
  native execution, package compatibility, and broad renderer compatibility
  remain blocked.

## Changed Files

- `packages/react-test-renderer/index.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`

## Evidence

- Package-root bridge now has private root-create preflight/admission methods.
- New package-root hidden create bridge result returns the private root handle
  only after source-owned admission consumption plus accepted host-output
  handoff validation.
- Hostile coverage rejects cloned/caller-shaped admission consumption, stale
  source-owned admissions, stale request sequence, stale lanes, stale old
  package-root caller-shaped admission sources, and public/native/package
  compatibility claims.
- Package-root private lifecycle source records are now complete for private
  consumers while public TestInstance/root surfaces remain blocked.

## Nested-Agent Findings Used

- JS gate inspection confirmed package root already had a hidden root request
  bridge and create handoff consumers, but lacked create preflight/admission
  methods and a package-root private create route.
- Rust inspection confirmed `TestRendererPrivateCreateNativeBridgeHostOutputHandoff`
  already exists with stale admission/root/finished-work/lane rejection and
  should be reused rather than replaced.
- Native request inspection found no `root_bridge_requests` edits were needed;
  the generic native JSON shape already supports create request records.

## Commands Run

- `node --check packages/react-test-renderer/index.js` - passed
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` - passed
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs` - passed
- `node --test --test-name-pattern "package root hidden create bridge|CJS development private root-create preflight validates|private root request bridge can call" tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` - passed, 3/3
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` - passed, 42/42
- `node --test tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs` - passed, 28/28
- `node --test --test-name-pattern "package-root private native create/update serialization" tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs` - passed, 1/1
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs` - passed, 46/46
- `npm run check --workspace @fast-react/react-test-renderer` - passed
- `npm run check:package-surface` - passed
- `node tests/smoke/import-entrypoints.mjs` - passed
- `cargo fmt --all --check` - passed
- `cargo test -p fast-react-test-renderer --all-features create_route host_output json_serialization` - failed because Cargo accepts only one test filter
- `cargo test -p fast-react-test-renderer --all-features create_route` - passed, 15/15
- `cargo test -p fast-react-test-renderer --all-features host_output` - passed, 32/32
- `cargo test -p fast-react-test-renderer --all-features json_serialization` - passed, 36/36
- `git diff --check` - passed

## Risks Or Blockers

- No Rust or NAPI source changes were needed; this bridge is JS package-root
  evidence over existing Rust diagnostic shapes.
- CJS mirrors were not modified because they already expose the create
  preflight/admission machinery and the assigned gap was package root.

## Recommended Next Tasks

- Add a later private route that links native JSON transport create request rows
  into the same package-root evidence result if the orchestrator wants explicit
  JSON-row consumption at the JS package boundary.
- Keep public test-renderer compatibility blockers in place until public
  serialization/root/TestInstance behavior is explicitly promoted.
