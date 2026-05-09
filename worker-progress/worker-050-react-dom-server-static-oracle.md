# worker-050-react-dom-server-static-oracle

## Objective

Add deterministic React DOM server/static behavior surface oracle files for React DOM 19.2.6.

Write scope honored: changes are limited to `tests/conformance/src/react-dom-server-static-*.mjs`, `tests/conformance/scripts/*react-dom-server-static*.mjs`, `tests/conformance/test/react-dom-server-static-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-server-static-oracle.json`, and this report.

## Summary

Added a deterministic React DOM 19.2.6 server/static oracle that reads the checked runtime/package inventory, downloads the exact React, React DOM, and Scheduler tarballs named by that inventory, verifies tarball integrity and file lists, and runs isolated Node probes for React DOM and local Fast React DOM placeholders.

The oracle covers seven scenarios across four probe modes, for 28 React DOM observations and 28 Fast React DOM placeholder comparisons. All Fast React DOM comparisons are intentionally classified as `unsupported-placeholder`; no Fizz behavior is implemented and no Fast React DOM server/static compatibility is claimed.

## Oracle Coverage

- Server/static export behavior for `react-dom/server`, `server.node`, `server.browser`, `server.edge`, `server.bun`, `static`, `static.node`, `static.browser`, and `static.edge`.
- `react-server` condition throwing boundaries for every server/static subpath.
- Unsupported Fast React placeholder comparison boundaries for server/static entrypoints and APIs.
- Legacy server string output for simple DOM markup through `renderToString` and `renderToStaticMarkup`.
- Explicit deferred Fizz Suspense evidence, including pending Suspense fallback output, client-rendered marker detection, template diagnostic attributes, and static-markup marker suppression.
- Basic stream shape evidence for Node pipeable streams, Web `ReadableStream`, `allReady`, second-pipe error behavior, and the `server.bun` direct-stream Node-runtime caveat.
- Basic static prerender shape evidence for Web and Node prelude streams, result keys, output bytes, and completed-render `postponed: null`.
- Basic error shape evidence for throwing components in legacy string render, Web stream shell rejection/callback paths, and static prerender rejection/callback paths.
- Explicit deferred resume behavior for invalid postponed-state calls to `resume`, `resumeToPipeableStream`, `resumeAndPrerender`, and `resumeAndPrerenderToNodeStream`.

## Deferred Behavior

- Fizz request/task/segment/boundary/postpone/resume internals remain unimplemented.
- React DOM stream and static output is target evidence only; Fast React observations stop at structured unsupported placeholders.
- Postponed state remains opaque. The oracle records invalid `null` postponed-state boundaries but does not define or implement a Fast React resume token.
- The Bun server direct-stream implementation is not executed in Node; the oracle records that runtime boundary instead of pretending Node can validate Bun direct streams.

## Changed Files

- `tests/conformance/src/react-dom-server-static-targets.mjs`
  - Defines artifact paths, React DOM and Fast React DOM targets, server/static subpaths, probe modes, and source evidence inputs.
- `tests/conformance/src/react-dom-server-static-scenarios.mjs`
  - Defines the seven deterministic server/static behavior scenarios.
- `tests/conformance/src/react-dom-server-static-probe-runner.mjs`
  - Runs isolated scenario probes, captures export descriptors, markup summaries, stream/prerender result shapes, callback/error summaries, console calls, and normalized path-free errors.
- `tests/conformance/src/react-dom-server-static-oracle-generator.mjs`
  - Generates the oracle from the checked inventory and exact npm tarballs, copies local Fast React packages for unsupported-placeholder comparison, normalizes path fragments, and records status counts.
- `tests/conformance/src/react-dom-server-static-oracle.mjs`
  - Adds checked-artifact read/stringify helpers, markdown formatting, and observation/comparison lookup helpers.
- `tests/conformance/scripts/generate-react-dom-server-static-oracle.mjs`
  - Adds a direct generator CLI with optional `--write`.
- `tests/conformance/scripts/print-react-dom-server-static-oracle.mjs`
  - Adds a checked-artifact print CLI for JSON and markdown.
