'use strict';

const {
  assert,
  path,
  test,
  reactDom,
  resourceFormGate,
  rootBridge,
  componentTree,
  refCallbackGate,
  domHost,
  rootMarkers,
  listenerRegistry,
  eventListener,
  eventSystemFlags,
  rootListeners,
  pluginEventSystem,
  ELEMENT_NODE,
  TEXT_NODE,
  assertBridgeDidNotTouchContainer,
  createFocusBlurNativeEvent,
  createDocument,
  createElement,
  createTextNode,
  attributeEntries
} = require('./context.js');

test('private portal fake-DOM commit handoff validates ownership and blocked side effects', () => {
  const document = createDocument('private-portal-commit');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'portal child'
    },
    type: 'span'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-boundary',
    portalCommitIdPrefix: 'portal-commit'
  });
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'portal-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootPortalCommitHandoffPayload(handoff);
  const resourceBoundary =
    resourceFormGate.recordResourceFormPortalCommitBlockedRequest(handoff);
  const hiddenResourceBoundary =
    resourceFormGate.getResourceFormPortalCommitBlockedRecordPayload(
      resourceBoundary
    );

  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootPortalCommitHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootPortalFakeDomCommitHandoffRecord'
  );
  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED
  );
  assert.equal(
    handoff.commitStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED
  );
  assert.equal(handoff.commitHandoffId, 'portal-commit:1');
  assert.equal(handoff.sourceBoundaryId, 'portal-boundary:1');
  assert.equal(handoff.sourceRequestType, 'root.render');
  assert.deepEqual(handoff.fakeDomCommitTarget, {
    canAppendChild: true,
    canRemoveChild: true,
    hasTextContent: true,
    portalContainerInfo: {
      kind: 'object',
      nodeName: 'SECTION',
      nodeType: ELEMENT_NODE
    }
  });
  assert.deepEqual(handoff.pendingChildrenInfo, {
    length: 1,
    type: 'array'
  });
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'portal-fake-dom-commit-apply',
      'portal-prepare-mount-listeners',
      'portal-resource-side-effects',
      'portal-child-reconciliation',
      'portal-container-mounting',
      'portal-container-listeners',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'marker-writes',
      'listener-installation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(handoff.fakeDomCommitHandoff, true);
  assert.equal(handoff.fakeDomCommitApplied, false);
  assert.equal(handoff.portalContainerChildrenReplaced, false);
  assert.equal(handoff.portalChildReconciliation, false);
  assert.equal(handoff.portalMounting, false);
  assert.equal(handoff.preparePortalMount, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.domMutation, false);
  assert.equal(handoff.markerWrites, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.resourceSideEffects, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.publicPortalMounting, false);
  assert.equal(handoff.publicDomMutation, false);
  assert.equal(handoff.publicRootCompatibilitySurface, false);
  assert.equal(handoff.publicRootRenderCompatibilityClaimed, false);
  assert.equal(
    handoff.privatePortalMetadataPromotesPublicRootRender,
    false
  );
  assert.equal(handoff.compatibilityClaimed, false);

  assert.equal(
    handoff.portalContainerOwnership.ownershipStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED
  );
  assert.equal(
    handoff.portalContainerOwnership.rootContainerMarkedAsRoot,
    true
  );
  assert.equal(
    handoff.portalContainerOwnership.rootContainerOwnerMatchesHandle,
    true
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerMarkedAsRoot,
    false
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerOwnerMatchesRoot,
    false
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerOwnedByAnotherRoot,
    false
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerAvailableForPortal,
    true
  );
  assert.equal(handoff.portalContainerOwnership.sameContainerAsRoot, false);
  assert.equal(handoff.portalContainerOwnership.sameOwnerDocument, true);
  assert.equal(handoff.listenerSideEffects.preparePortalMount, false);
  assert.equal(handoff.listenerSideEffects.listenToAllSupportedEvents, false);
  assert.equal(handoff.listenerSideEffects.listenerInstallation, false);
  assert.equal(handoff.listenerSideEffects.hasPortalListeningMarker, false);
  assert.equal(
    handoff.listenerSideEffects.ownerDocumentHasSelectionChangeMarker,
    true
  );

  assert.equal(hiddenHandoff.boundaryRecord, boundary);
  assert.equal(hiddenHandoff.pendingChildren[0], portalChild);
  assert.equal(hiddenHandoff.portal, portal);
  assert.equal(hiddenHandoff.portalContainer, portalContainer);
  assert.equal(hiddenHandoff.rootContainer, rootContainer);
  assert.equal(hiddenHandoff.rootHandle, create.handle);
  assert.equal(hiddenHandoff.sourceRecord, render);

  assert.equal(
    resourceBoundary.$$typeof,
    resourceFormGate.resourceFormPortalCommitBoundaryRecordType
  );
  assert.equal(
    resourceBoundary.kind,
    'FastReactDomResourceFormPortalCommitBoundaryRecord'
  );
  assert.equal(
    resourceBoundary.resourceSideEffectStatus,
    resourceFormGate.privatePortalCommitResourceBlockedStatus
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.gateStatus,
    resourceFormGate.privateRootBridgeRecordOnlyStatus
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.commitStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED
  );
  assert.equal(resourceBoundary.rootBridgeBoundary.resourceSideEffects, false);
  assert.deepEqual(
    resourceBoundary.sideEffects,
    resourceFormGate.portalCommitResourceSideEffects
  );
  assert.deepEqual(
    resourceBoundary.privateResourceDispatcherBoundary,
    resourceFormGate.describePrivateResourceDispatcherBoundary('resource-hint')
  );
  assert.equal(resourceBoundary.sourceAdapterBoundary.adaptersInvoked, false);
  assert.equal(resourceBoundary.sideEffects.resourcesDispatched, false);
  assert.equal(resourceBoundary.sideEffects.sourceAdaptersInvoked, false);
  assert.equal(resourceBoundary.sideEffects.portalContainerMutated, false);
  assert.equal(hiddenResourceBoundary.portalCommitHandoff, handoff);

  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.throws(() => bridge.createPortalCommitHandoff({}), {
    code: 'FAST_REACT_DOM_INVALID_PORTAL_COMMIT_HANDOFF_RECORD'
  });
  assert.throws(() => otherBridge.createPortalCommitHandoff(boundary), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(
    () =>
      resourceFormGate.recordResourceFormPortalCommitBlockedRequest({
        ...handoff,
        compatibilityClaimed: true
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidPortalCommitHandoffCode
    }
  );

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assertBridgeDidNotTouchContainer(rootContainer, document);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
});

