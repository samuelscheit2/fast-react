export const bindingStatus = 'placeholder';
export const packageName = '@fast-react/native';

export class FastReactNativeBindingUnavailableError extends Error {
  constructor() {
    super(
      '[fast-react] Native binding is not implemented in the initial scaffold.'
    );
    this.name = 'FastReactNativeBindingUnavailableError';
  }
}

export function loadNativeBinding() {
  throw new FastReactNativeBindingUnavailableError();
}
