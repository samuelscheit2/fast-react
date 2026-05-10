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
  ROOT_CONTINUATION_BLOCKED_STATUS,
  ROOT_CONTINUATION_FALLBACK_STATUS,
  ROOT_CONTINUATION_METADATA_STATUS,
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
  assert.equal(row.sourceDiagnostics.continuationSignalValidationDiagnostics, true);
  assert.equal(row.sourceDiagnostics.continuationAbortOrderingDiagnostics, true);
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
  assert.equal(row.continuationFallback.status, ROOT_CONTINUATION_FALLBACK_STATUS);
  assert.equal(row.continuationFallback.selectedFallback, 'scheduler.postTask');
  assert.equal(row.acceptedRootContinuation.status, ACCEPTED_ROOT_CONTINUATION_STATUS);
  assert.equal(row.acceptedRootContinuation.accepted, true);
  assert.equal(Object.isFrozen(row.acceptedRootContinuation), true);
  assert.equal(
    row.acceptedRootContinuation.abortOrdering.status,
    'continuation-abort-ordering-observed-after-abort-call'
  );
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
