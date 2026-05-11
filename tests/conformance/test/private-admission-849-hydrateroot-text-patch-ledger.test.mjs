import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_849_LEDGER_STATUS,
  PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS,
  PRIVATE_ADMISSION_849_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_849_REQUIRED_CAPABILITY_IDS,
  PRIVATE_ADMISSION_849_REQUIRED_EVIDENCE_ROLES,
  PRIVATE_ADMISSION_849_REQUIRED_FIELD_NAMES,
  PRIVATE_ADMISSION_849_REQUIRED_FUNCTION_NAMES,
  PRIVATE_ADMISSION_849_REQUIRED_OPERATION_IDS,
  PRIVATE_ADMISSION_849_REQUIRED_RECORD_TYPES,
  PRIVATE_ADMISSION_849_REQUIRED_REQUIREMENTS,
  PRIVATE_ADMISSION_849_REQUIRED_STATUS_IDS,
  PRIVATE_ADMISSION_849_ROW_CONTRACTS,
  PRIVATE_ADMISSION_849_ROWS,
  PRIVATE_ADMISSION_849_WORKERS,
  evaluatePrivateAdmission849HydrateRootTextPatchLedger
} from "../src/private-admission-849-hydrateroot-text-patch-ledger.mjs";

const worker828 = "worker-828-hydrateroot-text-claim-patch-bridge-execution";
const expectedWorkers = [worker828];
const sourceTokenPolicy =
  "source-owned-identifiers-statuses-functions-fields-and-constants";

test("private admission 849 manifest pins Worker 828 hydrateRoot text patch ledger", () => {
  assert.deepEqual(PRIVATE_ADMISSION_849_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_849_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_849_ROWS.length, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_849_WORKERS).size, 1);
  assertSubset(
    [
      "publicHydrateRootSupported",
      "publicRootObjectExposed",
      "nativeExecution",
      "reconcilerExecution",
      "browserDomMutated",
      "listenerInstallation",
      "eventReplayInstalled",
      "recoverableErrorsQueued",
      "onRecoverableErrorInvoked",
      "packageCompatibilityClaimed",
      "compatibilityClaimed"
    ],
    PRIVATE_ADMISSION_849_PUBLIC_BLOCKER_FIELDS
  );

  const row = rowByWorker(worker828);
  assert.deepEqual(rowContract(row), PRIVATE_ADMISSION_849_ROW_CONTRACTS[worker828]);
  assert.equal(row.sourceTokenChecksOnly, true);
  assert.equal(row.manifestEvaluationOnly, true);
  assert.equal(row.privateEvidenceOnly, true);
  assert.equal(row.staticReadOnlyLedger, true);
  assert.equal(row.runtimeExecutionClaimed, false);
  assert.equal(row.publicRuntimeExecutionClaimed, false);
  assert.equal(row.packageImportAttempted, false);
  assert.equal(row.ledgerEvaluationMode, "source-token-checks-and-manifest-only");
  assertAllFalse(row.publicBlockers);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    PRIVATE_ADMISSION_849_REQUIRED_EVIDENCE_ROLES[worker828]
  );

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.tokenPolicy, sourceTokenPolicy, evidenceRow.role);
    assert.equal(
      evidenceRow.path.startsWith("packages/react-dom/src/client/"),
      true,
      evidenceRow.role
    );
    assert.equal(evidenceRow.path.includes("/test/"), false, evidenceRow.role);
    assert.equal(
      evidenceRow.path.includes("worker-progress"),
      false,
      evidenceRow.role
    );
    for (const token of allEvidenceTokens(evidenceRow)) {
      assert.equal(/\s/.test(token), false, `${evidenceRow.role}:${token}`);
      assert.equal(
        /[()[\]{};=><'"`,]/.test(token),
        false,
        `${evidenceRow.role}:${token}`
      );
      assert.equal(
        /^[A-Za-z_$][A-Za-z0-9_$]*\.[A-Za-z_$]/.test(token) &&
          !token.startsWith("fast."),
        false,
        `${evidenceRow.role}:${token}`
      );
    }
  }
});

