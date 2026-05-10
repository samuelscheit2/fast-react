import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findReactDomHydrationMarkerContract,
  readCheckedReactDomHydrationMarkerOracle
} from "../src/react-dom-hydration-marker-oracle.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

const hydrationGate = require(
  path.join(
    repoRoot,
    "packages/react-dom/src/client/hydration-boundary-gate.js"
  )
);
const rootBridge = require(
  path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
);
const domContainer = require(
  path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
);
const rootMarkers = require(
  path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
);
const listenerRegistry = require(
  path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
);
const pluginEventSystem = require(
  path.join(repoRoot, "packages/react-dom/src/events/plugin-event-system.js")
);
const ReactDOMClient = require(path.join(repoRoot, "packages/react-dom/client.js"));
const ReactDOMProfiling = require(
  path.join(repoRoot, "packages/react-dom/profiling.js")
);

const oracle = readCheckedReactDomHydrationMarkerOracle();

test("private hydration boundary gate accepts the checked marker oracle", () => {
  const oracleInfo = hydrationGate.assertAcceptedHydrationMarkerOracle(oracle);

  assert.equal(
    oracleInfo.oracleKind,
    "react-19.2.6-react-dom-hydration-marker-oracle"
  );
  assert.equal(oracleInfo.schemaVersion, 1);
  assert.equal(oracleInfo.source, "checked-oracle");
  assert.equal(oracleInfo.compatibilityClaimed, false);
  assert.equal(oracleInfo.fastReactHydrationCompatible, false);
  assert.equal(oracleInfo.fullDualRunOracleExists, false);
  assert.equal(oracleInfo.markerContractCount, oracle.markerContracts.length);
  assert.deepEqual(
    oracleInfo.markerContractIds,
    oracle.markerContracts.map((contract) => contract.id)
  );
  assert.deepEqual(
    hydrationGate.acceptedHydrationMarkerContracts,
    oracle.markerContracts.map(
      ({
        id,
        area,
        serializedMarker,
        commentData,
        companionNode,
        lifecycle
      }) => ({
        id,
        area,
        serializedMarker,
        commentData,
        companionNode,
        lifecycle
      })
    )
  );
  assert.deepEqual(
    oracleInfo.commentMarkers,
    oracle.markerContracts
      .filter((contract) => contract.commentData !== null)
      .map((contract) => ({
        commentData: contract.commentData,
        id: contract.id
      }))
  );
  assert.equal(
    findReactDomHydrationMarkerContract(oracle, "suspense-queued-start")
      .commentData,
    "$~"
  );
});

test("private hydration boundary gate parses accepted container marker evidence read-only", () => {
  const { container, contractIds } = createAcceptedHydrationMarkerFixture(
    "parser"
  );
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle
  });
  const diagnostics = gate.inspectContainerMarkers(container);

  assert.equal(
    diagnostics.kind,
    "FastReactDomHydrationContainerMarkerDiagnostics"
  );
  assert.equal(diagnostics.status, "diagnostic-only");
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.canHydrate, false);
  assert.equal(diagnostics.hydrateRootSupported, false);
  assert.equal(diagnostics.rootSchedulingSupported, false);
  assert.equal(diagnostics.eventReplaySupported, false);
  assert.equal(diagnostics.domMutationSupported, false);
  assert.equal(diagnostics.suspenseHydrationSupported, false);
  assert.equal(diagnostics.formMarkerClaimingSupported, false);
  assert.equal(diagnostics.markerContractCount, oracle.markerContracts.length);
  assert.equal(diagnostics.acceptedMarkerCount, oracle.markerContracts.length);
  assert.equal(diagnostics.commentMarkerCount, 12);
  assert.equal(diagnostics.templateMarkerCount, 5);
  assert.equal(diagnostics.unrecognizedMarkerCount, 0);
  assert.deepEqual(
    diagnostics.markers.map((marker) => marker.contractId),
    contractIds
  );
  assert.deepEqual(
    diagnostics.summaryByContract,
    oracle.markerContracts.map((contract) => ({
      id: contract.id,
      count: 1
    }))
  );

  const pendingMarker = diagnostics.markers.find(
    (marker) => marker.contractId === "suspense-pending-start"
  );
  assert.equal(pendingMarker.companion.status, "matched");
  assert.equal(pendingMarker.companion.templateInfo.id, "parser-B:1a");
  assert.equal(pendingMarker.companion.acceptedEvidence, true);

  const clientRenderedMarker = diagnostics.markers.find(
    (marker) => marker.contractId === "suspense-client-rendered-start"
  );
  assert.deepEqual(clientRenderedMarker.companion.templateInfo.errorEvidence, {
    componentStack: "component-stack",
    digest: "digest",
    message: "message",
    stack: "stack"
  });

  const styledBoundaryMarker = diagnostics.markers.find(
    (marker) =>
      marker.contractId === "external-runtime-complete-boundary-with-styles"
  );
  assert.equal(
    styledBoundaryMarker.templateInfo.attributes["data-sty"],
    "[\"main\"]"
  );

  assert.deepEqual(
    container.childNodes.map((node) => node.nodeName || "#comment"),
    [
      "#comment",
      "#comment",
      "#comment",
      "#comment",
      "TEMPLATE",
      "#comment",
      "TEMPLATE",
      "#comment",
      "TEMPLATE",
      "#comment",
      "#comment",
      "#comment",
      "#comment",
      "#comment",
      "#comment",
      "TEMPLATE",
      "TEMPLATE",
      "TEMPLATE",
      "TEMPLATE",
      "TEMPLATE"
    ]
  );
});

