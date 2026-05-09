'use strict';

const {
  createPrivateInternalsPlaceholder,
  createUnimplementedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react';

const Children = Object.freeze({
  count: createUnimplementedFunction(entrypoint, 'Children.count'),
  forEach: createUnimplementedFunction(entrypoint, 'Children.forEach'),
  map: createUnimplementedFunction(entrypoint, 'Children.map'),
  only: createUnimplementedFunction(entrypoint, 'Children.only'),
  toArray: createUnimplementedFunction(entrypoint, 'Children.toArray')
});

exports.Children = Children;
exports.Fragment = Symbol.for('react.fragment');
exports.Profiler = Symbol.for('react.profiler');
exports.StrictMode = Symbol.for('react.strict_mode');
exports.Suspense = Symbol.for('react.suspense');
exports.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  createPrivateInternalsPlaceholder(
    entrypoint,
    '__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'
  );
exports.cache = createUnimplementedFunction(entrypoint, 'cache');
exports.cacheSignal = createUnimplementedFunction(entrypoint, 'cacheSignal');
exports.captureOwnerStack = createUnimplementedFunction(
  entrypoint,
  'captureOwnerStack'
);
exports.cloneElement = createUnimplementedFunction(entrypoint, 'cloneElement');
exports.createElement = createUnimplementedFunction(entrypoint, 'createElement');
exports.createRef = createUnimplementedFunction(entrypoint, 'createRef');
exports.forwardRef = createUnimplementedFunction(entrypoint, 'forwardRef');
exports.isValidElement = createUnimplementedFunction(
  entrypoint,
  'isValidElement'
);
exports.lazy = createUnimplementedFunction(entrypoint, 'lazy');
exports.memo = createUnimplementedFunction(entrypoint, 'memo');
exports.use = createUnimplementedFunction(entrypoint, 'use');
exports.useCallback = createUnimplementedFunction(entrypoint, 'useCallback');
exports.useDebugValue = createUnimplementedFunction(entrypoint, 'useDebugValue');
exports.useId = createUnimplementedFunction(entrypoint, 'useId');
exports.useMemo = createUnimplementedFunction(entrypoint, 'useMemo');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, `${entrypoint} react-server`);
