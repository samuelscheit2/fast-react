'use strict';

const {
  assert,
  test,
  reactDom,
  reactDomClient,
  rootBridge,
  componentTree,
  refCallbackGate,
  domHost,
  rootMarkers,
  listenerRegistry,
  createDocument,
  createElement,
  createTextNode,
  attributeEntries,
  assertPublicCreateRootMinimalHostOutput
} = require('./context.js');

test('private root unmount host-output cleanup clears fake DOM and metadata', () => {
  const document = createDocument('private-unmount-host-output');
  const container = createElement('DIV', document);
  const hostChild = createElement('SECTION', document);
  const textChild = createTextNode('committed text', document);
  const hostOwner = {kind: 'HostComponentOwner'};
  const textOwner = {kind: 'HostTextOwner'};
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'unmount-admission',
    sideEffectIdPrefix: 'unmount-side-effects',
    unmountAdmissionIdPrefix: 'unmount-admission-meta',
    unmountCleanupIdPrefix: 'unmount-cleanup'
  });
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, {
    props: {
      children: 'committed text'
    },
    type: 'section'
  });
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const hostToken = componentTree.createHostInstanceToken(
    hostOwner,
    create.owner
  );
  const textToken = componentTree.createHostInstanceToken(
    textOwner,
    create.owner
  );

  container.appendChild(hostChild);
  hostChild.appendChild(textChild);
  container.__mutationLog.length = 0;
  hostChild.__mutationLog.length = 0;
  componentTree.attachHostInstanceNode(hostChild, hostToken, {
    id: 'host-child'
  });
  componentTree.attachHostInstanceNode(textChild, textToken, null);

  assert.equal(container.childNodes.length, 1);
  assert.equal(componentTree.getHostInstanceTokenFromNode(hostChild), hostToken);
  assert.equal(componentTree.getHostInstanceTokenFromNode(textChild), textToken);
  assert.equal(rootMarkers.getContainerRoot(container), create.owner);
  assert.equal(listenerRegistry.hasListeningMarker(container), true);

  const unmount = bridge.unmountContainer(create.handle);
  const cleanup = bridge.cleanupUnmountHostOutput(admission, unmount);
  const hiddenCleanup =
    rootBridge.getPrivateRootUnmountHostOutputCleanupPayload(cleanup);
  const unmountAdmission = cleanup.unmountAdmission;
  const hiddenUnmountAdmission =
    rootBridge.getPrivateRootUnmountAdmissionPayload(unmountAdmission);

  assert.equal(
    rootBridge.cleanupPrivateRootUnmountHostOutput(admission, unmount),
    cleanup
  );
  assert.equal(bridge.cleanupUnmountHostOutput(admission, unmount), cleanup);
  assert.equal(Object.isFrozen(cleanup), true);
  assert.equal(
    cleanup.$$typeof,
    rootBridge.privateRootUnmountHostOutputCleanupRecordType
  );
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED
  );
  assert.equal(cleanup.cleanupId, 'unmount-cleanup:1');
  assert.equal(cleanup.sourceAdmissionId, 'unmount-admission:1');
  assert.equal(cleanup.sourceUnmountRequestId, unmount.requestId);
  assert.equal(
    cleanup.unmountAdmissionStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_ADMITTED
  );
  assert.equal(cleanup.unmountAdmissionId, 'unmount-admission-meta:1');
  assert.equal(
    unmountAdmission.$$typeof,
    rootBridge.privateRootUnmountAdmissionRecordType
  );
  assert.equal(
    unmountAdmission.admissionStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_ADMITTED
  );
  assert.equal(
    rootBridge.isPrivateRootUnmountAdmissionRecord(unmountAdmission),
    true
  );
  assert.equal(hiddenUnmountAdmission.container, container);
  assert.equal(hiddenUnmountAdmission.unmountRecord, unmount);
  assert.equal(
    unmountAdmission.rootOwnership.rootHandleMatchesCreateRecord,
    true
  );
  assert.equal(
    unmountAdmission.rootOwnership.currentAdmissionMatchesRootHandle,
    true
  );
  assert.equal(
    unmountAdmission.rootOwnership.portalContainerUsage.portalContainer,
    false
  );
  assert.equal(cleanup.sideEffectId, sideEffects.sideEffectId);
  assert.deepEqual(cleanup.fakeDomCleanup, {
    clearContainerStatus: 'cleared',
    containerCleanupMetadataStatus:
      domHost.ROOT_UNMOUNT_CONTAINER_CLEANUP_METADATA_STATUS,
    componentTreeDetachStatus: 'detached-host-instance-subtree',
    removedRootChildCount: 1,
    detachedHostInstanceCount: 2,
    detachRecordCount: 1
  });
  assert.equal(cleanup.clearContainerRecord.removedChildCount, 1);
  assert.equal(
    cleanup.clearContainerRecord.containerCleanupMetadata.kind,
    domHost.ROOT_UNMOUNT_CONTAINER_CLEANUP_METADATA
  );
  assert.equal(
    cleanup.containerCleanupMetadata.status,
    domHost.ROOT_UNMOUNT_CONTAINER_CLEANUP_METADATA_STATUS
  );
  assert.equal(cleanup.containerCleanupMetadata.removedChildRecordCount, 1);
  assert.equal(cleanup.containerCleanupMetadata.portalContainerCleanup, false);
  assert.equal(
    cleanup.deletionCleanupMetadata.status,
    'accepted-private-root-deletion-cleanup-metadata'
  );
  assert.equal(
    cleanup.deletionCleanupMetadata.detachRecordsMatchRemovedChildren,
    true
  );
  assert.equal(cleanup.componentTreeDetachRecords.length, 1);
  assert.equal(
    cleanup.componentTreeDetachRecords[0].detachedHostInstanceCount,
    2
  );
  assert.equal(
    cleanup.sideEffectCleanup.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.deepEqual(
    cleanup.acceptedCapabilities.map((capability) => capability.id),
    [
      'root-unmount-admission-metadata',
      'fake-dom-clear-container',
      'fake-dom-container-cleanup-metadata',
      'deletion-cleanup-metadata',
      'component-tree-metadata-detach',
      'root-marker-listener-revert'
    ]
  );
  assert.deepEqual(
    cleanup.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-unmount',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(cleanup.fakeDomMutation, true);
  assert.equal(cleanup.rootContainerChildrenCleared, true);
  assert.equal(cleanup.componentTreeMetadataDetached, true);
  assert.equal(cleanup.rootMarkerReverted, true);
  assert.equal(cleanup.rootListenersReverted, true);
  assert.equal(cleanup.publicRootUnmounted, false);
  assert.equal(cleanup.publicRootBehaviorChanged, false);
  assert.equal(cleanup.nativeExecution, false);
  assert.equal(cleanup.reconcilerExecution, false);
  assert.equal(cleanup.domMutation, true);
  assert.equal(cleanup.markerWrites, false);
  assert.equal(cleanup.listenerInstallation, false);
  assert.equal(cleanup.compatibilityClaimed, false);

  assert.equal(hiddenCleanup.admissionRecord, admission);
  assert.equal(hiddenCleanup.unmountRecord, unmount);
  assert.equal(hiddenCleanup.container, container);
  assert.equal(hiddenCleanup.clearContainerPayload.removedChildren[0], hostChild);
  assert.equal(hiddenCleanup.componentTreeDetachRecords.length, 1);
  assert.equal(hiddenCleanup.unmountAdmission, unmountAdmission);
  assert.equal(
    rootBridge.isPrivateRootUnmountHostOutputCleanupRecord(cleanup),
    true
  );
  assert.equal(rootBridge.isPrivateRootUnmountAdmissionRecord({}), false);
  assert.equal(rootBridge.getPrivateRootUnmountAdmissionPayload({}), null);
  assert.equal(
    rootBridge.getPrivateRootUnmountHostOutputCleanupPayload({}),
    null
  );

  assert.deepEqual(container.childNodes, []);
  assert.equal(hostChild.parentNode, null);
  assert.equal(textChild.parentNode, hostChild);
  assert.equal(componentTree.getHostInstanceTokenFromNode(hostChild), null);
  assert.equal(componentTree.getHostInstanceTokenFromNode(textChild), null);
  assert.equal(componentTree.getLatestPropsFromNode(hostChild), null);
  assert.equal(componentTree.getLatestPropsFromHostInstanceToken(hostToken), null);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.deepEqual(container.__mutationLog, [
    {
      child: hostChild,
      type: 'removeChild'
    }
  ]);
  assert.equal(hostChild.__mutationLog.length, 0);

  assert.throws(() => bridge.cleanupUnmountHostOutput({}, unmount), {
    code: 'FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD'
  });
  assert.throws(
    () => otherBridge.cleanupUnmountHostOutput(admission, unmount),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
});

test('private root unmount host-output cleanup accepts current host-output update', () => {
  const document = createDocument('private-unmount-host-output-update');
  const container = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: 'unmount-current-update',
    initialHostOutputIdPrefix: 'unmount-current-initial',
    unmountCleanupIdPrefix: 'unmount-current-cleanup'
  });
  const initialElement = {
    props: {
      children: 'initial text',
      className: 'root-card',
      id: 'message'
    },
    type: 'section'
  };
  const updatedElement = {
    props: {
      children: 'updated text',
      className: 'root-card updated',
      id: 'message'
    },
    type: 'section'
  };

  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, initialElement);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const initialHandoff = bridge.applyInitialRenderHostOutput(admission);
  const initialPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(initialHandoff);
  const update = bridge.renderContainer(create.handle, updatedElement);
  const updateHandoff = bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: initialPayload.hostToken,
    nextProps: updatedElement.props,
    tag: 'section',
    textUpdate: {
      newText: 'updated text',
      oldText: 'initial text',
      textInstance: initialPayload.textNode
    }
  });

  assert.equal(
    updateHandoff.updateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(initialPayload.hostNode.textContent, 'updated text');
  assert.deepEqual(attributeEntries(initialPayload.hostNode), [
    ['class', 'root-card updated'],
    ['id', 'message']
  ]);

  const unmount = bridge.unmountContainer(create.handle);
  const cleanup = bridge.cleanupUnmountHostOutput(admission, unmount);
  const hiddenCleanup =
    rootBridge.getPrivateRootUnmountHostOutputCleanupPayload(cleanup);

  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED
  );
  assert.equal(cleanup.cleanupId, 'unmount-current-cleanup:1');
  assert.equal(cleanup.sourceAdmissionId, admission.admissionId);
  assert.equal(cleanup.sourceRenderRequestId, admission.renderRequestId);
  assert.equal(cleanup.sourceUnmountRequestId, unmount.requestId);
  assert.equal(
    cleanup.unmountAdmission.rootOwnership.currentAdmissionMatchesRootHandle,
    true
  );
  assert.equal(hiddenCleanup.admissionRecord, admission);
  assert.equal(hiddenCleanup.unmountRecord, unmount);
  assert.equal(container.childNodes.length, 0);
  assert.equal(
    componentTree.getLatestPropsFromNode(initialPayload.hostNode),
    null
  );
  assert.equal(
    componentTree.getMountedHostInstanceTokenFromNode(initialPayload.hostNode),
    null
  );
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);

  const staleDocument =
    createDocument('private-unmount-host-output-update-stale');
  const staleContainer = createElement('DIV', staleDocument);
  const staleBridge = rootBridge.createPrivateRootBridgeShell();
  const staleCreate = staleBridge.createClientRoot(staleContainer);
  const staleSideEffects =
    staleBridge.applyCreateRootSideEffects(staleCreate);
  const staleRender =
    staleBridge.renderContainer(staleCreate.handle, initialElement);
  const staleAdmission = staleBridge.admitCreateRenderPath(
    staleCreate,
    staleSideEffects,
    staleRender
  );
  const staleInitialHandoff =
    staleBridge.applyInitialRenderHostOutput(staleAdmission);
  const staleInitialPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      staleInitialHandoff
    );
  const staleUpdatedRender =
    staleBridge.renderContainer(staleCreate.handle, updatedElement);
  staleBridge.applyHostOutputUpdate(staleUpdatedRender, {
    hostInstanceToken: staleInitialPayload.hostToken,
    nextProps: updatedElement.props,
    tag: 'section',
    textUpdate: {
      newText: 'updated text',
      oldText: 'initial text',
      textInstance: staleInitialPayload.textNode
    }
  });
  staleBridge.renderContainer(staleCreate.handle, {
    props: {
      children: 'unapplied text',
      className: 'root-card stale',
      id: 'message'
    },
    type: 'section'
  });
  const staleUnmount = staleBridge.unmountContainer(staleCreate.handle);

  assert.throws(
    () => staleBridge.cleanupUnmountHostOutput(staleAdmission, staleUnmount),
    {
      code: 'FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD',
      message: /stale root handle admission metadata/
    }
  );
  assert.equal(staleContainer.childNodes.length, 1);
  staleBridge.revertCreateRootSideEffects(staleSideEffects);
});

