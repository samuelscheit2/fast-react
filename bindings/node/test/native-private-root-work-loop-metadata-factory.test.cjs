'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const native = require('../index.cjs');

const factorySymbol = Symbol.for(
  'fast.react_native.private_root_work_loop_finished_work_metadata_factory'
);
const factoryName = 'createNativeRootWorkLoopFinishedWorkMetadataForCanary';
const invalidOptionsCode =
  'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_INVALID_OPTIONS';
const capabilityClaimCode =
  'FAST_REACT_NAPI_ROOT_WORK_LOOP_FINISHED_WORK_METADATA_FACTORY_CAPABILITY_CLAIM';
const ledgerModel =
  'fast-react-napi.RootWorkLoopFinishedWorkMetadataSourceCurrentnessLedger';
const ledgerSymbolDescription =
  'fast.react_native.private_root_work_loop_finished_work_metadata_source_currentness_ledger';
const repoRoot = path.resolve(__dirname, '../../..');
const rustMetadataSourcePath = path.join(
  repoRoot,
  'crates/fast-react-napi/src/root_work_loop_metadata.rs'
);
const nativeIndexPath = path.join(repoRoot, 'bindings/node/index.cjs');
const nativeMetadataFactoryTestPath = path.join(
  repoRoot,
  'bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs'
);
const validOptions = Object.freeze({
  hostType: 'div',
  renderUpdateId: 'private-root-work-loop-update:1',
  rootId: 'private-root-work-loop-root:1',
  rootTag: 'ConcurrentRoot',
  textContent: 'text'
});

function assertNoPublicStringKeyLeak(object, label) {
  const stringKeys = Object.getOwnPropertyNames(object);

  assert.equal(
    stringKeys.includes(factorySymbol.description),
    false,
    `${label} must not expose the private registry key as a string property`
  );
  assert.equal(
    stringKeys.includes(factoryName),
    false,
    `${label} must not expose the private factory name as a string property`
  );
  assert.equal(
    Object.keys(object).includes(factoryName),
    false,
    `${label} must not enumerate the private factory name`
  );
  assert.equal(
    stringKeys.some((key) =>
      /private_root_work_loop_finished_work_metadata_factory|RootWorkLoopFinishedWorkMetadata/u.test(
        key
      )
    ),
    false,
    `${label} must not expose root work-loop metadata factory string keys`
  );
}

function assertFactoryError(input, expectedCode, label) {
  assert.throws(
    () => native[factorySymbol](input),
    (error) => {
      assert.equal(
        error.name,
        'FastReactNativeRootWorkLoopFinishedWorkMetadataFactoryError',
        label
      );
      assert.equal(error.code, expectedCode, label);
      assert.equal(error.nativeAddonLoaded, false, label);
      assert.equal(error.nativeExecution, false, label);
      assert.equal(error.rendererExecution, false, label);
      assert.equal(error.reconcilerExecution, false, label);
      assert.equal(error.publicNativeCompatibility, false, label);
      assert.equal(error.compatibilityClaimed, false, label);
      assert.ok(Object.isFrozen(error.details), label);
      return true;
    },
    label
  );
}

function getValueAtPath(object, fieldPath) {
  return fieldPath
    .split('.')
    .reduce((value, field) => value?.[field], object);
}

function assertHasPath(object, fieldPath, label) {
  const segments = fieldPath.split('.');
  let value = object;

  for (const segment of segments) {
    assert.notEqual(value, null, `${label} ${fieldPath}`);
    assert.equal(
      Object.hasOwn(value, segment),
      true,
      `${label} must contain ${fieldPath}`
    );
    value = value[segment];
  }
}

function sourceCurrentnessRow(row, overrides = {}) {
  return Object.freeze({
    ...row,
    sourceFiles: Object.freeze([...row.sourceFiles]),
    rustIdentifiers: Object.freeze([...row.rustIdentifiers]),
    jsFactoryFields: Object.freeze([...row.jsFactoryFields]),
    jsonFieldPaths: Object.freeze([...row.jsonFieldPaths]),
    expectedFactoryValues: row.expectedFactoryValues,
    ...overrides
  });
}

