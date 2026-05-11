import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_804_EVIDENCE_ROLES,
  PRIVATE_ADMISSION_804_GATE_STATUS,
  PRIVATE_ADMISSION_804_PUBLIC_BLOCKER_FIELDS,
  PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES,
  PRIVATE_ADMISSION_804_REQUIRED_EVIDENCE_CONTEXTS,
  PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS,
  PRIVATE_ADMISSION_804_ROWS,
  PRIVATE_ADMISSION_804_VIOLATION_STATUS,
  PRIVATE_ADMISSION_804_WORKERS,
  evaluatePrivateAdmission804Gate
} from "../src/private-admission-804-managed-child-placement-delete-ledger.mjs";

const worker785 =
  "worker-785-reconciler-managed-child-placement-delete-handoff";
const expectedWorkers = [worker785];

test("private admission 804 manifest pins Worker 785 managed child handoff", () => {
  assert.deepEqual(PRIVATE_ADMISSION_804_WORKERS, expectedWorkers);
  assert.deepEqual(
    PRIVATE_ADMISSION_804_ROWS.map((row) => row.workerId),
    expectedWorkers
  );
  assert.equal(PRIVATE_ADMISSION_804_ROWS.length, 1);
  assert.deepEqual(
    PRIVATE_ADMISSION_804_ROWS[0].requiredCapabilities,
    PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_804_ROWS[0].acceptedStatusIdentifiers,
    PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_804_ROWS[0].evidence.map((row) => row.role),
    PRIVATE_ADMISSION_804_EVIDENCE_ROLES
  );
  assert.deepEqual(
    Object.keys(PRIVATE_ADMISSION_804_REQUIRED_EVIDENCE_CONTEXTS[worker785]),
    PRIVATE_ADMISSION_804_EVIDENCE_ROLES
  );

  const evidenceByRole = Object.fromEntries(
    PRIVATE_ADMISSION_804_ROWS[0].evidence.map((row) => [row.role, row])
  );
  const completeWorkEvidence =
    evidenceByRole["complete-work-managed-child-metadata"];
  assert.equal(
    completeWorkEvidence.tokens.includes(
      "if let Some(sibling) = child_node.sibling() {"
    ),
    true
  );
  assertOrderedBefore(
    completeWorkEvidence.orderedTokens,
    "if let Some(sibling) = child_node.sibling() {",
    "let deletion_list = match kind {"
  );
  assertOrderedBefore(
    completeWorkEvidence.orderedTokens,
    "HostComponentManagedChildCompleteWorkErrorForCanary::UnexpectedChildSibling",
    "HostComponentManagedChildMutationKindForCanary::Placement => {"
  );

  assert.equal(
    evidenceByRole["root-commit-managed-child-request-record"].tokens.includes(
      "HostRootManagedChildCommitExecutionBlockerForCanary::PublicRootRendering"
    ),
    true
  );
  assert.equal(
    evidenceByRole["root-commit-managed-child-request-record"].tokens.includes(
      "public_root_rendering_blocked(&self) -> bool"
    ),
    true
  );
  assert.equal(
    evidenceByRole["host-work-managed-child-execution-diagnostic"].tokens.includes(
      "PublicRootRendering"
    ),
    true
  );
  assert.equal(
    evidenceByRole["host-work-managed-child-execution-diagnostic"].tokens.includes(
      "public_root_rendering_blocked(&self) -> bool"
    ),
    true
  );
  assert.equal(
    evidenceByRole[
      "host-work-managed-child-execution-diagnostic"
    ].sliceEnd.includes(
      "pub(crate) enum TestHostRootManagedChildExecutionErrorForCanary"
    ),
    true
  );
  assertOrderedBefore(
    evidenceByRole["host-work-managed-child-apply-handoff"].orderedTokens,
    "let cleanup_apply = apply_test_host_root_deletion_cleanup(",
    "blockers: TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS"
  );
  assert.equal(
    evidenceByRole["host-work-managed-child-apply-handoff"].sourceEvidenceType,
    "source-owned-rust-implementation-slice"
  );
  assert.equal(
    evidenceByRole["package-surface-private-export-guard"].sourceEvidenceType,
    "source-owned-js-package-guard-slice"
  );

  const packageNativeGuardTokens = [
    ...evidenceByRole["package-surface-private-export-guard"].tokens,
    ...evidenceByRole["import-smoke-private-export-guard"].tokens
  ];
  for (const token of packageNativeGuardTokens) {
    assert.equal(token.includes("${label}"), false, token);
    assert.equal(token.includes("native/index"), false, token);
  }
});

