'use strict';

const {
  assert,
  path,
  test,
  reactDomClient,
  rootBridge,
  componentTree,
  domHost,
  rootMarkers,
  listenerRegistry,
  rootListeners,
  DOCUMENT_NODE,
  ELEMENT_NODE,
  createHostOutputProps,
  createRootWorkLoopFinishedWorkMetadata,
  createRootCommitHostComponentUpdateRecord,
  createRootCommitHostTextUpdateRecord,
  assertPrivatePublicFacadePreflightRecord,
  assertBridgeDidNotTouchContainer,
  createLiveRootContainerPreflightTarget,
  createDocument,
  createElement,
  createTextNode,
  attributeEntries
} = require('./context.js');
const native = require(
  path.resolve(__dirname, '../../../../bindings/node/index.cjs')
);
const nativeRootWorkLoopFinishedWorkMetadataFactorySymbol = Symbol.for(
  'fast.react_native.private_root_work_loop_finished_work_metadata_factory'
);
const createNativeRootWorkLoopFinishedWorkMetadataForCanary =
  native[nativeRootWorkLoopFinishedWorkMetadataFactorySymbol];

assert.equal(
  typeof createNativeRootWorkLoopFinishedWorkMetadataForCanary,
  'function'
);

test('private react-dom/client facade adapter routes root calls to bridge records', () => {
  const document = createDocument('private-client-facade-adapter');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'private facade child'
    },
    type: 'span'
  };
  const callback = function afterPrivateFacadeRender() {};
  const unmountCallback = function afterPrivateFacadeUnmount() {};
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );

  assert.equal(Object.hasOwn(reactDomClient, 'rootPublicFacadeAdapter'), false);
  assert.equal(
    Object.hasOwn(
      reactDomClient,
      '__FAST_REACT_PRIVATE_ROOT_PUBLIC_FACADE_ADAPTER__'
    ),
    false
  );
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.value, rootBridge.createPrivateRootPublicFacadeAdapter);
  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.hydrateRoot,
      rootBridge.privateRootPublicFacadeAdapterSymbol
    ),
    undefined
  );

  const adapter = descriptor.value({
    requestIdPrefix: 'facade-request',
    rootIdPrefix: 'facade-root',
    updateIdPrefix: 'facade-update'
  });
  assert.equal(
    adapter.$$typeof,
    rootBridge.privateRootPublicFacadeAdapterType
  );
  assert.equal(adapter.kind, 'FastReactDomPrivateRootPublicFacadeAdapter');
  assert.equal(adapter.entrypoint, 'react-dom/client');
  assert.equal(
    adapter.adapterStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY
  );
  assert.equal(adapter.recordOnlyBridge, true);
  assert.equal(adapter.publicCreateRootEnabled, false);
  assert.equal(adapter.publicHydrateRootEnabled, false);
  assert.equal(adapter.nativeExecution, false);
  assert.equal(adapter.reconcilerExecution, false);
  assert.equal(adapter.domMutation, false);
  assert.equal(adapter.compatibilityClaimed, false);
  assert.equal(adapter.createRoot.length, 2);
  assert.equal(rootBridge.isPrivateRootPublicFacadeAdapter(adapter), true);
  assert.equal(rootBridge.isPrivateRootPublicFacadeAdapter({}), false);
  assert.equal(Object.isFrozen(adapter), true);

  const root = adapter.createRoot(container, {
    identifierPrefix: 'private-facade-'
  });
  const create = adapter.getRootCreateRecord(root);
  const initialPayload = rootBridge.getPrivateRootPublicFacadeRootPayload(root);

  assert.equal(Object.isFrozen(root), true);
  assert.deepEqual(Object.keys(root), ['render', 'unmount']);
  assert.equal(root.render.length, 1);
  assert.equal(root.unmount.length, 0);
  assert.equal(rootBridge.isPrivateRootPublicFacadeRoot(root), true);
  assert.equal(rootBridge.isPrivateRootPublicFacadeRoot({}), false);
  assert.equal(create.$$typeof, rootBridge.privateRootCreateRecordType);
  assert.equal(create.requestId, 'facade-request:1');
  assert.equal(create.rootId, 'facade-root:1');
  assert.equal(create.requestType, 'createRoot');
  assert.equal(create.nativeExecution, false);
  assert.equal(create.domMutation, false);
  assert.equal(create.markerWrites, false);
  assert.equal(create.listenerInstallation, false);
  assert.equal(create.compatibilityClaimed, false);
  assert.equal(initialPayload.root, root);
  assert.equal(
    initialPayload.rootType,
    rootBridge.privateRootPublicFacadeRootType
  );
  assert.equal(initialPayload.createRecord, create);
  assert.equal(initialPayload.requestRecords.length, 1);
  assert.equal(Object.isFrozen(initialPayload.requestRecords), true);
  assertBridgeDidNotTouchContainer(container, document);

  const renderDiagnostic = root.render(element, callback);
  const renderDiagnosticPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      renderDiagnostic
    );
  const render = renderDiagnosticPayload.renderRecord;
  const renderPayload = rootBridge.getPrivateRootRecordPayload(render);
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      renderDiagnosticPayload.hostOutputHandoff
    );
  const renderSnapshot = renderDiagnostic.sourceContainerSnapshot;
  const renderSnapshotPayload =
    rootBridge.getPrivateRootPublicFacadeLifecycleContainerSnapshotPayload(
      renderSnapshot
    );
  const renderLifecycleBoundary = renderDiagnostic.lifecycleRequestBoundary;
  const renderLifecycleBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      renderLifecycleBoundary
    );
  const hostNode = hostOutputPayload.hostNode;
  const textNode = hostOutputPayload.textNode;

  assert.equal(
    renderDiagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputRenderRecordType
  );
  assert.equal(
    renderDiagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(renderDiagnostic.renderRequestId, 'facade-request:2');
  assert.equal(renderDiagnostic.renderUpdateId, 'facade-update:1');
  assert.equal(
    renderDiagnostic.lifecycleRequestAdmission,
    renderDiagnosticPayload.lifecycleRequestAdmission
  );
  assert.equal(
    renderDiagnostic.lifecycleRequestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    renderDiagnostic.lifecycleRequestBoundary,
    renderLifecycleBoundary
  );
  assert.equal(
    renderDiagnostic.lifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(renderDiagnostic.lifecycleRequestBoundaryAccepted, true);
  assert.equal(renderDiagnostic.lifecycleRequestBoundarySourceOwned, true);
  assert.equal(renderDiagnostic.lifecycleRequestBoundaryCurrent, true);
  assert.equal(renderDiagnostic.hostType, 'span');
  assert.equal(renderDiagnostic.textContent, 'private facade child');
  assert.equal(renderDiagnostic.privateFacadeRoot, true);
  assert.equal(renderDiagnostic.publicRootExecution, false);
  assert.equal(renderDiagnostic.publicRootCompatibilitySurface, false);
  assert.equal(renderDiagnostic.reconcilerExecution, false);
  assert.equal(renderDiagnostic.fakeDomMutation, true);
  assert.equal(renderDiagnostic.browserDomMutation, false);
  assert.equal(renderDiagnostic.compatibilityClaimed, false);
  assert.equal(
    renderDiagnostic.sourceContainerSnapshotStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_LIFECYCLE_CONTAINER_SNAPSHOT_ACCEPTED
  );
  assert.equal(renderDiagnostic.sourceContainerSnapshotPhase, 'render');
  assert.equal(renderDiagnostic.sourceContainerSnapshotOwned, true);
  assert.equal(renderDiagnostic.sourceContainerSnapshotBeforeChildCount, 0);
  assert.equal(renderDiagnostic.sourceContainerSnapshotAfterChildCount, 1);
  assert.equal(
    renderDiagnostic.sourceContainerSnapshotMarkerListenerPreserved,
    true
  );
  assert.equal(
    renderSnapshot.$$typeof,
    rootBridge.privateRootPublicFacadeLifecycleContainerSnapshotRecordType
  );
  assert.equal(renderSnapshot.phase, 'render');
  assert.equal(renderSnapshot.sourceOwned, true);
  assert.equal(renderSnapshot.beforeChildCount, 0);
  assert.equal(renderSnapshot.afterChildCount, 1);
  assert.equal(renderSnapshotPayload.sourceRecord, render);
  assert.equal(renderSnapshotPayload.createRecord, create);
  assert.equal(renderSnapshotPayload.before.childCount, 0);
  assert.equal(renderSnapshotPayload.after.childCount, 1);
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      renderLifecycleBoundary
    ),
    true
  );
  assert.equal(renderLifecycleBoundary.sourceRequestId, render.requestId);
  assert.equal(renderLifecycleBoundary.sourceRequestType, 'root.render');
  assert.equal(renderLifecycleBoundary.sourceOwned, true);
  assert.equal(renderLifecycleBoundary.activeRootLifecycle, true);
  assert.equal(renderLifecycleBoundary.requestBoundaryCurrent, true);
  assert.equal(
    renderLifecycleBoundaryPayload.sourceRecord,
    render
  );
  assert.equal(
    renderLifecycleBoundaryPayload.admissionRecord,
    renderDiagnosticPayload.lifecycleRequestAdmission
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      renderDiagnosticPayload.lifecycleRequestAdmission,
      renderLifecycleBoundary
    ),
    true
  );
  assert.equal(render.$$typeof, rootBridge.privateRootUpdateRecordType);
  assert.equal(render.requestType, 'root.render');
  assert.equal(render.updateId, 'facade-update:1');
  assert.equal(render.lifecycleStatusBefore, rootBridge.ROOT_LIFECYCLE_CREATED);
  assert.equal(render.lifecycleStatusAfter, rootBridge.ROOT_LIFECYCLE_RENDERED);
  assert.equal(renderPayload.element, element);
  assert.equal(renderPayload.callback, callback);
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild, hostNode);
  assert.equal(hostNode.nodeName, 'SPAN');
  assert.equal(hostNode.firstChild, textNode);
  assert.equal(textNode.nodeValue, 'private facade child');
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), create.owner);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), element.props);

  const unmount = root.unmount(unmountCallback);
  const unmountPayload = rootBridge.getPrivateRootRecordPayload(unmount);
  assert.equal(unmount.requestType, 'root.unmount');
  assert.equal(unmount.updateId, 'facade-update:2');
  assert.equal(
    unmount.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    unmount.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(unmount.sync, true);
  assert.equal(unmount.noOp, false);
  assert.equal(unmountPayload.callback, unmountCallback);

  const secondUnmount = root.unmount();
  assert.equal(secondUnmount.requestType, 'root.unmount');
  assert.equal(secondUnmount.noOp, true);
  assert.equal(secondUnmount.sync, false);
  assert.throws(() => root.render(element), {
    code: 'FAST_REACT_DOM_UNMOUNTED_ROOT'
  });

  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    render,
    unmount,
    secondUnmount
  ]);
  assert.deepEqual(adapter.getRootPayload(root).renderRecords, [render]);
  assert.deepEqual(
    adapter.getRootPayload(root).lifecycleRequestBoundaryRecords,
    [renderLifecycleBoundary]
  );
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [
    renderDiagnostic
  ]);
  assert.deepEqual(adapter.getRootPayload(root).unmountRecords, [
    unmount,
    secondUnmount
  ]);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeAdapterPayload(adapter).rootCount,
    1
  );
  assert.equal(rootBridge.getPrivateRootPublicFacadeRootPayload({}), null);
  assert.equal(rootBridge.getPrivateRootPublicFacadeAdapterPayload({}), null);

  const otherAdapter = descriptor.value();
  assert.throws(() => otherAdapter.getRootCreateRecord(root), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => adapter.getRootCreateRecord({}), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_ADAPTER'
  });
  const cleanup = renderDiagnosticPayload.bridge.cleanupInitialRenderHostOutput(
    renderDiagnosticPayload.hostOutputHandoff
  );
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED
  );
  assert.equal(container.childNodes.length, 0);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);
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
});

test('private react-dom/client facade root.render lifecycle update mutates fake DOM', () => {
  const document = createDocument(
    'private-client-facade-root-render-lifecycle-update'
  );
  const container = createElement('DIV', document);
  const initialElement = {
    props: {
      children: 'initial lifecycle output',
      id: 'facade-lifecycle-host',
      'data-phase': 'initial'
    },
    type: 'article'
  };
  const nextElement = {
    props: {
      children: 'updated lifecycle output',
      id: 'facade-lifecycle-host',
      'data-phase': 'updated',
      title: 'Updated lifecycle host'
    },
    type: 'article'
  };
  const updateCallback = function afterPrivateFacadeLifecycleUpdate() {};
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: 'facade-lifecycle-update-handoff',
    initialHostOutputIdPrefix: 'facade-lifecycle-initial',
    nativeEnvironmentId: 869,
    nativeHandoffIdPrefix: 'facade-lifecycle-native',
    publicFacadeHostOutputRenderIdPrefix: 'facade-lifecycle-render',
    publicFacadeHostOutputUpdateIdPrefix: 'facade-lifecycle-update',
    requestIdPrefix: 'facade-lifecycle-request',
    rootIdPrefix: 'facade-lifecycle-root',
    updateIdPrefix: 'facade-lifecycle-update-id'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const initialDiagnostic = root.render(initialElement);
  const initialPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      initialDiagnostic
    );
  const initialHandoffPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      initialPayload.hostOutputHandoff
    );
  const hostNode = initialHandoffPayload.hostNode;
  const textNode = initialHandoffPayload.textNode;

  const updateDiagnostic = root.render(nextElement, updateCallback);
  const updatePayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload(
      updateDiagnostic
    );
  const updateRecord = updatePayload.updateRecord;
  const snapshot = updateDiagnostic.sourceContainerSnapshot;
  const snapshotPayload =
    rootBridge.getPrivateRootPublicFacadeLifecycleContainerSnapshotPayload(
      snapshot
    );
  const updateLifecycleBoundary =
    updateDiagnostic.lifecycleRequestBoundary;
  const updateLifecycleBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      updateLifecycleBoundary
    );

  assert.equal(
    initialDiagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputRenderRecordType
  );
  assert.equal(
    updateDiagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputUpdateRecordType
  );
  assert.equal(
    updateDiagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(updateDiagnostic.updateRequestId, 'facade-lifecycle-request:3');
  assert.equal(updateDiagnostic.updateRequestType, 'root.render');
  assert.equal(updateDiagnostic.updateUpdateId, 'facade-lifecycle-update-id:2');
  assert.equal(
    updateDiagnostic.lifecycleRequestAdmission,
    updatePayload.lifecycleRequestAdmission
  );
  assert.equal(
    updateDiagnostic.lifecycleRequestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    updateDiagnostic.lifecycleRequestBoundary,
    updateLifecycleBoundary
  );
  assert.equal(
    updateDiagnostic.lifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(updateDiagnostic.lifecycleRequestBoundaryAccepted, true);
  assert.equal(updateDiagnostic.lifecycleRequestBoundarySourceOwned, true);
  assert.equal(updateDiagnostic.lifecycleRequestBoundaryCurrent, true);
  assert.equal(updateDiagnostic.lifecycleContainerSnapshotCurrent, true);
  assert.equal(updateDiagnostic.hostOutputUpdateCurrent, true);
  assert.equal(updateDiagnostic.rootCommitHostComponentUpdateCurrent, false);
  assert.equal(updateDiagnostic.updateNativeHandoffCurrent, true);
  assert.equal(
    updateDiagnostic.updateLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    updateDiagnostic.updateLifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(updateDiagnostic.hostType, 'article');
  assert.equal(updateDiagnostic.textContent, 'updated lifecycle output');
  assert.equal(updateDiagnostic.fakeDomMutation, true);
  assert.equal(updateDiagnostic.browserDomMutation, false);
  assert.equal(updateDiagnostic.markerWrites, false);
  assert.equal(updateDiagnostic.listenerInstallation, false);
  assert.equal(updatePayload.callback, updateCallback);
  assert.equal(updatePayload.element, nextElement);
  assert.equal(updatePayload.createRecord, create);
  assert.equal(updatePayload.hostOutputRenderDiagnostic, initialDiagnostic);
  assert.equal(updatePayload.nativeHandoffPayload.sourceRecord, updateRecord);
  assert.equal(updatePayload.nativeHandoffPayload.value, nextElement);

  assert.equal(
    snapshot.$$typeof,
    rootBridge.privateRootPublicFacadeLifecycleContainerSnapshotRecordType
  );
  assert.equal(
    snapshot.snapshotStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_LIFECYCLE_CONTAINER_SNAPSHOT_ACCEPTED
  );
  assert.equal(
    updateDiagnostic.sourceContainerSnapshotStatus,
    snapshot.snapshotStatus
  );
  assert.equal(updateDiagnostic.sourceContainerSnapshotPhase, 'update');
  assert.equal(updateDiagnostic.sourceContainerSnapshotOwned, true);
  assert.equal(updateDiagnostic.sourceContainerSnapshotBeforeChildCount, 1);
  assert.equal(updateDiagnostic.sourceContainerSnapshotAfterChildCount, 1);
  assert.equal(
    updateDiagnostic.sourceContainerSnapshotMarkerListenerPreserved,
    true
  );
  assert.equal(snapshot.phase, 'update');
  assert.equal(snapshot.sourceOwned, true);
  assert.equal(snapshot.sourceRequestId, updateRecord.requestId);
  assert.equal(snapshot.sourceRequestType, 'root.render');
  assert.equal(snapshot.beforeChildCount, 1);
  assert.equal(snapshot.afterChildCount, 1);
  assert.equal(snapshot.beforeTextContent, 'initial lifecycle output');
  assert.equal(snapshot.afterTextContent, 'updated lifecycle output');
  assert.equal(snapshot.markerListenerStatePreserved, true);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeLifecycleContainerSnapshotRecord(
      snapshot
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeLifecycleContainerSnapshotRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeLifecycleContainerSnapshotPayload({}),
    null
  );
  assert.equal(snapshotPayload.sourceRecord, updateRecord);
  assert.equal(snapshotPayload.createRecord, create);
  assert.equal(snapshotPayload.container, container);
  assert.equal(snapshotPayload.before.childCount, 1);
  assert.equal(snapshotPayload.after.childCount, 1);
  assert.equal(snapshotPayload.before.textContent, 'initial lifecycle output');
  assert.equal(snapshotPayload.after.textContent, 'updated lifecycle output');
  assert.equal(updatePayload.sourceContainerSnapshot, snapshot);
  assert.equal(updatePayload.sourceContainerSnapshotPayload, snapshotPayload);
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      updateLifecycleBoundary
    ),
    true
  );
  assert.equal(updateLifecycleBoundary.sourceRequestId, updateRecord.requestId);
  assert.equal(updateLifecycleBoundary.sourceRequestType, 'root.render');
  assert.equal(updateLifecycleBoundary.sourceOwned, true);
  assert.equal(updateLifecycleBoundary.activeRootLifecycle, true);
  assert.equal(updateLifecycleBoundary.requestBoundaryCurrent, true);
  assert.equal(updateLifecycleBoundaryPayload.sourceRecord, updateRecord);
  assert.equal(
    updateLifecycleBoundaryPayload.admissionRecord,
    updatePayload.lifecycleRequestAdmission
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      updatePayload.lifecycleRequestAdmission,
      updateLifecycleBoundary
    ),
    true
  );

  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    initialPayload.renderRecord,
    updateRecord
  ]);
  assert.deepEqual(adapter.getRootPayload(root).renderRecords, [
    initialPayload.renderRecord,
    updateRecord
  ]);
  assert.deepEqual(
    adapter.getRootPayload(root).lifecycleRequestBoundaryRecords,
    [
      initialPayload.lifecycleRequestBoundary,
      updateLifecycleBoundary
    ]
  );
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [
    initialDiagnostic
  ]);
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), [
    updateDiagnostic
  ]);

  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild, hostNode);
  assert.equal(hostNode.firstChild, textNode);
  assert.equal(hostNode.textContent, 'updated lifecycle output');
  assert.equal(textNode.nodeValue, 'updated lifecycle output');
  assert.deepEqual(attributeEntries(hostNode), [
    ['data-phase', 'updated'],
    ['id', 'facade-lifecycle-host'],
    ['title', 'Updated lifecycle host']
  ]);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), create.owner);
  assert.equal(
    componentTree.getLatestPropsFromNode(hostNode),
    nextElement.props
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);

  const cleanup = initialPayload.bridge.cleanupInitialRenderHostOutput(
    initialPayload.hostOutputHandoff
  );
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED
  );
  assert.equal(container.childNodes.length, 0);
});

