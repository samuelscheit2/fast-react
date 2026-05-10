import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  readCheckedReactDomClientRootOracle
} from "../src/react-dom-client-root-oracle.mjs";
import {
  REACT_DOM_CLIENT_ROOT_PROBE_MODES
} from "../src/react-dom-client-root-targets.mjs";
import {
  readCheckedReactDomRootRenderE2EOracle
} from "../src/react-dom-root-render-e2e-oracle.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES
} from "../src/react-dom-root-render-e2e-targets.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
} from "../src/react-dom-root-render-e2e-scenarios.mjs";
import {
  REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_BOUNDARY_ROWS,
  REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
  REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS,
  REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS,
  REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ACCEPTED_STATUS,
  evaluateReactDomRootRenderE2EConformanceGate,
  evaluateReactDomRootPublicFacadeBlockedGate,
  inspectReactDomPrivateRootBridgeBoundary,
  inspectReactDomRootPublicFacadeBoundary
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

const rootRenderOracle = readCheckedReactDomRootRenderE2EOracle();
const clientRootOracle = readCheckedReactDomClientRootOracle();
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);

test("React DOM public root facade gate blocks placeholders while oracle prerequisites remain accepted", () => {
  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle
  });

  assert.equal(gate.ok, true);
  assert.equal(gate.summary.compatibilityAdmitted, false);
  assert.equal(gate.summary.compatibilityClaimed, false);
  assert.equal(
    gate.summary.acceptedClientRootScenarioModeRowCount,
    clientRootOracle.scenarios.length * REACT_DOM_CLIENT_ROOT_PROBE_MODES.length
  );
  assert.equal(
    gate.summary.acceptedRootRenderScenarioModeRowCount,
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
      REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length
  );
  assert.equal(
    gate.blockedScenarioModeRows.length,
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS.length *
      REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length
  );
  assert.deepEqual(
    gate.blockedPublicFacadeRows.map((row) => row.id),
    REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_BOUNDARY_ROWS.map((row) => row.id)
  );
  assert.equal(gate.blockedPrivateBridgeRows.length, 8);
  assert.equal(
    gate.rootRenderGate.summary.privateHostOutputDiagnosticScenarioModeRowCount,
    18
  );
  assert.equal(
    gate.rootRenderGate.summary.privateHostOutputBlockedScenarioModeRowCount,
    2
  );
  assert.equal(
    gate.rootRenderGate.summary.privateHostOutputCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateWarningBoundaryDiagnosticScenarioModeRowCount,
    2
  );
  assert.equal(
    gate.rootRenderGate.summary.privateWarningBoundaryBlockedScenarioModeRowCount,
    18
  );
  assert.equal(
    gate.rootRenderGate.summary.privateWarningBoundaryCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateWarningBoundaryConsoleOutputUsedAsEvidence,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateCrossRootSchedulingDiagnosticScenarioModeRowCount,
    2
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateCrossRootSchedulingBlockedScenarioModeRowCount,
    18
  );
  assert.equal(
    gate.rootRenderGate.summary.privateCrossRootSchedulingCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateCrossRootSchedulingPublicFlushSyncCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateActPassiveDiagnosticScenarioModeRowCount,
    20
  );
  assert.equal(
    gate.rootRenderGate.summary.privateActPassiveBlockedScenarioModeRowCount,
    0
  );
  assert.equal(
    gate.rootRenderGate.summary.privateActPassiveCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateActPassivePublicReactActCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateActPassivePublicReactDomTestUtilsActCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateActPassivePublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateActPassivePublicPassiveEffectCompatibilityClaimed,
    false
  );
  assert.equal(gate.rootRenderGate.summary.portalRootRenderBlockedRowCount, 5);
  assert.equal(
    gate.rootRenderGate.summary.privatePortalMetadataPromotesPublicRootRender,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.portalRootRenderCompatibilityClaimed,
    false
  );
  for (const row of gate.blockedPublicFacadeRows) {
    assert.equal(row.gateStatus, REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS);
    assert.notEqual(row.gateStatus, "accepted-private-root-host-output-diagnostic");
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_WARNING_BOUNDARY_ACCEPTED_STATUS
    );
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS
    );
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS
    );
    assert.notEqual(row.gateStatus, "blocked-portal-root-render");
    if ("compatibilityClaimed" in row) {
      assert.equal(row.compatibilityClaimed, false);
    }
  }
});

