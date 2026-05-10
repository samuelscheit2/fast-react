import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, '..', '..', '..');

const privateActQueueFlushDiagnosticsExport =
  '__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__';
const delayedActRootWorkMetadataKind =
  'fast-react.scheduler.mock-delayed-act-root-work-metadata';
const delayedActRootWorkMetadataBrand = Symbol.for(
  delayedActRootWorkMetadataKind
);
const delayedActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-delayed-act-root-work-diagnostics';
const delayedActRootWorkDiagnosticsBrand = Symbol.for(
  delayedActRootWorkDiagnosticsKind
);
const expiredActRootWorkMetadataKind =
  'fast-react.scheduler.mock-expired-act-root-work-metadata';
const expiredActRootWorkMetadataBrand = Symbol.for(
  expiredActRootWorkMetadataKind
);
const expiredActRootWorkDiagnosticsKind =
  'fast-react.scheduler.mock-expired-act-root-work-diagnostics';
const expiredActRootWorkDiagnosticsBrand = Symbol.for(
  expiredActRootWorkDiagnosticsKind
);

test('scheduler mock promotes delayed act/root metadata through the expired route', () => {
  const reactGate = loadFreshReactActDispatcherGate();

  for (const nodeEnv of ['development', 'production']) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readPrivateFlushDiagnostics(Scheduler);
    assertDelayedDiagnosticsReady(diagnostics, nodeEnv);

    Scheduler.reset();
    const events = [];
    const createCallback = (label, continuation = null) =>
      reactGate.createInternalActQueueTestCallback(
        (didTimeout) => {
          events.push([
            label,
            didTimeout,
            Scheduler.unstable_getCurrentPriorityLevel(),
            Scheduler.unstable_now()
          ]);
          Scheduler.log(label);
          return continuation;
        },
        { label }
      );

    const delayedContinuation = createCallback('delayed-root-continuation');
    const delayedCallback = createCallback(
      'delayed-root-callback',
      delayedContinuation
    );
    const delayedHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      delayedCallback,
      { delay: 10 }
    );
    let publicSchedulerCallbackRan = false;
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        publicSchedulerCallbackRan = true;
        Scheduler.log('public-normal-work');
      }
    );

    const actRootContinuation = createCallback('act-root-continuation');
    const actQueue = reactGate.createInternalActQueueTestQueue([
      reactGate.createInternalActQueueTestTask({
        label: 'act-root-schedule',
        recordKind: 'SchedulerActQueueRequest',
        taskKind: 'RootSchedule',
        continuationStatus: 'NoContinuation',
        callback: createCallback('act-root-schedule')
      }),
      reactGate.createInternalActQueueTestTask({
        label: 'act-root-callback',
        recordKind: 'SyncFlushActContinuationRecord',
        taskKind: 'SchedulerCallback',
        continuationStatus: 'PendingContinuation',
        callback: createCallback('act-root-callback', actRootContinuation)
      })
    ]);
    const rootWorkRecords = [
      createAcceptedRootWorkRecord('RootLaneSchedulingSnapshot'),
      createAcceptedRootWorkRecord('SchedulerCallbackRequest'),
      createAcceptedRootWorkRecord('RootSchedulerCallbackExecutionRecord')
    ];
    const expiredMetadata = createExpiredActRootWorkMetadata(
      Scheduler,
      delayedHandle,
      actQueue,
      { rootWorkRecords }
    );
    const delayedMetadata =
      diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
        expiredMetadata,
        {
          scheduledVirtualTime: 0,
          delayMs: 10,
          startTime: delayedHandle.startTime,
          expirationTime: delayedHandle.expirationTime,
          priorityTimeoutMs:
            delayedHandle.expirationTime - delayedHandle.startTime
        }
      );
    assert.equal(
      delayedMetadata[delayedActRootWorkMetadataBrand],
      true,
      nodeEnv
    );
    assert.equal(delayedMetadata.kind, delayedActRootWorkMetadataKind, nodeEnv);
    assert.equal(
      delayedMetadata.producerStatus,
      'produced-private-delayed-act-root-work-metadata-from-accepted-root-metadata',
      nodeEnv
    );

    const described =
      diagnostics.describeDelayedActRootWorkMetadataForDiagnostics(
        delayedMetadata
      );
    assert.equal(described.accepted, true, nodeEnv);
    assert.equal(described.rejectionReason, null, nodeEnv);
    assert.equal(described.currentVirtualTime, 0, nodeEnv);
    assert.equal(described.promotionTargetVirtualTime, 260, nodeEnv);
    assert.equal(described.advanceTimeBy, 260, nodeEnv);
    assert.equal(described.metadata.callbackHandleDelayedPending, true, nodeEnv);
    assert.equal(described.metadata.delayMatchesCallbackHandle, true, nodeEnv);
    assert.equal(
      described.metadata.expirationTimeMatchesCallbackHandle,
      true,
      nodeEnv
    );
    assert.equal(
      described.metadata.producedByPrivateDelayedActRootWorkMetadataProducer,
      true,
      nodeEnv
    );
    assert.equal(
      described.metadata.expiredActRootWorkMetadata.accepted,
      true,
      nodeEnv
    );
    assert.equal(
      described.metadata.expiredActRootWorkMetadata.rootWorkRecordCount,
      3,
      nodeEnv
    );
    assert.equal(described.drainsExpiredMockSchedulerWork, false, nodeEnv);
    assert.equal(described.executesRendererWork, false, nodeEnv);
    assert.equal(
      described.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );

    const report = Scheduler.unstable_flushExpired(delayedMetadata);
    assert.equal(report[delayedActRootWorkDiagnosticsBrand], true, nodeEnv);
    assert.equal(report.kind, delayedActRootWorkDiagnosticsKind, nodeEnv);
    assert.equal(
      report.status,
      'drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics',
      nodeEnv
    );
    assert.equal(report.delayedCallbackDelayMs, 10, nodeEnv);
    assert.equal(report.delayedCallbackStartTime, 10, nodeEnv);
    assert.equal(report.delayedCallbackExpirationTime, 260, nodeEnv);
    assert.equal(report.delayedCallbackVirtualTimeBefore, 0, nodeEnv);
    assert.equal(report.delayedCallbackVirtualTimeAfterPromotion, 260, nodeEnv);
    assert.equal(report.delayedCallbackAdvanceTimeBy, 260, nodeEnv);
    assert.equal(
      report.delayedCallbackPromotionEvidence
        .promotedDelayedCallbackToExpiredWork,
      true,
      nodeEnv
    );
    assert.equal(
      report.delayedCallbackPromotionEvidence.sortIndexBefore,
      10,
      nodeEnv
    );
    assert.equal(
      report.delayedCallbackPromotionEvidence.sortIndexAfterPromotion,
      260,
      nodeEnv
    );
    assert.equal(
      report.expiredActRootWorkDrainReport[expiredActRootWorkDiagnosticsBrand],
      true,
      nodeEnv
    );
    assert.equal(
      report.expiredActRootWorkDrainStatus,
      'drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics',
      nodeEnv
    );
    assert.equal(
      report.expiredActRootWorkRouteSelectedFlushHelper,
      'unstable_flushExpired',
      nodeEnv
    );
    assert.equal(report.sourceDrainFlushedExpiredWork, true, nodeEnv);
    assert.equal(report.rootWorkRecordsConsumedCount, 3, nodeEnv);
    assert.equal(report.rootWorkRecordsPendingAfter, 0, nodeEnv);
    assert.equal(report.actQueuePendingBefore, 2, nodeEnv);
    assert.equal(report.actQueuePendingAfter, 0, nodeEnv);
    assert.equal(report.drainsExpiredMockSchedulerWork, true, nodeEnv);
    assert.equal(report.drainsAcceptedInternalTestQueues, true, nodeEnv);
    assert.equal(report.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(report.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(report.publicSchedulerTimingCompatibilityClaimed, false);
    assert.equal(report.publicReactActCompatibilityClaimed, false, nodeEnv);
    assert.equal(report.publicRootSchedulerCompatibilityClaimed, false, nodeEnv);
    assert.equal(report.publicRendererCompatibilityClaimed, false, nodeEnv);
    assert.equal(report.compatibilityClaimed, false, nodeEnv);
    assert.equal(report.executesQueuedWork, false, nodeEnv);
    assert.equal(report.executesEffects, false, nodeEnv);
    assert.equal(report.executesRendererWork, false, nodeEnv);
    assert.equal(report.executesRendererRoots, false, nodeEnv);
    assert.deepEqual(
      events,
      [
        [
          'delayed-root-callback',
          true,
          Scheduler.unstable_UserBlockingPriority,
          260
        ],
        [
          'delayed-root-continuation',
          true,
          Scheduler.unstable_UserBlockingPriority,
          260
        ],
        ['act-root-schedule', false, Scheduler.unstable_NormalPriority, 260],
        ['act-root-callback', false, Scheduler.unstable_NormalPriority, 260],
        [
          'act-root-continuation',
          false,
          Scheduler.unstable_NormalPriority,
          260
        ]
      ],
      nodeEnv
    );
    assert.deepEqual(Scheduler.unstable_clearLog(), [
      'delayed-root-callback',
      'delayed-root-continuation',
      'act-root-schedule',
      'act-root-callback',
      'act-root-continuation'
    ]);
    assert.equal(publicSchedulerCallbackRan, false, nodeEnv);
    assert.equal(expiredMetadata.rootWorkRecords.length, 0, nodeEnv);
    assert.equal(actQueue.records.length, 0, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);
    const stale =
      diagnostics.describeDelayedActRootWorkMetadataForDiagnostics(
        delayedMetadata
      );
    assert.equal(stale.accepted, false, nodeEnv);
    assert.equal(stale.rejectionReason, 'stale-callback-handle', nodeEnv);

    Scheduler.reset();
  }
});

