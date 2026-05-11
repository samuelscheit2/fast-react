'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const forbiddenLoads = [];
const originalLoad = Module._load;
const originalNodeExtension = Module._extensions['.node'];
let moduleLoadHooks = null;
let moduleGuardsRestored = false;

function isForbiddenLoad(request) {
  const specifier = String(request);
  return (
    specifier.endsWith('.node') ||
    specifier.startsWith('@fast-react/native-') ||
    specifier === 'child_process' ||
    specifier === 'node:child_process' ||
    specifier === 'worker_threads' ||
    specifier === 'node:worker_threads' ||
    specifier === 'http' ||
    specifier === 'node:http' ||
    specifier === 'https' ||
    specifier === 'node:https'
  );
}

function blockForbiddenLoad(kind, request) {
  const attemptedLoad = { kind, request: String(request) };
  forbiddenLoads.push(attemptedLoad);
  const error = new Error(
    `Forbidden native placeholder load attempted: ${attemptedLoad.request}`
  );
  error.attemptedLoad = attemptedLoad;
  throw error;
}

function restoreModuleGuards() {
  if (moduleGuardsRestored) {
    return;
  }

  moduleGuardsRestored = true;
  Module._load = originalLoad;
  Module._extensions['.node'] = originalNodeExtension;
  if (moduleLoadHooks !== null) {
    moduleLoadHooks.deregister();
    moduleLoadHooks = null;
  }
}

function assertModuleGuardsRestored() {
  assert.equal(
    Module._load,
    originalLoad,
    'native no-load guard must restore Module._load'
  );
  assert.equal(
    Module._extensions['.node'],
    originalNodeExtension,
    'native no-load guard must restore the .node extension loader'
  );
  assert.equal(
    moduleLoadHooks,
    null,
    'native no-load guard must deregister module hooks during teardown'
  );
}

function writeFixtureFile(tempDir, relativePath, source) {
  const fixturePath = path.join(tempDir, relativePath);
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(fixturePath, source);
  return fixturePath;
}

function createForbiddenLoadFixtureMatrix() {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'fast-react-native-no-load-')
  );

  writeFixtureFile(
    tempDir,
    'cjs-worker-entry.cjs',
    "'use strict';\nrequire('./cjs-worker-transitive.cjs');\n"
  );
  writeFixtureFile(
    tempDir,
    'cjs-worker-transitive.cjs',
    "'use strict';\nrequire('worker_threads');\n"
  );
  writeFixtureFile(
    tempDir,
    'cjs-node-worker-entry.cjs',
    "'use strict';\nrequire('./cjs-node-worker-transitive.cjs');\n"
  );
  writeFixtureFile(
    tempDir,
    'cjs-node-worker-transitive.cjs',
    "'use strict';\nrequire('node:worker_threads');\n"
  );
  writeFixtureFile(
    tempDir,
    'cjs-native-addon-entry.cjs',
    "'use strict';\nrequire('./native-addon-probe');\n"
  );
  const nativeAddonPath = writeFixtureFile(
    tempDir,
    'native-addon-probe.node',
    ''
  );
  const realNativeAddonPath = fs.realpathSync(nativeAddonPath);
  writeFixtureFile(
    tempDir,
    'cjs-dynamic-native-addon-entry.cjs',
    `'use strict';\nrequire(${JSON.stringify(realNativeAddonPath)});\n`
  );
  writeFixtureFile(
    tempDir,
    'esm-worker-entry.mjs',
    "import './esm-worker-transitive.mjs';\n"
  );
  writeFixtureFile(
    tempDir,
    'esm-worker-transitive.mjs',
    "import 'worker_threads';\n"
  );
  writeFixtureFile(
    tempDir,
    'esm-dynamic-node-worker-entry.mjs',
    "await import('./esm-dynamic-node-worker-transitive.mjs');\n"
  );
  writeFixtureFile(
    tempDir,
    'esm-dynamic-node-worker-transitive.mjs',
    "await import('node:worker_threads');\n"
  );
  writeFixtureFile(
    tempDir,
    'esm-dynamic-native-addon-entry.mjs',
    "await import('./native-addon-probe.node');\n"
  );

  return {
    cjsDynamicNativeAddonEntry: path.join(
      tempDir,
      'cjs-dynamic-native-addon-entry.cjs'
    ),
    cjsNativeAddonEntry: path.join(tempDir, 'cjs-native-addon-entry.cjs'),
    cjsNodeWorkerEntry: path.join(tempDir, 'cjs-node-worker-entry.cjs'),
    cjsWorkerEntry: path.join(tempDir, 'cjs-worker-entry.cjs'),
    esmDynamicNativeAddonEntry: pathToFileURL(
      path.join(tempDir, 'esm-dynamic-native-addon-entry.mjs')
    ).href,
    esmDynamicNodeWorkerEntry: pathToFileURL(
      path.join(tempDir, 'esm-dynamic-node-worker-entry.mjs')
    ).href,
    esmWorkerEntry: pathToFileURL(
      path.join(tempDir, 'esm-worker-entry.mjs')
    ).href,
    nativeAddonPath: realNativeAddonPath,
    tempDir
  };
}

async function assertForbiddenLoad(label, action, expectedAttemptedLoad) {
  const startIndex = forbiddenLoads.length;
  let thrownError = null;

  try {
    await action();
  } catch (error) {
    thrownError = error;
  }

  const attemptedLoads = forbiddenLoads.slice(startIndex);
  forbiddenLoads.length = startIndex;

  assert.ok(thrownError, `${label} must throw before native execution`);
  assert.deepEqual(
    attemptedLoads,
    [expectedAttemptedLoad],
    `${label} must be caught by the native no-load guard`
  );
  assert.deepEqual(
    thrownError.attemptedLoad,
    expectedAttemptedLoad,
    `${label} must surface the blocked native load attempt`
  );
}