test("React DOM public root facade scenario admission is explicit and non-compatible", () => {
  assert.deepEqual(
    REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS.map(
      (admission) => admission.scenarioId
    ),
    REACT_DOM_ROOT_RENDER_E2E_SCENARIO_IDS
  );

  for (const admission of REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS) {
    assert.equal(admission.admission, "blocked");
    assert.equal(
      admission.gateStatus,
      REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS
    );
    assert.equal(admission.comparedToAcceptedReactDomOracle, true);
    assert.equal(admission.publicCompatibilityClaimed, false);
  }
});

test("React DOM public root facade inspection records current placeholder boundary", () => {
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();

  assert.deepEqual(publicBoundary.exportKeys, [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.deepEqual(publicBoundary.placeholderMetadata, {
    placeholder: true,
    entrypoint: "react-dom/client",
    compatibilityTarget: "react-dom@19.2.6"
  });
  assert.equal(publicBoundary.createRoot.status, "throws");
  assert.equal(publicBoundary.createRoot.thrown.code, "FAST_REACT_UNIMPLEMENTED");
  assert.equal(publicBoundary.createRoot.rootObjectCreated, false);
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
  assert.equal(publicBoundary.hydrateRoot.thrown.code, "FAST_REACT_UNIMPLEMENTED");
  assert.equal(publicBoundary.hydrateRoot.rootObjectCreated, false);
  assert.equal(publicBoundary.hydrateRoot.thrown.exportName, "hydrateRoot");
  assert.equal(publicBoundary.hydrateRoot.thrown.entrypoint, "react-dom/client");
  assert.equal(publicBoundary.createRoot.sideEffects.mutationCount, 0);
  assert.equal(publicBoundary.createRoot.sideEffects.listenerRegistrationCount, 0);
  assert.equal(publicBoundary.createRoot.sideEffects.containerMarker.propertyCount, 0);
  assert.equal(publicBoundary.hydrateRoot.sideEffects.mutationCount, 0);
  assert.equal(publicBoundary.hydrateRoot.sideEffects.listenerRegistrationCount, 0);
  assert.equal(publicBoundary.hydrateRoot.sideEffects.containerMarker.propertyCount, 0);

  for (const operation of [
    publicBoundary.publicRootLifecycle.renderInitial,
    publicBoundary.publicRootLifecycle.renderUpdate,
    publicBoundary.publicRootLifecycle.unmount
  ]) {
    assert.equal(operation.status, "throws");
    assert.equal(operation.thrown.code, "FAST_REACT_UNIMPLEMENTED");
    assert.equal(operation.thrown.exportName, "createRoot");
    assert.equal(operation.blockedAt, "createRoot");
    assert.equal(operation.rootObjectCreated, false);
    assert.equal(operation.lifecycleOperationAttempted, false);
    assert.equal(operation.compatibilityClaimed, false);
    assert.equal(operation.sideEffects.mutationCount, 0);
    assert.equal(operation.sideEffects.listenerRegistrationCount, 0);
    assert.equal(operation.sideEffects.containerMarker.propertyCount, 0);
  }
});

test("React DOM client private facade adapter is symbol-only and routes to private records", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );

  assert.deepEqual(Object.keys(reactDomClient), [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.equal(Object.hasOwn(reactDomClient, "rootPublicFacadeAdapter"), false);
  assert.equal(
    Object.hasOwn(
      reactDomClient,
      "__FAST_REACT_PRIVATE_ROOT_PUBLIC_FACADE_ADAPTER__"
    ),
    false
  );
  assert.equal(Symbol.keyFor(symbol), "fast.react_dom.client.private_root_public_facade_adapter");
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.value, rootBridge.createPrivateRootPublicFacadeAdapter);
  assert.equal(
    Object.getOwnPropertyDescriptor(reactDomClient.hydrateRoot, symbol),
    undefined
  );

  const document = createPrivateGateDocument(
    "public-facade-private-adapter",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const adapter = descriptor.value({
    requestIdPrefix: "facade-conformance-request",
    rootIdPrefix: "facade-conformance-root",
    updateIdPrefix: "facade-conformance-update"
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const render = root.render({
    props: {
      children: "adapter child"
    },
    type: "span"
  });
  const unmount = root.unmount();

  assert.equal(
    adapter.adapterStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY
  );
  assert.equal(adapter.publicCreateRootEnabled, false);
  assert.equal(adapter.publicHydrateRootEnabled, false);
  assert.equal(adapter.compatibilityClaimed, false);
  assert.equal(create.requestType, "createRoot");
  assert.equal(render.requestType, "root.render");
  assert.equal(unmount.requestType, "root.unmount");
  assert.equal(create.requestId, "facade-conformance-request:1");
  assert.equal(render.updateId, "facade-conformance-update:1");
  assert.equal(unmount.updateId, "facade-conformance-update:2");
  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    render,
    unmount
  ]);
  assert.equal(rootBridge.getPrivateRootPublicFacadeRootPayload(root).root, root);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadeRootPayload(root).rootType,
    rootBridge.privateRootPublicFacadeRootType
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.createRoot.status, "throws");
  assert.equal(publicBoundary.createRoot.rootObjectCreated, false);
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
  assert.deepEqual(publicBoundary.exportKeys, [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
});

test("React DOM client private facade preflight is symbol-only and routes to accepted diagnostics", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadePreflightSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );

  assert.deepEqual(Object.keys(reactDomClient), [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.equal(Object.hasOwn(reactDomClient, "rootPublicFacadePreflight"), false);
  assert.equal(
    Symbol.keyFor(symbol),
    "fast.react_dom.client.private_root_public_facade_preflight"
  );
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(descriptor.value, rootBridge.createPrivateRootPublicFacadePreflight);
  assert.equal(
    Object.getOwnPropertyDescriptor(reactDomClient.hydrateRoot, symbol),
    undefined
  );

  const document = createPrivateGateDocument(
    "public-facade-private-preflight",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const preflight = descriptor.value({
    nativeEnvironmentId: 427,
    nativeHandoffIdPrefix: "facade-preflight-native",
    publicFacadePreflightIdPrefix: "facade-preflight",
    requestIdPrefix: "facade-preflight-request",
    rootIdPrefix: "facade-preflight-root",
    updateIdPrefix: "facade-preflight-update"
  });
  const root = preflight.createRoot(container);
  const create = preflight.getRootCreatePreflight(root);
  const render = root.render({
    props: {
      children: "preflight child"
    },
    type: "span"
  });
  const unmount = root.unmount();

  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_READY
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicHydrateRootEnabled, false);
  assert.equal(preflight.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadePreflight(preflight),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadePreflightRoot(root),
    true
  );
  assert.equal(rootBridge.isPrivateRootPublicFacadePreflightRecord(create), true);
  assert.deepEqual(Object.keys(root), ["render", "unmount"]);
  assert.equal(create.facadeCall, "createRoot");
  assert.equal(render.facadeCall, "root.render");
  assert.equal(unmount.facadeCall, "root.unmount");
  for (const record of [create, render, unmount]) {
    assert.equal(
      record.preflightStatus,
      rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED
    );
    assert.equal(
      record.requestAdmissionStatus,
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
    );
    assert.equal(
      record.nativeHandoffStatus,
      rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
    );
    assert.equal(record.publicRootCompatibilitySurface, false);
    assert.equal(record.nativeExecution, false);
    assert.equal(record.reconcilerExecution, false);
    assert.equal(record.domMutation, false);
    assert.equal(record.markerWrites, false);
    assert.equal(record.listenerInstallation, false);
    assert.equal(record.compatibilityClaimed, false);
  }
  assert.equal(create.requestId, "facade-preflight-request:1");
  assert.equal(render.updateId, "facade-preflight-update:1");
  assert.equal(unmount.updateId, "facade-preflight-update:2");
  assert.deepEqual(preflight.getRootPreflightRecords(root), [
    create,
    render,
    unmount
  ]);
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightPayload(preflight)
      .preflightRecordCount,
    3
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightRootPayload(root)
      .rootType,
    rootBridge.privateRootPublicFacadePreflightRootType
  );
  assert.equal(
    rootBridge.getPrivateRootPublicFacadePreflightRecordPayload(render)
      .requestAdmission,
    render.requestAdmission
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.createRoot.status, "throws");
  assert.equal(publicBoundary.createRoot.rootObjectCreated, false);
  assert.equal(publicBoundary.hydrateRoot.status, "throws");
});

test("React DOM client private facade preflights marker/listener setup and cleanup without public behavior", () => {
  const reactDomClient = require(
    path.join(repoRoot, "packages/react-dom/client.js")
  );
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const rootListeners = require(
    path.join(repoRoot, "packages/react-dom/src/events/root-listeners.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const symbol = rootBridge.privateRootPublicFacadeAdapterSymbol;
  const descriptor = Object.getOwnPropertyDescriptor(
    reactDomClient.createRoot,
    symbol
  );
  const document = createPrivateGateDocument(
    "public-facade-marker-listener-preflight",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const adapter = descriptor.value({
    publicFacadePreflightIdPrefix: "facade-marker-listener-preflight",
    requestIdPrefix: "facade-preflight-request",
    rootIdPrefix: "facade-preflight-root",
    sideEffectIdPrefix: "facade-preflight-side-effect"
  });
  const root = adapter.createRoot(container);
  const preflight =
    adapter.preflightRootMarkerListenerSetupAndCleanup(root);

  assert.equal(
    preflight.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED
  );
  assert.equal(preflight.preflightId, "facade-marker-listener-preflight:1");
  assert.deepEqual(
    preflight.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "root-marker-setup-cleanup",
      "root-listener-setup-cleanup"
    ]
  );
  assert.equal(preflight.setupPrerequisites.rootMarkerMatchesOwner, true);
  assert.equal(preflight.setupPrerequisites.rootListeningMarkerPresent, true);
  assert.equal(
    preflight.setupPrerequisites.ownerDocumentListeningMarkerPresent,
    true
  );
  assert.equal(preflight.setupPrerequisites.listenerRegistrationCount, 139);
  assert.equal(
    preflight.cleanupPrerequisites.markerCleanupStatus,
    rootMarkers.ROOT_MARKER_REVERTED
  );
  assert.equal(
    preflight.cleanupPrerequisites.listenerCleanupStatus,
    rootListeners.ROOT_LISTENERS_REVERTED
  );
  assert.equal(preflight.cleanupPrerequisites.listenerRemovalCount, 139);
  assert.equal(
    preflight.cleanupPrerequisites.restoredInitialMarkerState,
    true
  );
  assert.equal(preflight.publicCreateRootEnabled, false);
  assert.equal(preflight.publicRootExecution, false);
  assert.equal(preflight.nativeExecution, false);
  assert.equal(preflight.reconcilerExecution, false);
  assert.equal(preflight.domMutation, false);
  assert.equal(preflight.markerWrites, false);
  assert.equal(preflight.listenerInstallation, false);
  assert.equal(preflight.eventDispatch, false);
  assert.equal(preflight.compatibilityClaimed, false);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.createRoot.status, "throws");
  assert.equal(publicBoundary.createRoot.rootObjectCreated, false);
  assert.equal(publicBoundary.createRoot.sideEffects.mutationCount, 0);
  assert.equal(
    publicBoundary.createRoot.sideEffects.listenerRegistrationCount,
    0
  );
});

test("React DOM public root facade update and unmount rows stay blocked apart from private request metadata", () => {
  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle
  });

  const lifecycleRows = gate.blockedPublicFacadeRows.filter((row) =>
    REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS.some(
      (expected) => expected.id === row.id
    )
  );
  assert.deepEqual(
    lifecycleRows.map((row) => row.id),
    REACT_DOM_ROOT_PUBLIC_FACADE_LIFECYCLE_BLOCKED_ROWS.map((row) => row.id)
  );
  for (const row of lifecycleRows) {
    assert.equal(row.gateStatus, REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS);
    assert.equal(row.blockedAt, "createRoot");
    assert.equal(row.compatibilityClaimed, false);
    assert.equal(row.listenerRegistrationCount, 0);
    assert.equal(row.mutationCount, 0);
    assert.equal(row.privateBridgeEvidence, "separate");
  }
  assert.ok(
    gate.blockedPublicFacadeRows.every((row) => !row.id.startsWith("private-"))
  );

  const privateBoundary = gate.privateRootBridgeBoundary;
  assert.equal(
    privateBoundary.admissions.render.admissionStatus,
    "admitted-private-root-bridge-request-record"
  );
  assert.equal(
    privateBoundary.admissions.render.executionStatus,
    "blocked-private-root-bridge-execution"
  );
  assert.equal(
    privateBoundary.admissions.unmount.admissionStatus,
    "admitted-private-root-bridge-request-record"
  );
  assert.equal(privateBoundary.admissions.unmount.domMutation, false);
  assert.equal(privateBoundary.admissions.unmount.listenerInstallation, false);
  assert.equal(privateBoundary.admissions.unmount.compatibilityClaimed, false);
  assert.ok(
    gate.blockedPrivateBridgeRows.some(
      (row) => row.id === "private-root-render-admission"
    )
  );
  assert.ok(
    gate.blockedPrivateBridgeRows.some(
      (row) => row.id === "private-root-unmount-admission"
    )
  );
});

test("React DOM public root facade gate rejects premature public createRoot behavior", () => {
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  const prematurePublicBoundary = clone(publicBoundary);
  prematurePublicBoundary.createRoot = {
    ...prematurePublicBoundary.createRoot,
    status: "ok",
    value: {
      keys: ["render", "unmount"],
      type: "object"
    },
    rootObjectCreated: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: prematurePublicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "public-root-export-not-placeholder-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "public-root-object-created-while-facade-blocked"
    )
  );
});

