'use strict';

const {
  EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE,
  EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
  EVENT_TARGET_DISPATCH_PATH_RECORD_KIND,
  createEventListenerTargetLookupRecord,
  createEventTargetDispatchPathRecord,
  createEventTargetNormalizationRecord,
  getEventListenerTargetLookupRecordPayload,
  getLatestPropsFromNode,
  getPrivateRootHostOutputEventTargetRecordPayload,
  getRootOwnerFromNode,
  isPrivateRootHostOutputEventTargetRecord
} = require('../client/component-tree.js');
const {describeContainer} = require('../client/dom-container.js');
const {
  getEventTarget,
  getNativeEventType
} = require('./get-event-target.js');
const {
  IS_CAPTURE_PHASE,
  isCapturePhase,
  isEventHandleNonManagedNode,
  isNonDelegatedEventSystem,
  shouldProcessPolyfillEventPlugins
} = require('./event-system-flags.js');
const {
  PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_RECORD_KIND,
  getPrivateEventListenerQueueEntries,
  getPrivateEventListenerQueueEntryPayload
} = require('./listener-registry.js');

const EVENT_WRAPPER_RECORD_KIND = 'FastReactDomEventPriorityWrapperRecord';
const EVENT_DISPATCH_RECORD_KIND = 'FastReactDomEventDispatchRecord';
const PLUGIN_EXTRACTION_RECORD_KIND =
  'FastReactDomPluginExtractionRecord';
const DISPATCH_QUEUE_RECORD_KIND = 'FastReactDomDispatchQueueRecord';
const DISPATCH_QUEUE_ENTRY_RECORD_KIND =
  'FastReactDomDispatchQueueEntryRecord';
const DISPATCH_LISTENER_RECORD_KIND =
  'FastReactDomDispatchListenerRecord';
const DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND =
  'FastReactDomDispatchListenerInvocationCanaryRecord';
const DISPATCH_LISTENER_CANARY_EVENT_KIND =
  'FastReactDomDispatchListenerCanaryEvent';
const DISPATCH_QUEUE_INVOCATION_CANARY_RECORD_KIND =
  'FastReactDomDispatchQueueInvocationCanaryRecord';
const EVENT_TYPE_DISPATCH_CANARY_RECORD_KIND =
  'FastReactDomEventTypeDispatchCanaryRecord';
const PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND =
  'FastReactDomPrivateClickEventDelegationDispatchGateRecord';
const PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_RECORD_KIND =
  'FastReactDomPrivateClickEventDelegationAcceptedListenerOrderRecord';
const PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND =
  'FastReactDomPrivateFocusBlurEventDispatchExecutionRecord';
const INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND =
  'FastReactDomInputChangeEventExtractionPreflightRecord';
const SYNTHETIC_EVENT_SHAPE_RECORD_KIND =
  'FastReactDomSyntheticEventShapeRecord';
const SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND =
  'FastReactDomSyntheticEventShapeGateRecord';
const DISPATCH_PROPAGATION_STOP_DIAGNOSTIC_RECORD_KIND =
  'FastReactDomDispatchPropagationStopDiagnosticRecord';
const DISPATCH_DEFAULT_PREVENTED_DIAGNOSTIC_RECORD_KIND =
  'FastReactDomDispatchDefaultPreventedDiagnosticRecord';
const DISPATCH_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_RECORD_KIND =
  'FastReactDomDispatchNativeStopImmediatePropagationDiagnosticRecord';
const DISPATCH_LISTENER_ERROR_ROUTE_RECORD_KIND =
  'FastReactDomDispatchListenerErrorRouteRecord';
const PORTAL_EVENT_OWNER_ROOT_GATE_RECORD_KIND =
  'FastReactDomPortalEventOwnerRootGateRecord';
const FOCUS_BLUR_EVENT_BLOCKER_GATE_RECORD_KIND =
  'FastReactDomFocusBlurEventBlockerGateRecord';
const FOCUS_BLUR_EVENT_BLOCKER_PHASE_RECORD_KIND =
  'FastReactDomFocusBlurEventBlockerPhaseRecord';
const FOCUS_BLUR_EVENT_BLOCKER_LISTENER_RECORD_KIND =
  'FastReactDomFocusBlurEventBlockerListenerRecord';
const HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND =
  'FastReactDomHydrationReplayEventQueueDiagnostic';
const HYDRATION_REPLAY_EVENT_QUEUE_ENTRY_RECORD_KIND =
  'FastReactDomHydrationReplayEventQueueEntryRecord';
const HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND =
  'FastReactDomHydrationReplayQueueDrainOrderDiagnostic';
const HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND =
  'FastReactDomHydrationDehydratedTargetResolutionDiagnostic';
const HYDRATION_DEHYDRATED_ROOT_OWNER_RECORD_KIND =
  'FastReactDomHydrationDehydratedRootOwnerRecord';
const HYDRATION_DEHYDRATED_BOUNDARY_OWNER_RECORD_KIND =
  'FastReactDomHydrationDehydratedBoundaryOwnerRecord';
const HYDRATION_HYDRATABLE_EVENT_TARGET_LOOKUP_RECORD_KIND =
  'FastReactDomHydrationHydratableEventTargetLookupRecord';
const HYDRATION_REPLAY_TARGET_DISPATCH_LINK_DIAGNOSTIC_KIND =
  'FastReactDomHydrationReplayTargetDispatchLinkDiagnostic';
const HYDRATION_REPLAY_TARGET_DISPATCH_LINK_EVENT_PATH_ENTRY_RECORD_KIND =
  'FastReactDomHydrationReplayTargetDispatchLinkEventPathEntryRecord';
const HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC_KIND =
  'FastReactDomHydrationReplayClickDispatchDiagnostic';

const EVENT_DISPATCH_BLOCKED_CODE = 'FAST_REACT_DOM_EVENT_DISPATCH_BLOCKED';
const PLUGIN_EXTRACTION_BLOCKED_CODE =
  'FAST_REACT_DOM_PLUGIN_EXTRACTION_BLOCKED';
const EVENT_TARGET_RESOLUTION_BLOCKED_CODE =
  'FAST_REACT_DOM_EVENT_TARGET_RESOLUTION_BLOCKED';
const SYNTHETIC_EVENT_BLOCKED_CODE =
  'FAST_REACT_DOM_SYNTHETIC_EVENT_BLOCKED';
const PUBLIC_EVENT_DISPATCH_BLOCKED_CODE =
  'FAST_REACT_DOM_PUBLIC_EVENT_DISPATCH_BLOCKED';
const PROPAGATION_STOP_DIAGNOSTIC_BLOCKED_CODE =
  'FAST_REACT_DOM_PROPAGATION_STOP_DIAGNOSTIC_BLOCKED';
const DEFAULT_PREVENTED_DIAGNOSTIC_BLOCKED_CODE =
  'FAST_REACT_DOM_DEFAULT_PREVENTED_DIAGNOSTIC_BLOCKED';
const NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_BLOCKED_CODE =
  'FAST_REACT_DOM_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_BLOCKED';
const LISTENER_ERROR_ROUTING_BLOCKED_CODE =
  'FAST_REACT_DOM_LISTENER_ERROR_ROUTING_BLOCKED';
const PORTAL_EVENT_BUBBLING_BLOCKED_CODE =
  'FAST_REACT_DOM_PORTAL_EVENT_BUBBLING_BLOCKED';
const FOCUS_BLUR_EVENT_BLOCKED_CODE =
  'FAST_REACT_DOM_FOCUS_BLUR_EVENT_BLOCKED';
const FOCUS_BLUR_EVENT_LISTENER_INSTALLATION_BLOCKED_CODE =
  'FAST_REACT_DOM_FOCUS_BLUR_EVENT_LISTENER_INSTALLATION_BLOCKED';
const HYDRATION_REPLAY_BLOCKED_CODE =
  'FAST_REACT_DOM_HYDRATION_REPLAY_BLOCKED';
const CONTROLLED_STATE_RESTORE_BLOCKED_CODE =
  'FAST_REACT_DOM_CONTROLLED_STATE_RESTORE_BLOCKED';
const INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED_CODE =
  'FAST_REACT_DOM_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED';
const INVALID_EVENT_WRAPPER_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_WRAPPER_RECORD';
const INVALID_EVENT_DISPATCH_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_EVENT_DISPATCH_RECORD';
const INVALID_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_CODE =
  'FAST_REACT_DOM_INVALID_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT';
const INVALID_DISPATCH_LISTENER_RECORD_CODE =
  'FAST_REACT_DOM_INVALID_DISPATCH_LISTENER_RECORD';
const INVALID_PORTAL_EVENT_OWNER_ROOT_GATE_CODE =
  'FAST_REACT_DOM_INVALID_PORTAL_EVENT_OWNER_ROOT_GATE';
const INVALID_FOCUS_BLUR_EVENT_BLOCKER_GATE_CODE =
  'FAST_REACT_DOM_INVALID_FOCUS_BLUR_EVENT_BLOCKER_GATE';
const INVALID_PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION';
const INVALID_PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE';
const INVALID_PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER';
const INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK';
const INVALID_HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC_CODE =
  'FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC';
const PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS =
  'admitted-private-fake-dom-event-dispatch-metadata';
const PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS =
  'controlled-private-single-listener-invocation-canary';
const PRIVATE_DISPATCH_QUEUE_INVOCATION_CANARY_STATUS =
  'controlled-private-dispatch-queue-invocation-canary';
const PRIVATE_SYNTHETIC_EVENT_SHAPE_GATE_STATUS =
  'controlled-private-synthetic-event-shape-gate';
const PRIVATE_SYNTHETIC_EVENT_SHAPE_STATUS =
  'validated-private-synthetic-event-shape';
const PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS =
  'controlled-private-propagation-stop-diagnostic';
const PRIVATE_DEFAULT_PREVENTED_DIAGNOSTIC_STATUS =
  'controlled-private-default-prevented-diagnostic';
const PRIVATE_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_STATUS =
  'controlled-private-native-stop-immediate-propagation-diagnostic';
const PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS =
  'controlled-private-listener-error-routing-diagnostic';
const PRIVATE_CURRENT_TARGET_PROGRESSION_DIAGNOSTIC_STATUS =
  'validated-private-current-target-progression';
const PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS =
  'controlled-private-portal-event-owner-root-gate';
const PRIVATE_EVENT_TYPE_DISPATCH_CANARY_STATUS =
  'controlled-private-event-type-dispatch-canary';
const PRIVATE_FOCUS_BLUR_EVENT_BLOCKER_GATE_STATUS =
  'controlled-private-focus-blur-event-blocker-gate';
const PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_STATUS =
  'admitted-private-focus-blur-event-dispatch-execution';
const PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS =
  'admitted-private-click-event-delegation-dispatch-gate';
const PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_STATUS =
  'admitted-private-click-event-delegation-accepted-listener-order';
const PRIVATE_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_STATUS =
  'controlled-private-input-change-event-extraction-preflight';
const PRIVATE_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_STATUS =
  'controlled-private-hydration-replay-target-dispatch-link';
const PRIVATE_HYDRATION_REPLAY_CLICK_DISPATCH_STATUS =
  'blocked-private-hydration-replay-click-dispatch';

const SIMPLE_EVENT_PLUGIN_NAME = 'simple-event-plugin';
const CHANGE_EVENT_PLUGIN_NAME = 'change-event-plugin';
const POLYFILL_EVENT_PLUGIN_NAMES = Object.freeze([
  'enter-leave-event-plugin',
  CHANGE_EVENT_PLUGIN_NAME,
  'select-event-plugin',
  'before-input-event-plugin',
  'form-action-event-plugin'
]);
const SCROLL_END_EVENT_PLUGIN_NAME = 'scroll-end-event-plugin';
const EVENT_PLUGIN_NAMES = Object.freeze([
  SIMPLE_EVENT_PLUGIN_NAME,
  ...POLYFILL_EVENT_PLUGIN_NAMES,
  SCROLL_END_EVENT_PLUGIN_NAME
]);
const simpleEventPluginEvents = Object.freeze([
  'abort',
  'auxClick',
  'beforeToggle',
  'cancel',
  'canPlay',
  'canPlayThrough',
  'click',
  'close',
  'contextMenu',
  'copy',
  'cut',
  'drag',
  'dragEnd',
  'dragEnter',
  'dragExit',
  'dragLeave',
  'dragOver',
  'dragStart',
  'drop',
  'durationChange',
  'emptied',
  'encrypted',
  'ended',
  'error',
  'gotPointerCapture',
  'input',
  'invalid',
  'keyDown',
  'keyPress',
  'keyUp',
  'load',
  'loadedData',
  'loadedMetadata',
  'loadStart',
  'lostPointerCapture',
  'mouseDown',
  'mouseMove',
  'mouseOut',
  'mouseOver',
  'mouseUp',
  'paste',
  'pause',
  'play',
  'playing',
  'pointerCancel',
  'pointerDown',
  'pointerMove',
  'pointerOut',
  'pointerOver',
  'pointerUp',
  'progress',
  'rateChange',
  'reset',
  'resize',
  'seeked',
  'seeking',
  'stalled',
  'submit',
  'suspend',
  'timeUpdate',
  'touchCancel',
  'touchEnd',
  'touchMove',
  'touchStart',
  'volumeChange',
  'scroll',
  'scrollEnd',
  'toggle',
  'waiting',
  'wheel'
]);
const hydrationDiscreteReplayableEventNames = Object.freeze([
  'mousedown',
  'mouseup',
  'touchcancel',
  'touchend',
  'touchstart',
  'auxclick',
  'dblclick',
  'pointercancel',
  'pointerdown',
  'pointerup',
  'dragend',
  'dragstart',
  'drop',
  'compositionend',
  'compositionstart',
  'keydown',
  'keypress',
  'keyup',
  'input',
  'textInput',
  'copy',
  'cut',
  'paste',
  'click',
  'change',
  'contextmenu',
  'reset'
]);
const hydrationDiscreteReplayableEventNameSet = new Set(
  hydrationDiscreteReplayableEventNames
);
const hydrationContinuousReplayQueueNames = Object.freeze({
  focusin: 'queuedFocus',
  focusout: 'queuedFocus',
  dragenter: 'queuedDrag',
  dragleave: 'queuedDrag',
  mouseover: 'queuedMouse',
  mouseout: 'queuedMouse',
  pointerover: 'queuedPointers',
  pointerout: 'queuedPointers',
  gotpointercapture: 'queuedPointerCaptures',
  lostpointercapture: 'queuedPointerCaptures'
});
const textInputElementTypes = new Set([
  'color',
  'date',
  'datetime',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'range',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week'
]);
const simpleEventReactNames = createSimpleEventReactNameMap();
const focusBlurNativeEventNames = Object.freeze(['focusin', 'focusout']);
const focusBlurNativeEventNameSet = new Set(focusBlurNativeEventNames);
const focusBlurSyntheticEventTypes = Object.freeze({
  focusin: 'focus',
  focusout: 'blur'
});
const eventDispatchRecordPayloads = new WeakMap();
const dispatchListenerRecordPayloads = new WeakMap();
const dispatchQueueEntryRecordPayloads = new WeakMap();
const dispatchListenerInvocationCanaryRecordPayloads = new WeakMap();
const dispatchQueueInvocationCanaryRecordPayloads = new WeakMap();
const eventTypeDispatchCanaryRecordPayloads = new WeakMap();
const inputChangeEventExtractionPreflightRecordPayloads = new WeakMap();
let rootListenersModule = null;
const syntheticEventShapeRecordPayloads = new WeakMap();
const syntheticEventShapeGateRecordPayloads = new WeakMap();
const dispatchListenerErrorRouteRecordPayloads = new WeakMap();
const portalEventOwnerRootGateRecordPayloads = new WeakMap();
const focusBlurEventBlockerGateRecordPayloads = new WeakMap();
const privateFocusBlurEventDispatchExecutionPayloads = new WeakMap();
const privateClickEventDelegationDispatchGatePayloads = new WeakMap();
const privateClickEventDelegationAcceptedListenerOrderPayloads =
  new WeakMap();
const hydrationReplayEventQueueDiagnosticPayloads = new WeakMap();
const hydrationDehydratedTargetResolutionDiagnosticPayloads =
  new WeakMap();
const hydrationReplayTargetDispatchLinkDiagnosticPayloads =
  new WeakMap();
const hydrationReplayClickDispatchDiagnosticPayloads = new WeakMap();

function isObjectLike(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function hasOwnProp(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function getInputChangePreflightTargetNode(dispatchRecord) {
  if (isObjectLike(dispatchRecord.targetHostInstanceNode)) {
    return dispatchRecord.targetHostInstanceNode;
  }

  if (
    isObjectLike(dispatchRecord.targetDispatchPathRecord) &&
    isObjectLike(
      dispatchRecord.targetDispatchPathRecord.targetHostInstanceNode
    )
  ) {
    return (
      dispatchRecord.targetDispatchPathRecord.targetHostInstanceNode
    );
  }

  return isObjectLike(dispatchRecord.nativeEventTarget)
    ? dispatchRecord.nativeEventTarget
    : null;
}

function getInputChangePreflightHostTag(node) {
  if (!isObjectLike(node)) {
    return null;
  }

  if (typeof node.localName === 'string' && node.localName !== '') {
    return node.localName.toLowerCase();
  }

  if (typeof node.nodeName === 'string' && node.nodeName !== '') {
    return node.nodeName.toLowerCase();
  }

  return null;
}

function getInputChangePreflightInputType(
  hostTag,
  targetNode,
  latestProps
) {
  if (hostTag !== 'input') {
    return null;
  }

  const targetType = getInputChangePreflightStringProperty(
    targetNode,
    'type'
  );
  const propsType = getInputChangePreflightStringProperty(
    latestProps,
    'type'
  );
  const rawType = targetType === null ? propsType : targetType;
  if (rawType === null || rawType.trim() === '') {
    return 'text';
  }

  return rawType.toLowerCase();
}

function getInputChangePreflightStringProperty(source, key) {
  if (!isObjectLike(source) || !hasOwnProp(source, key)) {
    return null;
  }

  return typeof source[key] === 'string' ? source[key] : null;
}

function createInputChangePreflightPropSummary(props, propName) {
  if (!isObjectLike(props) || typeof propName !== 'string') {
    return Object.freeze({
      nonNull: false,
      present: false,
      type: 'missing'
    });
  }

  const present = hasOwnProp(props, propName);
  const value = present ? props[propName] : undefined;

  return Object.freeze({
    nonNull: present && value != null,
    present,
    type: present ? typeof value : 'missing'
  });
}

function createInputChangeEventExtractionPreflightError(reason) {
  const error = new Error(
    `Invalid private React DOM input/change event extraction preflight: ${reason}.`
  );
  error.code = INVALID_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_CODE;
  error.reason = reason;
  return error;
}

function throwInputChangeEventExtractionPreflightError(reason) {
  throw createInputChangeEventExtractionPreflightError(reason);
}

function getRootListenerCurrentnessGatePayload(record) {
  if (rootListenersModule === null) {
    rootListenersModule = require('./root-listeners.js');
  }

  const getPayload =
    rootListenersModule.getPrivateRootListenerCurrentnessGatePayload;
  return typeof getPayload === 'function' ? getPayload(record) : null;
}

function normalizeInputChangeEventExtractionPreflightOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  assertNoInputChangeExtractionPublicBehaviorClaims(normalizedOptions);

  const rootListenerCurrentnessGateRecord =
    normalizedOptions.rootListenerCurrentnessGateRecord ||
    normalizedOptions.listenerCurrentnessGateRecord ||
    normalizedOptions.currentnessGateRecord ||
    null;
  if (rootListenerCurrentnessGateRecord === null) {
    throwInputChangeEventExtractionPreflightError(
      'missing-root-listener-currentness-gate'
    );
  }

  assertNoInputChangeExtractionSourceAlias(
    normalizedOptions.sourceRecord,
    'source-record-alias'
  );
  assertNoInputChangeExtractionSourceAlias(
    rootListenerCurrentnessGateRecord,
    'root-listener-currentness-source-alias'
  );

  return Object.freeze({
    rootListenerCurrentnessGateRecord,
    sourceRecord: isObjectLike(normalizedOptions.sourceRecord)
      ? normalizedOptions.sourceRecord
      : null
  });
}

function assertNoInputChangeExtractionPublicBehaviorClaims(options) {
  const blockedClaimFields = [
    'browserDomEventCompatibilityClaimed',
    'browserInputMutated',
    'browserListenerInstallation',
    'browserSyntheticEventCompatibilityClaimed',
    'compatibilityClaimed',
    'controlledStateRestoreScheduled',
    'eventDispatch',
    'eventDispatchAllowed',
    'hydrationReplayCompatibilityClaimed',
    'listenerInstallation',
    'packageCompatibilityClaimed',
    'publicControlledBehaviorEnabled',
    'publicDispatchEnabled',
    'publicEventCompatibilityClaimed',
    'publicHydrationReplayCompatibilityClaimed',
    'publicListenerInstallation',
    'publicPackageCompatibilityClaimed',
    'publicRootBehaviorChanged',
    'publicSyntheticEventCompatibilityClaimed',
    'realDomMutationAllowed',
    'restoreQueueFlushed',
    'restoreQueueWritten',
    'rootListenerInstallation',
    'syntheticEventCompatibilityClaimed',
    'syntheticEventCreated',
    'syntheticEventDispatch',
    'valueTrackerFieldWritten',
    'willDispatchPublicEvent',
    'willInvokePublicListeners'
  ];

  for (const field of blockedClaimFields) {
    if (options[field] === true) {
      throwInputChangeEventExtractionPreflightError(
        'public-or-live-behavior-claimed'
      );
    }
  }

  if (
    typeof options.syntheticEventCount === 'number' &&
    options.syntheticEventCount > 0
  ) {
    throwInputChangeEventExtractionPreflightError(
      'public-or-live-behavior-claimed'
    );
  }
}

function assertNoInputChangeExtractionSourceAlias(source, reason) {
  if (containsBlockedInputChangeExtractionSourceAlias(source)) {
    throwInputChangeEventExtractionPreflightError(reason);
  }
}

function containsBlockedInputChangeExtractionSourceAlias(source) {
  if (!isObjectLike(source)) {
    return false;
  }

  for (const key of [
    '$$typeof',
    'facadeCall',
    'kind',
    'operation',
    'queueKind',
    'requestType',
    'source',
    'sourceKind',
    'status',
    'targetKind'
  ]) {
    if (isBlockedInputChangeExtractionSourceAlias(source[key])) {
      return true;
    }
  }

  return (
    source.resourceFormEvidence !== undefined ||
    source.resourceEvidence !== undefined ||
    source.formEvidence !== undefined ||
    source.formActionEvidence !== undefined ||
    source.formResetEvidence !== undefined ||
    source.hydrationReplayEvidence !== undefined ||
    source.replayQueueEvidence !== undefined
  );
}

function isBlockedInputChangeExtractionSourceAlias(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.toLowerCase();
  return (
    normalized.includes('hydrationreplay') ||
    normalized.includes('hydration-replay') ||
    normalized.includes('eventreplay') ||
    normalized.includes('event-replay') ||
    normalized.includes('replayqueue') ||
    normalized.includes('replay-queue') ||
    normalized.includes('resource-form') ||
    normalized.includes('resourceform') ||
    normalized.includes('form-action') ||
    normalized.includes('formaction') ||
    normalized.includes('form-reset') ||
    normalized.includes('formreset') ||
    normalized.includes('requestformreset')
  );
}

function createInvalidEventWrapperRecordError() {
  const error = new Error(
    'Cannot create a React DOM event dispatch record without a private listener wrapper record.'
  );
  error.code = INVALID_EVENT_WRAPPER_RECORD_CODE;
  return error;
}

function createPluginEventSystemError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function functionThatReturnsTrue() {
  return true;
}

function functionThatReturnsFalse() {
  return false;
}

function getWrapperRecord(listenerOrWrapperRecord) {
  if (
    typeof listenerOrWrapperRecord === 'function' &&
    listenerOrWrapperRecord.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__
  ) {
    return listenerOrWrapperRecord.__FAST_REACT_DOM_EVENT_WRAPPER_RECORD__;
  }

  return listenerOrWrapperRecord;
}

function assertEventListenerWrapperRecord(listenerOrWrapperRecord) {
  const wrapperRecord = getWrapperRecord(listenerOrWrapperRecord);
  if (
    wrapperRecord === null ||
    typeof wrapperRecord !== 'object' ||
    wrapperRecord.kind !== EVENT_WRAPPER_RECORD_KIND ||
    typeof wrapperRecord.domEventName !== 'string' ||
    typeof wrapperRecord.eventSystemFlags !== 'number'
  ) {
    throw createInvalidEventWrapperRecordError();
  }

  return wrapperRecord;
}

function createDispatchQueueRecord(entries) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const frozenEntries = Object.freeze(normalizedEntries.slice());
  const listenerCount = frozenEntries.reduce(
    (count, entry) => count + entry.listenerCount,
    0
  );

  return Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    entries: frozenEntries,
    kind: DISPATCH_QUEUE_RECORD_KIND,
    length: frozenEntries.length,
    listenerCount,
    listenerInvocationCount: 0,
    publicRootBehaviorChanged: false,
    singleListenerInvocationCanaryStatus:
      listenerCount === 0
        ? 'unavailable-no-listeners'
        : 'available-private-helper-only',
    status:
      frozenEntries.length === 0
        ? 'empty'
        : 'blocked-listener-metadata-recorded',
    syntheticEventCount: 0,
    willInvokeListeners: false
  });
}

function createPluginRecord(
  pluginName,
  extractionStatus,
  blockedReason,
  metadata
) {
  return Object.freeze({
    blockedReason,
    dispatchEntryCount:
      metadata && typeof metadata.dispatchEntryCount === 'number'
        ? metadata.dispatchEntryCount
        : 0,
    extractionStatus,
    listenerMetadataCount:
      metadata && typeof metadata.listenerMetadataCount === 'number'
        ? metadata.listenerMetadataCount
        : 0,
    listenerInvocationCount: 0,
    pluginName,
    syntheticEventCount: 0
  });
}

function createPluginRecords(eventSystemFlags, dispatchQueue) {
  const processPolyfills =
    shouldProcessPolyfillEventPlugins(eventSystemFlags);
  const records = [
    createPluginRecord(
      SIMPLE_EVENT_PLUGIN_NAME,
      'blocked',
      PLUGIN_EXTRACTION_BLOCKED_CODE,
      {
        dispatchEntryCount: dispatchQueue.length,
        listenerMetadataCount: dispatchQueue.listenerCount
      }
    )
  ];

  for (const pluginName of POLYFILL_EVENT_PLUGIN_NAMES) {
    records.push(
      createPluginRecord(
        pluginName,
        processPolyfills ? 'blocked' : 'skipped-by-event-system-flags',
        processPolyfills
          ? PLUGIN_EXTRACTION_BLOCKED_CODE
          : null
      )
    );
  }

  records.push(
    createPluginRecord(
      SCROLL_END_EVENT_PLUGIN_NAME,
      'blocked-by-feature-gate',
      PLUGIN_EXTRACTION_BLOCKED_CODE
    )
  );

  return Object.freeze(records);
}

function createSimpleEventDispatchMetadata(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  targetNormalizationRecord,
  targetDispatchPathRecord
) {
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const registrationName = getSimpleEventRegistrationName(
    wrapperRecord.domEventName,
    eventSystemFlags
  );
  const targetListenerLookupRecords = [];
  const listenerRecords = [];

  if (targetDispatchPathRecord.entries.length === 0) {
    targetListenerLookupRecords.push(
      createEventListenerTargetLookupRecord(
        targetNormalizationRecord,
        registrationName
      )
    );
  } else {
    for (const pathEntry of targetDispatchPathRecord.entries) {
      const listenerTargetNormalizationRecord =
        pathEntry.index === 0
          ? targetNormalizationRecord
          : createEventTargetNormalizationRecord(
              pathEntry.targetHostInstanceNode
            );
      const lookupRecord = createEventListenerTargetLookupRecord(
        listenerTargetNormalizationRecord,
        registrationName
      );

      targetListenerLookupRecords.push(lookupRecord);
      listenerRecords.push(
        ...createPrivateEventListenerQueueDispatchListenerRecords(
          wrapperRecord,
          nativeEvent,
          nativeEventTarget,
          pathEntry
        )
      );
      if (lookupRecord.listenerFound) {
        listenerRecords.push(
          createDispatchListenerRecord(
            wrapperRecord,
            nativeEvent,
            nativeEventTarget,
            pathEntry,
            lookupRecord
          )
        );
      }
    }
  }

  const dispatchEntries =
    listenerRecords.length === 0
      ? []
      : [
          createDispatchQueueEntryRecord(
            wrapperRecord,
            nativeEvent,
            nativeEventTarget,
            listenerRecords
          )
        ];

  return {
    dispatchQueue: createDispatchQueueRecord(dispatchEntries),
    targetListenerLookupRecord:
      targetListenerLookupRecords.length === 0
        ? null
        : targetListenerLookupRecords[0],
    targetListenerLookupRecords: Object.freeze(
      targetListenerLookupRecords.slice()
    )
  };
}

function createDispatchListenerRecord(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  pathEntry,
  lookupRecord
) {
  const lookupPayload =
    getEventListenerTargetLookupRecordPayload(lookupRecord);
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const inCapturePhase = isCapturePhase(eventSystemFlags);
  const nativeEventType = getNativeEventType(
    nativeEvent,
    wrapperRecord.domEventName
  );
  const record = Object.freeze({
    blockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: pathEntry.targetHostInstanceNode,
    dispatchPathIndex: pathEntry.index,
    domEventName: wrapperRecord.domEventName,
    exposesLatestProps: false,
    exposesListener: false,
    hostOwner: pathEntry.hostOwner,
    inCapturePhase,
    instance: pathEntry.targetHostInstanceToken,
    kind: DISPATCH_LISTENER_RECORD_KIND,
    latestPropsStatus: lookupRecord.latestPropsStatus,
    listenerFound: lookupRecord.listenerFound,
    listenerInvocationCount: 0,
    listenerStatus: lookupRecord.listenerStatus,
    listenerType: lookupRecord.listenerType,
    nativeEventTarget,
    nativeEventType,
    phase: inCapturePhase ? 'capture' : 'bubble',
    publicRootBehaviorChanged: false,
    registrationName: lookupRecord.registrationName,
    rootOwner: pathEntry.rootOwner,
    status: 'blocked-listener-metadata-recorded',
    syntheticEventCount: 0,
    targetHostInstanceNode: pathEntry.targetHostInstanceNode,
    targetHostInstanceStatus: pathEntry.targetHostInstanceStatus,
    targetHostInstanceToken: pathEntry.targetHostInstanceToken,
    targetInst: pathEntry.targetHostInstanceToken,
    targetInstStatus: 'resolved-component-tree-host-instance',
    targetListenerLookupRecord: lookupRecord,
    willInvokeListener: false
  });

  dispatchListenerRecordPayloads.set(
    record,
    Object.freeze({
      latestProps: lookupPayload === null ? null : lookupPayload.latestProps,
      listener: lookupPayload === null ? null : lookupPayload.listener,
      nativeEvent,
      nativeEventTarget,
      pathEntry,
      targetListenerLookupRecord: lookupRecord
    })
  );

  return record;
}

function createPrivateEventListenerQueueDispatchListenerRecords(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  pathEntry
) {
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const inCapturePhase = isCapturePhase(eventSystemFlags);
  const queueEntries = getPrivateEventListenerQueueEntries(
    pathEntry.targetHostInstanceNode,
    wrapperRecord.domEventName,
    inCapturePhase
  );
  if (queueEntries.length === 0) {
    return [];
  }

  return queueEntries.map((queueEntryRecord) =>
    createPrivateEventListenerQueueDispatchListenerRecord(
      wrapperRecord,
      nativeEvent,
      nativeEventTarget,
      pathEntry,
      queueEntryRecord
    )
  );
}

function createPrivateEventListenerQueueDispatchListenerRecord(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  pathEntry,
  queueEntryRecord
) {
  const queueEntryPayload =
    getPrivateEventListenerQueueEntryPayload(queueEntryRecord);
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const inCapturePhase = isCapturePhase(eventSystemFlags);
  const nativeEventType = getNativeEventType(
    nativeEvent,
    wrapperRecord.domEventName
  );
  const record = Object.freeze({
    blockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: pathEntry.targetHostInstanceNode,
    dispatchPathIndex: pathEntry.index,
    domEventName: wrapperRecord.domEventName,
    exposesLatestProps: false,
    exposesListener: false,
    hostOwner: pathEntry.hostOwner,
    inCapturePhase,
    instance: pathEntry.targetHostInstanceToken,
    kind: DISPATCH_LISTENER_RECORD_KIND,
    latestPropsStatus: pathEntry.latestPropsStatus,
    listenerFound: true,
    listenerInvocationCount: 0,
    listenerQueueIndex: queueEntryRecord.listenerQueueIndex,
    listenerQueueKey: queueEntryRecord.listenerQueueKey,
    listenerQueueRecordKind: PRIVATE_EVENT_LISTENER_QUEUE_ENTRY_RECORD_KIND,
    listenerStatus: 'present',
    listenerType: queueEntryRecord.listenerType,
    nativeEventTarget,
    nativeEventType,
    phase: inCapturePhase ? 'capture' : 'bubble',
    privateListenerQueue: true,
    publicRootBehaviorChanged: false,
    registrationName: getSimpleEventRegistrationName(
      wrapperRecord.domEventName,
      eventSystemFlags
    ),
    rootOwner: pathEntry.rootOwner,
    status: 'blocked-listener-metadata-recorded',
    syntheticEventCount: 0,
    targetHostInstanceNode: pathEntry.targetHostInstanceNode,
    targetHostInstanceStatus: pathEntry.targetHostInstanceStatus,
    targetHostInstanceToken: pathEntry.targetHostInstanceToken,
    targetInst: pathEntry.targetHostInstanceToken,
    targetInstStatus: 'resolved-component-tree-host-instance',
    targetListenerLookupRecord: null,
    willInvokeListener: false
  });

  dispatchListenerRecordPayloads.set(
    record,
    Object.freeze({
      latestProps: null,
      listener:
        queueEntryPayload === null ? null : queueEntryPayload.listener,
      nativeEvent,
      nativeEventTarget,
      pathEntry,
      privateEventListenerQueueEntryRecord: queueEntryRecord,
      targetListenerLookupRecord: null
    })
  );

  return record;
}

function createDispatchQueueEntryRecord(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  listenerRecords
) {
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const inCapturePhase = isCapturePhase(eventSystemFlags);
  const listeners = Object.freeze(listenerRecords.slice());
  const processingListeners = inCapturePhase
    ? Object.freeze(listenerRecords.slice().reverse())
    : listeners;
  const record = Object.freeze({
    accumulationOrder: 'target-to-root',
    blockedReason: PLUGIN_EXTRACTION_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    domEventName: wrapperRecord.domEventName,
    exposesSyntheticEvent: false,
    inCapturePhase,
    kind: DISPATCH_QUEUE_ENTRY_RECORD_KIND,
    listenerCount: listeners.length,
    listenerInvocationCount: 0,
    listeners,
    nativeEventTarget,
    nativeEventType: getNativeEventType(
      nativeEvent,
      wrapperRecord.domEventName
    ),
    pluginName: SIMPLE_EVENT_PLUGIN_NAME,
    processingListenerRecords: processingListeners,
    processingOrder: inCapturePhase ? 'root-to-target' : 'target-to-root',
    publicRootBehaviorChanged: false,
    reactName: getSimpleEventReactName(wrapperRecord.domEventName),
    registrationName:
      listeners.length === 0 ? null : listeners[0].registrationName,
    status: 'blocked-listener-metadata-recorded',
    syntheticEventCount: 0,
    syntheticEventStatus: 'not-created',
    willInvokeListeners: false
  });

  dispatchQueueEntryRecordPayloads.set(
    record,
    Object.freeze({
      listenerRecords: listeners,
      nativeEvent,
      nativeEventTarget,
      processingListenerRecords: processingListeners
    })
  );

  return record;
}

function getDispatchListenerRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchListenerRecordPayloads.get(record) || null;
}

function isDispatchListenerRecord(record) {
  return getDispatchListenerRecordPayload(record) !== null;
}

function getDispatchQueueEntryRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchQueueEntryRecordPayloads.get(record) || null;
}

function isDispatchQueueEntryRecord(record) {
  return getDispatchQueueEntryRecordPayload(record) !== null;
}

function createEventTypeDispatchCanaryRecord(dispatchRecord) {
  const normalizedDispatchRecord = assertEventDispatchRecord(dispatchRecord);
  const dispatchQueue = normalizedDispatchRecord.dispatchQueue;
  const dispatchQueueEntries = Object.freeze(
    dispatchQueue.entries.map((dispatchQueueEntry, index) =>
      createEventTypeDispatchCanaryEntryRecord(dispatchQueueEntry, index)
    )
  );
  const listenerMetadata = Object.freeze(
    dispatchQueueEntries.flatMap((entry) => entry.listenerMetadata)
  );
  const primaryEntry =
    dispatchQueueEntries.length === 0 ? null : dispatchQueueEntries[0];
  const hydrationReplay = normalizedDispatchRecord.hydrationReplay;
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    blockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    dispatchQueueEntries,
    dispatchQueueEntryCount: dispatchQueueEntries.length,
    dispatchQueueLength: dispatchQueue.length,
    dispatchQueueListenerCount: dispatchQueue.listenerCount,
    dispatchQueueStatus: dispatchQueue.status,
    dispatcherName: normalizedDispatchRecord.dispatcherName,
    domEventName: normalizedDispatchRecord.domEventName,
    eventDispatch: false,
    eventPriority: normalizedDispatchRecord.eventPriority,
    eventPriorityLabel: normalizedDispatchRecord.eventPriorityLabel,
    eventPriorityLane: normalizedDispatchRecord.eventPriorityLane,
    eventPriorityName: normalizedDispatchRecord.eventPriorityName,
    eventSystemFlags: normalizedDispatchRecord.eventSystemFlags,
    hydrationReplayBlockedReason: hydrationReplay.blockedReason,
    hydrationReplayQueued: hydrationReplay.queued,
    hydrationReplayStatus: hydrationReplay.status,
    inCapturePhase: normalizedDispatchRecord.inCapturePhase,
    isEventHandleNonManagedNode:
      normalizedDispatchRecord.isEventHandleNonManagedNode,
    isNonDelegatedEvent: normalizedDispatchRecord.isNonDelegatedEvent,
    kind: EVENT_TYPE_DISPATCH_CANARY_RECORD_KIND,
    listenerInvocationCount: 0,
    listenerMetadata,
    listenerMetadataCount: listenerMetadata.length,
    metadataOnly: true,
    nativeEventType: normalizedDispatchRecord.nativeEventType,
    primaryReactName: primaryEntry === null ? null : primaryEntry.reactName,
    primaryRegistrationName:
      primaryEntry === null ? null : primaryEntry.registrationName,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    reactName: primaryEntry === null ? null : primaryEntry.reactName,
    registrationName:
      primaryEntry === null ? null : primaryEntry.registrationName,
    status: PRIVATE_EVENT_TYPE_DISPATCH_CANARY_STATUS,
    syntheticEventCount: 0,
    syntheticEventStatus:
      primaryEntry === null
        ? 'not-applicable'
        : primaryEntry.syntheticEventStatus,
    targetDispatchPathLength:
      normalizedDispatchRecord.targetDispatchPathLength,
    targetDispatchPathStatus:
      normalizedDispatchRecord.targetDispatchPathStatus,
    targetInst: normalizedDispatchRecord.targetInst,
    targetInstStatus: normalizedDispatchRecord.targetInstStatus,
    targetListenerFound: normalizedDispatchRecord.targetListenerFound,
    targetListenerLookupCount:
      normalizedDispatchRecord.targetListenerLookupCount,
    targetListenerLookupStatus:
      normalizedDispatchRecord.targetListenerLookupStatus,
    targetListenerRegistrationName:
      normalizedDispatchRecord.targetListenerRegistrationName,
    targetResolutionStatus: normalizedDispatchRecord.targetResolutionStatus,
    willInvokeListeners: false,
    wrapperKind: normalizedDispatchRecord.wrapperKind
  });

  eventTypeDispatchCanaryRecordPayloads.set(
    record,
    Object.freeze({
      dispatchQueueEntries: Object.freeze(dispatchQueue.entries.slice()),
      dispatchRecord: normalizedDispatchRecord,
      listenerRecords: Object.freeze(
        dispatchQueue.entries.flatMap((entry) => {
          const payload = getDispatchQueueEntryRecordPayload(entry);
          return payload === null ? [] : payload.listenerRecords;
        })
      )
    })
  );

  return record;
}

function createEventTypeDispatchCanaryEntryRecord(
  dispatchQueueEntry,
  index
) {
  const normalizedDispatchQueueEntry =
    assertDispatchQueueEntryRecord(dispatchQueueEntry);
  const entryPayload = getDispatchQueueEntryRecordPayload(
    normalizedDispatchQueueEntry
  );
  const listenerRecords =
    entryPayload === null ? [] : entryPayload.listenerRecords;

  return Object.freeze({
    accumulationOrder: normalizedDispatchQueueEntry.accumulationOrder,
    browserDomEventCompatibilityClaimed: false,
    domEventName: normalizedDispatchQueueEntry.domEventName,
    index,
    inCapturePhase: normalizedDispatchQueueEntry.inCapturePhase,
    kind: normalizedDispatchQueueEntry.kind,
    listenerCount: normalizedDispatchQueueEntry.listenerCount,
    listenerInvocationCount: 0,
    listenerMetadata: Object.freeze(
      listenerRecords.map((listenerRecord, listenerIndex) =>
        createEventTypeDispatchCanaryListenerMetadata(
          listenerRecord,
          listenerIndex,
          index
        )
      )
    ),
    nativeEventType: normalizedDispatchQueueEntry.nativeEventType,
    pluginName: normalizedDispatchQueueEntry.pluginName,
    processingOrder: normalizedDispatchQueueEntry.processingOrder,
    publicRootBehaviorChanged: false,
    reactName: normalizedDispatchQueueEntry.reactName,
    registrationName: normalizedDispatchQueueEntry.registrationName,
    status: normalizedDispatchQueueEntry.status,
    syntheticEventCount: 0,
    syntheticEventStatus:
      normalizedDispatchQueueEntry.syntheticEventStatus,
    willInvokeListeners: false
  });
}

function createEventTypeDispatchCanaryListenerMetadata(
  dispatchListenerRecord,
  listenerIndex,
  dispatchQueueEntryIndex
) {
  const normalizedDispatchListenerRecord =
    assertDispatchListenerRecord(dispatchListenerRecord);

  return Object.freeze({
    browserDomEventCompatibilityClaimed: false,
    currentTarget: normalizedDispatchListenerRecord.currentTarget,
    dispatchPathIndex:
      normalizedDispatchListenerRecord.dispatchPathIndex,
    dispatchQueueEntryIndex,
    domEventName: normalizedDispatchListenerRecord.domEventName,
    exposesLatestProps: false,
    exposesListener: false,
    inCapturePhase: normalizedDispatchListenerRecord.inCapturePhase,
    index: listenerIndex,
    kind: normalizedDispatchListenerRecord.kind,
    latestPropsStatus:
      normalizedDispatchListenerRecord.latestPropsStatus,
    listenerFound: normalizedDispatchListenerRecord.listenerFound,
    listenerInvocationCount: 0,
    listenerStatus: normalizedDispatchListenerRecord.listenerStatus,
    listenerType: normalizedDispatchListenerRecord.listenerType,
    nativeEventType: normalizedDispatchListenerRecord.nativeEventType,
    phase: normalizedDispatchListenerRecord.phase,
    publicRootBehaviorChanged: false,
    registrationName:
      normalizedDispatchListenerRecord.registrationName,
    status: normalizedDispatchListenerRecord.status,
    syntheticEventCount: 0,
    targetHostInstanceStatus:
      normalizedDispatchListenerRecord.targetHostInstanceStatus,
    targetInst: normalizedDispatchListenerRecord.targetInst,
    targetInstStatus:
      normalizedDispatchListenerRecord.targetInstStatus,
    willInvokeListener: false
  });
}

function getEventTypeDispatchCanaryRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return eventTypeDispatchCanaryRecordPayloads.get(record) || null;
}

function isEventTypeDispatchCanaryRecord(record) {
  return getEventTypeDispatchCanaryRecordPayload(record) !== null;
}

function createInputChangeEventExtractionPreflightRecord(
  dispatchRecord,
  options
) {
  const normalizedDispatchRecord = assertEventDispatchRecord(dispatchRecord);
  const dispatchPayload =
    getEventDispatchRecordPayload(normalizedDispatchRecord);
  const preflightOptions =
    normalizeInputChangeEventExtractionPreflightOptions(options);
  assertInputChangeEventDispatchRecordBlocked(normalizedDispatchRecord);
  assertInputChangeEventTypeMatchesSource(normalizedDispatchRecord);
  const rootListenerCurrentness =
    createInputChangeEventPreflightRootListenerCurrentness(
      normalizedDispatchRecord,
      preflightOptions.rootListenerCurrentnessGateRecord
    );
  const latestPropsEvidence =
    createInputChangeEventPreflightLatestPropsEvidence(
      normalizedDispatchRecord
    );
  const targetMetadata = createInputChangeEventPreflightTargetMetadata(
    normalizedDispatchRecord,
    latestPropsEvidence.latestProps
  );
  const controlledMetadata =
    createInputChangeEventPreflightControlledMetadata(
      normalizedDispatchRecord,
      targetMetadata,
      latestPropsEvidence
    );
  const extractionMetadata =
    createInputChangeEventPreflightExtractionMetadata(
      normalizedDispatchRecord,
      targetMetadata,
      controlledMetadata
    );
  const controlledRestoreQueuePreflightBridge =
    createInputChangeEventPreflightControlledRestoreQueueBridge(
      targetMetadata,
      latestPropsEvidence,
      controlledMetadata,
      extractionMetadata
    );
  const dispatchBehavior = createInputChangeEventPreflightDispatchBehavior(
    normalizedDispatchRecord,
    extractionMetadata
  );
  const defaultBehavior = createInputChangeEventPreflightDefaultBehavior();
  const sideEffects = createInputChangeEventPreflightSideEffects(
    controlledMetadata,
    extractionMetadata
  );
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    blockedReason: INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    changeEventExtractionPreflight: true,
    compatibilityClaimed: false,
    controlledMetadata,
    controlledMetadataAvailable:
      controlledMetadata.controlledMetadataAvailable,
    controlledRestoreQueuePreflightBridge,
    defaultBehavior,
    defaultBehaviorChanged: false,
    dispatchBehavior,
    domEventName: normalizedDispatchRecord.domEventName,
    eventDispatch: false,
    eventSystemFlags: normalizedDispatchRecord.eventSystemFlags,
    eventType: normalizedDispatchRecord.domEventName,
    extractionMetadata,
    inCapturePhase: normalizedDispatchRecord.inCapturePhase,
    kind: INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND,
    listenerInvocationCount: 0,
    latestPropsEvidence: latestPropsEvidence.record,
    metadataOnly: true,
    nativeEventType: normalizedDispatchRecord.nativeEventType,
    pluginName: CHANGE_EVENT_PLUGIN_NAME,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    reactEventType: 'change',
    reactName: 'onChange',
    rootListenerCurrentness,
    sideEffects,
    status: PRIVATE_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_STATUS,
    syntheticEventCount: 0,
    syntheticEventStatus: 'not-created',
    targetInst: normalizedDispatchRecord.targetInst,
    targetInstStatus: normalizedDispatchRecord.targetInstStatus,
    targetMetadata,
    targetResolutionStatus:
      normalizedDispatchRecord.targetResolutionStatus,
    targetTag: targetMetadata.hostTag,
    targetType: targetMetadata.inputType,
    willInvokeListeners: false
  });

  inputChangeEventExtractionPreflightRecordPayloads.set(
    record,
    Object.freeze({
      dispatchRecord: normalizedDispatchRecord,
      eventDispatchPayload: dispatchPayload,
      rootListenerCurrentnessGateRecord:
        preflightOptions.rootListenerCurrentnessGateRecord,
      rootListenerCurrentness,
      targetDispatchPathRecord:
        normalizedDispatchRecord.targetDispatchPathRecord,
      targetListenerLookupRecord:
        normalizedDispatchRecord.targetListenerLookupRecord
    })
  );

  return record;
}

function assertInputChangeEventDispatchRecordBlocked(dispatchRecord) {
  if (
    dispatchRecord.admissionStatus !==
      PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS ||
    dispatchRecord.blockedReason !== EVENT_DISPATCH_BLOCKED_CODE ||
    dispatchRecord.status !== 'blocked' ||
    dispatchRecord.browserDomEventCompatibilityClaimed !== false ||
    dispatchRecord.publicRootBehaviorChanged !== false ||
    dispatchRecord.syntheticEventCount !== 0 ||
    dispatchRecord.listenerInvocationCount !== 0 ||
    dispatchRecord.willInvokeListeners !== false ||
    !isObjectLike(dispatchRecord.controlledStateRestore) ||
    dispatchRecord.controlledStateRestore.status !== 'blocked' ||
    dispatchRecord.controlledStateRestore.scheduled !== false ||
    dispatchRecord.controlledStateRestore.blockedReason !==
      CONTROLLED_STATE_RESTORE_BLOCKED_CODE ||
    !isObjectLike(dispatchRecord.hydrationReplay) ||
    dispatchRecord.hydrationReplay.queued !== false ||
    dispatchRecord.hydrationReplay.status !== 'blocked'
  ) {
    throwInputChangeEventExtractionPreflightError(
      'dispatch-record-public-status-not-blocked'
    );
  }
}

function assertInputChangeEventTypeMatchesSource(dispatchRecord) {
  if (dispatchRecord.nativeEventType !== dispatchRecord.domEventName) {
    throwInputChangeEventExtractionPreflightError(
      'native-event-type-mismatch'
    );
  }
}

function createInputChangeEventPreflightRootListenerCurrentness(
  dispatchRecord,
  rootListenerCurrentnessGateRecord
) {
  if (
    !isObjectLike(rootListenerCurrentnessGateRecord) ||
    rootListenerCurrentnessGateRecord.kind !==
      'FastReactDomPrivateRootListenerCurrentnessGateRecord' ||
    rootListenerCurrentnessGateRecord.status !==
      'validated-private-root-listener-currentness-gate' ||
    rootListenerCurrentnessGateRecord.sourceOwned !== true ||
    rootListenerCurrentnessGateRecord.sourceOwnership !==
      'weakmap-root-listener-registration' ||
    rootListenerCurrentnessGateRecord.currentRegistration !== true ||
    rootListenerCurrentnessGateRecord.registrationActive !== true ||
    rootListenerCurrentnessGateRecord.listenerStateStable !== true ||
    rootListenerCurrentnessGateRecord.eventDispatch !== false ||
    rootListenerCurrentnessGateRecord.syntheticEventDispatch !== false ||
    rootListenerCurrentnessGateRecord.publicDispatchEnabled !== false ||
    rootListenerCurrentnessGateRecord.publicRootBehaviorChanged !== false ||
    rootListenerCurrentnessGateRecord.browserDomEventCompatibilityClaimed !==
      false ||
    rootListenerCurrentnessGateRecord.compatibilityClaimed !== false ||
    !Array.isArray(rootListenerCurrentnessGateRecord.targetRows) ||
    !Array.isArray(rootListenerCurrentnessGateRecord.listenerRows)
  ) {
    throwInputChangeEventExtractionPreflightError(
      'invalid-root-listener-currentness-gate'
    );
  }

  if (
    rootListenerCurrentnessGateRecord.sourceKind === 'hydrateRoot' ||
    isBlockedInputChangeExtractionSourceAlias(
      rootListenerCurrentnessGateRecord.sourceKind
    )
  ) {
    throwInputChangeEventExtractionPreflightError(
      'root-listener-currentness-source-alias'
    );
  }
  const rootListenerCurrentnessGatePayload =
    getRootListenerCurrentnessGatePayload(
      rootListenerCurrentnessGateRecord
    );
  if (rootListenerCurrentnessGatePayload === null) {
    throwInputChangeEventExtractionPreflightError(
      'root-listener-currentness-not-source-owned'
    );
  }
  if (
    isBlockedInputChangeExtractionSourceAlias(
      rootListenerCurrentnessGatePayload.options?.sourceKind
    ) ||
    containsBlockedInputChangeExtractionSourceAlias(
      rootListenerCurrentnessGatePayload.sourceRecord
    )
  ) {
    throwInputChangeEventExtractionPreflightError(
      'root-listener-currentness-source-alias'
    );
  }

  const targetContainerInfo = describeContainer(dispatchRecord.targetContainer);
  const rootContainerRows =
    rootListenerCurrentnessGateRecord.targetRows.filter(
      (row) =>
        row.targetRole === 'root-container' &&
        row.current === true &&
        row.eventDispatch === false &&
        row.publicRootBehaviorChanged === false &&
        row.browserDomEventCompatibilityClaimed === false &&
        row.compatibilityClaimed === false
    );
  const rootContainerMatchesDispatchTarget = rootContainerRows.some((row) =>
    containerInfoMatches(row.targetInfo, targetContainerInfo)
  );
  const phase = dispatchRecord.inCapturePhase ? 'capture' : 'bubble';
  const eventListenerRows =
    rootListenerCurrentnessGateRecord.listenerRows.filter(
      (row) =>
        row.targetRole === 'root-container' &&
        row.domEventName === dispatchRecord.domEventName &&
        row.phase === phase &&
        row.current === true &&
        row.listenerShellOwned === true &&
        row.sourceOwned === true &&
        row.eventDispatch === false &&
        row.publicRootBehaviorChanged === false &&
        row.browserDomEventCompatibilityClaimed === false &&
        row.compatibilityClaimed === false &&
        row.willDispatchPublicEvent === false
    );

  if (!rootContainerMatchesDispatchTarget) {
    throwInputChangeEventExtractionPreflightError(
      'root-listener-currentness-container-mismatch'
    );
  }

  if (eventListenerRows.length === 0) {
    throwInputChangeEventExtractionPreflightError(
      'root-listener-currentness-event-type-mismatch'
    );
  }

  return Object.freeze({
    status: 'validated-input-change-root-listener-currentness',
    sourceOwned: true,
    sourceOwnership: 'weakmap-root-listener-registration',
    gateRecordKind: rootListenerCurrentnessGateRecord.kind,
    gateRecordStatus: rootListenerCurrentnessGateRecord.status,
    sourceKind: rootListenerCurrentnessGateRecord.sourceKind,
    currentRegistration: true,
    registrationActive: true,
    listenerStateStable: true,
    targetContainerInfo: Object.freeze(targetContainerInfo),
    rootContainerMatchesDispatchTarget,
    domEventName: dispatchRecord.domEventName,
    nativeEventType: dispatchRecord.nativeEventType,
    phase,
    eventTypeCurrent: true,
    rootListenerRowCount:
      rootListenerCurrentnessGateRecord.rootListenerRowCount,
    listenerRowCount: rootListenerCurrentnessGateRecord.listenerRowCount,
    currentListenerRowCount:
      rootListenerCurrentnessGateRecord.currentListenerRowCount,
    matchedEventListenerRowCount: eventListenerRows.length,
    targetRowCount: rootListenerCurrentnessGateRecord.targetRowCount,
    eventDispatch: false,
    syntheticEventDispatch: false,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    browserDomEventCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function containerInfoMatches(left, right) {
  return (
    isObjectLike(left) &&
    isObjectLike(right) &&
    left.kind === right.kind &&
    left.nodeName === right.nodeName &&
    left.nodeType === right.nodeType
  );
}

function createInputChangeEventPreflightLatestPropsEvidence(
  dispatchRecord
) {
  const lookupRecord = dispatchRecord.targetListenerLookupRecord;
  if (!isObjectLike(lookupRecord)) {
    return {
      accepted: false,
      latestProps: null,
      record: Object.freeze({
        accepted: false,
        currentLatestPropsFresh: false,
        exposesLatestProps: false,
        latestPropsObject: false,
        latestPropsStatus: 'missing',
        listenerFound: false,
        listenerLookupStatus: 'not-applicable',
        propKeys: Object.freeze([]),
        rawLatestPropsRetained: false,
        reason: 'missing-target-listener-lookup-record',
        registrationName: null,
        sourceRecordKind: null,
        staleLatestPropsRejected: true,
        targetHostInstanceStatus: null,
        targetHostTag: null,
        targetResolved: false
      })
    };
  }

  const lookupPayload =
    getEventListenerTargetLookupRecordPayload(lookupRecord);
  const latestProps =
    lookupPayload === null ? null : lookupPayload.latestProps;
  const targetNode =
    lookupPayload === null ? null : lookupPayload.hostInstanceNode;
  const currentLatestProps = getLatestPropsFromNode(targetNode);
  const latestPropsObject = isObjectLike(latestProps);
  const accepted =
    lookupRecord.latestPropsStatus === 'present' &&
    latestPropsObject &&
    currentLatestProps === latestProps;
  const targetHostTag = getInputChangePreflightHostTag(
    lookupRecord.targetHostInstanceNode
  );

  return {
    accepted,
    latestProps,
    record: Object.freeze({
      accepted,
      exposesLatestProps: false,
      currentLatestPropsFresh: currentLatestProps === latestProps,
      latestPropsObject,
      latestPropsStatus: lookupRecord.latestPropsStatus,
      listenerFound: lookupRecord.listenerFound,
      listenerLookupStatus: lookupRecord.listenerStatus,
      propKeys: latestPropsObject
        ? Object.freeze(Object.keys(latestProps).sort())
        : Object.freeze([]),
      rawLatestPropsRetained: false,
      registrationName: lookupRecord.registrationName,
      sourceRecordKind: lookupRecord.kind,
      staleLatestPropsRejected: true,
      targetHostInstanceStatus:
        lookupRecord.targetHostInstanceStatus,
      targetHostTag,
      targetResolved:
        lookupRecord.targetHostInstanceStatus === 'mounted-host-instance'
    })
  };
}

function createInputChangeEventPreflightTargetMetadata(
  dispatchRecord,
  latestProps
) {
  const targetNode = getInputChangePreflightTargetNode(dispatchRecord);
  const hostTag = getInputChangePreflightHostTag(targetNode);
  const inputType = getInputChangePreflightInputType(
    hostTag,
    targetNode,
    latestProps
  );
  const textInputTarget =
    hostTag === 'input' && textInputElementTypes.has(inputType);
  const checkboxTarget =
    hostTag === 'input' && inputType === 'checkbox';
  const supportedTarget = textInputTarget || checkboxTarget;
  const expectedDomEventNames = textInputTarget
    ? Object.freeze(['input', 'change'])
    : checkboxTarget
      ? Object.freeze(['click'])
      : Object.freeze([]);
  const supportedEventType = expectedDomEventNames.includes(
    dispatchRecord.domEventName
  );

  return Object.freeze({
    checkboxTarget,
    changeExtractionStrategy: textInputTarget
      ? 'input-or-change-event'
      : checkboxTarget
        ? 'click-event'
        : 'unsupported-target',
    controlledPropName: checkboxTarget
      ? 'checked'
      : textInputTarget
        ? 'value'
        : null,
    expectedDomEventNames,
    hostTag,
    inputType,
    nativeEventType: dispatchRecord.nativeEventType,
    nodeType:
      isObjectLike(targetNode) && typeof targetNode.nodeType === 'number'
        ? targetNode.nodeType
        : null,
    supportedEventType,
    supportedTarget,
    targetKind: textInputTarget
      ? 'text-input'
      : checkboxTarget
        ? 'checkbox-input'
        : 'unsupported',
    targetResolved: dispatchRecord.targetResolutionStatus === 'resolved',
    textInputTarget
  });
}

function createInputChangeEventPreflightControlledMetadata(
  dispatchRecord,
  targetMetadata,
  latestPropsEvidence
) {
  const latestProps = latestPropsEvidence.latestProps;
  const controlledProp = createInputChangePreflightPropSummary(
    latestProps,
    targetMetadata.controlledPropName
  );
  const onChangeProp = createInputChangePreflightPropSummary(
    latestProps,
    'onChange'
  );
  const controlledMetadataAvailable =
    latestPropsEvidence.accepted === true &&
    targetMetadata.supportedTarget === true;

  return Object.freeze({
    checkedMetadataAvailable:
      targetMetadata.checkboxTarget === true &&
      controlledMetadataAvailable === true,
    controlled: controlledProp.nonNull,
    controlledMetadataAvailable,
    controlledPropName: targetMetadata.controlledPropName,
    controlledPropPresent: controlledProp.present,
    controlledPropIsNonNull: controlledProp.nonNull,
    controlledPropType: controlledProp.type,
    controlledRestoreBlockedReason:
      dispatchRecord.controlledStateRestore.blockedReason,
    controlledRestoreMetadataAvailable:
      controlledMetadataAvailable === true && controlledProp.present,
    controlledStateRestoreScheduled:
      dispatchRecord.controlledStateRestore.scheduled,
    controlledStateRestoreStatus:
      dispatchRecord.controlledStateRestore.status,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    onChangeListenerPresent: onChangeProp.type === 'function',
    onChangePropPresent: onChangeProp.present,
    onChangePropType: onChangeProp.type,
    postEventControlledRestoreScheduled: false,
    postEventRestoreQueueWritten: false,
    rawLatestPropsRetained: false,
    targetResolved: targetMetadata.targetResolved,
    valueMetadataAvailable:
      targetMetadata.textInputTarget === true &&
      controlledMetadataAvailable === true
  });
}

function createInputChangeEventPreflightExtractionMetadata(
  dispatchRecord,
  targetMetadata,
  controlledMetadata
) {
  const targetEligible =
    targetMetadata.targetResolved === true &&
    targetMetadata.supportedTarget === true &&
    targetMetadata.supportedEventType === true;

  return Object.freeze({
    blockedReason: INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED_CODE,
    changeEventCouldBeAccumulatedIfValueChanged: targetEligible,
    changeEventPluginExtractEventsCalled: false,
    controlledMetadataAvailable:
      controlledMetadata.controlledMetadataAvailable,
    dispatchQueuePushAllowed: false,
    enqueueStateRestoreRequiredIfExtracted: targetEligible,
    enqueueStateRestoreScheduled: false,
    getTargetInstFunctionName: targetMetadata.textInputTarget
      ? 'getTargetInstForInputOrChangeEvent'
      : targetMetadata.checkboxTarget
        ? 'getTargetInstForClickEvent'
        : null,
    listenerAccumulationPerformed: false,
    nativeEventType: dispatchRecord.nativeEventType,
    pluginName: CHANGE_EVENT_PLUGIN_NAME,
    polyfillPluginsEnabled:
      shouldProcessPolyfillEventPlugins(
        dispatchRecord.eventSystemFlags
      ),
    reactName: 'onChange',
    registrationNames: Object.freeze(['onChangeCapture', 'onChange']),
    status: targetEligible
      ? 'blocked-before-value-tracker-change-check'
      : 'blocked-unsupported-input-change-target-or-event',
    syntheticEventConstructor: 'SyntheticEvent',
    syntheticEventCreated: false,
    targetEligible,
    targetInstCandidateStatus: targetEligible
      ? 'available-before-value-change-check'
      : 'not-available',
    twoPhaseListenersAccumulated: false,
    valueChangeCheckRequired: targetEligible,
    valueTrackerUpdated: false
  });
}

function createInputChangeEventPreflightControlledRestoreQueueBridge(
  targetMetadata,
  latestPropsEvidence,
  controlledMetadata,
  extractionMetadata
) {
  const bridgeEligible =
    extractionMetadata.targetEligible === true &&
    latestPropsEvidence.accepted === true &&
    controlledMetadata.controlled === true;

  return Object.freeze({
    status: bridgeEligible
      ? 'blocked-before-controlled-restore-queue-preflight-bridge'
      : 'blocked-unsupported-controlled-restore-queue-preflight-bridge',
    blockedReason: INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED_CODE,
    metadataOnly: true,
    pluginName: CHANGE_EVENT_PLUGIN_NAME,
    reactName: 'onChange',
    reactEventType: 'change',
    hostTag: targetMetadata.hostTag,
    inputType: targetMetadata.inputType,
    targetKind: targetMetadata.targetKind,
    controlledPropName: controlledMetadata.controlledPropName,
    controlled: controlledMetadata.controlled,
    targetEligible: extractionMetadata.targetEligible,
    latestPropsEvidenceAccepted: latestPropsEvidence.accepted,
    controlledMetadataAvailable:
      controlledMetadata.controlledMetadataAvailable,
    controlledRestoreLatestPropsEvidenceRequired:
      extractionMetadata.targetEligible,
    controlledRestoreLatestPropsEvidenceAvailable:
      controlledMetadata.controlledRestoreMetadataAvailable,
    bridgeEligible,
    bridgeRecordCreated: false,
    bridgeRowsCreated: false,
    restoreQueuePreflightRequiredIfValueChanged:
      extractionMetadata.targetEligible,
    restoreQueuePreflightRecorded: false,
    restoreQueueWritten: false,
    restoreQueueFlushed: false,
    controlledStateRestoreScheduled: false,
    controlledStateRestoreInvoked: false,
    hostWrapperInvoked: false,
    valueTrackerFieldWritten: false,
    hostValueWritten: false,
    browserInputMutated: false,
    rawLatestPropsRetained: false,
    compatibilityClaimed: false
  });
}

function createInputChangeEventPreflightDispatchBehavior(
  dispatchRecord,
  extractionMetadata
) {
  return Object.freeze({
    batchedUpdatesScheduled: false,
    blockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    browserListenerInstallation: false,
    changeDispatchQueueEntries: 0,
    dispatchQueueLengthBeforePreflight: dispatchRecord.dispatchQueue.length,
    dispatchQueueMutated: false,
    eventDispatch: false,
    extractionWouldRequireDispatch:
      extractionMetadata.changeEventCouldBeAccumulatedIfValueChanged,
    listenerInvocationCount: 0,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    syntheticEventCount: 0,
    syntheticEventDispatch: false,
    willInvokeListeners: false
  });
}

function createInputChangeEventPreflightDefaultBehavior() {
  return Object.freeze({
    blockedReason: DEFAULT_PREVENTED_DIAGNOSTIC_BLOCKED_CODE,
    defaultBehaviorChanged: false,
    defaultPreventedDiagnosticsEnabled: false,
    nativeDefaultPreventedAfterDispatch: null,
    nativeDefaultPreventedBeforeDispatch: null,
    nativeDefaultPreventedInspected: false,
    nativePreventDefaultCallCount: 0,
    preventDefaultCalled: false,
    status: 'blocked-default-behavior-diagnostics-not-run',
    willCallPreventDefault: false
  });
}

function createInputChangeEventPreflightSideEffects(
  controlledMetadata,
  extractionMetadata
) {
  return Object.freeze({
    browserListenerInstallation: false,
    browserInputMutated: false,
    compatibilityClaimed: false,
    controlledMetadataRead:
      controlledMetadata.controlledMetadataAvailable,
    controlledStateRestoreScheduled: false,
    controlledRestoreQueuePreflightBridgeRecorded: false,
    defaultBehaviorChanged: false,
    dispatchQueueMutated: false,
    hostValueRead: false,
    hostValueWritten: false,
    listenerInvocationCount: 0,
    nativeEventPreventDefault: false,
    postEventRestoreQueueWritten: false,
    propertyDescriptorInstalled: false,
    publicRootBehaviorChanged: false,
    rawEventCaptured: false,
    rawLatestPropsRetained: false,
    rawTargetCaptured: false,
    syntheticEventCreated: false,
    syntheticEventDispatched: false,
    valueTrackerFieldWritten: false,
    valueTrackerUpdated: false,
    valueTrackerUpdateRequired:
      extractionMetadata.valueChangeCheckRequired
  });
}

function getInputChangeEventExtractionPreflightRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return (
    inputChangeEventExtractionPreflightRecordPayloads.get(record) || null
  );
}

function isInputChangeEventExtractionPreflightRecord(record) {
  return getInputChangeEventExtractionPreflightRecordPayload(record) !== null;
}

function invokeSingleListenerCanaryFromDispatchRecord(dispatchRecord, options) {
  const normalizedDispatchRecord = assertEventDispatchRecord(dispatchRecord);
  const invocationOptions = normalizeSingleListenerCanaryOptions(options);
  const dispatchQueue = normalizedDispatchRecord.dispatchQueue;
  const dispatchQueueEntry =
    dispatchQueue.entries[invocationOptions.dispatchQueueEntryIndex] || null;

  if (dispatchQueueEntry === null) {
    return createSkippedSingleListenerInvocationCanaryRecord(
      normalizedDispatchRecord,
      null,
      null,
      invocationOptions,
      'no-dispatch-queue-entry'
    );
  }

  const listenerRecords = invocationOptions.useProcessingOrder
    ? dispatchQueueEntry.processingListenerRecords
    : dispatchQueueEntry.listeners;
  const dispatchListenerRecord =
    listenerRecords[invocationOptions.listenerIndex] || null;

  if (dispatchListenerRecord === null) {
    return createSkippedSingleListenerInvocationCanaryRecord(
      normalizedDispatchRecord,
      dispatchQueueEntry,
      null,
      invocationOptions,
      'no-dispatch-listener-record'
    );
  }

  return invokeDispatchListenerRecordForCanary(dispatchListenerRecord, {
    dispatchQueueEntry,
    dispatchRecord: normalizedDispatchRecord,
    listenerIndex: invocationOptions.listenerIndex,
    selectedFromProcessingOrder: invocationOptions.useProcessingOrder
  });
}

function invokeDispatchQueueCanaryFromDispatchRecords(
  dispatchRecords,
  options
) {
  const normalizedDispatchRecords = normalizeDispatchRecordList(
    dispatchRecords
  );
  const normalizedOptions = normalizeDispatchQueueCanaryOptions(options);
  const useProcessingOrder = normalizedOptions.useProcessingOrder;
  const propagationState =
    createDispatchQueuePropagationDiagnosticState(normalizedOptions);
  const defaultPreventedState =
    createDispatchQueueDefaultPreventedDiagnosticState(normalizedOptions);
  const invocationRecords = [];
  const listenerErrorRoutes = [];
  const defaultPreventedDiagnostics = [];
  const propagationStopDiagnostics = [];
  const nativeStopImmediatePropagationDiagnostics = [];
  let dispatchQueueEntryCount = 0;
  let listenerCandidateCount = 0;
  let listenerInvocationCount = 0;
  let listenerErrorCount = 0;
  let propagationSkippedListenerCount = 0;
  let nativeStopImmediatePropagationSkippedListenerCount = 0;

  for (
    let dispatchRecordIndex = 0;
    dispatchRecordIndex < normalizedDispatchRecords.length;
    dispatchRecordIndex++
  ) {
    const dispatchRecord = normalizedDispatchRecords[dispatchRecordIndex];
    const dispatchQueue = dispatchRecord.dispatchQueue;

    for (
      let dispatchQueueEntryIndex = 0;
      dispatchQueueEntryIndex < dispatchQueue.entries.length;
      dispatchQueueEntryIndex++
    ) {
      const dispatchQueueEntry = assertDispatchQueueEntryRecord(
        dispatchQueue.entries[dispatchQueueEntryIndex]
      );
      const entryPayload =
        getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
      const listenerRecords = useProcessingOrder
        ? entryPayload.processingListenerRecords
        : entryPayload.listenerRecords;
      const canaryEventContext = createDispatchQueueCanaryEventContext(
        dispatchRecord,
        dispatchQueueEntry,
        entryPayload,
        normalizedOptions,
        propagationState,
        defaultPreventedState
      );
      dispatchQueueEntryCount++;
      listenerCandidateCount += listenerRecords.length;
      let previousInstance = null;

      for (
        let listenerIndex = 0;
        listenerIndex < listenerRecords.length;
        listenerIndex++
      ) {
        const listenerRecord = listenerRecords[listenerIndex];
        if (
          shouldSkipDispatchListenerForNativeStopImmediatePropagation(
            listenerRecord,
            canaryEventContext
          )
        ) {
          const skippedRecord =
            createSkippedSingleListenerInvocationCanaryRecord(
              dispatchRecord,
              dispatchQueueEntry,
              listenerRecord,
              {
                dispatchQueueEntryIndex,
                listenerIndex,
                useProcessingOrder
              },
              'native-stop-immediate-propagation',
              propagationState
            );
          invocationRecords.push(skippedRecord);
          nativeStopImmediatePropagationSkippedListenerCount++;
          nativeStopImmediatePropagationDiagnostics.push(
            createDispatchNativeStopImmediatePropagationDiagnosticRecord({
              action: 'skip-listener',
              dispatchQueueEntry,
              dispatchRecord,
              listenerRecord,
              propagationState,
              skipped: true
            })
          );
          previousInstance = listenerRecord.targetInst;
          continue;
        }
        if (
          shouldSkipDispatchListenerForPropagationStop(
            listenerRecord,
            previousInstance,
            canaryEventContext
          )
        ) {
          const skippedRecord =
            createSkippedSingleListenerInvocationCanaryRecord(
              dispatchRecord,
              dispatchQueueEntry,
              listenerRecord,
              {
                dispatchQueueEntryIndex,
                listenerIndex,
                useProcessingOrder
              },
              'propagation-stopped',
              propagationState
            );
          invocationRecords.push(skippedRecord);
          propagationSkippedListenerCount++;
          propagationStopDiagnostics.push(
            createDispatchPropagationStopDiagnosticRecord({
              action: 'skip-listener',
              dispatchQueueEntry,
              dispatchRecord,
              listenerRecord,
              propagationState,
              skipped: true
            })
          );
          break;
        }

        const stopCountBefore =
          propagationState === null
            ? 0
            : propagationState.stopPropagationCallCount;
        const preventDefaultCountBefore =
          getDefaultPreventedDiagnosticCallCount(defaultPreventedState);
        const nativeStopImmediateCountBefore =
          getNativeStopImmediatePropagationDiagnosticCallCount(
            propagationState
          );
        const invocationRecord = invokeDispatchListenerRecordForCanary(
          listenerRecord,
          {
            canaryEventContext,
            dispatchQueueEntry,
            dispatchRecord,
            listenerIndex,
            listenerErrorRoutingDiagnosticsEnabled:
              normalizedOptions.enableListenerErrorRoutingDiagnostics,
            selectedFromProcessingOrder: useProcessingOrder
          }
        );
        invocationRecords.push(invocationRecord);
        listenerInvocationCount += invocationRecord.listenerInvocationCount;
        if (invocationRecord.listenerErrorCaptured) {
          listenerErrorCount++;
          if (normalizedOptions.enableListenerErrorRoutingDiagnostics) {
            listenerErrorRoutes.push(
              createDispatchListenerErrorRouteRecord(
                invocationRecord,
                listenerErrorRoutes.length
              )
            );
          }
        }
        if (
          defaultPreventedState !== null &&
          defaultPreventedState.preventDefaultCallCount >
            preventDefaultCountBefore
        ) {
          defaultPreventedDiagnostics.push(
            createDispatchDefaultPreventedDiagnosticRecord({
              action: 'prevent-default',
              dispatchQueueEntry,
              dispatchRecord,
              listenerRecord,
              defaultPreventedState
            })
          );
        }
        if (
          propagationState !== null &&
          propagationState.stopPropagationCallCount > stopCountBefore
        ) {
          propagationStopDiagnostics.push(
            createDispatchPropagationStopDiagnosticRecord({
              action: 'stop-propagation',
              dispatchQueueEntry,
              dispatchRecord,
              listenerRecord,
              propagationState,
              skipped: false
            })
          );
        }
        if (
          propagationState !== null &&
          propagationState.nativeStopImmediatePropagationCallCount >
            nativeStopImmediateCountBefore
        ) {
          nativeStopImmediatePropagationDiagnostics.push(
            createDispatchNativeStopImmediatePropagationDiagnosticRecord({
              action: 'native-stop-immediate-propagation',
              dispatchQueueEntry,
              dispatchRecord,
              listenerRecord,
              propagationState,
              skipped: false
            })
          );
        }
        previousInstance = listenerRecord.targetInst;
      }
      finishDispatchQueueCanaryEventContext(canaryEventContext);
    }
  }

  const frozenInvocationRecords = Object.freeze(invocationRecords.slice());
  const frozenListenerErrorRoutes = Object.freeze(
    listenerErrorRoutes.slice()
  );
  const frozenDefaultPreventedDiagnostics = Object.freeze(
    defaultPreventedDiagnostics.slice()
  );
  const frozenPropagationStopDiagnostics = Object.freeze(
    propagationStopDiagnostics.slice()
  );
  const frozenNativeStopImmediatePropagationDiagnostics = Object.freeze(
    nativeStopImmediatePropagationDiagnostics.slice()
  );
  const currentTargetProgression = Object.freeze(
    frozenInvocationRecords.map((invocationRecord, index) =>
      Object.freeze({
        currentTargetAfterInvocation:
          invocationRecord.currentTargetAfterInvocation,
        currentTargetBeforeInvocation:
          invocationRecord.currentTargetBeforeInvocation,
        currentTargetDuringInvocation:
          invocationRecord.currentTargetDuringInvocation,
        currentTargetResetAfterInvocation:
          invocationRecord.currentTargetResetAfterInvocation,
        dispatchPathIndex: invocationRecord.dispatchPathIndex,
        index,
        invocationStatus: invocationRecord.invocationStatus,
        phase: invocationRecord.phase,
        registrationName: invocationRecord.registrationName,
        targetInst: invocationRecord.targetInst
      })
    )
  );
  const currentTargetResetCount = frozenInvocationRecords.filter(
    (invocationRecord) =>
      invocationRecord.listenerInvocationCount > 0 &&
      invocationRecord.currentTargetResetAfterInvocation === true
  ).length;
  const invocationOrder = Object.freeze(
    frozenInvocationRecords.map((invocationRecord, index) =>
      Object.freeze({
        currentTarget: invocationRecord.currentTarget,
        currentTargetAfterInvocation:
          invocationRecord.currentTargetAfterInvocation,
        currentTargetBeforeInvocation:
          invocationRecord.currentTargetBeforeInvocation,
        currentTargetDuringInvocation:
          invocationRecord.currentTargetDuringInvocation,
        currentTargetResetAfterInvocation:
          invocationRecord.currentTargetResetAfterInvocation,
        defaultPreventedAfterInvocation:
          invocationRecord.defaultPreventedAfterInvocation,
        defaultPreventedBeforeInvocation:
          invocationRecord.defaultPreventedBeforeInvocation,
        dispatchPathIndex: invocationRecord.dispatchPathIndex,
        index,
        invocationStatus: invocationRecord.invocationStatus,
        listenerErrorCaptured: invocationRecord.listenerErrorCaptured,
        preventDefaultInvoked: invocationRecord.preventDefaultInvoked,
        phase: invocationRecord.phase,
        registrationName: invocationRecord.registrationName,
        skippedByNativeStopImmediatePropagation:
          invocationRecord.invocationStatus ===
          'skipped-native-stop-immediate-propagation',
        skippedByPropagationStop:
          invocationRecord.invocationStatus ===
          'skipped-propagation-stopped',
        targetInst: invocationRecord.targetInst
      })
    )
  );
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    captureListenerInvocationCount: frozenInvocationRecords.filter(
      (invocationRecord) =>
        invocationRecord.phase === 'capture' &&
        invocationRecord.listenerInvocationCount > 0
    ).length,
    currentTargetDiagnosticStatus:
      listenerInvocationCount === 0
        ? 'not-applicable'
        : PRIVATE_CURRENT_TARGET_PROGRESSION_DIAGNOSTIC_STATUS,
    currentTargetProgression,
    currentTargetResetAfterDispatch:
      listenerInvocationCount === currentTargetResetCount,
    currentTargetResetCount,
    defaultPrevented:
      defaultPreventedState !== null &&
      defaultPreventedState.defaultPrevented,
    defaultPreventedBlockedReason: DEFAULT_PREVENTED_DIAGNOSTIC_BLOCKED_CODE,
    defaultPreventedDiagnosticEnabled:
      normalizedOptions.enableDefaultPreventedDiagnostics,
    defaultPreventedDiagnosticStatus:
      frozenDefaultPreventedDiagnostics.length === 0
        ? 'not-applicable'
        : PRIVATE_DEFAULT_PREVENTED_DIAGNOSTIC_STATUS,
    defaultPreventedDiagnostics: frozenDefaultPreventedDiagnostics,
    isDefaultPrevented:
      defaultPreventedState !== null &&
      defaultPreventedState.defaultPrevented,
    nativeDefaultPreventedAfterDispatch:
      defaultPreventedState !== null &&
      getNativeEventDefaultPrevented(defaultPreventedState.nativeEvent),
    nativeDefaultPreventedBeforeDispatch:
      defaultPreventedState !== null &&
      defaultPreventedState.initialDefaultPrevented,
    nativeEventPreventDefaultCallCount:
      defaultPreventedState === null
        ? 0
        : getNativeEventPreventDefaultDiagnosticCallCount(
            defaultPreventedState.nativeEvent
          ),
    nativeEventPreventDefaultCallCountDelta:
      defaultPreventedState === null
        ? 0
        : getNativeEventPreventDefaultDiagnosticCallCount(
            defaultPreventedState.nativeEvent
          ) - defaultPreventedState.initialNativePreventDefaultCallCount,
    preventDefaultCallCount:
      defaultPreventedState === null
        ? 0
        : defaultPreventedState.preventDefaultCallCount,
    dispatchQueueEntryCount,
    dispatchQueueProcessed: false,
    dispatchRecordCount: normalizedDispatchRecords.length,
    exposesCanaryEvents: false,
    exposesListeners: false,
    exposesNativeEvents: false,
    exposesSyntheticEvent: false,
    invocationOrder,
    invocationRecordCount: frozenInvocationRecords.length,
    invocationStatus:
      frozenInvocationRecords.length === 0
        ? 'skipped-no-listeners'
        : listenerErrorCount === 0
          ? 'invoked-dispatch-queue-canary'
          : 'captured-dispatch-queue-listener-errors',
    kind: DISPATCH_QUEUE_INVOCATION_CANARY_RECORD_KIND,
    listenerCandidateCount,
    listenerErrorCount,
    listenerErrorRouteCount: frozenListenerErrorRoutes.length,
    listenerErrorRoutes: frozenListenerErrorRoutes,
    listenerErrorRoutingBlockedReason:
      LISTENER_ERROR_ROUTING_BLOCKED_CODE,
    listenerErrorRoutingDiagnosticEnabled:
      normalizedOptions.enableListenerErrorRoutingDiagnostics,
    listenerErrorRoutingStatus:
      frozenListenerErrorRoutes.length === 0
        ? 'not-applicable'
        : PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS,
    listenerInvocationCount,
    nativeImmediatePropagationStopped:
      propagationState !== null &&
      propagationState.nativeImmediatePropagationStopped,
    nativeStopImmediatePropagationBlockedReason:
      NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_BLOCKED_CODE,
    nativeStopImmediatePropagationCallCount:
      propagationState === null
        ? 0
        : propagationState.nativeStopImmediatePropagationCallCount,
    nativeStopImmediatePropagationDiagnosticEnabled:
      normalizedOptions.enableNativeStopImmediatePropagationDiagnostics,
    nativeStopImmediatePropagationDiagnosticStatus:
      frozenNativeStopImmediatePropagationDiagnostics.length === 0
        ? 'not-applicable'
        : PRIVATE_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_STATUS,
    nativeStopImmediatePropagationDiagnostics:
      frozenNativeStopImmediatePropagationDiagnostics,
    nativeStopImmediatePropagationNativeCallCount:
      propagationState === null
        ? 0
        : propagationState.nativeStopImmediatePropagationNativeCallCount,
    nativeStopImmediatePropagationSkippedListenerCount:
      nativeStopImmediatePropagationSkippedListenerCount,
    propagationSkippedListenerCount,
    propagationStopCallCount:
      propagationState === null ? 0 : propagationState.stopPropagationCallCount,
    propagationStopDiagnosticEnabled:
      normalizedOptions.enablePropagationStopDiagnostics,
    propagationStopDiagnosticStatus:
      frozenPropagationStopDiagnostics.length === 0
        ? 'not-applicable'
        : PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS,
    propagationStopDiagnostics: frozenPropagationStopDiagnostics,
    propagationStopNativeCallCount:
      propagationState === null
        ? 0
        : propagationState.nativeStopPropagationCallCount,
    propagationStopBlockedReason:
      PROPAGATION_STOP_DIAGNOSTIC_BLOCKED_CODE,
    propagationStopped:
      propagationState !== null && propagationState.propagationStopped,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    selectedFromProcessingOrder: useProcessingOrder,
    status: PRIVATE_DISPATCH_QUEUE_INVOCATION_CANARY_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    bubbleListenerInvocationCount: frozenInvocationRecords.filter(
      (invocationRecord) =>
        invocationRecord.phase === 'bubble' &&
        invocationRecord.listenerInvocationCount > 0
    ).length,
    willInvokeListeners: false
  });

  dispatchQueueInvocationCanaryRecordPayloads.set(
    record,
    Object.freeze({
      dispatchRecords: Object.freeze(normalizedDispatchRecords.slice()),
      invocationRecords: frozenInvocationRecords,
      listenerErrorRoutes: frozenListenerErrorRoutes,
      options: Object.freeze({
        enableDefaultPreventedDiagnostics:
          normalizedOptions.enableDefaultPreventedDiagnostics,
        enableListenerErrorRoutingDiagnostics:
          normalizedOptions.enableListenerErrorRoutingDiagnostics,
        enableNativeStopImmediatePropagationDiagnostics:
          normalizedOptions.enableNativeStopImmediatePropagationDiagnostics,
        enablePropagationStopDiagnostics:
          normalizedOptions.enablePropagationStopDiagnostics,
        useProcessingOrder
      }),
      currentTargetProgression,
      defaultPreventedDiagnostics: frozenDefaultPreventedDiagnostics,
      nativeStopImmediatePropagationDiagnostics:
        frozenNativeStopImmediatePropagationDiagnostics,
      propagationStopDiagnostics: frozenPropagationStopDiagnostics
    })
  );

  return record;
}

function normalizeDispatchQueueCanaryOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};

  return {
    enableDefaultPreventedDiagnostics:
      normalizedOptions.enableDefaultPreventedDiagnostics === true,
    enableListenerErrorRoutingDiagnostics:
      normalizedOptions.enableListenerErrorRoutingDiagnostics === true,
    enableNativeStopImmediatePropagationDiagnostics:
      normalizedOptions.enableNativeStopImmediatePropagationDiagnostics === true,
    enablePropagationStopDiagnostics:
      normalizedOptions.enablePropagationStopDiagnostics === true,
    useProcessingOrder: normalizedOptions.useProcessingOrder !== false
  };
}

function createDispatchQueuePropagationDiagnosticState(options) {
  if (
    !options.enablePropagationStopDiagnostics &&
    !options.enableNativeStopImmediatePropagationDiagnostics
  ) {
    return null;
  }

  return {
    currentDispatchListenerRecord: null,
    currentTarget: null,
    enableNativeStopImmediatePropagationDiagnostics:
      options.enableNativeStopImmediatePropagationDiagnostics,
    enablePropagationStopDiagnostics:
      options.enablePropagationStopDiagnostics,
    nativeImmediatePropagationStopped: false,
    nativeEvent: null,
    nativeStopImmediatePropagationCallCount: 0,
    nativeStopImmediatePropagationNativeCallCount: 0,
    nativeStopImmediatePropagationSourceListenerRecord: null,
    nativeStopImmediatePropagationStoppedNativeEvent: null,
    nativeStopPropagationCallCount: 0,
    propagationStopped: false,
    stoppedNativeEvent: null,
    stopPropagationCallCount: 0,
    stopSourceListenerRecord: null
  };
}

function createDispatchQueueDefaultPreventedDiagnosticState(options) {
  if (!options.enableDefaultPreventedDiagnostics) {
    return null;
  }

  return {
    currentDispatchListenerRecord: null,
    currentTarget: null,
    defaultPrevented: false,
    enableDefaultPreventedDiagnostics:
      options.enableDefaultPreventedDiagnostics,
    initialDefaultPrevented: false,
    initialNativePreventDefaultCallCount: 0,
    nativeEvent: null,
    nativeEventPreventDefaultCallCount: 0,
    preventDefaultCallCount: 0,
    preventDefaultSourceListenerRecord: null
  };
}

function createDispatchQueueCanaryEventContext(
  dispatchRecord,
  dispatchQueueEntry,
  entryPayload,
  options,
  propagationState,
  defaultPreventedState
) {
  const listenerRecords = options.useProcessingOrder
    ? entryPayload.processingListenerRecords
    : entryPayload.listenerRecords;
  const firstListenerRecord = listenerRecords[0] || null;
  if (firstListenerRecord === null) {
    return null;
  }

  const firstListenerPayload =
    getDispatchListenerRecordPayload(firstListenerRecord);
  if (firstListenerPayload === null) {
    return null;
  }

  const currentTargetState = {
    currentDispatchListenerRecord: null,
    currentTarget: null
  };

  if (propagationState !== null) {
    propagationState.nativeEvent = firstListenerPayload.nativeEvent;
    if (
      propagationState.stoppedNativeEvent !== firstListenerPayload.nativeEvent
    ) {
      propagationState.propagationStopped = false;
    }
    propagationState.nativeStopPropagationCallCount =
      getNativeStopPropagationCallCount(firstListenerPayload.nativeEvent);
  }
  if (
    propagationState !== null &&
    propagationState.nativeStopImmediatePropagationStoppedNativeEvent !==
      firstListenerPayload.nativeEvent
  ) {
    propagationState.nativeImmediatePropagationStopped = false;
  }
  if (propagationState !== null) {
    propagationState.nativeStopImmediatePropagationNativeCallCount =
      getNativeStopImmediatePropagationCallCount(
        firstListenerPayload.nativeEvent
      );
  }
  if (defaultPreventedState !== null) {
    initializeDefaultPreventedDiagnosticStateForNativeEvent(
      defaultPreventedState,
      firstListenerPayload.nativeEvent
    );
  }

  return {
    canaryEvent: createDispatchListenerCanaryEvent(
      firstListenerRecord,
      firstListenerPayload,
      {
        currentTargetState,
        defaultPreventedState,
        propagationState,
        targetInst: dispatchRecord.targetInst
      }
    ),
    currentTargetState,
    defaultPreventedState,
    dispatchQueueEntry,
    propagationState
  };
}

function prepareDispatchQueueCanaryEventForListener(
  canaryEventContext,
  listenerRecord
) {
  if (canaryEventContext === null) {
    return;
  }

  const currentTargetState = canaryEventContext.currentTargetState;
  currentTargetState.currentDispatchListenerRecord = listenerRecord;
  currentTargetState.currentTarget = listenerRecord.currentTarget;

  const propagationState = canaryEventContext.propagationState;
  if (propagationState !== null) {
    propagationState.currentDispatchListenerRecord = listenerRecord;
    propagationState.currentTarget = listenerRecord.currentTarget;
  }
  const defaultPreventedState = canaryEventContext.defaultPreventedState;
  if (defaultPreventedState !== null) {
    defaultPreventedState.currentDispatchListenerRecord = listenerRecord;
    defaultPreventedState.currentTarget = listenerRecord.currentTarget;
  }
}

function resetDispatchQueueCanaryEventAfterListener(canaryEventContext) {
  if (canaryEventContext === null) {
    return;
  }

  const currentTargetState = canaryEventContext.currentTargetState;
  currentTargetState.currentDispatchListenerRecord = null;
  currentTargetState.currentTarget = null;

  const propagationState = canaryEventContext.propagationState;
  if (propagationState !== null) {
    propagationState.currentDispatchListenerRecord = null;
    propagationState.currentTarget = null;
  }
  const defaultPreventedState = canaryEventContext.defaultPreventedState;
  if (defaultPreventedState !== null) {
    defaultPreventedState.currentDispatchListenerRecord = null;
    defaultPreventedState.currentTarget = null;
  }
}

function finishDispatchQueueCanaryEventContext(canaryEventContext) {
  if (canaryEventContext === null) {
    return;
  }

  resetDispatchQueueCanaryEventAfterListener(canaryEventContext);
}

function shouldSkipDispatchListenerForPropagationStop(
  listenerRecord,
  previousInstance,
  canaryEventContext
) {
  if (canaryEventContext === null) {
    return false;
  }
  if (canaryEventContext.propagationState === null) {
    return false;
  }

  return (
    canaryEventContext.propagationState.propagationStopped &&
    listenerRecord.targetInst !== previousInstance
  );
}

function shouldSkipDispatchListenerForNativeStopImmediatePropagation(
  listenerRecord,
  canaryEventContext
) {
  if (canaryEventContext === null) {
    return false;
  }

  const propagationState = canaryEventContext.propagationState;
  if (propagationState === null) {
    return false;
  }
  return (
    propagationState.enableNativeStopImmediatePropagationDiagnostics &&
    propagationState.nativeImmediatePropagationStopped &&
    listenerRecord !==
      propagationState.nativeStopImmediatePropagationSourceListenerRecord
  );
}

function createDispatchPropagationStopDiagnosticRecord({
  action,
  dispatchQueueEntry,
  dispatchRecord,
  listenerRecord,
  propagationState,
  skipped
}) {
  return Object.freeze({
    action,
    blockedReason: PROPAGATION_STOP_DIAGNOSTIC_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: listenerRecord.currentTarget,
    diagnosticOnly: true,
    dispatchPathIndex: listenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind: dispatchQueueEntry.kind,
    dispatchRecordKind: dispatchRecord.kind,
    domEventName: listenerRecord.domEventName,
    kind: DISPATCH_PROPAGATION_STOP_DIAGNOSTIC_RECORD_KIND,
    nativeStopPropagationCallCount:
      propagationState.nativeStopPropagationCallCount,
    phase: listenerRecord.phase,
    propagationSkippedListener: skipped,
    propagationStopCallCount:
      propagationState.stopPropagationCallCount,
    propagationStopped: propagationState.propagationStopped,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: listenerRecord.registrationName,
    status: PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS,
    stoppedByCurrentTarget:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.currentTarget,
    stoppedByDispatchPathIndex:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.dispatchPathIndex,
    stoppedByPhase:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.phase,
    stoppedByRegistrationName:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.registrationName,
    stoppedByTargetInst:
      propagationState.stopSourceListenerRecord === null
        ? null
        : propagationState.stopSourceListenerRecord.targetInst,
    listenerQueueRelationToStopSource:
      getListenerQueueRelationToSource(
        listenerRecord,
        propagationState.stopSourceListenerRecord
      ),
    sameTargetAsStopSource:
      propagationState.stopSourceListenerRecord !== null &&
      propagationState.stopSourceListenerRecord.targetInst ===
        listenerRecord.targetInst,
    syntheticEventCount: 0,
    targetInst: listenerRecord.targetInst
  });
}

function createDispatchDefaultPreventedDiagnosticRecord({
  action,
  dispatchQueueEntry,
  dispatchRecord,
  listenerRecord,
  defaultPreventedState
}) {
  const sourceListenerRecord =
    defaultPreventedState.preventDefaultSourceListenerRecord;
  const nativeDefaultPrevented = getNativeEventDefaultPrevented(
    defaultPreventedState.nativeEvent
  );
  const nativePreventDefaultCallCount =
    getNativeEventPreventDefaultDiagnosticCallCount(
      defaultPreventedState.nativeEvent
    );

  return Object.freeze({
    action,
    blockedReason: DEFAULT_PREVENTED_DIAGNOSTIC_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: listenerRecord.currentTarget,
    defaultPrevented: defaultPreventedState.defaultPrevented,
    diagnosticOnly: true,
    dispatchPathIndex: listenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind: dispatchQueueEntry.kind,
    dispatchRecordKind: dispatchRecord.kind,
    domEventName: listenerRecord.domEventName,
    isDefaultPrevented: defaultPreventedState.defaultPrevented,
    kind: DISPATCH_DEFAULT_PREVENTED_DIAGNOSTIC_RECORD_KIND,
    nativeDefaultPrevented,
    nativeEventPreventDefaultCallCount: nativePreventDefaultCallCount,
    phase: listenerRecord.phase,
    preventDefaultCallCount:
      defaultPreventedState.preventDefaultCallCount,
    preventedByCurrentTarget:
      sourceListenerRecord === null ? null : sourceListenerRecord.currentTarget,
    preventedByDispatchPathIndex:
      sourceListenerRecord === null
        ? null
        : sourceListenerRecord.dispatchPathIndex,
    preventedByPhase:
      sourceListenerRecord === null ? null : sourceListenerRecord.phase,
    preventedByRegistrationName:
      sourceListenerRecord === null
        ? null
        : sourceListenerRecord.registrationName,
    preventedByTargetInst:
      sourceListenerRecord === null ? null : sourceListenerRecord.targetInst,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: listenerRecord.registrationName,
    status: PRIVATE_DEFAULT_PREVENTED_DIAGNOSTIC_STATUS,
    syntheticEventCount: 0,
    targetInst: listenerRecord.targetInst
  });
}

function createDispatchNativeStopImmediatePropagationDiagnosticRecord({
  action,
  dispatchQueueEntry,
  dispatchRecord,
  listenerRecord,
  propagationState,
  skipped
}) {
  const sourceListenerRecord =
    propagationState.nativeStopImmediatePropagationSourceListenerRecord;
  return Object.freeze({
    action,
    blockedReason: NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: listenerRecord.currentTarget,
    diagnosticOnly: true,
    dispatchPathIndex: listenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind: dispatchQueueEntry.kind,
    dispatchRecordKind: dispatchRecord.kind,
    domEventName: listenerRecord.domEventName,
    kind: DISPATCH_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_RECORD_KIND,
    listenerQueueRelationToStopSource:
      getListenerQueueRelationToSource(listenerRecord, sourceListenerRecord),
    nativeImmediatePropagationStopped:
      propagationState.nativeImmediatePropagationStopped,
    nativeStopImmediatePropagationCallCount:
      propagationState.nativeStopImmediatePropagationCallCount,
    nativeStopImmediatePropagationNativeCallCount:
      propagationState.nativeStopImmediatePropagationNativeCallCount,
    nativeStopImmediatePropagationSkippedListener: skipped,
    phase: listenerRecord.phase,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: listenerRecord.registrationName,
    sameTargetAsStopSource:
      sourceListenerRecord !== null &&
      sourceListenerRecord.targetInst === listenerRecord.targetInst,
    status: PRIVATE_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_STATUS,
    stoppedByCurrentTarget:
      sourceListenerRecord === null ? null : sourceListenerRecord.currentTarget,
    stoppedByDispatchPathIndex:
      sourceListenerRecord === null
        ? null
        : sourceListenerRecord.dispatchPathIndex,
    stoppedByPhase:
      sourceListenerRecord === null ? null : sourceListenerRecord.phase,
    stoppedByRegistrationName:
      sourceListenerRecord === null
        ? null
        : sourceListenerRecord.registrationName,
    stoppedByTargetInst:
      sourceListenerRecord === null ? null : sourceListenerRecord.targetInst,
    syntheticEventCount: 0,
    targetInst: listenerRecord.targetInst
  });
}

function getListenerQueueRelationToSource(listenerRecord, sourceListenerRecord) {
  if (sourceListenerRecord === null) {
    return 'unknown';
  }
  if (sourceListenerRecord.targetInst === listenerRecord.targetInst) {
    return 'same-target';
  }
  if (
    typeof sourceListenerRecord.dispatchPathIndex === 'number' &&
    typeof listenerRecord.dispatchPathIndex === 'number'
  ) {
    return listenerRecord.dispatchPathIndex >
      sourceListenerRecord.dispatchPathIndex
      ? 'ancestor'
      : 'descendant';
  }
  return 'different-target';
}

function createDispatchListenerErrorRouteRecord(
  invocationRecord,
  errorRouteIndex
) {
  const invocationPayload =
    getDispatchListenerInvocationCanaryRecordPayload(invocationRecord);
  const record = Object.freeze({
    blockedReason: LISTENER_ERROR_ROUTING_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: invocationRecord.currentTarget,
    diagnosticOnly: true,
    dispatchPathIndex: invocationRecord.dispatchPathIndex,
    domEventName: invocationRecord.domEventName,
    errorReported: false,
    errorRouteIndex,
    errorRouteTarget: 'reportGlobalError',
    exposesError: false,
    kind: DISPATCH_LISTENER_ERROR_ROUTE_RECORD_KIND,
    listenerErrorCaptured: invocationRecord.listenerErrorCaptured,
    nativeEventType: invocationRecord.nativeEventType,
    phase: invocationRecord.phase,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: invocationRecord.registrationName,
    status: PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS,
    syntheticEventCount: 0,
    targetInst: invocationRecord.targetInst
  });

  dispatchListenerErrorRouteRecordPayloads.set(
    record,
    Object.freeze({
      error: invocationPayload === null ? null : invocationPayload.error,
      invocationPayload,
      invocationRecord
    })
  );

  return record;
}

function createPortalEventOwnerRootGateRecord(
  targetDispatchPathRecord,
  options
) {
  const normalizedDispatchPathRecord =
    assertPortalEventOwnerRootDispatchPathRecord(targetDispatchPathRecord);
  const normalizedOptions =
    normalizePortalEventOwnerRootGateOptions(options);
  const ownerRoot = normalizedOptions.ownerRoot;
  const entries = normalizedDispatchPathRecord.entries;
  let rootOwnerMatchCount = 0;
  let rootOwnerMismatchCount = 0;

  for (const entry of entries) {
    if (entry.rootOwner === ownerRoot) {
      rootOwnerMatchCount++;
    } else {
      rootOwnerMismatchCount++;
    }
  }

  const ownerRootMatchesTargetRoot =
    normalizedDispatchPathRecord.rootOwner === ownerRoot;
  if (
    !ownerRootMatchesTargetRoot ||
    rootOwnerMismatchCount !== 0 ||
    entries.length === 0
  ) {
    throw createPluginEventSystemError(
      'Portal event owner-root diagnostics require every dispatch path entry to belong to the portal owner root.',
      INVALID_PORTAL_EVENT_OWNER_ROOT_GATE_CODE
    );
  }

  const targetNode =
    normalizedDispatchPathRecord.targetHostInstanceNode ||
    normalizedDispatchPathRecord.targetNode ||
    null;
  const portalOwnerRootEventPath = createPortalOwnerRootEventPath(
    normalizedDispatchPathRecord,
    ownerRoot
  );
  const portalContainerPathDiagnostic = createPortalContainerPathDiagnostic(
    normalizedOptions.portalContainer,
    normalizedOptions.rootContainer,
    targetNode,
    entries,
    ownerRoot
  );
  const portalContainerPath = portalContainerPathDiagnostic.record;
  const portalContainerContainsTarget = isInclusiveAncestor(
    normalizedOptions.portalContainer,
    targetNode
  );
  const rootContainerContainsTarget = isInclusiveAncestor(
    normalizedOptions.rootContainer,
    targetNode
  );
  const portalContainerRootBoundary =
    createPortalContainerRootBoundaryDiagnostic(
      normalizedDispatchPathRecord,
      normalizedOptions.portalContainer,
      ownerRoot
    );
  const record = Object.freeze({
    blockedReason: PORTAL_EVENT_BUBBLING_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    compatibilityClaimed: false,
    diagnosticOnly: true,
    dispatchPathRootOwnerMatchCount: rootOwnerMatchCount,
    dispatchPathRootOwnerMismatchCount: rootOwnerMismatchCount,
    domEventName: normalizedOptions.domEventName,
    eventDispatch: false,
    hostFiberPath: Object.freeze(normalizedOptions.hostFiberPath.slice()),
    kind: PORTAL_EVENT_OWNER_ROOT_GATE_RECORD_KIND,
    listenerInvocationCount: 0,
    ownerRootInfo: Object.freeze(describePortalOwnerRoot(ownerRoot)),
    ownerRootMatchesTargetRoot,
    ownerRootRequired: true,
    portalContainerContainsTarget,
    portalContainerInfo:
      normalizedOptions.portalContainer === null
        ? null
        : Object.freeze(describeContainer(normalizedOptions.portalContainer)),
    portalContainerIsRootContainer:
      normalizedOptions.portalContainer !== null &&
      normalizedOptions.portalContainer === normalizedOptions.rootContainer,
    portalContainerListenerDispatchBlocked: true,
    portalContainerMatchesDispatchRootBoundary:
      portalContainerRootBoundary.portalContainerMatchesDispatchRootBoundary,
    portalContainerOwnedBySecondaryRoot:
      portalContainerRootBoundary.portalContainerOwnedBySecondaryRoot,
    portalContainerPath,
    portalContainerPathLength: portalContainerPath.length,
    portalContainerPathStatus: portalContainerPath.status,
    portalContainerPathRootOwnerMatchCount:
      portalContainerPath.rootOwnerMatchCount,
    portalContainerPathRootOwnerMismatchCount:
      portalContainerPath.rootOwnerMismatchCount,
    portalContainerRootBoundary,
    portalContainerRootBoundaryStatus:
      portalContainerRootBoundary.containerRootBoundaryStatus,
    portalContainerRootOwnerMatchesPortalOwner:
      portalContainerRootBoundary.portalContainerRootOwnerMatchesPortalOwner,
    portalContainerRootOwnerPresent:
      portalContainerRootBoundary.portalContainerRootOwnerPresent,
    portalContainerNestedInRootContainer:
      portalContainerPath.portalContainerNestedInRootContainer,
    portalEventPathDiagnostic: true,
    portalKey: normalizedOptions.portalKey,
    portalOwnerRootEventPath,
    portalOwnerRootEventPathLength: portalOwnerRootEventPath.length,
    portalOwnerRootEventPathStatus: normalizedDispatchPathRecord.status,
    ownerRootPreservedAcrossPortalContainerRoot:
      portalContainerRootBoundary.ownerRootPreservedAcrossPortalContainerRoot,
    ownerRootPreservedAcrossSecondaryPortalRoot:
      portalContainerRootBoundary.ownerRootPreservedAcrossSecondaryPortalRoot,
    publicDispatchBlocked: true,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicPortalBubblingBlocked: true,
    publicPortalBubblingEnabled: false,
    publicRootBehaviorChanged: false,
    rootContainerContainsTarget,
    rootContainerInfo:
      normalizedOptions.rootContainer === null
        ? null
        : Object.freeze(describeContainer(normalizedOptions.rootContainer)),
    sourceGateId: normalizedOptions.sourceGateId,
    status: PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS,
    syntheticEventCount: 0,
    targetDispatchPathLength: normalizedDispatchPathRecord.length,
    targetDispatchPathStatus: normalizedDispatchPathRecord.status,
    targetHostInstanceStatus:
      normalizedDispatchPathRecord.targetHostInstanceStatus,
    targetInst: normalizedDispatchPathRecord.targetInst,
    targetInstStatus: normalizedDispatchPathRecord.targetInstStatus,
    targetNodeType:
      targetNode !== null && typeof targetNode.nodeType === 'number'
        ? targetNode.nodeType
        : null
  });

  portalEventOwnerRootGateRecordPayloads.set(
    record,
    Object.freeze({
      options: normalizedOptions.rawOptions,
      ownerRoot,
      portalContainer: normalizedOptions.portalContainer,
      portalContainerRootOwner:
        portalContainerRootBoundary.portalContainerRootOwner,
      portalContainerPathNodes: portalContainerPathDiagnostic.nodes,
      rootContainer: normalizedOptions.rootContainer,
      targetDispatchPathEntries: entries,
      targetDispatchPathRecord: normalizedDispatchPathRecord,
      targetNode
    })
  );

  return record;
}

function createFocusBlurEventBlockerGateFromDispatchRecords(
  dispatchRecords,
  options
) {
  const normalizedDispatchRecords =
    normalizeFocusBlurEventBlockerDispatchRecords(dispatchRecords);
  const normalizedOptions = normalizeFocusBlurEventBlockerGateOptions(
    options
  );
  const phaseRecords = Object.freeze(
    normalizedDispatchRecords.map((dispatchRecord, index) =>
      createFocusBlurEventBlockerPhaseRecord(dispatchRecord, index)
    )
  );
  const listenerMetadata = Object.freeze(
    phaseRecords.flatMap((phaseRecord) => phaseRecord.listenerMetadata)
  );
  const processingListenerMetadata = Object.freeze(
    phaseRecords.flatMap(
      (phaseRecord) => phaseRecord.processingListenerMetadata
    )
  );
  const targetCurrentTargetBlockers =
    createFocusBlurTargetCurrentTargetBlockers(phaseRecords);
  const observedNativeEventNames = Object.freeze(
    focusBlurNativeEventNames.filter((domEventName) =>
      phaseRecords.some((phaseRecord) => phaseRecord.domEventName === domEventName)
    )
  );
  const portalOwnerRoot = createFocusBlurPortalOwnerRootSummary(
    normalizedOptions.portalEventOwnerRootGateRecord
  );
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    blockedReason: FOCUS_BLUR_EVENT_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    bubblePhaseRecordCount: phaseRecords.filter(
      (phaseRecord) => phaseRecord.phase === 'bubble'
    ).length,
    capturePhaseRecordCount: phaseRecords.filter(
      (phaseRecord) => phaseRecord.phase === 'capture'
    ).length,
    compatibilityClaimed: false,
    diagnosticOnly: true,
    dispatchRecordCount: normalizedDispatchRecords.length,
    eventDispatch: false,
    eventObjectCreation: false,
    eventObjectCreationBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    focusBlurEventBlocker: true,
    focusDispatchRecordCount: phaseRecords.filter(
      (phaseRecord) => phaseRecord.domEventName === 'focusin'
    ).length,
    kind: FOCUS_BLUR_EVENT_BLOCKER_GATE_RECORD_KIND,
    listenerInstallation: false,
    listenerInstallationBlockedReason:
      FOCUS_BLUR_EVENT_LISTENER_INSTALLATION_BLOCKED_CODE,
    listenerInvocationCount: 0,
    listenerMetadata,
    listenerMetadataCount: listenerMetadata.length,
    nativeEventMappingCount: focusBlurNativeEventNames.length,
    nativeEventMappings: createFocusBlurNativeEventMappingRecords(),
    observedNativeEventNames,
    phaseRecordCount: phaseRecords.length,
    phaseRecords,
    portalOwnerRoot,
    portalOwnerRootAvailable: portalOwnerRoot.available,
    portalOwnerRootStatus: portalOwnerRoot.status,
    processingListenerMetadata,
    processingListenerMetadataCount: processingListenerMetadata.length,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    readOnly: true,
    status: PRIVATE_FOCUS_BLUR_EVENT_BLOCKER_GATE_STATUS,
    syntheticEventCount: 0,
    syntheticEventCreation: false,
    syntheticEventStatus: 'blocked-not-created',
    syntheticFocusEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticFocusEventCreation: false,
    targetCurrentTargetBlockerCount: targetCurrentTargetBlockers.length,
    targetCurrentTargetBlockers,
    willCreateSyntheticFocusEvents: false,
    willDispatchEvents: false,
    willInstallListeners: false,
    willInvokeListeners: false,
    blurDispatchRecordCount: phaseRecords.filter(
      (phaseRecord) => phaseRecord.domEventName === 'focusout'
    ).length
  });

  focusBlurEventBlockerGateRecordPayloads.set(
    record,
    Object.freeze({
      dispatchRecords: Object.freeze(normalizedDispatchRecords.slice()),
      listenerMetadata,
      options: normalizedOptions.rawOptions,
      phaseRecords,
      portalEventOwnerRootGateRecord:
        normalizedOptions.portalEventOwnerRootGateRecord,
      processingListenerMetadata,
      targetCurrentTargetBlockers
    })
  );

  return record;
}

function createFocusBlurEventBlockerPhaseRecord(dispatchRecord, index) {
  const normalizedDispatchRecord = assertEventDispatchRecord(dispatchRecord);
  const dispatchQueueEntries = Object.freeze(
    normalizedDispatchRecord.dispatchQueue.entries.map((entry) =>
      assertDispatchQueueEntryRecord(entry)
    )
  );
  const listenerRecords = Object.freeze(
    dispatchQueueEntries.flatMap((entry) => {
      const payload = getDispatchQueueEntryRecordPayload(entry);
      return payload === null ? [] : payload.listenerRecords;
    })
  );
  const processingListenerRecords = Object.freeze(
    dispatchQueueEntries.flatMap((entry) => {
      const payload = getDispatchQueueEntryRecordPayload(entry);
      return payload === null ? [] : payload.processingListenerRecords;
    })
  );
  const listenerMetadata = Object.freeze(
    listenerRecords.map((listenerRecord, listenerIndex) =>
      createFocusBlurEventBlockerListenerMetadata(
        listenerRecord,
        listenerIndex,
        index,
        'accumulation'
      )
    )
  );
  const processingListenerMetadata = Object.freeze(
    processingListenerRecords.map((listenerRecord, listenerIndex) =>
      createFocusBlurEventBlockerListenerMetadata(
        listenerRecord,
        listenerIndex,
        index,
        'processing'
      )
    )
  );
  const domEventName = normalizedDispatchRecord.domEventName;
  const registrationName = getSimpleEventRegistrationName(
    domEventName,
    normalizedDispatchRecord.eventSystemFlags
  );

  return Object.freeze({
    blockedReason: FOCUS_BLUR_EVENT_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTargetExposureBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    dispatchQueueEntryCount: dispatchQueueEntries.length,
    dispatchQueueLength: normalizedDispatchRecord.dispatchQueue.length,
    dispatchQueueListenerCount:
      normalizedDispatchRecord.dispatchQueue.listenerCount,
    domEventName,
    eventDispatch: false,
    eventObjectCreation: false,
    eventPriorityLabel: normalizedDispatchRecord.eventPriorityLabel,
    eventPriorityLane: normalizedDispatchRecord.eventPriorityLane,
    eventPriorityName: normalizedDispatchRecord.eventPriorityName,
    eventSystemFlags: normalizedDispatchRecord.eventSystemFlags,
    inCapturePhase: normalizedDispatchRecord.inCapturePhase,
    index,
    kind: FOCUS_BLUR_EVENT_BLOCKER_PHASE_RECORD_KIND,
    listenerInvocationCount: 0,
    listenerMetadata,
    listenerMetadataCount: listenerMetadata.length,
    nativeEventName: domEventName,
    nativeEventTarget: normalizedDispatchRecord.nativeEventTarget,
    nativeEventType: normalizedDispatchRecord.nativeEventType,
    phase: normalizedDispatchRecord.inCapturePhase ? 'capture' : 'bubble',
    processingListenerMetadata,
    processingListenerMetadataCount: processingListenerMetadata.length,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    reactName: getSimpleEventReactName(domEventName),
    registrationName,
    syntheticEventConstructor: 'SyntheticFocusEvent',
    syntheticEventCount: 0,
    syntheticEventCreation: false,
    syntheticEventStatus: 'blocked-not-created',
    syntheticEventType: getFocusBlurSyntheticEventType(domEventName),
    targetCurrentTargetBlockerStatus:
      listenerMetadata.length === 0
        ? 'blocked-no-current-target-listeners-recorded'
        : 'blocked-target-current-target-metadata-recorded',
    targetDispatchPathLength:
      normalizedDispatchRecord.targetDispatchPathLength,
    targetDispatchPathStatus:
      normalizedDispatchRecord.targetDispatchPathStatus,
    targetExposureBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    targetInst: normalizedDispatchRecord.targetInst,
    targetInstStatus: normalizedDispatchRecord.targetInstStatus,
    targetListenerFound: normalizedDispatchRecord.targetListenerFound,
    targetListenerLookupCount:
      normalizedDispatchRecord.targetListenerLookupCount,
    targetListenerLookupStatus:
      normalizedDispatchRecord.targetListenerLookupStatus,
    targetListenerRegistrationName:
      normalizedDispatchRecord.targetListenerRegistrationName,
    targetResolutionBlockedReason:
      normalizedDispatchRecord.targetResolutionBlockedReason,
    targetResolutionStatus: normalizedDispatchRecord.targetResolutionStatus,
    willCreateSyntheticFocusEvent: false,
    willDispatchEvent: false,
    willInvokeListeners: false,
    wrapperKind: normalizedDispatchRecord.wrapperKind
  });
}

function createFocusBlurEventBlockerListenerMetadata(
  dispatchListenerRecord,
  listenerIndex,
  phaseRecordIndex,
  order
) {
  const normalizedDispatchListenerRecord =
    assertDispatchListenerRecord(dispatchListenerRecord);

  return Object.freeze({
    blockedReason: FOCUS_BLUR_EVENT_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    currentTarget: normalizedDispatchListenerRecord.currentTarget,
    currentTargetExposureBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    dispatchPathIndex:
      normalizedDispatchListenerRecord.dispatchPathIndex,
    domEventName: normalizedDispatchListenerRecord.domEventName,
    exposesLatestProps: false,
    exposesListener: false,
    hostOwner: normalizedDispatchListenerRecord.hostOwner,
    inCapturePhase: normalizedDispatchListenerRecord.inCapturePhase,
    index: listenerIndex,
    kind: FOCUS_BLUR_EVENT_BLOCKER_LISTENER_RECORD_KIND,
    latestPropsStatus:
      normalizedDispatchListenerRecord.latestPropsStatus,
    listenerFound: normalizedDispatchListenerRecord.listenerFound,
    listenerInvocationCount: 0,
    listenerStatus: normalizedDispatchListenerRecord.listenerStatus,
    listenerType: normalizedDispatchListenerRecord.listenerType,
    nativeEventTarget: normalizedDispatchListenerRecord.nativeEventTarget,
    nativeEventType: normalizedDispatchListenerRecord.nativeEventType,
    order,
    phase: normalizedDispatchListenerRecord.phase,
    phaseRecordIndex,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName:
      normalizedDispatchListenerRecord.registrationName,
    rootOwner: normalizedDispatchListenerRecord.rootOwner,
    status: 'blocked-focus-blur-listener-metadata-recorded',
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetExposureBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    targetHostInstanceNode:
      normalizedDispatchListenerRecord.targetHostInstanceNode,
    targetHostInstanceStatus:
      normalizedDispatchListenerRecord.targetHostInstanceStatus,
    targetHostInstanceToken:
      normalizedDispatchListenerRecord.targetHostInstanceToken,
    targetInst: normalizedDispatchListenerRecord.targetInst,
    targetInstStatus: normalizedDispatchListenerRecord.targetInstStatus,
    willInvokeListener: false
  });
}

function createFocusBlurTargetCurrentTargetBlockers(phaseRecords) {
  return Object.freeze(
    phaseRecords.flatMap((phaseRecord) =>
      phaseRecord.listenerMetadata.map((listenerRecord) =>
        Object.freeze({
          blockedReason: FOCUS_BLUR_EVENT_BLOCKED_CODE,
          currentTarget: listenerRecord.currentTarget,
          currentTargetExposureBlockedReason:
            listenerRecord.currentTargetExposureBlockedReason,
          dispatchPathIndex: listenerRecord.dispatchPathIndex,
          domEventName: listenerRecord.domEventName,
          eventObjectCreation: false,
          listenerInvocationCount: 0,
          nativeEventTarget: listenerRecord.nativeEventTarget,
          phase: listenerRecord.phase,
          phaseRecordIndex: listenerRecord.phaseRecordIndex,
          registrationName: listenerRecord.registrationName,
          syntheticEventCount: 0,
          targetExposureBlockedReason:
            listenerRecord.targetExposureBlockedReason,
          targetInst: listenerRecord.targetInst
        })
      )
    )
  );
}

function createFocusBlurNativeEventMappingRecords() {
  return Object.freeze(
    focusBlurNativeEventNames.map((domEventName) =>
      Object.freeze({
        blockedReason: FOCUS_BLUR_EVENT_BLOCKED_CODE,
        browserDomEventCompatibilityClaimed: false,
        bubbleRegistrationName: getSimpleEventRegistrationName(
          domEventName,
          0
        ),
        captureRegistrationName: getSimpleEventRegistrationName(
          domEventName,
          IS_CAPTURE_PHASE
        ),
        domEventName,
        nativeEventName: domEventName,
        publicDispatchEnabled: false,
        reactName: getSimpleEventReactName(domEventName),
        syntheticEventConstructor: 'SyntheticFocusEvent',
        syntheticEventCreation: false,
        syntheticEventStatus: 'blocked-not-created',
        syntheticEventType: getFocusBlurSyntheticEventType(domEventName)
      })
    )
  );
}

function createFocusBlurPortalOwnerRootSummary(
  portalEventOwnerRootGateRecord
) {
  if (portalEventOwnerRootGateRecord === null) {
    return Object.freeze({
      available: false,
      blockedReason: null,
      dispatchPathRootOwnerMatchCount: 0,
      dispatchPathRootOwnerMismatchCount: 0,
      ownerRootMatchesTargetRoot: false,
      ownerRootPreservedAcrossPortalContainerRoot: false,
      ownerRootPreservedAcrossSecondaryPortalRoot: false,
      portalContainerContainsTarget: false,
      portalContainerMatchesDispatchRootBoundary: false,
      portalContainerOwnedBySecondaryRoot: false,
      portalContainerRootBoundaryStatus:
        'unavailable-no-portal-owner-root-gate',
      portalContainerRootOwnerMatchesPortalOwner: null,
      portalContainerRootOwnerPresent: false,
      publicPortalBubblingEnabled: false,
      recordKind: null,
      rootContainerContainsTarget: false,
      status: 'unavailable-no-portal-owner-root-gate',
      targetDispatchPathLength: 0,
      targetDispatchPathStatus: 'unavailable-no-portal-owner-root-gate',
      targetInstStatus: 'not-applicable'
    });
  }

  return Object.freeze({
    available: true,
    blockedReason: portalEventOwnerRootGateRecord.blockedReason,
    dispatchPathRootOwnerMatchCount:
      portalEventOwnerRootGateRecord.dispatchPathRootOwnerMatchCount,
    dispatchPathRootOwnerMismatchCount:
      portalEventOwnerRootGateRecord.dispatchPathRootOwnerMismatchCount,
    ownerRootMatchesTargetRoot:
      portalEventOwnerRootGateRecord.ownerRootMatchesTargetRoot,
    ownerRootPreservedAcrossPortalContainerRoot:
      portalEventOwnerRootGateRecord.ownerRootPreservedAcrossPortalContainerRoot,
    ownerRootPreservedAcrossSecondaryPortalRoot:
      portalEventOwnerRootGateRecord.ownerRootPreservedAcrossSecondaryPortalRoot,
    portalContainerContainsTarget:
      portalEventOwnerRootGateRecord.portalContainerContainsTarget,
    portalContainerMatchesDispatchRootBoundary:
      portalEventOwnerRootGateRecord.portalContainerMatchesDispatchRootBoundary,
    portalContainerOwnedBySecondaryRoot:
      portalEventOwnerRootGateRecord.portalContainerOwnedBySecondaryRoot,
    portalContainerRootBoundaryStatus:
      portalEventOwnerRootGateRecord.portalContainerRootBoundaryStatus,
    portalContainerRootOwnerMatchesPortalOwner:
      portalEventOwnerRootGateRecord.portalContainerRootOwnerMatchesPortalOwner,
    portalContainerRootOwnerPresent:
      portalEventOwnerRootGateRecord.portalContainerRootOwnerPresent,
    publicPortalBubblingEnabled:
      portalEventOwnerRootGateRecord.publicPortalBubblingEnabled,
    recordKind: portalEventOwnerRootGateRecord.kind,
    rootContainerContainsTarget:
      portalEventOwnerRootGateRecord.rootContainerContainsTarget,
    status: portalEventOwnerRootGateRecord.status,
    targetDispatchPathLength:
      portalEventOwnerRootGateRecord.targetDispatchPathLength,
    targetDispatchPathStatus:
      portalEventOwnerRootGateRecord.targetDispatchPathStatus,
    targetInstStatus: portalEventOwnerRootGateRecord.targetInstStatus
  });
}

function createPrivateFocusBlurEventDispatchExecutionRecord(
  dispatchRecords,
  listenerQueueEntryRecord,
  options
) {
  const queueEntryPayload = getPrivateEventListenerQueueEntryPayload(
    listenerQueueEntryRecord
  );
  if (queueEntryPayload === null || queueEntryPayload.active !== true) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution requires an active accepted private listener queue entry record.',
      'stale-listener-record'
    );
  }
  if (!focusBlurNativeEventNameSet.has(queueEntryPayload.domEventName)) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution only accepts focusin/focusout listener queue entries.',
      'unsupported-event-type'
    );
  }

  const normalizedOptions =
    normalizePrivateFocusBlurEventDispatchExecutionOptions(options);
  const match =
    findPrivateFocusBlurEventDispatchExecutionListenerRecordForQueueEntry(
      normalizeDispatchRecordList(dispatchRecords),
      listenerQueueEntryRecord,
      normalizedOptions.useProcessingOrder
    );
  if (match === null) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution could not route the accepted listener record through the focus/blur dispatch queue.',
      'accepted-listener-not-on-dispatch-path'
    );
  }

  return invokePrivateFocusBlurEventDispatchExecutionRecord(
    match.dispatchRecord,
    match.dispatchListenerRecord,
    {
      portalEventOwnerRootGateRecord:
        normalizedOptions.portalEventOwnerRootGateRecord,
      useProcessingOrder: normalizedOptions.useProcessingOrder
    }
  );
}

function invokePrivateFocusBlurEventDispatchExecutionRecord(
  dispatchRecord,
  dispatchListenerRecord,
  options
) {
  const normalizedDispatchRecord =
    assertPrivateFocusBlurEventDispatchExecutionDispatchRecord(
      dispatchRecord
    );
  const normalizedOptions =
    normalizePrivateFocusBlurEventDispatchExecutionOptions(options);
  const normalizedListenerRecord =
    assertPrivateFocusBlurEventDispatchExecutionListenerRecord(
      dispatchListenerRecord,
      normalizedDispatchRecord
    );
  const freshness =
    assertFreshPrivateFocusBlurEventDispatchExecutionListenerRecord(
      normalizedListenerRecord
    );
  const selection =
    findPrivateFocusBlurEventDispatchExecutionListenerSelection(
      normalizedDispatchRecord,
      normalizedListenerRecord
    );
  const portalOwnerRoot =
    validatePrivateFocusBlurEventDispatchExecutionPortalOwnerRootGate(
      normalizedDispatchRecord,
      normalizedOptions.portalEventOwnerRootGateRecord
    );
  const invocationRecord = invokeDispatchListenerRecordForCanary(
    normalizedListenerRecord,
    {
      dispatchQueueEntry: selection.dispatchQueueEntry,
      dispatchRecord: normalizedDispatchRecord,
      listenerIndex: selection.listenerIndex,
      selectedFromProcessingOrder: selection.selectedFromProcessingOrder
    }
  );
  const syntheticEventType = getFocusBlurSyntheticEventType(
    normalizedDispatchRecord.domEventName
  );
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    canaryEventKind: DISPATCH_LISTENER_CANARY_EVENT_KIND,
    compatibilityClaimed: false,
    currentTarget: normalizedListenerRecord.currentTarget,
    dispatchPathIndex: normalizedListenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind: selection.dispatchQueueEntry.kind,
    dispatchRecordKind: normalizedDispatchRecord.kind,
    domEventName: normalizedDispatchRecord.domEventName,
    eventDispatch: false,
    eventObjectCreation: false,
    eventPriority: normalizedDispatchRecord.eventPriority,
    eventPriorityLabel: normalizedDispatchRecord.eventPriorityLabel,
    eventPriorityLane: normalizedDispatchRecord.eventPriorityLane,
    eventPriorityName: normalizedDispatchRecord.eventPriorityName,
    eventSystemFlags: normalizedDispatchRecord.eventSystemFlags,
    extractionRecordKind: normalizedDispatchRecord.extractionRecord.kind,
    fakeDomEventDispatchExecution: true,
    focusBlurEventDispatchExecution: true,
    inCapturePhase: normalizedDispatchRecord.inCapturePhase,
    invocationRecordKind: invocationRecord.kind,
    invocationStatus: invocationRecord.invocationStatus,
    kind: PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND,
    listenerIndex: selection.listenerIndex,
    listenerInvocationCount: invocationRecord.listenerInvocationCount,
    listenerQueueIndex: normalizedListenerRecord.listenerQueueIndex,
    listenerQueueKey: normalizedListenerRecord.listenerQueueKey,
    listenerQueueRecordKind:
      normalizedListenerRecord.listenerQueueRecordKind,
    listenerStatus: normalizedListenerRecord.listenerStatus,
    listenerType: normalizedListenerRecord.listenerType,
    nativeEventTarget: normalizedDispatchRecord.nativeEventTarget,
    nativeEventType: normalizedDispatchRecord.nativeEventType,
    phase: normalizedListenerRecord.phase,
    pluginName: selection.dispatchQueueEntry.pluginName,
    portalOwnerRoot,
    portalOwnerRootAvailable: portalOwnerRoot.available,
    portalContainerMatchesDispatchRootBoundary:
      portalOwnerRoot.portalContainerMatchesDispatchRootBoundary,
    portalContainerOwnedBySecondaryRoot:
      portalOwnerRoot.portalContainerOwnedBySecondaryRoot,
    ownerRootPreservedAcrossPortalContainerRoot:
      portalOwnerRoot.ownerRootPreservedAcrossPortalContainerRoot,
    ownerRootPreservedAcrossSecondaryPortalRoot:
      portalOwnerRoot.ownerRootPreservedAcrossSecondaryPortalRoot,
    packageCompatibilityClaimed: false,
    pluginDispatchMetadataSourceOwned: true,
    privateListenerInvoked: invocationRecord.listenerInvocationCount === 1,
    privateListenerQueue: true,
    publicDispatchBlocked: true,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicEventCompatibilityClaimed: false,
    publicPackageCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    publicSyntheticEventCompatibilityClaimed: false,
    reactName: getSimpleEventReactName(normalizedDispatchRecord.domEventName),
    registrationName: normalizedListenerRecord.registrationName,
    rootOwner: normalizedListenerRecord.rootOwner,
    selectedFromProcessingOrder: selection.selectedFromProcessingOrder,
    sourceOwnedPluginDispatchMetadata: true,
    status: PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCompatibilityClaimed: false,
    syntheticEventConstructor: 'SyntheticFocusEvent',
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    syntheticEventType,
    syntheticFocusEventCreation: false,
    targetInst: normalizedDispatchRecord.targetInst,
    targetInstStatus: normalizedDispatchRecord.targetInstStatus,
    targetListenerRecordTargetInst: normalizedListenerRecord.targetInst,
    willCreateSyntheticFocusEvent: false,
    willDispatchPublicEvent: false,
    willInvokeListeners: false,
    willInvokePublicListeners: false
  });

  privateFocusBlurEventDispatchExecutionPayloads.set(
    record,
    Object.freeze({
      dispatchListenerRecord: normalizedListenerRecord,
      dispatchQueueEntry: selection.dispatchQueueEntry,
      dispatchRecord: normalizedDispatchRecord,
      invocationRecord,
      listener: freshness.listenerPayload.listener,
      listenerQueueEntryPayload: freshness.queueEntryPayload,
      listenerQueueEntryRecord: freshness.queueEntryRecord,
      options: normalizedOptions.rawOptions,
      portalEventOwnerRootGateRecord:
        normalizedOptions.portalEventOwnerRootGateRecord
    })
  );

  return record;
}

function createPrivateClickEventDelegationDispatchGate(
  dispatchRecords,
  listenerQueueEntryRecord,
  options
) {
  const queueEntryPayload = getPrivateEventListenerQueueEntryPayload(
    listenerQueueEntryRecord
  );
  if (queueEntryPayload === null || queueEntryPayload.active !== true) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch requires an active accepted private listener queue entry record.',
      'stale-listener-record'
    );
  }
  if (queueEntryPayload.domEventName !== 'click') {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch only accepts click listener queue entries.',
      'unsupported-event-type'
    );
  }

  const normalizedOptions =
    normalizePrivateClickEventDelegationDispatchGateOptions(options);
  const useProcessingOrder =
    isObjectLike(options) && options.useProcessingOrder === true;
  const match =
    findPrivateClickEventDelegationDispatchListenerRecordForQueueEntry(
      normalizeDispatchRecordList(dispatchRecords),
      listenerQueueEntryRecord,
      useProcessingOrder
    );
  if (match === null) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch could not route the accepted listener record through the click dispatch queue.',
      'accepted-listener-not-on-dispatch-path'
    );
  }

  return invokePrivateClickEventDelegationDispatchGate(
    match.dispatchRecord,
    match.dispatchListenerRecord,
    {
      portalEventOwnerRootGateRecord:
        normalizedOptions.portalEventOwnerRootGateRecord
    }
  );
}

function invokePrivateClickEventDelegationDispatchGate(
  dispatchRecord,
  dispatchListenerRecord,
  options
) {
  const normalizedDispatchRecord =
    assertPrivateClickEventDelegationDispatchRecord(dispatchRecord);
  const normalizedOptions =
    normalizePrivateClickEventDelegationDispatchGateOptions(options);
  const normalizedListenerRecord =
    assertPrivateClickEventDelegationDispatchListenerRecord(
      dispatchListenerRecord,
      normalizedDispatchRecord
    );
  const freshness =
    assertFreshPrivateClickEventDelegationListenerRecord(
      normalizedListenerRecord
    );
  const selection =
    findPrivateClickEventDelegationDispatchListenerSelection(
      normalizedDispatchRecord,
      normalizedListenerRecord
    );
  const portalOwnerRoot =
    validatePrivateClickEventDelegationPortalOwnerRootGate(
      normalizedDispatchRecord,
      normalizedOptions.portalEventOwnerRootGateRecord
    );
  const invocationRecord = invokeDispatchListenerRecordForCanary(
    normalizedListenerRecord,
    {
      dispatchQueueEntry: selection.dispatchQueueEntry,
      dispatchRecord: normalizedDispatchRecord,
      listenerIndex: selection.listenerIndex,
      selectedFromProcessingOrder: selection.selectedFromProcessingOrder
    }
  );
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    clickEventDelegationDispatchGate: true,
    compatibilityClaimed: false,
    currentTarget: normalizedListenerRecord.currentTarget,
    dispatchPathIndex: normalizedListenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind: selection.dispatchQueueEntry.kind,
    dispatchRecordKind: normalizedDispatchRecord.kind,
    domEventName: 'click',
    eventDispatch: false,
    eventPriority: normalizedDispatchRecord.eventPriority,
    eventPriorityLabel: normalizedDispatchRecord.eventPriorityLabel,
    eventPriorityLane: normalizedDispatchRecord.eventPriorityLane,
    eventPriorityName: normalizedDispatchRecord.eventPriorityName,
    eventSystemFlags: normalizedDispatchRecord.eventSystemFlags,
    extractionRecordKind: normalizedDispatchRecord.extractionRecord.kind,
    inCapturePhase: normalizedDispatchRecord.inCapturePhase,
    invocationRecordKind: invocationRecord.kind,
    invocationStatus: invocationRecord.invocationStatus,
    kind: PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND,
    listenerIndex: selection.listenerIndex,
    listenerInvocationCount: invocationRecord.listenerInvocationCount,
    listenerQueueIndex: normalizedListenerRecord.listenerQueueIndex,
    listenerQueueKey: normalizedListenerRecord.listenerQueueKey,
    listenerQueueRecordKind:
      normalizedListenerRecord.listenerQueueRecordKind,
    listenerStatus: normalizedListenerRecord.listenerStatus,
    listenerType: normalizedListenerRecord.listenerType,
    nativeEventTarget: normalizedDispatchRecord.nativeEventTarget,
    nativeEventType: normalizedDispatchRecord.nativeEventType,
    phase: normalizedListenerRecord.phase,
    pluginName: selection.dispatchQueueEntry.pluginName,
    portalOwnerRoot,
    portalOwnerRootAvailable: portalOwnerRoot.available,
    portalOwnerRootStatus: portalOwnerRoot.status,
    portalContainerContainsTarget:
      portalOwnerRoot.portalContainerContainsTarget,
    portalContainerMatchesDispatchRootBoundary:
      portalOwnerRoot.portalContainerMatchesDispatchRootBoundary,
    portalContainerOwnedBySecondaryRoot:
      portalOwnerRoot.portalContainerOwnedBySecondaryRoot,
    portalContainerRootBoundaryStatus:
      portalOwnerRoot.portalContainerRootBoundaryStatus,
    portalContainerRootOwnerMatchesPortalOwner:
      portalOwnerRoot.portalContainerRootOwnerMatchesPortalOwner,
    portalContainerRootOwnerPresent:
      portalOwnerRoot.portalContainerRootOwnerPresent,
    ownerRootPreservedAcrossPortalContainerRoot:
      portalOwnerRoot.ownerRootPreservedAcrossPortalContainerRoot,
    ownerRootPreservedAcrossSecondaryPortalRoot:
      portalOwnerRoot.ownerRootPreservedAcrossSecondaryPortalRoot,
    publicPortalBubblingBlocked: true,
    publicPortalBubblingEnabled:
      portalOwnerRoot.publicPortalBubblingEnabled,
    rootContainerContainsTarget: portalOwnerRoot.rootContainerContainsTarget,
    privateListenerInvoked: invocationRecord.listenerInvocationCount === 1,
    privateListenerQueue: true,
    publicDispatchBlocked: true,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: normalizedListenerRecord.registrationName,
    rootOwner: normalizedListenerRecord.rootOwner,
    selectedFromProcessingOrder: selection.selectedFromProcessingOrder,
    status: PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetDispatchPathLength:
      normalizedDispatchRecord.targetDispatchPathLength,
    targetDispatchPathStatus:
      normalizedDispatchRecord.targetDispatchPathStatus,
    targetInst: normalizedDispatchRecord.targetInst,
    targetInstStatus: normalizedDispatchRecord.targetInstStatus,
    targetListenerRecordTargetInst: normalizedListenerRecord.targetInst,
    willDispatchPublicEvent: false,
    willInvokeListeners: false,
    willInvokePublicListeners: false
  });

  privateClickEventDelegationDispatchGatePayloads.set(
    record,
    Object.freeze({
      dispatchListenerRecord: normalizedListenerRecord,
      dispatchQueueEntry: selection.dispatchQueueEntry,
      dispatchRecord: normalizedDispatchRecord,
      invocationRecord,
      listener: freshness.listenerPayload.listener,
      listenerQueueEntryPayload: freshness.queueEntryPayload,
      listenerQueueEntryRecord: freshness.queueEntryRecord,
      options: normalizedOptions.rawOptions,
      portalEventOwnerRootGateRecord:
        normalizedOptions.portalEventOwnerRootGateRecord
    })
  );

  return record;
}

function findPrivateClickEventDelegationDispatchListenerRecordForQueueEntry(
  dispatchRecords,
  listenerQueueEntryRecord,
  useProcessingOrder
) {
  for (const dispatchRecord of dispatchRecords) {
    const normalizedDispatchRecord =
      assertPrivateClickEventDelegationDispatchRecord(dispatchRecord);
    for (const dispatchQueueEntry of normalizedDispatchRecord.dispatchQueue
      .entries) {
      const entryPayload =
        getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
      const listenerRecords =
        useProcessingOrder && entryPayload !== null
          ? entryPayload.processingListenerRecords
          : entryPayload === null
            ? []
            : entryPayload.listenerRecords;
      for (const dispatchListenerRecord of listenerRecords) {
        const listenerPayload =
          getDispatchListenerRecordPayload(dispatchListenerRecord);
        if (
          listenerPayload !== null &&
          listenerPayload.privateEventListenerQueueEntryRecord ===
            listenerQueueEntryRecord
        ) {
          return {
            dispatchListenerRecord,
            dispatchRecord: normalizedDispatchRecord
          };
        }
      }
    }
  }

  return null;
}

function getPrivateClickEventDelegationDispatchGatePayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return privateClickEventDelegationDispatchGatePayloads.get(record) || null;
}

function isPrivateClickEventDelegationDispatchGateRecord(record) {
  return getPrivateClickEventDelegationDispatchGatePayload(record) !== null;
}

function invokePrivateClickEventDelegationAcceptedListenerOrder(
  dispatchRecords,
  listenerQueueEntryRecords,
  options
) {
  const normalizedDispatchRecords = normalizeDispatchRecordList(
    dispatchRecords
  ).map((dispatchRecord) =>
    assertPrivateClickEventDelegationDispatchRecord(dispatchRecord)
  );
  if (normalizedDispatchRecords.length === 0) {
    throw createPrivateClickEventDelegationAcceptedListenerOrderError(
      'Private click event delegation accepted listener order requires at least one click dispatch record.',
      'missing-dispatch-records'
    );
  }

  const normalizedOptions =
    normalizePrivateClickEventDelegationAcceptedListenerOrderOptions(
      options
    );
  const acceptedListenerQueueEntryRecords =
    normalizePrivateClickEventDelegationAcceptedListenerQueueEntryRecords(
      listenerQueueEntryRecords
    );
  const targetRecordMetadata =
    validatePrivateClickEventDelegationAcceptedListenerOrderTargetRecord(
      normalizedDispatchRecords,
      normalizedOptions
    );
  const ownerRootMetadata =
    validatePrivateClickEventDelegationAcceptedListenerOrderOwnerRoots(
      normalizedDispatchRecords,
      acceptedListenerQueueEntryRecords
    );
  const selections =
    collectPrivateClickEventDelegationAcceptedListenerOrderSelections(
      normalizedDispatchRecords,
      acceptedListenerQueueEntryRecords
    );
  const invocationRecords = selections.map((selection) =>
    invokeDispatchListenerRecordForCanary(selection.dispatchListenerRecord, {
      dispatchQueueEntry: selection.dispatchQueueEntry,
      dispatchRecord: selection.dispatchRecord,
      listenerIndex: selection.listenerIndex,
      selectedFromProcessingOrder: true
    })
  );
  const acceptedListenerOrder = Object.freeze(
    selections.map((selection, index) => {
      const listenerRecord = selection.dispatchListenerRecord;
      return Object.freeze({
        currentTarget: listenerRecord.currentTarget,
        dispatchPathIndex: listenerRecord.dispatchPathIndex,
        dispatchRecordIndex: selection.dispatchRecordIndex,
        dispatchQueueEntryIndex: selection.dispatchQueueEntryIndex,
        index,
        listenerIndex: selection.listenerIndex,
        listenerQueueIndex: listenerRecord.listenerQueueIndex,
        listenerQueueKey: listenerRecord.listenerQueueKey,
        phase: listenerRecord.phase,
        registrationName: listenerRecord.registrationName,
        targetInst: listenerRecord.targetInst
      });
    })
  );
  const listenerInvocationCount = invocationRecords.reduce(
    (count, invocationRecord) =>
      count + invocationRecord.listenerInvocationCount,
    0
  );
  const targetDispatchPathLength =
    normalizedDispatchRecords[0].targetDispatchPathLength;
  const targetDispatchPathStatus =
    normalizedDispatchRecords[0].targetDispatchPathStatus;
  const targetInst = normalizedDispatchRecords[0].targetInst;
  const targetInstStatus = normalizedDispatchRecords[0].targetInstStatus;
  const record = Object.freeze({
    acceptedListenerCount: acceptedListenerQueueEntryRecords.length,
    acceptedListenerOrder,
    acceptedListenerOwnerRootMatchCount:
      ownerRootMetadata.acceptedListenerOwnerRootMatchCount,
    acceptedListenerOwnerRootMismatchCount:
      ownerRootMetadata.acceptedListenerOwnerRootMismatchCount,
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    clickEventDelegationAcceptedListenerOrder: true,
    compatibilityClaimed: false,
    dispatchRecordCount: normalizedDispatchRecords.length,
    dispatchRecordOwnerRootMatchCount:
      ownerRootMetadata.dispatchRecordOwnerRootMatchCount,
    dispatchRecordOwnerRootMismatchCount:
      ownerRootMetadata.dispatchRecordOwnerRootMismatchCount,
    domEventName: 'click',
    eventDispatch: false,
    invocationRecordCount: invocationRecords.length,
    kind:
      PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_RECORD_KIND,
    listenerInvocationCount,
    nestedDispatchPath: targetDispatchPathLength > 1,
    ownerRootPreserved: ownerRootMetadata.ownerRootPreserved,
    ownerRootRequired: ownerRootMetadata.ownerRootRequired,
    ownerRootStatus: ownerRootMetadata.status,
    phases: Object.freeze(
      acceptedListenerOrder.map((entry) => entry.phase)
    ),
    privateListenerQueue: true,
    publicDispatchBlocked: true,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationNames: Object.freeze(
      acceptedListenerOrder.map((entry) => entry.registrationName)
    ),
    rootRenderHostOutputActive:
      targetRecordMetadata.rootRenderHostOutputActive,
    rootRenderMetadataAvailable:
      targetRecordMetadata.rootRenderMetadataAvailable,
    rootRenderMetadataRequired:
      normalizedOptions.requireRootRenderMetadata,
    rootRenderMetadataStatus:
      targetRecordMetadata.rootRenderMetadataStatus,
    selectedFromProcessingOrder: true,
    status:
      PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetDispatchPathLength,
    targetDispatchPathOwnerRootPreserved:
      ownerRootMetadata.targetDispatchPathOwnerRootPreserved,
    targetDispatchPathStatus,
    targetInst,
    targetInstStatus,
    targetRecordAvailable: targetRecordMetadata.available,
    targetRecordKind: targetRecordMetadata.recordKind,
    targetRecordStatus: targetRecordMetadata.status,
    targetRootOwnerMatchCount:
      ownerRootMetadata.targetRootOwnerMatchCount,
    targetRootOwnerMismatchCount:
      ownerRootMetadata.targetRootOwnerMismatchCount,
    willDispatchPublicEvent: false,
    willInvokeListeners: false,
    willInvokePublicListeners: false
  });

  privateClickEventDelegationAcceptedListenerOrderPayloads.set(
    record,
    Object.freeze({
      acceptedListenerQueueEntryRecords: Object.freeze(
        acceptedListenerQueueEntryRecords.slice()
      ),
      dispatchListenerRecords: Object.freeze(
        selections.map((selection) => selection.dispatchListenerRecord)
      ),
      dispatchRecords: Object.freeze(normalizedDispatchRecords.slice()),
      invocationRecords: Object.freeze(invocationRecords.slice()),
      ownerRootMetadata,
      options: normalizedOptions.rawOptions,
      selections: Object.freeze(selections.slice()),
      targetRecord: normalizedOptions.targetRecord,
      targetRecordMetadata
    })
  );

  return record;
}

function getPrivateClickEventDelegationAcceptedListenerOrderPayload(
  record
) {
  if (!isObjectLike(record)) {
    return null;
  }

  return (
    privateClickEventDelegationAcceptedListenerOrderPayloads.get(record) ||
    null
  );
}

function isPrivateClickEventDelegationAcceptedListenerOrderRecord(
  record
) {
  return (
    getPrivateClickEventDelegationAcceptedListenerOrderPayload(record) !==
    null
  );
}

function invokeDispatchListenerRecordForCanary(dispatchListenerRecord, options) {
  const normalizedListenerRecord =
    assertDispatchListenerRecord(dispatchListenerRecord);
  const payload =
    getDispatchListenerRecordPayload(normalizedListenerRecord);
  const normalizedOptions = isObjectLike(options) ? options : {};
  const dispatchRecord =
    normalizedOptions.dispatchRecord === undefined
      ? null
      : assertEventDispatchRecord(normalizedOptions.dispatchRecord);
  const dispatchQueueEntry =
    normalizedOptions.dispatchQueueEntry === undefined
      ? null
      : assertDispatchQueueEntryRecord(normalizedOptions.dispatchQueueEntry);
  const selectedFromProcessingOrder =
    normalizedOptions.selectedFromProcessingOrder !== false;
  const listenerIndex = normalizeNonNegativeInteger(
    normalizedOptions.listenerIndex,
    0,
    'listenerIndex'
  );
  const canaryEventContext = isObjectLike(
    normalizedOptions.canaryEventContext
  )
    ? normalizedOptions.canaryEventContext
    : null;
  const propagationState =
    canaryEventContext === null
      ? null
      : canaryEventContext.propagationState;
  const defaultPreventedState =
    canaryEventContext === null
      ? null
      : canaryEventContext.defaultPreventedState;
  const propagationStoppedBeforeInvocation =
    propagationState !== null && propagationState.propagationStopped;
  const stopPropagationCallCountBefore =
    propagationState === null ? 0 : propagationState.stopPropagationCallCount;
  const defaultPreventedBeforeInvocation =
    defaultPreventedState !== null && defaultPreventedState.defaultPrevented;
  const preventDefaultCallCountBefore =
    getDefaultPreventedDiagnosticCallCount(defaultPreventedState);
  const nativeDefaultPreventedBeforeInvocation =
    defaultPreventedState !== null &&
    getNativeEventDefaultPrevented(defaultPreventedState.nativeEvent);
  const nativeEventPreventDefaultCallCountBeforeInvocation =
    defaultPreventedState === null
      ? 0
      : getNativeEventPreventDefaultDiagnosticCallCount(
          defaultPreventedState.nativeEvent
        );
  const nativeImmediatePropagationStoppedBeforeInvocation =
    propagationState !== null &&
    propagationState.nativeImmediatePropagationStopped;
  const nativeStopImmediatePropagationCallCountBefore =
    getNativeStopImmediatePropagationDiagnosticCallCount(propagationState);
  const nativeStopImmediatePropagationNativeCallCountBefore =
    propagationState === null
      ? 0
      : propagationState.nativeStopImmediatePropagationNativeCallCount;

  if (typeof payload.listener !== 'function') {
    return createSkippedSingleListenerInvocationCanaryRecord(
      dispatchRecord,
      dispatchQueueEntry,
      normalizedListenerRecord,
      {
        dispatchQueueEntryIndex: 0,
        listenerIndex,
        useProcessingOrder: selectedFromProcessingOrder
      },
      'missing-listener'
    );
  }

  const canaryEvent =
    canaryEventContext === null
      ? createDispatchListenerCanaryEvent(normalizedListenerRecord, payload)
      : canaryEventContext.canaryEvent;
  let currentTargetBeforeInvocation =
    canaryEventContext === null ? canaryEvent.currentTarget : null;
  let currentTargetDuringInvocation =
    canaryEventContext === null ? canaryEvent.currentTarget : null;
  let currentTargetAfterInvocation =
    canaryEventContext === null ? canaryEvent.currentTarget : null;
  let currentTargetResetAfterInvocation = false;
  let returnValue;
  let error = null;

  try {
    if (canaryEventContext !== null) {
      currentTargetBeforeInvocation =
        canaryEventContext.currentTargetState.currentTarget;
      prepareDispatchQueueCanaryEventForListener(
        canaryEventContext,
        normalizedListenerRecord
      );
      currentTargetDuringInvocation =
        canaryEventContext.currentTargetState.currentTarget;
    }
    returnValue = payload.listener.call(undefined, canaryEvent);
  } catch (thrownValue) {
    error = thrownValue;
    returnValue = undefined;
  } finally {
    if (canaryEventContext !== null) {
      updateNativeStopImmediatePropagationDiagnosticState(
        propagationState,
        nativeStopImmediatePropagationNativeCallCountBefore
      );
      resetDispatchQueueCanaryEventAfterListener(canaryEventContext);
      currentTargetAfterInvocation =
        canaryEventContext.currentTargetState.currentTarget;
      currentTargetResetAfterInvocation =
        currentTargetAfterInvocation === null;
    }
  }
  if (defaultPreventedState !== null) {
    syncDefaultPreventedDiagnosticStateFromNative(defaultPreventedState);
  }

  const defaultPreventedAfterInvocation =
    defaultPreventedState !== null && defaultPreventedState.defaultPrevented;
  const preventDefaultCallCountAfter =
    getDefaultPreventedDiagnosticCallCount(defaultPreventedState);
  const nativeDefaultPreventedAfterInvocation =
    defaultPreventedState !== null &&
    getNativeEventDefaultPrevented(defaultPreventedState.nativeEvent);
  const nativeEventPreventDefaultCallCountAfterInvocation =
    defaultPreventedState === null
      ? 0
      : getNativeEventPreventDefaultDiagnosticCallCount(
          defaultPreventedState.nativeEvent
        );

  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    canaryEventKind: DISPATCH_LISTENER_CANARY_EVENT_KIND,
    currentTarget: normalizedListenerRecord.currentTarget,
    currentTargetAfterInvocation,
    currentTargetBeforeInvocation,
    currentTargetDuringInvocation,
    currentTargetResetAfterInvocation,
    currentTargetResetDiagnosticStatus:
      currentTargetResetAfterInvocation === true
        ? PRIVATE_CURRENT_TARGET_PROGRESSION_DIAGNOSTIC_STATUS
        : 'not-applicable',
    defaultPreventedAfterInvocation,
    defaultPreventedBeforeInvocation,
    defaultPreventedDiagnosticEnabled:
      defaultPreventedState !== null &&
      defaultPreventedState.enableDefaultPreventedDiagnostics,
    defaultPreventedDiagnosticStatus:
      defaultPreventedState === null
        ? 'not-applicable'
        : PRIVATE_DEFAULT_PREVENTED_DIAGNOSTIC_STATUS,
    dispatchPathIndex: normalizedListenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind:
      dispatchQueueEntry === null ? null : dispatchQueueEntry.kind,
    dispatchQueueProcessed: false,
    dispatchRecordKind:
      dispatchRecord === null ? null : dispatchRecord.kind,
    domEventName: normalizedListenerRecord.domEventName,
    exposesCanaryEvent: false,
    exposesLatestProps: false,
    exposesListener: false,
    exposesNativeEvent: false,
    exposesSyntheticEvent: false,
    inCapturePhase: normalizedListenerRecord.inCapturePhase,
    invocationAttempted: true,
    invocationStatus:
      error === null
        ? 'invoked-single-listener'
        : 'captured-single-listener-error',
    kind: DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND,
    latestPropsStatus: normalizedListenerRecord.latestPropsStatus,
    listenerErrorCaptured: error !== null,
    listenerErrorRoutingBlockedReason:
      LISTENER_ERROR_ROUTING_BLOCKED_CODE,
    listenerErrorRoutingDiagnosticEnabled:
      normalizedOptions.listenerErrorRoutingDiagnosticsEnabled === true,
    listenerErrorRoutingStatus:
      error === null
        ? 'not-applicable'
        : normalizedOptions.listenerErrorRoutingDiagnosticsEnabled === true
          ? PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS
          : 'captured-without-routing-diagnostic',
    listenerIndex,
    listenerInvocationCount: 1,
    listenerReturnStatus:
      error === null ? describeReturnValue(returnValue) : 'not-applicable',
    listenerStatus: normalizedListenerRecord.listenerStatus,
    isDefaultPreventedAfterInvocation: defaultPreventedAfterInvocation,
    isDefaultPreventedBeforeInvocation: defaultPreventedBeforeInvocation,
    nativeDefaultPreventedAfterInvocation,
    nativeDefaultPreventedBeforeInvocation,
    nativeEventTarget: normalizedListenerRecord.nativeEventTarget,
    nativeEventPreventDefaultCallCountAfterInvocation:
      nativeEventPreventDefaultCallCountAfterInvocation,
    nativeEventPreventDefaultCallCountBeforeInvocation:
      nativeEventPreventDefaultCallCountBeforeInvocation,
    nativeEventPreventDefaultCallCountDelta:
      nativeEventPreventDefaultCallCountAfterInvocation -
      nativeEventPreventDefaultCallCountBeforeInvocation,
    nativeEventType: normalizedListenerRecord.nativeEventType,
    nativeImmediatePropagationStoppedAfterInvocation:
      propagationState !== null &&
      propagationState.nativeImmediatePropagationStopped,
    nativeImmediatePropagationStoppedBeforeInvocation,
    nativeStopImmediatePropagationCallCount:
      getNativeStopImmediatePropagationDiagnosticCallCount(propagationState),
    nativeStopImmediatePropagationCallCountDelta:
      getNativeStopImmediatePropagationDiagnosticCallCount(propagationState) -
      nativeStopImmediatePropagationCallCountBefore,
    nativeStopImmediatePropagationDiagnosticEnabled:
      propagationState !== null &&
      propagationState.enableNativeStopImmediatePropagationDiagnostics,
    nativeStopImmediatePropagationDiagnosticStatus:
      propagationState !== null &&
      propagationState.enableNativeStopImmediatePropagationDiagnostics
        ? PRIVATE_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_STATUS
        : 'not-applicable',
    nativeStopImmediatePropagationNativeCallCount:
      propagationState === null
        ? 0
        : propagationState.nativeStopImmediatePropagationNativeCallCount,
    nativeStopImmediatePropagationNativeCallCountDelta:
      propagationState === null
        ? 0
        : propagationState.nativeStopImmediatePropagationNativeCallCount -
          nativeStopImmediatePropagationNativeCallCountBefore,
    nativeStopImmediatePropagationSkipped: false,
    phase: normalizedListenerRecord.phase,
    propagationDiagnosticEnabled:
      propagationState !== null &&
      propagationState.enablePropagationStopDiagnostics,
    propagationSkipped: false,
    propagationStopCallCount:
      propagationState === null
        ? 0
        : propagationState.stopPropagationCallCount,
    propagationStopCallCountDelta:
      propagationState === null
        ? 0
        : propagationState.stopPropagationCallCount -
          stopPropagationCallCountBefore,
    propagationStopDiagnosticStatus:
      propagationState === null ||
      !propagationState.enablePropagationStopDiagnostics
        ? 'not-applicable'
        : PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS,
    propagationStoppedAfterInvocation:
      propagationState !== null && propagationState.propagationStopped,
    propagationStoppedBeforeInvocation,
    preventDefaultCallCount: preventDefaultCallCountAfter,
    preventDefaultCallCountDelta:
      preventDefaultCallCountAfter - preventDefaultCallCountBefore,
    preventDefaultInvoked:
      preventDefaultCallCountAfter > preventDefaultCallCountBefore,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: normalizedListenerRecord.registrationName,
    selectedFromProcessingOrder,
    status: PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetHostInstanceNode:
      normalizedListenerRecord.targetHostInstanceNode,
    targetHostInstanceToken:
      normalizedListenerRecord.targetHostInstanceToken,
    targetInst: normalizedListenerRecord.targetInst,
    targetInstStatus: normalizedListenerRecord.targetInstStatus,
    willInvokeListeners: false
  });

  dispatchListenerInvocationCanaryRecordPayloads.set(
    record,
    Object.freeze({
      canaryEvent,
      dispatchListenerRecord: normalizedListenerRecord,
      dispatchQueueEntry,
      dispatchRecord,
      error,
      latestProps: payload.latestProps,
      listener: payload.listener,
      nativeEvent: payload.nativeEvent,
      nativeEventTarget: payload.nativeEventTarget,
      pathEntry: payload.pathEntry,
      defaultPreventedState,
      propagationState,
      returnValue,
      targetListenerLookupRecord: payload.targetListenerLookupRecord
    })
  );

  return record;
}

function createSkippedSingleListenerInvocationCanaryRecord(
  dispatchRecord,
  dispatchQueueEntry,
  dispatchListenerRecord,
  options,
  reason,
  diagnosticState
) {
  const propagationState = isObjectLike(diagnosticState)
    ? diagnosticState
    : null;
  const skippedByPropagationStop = reason === 'propagation-stopped';
  const skippedByNativeStopImmediatePropagation =
    reason === 'native-stop-immediate-propagation';
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    canaryEventKind: DISPATCH_LISTENER_CANARY_EVENT_KIND,
    currentTarget:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.currentTarget,
    currentTargetAfterInvocation: null,
    currentTargetBeforeInvocation: null,
    currentTargetDuringInvocation: null,
    currentTargetResetAfterInvocation: false,
    currentTargetResetDiagnosticStatus: 'not-applicable',
    defaultPreventedAfterInvocation: false,
    defaultPreventedBeforeInvocation: false,
    defaultPreventedDiagnosticEnabled: false,
    defaultPreventedDiagnosticStatus: 'not-applicable',
    dispatchPathIndex:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind:
      dispatchQueueEntry === null ? null : dispatchQueueEntry.kind,
    dispatchQueueProcessed: false,
    dispatchRecordKind: dispatchRecord === null ? null : dispatchRecord.kind,
    domEventName:
      dispatchListenerRecord === null
        ? dispatchRecord === null
          ? null
          : dispatchRecord.domEventName
        : dispatchListenerRecord.domEventName,
    exposesCanaryEvent: false,
    exposesLatestProps: false,
    exposesListener: false,
    exposesNativeEvent: false,
    exposesSyntheticEvent: false,
    inCapturePhase:
      dispatchListenerRecord === null
        ? dispatchRecord !== null && dispatchRecord.inCapturePhase === true
        : dispatchListenerRecord.inCapturePhase,
    invocationAttempted: false,
    invocationStatus: 'skipped-' + reason,
    kind: DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND,
    latestPropsStatus:
      dispatchListenerRecord === null
        ? 'not-applicable'
        : dispatchListenerRecord.latestPropsStatus,
    listenerErrorCaptured: false,
    listenerIndex: options.listenerIndex,
    listenerInvocationCount: 0,
    listenerReturnStatus: 'not-applicable',
    listenerStatus:
      dispatchListenerRecord === null
        ? 'not-applicable'
        : dispatchListenerRecord.listenerStatus,
    isDefaultPreventedAfterInvocation: false,
    isDefaultPreventedBeforeInvocation: false,
    nativeDefaultPreventedAfterInvocation: false,
    nativeDefaultPreventedBeforeInvocation: false,
    nativeEventTarget:
      dispatchListenerRecord === null
        ? dispatchRecord === null
          ? null
          : dispatchRecord.nativeEventTarget
        : dispatchListenerRecord.nativeEventTarget,
    nativeEventPreventDefaultCallCountAfterInvocation: 0,
    nativeEventPreventDefaultCallCountBeforeInvocation: 0,
    nativeEventPreventDefaultCallCountDelta: 0,
    nativeEventType:
      dispatchListenerRecord === null
        ? dispatchRecord === null
          ? null
          : dispatchRecord.nativeEventType
        : dispatchListenerRecord.nativeEventType,
    nativeImmediatePropagationStoppedAfterInvocation:
      skippedByNativeStopImmediatePropagation,
    nativeImmediatePropagationStoppedBeforeInvocation:
      skippedByNativeStopImmediatePropagation,
    nativeStopImmediatePropagationCallCount:
      getNativeStopImmediatePropagationDiagnosticCallCount(propagationState),
    nativeStopImmediatePropagationCallCountDelta: 0,
    nativeStopImmediatePropagationDiagnosticEnabled:
      skippedByNativeStopImmediatePropagation,
    nativeStopImmediatePropagationDiagnosticStatus:
      skippedByNativeStopImmediatePropagation
        ? PRIVATE_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_STATUS
        : 'not-applicable',
    nativeStopImmediatePropagationNativeCallCount:
      propagationState === null
        ? 0
        : propagationState.nativeStopImmediatePropagationNativeCallCount,
    nativeStopImmediatePropagationNativeCallCountDelta: 0,
    nativeStopImmediatePropagationSkipped:
      skippedByNativeStopImmediatePropagation,
    phase:
      dispatchListenerRecord === null ? null : dispatchListenerRecord.phase,
    listenerErrorRoutingBlockedReason:
      LISTENER_ERROR_ROUTING_BLOCKED_CODE,
    listenerErrorRoutingDiagnosticEnabled: false,
    listenerErrorRoutingStatus: 'not-applicable',
    propagationDiagnosticEnabled: skippedByPropagationStop,
    propagationSkipped: skippedByPropagationStop,
    propagationStopCallCount:
      propagationState === null ? 0 : propagationState.stopPropagationCallCount,
    propagationStopCallCountDelta: 0,
    propagationStopDiagnosticStatus:
      skippedByPropagationStop
        ? PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS
        : 'not-applicable',
    propagationStoppedAfterInvocation: skippedByPropagationStop,
    propagationStoppedBeforeInvocation: skippedByPropagationStop,
    preventDefaultCallCount: 0,
    preventDefaultCallCountDelta: 0,
    preventDefaultInvoked: false,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.registrationName,
    selectedFromProcessingOrder: options.useProcessingOrder,
    status: PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS,
    syntheticEventBlockedReason: SYNTHETIC_EVENT_BLOCKED_CODE,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetHostInstanceNode:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.targetHostInstanceNode,
    targetHostInstanceToken:
      dispatchListenerRecord === null
        ? null
        : dispatchListenerRecord.targetHostInstanceToken,
    targetInst:
      dispatchListenerRecord === null ? null : dispatchListenerRecord.targetInst,
    targetInstStatus:
      dispatchListenerRecord === null
        ? 'not-applicable'
        : dispatchListenerRecord.targetInstStatus,
    willInvokeListeners: false
  });

  dispatchListenerInvocationCanaryRecordPayloads.set(
    record,
    Object.freeze({
      canaryEvent: null,
      dispatchListenerRecord,
      dispatchQueueEntry,
      dispatchRecord,
      error: null,
      latestProps: null,
      listener: null,
      nativeEvent: null,
      nativeEventTarget:
        dispatchListenerRecord === null
          ? dispatchRecord === null
            ? null
            : dispatchRecord.nativeEventTarget
          : dispatchListenerRecord.nativeEventTarget,
      pathEntry: null,
      defaultPreventedState: null,
      propagationState,
      returnValue: undefined,
      targetListenerLookupRecord: null
    })
  );

  return record;
}

function createDispatchListenerCanaryEvent(
  dispatchListenerRecord,
  payload,
  options
) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const currentTargetState = isObjectLike(
    normalizedOptions.currentTargetState
  )
    ? normalizedOptions.currentTargetState
    : null;
  const propagationState = isObjectLike(normalizedOptions.propagationState)
    ? normalizedOptions.propagationState
    : null;
  const defaultPreventedState = isObjectLike(
    normalizedOptions.defaultPreventedState
  )
    ? normalizedOptions.defaultPreventedState
    : null;
  const targetInst =
    Object.prototype.hasOwnProperty.call(normalizedOptions, 'targetInst')
      ? normalizedOptions.targetInst
      : dispatchListenerRecord.targetInst;
  const propagationStopDiagnosticEnabled =
    propagationState !== null &&
    propagationState.enablePropagationStopDiagnostics;
  const nativeStopImmediatePropagationDiagnosticEnabled =
    propagationState !== null &&
    propagationState.enableNativeStopImmediatePropagationDiagnostics;
  const defaultPreventedDiagnosticEnabled =
    defaultPreventedState !== null &&
    defaultPreventedState.enableDefaultPreventedDiagnostics;
  const event = {
    browserDomEventCompatibilityClaimed: false,
    defaultPreventedDiagnosticEnabled,
    domEventName: dispatchListenerRecord.domEventName,
    kind: DISPATCH_LISTENER_CANARY_EVENT_KIND,
    nativeStopImmediatePropagationDiagnosticEnabled,
    nativeEventType: dispatchListenerRecord.nativeEventType,
    phase: dispatchListenerRecord.phase,
    propagationStopDiagnosticEnabled,
    publicRootBehaviorChanged: false,
    registrationName: dispatchListenerRecord.registrationName,
    status: 'private-canary-not-synthetic-event',
    syntheticEvent: false,
    target: payload.nativeEventTarget,
    targetInst,
    type: dispatchListenerRecord.nativeEventType
  };

  if (currentTargetState === null) {
    event.currentTarget = dispatchListenerRecord.currentTarget;
  } else {
    Object.defineProperties(event, {
      currentTarget: {
        enumerable: true,
        get() {
          return currentTargetState.currentTarget;
        }
      }
    });
  }

  if (nativeStopImmediatePropagationDiagnosticEnabled) {
    Object.defineProperties(event, {
      nativeEvent: {
        enumerable: true,
        get() {
          return propagationState.nativeEvent;
        }
      },
      isNativeImmediatePropagationStopped: {
        enumerable: true,
        value() {
          return (
            propagationState.nativeImmediatePropagationStopped ||
            getNativeStopImmediatePropagationCallCount(
              propagationState.nativeEvent
            ) >
              propagationState.nativeStopImmediatePropagationNativeCallCount
          );
        }
      }
    });
  }

  if (defaultPreventedDiagnosticEnabled) {
    Object.defineProperties(event, {
      defaultPrevented: {
        enumerable: true,
        get() {
          return defaultPreventedState.defaultPrevented;
        }
      },
      isDefaultPrevented: {
        enumerable: true,
        value() {
          return defaultPreventedState.defaultPrevented;
        }
      },
      preventDefault: {
        enumerable: true,
        value() {
          defaultPreventedState.defaultPrevented = true;
          defaultPreventedState.preventDefaultCallCount++;
          defaultPreventedState.preventDefaultSourceListenerRecord =
            defaultPreventedState.currentDispatchListenerRecord;
          routeCanaryPreventDefaultToNativeEvent(
            defaultPreventedState.nativeEvent
          );
          syncDefaultPreventedDiagnosticStateFromNative(
            defaultPreventedState
          );
        }
      }
    });
  }

  if (propagationStopDiagnosticEnabled) {
    Object.defineProperties(event, {
      isPropagationStopped: {
        enumerable: true,
        value() {
          return propagationState.propagationStopped;
        }
      },
      stopPropagation: {
        enumerable: true,
        value() {
          propagationState.propagationStopped = true;
          propagationState.stoppedNativeEvent =
            propagationState.nativeEvent;
          propagationState.stopPropagationCallCount++;
          propagationState.stopSourceListenerRecord =
            propagationState.currentDispatchListenerRecord;
          routeCanaryStopPropagationToNativeEvent(
            propagationState.nativeEvent
          );
          propagationState.nativeStopPropagationCallCount =
            getNativeStopPropagationCallCount(
              propagationState.nativeEvent
            );
        }
      }
    });
  }

  return Object.freeze(event);
}

function initializeDefaultPreventedDiagnosticStateForNativeEvent(
  defaultPreventedState,
  nativeEvent
) {
  if (defaultPreventedState.nativeEvent !== nativeEvent) {
    defaultPreventedState.nativeEvent = nativeEvent;
    defaultPreventedState.initialDefaultPrevented =
      getNativeEventDefaultPrevented(nativeEvent);
    defaultPreventedState.initialNativePreventDefaultCallCount =
      getNativeEventPreventDefaultDiagnosticCallCount(nativeEvent);
    defaultPreventedState.defaultPrevented =
      defaultPreventedState.initialDefaultPrevented;
    defaultPreventedState.nativeEventPreventDefaultCallCount =
      defaultPreventedState.initialNativePreventDefaultCallCount;
  } else {
    syncDefaultPreventedDiagnosticStateFromNative(defaultPreventedState);
  }
}

function syncDefaultPreventedDiagnosticStateFromNative(
  defaultPreventedState
) {
  const nativeDefaultPrevented = getNativeEventDefaultPrevented(
    defaultPreventedState.nativeEvent
  );
  defaultPreventedState.nativeEventPreventDefaultCallCount =
    getNativeEventPreventDefaultDiagnosticCallCount(
      defaultPreventedState.nativeEvent
    );
  if (nativeDefaultPrevented) {
    defaultPreventedState.defaultPrevented = true;
  }
}

function routeCanaryPreventDefaultToNativeEvent(nativeEvent) {
  if (!isObjectLike(nativeEvent)) {
    return;
  }

  if (typeof nativeEvent.preventDefault === 'function') {
    nativeEvent.preventDefault();
    return;
  }

  if (typeof nativeEvent.returnValue !== 'unknown') {
    nativeEvent.returnValue = false;
  }
}

function getDefaultPreventedDiagnosticCallCount(defaultPreventedState) {
  return defaultPreventedState === null
    ? 0
    : defaultPreventedState.preventDefaultCallCount;
}

function routeCanaryStopPropagationToNativeEvent(nativeEvent) {
  if (!isObjectLike(nativeEvent)) {
    return;
  }

  if (typeof nativeEvent.stopPropagation === 'function') {
    nativeEvent.stopPropagation();
    return;
  }

  if (typeof nativeEvent.cancelBubble !== 'unknown') {
    nativeEvent.cancelBubble = true;
  }
}

function getNativeStopPropagationCallCount(nativeEvent) {
  if (
    isObjectLike(nativeEvent) &&
    typeof nativeEvent.stopPropagationCallCount === 'number'
  ) {
    return nativeEvent.stopPropagationCallCount;
  }

  return 0;
}

function getNativeStopImmediatePropagationDiagnosticCallCount(
  propagationState
) {
  if (
    propagationState === null ||
    !propagationState.enableNativeStopImmediatePropagationDiagnostics
  ) {
    return 0;
  }

  return propagationState.nativeStopImmediatePropagationCallCount;
}

function updateNativeStopImmediatePropagationDiagnosticState(
  propagationState,
  nativeCallCountBefore
) {
  if (
    propagationState === null ||
    !propagationState.enableNativeStopImmediatePropagationDiagnostics
  ) {
    return;
  }

  const nativeCallCountAfter = getNativeStopImmediatePropagationCallCount(
    propagationState.nativeEvent
  );
  propagationState.nativeStopImmediatePropagationNativeCallCount =
    nativeCallCountAfter;
  if (nativeCallCountAfter <= nativeCallCountBefore) {
    return;
  }

  propagationState.nativeImmediatePropagationStopped = true;
  propagationState.nativeStopImmediatePropagationCallCount +=
    nativeCallCountAfter - nativeCallCountBefore;
  propagationState.nativeStopImmediatePropagationSourceListenerRecord =
    propagationState.currentDispatchListenerRecord;
  propagationState.nativeStopImmediatePropagationStoppedNativeEvent =
    propagationState.nativeEvent;
}

function getNativeStopImmediatePropagationCallCount(nativeEvent) {
  if (
    isObjectLike(nativeEvent) &&
    typeof nativeEvent.stopImmediatePropagationCallCount === 'number'
  ) {
    return nativeEvent.stopImmediatePropagationCallCount;
  }

  if (
    isObjectLike(nativeEvent) &&
    nativeEvent.immediatePropagationStopped === true
  ) {
    return 1;
  }

  return 0;
}

function SyntheticBaseEvent(
  reactName,
  reactEventType,
  targetInst,
  nativeEvent,
  nativeEventTarget
) {
  const defaultPrevented = getNativeEventDefaultPrevented(nativeEvent);

  this._reactName = reactName;
  this._targetInst = targetInst;
  this.type = reactEventType;
  this.nativeEvent = nativeEvent;
  this.target = nativeEventTarget;
  this.currentTarget = null;
  this.defaultPrevented = defaultPrevented;
  this.isDefaultPrevented = defaultPrevented
    ? functionThatReturnsTrue
    : functionThatReturnsFalse;
  this.isPropagationStopped = functionThatReturnsFalse;
}

SyntheticBaseEvent.prototype.preventDefault = function preventDefault() {
  this.defaultPrevented = true;
  const nativeEvent = this.nativeEvent;
  if (isObjectLike(nativeEvent)) {
    if (typeof nativeEvent.preventDefault === 'function') {
      nativeEvent.preventDefault();
    } else if (typeof nativeEvent.returnValue !== 'unknown') {
      nativeEvent.returnValue = false;
    }
  }
  this.isDefaultPrevented = functionThatReturnsTrue;
};

SyntheticBaseEvent.prototype.stopPropagation = function stopPropagation() {
  const nativeEvent = this.nativeEvent;
  if (isObjectLike(nativeEvent)) {
    if (typeof nativeEvent.stopPropagation === 'function') {
      nativeEvent.stopPropagation();
    } else if (typeof nativeEvent.cancelBubble !== 'unknown') {
      nativeEvent.cancelBubble = true;
    }
  }
  this.isPropagationStopped = functionThatReturnsTrue;
};

SyntheticBaseEvent.prototype.persist = function persist() {};
SyntheticBaseEvent.prototype.isPersistent = functionThatReturnsTrue;

function createSyntheticEventShapeGateFromDispatchRecords(
  dispatchRecords,
  options
) {
  const normalizedDispatchRecords = normalizeDispatchRecordList(
    dispatchRecords
  );
  const normalizedOptions = isObjectLike(options) ? options : {};
  const useProcessingOrder = normalizedOptions.useProcessingOrder !== false;
  const preventDefaultAtPhase = normalizePreventDefaultAtPhase(
    normalizedOptions.preventDefaultAtPhase
  );
  const shapeRecords = [];
  let dispatchQueueEntryCount = 0;
  let listenerCandidateCount = 0;
  let preventDefaultConsumed = false;

  for (
    let dispatchRecordIndex = 0;
    dispatchRecordIndex < normalizedDispatchRecords.length;
    dispatchRecordIndex++
  ) {
    const dispatchRecord = normalizedDispatchRecords[dispatchRecordIndex];
    const dispatchQueue = dispatchRecord.dispatchQueue;

    for (
      let dispatchQueueEntryIndex = 0;
      dispatchQueueEntryIndex < dispatchQueue.entries.length;
      dispatchQueueEntryIndex++
    ) {
      const dispatchQueueEntry = assertDispatchQueueEntryRecord(
        dispatchQueue.entries[dispatchQueueEntryIndex]
      );
      const entryPayload =
        getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
      const listenerRecords = useProcessingOrder
        ? entryPayload.processingListenerRecords
        : entryPayload.listenerRecords;
      dispatchQueueEntryCount++;
      listenerCandidateCount += listenerRecords.length;

      for (
        let listenerIndex = 0;
        listenerIndex < listenerRecords.length;
        listenerIndex++
      ) {
        const listenerRecord = listenerRecords[listenerIndex];
        const shouldPreventDefault =
          preventDefaultAtPhase !== null &&
          preventDefaultConsumed === false &&
          listenerRecord.phase === preventDefaultAtPhase;
        const shapeRecord =
          createSyntheticEventShapeRecordForDispatchListenerRecord(
            listenerRecord,
            {
              dispatchQueueEntry,
              dispatchRecord,
              listenerIndex,
              preventDefault: shouldPreventDefault,
              selectedFromProcessingOrder: useProcessingOrder
            }
          );
        shapeRecords.push(shapeRecord);
        if (shouldPreventDefault) {
          preventDefaultConsumed = true;
        }
      }
    }
  }

  const frozenShapeRecords = Object.freeze(shapeRecords.slice());
  const syntheticEventShapeOrder = Object.freeze(
    frozenShapeRecords.map((shapeRecord, index) =>
      Object.freeze({
        currentTarget: shapeRecord.currentTargetDuringDispatch,
        defaultPreventedAfterAction:
          shapeRecord.defaultPreventedAfterAction,
        dispatchPathIndex: shapeRecord.dispatchPathIndex,
        index,
        phase: shapeRecord.phase,
        preventDefaultInvoked: shapeRecord.preventDefaultInvoked,
        registrationName: shapeRecord.registrationName,
        target: shapeRecord.target,
        targetInst: shapeRecord.targetInst
      })
    )
  );
  const preventDefaultShapeCount = frozenShapeRecords.filter(
    (shapeRecord) => shapeRecord.preventDefaultInvoked
  ).length;
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    broadDispatchQueueProcessing: false,
    browserDomEventCompatibilityClaimed: false,
    dispatchQueueEntryCount,
    dispatchQueueProcessed: false,
    dispatchRecordCount: normalizedDispatchRecords.length,
    exposesSyntheticEvent: false,
    kind: SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND,
    listenerCandidateCount,
    listenerInvocationCount: 0,
    preventDefaultAtPhase,
    preventDefaultShapeCount,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    selectedFromProcessingOrder: useProcessingOrder,
    status: PRIVATE_SYNTHETIC_EVENT_SHAPE_GATE_STATUS,
    syntheticEventCompatibilityClaimed: false,
    syntheticEventCount: frozenShapeRecords.length,
    syntheticEventDispatchCount: 0,
    syntheticEventShapeCount: frozenShapeRecords.length,
    syntheticEventShapeOrder,
    syntheticEventShapeRecords: frozenShapeRecords,
    willInvokeListeners: false
  });

  syntheticEventShapeGateRecordPayloads.set(
    record,
    Object.freeze({
      dispatchRecords: Object.freeze(normalizedDispatchRecords.slice()),
      options: Object.freeze({
        preventDefaultAtPhase,
        useProcessingOrder
      }),
      shapeRecords: frozenShapeRecords
    })
  );

  return record;
}

function createSyntheticEventShapeRecordForDispatchListenerRecord(
  dispatchListenerRecord,
  options
) {
  const normalizedListenerRecord =
    assertDispatchListenerRecord(dispatchListenerRecord);
  const payload =
    getDispatchListenerRecordPayload(normalizedListenerRecord);
  const normalizedOptions = isObjectLike(options) ? options : {};
  const dispatchRecord =
    normalizedOptions.dispatchRecord === undefined
      ? null
      : assertEventDispatchRecord(normalizedOptions.dispatchRecord);
  const dispatchQueueEntry =
    normalizedOptions.dispatchQueueEntry === undefined
      ? null
      : assertDispatchQueueEntryRecord(normalizedOptions.dispatchQueueEntry);
  const shouldPreventDefault = normalizedOptions.preventDefault === true;
  const selectedFromProcessingOrder =
    normalizedOptions.selectedFromProcessingOrder !== false;
  const listenerIndex =
    typeof normalizedOptions.listenerIndex === 'number'
      ? normalizedOptions.listenerIndex
      : 0;
  const syntheticEvent = new SyntheticBaseEvent(
    normalizedListenerRecord.registrationName,
    normalizedListenerRecord.nativeEventType,
    normalizedListenerRecord.targetInst,
    payload.nativeEvent,
    payload.nativeEventTarget
  );
  const beforeDispatch = createSyntheticEventShapeSnapshot(
    syntheticEvent,
    payload.nativeEvent
  );

  syntheticEvent.currentTarget = normalizedListenerRecord.currentTarget;
  const duringBeforeAction = createSyntheticEventShapeSnapshot(
    syntheticEvent,
    payload.nativeEvent
  );

  if (shouldPreventDefault) {
    syntheticEvent.preventDefault();
  }

  const duringAfterAction = createSyntheticEventShapeSnapshot(
    syntheticEvent,
    payload.nativeEvent
  );
  syntheticEvent.currentTarget = null;
  const afterDispatch = createSyntheticEventShapeSnapshot(
    syntheticEvent,
    payload.nativeEvent
  );
  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    browserDomEventCompatibilityClaimed: false,
    constructorName: afterDispatch.constructorName,
    currentTargetAfterAction: duringAfterAction.currentTarget,
    currentTargetAfterDispatch: afterDispatch.currentTarget,
    currentTargetBeforeDispatch: beforeDispatch.currentTarget,
    currentTargetDuringDispatch: duringBeforeAction.currentTarget,
    defaultPreventedAfterAction: duringAfterAction.defaultPrevented,
    defaultPreventedAfterDispatch: afterDispatch.defaultPrevented,
    defaultPreventedBeforeAction: duringBeforeAction.defaultPrevented,
    dispatchPathIndex: normalizedListenerRecord.dispatchPathIndex,
    dispatchQueueEntryKind:
      dispatchQueueEntry === null ? null : dispatchQueueEntry.kind,
    dispatchQueueProcessed: false,
    dispatchRecordKind:
      dispatchRecord === null ? null : dispatchRecord.kind,
    domEventName: normalizedListenerRecord.domEventName,
    exposesSyntheticEvent: false,
    hasPersist: afterDispatch.hasPersist,
    hasPreventDefault: afterDispatch.hasPreventDefault,
    initialDefaultPrevented: beforeDispatch.defaultPrevented,
    isDefaultPreventedAfterAction:
      duringAfterAction.isDefaultPrevented,
    isDefaultPreventedAfterDispatch: afterDispatch.isDefaultPrevented,
    isDefaultPreventedBeforeAction:
      duringBeforeAction.isDefaultPrevented,
    kind: SYNTHETIC_EVENT_SHAPE_RECORD_KIND,
    listenerIndex,
    listenerInvocationCount: 0,
    nativeDefaultPreventedAfterAction:
      duringAfterAction.nativeDefaultPrevented,
    nativeDefaultPreventedAfterDispatch:
      afterDispatch.nativeDefaultPrevented,
    nativeDefaultPreventedBeforeAction:
      duringBeforeAction.nativeDefaultPrevented,
    nativeEventPreventDefaultCallCountAfterAction:
      duringAfterAction.nativePreventDefaultCallCount,
    nativeEventPreventDefaultCallCountBeforeAction:
      duringBeforeAction.nativePreventDefaultCallCount,
    nativeEventType: normalizedListenerRecord.nativeEventType,
    phase: normalizedListenerRecord.phase,
    preventDefaultApplied:
      shouldPreventDefault && duringAfterAction.defaultPrevented === true,
    preventDefaultInvoked: shouldPreventDefault,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    registrationName: normalizedListenerRecord.registrationName,
    selectedFromProcessingOrder,
    status: PRIVATE_SYNTHETIC_EVENT_SHAPE_STATUS,
    syntheticEventCompatibilityClaimed: false,
    syntheticEventDispatchCount: 0,
    syntheticEventShapeOnly: true,
    target: syntheticEvent.target,
    targetInst: normalizedListenerRecord.targetInst,
    targetInstStatus: normalizedListenerRecord.targetInstStatus,
    targetMatchesNativeEventTarget:
      syntheticEvent.target === payload.nativeEventTarget,
    type: syntheticEvent.type,
    willInvokeListener: false
  });

  syntheticEventShapeRecordPayloads.set(
    record,
    Object.freeze({
      afterDispatch,
      beforeDispatch,
      dispatchListenerRecord: normalizedListenerRecord,
      dispatchQueueEntry,
      dispatchRecord,
      duringAfterAction,
      duringBeforeAction,
      nativeEvent: payload.nativeEvent,
      nativeEventTarget: payload.nativeEventTarget,
      syntheticEvent
    })
  );

  return record;
}

function createSyntheticEventShapeSnapshot(syntheticEvent, nativeEvent) {
  return Object.freeze({
    constructorName:
      syntheticEvent.constructor &&
      typeof syntheticEvent.constructor.name === 'string'
        ? syntheticEvent.constructor.name
        : null,
    currentTarget: syntheticEvent.currentTarget,
    defaultPrevented: syntheticEvent.defaultPrevented === true,
    hasPersist: typeof syntheticEvent.persist === 'function',
    hasPreventDefault:
      typeof syntheticEvent.preventDefault === 'function',
    isDefaultPrevented: syntheticEvent.isDefaultPrevented(),
    nativeDefaultPrevented: getNativeEventDefaultPrevented(nativeEvent),
    nativePreventDefaultCallCount:
      getNativeEventPreventDefaultCallCount(nativeEvent),
    target: syntheticEvent.target,
    type: syntheticEvent.type
  });
}

function getNativeEventDefaultPrevented(nativeEvent) {
  if (!isObjectLike(nativeEvent)) {
    return false;
  }
  if (nativeEvent.defaultPrevented != null) {
    return nativeEvent.defaultPrevented === true;
  }
  return nativeEvent.returnValue === false;
}

function getNativeEventPreventDefaultCallCount(nativeEvent) {
  return isObjectLike(nativeEvent) &&
    typeof nativeEvent.preventDefaultCallCount === 'number'
    ? nativeEvent.preventDefaultCallCount
    : null;
}

function getNativeEventPreventDefaultDiagnosticCallCount(nativeEvent) {
  const nativeCallCount = getNativeEventPreventDefaultCallCount(nativeEvent);
  return typeof nativeCallCount === 'number' ? nativeCallCount : 0;
}

function normalizePreventDefaultAtPhase(value) {
  if (value === undefined || value === null || value === false) {
    return null;
  }
  if (value === 'capture' || value === 'bubble') {
    return value;
  }
  throw createPluginEventSystemError(
    'Expected preventDefaultAtPhase to be "capture", "bubble", or null.',
    INVALID_EVENT_DISPATCH_RECORD_CODE
  );
}

function getSyntheticEventShapeRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return syntheticEventShapeRecordPayloads.get(record) || null;
}

function isSyntheticEventShapeRecord(record) {
  return getSyntheticEventShapeRecordPayload(record) !== null;
}

function getSyntheticEventShapeGateRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return syntheticEventShapeGateRecordPayloads.get(record) || null;
}

function isSyntheticEventShapeGateRecord(record) {
  return getSyntheticEventShapeGateRecordPayload(record) !== null;
}

function getDispatchListenerInvocationCanaryRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchListenerInvocationCanaryRecordPayloads.get(record) || null;
}

function isDispatchListenerInvocationCanaryRecord(record) {
  return getDispatchListenerInvocationCanaryRecordPayload(record) !== null;
}

function getDispatchQueueInvocationCanaryRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchQueueInvocationCanaryRecordPayloads.get(record) || null;
}

function isDispatchQueueInvocationCanaryRecord(record) {
  return getDispatchQueueInvocationCanaryRecordPayload(record) !== null;
}

function getDispatchListenerErrorRouteRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return dispatchListenerErrorRouteRecordPayloads.get(record) || null;
}

function isDispatchListenerErrorRouteRecord(record) {
  return getDispatchListenerErrorRouteRecordPayload(record) !== null;
}

function getPortalEventOwnerRootGateRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return portalEventOwnerRootGateRecordPayloads.get(record) || null;
}

function isPortalEventOwnerRootGateRecord(record) {
  return getPortalEventOwnerRootGateRecordPayload(record) !== null;
}

function getFocusBlurEventBlockerGateRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return focusBlurEventBlockerGateRecordPayloads.get(record) || null;
}

function isFocusBlurEventBlockerGateRecord(record) {
  return getFocusBlurEventBlockerGateRecordPayload(record) !== null;
}

function getEventDispatchRecordPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return eventDispatchRecordPayloads.get(record) || null;
}

function assertEventDispatchRecord(record) {
  if (
    !isObjectLike(record) ||
    record.kind !== EVENT_DISPATCH_RECORD_KIND ||
    !isObjectLike(record.dispatchQueue) ||
    record.dispatchQueue.kind !== DISPATCH_QUEUE_RECORD_KIND ||
    !Array.isArray(record.dispatchQueue.entries)
  ) {
    throw createPluginEventSystemError(
      'Cannot invoke a React DOM event listener canary without a private event dispatch record.',
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  if (getEventDispatchRecordPayload(record) === null) {
    throw createPluginEventSystemError(
      'Cannot invoke a React DOM event listener canary with a cloned or caller-built event dispatch record.',
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  return record;
}

function assertFocusBlurEventBlockerDispatchRecord(record) {
  const normalizedDispatchRecord = assertEventDispatchRecord(record);
  if (!focusBlurNativeEventNameSet.has(normalizedDispatchRecord.domEventName)) {
    throw createPluginEventSystemError(
      'Focus/blur event blocker diagnostics require private focusin/focusout event dispatch records.',
      INVALID_FOCUS_BLUR_EVENT_BLOCKER_GATE_CODE
    );
  }

  return normalizedDispatchRecord;
}

function assertPortalEventOwnerRootDispatchPathRecord(record) {
  if (
    !isObjectLike(record) ||
    record.kind !== EVENT_TARGET_DISPATCH_PATH_RECORD_KIND ||
    !Array.isArray(record.entries)
  ) {
    throw createPluginEventSystemError(
      'Cannot create a portal event owner-root gate without a private event target dispatch path record.',
      INVALID_PORTAL_EVENT_OWNER_ROOT_GATE_CODE
    );
  }

  return record;
}

function normalizeFocusBlurEventBlockerDispatchRecords(dispatchRecords) {
  const normalizedDispatchRecords = Array.isArray(dispatchRecords)
    ? dispatchRecords.map((dispatchRecord) =>
        assertFocusBlurEventBlockerDispatchRecord(dispatchRecord)
      )
    : [assertFocusBlurEventBlockerDispatchRecord(dispatchRecords)];

  if (normalizedDispatchRecords.length === 0) {
    throw createPluginEventSystemError(
      'Focus/blur event blocker diagnostics require at least one private focusin/focusout event dispatch record.',
      INVALID_FOCUS_BLUR_EVENT_BLOCKER_GATE_CODE
    );
  }

  return normalizedDispatchRecords;
}

function normalizeFocusBlurEventBlockerGateOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const sourcePortalGate =
    normalizedOptions.portalEventOwnerRootGateRecord ||
    normalizedOptions.portalOwnerRootGateRecord ||
    null;
  if (
    sourcePortalGate !== null &&
    !isPortalEventOwnerRootGateRecord(sourcePortalGate)
  ) {
    throw createPluginEventSystemError(
      'Focus/blur event blocker diagnostics require a private portal event owner-root gate record when portal metadata is provided.',
      INVALID_FOCUS_BLUR_EVENT_BLOCKER_GATE_CODE
    );
  }

  return {
    portalEventOwnerRootGateRecord: sourcePortalGate,
    rawOptions: options
  };
}

function getFocusBlurSyntheticEventType(domEventName) {
  return Object.prototype.hasOwnProperty.call(
    focusBlurSyntheticEventTypes,
    domEventName
  )
    ? focusBlurSyntheticEventTypes[domEventName]
    : null;
}

function normalizePrivateFocusBlurEventDispatchExecutionOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const sourcePortalGate =
    normalizedOptions.portalEventOwnerRootGateRecord ||
    normalizedOptions.portalOwnerRootGateRecord ||
    null;

  if (
    sourcePortalGate !== null &&
    !isPortalEventOwnerRootGateRecord(sourcePortalGate)
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution requires a private portal owner-root gate record when portal metadata is provided.',
      'invalid-portal-owner-root-gate-record'
    );
  }

  return {
    portalEventOwnerRootGateRecord: sourcePortalGate,
    rawOptions: options,
    useProcessingOrder: normalizedOptions.useProcessingOrder !== false
  };
}

function assertPrivateFocusBlurEventDispatchExecutionDispatchRecord(
  dispatchRecord
) {
  const normalizedDispatchRecord =
    assertFocusBlurEventBlockerDispatchRecord(dispatchRecord);
  if (
    normalizedDispatchRecord.nativeEventType !==
    normalizedDispatchRecord.domEventName
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution requires native focusin/focusout event records.',
      'unsupported-event-type'
    );
  }
  if (
    normalizedDispatchRecord.isNonDelegatedEvent ||
    normalizedDispatchRecord.isEventHandleNonManagedNode
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution requires delegated root-listener event flags.',
      'unsupported-event-system-flags'
    );
  }

  return normalizedDispatchRecord;
}

function assertPrivateFocusBlurEventDispatchExecutionListenerRecord(
  dispatchListenerRecord,
  dispatchRecord
) {
  const normalizedListenerRecord =
    assertDispatchListenerRecord(dispatchListenerRecord);
  const payload =
    getDispatchListenerRecordPayload(normalizedListenerRecord);
  if (
    payload === null ||
    normalizedListenerRecord.privateListenerQueue !== true ||
    payload.privateEventListenerQueueEntryRecord === undefined ||
    payload.privateEventListenerQueueEntryRecord === null
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution requires a private accepted listener queue record.',
      'unsupported-listener-record'
    );
  }
  if (
    !focusBlurNativeEventNameSet.has(normalizedListenerRecord.domEventName) ||
    normalizedListenerRecord.nativeEventType !==
      normalizedListenerRecord.domEventName ||
    normalizedListenerRecord.domEventName !== dispatchRecord.domEventName
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution only supports focusin/focusout listener records.',
      'unsupported-event-type'
    );
  }
  if (
    normalizedListenerRecord.inCapturePhase !==
      dispatchRecord.inCapturePhase ||
    normalizedListenerRecord.phase !==
      (dispatchRecord.inCapturePhase ? 'capture' : 'bubble')
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution listener phase must match the root listener phase.',
      'unsupported-event-phase'
    );
  }
  if (
    dispatchRecord.targetDispatchPathRecord.rootOwner !== null &&
    normalizedListenerRecord.rootOwner !==
      dispatchRecord.targetDispatchPathRecord.rootOwner
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution listener belongs to a different owner root.',
      'portal-owner-root-mismatch'
    );
  }

  return normalizedListenerRecord;
}

function assertFreshPrivateFocusBlurEventDispatchExecutionListenerRecord(
  dispatchListenerRecord
) {
  const listenerPayload =
    getDispatchListenerRecordPayload(dispatchListenerRecord);
  const queueEntryRecord =
    listenerPayload === null
      ? null
      : listenerPayload.privateEventListenerQueueEntryRecord;
  const queueEntryPayload =
    getPrivateEventListenerQueueEntryPayload(queueEntryRecord);

  if (
    listenerPayload === null ||
    queueEntryPayload === null ||
    queueEntryPayload.active !== true
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution rejected a stale listener record.',
      'stale-listener-record'
    );
  }
  if (
    queueEntryPayload.target !== dispatchListenerRecord.currentTarget ||
    queueEntryPayload.listener !== listenerPayload.listener
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution listener metadata no longer matches the accepted registry record.',
      'stale-listener-record'
    );
  }
  if (!focusBlurNativeEventNameSet.has(queueEntryPayload.domEventName)) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution only accepts focusin/focusout listener registry records.',
      'unsupported-event-type'
    );
  }
  if (queueEntryPayload.domEventName !== dispatchListenerRecord.domEventName) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution listener registry event does not match the dispatch event.',
      'unsupported-event-type'
    );
  }
  if (queueEntryPayload.capture !== dispatchListenerRecord.inCapturePhase) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution listener registry phase does not match the dispatch phase.',
      'unsupported-event-phase'
    );
  }

  return {
    listenerPayload,
    queueEntryPayload,
    queueEntryRecord
  };
}

function findPrivateFocusBlurEventDispatchExecutionListenerRecordForQueueEntry(
  dispatchRecords,
  listenerQueueEntryRecord,
  useProcessingOrder
) {
  for (const dispatchRecord of dispatchRecords) {
    const normalizedDispatchRecord =
      assertPrivateFocusBlurEventDispatchExecutionDispatchRecord(
        dispatchRecord
      );
    for (const dispatchQueueEntry of normalizedDispatchRecord.dispatchQueue
      .entries) {
      const entryPayload =
        getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
      const listenerRecords =
        useProcessingOrder && entryPayload !== null
          ? entryPayload.processingListenerRecords
          : entryPayload === null
            ? []
            : entryPayload.listenerRecords;
      for (const dispatchListenerRecord of listenerRecords) {
        const listenerPayload =
          getDispatchListenerRecordPayload(dispatchListenerRecord);
        if (
          listenerPayload !== null &&
          listenerPayload.privateEventListenerQueueEntryRecord ===
            listenerQueueEntryRecord
        ) {
          return {
            dispatchListenerRecord,
            dispatchRecord: normalizedDispatchRecord
          };
        }
      }
    }
  }

  return null;
}

function findPrivateFocusBlurEventDispatchExecutionListenerSelection(
  dispatchRecord,
  dispatchListenerRecord
) {
  for (
    let dispatchQueueEntryIndex = 0;
    dispatchQueueEntryIndex < dispatchRecord.dispatchQueue.entries.length;
    dispatchQueueEntryIndex++
  ) {
    const dispatchQueueEntry = assertDispatchQueueEntryRecord(
      dispatchRecord.dispatchQueue.entries[dispatchQueueEntryIndex]
    );
    const entryPayload =
      getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
    const processingIndex =
      entryPayload.processingListenerRecords.indexOf(dispatchListenerRecord);
    if (processingIndex !== -1) {
      return {
        dispatchQueueEntry,
        dispatchQueueEntryIndex,
        listenerIndex: processingIndex,
        selectedFromProcessingOrder: true
      };
    }

    const listenerIndex =
      entryPayload.listenerRecords.indexOf(dispatchListenerRecord);
    if (listenerIndex !== -1) {
      return {
        dispatchQueueEntry,
        dispatchQueueEntryIndex,
        listenerIndex,
        selectedFromProcessingOrder: false
      };
    }
  }

  throw createPrivateFocusBlurEventDispatchExecutionError(
    'Private focus/blur event dispatch execution rejected a listener record that is no longer part of the plugin extraction queue.',
    'stale-listener-record'
  );
}

function validatePrivateFocusBlurEventDispatchExecutionPortalOwnerRootGate(
  dispatchRecord,
  portalEventOwnerRootGateRecord
) {
  if (portalEventOwnerRootGateRecord === null) {
    return Object.freeze({
      available: false,
      ownerRootMatchesTargetRoot: false,
      ownerRootPreservedAcrossPortalContainerRoot: false,
      ownerRootPreservedAcrossSecondaryPortalRoot: false,
      portalContainerContainsTarget: false,
      portalContainerMatchesDispatchRootBoundary: false,
      portalContainerOwnedBySecondaryRoot: false,
      portalContainerRootBoundaryStatus:
        'unavailable-no-portal-owner-root-gate',
      portalContainerRootOwnerMatchesPortalOwner: null,
      portalContainerRootOwnerPresent: false,
      recordKind: null,
      status: 'unavailable-no-portal-owner-root-gate',
      targetDispatchPathLength: 0,
      targetInstStatus: 'not-applicable'
    });
  }

  const portalPayload = getPortalEventOwnerRootGateRecordPayload(
    portalEventOwnerRootGateRecord
  );
  if (portalPayload === null) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution requires a known portal owner-root gate record.',
      'invalid-portal-owner-root-gate-record'
    );
  }

  if (
    portalEventOwnerRootGateRecord.status !==
      PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS ||
    portalEventOwnerRootGateRecord.ownerRootMatchesTargetRoot !== true ||
    portalEventOwnerRootGateRecord.dispatchPathRootOwnerMismatchCount !== 0 ||
    portalEventOwnerRootGateRecord.targetInst !== dispatchRecord.targetInst ||
    portalPayload.targetDispatchPathRecord.rootOwner !==
      dispatchRecord.targetDispatchPathRecord.rootOwner
  ) {
    throw createPrivateFocusBlurEventDispatchExecutionError(
      'Private focus/blur event dispatch execution rejected portal owner-root metadata that does not match the focus/blur target.',
      'portal-owner-root-mismatch'
    );
  }

  return Object.freeze({
    available: true,
    blockedReason: portalEventOwnerRootGateRecord.blockedReason,
    dispatchPathRootOwnerMatchCount:
      portalEventOwnerRootGateRecord.dispatchPathRootOwnerMatchCount,
    dispatchPathRootOwnerMismatchCount:
      portalEventOwnerRootGateRecord.dispatchPathRootOwnerMismatchCount,
    ownerRootMatchesTargetRoot:
      portalEventOwnerRootGateRecord.ownerRootMatchesTargetRoot,
    ownerRootPreservedAcrossPortalContainerRoot:
      portalEventOwnerRootGateRecord.ownerRootPreservedAcrossPortalContainerRoot,
    ownerRootPreservedAcrossSecondaryPortalRoot:
      portalEventOwnerRootGateRecord.ownerRootPreservedAcrossSecondaryPortalRoot,
    portalContainerContainsTarget:
      portalEventOwnerRootGateRecord.portalContainerContainsTarget,
    portalContainerMatchesDispatchRootBoundary:
      portalEventOwnerRootGateRecord.portalContainerMatchesDispatchRootBoundary,
    portalContainerOwnedBySecondaryRoot:
      portalEventOwnerRootGateRecord.portalContainerOwnedBySecondaryRoot,
    portalGateDomEventName: portalEventOwnerRootGateRecord.domEventName,
    portalContainerRootBoundaryStatus:
      portalEventOwnerRootGateRecord.portalContainerRootBoundaryStatus,
    portalContainerRootOwnerMatchesPortalOwner:
      portalEventOwnerRootGateRecord.portalContainerRootOwnerMatchesPortalOwner,
    portalContainerRootOwnerPresent:
      portalEventOwnerRootGateRecord.portalContainerRootOwnerPresent,
    publicPortalBubblingEnabled:
      portalEventOwnerRootGateRecord.publicPortalBubblingEnabled,
    recordKind: portalEventOwnerRootGateRecord.kind,
    rootContainerContainsTarget:
      portalEventOwnerRootGateRecord.rootContainerContainsTarget,
    status: portalEventOwnerRootGateRecord.status,
    targetDispatchPathLength:
      portalEventOwnerRootGateRecord.targetDispatchPathLength,
    targetDispatchPathStatus:
      portalEventOwnerRootGateRecord.targetDispatchPathStatus,
    targetInstStatus: portalEventOwnerRootGateRecord.targetInstStatus
  });
}

function getPrivateFocusBlurEventDispatchExecutionPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return privateFocusBlurEventDispatchExecutionPayloads.get(record) || null;
}

function isPrivateFocusBlurEventDispatchExecutionRecord(record) {
  return getPrivateFocusBlurEventDispatchExecutionPayload(record) !== null;
}

function createPrivateFocusBlurEventDispatchExecutionError(
  message,
  reason
) {
  const error = createPluginEventSystemError(
    message,
    INVALID_PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE
  );
  error.reason = reason;
  return error;
}

function normalizePrivateClickEventDelegationDispatchGateOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const sourcePortalGate =
    normalizedOptions.portalEventOwnerRootGateRecord ||
    normalizedOptions.portalOwnerRootGateRecord ||
    null;

  if (
    sourcePortalGate !== null &&
    !isPortalEventOwnerRootGateRecord(sourcePortalGate)
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch requires a private portal owner-root gate record when portal metadata is provided.',
      'invalid-portal-owner-root-gate-record'
    );
  }

  return {
    portalEventOwnerRootGateRecord: sourcePortalGate,
    rawOptions: options
  };
}

function normalizePrivateClickEventDelegationAcceptedListenerOrderOptions(
  options
) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const targetRecord =
    normalizedOptions.rootHostOutputEventTargetRecord ||
    normalizedOptions.targetRecord ||
    null;

  if (
    targetRecord !== null &&
    !isPrivateRootHostOutputEventTargetRecord(targetRecord)
  ) {
    throw createPrivateClickEventDelegationAcceptedListenerOrderError(
      'Private click event delegation accepted listener order requires a private root host-output target record when target metadata is provided.',
      'invalid-target-record'
    );
  }

  return {
    rawOptions: options,
    requireRootRenderMetadata:
      normalizedOptions.requireRootRenderMetadata === true,
    targetRecord
  };
}

function normalizePrivateClickEventDelegationAcceptedListenerQueueEntryRecords(
  listenerQueueEntryRecords
) {
  const records = Array.isArray(listenerQueueEntryRecords)
    ? listenerQueueEntryRecords
    : [listenerQueueEntryRecords];
  if (records.length === 0) {
    throw createPrivateClickEventDelegationAcceptedListenerOrderError(
      'Private click event delegation accepted listener order requires at least one accepted listener queue record.',
      'missing-listener-records'
    );
  }

  const seenRecords = new Set();
  return records.map((record) => {
    const payload = getPrivateEventListenerQueueEntryPayload(record);
    if (payload === null || payload.active !== true) {
      throw createPrivateClickEventDelegationAcceptedListenerOrderError(
        'Private click event delegation accepted listener order requires active private listener queue records.',
        'stale-listener-record'
      );
    }
    if (payload.domEventName !== 'click') {
      throw createPrivateClickEventDelegationAcceptedListenerOrderError(
        'Private click event delegation accepted listener order only accepts click listener queue records.',
        'unsupported-event-type'
      );
    }
    if (seenRecords.has(record)) {
      throw createPrivateClickEventDelegationAcceptedListenerOrderError(
        'Private click event delegation accepted listener order cannot consume duplicate listener queue records.',
        'duplicate-listener-record'
      );
    }
    seenRecords.add(record);
    return record;
  });
}

function assertPrivateClickEventDelegationDispatchRecord(dispatchRecord) {
  const normalizedDispatchRecord = assertEventDispatchRecord(dispatchRecord);
  if (
    normalizedDispatchRecord.domEventName !== 'click' ||
    normalizedDispatchRecord.nativeEventType !== 'click'
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch only supports click dispatch records.',
      'unsupported-event-type'
    );
  }
  if (
    normalizedDispatchRecord.isNonDelegatedEvent ||
    normalizedDispatchRecord.isEventHandleNonManagedNode
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch requires delegated root-listener event flags.',
      'unsupported-event-system-flags'
    );
  }
  const phase = normalizedDispatchRecord.inCapturePhase
    ? 'capture'
    : 'bubble';
  if (phase !== 'capture' && phase !== 'bubble') {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch received an unsupported event phase.',
      'unsupported-event-phase'
    );
  }

  return normalizedDispatchRecord;
}

function assertPrivateClickEventDelegationDispatchListenerRecord(
  dispatchListenerRecord,
  dispatchRecord
) {
  const normalizedListenerRecord =
    assertDispatchListenerRecord(dispatchListenerRecord);
  const payload =
    getDispatchListenerRecordPayload(normalizedListenerRecord);
  if (
    payload === null ||
    normalizedListenerRecord.privateListenerQueue !== true ||
    payload.privateEventListenerQueueEntryRecord === undefined ||
    payload.privateEventListenerQueueEntryRecord === null
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch requires a private accepted listener queue record.',
      'unsupported-listener-record'
    );
  }
  if (
    normalizedListenerRecord.domEventName !== 'click' ||
    normalizedListenerRecord.nativeEventType !== 'click'
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch only supports click listener records.',
      'unsupported-event-type'
    );
  }
  if (
    normalizedListenerRecord.inCapturePhase !==
      dispatchRecord.inCapturePhase ||
    normalizedListenerRecord.phase !==
      (dispatchRecord.inCapturePhase ? 'capture' : 'bubble')
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch listener phase must match the root listener phase.',
      'unsupported-event-phase'
    );
  }
  if (
    dispatchRecord.targetDispatchPathRecord.rootOwner !== null &&
    normalizedListenerRecord.rootOwner !==
      dispatchRecord.targetDispatchPathRecord.rootOwner
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch listener belongs to a different owner root.',
      'portal-owner-root-mismatch'
    );
  }

  return normalizedListenerRecord;
}

function validatePrivateClickEventDelegationAcceptedListenerOrderTargetRecord(
  dispatchRecords,
  options
) {
  const targetRecord = options.targetRecord;
  if (targetRecord === null) {
    if (options.requireRootRenderMetadata) {
      throw createPrivateClickEventDelegationAcceptedListenerOrderError(
        'Private click event delegation accepted listener order requires root-render host-output target metadata.',
        'missing-root-render-target-record'
      );
    }
    return Object.freeze({
      available: false,
      recordKind: null,
      rootRenderHostOutputActive: false,
      rootRenderMetadataAvailable: false,
      rootRenderMetadataStatus: 'unavailable-no-target-record',
      status: 'unavailable-no-target-record'
    });
  }

  const targetPayload =
    getPrivateRootHostOutputEventTargetRecordPayload(targetRecord);
  if (targetPayload === null) {
    throw createPrivateClickEventDelegationAcceptedListenerOrderError(
      'Private click event delegation accepted listener order requires a known private root host-output target record.',
      'invalid-target-record'
    );
  }

  for (const dispatchRecord of dispatchRecords) {
    if (
      dispatchRecord.targetInst !== targetRecord.targetInst ||
      dispatchRecord.nativeEventTarget !== targetPayload.targetNode
    ) {
      throw createPrivateClickEventDelegationAcceptedListenerOrderError(
        'Private click event delegation accepted listener order target metadata does not match the click dispatch target.',
        'target-record-mismatch'
      );
    }
  }

  if (
    options.requireRootRenderMetadata &&
    targetRecord.rootRenderMetadataStatus !==
      'active-private-root-render-host-output'
  ) {
    throw createPrivateClickEventDelegationAcceptedListenerOrderError(
      'Private click event delegation accepted listener order requires active root-render host-output metadata.',
      'target-record-not-root-render-host-output'
    );
  }

  return Object.freeze({
    available: true,
    recordKind: targetRecord.kind,
    rootRenderHostOutputActive:
      targetRecord.rootRenderHostOutputActive === true,
    rootRenderMetadataAvailable:
      targetRecord.rootRenderMetadataAvailable === true,
    rootRenderMetadataStatus:
      targetRecord.rootRenderMetadataStatus || 'unknown',
    status: targetRecord.status
  });
}

function validatePrivateClickEventDelegationAcceptedListenerOrderOwnerRoots(
  dispatchRecords,
  listenerQueueEntryRecords
) {
  const primaryDispatchRecord = dispatchRecords[0];
  const primaryDispatchPathRecord =
    primaryDispatchRecord.targetDispatchPathRecord;
  const ownerRoot = primaryDispatchPathRecord.rootOwner;
  const ownerRootRequired = ownerRoot !== null;

  if (!ownerRootRequired) {
    return Object.freeze({
      acceptedListenerOwnerRootMatchCount: 0,
      acceptedListenerOwnerRootMismatchCount: 0,
      dispatchRecordOwnerRootMatchCount: 0,
      dispatchRecordOwnerRootMismatchCount: 0,
      ownerRootPreserved: false,
      ownerRootRequired: false,
      status: 'unavailable-no-click-owner-root',
      targetDispatchPathOwnerRootPreserved: false,
      targetRootOwnerMatchCount: 0,
      targetRootOwnerMismatchCount: 0
    });
  }

  let dispatchRecordOwnerRootMatchCount = 0;
  let dispatchRecordOwnerRootMismatchCount = 0;
  for (const dispatchRecord of dispatchRecords) {
    const dispatchPathRecord = dispatchRecord.targetDispatchPathRecord;
    if (
      dispatchPathRecord.rootOwner === ownerRoot &&
      dispatchPathRecord.targetInst === primaryDispatchPathRecord.targetInst &&
      dispatchRecord.targetInst === primaryDispatchRecord.targetInst &&
      dispatchRecord.nativeEventTarget ===
        primaryDispatchRecord.nativeEventTarget
    ) {
      dispatchRecordOwnerRootMatchCount++;
    } else {
      dispatchRecordOwnerRootMismatchCount++;
    }
  }

  if (dispatchRecordOwnerRootMismatchCount !== 0) {
    throw createPrivateClickEventDelegationAcceptedListenerOrderError(
      'Private click event delegation accepted listener order requires dispatch records from one owner root and event target.',
      'foreign-owner-root'
    );
  }

  let acceptedListenerOwnerRootMatchCount = 0;
  let acceptedListenerOwnerRootMismatchCount = 0;
  for (const listenerQueueEntryRecord of listenerQueueEntryRecords) {
    const queueEntryPayload = getPrivateEventListenerQueueEntryPayload(
      listenerQueueEntryRecord
    );
    const listenerOwnerRoot =
      queueEntryPayload === null
        ? null
        : getRootOwnerFromNode(queueEntryPayload.target);

    if (listenerOwnerRoot === ownerRoot) {
      acceptedListenerOwnerRootMatchCount++;
    } else if (listenerOwnerRoot === null) {
      throw createPrivateClickEventDelegationAcceptedListenerOrderError(
        'Private click event delegation accepted listener order rejected listener target metadata that is no longer mounted.',
        'stale-listener-record'
      );
    } else {
      acceptedListenerOwnerRootMismatchCount++;
    }
  }

  if (acceptedListenerOwnerRootMismatchCount !== 0) {
    throw createPrivateClickEventDelegationAcceptedListenerOrderError(
      'Private click event delegation accepted listener order rejected listener queue entries from a foreign owner root.',
      'foreign-owner-root'
    );
  }

  const targetRootOwnerMatchCount =
    typeof primaryDispatchPathRecord.targetRootOwnerMatchCount === 'number'
      ? primaryDispatchPathRecord.targetRootOwnerMatchCount
      : 0;
  const targetRootOwnerMismatchCount =
    typeof primaryDispatchPathRecord.targetRootOwnerMismatchCount === 'number'
      ? primaryDispatchPathRecord.targetRootOwnerMismatchCount
      : 0;
  const targetDispatchPathOwnerRootPreserved =
    primaryDispatchPathRecord.length > 0 &&
    targetRootOwnerMatchCount === primaryDispatchPathRecord.length &&
    targetRootOwnerMismatchCount === 0;

  return Object.freeze({
    acceptedListenerOwnerRootMatchCount,
    acceptedListenerOwnerRootMismatchCount,
    dispatchRecordOwnerRootMatchCount,
    dispatchRecordOwnerRootMismatchCount,
    ownerRootPreserved: targetDispatchPathOwnerRootPreserved,
    ownerRootRequired,
    status: 'validated-private-click-owner-root',
    targetDispatchPathOwnerRootPreserved,
    targetRootOwnerMatchCount,
    targetRootOwnerMismatchCount
  });
}

function collectPrivateClickEventDelegationAcceptedListenerOrderSelections(
  dispatchRecords,
  listenerQueueEntryRecords
) {
  const acceptedRecords = new Set(listenerQueueEntryRecords);
  const selectedRecords = new Set();
  const selections = [];

  for (
    let dispatchRecordIndex = 0;
    dispatchRecordIndex < dispatchRecords.length;
    dispatchRecordIndex++
  ) {
    const dispatchRecord = dispatchRecords[dispatchRecordIndex];

    for (
      let dispatchQueueEntryIndex = 0;
      dispatchQueueEntryIndex < dispatchRecord.dispatchQueue.entries.length;
      dispatchQueueEntryIndex++
    ) {
      const dispatchQueueEntry = assertDispatchQueueEntryRecord(
        dispatchRecord.dispatchQueue.entries[dispatchQueueEntryIndex]
      );
      const entryPayload =
        getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
      const listenerRecords =
        entryPayload === null ? [] : entryPayload.processingListenerRecords;

      for (
        let listenerIndex = 0;
        listenerIndex < listenerRecords.length;
        listenerIndex++
      ) {
        const dispatchListenerRecord = listenerRecords[listenerIndex];
        const listenerPayload =
          getDispatchListenerRecordPayload(dispatchListenerRecord);
        const listenerQueueEntryRecord =
          listenerPayload === null
            ? null
            : listenerPayload.privateEventListenerQueueEntryRecord;

        if (!acceptedRecords.has(listenerQueueEntryRecord)) {
          continue;
        }
        if (selectedRecords.has(listenerQueueEntryRecord)) {
          throw createPrivateClickEventDelegationAcceptedListenerOrderError(
            'Private click event delegation accepted listener order found the same accepted listener more than once in the dispatch path.',
            'duplicate-listener-record'
          );
        }

        const normalizedListenerRecord =
          assertPrivateClickEventDelegationDispatchListenerRecord(
            dispatchListenerRecord,
            dispatchRecord
          );
        assertFreshPrivateClickEventDelegationListenerRecord(
          normalizedListenerRecord
        );
        selectedRecords.add(listenerQueueEntryRecord);
        selections.push(
          Object.freeze({
            dispatchListenerRecord: normalizedListenerRecord,
            dispatchQueueEntry,
            dispatchQueueEntryIndex,
            dispatchRecord,
            dispatchRecordIndex,
            listenerIndex,
            listenerQueueEntryRecord
          })
        );
      }
    }
  }

  if (selectedRecords.size !== acceptedRecords.size) {
    throw createPrivateClickEventDelegationAcceptedListenerOrderError(
      'Private click event delegation accepted listener order could not route every accepted listener through the click dispatch queue.',
      'accepted-listener-not-on-dispatch-path'
    );
  }

  return Object.freeze(selections);
}

function assertFreshPrivateClickEventDelegationListenerRecord(
  dispatchListenerRecord
) {
  const listenerPayload =
    getDispatchListenerRecordPayload(dispatchListenerRecord);
  const queueEntryRecord =
    listenerPayload === null
      ? null
      : listenerPayload.privateEventListenerQueueEntryRecord;
  const queueEntryPayload =
    getPrivateEventListenerQueueEntryPayload(queueEntryRecord);

  if (
    listenerPayload === null ||
    queueEntryPayload === null ||
    queueEntryPayload.active !== true
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch rejected a stale listener record.',
      'stale-listener-record'
    );
  }
  if (
    queueEntryPayload.target !== dispatchListenerRecord.currentTarget ||
    queueEntryPayload.listener !== listenerPayload.listener
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch listener metadata no longer matches the accepted registry record.',
      'stale-listener-record'
    );
  }
  if (queueEntryPayload.domEventName !== 'click') {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch only accepts click listener registry records.',
      'unsupported-event-type'
    );
  }
  if (queueEntryPayload.capture !== dispatchListenerRecord.inCapturePhase) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch listener registry phase does not match the dispatch phase.',
      'unsupported-event-phase'
    );
  }

  return {
    listenerPayload,
    queueEntryPayload,
    queueEntryRecord
  };
}

function findPrivateClickEventDelegationDispatchListenerSelection(
  dispatchRecord,
  dispatchListenerRecord
) {
  for (
    let dispatchQueueEntryIndex = 0;
    dispatchQueueEntryIndex < dispatchRecord.dispatchQueue.entries.length;
    dispatchQueueEntryIndex++
  ) {
    const dispatchQueueEntry = assertDispatchQueueEntryRecord(
      dispatchRecord.dispatchQueue.entries[dispatchQueueEntryIndex]
    );
    const entryPayload =
      getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
    const processingIndex =
      entryPayload.processingListenerRecords.indexOf(dispatchListenerRecord);
    if (processingIndex !== -1) {
      return {
        dispatchQueueEntry,
        dispatchQueueEntryIndex,
        listenerIndex: processingIndex,
        selectedFromProcessingOrder: true
      };
    }

    const listenerIndex =
      entryPayload.listenerRecords.indexOf(dispatchListenerRecord);
    if (listenerIndex !== -1) {
      return {
        dispatchQueueEntry,
        dispatchQueueEntryIndex,
        listenerIndex,
        selectedFromProcessingOrder: false
      };
    }
  }

  throw createPrivateClickEventDelegationDispatchGateError(
    'Private click event delegation dispatch rejected a listener record that is no longer part of the plugin extraction queue.',
    'stale-listener-record'
  );
}

function validatePrivateClickEventDelegationPortalOwnerRootGate(
  dispatchRecord,
  portalEventOwnerRootGateRecord
) {
  if (portalEventOwnerRootGateRecord === null) {
    return Object.freeze({
      available: false,
      dispatchPathRootOwnerMatchCount: 0,
      dispatchPathRootOwnerMismatchCount: 0,
      ownerRootMatchesTargetRoot: false,
      ownerRootPreservedAcrossPortalContainerRoot: false,
      ownerRootPreservedAcrossSecondaryPortalRoot: false,
      portalContainerContainsTarget: false,
      portalContainerMatchesDispatchRootBoundary: false,
      portalContainerOwnedBySecondaryRoot: false,
      portalContainerRootBoundaryStatus:
        'unavailable-no-portal-owner-root-gate',
      portalContainerRootOwnerMatchesPortalOwner: null,
      portalContainerRootOwnerPresent: false,
      publicPortalBubblingEnabled: false,
      recordKind: null,
      rootContainerContainsTarget: false,
      status: 'unavailable-no-portal-owner-root-gate',
      targetDispatchPathLength: 0,
      targetDispatchPathStatus: 'unavailable-no-portal-owner-root-gate',
      targetInstStatus: 'not-applicable'
    });
  }

  const portalPayload = getPortalEventOwnerRootGateRecordPayload(
    portalEventOwnerRootGateRecord
  );
  if (portalPayload === null) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch requires a known portal owner-root gate record.',
      'invalid-portal-owner-root-gate-record'
    );
  }

  if (
    portalEventOwnerRootGateRecord.status !==
      PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS ||
    portalEventOwnerRootGateRecord.ownerRootMatchesTargetRoot !== true ||
    portalEventOwnerRootGateRecord.dispatchPathRootOwnerMismatchCount !== 0 ||
    portalEventOwnerRootGateRecord.portalContainerContainsTarget !== true ||
    portalEventOwnerRootGateRecord.publicPortalBubblingEnabled !== false ||
    portalEventOwnerRootGateRecord.publicDispatchEnabled !== false ||
    portalEventOwnerRootGateRecord.targetInst !== dispatchRecord.targetInst ||
    portalPayload.targetDispatchPathRecord.targetInst !==
      dispatchRecord.targetInst ||
    portalPayload.targetDispatchPathRecord.rootOwner !==
      dispatchRecord.targetDispatchPathRecord.rootOwner
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch rejected portal owner-root metadata that does not match the click target.',
      'portal-owner-root-mismatch'
    );
  }
  assertPrivateClickEventDelegationPortalDispatchPath(
    dispatchRecord.targetDispatchPathRecord,
    portalPayload.targetDispatchPathRecord
  );

  return Object.freeze({
    available: true,
    blockedReason: portalEventOwnerRootGateRecord.blockedReason,
    dispatchPathRootOwnerMatchCount:
      portalEventOwnerRootGateRecord.dispatchPathRootOwnerMatchCount,
    dispatchPathRootOwnerMismatchCount:
      portalEventOwnerRootGateRecord.dispatchPathRootOwnerMismatchCount,
    ownerRootMatchesTargetRoot:
      portalEventOwnerRootGateRecord.ownerRootMatchesTargetRoot,
    ownerRootPreservedAcrossPortalContainerRoot:
      portalEventOwnerRootGateRecord.ownerRootPreservedAcrossPortalContainerRoot,
    ownerRootPreservedAcrossSecondaryPortalRoot:
      portalEventOwnerRootGateRecord.ownerRootPreservedAcrossSecondaryPortalRoot,
    portalContainerContainsTarget:
      portalEventOwnerRootGateRecord.portalContainerContainsTarget,
    portalContainerMatchesDispatchRootBoundary:
      portalEventOwnerRootGateRecord.portalContainerMatchesDispatchRootBoundary,
    portalContainerOwnedBySecondaryRoot:
      portalEventOwnerRootGateRecord.portalContainerOwnedBySecondaryRoot,
    portalContainerRootBoundaryStatus:
      portalEventOwnerRootGateRecord.portalContainerRootBoundaryStatus,
    portalContainerRootOwnerMatchesPortalOwner:
      portalEventOwnerRootGateRecord.portalContainerRootOwnerMatchesPortalOwner,
    portalContainerRootOwnerPresent:
      portalEventOwnerRootGateRecord.portalContainerRootOwnerPresent,
    publicPortalBubblingEnabled:
      portalEventOwnerRootGateRecord.publicPortalBubblingEnabled,
    recordKind: portalEventOwnerRootGateRecord.kind,
    rootContainerContainsTarget:
      portalEventOwnerRootGateRecord.rootContainerContainsTarget,
    status: portalEventOwnerRootGateRecord.status,
    targetDispatchPathLength:
      portalEventOwnerRootGateRecord.targetDispatchPathLength,
    targetDispatchPathStatus:
      portalEventOwnerRootGateRecord.targetDispatchPathStatus,
    targetInstStatus: portalEventOwnerRootGateRecord.targetInstStatus
  });
}

function assertPrivateClickEventDelegationPortalDispatchPath(
  dispatchPathRecord,
  portalDispatchPathRecord
) {
  if (
    !isObjectLike(dispatchPathRecord) ||
    !Array.isArray(dispatchPathRecord.entries) ||
    !isObjectLike(portalDispatchPathRecord) ||
    !Array.isArray(portalDispatchPathRecord.entries) ||
    dispatchPathRecord.entries.length !==
      portalDispatchPathRecord.entries.length
  ) {
    throw createPrivateClickEventDelegationDispatchGateError(
      'Private click event delegation dispatch rejected portal owner-root metadata whose dispatch path does not match the click target.',
      'portal-owner-root-mismatch'
    );
  }

  for (let index = 0; index < dispatchPathRecord.entries.length; index++) {
    const dispatchEntry = dispatchPathRecord.entries[index];
    const portalEntry = portalDispatchPathRecord.entries[index];
    if (
      !isObjectLike(dispatchEntry) ||
      !isObjectLike(portalEntry) ||
      dispatchEntry.targetHostInstanceToken !==
        portalEntry.targetHostInstanceToken ||
      dispatchEntry.targetHostInstanceNode !==
        portalEntry.targetHostInstanceNode ||
      dispatchEntry.rootOwner !== portalEntry.rootOwner
    ) {
      throw createPrivateClickEventDelegationDispatchGateError(
        'Private click event delegation dispatch rejected portal owner-root metadata whose dispatch path entries do not match the click target.',
        'portal-owner-root-mismatch'
      );
    }
  }
}

function createPrivateClickEventDelegationDispatchGateError(
  message,
  reason
) {
  const error = createPluginEventSystemError(
    message,
    INVALID_PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE
  );
  error.reason = reason;
  return error;
}

function createPrivateClickEventDelegationAcceptedListenerOrderError(
  message,
  reason
) {
  const error = createPluginEventSystemError(
    message,
    INVALID_PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_CODE
  );
  error.reason = reason;
  return error;
}

function assertDispatchQueueEntryRecord(record) {
  if (!isDispatchQueueEntryRecord(record)) {
    throw createPluginEventSystemError(
      'Cannot invoke a React DOM event listener canary without a private dispatch queue entry record.',
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  return record;
}

function assertDispatchListenerRecord(record) {
  if (!isDispatchListenerRecord(record)) {
    throw createPluginEventSystemError(
      'Cannot invoke a React DOM event listener canary without a private dispatch listener record.',
      INVALID_DISPATCH_LISTENER_RECORD_CODE
    );
  }

  return record;
}

function normalizePortalEventOwnerRootGateOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const ownerRoot = normalizedOptions.ownerRoot;
  if (!isObjectLike(ownerRoot)) {
    throw createPluginEventSystemError(
      'Portal event owner-root diagnostics require an owner root.',
      INVALID_PORTAL_EVENT_OWNER_ROOT_GATE_CODE
    );
  }

  const hostFiberPath = Array.isArray(normalizedOptions.hostFiberPath)
    ? normalizedOptions.hostFiberPath.map((part) => String(part))
    : ['HostRoot', 'HostPortal', 'HostComponent'];

  return {
    domEventName:
      typeof normalizedOptions.domEventName === 'string'
        ? normalizedOptions.domEventName
        : 'click',
    hostFiberPath,
    ownerRoot,
    portalContainer: isObjectLike(normalizedOptions.portalContainer)
      ? normalizedOptions.portalContainer
      : null,
    portalKey:
      normalizedOptions.portalKey === null ||
      typeof normalizedOptions.portalKey === 'string'
        ? normalizedOptions.portalKey
        : null,
    rawOptions: options,
    rootContainer: isObjectLike(normalizedOptions.rootContainer)
      ? normalizedOptions.rootContainer
      : null,
    sourceGateId:
      typeof normalizedOptions.sourceGateId === 'string'
        ? normalizedOptions.sourceGateId
        : null
  };
}

function createPortalOwnerRootEventPath(targetDispatchPathRecord, ownerRoot) {
  return Object.freeze(
    targetDispatchPathRecord.entries.map((entry) =>
      Object.freeze({
        kind: 'FastReactDomPortalOwnerRootEventPathEntryRecord',
        index: entry.index,
        componentTreeStatus: entry.componentTreeStatus,
        eventDispatch: false,
        isDirectEventTarget: entry.isDirectEventTarget,
        isTargetHostInstance: entry.isTargetHostInstance,
        latestPropsStatus: entry.latestPropsStatus,
        listenerInvocationCount: 0,
        nodeType: entry.nodeType,
        publicDispatchEnabled: false,
        publicPortalBubblingEnabled: false,
        rootOwnerMatchesPortalOwner: entry.rootOwner === ownerRoot,
        syntheticEventCount: 0,
        targetHostInstanceStatus: entry.targetHostInstanceStatus
      })
    )
  );
}

function createPortalContainerRootBoundaryDiagnostic(
  targetDispatchPathRecord,
  portalContainer,
  ownerRoot
) {
  const containerRootBoundaryNode =
    targetDispatchPathRecord.containerRootBoundaryNode || null;
  const portalContainerMatchesDispatchRootBoundary =
    containerRootBoundaryNode !== null &&
    containerRootBoundaryNode === portalContainer;
  const portalContainerRootOwner = portalContainerMatchesDispatchRootBoundary
    ? targetDispatchPathRecord.containerRootBoundaryOwner || null
    : null;
  const portalContainerRootOwnerPresent =
    portalContainerRootOwner !== null;
  const portalContainerRootOwnerMatchesPortalOwner =
    portalContainerRootOwnerPresent
      ? portalContainerRootOwner === ownerRoot
      : null;
  const ownerRootPreservedAcrossPortalContainerRoot =
    portalContainerMatchesDispatchRootBoundary &&
    targetDispatchPathRecord.ownerRootPreservedAcrossContainerRoot === true;
  const ownerRootPreservedAcrossSecondaryPortalRoot =
    portalContainerMatchesDispatchRootBoundary &&
    targetDispatchPathRecord.ownerRootPreservedAcrossForeignContainerRoot ===
      true;

  return Object.freeze({
    containerRootBoundaryStatus:
      targetDispatchPathRecord.containerRootBoundaryStatus ||
      'unknown-container-root-boundary',
    delegatedEventHandoffOwnerRootPreserved:
      ownerRootPreservedAcrossPortalContainerRoot,
    kind: 'FastReactDomPortalContainerRootBoundaryRecord',
    ownerRootPreservedAcrossPortalContainerRoot,
    ownerRootPreservedAcrossSecondaryPortalRoot,
    portalContainerMatchesDispatchRootBoundary,
    portalContainerOwnedBySecondaryRoot:
      portalContainerRootOwnerMatchesPortalOwner === false,
    portalContainerRootOwner,
    portalContainerRootOwnerMatchesPortalOwner,
    portalContainerRootOwnerPresent,
    publicDispatchEnabled: false,
    publicPortalBubblingEnabled: false
  });
}

function createPortalContainerPathDiagnostic(
  portalContainer,
  rootContainer,
  targetNode,
  targetDispatchPathEntries,
  ownerRoot
) {
  const pathNodes = [];
  const visitedNodes = new Set();
  let current = isObjectLike(targetNode) ? targetNode : null;
  let portalContainerPathIndex = -1;
  let rootContainerPathIndex = -1;

  while (current !== null && !visitedNodes.has(current)) {
    visitedNodes.add(current);
    const index = pathNodes.length;
    pathNodes.push(current);

    if (current === portalContainer && portalContainerPathIndex === -1) {
      portalContainerPathIndex = index;
    }
    if (current === rootContainer && rootContainerPathIndex === -1) {
      rootContainerPathIndex = index;
      break;
    }

    current = isObjectLike(current.parentNode) ? current.parentNode : null;
  }

  const pathEntries = Object.freeze(
    pathNodes.map((node, index) =>
      createPortalContainerPathEntry(
        node,
        index,
        portalContainer,
        rootContainer,
        targetNode,
        targetDispatchPathEntries,
        ownerRoot
      )
    )
  );
  const rootOwnerMatchCount = pathEntries.filter(
    (entry) => entry.rootOwnerMatchesPortalOwner
  ).length;
  const rootOwnerMismatchCount = pathEntries.filter(
    (entry) => entry.rootOwnerMatchesPortalOwner === false
  ).length;
  const portalContainerFound = portalContainerPathIndex !== -1;
  const rootContainerFound = rootContainerPathIndex !== -1;
  const portalContainerNestedInRootContainer =
    portalContainerFound &&
    rootContainerFound &&
    portalContainer !== rootContainer &&
    portalContainerPathIndex < rootContainerPathIndex;

  return {
    nodes: Object.freeze(pathNodes.slice()),
    record: Object.freeze({
      kind: 'FastReactDomPortalContainerEventPathRecord',
      entries: pathEntries,
      length: pathEntries.length,
      ownerRootPathIntersectsPortalContainerPath:
        rootOwnerMatchCount + rootOwnerMismatchCount > 0,
      portalContainerFound,
      portalContainerInfo: isObjectLike(portalContainer)
        ? Object.freeze(describeContainer(portalContainer))
        : null,
      portalContainerNestedInRootContainer,
      portalContainerParentInfo:
        isObjectLike(portalContainer) &&
        isObjectLike(portalContainer.parentNode)
          ? Object.freeze(describeContainer(portalContainer.parentNode))
          : null,
      portalContainerPathIndex,
      publicDispatchEnabled: false,
      publicPortalBubblingEnabled: false,
      rootContainerFound,
      rootContainerPathIndex,
      rootOwnerMatchCount,
      rootOwnerMismatchCount,
      status: getPortalContainerPathStatus({
        portalContainer,
        portalContainerFound,
        portalContainerPathIndex,
        rootContainer,
        rootContainerFound,
        rootContainerPathIndex,
        targetNode
      }),
      targetNodeInfo: isObjectLike(targetNode)
        ? Object.freeze(describeContainer(targetNode))
        : null
    })
  };
}

function createPortalContainerPathEntry(
  node,
  index,
  portalContainer,
  rootContainer,
  targetNode,
  targetDispatchPathEntries,
  ownerRoot
) {
  const ownerRootPathEntry =
    targetDispatchPathEntries.find(
      (pathEntry) => pathEntry.targetHostInstanceNode === node
    ) || null;

  return Object.freeze({
    kind: 'FastReactDomPortalContainerEventPathEntryRecord',
    index,
    nodeInfo: Object.freeze(describeContainer(node)),
    isEventTarget: node === targetNode,
    isPortalContainer: node === portalContainer,
    isRootContainer: node === rootContainer,
    ownerRootDispatchPathIndex:
      ownerRootPathEntry === null ? null : ownerRootPathEntry.index,
    ownerRootPathEntryFound: ownerRootPathEntry !== null,
    publicDispatchEnabled: false,
    publicPortalBubblingEnabled: false,
    rootOwnerMatchesPortalOwner:
      ownerRootPathEntry === null
        ? null
        : ownerRootPathEntry.rootOwner === ownerRoot
  });
}

function getPortalContainerPathStatus({
  portalContainer,
  portalContainerFound,
  portalContainerPathIndex,
  rootContainer,
  rootContainerFound,
  rootContainerPathIndex,
  targetNode
}) {
  if (!isObjectLike(targetNode)) {
    return 'no-event-target-node';
  }
  if (!isObjectLike(portalContainer)) {
    return 'no-portal-container';
  }
  if (!portalContainerFound) {
    return 'portal-container-not-on-target-path';
  }
  if (portalContainer === rootContainer) {
    return 'portal-container-is-root-container';
  }
  if (
    rootContainerFound &&
    portalContainerPathIndex < rootContainerPathIndex
  ) {
    return 'portal-container-path-to-root-container';
  }
  return 'portal-container-path-without-root-container';
}

function describePortalOwnerRoot(ownerRoot) {
  if (!isObjectLike(ownerRoot)) {
    return {
      kind: String(ownerRoot),
      rootId: null,
      rootKind: null,
      rootTag: null
    };
  }

  return {
    kind: typeof ownerRoot.kind === 'string' ? ownerRoot.kind : 'object',
    rootId:
      typeof ownerRoot.rootId === 'string' ? ownerRoot.rootId : null,
    rootKind:
      typeof ownerRoot.rootKind === 'string' ? ownerRoot.rootKind : null,
    rootTag:
      typeof ownerRoot.rootTag === 'string' ||
      typeof ownerRoot.rootTag === 'number'
        ? ownerRoot.rootTag
        : null
  };
}

function isInclusiveAncestor(ancestor, targetNode) {
  if (!isObjectLike(ancestor) || !isObjectLike(targetNode)) {
    return false;
  }

  let current = targetNode;
  while (isObjectLike(current)) {
    if (current === ancestor) {
      return true;
    }
    current = isObjectLike(current.parentNode) ? current.parentNode : null;
  }

  return false;
}

function normalizeSingleListenerCanaryOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};

  return {
    dispatchQueueEntryIndex: normalizeNonNegativeInteger(
      normalizedOptions.dispatchQueueEntryIndex,
      0,
      'dispatchQueueEntryIndex'
    ),
    listenerIndex: normalizeNonNegativeInteger(
      normalizedOptions.listenerIndex,
      0,
      'listenerIndex'
    ),
    useProcessingOrder: normalizedOptions.useProcessingOrder !== false
  };
}

function normalizeDispatchRecordList(dispatchRecords) {
  if (Array.isArray(dispatchRecords)) {
    return dispatchRecords.map((dispatchRecord) =>
      assertEventDispatchRecord(dispatchRecord)
    );
  }

  return [assertEventDispatchRecord(dispatchRecords)];
}

function normalizeNonNegativeInteger(value, fallback, fieldName) {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw createPluginEventSystemError(
      `Expected ${fieldName} to be a non-negative integer.`,
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  return value;
}

function describeReturnValue(value) {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  return typeof value;
}

function createPluginExtractionRecord(
  wrapperRecord,
  nativeEvent,
  nativeEventTarget,
  targetNormalizationRecord,
  targetListenerLookupRecord,
  targetDispatchPathRecord
) {
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const resolvedTargetDispatchPathRecord =
    targetDispatchPathRecord === undefined
      ? createEventTargetDispatchPathRecord(targetNormalizationRecord)
      : targetDispatchPathRecord;
  const simpleEventDispatchMetadata = createSimpleEventDispatchMetadata(
    wrapperRecord,
    nativeEvent,
    nativeEventTarget,
    targetNormalizationRecord,
    resolvedTargetDispatchPathRecord
  );
  const dispatchQueue = simpleEventDispatchMetadata.dispatchQueue;
  const resolvedTargetListenerLookupRecord =
    targetListenerLookupRecord === undefined
      ? simpleEventDispatchMetadata.targetListenerLookupRecord
      : targetListenerLookupRecord;

  return Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    blockedReason: PLUGIN_EXTRACTION_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    dispatchQueue,
    domEventName: wrapperRecord.domEventName,
    eventSystemFlags,
    inCapturePhase: isCapturePhase(eventSystemFlags),
    kind: PLUGIN_EXTRACTION_RECORD_KIND,
    listenerInvocationCount: 0,
    nativeEventTarget,
    nativeEventType: getNativeEventType(nativeEvent, wrapperRecord.domEventName),
    pluginRecords: createPluginRecords(eventSystemFlags, dispatchQueue),
    publicRootBehaviorChanged: false,
    shouldProcessPolyfillPlugins:
      shouldProcessPolyfillEventPlugins(eventSystemFlags),
    status: 'blocked',
    syntheticEventCount: 0,
    targetContainer: wrapperRecord.targetContainer,
    targetDispatchPathRecord: resolvedTargetDispatchPathRecord,
    targetDispatchPathStatus: resolvedTargetDispatchPathRecord.status,
    targetDispatchPathLength: resolvedTargetDispatchPathRecord.length,
    targetInst: resolvedTargetDispatchPathRecord.targetInst,
    targetInstStatus: resolvedTargetDispatchPathRecord.targetInstStatus,
    targetListenerFound:
      resolvedTargetListenerLookupRecord === null
        ? false
        : resolvedTargetListenerLookupRecord.listenerFound,
    targetListenerLookupRecord: resolvedTargetListenerLookupRecord,
    targetListenerLookupRecords:
      simpleEventDispatchMetadata.targetListenerLookupRecords,
    targetListenerLookupCount:
      simpleEventDispatchMetadata.targetListenerLookupRecords.length,
    targetListenerLookupStatus:
      resolvedTargetListenerLookupRecord === null
        ? 'not-applicable'
        : resolvedTargetListenerLookupRecord.listenerStatus,
    targetListenerRegistrationName:
      resolvedTargetListenerLookupRecord === null
        ? null
        : resolvedTargetListenerLookupRecord.registrationName,
    targetNormalizationRecord,
    willInvokeListeners: false
  });
}

function createHydrationReplayRecord() {
  return Object.freeze({
    blockedOn: null,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    queued: false,
    status: 'blocked'
  });
}

function createControlledStateRestoreRecord() {
  return Object.freeze({
    blockedReason: CONTROLLED_STATE_RESTORE_BLOCKED_CODE,
    scheduled: false,
    status: 'blocked'
  });
}

function createHydrationReplayEventQueueDiagnostic(dispatchRecords, options) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const source =
    typeof normalizedOptions.source === 'string'
      ? normalizedOptions.source
      : 'private-event-dispatch-records';
  const normalizedDispatchRecords =
    normalizeHydrationReplayDispatchRecords(dispatchRecords);
  const markerReplayTargetCandidates = Object.freeze(
    Array.isArray(normalizedOptions.markerReplayTargetCandidates)
      ? normalizedOptions.markerReplayTargetCandidates.slice()
      : []
  );
  const sourceDehydratedTargetResolution =
    normalizedOptions.dehydratedTargetResolution ||
    normalizedOptions.targetResolutionDiagnostics;
  const dehydratedTargetResolutionDiagnostics =
    normalizedDispatchRecords.length === 0 &&
    sourceDehydratedTargetResolution !== undefined &&
    sourceDehydratedTargetResolution !== null
      ? getSourceDehydratedTargetResolutionDiagnostic({
          dehydratedTargetResolution: sourceDehydratedTargetResolution
        })
      : createHydrationDehydratedTargetResolutionDiagnostic(
          normalizedDispatchRecords,
          {
            dehydratedTargetResolution: sourceDehydratedTargetResolution,
            markerReplayTargetCandidates,
            source
          }
        );
  const hydratableEventTargetLookups = Array.isArray(
    dehydratedTargetResolutionDiagnostics.hydratableEventTargetLookups
  )
    ? dehydratedTargetResolutionDiagnostics.hydratableEventTargetLookups
    : [];
  const blockedEventReplayTargets = Object.freeze(
    normalizedDispatchRecords.map((dispatchRecord, index) =>
      createHydrationReplayEventQueueEntryRecord(
        dispatchRecord,
        index,
        hydratableEventTargetLookups[index] || null
      )
    )
  );
  const replayQueueDrainOrderDiagnostics =
    createHydrationReplayQueueDrainOrderDiagnostic(
      blockedEventReplayTargets,
      {
        dehydratedTargetResolutionDiagnostics,
        source
      }
    );

  const record = Object.freeze({
    kind: HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND,
    status:
      blockedEventReplayTargets.length === 0
        ? 'blocked-no-event-replay-targets-recorded'
        : 'blocked-event-replay-targets-recorded',
    source:
      source,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    hostInstanceHydrationAttempted: false,
    hasScheduledReplayAttempt: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    markerReplayTargetCandidateCount: markerReplayTargetCandidates.length,
    markerReplayTargetCandidates,
    dehydratedTargetResolutionDiagnostics,
    targetResolutionDiagnosticsAccepted:
      dehydratedTargetResolutionDiagnostics.kind ===
      HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND,
    dehydratedRootOwnerStatus:
      dehydratedTargetResolutionDiagnostics.dehydratedRootOwner.status,
    dehydratedBoundaryOwnerCount:
      dehydratedTargetResolutionDiagnostics.dehydratedBoundaryOwnerCount,
    hydratableEventTargetLookupCount:
      dehydratedTargetResolutionDiagnostics.hydratableEventTargetLookupCount,
    eventDispatchRecordCount: normalizedDispatchRecords.length,
    blockedEventReplayTargetCount: blockedEventReplayTargets.length,
    queuedEventReplayTargetCount: 0,
    replayedEventCount: 0,
    eventQueueOrder:
      createHydrationReplayEventQueueOrder(blockedEventReplayTargets),
    priorityQueueOrder:
      createHydrationReplayEventPriorityOrder(blockedEventReplayTargets),
    replayQueueDrainOrderDiagnostics,
    drainOrderDiagnosticsAccepted:
      replayQueueDrainOrderDiagnostics.kind ===
      HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND,
    drainOrderCount: replayQueueDrainOrderDiagnostics.drainOrderCount,
    drainOrder: replayQueueDrainOrderDiagnostics.drainOrder,
    blockedEventReplayTargets
  });

  hydrationReplayEventQueueDiagnosticPayloads.set(
    record,
    Object.freeze({
      blockedEventReplayTargets,
      dehydratedTargetResolutionDiagnostics,
      dispatchRecords: normalizedDispatchRecords,
      hydratableEventTargetLookups,
      markerReplayTargetCandidates,
      replayQueueDrainOrderDiagnostics
    })
  );

  return record;
}

function createHydrationReplayTargetDispatchLinkDiagnostic(
  eventReplayQueueDiagnostics,
  dispatchRecord,
  options
) {
  const normalizedQueueDiagnostics =
    assertHydrationReplayEventQueueDiagnostic(eventReplayQueueDiagnostics);
  const normalizedDispatchRecord = assertEventDispatchRecord(dispatchRecord);
  const queuePayload =
    hydrationReplayEventQueueDiagnosticPayloads.get(
      normalizedQueueDiagnostics
    );
  const normalizedOptions = isObjectLike(options) ? options : {};
  const targetDispatchPathRecord =
    normalizedOptions.targetDispatchPathRecord === undefined
      ? normalizedDispatchRecord.targetDispatchPathRecord
      : normalizedOptions.targetDispatchPathRecord;
  const normalizedDispatchPathRecord =
    assertHydrationReplayTargetDispatchPathRecord(
      targetDispatchPathRecord,
      normalizedDispatchRecord
    );

  assertHydrationReplayTargetDispatchLinkDispatchBlocked(
    normalizedDispatchRecord
  );

  const replayQueueEntry =
    resolveHydrationReplayTargetDispatchLinkEntry(
      normalizedQueueDiagnostics,
      queuePayload,
      normalizedDispatchRecord,
      normalizedOptions
    );
  const hydratableEventTargetLookup =
    resolveHydrationReplayTargetDispatchLinkLookup(
      queuePayload,
      replayQueueEntry
    );

  assertHydrationReplayTargetDispatchLinkOwnership(
    replayQueueEntry,
    hydratableEventTargetLookup
  );

  const eventPathEntries =
    createHydrationReplayTargetDispatchLinkEventPathEntries(
      normalizedDispatchPathRecord
    );
  const dispatchBlockerMetadata =
    createHydrationReplayTargetDispatchBlockerMetadata(
      normalizedDispatchRecord
    );
  const record = Object.freeze({
    kind: HYDRATION_REPLAY_TARGET_DISPATCH_LINK_DIAGNOSTIC_KIND,
    status: PRIVATE_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_STATUS,
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-replay-target-dispatch-link',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    hostInstanceHydrationAttempted: false,
    hasScheduledReplayAttempt: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    eventDispatch: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    queued: false,
    replayQueueDrained: false,
    publicDispatchEnabled: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    eventReplayQueueDiagnostics: normalizedQueueDiagnostics,
    eventReplayQueueDiagnosticsAccepted: true,
    targetResolutionDiagnosticsAccepted:
      normalizedQueueDiagnostics.targetResolutionDiagnosticsAccepted === true,
    replayQueueEntry,
    replayQueueEntryStatus: replayQueueEntry.status,
    inputOrder: replayQueueEntry.inputOrder,
    replayQueueOrder: replayQueueEntry.replayQueueOrder,
    prioritySortKey: replayQueueEntry.prioritySortKey,
    domEventName: replayQueueEntry.domEventName,
    nativeEventType: replayQueueEntry.nativeEventType,
    queueCategory: replayQueueEntry.queueCategory,
    queueName: replayQueueEntry.queueName,
    queuePolicy: replayQueueEntry.queuePolicy,
    replayableEvent: replayQueueEntry.replayableEvent,
    hydratableEventTargetLookup,
    hydratableEventTargetLookupStatus: hydratableEventTargetLookup.status,
    rootOwnershipStatus: hydratableEventTargetLookup.rootOwnershipStatus,
    dehydratedRootOwnerStatus:
      hydratableEventTargetLookup.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwner:
      hydratableEventTargetLookup.dehydratedBoundaryOwner,
    dehydratedBoundaryOwnerId:
      hydratableEventTargetLookup.dehydratedBoundaryOwnerId,
    dehydratedBoundaryOwnerStatus:
      hydratableEventTargetLookup.dehydratedBoundaryOwnerStatus,
    ownerBoundaryKind: hydratableEventTargetLookup.blockedOnKind,
    ownerBoundaryStatus: hydratableEventTargetLookup.blockedOnStatus,
    targetPath: hydratableEventTargetLookup.targetPath,
    targetPathStatus: hydratableEventTargetLookup.targetPathStatus,
    targetNodeInfo: hydratableEventTargetLookup.targetNodeInfo,
    targetContainerInfo: hydratableEventTargetLookup.targetContainerInfo,
    targetContainerMatchesRoot:
      hydratableEventTargetLookup.targetContainerMatchesRoot,
    targetWithinRootContainer:
      hydratableEventTargetLookup.targetWithinRootContainer,
    targetDispatchPathRecord: normalizedDispatchPathRecord,
    targetDispatchPathStatus: normalizedDispatchPathRecord.status,
    targetDispatchPathLength: normalizedDispatchPathRecord.length,
    targetHostInstanceStatus:
      normalizedDispatchPathRecord.targetHostInstanceStatus,
    targetInst: normalizedDispatchPathRecord.targetInst,
    targetInstStatus: normalizedDispatchPathRecord.targetInstStatus,
    eventPathEntryCount: eventPathEntries.length,
    eventPathEntries,
    eventPathStatus: normalizedDispatchPathRecord.status,
    dispatchBlockerMetadata,
    dispatchStatus: normalizedDispatchRecord.status,
    dispatchQueueStatus: normalizedDispatchRecord.dispatchQueue.status,
    dispatchQueueLength: normalizedDispatchRecord.dispatchQueue.length,
    dispatchQueueListenerCount:
      normalizedDispatchRecord.dispatchQueue.listenerCount,
    extractionStatus: normalizedDispatchRecord.extractionRecord.status,
    extractionBlockedReason:
      normalizedDispatchRecord.extractionRecord.blockedReason,
    syntheticEventCount: 0,
    syntheticEventStatus: 'not-created',
    listenerInvocationCount: 0,
    willInvokeListeners: false
  });

  hydrationReplayTargetDispatchLinkDiagnosticPayloads.set(
    record,
    Object.freeze({
      dispatchRecord: normalizedDispatchRecord,
      eventReplayQueueDiagnostics: normalizedQueueDiagnostics,
      hydratableEventTargetLookup,
      replayQueueEntry,
      targetDispatchPathRecord: normalizedDispatchPathRecord
    })
  );

  return record;
}

function assertHydrationReplayEventQueueDiagnostic(record) {
  if (
    !isObjectLike(record) ||
    record.kind !== HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND ||
    !hydrationReplayEventQueueDiagnosticPayloads.has(record)
  ) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics require a private hydration replay event queue diagnostic.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }

  return record;
}

function assertHydrationReplayTargetDispatchPathRecord(
  targetDispatchPathRecord,
  dispatchRecord
) {
  if (
    !isObjectLike(targetDispatchPathRecord) ||
    targetDispatchPathRecord.kind !== EVENT_TARGET_DISPATCH_PATH_RECORD_KIND ||
    !Array.isArray(targetDispatchPathRecord.entries)
  ) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics require a private event target dispatch path record.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }

  if (targetDispatchPathRecord !== dispatchRecord.targetDispatchPathRecord) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics reject foreign event target dispatch path records.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }

  return targetDispatchPathRecord;
}

function assertHydrationReplayTargetDispatchLinkDispatchBlocked(
  dispatchRecord
) {
  if (
    dispatchRecord.blockedReason !== EVENT_DISPATCH_BLOCKED_CODE ||
    dispatchRecord.targetResolutionStatus !== 'blocked' ||
    dispatchRecord.targetResolutionBlockedReason !==
      EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  ) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics require blocked private dispatch target resolution.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }
}

function resolveHydrationReplayTargetDispatchLinkEntry(
  eventReplayQueueDiagnostics,
  queuePayload,
  dispatchRecord,
  options
) {
  const blockedEventReplayTargets =
    queuePayload.blockedEventReplayTargets || [];
  let replayQueueEntry = null;

  if (options.replayQueueEntry !== undefined) {
    replayQueueEntry = isObjectLike(options.replayQueueEntry)
      ? options.replayQueueEntry
      : null;
    if (!blockedEventReplayTargets.includes(replayQueueEntry)) {
      throw createPluginEventSystemError(
        'Hydration replay target-dispatch link diagnostics reject stale replay queue entries.',
        INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
      );
    }
  } else {
    const inputOrder = normalizeNonNegativeInteger(
      options.inputOrder,
      0,
      'inputOrder'
    );
    replayQueueEntry =
      blockedEventReplayTargets.find(
        (entry) => entry.inputOrder === inputOrder
      ) || null;
    if (replayQueueEntry === null) {
      throw createPluginEventSystemError(
        'Hydration replay target-dispatch link diagnostics require a blocked replay queue entry.',
        INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
      );
    }
  }

  const sourceDispatchRecord =
    queuePayload.dispatchRecords[replayQueueEntry.inputOrder] || null;
  if (sourceDispatchRecord !== dispatchRecord) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics require the dispatch record that produced the replay queue entry.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }

  if (
    eventReplayQueueDiagnostics.blockedEventReplayTargets[
      replayQueueEntry.replayQueueOrder
    ] !== replayQueueEntry
  ) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics reject stale replay queue ordering metadata.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }

  return replayQueueEntry;
}

function resolveHydrationReplayTargetDispatchLinkLookup(
  queuePayload,
  replayQueueEntry
) {
  const hydratableEventTargetLookup =
    queuePayload.hydratableEventTargetLookups[replayQueueEntry.inputOrder] ||
    null;

  if (
    !isObjectLike(hydratableEventTargetLookup) ||
    hydratableEventTargetLookup.kind !==
      HYDRATION_HYDRATABLE_EVENT_TARGET_LOOKUP_RECORD_KIND
  ) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics require a hydratable event target lookup record.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }

  if (
    hydratableEventTargetLookup.targetPath !== replayQueueEntry.targetPath ||
    hydratableEventTargetLookup.blockedOnStatus !==
      replayQueueEntry.blockedOnStatus ||
    hydratableEventTargetLookup.dehydratedBoundaryOwnerId !==
      replayQueueEntry.dehydratedBoundaryOwnerId
  ) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics reject stale hydratable target lookup metadata.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }

  return hydratableEventTargetLookup;
}

function assertHydrationReplayTargetDispatchLinkOwnership(
  replayQueueEntry,
  hydratableEventTargetLookup
) {
  const hasBoundaryOwner =
    isObjectLike(hydratableEventTargetLookup.dehydratedBoundaryOwner) &&
    typeof hydratableEventTargetLookup.dehydratedBoundaryOwnerId ===
      'string' &&
    hydratableEventTargetLookup.dehydratedBoundaryOwnerId !== '';

  if (
    hydratableEventTargetLookup.rootOwnershipStatus !==
      'owned-by-dehydrated-root' ||
    replayQueueEntry.rootOwnershipStatus !== 'owned-by-dehydrated-root' ||
    !hasBoundaryOwner
  ) {
    throw createPluginEventSystemError(
      'Hydration replay target-dispatch link diagnostics require retained dehydrated boundary ownership.',
      INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE
    );
  }
}

function createHydrationReplayTargetDispatchLinkEventPathEntries(
  targetDispatchPathRecord
) {
  return Object.freeze(
    targetDispatchPathRecord.entries.map((entry) =>
      Object.freeze({
        kind: HYDRATION_REPLAY_TARGET_DISPATCH_LINK_EVENT_PATH_ENTRY_RECORD_KIND,
        index: entry.index,
        componentTreeStatus: entry.componentTreeStatus,
        isDirectEventTarget: entry.isDirectEventTarget,
        isTargetHostInstance: entry.isTargetHostInstance,
        latestPropsStatus: entry.latestPropsStatus,
        nodeType: entry.nodeType,
        rootOwnerMatchesDispatchPathRoot:
          entry.rootOwner === targetDispatchPathRecord.rootOwner,
        targetHostInstanceStatus: entry.targetHostInstanceStatus
      })
    )
  );
}

function createHydrationReplayTargetDispatchBlockerMetadata(
  dispatchRecord
) {
  const hydrationReplay = dispatchRecord.hydrationReplay;
  const controlledStateRestore = dispatchRecord.controlledStateRestore;

  return Object.freeze({
    kind: 'FastReactDomHydrationReplayTargetDispatchBlockerMetadata',
    status: 'blocked-private-event-dispatch-path-link-recorded',
    admissionStatus: dispatchRecord.admissionStatus,
    blockedReason: dispatchRecord.blockedReason,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    dispatchStatus: dispatchRecord.status,
    dispatcherName: dispatchRecord.dispatcherName,
    eventDispatch: false,
    publicDispatchEnabled: false,
    domEventName: dispatchRecord.domEventName,
    nativeEventType: dispatchRecord.nativeEventType,
    eventSystemFlags: dispatchRecord.eventSystemFlags,
    inCapturePhase: dispatchRecord.inCapturePhase,
    dispatchQueueStatus: dispatchRecord.dispatchQueue.status,
    dispatchQueueLength: dispatchRecord.dispatchQueue.length,
    dispatchQueueListenerCount: dispatchRecord.dispatchQueue.listenerCount,
    extractionStatus: dispatchRecord.extractionRecord.status,
    extractionBlockedReason: dispatchRecord.extractionRecord.blockedReason,
    targetDispatchPathStatus: dispatchRecord.targetDispatchPathStatus,
    targetDispatchPathLength: dispatchRecord.targetDispatchPathLength,
    targetHostInstanceStatus: dispatchRecord.targetHostInstanceStatus,
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetListenerFound: dispatchRecord.targetListenerFound,
    targetListenerLookupCount: dispatchRecord.targetListenerLookupCount,
    targetListenerLookupStatus: dispatchRecord.targetListenerLookupStatus,
    targetResolutionStatus: dispatchRecord.targetResolutionStatus,
    targetResolutionBlockedReason: dispatchRecord.targetResolutionBlockedReason,
    hydrationReplayStatus: hydrationReplay.status,
    hydrationReplayQueued: hydrationReplay.queued,
    hydrationReplayBlockedReason: hydrationReplay.blockedReason,
    controlledStateRestoreStatus: controlledStateRestore.status,
    controlledStateRestoreScheduled: controlledStateRestore.scheduled,
    controlledStateRestoreBlockedReason: controlledStateRestore.blockedReason,
    syntheticEventCount: 0,
    syntheticEventStatus: 'not-created',
    listenerInvocationCount: 0,
    willInvokeListeners: false
  });
}

function getHydrationReplayTargetDispatchLinkDiagnosticPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return (
    hydrationReplayTargetDispatchLinkDiagnosticPayloads.get(record) ||
    null
  );
}

function createHydrationReplayClickDispatchDiagnostic(
  targetDispatchLinkDiagnostic,
  options
) {
  const targetDispatchLink =
    assertHydrationReplayClickDispatchLink(targetDispatchLinkDiagnostic);
  const targetDispatchLinkPayload =
    getHydrationReplayTargetDispatchLinkDiagnosticPayload(targetDispatchLink);
  const dispatchRecord = targetDispatchLinkPayload.dispatchRecord;
  const normalizedOptions = isObjectLike(options) ? options : {};
  const targetClaimingDiagnostic =
    normalizedOptions.targetClaimingDiagnostic === undefined
      ? null
      : normalizedOptions.targetClaimingDiagnostic;
  const claimEvidence =
    normalizeHydrationReplayClickDispatchClaimEvidence(
      targetClaimingDiagnostic,
      targetDispatchLink
    );

  assertHydrationReplayClickDispatchRecord(dispatchRecord, targetDispatchLink);

  const record = Object.freeze({
    kind: HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC_KIND,
    status: PRIVATE_HYDRATION_REPLAY_CLICK_DISPATCH_STATUS,
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-replay-click-dispatch',
    diagnosticOnly: true,
    readOnly: true,
    metadataOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    publicHydrationCompatibilityClaimed: false,
    publicHydrationReplayCompatibilityClaimed: false,
    publicHydrationTargetClaimed: false,
    publicDispatchEnabled: false,
    publicDispatchBlocked: true,
    liveEventListenerInstalled: false,
    rootListenerInstallationAttempted: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    eventDispatch: false,
    willDispatchEvents: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    publicDispatchBlockedReason: PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
    targetDispatchLinkDiagnostic: targetDispatchLink,
    targetDispatchLinkStatus: targetDispatchLink.status,
    targetDispatchLinkAccepted: true,
    targetClaimingDiagnostic: claimEvidence.record,
    targetClaimingDiagnosticStatus: claimEvidence.status,
    targetClaimEvidenceAccepted: claimEvidence.accepted,
    targetClaimRecorded: claimEvidence.claimRecorded,
    claimedTargetMetadata: claimEvidence.claimedTargetMetadata,
    targetClaimExecuted: false,
    inputOrder: targetDispatchLink.inputOrder,
    replayQueueOrder: targetDispatchLink.replayQueueOrder,
    prioritySortKey: targetDispatchLink.prioritySortKey,
    queueOrderPreserved: true,
    claimReplayQueueOrder: claimEvidence.replayQueueOrder,
    targetDispatchLinkReplayQueueOrder:
      targetDispatchLink.replayQueueOrder,
    domEventName: 'click',
    nativeEventType: 'click',
    queueCategory: targetDispatchLink.queueCategory,
    queueName: targetDispatchLink.queueName,
    queuePolicy: targetDispatchLink.queuePolicy,
    replayableEvent: targetDispatchLink.replayableEvent,
    replayQueueEntry: targetDispatchLinkPayload.replayQueueEntry,
    hydratableEventTargetLookup:
      targetDispatchLinkPayload.hydratableEventTargetLookup,
    rootOwnershipStatus: targetDispatchLink.rootOwnershipStatus,
    dehydratedRootOwnerStatus:
      targetDispatchLink.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwner: targetDispatchLink.dehydratedBoundaryOwner,
    dehydratedBoundaryOwnerId:
      targetDispatchLink.dehydratedBoundaryOwnerId,
    dehydratedBoundaryOwnerStatus:
      targetDispatchLink.dehydratedBoundaryOwnerStatus,
    ownerBoundaryKind: targetDispatchLink.ownerBoundaryKind,
    ownerBoundaryStatus: targetDispatchLink.ownerBoundaryStatus,
    targetPath: targetDispatchLink.targetPath,
    targetPathStatus: targetDispatchLink.targetPathStatus,
    targetDispatchPathRecord:
      targetDispatchLinkPayload.targetDispatchPathRecord,
    targetDispatchPathStatus:
      targetDispatchLink.targetDispatchPathStatus,
    targetDispatchPathLength:
      targetDispatchLink.targetDispatchPathLength,
    eventPathStatus: targetDispatchLink.eventPathStatus,
    eventPathEntryCount: targetDispatchLink.eventPathEntryCount,
    eventPathEntries: targetDispatchLink.eventPathEntries,
    dispatchRecord,
    dispatchRecordStatus: dispatchRecord.status,
    dispatchRecordBlockedReason: dispatchRecord.blockedReason,
    dispatchBlockerMetadata: targetDispatchLink.dispatchBlockerMetadata,
    dispatchQueueStatus: targetDispatchLink.dispatchQueueStatus,
    dispatchQueueLength: targetDispatchLink.dispatchQueueLength,
    dispatchQueueListenerCount:
      targetDispatchLink.dispatchQueueListenerCount,
    clickReplayDispatchDiagnosticRecorded: true,
    clickReplayDispatchDiagnosticBlocked: true,
    blockedClickReplayDispatchDiagnosticCount: 1,
    clickDispatchAttempted: false,
    targetDispatchExecuted: false,
    eventReplayDispatchAttempted: false,
    pluginDispatchEventForPluginEventSystemCalled: false,
    privateClickDelegationDispatchGateCalled: false,
    nativeEventRedispatched: false,
    syntheticEventCreated: false,
    syntheticEventCount: 0,
    listenerInvocationCount: 0,
    willInvokeListeners: false,
    queued: false,
    replayQueueDrained: false
  });

  hydrationReplayClickDispatchDiagnosticPayloads.set(
    record,
    Object.freeze({
      dispatchRecord,
      hydratableEventTargetLookup:
        targetDispatchLinkPayload.hydratableEventTargetLookup,
      replayQueueEntry: targetDispatchLinkPayload.replayQueueEntry,
      targetClaimingDiagnostic: claimEvidence.record,
      targetDispatchLinkDiagnostic: targetDispatchLink,
      targetDispatchLinkPayload,
      targetDispatchPathRecord:
        targetDispatchLinkPayload.targetDispatchPathRecord
    })
  );

  return record;
}

function assertHydrationReplayClickDispatchLink(targetDispatchLink) {
  const payload =
    getHydrationReplayTargetDispatchLinkDiagnosticPayload(targetDispatchLink);
  if (
    !isObjectLike(targetDispatchLink) ||
    targetDispatchLink.kind !==
      HYDRATION_REPLAY_TARGET_DISPATCH_LINK_DIAGNOSTIC_KIND ||
    targetDispatchLink.status !==
      PRIVATE_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_STATUS ||
    payload === null
  ) {
    throw createHydrationReplayClickDispatchDiagnosticError(
      'Hydration replay click dispatch diagnostics require a private hydration replay target-dispatch link diagnostic.'
    );
  }

  if (
    targetDispatchLink.domEventName !== 'click' ||
    targetDispatchLink.nativeEventType !== 'click' ||
    targetDispatchLink.eventDispatch !== false ||
    targetDispatchLink.publicDispatchEnabled !== false ||
    targetDispatchLink.willDispatch !== false ||
    targetDispatchLink.willHydrate !== false ||
    targetDispatchLink.willReplay !== false ||
    targetDispatchLink.replayQueueDrained !== false
  ) {
    throw createHydrationReplayClickDispatchDiagnosticError(
      'Hydration replay click dispatch diagnostics only accept blocked click target-dispatch links.'
    );
  }

  return targetDispatchLink;
}

function assertHydrationReplayClickDispatchRecord(
  dispatchRecord,
  targetDispatchLink
) {
  if (
    !isObjectLike(dispatchRecord) ||
    dispatchRecord.domEventName !== 'click' ||
    dispatchRecord.nativeEventType !== 'click' ||
    dispatchRecord.status !== 'blocked' ||
    dispatchRecord.blockedReason !== EVENT_DISPATCH_BLOCKED_CODE ||
    dispatchRecord.targetResolutionStatus !== 'blocked' ||
    dispatchRecord.targetResolutionBlockedReason !==
      EVENT_TARGET_RESOLUTION_BLOCKED_CODE ||
    targetDispatchLink.dispatchBlockerMetadata.eventDispatch !== false ||
    targetDispatchLink.dispatchBlockerMetadata.publicDispatchEnabled !==
      false ||
    targetDispatchLink.dispatchBlockerMetadata.willInvokeListeners !== false
  ) {
    throw createHydrationReplayClickDispatchDiagnosticError(
      'Hydration replay click dispatch diagnostics require a blocked click dispatch record.'
    );
  }
}

function normalizeHydrationReplayClickDispatchClaimEvidence(
  targetClaimingDiagnostic,
  targetDispatchLink
) {
  if (targetClaimingDiagnostic === null) {
    throw createHydrationReplayClickDispatchDiagnosticError(
      'Hydration replay click dispatch diagnostics require accepted private hydration target-claiming evidence.'
    );
  }

  if (
    !isObjectLike(targetClaimingDiagnostic) ||
    targetClaimingDiagnostic.metadataId !== 'hydration-target-claiming' ||
    targetClaimingDiagnostic.targetDispatchLinkDiagnostic !==
      targetDispatchLink ||
    targetClaimingDiagnostic.domEventName !== 'click' ||
    targetClaimingDiagnostic.nativeEventType !== 'click' ||
    targetClaimingDiagnostic.inputOrder !== targetDispatchLink.inputOrder ||
    targetClaimingDiagnostic.replayQueueOrder !==
      targetDispatchLink.replayQueueOrder ||
    targetClaimingDiagnostic.prioritySortKey !==
      targetDispatchLink.prioritySortKey ||
    targetClaimingDiagnostic.queueName !== targetDispatchLink.queueName ||
    targetClaimingDiagnostic.targetPath !== targetDispatchLink.targetPath ||
    targetClaimingDiagnostic.dehydratedBoundaryOwnerId !==
      targetDispatchLink.dehydratedBoundaryOwnerId ||
    targetClaimingDiagnostic.claimRecorded !== true ||
    targetClaimingDiagnostic.claimedTargetMetadata !== true ||
    targetClaimingDiagnostic.targetClaimExecuted !== false ||
    targetClaimingDiagnostic.publicHydrationTargetClaimed !== false ||
    targetClaimingDiagnostic.willDispatch !== false ||
    targetClaimingDiagnostic.willHydrate !== false ||
    targetClaimingDiagnostic.willReplay !== false
  ) {
    throw createHydrationReplayClickDispatchDiagnosticError(
      'Hydration replay click dispatch diagnostics require matching private hydration target-claiming evidence.'
    );
  }

  return Object.freeze({
    accepted: true,
    claimedTargetMetadata: true,
    claimRecorded: true,
    record: targetClaimingDiagnostic,
    replayQueueOrder: targetClaimingDiagnostic.replayQueueOrder,
    status: targetClaimingDiagnostic.status
  });
}

function createHydrationReplayClickDispatchDiagnosticError(message) {
  return createPluginEventSystemError(
    message,
    INVALID_HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC_CODE
  );
}

function getHydrationReplayClickDispatchDiagnosticPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return hydrationReplayClickDispatchDiagnosticPayloads.get(record) || null;
}

function isHydrationReplayClickDispatchDiagnostic(record) {
  return getHydrationReplayClickDispatchDiagnosticPayload(record) !== null;
}

function normalizeHydrationReplayDispatchRecords(dispatchRecords) {
  if (dispatchRecords === undefined || dispatchRecords === null) {
    return [];
  }

  if (!Array.isArray(dispatchRecords)) {
    return [assertEventDispatchRecord(dispatchRecords)];
  }

  return dispatchRecords.map((dispatchRecord) =>
    assertEventDispatchRecord(dispatchRecord)
  );
}

function createHydrationDehydratedTargetResolutionDiagnostic(
  dispatchRecords,
  options
) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const normalizedDispatchRecords =
    normalizeHydrationReplayDispatchRecords(dispatchRecords);
  const sourceDiagnostic = getSourceDehydratedTargetResolutionDiagnostic(
    normalizedOptions
  );
  const sourcePayload =
    sourceDiagnostic === null
      ? null
      : hydrationDehydratedTargetResolutionDiagnosticPayloads.get(
          sourceDiagnostic
        ) || null;
  const markerReplayTargetCandidates =
    normalizeMarkerReplayTargetCandidates(normalizedOptions, sourcePayload);
  const rootContainer = normalizeTargetResolutionRootContainer(
    normalizedOptions,
    sourcePayload
  );
  const markerDiagnostics = normalizeTargetResolutionMarkerDiagnostics(
    normalizedOptions,
    sourcePayload
  );
  const rootRecordId = normalizeTargetResolutionStringOption(
    normalizedOptions.rootRecordId,
    sourcePayload && sourcePayload.rootRecordId,
    sourceDiagnostic && sourceDiagnostic.rootRecordId
  );
  const rootKind = normalizeTargetResolutionStringOption(
    normalizedOptions.rootKind,
    sourcePayload && sourcePayload.rootKind,
    sourceDiagnostic && sourceDiagnostic.rootKind
  );
  const rootTag = normalizeTargetResolutionStringOption(
    normalizedOptions.rootTag,
    sourcePayload && sourcePayload.rootTag,
    sourceDiagnostic && sourceDiagnostic.rootTag
  );
  const rootOwner = createHydrationDehydratedRootOwnerRecord({
    rootContainer,
    rootKind,
    rootRecordId,
    rootTag
  });
  const boundaryOwners = createHydrationDehydratedBoundaryOwnerRecords(
    markerReplayTargetCandidates,
    {
      rootRecordId
    }
  );
  const targetLookups = Object.freeze(
    normalizedDispatchRecords.map((dispatchRecord, inputOrder) =>
      createHydratableEventTargetLookupRecord(dispatchRecord, inputOrder, {
        boundaryOwners,
        markerDiagnostics,
        rootContainer,
        rootOwner
      })
    )
  );
  const record = Object.freeze({
    kind: HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND,
    status:
      targetLookups.length === 0
        ? 'blocked-no-hydratable-event-targets-recorded'
        : 'blocked-hydratable-event-targets-recorded',
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-target-resolution',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    eventTargetResolutionSupported: false,
    hydrationReplaySupported: false,
    eventReplaySupported: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    blockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    hydrationReplayBlockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    rootRecordId,
    rootKind,
    rootTag,
    dehydratedRootOwner: rootOwner,
    dehydratedRootOwnerStatus: rootOwner.status,
    markerReplayTargetCandidateCount: markerReplayTargetCandidates.length,
    markerReplayTargetCandidates,
    dehydratedBoundaryOwnerCount: boundaryOwners.length,
    dehydratedBoundaryOwners: boundaryOwners,
    eventDispatchRecordCount: normalizedDispatchRecords.length,
    hydratableEventTargetLookupCount: targetLookups.length,
    hydratableEventTargetLookups: targetLookups,
    queuedEventReplayTargetCount: 0,
    replayedEventCount: 0
  });

  hydrationDehydratedTargetResolutionDiagnosticPayloads.set(
    record,
    Object.freeze({
      markerDiagnostics,
      markerReplayTargetCandidates,
      rootContainer,
      rootKind,
      rootRecordId,
      rootTag
    })
  );

  return record;
}

function getSourceDehydratedTargetResolutionDiagnostic(options) {
  const sourceDiagnostic =
    options.dehydratedTargetResolution ||
    options.targetResolutionDiagnostics ||
    null;
  if (sourceDiagnostic === null || sourceDiagnostic === undefined) {
    return null;
  }

  if (!isHydrationDehydratedTargetResolutionDiagnostic(sourceDiagnostic)) {
    throw createPluginEventSystemError(
      'Cannot resolve hydration event targets without a private dehydrated target-resolution diagnostic.',
      INVALID_EVENT_DISPATCH_RECORD_CODE
    );
  }

  return sourceDiagnostic;
}

function getHydrationDehydratedTargetResolutionDiagnosticPayload(record) {
  if (!isObjectLike(record)) {
    return null;
  }

  return (
    hydrationDehydratedTargetResolutionDiagnosticPayloads.get(record) ||
    null
  );
}

function isHydrationDehydratedTargetResolutionDiagnostic(record) {
  return (
    isObjectLike(record) &&
    record.kind === HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND &&
    hydrationDehydratedTargetResolutionDiagnosticPayloads.has(record)
  );
}

function normalizeMarkerReplayTargetCandidates(options, sourcePayload) {
  if (Array.isArray(options.markerReplayTargetCandidates)) {
    return Object.freeze(options.markerReplayTargetCandidates.slice());
  }

  if (
    sourcePayload !== null &&
    Array.isArray(sourcePayload.markerReplayTargetCandidates)
  ) {
    return Object.freeze(sourcePayload.markerReplayTargetCandidates.slice());
  }

  return Object.freeze([]);
}

function normalizeTargetResolutionRootContainer(options, sourcePayload) {
  if (Object.prototype.hasOwnProperty.call(options, 'rootContainer')) {
    return isObjectLike(options.rootContainer) ? options.rootContainer : null;
  }

  return sourcePayload === null ? null : sourcePayload.rootContainer;
}

function normalizeTargetResolutionMarkerDiagnostics(options, sourcePayload) {
  if (
    Object.prototype.hasOwnProperty.call(options, 'markerDiagnostics') &&
    isObjectLike(options.markerDiagnostics)
  ) {
    return options.markerDiagnostics;
  }

  return sourcePayload === null ? null : sourcePayload.markerDiagnostics;
}

function normalizeTargetResolutionStringOption(
  optionValue,
  payloadValue,
  recordValue
) {
  if (typeof optionValue === 'string') {
    return optionValue;
  }
  if (typeof payloadValue === 'string') {
    return payloadValue;
  }
  if (typeof recordValue === 'string') {
    return recordValue;
  }
  return null;
}

function createHydrationDehydratedRootOwnerRecord({
  rootContainer,
  rootKind,
  rootRecordId,
  rootTag
}) {
  return Object.freeze({
    kind: HYDRATION_DEHYDRATED_ROOT_OWNER_RECORD_KIND,
    status:
      rootContainer === null
        ? 'blocked-no-dehydrated-root-container-payload'
        : 'recorded-unsupported-dehydrated-root-owner',
    rootRecordId,
    rootKind,
    rootTag,
    dehydrated: true,
    unsupported: true,
    canHydrate: false,
    hydrationRootSupported: false,
    targetResolutionSupported: false,
    containerInfo: describeHydrationReplayEventTargetInfo(rootContainer)
  });
}

function createHydrationDehydratedBoundaryOwnerRecords(
  markerReplayTargetCandidates,
  options
) {
  return Object.freeze(
    markerReplayTargetCandidates.map((candidate, index) =>
      Object.freeze({
        kind: HYDRATION_DEHYDRATED_BOUNDARY_OWNER_RECORD_KIND,
        status: 'recorded-marker-derived-dehydrated-boundary-owner',
        ownerId: createHydrationBoundaryOwnerId(
          options.rootRecordId,
          index
        ),
        index,
        rootRecordId: options.rootRecordId,
        area: candidate.area || null,
        boundaryKind:
          typeof candidate.replayTargetKind === 'string'
            ? candidate.replayTargetKind
            : inferHydrationReplayTargetKind(candidate.contractId),
        contractId:
          typeof candidate.contractId === 'string'
            ? candidate.contractId
            : null,
        markerKind: typeof candidate.kind === 'string' ? candidate.kind : null,
        path: typeof candidate.path === 'string' ? candidate.path : null,
        dehydrated: true,
        rootOwned: true,
        canHydrate: false,
        queueEligible: false,
        queued: false,
        blockedReason: HYDRATION_REPLAY_BLOCKED_CODE
      })
    )
  );
}

function createHydrationBoundaryOwnerId(rootRecordId, index) {
  const prefix =
    typeof rootRecordId === 'string' && rootRecordId !== ''
      ? rootRecordId
      : 'hydration-target-resolution';
  return `${prefix}:boundary:${index}`;
}

function inferHydrationReplayTargetKind(contractId) {
  if (typeof contractId !== 'string') {
    return 'unknown';
  }
  if (contractId.startsWith('activity-')) {
    return 'activity-boundary';
  }
  if (contractId.startsWith('suspense-')) {
    return 'suspense-boundary';
  }
  if (contractId.startsWith('form-state-')) {
    return 'form-state';
  }
  return 'unknown';
}

function createHydratableEventTargetLookupRecord(
  dispatchRecord,
  inputOrder,
  options
) {
  const nativeEventTarget = dispatchRecord.nativeEventTarget;
  const rootContainer = options.rootContainer;
  const targetPathRecord = findHydrationTargetPath(
    rootContainer,
    nativeEventTarget
  );
  const targetWithinRootContainer =
    rootContainer !== null &&
    (targetPathRecord.found ||
      isHydrationTargetDescendantOfRoot(rootContainer, nativeEventTarget));
  const targetContainerMatchesRoot =
    rootContainer !== null && dispatchRecord.targetContainer === rootContainer;
  const rootOwned = targetContainerMatchesRoot || targetWithinRootContainer;
  const boundaryOwner = rootOwned
    ? findDehydratedBoundaryOwnerForTargetPath(
        targetPathRecord.path,
        options.boundaryOwners,
        options.markerDiagnostics
      )
    : null;
  const queueInfo = getHydrationReplayEventQueueInfo(
    dispatchRecord.domEventName
  );
  const targetInstResolved = dispatchRecord.targetInst !== null;
  const lookupStatus = getHydratableEventTargetLookupStatus({
    boundaryOwner,
    rootOwned,
    targetInstResolved,
    targetPathRecord
  });

  return Object.freeze({
    kind: HYDRATION_HYDRATABLE_EVENT_TARGET_LOOKUP_RECORD_KIND,
    status: lookupStatus,
    inputOrder,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    domEventName: dispatchRecord.domEventName,
    nativeEventType: dispatchRecord.nativeEventType,
    eventPriorityLabel: dispatchRecord.eventPriorityLabel,
    eventPriorityLane: dispatchRecord.eventPriorityLane,
    eventPriorityName: dispatchRecord.eventPriorityName,
    queueCategory: queueInfo.queueCategory,
    queueName: queueInfo.queueName,
    replayableEvent: queueInfo.replayableEvent,
    targetContainerMatchesRoot,
    targetWithinRootContainer,
    rootOwnershipStatus: getHydrationRootOwnershipStatus({
      rootContainer,
      rootOwned
    }),
    dehydratedRootOwnerStatus: options.rootOwner.status,
    dehydratedBoundaryOwner: boundaryOwner,
    dehydratedBoundaryOwnerId:
      boundaryOwner === null ? null : boundaryOwner.ownerId,
    dehydratedBoundaryOwnerStatus:
      boundaryOwner === null ? 'not-found' : boundaryOwner.status,
    blockedOnKind:
      boundaryOwner === null
        ? rootOwned
          ? 'dehydrated-root'
          : null
        : boundaryOwner.boundaryKind,
    blockedOnStatus:
      boundaryOwner === null
        ? rootOwned
          ? 'blocked-on-dehydrated-root'
          : 'unavailable-no-dehydrated-owner'
        : 'blocked-on-dehydrated-boundary',
    targetPath: targetPathRecord.path,
    targetPathStatus: targetPathRecord.status,
    targetNodeInfo: describeHydrationReplayEventTargetInfo(nativeEventTarget),
    targetContainerInfo: describeHydrationReplayEventTargetInfo(
      dispatchRecord.targetContainer
    ),
    targetDispatchPathLength: dispatchRecord.targetDispatchPathLength,
    targetDispatchPathStatus: dispatchRecord.targetDispatchPathStatus,
    targetHostInstanceStatus: dispatchRecord.targetHostInstanceStatus,
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetListenerFound: dispatchRecord.targetListenerFound,
    targetListenerLookupCount: dispatchRecord.targetListenerLookupCount,
    targetListenerLookupStatus: dispatchRecord.targetListenerLookupStatus,
    targetResolutionBlockedReason:
      dispatchRecord.targetResolutionBlockedReason,
    targetResolutionStatus: dispatchRecord.targetResolutionStatus,
    targetResolutionSupported: false,
    queued: false,
    queueMutationAllowed: false,
    replayQueueDrained: false,
    willDrainReplayQueues: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    blockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    hydrationReplayBlockedReason: HYDRATION_REPLAY_BLOCKED_CODE
  });
}

function getHydratableEventTargetLookupStatus({
  boundaryOwner,
  rootOwned,
  targetInstResolved,
  targetPathRecord
}) {
  if (targetInstResolved) {
    return 'skipped-mounted-host-instance-target';
  }
  if (!rootOwned) {
    return 'blocked-no-dehydrated-owner';
  }
  if (boundaryOwner !== null) {
    return 'blocked-on-dehydrated-boundary';
  }
  if (targetPathRecord.found) {
    return 'blocked-on-dehydrated-root';
  }
  return 'blocked-on-dehydrated-root-unlisted-target';
}

function getHydrationRootOwnershipStatus({rootContainer, rootOwned}) {
  if (rootContainer === null) {
    return 'unavailable-no-dehydrated-root-container-payload';
  }
  return rootOwned
    ? 'owned-by-dehydrated-root'
    : 'not-owned-by-dehydrated-root';
}

function findHydrationTargetPath(rootContainer, targetNode) {
  if (rootContainer === null) {
    return Object.freeze({
      found: false,
      path: null,
      status: 'unavailable-no-root-container'
    });
  }
  if (!isObjectLike(targetNode)) {
    return Object.freeze({
      found: false,
      path: null,
      status: 'unavailable-non-object-target'
    });
  }
  if (targetNode === rootContainer) {
    return Object.freeze({
      found: true,
      path: 'container',
      status: 'found-container-target'
    });
  }

  const visitedNodes = new Set();
  const path = findHydrationTargetPathInChildren(
    rootContainer,
    'container',
    targetNode,
    visitedNodes
  );
  if (path !== null) {
    return Object.freeze({
      found: true,
      path,
      status: 'found-in-container-child-list'
    });
  }
  if (isHydrationTargetDescendantOfRoot(rootContainer, targetNode)) {
    return Object.freeze({
      found: false,
      path: null,
      status: 'owned-by-parent-chain-not-child-list'
    });
  }

  return Object.freeze({
    found: false,
    path: null,
    status: 'not-contained-in-dehydrated-root'
  });
}

function findHydrationTargetPathInChildren(
  parentNode,
  parentPath,
  targetNode,
  visitedNodes
) {
  if (!isObjectLike(parentNode) || visitedNodes.has(parentNode)) {
    return null;
  }
  visitedNodes.add(parentNode);

  const childNodes = getHydrationChildNodesSnapshot(parentNode);
  for (let index = 0; index < childNodes.length; index++) {
    const childNode = childNodes[index];
    if (!isObjectLike(childNode)) {
      continue;
    }

    const path = `${parentPath}.childNodes[${index}]`;
    if (childNode === targetNode) {
      return path;
    }

    const childPath = findHydrationTargetPathInChildren(
      childNode,
      path,
      targetNode,
      visitedNodes
    );
    if (childPath !== null) {
      return childPath;
    }
  }

  return null;
}

function isHydrationTargetDescendantOfRoot(rootContainer, targetNode) {
  let currentNode = isObjectLike(targetNode) ? targetNode : null;
  while (currentNode !== null) {
    if (currentNode === rootContainer) {
      return true;
    }
    currentNode = isObjectLike(currentNode.parentNode)
      ? currentNode.parentNode
      : null;
  }
  return false;
}

function getHydrationChildNodesSnapshot(node) {
  if (!isObjectLike(node)) {
    return [];
  }

  const childNodes = node.childNodes;
  if (Array.isArray(childNodes)) {
    return childNodes.slice();
  }
  if (
    isObjectLike(childNodes) &&
    Number.isSafeInteger(childNodes.length) &&
    childNodes.length >= 0
  ) {
    const snapshot = [];
    for (let index = 0; index < childNodes.length; index += 1) {
      snapshot.push(childNodes[index]);
    }
    return snapshot;
  }

  return [];
}

function findDehydratedBoundaryOwnerForTargetPath(
  targetPath,
  boundaryOwners,
  markerDiagnostics
) {
  const targetPositions = getHydrationTargetPathPositions(targetPath);
  if (targetPositions.length === 0) {
    return null;
  }

  const boundaryOwnersByPath = new Map();
  for (const boundaryOwner of boundaryOwners) {
    if (typeof boundaryOwner.path === 'string') {
      boundaryOwnersByPath.set(boundaryOwner.path, boundaryOwner);
    }
  }

  const markerRows =
    markerDiagnostics !== null && Array.isArray(markerDiagnostics.markers)
      ? markerDiagnostics.markers
      : [];
  let selectedOwner = null;
  for (const targetPosition of targetPositions) {
    const boundaryStack = [];
    const sameParentMarkers = markerRows
      .map((marker) => ({
        marker,
        pathParts: parseHydrationContainerPath(marker.path)
      }))
      .filter(
        ({pathParts}) =>
          pathParts !== null &&
          pathParts.parentPath === targetPosition.parentPath &&
          pathParts.index < targetPosition.index
      )
      .sort((a, b) => a.pathParts.index - b.pathParts.index);

    for (const {marker} of sameParentMarkers) {
      const owner = boundaryOwnersByPath.get(marker.path) || null;
      if (owner !== null) {
        boundaryStack.push(owner);
      } else if (isHydrationBoundaryEndMarker(marker.contractId)) {
        popHydrationBoundaryOwnerForEndMarker(
          boundaryStack,
          marker.contractId
        );
      }
    }

    if (boundaryStack.length > 0) {
      selectedOwner = boundaryStack[boundaryStack.length - 1];
    }
  }

  return selectedOwner;
}

function getHydrationTargetPathPositions(targetPath) {
  const segments = parseHydrationContainerPathSegments(targetPath);
  if (segments === null || segments.length === 0) {
    return [];
  }

  const positions = [];
  let parentPath = 'container';
  for (let depth = 0; depth < segments.length; depth++) {
    positions.push({
      index: segments[depth],
      parentPath
    });
    parentPath += `.childNodes[${segments[depth]}]`;
  }
  return positions;
}

function parseHydrationContainerPath(path) {
  const segments = parseHydrationContainerPathSegments(path);
  if (segments === null || segments.length === 0) {
    return null;
  }

  const index = segments[segments.length - 1];
  let parentPath = 'container';
  for (let depth = 0; depth < segments.length - 1; depth++) {
    parentPath += `.childNodes[${segments[depth]}]`;
  }

  return {
    index,
    parentPath
  };
}

function parseHydrationContainerPathSegments(path) {
  if (typeof path !== 'string' || !path.startsWith('container')) {
    return null;
  }

  const suffix = path.slice('container'.length);
  if (suffix === '') {
    return [];
  }

  const segments = [];
  const pathPattern = /\.childNodes\[(\d+)\]/g;
  let offset = 0;
  let match;
  while ((match = pathPattern.exec(suffix)) !== null) {
    if (match.index !== offset) {
      return null;
    }
    segments.push(Number(match[1]));
    offset = match.index + match[0].length;
  }

  return offset === suffix.length ? segments : null;
}

function isHydrationBoundaryEndMarker(contractId) {
  return contractId === 'suspense-end' || contractId === 'activity-end';
}

function popHydrationBoundaryOwnerForEndMarker(boundaryStack, contractId) {
  const expectedBoundaryKind =
    contractId === 'activity-end' ? 'activity-boundary' : 'suspense-boundary';
  for (let index = boundaryStack.length - 1; index >= 0; index -= 1) {
    if (boundaryStack[index].boundaryKind === expectedBoundaryKind) {
      boundaryStack.splice(index, 1);
      return;
    }
  }
}

function createHydrationReplayQueueDrainOrderDiagnostic(
  blockedEventReplayTargets,
  options
) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  const dehydratedTargetResolutionDiagnostics =
    normalizedOptions.dehydratedTargetResolutionDiagnostics || null;
  const drainOrderCandidates = blockedEventReplayTargets.map(
    createHydrationReplayQueueDrainOrderCandidate
  );
  const drainOrder = Object.freeze(
    drainOrderCandidates
      .slice()
      .sort(compareHydrationReplayQueueDrainOrderCandidates)
      .map((candidate, drainOrderIndex) =>
        Object.freeze({
          ...candidate,
          drainOrder: drainOrderIndex
        })
      )
  );

  return Object.freeze({
    kind: HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND,
    status:
      drainOrder.length === 0
        ? 'blocked-no-replay-queue-drain-order-targets-recorded'
        : 'blocked-replay-queue-drain-order-recorded',
    source:
      typeof normalizedOptions.source === 'string'
        ? normalizedOptions.source
        : 'private-hydration-replay-queue-drain-order',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    browserDomEventCompatibilityClaimed: false,
    publicRootBehaviorChanged: false,
    eventReplayInstalled: false,
    eventReplaySupported: false,
    hydrationReplaySupported: false,
    hostInstanceHydrationAttempted: false,
    hasScheduledReplayAttempt: false,
    queueMutationAllowed: false,
    replayQueuesDrained: false,
    willDrainReplayQueues: false,
    eventsReplayed: false,
    willDispatchEvents: false,
    willHydrateHostInstances: false,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    eventDispatchBlockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    eventTargetResolutionBlockedReason: EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    orderSource: 'dehydrated-target-root-metadata',
    targetResolutionDiagnosticsAccepted:
      dehydratedTargetResolutionDiagnostics !== null &&
      dehydratedTargetResolutionDiagnostics.kind ===
        HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND,
    dehydratedRootOwnerStatus:
      dehydratedTargetResolutionDiagnostics === null
        ? null
        : dehydratedTargetResolutionDiagnostics.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwnerCount:
      dehydratedTargetResolutionDiagnostics === null
        ? 0
        : dehydratedTargetResolutionDiagnostics.dehydratedBoundaryOwnerCount,
    hydratableEventTargetLookupCount:
      dehydratedTargetResolutionDiagnostics === null
        ? 0
        : dehydratedTargetResolutionDiagnostics
            .hydratableEventTargetLookupCount,
    blockedEventReplayTargetCount: blockedEventReplayTargets.length,
    queuedEventReplayTargetCount: 0,
    replayedEventCount: 0,
    drainOrderCount: drainOrder.length,
    drainOrder
  });
}

function createHydrationReplayQueueDrainOrderCandidate(entry) {
  const targetPathSegments =
    getHydrationReplayDrainTargetPathSegments(entry.targetPath);

  return {
    kind: 'FastReactDomHydrationReplayQueueDrainOrderEntryRecord',
    status: 'blocked-replay-queue-drain-order-entry-recorded',
    inputOrder: entry.inputOrder,
    replayQueueOrder: entry.replayQueueOrder,
    prioritySortKey: entry.prioritySortKey,
    domEventName: entry.domEventName,
    nativeEventType: entry.nativeEventType,
    queueCategory: entry.queueCategory,
    queueName: entry.queueName,
    queuePolicy: entry.queuePolicy,
    replayableEvent: entry.replayableEvent,
    rootOwnershipStatus: entry.rootOwnershipStatus,
    dehydratedRootOwnerStatus: entry.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwnerId: entry.dehydratedBoundaryOwnerId,
    dehydratedBoundaryOwnerIndex: entry.dehydratedBoundaryOwnerIndex,
    dehydratedBoundaryOwnerPath: entry.dehydratedBoundaryOwnerPath,
    dehydratedBoundaryOwnerStatus: entry.dehydratedBoundaryOwnerStatus,
    blockedOnKind: entry.blockedOnKind,
    blockedOnStatus: entry.blockedOnStatus,
    blockedOnSortKey: createHydrationReplayDrainBlockedOnSortKey(entry),
    ownerSortKey: getHydrationReplayDrainOwnerSortKey(entry),
    targetPath: entry.targetPath,
    targetPathStatus: entry.targetPathStatus,
    targetPathSegments,
    targetPathSortKey: createHydrationReplayDrainTargetPathSortKey(
      targetPathSegments,
      entry.inputOrder
    ),
    queued: false,
    replayQueueDrained: false,
    willDrainReplayQueues: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false
  };
}

function compareHydrationReplayQueueDrainOrderCandidates(a, b) {
  const targetPathComparison = compareHydrationReplayDrainPathSegments(
    a.targetPathSegments,
    b.targetPathSegments
  );
  if (targetPathComparison !== 0) {
    return targetPathComparison;
  }

  if (a.ownerSortKey !== b.ownerSortKey) {
    return a.ownerSortKey - b.ownerSortKey;
  }

  if (a.dehydratedBoundaryOwnerIndex !== b.dehydratedBoundaryOwnerIndex) {
    return (
      normalizeHydrationReplayDrainBoundaryIndex(
        a.dehydratedBoundaryOwnerIndex
      ) -
      normalizeHydrationReplayDrainBoundaryIndex(
        b.dehydratedBoundaryOwnerIndex
      )
    );
  }

  return a.inputOrder - b.inputOrder;
}

function compareHydrationReplayDrainPathSegments(a, b) {
  if (a === null && b === null) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }

  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    if (a[index] !== b[index]) {
      return a[index] - b[index];
    }
  }

  return a.length - b.length;
}

function normalizeHydrationReplayDrainBoundaryIndex(index) {
  return Number.isSafeInteger(index) ? index : Number.MAX_SAFE_INTEGER;
}

function getHydrationReplayDrainTargetPathSegments(targetPath) {
  const segments = parseHydrationContainerPathSegments(targetPath);
  return segments === null ? null : Object.freeze(segments.slice());
}

function createHydrationReplayDrainTargetPathSortKey(
  targetPathSegments,
  inputOrder
) {
  if (targetPathSegments === null) {
    return `unlisted:${inputOrder}`;
  }

  if (targetPathSegments.length === 0) {
    return 'container';
  }

  return targetPathSegments
    .map((segment) => String(segment).padStart(8, '0'))
    .join('.');
}

function getHydrationReplayDrainOwnerSortKey(entry) {
  if (entry.dehydratedBoundaryOwnerId !== null) {
    return 0;
  }
  if (entry.rootOwnershipStatus === 'owned-by-dehydrated-root') {
    return 1;
  }
  return 2;
}

function createHydrationReplayDrainBlockedOnSortKey(entry) {
  if (entry.dehydratedBoundaryOwnerId !== null) {
    const ownerPath =
      typeof entry.dehydratedBoundaryOwnerPath === 'string'
        ? entry.dehydratedBoundaryOwnerPath
        : 'unknown-boundary-path';
    return `boundary:${ownerPath}:${entry.dehydratedBoundaryOwnerId}`;
  }

  if (entry.rootOwnershipStatus === 'owned-by-dehydrated-root') {
    const targetPath =
      typeof entry.targetPath === 'string'
        ? entry.targetPath
        : 'unknown-root-target-path';
    return `root:${targetPath}:${entry.dehydratedRootOwnerStatus}`;
  }

  return `unowned:${entry.inputOrder}`;
}

function createHydrationReplayEventQueueEntryRecord(
  dispatchRecord,
  inputOrder,
  hydratableEventTargetLookup
) {
  const queueInfo = getHydrationReplayEventQueueInfo(
    dispatchRecord.domEventName
  );
  const prioritySortKey =
    typeof dispatchRecord.eventPriorityLane === 'number'
      ? dispatchRecord.eventPriorityLane
      : Number.MAX_SAFE_INTEGER;
  const targetLookup = isObjectLike(hydratableEventTargetLookup)
    ? hydratableEventTargetLookup
    : null;
  const dehydratedBoundaryOwner =
    targetLookup !== null && isObjectLike(targetLookup.dehydratedBoundaryOwner)
      ? targetLookup.dehydratedBoundaryOwner
      : null;

  return Object.freeze({
    kind: HYDRATION_REPLAY_EVENT_QUEUE_ENTRY_RECORD_KIND,
    status: 'blocked-event-replay-target-recorded',
    inputOrder,
    replayQueueOrder: inputOrder,
    prioritySortKey,
    blockedReason: HYDRATION_REPLAY_BLOCKED_CODE,
    dispatchBlockedReason: dispatchRecord.blockedReason,
    targetResolutionBlockedReason:
      dispatchRecord.targetResolutionBlockedReason,
    domEventName: dispatchRecord.domEventName,
    nativeEventType: dispatchRecord.nativeEventType,
    eventPriorityLabel: dispatchRecord.eventPriorityLabel,
    eventPriorityLane: dispatchRecord.eventPriorityLane,
    eventPriorityName: dispatchRecord.eventPriorityName,
    eventSystemFlags: dispatchRecord.eventSystemFlags,
    wrapperKind: dispatchRecord.wrapperKind,
    queueCategory: queueInfo.queueCategory,
    queueName: queueInfo.queueName,
    queuePolicy: queueInfo.queuePolicy,
    replayableEvent: queueInfo.replayableEvent,
    queued: false,
    willDispatch: false,
    willHydrate: false,
    willReplay: false,
    blockedOn: null,
    blockedOnKind:
      targetLookup === null ? null : targetLookup.blockedOnKind,
    blockedOnStatus:
      targetLookup === null
        ? 'unavailable-no-dehydrated-boundary'
        : targetLookup.blockedOnStatus,
    hydrationTargetResolutionStatus:
      targetLookup === null
        ? 'unavailable-no-hydratable-event-target-lookup'
        : targetLookup.status,
    rootOwnershipStatus:
      targetLookup === null
        ? 'unavailable-no-dehydrated-root-container-payload'
        : targetLookup.rootOwnershipStatus,
    dehydratedRootOwnerStatus:
      targetLookup === null
        ? 'blocked-no-dehydrated-root-container-payload'
        : targetLookup.dehydratedRootOwnerStatus,
    dehydratedBoundaryOwner:
      dehydratedBoundaryOwner === null ? null : dehydratedBoundaryOwner,
    dehydratedBoundaryOwnerId:
      dehydratedBoundaryOwner === null
        ? null
        : dehydratedBoundaryOwner.ownerId,
    dehydratedBoundaryOwnerIndex:
      dehydratedBoundaryOwner === null ? null : dehydratedBoundaryOwner.index,
    dehydratedBoundaryOwnerPath:
      dehydratedBoundaryOwner === null ? null : dehydratedBoundaryOwner.path,
    dehydratedBoundaryOwnerStatus:
      targetLookup === null
        ? 'not-found'
        : targetLookup.dehydratedBoundaryOwnerStatus,
    targetPath: targetLookup === null ? null : targetLookup.targetPath,
    targetPathStatus:
      targetLookup === null
        ? 'unavailable-no-hydratable-event-target-lookup'
        : targetLookup.targetPathStatus,
    targetContainerMatchesRoot:
      targetLookup === null ? false : targetLookup.targetContainerMatchesRoot,
    targetWithinRootContainer:
      targetLookup === null ? false : targetLookup.targetWithinRootContainer,
    replayQueueDrained: false,
    willDrainReplayQueues: false,
    targetContainerInfo: describeHydrationReplayEventTargetInfo(
      dispatchRecord.targetContainer
    ),
    nativeEventTargetInfo: describeHydrationReplayEventTargetInfo(
      dispatchRecord.nativeEventTarget
    ),
    targetDispatchPathLength: dispatchRecord.targetDispatchPathLength,
    targetDispatchPathStatus: dispatchRecord.targetDispatchPathStatus,
    targetHostInstanceStatus: dispatchRecord.targetHostInstanceStatus,
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetListenerFound: dispatchRecord.targetListenerFound,
    targetListenerLookupCount: dispatchRecord.targetListenerLookupCount,
    targetListenerLookupStatus: dispatchRecord.targetListenerLookupStatus,
    targetResolutionStatus: dispatchRecord.targetResolutionStatus
  });
}

function getHydrationReplayEventQueueInfo(domEventName) {
  if (
    Object.prototype.hasOwnProperty.call(
      hydrationContinuousReplayQueueNames,
      domEventName
    )
  ) {
    return Object.freeze({
      queueCategory: 'continuous-event',
      queueName: hydrationContinuousReplayQueueNames[domEventName],
      queuePolicy:
        domEventName === 'pointerover' ||
        domEventName === 'pointerout' ||
        domEventName === 'gotpointercapture' ||
        domEventName === 'lostpointercapture'
          ? 'latest-event-per-pointer-id'
          : 'latest-event-per-event-family',
      replayableEvent: true
    });
  }

  if (domEventName === 'change') {
    return Object.freeze({
      queueCategory: 'change-event-target',
      queueName: 'queuedChangeEventTargets',
      queuePolicy: 'target-array-drained-after-unblocked-hydration',
      replayableEvent: true
    });
  }

  if (hydrationDiscreteReplayableEventNameSet.has(domEventName)) {
    return Object.freeze({
      queueCategory: 'discrete-event',
      queueName: 'discrete-hydration-replay-attempt',
      queuePolicy: 'capture-phase-synchronous-hydration-attempt-blocked',
      replayableEvent: true
    });
  }

  return Object.freeze({
    queueCategory: 'not-replayable',
    queueName: null,
    queuePolicy: 'dispatch-without-target-when-blocked',
    replayableEvent: false
  });
}

function createHydrationReplayEventQueueOrder(entries) {
  return Object.freeze(
    entries.map((entry) => createHydrationReplayEventQueueOrderEntry(entry))
  );
}

function createHydrationReplayEventPriorityOrder(entries) {
  return Object.freeze(
    entries
      .slice()
      .sort(compareHydrationReplayEventQueueEntriesByPriority)
      .map((entry, priorityOrder) =>
        createHydrationReplayEventQueueOrderEntry(entry, priorityOrder)
      )
  );
}

function compareHydrationReplayEventQueueEntriesByPriority(a, b) {
  if (a.prioritySortKey !== b.prioritySortKey) {
    return a.prioritySortKey - b.prioritySortKey;
  }

  return a.inputOrder - b.inputOrder;
}

function createHydrationReplayEventQueueOrderEntry(entry, overrideOrder) {
  return Object.freeze({
    domEventName: entry.domEventName,
    inputOrder: entry.inputOrder,
    nativeEventType: entry.nativeEventType,
    priorityOrder:
      overrideOrder === undefined ? entry.inputOrder : overrideOrder,
    prioritySortKey: entry.prioritySortKey,
    queueName: entry.queueName,
    targetResolutionStatus: entry.targetResolutionStatus
  });
}

function describeHydrationReplayEventTargetInfo(target) {
  if (target === null || target === undefined) {
    return Object.freeze({
      kind: 'null'
    });
  }

  if (!isObjectLike(target)) {
    return Object.freeze({
      kind: typeof target
    });
  }

  return Object.freeze({
    kind: 'object',
    nodeName:
      typeof target.nodeName === 'string' ? target.nodeName : null,
    nodeType:
      typeof target.nodeType === 'number' ? target.nodeType : null
  });
}

function createEventDispatchRecordFromWrapperRecord(
  listenerOrWrapperRecord,
  nativeEvent
) {
  const wrapperRecord =
    assertEventListenerWrapperRecord(listenerOrWrapperRecord);
  const eventSystemFlags = wrapperRecord.eventSystemFlags;
  const nativeEventTarget = getEventTarget(
    nativeEvent,
    wrapperRecord.targetContainer
  );
  const targetNormalizationRecord =
    createEventTargetNormalizationRecord(nativeEventTarget);
  const targetDispatchPathRecord =
    createEventTargetDispatchPathRecord(targetNormalizationRecord);
  const extractionRecord = createPluginExtractionRecord(
    wrapperRecord,
    nativeEvent,
    nativeEventTarget,
    targetNormalizationRecord,
    undefined,
    targetDispatchPathRecord
  );
  const targetListenerLookupRecord =
    extractionRecord.targetListenerLookupRecord;
  const targetResolutionWasResolved =
    targetDispatchPathRecord.targetInst !== null;

  const record = Object.freeze({
    admissionStatus: PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
    blockedReason: EVENT_DISPATCH_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    controlledStateRestore: createControlledStateRestoreRecord(),
    dispatchQueue: extractionRecord.dispatchQueue,
    dispatcherName: wrapperRecord.dispatcherName,
    domEventName: wrapperRecord.domEventName,
    eventPriority: wrapperRecord.eventPriority,
    eventPriorityLabel: wrapperRecord.eventPriorityLabel,
    eventPriorityLane: wrapperRecord.eventPriorityLane,
    eventPriorityName: wrapperRecord.eventPriorityName,
    eventSystemFlags,
    extractionRecord,
    hydrationReplay: createHydrationReplayRecord(),
    inCapturePhase: isCapturePhase(eventSystemFlags),
    isEventHandleNonManagedNode:
      isEventHandleNonManagedNode(eventSystemFlags),
    isNonDelegatedEvent: isNonDelegatedEventSystem(eventSystemFlags),
    kind: EVENT_DISPATCH_RECORD_KIND,
    listenerInvocationCount: 0,
    nativeEventTarget,
    nativeEventType: getNativeEventType(nativeEvent, wrapperRecord.domEventName),
    priorityRecord: wrapperRecord.priorityRecord,
    publicRootBehaviorChanged: false,
    status: 'blocked',
    syntheticEventCount: 0,
    targetContainer: wrapperRecord.targetContainer,
    targetDispatchPathRecord,
    targetDispatchPathStatus: targetDispatchPathRecord.status,
    targetDispatchPathLength: targetDispatchPathRecord.length,
    targetHostInstanceNode:
      targetNormalizationRecord.closestMountedHostInstanceNode,
    targetHostInstanceStatus: targetNormalizationRecord.status,
    targetHostInstanceToken:
      targetNormalizationRecord.closestMountedHostInstanceToken,
    targetInst: targetDispatchPathRecord.targetInst,
    targetInstStatus: targetDispatchPathRecord.targetInstStatus,
    targetListenerFound:
      targetListenerLookupRecord === null
        ? false
        : targetListenerLookupRecord.listenerFound,
    targetListenerLookupBlockedReason:
      targetListenerLookupRecord === null
        ? null
        : targetListenerLookupRecord.blockedReason,
    targetListenerLookupRecord,
    targetListenerLookupRecords:
      extractionRecord.targetListenerLookupRecords,
    targetListenerLookupCount:
      extractionRecord.targetListenerLookupCount,
    targetListenerLookupStatus:
      targetListenerLookupRecord === null
        ? 'not-applicable'
        : targetListenerLookupRecord.listenerStatus,
    targetListenerRegistrationName:
      targetListenerLookupRecord === null
        ? null
        : targetListenerLookupRecord.registrationName,
    targetNormalizationRecord,
    targetResolutionBlockedReason: targetResolutionWasResolved
      ? null
      : EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
    targetResolutionStatus: targetResolutionWasResolved
      ? 'resolved'
      : 'blocked',
    willInvokeListeners: false,
    wrapperKind: wrapperRecord.wrapperKind,
    wrapperRecord
  });

  eventDispatchRecordPayloads.set(
    record,
    Object.freeze({
      extractionRecord,
      nativeEvent,
      nativeEventTarget,
      targetContainer: wrapperRecord.targetContainer,
      targetDispatchPathRecord,
      targetListenerLookupRecord,
      targetNormalizationRecord,
      wrapperRecord
    })
  );

  return record;
}

function createSimpleEventReactNameMap() {
  const reactNames = Object.create(null);

  for (const eventName of simpleEventPluginEvents) {
    const domEventName = eventName.toLowerCase();
    reactNames[domEventName] =
      'on' + eventName[0].toUpperCase() + eventName.slice(1);
  }

  reactNames.animationend = 'onAnimationEnd';
  reactNames.animationiteration = 'onAnimationIteration';
  reactNames.animationstart = 'onAnimationStart';
  reactNames.dblclick = 'onDoubleClick';
  reactNames.focusin = 'onFocus';
  reactNames.focusout = 'onBlur';
  reactNames.transitioncancel = 'onTransitionCancel';
  reactNames.transitionend = 'onTransitionEnd';
  reactNames.transitionrun = 'onTransitionRun';
  reactNames.transitionstart = 'onTransitionStart';

  return Object.freeze(reactNames);
}

function getSimpleEventReactName(domEventName) {
  return Object.prototype.hasOwnProperty.call(
    simpleEventReactNames,
    domEventName
  )
    ? simpleEventReactNames[domEventName]
    : null;
}

function getSimpleEventRegistrationName(domEventName, eventSystemFlags) {
  const reactName = getSimpleEventReactName(domEventName);
  if (reactName === null) {
    return null;
  }

  return isCapturePhase(eventSystemFlags) ? reactName + 'Capture' : reactName;
}

module.exports = {
  CONTROLLED_STATE_RESTORE_BLOCKED_CODE,
  CHANGE_EVENT_PLUGIN_NAME,
  DEFAULT_PREVENTED_DIAGNOSTIC_BLOCKED_CODE,
  DISPATCH_DEFAULT_PREVENTED_DIAGNOSTIC_RECORD_KIND,
  DISPATCH_LISTENER_RECORD_KIND,
  DISPATCH_LISTENER_CANARY_EVENT_KIND,
  DISPATCH_LISTENER_ERROR_ROUTE_RECORD_KIND,
  DISPATCH_LISTENER_INVOCATION_CANARY_RECORD_KIND,
  DISPATCH_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_RECORD_KIND,
  DISPATCH_QUEUE_INVOCATION_CANARY_RECORD_KIND,
  DISPATCH_QUEUE_ENTRY_RECORD_KIND,
  DISPATCH_QUEUE_RECORD_KIND,
  DISPATCH_PROPAGATION_STOP_DIAGNOSTIC_RECORD_KIND,
  EVENT_TYPE_DISPATCH_CANARY_RECORD_KIND,
  PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND,
  PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND,
  PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_RECORD_KIND,
  EVENT_DISPATCH_BLOCKED_CODE,
  EVENT_DISPATCH_RECORD_KIND,
  EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE,
  EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND,
  EVENT_PLUGIN_NAMES,
  EVENT_TARGET_RESOLUTION_BLOCKED_CODE,
  FOCUS_BLUR_EVENT_BLOCKED_CODE,
  FOCUS_BLUR_EVENT_BLOCKER_GATE_RECORD_KIND,
  FOCUS_BLUR_EVENT_BLOCKER_LISTENER_RECORD_KIND,
  FOCUS_BLUR_EVENT_BLOCKER_PHASE_RECORD_KIND,
  FOCUS_BLUR_EVENT_LISTENER_INSTALLATION_BLOCKED_CODE,
  HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND,
  HYDRATION_REPLAY_EVENT_QUEUE_ENTRY_RECORD_KIND,
  HYDRATION_DEHYDRATED_BOUNDARY_OWNER_RECORD_KIND,
  HYDRATION_DEHYDRATED_ROOT_OWNER_RECORD_KIND,
  HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND,
  HYDRATION_HYDRATABLE_EVENT_TARGET_LOOKUP_RECORD_KIND,
  HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC_KIND,
  HYDRATION_REPLAY_TARGET_DISPATCH_LINK_DIAGNOSTIC_KIND,
  HYDRATION_REPLAY_TARGET_DISPATCH_LINK_EVENT_PATH_ENTRY_RECORD_KIND,
  HYDRATION_REPLAY_BLOCKED_CODE,
  HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND,
  INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_BLOCKED_CODE,
  INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND,
  INVALID_DISPATCH_LISTENER_RECORD_CODE,
  INVALID_EVENT_DISPATCH_RECORD_CODE,
  INVALID_EVENT_WRAPPER_RECORD_CODE,
  INVALID_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_CODE,
  INVALID_FOCUS_BLUR_EVENT_BLOCKER_GATE_CODE,
  INVALID_PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
  INVALID_HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC_CODE,
  INVALID_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_CODE,
  INVALID_PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_CODE,
  INVALID_PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
  INVALID_PORTAL_EVENT_OWNER_ROOT_GATE_CODE,
  LISTENER_ERROR_ROUTING_BLOCKED_CODE,
  NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_BLOCKED_CODE,
  PLUGIN_EXTRACTION_BLOCKED_CODE,
  PLUGIN_EXTRACTION_RECORD_KIND,
  PORTAL_EVENT_BUBBLING_BLOCKED_CODE,
  PORTAL_EVENT_OWNER_ROOT_GATE_RECORD_KIND,
  POLYFILL_EVENT_PLUGIN_NAMES,
  PRIVATE_FAKE_DOM_EVENT_DISPATCH_ADMISSION_STATUS,
  PRIVATE_CURRENT_TARGET_PROGRESSION_DIAGNOSTIC_STATUS,
  PRIVATE_DEFAULT_PREVENTED_DIAGNOSTIC_STATUS,
  PRIVATE_DISPATCH_QUEUE_INVOCATION_CANARY_STATUS,
  PRIVATE_LISTENER_ERROR_ROUTING_DIAGNOSTIC_STATUS,
  PRIVATE_NATIVE_STOP_IMMEDIATE_PROPAGATION_DIAGNOSTIC_STATUS,
  PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS,
  PRIVATE_PROPAGATION_STOP_DIAGNOSTIC_STATUS,
  PRIVATE_EVENT_TYPE_DISPATCH_CANARY_STATUS,
  PRIVATE_CLICK_EVENT_DELEGATION_ACCEPTED_LISTENER_ORDER_STATUS,
  PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS,
  PRIVATE_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_STATUS,
  PRIVATE_FOCUS_BLUR_EVENT_BLOCKER_GATE_STATUS,
  PRIVATE_HYDRATION_REPLAY_CLICK_DISPATCH_STATUS,
  PRIVATE_HYDRATION_REPLAY_TARGET_DISPATCH_LINK_STATUS,
  PRIVATE_INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_STATUS,
  PRIVATE_SINGLE_LISTENER_INVOCATION_CANARY_STATUS,
  PRIVATE_SYNTHETIC_EVENT_SHAPE_GATE_STATUS,
  PRIVATE_SYNTHETIC_EVENT_SHAPE_STATUS,
  PROPAGATION_STOP_DIAGNOSTIC_BLOCKED_CODE,
  PUBLIC_EVENT_DISPATCH_BLOCKED_CODE,
  SCROLL_END_EVENT_PLUGIN_NAME,
  SIMPLE_EVENT_PLUGIN_NAME,
  SYNTHETIC_EVENT_BLOCKED_CODE,
  SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND,
  SYNTHETIC_EVENT_SHAPE_RECORD_KIND,
  assertEventListenerWrapperRecord,
  createEventDispatchRecordFromWrapperRecord,
  createEventTypeDispatchCanaryRecord,
  createFocusBlurEventBlockerGateFromDispatchRecords,
  createHydrationDehydratedTargetResolutionDiagnostic,
  createHydrationReplayClickDispatchDiagnostic,
  createHydrationReplayTargetDispatchLinkDiagnostic,
  createInputChangeEventExtractionPreflightRecord,
  createHydrationReplayEventQueueDiagnostic,
  createPrivateFocusBlurEventDispatchExecutionRecord,
  createPrivateClickEventDelegationDispatchGate,
  createPortalEventOwnerRootGateRecord,
  createPluginExtractionRecord,
  createSyntheticEventShapeGateFromDispatchRecords,
  createSyntheticEventShapeRecordForDispatchListenerRecord,
  getDispatchListenerErrorRouteRecordPayload,
  getHydrationDehydratedTargetResolutionDiagnosticPayload,
  getInputChangeEventExtractionPreflightRecordPayload,
  getPortalEventOwnerRootGateRecordPayload,
  getDispatchListenerInvocationCanaryRecordPayload,
  getDispatchListenerRecordPayload,
  getDispatchQueueEntryRecordPayload,
  getDispatchQueueInvocationCanaryRecordPayload,
  getEventDispatchRecordPayload,
  getEventTypeDispatchCanaryRecordPayload,
  getHydrationReplayClickDispatchDiagnosticPayload,
  getHydrationReplayTargetDispatchLinkDiagnosticPayload,
  getFocusBlurEventBlockerGateRecordPayload,
  getPrivateFocusBlurEventDispatchExecutionPayload,
  getPrivateClickEventDelegationAcceptedListenerOrderPayload,
  getPrivateClickEventDelegationDispatchGatePayload,
  getSimpleEventReactName,
  getSimpleEventRegistrationName,
  getSyntheticEventShapeGateRecordPayload,
  getSyntheticEventShapeRecordPayload,
  getWrapperRecord,
  invokePrivateFocusBlurEventDispatchExecutionRecord,
  invokePrivateClickEventDelegationAcceptedListenerOrder,
  invokePrivateClickEventDelegationDispatchGate,
  invokeDispatchListenerRecordForCanary,
  invokeDispatchQueueCanaryFromDispatchRecords,
  invokeSingleListenerCanaryFromDispatchRecord,
  isHydrationDehydratedTargetResolutionDiagnostic,
  isInputChangeEventExtractionPreflightRecord,
  isDispatchListenerInvocationCanaryRecord,
  isDispatchListenerErrorRouteRecord,
  isDispatchListenerRecord,
  isDispatchQueueEntryRecord,
  isDispatchQueueInvocationCanaryRecord,
  isEventTypeDispatchCanaryRecord,
  isFocusBlurEventBlockerGateRecord,
  isHydrationReplayClickDispatchDiagnostic,
  isPrivateFocusBlurEventDispatchExecutionRecord,
  isPrivateClickEventDelegationAcceptedListenerOrderRecord,
  isPrivateClickEventDelegationDispatchGateRecord,
  isPortalEventOwnerRootGateRecord,
  isSyntheticEventShapeGateRecord,
  isSyntheticEventShapeRecord
};
