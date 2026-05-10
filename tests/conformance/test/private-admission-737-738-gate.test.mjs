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
  PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_737_738_GATE_STATUS,
  PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_737_738_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_737_738_REQUIRED_PRIOR_LEDGER_CONTEXT,
  PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_IDENTITY_GUARD,
  PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_TEXT_PREREQUISITE,
  PRIVATE_ADMISSION_737_738_REQUIRED_STATIC_LEDGER_EVIDENCE,
  PRIVATE_ADMISSION_737_738_ROWS,
  PRIVATE_ADMISSION_737_738_SKIPPED_ROWS,
  PRIVATE_ADMISSION_737_738_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_737_738_VIOLATION_STATUS,
  PRIVATE_ADMISSION_737_738_WORKERS,
  evaluatePrivateAdmission737738Gate
} from "../src/private-admission-737-738-gate.mjs";
import {
  PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
  PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS
} from "../src/private-admission-734-736-gate.mjs";

const worker737 = "worker-737-package-private-admission-audit-734-736";
const worker738 = "worker-738-real-sibling-text-handoff-report";
const expectedWorkers = [worker737, worker738];
const testRendererRustSourcePath = "crates/fast-react-test-renderer/src/lib.rs";

const required737SpecificSurfaces = [
  "test-renderer-sibling-text-host-output-prerequisite",
  "test-renderer-sibling-text-private-json-report-prerequisite",
  "test-renderer-sibling-text-finished-work-identity-admission",
  "react-dom-flush-sync",
  "scheduler-task"
];
const required737SpecificPublicClaims = [
  "publicTestRendererSiblingTextHostOutputCompatibilityClaimed",
  "publicTestRendererSiblingTextReportCompatibilityClaimed",
  "publicTestRendererSiblingTextFinishedWorkIdentityAdmissionClaimed",
  "publicReactRootCompatibilityClaimed",
  "publicReactActCompatibilityClaimed",
  "publicReactDomFlushSyncCompatibilityClaimed",
  "publicSchedulerTaskCompatibilityClaimed"
];
const required737SpecificAdmissionClaims = [
  "siblingTextHostOutputPublicPromotionClaimed",
  "siblingTextReportPublicPromotionClaimed",
  "siblingTextFinishedWorkIdentityAdmissionClaimed",
  "siblingTextGenericIdentityGateOpenedClaimed",
  "reactDomRootAdmissionClaimed",
  "reactDomActAdmissionClaimed",
  "flushSyncAdmissionClaimed",
  "schedulerAdmissionClaimed"
];

