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
const eventListener = require(
  path.join(repoRoot, "packages/react-dom/src/events/react-dom-event-listener.js")
);
const eventSystemFlags = require(
  path.join(repoRoot, "packages/react-dom/src/events/event-system-flags.js")
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

test("private hydration replay event queue diagnostic records blocked target order", () => {
  const { container, document, record } =
    createUnsupportedRecordScenario("event-order");
  const hoverTarget = createElement("BUTTON", document);
  hoverTarget.parentNode = container;
  const clickTarget = createElement("INPUT", document);
  clickTarget.parentNode = container;
  const hoverWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "mouseover",
      0
    );
  const clickWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "click",
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const hoverRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      hoverWrapper,
      createNativeEvent("mouseover", hoverTarget)
    );
  const clickRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      clickWrapper,
      createNativeEvent("click", clickTarget)
    );
  const diagnostics =
    pluginEventSystem.createHydrationReplayEventQueueDiagnostic(
      [hoverRecord, clickRecord],
      {
        markerReplayTargetCandidates:
          record.replayQueueDiagnostics.markerReplayTargetCandidates,
        source: "conformance-hydration-boundary-gate"
      }
    );

  assertHydrationReplayEventQueueDiagnostics(record.eventReplayQueueDiagnostics, {
    blockedEventReplayTargetCount: 0,
    markerReplayTargetCandidateCount: 1,
    status: "blocked-no-event-replay-targets-recorded"
  });
  assert.equal(
    record.eventReplayBlockers.eventReplayQueueDiagnostics,
    record.eventReplayQueueDiagnostics
  );
  assert.equal(record.eventReplayBlockers.eventReplayQueueDiagnosticsAccepted, true);
  assert.equal(record.eventReplayBlockers.blockedEventReplayTargetCount, 0);

  assertHydrationReplayEventQueueDiagnostics(diagnostics, {
    blockedEventReplayTargetCount: 2,
    markerReplayTargetCandidateCount: 1,
    status: "blocked-event-replay-targets-recorded"
  });
  assert.deepEqual(
    diagnostics.eventQueueOrder.map((entry) => [
      entry.inputOrder,
      entry.domEventName,
      entry.queueName,
      entry.targetResolutionStatus
    ]),
    [
      [0, "mouseover", "queuedMouse", "blocked"],
      [1, "click", "discrete-hydration-replay-attempt", "blocked"]
    ]
  );
  assert.deepEqual(
    diagnostics.priorityQueueOrder.map((entry) => [
      entry.priorityOrder,
      entry.domEventName,
      entry.prioritySortKey
    ]),
    [
      [0, "click", 2],
      [1, "mouseover", 8]
    ]
  );
  assert.deepEqual(
    diagnostics.blockedEventReplayTargets.map((entry) => ({
      domEventName: entry.domEventName,
      nativeEventTargetInfo: entry.nativeEventTargetInfo,
      queueCategory: entry.queueCategory,
      queueName: entry.queueName,
      queued: entry.queued,
      targetInstStatus: entry.targetInstStatus,
      targetResolutionStatus: entry.targetResolutionStatus,
      willHydrate: entry.willHydrate,
      willReplay: entry.willReplay
    })),
    [
      {
        domEventName: "mouseover",
        nativeEventTargetInfo: {
          kind: "object",
          nodeName: "BUTTON",
          nodeType: domContainer.ELEMENT_NODE
        },
        queueCategory: "continuous-event",
        queueName: "queuedMouse",
        queued: false,
        targetInstStatus: "not-resolved",
        targetResolutionStatus: "blocked",
        willHydrate: false,
        willReplay: false
      },
      {
        domEventName: "click",
        nativeEventTargetInfo: {
          kind: "object",
          nodeName: "INPUT",
          nodeType: domContainer.ELEMENT_NODE
        },
        queueCategory: "discrete-event",
        queueName: "discrete-hydration-replay-attempt",
        queued: false,
        targetInstStatus: "not-resolved",
        targetResolutionStatus: "blocked",
        willHydrate: false,
        willReplay: false
      }
    ]
  );
  assert.equal(hoverRecord.hydrationReplay.queued, false);
  assert.equal(clickRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test("private hydration target-resolution gate records dehydrated ownership without queue drains", () => {
  const document = createDocument("target-resolution");
  const container = createElement("DIV", document);
  const buttonTarget = createElement("BUTTON", document);
  buttonTarget.parentNode = container;
  container.childNodes = [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    buttonTarget,
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ];
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle,
    recordIdPrefix: "hydration-target"
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    { props: { children: "button" }, type: "App" },
    { identifierPrefix: "target-resolution-" }
  );
  const wrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "click",
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      wrapper,
      createNativeEvent("click", buttonTarget)
    );
  const targetResolutionDiagnostics =
    pluginEventSystem.createHydrationDehydratedTargetResolutionDiagnostic(
      dispatchRecord,
      {
        dehydratedTargetResolution: record.targetResolutionDiagnostics,
        source: "conformance-hydration-target-resolution"
      }
    );
  const replayDiagnostics =
    pluginEventSystem.createHydrationReplayEventQueueDiagnostic(
      dispatchRecord,
      {
        dehydratedTargetResolution: record.targetResolutionDiagnostics,
        markerReplayTargetCandidates:
          record.replayQueueDiagnostics.markerReplayTargetCandidates,
        source: "conformance-hydration-target-resolution"
      }
    );

  assertHydrationDehydratedTargetResolutionDiagnostics(
    record.targetResolutionDiagnostics,
    {
      boundaryOwnerCount: 1,
      lookupCount: 0,
      rootRecordId: "hydration-target:1",
      status: "blocked-no-hydratable-event-targets-recorded"
    }
  );
  assertHydrationDehydratedTargetResolutionDiagnostics(
    targetResolutionDiagnostics,
    {
      boundaryOwnerCount: 1,
      lookupCount: 1,
      rootRecordId: "hydration-target:1",
      status: "blocked-hydratable-event-targets-recorded"
    }
  );
  const lookup =
    targetResolutionDiagnostics.hydratableEventTargetLookups[0];
  assert.deepEqual(
    {
      blockedOnKind: lookup.blockedOnKind,
      blockedOnStatus: lookup.blockedOnStatus,
      dehydratedBoundaryOwnerId: lookup.dehydratedBoundaryOwnerId,
      queueName: lookup.queueName,
      rootOwnershipStatus: lookup.rootOwnershipStatus,
      status: lookup.status,
      targetContainerMatchesRoot: lookup.targetContainerMatchesRoot,
      targetPath: lookup.targetPath,
      targetPathStatus: lookup.targetPathStatus,
      willDrainReplayQueues: lookup.willDrainReplayQueues,
      willHydrate: lookup.willHydrate,
      willReplay: lookup.willReplay
    },
    {
      blockedOnKind: "suspense-boundary",
      blockedOnStatus: "blocked-on-dehydrated-boundary",
      dehydratedBoundaryOwnerId: "hydration-target:1:boundary:0",
      queueName: "discrete-hydration-replay-attempt",
      rootOwnershipStatus: "owned-by-dehydrated-root",
      status: "blocked-on-dehydrated-boundary",
      targetContainerMatchesRoot: true,
      targetPath: "container.childNodes[1]",
      targetPathStatus: "found-in-container-child-list",
      willDrainReplayQueues: false,
      willHydrate: false,
      willReplay: false
    }
  );
  assert.equal(
    lookup.dehydratedBoundaryOwner.contractId,
    "suspense-completed-start"
  );
  assert.equal(
    record.eventReplayBlockers.targetResolutionDiagnostics,
    record.targetResolutionDiagnostics
  );
  assert.equal(replayDiagnostics.targetResolutionDiagnosticsAccepted, true);
  assert.equal(replayDiagnostics.hydratableEventTargetLookupCount, 1);
  assert.equal(
    replayDiagnostics.dehydratedTargetResolutionDiagnostics
      .hydratableEventTargetLookups[0].targetPath,
    "container.childNodes[1]"
  );
  assert.equal(replayDiagnostics.queuedEventReplayTargetCount, 0);
  assert.equal(replayDiagnostics.replayedEventCount, 0);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test("private hydration replay queue drain-order diagnostic sorts blocked targets by dehydrated metadata", () => {
  const document = createDocument("drain-order");
  const container = createElement("DIV", document);
  const firstBoundaryTarget = createElement("BUTTON", document);
  const rootTarget = createElement("INPUT", document);
  const secondBoundaryTarget = createElement("A", document);
  firstBoundaryTarget.parentNode = container;
  rootTarget.parentNode = container;
  secondBoundaryTarget.parentNode = container;
  container.childNodes = [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    firstBoundaryTarget,
    { data: "/$", nodeType: domContainer.COMMENT_NODE },
    rootTarget,
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    secondBoundaryTarget,
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ];
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle,
    recordIdPrefix: "hydration-drain"
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    { props: { children: "drain" }, type: "App" },
    { identifierPrefix: "drain-order-" }
  );
  const secondBoundaryWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "mouseover",
      0
    );
  const rootWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "change",
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const firstBoundaryWrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      "click",
      eventSystemFlags.IS_CAPTURE_PHASE
    );
  const secondBoundaryRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      secondBoundaryWrapper,
      createNativeEvent("mouseover", secondBoundaryTarget)
    );
  const rootRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      rootWrapper,
      createNativeEvent("change", rootTarget)
    );
  const firstBoundaryRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      firstBoundaryWrapper,
      createNativeEvent("click", firstBoundaryTarget)
    );
  const diagnostics =
    pluginEventSystem.createHydrationReplayEventQueueDiagnostic(
      [secondBoundaryRecord, rootRecord, firstBoundaryRecord],
      {
        dehydratedTargetResolution: record.targetResolutionDiagnostics,
        markerReplayTargetCandidates:
          record.replayQueueDiagnostics.markerReplayTargetCandidates,
        source: "conformance-hydration-drain-order"
      }
    );

  assertHydrationReplayEventQueueDiagnostics(diagnostics, {
    blockedEventReplayTargetCount: 3,
    markerReplayTargetCandidateCount: 2,
    status: "blocked-event-replay-targets-recorded"
  });
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.kind,
    pluginEventSystem.HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.orderSource,
    "dehydrated-target-root-metadata"
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.status,
    "blocked-replay-queue-drain-order-recorded"
  );
  assert.equal(diagnostics.drainOrderDiagnosticsAccepted, true);
  assert.equal(
    diagnostics.drainOrder,
    diagnostics.replayQueueDrainOrderDiagnostics.drainOrder
  );
  assert.deepEqual(
    diagnostics.drainOrder.map((entry) => [
      entry.drainOrder,
      entry.inputOrder,
      entry.domEventName,
      entry.queueName,
      entry.targetPath,
      entry.blockedOnStatus,
      entry.blockedOnKind,
      entry.dehydratedBoundaryOwnerId,
      entry.targetPathSortKey,
      entry.willDrainReplayQueues,
      entry.willReplay
    ]),
    [
      [
        0,
        2,
        "click",
        "discrete-hydration-replay-attempt",
        "container.childNodes[1]",
        "blocked-on-dehydrated-boundary",
        "suspense-boundary",
        "hydration-drain:1:boundary:0",
        "00000001",
        false,
        false
      ],
      [
        1,
        1,
        "change",
        "queuedChangeEventTargets",
        "container.childNodes[3]",
        "blocked-on-dehydrated-root",
        "dehydrated-root",
        null,
        "00000003",
        false,
        false
      ],
      [
        2,
        0,
        "mouseover",
        "queuedMouse",
        "container.childNodes[5]",
        "blocked-on-dehydrated-boundary",
        "suspense-boundary",
        "hydration-drain:1:boundary:1",
        "00000005",
        false,
        false
      ]
    ]
  );
  assert.deepEqual(
    diagnostics.blockedEventReplayTargets.map((entry) => [
      entry.inputOrder,
      entry.targetPath,
      entry.blockedOnStatus,
      entry.dehydratedBoundaryOwnerId,
      entry.replayQueueDrained,
      entry.willDrainReplayQueues,
      entry.willReplay
    ]),
    [
      [
        0,
        "container.childNodes[5]",
        "blocked-on-dehydrated-boundary",
        "hydration-drain:1:boundary:1",
        false,
        false,
        false
      ],
      [
        1,
        "container.childNodes[3]",
        "blocked-on-dehydrated-root",
        null,
        false,
        false,
        false
      ],
      [
        2,
        "container.childNodes[1]",
        "blocked-on-dehydrated-boundary",
        "hydration-drain:1:boundary:0",
        false,
        false,
        false
      ]
    ]
  );
  assert.equal(secondBoundaryRecord.hydrationReplay.queued, false);
  assert.equal(rootRecord.hydrationReplay.queued, false);
  assert.equal(firstBoundaryRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
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

function assertHydrationReplayEventQueueDiagnostics(diagnostics, expected) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    pluginEventSystem.HYDRATION_REPLAY_EVENT_QUEUE_DIAGNOSTIC_KIND
  );
  assert.equal(diagnostics.status, expected.status);
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.browserDomEventCompatibilityClaimed, false);
  assert.equal(diagnostics.publicRootBehaviorChanged, false);
  assert.equal(diagnostics.eventReplayInstalled, false);
  assert.equal(diagnostics.eventReplaySupported, false);
  assert.equal(diagnostics.hydrationReplaySupported, false);
  assert.equal(diagnostics.hostInstanceHydrationAttempted, false);
  assert.equal(diagnostics.hasScheduledReplayAttempt, false);
  assert.equal(diagnostics.queueMutationAllowed, false);
  assert.equal(diagnostics.replayQueuesDrained, false);
  assert.equal(diagnostics.willDrainReplayQueues, false);
  assert.equal(diagnostics.eventsReplayed, false);
  assert.equal(diagnostics.willDispatchEvents, false);
  assert.equal(diagnostics.willHydrateHostInstances, false);
  assert.equal(
    diagnostics.blockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventTargetResolutionBlockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.markerReplayTargetCandidateCount,
    expected.markerReplayTargetCandidateCount
  );
  assert.equal(
    diagnostics.blockedEventReplayTargetCount,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.eventDispatchRecordCount,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(diagnostics.queuedEventReplayTargetCount, 0);
  assert.equal(diagnostics.replayedEventCount, 0);
  assert.equal(diagnostics.drainOrderDiagnosticsAccepted, true);
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.kind,
    pluginEventSystem.HYDRATION_REPLAY_QUEUE_DRAIN_ORDER_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.status,
    expected.blockedEventReplayTargetCount === 0
      ? "blocked-no-replay-queue-drain-order-targets-recorded"
      : "blocked-replay-queue-drain-order-recorded"
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.replayQueuesDrained,
    false
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.willDrainReplayQueues,
    false
  );
  assert.equal(
    diagnostics.replayQueueDrainOrderDiagnostics.eventsReplayed,
    false
  );
  assert.equal(
    diagnostics.drainOrderCount,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.drainOrder.length,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.blockedEventReplayTargets.length,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.eventQueueOrder.length,
    expected.blockedEventReplayTargetCount
  );
  assert.equal(
    diagnostics.priorityQueueOrder.length,
    expected.blockedEventReplayTargetCount
  );
}

