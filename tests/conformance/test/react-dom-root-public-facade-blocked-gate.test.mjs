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
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_BLOCKED_SURFACES,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS,
  REACT_DOM_ROOT_PUBLIC_FACADE_SCENARIO_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ACT_PASSIVE_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_CROSS_ROOT_SCHEDULING_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS,
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
  assert.equal(
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS.filter(
      (admission) => Number(admission.workerId) >= 503
    ).length,
    13
  );
  const privateMetadataBlockedRow = gate.blockedPublicFacadeRows.find(
    (row) =>
      row.id ===
      "public-root-render-private-react-dom-metadata-compatibility"
  );
  assert.equal(
    privateMetadataBlockedRow.gateStatus,
    REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS
  );
  assert.equal(privateMetadataBlockedRow.compatibilityClaimed, false);
  assert.equal(
    privateMetadataBlockedRow.privateReactDomMetadataEvidence,
    "separate"
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
  assert.equal(
    gate.rootRenderGate.summary.privateRootWorkLoopCommitHandoffDiagnosticRowCount,
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS.length *
      REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicRootCompatibilitySurface,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicCreateRootCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicRootUpdateCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicRootUnmountCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicHydrateRootCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicDomMutationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateRootWorkLoopCommitHandoffPublicTestRendererCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privateReactDomMetadataDiagnosticRowCount,
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS.length *
      REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length
  );
  assert.equal(
    gate.rootRenderGate.summary.privateReactDomMetadataCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicEventCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicResourceCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicFormCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicControlledInputCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary.privatePromotion503533RejectedRowCount,
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.length
  );
  assert.equal(
    gate.rootRenderGate.summary.privatePromotion503533CompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicRootCompatibilitySurface,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicEventCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicResourceCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicFormCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicControlledInputCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privatePromotion503533PublicTestRendererCompatibilityClaimed,
    false
  );
  assert.deepEqual(
    gate.privatePromotionRejectionRows503533.map((row) => row.id),
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.map(
      (row) => row.id
    )
  );
  for (const row of gate.privatePromotionRejectionRows503533) {
    assert.equal(
      row.gateStatus,
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS
    );
    assert.equal(row.promotion, "rejected");
    assert.equal(row.privateEvidenceOnly, true);
    assert.equal(row.compatibilityClaimed, false);
    assert.deepEqual(
      row.blockedPublicCompatibilitySurfaces,
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_BLOCKED_SURFACES
    );
    for (const claimKey of REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS) {
      assert.equal(row[claimKey], false, `${row.id} ${claimKey}`);
      assert.equal(
        row.publicCompatibilityClaims[claimKey],
        false,
        `${row.id} publicCompatibilityClaims.${claimKey}`
      );
    }
  }
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
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS
    );
    assert.notEqual(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ACCEPTED_STATUS
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
  const renderPayload =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(render);
  const unmount = root.unmount();

  assert.equal(
    adapter.adapterStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ADAPTER_READY
  );
  assert.equal(adapter.publicCreateRootEnabled, false);
  assert.equal(adapter.publicHydrateRootEnabled, false);
  assert.equal(adapter.compatibilityClaimed, false);
  assert.equal(create.requestType, "createRoot");
  assert.equal(
    render.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_RENDER_APPLIED
  );
  assert.equal(renderPayload.renderRecord.requestType, "root.render");
  assert.equal(unmount.requestType, "root.unmount");
  assert.equal(create.requestId, "facade-conformance-request:1");
  assert.equal(renderPayload.renderRecord.updateId, "facade-conformance-update:1");
  assert.equal(unmount.updateId, "facade-conformance-update:2");
  assert.deepEqual(adapter.getRootRequestRecords(root), [
    create,
    renderPayload.renderRecord,
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
  assert.deepEqual(
    container.__mutationLog.map((entry) => entry.type),
    ["appendChild", "removeChild"]
  );
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

test("React DOM client private facade preflight accepts live containers only as blocked evidence", () => {
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
  const { container, document } = createPrivateGateLiveRootContainer(
    "public-facade-live-container-preflight",
    domContainer
  );
  const preflight = descriptor.value({
    rootLiveContainerPreflightIdPrefix: "facade-live-container"
  });

  const record = preflight.preflightLiveContainer(container, {
    containerId: "facade-live-container:target",
    explicitAdmission: true
  });
  const payload =
    rootBridge.getPrivateRootLiveContainerPreflightPayload(record);

  assert.equal(
    record.preflightStatus,
    rootBridge.ROOT_BRIDGE_LIVE_CONTAINER_PREFLIGHT_BLOCKED
  );
  assert.equal(record.preflightId, "facade-live-container:1");
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
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      "dom-like-live-container-shape",
      "root-marker-listener-state-snapshot",
      "blocked-live-container-evidence"
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      "public-root-execution",
      "native-execution",
      "reconciler-execution",
      "marker-writes",
      "listener-installation",
      "browser-dom-mutation",
      "fake-dom-mutation",
      "hydration",
      "events",
      "compatibility-claims"
    ]
  );
  assert.equal(record.blockerEvidence.markerStateUnchanged, true);
  assert.equal(record.blockerEvidence.markerWritesBlocked, true);
  assert.equal(record.blockerEvidence.listenerInstallationBlocked, true);
  assert.equal(record.blockerEvidence.browserDomMutationBlocked, true);
  assert.equal(record.blockerEvidence.fakeDomMutationBlocked, true);
  assert.equal(record.blockerEvidence.rootMutationCountBefore, 0);
  assert.equal(record.blockerEvidence.rootMutationCountAfter, 0);
  assert.equal(
    record.blockerEvidence.ownerDocumentMutationCountBefore,
    0
  );
  assert.equal(record.blockerEvidence.ownerDocumentMutationCountAfter, 0);
  assert.equal(payload.container, undefined);
  assert.equal(payload.ownerDocument, undefined);
  assert.equal(payload.record, record);
  assert.deepEqual(preflight.getLiveContainerPreflightRecords(), [record]);
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

test("React DOM client private facade host-output update routes through private fake DOM only", () => {
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
  const document = createPrivateGateDocument(
    "public-facade-host-output-update",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const initialElement = {
    props: {
      children: "initial facade output",
      className: "facade-initial",
      id: "facade-host",
      "data-phase": "initial"
    },
    type: "main"
  };
  const nextElement = {
    props: {
      children: "updated facade output",
      className: "facade-updated",
      id: "facade-host",
      "data-phase": "updated"
    },
    type: "main"
  };
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: "facade-conformance-update-handoff",
    publicFacadeHostOutputRenderIdPrefix: "facade-conformance-render",
    publicFacadeHostOutputUpdateIdPrefix: "facade-conformance-update",
    requestIdPrefix: "facade-conformance-request",
    rootIdPrefix: "facade-conformance-root",
    updateIdPrefix: "facade-conformance-update-id"
  });
  const root = adapter.createRoot(container);
  const initial = adapter.renderHostOutput(root, initialElement);
  const initialHidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputRenderPayload(initial);
  const update = adapter.updateHostOutput(root, nextElement);
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUpdatePayload(update);
  const rootWorkLoopRecord = initial.rootWorkLoopFinishedWorkRecord;
  const rootWorkLoopPayload =
    rootBridge.getPrivateRootPublicFacadeRootWorkLoopFinishedWorkPayload(
      rootWorkLoopRecord
    );

  assert.equal(
    initial.rootWorkLoopFinishedWorkStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ROOT_WORK_LOOP_FINISHED_WORK_ACCEPTED
  );
  assert.equal(
    rootWorkLoopRecord.$$typeof,
    rootBridge.privateRootPublicFacadeRootWorkLoopFinishedWorkRecordType
  );
  assert.deepEqual(rootWorkLoopRecord.childTags, [
    "HostComponent",
    "HostText"
  ]);
  assert.equal(rootWorkLoopRecord.recordsFinishedWork, true);
  assert.equal(rootWorkLoopRecord.consumedFinishedWorkRecord, true);
  assert.equal(rootWorkLoopRecord.publicRootRenderingBlocked, true);
  assert.equal(rootWorkLoopRecord.publicRootExecution, false);
  assert.equal(rootWorkLoopRecord.reconcilerExecution, false);
  assert.equal(rootWorkLoopRecord.compatibilityClaimed, false);
  assert.equal(
    rootWorkLoopRecord.metadataEvidence.status,
    rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS
  );
  assert.equal(rootWorkLoopPayload.renderRecord, initialHidden.renderRecord);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeRootWorkLoopFinishedWorkRecord(
      rootWorkLoopRecord
    ),
    true
  );
  assert.deepEqual(
    initial.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-root-render-record",
      "root-marker-setup-cleanup",
      "root-listener-setup-cleanup",
      "create-render-admission",
      "fake-dom-host-output-mutation",
      "component-tree-host-instance-map",
      "latest-props-publication",
      "root-work-loop-finished-work-handoff"
    ]
  );
  assert.equal(
    update.$$typeof,
    rootBridge.privateRootPublicFacadeHostOutputUpdateRecordType
  );
  assert.equal(
    update.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(update.diagnosticId, "facade-conformance-update:1");
  assert.equal(update.updateRequestType, "root.render");
  assert.equal(update.updateUpdateId, "facade-conformance-update-id:2");
  assert.equal(
    update.updateLifecycleStatusBefore,
    rootBridge.ROOT_LIFECYCLE_RENDERED
  );
  assert.equal(
    update.hostOutputUpdateHandoffId,
    "facade-conformance-update-handoff:1"
  );
  assert.deepEqual(
    update.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-initial-host-output-render",
      "public-facade-root-render-update-record",
      "host-output-update-handoff",
      "fake-dom-property-update",
      "property-payload-evidence",
      "fake-dom-text-update",
      "latest-props-after-mutation",
      "attribute-payload-rows"
    ]
  );
  assert.equal(update.privateFacadeRoot, true);
  assert.equal(update.publicCreateRootEnabled, false);
  assert.equal(update.publicRootExecution, false);
  assert.equal(update.publicRootCompatibilitySurface, false);
  assert.equal(update.nativeExecution, false);
  assert.equal(update.reconcilerExecution, false);
  assert.equal(update.browserDomMutation, false);
  assert.equal(update.markerWrites, false);
  assert.equal(update.listenerInstallation, false);
  assert.equal(update.compatibilityClaimed, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputUpdateRecord(update),
    true
  );
  assert.deepEqual(
    adapter.getRootRequestRecords(root).map((record) => record.requestType),
    ["createRoot", "root.render", "root.render"]
  );
  assert.deepEqual(adapter.getRootHostOutputRenderDiagnostics(root), [initial]);
  assert.deepEqual(adapter.getRootHostOutputUpdateDiagnostics(root), [update]);
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(hidden.updateRecord).element,
    nextElement
  );
  assert.equal(
    hidden.hostOutputUpdateHandoff.updateStatus,
    rootBridge.ROOT_BRIDGE_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(container.childNodes.length, 1);
  assert.equal(container.firstChild.textContent, "updated facade output");
  assert.deepEqual(attributeEntries(container.firstChild), [
    ["class", "facade-updated"],
    ["data-phase", "updated"],
    ["id", "facade-host"]
  ]);
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);

  hidden.bridge.cleanupInitialRenderHostOutput(
    hidden.hostOutputRenderPayload.hostOutputHandoff
  );
  assert.equal(container.childNodes.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.createRoot.status, "throws");
  assert.equal(publicBoundary.createRoot.rootObjectCreated, false);
});

