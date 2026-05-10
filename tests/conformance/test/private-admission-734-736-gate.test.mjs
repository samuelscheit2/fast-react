import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import {
  PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_734_736_GATE_STATUS,
  PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_734_736_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_734_736_REQUIRED_NESTED_SOURCE_REPORT_EVIDENCE,
  PRIVATE_ADMISSION_734_736_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_734_736_REQUIRED_SIBLING_SNAPSHOT_BLOCKER,
  PRIVATE_ADMISSION_734_736_ROWS,
  PRIVATE_ADMISSION_734_736_SKIPPED_ROWS,
  PRIVATE_ADMISSION_734_736_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_734_736_VIOLATION_STATUS,
  PRIVATE_ADMISSION_734_736_WORKERS,
  evaluatePrivateAdmission734736Gate
} from "../src/private-admission-734-736-gate.mjs";
import {
  PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS
} from "../src/private-admission-732-733-gate.mjs";

const worker734 = "worker-734-package-private-admission-audit-732-733";
const worker735 = "worker-735-sibling-snapshot-identity-blocker";
const worker736 = "worker-736-nested-tojson-source-report-identity";
const expectedWorkers = [worker735, worker736];
const expectedSkippedWorkers = [worker734];
const testRendererRustSourcePath = "crates/fast-react-test-renderer/src/lib.rs";

const required735SpecificSurfaces = [
  "test-renderer-sibling-snapshot-finished-work-identity-blocker",
  "test-renderer-sibling-snapshot-finished-work-identity-admission"
];
const required736SpecificSurfaces = [
  "test-renderer-public-nested-tojson-source-report-identity"
];
const required734SpecificPublicClaims = [
  "publicTestRendererSiblingSnapshotFinishedWorkIdentityAdmissionClaimed",
  "publicTestRendererNestedToJSONSourceReportIdentityClaimed"
];
const required734SpecificAdmissionClaims = [
  "siblingSnapshotFinishedWorkIdentityAdmissionClaimed",
  "nestedToJSONSourceReportPublicPromotionClaimed",
  "rustOnlyDiagnosticPromotedToPackageClaimed"
];

test("private admission 734-736 manifest records Worker 734 as prior ledger context and Workers 735-736 as accepted private evidence", () => {
  assert.deepEqual(PRIVATE_ADMISSION_734_736_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_734_736_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_734_736_SKIPPED_WORKERS,
    expectedSkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_734_736_SKIPPED_ROWS.map((row) => row.workerId),
    expectedSkippedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_734_736_ROWS.length, 2);
  assert.equal(PRIVATE_ADMISSION_734_736_SKIPPED_ROWS.length, 1);
  assert.equal(PRIVATE_ADMISSION_734_736_WORKERS.includes(worker734), false);

  assertSubset(
    PRIVATE_ADMISSION_732_733_BLOCKED_SURFACES,
    PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES
  );
  assertSubset(
    PRIVATE_ADMISSION_732_733_PUBLIC_COMPATIBILITY_CLAIMS,
    PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    PRIVATE_ADMISSION_732_733_BLOCKED_ADMISSION_CLAIMS,
    PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS
  );
  assertSubset(
    required735SpecificSurfaces,
    PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES
  );
  assertSubset(
    required736SpecificSurfaces,
    PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES
  );
  assertSubset(
    required734SpecificPublicClaims,
    PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    required734SpecificAdmissionClaims,
    PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS
  );
});