test('scheduler mock rejects unbranded delayed act/root continuations', () => {
  const reactGate = loadFreshReactActDispatcherGate();

  for (const nodeEnv of ['development', 'production']) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readPrivateFlushDiagnostics(Scheduler);
    assertDelayedDiagnosticsReady(diagnostics, nodeEnv);

    Scheduler.reset();
    const events = [];
    let unbrandedContinuationRan = false;
    let publicSchedulerCallbackRan = false;
    const delayedCallback = reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        events.push([
          'branded-delayed-callback',
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log('branded-delayed-callback');
        return () => {
          unbrandedContinuationRan = true;
          Scheduler.log('unbranded-continuation-ran');
        };
      },
      { label: 'branded-delayed-callback' }
    );
    const delayedHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      delayedCallback,
      { delay: 10 }
    );
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        publicSchedulerCallbackRan = true;
        Scheduler.log('public-normal-work');
      }
    );

    const actQueue = createAcceptedActRootWorkQueue(reactGate);
    const expiredMetadata = createExpiredActRootWorkMetadata(
      Scheduler,
      delayedHandle,
      actQueue
    );
    const delayedMetadata =
      diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
        expiredMetadata,
        {
          scheduledVirtualTime: 0,
          delayMs: 10
        }
      );

    const described =
      diagnostics.describeDelayedActRootWorkMetadataForDiagnostics(
        delayedMetadata
      );
    assert.equal(described.accepted, true, nodeEnv);
    assert.equal(described.rejectionReason, null, nodeEnv);
    assertDelayedActRootWorkRejection(
      () => Scheduler.unstable_flushExpired(delayedMetadata),
      'callback-continuation-not-branded-internal-test-callback',
      nodeEnv
    );
    assert.deepEqual(
      events,
      [
        [
          'branded-delayed-callback',
          true,
          Scheduler.unstable_UserBlockingPriority,
          260
        ]
      ],
      nodeEnv
    );
    assert.equal(unbrandedContinuationRan, false, nodeEnv);
    assert.equal(publicSchedulerCallbackRan, false, nodeEnv);
    assert.deepEqual(Scheduler.unstable_clearLog(), [
      'branded-delayed-callback'
    ]);
    assert.equal(expiredMetadata.rootWorkRecords.length, 2, nodeEnv);
    assert.equal(actQueue.records.length, 1, nodeEnv);
    assert.equal(Scheduler.unstable_now(), 260, nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    Scheduler.reset();
  }
});