test("React DOM client private facade nested host-output update stays diagnostic-only", () => {
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
  const componentTree = require(
    path.join(repoRoot, "packages/react-dom/src/client/component-tree.js")
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
    "public-facade-nested-host-output-update",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const initialElement = {
    props: {
      children: {
        props: {
          children: "nested initial",
          className: "nested initial",
          id: "nested-child"
        },
        type: "span"
      },
      id: "nested-parent"
    },
    type: "section"
  };
  const nextElement = {
    props: {
      children: {
        props: {
          children: "nested updated",
          className: "nested updated",
          id: "nested-child",
          "data-phase": "updated"
        },
        type: "span"
      },
      id: "nested-parent"
    },
    type: "section"
  };
  const adapter = descriptor.value({
    hostOutputUpdateIdPrefix: "facade-conformance-nested-handoff",
    publicFacadeNestedHostOutputUpdateIdPrefix:
      "facade-conformance-nested-update",
    requestIdPrefix: "facade-conformance-nested-request",
    rootIdPrefix: "facade-conformance-nested-root",
    updateIdPrefix: "facade-conformance-nested-update-id"
  });
  const root = adapter.createRoot(container);
  const create = adapter.getRootCreateRecord(root);
  const diagnostic = adapter.updateNestedHostOutput(
    root,
    initialElement,
    nextElement
  );
  const hidden =
    rootBridge.getPrivateRootPublicFacadeNestedHostOutputUpdatePayload(
      diagnostic
    );
  const parentNode = hidden.parentHostInstanceNode;
  const childNode = hidden.childHostInstanceNode;
  const textNode = hidden.textInstance;

  assert.equal(
    diagnostic.$$typeof,
    rootBridge.privateRootPublicFacadeNestedHostOutputUpdateRecordType
  );
  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_NESTED_HOST_OUTPUT_UPDATE_APPLIED
  );
  assert.equal(diagnostic.diagnosticId, "facade-conformance-nested-update:1");
  assert.equal(diagnostic.updateRequestType, "root.render");
  assert.equal(
    diagnostic.hostOutputUpdateHandoffId,
    "facade-conformance-nested-handoff:1"
  );
  assert.deepEqual(diagnostic.nestedHostPath, [
    "HostRoot",
    "HostComponent",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(diagnostic.parentHostType, "section");
  assert.equal(diagnostic.childHostType, "span");
  assert.equal(diagnostic.previousText, "nested initial");
  assert.equal(diagnostic.nextText, "nested updated");
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
  assert.equal(diagnostic.latestPropsPublished, true);
  assert.equal(
    diagnostic.latestPropsPublishOrder,
    "after-property-and-text-mutation"
  );
  assert.equal(diagnostic.parentLatestPropsPublished, true);
  assert.equal(diagnostic.childInitialLatestPropsPublished, true);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-nested-host-output-render-record",
      "public-facade-root-render-update-record",
      "nested-host-output-path",
      "parent-child-token-identity",
      "host-output-update-handoff",
      "fake-dom-property-update",
      "property-payload-evidence",
      "fake-dom-text-update",
      "latest-props-after-mutation",
      "attribute-payload-rows"
    ]
  );
  assert.equal(diagnostic.publicCreateRootEnabled, false);
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.rootScheduled, false);
  assert.equal(diagnostic.browserDomMutation, false);
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
  assert.deepEqual(
    adapter.getRootRequestRecords(root).map((record) => record.requestType),
    ["createRoot", "root.render", "root.render"]
  );
  assert.deepEqual(adapter.getRootNestedHostOutputUpdateDiagnostics(root), [
    diagnostic
  ]);
  assert.equal(hidden.createRecord, create);
  assert.equal(hidden.hostOutputUpdateHandoff.latestPropsPublished, true);
  assert.equal(
    rootBridge.getPrivateRootRecordPayload(hidden.updateRecord).element,
    nextElement
  );
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
  assert.equal(container.firstChild, parentNode);
  assert.equal(parentNode.firstChild, childNode);
  assert.equal(childNode.firstChild, textNode);
  assert.equal(textNode.textContent, "nested updated");
  assert.equal(container.textContent, "nested updated");
  assert.deepEqual(attributeEntries(parentNode), [["id", "nested-parent"]]);
  assert.deepEqual(attributeEntries(childNode), [
    ["class", "nested updated"],
    ["data-phase", "updated"],
    ["id", "nested-child"]
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

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.createRoot.status, "throws");
  assert.equal(publicBoundary.createRoot.rootObjectCreated, false);
});

