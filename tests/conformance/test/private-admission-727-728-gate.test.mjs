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
  PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
  PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_DIAGNOSTICS,
  PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_EVIDENCE,
  PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_WORKERS,
  PRIVATE_ADMISSION_727_728_GATE_STATUS,
  PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS,
  PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS,
  PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT,
  PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS,
  PRIVATE_ADMISSION_727_728_REQUIRED_CURRENT_UNMOUNT_IDENTITY_EVIDENCE_ROLES,
  PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES,
  PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS,
  PRIVATE_ADMISSION_727_728_REQUIRED_EVIDENCE_ROLES,
  PRIVATE_ADMISSION_727_728_ROWS,
  PRIVATE_ADMISSION_727_728_SKIPPED_ROWS,
  PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
  PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
  PRIVATE_ADMISSION_727_728_WORKERS,
  evaluatePrivateAdmission727728Gate
} from "../src/private-admission-727-728-gate.mjs";

const expected727728Workers = [
  "worker-728-test-renderer-unmount-native-identity-argument-guard"
];

const expected727728SkippedWorkers = [
  "worker-727-package-private-admission-audit-724-726"
];
const worker728 =
  "worker-728-test-renderer-unmount-native-identity-argument-guard";
const skippedWorker727 = "worker-727-package-private-admission-audit-724-726";

const expectedAcceptedDiagnosticIds = [
  "test-renderer-unmount-native-identity-argument-guard",
  "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
];

const expectedDependencyWorkerIds = [
  "worker-612-test-renderer-unmount-native-bridge-admission",
  "worker-638-test-renderer-unmount-native-execution",
  "worker-639-test-renderer-tojson-after-native-execution",
  "worker-667-test-renderer-totree-native-execution"
];

const expectedDependencyDiagnosticIds = [
  "react-test-renderer-unmount-native-bridge-admission-private-diagnostic",
  "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic",
  "test-renderer-tojson-native-execution-evidence",
  "test-renderer-totree-native-execution"
];

const expectedBlockerContextWorkerIds = [
  "worker-725-test-renderer-update-serialization-finished-work-identity",
  "worker-726-test-renderer-update-native-serialization-identity-admission"
];

const expectedBlockerContextDiagnosticIds = [
  "test-renderer-update-serialization-finished-work-identity",
  "test-renderer-update-native-serialization-identity-admission"
];

const expectedEvidenceRoles = [
  "worker-612-unmount-route-admission-dependency",
  "worker-638-unmount-cleanup-handoff-dependency",
  "worker-639-tojson-unmount-empty-host-output-dependency",
  "worker-667-totree-unmount-native-output-dependency",
  "worker-725-update-identity-blocker-context",
  "worker-726-update-native-identity-blocker-context",
  "worker-728-unmount-identity-argument-guard-report"
];

const expectedCurrentUnmountIdentityWorkers = [
  "worker-730-test-renderer-unmount-native-cleanup-evidence",
  "worker-733-test-renderer-unmount-finished-work-identity",
  "worker-754-js-cjs-unmount-finished-work-identity",
  "worker-757-react-test-renderer-index-unmount-identity"
];

const expectedCurrentUnmountIdentityDiagnostics = [
  "test-renderer-unmount-native-ref-passive-cleanup-evidence",
  "test-renderer-unmount-finished-work-identity-admission",
  "private-unmount-tojson-native-finished-work-identity-validation",
  "private-unmount-totree-native-finished-work-identity-validation",
  "test-renderer-cjs-unmount-finished-work-identity",
  "test-renderer-package-root-unmount-finished-work-identity"
];

const expectedCurrentUnmountIdentityEvidenceRoles = [
  "current-worker-730-unmount-ref-passive-cleanup-dependency",
  "current-worker-733-unmount-finished-work-identity-report",
  "current-worker-733-unmount-finished-work-identity-rust-proof",
  "current-worker-754-cjs-unmount-finished-work-identity-report",
  "current-worker-754-cjs-development-tojson-unmount-identity-source",
  "current-worker-754-cjs-development-totree-unmount-identity-source",
  "current-worker-754-cjs-production-tojson-unmount-identity-source",
  "current-worker-754-cjs-production-totree-unmount-identity-source",
  "current-worker-757-package-root-unmount-identity-report",
  "current-worker-757-package-root-tojson-unmount-identity-source",
  "current-worker-757-package-root-totree-unmount-identity-source"
];

const packageRootSource = "packages/react-test-renderer/index.js";
const cjsDevelopmentSource =
  "packages/react-test-renderer/cjs/react-test-renderer.development.js";
const cjsProductionSource =
  "packages/react-test-renderer/cjs/react-test-renderer.production.js";
const serializationLocalGateTestSource =
  "tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs";

const jsonUnmountIdentityWithoutLifecycleRejectedToken =
  "jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(\n        unmountExecutionRecord,\n        jsonUnmountReport,\n        jsonUnmountIdentityEvidence\n      ),\n      false";
const jsonUnmountIdentityWithoutLifecycleAcceptedToken =
  "jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(\n        unmountExecutionRecord,\n        jsonUnmountReport,\n        jsonUnmountIdentityEvidence\n      ),\n      true";
const treeUnmountIdentityWithoutLifecycleRejectedToken =
  "treeFacade.canCreateAcceptedNativeExecutionDiagnosticResult(\n        unmountExecutionRecord,\n        treeUnmountReport,\n        treeUnmountIdentityEvidence\n      ),\n      false";
const treeUnmountIdentityWithoutLifecycleAcceptedToken =
  "treeFacade.canCreateAcceptedNativeExecutionDiagnosticResult(\n        unmountExecutionRecord,\n        treeUnmountReport,\n        treeUnmountIdentityEvidence\n      ),\n      true";

const expectedPublicCompatibilityClaims = [
  "publicTestRendererCompatibilityClaimed",
  "publicTestRendererSerializationCompatibilityClaimed",
  "publicTestRendererToJSONCompatibilityClaimed",
  "publicTestRendererToTreeCompatibilityClaimed",
  "publicTestRendererRootCompatibilityClaimed",
  "publicTestRendererUpdateCompatibilityClaimed",
  "publicTestRendererTestInstanceCompatibilityClaimed",
  "publicTestRendererNativeAddonLoadingCompatibilityClaimed",
  "publicTestRendererNativeAddonExecutionCompatibilityClaimed",
  "publicTestRendererNativeBridgeCompatibilityClaimed",
  "publicTestRendererNativeBridgeExecutionClaimed",
  "publicActCompatibilityClaimed",
  "publicTestRendererRootRoutingCompatibilityClaimed",
  "publicTestRendererUpdateNativeSerializationCompatibilityClaimed",
  "publicTestRendererUnmountNativeSerializationCompatibilityClaimed",
  "publicTestRendererUnmountIdentityAdmissionClaimed",
  "publicTestRendererMultichildSerializationCompatibilityClaimed",
  "publicTestRendererMultichildSiblingSerializationCompatibilityClaimed",
  "publicTestRendererMultichildIdentityAdmissionClaimed",
  "publicTestRendererMultichildSiblingIdentityAdmissionClaimed",
  "publicReactDomCompatibilityClaimed",
  "publicReactDomRootCompatibilityClaimed",
  "publicSchedulerCompatibilityClaimed",
  "publicHydrationCompatibilityClaimed",
  "publicEventCompatibilityClaimed",
  "publicRefCompatibilityClaimed",
  "publicResourceCompatibilityClaimed",
  "publicFormCompatibilityClaimed",
  "publicControlledInputCompatibilityClaimed"
];