function sourceCurrentnessPrototypeClaimRow(row, prototypeClaims) {
  return Object.freeze(
    Object.assign(Object.create(Object.freeze(prototypeClaims)), row)
  );
}

function sourceCurrentnessAccessorClaimRow(row, field) {
  const nextRow = {
    ...row,
    sourceFiles: Object.freeze([...row.sourceFiles]),
    rustIdentifiers: Object.freeze([...row.rustIdentifiers]),
    jsFactoryFields: Object.freeze([...row.jsFactoryFields]),
    jsonFieldPaths: Object.freeze([...row.jsonFieldPaths]),
    expectedFactoryValues: row.expectedFactoryValues
  };
  Object.defineProperty(nextRow, field, {
    get() {
      return false;
    },
    enumerable: true
  });

  return Object.freeze(nextRow);
}

function assertNoNativeLedgerExecution(record, label) {
  assert.equal(record.nativeAddonLoaded, false, `${label} addon`);
  assert.equal(record.nativeExecution, false, `${label} native`);
  assert.equal(record.nodeWorkerThreadsExecution, false, `${label} worker`);
  assert.equal(record.childProcessExecution, false, `${label} child process`);
  assert.equal(record.httpExecution, false, `${label} http`);
  assert.equal(record.httpsExecution, false, `${label} https`);
  assert.equal(record.rendererExecution, false, `${label} renderer`);
  assert.equal(record.reconcilerExecution, false, `${label} reconciler`);
  assert.equal(record.publicNativeCompatibility, false, `${label} public`);
  assert.equal(record.packageExportCompatibility, false, `${label} package`);
  assert.equal(record.compatibilityClaimed, false, `${label} compatibility`);
  assert.equal(record.reactBehaviorError, false, `${label} React behavior`);
}

function assertTrackedSourceEvidencePaths(sourceEvidencePaths, label) {
  assert.ok(Object.isFrozen(sourceEvidencePaths), `${label} frozen`);
  assert.ok(sourceEvidencePaths.length > 0, `${label} non-empty`);
  for (const sourceEvidencePath of sourceEvidencePaths) {
    assert.equal(
      sourceEvidencePath.startsWith('worker-progress/'),
      false,
      `${label} must not use deleted worker-progress evidence`
    );
    assert.equal(
      fs.existsSync(path.join(repoRoot, sourceEvidencePath)),
      true,
      `${label} ${sourceEvidencePath} exists`
    );
  }
}

function getSourceCurrentnessLedger(factory) {
  const symbols = Object.getOwnPropertySymbols(factory);
  const ledgerDescriptors = symbols
    .map((symbol) => [
      symbol,
      Object.getOwnPropertyDescriptor(factory, symbol)
    ])
    .filter(([, descriptor]) => descriptor?.value?.model === ledgerModel);

  assert.equal(
    ledgerDescriptors.length,
    1,
    'private factory must own exactly one source-currentness ledger symbol'
  );

  const [[ledgerSymbol, ledgerDescriptor]] = ledgerDescriptors;
  assert.equal(Symbol.keyFor(ledgerSymbol), undefined);
  assert.equal(ledgerSymbol.description, ledgerSymbolDescription);
  assert.equal(ledgerDescriptor.enumerable, false);
  assert.equal(ledgerDescriptor.configurable, false);
  assert.equal(ledgerDescriptor.writable, false);

  return ledgerDescriptor.value;
}

function getSourceCurrentnessLedgerValidator(ledger) {
  const descriptor = Object.getOwnPropertyDescriptor(
    ledger,
    'validateSourceCurrentnessRows'
  );

  assert.equal(typeof descriptor.value, 'function');
  assert.equal(
    descriptor.value.name,
    'validateNativeRootWorkLoopFinishedWorkMetadataSourceCurrentnessRows'
  );
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(
    Object.keys(ledger).includes('validateSourceCurrentnessRows'),
    false
  );

  return descriptor.value;
}

