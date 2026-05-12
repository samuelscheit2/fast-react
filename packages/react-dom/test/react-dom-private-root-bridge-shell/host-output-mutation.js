'use strict';

const {
  assert,
  test,
  reactDomClient,
  resourceFormGate,
  controlledRestoreQueue,
  rootBridge,
  componentTree,
  createDangerousHtmlTextResetDiagnostic,
  domHost,
  rootMarkers,
  listenerRegistry,
  createHostOutputProps,
  createHostOutputAttributeStyleProps,
  createRootWorkLoopFinishedWorkMetadata,
  createRootCommitHostComponentUpdateRecord,
  createRootCommitHostTextUpdateRecord,
  createRootCommitPropertyTextFixture,
  cleanupRootCommitPropertyTextFixture,
  createDangerousHtmlTextResetExecutionFixture,
  cleanupDangerousHtmlTextResetExecutionFixture,
  mountPrivateHostOutput,
  activeHostOutputAttributes,
  activeHostOutputStyleProperties,
  createRootBridgeControlledFakeDomRestoreExecution,
  isControlledRestoreLiveValueKey,
  createHostOutputDocument,
  createDocument,
  createElement,
  createTextNode,
  attributeEntries,
  assertPublicCreateRootMinimalHostOutput
} = require('./context.js');

test('private initial host output handoff applies and cleans fake-DOM host nodes', () => {
  const document = createDocument('private-initial-host-output');
  const container = createElement('DIV', document);
  const element = {
    props: {
      children: 'hello bridge',
      id: 'root-host',
      onClick() {
        return 'not-invoked';
      },
      title: 'Initial host'
    },
    type: 'main'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'initial-admission',
    initialHostOutputIdPrefix: 'initial-output',
    sideEffectIdPrefix: 'initial-side-effect'
  });

  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, element);
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );
  const handoff = bridge.applyInitialRenderHostOutput(admission);
  const hidden =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(handoff);

  assert.equal(
    rootBridge.applyPrivateInitialRenderHostOutput(admission),
    handoff
  );
  assert.equal(
    rootBridge.isPrivateRootInitialHostOutputHandoffRecord(handoff),
    true
  );
  assert.equal(Object.isFrozen(handoff), true);
  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootInitialHostOutputHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootInitialHostOutputHandoffRecord'
  );
  assert.equal(handoff.operation, 'initial-host-output');
  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED
  );
  assert.equal(handoff.handoffId, 'initial-output:1');
  assert.equal(handoff.sourceAdmissionId, 'initial-admission:1');
  assert.equal(handoff.rootId, create.rootId);
  assert.equal(handoff.hostType, 'main');
  assert.equal(handoff.containerChildCount, 1);
  assert.equal(handoff.hostChildCount, 1);
  assert.equal(handoff.textContent, 'hello bridge');
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'create-render-admission',
      'fake-dom-host-component',
      'fake-dom-host-text',
      'component-tree-host-instance-map',
      'latest-props-publication'
    ]
  );
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-object',
      'native-execution',
      'reconciler-execution',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(handoff.publicRootCreated, false);
  assert.equal(handoff.publicRootObjectExposed, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.rootScheduled, false);
  assert.equal(handoff.domMutation, true);
  assert.equal(handoff.markerWrites, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.hydration, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.compatibilityClaimed, false);

  const hostNode = container.childNodes[0];
  const textNode = hostNode.childNodes[0];
  assert.equal(hidden.admissionRecord, admission);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.renderRecord, render);
  assert.equal(hidden.sideEffectRecord, sideEffects);
  assert.equal(hidden.container, container);
  assert.equal(hidden.element, element);
  assert.equal(hidden.hostNode, hostNode);
  assert.equal(hidden.textNode, textNode);
  assert.equal(hidden.rootOwner, create.owner);
  assert.deepEqual(hidden.latestPropsBeforeCommit, {});
  assert.equal(hidden.latestPropsAfterCommit, element.props);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), create.owner);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), element.props);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.deepEqual(attributeEntries(hostNode), [
    ['id', 'root-host'],
    ['title', 'Initial host']
  ]);
  assert.deepEqual(hostNode.attributeLog, [
    ['setAttribute', 'id', 'root-host'],
    ['setAttribute', 'title', 'Initial host']
  ]);
  assert.equal(textNode.nodeValue, 'hello bridge');
  assert.deepEqual(container.mutationLog, [['appendChild', 'MAIN']]);
  assert.deepEqual(hostNode.mutationLog, [['appendChild', '#text']]);
  assert.equal(container.textContent, 'hello bridge');
  assert.equal(listenerRegistry.hasListeningMarker(container), true);
  assert.equal(listenerRegistry.hasListeningMarker(document), true);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('hello bridge'), true);
  assert.equal(serialized.includes('not-invoked'), false);

  const cleanup = bridge.cleanupInitialRenderHostOutput(handoff);
  assert.equal(
    rootBridge.cleanupPrivateInitialRenderHostOutput(handoff),
    cleanup
  );
  assert.equal(
    cleanup.$$typeof,
    rootBridge.privateRootInitialHostOutputCleanupRecordType
  );
  assert.equal(
    cleanup.cleanupStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_CLEANED
  );
  assert.equal(cleanup.sourceHandoffId, handoff.handoffId);
  assert.equal(cleanup.removedRootChild, true);
  assert.equal(cleanup.detachedHostInstanceCount, 2);
  assert.equal(cleanup.containerChildCountAfterCleanup, 0);
  assert.equal(cleanup.domMutation, true);
  assert.equal(cleanup.compatibilityClaimed, false);
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.textContent, '');
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), true);
  assert.equal(listenerRegistry.hasListeningMarker(document), true);

  bridge.revertCreateRootSideEffects(sideEffects);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.childNodes.length, 0);
});

test('private root render host-output consumes accepted Rust metadata and renders fake DOM only', () => {
  const document = createDocument('private-root-render-host-output');
  const container = createElement('DIV', document);
  const publicDocument = createDocument(
    'private-root-render-host-output-public'
  );
  const element = {
    props: {
      children: 'accepted rust host output',
      className: 'root-render-card',
      id: 'root-render-host',
      onClick() {
        return 'not-invoked';
      },
      title: 'Private root render'
    },
    type: 'article'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'root-render-admission',
    initialHostOutputIdPrefix: 'root-render-initial',
    requestIdPrefix: 'root-render-request',
    rootIdPrefix: 'root-render-root',
    rootRenderHostOutputIdPrefix: 'root-render-host-output',
    sideEffectIdPrefix: 'root-render-side-effect',
    updateIdPrefix: 'root-render-update'
  });
  const create = bridge.createClientRoot(container);
  const metadata = createRootWorkLoopFinishedWorkMetadata({
    rootId: create.rootId,
    rootTag: create.rootTag,
    renderUpdateId: 'root-render-update:1',
    hostType: 'article',
    textContent: 'accepted rust host output'
  });

  const record = bridge.renderRootHostOutput(create, element, {
    rootWorkLoopFinishedWorkMetadata: metadata
  });
  const hidden = rootBridge.getPrivateRootRenderHostOutputPayload(record);
  const finishedWork = record.rootWorkLoopFinishedWorkRecord;
  const finishedWorkPayload =
    rootBridge.getPrivateRootRenderHostOutputFinishedWorkPayload(
      finishedWork
    );

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    record.$$typeof,
    rootBridge.privateRootRenderHostOutputRecordType
  );
  assert.equal(record.kind, 'FastReactDomPrivateRootRenderHostOutputRecord');
  assert.equal(record.operation, 'private-root-render-host-output');
  assert.equal(
    record.renderStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_HOST_OUTPUT_APPLIED
  );
  assert.equal(record.renderId, 'root-render-host-output:1');
  assert.equal(record.rootId, create.rootId);
  assert.equal(record.createRequestId, 'root-render-request:1');
  assert.equal(record.renderRequestId, 'root-render-request:2');
  assert.equal(record.renderUpdateId, 'root-render-update:1');
  assert.equal(record.hostOutputHandoffId, 'root-render-initial:1');
  assert.equal(
    record.hostOutputHandoffStatus,
    rootBridge.ROOT_BRIDGE_INITIAL_HOST_OUTPUT_APPLIED
  );
  assert.equal(
    record.rootWorkLoopFinishedWorkStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_HOST_OUTPUT_FINISHED_WORK_ACCEPTED
  );
  assert.equal(
    record.rootWorkLoopFinishedWorkHandoffId,
    'root-render-update:1:root-render-host-output-finished-work'
  );
  assert.equal(record.rootWorkLoopFinishedWorkConsumed, true);
  assert.equal(record.rootWorkLoopPublicRootRenderingBlocked, true);
  assert.equal(record.hostType, 'article');
  assert.equal(record.hostOutputShape, 'host-component');
  assert.deepEqual(record.childTags, ['HostComponent', 'HostText']);
  assert.equal(record.textContent, 'accepted rust host output');
  assert.equal(
    record.domHostMutationGateMetadata,
    domHost.DOM_ROOT_RENDER_HOST_OUTPUT_MUTATION_GATE_METADATA
  );
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      'private-create-root-record',
      'private-root-render-record',
      'root-marker-setup-cleanup',
      'root-listener-setup-cleanup',
      'create-render-admission',
      'root-work-loop-finished-work-handoff',
      'fake-dom-host-output-mutation',
      'component-tree-host-instance-map',
      'latest-props-publication'
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
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
  assert.equal(record.privateRootRender, true);
  assert.equal(record.privateFacadeRoot, false);
  assert.equal(record.rustHostOutputMetadataAccepted, true);
  assert.equal(record.publicCreateRootEnabled, false);
  assert.equal(record.publicRootCreated, false);
  assert.equal(record.publicRootObjectExposed, false);
  assert.equal(record.publicRootExecution, false);
  assert.equal(record.publicRootRenderCompatibilityClaimed, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.rootScheduled, false);
  assert.equal(record.fakeDomMutation, true);
  assert.equal(record.domMutation, true);
  assert.equal(record.browserDomMutation, false);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.setupMarkerWrites, true);
  assert.equal(record.setupListenerInstallation, true);
  assert.equal(record.cleanupCompleted, true);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.refEffects, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.equal(rootBridge.isPrivateRootRenderHostOutputRecord(record), true);
  assert.equal(rootBridge.isPrivateRootRenderHostOutputRecord({}), false);
  assert.equal(rootBridge.getPrivateRootRenderHostOutputPayload({}), null);

  assert.equal(
    finishedWork.$$typeof,
    rootBridge.privateRootRenderHostOutputFinishedWorkRecordType
  );
  assert.equal(
    finishedWork.handoffStatus,
    rootBridge.ROOT_BRIDGE_ROOT_RENDER_HOST_OUTPUT_FINISHED_WORK_ACCEPTED
  );
  assert.equal(finishedWork.metadataSource, metadata.source);
  assert.equal(finishedWork.metadataStatus, metadata.status);
  assert.equal(finishedWork.renderUpdateId, 'root-render-update:1');
  assert.equal(finishedWork.rootChildTag, 'HostComponent');
  assert.equal(finishedWork.completedChildTag, 'HostComponent');
  assert.equal(finishedWork.hostTextChildTag, 'HostText');
  assert.equal(finishedWork.publicRootRenderingBlocked, true);
  assert.equal(finishedWork.publicRootExecution, false);
  assert.equal(finishedWork.reconcilerExecution, false);
  assert.equal(finishedWork.compatibilityClaimed, false);
  assert.equal(
    finishedWork.domHostMutationGateMetadata,
    domHost.DOM_ROOT_RENDER_HOST_OUTPUT_MUTATION_GATE_METADATA
  );
  assert.equal(
    rootBridge.isPrivateRootRenderHostOutputFinishedWorkRecord(
      finishedWork
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootRenderHostOutputFinishedWorkRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootRenderHostOutputFinishedWorkPayload({}),
    null
  );
  assert.equal(finishedWorkPayload.renderRecord, hidden.renderRecord);
  assert.equal(finishedWorkPayload.hostOutputHandoff, hidden.hostOutputHandoff);
  assert.equal(finishedWorkPayload.metadata, metadata);

  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.renderRecord.requestType, 'root.render');
  assert.equal(hidden.renderRecord.updateId, 'root-render-update:1');
  assert.equal(hidden.hostOutputHandoff.handoffId, 'root-render-initial:1');
  assert.equal(hidden.hostOutputPayload.hostNode, container.firstChild);
  assert.equal(hidden.rootWorkLoopFinishedWorkRecord, finishedWork);
  assert.equal(hidden.rootWorkLoopFinishedWorkPayload, finishedWorkPayload);
  assert.equal(hidden.sideEffectCleanup.sideEffectId, hidden.sideEffectRecord.sideEffectId);

  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.nodeName, 'ARTICLE');
  assert.equal(container.firstChild.textContent, 'accepted rust host output');
  assert.equal(container.textContent, 'accepted rust host output');
  assert.deepEqual(attributeEntries(container.firstChild), [
    ['class', 'root-render-card'],
    ['id', 'root-render-host'],
    ['title', 'Private root render']
  ]);
  assert.equal(
    componentTree.getRootOwnerFromNode(container.firstChild),
    create.owner
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(container.firstChild),
    element.props
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);

  assert.throws(
    () =>
      bridge.renderRootHostOutput(create, element, {
        rootWorkLoopFinishedWorkMetadata: metadata
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_RENDER_HOST_OUTPUT',
      message: /unrendered private root/
    }
  );
  assertPublicCreateRootMinimalHostOutput(publicDocument);

  const serialized = JSON.stringify(record);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('not-invoked'), false);

  bridge.cleanupInitialRenderHostOutput(hidden.hostOutputHandoff);
  assert.equal(container.childNodes.length, 0);
});

