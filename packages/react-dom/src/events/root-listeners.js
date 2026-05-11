'use strict';

const {
  DOCUMENT_NODE,
  describeContainer,
  getOwnerDocument
} = require('../client/dom-container.js');
const {
  PRIVATE_ROOT_HOST_OUTPUT_EVENT_TARGET_RECORD_KIND,
  createPrivateRootHostOutputEventTargetRecord,
  getPrivateRootHostOutputEventTargetRecordPayload,
  isPrivateRootHostOutputEventTargetRecord
} = require('../client/component-tree.js');
const {
  allNativeEvents,
  isKnownNativeEvent,
  isNonDelegatedEvent,
  isPassiveBrowserEvent
} = require('./event-names.js');
const {
  assertEventTarget,
  getEventListenerSet,
  getListenerSetKey,
  getPrivateEventListenerQueueEntryPayload,
  hasListeningMarker,
  inspectListeningMarker,
  internalEventHandlersKey,
  internalListeningMarker,
  markTargetAsListening
} = require('./listener-registry.js');
const {
  createEventListenerWrapperRecordWithPriority
} = require('./react-dom-event-listener.js');
const {
  createSyntheticEventShapeGateFromDispatchRecords,
  createEventDispatchRecordFromWrapperRecord,
  getDispatchListenerRecordPayload,
  getDispatchQueueEntryRecordPayload,
  getDispatchQueueInvocationCanaryRecordPayload,
  getPrivateClickEventDelegationDispatchGatePayload,
  getPrivateFocusBlurEventDispatchExecutionPayload,
  getSyntheticEventShapeGateRecordPayload,
  invokePrivateFocusBlurEventDispatchExecutionRecord,
  invokePrivateClickEventDelegationDispatchGate,
  invokeDispatchQueueCanaryFromDispatchRecords,
  invokeSingleListenerCanaryFromDispatchRecord
} = require('./plugin-event-system.js');
const {
  IS_CAPTURE_PHASE,
  IS_NON_DELEGATED
} = require('./event-system-flags.js');

const privateRootListenerRegistrationRecordType =
  'fast.react_dom.private_root_listener_registration_record';
const privateRootListenerCleanupRecordType =
  'fast.react_dom.private_root_listener_cleanup_record';
const privateRootListenerCurrentnessGateRecordType =
  'fast.react_dom.private_root_listener_currentness_gate_record';
const privatePortalPrepareMountListenerIntentRecordType =
  'fast.react_dom.private_portal_prepare_mount_listener_intent_record';
const ROOT_LISTENERS_REGISTERED =
  'registered-private-root-listeners';
const ROOT_LISTENERS_REVERTED =
  'reverted-private-root-listeners';
const PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_STATUS =
  'validated-private-root-listener-currentness-gate';
const PORTAL_PREPARE_MOUNT_LISTENER_INTENT_RECORDED =
  'recorded-private-portal-prepare-mount-listener-intent';
const PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_RECORD_KIND =
  'FastReactDomPrivateRootHostOutputClickDispatchCanaryRecord';
const PRIVATE_ROOT_HOST_OUTPUT_SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND =
  'FastReactDomPrivateRootHostOutputSyntheticEventShapeGateRecord';
const PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND =
  'FastReactDomPrivateRootClickEventDelegationDispatchGateRecord';
const PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND =
  'FastReactDomPrivateRootFocusBlurEventDispatchExecutionRecord';
const PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_STATUS =
  'controlled-private-root-host-output-click-dispatch-canary';
const PRIVATE_ROOT_HOST_OUTPUT_SYNTHETIC_EVENT_SHAPE_GATE_STATUS =
  'controlled-private-root-host-output-synthetic-event-shape-gate';
const PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS =
  'admitted-private-root-click-event-delegation-dispatch-gate';
const PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_STATUS =
  'admitted-private-root-focus-blur-event-dispatch-execution';
const INVALID_PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH';
const INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE';
const INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION';
const INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE';

const rootListenerRegistrationPayloads = new WeakMap();
const rootListenerCleanupRecords = new WeakMap();
const rootListenerDispatchRecords = new WeakMap();
const rootListenerInvocationCanaryRecords = new WeakMap();
const privateRootListenerCurrentnessGatePayloads = new WeakMap();
const privateRootHostOutputClickDispatchCanaryPayloads = new WeakMap();
const privateRootClickEventDelegationDispatchGatePayloads = new WeakMap();
const privateRootFocusBlurEventDispatchExecutionPayloads = new WeakMap();
const portalPrepareMountListenerIntentPayloads = new WeakMap();
const privateRootHostOutputSyntheticEventShapeGatePayloads = new WeakMap();

function isObjectLike(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function createEventListenerShell(target, domEventName, eventSystemFlags) {
  const priorityWrapperRecord = createEventListenerWrapperRecordWithPriority(
    target,
    domEventName,
    eventSystemFlags
  );
  let wrapperRecord;
  const listener = function reactDomRootEventListenerShell(nativeEvent) {
    const dispatchRecord = createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      nativeEvent
    );
    rootListenerDispatchRecords.set(listener, dispatchRecord);
    return undefined;
  };

  wrapperRecord = Object.freeze({
    dispatcherName: priorityWrapperRecord.dispatcherName,
    domEventName: priorityWrapperRecord.domEventName,
    eventPriority: priorityWrapperRecord.eventPriority,
    eventPriorityLabel: priorityWrapperRecord.eventPriorityLabel,
    eventPriorityLane: priorityWrapperRecord.eventPriorityLane,
    eventPriorityName: priorityWrapperRecord.eventPriorityName,
    eventSystemFlags: priorityWrapperRecord.eventSystemFlags,
    kind: priorityWrapperRecord.kind,
    listener,
    priorityRecord: priorityWrapperRecord.priorityRecord,
    targetContainer: priorityWrapperRecord.targetContainer,
    wrapperKind: priorityWrapperRecord.wrapperKind
  });

  Object.defineProperties(listener, {
    __FAST_REACT_DOM_EVENT_WRAPPER_RECORD__: {
      value: wrapperRecord
    },
    __FAST_REACT_DOM_EVENT_WRAPPER__: {
      value: true
    },
    __FAST_REACT_DOM_EVENT_WRAPPER_KIND__: {
      value: wrapperRecord.wrapperKind
    },
    __FAST_REACT_DOM_EVENT_PRIORITY__: {
      value: wrapperRecord.eventPriority
    },
    __FAST_REACT_DOM_EVENT_PRIORITY_LABEL__: {
      value: wrapperRecord.eventPriorityLabel
    },
    __FAST_REACT_DOM_EVENT_PRIORITY_NAME__: {
      value: wrapperRecord.eventPriorityName
    },
    __FAST_REACT_DOM_EVENT_SHELL__: {
      value: true
    },
    __FAST_REACT_DOM_EVENT_FLAGS__: {
      value: eventSystemFlags
    },
    __FAST_REACT_DOM_EVENT_NAME__: {
      value: domEventName
    },
    __FAST_REACT_DOM_EVENT_TARGET__: {
      value: target
    },
    __FAST_REACT_DOM_EVENT_SHELL_WRAPPER_RECORD__: {
      value: wrapperRecord
    }
  });

  return listener;
}

function getLastRootListenerDispatchRecord(listener) {
  if (
    listener === null ||
    (typeof listener !== 'object' && typeof listener !== 'function')
  ) {
    return null;
  }

  return rootListenerDispatchRecords.get(listener) || null;
}

function invokeLastRootListenerSingleListenerCanary(listener, options) {
  const dispatchRecord = getLastRootListenerDispatchRecord(listener);
  const invocationRecord = invokeSingleListenerCanaryFromDispatchRecord(
    dispatchRecord,
    options
  );
  rootListenerInvocationCanaryRecords.set(listener, invocationRecord);
  return invocationRecord;
}

function getLastRootListenerInvocationCanaryRecord(listener) {
  if (
    listener === null ||
    (typeof listener !== 'object' && typeof listener !== 'function')
  ) {
    return null;
  }

  return rootListenerInvocationCanaryRecords.get(listener) || null;
}