function assertFrozenMetadataShape(metadata) {
  assert.equal(Object.isFrozen(metadata), true);
  assert.equal(Object.isFrozen(metadata.facade), true);
  assert.equal(Object.isFrozen(metadata.completeWork), true);
  assert.equal(Object.isFrozen(metadata.completeWork.childTags), true);
  assert.equal(Object.isFrozen(metadata.pending), true);
  assert.equal(Object.isFrozen(metadata.commit), true);
  assert.equal(Object.isFrozen(metadata.placement), true);

  assert.deepEqual(metadata, {
    source: 'fast-react-reconciler.root-work-loop.finished-work-handoff',
    status: 'accepted-private-root-work-loop-finished-work-handoff-metadata',
    metadataRevision: 'root-work-loop-finished-work-handoff-2026-05-10',
    facade: {
      rootId: validOptions.rootId,
      rootTag: validOptions.rootTag,
      renderUpdateId: validOptions.renderUpdateId,
      hostType: 'div',
      hostOutputShape: 'host-component',
      hostComponentCount: 1,
      hostTextCount: 1,
      textContent: 'text'
    },
    completeWork: {
      rootChildTag: 'HostComponent',
      completedChildTag: 'HostComponent',
      hostTextChildTag: 'HostText',
      childTags: ['HostComponent', 'HostText']
    },
    pending: {
      recordsFinishedWork: true,
      pendingWorkMatchesFinishedWork: true,
      renderLanes: 'Default',
      finishedLanes: 'Default',
      remainingLanes: 'NoLanes'
    },
    commit: {
      commitOrderAfterPendingRecord: true,
      consumedFinishedWorkRecord: true,
      finishedWorkAfterCommit: null,
      finishedLanesAfterCommit: 'NoLanes',
      renderPhaseWorkAfterCommit: null,
      mutationExecutionBlocked: true,
      publicRootRenderingBlocked: true,
      effectsRefsAndHydrationBlocked: true
    },
    placement: {
      tag: 'HostComponent',
      applyKind: 'append-placement-to-container',
      siblingStatus: 'append'
    }
  });
}