test('private react-dom/client facade root.render consumes source-owned HostComponent and HostText update execution', () => {
  const document = createDocument(
    'private-client-facade-root-render-update-execution'
  );
  const container = createElement('DIV', document);
  const initialElement = {
    props: createHostOutputProps('initial'),
    type: 'article'
  };
  const nextElement = {
    props: createHostOutputProps('updated'),
    type: 'article'
  };
  const updateCallback = function afterRootUpdateExecution() {};
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: 'facade-update-execution-handoff',
    nativeEnvironmentId: 880,
    nativeHandoffIdPrefix: 'facade-update-execution-native',
    publicFacadeHostOutputRenderIdPrefix: 'facade-update-execution-render',
    publicFacadeHostOutputUpdateIdPrefix: 'facade-update-execution',
    requestIdPrefix: 'facade-update-execution-request',
    rootCommitHostComponentUpdateIdPrefix:
      'facade-update-execution-root-commit',
    rootIdPrefix: 'facade-update-execution-root',
    updateIdPrefix: 'facade-update-execution-update'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const initialDiagnostic = root.render(initialElement);
  const initialPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      initialDiagnostic
    );

  const updateDiagnostic = root.render(nextElement, {
    callback: updateCallback,
    rootCommitHostComponentUpdateExecutionFactory(context) {
      return context.createRootCommitHostComponentUpdateExecutionRecord({
        mutationApplyRecords: [
          context.createRootCommitHostComponentUpdateRow(
            createRootCommitHostComponentUpdateRecord({
              recordIndex: 0,
              stateNodeRaw: 901
            })
          ),
          context.createRootCommitHostTextUpdateRow(
            createRootCommitHostTextUpdateRecord({
              recordIndex: 1,
              stateNodeRaw: 902
            })
          )
        ]
      });
    }
  });
  const updatePayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload(
      updateDiagnostic
    );
  const executionRecord =
    updateDiagnostic.rootCommitHostComponentUpdateExecutionRecord;
  const executionPayload =
    rootBridge.getPrivateRootPublicFacadeRootCommitHostComponentUpdateExecutionPayload(
      executionRecord
    );
  const rootCommitPayload =
    updatePayload.rootCommitHostComponentUpdatePayload;
  const updateRecord = updatePayload.updateRecord;
  const hostNode =
    updatePayload.initialHostOutputPayload.hostNode;
  const textNode =
    updatePayload.initialHostOutputPayload.textNode;

  assert.equal(
    updateDiagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputUpdateRecordType
  );
  assert.equal(
    executionRecord.$$typeof,
    rootBridge
      .privateRootPublicFacadeRootCommitHostComponentUpdateExecutionRecordType
  );
  assert.equal(
    executionRecord.executionStatus,
    rootBridge
      .ROOT_BRIDGE_PUBLIC_FACADE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_EXECUTION_ACCEPTED
  );
  assert.equal(executionRecord.sourceOwned, true);
  assert.equal(executionRecord.sourceUpdateId, updateRecord.updateId);
  assert.equal(executionRecord.rootId, create.rootId);
  assert.equal(executionRecord.hostTag, 'article');
  assert.equal(executionRecord.rootCommitMetadataRecordCount, 2);
  assert.equal(executionRecord.rootCommitHostComponentUpdateRecordCount, 1);
  assert.equal(executionRecord.rootCommitHostTextUpdateRecordCount, 1);
  assert.equal(executionRecord.fakeDomMutation, false);
  assert.equal(executionRecord.nativeExecution, false);
  assert.equal(executionRecord.reconcilerExecution, false);
  assert.equal(executionRecord.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeRootCommitHostComponentUpdateExecutionRecord(
      executionRecord
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeRootCommitHostComponentUpdateExecutionRecord(
      {}
    ),
    false
  );

  assert.equal(
    updateDiagnostic.rootCommitHostComponentUpdateExecutionStatus,
    executionRecord.executionStatus
  );
  assert.equal(
    updateDiagnostic.rootCommitHostComponentUpdateExecutionConsumed,
    true
  );
  assert.equal(
    updateDiagnostic.rootCommitHostComponentUpdateHandoffId,
    'facade-update-execution-root-commit:1'
  );
  assert.equal(
    updateDiagnostic.rootCommitHostComponentUpdateStatus,
    rootBridge.ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_APPLIED
  );
  assert.equal(
    updateDiagnostic.rootCommitHostComponentUpdateRecordCount,
    1
  );
  assert.equal(updateDiagnostic.rootCommitHostTextUpdateRecordCount, 1);
  assert.equal(updateDiagnostic.rootCommitHostTextUpdate.tag, 'HostText');
  assert.equal(
    updateDiagnostic.hostOutputUpdateHandoffId,
    'facade-update-execution-handoff:1'
  );
  assert.equal(
    updateDiagnostic.nativeHandoffId,
    'facade-update-execution-native:3'
  );
  assert.equal(updateDiagnostic.nativeUpdateRequestMirrored, true);
  assert.equal(
    updateDiagnostic.rustRootCommitUpdateExecutionMetadataAccepted,
    true
  );
  assert.equal(
    updateDiagnostic.rootCommitUpdateExecutionBeforeNativeHandoff,
    true
  );
  assert.equal(updateDiagnostic.lifecycleContainerSnapshotCurrent, true);
  assert.equal(updateDiagnostic.hostOutputUpdateCurrent, true);
  assert.equal(updateDiagnostic.rootCommitHostComponentUpdateCurrent, true);
  assert.equal(updateDiagnostic.updateNativeHandoffCurrent, true);
  assert.equal(updateDiagnostic.nativeExecution, false);
  assert.equal(updateDiagnostic.reconcilerExecution, false);
  assert.equal(updateDiagnostic.browserDomMutation, false);
  assert.equal(updateDiagnostic.compatibilityClaimed, false);
  assert.deepEqual(
    updateDiagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'public-facade-initial-host-output-render',
      'public-facade-root-render-update-record',
      'private-native-update-request-handoff',
      'host-output-update-handoff',
      'source-owned-root-commit-host-component-update-execution',
      'root-commit-host-component-update-metadata',
      'root-commit-host-text-update-metadata',
      'fake-dom-property-update',
      'property-payload-evidence',
      'fake-dom-text-update',
      'latest-props-after-mutation',
      'attribute-payload-rows'
    ]
  );

  assert.equal(updatePayload.callback, updateCallback);
  assert.equal(updatePayload.element, nextElement);
  assert.equal(updatePayload.createRecord, create);
  assert.equal(updatePayload.rootCommitHostComponentUpdateExecutionRecord, executionRecord);
  assert.equal(updatePayload.rootCommitHostComponentUpdateExecutionPayload, executionPayload);
  assert.equal(executionPayload.consumed, true);
  assert.equal(executionPayload.rootCommitMetadataSelection.recordIndex, 0);
  assert.equal(
    executionPayload.rootCommitTextMetadataSelection.recordIndex,
    1
  );
  assert.equal(rootCommitPayload.sourceRecord, updateRecord);
  assert.equal(
    rootCommitPayload.hostOutputHandoff,
    updatePayload.hostOutputUpdateHandoff
  );
  assert.equal(
    rootCommitPayload.selectedRootCommitRecord,
    executionPayload.rootCommitMetadataSelection.record
  );
  assert.equal(
    rootCommitPayload.selectedRootCommitTextRecord,
    executionPayload.rootCommitTextMetadataSelection.record
  );
  assert.equal(
    updatePayload.nativeHandoffPayload.sourceRecord,
    updateRecord
  );
  assert.equal(updatePayload.nativeHandoffPayload.value, nextElement);
  assert.equal(
    updatePayload.sourceContainerSnapshot.beforeTextContent,
    'hello'
  );
  assert.equal(
    updatePayload.sourceContainerSnapshot.afterTextContent,
    'goodbye'
  );

  assert.equal(container.firstChild, hostNode);
  assert.equal(hostNode.firstChild, textNode);
  assert.equal(hostNode.textContent, 'goodbye');
  assert.equal(textNode.nodeValue, 'goodbye');
  assert.deepEqual(attributeEntries(hostNode), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message'],
    ['title', 'updated title']
  ]);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), nextElement.props);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  const cleanup = initialPayload.bridge.cleanupInitialRenderHostOutput(
    initialPayload.hostOutputHandoff
  );
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED
  );
  assert.equal(container.childNodes.length, 0);
});

test('private react-dom/client facade root.render update execution fails closed for stale, cloned, cross-root, and replayed rows', () => {
  const document = createDocument(
    'private-client-facade-root-render-update-execution-negative'
  );
  const container = createElement('DIV', document);
  const crossDocument = createDocument(
    'private-client-facade-root-render-update-execution-cross'
  );
  const crossContainer = createElement('DIV', crossDocument);
  const initialElement = {
    props: createHostOutputProps('initial'),
    type: 'article'
  };
  const nextElement = {
    props: createHostOutputProps('updated'),
    type: 'article'
  };
  const thirdElement = {
    props: {
      ...createHostOutputProps('updated'),
      children: 'third update',
      title: 'Third update'
    },
    type: 'article'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    requestIdPrefix: 'facade-update-exec-negative-request',
    rootIdPrefix: 'facade-update-exec-negative-root',
    updateIdPrefix: 'facade-update-exec-negative-update'
  });
  const root = adapter.createRoot(container);
  const crossRoot = adapter.createRoot(crossContainer);
  const initialDiagnostic = root.render(initialElement);
  const initialPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      initialDiagnostic
    );
  const crossInitialDiagnostic = crossRoot.render(initialElement);
  const crossInitialPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      crossInitialDiagnostic
    );
  let staleExecutionRecord = null;
  let crossExecutionRecord = null;

  assert.throws(
    () =>
      root.render(nextElement, {
        rootCommitHostComponentUpdateMetadataFactory() {
          return {
            mutationApplyRecords: [
              createRootCommitHostComponentUpdateRecord({
                recordIndex: 0,
                stateNodeRaw: 901
              }),
              createRootCommitHostTextUpdateRecord({
                recordIndex: 1,
                stateNodeRaw: 902
              })
            ]
          };
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /caller-built HostComponent\/HostText update row/
    }
  );
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), []);
  assert.equal(container.textContent, 'hello');

  assert.throws(
    () =>
      root.render(nextElement, {
        rootCommitHostComponentUpdateExecutionFactory(context) {
          staleExecutionRecord =
            context.createRootCommitHostComponentUpdateExecutionRecord({
              mutationApplyRecords: [
                context.createRootCommitHostComponentUpdateRow(
                  createRootCommitHostComponentUpdateRecord({
                    recordIndex: 0,
                    stateNodeRaw: 901
                  })
                ),
                context.createRootCommitHostTextUpdateRow(
                  createRootCommitHostTextUpdateRecord({
                    recordIndex: 1,
                    stateNodeRaw: 902
                  })
                )
              ]
            });
          return Object.freeze({...staleExecutionRecord});
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /intact source-owned/
    }
  );
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), []);
  assert.equal(container.textContent, 'hello');

  assert.throws(
    () =>
      crossRoot.render(nextElement, {
        rootCommitHostComponentUpdateExecutionFactory(context) {
          crossExecutionRecord =
            context.createRootCommitHostComponentUpdateExecutionRecord({
              mutationApplyRecords: [
                context.createRootCommitHostComponentUpdateRow(
                  createRootCommitHostComponentUpdateRecord({
                    recordIndex: 0,
                    stateNodeRaw: 901
                  })
                ),
                context.createRootCommitHostTextUpdateRow(
                  createRootCommitHostTextUpdateRecord({
                    recordIndex: 1,
                    stateNodeRaw: 902
                  })
                )
              ]
            });
          return Object.freeze({...crossExecutionRecord});
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /intact source-owned/
    }
  );
  assert.throws(
    () =>
      root.render(nextElement, {
        rootCommitHostComponentUpdateExecutionRecord: crossExecutionRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /stale, cross-root, cloned, or caller-built/
    }
  );
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), []);
  assert.equal(container.textContent, 'hello');
  assert.equal(crossContainer.textContent, 'hello');

  const updateDiagnostic = root.render(nextElement, {
    rootCommitHostComponentUpdateExecutionFactory(context) {
      return context.createRootCommitHostComponentUpdateExecutionRecord({
        mutationApplyRecords: [
          context.createRootCommitHostComponentUpdateRow(
            createRootCommitHostComponentUpdateRecord({
              recordIndex: 0,
              stateNodeRaw: 901
            })
          ),
          context.createRootCommitHostTextUpdateRow(
            createRootCommitHostTextUpdateRecord({
              recordIndex: 1,
              stateNodeRaw: 902
            })
          )
        ]
      });
    }
  });
  const consumedExecutionRecord =
    updateDiagnostic.rootCommitHostComponentUpdateExecutionRecord;
  assert.equal(container.textContent, 'goodbye');

  assert.throws(
    () =>
      root.render(thirdElement, {
        rootCommitHostComponentUpdateExecutionRecord: staleExecutionRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /stale, cross-root, cloned, or caller-built/
    }
  );
  assert.throws(
    () =>
      root.render(thirdElement, {
        rootCommitHostComponentUpdateExecutionRecord:
          consumedExecutionRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /replayed root HostComponent update execution record/
    }
  );

  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), [
    updateDiagnostic
  ]);
  assert.equal(container.textContent, 'goodbye');
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  initialPayload.bridge.cleanupInitialRenderHostOutput(
    initialPayload.hostOutputHandoff
  );
  crossInitialPayload.bridge.cleanupInitialRenderHostOutput(
    crossInitialPayload.hostOutputHandoff
  );
  assert.equal(container.childNodes.length, 0);
  assert.equal(crossContainer.childNodes.length, 0);
});