function createValidNativeRootBridgeRequestRecord(overrides = {}) {
  return {
    requestId: 1,
    kind: 'create',
    environmentId: 815,
    rootHandle: {
      environmentId: 815,
      slot: 1,
      generation: 1,
      kind: 'root'
    },
    rootId: 1,
    valueHandle: {
      environmentId: 815,
      slot: 2,
      generation: 1,
      kind: 'value'
    },
    rootHandleState: 'active',
    ...overrides
  };
}

function assertBlockedNativeRootBridgeClaim(native, blockedClaim) {
  for (const [label, input] of [
    [
      'direct valid request record',
      createValidNativeRootBridgeRequestRecord({ [blockedClaim]: true })
    ],
    [
      'valid request handoff wrapper',
      {
        nativeRequestRecord: createValidNativeRootBridgeRequestRecord(),
        [blockedClaim]: true
      }
    ],
    [
      'valid nested handoff request record',
      {
        nativeRequestRecord: createValidNativeRootBridgeRequestRecord({
          [blockedClaim]: true
        })
      }
    ]
  ]) {
    assert.throws(
      () => native.createNativeRootBridgeRequestShapeGate(input),
      (error) => {
        assert.equal(error.name, 'FastReactNativeRequestShapeError');
        assert.equal(
          error.code,
          'FAST_REACT_NATIVE_ROOT_BRIDGE_REQUEST_SHAPE_INVALID'
        );
        assert.deepEqual(error.details, { flag: blockedClaim });
        assert.equal(error.nativeAddonLoaded, false);
        assert.equal(error.nativeExecution, false);
        assert.equal(error.rendererExecution, false);
        assert.equal(error.reconcilerExecution, false);
        return true;
      },
      `native no-load guard must reject ${blockedClaim} on ${label}`
    );
  }
}

function assertNoNativeCleanupHookExecution(record, label) {
  assert.equal(record.nodeWorkerThreadsExecution, false, `${label} worker`);
  assert.equal(record.napiCleanupHookExecution, false, `${label} cleanup`);
  assert.equal(record.nativeAddonLoaded, false, `${label} addon`);
  assert.equal(record.nativeExecution, false, `${label} native`);
  assert.equal(record.rendererExecution, false, `${label} renderer`);
  assert.equal(record.reconcilerExecution, false, `${label} reconciler`);
  assert.equal(record.publicNativeCompatibility, false, `${label} public`);
  assert.equal(record.reactBehaviorError, false, `${label} React behavior`);
}

function assertNoNativeGenerationLedgerExecution(record, label) {
  assert.equal(record.nativeAddonLoaded, false, `${label} addon`);
  assert.equal(record.nativeExecution, false, `${label} native`);
  assert.equal(record.nodeWorkerThreadsExecution, false, `${label} worker`);
  assert.equal(record.napiCleanupHookExecution, false, `${label} cleanup`);
  assert.equal(record.rendererExecution, false, `${label} renderer`);
  assert.equal(record.reconcilerExecution, false, `${label} reconciler`);
  assert.equal(record.publicNativeCompatibility, false, `${label} public`);
  assert.equal(record.packageExportCompatibility, false, `${label} package`);
  assert.equal(record.reactBehaviorError, false, `${label} React behavior`);
}

function getGenerationAdmissionLedger(native) {
  const descriptor = Object.getOwnPropertyDescriptor(
    native.nativeRootBridgeRequestShape,
    'jsonBatchLifecycleGenerationAdmissionLedger'
  );

  assert.ok(descriptor, 'generation admission ledger descriptor exists');
  assert.ok(Object.isFrozen(descriptor.value));
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(
    Object.keys(native.nativeRootBridgeRequestShape).includes(
      'jsonBatchLifecycleGenerationAdmissionLedger'
    ),
    false
  );

  return descriptor.value;
}

function getGenerationAdmissionLedgerValidator(native) {
  const ledger = getGenerationAdmissionLedger(native);
  const descriptor = Object.getOwnPropertyDescriptor(
    ledger,
    'validateGenerationAdmissionRows'
  );

  assert.equal(typeof descriptor.value, 'function');
  assert.equal(
    descriptor.value.name,
    'validateNativeRootBridgeJsonBatchLifecycleGenerationAdmissionRows'
  );
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(
    Object.keys(ledger).includes('validateGenerationAdmissionRows'),
    false
  );

  return descriptor.value;
}

function generationAdmissionRow(row, overrides = {}) {
  return Object.freeze({ ...row, ...overrides });
}

