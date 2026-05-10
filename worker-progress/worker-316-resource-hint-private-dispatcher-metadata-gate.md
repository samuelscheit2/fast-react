# Worker 316: Resource Hint Private Dispatcher Metadata Gate

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available and returned status `active`.
- Active objective recorded by `get_goal`: add a private resource hint
  dispatcher metadata gate for React DOM resource APIs. It should validate
  preload/preinit/preconnect request shapes and keep all resource dispatch side
  effects blocked.
- `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` were read
  after goal setup. `ORCHESTRATOR.md` was not read.

## Summary

Added a private React DOM resource hint dispatcher metadata gate on top of the
accepted resource/form internals gate. The new gate validates the normalized
private dispatcher request shapes for `preconnect` (`C`), `preload` (`L`), and
`preinit` style/script (`S`/`X`) while recording metadata only.

The gate rejects malformed, non-normalized, unknown, or dispatch-capable
request shapes. It stores no raw href, integrity, nonce, DOM, document, or form
objects, and all resource dispatch side effects remain explicitly blocked:
private dispatcher invocation, source adapter invocation, document/head
mutation, resource element creation, stylesheet precedence, Fizz emission,
public root access, and compatibility claims are all `false`.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
  - Added resource hint dispatcher metadata contracts, records, validation,
    blocked side-effect metadata, missing prerequisites, payload guards, and
    fail-closed unsupported/invalid-shape errors.
- `packages/react-dom/src/resource-form-gates.js`
  - Surfaced the private resource dispatcher metadata boundary through the
    existing root-bridge blocked gate and folded the new blocked side-effect
    fields into root boundary metadata.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added direct coverage for normalized dispatcher shapes, malformed-shape
    rejection, no raw value retention, blocked side effects, and root-boundary
    propagation.
- `worker-progress/worker-316-resource-hint-private-dispatcher-metadata-gate.md`
  - This report.

## Evidence Gathered

- Worker 172 established the broad fail-closed resource/form/controlled
  unsupported gates and source-token blockers.
- Worker 260 added the metadata-only private resource/form internals gate.
- Worker 276 added the root-bridge blocked boundary over those internals.
- React 19.2.6 source
  `/Users/user/Developer/Developer/react-reference/packages/react-dom/src/shared/ReactDOMFloat.js`
  shows the private dispatcher shapes:
  - `C(href, crossOrigin)` for preconnect.
  - `L(href, as, options)` for preload.
  - `S(href, precedence, options)` for style preinit.
  - `X(href, options)` for script preinit.
- The checked resource hint oracle records the same private dispatcher
  normalization and explicitly says that private dispatcher evidence is not a
  public compatibility claim.
- Existing public `react-dom` and `react-dom/profiling` resource APIs remain
  accepted-shape unsupported placeholders, and replacing the private dispatcher
  with spies still records no dispatch calls.
- No nested agents were spawned.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `pwd`
  - `git status --short`
  - `rg --files | rg ...`
  - `sed -n` reads for `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
    `MASTER_PROGRESS.md`, worker reports 172/260/276, target source/test files,
    React reference `ReactDOMFloat.js`, and resource-hint conformance helpers.
  - `rg -n` scans for resource hint dispatcher, oracle, and source-token
    references.
  - Node oracle/source summary scripts for resource hint observations and
    private dispatcher normalization.
  - `git diff -- packages/react-dom/src/resource-form-internals-gate.js packages/react-dom/src/resource-form-gates.js packages/react-dom/test/resource-form-unsupported-gates.test.js`
- Syntax:
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/src/resource-form-gates.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- Focused verification:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs tests/conformance/test/react-dom-form-actions-oracle.test.mjs tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Required verification:
  - `npm run check:js`
  - `git diff --check`

## Verification Results

- `node --check` passed for all touched JS files.
- Package-local resource/form gate passed: 11/11 tests.
- Focused resource, form, and controlled conformance tests passed: 37/37 tests.
- `npm run check:js` passed, including package surface, import smoke,
  benchmark gates, all workspace JS checks, the updated React DOM package gate,
  native loader checks, and 559 conformance tests.
- `git diff --check` passed after this report was added.
- npm emitted the existing `minimum-release-age` warning during npm commands;
  it did not fail verification.

## Risks Or Blockers

- This is a private metadata gate only. It does not wire public resource APIs to
  the dispatcher, DOM, public roots, Fizz, stylesheet precedence, or host
  resource adapters.
- The new shape gate intentionally covers `preconnect`, `preload`, and
  `preinit` private dispatcher shapes only. `prefetchDNS`, `preloadModule`, and
  `preinitModule` remain covered by the existing generic unsupported resource
  contracts.
- Future real resource dispatch work must replace or narrow these blocked
  side-effect gates with DOM/Fizz/root evidence in the same change.
- No blockers remain.

## Recommended Next Tasks

- Add DOM/Fizz resource-effect oracles before enabling actual resource
  dispatch.
- Add document/head ownership and stylesheet precedence gates before mutating
  resource elements.
- Admit private resource dispatcher capabilities one shape at a time, keeping
  public resource API compatibility claims false until dual-run behavior exists.
