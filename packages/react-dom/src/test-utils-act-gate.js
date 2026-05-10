'use strict';

const {
  compatibilityTarget,
  createUnsupportedFunction
} = require('../placeholder-utils.js');

const entrypoint = 'react-dom/test-utils';

const privateRoutingGateId =
  'react-dom-test-utils-act-private-routing-gate-5';
const privateRoutingGateStatus =
  'blocked-public-test-utils-act-private-routing';
const publicActStatus = 'unsupported-public-test-utils-act-placeholder';
const reactActPrivateDispatcherStatus =
  'blocked-until-renderer-roots-passive-effects-and-act-continuations';
const rootBridgeRecordOnlyStatus =
  'blocked-private-root-bridge-record-only';
const schedulerActQueueRecordOnlyStatus =
  'private-scheduler-act-records-without-flushing';
const syncFlushRecordOnlyStatus =
  'private-sync-flush-act-continuation-records-without-execution';
const syncFlushPostPassiveExecutionGateStatus =
  'private-sync-flush-post-passive-continuation-executes-follow-up-sync-flush';
const schedulerMockFlushHelperStatus =
  'accepted-scheduler-mock-flush-helper-and-continuation-evidence';
const passiveEffectsFlushMetadataStatus =
  'metadata-only-passive-flush-without-callback-execution';
const passiveEffectCallbackHandleStatus =
  'private-passive-effect-callback-invocation-test-control-only';
const privatePassiveDiagnosticGateId =
  'react-dom-test-utils-act-private-passive-diagnostic-gate-1';
const privatePassiveDiagnosticStatus =
  'accepted-private-passive-effect-diagnostic-without-public-act-passive-drain';
const privatePassivePublicPrerequisiteStatus =
  'blocked-accepted-private-passive-diagnostics-until-public-act-passive-drain';
const privateRootHostOutputDiagnosticGateId =
  'root-render-private-host-output-diagnostic-gate-1';
const privateRootHostOutputDiagnosticStatus =
  'accepted-private-root-host-output-diagnostic-without-public-root-execution';
const privateRootHostOutputBlockedDiagnosticStatus =
  'blocked-private-root-host-output-diagnostic';
const privateRootHostOutputPublicPrerequisiteStatus =
  'blocked-accepted-private-root-host-output-until-public-root-execution';
const privateRootWarningBoundaryDiagnosticGateId =
  'root-render-private-warning-boundary-diagnostic-gate-1';
const privateRootWarningBoundaryDiagnosticStatus =
  'accepted-private-root-warning-boundary-diagnostic-without-public-warning-compatibility';
const privateRootWarningBoundaryBlockedDiagnosticStatus =
  'blocked-private-root-warning-boundary-diagnostic';
const privateRootWarningBoundaryPublicPrerequisiteStatus =
  'blocked-accepted-private-root-warning-boundary-until-public-warning-compatibility';

