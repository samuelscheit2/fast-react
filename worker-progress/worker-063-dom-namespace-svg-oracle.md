# worker-063-dom-namespace-svg-oracle

## Objective

Add deterministic React DOM 19.2.6 namespace, SVG, and MathML host output
oracle files covering namespace transitions, common SVG attribute names,
`foreignObject` boundaries, and server/client observable output where practical.

Write scope honored:

- `tests/conformance/src/dom-namespace-svg-*.mjs`
- `tests/conformance/scripts/*dom-namespace-svg*.mjs`
- `tests/conformance/test/dom-namespace-svg-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-dom-namespace-svg-oracle.json`
- `worker-progress/worker-063-dom-namespace-svg-oracle.md`

## Summary

Implemented a checked React DOM 19.2.6 namespace/SVG/MathML oracle. The oracle
records server serialization and client fake-DOM mutation observations for SVG
attribute aliases, xlink/xml namespaced attributes, `foreignObject` HTML
namespace transitions, SVG container child context, and MathML tree behavior.
Fast React compatibility remains false because DOM host mutation and React DOM
rendering are not implemented in this worker.

## Changed Files

- `tests/conformance/oracles/react-19.2.6-dom-namespace-svg-oracle.json`
- `tests/conformance/scripts/generate-dom-namespace-svg-oracle.mjs`
- `tests/conformance/scripts/print-dom-namespace-svg-oracle.mjs`
- `tests/conformance/src/dom-namespace-svg-oracle-generator.mjs`
- `tests/conformance/src/dom-namespace-svg-oracle.mjs`
- `tests/conformance/src/dom-namespace-svg-probe-runner.mjs`
- `tests/conformance/src/dom-namespace-svg-scenarios.mjs`
- `tests/conformance/src/dom-namespace-svg-targets.mjs`
- `tests/conformance/test/dom-namespace-svg-oracle.test.mjs`
- `worker-progress/worker-063-dom-namespace-svg-oracle.md`

## Evidence Gathered

- Followed existing conformance oracle conventions for target/scenario
  metadata, generator, checked artifact, print CLI, and focused tests.
- Captured React DOM server output and client operations separately so
  namespace context behavior is explicit.
- Verified client output includes `createElementNS` and `setAttributeNS`
  evidence for SVG and namespaced attributes, plus HTML fallback under
  `foreignObject`.
- A read-only nested explorer checked scenario coverage and oracle patterns;
  direct local tests remained the source of truth.

## Commands Run

- `node --test tests/conformance/test/dom-namespace-svg-oracle.test.mjs`
- Scoped local/temp path leak check over changed files.
- Scoped trailing-whitespace check over changed files.
- Scoped `git diff --check` over changed files.

## Verification

- Targeted oracle test passed: 10 tests passed.
- Scoped local/temp path leak check passed.
- Scoped trailing-whitespace check passed.
- Scoped `git diff --check` passed.

Full conformance should be run after merge with the other accepted oracle
workers.

## Risks Or Blockers

- The client probe uses a deterministic fake DOM rather than a real browser DOM.
- Browser layout, parser, focus, hydration, and event behavior are intentionally
  out of scope.
- Fast React compatibility is unclaimed until DOM host mutation and React DOM
  rendering are implemented.

## Recommended Next Tasks

- Use this oracle to guide namespace handling in the DOM host creation and
  property/attribute layers.
- Add a later Fast React comparison once DOM rendering can create and update
  real host nodes through the reconciler.

## Quality, Maintainability, Performance, And Security Review

- Quality: the oracle has focused tests for schema, coverage, server output,
  client operations, namespace transitions, and artifact path hygiene.
- Maintainability: all files use the `dom-namespace-svg` prefix and stay inside
  the assigned conformance scope.
- Performance: normal tests read checked JSON and do not regenerate packages.
- Security: no package lifecycle scripts or native execution paths are added.