function invokePrivateRootHostOutputClickDispatchCanary(
  listenerRegistrationRecord,
  hostOutputPayloadOrTargetRecord,
  options
) {
  const diagnosticOptions =
    normalizePrivateRootHostOutputClickDispatchCanaryOptions(options);
  const registrationPayload =
    assertActiveRootListenerRegistrationPayload(listenerRegistrationRecord);
  const targetRecord = isPrivateRootHostOutputEventTargetRecord(
    hostOutputPayloadOrTargetRecord
  )
    ? hostOutputPayloadOrTargetRecord
    : createPrivateRootHostOutputEventTargetRecord(
        hostOutputPayloadOrTargetRecord,
        options
      );
  const targetPayload =
    getPrivateRootHostOutputEventTargetRecordPayload(targetRecord);
  if (targetPayload === null) {
    throwRootHostOutputClickDispatchError(
      'Expected private React DOM root host-output event target metadata.'
    );
  }

  const clickListeners = getInstalledRootListenerPair(
    registrationPayload,
    'click'
  );
  const nativeEvent = createPrivateFakeClickEvent(targetPayload.targetNode);
  const captureDispatchRecord = dispatchInstalledRootListener(
    clickListeners.capture,
    nativeEvent
  );
  const bubbleDispatchRecord = dispatchInstalledRootListener(
    clickListeners.bubble,
    nativeEvent
  );
  const queueInvocationRecord = invokeDispatchQueueCanaryFromDispatchRecords(
    [captureDispatchRecord, bubbleDispatchRecord],
    {
      enableDefaultPreventedDiagnostics:
        diagnosticOptions.enableDefaultPreventedDiagnostics,
      enableListenerErrorRoutingDiagnostics:
        diagnosticOptions.enableListenerErrorRoutingDiagnostics,
      enableNativeStopImmediatePropagationDiagnostics:
        diagnosticOptions.enableNativeStopImmediatePropagationDiagnostics,
      enablePropagationStopDiagnostics:
        diagnosticOptions.enablePropagationStopDiagnostics,
      useProcessingOrder: true
    }
  );
  const queueInvocationPayload =
    getDispatchQueueInvocationCanaryRecordPayload(queueInvocationRecord);
  const invocationRecords =
    queueInvocationPayload === null
      ? []
      : queueInvocationPayload.invocationRecords;
  const record = freezeRecord({
    browserDomEventCompatibilityClaimed: false,
    captureDispatchRecordKind: captureDispatchRecord.kind,
    clickDispatchOrder: freezeArray(['capture', 'bubble']),
    defaultPrevented: queueInvocationRecord.defaultPrevented,
    defaultPreventedDiagnosticEnabled:
      queueInvocationRecord.defaultPreventedDiagnosticEnabled,
    defaultPreventedDiagnosticStatus:
      queueInvocationRecord.defaultPreventedDiagnosticStatus,
    defaultPreventedDiagnostics: freezeArray(
      queueInvocationRecord.defaultPreventedDiagnostics
    ),
    dispatchQueueInvocationRecordKind: queueInvocationRecord.kind,
    dispatchRecordCount: 2,
    domEventName: 'click',
    eventDispatch: false,
    fakeDomEventCompatibilityClaimed: false,
    invocationOrder: freezeArray(queueInvocationRecord.invocationOrder),
    invocationRecordCount: queueInvocationRecord.invocationRecordCount,
    kind: PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_RECORD_KIND,
    listenerErrorCount: queueInvocationRecord.listenerErrorCount,
    listenerErrorRouteCount: queueInvocationRecord.listenerErrorRouteCount,
    listenerErrorRoutes: freezeArray(queueInvocationRecord.listenerErrorRoutes),
    listenerErrorRoutingDiagnosticEnabled:
      queueInvocationRecord.listenerErrorRoutingDiagnosticEnabled,
    listenerErrorRoutingStatus:
      queueInvocationRecord.listenerErrorRoutingStatus,
    listenerInvocationCount: queueInvocationRecord.listenerInvocationCount,
    nativeDefaultPreventedAfterDispatch:
      queueInvocationRecord.nativeDefaultPreventedAfterDispatch,
    nativeDefaultPreventedBeforeDispatch:
      queueInvocationRecord.nativeDefaultPreventedBeforeDispatch,
    nativeEventPreventDefaultCallCount:
      nativeEvent.preventDefaultCallCount,
    preventDefaultCallCount:
      queueInvocationRecord.preventDefaultCallCount,
    nativeEventStopImmediatePropagationCallCount:
      nativeEvent.stopImmediatePropagationCallCount,
    nativeEventStopPropagationCallCount:
      nativeEvent.stopPropagationCallCount,
    nativeImmediatePropagationStopped:
      queueInvocationRecord.nativeImmediatePropagationStopped,
    nativeStopImmediatePropagationCallCount:
      queueInvocationRecord.nativeStopImmediatePropagationCallCount,
    nativeStopImmediatePropagationDiagnosticEnabled:
      queueInvocationRecord.nativeStopImmediatePropagationDiagnosticEnabled,
    nativeStopImmediatePropagationDiagnosticStatus:
      queueInvocationRecord.nativeStopImmediatePropagationDiagnosticStatus,
    nativeStopImmediatePropagationDiagnostics: freezeArray(
      queueInvocationRecord.nativeStopImmediatePropagationDiagnostics
    ),
    nativeStopImmediatePropagationNativeCallCount:
      queueInvocationRecord.nativeStopImmediatePropagationNativeCallCount,
    nativeStopImmediatePropagationSkippedListenerCount:
      queueInvocationRecord.nativeStopImmediatePropagationSkippedListenerCount,
    privateCanaryInvocation: true,
    propagationSkippedListenerCount:
      queueInvocationRecord.propagationSkippedListenerCount,
    propagationStopCallCount:
      queueInvocationRecord.propagationStopCallCount,
    propagationStopDiagnosticEnabled:
      queueInvocationRecord.propagationStopDiagnosticEnabled,
    propagationStopDiagnosticStatus:
      queueInvocationRecord.propagationStopDiagnosticStatus,
    propagationStopDiagnostics: freezeArray(
      queueInvocationRecord.propagationStopDiagnostics
    ),
    propagationStopNativeCallCount:
      queueInvocationRecord.propagationStopNativeCallCount,
    propagationStopped: queueInvocationRecord.propagationStopped,
    publicDispatchBlockedReason:
      queueInvocationRecord.publicDispatchBlockedReason,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    rootListenerDispatchOrder: freezeArray(['capture', 'bubble']),
    selectedFromProcessingOrder:
      queueInvocationRecord.selectedFromProcessingOrder,
    status: PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_STATUS,
    syntheticEventBlockedReason:
      queueInvocationRecord.syntheticEventBlockedReason,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetRecordKind: PRIVATE_ROOT_HOST_OUTPUT_EVENT_TARGET_RECORD_KIND,
    targetInst: targetRecord.targetInst,
    targetInstStatus: targetRecord.targetInstStatus,
    willInvokePublicListeners: false,
    bubbleDispatchRecordKind: bubbleDispatchRecord.kind,
    bubbleListenerInvocationCount:
      queueInvocationRecord.bubbleListenerInvocationCount,
    captureListenerInvocationCount:
      queueInvocationRecord.captureListenerInvocationCount
  });

  privateRootHostOutputClickDispatchCanaryPayloads.set(
    record,
    freezeRecord({
      bubbleDispatchRecord,
      bubbleListenerRecord: clickListeners.bubble,
      captureDispatchRecord,
      captureListenerRecord: clickListeners.capture,
      invocationRecords,
      listenerRegistrationRecord,
      nativeEvent,
      options: diagnosticOptions,
      queueInvocationRecord,
      targetPayload,
      targetRecord
    })
  );

  return record;
}

function invokePrivateRootClickEventDelegationDispatchGate(
  listenerRegistrationRecord,
  hostOutputPayloadOrTargetRecord,
  acceptedListenerQueueEntryRecord,
  options
) {
  const diagnosticOptions =
    normalizePrivateRootClickEventDelegationDispatchGateOptions(options);
  const registrationPayload =
    assertActiveRootListenerRegistrationPayload(
      listenerRegistrationRecord,
      throwRootClickEventDelegationDispatchGateError,
      'Expected a private React DOM root listener registration record.',
      'Cannot dispatch a private root click event delegation gate after root listeners were reverted.'
    );
  const rootListenerCurrentness =
    assertPrivateRootDispatchListenerCurrentnessGate(
      listenerRegistrationRecord,
      registrationPayload,
      diagnosticOptions.rootListenerCurrentnessGateRecord,
      throwRootClickEventDelegationDispatchGateError,
      'Private root click event delegation dispatch requires a current root listener currentness gate before dispatch.'
    );
  const targetRecord = isPrivateRootHostOutputEventTargetRecord(
    hostOutputPayloadOrTargetRecord
  )
    ? hostOutputPayloadOrTargetRecord
    : createPrivateRootHostOutputEventTargetRecord(
        hostOutputPayloadOrTargetRecord,
        options
      );
  const targetPayload =
    getPrivateRootHostOutputEventTargetRecordPayload(targetRecord);
  if (targetPayload === null) {
    throwRootClickEventDelegationDispatchGateError(
      'Expected private React DOM root host-output event target metadata.',
      'invalid-target-record'
    );
  }

  assertAcceptedPrivateClickListenerQueueEntry(
    acceptedListenerQueueEntryRecord,
    diagnosticOptions.phase
  );

  const clickListeners = getInstalledRootListenerPair(
    registrationPayload,
    'click'
  );
  const rootListenerRecord =
    diagnosticOptions.phase === 'capture'
      ? clickListeners.capture
      : clickListeners.bubble;
  const nativeEvent = createPrivateFakeClickEvent(targetPayload.targetNode);
  const dispatchRecord = dispatchInstalledRootListener(
    rootListenerRecord,
    nativeEvent
  );
  const dispatchListenerRecord =
    findPrivateClickEventDelegationDispatchListenerRecord(
      dispatchRecord,
      acceptedListenerQueueEntryRecord,
      diagnosticOptions.useProcessingOrder
    );
  const pluginGateRecord = invokePrivateClickEventDelegationDispatchGate(
    dispatchRecord,
    dispatchListenerRecord,
    {
      portalEventOwnerRootGateRecord:
        diagnosticOptions.portalEventOwnerRootGateRecord
    }
  );
  const pluginGatePayload =
    getPrivateClickEventDelegationDispatchGatePayload(pluginGateRecord);
  const invocationRecord =
    pluginGatePayload === null ? null : pluginGatePayload.invocationRecord;
  const record = freezeRecord({
    browserDomEventCompatibilityClaimed: false,
    clickEventDelegationDispatchGate: true,
    compatibilityClaimed: false,
    dispatchListenerRecordKind: dispatchListenerRecord.kind,
    dispatchPathIndex: dispatchListenerRecord.dispatchPathIndex,
    dispatchRecordKind: dispatchRecord.kind,
    domEventName: 'click',
    eventDispatch: false,
    eventPriority: dispatchRecord.eventPriority,
    eventPriorityLabel: dispatchRecord.eventPriorityLabel,
    eventPriorityLane: dispatchRecord.eventPriorityLane,
    eventPriorityName: dispatchRecord.eventPriorityName,
    eventSystemFlags: dispatchRecord.eventSystemFlags,
    extractionRecordKind: dispatchRecord.extractionRecord.kind,
    inCapturePhase: dispatchRecord.inCapturePhase,
    invocationRecordKind:
      invocationRecord === null ? null : invocationRecord.kind,
    invocationStatus:
      invocationRecord === null
        ? 'missing-invocation-record'
        : invocationRecord.invocationStatus,
    kind: PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND,
    listenerInvocationCount: pluginGateRecord.listenerInvocationCount,
    listenerQueueIndex: dispatchListenerRecord.listenerQueueIndex,
    listenerQueueKey: dispatchListenerRecord.listenerQueueKey,
    listenerQueueRecordKind: dispatchListenerRecord.listenerQueueRecordKind,
    listenerStatus: dispatchListenerRecord.listenerStatus,
    listenerType: dispatchListenerRecord.listenerType,
    nativeEventTarget: dispatchRecord.nativeEventTarget,
    nativeEventType: dispatchRecord.nativeEventType,
    phase: diagnosticOptions.phase,
    pluginGateRecordKind: pluginGateRecord.kind,
    pluginGateStatus: pluginGateRecord.status,
    portalContainerContainsTarget:
      pluginGateRecord.portalContainerContainsTarget,
    portalOwnerRootAvailable: pluginGateRecord.portalOwnerRootAvailable,
    portalOwnerRootStatus: pluginGateRecord.portalOwnerRootStatus,
    privateListenerInvoked: pluginGateRecord.privateListenerInvoked,
    privateListenerQueue: true,
    publicDispatchBlocked: true,
    publicDispatchEnabled: false,
    publicPortalBubblingBlocked: true,
    publicPortalBubblingEnabled: pluginGateRecord.publicPortalBubblingEnabled,
    publicRootBehaviorChanged: false,
    rootContainerContainsTarget: pluginGateRecord.rootContainerContainsTarget,
    rootListenerCurrentnessGateKind:
      rootListenerCurrentness.gateRecord.kind,
    rootListenerCurrentnessGateStatus:
      rootListenerCurrentness.gateRecord.status,
    rootListenerCurrentnessSourceKind:
      rootListenerCurrentness.gateRecord.sourceKind,
    rootListenerCurrentnessSourceOwned: true,
    rootListenerDispatchOrder: freezeArray([diagnosticOptions.phase]),
    rootListenerSetKey: rootListenerRecord.listenerSetKey,
    selectedFromProcessingOrder: pluginGateRecord.selectedFromProcessingOrder,
    status: PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    targetDispatchPathLength: dispatchRecord.targetDispatchPathLength,
    targetDispatchPathStatus: dispatchRecord.targetDispatchPathStatus,
    targetInst: dispatchRecord.targetInst,
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetRecordKind: PRIVATE_ROOT_HOST_OUTPUT_EVENT_TARGET_RECORD_KIND,
    willDispatchPublicEvent: false,
    willInvokePublicListeners: false
  });

  privateRootClickEventDelegationDispatchGatePayloads.set(
    record,
    freezeRecord({
      acceptedListenerQueueEntryRecord,
      dispatchListenerRecord,
      dispatchRecord,
      invocationRecord,
      listenerRegistrationRecord,
      nativeEvent,
      options: diagnosticOptions,
      pluginGateRecord,
      rootListenerCurrentnessGateRecord:
        rootListenerCurrentness.gateRecord,
      rootListenerCurrentnessGatePayload:
        rootListenerCurrentness.gatePayload,
      rootListenerCurrentnessState:
        rootListenerCurrentness.currentState,
      rootListenerRecord,
      targetPayload,
      targetRecord
    })
  );

  return record;
}