test("React DOM client private facade unmount cleanup stays private and non-compatible", () => {
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
  const document = createPrivateGateDocument(
    "public-facade-unmount-cleanup",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  const adapter = descriptor.value({
    createRenderAdmissionIdPrefix: "facade-unmount-admission",
    initialHostOutputIdPrefix: "facade-unmount-initial",
    publicFacadeHostOutputUnmountCleanupIdPrefix:
      "facade-unmount-diagnostic",
    requestIdPrefix: "facade-unmount-request",
    rootIdPrefix: "facade-unmount-root",
    sideEffectIdPrefix: "facade-unmount-side-effect",
    unmountCleanupIdPrefix: "facade-unmount-cleanup",
    updateIdPrefix: "facade-unmount-update"
  });
  const root = adapter.createRoot(container);
  const diagnostic = adapter.unmountHostOutput(root, {
    props: {
      children: "facade cleanup",
      id: "facade-cleanup-host"
    },
    type: "section"
  });
  const hidden =
    rootBridge.getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload(
      diagnostic
    );

  assert.equal(
    diagnostic.diagnosticStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_HOST_OUTPUT_UNMOUNT_CLEANED
  );
  assert.equal(diagnostic.diagnosticId, "facade-unmount-diagnostic:1");
  assert.equal(diagnostic.unmountCleanupId, "facade-unmount-cleanup:1");
  assert.equal(diagnostic.unmountRequestType, "root.unmount");
  assert.equal(diagnostic.unmountNoOp, false);
  assert.equal(diagnostic.unmountSync, true);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      "public-facade-create-root-record",
      "public-facade-root-render-record",
      "public-facade-root-unmount-record",
      "root-marker-setup-cleanup",
      "root-listener-setup-cleanup",
      "create-render-admission",
      "fake-dom-host-output-mutation",
      "fake-dom-unmount-cleanup",
      "root-unmount-admission-metadata",
      "fake-dom-container-cleanup-metadata",
      "component-tree-metadata-detach",
      "root-facade-metadata-clear",
      "latest-props-publication"
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      "public-root-execution",
      "public-root-unmount",
      "native-execution",
      "reconciler-execution",
      "browser-dom-compatibility",
      "hydration",
      "events",
      "refs",
      "compatibility-claims"
    ]
  );
  assert.equal(diagnostic.publicRootExecution, false);
  assert.equal(diagnostic.publicRootCompatibilitySurface, false);
  assert.equal(diagnostic.publicRootUnmounted, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.fakeDomMutation, true);
  assert.equal(diagnostic.browserDomMutation, false);
  assert.equal(diagnostic.rootContainerChildrenCleared, true);
  assert.equal(diagnostic.componentTreeMetadataDetached, true);
  assert.equal(
    diagnostic.rootMetadataCleanupStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_ROOT_UNMOUNT_METADATA_CLEARED
  );
  assert.equal(diagnostic.rootCreateRenderAdmissionMetadataCleared, true);
  assert.equal(diagnostic.activeHostOutputMetadataCleared, true);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.equal(diagnostic.cleanupRequired, false);
  assert.equal(
    rootBridge.isPrivateRootPublicFacadeHostOutputUnmountCleanupRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    hidden.unmountCleanupRecord.cleanupStatus,
    rootBridge.ROOT_BRIDGE_UNMOUNT_HOST_OUTPUT_CLEANED
  );
  assert.equal(
    rootBridge.isPrivateRootUnmountHostOutputCleanupRecord(
      hidden.unmountCleanupRecord
    ),
    true
  );
  assert.equal(hidden.renderRecord.requestType, "root.render");
  assert.equal(hidden.unmountRecord.requestType, "root.unmount");
  assert.deepEqual(adapter.getRootRequestRecords(root), [
    hidden.createRecord,
    hidden.renderRecord,
    hidden.unmountRecord
  ]);
  assert.deepEqual(
    adapter.getRootHostOutputUnmountCleanupDiagnostics(root),
    [diagnostic]
  );
  assert.equal(container.childNodes.length, 0);
  assert.deepEqual(
    container.__mutationLog.map((entry) => entry.type),
    ["appendChild", "removeChild"]
  );
  assert.equal(rootMarkers.getContainerRoot(container), null);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);

  const publicBoundary = inspectReactDomRootPublicFacadeBoundary();
  assert.equal(publicBoundary.createRoot.status, "throws");
  assert.equal(publicBoundary.createRoot.rootObjectCreated, false);
  assert.equal(publicBoundary.publicRootLifecycle.unmount.status, "throws");
  assert.equal(
    publicBoundary.publicRootLifecycle.unmount.compatibilityClaimed,
    false
  );
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

