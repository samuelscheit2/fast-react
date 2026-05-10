# Worker 305 - Test Renderer toJSON Private Serialization Facade

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup.
- Active goal status after setup: `active`.
- Active goal objective after setup:
  Add a private `toJSON` serialization facade gate for react-test-renderer JS
  that recognizes the accepted Rust private JSON diagnostics but does not
  expose public serialization or claim compatibility.
- `ORCHESTRATOR.md` was not read.
- No nested agents were spawned.

## Summary

Added a private JS-side `create().toJSON` serialization facade gate to all
`react-test-renderer` package entrypoints. The gate records the accepted Rust
private JSON diagnostic report, API, node kinds, and canary tests from worker
265, while explicitly keeping public serialization, public routing, native
bridge execution, and compatibility claims false.

Public behavior remains blocked: `create().toJSON` still throws
`FastReactTestRendererUnimplementedError`, the renderer public key set is
unchanged, no native/Rust bridge is loaded or executed from JS, and the local
serialization gate still reports public compatibility as blocked.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `worker-progress/worker-305-test-renderer-tojson-private-serialization-facade.md`

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Required worker reports inspected:
  - Worker 265: accepted Rust private JSON diagnostics for the minimal
    HostComponent plus HostText canary and kept public JSON/tree/TestInstance
    surfaces blocked.
  - Worker 267: kept TestInstance query and serialization surfaces fail-closed
    while recording Rust-private prerequisites.
  - Worker 291: split private diagnostic readiness from public serialization
    compatibility in the local gate.
- Rust private JSON canary source inspected:
  `TestRendererPrivateJsonSerializationReport`,
  `TestRendererPrivateJsonPublicSurfaceBlockers`,
  `TestRendererRoot::describe_private_json_serialization_for_canary`, and the
  four `root_private_json_serialization_canary_*` tests.
- Package surface evidence from `npm run check:js` confirmed the public module
  and renderer key sets still match the accepted inventory.

## Commands Run

```sh
create_goal
get_goal
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
rg --files | rg '(^worker-progress/worker-(265|267|291)|react-test-renderer|serialization|tojson|test-renderer)'
rg -n '<react-test-renderer serialization/toJSON/private JSON patterns>' packages tests crates worker-progress
sed -n '<ranges>' worker-progress/worker-265-test-renderer-private-json-ready-diagnostics.md
sed -n '<ranges>' worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md
sed -n '<ranges>' worker-progress/worker-291-test-renderer-serialization-local-gate-ready-private.md
sed -n '<ranges>' packages/react-test-renderer/index.js
sed -n '<ranges>' packages/react-test-renderer/cjs/react-test-renderer.development.js
sed -n '<ranges>' packages/react-test-renderer/cjs/react-test-renderer.production.js
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
sed -n '<ranges>' crates/fast-react-test-renderer/src/lib.rs
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
npm run check:js
git diff --check
```

## Verification Results

- `node --check packages/react-test-renderer/index.js`: passed.
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`:
  passed.
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`:
  passed.
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`:
  passed.
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`:
  passed.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`:
  passed, 6 tests.
- `npm run check:js`: passed, including package surface guard, smoke imports,
  benchmark gates, workspace checks, native loader checks, and 560 conformance
  tests.
- `git diff --check`: passed.

`npm` emitted the existing `minimum-release-age` config warning during npm
commands; it did not affect the passing result.

## Risks Or Blockers

- The JS facade gate is metadata only. It recognizes accepted Rust private
  diagnostics but does not execute Rust, load a native bridge, or serialize
  public output.
- The source-pattern local gate will need an intentional refresh if the Rust
  private JSON diagnostic names or canary test names are renamed.
- Public `toJSON`, `toTree`, TestInstance wrappers, create/update/unmount
  routing, `act`, and compatibility admission remain blocked by design.

## Recommended Next Tasks

1. Add a real JS/native root bridge only after root create/update/unmount
   ownership is accepted and separately gated.
2. Keep public `toJSON` and `toTree` compatibility admissions separate from
   private JSON diagnostic readiness.
3. Add TestInstance wrapper/query gates before admitting public serialization
   scenarios that depend on fiber inspection.
