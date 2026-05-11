'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const ReactDOM = require(path.join(packageRoot, 'index.js'));
const ReactDOMProfiling = require(path.join(packageRoot, 'profiling.js'));
const guard = require(path.join(
  packageRoot,
  'src/shared/flush-sync-guard.js'
));

test('public React DOM flushSync placeholders throw before invoking callbacks', () => {
  assertPublicFlushSyncPlaceholder(ReactDOM, 'react-dom');
  assertPublicFlushSyncPlaceholder(ReactDOMProfiling, 'react-dom/profiling');
});

test('public React DOM flushSync blocked currentness stays source-owned and fail-closed', () => {
  const report =
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport();
  const consumption =
    guard.consumePublicReactDomFlushSyncBlockedCurrentnessReport(report);

  assert.equal(
    guard.isAcceptedPublicReactDomFlushSyncBlockedCurrentnessReport(report),
    true
  );
  assert.equal(report.kind, guard.publicFlushSyncBlockedCurrentnessKind);
  assert.equal(report.status, guard.publicFlushSyncBlockedCurrentnessStatus);
  assert.equal(
    consumption.status,
    guard.publicFlushSyncBlockedCurrentnessConsumptionStatus
  );
  assert.deepEqual(
    report.entrypoints,
    guard.publicFlushSyncBlockedCurrentnessEntrypoints
  );
  assert.deepEqual(
    consumption.entrypoints,
    ['react-dom', 'react-dom/profiling']
  );
  assert.deepEqual(
    report.scenarioIds,
    guard.publicFlushSyncBlockedCurrentnessScenarios
  );
  assert.deepEqual(report.acceptedWorkerIds, [
    'worker-694-sync-flush-nested-act-root-continuation',
    'worker-718-sync-flush-root-scheduler-finished-work-handoff',
    'worker-901-react-dom-render-lifecycle-boundary-consumer'
  ]);
  assert.deepEqual(report.excludedWorkerIds, [
    'worker-910-hydration-recoverable-error-boundary-admission'
  ]);
  assert.deepEqual(report.publicFlushSyncExports, [
    {
      entrypoint: 'react-dom',
      hasOwn: true,
      exportKeysInclude: true,
      value: {
        type: 'function',
        name: '',
        length: 1,
        thenable: false
      }
    },
    {
      entrypoint: 'react-dom/profiling',
      hasOwn: true,
      exportKeysInclude: true,
      value: {
        type: 'function',
        name: '',
        length: 1,
        thenable: false
      }
    }
  ]);
  assert.deepEqual(
    report.sourceRows.map((row) => ({
      rowId: row.rowId,
      entrypoint: row.entrypoint,
      packageSource: row.packageSource,
      guardSource: row.guardSource,
      placeholderFactorySource: row.placeholderFactorySource,
      placeholderFactory: row.placeholderFactory,
      exportName: row.exportName,
      sourceOwned: row.sourceOwned,
      sourceCurrent: row.sourceCurrent
    })),
    [
      {
        rowId: 'react-dom-public-flush-sync-placeholder-source',
        entrypoint: 'react-dom',
        packageSource: 'packages/react-dom/index.js',
        guardSource: 'packages/react-dom/src/shared/flush-sync-guard.js',
        placeholderFactorySource: 'packages/react-dom/placeholder-utils.js',
        placeholderFactory: 'createUnsupportedFunction',
        exportName: 'flushSync',
        sourceOwned: true,
        sourceCurrent: true
      },
      {
        rowId: 'react-dom-profiling-public-flush-sync-placeholder-source',
        entrypoint: 'react-dom/profiling',
        packageSource: 'packages/react-dom/profiling.js',
        guardSource: 'packages/react-dom/src/shared/flush-sync-guard.js',
        placeholderFactorySource: 'packages/react-dom/placeholder-utils.js',
        placeholderFactory: 'createUnsupportedFunction',
        exportName: 'flushSync',
        sourceOwned: true,
        sourceCurrent: true
      }
    ]
  );
  assert.deepEqual(consumption.sourceRows, report.sourceRows);
  for (const row of report.sourceRows) {
    assert.equal(Object.isFrozen(row), true, row.rowId);
    assert.equal(row.descriptorSnapshotReadable, true, row.rowId);
    assert.equal(row.descriptorOwn, true, row.rowId);
    assert.equal(row.descriptorData, true, row.rowId);
    assert.equal(row.descriptorEnumerable, true, row.rowId);
    assert.equal(row.descriptorConfigurable, true, row.rowId);
    assert.equal(row.descriptorWritable, true, row.rowId);
    assert.equal(row.exportKeysInclude, true, row.rowId);
    assert.equal(row.reflectOwnKeysInclude, true, row.rowId);
    assert.equal(row.functionType, 'function', row.rowId);
    assert.equal(row.functionName, '', row.rowId);
    assert.equal(row.functionLength, 1, row.rowId);
    assert.equal(row.functionThenable, false, row.rowId);
    assert.equal(row.placeholderMetadataOwn, true, row.rowId);
    assert.equal(row.placeholderMetadataEnumerable, false, row.rowId);
    assert.equal(row.placeholderMetadataValue, true, row.rowId);
    assert.equal(row.entrypointMetadataOwn, true, row.rowId);
    assert.equal(row.entrypointMetadataEnumerable, false, row.rowId);
    assert.equal(row.entrypointMetadataValue, row.entrypoint, row.rowId);
    assert.equal(row.compatibilityTargetMetadataOwn, true, row.rowId);
    assert.equal(row.compatibilityTargetMetadataEnumerable, false, row.rowId);
    assert.equal(
      row.compatibilityTargetMetadataValue,
      'react-dom@19.2.6',
      row.rowId
    );
    assert.deepEqual(
      row.acceptedPrivateBlockerWorkerIds,
      report.acceptedWorkerIds,
      row.rowId
    );
    assert.deepEqual(
      row.acceptedPrivateBlockerPrerequisiteIds,
      guard.privateSyncFlushRootHandoffPrerequisiteIds,
      row.rowId
    );
    assert.equal(
      row.publicRootBlockedLifecycleWorkerId,
      'worker-901-react-dom-render-lifecycle-boundary-consumer',
      row.rowId
    );
    assert.equal(
      row.publicRootBlockedLifecycleProgressPath,
      'worker-progress/worker-901-react-dom-render-lifecycle-boundary-consumer.md',
      row.rowId
    );
    assert.deepEqual(
      row.excludedPrivateBlockerWorkerIds,
      report.excludedWorkerIds,
      row.rowId
    );
    assert.deepEqual(row.ownPublicCompatibilityClaimKeys, [], row.rowId);
    assert.deepEqual(row.hiddenPublicCompatibilityAliasKeys, [], row.rowId);
    assert.deepEqual(row.symbolPublicCompatibilityClaimKeys, [], row.rowId);
    assert.deepEqual(
      row.nonEnumerablePublicCompatibilityClaimKeys,
      [],
      row.rowId
    );
    assert.deepEqual(row.accessorPublicCompatibilityClaimKeys, [], row.rowId);
    assert.deepEqual(row.inheritedPublicCompatibilityClaimKeys, [], row.rowId);
    assert.deepEqual(row.functionPublicCompatibilityClaimKeys, [], row.rowId);
    assert.equal(row.publicFlushSyncCompatibilityClaimed, false, row.rowId);
    assert.equal(
      row.publicSchedulerTimingCompatibilityClaimed,
      false,
      row.rowId
    );
    assert.equal(row.publicActTimingCompatibilityClaimed, false, row.rowId);
    assert.equal(row.publicRootCompatibilityClaimed, false, row.rowId);
    assert.equal(row.publicPackageCompatibilityClaimed, false, row.rowId);
    assert.equal(row.packageCompatibilityClaimed, false, row.rowId);
    assert.equal(row.profilingCompatibilityClaimed, false, row.rowId);
    assert.equal(row.drainsPublicSchedulerTaskQueue, false, row.rowId);
    assert.equal(row.drainsPublicReactActQueue, false, row.rowId);
    assert.equal(row.publicRootExecution, false, row.rowId);
    assert.equal(row.executesPublicFlushSync, false, row.rowId);
    assert.equal(row.executesPublicDomMutation, false, row.rowId);
    assert.equal(row.compatibilityClaimed, false, row.rowId);
  }

  assert.equal(consumption.publicReactDomFlushSyncUnsupportedPlaceholder, true);
  assert.equal(consumption.publicProfilingFlushSyncUnsupportedPlaceholder, true);
  assert.equal(consumption.callbackInvocationBlocked, true);
  assert.equal(consumption.thenableReturnBlocked, true);
  assert.equal(consumption.returnValueCompatibilityBlocked, true);
  assert.equal(consumption.invokesCallback, false);
  assert.equal(consumption.returnsThenable, false);
  assert.equal(consumption.returnValueCompatibilityClaimed, false);
  assert.equal(consumption.publicFlushSyncReady, false);
  assert.equal(consumption.privateRoutingReady, false);
  assert.equal(
    consumption.privateSyncFlushRowsOpenPublicCallbackExecution,
    false
  );
  assert.equal(consumption.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(consumption.publicActTimingCompatibilityClaimed, false);
  assert.equal(consumption.publicRootSchedulerCompatibilityClaimed, false);
  assert.equal(consumption.publicRootCompatibilityClaimed, false);
  assert.equal(consumption.publicPackageCompatibilityClaimed, false);
  assert.equal(consumption.packageCompatibilityClaimed, false);
  assert.equal(consumption.packageSurfaceChanged, false);
  assert.equal(consumption.profilingCompatibilityClaimed, false);
  assert.equal(consumption.profilingPackageCompatibilityClaimed, false);
  assert.equal(consumption.drainsPublicSchedulerTaskQueue, false);
  assert.equal(consumption.publicRootExecution, false);
  assert.equal(consumption.executesPublicFlushSync, false);
  assert.equal(consumption.executesRendererRoots, false);
  assert.equal(consumption.compatibilityClaimed, false);

  assert.equal(
    report.privatePrerequisites.acceptedPrivateSyncFlushRootHandoffDiagnosticsReady,
    true
  );
  assert.deepEqual(
    report.privatePrerequisites
      .acceptedPrivateSyncFlushRootHandoffPrerequisiteIds,
    guard.privateSyncFlushRootHandoffPrerequisiteIds
  );
  assert.equal(
    report.privatePrerequisites.publicRootBlockedLifecycleWorkerId,
    'worker-901-react-dom-render-lifecycle-boundary-consumer'
  );
  assert.equal(report.privatePrerequisites.consumesWorker910Evidence, false);
  assert.equal(report.privatePrerequisites.acceptsFutureWorkerEvidence, false);

  for (const scenario of report.scenarios) {
    assert.equal(scenario.rootless, true, scenario.scenarioId);
    assert.equal(scenario.callbackInvoked, false, scenario.scenarioId);
    assert.equal(scenario.returnedThenable, false, scenario.scenarioId);
    assert.equal(
      scenario.returnValueCompatibilityClaimed,
      false,
      scenario.scenarioId
    );
    assert.equal(scenario.consoleCalls.length, 0, scenario.scenarioId);
    assert.equal(
      scenario.publicFlushSyncCompatibilityClaimed,
      false,
      scenario.scenarioId
    );
    assert.equal(
      scenario.publicSchedulerTimingCompatibilityClaimed,
      false,
      scenario.scenarioId
    );
    assert.equal(
      scenario.packageCompatibilityClaimed,
      false,
      scenario.scenarioId
    );
    assert.equal(
      scenario.profilingCompatibilityClaimed,
      false,
      scenario.scenarioId
    );
    assert.equal(scenario.callAttempt.status, 'throws', scenario.scenarioId);
    assert.equal(
      scenario.callAttempt.error.name,
      'FastReactDomUnimplementedError',
      scenario.scenarioId
    );
    assert.equal(
      scenario.callAttempt.error.code,
      'FAST_REACT_UNIMPLEMENTED',
      scenario.scenarioId
    );
    assert.equal(
      scenario.callAttempt.error.exportName,
      'flushSync',
      scenario.scenarioId
    );
    assert.equal(
      scenario.callAttempt.error.entrypoint,
      scenario.entrypoint,
      scenario.scenarioId
    );
  }

  assertFlushSyncCurrentnessRejected(
    Object.freeze({
      ...report
    }),
    'public-react-dom-flush-sync-currentness-source-proof'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      scenarios: report.scenarios
    }),
    'public-react-dom-flush-sync-currentness-caller-overrides'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      sourceRows: report.sourceRows.map((row) => ({ ...row }))
    }),
    'public-react-dom-flush-sync-currentness-source-rows-source-proof'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      sourceRowOverrides: {
        [report.sourceRows[0].rowId]: {
          packageSource: 'packages/react-dom/stale-index.js'
        }
      }
    }),
    'public-react-dom-flush-sync-currentness-source-rows'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      sourceRowOverrides: {
        [report.sourceRows[1].rowId]: {
          acceptedPrivateBlockerWorkerIds: [
            ...report.acceptedWorkerIds,
            'worker-981-resource-form-root-execution-currentness'
          ]
        }
      }
    }),
    'public-react-dom-flush-sync-currentness-source-rows'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      sourceRowOverrides: {
        [report.sourceRows[0].rowId]: {
          hiddenPublicCompatibilityAliasKeys: ['Symbol(flushSync)']
        }
      }
    }),
    'public-react-dom-flush-sync-currentness-source-rows'
  );
  const nonEnumerableScenarioOverride = {};
  Object.defineProperty(nonEnumerableScenarioOverride, 'scenarios', {
    configurable: true,
    enumerable: false,
    value: report.scenarios
  });
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(
      nonEnumerableScenarioOverride
    ),
    'public-react-dom-flush-sync-currentness-caller-overrides'
  );
  const deletingScenarioOverride = {};
  Object.defineProperty(deletingScenarioOverride, 'scenarios', {
    configurable: true,
    enumerable: false,
    get() {
      delete deletingScenarioOverride.scenarios;
      return report.scenarios;
    }
  });
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(
      deletingScenarioOverride
    ),
    'public-react-dom-flush-sync-currentness-caller-overrides'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(
      Object.create({ scenarios: report.scenarios })
    ),
    'public-react-dom-flush-sync-currentness-caller-overrides'
  );
  const proxyScenarioOverride = new Proxy(
    {},
    {
      ownKeys() {
        return [];
      },
      getOwnPropertyDescriptor() {
        return undefined;
      },
      get(_target, key) {
        return key === 'scenarios' ? report.scenarios : undefined;
      }
    }
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(
      proxyScenarioOverride
    ),
    'public-react-dom-flush-sync-currentness-caller-overrides'
  );
  const proxyNativeClaimOverride = new Proxy(
    {},
    {
      ownKeys() {
        return [];
      },
      getOwnPropertyDescriptor() {
        return undefined;
      },
      get(_target, key) {
        return key === 'nativeExecution' ? true : undefined;
      }
    }
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(
      proxyNativeClaimOverride
    ),
    'public-react-dom-flush-sync-currentness-caller-overrides'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      publicFlushSyncCompatibilityClaimed: true
    }),
    'public-react-dom-flush-sync-currentness-public-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      publicSchedulerTimingCompatibilityClaimed: 'yes'
    }),
    'public-react-dom-flush-sync-currentness-public-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      publicProfilingFlushSyncCompatibilityClaimed: 'yes'
    }),
    'public-react-dom-flush-sync-currentness-public-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      publicActTimingCompatibilityClaimed: 'yes'
    }),
    'public-react-dom-flush-sync-currentness-public-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      profilingCompatibilityClaimed: true
    }),
    'public-react-dom-flush-sync-currentness-package-compatibility-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      packageCompatibilityClaimed: 'yes'
    }),
    'public-react-dom-flush-sync-currentness-package-compatibility-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      publicPackageCompatibilityClaimed: 'yes'
    }),
    'public-react-dom-flush-sync-currentness-package-compatibility-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      profilingPackageCompatibilityClaimed: 'yes'
    }),
    'public-react-dom-flush-sync-currentness-package-compatibility-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      scenarios: replaceCurrentnessScenario(report, 0, {
        callbackInvoked: true
      })
    }),
    'public-react-dom-flush-sync-currentness-callback-invoked'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      scenarios: replaceCurrentnessScenario(report, 2, {
        callAttempt: {
          status: 'ok',
          value: {
            type: 'object',
            thenable: true
          }
        },
        returnedThenable: true
      })
    }),
    'public-react-dom-flush-sync-currentness-thenable-returned'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      returnValueCompatibilityClaimed: true
    }),
    'public-react-dom-flush-sync-currentness-return-compatibility-claim'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      drainsPublicSchedulerTaskQueue: true,
      publicRootExecution: true,
      privateSyncFlushRowsOpenPublicCallbackExecution: true
    }),
    'public-react-dom-flush-sync-currentness-prerequisite-smuggling'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      publicRootExecution: 'yes'
    }),
    'public-react-dom-flush-sync-currentness-prerequisite-smuggling'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        consumesWorker910Evidence: true
      }
    }),
    'public-react-dom-flush-sync-currentness-private-prerequisite-boundary'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        privateSyncFlushRowsOpenPublicCallbackExecution: 'yes'
      }
    }),
    'public-react-dom-flush-sync-currentness-private-prerequisite-boundary'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        acceptedPrivateSyncFlushRows: replacePrivatePrerequisiteRow(
          report,
          0,
          {
            evidenceFresh: false
          }
        )
      }
    }),
    'public-react-dom-flush-sync-currentness-private-prerequisite-boundary'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        acceptedPrivateSyncFlushRows: replacePrivatePrerequisiteRow(
          report,
          2,
          {
            publicRootStillBlocked: false
          }
        )
      }
    }),
    'public-react-dom-flush-sync-currentness-private-prerequisite-boundary'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        acceptedPrivateSyncFlushRows: replacePrivatePrerequisiteRow(
          report,
          0,
          {
            consumesWorker910Evidence: true
          }
        )
      }
    }),
    'public-react-dom-flush-sync-currentness-private-prerequisite-boundary'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        acceptedPrivateSyncFlushRows: replacePrivatePrerequisiteRow(
          report,
          1,
          {
            executesPublicDomMutation: true
          }
        )
      }
    }),
    'public-react-dom-flush-sync-currentness-private-prerequisite-boundary'
  );
  assertFlushSyncCurrentnessRejected(
    guard.createPublicReactDomFlushSyncBlockedCurrentnessReport({
      privatePrerequisites: {
        ...report.privatePrerequisites,
        acceptedPrivateSyncFlushRows: replacePrivatePrerequisiteRow(
          report,
          1,
          {
            publicPackageCompatibilityClaimed: 'yes',
            profilingCompatibilityClaimed: 'yes',
            publicFlushSyncCompatibilityClaimed: 'yes'
          }
        )
      }
    }),
    'public-react-dom-flush-sync-currentness-private-prerequisite-boundary'
  );
});