function invokePrivateRootFocusBlurEventDispatchExecution(
  listenerRegistrationRecord,
  hostOutputPayloadOrTargetRecord,
  acceptedListenerQueueEntryRecord,
  options
) {
  const diagnosticOptions =
    normalizePrivateRootFocusBlurEventDispatchExecutionOptions(
      acceptedListenerQueueEntryRecord,
      options
    );
  const registrationPayload =
    assertActiveRootListenerRegistrationPayload(
      listenerRegistrationRecord,
      throwRootFocusBlurEventDispatchExecutionError,
      'Expected a private React DOM root listener registration record.',
      'Cannot execute a private root focus/blur event dispatch after root listeners were reverted.'
    );
  const rootListenerCurrentness =
    assertPrivateRootDispatchListenerCurrentnessGate(
      listenerRegistrationRecord,
      registrationPayload,
      diagnosticOptions.rootListenerCurrentnessGateRecord,
      throwRootFocusBlurEventDispatchExecutionError,
      'Private root focus/blur event dispatch execution requires a current root listener currentness gate before dispatch.'
    );
  const targetRecord = isPrivateRootHostOutputEventTargetRecord(
    hostOutputPayloadOrTargetRecord
  )
    ? hostOutputPayloadOrTargetRecord
    : createPrivateRootHostOutputEventTargetRecord(
        hostOutputPayloadOrTargetRecord,
        options
      );
  const targetPayload =
    getPrivateRootHostOutputEventTargetRecordPayload(targetRecord);
  if (targetPayload === null) {
    throwRootFocusBlurEventDispatchExecutionError(
      'Expected private React DOM root host-output event target metadata.',
      'invalid-target-record'
    );
  }

  assertAcceptedPrivateFocusBlurListenerQueueEntry(
    acceptedListenerQueueEntryRecord,
    diagnosticOptions.phase,
    diagnosticOptions.domEventName
  );

  const focusBlurListeners = getInstalledRootListenerPair(
    registrationPayload,
    diagnosticOptions.domEventName,
    throwRootFocusBlurEventDispatchExecutionError,
    'Private root focus/blur event dispatch execution requires capture and bubble root listener shells.'
  );
  const rootListenerRecord =
    diagnosticOptions.phase === 'capture'
      ? focusBlurListeners.capture
      : focusBlurListeners.bubble;
  const nativeEvent = createPrivateFakeFocusBlurEvent(
    targetPayload.targetNode,
    diagnosticOptions.domEventName
  );
  const dispatchRecord = dispatchInstalledRootListener(
    rootListenerRecord,
    nativeEvent,
    throwRootFocusBlurEventDispatchExecutionError,
    'Private root focus/blur event dispatch execution did not produce a dispatch record.'
  );
  const dispatchListenerRecord =
    findPrivateFocusBlurEventDispatchExecutionListenerRecord(
      dispatchRecord,
      acceptedListenerQueueEntryRecord,
      diagnosticOptions.useProcessingOrder
    );
  const pluginExecutionRecord =
    invokePrivateFocusBlurEventDispatchExecutionRecord(
      dispatchRecord,
      dispatchListenerRecord,
      {
        portalEventOwnerRootGateRecord:
          diagnosticOptions.portalEventOwnerRootGateRecord,
        useProcessingOrder: diagnosticOptions.useProcessingOrder
      }
    );
  const pluginExecutionPayload =
    getPrivateFocusBlurEventDispatchExecutionPayload(pluginExecutionRecord);
  const invocationRecord =
    pluginExecutionPayload === null
      ? null
      : pluginExecutionPayload.invocationRecord;
  const record = freezeRecord({
    browserDomEventCompatibilityClaimed: false,
    canaryEventKind: pluginExecutionRecord.canaryEventKind,
    compatibilityClaimed: false,
    currentTarget: pluginExecutionRecord.currentTarget,
    dispatchListenerRecordKind: dispatchListenerRecord.kind,
    dispatchPathIndex: dispatchListenerRecord.dispatchPathIndex,
    dispatchRecordKind: dispatchRecord.kind,
    domEventName: diagnosticOptions.domEventName,
    eventDispatch: false,
    eventPriority: dispatchRecord.eventPriority,
    eventPriorityLabel: dispatchRecord.eventPriorityLabel,
    eventPriorityLane: dispatchRecord.eventPriorityLane,
    eventPriorityName: dispatchRecord.eventPriorityName,
    eventSystemFlags: dispatchRecord.eventSystemFlags,
    fakeDomEventDispatchExecution: true,
    focusBlurEventDispatchExecution: true,
    inCapturePhase: dispatchRecord.inCapturePhase,
    invocationRecordKind:
      invocationRecord === null ? null : invocationRecord.kind,
    invocationStatus:
      invocationRecord === null
        ? 'missing-invocation-record'
        : invocationRecord.invocationStatus,
    kind: PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND,
    listenerInvocationCount: pluginExecutionRecord.listenerInvocationCount,
    listenerQueueIndex: dispatchListenerRecord.listenerQueueIndex,
    listenerQueueKey: dispatchListenerRecord.listenerQueueKey,
    listenerQueueRecordKind: dispatchListenerRecord.listenerQueueRecordKind,
    listenerStatus: dispatchListenerRecord.listenerStatus,
    listenerType: dispatchListenerRecord.listenerType,
    nativeEventTarget: dispatchRecord.nativeEventTarget,
    nativeEventType: dispatchRecord.nativeEventType,
    phase: diagnosticOptions.phase,
    pluginExecutionRecordKind: pluginExecutionRecord.kind,
    pluginExecutionStatus: pluginExecutionRecord.status,
    portalOwnerRootAvailable:
      pluginExecutionRecord.portalOwnerRootAvailable,
    privateListenerInvoked: pluginExecutionRecord.privateListenerInvoked,
    privateListenerQueue: true,
    publicDispatchBlocked: true,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    reactName: pluginExecutionRecord.reactName,
    registrationName: pluginExecutionRecord.registrationName,
    rootListenerCurrentnessGateKind:
      rootListenerCurrentness.gateRecord.kind,
    rootListenerCurrentnessGateStatus:
      rootListenerCurrentness.gateRecord.status,
    rootListenerCurrentnessSourceKind:
      rootListenerCurrentness.gateRecord.sourceKind,
    rootListenerCurrentnessSourceOwned: true,
    rootListenerDispatchOrder: freezeArray([diagnosticOptions.phase]),
    rootListenerSetKey: rootListenerRecord.listenerSetKey,
    selectedFromProcessingOrder:
      pluginExecutionRecord.selectedFromProcessingOrder,
    status: PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_STATUS,
    syntheticEventCount: 0,
    syntheticEventStatus: 'blocked-not-created',
    syntheticEventType: pluginExecutionRecord.syntheticEventType,
    syntheticFocusEventCreation: false,
    targetInst: dispatchRecord.targetInst,
    targetInstStatus: dispatchRecord.targetInstStatus,
    targetRecordKind: PRIVATE_ROOT_HOST_OUTPUT_EVENT_TARGET_RECORD_KIND,
    willCreateSyntheticFocusEvent: false,
    willDispatchPublicEvent: false,
    willInvokePublicListeners: false
  });

  privateRootFocusBlurEventDispatchExecutionPayloads.set(
    record,
    freezeRecord({
      acceptedListenerQueueEntryRecord,
      dispatchListenerRecord,
      dispatchRecord,
      invocationRecord,
      listenerRegistrationRecord,
      nativeEvent,
      options: diagnosticOptions,
      pluginExecutionRecord,
      rootListenerCurrentnessGateRecord:
        rootListenerCurrentness.gateRecord,
      rootListenerCurrentnessGatePayload:
        rootListenerCurrentness.gatePayload,
      rootListenerCurrentnessState:
        rootListenerCurrentness.currentState,
      rootListenerRecord,
      targetPayload,
      targetRecord
    })
  );

  return record;
}

function createPrivateRootHostOutputClickSyntheticEventShapeGate(
  listenerRegistrationRecord,
  hostOutputPayloadOrTargetRecord,
  options
) {
  const registrationPayload =
    assertActiveRootListenerRegistrationPayload(listenerRegistrationRecord);
  const targetRecord = isPrivateRootHostOutputEventTargetRecord(
    hostOutputPayloadOrTargetRecord
  )
    ? hostOutputPayloadOrTargetRecord
    : createPrivateRootHostOutputEventTargetRecord(
        hostOutputPayloadOrTargetRecord,
        options
      );
  const targetPayload =
    getPrivateRootHostOutputEventTargetRecordPayload(targetRecord);
  if (targetPayload === null) {
    throwRootHostOutputClickDispatchError(
      'Expected private React DOM root host-output event target metadata.'
    );
  }

  const normalizedOptions = isObjectLike(options) ? options : {};
  const clickListeners = getInstalledRootListenerPair(
    registrationPayload,
    'click'
  );
  const nativeEvent = createPrivateFakeClickEvent(targetPayload.targetNode);
  const captureDispatchRecord = dispatchInstalledRootListener(
    clickListeners.capture,
    nativeEvent
  );
  const bubbleDispatchRecord = dispatchInstalledRootListener(
    clickListeners.bubble,
    nativeEvent
  );
  const shapeGateRecord = createSyntheticEventShapeGateFromDispatchRecords(
    [captureDispatchRecord, bubbleDispatchRecord],
    {
      preventDefaultAtPhase:
        normalizedOptions.preventDefaultAtPhase === undefined
          ? null
          : normalizedOptions.preventDefaultAtPhase,
      useProcessingOrder: true
    }
  );
  const shapeGatePayload =
    getSyntheticEventShapeGateRecordPayload(shapeGateRecord);
  const shapeRecords =
    shapeGatePayload === null ? [] : shapeGatePayload.shapeRecords;
  const record = freezeRecord({
    browserDomEventCompatibilityClaimed: false,
    bubbleDispatchRecordKind: bubbleDispatchRecord.kind,
    captureDispatchRecordKind: captureDispatchRecord.kind,
    clickDispatchOrder: freezeArray(['capture', 'bubble']),
    dispatchQueueProcessed: false,
    dispatchRecordCount: 2,
    domEventName: 'click',
    eventDispatch: false,
    fakeDomEventCompatibilityClaimed: false,
    kind: PRIVATE_ROOT_HOST_OUTPUT_SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND,
    listenerInvocationCount: 0,
    nativeEventDefaultPrevented: nativeEvent.defaultPrevented === true,
    nativeEventPreventDefaultCallCount:
      nativeEvent.preventDefaultCallCount,
    preventDefaultAtPhase:
      shapeGateRecord.preventDefaultAtPhase,
    preventDefaultShapeCount:
      shapeGateRecord.preventDefaultShapeCount,
    privateSyntheticEventShapeGate: true,
    publicDispatchBlockedReason:
      shapeGateRecord.publicDispatchBlockedReason,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    rootListenerDispatchOrder: freezeArray(['capture', 'bubble']),
    selectedFromProcessingOrder:
      shapeGateRecord.selectedFromProcessingOrder,
    shapeGateRecordKind: shapeGateRecord.kind,
    status: PRIVATE_ROOT_HOST_OUTPUT_SYNTHETIC_EVENT_SHAPE_GATE_STATUS,
    syntheticEventCompatibilityClaimed: false,
    syntheticEventCount: shapeGateRecord.syntheticEventCount,
    syntheticEventDispatchCount:
      shapeGateRecord.syntheticEventDispatchCount,
    syntheticEventShapeCount:
      shapeGateRecord.syntheticEventShapeCount,
    syntheticEventShapeOrder: freezeArray(
      shapeGateRecord.syntheticEventShapeOrder
    ),
    targetRecordKind: PRIVATE_ROOT_HOST_OUTPUT_EVENT_TARGET_RECORD_KIND,
    targetInst: targetRecord.targetInst,
    targetInstStatus: targetRecord.targetInstStatus,
    willInvokeListeners: false,
    willInvokePublicListeners: false
  });

  privateRootHostOutputSyntheticEventShapeGatePayloads.set(
    record,
    freezeRecord({
      bubbleDispatchRecord,
      bubbleListenerRecord: clickListeners.bubble,
      captureDispatchRecord,
      captureListenerRecord: clickListeners.capture,
      listenerRegistrationRecord,
      nativeEvent,
      shapeGateRecord,
      shapeRecords,
      targetPayload,
      targetRecord
    })
  );

  return record;
}

function getPrivateRootHostOutputClickDispatchCanaryPayload(record) {
  if (
    record === null ||
    (typeof record !== 'object' && typeof record !== 'function')
  ) {
    return null;
  }

  return privateRootHostOutputClickDispatchCanaryPayloads.get(record) || null;
}