function assertPrivateSourceCurrentnessLedger(factory, metadata) {
  const ledger = getSourceCurrentnessLedger(factory);
  const validateSourceCurrentnessRows =
    getSourceCurrentnessLedgerValidator(ledger);
  const rustSource = fs.readFileSync(rustMetadataSourcePath, 'utf8');
  const nativeSource = fs.readFileSync(nativeIndexPath, 'utf8');
  const testSource = fs.readFileSync(nativeMetadataFactoryTestPath, 'utf8');

  assert.equal(
    ledger.ledgerStatus,
    'blocked-private-root-work-loop-finished-work-metadata-source-currentness-ledger'
  );
  assert.equal(ledger.model, ledgerModel);
  assert.equal(
    ledger.evaluationMode,
    'static-source-token-ledger-no-native-load-no-package-export'
  );
  assert.equal(
    ledger.evidenceKind,
    'source-owned-rust-identifier-set-and-js-factory-shape'
  );
  assert.equal(
    ledger.sourceWorker,
    'worker-1228-native-metadata-no-load-source-ledger'
  );
  assert.deepEqual(ledger.sourceEvidencePaths, [
    'bindings/node/index.cjs',
    'crates/fast-react-napi/src/root_work_loop_metadata.rs',
    'bindings/node/test/native-private-root-work-loop-metadata-factory.test.cjs'
  ]);
  assertTrackedSourceEvidencePaths(
    ledger.sourceEvidencePaths,
    'source-currentness source evidence'
  );
  assert.equal(
    ledger.sourceFile,
    'crates/fast-react-napi/src/root_work_loop_metadata.rs'
  );
  assert.deepEqual(ledger.sourceFiles, [ledger.sourceFile]);
  assert.equal(ledger.sourceOwnedEvidenceRequired, true);
  assert.equal(ledger.blockedPrivateEvidenceOnly, true);
  assert.equal(ledger.publicAdmission, false);
  assert.equal(ledger.canonicalSourceEvidenceAccepted, true);
  assert.equal(ledger.acceptedEvidenceCount, 6);
  assert.equal(ledger.rejectedEvidenceCount, 0);
  assert.deepEqual(ledger.rejectedRows, []);
  assertNoNativeLedgerExecution(ledger, 'source-currentness ledger');
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
    'root-work-loop-metadata-source-status-revision',
    'root-work-loop-metadata-top-level-json-fields',
    'root-work-loop-metadata-facade-canary-values',
    'root-work-loop-metadata-complete-pending-placement-values',
    'root-work-loop-metadata-commit-blocker-booleans',
    'root-work-loop-metadata-private-factory-options'
  ]);
  assert.match(
    nativeSource,
    /source-owned-rust-identifier-set-and-js-factory-shape/u
  );
  assert.match(testSource, /Object\.create\(row\)/u);

  for (const row of ledger.rows) {
    assert.ok(Object.isFrozen(row), row.id);
    assert.ok(Object.isFrozen(row.sourceFiles), row.id);
    assert.ok(Object.isFrozen(row.rustIdentifiers), row.id);
    assert.ok(Object.isFrozen(row.jsFactoryFields), row.id);
    assert.ok(Object.isFrozen(row.jsonFieldPaths), row.id);
    assert.ok(Object.isFrozen(row.expectedFactoryValues), row.id);
    assert.deepEqual(Object.keys(row), ledger.sourceCurrentnessRowFields);
    assert.equal(row.sourceFile, ledger.sourceFile, row.id);
    assert.deepEqual(row.sourceFiles, [ledger.sourceFile], row.id);
    assert.equal(row.sourceOwnedEvidence, true, row.id);
    assert.equal(row.blockedPrivateEvidence, true, row.id);
    assert.equal(row.publicAdmission, false, row.id);
    assert.equal(row.callerShapedEvidence, false, row.id);
    assert.equal(row.proseEvidence, false, row.id);
    assert.equal(row.testTitleEvidence, false, row.id);
    assert.equal(row.errorMessageEvidence, false, row.id);
    assert.equal(row.sourceSyntaxOnly, false, row.id);
    assertNoNativeLedgerExecution(row, row.id);

    for (const rustIdentifier of row.rustIdentifiers) {
      assert.ok(
        rustSource.includes(rustIdentifier),
        `${row.id} Rust source identifier ${rustIdentifier}`
      );
    }

    for (const fieldPath of row.jsFactoryFields) {
      if (fieldPath.startsWith('options.')) {
        assertHasPath(validOptions, fieldPath.slice('options.'.length), row.id);
      } else {
        assertHasPath(metadata, fieldPath, row.id);
      }
    }

    for (const jsonFieldPath of row.jsonFieldPaths) {
      const jsonField = jsonFieldPath.split('.').at(-1);
      assert.ok(
        rustSource.includes(`"${jsonField}"`),
        `${row.id} Rust JSON field ${jsonFieldPath}`
      );
    }

    for (const [fieldPath, expected] of Object.entries(
      row.expectedFactoryValues
    )) {
      assert.deepEqual(
        getValueAtPath(metadata, fieldPath),
        expected,
        `${row.id} JS factory value ${fieldPath}`
      );
      if (typeof expected === 'string') {
        assert.ok(
          rustSource.includes(JSON.stringify(expected)),
          `${row.id} Rust canary string ${fieldPath}`
        );
      }
    }
  }

  const mirrored = validateSourceCurrentnessRows(ledger.rows);
  assert.notEqual(mirrored, ledger);
  assert.deepEqual(mirrored, ledger);
  assert.ok(Object.isFrozen(mirrored));
  assert.ok(Object.isFrozen(mirrored.rows));
  assertNoNativeLedgerExecution(
    mirrored,
    'mirrored source-currentness ledger'
  );

  const canonicalSource = ledger.rows[0];
  const canonicalFields = ledger.rows[1];
  const canonicalCommit = ledger.rows[4];
  const canonicalOptions = ledger.rows[5];
  const codes = ledger.rejectionCodes;

  const inheritedCanonicalRowsResult = validateSourceCurrentnessRows(
    ledger.rows.map((row) => Object.create(row))
  );
  assert.equal(inheritedCanonicalRowsResult.acceptedEvidenceCount, 0);
  assert.equal(
    inheritedCanonicalRowsResult.rejectedEvidenceCount,
    ledger.rows.length
  );
  assert.equal(
    inheritedCanonicalRowsResult.canonicalSourceEvidenceAccepted,
    false
  );
  assertNoNativeLedgerExecution(
    inheritedCanonicalRowsResult,
    'source-currentness inherited canonical rows'
  );
  for (const row of inheritedCanonicalRowsResult.rows) {
    assert.equal(row.status, ledger.rejectedStatus);
    assert.equal(row.code, codes.callerBuilt);
    assert.equal(row.id, null);
    assert.equal(row.role, null);
    assert.equal(row.sourceFile, null);
    assert.deepEqual(row.sourceFiles, []);
    assert.equal(row.evidenceKind, null);
    assert.deepEqual(row.rustIdentifiers, []);
    assert.deepEqual(row.jsFactoryFields, []);
    assert.deepEqual(row.jsonFieldPaths, []);
    assert.deepEqual(row.expectedFactoryValues, {});
    assert.equal(row.sourceOwnedEvidence, false);
    assert.equal(row.blockedPrivateEvidence, false);
    assert.equal(row.publicAdmission, false);
    assert.equal(row.callerShapedEvidence, false);
    assertNoNativeLedgerExecution(
      row,
      'source-currentness inherited canonical row'
    );
  }

  for (const diagnosticCase of [
    {
      id: 'root-work-loop-metadata-prototype-public-claim-alias',
      row: sourceCurrentnessPrototypeClaimRow(canonicalCommit, {
        publicRuntimeExecutionClaimed: true
      }),
      code: codes.publicNativeExecutionClaim
    },
    {
      id: 'root-work-loop-metadata-prototype-package-claim-alias',
      row: sourceCurrentnessPrototypeClaimRow(canonicalCommit, {
        packageExportsChanged: true
      }),
      code: codes.packageExportClaim
    },
    {
      id: 'root-work-loop-metadata-accessor-native-addon-claim',
      row: sourceCurrentnessAccessorClaimRow(
        canonicalCommit,
        'nativeAddonLoadAttempted'
      ),
      code: codes.nativeAddonLoadClaim
    }
  ]) {
    const result = validateSourceCurrentnessRows([diagnosticCase.row]);
    assert.equal(result.acceptedEvidenceCount, 0, diagnosticCase.id);
    assert.equal(result.rejectedEvidenceCount, 1, diagnosticCase.id);
    assert.equal(
      result.canonicalSourceEvidenceAccepted,
      false,
      diagnosticCase.id
    );

    const [row] = result.rows;
    assert.equal(row.id, canonicalCommit.id, diagnosticCase.id);
    assert.equal(row.status, ledger.rejectedStatus, diagnosticCase.id);
    assert.equal(row.code, diagnosticCase.code, diagnosticCase.id);
    assert.equal(row.nativeAddonLoaded, false, diagnosticCase.id);
    assert.equal(row.nativeExecution, false, diagnosticCase.id);
    assert.equal(row.packageExportCompatibility, false, diagnosticCase.id);
    assertNoNativeLedgerExecution(result, diagnosticCase.id);
    assertNoNativeLedgerExecution(row, diagnosticCase.id);
  }

  const cases = [
    {
      row: sourceCurrentnessRow(canonicalSource, {
        sourceFile: 'crates/fast-react-napi/src/stale_root_work_loop.rs',
        sourceFiles: Object.freeze([
          'crates/fast-react-napi/src/stale_root_work_loop.rs'
        ])
      }),
      code: codes.staleOrForeign
    },
    {
      row: sourceCurrentnessRow(canonicalSource, {
        rustIdentifiers: Object.freeze(
          canonicalSource.rustIdentifiers.slice(0, -1)
        )
      }),
      code: codes.rustIdentifierMismatch
    },
    {
      row: sourceCurrentnessRow(canonicalFields, {
        id: 'root-work-loop-metadata-fake-js-only-row',
        role: 'caller-js-only-row',
        rustIdentifiers: Object.freeze([
          'createNativeRootWorkLoopFinishedWorkMetadataForCanary'
        ]),
        jsFactoryFields: Object.freeze(['source']),
        jsonFieldPaths: Object.freeze(['source'])
      }),
      code: codes.staleOrForeign
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-public-native-claim',
        nativeExecution: true,
        publicNativeCompatibility: true
      }),
      code: codes.publicNativeExecutionClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-public-root-execution-claim',
        publicRootExecution: true
      }),
      code: codes.publicNativeExecutionClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-public-root-compatibility-surface-claim',
        publicRootCompatibilitySurface: true
      }),
      code: codes.publicNativeExecutionClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-package-export-claim',
        packageExportCompatibility: true,
        packageExportClaimed: true
      }),
      code: codes.packageExportClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-package-export-compatibility-claimed',
        packageExportCompatibilityClaimed: true
      }),
      code: codes.packageExportClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-native-private-subpaths-exported',
        nativePrivateSubpathsExported: true
      }),
      code: codes.packageExportClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-native-addon-load-claim',
        nativeAddonLoaded: true
      }),
      code: codes.nativeAddonLoadClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-native-addon-load-attempted',
        nativeAddonLoadAttempted: true
      }),
      code: codes.nativeAddonLoadClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-cleanup-hook-execution-claim',
        napiCleanupHookExecution: true
      }),
      code: codes.nativeAddonLoadClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-cleanup-hook-public-claim',
        cleanupHookPublicExecutionClaimed: true
      }),
      code: codes.nativeAddonLoadClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-worker-network-claim',
        childProcessExecution: true,
        httpExecution: true,
        httpsExecution: true,
        nodeWorkerThreadsExecution: true,
        workerThreadCreationAttempted: true
      }),
      code: codes.workerOrNetworkExecutionClaim
    },
    {
      row: sourceCurrentnessRow(canonicalCommit, {
        id: 'root-work-loop-metadata-renderer-reconciler-claim',
        rendererExecution: true,
        reconcilerExecution: true
      }),
      code: codes.rendererReconcilerOutputClaim
    },
    {
      row: sourceCurrentnessRow(canonicalOptions, {
        id: 'root-work-loop-metadata-compatibility-claim',
        compatibilityClaimed: true
      }),
      code: codes.compatibilityClaim
    },
    {
      row: sourceCurrentnessRow(canonicalOptions, {
        id: 'root-work-loop-metadata-prose-evidence',
        evidenceKind: 'prose',
        proseEvidence: true
      }),
      code: codes.proseEvidence
    },
    {
      row: sourceCurrentnessRow(canonicalOptions, {
        id: 'root-work-loop-metadata-test-title-evidence',
        evidenceKind: 'test-title',
        testTitleEvidence: true
      }),
      code: codes.proseEvidence
    },
    {
      row: sourceCurrentnessRow(canonicalOptions, {
        id: 'root-work-loop-metadata-error-message-evidence',
        evidenceKind: 'error-message',
        errorMessageEvidence: true
      }),
      code: codes.proseEvidence
    },
    {
      row: sourceCurrentnessRow(canonicalOptions, {
        id: 'root-work-loop-metadata-source-syntax-only',
        evidenceKind: 'source-syntax',
        sourceSyntaxOnly: true
      }),
      code: codes.sourceSyntaxOnly
    }
  ];

  for (const diagnosticCase of cases) {
    const result = validateSourceCurrentnessRows([diagnosticCase.row]);
    assert.ok(Object.isFrozen(result), diagnosticCase.row.id);
    assert.equal(result.rows.length, 1, diagnosticCase.row.id);
    assert.equal(result.acceptedEvidenceCount, 0, diagnosticCase.row.id);
    assert.equal(result.rejectedEvidenceCount, 1, diagnosticCase.row.id);
    assert.equal(
      result.canonicalSourceEvidenceAccepted,
      false,
      diagnosticCase.row.id
    );
    assertNoNativeLedgerExecution(result, diagnosticCase.row.id);

    const [row] = result.rows;
    assert.equal(row.id, diagnosticCase.row.id);
    assert.equal(row.status, ledger.rejectedStatus, diagnosticCase.row.id);
    assert.equal(row.code, diagnosticCase.code, diagnosticCase.row.id);
    assertNoNativeLedgerExecution(row, diagnosticCase.row.id);
  }

  const fullCanonicalClaimCases = [
    {
      field: 'runtimeExecutionClaimed',
      code: codes.publicNativeExecutionClaim
    },
    {
      field: 'workerThreadLoadAttempted',
      code: codes.workerOrNetworkExecutionClaim
    },
    {
      field: 'childProcessLoadAttempted',
      code: codes.workerOrNetworkExecutionClaim
    },
    {
      field: 'httpLoadAttempted',
      code: codes.workerOrNetworkExecutionClaim
    },
    {
      field: 'httpsLoadAttempted',
      code: codes.workerOrNetworkExecutionClaim
    },
    {
      field: 'publicRuntimeExecutionClaimed',
      code: codes.publicNativeExecutionClaim
    },
    {
      field: 'nativeLoadAttempted',
      code: codes.nativeAddonLoadClaim
    },
    {
      field: 'cleanupHookExecutionClaimed',
      code: codes.nativeAddonLoadClaim
    },
    {
      field: 'packageExportsChanged',
      code: codes.packageExportClaim
    }
  ];

  for (const diagnosticCase of fullCanonicalClaimCases) {
    const result = validateSourceCurrentnessRows(
      ledger.rows.map((row) =>
        row.id === canonicalCommit.id
          ? sourceCurrentnessRow(row, {
              [diagnosticCase.field]: true
            })
          : row
      )
    );
    const claimRow = result.rows.find(
      (row) => row.id === canonicalCommit.id
    );

    assert.equal(result.acceptedEvidenceCount, 0, diagnosticCase.field);
    assert.equal(
      result.rejectedEvidenceCount,
      ledger.rows.length,
      diagnosticCase.field
    );
    assert.equal(
      result.canonicalSourceEvidenceAccepted,
      false,
      diagnosticCase.field
    );
    assert.equal(
      result.rows.some((row) => row.status === ledger.acceptedStatus),
      false,
      diagnosticCase.field
    );
    assert.equal(claimRow.status, ledger.rejectedStatus, diagnosticCase.field);
    assert.equal(claimRow.code, diagnosticCase.code, diagnosticCase.field);
    assert.equal(
      Object.hasOwn(claimRow, diagnosticCase.field),
      false,
      diagnosticCase.field
    );
    assertNoNativeLedgerExecution(result, diagnosticCase.field);
    assertNoNativeLedgerExecution(claimRow, diagnosticCase.field);
  }

  const fullCanonicalKnownFieldCases = [
    {
      field: 'packageExportCompatibility',
      code: codes.packageExportClaim,
      rejectedValue: false
    },
    {
      field: 'proseEvidence',
      code: codes.proseEvidence,
      rejectedValue: true
    },
    {
      field: 'errorMessageEvidence',
      code: codes.proseEvidence,
      rejectedValue: true
    }
  ];

  for (const diagnosticCase of fullCanonicalKnownFieldCases) {
    const result = validateSourceCurrentnessRows(
      ledger.rows.map((row) =>
        row.id === canonicalCommit.id
          ? sourceCurrentnessRow(row, {
              [diagnosticCase.field]: true
            })
          : row
      )
    );
    const claimRow = result.rows.find(
      (row) => row.id === canonicalCommit.id
    );

    assert.equal(result.acceptedEvidenceCount, 0, diagnosticCase.field);
    assert.equal(
      result.rejectedEvidenceCount,
      ledger.rows.length,
      diagnosticCase.field
    );
    assert.equal(
      result.canonicalSourceEvidenceAccepted,
      false,
      diagnosticCase.field
    );
    assert.equal(
      result.rows.some((row) => row.status === ledger.acceptedStatus),
      false,
      diagnosticCase.field
    );
    assert.equal(claimRow.status, ledger.rejectedStatus, diagnosticCase.field);
    assert.equal(claimRow.code, diagnosticCase.code, diagnosticCase.field);
    assert.equal(
      claimRow[diagnosticCase.field],
      diagnosticCase.rejectedValue,
      diagnosticCase.field
    );
    assertNoNativeLedgerExecution(result, diagnosticCase.field);
    assertNoNativeLedgerExecution(claimRow, diagnosticCase.field);
  }

  for (const diagnosticCase of [
    {
      id: 'root-work-loop-metadata-missing-canonical-row',
      rows: [canonicalSource]
    },
    {
      id: 'root-work-loop-metadata-duplicate-canonical-row',
      rows: [canonicalSource, canonicalSource]
    }
  ]) {
    const result = validateSourceCurrentnessRows(diagnosticCase.rows);
    assert.equal(result.acceptedEvidenceCount, 0, diagnosticCase.id);
    assert.equal(
      result.rejectedEvidenceCount,
      diagnosticCase.rows.length,
      diagnosticCase.id
    );
    assert.equal(
      result.canonicalSourceEvidenceAccepted,
      false,
      diagnosticCase.id
    );

    for (const row of result.rows) {
      assert.equal(row.status, ledger.rejectedStatus, diagnosticCase.id);
      assert.equal(row.code, codes.canonicalSetMismatch, diagnosticCase.id);
      assertNoNativeLedgerExecution(row, diagnosticCase.id);
    }
  }

  const publicClaimResult = validateSourceCurrentnessRows([
    cases.find(
      (diagnosticCase) =>
        diagnosticCase.code === codes.publicNativeExecutionClaim
    ).row
  ]);
  const publicClaimRevalidated = validateSourceCurrentnessRows([
    publicClaimResult.rows[0]
  ]);
  assert.equal(publicClaimRevalidated.acceptedEvidenceCount, 0);
  assert.equal(publicClaimRevalidated.rejectedEvidenceCount, 1);
  assert.equal(
    publicClaimRevalidated.rows[0].code,
    codes.publicNativeExecutionClaim
  );
  assertNoNativeLedgerExecution(
    publicClaimRevalidated.rows[0],
    'source-currentness revalidated public claim'
  );
}

