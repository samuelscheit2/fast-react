import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_886_APPROVED_EVIDENCE_CONTEXTS_BY_ROLE,
  PRIVATE_ADMISSION_886_DURABLE_EVIDENCE_TOKEN_CLASSES,
  PRIVATE_ADMISSION_886_GATE_STATUS,
  PRIVATE_ADMISSION_886_NON_DURABLE_EVIDENCE_TOKEN_SHAPES,
  PRIVATE_ADMISSION_886_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_IDS,
  PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_ROLES,
  PRIVATE_ADMISSION_886_REQUIRED_EVIDENCE_ROLES,
  PRIVATE_ADMISSION_886_REQUIRED_FALSE_REQUIREMENTS,
  PRIVATE_ADMISSION_886_REQUIRED_REQUIREMENT_FIELDS,
  PRIVATE_ADMISSION_886_REQUIRED_SOURCE_BOUNDARIES,
  PRIVATE_ADMISSION_886_REQUIRED_STATUSES,
  PRIVATE_ADMISSION_886_REQUIRED_TRUE_REQUIREMENTS,
  PRIVATE_ADMISSION_886_ROWS,
  PRIVATE_ADMISSION_886_VARIANTS,
  PRIVATE_ADMISSION_886_VIOLATION_STATUS,
  evaluatePrivateAdmission886Gate
} from "../src/private-admission-886-scheduler-variant-boundary-ledger.mjs";

const expectedVariants = [
  "scheduler-index-wrapper",
  "scheduler-cjs-index-development",
  "scheduler-cjs-index-production",
  "scheduler-unstable-mock-root",
  "scheduler-cjs-unstable-mock-development",
  "scheduler-cjs-unstable-mock-production",
  "scheduler-unstable-post-task-wrapper",
  "scheduler-cjs-unstable-post-task-development",
  "scheduler-cjs-unstable-post-task-production",
  "scheduler-native-wrapper",
  "scheduler-cjs-native-development",
  "scheduler-cjs-native-production"
];

test("private admission 886 manifest pins Scheduler package variant boundary rows", () => {
  assert.deepEqual(PRIVATE_ADMISSION_886_VARIANTS, expectedVariants);
  assert.deepEqual(
    PRIVATE_ADMISSION_886_ROWS.map((row) => row.variantId),
    expectedVariants
  );
  assert.equal(PRIVATE_ADMISSION_886_ROWS.length, 12);
  assert.equal(new Set(PRIVATE_ADMISSION_886_VARIANTS).size, 12);
  assert.deepEqual(
    PRIVATE_ADMISSION_886_DURABLE_EVIDENCE_TOKEN_CLASSES.map(
      (tokenClass) => tokenClass.id
    ),
    [
      "js-identifier-field-function-or-constant",
      "private-fast-react-export-marker",
      "diagnostic-status-or-private-kind",
      "scheduler-package-target",
      "scheduler-package-subpath",
      "scheduler-physical-entrypoint-file"
    ]
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_886_NON_DURABLE_EVIDENCE_TOKEN_SHAPES.map(
      (shape) => shape.id
    ),
    [
      "object-api-expression",
      "source-declaration-snippet",
      "field-value-expression",
      "string-literal-snippet",
      "member-call-expression",
      "member-expression-snippet",
      "block-or-statement-syntax",
      "prose-test-title-or-error-message",
      "unapproved-evidence-token-context"
    ]
  );

  for (const row of PRIVATE_ADMISSION_886_ROWS) {
    assert.equal(Object.isFrozen(row), true, row.variantId);
    assert.deepEqual(
      row.sourceBoundary,
      PRIVATE_ADMISSION_886_REQUIRED_SOURCE_BOUNDARIES[row.variantId],
      row.variantId
    );
    assert.equal(row.sourceBoundary.packageName, "scheduler", row.variantId);
    assert.equal(
      row.sourceBoundary.compatibilityTarget,
      "scheduler@0.27.0",
      row.variantId
    );
    assert.deepEqual(
      row.acceptedDiagnosticIds,
      PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_IDS[row.variantId],
      row.variantId
    );
    assert.deepEqual(
      row.acceptedDiagnosticStatuses,
      PRIVATE_ADMISSION_886_REQUIRED_STATUSES[row.variantId],
      row.variantId
    );
    assert.deepEqual(
      row.acceptedDiagnosticRoles,
      PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_ROLES[row.variantId],
      row.variantId
    );
    assert.deepEqual(
      row.evidence.map((evidenceRow) => evidenceRow.role),
      PRIVATE_ADMISSION_886_REQUIRED_EVIDENCE_ROLES[row.variantId],
      row.variantId
    );
    assert.deepEqual(
      Object.keys(row.requirements).sort(),
      [...PRIVATE_ADMISSION_886_REQUIRED_REQUIREMENT_FIELDS].sort(),
      row.variantId
    );
    assert.deepEqual(
      Object.keys(row.publicBlockerClaims).sort(),
      [...PRIVATE_ADMISSION_886_PUBLIC_BLOCKER_FIELDS].sort(),
      row.variantId
    );
    assertAllFalse(row.publicBlockerClaims, row.variantId);

    for (const key of PRIVATE_ADMISSION_886_REQUIRED_TRUE_REQUIREMENTS) {
      assert.equal(row.requirements[key], true, `${row.variantId}.${key}`);
    }
    for (const key of PRIVATE_ADMISSION_886_REQUIRED_FALSE_REQUIREMENTS) {
      assert.equal(row.requirements[key], false, `${row.variantId}.${key}`);
    }
    for (const evidenceRow of row.evidence) {
      assert.deepEqual(
        PRIVATE_ADMISSION_886_APPROVED_EVIDENCE_CONTEXTS_BY_ROLE[
          evidenceRow.role
        ],
        {
          variantId: row.variantId,
          path: evidenceRow.path,
          tokens: evidenceRow.tokens
        },
        evidenceRow.role
      );
    }
  }
});

