import assert from "node:assert/strict";
import test from "node:test";

import {
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES
} from "../src/react-dom-root-render-e2e-targets.mjs";
import {
  readCheckedReactDomRootRenderE2EOracle
} from "../src/react-dom-root-render-e2e-oracle.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS,
  evaluateReactDomRootRenderE2EConformanceGate
} from "../src/react-dom-root-render-e2e-conformance-gate.mjs";

const oracle = readCheckedReactDomRootRenderE2EOracle();

test("root render E2E gate admits only accepted private React DOM metadata rows", () => {
  const result = evaluateReactDomRootRenderE2EConformanceGate({
    checkedOracle: oracle,
    currentOracle: oracle
  });
  const expectedRowCount =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS.length *
    REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  assert.equal(result.ok, true);
  assert.equal(
    result.summary.privateReactDomMetadataDiagnosticRowCount,
    expectedRowCount
  );
  assert.deepEqual(
    result.privateReactDomMetadataGate.admittedPrivateReactDomMetadataIds,
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS.map(
      (admission) => admission.metadataId
    )
  );
  assert.deepEqual(
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS.filter(
      (admission) => Number(admission.workerId) >= 503
    ).map((admission) => admission.metadataId),
    [
      "worker-505-form-action-event-extraction",
      "worker-506-form-reset-queue-commit",
      "worker-507-resource-map-commit",
      "worker-508-stylesheet-load-error-state",
      "worker-509-controlled-restore-flush-order",
      "worker-510-controlled-radio-sibling-props",
      "worker-511-public-facade-host-output-update",
      "worker-512-public-facade-unmount-cleanup",
      "worker-513-event-type-dispatch-canary",
      "worker-514-portal-event-error-routing",
      "worker-528-hydration-replay-error-metadata",
      "worker-533-controlled-restore-queue-write-preflight"
    ]
  );
  assert.equal(result.summary.privateReactDomMetadataCompatibilityClaimed, false);
  assert.equal(
    result.summary
      .privateReactDomMetadataPublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privateReactDomMetadataPublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privateReactDomMetadataPublicEventCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privateReactDomMetadataPublicResourceCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privateReactDomMetadataPublicFormCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateReactDomMetadataPublicControlledInputCompatibilityClaimed,
    false
  );

  for (const row of result.privateReactDomMetadataDiagnosticRows) {
    assert.equal(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS
    );
    assert.equal(row.publicFacadeGateStatus, "blocked-unsupported-root-e2e");
    assert.equal(row.publicRootCompatibilitySurface, false);
    assert.equal(row.comparedToReactDomOracle, false);
    assert.equal(row.compatibilityClaimed, false);
    assert.equal(row.publicRootRenderCompatibilityClaimed, false);
    assert.equal(row.publicHydrationCompatibilityClaimed, false);
    assert.equal(row.publicEventCompatibilityClaimed, false);
    assert.equal(row.publicResourceCompatibilityClaimed, false);
    assert.equal(row.publicFormCompatibilityClaimed, false);
    assert.equal(row.publicControlledInputCompatibilityClaimed, false);
  }

  const developmentRows = Object.fromEntries(
    result.privateReactDomMetadataDiagnosticRows
      .filter((row) => row.modeId === "default-node-development")
      .map((row) => [row.metadataId, row])
  );

  assert.equal(
    developmentRows["worker-486-public-facade-host-output"].metadataEvidence
      .textContent,
    "facade host output"
  );
  assert.equal(
    developmentRows["worker-487-event-prevent-default"].metadataEvidence
      .defaultPrevented,
    true
  );
  assert.equal(
    developmentRows["worker-488-event-listener-error-routing"].metadataEvidence
      .rootErrorOptionCallbackRecordStatus,
    "accepted-private-root-error-option-callback-record"
  );
  assert.equal(
    developmentRows["worker-489-hydration-event-replay-ownership"]
      .metadataEvidence.ownershipRetainedThroughDrainOrder,
    true
  );
  assert.equal(
    developmentRows["worker-490-controlled-checkable-restore"].metadataEvidence
      .queueRadioGroupRestoreIntentRecorded,
    true
  );
  assert.equal(
    developmentRows["worker-491-resource-stylesheet-precedence"].metadataEvidence
      .resourceMapCreated,
    false
  );
  assert.equal(
    developmentRows["worker-492-form-submit-reset-metadata"].metadataEvidence
      .requestSubmitWouldDispatchSubmitEvent,
    true
  );
  assert.deepEqual(
    developmentRows["worker-505-form-action-event-extraction"].metadataEvidence
      .submissionTriggers,
    ["submit", "requestSubmit"]
  );
  assert.equal(
    developmentRows["worker-505-form-action-event-extraction"].metadataEvidence
      .syntheticEventCreated,
    false
  );
  assert.equal(
    developmentRows["worker-506-form-reset-queue-commit"].metadataEvidence
      .resetTraversalWouldRunAfterMutationEffects,
    true
  );
  assert.deepEqual(
    developmentRows["worker-507-resource-map-commit"].metadataEvidence
      .recordKinds,
    ["preload", "stylesheet", "preload", "script"]
  );
  assert.deepEqual(
    developmentRows["worker-508-stylesheet-load-error-state"].metadataEvidence
      .loadingBitmasks,
    [0, 1, 2, 3, 4]
  );
  assert.deepEqual(
    developmentRows["worker-509-controlled-restore-flush-order"]
      .metadataEvidence.acceptedRestoreKinds,
    ["input-text-value", "input-radio-checked"]
  );
  assert.equal(
    developmentRows["worker-510-controlled-radio-sibling-props"]
      .metadataEvidence.acceptedSameNameSameFormCount,
    1
  );
  assert.equal(
    developmentRows["worker-511-public-facade-host-output-update"]
      .metadataEvidence.latestTextContent,
    "updated facade output"
  );
  assert.equal(
    developmentRows["worker-512-public-facade-unmount-cleanup"].metadataEvidence
      .rootContainerChildrenCleared,
    true
  );
  assert.deepEqual(
    developmentRows["worker-513-event-type-dispatch-canary"].metadataEvidence
      .cases.map((row) => row.eventPriorityName),
    ["DiscreteEventPriority", "ContinuousEventPriority", "DefaultEventPriority"]
  );
  assert.equal(
    developmentRows["worker-514-portal-event-error-routing"].metadataEvidence
      .portalEventOwnerRootGateLinked,
    true
  );
  assert.equal(
    developmentRows["worker-528-hydration-replay-error-metadata"]
      .metadataEvidence.rootErrorOptionCallbackRecordCount,
    3
  );
  assert.deepEqual(
    developmentRows["worker-533-controlled-restore-queue-write-preflight"]
      .metadataEvidence.writeIntentQueueSlots,
    ["restore-target", "restore-queue"]
  );
});