test('scheduler mock rejects mutated delayed producer nested evidence', () => {
  const reactGate = loadFreshReactActDispatcherGate();

  for (const nodeEnv of ['development', 'production']) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readPrivateFlushDiagnostics(Scheduler);
    assertDelayedDiagnosticsReady(diagnostics, nodeEnv);

    Scheduler.reset();
    const missingExpectedHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(reactGate, 'missing-expected-delayed-callback'),
      { delay: 10 }
    );
    const missingExpectedMetadata = createExpiredActRootWorkMetadata(
      Scheduler,
      missingExpectedHandle,
      createAcceptedActRootWorkQueue(reactGate),
      {
        expectedActQueuePendingCount: undefined
      }
    );
    assertDelayedActRootWorkRejection(
      () =>
        diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
          missingExpectedMetadata,
          {
            scheduledVirtualTime: 0,
            delayMs: 10
          }
        ),
      'producer-expected-act-queue-pending-count-mismatch',
      nodeEnv
    );

    Scheduler.reset();
    let rootMutationDelayedCallbackRan = false;
    const rootMutationHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(
        reactGate,
        'root-mutation-delayed-callback',
        () => {
          rootMutationDelayedCallbackRan = true;
          Scheduler.log('root-mutation-delayed-callback');
        }
      ),
      { delay: 10 }
    );
    const rootMutationActQueue = createAcceptedActRootWorkQueue(reactGate);
    const rootMutationExpiredMetadata = createExpiredActRootWorkMetadata(
      Scheduler,
      rootMutationHandle,
      rootMutationActQueue
    );
    const rootMutationDelayedMetadata =
      diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
        rootMutationExpiredMetadata,
        {
          scheduledVirtualTime: 0,
          delayMs: 10
        }
      );
    rootMutationExpiredMetadata.rootWorkRecords.push(
      createAcceptedRootWorkRecord('RootSchedulerCallbackExecutionRecord', {
        rootId: 765,
        rootLabel: 'injected-root-work'
      })
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      rootMutationDelayedMetadata,
      'metadata-source-root-work-record-count-mismatch',
      nodeEnv
    );
    assertDelayedActRootWorkRejection(
      () => Scheduler.unstable_flushExpired(rootMutationDelayedMetadata),
      'metadata-source-root-work-record-count-mismatch',
      nodeEnv
    );
    assert.equal(rootMutationDelayedCallbackRan, false, nodeEnv);
    assert.equal(rootMutationExpiredMetadata.rootWorkRecords.length, 3, nodeEnv);
    assert.equal(rootMutationActQueue.records.length, 1, nodeEnv);
    assert.equal(Scheduler.unstable_now(), 0, nodeEnv);
    assert.deepEqual(Scheduler.unstable_clearLog(), [], nodeEnv);

    Scheduler.reset();
    let injectedActCallbackRan = false;
    let actMutationDelayedCallbackRan = false;
    const actMutationHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(
        reactGate,
        'act-mutation-delayed-callback',
        () => {
          actMutationDelayedCallbackRan = true;
          Scheduler.log('act-mutation-delayed-callback');
        }
      ),
      { delay: 10 }
    );
    const actMutationActQueue = createAcceptedActRootWorkQueue(reactGate);
    const actMutationExpiredMetadata = createExpiredActRootWorkMetadata(
      Scheduler,
      actMutationHandle,
      actMutationActQueue
    );
    const actMutationDelayedMetadata =
      diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
        actMutationExpiredMetadata,
        {
          scheduledVirtualTime: 0,
          delayMs: 10
        }
      );
    actMutationActQueue.records[0] = createInjectedActRootWorkTask(
      reactGate,
      'injected-act-root-work',
      () => {
        injectedActCallbackRan = true;
        Scheduler.log('injected-act-root-work');
      }
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      actMutationDelayedMetadata,
      'metadata-source-act-queue-record-0-identity-mismatch',
      nodeEnv
    );
    assertDelayedActRootWorkRejection(
      () => Scheduler.unstable_flushExpired(actMutationDelayedMetadata),
      'metadata-source-act-queue-record-0-identity-mismatch',
      nodeEnv
    );
    assert.equal(actMutationDelayedCallbackRan, false, nodeEnv);
    assert.equal(injectedActCallbackRan, false, nodeEnv);
    assert.equal(actMutationExpiredMetadata.rootWorkRecords.length, 2, nodeEnv);
    assert.equal(actMutationActQueue.records.length, 1, nodeEnv);
    assert.equal(Scheduler.unstable_now(), 0, nodeEnv);
    assert.deepEqual(Scheduler.unstable_clearLog(), [], nodeEnv);

    Scheduler.reset();
  }
});