- `tests/conformance/test/react-dom-server-static-oracle.test.mjs`
  - Adds schema, coverage, export, `react-server`, markup, Suspense marker, stream/prerender, error, resume-boundary, placeholder-boundary, path-leak, and print-CLI tests.
- `tests/conformance/oracles/react-19.2.6-react-dom-server-static-oracle.json`
  - Checked deterministic oracle artifact.
- `worker-progress/worker-050-react-dom-server-static-oracle.md`
  - This report.

## Evidence Gathered

- Worker 033 established the public React DOM 19.2.6 server/static package surface and export matrices.
- Worker 036 established the conformance oracle pattern for exact React DOM tarball extraction, condition modes, descriptor evidence, and no path leaks.
- Worker 042 established that server/static compatibility is Fizz-based, not a standalone string renderer, and that Fast React must keep Fizz implementation deferred until the request engine, DOM format layer, and stream adapters exist.
- Generated oracle status counts are:
  - `unsupported-placeholder`: 28
- Generated coverage flags keep `fizzImplementationAdded: false` and `compatibilityClaimed: false`.
- Nested agent usage: spawned one read-only explorer to independently review the scoped oracle hypothesis. Its result was still pending while this report was first written; final handoff should include any returned findings.

## Commands Run

- `git status --short`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-033-react-dom-inventory.md`
- `sed -n '1,260p' worker-progress/worker-036-react-dom-export-oracle.md`
- `sed -n '1,300p' worker-progress/worker-042-react-dom-server-fizz-plan.md`
- `find tests/conformance/src tests/conformance/scripts tests/conformance/test tests/conformance/oracles -maxdepth 1 -name 'react-dom-server-static-*' -print | sort`
- `sed -n` reads over the new `react-dom-server-static-*` source, script, and test files.
- `node scripts/generate-react-dom-server-static-oracle.mjs --write`
- `node --test test/react-dom-server-static-oracle.test.mjs`
- `node scripts/print-react-dom-server-static-oracle.mjs --format=markdown`
- Oracle summary inspection with `node -e`.
- `npm test --workspace @fast-react/conformance`
- Determinism byte-compare with fresh generator stdout against `oracles/react-19.2.6-react-dom-server-static-oracle.json`.

## Verification

- `node scripts/generate-react-dom-server-static-oracle.mjs --write` passed and refreshed the checked artifact.
- `node --test test/react-dom-server-static-oracle.test.mjs` passed.
  - 10 tests passed.
- Fresh generator stdout byte-compared equal to the checked oracle artifact.
- `npm test --workspace @fast-react/conformance` passed.
  - 131 tests passed.

## Risks And Follow-Ups

- The generator downloads exact registry tarballs recorded in the checked inventory. It verifies integrity and file lists, but offline regeneration will need a cache strategy if network access is unavailable.
- The behavior scenarios are intentionally surface-level. They prove deterministic export, markup, marker, stream shape, error, and invalid-resume boundaries, not full Fizz compatibility.
- Real postponed-state generation/resume is not covered because that would require implementing or deeply probing Fizz postpone semantics; this oracle records the deferred boundary instead.
- Bun direct streams are not executable in Node, so the oracle preserves the runtime caveat rather than claiming cross-runtime validation.
- Next tasks should implement the server renderer architecture planned by workers 042 and 056 before any Fast React DOM server/static compatibility claim is upgraded.

## Quality, Maintainability, Performance, And Security Review

- Quality: The oracle is anchored to exact React DOM 19.2.6 artifacts and isolates each mode/scenario/target in a child process.
- Maintainability: Targets, scenario definitions, probe logic, generation, artifact helpers, CLIs, and tests are split following existing conformance oracle patterns.
- Performance: Tests read the checked artifact and do not regenerate tarballs; generation is reserved for explicit CLI use.
- Security: The generator does not run lifecycle scripts or mutate root manifests/lockfiles. It executes only integrity-verified package code inside a temporary project and normalizes path fragments before emitting artifacts.
