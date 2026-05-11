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