test('private root unmount admission rejects stale roots and portal containers', () => {
  const document = createDocument('private-unmount-admission-rejections');
  const staleContainer = createElement('DIV', document);
  const staleBridge = rootBridge.createPrivateRootBridgeShell();
  const staleCreate = staleBridge.createClientRoot(staleContainer);
  const staleSideEffects =
    staleBridge.applyCreateRootSideEffects(staleCreate);
  const firstRender = staleBridge.renderContainer(staleCreate.handle, {
    props: {children: 'first'},
    type: 'section'
  });
  const firstAdmission = staleBridge.admitCreateRenderPath(
    staleCreate,
    staleSideEffects,
    firstRender
  );
  const secondRender = staleBridge.renderContainer(staleCreate.handle, {
    props: {children: 'second'},
    type: 'section'
  });
  const secondAdmission = staleBridge.admitCreateRenderPath(
    staleCreate,
    staleSideEffects,
    secondRender
  );
  const staleChild = createElement('SECTION', document);
  staleContainer.appendChild(staleChild);
  staleContainer.__mutationLog.length = 0;

  const staleUnmount = staleBridge.unmountContainer(staleCreate.handle);
  assert.throws(
    () => staleBridge.cleanupUnmountHostOutput(firstAdmission, staleUnmount),
    {
      code: 'FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD',
      message: /stale root handle admission metadata/
    }
  );
  assert.deepEqual(staleContainer.childNodes, [staleChild]);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(staleContainer), true);
  assert.equal(listenerRegistry.hasListeningMarker(staleContainer), true);

  const staleCleanup = staleBridge.cleanupUnmountHostOutput(
    secondAdmission,
    staleUnmount
  );
  assert.equal(staleCleanup.unmountAdmission.staleRootHandleRejected, true);
  assert.deepEqual(staleContainer.childNodes, []);

  const noOpContainer = createElement('DIV', document);
  const noOpBridge = rootBridge.createPrivateRootBridgeShell();
  const noOpCreate = noOpBridge.createClientRoot(noOpContainer);
  const noOpSideEffects = noOpBridge.applyCreateRootSideEffects(noOpCreate);
  const noOpRender = noOpBridge.renderContainer(noOpCreate.handle, {
    props: {children: 'no-op'},
    type: 'article'
  });
  const noOpAdmission = noOpBridge.admitCreateRenderPath(
    noOpCreate,
    noOpSideEffects,
    noOpRender
  );
  const noOpChild = createElement('ARTICLE', document);
  noOpContainer.appendChild(noOpChild);
  noOpContainer.__mutationLog.length = 0;
  const firstUnmount = noOpBridge.unmountContainer(noOpCreate.handle);
  const secondUnmount = noOpBridge.unmountContainer(noOpCreate.handle);

  assert.equal(secondUnmount.noOp, true);
  assert.throws(
    () => noOpBridge.cleanupUnmountHostOutput(noOpAdmission, secondUnmount),
    {
      code: 'FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD',
      message: /no-op private root\.unmount request/
    }
  );
  assert.deepEqual(noOpContainer.childNodes, [noOpChild]);
  const noOpCleanup = noOpBridge.cleanupUnmountHostOutput(
    noOpAdmission,
    firstUnmount
  );
  assert.equal(
    noOpCleanup.unmountAdmission.alreadyUnmountedRootRejected,
    true
  );

  const portalBridge = rootBridge.createPrivateRootBridgeShell();
  const rootContainer = createElement('DIV', document);
  const portalContainer = createElement('ASIDE', document);
  const portalCreate = portalBridge.createClientRoot(rootContainer);
  const portal = reactDom.createPortal(
    {
      props: {children: 'portal child'},
      type: 'span'
    },
    portalContainer
  );
  const portalRender = portalBridge.renderContainer(
    portalCreate.handle,
    portal
  );
  portalBridge.createPortalRootBoundary(portalRender);

  const portalRootCreate = portalBridge.createClientRoot(portalContainer);
  const portalSideEffects =
    portalBridge.applyCreateRootSideEffects(portalRootCreate);
  const portalRootRender = portalBridge.renderContainer(
    portalRootCreate.handle,
    {
      props: {children: 'portal root'},
      type: 'aside'
    }
  );
  const portalAdmission = portalBridge.admitCreateRenderPath(
    portalRootCreate,
    portalSideEffects,
    portalRootRender
  );
  const portalChild = createElement('ASIDE', document);
  portalContainer.appendChild(portalChild);
  portalContainer.__mutationLog.length = 0;
  const portalUnmount =
    portalBridge.unmountContainer(portalRootCreate.handle);

  assert.throws(
    () => portalBridge.cleanupUnmountHostOutput(portalAdmission, portalUnmount),
    {
      code: 'FAST_REACT_DOM_INVALID_UNMOUNT_HOST_OUTPUT_CLEANUP_RECORD',
      message: /rejects portal containers/
    }
  );
  assert.deepEqual(portalContainer.childNodes, [portalChild]);
  assert.equal(rootMarkers.isContainerMarkedAsRoot(portalContainer), true);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), true);
  portalBridge.revertCreateRootSideEffects(portalSideEffects);
});

