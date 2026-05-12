import assert from "node:assert/strict";
import test from "node:test";

import {
  PRIVATE_ADMISSION_1228_BLOCKED_CLAIMS,
  PRIVATE_ADMISSION_1228_CONTEXT_WORKERS,
  PRIVATE_ADMISSION_1228_GATE_STATUS,
  PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS,
  PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS,
  PRIVATE_ADMISSION_1228_ROWS,
  PRIVATE_ADMISSION_1228_SURFACES,
  PRIVATE_ADMISSION_1228_VIOLATION_STATUS,
  evaluatePrivateAdmission1228Gate
} from "../src/private-admission-1228-native-metadata-no-load-source-ledger.mjs";

const sourceCurrentnessLedgerSurface =
  "worker-1228-native-metadata-source-currentness-ledger";
const rustMetadataSourceSurface =
  "worker-1228-native-rust-metadata-source-identifiers";
const noLoadMetadataGuardSurface =
  "worker-1228-native-metadata-no-load-guard";

const expectedSurfaces = [
  sourceCurrentnessLedgerSurface,
  rustMetadataSourceSurface,
  noLoadMetadataGuardSurface
];

test("private admission 1228 manifest pins current native metadata source/no-load surfaces", () => {
  assert.deepEqual(PRIVATE_ADMISSION_1228_SURFACES, expectedSurfaces);
  assert.deepEqual(
    PRIVATE_ADMISSION_1228_ROWS.map((row) => row.surfaceId),
    expectedSurfaces
  );
  assert.deepEqual(PRIVATE_ADMISSION_1228_CONTEXT_WORKERS, [
    "worker-1110-native-placeholder-metadata-factory",
    "worker-1116-native-no-load-guard-ledger-fix",
    "worker-1126-private-native-metadata-factory-contract",
    "worker-1130-crate-private-napi-metadata-shape",
    "worker-1133-napi-diagnostic-backed-metadata",
    "worker-1156-native-react-dom-render-handoff-admission"
  ]);
  assert.equal(PRIVATE_ADMISSION_1228_ROWS.length, 3);
  assert.equal(new Set(PRIVATE_ADMISSION_1228_SURFACES).size, 3);
  assertSubset(
    [
      "nativeAddonLoaded",
      "nativeAddonLoadAttempted",
      "nodeWorkerThreadsExecution",
      "workerThreadCreationAttempted",
      "childProcessExecution",
      "httpExecution",
      "httpsExecution",
      "napiCleanupHookExecution",
      "cleanupHookPublicExecutionClaimed",
      "rendererExecution",
      "reconcilerExecution",
      "publicNativeCompatibility",
      "publicRootExecution",
      "publicRootCompatibilitySurface",
      "packageExportCompatibilityClaimed"
    ],
    PRIVATE_ADMISSION_1228_BLOCKED_CLAIMS
  );

  for (const row of PRIVATE_ADMISSION_1228_ROWS) {
    assert.equal(row.sourceQueue, "1228", row.surfaceId);
    assert.equal(row.privateEvidenceOnly, true, row.surfaceId);
    assert.equal(row.sourceIdentifierChecksOnly, true, row.surfaceId);
    assert.equal(row.manifestEvaluationOnly, true, row.surfaceId);
    assert.equal(row.staticReadOnlyLedger, true, row.surfaceId);
    assert.equal(row.sourceEvidenceOnly, true, row.surfaceId);
    assert.equal(row.runtimeExecutionClaimed, false, row.surfaceId);
    assert.equal(row.publicRuntimeExecutionClaimed, false, row.surfaceId);
    assert.equal(row.nativeLoadAttempted, false, row.surfaceId);
    assert.equal(row.nativeAddonLoadAttempted, false, row.surfaceId);
    assert.equal(row.workerThreadLoadAttempted, false, row.surfaceId);
    assert.equal(row.childProcessLoadAttempted, false, row.surfaceId);
    assert.equal(row.httpLoadAttempted, false, row.surfaceId);
    assert.equal(row.httpsLoadAttempted, false, row.surfaceId);
    assert.equal(row.cleanupHookExecutionClaimed, false, row.surfaceId);
    assert.equal(row.rendererExecutionClaimed, false, row.surfaceId);
    assert.equal(row.reconcilerExecutionClaimed, false, row.surfaceId);
    assert.equal(row.packageExportsChanged, false, row.surfaceId);
    assert.equal(row.compatibilityClaimed, false, row.surfaceId);
    assert.equal(row.callerShapedEvidence, false, row.surfaceId);
    assert.equal(row.proseEvidence, false, row.surfaceId);
    assert.equal(row.testTitleEvidence, false, row.surfaceId);
    assert.equal(row.errorMessageEvidence, false, row.surfaceId);
    assert.equal(row.sourceSyntaxOnly, false, row.surfaceId);
    assert.equal(row.evidenceKind, "implementation-source-identifier-set");
    assert.deepEqual(
      row.sourceIdentifiers,
      PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS[row.surfaceId],
      row.surfaceId
    );
    assert.deepEqual(
      row.privateSurfaceIds,
      PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS[row.surfaceId],
      row.surfaceId
    );
    assertAllFalse(row.publicBlockers, row.surfaceId);
  }
});

