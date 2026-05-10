'use strict';

const { createUnimplementedError } = require('./placeholder-utils.js');

const invalidHookCallMessage =
  'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
  ' one of the following reasons:\n' +
  '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
  '2. You might be breaking the Rules of Hooks\n' +
  '3. You might have more than one copy of React in the same app\n' +
  'See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.';

const invalidHookCallErrorCode = 'FAST_REACT_INVALID_HOOK_CALL';

const ReactSharedInternals = {
  H: null
};

const privateEffectHookDispatchers = new WeakSet();
const privateStateHookDispatchers = new WeakSet();
const privateContextHookDispatchers = new WeakSet();

const effectRegistrationFieldNames = Object.freeze([
  'hook',
  'effect',
  'instance',
  'phase',
  'tag',
  'dependencies',
  'fiber_flags'
]);
const passiveEffectMetadataFieldNames = Object.freeze([
  'fiber',
  'hook_list',
  'effect_index',
  'effect',
  'instance',
  'tag',
  'create',
  'dependencies',
  'lanes'
]);
const pendingPassiveCommitHandoffFieldNames = Object.freeze([
  'root',
  'fiber',
  'phase',
  'lanes',
  'records'
]);
const pendingPassiveEffectCommitFieldNames = Object.freeze([
  'fiber',
  'effect_index',
  'effect',
  'instance',
  'unmount_order',
  'mount_order'
]);
const pendingPassivePhaseNames = Object.freeze(['Unmount', 'Mount']);
const noPassiveFieldNames = Object.freeze([]);
const noPassivePhaseNames = Object.freeze([]);

const effectHookMetadataByHookName = Object.freeze({
  useEffect: createEffectHookMetadata({
    effectPhaseName: 'Passive',
    hasPassiveHandoff: true,
    hookEffectFlagName: 'PASSIVE',
    hookName: 'useEffect',
    mountFiberFlagNames: ['PASSIVE', 'PASSIVE_STATIC'],
    updateFiberFlagNames: ['PASSIVE']
  }),
  useImperativeHandle: createEffectHookMetadata({
    effectPhaseName: 'Layout',
    hasPassiveHandoff: false,
    hookEffectFlagName: 'LAYOUT',
    hookName: 'useImperativeHandle',
    mountFiberFlagNames: ['UPDATE', 'LAYOUT_STATIC'],
    updateFiberFlagNames: ['UPDATE']
  }),
  useInsertionEffect: createEffectHookMetadata({
    effectPhaseName: 'Insertion',
    hasPassiveHandoff: false,
    hookEffectFlagName: 'INSERTION',
    hookName: 'useInsertionEffect',
    mountFiberFlagNames: ['UPDATE'],
    updateFiberFlagNames: ['UPDATE']
  }),
  useLayoutEffect: createEffectHookMetadata({
    effectPhaseName: 'Layout',
    hasPassiveHandoff: false,
    hookEffectFlagName: 'LAYOUT',
    hookName: 'useLayoutEffect',
    mountFiberFlagNames: ['UPDATE', 'LAYOUT_STATIC'],
    updateFiberFlagNames: ['UPDATE']
  })
});
const effectHookNames = Object.freeze(Object.keys(effectHookMetadataByHookName));

const ReactCurrentDispatcher = {};

Object.defineProperty(ReactCurrentDispatcher, 'current', {
  configurable: true,
  get() {
    return ReactSharedInternals.H;
  },
  set(dispatcher) {
    ReactSharedInternals.H = dispatcher;
  }
});

function createInvalidHookCallError(hookName) {
  const error = new Error(invalidHookCallMessage);
  error.code = invalidHookCallErrorCode;
  error.hookName = hookName;
  return error;
}

function createMissingPrivateStateHookDispatcherError(hookName) {
  return createUnimplementedError(
    'react',
    hookName,
    'was called',
    'Stateful hooks require a private/native hook dispatcher before they can execute.'
  );
}

