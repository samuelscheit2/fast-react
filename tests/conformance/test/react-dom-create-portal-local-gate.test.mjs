import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateReactDomPortalRootRenderBlockedGate,
  inspectReactDomPortalRootRenderBlockedBoundary,
  REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS,
  REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
  REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";
import {
  readCheckedReactDomRootRenderE2EOracle
} from "../src/react-dom-root-render-e2e-oracle.mjs";

const oracle = readCheckedReactDomRootRenderE2EOracle();
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const packageRoot = path.join(repoRoot, "packages", "react-dom");
const domContainer = require(
  path.join(packageRoot, "src", "client", "dom-container.js")
);
const listenerRegistry = require(
  path.join(packageRoot, "src", "events", "listener-registry.js")
);
const pluginEventSystem = require(
  path.join(packageRoot, "src", "events", "plugin-event-system.js")
);
const rootListeners = require(
  path.join(packageRoot, "src", "events", "root-listeners.js")
);
const reactDom = require(path.join(packageRoot, "index.js"));
const resourceFormGate = require(
  path.join(packageRoot, "src", "resource-form-gates.js")
);
const rootBridge = require(
  path.join(packageRoot, "src", "client", "root-bridge.js")
);

test("createPortal local gate feeds the portal root-render blocked gate without admitting compatibility", () => {
  const result = evaluateReactDomPortalRootRenderBlockedGate({
    checkedOracle: oracle,
    currentOracle: oracle
  });

  assert.equal(result.ok, true);
  assert.equal(result.summary.prerequisiteRowCount, 4);
  assert.equal(result.summary.blockedRowCount, 5);
  assert.equal(result.summary.rootRenderE2EScenarioModeRowCount, 20);
  assert.equal(result.summary.compatibilityClaimed, false);
  assert.deepEqual(
    result.prerequisiteRows.map((row) => row.gateStatus),
    [
      REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
      REACT_DOM_PORTAL_ROOT_RENDER_OBJECT_ACCEPTED_STATUS,
      REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS,
      REACT_DOM_PORTAL_ROOT_RENDER_RECONCILER_DIAGNOSTIC_STATUS
    ]
  );
  assert.deepEqual(
    result.blockedRows.map((row) => row.id),
    [
      "portal-public-root-render",
      "portal-mounting",
      "portal-listener-setup",
      "portal-dom-mutation",
      "portal-compatibility-claim"
    ]
  );
  for (const row of result.blockedRows) {
    assert.equal(row.gateStatus, REACT_DOM_PORTAL_ROOT_RENDER_BLOCKED_STATUS);
    assert.equal(row.publicRootCompatibilitySurface, false);
    assert.equal(row.compatibilityClaimed, false);
  }
});

test("portal root-render boundary preserves accepted createPortal object shape and create-only side effects", () => {
  const boundary = inspectReactDomPortalRootRenderBlockedBoundary();

  assert.equal(boundary.loadError, null);
  assert.deepEqual(boundary.publicCreatePortalExport, {
    length: 2,
    name: "",
    type: "function"
  });
  assertPortalSummary(boundary.publicPortal, "portal-key");
  assertPortalSummary(boundary.privateRecord, "normalized-key");
  assertPrivatePortalRootBoundary(boundary.privateRootBridgePortalBoundary);
  assert.deepEqual(boundary.privateRootBridgePortalBoundaryPayload, {
    portalChildrenMatches: true,
    portalContainerMatches: true,
    portalMatches: true,
    rootHandleMatches: true,
    sourceRecordMatches: true
  });
  assert.equal(
    boundary.privateRootBridgePortalRequest.render.requestType,
    "root.render"
  );
  assert.equal(
    boundary.privateRootBridgePortalRequest.admission.executionStatus,
    "blocked-private-root-bridge-execution"
  );
  assert.equal(
    boundary.invalidPortalRootBoundary.thrown.code,
    "FAST_REACT_DOM_INVALID_PORTAL_ROOT_BOUNDARY_RECORD"
  );
  assert.equal(boundary.unsupportedImplementation.status, "throws");
  assert.equal(
    boundary.unsupportedImplementation.thrown.code,
    "FAST_REACT_DOM_PORTAL_IMPLEMENTATION_UNSUPPORTED"
  );
  assert.deepEqual(boundary.portalCreationSideEffects, {
    compatibilityClaimed: false,
    containerListenerRegistrationCount: 0,
    containerListeningMarkerPropertyCount: 0,
    containerMarkerPropertyCount: 0,
    containerMutationCount: 0,
    domMutationObserved: false,
    listenerInstallationObserved: false,
    markerWriteObserved: false,
    ownerDocumentListenerRegistrationCount: 0,
    ownerDocumentListeningMarkerPropertyCount: 0,
    ownerDocumentMutationCount: 0,
    portalMountingObserved: false,
    publicRootCompatibilityClaimed: false
  });
});