test("React DOM public root facade gate rejects private root work-loop commit handoff promotion", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateRootWorkLoopCommitHandoffCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicRootCompatibilitySurface = true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicCreateRootCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicRootRenderCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicRootUpdateCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicRootUnmountCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicHydrateRootCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicHydrationCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicDomMutationCompatibilityClaimed =
    true;
  rootRenderGate.summary
    .privateRootWorkLoopCommitHandoffPublicTestRendererCompatibilityClaimed =
    true;
  rootRenderGate.privateRootWorkLoopCommitHandoffGate.compatibilityClaimed =
    true;
  rootRenderGate.privateRootWorkLoopCommitHandoffGate
    .publicHydrateRootCompatibilityClaimed = true;
  rootRenderGate.privateRootWorkLoopCommitHandoffDiagnosticRows[0] = {
    ...rootRenderGate.privateRootWorkLoopCommitHandoffDiagnosticRows[0],
    compatibilityClaimed: true,
    comparedToReactDomOracle: true,
    privateEvidenceOnly: false,
    publicCompatibilityClaims: {
      ...rootRenderGate.privateRootWorkLoopCommitHandoffDiagnosticRows[0]
        .publicCompatibilityClaims,
      publicRootCompatibilitySurface: true,
      publicHydrateRootCompatibilityClaimed: true
    },
    publicRootCompatibilitySurface: true,
    publicHydrateRootCompatibilityClaimed: true
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
        "root-render-private-root-work-loop-commit-handoff-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-root-work-loop-commit-handoff-gate-public-claim-leaked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-root-work-loop-commit-handoff-row-not-private"
    )
  );
});