test("private admission 804 recognizes static managed child placement/delete evidence without public compatibility", () => {
  const gate = evaluatePrivateAdmission804Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_804_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.evidenceContextsRecognized, true);
  assert.equal(gate.capabilitiesRecognized, true);
  assert.equal(gate.statusIdentifiersRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.packageNativeCompatibilityRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, expectedWorkers);
  assert.deepEqual(gate.recognizedWorkerIds, expectedWorkers);
  assert.deepEqual(gate.publicBlockerClaimViolationIds, []);
  assert.deepEqual(gate.packageNativeClaimViolationIds, []);
  assert.deepEqual(gate.runtimeExecutionClaimViolationIds, []);

  const row = gate.rowsByWorker[worker785];
  assert.equal(
    row.privateAdmission,
    "accepted-private-managed-child-placement-delete-handoff"
  );
  assert.equal(row.sourceQueue, "804");
  assert.equal(row.privateEvidenceOnly, true);
  assert.equal(row.sourceTokenChecksOnly, true);
  assert.equal(row.manifestEvaluationOnly, true);
  assert.equal(row.runtimeExecutionClaimed, false);
  assert.equal(row.rustExecutionClaimed, false);
  assert.equal(row.packageCodeExecuted, false);
  assert.equal(row.nativeBridgeExecuted, false);
  assert.equal(row.packageSurfaceChanged, false);
  assert.equal(row.packageCompatibilityClaimed, false);
  assert.equal(row.nativeCompatibilityClaimed, false);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(
    row.ledgerEvaluationMode,
    "source-token-checks-and-manifest-only"
  );
  assert.deepEqual(
    Object.keys(row.publicBlockerClaims).sort(),
    [...PRIVATE_ADMISSION_804_PUBLIC_BLOCKER_FIELDS].sort()
  );
  assert.deepEqual(
    Object.values(row.publicBlockerClaims),
    Object.values(row.publicBlockerClaims).map(() => false)
  );

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.equal(
      evidenceRow.evidenceContextRecognized,
      true,
      evidenceRow.role
    );
    assert.equal(
      evidenceRow.evidenceTokenContractRecognized,
      true,
      evidenceRow.role
    );
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.orderedTokenViolations, [], evidenceRow.role);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.role);
  }
});