test("private admission 734-736 gate recognizes accepted private evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission734736Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_734_736_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.siblingSnapshotBlockerRecognized, true);
  assert.equal(gate.nestedSourceReportEvidenceRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.skippedWorkers, expectedSkippedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.recognizedSkippedWorkerIds, expectedSkippedWorkers);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(gate.nativeJsPackageLeakClaimIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(gate.manifest.missingSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateSkippedWorkerIds, []);

  const blockerRow = gate.rowsByWorker[worker735];
  assertPrivateDiagnosticRow(blockerRow, {
    primaryCompatibilityArea:
      "test-renderer-tojson-sibling-snapshot-finished-work-identity-blocker",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_ACCEPTED_DIAGNOSTICS[worker735],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCIES[worker735],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker735],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT[worker735],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker735
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_734_736_REQUIRED_PRIOR_LEDGER_CONTEXT[worker735],
    siblingSnapshotBlocker:
      PRIVATE_ADMISSION_734_736_REQUIRED_SIBLING_SNAPSHOT_BLOCKER[worker735],
    nestedSourceReportEvidence: {},
    evidenceRoles: [
      "worker-735-sibling-snapshot-blocker-report",
      "worker-735-sibling-snapshot-blocker-constants-rust-proof",
      "worker-735-sibling-snapshot-blocker-struct-rust-proof",
      "worker-735-sibling-snapshot-preflight-rust-proof",
      "worker-735-sibling-snapshot-validator-rust-proof",
      "worker-735-sibling-snapshot-success-rust-proof",
      "worker-735-sibling-snapshot-tamper-rust-proof"
    ]
  });
  assert.equal(
    blockerRow.acceptedDiagnosticIds.includes(
      "test-renderer-tojson-sibling-snapshot-finished-work-identity-admission"
    ),
    false
  );
  assert.equal(
    blockerRow.siblingSnapshotBlocker.identityAdmissionBlocked,
    true
  );
  assert.equal(
    blockerRow.siblingSnapshotBlocker.publicNativePackageBlocked,
    true
  );

  const nestedRow = gate.rowsByWorker[worker736];
  assertPrivateDiagnosticRow(nestedRow, {
    primaryCompatibilityArea:
      "test-renderer-tojson-nested-source-report-finished-work-identity",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_ACCEPTED_DIAGNOSTICS[worker736],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCIES[worker736],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker736],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT[worker736],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_734_736_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker736
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_734_736_REQUIRED_PRIOR_LEDGER_CONTEXT[worker736],
    siblingSnapshotBlocker: {},
    nestedSourceReportEvidence:
      PRIVATE_ADMISSION_734_736_REQUIRED_NESTED_SOURCE_REPORT_EVIDENCE[
        worker736
      ],
    evidenceRoles: [
      "worker-736-nested-source-report-progress",
      "worker-736-reconciler-nested-inspection-rust-proof",
      "worker-736-reconciler-nested-inspection-test-rust-proof",
      "worker-736-nested-output-owns-inspection-rust-proof",
      "worker-736-nested-json-report-rust-proof",
      "worker-736-nested-json-current-fibers-rust-proof",
      "worker-736-nested-json-source-nodes-rust-proof",
      "worker-736-nested-identity-source-report-rust-proof",
      "worker-736-finished-work-identity-committed-inspection-rust-proof",
      "worker-736-nested-source-report-test-rust-proof",
      "worker-736-helper-removed-rust-proof"
    ]
  });
  assert.equal(nestedRow.nestedSourceReportEvidence.helperRemoved, true);
  assert.equal(
    nestedRow.nestedSourceReportEvidence.siblingSnapshotRemainsBlocked,
    true
  );

  for (const evaluatedRow of [...gate.rows, ...gate.skippedRows]) {
    assertNoPublicOrAdmissionClaims(evaluatedRow);
  }
});

test("private admission 734-736 gate recognizes Worker 734 as non-runtime prior ledger context", () => {
  const gate = evaluatePrivateAdmission734736Gate();
  const row = gate.skippedRowsByWorker[worker734];

  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "734-736");
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "not-applicable");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, []);
  assert.equal(row.skipReason, "prior-ledger-context-no-new-runtime-capability");
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    [
      "worker-734-prior-ledger-report",
      "worker-734-prior-ledger-source",
      "worker-734-prior-ledger-test"
    ]
  );
  assertNoPublicOrAdmissionClaims(row);
});

