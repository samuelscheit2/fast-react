# Worker 338: DOM Mutation Latest Props Commit Handoff

## Goal

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: "connect private DOM property payload
  mutation application to the component-tree latest-props handoff for admitted
  fake-DOM rows, with rollback on unsupported payloads and no public root
  compatibility claim".

## Summary

Connected the private latest-props handoff more tightly to the DOM property
payload mutation path by making the admitted fake-DOM handoff transactional.

The latest-props mutation path now snapshots reversible ordinary
attribute/property state before applying safe payload entries. Unsupported
latest-props payloads still fail before mutation, and fake-DOM failures after a
partial payload write roll applied changes back before rethrowing the original
error. The handoff keeps rollback records hidden in the existing WeakMap
payload, and the component-tree batch consumer rolls back already-mutated
handoffs if the batch cannot be admitted.

No public React DOM client facade was touched, and public root compatibility
remains unclaimed.

## Changed Files

- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/client/component-tree.js`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `tests/smoke/react-dom-component-tree-map-shell.mjs`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `worker-progress/worker-338-dom-mutation-latest-props-commit-handoff.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read required worker reports for workers 186, 238, 271, 272, 292, and 311.
- Also inspected worker 259 for the original latest-props commit adapter
  boundary and React 19.2.6 reference `commitUpdate` ordering, where DOM
  property updates run before `updateFiberProps`.
- Inspected current private DOM mutation, property-payload, component-tree, and
  focused smoke/conformance tests.
- No nested agents were spawned.

## Commands Run

- `create_goal`
- `get_goal`
- Context and source reads with `rg`, `sed -n`, `cat`, `git status`, and
  `git diff`
- `node --check packages/react-dom/src/dom-host/mutation.js`
- `node --check packages/react-dom/src/client/component-tree.js`
- `node --check packages/react-dom/src/dom-host/property-payload.js`
- `node --check tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `node --check tests/smoke/react-dom-component-tree-map-shell.mjs`
- `node --check tests/conformance/test/dom-property-payload-helper.test.mjs`
- `node tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `node tests/smoke/react-dom-component-tree-map-shell.mjs`
- `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
- `git add --intent-to-add worker-progress/worker-338-dom-mutation-latest-props-commit-handoff.md && git diff --check`
- `git diff --check --no-index /dev/null worker-progress/worker-338-dom-mutation-latest-props-commit-handoff.md`

## Verification

- JS syntax checks passed for all touched JS/MJS files plus the unchanged
  property-payload helper.
- Focused mutation smoke passed:
  `React DOM private mutation adapter shell smoke checks passed.`
- Focused component-tree smoke passed:
  `React DOM private component tree map shell smoke checks passed.`
- Focused property-payload conformance passed with 22 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 21 package tests
  plus the accepted entrypoint inventory smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed, including this progress report via
  intent-to-add. A separate no-index whitespace check for this untracked report
  also passed.

## Risks Or Blockers

- This remains private fake-DOM infrastructure. It does not wire public
  `createRoot`, real browser DOM commit traversal, hydration, controlled forms,
  events, refs, resources, or compatibility claims.
- Rollback is intentionally limited to latest-props-safe ordinary
  attribute/property payload records. Style and `dangerouslySetInnerHTML`
  remain excluded from latest-props publication.
- Rollback needs fake-DOM attribute snapshot support through
  `hasAttribute`/`getAttribute` or an `attributes` `Map`; targets without that
  support fail closed before latest-props mutation.

## Recommended Next Tasks

1. Keep style and `dangerouslySetInnerHTML` latest-props publication behind a
   separate proven rollback boundary.
2. Wire future HostComponent commit traversal to this private handoff only
   after ordered host mutation records are available.
3. Keep public React DOM root compatibility blocked until the full root render,
   commit, event, hydration, ref, and controlled-form paths are proven.