test("React DOM public root facade gate rejects premature public hydrateRoot behavior", () => {
  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  const prematurePublicBoundary = clone(publicBoundary);
  prematurePublicBoundary.hydrateRoot = {
    ...prematurePublicBoundary.hydrateRoot,
    status: "ok",
    value: {
      keys: ["render", "unmount"],
      type: "object"
    },
    rootObjectCreated: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    localPublicFacadeBoundary: prematurePublicBoundary,
    privateRootBridgeBoundary: inspectReactDomPrivateRootBridgeBoundary()
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "public-root-export-not-placeholder-blocked" &&
        failure.exportName === "hydrateRoot"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "public-hydration-not-placeholder-blocked"
    )
  );
});

test("React DOM public root facade gate rejects private host-output promotion to public compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateHostOutputCompatibilityClaimed = true;
  rootRenderGate.privateHostOutputGate.compatibilityClaimed = true;
  rootRenderGate.privateHostOutputDiagnosticScenarioModeRows[0] = {
    ...rootRenderGate.privateHostOutputDiagnosticScenarioModeRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    publicRootCompatibilitySurface: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-host-output-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-host-output-row-not-private-blocked"
    )
  );
});

test("React DOM public root facade gate rejects private warning-boundary promotion to public compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateWarningBoundaryCompatibilityClaimed = true;
  rootRenderGate.summary.privateWarningBoundaryConsoleOutputUsedAsEvidence = true;
  rootRenderGate.privateWarningBoundaryGate.compatibilityClaimed = true;
  rootRenderGate.privateWarningBoundaryGate.consoleOutputUsedAsEvidence = true;
  rootRenderGate.privateWarningBoundaryDiagnosticScenarioModeRows[0] = {
    ...rootRenderGate.privateWarningBoundaryDiagnosticScenarioModeRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    consoleOutputUsedAsEvidence: true,
    publicRootCompatibilitySurface: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-warning-boundary-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-warning-boundary-row-not-private"
    )
  );
});