test('private react-dom/client facade root.unmount clears active host output metadata', () => {
  const document = createDocument('private-client-facade-root-unmount-exec');
  const container = createElement('DIV', document);
  const unmountCallback = function afterFacadeRootUnmount() {};
  const element = {
    props: {
      children: 'facade root unmount output',
      id: 'facade-root-unmount-host'
    },
    type: 'section'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    nativeEnvironmentId: 844,
    nativeHandoffIdPrefix: 'facade-root-unmount-native',
    publicFacadeHostOutputRenderIdPrefix: 'facade-root-unmount-render',
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      'facade-root-unmount-cleanup-diagnostic',
    requestIdPrefix: 'facade-root-unmount-request',
    rootIdPrefix: 'facade-root-unmount-root',
    sideEffectIdPrefix: 'facade-root-unmount-side-effect',
    unmountCleanupIdPrefix: 'facade-root-unmount-cleanup',
    updateIdPrefix: 'facade-root-unmount-update'
  });
  const root = adapter.createRoot(container);
  const renderDiagnostic = adapter.renderHostOutput(root, element);
  const renderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      renderDiagnostic
    );
  const handoffPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      renderPayload.hostOutputHandoff
    );
  const hostNode = handoffPayload.hostNode;
  const textNode = handoffPayload.textNode;

  assert.equal(container.childNodes.length, 1);
  assert.equal(handoffPayload.active, true);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .activeHostOutputRenderRecordCount,
    1
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .rootCreateRenderAdmissionActive,
    true
  );

  const unmount = root.unmount(unmountCallback);
  const diagnostics = adapter.getRootHostOutputUnmountCleanupDiagnostics(root);
  const diagnostic = diagnostics[0];
  const cleanupPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload(
      diagnostic
    );
  const unmountLifecycleExecution =
    diagnostic.rootUnmountLifecycleExecutionRecord;
  const unmountLifecycleExecutionPayload =
    rootBridge.getPrivateRootPublicFacadeRootUnmountLifecycleExecutionPayload(
      unmountLifecycleExecution
    );
  const unmountLifecycleRequestBoundary =
    unmountLifecycleExecution.rootUnmountLifecycleRequestBoundaryRecord;
  const unmountLifecycleRequestBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      unmountLifecycleRequestBoundary
    );
  const unmountSnapshot = diagnostic.sourceContainerSnapshot;
  const unmountSnapshotPayload =
    rootBridge.getPrivateRootPublicFacadeLifecycleContainerSnapshotPayload(
      unmountSnapshot
    );
  const rootPayloadAfter =
    rootBridge.getPrivateRootPublicFacadeRootPayload(root);

  assert.equal(unmount.requestType, 'root.unmount');
  assert.equal(unmount.noOp, false);
  assert.equal(
    unmount.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    unmount.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostic.cleanupSource, 'root.unmount');
  assert.equal(diagnostic.unmountRequestId, unmount.requestId);
  assert.equal(diagnostic.renderRequestId, renderDiagnostic.renderRequestId);
  assert.equal(
    diagnostic.nativeHandoffId,
    'facade-root-unmount-native:3'
  );
  assert.equal(
    diagnostic.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    diagnostic.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT
  );
  assert.equal(diagnostic.nativeRequestRecord.environmentId, 844);
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_CLEANED
  );
  assert.equal(
    diagnostic.rootMetadataCleanupStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ROOT_UNMOUNT_METADATA_CLEARED
  );
  assert.equal(diagnostic.rootCreateRenderAdmissionMetadataCleared, true);
  assert.equal(diagnostic.activeHostOutputMetadataCleared, true);
  assert.equal(diagnostic.hostOutputHandoffActiveBeforeCleanup, true);
  assert.equal(diagnostic.hostOutputHandoffActiveAfterCleanup, false);
  assert.equal(diagnostic.rootContainerChildrenCleared, true);
  assert.equal(diagnostic.componentTreeMetadataDetached, true);
  assert.equal(diagnostic.publicRootUnmounted, false);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.nativeUnmountRequestMirrored, true);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(
    diagnostic.rootUnmountLifecycleExecutionStatus,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_ROOT_UNMOUNT_LIFECYCLE_EXECUTION_ACCEPTED
  );
  assert.equal(diagnostic.rootUnmountLifecycleExecutionConsumed, true);
  assert.equal(diagnostic.rootUnmountLifecycleExecutionSourceOwned, true);
  assert.equal(
    diagnostic.rootUnmountLifecycleRequestBoundaryRecord,
    unmountLifecycleRequestBoundary
  );
  assert.equal(
    diagnostic.rootUnmountLifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(
    diagnostic.rootUnmountLifecycleRequestBoundarySourceOwned,
    true
  );
  assert.equal(diagnostic.rootUnmountLifecycleRequestBoundaryCurrent, true);
  assert.equal(diagnostic.rootUnmountLifecycleSnapshotOwned, true);
  assert.equal(diagnostic.rootUnmountLifecycleSnapshotBeforeChildCount, 1);
  assert.equal(
    diagnostic.rootUnmountLifecycleFinishedWorkHandoffId,
    renderDiagnostic.rootWorkLoopFinishedWorkHandoffId
  );
  assert.equal(
    unmountLifecycleExecution.$$typeof,
    rootBridge
      .privateRootPublicFacadeRootUnmountLifecycleExecutionRecordType
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeRootUnmountLifecycleExecutionRecord(
      unmountLifecycleExecution
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeRootUnmountLifecycleExecutionRecord(
      {}
    ),
    false
  );
  assert.equal(unmountLifecycleExecution.sourceRequestId, unmount.requestId);
  assert.equal(
    unmountLifecycleExecution.sourceRequestSequence,
    unmount.requestSequence
  );
  assert.equal(unmountLifecycleExecution.sourceRequestType, 'root.unmount');
  assert.equal(unmountLifecycleExecution.entrypoint, 'react-dom/client');
  assert.equal(unmountLifecycleExecution.sameEntrypoint, true);
  assert.equal(unmountLifecycleExecution.sourceOwned, true);
  assert.equal(unmountLifecycleExecution.requestBoundaryCurrent, true);
  assert.equal(Object.isFrozen(unmountLifecycleExecution), true);
  assert.equal(
    unmountLifecycleExecution.rootUnmountLifecycleAdmissionRecord,
    unmountLifecycleExecutionPayload.rootUnmountLifecycleAdmissionRecord
  );
  assert.equal(
    unmountLifecycleExecution.rootUnmountLifecycleRequestBoundaryRecord,
    unmountLifecycleRequestBoundary
  );
  assert.equal(
    unmountLifecycleExecution.rootUnmountLifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(
    unmountLifecycleExecution.rootUnmountLifecycleRequestBoundarySourceOwned,
    true
  );
  assert.equal(unmountLifecycleExecution.replayRejected, true);
  assert.equal(unmountLifecycleExecution.lifecycleRowsFrozen, true);
  assert.equal(unmountLifecycleExecution.nativeExecution, false);
  assert.equal(unmountLifecycleExecution.reconcilerExecution, false);
  assert.equal(unmountLifecycleExecution.compatibilityClaimed, false);
  assert.equal(unmountLifecycleExecutionPayload.consumed, true);
  assert.equal(unmountLifecycleExecutionPayload.payload.root, root);
  assert.equal(
    unmountLifecycleExecutionPayload.rootUnmountLifecycleRequestBoundaryRecord,
    unmountLifecycleRequestBoundary
  );
  assert.equal(
    unmountLifecycleExecutionPayload.rootUnmountLifecycleRequestBoundaryPayload,
    unmountLifecycleRequestBoundaryPayload
  );
  assert.equal(
    unmountLifecycleRequestBoundary.$$typeof,
    rootBridge.privateRootLifecycleRequestBoundaryRecordType
  );
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      unmountLifecycleRequestBoundary
    ),
    true
  );
  assert.equal(
    unmountLifecycleRequestBoundary.boundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(
    unmountLifecycleRequestBoundary.sourceRequestId,
    unmount.requestId
  );
  assert.equal(
    unmountLifecycleRequestBoundary.sourceRequestSequence,
    unmount.requestSequence
  );
  assert.equal(
    unmountLifecycleRequestBoundary.sourceRequestType,
    'root.unmount'
  );
  assert.equal(
    unmountLifecycleRequestBoundary.sourceOperation,
    'unmount'
  );
  assert.equal(unmountLifecycleRequestBoundary.rootId, unmount.rootId);
  assert.equal(
    unmountLifecycleRequestBoundary.sourceLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    unmountLifecycleRequestBoundary.sourceLifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(
    unmountLifecycleRequestBoundary.activeLifecycleStatus,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(
    unmountLifecycleRequestBoundary.latestSourceRequestId,
    unmount.requestId
  );
  assert.equal(
    unmountLifecycleRequestBoundary.latestSourceRequestSequence,
    unmount.requestSequence
  );
  assert.equal(
    unmountLifecycleRequestBoundary.lifecycleRequestVersion,
    unmountLifecycleExecution.lifecycleRequestVersionAfter
  );
  assert.equal(unmountLifecycleRequestBoundary.sourceOwned, true);
  assert.equal(unmountLifecycleRequestBoundary.activeRootLifecycle, true);
  assert.equal(unmountLifecycleRequestBoundary.requestBoundaryCurrent, true);
  assert.equal(unmountLifecycleRequestBoundary.publicRootExecution, false);
  assert.equal(unmountLifecycleRequestBoundary.nativeExecution, false);
  assert.equal(unmountLifecycleRequestBoundary.reconcilerExecution, false);
  assert.equal(unmountLifecycleRequestBoundary.domMutation, false);
  assert.equal(unmountLifecycleRequestBoundary.browserDomMutation, false);
  assert.equal(unmountLifecycleRequestBoundary.hydration, false);
  assert.equal(unmountLifecycleRequestBoundary.eventDispatch, false);
  assert.equal(unmountLifecycleRequestBoundary.refEffects, false);
  assert.equal(unmountLifecycleRequestBoundary.packageCompatibility, false);
  assert.equal(unmountLifecycleRequestBoundary.compatibilityClaimed, false);
  assert.equal(
    unmountLifecycleRequestBoundaryPayload.admissionRecord,
    unmountLifecycleExecution.rootUnmountLifecycleAdmissionRecord
  );
  assert.equal(unmountLifecycleRequestBoundaryPayload.sourceRecord, unmount);
  assert.equal(
    unmountLifecycleRequestBoundaryPayload.lifecycleRequestVersion,
    unmountLifecycleExecution.lifecycleRequestVersionAfter
  );
  assert.equal(
    unmountLifecycleExecutionPayload.createRecord,
    renderPayload.createRecord
  );
  assert.equal(
    unmountLifecycleExecutionPayload.sourceContainerSnapshotBefore.childCount,
    1
  );
  assert.equal(
    cleanupPayload.unmountLifecycleExecutionRecord,
    unmountLifecycleExecution
  );
  assert.equal(
    cleanupPayload.unmountLifecycleExecutionPayload,
    unmountLifecycleExecutionPayload
  );
  assert.equal(
    cleanupPayload.rootUnmountLifecycleRequestBoundaryRecord,
    unmountLifecycleRequestBoundary
  );
  assert.equal(
    cleanupPayload.rootUnmountLifecycleRequestBoundaryPayload,
    unmountLifecycleRequestBoundaryPayload
  );
  assert.equal(
    diagnostic.sourceContainerSnapshotStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_LIFECYCLE_CONTAINER_SNAPSHOT_ACCEPTED
  );
  assert.equal(diagnostic.sourceContainerSnapshotPhase, 'unmount');
  assert.equal(diagnostic.sourceContainerSnapshotOwned, true);
  assert.equal(diagnostic.sourceContainerSnapshotBeforeChildCount, 1);
  assert.equal(diagnostic.sourceContainerSnapshotAfterChildCount, 0);
  assert.equal(
    diagnostic.sourceContainerSnapshotMarkerListenerPreserved,
    true
  );
  assert.equal(
    unmountSnapshot.$$typeof,
    rootBridge.privateRootPublicFacadeLifecycleContainerSnapshotRecordType
  );
  assert.equal(unmountSnapshot.phase, 'unmount');
  assert.equal(unmountSnapshot.sourceOwned, true);
  assert.equal(unmountSnapshot.beforeChildCount, 1);
  assert.equal(unmountSnapshot.afterChildCount, 0);
  assert.equal(unmountSnapshot.beforeTextContent, 'facade root unmount output');
  assert.equal(unmountSnapshot.afterTextContent, '');
  assert.equal(unmountSnapshotPayload.sourceRecord, unmount);
  assert.equal(unmountSnapshotPayload.createRecord, renderPayload.createRecord);
  assert.equal(unmountSnapshotPayload.before.childCount, 1);
  assert.equal(unmountSnapshotPayload.after.childCount, 0);
  assert.equal(cleanupPayload.unmountRecord, unmount);
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(
      cleanupPayload.nativeHandoffRecord
    ),
    cleanupPayload.nativeHandoffPayload
  );
  assert.equal(cleanupPayload.nativeHandoffPayload.sourceRecord, unmount);
  assert.equal(cleanupPayload.nativeHandoffPayload.value, null);
  assert.equal(handoffPayload.active, false);
  assert.deepEqual(container.childNodes, []);
  assert.equal(hostNode.parentNode, null);
  assert.equal(textNode.parentNode, hostNode);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), null);
  assert.equal(rootPayloadAfter.activeHostOutputRenderRecordCount, 0);
  assert.equal(rootPayloadAfter.rootCreateRenderAdmissionActive, false);
  assert.equal(
    rootPayloadAfter.rootLifecycleStatus,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.deepEqual(rootPayloadAfter.hostOutputUnmountCleanupRecords, [
    diagnostic
  ]);

  const secondUnmount = root.unmount();
  assert.equal(secondUnmount.noOp, true);
  assert.equal(
    adapter.getRootHostOutputUnmountCleanupDiagnostics(root).length,
    1
  );
  assertPublicCreateRootMinimalHostOutput(document);
});

