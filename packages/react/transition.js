'use strict';

let transitionDepth = 0;

const startTransitionRootlessCurrentnessFieldNames = Object.freeze([
  'apiName',
  'compatibilityTarget',
  'currentPublicExport',
  'rootlessFacade',
  'transitionScopeExecution',
  'errorChannel',
  'restoresPreviousDepth',
  'restoresPreviousDepthAfterThrow',
  'schedulerIntegration',
  'rootLaneIntegration',
  'rootScheduling',
  'rootExecution',
  'dispatcherRouting',
  'schedulerCallbackExecution',
  'compatibilityClaimed',
  'blocker'
]);
const startTransitionRootlessCurrentness = Object.freeze({
  apiName: 'startTransition',
  compatibilityTarget: 'react@19.2.6',
  currentPublicExport: 'react.startTransition facade',
  rootlessFacade: true,
  transitionScopeExecution: 'synchronous',
  errorChannel: 'global-report-error',
  restoresPreviousDepth: true,
  restoresPreviousDepthAfterThrow: true,
  schedulerIntegration: false,
  rootLaneIntegration: false,
  rootScheduling: false,
  rootExecution: false,
  dispatcherRouting: false,
  schedulerCallbackExecution: false,
  compatibilityClaimed: false,
  blocker:
    'startTransition remains a rootless facade until scheduler and root-lane integration are admitted'
});

function reportGlobalError(error) {
  if (typeof reportError === 'function') {
    reportError(error);
    return;
  }

  if (
    typeof window === 'object' &&
    typeof window.ErrorEvent === 'function'
  ) {
    const message =
      typeof error === 'object' &&
      error !== null &&
      typeof error.message === 'string'
        ? String(error.message)
        : String(error);
    const event = new window.ErrorEvent('error', {
      bubbles: true,
      cancelable: true,
      error,
      message
    });
    const shouldLog = window.dispatchEvent(event);
    if (!shouldLog) {
      return;
    }
  } else if (
    typeof process === 'object' &&
    typeof process.emit === 'function'
  ) {
    process.emit('uncaughtException', error);
    return;
  }

  console.error(error);
}

function isTransitionBatchActive() {
  return transitionDepth > 0;
}

const startTransition = function (scope) {
  const previousTransitionDepth = transitionDepth;
  transitionDepth = previousTransitionDepth + 1;

  try {
    scope();
  } catch (error) {
    reportGlobalError(error);
  } finally {
    transitionDepth = previousTransitionDepth;
  }
};

Object.defineProperty(startTransition, 'name', {
  configurable: true,
  value: ''
});

module.exports = {
  isTransitionBatchActive,
  startTransition,
  startTransitionRootlessCurrentness,
  startTransitionRootlessCurrentnessFieldNames
};
