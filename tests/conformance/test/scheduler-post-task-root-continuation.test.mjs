import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const conformanceRoot = path.resolve(testDirectory, '..');
const repoRoot = path.resolve(conformanceRoot, '..', '..');
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
