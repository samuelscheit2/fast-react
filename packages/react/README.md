# @fast-react/react

Placeholder React compatibility package for Fast React.

The package exposes the initial `react@19.2.6` subpaths accepted for the
scaffold:

- `.`
- `./jsx-runtime`
- `./jsx-dev-runtime`
- `./compiler-runtime`
- `./package.json`

Exports import successfully for smoke checks. Any React behavior throws an
explicit unimplemented error until conformance-backed implementations are added.

The enumerable runtime keys are intentionally aligned with the accepted
`react@19.2.6` inventory for the default Node condition and the `react-server`
condition. Scaffold metadata such as `__FAST_REACT_PLACEHOLDER__` remains
available as non-enumerable debug metadata so it does not mask export-surface
divergences.
