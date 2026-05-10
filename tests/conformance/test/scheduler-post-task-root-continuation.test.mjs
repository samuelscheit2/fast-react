import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const conformanceRoot = path.resolve(testDirectory, '..');
const repoRoot = path.resolve(conformanceRoot, '..', '..');
const workspaceSchedulerPackageRoot = path.join(repoRoot, 'packages/scheduler');
const workspaceSchedulerPostTaskEntrypoint = path.join(
  workspaceSchedulerPackageRoot,
  'unstable_post_task.js'
);
const {
  ACCEPTED_ROOT_CONTINUATION_STATUS,
  ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS,
  ROOT_CONTINUATION_BLOCKED_STATUS,
  ROOT_CONTINUATION_ABORTED_EXECUTION_STATUS,
  ROOT_CONTINUATION_EXECUTION_ROUTE_STATUS,
  ROOT_CONTINUATION_FALLBACK_STATUS,
  ROOT_CONTINUATION_METADATA_STATUS,
  ROOT_CONTINUATION_PENDING_EXECUTION_STATUS,
  ROOT_CONTINUATION_REJECTED_STATUS,
  ROOT_CONTINUATION_SIGNAL_VALIDATION_STATUS,
  createPrivatePostTaskRootContinuationMetadataRow,
  derivePrivatePostTaskRootContinuationId
} = require(
  path.join(
    conformanceRoot,
    'src/scheduler-post-task-root-continuation.cjs'
  )
);

let postTaskOracleModulePromise = null;