test('public React DOM flushSync source rows reject hidden entrypoint claims', () => {
  withTemporaryOwnProperty(
    ReactDOM,
    '__FAST_REACT_TEST_FLUSH_SYNC_ALIAS__',
    {
      configurable: true,
      enumerable: false,
      value: ReactDOM.flushSync
    },
    () => {
      assertFlushSyncCurrentnessRejected(
        guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
        'public-react-dom-flush-sync-currentness-source-rows'
      );
    }
  );

  withTemporaryOwnProperty(
    ReactDOMProfiling,
    Symbol.for('publicFlushSyncCompatibilityClaimed'),
    {
      configurable: true,
      enumerable: false,
      value: true
    },
    () => {
      assertFlushSyncCurrentnessRejected(
        guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
        'public-react-dom-flush-sync-currentness-source-rows'
      );
    }
  );

  withTemporaryOwnProperty(
    ReactDOM,
    'publicNativeCompatibilityClaimed',
    {
      configurable: true,
      enumerable: true,
      value: true
    },
    () => {
      assertFlushSyncCurrentnessRejected(
        guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
        'public-react-dom-flush-sync-currentness-source-rows'
      );
    }
  );

  withTemporaryOwnProperty(
    ReactDOMProfiling,
    'nativeExecution',
    {
      configurable: true,
      enumerable: false,
      value: true
    },
    () => {
      assertFlushSyncCurrentnessRejected(
        guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
        'public-react-dom-flush-sync-currentness-source-rows'
      );
    }
  );

  withTemporaryOwnProperty(
    ReactDOM,
    Symbol.for('rustExecutionClaimed'),
    {
      configurable: true,
      enumerable: false,
      value: true
    },
    () => {
      assertFlushSyncCurrentnessRejected(
        guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
        'public-react-dom-flush-sync-currentness-source-rows'
      );
    }
  );

  let accessorRead = false;
  withTemporaryOwnProperty(
    ReactDOM,
    'publicRootExecution',
    {
      configurable: true,
      enumerable: false,
      get() {
        accessorRead = true;
        return true;
      }
    },
    () => {
      assertFlushSyncCurrentnessRejected(
        guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
        'public-react-dom-flush-sync-currentness-source-rows'
      );
    }
  );
  assert.equal(accessorRead, false);

  let nativeAccessorRead = false;
  withTemporaryOwnProperty(
    ReactDOMProfiling,
    'nativeRuntimeExecutionClaimed',
    {
      configurable: true,
      enumerable: false,
      get() {
        nativeAccessorRead = true;
        return true;
      }
    },
    () => {
      assertFlushSyncCurrentnessRejected(
        guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
        'public-react-dom-flush-sync-currentness-source-rows'
      );
    }
  );
  assert.equal(nativeAccessorRead, false);

  withTemporaryOwnProperty(
    ReactDOM.flushSync,
    'rustExecutionClaimed',
    {
      configurable: true,
      enumerable: false,
      value: true
    },
    () => {
      assertFlushSyncCurrentnessRejected(
        guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
        'public-react-dom-flush-sync-currentness-source-rows'
      );
    }
  );

  const inheritedClaims = Object.create(Object.getPrototypeOf(ReactDOMProfiling));
  Object.defineProperty(
    inheritedClaims,
    'drainsPublicSchedulerTaskQueue',
    {
      configurable: true,
      value: true
    }
  );
  withTemporaryPrototype(ReactDOMProfiling, inheritedClaims, () => {
    assertFlushSyncCurrentnessRejected(
      guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
      'public-react-dom-flush-sync-currentness-source-rows'
    );
  });

  const inheritedNativeClaims = Object.create(Object.getPrototypeOf(ReactDOM));
  Object.defineProperty(
    inheritedNativeClaims,
    'nativeBridgeAvailable',
    {
      configurable: true,
      value: true
    }
  );
  withTemporaryPrototype(ReactDOM, inheritedNativeClaims, () => {
    assertFlushSyncCurrentnessRejected(
      guard.createPublicReactDomFlushSyncBlockedCurrentnessReport(),
      'public-react-dom-flush-sync-currentness-source-rows'
    );
  });
});