test('scheduler mock rejects unsupported delayed act/root metadata', () => {
  const reactGate = loadFreshReactActDispatcherGate();

  for (const nodeEnv of ['development', 'production']) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readPrivateFlushDiagnostics(Scheduler);
    assertDelayedDiagnosticsReady(diagnostics, nodeEnv);

    Scheduler.reset();
    let unbrandedCallbackRan = false;
    const unbrandedHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      () => {
        unbrandedCallbackRan = true;
      },
      { delay: 10 }
    );
    const unbrandedMetadata = createDelayedActRootWorkMetadata(
      Scheduler,
      unbrandedHandle,
      createExpiredActRootWorkMetadata(
        Scheduler,
        unbrandedHandle,
        createAcceptedActRootWorkQueue(reactGate)
      ),
      { scheduledVirtualTime: 0, delayMs: 10 }
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      unbrandedMetadata,
      'callback-handle-not-branded-internal-test-callback',
      nodeEnv
    );
    assertDelayedActRootWorkRejection(
      () => diagnostics.drainExpiredMockSchedulerWork(unbrandedMetadata),
      'callback-handle-not-branded-internal-test-callback',
      nodeEnv
    );
    assert.equal(unbrandedCallbackRan, false, nodeEnv);
    assert.equal(Scheduler.unstable_now(), 0, nodeEnv);

    Scheduler.reset();
    const cancelledHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(reactGate, 'cancelled-delayed-callback'),
      { delay: 10 }
    );
    Scheduler.unstable_cancelCallback(cancelledHandle);
    const cancelledMetadata = createDelayedActRootWorkMetadata(
      Scheduler,
      cancelledHandle,
      createExpiredActRootWorkMetadata(
        Scheduler,
        cancelledHandle,
        createAcceptedActRootWorkQueue(reactGate)
      ),
      { scheduledVirtualTime: 0, delayMs: 10 }
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      cancelledMetadata,
      'stale-callback-handle',
      nodeEnv
    );
    assertDelayedActRootWorkRejection(
      () =>
        diagnostics.drainDelayedMockSchedulerWorkWithActRootMetadataForDiagnostics(
          cancelledMetadata
        ),
      'stale-callback-handle',
      nodeEnv
    );

    Scheduler.reset();
    const timingHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(reactGate, 'timing-delayed-callback'),
      { delay: 10 }
    );
    const timingExpiredMetadata = createExpiredActRootWorkMetadata(
      Scheduler,
      timingHandle,
      createAcceptedActRootWorkQueue(reactGate)
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      createDelayedActRootWorkMetadata(
        Scheduler,
        timingHandle,
        timingExpiredMetadata,
        { scheduledVirtualTime: 0, delayMs: 11 }
      ),
      'delay-metadata-mismatch',
      nodeEnv
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      createDelayedActRootWorkMetadata(
        Scheduler,
        timingHandle,
        timingExpiredMetadata,
        {
          scheduledVirtualTime: 0,
          delayMs: 10,
          expirationTime: timingHandle.expirationTime + 1
        }
      ),
      'expiration-time-metadata-mismatch',
      nodeEnv
    );

    Scheduler.reset();
    const targetHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(reactGate, 'ambiguous-target-delayed-callback'),
      { delay: 10 }
    );
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(reactGate, 'ambiguous-second-delayed-callback'),
      { delay: 20 }
    );
    const ambiguousMetadata = createDelayedActRootWorkMetadata(
      Scheduler,
      targetHandle,
      createExpiredActRootWorkMetadata(
        Scheduler,
        targetHandle,
        createAcceptedActRootWorkQueue(reactGate)
      ),
      { scheduledVirtualTime: 0, delayMs: 10 }
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      ambiguousMetadata,
      'ambiguous-delayed-or-expired-callback-handles',
      nodeEnv
    );
    assertDelayedActRootWorkRejection(
      () => Scheduler.unstable_flushExpired(ambiguousMetadata),
      'ambiguous-delayed-or-expired-callback-handles',
      nodeEnv
    );
    assert.equal(Scheduler.unstable_now(), 0, nodeEnv);

    Scheduler.reset();
    const publicClaimHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(reactGate, 'public-claim-delayed-callback'),
      { delay: 10 }
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      createDelayedActRootWorkMetadata(
        Scheduler,
        publicClaimHandle,
        createExpiredActRootWorkMetadata(
          Scheduler,
          publicClaimHandle,
          createAcceptedActRootWorkQueue(reactGate)
        ),
        {
          scheduledVirtualTime: 0,
          delayMs: 10,
          publicCompatibilityClaimed: true
        }
      ),
      'metadata-public-claim',
      nodeEnv
    );
    assertDelayedDescriptionRejection(
      diagnostics,
      createDelayedActRootWorkMetadata(
        Scheduler,
        publicClaimHandle,
        createExpiredActRootWorkMetadata(
          Scheduler,
          publicClaimHandle,
          createAcceptedActRootWorkQueue(reactGate),
          {
            rootWorkRecords: [
              createAcceptedRootWorkRecord('RootLaneSchedulingSnapshot', {
                publicCompatibilityClaimed: true
              })
            ]
          }
        ),
        { scheduledVirtualTime: 0, delayMs: 10 }
      ),
      'root-work-record-0-public-claim',
      nodeEnv
    );

    Scheduler.reset();
    const producerHandle = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      createAcceptedCallback(reactGate, 'producer-delayed-callback'),
      { delay: 10 }
    );
    const producerExpiredMetadata = createExpiredActRootWorkMetadata(
      Scheduler,
      producerHandle,
      createAcceptedActRootWorkQueue(reactGate)
    );
    assertDelayedActRootWorkRejection(
      () =>
        diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
          producerExpiredMetadata,
          {
            scheduledVirtualTime: 0,
            delayMs: 11
          }
        ),
      'producer-delay-metadata-mismatch',
      nodeEnv
    );
    assertDelayedActRootWorkRejection(
      () =>
        diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
          producerExpiredMetadata,
          {
            publicCompatibilityClaimed: true
          }
        ),
      'producer-public-claim',
      nodeEnv
    );
    const producedMetadata =
      diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics(
        producerExpiredMetadata,
        {
          scheduledVirtualTime: 0,
          delayMs: 10
        }
      );
    const clonedMetadata = cloneDelayedActRootWorkMetadata(producedMetadata);
    assertDelayedDescriptionRejection(
      diagnostics,
      clonedMetadata,
      'metadata-not-produced-by-private-delayed-root-producer',
      nodeEnv
    );
    assertDelayedActRootWorkRejection(
      () => Scheduler.unstable_flushExpired(clonedMetadata),
      'metadata-not-produced-by-private-delayed-root-producer',
      nodeEnv
    );
    assert.equal(Scheduler.unstable_now(), 0, nodeEnv);
    assert.equal(producerExpiredMetadata.rootWorkRecords.length, 2, nodeEnv);

    Scheduler.reset();
  }
});