test("private admission 1228 recognizes source identifiers and private no-load blockers", () => {
  const gate = evaluatePrivateAdmission1228Gate();

  assert.equal(gate.status, PRIVATE_ADMISSION_1228_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.manifestRecognized, true);
  assert.equal(gate.sourceIdentifiersRecognized, true);
  assert.equal(gate.evidenceRecognized, true);
  assert.equal(gate.privateSurfaceRecognized, true);
  assert.equal(gate.blockedPublicClaimsRecognized, true);
  assert.equal(gate.staticReadOnlyRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.queueSurfaces, expectedSurfaces);
  assert.deepEqual(gate.recognizedSurfaceIds, expectedSurfaces);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.nativeRuntimeClaimIds, []);
  assert.deepEqual(gate.workerChildNetworkClaimIds, []);
  assert.deepEqual(gate.cleanupHookClaimIds, []);
  assert.deepEqual(gate.rendererReconcilerClaimIds, []);
  assert.deepEqual(gate.publicNativeCompatibilityClaimIds, []);
  assert.deepEqual(gate.packageExportClaimIds, []);

  assertRecognizedRow(gate.rowsBySurface[sourceCurrentnessLedgerSurface], {
    privateAdmission:
      "accepted-private-native-metadata-source-currentness-ledger",
    implementationPaths: ["bindings/node/index.cjs"],
    evidenceRoles: [
      "worker-1228-product-ledger-source-identifiers",
      "worker-1228-product-ledger-direct-test"
    ]
  });
  assertRecognizedRow(gate.rowsBySurface[rustMetadataSourceSurface], {
    privateAdmission:
      "accepted-private-crate-native-root-work-loop-metadata-source",
    implementationPaths: [
      "crates/fast-react-napi/src/root_work_loop_metadata.rs",
      "crates/fast-react-napi/src/lib.rs"
    ],
    evidenceRoles: [
      "worker-1228-rust-metadata-private-source",
      "worker-1228-rust-module-remains-crate-private"
    ]
  });
  assertRecognizedRow(gate.rowsBySurface[noLoadMetadataGuardSurface], {
    privateAdmission: "accepted-private-native-metadata-no-load-source-guard",
    implementationPaths: [
      "bindings/node/test/native-no-load-guard.test.cjs",
      "bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs",
      "bindings/node/test/native-react-dom-render-handoff-admission.test.cjs",
      "bindings/node/package.json",
      "bindings/node/index.mjs"
    ],
    evidenceRoles: [
      "worker-1228-native-no-load-guard-source",
      "worker-1228-native-package-surface-remains-public-only",
      "worker-1228-native-esm-private-symbols-not-named",
      "worker-1228-react-dom-handoff-load-guard"
    ]
  });
});