test("React DOM public root facade gate rejects private cross-root scheduling promotion to public flushSync compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateCrossRootSchedulingCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateCrossRootSchedulingPublicFlushSyncCompatibilityClaimed = true;
  rootRenderGate.privateCrossRootSchedulingGate.compatibilityClaimed = true;
  rootRenderGate.privateCrossRootSchedulingGate.publicFlushSyncCompatibilityClaimed =
    true;
  rootRenderGate.privateCrossRootSchedulingDiagnosticScenarioModeRows[0] = {
    ...rootRenderGate.privateCrossRootSchedulingDiagnosticScenarioModeRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    publicFlushSyncCompatibilityClaimed: true,
    publicRootCompatibilitySurface: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-cross-root-scheduling-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-cross-root-scheduling-row-not-private"
    )
  );
});

test("React DOM public root facade gate rejects private act/passive promotion to public compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateActPassiveCompatibilityClaimed = true;
  rootRenderGate.summary.privateActPassivePublicReactActCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateActPassivePublicReactDomTestUtilsActCompatibilityClaimed = true;
  rootRenderGate.summary.privateActPassivePublicRootRenderCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateActPassivePublicPassiveEffectCompatibilityClaimed = true;
  rootRenderGate.privateActPassiveGate.compatibilityClaimed = true;
  rootRenderGate.privateActPassiveGate.publicReactActCompatibilityClaimed = true;
  rootRenderGate.privateActPassiveGate
    .publicReactDomTestUtilsActCompatibilityClaimed = true;
  rootRenderGate.privateActPassiveGate.publicRootRenderCompatibilityClaimed =
    true;
  rootRenderGate.privateActPassiveGate
    .publicPassiveEffectCompatibilityClaimed = true;
  rootRenderGate.privateActPassiveDiagnosticScenarioModeRows[0] = {
    ...rootRenderGate.privateActPassiveDiagnosticScenarioModeRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    publicReactActCompatibilityClaimed: true,
    publicReactDomTestUtilsActCompatibilityClaimed: true,
    publicRootCompatibilitySurface: true,
    publicRootRenderCompatibilityClaimed: true,
    publicPassiveEffectCompatibilityClaimed: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-act-passive-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "root-render-private-act-passive-row-not-private"
    )
  );
});

