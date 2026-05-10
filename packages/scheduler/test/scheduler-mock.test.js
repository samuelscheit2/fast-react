'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
const expiredLaneFlushMetadataKind =
  'fast-react.scheduler.mock-expired-lane-priority-root-metadata';
const expiredLaneFlushMetadataBrand = Symbol.for(
  expiredLaneFlushMetadataKind
);
const expiredLaneFlushDiagnosticsKind =
  'fast-react.scheduler.mock-expired-lane-flush-diagnostics';
const expiredLaneFlushDiagnosticsBrand = Symbol.for(
  expiredLaneFlushDiagnosticsKind
);

test('scheduler mock records expired lane metadata while keeping renderer work blocked', () => {
  const reactGate = loadFreshReactActDispatcherGate();

  for (const nodeEnv of ['development', 'production']) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readPrivateFlushDiagnostics(Scheduler);

    assert.equal(
      diagnostics.mockSchedulerExpiredLaneFlushDiagnosticsReady,
      true,
      nodeEnv
    );
    assert.equal(
      diagnostics.recognizesExpiredLanePriorityRootSchedulerMetadata,
      true,
      nodeEnv
    );
    assert.equal(
      diagnostics.recordsExpiredCallbackPriorityVirtualTimeFrameBudgetAndLaneLabel,
      true,
      nodeEnv
    );
    assert.equal(
      diagnostics.rejectsUnsupportedExpiredCallbackPriorityLevels,
      true,
      nodeEnv
    );
    assert.equal(diagnostics.rejectsStaleExpiredCallbackHandles, true, nodeEnv);

    Scheduler.reset();
    const events = [];
    const expiredCallback = reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        events.push([
          'expired-root-callback',
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log('expired-root-callback');
      },
      { label: 'expired-root-callback' }
    );
    const expiredHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      expiredCallback
    );
    let publicRendererCallbackRan = false;
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        publicRendererCallbackRan = true;
      }
    );
    Scheduler.unstable_requestPaint();
    Scheduler.unstable_advanceTime(251);

    const laneMetadata = createExpiredLaneMetadata(Scheduler, expiredHandle);
    const accepted =
      diagnostics.describeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
        laneMetadata
      );
    assert.equal(accepted.accepted, true, nodeEnv);
    assert.equal(accepted.rejectionReason, null, nodeEnv);
    assert.equal(accepted.currentVirtualTime, 251, nodeEnv);
    assert.equal(accepted.metadata.laneLabel, 'SyncLane', nodeEnv);
    assert.equal(accepted.metadata.priorityLabel, 'UserBlockingPriority', nodeEnv);
    assert.equal(accepted.metadata.callbackHandleMatched, true, nodeEnv);

    const report = diagnostics.drainExpiredMockSchedulerWork(laneMetadata);
    assert.equal(report[expiredLaneFlushDiagnosticsBrand], true, nodeEnv);
    assert.equal(report.kind, expiredLaneFlushDiagnosticsKind, nodeEnv);
    assert.equal(
      report.status,
      'drained-expired-mock-scheduler-work-with-lane-metadata-for-diagnostics',
      nodeEnv
    );
    assert.equal(report.expiredCallbackPriorityLevel, 2, nodeEnv);
    assert.equal(
      report.expiredCallbackPriorityLabel,
      'UserBlockingPriority',
      nodeEnv
    );
    assert.equal(report.expiredCallbackSchedulerPriority, 'UserBlocking', nodeEnv);
    assert.equal(report.expiredCallbackVirtualTime, 251, nodeEnv);
    assert.equal(report.expiredCallbackLaneLabel, 'SyncLane', nodeEnv);
    assert.equal(report.expiredCallbackFrameBudget.virtualTime, 251, nodeEnv);
    assert.equal(report.expiredCallbackFrameBudget.requestedPaint, true, nodeEnv);
    assert.equal(report.frameBudgetDecisionBefore.requestedPaint, true, nodeEnv);
    assert.equal(report.frameBudgetDecisionBefore.usesWallClockTime, false, nodeEnv);
    assert.equal(report.nowBefore, 251, nodeEnv);
    assert.equal(report.nowAfter, 251, nodeEnv);
    assert.equal(report.sourceDrainFlushedExpiredWork, true, nodeEnv);
    assert.equal(report.drainsExpiredMockSchedulerWork, true, nodeEnv);
    assert.equal(report.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(report.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(report.publicSchedulerTimingCompatibilityClaimed, false, nodeEnv);
    assert.equal(report.publicReactActCompatibilityClaimed, false, nodeEnv);
    assert.equal(report.compatibilityClaimed, false, nodeEnv);
    assert.equal(report.executesQueuedWork, false, nodeEnv);
    assert.equal(report.executesEffects, false, nodeEnv);
    assert.equal(report.executesRendererWork, false, nodeEnv);
    assert.equal(report.executesAcceptedInternalTestCallbacks, true, nodeEnv);
    assert.equal(report.lanePriorityRootSchedulerMetadata.accepted, true, nodeEnv);
    assert.equal(
      report.lanePriorityRootSchedulerMetadata.rootSchedulerMetadataKind,
      'SchedulerCallbackRequest',
      nodeEnv
    );
    assert.equal(
      report.lanePriorityRootSchedulerMetadata.lanePriorityMetadataKind,
      'RootLaneSchedulingSnapshot',
      nodeEnv
    );
    assert.deepEqual(events, [
      [
        'expired-root-callback',
        true,
        Scheduler.unstable_UserBlockingPriority,
        251
      ]
    ]);
    assert.equal(publicRendererCallbackRan, false, nodeEnv);
    assert.deepEqual(Scheduler.unstable_clearLog(), ['expired-root-callback']);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    Scheduler.reset();
  }
});

