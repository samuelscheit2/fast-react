import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_799_GATE_STATUS,
  PRIVATE_ADMISSION_799_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_799_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_799_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_799_REQUIRED_REQUIREMENTS,
  PRIVATE_ADMISSION_799_ROWS,
  PRIVATE_ADMISSION_799_VIOLATION_STATUS,
  PRIVATE_ADMISSION_799_WORKERS,
  evaluatePrivateAdmission799Gate
} from "../src/private-admission-799-sibling-text-js-cjs-ledger.mjs";

const worker768 = "worker-768-test-renderer-index-sibling-text-admission";
const worker769 = "worker-769-cjs-sibling-text-totree-admission";
const worker787 = "worker-787-cjs-sibling-text-tojson-admission";
const expectedWorkers = [worker768, worker769, worker787];

test("private admission 799 manifest records accepted sibling-text JS/CJS admission rows", () => {
  assert.deepEqual(PRIVATE_ADMISSION_799_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_799_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_799_ROWS.length, 3);

  assert.deepEqual(
    PRIVATE_ADMISSION_799_ROWS.map((row) => row.privateAdmission),
    [
      "accepted-private-package-root-sibling-text-tojson",
      "accepted-private-cjs-sibling-text-totree",
      "accepted-private-cjs-sibling-text-tojson"
    ]
  );

  for (const row of PRIVATE_ADMISSION_799_ROWS) {
    assert.deepEqual(
      Object.keys(row.publicBlockerClaims).sort(),
      [...PRIVATE_ADMISSION_799_PUBLIC_BLOCKER_FIELDS].sort(),
      row.workerId
    );
    assert.deepEqual(
      Object.values(row.publicBlockerClaims),
      Object.values(row.publicBlockerClaims).map(() => false),
      row.workerId
    );
  }
});

test("private admission 799 gate recognizes root, CJS toTree, and CJS toJSON private admissions without compatibility", () => {
  const gate = evaluatePrivateAdmission799Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_799_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.requirementsRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicBlockerClaimViolationIds, []);
  assert.deepEqual(gate.nativeRuntimeLeakClaimIds, []);
  assert.deepEqual(gate.packageExportLeakClaimIds, []);
  assert.deepEqual(gate.publicSerializationLeakClaimIds, []);

  assertPrivateAdmissionRow(gate.rowsByWorker[worker768], {
    privateAdmission: "accepted-private-package-root-sibling-text-tojson",
    entrypointScope: "package-root",
    publicSurface: "create().update -> create().toJSON",
    toJSONAdmission: true,
    toTreeAdmission: false,
    packageRootEntrypoint: true,
    cjsEntrypoint: false,
    implementationPaths: ["packages/react-test-renderer/index.js"],
    evidenceRoles: [
      "worker-768-progress",
      "worker-768-package-root-source",
      "worker-768-serialization-gate-test",
      "react-test-renderer-package-surface",
      "react-test-renderer-import-smoke-export-blocker"
    ]
  });

  assertPrivateAdmissionRow(gate.rowsByWorker[worker769], {
    privateAdmission: "accepted-private-cjs-sibling-text-totree",
    entrypointScope: "cjs-development-production",
    publicSurface: "create().toTree",
    toJSONAdmission: false,
    toTreeAdmission: true,
    packageRootEntrypoint: false,
    cjsEntrypoint: true,
    implementationPaths: [
      "packages/react-test-renderer/cjs/react-test-renderer.development.js",
      "packages/react-test-renderer/cjs/react-test-renderer.production.js"
    ],
    evidenceRoles: [
      "worker-769-progress",
      "worker-769-cjs-development-source",
      "worker-769-cjs-production-source",
      "worker-769-serialization-gate-test",
      "worker-769-create-routing-gate-test",
      "react-test-renderer-package-surface",
      "react-test-renderer-import-smoke-export-blocker"
    ]
  });

  assertPrivateAdmissionRow(gate.rowsByWorker[worker787], {
    privateAdmission: "accepted-private-cjs-sibling-text-tojson",
    entrypointScope: "cjs-development-production",
    publicSurface: "create().update -> create().toJSON",
    toJSONAdmission: true,
    toTreeAdmission: false,
    packageRootEntrypoint: false,
    cjsEntrypoint: true,
    implementationPaths: [
      "packages/react-test-renderer/cjs/react-test-renderer.development.js",
      "packages/react-test-renderer/cjs/react-test-renderer.production.js"
    ],
    evidenceRoles: [
      "worker-787-progress",
      "worker-787-cjs-development-source",
      "worker-787-cjs-production-source",
      "worker-787-serialization-gate-test",
      "worker-787-create-routing-gate-test",
      "react-test-renderer-package-surface",
      "react-test-renderer-import-smoke-export-blocker"
    ]
  });
});