test("private admission 734-736 gate rejects missing Worker 735 evidence tokens", () => {
  const gate = evaluatePrivateAdmission734736Gate({
    rowOverrides: {
      [worker735]: {
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_734_736_ROWS[0],
          "worker-735-sibling-snapshot-preflight-rust-proof",
          "missing-worker-735-sibling-snapshot-blocker-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_734_736_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertEvidenceRoleRecognized(
    gate,
    worker735,
    "worker-735-sibling-snapshot-preflight-rust-proof",
    false
  );
  assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
});

test("private admission 734-736 gate rejects missing Worker 736 evidence tokens", () => {
  const gate = evaluatePrivateAdmission734736Gate({
    rowOverrides: {
      [worker736]: {
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_734_736_ROWS[1],
          "worker-736-nested-json-report-rust-proof",
          "missing-worker-736-nested-source-report-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_734_736_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertEvidenceRoleRecognized(
    gate,
    worker736,
    "worker-736-nested-json-report-rust-proof",
    false
  );
  assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
});

test("private admission 734-736 gate rejects missing Worker 735 blocker and tamper evidence", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: testRendererRustSourcePath,
    find: "blocker.real_sibling_text_handoff_available = true;",
    replace: "blocker.real_sibling_text_handoff_available = false;"
  });

  try {
    const gate = evaluatePrivateAdmission734736Gate({
      workspaceRoot: workspace.root,
      rowOverrides: {
        [worker735]: {
          siblingSnapshotBlocker: {
            missingRealSiblingTextHandoff: false,
            tamperFailsClosed: false
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_734_736_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assert.equal(gate.siblingSnapshotBlockerRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      worker735,
      "worker-735-sibling-snapshot-tamper-rust-proof",
      false
    );
    assertViolationIds(gate, [
      "private-admission-evidence-token-missing",
      "sibling-snapshot-blocker-evidence-mismatch"
    ]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 734-736 gate rejects missing Worker 736 committed inspection and source-report evidence", () => {
  const gate = evaluatePrivateAdmission734736Gate({
    rowOverrides: {
      [worker736]: {
        nestedSourceReportEvidence: {
          committedNestedFiberInspectionBacked: false,
          sourceReportBackedIdentity: false,
          sourceReportNodeShapeBound: false,
          helperRemoved: false
        },
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_734_736_ROWS[1],
          "worker-736-reconciler-nested-inspection-rust-proof",
          "missing-worker-736-committed-nested-inspection-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_734_736_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.nestedSourceReportEvidenceRecognized, false);
  assertEvidenceRoleRecognized(
    gate,
    worker736,
    "worker-736-reconciler-nested-inspection-rust-proof",
    false
  );
  assertViolationIds(gate, [
    "private-admission-evidence-token-missing",
    "nested-source-report-evidence-mismatch"
  ]);
});

test("private admission 734-736 gate rejects stale Worker 736 id and stale evidence path", () => {
  const gate = evaluatePrivateAdmission734736Gate({
    rowOverrides: {
      [worker736]: {
        workerId: "worker-736-stale-nested-source-report-identity",
        evidence: withStaleEvidencePath(
          PRIVATE_ADMISSION_734_736_ROWS[1],
          "worker-736-nested-source-report-progress",
          "worker-progress/worker-736-stale-nested-source-report.md"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_734_736_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.manifest.missingWorkerIds, [worker736]);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, [
    "worker-736-stale-nested-source-report-identity"
  ]);
  assertViolationIds(gate, [
    "accepted-private-worker-manifest-mismatch",
    "private-admission-evidence-token-missing"
  ]);
});

test("private admission 734-736 gate rejects missing prior Worker 734 ledger context", () => {
  const gate = evaluatePrivateAdmission734736Gate({
    rowOverrides: {
      [worker735]: {
        priorLedgerContext: [
          worker734,
          "private-admission-732-733-local-gate-1",
          "worker-733-test-renderer-unmount-finished-work-identity"
        ]
      }
    },
    skippedRowOverrides: {
      [worker734]: {
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_734_736_SKIPPED_ROWS[0],
          "worker-734-prior-ledger-source",
          "missing-worker-734-prior-ledger-context-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_734_736_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.priorLedgerContextRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, [
    "private-admission-evidence-token-missing",
    "prior-private-admission-ledger-context-mismatch"
  ]);
});

test("private admission 734-736 gate rejects compatibility, public, native, JS, and package leaks", () => {
  const gate = evaluatePrivateAdmission734736Gate({
    rowOverrides: {
      [worker736]: {
        compatibilityClaimed: true,
        promotion: "accepted-public",
        publicCompatibilityClaims: {
          publicTestRendererNestedToJSONSourceReportIdentityClaimed: true
        },
        blockedAdmissionClaims: {
          nativeExecutionAdmissionClaimed: true,
          jsFacadeAdmissionClaimed: true,
          cjsFacadeAdmissionClaimed: true,
          packageCompatibilityClaimed: true,
          nativeBridgeLoadingClaimed: true,
          nativeBridgeExecutionClaimed: true,
          rustOnlyDiagnosticPromotedToPackageClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_734_736_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "private-diagnostic-claimed-compatibility",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected",
    "native-js-package-compatibility-leak-detected",
    "private-diagnostic-public-promotion-leak"
  ]);
  assertSubset(
    [
      `${worker736}.nativeExecutionAdmissionClaimed`,
      `${worker736}.jsFacadeAdmissionClaimed`,
      `${worker736}.cjsFacadeAdmissionClaimed`,
      `${worker736}.packageCompatibilityClaimed`,
      `${worker736}.nativeBridgeLoadingClaimed`,
      `${worker736}.nativeBridgeExecutionClaimed`,
      `${worker736}.rustOnlyDiagnosticPromotedToPackageClaimed`
    ],
    gate.nativeJsPackageLeakClaimIds
  );
});

test("private admission 734-736 gate rejects removing carried-forward 732-733 blockers", () => {
  const gate = evaluatePrivateAdmission734736Gate({
    rowOverrides: {
      [worker735]: {
        blockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES.filter(
            (surface) =>
              surface !== "test-renderer-full-unmount-identity-admission"
          ),
        blockedPublicClaims:
          PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS.filter(
            (claimId) =>
              claimId !==
              "publicTestRendererUpdateNativeSerializationCompatibilityClaimed"
          ),
        blockedAdmissionClaimIds:
          PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS.filter(
            (claimId) => claimId !== "siblingSnapshotAdmissionClaimed"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_734_736_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "blocked-public-compatibility-surface-mismatch",
    "blocked-public-claim-mismatch",
    "blocked-admission-claim-mismatch"
  ]);
});

function assertPrivateDiagnosticRow(
  row,
  {
    primaryCompatibilityArea,
    acceptedDiagnosticIds,
    dependencyWorkerIds,
    dependencyDiagnosticIds,
    blockerContextWorkerIds,
    blockerContextDiagnosticIds,
    priorLedgerContext,
    siblingSnapshotBlocker,
    nestedSourceReportEvidence,
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, "accepted-private-diagnostic");
  assert.equal(row.sourceQueue, "734-736");
  assert.equal(row.primaryCompatibilityArea, primaryCompatibilityArea);
  assert.equal(row.runtimeCapabilityAdded, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "rejected");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, [...acceptedDiagnosticIds]);
  assert.deepEqual(row.dependencyWorkerIds, [...dependencyWorkerIds]);
  assert.deepEqual(row.dependencyDiagnosticIds, [...dependencyDiagnosticIds]);
  assert.deepEqual(row.blockerContextWorkerIds, [...blockerContextWorkerIds]);
  assert.deepEqual(row.blockerContextDiagnosticIds, [
    ...blockerContextDiagnosticIds
  ]);
  assert.deepEqual(row.priorLedgerContext, [...priorLedgerContext]);
  assert.deepEqual(row.siblingSnapshotBlocker, siblingSnapshotBlocker);
  assert.deepEqual(row.nestedSourceReportEvidence, nestedSourceReportEvidence);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertNoPublicOrAdmissionClaims(row) {
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.publicCompatibilityClaims),
    Object.values(row.publicCompatibilityClaims).map(() => false),
    row.workerId
  );
  assert.deepEqual(
    row.blockedPublicClaims,
    Object.keys(row.publicCompatibilityClaims),
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.blockedAdmissionClaims).sort(),
    [...PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS].sort(),
    row.workerId
  );
  assert.deepEqual(
    Object.values(row.blockedAdmissionClaims),
    Object.values(row.blockedAdmissionClaims).map(() => false),
    row.workerId
  );
  assert.deepEqual(row.publicCompatibilityViolations, [], row.workerId);
  assert.deepEqual(row.blockedAdmissionClaimViolations, [], row.workerId);

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.path);
  }
}

function assertSubset(expectedSubset, actualSuperset) {
  for (const value of expectedSubset) {
    assert.equal(actualSuperset.includes(value), true, value);
  }
}

function assertViolationIds(gate, expectedIds) {
  const actualIds = gate.violations.map((violation) => violation.id);
  for (const expectedId of expectedIds) {
    assert.equal(actualIds.includes(expectedId), true, expectedId);
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

function withStaleEvidencePath(row, role, path) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      path
    };
  });
}

function createWorkspaceWithMutatedEvidenceFile({ evidencePath, find, replace }) {
  const root = mkdtempSync(join(tmpdir(), "private-admission-734-736-"));
  const workspaceRoot = findWorkspaceRoot();
  const evidencePaths = new Set(
    [
      ...PRIVATE_ADMISSION_734_736_ROWS,
      ...PRIVATE_ADMISSION_734_736_SKIPPED_ROWS
    ]
      .flatMap((row) => row.evidence)
      .map((evidenceRow) => evidenceRow.path)
  );

  for (const path of evidencePaths) {
    const sourcePath = join(workspaceRoot, path);
    const targetPath = join(root, path);
    mkdirSync(dirname(targetPath), { recursive: true });
    let text = readFileSync(sourcePath, "utf8");
    if (path === evidencePath) {
      text = replaceFirst(text, find, replace);
    }
    writeFileSync(targetPath, text);
  }

  return {
    root,
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    }
  };
}

function findWorkspaceRoot() {
  let current = process.cwd();
  while (true) {
    if (existsSync(join(current, "WORKER_BRIEF.md"))) {
      return current;
    }

    const parent = dirname(current);
    assert.notEqual(parent, current, "workspace root not found");
    current = parent;
  }
}

function replaceFirst(text, find, replace) {
  assert.equal(text.includes(find), true, find);
  return text.replace(find, replace);
}