test('scheduler mock rejects unsupported priority levels and stale callback handles', () => {
  const reactGate = loadFreshReactActDispatcherGate();

  for (const nodeEnv of ['development', 'production']) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readPrivateFlushDiagnostics(Scheduler);

    Scheduler.reset();
    const events = [];
    const callback = reactGate.createInternalActQueueTestCallback(
      () => {
        events.push('expired-callback-ran');
      },
      { label: 'expired-callback' }
    );
    const handle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      callback
    );
    Scheduler.unstable_advanceTime(251);

    const unsupportedPriorityMetadata = createExpiredLaneMetadata(
      Scheduler,
      handle,
      {
        priorityLevel: 99,
        schedulerPriority: 'Unsupported'
      }
    );
    const unsupportedPriority =
      diagnostics.describeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
        unsupportedPriorityMetadata
      );
    assert.equal(unsupportedPriority.accepted, false, nodeEnv);
    assert.equal(
      unsupportedPriority.rejectionReason,
      'unsupported-priority-level',
      nodeEnv
    );
    assertExpiredLaneFlushRejection(
      () =>
        diagnostics.drainExpiredMockSchedulerWorkWithLaneMetadataForDiagnostics(
          unsupportedPriorityMetadata
        ),
      'unsupported-priority-level',
      nodeEnv
    );
    assert.deepEqual(events, [], nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    Scheduler.unstable_cancelCallback(handle);
    const staleMetadata = createExpiredLaneMetadata(Scheduler, handle);
    const stale =
      diagnostics.describeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
        staleMetadata
      );
    assert.equal(stale.accepted, false, nodeEnv);
    assert.equal(stale.rejectionReason, 'stale-callback-handle', nodeEnv);
    assertExpiredLaneFlushRejection(
      () => diagnostics.drainExpiredMockSchedulerWork(staleMetadata),
      'stale-callback-handle',
      nodeEnv
    );
    assert.deepEqual(events, [], nodeEnv);

    Scheduler.reset();
  }
});