test('private portal preparePortalMount listener intent records without installing', () => {
  const document = createDocument('private-portal-prepare-listener');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'portal child'
    },
    type: 'span'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-boundary',
    portalPrepareMountListenerIdPrefix: 'portal-listener'
  });
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'portal-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);

  const intent = bridge.createPortalPrepareMountListenerIntent(boundary);
  const hiddenIntent =
    rootBridge.getPrivateRootPortalPrepareMountListenerIntentPayload(
      intent
    );
  const eventIntentPayload =
    rootListeners.getPortalPrepareMountListenerIntentPayload(
      hiddenIntent.listenerIntentRecord
    );

  assert.equal(
    intent.$$typeof,
    rootBridge.privateRootPortalPrepareMountListenerIntentRecordType
  );
  assert.equal(
    intent.kind,
    'FastReactDomPrivateRootPortalPrepareMountListenerIntentRecord'
  );
  assert.equal(intent.operation, 'portal-prepare-mount-listener-intent');
  assert.equal(intent.intentId, 'portal-listener:1');
  assert.equal(
    intent.intentStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_PREPARE_MOUNT_LISTENER_INTENT_ADMITTED
  );
  assert.equal(
    intent.listenerInstallationStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_LISTENER_INSTALLATION_BLOCKED
  );
  assert.equal(intent.sourceBoundaryId, boundary.boundaryId);
  assert.equal(intent.sourceRequestId, render.requestId);
  assert.equal(intent.portalKey, 'portal-key');
  assert.deepEqual(intent.hostFiberPath, ['HostRoot', 'HostPortal']);
  assert.deepEqual(
    intent.acceptedCapabilities.map((capability) => capability.id),
    [
      'portal-accepted-boundary',
      'portal-prepare-mount-listener-intent',
      'portal-listen-to-all-supported-events-plan'
    ]
  );
  assert.deepEqual(
    intent.blockedCapabilities.map((capability) => capability.id),
    [
      'portal-public-container-mounting',
      'portal-listener-installation',
      'portal-event-dispatch',
      'portal-child-reconciliation',
      'portal-container-replacement',
      'portal-resource-side-effects',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'hydration',
      'compatibility-claims'
    ]
  );
  assert.equal(intent.preparePortalMountIntent, true);
  assert.equal(intent.preparePortalMount, false);
  assert.equal(intent.listenToAllSupportedEventsIntent, true);
  assert.equal(intent.listenToAllSupportedEvents, false);
  assert.equal(intent.portalListenerIntentRecorded, true);
  assert.equal(intent.portalContainerChildrenReplaced, false);
  assert.equal(intent.portalChildReconciliation, false);
  assert.equal(intent.portalMounting, false);
  assert.equal(intent.publicPortalMounting, false);
  assert.equal(intent.nativeExecution, false);
  assert.equal(intent.reconcilerExecution, false);
  assert.equal(intent.domMutation, false);
  assert.equal(intent.publicDomMutation, false);
  assert.equal(intent.markerWrites, false);
  assert.equal(intent.listenerInstallation, false);
  assert.equal(intent.resourceSideEffects, false);
  assert.equal(intent.eventDispatch, false);
  assert.equal(intent.publicRootCompatibilitySurface, false);
  assert.equal(intent.publicRootRenderCompatibilityClaimed, false);
  assert.equal(
    intent.privatePortalMetadataPromotesPublicRootRender,
    false
  );
  assert.equal(intent.compatibilityClaimed, false);
  assert.equal(
    intent.portalListenerGuard.action,
    'record-prepare-portal-mount-listener-intent'
  );
  assert.equal(intent.portalListenerGuard.hasPortalListeningMarker, false);
  assert.equal(intent.listenerIntent.listenerIntentCount, 138);
  assert.equal(intent.listenerIntent.portalListenerIntentCount, 138);
  assert.equal(intent.listenerIntent.ownerDocumentListenerIntentCount, 0);
  assert.equal(intent.listenerIntent.passiveListenerIntentCount, 6);
  assert.equal(intent.listenerIntent.portalAlreadyListening, false);
  assert.equal(intent.listenerIntent.ownerDocumentAlreadyListening, true);
  assert.equal(
    intent.listenerIntent.eventIntentMatchesPreparePortalMount,
    true
  );
  assert.equal(
    intent.listenerIntent.eventRecordType,
    rootListeners.privatePortalPrepareMountListenerIntentRecordType
  );
  assert.equal(
    intent.portalContainerOwnership.ownershipStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED
  );
  assert.equal(
    intent.portalContainerOwnership.rootContainerOwnerMatchesHandle,
    true
  );
  assert.equal(
    intent.portalContainerOwnership.portalContainerAvailableForPortal,
    true
  );

  assert.equal(
    rootBridge.isPrivateRootPortalPrepareMountListenerIntentRecord(intent),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPortalPrepareMountListenerIntentRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPortalPrepareMountListenerIntentPayload({}),
    null
  );
  assert.equal(
    rootListeners.isPortalPrepareMountListenerIntentRecord(
      hiddenIntent.listenerIntentRecord
    ),
    true
  );
  assert.equal(hiddenIntent.boundaryRecord, boundary);
  assert.equal(hiddenIntent.listenerIntentPayload, eventIntentPayload);
  assert.equal(hiddenIntent.portal, portal);
  assert.equal(hiddenIntent.portalContainer, portalContainer);
  assert.equal(hiddenIntent.rootContainer, rootContainer);
  assert.equal(hiddenIntent.rootHandle, create.handle);
  assert.equal(hiddenIntent.sourceRecord, render);
  assert.equal(eventIntentPayload.portalContainer, portalContainer);
  assert.equal(eventIntentPayload.ownerDocument, document);
  assert.equal(eventIntentPayload.portalListenerIntents.length, 138);
  assert.equal(eventIntentPayload.ownerDocumentListenerIntents.length, 0);
  assert.equal(eventIntentPayload.listenerIntents.length, 138);

  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      portalContainer,
      listenerRegistry.internalEventHandlersKey
    ),
    false
  );
  assert.equal(rootContainer.__mutationLog.length, 0);

  const serialized = JSON.stringify(intent);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('__FAST_REACT_DOM_EVENT_TARGET__'), false);

  assert.throws(() => bridge.createPortalPrepareMountListenerIntent({}), {
    code: 'FAST_REACT_DOM_INVALID_PORTAL_PREPARE_MOUNT_LISTENER_RECORD'
  });
  assert.throws(
    () => otherBridge.createPortalPrepareMountListenerIntent(boundary),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private portal fake-DOM mount diagnostic appends one explicit HostComponent and HostText child', () => {
  const document = createDocument('private-portal-fake-dom-mount');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'portal child'
    },
    type: 'span'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-boundary',
    portalCommitIdPrefix: 'portal-commit',
    portalMountIdPrefix: 'portal-mount'
  });
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'portal-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });

  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const hiddenMount =
    rootBridge.getPrivateRootPortalFakeDomMountPayload(mount);
  const resourceBoundary =
    resourceFormGate.recordResourceFormPortalFakeDomMountBlockedRequest(
      mount
    );
  const hiddenResourceBoundary =
    resourceFormGate.getResourceFormPortalFakeDomMountBlockedRecordPayload(
      resourceBoundary
    );

  assert.equal(
    mount.$$typeof,
    rootBridge.privateRootPortalFakeDomMountRecordType
  );
  assert.equal(
    mount.kind,
    'FastReactDomPrivateRootPortalFakeDomMountDiagnosticRecord'
  );
  assert.equal(mount.operation, 'portal-fake-dom-mount-diagnostic');
  assert.equal(
    mount.mountStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED
  );
  assert.equal(
    mount.publicMountStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED
  );
  assert.equal(mount.mountDiagnosticId, 'portal-mount:1');
  assert.equal(mount.sourceCommitHandoffId, handoff.commitHandoffId);
  assert.equal(mount.sourceCommitStatus, handoff.commitStatus);
  assert.deepEqual(mount.hostFiberPath, [
    'HostRoot',
    'HostPortal',
    'HostComponent',
    'HostText'
  ]);
  assert.deepEqual(
    mount.acceptedCapabilities.map((capability) => capability.id),
    [
      'portal-explicit-host-component-mount',
      'portal-explicit-host-text-mount',
      'portal-component-tree-host-instance-map'
    ]
  );
  assert.deepEqual(
    mount.blockedCapabilities.map((capability) => capability.id),
    [
      'portal-public-container-mounting',
      'portal-child-reconciliation',
      'portal-container-replacement',
      'portal-prepare-mount-listeners',
      'portal-resource-side-effects',
      'native-execution',
      'reconciler-execution',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(mount.explicitChildSource, 'portal.children');
  assert.equal(mount.hostComponentType, 'span');
  assert.equal(mount.hostText, 'portal child');
  assert.deepEqual(mount.hostComponentInfo, {
    kind: 'object',
    nodeName: 'SPAN',
    nodeType: ELEMENT_NODE
  });
  assert.deepEqual(mount.hostTextInfo, {
    kind: 'object',
    nodeName: '#text',
    nodeType: TEXT_NODE
  });
  assert.equal(mount.portalContainerChildCountBefore, 0);
  assert.equal(mount.portalContainerChildCountAfter, 1);
  assert.equal(mount.hostComponentChildCountAfter, 1);
  assert.equal(mount.fakeDomCommitHandoff, true);
  assert.equal(mount.fakeDomCommitApplied, true);
  assert.equal(mount.fakeDomPortalMountDiagnostic, true);
  assert.equal(mount.explicitPortalHostChildMounted, true);
  assert.equal(mount.componentTreeMetadataAttached, true);
  assert.equal(mount.portalContainerChildrenReplaced, false);
  assert.equal(mount.portalChildReconciliation, false);
  assert.equal(mount.portalMounting, false);
  assert.equal(mount.publicPortalMounting, false);
  assert.equal(mount.preparePortalMount, false);
  assert.equal(mount.nativeExecution, false);
  assert.equal(mount.reconcilerExecution, false);
  assert.equal(mount.domMutation, true);
  assert.equal(mount.publicDomMutation, false);
  assert.equal(mount.listenerInstallation, false);
  assert.equal(mount.resourceSideEffects, false);
  assert.equal(mount.eventDispatch, false);
  assert.equal(mount.publicRootCompatibilitySurface, false);
  assert.equal(mount.publicRootRenderCompatibilityClaimed, false);
  assert.equal(
    mount.privatePortalMetadataPromotesPublicRootRender,
    false
  );
  assert.equal(mount.compatibilityClaimed, false);
  assert.equal(mount.listenerSideEffects.preparePortalMount, false);
  assert.equal(mount.listenerSideEffects.listenToAllSupportedEvents, false);
  assert.equal(mount.listenerSideEffects.listenerInstallation, false);
  assert.equal(mount.listenerSideEffects.hasPortalListeningMarker, false);
  assert.equal(
    mount.listenerSideEffects.ownerDocumentHasSelectionChangeMarker,
    true
  );

  assert.equal(hiddenMount.commitHandoffRecord, handoff);
  assert.equal(hiddenMount.explicitChild, portalChild);
  assert.equal(hiddenMount.hostComponentNode, portalContainer.firstChild);
  assert.equal(hiddenMount.hostTextNode, hiddenMount.hostComponentNode.firstChild);
  assert.equal(hiddenMount.hostComponentNode.parentNode, portalContainer);
  assert.equal(hiddenMount.hostTextNode.parentNode, hiddenMount.hostComponentNode);
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(
      hiddenMount.hostInstanceToken
    ),
    create.owner
  );
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(hiddenMount.hostTextToken),
    create.owner
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(hiddenMount.hostComponentNode),
    portalChild.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(hiddenMount.hostTextNode),
    null
  );
  assert.equal(hiddenMount.hostComponentNode.textContent, 'portal child');
  assert.equal(hiddenMount.hostTextNode.nodeValue, 'portal child');
  assert.equal(hiddenMount.portalContainer, portalContainer);
  assert.equal(hiddenMount.rootContainer, rootContainer);
  assert.equal(hiddenMount.sourceRecord, render);
  assert.equal(portalContainer.childNodes.length, 1);
  assert.equal(portalContainer.firstChild.nodeName, 'SPAN');
  assert.equal(portalContainer.textContent, 'portal child');
  assert.deepEqual(
    document.__mutationLog.map((entry) => entry.type),
    ['createElement', 'createTextNode']
  );
  assert.deepEqual(portalContainer.__mutationLog, [
    {
      child: hiddenMount.hostComponentNode,
      type: 'appendChild'
    }
  ]);
  assert.deepEqual(hiddenMount.hostComponentNode.__mutationLog, [
    {
      child: hiddenMount.hostTextNode,
      type: 'appendChild'
    }
  ]);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.equal(rootContainer.__mutationLog.length, 0);

  assert.equal(
    resourceBoundary.$$typeof,
    resourceFormGate.resourceFormPortalFakeDomMountBoundaryRecordType
  );
  assert.equal(
    resourceBoundary.kind,
    'FastReactDomResourceFormPortalFakeDomMountBoundaryRecord'
  );
  assert.equal(
    resourceBoundary.resourceSideEffectStatus,
    resourceFormGate.privatePortalFakeDomMountResourceBlockedStatus
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.fakeDomCommitApplied,
    true
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.publicDomMutation,
    false
  );
  assert.equal(resourceBoundary.rootBridgeBoundary.resourceSideEffects, false);
  assert.deepEqual(
    resourceBoundary.sideEffects,
    resourceFormGate.portalFakeDomMountResourceSideEffects
  );
  assert.equal(resourceBoundary.sideEffects.portalContainerMutated, true);
  assert.equal(resourceBoundary.sideEffects.resourcesDispatched, false);
  assert.equal(resourceBoundary.sideEffects.sourceAdaptersInvoked, false);
  assert.equal(resourceBoundary.sideEffects.portalListenersInstalled, false);
  assert.equal(
    resourceFormGate.isResourceFormPortalFakeDomMountBlockedRecord(
      resourceBoundary
    ),
    true
  );
  assert.equal(hiddenResourceBoundary.mountRecord, mount);

  assert.throws(() => bridge.createPortalFakeDomMountDiagnostic(handoff), {
    code: 'FAST_REACT_DOM_INVALID_PORTAL_FAKE_DOM_MOUNT_RECORD'
  });
  assert.throws(
    () =>
      bridge.createPortalFakeDomMountDiagnostic(handoff, {
        explicitChild: {
          props: {
            children: 'not the portal child'
          },
          type: 'span'
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_PORTAL_FAKE_DOM_MOUNT_RECORD'
    }
  );
  assert.throws(
    () =>
      otherBridge.createPortalFakeDomMountDiagnostic(handoff, {
        explicitChild: portalChild
      }),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.recordResourceFormPortalFakeDomMountBlockedRequest({
        ...mount,
        compatibilityClaimed: true
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidPortalCommitHandoffCode
    }
  );

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private portal event owner-root gate records portal child event path ownership only', () => {
  const document = createDocument('private-portal-event-owner-root');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'portal child',
      onClick() {
        throw new Error('portal child listener should not run');
      }
    },
    type: 'span'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-boundary',
    portalCommitIdPrefix: 'portal-commit',
    portalEventOwnerRootIdPrefix: 'portal-owner',
    portalMountIdPrefix: 'portal-mount'
  });
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'portal-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const ownerGate = bridge.createPortalEventOwnerRootGate(mount);
  const hiddenGate =
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload(ownerGate);
  const eventGate = hiddenGate.eventOwnerRootGateRecord;
  const eventGatePayload =
    pluginEventSystem.getPortalEventOwnerRootGateRecordPayload(eventGate);

  assert.equal(
    ownerGate.$$typeof,
    rootBridge.privateRootPortalEventOwnerRootGateRecordType
  );
  assert.equal(
    ownerGate.kind,
    'FastReactDomPrivateRootPortalEventOwnerRootGateRecord'
  );
  assert.equal(ownerGate.operation, 'portal-event-owner-root-gate');
  assert.equal(ownerGate.gateId, 'portal-owner:1');
  assert.equal(
    ownerGate.gateStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_RECORDED
  );
  assert.equal(
    ownerGate.eventBubblingStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_EVENT_BUBBLING_BLOCKED
  );
  assert.equal(ownerGate.sourceMountDiagnosticId, mount.mountDiagnosticId);
  assert.equal(ownerGate.sourceCommitHandoffId, handoff.commitHandoffId);
  assert.equal(ownerGate.sourceBoundaryId, boundary.boundaryId);
  assert.equal(ownerGate.portalKey, 'portal-key');
  assert.deepEqual(ownerGate.hostFiberPath, [
    'HostRoot',
    'HostPortal',
    'HostComponent'
  ]);
  assert.deepEqual(
    ownerGate.acceptedCapabilities.map((capability) => capability.id),
    [
      'portal-mounted-child-owner-root',
      'portal-event-target-dispatch-path',
      'portal-event-owner-root-diagnostic'
    ]
  );
  assert.deepEqual(
    ownerGate.blockedCapabilities.map((capability) => capability.id),
    [
      'public-portal-event-bubbling',
      'portal-event-dispatch',
      'portal-listener-installation',
      'browser-dom-compatibility',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'hydration',
      'compatibility-claims'
    ]
  );
  assert.deepEqual(ownerGate.ownerRootAttachment, {
    eventTargetRootOwnerMatchesPortalOwner: true,
    hostComponentRootOwnerMatchesPortalOwner: true,
    hostTextRootOwnerMatchesPortalOwner: true
  });
  assert.equal(ownerGate.targetDispatchPathLength, 1);
  assert.equal(
    ownerGate.targetDispatchPathStatus,
    'resolved-component-tree-dispatch-path'
  );
  assert.equal(ownerGate.dispatchPathRootOwnerMatchCount, 1);
  assert.equal(ownerGate.dispatchPathRootOwnerMismatchCount, 0);
  assert.equal(ownerGate.portalContainerContainsEventTarget, true);
  assert.equal(ownerGate.rootContainerContainsEventTarget, false);
  assert.equal(ownerGate.portalContainerIsRootContainer, false);
  assert.equal(ownerGate.portalContainerNestedInRootContainer, false);
  assert.equal(ownerGate.portalContainerPathLength, 2);
  assert.equal(
    ownerGate.portalContainerPathStatus,
    'portal-container-path-without-root-container'
  );
  assert.equal(ownerGate.portalContainerPathRootOwnerMatchCount, 1);
  assert.equal(ownerGate.portalOwnerRootEventPathLength, 1);
  assert.deepEqual(ownerGate.ownerRootInfo, {
    kind: 'FastReactDomPrivateRootOwner',
    rootId: create.rootId,
    rootKind: rootBridge.CLIENT_ROOT_KIND,
    rootTag: rootBridge.CONCURRENT_ROOT_TAG
  });
  assert.equal(ownerGate.portalOwnerRootAttached, true);
  assert.equal(ownerGate.portalEventPathDiagnostic, true);
  assert.equal(ownerGate.portalEventBubbling, false);
  assert.equal(ownerGate.publicPortalBubbling, false);
  assert.equal(ownerGate.publicPortalBubblingBlocked, true);
  assert.equal(ownerGate.eventDispatch, false);
  assert.equal(ownerGate.publicDispatchBlocked, true);
  assert.equal(ownerGate.portalContainerListenerDispatchBlocked, true);
  assert.equal(ownerGate.listenerInvocationCount, 0);
  assert.equal(ownerGate.syntheticEventCount, 0);
  assert.equal(ownerGate.browserDomEventCompatibilityClaimed, false);
  assert.equal(ownerGate.fakeDomEventCompatibilityClaimed, false);
  assert.equal(ownerGate.publicRootCompatibilitySurface, false);
  assert.equal(ownerGate.publicRootRenderCompatibilityClaimed, false);
  assert.equal(
    ownerGate.privatePortalMetadataPromotesPublicRootRender,
    false
  );
  assert.equal(ownerGate.compatibilityClaimed, false);
  assert.equal(ownerGate.listenerSideEffects.listenerInstallation, false);
  assert.equal(ownerGate.listenerSideEffects.hasPortalListeningMarker, false);
  assert.deepEqual(ownerGate.eventOwnerRootGate, {
    blockedReason: pluginEventSystem.PORTAL_EVENT_BUBBLING_BLOCKED_CODE,
    browserDomEventCompatibilityClaimed: false,
    dispatchPathRootOwnerMatchCount: 1,
    dispatchPathRootOwnerMismatchCount: 0,
    eventDispatch: false,
    eventRecordKind:
      pluginEventSystem.PORTAL_EVENT_OWNER_ROOT_GATE_RECORD_KIND,
    eventRecordStatus:
      pluginEventSystem.PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS,
    listenerInvocationCount: 0,
    ownerRootInfo: {
      kind: 'FastReactDomPrivateRootOwner',
      rootId: create.rootId,
      rootKind: rootBridge.CLIENT_ROOT_KIND,
      rootTag: rootBridge.CONCURRENT_ROOT_TAG
    },
    ownerRootMatchesTargetRoot: true,
    portalContainerContainsTarget: true,
    portalContainerNestedInRootContainer: false,
    portalContainerPathLength: 2,
    portalContainerPathStatus:
      'portal-container-path-without-root-container',
    portalContainerPathRootOwnerMatchCount: 1,
    portalOwnerRootEventPathLength: 1,
    publicDispatchBlocked: true,
    publicPortalBubblingBlocked: true,
    publicPortalBubblingEnabled: false,
    rootContainerContainsTarget: false,
    syntheticEventCount: 0,
    targetDispatchPathLength: 1,
    targetDispatchPathStatus: 'resolved-component-tree-dispatch-path',
    targetInstStatus: 'resolved-component-tree-host-instance'
  });

  assert.equal(
    rootBridge.isPrivateRootPortalEventOwnerRootGateRecord(ownerGate),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPortalEventOwnerRootGateRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload({}),
    null
  );
  assert.equal(hiddenGate.mountRecord, mount);
  assert.equal(hiddenGate.portal, portal);
  assert.equal(hiddenGate.portalContainer, portalContainer);
  assert.equal(hiddenGate.rootContainer, rootContainer);
  assert.equal(hiddenGate.rootHandle, create.handle);
  assert.equal(
    pluginEventSystem.isPortalEventOwnerRootGateRecord(eventGate),
    true
  );
  assert.equal(eventGatePayload.ownerRoot, create.owner);
  assert.equal(eventGatePayload.portalContainer, portalContainer);
  assert.equal(eventGatePayload.rootContainer, rootContainer);
  assert.equal(
    eventGatePayload.targetDispatchPathRecord,
    hiddenGate.targetDispatchPathRecord
  );
  assert.equal(
    hiddenGate.targetDispatchPathRecord.entries[0].rootOwner,
    create.owner
  );
  assert.equal(
    hiddenGate.targetDispatchPathRecord.entries[0].targetHostInstanceNode,
    hiddenGate.hostComponentNode
  );
  assert.equal(hiddenGate.eventOwnerRootGatePayload.ownerRoot, create.owner);
  assert.deepEqual(
    eventGate.portalOwnerRootEventPath.map((entry) => [
      entry.index,
      entry.isTargetHostInstance,
      entry.rootOwnerMatchesPortalOwner,
      entry.publicPortalBubblingEnabled,
      entry.publicDispatchEnabled
    ]),
    [[0, true, true, false, false]]
  );
  assert.deepEqual(
    eventGate.portalContainerPath.entries.map((entry) => [
      entry.index,
      entry.isEventTarget,
      entry.isPortalContainer,
      entry.isRootContainer,
      entry.ownerRootDispatchPathIndex,
      entry.rootOwnerMatchesPortalOwner
    ]),
    [
      [0, true, false, false, 0, true],
      [1, false, true, false, null, null]
    ]
  );
  assert.deepEqual(
    hiddenGate.eventOwnerRootGatePayload.portalContainerPathNodes,
    [hiddenGate.hostComponentNode, portalContainer]
  );
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.equal(hiddenGate.hostComponentNode.__registrations.length, 0);

  assert.throws(() => bridge.createPortalEventOwnerRootGate({}), {
    code: 'FAST_REACT_DOM_INVALID_PORTAL_EVENT_OWNER_ROOT_GATE_RECORD'
  });
  assert.throws(() => otherBridge.createPortalEventOwnerRootGate(mount), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private portal event owner-root gate preserves metadata across a secondary fake root', () => {
  const document = createDocument('private-portal-secondary-root-owner');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'secondary portal child',
      onClick() {
        throw new Error('secondary portal listener should not run');
      }
    },
    type: 'button'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'secondary-portal-boundary',
    portalCommitIdPrefix: 'secondary-portal-commit',
    portalEventOwnerRootIdPrefix: 'secondary-portal-owner',
    portalMountIdPrefix: 'secondary-portal-mount'
  });
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const secondaryCreate = bridge.createClientRoot(portalContainer);
  const secondarySideEffects =
    bridge.applyCreateRootSideEffects(secondaryCreate);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'secondary-portal-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const ownerGate = bridge.createPortalEventOwnerRootGate(mount);
  const hiddenGate =
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload(ownerGate);
  const pluginGate = hiddenGate.eventOwnerRootGateRecord;
  const pluginPayload =
    pluginEventSystem.getPortalEventOwnerRootGateRecordPayload(pluginGate);
  const dispatchPath = hiddenGate.targetDispatchPathRecord;

  assert.equal(
    ownerGate.portalContainerOwnership.portalContainerMarkedAsRoot,
    true
  );
  assert.equal(
    ownerGate.portalContainerOwnership.portalContainerOwnedByAnotherRoot,
    true
  );
  assert.equal(
    ownerGate.portalContainerOwnership.portalContainerOwnerMatchesRoot,
    false
  );
  assert.equal(dispatchPath.containerRootBoundaryNode, portalContainer);
  assert.equal(dispatchPath.containerRootBoundaryOwner, secondaryCreate.owner);
  assert.equal(dispatchPath.containerRootOwnerMatchesTargetRoot, false);
  assert.equal(dispatchPath.ownerRootPreservedAcrossContainerRoot, true);
  assert.equal(
    dispatchPath.ownerRootPreservedAcrossForeignContainerRoot,
    true
  );
  assert.equal(pluginGate.ownerRootMatchesTargetRoot, true);
  assert.equal(pluginGate.dispatchPathRootOwnerMismatchCount, 0);
  assert.equal(pluginGate.portalContainerContainsTarget, true);
  assert.equal(pluginGate.portalContainerMatchesDispatchRootBoundary, true);
  assert.equal(pluginGate.portalContainerOwnedBySecondaryRoot, true);
  assert.equal(pluginGate.portalContainerRootOwnerPresent, true);
  assert.equal(pluginGate.portalContainerRootOwnerMatchesPortalOwner, false);
  assert.equal(pluginGate.ownerRootPreservedAcrossPortalContainerRoot, true);
  assert.equal(pluginGate.ownerRootPreservedAcrossSecondaryPortalRoot, true);
  assert.equal(pluginPayload.portalContainerRootOwner, secondaryCreate.owner);
  assert.equal(pluginPayload.ownerRoot, create.owner);
  assert.equal(pluginGate.publicPortalBubblingEnabled, false);
  assert.equal(pluginGate.publicDispatchEnabled, false);
  assert.equal(pluginGate.publicDispatchBlocked, true);
  assert.equal(pluginGate.eventDispatch, false);
  assert.equal(pluginGate.listenerInvocationCount, 0);
  assert.equal(pluginGate.syntheticEventCount, 0);
  assert.equal(ownerGate.publicPortalBubbling, false);
  assert.equal(ownerGate.eventDispatch, false);
  assert.equal(ownerGate.listenerInstallation, false);
  assert.equal(ownerGate.compatibilityClaimed, false);

  bridge.revertCreateRootSideEffects(secondarySideEffects);
  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private focus/blur blocker gate records phase metadata and portal ownership without dispatch', () => {
  const document = createDocument('private-focus-blur-blocker');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalParent = createElement('DIV', document);
  const portalChild = createElement('INPUT', document);
  const rootOwner = {kind: 'FocusBlurRootOwner'};
  const parentHostOwner = {kind: 'FocusBlurParentHostOwner'};
  const childHostOwner = {kind: 'FocusBlurChildHostOwner'};
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  let listenerCalls = 0;
  const parentProps = {
    onBlur() {
      listenerCalls++;
    },
    onBlurCapture() {
      listenerCalls++;
    },
    onFocus() {
      listenerCalls++;
    },
    onFocusCapture() {
      listenerCalls++;
    }
  };
  const childProps = {
    onBlur() {
      listenerCalls++;
    },
    onBlurCapture() {
      listenerCalls++;
    },
    onFocus() {
      listenerCalls++;
    },
    onFocusCapture() {
      listenerCalls++;
    }
  };

  portalContainer.appendChild(portalParent);
  portalParent.appendChild(portalChild);
  componentTree.attachHostInstanceNode(
    portalParent,
    parentToken,
    parentProps
  );
  componentTree.attachHostInstanceNode(portalChild, childToken, childProps);

  function createFocusBlurDispatch(domEventName, eventSystemFlags) {
    const listener = rootListeners.createEventListenerShell(
      rootContainer,
      domEventName,
      eventSystemFlags
    );
    return pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      listener,
      createFocusBlurNativeEvent(domEventName, portalChild)
    );
  }

  const focusCapture = createFocusBlurDispatch(
    'focusin',
    rootListeners.IS_CAPTURE_PHASE
  );
  const focusBubble = createFocusBlurDispatch('focusin', 0);
  const blurCapture = createFocusBlurDispatch(
    'focusout',
    rootListeners.IS_CAPTURE_PHASE
  );
  const blurBubble = createFocusBlurDispatch('focusout', 0);
  const portalOwnerGate =
    pluginEventSystem.createPortalEventOwnerRootGateRecord(
      focusCapture.targetDispatchPathRecord,
      {
        domEventName: 'focusin',
        hostFiberPath: [
          'HostRoot',
          'HostPortal',
          'HostComponent',
          'HostComponent'
        ],
        ownerRoot: rootOwner,
        portalContainer,
        portalKey: 'focus-blur-portal',
        rootContainer
      }
    );
  const blocker =
    pluginEventSystem.createFocusBlurEventBlockerGateFromDispatchRecords(
      [focusCapture, focusBubble, blurCapture, blurBubble],
      {
        portalEventOwnerRootGateRecord: portalOwnerGate
      }
    );
  const blockerPayload =
    pluginEventSystem.getFocusBlurEventBlockerGateRecordPayload(blocker);

  assert.equal(Object.isFrozen(blocker), true);
  assert.equal(
    blocker.kind,
    pluginEventSystem.FOCUS_BLUR_EVENT_BLOCKER_GATE_RECORD_KIND
  );
  assert.equal(
    blocker.status,
    pluginEventSystem.PRIVATE_FOCUS_BLUR_EVENT_BLOCKER_GATE_STATUS
  );
  assert.equal(blocker.blockedReason, pluginEventSystem.FOCUS_BLUR_EVENT_BLOCKED_CODE);
  assert.equal(blocker.dispatchRecordCount, 4);
  assert.equal(blocker.focusDispatchRecordCount, 2);
  assert.equal(blocker.blurDispatchRecordCount, 2);
  assert.equal(blocker.capturePhaseRecordCount, 2);
  assert.equal(blocker.bubblePhaseRecordCount, 2);
  assert.deepEqual(blocker.observedNativeEventNames, [
    'focusin',
    'focusout'
  ]);
  assert.deepEqual(
    blocker.nativeEventMappings.map((mapping) => [
      mapping.nativeEventName,
      mapping.reactName,
      mapping.bubbleRegistrationName,
      mapping.captureRegistrationName,
      mapping.syntheticEventType,
      mapping.syntheticEventCreation
    ]),
    [
      ['focusin', 'onFocus', 'onFocus', 'onFocusCapture', 'focus', false],
      ['focusout', 'onBlur', 'onBlur', 'onBlurCapture', 'blur', false]
    ]
  );
  assert.deepEqual(
    blocker.phaseRecords.map((record) => [
      record.domEventName,
      record.phase,
      record.registrationName,
      record.reactName,
      record.syntheticEventType,
      record.listenerMetadataCount,
      record.processingListenerMetadata.map((listener) => listener.currentTarget)
    ]),
    [
      [
        'focusin',
        'capture',
        'onFocusCapture',
        'onFocus',
        'focus',
        2,
        [portalParent, portalChild]
      ],
      ['focusin', 'bubble', 'onFocus', 'onFocus', 'focus', 2, [
        portalChild,
        portalParent
      ]],
      [
        'focusout',
        'capture',
        'onBlurCapture',
        'onBlur',
        'blur',
        2,
        [portalParent, portalChild]
      ],
      ['focusout', 'bubble', 'onBlur', 'onBlur', 'blur', 2, [
        portalChild,
        portalParent
      ]]
    ]
  );
  assert.equal(blocker.listenerMetadataCount, 8);
  assert.equal(blocker.processingListenerMetadataCount, 8);
  assert.equal(blocker.targetCurrentTargetBlockerCount, 8);
  for (const listenerMetadata of blocker.listenerMetadata) {
    assert.equal(
      listenerMetadata.kind,
      pluginEventSystem.FOCUS_BLUR_EVENT_BLOCKER_LISTENER_RECORD_KIND
    );
    assert.equal(listenerMetadata.listenerInvocationCount, 0);
    assert.equal(listenerMetadata.syntheticEventCount, 0);
    assert.equal(listenerMetadata.willInvokeListener, false);
    assert.equal(listenerMetadata.exposesListener, false);
    assert.equal(listenerMetadata.exposesLatestProps, false);
    assert.equal(
      listenerMetadata.currentTargetExposureBlockedReason,
      pluginEventSystem.SYNTHETIC_EVENT_BLOCKED_CODE
    );
  }
  assert.equal(blocker.listenerInstallation, false);
  assert.equal(
    blocker.listenerInstallationBlockedReason,
    pluginEventSystem.FOCUS_BLUR_EVENT_LISTENER_INSTALLATION_BLOCKED_CODE
  );
  assert.equal(blocker.eventObjectCreation, false);
  assert.equal(blocker.syntheticFocusEventCreation, false);
  assert.equal(blocker.syntheticEventCount, 0);
  assert.equal(blocker.willInstallListeners, false);
  assert.equal(blocker.willDispatchEvents, false);
  assert.equal(blocker.willCreateSyntheticFocusEvents, false);
  assert.equal(blocker.publicDispatchEnabled, false);
  assert.equal(blocker.browserDomEventCompatibilityClaimed, false);
  assert.equal(blocker.compatibilityClaimed, false);
  assert.equal(blocker.portalOwnerRootAvailable, true);
  assert.equal(
    blocker.portalOwnerRootStatus,
    pluginEventSystem.PRIVATE_PORTAL_EVENT_OWNER_ROOT_GATE_STATUS
  );
  assert.equal(blocker.portalOwnerRoot.ownerRootMatchesTargetRoot, true);
  assert.equal(blocker.portalOwnerRoot.portalContainerContainsTarget, true);
  assert.equal(blocker.portalOwnerRoot.rootContainerContainsTarget, false);
  assert.equal(blockerPayload.dispatchRecords[0], focusCapture);
  assert.equal(
    blockerPayload.portalEventOwnerRootGateRecord,
    portalOwnerGate
  );
  assert.equal(
    pluginEventSystem.isFocusBlurEventBlockerGateRecord(blocker),
    true
  );
  assert.equal(listenerCalls, 0);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalChild.__registrations.length, 0);

  assert.throws(
    () =>
      pluginEventSystem.createFocusBlurEventBlockerGateFromDispatchRecords(
        createFocusBlurDispatch('click', 0)
      ),
    {
      code: pluginEventSystem.INVALID_FOCUS_BLUR_EVENT_BLOCKER_GATE_CODE
    }
  );

  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(componentTree.detachHostInstanceToken(parentToken), parentToken);
});

