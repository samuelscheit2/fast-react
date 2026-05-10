'use strict';

const {
  compatibilityTarget,
  createUnimplementedError
} = require('./placeholder-utils.js');

const entrypoint = 'react';
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
const schedulerCompatibilityTarget = 'scheduler@0.27.0';
const privateActQueueTestQueueKind =
  'fast-react.react.private-act-queue-test-queue';
const privateActQueueTestTaskKind =
  'fast-react.react.private-act-queue-test-task';
const privateActQueueTestCallbackKind =
  'fast-react.react.private-act-queue-test-callback';
const privateActQueueTestQueueVersion = 1;
const privateActQueueTestQueueBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-queue'
);
const privateActQueueTestTaskBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-task'
);
const privateActQueueTestCallbackBrand = Symbol.for(
  'fast-react.react.private-act-queue-test-callback'
);

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

function includesString(value, expectedValues) {
  return typeof value === 'string' && expectedValues.includes(value);
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
    metadata.privateTestQueueFlushDiagnosticsReady === true &&
    metadata.drainsAcceptedInternalTestQueues === true &&
    metadata.executesBrandedInternalTestCallbacks === true &&
    metadata.recordsBrandedInternalTestContinuations === true &&
    metadata.publicSchedulerTimingCompatibilityClaimed === false &&
    metadata.publicReactActCompatibilityClaimed === false &&
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
    privateTestQueueFlushDiagnosticsReady: true,
    drainsAcceptedInternalTestQueues: true,
    executesBrandedInternalTestCallbacks: true,
    recordsBrandedInternalTestContinuations: true,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    ...overrides
  });
}

function isAcceptedInternalActQueueTestCallback(callback) {
  return (
    typeof callback === 'function' &&
    callback[privateActQueueTestCallbackBrand] === true &&
    callback.kind === privateActQueueTestCallbackKind &&
    callback.version === privateActQueueTestQueueVersion &&
    callback.compatibilityTarget === compatibilityTarget &&
    callback.schedulerCompatibilityTarget === schedulerCompatibilityTarget &&
    typeof callback.label === 'string' &&
    callback.publicCompatibilityClaimed === false &&
    callback.publicSchedulerTimingCompatibilityClaimed === false &&
    callback.publicReactActCompatibilityClaimed === false &&
    callback.executesQueuedWork === false &&
    callback.executesEffects === false
  );
}

function createInternalActQueueTestCallback(callback, options = {}) {
  if (isAcceptedInternalActQueueTestCallback(callback)) {
    return callback;
  }
  if (typeof callback !== 'function') {
    throw new TypeError(
      'createInternalActQueueTestCallback requires a function callback.'
    );
  }

  const normalizedOptions =
    typeof options === 'string'
      ? {
          label: options
        }
      : options ?? {};
  const testCallback = function () {
    return callback.apply(this, arguments);
  };

  Object.defineProperties(testCallback, {
    [privateActQueueTestCallbackBrand]: {
      value: true
    },
    kind: {
      value: privateActQueueTestCallbackKind
    },
    version: {
      value: privateActQueueTestQueueVersion
    },
    compatibilityTarget: {
      value: compatibilityTarget
    },
    schedulerCompatibilityTarget: {
      value: schedulerCompatibilityTarget
    },
    label: {
      value: String(
        normalizedOptions.label ??
          callback.displayName ??
          callback.name ??
          'act-queue-test-callback'
      )
    },
    publicCompatibilityClaimed: {
      value: false
    },
    publicSchedulerTimingCompatibilityClaimed: {
      value: false
    },
    publicReactActCompatibilityClaimed: {
      value: false
    },
    executesQueuedWork: {
      value: false
    },
    executesEffects: {
      value: false
    }
  });

  return Object.freeze(testCallback);
}

function normalizeInternalActQueueTestCallback(callback, label) {
  if (callback === undefined || callback === null) {
    return null;
  }
  if (isAcceptedInternalActQueueTestCallback(callback)) {
    return callback;
  }
  return createInternalActQueueTestCallback(callback, {
    label
  });
}

function isAcceptedInternalActQueueTestTask(task) {
  return (
    isObjectLike(task) &&
    task[privateActQueueTestTaskBrand] === true &&
    task.kind === privateActQueueTestTaskKind &&
    task.version === privateActQueueTestQueueVersion &&
    task.compatibilityTarget === compatibilityTarget &&
    task.schedulerCompatibilityTarget === schedulerCompatibilityTarget &&
    includesString(task.recordKind, acceptedActQueueRecordKinds) &&
    includesString(task.taskKind, acceptedActQueueTaskKinds) &&
    includesString(
      task.continuationStatus,
      acceptedActQueueContinuationStatuses
    ) &&
    typeof task.label === 'string' &&
    (task.callback === undefined ||
      task.callback === null ||
      isAcceptedInternalActQueueTestCallback(task.callback)) &&
    task.publicCompatibilityClaimed === false &&
    task.publicSchedulerTimingCompatibilityClaimed === false &&
    task.publicReactActCompatibilityClaimed === false &&
    task.executesQueuedWork === false &&
    task.executesEffects === false
  );
}