test("private hydration boundary gate records unsupported hydrateRoot deterministically", () => {
  const first = createUnsupportedRecordScenario("deterministic");
  const second = createUnsupportedRecordScenario("deterministic");

  assert.deepEqual(first.record, second.record);
  assert.equal(Object.isFrozen(first.record), true);
  assert.equal(first.record.$$typeof, hydrationGate.privateHydrationBoundaryRecordType);
  assert.equal(first.record.kind, "FastReactDomUnsupportedHydrationBoundaryRecord");
  assert.equal(first.record.operation, "hydrateRoot");
  assert.equal(first.record.status, "unsupported");
  assert.equal(first.record.recordId, "hydration-gate:1");
  assert.equal(first.record.rootKind, "unsupported-hydration");
  assert.equal(first.record.rootTag, "ConcurrentRoot");
  assert.deepEqual(first.record.containerInfo, {
    kind: "object",
    nodeName: "DIV",
    nodeType: domContainer.ELEMENT_NODE
  });
  assert.deepEqual(first.record.initialChildrenInfo, {
    keys: ["props", "type"],
    type: "object"
  });
  assert.deepEqual(first.record.optionsInfo, {
    keys: [
      "identifierPrefix",
      "onHydrated",
      "onRecoverableError",
      "unstable_strictMode"
    ],
    type: "object"
  });
  assert.equal(first.record.canHydrate, false);
  assert.equal(first.record.publicRootCreated, false);
  assert.equal(first.record.containerMarked, false);
  assert.equal(first.record.listenersAttached, false);
  assert.equal(first.record.domMutated, false);
  assert.equal(first.record.eventsReplayed, false);
  assert.deepEqual(
    first.record.blockedOn.map((entry) => entry.id),
    [
      "no-hydration-root-constructor",
      "no-hydration-context",
      "no-hydration-root-scheduling",
      "no-hydration-marker-consumption",
      "no-boundary-dom-operations",
      "no-event-replay",
      "no-form-marker-claiming"
    ]
  );
  assert.deepEqual(
    first.record.oracleInfo.markerContractIds,
    oracle.markerContracts.map((contract) => contract.id)
  );
  assert.equal(first.record.markerDiagnostics.status, "diagnostic-only");
  assert.equal(first.record.markerDiagnostics.acceptedMarkerCount, 2);
  assert.deepEqual(first.record.markerEvidence, {
    kind: "FastReactDomHydrationMarkerEvidence",
    status: "accepted-marker-evidence-recorded",
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    acceptedMarkerCount: 2,
    commentMarkerCount: 2,
    templateMarkerCount: 0,
    unrecognizedMarkerCount: 0,
    contractIds: ["suspense-completed-start", "suspense-end"]
  });
  assert.deepEqual(
    first.record.markerDiagnostics.markers.map((marker) => marker.contractId),
    ["suspense-completed-start", "suspense-end"]
  );
  assertHydrationMarkerReplayQueueDiagnostics(first.record, {
    acceptedMarkerCount: 2,
    hasRootListeningMarker: false,
    isContainerMarkedAsRoot: false,
    markerReplayTargetCandidateCount: 1,
    ownerDocumentHasSelectionChangeMarker: false,
    rootMarkerPropertyCount: 0,
    rootMarkerTruthyCount: 0,
    warningType: null
  });
  assert.equal(first.record.rootScheduled, false);
  assert.equal(first.record.suspenseHydrationScheduled, false);

  const payload = hydrationGate.getPrivateHydrationBoundaryRecordPayload(
    first.record
  );
  assert.equal(payload.container, first.container);
  assert.equal(payload.initialChildren, first.initialChildren);
  assert.equal(payload.hydrationOptions, first.hydrationOptions);
  assert.equal(hydrationGate.isPrivateHydrationBoundaryRecord(first.record), true);
  assert.equal(hydrationGate.isPrivateHydrationBoundaryRecord({}), false);
});