function assertHydrationDehydratedTargetResolutionDiagnostics(
  diagnostics,
  expected
) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    pluginEventSystem.HYDRATION_DEHYDRATED_TARGET_RESOLUTION_DIAGNOSTIC_KIND
  );
  assert.equal(diagnostics.status, expected.status);
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.browserDomEventCompatibilityClaimed, false);
  assert.equal(diagnostics.publicRootBehaviorChanged, false);
  assert.equal(diagnostics.eventTargetResolutionSupported, false);
  assert.equal(diagnostics.hydrationReplaySupported, false);
  assert.equal(diagnostics.eventReplaySupported, false);
  assert.equal(diagnostics.queueMutationAllowed, false);
  assert.equal(diagnostics.replayQueuesDrained, false);
  assert.equal(diagnostics.willDrainReplayQueues, false);
  assert.equal(diagnostics.eventsReplayed, false);
  assert.equal(diagnostics.willDispatchEvents, false);
  assert.equal(diagnostics.willHydrateHostInstances, false);
  assert.equal(
    diagnostics.blockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.hydrationReplayBlockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(
    diagnostics.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(diagnostics.rootRecordId, expected.rootRecordId);
  assert.equal(
    diagnostics.rootKind,
    hydrationGate.UNSUPPORTED_HYDRATION_ROOT_KIND
  );
  assert.equal(diagnostics.rootTag, hydrationGate.CONCURRENT_ROOT_TAG);
  assert.equal(
    diagnostics.dehydratedRootOwner.kind,
    pluginEventSystem.HYDRATION_DEHYDRATED_ROOT_OWNER_RECORD_KIND
  );
  assert.equal(
    diagnostics.dehydratedRootOwner.status,
    "recorded-unsupported-dehydrated-root-owner"
  );
  assert.equal(diagnostics.dehydratedRootOwner.dehydrated, true);
  assert.equal(diagnostics.dehydratedRootOwner.unsupported, true);
  assert.equal(diagnostics.dehydratedRootOwner.canHydrate, false);
  assert.equal(diagnostics.dehydratedRootOwner.targetResolutionSupported, false);
  assert.equal(
    diagnostics.dehydratedRootOwnerStatus,
    "recorded-unsupported-dehydrated-root-owner"
  );
  assert.equal(
    diagnostics.markerReplayTargetCandidateCount,
    expected.boundaryOwnerCount
  );
  assert.equal(
    diagnostics.dehydratedBoundaryOwnerCount,
    expected.boundaryOwnerCount
  );
  assert.equal(
    diagnostics.dehydratedBoundaryOwners.length,
    expected.boundaryOwnerCount
  );
  for (const owner of diagnostics.dehydratedBoundaryOwners) {
    assert.equal(
      owner.kind,
      pluginEventSystem.HYDRATION_DEHYDRATED_BOUNDARY_OWNER_RECORD_KIND
    );
    assert.equal(
      owner.status,
      "recorded-marker-derived-dehydrated-boundary-owner"
    );
    assert.equal(owner.dehydrated, true);
    assert.equal(owner.rootOwned, true);
    assert.equal(owner.canHydrate, false);
    assert.equal(owner.queued, false);
    assert.equal(owner.queueEligible, false);
  }
  assert.equal(
    diagnostics.eventDispatchRecordCount,
    expected.lookupCount
  );
  assert.equal(
    diagnostics.hydratableEventTargetLookupCount,
    expected.lookupCount
  );
  assert.equal(
    diagnostics.hydratableEventTargetLookups.length,
    expected.lookupCount
  );
  assert.equal(diagnostics.queuedEventReplayTargetCount, 0);
  assert.equal(diagnostics.replayedEventCount, 0);
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

function createNativeEvent(type, target) {
  return {
    target,
    type
  };
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