test("private admission 886 gate recognizes source-owned Scheduler variant diagnostics only", () => {
  const gate = evaluatePrivateAdmission886Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_886_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.evidenceRolesRecognized, true);
  assert.equal(gate.durableEvidenceTokensRecognized, true);
  assert.equal(gate.sourceOwnedPackageEntrypointsRecognized, true);
  assert.equal(gate.privateDiagnosticIdsRecognized, true);
  assert.equal(gate.privateDiagnosticStatusesRecognized, true);
  assert.equal(gate.privateDiagnosticRolesRecognized, true);
  assert.equal(gate.crossVariantRowsRejected, true);
  assert.equal(gate.requirementsRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.publicCompatibilityAliasesBlocked, true);
  assert.equal(gate.publicVariantBehaviorClaimsBlocked, true);
  assert.equal(gate.packageSurfaceBlocked, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueVariants, expectedVariants);
  assert.deepEqual(gate.recognizedVariantIds, expectedVariants);
  assert.deepEqual(gate.publicBlockerClaimViolationIds, []);
  assert.deepEqual(gate.publicCompatibilityAliasClaimIds, []);
  assert.deepEqual(gate.publicVariantBehaviorClaimIds, []);
  assert.deepEqual(gate.publicPackageSurfaceClaimIds, []);
  assert.deepEqual(gate.nonDurableEvidenceTokenViolationIds, []);
  assert.deepEqual(gate.crossVariantDiagnosticViolationIds, []);

  assertVariantRow(gate.rowsByVariant["scheduler-unstable-mock-root"], {
    variantFamily: "unstable_mock",
    entrypoint: "scheduler/unstable_mock",
    sourceFile: "packages/scheduler/unstable_mock.js",
    expectedDiagnosticIds: [
      "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
      "fast-react.scheduler.mock-expired-act-root-work-source-validator",
      "fast-react.scheduler.mock-expired-work-diagnostics",
      "fast-react.scheduler.mock-frame-budget-diagnostics",
      "fast-react.scheduler.mock-expired-lane-priority-root-metadata",
      "fast-react.scheduler.mock-expired-lane-flush-diagnostics",
      "fast-react.scheduler.mock-expired-act-root-work-metadata",
      "fast-react.scheduler.mock-expired-act-root-work-diagnostics",
      "fast-react.scheduler.mock-delayed-act-root-work-metadata",
      "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
      "fast-react.scheduler.mock-delayed-renderer-root-work-metadata"
    ]
  });
  assertVariantRow(
    gate.rowsByVariant["scheduler-cjs-unstable-mock-development"],
    {
      variantFamily: "unstable_mock",
      entrypoint: "scheduler/cjs/scheduler-unstable_mock.development.js",
      sourceFile:
        "packages/scheduler/cjs/scheduler-unstable_mock.development.js",
      expectedDiagnosticIds: [
        "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
      ]
    }
  );
  assertVariantRow(
    gate.rowsByVariant["scheduler-cjs-unstable-post-task-development"],
    {
      variantFamily: "unstable_post_task",
      entrypoint: "scheduler/unstable_post_task",
      sourceFile:
        "packages/scheduler/cjs/scheduler-unstable_post_task.development.js",
      expectedDiagnosticIds: [
        "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
        "fast-react.scheduler.unstable_post_task.priority-diagnostics",
        "fast-react.scheduler.post_task.private-act-root-work-handoff"
      ]
    }
  );
  assertVariantRow(gate.rowsByVariant["scheduler-native-wrapper"], {
    variantFamily: "native",
    entrypoint: "scheduler/index.native.js",
    sourceFile: "packages/scheduler/index.native.js",
    expectedDiagnosticIds: []
  });
  assertVariantRow(gate.rowsByVariant["scheduler-index-wrapper"], {
    variantFamily: "index",
    entrypoint: "scheduler",
    sourceFile: "packages/scheduler/index.js",
    expectedDiagnosticIds: []
  });
});

