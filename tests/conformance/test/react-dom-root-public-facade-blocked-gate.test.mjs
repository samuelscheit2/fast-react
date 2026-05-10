import assert from "node:assert/strict";
import test from "node:test";

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
  evaluateReactDomRootPublicFacadeBlockedGate,
  inspectReactDomPrivateRootBridgeBoundary,
  inspectReactDomRootPublicFacadeBoundary
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

const rootRenderOracle = readCheckedReactDomRootRenderE2EOracle();
const clientRootOracle = readCheckedReactDomClientRootOracle();

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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