test('private react-dom/client facade root.unmount lifecycle execution fails closed for stale cloned cross-root and replayed evidence', () => {
  const document = createDocument(
    'private-client-facade-root-unmount-lifecycle-negative'
  );
  const container = createElement('DIV', document);
  const crossContainer = createElement('DIV', document);
  const replayContainer = createElement('DIV', document);
  const element = {
    props: {
      children: 'unmount lifecycle initial',
      id: 'unmount-lifecycle-host'
    },
    type: 'section'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    requestIdPrefix: 'facade-unmount-lifecycle-request',
    rootIdPrefix: 'facade-unmount-lifecycle-root',
    updateIdPrefix: 'facade-unmount-lifecycle-update'
  });
  const root = adapter.createRoot(container);
  const crossRoot = adapter.createRoot(crossContainer);
  const replayRoot = adapter.createRoot(replayContainer);
  const renderDiagnostic = root.render(element);
  const crossRenderDiagnostic = crossRoot.render(element);
  const replayRenderDiagnostic = replayRoot.render(element);
  const renderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      renderDiagnostic
    );
  const crossRenderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      crossRenderDiagnostic
    );
  const replayRenderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      replayRenderDiagnostic
    );
  let staleExecutionRecord = null;
  let crossExecutionRecord = null;

  assert.throws(
    () =>
      root.unmount({
        rootUnmountLifecycleMetadataFactory() {
          return {
            lifecycleRows: [
              {
                kind: 'caller-built-unmount-lifecycle-row'
              }
            ]
          };
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /caller-built lifecycle row/
    }
  );
  assert.equal(container.textContent, 'unmount lifecycle initial');
  assert.deepEqual(adapter.getRootHostOutputUnmountCleanupDiagnostics(root), []);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .rootLifecycleStatus,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );

  assert.throws(
    () =>
      root.unmount({
        rootUnmountLifecycleExecutionFactory(context) {
          const row = context.createRootUnmountLifecycleExecutionRow({
            kind: 'cloned-unmount-lifecycle-row'
          });
          staleExecutionRecord =
            context.createRootUnmountLifecycleExecutionRecord({
              lifecycleRows: [row],
              source: 'cloned-unmount-lifecycle'
            });
          return Object.freeze({...staleExecutionRecord});
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /intact source-owned lifecycle execution record/
    }
  );
  assert.equal(container.textContent, 'unmount lifecycle initial');
  assert.deepEqual(adapter.getRootHostOutputUnmountCleanupDiagnostics(root), []);

  assert.throws(
    () =>
      crossRoot.unmount({
        rootUnmountLifecycleExecutionFactory(context) {
          const row = context.createRootUnmountLifecycleExecutionRow({
            kind: 'cross-root-unmount-lifecycle-row'
          });
          crossExecutionRecord =
            context.createRootUnmountLifecycleExecutionRecord({
              lifecycleRows: [row],
              source: 'cross-root-unmount-lifecycle'
            });
          return Object.freeze({...crossExecutionRecord});
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /intact source-owned lifecycle execution record/
    }
  );
  assert.throws(
    () =>
      root.unmount({
        rootUnmountLifecycleExecutionRecord: crossExecutionRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /stale, cross-root, cloned, or caller-built lifecycle execution metadata/
    }
  );
  assert.throws(
    () =>
      root.unmount({
        rootUnmountLifecycleExecutionRecord: staleExecutionRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /stale, cross-root, cloned, or caller-built lifecycle execution metadata/
    }
  );
  assert.throws(
    () =>
      root.unmount({
        rootUnmountLifecycleExecutionFactory(context) {
          const row = context.createRootUnmountLifecycleExecutionRow({
            kind: 'alias-unmount-lifecycle-row',
            nativeExecution: false
          });
          return context.createRootUnmountLifecycleExecutionRecord({
            lifecycleRows: [row]
          });
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /alias claims/
    }
  );
  assert.throws(
    () =>
      root.unmount({
        rootUnmountLifecycleExecutionFactory(context) {
          const row = context.createRootUnmountLifecycleExecutionRow({
            browserDomMutation: true,
            eventDispatch: true,
            hydration: true,
            kind: 'audit-alias-unmount-lifecycle-row',
            packageCompatibility: true,
            prose: 'claimed cleanup prose alias',
            refEffects: true,
            sourceSyntax: 'root.unmount()'
          });
          return context.createRootUnmountLifecycleExecutionRecord({
            lifecycleRows: [row],
            source: 'audit-alias-unmount-lifecycle'
          });
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /alias claims/
    }
  );
  assert.deepEqual(adapter.getRootHostOutputUnmountCleanupDiagnostics(root), []);
  assert.equal(container.textContent, 'unmount lifecycle initial');
  assert.equal(container.childNodes.length, 1);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .rootLifecycleStatus,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );

  const unmount = root.unmount({
    rootUnmountLifecycleExecutionFactory(context) {
      const row = context.createRootUnmountLifecycleExecutionRow({
        kind: 'accepted-unmount-lifecycle-row',
        rowIndex: 0
      });
      return context.createRootUnmountLifecycleExecutionRecord({
        lifecycleRows: [row],
        source: 'accepted-unmount-lifecycle'
      });
    }
  });
  const [diagnostic] =
    adapter.getRootHostOutputUnmountCleanupDiagnostics(root);
  const consumedExecutionRecord =
    diagnostic.rootUnmountLifecycleExecutionRecord;
  const consumedExecutionPayload =
    rootBridge.getPrivateRootPublicFacadeRootUnmountLifecycleExecutionPayload(
      consumedExecutionRecord
    );

  assert.equal(unmount.noOp, false);
  assert.equal(diagnostic.rootUnmountLifecycleExecutionConsumed, true);
  assert.equal(
    consumedExecutionRecord.lifecycleMetadataSource,
    'accepted-unmount-lifecycle'
  );
  assert.equal(consumedExecutionPayload.consumed, true);
  assert.equal(container.childNodes.length, 0);

  assert.throws(
    () =>
      replayRoot.unmount({
        rootUnmountLifecycleExecutionRecord: consumedExecutionRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /replayed lifecycle execution record/
    }
  );
  assert.equal(replayContainer.textContent, 'unmount lifecycle initial');
  assert.deepEqual(
    adapter.getRootHostOutputUnmountCleanupDiagnostics(replayRoot),
    []
  );

  crossRenderPayload.bridge.cleanupInitialRenderHostOutput(
    crossRenderPayload.hostOutputHandoff
  );
  replayRenderPayload.bridge.cleanupInitialRenderHostOutput(
    replayRenderPayload.hostOutputHandoff
  );
  assert.equal(crossContainer.childNodes.length, 0);
  assert.equal(replayContainer.childNodes.length, 0);
});

test('private react-dom/client facade root.unmount links ref detach and passive destroy evidence before cleanup', () => {
  const document = createDocument('private-client-facade-root-unmount-ref-passive');
  const container = createElement('DIV', document);
  const refCalls = [];
  function privateFacadeUnmountRef(value) {
    refCalls.push(value);
  }
  const element = {
    privatePassiveDestroy: {
      destroyCount: 1,
      metadataOnly: true
    },
    props: {
      children: 'facade root unmount ref passive output',
      id: 'facade-root-unmount-ref-passive-host',
      ref: privateFacadeUnmountRef
    },
    type: 'section'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    publicFacadeHostOutputRenderIdPrefix:
      'facade-root-unmount-ref-passive-render',
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      'facade-root-unmount-ref-passive-cleanup-diagnostic',
    requestIdPrefix: 'facade-root-unmount-ref-passive-request',
    rootCommitRefMetadataIdPrefix:
      'facade-root-unmount-ref-passive-ref-metadata',
    rootIdPrefix: 'facade-root-unmount-ref-passive-root',
    sideEffectIdPrefix: 'facade-root-unmount-ref-passive-side-effect',
    unmountCleanupIdPrefix: 'facade-root-unmount-ref-passive-cleanup',
    updateIdPrefix: 'facade-root-unmount-ref-passive-update'
  });
  const root = adapter.createRoot(container);
  const renderDiagnostic = root.render(element);
  const renderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      renderDiagnostic
    );
  const handoffPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      renderPayload.hostOutputHandoff
    );
  const hostNode = handoffPayload.hostNode;

  const unmount = root.unmount();
  const [diagnostic] =
    adapter.getRootHostOutputUnmountCleanupDiagnostics(root);
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload(
      diagnostic
    );
  const evidence = diagnostic.unmountRefPassiveEvidence;

  assert.equal(refCalls.length, 0);
  assert.equal(unmount.noOp, false);
  assert.equal(diagnostic.cleanupSource, 'root.unmount');
  assert.equal(diagnostic.unmountRefPassiveEvidenceAccepted, true);
  assert.equal(diagnostic.unmountRefDetachMetadataAccepted, true);
  assert.equal(diagnostic.unmountPassiveDestroyEvidenceAccepted, true);
  assert.equal(diagnostic.unmountPassiveDestroyOrderingAccepted, false);
  assert.equal(diagnostic.unmountRefPassiveEvidenceBeforeHostCleanup, true);
  assert.equal(diagnostic.refEffects, false);
  assert.equal(diagnostic.passiveEffects, false);
  assert.equal(
    evidence.status,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_REF_PASSIVE_EVIDENCE_ACCEPTED
  );
  assert.deepEqual(evidence.order, [
    'root-unmount-ref-detach-metadata',
    'root-unmount-passive-destroy-evidence',
    'fake-dom-host-output-cleanup'
  ]);
  assert.equal(
    evidence.refDetachEvidence.status,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_REF_DETACH_METADATA_ACCEPTED
  );
  assert.equal(
    evidence.refDetachEvidence.rootCommitRefMetadataStatus,
    rootBridge.ROOT_BRIDGE_ROOT_COMMIT_REF_METADATA_ACCEPTED
  );
  assert.equal(evidence.refDetachEvidence.hostOutputCanary, 'unmount-host-output');
  assert.equal(evidence.refDetachEvidence.detachCount, 1);
  assert.equal(evidence.refDetachEvidence.attachCount, 0);
  assert.equal(evidence.refDetachEvidence.refAction, 'detach');
  assert.equal(evidence.refDetachEvidence.detachReason, 'deleted');
  assert.equal(evidence.refDetachEvidence.callbackRefsInvoked, false);
  assert.equal(evidence.refDetachEvidence.objectRefsMutated, false);
  assert.equal(evidence.refDetachEvidence.publicRootExecution, false);
  assert.equal(evidence.refDetachEvidence.compatibilityClaimed, false);
  assert.equal(
    rootBridge.getPrivateRootCommitRefMetadataPayload(
      evidence.refDetachEvidence.metadataRecord
    ).sourceRecord,
    unmount
  );
  assert.equal(
    evidence.passiveDestroyEvidence.status,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_PASSIVE_DESTROY_EVIDENCE_ACCEPTED
  );
  assert.equal(
    evidence.passiveDestroyEvidence.destroyCallbackHandlesAccepted,
    true
  );
  assert.equal(
    evidence.passiveDestroyEvidence.invokesDestroyCallbacksUnderTestControl,
    true
  );
  assert.equal(evidence.passiveDestroyEvidence.invokesDestroyCallbacks, false);
  assert.equal(
    evidence.passiveDestroyEvidence.publicEffectExecutionEnabled,
    false
  );
  assert.equal(
    evidence.passiveDestroyEvidence.schedulerDrivenPassiveExecutionEnabled,
    false
  );
  assert.equal(evidence.passiveDestroyEvidence.publicActPassiveDrain, false);
  assert.equal(evidence.passiveDestroyEvidence.publicRootExecution, false);
  assert.equal(
    evidence.passiveDestroyEvidence.destroyOrderingMetadataAccepted,
    false
  );
  assert.equal(
    evidence.passiveDestroyEvidence.destroyOrderingMetadataStatus,
    null
  );
  assert.equal(evidence.passiveDestroyEvidence.compatibilityClaimed, false);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'public-facade-root-render-record',
      'public-facade-root-unmount-record',
      'private-native-unmount-request-handoff',
      'root-marker-setup-cleanup',
      'root-listener-setup-cleanup',
      'create-render-admission',
      'fake-dom-host-output-mutation',
      'fake-dom-unmount-cleanup',
      'root-unmount-admission-metadata',
      'fake-dom-container-cleanup-metadata',
      'component-tree-metadata-detach',
      'root-facade-metadata-clear',
      'latest-props-publication',
      'root-unmount-ref-detach-metadata',
      'root-unmount-passive-destroy-evidence',
      'ref-passive-before-host-cleanup-order'
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'public-root-unmount',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'ref-callback-invocation',
      'passive-effect-execution',
      'compatibility-claims'
    ]
  );
  assert.equal(hidden.unmountRefPassiveEvidence, evidence);
  assert.equal(container.childNodes.length, 0);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), null);
  assert.equal(diagnostic.publicRootUnmounted, false);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.compatibilityClaimed, false);

  const serialized = JSON.stringify(diagnostic);
  assert.equal(serialized.includes('privateFacadeUnmountRef'), false);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
});

test('private react-dom/client facade root.unmount consumes ref cleanup and passive destroy ordering before cleanup', () => {
  const document = createDocument('private-client-facade-root-unmount-ref-cleanup-passive');
  const container = createElement('DIV', document);
  const calls = [];
  function privateFacadeUnmountCleanupRef(value) {
    calls.push(`attach:${value.localName}`);
    return function cleanupPrivateFacadeUnmountRef() {
      calls.push('cleanup');
    };
  }
  const element = {
    privatePassiveDestroy: {
      consumeRefCleanupExecution: true,
      destroyCount: 1,
      metadataOnly: true
    },
    props: {
      children: 'facade root unmount ref cleanup passive output',
      id: 'facade-root-unmount-ref-cleanup-passive-host',
      ref: privateFacadeUnmountCleanupRef
    },
    type: 'section'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    publicFacadeHostOutputRenderIdPrefix:
      'facade-root-unmount-ref-cleanup-passive-render',
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      'facade-root-unmount-ref-cleanup-passive-cleanup-diagnostic',
    requestIdPrefix: 'facade-root-unmount-ref-cleanup-passive-request',
    rootCommitRefMetadataIdPrefix:
      'facade-root-unmount-ref-cleanup-passive-ref-metadata',
    rootIdPrefix: 'facade-root-unmount-ref-cleanup-passive-root',
    sideEffectIdPrefix:
      'facade-root-unmount-ref-cleanup-passive-side-effect',
    unmountCleanupIdPrefix:
      'facade-root-unmount-ref-cleanup-passive-cleanup',
    updateIdPrefix: 'facade-root-unmount-ref-cleanup-passive-update'
  });
  const root = adapter.createRoot(container);
  root.render(element);

  const unmount = root.unmount();
  const [diagnostic] =
    adapter.getRootHostOutputUnmountCleanupDiagnostics(root);
  const evidence = diagnostic.unmountRefPassiveEvidence;
  const cleanupEvidence = evidence.refCleanupExecutionEvidence;
  const passiveEvidence = evidence.passiveDestroyEvidence;

  assert.deepEqual(calls, ['attach:section', 'cleanup']);
  assert.equal(unmount.noOp, false);
  assert.equal(diagnostic.cleanupSource, 'root.unmount');
  assert.equal(diagnostic.unmountRefPassiveEvidenceAccepted, true);
  assert.equal(diagnostic.unmountRefDetachMetadataAccepted, true);
  assert.equal(diagnostic.unmountPassiveDestroyEvidenceAccepted, true);
  assert.equal(diagnostic.unmountRefCleanupExecutionAccepted, true);
  assert.equal(diagnostic.unmountPassiveDestroyOrderingAccepted, true);
  assert.equal(
    diagnostic.unmountRefCleanupPassiveDestroyBeforeHostCleanup,
    true
  );
  assert.deepEqual(evidence.order, [
    'root-unmount-ref-cleanup-handle-metadata',
    'root-unmount-ref-cleanup-execution',
    'root-unmount-passive-destroy-ordering-metadata',
    'fake-dom-host-output-cleanup'
  ]);
  assert.equal(
    evidence.initialRefAttachEvidence.status,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_REF_CLEANUP_HANDLE_METADATA_ACCEPTED
  );
  assert.equal(
    cleanupEvidence.status,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_REF_CLEANUP_EXECUTION_ACCEPTED
  );
  assert.equal(
    cleanupEvidence.executionGateStatus,
    refCallbackGate.REF_CALLBACK_CLEANUP_RETURN_EXECUTION_GATE_STATUS
  );
  assert.equal(cleanupEvidence.testOnlyExecution, true);
  assert.equal(cleanupEvidence.callbackInvocationAttemptCount, 1);
  assert.equal(cleanupEvidence.cleanupInvocationAttemptCount, 1);
  assert.equal(cleanupEvidence.cleanupReturnHandleConsumedCount, 1);
  assert.equal(cleanupEvidence.cleanupReturnHandleExecutionCount, 1);
  assert.equal(cleanupEvidence.publicRootsTouched, false);
  assert.equal(cleanupEvidence.compatibilityClaimed, false);
  assert.equal(
    passiveEvidence.destroyOrderingMetadataStatus,
    'accepted-private-deleted-subtree-ref-passive-cleanup-order-without-public-passive-drain'
  );
  assert.equal(
    passiveEvidence.rootUnmountPassiveDestroyOrderingStatus,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_UNMOUNT_PASSIVE_DESTROY_ORDERING_ACCEPTED
  );
  assert.equal(passiveEvidence.destroyOrderingMetadataAccepted, true);
  assert.equal(passiveEvidence.refCleanupBeforePassiveDestroy, true);
  assert.equal(passiveEvidence.passiveDestroyBeforeHostCleanup, true);
  assert.equal(passiveEvidence.hostCleanupAfterPassiveDestroy, true);
  assert.equal(passiveEvidence.invokesDestroyCallbacks, false);
  assert.equal(passiveEvidence.publicEffectExecutionEnabled, false);
  assert.equal(passiveEvidence.schedulerDrivenPassiveExecutionEnabled, false);
  assert.deepEqual(
    diagnostic.acceptedCapabilities
      .map((capability) => capability.id)
      .slice(-3),
    [
      'root-unmount-ref-cleanup-execution',
      'root-unmount-passive-destroy-ordering-metadata',
      'ref-cleanup-passive-destroy-before-host-cleanup-order'
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'public-root-unmount',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'public-ref-compatibility',
      'passive-effect-execution',
      'compatibility-claims'
    ]
  );
  assert.equal(diagnostic.privateRefCleanupExecution, true);
  assert.equal(diagnostic.refEffects, false);
  assert.equal(diagnostic.passiveEffects, false);
  assert.equal(diagnostic.publicRootUnmounted, false);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 0);

  const serialized = JSON.stringify(diagnostic);
  assert.equal(serialized.includes('cleanupPrivateFacadeUnmountRef'), false);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
});