const expectedBlockedSurfaces = [
  "test-renderer",
  "test-renderer-public-serialization",
  "test-renderer-to-json",
  "test-renderer-to-tree",
  "test-renderer-root",
  "test-renderer-update",
  "test-renderer-testinstance",
  "test-renderer-native-addon-loading",
  "test-renderer-native-addon-execution",
  "test-renderer-native-bridge",
  "test-renderer-native-bridge-execution",
  "act",
  "test-renderer-root-routing",
  "test-renderer-update-native-serialization",
  "test-renderer-unmount-native-serialization",
  "test-renderer-unmount-identity-admission",
  "test-renderer-multichild-serialization",
  "test-renderer-multichild-sibling-serialization",
  "test-renderer-multichild-identity-admission",
  "test-renderer-multichild-sibling-identity-admission",
  "react-dom",
  "react-dom-root",
  "scheduler",
  "hydration",
  "events",
  "refs",
  "resources",
  "forms",
  "controlled-inputs"
];

test("private admission 727-728 manifest records one skipped meta row and one accepted guard", () => {
  assert.deepEqual(PRIVATE_ADMISSION_727_728_WORKERS, expected727728Workers);
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_ROWS.map((row) => row.workerId),
    expected727728Workers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS,
    expected727728SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_SKIPPED_ROWS.map((row) => row.workerId),
    expected727728SkippedWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS,
    expectedPublicCompatibilityClaims
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
    expectedBlockedSurfaces
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_WORKERS,
    expectedCurrentUnmountIdentityWorkers
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_DIAGNOSTICS,
    expectedCurrentUnmountIdentityDiagnostics
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_EVIDENCE.map(
      (evidenceRow) => evidenceRow.role
    ),
    expectedCurrentUnmountIdentityEvidenceRoles
  );
  assert.deepEqual(
    PRIVATE_ADMISSION_727_728_REQUIRED_CURRENT_UNMOUNT_IDENTITY_EVIDENCE_ROLES,
    expectedCurrentUnmountIdentityEvidenceRoles
  );
  assert.equal(PRIVATE_ADMISSION_727_728_ROWS.length, 1);
  assert.equal(PRIVATE_ADMISSION_727_728_SKIPPED_ROWS.length, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_727_728_WORKERS).size, 1);
  assert.equal(new Set(PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS).size, 1);
  assert.equal(
    PRIVATE_ADMISSION_727_728_WORKERS.includes(
      "worker-727-package-private-admission-audit-724-726"
    ),
    false
  );
});

test("private admission 727-728 gate recognizes source-owned unmount identity metadata without public compatibility", () => {
  const gate = evaluatePrivateAdmission727728Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.skipMetaRecognized, true);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.blockerContextRecognized, true);
  assert.equal(gate.evidenceContractRecognized, true);
  assert.equal(gate.currentUnmountIdentityEvidenceRecognized, true);
  assert.equal(gate.currentUnmountIdentityEvidenceContractRecognized, true);
  assert.equal(gate.blockedPublicSurfacesRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, PRIVATE_ADMISSION_727_728_WORKERS);
  assert.deepEqual(gate.skippedWorkers, PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS);
  assert.deepEqual(
    gate.currentUnmountIdentityWorkers,
    PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_WORKERS
  );
  assert.deepEqual(
    gate.currentUnmountIdentityDiagnostics,
    PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_DIAGNOSTICS
  );
  assert.deepEqual(gate.recognizedWorkerIds, PRIVATE_ADMISSION_727_728_WORKERS);
  assert.deepEqual(
    gate.recognizedSkippedWorkerIds,
    PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS
  );
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);
  assert.deepEqual(gate.manifest.missingWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateWorkerIds, []);
  assert.deepEqual(gate.manifest.missingSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.unexpectedSkippedWorkerIds, []);
  assert.deepEqual(gate.manifest.duplicateSkippedWorkerIds, []);
  assert.deepEqual(
    gate.manifest.skippedWorkerIds,
    PRIVATE_ADMISSION_727_728_SKIPPED_WORKERS
  );

  const row = gate.rowsByWorker[worker728];
  assert.equal(row.privateAdmission, "accepted-private-diagnostic");
  assert.equal(row.sourceQueue, "727-728");
  assert.equal(
    row.primaryCompatibilityArea,
    "test-renderer-unmount-native-identity-argument-guard"
  );
  assert.equal(row.runtimeCapabilityAdded, true);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "rejected");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, expectedAcceptedDiagnosticIds);
  assert.deepEqual(row.acceptedDiagnosticIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_ACCEPTED_DIAGNOSTICS[row.workerId]
  ]);
  assert.equal(
    row.acceptedDiagnosticIds.includes(
      "private-unmount-native-serialization-rejects-finished-work-identity-evidence"
    ),
    true
  );
  assert.deepEqual(row.dependencyWorkerIds, expectedDependencyWorkerIds);
  assert.deepEqual(row.dependencyWorkerIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCIES[row.workerId]
  ]);
  assert.deepEqual(row.dependencyDiagnosticIds, expectedDependencyDiagnosticIds);
  assert.deepEqual(row.dependencyDiagnosticIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_DEPENDENCY_DIAGNOSTICS[row.workerId]
  ]);
  assert.deepEqual(row.blockerContextWorkerIds, expectedBlockerContextWorkerIds);
  assert.deepEqual(row.blockerContextWorkerIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT[row.workerId]
  ]);
  assert.deepEqual(
    row.blockerContextDiagnosticIds,
    expectedBlockerContextDiagnosticIds
  );
  assert.deepEqual(row.blockerContextDiagnosticIds, [
    ...PRIVATE_ADMISSION_727_728_REQUIRED_BLOCKER_CONTEXT_DIAGNOSTICS[
      row.workerId
    ]
  ]);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    expectedEvidenceRoles
  );
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    [...PRIVATE_ADMISSION_727_728_REQUIRED_EVIDENCE_ROLES[row.workerId]]
  );

  for (const evaluatedRow of gate.rows) {
    assert.deepEqual(
      evaluatedRow.blockedPublicCompatibilitySurfaces,
      PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES,
      evaluatedRow.workerId
    );
    assert.deepEqual(
      Object.keys(evaluatedRow.publicCompatibilityClaims).sort(),
      [...PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS].sort(),
      evaluatedRow.workerId
    );
    assert.deepEqual(
      Object.values(evaluatedRow.publicCompatibilityClaims),
      Object.values(evaluatedRow.publicCompatibilityClaims).map(() => false),
      evaluatedRow.workerId
    );
    assert.deepEqual(
      evaluatedRow.blockedPublicClaims,
      Object.keys(evaluatedRow.publicCompatibilityClaims),
      evaluatedRow.workerId
    );
    assert.deepEqual(
      evaluatedRow.publicCompatibilityViolations,
      [],
      evaluatedRow.workerId
    );

    for (const evidenceRow of evaluatedRow.evidence) {
      assert.equal(evidenceRow.recognized, true, evidenceRow.role);
      assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
      assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.path);
    }
  }

  assert.deepEqual(
    gate.currentUnmountIdentityEvidence.map((evidenceRow) => evidenceRow.role),
    expectedCurrentUnmountIdentityEvidenceRoles
  );

  for (const evidenceRow of gate.currentUnmountIdentityEvidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.forbiddenTokensPresent, [], evidenceRow.path);
    assert.deepEqual(evidenceRow.failedSourceAssertions, [], evidenceRow.path);
  }
});