const reactActPrivateRecords = freezeArray([
  'SchedulerActQueueRequest',
  'SchedulerActScopeBoundaryRecord',
  'SyncFlushActContinuationRecord'
]);
const reactActPrivateTaskKinds = freezeArray([
  'RootSchedule',
  'SchedulerCallback'
]);
const reactActPrivateContinuationStatuses = freezeArray([
  'NoContinuation',
  'PendingContinuation'
]);
const schedulerMockFlushHelpers = freezeArray([
  'unstable_flushAll',
  'unstable_flushAllWithoutAsserting',
  'unstable_flushExpired',
  'unstable_flushNumberOfYields',
  'unstable_flushUntilNextPaint'
]);
const schedulerMockFlushEvidenceScenarios = freezeArray([
  'scheduler-mock-export-shape',
  'scheduler-mock-flush-helpers',
  'scheduler-mock-continuations-and-paint'
]);
const rootBridgeRequestRecords = freezeArray([
  'FastReactDomPrivateRootCreateRecord',
  'FastReactDomPrivateRootUpdateRecord',
  'FastReactDomPrivateRootAdmissionRecord',
  'FastReactDomPrivateRootNativeRequestHandoffRecord'
]);
const privateRootHostOutputDiagnosticScenarios = freezeArray([
  'create-root-no-render',
  'initial-host-render',
  'update-host-render',
  'replace-host-tree',
  'render-null-clears-container',
  'root-unmount',
  'double-unmount',
  'render-after-unmount',
  'flush-sync-cross-root-render'
]);
const privateRootHostOutputBlockedScenarios = freezeArray([
  'development-warning-boundaries'
]);
const privateRootHostOutputDiagnosticEvidence = freezeArray([
  'root-render-private-host-output-diagnostic-gate-1',
  'accepted-private-root-host-output-diagnostic',
  'private-fake-dom-root-host-output',
  'explicit-create-root-marker-listener-apply-revert',
  'fake-dom-host-component-host-text-output',
  'latest-props-mutation-handoff-publication',
  'private-host-tree-replacement-output',
  'private-render-null-clear-container-output',
  'private-unmount-host-output-cleanup',
  'private-double-unmount-noop-host-output',
  'private-render-after-unmount-guard-no-extra-mutation',
  'private-flush-sync-cross-root-host-output',
  'private-flush-sync-guard-hook-call',
  'private-cross-root-sync-flush-diagnostic'
]);
const privateRootHostOutputDiagnosticSummary = freezeRecord({
  admittedScenarioIds: privateRootHostOutputDiagnosticScenarios,
  blockedScenarioIds: privateRootHostOutputBlockedScenarios,
  admittedScenarioModeRowCount: 18,
  blockedScenarioModeRowCount: 2,
  acceptedStatus: privateRootHostOutputDiagnosticStatus,
  blockedStatus: privateRootHostOutputBlockedDiagnosticStatus,
  compatibilityClaimed: false,
  source: 'tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs'
});
const privateRootHostOutputBlockedPrerequisites = freezeRecords(
  privateRootHostOutputDiagnosticScenarios.map((scenarioId) => ({
    id: `accepted-private-root-host-output-${scenarioId}`,
    scenarioId,
    present: false,
    requiredBeforePublicAct: true,
    acceptedPrivateDiagnostic: true,
    status: privateRootHostOutputPublicPrerequisiteStatus,
    diagnosticGateId: privateRootHostOutputDiagnosticGateId,
    diagnosticStatus: privateRootHostOutputDiagnosticStatus,
    publicRootExecution: false,
    publicDomMutation: false,
    publicActExecution: false,
    compatibilityClaimed: false,
    reason:
      'Accepted only as a private fake-DOM host-output diagnostic; public react-dom/test-utils.act must stay blocked until public roots execute this scenario.'
  }))
);
const privateRootHostOutputBlockedPrerequisiteIds = freezeArray(
  privateRootHostOutputBlockedPrerequisites.map(
    (prerequisite) => prerequisite.id
  )
);
const privateRootWarningBoundaryDiagnosticScenarios = freezeArray([
  'development-warning-boundaries'
]);
const privateRootWarningBoundaryBlockedScenarios = freezeArray([
  'create-root-no-render',
  'initial-host-render',
  'update-host-render',
  'replace-host-tree',
  'render-null-clears-container',
  'root-unmount',
  'double-unmount',
  'render-after-unmount',
  'flush-sync-cross-root-render'
]);
const privateRootWarningBoundaryDiagnosticEvidence = freezeArray([
  'root-render-private-warning-boundary-diagnostic-gate-1',
  'accepted-private-root-warning-boundary-diagnostic',
  'private-root-warning-boundary',
  'root-render-callback-second-argument',
  'root-render-container-second-argument',
  'root-render-generic-second-argument',
  'root-unmount-callback-argument',
  'duplicate-create-root',
  'console-output-not-used-as-evidence',
  'public-development-warning-compatibility-blocked'
]);
const privateRootWarningBoundaryDiagnosticSummary = freezeRecord({
  admittedScenarioIds: privateRootWarningBoundaryDiagnosticScenarios,
  blockedScenarioIds: privateRootWarningBoundaryBlockedScenarios,
  admittedScenarioModeRowCount: 2,
  blockedScenarioModeRowCount: 18,
  acceptedStatus: privateRootWarningBoundaryDiagnosticStatus,
  blockedStatus: privateRootWarningBoundaryBlockedDiagnosticStatus,
  publicRootCompatibilitySurface: false,
  consoleOutputUsedAsEvidence: false,
  compatibilityClaimed: false,
  source: 'tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs'
});
const privateRootWarningBoundaryBlockedPrerequisites = freezeRecords(
  privateRootWarningBoundaryDiagnosticScenarios.map((scenarioId) => ({
    id: `accepted-private-root-warning-boundary-${scenarioId}`,
    scenarioId,
    present: false,
    requiredBeforePublicAct: true,
    acceptedPrivateDiagnostic: true,
    status: privateRootWarningBoundaryPublicPrerequisiteStatus,
    diagnosticGateId: privateRootWarningBoundaryDiagnosticGateId,
    diagnosticStatus: privateRootWarningBoundaryDiagnosticStatus,
    publicRootExecution: false,
    publicWarningCompatibility: false,
    consoleOutputUsedAsEvidence: false,
    publicActExecution: false,
    compatibilityClaimed: false,
    reason:
      'Accepted only as private warning-boundary metadata; public react-dom/test-utils.act must stay blocked until public roots produce compatible warning behavior.'
  }))
);
const privateRootWarningBoundaryBlockedPrerequisiteIds = freezeArray(
  privateRootWarningBoundaryBlockedPrerequisites.map(
    (prerequisite) => prerequisite.id
  )
);
const syncFlushContinuationRecords = freezeArray([
  'SchedulerActContinuationRecord',
  'SyncFlushActPostPassiveContinuationGateRecord',
  'SyncFlushRootRecord.act_continuation',
  'SyncFlushRootRecord.act_post_passive_continuation_gate'
]);
const syncFlushPostPassiveContinuationExecutionRecords = freezeArray([
  'SyncFlushPostPassiveContinuationExecutionGateRecord',
  'SyncFlushPostPassiveContinuationExecutionRecord',
  'SyncFlushPostPassiveContinuationRootRecord',
  'sync_flush_post_passive_continuation_execution_gate',
  'SyncFlushPostPassiveContinuationExecutionGateRecord.should_execute_follow_up_sync_flush',
  'flush_sync_post_passive_continuation_after_passive_effects',
  'flush_passive_effects_after_commit_and_sync_flush_continuation',
  'PassiveEffectsFlushWithSyncFlushContinuationResult',
  'SyncFlushPostPassiveContinuationExecutionRecord.did_execute_follow_up_sync_flush',
  'SyncFlushPostPassiveContinuationExecutionRecord.did_flush_follow_up_sync_work',
  'SyncFlushRootRecord::post_passive_continuation_execution_gate'
]);
const passiveEffectsFlushRecords = freezeArray([
  'PendingPassiveCommitHandoff',
  'PassiveEffectsFlushResult',
  'PassiveEffectFlushRecord',
  'PassiveEffectsFlushWithSyncFlushContinuationResult',
  'FunctionComponentPendingPassiveCommitHandoff',
  'FunctionComponentPendingPassiveEffectPhaseCommitRecord'
]);
const passiveEffectCallbackHandleRecords = freezeArray([
  'FunctionComponentPendingPassiveEffectCommitRecord.create',
  'FunctionComponentPendingPassiveEffectCommitRecord.destroy',
  'FunctionComponentPendingPassiveEffectPhaseCommitRecord.create',
  'FunctionComponentPendingPassiveEffectPhaseCommitRecord.destroy',
  'PassiveEffectFlushEffectRecord.create_callback',
  'PassiveEffectFlushEffectRecord.destroy_callback',
  'PassiveEffectFlushRecord.create_callback',
  'PassiveEffectFlushRecord.destroy_callback',
  'PassiveEffectFlushRecord.create_callback_invoked',
  'PassiveEffectFlushRecord.destroy_callback_invoked'
]);
const passiveEffectCallbackInvocationRecords = freezeArray([
  'PassiveEffectCallbackInvocationGateSnapshot',
  'PassiveEffectCallbackInvocationRecord',
  'PassiveEffectCallbackInvocationRequest',
  'PassiveEffectCallbackInvocationKind',
  'PassiveEffectCallbackInvocationStatus',
  'PassiveEffectCallbackInvocationTestControl',
  'PassiveEffectCallbackInvocationGateBlocker',
  'invoke_passive_effect_callbacks_under_test_control',
  'PassiveEffectDestroyCallbackExecutionRecord',
  'PassiveEffectDestroyCallbackErrorRecord',
  'flush_passive_effects_after_commit_with_destroy_executor'
]);
const passiveEffectCallbackPhaseRules = freezeArray([
  'unmount-phase-carries-destroy-handle-without-create-handle',
  'mount-phase-carries-create-handle-without-destroy-handle',
  'default-flush-callback-invoked-accessors-return-false',
  'test-controlled-invocation-runs-destroy-before-create',
  'scheduler-driven-passive-execution-remains-disabled'
]);
const passiveEffectCallbackInvocationBlockers = freezeArray([
  'PublicEffectExecution',
  'PublicActCompatibility',
  'SchedulerDrivenPassiveExecution'
]);
const privatePassiveDiagnosticIds = freezeArray([
  'passive-effects-committed-fiber-traversal',
  'passive-effects-scheduler-flush-diagnostic',
  'passive-effect-mount-unmount-execution-diagnostics',
  'passive-effect-root-error-routing-diagnostics'
]);
const passiveEffectsCommittedFiberTraversalRecords = freezeArray([
  'FunctionComponentCommittedPassiveEffectsSnapshot',
  'FunctionComponentCommittedPassiveEffectFiberRecord',
  'HostRootCommitRecord.function_component_committed_passive_effects',
  'HostRootCommitRecord::record_function_component_committed_passive_effects_for_canary',
  'flush_passive_effects_after_commit_from_committed_fiber_effects_for_canary',
  'CommittedPassiveEffectRecordCountMismatch',
  'CommittedPassiveEffectDuplicateOrder',
  'CommittedPassiveEffectRecordMismatch'
]);
const passiveEffectsSchedulerFlushDiagnosticRecords = freezeArray([
  'SchedulerPassiveEffectsFlushRequest',
  'PassiveEffectSchedulerFlushGateRecord',
  'PassiveEffectSchedulerFlushGateStatus::Scheduled',
  'schedule_passive_effects_flush_after_commit_for_canary',
  'flush_passive_effects_after_scheduler_flush_gate_from_committed_fiber_effects_for_canary',
  'PassiveEffectSchedulerFlushExecutionRecord',
  'PassiveEffectSchedulerFlushExecutionRecord.did_execute_private_callback_executors',
  'SchedulerPriority::Normal'
]);
const passiveEffectMountUnmountExecutionRecords = freezeArray([
  'PassiveEffectDestroyCallbackExecutionRequest',
  'PassiveEffectDestroyCallbackExecutionRecord',
  'PassiveEffectDestroyCallbackErrorRecord',
  'PassiveEffectMountCreateCallbackExecutionRequest',
  'PassiveEffectMountCreateCallbackExecutionRecord',
  'PassiveEffectMountCreateCallbackErrorRecord',
  'PassiveEffectMountCreateCallbackExecutionGateStatus::TestControlOnly',
  'PassiveEffectMountCreateCallbackExecutionGateBlocker',
  'flush_passive_effects_after_commit_with_destroy_executor',
  'flush_passive_effects_after_commit_with_mount_create_executor',
  'flush_passive_effects_after_commit_with_callback_executors'
]);
const passiveEffectRootErrorRoutingRecords = freezeArray([
  'PassiveEffectCallbackExecutionErrorKind',
  'PassiveEffectCallbackExecutionErrorHandle',
  'PassiveEffectCallbackExecutionErrorRecord',
  'PassiveEffectRootErrorCaptureRecord',
  'PassiveEffectRootErrorPropagationRecord',
  'PassiveEffectRootErrorPropagationStatus::CapturedForRootUpdate',
  'PassiveEffectRootErrorPropagationBlocker',
  'RootErrorCaptureScheduleRecord',
  'RootErrorCaptureSource::PassiveEffectDestroy',
  'RootErrorCaptureSource::PassiveEffectMountCreate',
  'capture_passive_effect_root_error'
]);
const privatePassiveDiagnosticEvidence = freezeArray([
  'default-flush-remains-metadata-only',
  'committed-fiber-passive-effect-snapshot',
  'scheduler-passive-flush-request-order',
  'scheduler-flush-executes-metadata-only-passive-drain',
  'test-controlled-passive-destroy-callback-execution',
  'test-controlled-passive-mount-create-callback-execution',
  'passive-callback-error-root-capture-metadata',
  'root-error-callbacks-not-invoked',
  'public-act-passive-drain-blocked'
]);
const privatePassiveDiagnosticSummary = freezeRecord({
  acceptedDiagnosticIds: privatePassiveDiagnosticIds,
  acceptedDiagnosticCount: privatePassiveDiagnosticIds.length,
  acceptedStatus: privatePassiveDiagnosticStatus,
  publicActPassiveDrain: false,
  publicEffectExecution: false,
  schedulerDrivenPassiveExecution: false,
  publicRootErrorCallbacksInvoked: false,
  publicActErrorAggregation: false,
  compatibilityClaimed: false,
  source: 'crates/fast-react-reconciler/src/passive_effects.rs'
});
const privatePassiveDiagnosticRows = freezeRecords([
  {
    id: 'passive-effects-committed-fiber-traversal',
    present: true,
    status: privatePassiveDiagnosticStatus,
    source: 'crates/fast-react-reconciler/src/root_commit.rs',
    recordOnly: false,
    privateDiagnostic: true,
    diagnosticGateId: privatePassiveDiagnosticGateId,
    consumesCommittedFiberEffects: true,
    consumesCallerSuppliedHandoff: false,
    executesPassiveEffects: false,
    invokesCallbacks: false,
    publicActCompatibilityClaimed: false,
    records: passiveEffectsCommittedFiberTraversalRecords
  },
  {
    id: 'passive-effects-scheduler-flush-diagnostic',
    present: true,
    status: privatePassiveDiagnosticStatus,
    source: 'crates/fast-react-reconciler/src/root_scheduler.rs',
    recordOnly: false,
    privateDiagnostic: true,
    diagnosticGateId: privatePassiveDiagnosticGateId,
    schedulesPassiveFlushRequest: true,
    schedulerPriority: 'Normal',
    consumesPendingPassive: true,
    schedulerDrivenPrivateDiagnostic: true,
    executesPublicSchedulerTasks: false,
    executesPublicEffects: false,
    invokesCallbacks: false,
    publicActCompatibilityClaimed: false,
    records: passiveEffectsSchedulerFlushDiagnosticRecords
  },
  {
    id: 'passive-effect-mount-unmount-execution-diagnostics',
    present: true,
    status: privatePassiveDiagnosticStatus,
    source: 'crates/fast-react-reconciler/src/passive_effects.rs',
    recordOnly: false,
    privateDiagnostic: true,
    diagnosticGateId: privatePassiveDiagnosticGateId,
    testControlledInvocationOnly: true,
    executesDestroyCallbacksUnderTestControl: true,
    executesMountCreateCallbacksUnderTestControl: true,
    schedulerDrivenPassiveExecutionEnabled: false,
    publicEffectExecutionEnabled: false,
    publicActCompatibilityClaimed: false,
    records: passiveEffectMountUnmountExecutionRecords
  },
  {
    id: 'passive-effect-root-error-routing-diagnostics',
    present: true,
    status: privatePassiveDiagnosticStatus,
    source: 'crates/fast-react-reconciler/src/passive_effects.rs',
    recordOnly: false,
    privateDiagnostic: true,
    diagnosticGateId: privatePassiveDiagnosticGateId,
    capturesCommitPhaseErrors: true,
    schedulesRootErrorUpdates: true,
    invokesRootErrorCallbacks: false,
    publicActErrorAggregationEnabled: false,
    publicActCompatibilityClaimed: false,
    records: passiveEffectRootErrorRoutingRecords
  }
]);
const privatePassiveBlockedPrerequisites = freezeRecords(
  privatePassiveDiagnosticRows.map((diagnostic) => ({
    id: `accepted-private-passive-diagnostic-${diagnostic.id}`,
    diagnosticId: diagnostic.id,
    present: false,
    requiredBeforePublicAct: true,
    acceptedPrivateDiagnostic: true,
    status: privatePassivePublicPrerequisiteStatus,
    diagnosticGateId: privatePassiveDiagnosticGateId,
    diagnosticStatus: diagnostic.status,
    publicActExecution: false,
    publicEffectExecution: false,
    schedulerDrivenPassiveExecution: false,
    publicRootErrorCallbacksInvoked: false,
    publicActErrorAggregation: false,
    compatibilityClaimed: false,
    reason:
      'Accepted only as private passive-effect diagnostics; public react-dom/test-utils.act must stay blocked until public act drains passive effects through public roots.'
  }))
);
const privatePassiveBlockedPrerequisiteIds = freezeArray(
  privatePassiveBlockedPrerequisites.map((prerequisite) => prerequisite.id)
);

