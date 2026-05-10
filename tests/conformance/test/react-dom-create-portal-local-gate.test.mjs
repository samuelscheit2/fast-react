import assert from "node:assert/strict";
import test from "node:test";

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
