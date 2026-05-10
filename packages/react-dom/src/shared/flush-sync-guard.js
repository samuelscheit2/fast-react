'use strict';

const flushSyncGuardErrorCode = 'FAST_REACT_DOM_FLUSH_SYNC_GUARD';
const flushSyncReentrantWarning =
  'flushSync was called from inside a lifecycle method. React cannot ' +
  'flush when React is already rendering. Consider moving this call to ' +
  'a scheduler task or micro task.';

function isDevelopmentMode(options) {
  if (options && typeof options.development === 'boolean') {
    return options.development;
  }
  return process.env.NODE_ENV !== 'production';
}

function createFlushSyncGuardError(message) {
  const error = new Error(message);
  error.name = 'FastReactDomFlushSyncGuardError';
  error.code = flushSyncGuardErrorCode;
  return error;
}

function getDispatcherFlushSyncWork(dispatcher) {
  if (
    dispatcher == null ||
    typeof dispatcher !== 'object' ||
    typeof dispatcher.f !== 'function'
  ) {
    throw createFlushSyncGuardError(
      'React DOM flushSync guard requires a private dispatcher with flushSyncWork.'
    );
  }

  return dispatcher.f;
}

function reportFlushSyncReentrantWarning(options) {
  const logger = (options && options.console) || console;
  if (logger && typeof logger.error === 'function') {
    logger.error(flushSyncReentrantWarning);
    return true;
  }
  return false;
}

function finishFlushSyncGuard(dispatcher, options) {
  const flushSyncWork = getDispatcherFlushSyncWork(dispatcher);
  const wasInRender = flushSyncWork() === true;

  if (wasInRender && isDevelopmentMode(options)) {
    reportFlushSyncReentrantWarning(options);
  }

  return wasInRender;
}

module.exports = {
  createFlushSyncGuardError,
  finishFlushSyncGuard,
  flushSyncGuardErrorCode,
  flushSyncReentrantWarning,
  getDispatcherFlushSyncWork,
  isDevelopmentMode,
  reportFlushSyncReentrantWarning
};