function assertPrivateGenerationAdmissionLedger(native) {
  const ledger = getGenerationAdmissionLedger(native);
  const validateGenerationAdmissionRows =
    getGenerationAdmissionLedgerValidator(native);

  assert.equal(
    ledger.ledgerStatus,
    'blocked-private-native-root-bridge-json-batch-lifecycle-generation-ledger'
  );
  assert.equal(
    ledger.model,
    'fast-react-napi.NativeRootBridgeJsonBatchLifecycleGenerationAdmissionLedger'
  );
  assert.equal(
    ledger.evaluationMode,
    'static-source-token-ledger-no-native-load-no-package-export'
  );
  assert.equal(
    ledger.sourceWorker,
    'worker-873-native-lifecycle-no-stale-execution'
  );
  assert.equal(ledger.sourceFile, 'crates/fast-react-napi/src/lib.rs');
  assert.equal(ledger.sourceOwnedEvidenceRequired, true);
  assert.equal(ledger.blockedPrivateEvidenceOnly, true);
  assert.equal(ledger.publicAdmission, false);
  assert.equal(ledger.canonicalSourceEvidenceAccepted, true);
  assert.equal(ledger.acceptedEvidenceCount, 6);
  assert.equal(ledger.rejectedEvidenceCount, 0);
  assert.deepEqual(ledger.rejectedRows, []);
  assertNoNativeGenerationLedgerExecution(ledger, 'generation ledger');
  assert.deepEqual(
    ledger.requiredEvidenceIds,
    ledger.rows.map((row) => row.id)
  );
  assert.deepEqual(
    ledger.requiredEvidenceRoles,
    ledger.rows.map((row) => row.role)
  );
  assert.deepEqual(ledger.rows.map((row) => row.status), [
    ledger.acceptedStatus,
    ledger.acceptedStatus,
    ledger.acceptedStatus,
    ledger.acceptedStatus,
    ledger.acceptedStatus,
    ledger.acceptedStatus
  ]);
  assert.deepEqual(ledger.rows.map((row) => row.id), [
    'worker-873-json-batch-lifecycle-executor-status',
    'worker-873-json-batch-lifecycle-source-guard',
    'worker-873-json-batch-lifecycle-executor-row',
    'worker-873-json-batch-lifecycle-generation-allocation',
    'worker-873-json-batch-lifecycle-source-row-validator',
    'worker-873-json-batch-lifecycle-replay-consumption'
  ]);
  assert.deepEqual(ledger.rows.map((row) => row.role), [
    'executor-status-and-rejection-codes',
    'source-owned-generation-handle-table-guard',
    'accepted-row-carries-source-guard',
    'generation-and-json-value-reuse-guard',
    'stale-caller-public-claim-source-row-validator',
    'single-consume-generation-replay-guard'
  ]);

  const rustSource = fs.readFileSync(
    path.resolve(__dirname, '../../../crates/fast-react-napi/src/lib.rs'),
    'utf8'
  );
  const workerProgress = fs.readFileSync(
    path.resolve(__dirname, '../../../', ledger.sourceWorkerProgress),
    'utf8'
  );
  assert.match(workerProgress, /private source-owned generation guard/u);

  for (const row of ledger.rows) {
    assert.ok(Object.isFrozen(row), row.id);
    assert.ok(Object.isFrozen(row.sourceIdentifiers), row.id);
    assert.deepEqual(Object.keys(row), ledger.generationAdmissionRowFields);
    assert.equal(
      row.evidenceKind,
      'source-owned-rust-identifier-set',
      row.id
    );
    assert.equal(row.sourceFile, 'crates/fast-react-napi/src/lib.rs', row.id);
    assert.equal(row.sourceOwnedEvidence, true, row.id);
    assert.equal(row.blockedPrivateEvidence, true, row.id);
    assert.equal(row.publicAdmission, false, row.id);
    assert.equal(row.callerShapedEvidence, false, row.id);
    assert.equal(row.proseEvidence, false, row.id);
    assert.equal(row.testTitleEvidence, false, row.id);
    assert.equal(row.errorMessageEvidence, false, row.id);
    assert.equal(row.sourceSyntaxOnly, false, row.id);
    assert.equal(row.compatibilityAlias, null, row.id);
    assertNoNativeGenerationLedgerExecution(row, row.id);
    for (const sourceIdentifier of row.sourceIdentifiers) {
      assert.ok(
        rustSource.includes(sourceIdentifier),
        `${row.id} source identifier ${sourceIdentifier}`
      );
    }
  }

  const mirrored = validateGenerationAdmissionRows(ledger.rows);
  assert.notEqual(mirrored, ledger);
  assert.deepEqual(mirrored, ledger);
  assert.ok(Object.isFrozen(mirrored));
  assert.ok(Object.isFrozen(mirrored.rows));
  assertNoNativeGenerationLedgerExecution(
    mirrored,
    'mirrored generation ledger'
  );

  const canonicalStatus = ledger.rows[0];
  const canonicalGuard = ledger.rows[1];
  const canonicalReplay = ledger.rows[5];
  const codes = ledger.rejectionCodes;
  const cases = [
    {
      row: generationAdmissionRow(canonicalGuard, {
        id: 'generation-ledger-stale-source-identifiers',
        sourceIdentifiers: ['NativeRootBridgeJsonBatchLifecycleExecutorSourceGuard']
      }),
      code: codes.staleOrForeign
    },
    {
      row: generationAdmissionRow(canonicalGuard, {
        id: 'generation-ledger-wrong-source-role',
        role: 'caller-shaped-generation-guard'
      }),
      code: codes.sourceRoleMismatch
    },
    {
      row: generationAdmissionRow(canonicalGuard, {
        id: 'generation-ledger-caller-shaped-row',
        sourceOwnedEvidence: false,
        callerShapedEvidence: true
      }),
      code: codes.callerBuilt
    },
    {
      row: generationAdmissionRow(canonicalStatus, {
        id: 'generation-ledger-prose-evidence',
        evidenceKind: 'prose',
        proseEvidence: true
      }),
      code: codes.proseEvidence
    },
    {
      row: generationAdmissionRow(canonicalStatus, {
        id: 'generation-ledger-test-title-evidence',
        evidenceKind: 'test-title',
        testTitleEvidence: true
      }),
      code: codes.proseEvidence
    },
    {
      row: generationAdmissionRow(canonicalStatus, {
        id: 'generation-ledger-error-message-evidence',
        evidenceKind: 'error-message',
        errorMessageEvidence: true
      }),
      code: codes.proseEvidence
    },
    {
      row: generationAdmissionRow(canonicalStatus, {
        id: 'generation-ledger-source-syntax-only',
        evidenceKind: 'source-syntax',
        sourceSyntaxOnly: true
      }),
      code: codes.sourceSyntaxOnly
    },
    {
      row: generationAdmissionRow(canonicalReplay, {
        id: 'generation-ledger-public-native-claim',
        nativeExecution: true,
        publicNativeCompatibility: true
      }),
      code: codes.publicNativeExecutionClaim
    },
    {
      row: generationAdmissionRow(canonicalReplay, {
        id: 'generation-ledger-package-export-claim',
        packageExportCompatibility: true,
        packageCompatibilityClaimed: true
      }),
      code: codes.packageExportClaim
    },
    {
      row: generationAdmissionRow(canonicalReplay, {
        id: 'generation-ledger-native-addon-load-claim',
        nativeAddonLoaded: true
      }),
      code: codes.nativeAddonLoadClaim
    },
    {
      row: generationAdmissionRow(canonicalReplay, {
        id: 'generation-ledger-cleanup-hook-execution-claim',
        napiCleanupHookExecution: true
      }),
      code: codes.cleanupHookExecutionClaim
    },
    {
      row: generationAdmissionRow(canonicalReplay, {
        id: 'generation-ledger-worker-thread-execution-claim',
        nodeWorkerThreadsExecution: true
      }),
      code: codes.workerThreadExecutionClaim
    },
    {
      row: generationAdmissionRow(canonicalReplay, {
        id: 'generation-ledger-renderer-reconciler-output-claim',
        rendererExecution: true,
        reconcilerExecution: true
      }),
      code: codes.rendererReconcilerOutputClaim
    },
    {
      row: generationAdmissionRow(canonicalReplay, {
        id: 'generation-ledger-compatibility-alias-claim',
        compatibilityAlias: 'react-native'
      }),
      code: codes.compatibilityAliasClaim
    }
  ];

  for (const diagnosticCase of cases) {
    const result = validateGenerationAdmissionRows([diagnosticCase.row]);
    assert.ok(Object.isFrozen(result), diagnosticCase.row.id);
    assert.equal(result.rows.length, 1, diagnosticCase.row.id);
    assert.equal(result.acceptedEvidenceCount, 0, diagnosticCase.row.id);
    assert.equal(result.rejectedEvidenceCount, 1, diagnosticCase.row.id);
    assert.equal(
      result.canonicalSourceEvidenceAccepted,
      false,
      diagnosticCase.row.id
    );
    assertNoNativeGenerationLedgerExecution(result, diagnosticCase.row.id);

    const [row] = result.rows;
    assert.equal(row.id, diagnosticCase.row.id);
    assert.equal(row.status, ledger.rejectedStatus, diagnosticCase.row.id);
    assert.equal(row.code, diagnosticCase.code, diagnosticCase.row.id);
    assert.equal(Object.hasOwn(row, 'packageCompatibilityClaimed'), false);
    assertNoNativeGenerationLedgerExecution(row, diagnosticCase.row.id);
  }

  for (const diagnosticCase of [
    {
      id: 'generation-ledger-missing-canonical-row',
      rows: [canonicalGuard]
    },
    {
      id: 'generation-ledger-duplicate-canonical-row',
      rows: [canonicalGuard, canonicalGuard]
    }
  ]) {
    const result = validateGenerationAdmissionRows(diagnosticCase.rows);
    assert.equal(result.acceptedEvidenceCount, 0, diagnosticCase.id);
    assert.equal(
      result.rejectedEvidenceCount,
      diagnosticCase.rows.length,
      diagnosticCase.id
    );
    assert.equal(result.canonicalSourceEvidenceAccepted, false, diagnosticCase.id);
    for (const row of result.rows) {
      assert.equal(row.status, ledger.rejectedStatus, diagnosticCase.id);
      assert.equal(row.code, codes.canonicalSetMismatch, diagnosticCase.id);
      assertNoNativeGenerationLedgerExecution(row, diagnosticCase.id);
    }
  }

  const publicClaimResult = validateGenerationAdmissionRows([
    cases.find((diagnosticCase) => diagnosticCase.code === codes.publicNativeExecutionClaim).row
  ]);
  const publicClaimRevalidated = validateGenerationAdmissionRows([
    publicClaimResult.rows[0]
  ]);
  assert.equal(publicClaimRevalidated.acceptedEvidenceCount, 0);
  assert.equal(publicClaimRevalidated.rejectedEvidenceCount, 1);
  assert.equal(
    publicClaimRevalidated.rows[0].code,
    codes.publicNativeExecutionClaim
  );
  assertNoNativeGenerationLedgerExecution(
    publicClaimRevalidated.rows[0],
    'generation ledger revalidated public claim'
  );
}