test('private react-dom/client facade preflight routes root calls to accepted bridge diagnostics', () => {
  const document = createDocument('private-client-facade-preflight');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'private preflight child'
    },
    type: 'span'
  };
  const callback = function afterPrivatePreflightRender() {};
  const unmountCallback = function afterPrivatePreflightUnmount() {};
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadePreflightSymbol
  );

  assert.equal(Object.hasOwn(reactDomClient, 'rootPublicFacadePreflight'), false);
  assert.equal(
    Object.hasOwn(
      reactDomClient,
      '__FAST_REACT_PRIVATE_ROOT_PUBLIC_FACADE_PREFLIGHT__'
    ),
    false
  );
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.value, rootBridge.createPrivateRootPublicFacadePreflight);
  assert.equal(
    Object.getOwnPropertyDescriptor(
      reactDomClient.hydrateRoot,
      rootBridge.privateRootPublicFacadePreflightSymbol
    ),
    undefined
  );

  const preflight = descriptor.value({
    nativeEnvironmentId: 427,
    nativeHandoffIdPrefix: 'preflight-native',
    publicFacadePreflightIdPrefix: 'preflight',
    requestIdPrefix: 'preflight-request',
    rootIdPrefix: 'preflight-root',
    updateIdPrefix: 'preflight-update'
  });
  assert.equal(
    preflight.$$typeof,
    rootBridge.privateRootPublicFacadePreflightType
  );
  assert.equal(preflight.kind, 'FastReactDomPrivateRootPublicFacadePreflight');
  assert.equal(preflight.entrypoint, 'react-dom/client');
  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicHydrateRootEnabled, false);
  assert.equal(preflight.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.domMutation, false);
  assert.equal(preflight.markerWrites, false);
  assert.equal(preflight.listenerInstallation, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(preflight.createRoot.length, 2);
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflight(preflight), true);
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflight({}), false);
  assert.equal(Object.isFrozen(preflight), true);

  const root = preflight.createRoot(container, {
    identifierPrefix: 'private-preflight-'
  });
  const createPreflight = preflight.getRootCreatePreflight(root);
  const createPayload =
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(
      createPreflight
    );
  const rootPayload =
    rootBridge.getPrivateRootPublicFacadePreflightRootPayload(root);

  assert.equal(Object.isFrozen(root), true);
  assert.deepEqual(Object.keys(root), ['render', 'unmount']);
  assert.equal(root.render.length, 1);
  assert.equal(root.unmount.length, 0);
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflightRoot(root), true);
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflightRoot({}), false);
  assert.equal(
    rootPayload.rootType,
    rootBridge.privateRootPublicFacadePreflightRootType
  );
  assert.equal(rootPayload.root, root);
  assert.equal(rootPayload.createPreflight, createPreflight);
  assert.deepEqual(rootPayload.preflightRecords, [createPreflight]);
  assert.equal(Object.isFrozen(rootPayload.preflightRecords), true);

  assertPrivatePublicFacadePreflightRecord(createPreflight, {
    facadeCall: 'createRoot',
    nativeHandoffId: 'preflight-native:1',
    operation: 'create',
    preflightId: 'preflight:1',
    requestId: 'preflight-request:1',
    requestType: 'createRoot'
  });
  assert.equal(createPreflight.rootId, 'preflight-root:1');
  assert.equal(createPayload.requestRecord, rootPayload.createRecord);
  assert.equal(createPayload.requestAdmission, createPreflight.requestAdmission);
  assert.equal(createPayload.nativeHandoffRecord, createPreflight.nativeHandoffRecord);
  assert.equal(createPayload.root, root);
  assertBridgeDidNotTouchContainer(container, document);

  const renderPreflight = root.render(element, callback);
  const renderPayload =
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(
      renderPreflight
    );
  assertPrivatePublicFacadePreflightRecord(renderPreflight, {
    facadeCall: 'root.render',
    nativeHandoffId: 'preflight-native:2',
    operation: 'render',
    preflightId: 'preflight:2',
    requestId: 'preflight-request:2',
    requestType: 'root.render'
  });
  assert.equal(renderPreflight.updateId, 'preflight-update:1');
  assert.equal(
    renderPreflight.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_CREATED
  );
  assert.equal(
    renderPreflight.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(renderPayload.requestRecord.updateId, 'preflight-update:1');
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(renderPayload.requestRecord).element,
    element
  );
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(renderPayload.requestRecord).callback,
    callback
  );

  const unmountPreflight = root.unmount(unmountCallback);
  const unmountPayload =
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(
      unmountPreflight
    );
  assertPrivatePublicFacadePreflightRecord(unmountPreflight, {
    facadeCall: 'root.unmount',
    nativeHandoffId: 'preflight-native:3',
    operation: 'unmount',
    preflightId: 'preflight:3',
    requestId: 'preflight-request:3',
    requestType: 'root.unmount'
  });
  assert.equal(unmountPreflight.updateId, 'preflight-update:2');
  assert.equal(unmountPreflight.noOp, false);
  assert.equal(unmountPreflight.sync, true);
  assert.equal(
    unmountPreflight.lifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    unmountPreflight.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNMOUNTED
  );
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(unmountPayload.requestRecord).callback,
    unmountCallback
  );

  const secondUnmountPreflight = root.unmount();
  assertPrivatePublicFacadePreflightRecord(secondUnmountPreflight, {
    facadeCall: 'root.unmount',
    nativeHandoffId: 'preflight-native:4',
    operation: 'unmount',
    preflightId: 'preflight:4',
    requestId: 'preflight-request:4',
    requestType: 'root.unmount'
  });
  assert.equal(secondUnmountPreflight.noOp, true);
  assert.equal(secondUnmountPreflight.sync, false);
  assert.throws(() => root.render(element), {
    code: 'FAST_REACT_DOM_UNMOUNTED_ROOT'
  });

  assert.deepEqual(preflight.getRootPreflightRecords(root), [
    createPreflight,
    renderPreflight,
    unmountPreflight,
    secondUnmountPreflight
  ]);
  assert.deepEqual(preflight.getRootRequestRecords(root), [
    rootPayload.createRecord,
    renderPayload.requestRecord,
    unmountPayload.requestRecord,
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(
      secondUnmountPreflight
    ).requestRecord
  ]);
  assert.deepEqual(preflight.getRootPayload(root).renderPreflights, [
    renderPreflight
  ]);
  assert.deepEqual(preflight.getRootPayload(root).unmountPreflights, [
    unmountPreflight,
    secondUnmountPreflight
  ]);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight)
      .preflightRecordCount,
    4
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight).rootCount,
    1
  );
  assert.equal(rootBridge.getPrivateRootPublicFacadePreflightPayload({}), null);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload({}),
    null
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightRootPayload({}),
    null
  );

  const otherPreflight = descriptor.value();
  assert.throws(() => otherPreflight.getRootCreatePreflight(root), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => preflight.getRootCreatePreflight({}), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
  });
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client facade preflight accepts live container only as blocked evidence', () => {
  const {container, document} = createLiveRootContainerPreflightTarget(
    'private-client-live-container-preflight'
  );
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadePreflightSymbol
  );
  const preflight = descriptor.value({
    rootLiveContainerPreflightIdPrefix: 'live-container-preflight'
  });

  const record = preflight.preflightLiveContainer(container, {
    containerId: 'live-container:1',
    explicitAdmission: true
  });
  const payload =
    rootBridge.getPrivateRootLiveContainerPreflightPayload(record);

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    record.$$typeof,
    rootBridge.privateRootLiveContainerPreflightRecordType
  );
  assert.equal(
    record.kind,
    'FastReactDomPrivateRootLiveContainerPreflightRecord'
  );
  assert.equal(record.operation, 'root-live-container-preflight');
  assert.equal(record.entrypoint, 'react-dom/client');
  assert.equal(record.preflightId, 'live-container-preflight:1');
  assert.equal(
    record.preflightStatus,
    rootBridge.ROOT_BRIDGE_LIVE_CONTAINER_PREFLIGHT_BLOCKED
  );
  assert.equal(record.executionStatus, rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED);
  assert.equal(
    record.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.deepEqual(record.admission, {
    preflightKind: 'deterministic-react-dom-root-live-container-preflight',
    containerKind: 'react-dom-root-live-container-preflight',
    containerId: 'live-container:1',
    explicitAdmission: true,
    deterministicMetadataOnly: true,
    liveContainerPreflightOnly: true,
    liveContainerAcceptedForPreflight: true,
    liveContainerCaptured: false,
    markerWritesAllowed: false,
    listenerInstallationAllowed: false,
    browserDomMutationAllowed: false,
    fakeDomMutationAllowed: false,
    publicCreateRootEnabled: false,
    publicRootExecutionEnabled: false,
    compatibilityClaimed: false
  });
  assert.equal(record.containerInfo.nodeType, ELEMENT_NODE);
  assert.equal(record.ownerDocumentInfo.nodeType, DOCUMENT_NODE);
  assert.equal(record.markerGuard.action, 'defer-mark-container-as-root');
  assert.equal(record.listenerGuard.action, 'defer-listen-to-all-supported-events');
  assert.equal(record.listenerGuard.canInstallRootListeners, true);
  assert.equal(record.listenerGuard.ownerDocumentCanInstallSelectionChange, true);
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      'dom-like-live-container-shape',
      'root-marker-listener-state-snapshot',
      'blocked-live-container-evidence'
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'native-execution',
      'reconciler-execution',
      'marker-writes',
      'listener-installation',
      'browser-dom-mutation',
      'fake-dom-mutation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.deepEqual(record.blockerEvidence.blockerReasons, [
    'live-container-admitted-for-preflight-only',
    'public-create-root-disabled',
    'root-marker-write-disabled',
    'root-listener-installation-disabled',
    'browser-dom-mutation-disabled',
    'fake-dom-render-update-unmount-path-not-entered',
    'native-root-execution-disabled',
    'reconciler-root-execution-disabled',
    'public-root-compatibility-unclaimed'
  ]);
  assert.equal(record.blockerEvidence.liveContainerAcceptedForPreflight, true);
  assert.equal(record.blockerEvidence.liveContainerCaptured, false);
  assert.equal(record.blockerEvidence.markerStateUnchanged, true);
  assert.equal(record.blockerEvidence.rootMarkerPropertyCountBefore, 0);
  assert.equal(record.blockerEvidence.rootMarkerPropertyCountAfter, 0);
  assert.equal(record.blockerEvidence.rootListenerRegistrationCountBefore, 0);
  assert.equal(record.blockerEvidence.rootListenerRegistrationCountAfter, 0);
  assert.equal(
    record.blockerEvidence.ownerDocumentListenerRegistrationCountBefore,
    0
  );
  assert.equal(
    record.blockerEvidence.ownerDocumentListenerRegistrationCountAfter,
    0
  );
  assert.equal(record.blockerEvidence.rootMutationCountBefore, 0);
  assert.equal(record.blockerEvidence.rootMutationCountAfter, 0);
  assert.equal(record.blockerEvidence.ownerDocumentMutationCountBefore, 0);
  assert.equal(record.blockerEvidence.ownerDocumentMutationCountAfter, 0);
  assert.equal(record.liveContainerAcceptedForPreflight, true);
  assert.equal(record.liveContainerCaptured, false);
  assert.equal(record.publicCreateRootEnabled, false);
  assert.equal(record.publicRootExecution, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.rootScheduled, false);
  assert.equal(record.domMutation, false);
  assert.equal(record.fakeDomMutation, false);
  assert.equal(record.browserDomMutation, false);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);

  assert.equal(
    rootBridge.isPrivateRootLiveContainerPreflightRecord(record),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootLiveContainerPreflightRecord({}),
    false
  );
  assert.equal(payload.record, record);
  assert.equal(payload.container, undefined);
  assert.equal(payload.ownerDocument, undefined);
  assert.equal(payload.containerInfo.nodeType, ELEMENT_NODE);
  assert.equal(payload.ownerDocumentInfo.nodeType, DOCUMENT_NODE);
  assert.equal(
    rootBridge.getPrivateRootLiveContainerPreflightPayload({}),
    null
  );
  assert.deepEqual(preflight.getLiveContainerPreflightRecords(), [record]);
  assert.deepEqual(
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight)
      .liveContainerPreflightRecords,
    [record]
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight)
      .liveContainerPreflightRecordCount,
    1
  );

  const serialized = JSON.stringify(record);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__reactContainer$'), false);
  assert.equal(serialized.includes('_reactListening'), false);
  assertBridgeDidNotTouchContainer(container, document);

  assert.throws(
    () =>
      preflight.preflightLiveContainer(container, {
        explicitAdmission: false
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_LIVE_CONTAINER_PREFLIGHT'
    }
  );
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client facade preflights root marker/listener setup and cleanup', () => {
  const document = createDocument('private-client-facade-preflight');
  const container = createElement('DIV', document);
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    publicFacadePreflightIdPrefix: 'facade-preflight',
    requestIdPrefix: 'facade-preflight-request',
    rootIdPrefix: 'facade-preflight-root',
    sideEffectIdPrefix: 'facade-preflight-side-effect'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);

  assertBridgeDidNotTouchContainer(container, document);

  const preflight = adapter.preflightRootMarkerListenerSetupAndCleanup(root);
  const hidden =
    rootBridge.getPrivateRootPublicFacadeMarkerListenerPreflightPayload(
      preflight
    );

  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(
    preflight.$$typeof,
    rootBridge.privateRootPublicFacadeMarkerListenerPreflightRecordType
  );
  assert.equal(
    preflight.kind,
    'FastReactDomPrivateRootPublicFacadeMarkerListenerPreflightRecord'
  );
  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED
  );
  assert.equal(preflight.preflightId, 'facade-preflight:1');
  assert.equal(preflight.rootId, create.rootId);
  assert.equal(preflight.createRequestId, create.requestId);
  assert.equal(
    preflight.sideEffectId,
    'facade-preflight-side-effect:1'
  );
  assert.equal(
    preflight.setupSideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assert.equal(
    preflight.cleanupSideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.equal(
    preflight.markerRecordType,
    rootMarkers.privateRootMarkerMutationRecordType
  );
  assert.equal(preflight.markerStatus, rootMarkers.ROOT_MARKER_APPLIED);
  assert.equal(preflight.markerCleanupStatus, rootMarkers.ROOT_MARKER_REVERTED);
  assert.equal(
    preflight.listenerRegistrationType,
    rootListeners.privateRootListenerRegistrationRecordType
  );
  assert.equal(
    preflight.listenerRegistrationStatus,
    rootListeners.ROOT_LISTENERS_REGISTERED
  );
  assert.equal(
    preflight.listenerCleanupType,
    rootListeners.privateRootListenerCleanupRecordType
  );
  assert.equal(
    preflight.listenerCleanupStatus,
    rootListeners.ROOT_LISTENERS_REVERTED
  );
  assert.deepEqual(
    preflight.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'root-marker-setup-cleanup',
      'root-listener-setup-cleanup'
    ]
  );
  assert.deepEqual(
    preflight.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.deepEqual(preflight.setupPrerequisites, {
    accepted: true,
    markerStatus: rootMarkers.ROOT_MARKER_APPLIED,
    listenerRegistrationStatus: rootListeners.ROOT_LISTENERS_REGISTERED,
    rootMarkerMatchesOwner: true,
    rootListeningMarkerPresent: true,
    ownerDocumentListeningMarkerPresent: true,
    listenerRegistrationCount: 139,
    rootRegistrationCount: 138,
    ownerDocumentRegistrationCount: 1
  });
  assert.deepEqual(preflight.cleanupPrerequisites, {
    accepted: true,
    markerCleanupStatus: rootMarkers.ROOT_MARKER_REVERTED,
    listenerCleanupStatus: rootListeners.ROOT_LISTENERS_REVERTED,
    listenerRemovalCount: 139,
    listenerSetKeyRemovalCount: 139,
    restoredTargetCount: 2,
    restoredInitialMarkerState: true,
    finalRootListeningMarkerPresent: false,
    finalOwnerDocumentListeningMarkerPresent: false
  });
  assert.equal(preflight.beforeState.containerMarker.propertyCount, 0);
  assert.equal(preflight.setupState.containerMarker.truthyCount, 1);
  assert.equal(preflight.setupState.rootListenerRegistrationCount, 138);
  assert.equal(
    preflight.setupState.ownerDocumentListenerRegistrationCount,
    1
  );
  assert.equal(preflight.afterState.containerMarker.propertyCount, 0);
  assert.equal(preflight.afterState.rootListenerRegistrationCount, 0);
  assert.equal(
    preflight.afterState.ownerDocumentListenerRegistrationCount,
    0
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicRootCreated, false);
  assert.equal(preflight.publicRootExecution, false);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.rootScheduled, false);
  assert.equal(preflight.domMutation, false);
  assert.equal(preflight.markerWrites, false);
  assert.equal(preflight.listenerInstallation, false);
  assert.equal(preflight.setupMarkerWrites, true);
  assert.equal(preflight.setupListenerInstallation, true);
  assert.equal(preflight.cleanupCompleted, true);
  assert.equal(preflight.hydration, false);
  assert.equal(preflight.eventDispatch, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(preflight.reversible, false);

  assert.equal(
    rootBridge.isPrivateRootPublicFacadeMarkerListenerPreflightRecord(
      preflight
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeMarkerListenerPreflightRecord({}),
    false
  );
  assert.equal(hidden.adapter, adapter);
  assert.equal(hidden.root, root);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.container, container);
  assert.equal(hidden.ownerDocument, document);
  assert.equal(
    hidden.sideEffectRecord.markerRecord.markerStatus,
    rootMarkers.ROOT_MARKER_APPLIED
  );
  assert.equal(
    hidden.cleanupRecord.listenerCleanup.listenerRemovalCount,
    139
  );
  assert.deepEqual(adapter.getRootMarkerListenerPreflightRecords(root), [
    preflight
  ]);
  assert.deepEqual(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .markerListenerPreflightRecords,
    [preflight]
  );
  assert.equal(
    rootBridge.preflightPrivateRootPublicFacadeMarkerListenerSetup(root)
      .preflightId,
    'facade-preflight:2'
  );

  const serialized = JSON.stringify(preflight);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__FAST_REACT_DOM_EVENT_TARGET__'), false);
  assertBridgeDidNotTouchContainer(container, document);
});

test('private react-dom/client facade host-output diagnostic renders through bridge and fake DOM', () => {
  const document = createDocument('private-client-facade-host-output');
  const container = createElement('DIV', document);
  const callback = function afterPrivateFacadeHostOutputRender() {};
  const element = {
    props: {
      children: 'facade host output',
      id: 'facade-host',
      onClick() {
        return 'not-invoked';
      },
      title: 'Private facade host'
    },
    type: 'main'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: 'facade-host-admission',
    initialHostOutputIdPrefix: 'facade-host-initial',
    publicFacadeHostOutputRenderIdPrefix: 'facade-host-render',
    requestIdPrefix: 'facade-host-request',
    rootIdPrefix: 'facade-host-root',
    sideEffectIdPrefix: 'facade-host-side-effect',
    updateIdPrefix: 'facade-host-update'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);

  const diagnostic = adapter.renderHostOutput(root, element, {
    callback
  });
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(diagnostic);
  const rootPayload = rootBridge.getPrivateRootPublicFacadeRootPayload(root);
  const render = hidden.renderRecord;
  const handoff = hidden.hostOutputHandoff;
  const handoffPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);
  const hostNode = handoffPayload.hostNode;
  const textNode = handoffPayload.textNode;
  const rootWorkLoopRecord = diagnostic.rootWorkLoopFinishedWorkRecord;
  const rootWorkLoopPayload =
    rootBridge.getPrivateRootPublicFacadeRootWorkLoopFinishedWorkPayload(
      rootWorkLoopRecord
    );

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    diagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputRenderRecordType
  );
  assert.equal(
    diagnostic.kind,
    'FastReactDomPrivateRootPublicFacadeHostOutputRenderDiagnosticRecord'
  );
  assert.equal(diagnostic.operation, 'public-facade-host-output-render-diagnostic');
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(diagnostic.diagnosticId, 'facade-host-render:1');
  assert.equal(diagnostic.rootId, 'facade-host-root:1');
  assert.equal(diagnostic.createRequestId, 'facade-host-request:1');
  assert.equal(diagnostic.renderRequestId, 'facade-host-request:2');
  assert.equal(diagnostic.renderUpdateId, 'facade-host-update:1');
  assert.equal(
    diagnostic.renderLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_CREATED
  );
  assert.equal(
    diagnostic.renderLifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(diagnostic.sideEffectId, 'facade-host-side-effect:1');
  assert.equal(
    diagnostic.setupSideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assert.equal(
    diagnostic.cleanupSideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.equal(diagnostic.admissionId, 'facade-host-admission:1');
  assert.equal(
    diagnostic.admissionStatus,
    rootBridge.ROOT_BRIDGE_CREATE_RENDER_ADMITTED
  );
  assert.equal(diagnostic.hostOutputHandoffId, 'facade-host-initial:1');
  assert.equal(
    diagnostic.hostOutputHandoffStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED
  );
  assert.equal(diagnostic.hostType, 'main');
  assert.equal(diagnostic.containerChildCount, 1);
  assert.equal(diagnostic.hostChildCount, 1);
  assert.equal(diagnostic.textContent, 'facade host output');
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkHandoffId,
    'facade-host-update:1:root-work-loop-finished-work'
  );
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ROOT_WORK_LOOP_FINISHED_WORK_ACCEPTED
  );
  assert.equal(diagnostic.rootWorkLoopFinishedWorkRecord, rootWorkLoopRecord);
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkMetadata.status,
    rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS
  );
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkRootChildTag,
    'HostComponent'
  );
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkHostTextChildTag,
    'HostText'
  );
  assert.equal(diagnostic.rootWorkLoopFinishedWorkConsumed, true);
  assert.equal(diagnostic.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'public-facade-root-render-record',
      'root-marker-setup-cleanup',
      'root-listener-setup-cleanup',
      'create-render-admission',
      'fake-dom-host-output-mutation',
      'component-tree-host-instance-map',
      'latest-props-publication',
      'root-work-loop-finished-work-handoff'
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
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
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.fakeDomMutation, true);
  assert.equal(diagnostic.domMutation, true);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.markerWrites, false);
  assert.equal(diagnostic.listenerInstallation, false);
  assert.equal(diagnostic.setupMarkerWrites, true);
  assert.equal(diagnostic.setupListenerInstallation, true);
  assert.equal(diagnostic.cleanupCompleted, true);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.refEffects, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.cleanupRequired, true);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputRenderRecord(diagnostic),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputRenderRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload({}),
    null
  );

  assert.equal(hidden.adapter, adapter);
  assert.equal(hidden.root, root);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.renderRecord, render);
  assert.equal(hidden.admissionRecord.renderRequestId, render.requestId);
  assert.equal(hidden.hostOutputHandoff, handoff);
  assert.equal(hidden.hostOutputPayload, handoffPayload);
  assert.equal(hidden.rootWorkLoopFinishedWorkRecord, rootWorkLoopRecord);
  assert.equal(
    hidden.rootWorkLoopFinishedWorkPayload,
    rootWorkLoopPayload
  );
  assert.equal(rootWorkLoopPayload.createRecord, create);
  assert.equal(rootWorkLoopPayload.renderRecord, render);
  assert.equal(rootWorkLoopPayload.hostOutputHandoff, handoff);
  assert.equal(rootWorkLoopPayload.hostOutputPayload, handoffPayload);
  assert.equal(rootWorkLoopPayload.normalizedMetadata.rootChildTag, 'HostComponent');
  assert.equal(hidden.sideEffectRecord.sideEffectStatus, rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED);
  assert.equal(hidden.sideEffectCleanup.sideEffectStatus, rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED);
  assert.equal(hidden.callback, callback);
  assert.equal(rootBridge.getPrivateRootRecordPayload(render).element, element);
  assert.equal(rootBridge.getPrivateRootRecordPayload(render).callback, callback);
  assert.deepEqual(adapter.getRootRequestRecords(root), [create, render]);
  assert.deepEqual(adapter.getRootPayload(root).renderRecords, [render]);
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [
    diagnostic
  ]);
  assert.deepEqual(rootPayload.hostOutputRenderRecords, [diagnostic]);
  assert.equal(Object.isFrozen(rootWorkLoopRecord), true);
  assert.equal(
    rootWorkLoopRecord.$$typeof,
    rootBridge.privateRootPublicFacadeRootWorkLoopFinishedWorkRecordType
  );
  assert.equal(
    rootWorkLoopRecord.kind,
    'FastReactDomPrivateRootPublicFacadeRootWorkLoopFinishedWorkRecord'
  );
  assert.equal(rootWorkLoopRecord.metadataProvided, false);
  assert.deepEqual(rootWorkLoopRecord.childTags, [
    'HostComponent',
    'HostText'
  ]);
  assert.equal(rootWorkLoopRecord.renderLanes, 'Default');
  assert.equal(rootWorkLoopRecord.finishedLanes, 'Default');
  assert.equal(rootWorkLoopRecord.remainingLanes, 'NoLanes');
  assert.equal(rootWorkLoopRecord.recordsFinishedWork, true);
  assert.equal(rootWorkLoopRecord.pendingWorkMatchesFinishedWork, true);
  assert.equal(rootWorkLoopRecord.consumedFinishedWorkRecord, true);
  assert.equal(rootWorkLoopRecord.commitOrderAfterPendingRecord, true);
  assert.equal(rootWorkLoopRecord.finishedWorkAfterCommit, null);
  assert.equal(rootWorkLoopRecord.finishedLanesAfterCommit, 'NoLanes');
  assert.equal(rootWorkLoopRecord.mutationExecutionBlocked, true);
  assert.equal(rootWorkLoopRecord.publicRootRenderingBlocked, true);
  assert.equal(rootWorkLoopRecord.effectsRefsAndHydrationBlocked, true);
  assert.equal(rootWorkLoopRecord.placementTag, 'HostComponent');
  assert.equal(
    rootWorkLoopRecord.placementApplyKind,
    'append-placement-to-container'
  );
  assert.equal(rootWorkLoopRecord.publicRootExecution, false);
  assert.equal(rootWorkLoopRecord.reconcilerExecution, false);
  assert.equal(rootWorkLoopRecord.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeRootWorkLoopFinishedWorkRecord(
      rootWorkLoopRecord
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeRootWorkLoopFinishedWorkRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeRootWorkLoopFinishedWorkPayload({}),
    null
  );

  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild, hostNode);
  assert.equal(hostNode.nodeName, 'MAIN');
  assert.equal(hostNode.firstChild, textNode);
  assert.equal(hostNode.textContent, 'facade host output');
  assert.deepEqual(attributeEntries(hostNode), [
    ['id', 'facade-host'],
    ['title', 'Private facade host']
  ]);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), create.owner);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), element.props);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);

  const serialized = JSON.stringify(diagnostic);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('not-invoked'), false);
  assert.equal(serialized.includes('facade host output'), true);

  const cleanup = hidden.bridge.cleanupInitialRenderHostOutput(handoff);
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED
  );
  assert.equal(container.childNodes.length, 0);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  const publicContainer = createElement(
    'DIV',
    createDocument('private-client-facade-host-output-public')
  );
  assert.throws(() => reactDomClient.createRoot(publicContainer), {
    code: 'FAST_REACT_UNIMPLEMENTED',
    entrypoint: 'react-dom/client',
    exportName: 'createRoot'
  });
});