test("private root bridge hydrateRoot requests preserve accepted marker evidence record-only", () => {
  const first = createRootBridgeHydrateRootScenario("root-bridge");
  const second = createRootBridgeHydrateRootScenario("root-bridge");

  assert.deepEqual(first.record, second.record);
  assert.equal(first.record.$$typeof, rootBridge.privateRootHydrateRecordType);
  assert.equal(first.record.kind, "FastReactDomPrivateRootHydrateRecord");
  assert.equal(first.record.operation, "hydrate");
  assert.equal(first.record.requestType, "hydrateRoot");
  assert.equal(first.record.requestId, "hydrate-request:1");
  assert.equal(first.record.hydrateId, "hydrate-root:1");
  assert.equal(first.record.rootId, null);
  assert.equal(first.record.rootKind, "unsupported-hydration");
  assert.equal(first.record.rootTag, "ConcurrentRoot");
  assert.equal(
    first.record.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION
  );
  assert.equal(first.record.hydrationRequested, true);
  assert.equal(first.record.canHydrate, false);
  assert.equal(first.record.publicRootCreated, false);
  assert.equal(first.record.containerMarked, false);
  assert.equal(first.record.listenersAttached, false);
  assert.equal(first.record.domMutated, false);
  assert.equal(first.record.eventsReplayed, false);
  assert.equal(first.record.rootScheduled, false);
  assert.equal(first.record.suspenseHydrationScheduled, false);
  assert.equal(first.record.nativeExecution, false);
  assert.equal(first.record.reconcilerExecution, false);
  assert.equal(first.record.domMutation, false);
  assert.equal(first.record.markerWrites, false);
  assert.equal(first.record.listenerInstallation, false);
  assert.equal(first.record.hydration, false);
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
  assert.equal(
    first.record.markerEvidence,
    first.record.hydrationBoundaryRecord.markerEvidence
  );
  assert.equal(
    first.record.replayQueueDiagnostics,
    first.record.hydrationBoundaryRecord.replayQueueDiagnostics
  );
  assert.deepEqual(first.record.markerEvidence, {
    kind: "FastReactDomHydrationMarkerEvidence",
    status: "accepted-marker-evidence-recorded",
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    canHydrate: false,
    acceptedMarkerCount: 2,
    commentMarkerCount: 2,
    templateMarkerCount: 0,
    unrecognizedMarkerCount: 0,
    contractIds: ["suspense-completed-start", "suspense-end"]
  });
  assert.deepEqual(
    first.record.markerDiagnostics.markers.map((marker) => marker.contractId),
    ["suspense-completed-start", "suspense-end"]
  );
  assertHydrationMarkerReplayQueueDiagnostics(first.record, {
    acceptedMarkerCount: 2,
    hasRootListeningMarker: true,
    isContainerMarkedAsRoot: true,
    markerReplayTargetCandidateCount: 1,
    ownerDocumentHasSelectionChangeMarker: false,
    rootMarkerPropertyCount: 1,
    rootMarkerTruthyCount: 1,
    warningType: "duplicate-create-root"
  });

  assert.deepEqual(
    {
      admissionStatus: first.admission.admissionStatus,
      compatibilityClaimed: first.admission.compatibilityClaimed,
      executionStatus: first.admission.executionStatus,
      hydrateId: first.admission.hydrateId,
      hydration: first.admission.hydration,
      markerEvidence: first.admission.markerEvidence,
      operation: first.admission.operation,
      requestType: first.admission.requestType,
      replayQueueDiagnostics: first.admission.replayQueueDiagnostics,
      rootKind: first.admission.lifecyclePrerequisites.rootKind,
      transition: first.admission.lifecyclePrerequisites.lifecycleTransition
    },
    {
      admissionStatus: "admitted-private-root-bridge-request-record",
      compatibilityClaimed: false,
      executionStatus: "blocked-private-root-bridge-execution",
      hydrateId: "hydrate-root:1",
      hydration: false,
      markerEvidence: first.record.markerEvidence,
      operation: "hydrate",
      requestType: "hydrateRoot",
      replayQueueDiagnostics: first.record.replayQueueDiagnostics,
      rootKind: "unsupported-hydration",
      transition: "none->unsupported-hydration"
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

  assert.throws(
    () => first.bridge.createNativeRequestHandoff(first.record),
    {
      code: "FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST"
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
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ]);
});

test("private hydration boundary gate does not mark containers, install listeners, or mutate DOM-like nodes", () => {
  const { container, document, record } =
    createUnsupportedRecordScenario("side-effects");

  assert.equal(record.containerMarked, false);
  assert.deepEqual(rootMarkers.inspectContainerRootMarker(container), {
    inspectable: true,
    nullCount: 0,
    properties: [],
    propertyCount: 0,
    truthyCount: 0
  });
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.deepEqual(container.childNodes, [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ]);
  assert.equal(record.markerDiagnostics.diagnosticOnly, true);
  assert.equal(record.markerDiagnostics.domMutationSupported, false);
  assert.equal(record.markerDiagnostics.eventReplaySupported, false);
});

test("private hydration boundary gate fails closed for invalid containers and oracle drift", () => {
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle
  });
  assert.throws(
    () =>
      gate.recordUnsupportedHydrateRoot(
        {
          nodeName: "#text",
          nodeType: domContainer.TEXT_NODE,
          ownerDocument: createDocument("invalid")
        },
        "child"
      ),
    {
      code: "FAST_REACT_DOM_INVALID_CONTAINER"
    }
  );
  assert.throws(
    () =>
      gate.inspectContainerMarkers({
        nodeName: "#text",
        nodeType: domContainer.TEXT_NODE,
        ownerDocument: createDocument("invalid-parser")
      }),
    {
      code: "FAST_REACT_DOM_INVALID_CONTAINER"
    }
  );

  assert.throws(
    () =>
      hydrationGate.createHydrationBoundaryGate({
        markerOracle: {
          ...oracle,
          conformanceClaims: {
            ...oracle.conformanceClaims,
            compatibilityClaimed: true
          }
        }
      }),
    {
      code: "FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH"
    }
  );

  assert.throws(
    () =>
      hydrationGate.createHydrationBoundaryGate({
        markerOracle: {
          ...oracle,
          markerContracts: oracle.markerContracts.map((contract) =>
            contract.id === "activity-start"
              ? { ...contract, commentData: "changed" }
              : contract
          )
        }
      }),
    {
      code: "FAST_REACT_DOM_HYDRATION_MARKER_ORACLE_MISMATCH"
    }
  );
});

