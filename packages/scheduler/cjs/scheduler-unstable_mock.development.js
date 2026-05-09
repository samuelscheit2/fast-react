'use strict';

const compatibilityTarget = 'scheduler@0.27.0';
const entrypoint = 'scheduler/unstable_mock';
const unimplementedCode = 'FAST_REACT_UNIMPLEMENTED';

function createUnsupportedError(exportName) {
  const error = new Error(
    `[fast-react] ${entrypoint}.${exportName} was called, but this ` +
      `placeholder has no scheduler mock behavior implementation yet. It ` +
      `exists to track the accepted ${compatibilityTarget} package surface; ` +
      `do not treat it as scheduler-compatible behavior.`
  );

  error.name = 'FastReactSchedulerUnimplementedError';
  error.code = unimplementedCode;
  error.entrypoint = entrypoint;
  error.exportName = exportName;
  error.compatibilityTarget = compatibilityTarget;

  return error;
}

function createUnsupportedFunction(exportName) {
  const fn = function fastReactSchedulerMockUnimplementedPlaceholder() {
    throw createUnsupportedError(exportName);
  };

  Object.defineProperty(fn, 'name', {
    configurable: true,
    value: exportName
  });

  return fn;
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
}

exports.unstable_scheduleCallback = createUnsupportedFunction(
  'unstable_scheduleCallback'
);
exports.unstable_cancelCallback = createUnsupportedFunction(
  'unstable_cancelCallback'
);
exports.unstable_shouldYield = createUnsupportedFunction(
  'unstable_shouldYield'
);
exports.unstable_now = createUnsupportedFunction('unstable_now');
exports.unstable_runWithPriority = createUnsupportedFunction(
  'unstable_runWithPriority'
);
exports.unstable_next = createUnsupportedFunction('unstable_next');
exports.unstable_wrapCallback = createUnsupportedFunction(
  'unstable_wrapCallback'
);
exports.unstable_requestPaint = createUnsupportedFunction(
  'unstable_requestPaint'
);
exports.unstable_forceFrameRate = createUnsupportedFunction(
  'unstable_forceFrameRate'
);
exports.unstable_getCurrentPriorityLevel = createUnsupportedFunction(
  'unstable_getCurrentPriorityLevel'
);
exports.unstable_Profiling = null;
exports.unstable_ImmediatePriority = 1;
exports.unstable_UserBlockingPriority = 2;
exports.unstable_NormalPriority = 3;
exports.unstable_LowPriority = 4;
exports.unstable_IdlePriority = 5;
exports.log = createUnsupportedFunction('log');
exports.reset = createUnsupportedFunction('reset');
exports.unstable_advanceTime = createUnsupportedFunction(
  'unstable_advanceTime'
);
exports.unstable_clearLog = createUnsupportedFunction('unstable_clearLog');
exports.unstable_flushAll = createUnsupportedFunction('unstable_flushAll');
exports.unstable_flushAllWithoutAsserting = createUnsupportedFunction(
  'unstable_flushAllWithoutAsserting'
);
exports.unstable_flushExpired = createUnsupportedFunction(
  'unstable_flushExpired'
);
exports.unstable_flushNumberOfYields = createUnsupportedFunction(
  'unstable_flushNumberOfYields'
);
exports.unstable_flushUntilNextPaint = createUnsupportedFunction(
  'unstable_flushUntilNextPaint'
);
exports.unstable_hasPendingWork = createUnsupportedFunction(
  'unstable_hasPendingWork'
);
exports.unstable_setDisableYieldValue = createUnsupportedFunction(
  'unstable_setDisableYieldValue'
);

definePlaceholderMetadata(module.exports);