test("private admission 727-728 gate recognizes Worker 727 as non-runtime skip meta", () => {
  const gate = evaluatePrivateAdmission727728Gate();
  const row =
    gate.skippedRowsByWorker[
      "worker-727-package-private-admission-audit-724-726"
    ];

  assert.equal(row.privateAdmission, "skipped-meta");
  assert.equal(row.sourceQueue, "727-728");
  assert.equal(row.runtimeCapabilityAdded, false);
  assert.equal(row.recognized, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.compatibilityClaimed, false);
  assert.equal(row.promotion, "not-applicable");
  assert.equal(row.privateEvidenceOnly, true);
  assert.deepEqual(row.acceptedDiagnosticIds, []);
  assert.deepEqual(row.dependencyWorkerIds, []);
  assert.deepEqual(row.dependencyDiagnosticIds, []);
  assert.deepEqual(row.blockerContextWorkerIds, []);
  assert.deepEqual(row.blockerContextDiagnosticIds, []);
  assert.equal(row.skipReason.endsWith("no-new-runtime-capability"), true);
  assert.deepEqual(row.publicCompatibilityViolations, []);
  assert.deepEqual(
    row.blockedPublicCompatibilitySurfaces,
    PRIVATE_ADMISSION_727_728_BLOCKED_SURFACES
  );
  assert.deepEqual(
    Object.keys(row.publicCompatibilityClaims).sort(),
    [...PRIVATE_ADMISSION_727_728_PUBLIC_COMPATIBILITY_CLAIMS].sort()
  );

  for (const evidenceRow of row.evidence) {
    assert.equal(evidenceRow.recognized, true, evidenceRow.role);
    assert.deepEqual(evidenceRow.missingTokens, [], evidenceRow.path);
  }
});

test("private admission 727-728 gate rejects missing accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        acceptedDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-id-mismatch",
      rows: [
        {
          workerId: worker728,
          expectedAcceptedDiagnosticIds,
          actualAcceptedDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects unrecognized accepted diagnostics", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: [
        "worker-728-test-renderer-unmount-native-identity-argument-guard"
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects stale or meta worker ids in accepted rows", () => {
  const staleMetaWorkerId =
    "worker-727-package-private-admission-audit-724-726";
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        workerId: staleMetaWorkerId
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-worker-manifest-mismatch",
      missingWorkerIds: [
        "worker-728-test-renderer-unmount-native-identity-argument-guard"
      ],
      unexpectedWorkerIds: [staleMetaWorkerId],
      duplicateWorkerIds: []
    }
  ]);
});

test("private admission 727-728 gate rejects skip meta rows that claim runtime capability", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    skippedRowOverrides: {
      "worker-727-package-private-admission-audit-724-726": {
        runtimeCapabilityAdded: true,
        acceptedDiagnosticIds: ["unexpected-runtime-diagnostic"]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.skipMetaRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "skip-meta-row-claimed-runtime-capability",
      workerIds: ["worker-727-package-private-admission-audit-724-726"]
    }
  ]);
});

