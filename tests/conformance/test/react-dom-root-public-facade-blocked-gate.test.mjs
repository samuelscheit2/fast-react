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
    16
  );
  assert.equal(
    gate.rootRenderGate.summary.privateHostOutputBlockedScenarioModeRowCount,
    4
  );
  assert.equal(
    gate.rootRenderGate.summary.privateHostOutputCompatibilityClaimed,
    false
  );
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
