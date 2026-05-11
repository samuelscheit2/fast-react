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

export const PRIVATE_ADMISSION_807_GATE_ID =
  "private-admission-807-native-no-load-ledger-1";
export const PRIVATE_ADMISSION_807_GATE_STATUS =
  "recognized-accepted-native-no-load-worker-thread-evidence-public-native-blocked";
export const PRIVATE_ADMISSION_807_VIOLATION_STATUS =
  "blocked-accepted-native-no-load-worker-thread-evidence-with-violations";

const worker788 = "worker-788-native-no-worker-threads-load-guard";
const worker801 = "worker-801-native-no-load-transitive-matrix";
const worker789 = "worker-789-native-private-subpath-blocklist-refresh";
const worker790 = "worker-790-native-cleanup-hook-identity-tamper-gate";

export const PRIVATE_ADMISSION_807_ACCEPTED_WORKERS = freezeArray([
  worker788,
  worker801
]);

export const PRIVATE_ADMISSION_807_CONTEXT_WORKERS = freezeArray([
  worker789,
  worker790
]);

export const PRIVATE_ADMISSION_807_WORKERS = freezeArray([
  ...PRIVATE_ADMISSION_807_ACCEPTED_WORKERS,
  ...PRIVATE_ADMISSION_807_CONTEXT_WORKERS
]);

export const PRIVATE_ADMISSION_807_BLOCKED_PUBLIC_CLAIMS = freezeArray([
  "nativeAddonLoadingAvailable",
  "nativeAddonLoaded",
  "nativeExecutionAvailable",
  "nativeExecution",
  "workerThreadCreationAvailable",
  "nodeWorkerThreadsExecution",
  "napiCleanupHookExecution",
  "rendererExecution",
  "reconcilerExecution",
  "publicNativeExecution",
  "publicNativeCompatibility",
  "packageCompatibilityClaimed",
  "packageExportCompatibilityClaimed",
  "nativePrivateSubpathsExported",
  "staleCleanupHookEvidenceAccepted",
  "staleCleanupHookIdentityAccepted",
  "cleanupHookPublicExecutionClaimed"
]);

export const PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS = freezeRecord({
  [worker788]: freezeArray([
    "native-no-load-cjs-worker-threads-specifier-blocked",
    "native-no-load-cjs-node-worker-threads-specifier-blocked",
    "native-no-load-esm-registerhooks-resolve-guard",
    "native-no-load-cjs-module-load-guard",
    "native-no-load-placeholder-imports-no-forbidden-loads"
  ]),
  [worker801]: freezeArray([
    "native-no-load-transitive-cjs-worker-threads",
    "native-no-load-transitive-cjs-node-worker-threads",
    "native-no-load-transitive-cjs-node-extension",
    "native-no-load-transitive-esm-worker-threads",
    "native-no-load-dynamic-esm-node-worker-threads",
    "native-no-load-dynamic-esm-node-extension",
    "native-no-load-module-guard-teardown"
  ]),
  [worker789]: freezeArray([
    "native-package-export-map-public-only",
    "native-private-subpaths-require-blocked",
    "native-private-subpaths-dynamic-import-blocked"
  ]),
  [worker790]: freezeArray([
    "cleanup-hook-stale-transport-evidence-rejected",
    "cleanup-hook-forged-peer-active-evidence-rejected",
    "cleanup-hook-identity-tamper-rejected",
    "cleanup-hook-execution-and-worker-threads-false"
  ])
});

export const PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT =
  freezeRecord({
    [worker788]: freezeArray([
      PRIVATE_ADMISSION_754_766_GATE_ID,
      PRIVATE_ADMISSION_754_766_GATE_STATUS,
      "worker-764-native-worker-thread-teardown-executable-preflight"
    ]),
    [worker801]: freezeArray([
      PRIVATE_ADMISSION_754_766_GATE_ID,
      PRIVATE_ADMISSION_754_766_GATE_STATUS,
      worker788
    ]),
    [worker789]: freezeArray([worker788, worker801]),
    [worker790]: freezeArray([
      "worker-771-native-cleanup-hook-preflight",
      "worker-784-native-cleanup-hook-js-mirror",
      worker801
    ])
  });