test("private admission 799 gate rejects missing CJS toTree source evidence", () => {
  const gate = evaluatePrivateAdmission799Gate({
    rowOverrides: {
      [worker769]: {
        evidence: withMissingEvidenceToken(
          rowByWorker(worker769),
          "worker-769-cjs-development-source",
          "missing-cjs-totree-root-finished-lanes-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_799_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
  assertEvidenceRoleRecognized(
    gate,
    worker769,
    "worker-769-cjs-development-source",
    false
  );
});

test("private admission 799 gate rejects missing root handoff and committed inspection requirements", () => {
  const gate = evaluatePrivateAdmission799Gate({
    rowOverrides: {
      [worker787]: {
        acceptedDiagnosticIds:
          PRIVATE_ADMISSION_799_REQUIRED_ACCEPTED_DIAGNOSTICS[
            worker787
          ].filter(
            (diagnosticId) =>
              diagnosticId !==
              "react-test-renderer-root-finished-lanes-handoff-private-diagnostic"
          ),
        requirements: {
          rootFinishedLanesHandoff: false,
          ownRootFinishedLanesHandoffRequirement: false,
          committedFiberInspection: false,
          committedFiberInspectionCurrentMatchesCommit: false
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_799_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assert.equal(gate.requirementsRecognized, false);
  assertViolationIds(gate, [
    "accepted-sibling-text-diagnostic-id-mismatch",
    "sibling-text-admission-requirement-mismatch"
  ]);
});

test("private admission 799 gate rejects public serialization, native, package, export, and runtime execution claims", () => {
  const gate = evaluatePrivateAdmission799Gate({
    rowOverrides: {
      [worker768]: {
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        runtimeExecutionClaimed: true,
        nativeBridgeExecuted: true,
        ledgerEvaluationMode: "runtime-execution",
        publicBlockerClaims: {
          publicToJSONAvailable: true,
          publicToTreeAvailable: true,
          publicTestInstanceAvailable: true,
          nativeBridgeAvailable: true,
          nativeBridgeExecutionAvailable: true,
          nativeExecutionAvailable: true,
          packageCompatibilityClaimed: true,
          packageExportCompatibilityClaimed: true,
          publicExportCompatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_799_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "private-ledger-runtime-execution-claim",
    "public-serialization-claim-detected",
    "native-bridge-or-execution-claim-detected",
    "package-or-export-compatibility-claim-detected"
  ]);
  assertSubset(
    [
      `${worker768}.publicToJSONAvailable`,
      `${worker768}.publicToTreeAvailable`,
      `${worker768}.publicTestInstanceAvailable`
    ],
    gate.publicSerializationLeakClaimIds
  );
  assertSubset(
    [
      `${worker768}.nativeBridgeAvailable`,
      `${worker768}.nativeBridgeExecutionAvailable`,
      `${worker768}.nativeExecutionAvailable`
    ],
    gate.nativeRuntimeLeakClaimIds
  );
  assertSubset(
    [
      `${worker768}.packageCompatibilityClaimed`,
      `${worker768}.packageExportCompatibilityClaimed`,
      `${worker768}.publicExportCompatibilityClaimed`
    ],
    gate.packageExportLeakClaimIds
  );
});

function assertPrivateAdmissionRow(
  row,
  {
    privateAdmission,
    entrypointScope,
    publicSurface,
    toJSONAdmission,
    toTreeAdmission,
    packageRootEntrypoint,
    cjsEntrypoint,
    implementationPaths,
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, privateAdmission);
  assert.equal(row.sourceQueue, "799");
  assert.equal(row.entrypointScope, entrypointScope);
  assert.equal(row.publicSurface, publicSurface);
  assert.deepEqual(row.implementationPaths, implementationPaths);
  assert.deepEqual(
    row.acceptedDiagnosticIds,
    PRIVATE_ADMISSION_799_REQUIRED_ACCEPTED_DIAGNOSTICS[row.workerId]
  );
  assert.deepEqual(
    row.priorLedgerContext,
    PRIVATE_ADMISSION_799_REQUIRED_PRIOR_LEDGER_CONTEXT[row.workerId]
  );
  for (const [key, expected] of Object.entries(
    PRIVATE_ADMISSION_799_REQUIRED_REQUIREMENTS
  )) {
    assert.equal(row.requirements[key], expected, `${row.workerId}.${key}`);
  }
  assert.equal(row.requirements.toJSONAdmission, toJSONAdmission);
  assert.equal(row.requirements.toTreeAdmission, toTreeAdmission);
  assert.equal(row.requirements.packageRootEntrypoint, packageRootEntrypoint);
  assert.equal(row.requirements.cjsEntrypoint, cjsEntrypoint);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.privateEvidenceOnly, true);
  assert.equal(row.sourceTokenChecksOnly, true);
  assert.equal(row.manifestEvaluationOnly, true);
  assert.equal(row.runtimeExecutionClaimed, false);
  assert.equal(row.nativeBridgeExecuted, false);
  assert.equal(
    row.ledgerEvaluationMode,
    "source-token-checks-and-manifest-only"
  );
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
  assertNoPublicClaims(row);
}

function assertNoPublicClaims(row) {
  assert.deepEqual(
    Object.keys(row.publicBlockerClaims).sort(),
    [...PRIVATE_ADMISSION_799_PUBLIC_BLOCKER_FIELDS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.publicBlockerClaims),
    Object.values(row.publicBlockerClaims).map(() => false),
    row.workerId
  );
  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.path);
  }
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
  }
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
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
  const row = PRIVATE_ADMISSION_799_ROWS.find(
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
