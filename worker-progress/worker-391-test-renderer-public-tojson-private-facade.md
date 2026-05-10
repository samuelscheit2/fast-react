# Worker 391 - Test Renderer Public toJSON Private Facade

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Allow the JS react-test-renderer
  facade to expose a narrowly gated private toJSON diagnostic result when
  backed by accepted Rust host-output serialization evidence, while public
  compatibility stays blocked.
- No public React Test Renderer serialization compatibility is claimed.

## Summary

Added an explicit private `toJSON` diagnostic result layer on top of the
accepted Rust host-output JSON diagnostics.

Rust now exposes `TestRendererPrivateToJsonFacadeResult` through create/update
canary helpers that can only be produced by first passing the existing private
JSON serialization report path. The result carries the source diagnostic name,
host-output update kind, snapshot freshness, serialized node fields, public
blockers, and false public compatibility flags.

The JS `react-test-renderer` facade now exposes that result only through the
existing non-enumerable private symbol record on the placeholder
`renderer.toJSON` function. Public `renderer.toJSON()` still throws, no native
bridge or JS root execution is enabled, and compatibility remains false.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `worker-progress/worker-391-test-renderer-public-tojson-private-facade.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested reports present in this checkout: workers 178, 235, 265, 293,
  363, 366, and 382.
- Also inspected workers 236, 291, 305, 333, and 364 to understand the prior
  private JSON, local gate, hidden toJSON serializer, and private toTree
  metadata boundaries.
- Confirmed the current public facade still uses
  `createRendererUnsupportedFunction("create().toJSON", ...)`.
- Confirmed the private JS facade already validates accepted Rust private JSON
  reports, including create/update host-output kind, fresh snapshot, two-node
  HostComponent/Text shape, ready gate data, and public blocker flags.
- Spawned two read-only explorers for Rust and JS inspection. They did not
  return before the implementation path was clear, were closed, and did not
  affect the conclusions.

## Commands Run

```sh
cargo test -p fast-react-test-renderer --all-features private_to_json_facade_result
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-test-renderer --all-features
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-test-renderer
git add -N worker-progress/worker-391-test-renderer-public-tojson-private-facade.md
git diff --check
```

## Verification Results

- Focused Rust `private_to_json_facade_result`: passed, 2 tests.
- JS syntax checks for all touched package/test JS files: passed.
- Focused serialization local gate: passed, 7 tests.
- Neighbor create-routing gate: passed, 9 tests.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-test-renderer --all-features`: passed, 53 unit
  tests and 0 doctests.
- `npm run test:react-test-renderer:serialization --workspace @fast-react/conformance`:
  passed, 18 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `git diff --check`: passed.
- npm printed the existing `minimum-release-age` warning during npm commands.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The JS diagnostic result is still private and caller-supplied-report based;
  no Rust/native bridge execution is enabled from JS.
- The accepted result is deliberately narrow: one HostComponent with empty
  props and one HostText child, for create/update host-output canaries only.
- Public `create().toJSON`, `create().toTree`, `.root`, TestInstance wrappers,
  act, JS root execution, native bridge execution, and compatibility claims
  remain blocked.

## Recommended Next Tasks

1. Keep public serialization blocked until JS root requests can execute the
   Rust test renderer through a real private bridge.
2. Add broader private serialization only after committed host-output traversal
   supports more shapes than the current canary.
3. Admit public serialization scenarios only after dual-run React 19.2.6
   evidence exists for `toJSON`, `toTree`, and TestInstance surfaces together.