test("private admission 737-738 manifest records Worker 737 ledger evidence and Worker 738 private prerequisite evidence", () => {
  assert.deepEqual(PRIVATE_ADMISSION_737_738_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_737_738_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.deepEqual(PRIVATE_ADMISSION_737_738_SKIPPED_WORKERS, []);
  assert.deepEqual(PRIVATE_ADMISSION_737_738_SKIPPED_ROWS, []);
  assert.equal(PRIVATE_ADMISSION_737_738_ROWS.length, 2);

  assertSubset(
    PRIVATE_ADMISSION_734_736_BLOCKED_SURFACES,
    PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES
  );
  assertSubset(
    PRIVATE_ADMISSION_734_736_PUBLIC_COMPATIBILITY_CLAIMS,
    PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    PRIVATE_ADMISSION_734_736_BLOCKED_ADMISSION_CLAIMS,
    PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS
  );
  assertSubset(
    required737SpecificSurfaces,
    PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES
  );
  assertSubset(
    required737SpecificPublicClaims,
    PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS
  );
  assertSubset(
    required737SpecificAdmissionClaims,
    PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS
  );
});

test("private admission 737-738 gate recognizes accepted static and prerequisite evidence without compatibility", () => {
  const gate = evaluatePrivateAdmission737738Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_737_738_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.priorLedgerContextRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.staticLedgerEvidenceRecognized, true);
  assert.equal(gate.siblingTextPrerequisiteRecognized, true);
  assert.equal(gate.siblingIdentityGuardRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.skippedWorkers, []);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.recognizedSkippedWorkerIds, []);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.blockedAdmissionClaimViolationIds, []);
  assert.deepEqual(gate.nativeJsPackageLeakClaimIds, []);
  assert.deepEqual(gate.publicRendererLeakClaimIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);

  assertPrivateEvidenceRow(gate.rowsByWorker[worker737], {
    privateAdmission: "accepted-private-ledger-evidence",
    primaryCompatibilityArea:
      "private-admission-static-ledger-734-736-public-compatibility-blocked",
    runtimeCapabilityAdded: false,
    promotion: "not-applicable",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_ACCEPTED_DIAGNOSTICS[worker737],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCIES[worker737],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker737],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT[worker737],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker737
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_737_738_REQUIRED_PRIOR_LEDGER_CONTEXT[worker737],
    staticLedgerEvidence:
      PRIVATE_ADMISSION_737_738_REQUIRED_STATIC_LEDGER_EVIDENCE[worker737],
    siblingTextPrerequisite: {},
    siblingIdentityGuard: {},
    evidenceRoles: [
      "worker-737-static-ledger-progress",
      "worker-737-static-ledger-source",
      "worker-737-static-ledger-test"
    ]
  });

  const siblingTextRow = gate.rowsByWorker[worker738];
  assertPrivateEvidenceRow(siblingTextRow, {
    privateAdmission: "accepted-private-prerequisite-evidence",
    primaryCompatibilityArea:
      "test-renderer-tojson-sibling-text-real-host-output-report-prerequisite",
    runtimeCapabilityAdded: true,
    promotion: "rejected",
    acceptedDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_ACCEPTED_DIAGNOSTICS[worker738],
    dependencyWorkerIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCIES[worker738],
    dependencyDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_DEPENDENCY_DIAGNOSTICS[worker738],
    blockerContextWorkerIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT[worker738],
    blockerContextDiagnosticIds:
      PRIVATE_ADMISSION_737_738_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
        worker738
      ],
    priorLedgerContext:
      PRIVATE_ADMISSION_737_738_REQUIRED_PRIOR_LEDGER_CONTEXT[worker738],
    staticLedgerEvidence: {},
    siblingTextPrerequisite:
      PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_TEXT_PREREQUISITE[worker738],
    siblingIdentityGuard:
      PRIVATE_ADMISSION_737_738_REQUIRED_SIBLING_IDENTITY_GUARD[worker738],
    evidenceRoles: [
      "worker-738-real-sibling-text-progress",
      "worker-738-sibling-text-output-struct-rust-proof",
      "worker-738-reconciler-sibling-text-handoff-rust-proof",
      "worker-738-real-output-commit-rust-proof",
      "worker-738-sibling-text-report-rust-proof",
      "worker-738-sibling-text-report-tests-rust-proof",
      "worker-738-fail-closed-generic-identity-guard-rust-proof",
      "worker-738-fail-closed-generic-identity-test-rust-proof"
    ]
  });
  assert.equal(
    siblingTextRow.acceptedDiagnosticIds.includes(
      "siblingTextFinishedWorkIdentityAdmissionClaimed"
    ),
    false
  );
  assert.equal(
    siblingTextRow.siblingIdentityGuard.genericFinishedWorkIdentityGateFailsClosed,
    true
  );
  assert.equal(
    siblingTextRow.siblingIdentityGuard.noDedicatedSiblingIdentityGateClaimed,
    true
  );

  for (const evaluatedRow of gate.rows) {
    assertNoPublicOrAdmissionClaims(evaluatedRow);
    assert.equal(evaluatedRow.sourceTokenChecksOnly, true);
    assert.equal(evaluatedRow.manifestEvaluationOnly, true);
    assert.equal(evaluatedRow.runtimeExecutionClaimed, false);
    assert.equal(
      evaluatedRow.ledgerEvaluationMode,
      "source-token-checks-and-manifest-only"
    );
  }
});