test('private root render host-output creates nested fake-DOM host output only', () => {
  const document = createDocument('private-root-render-nested-host-output');
  const container = createElement('DIV', document);
  const publicDocument = createDocument(
    'private-root-render-nested-host-output-public'
  );
  const childElement = {
    props: {
      children: 'accepted nested rust host output',
      id: 'nested-child',
      title: 'Nested child'
    },
    type: 'span'
  };
  const element = {
    props: {
      children: childElement,
      className: 'nested-parent',
      id: 'nested-parent',
      onClick() {
        return 'not-invoked';
      },
      title: 'Nested parent'
    },
    type: 'section'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    createRenderAdmissionIdPrefix: 'root-render-nested-admission',
    initialHostOutputIdPrefix: 'root-render-nested-initial',
    requestIdPrefix: 'root-render-nested-request',
    rootIdPrefix: 'root-render-nested-root',
    rootRenderHostOutputIdPrefix: 'root-render-nested-host-output',
    sideEffectIdPrefix: 'root-render-nested-side-effect',
    updateIdPrefix: 'root-render-nested-update'
  });
  const create = bridge.createClientRoot(container);
  const metadata = createRootWorkLoopFinishedWorkMetadata({
    childTags: ['HostComponent', 'HostComponent', 'HostText'],
    hostComponentCount: 2,
    hostOutputShape: 'nested-host-component',
    hostTextCount: 1,
    hostType: 'section',
    renderUpdateId: 'root-render-nested-update:1',
    rootId: create.rootId,
    rootTag: create.rootTag,
    textContent: 'accepted nested rust host output'
  });

  const record = bridge.renderRootHostOutput(create, element, {
    rootWorkLoopFinishedWorkMetadata: metadata
  });
  const hidden = rootBridge.getPrivateRootRenderHostOutputPayload(record);
  const handoffPayload =
    rootBridge.getPrivateRootInitialHostOutputHandoffPayload(
      hidden.hostOutputHandoff
    );
  const finishedWork = record.rootWorkLoopFinishedWorkRecord;
  const finishedWorkPayload =
    rootBridge.getPrivateRootRenderHostOutputFinishedWorkPayload(
      finishedWork
    );
  const parentNode = container.firstChild;
  const childNode = parentNode.firstChild;
  const textNode = childNode.firstChild;

  assert.equal(record.hostOutputShape, 'nested-host-component');
  assert.equal(record.hostType, 'section');
  assert.equal(record.hostComponentCount, 2);
  assert.equal(record.hostTextCount, 1);
  assert.deepEqual(record.childTags, [
    'HostComponent',
    'HostComponent',
    'HostText'
  ]);
  assert.equal(record.containerChildCount, 1);
  assert.equal(record.hostChildCount, 1);
  assert.equal(record.textContent, 'accepted nested rust host output');
  assert.equal(record.publicRootExecution, false);
  assert.equal(record.publicRootRenderCompatibilityClaimed, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.browserDomMutation, false);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.refEffects, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      'private-create-root-record',
      'private-root-render-record',
      'root-marker-setup-cleanup',
      'root-listener-setup-cleanup',
      'create-render-admission',
      'root-work-loop-finished-work-handoff',
      'fake-dom-host-output-mutation',
      'component-tree-host-instance-map',
      'latest-props-publication',
      'fake-dom-nested-host-component-child'
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
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

  assert.equal(finishedWork.hostOutputShape, 'nested-host-component');
  assert.equal(finishedWork.hostComponentCount, 2);
  assert.equal(finishedWork.hostTextCount, 1);
  assert.deepEqual(finishedWork.childTags, [
    'HostComponent',
    'HostComponent',
    'HostText'
  ]);
  assert.equal(finishedWork.rootChildTag, 'HostComponent');
  assert.equal(finishedWork.completedChildTag, 'HostComponent');
  assert.equal(finishedWork.hostTextChildTag, 'HostText');
  assert.equal(finishedWork.publicRootRenderingBlocked, true);
  assert.equal(finishedWork.compatibilityClaimed, false);
  assert.equal(finishedWorkPayload.metadata, metadata);
  assert.equal(finishedWorkPayload.hostOutputPayload, handoffPayload);

  assert.equal(handoffPayload.hostOutputShape, 'nested-host-component');
  assert.equal(handoffPayload.hostNode, parentNode);
  assert.equal(handoffPayload.childHostNode, childNode);
  assert.equal(handoffPayload.textNode, textNode);
  assert.deepEqual(handoffPayload.hostNodes, [parentNode, childNode]);
  assert.deepEqual(handoffPayload.textNodes, [textNode]);
  assert.equal(handoffPayload.latestPropsAfterCommit, element.props);
  assert.equal(
    handoffPayload.childLatestPropsAfterCommit,
    childElement.props
  );
  assert.deepEqual(handoffPayload.latestPropsAfterCommits, [
    element.props,
    childElement.props
  ]);
  assert.equal(
    componentTree.assertMountedHostInstanceToken(handoffPayload.hostToken),
    parentNode
  );
  assert.equal(
    componentTree.assertMountedHostInstanceToken(
      handoffPayload.childHostToken
    ),
    childNode
  );
  assert.equal(
    componentTree.assertMountedHostInstanceToken(handoffPayload.textToken),
    textNode
  );
  assert.equal(
    componentTree.assertMountedHostInstanceToken(
      handoffPayload.hostTokens[0]
    ),
    parentNode
  );
  assert.equal(
    componentTree.assertMountedHostInstanceToken(
      handoffPayload.hostTokens[1]
    ),
    childNode
  );
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(
      handoffPayload.childHostToken
    ),
    create.owner
  );
  assert.equal(componentTree.getRootOwnerFromNode(parentNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(childNode), create.owner);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), create.owner);
  assert.equal(componentTree.getLatestPropsFromNode(parentNode), element.props);
  assert.equal(
    componentTree.getLatestPropsFromNode(childNode),
    childElement.props
  );
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);

  assert.equal(container.childNodes.length, 1);
  assert.equal(parentNode.nodeName, 'SECTION');
  assert.equal(childNode.nodeName, 'SPAN');
  assert.equal(textNode.nodeName, '#text');
  assert.equal(textNode.nodeValue, 'accepted nested rust host output');
  assert.equal(parentNode.textContent, 'accepted nested rust host output');
  assert.equal(childNode.textContent, 'accepted nested rust host output');
  assert.equal(container.textContent, 'accepted nested rust host output');
  assert.deepEqual(attributeEntries(parentNode), [
    ['class', 'nested-parent'],
    ['id', 'nested-parent'],
    ['title', 'Nested parent']
  ]);
  assert.deepEqual(attributeEntries(childNode), [
    ['id', 'nested-child'],
    ['title', 'Nested child']
  ]);
  assert.deepEqual(container.mutationLog, [['appendChild', 'SECTION']]);
  assert.deepEqual(parentNode.mutationLog, [['appendChild', 'SPAN']]);
  assert.deepEqual(childNode.mutationLog, [['appendChild', '#text']]);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assertPublicCreateRootMinimalHostOutput(publicDocument);

  const serialized = JSON.stringify(record);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('not-invoked'), false);

  const cleanup = bridge.cleanupInitialRenderHostOutput(
    hidden.hostOutputHandoff
  );
  assert.equal(cleanup.removedRootChild, true);
  assert.equal(cleanup.removedRootChildCount, 1);
  assert.equal(cleanup.detachedHostInstanceCount, 3);
  assert.equal(container.childNodes.length, 0);
  assert.equal(componentTree.getRootOwnerFromNode(parentNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(childNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(parentNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(childNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
});

test('private root render nested host-output rollback detaches all partial nodes', () => {
  const document = createDocument(
    'private-root-render-nested-host-output-rollback'
  );
  const container = createElement('DIV', document);
  const createdElements = [];
  const createdTextNodes = [];
  const originalCreateElement = document.createElement;
  const originalCreateTextNode = document.createTextNode;
  document.createElement = function createThrowingNestedElement(tagName) {
    const node = originalCreateElement.call(this, tagName);
    createdElements.push(node);
    if (node.nodeName === 'SECTION') {
      const originalAppendChild = node.appendChild;
      node.appendChild = function appendChildWithNestedFailure(child) {
        if (child.nodeName === 'SPAN') {
          throw new Error('synthetic nested HostComponent append failure');
        }
        return originalAppendChild.call(this, child);
      };
    }
    return node;
  };
  document.createTextNode = function createTrackedTextNode(text) {
    const node = originalCreateTextNode.call(this, text);
    createdTextNodes.push(node);
    return node;
  };
  const childElement = {
    props: {
      children: 'rollback nested rust host output',
      id: 'rollback-child',
      title: 'Rollback child'
    },
    type: 'span'
  };
  const element = {
    props: {
      children: childElement,
      className: 'rollback-parent',
      id: 'rollback-parent',
      title: 'Rollback parent'
    },
    type: 'section'
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    initialHostOutputIdPrefix: 'root-render-nested-rollback-initial',
    requestIdPrefix: 'root-render-nested-rollback-request',
    rootIdPrefix: 'root-render-nested-rollback-root',
    rootRenderHostOutputIdPrefix: 'root-render-nested-rollback-host-output',
    sideEffectIdPrefix: 'root-render-nested-rollback-side-effect',
    updateIdPrefix: 'root-render-nested-rollback-update'
  });
  const create = bridge.createClientRoot(container);
  const metadata = createRootWorkLoopFinishedWorkMetadata({
    childTags: ['HostComponent', 'HostComponent', 'HostText'],
    hostComponentCount: 2,
    hostOutputShape: 'nested-host-component',
    hostTextCount: 1,
    hostType: 'section',
    renderUpdateId: 'root-render-nested-rollback-update:1',
    rootId: create.rootId,
    rootTag: create.rootTag,
    textContent: 'rollback nested rust host output'
  });

  assert.throws(
    () =>
      bridge.renderRootHostOutput(create, element, {
        rootWorkLoopFinishedWorkMetadata: metadata
      }),
    {
      message: /synthetic nested HostComponent append failure/
    }
  );

  assert.equal(createdElements.length, 2);
  assert.equal(createdTextNodes.length, 1);
  const parentNode = createdElements[0];
  const childNode = createdElements[1];
  const textNode = createdTextNodes[0];

  assert.equal(parentNode.nodeName, 'SECTION');
  assert.equal(childNode.nodeName, 'SPAN');
  assert.equal(textNode.nodeName, '#text');
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.textContent, '');
  assert.equal(parentNode.parentNode, null);
  assert.equal(childNode.parentNode, null);
  assert.equal(textNode.parentNode, null);
  assert.equal(parentNode.childNodes.length, 0);
  assert.equal(childNode.childNodes.length, 0);
  assert.equal(componentTree.getRootOwnerFromNode(parentNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(childNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(parentNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(childNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.deepEqual(attributeEntries(parentNode), []);
  assert.deepEqual(attributeEntries(childNode), []);
  assert.deepEqual(childNode.mutationLog, [
    ['appendChild', '#text'],
    ['removeChild', '#text']
  ]);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
});

test('private initial host output handoff validates admission and rolls back unsupported children', () => {
  const document = createDocument('private-initial-host-output-validation');
  const container = createElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const otherBridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const render = bridge.renderContainer(create.handle, {
    props: {
      children: ['unsupported']
    },
    type: 'section'
  });
  const admission = bridge.admitCreateRenderPath(
    create,
    sideEffects,
    render
  );

  assert.throws(() => bridge.applyInitialRenderHostOutput(render), {
    code: 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF'
  });
  assert.throws(() => otherBridge.applyInitialRenderHostOutput(admission), {
    code: 'FAST_REACT_DOM_FOREIGN_ROOT_HANDLE'
  });
  assert.throws(() => bridge.applyInitialRenderHostOutput(admission), {
    code: 'FAST_REACT_DOM_INVALID_INITIAL_HOST_OUTPUT_HANDOFF'
  });
  assert.equal(container.childNodes.length, 0);
  assert.equal(container.__mutationLog.length, 0);

  const validContainer = createElement('DIV', document);
  const validCreate = bridge.createClientRoot(validContainer);
  const validSideEffects = bridge.applyCreateRootSideEffects(validCreate);
  const validRender = bridge.renderContainer(validCreate.handle, {
    props: {
      children: 'after cleanup'
    },
    type: 'article'
  });
  const validAdmission = bridge.admitCreateRenderPath(
    validCreate,
    validSideEffects,
    validRender
  );
  bridge.revertCreateRootSideEffects(validSideEffects);
  assert.throws(() => bridge.applyInitialRenderHostOutput(validAdmission), {
    code: 'FAST_REACT_DOM_INVALID_CREATE_RENDER_ADMISSION'
  });
  assert.equal(validContainer.childNodes.length, 0);

  bridge.revertCreateRootSideEffects(sideEffects);
  assert.equal(container.childNodes.length, 0);
});

test('private root host-output update mutates props/text before publishing latest props', () => {
  const document = createHostOutputDocument('private-host-output-update');
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: 'host-update',
    sideEffectIdPrefix: 'host-side-effect'
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputProps('initial');
  const nextProps = createHostOutputProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const update = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });

  mounted.host.attributeLog = [];
  mounted.text.writeLog = [];

  const handoff = bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: mounted.token,
    nextProps,
    tag: 'div',
    textUpdate: {
      newText: 'goodbye',
      oldText: 'hello',
      textInstance: mounted.text
    }
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);

  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootHostOutputUpdateHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootHostOutputUpdateHandoffRecord'
  );
  assert.equal(handoff.handoffId, 'host-update:1');
  assert.equal(
    handoff.updateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(handoff.sourceUpdateId, update.updateId);
  assert.equal(
    handoff.sourceLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    handoff.sourceLifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(handoff.hostTag, 'div');
  assert.deepEqual(handoff.propertyMutation, {
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
      rowKinds: ['setAttribute', 'nonPayload']
    },
    status: 'mutated'
  });
  assert.deepEqual(handoff.textMutation, {
    newTextLength: 7,
    oldTextLength: 5,
    status: 'mutated'
  });
  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(
    handoff.latestPropsPublishOrder,
    'after-property-and-text-mutation'
  );
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.domMutation, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'fake-dom-property-update',
      'property-payload-evidence',
      'fake-dom-text-update',
      'latest-props-after-mutation',
      'attribute-payload-rows'
    ]
  );
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'refs',
      'compatibility-claims'
    ]
  );
  assert.equal(
    rootBridge.isPrivateRootHostOutputUpdateHandoffRecord(handoff),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootHostOutputUpdateHandoffRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload({}),
    null
  );
  assert.equal(hiddenHandoff.sourceRecord, update);
  assert.equal(hiddenHandoff.rootHandle, create.handle);
  assert.equal(hiddenHandoff.hostInstanceNode, mounted.host);
  assert.equal(hiddenHandoff.hostInstanceToken, mounted.token);
  assert.equal(hiddenHandoff.textInstance, mounted.text);
  assert.equal(hiddenHandoff.previousProps, initialProps);
  assert.equal(hiddenHandoff.nextProps, nextProps);
  assert.equal(hiddenHandoff.latestPropsPublished, true);
  assert.equal(hiddenHandoff.textUpdate.oldText, 'hello');
  assert.equal(hiddenHandoff.textUpdate.newText, 'goodbye');

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message'],
    ['title', 'updated title']
  ]);
  assert.deepEqual(mounted.host.attributeLog, [
    ['setAttribute', 'class', 'root-card updated'],
    ['setAttribute', 'title', 'updated title'],
    ['setAttribute', 'data-phase', 'updated']
  ]);
  assert.deepEqual(mounted.text.writeLog, [['nodeValue', 'goodbye']]);
  assert.equal(container.textContent, 'goodbye');
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), nextProps);
  assert.equal(bridge.applyHostOutputUpdate(update, {}), handoff);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('goodbye'), false);
  assert.equal(serialized.includes('updated title'), false);
  assert.equal(serialized.includes('__registrations'), false);

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root host-output update admits attribute and style rows without text canary', () => {
  const document = createHostOutputDocument('private-host-output-prop-update');
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: 'host-prop-update',
    sideEffectIdPrefix: 'host-prop-side-effect'
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputAttributeStyleProps('initial');
  const nextProps = createHostOutputAttributeStyleProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const update = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });

  mounted.host.attributeLog = [];
  mounted.host.styleLog = [];
  mounted.text.writeLog = [];

  const handoff = bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: mounted.token,
    nextProps,
    tag: 'div'
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);

  assert.equal(handoff.handoffId, 'host-prop-update:1');
  assert.equal(
    handoff.updateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.deepEqual(handoff.propertyMutation, {
    handoffKind: domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF,
    latestPropsCommitRecordKind: domHost.LATEST_PROPS_COMMIT_RECORD,
    latestPropsCommitRecordStatus: 'safe-for-latest-props',
    mutationRecordCount: 8,
    payloadCount: 8,
    propertyPayloadEvidence: {
      propertyPayloadBacked: true,
      rowCount: 8,
      mutatingRowCount: 8,
      updateRowCount: 4,
      removalRowCount: 4,
      setAttributeCount: 2,
      removeAttributeCount: 2,
      setPropertyCount: 0,
      removePropertyCount: 0,
      setStyleCount: 2,
      removeStyleCount: 2,
      nonPayloadRowCount: 0,
      attributeRowCount: 4,
      propertyRowCount: 0,
      styleRowCount: 4,
      rowKinds: [
        'removeAttribute',
        'setAttribute',
        'removeStyle',
        'setStyle'
      ]
    },
    status: 'mutated'
  });
  assert.deepEqual(handoff.textMutation, {
    newTextLength: null,
    oldTextLength: null,
    status: 'not-requested'
  });
  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(handoff.latestPropsPublishOrder, 'after-property-mutation');
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'fake-dom-property-update',
      'property-payload-evidence',
      'latest-props-after-mutation',
      'attribute-payload-rows',
      'style-payload-rows'
    ]
  );
  assert.equal(hiddenHandoff.sourceRecord, update);
  assert.equal(hiddenHandoff.hostInstanceNode, mounted.host);
  assert.equal(hiddenHandoff.textInstance, null);
  assert.equal(hiddenHandoff.textUpdate, null);
  assert.equal(hiddenHandoff.previousProps, initialProps);
  assert.equal(hiddenHandoff.nextProps, nextProps);
  assert.equal(hiddenHandoff.propertyMutationEvidence.styleRowCount, 4);

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message']
  ]);
  assert.deepEqual(activeHostOutputStyleProperties(mounted.host), [
    ['color', 'blue'],
    ['width', '12px']
  ]);
  assert.deepEqual(mounted.host.attributeLog, [
    ['removeAttribute', 'title', true],
    ['removeAttribute', 'hidden', true],
    ['setAttribute', 'class', 'root-card updated'],
    ['setAttribute', 'data-phase', 'updated']
  ]);
  assert.deepEqual(mounted.host.styleLog, [
    ['stylePropertyAssignment', 'marginTop', ''],
    ['styleSetProperty', '--gap', ''],
    ['stylePropertyAssignment', 'color', 'blue'],
    ['stylePropertyAssignment', 'width', '12px']
  ]);
  assert.deepEqual(mounted.text.writeLog, []);
  assert.equal(container.textContent, 'stable');
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), nextProps);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('blue'), false);
  assert.equal(serialized.includes('root-card updated'), false);

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root commit HostComponent update consumes reconciler metadata for fake-DOM mutation', () => {
  const document = createHostOutputDocument(
    'private-root-commit-host-component-update'
  );
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: 'root-commit-host-output',
    rootCommitHostComponentUpdateIdPrefix: 'root-commit-host-component',
    sideEffectIdPrefix: 'root-commit-side-effect'
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputAttributeStyleProps('initial');
  const nextProps = createHostOutputAttributeStyleProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const update = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const rootCommitMetadata = {
    kind: 'HostRootCommitRecord',
    mutationApplyRecords: [
      {
        kind: 'commit-host-text-update',
        tag: 'HostText',
        stateNodeRaw: 902,
        pendingPropsRaw: 4003,
        memoizedPropsRaw: 4003,
        alternateMemoizedPropsRaw: 4001
      },
      createRootCommitHostComponentUpdateRecord({
        recordIndex: 1,
        stateNodeRaw: 901
      })
    ]
  };

  mounted.host.attributeLog = [];
  mounted.host.styleLog = [];
  mounted.text.writeLog = [];

  const handoff = bridge.applyRootCommitHostComponentUpdate(
    update,
    rootCommitMetadata,
    {
      hostInstanceToken: mounted.token,
      nextProps,
      tag: 'div',
      stateNodeRaw: 901
    }
  );
  const hiddenHandoff =
    rootBridge.getPrivateRootCommitHostComponentUpdateHandoffPayload(
      handoff
    );

  assert.equal(
    handoff.$$typeof,
    rootBridge.privateRootCommitHostComponentUpdateHandoffRecordType
  );
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootCommitHostComponentUpdateHandoffRecord'
  );
  assert.equal(handoff.handoffId, 'root-commit-host-component:1');
  assert.equal(
    handoff.updateStatus,
    rootBridge.ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_APPLIED
  );
  assert.equal(handoff.sourceUpdateId, update.updateId);
  assert.equal(handoff.hostTag, 'div');
  assert.equal(handoff.rootCommitMetadataSource, 'mutationApplyRecords');
  assert.equal(handoff.rootCommitMetadataRecordCount, 2);
  assert.equal(handoff.rootCommitHostComponentUpdateRecordCount, 1);
  assert.deepEqual(handoff.rootCommitHostComponentUpdate, {
    metadataSource: 'mutationApplyRecords',
    recordIndex: 1,
    recordKind: 'CommitHostComponentUpdate',
    applyKind: 'commit-host-component-update',
    phaseKind: null,
    tag: 'HostComponent',
    parentTag: 'HostRoot',
    stateNodeRaw: 901,
    pendingPropsRaw: 3003,
    memoizedPropsRaw: 3003,
    alternateMemoizedPropsRaw: 3001,
    rootInfo: {
      keys: ['slot'],
      type: 'object'
    },
    hostRootInfo: {
      keys: ['slot'],
      type: 'object'
    },
    parentInfo: {
      keys: ['slot'],
      type: 'object'
    },
    fiberInfo: {
      keys: ['slot'],
      type: 'object'
    },
    alternateFiberInfo: {
      keys: ['slot'],
      type: 'object'
    },
    sourceInfo: {
      keys: ['kind'],
      type: 'object'
    }
  });
  assert.equal(
    handoff.hostOutputUpdateHandoffId,
    'root-commit-host-output:1'
  );
  assert.equal(
    handoff.hostOutputUpdateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(handoff.propertyMutation.mutationRecordCount, 8);
  assert.equal(
    handoff.propertyMutation.propertyPayloadEvidence.styleRowCount,
    4
  );
  assert.deepEqual(handoff.textMutation, {
    newTextLength: null,
    oldTextLength: null,
    status: 'not-requested'
  });
  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(handoff.latestPropsPublishOrder, 'after-property-mutation');
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.domMutation, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.refEffects, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'root-commit-host-component-update-metadata',
      'fake-dom-property-update',
      'property-payload-evidence',
      'latest-props-after-mutation',
      'attribute-payload-rows',
      'style-payload-rows'
    ]
  );
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'host-text-update',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'refs',
      'compatibility-claims'
    ]
  );
  assert.equal(
    rootBridge.isPrivateRootCommitHostComponentUpdateHandoffRecord(handoff),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootCommitHostComponentUpdateHandoffRecord({}),
    false
  );
  assert.equal(
    rootBridge.getPrivateRootCommitHostComponentUpdateHandoffPayload({}),
    null
  );
  assert.equal(hiddenHandoff.sourceRecord, update);
  assert.equal(hiddenHandoff.rootHandle, create.handle);
  assert.equal(hiddenHandoff.hostInstanceNode, mounted.host);
  assert.equal(hiddenHandoff.hostInstanceToken, mounted.token);
  assert.equal(hiddenHandoff.previousProps, initialProps);
  assert.equal(hiddenHandoff.nextProps, nextProps);
  assert.equal(hiddenHandoff.latestPropsPublished, true);
  assert.equal(hiddenHandoff.rootCommitMetadata, rootCommitMetadata);
  assert.equal(
    hiddenHandoff.selectedRootCommitRecord,
    rootCommitMetadata.mutationApplyRecords[1]
  );
  assert.equal(
    hiddenHandoff.hostOutputHandoff.handoffId,
    handoff.hostOutputUpdateHandoffId
  );
  assert.equal(
    rootBridge.applyPrivateRootCommitHostComponentUpdate(
      update,
      rootCommitMetadata,
      {}
    ),
    handoff
  );

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message']
  ]);
  assert.deepEqual(activeHostOutputStyleProperties(mounted.host), [
    ['color', 'blue'],
    ['width', '12px']
  ]);
  assert.deepEqual(mounted.text.writeLog, []);
  assert.equal(container.textContent, 'stable');
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), nextProps);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('blue'), false);
  assert.equal(serialized.includes('root-card updated'), false);

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root commit HostComponent update applies property and text before latest props', () => {
  const document = createHostOutputDocument(
    'private-root-commit-host-component-property-text-update'
  );
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: 'root-commit-text-host-output',
    rootCommitHostComponentUpdateIdPrefix: 'root-commit-property-text',
    sideEffectIdPrefix: 'root-commit-text-side-effect'
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputProps('initial');
  const nextProps = createHostOutputProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const update = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const rootCommitMetadata = {
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

  mounted.host.attributeLog = [];
  mounted.text.writeLog = [];

  const handoff = bridge.applyRootCommitHostComponentUpdate(
    update,
    rootCommitMetadata,
    {
      hostInstanceToken: mounted.token,
      nextProps,
      tag: 'div',
      textUpdate: {
        newText: 'goodbye',
        oldText: 'hello',
        textInstance: mounted.text
      }
    }
  );
  const hiddenHandoff =
    rootBridge.getPrivateRootCommitHostComponentUpdateHandoffPayload(
      handoff
    );

  assert.equal(handoff.handoffId, 'root-commit-property-text:1');
  assert.equal(
    handoff.updateStatus,
    rootBridge.ROOT_BRIDGE_ROOT_COMMIT_HOST_COMPONENT_UPDATE_APPLIED
  );
  assert.equal(handoff.rootCommitMetadataRecordCount, 2);
  assert.equal(handoff.rootCommitHostComponentUpdateRecordCount, 1);
  assert.equal(handoff.rootCommitHostTextUpdateRecordCount, 1);
  assert.equal(
    handoff.rootCommitHostTextUpdate.recordKind,
    'CommitHostTextUpdate'
  );
  assert.equal(
    handoff.rootCommitHostTextUpdate.applyKind,
    'commit-host-text-update'
  );
  assert.equal(handoff.rootCommitHostTextUpdate.tag, 'HostText');
  assert.equal(handoff.rootCommitHostTextUpdate.parentTag, 'HostComponent');
  assert.equal(handoff.rootCommitHostTextUpdate.stateNodeRaw, 902);
  assert.equal(
    handoff.hostOutputUpdateHandoffId,
    'root-commit-text-host-output:1'
  );
  assert.deepEqual(handoff.textMutation, {
    newTextLength: 7,
    oldTextLength: 5,
    status: 'mutated'
  });
  assert.equal(handoff.propertyMutation.mutationRecordCount, 4);
  assert.equal(
    handoff.propertyMutation.propertyPayloadEvidence.attributeRowCount,
    3
  );
  assert.equal(
    handoff.propertyMutation.propertyPayloadEvidence.propertyRowCount,
    0
  );
  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(
    handoff.latestPropsPublishOrder,
    'after-property-and-text-mutation'
  );
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.domMutation, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'root-commit-host-component-update-metadata',
      'root-commit-host-text-update-metadata',
      'fake-dom-property-update',
      'property-payload-evidence',
      'fake-dom-text-update',
      'latest-props-after-mutation',
      'attribute-payload-rows'
    ]
  );
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'hydration',
      'events',
      'refs',
      'compatibility-claims'
    ]
  );
  assert.equal(
    hiddenHandoff.selectedRootCommitRecord,
    rootCommitMetadata.mutationApplyRecords[0]
  );
  assert.equal(
    hiddenHandoff.selectedRootCommitTextRecord,
    rootCommitMetadata.mutationApplyRecords[1]
  );
  assert.equal(hiddenHandoff.textUpdate.oldText, 'hello');
  assert.equal(hiddenHandoff.textUpdate.newText, 'goodbye');

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card updated'],
    ['data-phase', 'updated'],
    ['id', 'message'],
    ['title', 'updated title']
  ]);
  assert.deepEqual(mounted.host.attributeLog, [
    ['setAttribute', 'class', 'root-card updated'],
    ['setAttribute', 'title', 'updated title'],
    ['setAttribute', 'data-phase', 'updated']
  ]);
  assert.deepEqual(mounted.text.writeLog, [['nodeValue', 'goodbye']]);
  assert.equal(container.textContent, 'goodbye');
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), nextProps);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('goodbye'), false);
  assert.equal(serialized.includes('updated title'), false);

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root commit HostComponent update validates reconciler metadata fail-closed', () => {
  const document = createHostOutputDocument(
    'private-root-commit-host-component-update-validation'
  );
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputAttributeStyleProps('initial');
  const nextProps = createHostOutputAttributeStyleProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const noHostUpdate = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const ambiguousUpdate = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const mismatchUpdate = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const textUpdate = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });

  assert.throws(
    () =>
      bridge.applyRootCommitHostComponentUpdate(
        noHostUpdate,
        {
          mutationApplyRecords: [
            {
              kind: 'commit-host-text-update',
              tag: 'HostText',
              stateNodeRaw: 902,
              pendingPropsRaw: 4003,
              memoizedPropsRaw: 4003,
              alternateMemoizedPropsRaw: 4001
            }
          ]
        },
        {
          hostInstanceToken: mounted.token,
          nextProps,
          tag: 'div'
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF'
    }
  );
  assert.throws(
    () =>
      bridge.applyRootCommitHostComponentUpdate(
        ambiguousUpdate,
        {
          mutation_apply_records: [
            createRootCommitHostComponentUpdateRecord({
              stateNodeRaw: 901
            }),
            createRootCommitHostComponentUpdateRecord({
              stateNodeRaw: 903
            })
          ]
        },
        {
          hostInstanceToken: mounted.token,
          nextProps,
          tag: 'div'
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF'
    }
  );
  assert.throws(
    () =>
      bridge.applyRootCommitHostComponentUpdate(
        mismatchUpdate,
        {
          mutationApplyRecords: [
            createRootCommitHostComponentUpdateRecord({
              stateNodeRaw: 901
            })
          ]
        },
        {
          hostInstanceToken: mounted.token,
          nextProps,
          tag: 'div',
          stateNodeRaw: 999
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF'
    }
  );
  assert.throws(
    () =>
      bridge.applyRootCommitHostComponentUpdate(
        textUpdate,
        {
          mutationApplyRecords: [
            createRootCommitHostComponentUpdateRecord({
              stateNodeRaw: 901
            })
          ]
        },
        {
          hostInstanceToken: mounted.token,
          nextProps,
          tag: 'div',
          textUpdate: {
            newText: 'updated text',
            oldText: 'stable',
            textInstance: mounted.text
          }
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_ROOT_COMMIT_HOST_COMPONENT_UPDATE_HANDOFF'
    }
  );

  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card'],
    ['data-phase', 'initial'],
    ['hidden', ''],
    ['id', 'message'],
    ['title', 'initial title']
  ]);
  assert.deepEqual(activeHostOutputStyleProperties(mounted.host), [
    ['--gap', '4px'],
    ['color', 'red'],
    ['marginTop', '4px']
  ]);
  assert.equal(componentTree.getLatestPropsFromNode(mounted.host), initialProps);

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root commit HostComponent update rejects stale, text failure, and unsupported rows with rollback evidence', () => {
  const staleFixture = createRootCommitPropertyTextFixture(
    'private-root-commit-property-text-stale'
  );
  const staleLatestProps = {
    ...staleFixture.initialProps,
    title: 'stale latest props'
  };
  staleFixture.mounted.host.attributeLog = [];
  staleFixture.mounted.text.writeLog = [];
  Object.defineProperty(staleFixture.mounted.text, 'nodeValue', {
    configurable: true,
    get() {
      return this.data;
    },
    set(value) {
      const text = String(value);
      if (text === 'goodbye') {
        this.writeLog.push(['nodeValue', text, 'stale-latest-props']);
        this._data = text;
        componentTree.attachHostInstanceNode(
          staleFixture.mounted.host,
          staleFixture.mounted.token,
          staleLatestProps
        );
        return;
      }
      this.writeLog.push(['nodeValue', text]);
      this._data = text;
    }
  });

  let staleError = null;
  assert.throws(
    () =>
      staleFixture.bridge.applyRootCommitHostComponentUpdate(
        staleFixture.update,
        staleFixture.metadata,
        {
          hostInstanceToken: staleFixture.mounted.token,
          nextProps: staleFixture.nextProps,
          tag: 'div',
          textUpdate: {
            newText: 'goodbye',
            oldText: 'hello',
            textInstance: staleFixture.mounted.text
          }
        }
      ),
    (error) => {
      staleError = error;
      return error.code === 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF';
    }
  );
  assert.deepEqual(staleError.privateRootUpdateRollbackEvidence, {
    kind: 'FastReactDomPrivateRootUpdateRollbackEvidence',
    latestPropsPublished: false,
    latestPropsHandoffStale: true,
    latestPropsRestoredToPrevious: false,
    propertyMutationAttempted: true,
    propertyRollbackAttempted: true,
    propertyRollbackApplied: true,
    propertyRollbackRecordCount: 3,
    textMutationRequested: true,
    textMutationApplied: true,
    textRollbackAttempted: true,
    textRollbackApplied: true,
    unsupportedPropertyPayloadRejected: false,
    propertyRollbackError: null,
    textRollbackError: null
  });
  assert.deepEqual(activeHostOutputAttributes(staleFixture.mounted.host), [
    ['class', 'root-card'],
    ['data-phase', 'initial'],
    ['id', 'message'],
    ['title', 'initial title']
  ]);
  assert.deepEqual(staleFixture.mounted.text.writeLog, [
    ['nodeValue', 'goodbye', 'stale-latest-props'],
    ['nodeValue', 'hello']
  ]);
  assert.equal(staleFixture.container.textContent, 'hello');
  assert.equal(
    componentTree.getLatestPropsFromNode(staleFixture.mounted.host),
    staleLatestProps
  );
  cleanupRootCommitPropertyTextFixture(staleFixture);

  const textFailureFixture = createRootCommitPropertyTextFixture(
    'private-root-commit-property-text-failure'
  );
  const thrownError = new Error('fake root commit HostText update failed');
  textFailureFixture.mounted.host.attributeLog = [];
  textFailureFixture.mounted.text.writeLog = [];
  Object.defineProperty(textFailureFixture.mounted.text, 'nodeValue', {
    configurable: true,
    get() {
      return this.data;
    },
    set(value) {
      this.writeLog.push(['nodeValue', String(value), 'throw']);
      throw thrownError;
    }
  });

  let textFailureError = null;
  assert.throws(
    () =>
      textFailureFixture.bridge.applyRootCommitHostComponentUpdate(
        textFailureFixture.update,
        textFailureFixture.metadata,
        {
          hostInstanceToken: textFailureFixture.mounted.token,
          nextProps: textFailureFixture.nextProps,
          tag: 'div',
          textUpdate: {
            newText: 'goodbye',
            oldText: 'hello',
            textInstance: textFailureFixture.mounted.text
          }
        }
      ),
    (error) => {
      textFailureError = error;
      return error === thrownError;
    }
  );
  assert.deepEqual(textFailureError.privateRootUpdateRollbackEvidence, {
    kind: 'FastReactDomPrivateRootUpdateRollbackEvidence',
    latestPropsPublished: false,
    latestPropsHandoffStale: false,
    latestPropsRestoredToPrevious: true,
    propertyMutationAttempted: true,
    propertyRollbackAttempted: true,
    propertyRollbackApplied: true,
    propertyRollbackRecordCount: 3,
    textMutationRequested: true,
    textMutationApplied: false,
    textRollbackAttempted: false,
    textRollbackApplied: false,
    unsupportedPropertyPayloadRejected: false,
    propertyRollbackError: null,
    textRollbackError: null
  });
  assert.deepEqual(
    activeHostOutputAttributes(textFailureFixture.mounted.host),
    [
      ['class', 'root-card'],
      ['data-phase', 'initial'],
      ['id', 'message'],
      ['title', 'initial title']
    ]
  );
  assert.deepEqual(textFailureFixture.mounted.text.writeLog, [
    ['nodeValue', 'goodbye', 'throw']
  ]);
  assert.equal(textFailureFixture.container.textContent, 'hello');
  assert.equal(
    componentTree.getLatestPropsFromNode(textFailureFixture.mounted.host),
    textFailureFixture.initialProps
  );
  cleanupRootCommitPropertyTextFixture(textFailureFixture);

  const unsupportedProps = {
    ...createHostOutputProps('updated'),
    innerHTML: '<p>blocked</p>'
  };
  const unsupportedFixture = createRootCommitPropertyTextFixture(
    'private-root-commit-property-text-unsupported',
    unsupportedProps
  );
  unsupportedFixture.mounted.host.attributeLog = [];
  unsupportedFixture.mounted.text.writeLog = [];

  let unsupportedError = null;
  assert.throws(
    () =>
      unsupportedFixture.bridge.applyRootCommitHostComponentUpdate(
        unsupportedFixture.update,
        unsupportedFixture.metadata,
        {
          hostInstanceToken: unsupportedFixture.mounted.token,
          nextProps: unsupportedFixture.nextProps,
          tag: 'div',
          textUpdate: {
            newText: 'goodbye',
            oldText: 'hello',
            textInstance: unsupportedFixture.mounted.text
          }
        }
      ),
    (error) => {
      unsupportedError = error;
      return error.code === 'FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY';
    }
  );
  assert.equal(
    unsupportedError.domPropertyRollbackEvidence
      .unsupportedPropertyPayloadRejected,
    true
  );
  assert.deepEqual(unsupportedError.privateRootUpdateRollbackEvidence, {
    kind: 'FastReactDomPrivateRootUpdateRollbackEvidence',
    latestPropsPublished: false,
    latestPropsHandoffStale: false,
    latestPropsRestoredToPrevious: true,
    propertyMutationAttempted: false,
    propertyRollbackAttempted: false,
    propertyRollbackApplied: false,
    propertyRollbackRecordCount: 0,
    textMutationRequested: true,
    textMutationApplied: false,
    textRollbackAttempted: false,
    textRollbackApplied: false,
    unsupportedPropertyPayloadRejected: true,
    propertyRollbackError: null,
    textRollbackError: null
  });
  assert.deepEqual(unsupportedFixture.mounted.host.attributeLog, []);
  assert.deepEqual(unsupportedFixture.mounted.text.writeLog, []);
  assert.deepEqual(activeHostOutputAttributes(unsupportedFixture.mounted.host), [
    ['class', 'root-card'],
    ['data-phase', 'initial'],
    ['id', 'message'],
    ['title', 'initial title']
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(unsupportedFixture.mounted.host),
    unsupportedFixture.initialProps
  );
  cleanupRootCommitPropertyTextFixture(unsupportedFixture);
});

test('private dangerousHTML/text reset commit applies admitted fake-DOM rows before latest props', () => {
  const htmlUpdateFixture = createDangerousHtmlTextResetExecutionFixture(
    'dangerous-html-update-execution',
    {
      dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
    },
    {
      dangerouslySetInnerHTML: {__html: '<em>After</em>'}
    }
  );

  const htmlUpdateHandoff =
    htmlUpdateFixture.bridge.applyDangerousHtmlTextResetCommit(
      htmlUpdateFixture.update,
      htmlUpdateFixture.metadata,
      htmlUpdateFixture.diagnostic,
      {
        hostInstanceToken: htmlUpdateFixture.token,
        nextProps: htmlUpdateFixture.nextProps,
        stateNodeRaw: 901,
        tag: 'div'
      }
    );
  const hiddenHtmlUpdate =
    rootBridge.getPrivateRootDangerousHtmlTextResetCommitHandoffPayload(
      htmlUpdateHandoff
    );

  assert.equal(
    htmlUpdateHandoff.$$typeof,
    rootBridge.privateRootDangerousHtmlTextResetCommitHandoffRecordType
  );
  assert.equal(
    htmlUpdateHandoff.kind,
    'FastReactDomPrivateRootDangerousHtmlTextResetCommitHandoffRecord'
  );
  assert.equal(
    htmlUpdateHandoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_DANGEROUS_HTML_TEXT_RESET_COMMIT_APPLIED
  );
  assert.equal(htmlUpdateHandoff.fakeDomMutation, true);
  assert.equal(htmlUpdateHandoff.browserDomMutation, false);
  assert.equal(htmlUpdateHandoff.realDomInnerHTMLWritten, false);
  assert.equal(htmlUpdateHandoff.compatibilityClaimed, false);
  assert.deepEqual(htmlUpdateHandoff.mutationEvidence, {
    fakeDomMutationBacked: true,
    rowCount: 1,
    mutatingRowCount: 1,
    setInnerHTMLCount: 1,
    setTextContentCount: 0,
    resetTextContentCount: 0,
    textContentRowCount: 0,
    dangerousHtmlRowCount: 1,
    rowKinds: ['setInnerHTML'],
    rollbackSupported: true,
    rollbackRecordCount: 1,
    gateMetadata:
      domHost.DOM_DANGEROUS_HTML_TEXT_RESET_FAKE_DOM_MUTATION_GATE_METADATA
  });
  assert.deepEqual(
    htmlUpdateHandoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'root-commit-host-component-update-metadata',
      'dangerous-html-text-reset-diagnostic',
      'fake-dom-dangerous-html-text-reset-mutation',
      'latest-props-after-dangerous-html-text-reset-mutation',
      'fake-dom-inner-html-write'
    ]
  );
  assert.deepEqual(
    htmlUpdateHandoff.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'native-execution',
      'reconciler-execution',
      'browser-dom-compatibility',
      'public-text-content-compatibility',
      'public-dangerous-html-compatibility',
      'hydration',
      'events',
      'refs',
      'compatibility-claims'
    ]
  );
  assert.deepEqual(
    htmlUpdateHandoff.fakeDomCommitRows.map((row) => row.commitRowKind),
    ['setInnerHTML']
  );
  assert.equal(hiddenHtmlUpdate.sourceRecord, htmlUpdateFixture.update);
  assert.equal(hiddenHtmlUpdate.hostInstanceNode, htmlUpdateFixture.host);
  assert.equal(hiddenHtmlUpdate.previousProps, htmlUpdateFixture.previousProps);
  assert.equal(hiddenHtmlUpdate.nextProps, htmlUpdateFixture.nextProps);
  assert.equal(hiddenHtmlUpdate.latestPropsPublished, true);
  assert.equal(htmlUpdateFixture.host.innerHTML, '<em>After</em>');
  assert.deepEqual(htmlUpdateFixture.host.dangerousWriteLog, [
    ['innerHTML', '<em>After</em>']
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(htmlUpdateFixture.host),
    htmlUpdateFixture.nextProps
  );
  assert.equal(
    rootBridge.isPrivateRootDangerousHtmlTextResetCommitHandoffRecord(
      htmlUpdateHandoff
    ),
    true
  );
  assert.equal(
    rootBridge.getPrivateRootDangerousHtmlTextResetCommitHandoffPayload({}),
    null
  );

  cleanupDangerousHtmlTextResetExecutionFixture(htmlUpdateFixture);

  const htmlRemovalFixture = createDangerousHtmlTextResetExecutionFixture(
    'dangerous-html-removal-execution',
    {
      dangerouslySetInnerHTML: {__html: '<em>After</em>'}
    },
    {
      dangerouslySetInnerHTML: undefined,
      children: 'Managed child'
    }
  );
  const htmlRemovalHandoff =
    htmlRemovalFixture.bridge.applyDangerousHtmlTextResetCommit(
      htmlRemovalFixture.update,
      htmlRemovalFixture.metadata,
      htmlRemovalFixture.diagnostic,
      {
        hostInstanceToken: htmlRemovalFixture.token,
        nextProps: htmlRemovalFixture.nextProps,
        stateNodeRaw: 901,
        tag: 'div'
      }
    );

  assert.equal(htmlRemovalHandoff.latestPropsPublished, true);
  assert.equal(htmlRemovalHandoff.fakeDomTextContentWritten, true);
  assert.deepEqual(htmlRemovalHandoff.mutationEvidence, {
    fakeDomMutationBacked: true,
    rowCount: 1,
    mutatingRowCount: 1,
    setInnerHTMLCount: 0,
    setTextContentCount: 1,
    resetTextContentCount: 0,
    textContentRowCount: 1,
    dangerousHtmlRowCount: 0,
    rowKinds: ['setTextContent'],
    rollbackSupported: true,
    rollbackRecordCount: 1,
    gateMetadata:
      domHost.DOM_DANGEROUS_HTML_TEXT_RESET_FAKE_DOM_MUTATION_GATE_METADATA
  });
  assert.deepEqual(
    htmlRemovalHandoff.fakeDomCommitRows.map((row) => row.commitRowKind),
    ['setTextContent']
  );
  assert.equal(htmlRemovalFixture.host.innerHTML, '');
  assert.equal(htmlRemovalFixture.host.textContent, 'Managed child');
  assert.deepEqual(htmlRemovalFixture.host.dangerousWriteLog, [
    ['textContent', 'Managed child']
  ]);
  assert.equal(
    componentTree.getLatestPropsFromNode(htmlRemovalFixture.host),
    htmlRemovalFixture.nextProps
  );
  cleanupDangerousHtmlTextResetExecutionFixture(htmlRemovalFixture);
});

