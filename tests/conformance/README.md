# Fast React Conformance Inventory Placeholder

This package owns the first deterministic conformance inventory placeholder for
the React 19.2.6 compatibility target. It records which package targets future
inventory generation must cover, but it does not fetch tarballs, execute React,
probe runtime exports, parse declaration files, or compare Fast React against
React.

Current target description:

- `react@19.2.6`
- `react-dom@19.2.6`
- `@types/react@19.2.14`
- Supporting package tracked for a future project decision:
  `@types/react-dom@19.2.3`
- Supporting package tracked because `react-dom@19.2.6` depends on it:
  `scheduler@0.27.0`

The checked-in placeholder artifact is
`inventory/react-19.2.6-target-placeholder.json`.

Commands:

```sh
npm test --workspace @fast-react/conformance
npm run inventory:placeholder --workspace @fast-react/conformance
npm run inventory:placeholder:markdown --workspace @fast-react/conformance
```

Planned strategy:

1. Resolve exact npm metadata and tarball identities for pinned packages.
2. Download tarballs into a temporary directory only, without mutating the
   repository.
3. Parse package export maps into subpath and condition rows.
4. Probe runtime entrypoints in isolated Node child processes with timeouts.
5. Parse type declarations with the TypeScript compiler API.
6. Execute each scenario once against pinned `react@19.2.6` packages.
7. Execute the same scenario against Fast React aliased to the same public
   entrypoints.
8. Compare normalized JSON observations for package resolution, object shapes,
   errors, warnings, render logs, DOM snapshots, effect order, stream chunks, and
   TypeScript compile results.
9. Track expected divergences with an owner, milestone, reason, and expiry.

The current package proves only that the pinned target placeholder is stable and
that the future inventory stages are explicitly marked `not-generated`.