function createAcceptedCallback(reactGate, label, callback = () => {}) {
  return reactGate.createInternalActQueueTestCallback(callback, { label });
}

function createAcceptedActRootWorkQueue(reactGate) {
  return reactGate.createInternalActQueueTestQueue([
    reactGate.createInternalActQueueTestTask({
      label: 'accepted-act-root-work',
      recordKind: 'SchedulerActQueueRequest',
      taskKind: 'RootSchedule',
      continuationStatus: 'NoContinuation'
    })
  ]);
}

function createInjectedActRootWorkTask(reactGate, label, callback) {
  return reactGate.createInternalActQueueTestTask({
    label,
    recordKind: 'SchedulerActQueueRequest',
    taskKind: 'RootSchedule',
    continuationStatus: 'NoContinuation',
    callback: reactGate.createInternalActQueueTestCallback(callback, {
      label: `${label}:callback`
    })
  });
}

function createExpiredActRootWorkMetadata(
  Scheduler,
  callbackHandle,
  actQueue,
  overrides = {}
) {
  const rootWorkRecords =
    overrides.rootWorkRecords ??
    [
      createAcceptedRootWorkRecord('RootLaneSchedulingSnapshot'),
      createAcceptedRootWorkRecord('RootTaskScheduleRecord')
    ];
  const metadata = {
    kind: expiredActRootWorkMetadataKind,
    version: 1,
    compatibilityTarget: 'scheduler@0.27.0',
    reactCompatibilityTarget: 'react@19.2.6',
    rootId: 742,
    rootLabel: 'mock-root-742',
    lane: 'SyncLane',
    laneLabel: 'SyncLane',
    priorityLevel: callbackHandle.priorityLevel,
    schedulerPriority: getSchedulerPriorityName(
      Scheduler,
      callbackHandle.priorityLevel
    ),
    callbackHandle,
    actQueue,
    expectedActQueuePendingCount: Array.isArray(actQueue?.records)
      ? actQueue.records.length
      : 0,
    rootWorkRecords,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true,
    ...overrides
  };

  Object.defineProperty(metadata, expiredActRootWorkMetadataBrand, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });
  return Object.freeze(metadata);
}