test("private admission 727-728 gate rejects missing dependency metadata", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        dependencyWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-mismatch",
      rows: [
        {
          workerId: worker728,
          expectedDependencyWorkerIds,
          actualDependencyWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects missing dependency diagnostic metadata", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        dependencyDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.dependenciesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-dependency-diagnostic-mismatch",
      rows: [
        {
          workerId: worker728,
          expectedDependencyDiagnosticIds,
          actualDependencyDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects missing blocker context metadata", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        blockerContextWorkerIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-mismatch",
      rows: [
        {
          workerId:
            "worker-728-test-renderer-unmount-native-identity-argument-guard",
          expectedBlockerContextWorkerIds: [
            "worker-725-test-renderer-update-serialization-finished-work-identity",
            "worker-726-test-renderer-update-native-serialization-identity-admission"
          ],
          actualBlockerContextWorkerIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects missing blocker context diagnostic metadata", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        blockerContextDiagnosticIds: []
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockerContextRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "accepted-private-diagnostic-blocker-context-diagnostic-mismatch",
      rows: [
        {
          workerId:
            "worker-728-test-renderer-unmount-native-identity-argument-guard",
          expectedBlockerContextDiagnosticIds: [
            "test-renderer-update-serialization-finished-work-identity",
            "test-renderer-update-native-serialization-identity-admission"
          ],
          actualBlockerContextDiagnosticIds: []
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects replacing Worker 728 guard evidence with later identity evidence", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      [worker728]: {
        evidence: PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_EVIDENCE
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.acceptedDiagnosticsRecognized, true);
  assert.equal(gate.dependenciesRecognized, true);
  assert.equal(gate.evidenceContractRecognized, false);
  assertViolationIds(gate, [
    "accepted-private-diagnostic-evidence-contract-mismatch"
  ]);

  const row = gate.rowsByWorker[worker728];
  assert.equal(row.evidenceRecognized, true);
  assert.equal(
    row.evidence.some(
      (evidenceRow) =>
        evidenceRow.role === "worker-728-unmount-identity-argument-guard-report"
    ),
    false
  );
  assert.equal(
    gate.violations[0].rows[0].missingEvidenceRoles.includes(
      "worker-728-unmount-identity-argument-guard-report"
    ),
    true
  );
});

test("private admission 727-728 gate rejects prose-only and test-title evidence replacements", () => {
  const replacements = [
    {
      label: "prose-only",
      evidence: [
        {
          role: expectedEvidenceRoles[0],
          path: "worker-progress/worker-754-js-cjs-unmount-finished-work-identity.md",
          tokens: [
            "strict private admission for Worker 733 toJSON/toTree evidence"
          ],
          forbiddenTokens: [],
          sliceStart: null,
          sliceEnd: null
        }
      ]
    },
    {
      label: "test-title-only",
      evidence: [
        {
          role: "current-unmount-native-strict-identity-conformance",
          path: "tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs",
          tokens: [
            "react-test-renderer JS private native unmount serialization accepts strict finished-work identity evidence"
          ],
          forbiddenTokens: [],
          sliceStart: null,
          sliceEnd: null
        }
      ]
    }
  ];

  for (const replacement of replacements) {
    const gate = evaluatePrivateAdmission727728Gate({
      rowOverrides: {
        [worker728]: {
          evidence: replacement.evidence
        }
      }
    });

    assert.equal(
      gate.status,
      PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
      replacement.label
    );
    assert.equal(gate.privateDiagnosticsRecognized, false, replacement.label);
    assert.equal(gate.evidenceContractRecognized, false, replacement.label);
    assertViolationIds(
      gate,
      ["accepted-private-diagnostic-evidence-contract-mismatch"],
      replacement.label
    );
  }
});

test("private admission 727-728 gate rejects row override spoofing over current source identity drift", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: packageRootSource,
    sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
    find: "unmountNativeExecutionRequiresFinishedWorkIdentity: true",
    replace: "unmountNativeExecutionRequiresFinishedWorkIdentity: false"
  });

  try {
    const gate = evaluatePrivateAdmission727728Gate({
      workspaceRoot: workspace.root,
      rowOverrides: {
        [worker728]: {
          recognized: true
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.currentUnmountIdentityEvidenceRecognized, false);
    assertViolationIds(gate, [
      "current-unmount-identity-evidence-not-recognized"
    ]);
    assert.equal(gate.rowsByWorker[worker728].recognized, true);

    const sourceEvidence =
      gate.currentUnmountIdentityEvidenceByRole[
        "current-worker-757-package-root-tojson-unmount-identity-source"
      ];
    assert.notEqual(sourceEvidence, undefined);
    assert.equal(sourceEvidence.recognized, false);
    assert.deepEqual(sourceEvidence.missingTokens, []);
    assertSourceAssertionFailure(sourceEvidence, {
      property: "unmountNativeExecutionRequiresFinishedWorkIdentity",
      actualSource: "false",
      actualValue: false
    });
  } finally {
    workspace.cleanup();
  }
});

test("private admission 727-728 gate rejects comment, string, template, and regex spoofed current source identity", () => {
  const token = "unmountNativeExecutionRequiresFinishedWorkIdentity: true";
  const cases = [
    {
      label: "comment",
      replacement: `unmountNativeExecutionRequiresFinishedWorkIdentity: false /* ${token} */`,
      actualSource: `false /* ${token} */`,
      actualValue: null
    },
    {
      label: "string",
      replacement:
        "unmountNativeExecutionRequiresFinishedWorkIdentity: false,\n  stringSpoofedUnmountIdentitySource: 'unmountNativeExecutionRequiresFinishedWorkIdentity: true'",
      actualSource: "false",
      actualValue: false
    },
    {
      label: "template",
      replacement:
        "unmountNativeExecutionRequiresFinishedWorkIdentity: false,\n  templateSpoofedUnmountIdentitySource: `unmountNativeExecutionRequiresFinishedWorkIdentity: true`",
      actualSource: "false",
      actualValue: false
    },
    {
      label: "regex",
      replacement:
        "unmountNativeExecutionRequiresFinishedWorkIdentity: false,\n  regexSpoofedUnmountIdentitySource: /unmountNativeExecutionRequiresFinishedWorkIdentity: true/",
      actualSource: "false",
      actualValue: false
    }
  ];

  for (const testCase of cases) {
    const workspace = createWorkspaceWithMutatedEvidenceFile({
      evidencePath: packageRootSource,
      sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
      find: token,
      replace: testCase.replacement
    });

    try {
      const gate = evaluatePrivateAdmission727728Gate({
        workspaceRoot: workspace.root
      });

      assert.equal(
        gate.status,
        PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
        testCase.label
      );
      assert.equal(gate.privateDiagnosticsRecognized, false, testCase.label);
      assert.equal(
        gate.currentUnmountIdentityEvidenceRecognized,
        false,
        testCase.label
      );
      assertViolationIds(
        gate,
        ["current-unmount-identity-evidence-not-recognized"],
        testCase.label
      );

      const sourceEvidence =
        gate.currentUnmountIdentityEvidenceByRole[
          "current-worker-757-package-root-tojson-unmount-identity-source"
        ];
      assert.equal(sourceEvidence.recognized, false, testCase.label);
      assertSourceAssertionFailure(sourceEvidence, {
        property: "unmountNativeExecutionRequiresFinishedWorkIdentity",
        actualSource: testCase.actualSource,
        actualValue: testCase.actualValue
      });
    } finally {
      workspace.cleanup();
    }
  }
});

test("private admission 727-728 gate rejects unsupported current source object members that can broaden compatibility", () => {
  const cases = [
    {
      label: "post-assertion-spread",
      member:
        "...{ publicSerializationAvailable: true, nativeExecution: true, compatibilityClaimed: true }",
      errorKind: "spread"
    },
    {
      label: "computed-property",
      member: '["compatibilityClaimed"]: true',
      errorKind: "computed-property"
    },
    {
      label: "accessor",
      member: "get compatibilityClaimed() { return true; }",
      errorKind: "accessor"
    },
    {
      label: "method",
      member: "compatibilityClaimed() { return true; }",
      errorKind: "method"
    }
  ];

  for (const testCase of cases) {
    const workspace = createWorkspaceWithMutatedEvidenceFile({
      evidencePath: packageRootSource,
      mutate(text) {
        return replaceInEvidenceSlice(text, {
          sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
          find: "compatibilityClaimed: false",
          replace: `compatibilityClaimed: false,\n  ${testCase.member}`
        });
      }
    });

    try {
      const gate = evaluatePrivateAdmission727728Gate({
        workspaceRoot: workspace.root
      });

      assert.equal(
        gate.status,
        PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
        testCase.label
      );
      assert.equal(gate.privateDiagnosticsRecognized, false, testCase.label);
      assert.equal(
        gate.currentUnmountIdentityEvidenceRecognized,
        false,
        testCase.label
      );
      assertViolationIds(
        gate,
        ["current-unmount-identity-evidence-not-recognized"],
        testCase.label
      );

      const sourceEvidence =
        gate.currentUnmountIdentityEvidenceByRole[
          "current-worker-757-package-root-tojson-unmount-identity-source"
        ];
      assert.equal(sourceEvidence.recognized, false, testCase.label);
      assertUnsupportedObjectMemberFailure(
        sourceEvidence,
        testCase.errorKind,
        testCase.label
      );
    } finally {
      workspace.cleanup();
    }
  }
});

test("private admission 727-728 gate rejects unasserted compatibility-looking current source fields", () => {
  const cases = [
    {
      label: "package-compatibility-claimed",
      member: "packageCompatibilityClaimed: true",
      property: "packageCompatibilityClaimed"
    },
    {
      label: "native-execution-available",
      member: "nativeExecutionAvailable: true",
      property: "nativeExecutionAvailable"
    },
    {
      label: "public-to-json-available",
      member: "publicToJSONAvailable: true",
      property: "publicToJSONAvailable"
    },
    {
      label: "public-root-available",
      member: "publicRootAvailable: true",
      property: "publicRootAvailable"
    },
    {
      label: "package-compatibility-shorthand",
      member: "packageCompatibilityClaimed",
      property: "packageCompatibilityClaimed"
    },
    {
      label: "public-to-tree-available",
      member: "publicToTreeAvailable: true",
      property: "publicToTreeAvailable"
    },
    {
      label: "root-compatibility-claimed",
      member: "rootCompatibilityClaimed: true",
      property: "rootCompatibilityClaimed"
    },
    {
      label: "to-json-available",
      member: "toJSONAvailable: true",
      property: "toJSONAvailable"
    },
    {
      label: "native-bridge-execution-available",
      member: "nativeBridgeExecutionAvailable: true",
      property: "nativeBridgeExecutionAvailable"
    }
  ];

  for (const testCase of cases) {
    const workspace = createWorkspaceWithMutatedEvidenceFile({
      evidencePath: packageRootSource,
      mutate(text) {
        return replaceInEvidenceSlice(text, {
          sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
          find: "compatibilityClaimed: false",
          replace: `compatibilityClaimed: false,\n  ${testCase.member}`
        });
      }
    });

    try {
      const gate = evaluatePrivateAdmission727728Gate({
        workspaceRoot: workspace.root
      });

      assert.equal(
        gate.status,
        PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
        testCase.label
      );
      assert.equal(gate.privateDiagnosticsRecognized, false, testCase.label);
      assert.equal(
        gate.currentUnmountIdentityEvidenceRecognized,
        false,
        testCase.label
      );
      assertViolationIds(
        gate,
        ["current-unmount-identity-evidence-not-recognized"],
        testCase.label
      );

      const sourceEvidence =
        gate.currentUnmountIdentityEvidenceByRole[
          "current-worker-757-package-root-tojson-unmount-identity-source"
        ];
      assert.equal(sourceEvidence.recognized, false, testCase.label);
      assertUnassertedCompatibilityFieldFailure(
        sourceEvidence,
        testCase.property,
        testCase.label
      );
    } finally {
      workspace.cleanup();
    }
  }
});

test("private admission 727-728 gate rejects hidden compatibility carrier current source fields", () => {
  const cases = [
    {
      label: "proto-compatibility-aliases",
      member: `__proto__: {
    packageCompatibilityClaimed: true,
    nativeExecutionAvailable: true,
    publicRootAvailable: true
  }`
    },
    {
      label: "quoted-proto-compatibility-aliases",
      member: `"__proto__": {
    packageCompatibilityClaimed: true,
    publicRootAvailable: true
  }`
    },
    {
      label: "escaped-quoted-proto-compatibility-aliases",
      member: `"\\u005f\\u005fproto\\u005f\\u005f": {
    packageCompatibilityClaimed: true,
    publicRootAvailable: true
  }`
    },
    {
      label: "constructor-prototype-compatibility-aliases",
      member: `constructor: {
    prototype: {
      packageCompatibilityClaimed: true,
      publicRootAvailable: true
    }
  }`
    },
    {
      label: "escaped-quoted-constructor-prototype-compatibility-aliases",
      member: `"\\u0063onstructor": {
    "\\u0070rototype": {
      packageCompatibilityClaimed: true,
      publicRootAvailable: true
    }
  }`
    },
    {
      label: "prototype-compatibility-aliases",
      member: `prototype: {
    nativeExecutionAvailable: true,
    rootCompatibilityClaimed: true
  }`
    },
    {
      label: "escaped-quoted-prototype-compatibility-aliases",
      member: `"\\u0070rototype": {
    nativeExecutionAvailable: true,
    rootCompatibilityClaimed: true
  }`
    }
  ];

  for (const testCase of cases) {
    const workspace = createWorkspaceWithMutatedEvidenceFile({
      evidencePath: packageRootSource,
      mutate(text) {
        return replaceInEvidenceSlice(text, {
          sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
          find: "compatibilityClaimed: false",
          replace: `compatibilityClaimed: false,\n  ${testCase.member}`
        });
      }
    });

    try {
      const gate = evaluatePrivateAdmission727728Gate({
        workspaceRoot: workspace.root
      });

      assert.equal(
        gate.status,
        PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
        testCase.label
      );
      assert.equal(gate.privateDiagnosticsRecognized, false, testCase.label);
      assert.equal(
        gate.currentUnmountIdentityEvidenceRecognized,
        false,
        testCase.label
      );
      assertViolationIds(
        gate,
        ["current-unmount-identity-evidence-not-recognized"],
        testCase.label
      );

      const sourceEvidence =
        gate.currentUnmountIdentityEvidenceByRole[
          "current-worker-757-package-root-tojson-unmount-identity-source"
        ];
      assert.equal(sourceEvidence.recognized, false, testCase.label);
      assertUnsupportedObjectMemberFailure(
        sourceEvidence,
        "hidden-claim-carrier",
        testCase.label
      );
    } finally {
      workspace.cleanup();
    }
  }
});

test("private admission 727-728 gate rejects nested hidden compatibility carrier current source fields", () => {
  const cases = [
    {
      label: "nested-proto-compatibility-aliases",
      member: `metadataCarrier: {
    __proto__: {
      packageCompatibilityClaimed: true,
      publicRootAvailable: true
    }
  }`
    },
    {
      label: "nested-escaped-quoted-proto-compatibility-aliases",
      member: `metadataCarrier: {
    "\\u005f\\u005fproto\\u005f\\u005f": {
      packageCompatibilityClaimed: true,
      publicRootAvailable: true
    }
  }`
    },
    {
      label: "nested-constructor-prototype-compatibility-aliases",
      member: `metadataCarrier: {
    constructor: {
      prototype: {
        packageCompatibilityClaimed: true,
        publicRootAvailable: true
      }
    }
  }`
    },
    {
      label: "nested-prototype-compatibility-aliases",
      member: `metadataCarrier: {
    prototype: {
      nativeExecutionAvailable: true,
      rootCompatibilityClaimed: true
    }
  }`
    }
  ];

  for (const testCase of cases) {
    const workspace = createWorkspaceWithMutatedEvidenceFile({
      evidencePath: packageRootSource,
      mutate(text) {
        return replaceInEvidenceSlice(text, {
          sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
          find: "compatibilityClaimed: false",
          replace: `compatibilityClaimed: false,\n  ${testCase.member}`
        });
      }
    });

    try {
      const gate = evaluatePrivateAdmission727728Gate({
        workspaceRoot: workspace.root
      });

      assert.equal(
        gate.status,
        PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
        testCase.label
      );
      assert.equal(gate.privateDiagnosticsRecognized, false, testCase.label);
      assert.equal(
        gate.currentUnmountIdentityEvidenceRecognized,
        false,
        testCase.label
      );
      assertViolationIds(
        gate,
        ["current-unmount-identity-evidence-not-recognized"],
        testCase.label
      );

      const sourceEvidence =
        gate.currentUnmountIdentityEvidenceByRole[
          "current-worker-757-package-root-tojson-unmount-identity-source"
        ];
      assert.equal(sourceEvidence.recognized, false, testCase.label);
      assertUnsupportedObjectMemberFailure(
        sourceEvidence,
        "hidden-claim-carrier",
        testCase.label
      );
    } finally {
      workspace.cleanup();
    }
  }
});

test("private admission 727-728 gate rejects forged package-root gate anchors inside block comments", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: packageRootSource,
    mutate(text) {
      const anchor = "const toJSONPrivateSerializationFacadeGate = Object.freeze({";
      const forgedGate = `/*
${canonicalPackageRootToJSONGateSource()}
*/
`;
      assert.equal(text.includes(anchor), true, anchor);
      return text.replace(
        anchor,
        `${forgedGate}const toJSONPrivateSerializationFacadeGate = forgedObjectFreeze({`
      );
    }
  });

  try {
    const gate = evaluatePrivateAdmission727728Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.currentUnmountIdentityEvidenceRecognized, false);
    assertViolationIds(gate, [
      "current-unmount-identity-evidence-not-recognized"
    ]);

    const sourceEvidence =
      gate.currentUnmountIdentityEvidenceByRole[
        "current-worker-757-package-root-tojson-unmount-identity-source"
      ];
    assert.equal(sourceEvidence.recognized, false);
    assert.match(
      sourceEvidence.sliceError,
      /^slice-start-not-found: const toJSONPrivateSerializationFacadeGate = Object\.freeze/
    );
  } finally {
    workspace.cleanup();
  }
});

test("private admission 727-728 gate rejects forged package-root gate anchors inside templates", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: packageRootSource,
    mutate(text) {
      const anchor = "const toJSONPrivateSerializationFacadeGate = Object.freeze({";
      const forgedGate = `const forgedGateTemplate = ${jsTemplateLiteral(
        canonicalPackageRootToJSONGateSource()
      )};
`;
      assert.equal(text.includes(anchor), true, anchor);
      return text.replace(
        anchor,
        `${forgedGate}const toJSONPrivateSerializationFacadeGate = forgedObjectFreeze({`
      );
    }
  });

  try {
    const gate = evaluatePrivateAdmission727728Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.currentUnmountIdentityEvidenceRecognized, false);
    assertViolationIds(gate, [
      "current-unmount-identity-evidence-not-recognized"
    ]);

    const sourceEvidence =
      gate.currentUnmountIdentityEvidenceByRole[
        "current-worker-757-package-root-tojson-unmount-identity-source"
      ];
    assert.equal(sourceEvidence.recognized, false);
    assert.match(
      sourceEvidence.sliceError,
      /^slice-start-not-found: const toJSONPrivateSerializationFacadeGate = Object\.freeze/
    );
  } finally {
    workspace.cleanup();
  }
});