function assertPublicFlushSyncPlaceholder(ReactDOM, entrypoint) {
  const descriptor = Object.getOwnPropertyDescriptor(ReactDOM, 'flushSync');

  assert.equal(typeof descriptor.value, 'function');
  assert.equal(descriptor.value.name, '');
  assert.equal(descriptor.value.length, 1);

  let callbackInvoked = false;
  assert.throws(
    () =>
      descriptor.value(() => {
        callbackInvoked = true;
      }),
    (error) => {
      assert.equal(error.name, 'FastReactDomUnimplementedError');
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED');
      assert.equal(error.entrypoint, entrypoint);
      assert.equal(error.exportName, 'flushSync');
      assert.equal(error.compatibilityTarget, 'react-dom@19.2.6');
      return true;
    }
  );
  assert.equal(callbackInvoked, false);
}

function assertFlushSyncCurrentnessRejected(report, reason) {
  assert.equal(
    guard.isAcceptedPublicReactDomFlushSyncBlockedCurrentnessReport(report),
    false,
    reason
  );
  assert.throws(
    () => guard.consumePublicReactDomFlushSyncBlockedCurrentnessReport(report),
    (error) => {
      assert.equal(error.name, 'FastReactDomUnimplementedError');
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED');
      assert.equal(error.entrypoint, 'react-dom');
      assert.equal(
        error.exportName,
        `${guard.privateFlushSyncGuardExport}.consumePublicReactDomFlushSyncBlockedCurrentnessReport`
      );
      assert.equal(error.compatibilityTarget, 'react-dom@19.2.6');
      assert.equal(error.reason, reason);
      assert.equal(error.publicFlushSyncCompatibilityClaimed, false);
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
      assert.equal(error.publicActTimingCompatibilityClaimed, false);
      assert.equal(error.publicRootCompatibilityClaimed, false);
      assert.equal(error.packageCompatibilityClaimed, false);
      assert.equal(error.profilingCompatibilityClaimed, false);
      assert.equal(error.invokesCallback, false);
      assert.equal(error.returnsThenable, false);
      assert.equal(error.returnValueCompatibilityClaimed, false);
      assert.equal(error.drainsPublicSchedulerTaskQueue, false);
      assert.equal(error.publicRootExecution, false);
      assert.equal(error.executesPublicFlushSync, false);
      assert.equal(error.executesRendererRoots, false);
      assert.equal(error.compatibilityClaimed, false);
      return true;
    },
    reason
  );
}

function replaceCurrentnessScenario(report, index, overrides) {
  return report.scenarios.map((scenario, scenarioIndex) =>
    scenarioIndex === index
      ? {
          ...scenario,
          ...overrides
        }
      : scenario
  );
}

function replacePrivatePrerequisiteRow(report, index, overrides) {
  return report.privatePrerequisites.acceptedPrivateSyncFlushRows.map(
    (row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            ...overrides
          }
        : row
  );
}

function withTemporaryOwnProperty(target, key, descriptor, callback) {
  const hadOwn = Object.prototype.hasOwnProperty.call(target, key);
  const previousDescriptor = Object.getOwnPropertyDescriptor(target, key);

  Object.defineProperty(target, key, descriptor);
  try {
    callback();
  } finally {
    if (hadOwn) {
      Object.defineProperty(target, key, previousDescriptor);
    } else {
      delete target[key];
    }
  }
}

function withTemporaryPrototype(target, prototype, callback) {
  const previousPrototype = Object.getPrototypeOf(target);

  Object.setPrototypeOf(target, prototype);
  try {
    callback();
  } finally {
    Object.setPrototypeOf(target, previousPrototype);
  }
}
