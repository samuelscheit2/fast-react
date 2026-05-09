# worker-121-root-render-e2e-oracle

## Summary

Added a deterministic React DOM 19.2.6 root render/update/unmount e2e oracle.
This is conformance/oracle work only; no product source behavior was
implemented.

The oracle downloads and verifies exact `react`, `react-dom`, and `scheduler`
tarballs from the checked runtime inventory, runs each scenario in an isolated
Node child process with a deterministic DOM shim, records React DOM
observations, and compares the current local Fast React React DOM placeholder
package as explicit unsupported behavior. Fast React compatibility claims
remain false.

Covered scenarios:

- `createRoot` with no render: root object, listener/marker side effects, and
  no child mutation.
- Initial `flushSync(() => root.render(...))` host/text render.
- Follow-up host prop/text update.
- Root child replacement with remove/place mutation evidence.
- `root.render(null)` clearing mounted children while keeping the root live.
- `root.unmount()` cleanup, marker nulling, root `_internalRoot` nulling, and
  child removal.
- Double unmount no-op.
- Render after unmount error.
- A two-root `flushSync` callback proving both root commits complete before
  return.
- Focused development-only warnings for second render args, unmount callback,
  and duplicate root.

## Goal Evidence

- First action: `create_goal` was called before reading files or running
  commands for objective `Add deterministic React DOM root render/update/unmount e2e oracle files.`
- `get_goal` immediately after setup reported status `active` with objective
  `Add deterministic React DOM root render/update/unmount e2e oracle files.`

## Changed Files

- `tests/conformance/src/react-dom-root-render-e2e-targets.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-scenarios.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-probe-runner.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-oracle-generator.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-oracle.mjs`
- `tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-root-render-e2e-oracle.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json`
- `worker-progress/worker-121-root-render-e2e-oracle.md`

Existing untracked `.worker-logs/` content was present before this worker's
edits and was left untouched.

## Evidence Gathered

- Required docs read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`,
  `worker-progress/worker-106-root-render-e2e-test-plan.md`, and
  `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`.
- Merged React DOM root/container/listener oracle reports read:
  `worker-progress/worker-046-react-dom-client-root-oracle.md`,
  `worker-progress/worker-049-react-dom-hydration-marker-oracle.md`,
  `worker-progress/worker-054-react-dom-root-export-implementation.md`,
  `worker-progress/worker-088-dom-container-root-markers-oracle.md`, and
  `worker-progress/worker-089-dom-root-listener-installation-oracle.md`.
- Current Fast React source state confirms compatibility must remain false:
  `packages/react-dom/client.js` still has placeholder `createRoot` and
  `hydrateRoot`, and `packages/react-dom/index.js` still has placeholder
  `flushSync`.
- Nested read-only subagents were used:
  - Harness-pattern check confirmed the target/scenario/probe/generator/helper
    split, checked-artifact tests, path-leak guards, and exact-tarball
    generator shape.
  - Scenario-scope check confirmed required root render/update/unmount
    coverage, out-of-scope hydration/events/forms/Suspense/hooks behavior,
    marker/path normalization needs, and false Fast React claims.

## Verification

Passed:

```sh
node tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs --write
node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs
tmp=$(mktemp); node tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json "$tmp"; rc=$?; rm -f "$tmp"; exit $rc
npm test --workspace @fast-react/conformance
```

Results:

- Focused test: 11 tests passed.
- Deterministic regeneration byte-compare: passed.
- Full conformance workspace: 413 tests passed.

Additional checks before the final report edit:

- New source/scripts parsed with `node --check`.
- Artifact leak scan found no concrete local/temp paths or raw randomized React
  private marker suffixes in the checked JSON.
- Scoped trailing-whitespace and conflict-marker scans found no matches.

Report-inclusive hygiene:

- Scoped conflict-marker scan: no matches.
- Scoped trailing-whitespace scan: no matches.
- Scoped artifact/report path and randomized-marker leak scan: no matches.
- Scoped `git diff --check` with intent-to-add for all new files: passed.
- Product source diff check under `packages`, `crates`, smoke tests, package
  manifests, and lockfiles: no tracked diffs.

## Completion Audit

Objective restated as concrete deliverables:

- Add deterministic React DOM root render/update/unmount e2e oracle files in
  the assigned `tests/conformance` and worker report paths.
- Generate exact-tarball React DOM 19.2.6 observations for `createRoot`,
  `root.render`, update, unmount, return values, container child mutations,
  marker cleanup, and focused warning/error surfaces.
- Keep Fast React compatibility claims explicit and false/currently
  unsupported.
- Normalize temporary paths and randomized React private marker suffixes.
- Avoid product source, Rust crate, scheduler source, and shared conformance
  index changes.
- Run the required generator, focused test, deterministic regeneration
  byte-compare, full conformance workspace test, and scoped hygiene checks.

Prompt-to-artifact checklist:

- `tests/conformance/src/react-dom-root-render-e2e-*.mjs`: present with
  targets, scenarios, probe runner, generator, and checked-oracle helpers.
- `tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs`:
  present and verified with `--write`.
- `tests/conformance/scripts/print-react-dom-root-render-e2e-oracle.mjs`:
  present and verified by focused test against the checked JSON.
- `tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`:
  present and passed 11 focused assertions.
- `tests/conformance/oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json`:
  present, deterministic, and byte-compared against fresh generation.
- `worker-progress/worker-121-root-render-e2e-oracle.md`: present with summary,
  changed files, commands, evidence, verification, risks, and next tasks.
- Exact package target: checked artifact records `react-dom@19.2.6`,
  `react@19.2.6`, and `scheduler@0.27.0` from the runtime inventory, with
  tarball integrity and file-list verification in the generator.
- Scenario coverage: checked artifact records 10 React DOM observations in
  both development and production modes for create, initial render, update,
  replacement, render-null, unmount, double-unmount, render-after-unmount,
  cross-root `flushSync` callback, and warning boundaries.
- Fast React boundary: checked artifact records Fast React comparisons in both
  modes and every comparison is `unsupported-placeholder`; all compatibility
  claim booleans are false.
- Normalization: artifact/test guard rejects concrete temp/workspace paths and
  raw randomized marker suffixes; marker evidence is stored as counts and value
  states.
- Scope: tracked diff check confirms no product source, Rust crate, scheduler,
  smoke, manifest, or lockfile diffs; only scoped new oracle/report files are
  part of this worker's artifact set.

## Risks Or Blockers

- The DOM shim is deterministic and intentionally narrow. It is not browser,
  jsdom, parser, layout, focus, selection, CSS cascade, accessibility, or
  custom-element lifecycle evidence.
- Root listener installation can appear as root lifecycle side-effect evidence,
  but event dispatch, plugin extraction, event priority, batching from events,
  portals, and hydration are separate oracle surfaces.
- Node-map cleanup is not directly observable from published React DOM under
  this shim; this oracle records marker cleanup, child removal, retained root
  state/nulling, and stale-render error behavior.
- Regeneration needs network access to the exact npm tarball URLs recorded in
  the runtime inventory.

## Recommended Next Tasks

- Use this checked oracle as the React DOM target for future Fast React root
  render implementation work.
- Keep Fast React root compatibility false until a scoped local comparison can
  match all root render/update/unmount observations.
- Implement source behavior only through the planned reconciler root,
  HostRoot update queue, scheduler, commit, DOM host, and container marker
  layers; avoid facade-level DOM mutation shortcuts.