function getPrivateRootHostOutputSyntheticEventShapeGatePayload(record) {
  if (
    record === null ||
    (typeof record !== 'object' && typeof record !== 'function')
  ) {
    return null;
  }

  return (
    privateRootHostOutputSyntheticEventShapeGatePayloads.get(record) || null
  );
}

function getPrivateRootClickEventDelegationDispatchGatePayload(record) {
  if (
    record === null ||
    (typeof record !== 'object' && typeof record !== 'function')
  ) {
    return null;
  }

  return (
    privateRootClickEventDelegationDispatchGatePayloads.get(record) || null
  );
}

function getPrivateRootFocusBlurEventDispatchExecutionPayload(record) {
  if (
    record === null ||
    (typeof record !== 'object' && typeof record !== 'function')
  ) {
    return null;
  }

  return (
    privateRootFocusBlurEventDispatchExecutionPayloads.get(record) || null
  );
}

function isPrivateRootHostOutputClickDispatchCanaryRecord(record) {
  return getPrivateRootHostOutputClickDispatchCanaryPayload(record) !== null;
}

function isPrivateRootClickEventDelegationDispatchGateRecord(record) {
  return (
    getPrivateRootClickEventDelegationDispatchGatePayload(record) !== null
  );
}

function isPrivateRootFocusBlurEventDispatchExecutionRecord(record) {
  return (
    getPrivateRootFocusBlurEventDispatchExecutionPayload(record) !== null
  );
}

function isPrivateRootHostOutputSyntheticEventShapeGateRecord(record) {
  return (
    getPrivateRootHostOutputSyntheticEventShapeGatePayload(record) !== null
  );
}

function createPrivateRootListenerCurrentnessGateRecord(
  listenerRegistrationRecord,
  options
) {
  const diagnosticOptions =
    normalizePrivateRootListenerCurrentnessGateOptions(options);
  const registrationPayload =
    assertPrivateRootListenerCurrentnessGateRegistrationPayload(
      listenerRegistrationRecord
    );

  assertPrivateRootListenerCurrentnessSourceRecord(
    diagnosticOptions.sourceRecord,
    diagnosticOptions.sourceKind
  );

  const beforeState =
    createRootListenerCurrentnessGateState(registrationPayload);
  assertRootListenerCurrentnessGateStateCurrent(beforeState);

  if (diagnosticOptions.afterDiagnosticsHook !== null) {
    diagnosticOptions.afterDiagnosticsHook();
  }

  const afterState =
    createRootListenerCurrentnessGateState(registrationPayload);

  if (!rootListenerCurrentnessGateStateMatches(beforeState, afterState)) {
    throwRootListenerCurrentnessGateError(
      'Private root listener currentness diagnostics observed listener state mutation while collecting evidence.',
      'listener-state-mutated-during-diagnostics'
    );
  }
  assertRootListenerCurrentnessGateStateCurrent(afterState);

  const listenerRows = afterState.listenerRows;
  const targetRows = afterState.targetRows;
  const ownerDocumentSelectionChangeRows = listenerRows.filter(
    (row) =>
      row.targetRole === 'owner-document' &&
      row.domEventName === 'selectionchange'
  );
  const ownerDocumentDedupeRows = targetRows.filter(
    (row) => row.sameDocumentDedupeEvidence
  );
  const sameContainerDedupeRows = targetRows.filter(
    (row) => row.sameContainerDedupeEvidence
  );
  const record = freezeRecord({
    $$typeof: privateRootListenerCurrentnessGateRecordType,
    kind: 'FastReactDomPrivateRootListenerCurrentnessGateRecord',
    action: 'validate-private-root-listener-currentness',
    status: PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_STATUS,
    registrationRecordKind: listenerRegistrationRecord.kind,
    registrationRecordType: listenerRegistrationRecord.$$typeof,
    registrationStatus: listenerRegistrationRecord.registrationStatus,
    sourceKind: diagnosticOptions.sourceKind,
    sourceOwned: true,
    sourceOwnership: 'weakmap-root-listener-registration',
    sourceRecordProvided: diagnosticOptions.sourceRecord !== null,
    sourceRequestType: getMaybeStringProperty(
      diagnosticOptions.sourceRecord,
      'requestType'
    ),
    sourceFacadeCall: getMaybeStringProperty(
      diagnosticOptions.sourceRecord,
      'facadeCall'
    ),
    sourceOperation: getMaybeStringProperty(
      diagnosticOptions.sourceRecord,
      'operation'
    ),
    currentRegistration: true,
    registrationActive: true,
    registrationCount: listenerRegistrationRecord.registrationCount,
    rootRegistrationCount: listenerRegistrationRecord.rootRegistrationCount,
    ownerDocumentRegistrationCount:
      listenerRegistrationRecord.ownerDocumentRegistrationCount,
    listenerRowCount: listenerRows.length,
    currentListenerRowCount: listenerRows.filter((row) => row.current).length,
    rootListenerRowCount: listenerRows.filter(
      (row) => row.targetRole === 'root-container'
    ).length,
    ownerDocumentListenerRowCount: listenerRows.filter(
      (row) => row.targetRole === 'owner-document'
    ).length,
    ownerDocumentSelectionChangeCurrent:
      ownerDocumentSelectionChangeRows.length > 0 ||
      ownerDocumentDedupeRows.length > 0,
    ownerDocumentSelectionChangeRowCount:
      ownerDocumentSelectionChangeRows.length,
    targetRowCount: targetRows.length,
    sameContainerDedupeCurrent:
      sameContainerDedupeRows.length > 0 &&
      sameContainerDedupeRows.every((row) => row.current),
    sameContainerDedupeRowCount: sameContainerDedupeRows.length,
    sameDocumentDedupeCurrent:
      ownerDocumentDedupeRows.length > 0 &&
      ownerDocumentDedupeRows.every((row) => row.current),
    sameDocumentDedupeRowCount: ownerDocumentDedupeRows.length,
    listenerStateStable: true,
    listenerCountMutationObserved: false,
    gateInstalledBrowserListener: false,
    listenerInstallation: false,
    publicListenerInstallation: false,
    eventDispatch: false,
    syntheticEventDispatch: false,
    syntheticEventCount: 0,
    willDispatchPublicEvent: false,
    publicDispatchEnabled: false,
    publicRootBehaviorChanged: false,
    browserDomEventCompatibilityClaimed: false,
    compatibilityClaimed: false,
    targetRows,
    listenerRows
  });

  privateRootListenerCurrentnessGatePayloads.set(
    record,
    freezeRecord({
      afterState,
      beforeState,
      listenerRegistrationRecord,
      options: freezeRecord({
        sourceKind: diagnosticOptions.sourceKind,
        sourceRecord: diagnosticOptions.sourceRecord
      }),
      sourceRecord: diagnosticOptions.sourceRecord
    })
  );

  return record;
}

function getPrivateRootListenerCurrentnessGatePayload(record) {
  if (
    record === null ||
    (typeof record !== 'object' && typeof record !== 'function')
  ) {
    return null;
  }

  return privateRootListenerCurrentnessGatePayloads.get(record) || null;
}

function isPrivateRootListenerCurrentnessGateRecord(record) {
  return getPrivateRootListenerCurrentnessGatePayload(record) !== null;
}

function getAddEventListenerOptions(
  domEventName,
  isCapturePhaseListener,
  options
) {
  const passiveBrowserEventsSupported =
    !options || options.passiveBrowserEventsSupported !== false;

  if (passiveBrowserEventsSupported && isPassiveBrowserEvent(domEventName)) {
    return isCapturePhaseListener
      ? {
          capture: true,
          passive: true
        }
      : {
          passive: true
        };
  }

  return isCapturePhaseListener;
}

function addTrappedEventListener(
  target,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener,
  options
) {
  assertEventTarget(target);
  const listener = createEventListenerShell(
    target,
    domEventName,
    eventSystemFlags
  );
  const listenerOptions = getAddEventListenerOptions(
    domEventName,
    isCapturePhaseListener,
    options
  );

  target.addEventListener(domEventName, listener, listenerOptions);
  return listener;
}

function addTrappedEventListenerRecord(
  target,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener,
  options
) {
  const listener = createEventListenerShell(
    target,
    domEventName,
    eventSystemFlags
  );
  const listenerOptions = getAddEventListenerOptions(
    domEventName,
    isCapturePhaseListener,
    options
  );

  target.addEventListener(domEventName, listener, listenerOptions);
  return {
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener,
    listener,
    listenerOptions,
    listenerOptionsInfo: describeListenerOptions(listenerOptions),
    listenerSetKey: getListenerSetKey(domEventName, isCapturePhaseListener),
    target
  };
}

function listenToNativeEvent(
  domEventName,
  isCapturePhaseListener,
  target,
  options
) {
  const listenerRecord = listenToNativeEventRecord(
    domEventName,
    isCapturePhaseListener,
    target,
    options
  );
  return listenerRecord === null ? null : listenerRecord.listener;
}

function listenToNativeEventRecord(
  domEventName,
  isCapturePhaseListener,
  target,
  options
) {
  if (!isKnownNativeEvent(domEventName)) {
    const error = new Error(
      `Unsupported native React DOM event "${domEventName}".`
    );
    error.code = 'FAST_REACT_DOM_UNKNOWN_NATIVE_EVENT';
    throw error;
  }

  if (isNonDelegatedEvent(domEventName) && !isCapturePhaseListener) {
    const error = new Error(
      `Cannot install non-delegated React DOM event "${domEventName}" in the bubble phase.`
    );
    error.code = 'FAST_REACT_DOM_NON_DELEGATED_BUBBLE_LISTENER';
    throw error;
  }

  const listenerSet = getEventListenerSet(target);
  const listenerSetKey = getListenerSetKey(
    domEventName,
    isCapturePhaseListener
  );
  if (listenerSet.has(listenerSetKey)) {
    return null;
  }

  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }

  const listenerRecord = addTrappedEventListenerRecord(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener,
    options
  );
  listenerSet.add(listenerSetKey);
  return listenerRecord;
}

function listenToNonDelegatedEvent(domEventName, target, options) {
  const listenerRecord = listenToNonDelegatedEventRecord(
    domEventName,
    target,
    options
  );
  return listenerRecord === null ? null : listenerRecord.listener;
}

function listenToNonDelegatedEventRecord(domEventName, target, options) {
  if (!isNonDelegatedEvent(domEventName)) {
    const error = new Error(
      `Expected "${domEventName}" to be a non-delegated React DOM event.`
    );
    error.code = 'FAST_REACT_DOM_EXPECTED_NON_DELEGATED_EVENT';
    throw error;
  }

  const listenerSet = getEventListenerSet(target);
  const listenerSetKey = getListenerSetKey(domEventName, false);
  if (listenerSet.has(listenerSetKey)) {
    return null;
  }

  const listenerRecord = addTrappedEventListenerRecord(
    target,
    domEventName,
    IS_NON_DELEGATED,
    false,
    options
  );
  listenerSet.add(listenerSetKey);
  return listenerRecord;
}

function listenToAllSupportedEvents(rootContainerElement, options) {
  assertEventTarget(rootContainerElement);
  registerSupportedRootListeners(rootContainerElement, options, false);
}

function registerRootListenersForPrivateRoot(rootContainerElement, options) {
  assertEventTarget(rootContainerElement);
  return registerSupportedRootListeners(rootContainerElement, options, true);
}