function createEffectHookMetadata({
  effectPhaseName,
  hasPassiveHandoff,
  hookEffectFlagName,
  hookName,
  mountFiberFlagNames,
  updateFiberFlagNames
}) {
  return Object.freeze({
    compatibilityStatus: 'blocked',
    effectPhaseEnumName: 'FunctionComponentEffectPhase',
    effectPhaseName,
    effectRegistrationFieldNames,
    effectRegistrationRecordName: 'FunctionComponentEffectRegistration',
    executesEffectCallback: false,
    fiberFlagsRecordName: 'FiberFlags',
    hookEffectFlagName,
    hookEffectFlagsRecordName: 'HookEffectFlags',
    hookName,
    mountFiberFlagNames: Object.freeze(mountFiberFlagNames.slice()),
    passiveEffectMetadataFieldNames: hasPassiveHandoff
      ? passiveEffectMetadataFieldNames
      : noPassiveFieldNames,
    passiveEffectMetadataRecordName: hasPassiveHandoff
      ? 'FunctionComponentPassiveEffectMetadata'
      : null,
    pendingPassiveCommitHandoffFieldNames: hasPassiveHandoff
      ? pendingPassiveCommitHandoffFieldNames
      : noPassiveFieldNames,
    pendingPassiveCommitHandoffRecordName: hasPassiveHandoff
      ? 'FunctionComponentPendingPassiveCommitHandoff'
      : null,
    pendingPassiveEffectCommitFieldNames: hasPassiveHandoff
      ? pendingPassiveEffectCommitFieldNames
      : noPassiveFieldNames,
    pendingPassiveEffectCommitRecordName: hasPassiveHandoff
      ? 'FunctionComponentPendingPassiveEffectCommitRecord'
      : null,
    pendingPassivePhaseNames: hasPassiveHandoff
      ? pendingPassivePhaseNames
      : noPassivePhaseNames,
    schedulesPublicAct: false,
    updateFiberFlagNames: Object.freeze(updateFiberFlagNames.slice())
  });
}

function isObjectLike(value) {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

function getEffectHookMetadata(hookName) {
  if (
    Object.prototype.hasOwnProperty.call(effectHookMetadataByHookName, hookName)
  ) {
    return effectHookMetadataByHookName[hookName];
  }

  return null;
}

function isPrivateStateHookDispatcher(dispatcher) {
  return isObjectLike(dispatcher) && privateStateHookDispatchers.has(dispatcher);
}

function isPrivateContextHookDispatcher(dispatcher) {
  return isObjectLike(dispatcher) && privateContextHookDispatchers.has(dispatcher);
}

function isPrivateEffectHookDispatcher(dispatcher) {
  return isObjectLike(dispatcher) && privateEffectHookDispatchers.has(dispatcher);
}

function validatePrivateStateHookDispatcher(dispatcher) {
  if (!isObjectLike(dispatcher)) {
    throw createMissingPrivateStateHookDispatcherError('useState');
  }

  for (const hookName of ['useReducer', 'useState']) {
    if (typeof dispatcher[hookName] !== 'function') {
      throw createMissingPrivateStateHookDispatcherError(hookName);
    }
  }
}

function validatePrivateContextHookDispatcher(dispatcher) {
  if (!isObjectLike(dispatcher) || typeof dispatcher.useContext !== 'function') {
    throw createInvalidHookCallError('useContext');
  }
}

function validatePrivateEffectHookDispatcher(dispatcher) {
  if (!isObjectLike(dispatcher)) {
    throw createInvalidHookCallError('useEffect');
  }

  for (const hookName of effectHookNames) {
    if (typeof dispatcher[hookName] !== 'function') {
      throw createInvalidHookCallError(hookName);
    }
  }
}

function markPrivateStateHookDispatcher(dispatcher) {
  validatePrivateStateHookDispatcher(dispatcher);
  privateStateHookDispatchers.add(dispatcher);
  return dispatcher;
}

function markPrivateContextHookDispatcher(dispatcher) {
  validatePrivateContextHookDispatcher(dispatcher);
  privateContextHookDispatchers.add(dispatcher);
  return dispatcher;
}

function markPrivateEffectHookDispatcher(dispatcher) {
  validatePrivateEffectHookDispatcher(dispatcher);
  privateEffectHookDispatchers.add(dispatcher);
  return dispatcher;
}

function resolveDispatcher(hookName) {
  const dispatcher = ReactSharedInternals.H;

  if (dispatcher == null) {
    throw createInvalidHookCallError(hookName);
  }

  return dispatcher;
}

function getDispatcherHook(dispatcher, hookName) {
  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createInvalidHookCallError(hookName);
  }

  return hook;
}

function getPrivateEffectDispatcherHook(dispatcher, hookName) {
  if (
    getEffectHookMetadata(hookName) === null ||
    !isPrivateEffectHookDispatcher(dispatcher)
  ) {
    throw createInvalidHookCallError(hookName);
  }

  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createInvalidHookCallError(hookName);
  }

  return hook;
}

function getPrivateStateDispatcherHook(dispatcher, hookName) {
  if (!isPrivateStateHookDispatcher(dispatcher)) {
    throw createMissingPrivateStateHookDispatcherError(hookName);
  }

  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createMissingPrivateStateHookDispatcherError(hookName);
  }

  return hook;
}

