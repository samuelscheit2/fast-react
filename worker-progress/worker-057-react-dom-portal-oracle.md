# worker-057-react-dom-portal-oracle

## Summary

Added a deterministic React DOM 19.2.6 `createPortal` public behavior oracle. The generator reads the checked worker-017 runtime inventory, downloads the exact `react`, `react-dom`, and `scheduler` tarballs named by that inventory, verifies package integrity and tarball file lists, extracts them into an isolated temporary `node_modules`, and probes React DOM through one Node child process per scenario and mode.

The checked oracle records root/profiling/client export descriptors, default and `react-server` condition boundaries, accepted and rejected container behavior, key coercion, portal object shape, portal mutability, and direct invocation boundaries. No Fast React comparison is included; compatibility claims intentionally remain false because React DOM implementation work is outside this worker scope.

Nested explorer evidence was used as an independent pattern check for the resumed partial implementation. The explorer was asked to inspect current portal files against existing conformance oracle patterns and report coverage, determinism, and path-leak risks without editing files.

## Changed Files

- `tests/conformance/src/react-dom-portal-targets.mjs`
  - Defines the React DOM 19.2.6 target, supporting `react` and `scheduler` packages, probe modes, source documents, and checked artifact path.
- `tests/conformance/src/react-dom-portal-scenarios.mjs`
  - Lists portal oracle scenario IDs and the public behavior each scenario captures.
- `tests/conformance/src/react-dom-portal-probe-runner.mjs`
  - Isolated child-process probe runner for export descriptors, container validation, key handling, portal shape, mutability, invocation behavior, and `react-server` unsupported boundaries.
- `tests/conformance/src/react-dom-portal-oracle-generator.mjs`
  - Generates the checked oracle from exact npm tarballs and the checked runtime inventory, with temp/package/workspace path normalization.
- `tests/conformance/src/react-dom-portal-oracle.mjs`
  - Adds stringify/read helpers, markdown formatting, and observation lookup helpers.
- `tests/conformance/scripts/generate-react-dom-portal-oracle.mjs`
  - Direct `node` generator CLI with optional `--write`.
- `tests/conformance/scripts/print-react-dom-portal-oracle.mjs`
  - Direct `node` print CLI for JSON and markdown output.
- `tests/conformance/test/react-dom-portal-oracle.test.mjs`
  - Adds schema, target, coverage, descriptor, container, key, object-shape, boundary, path-leak, and print-CLI tests.
- `tests/conformance/oracles/react-19.2.6-react-dom-portal-oracle.json`
  - Checked deterministic oracle artifact.
- `worker-progress/worker-057-react-dom-portal-oracle.md`
  - This report.

## Oracle Coverage

- Runtime modes:
  - default Node development
  - default Node production
  - `--conditions=react-server` development
  - `--conditions=react-server` production
- Export and descriptor coverage:
  - `react-dom` root `createPortal` presence and data descriptor
  - `react-dom/profiling` `createPortal` presence and descriptor evidence
  - `react-dom/client` `createPortal` absence
  - `react-server` root absence plus `client` and `profiling` unsupported errors
- Container coverage:
  - Accepts nodeType `1`, `9`, and `11` node-like containers.
  - Rejects `undefined`, `null`, booleans, numbers, strings, plain objects, text nodes, and comment nodes, including the unstable mount-point comment form.
- Key coverage:
  - Omitted, `undefined`, `null`, empty string, string, number, booleans, bigint, object coercion, and Symbol failure behavior.
  - Development Symbol key warning and production no-warning behavior.
- Portal object coverage:
  - `Symbol.for("react.portal")` tag, own-key order, data descriptors, selected value identity, `implementation === null`, mutability, deletion, extension, and `React.isValidElement` result.
- Invocation boundary coverage:
  - `call`, `apply`, extra arguments, constructor invocation, and unavailable `react-server` direct call behavior.

## Intentional Gaps

- No Fast React React DOM package comparison is included. This oracle is pinned React DOM behavior evidence only.
- Rendering semantics are out of scope. The oracle does not claim behavior for portal commits, child placement, event listener setup, `preparePortalMount`, hydration, or root scheduling.
- Container probes use deterministic node-like objects instead of a browser DOM because synchronous public `createPortal` validation depends on `nodeType`, not browser mutation behavior.
- Type declaration coverage is out of scope and remains covered by the React DOM type inventory work.

