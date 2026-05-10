'use strict';

const {
  createPrivateInternalsPlaceholder,
  createUnimplementedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');
const {
  use,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} = require('./hook-dispatcher.js');
const {
  cloneElement,
  createElement,
  isValidElement
} = require('./element-factory.js');
const { createRef } = require('./ref-object.js');
const { createContext } = require('./context-object.js');
const { createChildrenHelpers } = require('./children-helper.js');
const { forwardRef, lazy, memo } = require('./wrapper-object.js');
const { Component, PureComponent } = require('./component-class.js');
const { startTransition } = require('./transition.js');

const entrypoint = 'react';

const Children = createChildrenHelpers();

const Fragment = Symbol.for('react.fragment');
const StrictMode = Symbol.for('react.strict_mode');
const Suspense = Symbol.for('react.suspense');
const Profiler = Symbol.for('react.profiler');
const Activity = Symbol.for('react.activity');

exports.Activity = Activity;
exports.Children = Children;
exports.Component = Component;
exports.Fragment = Fragment;
exports.Profiler = Profiler;
exports.PureComponent = PureComponent;
exports.StrictMode = StrictMode;
exports.Suspense = Suspense;
exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  createPrivateInternalsPlaceholder(
    entrypoint,
    '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'
  );
exports.__COMPILER_RUNTIME = createPrivateInternalsPlaceholder(
  entrypoint,
  '__COMPILER_RUNTIME'
);
exports.act = createUnimplementedFunction(entrypoint, 'act');
exports.cache = createUnimplementedFunction(entrypoint, 'cache');
exports.cacheSignal = createUnimplementedFunction(entrypoint, 'cacheSignal');
exports.captureOwnerStack = createUnimplementedFunction(
  entrypoint,
  'captureOwnerStack'
);
exports.cloneElement = cloneElement;
exports.createContext = createContext;
exports.createElement = createElement;
exports.createRef = createRef;
exports.forwardRef = forwardRef;
exports.isValidElement = isValidElement;
exports.lazy = lazy;
exports.memo = memo;
exports.startTransition = startTransition;
exports.unstable_useCacheRefresh = createUnimplementedFunction(
  entrypoint,
  'unstable_useCacheRefresh'
);
exports.use = use;
exports.useActionState = createUnimplementedFunction(
  entrypoint,
  'useActionState'
);
exports.useCallback = useCallback;
exports.useContext = useContext;
exports.useDebugValue = createUnimplementedFunction(entrypoint, 'useDebugValue');
exports.useDeferredValue = createUnimplementedFunction(
  entrypoint,
  'useDeferredValue'
);
exports.useEffect = useEffect;
exports.useEffectEvent = createUnimplementedFunction(
  entrypoint,
  'useEffectEvent'
);
exports.useId = createUnimplementedFunction(entrypoint, 'useId');
exports.useImperativeHandle = createUnimplementedFunction(
  entrypoint,
  'useImperativeHandle'
);
exports.useInsertionEffect = createUnimplementedFunction(
  entrypoint,
  'useInsertionEffect'
);
exports.useLayoutEffect = useLayoutEffect;
exports.useMemo = useMemo;
exports.useOptimistic = createUnimplementedFunction(
  entrypoint,
  'useOptimistic'
);
exports.useReducer = useReducer;
exports.useRef = useRef;
exports.useState = useState;
exports.useSyncExternalStore = createUnimplementedFunction(
  entrypoint,
  'useSyncExternalStore'
);
exports.useTransition = createUnimplementedFunction(entrypoint, 'useTransition');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);
