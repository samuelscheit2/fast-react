'use strict';

const compatibilityTarget = 'react@19.2.6';
const placeholderVersion = '0.0.0-fast-react-placeholder';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';

function createUnimplementedError(entrypoint, exportName, action, detail) {
  const suffix = detail === undefined ? '' : ` ${detail}`;
  const error = new Error(
    `[fast-react] ${entrypoint}.${exportName} ${action}, but this ` +
      `placeholder has no React behavior implementation yet. It exists to ` +
      `track the accepted ${compatibilityTarget} runtime export inventory; ` +
      `do not treat it as React-compatible behavior.${suffix}`
  );

  error.name = 'FastReactUnimplementedError';
  error.code = unimplementedCode;
  error.entrypoint = entrypoint;
  error.exportName = exportName;
  error.compatibilityTarget = compatibilityTarget;

  return error;
}

function createUnimplementedFunction(entrypoint, exportName) {
  const fn = function fastReactUnimplementedPlaceholder() {
    throw createUnimplementedError(entrypoint, exportName, 'was called');
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
    value: 'FastReactUnimplementedInternals'
  });

  return new Proxy(target, {
    get(_target, property) {
      if (property === Symbol.toStringTag) {
        return 'FastReactUnimplementedInternals';
      }

      throw createUnimplementedError(
        entrypoint,
        `${exportName}.${String(property)}`,
        'was accessed',
        'The private internals shape is intentionally pending conformance-backed investigation.'
      );
    },
    getOwnPropertyDescriptor() {
      return undefined;
    },
    has(_target, property) {
      throw createUnimplementedError(
        entrypoint,
        `${exportName}.${String(property)}`,
        'was checked',
        'The private internals shape is intentionally pending conformance-backed investigation.'
      );
    },
    ownKeys() {
      return [];
    },
    set(_target, property) {
      throw createUnimplementedError(
        entrypoint,
        `${exportName}.${String(property)}`,
        'was assigned',
        'The private internals shape is intentionally pending conformance-backed investigation.'
      );
    }
  });
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
  createUnimplementedError,
  createUnimplementedFunction,
  definePlaceholderMetadata,
  placeholderVersion,
  unimplementedCode
};