test('private nested portal event owner-root gate records owner and container paths only', () => {
  const document = createDocument('private-nested-portal-event-owner-root');
  const rootContainer = createElement('DIV', document);
  const portalHost = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  rootContainer.appendChild(portalHost);
  portalHost.appendChild(portalContainer);
  const portalChild = {
    props: {
      children: 'nested portal child',
      onClick() {
        throw new Error('nested portal listener should not run');
      }
    },
    type: 'button'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'nested-portal-boundary',
    portalCommitIdPrefix: 'nested-portal-commit',
    portalEventOwnerRootIdPrefix: 'nested-portal-owner',
    portalMountIdPrefix: 'nested-portal-mount'
  });
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portalHostToken = componentTree.createHostInstanceToken(
    {kind: 'NestedPortalContainerHostOwner'},
    create.owner
  );
  componentTree.attachHostInstanceNode(portalHost, portalHostToken, {});
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'nested-portal-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const ownerGate = bridge.createPortalEventOwnerRootGate(mount);
  const hiddenGate =
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload(ownerGate);
  const eventGate = hiddenGate.eventOwnerRootGateRecord;
  const eventGatePayload =
    pluginEventSystem.getPortalEventOwnerRootGateRecordPayload(eventGate);

  assert.equal(ownerGate.targetDispatchPathLength, 2);
  assert.equal(ownerGate.dispatchPathRootOwnerMatchCount, 2);
  assert.equal(ownerGate.dispatchPathRootOwnerMismatchCount, 0);
  assert.equal(ownerGate.portalContainerContainsEventTarget, true);
  assert.equal(ownerGate.rootContainerContainsEventTarget, true);
  assert.equal(ownerGate.portalContainerNestedInRootContainer, true);
  assert.equal(ownerGate.portalContainerPathLength, 4);
  assert.equal(
    ownerGate.portalContainerPathStatus,
    'portal-container-path-to-root-container'
  );
  assert.equal(ownerGate.portalContainerPathRootOwnerMatchCount, 2);
  assert.equal(ownerGate.portalOwnerRootEventPathLength, 2);
  assert.equal(ownerGate.portalEventBubbling, false);
  assert.equal(ownerGate.publicPortalBubbling, false);
  assert.equal(ownerGate.publicPortalBubblingBlocked, true);
  assert.equal(ownerGate.eventDispatch, false);
  assert.equal(ownerGate.publicDispatchBlocked, true);
  assert.equal(ownerGate.portalContainerListenerDispatchBlocked, true);
  assert.equal(ownerGate.listenerInvocationCount, 0);
  assert.equal(ownerGate.syntheticEventCount, 0);
  assert.equal(ownerGate.compatibilityClaimed, false);
  assert.deepEqual(
    eventGate.portalOwnerRootEventPath.map((entry) => [
      entry.index,
      entry.isTargetHostInstance,
      entry.rootOwnerMatchesPortalOwner,
      entry.publicPortalBubblingEnabled,
      entry.publicDispatchEnabled
    ]),
    [
      [0, true, true, false, false],
      [1, false, true, false, false]
    ]
  );
  assert.deepEqual(
    eventGate.portalContainerPath.entries.map((entry) => [
      entry.index,
      entry.isEventTarget,
      entry.isPortalContainer,
      entry.isRootContainer,
      entry.ownerRootDispatchPathIndex,
      entry.rootOwnerMatchesPortalOwner
    ]),
    [
      [0, true, false, false, 0, true],
      [1, false, true, false, null, null],
      [2, false, false, false, 1, true],
      [3, false, false, true, null, null]
    ]
  );
  assert.equal(eventGate.portalContainerPath.portalContainerPathIndex, 1);
  assert.equal(eventGate.portalContainerPath.rootContainerPathIndex, 3);
  assert.equal(
    eventGate.portalContainerPath.ownerRootPathIntersectsPortalContainerPath,
    true
  );
  assert.deepEqual(eventGatePayload.portalContainerPathNodes, [
    hiddenGate.hostComponentNode,
    portalContainer,
    portalHost,
    rootContainer
  ]);
  assert.equal(
    hiddenGate.targetDispatchPathRecord.entries[1].targetHostInstanceNode,
    portalHost
  );
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalHost.__registrations.length, 0);
  assert.equal(hiddenGate.hostComponentNode.__registrations.length, 0);

  assert.equal(
    componentTree.detachHostInstanceToken(portalHostToken),
    portalHostToken
  );
  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
});

