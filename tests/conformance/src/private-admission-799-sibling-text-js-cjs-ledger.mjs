import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_754_766_GATE_ID,
  PRIVATE_ADMISSION_754_766_GATE_STATUS
} from "./private-admission-754-766-gate.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_799_GATE_ID =
  "private-admission-799-sibling-text-js-cjs-ledger-1";
export const PRIVATE_ADMISSION_799_GATE_STATUS =
  "recognized-accepted-private-sibling-text-js-cjs-admissions-public-blocked";
export const PRIVATE_ADMISSION_799_VIOLATION_STATUS =
  "blocked-accepted-private-sibling-text-js-cjs-admissions-with-violations";

export const PRIVATE_ADMISSION_799_DIAGNOSTIC_IDS = freezeArray([
  "fast-react-test-renderer.tojson.sibling-text.finished-work-identity",
  "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked",
  "react-test-renderer-root-finished-lanes-handoff-private-diagnostic",
  "private-root-finished-work-lanes-handoff-public-serialization-native-blocked",
  "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic",
  "fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission",
  "private-tojson-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked",
  "fast-react-test-renderer.totree.sibling-text.private-js-cjs-admission",
  "private-totree-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked"
]);

export const PRIVATE_ADMISSION_799_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicToJSONAvailable",
  "publicToTreeAvailable",
  "publicTestInstanceAvailable",
  "publicSerializationAvailable",
  "publicRouteAvailable",
  "nativeBridgeLoadingAvailable",
  "nativeBridgeAvailable",
  "nativeBridgeExecutionAvailable",
  "nativeExecutionAvailable",
  "packageCompatibilityClaimed",
  "packageExportCompatibilityClaimed",
  "publicExportCompatibilityClaimed",
  "compatibilityClaimed"
]);

export const PRIVATE_ADMISSION_799_REQUIRED_REQUIREMENTS = freezeRecord({
  dedicatedFinishedWorkIdentity: true,
  rootFinishedLanesHandoff: true,
  ownRootFinishedLanesHandoffRequirement: true,
  committedFiberInspection: true,
  committedFiberInspectionCurrentMatchesCommit: true,
  siblingTextHostOutputRow: true,
  siblingTextHostOutputShape: "SiblingText",
  rootChildCount: 2,
  sourceNodeCount: 3,
  genericFinishedWorkIdentityRejected: true,
  broadMultichildIdentityRejected: true,
  staticReadOnlyLedger: true,
  runtimeExecutionClaimed: false,
  nativeBridgeExecuted: false
});

const worker768 = "worker-768-test-renderer-index-sibling-text-admission";
const worker769 = "worker-769-cjs-sibling-text-totree-admission";
const worker787 = "worker-787-cjs-sibling-text-tojson-admission";

export const PRIVATE_ADMISSION_799_WORKERS = freezeArray([
  worker768,
  worker769,
  worker787
]);

export const PRIVATE_ADMISSION_799_REQUIRED_ACCEPTED_DIAGNOSTICS =
  freezeRecord({
    [worker768]: freezeArray([
      "fast-react-test-renderer.tojson.sibling-text.finished-work-identity",
      "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked",
      "react-test-renderer-root-finished-lanes-handoff-private-diagnostic",
      "private-root-finished-work-lanes-handoff-public-serialization-native-blocked",
      "fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission",
      "private-tojson-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked",
      "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic"
    ]),
    [worker769]: freezeArray([
      "fast-react-test-renderer.tojson.sibling-text.finished-work-identity",
      "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked",
      "react-test-renderer-root-finished-lanes-handoff-private-diagnostic",
      "private-root-finished-work-lanes-handoff-public-serialization-native-blocked",
      "fast-react-test-renderer.totree.sibling-text.private-js-cjs-admission",
      "private-totree-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked",
      "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic"
    ]),
    [worker787]: freezeArray([
      "fast-react-test-renderer.tojson.sibling-text.finished-work-identity",
      "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked",
      "react-test-renderer-root-finished-lanes-handoff-private-diagnostic",
      "private-root-finished-work-lanes-handoff-public-serialization-native-blocked",
      "fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission",
      "private-tojson-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked",
      "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic"
    ])
  });