const nativeNoLoadGuardTestPath =
  "bindings/node/test/native-no-load-guard.test.cjs";
const nativeIndexPath = "bindings/node/index.cjs";
const nativePackageJsonPath = "bindings/node/package.json";
const importSmokePath = "tests/smoke/import-entrypoints.mjs";
const fastReactNapiSourcePath = "crates/fast-react-napi/src/lib.rs";

const privateAdmission807Rows = freezeArray([
  rowData({
    workerId: worker788,
    ledgerRole: "accepted-native-no-load-evidence",
    privateAdmission: "accepted-private-native-worker-thread-no-load-guard",
    primaryCompatibilityArea:
      "native-worker-thread-module-loading-public-native-execution-blocked",
    implementationPaths: freezeArray([nativeNoLoadGuardTestPath, nativeIndexPath]),
    guardIds: PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[worker788],
    priorLedgerContext:
      PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT[worker788],
    evidence: [
      evidenceData({
        role: "worker-788-direct-worker-thread-load-guard-test",
        path: nativeNoLoadGuardTestPath,
        tokens: [
          "function isForbiddenLoad(request)",
          "specifier === 'worker_threads'",
          "specifier === 'node:worker_threads'",
          "moduleLoadHooks = Module.registerHooks({",
          "blockForbiddenLoad('module-resolve', specifier);",
          "Module._extensions['.node'] = function blockedNodeExtension(module, filename)",
          "Module._load = function guardedModuleLoad",
          "blockForbiddenLoad('module-load', request);",
          "const native = require('../index.cjs');",
          "native.loadNativeBinding({",
          "assertModuleGuardsRestored();",
          "const forbiddenLoads = [];"
        ],
        forbiddenTokens: ["new Worker(", "parentPort", "workerData"]
      }),
      evidenceData({
        role: "worker-788-native-placeholder-public-blockers",
        path: nativeIndexPath,
        tokens: [
          "nativeRootBridgeTransportWorkerThreadTeardownGate",
          "nodeWorkerThreadsExecution: false",
          "nativeAddonLoaded: false",
          "nativeExecution: false",
          "rendererExecution: false",
          "reconcilerExecution: false",
          "publicNativeCompatibility: false",
          "reactBehaviorError: false"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker801,
    ledgerRole: "accepted-native-no-load-evidence",
    privateAdmission: "accepted-private-native-no-load-transitive-matrix",
    primaryCompatibilityArea:
      "native-transitive-worker-thread-and-node-addon-loading-blocked",
    implementationPaths: freezeArray([nativeNoLoadGuardTestPath]),
    guardIds: PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[worker801],
    priorLedgerContext:
      PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT[worker801],
    evidence: [
      evidenceData({
        role: "worker-801-transitive-fixture-matrix",
        path: nativeNoLoadGuardTestPath,
        tokens: [
          "function createForbiddenLoadFixtureMatrix()",
          "'cjs-worker-transitive.cjs'",
          "require('worker_threads');",
          "'cjs-node-worker-transitive.cjs'",
          "require('node:worker_threads');",
          "'native-addon-probe.node'",
          "import 'worker_threads';",
          "await import('node:worker_threads');",
          "await import('./native-addon-probe.node');",
          "function runForbiddenLoadFixtureMatrix()",
          "cjsWorkerEntry: path.join(tempDir, 'cjs-worker-entry.cjs')",
          "cjsNodeWorkerEntry: path.join(tempDir, 'cjs-node-worker-entry.cjs')",
          "cjsNativeAddonEntry: path.join(tempDir, 'cjs-native-addon-entry.cjs')",
          "esmWorkerEntry: pathToFileURL(",
          "esmDynamicNodeWorkerEntry: pathToFileURL(",
          "esmDynamicNativeAddonEntry: pathToFileURL(",
          "() => require(fixtures.cjsWorkerEntry)",
          "() => require(fixtures.cjsNodeWorkerEntry)",
          "() => require(fixtures.cjsNativeAddonEntry)",
          "() => import(fixtures.esmWorkerEntry)",
          "() => import(fixtures.esmDynamicNodeWorkerEntry)",
          "() => import(fixtures.esmDynamicNativeAddonEntry)",
          "{ kind: 'module-load', request: 'worker_threads' }",
          "{ kind: 'module-load', request: 'node:worker_threads' }",
          "{ kind: 'node-extension', request: fixtures.nativeAddonPath }",
          "{ kind: 'module-resolve', request: 'worker_threads' }",
          "{ kind: 'module-resolve', request: 'node:worker_threads' }",
          "{ kind: 'module-resolve', request: './native-addon-probe.node' }"
        ],
        forbiddenTokens: ["new Worker(", "parentPort", "workerData"]
      }),
      evidenceData({
        role: "worker-801-module-guard-teardown-test",
        path: nativeNoLoadGuardTestPath,
        tokens: [
          "const originalLoad = Module._load;",
          "const originalNodeExtension = Module._extensions['.node'];",
          "let moduleLoadHooks = null;",
          "function restoreModuleGuards()",
          "moduleGuardsRestored = true;",
          "Module._load = originalLoad;",
          "Module._extensions['.node'] = originalNodeExtension;",
          "moduleLoadHooks.deregister();",
          "moduleLoadHooks = null;",
          "function assertModuleGuardsRestored()",
          "Module._load,",
          "Module._extensions['.node'],",
          "moduleLoadHooks,"
        ]
      }),
      evidenceData({
        role: "worker-801-no-runtime-native-execution-test",
        path: nativeNoLoadGuardTestPath,
        tokens: [
          ".workerThreadTeardownExecutablePreflight",
          ".nodeWorkerThreadsExecution",
          ".napiCleanupHookExecution",
          ".nativeAddonLoaded",
          ".nativeExecution",
          ".rendererExecution",
          ".reconcilerExecution",
          ".publicNativeCompatibility",
          ".reactBehaviorError"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker789,
    ledgerRole: "context-native-package-surface-blocker",
    privateAdmission: "context-native-private-subpaths-remain-blocked",
    primaryCompatibilityArea:
      "native-private-subpath-package-export-compatibility-blocked",
    implementationPaths: freezeArray([importSmokePath, nativePackageJsonPath]),
    guardIds: PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[worker789],
    priorLedgerContext:
      PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT[worker789],
    evidence: [
      evidenceData({
        role: "worker-789-native-import-smoke-blocklist",
        path: importSmokePath,
        tokens: [
          "const expectedNativePackageExports = {",
          "const nativeBlockedDirectFiles = [",
          "'native-root-bridge-worker-thread-teardown.js'",
          "'private-root-bridge-worker-thread-cleanup-hook-preflight.js'",
          "'src/worker-thread-teardown-executable-preflight.js'",
          "const blockedNativeExtensionSubpaths = [",
          "...packageFileSubpaths('@fast-react/native', nativeBlockedDirectFiles)",
          "async function runNativePackageProbe(tempRoot)",
          "const blockedExtensionSubpaths = ${JSON.stringify(",
          "assert.deepEqual(nativePackageJson.exports, expectedNativePackageExports);",
          "assert.deepEqual(packageJson.exports, expectedPackageExports);",
          "for (const specifier of blockedExtensionSubpaths)",
          "require(specifier)",
          "import(specifier)"
        ]
      }),
      evidenceData({
        role: "worker-789-native-package-export-map",
        path: nativePackageJsonPath,
        tokens: [
          "\"name\": \"@fast-react/native\"",
          "\"main\": \"./index.cjs\"",
          "\"exports\": {",
          "\".\": {",
          "\"./package.json\": \"./package.json\""
        ],
        forbiddenTokens: [
          "\"./worker-thread-teardown\"",
          "\"./worker-thread-cleanup-hook-preflight\"",
          "\"./native-root-bridge\"",
          "\"./src\"",
          ".node"
        ]
      })
    ]
  }),
  rowData({
    workerId: worker790,
    ledgerRole: "context-native-cleanup-hook-blocker",
    privateAdmission: "context-native-cleanup-hook-stale-values-blocked",
    primaryCompatibilityArea:
      "native-cleanup-hook-stale-forged-and-tampered-evidence-blocked",
    implementationPaths: freezeArray([nativeIndexPath, fastReactNapiSourcePath]),
    guardIds: PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[worker790],
    priorLedgerContext:
      PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT[worker790],
    evidence: [
      evidenceData({
        role: "worker-790-cleanup-hook-js-mirror-blockers",
        path: nativeIndexPath,
        sliceStart:
          "const nativeRootBridgeWorkerThreadCleanupHookPreflight = Object.freeze({",
        sliceEnd: "const nativeRootBridgeRequestShape = Object.freeze({",
        tokens: [
          "canonicalExecutableEvidenceRequired: true",
          "canonicalExecutableEvidenceAccepted: true",
          "staleOrForgedCleanupEvidenceRejectionCount: 2",
          "cleanupHookIdentityPrivate: true",
          "id: 'cleanup-hook-stale-worker-transport-evidence-rejected'",
          "code: nativeRootBridgeWorkerThreadCleanupHookStaleEvidenceCode",
          "id: 'cleanup-hook-forged-peer-active-evidence-rejected'",
          "code: nativeRootBridgeWorkerThreadCleanupHookForgedEvidenceCode",
          "staleOrForgedCleanupEvidenceRejected: true",
          "nodeWorkerThreadsExecution: false",
          "napiCleanupHookExecution: false",
          "nativeAddonLoaded: false",
          "nativeExecution: false",
          "rendererExecution: false",
          "reconcilerExecution: false",
          "publicNativeCompatibility: false"
        ]
      }),
      evidenceData({
        role: "worker-790-cleanup-hook-rust-identity-tamper-test",
        path: fastReactNapiSourcePath,
        tokens: [
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_IDENTITY_MISMATCH_CODE",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_FUNCTION_IDENTITY_TOKEN",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_FUNCTION_IDENTITY_TOKEN",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_ROOT_ARGUMENT_IDENTITY_TOKEN",
          "NATIVE_ROOT_BRIDGE_WORKER_THREAD_CLEANUP_HOOK_VALUE_ARGUMENT_IDENTITY_TOKEN",
          "fn cleanup_hook_expected_identity_for_executable_preflight_row(",
          "if !expected_identity.matches_evidence(evidence)",
          "fn native_root_bridge_worker_thread_cleanup_hook_preflight_rejects_identity_tampering()",
          "struct CleanupHookIdentityTamperCase",
          "cleanup_hook_function_identity_token: &'static str",
          "cleanup_hook_argument_identity_token: &'static str",
          "NativeRootBridgeWorkerThreadCleanupHookPreflightRowStatus::Rejected",
          "tampered.code()",
          "assert!(!tampered.node_worker_threads_execution());",
          "assert!(!tampered.napi_cleanup_hook_execution());"
        ]
      })
    ]
  })
]);

export const PRIVATE_ADMISSION_807_ROWS = freezeArray(
  privateAdmission807Rows.map((sourceRow) =>
    row({
      ...sourceRow,
      publicBlockerClaims: falseRecord(
        PRIVATE_ADMISSION_807_BLOCKED_PUBLIC_CLAIMS
      )
    })
  )
);

export function evaluatePrivateAdmission807Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {},
  compatibilityClaimed = false
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_807_ROWS.map((baseRow) =>
    mergeRowOverride(baseRow, rowOverrides[baseRow.workerId] ?? {})
  );
  const evaluatedRows = rows.map((baseRow) =>
    evaluatePrivateAdmissionRow({ fileCache, row: baseRow, workspaceRoot })
  );
  const actualWorkerIds = rows.map((baseRow) => baseRow.workerId);
  const missingWorkerIds = PRIVATE_ADMISSION_807_WORKERS.filter(
    (workerId) => !actualWorkerIds.includes(workerId)
  );
  const unexpectedWorkerIds = actualWorkerIds.filter(
    (workerId) => !PRIVATE_ADMISSION_807_WORKERS.includes(workerId)
  );
  const duplicateWorkerIds = actualWorkerIds.filter(
    (workerId, index) => actualWorkerIds.indexOf(workerId) !== index
  );
  const acceptedRoleMismatches = evaluatedRows
    .filter(
      (row) =>
        PRIVATE_ADMISSION_807_ACCEPTED_WORKERS.includes(row.workerId) !==
        (row.ledgerRole === "accepted-native-no-load-evidence")
    )
    .map((row) => row.workerId);
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
  const guardMismatches = evaluatedRows.flatMap((row) =>
    createExpectedSetMismatch({
      workerId: row.workerId,
      expected: PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[row.workerId] ?? [],
      actual: row.guardIds,
      expectedKey: "expectedGuardIds",
      actualKey: "actualGuardIds"
    })
  );
  const priorLedgerContextMismatches = evaluatedRows.flatMap((row) =>
    createExpectedSetMismatch({
      workerId: row.workerId,
      expected:
        PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT[row.workerId] ?? [],
      actual: row.priorLedgerContext,
      expectedKey: "expectedPriorLedgerContext",
      actualKey: "actualPriorLedgerContext"
    })
  );
  const publicBlockerClaimKeyMismatches = evaluatedRows.flatMap((row) =>
    createExpectedSetMismatch({
      workerId: row.workerId,
      expected: PRIVATE_ADMISSION_807_BLOCKED_PUBLIC_CLAIMS,
      actual: Object.keys(row.publicBlockerClaims),
      expectedKey: "expectedPublicBlockerClaims",
      actualKey: "actualPublicBlockerClaims"
    })
  );
  const publicBlockerClaimViolations = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockerClaims)
      .filter(([, value]) => value !== false)
      .map(([claimId]) => `${row.workerId}.${claimId}`)
  );
  const staticLedgerViolations = evaluatedRows
    .filter((row) => row.staticReadOnlyRecognized !== true)
    .map((row) => row.workerId);
  const topLevelCompatibilityViolations =
    compatibilityClaimed === false ? [] : ["gate.compatibilityClaimed"];
  const unrecognizedWorkerIds = evaluatedRows
    .filter((row) => row.recognized !== true)
    .map((row) => row.workerId);

  const nativeRuntimeLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /\.(?:nativeAddonLoadingAvailable|nativeAddonLoaded|nativeExecutionAvailable|nativeExecution|workerThreadCreationAvailable|nodeWorkerThreadsExecution|napiCleanupHookExecution)$/.test(
        claimId
      )
  );
  const rendererReconcilerLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) => /\.(?:rendererExecution|reconcilerExecution)$/.test(claimId)
  );
  const publicNativeCompatibilityLeakClaimIds =
    publicBlockerClaimViolations.filter((claimId) =>
      /\.(?:publicNativeExecution|publicNativeCompatibility)$/.test(claimId)
    );
  const packageExportLeakClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /\.(?:packageCompatibilityClaimed|packageExportCompatibilityClaimed|nativePrivateSubpathsExported)$/.test(
        claimId
      )
  );
  const staleCleanupHookClaimIds = publicBlockerClaimViolations.filter(
    (claimId) =>
      /\.(?:staleCleanupHookEvidenceAccepted|staleCleanupHookIdentityAccepted|cleanupHookPublicExecutionClaimed)$/.test(
        claimId
      )
  );

  const violations = [];
  if (
    missingWorkerIds.length > 0 ||
    unexpectedWorkerIds.length > 0 ||
    duplicateWorkerIds.length > 0
  ) {
    violations.push(
      createViolation("native-no-load-worker-manifest-mismatch", {
        missingWorkerIds,
        unexpectedWorkerIds,
        duplicateWorkerIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "native-no-load-accepted-worker-role-mismatch",
    acceptedRoleMismatches
  );
  pushRowsViolation(
    violations,
    "native-no-load-evidence-token-missing",
    evidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "native-no-load-guard-id-mismatch",
    guardMismatches
  );
  pushRowsViolation(
    violations,
    "native-no-load-prior-ledger-context-mismatch",
    priorLedgerContextMismatches
  );
  pushRowsViolation(
    violations,
    "native-no-load-public-blocker-claim-key-mismatch",
    publicBlockerClaimKeyMismatches
  );
  pushClaimIdsViolation(
    violations,
    "native-no-load-native-runtime-claim-detected",
    nativeRuntimeLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-no-load-renderer-reconciler-claim-detected",
    rendererReconcilerLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-no-load-public-native-compatibility-claim-detected",
    publicNativeCompatibilityLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-no-load-package-export-compatibility-claim-detected",
    packageExportLeakClaimIds
  );
  pushClaimIdsViolation(
    violations,
    "native-no-load-stale-cleanup-hook-claim-detected",
    staleCleanupHookClaimIds
  );
  pushRowsViolation(
    violations,
    "native-no-load-static-ledger-mode-mismatch",
    staticLedgerViolations
  );
  pushClaimIdsViolation(
    violations,
    "native-no-load-top-level-compatibility-claim-detected",
    topLevelCompatibilityViolations
  );
  pushRowsViolation(
    violations,
    "native-no-load-required-row-not-recognized",
    unrecognizedWorkerIds
  );

  const evidenceRecognized = evidenceTokenMismatches.length === 0;
  const guardIdsRecognized = guardMismatches.length === 0;
  const priorLedgerContextRecognized =
    priorLedgerContextMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerClaimKeyMismatches.length === 0 &&
    publicBlockerClaimViolations.length === 0;
  const staticReadOnlyRecognized =
    staticLedgerViolations.length === 0 &&
    topLevelCompatibilityViolations.length === 0;
  const manifestRecognized =
    missingWorkerIds.length === 0 &&
    unexpectedWorkerIds.length === 0 &&
    duplicateWorkerIds.length === 0 &&
    acceptedRoleMismatches.length === 0;
  const privateDiagnosticsRecognized =
    manifestRecognized &&
    evidenceRecognized &&
    guardIdsRecognized &&
    priorLedgerContextRecognized &&
    blockedPublicClaimsRecognized &&
    staticReadOnlyRecognized &&
    unrecognizedWorkerIds.length === 0;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_807_GATE_ID,
    status:
      violations.length === 0
        ? PRIVATE_ADMISSION_807_GATE_STATUS
        : PRIVATE_ADMISSION_807_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    manifestRecognized,
    evidenceRecognized,
    guardIdsRecognized,
    priorLedgerContextRecognized,
    blockedPublicClaimsRecognized,
    staticReadOnlyRecognized,
    compatibilityClaimed:
      compatibilityClaimed !== false || publicBlockerClaimViolations.length > 0,
    queueWorkers: PRIVATE_ADMISSION_807_WORKERS,
    acceptedWorkers: PRIVATE_ADMISSION_807_ACCEPTED_WORKERS,
    contextWorkers: PRIVATE_ADMISSION_807_CONTEXT_WORKERS,
    recognizedWorkerIds: freezeArray(
      evaluatedRows
        .filter((row) => row.recognized === true)
        .map((row) => row.workerId)
    ),
    nativeRuntimeLeakClaimIds: freezeArray(nativeRuntimeLeakClaimIds),
    rendererReconcilerLeakClaimIds: freezeArray(
      rendererReconcilerLeakClaimIds
    ),
    publicNativeCompatibilityLeakClaimIds: freezeArray(
      publicNativeCompatibilityLeakClaimIds
    ),
    packageExportLeakClaimIds: freezeArray(packageExportLeakClaimIds),
    staleCleanupHookClaimIds: freezeArray(staleCleanupHookClaimIds),
    publicBlockerClaimViolationIds: freezeArray(publicBlockerClaimViolations),
    topLevelCompatibilityViolationIds: freezeArray(
      topLevelCompatibilityViolations
    ),
    manifest: freezeRecord({
      expectedWorkerIds: PRIVATE_ADMISSION_807_WORKERS,
      actualWorkerIds: freezeArray(actualWorkerIds),
      missingWorkerIds: freezeArray(missingWorkerIds),
      unexpectedWorkerIds: freezeArray(unexpectedWorkerIds),
      duplicateWorkerIds: freezeArray(duplicateWorkerIds),
      acceptedRoleMismatches: freezeArray(acceptedRoleMismatches)
    }),
    rows: freezeArray(evaluatedRows),
    rowsByWorker: freezeRecord(
      Object.fromEntries(evaluatedRows.map((row) => [row.workerId, row]))
    ),
    violations: freezeArray(violations)
  });
}

function rowData(data) {
  return freezeRecord({
    ...data,
    implementationPaths: freezeArray(data.implementationPaths),
    guardIds: freezeArray(data.guardIds),
    priorLedgerContext: freezeArray(data.priorLedgerContext),
    evidence: freezeArray(data.evidence)
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
    sourceQueue: "807",
    localGateCoverage: PRIVATE_ADMISSION_807_GATE_ID,
    promotion: "rejected",
    privateEvidenceOnly: true,
    sourceTokenChecksOnly: true,
    manifestEvaluationOnly: true,
    runtimeExecutionClaimed: false,
    publicRuntimeExecutionClaimed: false,
    nativeAddonLoadAttempted: false,
    workerCreationAttempted: false,
    exportsChanged: false,
    compatibilityClaimed: false,
    publicBlockerClaims: freezeRecord(data.publicBlockerClaims),
    ledgerEvaluationMode: "source-token-checks-and-manifest-only"
  });
}

function mergeRowOverride(baseRow, override) {
  const merged = { ...baseRow, ...override };
  for (const key of [
    "implementationPaths",
    "guardIds",
    "priorLedgerContext",
    "evidence"
  ]) {
    if (Object.hasOwn(override, key)) {
      merged[key] = freezeArray(override[key]);
    }
  }
  if (Object.hasOwn(override, "publicBlockerClaims")) {
    merged.publicBlockerClaims = freezeRecord({
      ...baseRow.publicBlockerClaims,
      ...override.publicBlockerClaims
    });
  }
  return freezeRecord(merged);
}

function evaluatePrivateAdmissionRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );
  const evidenceRecognized = evidence.every(
    (evidenceRow) => evidenceRow.recognized === true
  );
  const guardIdsRecognized = sameStringSet(
    PRIVATE_ADMISSION_807_REQUIRED_GUARD_IDS[row.workerId] ?? [],
    row.guardIds
  );
  const priorLedgerContextRecognized = sameStringSet(
    PRIVATE_ADMISSION_807_REQUIRED_PRIOR_LEDGER_CONTEXT[row.workerId] ?? [],
    row.priorLedgerContext
  );
  const publicBlockerClaimKeysRecognized = sameStringSet(
    PRIVATE_ADMISSION_807_BLOCKED_PUBLIC_CLAIMS,
    Object.keys(row.publicBlockerClaims)
  );
  const publicBlockerClaimViolations = Object.entries(row.publicBlockerClaims)
    .filter(([, value]) => value !== false)
    .map(([claimId]) => claimId);
  const staticReadOnlyRecognized =
    row.privateEvidenceOnly === true &&
    row.sourceTokenChecksOnly === true &&
    row.manifestEvaluationOnly === true &&
    row.runtimeExecutionClaimed === false &&
    row.publicRuntimeExecutionClaimed === false &&
    row.nativeAddonLoadAttempted === false &&
    row.workerCreationAttempted === false &&
    row.exportsChanged === false &&
    row.compatibilityClaimed === false &&
    row.ledgerEvaluationMode === "source-token-checks-and-manifest-only";

  return freezeRecord({
    ...row,
    evidence: freezeArray(evidence),
    evidenceRecognized,
    guardIdsRecognized,
    priorLedgerContextRecognized,
    publicBlockerClaimKeysRecognized,
    publicBlockerClaimViolations: freezeArray(publicBlockerClaimViolations),
    staticReadOnlyRecognized,
    recognized:
      evidenceRecognized === true &&
      guardIdsRecognized === true &&
      priorLedgerContextRecognized === true &&
      publicBlockerClaimKeysRecognized === true &&
      publicBlockerClaimViolations.length === 0 &&
      staticReadOnlyRecognized === true
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
  workerId,
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
      workerId,
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

function freezeArray(value) {
  return Object.freeze([...value]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