test('private portal child reconciliation diagnostic updates one mounted fake-DOM HostComponent', () => {
  const document = createDocument('private-portal-child-reconciliation');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const portalChild = {
    props: {
      children: 'portal child'
    },
    type: 'span'
  };
  const updatedPortalChild = {
    props: {
      children: 'updated portal child',
      'data-phase': 'updated',
      title: 'updated title'
    },
    type: 'span'
  };
  const replacementPortalChild = {
    props: {
      children: 'replacement portal child'
    },
    type: 'strong'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-boundary',
    portalChildReconciliationIdPrefix: 'portal-child',
    portalCommitIdPrefix: 'portal-commit',
    portalMountIdPrefix: 'portal-mount'
  });
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'portal-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const hiddenMount =
    rootBridge.getPrivateRootPortalFakeDomMountPayload(mount);

  assert.throws(
    () =>
      bridge.createPortalChildReconciliationDiagnostic(mount, boundary, {
        explicitChild: portalChild
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_PORTAL_CHILD_RECONCILIATION_RECORD'
    }
  );
  assert.throws(
    () =>
      bridge.createPortalChildReconciliationDiagnostic(mount, boundary),
    {
      code: 'FAST_REACT_DOM_INVALID_PORTAL_CHILD_RECONCILIATION_RECORD'
    }
  );
  const replacementPortal = reactDom.createPortal(
    replacementPortalChild,
    portalContainer,
    'portal-key'
  );
  const replacementRender = bridge.renderContainer(
    create.handle,
    replacementPortal
  );
  const replacementBoundary =
    bridge.createPortalRootBoundary(replacementRender);
  assert.throws(
    () =>
      bridge.createPortalChildReconciliationDiagnostic(
        mount,
        replacementBoundary,
        {
          explicitChild: replacementPortalChild
        }
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_PORTAL_CHILD_RECONCILIATION_RECORD'
    }
  );

  const updatedPortal = reactDom.createPortal(
    updatedPortalChild,
    portalContainer,
    'portal-key'
  );
  const updateRender = bridge.renderContainer(create.handle, updatedPortal);
  const updateBoundary = bridge.createPortalRootBoundary(updateRender);
  assert.throws(
    () =>
      otherBridge.createPortalChildReconciliationDiagnostic(
        mount,
        updateBoundary,
        {
          explicitChild: updatedPortalChild
        }
      ),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
  hiddenMount.hostComponentNode.attributeLog = [];
  hiddenMount.hostTextNode.writeLog = [];

  const diagnostic = bridge.createPortalChildReconciliationDiagnostic(
    mount,
    updateBoundary,
    {
      explicitChild: updatedPortalChild
    }
  );
  const hiddenDiagnostic =
    rootBridge.getPrivateRootPortalChildReconciliationDiagnosticPayload(
      diagnostic
    );

  assert.equal(
    diagnostic.$$typeof,
    rootBridge.privateRootPortalChildReconciliationDiagnosticRecordType
  );
  assert.equal(
    diagnostic.kind,
    'FastReactDomPrivateRootPortalChildReconciliationDiagnosticRecord'
  );
  assert.equal(diagnostic.operation, 'portal-child-reconciliation-diagnostic');
  assert.equal(diagnostic.diagnosticId, 'portal-child:1');
  assert.equal(
    diagnostic.reconciliationStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_CHILD_RECONCILIATION_ADMITTED
  );
  assert.equal(
    diagnostic.publicMountStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED
  );
  assert.equal(diagnostic.sourceMountDiagnosticId, mount.mountDiagnosticId);
  assert.equal(diagnostic.sourceBoundaryId, updateBoundary.boundaryId);
  assert.equal(diagnostic.sourceUpdateId, updateRender.updateId);
  assert.deepEqual(diagnostic.hostFiberPath, [
    'HostRoot',
    'HostPortal',
    'HostComponent',
    'HostText'
  ]);
  assert.equal(diagnostic.hostComponentType, 'span');
  assert.equal(diagnostic.previousHostText, 'portal child');
  assert.equal(diagnostic.nextHostText, 'updated portal child');
  assert.deepEqual(diagnostic.propertyMutation, {
    handoffKind: domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
    latestPropsCommitRecordKind: domHost.LATEST_PROPS_COMMIT_RECORD,
    latestPropsCommitRecordStatus: 'safe-for-latest-props',
    mutationRecordCount: 3,
    payloadCount: 3,
    status: 'mutated'
  });
  assert.deepEqual(diagnostic.textMutation, {
    newTextLength: 20,
    oldTextLength: 12,
    status: 'mutated'
  });
  assert.equal(diagnostic.latestPropsPublished, true);
  assert.equal(
    diagnostic.latestPropsPublishOrder,
    'after-portal-property-and-text-mutation'
  );
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'portal-accepted-boundary',
      'portal-fake-dom-host-component-update',
      'portal-fake-dom-host-text-update',
      'portal-latest-props-after-mutation'
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      'portal-public-container-mounting',
      'portal-generic-child-reconciliation',
      'portal-container-replacement',
      'portal-prepare-mount-listeners',
      'portal-resource-side-effects',
      'native-execution',
      'reconciler-execution',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(diagnostic.fakeDomCommitApplied, true);
  assert.equal(diagnostic.fakeDomPortalMountDiagnostic, true);
  assert.equal(diagnostic.portalChildReconciliation, true);
  assert.equal(diagnostic.singleHostComponentUpdate, true);
  assert.equal(diagnostic.portalHostComponentUpdated, true);
  assert.equal(diagnostic.portalHostTextUpdated, true);
  assert.equal(diagnostic.portalContainerChildrenReplaced, false);
  assert.equal(diagnostic.portalMounting, false);
  assert.equal(diagnostic.publicPortalMounting, false);
  assert.equal(diagnostic.preparePortalMount, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.domMutation, true);
  assert.equal(diagnostic.publicDomMutation, false);
  assert.equal(diagnostic.listenerInstallation, false);
  assert.equal(diagnostic.resourceSideEffects, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.publicRootRenderCompatibilityClaimed, false);
  assert.equal(
    diagnostic.privatePortalMetadataPromotesPublicRootRender,
    false
  );
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.listenerSideEffects.preparePortalMount, false);
  assert.equal(diagnostic.listenerSideEffects.listenerInstallation, false);
  assert.equal(diagnostic.listenerSideEffects.hasPortalListeningMarker, false);

  assert.equal(
    rootBridge.isPrivateRootPortalChildReconciliationDiagnosticRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPortalChildReconciliationDiagnosticRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPortalChildReconciliationDiagnosticPayload({}),
    null
  );
  assert.equal(hiddenDiagnostic.mountRecord, mount);
  assert.equal(hiddenDiagnostic.boundaryRecord, updateBoundary);
  assert.equal(hiddenDiagnostic.previousChild, portalChild);
  assert.equal(hiddenDiagnostic.nextChild, updatedPortalChild);
  assert.equal(hiddenDiagnostic.previousProps, portalChild.props);
  assert.equal(hiddenDiagnostic.nextProps, updatedPortalChild.props);
  assert.equal(hiddenDiagnostic.hostComponentNode, hiddenMount.hostComponentNode);
  assert.equal(hiddenDiagnostic.hostTextNode, hiddenMount.hostTextNode);
  assert.equal(hiddenDiagnostic.latestPropsBeforeCommit, portalChild.props);
  assert.equal(
    hiddenDiagnostic.latestPropsAfterCommit,
    updatedPortalChild.props
  );
  assert.deepEqual(hiddenDiagnostic.textUpdate, {
    newText: 'updated portal child',
    oldText: 'portal child'
  });

  assert.deepEqual(attributeEntries(hiddenMount.hostComponentNode), [
    ['data-phase', 'updated'],
    ['title', 'updated title']
  ]);
  assert.deepEqual(hiddenMount.hostComponentNode.attributeLog, [
    ['setAttribute', 'data-phase', 'updated'],
    ['setAttribute', 'title', 'updated title']
  ]);
  assert.deepEqual(hiddenMount.hostTextNode.writeLog, [
    ['nodeValue', 'updated portal child']
  ]);
  assert.equal(portalContainer.childNodes.length, 1);
  assert.equal(portalContainer.firstChild, hiddenMount.hostComponentNode);
  assert.equal(portalContainer.textContent, 'updated portal child');
  assert.equal(
    componentTree.getLatestPropsFromNode(hiddenMount.hostComponentNode),
    updatedPortalChild.props
  );
  assert.equal(rootContainer.__mutationLog.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);

  const serialized = JSON.stringify(diagnostic);
  assert.equal(serialized.includes('updated title'), false);
  assert.equal(serialized.includes('__registrations'), false);

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(rootContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(portalContainer.__registrations.length, 0);
});

test('private root bridge ref ordering diagnostic wraps update and unmount canary evidence', () => {
  const document = createDocument('private-ref-ordering');
  const container = createElement('DIV', document);
  const hostNode = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const initialRender = bridge.renderContainer(create.handle, {
    props: {children: 'initial'},
    type: 'div'
  });
  const updateRender = bridge.renderContainer(create.handle, {
    props: {children: 'updated'},
    type: 'div'
  });
  const unmount = bridge.unmountContainer(create.handle);
  const rootOwner = rootBridge.getRootOwnerFromHandle(create.handle);
  const hostOwner = {kind: 'PrivateRootBridgeRefOrderingHost'};
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const calls = [];
  const firstRefHandle = {id: 'first-ref'};
  const secondRefHandle = {id: 'second-ref'};

  function firstCleanup() {
    calls.push('first:cleanup');
  }
  function secondCleanup() {
    calls.push('second:cleanup');
  }
  function firstRef(value) {
    calls.push(`first:attach:${value.localName}`);
    return firstCleanup;
  }
  function secondRef(value) {
    calls.push(`second:attach:${value.localName}`);
    return secondCleanup;
  }

  componentTree.attachHostInstanceNode(hostNode, token, {ref: firstRef});
  const initialAttach = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'initial-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: firstRefHandle,
    ref: firstRef,
    sourceToken: 'commit:first'
  });

  const updatedProps = {ref: secondRef};
  const updateDetach = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'update-current-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: firstRefHandle,
    ref: firstRef,
    expectedLatestRef: secondRef,
    sourceToken: 'deletion:first',
    detachReason: refCallbackGate.REF_DETACH_REASON_REF_CHANGED
  });
  const updateAttach = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'update-finished-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: secondRefHandle,
    ref: secondRef,
    sourceToken: 'commit:second'
  });
  const unmountDetach = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'unmount-current-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: secondRefHandle,
    ref: secondRef,
    sourceToken: 'deletion:second',
    detachReason: refCallbackGate.REF_DETACH_REASON_DELETED
  });
  const initialMetadata = bridge.admitRootCommitRefMetadata(
    initialRender,
    {detach: [], attach: [initialAttach]},
    {label: 'initial-ref-attach'}
  );
  const updateMetadata = bridge.admitRootCommitRefMetadata(
    updateRender,
    {
      detach: [updateDetach],
      attach: [updateAttach]
    },
    {label: 'update-ref-change'}
  );
  const unmountMetadata = bridge.admitRootCommitRefMetadata(
    unmount,
    {detach: [unmountDetach], attach: []},
    {label: 'unmount-ref-cleanup'}
  );

  assert.equal(
    initialMetadata.$$typeof,
    rootBridge.privateRootCommitRefMetadataRecordType
  );
  assert.equal(
    initialMetadata.metadataStatus,
    rootBridge.ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_ACCEPTED
  );
  assert.equal(initialMetadata.hostOutputCanary, 'initial-host-output');
  assert.equal(initialMetadata.attachCount, 1);
  assert.equal(initialMetadata.detachCount, 0);
  assert.equal(initialMetadata.callbackRefsInvoked, false);
  assert.equal(initialMetadata.objectRefsMutated, false);
  assert.equal(initialMetadata.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootCommitRefMetadataRecord(initialMetadata),
    true
  );
  assert.equal(
    rootBridge.getPrivateRootCommitRefMetadataPayload(
      initialMetadata
    ).sourceRecord,
    initialRender
  );
  assert.equal(
    rootBridge.getPrivateRootCommitRefMetadataPayload(
      initialMetadata
    ).rootCommitRefMetadataSnapshot.status,
    refCallbackGate.REF_CALLBACK_ROOT_COMMIT_METADATA_SNAPSHOT_STATUS
  );

  const diagnostic =
    rootBridge.createRefCallbackHostOutputOrderingDiagnosticRecord(
      [create, initialRender, updateRender, unmount],
      {
        steps: [
          {
            hostOutputCanary: 'initial-host-output'
          },
          {
            hostOutputCanary: 'update-host-output',
            latestPropsUpdates: [
              {
                hostInstanceToken: token,
                latestProps: updatedProps
              }
            ]
          },
          {
            hostOutputCanary: 'unmount-host-output'
          }
        ]
      }
    );

  assert.equal(
    rootBridge.isPrivateRootRefCallbackHostOutputOrderingDiagnosticRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_ADMITTED
  );
  assert.equal(diagnostic.updateRenderRequestCount, 1);
  assert.equal(diagnostic.unmountRequestCount, 1);
  assert.equal(diagnostic.updateBeforeUnmount, true);
  assert.equal(
    diagnostic.rootCommitRefMetadataSource,
    'accepted-root-commit-ref-metadata'
  );
  assert.equal(diagnostic.acceptedRootCommitRefMetadataCount, 3);
  assert.equal(diagnostic.refOrderingRecordCount, 4);
  assert.equal(diagnostic.callbackIdentityChangedCount, 1);
  assert.equal(diagnostic.callbackCleanupReturnHandleCount, 2);
  assert.equal(diagnostic.cleanupReturnMatchedCount, 2);
  assert.equal(diagnostic.cleanupInvocationAttemptCount, 2);
  assert.equal(diagnostic.cleanupReturnHandleConsumedCount, 2);
  assert.equal(diagnostic.callbackNullDetachAttemptCount, 0);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.domMutation, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.deepEqual(calls, [
    'first:attach:div',
    'first:cleanup',
    'second:attach:div',
    'second:cleanup'
  ]);
  assert.equal(container.__mutationLog.length, 0);

  const payload =
    rootBridge.getPrivateRootRefCallbackHostOutputOrderingDiagnosticPayload(
      diagnostic
    );
  assert.equal(payload.rootRequestRecords[2], updateRender);
  assert.equal(payload.rootRequestRecords[3], unmount);
  assert.deepEqual(payload.acceptedRootCommitRefMetadataRecords, [
    initialMetadata,
    updateMetadata,
    unmountMetadata
  ]);
  assert.equal(payload.refOrderingSnapshot, diagnostic.refOrderingSnapshot);
  assert.deepEqual(
    diagnostic.refOrderingSnapshot.records.map((record) => [
      record.action,
      record.hostOutputCanary,
      record.callbackIdentityStatus,
      record.cleanupReturnMatchesPreviousAttach,
      record.cleanupReturnHandleMatchesPreviousAttach
    ]),
    [
      ['attach', 'initial-host-output', 'new-active-ref', null, null],
      ['detach', 'update-host-output', 'matches-active-ref', true, true],
      ['attach', 'update-host-output', 'changed-from-detached-ref', null, null],
      ['detach', 'unmount-host-output', 'matches-active-ref', true, true]
    ]
  );

  assert.throws(
    () =>
      rootBridge.createRefCallbackHostOutputOrderingDiagnosticRecord(
        [create, initialRender, unmount],
        {
          steps: [
            {
              hostOutputCanary: 'unmount-host-output',
              rootCommitRefMetadata: {detach: [unmountDetach], attach: []}
            }
          ]
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC'
    }
  );

  assert.equal(componentTree.detachHostInstanceToken(token), token);
  assertBridgeDidNotTouchContainer(container, document);
});

