import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_806_EVENT_REPLAY_FIELD_NAMES,
  PRIVATE_ADMISSION_806_GATE_STATUS,
  PRIVATE_ADMISSION_806_MARKER_LISTENER_FIELD_NAMES,
  PRIVATE_ADMISSION_806_MATRIX_FIELD_NAMES,
  PRIVATE_ADMISSION_806_PACKAGE_SURFACE_EVIDENCE,
  PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELD_EVIDENCE,
  PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_806_RECOVERABLE_ERROR_FIELD_NAMES,
  PRIVATE_ADMISSION_806_RECORD_TYPES,
  PRIVATE_ADMISSION_806_REQUIRED_CHAIN,
  PRIVATE_ADMISSION_806_REQUIRED_DIAGNOSTIC_IDS,
  PRIVATE_ADMISSION_806_REQUIRED_STATUSES,
  PRIVATE_ADMISSION_806_REQUIRED_WORKERS,
  PRIVATE_ADMISSION_806_ROWS,
  PRIVATE_ADMISSION_806_TARGET_CLAIMING_FIELD_NAMES,
  PRIVATE_ADMISSION_806_VIOLATION_STATUS,
  PRIVATE_ADMISSION_806_WORKERS,
  evaluatePrivateAdmission806Gate
} from "../src/private-admission-806-hydrateroot-preflight-ledger.mjs";

const worker762 = "worker-762-hydration-marker-listener-private-gate";
const worker770 = "worker-770-hydrateroot-target-claiming-preflight";
const worker776 = "worker-776-hydrateroot-recoverable-error-preflight";
const worker786 = "worker-786-hydrateroot-event-replay-preflight";
const worker797 = "worker-797-hydrateroot-preflight-conformance-matrix";

const expectedWorkers = [worker762, worker770, worker776, worker786, worker797];

test("private admission 806 manifest pins hydrateRoot preflight workers and record types", () => {
  assert.deepEqual(PRIVATE_ADMISSION_806_REQUIRED_WORKERS, expectedWorkers);
  assert.deepEqual(PRIVATE_ADMISSION_806_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_806_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_806_ROWS.length, 5);
  assert.equal(new Set(PRIVATE_ADMISSION_806_WORKERS).size, 5);
  assert.equal(
    PRIVATE_ADMISSION_806_RECORD_TYPES.hydrateRootPublicFacadePreflight,
    "fast.react_dom.private_hydrate_root_public_facade_preflight"
  );
  assert.equal(
    PRIVATE_ADMISSION_806_RECORD_TYPES.markerListenerPreflight,
    "fast.react_dom.private_hydrate_root_public_facade_marker_listener_preflight_record"
  );
  assert.equal(
    PRIVATE_ADMISSION_806_RECORD_TYPES.targetClaimingPreflight,
    "fast.react_dom.private_hydrate_root_public_facade_target_claiming_preflight_record"
  );
  assert.equal(
    PRIVATE_ADMISSION_806_RECORD_TYPES.eventReplayPreflight,
    "fast.react_dom.private_hydrate_root_public_facade_event_replay_preflight_record"
  );
  assert.deepEqual(PRIVATE_ADMISSION_806_REQUIRED_CHAIN[worker797], [
    worker762,
    worker770,
    worker776,
    worker786
  ]);
  assert.equal(
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS.includes(
      "publicHydrateRootEnabled"
    ),
    true
  );
  assert.equal(
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS.includes(
      "packageCompatibilityClaimed"
    ),
    true
  );
  assert.equal(
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS.includes("canHydrate"),
    true
  );
  assert.equal(
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS.includes(
      "replayQueueDrained"
    ),
    true
  );
});