test('private react-dom/client facade root.render accepts unkeyed Fragment array host children through fake DOM', () => {
  const document = createDocument('private-client-facade-fragment-array');
  const container = createElement('DIV', document);
  const firstElement = {
    props: {
      children: 'fragment first',
      id: 'fragment-first'
    },
    type: 'header'
  };
  const secondElement = {
    props: {
      children: 'fragment second',
      title: 'Fragment second'
    },
    type: 'main'
  };
  const element = {
    props: {
      children: [firstElement, secondElement]
    },
    type: Symbol.for('react.fragment')
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: 'facade-fragment-admission',
    initialHostOutputIdPrefix: 'facade-fragment-initial',
    publicFacadeHostOutputRenderIdPrefix: 'facade-fragment-render',
    requestIdPrefix: 'facade-fragment-request',
    rootIdPrefix: 'facade-fragment-root',
    sideEffectIdPrefix: 'facade-fragment-side-effect',
    updateIdPrefix: 'facade-fragment-update'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);

  const diagnostic = root.render(element);
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(diagnostic);
  const handoff = hidden.hostOutputHandoff;
  const handoffPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);
  const [firstNode, secondNode] = handoffPayload.hostNodes;
  const [firstText, secondText] = handoffPayload.textNodes;
  const rootWorkLoopRecord = diagnostic.rootWorkLoopFinishedWorkRecord;

  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(diagnostic.hostType, 'Fragment');
  assert.equal(diagnostic.hostOutputShape, 'fragment');
  assert.equal(diagnostic.hostComponentCount, 2);
  assert.equal(diagnostic.hostTextCount, 2);
  assert.equal(diagnostic.containerChildCount, 2);
  assert.equal(diagnostic.hostChildCount, 2);
  assert.equal(diagnostic.textContent, 'fragment firstfragment second');
  assert.deepEqual(diagnostic.childTags, [
    'Fragment',
    'HostComponent',
    'HostText',
    'HostComponent',
    'HostText'
  ]);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'public-facade-root-render-record',
      'root-marker-setup-cleanup',
      'root-listener-setup-cleanup',
      'create-render-admission',
      'fake-dom-host-output-mutation',
      'component-tree-host-instance-map',
      'latest-props-publication',
      'fake-dom-fragment-array-host-children',
      'root-work-loop-finished-work-handoff'
    ]
  );
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.compatibilityClaimed, false);

  assert.equal(handoff.hostOutputShape, 'fragment');
  assert.equal(handoff.hostComponentCount, 2);
  assert.equal(handoff.hostTextCount, 2);
  assert.equal(handoffPayload.hostChildren.length, 2);
  assert.equal(handoffPayload.hostNodes.length, 2);
  assert.equal(handoffPayload.textNodes.length, 2);
  assert.equal(handoffPayload.hostNode, firstNode);
  assert.equal(handoffPayload.textNode, firstText);
  assert.equal(rootWorkLoopRecord.rootChildTag, 'Fragment');
  assert.equal(rootWorkLoopRecord.completedChildTag, 'HostComponent');
  assert.equal(rootWorkLoopRecord.hostTextChildTag, 'HostText');
  assert.deepEqual(rootWorkLoopRecord.childTags, diagnostic.childTags);
  assert.equal(rootWorkLoopRecord.hostOutputShape, 'fragment');
  assert.equal(rootWorkLoopRecord.hostComponentCount, 2);
  assert.equal(rootWorkLoopRecord.hostTextCount, 2);
  assert.equal(rootWorkLoopRecord.placementTag, 'Fragment');
  assert.equal(
    rootWorkLoopRecord.placementApplyKind,
    'append-fragment-children-to-container'
  );
  assert.equal(rootWorkLoopRecord.publicRootRenderingBlocked, true);
  assert.equal(rootWorkLoopRecord.publicRootExecution, false);
  assert.equal(rootWorkLoopRecord.compatibilityClaimed, false);

  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    hidden.renderRecord
  ]);
  assert.equal(container.childNodes.length, 2);
  assert.equal(container.childNodes[0], firstNode);
  assert.equal(container.childNodes[1], secondNode);
  assert.equal(container.textContent, 'fragment firstfragment second');
  assert.equal(firstNode.nodeName, 'HEADER');
  assert.equal(firstNode.firstChild, firstText);
  assert.equal(secondNode.nodeName, 'MAIN');
  assert.equal(secondNode.firstChild, secondText);
  assert.deepEqual(attributeEntries(firstNode), [['id', 'fragment-first']]);
  assert.deepEqual(attributeEntries(secondNode), [
    ['title', 'Fragment second']
  ]);
  assert.equal(componentTree.getRootOwnerFromNode(firstNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(secondNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(firstText), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(secondText), create.owner);
  assert.equal(
    componentTree.getLatestPropsFromNode(firstNode),
    firstElement.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(secondNode),
    secondElement.props
  );

  const cleanup = hidden.bridge.cleanupInitialRenderHostOutput(handoff);
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED
  );
  assert.equal(cleanup.removedRootChildCount, 2);
  assert.equal(cleanup.detachedHostInstanceCount, 4);
  assert.equal(container.childNodes.length, 0);
  assert.equal(componentTree.getRootOwnerFromNode(firstNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(secondNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(firstText), null);
  assert.equal(componentTree.getRootOwnerFromNode(secondText), null);

  const publicContainer = createElement(
    'DIV',
    createDocument('private-client-facade-fragment-array-public')
  );
  assert.throws(() => reactDomClient.createRoot(publicContainer), {
    code: 'FAST_REACT_UNIMPLEMENTED',
    entrypoint: 'react-dom/client',
    exportName: 'createRoot'
  });
});

test('private react-dom/client facade render native handoff consumes facade, work-loop, and fake-DOM metadata', () => {
  const document = createDocument('private-client-facade-render-native-handoff');
  const container = createElement('DIV', document);
  const callback = function afterPrivateRenderNativeHandoff() {};
  const element = {
    props: {
      children: 'native handoff output',
      id: 'native-handoff-host',
      title: 'Private render native handoff'
    },
    type: 'section'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: 'facade-native-admission',
    initialHostOutputIdPrefix: 'facade-native-initial',
    nativeEnvironmentId: 613,
    nativeHandoffIdPrefix: 'facade-native-request',
    publicFacadeHostOutputRenderIdPrefix: 'facade-native-render',
    requestIdPrefix: 'facade-native-request',
    rootIdPrefix: 'facade-native-root',
    rootRenderNativeHandoffIdPrefix: 'facade-native-handoff',
    sideEffectIdPrefix: 'facade-native-side-effect',
    updateIdPrefix: 'facade-native-update'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);

  const handoff = adapter.renderNativeHandoff(root, element, {
    callback
  });
  const hidden =
    rootBridge.getPrivateRootRenderNativeHandoffPayload(handoff);
  const diagnostic = hidden.hostOutputRenderRecord;
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      hidden.hostOutputHandoff
    );
  const rootWorkLoopPayload =
    rootBridge.getPrivateRootPublicFacadeRootWorkLoopFinishedWorkPayload(
      hidden.rootWorkLoopFinishedWorkRecord
    );

  assert.equal(Object.isFrozen(handoff), true);
  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootRenderNativeHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootRenderNativeHandoffRecord'
  );
  assert.equal(handoff.operation, 'private-root-render-native-handoff');
  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_NATIVE_HANDOFF_ACCEPTED
  );
  assert.equal(handoff.handoffId, 'facade-native-handoff:1');
  assert.equal(handoff.sourceDiagnosticId, 'facade-native-render:1');
  assert.equal(
    handoff.sourceDiagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(handoff.rootId, 'facade-native-root:1');
  assert.equal(handoff.createRequestId, 'facade-native-request:1');
  assert.equal(handoff.renderRequestId, 'facade-native-request:2');
  assert.equal(handoff.renderUpdateId, 'facade-native-update:1');
  assert.equal(
    handoff.lifecycleRequestAdmission,
    hidden.lifecycleRequestAdmission
  );
  assert.equal(
    handoff.lifecycleRequestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    handoff.lifecycleRequestBoundary,
    hidden.lifecycleRequestBoundary
  );
  assert.equal(
    handoff.lifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(handoff.lifecycleRequestBoundaryAccepted, true);
  assert.equal(handoff.lifecycleRequestBoundarySourceOwned, true);
  assert.equal(handoff.lifecycleRequestBoundaryCurrent, true);
  assert.equal(handoff.hostOutputHandoffId, 'facade-native-initial:1');
  assert.equal(
    handoff.hostOutputHandoffStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED
  );
  assert.equal(
    handoff.rootWorkLoopFinishedWorkHandoffId,
    'facade-native-update:1:root-work-loop-finished-work'
  );
  assert.equal(handoff.rootWorkLoopFinishedWorkConsumed, true);
  assert.equal(handoff.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.equal(handoff.nativeHandoffId, 'facade-native-request:2');
  assert.equal(
    handoff.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    handoff.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER
  );
  assert.equal(handoff.nativeRequestRecord.environmentId, 613);
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'private-public-facade-root-ownership',
      'public-facade-root-render-record',
      'root-work-loop-finished-work-handoff',
      'fake-dom-initial-host-output-admission',
      'private-native-render-request-handoff'
    ]
  );
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'refs',
      'compatibility-claims'
    ]
  );
  assert.equal(handoff.privateFacadeRoot, true);
  assert.equal(handoff.facadeOwnershipValidated, true);
  assert.equal(handoff.rootWorkLoopEvidenceAccepted, true);
  assert.equal(handoff.fakeDomAdmissionAccepted, true);
  assert.equal(handoff.nativeRenderRequestMirrored, true);
  assert.equal(handoff.publicCreateRootEnabled, false);
  assert.equal(handoff.publicHydrateRootEnabled, false);
  assert.equal(handoff.publicRootCreated, false);
  assert.equal(handoff.publicRootObjectExposed, false);
  assert.equal(handoff.publicRootExecution, false);
  assert.equal(handoff.publicRootCompatibilitySurface, false);
  assert.equal(handoff.publicRootRenderCompatibilityClaimed, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.rootScheduled, false);
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.domMutation, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.markerWrites, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.hydration, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.refEffects, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootRenderNativeHandoffRecord(handoff),
    true
  );
  assert.equal(rootBridge.isPrivateRootRenderNativeHandoffRecord({}), false);
  assert.equal(rootBridge.getPrivateRootRenderNativeHandoffPayload({}), null);

  assert.equal(hidden.adapter, adapter);
  assert.equal(hidden.root, root);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.renderRecord.requestType, 'root.render');
  assert.equal(hidden.hostOutputRenderRecord, diagnostic);
  assert.equal(hidden.hostOutputPayload, hostOutputPayload);
  assert.equal(
    hidden.lifecycleRequestBoundary,
    diagnostic.lifecycleRequestBoundary
  );
  assert.equal(
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      hidden.lifecycleRequestBoundary
    ).sourceRecord,
    hidden.renderRecord
  );
  assert.equal(
    hidden.rootWorkLoopFinishedWorkPayload,
    rootWorkLoopPayload
  );
  assert.equal(rootWorkLoopPayload.renderRecord, hidden.renderRecord);
  assert.equal(rootWorkLoopPayload.hostOutputHandoff, hidden.hostOutputHandoff);
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(
      hidden.nativeHandoffRecord
    ).sourceRecord,
    hidden.renderRecord
  );
  assert.deepEqual(adapter.getRootRenderNativeHandoffRecords(root), [
    handoff
  ]);
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [
    diagnostic
  ]);
  assert.deepEqual(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root)
      .rootRenderNativeHandoffRecords,
    [handoff]
  );
  assert.equal(
    rootBridge.createPrivateRootRenderNativeHandoffRecord(diagnostic),
    handoff
  );
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.nodeName, 'SECTION');
  assert.equal(container.textContent, 'native handoff output');
  assert.equal(componentTree.getLatestPropsFromNode(container.firstChild), element.props);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('afterPrivateRenderNativeHandoff'), false);

  hidden.bridge.cleanupInitialRenderHostOutput(hidden.hostOutputHandoff);
  assert.equal(container.childNodes.length, 0);

  const delayedDocument = createDocument(
    'private-client-facade-render-native-handoff-delayed'
  );
  const delayedContainer = createElement('DIV', delayedDocument);
  const delayedRoot = adapter.createRoot(delayedContainer);
  const delayedDiagnostic = adapter.renderHostOutput(delayedRoot, element);
  const delayedRenderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      delayedDiagnostic
    );
  const delayedHandoff = adapter.createRenderNativeHandoff(
    delayedRoot,
    delayedDiagnostic
  );
  const delayedHandoffPayload =
    rootBridge.getPrivateRootRenderNativeHandoffPayload(delayedHandoff);
  const delayedLifecycleBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      delayedHandoff.lifecycleRequestBoundary
    );

  assert.equal(
    delayedHandoff.$$typeof,
    rootBridge.privateRootRenderNativeHandoffRecordType
  );
  assert.equal(
    delayedHandoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_NATIVE_HANDOFF_ACCEPTED
  );
  assert.equal(
    delayedHandoff.sourceDiagnosticId,
    delayedDiagnostic.diagnosticId
  );
  assert.equal(
    delayedHandoff.lifecycleRequestAdmission,
    delayedRenderPayload.lifecycleRequestAdmission
  );
  assert.equal(
    delayedHandoff.lifecycleRequestBoundary,
    delayedDiagnostic.lifecycleRequestBoundary
  );
  assert.equal(
    delayedHandoff.lifecycleRequestBoundary,
    delayedHandoffPayload.lifecycleRequestBoundary
  );
  assert.equal(delayedHandoff.lifecycleRequestBoundaryAccepted, true);
  assert.equal(delayedHandoff.lifecycleRequestBoundarySourceOwned, true);
  assert.equal(delayedHandoff.lifecycleRequestBoundaryCurrent, true);
  assert.equal(
    delayedLifecycleBoundaryPayload.sourceRecord,
    delayedHandoffPayload.renderRecord
  );
  assert.equal(
    delayedLifecycleBoundaryPayload.admissionRecord,
    delayedHandoffPayload.lifecycleRequestAdmission
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      delayedHandoffPayload.lifecycleRequestAdmission,
      delayedHandoffPayload.lifecycleRequestBoundary
    ),
    true
  );
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(
      delayedHandoffPayload.nativeHandoffRecord
    ).sourceRecord,
    delayedHandoffPayload.renderRecord
  );
  assert.deepEqual(
    adapter.getRootRenderNativeHandoffRecords(delayedRoot),
    [delayedHandoff]
  );
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(delayedRoot), [
    delayedDiagnostic
  ]);
  assert.equal(delayedContainer.childNodes.length, 1);
  assert.equal(delayedContainer.textContent, 'native handoff output');
  delayedRenderPayload.bridge.cleanupInitialRenderHostOutput(
    delayedRenderPayload.hostOutputHandoff
  );
  assert.equal(delayedContainer.childNodes.length, 0);

  const publicContainer = createElement(
    'DIV',
    createDocument('private-client-facade-render-native-handoff-public')
  );
  assert.throws(() => reactDomClient.createRoot(publicContainer), {
    code: 'FAST_REACT_UNIMPLEMENTED',
    entrypoint: 'react-dom/client',
    exportName: 'createRoot'
  });
});