test('private root bridge ref callback error routing records metadata without public root callbacks', () => {
  const document = createDocument('private-ref-error-routing');
  const container = createElement('DIV', document);
  const attachNode = createElement('DIV', document);
  const cleanupNode = createElement('SPAN', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const publicRootErrorCalls = [];
  function onUncaughtError(error) {
    publicRootErrorCalls.push(['uncaught', error.message]);
  }
  function onCaughtError(error) {
    publicRootErrorCalls.push(['caught', error.message]);
  }
  function onRecoverableError(error) {
    publicRootErrorCalls.push(['recoverable', error.message]);
  }

  const create = bridge.createClientRoot(container, {
    onCaughtError,
    onRecoverableError,
    onUncaughtError
  });
  const render = bridge.renderContainer(create.handle, {
    props: {children: 'private error route'},
    type: 'div'
  });
  const unmount = bridge.unmountContainer(create.handle);
  const rootOwner = rootBridge.getRootOwnerFromHandle(create.handle);
  const attachHostOwner = {kind: 'PrivateRootBridgeRefErrorAttachHost'};
  const cleanupHostOwner = {kind: 'PrivateRootBridgeRefErrorCleanupHost'};
  const attachToken = componentTree.createHostInstanceToken(
    attachHostOwner,
    rootOwner
  );
  const cleanupToken = componentTree.createHostInstanceToken(
    cleanupHostOwner,
    rootOwner
  );
  const attachError = new Error('bridge attach route error');
  attachError.code = 'BRIDGE_ATTACH_ROUTE';
  const cleanupError = new TypeError('bridge cleanup route error');

  function throwingAttachRef() {
    throw attachError;
  }

  function cleanupRef() {}

  function throwingCleanup() {
    throw cleanupError;
  }

  componentTree.attachHostInstanceNode(attachNode, attachToken, {
    ref: throwingAttachRef
  });
  componentTree.attachHostInstanceNode(cleanupNode, cleanupToken, {
    ref: cleanupRef
  });

  const attachMetadata = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner: attachHostOwner,
    hostInstanceToken: attachToken,
    fiber: {id: 'bridge-attach-error-fiber'},
    stateNode: {id: 'bridge-attach-state-node'},
    refHandle: {id: 'bridge-throwing-attach-ref'},
    ref: throwingAttachRef,
    sourceToken: 'commit:bridge-attach-error'
  });
  const cleanupMetadata = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner: cleanupHostOwner,
    hostInstanceToken: cleanupToken,
    fiber: {id: 'bridge-cleanup-error-fiber'},
    stateNode: {id: 'bridge-cleanup-state-node'},
    refHandle: {id: 'bridge-cleanup-ref'},
    ref: cleanupRef,
    refCleanup: throwingCleanup,
    sourceToken: 'deletion:bridge-cleanup-error',
    detachReason: refCallbackGate.REF_DETACH_REASON_DELETED
  });
  const renderMetadata = bridge.admitRootCommitRefMetadata(
    render,
    {detach: [], attach: [attachMetadata]},
    {label: 'bridge-attach-error'}
  );
  const unmountMetadata = bridge.admitRootCommitRefMetadata(
    unmount,
    {detach: [cleanupMetadata], attach: []},
    {label: 'bridge-cleanup-error'}
  );

  const routing = bridge.createRefCallbackRootErrorRouting(
    [create, render, unmount],
    {
      steps: [
        {label: 'bridge-attach-error-route'},
        {label: 'bridge-cleanup-error-route'}
      ]
    }
  );

  assert.equal(
    rootBridge.isPrivateRootRefCallbackErrorRoutingRecord(routing),
    true
  );
  assert.equal(
    routing.$$typeof,
    rootBridge.privateRootRefCallbackErrorRoutingRecordType
  );
  assert.equal(
    routing.routingStatus,
    rootBridge.ROOT_BRIDGE_REF_CALLBACK_ERROR_ROUTING_RECORDED
  );
  assert.equal(
    routing.rootCommitRefMetadataSource,
    'accepted-root-commit-ref-metadata'
  );
  assert.equal(routing.acceptedRootCommitRefMetadataCount, 2);
  assert.equal(routing.rootErrorRoutingRecordCount, 2);
  assert.equal(routing.callbackAttachErrorCount, 1);
  assert.equal(routing.cleanupReturnErrorCount, 1);
  assert.equal(routing.rootErrorChannel, 'onUncaughtError');
  assert.equal(routing.onUncaughtErrorConfigured, true);
  assert.equal(routing.onCaughtErrorConfigured, true);
  assert.equal(routing.onRecoverableErrorConfigured, true);
  assert.equal(routing.rootErrorUpdatesScheduled, false);
  assert.equal(routing.publicRootErrorCallbacksInvoked, false);
  assert.equal(routing.rootErrorCallbackInvocationCount, 0);
  assert.equal(routing.rootErrorsReported, false);
  assert.equal(routing.publicRootExecution, false);
  assert.equal(routing.reconcilerExecution, false);
  assert.equal(routing.compatibilityClaimed, false);
  assert.deepEqual(publicRootErrorCalls, []);
  assert.deepEqual(
    routing.rootErrorRoutingSnapshot.records.map((record) => [
      record.sourceStepLabel,
      record.sourceHostOutputCanary,
      record.errorName,
      record.errorMessage,
      record.errorCode,
      record.publicRootErrorCallbackInvoked
    ]),
    [
      [
        'bridge-attach-error-route',
        'initial-host-output',
        'Error',
        'bridge attach route error',
        'BRIDGE_ATTACH_ROUTE',
        false
      ],
      [
        'bridge-cleanup-error-route',
        'unmount-host-output',
        'TypeError',
        'bridge cleanup route error',
        null,
        false
      ]
    ]
  );

  const payload =
    rootBridge.getPrivateRootRefCallbackErrorRoutingPayload(routing);
  assert.deepEqual(payload.acceptedRootCommitRefMetadataRecords, [
    renderMetadata,
    unmountMetadata
  ]);
  assert.equal(payload.rootOptions.onUncaughtError, onUncaughtError);
  assert.equal(payload.rootOptions.onCaughtError, onCaughtError);
  assert.equal(payload.rootOptions.onRecoverableError, onRecoverableError);
  assert.equal(
    payload.rootErrorRoutingPayload.records[0].error,
    attachError
  );
  assert.equal(
    payload.rootErrorRoutingPayload.records[1].error,
    cleanupError
  );
  assert.equal(Object.hasOwn(routing, 'error'), false);
  assert.equal(Object.hasOwn(routing, 'ref'), false);

  assert.equal(componentTree.detachHostInstanceToken(attachToken), attachToken);
  assert.equal(
    componentTree.detachHostInstanceToken(cleanupToken),
    cleanupToken
  );
  assertBridgeDidNotTouchContainer(container, document);
});