test("private admission 727-728 gate rejects caller-shaped package-root canonical shells", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: packageRootSource,
    mutate(text) {
      const anchor = "const toJSONPrivateSerializationFacadeGate = Object.freeze({";
      const forgedGate = `function createCallerShapedPrivateAdmission727728Shell() {
  ${canonicalPackageRootToJSONGateSource().replaceAll("\n", "\n  ")}
  return toJSONPrivateSerializationFacadeGate;
}
`;
      assert.equal(text.includes(anchor), true, anchor);
      return text.replace(
        anchor,
        `${forgedGate}const toJSONPrivateSerializationFacadeGate = forgedObjectFreeze({`
      );
    }
  });

  try {
    const gate = evaluatePrivateAdmission727728Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.currentUnmountIdentityEvidenceRecognized, false);
    assertViolationIds(gate, [
      "current-unmount-identity-evidence-not-recognized"
    ]);

    const sourceEvidence =
      gate.currentUnmountIdentityEvidenceByRole[
        "current-worker-757-package-root-tojson-unmount-identity-source"
      ];
    assert.equal(sourceEvidence.recognized, false);
    assert.match(
      sourceEvidence.sliceError,
      /^slice-start-not-found: const toJSONPrivateSerializationFacadeGate = Object\.freeze/
    );
  } finally {
    workspace.cleanup();
  }
});