function getPrivateContextDispatcherHook(dispatcher, hookName) {
  if (!isPrivateContextHookDispatcher(dispatcher)) {
    throw createInvalidHookCallError(hookName);
  }

  const hook = dispatcher[hookName];

  if (typeof hook !== 'function') {
    throw createInvalidHookCallError(hookName);
  }

  return hook;
}

function callDispatcherHook(hookName, args) {
  if (hookName === 'useReducer' || hookName === 'useState') {
    return callPrivateStateDispatcherHook(hookName, args);
  }

  if (hookName === 'useContext') {
    return callPrivateContextDispatcherHook(hookName, args);
  }

  if (getEffectHookMetadata(hookName) !== null) {
    return callPrivateEffectDispatcherHook(hookName, args);
  }

  const dispatcher = resolveDispatcher(hookName);
  const hook = getDispatcherHook(dispatcher, hookName);
  return hook.apply(dispatcher, args);
}

function callPrivateContextDispatcherHook(hookName, args) {
  const dispatcher = resolveDispatcher(hookName);
  const hook = getPrivateContextDispatcherHook(dispatcher, hookName);
  return hook.apply(dispatcher, args);
}

function callPrivateEffectDispatcherHook(hookName, args) {
  const dispatcher = resolveDispatcher(hookName);
  const hook = getPrivateEffectDispatcherHook(dispatcher, hookName);
  const metadata = getEffectHookMetadata(hookName);
  return hook.apply(dispatcher, createPrivateEffectHookArgs(args, metadata));
}

function callPrivateStateDispatcherHook(hookName, args) {
  const dispatcher = ReactSharedInternals.H;
  const hook = getPrivateStateDispatcherHook(dispatcher, hookName);
  return hook.apply(dispatcher, args);
}

function createPrivateEffectHookArgs(args, metadata) {
  const privateArgs = Array.prototype.slice.call(args);
  privateArgs.push(metadata);
  return privateArgs;
}

function defineHookFunctionShape(fn, length) {
  Object.defineProperties(fn, {
    length: {
      configurable: true,
      value: length
    },
    name: {
      configurable: true,
      value: ''
    }
  });

  return fn;
}

const use = defineHookFunctionShape(function (usable) {
  return callDispatcherHook('use', arguments);
}, 1);

const useCallback = defineHookFunctionShape(function (callback, deps) {
  return callDispatcherHook('useCallback', arguments);
}, 2);

const useContext = defineHookFunctionShape(function (Context) {
  return callPrivateContextDispatcherHook('useContext', arguments);
}, 1);

const useEffect = defineHookFunctionShape(function (create, deps) {
  return callPrivateEffectDispatcherHook('useEffect', arguments);
}, 2);

const useImperativeHandle = defineHookFunctionShape(function (ref, create, deps) {
  return callPrivateEffectDispatcherHook('useImperativeHandle', arguments);
}, 3);

const useInsertionEffect = defineHookFunctionShape(function (create, deps) {
  return callPrivateEffectDispatcherHook('useInsertionEffect', arguments);
}, 2);

const useLayoutEffect = defineHookFunctionShape(function (create, deps) {
  return callPrivateEffectDispatcherHook('useLayoutEffect', arguments);
}, 2);

const useMemo = defineHookFunctionShape(function (create, deps) {
  return callDispatcherHook('useMemo', arguments);
}, 2);

const useReducer = defineHookFunctionShape(function (reducer, initialArg, init) {
  return callPrivateStateDispatcherHook('useReducer', arguments);
}, 3);

const useRef = defineHookFunctionShape(function (initialValue) {
  return callDispatcherHook('useRef', arguments);
}, 1);

const useState = defineHookFunctionShape(function (initialState) {
  return callPrivateStateDispatcherHook('useState', arguments);
}, 1);

module.exports = {
  ReactCurrentDispatcher,
  ReactSharedInternals,
  callDispatcherHook,
  callPrivateContextDispatcherHook,
  callPrivateEffectDispatcherHook,
  callPrivateStateDispatcherHook,
  createInvalidHookCallError,
  createMissingPrivateStateHookDispatcherError,
  effectHookMetadataByHookName,
  effectHookNames,
  getEffectHookMetadata,
  invalidHookCallErrorCode,
  invalidHookCallMessage,
  isPrivateContextHookDispatcher,
  isPrivateEffectHookDispatcher,
  isPrivateStateHookDispatcher,
  markPrivateContextHookDispatcher,
  markPrivateEffectHookDispatcher,
  markPrivateStateHookDispatcher,
  resolveDispatcher,
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
};