test("public hydrateRoot exports remain unsupported placeholders", () => {
  const document = createDocument("public");
  const container = createElement("DIV", document);

  assertPublicHydrateRootUnsupported(ReactDOMClient, {
    entrypoint: "react-dom/client",
    length: 0,
    name: "hydrateRoot"
  });
  assertPublicHydrateRootUnsupported(ReactDOMProfiling, {
    entrypoint: "react-dom/profiling",
    length: 3,
    name: ""
  });
  assert.deepEqual(rootMarkers.inspectContainerRootMarker(container), {
    inspectable: true,
    nullCount: 0,
    properties: [],
    propertyCount: 0,
    truthyCount: 0
  });
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);

  function assertPublicHydrateRootUnsupported(
    moduleExports,
    { entrypoint, length, name }
  ) {
    const fn = moduleExports.hydrateRoot;
    assert.equal(typeof fn, "function", entrypoint);
    assert.equal(fn.name, name, entrypoint);
    assert.equal(fn.length, length, entrypoint);
    assert.throws(
      () => fn(container, "child"),
      (error) => {
        assert.equal(error.name, "FastReactDomUnimplementedError", entrypoint);
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED", entrypoint);
        assert.equal(error.entrypoint, entrypoint, entrypoint);
        assert.equal(error.exportName, "hydrateRoot", entrypoint);
        assert.equal(error.compatibilityTarget, "react-dom@19.2.6", entrypoint);
        return true;
      }
    );
  }
});