test("private admission 727-728 gate does not admit failing strict serialization-local behavior as current evidence", () => {
  const strictIdentityRole = "current-unmount-native-strict-identity-conformance";
  const strictIdentityPath =
    "tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs";
  const workspace = createWorkspaceWithMutatedEvidenceFile({});

  try {
    assert.equal(
      PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_EVIDENCE.some(
        (evidenceRow) => evidenceRow.role === strictIdentityRole
      ),
      false
    );
    assert.equal(
      PRIVATE_ADMISSION_727_728_REQUIRED_CURRENT_UNMOUNT_IDENTITY_EVIDENCE_ROLES.includes(
        strictIdentityRole
      ),
      false
    );
    assert.equal(existsSync(join(workspace.root, strictIdentityPath)), false);

    const gate = evaluatePrivateAdmission727728Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_GATE_STATUS);
    assert.equal(gate.currentUnmountIdentityEvidenceRecognized, true);
    assert.equal(
      gate.currentUnmountIdentityEvidenceByRole[strictIdentityRole],
      undefined
    );
    assert.equal(
      gate.currentUnmountIdentityEvidence.some(
        (evidenceRow) => evidenceRow.path === strictIdentityPath
      ),
      false
    );
  } finally {
    workspace.cleanup();
  }
});

test("private admission 727-728 gate rejects CJS development and production false-to-true source drift", () => {
  const cases = [
    {
      label: "development",
      evidencePath: cjsDevelopmentSource,
      toJSONRole:
        "current-worker-754-cjs-development-tojson-unmount-identity-source",
      toTreeRole:
        "current-worker-754-cjs-development-totree-unmount-identity-source"
    },
    {
      label: "production",
      evidencePath: cjsProductionSource,
      toJSONRole:
        "current-worker-754-cjs-production-tojson-unmount-identity-source",
      toTreeRole:
        "current-worker-754-cjs-production-totree-unmount-identity-source"
    }
  ];

  for (const testCase of cases) {
    const workspace = createWorkspaceWithMutatedEvidenceFile({
      evidencePath: testCase.evidencePath,
      mutate(text) {
        let mutated = replaceInEvidenceSlice(text, {
          sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
          find: "publicSerializationAvailable: false",
          replace: "publicSerializationAvailable: true"
        });
        mutated = replaceInEvidenceSlice(mutated, {
          sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
          find: "nativeExecution: false",
          replace: "nativeExecution: true"
        });
        mutated = replaceInEvidenceSlice(mutated, {
          sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
          find: "compatibilityClaimed: false",
          replace: "compatibilityClaimed: true"
        });
        mutated = replaceInEvidenceSlice(mutated, {
          sliceStart: "const toTreePrivateFacadeGate = Object.freeze({",
          find: "publicTreeAvailable: false",
          replace: "publicTreeAvailable: true"
        });
        mutated = replaceInEvidenceSlice(mutated, {
          sliceStart: "const toTreePrivateFacadeGate = Object.freeze({",
          find: "nativeExecution: false",
          replace: "nativeExecution: true"
        });
        return replaceInEvidenceSlice(mutated, {
          sliceStart: "const toTreePrivateFacadeGate = Object.freeze({",
          find: "compatibilityClaimed: false",
          replace: "compatibilityClaimed: true"
        });
      }
    });

    try {
      const gate = evaluatePrivateAdmission727728Gate({
        workspaceRoot: workspace.root
      });

      assert.equal(
        gate.status,
        PRIVATE_ADMISSION_727_728_VIOLATION_STATUS,
        testCase.label
      );
      assert.equal(gate.privateDiagnosticsRecognized, false, testCase.label);
      assert.equal(
        gate.currentUnmountIdentityEvidenceRecognized,
        false,
        testCase.label
      );
      assertViolationIds(
        gate,
        ["current-unmount-identity-evidence-not-recognized"],
        testCase.label
      );

      const toJSONEvidence =
        gate.currentUnmountIdentityEvidenceByRole[testCase.toJSONRole];
      const toTreeEvidence =
        gate.currentUnmountIdentityEvidenceByRole[testCase.toTreeRole];
      assertSourceAssertionFailure(toJSONEvidence, {
        property: "publicSerializationAvailable",
        actualSource: "true",
        actualValue: true
      });
      assertSourceAssertionFailure(toJSONEvidence, {
        property: "nativeExecution",
        actualSource: "true",
        actualValue: true
      });
      assertSourceAssertionFailure(toJSONEvidence, {
        property: "compatibilityClaimed",
        actualSource: "true",
        actualValue: true
      });
      assertSourceAssertionFailure(toTreeEvidence, {
        property: "publicTreeAvailable",
        actualSource: "true",
        actualValue: true
      });
      assertSourceAssertionFailure(toTreeEvidence, {
        property: "nativeExecution",
        actualSource: "true",
        actualValue: true
      });
      assertSourceAssertionFailure(toTreeEvidence, {
        property: "compatibilityClaimed",
        actualSource: "true",
        actualValue: true
      });
    } finally {
      workspace.cleanup();
    }
  }
});