function createDelayedActRootWorkMetadata(
  Scheduler,
  callbackHandle,
  expiredActRootWorkMetadata,
  overrides = {}
) {
  const scheduledVirtualTime =
    overrides.scheduledVirtualTime ?? Scheduler.unstable_now();
  const metadata = {
    kind: delayedActRootWorkMetadataKind,
    version: 1,
    compatibilityTarget: 'scheduler@0.27.0',
    reactCompatibilityTarget: 'react@19.2.6',
    rootId: 742,
    rootLabel: 'mock-root-742',
    lane: 'SyncLane',
    laneLabel: 'SyncLane',
    priorityLevel: callbackHandle.priorityLevel,
    schedulerPriority: getSchedulerPriorityName(
      Scheduler,
      callbackHandle.priorityLevel
    ),
    callbackHandle,
    scheduledVirtualTime,
    delayMs: callbackHandle.startTime - scheduledVirtualTime,
    startTime: callbackHandle.startTime,
    expirationTime: callbackHandle.expirationTime,
    priorityTimeoutMs: callbackHandle.expirationTime - callbackHandle.startTime,
    expiredActRootWorkMetadata,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    actQueueHandoffOnly: true,
    delayedCallbackPromotionOnly: true,
    ...overrides
  };

  Object.defineProperty(metadata, delayedActRootWorkMetadataBrand, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });
  return Object.freeze(metadata);
}