test("private admission 737-738 gate rejects missing Worker 738 real output tokens", () => {
  const gate = evaluatePrivateAdmission737738Gate({
    rowOverrides: {
      [worker738]: {
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_737_738_ROWS[1],
          "worker-738-real-output-commit-rust-proof",
          "missing-worker-738-real-committed-output-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_737_738_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertEvidenceRoleRecognized(
    gate,
    worker738,
    "worker-738-real-output-commit-rust-proof",
    false
  );
  assertViolationIds(gate, ["private-admission-evidence-token-missing"]);
});

test("private admission 737-738 gate rejects missing Worker 738 report tokens", () => {
  const gate = evaluatePrivateAdmission737738Gate({
    rowOverrides: {
      [worker738]: {
        siblingTextPrerequisite: {
          realSiblingTextHostOutputRow: false,
          privateJsonReportRootArraySourceNodes: false,
          reportConsumesCurrentCommittedFibers: false
        },
        evidence: withMissingEvidenceToken(
          PRIVATE_ADMISSION_737_738_ROWS[1],
          "worker-738-sibling-text-report-rust-proof",
          "missing-worker-738-private-json-report-token"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_737_738_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.siblingTextPrerequisiteRecognized, false);
  assertEvidenceRoleRecognized(
    gate,
    worker738,
    "worker-738-sibling-text-report-rust-proof",
    false
  );
  assertViolationIds(gate, [
    "private-admission-evidence-token-missing",
    "sibling-text-prerequisite-evidence-mismatch"
  ]);
});

test("private admission 737-738 gate rejects missing Worker 738 fail-closed identity guard tokens", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: testRendererRustSourcePath,
    find: 'reason: "sibling-text-finished-work-identity-gate-not-implemented"',
    replace: 'reason: "sibling-text-finished-work-identity-opened"'
  });

  try {
    const gate = evaluatePrivateAdmission737738Gate({
      workspaceRoot: workspace.root,
      rowOverrides: {
        [worker738]: {
          siblingIdentityGuard: {
            genericFinishedWorkIdentityGateFailsClosed: false,
            failClosedReasonPinned: false
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_737_738_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.evidenceRecognized, false);
    assert.equal(gate.siblingIdentityGuardRecognized, false);
    assertEvidenceRoleRecognized(
      gate,
      worker738,
      "worker-738-fail-closed-generic-identity-guard-rust-proof",
      false
    );
    assertViolationIds(gate, [
      "private-admission-evidence-token-missing",
      "sibling-text-identity-guard-mismatch"
    ]);
  } finally {
    workspace.cleanup();
  }
});

test("private admission 737-738 gate rejects opening sibling finished-work identity admission", () => {
  const gate = evaluatePrivateAdmission737738Gate({
    rowOverrides: {
      [worker738]: {
        acceptedDiagnosticIds: [
          ...PRIVATE_ADMISSION_737_738_REQUIRED_ACCEPTED_DIAGNOSTICS[
            worker738
          ],
          "siblingTextFinishedWorkIdentityAdmissionClaimed"
        ],
        siblingIdentityGuard: {
          siblingSnapshotIdentityAdmissionBlocked: false,
          genericFinishedWorkIdentityGateFailsClosed: false,
          noDedicatedSiblingIdentityGateClaimed: false
        },
        blockedAdmissionClaims: {
          siblingTextFinishedWorkIdentityAdmissionClaimed: true,
          siblingTextGenericIdentityGateOpenedClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_737_738_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assert.equal(gate.siblingIdentityGuardRecognized, false);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "accepted-private-diagnostic-id-mismatch",
    "sibling-text-identity-guard-mismatch",
    "blocked-admission-claim-detected"
  ]);
});

test("private admission 737-738 gate rejects compatibility, public, native, JS, package, React DOM, act, flushSync, and Scheduler leaks", () => {
  const gate = evaluatePrivateAdmission737738Gate({
    rowOverrides: {
      [worker738]: {
        compatibilityClaimed: true,
        promotion: "accepted-public",
        publicCompatibilityClaims: {
          publicTestRendererSiblingTextHostOutputCompatibilityClaimed: true,
          publicTestRendererSiblingTextFinishedWorkIdentityAdmissionClaimed: true,
          publicReactDomRootCompatibilityClaimed: true,
          publicReactRootCompatibilityClaimed: true,
          publicReactActCompatibilityClaimed: true,
          publicReactDomFlushSyncCompatibilityClaimed: true,
          publicSchedulerTaskCompatibilityClaimed: true
        },
        blockedAdmissionClaims: {
          nativeExecutionAdmissionClaimed: true,
          jsFacadeAdmissionClaimed: true,
          cjsFacadeAdmissionClaimed: true,
          packageCompatibilityClaimed: true,
          nativeBridgeLoadingClaimed: true,
          nativeBridgeExecutionClaimed: true,
          rustOnlyDiagnosticPromotedToPackageClaimed: true,
          reactDomRootAdmissionClaimed: true,
          reactDomActAdmissionClaimed: true,
          flushSyncAdmissionClaimed: true,
          schedulerAdmissionClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_737_738_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assert.equal(gate.publicCompatibilityClaimed, true);
  assert.equal(gate.blockedAdmissionClaimsRecognized, false);
  assertViolationIds(gate, [
    "private-diagnostic-claimed-compatibility",
    "public-compatibility-claim-detected",
    "blocked-admission-claim-detected",
    "native-js-package-compatibility-leak-detected",
    "public-root-act-flushsync-reactdom-scheduler-leak-detected",
    "private-diagnostic-public-promotion-leak"
  ]);
  assertSubset(
    [
      `${worker738}.nativeExecutionAdmissionClaimed`,
      `${worker738}.jsFacadeAdmissionClaimed`,
      `${worker738}.cjsFacadeAdmissionClaimed`,
      `${worker738}.packageCompatibilityClaimed`,
      `${worker738}.nativeBridgeLoadingClaimed`,
      `${worker738}.nativeBridgeExecutionClaimed`,
      `${worker738}.rustOnlyDiagnosticPromotedToPackageClaimed`
    ],
    gate.nativeJsPackageLeakClaimIds
  );
  assertSubset(
    [
      `${worker738}.publicReactDomRootCompatibilityClaimed`,
      `${worker738}.publicReactActCompatibilityClaimed`,
      `${worker738}.publicReactDomFlushSyncCompatibilityClaimed`,
      `${worker738}.publicSchedulerTaskCompatibilityClaimed`,
      `${worker738}.reactDomRootAdmissionClaimed`,
      `${worker738}.reactDomActAdmissionClaimed`,
      `${worker738}.flushSyncAdmissionClaimed`,
      `${worker738}.schedulerAdmissionClaimed`
    ],
    gate.publicRendererLeakClaimIds
  );
});

test("private admission 737-738 gate rejects removing carried-forward 734-736 blockers", () => {
  const gate = evaluatePrivateAdmission737738Gate({
    rowOverrides: {
      [worker737]: {
        blockedPublicCompatibilitySurfaces:
          PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES.filter(
            (surface) =>
              surface !==
              "test-renderer-sibling-snapshot-finished-work-identity-admission"
          ),
        blockedPublicClaims:
          PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS.filter(
            (claimId) =>
              claimId !==
              "publicTestRendererSiblingSnapshotFinishedWorkIdentityAdmissionClaimed"
          ),
        blockedAdmissionClaimIds:
          PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS.filter(
            (claimId) =>
              claimId !== "siblingSnapshotFinishedWorkIdentityAdmissionClaimed"
          )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_737_738_VIOLATION_STATUS);
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

test("private admission 737-738 gate rejects runtime execution claims in the static ledger", () => {
  const gate = evaluatePrivateAdmission737738Gate({
    rowOverrides: {
      [worker737]: {
        sourceTokenChecksOnly: false,
        manifestEvaluationOnly: false,
        runtimeExecutionClaimed: true,
        ledgerEvaluationMode: "runtime-execution"
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_737_738_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assertViolationIds(gate, ["private-ledger-runtime-execution-claim"]);
});

function assertPrivateEvidenceRow(
  row,
  {
    privateAdmission,
    primaryCompatibilityArea,
    runtimeCapabilityAdded,
    promotion,
    acceptedDiagnosticIds,
    dependencyWorkerIds,
    dependencyDiagnosticIds,
    blockerContextWorkerIds,
    blockerContextDiagnosticIds,
    priorLedgerContext,
    staticLedgerEvidence,
    siblingTextPrerequisite,
    siblingIdentityGuard,
    evidenceRoles
  }
) {
  assert.equal(row.privateAdmission, privateAdmission);
  assert.equal(row.sourceQueue, "737-738");
  assert.equal(row.primaryCompatibilityArea, primaryCompatibilityArea);
  assert.equal(row.runtimeCapabilityAdded, runtimeCapabilityAdded);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, promotion);
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, [...acceptedDiagnosticIds]);
  assert.deepEqual(row.dependencyWorkerIds, [...dependencyWorkerIds]);
  assert.deepEqual(row.dependencyDiagnosticIds, [...dependencyDiagnosticIds]);
  assert.deepEqual(row.blockerContextWorkerIds, [...blockerContextWorkerIds]);
  assert.deepEqual(row.blockerContextDiagnosticIds, [
    ...blockerContextDiagnosticIds
  ]);
  assert.deepEqual(row.priorLedgerContext, [...priorLedgerContext]);
  assert.deepEqual(row.staticLedgerEvidence, staticLedgerEvidence);
  assert.deepEqual(row.siblingTextPrerequisite, siblingTextPrerequisite);
  assert.deepEqual(row.siblingIdentityGuard, siblingIdentityGuard);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    evidenceRoles
  );
}

function assertNoPublicOrAdmissionClaims(row) {
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_737_738_BLOCKED_SURFACES,
    row.workerId
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_737_738_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
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
    [...PRIVATE_ADMISSION_737_738_BLOCKED_ADMISSION_CLAIMS].sort(),
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

function createWorkspaceWithMutatedEvidenceFile({ evidencePath, find, replace }) {
  const root = mkdtempSync(join(tmpdir(), "private-admission-737-738-"));
  const workspaceRoot = findWorkspaceRoot();
  const evidencePaths = new Set(
    PRIVATE_ADMISSION_737_738_ROWS.flatMap((row) => row.evidence).map(
      (evidenceRow) => evidenceRow.path
    )
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