test("private admission 806 gate recognizes static hydrateRoot preflight evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission806Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_806_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.diagnosticsRecognized, true);
  assert.equal(gate.statusesRecognized, true);
  assert.equal(gate.ownershipChainRecognized, true);
  assert.equal(gate.fieldNamesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicBlockerClaimViolationIds, []);
  assert.deepEqual(gate.packageCompatibilityClaimIds, []);
  assert.deepEqual(gate.publicHydrationCompatibilityClaimIds, []);
  assert.deepEqual(
    [...gate.publicBlockerFieldCoverageFields].sort(),
    [...PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS].sort()
  );

  assertLedgerRow(gate.rowsByWorker[worker762], {
    privateAdmission: "accepted-private-hydrateroot-marker-listener-preflight",
    evidenceChain: "marker-listener-preflight",
    requiredFieldNames: PRIVATE_ADMISSION_806_MARKER_LISTENER_FIELD_NAMES
  });
  assertLedgerRow(gate.rowsByWorker[worker770], {
    privateAdmission: "accepted-private-hydrateroot-target-claiming-preflight",
    evidenceChain: "marker-listener-to-target-claiming",
    requiredFieldNames: PRIVATE_ADMISSION_806_TARGET_CLAIMING_FIELD_NAMES
  });
  assertLedgerRow(gate.rowsByWorker[worker776], {
    privateAdmission:
      "accepted-private-hydrateroot-recoverable-error-preflight",
    evidenceChain: "recoverable-error-preflight",
    requiredFieldNames: PRIVATE_ADMISSION_806_RECOVERABLE_ERROR_FIELD_NAMES
  });
  assertLedgerRow(gate.rowsByWorker[worker786], {
    privateAdmission: "accepted-private-hydrateroot-event-replay-preflight",
    evidenceChain: "target-claiming-to-event-replay",
    requiredFieldNames: PRIVATE_ADMISSION_806_EVENT_REPLAY_FIELD_NAMES
  });
  assertLedgerRow(gate.rowsByWorker[worker797], {
    privateAdmission:
      "accepted-private-hydrateroot-preflight-ownership-matrix",
    evidenceChain: "marker-listener-recoverable-target-event-matrix",
    requiredFieldNames: PRIVATE_ADMISSION_806_MATRIX_FIELD_NAMES
  });

  for (const evidenceRow of gate.packageSurfaceEvidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.role);
  }
  for (const evidenceRow of gate.publicBlockerEvidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.role);
  }
});

test("private admission 806 public blocker evidence is field-scoped", () => {
  assert.deepEqual(
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELD_EVIDENCE
      .map((evidenceRow) => evidenceRow.field)
      .sort(),
    [...PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELDS].sort()
  );

  for (const evidenceRow of PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELD_EVIDENCE) {
    assert.notEqual(evidenceRow.sliceStart, null, evidenceRow.field);
    assert.notEqual(evidenceRow.sliceEnd, null, evidenceRow.field);
  }

  assert.deepEqual(
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELD_EVIDENCE
      .filter(
        (evidenceRow) =>
          evidenceRow.path === "packages/react-dom/src/client/root-bridge.js"
      )
      .map((evidenceRow) => evidenceRow.field)
      .sort(),
    ["nativeExecution", "reconcilerExecution"]
  );
});