function assertHydrationMarkerReplayQueueDiagnostics(record, expected) {
  const diagnostics = record.replayQueueDiagnostics;
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    "FastReactDomHydrationMarkerReplayQueueDiagnostics"
  );
  assert.equal(
    diagnostics.status,
    "blocked-before-hydration-marker-replay-queues"
  );
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(
    diagnostics.rootBridgeStateSource,
    "private-root-marker-and-listener-guards"
  );
  assert.equal(diagnostics.rootMarkerState.sourceGuardAccepted, true);
  assert.equal(
    diagnostics.rootMarkerState.rootMarkerSnapshot,
    record.markerGuard.rootMarkerSnapshot
  );
  assert.equal(
    diagnostics.rootMarkerState.isContainerMarkedAsRoot,
    expected.isContainerMarkedAsRoot
  );
  assert.equal(
    diagnostics.rootMarkerState.rootMarkerPropertyCount,
    expected.rootMarkerPropertyCount
  );
  assert.equal(
    diagnostics.rootMarkerState.rootMarkerTruthyCount,
    expected.rootMarkerTruthyCount
  );
  assert.equal(diagnostics.rootMarkerState.warningType, expected.warningType);
  assert.equal(diagnostics.rootListenerState.sourceGuardAccepted, true);
  assert.equal(
    diagnostics.rootListenerState.rootEventTargetInfo,
    record.listenerGuard.rootEventTargetInfo
  );
  assert.equal(
    diagnostics.rootListenerState.ownerDocumentInfo,
    record.listenerGuard.ownerDocumentInfo
  );
  assert.equal(
    diagnostics.rootListenerState.hasRootListeningMarker,
    expected.hasRootListeningMarker
  );
  assert.equal(
    diagnostics.rootListenerState.ownerDocumentHasSelectionChangeMarker,
    expected.ownerDocumentHasSelectionChangeMarker
  );
  assert.equal(diagnostics.markerParserEvidenceAccepted, true);
  assert.equal(diagnostics.acceptedMarkerCount, expected.acceptedMarkerCount);
  assert.equal(
    diagnostics.markerReplayTargetCandidateCount,
    expected.markerReplayTargetCandidateCount
  );
  assert.deepEqual(diagnostics.markerReplayTargetCandidates, [
    {
      area: "Suspense boundary",
      blockedReason: pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE,
      contractId: "suspense-completed-start",
      kind: "comment",
      path: "container.childNodes[0]",
      queued: false,
      queueEligible: false,
      replayTargetKind: "suspense-boundary"
    }
  ]);
  assert.equal(
    diagnostics.queueContractCount,
    hydrationGate.hydrationMarkerReplayQueueContracts.length
  );
  assert.equal(
    diagnostics.queueContracts,
    hydrationGate.hydrationMarkerReplayQueueContracts
  );
  assert.deepEqual(
    diagnostics.queueContracts.map((queue) => queue.queueName),
    [
      "queuedExplicitHydrationTargets",
      "queuedFocus",
      "queuedDrag",
      "queuedMouse",
      "queuedPointers",
      "queuedPointerCaptures",
      "queuedChangeEventTargets",
      "$$reactFormReplay"
    ]
  );
  assert.equal(diagnostics.queueMutationAllowed, false);
  assert.equal(diagnostics.hydrationReplaySupported, false);
  assert.equal(diagnostics.eventsReplayed, false);
  assert.equal(diagnostics.hasScheduledReplayAttempt, false);
  assert.equal(diagnostics.queuedExplicitHydrationTargetCount, 0);
  assert.equal(diagnostics.queuedContinuousEventCount, 0);
  assert.equal(diagnostics.queuedDiscreteEventCount, 0);
  assert.equal(diagnostics.queuedFormActionCount, 0);
  assert.equal(
    diagnostics.replayQueueBlockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
}