function registerSupportedRootListeners(
  rootContainerElement,
  options,
  reversible
) {
  const ownerDocument = getOwnerDocument(rootContainerElement);
  const targets = uniqueTargets([rootContainerElement, ownerDocument]);
  if (reversible) {
    for (const target of targets) {
      assertReversibleEventTarget(target);
    }
  }

  const targetSnapshots = targets.map(snapshotListenerTarget);
  const installedListeners = [];

  markTargetAsListening(rootContainerElement);

  try {
    for (const domEventName of allNativeEvents) {
      if (domEventName === 'selectionchange') {
        continue;
      }

      if (!isNonDelegatedEvent(domEventName)) {
        pushListenerRecord(
          installedListeners,
          listenToNativeEventRecord(
            domEventName,
            false,
            rootContainerElement,
            options
          )
        );
      }
      pushListenerRecord(
        installedListeners,
        listenToNativeEventRecord(
          domEventName,
          true,
          rootContainerElement,
          options
        )
      );
    }

    if (ownerDocument !== null) {
      assertEventTarget(ownerDocument);
      markTargetAsListening(ownerDocument);
      pushListenerRecord(
        installedListeners,
        listenToNativeEventRecord(
          'selectionchange',
          false,
          ownerDocument,
          options
        )
      );
    }
  } catch (error) {
    if (reversible) {
      cleanupInstalledRootListeners(installedListeners, targetSnapshots);
    }
    throw error;
  }

  if (!reversible) {
    return undefined;
  }

  for (const snapshot of targetSnapshots) {
    snapshot.afterInfo = describeListenerTargetSnapshot(snapshot.target);
  }

  const record = freezeRecord({
    $$typeof: privateRootListenerRegistrationRecordType,
    kind: 'FastReactDomPrivateRootListenerRegistrationRecord',
    action: 'register-root-listeners',
    registrationStatus: ROOT_LISTENERS_REGISTERED,
    rootEventTargetInfo: freezeRecord(describeContainer(rootContainerElement)),
    ownerDocumentInfo:
      ownerDocument === null
        ? null
        : freezeRecord(describeContainer(ownerDocument)),
    targetCount: targets.length,
    registrationCount: installedListeners.length,
    rootRegistrationCount: installedListeners.filter(
      (listenerRecord) => listenerRecord.target === rootContainerElement
    ).length,
    ownerDocumentRegistrationCount:
      ownerDocument === null
        ? 0
        : installedListeners.filter(
            (listenerRecord) => listenerRecord.target === ownerDocument
          ).length,
    targetSnapshotsBefore: freezeArray(
      targetSnapshots.map((snapshot) => snapshot.beforeInfo)
    ),
    targetSnapshotsAfter: freezeArray(
      targetSnapshots.map((snapshot) => snapshot.afterInfo)
    ),
    listenerRecords: freezeArray(
      installedListeners.map((listenerRecord) =>
        summarizeInstalledListenerRecord(listenerRecord)
      )
    ),
    reversible: true
  });

  rootListenerRegistrationPayloads.set(record, {
    active: true,
    installedListeners,
    ownerDocument,
    record,
    rootContainerElement,
    targetSnapshots
  });

  return record;
}

function listenToPortalContainerEvents(portalContainer, options) {
  listenToAllSupportedEvents(portalContainer, options);
}

function createPortalPrepareMountListenerIntentRecord(
  portalContainer,
  options
) {
  assertEventTarget(portalContainer);

  const ownerDocument = getOwnerDocument(portalContainer);
  const portalAlreadyListening = hasListeningMarker(portalContainer);
  const ownerDocumentAlreadyListening = hasListeningMarker(ownerDocument);
  const portalListenerIntents = portalAlreadyListening
    ? []
    : createAllSupportedListenerIntentRecords(
        portalContainer,
        'portal-container',
        options
      );
  const ownerDocumentNeedsSelectionChange =
    !portalAlreadyListening &&
    ownerDocument !== null &&
    ownerDocument !== portalContainer &&
    !ownerDocumentAlreadyListening;
  const ownerDocumentListenerIntents = ownerDocumentNeedsSelectionChange
    ? [
        createListenerIntentRecord(
          ownerDocument,
          'selectionchange',
          false,
          'owner-document',
          options
        )
      ]
    : [];

  if (ownerDocumentNeedsSelectionChange) {
    assertEventTarget(ownerDocument);
  }

  const listenerIntents = freezeArray([
    ...portalListenerIntents,
    ...ownerDocumentListenerIntents
  ]);
  const intentCounts = summarizeListenerIntentCounts(listenerIntents);
  const record = freezeRecord({
    $$typeof: privatePortalPrepareMountListenerIntentRecordType,
    kind: 'FastReactDomPrivatePortalPrepareMountListenerIntentRecord',
    action: 'prepare-portal-mount-listener-intent',
    intentStatus: PORTAL_PREPARE_MOUNT_LISTENER_INTENT_RECORDED,
    preparePortalMountIntent: true,
    listenToAllSupportedEventsIntent: !portalAlreadyListening,
    listenerInstallation: false,
    eventDispatch: false,
    compatibilityClaimed: false,
    portalAlreadyListening,
    ownerDocumentAlreadyListening,
    portalListenerIntentCount: portalListenerIntents.length,
    ownerDocumentListenerIntentCount: ownerDocumentListenerIntents.length,
    listenerIntentCount: listenerIntents.length,
    captureListenerIntentCount: intentCounts.captureListenerIntentCount,
    bubbleListenerIntentCount: intentCounts.bubbleListenerIntentCount,
    nonDelegatedListenerIntentCount:
      intentCounts.nonDelegatedListenerIntentCount,
    passiveListenerIntentCount: intentCounts.passiveListenerIntentCount,
    portalEventTargetInfo: freezeRecord(describeContainer(portalContainer)),
    ownerDocumentInfo:
      ownerDocument === null
        ? null
        : freezeRecord(describeContainer(ownerDocument)),
    targetSnapshotsBefore: freezeArray([
      describeListenerTargetIntentSnapshot(
        portalContainer,
        'portal-container'
      ),
      ...(ownerDocument === null
        ? []
        : [
            describeListenerTargetIntentSnapshot(
              ownerDocument,
              'owner-document'
            )
          ])
    ]),
    listenerIntents
  });

  portalPrepareMountListenerIntentPayloads.set(
    record,
    freezeRecord({
      listenerIntents,
      options,
      ownerDocument,
      ownerDocumentListenerIntents: freezeArray(ownerDocumentListenerIntents),
      portalContainer,
      portalListenerIntents: freezeArray(portalListenerIntents)
    })
  );

  return record;
}

function getPortalPrepareMountListenerIntentPayload(record) {
  if (
    record === null ||
    (typeof record !== 'object' && typeof record !== 'function')
  ) {
    return null;
  }

  return portalPrepareMountListenerIntentPayloads.get(record) || null;
}

function isPortalPrepareMountListenerIntentRecord(record) {
  return getPortalPrepareMountListenerIntentPayload(record) !== null;
}

function revertRootListenersForPrivateRoot(registrationRecord) {
  const payload = rootListenerRegistrationPayloads.get(registrationRecord);
  if (payload === undefined) {
    const error = new Error(
      'Expected a private React DOM root listener registration record.'
    );
    error.code = 'FAST_REACT_DOM_INVALID_ROOT_LISTENER_RECORD';
    throw error;
  }

  const existingCleanup = rootListenerCleanupRecords.get(registrationRecord);
  if (!payload.active && existingCleanup !== undefined) {
    return existingCleanup;
  }

  const cleanupSummary = cleanupInstalledRootListeners(
    payload.installedListeners,
    payload.targetSnapshots
  );
  payload.active = false;

  const cleanupRecord = freezeRecord({
    $$typeof: privateRootListenerCleanupRecordType,
    kind: 'FastReactDomPrivateRootListenerCleanupRecord',
    action: 'revert-root-listeners',
    registrationStatus: ROOT_LISTENERS_REVERTED,
    listenerRemovalCount: cleanupSummary.listenerRemovalCount,
    listenerSetKeyRemovalCount: cleanupSummary.listenerSetKeyRemovalCount,
    restoredTargetCount: cleanupSummary.restoredTargetCount,
    targetSnapshotsAfter: freezeArray(
      payload.targetSnapshots.map((snapshot) =>
        describeListenerTargetSnapshot(snapshot.target)
      )
    ),
    reversible: false
  });

  rootListenerCleanupRecords.set(registrationRecord, cleanupRecord);
  return cleanupRecord;
}

function describePortalContainerListenerGuard(portalContainer, options) {
  const ownerDocument = getOwnerDocument(portalContainer);
  return freezeRecord({
    action:
      options && typeof options.action === 'string'
        ? options.action
        : 'defer-listen-to-portal-container-events',
    canInstallPortalListeners: canInstallListener(portalContainer),
    hasPortalListeningMarker: hasListeningMarker(portalContainer),
    ownerDocumentCanInstallSelectionChange: canInstallListener(ownerDocument),
    ownerDocumentHasSelectionChangeMarker: hasListeningMarker(ownerDocument),
    ownerDocumentInfo:
      ownerDocument === null
        ? null
        : freezeRecord(describeContainer(ownerDocument)),
    portalEventTargetInfo: freezeRecord(describeContainer(portalContainer))
  });
}

function describeRootListenerGuard(rootContainerElement, options) {
  const ownerDocument = getOwnerDocument(rootContainerElement);
  return freezeRecord({
    action:
      options && typeof options.action === 'string'
        ? options.action
        : 'defer-listen-to-all-supported-events',
    canInstallRootListeners: canInstallListener(rootContainerElement),
    hasRootListeningMarker: hasListeningMarker(rootContainerElement),
    ownerDocumentCanInstallSelectionChange: canInstallListener(ownerDocument),
    ownerDocumentHasSelectionChangeMarker: hasListeningMarker(ownerDocument),
    ownerDocumentInfo:
      ownerDocument === null
        ? null
        : freezeRecord(describeContainer(ownerDocument)),
    rootEventTargetInfo: freezeRecord(describeContainer(rootContainerElement))
  });
}

function getRootEventTargetOwnerDocument(rootContainerElement) {
  return rootContainerElement && rootContainerElement.nodeType === DOCUMENT_NODE
    ? rootContainerElement
    : getOwnerDocument(rootContainerElement);
}

function canInstallListener(target) {
  return !!(
    target != null &&
    (typeof target === 'object' || typeof target === 'function') &&
    typeof target.addEventListener === 'function'
  );
}

function assertReversibleEventTarget(target) {
  assertEventTarget(target);
  if (typeof target.removeEventListener !== 'function') {
    const error = new Error(
      'Cannot register reversible React DOM root listeners on a target without removeEventListener.'
    );
    error.code = 'FAST_REACT_DOM_LISTENER_REVERT_UNSUPPORTED';
    throw error;
  }
}

function uniqueTargets(targets) {
  const unique = [];
  for (const target of targets) {
    if (target === null || target === undefined) {
      continue;
    }
    if (!unique.includes(target)) {
      unique.push(target);
    }
  }
  return unique;
}

function snapshotListenerTarget(target) {
  return {
    target,
    hadEventHandlersKey: Object.prototype.hasOwnProperty.call(
      target,
      internalEventHandlersKey
    ),
    hadListeningMarker: Object.prototype.hasOwnProperty.call(
      target,
      internalListeningMarker
    ),
    listeningMarkerValue: target[internalListeningMarker],
    beforeInfo: describeListenerTargetSnapshot(target)
  };
}

function describeListenerTargetSnapshot(target) {
  const eventListenerSet = target && target[internalEventHandlersKey];
  return freezeRecord({
    browserRegistrationCount: getTargetRegistrationCount(target),
    browserRegistrationInspectable: isTargetRegistrationInspectable(target),
    canInstallListeners: canInstallListener(target),
    eventListenerSetSize:
      eventListenerSet instanceof Set ? eventListenerSet.size : 0,
    listeningMarker: inspectListeningMarker(target)
  });
}

function describeListenerTargetIntentSnapshot(target, targetRole) {
  return freezeRecord({
    ...describeListenerTargetSnapshot(target),
    targetInfo: freezeRecord(describeContainer(target)),
    targetRole
  });
}