test("private admission 804 rejects missing complete-work and host-work source evidence", () => {
  const baseRow = rowByWorker(worker785);
  const gate = evaluatePrivateAdmission804Gate({
    rowOverrides: {
      [worker785]: {
        evidence: withMissingEvidenceTokens(baseRow, [
          {
            role: "complete-work-managed-child-metadata",
            token: "missing-sole-child-placement-guard-token"
          },
          {
            role: "host-work-managed-child-delete-cleanup",
            token: "missing-delete-cleanup-token"
          }
        ])
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, ["private-managed-child-evidence-mismatch"]);
  assertEvidenceRoleRecognized(
    gate,
    "complete-work-managed-child-metadata",
    false
  );
  assertEvidenceRoleRecognized(
    gate,
    "host-work-managed-child-delete-cleanup",
    false
  );
});

test("private admission 804 rejects stale host-work slice and cleanup ordering evidence", () => {
  const baseRow = rowByWorker(worker785);
  const gate = evaluatePrivateAdmission804Gate({
    rowOverrides: {
      [worker785]: {
        evidence: withPatchedEvidenceRows(baseRow, {
          "host-work-managed-child-execution-diagnostic": {
            sliceEnd:
              "#[derive(Debug, Clone, PartialEq, Eq)]\nenum TestHostRootManagedChildExecutionErrorForCanary"
          },
          "host-work-managed-child-apply-handoff": {
            orderedTokens: [
              "let apply = apply_test_host_root_commit_mutations(",
              "if apply.records().len() != 1",
              "let (cleanup_status, deletion_cleanup_apply_count) = match handoff.kind()",
              "apply_test_host_root_deletion_cleanup(",
              "TestHostRootDeletionCleanupAction::DetachDeletedInstance",
              "blockers: TEST_HOST_ROOT_MANAGED_CHILD_EXECUTION_BLOCKERS"
            ]
          }
        })
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assertViolationIds(gate, ["private-managed-child-evidence-mismatch"]);
  assertEvidenceRoleRecognized(
    gate,
    "host-work-managed-child-execution-diagnostic",
    false
  );
  assertEvidenceRoleRecognized(
    gate,
    "host-work-managed-child-apply-handoff",
    false
  );

  const diagnosticEvidence = evidenceRowByRole(
    gate,
    "host-work-managed-child-execution-diagnostic"
  );
  assert.equal(
    diagnosticEvidence.sliceError,
    "sliceEnd not found in crates/fast-react-reconciler/src/host_work.rs"
  );
  const applyEvidence = evidenceRowByRole(
    gate,
    "host-work-managed-child-apply-handoff"
  );
  assert.equal(applyEvidence.evidenceTokenContractRecognized, false);
  assert.deepEqual(applyEvidence.orderedTokenViolations, []);
  assertViolationIds(gate, ["private-managed-child-evidence-context-mismatch"]);
});

test("private admission 804 rejects caller-shaped and prose-only evidence contexts", () => {
  const baseRow = rowByWorker(worker785);
  const targetRole = "host-work-managed-child-apply-handoff";
  const cases = [
    {
      name: "caller-shaped-role-spoof",
      patch: {
        role: "caller-shaped-role-spoof"
      }
    },
    {
      name: "test-title-only",
      patch: {
        path: "tests/conformance/test/private-admission-804-managed-child-placement-delete-ledger.test.mjs",
        sliceStart:
          'test("private admission 804 manifest pins Worker 785 managed child handoff", () => {',
        sliceEnd:
          'test("private admission 804 recognizes static managed child placement/delete evidence without public compatibility", () => {',
        tokens: [
          "private admission 804 manifest pins Worker 785 managed child handoff",
          "PublicRootRendering"
        ],
        orderedTokens: [],
        forbiddenTokens: []
      }
    },
    {
      name: "progress-prose-only",
      patch: {
        path: "worker-progress/worker-804-private-admission-785-managed-child-ledger.md",
        sliceStart: null,
        sliceEnd: null,
        tokens: ["host_work.rs", "DetachDeletedInstance"],
        orderedTokens: [],
        forbiddenTokens: []
      }
    },
    {
      name: "public-compatibility-prose-only",
      patch: {
        path: "MASTER_PROGRESS.md",
        sliceStart: null,
        sliceEnd: null,
        tokens: ["Public React DOM roots", "react-test-renderer", "native bridge"],
        orderedTokens: [],
        forbiddenTokens: []
      }
    },
    {
      name: "source-syntax-only",
      patch: {
        sliceStart: "const fn managed_child_apply_status_matches_kind(",
        sliceEnd:
          "const fn managed_child_sibling_order_apply_status_matches_kind(",
        sourceEvidenceType: "source-syntax-only",
        tokens: [
          "matches!",
          "HostComponentManagedChildMutationKindForCanary::Placement"
        ],
        orderedTokens: [],
        forbiddenTokens: []
      }
    }
  ];

  for (const { name, patch } of cases) {
    const gate = evaluatePrivateAdmission804Gate({
      rowOverrides: {
        [worker785]: {
          evidence: withPatchedEvidenceRows(baseRow, {
            [targetRole]: patch
          })
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS, name);
    assert.equal(gate.privateDiagnosticsRecognized, false, name);
    assert.equal(gate.evidenceRecognized, false, name);
    assert.equal(gate.evidenceContextsRecognized, false, name);
    assertViolationIds(gate, [
      "private-managed-child-evidence-mismatch",
      "private-managed-child-evidence-context-mismatch"
    ]);

    const mismatch = evidenceContextMismatch(gate);
    assert.equal(mismatch.workerId, worker785, name);
    assert.deepEqual(
      mismatch.expectedEvidenceRoles,
      PRIVATE_ADMISSION_804_EVIDENCE_ROLES,
      name
    );
    assert.equal(
      mismatch.actualEvidenceRoles.includes(patch.role ?? targetRole),
      true,
      name
    );
  }
});

test("private admission 804 rejects canonical-context token replacement", () => {
  const baseRow = rowByWorker(worker785);
  const cases = [
    {
      name: "canonical-context-single-present-source-token",
      role: "host-work-managed-child-apply-handoff",
      patch: {
        tokens: ["apply_test_host_root_commit_mutations("],
        orderedTokens: [],
        forbiddenTokens: ["not-present-in-host-work-managed-child-source"]
      }
    },
    {
      name: "canonical-context-public-compatibility-token-only",
      role: "host-work-managed-child-execution-diagnostic",
      patch: {
        tokens: ["public_root_rendering_blocked(&self) -> bool"],
        orderedTokens: [],
        forbiddenTokens: []
      }
    },
    {
      name: "canonical-context-package-guard-single-public-token",
      role: "package-surface-private-export-guard",
      patch: {
        tokens: ["function assertNoPrivateDiagnosticRuntimeExports("],
        orderedTokens: [],
        forbiddenTokens: []
      }
    }
  ];

  for (const { name, role, patch } of cases) {
    const gate = evaluatePrivateAdmission804Gate({
      rowOverrides: {
        [worker785]: {
          evidence: withPatchedEvidenceRows(baseRow, {
            [role]: patch
          })
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS, name);
    assert.equal(gate.privateDiagnosticsRecognized, false, name);
    assert.equal(gate.evidenceRecognized, false, name);
    assert.equal(gate.evidenceContextsRecognized, false, name);
    assertViolationIds(gate, [
      "private-managed-child-evidence-mismatch",
      "private-managed-child-evidence-context-mismatch"
    ]);

    const evidenceRow = evidenceRowByRole(gate, role);
    assert.equal(evidenceRow.evidenceContextRecognized, false, name);
    assert.equal(evidenceRow.evidenceTokenContractRecognized, false, name);
    assert.deepEqual(evidenceRow.missingTokens, [], name);
    assert.deepEqual(evidenceRow.orderedTokenViolations, [], name);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], name);

    const mismatch = evidenceContextMismatch(gate);
    assert.equal(mismatch.workerId, worker785, name);
    assert.deepEqual(
      mismatch.expectedEvidenceRoles,
      PRIVATE_ADMISSION_804_EVIDENCE_ROLES,
      name
    );
    assert.deepEqual(evidenceRow.tokens, patch.tokens, name);
  }
});

test("private admission 804 rejects root-commit order drift and status/capability drift", () => {
  const baseRow = rowByWorker(worker785);
  const gate = evaluatePrivateAdmission804Gate({
    rowOverrides: {
      [worker785]: {
        requiredCapabilities: PRIVATE_ADMISSION_804_REQUIRED_CAPABILITIES.filter(
          (capability) =>
            capability !== "root-commit-validation-before-current-switch"
        ),
        acceptedStatusIdentifiers:
          PRIVATE_ADMISSION_804_REQUIRED_STATUS_IDENTIFIERS.filter(
            (identifier) =>
              identifier !==
              "HostRootManagedChildCommitExecutionStatusForCanary::ValidatedForTestHostMutation"
          ),
        evidence: withOrderedEvidenceTokens(
          baseRow,
          "root-commit-validation-before-current-switch",
          [
            "let finished_work_handoff = commit_finished_host_root_with_finished_work_handoff_for_canary(",
            "let execution_request = validate_managed_child_commit_metadata_for_canary("
          ]
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.evidenceContextsRecognized, false);
  assert.equal(gate.capabilitiesRecognized, false);
  assert.equal(gate.statusIdentifiersRecognized, false);
  assertViolationIds(gate, [
    "private-managed-child-evidence-mismatch",
    "private-managed-child-evidence-context-mismatch",
    "private-managed-child-capability-mismatch",
    "private-managed-child-status-identifier-mismatch"
  ]);
  assertEvidenceRoleRecognized(
    gate,
    "root-commit-validation-before-current-switch",
    false
  );
  const evidenceRow = gate.rowsByWorker[worker785].evidence.find(
    (row) => row.role === "root-commit-validation-before-current-switch"
  );
  assert.equal(evidenceRow.evidenceTokenContractRecognized, false);
  assert.deepEqual(evidenceRow.orderedTokenViolations, []);
});

test("private admission 804 rejects public, package/native, and runtime execution claims", () => {
  const gate = evaluatePrivateAdmission804Gate({
    rowOverrides: {
      [worker785]: {
        sourceTokenChecksOnly: false,
        runtimeExecutionClaimed: true,
        rustExecutionClaimed: true,
        packageCodeExecuted: true,
        nativeBridgeExecuted: true,
        packageSurfaceChanged: true,
        packageCompatibilityClaimed: true,
        nativeCompatibilityClaimed: true,
        compatibilityClaimed: true,
        ledgerEvaluationMode: "runtime-execution",
        publicBlockerClaims: {
          publicRendererHostMutationAvailable: true,
          reactDomManagedChildCompatibilityClaimed: true,
          reactTestRendererCompatibilityClaimed: true,
          hydrationEventsRefsResourcesFormsClaimed: true,
          packageSurfaceCompatibilityClaimed: true,
          nativeBridgeCompatibilityClaimed: true,
          publicCompatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_804_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.packageNativeCompatibilityRecognized, false);
  assert.equal(gate.staticReadOnlyRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "private-managed-child-public-blocker-claim-detected",
    "private-managed-child-package-native-compatibility-claim-detected",
    "private-managed-child-runtime-execution-claim",
    "private-managed-child-static-ledger-mode-mismatch",
    "private-managed-child-compatibility-claim-detected"
  ]);
  assertSubset(
    [
      `${worker785}.publicRendererHostMutationAvailable`,
      `${worker785}.reactDomManagedChildCompatibilityClaimed`,
      `${worker785}.reactTestRendererCompatibilityClaimed`,
      `${worker785}.hydrationEventsRefsResourcesFormsClaimed`
    ],
    gate.publicBlockerClaimViolationIds
  );
  assertSubset(
    [
      `${worker785}.packageSurfaceChanged`,
      `${worker785}.packageCompatibilityClaimed`,
      `${worker785}.nativeCompatibilityClaimed`,
      `${worker785}.nativeBridgeExecuted`,
      `${worker785}.packageCodeExecuted`,
      `${worker785}.packageSurfaceCompatibilityClaimed`,
      `${worker785}.nativeBridgeCompatibilityClaimed`
    ],
    gate.packageNativeClaimViolationIds
  );
  assertSubset(
    [`${worker785}.runtimeExecutionClaimed`, `${worker785}.rustExecutionClaimed`],
    gate.runtimeExecutionClaimViolationIds
  );
});

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

function evidenceContextMismatch(gate) {
  const violation = gate.violations.find(
    (candidate) =>
      candidate.id === "private-managed-child-evidence-context-mismatch"
  );
  assert.notEqual(violation, undefined);
  assert.equal(violation.rows.length, 1);
  return violation.rows[0];
}

function assertOrderedBefore(tokens, earlier, later) {
  assert.equal(tokens.includes(earlier), true, earlier);
  assert.equal(tokens.includes(later), true, later);
  assert.equal(tokens.indexOf(earlier) < tokens.indexOf(later), true);
}

function assertEvidenceRoleRecognized(gate, role, expectedRecognized) {
  const evidenceRow = evidenceRowByRole(gate, role);
  assert.equal(evidenceRow.recognized, expectedRecognized, role);
}

function evidenceRowByRole(gate, role) {
  const evidenceRow = gate.rowsByWorker[worker785].evidence.find(
    (row) => row.role === role
  );
  assert.notEqual(evidenceRow, undefined, role);
  return evidenceRow;
}

function rowByWorker(workerId) {
  const row = PRIVATE_ADMISSION_804_ROWS.find(
    (candidate) => candidate.workerId === workerId
  );
  assert.notEqual(row, undefined, workerId);
  return row;
}

function withMissingEvidenceTokens(row, missingTokens) {
  return row.evidence.map((evidenceRow) => {
    const additions = missingTokens
      .filter((missingToken) => missingToken.role === evidenceRow.role)
      .map((missingToken) => missingToken.token);
    if (additions.length === 0) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      tokens: [...evidenceRow.tokens, ...additions]
    };
  });
}

function withOrderedEvidenceTokens(row, role, orderedTokens) {
  return row.evidence.map((evidenceRow) => {
    if (evidenceRow.role !== role) {
      return evidenceRow;
    }
    return {
      ...evidenceRow,
      orderedTokens
    };
  });
}

function withPatchedEvidenceRows(row, patchesByRole) {
  return row.evidence.map((evidenceRow) => ({
    ...evidenceRow,
    ...(patchesByRole[evidenceRow.role] ?? {})
  }));
}
