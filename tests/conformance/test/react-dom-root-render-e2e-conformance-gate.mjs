import assert from "node:assert/strict";
import test from "node:test";

import {
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES
} from "../src/react-dom-root-render-e2e-targets.mjs";
import {
  readCheckedReactDomRootRenderE2EOracle
} from "../src/react-dom-root-render-e2e-oracle.mjs";
import {
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_BLOCKED_SURFACES,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_CLAIM_KEYS,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS,
  REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_REACT_DOM_METADATA_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ACCEPTED_STATUS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS,
  REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_CLAIM_KEYS,
  evaluateReactDomRootRenderE2EConformanceGate,
  inspectReactDomRootRenderE2EPrivateRootWorkLoopCommitHandoffDiagnostics
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
      "worker-674-public-facade-unmount-ref-passive-cleanup",
      "worker-513-event-type-dispatch-canary",
      "worker-514-portal-event-error-routing",
      "worker-528-hydration-replay-error-metadata",
      "worker-708-hydration-text-node-claim-patch",
      "worker-533-controlled-restore-queue-write-preflight",
      "worker-641-public-facade-root-render-execution"
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
  assert.equal(
    result.summary.privatePromotion503533RejectedRowCount,
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.length
  );
  assert.deepEqual(
    result.privatePromotion503533Gate.rejectedPrivateMetadataIds,
    REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_ROWS.map(
      (row) => row.id
    )
  );
  assert.equal(result.summary.privatePromotion503533CompatibilityClaimed, false);
  assert.equal(
    result.summary.privatePromotion503533PublicRootCompatibilitySurface,
    false
  );
  assert.equal(
    result.summary.privatePromotion503533PublicRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privatePromotion503533PublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privatePromotion503533PublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privatePromotion503533PublicEventCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privatePromotion503533PublicResourceCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privatePromotion503533PublicFormCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privatePromotion503533PublicControlledInputCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary.privatePromotion503533PublicTestRendererCompatibilityClaimed,
    false
  );
  assert.deepEqual(
    result.privatePromotionRejectionRows503533.map((row) => row.workerId),
    Array.from({ length: 31 }, (_, index) => String(503 + index))
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

  for (const row of result.privatePromotionRejectionRows503533) {
    assert.equal(
      row.gateStatus,
      REACT_DOM_ROOT_PUBLIC_FACADE_PRIVATE_PROMOTION_503_533_REJECTED_STATUS
    );
    assert.equal(row.admission, "accepted-private-diagnostic");
    assert.equal(row.promotion, "rejected");
    assert.equal(row.privateEvidenceOnly, true);
    assert.equal(row.comparedToReactDomOracle, false);
    assert.equal(row.comparedToReactTestRendererOracle, false);
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
  assert.equal(
    developmentRows["worker-641-public-facade-root-render-execution"]
      .metadataEvidence.returnedHostOutputDiagnostic,
    true
  );
  assert.equal(
    developmentRows["worker-641-public-facade-root-render-execution"]
      .metadataEvidence.textContent,
    "facade root.render output"
  );
});

test("root render E2E gate admits private root work-loop and commit handoff rows only as source evidence", () => {
  const result = evaluateReactDomRootRenderE2EConformanceGate({
    checkedOracle: oracle,
    currentOracle: oracle
  });
  const expectedRowCount =
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS.length *
    REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES.length;

  assert.equal(result.ok, true);
  assert.equal(
    result.summary.privateRootWorkLoopCommitHandoffDiagnosticRowCount,
    expectedRowCount
  );
  assert.deepEqual(
    result.privateRootWorkLoopCommitHandoffGate
      .admittedPrivateRootWorkLoopCommitHandoffIds,
    REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ADMISSIONS.map(
      (admission) => admission.metadataId
    )
  );
  assert.equal(
    result.summary.privateRootWorkLoopCommitHandoffCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicRootCompatibilitySurface,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicCreateRootCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicRootUpdateCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicRootUnmountCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicHydrateRootCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicDomMutationCompatibilityClaimed,
    false
  );
  assert.equal(
    result.summary
      .privateRootWorkLoopCommitHandoffPublicTestRendererCompatibilityClaimed,
    false
  );

  for (const row of result.privateRootWorkLoopCommitHandoffDiagnosticRows) {
    assert.equal(
      row.gateStatus,
      REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_ACCEPTED_STATUS
    );
    assert.equal(row.publicFacadeGateStatus, "blocked-unsupported-root-e2e");
    assert.equal(row.privateEvidenceOnly, true);
    assert.equal(row.comparedToReactDomOracle, false);
    assert.equal(row.comparedToReactTestRendererOracle, false);
    assert.equal(row.compatibilityClaimed, false);
    for (const claimKey of REACT_DOM_ROOT_RENDER_E2E_PRIVATE_ROOT_WORK_LOOP_COMMIT_HANDOFF_CLAIM_KEYS) {
      assert.equal(row[claimKey], false, `${row.metadataId} ${claimKey}`);
      assert.equal(
        row.publicCompatibilityClaims[claimKey],
        false,
        `${row.metadataId} publicCompatibilityClaims.${claimKey}`
      );
    }
  }

  const developmentRows = Object.fromEntries(
    result.privateRootWorkLoopCommitHandoffDiagnosticRows
      .filter((row) => row.modeId === "default-node-development")
      .map((row) => [row.metadataId, row])
  );
  assert.equal(
    developmentRows["worker-534-root-work-loop-finished-work-commit-handoff"]
      .sourceEvidence.hostComponentCommitDiagnosticTestPresent,
    true
  );
  assert.equal(
    developmentRows["worker-534-root-work-loop-finished-work-commit-handoff"]
      .sourceEvidence.publicRootRenderingBlockedAssertionPresent,
    true
  );
  assert.equal(
    developmentRows[
      "worker-534-root-commit-finished-work-record-consumption"
    ].sourceEvidence.identityLanesRootTokenOrderTestPresent,
    true
  );
  assert.equal(
    developmentRows[
      "worker-534-root-commit-finished-work-record-consumption"
    ].sourceEvidence.missingRecordRejectionTestPresent,
    true
  );
});

test("root render E2E gate rejects real handoff source metadata promotion", () => {
  const diagnostics = clone(
    inspectReactDomRootRenderE2EPrivateRootWorkLoopCommitHandoffDiagnostics()
  );
  diagnostics.rows[0].evidence.compatibilityClaimed = true;
  diagnostics.rows[0].evidence.publicRootCompatibilitySurface = true;
  diagnostics.rows[0].evidence.publicCreateRootCompatibilityClaimed = true;
  diagnostics.rows[0].evidence.publicRootRenderCompatibilityClaimed = true;
  diagnostics.rows[0].evidence.publicRootUpdateCompatibilityClaimed = true;
  diagnostics.rows[0].evidence.publicRootUnmountCompatibilityClaimed = true;
  diagnostics.rows[0].evidence.publicHydrateRootCompatibilityClaimed = true;
  diagnostics.rows[0].evidence.publicCompatibilityClaims = {
    ...diagnostics.rows[0].evidence.publicCompatibilityClaims,
    publicRootCompatibilitySurface: true,
    publicCreateRootCompatibilityClaimed: true
  };

  const result = evaluateReactDomRootRenderE2EConformanceGate({
    checkedOracle: oracle,
    currentOracle: oracle,
    privateRootWorkLoopCommitHandoffDiagnostics: diagnostics
  });

  assert.equal(result.ok, false);
  assert.ok(
    result.failures.some(
      (failure) =>
        failure.gateStatus ===
        "private-root-work-loop-commit-handoff-common-evidence-mismatch"
    )
  );
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