test("private admission 886 gate rejects cross-variant diagnostics and entrypoints", () => {
  const gate = evaluatePrivateAdmission886Gate({
    rowOverrides: {
      "scheduler-index-wrapper": {
        acceptedDiagnosticIds: [
          "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__"
        ]
      },
      "scheduler-cjs-unstable-post-task-development": {
        sourceBoundary: {
          variantFamily: "unstable_mock",
          entrypoint: "scheduler/unstable_mock",
          sourceFile: "packages/scheduler/unstable_mock.js",
          physicalEntrypoint: "unstable_mock.js"
        },
        acceptedDiagnosticIds: [
          "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
          "fast-react.scheduler.unstable_post_task.priority-diagnostics",
          "fast-react.scheduler.post_task.private-act-root-work-handoff",
          "fast-react.scheduler.mock-delayed-act-root-work-diagnostics"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_886_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.sourceOwnedPackageEntrypointsRecognized, false);
  assert.equal(gate.privateDiagnosticIdsRecognized, false);
  assert.equal(gate.crossVariantRowsRejected, false);
  assertSubset(
    [
      "scheduler-index-wrapper",
      "scheduler-cjs-unstable-post-task-development"
    ],
    gate.crossVariantDiagnosticViolationIds
  );
  assert.deepEqual(gate.sourceBoundaryViolationIds, [
    "scheduler-cjs-unstable-post-task-development"
  ]);
  assertViolationIds(gate, [
    "scheduler-variant-boundary-mismatch",
    "scheduler-variant-private-diagnostic-id-mismatch",
    "scheduler-cross-variant-private-diagnostic-row"
  ]);
});

test("private admission 886 gate rejects stale statuses and caller-shaped diagnostic roles", () => {
  const row = rowByVariant("scheduler-unstable-mock-root");
  const gate = evaluatePrivateAdmission886Gate({
    rowOverrides: {
      "scheduler-unstable-mock-root": {
        acceptedDiagnosticStatuses: [
          ...row.acceptedDiagnosticStatuses.filter(
            (status) =>
              status !==
              "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics"
          ),
          "stale-private-scheduler-diagnostic-status"
        ],
        acceptedDiagnosticRoles: [
          ...row.acceptedDiagnosticRoles,
          "caller-provided-post-task-role"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_886_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.privateDiagnosticStatusesRecognized, false);
  assert.equal(gate.privateDiagnosticRolesRecognized, false);
  assertViolationIds(gate, [
    "scheduler-variant-private-diagnostic-status-mismatch",
    "scheduler-variant-private-diagnostic-role-mismatch"
  ]);
  const statusRows = getViolationRows(
    gate,
    "scheduler-variant-private-diagnostic-status-mismatch"
  );
  assert.equal(statusRows[0].variantId, "scheduler-unstable-mock-root");
  assert.deepEqual(statusRows[0].unexpectedValues, [
    "stale-private-scheduler-diagnostic-status"
  ]);
});

test("private admission 886 gate rejects prose, test-title, error-message, caller-shaped, and source-syntax evidence", () => {
  const gate = evaluatePrivateAdmission886Gate({
    rowOverrides: {
      "scheduler-unstable-mock-root": {
        evidence: withAdditionalEvidenceTokens(
          rowByVariant("scheduler-unstable-mock-root"),
          "scheduler-unstable-mock-source-owned-boundary",
          [
            "Object.defineProperty(wrappedFunction, privateActQueueFlushDiagnosticsExport",
            "diagnostics.schedulerMockExpiredActRootWorkSourceValidator",
            "validator.isSchedulerMockExpiredActRootWorkSource(diagnostics)",
            "mock Scheduler callback handle may be drained.",
            "scheduler mock rejects unsafe delayed renderer-root producer metadata"
          ]
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_886_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.durableEvidenceTokensRecognized, false);
  assert.deepEqual(gate.nonDurableEvidenceTokenViolationIds, [
    "scheduler-unstable-mock-root.scheduler-unstable-mock-source-owned-boundary"
  ]);
  assertViolationIds(gate, [
    "scheduler-variant-source-token-missing-or-context-mismatch",
    "scheduler-variant-non-durable-evidence-token"
  ]);

  const evidenceRow = gate.rowsByVariant[
    "scheduler-unstable-mock-root"
  ].evidence.find(
    (row) => row.role === "scheduler-unstable-mock-source-owned-boundary"
  );
  assert.notEqual(evidenceRow, undefined);
  assert.deepEqual(evidenceRow.missingTokens, [
    "diagnostics.schedulerMockExpiredActRootWorkSourceValidator",
    "validator.isSchedulerMockExpiredActRootWorkSource(diagnostics)",
    "scheduler mock rejects unsafe delayed renderer-root producer metadata"
  ]);
  assertSubset(
    [
      "object-api-expression",
      "member-call-expression",
      "prose-test-title-or-error-message"
    ],
    evidenceRow.nonDurableTokens.map((entry) => entry.shapeId)
  );
});

test("private admission 886 gate rejects public timing, root, act, package, native, postTask, and mock claims", () => {
  const gate = evaluatePrivateAdmission886Gate({
    rowOverrides: {
      "scheduler-index-wrapper": {
        publicBlockerClaims: {
          publicSchedulerTimingCompatibilityClaimed: true,
          publicRootSchedulerCompatibilityClaimed: true,
          publicReactActCompatibilityClaimed: true,
          packageCompatibilityClaimed: true,
          newPublicExportsAdded: true,
          publicTimingAliasAccepted: true,
          publicRootAliasAccepted: true,
          publicActAliasAccepted: true,
          publicPackageAliasAccepted: true
        },
        requirements: {
          publicSchedulerTimingCompatibilityClaimed: true,
          publicRootSchedulerCompatibilityClaimed: true,
          publicReactActCompatibilityClaimed: true,
          publicPackageCompatibilityClaimed: true,
          newPublicExportsAdded: true,
          packageSurfaceChanged: true
        }
      },
      "scheduler-native-wrapper": {
        publicBlockerClaims: {
          publicNativeCompatibilityClaimed: true,
          nativePublicBehaviorClaimed: true,
          publicNativeAliasAccepted: true
        }
      },
      "scheduler-cjs-unstable-post-task-production": {
        publicBlockerClaims: {
          browserPostTaskCompatibilityClaimed: true,
          postTaskPublicBehaviorClaimed: true,
          publicPostTaskAliasAccepted: true
        }
      },
      "scheduler-unstable-mock-root": {
        publicBlockerClaims: {
          mockSchedulerPublicBehaviorClaimed: true,
          publicMockAliasAccepted: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_886_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.publicCompatibilityAliasesBlocked, false);
  assert.equal(gate.publicVariantBehaviorClaimsBlocked, false);
  assert.equal(gate.packageSurfaceBlocked, false);
  assert.equal(gate.requirementsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertSubset(
    [
      "scheduler-index-wrapper.publicSchedulerTimingCompatibilityClaimed",
      "scheduler-index-wrapper.publicRootSchedulerCompatibilityClaimed",
      "scheduler-index-wrapper.publicReactActCompatibilityClaimed",
      "scheduler-index-wrapper.packageCompatibilityClaimed",
      "scheduler-index-wrapper.newPublicExportsAdded",
      "scheduler-native-wrapper.publicNativeCompatibilityClaimed",
      "scheduler-native-wrapper.nativePublicBehaviorClaimed",
      "scheduler-cjs-unstable-post-task-production.browserPostTaskCompatibilityClaimed",
      "scheduler-cjs-unstable-post-task-production.postTaskPublicBehaviorClaimed",
      "scheduler-unstable-mock-root.mockSchedulerPublicBehaviorClaimed"
    ],
    gate.publicBlockerClaimViolationIds
  );
  assertSubset(
    [
      "scheduler-index-wrapper.publicTimingAliasAccepted",
      "scheduler-index-wrapper.publicRootAliasAccepted",
      "scheduler-index-wrapper.publicActAliasAccepted",
      "scheduler-index-wrapper.publicPackageAliasAccepted",
      "scheduler-native-wrapper.publicNativeAliasAccepted",
      "scheduler-cjs-unstable-post-task-production.publicPostTaskAliasAccepted",
      "scheduler-unstable-mock-root.publicMockAliasAccepted"
    ],
    gate.publicCompatibilityAliasClaimIds
  );
  assertSubset(
    [
      "scheduler-native-wrapper.publicNativeCompatibilityClaimed",
      "scheduler-cjs-unstable-post-task-production.browserPostTaskCompatibilityClaimed",
      "scheduler-unstable-mock-root.mockSchedulerPublicBehaviorClaimed"
    ],
    gate.publicVariantBehaviorClaimIds
  );
  assertSubset(
    [
      "scheduler-index-wrapper.packageCompatibilityClaimed",
      "scheduler-index-wrapper.newPublicExportsAdded"
    ],
    gate.publicPackageSurfaceClaimIds
  );
  assertViolationIds(gate, [
    "scheduler-variant-public-compatibility-claim-detected",
    "scheduler-variant-public-alias-claim-detected",
    "scheduler-variant-public-behavior-claim-detected",
    "scheduler-variant-package-surface-claim-detected",
    "scheduler-variant-requirement-mismatch"
  ]);
});

function assertVariantRow(
  row,
  { variantFamily, entrypoint, sourceFile, expectedDiagnosticIds }
) {
  assert.equal(row.sourceBoundary.variantFamily, variantFamily);
  assert.equal(row.sourceBoundary.entrypoint, entrypoint);
  assert.equal(row.sourceBoundary.sourceFile, sourceFile);
  assert.deepEqual(row.acceptedDiagnosticIds, expectedDiagnosticIds);
  assert.equal(row.ledgerEvaluationMode, "source-token-checks-and-manifest-only");
  assert.equal(row.evidenceRecognized, true);
  assertAllFalse(row.publicBlockerClaims, row.variantId);
  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.nonDurableTokens, [], evidenceRow.role);
  }
}

function assertAllFalse(record, label) {
  assert.deepEqual(
    Object.values(record),
    Object.values(record).map(() => false),
    label
  );
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function getViolationRows(gate, id) {
  const violation = gate.violations.find((candidate) => candidate.id === id);
  assert.notEqual(violation, undefined, id);
  return violation.rows;
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function rowByVariant(variantId) {
  const row = PRIVATE_ADMISSION_886_ROWS.find(
    (candidate) => candidate.variantId === variantId
  );
  assert.notEqual(row, undefined, variantId);
  return row;
}

function withAdditionalEvidenceTokens(row, role, tokens) {
  return row.evidence.map((evidenceRow) =>
    evidenceRow.role === role
      ? {
          ...evidenceRow,
          tokens: [...evidenceRow.tokens, ...tokens]
        }
      : evidenceRow
  );
}
