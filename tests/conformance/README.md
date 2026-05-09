# Fast React Conformance Evidence

This package owns deterministic runtime/package inventory generation for the
React 19.2.6 compatibility target. It records evidence from real npm package
metadata and tarball artifacts, including package export maps, tarball file
lists, condition-specific resolution, and runtime export keys for pinned React
entrypoints.

Current generated runtime targets:

- `react@19.2.6`
- `react-dom@19.2.6`

Supporting runtime package:

- `scheduler@0.27.0`, because `react-dom@19.2.6` depends on it and React DOM
  runtime probes need it available.

Manual fields remain explicit:

- `@types/react@19.2.14` and `@types/react-dom@19.2.3` are listed as manual
  type-declaration targets only. Type parsing is not generated in this worker.
- Fast React behavior compatibility is explicitly false. Inventory data is not
  a dual-run oracle result.

Checked-in generated artifact:

- `inventory/react-19.2.6-runtime-package-inventory.json`
- `oracles/react-19.2.6-element-object-oracle.json`
- `oracles/react-19.2.6-ref-object-oracle.json`
- `oracles/react-19.2.6-children-helper-oracle.json`
- `oracles/react-19.2.6-wrapper-object-oracle.json`

Commands:

```sh
npm run inventory:generate --workspace @fast-react/conformance
npm run inventory:print --workspace @fast-react/conformance
npm run inventory:print:markdown --workspace @fast-react/conformance
npm run element-object:generate --workspace @fast-react/conformance
npm run element-object:print --workspace @fast-react/conformance
npm run element-object:print:markdown --workspace @fast-react/conformance
npm run ref-object:generate --workspace @fast-react/conformance
npm run ref-object:print --workspace @fast-react/conformance
npm run ref-object:print:markdown --workspace @fast-react/conformance
npm run children-helper:generate --workspace @fast-react/conformance
npm run children-helper:print --workspace @fast-react/conformance
npm run children-helper:print:markdown --workspace @fast-react/conformance
npm run wrapper-object:generate --workspace @fast-react/conformance
npm run wrapper-object:print --workspace @fast-react/conformance
npm run wrapper-object:print:markdown --workspace @fast-react/conformance
npm test --workspace @fast-react/conformance
```

Generation strategy:

1. Resolve exact package metadata from the npm registry.
2. Download exact tarballs into a temporary directory.
3. Verify tarball integrity from `dist.integrity`.
4. Extract tarballs into a temporary `node_modules` tree without running
   lifecycle scripts or mutating root manifests.
5. Parse package `exports` into stable subpath and condition rows.
6. Probe runtime entrypoints in isolated Node child processes with a timeout for
   default Node and `react-server` conditions in development and production.
7. Record condition-specific `require.resolve` evidence for browser, worker,
   edge-light, workerd, bun, and deno conditions as Node resolver evidence only.
8. Record blocked physical `.js` subpaths such as `react/index.js` and
   `react-dom/server.js`.

This inventory still does not execute Fast React, compare Fast React against
React, parse TypeScript declaration packages, or prove behavior compatibility.
The future dual-run oracle harness must make those claims separately.

Element-object oracle strategy:

1. Resolve exact `react@19.2.6` npm metadata.
2. Download the exact React tarball into a temporary directory.
3. Verify tarball integrity from `dist.integrity`.
4. Extract React and copy the local `@fast-react/react` package into a
   temporary `node_modules` tree.
5. Run one isolated Node child process per target, scenario, and mode. Modes
   cover default Node and `--conditions=react-server`, each in development and
   production.
6. Capture normalized JSON for `createElement`, `cloneElement`, `jsx`, `jsxs`,
   `jsxDEV`, and `isValidElement` behavior, including keys, own-key order,
   descriptors, getter names, `isReactWarning`, key/ref behavior, freeze/seal
   state, child-array identity/freeze behavior, warnings, thrown errors, and
   brand checks.
7. Compare local Fast React observations against the React oracle as explicit
   `unexpected-match-compatibility-not-claimed`, `known-mismatch`, or
   `unsupported-placeholder` statuses.

The element-object oracle is the first behavior oracle. It compares local Fast
React package entrypoints, but it still explicitly does not claim Fast React
behavior compatibility.

Ref-object oracle strategy:

1. Resolve exact `react@19.2.6` npm metadata.
2. Download the exact React tarball into a temporary directory.
3. Verify tarball integrity from `dist.integrity`.
4. Extract React and copy the local `@fast-react/react` package into a
   temporary `node_modules` tree.
5. Run one isolated Node child process per target, scenario, and mode. Modes
   cover default Node and `--conditions=react-server`, each in development and
   production.
6. Capture normalized JSON for direct `createRef` behavior, including export
   presence and descriptors, function descriptors, call result own keys,
   `current` descriptors, prototype, freeze/seal/extensible state, initial
   `current`, per-call identity, argument and `this` handling, constructor
   calls, mutability, and add/delete behavior.
7. Compare local Fast React observations against the React oracle as explicit
   `matched-but-compatibility-not-claimed`, `known-mismatch`, or
   `unsupported-placeholder` statuses.

The ref-object oracle intentionally excludes render-time ref attachment,
callback refs, string refs, `forwardRef`, `useRef`, owner stacks, and renderer
commit behavior.

Children helper oracle strategy:

1. Resolve exact `react@19.2.6` npm metadata.
2. Download the exact React tarball into a temporary directory.
3. Verify tarball integrity from `dist.integrity`.
4. Extract React and copy the local `@fast-react/react` package into a
   temporary `node_modules` tree.
5. Run one isolated Node child process per target, scenario, and mode. Modes
   cover default Node and `--conditions=react-server`, each in development and
   production.
6. Capture normalized JSON for direct `React.Children` helper behavior,
   including helper descriptors, nullish/scalar/boolean/array traversal, nested
   arrays, elements and fragments as leaves, portal-shaped objects as direct
   leaves, iterables, callback arguments and `thisArg`, callback return
   handling, key synthesis and escaping, direct thenable handling, Map
   warnings, and thrown helper errors.
7. Compare local Fast React observations against the React oracle as explicit
   `matched-but-compatibility-not-claimed`, `known-mismatch`, or
   `unsupported-placeholder` statuses.

The Children helper oracle intentionally excludes renderer traversal, owner
stacks, rendering fragments into their children, real portal creation from
renderers, and `lazy` behavior before `lazy` itself has conformance-backed
support.

Wrapper object oracle strategy:

1. Resolve exact `react@19.2.6` npm metadata.
2. Download the exact React tarball into a temporary directory.
3. Verify tarball integrity from `dist.integrity`.
4. Extract React and copy the local `@fast-react/react` package into a
   temporary `node_modules` tree.
5. Run one isolated Node child process per target, scenario, and mode. Modes
   cover default Node and `--conditions=react-server`, each in development and
   production.
6. Capture normalized JSON for direct `memo` and `lazy` wrapper-object behavior,
   including export descriptors, function descriptors, wrapper own-key order,
   property descriptors, tags, payload status/result values, development-only
   `displayName`, `_debugInfo`, and `_ioInfo` fields, console warnings, and
   direct lazy `_init` state transitions for deterministic thenables.
7. Compare local Fast React observations against the React oracle as explicit
   `matched-but-compatibility-not-claimed`, `known-mismatch`, or
   `unsupported-placeholder` statuses.

The wrapper object oracle intentionally excludes rendering, Suspense resolution
through a renderer, memo compare invocation, memo bailout behavior, component
invocation, owner stacks, hooks, context, refs lifecycle, `forwardRef`, and
private internals.