test("React DOM public root facade gate rejects private React DOM metadata promotion to public compatibility", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privateReactDomMetadataCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicRootRenderCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicHydrationCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicEventCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicResourceCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicFormCompatibilityClaimed = true;
  rootRenderGate.summary
    .privateReactDomMetadataPublicControlledInputCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate.compatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicRootRenderCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicHydrationCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicEventCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicResourceCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicFormCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataGate
    .publicControlledInputCompatibilityClaimed = true;
  rootRenderGate.privateReactDomMetadataDiagnosticRows[0] = {
    ...rootRenderGate.privateReactDomMetadataDiagnosticRows[0],
    comparedToReactDomOracle: true,
    compatibilityClaimed: true,
    publicControlledInputCompatibilityClaimed: true,
    publicEventCompatibilityClaimed: true,
    publicFormCompatibilityClaimed: true,
    publicHydrationCompatibilityClaimed: true,
    publicResourceCompatibilityClaimed: true,
    publicRootCompatibilitySurface: true,
    publicRootRenderCompatibilityClaimed: true
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
        "root-render-private-react-dom-metadata-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-react-dom-metadata-row-not-private"
    )
  );
});

test("React DOM public root facade remains blocked with hydration resource/form metadata ids", () => {
  const hydrationGate = require(
    path.join(
      repoRoot,
      "packages/react-dom/src/client/hydration-boundary-gate.js"
    )
  );
  const resourceFormGate = require(
    path.join(repoRoot, "packages/react-dom/src/resource-form-gates.js")
  );
  const domContainer = require(
    path.join(repoRoot, "packages/react-dom/src/client/dom-container.js")
  );
  const document = createPrivateGateDocument(
    "public-facade-hydration-metadata",
    domContainer
  );
  const container = createPrivateGateElement("DIV", document, domContainer);
  container.childNodes = [
    { data: "$", nodeType: domContainer.COMMENT_NODE },
    { data: "/$", nodeType: domContainer.COMMENT_NODE }
  ];

  const record = hydrationGate
    .createHydrationBoundaryGate({
      recordIdPrefix: "public-facade-hydration-metadata"
    })
    .recordUnsupportedHydrateRoot(
      container,
      { props: { children: "metadata ids" }, type: "App" },
      { identifierPrefix: "public-facade-hydration-metadata-" }
    );
  const metadata = record.acceptedPrivateMetadataDiagnostics;

  assert.equal(
    metadata.kind,
    hydrationGate.HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND
  );
  assert.equal(
    metadata.gateId,
    hydrationGate.privateHydrationBoundaryAcceptedMetadataGateId
  );
  assert.deepEqual(metadata.metadataIds, [
    "hydration-replay-ownership",
    "resource-map-commit",
    "stylesheet-load-error-state",
    "form-action-event-extraction",
    "form-reset-queue-commit"
  ]);
  assert.deepEqual(metadata.gateIds, [
    hydrationGate.privateHydrationReplayOwnershipGateId,
    resourceFormGate.privateResourceHintResourceMapCommitGateId,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateGateId,
    resourceFormGate.privateFormActionEventExtractionGateId,
    resourceFormGate.privateFormActionResetQueueCommitGateId
  ]);
  assert.equal(metadata.compatibilityClaimed, false);
  assert.equal(metadata.publicRootRenderCompatibilityClaimed, false);
  assert.equal(metadata.publicHydrationCompatibilityClaimed, false);
  assert.equal(metadata.publicHydrationReplayCompatibilityClaimed, false);
  assert.equal(metadata.publicResourceCompatibilityClaimed, false);
  assert.equal(metadata.publicResourceDomInsertionCompatibilityClaimed, false);
  assert.equal(metadata.publicStylesheetCompatibilityClaimed, false);
  assert.equal(metadata.publicFormCompatibilityClaimed, false);
  assert.equal(metadata.publicFormActionCompatibilityClaimed, false);
  assert.equal(metadata.publicFormResetCompatibilityClaimed, false);
  assert.equal(metadata.hydrationReplaySupported, false);
  assert.equal(metadata.eventsReplayed, false);
  assert.equal(metadata.resourceDomInsertion, false);
  assert.equal(metadata.resourceMapsCreated, false);
  assert.equal(metadata.stylesheetLoadListenersInstalled, false);
  assert.equal(metadata.stylesheetCommitSuspended, false);
  assert.equal(metadata.formActionEventPluginInvoked, false);
  assert.equal(metadata.actionInvoked, false);
  assert.equal(metadata.resetUpdateEnqueued, false);
  assert.equal(metadata.formResetCommitted, false);
  assert.equal(record.canHydrate, false);
  assert.equal(record.publicRootCreated, false);
  assert.equal(record.eventsReplayed, false);
  const gate = evaluateReactDomRootPublicFacadeBlockedGate({
    checkedOracle: rootRenderOracle,
    currentOracle: rootRenderOracle,
    clientRootOracle
  });

  assert.equal(gate.ok, true);
  assert.equal(gate.summary.compatibilityClaimed, false);
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicResourceCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.rootRenderGate.summary
      .privateReactDomMetadataPublicFormCompatibilityClaimed,
    false
  );
});