export const PRIVATE_ADMISSION_799_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker768]: freezeArray([
      PRIVATE_ADMISSION_754_766_GATE_ID,
      PRIVATE_ADMISSION_754_766_GATE_STATUS,
      "worker-745-test-renderer-sibling-text-identity-gate",
      "worker-766-test-renderer-root-finished-lanes-handoff"
    ]),
    [worker769]: freezeArray([
      PRIVATE_ADMISSION_754_766_GATE_ID,
      PRIVATE_ADMISSION_754_766_GATE_STATUS,
      "worker-745-test-renderer-sibling-text-identity-gate",
      "worker-766-test-renderer-root-finished-lanes-handoff",
      "worker-768-test-renderer-index-sibling-text-admission"
    ]),
    [worker787]: freezeArray([
      PRIVATE_ADMISSION_754_766_GATE_ID,
      PRIVATE_ADMISSION_754_766_GATE_STATUS,
      "worker-763-sibling-text-js-cjs-private-admission",
      "worker-766-test-renderer-root-finished-lanes-handoff",
      "worker-769-cjs-sibling-text-totree-admission"
    ])
  });

const packageRootPath = "packages/react-test-renderer/index.js";
const cjsDevelopmentPath =
  "packages/react-test-renderer/cjs/react-test-renderer.development.js";
const cjsProductionPath =
  "packages/react-test-renderer/cjs/react-test-renderer.production.js";
const serializationGateTestPath =
  "tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs";
const createRoutingGateTestPath =
  "tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs";
const packageJsonPath = "packages/react-test-renderer/package.json";
const importSmokePath = "tests/smoke/import-entrypoints.mjs";

