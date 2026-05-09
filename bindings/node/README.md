# @fast-react/native

Placeholder Node loader for the future Fast React native binding.

The package intentionally imports without loading a `.node` addon. Calling
`loadNativeBinding()` throws `FastReactNativeBindingUnavailableError` until the
N-API implementation and native artifact policy are defined.
