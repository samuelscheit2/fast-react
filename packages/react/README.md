# @fast-react/react

Early React compatibility package for Fast React.

The package exposes the initial `react@19.2.6` subpaths accepted for the
scaffold:

- `.`
- `./jsx-runtime`
- `./jsx-dev-runtime`
- `./compiler-runtime`
- `./package.json`

Exports import successfully for smoke checks. The element factory APIs covered
by the React 19.2.6 element-object oracle now construct JavaScript element
objects. Direct `createRef()` calls covered by the React 19.2.6 ref-object
oracle now return React-shaped ref objects. Direct `React.Children` helper
behavior covered by the React 19.2.6 children-helper oracle now matches for
default and `react-server` root entrypoints. Direct `memo` and `lazy`
wrapper-object behavior covered by the React 19.2.6 wrapper-object oracle now
matches for default and `react-server` root entrypoints. Unsupported React
behavior still throws an explicit unimplemented error until conformance-backed
implementations are added.

The enumerable runtime keys are intentionally aligned with the accepted
`react@19.2.6` inventory for the default Node condition and the `react-server`
condition. Scaffold metadata such as `__FAST_REACT_PLACEHOLDER__` remains
available as non-enumerable debug metadata so it does not mask export-surface
divergences.
