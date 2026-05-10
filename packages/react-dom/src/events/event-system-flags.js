'use strict';

const IS_EVENT_HANDLE_NON_MANAGED_NODE = 1;
const IS_NON_DELEGATED = 1 << 1;
const IS_CAPTURE_PHASE = 1 << 2;
const IS_PASSIVE = 1 << 3;
const IS_LEGACY_FB_SUPPORT_MODE = 1 << 4;

const SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE =
  IS_LEGACY_FB_SUPPORT_MODE | IS_CAPTURE_PHASE;
const SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS =
  IS_EVENT_HANDLE_NON_MANAGED_NODE | IS_NON_DELEGATED | IS_CAPTURE_PHASE;

function hasEventSystemFlag(eventSystemFlags, flag) {
  return (eventSystemFlags & flag) !== 0;
}

function isCapturePhase(eventSystemFlags) {
  return hasEventSystemFlag(eventSystemFlags, IS_CAPTURE_PHASE);
}

function isNonDelegatedEventSystem(eventSystemFlags) {
  return hasEventSystemFlag(eventSystemFlags, IS_NON_DELEGATED);
}

function isEventHandleNonManagedNode(eventSystemFlags) {
  return hasEventSystemFlag(
    eventSystemFlags,
    IS_EVENT_HANDLE_NON_MANAGED_NODE
  );
}

function shouldProcessPolyfillEventPlugins(eventSystemFlags) {
  return (
    (eventSystemFlags & SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS) === 0
  );
}

module.exports = {
  IS_CAPTURE_PHASE,
  IS_EVENT_HANDLE_NON_MANAGED_NODE,
  IS_LEGACY_FB_SUPPORT_MODE,
  IS_NON_DELEGATED,
  IS_PASSIVE,
  SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE,
  SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS,
  hasEventSystemFlag,
  isCapturePhase,
  isEventHandleNonManagedNode,
  isNonDelegatedEventSystem,
  shouldProcessPolyfillEventPlugins
};
