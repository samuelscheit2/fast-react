# Worker 1207 Public React.act Currentness Hardening

## Summary

- Hardened the public React.act blocked currentness report gate so object-like reports prove source ownership before freeze inspection.
- Added negative coverage for mutable forged reports, hostile proxies, and helper-owned mutable reports produced while `Object.freeze` is temporarily bypassed.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `tests/conformance/test/react-act-public-blocked-gate.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-1207-public-react-act-currentness-hardening.md`

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `git status --short --branch`
- `git diff -- packages/react/private-act-dispatcher-gate.js tests/conformance/test/react-act-public-blocked-gate.mjs tests/conformance/test/react-act-oracle.test.mjs worker-progress/worker-1207-public-react-act-currentness-hardening.md`
- `rg -n "validatePublicReactActBlockedCurrentnessReport|createPublicReactActBlockedCurrentnessReport|public-react-act-currentness" packages/react/private-act-dispatcher-gate.js`
- `sed -n '4320,4865p' packages/react/private-act-dispatcher-gate.js`
- `sed -n '1,320p' tests/conformance/test/react-act-public-blocked-gate.mjs`
- `sed -n '280,465p' tests/conformance/test/react-act-oracle.test.mjs`
- `node --check packages/react/private-act-dispatcher-gate.js`
- `node --check tests/conformance/test/react-act-public-blocked-gate.mjs`
- `node --check tests/conformance/test/react-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-act-public-blocked-gate.mjs`
- `node --test tests/conformance/test/react-act-oracle.test.mjs`
- Orchestrator reran from this assigned worktree and reported pass for `npm run check --workspace @fast-react/react`
- Orchestrator reran from this assigned worktree and reported pass for `npm run check:package-surface`
- Orchestrator reran from this assigned worktree and reported pass for `node tests/smoke/import-entrypoints.mjs`
- Orchestrator reran from this assigned worktree and reported pass for `git diff --check`

## Verification Results

- `node --check packages/react/private-act-dispatcher-gate.js`: passed.
- `node --check tests/conformance/test/react-act-public-blocked-gate.mjs`: passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs`: passed.
- `node --test tests/conformance/test/react-act-public-blocked-gate.mjs`: passed 1 test.
- `node --test tests/conformance/test/react-act-oracle.test.mjs`: passed 22 tests.
- Orchestrator-reported verification from this assigned worktree: package check, package surface check, smoke entrypoint imports, and `git diff --check` all passed.

## Evidence Gathered

- `validatePublicReactActBlockedCurrentnessReport()` now rejects non-object reports as not frozen, then proves object-like reports with `publicReactActBlockedCurrentnessReports.has(report)` before calling `Object.isFrozen(report)`.
- A caller-shaped mutable clone and frozen clone both reject with `public-react-act-currentness-source-proof`.
- A hostile proxy rejects with `public-react-act-currentness-source-proof`, and the test asserts its traps were not reached.
- A source-owned report created while `Object.freeze` is temporarily bypassed rejects with `public-react-act-currentness-not-frozen`.
- Public React.act compatibility, warning compatibility, queue draining, callback invocation, thenable return, renderer/root execution, package compatibility, and scheduler/root execution remain false or blocked in the conformance assertions.
- Late source audit found the branch also aligned `reactDomClientRootPlaceholder` to `false`. That reflects already accepted minimal public ReactDOM client fake-DOM root lifecycle evidence, not a new React.act or renderer-root compatibility claim; `rendererRootsReady` remains `false` because `testRendererRootPlaceholder` is still `true`.

## Risks / Blockers

- Late source audit required an explicit note for the root-placeholder assertion alignment.
- Residual overlap risk is limited to other workers editing the same React.act gate or conformance files.

## Recommended Next Tasks

- Merge with adjacent React.act gate work only after related queue/root readiness workers have their own evidence committed.

## Commit

- Final commit hash is reported by the worker final summary after the commit is created.
