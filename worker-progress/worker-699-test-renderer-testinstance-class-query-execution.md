# Worker 699: Test Renderer TestInstance Class Query Execution

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- `get_goal` was available after setup, before this report, and after
  completion.
- Active goal status from initial `get_goal`: `active`.
- Active goal objective from initial `get_goal`: add private
  react-test-renderer TestInstance query evidence for class-component roots and
  updated host children, while public root, find*, and TestInstance behavior
  stay blocked.
- `update_goal(status: "complete")` was called after verification; final goal
  status: `complete`, time used: 653 seconds.

## Summary

- Added Rust private TestInstance class-root query execution evidence for the
  update path. The evidence consumes accepted update native-bridge admission,
  existing TestInstance query preflight/findBy diagnostics, and private
  class-root diagnostics, then records the updated HostComponent child text.
- Added Rust stale-child rejection so the class-root query evidence fails
  closed if the updated host child no longer matches the update snapshot.
- Added CJS development-only private wrapper metadata and hidden helpers that
  consume accepted update execution plus class-root diagnostics without
  exposing public `.root`, `find*`, TestInstance wrappers, native bridge
  availability, or compatibility claims.
- Extended focused create-routing conformance for the new private evidence.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-699-test-renderer-testinstance-class-query-execution.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`; did not
  read `ORCHESTRATOR.md`.
- Inspected React 19.2.6 `ReactTestRenderer.js` from the local reference clone
  for `validWrapperTypes`, `getChildren`, `.root`, and `findAll` behavior.
- Confirmed existing worker 668 TestInstance native-query evidence only covered
  the minimal HostComponent query path and did not carry class-root or updated
  child text evidence.
- Confirmed public renderer `.root` and query methods remain blocked in CJS
  conformance after the new private helper.

## Commands Run

```sh
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
cargo fmt --all --check
cargo fmt --all
cargo test -p fast-react-test-renderer --all-features test_instance -- --nocapture
cargo test -p fast-react-test-renderer --all-features class -- --nocapture
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
npm run check --workspace @fast-react/react-test-renderer
rg -n <conflict-marker-pattern> <scoped files>
git diff --check
```

## Verification Results

- `node --check` passed for the changed CJS development file and create-routing
  conformance test.
- `cargo test -p fast-react-test-renderer --all-features test_instance -- --nocapture`
  passed: 10 focused tests. Existing `fast-react-reconciler` warnings were
  emitted.
- `cargo test -p fast-react-test-renderer --all-features class -- --nocapture`
  passed: 4 focused tests. Existing `fast-react-reconciler` warnings were
  emitted.
- Create-routing conformance passed: 30 tests.
- Error-surface conformance passed: 15 tests.
- `npm run check --workspace @fast-react/react-test-renderer` passed. npm
  printed the existing `minimum-release-age` warning.
- `cargo fmt --all --check`, conflict-marker scan, and `git diff --check`
  passed after formatting and after adding this progress report.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The class-root TestInstance evidence is private diagnostic metadata. It does
  not execute public class-component rendering from JS, and it does not expose
  public TestInstance wrappers or query methods.
- No nested agents were spawned.

## Recommended Next Tasks

- Keep public TestInstance/root behavior blocked until a real public wrapper
  implementation and compatibility oracle are admitted.
- When broader class-component rendering lands, replace the synthetic
  class-root diagnostic handoff with live committed ClassComponent fiber
  inspection evidence.