test("private admission 727-728 gate rejects public and native blocker false-to-true source drift", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: packageRootSource,
    mutate(text) {
      let mutated = replaceInEvidenceSlice(text, {
        sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
        find: "publicSerializationAvailable: false",
        replace: "publicSerializationAvailable: true"
      });
      mutated = replaceInEvidenceSlice(mutated, {
        sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
        find: "nativeExecution: false",
        replace: "nativeExecution: true"
      });
      mutated = replaceInEvidenceSlice(mutated, {
        sliceStart: "const toJSONPrivateSerializationFacadeGate = Object.freeze({",
        find: "compatibilityClaimed: false",
        replace: "compatibilityClaimed: true"
      });
      return replaceInEvidenceSlice(mutated, {
        sliceStart: "const toTreePrivateFacadeGate = Object.freeze({",
        find: "publicTreeAvailable: false",
        replace: "publicTreeAvailable: true"
      });
    }
  });

  try {
    const gate = evaluatePrivateAdmission727728Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.currentUnmountIdentityEvidenceRecognized, false);
    assertViolationIds(gate, [
      "current-unmount-identity-evidence-not-recognized"
    ]);

    const toJSONEvidence =
      gate.currentUnmountIdentityEvidenceByRole[
        "current-worker-757-package-root-tojson-unmount-identity-source"
      ];
    const toTreeEvidence =
      gate.currentUnmountIdentityEvidenceByRole[
        "current-worker-757-package-root-totree-unmount-identity-source"
      ];
    assertSourceAssertionFailure(toJSONEvidence, {
      property: "publicSerializationAvailable",
      actualSource: "true",
      actualValue: true
    });
    assertSourceAssertionFailure(toJSONEvidence, {
      property: "nativeExecution",
      actualSource: "true",
      actualValue: true
    });
    assertSourceAssertionFailure(toJSONEvidence, {
      property: "compatibilityClaimed",
      actualSource: "true",
      actualValue: true
    });
    assertSourceAssertionFailure(toTreeEvidence, {
      property: "publicTreeAvailable",
      actualSource: "true",
      actualValue: true
    });
  } finally {
    workspace.cleanup();
  }
});

