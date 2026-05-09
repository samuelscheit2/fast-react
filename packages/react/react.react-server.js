'use strict';

const {
  createPrivateInternalsPlaceholder,
  createUnimplementedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');
const {
  cloneElementReactServer,
  createElement,
  isValidElement
} = require('./element-factory.js');
const { createRef } = require('./ref-object.js');
const { createChildrenHelpers } = require('./children-helper.js');
const { lazy, memo } = require('./wrapper-object.js');

const entrypoint = 'react';

const Children = createChildrenHelpers({ reactServer: true });

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
exports.cloneElement = cloneElementReactServer;
exports.createElement = createElement;
exports.createRef = createRef;
exports.forwardRef = createUnimplementedFunction(entrypoint, 'forwardRef');
exports.isValidElement = isValidElement;
exports.lazy = lazy;
exports.memo = memo;
exports.use = createUnimplementedFunction(entrypoint, 'use');
exports.useCallback = createUnimplementedFunction(entrypoint, 'useCallback');
exports.useDebugValue = createUnimplementedFunction(entrypoint, 'useDebugValue');
exports.useId = createUnimplementedFunction(entrypoint, 'useId');
exports.useMemo = createUnimplementedFunction(entrypoint, 'useMemo');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, `${entrypoint} react-server`);
