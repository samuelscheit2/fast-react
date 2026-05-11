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
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      record,
      [secondBoundaryRecord, rootRecord, firstBoundaryRecord],
      {
        source: "conformance-hydration-ownership-gate"
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
  assertHydrationReplayOwnershipGateDiagnostics(ownershipDiagnostics, {
    dehydratedBoundaryOwnershipRequiredCount: 2,
    dehydratedBoundaryOwnershipRetainedCount: 2,
    ownershipRetainedCount: 3,
    ownershipRowCount: 3,
    rootOwnershipRetainedCount: 3,
    rootRecordId: "hydration-drain:1",
    status: "blocked-replay-ownership-retained-through-drain-order"
  });
  assert.deepEqual(
    ownershipDiagnostics.eventReplayQueueDiagnostics.drainOrder,
    diagnostics.drainOrder
  );
  assert.deepEqual(
    ownershipDiagnostics.ownershipRows.map((entry) => [
      entry.drainOrder,
      entry.inputOrder,
      entry.domEventName,
      entry.queueName,
      entry.eventQueueRootOwnershipStatus,
      entry.drainOrderRootOwnershipStatus,
      entry.rootOwnershipRetained,
      entry.dehydratedBoundaryOwnershipRequired,
      entry.eventQueueDehydratedBoundaryOwnerId,
      entry.drainOrderDehydratedBoundaryOwnerId,
      entry.dehydratedBoundaryOwnershipRetained,
      entry.dehydratedBoundaryOwnershipStatus,
      entry.eventQueueTargetPath,
      entry.drainOrderTargetPath,
      entry.targetPathRetained,
      entry.queueIdentityRetained,
      entry.blockedOwnerRetained,
      entry.ownershipRetainedThroughDrainOrder,
      entry.replayQueueDrained,
      entry.willDrainReplayQueues,
      entry.willReplay
    ]),
    [
      [
        0,
        2,
        "click",
        "discrete-hydration-replay-attempt",
        "owned-by-dehydrated-root",
        "owned-by-dehydrated-root",
        true,
        true,
        "hydration-drain:1:boundary:0",
        "hydration-drain:1:boundary:0",
        true,
        "retained-dehydrated-boundary-owner",
        "container.childNodes[1]",
        "container.childNodes[1]",
        true,
        true,
        true,
        true,
        false,
        false,
        false
      ],
      [
        1,
        1,
        "change",
        "queuedChangeEventTargets",
        "owned-by-dehydrated-root",
        "owned-by-dehydrated-root",
        true,
        false,
        null,
        null,
        null,
        "not-applicable-blocked-on-dehydrated-root",
        "container.childNodes[3]",
        "container.childNodes[3]",
        true,
        true,
        true,
        true,
        false,
        false,
        false
      ],
      [
        2,
        0,
        "mouseover",
        "queuedMouse",
        "owned-by-dehydrated-root",
        "owned-by-dehydrated-root",
        true,
        true,
        "hydration-drain:1:boundary:1",
        "hydration-drain:1:boundary:1",
        true,
        "retained-dehydrated-boundary-owner",
        "container.childNodes[5]",
        "container.childNodes[5]",
        true,
        true,
        true,
        true,
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

test("private hydration target claim links to one blocked replay target-dispatch execution", () => {
  let recoverableErrorCalls = 0;
  const document = createDocument("claim-execution");
  const container = createElement("DIV", document);
  const target = createElement("BUTTON", document);
  target.parentNode = container;
  container.childNodes = [
    createComment("$"),
    target,
    createComment("/$")
  ];
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle,
    recordIdPrefix: "hydration-claim-execution"
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    { props: { children: "claim execution" }, type: "App" },
    {
      identifierPrefix: "claim-execution-",
      onRecoverableError() {
        recoverableErrorCalls++;
      }
    }
  );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        "click",
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent("click", target)
    );
  const targetDispatchLink =
    hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
      record,
      dispatchRecord,
      {
        source: "conformance-hydration-claim-execution-link"
      }
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      record,
      dispatchRecord,
      {
        source: "conformance-hydration-claim-execution-ownership"
      }
    );
  const claim = hydrationGate.createHydrationTargetClaimingDiagnostic(
    record,
    ownershipDiagnostics,
    targetDispatchLink,
    {
      source: "conformance-hydration-claim-execution-claim"
    }
  );
  const execution =
    hydrationGate.createHydrationClaimedReplayTargetDispatchExecutionRecord(
      claim,
      targetDispatchLink,
      {
        source: "conformance-hydration-claim-execution"
      }
    );

  assert.equal(
    execution.kind,
    hydrationGate
      .HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_RECORD_KIND
  );
  assert.equal(
    execution.status,
    hydrationGate.privateHydrationClaimedReplayTargetDispatchExecutionStatus
  );
  assert.equal(execution.targetClaimingDiagnostic, claim);
  assert.equal(execution.targetDispatchLinkDiagnostic, targetDispatchLink);
  assert.equal(execution.dispatchRecord, dispatchRecord);
  assert.equal(execution.executionRecordCount, 1);
  assert.equal(execution.blockedReplayTargetDispatchExecutionCount, 1);
  assert.equal(execution.replayTargetDispatchExecutionRecorded, true);
  assert.equal(execution.replayTargetDispatchExecutionBlocked, true);
  assert.equal(execution.targetDispatchExecuted, false);
  assert.equal(execution.eventDispatch, false);
  assert.equal(execution.publicDispatchEnabled, false);
  assert.equal(execution.eventsReplayed, false);
  assert.equal(execution.willDispatch, false);
  assert.equal(execution.willHydrate, false);
  assert.equal(execution.willReplay, false);
  assert.equal(execution.targetClaimExecuted, false);
  assert.equal(execution.publicHydrationTargetClaimed, false);
  assert.equal(execution.publicHydrateRootSupported, false);
  assert.equal(execution.compatibilityClaimed, false);
  assert.equal(
    execution.clickReplayDispatchDiagnosticKind,
    pluginEventSystem.HYDRATION_REPLAY_CLICK_DISPATCH_DIAGNOSTIC_KIND
  );
  assert.equal(
    execution.clickReplayDispatchDiagnosticStatus,
    pluginEventSystem.PRIVATE_HYDRATION_REPLAY_CLICK_DISPATCH_STATUS
  );
  assert.equal(execution.clickReplayDispatchDiagnosticRecorded, true);
  assert.equal(execution.clickReplayDispatchDiagnosticBlocked, true);
  assert.equal(execution.clickReplayDispatchQueueOrderPreserved, true);
  assert.equal(execution.blockedClickReplayDispatchDiagnosticCount, 1);
  assert.equal(
    execution.clickReplayDispatchDiagnostic.targetClaimingDiagnostic,
    claim
  );
  assert.equal(
    execution.clickReplayDispatchDiagnostic.targetClaimEvidenceAccepted,
    true
  );
  assert.equal(
    execution.clickReplayDispatchDiagnostic.targetDispatchLinkDiagnostic,
    targetDispatchLink
  );
  assert.equal(execution.clickReplayDispatchDiagnostic.dispatchRecord, dispatchRecord);
  assert.equal(execution.clickReplayDispatchDiagnostic.domEventName, "click");
  assert.equal(execution.clickReplayDispatchDiagnostic.queueOrderPreserved, true);
  assert.equal(
    execution.clickReplayDispatchDiagnostic.publicDispatchEnabled,
    false
  );
  assert.equal(
    execution.clickReplayDispatchDiagnostic.liveEventListenerInstalled,
    false
  );
  assert.equal(
    execution.clickReplayDispatchDiagnostic.eventReplayDispatchAttempted,
    false
  );
  assert.equal(
    execution.clickReplayDispatchDiagnostic.privateClickDelegationDispatchGateCalled,
    false
  );
  assert.equal(
    execution.clickReplayDispatchDiagnostic.listenerInvocationCount,
    0
  );
  assert.equal(
    execution.blockedReason,
    pluginEventSystem.HYDRATION_REPLAY_BLOCKED_CODE
  );
  assert.equal(
    execution.eventDispatchBlockedReason,
    pluginEventSystem.EVENT_DISPATCH_BLOCKED_CODE
  );
  assert.equal(
    execution.eventTargetResolutionBlockedReason,
    pluginEventSystem.EVENT_TARGET_RESOLUTION_BLOCKED_CODE
  );
  assert.deepEqual(
    [
      execution.inputOrder,
      execution.domEventName,
      execution.queueName,
      execution.targetPath,
      execution.ownerBoundaryKind,
      execution.dehydratedBoundaryOwnerId,
      execution.targetDispatchPathStatus
    ],
    [
      0,
      "click",
      "discrete-hydration-replay-attempt",
      "container.childNodes[1]",
      "suspense-boundary",
      "hydration-claim-execution:1:boundary:0",
      "no-mounted-host-instance"
    ]
  );
  assert.equal(execution.recoverableErrorMetadata, record.recoverableErrorMetadata);
  assert.equal(execution.recoverableErrorRowCount, 1);
  assert.equal(execution.queuedRecoverableErrorCount, 0);
  assert.equal(execution.wouldQueueRecoverableErrorCount, 1);
  assert.equal(execution.recoverableErrorsQueued, false);
  assert.equal(execution.onRecoverableErrorConfigured, true);
  assert.equal(execution.onRecoverableErrorInvoked, false);
  assert.equal(execution.publicOnRecoverableErrorInvoked, false);
  assert.equal(recoverableErrorCalls, 0);
  assert.equal(
    execution.unsupportedHydrationPrerequisiteCount,
    hydrationGate.unsupportedHydrationPrerequisites.length
  );
  assert.equal(
    execution.hydrationEventReplayBlockerCount,
    hydrationGate.hydrationEventReplayBlockerContracts.length
  );

  const payload =
    hydrationGate
      .getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(
        execution
      );
  assert.equal(payload.hydrationBoundaryRecord, record);
  assert.equal(payload.targetClaimingDiagnostic, claim);
  assert.equal(payload.targetDispatchLinkDiagnostic, targetDispatchLink);
  assert.equal(payload.dispatchRecord, dispatchRecord);
  assert.equal(
    payload.clickReplayDispatchDiagnostic,
    execution.clickReplayDispatchDiagnostic
  );
  assert.equal(
    pluginEventSystem.getHydrationReplayClickDispatchDiagnosticPayload(
      execution.clickReplayDispatchDiagnostic
    ),
    payload.clickReplayDispatchDiagnosticPayload
  );
  assert.equal(
    rootBridge.getPrivateHydrationClaimedReplayTargetDispatchExecutionPayload(
      execution
    ),
    payload
  );
  assert.equal(
    rootBridge.isPrivateHydrationClaimedReplayTargetDispatchExecutionRecord(
      execution
    ),
    true
  );
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test("private hydration target claim accepts nested child path evidence read-only", () => {
  const document = createDocument("nested-claim");
  const container = createElement("DIV", document);
  const wrapper = createElement("SPAN", document);
  const target = createElement("BUTTON", document);
  target.parentNode = wrapper;
  wrapper.parentNode = container;
  wrapper.childNodes = [target];
  container.childNodes = [
    createComment("$"),
    wrapper,
    createComment("/$")
  ];
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle,
    recordIdPrefix: "hydration-nested-claim"
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    { props: { children: "nested claim" }, type: "App" },
    {
      identifierPrefix: "nested-claim-"
    }
  );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        "click",
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent("click", target)
    );
  const targetDispatchLink =
    hydrationGate.createHydrationReplayTargetDispatchLinkDiagnostic(
      record,
      dispatchRecord,
      {
        source: "conformance-hydration-nested-claim-link"
      }
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      record,
      dispatchRecord,
      {
        source: "conformance-hydration-nested-claim-ownership"
      }
    );
  const claim = hydrationGate.createHydrationTargetClaimingDiagnostic(
    record,
    ownershipDiagnostics,
    targetDispatchLink,
    {
      source: "conformance-hydration-nested-claim"
    }
  );

  assert.deepEqual(
    [
      claim.rootRecordId,
      claim.markerPath,
      claim.targetPath,
      claim.targetPathParentPath,
      claim.targetPathIndex,
      claim.targetPathRootIndex,
      claim.targetPathSegmentCount,
      claim.dehydratedBoundaryOwnerId,
      claim.ownerBoundaryKind
    ],
    [
      "hydration-nested-claim:1",
      "container.childNodes[0]",
      "container.childNodes[1].childNodes[0]",
      "container.childNodes[1]",
      0,
      1,
      2,
      "hydration-nested-claim:1:boundary:0",
      "suspense-boundary"
    ]
  );
  assert.deepEqual(claim.targetPathSegments, [1, 0]);
  assert.deepEqual(claim.targetPathMatchedPaths, [claim.targetPath]);
  assert.equal(claim.targetPathDeterministicallySelected, true);
  assert.equal(claim.targetPathResolvedToDispatchTarget, true);
  assert.equal(claim.targetPathUniqueInContainer, true);
  assert.equal(claim.targetPathParentChainRetained, true);
  assert.equal(claim.targetContainerMatchesBoundaryRecord, true);
  assert.equal(claim.hydratableLookupTargetPathRetained, true);
  assert.equal(claim.queueMutationAllowed, false);
  assert.equal(claim.replayQueuesDrained, false);
  assert.equal(claim.eventDispatch, false);
  assert.equal(claim.eventsReplayed, false);
  assert.equal(claim.publicHydrationTargetClaimed, false);
  assert.equal(claim.publicHydrationCompatibilityClaimed, false);
  assert.equal(claim.compatibilityClaimed, false);

  const payload =
    hydrationGate.getPrivateHydrationTargetClaimingDiagnosticPayload(claim);
  assert.equal(payload.hydrationBoundaryRecord, record);
  assert.equal(payload.targetPathResolution.node, target);
  assert.equal(payload.targetPathResolution.parentNode, wrapper);
  assert.equal(dispatchRecord.hydrationReplay.queued, false);
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

test("private hydration text mismatch gate records recoverable-error metadata without public hydration", () => {
  const document = createDocument("text-mismatch");
  const container = createElement("DIV", document);
  container.childNodes = [createText("server text")];
  let recoverableErrorCalls = 0;
  const initialChildren = {
    props: {
      children: ["client ", 42]
    },
    type: "App"
  };
  const hydrationOptions = {
    identifierPrefix: "text-mismatch-",
    onRecoverableError() {
      recoverableErrorCalls++;
    }
  };
  const gate = hydrationGate.createHydrationBoundaryGate({
    markerOracle: oracle,
    recordIdPrefix: "hydration-text"
  });
  const record = gate.recordUnsupportedHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: "hydrate-text",
    hydrationRecordIdPrefix: "hydrate-text-boundary",
    markerOracle: oracle,
    requestIdPrefix: "hydrate-text-request"
  });
  const bridgeRecord = bridge.createHydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const admission = bridge.admitRequest(bridgeRecord);

  assertHydrationTextMismatchDiagnostics(record.textMismatchDiagnostics, {
    actualTextRowCount: 1,
    expectedTextRowCount: 2,
    mismatchCount: 2,
    rootRecordId: "hydration-text:1"
  });
  assert.deepEqual(
    record.textMismatchDiagnostics.expectedTextRows.map((row) => [
      row.index,
      row.path,
      row.text,
      row.normalizedText
    ]),
    [
      [0, "initialChildren.props.children[0]", "client ", "client "],
      [1, "initialChildren.props.children[1]", "42", "42"]
    ]
  );
  assert.deepEqual(
    record.textMismatchDiagnostics.mismatchRows.map((row) => ({
      actualPath: row.actualPath,
      actualText: row.actualText,
      expectedPath: row.expectedPath,
      expectedText: row.expectedText,
      reason: row.reason,
      rowId: row.rowId,
      status: row.status,
      willPatchText: row.willPatchText
    })),
    [
      {
        actualPath: "container.childNodes[0]",
        actualText: "server text",
        expectedPath: "initialChildren.props.children[0]",
        expectedText: "client ",
        reason: "text-content-different",
        rowId: "hydration-text:1:text-mismatch:0",
        status: "blocked-before-hydrate-text-instance",
        willPatchText: false
      },
      {
        actualPath: null,
        actualText: null,
        expectedPath: "initialChildren.props.children[1]",
        expectedText: "42",
        reason: "missing-server-text",
        rowId: "hydration-text:1:text-mismatch:1",
        status: "blocked-before-hydrate-text-instance",
        willPatchText: false
      }
    ]
  );
  assertHydrationTextMismatchRecoverableMetadata(
    record.recoverableErrorMetadata,
    {
      callbackPresent: true,
      recoverableErrorMetadataCount: 2,
      rootRecordId: "hydration-text:1"
    }
  );
  assert.equal(
    record.textMismatchDiagnostics.recoverableErrorMetadata,
    record.recoverableErrorMetadata
  );
  assert.equal(
    bridgeRecord.textMismatchDiagnostics,
    bridgeRecord.hydrationBoundaryRecord.textMismatchDiagnostics
  );
  assert.equal(
    bridgeRecord.recoverableErrorMetadata,
    bridgeRecord.hydrationBoundaryRecord.recoverableErrorMetadata
  );
  assertHydrationTextMismatchDiagnostics(bridgeRecord.textMismatchDiagnostics, {
    actualTextRowCount: 1,
    expectedTextRowCount: 2,
    mismatchCount: 2,
    rootRecordId: "hydrate-text-boundary:1"
  });
  assert.equal(
    admission.textMismatchDiagnostics,
    bridgeRecord.textMismatchDiagnostics
  );
  assert.equal(
    admission.recoverableErrorMetadata,
    bridgeRecord.recoverableErrorMetadata
  );
  assert.equal(recoverableErrorCalls, 0);
  assert.equal(container.childNodes[0].nodeValue, "server text");
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test("private hydrateRoot recoverable-error preflight accepts metadata without invoking callbacks", () => {
  const document = createDocument("recoverable-preflight");
  const container = createElement("DIV", document);
  const callbackCalls = [];
  container.childNodes = [createText("server preflight")];

  function onRecoverableError(error) {
    callbackCalls.push(error.message);
  }

  const hydrationOptions = {
    identifierPrefix: "recoverable-preflight-",
    onRecoverableError
  };
  const record = hydrationGate
    .createHydrationBoundaryGate({
      markerOracle: oracle,
      recordIdPrefix: "recoverable-preflight"
    })
    .recordUnsupportedHydrateRoot(
      container,
      { props: { children: "client preflight" }, type: "App" },
      hydrationOptions
    );

  const preflight =
    hydrationGate
      .createHydrationTextMismatchRecoverableErrorPreflightRecord(
        record,
        record.acceptedPrivateMetadataDiagnostics,
        record.recoverableErrorMetadata,
        {
          enableRecoverableErrorPreflight: true,
          hydrationOptions,
          preflightId: "recoverable-preflight-record:1",
          preflightSequence: 1,
          source: "conformance-recoverable-error-preflight"
        }
      );

  assert.equal(
    hydrationGate
      .isPrivateHydrationTextMismatchRecoverableErrorPreflightRecord(
        preflight
      ),
    true
  );
  assert.equal(
    rootBridge
      .isPrivateHydrationTextMismatchRecoverableErrorPreflightRecord(
        preflight
      ),
    true
  );
  assert.equal(
    preflight.kind,
    hydrationGate
      .HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_RECORD_KIND
  );
  assert.equal(
    preflight.gateId,
    hydrationGate.privateHydrationTextMismatchRecoverableErrorPreflightGateId
  );
  assert.equal(
    preflight.preflightStatus,
    hydrationGate.privateHydrationTextMismatchRecoverableErrorPreflightStatus
  );
  assert.equal(preflight.preflightId, "recoverable-preflight-record:1");
  assert.equal(preflight.preflightSequence, 1);
  assert.equal(preflight.acceptedBoundaryMetadataConsumed, true);
  assert.equal(
    preflight.acceptedBoundaryMetadataDiagnostics,
    record.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    preflight.acceptedBoundaryMetadataRow.metadataId,
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingMetadataId
  );
  assert.equal(preflight.recoverableErrorMetadata, record.recoverableErrorMetadata);
  assert.equal(preflight.recoverableErrorMetadataAccepted, true);
  assert.equal(preflight.textMismatchRowCount, 1);
  assert.equal(preflight.recoverableErrorMetadataCount, 1);
  assert.equal(preflight.queuedRecoverableErrorCount, 0);
  assert.equal(preflight.wouldQueueRecoverableErrorCount, 1);
  assert.equal(preflight.recoverableErrorsQueued, false);
  assert.equal(preflight.willQueueRecoverableErrors, false);
  assert.equal(preflight.onRecoverableErrorConfigured, true);
  assert.equal(preflight.onRecoverableErrorInvoked, false);
  assert.equal(preflight.privateOnRecoverableErrorInvoked, false);
  assert.equal(preflight.publicOnRecoverableErrorInvoked, false);
  assert.equal(preflight.rootErrorCallbackInvocationCount, 0);
  assert.equal(preflight.publicHydrateRootSupported, false);
  assert.equal(preflight.publicHydrationCompatibilityClaimed, false);
  assert.equal(preflight.publicHydrationReplayCompatibilityClaimed, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.deepEqual(callbackCalls, []);

  const payload =
    hydrationGate
      .getPrivateHydrationTextMismatchRecoverableErrorPreflightPayload(
        preflight
      );
  assert.equal(payload.hydrationBoundaryRecord, record);
  assert.equal(payload.hydrationOptions, hydrationOptions);
  assert.equal(payload.recoverableErrorMetadata, record.recoverableErrorMetadata);
  assert.equal(payload.recoverableErrorRows.length, 1);

  assert.throws(
    () =>
      hydrationGate
        .createHydrationTextMismatchRecoverableErrorPreflightRecord(
          record,
          record.acceptedPrivateMetadataDiagnostics,
          Object.freeze({
            ...record.recoverableErrorMetadata
          }),
          {
            enableRecoverableErrorPreflight: true,
            hydrationOptions
          }
        ),
    {
      code:
        hydrationGate
          .INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_CODE,
      message: /must match/
    }
  );
  assert.throws(
    () =>
      hydrationGate
        .createHydrationTextMismatchRecoverableErrorPreflightRecord(
          record,
          record.acceptedPrivateMetadataDiagnostics,
          Object.freeze({
            ...record.recoverableErrorMetadata,
            recoverableErrorRows: Object.freeze(
              record.recoverableErrorMetadata.recoverableErrorRows.map(
                (row, index) =>
                  Object.freeze({
                    ...row,
                    queuedRecoverableError: index === 0
                  })
              )
            )
          }),
          {
            enableRecoverableErrorPreflight: true,
            hydrationOptions
          }
        ),
    {
      code:
        hydrationGate
          .INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_PREFLIGHT_CODE,
      message: /unqueued recoverable mismatch rows/
    }
  );
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
  assert.equal(container.childNodes[0].nodeValue, "server preflight");
});

test("private hydration text mismatch recoverable-error routing execution consumes accepted boundary metadata", () => {
  const document = createDocument("text-mismatch-recoverable-execution");
  const container = createElement("DIV", document);
  const callbackCalls = [];
  container.childNodes = [createText("server title")];

  function onRecoverableError(error, errorInfo) {
    callbackCalls.push({
      error,
      errorInfo,
      message: error.message,
      name: error.name
    });
  }

  const hydrationOptions = {
    identifierPrefix: "recoverable-execution-",
    onRecoverableError
  };
  const record = hydrationGate
    .createHydrationBoundaryGate({
      markerOracle: oracle,
      recordIdPrefix: "recoverable-execution"
    })
    .recordUnsupportedHydrateRoot(
      container,
      { props: { children: "client title" }, type: "App" },
      hydrationOptions
    );

  const execution =
    hydrationGate
      .createHydrationTextMismatchRecoverableErrorRoutingExecutionRecord(
        record,
        record.acceptedPrivateMetadataDiagnostics,
        {
          enableRecoverableErrorRoutingExecution: true,
          hydrationOptions,
          mismatchLabels: ["title"],
          source: "conformance-text-mismatch-recoverable-execution"
        }
      );

  assert.equal(
    hydrationGate
      .isPrivateHydrationTextMismatchRecoverableErrorRoutingExecutionRecord(
        execution
      ),
    true
  );
  assert.equal(
    execution.kind,
    hydrationGate
      .HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION_RECORD_KIND
  );
  assert.equal(
    execution.status,
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingExecutionStatus
  );
  assert.equal(execution.acceptedBoundaryMetadataConsumed, true);
  assert.equal(
    execution.acceptedBoundaryMetadataDiagnostics,
    record.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    execution.acceptedBoundaryMetadataId,
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingMetadataId
  );
  assert.equal(
    execution.acceptedBoundaryMetadataRow.gateId,
    hydrationGate
      .privateHydrationTextMismatchRecoverableErrorRoutingExecutionGateId
  );
  assert.equal(execution.recoverableErrorMetadata, record.recoverableErrorMetadata);
  assert.equal(execution.textMismatchRowCount, 1);
  assert.equal(execution.callbackInvocationRecordCount, 1);
  assert.equal(execution.callbackInvocationErrorCount, 0);
  assert.equal(execution.rootOptionCallbackConfigured, true);
  assert.equal(execution.privateOnRecoverableErrorInvoked, true);
  assert.equal(execution.onRecoverableErrorInvoked, true);
  assert.equal(execution.publicOnRecoverableErrorInvoked, false);
  assert.equal(execution.publicRootErrorCallbacksInvoked, false);
  assert.equal(execution.recoverableErrorsQueued, false);
  assert.equal(execution.hydration, false);
  assert.equal(execution.canHydrate, false);
  assert.equal(execution.domMutation, false);
  assert.equal(execution.eventReplayInstalled, false);
  assert.equal(execution.eventsReplayed, false);
  assert.equal(execution.publicHydrateRootSupported, false);
  assert.equal(execution.publicHydrationCompatibilityClaimed, false);
  assert.equal(execution.compatibilityClaimed, false);
  assert.deepEqual(
    execution.callbackInvocationRecords.map((entry) => [
      entry.phase,
      entry.sourceLabel,
      entry.textMismatchRowId,
      entry.expectedText,
      entry.actualText,
      entry.callbackReturnStatus,
      entry.onRecoverableErrorInvoked,
      entry.publicOnRecoverableErrorInvoked,
      entry.queuedRecoverableError
    ]),
    [
      [
        "hydration-text-mismatch-recoverable-error-routing-execution",
        "title",
        "recoverable-execution:1:text-mismatch:0",
        "client title",
        "server title",
        "returned-undefined",
        true,
        false,
        false
      ]
    ]
  );

  assert.equal(callbackCalls.length, 1);
  assert.equal(
    callbackCalls[0].message,
    "Hydration failed because the server rendered text did not match the client."
  );
  assert.equal(callbackCalls[0].name, "Error");
  assert.equal(callbackCalls[0].error instanceof Error, true);
  assert.deepEqual(callbackCalls[0].errorInfo, {
    componentStack: null
  });

  const payload =
    hydrationGate
      .getPrivateHydrationTextMismatchRecoverableErrorRoutingExecutionPayload(
        execution
      );
  assert.equal(payload.callback, onRecoverableError);
  assert.equal(payload.hydrationBoundaryRecord, record);
  assert.equal(payload.hydrationOptions, hydrationOptions);
  assert.equal(
    payload.acceptedBoundaryMetadataDiagnostics,
    record.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(payload.callbackInvocationResults[0].error, callbackCalls[0].error);
  assert.equal(
    payload.callbackInvocationResults[0].errorInfo,
    callbackCalls[0].errorInfo
  );
  assert.equal(container.childNodes[0].nodeValue, "server title");
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);

  assert.throws(
    () =>
      hydrationGate
        .createHydrationTextMismatchRecoverableErrorRoutingExecutionRecord(
          record,
          record.acceptedPrivateMetadataDiagnostics,
          {
            hydrationOptions
          }
        ),
    {
      code:
        hydrationGate
          .INVALID_HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_ROUTING_EXECUTION_CODE
    }
  );
});

test("private hydration replay error metadata connects ownership rows to root options", () => {
  const document = createDocument("replay-error-metadata");
  const container = createElement("DIV", document);
  const firstBoundaryTarget = createElement("BUTTON", document);
  const rootTarget = createElement("INPUT", document);
  const secondBoundaryTarget = createElement("A", document);
  const publicRootErrorCalls = [];
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

  function onUncaughtError(error) {
    publicRootErrorCalls.push(["uncaught", error.message]);
  }
  function onCaughtError(error) {
    publicRootErrorCalls.push(["caught", error.message]);
  }
  function onRecoverableError(error) {
    publicRootErrorCalls.push(["recoverable", error.message]);
  }

  const hydrationOptions = {
    identifierPrefix: "replay-error-",
    onCaughtError,
    onRecoverableError,
    onUncaughtError
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: "replay-error-hydrate",
    hydrationRecordIdPrefix: "replay-error-boundary",
    requestIdPrefix: "replay-error-request"
  });
  const hydrateRecord = bridge.createHydrateRoot(
    container,
    { props: { children: "replay error metadata" }, type: "App" },
    hydrationOptions
  );
  const secondBoundaryRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        "mouseover",
        0
      ),
      createNativeEvent("mouseover", secondBoundaryTarget)
    );
  const rootRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        "change",
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent("change", rootTarget)
    );
  const firstBoundaryRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        "click",
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent("click", firstBoundaryTarget)
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      hydrateRecord.hydrationBoundaryRecord,
      [secondBoundaryRecord, rootRecord, firstBoundaryRecord],
      {
        source: "conformance-hydration-replay-error-metadata"
      }
    );

  const metadata = bridge.createHydrationReplayErrorMetadata(
    hydrateRecord,
    ownershipDiagnostics,
    {
      replayTargetLabels: ["first-boundary", "root-target", "second-boundary"],
      source: "conformance-hydration-replay-error-metadata"
    }
  );

  assert.equal(
    rootBridge.isPrivateRootHydrationReplayErrorMetadataRecord(metadata),
    true
  );
  assert.equal(
    metadata.$$typeof,
    rootBridge.privateRootHydrationReplayErrorMetadataRecordType
  );
  assert.equal(
    metadata.metadataStatus,
    rootBridge.ROOT_BRIDGE_HYDRATION_REPLAY_ERROR_METADATA_RECORDED
  );
  assert.equal(metadata.hydrateId, "replay-error-hydrate:1");
  assert.equal(metadata.rootRecordId, "replay-error-boundary:1");
  assert.equal(metadata.ownershipRowCount, 3);
  assert.equal(metadata.rootOwnershipRetainedCount, 3);
  assert.equal(metadata.dehydratedBoundaryOwnershipRequiredCount, 2);
  assert.equal(metadata.dehydratedBoundaryOwnershipRetainedCount, 2);
  assert.equal(metadata.rootErrorOptionCallbackRecordCount, 3);
  assert.equal(metadata.onUncaughtErrorConfigured, true);
  assert.equal(metadata.onCaughtErrorConfigured, true);
  assert.equal(metadata.onRecoverableErrorConfigured, true);
  assert.equal(metadata.hydration, false);
  assert.equal(metadata.eventDispatch, false);
  assert.equal(metadata.eventsReplayed, false);
  assert.equal(metadata.publicRootErrorCallbacksInvoked, false);
  assert.equal(metadata.rootErrorCallbackInvocationCount, 0);
  assert.equal(metadata.reportGlobalErrorInvoked, false);
  assert.equal(metadata.compatibilityClaimed, false);
  assert.deepEqual(publicRootErrorCalls, []);
  assert.deepEqual(
    metadata.rootErrorOptionCallbackRecords.map((record) => [
      record.sourceLabel,
      record.domEventName,
      record.queueName,
      record.targetPath,
      record.rootOwnershipStatus,
      record.dehydratedBoundaryOwnerId,
      record.rootErrorCallbacksInvoked,
      record.reportGlobalErrorInvoked,
      record.willReplay
    ]),
    [
      [
        "first-boundary",
        "click",
        "discrete-hydration-replay-attempt",
        "container.childNodes[1]",
        "owned-by-dehydrated-root",
        "replay-error-boundary:1:boundary:0",
        false,
        false,
        false
      ],
      [
        "root-target",
        "change",
        "queuedChangeEventTargets",
        "container.childNodes[3]",
        "owned-by-dehydrated-root",
        null,
        false,
        false,
        false
      ],
      [
        "second-boundary",
        "mouseover",
        "queuedMouse",
        "container.childNodes[5]",
        "owned-by-dehydrated-root",
        "replay-error-boundary:1:boundary:1",
        false,
        false,
        false
      ]
    ]
  );
  assert.equal(
    metadata.rootErrorOptionCallbackRecords[0].errorMessage,
    "Hydration replay for click at container.childNodes[1] remained blocked-on-dehydrated-boundary."
  );
  assert.equal(
    Object.hasOwn(metadata.rootErrorOptionCallbackRecords[0], "error"),
    false
  );

  const payload =
    rootBridge.getPrivateRootHydrationReplayErrorMetadataPayload(metadata);
  assert.equal(payload.hydrateRootRecord, hydrateRecord);
  assert.equal(payload.hydrationOptions, hydrationOptions);
  assert.equal(payload.ownershipDiagnostics, ownershipDiagnostics);

  const otherContainer = createElement("SECTION", document);
  const outsideTarget = createElement("BUTTON", document);
  const unownedRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        otherContainer,
        "click",
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent("click", outsideTarget)
    );
  const unownedOwnership =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      hydrateRecord.hydrationBoundaryRecord,
      unownedRecord,
      {
        source: "conformance-hydration-unowned-replay-target"
      }
    );
  assert.throws(
    () =>
      bridge.createHydrationReplayErrorMetadata(
        hydrateRecord,
        unownedOwnership
      ),
    {
      code: "FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_ERROR_METADATA"
    }
  );
  assert.throws(
    () =>
      bridge.createHydrationReplayErrorMetadata(
        hydrateRecord,
        hydrateRecord.hydrationBoundaryRecord.eventReplayOwnershipDiagnostics
      ),
    {
      code: "FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_ERROR_METADATA"
    }
  );
  assert.deepEqual(container.__registrations, []);
  assert.deepEqual(document.__registrations, []);
});