test('private dangerousHTML/text reset commit admits reset rows without public text compatibility', () => {
  const fixture = createDangerousHtmlTextResetExecutionFixture(
    'dangerous-html-reset-execution',
    {
      dangerouslySetInnerHTML: {__html: '<strong>Before</strong>'}
    },
    {
      children: {
        props: {
          children: 'Managed child'
        },
        type: 'span'
      },
      dangerouslySetInnerHTML: undefined
    }
  );

  const handoff = fixture.bridge.applyDangerousHtmlTextResetCommit(
    fixture.update,
    fixture.metadata,
    fixture.diagnostic,
    {
      hostInstanceToken: fixture.token,
      nextProps: fixture.nextProps,
      stateNodeRaw: 901,
      tag: 'div'
    }
  );

  assert.equal(handoff.resetTextContent, true);
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.fakeDomTextContentWritten, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.equal(
    handoff.blockedCapabilities.some(
      (capability) => capability.id === 'public-text-content-compatibility'
    ),
    true
  );
  assert.deepEqual(handoff.mutationEvidence, {
    fakeDomMutationBacked: true,
    rowCount: 1,
    mutatingRowCount: 1,
    setInnerHTMLCount: 0,
    setTextContentCount: 0,
    resetTextContentCount: 1,
    textContentRowCount: 1,
    dangerousHtmlRowCount: 0,
    rowKinds: ['resetTextContent'],
    rollbackSupported: true,
    rollbackRecordCount: 1,
    gateMetadata:
      domHost.DOM_DANGEROUS_HTML_TEXT_RESET_FAKE_DOM_MUTATION_GATE_METADATA
  });
  assert.deepEqual(fixture.host.dangerousWriteLog, [['textContent', '']]);
  assert.equal(fixture.host.textContent, '');
  assert.equal(
    componentTree.getLatestPropsFromNode(fixture.host),
    fixture.nextProps
  );

  cleanupDangerousHtmlTextResetExecutionFixture(fixture);
});