test("private portal root boundary records remain diagnostic-only", () => {
  const boundary = inspectReactDomPortalRootRenderBlockedBoundary();
  const record = boundary.privateRootBridgePortalBoundary;

  assertPrivatePortalRootBoundary(record);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.portalChildReconciliation, false);
  assert.equal(record.portalMounting, false);
  assert.equal(record.domMutation, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      "portal-child-reconciliation",
      "portal-container-mounting",
      "portal-container-listeners",
      "native-execution",
      "reconciler-execution",
      "dom-mutation",
      "marker-writes",
      "listener-installation",
      "hydration",
      "events",
      "compatibility-claims"
    ]
  );
  assert.equal(
    record.portalListenerGuard.action,
    "defer-listen-to-portal-container-events-for-root-boundary"
  );
  assert.equal(record.portalListenerGuard.hasPortalListeningMarker, false);
});

test("private portal fake-DOM commit handoff records blocked listener and resource side effects", () => {
  const document = createPortalGateDocument("portal-commit-handoff");
  const rootContainer = createPortalGateElement("DIV", document);
  const portalContainer = createPortalGateElement("SECTION", document);
  const portalChild = {
    props: {
      children: "portal child"
    },
    type: "span"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: "portal-boundary",
    portalCommitIdPrefix: "portal-commit"
  });
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    "portal-key"
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootPortalCommitHandoffPayload(handoff);
  const resourceBoundary =
    resourceFormGate.recordResourceFormPortalCommitBlockedRequest(handoff);

  assert.equal(
    handoff.kind,
    "FastReactDomPrivateRootPortalFakeDomCommitHandoffRecord"
  );
  assert.equal(
    handoff.handoffStatus,
    "admitted-private-root-portal-fake-dom-commit-handoff"
  );
  assert.equal(
    handoff.commitStatus,
    "blocked-private-root-portal-fake-dom-commit-apply"
  );
  assert.equal(handoff.fakeDomCommitHandoff, true);
  assert.equal(handoff.fakeDomCommitApplied, false);
  assert.equal(handoff.portalContainerChildrenReplaced, false);
  assert.equal(handoff.portalMounting, false);
  assert.equal(handoff.preparePortalMount, false);
  assert.equal(handoff.domMutation, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.resourceSideEffects, false);
  assert.deepEqual(
    handoff.blockedCapabilities.map((capability) => capability.id),
    [
      "portal-fake-dom-commit-apply",
      "portal-prepare-mount-listeners",
      "portal-resource-side-effects",
      "portal-child-reconciliation",
      "portal-container-mounting",
      "portal-container-listeners",
      "native-execution",
      "reconciler-execution",
      "dom-mutation",
      "marker-writes",
      "listener-installation",
      "hydration",
      "events",
      "compatibility-claims"
    ]
  );
  assert.equal(
    handoff.portalContainerOwnership.ownershipStatus,
    "validated-private-root-portal-container-ownership"
  );
  assert.equal(handoff.portalContainerOwnership.rootContainerMarkedAsRoot, true);
  assert.equal(
    handoff.portalContainerOwnership.rootContainerOwnerMatchesHandle,
    true
  );
  assert.equal(
    handoff.portalContainerOwnership.portalContainerMarkedAsRoot,
    false
  );
  assert.equal(handoff.portalContainerOwnership.sameOwnerDocument, true);
  assert.equal(handoff.listenerSideEffects.preparePortalMount, false);
  assert.equal(handoff.listenerSideEffects.listenerInstallation, false);
  assert.equal(handoff.listenerSideEffects.hasPortalListeningMarker, false);
  assert.equal(
    resourceBoundary.rootBridgeBoundary.commitStatus,
    "blocked-private-root-portal-fake-dom-commit-apply"
  );
  assert.equal(
    resourceBoundary.resourceSideEffectStatus,
    resourceFormGate.privatePortalCommitResourceBlockedStatus
  );
  assert.equal(resourceBoundary.rootBridgeBoundary.resourceSideEffects, false);
  assert.deepEqual(
    resourceBoundary.sideEffects,
    resourceFormGate.portalCommitResourceSideEffects
  );
  assert.equal(resourceBoundary.sideEffects.resourcesDispatched, false);
  assert.equal(resourceBoundary.sideEffects.sourceAdaptersInvoked, false);
  assert.equal(resourceBoundary.sideEffects.portalContainerMutated, false);
  assert.equal(
    resourceFormGate.isResourceFormPortalCommitBlockedRecord(resourceBoundary),
    true
  );
  assert.equal(hiddenHandoff.portalContainer, portalContainer);
  assert.equal(hiddenHandoff.rootContainer, rootContainer);
  assert.equal(hiddenHandoff.pendingChildren[0], portalChild);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
});

