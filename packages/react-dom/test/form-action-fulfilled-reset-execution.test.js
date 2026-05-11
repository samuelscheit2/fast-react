'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(packageRoot, 'src');
const resourceFormGate = require(path.join(
  sourceRoot,
  'resource-form-gates.js'
));
const formActions = require(path.join(
  sourceRoot,
  'shared',
  'form-actions.js'
));
const rootBridge = require(path.join(sourceRoot, 'client', 'root-bridge.js'));

const compatibilityTarget = 'react-dom@19.2.6';

test('private fulfilled form action reset execution records deterministic fake queue and commit evidence', async () => {
  const first = await createFulfilledResetExecutionRecord(
    'fulfilled-reset-deterministic'
  );
  const second = await createFulfilledResetExecutionRecord(
    'fulfilled-reset-deterministic'
  );
  const { asyncExecution, callbackCalls, execution, record, rootContext } =
    first;
  const summary =
    formActions.describePrivateFormActionFulfilledResetExecutionGate();

  assert.deepEqual(first.record, second.record);
  assert.equal(callbackCalls, 1);

  assert.equal(
    summary.gateId,
    formActions.privateFormActionFulfilledResetExecutionGateId
  );
  assert.equal(
    summary.status,
    formActions.privateFormActionFulfilledResetExecutionStatus
  );
  assert.equal(
    summary.acceptedAsyncCallbackExecutionRecordType,
    formActions.privateFormActionAsyncCallbackExecutionRecordType
  );
  assert.equal(
    summary.acceptedSubmitResetExecutionRecordType,
    formActions.privateFormActionSubmitResetExecutionRecordType
  );
  assert.equal(summary.consumesFulfilledAsyncCallbackExecution, true);
  assert.equal(summary.consumesSubmitResetExecutionMetadata, true);
  assert.equal(summary.consumesSourceOwnedResetCurrentness, true);
  assert.equal(
    summary.fakeFormIdentityRecordType,
    formActions.privateFormActionResetFakeFormIdentityRecordType
  );
  assert.equal(
    summary.resetCurrentnessRecordType,
    formActions.privateFormActionResetCurrentnessRecordType
  );
  assert.equal(summary.recordsFulfilledActionResultMetadata, true);
  assert.equal(summary.acceptsPrivateRootLifecycleBinding, true);
  assert.equal(summary.rootlessStandaloneFormEvidenceAllowed, true);
  assert.equal(summary.recordsRootLifecycleBoundaryWhenProvided, true);
  assert.equal(
    summary.rootLifecycleBoundaryRecordType,
    formActions.privateFormActionFulfilledResetRootLifecycleBoundaryRecordType
  );
  assert.equal(summary.executesDeterministicFakeResetStateQueue, true);
  assert.equal(summary.recordsDeterministicFakeResetCommit, true);
  assert.equal(summary.rejectsRejectedAsyncCallbacks, true);
  assert.equal(summary.rejectsNonThenableAsyncCallbacks, true);
  assert.equal(summary.rejectsSynchronousThrowAsyncCallbacks, true);
  assert.equal(summary.rejectsReplayAfterResetGenerationAdvance, true);
  assert.equal(summary.rejectsForeignSubmitResetExecutionMetadata, true);
  assert.equal(summary.rejectsPublicDomMutation, true);
  assert.equal(summary.rejectsPackageCompatibilityClaims, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.acceptsPrivateAsyncActionCallbacks, false);
  assert.equal(summary.invokesPrivateAsyncActionCallbacks, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.commitsFormResets, false);
  assert.equal(summary.callsResetFormInstance, false);
  assert.equal(summary.resetsForms, false);
  assert.deepEqual(
    summary.sideEffects,
    formActions.formActionFulfilledResetExecutionBlockedSideEffects
  );

  assert.equal(Object.isFrozen(asyncExecution), true);
  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    formActions.isPrivateFormActionFulfilledResetExecutionRecord(record),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionFulfilledResetExecutionRecordPayload(
      record
    ),
    record
  );
  assert.equal(
    record.status,
    formActions.privateFormActionFulfilledResetExecutionRecordedStatus
  );
  assert.equal(record.executionId, 'fulfilled-reset-deterministic-reset:1');
  assert.equal(
    record.sourceAsyncCallbackExecutionId,
    asyncExecution.executionId
  );
  assert.equal(
    record.sourceSubmitResetExecutionId,
    execution.executionId
  );
  assert.equal(
    record.acceptedMetadataIds.asyncCallbackExecutionId,
    asyncExecution.executionId
  );
  assert.equal(
    record.acceptedMetadataIds.fulfilledAsyncCallbackExecutionId,
    asyncExecution.executionId
  );
  assert.equal(
    record.acceptedMetadataIds.submitResetExecutionId,
    execution.executionId
  );
  assert.equal(
    record.acceptedMetadataIds.fakeFormIdentityId,
    execution.fakeFormIdentity.fakeFormIdentityId
  );
  assert.equal(
    record.acceptedMetadataIds.resetCurrentnessId,
    execution.resetCurrentness.currentnessId
  );
  assert.equal(record.acceptedMetadataIds.resetGeneration, 1);
  assert.equal(record.admission.deterministicFakeResetCommitOnly, true);
  assert.equal(record.admission.postFulfillmentOnly, true);
  assert.equal(
    record.admission.diagnosticKind,
    formActions.formActionFulfilledResetExecutionDiagnosticKind
  );
  assert.equal(
    record.admission.queueExecutionKind,
    formActions.formActionFulfilledResetExecutionQueueExecutionKind
  );
  assert.equal(record.admission.fulfilledActionResultConsumed, true);
  assert.equal(record.admission.resetMetadataConsumed, true);
  assert.equal(record.admission.privateAsyncActionCallbackInvoked, false);
  assert.equal(record.admission.reactUpdateQueued, false);
  assert.equal(record.admission.realFormReset, false);
  assert.equal(
    record.resetCurrentness.$$typeof,
    formActions.privateFormActionResetCurrentnessRecordType
  );
  assert.equal(
    record.resetCurrentness.status,
    formActions.privateFormActionResetCurrentnessStatus
  );
  assert.equal(
    record.resetCurrentness.fakeFormIdentityId,
    execution.fakeFormIdentity.fakeFormIdentityId
  );
  assert.equal(record.resetCurrentness.resetGeneration, 1);
  assert.equal(record.resetCurrentness.resetGenerationCurrent, true);
  assert.equal(
    record.resetCurrentness.replayAfterGenerationAdvanceRejected,
    true
  );
  assert.equal(record.resetCurrentness.publicResetExecution, false);
  assert.equal(record.resetCurrentness.reactUpdateQueued, false);
  assert.equal(record.resetCurrentness.realFormReset, false);
  assert.equal(
    record.rootExecutionBoundary.$$typeof,
    formActions.privateFormActionFulfilledResetRootLifecycleBoundaryRecordType
  );
  assert.equal(
    record.rootExecutionBoundary.status,
    formActions.privateFormActionFulfilledResetRootLifecycleBoundaryStatus
  );
  assert.equal(
    record.rootExecutionBoundary.sourceRootBridgeAdmissionId,
    rootContext.admission.requestId
  );
  assert.equal(
    record.rootExecutionBoundary.sourceRootLifecycleBoundaryId,
    rootContext.lifecycleBoundary.boundaryId
  );
  assert.equal(record.rootExecutionBoundary.rootId, rootContext.admission.rootId);
  assert.equal(
    record.rootExecutionBoundary.lifecycleTransition,
    rootContext.lifecycleBoundary.lifecycleTransition
  );
  assert.equal(
    record.rootExecutionBoundary.sourceOwnedRootLifecycleBoundary,
    true
  );
  assert.equal(record.rootExecutionBoundary.requestBoundaryCurrent, true);
  assert.equal(record.rootExecutionBoundary.publicRootExecution, false);
  assert.deepEqual(record.rootExecutionBoundary.sourceOwnedTokens, [
    formActions.privateFormActionFulfilledResetRootLifecycleBoundaryRecordType,
    formActions.privateFormActionFulfilledResetRootLifecycleBoundaryStatus,
    rootBridge.privateRootAdmissionRecordType,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED,
    rootBridge.privateRootLifecycleRequestBoundaryRecordType,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED,
    rootContext.admission.rootId,
    rootContext.lifecycleBoundary.boundaryId,
    rootContext.lifecycleBoundary.lifecycleTransition
  ]);
  const rootIdentity =
    formActions
      .getPrivateFormActionFulfilledResetExecutionRootIdentityPayload(
        record
      );
  assert.equal(rootIdentity.rootBridgeAdmission, rootContext.admission);
  assert.equal(
    rootIdentity.rootLifecycleRequestBoundary,
    rootContext.lifecycleBoundary
  );
  assert.equal(rootIdentity.rootExecutionBoundary, record.rootExecutionBoundary);

  assert.equal(record.sourceAsyncCallbackExecution.fulfilled, true);
  assert.equal(record.sourceAsyncCallbackExecution.rejected, false);
  assert.equal(record.sourceAsyncCallbackExecution.failClosed, false);
  assert.equal(
    record.sourceAsyncCallbackExecution.callbackExecutionStatus,
    'executed-private-form-action-async-callback-fulfilled'
  );
  assert.equal(record.sourceAsyncCallbackExecution.reactUpdateQueued, false);
  assert.equal(record.sourceAsyncCallbackExecution.realFormReset, false);
  assert.equal(
    record.sourceAsyncCallbackExecution.resetCurrentnessId,
    record.resetCurrentness.currentnessId
  );
  assert.equal(record.sourceAsyncCallbackExecution.resetGeneration, 1);
  assert.equal(
    record.sourceAsyncCallbackExecution.resetGenerationCurrent,
    true
  );
  assert.equal(
    record.sourceSubmitResetExecution.fakeFormResetPathExecuted,
    true
  );
  assert.equal(
    record.sourceSubmitResetExecution.resetCurrentnessId,
    record.resetCurrentness.currentnessId
  );
  assert.equal(record.sourceSubmitResetExecution.resetGeneration, 1);
  assert.equal(
    record.sourceSubmitResetExecution.resetGenerationCurrent,
    true
  );
  assert.equal(record.sourceSubmitResetExecution.reactUpdateQueued, false);
  assert.equal(record.sourceSubmitResetExecution.realFormReset, false);

  assert.equal(
    record.fulfilledActionResult.status,
    'recorded-private-form-action-fulfilled-result-metadata'
  );
  assert.equal(record.fulfilledActionResult.fulfilled, true);
  assert.equal(record.fulfilledActionResult.failClosed, false);
  assert.deepEqual(record.fulfilledActionResult.valueInfo, {
    type: 'object',
    constructorName: 'Object',
    ownKeyCount: 1
  });
  assert.equal(record.fulfilledActionResult.actionResultExposed, false);

  assert.equal(
    record.fakeResetStateQueueExecution.status,
    'executed-private-form-action-fulfilled-reset-state-queue-fake'
  );
  assert.deepEqual(
    record.fakeResetStateQueueExecution.sourceFunctionNames,
    [
      'requestFormReset',
      'ensureFormComponentIsStateful',
      'dispatchSetStateInternal',
      'requestUpdateLane'
    ]
  );
  assert.equal(
    record.fakeResetStateQueueExecution.queueExecutionId,
    `${record.executionId}:reset-state-queue`
  );
  assert.equal(
    record.fakeResetStateQueueExecution.resetStateUpdateId,
    `${record.executionId}:reset-state-update`
  );
  assert.equal(
    record.fakeResetStateQueueExecution.fakeResetStateQueueExecuted,
    true
  );
  assert.equal(
    record.fakeResetStateQueueExecution.fakeResetStateUpdateQueued,
    true
  );
  assert.equal(
    record.fakeResetStateQueueExecution.queueExecutionKind,
    formActions.formActionFulfilledResetExecutionQueueExecutionKind
  );
  assert.equal(
    record.fakeResetStateQueueExecution.resetCurrentnessId,
    record.resetCurrentness.currentnessId
  );
  assert.equal(record.fakeResetStateQueueExecution.resetGeneration, 1);
  assert.equal(
    record.fakeResetStateQueueExecution.resetGenerationCurrent,
    true
  );
  assert.equal(
    record.fakeResetStateQueueExecution.rootExecutionBoundaryId,
    record.rootExecutionBoundary.boundaryId
  );
  assert.equal(
    record.fakeResetStateQueueExecution.sourceRootBridgeAdmissionId,
    rootContext.admission.requestId
  );
  assert.equal(
    record.fakeResetStateQueueExecution.sourceRootLifecycleBoundaryId,
    rootContext.lifecycleBoundary.boundaryId
  );
  assert.equal(
    record.fakeResetStateQueueExecution.rootContainerInfo,
    record.rootExecutionBoundary.rootContainerInfo
  );
  assert.equal(
    record.fakeResetStateQueueExecution.resetQueuePendingMutated,
    false
  );
  assert.equal(record.fakeResetStateQueueExecution.resetStateQueued, false);
  assert.equal(record.fakeResetStateQueueExecution.reactUpdateQueued, false);
  assert.equal(record.fakeResetStateQueueExecution.updateQueueCaptured, false);

  assert.equal(
    record.fakeResetCommitExecution.status,
    'executed-private-form-action-fulfilled-reset-commit-fake'
  );
  assert.deepEqual(record.fakeResetCommitExecution.sourceFunctionNames, [
    'requestFormReset',
    'resetFormInstance'
  ]);
  assert.equal(
    record.fakeResetCommitExecution.fakeResetStateQueueExecutionId,
    record.fakeResetStateQueueExecution.queueExecutionId
  );
  assert.equal(
    record.fakeResetCommitExecution.resetCurrentnessId,
    record.resetCurrentness.currentnessId
  );
  assert.equal(record.fakeResetCommitExecution.resetGeneration, 1);
  assert.equal(
    record.fakeResetCommitExecution.resetGenerationCurrent,
    true
  );
  assert.equal(
    record.fakeResetCommitExecution.rootExecutionBoundaryId,
    record.rootExecutionBoundary.boundaryId
  );
  assert.equal(
    record.fakeResetCommitExecution.fakeResetStateQueueRootExecutionBoundaryId,
    record.fakeResetStateQueueExecution.rootExecutionBoundaryId
  );
  assert.equal(
    record.fakeResetCommitExecution.fakeResetStateQueueRootId,
    record.fakeResetStateQueueExecution.rootId
  );
  assert.equal(record.fakeResetCommitExecution.afterMutationEffectsOrder, true);
  assert.equal(
    record.fakeResetCommitExecution.fakeFormResetCommitRecorded,
    true
  );
  assert.equal(
    record.fakeResetCommitExecution.fakeResetFormInstanceCallRecorded,
    true
  );
  assert.equal(record.fakeResetCommitExecution.resetFormInstanceCalled, false);
  assert.equal(record.fakeResetCommitExecution.formResetCommitted, false);
  assert.equal(record.fakeResetCommitExecution.realFormReset, false);
  assert.equal(record.fakeResetCommitExecution.domMutation, false);

  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(
    record.publicFormActionBoundary.publicSubmitDispatchReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicRequestFormResetReachable,
    false
  );
  assert.equal(record.publicFormActionBoundary.reactUpdateQueued, false);
  assert.equal(record.publicFormActionBoundary.domMutation, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.deepEqual(
    record.sideEffects,
    formActions.formActionFulfilledResetExecutionDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.fakeResetStateQueueExecuted, true);
  assert.equal(record.sideEffects.fakeResetCommitExecuted, true);
  assert.equal(record.sideEffects.privateAsyncActionCallbackInvoked, false);
  assert.equal(record.sideEffects.reactUpdateQueued, false);
  assert.equal(record.sideEffects.realFormReset, false);

  const error =
    formActions.createUnsupportedFormActionFulfilledResetExecutionError(
      record
    );
  assert.equal(
    error.code,
    formActions.privateFormActionFulfilledResetExecutionGateErrorCode
  );
  assert.equal(error.executionId, record.executionId);
  assert.equal(
    error.sourceAsyncCallbackExecutionId,
    asyncExecution.executionId
  );
  assert.equal(error.rootExecutionBoundary, record.rootExecutionBoundary);
  assert.equal(error.resetCurrentness, record.resetCurrentness);
  assert.deepEqual(
    error.fakeResetStateQueueExecution,
    record.fakeResetStateQueueExecution
  );
  assert.deepEqual(
    error.fakeResetCommitExecution,
    record.fakeResetCommitExecution
  );
  assert.match(
    error.message,
    /fulfilled reset execution gate records fake reset queue and commit metadata only/u
  );
});