test("React DOM public root facade gate rejects portal root-render compatibility leaks", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.portalRootRenderCompatibilityClaimed = true;
  rootRenderGate.summary.privatePortalMetadataPromotesPublicRootRender = true;
  rootRenderGate.portalRootRenderGate.summary.compatibilityClaimed = true;
  rootRenderGate.portalRootRenderGate.summary
    .privatePortalMetadataPromotesPublicRootRender = true;
  rootRenderGate.portalRootRenderBlockedRows[0] = {
    ...rootRenderGate.portalRootRenderBlockedRows[0],
    compatibilityClaimed: true,
    privatePortalMetadataPromotesPublicRootRender: true,
    publicRootCompatibilitySurface: true
  };

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    rootRenderGateResult: rootRenderGate
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-portal-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "root-render-portal-blocked-row-not-fail-closed"
    )
  );
});

test("React DOM public root facade gate rejects private bridge side effects or compatibility claims", () => {
  const privateBoundary = clone(inspectReactDomPrivateRootBridgeBoundary());
  privateBoundary.create.nativeExecution = true;
  privateBoundary.admissions.unmount.compatibilityClaimed = true;
  privateBoundary.sideEffects.listenerRegistrationCount = 1;

  const claimedClientRootOracle = clone(clientRootOracle);
  claimedClientRootOracle.conformanceClaims.compatibilityClaimed = true;

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle: claimedClientRootOracle,
    localPublicFacadeBoundary: inspectReactDomRootPublicFacadeBoundary(),
    privateRootBridgeBoundary: privateBoundary
  });

  assert.equal(gate.ok, false);
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "private-root-bridge-native-execution-enabled"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus === "private-root-bridge-produced-public-side-effects"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "private-root-bridge-admission-row-not-record-only"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "client-root-oracle-claims-compatibilityClaimed-while-blocked"
    )
  );
});