function createAllSupportedListenerIntentRecords(target, targetRole, options) {
  const listenerIntents = [];
  for (const domEventName of allNativeEvents) {
    if (domEventName === 'selectionchange') {
      continue;
    }

    if (!isNonDelegatedEvent(domEventName)) {
      listenerIntents.push(
        createListenerIntentRecord(
          target,
          domEventName,
          false,
          targetRole,
          options
        )
      );
    }

    listenerIntents.push(
      createListenerIntentRecord(
        target,
        domEventName,
        true,
        targetRole,
        options
      )
    );
  }

  return freezeArray(listenerIntents);
}

function createListenerIntentRecord(
  target,
  domEventName,
  isCapturePhaseListener,
  targetRole,
  options
) {
  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }

  const listenerOptions = getAddEventListenerOptions(
    domEventName,
    isCapturePhaseListener,
    options
  );

  return freezeRecord({
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener,
    isNonDelegatedEvent: isNonDelegatedEvent(domEventName),
    listenerOptions: describeListenerOptions(listenerOptions),
    listenerSetKey: getListenerSetKey(domEventName, isCapturePhaseListener),
    targetInfo: freezeRecord(describeContainer(target)),
    targetRole
  });
}

function summarizeListenerIntentCounts(listenerIntents) {
  let captureListenerIntentCount = 0;
  let bubbleListenerIntentCount = 0;
  let nonDelegatedListenerIntentCount = 0;
  let passiveListenerIntentCount = 0;

  for (const intent of listenerIntents) {
    if (intent.isCapturePhaseListener) {
      captureListenerIntentCount++;
    } else {
      bubbleListenerIntentCount++;
    }
    if (intent.isNonDelegatedEvent) {
      nonDelegatedListenerIntentCount++;
    }
    if (intent.listenerOptions.passive === true) {
      passiveListenerIntentCount++;
    }
  }

  return {
    bubbleListenerIntentCount,
    captureListenerIntentCount,
    nonDelegatedListenerIntentCount,
    passiveListenerIntentCount
  };
}

function pushListenerRecord(installedListeners, listenerRecord) {
  if (listenerRecord !== null) {
    installedListeners.push(listenerRecord);
  }
}

function cleanupInstalledRootListeners(installedListeners, targetSnapshots) {
  let listenerRemovalCount = 0;
  let listenerSetKeyRemovalCount = 0;

  for (let index = installedListeners.length - 1; index >= 0; index--) {
    const listenerRecord = installedListeners[index];
    listenerRecord.target.removeEventListener(
      listenerRecord.domEventName,
      listenerRecord.listener,
      listenerRecord.listenerOptions
    );
    listenerRemovalCount++;

    const listenerSet = listenerRecord.target[internalEventHandlersKey];
    if (listenerSet instanceof Set) {
      listenerSet.delete(listenerRecord.listenerSetKey);
      listenerSetKeyRemovalCount++;
    }
  }

  for (const snapshot of targetSnapshots) {
    if (snapshot.hadListeningMarker) {
      snapshot.target[internalListeningMarker] = snapshot.listeningMarkerValue;
    } else {
      delete snapshot.target[internalListeningMarker];
    }

    const listenerSet = snapshot.target[internalEventHandlersKey];
    if (
      !snapshot.hadEventHandlersKey &&
      listenerSet instanceof Set &&
      listenerSet.size === 0
    ) {
      delete snapshot.target[internalEventHandlersKey];
    }
  }

  return {
    listenerRemovalCount,
    listenerSetKeyRemovalCount,
    restoredTargetCount: targetSnapshots.length
  };
}

function summarizeInstalledListenerRecord(listenerRecord) {
  return freezeRecord({
    domEventName: listenerRecord.domEventName,
    eventSystemFlags: listenerRecord.eventSystemFlags,
    isCapturePhaseListener: listenerRecord.isCapturePhaseListener,
    listenerOptions: listenerRecord.listenerOptionsInfo,
    listenerSetKey: listenerRecord.listenerSetKey,
    targetInfo: freezeRecord(describeContainer(listenerRecord.target))
  });
}

function describeListenerOptions(options) {
  if (typeof options === 'boolean') {
    return freezeRecord({
      capture: options,
      passive: false,
      type: 'boolean'
    });
  }

  if (options && typeof options === 'object') {
    return freezeRecord({
      capture: options.capture === true,
      passive: options.passive === true,
      type: 'object'
    });
  }

  return freezeRecord({
    capture: false,
    passive: false,
    type: typeof options
  });
}

function createRootListenerCurrentnessGateState(registrationPayload) {
  const targetRows = freezeArray(
    registrationPayload.targetSnapshots.map((snapshot) =>
      createRootListenerCurrentnessTargetRow(registrationPayload, snapshot)
    )
  );
  const listenerRows = freezeArray(
    registrationPayload.installedListeners.map((listenerRecord, index) =>
      createRootListenerCurrentnessListenerRow(
        registrationPayload,
        listenerRecord,
        index
      )
    )
  );

  return freezeRecord({
    listenerRows,
    targetRows
  });
}

function createRootListenerCurrentnessTargetRow(
  registrationPayload,
  snapshot
) {
  const target = snapshot.target;
  const targetRole = getRootListenerCurrentnessTargetRole(
    registrationPayload,
    target
  );
  const afterInfo = snapshot.afterInfo || describeListenerTargetSnapshot(target);
  const currentInfo = describeListenerTargetSnapshot(target);
  const installedListenerCount =
    registrationPayload.installedListeners.filter(
      (listenerRecord) => listenerRecord.target === target
    ).length;
  const dedupeEvidence = installedListenerCount === 0;
  const browserRegistrationCountCurrent =
    !afterInfo.browserRegistrationInspectable ||
    afterInfo.browserRegistrationCount === currentInfo.browserRegistrationCount;
  const eventListenerSetSizeCurrent =
    afterInfo.eventListenerSetSize === currentInfo.eventListenerSetSize;
  const listeningMarkerCurrent =
    afterInfo.listeningMarker.trueValueCount ===
      currentInfo.listeningMarker.trueValueCount &&
    afterInfo.listeningMarker.propertyCount ===
      currentInfo.listeningMarker.propertyCount;

  return freezeRecord({
    targetRole,
    targetInfo: freezeRecord(describeContainer(target)),
    current:
      registrationPayload.active &&
      browserRegistrationCountCurrent &&
      eventListenerSetSizeCurrent &&
      listeningMarkerCurrent,
    installedListenerCount,
    expectedBrowserRegistrationCount: afterInfo.browserRegistrationCount,
    currentBrowserRegistrationCount: currentInfo.browserRegistrationCount,
    browserRegistrationInspectable:
      afterInfo.browserRegistrationInspectable,
    expectedListenerSetSize: afterInfo.eventListenerSetSize,
    currentListenerSetSize: currentInfo.eventListenerSetSize,
    expectedListeningMarkerTrueValueCount:
      afterInfo.listeningMarker.trueValueCount,
    currentListeningMarkerTrueValueCount:
      currentInfo.listeningMarker.trueValueCount,
    expectedListeningMarkerPropertyCount:
      afterInfo.listeningMarker.propertyCount,
    currentListeningMarkerPropertyCount:
      currentInfo.listeningMarker.propertyCount,
    dedupeEvidence,
    sameContainerDedupeEvidence:
      dedupeEvidence && targetRole === 'root-container',
    sameDocumentDedupeEvidence:
      dedupeEvidence && targetRole === 'owner-document',
    ownerDocumentSelectionChangeDedupeEvidence:
      dedupeEvidence && targetRole === 'owner-document',
    browserDomEventCompatibilityClaimed: false,
    compatibilityClaimed: false,
    eventDispatch: false,
    gateInstalledBrowserListener: false,
    listenerInstallation: false,
    publicRootBehaviorChanged: false
  });
}

function createRootListenerCurrentnessListenerRow(
  registrationPayload,
  listenerRecord,
  index
) {
  const targetRole = getRootListenerCurrentnessTargetRole(
    registrationPayload,
    listenerRecord.target
  );
  const listenerSetHasKey = targetHasEventListenerSetKey(
    listenerRecord.target,
    listenerRecord.listenerSetKey
  );
  const targetRegistration = getTargetListenerRegistrationStatus(
    listenerRecord
  );
  const listenerShellOwned =
    listenerRecord.listener.__FAST_REACT_DOM_EVENT_SHELL__ === true &&
    listenerRecord.listener.__FAST_REACT_DOM_EVENT_TARGET__ ===
      listenerRecord.target &&
    listenerRecord.listener.__FAST_REACT_DOM_EVENT_NAME__ ===
      listenerRecord.domEventName &&
    listenerRecord.listener.__FAST_REACT_DOM_EVENT_FLAGS__ ===
      listenerRecord.eventSystemFlags;

  return freezeRecord({
    rowIndex: index,
    targetRole,
    domEventName: listenerRecord.domEventName,
    phase: listenerRecord.isCapturePhaseListener ? 'capture' : 'bubble',
    eventSystemFlags: listenerRecord.eventSystemFlags,
    listenerSetKey: listenerRecord.listenerSetKey,
    listenerOptions: listenerRecord.listenerOptionsInfo,
    current:
      registrationPayload.active &&
      listenerSetHasKey &&
      targetRegistration.current &&
      listenerShellOwned,
    listenerSetHasKey,
    browserRegistrationInspectable: targetRegistration.inspectable,
    browserRegistrationPresent: targetRegistration.present,
    listenerShellOwned,
    sourceOwned: true,
    sourceOwnership: 'weakmap-root-listener-registration',
    browserDomEventCompatibilityClaimed: false,
    compatibilityClaimed: false,
    eventDispatch: false,
    gateInstalledBrowserListener: false,
    listenerInstallation: false,
    publicListenerInstallation: false,
    publicRootBehaviorChanged: false,
    willDispatchPublicEvent: false
  });
}

function assertRootListenerCurrentnessGateStateCurrent(state) {
  for (const targetRow of state.targetRows) {
    if (!targetRow.current) {
      throwRootListenerCurrentnessGateError(
        'Private root listener currentness diagnostics found listener target state that no longer matches the registration record.',
        'listener-count-mutated-after-registration'
      );
    }
  }

  for (const listenerRow of state.listenerRows) {
    if (!listenerRow.current) {
      throwRootListenerCurrentnessGateError(
        'Private root listener currentness diagnostics found a stale root listener registration.',
        'listener-registration-not-current'
      );
    }
  }
}

function rootListenerCurrentnessGateStateMatches(left, right) {
  if (
    left.targetRows.length !== right.targetRows.length ||
    left.listenerRows.length !== right.listenerRows.length
  ) {
    return false;
  }

  for (let index = 0; index < left.targetRows.length; index++) {
    const leftRow = left.targetRows[index];
    const rightRow = right.targetRows[index];
    if (
      leftRow.currentBrowserRegistrationCount !==
        rightRow.currentBrowserRegistrationCount ||
      leftRow.currentListenerSetSize !== rightRow.currentListenerSetSize ||
      leftRow.currentListeningMarkerTrueValueCount !==
        rightRow.currentListeningMarkerTrueValueCount ||
      leftRow.currentListeningMarkerPropertyCount !==
        rightRow.currentListeningMarkerPropertyCount
    ) {
      return false;
    }
  }

  for (let index = 0; index < left.listenerRows.length; index++) {
    const leftRow = left.listenerRows[index];
    const rightRow = right.listenerRows[index];
    if (
      leftRow.current !== rightRow.current ||
      leftRow.listenerSetHasKey !== rightRow.listenerSetHasKey ||
      leftRow.browserRegistrationPresent !==
        rightRow.browserRegistrationPresent ||
      leftRow.listenerShellOwned !== rightRow.listenerShellOwned
    ) {
      return false;
    }
  }

  return true;
}