test("private hydration replay error metadata rejects stale roots and public replay claims", () => {
  const scenario =
    createHydrationReplayErrorMetadataScenario("replay-error-negative");
  const metadata = scenario.bridge.createHydrationReplayErrorMetadata(
    scenario.hydrateRecord,
    scenario.ownershipDiagnostics,
    {
      replayTargetLabels: ["boundary"],
      source: "conformance-hydration-replay-error-negative"
    }
  );

  assert.equal(
    rootBridge.isPrivateRootHydrationReplayErrorMetadataRecord(metadata),
    true
  );
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.eventDispatch, false);
  assert.equal(metadata.eventsReplayed, false);
  assert.equal(metadata.replayQueuesDrained, false);
  assert.equal(metadata.listenerInstallation, false);
  assert.equal(metadata.domMutation, false);
  assert.equal(metadata.publicRootErrorCallbacksInvoked, false);
  assert.deepEqual(scenario.callbackCalls, []);

  const routing = scenario.bridge.createHydrationRecoverableErrorRouting(
    scenario.hydrateRecord,
    scenario.hydrateRecord.recoverableErrorMetadata,
    metadata,
    {
      mismatchLabels: ["boundary-text"],
      rootOptions: scenario.hydrationOptions,
      source: "conformance-hydration-recoverable-routing-negative-baseline"
    }
  );
  assert.equal(
    rootBridge.isPrivateRootHydrationRecoverableErrorRoutingRecord(routing),
    true
  );
  assert.equal(routing.publicOnRecoverableErrorInvoked, false);
  assert.equal(routing.rootErrorCallbackInvocationCount, 0);
  assert.equal(routing.compatibilityClaimed, false);
  assert.equal(routing.domMutation, false);
  assert.deepEqual(scenario.callbackCalls, []);

  const foreignScenario =
    createHydrationReplayErrorMetadataScenario("replay-error-negative-foreign");
  assert.throws(
    () =>
      scenario.bridge.createHydrationReplayErrorMetadata(
        scenario.hydrateRecord,
        foreignScenario.ownershipDiagnostics
      ),
    {
      code: "FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_ERROR_METADATA"
    }
  );
  assert.throws(
    () =>
      foreignScenario.bridge.createHydrationReplayErrorMetadata(
        scenario.hydrateRecord,
        scenario.ownershipDiagnostics
      ),
    {
      code: "FAST_REACT_DOM_FOREIGN_ROOT_HANDLE"
    }
  );

  const outsideContainer = createElement("SECTION", scenario.document);
  const outsideTarget = createElement("BUTTON", scenario.document);
  outsideTarget.parentNode = outsideContainer;
  outsideContainer.childNodes = [outsideTarget];
  const unownedDispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        outsideContainer,
        "click",
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent("click", outsideTarget)
    );
  const unownedOwnership =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      scenario.hydrateRecord.hydrationBoundaryRecord,
      unownedDispatchRecord,
      {
        source: "conformance-hydration-replay-error-unowned"
      }
    );
  assert.throws(
    () =>
      scenario.bridge.createHydrationReplayErrorMetadata(
        scenario.hydrateRecord,
        unownedOwnership
      ),
    {
      code: "FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_ERROR_METADATA"
    }
  );

  const invalidReplayMetadataCode =
    "FAST_REACT_DOM_INVALID_HYDRATION_REPLAY_ERROR_METADATA";
  function assertReplayMetadataRejects(tamperedOwnership, message) {
    const expected = {
      code: invalidReplayMetadataCode
    };
    if (message !== undefined) {
      expected.message = message;
    }
    assert.throws(
      () =>
        scenario.bridge.createHydrationReplayErrorMetadata(
          scenario.hydrateRecord,
          tamperedOwnership
        ),
      expected
    );
  }

  assertReplayMetadataRejects(
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      ownershipRows: scenario.ownershipDiagnostics.ownershipRows.map((row) =>
        Object.freeze({
          ...row,
          compatibilityClaimed: true
        })
      )
    }),
    /ownership rows/
  );
  assertReplayMetadataRejects(
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventReplayQueueDiagnostics: Object.freeze({
        ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics,
        replayQueueDrainOrderDiagnostics: Object.freeze({
          ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics
            .replayQueueDrainOrderDiagnostics,
          compatibilityClaimed: true
        })
      })
    }),
    /ownership or queue diagnostics/
  );
  assertReplayMetadataRejects(
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventReplayQueueDiagnostics: Object.freeze({
        ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics,
        blockedEventReplayTargets:
          scenario.ownershipDiagnostics.eventReplayQueueDiagnostics
            .blockedEventReplayTargets.map((row) =>
              Object.freeze({
                ...row,
                compatibilityClaimed: true
              })
            )
      })
    }),
    /blocked target rows/
  );
  assertReplayMetadataRejects(
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventReplayQueueDiagnostics: Object.freeze({
        ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics,
        replayQueueDrainOrderDiagnostics: Object.freeze({
          ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics
            .replayQueueDrainOrderDiagnostics,
          drainOrder:
            scenario.ownershipDiagnostics.eventReplayQueueDiagnostics
              .replayQueueDrainOrderDiagnostics.drainOrder.map((row) =>
                Object.freeze({
                  ...row,
                  publicOnRecoverableErrorInvoked: true
                })
              )
        })
      })
    }),
    /replay queue drain diagnostic rows/
  );

  for (const tamperedOwnership of [
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      rootRecordId: "stale-hydration-root:1"
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      compatibilityClaimed: true
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      publicRootBehaviorChanged: true
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventsReplayed: true
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      replayQueuesDrained: true
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventReplayQueueDiagnostics: Object.freeze({
        ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics,
        compatibilityClaimed: true
      })
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventReplayQueueDiagnostics: Object.freeze({
        ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics,
        eventsReplayed: true,
        replayQueuesDrained: true
      })
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventReplayQueueDiagnostics: Object.freeze({
        ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics,
        blockedEventReplayTargets:
          scenario.ownershipDiagnostics.eventReplayQueueDiagnostics
            .blockedEventReplayTargets.map((row) =>
              Object.freeze({
                ...row,
                queued: true
              })
            )
      })
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventReplayQueueDiagnostics: Object.freeze({
        ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics,
        drainOrder:
          scenario.ownershipDiagnostics.eventReplayQueueDiagnostics
            .drainOrder.map((row) =>
              Object.freeze({
                ...row,
                willReplay: true
              })
            )
      })
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      eventReplayQueueDiagnostics: Object.freeze({
        ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics,
        replayQueueDrainOrderDiagnostics: Object.freeze({
          ...scenario.ownershipDiagnostics.eventReplayQueueDiagnostics
            .replayQueueDrainOrderDiagnostics,
          drainOrder:
            scenario.ownershipDiagnostics.eventReplayQueueDiagnostics
              .replayQueueDrainOrderDiagnostics.drainOrder.map((row) =>
                Object.freeze({
                  ...row,
                  replayQueueDrained: true
                })
              )
        })
      })
    }),
    Object.freeze({
      ...scenario.ownershipDiagnostics,
      ownershipRows: scenario.ownershipDiagnostics.ownershipRows.map((row) =>
        Object.freeze({
          ...row,
          willDispatch: true
        })
      )
    })
  ]) {
    assertReplayMetadataRejects(tamperedOwnership, undefined);
  }

  const invalidRootRequestCode = "FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST";
  for (const tamperedHydrateRecord of [
    Object.freeze({
      ...scenario.hydrateRecord,
      rootId: "stale-root-id"
    }),
    Object.freeze({
      ...scenario.hydrateRecord,
      markerGuard: null
    }),
    Object.freeze({
      ...scenario.hydrateRecord,
      listenerGuard: null
    }),
    Object.freeze({
      ...scenario.hydrateRecord,
      markerWrites: true
    }),
    Object.freeze({
      ...scenario.hydrateRecord,
      listenerInstallation: true
    }),
    Object.freeze({
      ...scenario.hydrateRecord,
      domMutation: true
    }),
    Object.freeze({
      ...scenario.hydrateRecord,
      compatibilityClaimed: true
    })
  ]) {
    assert.throws(
      () => scenario.bridge.admitRequest(tamperedHydrateRecord),
      {
        code: invalidRootRequestCode
      }
    );
  }

  assert.throws(
    () =>
      scenario.bridge.createHydrationRecoverableErrorRouting(
        scenario.hydrateRecord,
        Object.freeze({
          ...scenario.hydrateRecord.recoverableErrorMetadata,
          rootRecordId: "wrong-recoverable-route:1"
        }),
        metadata,
        {
          rootOptions: scenario.hydrationOptions,
          source: "conformance-hydration-recoverable-wrong-route"
        }
      ),
    {
      code: "FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_ROUTING"
    }
  );
  for (const callbackClaim of [
    { onRecoverableErrorInvoked: true },
    { publicCallbackInvoked: true },
    { rootErrorCallbackInvocationCount: 1 }
  ]) {
    assert.throws(
      () =>
        scenario.bridge.createHydrationRecoverableErrorRouting(
          scenario.hydrateRecord,
          scenario.hydrateRecord.recoverableErrorMetadata,
          metadata,
          {
            ...callbackClaim,
            rootOptions: scenario.hydrationOptions,
            source: "conformance-hydration-recoverable-callback-claim"
          }
        ),
      {
        code: "FAST_REACT_DOM_INVALID_HYDRATION_RECOVERABLE_ERROR_ROUTING"
      }
    );
  }

  assert.deepEqual(scenario.callbackCalls, []);
  assert.equal(scenario.dispatchRecord.hydrationReplay.queued, false);
  assert.equal(unownedDispatchRecord.hydrationReplay.queued, false);
  assert.deepEqual(scenario.container.__registrations, []);
  assert.deepEqual(scenario.document.__registrations, []);
  assert.deepEqual(foreignScenario.container.__registrations, []);
  assert.deepEqual(foreignScenario.document.__registrations, []);
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

