'use strict';

const {
  compatibilityTarget,
  createPrivateInternalsPlaceholder,
  createUnimplementedError,
  createUnimplementedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');
const {
  use,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useInsertionEffect,
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

const privateActDispatcherGateExport =
  '__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__';
const privateActQueueMetadataSymbol = Symbol(
  'fast-react.react.private.actQueueMetadata'
);
const privateActDispatchers = new WeakSet();
const actDispatcherGateStatus =
  'blocked-until-renderer-roots-passive-effects-and-act-continuations';
const acceptedActQueueMetadataKind =
  'fast-react.react.act-queue-metadata';
const acceptedActQueueMetadataVersion = 1;
const acceptedActQueueRecordKinds = Object.freeze([
  'SchedulerActQueueRequest',
  'SchedulerActScopeBoundaryRecord',
  'SyncFlushActContinuationRecord'
]);
const acceptedActQueueTaskKinds = Object.freeze([
  'RootSchedule',
  'SchedulerCallback'
]);
const acceptedActQueueContinuationStatuses = Object.freeze([
  'NoContinuation',
  'PendingContinuation'
]);

function isObjectLike(value) {
  return (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  );
}

function hasExactStringSet(value, expectedValues) {
  if (!Array.isArray(value) || value.length !== expectedValues.length) {
    return false;
  }

  const valueSet = new Set(value);
  if (valueSet.size !== expectedValues.length) {
    return false;
  }

  return expectedValues.every((expectedValue) => valueSet.has(expectedValue));
}

function isAcceptedActQueueMetadata(metadata) {
  return (
    isObjectLike(metadata) &&
    metadata.kind === acceptedActQueueMetadataKind &&
    metadata.version === acceptedActQueueMetadataVersion &&
    metadata.compatibilityTarget === compatibilityTarget &&
    metadata.publicCompatibilityClaimed === false &&
    metadata.queueFlushingReady === false &&
    metadata.rendererRootsReady === false &&
    metadata.passiveEffectsReady === false &&
    metadata.continuationFlushingReady === false &&
    metadata.executesQueuedWork === false &&
    metadata.executesEffects === false &&
    hasExactStringSet(metadata.acceptedRecords, acceptedActQueueRecordKinds) &&
    hasExactStringSet(metadata.acceptedTaskKinds, acceptedActQueueTaskKinds) &&
    hasExactStringSet(
      metadata.acceptedContinuationStatuses,
      acceptedActQueueContinuationStatuses
    )
  );
}

function createActQueueMetadata(overrides = {}) {
  return Object.freeze({
    kind: acceptedActQueueMetadataKind,
    version: acceptedActQueueMetadataVersion,
    compatibilityTarget,
    acceptedRecords: acceptedActQueueRecordKinds,
    acceptedTaskKinds: acceptedActQueueTaskKinds,
    acceptedContinuationStatuses: acceptedActQueueContinuationStatuses,
    publicCompatibilityClaimed: false,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    executesQueuedWork: false,
    executesEffects: false,
    ...overrides
  });
}

function getDispatcherActQueueMetadata(dispatcher) {
  if (!isObjectLike(dispatcher)) {
    return null;
  }

  return dispatcher[privateActQueueMetadataSymbol] ?? null;
}

function createPrivateActDispatcherGateError() {
  return createUnimplementedError(
    entrypoint,
    `${privateActDispatcherGateExport}.markPrivateActDispatcher`,
    'rejected dispatcher metadata',
    'Only accepted data-only act queue metadata can pass this package-private gate.'
  );
}

function markPrivateActDispatcher(dispatcher) {
  if (!isAcceptedActQueueMetadata(getDispatcherActQueueMetadata(dispatcher))) {
    throw createPrivateActDispatcherGateError();
  }

  privateActDispatchers.add(dispatcher);
  return dispatcher;
}

function isPrivateActDispatcher(dispatcher) {
  return isObjectLike(dispatcher) && privateActDispatchers.has(dispatcher);
}

function getPrivateActQueueMetadata(dispatcher) {
  if (!isPrivateActDispatcher(dispatcher)) {
    return null;
  }

  const metadata = getDispatcherActQueueMetadata(dispatcher);
  return isAcceptedActQueueMetadata(metadata) ? metadata : null;
}

const privateActDispatcherGate = Object.freeze({
  status: actDispatcherGateStatus,
  metadataKind: acceptedActQueueMetadataKind,
  metadataVersion: acceptedActQueueMetadataVersion,
  metadataSymbol: privateActQueueMetadataSymbol,
  requiredRecords: acceptedActQueueRecordKinds,
  requiredTaskKinds: acceptedActQueueTaskKinds,
  requiredContinuationStatuses: acceptedActQueueContinuationStatuses,
  publicCompatibilityClaimed: false,
  queueFlushingReady: false,
  rendererRootsReady: false,
  passiveEffectsReady: false,
  continuationFlushingReady: false,
  executesQueuedWork: false,
  executesEffects: false,
  createActQueueMetadata,
  getPrivateActQueueMetadata,
  isAcceptedActQueueMetadata,
  isPrivateActDispatcher,
  markPrivateActDispatcher
});

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
exports.useImperativeHandle = useImperativeHandle;
exports.useInsertionEffect = useInsertionEffect;
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
Object.defineProperty(module.exports, privateActDispatcherGateExport, {
  enumerable: false,
  value: privateActDispatcherGate
});
