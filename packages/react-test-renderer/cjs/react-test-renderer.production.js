'use strict';

const compatibilityTarget = 'react-test-renderer@19.2.6';
const entrypoint =
  'react-test-renderer/cjs/react-test-renderer.production';
const placeholderVersion = '0.0.0-fast-react-test-renderer-placeholder';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';

function createUnsupportedError(exportName, action, detail) {
  const suffix = detail === undefined ? '' : ` ${detail}`;
  const error = new Error(
    `[fast-react] ${entrypoint}.${exportName} ${action}, but this ` +
      `placeholder has no React Test Renderer behavior implementation yet. ` +
      `It exists to track the accepted ${compatibilityTarget} package ` +
      `surface; do not treat it as React Test Renderer-compatible ` +
      `behavior.${suffix}`
  );

  error.name = 'FastReactTestRendererUnimplementedError';
  error.code = unimplementedCode;
  error.entrypoint = entrypoint;
  error.exportName = exportName;
  error.compatibilityTarget = compatibilityTarget;

  return error;
}

function defineFunctionShape(fn, name, length) {
  Object.defineProperties(fn, {
    length: {
      configurable: true,
      value: length
    },
    name: {
      configurable: true,
      value: name
    }
  });

  return fn;
}

function createUnsupportedFunction(exportName, length) {
  const fn = function fastReactTestRendererUnimplementedPlaceholder() {
    throw createUnsupportedError(exportName, 'was called');
  };

  return defineFunctionShape(fn, exportName, length);
}

function createSchedulerPlaceholder() {
  const target = Object.create(null);

  Object.defineProperty(target, Symbol.toStringTag, {
    configurable: true,
    value: 'FastReactTestRendererUnimplementedScheduler'
  });

  return new Proxy(target, {
    get(_target, property) {
      if (property === Symbol.toStringTag) {
        return 'FastReactTestRendererUnimplementedScheduler';
      }

      throw createUnsupportedError(
        `_Scheduler.${String(property)}`,
        'was accessed',
        'The public Scheduler exposure is intentionally blocked until react-test-renderer act and scheduling behavior are wired.'
      );
    },
    getOwnPropertyDescriptor() {
      return undefined;
    },
    has(_target, property) {
      throw createUnsupportedError(
        `_Scheduler.${String(property)}`,
        'was checked',
        'The public Scheduler exposure is intentionally blocked until react-test-renderer act and scheduling behavior are wired.'
      );
    },
    ownKeys() {
      return [];
    },
    set(_target, property) {
      throw createUnsupportedError(
        `_Scheduler.${String(property)}`,
        'was assigned',
        'The public Scheduler exposure is intentionally blocked until react-test-renderer act and scheduling behavior are wired.'
      );
    }
  });
}

function definePlaceholderMetadata(exportsObject) {
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

exports._Scheduler = createSchedulerPlaceholder();
exports.act = createUnsupportedFunction('act', 1);
exports.create = createUnsupportedFunction('create', 2);
exports.unstable_batchedUpdates = createUnsupportedFunction(
  'unstable_batchedUpdates',
  2
);
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports);