test("private admission 849 recognizes source-owned text patch bridge evidence without public compatibility", () => {
  const ledger = evaluatePrivateAdmission849HydrateRootTextPatchLedger();

  assert.equal(ledger.status, PRIVATE_ADMISSION_849_LEDGER_STATUS);
  assert.equal(ledger.privateAdmissionRecognized, true);
  assert.equal(ledger.manifestRecognized, true);
  assert.equal(ledger.rowContractsRecognized, true);
  assert.equal(ledger.evidenceRecognized, true);
  assert.equal(ledger.operationIdsRecognized, true);
  assert.equal(ledger.statusIdsRecognized, true);
  assert.equal(ledger.recordTypesRecognized, true);
  assert.equal(ledger.functionNamesRecognized, true);
  assert.equal(ledger.fieldNamesRecognized, true);
  assert.equal(ledger.capabilityIdsRecognized, true);
  assert.equal(ledger.requirementsRecognized, true);
  assert.equal(ledger.blockedPublicClaimsRecognized, true);
  assert.equal(ledger.staticReadOnlyRecognized, true);
  assert.equal(ledger.compatibilityClaimed, false);
  assert.equal(ledger.publicCompatibilityClaimed, false);
  assert.deepEqual(ledger.queueWorkers, expectedWorkers);
  assert.deepEqual(ledger.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(ledger.violations, []);

  const row = ledger.rowsByWorker[worker828];
  assert.deepEqual(row.operationIds, PRIVATE_ADMISSION_849_REQUIRED_OPERATION_IDS[worker828]);
  assert.deepEqual(row.statusIds, PRIVATE_ADMISSION_849_REQUIRED_STATUS_IDS[worker828]);
  assert.deepEqual(row.recordTypes, PRIVATE_ADMISSION_849_REQUIRED_RECORD_TYPES[worker828]);
  assert.deepEqual(row.functionNames, PRIVATE_ADMISSION_849_REQUIRED_FUNCTION_NAMES[worker828]);
  assert.deepEqual(row.fieldNames, PRIVATE_ADMISSION_849_REQUIRED_FIELD_NAMES[worker828]);
  assert.deepEqual(row.capabilityIds, PRIVATE_ADMISSION_849_REQUIRED_CAPABILITY_IDS[worker828]);
  assert.deepEqual(row.requirements, PRIVATE_ADMISSION_849_REQUIRED_REQUIREMENTS[worker828]);
  assertAllFalse(row.publicBlockers);

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.invalidTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.unsupportedTokenKinds, [], evidenceRow.role);
    assert.equal(evidenceRow.sourcePathAllowed, true, evidenceRow.role);
    assert.equal(evidenceRow.readError, null, evidenceRow.role);
    assert.equal(evidenceRow.sliceError, null, evidenceRow.role);
  }
});

test("private admission 849 rejects missing stale cloned and tampered rows", () => {
  const missingEvidence = evaluatePrivateAdmission849HydrateRootTextPatchLedger({
    rowOverrides: {
      [worker828]: {
        evidence: []
      }
    }
  });
  assert.equal(missingEvidence.status, PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS);
  assert.equal(missingEvidence.privateAdmissionRecognized, false);
  assert.equal(missingEvidence.evidenceRecognized, false);
  assertViolationIds(missingEvidence, [
    "private-admission-849-required-evidence-mismatch"
  ]);

  const staleWorker = evaluatePrivateAdmission849HydrateRootTextPatchLedger({
    rowOverrides: {
      [worker828]: {
        workerId: "worker-828-stale-hydrateroot-text-patch-bridge"
      }
    }
  });
  assert.equal(staleWorker.status, PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS);
  assert.deepEqual(staleWorker.manifest.missingWorkerIds, [worker828]);
  assert.deepEqual(staleWorker.manifest.unexpectedWorkerIds, [
    "worker-828-stale-hydrateroot-text-patch-bridge"
  ]);
  assertViolationIds(staleWorker, [
    "private-admission-849-worker-manifest-mismatch",
    "private-admission-849-row-contract-mismatch"
  ]);

  const clonedRow = evaluatePrivateAdmission849HydrateRootTextPatchLedger({
    rowOverrides: {
      [worker828]: {
        ledgerRowId: "worker-828-cloned-text-patch-admission"
      }
    }
  });
  assert.equal(clonedRow.status, PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS);
  assert.equal(clonedRow.rowContractsRecognized, false);
  assertViolationIds(clonedRow, [
    "private-admission-849-row-contract-mismatch"
  ]);

  const tamperedRequirements =
    evaluatePrivateAdmission849HydrateRootTextPatchLedger({
      rowOverrides: {
        [worker828]: {
          requirements: {
            oneShotExecutionPreflightConsumption: false,
            fakeTextOwnershipGate: false
          }
        }
      }
    });
  assert.equal(
    tamperedRequirements.status,
    PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS
  );
  assert.equal(tamperedRequirements.requirementsRecognized, false);
  assertViolationIds(tamperedRequirements, [
    "private-admission-849-requirement-mismatch"
  ]);
});

