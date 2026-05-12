import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_1228_GATE_ID =
  "private-admission-1228-native-metadata-no-load-source-ledger-1";
export const PRIVATE_ADMISSION_1228_GATE_STATUS =
  "recognized-current-native-metadata-source-ledger-no-load-private-surface";
export const PRIVATE_ADMISSION_1228_VIOLATION_STATUS =
  "blocked-current-native-metadata-source-ledger-no-load-private-surface";

const sourceCurrentnessLedgerSurface =
  "worker-1228-native-metadata-source-currentness-ledger";
const rustMetadataSourceSurface =
  "worker-1228-native-rust-metadata-source-identifiers";
const noLoadMetadataGuardSurface =
  "worker-1228-native-metadata-no-load-guard";

export const PRIVATE_ADMISSION_1228_CONTEXT_WORKERS = freezeArray([
  "worker-1110-native-placeholder-metadata-factory",
  "worker-1116-native-no-load-guard-ledger-fix",
  "worker-1126-private-native-metadata-factory-contract",
  "worker-1130-crate-private-napi-metadata-shape",
  "worker-1133-napi-diagnostic-backed-metadata",
  "worker-1156-native-react-dom-render-handoff-admission"
]);

export const PRIVATE_ADMISSION_1228_SURFACES = freezeArray([
  sourceCurrentnessLedgerSurface,
  rustMetadataSourceSurface,
  noLoadMetadataGuardSurface
]);

export const PRIVATE_ADMISSION_1228_BLOCKED_CLAIMS = freezeArray([
  "nativeAddonLoaded",
  "nativeAddonLoadAttempted",
  "nativeExecution",
  "publicNativeExecution",
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
  "packageCompatibilityClaimed",
  "packageExportCompatibility",
  "packageExportCompatibilityClaimed",
  "nativePrivateSubpathsExported",
  "compatibilityClaimed"
]);

const nativeIndexPath = "bindings/node/index.cjs";
const nativeEsmPath = "bindings/node/index.mjs";
const nativePackageJsonPath = "bindings/node/package.json";
const nativeNoLoadGuardTestPath =
  "bindings/node/test/native-no-load-guard.test.cjs";
const nativeMetadataFactoryTestPath =
  "bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs";
const nativeRenderHandoffTestPath =
  "bindings/node/test/native-react-dom-render-handoff-admission.test.cjs";
const rootWorkLoopMetadataRustPath =
  "crates/fast-react-napi/src/root_work_loop_metadata.rs";
const napiLibRustPath = "crates/fast-react-napi/src/lib.rs";

export const PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS =
  freezeRecord({
    [sourceCurrentnessLedgerSurface]: freezeArray([
      "private-factory-owned-ledger-symbol",
      "non-global-private-ledger-symbol",
      "non-enumerable-ledger-validator",
      "source-owned-rust-identifier-set",
      "js-factory-shape-currentness",
      "native-worker-network-renderer-package-claims-rejected"
    ]),
    [rustMetadataSourceSurface]: freezeArray([
      "crate-private-root-work-loop-metadata-module",
      "crate-private-metadata-value-shape",
      "diagnostic-backed-private-bridge-builder",
      "public-compatibility-claims-rejected",
      "exact-json-field-admission"
    ]),
    [noLoadMetadataGuardSurface]: freezeArray([
      "node-addon-extension-load-blocked",
      "optional-native-package-load-blocked",
      "worker-thread-load-blocked",
      "child-process-load-blocked",
      "http-and-https-load-blocked",
      "module-guards-restored",
      "metadata-factory-remains-symbol-private",
      "native-package-exports-public-only"
    ])
  });