test('scheduler mock rejects unbranded expired callbacks before they run', () => {
  for (const nodeEnv of ['development', 'production']) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readPrivateFlushDiagnostics(Scheduler);

    Scheduler.reset();
    let publicCallbackRan = false;
    const handle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      () => {
        publicCallbackRan = true;
      }
    );
    Scheduler.unstable_advanceTime(251);

    const metadata = createExpiredLaneMetadata(Scheduler, handle);
    const described =
      diagnostics.describeExpiredLanePriorityRootSchedulerMetadataForDiagnostics(
        metadata
      );
    assert.equal(described.accepted, false, nodeEnv);
    assert.equal(
      described.rejectionReason,
      'callback-handle-not-branded-internal-test-callback',
      nodeEnv
    );
    assertExpiredLaneFlushRejection(
      () =>
        diagnostics.drainExpiredMockSchedulerWorkWithLaneMetadataForDiagnostics(
          metadata
        ),
      'callback-handle-not-branded-internal-test-callback',
      nodeEnv
    );
    assert.equal(publicCallbackRan, false, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    Scheduler.reset();
  }
});

function createExpiredLaneMetadata(Scheduler, callbackHandle, overrides = {}) {
  const metadata = {
    kind: expiredLaneFlushMetadataKind,
    version: 1,
    compatibilityTarget: 'scheduler@0.27.0',
    reactCompatibilityTarget: 'react@19.2.6',
    lanePriorityMetadataKind: 'RootLaneSchedulingSnapshot',
    rootSchedulerMetadataKind: 'SchedulerCallbackRequest',
    taskKind: 'SchedulerCallback',
    rootId: 585,
    rootLabel: 'mock-root-585',
    lane: 'SyncLane',
    laneLabel: 'SyncLane',
    eventPriority: 'DiscreteEventPriority',
    sourcePriority: 'ExplicitSync',
    selectedNextLanes: 'SyncLane',
    pendingLanesBefore: 'NoLanes',
    pendingLanesAfter: 'SyncLane',
    priorityLevel: Scheduler.unstable_UserBlockingPriority,
    schedulerPriority: 'UserBlocking',
    callbackHandle,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    rendererWorkExecutionBlocked: true,
    rootSchedulerSchedulesMockCallbackOnly: true,
    ...overrides
  };

  Object.defineProperty(metadata, expiredLaneFlushMetadataBrand, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });
  return Object.freeze(metadata);
}

function assertExpiredLaneFlushRejection(fn, expectedReason, label) {
  assert.throws(
    fn,
    (error) => {
      assert.equal(error.name, 'FastReactSchedulerMockExpiredLaneFlushError');
      assert.equal(
        error.code,
        'FAST_REACT_SCHEDULER_MOCK_EXPIRED_LANE_FLUSH_REJECTED'
      );
      assert.equal(error.entrypoint, 'scheduler/unstable_mock');
      assert.equal(error.compatibilityTarget, 'scheduler@0.27.0');
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
      assert.equal(error.publicReactActCompatibilityClaimed, false);
      assert.equal(error.executesRendererWork, false);
      assert.match(error.message, new RegExp(expectedReason, 'u'));
      return true;
    },
    label
  );
}

function readPrivateFlushDiagnostics(Scheduler) {
  const diagnostics =
    Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];
  assert.equal(typeof diagnostics, 'object');
  assert.notEqual(diagnostics, null);
  return diagnostics;
}

function loadFreshReactActDispatcherGate() {
  return loadFreshWorkspaceModule('../../react/private-act-dispatcher-gate.js');
}

function loadFreshSchedulerMock(nodeEnv) {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  try {
    return loadFreshWorkspaceModule('../unstable_mock.js');
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function loadFreshWorkspaceModule(relativePath) {
  const modulePath = require.resolve(relativePath);
  const packageRoot = path.resolve(__dirname, '..', '..');
  for (const id of Object.keys(require.cache)) {
    if (id.startsWith(packageRoot)) {
      delete require.cache[id];
    }
  }
  delete require.cache[modulePath];
  return require(modulePath);
}
