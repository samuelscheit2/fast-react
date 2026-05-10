# Worker 398: React DOM Ref Ordering From Root Commit Metadata

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before writing
  this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: feed accepted root-commit ref
  metadata into the React DOM private ref-ordering diagnostic so attach/detach
  ordering no longer depends solely on test-authored metadata arrays.

## Summary

Added a private accepted root-commit ref metadata boundary for React DOM root
request records and taught the private ref-ordering diagnostic to consume that
accepted metadata when diagnostic step options omit raw metadata arrays.

`ref-callback-gate.js` now brands accepted root-commit metadata snapshots and
keeps the raw ref values and cleanup returns in hidden payloads. Existing
attach/detach, controlled invocation, and host-output ordering gates can
consume the accepted snapshot as their `rootCommitRefMetadata` input.

`root-bridge.js` now admits root commit ref metadata against private render and
unmount request records, validates root ownership and initial/unmount
attach/detach shape, stores the accepted metadata privately, and feeds it into
the ref-ordering diagnostic. Step options may still provide host-output labels
and latest-props updates, but the ordering records now come from admitted
root-request metadata rather than only from test-authored arrays.

Object ref writes, public root execution, root error callback routing, and
React DOM ref compatibility claims remain blocked.

## Changed Files

- `packages/react-dom/src/client/ref-callback-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-398-react-dom-ref-ordering-from-root-commit-metadata.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read worker reports 340 and 371.
- Worker reports 385 and 397 were not present in this checkout; their task
  prompts were present and read.
- Also inspected worker reports 245, 273, 313, 338, 367, 368, and 369 for root
  commit ref metadata, component-tree validation, latest-props handoff, and
  private root host-output context.
- Inspected current `ref-callback-gate.js`, `root-bridge.js`, focused root
  bridge tests, and DOM ref callback conformance tests.
- Inspected current Rust root commit ref metadata types in
  `crates/fast-react-reconciler/src/root_commit.rs` to preserve the accepted
  detach-before-attach boundary and compatibility blockers.

## Commands Run

```sh
create_goal
get_goal
rg / sed inspections for required context, worker reports, source, and tests
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
npm run check --workspace @fast-react/react-dom
git add --intent-to-add worker-progress/worker-398-react-dom-ref-ordering-from-root-commit-metadata.md
git diff --check
git reset worker-progress/worker-398-react-dom-ref-ordering-from-root-commit-metadata.md
```

## Verification

- JS syntax checks passed for both touched source files and both touched tests.
- Focused React DOM private root bridge test passed: 16 tests.
- Focused DOM ref callback conformance test passed: 16 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 37 package tests
  plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed with this progress report included via
  intent-to-add.

## Risks Or Blockers

- This is still private diagnostic infrastructure. It does not execute public
  React DOM roots, run the reconciler, mutate object refs, or report callback
  errors through root error callbacks.
- Accepted metadata admission validates request ownership and root-level
  attach/detach shape, while component-tree latest-ref validation still occurs
  when the ref-ordering diagnostic consumes the metadata.
- The diagnostic can still run controlled callback refs through fake host nodes
  because that behavior already existed behind the private gate.

## Recommended Next Tasks

1. Connect future native/Rust root commit metadata output to the JS accepted
   root-commit metadata admission boundary.
2. Add a private cleanup handle store so callback cleanup returns can flow from
   attach records to later detach metadata without direct test plumbing.
3. Keep public React DOM ref compatibility blocked until public root execution,
   object refs, DOM mutation ordering, and root error routing match React DOM
   oracles.

## Nested Agents

- No nested agents or explorer subagents were used.