const acceptedPrivatePrerequisites = freezeRecords([
  {
    id: 'react-act-private-dispatcher-gate',
    present: true,
    status: reactActPrivateDispatcherStatus,
    source: 'packages/react/private-act-dispatcher-gate.js',
    recordOnly: true,
    executesQueuedWork: false,
    executesEffects: false,
    metadata: {
      requiredRecords: reactActPrivateRecords,
      requiredTaskKinds: reactActPrivateTaskKinds,
      requiredContinuationStatuses: reactActPrivateContinuationStatuses
    }
  },
  {
    id: 'scheduler-act-queue-routing-records',
    present: true,
    status: schedulerActQueueRecordOnlyStatus,
    source: 'crates/fast-react-reconciler/src/scheduler_bridge.rs',
    recordOnly: true,
    executesQueuedWork: false,
    records: freezeArray([
      'SchedulerActQueueRequest',
      'SchedulerActQueueTaskKind',
      'SchedulerActScopeBoundaryRecord',
      'FAKE_ACT_CALLBACK_NODE'
    ])
  },
  {
    id: 'scheduler-mock-flush-helper-metadata',
    present: true,
    status: schedulerMockFlushHelperStatus,
    source: 'packages/scheduler/unstable_mock.js',
    recordOnly: true,
    deterministicMockFlushEvidence: true,
    mockContinuationEvidence: true,
    executesActQueueTasks: false,
    executesRendererWork: false,
    executesScheduledCallbacks: false,
    helpers: schedulerMockFlushHelpers,
    evidenceScenarios: schedulerMockFlushEvidenceScenarios
  },
  {
    id: 'sync-flush-act-continuation-records',
    present: true,
    status: syncFlushRecordOnlyStatus,
    source: 'crates/fast-react-reconciler/src/sync_flush.rs',
    recordOnly: true,
    executesSyncFlush: false,
    records: syncFlushContinuationRecords
  },
  {
    id: 'sync-flush-post-passive-continuation-execution-gate',
    present: true,
    status: syncFlushPostPassiveExecutionGateStatus,
    source: 'crates/fast-react-reconciler/src/root_scheduler.rs',
    recordOnly: false,
    privateExecution: true,
    observesPendingPassiveHandoff: true,
    collectsContinuationRoots: true,
    consumesPendingPassive: true,
    rendersContinuationRoots: true,
    commitsContinuationRoots: true,
    executesSyncFlush: true,
    executesPassiveEffects: false,
    invokesCallbacks: false,
    records: syncFlushPostPassiveContinuationExecutionRecords
  },
  {
    id: 'passive-effects-flush-metadata',
    present: true,
    status: passiveEffectsFlushMetadataStatus,
    source: 'crates/fast-react-reconciler/src/passive_effects.rs',
    recordOnly: true,
    consumesPendingPassiveMetadata: true,
    hasSyncFlushContinuationWrapper: true,
    discoversCommittedFiberEffects: false,
    executesPassiveEffects: false,
    invokesCreateCallbacks: false,
    invokesDestroyCallbacks: false,
    records: passiveEffectsFlushRecords
  },
  {
    id: 'passive-effect-callback-handle-metadata',
    present: true,
    status: passiveEffectCallbackHandleStatus,
    source: 'crates/fast-react-reconciler/src/passive_effects.rs',
    recordOnly: false,
    testControlledInvocationOnly: true,
    carriesCreateCallbackHandles: true,
    carriesDestroyCallbackHandles: true,
    invokesCreateCallbacksUnderTestControl: true,
    invokesDestroyCallbacksUnderTestControl: true,
    recordsReturnedDestroyHandles: true,
    recordsCallbackErrors: true,
    invokesCreateCallbacks: false,
    invokesDestroyCallbacks: false,
    publicEffectExecutionEnabled: false,
    schedulerDrivenPassiveExecutionEnabled: false,
    publicActCompatibilityClaimed: false,
    effectCallbackExecutionReady: false,
    records: passiveEffectCallbackHandleRecords,
    invocationRecords: passiveEffectCallbackInvocationRecords,
    invocationBlockers: passiveEffectCallbackInvocationBlockers,
    phaseRules: passiveEffectCallbackPhaseRules
  },
  ...privatePassiveDiagnosticRows,
  {
    id: 'react-dom-private-root-bridge-records',
    present: true,
    status: rootBridgeRecordOnlyStatus,
    source: 'packages/react-dom/src/client/root-bridge.js',
    recordOnly: true,
    executesRendererRoots: false,
    privateHostOutputDiagnosticGateId:
      privateRootHostOutputDiagnosticGateId,
    privateHostOutputDiagnostics: true,
    privateHostOutputDiagnosticStatus: privateRootHostOutputDiagnosticStatus,
    privateHostOutputDiagnosticScenarios:
      privateRootHostOutputDiagnosticScenarios,
    privateHostOutputBlockedDiagnosticStatus:
      privateRootHostOutputBlockedDiagnosticStatus,
    privateHostOutputBlockedScenarios: privateRootHostOutputBlockedScenarios,
    privateHostOutputDiagnosticSummary:
      privateRootHostOutputDiagnosticSummary,
    privateHostOutputBlockedPrerequisiteIds:
      privateRootHostOutputBlockedPrerequisiteIds,
    privateWarningBoundaryDiagnosticGateId:
      privateRootWarningBoundaryDiagnosticGateId,
    privateWarningBoundaryDiagnostics: true,
    privateWarningBoundaryDiagnosticStatus:
      privateRootWarningBoundaryDiagnosticStatus,
    privateWarningBoundaryDiagnosticScenarios:
      privateRootWarningBoundaryDiagnosticScenarios,
    privateWarningBoundaryBlockedDiagnosticStatus:
      privateRootWarningBoundaryBlockedDiagnosticStatus,
    privateWarningBoundaryBlockedScenarios:
      privateRootWarningBoundaryBlockedScenarios,
    privateWarningBoundaryDiagnosticSummary:
      privateRootWarningBoundaryDiagnosticSummary,
    privateWarningBoundaryBlockedPrerequisiteIds:
      privateRootWarningBoundaryBlockedPrerequisiteIds,
    fakeDomHostOutputOnly: true,
    publicRootExecution: false,
    publicDomMutation: false,
    publicWarningCompatibility: false,
    consoleOutputUsedAsEvidence: false,
    records: rootBridgeRequestRecords
  },
  {
    id: 'react-dom-private-flush-sync-root-output-diagnostic',
    present: true,
    status: privateRootHostOutputDiagnosticStatus,
    source: 'tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs',
    recordOnly: false,
    privateDiagnostic: true,
    scenarioId: 'flush-sync-cross-root-render',
    diagnosticGateId: privateRootHostOutputDiagnosticGateId,
    crossRootHostOutputDiagnostic: true,
    requiresPrivateFlushSyncGuard: true,
    requiresCrossRootSyncFlushEvidence: true,
    publicRootExecution: false,
    publicDomMutation: false,
    publicFlushSyncCompatibilityClaimed: false,
    publicActCompatibilityClaimed: false,
    records: freezeArray([
      'private-flush-sync-cross-root-host-output',
      'private-flush-sync-guard-hook-call',
      'private-cross-root-sync-flush-diagnostic'
    ])
  },
  {
    id: 'react-dom-private-root-warning-boundary-diagnostics',
    present: true,
    status: privateRootWarningBoundaryDiagnosticStatus,
    source: 'tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs',
    recordOnly: false,
    privateDiagnostic: true,
    scenarioId: 'development-warning-boundaries',
    diagnosticGateId: privateRootWarningBoundaryDiagnosticGateId,
    publicRootCompatibilitySurface: false,
    publicWarningCompatibility: false,
    consoleOutputUsedAsEvidence: false,
    publicActCompatibilityClaimed: false,
    records: privateRootWarningBoundaryDiagnosticEvidence
  },
  {
    id: 'react-dom-private-flush-sync-guard',
    present: true,
    status: 'accepted-private-flush-sync-reentry-guard',
    source: 'packages/react-dom/src/shared/flush-sync-guard.js',
    recordOnly: true,
    executesPublicFlushSync: false,
    records: freezeArray(['finishFlushSyncGuard', 'getDispatcherFlushSyncWork'])
  }
]);