test("private portal preparePortalMount listener gate records intent without setup", () => {
  const document = createPortalGateDocument("portal-prepare-mount-listener");
  const rootContainer = createPortalGateElement("DIV", document);
  const portalContainer = createPortalGateElement("SECTION", document);
  const portalChild = {
    props: {
      children: "portal child"
    },
    type: "span"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: "portal-boundary",
    portalPrepareMountListenerIdPrefix: "portal-listener"
  });
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    "portal-key"
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const intent = bridge.createPortalPrepareMountListenerIntent(boundary);
  const hiddenIntent =
    rootBridge.getPrivateRootPortalPrepareMountListenerIntentPayload(
      intent
    );

  assert.equal(
    intent.kind,
    "FastReactDomPrivateRootPortalPrepareMountListenerIntentRecord"
  );
  assert.equal(
    intent.intentStatus,
    "admitted-private-root-portal-prepare-mount-listener-intent"
  );
  assert.equal(
    intent.listenerInstallationStatus,
    "blocked-private-root-portal-listener-installation"
  );
  assert.equal(intent.sourceBoundaryId, "portal-boundary:1");
  assert.equal(intent.portalKey, "portal-key");
  assert.equal(intent.preparePortalMountIntent, true);
  assert.equal(intent.preparePortalMount, false);
  assert.equal(intent.listenToAllSupportedEventsIntent, true);
  assert.equal(intent.listenToAllSupportedEvents, false);
  assert.equal(intent.portalListenerIntentRecorded, true);
  assert.equal(intent.portalMounting, false);
  assert.equal(intent.publicPortalMounting, false);
  assert.equal(intent.portalChildReconciliation, false);
  assert.equal(intent.domMutation, false);
  assert.equal(intent.publicDomMutation, false);
  assert.equal(intent.listenerInstallation, false);
  assert.equal(intent.eventDispatch, false);
  assert.equal(intent.compatibilityClaimed, false);
  assert.deepEqual(
    intent.acceptedCapabilities.map((capability) => capability.id),
    [
      "portal-accepted-boundary",
      "portal-prepare-mount-listener-intent",
      "portal-listen-to-all-supported-events-plan"
    ]
  );
  assert.deepEqual(
    intent.blockedCapabilities.map((capability) => capability.id),
    [
      "portal-public-container-mounting",
      "portal-listener-installation",
      "portal-event-dispatch",
      "portal-child-reconciliation",
      "portal-container-replacement",
      "portal-resource-side-effects",
      "native-execution",
      "reconciler-execution",
      "dom-mutation",
      "hydration",
      "compatibility-claims"
    ]
  );
  assert.equal(intent.listenerIntent.listenerIntentCount, 138);
  assert.equal(intent.listenerIntent.portalListenerIntentCount, 138);
  assert.equal(intent.listenerIntent.ownerDocumentListenerIntentCount, 0);
  assert.equal(intent.listenerIntent.passiveListenerIntentCount, 6);
  assert.equal(intent.listenerIntent.portalAlreadyListening, false);
  assert.equal(intent.listenerIntent.ownerDocumentAlreadyListening, true);
  assert.equal(
    intent.listenerIntent.eventRecordType,
    rootListeners.privatePortalPrepareMountListenerIntentRecordType
  );
  assert.equal(hiddenIntent.boundaryRecord, boundary);
  assert.equal(hiddenIntent.portalContainer, portalContainer);
  assert.equal(
    hiddenIntent.listenerIntentPayload.portalContainer,
    portalContainer
  );
  assert.equal(
    hiddenIntent.listenerIntentPayload.portalListenerIntents.length,
    138
  );
  assert.equal(
    hiddenIntent.listenerIntentPayload.ownerDocumentListenerIntents.length,
    0
  );
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(portalContainer.__mutationLog.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.equal(rootContainer.__mutationLog.length, 0);

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
});