## Commands Run

- `git status --short`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `rg --files tests/conformance/src tests/conformance/scripts tests/conformance/test tests/conformance/oracles worker-progress | rg '(react-dom-(export|client-root|portal)|element-object|context-object|scheduler-root)'`
- `sed -n '1,260p' tests/conformance/src/react-dom-portal-oracle-generator.mjs`
- `sed -n '261,620p' tests/conformance/src/react-dom-portal-oracle-generator.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-portal-scenarios.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-portal-probe-runner.mjs`
- `sed -n '261,620p' tests/conformance/src/react-dom-portal-probe-runner.mjs`
- `sed -n '620,980p' tests/conformance/src/react-dom-portal-probe-runner.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-portal-oracle.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-portal-targets.mjs`
- `sed -n '1,260p' tests/conformance/test/react-dom-portal-oracle.test.mjs`
- `sed -n '261,620p' tests/conformance/test/react-dom-portal-oracle.test.mjs`
- `sed -n '1,260p' tests/conformance/scripts/generate-react-dom-portal-oracle.mjs`
- `sed -n '1,260p' tests/conformance/scripts/print-react-dom-portal-oracle.mjs`
- `sed -n '1,240p' tests/conformance/package.json`
- `sed -n '1,220p' tests/conformance/test/react-dom-export-oracle.test.mjs`
- `sed -n '1,180p' tests/conformance/src/react-dom-export-oracle-generator.mjs`
- `sed -n '1,240p' worker-progress/worker-057-react-dom-portal-oracle.md`
- `node --version`
- `npm --version`
- `head -n 80 tests/conformance/oracles/react-19.2.6-react-dom-portal-oracle.json`
- `tail -n 80 tests/conformance/oracles/react-19.2.6-react-dom-portal-oracle.json`
- `node --test tests/conformance/test/react-dom-portal-oracle.test.mjs`
- `node tests/conformance/scripts/generate-react-dom-portal-oracle.mjs`
- `cmp -s <(node tests/conformance/scripts/generate-react-dom-portal-oracle.mjs) tests/conformance/oracles/react-19.2.6-react-dom-portal-oracle.json`
- `rg "\\b(relative|sep)\\b" tests/conformance/src/react-dom-portal-oracle-generator.mjs`
- `npm test --workspace @fast-react/conformance`

## Verification

- Focused portal oracle test passed:
  - `node --test tests/conformance/test/react-dom-portal-oracle.test.mjs`
  - 10 tests passed.
- Regeneration determinism passed:
  - Fresh stdout generation byte-compared equal to `tests/conformance/oracles/react-19.2.6-react-dom-portal-oracle.json`.
- Full conformance workspace test passed:
  - `npm test --workspace @fast-react/conformance`
  - 131 tests passed.

## Risks And Follow-Ups

- The generator downloads exact tarballs from registry URLs recorded in the checked inventory. It verifies integrity and file lists, but offline regeneration would need an explicit cache strategy.
- The checked artifact is intentionally behavior-rich and large because it records descriptors and object shapes across four modes. Future implementation workers should compare only the relevant slices needed for React DOM portal support.
- A Fast React comparison should be added only after the React DOM package has a real `createPortal` implementation surface; until then, keeping compatibility claims false prevents accidental overclaiming.

## Quality, Maintainability, Performance, And Security Review

- Quality: the oracle is schema-tested, coverage-tested, and generated from the checked runtime inventory instead of inferred behavior.
- Maintainability: portal-specific files stay under the `react-dom-portal` prefix, reuse the established conformance generator/probe/read-helper pattern, and keep intentional gaps explicit.
- Performance: generation runs one short-lived Node process per scenario and mode; it is network-bound only while fetching exact tarballs and does not mutate package metadata or workspace lockfiles.
- Security: npm tarballs are taken only from the checked inventory, verified by integrity and tarball file list before extraction, extracted into an isolated temporary tree, and lifecycle scripts are not executed.