const blockedPublicPrerequisites = freezeRecords([
  {
    id: 'public-react-act-delegation',
    present: false,
    requiredBeforePublicAct: true,
    reason:
      'Public React.act remains a FAST_REACT_UNIMPLEMENTED placeholder in the default React entrypoint.'
  },
  {
    id: 'act-queue-flushing-execution',
    present: false,
    requiredBeforePublicAct: true,
    reason:
      'Accepted act queue records still do not drain queued work or act scheduler continuations, even though private scheduler and sync-flush evidence exists.'
  },
  {
    id: 'passive-effect-callback-execution',
    present: false,
    requiredBeforePublicAct: true,
    blockedByAcceptedPrivatePassiveDiagnostics: true,
    privatePassiveDiagnosticGateId,
    privatePassiveDiagnosticStatus,
    acceptedPrivatePassiveDiagnosticIds: privatePassiveDiagnosticIds,
    acceptedPrivatePassiveDiagnosticCount: privatePassiveDiagnosticIds.length,
    publicEffectExecutionEnabled: false,
    schedulerDrivenPassiveExecutionEnabled: false,
    publicRootErrorCallbacksInvoked: false,
    publicActErrorAggregationEnabled: false,
    reason:
      'Passive create and destroy callbacks can run only through explicit private test controls; scheduler-driven passive execution and public act integration remain disabled.'
  },
  {
    id: 'public-react-dom-root-execution',
    present: false,
    requiredBeforePublicAct: true,
    blockedByAcceptedPrivateRootHostOutputDiagnostics: true,
    blockedByAcceptedPrivateRootWarningBoundaryDiagnostics: true,
    privateHostOutputDiagnosticGateId:
      privateRootHostOutputDiagnosticGateId,
    privateHostOutputDiagnosticStatus: privateRootHostOutputDiagnosticStatus,
    acceptedPrivateHostOutputDiagnosticScenarios:
      privateRootHostOutputDiagnosticScenarios,
    unsupportedPrivateHostOutputDiagnosticScenarios:
      privateRootHostOutputBlockedScenarios,
    acceptedPrivateHostOutputScenarioModeRowCount: 18,
    unsupportedPrivateHostOutputScenarioModeRowCount: 2,
    privateWarningBoundaryDiagnosticGateId:
      privateRootWarningBoundaryDiagnosticGateId,
    privateWarningBoundaryDiagnosticStatus:
      privateRootWarningBoundaryDiagnosticStatus,
    acceptedPrivateWarningBoundaryDiagnosticScenarios:
      privateRootWarningBoundaryDiagnosticScenarios,
    unsupportedPrivateWarningBoundaryDiagnosticScenarios:
      privateRootWarningBoundaryBlockedScenarios,
    acceptedPrivateWarningBoundaryScenarioModeRowCount: 2,
    unsupportedPrivateWarningBoundaryScenarioModeRowCount: 18,
    reason:
      'Private fake-DOM host-output and warning-boundary diagnostics exist, but public React DOM roots still throw placeholders instead of routing create, render, update, unmount, or warning behavior.'
  },
  {
    id: 'public-react-dom-flush-sync-execution',
    present: false,
    requiredBeforePublicAct: true,
    reason:
      'Public React DOM flushSync remains an unsupported placeholder even though private sync-flush metadata exists.'
  },
  {
    id: 'public-react-dom-warning-boundary-compatibility',
    present: false,
    requiredBeforePublicAct: true,
    reason:
      'Private warning-boundary diagnostics use root metadata only; public development warning output compatibility remains blocked while public roots are placeholders.'
  }
]);