function getRootListenerCurrentnessTargetRole(registrationPayload, target) {
  if (target === registrationPayload.rootContainerElement) {
    return 'root-container';
  }
  if (target === registrationPayload.ownerDocument) {
    return 'owner-document';
  }
  return 'unknown-target';
}

function targetHasEventListenerSetKey(target, listenerSetKey) {
  const listenerSet =
    target != null &&
    (typeof target === 'object' || typeof target === 'function')
      ? target[internalEventHandlersKey]
      : null;
  return listenerSet instanceof Set && listenerSet.has(listenerSetKey);
}

function getTargetListenerRegistrationStatus(listenerRecord) {
  const target = listenerRecord.target;
  if (!isTargetRegistrationInspectable(target)) {
    return {
      current: true,
      inspectable: false,
      present: false
    };
  }

  const present = target.__registrations.some(
    (registration) =>
      registration.type === listenerRecord.domEventName &&
      registration.listener === listenerRecord.listener &&
      registration.options === listenerRecord.listenerOptions
  );

  return {
    current: present,
    inspectable: true,
    present
  };
}

function isTargetRegistrationInspectable(target) {
  return !!(target && Array.isArray(target.__registrations));
}

function getTargetRegistrationCount(target) {
  return isTargetRegistrationInspectable(target)
    ? target.__registrations.length
    : 0;
}

function getMaybeStringProperty(value, propertyName) {
  return isObjectLike(value) && typeof value[propertyName] === 'string'
    ? value[propertyName]
    : null;
}

function assertActiveRootListenerRegistrationPayload(
  registrationRecord,
  throwRegistrationError,
  invalidRegistrationMessage,
  staleRegistrationMessage
) {
  const throwError =
    typeof throwRegistrationError === 'function'
      ? throwRegistrationError
      : throwRootHostOutputClickDispatchError;
  const invalidMessage =
    typeof invalidRegistrationMessage === 'string'
      ? invalidRegistrationMessage
      : 'Expected a private React DOM root listener registration record.';
  const staleMessage =
    typeof staleRegistrationMessage === 'string'
      ? staleRegistrationMessage
      : 'Cannot dispatch a private root host-output click after root listeners were reverted.';
  const payload = rootListenerRegistrationPayloads.get(registrationRecord);
  if (payload === undefined) {
    throwError(invalidMessage, 'invalid-registration-record');
  }
  if (!payload.active) {
    throwError(staleMessage, 'stale-registration-record');
  }
  return payload;
}

function assertPrivateRootListenerCurrentnessGateRegistrationPayload(
  registrationRecord
) {
  const payload = rootListenerRegistrationPayloads.get(registrationRecord);
  if (payload === undefined) {
    throwRootListenerCurrentnessGateError(
      'Expected a source-owned private React DOM root listener registration record.',
      'invalid-registration-record'
    );
  }
  if (!payload.active) {
    throwRootListenerCurrentnessGateError(
      'Cannot validate private React DOM root listener currentness after the registration was reverted.',
      'stale-registration-record'
    );
  }
  return payload;
}

function normalizePrivateRootListenerCurrentnessGateOptions(options) {
  const normalizedOptions = isObjectLike(options) ? options : {};
  assertNoPrivateRootListenerCurrentnessPublicBehaviorClaims(
    normalizedOptions
  );

  const sourceKind = normalizePrivateRootListenerCurrentnessSourceKind(
    normalizedOptions.sourceKind ||
      normalizedOptions.facadeCall ||
      normalizedOptions.operation ||
      'createRoot'
  );

  return freezeRecord({
    afterDiagnosticsHook:
      typeof normalizedOptions.afterDiagnosticsHook === 'function'
        ? normalizedOptions.afterDiagnosticsHook
        : null,
    sourceKind,
    sourceRecord: isObjectLike(normalizedOptions.sourceRecord)
      ? normalizedOptions.sourceRecord
      : null
  });
}

function normalizePrivateRootListenerCurrentnessSourceKind(sourceKind) {
  if (
    sourceKind === 'createRoot' ||
    sourceKind === 'hydrateRoot' ||
    sourceKind === 'portal'
  ) {
    return sourceKind;
  }

  throwRootListenerCurrentnessGateError(
    'Private root listener currentness diagnostics require a createRoot, hydrateRoot, or portal source kind.',
    'unsupported-source-kind'
  );
}

function assertNoPrivateRootListenerCurrentnessPublicBehaviorClaims(options) {
  const blockedClaimFields = [
    'browserDomEventCompatibilityClaimed',
    'compatibilityClaimed',
    'eventDispatch',
    'listenerInstallation',
    'publicDispatchEnabled',
    'publicListenerInstallation',
    'publicRootBehaviorChanged',
    'rootListenerInstallation',
    'syntheticEventDispatch',
    'willDispatchPublicEvent'
  ];

  for (const field of blockedClaimFields) {
    if (options[field] === true) {
      throwRootListenerCurrentnessGateError(
        'Private root listener currentness diagnostics cannot claim public DOM event behavior.',
        'public-behavior-claimed'
      );
    }
  }
}

function assertNoPrivateRootDispatchGatePublicBehaviorClaims(
  options,
  throwError
) {
  const blockedClaimFields = [
    'browserDomEventCompatibilityClaimed',
    'browserListenerInstallation',
    'compatibilityClaimed',
    'eventDispatch',
    'gateInstalledBrowserListener',
    'listenerInstallation',
    'publicDispatchEnabled',
    'publicListenerInstallation',
    'publicPortalBubblingEnabled',
    'publicRootBehaviorChanged',
    'rootListenerInstallation',
    'syntheticEventDispatch',
    'syntheticFocusEventCreation',
    'willCreateSyntheticFocusEvent',
    'willDispatchPublicEvent',
    'willInvokePublicListeners'
  ];

  for (const field of blockedClaimFields) {
    if (options[field] === true) {
      throwError(
        'Private root event dispatch gates cannot claim public DOM event behavior.',
        'public-behavior-claimed'
      );
    }
  }

  if (
    typeof options.syntheticEventCount === 'number' &&
    options.syntheticEventCount > 0
  ) {
    throwError(
      'Private root event dispatch gates cannot claim public DOM event behavior.',
      'public-behavior-claimed'
    );
  }
}

function assertPrivateRootListenerCurrentnessSourceRecord(
  sourceRecord,
  sourceKind
) {
  if (sourceRecord === null) {
    return;
  }

  const requestType = getMaybeStringProperty(sourceRecord, 'requestType');
  const facadeCall = getMaybeStringProperty(sourceRecord, 'facadeCall');
  const operation = getMaybeStringProperty(sourceRecord, 'operation');

  if (
    sourceKind === 'createRoot' &&
    (requestType === 'hydrateRoot' ||
      facadeCall === 'hydrateRoot' ||
      operation === 'hydrateRoot' ||
      operation === 'hydrate-root-marker-listener-preflight')
  ) {
    throwRootListenerCurrentnessGateError(
      'Private root listener currentness diagnostics cannot consume hydrateRoot evidence through a createRoot source alias.',
      'source-kind-alias-mismatch'
    );
  }

  if (
    sourceKind === 'hydrateRoot' &&
    (requestType === 'createRoot' ||
      facadeCall === 'createRoot' ||
      operation === 'createRoot' ||
      operation === 'public-facade-marker-listener-preflight')
  ) {
    throwRootListenerCurrentnessGateError(
      'Private root listener currentness diagnostics cannot consume createRoot evidence through a hydrateRoot source alias.',
      'source-kind-alias-mismatch'
    );
  }
}

function assertPrivateRootDispatchListenerCurrentnessGate(
  listenerRegistrationRecord,
  registrationPayload,
  currentnessGateRecord,
  throwError,
  missingMessage
) {
  if (currentnessGateRecord === null) {
    throwError(missingMessage, 'missing-root-listener-currentness-gate');
  }

  const currentnessGatePayload =
    getPrivateRootListenerCurrentnessGatePayload(currentnessGateRecord);
  if (currentnessGatePayload === null) {
    throwError(
      'Private root event dispatch requires a source-owned root listener currentness gate record.',
      'invalid-root-listener-currentness-gate'
    );
  }

  if (
    currentnessGatePayload.listenerRegistrationRecord !==
    listenerRegistrationRecord
  ) {
    throwError(
      'Private root event dispatch currentness evidence does not belong to the active listener registration.',
      'root-listener-currentness-registration-mismatch'
    );
  }

  const currentState =
    createRootListenerCurrentnessGateState(registrationPayload);
  if (
    !rootListenerCurrentnessGateStateMatches(
      currentnessGatePayload.afterState,
      currentState
    )
  ) {
    throwError(
      'Private root event dispatch rejected stale root listener currentness evidence.',
      'root-listener-currentness-changed-after-capture'
    );
  }
  assertPrivateRootDispatchListenerCurrentnessStateCurrent(
    currentState,
    throwError
  );

  return freezeRecord({
    currentState,
    gatePayload: currentnessGatePayload,
    gateRecord: currentnessGateRecord
  });
}

function assertPrivateRootDispatchListenerCurrentnessStateCurrent(
  state,
  throwError
) {
  for (const targetRow of state.targetRows) {
    if (!targetRow.current) {
      throwError(
        'Private root event dispatch currentness evidence no longer matches listener target state.',
        'root-listener-currentness-not-current'
      );
    }
  }

  for (const listenerRow of state.listenerRows) {
    if (!listenerRow.current) {
      throwError(
        'Private root event dispatch currentness evidence no longer matches an installed listener registration.',
        'root-listener-currentness-not-current'
      );
    }
  }
}

function normalizePrivateRootHostOutputClickDispatchCanaryOptions(options) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};

  return freezeRecord({
    enableDefaultPreventedDiagnostics:
      normalizedOptions.enableDefaultPreventedDiagnostics === true,
    enableListenerErrorRoutingDiagnostics:
      normalizedOptions.enableListenerErrorRoutingDiagnostics === true,
    enableNativeStopImmediatePropagationDiagnostics:
      normalizedOptions.enableNativeStopImmediatePropagationDiagnostics === true,
    enablePropagationStopDiagnostics:
      normalizedOptions.enablePropagationStopDiagnostics === true
  });
}

function normalizePrivateRootClickEventDelegationDispatchGateOptions(options) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  assertNoPrivateRootDispatchGatePublicBehaviorClaims(
    normalizedOptions,
    throwRootClickEventDelegationDispatchGateError
  );
  const phase =
    normalizedOptions.phase === undefined ? 'bubble' : normalizedOptions.phase;
  if (phase !== 'bubble' && phase !== 'capture') {
    throwRootClickEventDelegationDispatchGateError(
      'Private root click event delegation dispatch only supports bubble and capture phases.',
      'unsupported-event-phase'
    );
  }

  return freezeRecord({
    phase,
    portalEventOwnerRootGateRecord:
      normalizedOptions.portalEventOwnerRootGateRecord ||
      normalizedOptions.portalOwnerRootGateRecord ||
      null,
    rootListenerCurrentnessGateRecord:
      normalizedOptions.rootListenerCurrentnessGateRecord ||
      normalizedOptions.listenerCurrentnessGateRecord ||
      normalizedOptions.currentnessGateRecord ||
      null,
    useProcessingOrder: normalizedOptions.useProcessingOrder !== false
  });
}