test('private fulfilled form action reset execution rejects stale foreign cloned fake public and failed inputs', async () => {
  const scenario = await createFulfilledAsyncScenario(
    'fulfilled-reset-negative'
  );
  const foreign = await createFulfilledAsyncScenario(
    'fulfilled-reset-foreign'
  );
  const gate =
    formActions.createFormActionFulfilledResetExecutionDiagnosticGate({
      requestIdPrefix: 'fulfilled-reset-negative-gate'
    });

  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        scenario.asyncExecution,
        scenario.execution,
        {
          explicitFormActionFulfilledResetExecution: true,
          sourceAsyncCallbackExecutionId: 'stale-async-execution'
        }
      ),
    {
      code:
        formActions
          .privateFormActionFulfilledResetExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'sourceAsyncCallbackExecutionId must match the fulfilled async callback execution record'
    }
  );
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        scenario.asyncExecution,
        scenario.execution,
        {
          explicitFormActionFulfilledResetExecution: true,
          sourceSubmitResetExecutionId: 'stale-reset-execution'
        }
      ),
    {
      code:
        formActions
          .privateFormActionFulfilledResetExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'sourceSubmitResetExecutionId must match the submit reset execution record'
    }
  );
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        scenario.asyncExecution,
        foreign.execution,
        {
          explicitFormActionFulfilledResetExecution: true
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit reset execution must match the fulfilled async callback reset metadata'
    }
  );

  const replayScenario = await createFulfilledAsyncScenario(
    'fulfilled-reset-negative-replay'
  );
  const laterResetExecution = formActions
    .createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix: 'fulfilled-reset-negative-later-reset'
    })
    .recordSubmitResetExecution(replayScenario.dispatch, {
      explicitFormActionSubmitResetExecution: true,
      fakeFormPath: {
        pathId: 'fulfilled-reset-negative-replay-fake-reset',
        pathKind: 'action-completion-submit-reset',
        hostTag: 'form',
        resetMode: 'record-only-fake-reset'
      }
    });
  assert.equal(replayScenario.execution.resetCurrentness.resetGeneration, 1);
  assert.equal(laterResetExecution.resetCurrentness.resetGeneration, 2);
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        replayScenario.asyncExecution,
        replayScenario.execution,
        {
          explicitFormActionFulfilledResetExecution: true
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit reset execution metadata is stale for the current reset generation'
    }
  );

  const fakeAsyncExecution = { ...scenario.asyncExecution };
  const fakeResetExecution = { ...scenario.execution };
  assert.equal(
    formActions.isPrivateFormActionAsyncCallbackExecutionRecord(
      fakeAsyncExecution
    ),
    false
  );
  assert.equal(
    formActions.isPrivateFormActionSubmitResetExecutionRecord(
      fakeResetExecution
    ),
    false
  );
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        fakeAsyncExecution,
        scenario.execution,
        {
          explicitFormActionFulfilledResetExecution: true
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source async callback execution must be an accepted fulfilled fake callback execution'
    }
  );
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        scenario.asyncExecution,
        fakeResetExecution,
        {
          explicitFormActionFulfilledResetExecution: true
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit reset execution must match the fulfilled async callback reset metadata'
    }
  );

  const rootContext = createPrivateRootBridgeAdmission(
    'fulfilled-reset-negative-root'
  );
  const foreignRootContext = createPrivateRootBridgeAdmission(
    'fulfilled-reset-negative-foreign-root'
  );
  const unmountRootContext = createPrivateRootBridgeAdmission(
    'fulfilled-reset-negative-unmount-root'
  );
  const unmount = unmountRootContext.bridge.unmountContainer(
    unmountRootContext.create.handle
  );
  const unmountAdmission =
    unmountRootContext.bridge.admitRequest(unmount);
  const unmountLifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(
      unmountAdmission
    );
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        scenario.asyncExecution,
        scenario.execution,
        {
          explicitFormActionFulfilledResetExecution: true
        },
        {
          rootBridgeAdmission: {
            ...rootContext.admission
          },
          rootLifecycleRequestBoundary: rootContext.lifecycleBoundary
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle binding for fulfilled reset execution must be source-owned active and current'
    }
  );
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        scenario.asyncExecution,
        scenario.execution,
        {
          explicitFormActionFulfilledResetExecution: true
        },
        {
          rootBridgeAdmission: unmountAdmission,
          rootLifecycleRequestBoundary: unmountLifecycleBoundary
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle binding for fulfilled reset execution must come from a render operation'
    }
  );
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        scenario.asyncExecution,
        scenario.execution,
        {
          explicitFormActionFulfilledResetExecution: true
        },
        {
          rootBridgeAdmission: rootContext.admission,
          rootLifecycleRequestBoundary:
            foreignRootContext.lifecycleBoundary
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle binding for fulfilled reset execution must be source-owned active and current'
    }
  );
  assert.throws(
    () =>
      gate.recordFulfilledResetExecution(
        scenario.asyncExecution,
        scenario.execution,
        {
          explicitFormActionFulfilledResetExecution: true
        },
        {
          render() {},
          unmount() {}
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle binding for fulfilled reset execution must be source-owned active and current'
    }
  );

  const rejected = await createAsyncExecution(
    scenario.preflight,
    'fulfilled-reset-negative-rejected',
    async function rejectedAction() {
      throw new Error('fulfilled reset rejected source');
    }
  );
  const syncThrow = await createAsyncExecution(
    scenario.preflight,
    'fulfilled-reset-negative-sync-throw',
    function syncThrowAction() {
      throw new Error('fulfilled reset sync throw source');
    }
  );
  const nonThenable = await createAsyncExecution(
    scenario.preflight,
    'fulfilled-reset-negative-non-thenable',
    function nonThenableAction() {
      return 'sync-result';
    }
  );
  for (const source of [rejected, syncThrow, nonThenable]) {
    assert.throws(
      () =>
        formActions
          .createFormActionFulfilledResetExecutionDiagnosticGate()
          .recordFulfilledResetExecution(source, scenario.execution, {
            explicitFormActionFulfilledResetExecution: true
          }),
      {
        code:
          formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
        compatibilityTarget,
        reason:
          'source async callback execution must be an accepted fulfilled fake callback execution'
      },
      source.callbackExecution.status
    );
  }

  let blockedCallbackCalls = 0;
  for (const { admission, reason } of [
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        asyncActionCallback() {
          blockedCallbackCalls++;
        }
      },
      reason:
        'asyncActionCallback must not be passed to the fulfilled reset execution gate'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        form: throwingProxy('fulfilled reset form')
      },
      reason: 'form must not be passed to the fulfilled reset execution gate'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        fakeResetCommit: {}
      },
      reason:
        'fakeResetCommit must not be passed to the fulfilled reset execution gate'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        rootId: 'caller-root'
      },
      reason:
        'rootId must not be passed to the fulfilled reset execution gate'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        diagnosticKind: 'real-react-update-queue'
      },
      reason:
        'diagnosticKind must be deterministic-private-fulfilled-action-reset-fake-commit'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        queueExecutionKind: 'real-react-update-queue'
      },
      reason:
        'queueExecutionKind must be deterministic-fake-reset-state-queue'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        publicSubmitDispatchRequested: true
      },
      reason: 'public submit dispatch must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        publicRequestFormResetRequested: true
      },
      reason: 'public reset request must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        publicActionInvocationRequested: true
      },
      reason: 'action invocation must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        updateQueue: {}
      },
      reason:
        'updateQueue must not be passed to the fulfilled reset execution gate'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        reactUpdateQueued: true
      },
      reason: 'react update queueing must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        realFormReset: true
      },
      reason: 'real reset commit must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        domMutationRequested: true
      },
      reason: 'DOM mutation must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        publicHeadMutation: true
      },
      reason: 'DOM mutation must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        publicResourceMapCommitBehavior: true
      },
      reason: 'DOM mutation must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        nativeExecution: true
      },
      reason: 'native/root execution must remain blocked'
    },
    {
      admission: {
        explicitFormActionFulfilledResetExecution: true,
        packageCompatibilityClaimed: true
      },
      reason: 'package compatibility must remain unclaimed'
    }
  ]) {
    assert.throws(
      () =>
        formActions
          .createFormActionFulfilledResetExecutionDiagnosticGate()
          .recordFulfilledResetExecution(
            scenario.asyncExecution,
            scenario.execution,
            admission
          ),
      {
        code:
          formActions
            .privateFormActionFulfilledResetExecutionInvalidAdmissionCode,
        compatibilityTarget,
        reason
      },
      reason
    );
  }
  assert.equal(blockedCallbackCalls, 0);

  const consumed = await createFulfilledAsyncScenario(
    'fulfilled-reset-consumed'
  );
  const consumedGate =
    formActions.createFormActionFulfilledResetExecutionDiagnosticGate({
      requestIdPrefix: 'fulfilled-reset-consumed-gate'
    });
  consumedGate.recordFulfilledResetExecution(
    consumed.asyncExecution,
    consumed.execution,
    {
      explicitFormActionFulfilledResetExecution: true
    }
  );
  assert.throws(
    () =>
      consumedGate.recordFulfilledResetExecution(
        consumed.asyncExecution,
        consumed.execution,
        {
          explicitFormActionFulfilledResetExecution: true
        }
      ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source fulfilled async callback execution was already consumed by this reset execution gate'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionFulfilledResetExecutionDiagnosticGate()
        .recordFulfilledResetExecution(
          consumed.asyncExecution,
          consumed.execution,
          {
            explicitFormActionFulfilledResetExecution: true
          }
        ),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source fulfilled async callback execution was already consumed by a fulfilled reset execution gate'
    }
  );
  assert.throws(
    () =>
      formActions.createUnsupportedFormActionFulfilledResetExecutionError({}),
    {
      code:
        formActions.privateFormActionFulfilledResetExecutionInvalidRecordCode,
      compatibilityTarget
    }
  );
});

