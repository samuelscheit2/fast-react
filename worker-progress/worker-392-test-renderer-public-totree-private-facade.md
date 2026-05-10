# Worker 392 - Test Renderer Public toTree Private Facade

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Add a narrowly gated private toTree
  facade path for react-test-renderer that consumes accepted Rust private tree
  metadata without opening public toTree compatibility.
- No nested managed agents or subagents were spawned.

## Summary

Added a Rust private tree metadata report for the accepted minimal
HostRoot -> HostComponent -> HostText canary and update-after-commit canary.
The report is derived only after the existing private JSON serialization gate
is ready, keeps stale snapshot rejection, carries the accepted fiber shape, and
records that public tree objects remain unavailable.

Added a hidden JS `toTree` private facade symbol to every
`react-test-renderer` entrypoint. The facade consumes only the accepted Rust
private tree metadata report and privately returns a frozen React
`toTree`-shaped host object for the narrow host/text canary. Public
`renderer.toTree()` still throws `FastReactTestRendererUnimplementedError`,
public route/native execution remains false, and composite/private-metadata
mismatches are rejected.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-392-test-renderer-public-totree-private-facade.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested worker reports 235, 293, and 364. A worker 391 report was not
  present in this worktree; its task prompt was present and inspected.
- Read related serialization reports 236, 305, 333, and 363.
- Confirmed worker 364 had JS-only private toTree metadata over the minimal
  host shape, but no Rust private tree metadata report and no private tree
  facade serializer.
- Confirmed public `toTree`, `toJSON`, TestInstance wrappers, JS public routing,
  native bridge execution, and compatibility claims stayed blocked in the
  local gates and focused tests.

## Commands Run

```sh
create_goal
get_goal
git status --short
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-235-test-renderer-private-fiber-inspection.md
sed -n '<ranges>' worker-progress/worker-293-root-commit-host-parent-placement-apply-canary.md
sed -n '<ranges>' worker-progress/worker-364-test-renderer-totree-private-host-output.md
sed -n '<ranges>' worker-progress/worker-236-test-renderer-private-json-serialization.md
sed -n '<ranges>' worker-progress/worker-305-test-renderer-tojson-private-serialization-facade.md
sed -n '<ranges>' worker-progress/worker-333-test-renderer-tojson-host-output-private-path.md
sed -n '<ranges>' worker-progress/worker-363-test-renderer-update-tojson-private-host-output.md
sed -n '<ranges>' docs/tasks/worker-391-test-renderer-public-tojson-private-facade.prompt.md
sed -n '<ranges>' docs/tasks/worker-392-test-renderer-public-totree-private-facade.prompt.md
sed -n '<ranges>' crates/fast-react-test-renderer/src/lib.rs
sed -n '<ranges>' packages/react-test-renderer/index.js
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
sed -n '120,250p' /Users/user/Developer/Developer/react-reference/packages/react-test-renderer/src/ReactTestRenderer.js
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-test-renderer --all-features root_private_tree_metadata -- --nocapture
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
cargo test -p fast-react-test-renderer --all-features
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-test-renderer
git add -N worker-progress/worker-392-test-renderer-public-totree-private-facade.md
git diff --check
```

## Verification Results

- `cargo fmt --all --check`: passed.
- Focused Rust private tree metadata tests: passed, 3 tests.
- `cargo test -p fast-react-test-renderer --all-features`: passed, 54 unit
  tests and 0 doctests.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`:
  passed, 7 tests.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`:
  passed, 9 tests.
- `npm run test:react-test-renderer:serialization --workspace @fast-react/conformance`:
  passed, 18 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `git diff --check`: passed with this report included via intent-to-add.
- npm printed the existing `minimum-release-age` warning during npm commands;
  it did not affect results.

## Risks Or Blockers

- No blockers.
- The private facade is intentionally narrow: it accepts only the
  HostRoot -> HostComponent -> HostText tree metadata report with current host
  output and public blockers still set.
- The JS facade still does not execute Rust or a native bridge. It consumes
  private diagnostic records only.
- The hidden private facade returns a React `toTree`-shaped host object, but it
  is not a public `create().toTree()` compatibility claim or public route.

## Recommended Next Tasks

1. Keep public `toTree` compatibility blocked until JS create/update/unmount
   can execute the Rust test renderer through an admitted bridge.
2. Extend private tree traversal only after broader host-output and composite
   fiber metadata shapes are accepted.
3. Add public dual-run serialization admissions only after public
   TestInstance/root routing and native execution are separately gated.
