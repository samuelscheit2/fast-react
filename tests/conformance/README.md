# Fast React Runtime Package Inventory

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

Commands:

```sh
npm run inventory:generate --workspace @fast-react/conformance
npm run inventory:print --workspace @fast-react/conformance
npm run inventory:print:markdown --workspace @fast-react/conformance
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
