'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const hydrationGate = require(path.join(
  packageRoot,
  'src/client/hydration-boundary-gate.js'
));
const rootBridge = require(path.join(
  packageRoot,
  'src/client/root-bridge.js'
));
const domContainer = require(path.join(
  packageRoot,
  'src/client/dom-container.js'
));
const rootMarkers = require(path.join(
  packageRoot,
  'src/client/root-markers.js'
));
const listenerRegistry = require(path.join(
  packageRoot,
  'src/events/listener-registry.js'
));
const ReactDOMClient = require(path.join(packageRoot, 'client.js'));

test('unsupported hydrateRoot records bridge hydration parser evidence with root guards', () => {
  const first = createUnsupportedHydrateRootScenario('bridge');
  const second = createUnsupportedHydrateRootScenario('bridge');

  assert.deepEqual(first.record, second.record);
  assert.equal(first.record.operation, 'hydrateRoot');
  assert.equal(first.record.status, 'unsupported');
  assert.equal(first.record.canHydrate, false);
  assert.equal(first.record.publicRootCreated, false);
  assert.equal(first.record.containerMarked, false);
  assert.equal(first.record.listenersAttached, false);
  assert.equal(first.record.domMutated, false);
  assert.equal(first.record.eventsReplayed, false);
  assert.equal(first.record.rootScheduled, false);

  assert.deepEqual(first.record.markerDiagnostics.markers.map(markerContractId), [
    'suspense-completed-start',
    'suspense-end'
  ]);
  assert.equal(first.record.markerDiagnostics.acceptedMarkerCount, 2);
  assert.equal(first.record.markerDiagnostics.diagnosticOnly, true);
  assert.equal(first.record.markerDiagnostics.canHydrate, false);
  assert.equal(first.record.markerDiagnostics.eventReplaySupported, false);
  assert.equal(first.record.markerDiagnostics.domMutationSupported, false);

  assert.deepEqual(first.record.markerGuard, {
    action: 'defer-mark-container-as-root-for-hydrate-root',
    hasLegacyRootMarker: false,
    isContainerMarkedAsRoot: true,
    rootMarkerSnapshot: {
      inspectable: true,
      nullCount: 0,
      properties: [
        {
          enumerable: true,
          keyPrefix: '__reactContainer$',
          valueState: 'truthy',
          valueType: 'object'
        }
      ],
      propertyCount: 1,
      truthyCount: 1
    },
    warning: {
      message: rootMarkers.duplicateCreateRootWarning,
      type: 'duplicate-create-root'
    }
  });
  assert.deepEqual(first.record.listenerGuard, {
    action: 'defer-listen-to-all-supported-events-for-hydrate-root',
    canInstallRootListeners: true,
    hasRootListeningMarker: true,
    ownerDocumentCanInstallSelectionChange: true,
    ownerDocumentHasSelectionChangeMarker: false,
    ownerDocumentInfo: {
      kind: 'object',
      nodeName: '#document',
      nodeType: domContainer.DOCUMENT_NODE
    },
    rootEventTargetInfo: {
      kind: 'object',
      nodeName: 'DIV',
      nodeType: domContainer.ELEMENT_NODE
    }
  });

  assert.deepEqual(first.container.__registrations, []);
  assert.deepEqual(first.document.__registrations, []);
  assert.equal(rootMarkers.inspectContainerRootMarker(first.container).propertyCount, 1);
  assert.equal(
    listenerRegistry.inspectListeningMarker(first.container).propertyCount,
    1
  );
  assert.equal(
    listenerRegistry.inspectListeningMarker(first.document).propertyCount,
    0
  );
});