function getCleanupHookPreflightValidator(native) {
  const cleanupHookPreflight =
    native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight;
  const descriptor = Object.getOwnPropertyDescriptor(
    cleanupHookPreflight,
    'validateCleanupHookEvidenceRows'
  );

  assert.equal(typeof descriptor.value, 'function');
  assert.equal(descriptor.value.name, 'validateNativeRootBridgeWorkerThreadCleanupHookPreflightRows');
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(
    Object.keys(cleanupHookPreflight).includes('validateCleanupHookEvidenceRows'),
    false
  );

  return descriptor.value;
}

function cleanupHookRow(row, overrides = {}) {
  return Object.freeze({ ...row, ...overrides });
}

function assertPrivateCleanupHookPreflightCallable(native) {
  const cleanupHookPreflight =
    native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight;
  const validateCleanupHookEvidenceRows =
    getCleanupHookPreflightValidator(native);
  const mirroredPreflight = validateCleanupHookEvidenceRows(
    cleanupHookPreflight.rows
  );

  assert.notEqual(mirroredPreflight, cleanupHookPreflight);
  assert.deepEqual(mirroredPreflight, cleanupHookPreflight);
  assert.ok(Object.isFrozen(mirroredPreflight));
  assert.ok(Object.isFrozen(mirroredPreflight.rows));
  assertNoNativeCleanupHookExecution(
    mirroredPreflight,
    'callable cleanup-hook mirrored preflight'
  );
  for (const row of mirroredPreflight.rows) {
    assert.ok(Object.isFrozen(row));
    assertNoNativeCleanupHookExecution(row, row.id);
  }

  const canonicalRoot = cleanupHookPreflight.rows[0];
  const cases = [
    {
      row: cleanupHookRow(canonicalRoot, {
        id: 'cleanup-hook-callable-stale-source-rejected',
        sourcePreflightStatus:
          native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
            .workerThreadTeardownGateStatus,
        sourceWorkerThreadId: 524,
        sourceEnvironmentId: 524,
        sourceRowId: 'worker-root-stale-after-thread-teardown'
      }),
      code: cleanupHookPreflight.rows[2].code,
      staleOrForged: true
    },
    {
      row: cleanupHookRow(canonicalRoot, {
        id: 'cleanup-hook-callable-forged-source-rejected',
        sourceRowId: 'peer-root-active-executable-preflight',
        sourceErrorCode: null,
        sourceBoundaryErrorCode: null
      }),
      code: cleanupHookPreflight.rows[3].code,
      staleOrForged: true
    },
    {
      row: cleanupHookRow(canonicalRoot, {
        id: 'cleanup-hook-callable-wrong-order-rejected',
        registrationOrder: 1,
        expectedExecutionOrder: 2
      }),
      code: 'FAST_REACT_NAPI_CLEANUP_HOOK_ORDER_MISMATCH',
      staleOrForged: false
    },
    {
      row: cleanupHookRow(canonicalRoot, {
        id: 'cleanup-hook-callable-identity-tamper-rejected',
        cleanupHookFunctionIdentityToken:
          'private-cleanup-hook-fn:worker-root-handle-tampered'
      }),
      code: 'FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH',
      staleOrForged: false
    },
    {
      row: cleanupHookRow(canonicalRoot, {
        id: 'cleanup-hook-callable-public-native-package-claim-rejected',
        nativeAddonLoaded: true,
        nativeExecution: true,
        publicNativeCompatibility: true,
        packageCompatibilityClaimed: true
      }),
      code: 'FAST_REACT_NAPI_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM',
      staleOrForged: false
    }
  ];

  for (const diagnosticCase of cases) {
    const result = validateCleanupHookEvidenceRows([diagnosticCase.row]);
    assert.ok(Object.isFrozen(result));
    assert.equal(result.rows.length, 1, diagnosticCase.row.id);
    assert.equal(result.acceptedCleanupEvidenceCount, 0, diagnosticCase.row.id);
    assert.equal(result.rejectedCleanupEvidenceCount, 1, diagnosticCase.row.id);
    assert.equal(
      result.canonicalExecutableEvidenceAccepted,
      false,
      diagnosticCase.row.id
    );
    assertNoNativeCleanupHookExecution(result, diagnosticCase.row.id);

    const [row] = result.rows;
    assert.equal(row.id, diagnosticCase.row.id);
    assert.equal(row.status, 'rejected', diagnosticCase.row.id);
    assert.equal(row.code, diagnosticCase.code, diagnosticCase.row.id);
    assert.equal(row.observedExecutionOrder, null, diagnosticCase.row.id);
    assert.equal(row.canonicalExecutableEvidence, false, diagnosticCase.row.id);
    assert.equal(
      row.staleOrForgedCleanupEvidenceRejected,
      diagnosticCase.staleOrForged,
      diagnosticCase.row.id
    );
    assert.equal(Object.hasOwn(row, 'packageCompatibilityClaimed'), false);
    assertNoNativeCleanupHookExecution(row, diagnosticCase.row.id);
  }

  const publicClaimResult = validateCleanupHookEvidenceRows([cases[4].row]);
  const publicClaimRevalidated = validateCleanupHookEvidenceRows([
    publicClaimResult.rows[0]
  ]);
  assert.equal(publicClaimRevalidated.acceptedCleanupEvidenceCount, 0);
  assert.equal(publicClaimRevalidated.rejectedCleanupEvidenceCount, 1);
  assert.equal(
    publicClaimRevalidated.rows[0].code,
    'FAST_REACT_NAPI_CLEANUP_HOOK_PUBLIC_NATIVE_PACKAGE_CLAIM'
  );
  assertNoNativeCleanupHookExecution(
    publicClaimRevalidated.rows[0],
    'callable cleanup-hook revalidated public claim'
  );

  const canonicalValue = cleanupHookPreflight.rows[1];
  for (const diagnosticCase of [
    {
      id: 'cleanup-hook-callable-duplicate-root-rejected',
      rows: [canonicalRoot, canonicalRoot]
    },
    {
      id: 'cleanup-hook-callable-duplicate-value-rejected',
      rows: [canonicalValue, canonicalValue]
    },
    {
      id: 'cleanup-hook-callable-missing-value-rejected',
      rows: [canonicalRoot]
    },
    {
      id: 'cleanup-hook-callable-missing-root-rejected',
      rows: [canonicalValue]
    }
  ]) {
    const result = validateCleanupHookEvidenceRows(diagnosticCase.rows);

    assert.equal(result.acceptedCleanupEvidenceCount, 0, diagnosticCase.id);
    assert.equal(
      result.rejectedCleanupEvidenceCount,
      diagnosticCase.rows.length,
      diagnosticCase.id
    );
    assert.equal(
      result.canonicalExecutableEvidenceAccepted,
      false,
      diagnosticCase.id
    );
    assertNoNativeCleanupHookExecution(result, diagnosticCase.id);

    for (const row of result.rows) {
      assert.equal(row.status, 'rejected', diagnosticCase.id);
      assert.equal(
        row.code,
        'FAST_REACT_NAPI_CLEANUP_HOOK_CANONICAL_SET_MISMATCH',
        diagnosticCase.id
      );
      assert.equal(row.observedExecutionOrder, null, diagnosticCase.id);
      assert.equal(row.canonicalExecutableEvidence, false, diagnosticCase.id);
      assertNoNativeCleanupHookExecution(row, diagnosticCase.id);
    }
  }
}