const sideEffectPolicy = Object.freeze({
  invokesActCallback: false,
  executesQueuedWork: false,
  executesPassiveEffects: false,
  executesRendererRoots: false,
  executesPublicRendererRoots: false,
  executesPublicDomMutation: false,
  executesSyncFlush: false,
  emitsDeprecationWarning: false,
  delegatesToReactAct: false
});

function createReactDomTestUtilsActPlaceholder() {
  return createUnsupportedFunction(entrypoint, 'act', 1);
}

function createReactDomTestUtilsActBlockedError() {
  const act = createReactDomTestUtilsActPlaceholder();
  return captureThrown(() => act());
}

function getReactDomTestUtilsActPrivateRoutingGate(overrides = {}) {
  return freezeRecord({
    id: privateRoutingGateId,
    status: privateRoutingGateStatus,
    entrypoint,
    compatibilityTarget,
    publicActStatus,
    publicCompatibilityClaimed: false,
    publicReactActReady: false,
    publicTestUtilsActReady: false,
    privateRoutingReady: false,
    privatePrerequisitesPresent: true,
    acceptedPrivatePrerequisites,
    blockedPublicPrerequisites,
    blockedPrivateRootHostOutputPrerequisites:
      privateRootHostOutputBlockedPrerequisites,
    blockedPrivateRootWarningBoundaryPrerequisites:
      privateRootWarningBoundaryBlockedPrerequisites,
    blockedPrivatePassivePrerequisites: privatePassiveBlockedPrerequisites,
    acceptedPrivatePrerequisiteIds: acceptedPrivatePrerequisites.map(
      (prerequisite) => prerequisite.id
    ),
    blockedPublicPrerequisiteIds: blockedPublicPrerequisites.map(
      (prerequisite) => prerequisite.id
    ),
    blockedPrivateRootHostOutputPrerequisiteIds:
      privateRootHostOutputBlockedPrerequisiteIds,
    blockedPrivateRootWarningBoundaryPrerequisiteIds:
      privateRootWarningBoundaryBlockedPrerequisiteIds,
    blockedPrivatePassivePrerequisiteIds:
      privatePassiveBlockedPrerequisiteIds,
    reactActPrivateDispatcher: freezeRecord({
      status: reactActPrivateDispatcherStatus,
      requiredRecords: reactActPrivateRecords,
      requiredTaskKinds: reactActPrivateTaskKinds,
      requiredContinuationStatuses: reactActPrivateContinuationStatuses,
      publicCompatibilityClaimed: false,
      queueFlushingReady: false,
      rendererRootsReady: false,
      passiveEffectsReady: false,
      continuationFlushingReady: false,
      executesQueuedWork: false,
      executesEffects: false
    }),
    schedulerActQueue: freezeRecord({
      status: schedulerActQueueRecordOnlyStatus,
      recordOnly: true,
      executesQueuedWork: false,
      requiredTaskKinds: reactActPrivateTaskKinds
    }),
    schedulerMockFlushHelpers: freezeRecord({
      status: schedulerMockFlushHelperStatus,
      helpers: schedulerMockFlushHelpers,
      evidenceScenarios: schedulerMockFlushEvidenceScenarios,
      deterministicMockFlushEvidence: true,
      mockContinuationEvidence: true,
      executesActQueueTasks: false,
      executesRendererWork: false,
      executesScheduledCallbacks: false
    }),
    syncFlushActContinuation: freezeRecord({
      status: syncFlushRecordOnlyStatus,
      records: syncFlushContinuationRecords,
      executesSyncFlush: false,
      executesPassiveEffects: false
    }),
    syncFlushPostPassiveContinuationExecution: freezeRecord({
      status: syncFlushPostPassiveExecutionGateStatus,
      records: syncFlushPostPassiveContinuationExecutionRecords,
      observesPendingPassiveHandoff: true,
      collectsContinuationRoots: true,
      consumesPendingPassive: true,
      privateExecution: true,
      rendersContinuationRoots: true,
      commitsContinuationRoots: true,
      executesSyncFlush: true,
      executesPassiveEffects: false,
      invokesCallbacks: false
    }),
    passiveEffects: freezeRecord({
      status: passiveEffectsFlushMetadataStatus,
      records: passiveEffectsFlushRecords,
      consumesPendingPassiveMetadata: true,
      hasSyncFlushContinuationWrapper: true,
      discoversCommittedFiberEffects: false,
      executesPassiveEffects: false,
      invokesCreateCallbacks: false,
      invokesDestroyCallbacks: false
    }),
    passiveEffectCallbackHandles: freezeRecord({
      status: passiveEffectCallbackHandleStatus,
      records: passiveEffectCallbackHandleRecords,
      invocationRecords: passiveEffectCallbackInvocationRecords,
      invocationBlockers: passiveEffectCallbackInvocationBlockers,
      phaseRules: passiveEffectCallbackPhaseRules,
      carriesCreateCallbackHandles: true,
      carriesDestroyCallbackHandles: true,
      testControlledInvocationOnly: true,
      invokesCreateCallbacksUnderTestControl: true,
      invokesDestroyCallbacksUnderTestControl: true,
      recordsReturnedDestroyHandles: true,
      recordsCallbackErrors: true,
      invokesCreateCallbacks: false,
      invokesDestroyCallbacks: false,
      publicEffectExecutionEnabled: false,
      schedulerDrivenPassiveExecutionEnabled: false,
      publicActCompatibilityClaimed: false,
      effectCallbackExecutionReady: false
    }),
    privatePassiveDiagnostics: freezeRecord({
      gateId: privatePassiveDiagnosticGateId,
      status: privatePassiveDiagnosticStatus,
      acceptedDiagnosticIds: privatePassiveDiagnosticIds,
      acceptedDiagnostics: privatePassiveDiagnosticRows,
      evidence: privatePassiveDiagnosticEvidence,
      summary: privatePassiveDiagnosticSummary,
      blockedPrerequisiteStatus: privatePassivePublicPrerequisiteStatus,
      blockedPrerequisites: privatePassiveBlockedPrerequisites,
      blockedPrerequisiteIds: privatePassiveBlockedPrerequisiteIds,
      publicActPassiveDrain: false,
      publicEffectExecution: false,
      schedulerDrivenPassiveExecution: false,
      publicRootExecution: false,
      publicRootErrorCallbacksInvoked: false,
      publicActErrorAggregation: false,
      compatibilityClaimed: false
    }),
    reactDomRootBridge: freezeRecord({
      status: rootBridgeRecordOnlyStatus,
      records: rootBridgeRequestRecords,
      privateHostOutputDiagnostics: freezeRecord({
        gateId: privateRootHostOutputDiagnosticGateId,
        status: privateRootHostOutputDiagnosticStatus,
        scenarios: privateRootHostOutputDiagnosticScenarios,
        blockedStatus: privateRootHostOutputBlockedDiagnosticStatus,
        blockedScenarios: privateRootHostOutputBlockedScenarios,
        evidence: privateRootHostOutputDiagnosticEvidence,
        summary: privateRootHostOutputDiagnosticSummary,
        blockedPrerequisiteStatus: privateRootHostOutputPublicPrerequisiteStatus,
        blockedPrerequisites: privateRootHostOutputBlockedPrerequisites,
        blockedPrerequisiteIds: privateRootHostOutputBlockedPrerequisiteIds,
        fakeDomHostOutputOnly: true,
        publicRootExecution: false,
        publicDomMutation: false,
        publicActExecution: false,
        compatibilityClaimed: false
      }),
      privateWarningBoundaryDiagnostics: freezeRecord({
        gateId: privateRootWarningBoundaryDiagnosticGateId,
        status: privateRootWarningBoundaryDiagnosticStatus,
        scenarios: privateRootWarningBoundaryDiagnosticScenarios,
        blockedStatus: privateRootWarningBoundaryBlockedDiagnosticStatus,
        blockedScenarios: privateRootWarningBoundaryBlockedScenarios,
        evidence: privateRootWarningBoundaryDiagnosticEvidence,
        summary: privateRootWarningBoundaryDiagnosticSummary,
        blockedPrerequisiteStatus:
          privateRootWarningBoundaryPublicPrerequisiteStatus,
        blockedPrerequisites:
          privateRootWarningBoundaryBlockedPrerequisites,
        blockedPrerequisiteIds:
          privateRootWarningBoundaryBlockedPrerequisiteIds,
        publicRootCompatibilitySurface: false,
        publicRootExecution: false,
        publicWarningCompatibility: false,
        publicActExecution: false,
        consoleOutputUsedAsEvidence: false,
        compatibilityClaimed: false
      }),
      nativeExecution: false,
      reconcilerExecution: false,
      domMutation: false,
      markerWrites: false,
      listenerInstallation: false,
      publicWarningCompatibility: false,
      consoleOutputUsedAsEvidence: false,
      compatibilityClaimed: false
    }),
    sideEffectPolicy,
    deprecationWarningBehavior:
      'preserved-no-warning-while-public-test-utils-act-is-placeholder',
    ...overrides
  });
}