function cloneDelayedActRootWorkMetadata(metadata) {
  const clone = { ...metadata };
  Object.defineProperty(clone, delayedActRootWorkMetadataBrand, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false
  });
  return Object.freeze(clone);
}

function createAcceptedRootWorkRecord(recordKind, overrides = {}) {
  return Object.freeze({
    recordKind,
    accepted: true,
    rootId: 742,
    rootLabel: 'mock-root-742',
    lane: 'SyncLane',
    laneLabel: 'SyncLane',
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    rendererWorkExecutionBlocked: true,
    rootWorkMetadataOnly: true,
    ...overrides
  });
}

function assertDelayedDescriptionRejection(
  diagnostics,
  metadata,
  expectedReason,
  label
) {
  const described =
    diagnostics.describeDelayedActRootWorkMetadataForDiagnostics(metadata);
  assert.equal(described.accepted, false, label);
  assert.equal(described.rejectionReason, expectedReason, label);
  assert.equal(described.drainsExpiredMockSchedulerWork, false, label);
  assert.equal(described.executesRendererWork, false, label);
}

function assertDelayedActRootWorkRejection(fn, expectedReason, label) {
  assert.throws(
    fn,
    (error) => {
      assert.equal(error.name, 'FastReactSchedulerMockDelayedActRootWorkError');
      assert.equal(
        error.code,
        'FAST_REACT_SCHEDULER_MOCK_DELAYED_ACT_ROOT_WORK_REJECTED'
      );
      assert.equal(error.entrypoint, 'scheduler/unstable_mock');
      assert.equal(error.compatibilityTarget, 'scheduler@0.27.0');
      assert.equal(error.publicSchedulerTimingCompatibilityClaimed, false);
      assert.equal(error.publicReactActCompatibilityClaimed, false);
      assert.equal(error.publicRootSchedulerCompatibilityClaimed, false);
      assert.equal(error.publicRendererCompatibilityClaimed, false);
      assert.equal(error.executesRendererWork, false);
      assert.match(error.message, new RegExp(expectedReason, 'u'));
      return true;
    },
    label
  );
}