test('private root bridge event listener error routing records root option metadata without public root callbacks', () => {
  const document = createDocument('private-event-error-routing');
  const container = createElement('DIV', document);
  const publicRootErrorCalls = [];
  const listenerCalls = [];
  const thrown = new Error('bridge event listener route error');
  thrown.code = 'BRIDGE_EVENT_LISTENER_ROUTE';
  function onUncaughtError(error) {
    publicRootErrorCalls.push(['uncaught', error.message]);
  }
  function onCaughtError(error) {
    publicRootErrorCalls.push(['caught', error.message]);
  }
  function onRecoverableError(error) {
    publicRootErrorCalls.push(['recoverable', error.message]);
  }
  function onClickCapture() {
    listenerCalls.push('capture');
    throw thrown;
  }
  function onClick() {
    listenerCalls.push('bubble');
  }

  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'event-error-routing-admission',
    initialHostOutputIdPrefix: 'event-error-routing-output',
    sideEffectIdPrefix: 'event-error-routing-side-effect'
  });
  const create = bridge.createClientRoot(container, {
    onCaughtError,
    onRecoverableError,
    onUncaughtError
  });
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, {
    props: {
      children: 'private event listener route',
      onClick,
      onClickCapture
    },
    type: 'button'
  });
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);
  const clickRecord =
    rootListeners.invokePrivateRootHostOutputClickDispatchCanary(
      sideEffects.listenerRegistration,
      hostOutputPayload,
      {
        enableListenerErrorRoutingDiagnostics: true
      }
    );

  const routing = bridge.createEventListenerRootErrorRouting(
    [create, render],
    clickRecord,
    {
      routeLabels: ['bridge-event-listener-error-route']
    }
  );

  assert.equal(
    rootBridge.isPrivateRootEventListenerErrorRoutingRecord(routing),
    true
  );
  assert.equal(
    routing.$$typeof,
    rootBridge.privateRootEventListenerErrorRoutingRecordType
  );
  assert.equal(
    routing.routingStatus,
    rootBridge.ROOT_BRIDGE_EVENT_LISTENER_ERROR_ROUTING_RECORDED
  );
  assert.equal(
    routing.rootErrorOptionCallbackRecordStatus,
    rootBridge.ROOT_BRIDGE_ROOT_ERROR_OPTION_CALLBACK_ACCEPTED
  );
  assert.equal(routing.sourceEventRecordKind, clickRecord.kind);
  assert.equal(
    routing.eventErrorRouteSource,
    'private-root-host-output-click-dispatch-canary'
  );
  assert.equal(routing.rootErrorChannel, 'event-listener-reportGlobalError');
  assert.equal(routing.listenerErrorCount, 1);
  assert.equal(routing.listenerErrorRouteCount, 1);
  assert.equal(routing.rootErrorOptionCallbackRecordCount, 1);
  assert.equal(routing.onUncaughtErrorConfigured, true);
  assert.equal(routing.onCaughtErrorConfigured, true);
  assert.equal(routing.onRecoverableErrorConfigured, true);
  assert.equal(routing.rootErrorUpdatesScheduled, false);
  assert.equal(routing.publicRootErrorCallbacksInvoked, false);
  assert.equal(routing.rootErrorCallbackInvocationCount, 0);
  assert.equal(routing.reportGlobalErrorInvoked, false);
  assert.equal(routing.eventListenerErrorsReported, false);
  assert.equal(routing.rootErrorsReported, false);
  assert.equal(routing.publicRootExecution, false);
  assert.equal(routing.eventDispatch, false);
  assert.equal(routing.publicDispatchEnabled, false);
  assert.equal(routing.compatibilityClaimed, false);
  assert.equal(routing.exposesErrorValue, false);
  assert.deepEqual(publicRootErrorCalls, []);
  assert.deepEqual(listenerCalls, ['capture', 'bubble']);

  const [callbackRecord] = routing.rootErrorOptionCallbackRecords;
  assert.equal(
    callbackRecord.kind,
    'FastReactDomPrivateRootEventListenerErrorOptionCallbackRecord'
  );
  assert.equal(
    callbackRecord.status,
    rootBridge.ROOT_BRIDGE_ROOT_ERROR_OPTION_CALLBACK_ACCEPTED
  );
  assert.equal(callbackRecord.acceptedRootOptionCallbackRecord, true);
  assert.equal(callbackRecord.phase, 'event-listener');
  assert.equal(callbackRecord.sourceErrorRouteTarget, 'reportGlobalError');
  assert.equal(callbackRecord.sourceLabel, 'bridge-event-listener-error-route');
  assert.equal(callbackRecord.registrationName, 'onClickCapture');
  assert.equal(callbackRecord.listenerPhase, 'capture');
  assert.equal(callbackRecord.errorName, 'Error');
  assert.equal(callbackRecord.errorMessage, 'bridge event listener route error');
  assert.equal(callbackRecord.errorCode, 'BRIDGE_EVENT_LISTENER_ROUTE');
  assert.equal(callbackRecord.errorReported, false);
  assert.equal(callbackRecord.reportGlobalErrorInvoked, false);
  assert.equal(callbackRecord.rootErrorCallbacksInvoked, false);
  assert.equal(callbackRecord.publicRootErrorCallbacksInvoked, false);
  assert.equal(callbackRecord.rootErrorCallbackInvocationCount, 0);
  assert.equal(callbackRecord.exposesErrorValue, false);
  assert.equal(Object.hasOwn(callbackRecord, 'error'), false);

  const payload =
    rootBridge.getPrivateRootEventListenerErrorRoutingPayload(routing);
  assert.equal(payload.rootOptions.onUncaughtError, onUncaughtError);
  assert.equal(payload.rootOptions.onCaughtError, onCaughtError);
  assert.equal(payload.rootOptions.onRecoverableError, onRecoverableError);
  assert.equal(
    payload.listenerErrorRoutes[0],
    clickRecord.listenerErrorRoutes[0]
  );
  assert.equal(payload.listenerErrorRoutePayloads[0].error, thrown);
  assert.equal(payload.rootErrorOptionCallbackRecords[0], callbackRecord);
  assert.equal(Object.hasOwn(routing, 'error'), false);
  assert.equal(Object.hasOwn(routing, 'listener'), false);

  bridge.cleanupInitialRenderHostOutput(handoff);
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private click delegation dispatch gate routes one accepted listener record without public DOM compatibility', () => {
  const document = createDocument('private-click-delegation-gate');
  const root = createElement('DIV', document);
  const parent = createElement('DIV', document);
  const child = createElement('BUTTON', document);
  root.appendChild(parent);
  parent.appendChild(child);
  const rootOwner = {kind: 'PrivateClickDelegationRootOwner'};
  const parentHostOwner = {kind: 'PrivateClickDelegationParentHostOwner'};
  const childHostOwner = {kind: 'PrivateClickDelegationChildHostOwner'};
  const parentToken = componentTree.createHostInstanceToken(
    parentHostOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childHostOwner,
    rootOwner
  );
  const calls = [];

  componentTree.attachHostInstanceNode(parent, parentToken, {});
  componentTree.attachHostInstanceNode(child, childToken, {});
  const childQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      child,
      'click',
      false,
      (event) => {
        calls.push({
          currentTarget: event.currentTarget,
          target: event.target,
          targetInst: event.targetInst
        });
      }
    );
  const parentQueue =
    listenerRegistry.registerPrivateEventListenerQueueEntry(
      parent,
      'click',
      false,
      () => {
        calls.push('parent');
      }
    );
  const wrapperRecord =
    eventListener.createEventListenerWrapperRecordWithPriority(
      root,
      'click',
      0
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapperRecord,
      {
        target: child,
        type: 'click'
      }
    );

  const gate =
    pluginEventSystem.createPrivateClickEventDelegationDispatchGate(
      dispatchRecord,
      childQueue
    );

  assert.equal(
    pluginEventSystem.isPrivateClickEventDelegationDispatchGateRecord(gate),
    true
  );
  assert.equal(
    gate.kind,
    pluginEventSystem.PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_RECORD_KIND
  );
  assert.equal(
    gate.status,
    pluginEventSystem.PRIVATE_CLICK_EVENT_DELEGATION_DISPATCH_GATE_STATUS
  );
  assert.equal(gate.listenerInvocationCount, 1);
  assert.equal(gate.listenerQueueIndex, childQueue.listenerQueueIndex);
  assert.equal(gate.publicDispatchEnabled, false);
  assert.equal(gate.browserDomEventCompatibilityClaimed, false);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.syntheticEventCount, 0);
  assert.deepEqual(calls, [
    {
      currentTarget: child,
      target: child,
      targetInst: childToken
    }
  ]);

  listenerRegistry.removePrivateEventListenerQueueEntry(parentQueue);
  listenerRegistry.removePrivateEventListenerQueueEntry(childQueue);
  assert.equal(componentTree.detachHostInstanceToken(childToken), childToken);
  assert.equal(componentTree.detachHostInstanceToken(parentToken), parentToken);
});