test("private portal fake-DOM mount diagnostic admits one explicit HostComponent and HostText child only", () => {
  const document = createPortalGateDocument("portal-fake-dom-mount");
  const rootContainer = createPortalGateElement("DIV", document);
  const portalContainer = createPortalGateElement("SECTION", document);
  const portalChild = {
    props: {
      children: "portal child"
    },
    type: "span"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: "portal-boundary",
    portalCommitIdPrefix: "portal-commit",
    portalMountIdPrefix: "portal-mount"
  });
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    "portal-key"
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const hiddenMount =
    rootBridge.getPrivateRootPortalFakeDomMountPayload(mount);
  const resourceBoundary =
    resourceFormGate.recordResourceFormPortalFakeDomMountBlockedRequest(
      mount
    );

  assert.equal(
    mount.kind,
    "FastReactDomPrivateRootPortalFakeDomMountDiagnosticRecord"
  );
  assert.equal(
    mount.mountStatus,
    "applied-private-root-portal-fake-dom-mount-diagnostic"
  );
  assert.equal(
    mount.publicMountStatus,
    "blocked-public-root-portal-mounting"
  );
  assert.deepEqual(mount.hostFiberPath, [
    "HostRoot",
    "HostPortal",
    "HostComponent",
    "HostText"
  ]);
  assert.equal(mount.hostComponentType, "span");
  assert.equal(mount.hostText, "portal child");
  assert.equal(mount.fakeDomCommitApplied, true);
  assert.equal(mount.fakeDomPortalMountDiagnostic, true);
  assert.equal(mount.explicitPortalHostChildMounted, true);
  assert.equal(mount.componentTreeMetadataAttached, true);
  assert.equal(mount.portalContainerChildrenReplaced, false);
  assert.equal(mount.portalChildReconciliation, false);
  assert.equal(mount.portalMounting, false);
  assert.equal(mount.publicPortalMounting, false);
  assert.equal(mount.preparePortalMount, false);
  assert.equal(mount.nativeExecution, false);
  assert.equal(mount.reconcilerExecution, false);
  assert.equal(mount.domMutation, true);
  assert.equal(mount.publicDomMutation, false);
  assert.equal(mount.listenerInstallation, false);
  assert.equal(mount.resourceSideEffects, false);
  assert.equal(mount.compatibilityClaimed, false);
  assert.deepEqual(
    mount.acceptedCapabilities.map((capability) => capability.id),
    [
      "portal-explicit-host-component-mount",
      "portal-explicit-host-text-mount",
      "portal-component-tree-host-instance-map"
    ]
  );
  assert.deepEqual(
    mount.blockedCapabilities.map((capability) => capability.id),
    [
      "portal-public-container-mounting",
      "portal-child-reconciliation",
      "portal-container-replacement",
      "portal-prepare-mount-listeners",
      "portal-resource-side-effects",
      "native-execution",
      "reconciler-execution",
      "hydration",
      "events",
      "compatibility-claims"
    ]
  );
  assert.equal(hiddenMount.explicitChild, portalChild);
  assert.equal(hiddenMount.hostComponentNode, portalContainer.firstChild);
  assert.equal(hiddenMount.hostTextNode, hiddenMount.hostComponentNode.firstChild);
  assert.equal(portalContainer.childNodes.length, 1);
  assert.equal(portalContainer.firstChild.nodeName, "SPAN");
  assert.equal(portalContainer.firstChild.textContent, "portal child");
  assert.equal(portalContainer.textContent, "portal child");
  assert.deepEqual(
    document.__mutationLog.map((entry) => entry.type),
    ["createElement", "createTextNode"]
  );
  assert.deepEqual(
    portalContainer.__mutationLog.map((entry) => entry.type),
    ["appendChild"]
  );
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);

  assert.equal(
    resourceBoundary.kind,
    "FastReactDomResourceFormPortalFakeDomMountBoundaryRecord"
  );
  assert.equal(
    resourceBoundary.resourceSideEffectStatus,
    resourceFormGate.privatePortalFakeDomMountResourceBlockedStatus
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.fakeDomCommitApplied,
    true
  );
  assert.equal(
    resourceBoundary.rootBridgeBoundary.resourceSideEffects,
    false
  );
  assert.equal(resourceBoundary.sideEffects.portalContainerMutated, true);
  assert.equal(
    resourceBoundary.sideEffects.portalFakeDomMountDiagnosticApplied,
    true
  );
  assert.equal(resourceBoundary.sideEffects.resourcesDispatched, false);
  assert.equal(resourceBoundary.sideEffects.sourceAdaptersInvoked, false);
  assert.equal(resourceBoundary.sideEffects.portalListenersInstalled, false);
  assert.equal(
    resourceFormGate.isResourceFormPortalFakeDomMountBlockedRecord(
      resourceBoundary
    ),
    true
  );

  assert.throws(() => bridge.createPortalFakeDomMountDiagnostic(handoff), {
    code: "FAST_REACT_DOM_INVALID_PORTAL_FAKE_DOM_MOUNT_RECORD"
  });
  assert.throws(
    () =>
      resourceFormGate.recordResourceFormPortalFakeDomMountBlockedRequest({
        ...mount,
        compatibilityClaimed: true
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidPortalCommitHandoffCode
    }
  );

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
});