const rowData799 = freezeArray([
  rowData({
    workerId: worker768,
    privateAdmission: "accepted-private-package-root-sibling-text-tojson",
    entrypointScope: "package-root",
    publicSurface: "create().update -> create().toJSON",
    implementationPaths: freezeArray([packageRootPath]),
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_799_REQUIRED_ACCEPTED_DIAGNOSTICS[worker768],
    priorLedgerContext:
      PRIVATE_ADMISSION_799_REQUIRED_PRIOR_LEDGER_CONTEXT[worker768],
    requirements: freezeRecord({
      ...PRIVATE_ADMISSION_799_REQUIRED_REQUIREMENTS,
      cjsEntrypoint: false,
      packageRootEntrypoint: true,
      toJSONAdmission: true,
      toTreeAdmission: false
    }),
    evidenceRows: [
      evidenceData({
        role: "worker-768-progress",
        path: "worker-progress/worker-768-test-renderer-index-sibling-text-admission.md",
        tokens: [
          "worker-768-test-renderer-index-sibling-text-admission",
          "rootFinishedLanesHandoff",
          "`packages/react-test-renderer/index.js`"
        ]
      }),
      evidenceData({
        role: "worker-768-package-root-source",
        path: packageRootPath,
        tokens: [
          "fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission",
          "private-tojson-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked",
          "createPrivateToJSONSiblingTextJSAdmissionDiagnosticResult(",
          "canCreateAcceptedSiblingTextDiagnosticResult(",
          "Expected canonical private rootFinishedLanesHandoff evidence.",
          "validatePrivateRootFinishedLanesHandoffEvidence(",
          "committedFiberInspectionCurrentMatchesCommit: true",
          "consumesPrivateRootFinishedLanesHandoffGate: true",
          "publicToJSONAvailable: false",
          "publicToTreeAvailable: false",
          "publicTestInstanceAvailable: false",
          "nativeBridgeLoadingAvailable: false",
          "nativeBridgeAvailable: false",
          "nativeExecution: false",
          "packageCompatibilityClaimed: false"
        ]
      }),
      evidenceData({
        role: "worker-768-serialization-gate-test",
        path: serializationGateTestPath,
        tokens: [
          "jsonFacade.createAcceptedSiblingTextDiagnosticResult(",
          "siblingTextDiagnostic.rootFinishedLanesHandoffAccepted",
          "siblingTextDiagnostic.committedFiberInspection",
          "siblingTextDiagnostic.publicToJSONAvailable",
          "siblingTextDiagnostic.packageCompatibilityClaimed"
        ]
      }),
      packageSurfaceEvidenceData()
    ]
  }),
  rowData({
    workerId: worker769,
    privateAdmission: "accepted-private-cjs-sibling-text-totree",
    entrypointScope: "cjs-development-production",
    publicSurface: "create().toTree",
    implementationPaths: freezeArray([cjsDevelopmentPath, cjsProductionPath]),
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_799_REQUIRED_ACCEPTED_DIAGNOSTICS[worker769],
    priorLedgerContext:
      PRIVATE_ADMISSION_799_REQUIRED_PRIOR_LEDGER_CONTEXT[worker769],
    requirements: freezeRecord({
      ...PRIVATE_ADMISSION_799_REQUIRED_REQUIREMENTS,
      cjsEntrypoint: true,
      packageRootEntrypoint: false,
      toJSONAdmission: false,
      toTreeAdmission: true
    }),
    evidenceRows: [
      evidenceData({
        role: "worker-769-progress",
        path: "worker-progress/worker-769-cjs-sibling-text-totree-admission.md",
        tokens: [
          "# Worker 769 - CJS Sibling Text toTree Admission",
          "rootFinishedLanesHandoff",
          "committedFiberInspection"
        ]
      }),
      cjsToTreeEvidenceData({
        role: "worker-769-cjs-development-source",
        path: cjsDevelopmentPath
      }),
      cjsToTreeEvidenceData({
        role: "worker-769-cjs-production-source",
        path: cjsProductionPath
      }),
      evidenceData({
        role: "worker-769-serialization-gate-test",
        path: serializationGateTestPath,
        tokens: [
          "privateToTreeSiblingTextJSAdmissionDiagnosticName",
          "treeFacade.createAcceptedSiblingTextDiagnosticResult(",
          "siblingTreeDiagnostic.rootFinishedLanesHandoffAccepted",
          "siblingTreeDiagnostic.publicToTreeAvailable"
        ]
      }),
      evidenceData({
        role: "worker-769-create-routing-gate-test",
        path: createRoutingGateTestPath,
        tokens: [
          "privateToTreeSiblingTextJSAdmissionDiagnosticName",
          "record.canCreateAcceptedSiblingTextDiagnosticResult",
          "record.nativeBridgeAvailable",
          "record.nativeExecution"
        ]
      }),
      packageSurfaceEvidenceData()
    ]
  }),
  rowData({
    workerId: worker787,
    privateAdmission: "accepted-private-cjs-sibling-text-tojson",
    entrypointScope: "cjs-development-production",
    publicSurface: "create().update -> create().toJSON",
    implementationPaths: freezeArray([cjsDevelopmentPath, cjsProductionPath]),
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_799_REQUIRED_ACCEPTED_DIAGNOSTICS[worker787],
    priorLedgerContext:
      PRIVATE_ADMISSION_799_REQUIRED_PRIOR_LEDGER_CONTEXT[worker787],
    requirements: freezeRecord({
      ...PRIVATE_ADMISSION_799_REQUIRED_REQUIREMENTS,
      cjsEntrypoint: true,
      packageRootEntrypoint: false,
      toJSONAdmission: true,
      toTreeAdmission: false
    }),
    evidenceRows: [
      evidenceData({
        role: "worker-787-progress",
        path: "worker-progress/worker-787-cjs-sibling-text-tojson-admission.md",
        tokens: [
          "# Worker 787 - CJS Sibling Text toJSON Admission",
          "rootFinishedLanesHandoff",
          "committed fiber inspection"
        ]
      }),
      cjsToJSONEvidenceData({
        role: "worker-787-cjs-development-source",
        path: cjsDevelopmentPath
      }),
      cjsToJSONEvidenceData({
        role: "worker-787-cjs-production-source",
        path: cjsProductionPath
      }),
      evidenceData({
        role: "worker-787-serialization-gate-test",
        path: serializationGateTestPath,
        tokens: [
          "jsonFacade.createAcceptedSiblingTextDiagnosticResult(",
          "siblingTextDiagnostic.rootFinishedLanesHandoffAccepted",
          "siblingTextDiagnostic.committedFiberInspection",
          "assertSiblingTextAdmissionRejection("
        ]
      }),
      evidenceData({
        role: "worker-787-create-routing-gate-test",
        path: createRoutingGateTestPath,
        tokens: [
          "privateToJSONSiblingTextJSAdmissionDiagnosticName",
          "record.canCreateAcceptedSiblingTextDiagnosticResult",
          "record.privateSiblingTextFinishedWorkIdentityDiagnosticName",
          "record.nativeBridgeAvailable"
        ]
      }),
      packageSurfaceEvidenceData()
    ]
  })
]);