test('private react-dom/client facade render native handoff consumes Rust root work-loop metadata for div text', () => {
  const document = createDocument(
    'private-client-facade-rust-root-work-loop-native-handoff'
  );
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'text'
    },
    type: 'div'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: 'facade-rust-admission',
    initialHostOutputIdPrefix: 'facade-rust-initial',
    nativeEnvironmentId: 1095,
    nativeHandoffIdPrefix: 'facade-rust-native',
    publicFacadeHostOutputRenderIdPrefix: 'facade-rust-render',
    requestIdPrefix: 'facade-rust-request',
    rootIdPrefix: 'facade-rust-root',
    rootRenderNativeHandoffIdPrefix: 'facade-rust-handoff',
    sideEffectIdPrefix: 'facade-rust-side-effect',
    updateIdPrefix: 'facade-rust-update'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const metadata = createNativeRootWorkLoopFinishedWorkMetadataForCanary({
    hostType: 'div',
    renderUpdateId: 'facade-rust-update:1',
    rootId: create.rootId,
    rootTag: create.rootTag,
    textContent: 'text'
  });

  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(Object.isFrozen(metadata.facade), true);
  assert.equal(Object.isFrozen(metadata.completeWork), true);
  assert.equal(Object.isFrozen(metadata.completeWork.childTags), true);
  assert.equal(Object.isFrozen(metadata.pending), true);
  assert.equal(Object.isFrozen(metadata.commit), true);
  assert.equal(Object.isFrozen(metadata.placement), true);
  assert.equal(metadata.facade.hostOutputShape, 'host-component');
  assert.equal(metadata.facade.hostComponentCount, 1);
  assert.equal(metadata.facade.hostTextCount, 1);

  const handoff = adapter.renderNativeHandoff(root, element, {
    rustRootWorkLoopFinishedWorkMetadata: metadata
  });
  const hidden =
    rootBridge.getPrivateRootRenderNativeHandoffPayload(handoff);
  const diagnostic = hidden.hostOutputRenderRecord;
  const rootWorkLoopRecord = hidden.rootWorkLoopFinishedWorkRecord;
  const rootWorkLoopPayload = hidden.rootWorkLoopFinishedWorkPayload;
  const hostOutputPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      hidden.hostOutputHandoff
    );
  const hostNode = hostOutputPayload.hostNode;
  const textNode = hostOutputPayload.textNode;

  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_NATIVE_HANDOFF_ACCEPTED
  );
  assert.equal(handoff.handoffId, 'facade-rust-handoff:1');
  assert.equal(handoff.rootId, 'facade-rust-root:1');
  assert.equal(handoff.createRequestId, 'facade-rust-request:1');
  assert.equal(handoff.renderRequestId, 'facade-rust-request:2');
  assert.equal(handoff.renderUpdateId, 'facade-rust-update:1');
  assert.equal(handoff.rootWorkLoopEvidenceAccepted, true);
  assert.equal(handoff.rootWorkLoopFinishedWorkConsumed, true);
  assert.equal(handoff.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.equal(handoff.nativeRequestRecord.environmentId, 1095);
  assert.equal(
    handoff.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER
  );
  assert.equal(handoff.privateFacadeRoot, true);
  assert.equal(handoff.publicCreateRootEnabled, false);
  assert.equal(handoff.publicHydrateRootEnabled, false);
  assert.equal(handoff.publicRootCreated, false);
  assert.equal(handoff.publicRootObjectExposed, false);
  assert.equal(handoff.publicRootExecution, false);
  assert.equal(handoff.publicRootCompatibilitySurface, false);
  assert.equal(handoff.publicRootRenderCompatibilityClaimed, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.rootScheduled, false);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.markerWrites, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.hydration, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.refEffects, false);
  assert.equal(handoff.compatibilityClaimed, false);

  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(diagnostic.hostType, 'div');
  assert.equal(diagnostic.hostOutputShape, 'host-component');
  assert.equal(diagnostic.textContent, 'text');
  assert.deepEqual(diagnostic.childTags, ['HostComponent', 'HostText']);
  assert.equal(diagnostic.rootWorkLoopFinishedWorkConsumed, true);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.markerWrites, false);
  assert.equal(diagnostic.listenerInstallation, false);
  assert.equal(diagnostic.hydration, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.refEffects, false);
  assert.equal(diagnostic.compatibilityClaimed, false);

  assert.equal(rootWorkLoopRecord.metadataProvided, true);
  assert.equal(rootWorkLoopRecord.metadataSource, metadata.source);
  assert.equal(rootWorkLoopRecord.metadataStatus, metadata.status);
  assert.equal(rootWorkLoopRecord.metadataRevision, metadata.metadataRevision);
  assert.equal(rootWorkLoopRecord.renderUpdateId, 'facade-rust-update:1');
  assert.equal(rootWorkLoopRecord.hostType, 'div');
  assert.equal(rootWorkLoopRecord.textContent, 'text');
  assert.equal(rootWorkLoopRecord.rootChildTag, 'HostComponent');
  assert.equal(rootWorkLoopRecord.completedChildTag, 'HostComponent');
  assert.equal(rootWorkLoopRecord.hostTextChildTag, 'HostText');
  assert.deepEqual(rootWorkLoopRecord.childTags, [
    'HostComponent',
    'HostText'
  ]);
  assert.equal(rootWorkLoopRecord.publicRootRenderingBlocked, true);
  assert.equal(rootWorkLoopRecord.publicRootExecution, false);
  assert.equal(rootWorkLoopRecord.publicRootCompatibilitySurface, false);
  assert.equal(rootWorkLoopRecord.nativeExecution, false);
  assert.equal(rootWorkLoopRecord.reconcilerExecution, false);
  assert.equal(rootWorkLoopRecord.hydration, false);
  assert.equal(rootWorkLoopRecord.eventDispatch, false);
  assert.equal(rootWorkLoopRecord.refEffects, false);
  assert.equal(rootWorkLoopRecord.compatibilityClaimed, false);
  assert.equal(rootWorkLoopPayload.metadata, metadata);
  assert.equal(rootWorkLoopPayload.normalizedMetadata.source, metadata.source);
  assert.equal(rootWorkLoopPayload.normalizedMetadata.status, metadata.status);
  assert.equal(
    rootWorkLoopPayload.normalizedMetadata.revision,
    metadata.metadataRevision
  );
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkMetadata.source,
    metadata.source
  );
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkMetadata.status,
    metadata.status
  );
  assert.equal(
    diagnostic.rootWorkLoopFinishedWorkMetadata.metadataRevision,
    metadata.metadataRevision
  );
  assert.equal(
    rootWorkLoopPayload.normalizedMetadata.hostOutputShape,
    'host-component'
  );
  assert.equal(rootWorkLoopPayload.normalizedMetadata.hostComponentCount, 1);
  assert.equal(rootWorkLoopPayload.normalizedMetadata.hostTextCount, 1);

  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild, hostNode);
  assert.equal(hostNode.nodeName, 'DIV');
  assert.equal(hostNode.firstChild, textNode);
  assert.equal(textNode.nodeValue, 'text');
  assert.equal(container.textContent, 'text');
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), create.owner);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), element.props);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.deepEqual(adapter.getRootRenderNativeHandoffRecords(root), [
    handoff
  ]);
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [
    diagnostic
  ]);

  const publicContainer = createElement(
    'DIV',
    createDocument('private-client-facade-rust-root-work-loop-public')
  );
  assert.throws(() => reactDomClient.createRoot(publicContainer), {
    code: 'FAST_REACT_UNIMPLEMENTED',
    entrypoint: 'react-dom/client',
    exportName: 'createRoot'
  });
  assert.throws(
    () => reactDomClient.hydrateRoot(publicContainer, element),
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'hydrateRoot'
    }
  );

  hidden.bridge.cleanupInitialRenderHostOutput(hidden.hostOutputHandoff);
  assert.equal(container.childNodes.length, 0);
});

test('private react-dom/client facade rejects Rust root work-loop metadata capability claims', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    initialHostOutputIdPrefix: 'facade-rust-claim-initial',
    nativeEnvironmentId: 1095,
    nativeHandoffIdPrefix: 'facade-rust-claim-native',
    publicFacadeHostOutputRenderIdPrefix: 'facade-rust-claim-render',
    requestIdPrefix: 'facade-rust-claim-request',
    rootIdPrefix: 'facade-rust-claim-root',
    rootRenderNativeHandoffIdPrefix: 'facade-rust-claim-handoff',
    updateIdPrefix: 'facade-rust-claim-update'
  });
  const element = {
    props: {
      children: 'text'
    },
    type: 'div'
  };
  const claimCases = [
    'publicRootExecution',
    'public_root_execution',
    'nativeExecution',
    'native_execution',
    'reconcilerExecution',
    'reconciler_execution',
    'domMutation',
    'dom_mutation',
    'browserDomMutation',
    'browser_dom_mutation',
    'markerWrites',
    'marker_writes',
    'listenerInstallation',
    'listener_installation',
    'hydration',
    'eventDispatch',
    'event_dispatch',
    'refEffects',
    'ref_effects',
    'rootScheduled',
    'root_scheduled',
    'compatibilityClaimed',
    'compatibility_claimed',
    'publicNativeCompatibility',
    'public_native_compatibility',
    'publicRootCompatibilitySurface',
    'public_root_compatibility_surface',
    'publicRootRenderCompatibilityClaimed',
    'public_root_render_compatibility_claimed',
    'publicDomMutationCompatibilityClaimed',
    'public_dom_mutation_compatibility_claimed',
    'publicTestRendererCompatibilityClaimed',
    'public_test_renderer_compatibility_claimed'
  ];

  for (const claimField of claimCases) {
    const document = createDocument(
      `private-client-facade-rust-claim-${claimField}`
    );
    const container = createElement('DIV', document);
    const root = adapter.createRoot(container);
    const create = adapter.getRootCreateRecord(root);
    const baseMetadata =
      createNativeRootWorkLoopFinishedWorkMetadataForCanary({
        hostType: 'div',
        renderUpdateId: 'facade-rust-claim-update:1',
        rootId: create.rootId,
        rootTag: create.rootTag,
        textContent: 'text'
      });
    const metadata = Object.freeze({
      ...baseMetadata,
      [claimField]: true
    });

    assert.throws(
      () =>
        createNativeRootWorkLoopFinishedWorkMetadataForCanary({
          hostType: 'div',
          renderUpdateId: 'facade-rust-claim-update:1',
          rootId: create.rootId,
          rootTag: create.rootTag,
          textContent: 'text',
          [claimField]: true
        }),
      {
        code:
          'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_CAPABILITY_CLAIM'
      },
      `${claimField} factory`
    );
    assert.equal(Object.isFrozen(baseMetadata), true);
    assert.equal(Object.isFrozen(metadata), true);

    assert.throws(
      () =>
        adapter.renderNativeHandoff(root, element, {
          rustRootWorkLoopFinishedWorkMetadata: metadata
        }),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER',
        message: /cannot claim public, native, DOM/
      },
      claimField
    );
    assertBridgeDidNotTouchContainer(container, document);
    assert.deepEqual(adapter.getRootRequestRecords(root), [create]);
    assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), []);
    assert.deepEqual(adapter.getRootRenderNativeHandoffRecords(root), []);
    assert.equal(
      rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(metadata),
      null
    );
    assert.equal(
      rootBridge.getPrivateRootRenderNativeHandoffPayload(metadata),
      null
    );
  }
});

test('private react-dom/client facade rejects public native compatibility claimed aliases in hand-authored metadata', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    initialHostOutputIdPrefix: 'facade-rust-native-claim-initial',
    nativeEnvironmentId: 1096,
    nativeHandoffIdPrefix: 'facade-rust-native-claim-native',
    publicFacadeHostOutputRenderIdPrefix:
      'facade-rust-native-claim-render',
    requestIdPrefix: 'facade-rust-native-claim-request',
    rootIdPrefix: 'facade-rust-native-claim-root',
    rootRenderNativeHandoffIdPrefix: 'facade-rust-native-claim-handoff',
    updateIdPrefix: 'facade-rust-native-claim-update'
  });
  const element = {
    props: {
      children: 'text'
    },
    type: 'div'
  };

  for (const claimField of [
    'publicNativeCompatibilityClaimed',
    'public_native_compatibility_claimed',
    'publicNativeCompatibilitySurface',
    'public_native_compatibility_surface'
  ]) {
    const document = createDocument(
      `private-client-facade-rust-native-claim-${claimField}`
    );
    const container = createElement('DIV', document);
    const root = adapter.createRoot(container);
    const create = adapter.getRootCreateRecord(root);
    const baseMetadata =
      createNativeRootWorkLoopFinishedWorkMetadataForCanary({
        hostType: 'div',
        renderUpdateId: 'facade-rust-native-claim-update:1',
        rootId: create.rootId,
        rootTag: create.rootTag,
        textContent: 'text'
      });
    const metadata = Object.freeze({
      ...baseMetadata,
      [claimField]: true
    });

    assert.throws(
      () =>
        adapter.renderNativeHandoff(root, element, {
          rustRootWorkLoopFinishedWorkMetadata: metadata
        }),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER',
        message: /cannot claim public, native, DOM/
      },
      claimField
    );
    assertBridgeDidNotTouchContainer(container, document);
    assert.deepEqual(adapter.getRootRequestRecords(root), [create]);
    assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), []);
    assert.deepEqual(adapter.getRootRenderNativeHandoffRecords(root), []);
  }
});

test('private react-dom/client facade rejects invalid native Rust root work-loop metadata factory inputs', () => {
  assert.throws(
    () =>
      createNativeRootWorkLoopFinishedWorkMetadataForCanary({
        hostType: 'span',
        renderUpdateId: 'facade-rust-invalid-update:1',
        rootId: 'facade-rust-invalid-root:1',
        rootTag: 'ConcurrentRoot',
        textContent: 'text'
      }),
    {
      code:
        'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_INVALID_OPTIONS'
    }
  );
  assert.throws(
    () =>
      createNativeRootWorkLoopFinishedWorkMetadataForCanary({
        hostType: 'div',
        renderUpdateId: 'facade-rust-invalid-update:1',
        rootId: 'facade-rust-invalid-root:1',
        rootTag: 'ConcurrentRoot',
        textContent: 'not text'
      }),
    {
      code:
        'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_INVALID_OPTIONS'
    }
  );
  assert.throws(
    () =>
      createNativeRootWorkLoopFinishedWorkMetadataForCanary({
        hostType: 'div',
        renderUpdateId: '',
        rootId: 'facade-rust-invalid-root:1',
        rootTag: 'ConcurrentRoot',
        textContent: 'text'
      }),
    {
      code:
        'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_INVALID_OPTIONS'
    }
  );
  assert.throws(
    () =>
      createNativeRootWorkLoopFinishedWorkMetadataForCanary({
        hostType: 'div',
        publicRootExecution: true,
        renderUpdateId: 'facade-rust-invalid-update:1',
        rootId: 'facade-rust-invalid-root:1',
        rootTag: 'ConcurrentRoot',
        textContent: 'text'
      }),
    {
      code:
        'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_CAPABILITY_CLAIM'
    }
  );
});