function normalizePrivateRootFocusBlurEventDispatchExecutionOptions(
  acceptedListenerQueueEntryRecord,
  options
) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};
  assertNoPrivateRootDispatchGatePublicBehaviorClaims(
    normalizedOptions,
    throwRootFocusBlurEventDispatchExecutionError
  );
  const queuePayload = getPrivateEventListenerQueueEntryPayload(
    acceptedListenerQueueEntryRecord
  );
  const domEventName =
    normalizedOptions.domEventName === undefined
      ? queuePayload === null
        ? null
        : queuePayload.domEventName
      : normalizedOptions.domEventName;
  const phase =
    normalizedOptions.phase === undefined ? 'bubble' : normalizedOptions.phase;
  if (domEventName !== 'focusin' && domEventName !== 'focusout') {
    throwRootFocusBlurEventDispatchExecutionError(
      'Private root focus/blur event dispatch execution only supports focusin and focusout.',
      'unsupported-event-type'
    );
  }
  if (phase !== 'bubble' && phase !== 'capture') {
    throwRootFocusBlurEventDispatchExecutionError(
      'Private root focus/blur event dispatch execution only supports bubble and capture phases.',
      'unsupported-event-phase'
    );
  }

  return freezeRecord({
    domEventName,
    phase,
    portalEventOwnerRootGateRecord:
      normalizedOptions.portalEventOwnerRootGateRecord ||
      normalizedOptions.portalOwnerRootGateRecord ||
      null,
    rootListenerCurrentnessGateRecord:
      normalizedOptions.rootListenerCurrentnessGateRecord ||
      normalizedOptions.listenerCurrentnessGateRecord ||
      normalizedOptions.currentnessGateRecord ||
      null,
    useProcessingOrder: normalizedOptions.useProcessingOrder !== false
  });
}

function assertAcceptedPrivateClickListenerQueueEntry(record, phase) {
  const payload = getPrivateEventListenerQueueEntryPayload(record);
  if (payload === null || payload.active !== true) {
    throwRootClickEventDelegationDispatchGateError(
      'Private root click event delegation dispatch rejected a stale listener registry record.',
      'stale-listener-record'
    );
  }
  if (payload.domEventName !== 'click') {
    throwRootClickEventDelegationDispatchGateError(
      'Private root click event delegation dispatch only accepts click listener registry records.',
      'unsupported-event-type'
    );
  }
  if (payload.capture !== (phase === 'capture')) {
    throwRootClickEventDelegationDispatchGateError(
      'Private root click event delegation dispatch listener registry phase does not match the requested phase.',
      'unsupported-event-phase'
    );
  }

  return payload;
}

function assertAcceptedPrivateFocusBlurListenerQueueEntry(
  record,
  phase,
  domEventName
) {
  const payload = getPrivateEventListenerQueueEntryPayload(record);
  if (payload === null || payload.active !== true) {
    throwRootFocusBlurEventDispatchExecutionError(
      'Private root focus/blur event dispatch execution rejected a stale listener registry record.',
      'stale-listener-record'
    );
  }
  if (payload.domEventName !== 'focusin' && payload.domEventName !== 'focusout') {
    throwRootFocusBlurEventDispatchExecutionError(
      'Private root focus/blur event dispatch execution only accepts focusin/focusout listener registry records.',
      'unsupported-event-type'
    );
  }
  if (payload.domEventName !== domEventName) {
    throwRootFocusBlurEventDispatchExecutionError(
      'Private root focus/blur event dispatch execution listener registry event does not match the requested event.',
      'unsupported-event-type'
    );
  }
  if (payload.capture !== (phase === 'capture')) {
    throwRootFocusBlurEventDispatchExecutionError(
      'Private root focus/blur event dispatch execution listener registry phase does not match the requested phase.',
      'unsupported-event-phase'
    );
  }

  return payload;
}

function getInstalledRootListenerPair(
  registrationPayload,
  domEventName,
  throwError,
  missingMessage
) {
  const capture = registrationPayload.installedListeners.find(
    (listenerRecord) =>
      listenerRecord.domEventName === domEventName &&
      listenerRecord.isCapturePhaseListener === true
  );
  const bubble = registrationPayload.installedListeners.find(
    (listenerRecord) =>
      listenerRecord.domEventName === domEventName &&
      listenerRecord.isCapturePhaseListener === false
  );

  if (capture === undefined || bubble === undefined) {
    const normalizedThrowError =
      typeof throwError === 'function'
        ? throwError
        : throwRootHostOutputClickDispatchError;
    normalizedThrowError(
      typeof missingMessage === 'string'
        ? missingMessage
        : 'Private root host-output click dispatch requires capture and bubble root listener shells.',
      'missing-root-listener-shell'
    );
  }

  return {
    bubble,
    capture
  };
}

function findPrivateClickEventDelegationDispatchListenerRecord(
  dispatchRecord,
  acceptedListenerQueueEntryRecord,
  useProcessingOrder
) {
  return findPrivateAcceptedDispatchListenerRecord(
    dispatchRecord,
    acceptedListenerQueueEntryRecord,
    useProcessingOrder,
    throwRootClickEventDelegationDispatchGateError,
    'Private root click event delegation dispatch did not find the accepted listener record in the plugin extraction queue.'
  );
}

function findPrivateFocusBlurEventDispatchExecutionListenerRecord(
  dispatchRecord,
  acceptedListenerQueueEntryRecord,
  useProcessingOrder
) {
  return findPrivateAcceptedDispatchListenerRecord(
    dispatchRecord,
    acceptedListenerQueueEntryRecord,
    useProcessingOrder,
    throwRootFocusBlurEventDispatchExecutionError,
    'Private root focus/blur event dispatch execution did not find the accepted listener record in the plugin extraction queue.'
  );
}

function findPrivateAcceptedDispatchListenerRecord(
  dispatchRecord,
  acceptedListenerQueueEntryRecord,
  useProcessingOrder,
  throwError,
  missingMessage
) {
  for (const dispatchQueueEntry of dispatchRecord.dispatchQueue.entries) {
    const entryPayload =
      getDispatchQueueEntryRecordPayload(dispatchQueueEntry);
    const listenerRecords =
      useProcessingOrder && entryPayload !== null
        ? entryPayload.processingListenerRecords
        : entryPayload === null
          ? []
          : entryPayload.listenerRecords;
    const listenerRecord = listenerRecords.find((candidateRecord) => {
      const listenerPayload =
        getDispatchListenerRecordPayload(candidateRecord);
      return (
        listenerPayload !== null &&
        listenerPayload.privateEventListenerQueueEntryRecord ===
          acceptedListenerQueueEntryRecord
      );
    });
    if (listenerRecord !== undefined) {
      return listenerRecord;
    }
  }

  throwError(
    missingMessage,
    'accepted-listener-not-on-dispatch-path'
  );
}

function dispatchInstalledRootListener(
  listenerRecord,
  nativeEvent,
  throwError,
  missingMessage
) {
  listenerRecord.listener(nativeEvent);
  const dispatchRecord = getLastRootListenerDispatchRecord(
    listenerRecord.listener
  );
  if (dispatchRecord === null) {
    const normalizedThrowError =
      typeof throwError === 'function'
        ? throwError
        : throwRootHostOutputClickDispatchError;
    normalizedThrowError(
      typeof missingMessage === 'string'
        ? missingMessage
        : 'Private root host-output click dispatch did not produce a dispatch record.',
      'missing-dispatch-record'
    );
  }
  return dispatchRecord;
}

function createPrivateFakeClickEvent(target) {
  return {
    defaultPrevented: false,
    immediatePropagationStopped: false,
    preventDefaultCallCount: 0,
    returnValue: true,
    stopImmediatePropagationCallCount: 0,
    stopPropagationCallCount: 0,
    target,
    type: 'click',
    preventDefault() {
      this.defaultPrevented = true;
      this.preventDefaultCallCount++;
      this.returnValue = false;
    },
    stopPropagation() {
      this.stopPropagationCallCount++;
    },
    stopImmediatePropagation() {
      this.immediatePropagationStopped = true;
      this.stopImmediatePropagationCallCount++;
    }
  };
}

function createPrivateFakeFocusBlurEvent(target, domEventName) {
  return {
    defaultPrevented: false,
    immediatePropagationStopped: false,
    preventDefaultCallCount: 0,
    relatedTarget: null,
    returnValue: true,
    stopImmediatePropagationCallCount: 0,
    stopPropagationCallCount: 0,
    target,
    type: domEventName,
    preventDefault() {
      this.defaultPrevented = true;
      this.preventDefaultCallCount++;
      this.returnValue = false;
    },
    stopPropagation() {
      this.stopPropagationCallCount++;
    },
    stopImmediatePropagation() {
      this.immediatePropagationStopped = true;
      this.stopImmediatePropagationCallCount++;
    }
  };
}

function throwRootHostOutputClickDispatchError(message) {
  const error = new Error(message);
  error.code = INVALID_PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CODE;
  throw error;
}

function throwRootClickEventDelegationDispatchGateError(message, reason) {
  const error = new Error(message);
  error.code = INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE;
  error.reason = reason;
  throw error;
}

function throwRootFocusBlurEventDispatchExecutionError(message, reason) {
  const error = new Error(message);
  error.code =
    INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE;
  error.reason = reason;
  throw error;
}

function throwRootListenerCurrentnessGateError(message, reason) {
  const error = new Error(message);
  error.code = INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE;
  error.reason = reason;
  throw error;
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeArray(array) {
  return Object.freeze(array.slice());
}

module.exports = {
  IS_CAPTURE_PHASE,
  IS_NON_DELEGATED,
  INVALID_PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CODE,
  INVALID_PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_CODE,
  INVALID_PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_CODE,
  INVALID_PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_CODE,
  PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND,
  PRIVATE_ROOT_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS,
  PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_RECORD_KIND,
  PRIVATE_ROOT_FOCUS_BLUR_EVENT_DISPATCH_EXECUTION_STATUS,
  PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_RECORD_KIND,
  PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_STATUS,
  PRIVATE_ROOT_LISTENER_CURRENTNESS_GATE_STATUS,
  PORTAL_PREPARE_MOUNT_LISTENER_INTENT_RECORDED,
  PRIVATE_ROOT_HOST_OUTPUT_SYNTHETIC_EVENT_SHAPE_GATE_RECORD_KIND,
  PRIVATE_ROOT_HOST_OUTPUT_SYNTHETIC_EVENT_SHAPE_GATE_STATUS,
  ROOT_LISTENERS_REGISTERED,
  ROOT_LISTENERS_REVERTED,
  addTrappedEventListener,
  createPrivateRootListenerCurrentnessGateRecord,
  createPrivateRootHostOutputClickSyntheticEventShapeGate,
  createEventListenerShell,
  createPortalPrepareMountListenerIntentRecord,
  describePortalContainerListenerGuard,
  describeRootListenerGuard,
  getAddEventListenerOptions,
  getLastRootListenerInvocationCanaryRecord,
  getLastRootListenerDispatchRecord,
  getPortalPrepareMountListenerIntentPayload,
  getRootEventTargetOwnerDocument,
  getPrivateRootFocusBlurEventDispatchExecutionPayload,
  getPrivateRootClickEventDelegationDispatchGatePayload,
  getPrivateRootHostOutputClickDispatchCanaryPayload,
  getPrivateRootHostOutputSyntheticEventShapeGatePayload,
  getPrivateRootListenerCurrentnessGatePayload,
  invokeLastRootListenerSingleListenerCanary,
  invokePrivateRootFocusBlurEventDispatchExecution,
  invokePrivateRootClickEventDelegationDispatchGate,
  invokePrivateRootHostOutputClickDispatchCanary,
  isPortalPrepareMountListenerIntentRecord,
  isPrivateRootFocusBlurEventDispatchExecutionRecord,
  isPrivateRootClickEventDelegationDispatchGateRecord,
  isPrivateRootHostOutputClickDispatchCanaryRecord,
  isPrivateRootHostOutputSyntheticEventShapeGateRecord,
  isPrivateRootListenerCurrentnessGateRecord,
  listenToAllSupportedEvents,
  listenToNativeEvent,
  listenToNonDelegatedEvent,
  listenToPortalContainerEvents,
  privatePortalPrepareMountListenerIntentRecordType,
  privateRootListenerCleanupRecordType,
  privateRootListenerCurrentnessGateRecordType,
  privateRootListenerRegistrationRecordType,
  registerRootListenersForPrivateRoot,
  revertRootListenersForPrivateRoot
};