async function createFulfilledResetExecutionRecord(prefix) {
  const scenario = await createFulfilledAsyncScenario(prefix);
  const rootContext = createPrivateRootBridgeAdmission(prefix);
  const resetExecutionGate =
    formActions.createFormActionFulfilledResetExecutionDiagnosticGate({
      requestIdPrefix: `${prefix}-reset`
    });
  const record = resetExecutionGate.recordFulfilledResetExecution(
    scenario.asyncExecution,
    scenario.execution,
    {
      explicitFormActionFulfilledResetExecution: true,
      sourceAsyncCallbackExecutionId: scenario.asyncExecution.executionId,
      sourceSubmitResetExecutionId: scenario.execution.executionId
    },
    {
      rootBridgeAdmission: rootContext.admission,
      rootLifecycleRequestBoundary: rootContext.lifecycleBoundary
    }
  );

  return {
    ...scenario,
    rootContext,
    record
  };
}

async function createFulfilledAsyncScenario(prefix) {
  const scenario = createPrivateFormActionCallbackPreflightScenario(prefix);
  let callbackCalls = 0;
  const asyncExecution = await createAsyncExecution(
    scenario.preflight,
    `${prefix}-async`,
    async function asyncActionCallback(payload) {
      callbackCalls++;
      assert.equal(Object.isFrozen(payload), true);
      assert.equal(payload.formDataConstructed, false);
      await Promise.resolve();
      return { ok: true };
    }
  );

  return {
    ...scenario,
    asyncExecution,
    callbackCalls
  };
}