export const PRIVATE_ADMISSION_799_ROWS = freezeArray(
  rowData799.map((sourceRow) =>
    row({
      workerId: sourceRow.workerId,
      privateAdmission: sourceRow.privateAdmission,
      entrypointScope: sourceRow.entrypointScope,
      publicSurface: sourceRow.publicSurface,
      implementationPaths: sourceRow.implementationPaths,
      acceptedDiagnosticIds: sourceRow.acceptedDiagnosticIds,
      priorLedgerContext: sourceRow.priorLedgerContext,
      requirements: sourceRow.requirements,
      evidence: sourceRow.evidenceRows,
      publicBlockerClaims: publicBlockerClaims()
    })
  )
);

export function evaluatePrivateAdmission799Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_799_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const manifestWorkerIds = rows.map((row) => row.workerId);
  const manifest = freezeRecord({
    workerIds: freezeArray(manifestWorkerIds),
    missingWorkerIds: freezeArray(
      PRIVATE_ADMISSION_799_WORKERS.filter(
        (workerId) => !manifestWorkerIds.includes(workerId)
      )
    ),
    unexpectedWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId) => !PRIVATE_ADMISSION_799_WORKERS.includes(workerId)
      )
    ),
    duplicateWorkerIds: freezeArray(
      manifestWorkerIds.filter(
        (workerId, index) => manifestWorkerIds.indexOf(workerId) !== index
      )
    )
  });

  const evidenceTokenMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          workerId: row.workerId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const acceptedDiagnosticMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_799_REQUIRED_ACCEPTED_DIAGNOSTICS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds"
  });
  const priorLedgerContextMismatches = compareRequiredArrayByWorker({
    rows: evaluatedRows,
    requiredByWorker: PRIVATE_ADMISSION_799_REQUIRED_PRIOR_LEDGER_CONTEXT,
    actualKey: "priorLedgerContext",
    expectedKey: "expectedPriorLedgerContext",
    actualKeyForViolation: "actualPriorLedgerContext"
  });
  const requirementMismatches = evaluatedRows.flatMap((row) => {
    const mismatches = [];
    for (const [key, expected] of Object.entries(
      PRIVATE_ADMISSION_799_REQUIRED_REQUIREMENTS
    )) {
      if (row.requirements[key] !== expected) {
        mismatches.push(
          freezeRecord({
            workerId: row.workerId,
            requirement: key,
            expected,
            actual: row.requirements[key]
          })
        );
      }
    }
    if (row.privateAdmission.includes("tojson")) {
      for (const [key, expected] of Object.entries({
        toJSONAdmission: true,
        toTreeAdmission: false
      })) {
        if (row.requirements[key] !== expected) {
          mismatches.push(
            freezeRecord({
              workerId: row.workerId,
              requirement: key,
              expected,
              actual: row.requirements[key]
            })
          );
        }
      }
    }
    if (row.privateAdmission.includes("totree")) {
      for (const [key, expected] of Object.entries({
        toJSONAdmission: false,
        toTreeAdmission: true
      })) {
        if (row.requirements[key] !== expected) {
          mismatches.push(
            freezeRecord({
              workerId: row.workerId,
              requirement: key,
              expected,
              actual: row.requirements[key]
            })
          );
        }
      }
    }
    return mismatches;
  });
  const publicBlockerKeyMismatches = evaluatedRows.flatMap((row) => {
    const actualKeys = Object.keys(row.publicBlockerClaims ?? {});
    if (sameStringSet(PRIVATE_ADMISSION_799_PUBLIC_BLOCKER_FIELDS, actualKeys)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        expectedPublicBlockerFields: PRIVATE_ADMISSION_799_PUBLIC_BLOCKER_FIELDS,
        actualPublicBlockerFields: freezeArray(actualKeys)
      })
    ];
  });
  const publicBlockerClaimViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockerClaims ?? {})
      .filter(([, claimed]) => claimed !== false)
      .map(([claimId]) => `${row.workerId}.${claimId}`)
  );
  const staticReadOnlyViolations = evaluatedRows
    .filter(
      (row) =>
        row.sourceTokenChecksOnly !== true ||
        row.manifestEvaluationOnly !== true ||
        row.runtimeExecutionClaimed !== false ||
        row.nativeBridgeExecuted !== false ||
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only"
    )
    .map((row) => row.workerId);
  const nativeRuntimeLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /(?:nativeBridgeLoadingAvailable|nativeBridgeAvailable|nativeBridgeExecutionAvailable|nativeExecutionAvailable)$/.test(
        claimId
      )
  );
  const packageExportLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /(?:packageCompatibilityClaimed|packageExportCompatibilityClaimed|publicExportCompatibilityClaimed)$/.test(
        claimId
      )
  );
  const publicSerializationLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /(?:publicToJSONAvailable|publicToTreeAvailable|publicTestInstanceAvailable|publicSerializationAvailable|publicRouteAvailable|compatibilityClaimed)$/.test(
        claimId
      )
  );

  const violations = [];
  if (
    manifest.missingWorkerIds.length > 0 ||
    manifest.unexpectedWorkerIds.length > 0 ||
    manifest.duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("sibling-text-js-cjs-worker-manifest-mismatch", {
        missingWorkerIds: manifest.missingWorkerIds,
        unexpectedWorkerIds: manifest.unexpectedWorkerIds,
        duplicateWorkerIds: manifest.duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "private-admission-evidence-token-missing",
    evidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "accepted-sibling-text-diagnostic-id-mismatch",
    acceptedDiagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "prior-private-admission-ledger-context-mismatch",
    priorLedgerContextMismatches
  );
  pushRowsViolation(
    violations,
    "sibling-text-admission-requirement-mismatch",
    requirementMismatches
  );
  pushRowsViolation(
    violations,
    "public-blocker-field-mismatch",
    publicBlockerKeyMismatches
  );
  pushIdsViolation(
    violations,
    "private-ledger-runtime-execution-claim",
    staticReadOnlyViolations
  );
  pushClaimIdsViolation(
    violations,
    "public-serialization-claim-detected",
    publicSerializationLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-bridge-or-execution-claim-detected",
    nativeRuntimeLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "package-or-export-compatibility-claim-detected",
    packageExportLeakClaimIds
  );

  const evidenceRecognized = evidenceTokenMismatches.length === 0;
  const acceptedDiagnosticsRecognized =
    acceptedDiagnosticMismatches.length === 0;
  const priorLedgerContextRecognized =
    priorLedgerContextMismatches.length === 0;
  const requirementsRecognized = requirementMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerKeyMismatches.length === 0 &&
    publicBlockerClaimViolations.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolations.length === 0;
  const compatibilityClaimed = publicBlockerClaimViolations.length > 0;
  const privateDiagnosticsRecognized =
    manifest.missingWorkerIds.length === 0 &&
    manifest.unexpectedWorkerIds.length === 0 &&
    manifest.duplicateWorkerIds.length === 0 &&
    evidenceRecognized &&
    acceptedDiagnosticsRecognized &&
    priorLedgerContextRecognized &&
    requirementsRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_799_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_799_GATE_STATUS
      : PRIVATE_ADMISSION_799_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    evidenceRecognized,
    acceptedDiagnosticsRecognized,
    priorLedgerContextRecognized,
    requirementsRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    queueWorkers: PRIVATE_ADMISSION_799_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows.map((row) => row.workerId)
    ),
    publicBlockerClaimViolationIds: freezeArray(publicBlockerClaimViolations),
    nativeRuntimeLeakClaimIds: freezeArray(nativeRuntimeLeakClaimIds),
    packageExportLeakClaimIds: freezeArray(packageExportLeakClaimIds),
    publicSerializationLeakClaimIds: freezeArray(
      publicSerializationLeakClaimIds
    ),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByWorker: indexRowsByWorker(evaluatedRows),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    implementationPaths: freezeArray(data.implementationPaths),
    acceptedDiagnosticIds: freezeArray(data.acceptedDiagnosticIds),
    priorLedgerContext: freezeArray(data.priorLedgerContext),
    requirements: freezeRecord(data.requirements),
    evidenceRows: freezeArray(data.evidenceRows)
  });
}

