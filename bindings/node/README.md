# @fast-react/native

Placeholder Node loader for the future Fast React native binding.

The package intentionally imports without loading a `.node` addon. Calling
`loadNativeBinding()` throws `FastReactNativeBindingUnavailableError` with the
future platform package and artifact name that would be needed for the current
runtime.

The loader documents the planned optional native package shape without declaring
those packages yet:

- `@fast-react/native-darwin-arm64`
- `@fast-react/native-darwin-x64`
- `@fast-react/native-linux-arm64-gnu`
- `@fast-react/native-linux-arm64-musl`
- `@fast-react/native-linux-x64-gnu`
- `@fast-react/native-linux-x64-musl`
- `@fast-react/native-win32-arm64-msvc`
- `@fast-react/native-win32-x64-msvc`

Real N-API dependencies and binary loading remain deliberately unimplemented.
