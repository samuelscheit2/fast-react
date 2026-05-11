# worker-950-react-children-traversal-blocker-currentness

## Objective

Add private/source-owned currentness evidence around direct `React.Children`
helper traversal while preserving the existing public compatibility blockers.

## Sources read

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `packages/react/children-helper.js`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `tests/conformance/src/children-helper-*`
- `tests/conformance/test/children-helper-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-children-helper-oracle.json`
- `worker-progress/worker-025-children-helpers.md`
- `/Users/user/Developer/Developer/react-reference/packages/react/src/ReactChildren.js`
- `/Users/user/Developer/Developer/react-reference/packages/react/src/ReactClient.js`
- `/Users/user/Developer/Developer/react-reference/packages/shared/ReactSymbols.js`

React reference checked at tag `v19.2.6`, commit
`eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.

## Changes

- Added an internal-only Children traversal currentness report and consumer in
  `packages/react/children-helper.js`.
- Added source-owned metadata for React 19.2.6 anchors:
  `ReactChildren.escape`, `escapeUserProvidedKey`, `getElementKey`,
  `resolveThenable`, `mapIntoArray`, `mapChildren`, `countChildren`,
  `forEachChildren`, `toArray`, `onlyChild`; `ReactClient.Children`; and
  `ReactSymbols` element/portal/lazy/iterator tags.
- Added live private behavior checks for nullish/boolean/scalar/array
  traversal, element/fragment/portal leaves, key/path escaping, Set/generator
  and Map-entry iterables, direct thenables, invalid object/only/missing
  callback/callback/iterator error shapes, and current lazy traversal blocking.
- Restored the module-level Map warning flag after private behavior probes so
  creating the private report cannot suppress the public development Map
  warning.
- Added fail-closed rejection for cloned reports, forged source/package rows,
  caller-shaped traversal rows, stale behavior probes, public/full-parity
  claims, extra caller-shaped report fields, owner/dispatcher/root prerequisite
  smuggling, and unsupported lazy/renderer/portal/owner/ref claims.
- Added `tests/conformance/test/children-helper-currentness-gate.test.mjs`.

Public `React.Children` exports, root package keys, package exports, and the
checked Children oracle behavior were not changed.

## Evidence

- Existing checked oracle remains the public/package behavior anchor:
  `tests/conformance/oracles/react-19.2.6-children-helper-oracle.json`.
- The new private report records exact source and oracle anchors but keeps
  `compatibilityClaimed`, `publicCompatibilityClaimed`,
  `packageCompatibilityClaimed`, `fullReactChildrenParityClaimed`, and
  `fastReactBehaviorCompatible` false.
- Currentness report validation now rejects unknown fields before consuming
  evidence, including caller-added public claim names such as
  `publicChildrenTraversalCompatibilityClaimed` and
  `portalCompatibilityClaimed`.
- The focused currentness gate proves private report creation does not consume
  the public Map warning state; a fresh public `React.Children.toArray(new Map)`
  still emits the React 19.2.6 development warning after report creation.
- Lazy child traversal remains explicitly blocked: React source has a
  `REACT_LAZY_TYPE` branch, but this lane does not admit lazy traversal until
  lazy behavior is separately oracle-backed.
- Renderer traversal, fragment rendering into children, real portal creation,
  owner stacks, refs, dispatcher/root/Scheduler prerequisites, and public
  renderer/package compatibility remain blocked.

## Commands run

```sh
git -C /Users/user/Developer/Developer/react-reference rev-parse HEAD
git -C /Users/user/Developer/Developer/react-reference describe --tags --exact-match HEAD
rg -n "function mapIntoArray|function mapChildren|function countChildren|function toArray|function only|resolveThenable|escapeUserProvidedKey|REACT_PORTAL_TYPE|REACT_LAZY_TYPE" /Users/user/Developer/Developer/react-reference/packages/react/src /Users/user/Developer/Developer/react-reference/packages/shared /Users/user/Developer/Developer/react-reference/packages/react-server/src
node --check packages/react/children-helper.js
node --check tests/conformance/test/children-helper-currentness-gate.test.mjs
node --test tests/conformance/test/children-helper-currentness-gate.test.mjs
node --test tests/conformance/test/children-helper-oracle.test.mjs
node --test tests/conformance/test/children-helper-currentness-gate.test.mjs tests/conformance/test/children-helper-oracle.test.mjs
npm test --workspace @fast-react/react
npm run check:package-surface
node tests/smoke/package-surface-guard.mjs
node tests/smoke/import-entrypoints.mjs
tmp=$(mktemp) && node tests/conformance/scripts/generate-children-helper-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-children-helper-oracle.json "$tmp" && rm "$tmp"
git diff --check
```

## Risks and blockers

- This is private evidence only. It does not claim full React Children parity.
- `React.Children` lazy traversal remains a known unsupported edge because this
  lane did not add a lazy oracle or implementation.
- Renderer behavior, root scheduling, owner stacks, ref lifecycle, DOM/native
  portals, and package-wide compatibility remain blocked.

## Recommended next tasks

1. Add a pinned lazy behavior oracle before considering Children traversal of
   `REACT_LAZY_TYPE` values.
2. Keep renderer/portal/root behavior in renderer-owned lanes rather than
   expanding the direct Children helper evidence.