function evidenceData({
  role,
  path,
  tokens,
  forbiddenTokens = [],
  sliceStart = null,
  sliceEnd = null
}) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens),
    sliceStart,
    sliceEnd
  });
}

function cjsToJSONEvidenceData({ role, path }) {
  return evidenceData({
    role,
    path,
    tokens: [
      "fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission",
      "private-tojson-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked",
      "createPrivateToJSONSiblingTextJSAdmissionDiagnosticResult(",
      "requireRootFinishedLanesHandoff: true",
      "validatePrivateRootFinishedLanesHandoffEvidence(",
      "committedFiberInspection: diagnostic.committedFiberInspection",
      "consumesCommittedFiberInspection: true",
      "committedFiberInspectionCurrentMatchesCommit: true",
      "consumesPrivateRootFinishedLanesHandoffGate: true",
      "publicToJSONAvailable: false",
      "publicToTreeAvailable: false",
      "publicTestInstanceAvailable: false",
      "nativeBridgeLoadingAvailable: false",
      "nativeBridgeAvailable: false",
      "nativeExecution: false",
      "packageCompatibilityClaimed: false"
    ]
  });
}

function cjsToTreeEvidenceData({ role, path }) {
  return evidenceData({
    role,
    path,
    tokens: [
      "fast-react-test-renderer.totree.sibling-text.private-js-cjs-admission",
      "private-totree-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked",
      "createPrivateToTreeSiblingTextJSAdmissionDiagnosticResult(",
      "sourceReportKind: 'toTree'",
      "requireRootFinishedLanesHandoff: true",
      "validatePrivateRootFinishedLanesHandoffEvidence(",
      "committedFiberInspectionCurrentMatchesCommit: true",
      "consumesPrivateRootFinishedLanesHandoffGate: true",
      "consumesPrivateToTreeEvidence: true",
      "functionComponentAboveHostOutputShape: true",
      "publicToJSONAvailable: false",
      "publicToTreeAvailable: false",
      "publicTestInstanceAvailable: false",
      "nativeBridgeLoadingAvailable: false",
      "nativeBridgeAvailable: false",
      "nativeExecution: false",
      "packageCompatibilityClaimed: false"
    ]
  });
}