test("private admission 1228 rejects stale or missing source identifiers", () => {
  const gate = evaluatePrivateAdmission1228Gate({
    rowOverrides: {
      [rustMetadataSourceSurface]: {
        sourceIdentifiers: [
          ...PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS[
            rustMetadataSourceSurface
          ],
          "RootWorkLoopFinishedWorkMetadataStalePublicIdentifier"
        ]
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_1228_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.sourceIdentifiersRecognized, false);
  assertViolationIds(gate, [
    "native-metadata-no-load-source-identifier-set-mismatch",
    "native-metadata-no-load-source-identifier-missing",
    "native-metadata-no-load-required-row-not-recognized"
  ]);
  assert.deepEqual(
    gate.rowsBySurface[
      rustMetadataSourceSurface
    ].missingSourceIdentifiers,
    ["RootWorkLoopFinishedWorkMetadataStalePublicIdentifier"]
  );
});

test("private admission 1228 rejects caller, prose, test-title, and syntax-only evidence", () => {
  const gate = evaluatePrivateAdmission1228Gate({
    rowOverrides: {
      [sourceCurrentnessLedgerSurface]: {
        callerShapedEvidence: true,
        evidenceKind: "test-title",
        testTitleEvidence: true,
        sourceSyntaxOnly: true
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_1228_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.privateSurfaceRecognized, false);
  assertViolationIds(gate, [
    "native-metadata-no-load-non-source-evidence-detected",
    "native-metadata-no-load-required-row-not-recognized"
  ]);
  assert.equal(
    gate.rowsBySurface[sourceCurrentnessLedgerSurface].sourceEvidenceRecognized,
    false
  );
});

test("private admission 1228 rejects native, worker, cleanup, renderer, package, and public claims", () => {
  const gate = evaluatePrivateAdmission1228Gate({
    compatibilityClaimed: true,
    rowOverrides: {
      [noLoadMetadataGuardSurface]: {
        publicBlockers: {
          nativeAddonLoaded: true,
          nativeAddonLoadAttempted: true,
          nativeExecution: true,
          publicNativeExecution: true,
          nodeWorkerThreadsExecution: true,
          workerThreadCreationAttempted: true,
          childProcessExecution: true,
          httpExecution: true,
          httpsExecution: true,
          napiCleanupHookExecution: true,
          cleanupHookPublicExecutionClaimed: true,
          rendererExecution: true,
          reconcilerExecution: true,
          publicNativeCompatibility: true,
          publicRootExecution: true,
          publicRootCompatibilitySurface: true,
          packageCompatibilityClaimed: true,
          packageExportCompatibilityClaimed: true,
          nativePrivateSubpathsExported: true,
          compatibilityClaimed: true
        }
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_1228_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.blockedPublicClaimsRecognized, false);
  assert.equal(gate.compatibilityClaimed, true);
  assertViolationIds(gate, [
    "native-metadata-no-load-native-runtime-claim-detected",
    "native-metadata-no-load-worker-child-network-claim-detected",
    "native-metadata-no-load-cleanup-hook-claim-detected",
    "native-metadata-no-load-renderer-reconciler-claim-detected",
    "native-metadata-no-load-public-native-compatibility-claim-detected",
    "native-metadata-no-load-package-export-claim-detected",
    "native-metadata-no-load-top-level-compatibility-claim-detected",
    "native-metadata-no-load-required-row-not-recognized"
  ]);
  assert.deepEqual(gate.nativeRuntimeClaimIds, [
    `${noLoadMetadataGuardSurface}.nativeAddonLoaded`,
    `${noLoadMetadataGuardSurface}.nativeAddonLoadAttempted`,
    `${noLoadMetadataGuardSurface}.nativeExecution`,
    `${noLoadMetadataGuardSurface}.publicNativeExecution`
  ]);
  assert.deepEqual(gate.workerChildNetworkClaimIds, [
    `${noLoadMetadataGuardSurface}.nodeWorkerThreadsExecution`,
    `${noLoadMetadataGuardSurface}.workerThreadCreationAttempted`,
    `${noLoadMetadataGuardSurface}.childProcessExecution`,
    `${noLoadMetadataGuardSurface}.httpExecution`,
    `${noLoadMetadataGuardSurface}.httpsExecution`
  ]);
  assert.deepEqual(gate.cleanupHookClaimIds, [
    `${noLoadMetadataGuardSurface}.napiCleanupHookExecution`,
    `${noLoadMetadataGuardSurface}.cleanupHookPublicExecutionClaimed`
  ]);
  assert.deepEqual(gate.rendererReconcilerClaimIds, [
    `${noLoadMetadataGuardSurface}.rendererExecution`,
    `${noLoadMetadataGuardSurface}.reconcilerExecution`
  ]);
  assert.deepEqual(gate.publicNativeCompatibilityClaimIds, [
    `${noLoadMetadataGuardSurface}.publicNativeCompatibility`,
    `${noLoadMetadataGuardSurface}.publicRootExecution`,
    `${noLoadMetadataGuardSurface}.publicRootCompatibilitySurface`,
    `${noLoadMetadataGuardSurface}.compatibilityClaimed`
  ]);
  assert.deepEqual(gate.packageExportClaimIds, [
    `${noLoadMetadataGuardSurface}.packageCompatibilityClaimed`,
    `${noLoadMetadataGuardSurface}.packageExportCompatibilityClaimed`,
    `${noLoadMetadataGuardSurface}.nativePrivateSubpathsExported`
  ]);
});

test("private admission 1228 rejects private surface and no-load evidence drift", () => {
  const gate = evaluatePrivateAdmission1228Gate({
    rowOverrides: {
      [noLoadMetadataGuardSurface]: {
        privateSurfaceIds: PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS[
          noLoadMetadataGuardSurface
        ].filter((surfaceId) => surfaceId !== "worker-thread-load-blocked"),
        evidence: withMissingEvidenceToken(
          rowBySurface(noLoadMetadataGuardSurface),
          "worker-1228-native-no-load-guard-source",
          "missing-no-load-forbidden-module-guard"
        )
      }
    }
  });

  assert.equal(gate.status, PRIVATE_ADMISSION_1228_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.equal(gate.evidenceRecognized, false);
  assert.equal(gate.privateSurfaceRecognized, false);
  assertViolationIds(gate, [
    "native-metadata-no-load-evidence-token-missing",
    "native-metadata-no-load-private-surface-id-mismatch",
    "native-metadata-no-load-required-row-not-recognized"
  ]);
});

function assertRecognizedRow(row, expected) {
  assert.equal(row.privateAdmission, expected.privateAdmission);
  assert.deepEqual(row.implementationPaths, expected.implementationPaths);
  assert.deepEqual(
    row.evidence.map((evidenceRow) => evidenceRow.role),
    expected.evidenceRoles
  );
  assert.equal(row.sourceIdentifierSetRecognized, true);
  assert.equal(row.sourceIdentifiersPresent, true);
  assert.equal(row.evidenceRecognized, true);
  assert.equal(row.privateSurfaceIdsRecognized, true);
  assert.equal(row.publicBlockerClaimKeysRecognized, true);
  assert.equal(row.sourceEvidenceRecognized, true);
  assert.equal(row.staticReadOnlyRecognized, true);
  assert.equal(row.recognized, true);
  assert.deepEqual(row.missingSourceIdentifiers, []);
  assert.deepEqual(row.sourceReadErrors, []);
  assertAllFalse(row.publicBlockers, row.surfaceId);
}

function rowBySurface(surfaceId) {
  const row = PRIVATE_ADMISSION_1228_ROWS.find(
    (candidate) => candidate.surfaceId === surfaceId
  );
  assert.notEqual(row, undefined);
  return row;
}

function withMissingEvidenceToken(row, role, token) {
  return row.evidence.map((evidenceRow) =>
    evidenceRow.role === role
      ? {
          ...evidenceRow,
          tokens: [...evidenceRow.tokens, token]
        }
      : evidenceRow
  );
}

function assertSubset(expectedSubset, actual) {
  for (const value of expectedSubset) {
    assert.ok(actual.includes(value), value);
  }
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, false, `${label}.${key}`);
  }
}

function assertViolationIds(gate, expectedIds) {
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    expectedIds
  );
}