test("React DOM private root bridge inspection stays record-only", () => {
  const privateBoundary = inspectReactDomPrivateRootBridgeBoundary();

  assert.equal(privateBoundary.create.requestType, "createRoot");
  assert.equal(privateBoundary.create.nativeExecution, false);
  assert.equal(
    privateBoundary.create.markerGuard.action,
    "defer-mark-container-as-root"
  );
  assert.equal(
    privateBoundary.create.listenerGuard.action,
    "defer-listen-to-all-supported-events"
  );
  assert.equal(privateBoundary.render.requestType, "root.render");
  assert.equal(privateBoundary.render.nativeExecution, false);
  assert.equal(privateBoundary.unmount.requestType, "root.unmount");
  assert.equal(privateBoundary.unmount.nativeExecution, false);
  assert.equal(privateBoundary.secondUnmount.noOp, true);
  assert.equal(privateBoundary.renderAfterUnmount.status, "throws");
  assert.equal(
    privateBoundary.renderAfterUnmount.thrown.code,
    "FAST_REACT_DOM_UNMOUNTED_ROOT"
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(privateBoundary.admissions).map(([key, admission]) => [
        key,
        {
          admissionStatus: admission.admissionStatus,
          compatibilityClaimed: admission.compatibilityClaimed,
          executionStatus: admission.executionStatus,
          operation: admission.operation,
          transition: admission.lifecyclePrerequisites.lifecycleTransition
        }
      ])
    ),
    {
      create: {
        admissionStatus: "admitted-private-root-bridge-request-record",
        compatibilityClaimed: false,
        executionStatus: "blocked-private-root-bridge-execution",
        operation: "create",
        transition: "none->created"
      },
      render: {
        admissionStatus: "admitted-private-root-bridge-request-record",
        compatibilityClaimed: false,
        executionStatus: "blocked-private-root-bridge-execution",
        operation: "render",
        transition: "created->rendered"
      },
      unmount: {
        admissionStatus: "admitted-private-root-bridge-request-record",
        compatibilityClaimed: false,
        executionStatus: "blocked-private-root-bridge-execution",
        operation: "unmount",
        transition: "rendered->unmounted"
      },
      secondUnmount: {
        admissionStatus: "admitted-private-root-bridge-request-record",
        compatibilityClaimed: false,
        executionStatus: "blocked-private-root-bridge-execution",
        operation: "unmount",
        transition: "unmounted->unmounted"
      }
    }
  );
  assert.equal(privateBoundary.sideEffects.mutationCount, 0);
  assert.equal(privateBoundary.sideEffects.listenerRegistrationCount, 0);

  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle,
    privateRootBridgeBoundary: privateBoundary
  });
  assert.deepEqual(
    new Set(gate.blockedPrivateBridgeRows.map((row) => row.gateStatus)),
    new Set([REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS])
  );
  assert.equal(gate.blockedPrivateBridgeRows.length, 8);
});