test("private portal event owner-root gate stays diagnostic-only", () => {
  const document = createPortalGateDocument("portal-event-owner-root");
  const rootContainer = createPortalGateElement("DIV", document);
  const portalContainer = createPortalGateElement("SECTION", document);
  const portalChild = {
    props: {
      children: "portal child",
      onClick() {
        throw new Error("portal listener should stay blocked");
      }
    },
    type: "span"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: "portal-boundary",
    portalCommitIdPrefix: "portal-commit",
    portalEventOwnerRootIdPrefix: "portal-owner",
    portalMountIdPrefix: "portal-mount"
  });
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    "portal-key"
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const ownerGate = bridge.createPortalEventOwnerRootGate(mount);
  const hiddenGate =
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload(ownerGate);

  assert.equal(
    ownerGate.kind,
    "FastReactDomPrivateRootPortalEventOwnerRootGateRecord"
  );
  assert.equal(
    ownerGate.gateStatus,
    "recorded-private-root-portal-event-owner-root-gate"
  );
  assert.equal(
    ownerGate.eventBubblingStatus,
    "blocked-private-root-portal-event-bubbling"
  );
  assert.equal(ownerGate.sourceMountDiagnosticId, "portal-mount:1");
  assert.equal(ownerGate.portalKey, "portal-key");
  assert.equal(ownerGate.targetDispatchPathLength, 1);
  assert.equal(ownerGate.dispatchPathRootOwnerMatchCount, 1);
  assert.equal(ownerGate.dispatchPathRootOwnerMismatchCount, 0);
  assert.equal(ownerGate.portalContainerContainsEventTarget, true);
  assert.equal(ownerGate.rootContainerContainsEventTarget, false);
  assert.equal(ownerGate.portalOwnerRootAttached, true);
  assert.equal(ownerGate.publicPortalBubbling, false);
  assert.equal(ownerGate.publicPortalMounting, false);
  assert.equal(ownerGate.eventDispatch, false);
  assert.equal(ownerGate.listenerInvocationCount, 0);
  assert.equal(ownerGate.syntheticEventCount, 0);
  assert.equal(ownerGate.listenerInstallation, false);
  assert.equal(ownerGate.compatibilityClaimed, false);
  assert.deepEqual(
    ownerGate.acceptedCapabilities.map((capability) => capability.id),
    [
      "portal-mounted-child-owner-root",
      "portal-event-target-dispatch-path",
      "portal-event-owner-root-diagnostic"
    ]
  );
  assert.deepEqual(
    ownerGate.blockedCapabilities.map((capability) => capability.id),
    [
      "public-portal-event-bubbling",
      "portal-event-dispatch",
      "portal-listener-installation",
      "browser-dom-compatibility",
      "native-execution",
      "reconciler-execution",
      "dom-mutation",
      "hydration",
      "compatibility-claims"
    ]
  );
  assert.equal(
    hiddenGate.eventOwnerRootGateRecord.kind,
    pluginEventSystem.PORTAL_EVENT_OWNER_ROOT_GATE_RECORD_KIND
  );
  assert.equal(
    hiddenGate.eventOwnerRootGatePayload.ownerRoot,
    create.owner
  );
  assert.equal(hiddenGate.portalContainer, portalContainer);
  assert.equal(hiddenGate.rootContainer, rootContainer);
  assert.equal(
    hiddenGate.targetDispatchPathRecord.entries[0].rootOwner,
    create.owner
  );
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);
  assert.equal(rootContainer.__mutationLog.length, 0);

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
});

test("private portal owner-root gate preserves metadata across a secondary fake root", () => {
  const document = createPortalGateDocument("portal-secondary-root-owner");
  const rootContainer = createPortalGateElement("DIV", document);
  const portalContainer = createPortalGateElement("SECTION", document);
  const portalChild = {
    props: {
      children: "secondary root portal child",
      onClick() {
        throw new Error("secondary root portal listener should stay blocked");
      }
    },
    type: "button"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: "secondary-portal-boundary",
    portalCommitIdPrefix: "secondary-portal-commit",
    portalEventOwnerRootIdPrefix: "secondary-portal-owner",
    portalMountIdPrefix: "secondary-portal-mount"
  });
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const secondaryCreate = bridge.createClientRoot(portalContainer);
  const secondarySideEffects =
    bridge.applyCreateRootSideEffects(secondaryCreate);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    "secondary-portal-key"
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const ownerGate = bridge.createPortalEventOwnerRootGate(mount);
  const hiddenGate =
    rootBridge.getPrivateRootPortalEventOwnerRootGatePayload(ownerGate);
  const pluginGate = hiddenGate.eventOwnerRootGateRecord;
  const pluginPayload =
    pluginEventSystem.getPortalEventOwnerRootGateRecordPayload(pluginGate);
  const dispatchPath = hiddenGate.targetDispatchPathRecord;

  assert.equal(
    ownerGate.portalContainerOwnership.portalContainerMarkedAsRoot,
    true
  );
  assert.equal(
    ownerGate.portalContainerOwnership.portalContainerOwnedByAnotherRoot,
    true
  );
  assert.equal(
    ownerGate.portalContainerOwnership.portalContainerOwnerMatchesRoot,
    false
  );
  assert.equal(
    ownerGate.portalContainerOwnership.portalContainerAvailableForPortal,
    false
  );
  assert.equal(dispatchPath.containerRootBoundaryNode, portalContainer);
  assert.equal(dispatchPath.containerRootBoundaryOwner, secondaryCreate.owner);
  assert.equal(dispatchPath.containerRootOwnerMatchesTargetRoot, false);
  assert.equal(dispatchPath.ownerRootPreservedAcrossContainerRoot, true);
  assert.equal(
    dispatchPath.ownerRootPreservedAcrossForeignContainerRoot,
    true
  );
  assert.equal(pluginGate.ownerRootMatchesTargetRoot, true);
  assert.equal(pluginGate.dispatchPathRootOwnerMismatchCount, 0);
  assert.equal(pluginGate.portalContainerContainsTarget, true);
  assert.equal(pluginGate.portalContainerMatchesDispatchRootBoundary, true);
  assert.equal(pluginGate.portalContainerOwnedBySecondaryRoot, true);
  assert.equal(pluginGate.portalContainerRootOwnerPresent, true);
  assert.equal(pluginGate.portalContainerRootOwnerMatchesPortalOwner, false);
  assert.equal(pluginGate.ownerRootPreservedAcrossPortalContainerRoot, true);
  assert.equal(pluginGate.ownerRootPreservedAcrossSecondaryPortalRoot, true);
  assert.equal(pluginPayload.portalContainerRootOwner, secondaryCreate.owner);
  assert.equal(pluginPayload.ownerRoot, create.owner);
  assert.equal(pluginGate.publicPortalBubblingEnabled, false);
  assert.equal(pluginGate.publicDispatchEnabled, false);
  assert.equal(pluginGate.publicDispatchBlocked, true);
  assert.equal(pluginGate.eventDispatch, false);
  assert.equal(pluginGate.listenerInvocationCount, 0);
  assert.equal(pluginGate.syntheticEventCount, 0);
  assert.equal(ownerGate.publicPortalBubbling, false);
  assert.equal(ownerGate.eventDispatch, false);
  assert.equal(ownerGate.listenerInstallation, false);
  assert.equal(ownerGate.compatibilityClaimed, false);

  bridge.revertCreateRootSideEffects(secondarySideEffects);
  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
});