function evaluateReactDomTestUtilsActPrivateRoutingGate(options = {}) {
  const gate = getReactDomTestUtilsActPrivateRoutingGate(options.gateOverrides);
  const acceptedPrivatePrerequisites =
    options.acceptedPrivatePrerequisites ?? gate.acceptedPrivatePrerequisites;
  const blockedPublicPrerequisites =
    options.blockedPublicPrerequisites ?? gate.blockedPublicPrerequisites;
  const blockedPrivateRootHostOutputPrerequisites =
    options.blockedPrivateRootHostOutputPrerequisites ??
    gate.blockedPrivateRootHostOutputPrerequisites;
  const blockedPrivateRootWarningBoundaryPrerequisites =
    options.blockedPrivateRootWarningBoundaryPrerequisites ??
    gate.blockedPrivateRootWarningBoundaryPrerequisites;
  const blockedPrivatePassivePrerequisites =
    options.blockedPrivatePassivePrerequisites ??
    gate.blockedPrivatePassivePrerequisites;
  const publicCompatibilityClaimed =
    options.publicCompatibilityClaimed ?? gate.publicCompatibilityClaimed;
  const publicTestUtilsActReady =
    options.publicTestUtilsActReady ?? gate.publicTestUtilsActReady;
  const publicReactActReady =
    options.publicReactActReady ?? gate.publicReactActReady;
  const privateRoutingReady =
    options.privateRoutingReady ?? gate.privateRoutingReady;
  const missingPrivatePrerequisites = acceptedPrivatePrerequisites
    .filter((prerequisite) => prerequisite.present !== true)
    .map((prerequisite) => prerequisite.id);
  const publicPrerequisitesStillBlocked = blockedPublicPrerequisites
    .filter((prerequisite) => prerequisite.present !== true)
    .map((prerequisite) => prerequisite.id);
  const privateRootHostOutputPrerequisitesStillBlocked =
    blockedPrivateRootHostOutputPrerequisites
      .filter((prerequisite) => prerequisite.present !== true)
      .map((prerequisite) => prerequisite.id);
  const privateRootWarningBoundaryPrerequisitesStillBlocked =
    blockedPrivateRootWarningBoundaryPrerequisites
      .filter((prerequisite) => prerequisite.present !== true)
      .map((prerequisite) => prerequisite.id);
  const privatePassivePrerequisitesStillBlocked =
    blockedPrivatePassivePrerequisites
      .filter((prerequisite) => prerequisite.present !== true)
      .map((prerequisite) => prerequisite.id);
  const violations = [];

  if (publicCompatibilityClaimed) {
    violations.push(
      createViolation('compatibility-claimed-before-public-act-routing')
    );
  }
  if (publicTestUtilsActReady || publicReactActReady || privateRoutingReady) {
    violations.push(
      createViolation('public-act-routing-opened-before-prerequisites')
    );
  }
  if (missingPrivatePrerequisites.length > 0) {
    violations.push(
      createViolation('accepted-private-prerequisite-missing', {
        prerequisiteIds: missingPrivatePrerequisites
      })
    );
  }
  if (publicPrerequisitesStillBlocked.length === 0) {
    violations.push(
      createViolation('public-prerequisites-unblocked-without-new-gate')
    );
  }
  if (privateRootHostOutputPrerequisitesStillBlocked.length === 0) {
    violations.push(
      createViolation(
        'private-root-host-output-prerequisites-unblocked-without-new-gate'
      )
    );
  }
  if (privateRootWarningBoundaryPrerequisitesStillBlocked.length === 0) {
    violations.push(
      createViolation(
        'private-root-warning-boundary-prerequisites-unblocked-without-new-gate'
      )
    );
  }
  if (privatePassivePrerequisitesStillBlocked.length === 0) {
    violations.push(
      createViolation(
        'private-passive-diagnostic-prerequisites-unblocked-without-new-gate'
      )
    );
  }

  return freezeRecord({
    ...gate,
    publicCompatibilityClaimed,
    publicReactActReady,
    publicTestUtilsActReady,
    privateRoutingReady,
    privatePrerequisitesPresent: missingPrivatePrerequisites.length === 0,
    publicPrerequisitesStillBlocked,
    privateRootHostOutputPrerequisitesStillBlocked,
    privateRootWarningBoundaryPrerequisitesStillBlocked,
    privatePassivePrerequisitesStillBlocked,
    violations,
    status:
      violations.length === 0
        ? gate.status
        : 'blocked-public-test-utils-act-private-routing-with-violations'
  });
}

function createViolation(id, extra = {}) {
  return freezeRecord({
    id,
    ...extra
  });
}

function captureThrown(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  return null;
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function freezeArray(array) {
  return Object.freeze(array.slice());
}

function freezeRecords(records) {
  return freezeArray(records.map((record) => freezeRecord(record)));
}

module.exports = {
  acceptedPrivatePrerequisites,
  blockedPrivatePassivePrerequisites: privatePassiveBlockedPrerequisites,
  blockedPrivateRootHostOutputPrerequisites:
    privateRootHostOutputBlockedPrerequisites,
  blockedPrivateRootWarningBoundaryPrerequisites:
    privateRootWarningBoundaryBlockedPrerequisites,
  blockedPublicPrerequisites,
  createReactDomTestUtilsActBlockedError,
  createReactDomTestUtilsActPlaceholder,
  entrypoint,
  evaluateReactDomTestUtilsActPrivateRoutingGate,
  getReactDomTestUtilsActPrivateRoutingGate,
  privateRoutingGateId,
  privateRoutingGateStatus,
  publicActStatus,
  sideEffectPolicy
};