test('private postTask root continuation metadata links delay and abort diagnostics without renderer work', async () => {
  const {inspectSchedulerPostTaskPriorityDiagnostics} =
    await loadPostTaskOracleModule();
  const report = inspectSchedulerPostTaskPriorityDiagnostics({
    nodeEnv: 'development',
    withYield: false
  });
  const flow = report.continuationAbortAfterFallback;
  const diagnostics = flow.diagnosticsAfterCancel;
  const continuation = diagnostics.continuationFallbacks[0];
  const row = createPrivatePostTaskRootContinuationMetadataRow(diagnostics);

  assert.equal(row.status, ROOT_CONTINUATION_METADATA_STATUS);
  assert.equal(Object.isFrozen(row), true);
  assert.equal(row.accepted, true);
  assert.equal(row.rejected, false);
  assert.equal(
    row.continuationId,
    derivePrivatePostTaskRootContinuationId(diagnostics, continuation)
  );
  assert.equal(row.continuationIndex, 0);
  assert.equal(row.priorityLabel, 'normal');
  assert.equal(row.priorityLevel, 3);
  assert.equal(row.schedulerPriorityName, 'unstable_NormalPriority');
  assert.equal(row.postTaskPriority, 'user-visible');
  assert.deepEqual(
    row.priorityTimeout,
    expectedPriorityTimeout({
      priorityLevel: 3,
      schedulerPriorityName: 'unstable_NormalPriority',
      timeoutMs: 5000,
      timeoutReason: 'normal-priority-timeout'
    })
  );
  assert.equal(row.sourceCallbackDidTimeout, false);
  assert.equal(row.delay.value, 0);
  assert.equal(row.delay.delayClassification, 'zero-delay-task');
  assert.deepEqual(row.signalAtSchedule, {
    id: 9,
    priority: 'user-visible',
    aborted: false,
    ownKeys: ['id', 'aborted', 'priority']
  });
  assert.deepEqual(row.abortSignal, {
    id: 9,
    priority: 'user-visible',
    aborted: true,
    ownKeys: ['id', 'aborted', 'priority']
  });
  assert.equal(row.abortSignalState, 'aborted');
  assert.equal(row.continuationStatus, 'scheduled-continuation-fallback');
  assert.equal(row.fallback, 'scheduler.postTask');
  assert.equal(
    row.delayAbortOrdering.status,
    'delay-abort-ordering-observed-after-abort-call'
  );
  assert.equal(row.sourceDiagnostics.delayAbortOrderingDiagnostics, true);
  assert.equal(
    row.sourceDiagnostics.continuationFallbackMetadataDiagnostics,
    true
  );
  assert.equal(row.sourceDiagnostics.taskControllerAbortOrderingDiagnostics, true);
  assert.equal(row.sourceDiagnostics.priorityTimeoutDiagnostics, true);
  assert.equal(row.sourceDiagnostics.continuationSignalValidationDiagnostics, true);
  assert.equal(row.sourceDiagnostics.continuationAbortOrderingDiagnostics, true);
  assert.equal(
    row.sourceDiagnostics.rootContinuationExecutionRouteDiagnostics,
    true
  );
  assert.equal(
    row.signalValidation.status,
    ROOT_CONTINUATION_SIGNAL_VALIDATION_STATUS
  );
  assert.equal(row.signalValidation.signalId, 9);
  assert.equal(row.signalValidation.rejectionReason, null);
  assert.equal(
    row.signalValidation.sourceSignalValidation.status,
    'validated-shimmed-post-task-continuation-signal'
  );
  assert.equal(
    row.abortOrdering.status,
    'continuation-abort-ordering-observed-after-abort-call'
  );
  assert.equal(row.abortOrdering.requestEventIndex, 3);
  assert.equal(row.abortOrdering.completionEventIndex, 4);
  assert.equal(row.abortOrdering.signalAfterAbort.aborted, true);
  assert.equal(row.abortOrdering.abortSignalStateAfterAbort, 'aborted');
  assert.equal(
    row.rootContinuationExecutionRoute.status,
    ROOT_CONTINUATION_EXECUTION_ROUTE_STATUS
  );
  assert.equal(
    row.rootContinuationExecutionRoute.routeStatus,
    ROOT_CONTINUATION_ABORTED_EXECUTION_STATUS
  );
  assert.equal(row.rootContinuationExecutionRoute.accepted, true);
  assert.equal(row.rootContinuationExecutionRoute.rejected, false);
  assert.equal(row.rootContinuationExecutionRoute.continuationIndex, 0);
  assert.equal(
    row.rootContinuationExecutionRoute.continuationDiagnosticEventIndex,
    2
  );
  assert.equal(row.rootContinuationExecutionRoute.delay.value, 0);
  assert.equal(
    row.rootContinuationExecutionRoute.abortSignal.aborted,
    true
  );
  assert.equal(
    row.privateRootContinuationExecution.status,
    ROOT_CONTINUATION_ABORTED_EXECUTION_STATUS
  );
  assert.equal(row.privateRootContinuationExecution.routeSelected, true);
  assert.equal(
    row.privateRootContinuationExecution.abortSemanticsPreserved,
    true
  );
  assert.equal(
    row.privateRootContinuationExecution.continuationCallbackExecuted,
    false
  );
  assert.deepEqual(
    row.privateRootContinuationExecution.priorityTimeout,
    row.priorityTimeout
  );
  assert.equal(
    row.privateRootContinuationExecution.sourceCallbackDidTimeout,
    false
  );
  assert.equal(row.privateRootContinuationExecution.rendererWorkExecuted, false);
  assert.equal(row.privateRootContinuationExecution.reconcilerWorkExecuted, false);
  assert.equal(
    row.privateRootContinuationExecution.nativeRendererWorkExecuted,
    false
  );
  assert.equal(row.privateRootContinuationExecution.publicRootExecution, false);
  assert.equal(row.privateRootContinuationExecution.publicSchedulerFlush, false);
  assert.equal(row.acceptedActRootWorkHandoff, null);
  assert.equal(
    row.acceptedRootContinuation.acceptedActRootWorkHandoff,
    null
  );
  assert.equal(row.continuationFallback.status, ROOT_CONTINUATION_FALLBACK_STATUS);
  assert.equal(row.continuationFallback.selectedFallback, 'scheduler.postTask');
  assert.deepEqual(row.continuationFallback.priorityTimeout, row.priorityTimeout);
  assert.equal(row.continuationFallback.sourceCallbackDidTimeout, false);
  assert.equal(row.acceptedRootContinuation.status, ACCEPTED_ROOT_CONTINUATION_STATUS);
  assert.equal(row.acceptedRootContinuation.accepted, true);
  assert.equal(Object.isFrozen(row.acceptedRootContinuation), true);
  assert.equal(
    row.acceptedRootContinuation.abortOrdering.status,
    'continuation-abort-ordering-observed-after-abort-call'
  );
  assert.equal(
    row.acceptedRootContinuation.rootContinuationExecutionRoute.status,
    ROOT_CONTINUATION_EXECUTION_ROUTE_STATUS
  );
  assert.equal(
    row.acceptedRootContinuation.privateRootContinuationExecution.status,
    ROOT_CONTINUATION_ABORTED_EXECUTION_STATUS
  );
  assert.deepEqual(
    row.acceptedRootContinuation.priorityTimeout,
    row.priorityTimeout
  );
  assert.equal(row.acceptedRootContinuation.sourceCallbackDidTimeout, false);
  assert.equal(
    row.blockedRootExecution.status,
    ROOT_CONTINUATION_BLOCKED_STATUS
  );
  assert.equal(row.blockedRootExecution.rootContinuationMetadataOnly, true);
  assert.equal(row.blockedRootExecution.rendererWorkExecuted, false);
  assert.equal(row.blockedRootExecution.reconcilerWorkExecuted, false);
  assert.equal(row.blockedRootExecution.nativeRendererWorkExecuted, false);
  assert.equal(row.blockedRootExecution.publicRootExecution, false);
  assert.equal(row.blockedRootExecution.publicSchedulerFlush, false);
  assert.equal(row.browserPostTaskCompatibilityClaimed, false);
  assert.equal(row.browserTaskOrderingCompatibilityClaimed, false);
  assert.equal(row.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(row.compatibilityClaimed, false);

  assert.deepEqual(flow.events, [
    {
      label: 'start',
      currentPriorityLevel: 3
    }
  ]);
  assert.deepEqual(flow.finalFlush, [
    {
      type: 'skip-aborted',
      signal: {
        id: 9,
        priority: 'user-visible',
        aborted: true
      }
    }
  ]);
  assert.equal(flow.diagnosticsAfterFinalFlush.callbackRuns.length, 1);
});

test('private postTask delayed continuation metadata accepts act/root handoff without public timing claims', async () => {
  const {inspectSchedulerPostTaskPriorityDiagnostics} =
    await loadPostTaskOracleModule();
  const report = inspectSchedulerPostTaskPriorityDiagnostics({
    nodeEnv: 'development',
    withYield: false
  });
  const diagnostics =
    report.delayedContinuationActRootHandoff.diagnosticsAfterFallback;
  const continuation = diagnostics.continuationFallbacks[0];
  const row = createPrivatePostTaskRootContinuationMetadataRow(diagnostics);

  assert.equal(row.status, ROOT_CONTINUATION_METADATA_STATUS);
  assert.equal(row.accepted, true);
  assert.equal(row.rejected, false);
  assert.equal(
    row.continuationId,
    derivePrivatePostTaskRootContinuationId(diagnostics, continuation)
  );
  assert.equal(row.priorityLabel, 'low');
  assert.equal(row.priorityLevel, 4);
  assert.equal(row.schedulerPriorityName, 'unstable_LowPriority');
  assert.deepEqual(
    row.priorityTimeout,
    expectedPriorityTimeout({
      priorityLevel: 4,
      schedulerPriorityName: 'unstable_LowPriority',
      timeoutMs: 10000,
      timeoutReason: 'low-priority-timeout'
    })
  );
  assert.equal(row.sourceCallbackDidTimeout, false);
  assert.equal(row.delay.value, 17);
  assert.equal(row.delay.delayClassification, 'delayed-task');
  assert.equal(row.abortSignalState, 'not-aborted');
  assert.equal(
    row.rootContinuationExecutionRoute.routeStatus,
    ROOT_CONTINUATION_PENDING_EXECUTION_STATUS
  );
  assert.equal(
    row.privateRootContinuationExecution.status,
    ROOT_CONTINUATION_PENDING_EXECUTION_STATUS
  );
  assert.equal(
    row.acceptedRootContinuation.privateRootContinuationExecution.status,
    ROOT_CONTINUATION_PENDING_EXECUTION_STATUS
  );
  assert.deepEqual(
    row.acceptedRootContinuation.priorityTimeout,
    row.priorityTimeout
  );
  assert.equal(row.acceptedRootContinuation.sourceCallbackDidTimeout, false);
  assert.equal(
    row.acceptedActRootWorkHandoff.status,
    ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS
  );
  assert.equal(row.acceptedActRootWorkHandoff.accepted, true);
  assert.equal(row.acceptedActRootWorkHandoff.delayedCallbackPathAccepted, true);
  assert.equal(row.acceptedActRootWorkHandoff.delay.value, 17);
  assert.deepEqual(
    row.acceptedActRootWorkHandoff.priorityTimeout,
    row.priorityTimeout
  );
  assert.equal(row.acceptedActRootWorkHandoff.sourceCallbackDidTimeout, false);
  assert.equal(
    row.acceptedActRootWorkHandoff.routeStatus,
    ROOT_CONTINUATION_PENDING_EXECUTION_STATUS
  );
  assert.equal(row.acceptedActRootWorkHandoff.actQueueHandoffOnly, true);
  assert.equal(row.acceptedActRootWorkHandoff.rootWorkMetadataOnly, true);
  assert.equal(
    row.acceptedActRootWorkHandoff.rendererWorkExecutionBlocked,
    true
  );
  assert.deepEqual(
    row.acceptedActRootWorkHandoff.rootWorkRecords.map(
      (record) => record.recordKind
    ),
    ['RootLaneSchedulingSnapshot', 'RootTaskScheduleRecord']
  );
  for (const rootWorkRecord of row.acceptedActRootWorkHandoff.rootWorkRecords) {
    assert.deepEqual(rootWorkRecord.priorityTimeout, row.priorityTimeout);
    assert.equal(rootWorkRecord.sourceCallbackDidTimeout, false);
  }
  assert.equal(
    row.acceptedRootContinuation.acceptedActRootWorkHandoff.status,
    ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS
  );
  assert.equal(row.blockedRootExecution.status, ROOT_CONTINUATION_BLOCKED_STATUS);
  assert.equal(row.blockedRootExecution.rendererWorkExecuted, false);
  assert.equal(row.blockedRootExecution.publicRootExecution, false);
  assert.equal(row.acceptedActRootWorkHandoff.drainsPublicSchedulerTaskQueue, false);
  assert.equal(row.acceptedActRootWorkHandoff.drainsPublicReactActQueue, false);
  assert.equal(row.acceptedActRootWorkHandoff.executesQueuedWork, false);
  assert.equal(row.acceptedActRootWorkHandoff.executesEffects, false);
  assert.equal(row.acceptedActRootWorkHandoff.executesRendererWork, false);
  assert.equal(row.acceptedActRootWorkHandoff.executesRendererRoots, false);
  assert.equal(
    row.acceptedActRootWorkHandoff.publicSchedulerTimingCompatibilityClaimed,
    false
  );
  assert.equal(row.acceptedActRootWorkHandoff.publicReactActCompatibilityClaimed, false);
  assert.equal(
    row.acceptedActRootWorkHandoff.publicRootSchedulerCompatibilityClaimed,
    false
  );
  assert.equal(row.acceptedActRootWorkHandoff.publicRendererCompatibilityClaimed, false);
  assert.equal(row.browserPostTaskCompatibilityClaimed, false);
  assert.equal(row.browserTaskOrderingCompatibilityClaimed, false);
  assert.equal(row.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(row.compatibilityClaimed, false);
});

test('private postTask delayed scheduler.yield handoff stays diagnostic-only after continuation execution', async () => {
  const {inspectSchedulerPostTaskPriorityDiagnostics} =
    await loadPostTaskOracleModule();
  const report = inspectSchedulerPostTaskPriorityDiagnostics({
    nodeEnv: 'development',
    withYield: true
  });
  const flow = report.delayedContinuationActRootHandoff;
  const diagnostics = flow.diagnosticsAfterFallback;
  const continuation = diagnostics.continuationFallbacks[0];
  const route = diagnostics.rootContinuationExecutionRoute;
  const handoff = route.actRootWorkHandoff;
  const row = createPrivatePostTaskRootContinuationMetadataRow(diagnostics);

  assert.deepEqual(
    flow.fallbackEvents.map((entry) => entry.type),
    ['yield', 'yield.then']
  );
  assert.deepEqual(flow.events, [
    {
      label: 'delayed-start',
      currentPriorityLevel: 4
    },
    {
      label: 'delayed-continuation',
      currentPriorityLevel: 4
    }
  ]);
  assert.equal(diagnostics.environmentCapabilities.hasSchedulerYield, true);
  assert.equal(diagnostics.actRootWorkHandoffDiagnostics, true);
  assert.equal(diagnostics.callbackRuns.length, 2);
  assert.equal(diagnostics.continuationFallbacks.length, 1);
  assert.equal(continuation.fallback, 'scheduler.yield');
  assert.equal(
    continuation.continuationMetadata.selectedFallback,
    'scheduler.yield'
  );
  assert.equal(
    continuation.continuationMetadata.schedulerYieldAvailableAtSchedule,
    true
  );
  assert.deepEqual(
    continuation.fallbackEnvironmentClassification,
    expectedFallbackEnvironmentClassification(true)
  );
  assert.equal(route.hasActRootWorkHandoff, true);
  assert.equal(route.fallback, 'scheduler.yield');
  assert.deepEqual(
    route.fallbackEnvironmentClassification,
    expectedFallbackEnvironmentClassification(true)
  );
  assert.equal(handoff.status, ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS);
  assert.equal(handoff.accepted, true);
  assert.equal(handoff.delayedCallbackPathAccepted, true);
  assert.equal(handoff.actQueueHandoffOnly, true);
  assert.equal(handoff.rootWorkMetadataOnly, true);
  assert.equal(handoff.rendererWorkExecutionBlocked, true);
  assert.equal(handoff.drainsPublicSchedulerTaskQueue, false);
  assert.equal(handoff.drainsPublicReactActQueue, false);
  assert.equal(handoff.executesQueuedWork, false);
  assert.equal(handoff.executesEffects, false);
  assert.equal(handoff.executesRendererWork, false);
  assert.equal(handoff.executesRendererRoots, false);
  assert.equal(handoff.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(handoff.publicReactActCompatibilityClaimed, false);
  assert.equal(handoff.publicRootSchedulerCompatibilityClaimed, false);
  assert.equal(handoff.publicRendererCompatibilityClaimed, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.equal(route.privateRootContinuationExecution.rendererWorkExecuted, false);
  assert.equal(route.privateRootContinuationExecution.reconcilerWorkExecuted, false);
  assert.equal(
    route.privateRootContinuationExecution.nativeRendererWorkExecuted,
    false
  );
  assert.equal(route.privateRootContinuationExecution.publicRootExecution, false);
  assert.equal(route.privateRootContinuationExecution.publicSchedulerFlush, false);
  assert.equal(
    route.privateRootContinuationExecution.continuationCallbackExecuted,
    false
  );

  assert.equal(row.status, ROOT_CONTINUATION_REJECTED_STATUS);
  assert.equal(row.accepted, false);
  assert.equal(row.rejected, true);
  assert.equal(row.rejectionReason, 'stale-continuation');
  assert.equal(row.rejectionDetails.continuationIndex, 0);
  assert.equal(
    row.rejectionDetails.continuationId,
    derivePrivatePostTaskRootContinuationId(diagnostics, continuation)
  );
  assert.equal(row.rejectionDetails.callbackRunCountAtSchedule, 1);
  assert.equal(row.rejectionDetails.currentCallbackRunCount, 2);
  assert.equal(row.blockedRootExecution.rendererWorkExecuted, false);
  assert.equal(row.blockedRootExecution.reconcilerWorkExecuted, false);
  assert.equal(row.blockedRootExecution.nativeRendererWorkExecuted, false);
  assert.equal(row.blockedRootExecution.publicRootExecution, false);
  assert.equal(row.blockedRootExecution.publicSchedulerFlush, false);
  assert.equal(row.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(row.compatibilityClaimed, false);

  const publicYieldHandoffClaimRecord = {
    ...diagnostics,
    rootContinuationExecutionRoute: {
      ...route,
      actRootWorkHandoff: {
        ...handoff,
        publicRootSchedulerCompatibilityClaimed: true
      }
    }
  };
  const publicYieldHandoffClaimRow =
    createPrivatePostTaskRootContinuationMetadataRow(
      publicYieldHandoffClaimRecord
    );
  assert.equal(
    publicYieldHandoffClaimRow.status,
    ROOT_CONTINUATION_REJECTED_STATUS
  );
  assert.equal(
    publicYieldHandoffClaimRow.rejectionReason,
    'public-compatibility-claimed'
  );
  assert.equal(
    publicYieldHandoffClaimRow.rejectionDetails.claimPath,
    'record.rootContinuationExecutionRoute.actRootWorkHandoff.publicRootSchedulerCompatibilityClaimed'
  );
  assert.equal(publicYieldHandoffClaimRow.compatibilityClaimed, false);
});

test('private postTask deferred scheduler.yield handoff stays pending until release and rejects after continuation execution', async () => {
  const {readSchedulerPostTaskPriorityDiagnostics} =
    await loadPostTaskOracleModule();
  const flow = withDeferredSchedulerYieldRuntime(
    {nodeEnv: 'development'},
    ({Scheduler, shim}) => {
      const events = [];
      const node = Scheduler.unstable_scheduleCallback(
        Scheduler.unstable_LowPriority,
        () => {
          events.push({
            label: 'delayed-start',
            currentPriorityLevel:
              Scheduler.unstable_getCurrentPriorityLevel()
          });
          return () => {
            events.push({
              label: 'delayed-continuation',
              currentPriorityLevel:
                Scheduler.unstable_getCurrentPriorityLevel()
            });
          };
        },
        {delay: 17}
      );
      const scheduleEvents = shim.takeEvents();
      const initialFlush = shim.flushPostTasks(1);
      const diagnosticsAfterFallback =
        readSchedulerPostTaskPriorityDiagnostics(node);
      const fallbackEvents = shim.takeEvents();
      const eventsAfterFallback = events.slice();
      const pendingYieldContinuationCountAfterFallback =
        shim.pendingYieldContinuationCount();
      const rowBeforeRelease =
        createPrivatePostTaskRootContinuationMetadataRow(
          diagnosticsAfterFallback
        );
      const releaseFlush = shim.flushYieldContinuations(1);
      const diagnosticsAfterRelease =
        readSchedulerPostTaskPriorityDiagnostics(node);
      const releaseEvents = shim.takeEvents();
      const rowAfterRelease =
        createPrivatePostTaskRootContinuationMetadataRow(
          diagnosticsAfterRelease
        );

      return {
        publicNodeKeys: Object.keys(node),
        scheduleEvents,
        initialFlush,
        diagnosticsAfterFallback,
        fallbackEvents,
        eventsAfterFallback,
        pendingYieldContinuationCountAfterFallback,
        rowBeforeRelease,
        releaseFlush,
        diagnosticsAfterRelease,
        releaseEvents,
        eventsAfterRelease: events,
        pendingYieldContinuationCountAfterRelease:
          shim.pendingYieldContinuationCount(),
        rowAfterRelease
      };
    }
  );
  const diagnosticsAfterFallback = flow.diagnosticsAfterFallback;
  const continuation = diagnosticsAfterFallback.continuationFallbacks[0];
  const route = diagnosticsAfterFallback.rootContinuationExecutionRoute;
  const handoff = route.actRootWorkHandoff;
  const rowBeforeRelease = flow.rowBeforeRelease;
  const diagnosticsAfterRelease = flow.diagnosticsAfterRelease;
  const rowAfterRelease = flow.rowAfterRelease;

  assert.deepEqual(flow.publicNodeKeys, ['_controller']);
  assert.deepEqual(flow.scheduleEvents, [
    {
      type: 'TaskController',
      priority: 'user-visible',
      signalId: 1
    },
    {
      type: 'postTask',
      hasDelayProperty: true,
      delay: {
        type: 'number',
        value: 17
      },
      signal: {
        id: 1,
        priority: 'user-visible',
        aborted: false
      }
    }
  ]);
  assert.deepEqual(flow.initialFlush, [
    {
      type: 'run-post-task',
      signal: {
        id: 1,
        priority: 'user-visible',
        aborted: false
      }
    }
  ]);
  assert.deepEqual(flow.fallbackEvents, [
    {
      type: 'yield',
      signal: {
        id: 1,
        priority: 'user-visible',
        aborted: false
      }
    },
    {
      type: 'yield.then-deferred',
      signal: {
        id: 1,
        priority: 'user-visible',
        aborted: false
      },
      callbackType: 'function',
      pendingYieldContinuationCount: 1
    }
  ]);
  assert.deepEqual(flow.eventsAfterFallback, [
    {
      label: 'delayed-start',
      currentPriorityLevel: 4
    }
  ]);
  assert.equal(flow.pendingYieldContinuationCountAfterFallback, 1);
  assert.equal(diagnosticsAfterFallback.environmentCapabilities.hasSchedulerYield, true);
  assert.equal(diagnosticsAfterFallback.callbackRuns.length, 1);
  assert.equal(diagnosticsAfterFallback.continuationFallbacks.length, 1);
  assert.equal(diagnosticsAfterFallback.compatibilityClaimed, false);
  assert.equal(
    diagnosticsAfterFallback.browserPostTaskCompatibilityClaimed,
    false
  );
  assert.equal(
    diagnosticsAfterFallback.browserTaskOrderingCompatibilityClaimed,
    false
  );
  assert.equal(
    diagnosticsAfterFallback.publicSchedulerTimingCompatibilityClaimed,
    false
  );
  assert.equal(continuation.fallback, 'scheduler.yield');
  assert.equal(
    continuation.continuationMetadata.selectedFallback,
    'scheduler.yield'
  );
  assert.equal(
    continuation.continuationMetadata.schedulerYieldAvailableAtSchedule,
    true
  );
  assert.equal(
    continuation.continuationMetadata.actRootWorkHandoffStatus,
    ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS
  );
  assert.equal(
    continuation.continuationMetadata.actRootWorkHandoffAccepted,
    true
  );
  assert.deepEqual(
    continuation.fallbackEnvironmentClassification,
    expectedFallbackEnvironmentClassification(true)
  );
  assert.equal(route.routeStatus, ROOT_CONTINUATION_PENDING_EXECUTION_STATUS);
  assert.equal(route.hasActRootWorkHandoff, true);
  assert.equal(route.fallback, 'scheduler.yield');
  assert.equal(route.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(route.publicReactActCompatibilityClaimed, false);
  assert.equal(route.publicRootSchedulerCompatibilityClaimed, false);
  assert.equal(route.publicRendererCompatibilityClaimed, false);
  assert.equal(
    route.privateRootContinuationExecution.status,
    ROOT_CONTINUATION_PENDING_EXECUTION_STATUS
  );
  assert.equal(
    route.privateRootContinuationExecution.continuationCallbackExecuted,
    false
  );
  assert.equal(route.privateRootContinuationExecution.rendererWorkExecuted, false);
  assert.equal(route.privateRootContinuationExecution.reconcilerWorkExecuted, false);
  assert.equal(
    route.privateRootContinuationExecution.nativeRendererWorkExecuted,
    false
  );
  assert.equal(route.privateRootContinuationExecution.publicRootExecution, false);
  assert.equal(route.privateRootContinuationExecution.publicSchedulerFlush, false);
  assert.equal(handoff.status, ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS);
  assert.equal(handoff.accepted, true);
  assert.equal(handoff.delayedCallbackPathAccepted, true);
  assert.equal(handoff.actQueueHandoffOnly, true);
  assert.equal(handoff.rootWorkMetadataOnly, true);
  assert.equal(handoff.rendererWorkExecutionBlocked, true);
  assert.equal(handoff.drainsPublicSchedulerTaskQueue, false);
  assert.equal(handoff.drainsPublicReactActQueue, false);
  assert.equal(handoff.executesQueuedWork, false);
  assert.equal(handoff.executesEffects, false);
  assert.equal(handoff.executesRendererWork, false);
  assert.equal(handoff.executesRendererRoots, false);
  assert.equal(handoff.publicCompatibilityClaimed, false);
  assert.equal(handoff.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(handoff.publicReactActCompatibilityClaimed, false);
  assert.equal(handoff.publicRootSchedulerCompatibilityClaimed, false);
  assert.equal(handoff.publicRendererCompatibilityClaimed, false);
  assert.equal(handoff.compatibilityClaimed, false);

  assert.equal(rowBeforeRelease.status, ROOT_CONTINUATION_METADATA_STATUS);
  assert.equal(rowBeforeRelease.accepted, true);
  assert.equal(rowBeforeRelease.rejected, false);
  assert.equal(
    rowBeforeRelease.rootContinuationExecutionRoute.routeStatus,
    ROOT_CONTINUATION_PENDING_EXECUTION_STATUS
  );
  assert.equal(
    rowBeforeRelease.privateRootContinuationExecution.status,
    ROOT_CONTINUATION_PENDING_EXECUTION_STATUS
  );
  assert.equal(
    rowBeforeRelease.acceptedRootContinuation.privateRootContinuationExecution.status,
    ROOT_CONTINUATION_PENDING_EXECUTION_STATUS
  );
  assert.equal(
    rowBeforeRelease.acceptedActRootWorkHandoff.status,
    ROOT_CONTINUATION_ACT_ROOT_WORK_HANDOFF_STATUS
  );
  assert.equal(rowBeforeRelease.blockedRootExecution.status, ROOT_CONTINUATION_BLOCKED_STATUS);
  assert.equal(rowBeforeRelease.blockedRootExecution.rendererWorkExecuted, false);
  assert.equal(rowBeforeRelease.blockedRootExecution.reconcilerWorkExecuted, false);
  assert.equal(
    rowBeforeRelease.blockedRootExecution.nativeRendererWorkExecuted,
    false
  );
  assert.equal(rowBeforeRelease.blockedRootExecution.publicRootExecution, false);
  assert.equal(rowBeforeRelease.blockedRootExecution.publicSchedulerFlush, false);
  assert.equal(rowBeforeRelease.browserPostTaskCompatibilityClaimed, false);
  assert.equal(rowBeforeRelease.browserTaskOrderingCompatibilityClaimed, false);
  assert.equal(rowBeforeRelease.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(rowBeforeRelease.compatibilityClaimed, false);

  assert.deepEqual(flow.releaseFlush, [
    {
      type: 'run-yield-continuation',
      signal: {
        id: 1,
        priority: 'user-visible',
        aborted: false
      }
    }
  ]);
  assert.deepEqual(flow.releaseEvents, []);
  assert.deepEqual(flow.eventsAfterRelease, [
    {
      label: 'delayed-start',
      currentPriorityLevel: 4
    },
    {
      label: 'delayed-continuation',
      currentPriorityLevel: 4
    }
  ]);
  assert.equal(flow.pendingYieldContinuationCountAfterRelease, 0);
  assert.equal(diagnosticsAfterRelease.callbackRuns.length, 2);
  assert.equal(diagnosticsAfterRelease.continuationFallbacks.length, 1);
  assert.equal(
    diagnosticsAfterRelease.rootContinuationExecutionRoute.privateRootContinuationExecution.continuationCallbackExecuted,
    false
  );
  assert.equal(diagnosticsAfterRelease.compatibilityClaimed, false);
  assert.equal(
    diagnosticsAfterRelease.browserPostTaskCompatibilityClaimed,
    false
  );
  assert.equal(
    diagnosticsAfterRelease.browserTaskOrderingCompatibilityClaimed,
    false
  );
  assert.equal(
    diagnosticsAfterRelease.publicSchedulerTimingCompatibilityClaimed,
    false
  );
  assert.equal(rowAfterRelease.status, ROOT_CONTINUATION_REJECTED_STATUS);
  assert.equal(rowAfterRelease.accepted, false);
  assert.equal(rowAfterRelease.rejected, true);
  assert.equal(rowAfterRelease.rejectionReason, 'stale-continuation');
  assert.equal(rowAfterRelease.rejectionDetails.continuationIndex, 0);
  assert.equal(
    rowAfterRelease.rejectionDetails.continuationId,
    derivePrivatePostTaskRootContinuationId(
      diagnosticsAfterRelease,
      diagnosticsAfterRelease.continuationFallbacks[0]
    )
  );
  assert.equal(rowAfterRelease.rejectionDetails.callbackRunCountAtSchedule, 1);
  assert.equal(rowAfterRelease.rejectionDetails.currentCallbackRunCount, 2);
  assert.equal(rowAfterRelease.blockedRootExecution.rendererWorkExecuted, false);
  assert.equal(rowAfterRelease.blockedRootExecution.reconcilerWorkExecuted, false);
  assert.equal(
    rowAfterRelease.blockedRootExecution.nativeRendererWorkExecuted,
    false
  );
  assert.equal(rowAfterRelease.blockedRootExecution.publicRootExecution, false);
  assert.equal(rowAfterRelease.blockedRootExecution.publicSchedulerFlush, false);
  assert.equal(rowAfterRelease.browserPostTaskCompatibilityClaimed, false);
  assert.equal(rowAfterRelease.browserTaskOrderingCompatibilityClaimed, false);
  assert.equal(rowAfterRelease.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(rowAfterRelease.compatibilityClaimed, false);

  const publicClaimAfterReleaseRecord = {
    ...diagnosticsAfterRelease,
    rootContinuationExecutionRoute: {
      ...diagnosticsAfterRelease.rootContinuationExecutionRoute,
      actRootWorkHandoff: {
        ...diagnosticsAfterRelease.rootContinuationExecutionRoute.actRootWorkHandoff,
        publicRendererCompatibilityClaimed: true
      }
    }
  };
  const publicClaimAfterReleaseRow =
    createPrivatePostTaskRootContinuationMetadataRow(
      publicClaimAfterReleaseRecord
    );
  assert.equal(
    publicClaimAfterReleaseRow.status,
    ROOT_CONTINUATION_REJECTED_STATUS
  );
  assert.equal(
    publicClaimAfterReleaseRow.rejectionReason,
    'public-compatibility-claimed'
  );
  assert.equal(
    publicClaimAfterReleaseRow.rejectionDetails.claimPath,
    'record.rootContinuationExecutionRoute.actRootWorkHandoff.publicRendererCompatibilityClaimed'
  );
  assert.equal(publicClaimAfterReleaseRow.compatibilityClaimed, false);
});

test('private postTask root continuation metadata rejects missing signal, stale continuation, and unsupported priority records', async () => {
  const {inspectSchedulerPostTaskPriorityDiagnostics} =
    await loadPostTaskOracleModule();
  const report = inspectSchedulerPostTaskPriorityDiagnostics({
    nodeEnv: 'development',
    withYield: false
  });
  const diagnostics =
    report.continuationAbortAfterFallback.diagnosticsAfterCancel;

  const missingSignalRecord = {
    ...diagnostics,
    continuationFallbacks: [
      {
        ...diagnostics.continuationFallbacks[0],
        signal: null,
        signalAtSchedule: null
      }
    ]
  };
  const missingSignalRow =
    createPrivatePostTaskRootContinuationMetadataRow(missingSignalRecord);
  assert.equal(missingSignalRow.status, ROOT_CONTINUATION_REJECTED_STATUS);
  assert.equal(missingSignalRow.accepted, false);
  assert.equal(missingSignalRow.rejected, true);
  assert.equal(missingSignalRow.rejectionReason, 'missing-continuation-signal');
  assert.equal(
    missingSignalRow.rejectionDetails.signalValidation.rejectionReason,
    'missing-continuation-signal'
  );
  assert.equal(missingSignalRow.blockedRootExecution.rendererWorkExecuted, false);
  assert.equal(missingSignalRow.compatibilityClaimed, false);

  const staleContinuationRow =
    createPrivatePostTaskRootContinuationMetadataRow(diagnostics, {
      continuationId: 'postTask:3:signal:9:continuation:stale'
    });
  assert.equal(staleContinuationRow.status, ROOT_CONTINUATION_REJECTED_STATUS);
  assert.equal(staleContinuationRow.rejectionReason, 'stale-continuation');
  assert.equal(staleContinuationRow.compatibilityClaimed, false);

  const alreadyRanContinuationRow =
    createPrivatePostTaskRootContinuationMetadataRow(
      report.continuation.diagnosticsAfterFlush
    );
  assert.equal(
    alreadyRanContinuationRow.status,
    ROOT_CONTINUATION_REJECTED_STATUS
  );
  assert.equal(
    alreadyRanContinuationRow.rejectionReason,
    'stale-continuation'
  );
  assert.equal(alreadyRanContinuationRow.compatibilityClaimed, false);

  const unsupportedPriorityRecord = report.scheduling.find(
    (entry) => entry.label === 'invalid-delay'
  ).diagnosticsBeforeFlush;
  const unsupportedPriorityRow =
    createPrivatePostTaskRootContinuationMetadataRow(unsupportedPriorityRecord);
  assert.equal(unsupportedPriorityRow.status, ROOT_CONTINUATION_REJECTED_STATUS);
  assert.equal(
    unsupportedPriorityRow.rejectionReason,
    'unsupported-priority-record'
  );
  assert.equal(unsupportedPriorityRow.compatibilityClaimed, false);

  const publicCompatibilityClaimRecord = {
    ...diagnostics,
    continuationFallbacks: [
      {
        ...diagnostics.continuationFallbacks[0],
        browserPostTaskCompatibilityClaimed: true
      }
    ]
  };
  const publicCompatibilityClaimRow =
    createPrivatePostTaskRootContinuationMetadataRow(
      publicCompatibilityClaimRecord
    );
  assert.equal(
    publicCompatibilityClaimRow.status,
    ROOT_CONTINUATION_REJECTED_STATUS
  );
  assert.equal(
    publicCompatibilityClaimRow.rejectionReason,
    'public-compatibility-claimed'
  );
  assert.equal(
    publicCompatibilityClaimRow.rejectionDetails.claimPath,
    'record.continuationFallbacks.0.browserPostTaskCompatibilityClaimed'
  );
  assert.equal(publicCompatibilityClaimRow.compatibilityClaimed, false);

  const delayedDiagnostics =
    report.delayedContinuationActRootHandoff.diagnosticsAfterFallback;
  const publicActRootHandoffClaimRecord = {
    ...delayedDiagnostics,
    rootContinuationExecutionRoute: {
      ...delayedDiagnostics.rootContinuationExecutionRoute,
      actRootWorkHandoff: {
        ...delayedDiagnostics.rootContinuationExecutionRoute.actRootWorkHandoff,
        publicReactActCompatibilityClaimed: true
      }
    }
  };
  const publicActRootHandoffClaimRow =
    createPrivatePostTaskRootContinuationMetadataRow(
      publicActRootHandoffClaimRecord
    );
  assert.equal(
    publicActRootHandoffClaimRow.status,
    ROOT_CONTINUATION_REJECTED_STATUS
  );
  assert.equal(
    publicActRootHandoffClaimRow.rejectionReason,
    'public-compatibility-claimed'
  );
  assert.equal(
    publicActRootHandoffClaimRow.rejectionDetails.claimPath,
    'record.rootContinuationExecutionRoute.actRootWorkHandoff.publicReactActCompatibilityClaimed'
  );
  assert.equal(publicActRootHandoffClaimRow.compatibilityClaimed, false);

  const missingActRootHandoffRecord = {
    ...delayedDiagnostics,
    rootContinuationExecutionRoute: {
      ...delayedDiagnostics.rootContinuationExecutionRoute,
      hasActRootWorkHandoff: true,
      actRootWorkHandoff: null
    }
  };
  const missingActRootHandoffRow =
    createPrivatePostTaskRootContinuationMetadataRow(
      missingActRootHandoffRecord
    );
  assert.equal(
    missingActRootHandoffRow.status,
    ROOT_CONTINUATION_REJECTED_STATUS
  );
  assert.equal(
    missingActRootHandoffRow.rejectionReason,
    'missing-act-root-work-handoff'
  );
  assert.equal(missingActRootHandoffRow.compatibilityClaimed, false);

  const missingRouteRecord = {
    ...diagnostics,
    rootContinuationExecutionRoute: null
  };
  const missingRouteRow =
    createPrivatePostTaskRootContinuationMetadataRow(missingRouteRecord);
  assert.equal(missingRouteRow.status, ROOT_CONTINUATION_REJECTED_STATUS);
  assert.equal(
    missingRouteRow.rejectionReason,
    'missing-root-continuation-execution-route'
  );
  assert.equal(missingRouteRow.compatibilityClaimed, false);

  const publicRootExecutionRecord = {
    ...diagnostics,
    rootContinuationExecutionRoute: {
      ...diagnostics.rootContinuationExecutionRoute,
      privateRootContinuationExecution: {
        ...diagnostics.rootContinuationExecutionRoute.privateRootContinuationExecution,
        publicRootExecution: true
      }
    }
  };
  const publicRootExecutionRow =
    createPrivatePostTaskRootContinuationMetadataRow(
      publicRootExecutionRecord
    );
  assert.equal(publicRootExecutionRow.status, ROOT_CONTINUATION_REJECTED_STATUS);
  assert.equal(
    publicRootExecutionRow.rejectionReason,
    'unsupported-private-root-continuation-execution-route'
  );
  assert.equal(publicRootExecutionRow.compatibilityClaimed, false);
});

function loadPostTaskOracleModule() {
  if (postTaskOracleModulePromise === null) {
    postTaskOracleModulePromise = import(
      pathToFileURL(
        path.join(repoRoot, 'tests/conformance/src/scheduler-post-task-oracle.mjs')
      ).href
    );
  }
  return postTaskOracleModulePromise;
}

function expectedPriorityTimeout({
  priorityLevel,
  schedulerPriorityName,
  timeoutMs,
  timeoutReason
}) {
  return {
    status: 'scheduler-post-task-private-priority-timeout-diagnostics',
    priorityLevel,
    schedulerPriorityName,
    recognizedPriority: true,
    timeoutMs,
    timeoutReason,
    timeoutClassification: 'finite-priority-timeout',
    didTimeoutArgument: false,
    didTimeoutSource:
      'scheduler-post-task-deprecated-didTimeout-is-always-false',
    expiresAt: null,
    rawTimingCaptured: false,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function expectedFallbackEnvironmentClassification(withYield) {
  return {
    status: 'controlled-shim-fallback-environment-classification',
    environmentKind: 'controlled-task-scheduling-api-shim',
    classification: withYield
      ? 'controlled-shim-scheduler-yield-continuation'
      : 'controlled-shim-scheduler-post-task-continuation',
    selectedFallback: withYield ? 'scheduler.yield' : 'scheduler.postTask',
    hasSchedulerPostTask: true,
    hasSchedulerYield: withYield,
    usesSchedulerYield: withYield,
    usesSchedulerPostTaskFallback: !withYield,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function withDeferredSchedulerYieldRuntime({nodeEnv}, callback) {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousGlobals = capturePostTaskGlobals();

  clearWorkspaceSchedulerPostTaskCache();
  delete globalThis.window;
  delete globalThis.scheduler;
  delete globalThis.TaskController;
  delete globalThis.__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__;

  globalThis.__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__ = true;
  process.env.NODE_ENV = nodeEnv;
  const shim = installDeferredSchedulerYieldShim();

  try {
    const Scheduler = require(workspaceSchedulerPostTaskEntrypoint);
    return callback({Scheduler, shim});
  } finally {
    clearWorkspaceSchedulerPostTaskCache();
    restorePostTaskGlobals(previousGlobals);
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function installDeferredSchedulerYieldShim() {
  const events = [];
  const postTaskQueue = [];
  const yieldContinuationQueue = [];
  let now = 100;
  let nextSignalId = 1;

  class TaskController {
    constructor(options) {
      this.priority = options.priority;
      this.signal = {
        id: nextSignalId++,
        aborted: false,
        priority: options.priority
      };
      events.push({
        type: 'TaskController',
        priority: options.priority,
        signalId: this.signal.id
      });
    }

    abort() {
      this.signal.aborted = true;
      events.push({
        type: 'abort',
        priority: this.priority,
        signalId: this.signal.id
      });
    }
  }

  globalThis.window = {
    performance: {
      now: () => now
    },
    setTimeout(callback) {
      events.push({
        type: 'window.setTimeout',
        callbackType: typeof callback
      });
      return 1;
    }
  };
  globalThis.TaskController = TaskController;
  globalThis.scheduler = {
    postTask(task, options = {}) {
      events.push(describePostTaskShimCall(options));
      postTaskQueue.push({task, options});
      return catchablePostTaskThenable();
    },
    yield(options = {}) {
      events.push({
        type: 'yield',
        signal: describeShimSignal(options.signal)
      });
      return {
        then(onFulfilled) {
          yieldContinuationQueue.push({onFulfilled, options});
          events.push({
            type: 'yield.then-deferred',
            signal: describeShimSignal(options.signal),
            callbackType: typeof onFulfilled,
            pendingYieldContinuationCount: yieldContinuationQueue.length
          });
          return catchablePostTaskThenable();
        },
        catch() {
          return this;
        }
      };
    }
  };

  return {
    setNow(value) {
      now = value;
    },
    takeEvents() {
      const taken = events.slice();
      events.length = 0;
      return taken;
    },
    flushPostTasks(maxTasks) {
      const flushEvents = [];
      let flushedTaskCount = 0;
      let guard = 0;
      while (
        postTaskQueue.length > 0 &&
        (maxTasks === undefined || flushedTaskCount < maxTasks)
      ) {
        if (guard++ > 20) {
          throw new Error('postTask diagnostics shim exceeded flush guard');
        }
        const next = postTaskQueue.shift();
        flushedTaskCount++;
        if (next.options.signal?.aborted) {
          flushEvents.push({
            type: 'skip-aborted',
            signal: describeShimSignal(next.options.signal)
          });
          continue;
        }
        flushEvents.push({
          type: 'run-post-task',
          signal: describeShimSignal(next.options.signal)
        });
        next.task();
      }
      return flushEvents;
    },
    flushYieldContinuations(maxContinuations) {
      const flushEvents = [];
      let flushedContinuationCount = 0;
      let guard = 0;
      while (
        yieldContinuationQueue.length > 0 &&
        (maxContinuations === undefined ||
          flushedContinuationCount < maxContinuations)
      ) {
        if (guard++ > 20) {
          throw new Error('scheduler.yield diagnostics shim exceeded flush guard');
        }
        const next = yieldContinuationQueue.shift();
        flushedContinuationCount++;
        if (next.options.signal?.aborted) {
          flushEvents.push({
            type: 'skip-aborted-yield-continuation',
            signal: describeShimSignal(next.options.signal)
          });
          continue;
        }
        flushEvents.push({
          type: 'run-yield-continuation',
          signal: describeShimSignal(next.options.signal)
        });
        next.onFulfilled();
      }
      return flushEvents;
    },
    pendingYieldContinuationCount() {
      return yieldContinuationQueue.length;
    }
  };
}

function describePostTaskShimCall(options) {
  return {
    type: 'postTask',
    hasDelayProperty: Object.hasOwn(options, 'delay'),
    delay:
      options.delay === undefined
        ? {type: 'undefined', value: null}
        : {type: typeof options.delay, value: options.delay},
    signal: describeShimSignal(options.signal)
  };
}

function describeShimSignal(signal) {
  return {
    id: signal?.id ?? null,
    priority: signal?.priority ?? null,
    aborted: signal?.aborted === true
  };
}

function catchablePostTaskThenable() {
  return {
    catch() {
      return this;
    }
  };
}

function capturePostTaskGlobals() {
  return {
    window: captureGlobalProperty('window'),
    scheduler: captureGlobalProperty('scheduler'),
    TaskController: captureGlobalProperty('TaskController'),
    diagnosticsFlag: captureGlobalProperty(
      '__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__'
    )
  };
}

function captureGlobalProperty(propertyName) {
  return {
    hadProperty: Object.hasOwn(globalThis, propertyName),
    value: globalThis[propertyName]
  };
}

function restorePostTaskGlobals(previousGlobals) {
  restoreGlobalProperty('window', previousGlobals.window);
  restoreGlobalProperty('scheduler', previousGlobals.scheduler);
  restoreGlobalProperty('TaskController', previousGlobals.TaskController);
  restoreGlobalProperty(
    '__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__',
    previousGlobals.diagnosticsFlag
  );
}

function restoreGlobalProperty(propertyName, previous) {
  if (previous.hadProperty) {
    globalThis[propertyName] = previous.value;
  } else {
    delete globalThis[propertyName];
  }
}

function clearWorkspaceSchedulerPostTaskCache() {
  for (const id of Object.keys(require.cache)) {
    if (id.startsWith(workspaceSchedulerPackageRoot)) {
      delete require.cache[id];
    }
  }
}
