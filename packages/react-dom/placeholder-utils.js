'use strict';

const compatibilityTarget = 'react-dom@19.2.6';
const placeholderVersion = '0.0.0-fast-react-dom-placeholder';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';
const reactServerUnsupportedCode = 'FAST_REACT_REACT_SERVER_UNSUPPORTED';

function createUnsupportedError(entrypoint, exportName, action, detail) {
  const suffix = detail === undefined ? '' : ` ${detail}`;
  const error = new Error(
    `[fast-react] ${entrypoint}.${exportName} ${action}, but this ` +
      `placeholder has no React DOM behavior implementation yet. It exists ` +
      `to track the accepted ${compatibilityTarget} package surface; do not ` +
      `treat it as React DOM-compatible behavior.${suffix}`
  );

  error.name = 'FastReactDomUnimplementedError';
  error.code = unimplementedCode;
  error.entrypoint = entrypoint;
  error.exportName = exportName;
  error.compatibilityTarget = compatibilityTarget;

  return error;
}

function createUnsupportedFunction(entrypoint, exportName) {
  const fn = function fastReactDomUnimplementedPlaceholder() {
    throw createUnsupportedError(entrypoint, exportName, 'was called');
  };

  Object.defineProperty(fn, 'name', {
    configurable: true,
    value: exportName
  });

  return fn;
}

function createPrivateInternalsPlaceholder(entrypoint, exportName) {
  const target = Object.create(null);

  Object.defineProperty(target, Symbol.toStringTag, {
    configurable: true,
    value: 'FastReactDomUnimplementedInternals'
  });

  return new Proxy(target, {
    get(_target, property) {
      if (property === Symbol.toStringTag) {
        return 'FastReactDomUnimplementedInternals';
      }

      throw createUnsupportedError(
        entrypoint,
        `${exportName}.${String(property)}`,
        'was accessed',
        'The private React DOM internals shape is intentionally pending conformance-backed investigation.'
      );
    },
    getOwnPropertyDescriptor() {
      return undefined;
    },
    has(_target, property) {
      throw createUnsupportedError(
        entrypoint,
        `${exportName}.${String(property)}`,
        'was checked',
        'The private React DOM internals shape is intentionally pending conformance-backed investigation.'
      );
    },
    ownKeys() {
      return [];
    },
    set(_target, property) {
      throw createUnsupportedError(
        entrypoint,
        `${exportName}.${String(property)}`,
        'was assigned',
        'The private React DOM internals shape is intentionally pending conformance-backed investigation.'
      );
    }
  });
}

function createReactServerUnsupportedError(entrypoint) {
  const error = new Error(
    `${entrypoint} is not supported in React Server Components.`
  );

  error.name = 'FastReactDomReactServerUnsupportedError';
  error.code = reactServerUnsupportedCode;
  error.entrypoint = entrypoint;
  error.compatibilityTarget = compatibilityTarget;

  return error;
}

function throwReactServerUnsupported(entrypoint) {
  throw createReactServerUnsupportedError(entrypoint);
}

function definePlaceholderMetadata(exportsObject, entrypoint) {
  Object.defineProperties(exportsObject, {
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

  return exportsObject;
}

module.exports = {
  compatibilityTarget,
  createPrivateInternalsPlaceholder,
  createReactServerUnsupportedError,
  createUnsupportedError,
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion,
  reactServerUnsupportedCode,
  throwReactServerUnsupported,
  unimplementedCode
};