export const PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS =
  freezeRecord({
    [sourceCurrentnessLedgerSurface]: freezeArray([
      "nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedgerSymbol",
      "'fast.react_native.private_root_work_loop_finished_work_metadata_source_currentness_ledger'",
      "static-source-token-ledger-no-native-load-no-package-export",
      "source-owned-rust-identifier-set-and-js-factory-shape",
      "validateNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRows",
      "validateSourceCurrentnessRows",
      "createNativeRootWorkLoopFinishedWorkMetadataForCanary,",
      "'publicRootExecution'",
      "'publicRootCompatibilitySurface'",
      "'packageExportCompatibilityClaimed'",
      "'nativePrivateSubpathsExported'",
      "enumerable: false",
      "configurable: false",
      "writable: false",
      "row.nativeAddonLoadAttempted === true",
      "row.workerThreadCreationAttempted === true",
      "row.napiCleanupHookExecution === true",
      "row.cleanupHookPublicExecutionClaimed === true",
      "nodeWorkerThreadsExecution: false",
      "childProcessExecution: false",
      "httpExecution: false",
      "httpsExecution: false",
      "packageExportCompatibility: false"
    ]),
    [rustMetadataSourceSurface]: freezeArray([
      "mod root_work_loop_metadata;",
      "pub(crate) struct RootWorkLoopFinishedWorkMetadata",
      "pub(crate) struct RootWorkLoopFinishedWorkDiagnosticEvidence",
      "pub(crate) fn native_root_work_loop_minimal_placement_diagnostic_for_private_bridge()",
      "pub(crate) fn root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary",
      "pub(crate) fn root_work_loop_finished_work_metadata_from_diagnostic_evidence_for_canary",
      "RootWorkLoopFinishedWorkDiagnosticEvidence::from_private_reconciler_diagnostic",
      "fn validate_diagnostic_evidence(",
      "fn reject_public_claim(",
      "RootWorkLoopFinishedWorkMetadataError::DiagnosticPublicCompatibilityClaim"
    ]),
    [noLoadMetadataGuardSurface]: freezeArray([
      "function isForbiddenLoad(request)",
      "specifier.endsWith('.node')",
      "specifier.startsWith('@fast-react/native-')",
      "specifier === 'child_process'",
      "specifier === 'node:child_process'",
      "specifier === 'worker_threads'",
      "specifier === 'node:worker_threads'",
      "specifier === 'http'",
      "specifier === 'node:http'",
      "specifier === 'https'",
      "specifier === 'node:https'",
      "Module._extensions['.node'] = function blockedNodeExtension",
      "moduleLoadHooks = Module.registerHooks({",
      "assertNativeRootWorkLoopFinishedWorkMetadataFactoryNoLoad(native)",
      "assert.deepEqual(\n    forbiddenLoads,\n    []",
      "platform packages, child_process, worker_threads, or network modules"
    ])
  });