function assertNativeRootBridgeBatchLifecycleConsumerNoLoad(native) {
  const createRecord = createValidNativeRootBridgeRequestRecord();
  const renderRecord = createValidNativeRootBridgeRequestRecord({
    requestId: 2,
    kind: 'render',
    valueHandle: {
      environmentId: 815,
      slot: 3,
      generation: 1,
      kind: 'value'
    }
  });
  const unmountRecord = createValidNativeRootBridgeRequestRecord({
    requestId: 3,
    kind: 'unmount',
    valueHandle: null,
    rootHandleState: 'retired'
  });
  const gate = native.createNativeRootBridgeRequestShapeGate([
    createRecord,
    renderRecord,
    unmountRecord
  ]);
  const consumer = gate.batchLifecycleConsumer;

  assert.ok(Object.isFrozen(consumer));
  assert.ok(Object.isFrozen(consumer.rows));
  assert.equal(
    native.nativeRootBridgeRequestShape.batchLifecycleConsumer.consumerStatus,
    'consumed-native-root-bridge-batch-lifecycle-records'
  );
  assertNoNativeCleanupHookExecution(
    native.nativeRootBridgeRequestShape.batchLifecycleConsumer,
    'static batch lifecycle consumer metadata'
  );
  assert.equal(
    consumer.consumerStatus,
    'consumed-native-root-bridge-batch-lifecycle-records'
  );
  assert.equal(
    consumer.model,
    'fast-react-napi.NativeRootBridgeBatchLifecycleConsumer'
  );
  assert.equal(
    consumer.validationModel,
    native.nativeRootBridgeRequestShape.validationModel
  );
  assert.equal(
    consumer.handleTableModel,
    native.nativeRootBridgeRequestShape.handleTableModel
  );
  assert.equal(
    consumer.batchGateStatus,
    gate.jsonTransportSmoke.parserGate.batchedRecordGate.batchGateStatus
  );
  assert.equal(
    consumer.cleanupHookPreflightStatus,
    native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
      .preflightStatus
  );
  assert.equal(consumer.cleanupHookCallableName, 'validateCleanupHookEvidenceRows');
  assert.equal(consumer.requestCount, 3);
  assert.equal(consumer.consumedBatchRecordCount, 3);
  assert.equal(consumer.acceptedBatchRecordCount, 3);
  assert.equal(consumer.cleanupHookCallablePreflightAccepted, true);
  assert.equal(consumer.acceptedCleanupEvidenceCount, 2);
  assert.equal(consumer.rejectedCleanupEvidenceCount, 2);
  assert.deepEqual(consumer.cleanupHookEvidenceStatuses, [
    'not-required',
    'accepted',
    'rejected'
  ]);
  assertNoNativeCleanupHookExecution(consumer, 'batch lifecycle consumer');

  assert.deepEqual(
    consumer.rows.map((row) => row.id),
    [
      'batch-lifecycle-consumer-0-create',
      'batch-lifecycle-consumer-1-render',
      'batch-lifecycle-consumer-2-unmount'
    ]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.kind),
    ['create', 'render', 'unmount']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.lifecycleTransition),
    ['none->active', 'active->active', 'active->retired']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.rootHandleAction),
    [
      'admit-root-handle',
      'validate-active-root-handle',
      'retire-root-handle'
    ]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.rootHandleStateBefore),
    [null, 'active', 'active']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.rootHandleStateAfter),
    ['active', 'active', 'retired']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.rootHandleCurrentGeneration),
    [1, 1, 2]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.valueHandleAction),
    ['admit-value-handle', 'admit-value-handle', null]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookEvidenceRequired),
    [false, true, true]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookEvidenceStatus),
    ['not-required', 'accepted', 'accepted']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookEvidenceRowId),
    [
      null,
      'cleanup-hook-worker-value-after-root-release',
      'cleanup-hook-worker-root-before-value-release'
    ]
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookSourceHandleKind),
    [null, 'value', 'root']
  );
  assert.deepEqual(
    consumer.rows.map((row) => row.cleanupHookCanonicalExecutableEvidence),
    [null, true, true]
  );
  assert.equal(
    consumer.rows.every(
      (row) =>
        Object.isFrozen(row) &&
        row.status === 'accepted' &&
        row.code === null &&
        row.sourceErrorCode === null &&
        row.boundaryErrorCode === null &&
        row.nativeAddonLoaded === false &&
        row.nativeExecution === false &&
        row.rendererExecution === false &&
        row.reconcilerExecution === false &&
        row.nodeWorkerThreadsExecution === false &&
        row.napiCleanupHookExecution === false &&
        row.publicNativeCompatibility === false &&
        row.reactBehaviorError === false
    ),
    true
  );
}

