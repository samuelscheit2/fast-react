# Worker 424: Test Renderer toJSON Broader Host Shapes

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: `Extend private toJSON diagnostics
  beyond the current minimal canary to cover multiple host children, text
  siblings, prop elision, and empty roots while keeping the public facade
  blocked.`
- No nested managed agents, explorers, or subagents were spawned.

## Summary

Extended private `toJSON` diagnostics beyond the one HostComponent plus one
HostText canary while keeping the public facade blocked.

Rust now has a private JSON rendered-root diagnostic for `null`, text, host
nodes, and arrays, plus focused tests for empty roots, multiple root host
children, text siblings, and `children` prop elision. The existing committed
host-output JSON canary and private `toTree` metadata path remain narrow and
unchanged.

The hidden JS `toJSON` facade now validates and serializes a private node graph
instead of assuming exactly two nodes. It can privately return `null`, a string,
a host JSON object, or an array of those values, strips `children` from
serialized props, freezes produced objects/arrays, and continues to reject stale
snapshots and public blocker violations. Public `create().toJSON()` still
throws the unsupported placeholder error, native bridge execution remains
false, and no compatibility rows were admitted.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `worker-progress/worker-424-test-renderer-tojson-broader-host-shapes.md`

## Evidence Gathered

- Read required context after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read requested worker reports present in this checkout: workers 236, 265,
  333, 363, 391, and 412. The worker 265 and 412 reports were present under
  `worker-265-test-renderer-private-json-ready-diagnostics.md` and
  `worker-412-private-root-output-gate-docs-and-smoke-refresh.md`.
- React 19.2.6 source inspection confirmed `toJSON` returns `null` for empty
  containers, a single child directly for one root child, an array for multiple
  root children, recursively serializes host/text children, and elides the
  `children` prop from host props.
- Focused Rust tests prove the new private rendered-root diagnostic covers
  empty roots, multiple host children, text siblings, and `children` prop
  elision without changing the existing minimal committed-output canary.
- Focused JS tests prove the hidden private facade handles the broader shapes,
  keeps results frozen, rejects stale/public-blocker failures, and leaves
  public `toJSON()` blocked.

## Commands Run

```sh
create_goal
get_goal
pwd
rg --files
git status --short
cat WORKER_BRIEF.md
cat MASTER_PLAN.md
cat MASTER_PROGRESS.md
cat worker-progress/worker-236-test-renderer-private-json-serialization.md
cat worker-progress/worker-265-test-renderer-private-json-ready-diagnostics.md
cat worker-progress/worker-333-test-renderer-tojson-host-output-private-path.md
cat worker-progress/worker-363-test-renderer-update-tojson-private-host-output.md
cat worker-progress/worker-391-test-renderer-public-tojson-private-facade.md
cat worker-progress/worker-412-private-root-output-gate-docs-and-smoke-refresh.md
cat docs/tasks/worker-424-test-renderer-tojson-broader-host-shapes.prompt.md
rg -n "<toJSON/private JSON patterns>" crates/fast-react-test-renderer/src/lib.rs packages/react-test-renderer tests/conformance/src/react-test-renderer-serialization-local-gate.mjs tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
nl -ba crates/fast-react-test-renderer/src/lib.rs
nl -ba packages/react-test-renderer/index.js
nl -ba tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
nl -ba tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
rg -n "function toJSON|toJSON" /Users/user/Developer/Developer/react-reference/packages/react-test-renderer/src/ReactTestRenderer.js
cargo fmt --all
cargo fmt --all --check
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
cargo test -p fast-react-test-renderer --all-features root_private_to_json
cargo test -p fast-react-test-renderer --all-features root_private_json
cargo test -p fast-react-test-renderer --all-features
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-test-renderer
git add -N worker-progress/worker-424-test-renderer-tojson-broader-host-shapes.md
git diff --check
```

## Verification Results

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-test-renderer --all-features root_private_to_json`:
  passed, 5 focused tests.
- `cargo test -p fast-react-test-renderer --all-features root_private_json`:
  passed, 6 focused tests.
- `cargo test -p fast-react-test-renderer --all-features`: passed, 59 unit
  tests and 0 doctests.
- JS syntax checks for all touched package/test JS files: passed.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`:
  passed, 7 tests.
- `npm run test:react-test-renderer:serialization --workspace @fast-react/conformance`:
  passed, 18 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `git diff --check`: passed with the new worker report included via
  intent-to-add.
- npm printed the existing `minimum-release-age` warning during npm commands.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The broader serializer is still private and diagnostic-only. It consumes
  caller-provided private reports; no JS/native/Rust execution bridge or public
  `toJSON` route was enabled.
- The existing committed-fiber inspection and private `toTree` metadata remain
  scoped to the minimal HostRoot -> HostComponent -> HostText canary.

## Recommended Next Tasks

1. Keep public `toJSON`, `toTree`, TestInstance wrappers, act, and compatibility
   admissions blocked until a real bridge can execute Rust renderer roots.
2. Add bridge-backed private `toJSON` diagnostics only after committed-fiber
   inspection can describe broader host trees instead of only the minimal
   canary.
3. Update private `toTree` metadata separately if broader tree diagnostics are
   accepted; this worker intentionally did not change `toTree`.