test("private admission 849 rejects missing operation status record function field capability and source evidence", () => {
  const sourceRow = rowByWorker(worker828);
  const gate = evaluatePrivateAdmission849HydrateRootTextPatchLedger({
    rowOverrides: {
      [worker828]: {
        operationIds: sourceRow.operationIds.filter(
          (id) => id !== "hydration-text-node-claim-patch-execution"
        ),
        statusIds: sourceRow.statusIds.filter(
          (id) =>
            id !==
            "executed-private-hydrate-root-public-facade-text-node-claim-patch"
        ),
        recordTypes: sourceRow.recordTypes.filter(
          (id) =>
            id !==
            "FastReactDomPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord"
        ),
        functionNames: sourceRow.functionNames.filter(
          (id) => id !== "isPrivateFakeHydrationTextNode"
        ),
        fieldNames: sourceRow.fieldNames.filter(
          (id) => id !== "textNodeClaimPatchExecutionRecordsByExecutionPreflight"
        ),
        capabilityIds: sourceRow.capabilityIds.filter(
          (id) => id !== "browser-dom-mutation"
        ),
        evidence: withEvidenceRowOverride(
          sourceRow,
          "worker-828-root-bridge-text-patch-bridge-source",
          {
            tokensByKind: {
              ...evidenceRowByRole(
                sourceRow,
                "worker-828-root-bridge-text-patch-bridge-source"
              ).tokensByKind,
              durableIds: ["missing-worker-828-text-patch-source-token"]
            }
          }
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS);
  assert.equal(gate.privateAdmissionRecognized, false);
  assert.equal(gate.operationIdsRecognized, false);
  assert.equal(gate.statusIdsRecognized, false);
  assert.equal(gate.recordTypesRecognized, false);
  assert.equal(gate.functionNamesRecognized, false);
  assert.equal(gate.fieldNamesRecognized, false);
  assert.equal(gate.capabilityIdsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertEvidenceRoleRecognized(
    gate,
    "worker-828-root-bridge-text-patch-bridge-source",
    false
  );
  assertViolationIds(gate, [
    "private-admission-849-evidence-token-missing",
    "private-admission-849-operation-id-mismatch",
    "private-admission-849-status-id-mismatch",
    "private-admission-849-record-type-mismatch",
    "private-admission-849-function-name-mismatch",
    "private-admission-849-field-name-mismatch",
    "private-admission-849-capability-id-mismatch"
  ]);
});

test("private admission 849 rejects public hydrateRoot root native reconciler DOM listener replay callback and package claims", () => {
  const gate = evaluatePrivateAdmission849HydrateRootTextPatchLedger({
    compatibilityClaimed: true,
    publicCompatibilityClaimed: true,
    rowOverrides: {
      [worker828]: {
        compatibilityClaimed: true,
        publicCompatibilityClaimed: true,
        publicBlockers: trueBlockers([
          "publicHydrateRootSupported",
          "publicHydrationCompatibilityClaimed",
          "hydration",
          "canHydrate",
          "hydrateTextInstanceCalled",
          "publicRootCreated",
          "publicRootObjectExposed",
          "rootScheduled",
          "nativeExecution",
          "reconcilerExecution",
          "containerMarked",
          "domMutated",
          "browserDomMutated",
          "markerWrites",
          "listenerInstallation",
          "listenersAttached",
          "eventDispatch",
          "eventReplayInstalled",
          "eventsReplayed",
          "replayQueueDrained",
          "targetDispatchExecuted",
          "eventReplayDispatchAttempted",
          "syntheticEventCreated",
          "listenerInvocationCount",
          "recoverableErrorsQueued",
          "willQueueRecoverableErrors",
          "onRecoverableErrorInvoked",
          "publicOnRecoverableErrorInvoked",
          "rootErrorCallbackInvocationCount",
          "packageCompatibilityClaimed",
          "packageExportsChanged",
          "compatibilityClaimed"
        ])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS);
  assert.equal(gate.privateAdmissionRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assertSubset(
    [
      `${worker828}.publicHydrateRootSupported`,
      `${worker828}.publicHydrationCompatibilityClaimed`,
      `${worker828}.hydration`,
      `${worker828}.canHydrate`
    ],
    gate.publicHydrationClaimIds
  );
  assertSubset(
    [
      `${worker828}.publicRootCreated`,
      `${worker828}.publicRootObjectExposed`,
      `${worker828}.rootScheduled`
    ],
    gate.publicRootClaimIds
  );
  assertSubset(
    [`${worker828}.nativeExecution`, `${worker828}.reconcilerExecution`],
    gate.nativeReconcilerClaimIds
  );
  assertSubset(
    [
      `${worker828}.domMutated`,
      `${worker828}.browserDomMutated`,
      `${worker828}.markerWrites`
    ],
    gate.browserDomMutationClaimIds
  );
  assertSubset(
    [
      `${worker828}.listenerInstallation`,
      `${worker828}.eventReplayInstalled`,
      `${worker828}.targetDispatchExecuted`,
      `${worker828}.listenerInvocationCount`
    ],
    gate.listenerEventReplayClaimIds
  );
  assertSubset(
    [
      `${worker828}.recoverableErrorsQueued`,
      `${worker828}.onRecoverableErrorInvoked`,
      `${worker828}.rootErrorCallbackInvocationCount`
    ],
    gate.recoverableCallbackClaimIds
  );
  assertSubset(
    [
      `${worker828}.packageCompatibilityClaimed`,
      `${worker828}.packageExportsChanged`,
      `${worker828}.compatibilityClaimed`
    ],
    gate.packageCompatibilityClaimIds
  );
  assertViolationIds(gate, [
    "hydrate-root-public-hydration-claim-detected",
    "hydrate-root-public-root-claim-detected",
    "hydrate-root-native-reconciler-claim-detected",
    "hydrate-root-browser-dom-mutation-claim-detected",
    "hydrate-root-listener-event-replay-claim-detected",
    "hydrate-root-recoverable-callback-claim-detected",
    "hydrate-root-package-compatibility-claim-detected",
    "private-admission-849-public-claim-detected",
    "private-admission-849-compatibility-claim-detected"
  ]);
});

test("private admission 849 rejects prose test-title error-text source-syntax and member-expression evidence", () => {
  const sourceRow = rowByWorker(worker828);
  const role = "worker-828-root-bridge-text-patch-bridge-source";
  const baseEvidence = evidenceRowByRole(sourceRow, role);
  const cases = [
    {
      name: "prose-error-text",
      evidence: {
        tokensByKind: {
          durableIds: [
            "Hydration text node claim patch execution requires accepted boundary metadata."
          ]
        }
      },
      expectedReason: "prose-test-title-or-error-text"
    },
    {
      name: "test-title",
      evidence: {
        path: "packages/react-dom/test/hydrate-root-text-claim-patch-bridge.test.js",
        sliceStart: null,
        sliceEnd: null,
        tokensByKind: {
          durableIds: [
            "private hydrateRoot post-preflight execution applies one fake text claim patch"
          ]
        }
      },
      expectedReason: "prose-test-title-or-error-text"
    },
    {
      name: "source-syntax",
      evidence: {
        tokensByKind: {
          functionNames: [
            "createPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord("
          ]
        }
      },
      expectedReason: "source-syntax-token"
    },
    {
      name: "member-expression",
      evidence: {
        tokensByKind: {
          fieldNames: ["record.executionPreflightAccepted"]
        }
      },
      expectedReason: "member-expression-token"
    },
    {
      name: "unsupported-public-compatibility-kind",
      evidence: {
        tokensByKind: {
          publicCompatibilityEvidence: ["packageCompatibilityClaimed"]
        }
      },
      expectedReason: "unsupported-token-kind"
    }
  ];

  for (const testCase of cases) {
    const gate = evaluatePrivateAdmission849HydrateRootTextPatchLedger({
      rowOverrides: {
        [worker828]: {
          evidence: withEvidenceRowOverride(sourceRow, role, {
            ...testCase.evidence,
            tokenPolicy: sourceTokenPolicy,
            tokensByKind: testCase.evidence.tokensByKind,
            forbiddenTokens: baseEvidence.forbiddenTokens
          })
        }
      }
    });

    assert.equal(
      gate.status,
      PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS,
      testCase.name
    );
    assert.equal(gate.evidenceRecognized, false, testCase.name);
    assertViolationIds(
      gate,
      [
        "private-admission-849-evidence-token-missing",
        "private-admission-849-brittle-evidence-detected"
      ],
      testCase.name
    );
    const mismatch = gate.brittleEvidenceRows.find(
      (row) => row.role === role
    );
    assert.notEqual(mismatch, undefined, testCase.name);
    if (testCase.name === "test-title") {
      assert.equal(mismatch.sourcePathAllowed, false, testCase.name);
    }
    assert.equal(
      mismatch.invalidTokens.some(
        (token) => token.reason === testCase.expectedReason
      ) ||
        mismatch.unsupportedTokenKinds.includes(
          "publicCompatibilityEvidence"
        ),
      true,
      testCase.name
    );
  }
});

test("private admission 849 stays static read-only and rejects runtime ledger modes", () => {
  const gate = evaluatePrivateAdmission849HydrateRootTextPatchLedger({
    rowOverrides: {
      [worker828]: {
        runtimeExecutionClaimed: true,
        publicRuntimeExecutionClaimed: true,
        packageImportAttempted: true,
        staticReadOnlyLedger: false,
        ledgerEvaluationMode: "runtime-execution"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_849_LEDGER_VIOLATION_STATUS);
  assert.equal(gate.privateAdmissionRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.deepEqual(gate.staticReadOnlyViolationIds, [worker828]);
  assertViolationIds(gate, [
    "private-admission-849-static-ledger-mode-mismatch"
  ]);
});

function rowByWorker(workerId) {
  const row = PRIVATE_ADMISSION_849_ROWS.find(
    (candidate) => candidate.workerId === workerId
  );
  assert.notEqual(row, undefined, workerId);
  return row;
}

function evidenceRowByRole(row, role) {
  const evidenceRow = row.evidence.find(
    (candidate) => candidate.role === role
  );
  assert.notEqual(evidenceRow, undefined, role);
  return evidenceRow;
}

function withEvidenceRowOverride(row, role, override) {
  return row.evidence.map((evidenceRow) =>
    evidenceRow.role === role
      ? {
          ...evidenceRow,
          ...override,
          tokensByKind: override.tokensByKind ?? evidenceRow.tokensByKind,
          forbiddenTokens:
            override.forbiddenTokens ?? evidenceRow.forbiddenTokens
        }
      : evidenceRow
  );
}

function trueBlockers(fields) {
  return Object.fromEntries(fields.map((field) => [field, true]));
}

function rowContract(row) {
  return {
    workerId: row.workerId,
    ledgerRowId: row.ledgerRowId,
    ledgerRole: row.ledgerRole,
    privateAdmission: row.privateAdmission,
    sourceQueue: row.sourceQueue,
    sourceWorkerId: row.sourceWorkerId
  };
}

function allEvidenceTokens(evidenceRow) {
  return Object.values(evidenceRow.tokensByKind).flatMap((tokens) => [
    ...tokens
  ]);
}

function assertAllFalse(record) {
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, false, key);
  }
}

function assertSubset(expectedSubset, actualValues) {
  const actualSet = new Set(actualValues);
  for (const expected of expectedSubset) {
    assert.equal(actualSet.has(expected), true, expected);
  }
}

function assertViolationIds(gate, expectedIds, message = "") {
  assertSubset(
    expectedIds,
    gate.violations.map((violation) => violation.id),
    message
  );
}

function assertEvidenceRoleRecognized(gate, role, expected) {
  const rows = Object.values(gate.rowsByWorker);
  const evidenceRow = rows
    .flatMap((row) => row.evidence)
    .find((candidate) => candidate.role === role);
  assert.notEqual(evidenceRow, undefined, role);
  assert.equal(evidenceRow.recognized, expected, role);
}