async function runForbiddenLoadFixtureMatrix() {
  const fixtures = createForbiddenLoadFixtureMatrix();

  try {
    await assertForbiddenLoad(
      'transitive CommonJS worker_threads require',
      () => require(fixtures.cjsWorkerEntry),
      { kind: 'module-load', request: 'worker_threads' }
    );
    await assertForbiddenLoad(
      'transitive CommonJS node:worker_threads require',
      () => require(fixtures.cjsNodeWorkerEntry),
      { kind: 'module-load', request: 'node:worker_threads' }
    );
    await assertForbiddenLoad(
      'transitive CommonJS .node extension resolution',
      () => require(fixtures.cjsNativeAddonEntry),
      { kind: 'node-extension', request: fixtures.nativeAddonPath }
    );
    await assertForbiddenLoad(
      'dynamic CommonJS explicit .node load',
      () => require(fixtures.cjsDynamicNativeAddonEntry),
      { kind: 'module-load', request: fixtures.nativeAddonPath }
    );
    await assertForbiddenLoad(
      'transitive ESM worker_threads import',
      () => import(fixtures.esmWorkerEntry),
      { kind: 'module-resolve', request: 'worker_threads' }
    );
    await assertForbiddenLoad(
      'dynamic ESM node:worker_threads import',
      () => import(fixtures.esmDynamicNodeWorkerEntry),
      { kind: 'module-resolve', request: 'node:worker_threads' }
    );
    await assertForbiddenLoad(
      'dynamic ESM .node import',
      () => import(fixtures.esmDynamicNativeAddonEntry),
      { kind: 'module-resolve', request: './native-addon-probe.node' }
    );
  } finally {
    fs.rmSync(fixtures.tempDir, { recursive: true, force: true });
  }
}