test("React DOM public root facade gate rejects accepted 503-533 private diagnostic promotion", () => {
  const rootRenderGate = clone(
    evaluateReactDomRootRenderE2EConformanceGate({
      checkedOracle: rootRenderOracle,
      currentOracle: rootRenderOracle
    })
  );
  rootRenderGate.summary.privatePromotion503533CompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicRootCompatibilitySurface = true;
  rootRenderGate.summary
    .privatePromotion503533PublicRenderCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicRootRenderCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicHydrationCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicEventCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicResourceCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicFormCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicControlledInputCompatibilityClaimed = true;
  rootRenderGate.summary
    .privatePromotion503533PublicTestRendererCompatibilityClaimed = true;
  rootRenderGate.privatePromotion503533Gate.compatibilityClaimed = true;
  rootRenderGate.privatePromotion503533Gate.publicTestRendererCompatibilityClaimed =
    true;
  rootRenderGate.privatePromotionRejectionRows503533[0] = {
    ...rootRenderGate.privatePromotionRejectionRows503533[0],
    compatibilityClaimed: true,
    comparedToReactDomOracle: true,
    promotion: "accepted",
    publicCompatibilityClaims: {
      ...rootRenderGate.privatePromotionRejectionRows503533[0]
        .publicCompatibilityClaims,
      publicRootCompatibilitySurface: true,
      publicTestRendererCompatibilityClaimed: true
    },
    publicRootCompatibilitySurface: true,
    publicTestRendererCompatibilityClaimed: true
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
        "root-render-private-promotion-503-533-claims-compatibility-while-public-facade-blocked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-promotion-503-533-gate-public-claim-leaked"
    )
  );
  assert.ok(
    gate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "root-render-private-promotion-503-533-row-not-rejected"
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
  document.createElement = function createPrivateGateFakeElement(tagName) {
    return createPrivateGateElement(String(tagName).toUpperCase(), this, domContainer);
  };
  document.createTextNode = function createPrivateGateFakeText(text) {
    return createPrivateGateTextNode(String(text), this, domContainer);
  };
  return document;
}

function createPrivateGateElement(nodeName, ownerDocument, domContainer) {
  return createPrivateGateEventTarget({
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createPrivateGateLiveRootContainer(label, domContainer) {
  const rawDocument = createPrivateGateDocument(
    `${label}-document`,
    domContainer
  );
  const document = guardPrivateGateLiveRootContainer(
    rawDocument,
    `${label}-document`
  );
  rawDocument.ownerDocument = document;
  const rawContainer = createPrivateGateElement(
    "DIV",
    document,
    domContainer
  );
  const container = guardPrivateGateLiveRootContainer(
    rawContainer,
    `${label}-container`
  );
  return { container, document };
}

function guardPrivateGateLiveRootContainer(target, label) {
  function fail(operation) {
    throw new Error(`Unexpected live root preflight ${operation} on ${label}`);
  }

  target.addEventListener = function addEventListener() {
    fail("addEventListener");
  };
  target.removeEventListener = function removeEventListener() {
    fail("removeEventListener");
  };
  target.appendChild = function appendChild() {
    fail("appendChild");
  };
  target.insertBefore = function insertBefore() {
    fail("insertBefore");
  };
  target.removeChild = function removeChild() {
    fail("removeChild");
  };
  target.createElement = function createElement() {
    fail("createElement");
  };
  target.createTextNode = function createTextNode() {
    fail("createTextNode");
  };
  Object.defineProperty(target, "textContent", {
    configurable: true,
    enumerable: true,
    get() {
      return "";
    },
    set() {
      fail("textContent write");
    }
  });

  return new Proxy(target, {
    defineProperty(source, property, descriptor) {
      if (isPrivateGateLiveRootPreflightWriteKey(property)) {
        fail(`define ${String(property)}`);
      }
      return Reflect.defineProperty(source, property, descriptor);
    },
    deleteProperty(source, property) {
      if (isPrivateGateLiveRootPreflightWriteKey(property)) {
        fail(`delete ${String(property)}`);
      }
      return Reflect.deleteProperty(source, property);
    },
    set(source, property, value, receiver) {
      if (isPrivateGateLiveRootPreflightWriteKey(property)) {
        fail(`write ${String(property)}`);
      }
      return Reflect.set(source, property, value, receiver);
    }
  });
}

function isPrivateGateLiveRootPreflightWriteKey(property) {
  const key = String(property);
  return (
    key.startsWith("__reactContainer$") ||
    key.startsWith("__reactEvents$") ||
    key.startsWith("_reactListening")
  );
}

function createPrivateGateTextNode(text, ownerDocument, domContainer) {
  const target = createPrivateGateEventTarget({
    nodeName: "#text",
    nodeType: domContainer.TEXT_NODE,
    ownerDocument
  });
  target.writeLog = [];
  target.textContent = text;
  Object.defineProperties(target, {
    data: {
      configurable: true,
      enumerable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        const textValue = String(value);
        this.writeLog.push(["data", textValue]);
        this.textContent = textValue;
      }
    },
    nodeValue: {
      configurable: true,
      enumerable: true,
      get() {
        return this.textContent;
      },
      set(value) {
        const textValue = String(value);
        this.writeLog.push(["nodeValue", textValue]);
        this.textContent = textValue;
      }
    }
  });
  return target;
}

function createPrivateGateEventTarget(fields) {
  const target = {
    ...fields,
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    __mutationLog: [],
    mutationLog: [],
    __registrations: [],
    parentNode: null,
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
      detachPrivateGateChild(child);
      this.childNodes.push(child);
      child.parentNode = this;
      this.__mutationLog.push({ child, type: "appendChild" });
      this.mutationLog.push(["appendChild", child.nodeName]);
      return child;
    },
    insertBefore(child, beforeChild) {
      if (beforeChild.parentNode !== this) {
        throw new Error("Cannot insert before a child from another parent.");
      }
      detachPrivateGateChild(child);
      const index = this.childNodes.indexOf(beforeChild);
      this.childNodes.splice(index, 0, child);
      child.parentNode = this;
      this.__mutationLog.push({ beforeChild, child, type: "insertBefore" });
      this.mutationLog.push([
        "insertBefore",
        child.nodeName,
        beforeChild.nodeName
      ]);
      return child;
    },
    removeChild(child) {
      if (child.parentNode !== this) {
        throw new Error("Cannot remove a child from another parent.");
      }
      detachPrivateGateChild(child);
      this.__mutationLog.push({ child, type: "removeChild" });
      this.mutationLog.push(["removeChild", child.nodeName]);
      return child;
    },
    setAttribute(name, value) {
      const attributeName = String(name);
      const stringValue = String(value);
      this.attributes.set(attributeName, stringValue);
      this.attributeLog.push(["setAttribute", attributeName, stringValue]);
    },
    removeAttribute(name) {
      const attributeName = String(name);
      const hadAttribute = this.attributes.has(attributeName);
      this.attributes.delete(attributeName);
      this.attributeLog.push(["removeAttribute", attributeName, hadAttribute]);
    },
    hasAttribute(name) {
      return this.attributes.has(String(name));
    },
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    }
  };
  let textContent = "";
  Object.defineProperty(target, "textContent", {
    configurable: true,
    enumerable: true,
    get() {
      if (this.childNodes.length > 0) {
        return this.childNodes.map((child) => child.textContent).join("");
      }
      return textContent;
    },
    set(value) {
      for (const child of [...this.childNodes]) {
        detachPrivateGateChild(child);
      }
      textContent = String(value);
      this.__mutationLog.push({ type: "textContent", value });
      this.mutationLog.push(["textContent", textContent]);
    }
  });
  Object.defineProperties(target, {
    firstChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[0] || null;
      }
    },
    lastChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[this.childNodes.length - 1] || null;
      }
    }
  });
  return target;
}

function detachPrivateGateChild(child) {
  if (child == null || typeof child !== "object") {
    throw new Error("Expected a fake-DOM child object.");
  }
  if (child.parentNode == null) {
    child.parentNode = null;
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

function attributeEntries(node) {
  return [...node.attributes.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
}