test('private dangerousHTML/text reset commit rejects stale and unsupported rows fail-closed', () => {
  const staleFixture = createDangerousHtmlTextResetExecutionFixture(
    'dangerous-html-stale-execution',
    {
      dangerouslySetInnerHTML: {__html: '<em>After</em>'}
    },
    {
      dangerouslySetInnerHTML: undefined,
      children: 'Managed child'
    }
  );
  const staleLatestProps = {
    dangerouslySetInnerHTML: {__html: '<em>Stale</em>'}
  };
  staleFixture.host.onDangerousWrite = (operation) => {
    if (operation === 'textContent') {
      componentTree.attachHostInstanceNode(
        staleFixture.host,
        staleFixture.token,
        staleLatestProps
      );
    }
  };

  let staleError = null;
  assert.throws(
    () =>
      staleFixture.bridge.applyDangerousHtmlTextResetCommit(
        staleFixture.update,
        staleFixture.metadata,
        staleFixture.diagnostic,
        {
          hostInstanceToken: staleFixture.token,
          nextProps: staleFixture.nextProps,
          stateNodeRaw: 901,
          tag: 'div'
        }
      ),
    (error) => {
      staleError = error;
      return (
        error.code ===
        'FAST_REACT_DOM_INVALID_DANGEROUS_HTML_TEXT_RESET_COMMIT_HANDOFF'
      );
    }
  );
  assert.deepEqual(
    staleError.privateRootDangerousHtmlTextResetRollbackEvidence,
    {
      kind: 'FastReactDomPrivateRootDangerousHtmlTextResetRollbackEvidence',
      latestPropsPublished: false,
      latestPropsHandoffStale: true,
      latestPropsRestoredToPrevious: false,
      mutationAttempted: true,
      mutationRollbackAttempted: true,
      mutationRollbackApplied: true,
      mutationRollbackRecordCount: 1,
      unsupportedRowRejected: false,
      mutationRollbackError: null
    }
  );
  assert.deepEqual(staleFixture.host.dangerousWriteLog, [
    ['textContent', 'Managed child'],
    ['innerHTML', '<em>After</em>']
  ]);
  assert.equal(staleFixture.host.innerHTML, '<em>After</em>');
  assert.equal(
    componentTree.getLatestPropsFromNode(staleFixture.host),
    staleLatestProps
  );
  assert.equal(
    rootBridge.getPrivateRootDangerousHtmlTextResetCommitHandoffPayload(
      staleFixture.update
    ),
    null
  );
  cleanupDangerousHtmlTextResetExecutionFixture(staleFixture);

  const unsupportedFixture = createDangerousHtmlTextResetExecutionFixture(
    'dangerous-html-unsupported-execution',
    {},
    {
      children: 'conflict',
      dangerouslySetInnerHTML: {__html: '<b>conflict</b>'}
    }
  );

  assert.throws(
    () =>
      unsupportedFixture.bridge.applyDangerousHtmlTextResetCommit(
        unsupportedFixture.update,
        unsupportedFixture.metadata,
        unsupportedFixture.diagnostic,
        {
          hostInstanceToken: unsupportedFixture.token,
          nextProps: unsupportedFixture.nextProps,
          stateNodeRaw: 901,
          tag: 'div'
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_DANGEROUS_HTML_TEXT_RESET_COMMIT_METADATA'
    }
  );
  assert.deepEqual(unsupportedFixture.host.dangerousWriteLog, []);
  assert.equal(
    componentTree.getLatestPropsFromNode(unsupportedFixture.host),
    unsupportedFixture.previousProps
  );
  cleanupDangerousHtmlTextResetExecutionFixture(unsupportedFixture);

  const staleDiagnosticFixture = createDangerousHtmlTextResetExecutionFixture(
    'dangerous-html-stale-diagnostic-execution',
    {
      dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
    },
    {
      dangerouslySetInnerHTML: {__html: '<em>After</em>'}
    }
  );
  const staleDiagnostic = createDangerousHtmlTextResetDiagnostic(
    'div',
    {
      dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
    },
    staleDiagnosticFixture.nextProps
  );

  assert.throws(
    () =>
      staleDiagnosticFixture.bridge.applyDangerousHtmlTextResetCommit(
        staleDiagnosticFixture.update,
        staleDiagnosticFixture.metadata,
        staleDiagnostic,
        {
          hostInstanceToken: staleDiagnosticFixture.token,
          nextProps: staleDiagnosticFixture.nextProps,
          stateNodeRaw: 901,
          tag: 'div'
        }
      ),
    {
      code:
        'FAST_REACT_DOM_INVALID_DANGEROUS_HTML_TEXT_RESET_COMMIT_METADATA'
    }
  );
  assert.deepEqual(staleDiagnosticFixture.host.dangerousWriteLog, []);
  assert.equal(
    componentTree.getLatestPropsFromNode(staleDiagnosticFixture.host),
    staleDiagnosticFixture.previousProps
  );
  cleanupDangerousHtmlTextResetExecutionFixture(staleDiagnosticFixture);
});

test('private dangerousHTML/text reset commit rejects unadmitted live-like host before DOM access', () => {
  const fixture = createDangerousHtmlTextResetExecutionFixture(
    'dangerous-html-live-like-reject',
    {
      dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
    },
    {
      dangerouslySetInnerHTML: {__html: '<em>After</em>'}
    },
    {admitFakeDomTarget: false}
  );
  const guardedReads = [];
  const guardedWrites = [];

  Object.defineProperties(fixture.host, {
    innerHTML: {
      configurable: true,
      enumerable: true,
      get() {
        guardedReads.push('innerHTML');
        throw new Error('Unexpected live innerHTML read');
      },
      set(value) {
        guardedWrites.push(['innerHTML', String(value)]);
        throw new Error('Unexpected live innerHTML write');
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        guardedReads.push('textContent');
        throw new Error('Unexpected live textContent read');
      },
      set(value) {
        guardedWrites.push(['textContent', String(value)]);
        throw new Error('Unexpected live textContent write');
      }
    }
  });

  let rejectedError = null;
  assert.throws(
    () =>
      fixture.bridge.applyDangerousHtmlTextResetCommit(
        fixture.update,
        fixture.metadata,
        fixture.diagnostic,
        {
          hostInstanceToken: fixture.token,
          nextProps: fixture.nextProps,
          stateNodeRaw: 901,
          tag: 'div'
        }
      ),
    (error) => {
      rejectedError = error;
      return (
        error.code ===
        'FAST_REACT_DOM_UNADMITTED_DANGEROUS_HTML_TEXT_RESET_FAKE_DOM_TARGET'
      );
    }
  );
  assert.deepEqual(guardedReads, []);
  assert.deepEqual(guardedWrites, []);
  assert.deepEqual(fixture.host.dangerousWriteLog, []);
  assert.deepEqual(
    rejectedError.privateRootDangerousHtmlTextResetRollbackEvidence,
    {
      kind: 'FastReactDomPrivateRootDangerousHtmlTextResetRollbackEvidence',
      latestPropsPublished: false,
      latestPropsHandoffStale: false,
      latestPropsRestoredToPrevious: true,
      mutationAttempted: false,
      mutationRollbackAttempted: false,
      mutationRollbackApplied: false,
      mutationRollbackRecordCount: 0,
      unsupportedRowRejected: false,
      mutationRollbackError: null
    }
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(fixture.host),
    fixture.previousProps
  );
  assert.equal(
    rootBridge.getPrivateRootDangerousHtmlTextResetCommitHandoffPayload(
      fixture.update
    ),
    null
  );

  cleanupDangerousHtmlTextResetExecutionFixture(fixture);
});

test('private root host-output update rolls back props when text mutation fails', () => {
  const document = createHostOutputDocument(
    'private-host-output-update-rollback'
  );
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputProps('initial');
  const nextProps = createHostOutputProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const update = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: 'div'
  });
  const thrownError = new Error('fake HostText update failed');

  mounted.host.attributeLog = [];
  mounted.text.writeLog = [];
  Object.defineProperty(mounted.text, 'nodeValue', {
    configurable: true,
    get() {
      return this.data;
    },
    set(value) {
      this.writeLog.push(['nodeValue', String(value), 'throw']);
      throw thrownError;
    }
  });

  assert.throws(
    () =>
      bridge.applyHostOutputUpdate(update, {
        hostInstanceToken: mounted.token,
        nextProps,
        tag: 'div',
        textUpdate: {
          newText: 'goodbye',
          oldText: 'hello',
          textInstance: mounted.text
        }
      }),
    (error) => error === thrownError
  );
  assert.deepEqual(activeHostOutputAttributes(mounted.host), [
    ['class', 'root-card'],
    ['data-phase', 'initial'],
    ['id', 'message'],
    ['title', 'initial title']
  ]);
  assert.deepEqual(mounted.host.attributeLog, [
    ['setAttribute', 'class', 'root-card updated'],
    ['setAttribute', 'title', 'updated title'],
    ['setAttribute', 'data-phase', 'updated'],
    ['setAttribute', 'data-phase', 'initial'],
    ['setAttribute', 'title', 'initial title'],
    ['setAttribute', 'class', 'root-card']
  ]);
  assert.deepEqual(mounted.text.writeLog, [['nodeValue', 'goodbye', 'throw']]);
  assert.equal(mounted.text.textContent, 'hello');
  assert.equal(
    componentTree.getLatestPropsFromNode(mounted.host),
    initialProps
  );
  assert.equal(
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(update),
    null
  );

  assert.equal(
    componentTree.detachHostInstanceToken(mounted.token),
    mounted.token
  );
  bridge.revertCreateRootSideEffects(sideEffects);
});