function assertDelayedDiagnosticsReady(diagnostics, label) {
  assert.equal(
    diagnostics.mockSchedulerDelayedActRootWorkDiagnosticsReady,
    true,
    label
  );
  assert.equal(diagnostics.recognizesDelayedActRootWorkMetadata, true, label);
  assert.equal(
    diagnostics.validatesDelayedCallbackDelayStartAndExpirationMetadata,
    true,
    label
  );
  assert.equal(
    diagnostics.recordsDelayedCallbackVirtualTimePromotionEvidence,
    true,
    label
  );
  assert.equal(
    diagnostics.advancesMockVirtualTimeToDelayedCallbackExpiration,
    true,
    label
  );
  assert.equal(
    diagnostics.consumesDelayedActRootWorkThroughExpiredActRootRoute,
    true,
    label
  );
  assert.equal(
    diagnostics.rejectsAmbiguousDelayedOrExpiredCallbackHandles,
    true,
    label
  );
  assert.equal(
    diagnostics.rejectsDelayedActRootWorkPublicCompatibilityClaims,
    true,
    label
  );
  assert.equal(
    diagnostics.producesDelayedActRootWorkMetadataFromAcceptedRootMetadata,
    true,
    label
  );
  assert.equal(
    diagnostics.rejectsUnownedDelayedActRootWorkMetadata,
    true,
    label
  );
  assert.equal(
    diagnostics.rejectsClonedDelayedActRootWorkEvidence,
    true,
    label
  );
  assert.equal(
    diagnostics.bindsProducedDelayedActRootWorkNestedEvidence,
    true,
    label
  );
  assert.equal(
    diagnostics.rejectsMutatedDelayedActRootWorkNestedEvidence,
    true,
    label
  );
  assert.equal(diagnostics.drainsPublicSchedulerTaskQueue, false, label);
  assert.equal(diagnostics.drainsPublicReactActQueue, false, label);
  assert.equal(
    diagnostics.publicSchedulerTimingCompatibilityClaimed,
    false,
    label
  );
  assert.equal(diagnostics.publicReactActCompatibilityClaimed, false, label);
  assert.equal(diagnostics.executesQueuedWork, false, label);
  assert.equal(diagnostics.executesEffects, false, label);
  assert.equal(
    typeof diagnostics.describeDelayedActRootWorkMetadataForDiagnostics,
    'function'
  );
  assert.equal(
    typeof diagnostics.drainDelayedMockSchedulerWorkWithActRootMetadataForDiagnostics,
    'function'
  );
  assert.equal(
    typeof diagnostics.createDelayedActRootWorkMetadataFromAcceptedRootMetadataForDiagnostics,
    'function'
  );
}

function readPrivateFlushDiagnostics(Scheduler) {
  const diagnostics =
    Scheduler.unstable_flushExpired[privateActQueueFlushDiagnosticsExport];
  assert.equal(typeof diagnostics, 'object');
  assert.notEqual(diagnostics, null);
  return diagnostics;
}

function getSchedulerPriorityName(Scheduler, priorityLevel) {
  switch (priorityLevel) {
    case Scheduler.unstable_ImmediatePriority:
      return 'Immediate';
    case Scheduler.unstable_UserBlockingPriority:
      return 'UserBlocking';
    case Scheduler.unstable_NormalPriority:
      return 'Normal';
    case Scheduler.unstable_LowPriority:
      return 'Low';
    case Scheduler.unstable_IdlePriority:
      return 'Idle';
    default:
      return null;
  }
}

function loadFreshReactActDispatcherGate() {
  return loadFreshWorkspaceModule(
    path.join(repoRoot, 'packages/react/private-act-dispatcher-gate.js')
  );
}

function loadFreshSchedulerMock(nodeEnv) {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  try {
    return loadFreshWorkspaceModule(
      path.join(repoRoot, 'packages/scheduler/unstable_mock.js')
    );
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function loadFreshWorkspaceModule(modulePath) {
  const resolvedModulePath = require.resolve(modulePath);
  const packagesRoot = path.join(repoRoot, 'packages');
  for (const id of Object.keys(require.cache)) {
    if (id.startsWith(packagesRoot)) {
      delete require.cache[id];
    }
  }
  delete require.cache[resolvedModulePath];
  return require(resolvedModulePath);
}
