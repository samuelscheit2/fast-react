# Worker 238 - DOM Mutation Payload Applier

## Goal

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and returned status `active`.
- Active objective recorded from `get_goal`: "Add a private DOM mutation
  payload applier for the accepted ordinary property payload records, applying
  only safe fake-DOM set/remove attribute/property operations in tests while
  leaving public roots, hydration, events, controlled forms, resources, style,
  dangerous HTML, and compatibility claims blocked."
- Final pre-report `get_goal` check still showed status `active` for the same
  objective.

## Summary

Added a private `applyDomPropertyPayload` helper to
`packages/react-dom/src/dom-host/mutation.js`. The helper prevalidates the
entire payload before mutation, applies only ordinary `setAttribute`,
`removeAttribute`, `setProperty`, and `removeProperty` records, and returns a
deterministic applied-record summary.

Style records, inner-HTML records, non-payload records, unsupported records,
event-like property names, unsafe property names, callback/symbol property
values, malformed attribute records, and missing fake-DOM methods remain
blocked. Public roots, hydration, events, controlled forms, document resource
handling, latest-props maps, real browser behavior, and compatibility claims
were not wired.

## Changed Files

- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `worker-progress/worker-238-dom-mutation-payload-applier.md`

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`; did not read `ORCHESTRATOR.md`.
- Read required worker reports: workers 061, 154, 168, 186, 212, and 213.
- Worker 259 had no progress report in this checkout or sibling worktree; only
  its task prompt was present, so this worker avoided latest-props commit
  adapter wiring.
- Inspected `property-payload.js`, `mutation.js`, `dom-host/index.js`,
  `client/component-tree.js`, existing mutation smoke coverage, property
  payload conformance coverage, and React 19.2.6 reference DOM property update
  paths.
- Confirmed the worktree was clean before edits except for the existing
  worker log artifact.
- No nested agents were spawned.

## Commands Run

- `sed -n` reads for the worker brief, master docs, required worker reports,
  worker 259 prompt, DOM host sources, smoke/conformance tests, and selected
  React reference source files.
- `rg --files packages/react-dom/src tests/smoke tests/conformance/test | sort`
- `rg -n` searches for payload, mutation, style, inner HTML, resource/form,
  and text-content gate boundaries.
- `git status --short --untracked-files=all`
- `git diff --stat`
- `prettier --single-quote --bracket-spacing=false --trailing-comma none --write packages/react-dom/src/dom-host/property-payload.js packages/react-dom/src/dom-host/mutation.js tests/smoke/react-dom-mutation-adapter-shell.mjs tests/conformance/test/dom-property-payload-helper.test.mjs`
- `prettier --single-quote false --bracket-spacing true --trailing-comma none --write tests/conformance/test/dom-property-payload-helper.test.mjs`
- `node --check packages/react-dom/src/dom-host/property-payload.js`
- `node --check packages/react-dom/src/dom-host/mutation.js`
- `node --check tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `node --check tests/conformance/test/dom-property-payload-helper.test.mjs`
- `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- `node tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `npm run check:js`
- `git diff --check`
- `git diff --check --no-index /dev/null worker-progress/worker-238-dom-mutation-payload-applier.md; diff_status=$?; if [ "$diff_status" -eq 1 ]; then exit 0; else exit "$diff_status"; fi`

## Verification

- `node --check` passed for all touched JS files.
- Focused property payload conformance passed with 11 tests.
- Focused DOM mutation smoke passed:
  `React DOM private mutation adapter shell smoke checks passed.`
- `npm run check:js` passed, including package-surface checks, entrypoint
  smoke checks, benchmark gates, workspace checks, native loader checks, and
  506 conformance tests. npm printed the existing `minimum-release-age`
  warning.
- `git diff --check` passed.
- The no-index whitespace check for this untracked worker report also passed.

## Risks Or Blockers

- This remains a private fake-DOM/test-only helper. It does not connect to
  public `createRoot`, real DOM rendering, reconciler commit traversal,
  hydration, event dispatch, controlled form wrappers, document resource tags,
  latest-props maps, or compatibility admission.
- Direct property records are accepted only when explicitly supplied and only
  for preexisting safe fake-DOM properties. The payload diff helper does not
  yet generate custom-element property routing records.
- Style and `dangerouslySetInnerHTML` payload records stay blocked for worker
  242's slice.

## Recommended Next Tasks

- Let worker 242 own style and inner-HTML application, with the same
  prevalidation/no-partial-mutation discipline.
- Let worker 259 own latest-props commit adapter consumption without coupling
  it to this fake-DOM mutation helper.
- Add namespace-aware and custom-element property routing only with matching
  oracle-backed payload records and explicit admission gates.