test('private portal event listener error routing links owner-root metadata without public portal compatibility', () => {
  const document = createDocument('private-portal-event-error-routing');
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('SECTION', document);
  const publicRootErrorCalls = [];
  const listenerCalls = [];
  const thrown = new Error('bridge portal event listener route error');
  thrown.code = 'BRIDGE_PORTAL_EVENT_LISTENER_ROUTE';
  function onUncaughtError(error) {
    publicRootErrorCalls.push(['uncaught', error.message]);
  }
  function onCaughtError(error) {
    publicRootErrorCalls.push(['caught', error.message]);
  }
  function onRecoverableError(error) {
    publicRootErrorCalls.push(['recoverable', error.message]);
  }
  function onClickCapture() {
    listenerCalls.push('capture');
    throw thrown;
  }
  function onClick() {
    listenerCalls.push('bubble');
  }

  const portalChild = {
    props: {
      children: 'portal event listener route',
      onClick,
      onClickCapture
    },
    type: 'button'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: 'portal-error-boundary',
    portalCommitIdPrefix: 'portal-error-commit',
    portalEventOwnerRootIdPrefix: 'portal-error-owner',
    portalMountIdPrefix: 'portal-error-mount',
    sideEffectIdPrefix: 'portal-error-side-effect'
  });
  const create = bridge.createClientRoot(rootContainer, {
    onCaughtError,
    onRecoverableError,
    onUncaughtError
  });
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    'portal-error-key'
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const ownerGate = bridge.createPortalEventOwnerRootGate(mount);
  const ownerGatePayload =
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload(ownerGate);
  const portalTargetPayload = {
    hostNode: ownerGatePayload.hostComponentNode,
    hostToken: ownerGatePayload.hostInstanceToken,
    rootOwner: create.owner
  };
  const clickRecord =
    rootListeners.invokePrivateRootHostOutputClickDispatchCanary(
      sideEffects.listenerRegistration,
      portalTargetPayload,
      {
        enableListenerErrorRoutingDiagnostics: true
      }
    );

  const routing = bridge.createEventListenerRootErrorRouting(
    [create, render],
    clickRecord,
    {
      portalEventOwnerRootGateRecord: ownerGate,
      routeLabels: ['bridge-portal-event-listener-error-route']
    }
  );

  assert.equal(clickRecord.listenerErrorRouteCount, 1);
  assert.equal(clickRecord.targetInst, ownerGatePayload.hostInstanceToken);
  assert.equal(
    clickRecord.listenerErrorRoutes[0].targetInst,
    ownerGatePayload.hostInstanceToken
  );
  assert.equal(routing.portalEventErrorRoutingDiagnostic, true);
  assert.equal(routing.portalEventOwnerRootGateLinked, true);
  assert.equal(routing.portalEventOwnerRootGateId, ownerGate.gateId);
  assert.equal(
    routing.portalEventOwnerRootGateStatus,
    rootBridge.ROOT_BRIDGE_PORTAL_EVENT_OWNER_ROOT_RECORDED
  );
  assert.equal(routing.portalEventOwnerRootGateKind, ownerGate.kind);
  assert.equal(routing.portalEventOwnerRootMatchesTargetRoot, true);
  assert.equal(routing.portalEventTargetDispatchPathLength, 1);
  assert.equal(routing.portalContainerContainsEventTarget, true);
  assert.equal(routing.rootContainerContainsEventTarget, false);
  assert.equal(routing.portalEventBubbling, false);
  assert.equal(routing.publicPortalBubbling, false);
  assert.equal(routing.publicPortalBubblingBlocked, true);
  assert.equal(routing.portalEventDispatch, false);
  assert.equal(routing.publicDispatchBlocked, true);
  assert.equal(routing.portalListenerInstallation, false);
  assert.equal(routing.eventDispatch, false);
  assert.equal(routing.publicDispatchEnabled, false);
  assert.equal(routing.reportGlobalErrorInvoked, false);
  assert.equal(routing.publicRootErrorCallbacksInvoked, false);
  assert.equal(routing.rootErrorCallbackInvocationCount, 0);
  assert.equal(routing.compatibilityClaimed, false);
  assert.deepEqual(
    routing.acceptedCapabilities.map((capability) => capability.id),
    [
      'private-listener-error-route',
      'root-error-option-callback-metadata',
      'portal-owner-root-event-path-metadata',
      'portal-listener-error-route-correlation'
    ]
  );
  assert.deepEqual(
    routing.blockedCapabilities
      .slice(-3)
      .map((capability) => capability.id),
    [
      'public-portal-event-bubbling',
      'portal-container-listener-dispatch',
      'portal-synthetic-event-dispatch'
    ]
  );

  const [callbackRecord] = routing.rootErrorOptionCallbackRecords;
  assert.equal(callbackRecord.sourceErrorRouteTarget, 'reportGlobalError');
  assert.equal(
    callbackRecord.sourceLabel,
    'bridge-portal-event-listener-error-route'
  );
  assert.equal(callbackRecord.registrationName, 'onClickCapture');
  assert.equal(callbackRecord.portalEventErrorRoutingDiagnostic, true);
  assert.equal(callbackRecord.portalEventOwnerRootGateId, ownerGate.gateId);
  assert.equal(callbackRecord.portalEventOwnerRootMatchesTargetRoot, true);
  assert.equal(callbackRecord.portalEventTargetDispatchPathLength, 1);
  assert.equal(callbackRecord.portalContainerContainsEventTarget, true);
  assert.equal(callbackRecord.rootContainerContainsEventTarget, false);
  assert.equal(callbackRecord.portalEventBubbling, false);
  assert.equal(callbackRecord.publicPortalBubbling, false);
  assert.equal(callbackRecord.publicPortalBubblingBlocked, true);
  assert.equal(callbackRecord.portalEventDispatch, false);
  assert.equal(callbackRecord.publicDispatchBlocked, true);
  assert.equal(callbackRecord.errorMessage, thrown.message);
  assert.equal(callbackRecord.errorCode, 'BRIDGE_PORTAL_EVENT_LISTENER_ROUTE');
  assert.equal(callbackRecord.reportGlobalErrorInvoked, false);
  assert.equal(callbackRecord.publicRootErrorCallbacksInvoked, false);

  const payload =
    rootBridge.getPrivateRootEventListenerErrorRoutingPayload(routing);
  assert.equal(payload.portalEventOwnerRootGateRecord, ownerGate);
  assert.equal(
    payload.portalEventOwnerRootPluginGateRecord,
    ownerGatePayload.eventOwnerRootGateRecord
  );
  assert.equal(
    payload.portalEventOwnerRootPluginGatePayload.targetNode,
    ownerGatePayload.hostComponentNode
  );
  assert.equal(payload.listenerErrorRoutePayloads[0].error, thrown);
  assert.deepEqual(publicRootErrorCalls, []);
  assert.deepEqual(listenerCalls, ['capture', 'bubble']);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);

  bridge.revertCreateRootSideEffects(sideEffects);
});