test('private root bridge hydrateRoot requests preserve hydration marker evidence record-only', () => {
  const first = createPrivateRootBridgeHydrateScenario('root-bridge');
  const second = createPrivateRootBridgeHydrateScenario('root-bridge');

  assert.deepEqual(first.record, second.record);
  assert.equal(first.record.$$typeof, rootBridge.privateRootHydrateRecordType);
  assert.equal(first.record.kind, 'FastReactDomPrivateRootHydrateRecord');
  assert.equal(first.record.operation, 'hydrate');
  assert.equal(first.record.requestType, 'hydrateRoot');
  assert.equal(first.record.requestId, 'hydration-request:1');
  assert.equal(first.record.hydrateId, 'hydration-root-bridge:1');
  assert.equal(first.record.rootId, null);
  assert.equal(first.record.rootKind, hydrationGate.UNSUPPORTED_HYDRATION_ROOT_KIND);
  assert.equal(
    first.record.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION
  );
  assert.equal(first.record.hydrationRequested, true);
  assert.equal(first.record.hydration, false);
  assert.equal(first.record.reconcilerExecution, false);
  assert.equal(first.record.domMutation, false);
  assert.equal(first.record.markerWrites, false);
  assert.equal(first.record.listenerInstallation, false);
  assert.equal(first.record.eventDispatch, false);
  assert.equal(first.record.compatibilityClaimed, false);

  assert.equal(
    hydrationGate.isPrivateHydrationBoundaryRecord(
      first.record.hydrationBoundaryRecord
    ),
    true
  );
  assert.equal(
    first.record.markerDiagnostics,
    first.record.hydrationBoundaryRecord.markerDiagnostics
  );
  assert.deepEqual(first.record.markerEvidence, {
    kind: 'FastReactDomHydrationMarkerEvidence',
    status: 'accepted-marker-evidence-recorded',
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    acceptedMarkerCount: 2,
    commentMarkerCount: 2,
    templateMarkerCount: 0,
    unrecognizedMarkerCount: 0,
    contractIds: ['suspense-completed-start', 'suspense-end']
  });

  assert.deepEqual(
    first.record.markerDiagnostics.markers.map(markerContractId),
    ['suspense-completed-start', 'suspense-end']
  );
  assert.equal(first.record.markerDiagnostics.diagnosticOnly, true);
  assert.equal(first.record.markerDiagnostics.readOnly, true);
  assert.equal(first.record.markerDiagnostics.canHydrate, false);
  assert.equal(first.record.markerDiagnostics.domMutationSupported, false);

  assert.deepEqual(
    {
      admissionStatus: first.admission.admissionStatus,
      compatibilityClaimed: first.admission.compatibilityClaimed,
      executionStatus: first.admission.executionStatus,
      hydrateId: first.admission.hydrateId,
      hydration: first.admission.hydration,
      markerEvidence: first.admission.markerEvidence,
      operation: first.admission.operation,
      transition: first.admission.lifecyclePrerequisites.lifecycleTransition
    },
    {
      admissionStatus: rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED,
      compatibilityClaimed: false,
      executionStatus: rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED,
      hydrateId: 'hydration-root-bridge:1',
      hydration: false,
      markerEvidence: first.record.markerEvidence,
      operation: 'hydrate',
      transition: 'none->unsupported-hydration'
    }
  );

  const rootPayload = rootBridge.getPrivateRootRecordPayload(first.record);
  assert.equal(rootPayload.container, first.container);
  assert.equal(rootPayload.initialChildren, first.initialChildren);
  assert.equal(rootPayload.hydrationOptions, first.hydrationOptions);
  assert.equal(
    rootPayload.hydrationBoundaryRecord,
    first.record.hydrationBoundaryRecord
  );

  const boundaryPayload =
    hydrationGate.getPrivateHydrationBoundaryRecordPayload(
      first.record.hydrationBoundaryRecord
    );
  assert.equal(boundaryPayload.container, first.container);
  assert.equal(boundaryPayload.initialChildren, first.initialChildren);
  assert.equal(boundaryPayload.hydrationOptions, first.hydrationOptions);

  assert.throws(
    () => first.bridge.createNativeRequestHandoff(first.record),
    {
      code: 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST'
    }
  );
  assert.deepEqual(first.container.__registrations, []);
  assert.deepEqual(first.document.__registrations, []);
  assert.equal(rootMarkers.inspectContainerRootMarker(first.container).propertyCount, 1);
  assert.equal(
    listenerRegistry.inspectListeningMarker(first.container).propertyCount,
    1
  );
  assert.deepEqual(first.container.childNodes, [
    {data: '$', nodeType: domContainer.COMMENT_NODE},
    {data: '/$', nodeType: domContainer.COMMENT_NODE}
  ]);
});

test('public hydrateRoot remains an unsupported placeholder with no guard side effects', () => {
  const document = createDocument('public');
  const container = createElement('DIV', document);
  container.childNodes = [createComment('$'), createComment('/$')];

  assert.throws(
    () => ReactDOMClient.hydrateRoot(container, 'child'),
    {
      code: 'FAST_REACT_UNIMPLEMENTED',
      entrypoint: 'react-dom/client',
      exportName: 'hydrateRoot'
    }
  );
  assert.deepEqual(rootMarkers.inspectContainerRootMarker(container), {
    inspectable: true,
    nullCount: 0,
    properties: [],
    propertyCount: 0,
    truthyCount: 0
  });
  assert.deepEqual(listenerRegistry.inspectListeningMarker(container), {
    inspectable: true,
    propertyCount: 0,
    trueValueCount: 0
  });
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.deepEqual(container.childNodes, [
    {data: '$', nodeType: domContainer.COMMENT_NODE},
    {data: '/$', nodeType: domContainer.COMMENT_NODE}
  ]);
});

function markerContractId(marker) {
  return marker.contractId;
}

function createUnsupportedHydrateRootScenario(label) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  container.childNodes = [createComment('$'), createComment('/$')];

  rootMarkers.markContainerAsRoot(
    Object.freeze({
      rootId: `${label}:existing-root`
    }),
    container
  );
  listenerRegistry.markTargetAsListening(container);

  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOptions: {
      development: true
    },
    recordIdPrefix: 'hydration-root-bridge'
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    {
      props: {
        children: 'hello'
      },
      type: 'App'
    },
    {
      identifierPrefix: `${label}-`
    }
  );

  return {
    container,
    document,
    record
  };
}

function createPrivateRootBridgeHydrateScenario(label) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  container.childNodes = [createComment('$'), createComment('/$')];

  rootMarkers.markContainerAsRoot(
    Object.freeze({
      rootId: `${label}:existing-root`
    }),
    container
  );
  listenerRegistry.markTargetAsListening(container);

  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: 'hydration-root-bridge',
    hydrationRecordIdPrefix: 'hydration-boundary',
    markerOptions: {
      development: true
    },
    requestIdPrefix: 'hydration-request'
  });
  const initialChildren = {
    props: {
      children: 'hello'
    },
    type: 'App'
  };
  const hydrationOptions = {
    identifierPrefix: `${label}-`
  };
  const record = bridge.createHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );

  return {
    admission: bridge.admitRequest(record),
    bridge,
    container,
    document,
    hydrationOptions,
    initialChildren,
    record
  };
}

function createComment(data) {
  return {
    data,
    nodeType: domContainer.COMMENT_NODE
  };
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: '#document',
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.defaultView = createEventTarget({
    label: `${label}-window`
  });
  document.ownerDocument = document;
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    childNodes: [],
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createEventTarget(fields) {
  return {
    ...fields,
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    }
  };
}