function assertHydrationReplayOwnershipGateDiagnostics(
  diagnostics,
  expected
) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    hydrationGate.HYDRATION_REPLAY_OWNERSHIP_GATE_DIAGNOSTIC_KIND
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
  assert.equal(diagnostics.rootRecordId, expected.rootRecordId);
  assert.equal(
    diagnostics.rootKind,
    hydrationGate.UNSUPPORTED_HYDRATION_ROOT_KIND
  );
  assert.equal(diagnostics.rootTag, hydrationGate.CONCURRENT_ROOT_TAG);
  assert.equal(diagnostics.eventReplayQueueDiagnosticsAccepted, true);
  assert.equal(diagnostics.targetResolutionDiagnosticsAccepted, true);
  assert.equal(diagnostics.drainOrderDiagnosticsAccepted, true);
  assert.equal(diagnostics.orderSource, "dehydrated-target-root-metadata");
  assert.equal(
    diagnostics.blockedEventReplayTargetCount,
    expected.ownershipRowCount
  );
  assert.equal(diagnostics.drainOrderCount, expected.ownershipRowCount);
  assert.equal(diagnostics.ownershipRowCount, expected.ownershipRowCount);
  assert.equal(
    diagnostics.ownershipRetainedCount,
    expected.ownershipRetainedCount
  );
  assert.equal(
    diagnostics.ownershipRetainedThroughDrainOrder,
    expected.ownershipRetainedCount === expected.ownershipRowCount
  );
  assert.equal(
    diagnostics.rootOwnershipRetainedCount,
    expected.rootOwnershipRetainedCount
  );
  assert.equal(
    diagnostics.dehydratedBoundaryOwnershipRequiredCount,
    expected.dehydratedBoundaryOwnershipRequiredCount
  );
  assert.equal(
    diagnostics.dehydratedBoundaryOwnershipRetainedCount,
    expected.dehydratedBoundaryOwnershipRetainedCount
  );
  assert.equal(diagnostics.queuedEventReplayTargetCount, 0);
  assert.equal(diagnostics.replayedEventCount, 0);
  assert.equal(diagnostics.ownershipRows.length, expected.ownershipRowCount);
  for (const row of diagnostics.ownershipRows) {
    assert.equal(
      row.kind,
      hydrationGate.HYDRATION_REPLAY_OWNERSHIP_GATE_ENTRY_RECORD_KIND
    );
    assert.equal(row.diagnosticOnly, true);
    assert.equal(row.readOnly, true);
    assert.equal(row.compatibilityClaimed, false);
    assert.equal(row.browserDomEventCompatibilityClaimed, false);
    assert.equal(row.publicRootBehaviorChanged, false);
    assert.equal(row.queued, false);
    assert.equal(row.replayQueueDrained, false);
    assert.equal(row.willDrainReplayQueues, false);
    assert.equal(row.willDispatch, false);
    assert.equal(row.willHydrate, false);
    assert.equal(row.willReplay, false);
  }
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