test('private react-dom/client facade host-output update diagnostic routes root.render through fake DOM', () => {
  const document = createDocument('private-client-facade-host-output-update');
  const container = createElement('DIV', document);
  const updateCallback = function afterPrivateFacadeHostOutputUpdate() {};
  const initialElement = {
    props: {
      children: 'initial facade output',
      className: 'facade-initial',
      id: 'facade-host',
      'data-phase': 'initial',
      title: 'Initial private facade host'
    },
    type: 'main'
  };
  const nextElement = {
    props: {
      children: 'updated facade output',
      className: 'facade-updated',
      id: 'facade-host',
      'data-phase': 'updated',
      title: 'Updated private facade host'
    },
    type: 'main'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: 'facade-update-admission',
    hostOutputUpdateIdPrefix: 'facade-update-handoff',
    initialHostOutputIdPrefix: 'facade-update-initial',
    nativeEnvironmentId: 843,
    nativeHandoffIdPrefix: 'facade-update-native',
    publicFacadeHostOutputRenderIdPrefix: 'facade-update-render',
    publicFacadeHostOutputUpdateIdPrefix: 'facade-update-diagnostic',
    requestIdPrefix: 'facade-update-request',
    rootIdPrefix: 'facade-update-root',
    sideEffectIdPrefix: 'facade-update-side-effect',
    updateIdPrefix: 'facade-update'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const initialDiagnostic = adapter.renderHostOutput(root, initialElement);
  const initialHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      initialDiagnostic
    );
  const initialHandoffPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      initialHidden.hostOutputHandoff
    );
  const updateDiagnostic = adapter.updateHostOutput(root, nextElement, {
    callback: updateCallback
  });
  const updateHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload(
      updateDiagnostic
    );
  const updateHandoff = updateHidden.hostOutputUpdateHandoff;
  const updateHandoffPayload =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(updateHandoff);
  const updateRecord = updateHidden.updateRecord;
  const hostNode = initialHandoffPayload.hostNode;
  const textNode = initialHandoffPayload.textNode;
  const rootPayload = rootBridge.getPrivateRootPublicFacadeRootPayload(root);

  assert.equal(Object.isFrozen(updateDiagnostic), true);
  assert.equal(
    updateDiagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputUpdateRecordType
  );
  assert.equal(
    updateDiagnostic.kind,
    'FastReactDomPrivateRootPublicFacadeHostOutputUpdateDiagnosticRecord'
  );
  assert.equal(
    updateDiagnostic.operation,
    'public-facade-host-output-update-diagnostic'
  );
  assert.equal(
    updateDiagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(updateDiagnostic.diagnosticId, 'facade-update-diagnostic:1');
  assert.equal(updateDiagnostic.rootId, 'facade-update-root:1');
  assert.equal(updateDiagnostic.createRequestId, 'facade-update-request:1');
  assert.equal(
    updateDiagnostic.initialDiagnosticId,
    initialDiagnostic.diagnosticId
  );
  assert.equal(
    updateDiagnostic.initialHostOutputHandoffId,
    'facade-update-initial:1'
  );
  assert.equal(updateDiagnostic.updateRequestId, 'facade-update-request:3');
  assert.equal(updateDiagnostic.updateUpdateId, 'facade-update:2');
  assert.equal(
    updateDiagnostic.updateLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    updateDiagnostic.updateLifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    updateDiagnostic.hostOutputUpdateHandoffId,
    'facade-update-handoff:1'
  );
  assert.equal(
    updateDiagnostic.hostOutputUpdateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(updateDiagnostic.nativeHandoffId, 'facade-update-native:3');
  assert.equal(
    updateDiagnostic.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    updateDiagnostic.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER
  );
  assert.equal(updateDiagnostic.nativeRequestRecord.environmentId, 843);
  assert.equal(updateDiagnostic.hostType, 'main');
  assert.equal(updateDiagnostic.containerChildCount, 1);
  assert.equal(updateDiagnostic.hostChildCount, 1);
  assert.equal(updateDiagnostic.textContent, 'updated facade output');
  assert.deepEqual(updateDiagnostic.propertyMutation, {
    handoffKind: domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
    latestPropsCommitRecordKind: domHost.LATEST_PROPS_COMMIT_RECORD,
    latestPropsCommitRecordStatus: 'safe-for-latest-props',
    mutationRecordCount: 4,
    payloadCount: 4,
    propertyPayloadEvidence: {
      propertyPayloadBacked: true,
      rowCount: 4,
      mutatingRowCount: 3,
      updateRowCount: 3,
      removalRowCount: 0,
      setAttributeCount: 3,
      removeAttributeCount: 0,
      setPropertyCount: 0,
      removePropertyCount: 0,
      setStyleCount: 0,
      removeStyleCount: 0,
      nonPayloadRowCount: 1,
      attributeRowCount: 3,
      propertyRowCount: 0,
      styleRowCount: 0,
      rowKinds: ['nonPayload', 'setAttribute']
    },
    status: 'mutated'
  });
  assert.deepEqual(updateDiagnostic.textMutation, {
    newTextLength: 21,
    oldTextLength: 21,
    status: 'mutated'
  });
  assert.equal(updateDiagnostic.latestPropsPublished, true);
  assert.equal(
    updateDiagnostic.latestPropsPublishOrder,
    'after-property-and-text-mutation'
  );
  assert.deepEqual(
    updateDiagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'public-facade-initial-host-output-render',
      'public-facade-root-render-update-record',
      'private-native-update-request-handoff',
      'host-output-update-handoff',
      'fake-dom-property-update',
      'property-payload-evidence',
      'fake-dom-text-update',
      'latest-props-after-mutation',
      'attribute-payload-rows'
    ]
  );
  assert.deepEqual(
    updateDiagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'refs',
      'compatibility-claims'
    ]
  );
  assert.equal(updateDiagnostic.privateFacadeRoot, true);
  assert.equal(updateDiagnostic.publicCreateRootEnabled, false);
  assert.equal(updateDiagnostic.publicRootCreated, false);
  assert.equal(updateDiagnostic.publicRootExecution, false);
  assert.equal(updateDiagnostic.publicRootCompatibilitySurface, false);
  assert.equal(updateDiagnostic.nativeUpdateRequestMirrored, true);
  assert.equal(updateDiagnostic.lifecycleContainerSnapshotCurrent, true);
  assert.equal(updateDiagnostic.hostOutputUpdateCurrent, true);
  assert.equal(updateDiagnostic.rootCommitHostComponentUpdateCurrent, false);
  assert.equal(updateDiagnostic.updateNativeHandoffCurrent, true);
  assert.equal(updateDiagnostic.nativeExecution, false);
  assert.equal(updateDiagnostic.reconcilerExecution, false);
  assert.equal(updateDiagnostic.rootScheduled, false);
  assert.equal(updateDiagnostic.fakeDomMutation, true);
  assert.equal(updateDiagnostic.domMutation, true);
  assert.equal(updateDiagnostic.browserDomMutation, false);
  assert.equal(updateDiagnostic.markerWrites, false);
  assert.equal(updateDiagnostic.listenerInstallation, false);
  assert.equal(updateDiagnostic.hydration, false);
  assert.equal(updateDiagnostic.eventDispatch, false);
  assert.equal(updateDiagnostic.refEffects, false);
  assert.equal(updateDiagnostic.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputUpdateRecord(
      updateDiagnostic
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputUpdateRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload({}),
    null
  );

  assert.equal(updateHidden.adapter, adapter);
  assert.equal(updateHidden.root, root);
  assert.equal(updateHidden.createRecord, create);
  assert.equal(updateHidden.hostOutputRenderDiagnostic, initialDiagnostic);
  assert.equal(updateHidden.initialHostOutputPayload, initialHandoffPayload);
  assert.equal(updateHidden.hostOutputUpdatePayload, updateHandoffPayload);
  assert.equal(updateHidden.updateRecord, updateRecord);
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(
      updateHidden.nativeHandoffRecord
    ),
    updateHidden.nativeHandoffPayload
  );
  assert.equal(updateHidden.nativeHandoffPayload.sourceRecord, updateRecord);
  assert.equal(updateHidden.nativeHandoffPayload.value, nextElement);
  assert.equal(updateHidden.callback, updateCallback);
  assert.equal(updateHidden.element, nextElement);
  assert.equal(
    updateHidden.normalizedUpdate.previousProps,
    initialElement.props
  );
  assert.equal(updateHidden.normalizedUpdate.nextProps, nextElement.props);
  assert.equal(
    updateHidden.normalizedUpdate.textUpdate.oldText,
    'initial facade output'
  );
  assert.equal(
    updateHidden.normalizedUpdate.textUpdate.newText,
    'updated facade output'
  );
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(updateRecord).element,
    nextElement
  );
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(updateRecord).callback,
    updateCallback
  );
  assert.equal(updateHandoff.sourceUpdateId, updateRecord.updateId);
  assert.equal(updateHandoffPayload.sourceRecord, updateRecord);
  assert.equal(updateHandoffPayload.hostInstanceNode, hostNode);
  assert.equal(
    updateHandoffPayload.hostInstanceToken,
    initialHandoffPayload.hostToken
  );
  assert.equal(updateHandoffPayload.textInstance, textNode);
  assert.equal(updateHandoffPayload.previousProps, initialElement.props);
  assert.equal(updateHandoffPayload.nextProps, nextElement.props);
  assert.equal(updateHandoffPayload.latestPropsPublished, true);

  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    initialHidden.renderRecord,
    updateRecord
  ]);
  assert.deepEqual(adapter.getRootPayload(root).renderRecords, [
    initialHidden.renderRecord,
    updateRecord
  ]);
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [
    initialDiagnostic
  ]);
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), [
    updateDiagnostic
  ]);
  assert.deepEqual(rootPayload.hostOutputUpdateRecords, [updateDiagnostic]);

  assert.equal(container.firstChild, hostNode);
  assert.equal(hostNode.firstChild, textNode);
  assert.equal(hostNode.textContent, 'updated facade output');
  assert.equal(textNode.textContent, 'updated facade output');
  assert.deepEqual(attributeEntries(hostNode), [
    ['class', 'facade-updated'],
    ['data-phase', 'updated'],
    ['id', 'facade-host'],
    ['title', 'Updated private facade host']
  ]);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), nextElement.props);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);

  const serialized = JSON.stringify(updateDiagnostic);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('afterPrivateFacadeHostOutputUpdate'), false);
  assert.equal(serialized.includes('updated facade output'), true);

  const cleanup = initialHidden.bridge.cleanupInitialRenderHostOutput(
    initialHidden.hostOutputHandoff
  );
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED
  );
  assert.equal(container.childNodes.length, 0);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);

  const publicContainer = createElement(
    'DIV',
    createDocument('private-client-facade-host-output-update-public')
  );
  assert.throws(() => reactDomClient.createRoot(publicContainer), {
    code: 'FAST_REACT_UNIMPLEMENTED',
    entrypoint: 'react-dom/client',
    exportName: 'createRoot'
  });
});

test('private react-dom/client facade nested host-output update diagnostic targets child host output', () => {
  const document = createDocument(
    'private-client-facade-nested-host-output-update'
  );
  const container = createElement('DIV', document);
  const renderCallback = function afterPrivateFacadeNestedRender() {};
  const updateCallback = function afterPrivateFacadeNestedUpdate() {};
  const initialElement = {
    props: {
      children: {
        props: {
          children: 'nested initial text',
          className: 'nested-child initial',
          id: 'nested-child',
          'data-phase': 'initial'
        },
        type: 'span'
      },
      id: 'nested-parent',
      'data-shell': 'stable'
    },
    type: 'section'
  };
  const nextElement = {
    props: {
      children: {
        props: {
          children: 'nested updated text',
          className: 'nested-child updated',
          id: 'nested-child',
          'data-phase': 'updated',
          title: 'Updated nested child'
        },
        type: 'span'
      },
      id: 'nested-parent',
      'data-shell': 'stable'
    },
    type: 'section'
  };
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: 'facade-nested-admission',
    hostOutputUpdateIdPrefix: 'facade-nested-handoff',
    nativeEnvironmentId: 848,
    nativeHandoffIdPrefix: 'facade-nested-native',
    publicFacadeNestedHostOutputUpdateIdPrefix:
      'facade-nested-diagnostic',
    requestIdPrefix: 'facade-nested-request',
    rootIdPrefix: 'facade-nested-root',
    sideEffectIdPrefix: 'facade-nested-side-effect',
    updateIdPrefix: 'facade-nested-update'
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const diagnostic = adapter.updateNestedHostOutput(
    root,
    initialElement,
    nextElement,
    {
      renderCallback,
      updateCallback
    }
  );
  const hidden =
    rootBridge.getPrivateRootPublicFacadeNestedHostOutputUpdatePayload(
      diagnostic
    );
  const handoff = hidden.hostOutputUpdateHandoff;
  const handoffPayload =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);
  const parentNode = hidden.parentHostInstanceNode;
  const childNode = hidden.childHostInstanceNode;
  const textNode = hidden.textInstance;
  const rootPayload = rootBridge.getPrivateRootPublicFacadeRootPayload(root);
  const initialLifecycleBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      hidden.initialLifecycleRequestBoundary
    );
  const updateLifecycleBoundaryPayload =
    rootBridge.getPrivateRootLifecycleRequestBoundaryPayload(
      hidden.updateLifecycleRequestBoundary
    );

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    diagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeNestedHostOutputUpdateRecordType
  );
  assert.equal(
    diagnostic.kind,
    'FastReactDomPrivateRootPublicFacadeNestedHostOutputUpdateDiagnosticRecord'
  );
  assert.equal(
    diagnostic.operation,
    'public-facade-nested-host-output-update-diagnostic'
  );
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_NESTED_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(diagnostic.diagnosticId, 'facade-nested-diagnostic:1');
  assert.equal(diagnostic.rootId, 'facade-nested-root:1');
  assert.equal(diagnostic.createRequestId, 'facade-nested-request:1');
  assert.equal(diagnostic.initialRenderRequestId, 'facade-nested-request:2');
  assert.equal(diagnostic.initialRenderUpdateId, 'facade-nested-update:1');
  assert.equal(diagnostic.updateRequestId, 'facade-nested-request:3');
  assert.equal(diagnostic.updateUpdateId, 'facade-nested-update:2');
  assert.equal(
    diagnostic.initialLifecycleRequestAdmission,
    hidden.initialLifecycleRequestAdmission
  );
  assert.equal(
    diagnostic.initialLifecycleRequestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    diagnostic.initialLifecycleRequestBoundary,
    hidden.initialLifecycleRequestBoundary
  );
  assert.equal(
    diagnostic.initialLifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(diagnostic.initialLifecycleRequestBoundaryAccepted, true);
  assert.equal(diagnostic.initialLifecycleRequestBoundarySourceOwned, true);
  assert.equal(diagnostic.initialLifecycleRequestBoundaryCurrent, true);
  assert.equal(
    diagnostic.initialLifecycleRequestVersion,
    hidden.initialLifecycleRequestBoundary.lifecycleRequestVersion
  );
  assert.equal(
    diagnostic.updateLifecycleRequestAdmission,
    hidden.updateLifecycleRequestAdmission
  );
  assert.equal(
    diagnostic.updateLifecycleRequestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    diagnostic.updateLifecycleRequestBoundary,
    hidden.updateLifecycleRequestBoundary
  );
  assert.equal(
    diagnostic.updateLifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(diagnostic.updateLifecycleRequestBoundaryAccepted, true);
  assert.equal(diagnostic.updateLifecycleRequestBoundarySourceOwned, true);
  assert.equal(diagnostic.updateLifecycleRequestBoundaryCurrent, true);
  assert.equal(
    diagnostic.updateLifecycleRequestVersion,
    hidden.updateLifecycleRequestBoundary.lifecycleRequestVersion
  );
  assert.equal(
    diagnostic.updateLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    diagnostic.hostOutputUpdateHandoffId,
    'facade-nested-handoff:1'
  );
  assert.equal(
    diagnostic.hostOutputUpdateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(diagnostic.nativeHandoffId, 'facade-nested-native:3');
  assert.equal(
    diagnostic.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    diagnostic.nativeRequestKind,
    rootBridge.NATIVE_ROOT_BRIDGE_REQUEST_RENDER
  );
  assert.equal(diagnostic.nativeRequestRecord.environmentId, 848);
  assert.deepEqual(diagnostic.nestedHostPath, [
    'HostRoot',
    'HostComponent',
    'HostComponent',
    'HostText'
  ]);
  assert.equal(diagnostic.parentHostType, 'section');
  assert.equal(diagnostic.childHostType, 'span');
  assert.equal(diagnostic.containerChildCount, 1);
  assert.equal(diagnostic.parentChildCount, 1);
  assert.equal(diagnostic.childChildCount, 1);
  assert.equal(diagnostic.previousText, 'nested initial text');
  assert.equal(diagnostic.nextText, 'nested updated text');
  assert.deepEqual(diagnostic.propertyMutation, {
    handoffKind: domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
    latestPropsCommitRecordKind: domHost.LATEST_PROPS_COMMIT_RECORD,
    latestPropsCommitRecordStatus: 'safe-for-latest-props',
    mutationRecordCount: 4,
    payloadCount: 4,
    propertyPayloadEvidence: {
      propertyPayloadBacked: true,
      rowCount: 4,
      mutatingRowCount: 3,
      updateRowCount: 3,
      removalRowCount: 0,
      setAttributeCount: 3,
      removeAttributeCount: 0,
      setPropertyCount: 0,
      removePropertyCount: 0,
      setStyleCount: 0,
      removeStyleCount: 0,
      nonPayloadRowCount: 1,
      attributeRowCount: 3,
      propertyRowCount: 0,
      styleRowCount: 0,
      rowKinds: ['nonPayload', 'setAttribute']
    },
    status: 'mutated'
  });
  assert.deepEqual(diagnostic.textMutation, {
    newTextLength: 19,
    oldTextLength: 19,
    status: 'mutated'
  });
  assert.equal(diagnostic.latestPropsPublished, true);
  assert.equal(
    diagnostic.latestPropsPublishOrder,
    'after-property-and-text-mutation'
  );
  assert.equal(diagnostic.parentLatestPropsPublished, true);
  assert.equal(diagnostic.childInitialLatestPropsPublished, true);
  assert.deepEqual(diagnostic.tokenIdentity, {
    parentTokenAttachedToParentNode: true,
    childTokenAttachedToChildNode: true,
    textTokenAttachedToTextNode: true,
    parentTokenRootOwnerMatchesRoot: true,
    childTokenRootOwnerMatchesRoot: true,
    textTokenRootOwnerMatchesRoot: true,
    parentChildTokenRootOwnerMatches: true,
    childTextTokenRootOwnerMatches: true,
    parentTokenDistinctFromChildToken: true,
    childTokenDistinctFromTextToken: true
  });
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      'public-facade-create-root-record',
      'public-facade-nested-host-output-render-record',
      'public-facade-root-render-update-record',
      'private-native-update-request-handoff',
      'nested-host-output-path',
      'parent-child-token-identity',
      'host-output-update-handoff',
      'fake-dom-property-update',
      'property-payload-evidence',
      'fake-dom-text-update',
      'latest-props-after-mutation',
      'attribute-payload-rows'
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
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
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.nativeUpdateRequestMirrored, true);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.rootScheduled, false);
  assert.equal(diagnostic.fakeDomMutation, true);
  assert.equal(diagnostic.domMutation, true);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.markerWrites, false);
  assert.equal(diagnostic.listenerInstallation, false);
  assert.equal(diagnostic.hydration, false);
  assert.equal(diagnostic.eventDispatch, false);
  assert.equal(diagnostic.refEffects, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeNestedHostOutputUpdateRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeNestedHostOutputUpdateRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeNestedHostOutputUpdatePayload({}),
    null
  );

  assert.equal(hidden.adapter, adapter);
  assert.equal(hidden.root, root);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.renderCallback, renderCallback);
  assert.equal(hidden.updateCallback, updateCallback);
  assert.equal(hidden.initialElement, initialElement);
  assert.equal(hidden.element, nextElement);
  assert.equal(
    hidden.initialLifecycleRequestBoundaryPayload,
    initialLifecycleBoundaryPayload
  );
  assert.equal(
    hidden.updateLifecycleRequestBoundaryPayload,
    updateLifecycleBoundaryPayload
  );
  assert.equal(
    initialLifecycleBoundaryPayload.sourceRecord,
    hidden.initialRenderRecord
  );
  assert.equal(updateLifecycleBoundaryPayload.sourceRecord, hidden.updateRecord);
  assert.equal(
    initialLifecycleBoundaryPayload.admissionRecord,
    hidden.initialLifecycleRequestAdmission
  );
  assert.equal(
    updateLifecycleBoundaryPayload.admissionRecord,
    hidden.updateLifecycleRequestAdmission
  );
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      hidden.initialLifecycleRequestBoundary
    ),
    true
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      hidden.initialLifecycleRequestAdmission,
      hidden.initialLifecycleRequestBoundary
    ),
    false
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      hidden.updateLifecycleRequestAdmission,
      hidden.updateLifecycleRequestBoundary
    ),
    true
  );
  assert.equal(hidden.hostOutputUpdatePayload, handoffPayload);
  assert.equal(
    rootBridge.getNativeRootBridgeHandoffPayload(hidden.nativeHandoffRecord),
    hidden.nativeHandoffPayload
  );
  assert.equal(hidden.nativeHandoffPayload.sourceRecord, hidden.updateRecord);
  assert.equal(hidden.nativeHandoffPayload.value, nextElement);
  assert.equal(hidden.nativeHandoffRecord.nativeExecution, false);
  assert.equal(hidden.nativeHandoffRecord.reconcilerExecution, false);
  assert.equal(hidden.nativeHandoffRecord.domMutation, false);
  assert.equal(hidden.nativeHandoffRecord.markerWrites, false);
  assert.equal(hidden.nativeHandoffRecord.listenerInstallation, false);
  assert.equal(hidden.nativeHandoffRecord.hydration, false);
  assert.equal(hidden.nativeHandoffRecord.eventDispatch, false);
  assert.equal(hidden.nativeHandoffRecord.compatibilityClaimed, false);
  assert.equal(handoffPayload.sourceRecord, hidden.updateRecord);
  assert.equal(handoffPayload.hostInstanceNode, childNode);
  assert.equal(handoffPayload.hostInstanceToken, hidden.childHostInstanceToken);
  assert.equal(handoffPayload.textInstance, textNode);
  assert.equal(handoffPayload.previousProps, initialElement.props.children.props);
  assert.equal(handoffPayload.nextProps, nextElement.props.children.props);
  assert.equal(handoffPayload.latestPropsPublished, true);
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(
      hidden.parentHostInstanceToken
    ),
    create.owner
  );
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(
      hidden.childHostInstanceToken
    ),
    create.owner
  );
  assert.notEqual(
    hidden.parentHostInstanceToken,
    hidden.childHostInstanceToken
  );
  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    hidden.initialRenderRecord,
    hidden.updateRecord
  ]);
  assert.deepEqual(adapter.getRootNestedHostOutputUpdateDiagnostics(root), [
    diagnostic
  ]);
  assert.deepEqual(rootPayload.hostOutputNestedUpdateRecords, [diagnostic]);
  assert.deepEqual(rootPayload.lifecycleRequestBoundaryRecords, [
    hidden.initialLifecycleRequestBoundary,
    hidden.updateLifecycleRequestBoundary
  ]);

  assert.equal(container.firstChild, parentNode);
  assert.equal(parentNode.firstChild, childNode);
  assert.equal(childNode.firstChild, textNode);
  assert.equal(container.textContent, 'nested updated text');
  assert.equal(childNode.textContent, 'nested updated text');
  assert.equal(textNode.textContent, 'nested updated text');
  assert.deepEqual(attributeEntries(parentNode), [
    ['data-shell', 'stable'],
    ['id', 'nested-parent']
  ]);
  assert.deepEqual(attributeEntries(childNode), [
    ['class', 'nested-child updated'],
    ['data-phase', 'updated'],
    ['id', 'nested-child'],
    ['title', 'Updated nested child']
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(parentNode),
    initialElement.props
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(childNode),
    nextElement.props.children.props
  );
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);

  const serialized = JSON.stringify(diagnostic);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('afterPrivateFacadeNestedUpdate'), false);
  assert.equal(serialized.includes('nested updated text'), true);

  domHost.removeChildFromContainer(container, parentNode);
  const detach = componentTree.detachHostInstanceSubtree(parentNode, {
    includeRoot: true
  });
  assert.equal(detach.detachedHostInstanceCount, 3);
  assert.equal(container.childNodes.length, 0);

  const publicContainer = createElement(
    'DIV',
    createDocument('private-client-facade-nested-host-output-public')
  );
  assert.throws(() => reactDomClient.createRoot(publicContainer), {
    code: 'FAST_REACT_UNIMPLEMENTED',
    entrypoint: 'react-dom/client',
    exportName: 'createRoot'
  });
});