test("React DOM explicit private createRoot mark/listen gate stays separate from public placeholders", () => {
  const rootBridge = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-bridge.js")
  );
  const rootMarkers = require(
    path.join(repoRoot, "packages/react-dom/src/client/root-markers.js")
  );
  const listenerRegistry = require(
    path.join(repoRoot, "packages/react-dom/src/events/listener-registry.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );

  const document = createPrivateGateDocument(
    "public-facade-private-mark-listen",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    sideEffectIdPrefix: "public-gate-side-effect"
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);

  assert.equal(
    sideEffects.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_APPLIED
  );
  assert.equal(sideEffects.markerWrites, true);
  assert.equal(sideEffects.listenerInstallation, true);
  assert.equal(sideEffects.nativeExecution, false);
  assert.equal(sideEffects.reconcilerExecution, false);
  assert.equal(sideEffects.domMutation, false);
  assert.equal(sideEffects.compatibilityClaimed, false);
  assert.equal(rootMarkers.getContainerRoot(container), create.owner);
  assert.equal(container.__registrations.length, 138);
  assert.equal(document.__registrations.length, 1);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.createRoot.status, "throws");
  assert.equal(publicBoundary.createRoot.sideEffects.listenerRegistrationCount, 0);
  assert.equal(publicBoundary.createRoot.sideEffects.mutationCount, 0);
  assert.equal(publicBoundary.createRoot.sideEffects.containerMarker.propertyCount, 0);

  const defaultPrivateBoundary = inspectReactDomPrivateRootBridgeBoundary();
  assert.equal(defaultPrivateBoundary.sideEffects.listenerRegistrationCount, 0);
  assert.equal(defaultPrivateBoundary.sideEffects.mutationCount, 0);
  assert.equal(defaultPrivateBoundary.sideEffects.containerMarker.propertyCount, 0);

  const cleanup = bridge.revertCreateRootSideEffects(sideEffects);
  assert.equal(
    cleanup.sideEffectStatus,
    rootBridge.ROOT_BRIDGE_MARK_LISTEN_REVERTED
  );
  assert.equal(rootMarkers.inspectContainerRootMarker(container).propertyCount, 0);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createPrivateGateDocument(label, domContainer) {
  const document = createPrivateGateEventTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createPrivateGateEventTarget({
    label: `${label}-window`
  });
  return document;
}

function createPrivateGateElement(nodeName, ownerDocument, domContainer) {
  return createPrivateGateEventTarget({
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createPrivateGateEventTarget(fields) {
  const target = {
    ...fields,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    },
    removeEventListener(type, listener, options) {
      const index = this.__registrations.findIndex(
        (entry) =>
          entry.type === type &&
          entry.listener === listener &&
          entry.options === options
      );
      if (index !== -1) {
        this.__registrations.splice(index, 1);
      }
    },
    appendChild(child) {
      this.__mutationLog.push({ child, type: "appendChild" });
    },
    insertBefore(child, beforeChild) {
      this.__mutationLog.push({ beforeChild, child, type: "insertBefore" });
    },
    removeChild(child) {
      this.__mutationLog.push({ child, type: "removeChild" });
    }
  };
  let textContent = "";
  Object.defineProperty(target, "textContent", {
    configurable: true,
    enumerable: true,
    get() {
      return textContent;
    },
    set(value) {
      textContent = value;
      this.__mutationLog.push({ type: "textContent", value });
    }
  });
  return target;
}