function assertHydrationTextMismatchDiagnostics(diagnostics, expected) {
  assert.equal(Object.isFrozen(diagnostics), true);
  assert.equal(
    diagnostics.kind,
    hydrationGate.HYDRATION_TEXT_MISMATCH_DIAGNOSTIC_KIND
  );
  assert.equal(
    diagnostics.status,
    expected.mismatchCount === 0
      ? "blocked-no-hydration-text-mismatches-recorded"
      : "blocked-hydration-text-mismatches-recorded"
  );
  assert.equal(diagnostics.diagnosticOnly, true);
  assert.equal(diagnostics.readOnly, true);
  assert.equal(diagnostics.compatibilityClaimed, false);
  assert.equal(diagnostics.canHydrate, false);
  assert.equal(diagnostics.hydrateTextInstanceCalled, false);
  assert.equal(diagnostics.diffHydratedTextForDevWarningsCalled, false);
  assert.equal(diagnostics.recoverableErrorsQueued, false);
  assert.equal(diagnostics.onRecoverableErrorInvoked, false);
  assert.equal(diagnostics.publicRootCreated, false);
  assert.equal(diagnostics.domMutated, false);
  assert.equal(diagnostics.textPatched, false);
  assert.equal(diagnostics.boundaryCleared, false);
  assert.equal(
    diagnostics.blockedReason,
    hydrationGate.HYDRATION_TEXT_MISMATCH_BLOCKED_REASON
  );
  assert.equal(diagnostics.rootRecordId, expected.rootRecordId);
  assert.equal(
    diagnostics.source,
    "unsupported-hydrate-root-boundary-record"
  );
  assert.equal(diagnostics.expectedTextSource, "initialChildren");
  assert.equal(
    diagnostics.actualTextSource,
    "container.childNodes text nodes depth-first"
  );
  assert.equal(diagnostics.markerDiagnosticsAccepted, true);
  assert.equal(diagnostics.expectedTextRowCount, expected.expectedTextRowCount);
  assert.equal(diagnostics.actualTextRowCount, expected.actualTextRowCount);
  assert.equal(diagnostics.mismatchCount, expected.mismatchCount);
  assert.equal(
    diagnostics.expectedTextRows.length,
    expected.expectedTextRowCount
  );
  assert.equal(diagnostics.actualTextRows.length, expected.actualTextRowCount);
  assert.equal(diagnostics.mismatchRows.length, expected.mismatchCount);
  assert.equal(
    diagnostics.recoverableErrorMetadata.kind,
    hydrationGate.HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND
  );
}