test("private admission 806 gate rejects missing evidence tokens and package-surface leaks", () => {
  const packageEvidence = PRIVATE_ADMISSION_806_PACKAGE_SURFACE_EVIDENCE.map(
    (evidenceRow) => {
      if (evidenceRow.role !== "react-dom-package-exports-public-client-only") {
        return evidenceRow;
      }
      return {
        ...evidenceRow,
        tokens: [...evidenceRow.tokens, "missing-hydrateroot-package-token"]
      };
    }
  );
  const publicBlockerFieldEvidence =
    PRIVATE_ADMISSION_806_PUBLIC_BLOCKER_FIELD_EVIDENCE.map((evidenceRow) => {
      if (evidenceRow.field !== "publicRootCreated") {
        return evidenceRow;
      }
      return {
        ...evidenceRow,
        tokens: [...evidenceRow.tokens, "missing-public-root-created-token"]
      };
    });
  const gate = evaluatePrivateAdmission806Gate({
    packageSurfaceEvidence: packageEvidence,
    publicBlockerFieldEvidence,
    rowOverrides: {
      [worker762]: {
        evidence: withMissingEvidenceToken(
          rowByWorker(worker762),
          "worker-762-root-bridge-marker-listener-source",
          "missing-marker-listener-source-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_806_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, [
    "hydrateroot-admission-evidence-token-missing",
    "hydrateroot-package-surface-evidence-mismatch",
    "hydrateroot-public-blocker-field-mismatch",
    "hydrateroot-public-blocker-evidence-missing"
  ]);
  assertEvidenceRoleRecognized(
    gate,
    worker762,
    "worker-762-root-bridge-marker-listener-source",
    false
  );
  assert.deepEqual(gate.packageEvidenceMismatchRows.map((row) => row.role), [
    "react-dom-package-exports-public-client-only"
  ]);
  assert.deepEqual(gate.publicBlockerEvidenceMismatchRows.map((row) => row.field), [
    "publicRootCreated"
  ]);
});

test("private admission 806 gate rejects drift in durable statuses, ids, fields, and ownership chain", () => {
  const gate = evaluatePrivateAdmission806Gate({
    rowOverrides: {
      [worker770]: {
        acceptedStatuses: PRIVATE_ADMISSION_806_REQUIRED_STATUSES[
          worker770
        ].filter(
          (status) =>
            status !==
            "preflighted-private-hydrate-root-public-facade-target-claiming-gate"
        ),
        acceptedDiagnosticIds: PRIVATE_ADMISSION_806_REQUIRED_DIAGNOSTIC_IDS[
          worker770
        ].filter(
          (diagnosticId) =>
            diagnosticId !== "hydrate-root-target-claiming-canonical-evidence"
        ),
        evidence: withoutEvidenceFieldName(
          rowByWorker(worker770),
          "worker-770-root-bridge-target-claiming-source",
          "canonicalTargetClaimingEvidence"
        ),
        requiredPriorWorkers: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_806_VIOLATION_STATUS);
  assert.equal(gate.diagnosticsRecognized, false);
  assert.equal(gate.statusesRecognized, false);
  assert.equal(gate.ownershipChainRecognized, false);
  assert.equal(gate.fieldNamesRecognized, false);
  assertViolationIds(gate, [
    "hydrateroot-admission-diagnostic-id-mismatch",
    "hydrateroot-admission-status-mismatch",
    "hydrateroot-admission-ownership-chain-mismatch",
    "hydrateroot-admission-field-name-mismatch"
  ]);
});

test("private admission 806 gate rejects public hydrateRoot, root, DOM, listener, replay, callback, package, and hydration claims", () => {
  const gate = evaluatePrivateAdmission806Gate({
    compatibilityClaimed: true,
    publicCompatibilityClaimed: true,
    rowOverrides: {
      [worker786]: {
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        runtimeExecutionClaimed: true,
        compatibilityClaimed: true,
        publicCompatibilityClaimed: true,
        ledgerEvaluationMode: "runtime-execution",
        publicBlockerClaims: {
          publicHydrateRootEnabled: true,
          publicHydrateRootSupported: true,
          publicRootCreated: true,
          publicRootObjectExposed: true,
          rootScheduled: true,
          containerMarked: true,
          domMutated: true,
          markerWrites: true,
          listenersAttached: true,
          listenerInstallation: true,
          eventDispatch: true,
          eventReplayInstalled: true,
          eventsReplayed: true,
          replayQueueDrained: true,
          replayQueuesDrained: true,
          targetDispatchExecuted: true,
          eventReplayDispatchAttempted: true,
          syntheticEventCreated: true,
          listenerInvocationCount: 1,
          recoverableErrorsQueued: true,
          onRecoverableErrorInvoked: true,
          publicOnRecoverableErrorInvoked: true,
          rootErrorCallbackInvocationCount: 1,
          packageCompatibilityClaimed: true,
          packageExportsChanged: true,
          canHydrate: true,
          hydration: true,
          publicHydrationCompatibilityClaimed: true,
          publicHydrationReplayCompatibilityClaimed: true,
          browserDomEventCompatibilityClaimed: true,
          compatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_806_VIOLATION_STATUS);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assertViolationIds(gate, [
    "public-hydrateroot-claim-detected",
    "root-creation-claim-detected",
    "dom-mutation-claim-detected",
    "listener-installation-claim-detected",
    "event-replay-drain-dispatch-claim-detected",
    "callback-invocation-claim-detected",
    "package-compatibility-claim-detected",
    "public-hydration-compatibility-claim-detected",
    "private-diagnostic-compatibility-claim-detected",
    "static-ledger-mode-mismatch",
    "top-level-compatibility-claim-detected"
  ]);
  assertSubset(
    [
      `${worker786}.publicHydrateRootEnabled`,
      `${worker786}.publicHydrateRootSupported`
    ],
    gate.publicHydrateRootClaimIds
  );
  assertSubset(
    [`${worker786}.publicRootCreated`, `${worker786}.rootScheduled`],
    gate.rootCreationClaimIds
  );
  assertSubset(
    [`${worker786}.domMutated`, `${worker786}.markerWrites`],
    gate.domMutationClaimIds
  );
  assertSubset(
    [`${worker786}.listenersAttached`, `${worker786}.listenerInstallation`],
    gate.listenerInstallationClaimIds
  );
  assertSubset(
    [
      `${worker786}.eventDispatch`,
      `${worker786}.eventReplayDispatchAttempted`,
      `${worker786}.replayQueuesDrained`
    ],
    gate.eventReplayDrainDispatchClaimIds
  );
  assertSubset(
    [
      `${worker786}.listenerInvocationCount`,
      `${worker786}.onRecoverableErrorInvoked`,
      `${worker786}.rootErrorCallbackInvocationCount`
    ],
    gate.callbackInvocationClaimIds
  );
  assertSubset(
    [
      `${worker786}.packageCompatibilityClaimed`,
      `${worker786}.packageExportsChanged`
    ],
    gate.packageCompatibilityClaimIds
  );
  assertSubset(
    [
      `${worker786}.canHydrate`,
      `${worker786}.publicHydrationCompatibilityClaimed`,
      `${worker786}.browserDomEventCompatibilityClaimed`
    ],
    gate.publicHydrationCompatibilityClaimIds
  );
});

test("private admission 806 gate reports every public blocker claim as a violation", () => {
  const claimedFields = [
    "hydrateInstanceCalled",
    "publicDispatchEnabled",
    "publicHydrationTargetClaimed",
    "willDrainReplayQueues",
    "nativeExecution",
    "reconcilerExecution"
  ];
  const gate = evaluatePrivateAdmission806Gate({
    rowOverrides: {
      [worker786]: {
        publicBlockerClaims: Object.fromEntries(
          claimedFields.map((field) => [field, true])
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_806_VIOLATION_STATUS);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(
    [...gate.publicBlockerClaimViolationIds].sort(),
    claimedFields.map((field) => `${worker786}.${field}`).sort()
  );
  assertViolationIds(gate, ["public-blocker-claim-detected"]);
  const genericViolation = gate.violations.find(
    (violation) => violation.id === "public-blocker-claim-detected"
  );
  assert.notEqual(genericViolation, undefined);
  assertSubset(
    gate.publicBlockerClaimViolationIds,
    genericViolation.claimIds
  );
});

test("private admission 806 gate rejects non-boolean package blocker leaks", () => {
  const gate = evaluatePrivateAdmission806Gate({
    rowOverrides: {
      [worker797]: {
        packageCompatibilityClaimed: 1,
        packageExportsChanged: "claimed"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_806_VIOLATION_STATUS);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.deepEqual(gate.staticReadOnlyViolationIds, [worker797]);
  assertViolationIds(gate, ["static-ledger-mode-mismatch"]);
});

function assertLedgerRow(
  row,
  { privateAdmission, evidenceChain, requiredFieldNames }
) {
  assert.equal(row.sourceQueue, "806");
  assert.equal(row.privateAdmission, privateAdmission);
  assert.equal(row.evidenceChain, evidenceChain);
  assert.deepEqual(
    row.acceptedDiagnosticIds,
    PRIVATE_ADMISSION_806_REQUIRED_DIAGNOSTIC_IDS[row.workerId]
  );
  assert.deepEqual(
    row.acceptedStatuses,
    PRIVATE_ADMISSION_806_REQUIRED_STATUSES[row.workerId]
  );
  assert.deepEqual(
    row.requiredPriorWorkers,
    PRIVATE_ADMISSION_806_REQUIRED_CHAIN[row.workerId]
  );
  assert.deepEqual(row.requiredFieldNames, requiredFieldNames);
  assert.deepEqual(row.observedFieldNames, requiredFieldNames);
  assert.equal(row.privateEvidenceOnly, true);
  assert.equal(row.sourceTokenChecksOnly, true);
  assert.equal(row.manifestEvaluationOnly, true);
  assert.equal(row.runtimeExecutionClaimed, false);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.publicCompatibilityClaimed, false);
  assert.equal(Object.hasOwn(row, "publicBlockerClaims"), false);
  assert.equal(Object.hasOwn(row, "packageCompatibilityClaimed"), false);
  assert.equal(Object.hasOwn(row, "packageExportsChanged"), false);
  assert.equal(
    row.ledgerEvaluationMode,
    "source-token-checks-and-manifest-only"
  );
  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.role);
  }
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const expectedValue of expectedSubset) {
    assert.equal(actualSuperset.includes(expectedValue), true, expectedValue);
  }
}

function assertEvidenceRoleRecognized(
  gate,
  workerId,
  role,
  expectedRecognized
) {
  const evidenceRow = gate.rowsByWorker[workerId].evidence.find(
    (row) => row.role === role
  );
  assert.notEqual(evidenceRow, undefined, role);
  assert.equal(evidenceRow.recognized, expectedRecognized, role);
}

function rowByWorker(workerId) {
  const row = PRIVATE_ADMISSION_806_ROWS.find(
    (candidate) => candidate.workerId === workerId
  );
  assert.notEqual(row, undefined, workerId);
  return row;
}

function withMissingEvidenceToken(row, role, token) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      tokens: [...evidenceRow.tokens, token]
    };
  });
}

function withoutEvidenceFieldName(row, role, fieldName) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      fieldNames: evidenceRow.fieldNames.filter((field) => field !== fieldName)
    };
  });
}