function createPrivateRootBridgeAdmission(prefix) {
  const document = createRootBridgeDocument();
  const container = createRootBridgeElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    requestIdPrefix: `${prefix}-root-request`,
    rootIdPrefix: `${prefix}-root`,
    updateIdPrefix: `${prefix}-root-update`
  });
  const create = bridge.createClientRoot(container, {
    identifierPrefix: `${prefix}-`
  });
  const render = bridge.renderContainer(create.handle, {
    props: {
      children: 'blocked'
    },
    type: 'span'
  });
  const admission = bridge.admitRequest(render);
  const lifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(admission);

  return {
    admission,
    bridge,
    create,
    container,
    document,
    lifecycleBoundary,
    render
  };
}

function createRootBridgeDocument() {
  const document = {
    nodeName: '#document',
    nodeType: 9,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener) {
      this.__registrations.push({ listener, type });
    }
  };
  document.ownerDocument = document;
  return document;
}

function createRootBridgeElement(nodeName, ownerDocument) {
  return {
    nodeName,
    localName: nodeName.toLowerCase(),
    nodeType: 1,
    ownerDocument,
    parentNode: null,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener) {
      this.__registrations.push({ listener, type });
    }
  };
}

function createPrivateFormActionCallbackPreflightScenario(prefix) {
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: `${prefix}-source`
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: `${prefix}-extraction`
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: `${prefix}-queue`
    });
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: `${prefix}-blocker`
    });
  const dispatchGate =
    formActions.createFormActionSubmitDispatchDiagnosticGate({
      requestIdPrefix: `${prefix}-dispatch`
    });
  const executionGate =
    formActions.createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix: `${prefix}-reset-execution`
    });
  const preflightGate =
    formActions.createFormActionCallbackActionPreflightDiagnosticGate({
      requestIdPrefix: `${prefix}-preflight`
    });
  const submitIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    submissionTrigger: 'requestSubmit',
    actionKind: 'function',
    actionSource: 'form',
    submitControlKind: 'button',
    formActionKind: 'function',
    submitterActionKind: 'none',
    defaultPrevented: false,
    transitionScheduled: false
  });
  const extraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(submitIntent);
  const resetIntent = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'action-completion',
    formOwnership: 'react-owned',
    transitionContext: 'action'
  });
  const resetQueueCommit = queueCommitGate.recordResetQueueCommit(
    resetIntent,
    {
      explicitAdmission: true,
      queueSource: 'action-completion',
      queueKind: 'metadata-only-reset-state-queue',
      commitKind: 'after-mutation-form-reset-order',
      hostTag: 'form'
    }
  );
  const blocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: {
        targetKind: 'form',
        hostTag: 'form'
      },
      submitterShape: {
        controlKind: 'button',
        hostTag: 'button'
      }
    }
  );
  const dispatch = dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
    explicitFormActionSubmitDispatch: true,
    submitControlKind: 'button'
  });
  const execution = executionGate.recordSubmitResetExecution(dispatch, {
    explicitFormActionSubmitResetExecution: true,
    fakeFormPath: {
      pathId: `${prefix}-fake-reset`,
      pathKind: 'action-completion-submit-reset',
      hostTag: 'form',
      resetMode: 'record-only-fake-reset'
    }
  });
  const preflight = preflightGate.recordCallbackActionInvocationPreflight(
    dispatch,
    execution,
    {
      explicitFormActionCallbackActionPreflight: true
    }
  );

  return {
    blocker,
    dispatch,
    execution,
    extraction,
    preflight,
    resetIntent,
    resetQueueCommit,
    submitIntent
  };
}

async function createAsyncExecution(preflight, prefix, callback) {
  return formActions
    .createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: prefix
    })
    .recordAsyncCallbackExecution(preflight, {
      explicitFormActionAsyncCallbackExecution: true,
      asyncActionCallback: callback
    });
}

function throwingProxy(label) {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(`${label} must not be inspected`);
      }
    }
  );
}