function createInternalActQueueTestTask(options = {}) {
  const normalizedOptions =
    typeof options === 'string'
      ? {
          label: options
        }
      : typeof options === 'function'
        ? {
            label: options.displayName ?? options.name,
            callback: options
          }
      : options ?? {};
  const task = {
    kind: privateActQueueTestTaskKind,
    version: privateActQueueTestQueueVersion,
    compatibilityTarget,
    schedulerCompatibilityTarget,
    recordKind:
      normalizedOptions.recordKind ?? 'SchedulerActQueueRequest',
    taskKind: normalizedOptions.taskKind ?? 'SchedulerCallback',
    continuationStatus:
      normalizedOptions.continuationStatus ?? 'NoContinuation',
    label: String(normalizedOptions.label ?? 'act-queue-test-task'),
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false
  };

  const callback = normalizeInternalActQueueTestCallback(
    normalizedOptions.callback,
    `${task.label}:callback`
  );
  if (callback !== null) {
    task.callback = callback;
  }

  Object.defineProperty(task, privateActQueueTestTaskBrand, {
    value: true
  });

  return Object.freeze(task);
}

function normalizeInternalActQueueTestTask(task) {
  if (isAcceptedInternalActQueueTestTask(task)) {
    return task;
  }

  return createInternalActQueueTestTask(task);
}

function isAcceptedInternalActQueueTestQueue(queue) {
  return (
    isObjectLike(queue) &&
    queue[privateActQueueTestQueueBrand] === true &&
    queue.kind === privateActQueueTestQueueKind &&
    queue.version === privateActQueueTestQueueVersion &&
    queue.compatibilityTarget === compatibilityTarget &&
    queue.schedulerCompatibilityTarget === schedulerCompatibilityTarget &&
    queue.publicCompatibilityClaimed === false &&
    queue.queueFlushingReady === false &&
    queue.privateTestQueueFlushDiagnosticsReady === true &&
    queue.drainsAcceptedInternalTestQueues === true &&
    queue.executesBrandedInternalTestCallbacks === true &&
    queue.recordsBrandedInternalTestContinuations === true &&
    queue.publicSchedulerTimingCompatibilityClaimed === false &&
    queue.publicReactActCompatibilityClaimed === false &&
    queue.executesQueuedWork === false &&
    queue.executesEffects === false &&
    Array.isArray(queue.records) &&
    queue.records.every(isAcceptedInternalActQueueTestTask)
  );
}

function createInternalActQueueTestQueue(records = []) {
  const normalizedRecords = Array.isArray(records) ? records : [];
  const queue = {
    kind: privateActQueueTestQueueKind,
    version: privateActQueueTestQueueVersion,
    compatibilityTarget,
    schedulerCompatibilityTarget,
    publicCompatibilityClaimed: false,
    queueFlushingReady: false,
    privateTestQueueFlushDiagnosticsReady: true,
    drainsAcceptedInternalTestQueues: true,
    executesBrandedInternalTestCallbacks: true,
    recordsBrandedInternalTestContinuations: true,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    executesQueuedWork: false,
    executesEffects: false,
    records: normalizedRecords.map(normalizeInternalActQueueTestTask)
  };

  Object.defineProperty(queue, privateActQueueTestQueueBrand, {
    value: true
  });

  return queue;
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

module.exports = Object.freeze({
  status: actDispatcherGateStatus,
  metadataKind: acceptedActQueueMetadataKind,
  metadataVersion: acceptedActQueueMetadataVersion,
  metadataSymbol: privateActQueueMetadataSymbol,
  requiredRecords: acceptedActQueueRecordKinds,
  requiredTaskKinds: acceptedActQueueTaskKinds,
  requiredContinuationStatuses: acceptedActQueueContinuationStatuses,
  internalTestQueueKind: privateActQueueTestQueueKind,
  internalTestTaskKind: privateActQueueTestTaskKind,
  internalTestCallbackKind: privateActQueueTestCallbackKind,
  internalTestQueueVersion: privateActQueueTestQueueVersion,
  publicCompatibilityClaimed: false,
  queueFlushingReady: false,
  rendererRootsReady: false,
  passiveEffectsReady: false,
  continuationFlushingReady: false,
  privateTestQueueFlushDiagnosticsReady: true,
  drainsAcceptedInternalTestQueues: true,
  executesBrandedInternalTestCallbacks: true,
  recordsBrandedInternalTestContinuations: true,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  executesQueuedWork: false,
  executesEffects: false,
  createActQueueMetadata,
  createInternalActQueueTestCallback,
  createInternalActQueueTestQueue,
  createInternalActQueueTestTask,
  getPrivateActQueueMetadata,
  isAcceptedActQueueMetadata,
  isAcceptedInternalActQueueTestCallback,
  isAcceptedInternalActQueueTestQueue,
  isAcceptedInternalActQueueTestTask,
  isPrivateActDispatcher,
  markPrivateActDispatcher
});