function packageSurfaceEvidenceData() {
  return evidenceData({
    role: "react-test-renderer-package-surface",
    path: packageJsonPath,
    tokens: ['"main": "index.js"'],
    forbiddenTokens: ['"exports"']
  });
}

function publicBlockerClaims(extraClaims = {}) {
  return freezeRecord({
    ...Object.fromEntries(
      PRIVATE_ADMISSION_799_PUBLIC_BLOCKER_FIELDS.map((claimId) => [
        claimId,
        false
      ])
    ),
    ...extraClaims
  });
}

function row({
  workerId,
  privateAdmission,
  entrypointScope,
  publicSurface,
  implementationPaths,
  acceptedDiagnosticIds,
  priorLedgerContext,
  requirements,
  evidence,
  publicBlockerClaims
}) {
  return freezeRecord({
    workerId,
    privateAdmission,
    sourceQueue: "799",
    localGateCoverage: PRIVATE_ADMISSION_799_GATE_ID,
    entrypointScope,
    publicSurface,
    implementationPaths: freezeArray(implementationPaths),
    acceptedDiagnosticIds: freezeArray(acceptedDiagnosticIds),
    priorLedgerContext: freezeArray(priorLedgerContext),
    requirements: freezeRecord(requirements),
    evidence: freezeArray([
      ...evidence,
      evidenceData({
        role: "react-test-renderer-import-smoke-export-blocker",
        path: importSmokePath,
        tokens: [
          "assert.equal(Object.hasOwn(reactTestRendererPackageJson, 'exports'), false);",
          "assertNoPrivateDiagnosticRuntimeExports(moduleExports, label);"
        ]
      })
    ]),
    publicBlockerClaims: freezeRecord(publicBlockerClaims),
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    nativeBridgeExecuted: false,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only"
  });
}

