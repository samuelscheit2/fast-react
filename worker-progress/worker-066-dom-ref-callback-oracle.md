# worker-066-dom-ref-callback-oracle

## Objective

Add deterministic React DOM 19.2.6 ref callback attach/detach ordering oracle
files for host nodes, callback cleanup returns, object refs,
StrictMode-relevant observable behavior where deterministic, updates,
unmounts, and error propagation.

Write scope honored: only `tests/conformance/src/dom-ref-callback-*.mjs`,
`tests/conformance/scripts/*dom-ref-callback*.mjs`,
`tests/conformance/test/dom-ref-callback-oracle.test.mjs`,
`tests/conformance/oracles/react-19.2.6-dom-ref-callback-oracle.json`, and
this report were changed. I did not inspect `ORCHESTRATOR.md`.

## Summary

The new oracle records pinned React DOM 19.2.6 behavior from exact
`react-dom@19.2.6`, `react@19.2.6`, and `scheduler@0.27.0` npm tarballs
validated against the checked runtime inventory. The generator extracts those
packages into an isolated temporary `node_modules` tree, runs one child process
per scenario and mode, and writes stable JSON without timestamps, local paths,
or lifecycle script execution.

The checked artifact covers 10 scenarios in development and production default
Node modes:

- nested host callback ref mount/unmount attach and detach order
- stable callback ref update behavior
- callback ref identity replacement on the same host node
- host type replacement with the same callback ref
- callback refs that return cleanup functions on update and unmount
- object ref current ordering relative to sibling callback refs
- StrictMode callback null-detach replay in development and production absence
- StrictMode callback cleanup replay in development and production absence
- callback ref attach error propagation through `createRoot` `onUncaughtError`
- callback cleanup return error propagation through `createRoot`
  `onUncaughtError`

Compatibility remains explicitly unclaimed for Fast React. The oracle is
React-DOM-only evidence for future implementation work.

## Sources read

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- Existing conformance oracle and generator patterns under `tests/conformance/`
- Existing React DOM planning context referenced by the oracle target metadata

## Delegated checks

- A previous scoped attempt recorded two read-only nested explorers: one for
  existing conformance oracle conventions and one for deterministic ref callback
  probe candidates. The partial files already reflected those findings.
- During this continuation I spawned one read-only nested explorer
  (`019e0eb3-ae4b-7251-b1c4-1f0f23dbbd62`) to audit current scenario coverage,
  path-leak checks, and maintainability risks. I did not block on it because
  the targeted local generator and tests already passed and the task could be
  completed from direct local evidence.

## Files changed

