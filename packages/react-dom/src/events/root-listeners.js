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
  createEventDispatchRecordFromWrapperRecord,
  getDispatchQueueInvocationCanaryRecordPayload,
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
const ROOT_LISTENERS_REGISTERED =
  'registered-private-root-listeners';
const ROOT_LISTENERS_REVERTED =
  'reverted-private-root-listeners';
const PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_RECORD_KIND =
  'FastReactDomPrivateRootHostOutputClickDispatchCanaryRecord';
const PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_STATUS =
  'controlled-private-root-host-output-click-dispatch-canary';
const INVALID_PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CODE =
  'FAST_REACT_DOM_INVALID_PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH';

const rootListenerRegistrationPayloads = new WeakMap();
const rootListenerCleanupRecords = new WeakMap();
const rootListenerDispatchRecords = new WeakMap();
const rootListenerInvocationCanaryRecords = new WeakMap();
const privateRootHostOutputClickDispatchCanaryPayloads = new WeakMap();

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
      enableListenerErrorRoutingDiagnostics:
        diagnosticOptions.enableListenerErrorRoutingDiagnostics,
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
    nativeEventPreventDefaultCallCount:
      nativeEvent.preventDefaultCallCount,
    nativeEventStopPropagationCallCount:
      nativeEvent.stopPropagationCallCount,
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

function getPrivateRootHostOutputClickDispatchCanaryPayload(record) {
  if (
    record === null ||
    (typeof record !== 'object' && typeof record !== 'function')
  ) {
    return null;
  }

  return privateRootHostOutputClickDispatchCanaryPayloads.get(record) || null;
}

function isPrivateRootHostOutputClickDispatchCanaryRecord(record) {
  return getPrivateRootHostOutputClickDispatchCanaryPayload(record) !== null;
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
      targets.map((target) => describeListenerTargetSnapshot(target))
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
    targetSnapshots
  });

  return record;
}

function listenToPortalContainerEvents(portalContainer, options) {
  listenToAllSupportedEvents(portalContainer, options);
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
    canInstallListeners: canInstallListener(target),
    eventListenerSetSize:
      eventListenerSet instanceof Set ? eventListenerSet.size : 0,
    listeningMarker: inspectListeningMarker(target)
  });
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

function assertActiveRootListenerRegistrationPayload(registrationRecord) {
  const payload = rootListenerRegistrationPayloads.get(registrationRecord);
  if (payload === undefined) {
    throwRootHostOutputClickDispatchError(
      'Expected a private React DOM root listener registration record.'
    );
  }
  if (!payload.active) {
    throwRootHostOutputClickDispatchError(
      'Cannot dispatch a private root host-output click after root listeners were reverted.'
    );
  }
  return payload;
}

function normalizePrivateRootHostOutputClickDispatchCanaryOptions(options) {
  const normalizedOptions =
    options !== null &&
    (typeof options === 'object' || typeof options === 'function')
      ? options
      : {};

  return freezeRecord({
    enableListenerErrorRoutingDiagnostics:
      normalizedOptions.enableListenerErrorRoutingDiagnostics === true,
    enablePropagationStopDiagnostics:
      normalizedOptions.enablePropagationStopDiagnostics === true
  });
}

function getInstalledRootListenerPair(registrationPayload, domEventName) {
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
    throwRootHostOutputClickDispatchError(
      'Private root host-output click dispatch requires capture and bubble root listener shells.'
    );
  }

  return {
    bubble,
    capture
  };
}

function dispatchInstalledRootListener(listenerRecord, nativeEvent) {
  listenerRecord.listener(nativeEvent);
  const dispatchRecord = getLastRootListenerDispatchRecord(
    listenerRecord.listener
  );
  if (dispatchRecord === null) {
    throwRootHostOutputClickDispatchError(
      'Private root host-output click dispatch did not produce a dispatch record.'
    );
  }
  return dispatchRecord;
}

function createPrivateFakeClickEvent(target) {
  return {
    preventDefaultCallCount: 0,
    stopPropagationCallCount: 0,
    target,
    type: 'click',
    preventDefault() {
      this.preventDefaultCallCount++;
    },
    stopPropagation() {
      this.stopPropagationCallCount++;
    }
  };
}

function throwRootHostOutputClickDispatchError(message) {
  const error = new Error(message);
  error.code = INVALID_PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CODE;
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
  PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_RECORD_KIND,
  PRIVATE_ROOT_HOST_OUTPUT_CLICK_DISPATCH_CANARY_STATUS,
  ROOT_LISTENERS_REGISTERED,
  ROOT_LISTENERS_REVERTED,
  addTrappedEventListener,
  createEventListenerShell,
  describePortalContainerListenerGuard,
  describeRootListenerGuard,
  getAddEventListenerOptions,
  getLastRootListenerInvocationCanaryRecord,
  getLastRootListenerDispatchRecord,
  getRootEventTargetOwnerDocument,
  getPrivateRootHostOutputClickDispatchCanaryPayload,
  invokeLastRootListenerSingleListenerCanary,
  invokePrivateRootHostOutputClickDispatchCanary,
  isPrivateRootHostOutputClickDispatchCanaryRecord,
  listenToAllSupportedEvents,
  listenToNativeEvent,
  listenToNonDelegatedEvent,
  listenToPortalContainerEvents,
  privateRootListenerCleanupRecordType,
  privateRootListenerRegistrationRecordType,
  registerRootListenersForPrivateRoot,
  revertRootListenersForPrivateRoot
};