test('private react-dom/client facade unmount cleanup diagnostic routes through bridge cleanup', () => {
  const document = createDocument('private-client-facade-unmount-cleanup');
  const container = createElement('DIV', document);
  const renderCallback = function afterPrivateFacadeRenderForUnmount() {};
  const unmountCallback = function afterPrivateFacadeUnmountCleanup() {};
  const element = {
    props: {
      children: 'facade unmount output',
      id: 'facade-unmount-host',
      onClick() {
        return 'not-invoked';
      },
      title: 'Private facade unmount'
    },
    type: 'article'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: 'facade-unmount-admission',
    initialHostOutputIdPrefix: 'facade-unmount-initial',
    nativeEnvironmentId: 845,
    nativeHandoffIdPrefix: 'facade-unmount-native',
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      'facade-unmount-diagnostic',
    requestIdPrefix: 'facade-unmount-request',
    rootIdPrefix: 'facade-unmount-root',
    sideEffectIdPrefix: 'facade-unmount-side-effect',
    unmountAdmissionIdPrefix: 'facade-unmount-admission-meta',
    unmountCleanupIdPrefix: 'facade-unmount-cleanup',
    updateIdPrefix: 'facade-unmount-update'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);

  const diagnostic = adapter.unmountHostOutput(root, element, {
    renderCallback,
    unmountCallback
  });
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload(
      diagnostic
    );
  const render = hidden.renderRecord;
  const unmount = hidden.unmountRecord;
  const handoff = hidden.hostOutputHandoff;
  const cleanup = hidden.unmountCleanupRecord;
  const handoffPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);
  const cleanupPayload =
    rootBridge.getPrivateRootUnmountHostOutputCleanupPayload(cleanup);
  const hostNode = handoffPayload.hostNode;
  const textNode = handoffPayload.textNode;

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    diagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputUnmountCleanupRecordType
  );
  assert.equal(
    diagnostic.kind,
    'FastReactDomPrivateRootPublicFacadeHostOutputUnmountCleanupDiagnosticRecord'
  );
  assert.equal(
    diagnostic.operation,
    'public-facade-host-output-unmount-cleanup-diagnostic'
  );
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_CLEANED
  );
  assert.equal(diagnostic.diagnosticId, 'facade-unmount-diagnostic:1');
  assert.equal(diagnostic.rootId, 'facade-unmount-root:1');
  assert.equal(diagnostic.createRequestId, 'facade-unmount-request:1');
  assert.equal(diagnostic.renderRequestId, 'facade-unmount-request:2');
  assert.equal(diagnostic.renderUpdateId, 'facade-unmount-update:1');
  assert.equal(diagnostic.unmountRequestId, 'facade-unmount-request:3');
  assert.equal(diagnostic.unmountUpdateId, 'facade-unmount-update:2');
  assert.equal(
    diagnostic.renderLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_CREATED
  );
  assert.equal(
    diagnostic.renderLifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    diagnostic.unmountLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    diagnostic.unmountLifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(diagnostic.unmountNoOp, false);
  assert.equal(diagnostic.unmountSync, true);
  assert.equal(diagnostic.sideEffectId, 'facade-unmount-side-effect:1');
  assert.equal(
    diagnostic.setupSideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assert.equal(
    diagnostic.cleanupSideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.equal(diagnostic.admissionId, 'facade-unmount-admission:1');
  assert.equal(
    diagnostic.admissionStatus,
    rootBridge.ROOT_BRIDGE_CREATE_RENDER_ADMITTED
  );
  assert.equal(diagnostic.hostOutputHandoffId, 'facade-unmount-initial:1');
  assert.equal(
    diagnostic.hostOutputHandoffStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED
  );
  assert.equal(diagnostic.unmountCleanupId, 'facade-unmount-cleanup:1');
  assert.equal(
    diagnostic.unmountCleanupStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED
  );
  assert.equal(
    diagnostic.unmountAdmissionId,
    'facade-unmount-admission-meta:1'
  );
  assert.equal(
    diagnostic.unmountAdmissionStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_ADMITTED
  );
  assert.equal(diagnostic.nativeHandoffId, 'facade-unmount-native:3');
  assert.equal(
    diagnostic.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    diagnostic.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_UNMOUNT
  );
  assert.equal(diagnostic.nativeRequestRecord.environmentId, 845);
  assert.equal(
    diagnostic.rootUnmountOwnership.rootHandleMatchesCreateRecord,
    true
  );
  assert.equal(diagnostic.hostType, 'article');
  assert.equal(diagnostic.containerChildCountBeforeUnmount, 1);
  assert.equal(diagnostic.hostChildCountBeforeUnmount, 1);
  assert.equal(diagnostic.textContent, 'facade unmount output');
  assert.deepEqual(diagnostic.fakeDomCleanup, {
    clearContainerStatus: 'cleared',
    containerCleanupMetadataStatus:
      domHost.ROOT_UNMOUNT_CONTAINER_CLEANUP_METADATA_STATUS,
    componentTreeDetachStatus: 'detached-host-instance-subtree',
    removedRootChildCount: 1,
    detachedHostInstanceCount: 2,
    detachRecordCount: 1
  });
  assert.equal(
    diagnostic.containerCleanupMetadata.status,
    domHost.ROOT_UNMOUNT_CONTAINER_CLEANUP_METADATA_STATUS
  );
  assert.equal(
    diagnostic.deletionCleanupMetadata.componentTreeMetadataDetached,
    true
  );
  assert.equal(diagnostic.removedRootChildCount, 1);
  assert.equal(diagnostic.detachedHostInstanceCount, 2);
  assert.equal(diagnostic.containerChildCountAfterCleanup, 0);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'public-facade-root-render-record',
      'public-facade-root-unmount-record',
      'private-native-unmount-request-handoff',
      'root-marker-setup-cleanup',
      'root-listener-setup-cleanup',
      'create-render-admission',
      'fake-dom-host-output-mutation',
      'fake-dom-unmount-cleanup',
      'root-unmount-admission-metadata',
      'fake-dom-container-cleanup-metadata',
      'component-tree-metadata-detach',
      'root-facade-metadata-clear',
      'latest-props-publication'
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'public-root-unmount',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'refs',
      'compatibility-claims'
    ]
  );
  assert.equal(diagnostic.privateFacadeRoot, true);
  assert.equal(diagnostic.publicCreateRootEnabled, false);
  assert.equal(diagnostic.publicRootCreated, false);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.publicRootUnmounted, false);
  assert.equal(diagnostic.publicRootBehaviorChanged, false);
  assert.equal(diagnostic.nativeUnmountRequestMirrored, true);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.rootScheduled, false);
  assert.equal(diagnostic.fakeDomMutation, true);
  assert.equal(diagnostic.domMutation, true);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.rootContainerChildrenCleared, true);
  assert.equal(diagnostic.componentTreeMetadataDetached, true);
  assert.equal(diagnostic.cleanupSource, 'adapter.unmountHostOutput');
  assert.equal(
    diagnostic.rootMetadataCleanupStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ROOT_UNMOUNT_METADATA_CLEARED
  );
  assert.equal(diagnostic.rootCreateRenderAdmissionMetadataCleared, true);
  assert.equal(diagnostic.activeHostOutputMetadataCleared, true);
  assert.equal(diagnostic.rootMarkerReverted, true);
  assert.equal(diagnostic.rootListenersReverted, true);
  assert.equal(diagnostic.markerWrites, false);
  assert.equal(diagnostic.listenerInstallation, false);
  assert.equal(diagnostic.setupMarkerWrites, true);
  assert.equal(diagnostic.setupListenerInstallation, true);
  assert.equal(diagnostic.cleanupCompleted, true);
  assert.equal(diagnostic.hydration, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.refEffects, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.cleanupRequired, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputUnmountCleanupRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputUnmountCleanupRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload({}),
    null
  );

  assert.equal(hidden.adapter, adapter);
  assert.equal(hidden.root, root);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.renderRecord, render);
  assert.equal(hidden.unmountRecord, unmount);
  assert.equal(hidden.admissionRecord.renderRequestId, render.requestId);
  assert.equal(hidden.hostOutputHandoff, handoff);
  assert.equal(hidden.hostOutputPayload, handoffPayload);
  assert.equal(hidden.unmountCleanupRecord, cleanup);
  assert.equal(hidden.unmountCleanupPayload, cleanupPayload);
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(
      hidden.nativeHandoffRecord
    ),
    hidden.nativeHandoffPayload
  );
  assert.equal(hidden.nativeHandoffPayload.sourceRecord, unmount);
  assert.equal(hidden.nativeHandoffPayload.value, null);
  assert.equal(hidden.sideEffectRecord.sideEffectStatus, rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED);
  assert.equal(hidden.renderCallback, renderCallback);
  assert.equal(hidden.unmountCallback, unmountCallback);
  assert.equal(rootBridge.getPrivateRootRecordPayload(render).element, element);
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(render).callback,
    renderCallback
  );
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(unmount).callback,
    unmountCallback
  );
  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    render,
    unmount
  ]);
  assert.deepEqual(adapter.getRootPayload(root).renderRecords, [render]);
  assert.deepEqual(adapter.getRootPayload(root).unmountRecords, [unmount]);
  assert.deepEqual(
    adapter.getRootHostOutputUnmountCleanupDiagnostics(root),
    [diagnostic]
  );
  assert.deepEqual(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .hostOutputUnmountCleanupRecords,
    [diagnostic]
  );

  assert.deepEqual(container.childNodes, []);
  assert.equal(hostNode.parentNode, null);
  assert.equal(textNode.parentNode, hostNode);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.deepEqual(
    container.__mutationLog.map((entry) => entry.type),
    ['appendChild', 'removeChild']
  );
  assert.deepEqual(
    document.__mutationLog.map((entry) => entry.type),
    ['createElement', 'createTextNode']
  );

  const serialized = JSON.stringify(diagnostic);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('not-invoked'), false);
  assert.equal(serialized.includes('afterPrivateFacade'), false);
  assert.equal(serialized.includes('facade unmount output'), true);

  assert.throws(() => root.render(element), {
    code: 'FAST_REACT_DOM_UNMOUNTED_ROOT'
  });

  const publicDocument = createDocument(
    'private-client-facade-unmount-cleanup-public'
  );
  assertPublicCreateRootMinimalHostOutput(publicDocument);
});