test("private portal child reconciliation admits one fake-DOM HostComponent update while public mounting stays blocked", () => {
  const document = createPortalGateDocument("portal-child-reconciliation");
  const rootContainer = createPortalGateElement("DIV", document);
  const portalContainer = createPortalGateElement("SECTION", document);
  const portalChild = {
    props: {
      children: "portal child"
    },
    type: "span"
  };
  const updatedPortalChild = {
    props: {
      children: "updated portal child",
      "data-phase": "updated",
      title: "updated title"
    },
    type: "span"
  };
  const bridge = rootBridge.createPrivateRootBridgeShell({
    portalBoundaryIdPrefix: "portal-boundary",
    portalChildReconciliationIdPrefix: "portal-child",
    portalCommitIdPrefix: "portal-commit",
    portalMountIdPrefix: "portal-mount"
  });
  const create = bridge.createClientRoot(rootContainer);
  const rootSideEffects = bridge.applyCreateRootSideEffects(create);
  const portal = reactDom.createPortal(
    portalChild,
    portalContainer,
    "portal-key"
  );
  const render = bridge.renderContainer(create.handle, portal);
  const boundary = bridge.createPortalRootBoundary(render);
  const handoff = bridge.createPortalCommitHandoff(boundary, {
    pendingChildren: [portalChild]
  });
  const mount = bridge.createPortalFakeDomMountDiagnostic(handoff, {
    explicitChild: portalChild
  });
  const hiddenMount =
    rootBridge.getPrivateRootPortalFakeDomMountPayload(mount);
  const updatedPortal = reactDom.createPortal(
    updatedPortalChild,
    portalContainer,
    "portal-key"
  );
  const updateRender = bridge.renderContainer(create.handle, updatedPortal);
  const updateBoundary = bridge.createPortalRootBoundary(updateRender);

  hiddenMount.hostComponentNode.attributeLog = [];
  hiddenMount.hostTextNode.__mutationLog = [];
  const diagnostic = bridge.createPortalChildReconciliationDiagnostic(
    mount,
    updateBoundary,
    {
      explicitChild: updatedPortalChild
    }
  );
  const hiddenDiagnostic =
    rootBridge.getPrivateRootPortalChildReconciliationDiagnosticPayload(
      diagnostic
    );

  assert.equal(
    diagnostic.kind,
    "FastReactDomPrivateRootPortalChildReconciliationDiagnosticRecord"
  );
  assert.equal(
    diagnostic.reconciliationStatus,
    "admitted-private-root-portal-child-reconciliation-diagnostic"
  );
  assert.equal(
    diagnostic.publicMountStatus,
    "blocked-public-root-portal-mounting"
  );
  assert.equal(diagnostic.sourceMountDiagnosticId, "portal-mount:1");
  assert.equal(diagnostic.sourceBoundaryId, "portal-boundary:2");
  assert.equal(diagnostic.sourceUpdateId, updateRender.updateId);
  assert.equal(diagnostic.hostComponentType, "span");
  assert.equal(diagnostic.previousHostText, "portal child");
  assert.equal(diagnostic.nextHostText, "updated portal child");
  assert.equal(diagnostic.latestPropsPublished, true);
  assert.equal(diagnostic.portalChildReconciliation, true);
  assert.equal(diagnostic.singleHostComponentUpdate, true);
  assert.equal(diagnostic.portalHostComponentUpdated, true);
  assert.equal(diagnostic.portalHostTextUpdated, true);
  assert.equal(diagnostic.portalContainerChildrenReplaced, false);
  assert.equal(diagnostic.portalMounting, false);
  assert.equal(diagnostic.publicPortalMounting, false);
  assert.equal(diagnostic.preparePortalMount, false);
  assert.equal(diagnostic.nativeExecution, false);
  assert.equal(diagnostic.reconcilerExecution, false);
  assert.equal(diagnostic.domMutation, true);
  assert.equal(diagnostic.publicDomMutation, false);
  assert.equal(diagnostic.listenerInstallation, false);
  assert.equal(diagnostic.resourceSideEffects, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  assert.deepEqual(
    diagnostic.acceptedCapabilities.map((capability) => capability.id),
    [
      "portal-accepted-boundary",
      "portal-fake-dom-host-component-update",
      "portal-fake-dom-host-text-update",
      "portal-latest-props-after-mutation"
    ]
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities.map((capability) => capability.id),
    [
      "portal-public-container-mounting",
      "portal-generic-child-reconciliation",
      "portal-container-replacement",
      "portal-prepare-mount-listeners",
      "portal-resource-side-effects",
      "native-execution",
      "reconciler-execution",
      "hydration",
      "events",
      "compatibility-claims"
    ]
  );
  assert.equal(hiddenDiagnostic.mountRecord, mount);
  assert.equal(hiddenDiagnostic.boundaryRecord, updateBoundary);
  assert.equal(hiddenDiagnostic.previousProps, portalChild.props);
  assert.equal(hiddenDiagnostic.nextProps, updatedPortalChild.props);
  assert.deepEqual(attributeEntries(hiddenMount.hostComponentNode), [
    ["data-phase", "updated"],
    ["title", "updated title"]
  ]);
  assert.deepEqual(hiddenMount.hostTextNode.__mutationLog, [
    {
      type: "nodeValue",
      value: "updated portal child"
    }
  ]);
  assert.equal(portalContainer.textContent, "updated portal child");
  assert.equal(portalContainer.childNodes.length, 1);
  assert.equal(portalContainer.__registrations.length, 0);
  assert.equal(listenerRegistry.hasListeningMarker(portalContainer), false);

  assert.throws(
    () =>
      bridge.createPortalChildReconciliationDiagnostic(mount, updateBoundary, {
        explicitChild: {
          props: {
            children: "not the portal child"
          },
          type: "span"
        }
      }),
    {
      code: "FAST_REACT_DOM_INVALID_PORTAL_CHILD_RECONCILIATION_RECORD"
    }
  );

  bridge.revertCreateRootSideEffects(rootSideEffects);
  assert.equal(rootContainer.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(portalContainer.__registrations.length, 0);
});

test("portal root-render gate sees accepted reconciler fail-closed diagnostics", () => {
  const boundary = inspectReactDomPortalRootRenderBlockedBoundary();
  const diagnostics = boundary.reconcilerDiagnostics;

  assert.equal(diagnostics.loadError, null);
  assert.equal(diagnostics.beginWorkErrorVariantPresent, true);
  assert.equal(diagnostics.beginWorkPortalTagGuardPresent, true);
  assert.equal(diagnostics.beginWorkUnsupportedFeatureConstantPresent, true);
  assert.equal(diagnostics.beginWorkUnsupportedPortalRecordPresent, true);
  assert.equal(diagnostics.rootPreflightErrorVariantPresent, true);
  assert.equal(diagnostics.rootPreflightNoDelegationTestPresent, true);
  assert.equal(diagnostics.rootPreflightPortalTagGuardPresent, true);
});

test("portal root-render gate fails if the public root E2E oracle stops being blocked", () => {
  const currentOracle = JSON.parse(JSON.stringify(oracle));
  currentOracle.fastReactComparisons["default-node-development"][0] = {
    ...currentOracle.fastReactComparisons["default-node-development"][0],
    compatibilityClaimed: true,
    status: "matched-react-dom-19.2.6-oracle"
  };

  const result = evaluateReactDomPortalRootRenderBlockedGate({
    checkedOracle: oracle,
    currentOracle
  });

  assert.equal(result.ok, false);
  assert.ok(
    result.failures.some(
      (failure) =>
        failure.gateStatus ===
        "portal-root-render-public-comparison-not-blocked"
    )
  );
});

function assertPortalSummary(portal, expectedKey) {
  assert.deepEqual(portal.brand, {
    description: "react.portal",
    keyFor: "react.portal",
    stringValue: "Symbol(react.portal)"
  });
  assert.equal(portal.childrenIdentityPreserved, true);
  assert.equal(portal.containerInfoIdentityPreserved, true);
  assert.deepEqual(portal.implementation, {
    type: "null"
  });
  assert.deepEqual(portal.key, {
    type: "string",
    value: expectedKey
  });
  assert.deepEqual(portal.objectKeys, [
    "$$typeof",
    "key",
    "children",
    "containerInfo",
    "implementation"
  ]);
  assert.deepEqual(portal.ownKeys, [
    { type: "string", value: "$$typeof" },
    { type: "string", value: "key" },
    { type: "string", value: "children" },
    { type: "string", value: "containerInfo" },
    { type: "string", value: "implementation" }
  ]);
  assert.deepEqual(portal.type, {
    keys: ["$$typeof", "children", "containerInfo", "implementation", "key"],
    type: "object"
  });
}

function assertPrivatePortalRootBoundary(record) {
  assert.equal(
    record.kind,
    "FastReactDomPrivateRootPortalBoundaryRecord"
  );
  assert.equal(record.operation, "portal-root-boundary");
  assert.equal(
    record.boundaryStatus,
    "admitted-private-root-portal-boundary-record"
  );
  assert.equal(
    record.diagnosticStatus,
    "blocked-private-root-portal-diagnostic"
  );
  assert.equal(record.sourceRequestType, "root.render");
  assert.equal(record.rootKind, "client");
  assert.equal(record.rootTag, "ConcurrentRoot");
  assert.equal(record.portalKey, "portal-key");
  assert.deepEqual(record.portalObjectInfo, {
    keys: ["$$typeof", "children", "containerInfo", "implementation", "key"],
    type: "object"
  });
  assert.deepEqual(record.portalImplementationInfo, {
    type: "null"
  });
  assert.equal(record.acceptedPortalObjectShape, true);
  assert.deepEqual(record.reconcilerDiagnostic, {
    beginWorkRecord: "UnsupportedPortalBeginWorkRecord",
    failClosedBeforeChildren: true,
    feature: "portal",
    rootPreflightError:
      "HostRootChildBeginWorkPreflightError::UnsupportedPortal",
    unsupportedFeature: "PORTAL_RECONCILER_UNSUPPORTED_FEATURE"
  });
}

function createPortalGateDocument(label) {
  const document = createPortalGateEventTarget({
    label,
    nodeName: "#document",
    nodeType: domContainer.DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createPortalGateEventTarget({
    label: `${label}-window`
  });
  document.createElement = function createFakeElement(tagName) {
    const nodeName = String(tagName).toUpperCase();
    this.__mutationLog.push({
      nodeName,
      type: "createElement"
    });
    return createPortalGateElement(nodeName, this);
  };
  document.createTextNode = function createFakeTextNode(text) {
    const value = String(text);
    this.__mutationLog.push({
      type: "createTextNode",
      value
    });
    return createPortalGateText(value, this);
  };
  return document;
}

function createPortalGateElement(nodeName, ownerDocument) {
  return createPortalGateEventTarget({
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument
  });
}

function createPortalGateEventTarget(fields) {
  const target = {
    ...fields,
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    __mutationLog: [],
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
      detachPortalGateNode(child);
      this.childNodes.push(child);
      child.parentNode = this;
      this.__mutationLog.push({ child, type: "appendChild" });
      return child;
    },
    insertBefore(child, beforeChild) {
      detachPortalGateNode(child);
      const beforeIndex = this.childNodes.indexOf(beforeChild);
      if (beforeIndex === -1) {
        this.childNodes.push(child);
      } else {
        this.childNodes.splice(beforeIndex, 0, child);
      }
      child.parentNode = this;
      this.__mutationLog.push({ beforeChild, child, type: "insertBefore" });
      return child;
    },
    removeChild(child) {
      const childIndex = this.childNodes.indexOf(child);
      if (childIndex !== -1) {
        this.childNodes.splice(childIndex, 1);
        child.parentNode = null;
      }
      this.__mutationLog.push({ child, type: "removeChild" });
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
      this.attributeLog.push([
        "removeAttribute",
        attributeName,
        hadAttribute
      ]);
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
        detachPortalGateNode(child);
      }
      textContent = value;
      this.__mutationLog.push({ type: "textContent", value });
    }
  });
  return target;
}

function createPortalGateText(text, ownerDocument) {
  const node = createPortalGateEventTarget({
    nodeName: "#text",
    nodeType: domContainer.TEXT_NODE,
    ownerDocument
  });
  let value = String(text);
  Object.defineProperties(node, {
    data: {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(nextValue) {
        this.nodeValue = nextValue;
      }
    },
    nodeValue: {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(nextValue) {
        value = String(nextValue);
        this.__mutationLog.push({
          type: "nodeValue",
          value
        });
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        return value;
      },
      set(nextValue) {
        this.nodeValue = nextValue;
      }
    }
  });
  return node;
}

function detachPortalGateNode(child) {
  if (child == null || typeof child !== "object" || child.parentNode == null) {
    return;
  }

  const siblings = child.parentNode.childNodes;
  if (Array.isArray(siblings)) {
    const index = siblings.indexOf(child);
    if (index !== -1) {
      siblings.splice(index, 1);
    }
  }
  child.parentNode = null;
}

function attributeEntries(node) {
  return [...node.attributes.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
}