test('private react-dom/client facade nested host-output rejects lifecycle alias smuggling before mutation', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: 'facade-nested-alias-handoff',
    initialHostOutputIdPrefix: 'facade-nested-alias-initial',
    nativeEnvironmentId: 848,
    nativeHandoffIdPrefix: 'facade-nested-alias-native',
    publicFacadeHostOutputRenderIdPrefix: 'facade-nested-alias-render',
    publicFacadeHostOutputUpdateIdPrefix: 'facade-nested-alias-update',
    publicFacadeNestedHostOutputUpdateIdPrefix:
      'facade-nested-alias-diagnostic',
    requestIdPrefix: 'facade-nested-alias-request',
    rootIdPrefix: 'facade-nested-alias-root',
    sideEffectIdPrefix: 'facade-nested-alias-side-effect',
    updateIdPrefix: 'facade-nested-alias-update-id'
  });
  const initialElement = {
    props: {
      children: {
        props: {
          children: 'alias nested initial',
          id: 'alias-nested-child'
        },
        type: 'span'
      },
      id: 'alias-nested-parent'
    },
    type: 'section'
  };
  const nextElement = {
    props: {
      children: {
        props: {
          children: 'alias nested updated',
          id: 'alias-nested-child',
          'data-phase': 'updated'
        },
        type: 'span'
      },
      id: 'alias-nested-parent'
    },
    type: 'section'
  };
  const hostInitialElement = {
    props: {
      children: 'alias host initial',
      id: 'alias-host'
    },
    type: 'article'
  };
  const hostNextElement = {
    props: {
      children: 'alias host updated',
      id: 'alias-host',
      'data-phase': 'updated'
    },
    type: 'article'
  };

  const crossDocument = createDocument('private-client-facade-nested-alias-cross');
  const crossContainer = createElement('DIV', crossDocument);
  const crossRoot = adapter.createRoot(crossContainer);
  const crossDiagnostic = adapter.renderHostOutput(
    crossRoot,
    hostInitialElement
  );
  const crossHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      crossDiagnostic
    );
  const crossUpdateDocument = createDocument(
    'private-client-facade-nested-alias-cross-update'
  );
  const crossUpdateContainer = createElement('DIV', crossUpdateDocument);
  const crossUpdateRoot = adapter.createRoot(crossUpdateContainer);
  const crossUpdateInitialDiagnostic = adapter.renderHostOutput(
    crossUpdateRoot,
    hostInitialElement
  );
  const crossUpdateInitialHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      crossUpdateInitialDiagnostic
    );
  const crossUpdateDiagnostic = adapter.updateHostOutput(
    crossUpdateRoot,
    hostNextElement
  );
  const crossUpdateHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload(
      crossUpdateDiagnostic
    );
  const crossUnmountDocument = createDocument(
    'private-client-facade-nested-alias-cross-unmount'
  );
  const crossUnmountContainer = createElement('DIV', crossUnmountDocument);
  const crossUnmountRoot = adapter.createRoot(crossUnmountContainer);
  const crossUnmountRecord = crossUnmountRoot.unmount();
  const callerBuiltRootBoundary = Object.freeze({
    kind: 'FastReactDomPrivateRootLifecycleRequestBoundaryRecord',
    operation: 'root-lifecycle-request-boundary'
  });
  const callerBuiltHydrateBoundary = Object.freeze({
    kind: 'FastReactDomPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryRecord',
    operation: 'hydrate-root-lifecycle-request-boundary'
  });

  function assertNestedUpdateRejects(label, createOptions) {
    const document = createDocument(
      `private-client-facade-nested-alias-${label}`
    );
    const container = createElement('DIV', document);
    const root = adapter.createRoot(container);
    const create = adapter.getRootCreateRecord(root);
    const options = createOptions({create});

    assert.throws(
      () =>
        adapter.updateNestedHostOutput(
          root,
          initialElement,
          nextElement,
          options
        ),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE'
      }
    );
    assert.deepEqual(adapter.getRootNestedHostOutputUpdateDiagnostics(root), []);
    assert.deepEqual(adapter.getRootRequestRecords(root), [create]);
    assert.deepEqual(
      rootBridge.getPrivateRootPublicFacadeRootPayload(root)
        .hostOutputNestedUpdateRecords,
      []
    );
    assert.deepEqual(
      rootBridge.getPrivateRootPublicFacadeRootPayload(root)
        .lifecycleRequestBoundaryRecords,
      []
    );
    assertBridgeDidNotTouchContainer(container, document);
  }

  const rejectionCases = [
    [
      'render-callback-boundary',
      () => ({renderCallback: crossHidden.lifecycleRequestBoundary})
    ],
    [
      'update-callback-boundary',
      () => ({updateCallback: crossHidden.lifecycleRequestBoundary})
    ],
    [
      'callback-boundary',
      () => ({callback: crossHidden.lifecycleRequestBoundary})
    ],
    [
      'source-create-record',
      ({create}) => ({sourceCreateRecord: create})
    ],
    [
      'source-render-record',
      () => ({sourceRenderRecord: crossHidden.renderRecord})
    ],
    [
      'source-update-record',
      () => ({sourceUpdateRecord: crossUpdateHidden.updateRecord})
    ],
    [
      'source-unmount-record',
      () => ({sourceUnmountRecord: crossUnmountRecord})
    ],
    [
      'source-boundary-alias',
      () => ({sourceBoundary: crossHidden.lifecycleRequestBoundary})
    ],
    [
      'request-boundary-alias',
      () => ({requestBoundary: crossHidden.lifecycleRequestBoundary})
    ],
    [
      'source-snapshot-alias',
      () => ({sourceSnapshot: crossDiagnostic.sourceContainerSnapshot})
    ],
    [
      'source-container-snapshot-alias',
      () => ({
        sourceContainerSnapshot: crossDiagnostic.sourceContainerSnapshot
      })
    ],
    [
      'caller-built-root-boundary-shape',
      () => ({renderCallback: callerBuiltRootBoundary})
    ],
    [
      'caller-built-hydrate-boundary-shape',
      () => ({updateCallback: callerBuiltHydrateBoundary})
    ],
    [
      'top-level-boundary-shape',
      () => callerBuiltRootBoundary
    ]
  ];

  for (const [label, createOptions] of rejectionCases) {
    assertNestedUpdateRejects(label, createOptions);
  }

  crossHidden.bridge.cleanupInitialRenderHostOutput(
    crossHidden.hostOutputHandoff
  );
  crossUpdateInitialHidden.bridge.cleanupInitialRenderHostOutput(
    crossUpdateInitialHidden.hostOutputHandoff
  );
  assert.equal(crossContainer.childNodes.length, 0);
  assert.equal(crossUpdateContainer.childNodes.length, 0);
  assertBridgeDidNotTouchContainer(crossUnmountContainer, crossUnmountDocument);
});

test('private react-dom/client facade nested host-output native handoff fails closed', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const initialElement = {
    props: {
      children: {
        props: {
          children: 'nested initial native guard',
          className: 'native-guard-child-initial',
          'data-phase': 'initial',
          id: 'native-guard-child'
        },
        type: 'span'
      },
      id: 'native-guard-parent',
      'data-shell': 'stable'
    },
    type: 'section'
  };
  const nextElement = {
    props: {
      children: {
        props: {
          children: 'nested updated native guard',
          className: 'native-guard-child-updated',
          'data-phase': 'updated',
          id: 'native-guard-child',
          title: 'updated native guard'
        },
        type: 'span'
      },
      id: 'native-guard-parent',
      'data-shell': 'stable'
    },
    type: 'section'
  };

  const initialStyleElement = {
    props: {
      children: {
        props: {
          children: 'nested initial native guard',
          id: 'native-guard-child',
          style: {
            color: 'blue',
            opacity: 0.25
          }
        },
        type: 'span'
      },
      id: 'native-guard-parent'
    },
    type: 'section'
  };
  const nextStyleElement = {
    props: {
      children: {
        props: {
          children: 'nested updated native guard',
          id: 'native-guard-child',
          style: {
            color: 'green',
            opacity: 0.5
          }
        },
        type: 'span'
      },
      id: 'native-guard-parent'
    },
    type: 'section'
  };

  function createScenario(label, options) {
    const document = createDocument(label);
    if (options && options.withStyleTarget) {
      const createDocumentElement = document.createElement;
      document.createElement = function createFakeElementWithStyle(tagName) {
        const element = createDocumentElement.call(this, tagName);
        element.style = {
          setProperty(name, value) {
            this[String(name)] = String(value);
          }
        };
        return element;
      };
    }
    const container = createElement('DIV', document);
    if (options && options.withStyleContainer) {
      container.style = {
        setProperty(name, value) {
          this[String(name)] = String(value);
        }
      };
    }
    const adapter = descriptor.value({
      createRenderAdmissionIdPrefix: `${label}-admission`,
      hostOutputUpdateIdPrefix: `${label}-handoff`,
      nativeEnvironmentId: 848,
      nativeHandoffIdPrefix: `${label}-native`,
      publicFacadeNestedHostOutputUpdateIdPrefix: `${label}-diagnostic`,
      requestIdPrefix: `${label}-request`,
      rootIdPrefix: `${label}-root`,
      sideEffectIdPrefix: `${label}-side-effect`,
      updateIdPrefix: `${label}-update`
    });
    const root = adapter.createRoot(container);
    return {
      adapter,
      container,
      document,
      root
    };
  }

  function assertRejectedScenario(scenario, options) {
    const expectedContainerRegistrations =
      options && Object.prototype.hasOwnProperty.call(
        options,
        'containerRegistrations'
      )
        ? options.containerRegistrations
        : 0;
    assert.deepEqual(
      scenario.adapter.getRootNestedHostOutputUpdateDiagnostics(scenario.root),
      []
    );
    assert.equal(scenario.container.childNodes.length, 0);
    assert.equal(rootMarkers.getContainerRoot(scenario.container), null);
    assert.equal(listenerRegistry.hasListeningMarker(scenario.container), false);
    assert.equal(listenerRegistry.hasListeningMarker(scenario.document), false);
    assert.equal(
      scenario.container.__registrations.length,
      expectedContainerRegistrations
    );
    assert.equal(scenario.document.__registrations.length, 0);
  }

  const clonedScenario = createScenario('nested-native-cloned');
  let clonedFactoryCalled = false;
  assert.throws(
    () =>
      clonedScenario.adapter.updateNestedHostOutput(
        clonedScenario.root,
        initialElement,
        nextElement,
        {
          nativeHandoffRecordFactory({bridge, updateRecord}) {
            clonedFactoryCalled = true;
            const handoff = bridge.createNativeRequestHandoff(updateRecord);
            return Object.freeze({
              ...handoff,
              nativeRequestRecord: Object.freeze({
                ...handoff.nativeRequestRecord
              })
            });
          }
        }
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE'
    }
  );
  assert.equal(clonedFactoryCalled, true);
  assertRejectedScenario(clonedScenario);

  const foreignBridge = rootBridge.createPrivateRootBridgeShell({
    nativeEnvironmentId: 1848,
    nativeHandoffIdPrefix: 'nested-native-foreign-native',
    requestIdPrefix: 'nested-native-foreign-request',
    rootIdPrefix: 'nested-native-foreign-root',
    updateIdPrefix: 'nested-native-foreign-update'
  });
  const foreignContainer = createElement(
    'DIV',
    createDocument('nested-native-foreign-container')
  );
  const foreignCreate = foreignBridge.createClientRoot(foreignContainer);
  const foreignUpdate = foreignBridge.renderContainer(foreignCreate.handle, {
    props: {
      children: 'foreign native update'
    },
    type: 'section'
  });
  const foreignHandoff =
    foreignBridge.createNativeRequestHandoff(foreignUpdate);
  const foreignScenario = createScenario('nested-native-foreign');
  assert.throws(
    () =>
      foreignScenario.adapter.updateNestedHostOutput(
        foreignScenario.root,
        initialElement,
        nextElement,
        {
          nativeHandoffRecord: foreignHandoff
        }
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE'
    }
  );
  assertRejectedScenario(foreignScenario);

  const staleScenario = createScenario('nested-native-stale');
  let staleFactoryCalled = false;
  assert.throws(
    () =>
      staleScenario.adapter.updateNestedHostOutput(
        staleScenario.root,
        initialElement,
        nextElement,
        {
          nativeHandoffRecordFactory({bridge, rootHandle, updateRecord}) {
            staleFactoryCalled = true;
            const handoff = bridge.createNativeRequestHandoff(updateRecord);
            bridge.renderContainer(rootHandle, nextElement);
            return handoff;
          }
        }
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE'
    }
  );
  assert.equal(staleFactoryCalled, true);
  assertRejectedScenario(staleScenario);

  const tamperScenarios = [
    {
      label: 'text-tamper',
      mutate({textInstance}) {
        textInstance.nodeValue = 'tampered nested native guard';
      }
    },
    {
      label: 'child-attribute-tamper',
      mutate({childHostInstanceNode}) {
        childHostInstanceNode.setAttribute('data-phase', 'tampered');
      }
    },
    {
      label: 'child-extra-attribute',
      mutate({childHostInstanceNode}) {
        childHostInstanceNode.setAttribute('data-extra', 'tampered');
      }
    },
    {
      label: 'child-extra-property',
      mutate({childHostInstanceNode}) {
        childHostInstanceNode.extraNativeHandoffProperty = 'tampered';
      }
    },
    {
      label: 'child-style-tamper',
      initialElement: initialStyleElement,
      mutate({childHostInstanceNode}) {
        childHostInstanceNode.style.color = 'purple';
      },
      nextElement: nextStyleElement,
      options: {withStyleTarget: true}
    },
    {
      label: 'child-extra-style',
      initialElement: initialStyleElement,
      mutate({childHostInstanceNode}) {
        childHostInstanceNode.style.backgroundColor = 'red';
      },
      nextElement: nextStyleElement,
      options: {withStyleTarget: true}
    },
    {
      label: 'parent-attribute-tamper',
      mutate({parentHostInstanceNode}) {
        parentHostInstanceNode.setAttribute('data-shell', 'tampered');
      }
    },
    {
      label: 'parent-extra-attribute',
      mutate({parentHostInstanceNode}) {
        parentHostInstanceNode.setAttribute('data-extra', 'tampered');
      }
    },
    {
      label: 'container-extra-attribute',
      mutate({container}) {
        container.setAttribute('data-container-extra', 'tampered');
      }
    },
    {
      label: 'container-extra-property',
      mutate({container}) {
        container.extraNativeHandoffProperty = 'tampered';
      }
    },
    {
      label: 'container-extra-style',
      mutate({container}) {
        container.style.backgroundColor = 'red';
      },
      options: {withStyleContainer: true}
    },
    {
      assertRejectedOptions: {containerRegistrations: 1},
      label: 'container-listener-install',
      mutate({container}) {
        container.addEventListener(
          'click',
          function onContainerNativeHandoffClick() {}
        );
      }
    },
    {
      label: 'parent-listener-install',
      mutate({parentHostInstanceNode}) {
        parentHostInstanceNode.addEventListener(
          'click',
          function onParentNativeHandoffClick() {}
        );
      }
    },
    {
      label: 'child-listener-install',
      mutate({childHostInstanceNode}) {
        childHostInstanceNode.addEventListener(
          'click',
          function onChildNativeHandoffClick() {}
        );
      }
    },
    {
      label: 'text-listener-install',
      mutate({textInstance}) {
        textInstance.addEventListener(
          'click',
          function onTextNativeHandoffClick() {}
        );
      }
    },
    {
      label: 'extra-child-sibling',
      mutate({childHostInstanceNode, container}) {
        childHostInstanceNode.appendChild(
          container.ownerDocument.createTextNode('')
        );
      }
    },
    {
      label: 'extra-parent-child-sibling',
      mutate({parentHostInstanceNode, container}) {
        parentHostInstanceNode.appendChild(
          container.ownerDocument.createTextNode('')
        );
      }
    }
  ];
  for (const tamper of tamperScenarios) {
    const scenario = createScenario(
      `nested-native-${tamper.label}`,
      tamper.options
    );
    let factoryCalled = false;
    assert.throws(
      () =>
        scenario.adapter.updateNestedHostOutput(
          scenario.root,
          tamper.initialElement || initialElement,
          tamper.nextElement || nextElement,
          {
            nativeHandoffRecordFactory(factoryContext) {
              factoryCalled = true;
              const handoff = factoryContext.bridge.createNativeRequestHandoff(
                factoryContext.updateRecord
              );
              tamper.mutate(factoryContext);
              return handoff;
            }
          }
        ),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE'
      }
    );
    assert.equal(factoryCalled, true, tamper.label);
    assertRejectedScenario(scenario, tamper.assertRejectedOptions);
  }

  const mismatchedHostOutputScenario =
    createScenario('nested-native-mismatched-host-output');
  let mismatchedHostOutputFactoryCalled = false;
  assert.throws(
    () =>
      mismatchedHostOutputScenario.adapter.updateNestedHostOutput(
        mismatchedHostOutputScenario.root,
        initialElement,
        nextElement,
        {
          nativeHandoffRecordFactory({
            bridge,
            childHostInstanceNode,
            updateRecord
          }) {
            mismatchedHostOutputFactoryCalled = true;
            const handoff = bridge.createNativeRequestHandoff(updateRecord);
            componentTree.detachHostInstanceSubtree(childHostInstanceNode, {
              includeRoot: true
            });
            return handoff;
          }
        }
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE'
    }
  );
  assert.equal(mismatchedHostOutputFactoryCalled, true);
  assertRejectedScenario(mismatchedHostOutputScenario);
});