assert.equal(
  typeof Module.registerHooks,
  'function',
  'native no-load guard requires Module.registerHooks to observe ESM imports'
);

moduleLoadHooks = Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (isForbiddenLoad(specifier)) {
      blockForbiddenLoad('module-resolve', specifier);
    }

    return nextResolve(specifier, context);
  }
});

Module._extensions['.node'] = function blockedNodeExtension(module, filename) {
  blockForbiddenLoad('node-extension', filename);
};

Module._load = function guardedModuleLoad(request, parent, isMain) {
  if (isForbiddenLoad(request)) {
    blockForbiddenLoad('module-load', request);
  }

  return originalLoad.call(this, request, parent, isMain);
};

async function main() {
  try {
    await runForbiddenLoadFixtureMatrix();

    const native = require('../index.cjs');
    const nativePackageJson = require('../package.json');
    const nativePackageJsonModule = await import('../package.json', {
      with: { type: 'json' }
    });
    const expectedBoundaryErrorCodeMap = {
      unsupportedNativeExecution: 'FAST_REACT_NATIVE_BINDING_UNIMPLEMENTED',
      rustNativeExportsNotBuilt: 'FAST_REACT_NAPI_EXPORTS_NOT_BUILT',
      rootBridgeWrongEnvironment:
        'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT',
      rootBridgeStaleHandle: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
      rootBridgeWrongLifecycleOrder:
        'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER'
    };
    const expectedRootBridgeEvidence = [
      {
        scenario: 'wrong-environment-root-handle',
        sourceErrorCode: 'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
        boundaryErrorCode:
          'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_ENVIRONMENT',
        nativeExecution: false,
        reactBehaviorError: false
      },
      {
        scenario: 'stale-root-or-value-handle',
        sourceErrorCode: 'FAST_REACT_NAPI_STALE_HANDLE',
        boundaryErrorCode: 'FAST_REACT_NAPI_ROOT_BRIDGE_STALE_HANDLE',
        nativeExecution: false,
        reactBehaviorError: false
      },
      {
        scenario: 'wrong-root-lifecycle-order',
        sourceErrorCode:
          'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
        boundaryErrorCode:
          'FAST_REACT_NAPI_ROOT_BRIDGE_WRONG_LIFECYCLE_ORDER',
        nativeExecution: false,
        reactBehaviorError: false
      }
    ];

    assert.equal(native.bindingStatus, 'placeholder');
    assert.equal(nativePackageJson.name, '@fast-react/native');
    assert.equal(nativePackageJsonModule.default.name, '@fast-react/native');
    assert.equal(native.nativeBindingManifest.status, 'placeholder');
    const actualRootBridgeEvidence =
      native.nativeBindingManifest.nativeRootBridgeValidationEvidence;

    assert.deepEqual(
      native.nativeBindingManifest.nativeBoundaryErrorCodeMap,
      expectedBoundaryErrorCodeMap
    );
    assert.ok(
      Object.isFrozen(native.nativeBindingManifest.nativeBoundaryErrorCodeMap)
    );
    assert.deepEqual(
      actualRootBridgeEvidence,
      expectedRootBridgeEvidence
    );
    assert.equal(
      native.createNativeRootBridgeRequestShapeGate(
        createValidNativeRootBridgeRequestRecord()
      ).requestCount,
      1
    );
    for (const blockedClaim of [
      'nativeAddonLoaded',
      'nativeExecution',
      'rendererExecution',
      'reconcilerExecution',
      'publicNativeCompatibility',
      'compatibilityClaimed'
    ]) {
      assertBlockedNativeRootBridgeClaim(native, blockedClaim);
    }
    assert.equal(
      native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
        .teardownGateStatus,
      'diagnosed-native-root-bridge-cross-environment-teardown-isolation'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
        .nativeAddonLoaded,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.crossEnvironmentTeardownGate.rows
        .length,
      12
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .workerThreadTeardownGateStatus,
      'diagnosed-native-root-bridge-transport-worker-thread-teardown'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .nativeAddonLoaded,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .publicNativeCompatibility,
      false
    );
    assert.deepEqual(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate
        .rows.map((row) => row.id),
      [
        'worker-root-stale-after-thread-teardown',
        'worker-create-value-stale-after-thread-teardown',
        'worker-render-value-stale-after-thread-teardown',
        'peer-root-active-after-worker-thread-teardown'
      ]
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.transportWorkerThreadTeardownGate.rows
        .every(
          (row) =>
            row.nativeAddonLoaded === false &&
            row.nativeExecution === false &&
            row.rendererExecution === false &&
            row.reconcilerExecution === false &&
            row.reactBehaviorError === false
        ),
      true
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .preflightStatus,
      'preflighted-native-root-bridge-worker-thread-teardown-boundary'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .workerThreadId,
      764
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .nodeWorkerThreadsExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .napiCleanupHookExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .nativeAddonLoaded,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .publicNativeCompatibility,
      false
    );
    assert.deepEqual(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .rows.map((row) => row.id),
      [
        'worker-render-root-stale-executable-preflight',
        'worker-create-value-stale-executable-preflight',
        'worker-render-value-stale-executable-preflight',
        'peer-root-active-executable-preflight',
        'peer-value-active-executable-preflight'
      ]
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight.rows
        .every(
          (row) =>
            row.nodeWorkerThreadsExecution === false &&
            row.napiCleanupHookExecution === false &&
            row.nativeAddonLoaded === false &&
            row.nativeExecution === false &&
            row.rendererExecution === false &&
            row.reconcilerExecution === false &&
            row.publicNativeCompatibility === false &&
            row.reactBehaviorError === false
        ),
      true
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .preflightStatus,
      'preflighted-native-root-bridge-worker-thread-cleanup-hook-order'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .workerThreadId,
      764
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .sourceExecutablePreflightStatus,
      native.nativeRootBridgeRequestShape.workerThreadTeardownExecutablePreflight
        .preflightStatus
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .canonicalExecutableEvidenceAccepted,
      true
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .napiCleanupHookExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .nativeAddonLoaded,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .publicNativeCompatibility,
      false
    );
    assert.deepEqual(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .rows.map((row) => row.id),
      [
        'cleanup-hook-worker-root-before-value-release',
        'cleanup-hook-worker-value-after-root-release',
        'cleanup-hook-stale-worker-transport-evidence-rejected',
        'cleanup-hook-forged-peer-active-evidence-rejected'
      ]
    );
    assert.deepEqual(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight
        .rows.map((row) => row.status),
      ['accepted', 'accepted', 'rejected', 'rejected']
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.workerThreadCleanupHookPreflight.rows
        .every(
          (row) =>
            row.nodeWorkerThreadsExecution === false &&
            row.napiCleanupHookExecution === false &&
            row.nativeAddonLoaded === false &&
            row.nativeExecution === false &&
            row.rendererExecution === false &&
            row.reconcilerExecution === false &&
            row.publicNativeCompatibility === false &&
            row.reactBehaviorError === false
      ),
      true
    );
    assertPrivateCleanupHookPreflightCallable(native);
    assertPrivateGenerationAdmissionLedger(native);
    assertNativeRootBridgeBatchLifecycleConsumerNoLoad(native);
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.responseSequenceGateStatus,
      'diagnosed-native-root-bridge-json-batch-response-sequence'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.batchId,
      'native-root-bridge-json-batch-552'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.streamRoundtripGate
        .streamRoundtripGateStatus,
      'diagnosed-native-root-bridge-json-stream-batch-roundtrip'
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.streamRoundtripGate
        .nativeExecution,
      false
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.streamRoundtripGate
        .crossEnvironmentHandleReuseBlocked,
      true
    );
    assert.equal(
      native.nativeRootBridgeRequestShape.jsonTransportSmoke.parserGate
        .batchedRecordGate.responseSequenceGate.streamRoundtripGate
        .publicNativeCompatibility,
      false
    );
    assert.ok(Object.isFrozen(actualRootBridgeEvidence));
    for (const evidence of actualRootBridgeEvidence) {
      assert.ok(Object.isFrozen(evidence));
    }
    assert.deepEqual(
      native.getNativeBindingLoadPlan({
        platform: 'linux',
        arch: 'x64',
        libc: 'musl'
      }).candidateSpecifiers,
      [
        '@fast-react/native-linux-x64-musl',
        '@fast-react/native-linux-x64-musl/fast_react_napi.linux-x64-musl.node'
      ]
    );
    assert.throws(
      () =>
        native.loadNativeBinding({
          platform: 'linux',
          arch: 'x64',
          libc: 'musl'
        }),
      (error) => {
        assert.ok(error instanceof native.FastReactNativeBindingUnavailableError);
        assert.equal(error.code, native.unavailableErrorCode);
        assert.equal(error.nativeExecution, false);
        assert.equal(
          error.nativeBoundaryErrorCode,
          expectedBoundaryErrorCodeMap.unsupportedNativeExecution
        );
        assert.equal(error.loadPlan.nativeExecution, false);
        assert.equal(
          error.loadPlan.unsupportedNativeExecutionCode,
          expectedBoundaryErrorCodeMap.unsupportedNativeExecution
        );
        return true;
      }
    );

    const esmNative = await import('../index.mjs');
    assert.equal(esmNative.default, native);
    assert.equal(esmNative.nativeBindingManifest, native.nativeBindingManifest);
    assert.equal(
      getCleanupHookPreflightValidator(esmNative),
      getCleanupHookPreflightValidator(native)
    );
    assert.equal(
      getGenerationAdmissionLedgerValidator(esmNative),
      getGenerationAdmissionLedgerValidator(native)
    );
  } finally {
    restoreModuleGuards();
  }

  assertModuleGuardsRestored();
  assert.deepEqual(
    forbiddenLoads,
    [],
    'placeholder imports and loadNativeBinding() must not resolve or load native artifacts, platform packages, child_process, worker_threads, or network modules'
  );

  console.log('Fast React native no-load guard checks passed.');
}

main().catch((error) => {
  restoreModuleGuards();
  console.error(error);
  process.exitCode = 1;
});
