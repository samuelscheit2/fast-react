'use strict';

const bindingStatus = 'placeholder';
const packageName = '@fast-react/native';

class FastReactNativeBindingUnavailableError extends Error {
  constructor() {
    super(
      '[fast-react] Native binding is not implemented in the initial scaffold.'
    );
    this.name = 'FastReactNativeBindingUnavailableError';
  }
}

function loadNativeBinding() {
  throw new FastReactNativeBindingUnavailableError();
}

module.exports = {
  FastReactNativeBindingUnavailableError,
  bindingStatus,
  loadNativeBinding,
  packageName
};