function createUnsupportedRecordScenario(label) {
  const document = createDocument(label);
  const container = createElement("DIV", document);
  container.childNodes = [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ];

  const initialChildren = {
    props: {
      children: "hello"
    },
    type: "App"
  };
  const hydrationOptions = {
    identifierPrefix: "fast-",
    onHydrated() {},
    onRecoverableError() {},
    unstable_strictMode: true
  };
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle,
    recordIdPrefix: "hydration-gate"
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );

  return {
    container,
    document,
    hydrationOptions,
    initialChildren,
    record
  };
}

function createRootBridgeHydrateRootScenario(label) {
  const document = createDocument(label);
  const container = createElement("DIV", document);
  container.childNodes = [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ];

  rootMarkers.markContainerAsRoot(
    Object.freeze({
      rootId: `${label}:existing-root`
    }),
    container
  );
  listenerRegistry.markTargetAsListening(container);

  const initialChildren = {
    props: {
      children: "hello"
    },
    type: "App"
  };
  const hydrationOptions = {
    identifierPrefix: `${label}-`
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: "hydrate-root",
    hydrationRecordIdPrefix: "hydrate-boundary",
    markerOracle: oracle,
    markerOptions: {
      development: true
    },
    requestIdPrefix: "hydrate-request"
  });
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

function createAcceptedHydrationMarkerFixture(label) {
  const document = createDocument(label);
  const container = createElement("DIV", document);
  const prefix = `${label}-`;
  container.childNodes = [
    createComment("&"),
    createComment("/&"),
    createComment("$"),
    createComment("$?"),
    createTemplate({ id: `${prefix}B:1a` }),
    createComment("$~"),
    createTemplate({ id: `${prefix}B:2b` }),
    createComment("$!"),
    createTemplate({
      "data-cstck": "component-stack",
      "data-dgst": "digest",
      "data-msg": "message",
      "data-stck": "stack"
    }),
    createComment("/$"),
    createComment("F!"),
    createComment("F"),
    createComment("html"),
    createComment("head"),
    createComment("body"),
    createTemplate({ id: `${prefix}P:3c` }),
    createTemplate({
      "data-pid": `${prefix}P:3c`,
      "data-rsi": "",
      "data-sid": `${prefix}S:4d`
    }),
    createTemplate({
      "data-bid": `${prefix}B:1a`,
      "data-rci": "",
      "data-sid": `${prefix}S:4d`
    }),
    createTemplate({
      "data-bid": `${prefix}B:1a`,
      "data-rri": "",
      "data-sid": `${prefix}S:4d`,
      "data-sty": "[\"main\"]"
    }),
    createTemplate({
      "data-bid": `${prefix}B:1a`,
      "data-cstck": "component-stack",
      "data-dgst": "digest",
      "data-msg": "message",
      "data-rxi": "",
      "data-stck": "stack"
    })
  ];
  for (const node of container.childNodes) {
    if (node.attributes) {
      Object.freeze(node.attributes);
    }
    Object.freeze(node);
  }
  Object.freeze(container.childNodes);
  Object.freeze(container);

  return {
    container,
    document,
    contractIds: oracle.markerContracts.map((contract) => contract.id)
  };
}

function createComment(data) {
  return {
    data,
    nodeType: domContainer.COMMENT_NODE
  };
}

function createTemplate(attributes) {
  return {
    attributes,
    childNodes: [],
    nodeName: "TEMPLATE",
    nodeType: domContainer.ELEMENT_NODE,
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name)
        ? attributes[name]
        : null;
    }
  };
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createEventTarget({ label: `${label}-window` });
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