test("private admission 727-728 gate rejects toTree-only current source identity drift", () => {
  const workspace = createWorkspaceWithMutatedEvidenceFile({
    evidencePath: packageRootSource,
    sliceStart: "const toTreePrivateFacadeGate = Object.freeze({",
    find: "unmountNativeExecutionRequiresFinishedWorkIdentity: true",
    replace: "unmountNativeExecutionRequiresFinishedWorkIdentity: false"
  });

  try {
    const gate = evaluatePrivateAdmission727728Gate({
      workspaceRoot: workspace.root
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
    assert.equal(gate.privateDiagnosticsRecognized, false);
    assert.equal(gate.currentUnmountIdentityEvidenceRecognized, false);
    assertViolationIds(gate, [
      "current-unmount-identity-evidence-not-recognized"
    ]);
    assert.equal(
      gate.currentUnmountIdentityEvidenceByRole[
        "current-worker-757-package-root-tojson-unmount-identity-source"
      ].recognized,
      true
    );

    const toTreeEvidence =
      gate.currentUnmountIdentityEvidenceByRole[
        "current-worker-757-package-root-totree-unmount-identity-source"
      ];
    assert.equal(toTreeEvidence.recognized, false);
    assertSourceAssertionFailure(toTreeEvidence, {
      property: "unmountNativeExecutionRequiresFinishedWorkIdentity",
      actualSource: "false",
      actualValue: false
    });
  } finally {
    workspace.cleanup();
  }
});

test("private admission 727-728 gate rejects row compatibility claims", () => {
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      "worker-728-test-renderer-unmount-native-identity-argument-guard": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: [
        "worker-728-test-renderer-unmount-native-identity-argument-guard"
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects blocked public surface drift", () => {
  const workerId =
    "worker-728-test-renderer-unmount-native-identity-argument-guard";
  const skippedWorkerId = "worker-727-package-private-admission-audit-724-726";
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      [workerId]: {
        blockedPublicCompatibilitySurfaces: []
      }
    },
    skippedRowOverrides: {
      [skippedWorkerId]: {
        blockedPublicCompatibilitySurfaces: [
          "test-renderer",
          "unexpected-public-surface"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicSurfacesRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-compatibility-surface-mismatch",
      rows: [
        {
          workerId,
          expectedBlockedPublicCompatibilitySurfaces: expectedBlockedSurfaces,
          actualBlockedPublicCompatibilitySurfaces: []
        },
        {
          workerId: skippedWorkerId,
          expectedBlockedPublicCompatibilitySurfaces: expectedBlockedSurfaces,
          actualBlockedPublicCompatibilitySurfaces: [
            "test-renderer",
            "unexpected-public-surface"
          ]
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects blocked public claim drift", () => {
  const workerId =
    "worker-728-test-renderer-unmount-native-identity-argument-guard";
  const skippedWorkerId = "worker-727-package-private-admission-audit-724-726";
  const gate = evaluatePrivateAdmission727728Gate({
    rowOverrides: {
      [workerId]: {
        blockedPublicClaims: []
      }
    },
    skippedRowOverrides: {
      [skippedWorkerId]: {
        blockedPublicClaims: [
          "publicTestRendererCompatibilityClaimed",
          "unexpectedPublicClaim"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "blocked-public-claim-mismatch",
      rows: [
        {
          workerId,
          expectedBlockedPublicClaims: expectedPublicCompatibilityClaims,
          actualBlockedPublicClaims: []
        },
        {
          workerId: skippedWorkerId,
          expectedBlockedPublicClaims: expectedPublicCompatibilityClaims,
          actualBlockedPublicClaims: [
            "publicTestRendererCompatibilityClaimed",
            "unexpectedPublicClaim"
          ]
        }
      ]
    }
  ]);
});

test("private admission 727-728 gate rejects public surface promotion leaks", () => {
  const workerId =
    "worker-728-test-renderer-unmount-native-identity-argument-guard";

  for (const claimId of expectedPublicCompatibilityClaims) {
    const gate = evaluatePrivateAdmission727728Gate({
      rowOverrides: {
        [workerId]: {
          publicCompatibilityClaims: {
            [claimId]: true
          }
        }
      }
    });

    assert.equal(gate.status, PRIVATE_ADMISSION_727_728_VIOLATION_STATUS);
    assert.equal(gate.compatibilityClaimed, true);
    assert.equal(gate.publicCompatibilityClaimed, true);
    assert.deepEqual(gate.violations, [
      {
        id: "public-compatibility-claim-detected",
        claimIds: [`${workerId}.${claimId}`]
      }
    ]);
  }
});

function assertViolationIds(gate, expectedViolationIds, message) {
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    expectedViolationIds,
    message
  );
}

function assertSourceAssertionFailure(
  evidenceRow,
  { property, actualSource, actualValue }
) {
  const failure = evidenceRow.failedSourceAssertions.find(
    (sourceAssertion) => sourceAssertion.property === property
  );
  assert.notEqual(failure, undefined, property);
  assert.equal(failure.actualSource, actualSource, property);
  assert.equal(failure.actualValue, actualValue, property);
  assert.equal(failure.passed, false, property);
}

function assertUnsupportedObjectMemberFailure(evidenceRow, errorKind, message) {
  assert.match(
    evidenceRow.sourceAssertionError,
    new RegExp(`^unsupported-object-member:${errorKind}:`),
    message
  );
  assert.equal(
    evidenceRow.failedSourceAssertions.length,
    evidenceRow.sourceAssertions.length,
    message
  );

  for (const failure of evidenceRow.failedSourceAssertions) {
    assert.equal(failure.actualSource, null, message);
    assert.equal(failure.actualValue, null, message);
    assert.equal(failure.passed, false, message);
    assert.equal(failure.error, evidenceRow.sourceAssertionError, message);
  }
}

function assertUnassertedCompatibilityFieldFailure(
  evidenceRow,
  property,
  message
) {
  const expectedError = `unasserted-compatibility-looking-properties:${property}`;
  assert.equal(evidenceRow.sourceAssertionError, expectedError, message);
  assert.equal(
    evidenceRow.failedSourceAssertions.length,
    evidenceRow.sourceAssertions.length,
    message
  );

  for (const failure of evidenceRow.failedSourceAssertions) {
    assert.equal(failure.actualSource, null, message);
    assert.equal(failure.actualValue, null, message);
    assert.equal(failure.passed, false, message);
    assert.equal(failure.error, expectedError, message);
  }
}

function canonicalPackageRootToJSONGateSource() {
  return `const toJSONPrivateSerializationFacadeGate = Object.freeze({
  privateUnmountFinishedWorkIdentityGateAvailable: true,
  unmountNativeExecutionFinishedWorkIdentityAdmissionWorker:
    'worker-733-test-renderer-unmount-finished-work-identity',
  acceptedUnmountFinishedWorkIdentityWorker:
    'worker-733-test-renderer-unmount-finished-work-identity',
  unmountNativeExecutionRequiresFinishedWorkIdentity: true,
  rejectsStaleUnmountFinishedWorkIdentity: true,
  requiresUnmountDeletionCleanupHandoffEvidence: true,
  validatesUnmountRootRequestIdentity: true,
  validatesUnmountDeletionAndCleanupHandoffIdentity: true,
  consumesCommittedHostRootFinishedWorkIdentity: true,
  consumesCommittedHostRootFinishedWorkLanes: true,
  publicSerializationAvailable: false,
  publicRouteAvailable: false,
  nativeBridgeAvailable: false,
  nativeExecution: false,
  compatibilityClaimed: false
});`;
}

function jsTemplateLiteral(value) {
  return `\`${value
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${")}\``;
}

function createWorkspaceWithMutatedEvidenceFile({
  evidencePath,
  find,
  replace,
  sliceStart,
  sliceEnd,
  mutate
}) {
  const root = mkdtempSync(join(tmpdir(), "private-admission-727-728-"));
  const workspaceRoot = findWorkspaceRoot();
  const evidencePaths = new Set([
    ...PRIVATE_ADMISSION_727_728_ROWS.flatMap((row) =>
      row.evidence.map((evidenceRow) => evidenceRow.path)
    ),
    ...PRIVATE_ADMISSION_727_728_CURRENT_UNMOUNT_IDENTITY_EVIDENCE.map(
      (evidenceRow) => evidenceRow.path
    ),
    ...PRIVATE_ADMISSION_727_728_SKIPPED_ROWS.flatMap((row) =>
      row.evidence.map((evidenceRow) => evidenceRow.path)
    )
  ]);

  for (const path of evidencePaths) {
    const sourcePath = join(workspaceRoot, path);
    const targetPath = join(root, path);
    mkdirSync(dirname(targetPath), { recursive: true });
    let text = readFileSync(sourcePath, "utf8");

    if (path === evidencePath) {
      if (mutate !== undefined) {
        text = mutate(text);
      } else if (sliceStart !== undefined) {
        text = replaceInEvidenceSlice(text, {
          sliceStart,
          sliceEnd,
          find,
          replace
        });
      } else {
        assert.equal(text.includes(find), true, find);
        text = text.replace(find, replace);
      }
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

function replaceInEvidenceSlice(text, { sliceStart, sliceEnd, find, replace }) {
  const startIndex = text.indexOf(sliceStart);
  assert.notEqual(startIndex, -1, sliceStart);
  const endIndex =
    sliceEnd === undefined
      ? text.length
      : text.indexOf(sliceEnd, startIndex + sliceStart.length);
  assert.notEqual(endIndex, -1, sliceEnd);

  const slice = text.slice(startIndex, endIndex);
  assert.equal(slice.includes(find), true, find);
  const updatedSlice = slice.replace(find, replace);
  return `${text.slice(0, startIndex)}${updatedSlice}${text.slice(endIndex)}`;
}

function findWorkspaceRoot() {
  let current = process.cwd();

  while (current !== dirname(current)) {
    if (
      existsSync(join(current, "package.json")) &&
      existsSync(join(current, "tests/conformance"))
    ) {
      return current;
    }

    current = dirname(current);
  }

  throw new Error("Unable to locate workspace root");
}