const privateAdmission1228Rows = freezeArray([
  rowData({
    surfaceId: sourceCurrentnessLedgerSurface,
    privateAdmission:
      "accepted-private-native-metadata-source-currentness-ledger",
    implementationPaths: freezeArray([nativeIndexPath]),
    sourceIdentifiers:
      PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS[
        sourceCurrentnessLedgerSurface
      ],
    privateSurfaceIds:
      PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS[
        sourceCurrentnessLedgerSurface
      ],
    evidence: [
      evidenceData({
        role: "worker-1228-product-ledger-source-identifiers",
        path: nativeIndexPath,
        tokens: [
          "const nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger =",
          "createNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger(",
          "nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessCanonicalRows",
          "function validateNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRow(",
          "row?.testTitleEvidence === true",
          "row?.errorMessageEvidence === true",
          "row.nativeAddonLoaded === true",
          "row.nativeAddonLoadAttempted === true",
          "row.nodeWorkerThreadsExecution === true",
          "row.workerThreadCreationAttempted === true",
          "row.childProcessExecution === true",
          "row.httpExecution === true",
          "row.httpsExecution === true",
          "row.napiCleanupHookExecution === true",
          "row.cleanupHookPublicExecutionClaimed === true",
          "row.rendererExecution === true",
          "row.reconcilerExecution === true",
          "'publicRootExecution'",
          "'publicRootCompatibilitySurface'",
          "'packageExportCompatibilityClaimed'",
          "'nativePrivateSubpathsExported'",
          "Object.defineProperty(",
          "validateSourceCurrentnessRows"
        ]
      }),
      evidenceData({
        role: "worker-1228-product-ledger-direct-test",
        path: nativeMetadataFactoryTestPath,
        tokens: [
          "function getSourceCurrentnessLedger(factory)",
          "fs.readFileSync(rustMetadataSourcePath, 'utf8')",
          "rustSource.includes(rustIdentifier)",
          "root-work-loop-metadata-test-title-evidence",
          "root-work-loop-metadata-error-message-evidence",
          "root-work-loop-metadata-worker-network-claim",
          "root-work-loop-metadata-renderer-reconciler-claim",
          "root-work-loop-metadata-package-export-claim",
          "assertPrivateSourceCurrentnessLedger(descriptor.value, metadata)"
        ]
      })
    ]
  }),
  rowData({
    surfaceId: rustMetadataSourceSurface,
    privateAdmission:
      "accepted-private-crate-native-root-work-loop-metadata-source",
    implementationPaths: freezeArray([
      rootWorkLoopMetadataRustPath,
      napiLibRustPath
    ]),
    sourceIdentifiers:
      PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS[
        rustMetadataSourceSurface
      ],
    privateSurfaceIds:
      PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS[
        rustMetadataSourceSurface
      ],
    evidence: [
      evidenceData({
        role: "worker-1228-rust-metadata-private-source",
        path: rootWorkLoopMetadataRustPath,
        tokens: [
          "ROOT_WORK_LOOP_FINISHED_WORK_METADATA_JSON_FIELDS",
          "ROOT_WORK_LOOP_FINISHED_WORK_METADATA_COMMIT_JSON_FIELDS",
          "root_work_loop_finished_work_metadata_from_json_value_for_private_bridge",
          "root_work_loop_finished_work_metadata_from_accepted_values",
          "validate_diagnostic_evidence(evidence)?;",
          "reject_public_claim(",
          "public_renderer_package_behavior_exposed",
          "react_dom_compatibility_claimed",
          "test_renderer_compatibility_claimed"
        ],
        forbiddenTokens: [
          "#[napi]",
          "pub struct RootWorkLoopFinishedWorkMetadata",
          "pub fn root_work_loop_finished_work_metadata_from_private_reconciler_diagnostic_for_canary"
        ]
      }),
      evidenceData({
        role: "worker-1228-rust-module-remains-crate-private",
        path: napiLibRustPath,
        tokens: [
          "mod root_work_loop_metadata;",
          "pub(crate) fn native_root_work_loop_minimal_placement_diagnostic_for_private_bridge()",
          "describe_minimal_host_root_render_complete_placement_for_private_bridge"
        ],
        forbiddenTokens: ["pub mod root_work_loop_metadata"]
      })
    ]
  }),
  rowData({
    surfaceId: noLoadMetadataGuardSurface,
    privateAdmission:
      "accepted-private-native-metadata-no-load-source-guard",
    implementationPaths: freezeArray([
      nativeNoLoadGuardTestPath,
      nativeMetadataFactoryTestPath,
      nativeRenderHandoffTestPath,
      nativePackageJsonPath,
      nativeEsmPath
    ]),
    sourceIdentifiers:
      PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS[
        noLoadMetadataGuardSurface
      ],
    privateSurfaceIds:
      PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS[
        noLoadMetadataGuardSurface
      ],
    evidence: [
      evidenceData({
        role: "worker-1228-native-no-load-guard-source",
        path: nativeNoLoadGuardTestPath,
        tokens: [
          "function isForbiddenLoad(request)",
          "specifier.endsWith('.node')",
          "specifier.startsWith('@fast-react/native-')",
          "specifier === 'child_process'",
          "specifier === 'node:child_process'",
          "specifier === 'worker_threads'",
          "specifier === 'node:worker_threads'",
          "specifier === 'http'",
          "specifier === 'node:http'",
          "specifier === 'https'",
          "specifier === 'node:https'",
          "assertNativeRootWorkLoopFinishedWorkMetadataFactoryNoLoad(native)",
          "Object.keys(native).includes(",
          "createNativeRootWorkLoopFinishedWorkMetadataForCanary",
          "assert.deepEqual(\n    forbiddenLoads,\n    []",
          "assertModuleGuardsRestored();"
        ],
        forbiddenTokens: ["new Worker(", "parentPort", "workerData"]
      }),
      evidenceData({
        role: "worker-1228-native-package-surface-remains-public-only",
        path: nativePackageJsonPath,
        tokens: [
          "\"name\": \"@fast-react/native\"",
          "\"main\": \"./index.cjs\"",
          "\"exports\": {",
          "\".\": {",
          "\"./package.json\": \"./package.json\""
        ],
        forbiddenTokens: [
          "\"./src\"",
          "\"./root-work-loop-metadata\"",
          "\"./native-root-work-loop\"",
          ".node"
        ]
      }),
      evidenceData({
        role: "worker-1228-native-esm-private-symbols-not-named",
        path: nativeEsmPath,
        tokens: ["export const {", "export default cjsBinding;"],
        forbiddenTokens: [
          "createNativeRootWorkLoopFinishedWorkMetadataForCanary",
          "admitNativeReactDomRenderHandoffForCanary",
          "nativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessLedgerSymbol"
        ]
      }),
      evidenceData({
        role: "worker-1228-react-dom-handoff-load-guard",
        path: nativeRenderHandoffTestPath,
        tokens: [
          "Module._load = function guardedNativeReactDomAdmissionLoad",
          "specifier.endsWith('.node')",
          "specifier.startsWith('@fast-react/native-')",
          "assert.deepEqual(forbiddenLoads, []);"
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_1228_ROWS = freezeArray(
  privateAdmission1228Rows.map((sourceRow) =>
    row({
      ...sourceRow,
      publicBlockers: falseRecord(PRIVATE_ADMISSION_1228_BLOCKED_CLAIMS)
    })
  )
);

export function evaluatePrivateAdmission1228Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  compatibilityClaimed = false
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_1228_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.surfaceId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const actualSurfaceIds = rows.map((baseRow) => baseRow.surfaceId);
  const missingSurfaceIds = PRIVATE_ADMISSION_1228_SURFACES.filter(
    (surfaceId) => !actualSurfaceIds.includes(surfaceId)
  );
  const unexpectedSurfaceIds = actualSurfaceIds.filter(
    (surfaceId) => !PRIVATE_ADMISSION_1228_SURFACES.includes(surfaceId)
  );
  const duplicateSurfaceIds = actualSurfaceIds.filter(
    (surfaceId, index) => actualSurfaceIds.indexOf(surfaceId) !== index
  );
  const sourceIdentifierSetMismatches = evaluatedRows.flatMap((row) =>
    createExpectedSetMismatch({
      surfaceId: row.surfaceId,
      expected:
        PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS[row.surfaceId] ?? [],
      actual: row.sourceIdentifiers,
      expectedKey: "expectedSourceIdentifiers",
      actualKey: "actualSourceIdentifiers"
    })
  );
  const missingSourceIdentifierRows = evaluatedRows
    .filter((row) => row.missingSourceIdentifiers.length > 0)
    .map((row) =>
      freezeRecord({
        surfaceId: row.surfaceId,
        missingSourceIdentifiers: row.missingSourceIdentifiers,
        readErrors: row.sourceReadErrors
      })
    );
  const evidenceTokenMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.recognized !== true)
      .map((evidenceRow) =>
        freezeRecord({
          surfaceId: row.surfaceId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError,
          sliceError: evidenceRow.sliceError
        })
      )
  );
  const privateSurfaceIdMismatches = evaluatedRows.flatMap((row) =>
    createExpectedSetMismatch({
      surfaceId: row.surfaceId,
      expected:
        PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS[row.surfaceId] ??
        [],
      actual: row.privateSurfaceIds,
      expectedKey: "expectedPrivateSurfaceIds",
      actualKey: "actualPrivateSurfaceIds"
    })
  );
  const publicBlockerClaimKeyMismatches = evaluatedRows.flatMap((row) =>
    createExpectedSetMismatch({
      surfaceId: row.surfaceId,
      expected: PRIVATE_ADMISSION_1228_BLOCKED_CLAIMS,
      actual: Object.keys(row.publicBlockers),
      expectedKey: "expectedPublicBlockerClaims",
      actualKey: "actualPublicBlockerClaims"
    })
  );
  const publicBlockerClaimViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockers)
      .filter(([, value]) => value !== false)
      .map(([claimId]) => `${row.surfaceId}.${claimId}`)
  );
  const nonSourceEvidenceViolations = evaluatedRows
    .filter((row) => row.sourceEvidenceRecognized !== true)
    .map((row) => row.surfaceId);
  const staticLedgerViolations = evaluatedRows
    .filter((row) => row.staticReadOnlyRecognized !== true)
    .map((row) => row.surfaceId);
  const topLevelCompatibilityViolations =
    compatibilityClaimed === false ? [] : ["gate.compatibilityClaimed"];
  const unrecognizedSurfaceIds = evaluatedRows
    .filter((row) => row.recognized !== true)
    .map((row) => row.surfaceId);

  const nativeRuntimeClaimIds = publicBlockerClaimViolations.filter((claimId) =>
    /\.(?:nativeAddonLoaded|nativeAddonLoadAttempted|nativeExecution|publicNativeExecution)$/.test(
      claimId
    )
  );
  const workerChildNetworkClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /\.(?:nodeWorkerThreadsExecution|workerThreadCreationAttempted|childProcessExecution|httpExecution|httpsExecution)$/.test(
        claimId
      )
  );
  const cleanupHookClaimIds = publicBlockerClaimViolations.filter((claimId) =>
    /\.(?:napiCleanupHookExecution|cleanupHookPublicExecutionClaimed)$/.test(
      claimId
    )
  );
  const rendererReconcilerClaimIds = publicBlockerClaimViolations.filter(
    (claimId) => /\.(?:rendererExecution|reconcilerExecution)$/.test(claimId)
  );
  const publicNativeCompatibilityClaimIds =
    publicBlockerClaimViolations.filter((claimId) =>
      /\.(?:publicNativeCompatibility|publicRootExecution|publicRootCompatibilitySurface|compatibilityClaimed)$/.test(
        claimId
      )
    );
  const packageExportClaimIds = publicBlockerClaimViolations.filter((claimId) =>
    /\.(?:packageCompatibilityClaimed|packageExportCompatibility|packageExportCompatibilityClaimed|nativePrivateSubpathsExported)$/.test(
      claimId
    )
  );

  const violations = [];
  if (
    missingSurfaceIds.length > 0 ||
    unexpectedSurfaceIds.length > 0 ||
    duplicateSurfaceIds.length > 0
  ) {
    violations.push(
      createViolation("native-metadata-no-load-surface-manifest-mismatch", {
        missingSurfaceIds,
        unexpectedSurfaceIds,
        duplicateSurfaceIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "native-metadata-no-load-source-identifier-set-mismatch",
    sourceIdentifierSetMismatches
  );
  pushRowsViolation(
    violations,
    "native-metadata-no-load-source-identifier-missing",
    missingSourceIdentifierRows
  );
  pushRowsViolation(
    violations,
    "native-metadata-no-load-evidence-token-missing",
    evidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "native-metadata-no-load-private-surface-id-mismatch",
    privateSurfaceIdMismatches
  );
  pushRowsViolation(
    violations,
    "native-metadata-no-load-non-source-evidence-detected",
    nonSourceEvidenceViolations
  );
  pushRowsViolation(
    violations,
    "native-metadata-no-load-static-ledger-mode-mismatch",
    staticLedgerViolations
  );
  pushRowsViolation(
    violations,
    "native-metadata-no-load-public-blocker-claim-key-mismatch",
    publicBlockerClaimKeyMismatches
  );
  pushClaimIdsViolation(
    violations,
    "native-metadata-no-load-native-runtime-claim-detected",
    nativeRuntimeClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-metadata-no-load-worker-child-network-claim-detected",
    workerChildNetworkClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-metadata-no-load-cleanup-hook-claim-detected",
    cleanupHookClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-metadata-no-load-renderer-reconciler-claim-detected",
    rendererReconcilerClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-metadata-no-load-public-native-compatibility-claim-detected",
    publicNativeCompatibilityClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-metadata-no-load-package-export-claim-detected",
    packageExportClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-metadata-no-load-top-level-compatibility-claim-detected",
    topLevelCompatibilityViolations
  );
  pushRowsViolation(
    violations,
    "native-metadata-no-load-required-row-not-recognized",
    unrecognizedSurfaceIds
  );

  const manifestRecognized =
    missingSurfaceIds.length === 0 &&
    unexpectedSurfaceIds.length === 0 &&
    duplicateSurfaceIds.length === 0;
  const sourceIdentifiersRecognized =
    sourceIdentifierSetMismatches.length === 0 &&
    missingSourceIdentifierRows.length === 0;
  const evidenceRecognized = evidenceTokenMismatches.length === 0;
  const privateSurfaceRecognized =
    privateSurfaceIdMismatches.length === 0 &&
    nonSourceEvidenceViolations.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerClaimKeyMismatches.length === 0 &&
    publicBlockerClaimViolations.length === 0;
  const staticReadOnlyRecognized =
    staticLedgerViolations.length === 0 &&
    topLevelCompatibilityViolations.length === 0;
  const privateDiagnosticsRecognized =
    manifestRecognized &&
    sourceIdentifiersRecognized &&
    evidenceRecognized &&
    privateSurfaceRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized &&
    unrecognizedSurfaceIds.length === 0;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_1228_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_1228_GATE_STATUS
        : PRIVATE_ADMISSION_1228_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    manifestRecognized,
    sourceIdentifiersRecognized,
    evidenceRecognized,
    privateSurfaceRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed:
      compatibilityClaimed !== false || publicBlockerClaimViolations.length > 0,
    contextWorkers: PRIVATE_ADMISSION_1228_CONTEXT_WORKERS,
    queueSurfaces: PRIVATE_ADMISSION_1228_SURFACES,
    recognizedSurfaceIds: freezeArray(
      evaluatedRows
        .filter((row) => row.recognized === true)
        .map((row) => row.surfaceId)
    ),
    nativeRuntimeClaimIds: freezeArray(nativeRuntimeClaimIds),
    workerChildNetworkClaimIds: freezeArray(workerChildNetworkClaimIds),
    cleanupHookClaimIds: freezeArray(cleanupHookClaimIds),
    rendererReconcilerClaimIds: freezeArray(rendererReconcilerClaimIds),
    publicNativeCompatibilityClaimIds: freezeArray(
      publicNativeCompatibilityClaimIds
    ),
    packageExportClaimIds: freezeArray(packageExportClaimIds),
    publicBlockerClaimViolationIds: freezeArray(publicBlockerClaimViolations),
    topLevelCompatibilityViolationIds: freezeArray(
      topLevelCompatibilityViolations
    ),
    manifest: freezeRecord({
      expectedSurfaceIds: PRIVATE_ADMISSION_1228_SURFACES,
      actualSurfaceIds: freezeArray(actualSurfaceIds),
      missingSurfaceIds: freezeArray(missingSurfaceIds),
      unexpectedSurfaceIds: freezeArray(unexpectedSurfaceIds),
      duplicateSurfaceIds: freezeArray(duplicateSurfaceIds)
    }),
    rows: freezeArray(evaluatedRows),
    rowsBySurface: freezeRecord(
      Object.fromEntries(evaluatedRows.map((row) => [row.surfaceId, row]))
    ),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    implementationPaths: freezeArray(data.implementationPaths),
    sourceIdentifiers: freezeArray(data.sourceIdentifiers),
    privateSurfaceIds: freezeArray(data.privateSurfaceIds),
    evidence: freezeEvidenceRows(data.evidence)
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

function row(data) {
  return freezeRecord({
    ...data,
    sourceQueue: "1228",
    localGateCoverage: PRIVATE_ADMISSION_1228_GATE_ID,
    privateEvidenceOnly: true,
    sourceIdentifierChecksOnly: true,
    manifestEvaluationOnly: true,
    staticReadOnlyLedger: true,
    sourceEvidenceOnly: true,
    runtimeExecutionClaimed: false,
    publicRuntimeExecutionClaimed: false,
    nativeLoadAttempted: false,
    nativeAddonLoadAttempted: false,
    workerThreadLoadAttempted: false,
    childProcessLoadAttempted: false,
    httpLoadAttempted: false,
    httpsLoadAttempted: false,
    cleanupHookExecutionClaimed: false,
    rendererExecutionClaimed: false,
    reconcilerExecutionClaimed: false,
    packageExportsChanged: false,
    compatibilityClaimed: false,
    callerShapedEvidence: false,
    proseEvidence: false,
    testTitleEvidence: false,
    errorMessageEvidence: false,
    sourceSyntaxOnly: false,
    evidenceKind: "implementation-source-identifier-set",
    ledgerEvaluationMode:
      "source-identifiers-and-no-load-guard-no-native-load",
    publicBlockers: freezeRecord(data.publicBlockers)
  });
}

function mergeRowOverride(baseRow, override) {
  const merged = { ...baseRow, ...override };
  for (const key of [
    "implementationPaths",
    "sourceIdentifiers",
    "privateSurfaceIds",
    "evidence"
  ]) {
    if (Object.hasOwn(override, key)) {
      merged[key] =
        key === "evidence" ? freezeEvidenceRows(override[key]) : freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "publicBlockers")) {
    merged.publicBlockers = freezeRecord({
      ...baseRow.publicBlockers,
      ...override.publicBlockers
    });
  }
  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const sourceIdentifierEvaluation = evaluateSourceIdentifiers({
    fileCache,
    row,
    workspaceRoot
  });
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );
  const sourceIdentifierSetRecognized = sameStringSet(
    PRIVATE_ADMISSION_1228_REQUIRED_SOURCE_IDENTIFIERS[row.surfaceId] ?? [],
    row.sourceIdentifiers
  );
  const sourceIdentifiersPresent =
    sourceIdentifierEvaluation.missingSourceIdentifiers.length === 0 &&
    sourceIdentifierEvaluation.sourceReadErrors.length === 0;
  const evidenceRecognized = evidence.every(
    (evidenceRow) => evidenceRow.recognized === true
  );
  const privateSurfaceIdsRecognized = sameStringSet(
    PRIVATE_ADMISSION_1228_REQUIRED_PRIVATE_SURFACE_IDS[row.surfaceId] ?? [],
    row.privateSurfaceIds
  );
  const publicBlockerClaimKeysRecognized = sameStringSet(
    PRIVATE_ADMISSION_1228_BLOCKED_CLAIMS,
    Object.keys(row.publicBlockers)
  );
  const publicBlockerClaimViolations = Object.entries(row.publicBlockers)
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);
  const sourceEvidenceRecognized =
    row.sourceEvidenceOnly === true &&
    row.evidenceKind === "implementation-source-identifier-set" &&
    row.callerShapedEvidence === false &&
    row.proseEvidence === false &&
    row.testTitleEvidence === false &&
    row.errorMessageEvidence === false &&
    row.sourceSyntaxOnly === false &&
    row.implementationPaths.length > 0 &&
    row.implementationPaths.every((path) => !path.startsWith("worker-progress/"));
  const staticReadOnlyRecognized =
    row.privateEvidenceOnly === true &&
    row.sourceIdentifierChecksOnly === true &&
    row.manifestEvaluationOnly === true &&
    row.staticReadOnlyLedger === true &&
    row.runtimeExecutionClaimed === false &&
    row.publicRuntimeExecutionClaimed === false &&
    row.nativeLoadAttempted === false &&
    row.nativeAddonLoadAttempted === false &&
    row.workerThreadLoadAttempted === false &&
    row.childProcessLoadAttempted === false &&
    row.httpLoadAttempted === false &&
    row.httpsLoadAttempted === false &&
    row.cleanupHookExecutionClaimed === false &&
    row.rendererExecutionClaimed === false &&
    row.reconcilerExecutionClaimed === false &&
    row.packageExportsChanged === false &&
    row.compatibilityClaimed === false &&
    row.ledgerEvaluationMode ===
      "source-identifiers-and-no-load-guard-no-native-load";

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    missingSourceIdentifiers:
      sourceIdentifierEvaluation.missingSourceIdentifiers,
    sourceReadErrors: sourceIdentifierEvaluation.sourceReadErrors,
    sourceIdentifierSetRecognized,
    sourceIdentifiersPresent,
    evidenceRecognized,
    privateSurfaceIdsRecognized,
    publicBlockerClaimKeysRecognized,
    publicBlockerClaimViolations: freezeArray(publicBlockerClaimViolations),
    sourceEvidenceRecognized,
    staticReadOnlyRecognized,
    recognized:
      sourceIdentifierSetRecognized === true &&
      sourceIdentifiersPresent === true &&
      evidenceRecognized === true &&
      privateSurfaceIdsRecognized === true &&
      publicBlockerClaimKeysRecognized === true &&
      publicBlockerClaimViolations.length === 0 &&
      sourceEvidenceRecognized === true &&
      staticReadOnlyRecognized === true
  });
}

function evaluateSourceIdentifiers({ fileCache, row, workspaceRoot }) {
  const sourceReadResults = row.implementationPaths.map((path) =>
    readEvidenceFile({ fileCache, path, workspaceRoot })
  );
  const sourceTexts = sourceReadResults
    .filter((readResult) => readResult.readError === null)
    .map((readResult) => readResult.text);
  const missingSourceIdentifiers = row.sourceIdentifiers.filter(
    (identifier) => !sourceTexts.some((text) => text.includes(identifier))
  );
  const sourceReadErrors = sourceReadResults
    .filter((readResult) => readResult.readError !== null)
    .map((readResult) => readResult.readError);

  return freezeRecord({
    missingSourceIdentifiers: freezeArray(missingSourceIdentifiers),
    sourceReadErrors: freezeArray(sourceReadErrors)
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

function createExpectedSetMismatch({
  surfaceId,
  expected,
  actual,
  expectedKey,
  actualKey
}) {
  if (sameStringSet(expected, actual)) {
    return [];
  }
  return [
    freezeRecord({
      surfaceId,
      [expectedKey]: freezeArray(expected),
      [actualKey]: freezeArray(actual)
    })
  ];
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(createViolation(id, { rows: freezeArray(rows) }));
  }
}

function pushClaimIdsViolation(violations, id, claimIds) {
  if (claimIds.length > 0) {
    violations.push(createViolation(id, { claimIds: freezeArray(claimIds) }));
  }
}

function createViolation(id, details = {}) {
  return freezeRecord({
    id,
    ...details
  });
}

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function sameStringSet(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

function freezeEvidenceRows(rows) {
  return freezeArray(
    rows.map((row) =>
      freezeRecord({
        ...row,
        tokens: freezeArray(row.tokens ?? []),
        forbiddenTokens: freezeArray(row.forbiddenTokens ?? [])
      })
    )
  );
}

function freezeArray(value) {
  return Object.freeze([...value]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