test('private root host-output update validates initial admission and root ownership', () => {
  const document = createHostOutputDocument('private-host-output-validation');
  const firstContainer = document.createElement('div');
  const secondContainer = document.createElement('section');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const firstCreate = bridge.createClientRoot(firstContainer);
  const secondCreate = bridge.createClientRoot(secondContainer);
  const firstProps = createHostOutputProps('initial');
  const nextProps = createHostOutputProps('updated');
  const firstInitialRender = bridge.renderContainer(firstCreate.handle, {
    props: firstProps,
    type: 'div'
  });
  const firstUpdate = bridge.renderContainer(firstCreate.handle, {
    props: nextProps,
    type: 'div'
  });
  const firstMounted = mountPrivateHostOutput(
    firstContainer,
    firstCreate.owner,
    firstProps
  );
  const secondMounted = mountPrivateHostOutput(
    secondContainer,
    secondCreate.owner,
    firstProps
  );

  assert.throws(
    () =>
      bridge.applyHostOutputUpdate(firstInitialRender, {
        hostInstanceToken: firstMounted.token,
        nextProps,
        tag: 'div',
        textUpdate: {
          newText: 'goodbye',
          oldText: 'hello',
          textInstance: firstMounted.text
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF'
    }
  );
  assert.throws(
    () =>
      bridge.applyHostOutputUpdate(firstUpdate, {
        hostInstanceToken: firstMounted.token,
        nextProps,
        tag: 'div',
        textUpdate: {
          newText: 'goodbye',
          oldText: 'hello',
          textInstance: firstMounted.text
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF'
    }
  );

  const firstSideEffects = bridge.applyCreateRootSideEffects(firstCreate);
  bridge.admitCreateRenderPath(
    firstCreate,
    firstSideEffects,
    firstInitialRender
  );
  assert.throws(
    () =>
      bridge.applyHostOutputUpdate(firstUpdate, {
        hostInstanceToken: secondMounted.token,
        nextProps,
        tag: 'div',
        textUpdate: {
          newText: 'goodbye',
          oldText: 'hello',
          textInstance: secondMounted.text
        }
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF'
    }
  );

  assert.equal(
    componentTree.detachHostInstanceToken(firstMounted.token),
    firstMounted.token
  );
  assert.equal(
    componentTree.detachHostInstanceToken(secondMounted.token),
    secondMounted.token
  );
  bridge.revertCreateRootSideEffects(firstSideEffects);
});

test('private controlled select and textarea fake-DOM restore execution remains blocked for live DOM', () => {
  const select = createRootBridgeControlledFakeDomRestoreExecution({
    controlKind: 'multiple',
    eventName: 'change',
    fakeInitial: {selectedValues: ['b']},
    fakeObserved: {selectedValues: ['b', 'c']},
    hostTag: 'select',
    latestProps: {
      multiple: true,
      value: ['a', 'c'],
      onChange() {}
    },
    multiple: true,
    nodeName: 'SELECT',
    scenarioId: 'private-root-select-multiple-controlled-update'
  });
  const textarea = createRootBridgeControlledFakeDomRestoreExecution({
    controlKind: 'value',
    eventName: 'input',
    fakeInitial: {value: 'alpha'},
    fakeObserved: {value: 'browser-mutated'},
    hostTag: 'textarea',
    latestProps: {
      value: 'beta',
      onChange() {},
      onInput() {}
    },
    nodeName: 'TEXTAREA',
    scenarioId: 'private-root-textarea-controlled-update'
  });

  assert.deepEqual(select.fakeTarget.selectedValues, ['a', 'c']);
  assert.equal(textarea.fakeTarget.value, 'beta');
  assert.deepEqual(
    [select.execution, textarea.execution].map((execution) => {
      const row = execution.fakeDomRestoreExecutionRows[0];
      return {
        status: execution.status,
        acceptedRestoreKind: row.acceptedRestoreKind,
        targetField: row.targetField,
        nextValueSnapshot: row.nextValueSnapshot,
        restoreQueueWritten: row.restoreQueueWritten,
        restoreQueueFlushed: row.restoreQueueFlushed,
        hostWrapperInvoked: row.hostWrapperInvoked,
        wrapperWritePerformed: row.wrapperWritePerformed,
        valueTrackerFieldWritten: row.valueTrackerFieldWritten,
        fakeDomInputMutated: row.fakeDomInputMutated,
        browserInputMutated: row.browserInputMutated,
        compatibilityClaimed: row.compatibilityClaimed
      };
    }),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueFakeDomExecutionStatus,
        acceptedRestoreKind: 'select-multiple-value',
        targetField: 'selectedValues',
        nextValueSnapshot: ['a', 'c'],
        restoreQueueWritten: true,
        restoreQueueFlushed: true,
        hostWrapperInvoked: true,
        wrapperWritePerformed: true,
        valueTrackerFieldWritten: false,
        fakeDomInputMutated: true,
        browserInputMutated: false,
        compatibilityClaimed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueFakeDomExecutionStatus,
        acceptedRestoreKind: 'textarea-value',
        targetField: 'value',
        nextValueSnapshot: 'beta',
        restoreQueueWritten: true,
        restoreQueueFlushed: true,
        hostWrapperInvoked: true,
        wrapperWritePerformed: true,
        valueTrackerFieldWritten: false,
        fakeDomInputMutated: true,
        browserInputMutated: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueFakeDomExecutionRecord(
      select.execution
    ),
    true
  );
  assert.equal(select.execution.sideEffects.privateRestoreQueueWritten, true);
  assert.equal(select.execution.sideEffects.restoreQueueWritten, false);
  assert.equal(select.execution.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(select.execution.sideEffects.browserInputMutated, false);
  assert.equal(
    select.execution.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(select.fakeTarget, '_valueTracker'), false);
  assert.equal(Object.hasOwn(textarea.fakeTarget, '_valueTracker'), false);

  const liveNode = createElement('SELECT', select.latestPropsLookup.document);
  liveNode[resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker] =
    true;
  liveNode.value = 'browser-live';
  const guardedReads = [];
  const guardedWrites = [];
  const guardedLiveNode = new Proxy(liveNode, {
    get(target, property, receiver) {
      if (isControlledRestoreLiveValueKey(property)) {
        guardedReads.push(String(property));
        throw new Error(`Unexpected live read ${String(property)}`);
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (isControlledRestoreLiveValueKey(property)) {
        guardedWrites.push(String(property));
        throw new Error(`Unexpected live write ${String(property)}`);
      }
      return Reflect.set(target, property, value, receiver);
    }
  });

  assert.throws(
    () =>
      select.restoreGate.recordFakeDomControlledRestoreExecution(
        select.latestPropsLookup.lookupRecord,
        select.intent,
        select.writeExecution,
        select.flushBlocker,
        select.wrapperIntent,
        {
          explicitAdmission: true,
          queueKind: 'deterministic-fake-dom-controlled-restore-execution',
          queueId: 'private-root-select-live-reject',
          targetKind:
            'controlled-input-post-event-restore-fake-dom-execution',
          fakeDomTarget: guardedLiveNode
        }
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidFakeDomExecutionCode,
      reason: 'unsupported-live-dom-node'
    }
  );
  assert.deepEqual(guardedReads, []);
  assert.deepEqual(guardedWrites, []);
  assert.equal(liveNode.value, 'browser-live');
  assert.equal(Object.hasOwn(liveNode, '_valueTracker'), false);

  componentTree.detachHostInstanceToken(select.latestPropsLookup.token);
  componentTree.detachHostInstanceToken(textarea.latestPropsLookup.token);
});