test('private react-dom/client facade host-output diagnostic fails closed', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value();
  const otherAdapter = descriptor.value();
  const document = createDocument('private-client-facade-host-output-invalid');
  const container = createElement('DIV', document);
  const root = adapter.createRoot(container);
  const element = {
    props: {
      children: 'valid child'
    },
    type: 'section'
  };

  assert.throws(() => otherAdapter.renderHostOutput(root, element), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => otherAdapter.unmountHostOutput(root, element), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => otherAdapter.renderNativeHandoff(root, element), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => adapter.renderHostOutput({}, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_ADAPTER'
  });
  assert.throws(() => adapter.unmountHostOutput({}, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_ADAPTER'
  });
  assert.throws(() => adapter.renderNativeHandoff({}, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_ADAPTER'
  });

  const unsupportedContainer = createElement('DIV', document);
  const unsupportedRoot = adapter.createRoot(unsupportedContainer);
  assert.throws(
    () =>
      adapter.renderHostOutput(unsupportedRoot, {
        props: {
          children: ['unsupported']
        },
        type: 'section'
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF'
    }
  );
  assert.throws(
    () =>
      adapter.unmountHostOutput(unsupportedRoot, {
        props: {
          children: ['unsupported']
        },
        type: 'section'
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF'
    }
  );
  assert.throws(
    () =>
      adapter.renderNativeHandoff(unsupportedRoot, {
        props: {
          children: ['unsupported']
        },
        type: 'section'
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF'
    }
  );
  assert.equal(
    adapter.getRootRequestRecords(unsupportedRoot).length,
    1
  );
  assert.deepEqual(adapter.getRootRenderNativeHandoffRecords(unsupportedRoot), []);
  assertBridgeDidNotTouchContainer(unsupportedContainer, document);

  const occupiedDocument = createDocument('private-client-facade-host-output-occupied');
  const occupiedContainer = createElement('DIV', occupiedDocument);
  rootMarkers.markContainerAsRoot(
    rootBridge.createPrivateRootOwner('occupied-host-output-root:1'),
    occupiedContainer
  );
  const occupiedRoot = adapter.createRoot(occupiedContainer);
  assert.throws(() => adapter.renderHostOutput(occupiedRoot, element), {
    code: 'FAST_REACT_DOM_ROOT_MARKER_OCCUPIED'
  });
  assert.throws(() => adapter.unmountHostOutput(occupiedRoot, element), {
    code: 'FAST_REACT_DOM_ROOT_MARKER_OCCUPIED'
  });
  assert.throws(() => adapter.renderNativeHandoff(occupiedRoot, element), {
    code: 'FAST_REACT_DOM_ROOT_MARKER_OCCUPIED'
  });
  assert.equal(adapter.getRootRequestRecords(occupiedRoot).length, 1);
  assert.equal(occupiedContainer.childNodes.length, 0);
  assert.equal(occupiedContainer.__registrations.length, 0);
  assert.equal(occupiedDocument.__registrations.length, 0);

  const staleMetadataDocument = createDocument(
    'private-client-facade-host-output-stale-work-loop'
  );
  const staleMetadataContainer = createElement('DIV', staleMetadataDocument);
  const staleMetadataRoot = adapter.createRoot(staleMetadataContainer);
  const staleMetadataCreate =
    adapter.getRootCreateRecord(staleMetadataRoot);
  assert.throws(
    () =>
      adapter.renderNativeHandoff(staleMetadataRoot, element, {
        rootWorkLoopFinishedWorkMetadata:
          createRootWorkLoopFinishedWorkMetadata({
            hostType: 'section',
            metadataRevision: 'root-work-loop-finished-work-handoff-stale',
            renderUpdateId: 'stale-work-loop-update:1',
            rootId: staleMetadataCreate.rootId,
            rootTag: staleMetadataCreate.rootTag,
            textContent: 'valid child'
          })
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER',
      message: /Stale root work-loop finished-work metadata/
    }
  );
  assertBridgeDidNotTouchContainer(
    staleMetadataContainer,
    staleMetadataDocument
  );
  assert.deepEqual(
    adapter.getRootHostOutputRenderDiagnostics(staleMetadataRoot),
    []
  );
  assert.deepEqual(
    adapter.getRootRenderNativeHandoffRecords(staleMetadataRoot),
    []
  );

  const foreignMetadataDocument = createDocument(
    'private-client-facade-host-output-foreign-work-loop'
  );
  const foreignMetadataContainer = createElement('DIV', foreignMetadataDocument);
  const foreignMetadataRoot = adapter.createRoot(foreignMetadataContainer);
  const foreignMetadataCreate =
    adapter.getRootCreateRecord(foreignMetadataRoot);
  assert.throws(
    () =>
      adapter.renderHostOutput(foreignMetadataRoot, element, {
        rootWorkLoopFinishedWorkMetadata:
          createRootWorkLoopFinishedWorkMetadata({
            hostType: 'section',
            renderUpdateId: 'foreign-work-loop-update:1',
            rootId: `${foreignMetadataCreate.rootId}:foreign`,
            rootTag: foreignMetadataCreate.rootTag,
            textContent: 'valid child'
          })
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER',
      message: /Foreign root work-loop finished-work metadata/
    }
  );
  assertBridgeDidNotTouchContainer(
    foreignMetadataContainer,
    foreignMetadataDocument
  );
  assert.deepEqual(
    adapter.getRootHostOutputRenderDiagnostics(foreignMetadataRoot),
    []
  );

  const activeDiagnostic = adapter.renderHostOutput(root, element);
  const activePayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      activeDiagnostic
    );
  assert.throws(() => otherAdapter.createRenderNativeHandoff(root, activeDiagnostic), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => adapter.renderHostOutput(root, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER'
  });
  assert.throws(() => adapter.renderNativeHandoff(root, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER'
  });
  assert.throws(() => adapter.unmountHostOutput(root, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT'
  });
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [
    activeDiagnostic
  ]);
  assert.equal(adapter.getRootRequestRecords(root).length, 2);
  activePayload.bridge.renderContainer(activePayload.rootHandle, element);
  assert.throws(
    () => adapter.createRenderNativeHandoff(root, activeDiagnostic),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_RENDER_NATIVE_HANDOFF',
      message: /Stale private root render records/
    }
  );
  activePayload.bridge.cleanupInitialRenderHostOutput(
    activePayload.hostOutputHandoff
  );

  const sameContainerDocument = createDocument(
    'private-client-facade-host-output-same-container-boundary'
  );
  const sameContainer = createElement('DIV', sameContainerDocument);
  const sameContainerRoot = adapter.createRoot(sameContainer);
  const sameContainerDiagnostic = adapter.renderHostOutput(
    sameContainerRoot,
    element
  );
  const sameContainerPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      sameContainerDiagnostic
    );
  adapter.createRoot(sameContainer);
  assert.throws(
    () =>
      adapter.createRenderNativeHandoff(
        sameContainerRoot,
        sameContainerDiagnostic
      ),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_RENDER_NATIVE_HANDOFF',
      message: /stale same-container lifecycle request-boundary/
    }
  );
  sameContainerPayload.bridge.cleanupInitialRenderHostOutput(
    sameContainerPayload.hostOutputHandoff
  );

  const hydrateRecord = rootBridge.createHydrateRootRecord(
    createElement('DIV', document),
    'hydrated',
    {}
  );
  assert.throws(
    () => rootBridge.createPrivateRootRenderNativeHandoffRecord(hydrateRecord),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_RENDER_NATIVE_HANDOFF',
      message: /hydrateRoot/
    }
  );

  const unmountedDocument = createDocument(
    'private-client-facade-host-output-unmounted'
  );
  const unmountedContainer = createElement('DIV', unmountedDocument);
  const unmountedRoot = adapter.createRoot(unmountedContainer);
  unmountedRoot.unmount();
  assert.throws(() => adapter.renderHostOutput(unmountedRoot, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER'
  });
  assert.throws(() => adapter.renderNativeHandoff(unmountedRoot, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER'
  });
  assert.throws(() => adapter.unmountHostOutput(unmountedRoot, element), {
    code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT'
  });
  assertBridgeDidNotTouchContainer(unmountedContainer, unmountedDocument);
});

test('private react-dom/client facade lifecycle source records fail closed', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: 'facade-source-update-handoff',
    initialHostOutputIdPrefix: 'facade-source-initial',
    nativeHandoffIdPrefix: 'facade-source-native',
    publicFacadeHostOutputRenderIdPrefix: 'facade-source-render',
    publicFacadeHostOutputUpdateIdPrefix: 'facade-source-update',
    publicFacadeHostOutputUnmountCleanupIdPrefix: 'facade-source-unmount',
    requestIdPrefix: 'facade-source-request',
    rootIdPrefix: 'facade-source-root',
    updateIdPrefix: 'facade-source-update-id'
  });
  const initialElement = {
    props: {
      children: 'source initial output',
      id: 'facade-source-host',
      'data-phase': 'initial'
    },
    type: 'section'
  };
  const nextElement = {
    props: {
      children: 'source updated output',
      id: 'facade-source-host',
      'data-phase': 'updated'
    },
    type: 'section'
  };

  const renderDocument = createDocument('private-client-facade-source-render');
  const renderContainer = createElement('DIV', renderDocument);
  const renderRoot = adapter.createRoot(renderContainer);
  const renderCreate = adapter.getRootCreateRecord(renderRoot);
  const clonedCreateRecord = Object.freeze({...renderCreate});
  assert.throws(
    () =>
      adapter.renderHostOutput(renderRoot, initialElement, {
        sourceCreateRecord: clonedCreateRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER',
      message: /cloned or caller-built createRoot source record/
    }
  );
  let renderMetadataGetterCalled = false;
  assert.throws(
    () =>
      adapter.renderHostOutput(renderRoot, initialElement, {
        get rootWorkLoopFinishedWorkMetadata() {
          renderMetadataGetterCalled = true;
          return {};
        },
        sourceCreateRecord: clonedCreateRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER',
      message: /cloned or caller-built createRoot source record/
    }
  );
  assert.equal(renderMetadataGetterCalled, false);
  const crossCreateDocument = createDocument(
    'private-client-facade-source-render-cross-create'
  );
  const crossCreateContainer = createElement('DIV', crossCreateDocument);
  const crossCreateRoot = adapter.createRoot(crossCreateContainer);
  const crossCreateRecord = adapter.getRootCreateRecord(crossCreateRoot);
  assert.throws(
    () =>
      adapter.renderHostOutput(renderRoot, initialElement, {
        sourceCreateRecord: crossCreateRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER',
      message: /cloned or caller-built createRoot source record/
    }
  );
  const callerBuiltRenderRecord = Object.freeze({
    $$typeof: rootBridge.privateRootUpdateRecordType,
    operation: 'render',
    requestId: 'caller-built-render:1',
    requestSequence: 1,
    requestType: 'root.render',
    rootId: renderCreate.rootId,
    rootKind: renderCreate.rootKind,
    rootTag: renderCreate.rootTag,
    updateId: 'caller-built-render-update:1'
  });
  assert.throws(
    () =>
      adapter.renderHostOutput(renderRoot, initialElement, {
        sourceRenderRecord: callerBuiltRenderRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_RENDER',
      message: /cloned or caller-built source record/
    }
  );
  assertBridgeDidNotTouchContainer(renderContainer, renderDocument);
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(renderRoot), []);
  assert.equal(adapter.getRootRequestRecords(renderRoot).length, 1);

  const updateDocument = createDocument('private-client-facade-source-update');
  const updateContainer = createElement('DIV', updateDocument);
  const updateRoot = adapter.createRoot(updateContainer);
  const updateCreate = adapter.getRootCreateRecord(updateRoot);
  const initialDiagnostic = adapter.renderHostOutput(
    updateRoot,
    initialElement
  );
  const initialPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      initialDiagnostic
    );
  const clonedLifecycleRequestBoundary = Object.freeze({
    ...initialPayload.lifecycleRequestBoundary
  });
  assert.throws(
    () =>
      adapter.updateHostOutput(updateRoot, nextElement, {
        lifecycleRequestBoundary:
          initialPayload.lifecycleRequestBoundary
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /caller-supplied, stale, replayed, cloned, cross-root/
    }
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(updateRoot, nextElement, {
        lifecycleRequestBoundary: clonedLifecycleRequestBoundary
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /caller-supplied, stale, replayed, cloned, cross-root/
    }
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(updateRoot, nextElement, {
        sourceContainerSnapshot:
          initialDiagnostic.sourceContainerSnapshot
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /lifecycle request-boundary evidence/
    }
  );
  assert.throws(
    () =>
      adapter.updateHostOutput(updateRoot, nextElement, {
        sourceUpdateRecord: initialPayload.renderRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /stale source record snapshot/
    }
  );
  const clonedRenderRecord = Object.freeze({...initialPayload.renderRecord});
  assert.throws(
    () =>
      adapter.updateHostOutput(updateRoot, nextElement, {
        sourceUpdateRecord: clonedRenderRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /cloned or caller-built source record/
    }
  );
  const crossUpdateDocument = createDocument(
    'private-client-facade-source-update-cross-render'
  );
  const crossUpdateContainer = createElement('DIV', crossUpdateDocument);
  const crossUpdateRoot = adapter.createRoot(crossUpdateContainer);
  const crossUpdateDiagnostic = adapter.renderHostOutput(
    crossUpdateRoot,
    initialElement
  );
  const crossUpdatePayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(
      crossUpdateDiagnostic
    );
  assert.throws(
    () =>
      adapter.updateHostOutput(updateRoot, nextElement, {
        sourceUpdateRecord: crossUpdatePayload.renderRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UPDATE',
      message: /cloned or caller-built source record/
    }
  );
  assert.deepEqual(adapter.getRootRequestRecords(updateRoot), [
    updateCreate,
    initialPayload.renderRecord
  ]);
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(updateRoot), []);
  assert.equal(updateContainer.childNodes.length, 1);
  assert.equal(updateContainer.textContent, 'source initial output');
  assert.deepEqual(attributeEntries(updateContainer.firstChild), [
    ['data-phase', 'initial'],
    ['id', 'facade-source-host']
  ]);
  assert.equal(rootMarkers.getContainerRoot(updateContainer), null);
  assert.equal(listenerRegistry.hasListeningMarker(updateContainer), false);
  assert.equal(listenerRegistry.hasListeningMarker(updateDocument), false);
  assert.equal(updateContainer.__registrations.length, 0);
  assert.equal(updateDocument.__registrations.length, 0);

  const unmountDocument = createDocument('private-client-facade-source-unmount');
  const unmountContainer = createElement('DIV', unmountDocument);
  const unmountRoot = adapter.createRoot(unmountContainer);
  const unmountCreate = adapter.getRootCreateRecord(unmountRoot);
  const callerBuiltUnmountRecord = Object.freeze({
    $$typeof: rootBridge.privateRootUpdateRecordType,
    operation: 'unmount',
    requestId: 'caller-built-unmount:1',
    requestSequence: 1,
    requestType: 'root.unmount',
    rootId: unmountCreate.rootId,
    rootKind: unmountCreate.rootKind,
    rootTag: unmountCreate.rootTag,
    updateId: 'caller-built-unmount-update:1'
  });
  assert.throws(
    () =>
      adapter.unmountHostOutput(unmountRoot, initialElement, {
        sourceUnmountRecord: callerBuiltUnmountRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /cloned or caller-built source record/
    }
  );
  const crossUnmountDocument = createDocument(
    'private-client-facade-source-unmount-cross-record'
  );
  const crossUnmountContainer = createElement('DIV', crossUnmountDocument);
  const crossUnmountRoot = adapter.createRoot(crossUnmountContainer);
  const crossUnmountRecord = crossUnmountRoot.unmount();
  assert.throws(
    () =>
      adapter.unmountHostOutput(unmountRoot, initialElement, {
        sourceUnmountRecord: crossUnmountRecord
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT',
      message: /cloned or caller-built source record/
    }
  );
  assertBridgeDidNotTouchContainer(unmountContainer, unmountDocument);
  assert.deepEqual(
    adapter.getRootHostOutputUnmountCleanupDiagnostics(unmountRoot),
    []
  );
  assert.equal(adapter.getRootRequestRecords(unmountRoot).length, 1);

  crossUpdatePayload.bridge.cleanupInitialRenderHostOutput(
    crossUpdatePayload.hostOutputHandoff
  );
  initialPayload.bridge.cleanupInitialRenderHostOutput(
    initialPayload.hostOutputHandoff
  );
  assert.equal(updateContainer.childNodes.length, 0);
});

test('private react-dom/client facade marker/listener preflight fails closed', () => {
  const document = createDocument('private-client-facade-preflight-invalid');
  const container = createElement('DIV', document);
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    rootBridge.privateRootPublicFacadeAdapterSymbol
  );
  const adapter = descriptor.value();
  const otherAdapter = descriptor.value();
  const root = adapter.createRoot(container);

  assert.throws(
    () => otherAdapter.preflightRootMarkerListenerSetupAndCleanup(root),
    {
      code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
    }
  );
  assert.throws(
    () => adapter.preflightRootMarkerListenerSetupAndCleanup({}),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_ADAPTER'
    }
  );

  const occupiedDocument = createDocument('private-client-facade-occupied');
  const occupiedContainer = createElement('DIV', occupiedDocument);
  rootMarkers.markContainerAsRoot(
    rootBridge.createPrivateRootOwner('occupied-public-facade-root:1'),
    occupiedContainer
  );
  const occupiedRoot = adapter.createRoot(occupiedContainer);
  assert.throws(
    () => adapter.preflightRootMarkerListenerSetupAndCleanup(occupiedRoot),
    {
      code: 'FAST_REACT_DOM_ROOT_MARKER_OCCUPIED'
    }
  );
  assert.equal(occupiedContainer.__registrations.length, 0);
  assert.equal(occupiedDocument.__registrations.length, 0);

  const unmountedDocument = createDocument('private-client-facade-unmounted');
  const unmountedContainer = createElement('DIV', unmountedDocument);
  const unmountedRoot = adapter.createRoot(unmountedContainer);
  unmountedRoot.unmount();
  assert.throws(
    () =>
      adapter.preflightRootMarkerListenerSetupAndCleanup(unmountedRoot),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
    }
  );
  assertBridgeDidNotTouchContainer(unmountedContainer, unmountedDocument);
});

test('public react-dom/client root placeholders remain inert', () => {
  const document = createDocument('public-placeholder');
  const container = createElement('DIV', document);

  assert.deepEqual(Object.keys(reactDomClient), [
    'createRoot',
    'hydrateRoot',
    'version'
  ]);
  assert.equal(reactDomClient.__FAST_REACT_PLACEHOLDER__, true);
  assert.throws(() => reactDomClient.createRoot(container), {
    code: 'FAST_REACT_UNIMPLEMENTED',
    entrypoint: 'react-dom/client',
    exportName: 'createRoot'
  });
  assertBridgeDidNotTouchContainer(container, document);
});