- `tests/conformance/oracles/react-19.2.6-dom-ref-callback-oracle.json`
- `tests/conformance/scripts/generate-dom-ref-callback-oracle.mjs`
- `tests/conformance/scripts/print-dom-ref-callback-oracle.mjs`
- `tests/conformance/src/dom-ref-callback-oracle-generator.mjs`
- `tests/conformance/src/dom-ref-callback-oracle.mjs`
- `tests/conformance/src/dom-ref-callback-probe-runner.mjs`
- `tests/conformance/src/dom-ref-callback-scenarios.mjs`
- `tests/conformance/src/dom-ref-callback-targets.mjs`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-066-dom-ref-callback-oracle.md`

## Oracle design

The generator:

1. Reads `inventory/react-19.2.6-runtime-package-inventory.json`.
2. Verifies that the inventory target versions match the requested React DOM,
   React, and scheduler packages.
3. Downloads exact tarballs from inventory URLs.
4. Verifies tarball integrity and tarball file lists.
5. Extracts packages into an isolated temporary project.
6. Copies a deterministic probe runner into that project.
7. Executes each scenario in a separate Node child process for development and
   production `NODE_ENV` modes.
8. Normalizes temp paths, workspace paths, and package-root paths before writing
   observations.

The probe runner installs a minimal deterministic DOM shim sufficient for these
`createRoot` ref lifecycle scenarios. Scenarios use `ReactDOM.flushSync()` and
`root.unmount()` to avoid nondeterministic scheduling or passive-effect timing
claims. Console warnings/errors are intercepted and normalized.

The checked test suite verifies schema, exact package targets, false Fast React
compatibility claims, scenario/mode coverage, observed ref ordering, StrictMode
development replay differences, error propagation, print CLI behavior, markdown
summary output, and no local/temp path leaks.

## Intentional gaps

- No Fast React React DOM behavior is compared because React DOM rendering is
  not implemented in this worker scope.
- No asynchronous timing, browser layout, focus, selection, event replay,
  hydration, parser, or real browser DOM behavior is claimed.
- StrictMode coverage is limited to deterministic callback-ref observations in
  development vs production modes.
- Error propagation coverage is limited to callback attach and cleanup-return
  throws observed through `createRoot` error callbacks.

## Commands run

Inspection and generation:

```sh
git status --short
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files tests/conformance | sort | rg '(dom-ref-callback|react-dom-client-root|react-dom-export|dom-event|dom-attribute|element-object|ref-object)'
sed -n '1,260p' tests/conformance/src/dom-ref-callback-scenarios.mjs
sed -n '1,620p' tests/conformance/src/dom-ref-callback-probe-runner.mjs
sed -n '1,620p' tests/conformance/src/dom-ref-callback-oracle-generator.mjs
sed -n '1,260p' tests/conformance/src/dom-ref-callback-targets.mjs
sed -n '1,260p' tests/conformance/src/dom-ref-callback-oracle.mjs
sed -n '1,260p' tests/conformance/scripts/generate-dom-ref-callback-oracle.mjs
sed -n '1,260p' tests/conformance/scripts/print-dom-ref-callback-oracle.mjs
sed -n '1,520p' tests/conformance/test/dom-ref-callback-oracle.test.mjs
node tests/conformance/scripts/generate-dom-ref-callback-oracle.mjs --write
```

Verification:

```sh
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
npm test --workspace @fast-react/conformance
tmp=$(mktemp) && node tests/conformance/scripts/generate-dom-ref-callback-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-dom-ref-callback-oracle.json "$tmp" && rm "$tmp"
find tests/conformance/src tests/conformance/scripts tests/conformance/test -type f \( -name '*dom-ref-callback*.mjs' -o -name 'dom-ref-callback-oracle.test.mjs' \) -print | sort | xargs -n 1 node --check
scoped local/temp path leak check over the changed files
scoped conflict-marker check over the changed files
scoped trailing-whitespace check over the changed files
git status --short
```

All verification commands passed. npm printed the existing local
`minimum-release-age` config warning during the workspace conformance test; it
did not affect the result.

## Quality, maintainability, performance, and security review

Quality:

- The oracle is generated from exact checked React DOM runtime package evidence.
- Normal tests are network-free and read only the checked JSON artifact.
- Assertions avoid nondeterministic timing and focus on synchronous commit
  observations.

Maintainability:

- Scenario metadata, target metadata, generator, probe runner, artifact helpers,
  scripts, and tests are split into small `dom-ref-callback`-prefixed files.
- The DOM shim is intentionally local to the probe runner so it does not add
  shared helper contracts or workspace dependencies.
- The JSON artifact is generated and stable; future behavior additions should
  be added as new scenarios rather than overloading existing scenario IDs.

Performance:

- Generation uses short child processes for isolation and explicit timeouts.
- The checked test suite does not download packages or execute React DOM
  generation by default.

Security:

- No lifecycle scripts run and no root package manifests or lockfiles are
  mutated.
- Downloaded package code is verified against inventory integrity before
  execution.
- Stack traces are not recorded; messages are path-normalized and artifact tests
  guard against concrete temp/workspace path leaks.

## Risks and follow-up tasks

- A future implementation worker needs a real Fast React DOM root/host renderer
  before this oracle can become a dual-run compatibility oracle.
- If future React DOM scenarios require real browser APIs, the minimal DOM shim
  should not be stretched into a shared browser substitute without separate
  evidence.
- Add implementation-facing tests only after the React DOM host mutation and
  client root layers exist.
