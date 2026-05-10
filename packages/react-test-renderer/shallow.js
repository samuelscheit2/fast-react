'use strict';

const compatibilityTarget = 'react-test-renderer@19.2.6';
const entrypoint = 'react-test-renderer/shallow';
const shallowUnsupportedCode =
  'FAST_REACT_TEST_RENDERER_SHALLOW_UNSUPPORTED';

function createShallowUnsupportedError(action) {
  const error = new Error(
    `[fast-react] ${entrypoint} ${action}, but shallow rendering is ` +
      `removed from ${compatibilityTarget} and Fast React does not provide ` +
      `a replacement. This placeholder exists only to preserve the public ` +
      `package subpath without claiming shallow renderer behavior.`
  );

  error.name = 'FastReactTestRendererShallowUnsupportedError';
  error.code = shallowUnsupportedCode;
  error.entrypoint = entrypoint;
  error.compatibilityTarget = compatibilityTarget;

  return error;
}

function shallow() {
  throw createShallowUnsupportedError('was called');
}

Object.defineProperties(shallow, {
  length: {
    configurable: true,
    value: 0
  },
  name: {
    configurable: true,
    value: 'shallow'
  },
  __FAST_REACT_PLACEHOLDER__: {
    enumerable: false,
    value: true
  },
  __FAST_REACT_ENTRYPOINT__: {
    enumerable: false,
    value: entrypoint
  },
  compatibilityTarget: {
    enumerable: false,
    value: compatibilityTarget
  }
});

module.exports = shallow;
