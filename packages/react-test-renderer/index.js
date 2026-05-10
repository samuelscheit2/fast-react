'use strict';

const compatibilityTarget = 'react-test-renderer@19.2.6';
const entrypoint = 'react-test-renderer';
const placeholderVersion = '0.0.0-fast-react-test-renderer-placeholder';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';
const isProduction = process.env.NODE_ENV === 'production';

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

function createRendererUnsupportedFunction(exportName, length, detail) {
  const fn = function fastReactTestRendererRendererPlaceholder() {
    throw createUnsupportedError(exportName, 'was called', detail);
  };

  return defineFunctionShape(fn, exportName.split('.').pop(), length);
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

function createPlaceholderRenderer() {
  const renderer = {
    _Scheduler: createSchedulerPlaceholder(),
    root: undefined,
    toJSON: createRendererUnsupportedFunction(
      'create().toJSON',
      0,
      'Serialization is intentionally blocked until committed test-renderer host output and serializer APIs exist.'
    ),
    toTree: createRendererUnsupportedFunction(
      'create().toTree',
      0,
      'Fiber tree inspection is intentionally blocked until a committed-fiber inspection API exists.'
    ),
    update: createRendererUnsupportedFunction(
      'create().update',
      1,
      'Root updates are intentionally blocked until the JavaScript facade can route through the Rust TestRendererRoot.'
    ),
    unmount: createRendererUnsupportedFunction(
      'create().unmount',
      0,
      'Root unmount is intentionally blocked until the JavaScript facade can route through the Rust TestRendererRoot.'
    ),
    getInstance: createRendererUnsupportedFunction(
      'create().getInstance',
      0,
      'Public instance lookup is intentionally blocked until TestInstance and createNodeMock behavior are implemented.'
    ),
    unstable_flushSync: createRendererUnsupportedFunction(
      'create().unstable_flushSync',
      1,
      'Synchronous flushing is intentionally blocked until react-test-renderer act and scheduler integration are wired.'
    )
  };

  Object.defineProperty(renderer, 'root', {
    configurable: true,
    enumerable: true,
    get() {
      throw createUnsupportedError(
        'create().root',
        'was accessed',
        'TestInstance root access is intentionally blocked until committed fiber inspection is implemented.'
      );
    }
  });

  return renderer;
}

function create() {
  return createPlaceholderRenderer();
}

exports._Scheduler = createSchedulerPlaceholder();
exports.act = isProduction ? undefined : createUnsupportedFunction('act', 1);
exports.create = defineFunctionShape(create, 'create', 2);
exports.unstable_batchedUpdates = createUnsupportedFunction(
  'unstable_batchedUpdates',
  2
);
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports);