function mergeRowOverride(row, override) {
  if (override == null || Object.keys(override).length === 0) {
    return row;
  }

  const merged = { ...row, ...override };
  const arrayKeys = [
    "implementationPaths",
    "acceptedDiagnosticIds",
    "priorLedgerContext",
    "evidence"
  ];
  for (const key of arrayKeys) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "requirements")) {
    merged.requirements = freezeRecord({
      ...row.requirements,
      ...override.requirements
    });
  }
  if (Object.hasOwn(override, "publicBlockerClaims")) {
    merged.publicBlockerClaims = freezeRecord({
      ...row.publicBlockerClaims,
      ...override.publicBlockerClaims
    });
  }
  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({
      evidenceRow,
      fileCache,
      workspaceRoot
    })
  );

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRecognized: evidence.every(
      (evidenceRow) => evidenceRow.recognized === true
    )
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const readResult = readEvidenceFile({
    fileCache,
    path: evidenceRow.path,
    workspaceRoot
  });
  let text = readResult.text;
  let sliceError = null;
  if (readResult.readError === null) {
    const sliceResult = sliceEvidenceText({
      path: evidenceRow.path,
      text,
      sliceStart: evidenceRow.sliceStart,
      sliceEnd: evidenceRow.sliceEnd
    });
    text = sliceResult.text;
    sliceError = sliceResult.sliceError;
  }

  const missingTokens =
    readResult.readError === null && sliceError === null
      ? evidenceRow.tokens.filter((token) => !text.includes(token))
      : [...evidenceRow.tokens];
  const forbiddenTokensPresent =
    readResult.readError === null && sliceError === null
      ? evidenceRow.forbiddenTokens.filter((token) => text.includes(token))
      : [];

  return freezeRecord({
    ...evidenceRow,
    recognized:
      readResult.readError === null &&
      sliceError === null &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    readError: readResult.readError,
    sliceError
  });
}

function readEvidenceFile({ fileCache, path, workspaceRoot }) {
  if (fileCache.has(path)) {
    return fileCache.get(path);
  }
  let result;
  try {
    result = freezeRecord({
      text: readFileSync(join(workspaceRoot, path), "utf8"),
      readError: null
    });
  } catch (error) {
    result = freezeRecord({
      text: "",
      readError: error instanceof Error ? error.message : String(error)
    });
  }
  fileCache.set(path, result);
  return result;
}

function sliceEvidenceText({ path, text, sliceStart, sliceEnd }) {
  let startIndex = 0;
  let endIndex = text.length;
  if (sliceStart !== null) {
    startIndex = text.indexOf(sliceStart);
    if (startIndex === -1) {
      return freezeRecord({
        text: "",
        sliceError: `sliceStart not found in ${path}`
      });
    }
  }
  if (sliceEnd !== null) {
    endIndex = text.indexOf(sliceEnd, startIndex);
    if (endIndex === -1) {
      return freezeRecord({
        text: "",
        sliceError: `sliceEnd not found in ${path}`
      });
    }
  }
  return freezeRecord({
    text: text.slice(startIndex, endIndex),
    sliceError: null
  });
}

function compareRequiredArrayByWorker({
  rows,
  requiredByWorker,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByWorker[row.workerId] ?? [];
    const actual = row[actualKey] ?? [];
    if (sameStringSet(expected, actual)) {
      return [];
    }
    return [
      freezeRecord({
        workerId: row.workerId,
        [expectedKey]: freezeArray(expected),
        [actualKeyForViolation]: freezeArray(actual)
      })
    ];
  });
}

function createViolation(id, details = {}) {
  return freezeRecord({ id, ...details });
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(createViolation(id, { rows: freezeArray(rows) }));
  }
}

function pushIdsViolation(violations, id, workerIds) {
  if (workerIds.length > 0) {
    violations.push(createViolation(id, { workerIds: freezeArray(workerIds) }));
  }
}

function pushClaimIdsViolation(violations, id, claimIds) {
  if (claimIds.length > 0) {
    violations.push(createViolation(id, { claimIds: freezeArray(claimIds) }));
  }
}

function indexRowsByWorker(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((row) => [row.workerId, row]))
  );
}

function sameStringSet(expected, actual) {
  if (expected.length !== actual.length) {
    return false;
  }
  const actualSet = new Set(actual);
  if (actualSet.size !== actual.length) {
    return false;
  }
  return expected.every((value) => actualSet.has(value));
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze(record);
}