async function main() {
  const descriptor = Object.getOwnPropertyDescriptor(native, factorySymbol);

  assert.ok(descriptor, 'private factory symbol descriptor exists');
  assert.equal(descriptor.enumerable, false);
  assert.equal(descriptor.configurable, false);
  assert.equal(descriptor.writable, false);
  assert.equal(typeof descriptor.value, 'function');
  assert.equal(native[factorySymbol], descriptor.value);
  assert.equal(descriptor.value.name, factoryName);
  assert.equal(Object.isFrozen(descriptor.value), true);
  assert.equal(Object.getOwnPropertySymbols(native).includes(factorySymbol), true);
  assertNoPublicStringKeyLeak(native, 'CommonJS native binding');

  const nativeEsm = await import('../index.mjs');
  assert.equal(Object.hasOwn(nativeEsm, factoryName), false);
  assert.equal(Object.hasOwn(nativeEsm, factorySymbol), false);
  assertNoPublicStringKeyLeak(nativeEsm, 'ESM namespace');
  assert.equal(nativeEsm.default[factorySymbol], descriptor.value);

  const metadata = descriptor.value(validOptions);
  assertFrozenMetadataShape(metadata);
  assertPrivateSourceCurrentnessLedger(descriptor.value, metadata);

  for (const [label, input] of [
    ['missing options', undefined],
    ['empty rootId', { ...validOptions, rootId: '' }],
    ['wrong rootTag type', { ...validOptions, rootTag: 0 }],
    ['empty renderUpdateId', { ...validOptions, renderUpdateId: '' }],
    ['wrong hostType', { ...validOptions, hostType: 'section' }],
    ['wrong textContent', { ...validOptions, textContent: 'Text' }],
    ['unknown option', { ...validOptions, renderPhase: 'complete' }]
  ]) {
    assertFactoryError(input, invalidOptionsCode, label);
  }

  const accessorClaimOptions = { ...validOptions };
  Object.defineProperty(accessorClaimOptions, 'compatibilityClaimed', {
    get() {
      return false;
    },
    enumerable: true
  });

  for (const [label, input] of [
    ['top-level native execution claim', { ...validOptions, nativeExecution: true }],
    [
      'top-level public root execution claim',
      { ...validOptions, publicRootExecution: true }
    ],
    [
      'nested DOM mutation claim',
      { ...validOptions, facade: { domMutationClaimed: true } }
    ],
    ['accessor compatibility claim', accessorClaimOptions]
  ]) {
    assertFactoryError(input, capabilityClaimCode, label);
  }
}

main()
  .then(() => {
    console.log(
      'Fast React native private root work-loop metadata factory checks passed.'
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