function assertHydrationTextMismatchRecoverableMetadata(metadata, expected) {
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(
    metadata.kind,
    hydrationGate.HYDRATION_TEXT_MISMATCH_RECOVERABLE_ERROR_METADATA_KIND
  );
  assert.equal(
    metadata.status,
    "blocked-hydration-text-mismatch-recoverable-error-metadata-recorded"
  );
  assert.equal(metadata.diagnosticOnly, true);
  assert.equal(metadata.readOnly, true);
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(
    metadata.blockedReason,
    hydrationGate.HYDRATION_RECOVERABLE_ERROR_CALLBACK_BLOCKED_REASON
  );
  assert.equal(metadata.rootRecordId, expected.rootRecordId);
  assert.equal(
    metadata.source,
    "ReactFiberHydrationContext.throwOnHydrationMismatch/queueRecoverableErrors"
  );
  assert.equal(
    metadata.onRecoverableErrorOption.present,
    expected.callbackPresent
  );
  assert.equal(metadata.onRecoverableErrorOption.callbackInfo.type, "function");
  assert.equal(metadata.onRecoverableErrorOption.callbackInvoked, false);
  assert.equal(metadata.onRecoverableErrorOption.publicCallbackInvoked, false);
  assert.equal(
    metadata.recoverableErrorMetadataCount,
    expected.recoverableErrorMetadataCount
  );
  assert.equal(metadata.queuedRecoverableErrorCount, 0);
  assert.equal(metadata.onRecoverableErrorInvocationCount, 0);
  assert.equal(
    metadata.wouldQueueRecoverableErrorCount,
    expected.recoverableErrorMetadataCount
  );
  assert.equal(
    metadata.recoverableErrorRows.length,
    expected.recoverableErrorMetadataCount
  );
  for (const row of metadata.recoverableErrorRows) {
    assert.equal(row.status, "metadata-recorded-callback-not-invoked");
    assert.equal(row.errorName, "Error");
    assert.equal(row.messageCategory, "hydration-text-mismatch");
    assert.equal(row.errorInfo.componentStack, null);
    assert.equal(row.errorInfo.digest, null);
    assert.equal(row.queuedRecoverableError, false);
    assert.equal(row.onRecoverableErrorInvoked, false);
    assert.equal(row.publicCallbackInvoked, false);
    assert.equal(row.recoveredByClientRender, false);
    assert.equal(row.surfacedToUI, false);
  }
  assert.equal(metadata.recoverableErrorsQueued, false);
  assert.equal(metadata.onRecoverableErrorInvoked, false);
  assert.equal(metadata.publicRootCreated, false);
  assert.equal(metadata.hydratingPublicRoot, false);
  assert.equal(metadata.domMutated, false);
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

function createHydrationReplayErrorMetadataScenario(label) {
  const document = createDocument(label);
  const container = createElement("DIV", document);
  const target = createElement("BUTTON", document);
  const callbackCalls = [];
  target.parentNode = container;
  container.childNodes = [
    createComment("$"),
    target,
    createComment("/$")
  ];

  function onRecoverableError(error) {
    callbackCalls.push(["recoverable", error.message]);
  }

  const hydrationOptions = {
    identifierPrefix: `${label}-`,
    onRecoverableError
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hydrateIdPrefix: `${label}-hydrate`,
    hydrationRecordIdPrefix: `${label}-boundary`,
    requestIdPrefix: `${label}-request`
  });
  const hydrateRecord = bridge.createHydrateRoot(
    container,
    { props: { children: "client text" }, type: "App" },
    hydrationOptions
  );
  const dispatchRecord =
    pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        "click",
        eventSystemFlags.IS_CAPTURE_PHASE
      ),
      createNativeEvent("click", target)
    );
  const ownershipDiagnostics =
    hydrationGate.createHydrationReplayOwnershipGateDiagnostic(
      hydrateRecord.hydrationBoundaryRecord,
      dispatchRecord,
      {
        source: `${label}-ownership`
      }
    );

  return {
    bridge,
    callbackCalls,
    container,
    dispatchRecord,
    document,
    hydrateRecord,
    hydrationOptions,
    ownershipDiagnostics,
    target
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

function createText(nodeValue) {
  return {
    nodeType: domContainer.TEXT_NODE,
    nodeValue
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
