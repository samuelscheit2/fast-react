'use strict';

const {
  compatibilityTarget,
  createUnsupportedError,
  createUnsupportedFunction
} = require('../placeholder-utils.js');

const entrypoint = 'react-dom/test-utils';
const privateTestUtilsActGateExport =
  '__FAST_REACT_DOM_TEST_UTILS_PRIVATE_ACT_GATE__';

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
const privateNestedActRootContinuationStatus =
  'accepted-private-sync-flush-nested-act-root-continuation-without-public-act-flushsync';
const privateSyncFlushFinishedWorkHandoffStatus =
  'accepted-private-sync-flush-root-scheduler-finished-work-handoff-without-public-root-execution';
const privateSyncFlushRootHandoffDiagnosticGateId =
  'react-dom-test-utils-act-private-sync-flush-root-handoff-gate-1';
const privateSyncFlushRootHandoffDiagnosticStatus =
  'accepted-private-test-utils-act-sync-flush-root-handoff-diagnostics-without-public-act-routing';
const privateSchedulerMockExpiredActRootWorkDiagnosticGateId =
  'react-dom-test-utils-act-private-scheduler-mock-expired-act-root-work-gate-1';
const privateSchedulerMockExpiredActRootWorkDiagnosticStatus =
  'accepted-private-test-utils-act-scheduler-mock-expired-act-root-work-diagnostics-without-public-act-routing';
const privateSchedulerMockExpiredActRootWorkPrerequisiteId =
  'scheduler-mock-expired-act-root-work-diagnostics';
const privateSchedulerMockExpiredActRootWorkConsumptionStatus =
  'consumed-private-test-utils-act-scheduler-mock-expired-act-root-work-diagnostics';
const privateSchedulerMockDelayedActRootWorkDiagnosticGateId =
  'react-dom-test-utils-act-private-scheduler-mock-delayed-act-root-work-gate-1';
const privateSchedulerMockDelayedActRootWorkDiagnosticStatus =
  'accepted-private-test-utils-act-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics-without-public-act-routing';
const privateSchedulerMockDelayedActRootWorkPrerequisiteId =
  'scheduler-mock-delayed-act-root-work-nested-expired-diagnostics';
const privateSchedulerMockDelayedActRootWorkPreflightStatus =
  'preflighted-private-test-utils-act-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics';
const privateSchedulerMockDelayedActRootWorkWorkerId =
  'worker-835-react-dom-test-utils-act-delayed-scheduler-handoff';
const privateSchedulerMockDelayedActRootWorkSource =
  'packages/react-dom/src/test-utils-act-gate.js';
const privateReactActSchedulerDiagnosticsLedgerPrerequisiteId =
  'react-act-scheduler-private-diagnostics-ledger';
const privateReactActSchedulerDiagnosticsLedgerGateId =
  'private-admission-810-react-act-scheduler-diagnostics-ledger-1';
const privateReactActSchedulerDiagnosticsLedgerStatus =
  'recognized-react-act-scheduler-private-diagnostics-ledger-public-blocked';
const privateReactActSchedulerDiagnosticsLedgerWorkerId =
  'worker-810-react-act-scheduler-diagnostics-ledger';
const privateReactActSchedulerDiagnosticsLedgerSource =
  'tests/conformance/src/private-admission-810-react-act-scheduler-diagnostics-ledger.mjs';
const reactActSchedulerMockExpiredActRootWorkConsumptionStatus =
  'consumed-accepted-scheduler-mock-expired-act-root-work-diagnostics';
const reactActSchedulerMockDelayedActRootWorkPreflightStatus =
  'preflighted-accepted-scheduler-mock-delayed-act-root-work-nested-expired-diagnostics';
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
const passiveEffectDeletedSubtreeRefPassiveOrderingStatus =
  'accepted-private-deleted-subtree-ref-passive-cleanup-order-without-public-passive-drain';
const privateSchedulerDrivenPassiveEffectDiagnosticGateId =
  'react-dom-test-utils-act-private-scheduler-driven-passive-effect-gate-1';
const privateSchedulerDrivenPassiveEffectDiagnosticStatus =
  'accepted-private-test-utils-act-scheduler-driven-passive-effect-diagnostics-without-public-act-routing';
const privateSchedulerDrivenPassiveEffectPrerequisiteId =
  'scheduler-driven-passive-effect-execution-diagnostics';
const privateSchedulerDrivenPassiveEffectConsumptionStatus =
  'consumed-private-test-utils-act-scheduler-driven-passive-effect-diagnostics';
const reactActSchedulerDrivenPassiveEffectConsumptionStatus =
  'consumed-accepted-private-scheduler-driven-passive-effect-execution-diagnostics';
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
const privateNestedActRootContinuationPrerequisiteId =
  'sync-flush-nested-act-root-continuation-evidence';
const privateSyncFlushFinishedWorkHandoffPrerequisiteId =
  'sync-flush-root-scheduler-finished-work-handoff-evidence';
const privateSyncFlushRootHandoffPrerequisiteIds = freezeArray([
  privateNestedActRootContinuationPrerequisiteId,
  privateSyncFlushFinishedWorkHandoffPrerequisiteId
]);
const privateSyncFlushRootHandoffWorkerIds = freezeArray([
  'worker-694-sync-flush-nested-act-root-continuation',
  'worker-718-sync-flush-root-scheduler-finished-work-handoff'
]);
const privateNestedActRootContinuationRecords = freezeArray([
  'SchedulerBridgeActContinuationExecutionRecord.execution_order',
  'SchedulerBridgeActContinuationExecutionRecord.pending_lanes_before_execution',
  'SchedulerBridgeActContinuationExecutionRecord.pending_lanes_after_execution',
  'SyncFlushActPrivateExecutionDiagnosticsForCanary',
  'root_scheduler_nested_act_continuations_preserve_order_and_remaining_lanes',
  'sync_flush_nested_act_root_continuations_preserve_callback_order_and_lanes'
]);
const privateSyncFlushFinishedWorkHandoffRecords = freezeArray([
  'RootSchedulerSyncContinuationFinishedWorkHandoff',
  'SyncFlushRootRecord.finished_work',
  'SyncFlushRootRecord.finished_lanes',
  'FiberRoot.finished_work',
  'FiberRoot.finished_lanes',
  'root_scheduler_finished_work_handoff_rejects_missing_record',
  'root_scheduler_finished_work_handoff_rejects_stale_record',
  'sync_flush_finished_work_handoff_rejects_foreign_record'
]);
const privateSyncFlushRootHandoffEvidence = freezeArray([
  'worker-694-nested-act-continuation-order-and-lane-preservation',
  'worker-718-sync-flush-root-scheduler-finished-work-finished-lanes-handoff',
  'nested-act-continuations-preserve-sync-flush-order',
  'remaining-lanes-survive-nested-act-continuation',
  'finished-work-and-finished-lanes-required-before-private-commit',
  'missing-stale-and-foreign-finished-work-handoffs-rejected',
  'public-act-flushsync-root-execution-remains-blocked'
]);
const privateSyncFlushRootHandoffDiagnosticSummary = freezeRecord({
  gateId: privateSyncFlushRootHandoffDiagnosticGateId,
  status: privateSyncFlushRootHandoffDiagnosticStatus,
  workerIds: privateSyncFlushRootHandoffWorkerIds,
  prerequisiteIds: privateSyncFlushRootHandoffPrerequisiteIds,
  consumesNestedActContinuationEvidence: true,
  consumesFinishedWorkHandoffEvidence: true,
  requiresFinishedWork: true,
  requiresFinishedLanes: true,
  rejectsMissingEvidence: true,
  rejectsStaleEvidence: true,
  rejectsForeignFinishedWorkHandoff: true,
  publicActExecution: false,
  publicFlushSyncExecution: false,
  publicRootExecution: false,
  publicEffectExecution: false,
  executesRendererWork: false,
  compatibilityClaimed: false
});
const privateSyncFlushRootHandoffEvidenceRequirements = freezeRecords([
  {
    id: privateNestedActRootContinuationPrerequisiteId,
    workerId: 'worker-694-sync-flush-nested-act-root-continuation',
    status: privateNestedActRootContinuationStatus,
    source:
      'worker-progress/worker-694-sync-flush-nested-act-root-continuation.md',
    requiredTrueFields: freezeArray([
      'evidenceFresh',
      'staleEvidenceRejected',
      'consumesNestedActContinuationEvidence',
      'preservesNestedActContinuationOrder',
      'preservesRemainingLanes',
      'restoresLaneStateAfterContinuation'
    ]),
    requiredFalseFields: freezeArray([
      'staleEvidence',
      'publicActExecution',
      'publicFlushSyncExecution',
      'publicRootExecution',
      'publicEffectExecution',
      'executesRendererWork',
      'publicActCompatibilityClaimed',
      'publicFlushSyncCompatibilityClaimed',
      'compatibilityClaimed'
    ])
  },
  {
    id: privateSyncFlushFinishedWorkHandoffPrerequisiteId,
    workerId: 'worker-718-sync-flush-root-scheduler-finished-work-handoff',
    status: privateSyncFlushFinishedWorkHandoffStatus,
    source:
      'worker-progress/worker-718-sync-flush-root-scheduler-finished-work-handoff.md',
    requiredTrueFields: freezeArray([
      'evidenceFresh',
      'staleEvidenceRejected',
      'consumesFinishedWorkHandoffEvidence',
      'requiresFinishedWork',
      'requiresFinishedLanes',
      'rejectsMissingFinishedWorkHandoff',
      'rejectsStaleFinishedWorkHandoff',
      'rejectsForeignFinishedWorkHandoff'
    ]),
    requiredFalseFields: freezeArray([
      'staleEvidence',
      'publicActExecution',
      'publicFlushSyncExecution',
      'publicRootExecution',
      'publicEffectExecution',
      'executesRendererWork',
      'publicActCompatibilityClaimed',
      'publicFlushSyncCompatibilityClaimed',
      'publicRootCompatibilityClaimed',
      'compatibilityClaimed'
    ])
  }
]);
const privateSchedulerMockExpiredActRootWorkRecords = freezeArray([
  'RootLaneSchedulingSnapshot',
  'UpdateContainerResult',
  'RootScheduleUpdateRecord',
  'RootTaskScheduleRecord',
  'SchedulerCallbackRequest',
  'RootSchedulerCallbackExecutionRecord',
  'HostRootFinishedWorkPendingCommitRecordForCanary',
  'HostRootFinishedWorkCommitHandoffRecordForCanary'
]);
const privateSchedulerMockExpiredActRootWorkEvidence = freezeArray([
  'worker-747-react-private-act-expired-scheduler-consumer',
  'scheduler-owned-expired-act-root-source-validator',
  'frozen-branded-expired-act-root-diagnostics-version-1',
  'private-act-queue-drain-evidence-consumed',
  'expired-root-work-records-consumed-with-no-remainder',
  'cloned-and-forged-diagnostics-rejected',
  'public-act-root-renderer-and-effects-compatibility-remains-blocked'
]);
const privateSchedulerMockExpiredActRootWorkDiagnosticSummary = freezeRecord({
  gateId: privateSchedulerMockExpiredActRootWorkDiagnosticGateId,
  status: privateSchedulerMockExpiredActRootWorkDiagnosticStatus,
  workerId: 'worker-747-react-private-act-expired-scheduler-consumer',
  prerequisiteId: privateSchedulerMockExpiredActRootWorkPrerequisiteId,
  consumesReactActPrivateSchedulerDiagnostics: true,
  consumesAcceptedExpiredActRootWorkRecords: true,
  requiresSchedulerOwnedSourceProof: true,
  rejectsClonedDiagnostics: true,
  rejectsForgedDiagnostics: true,
  drainsAcceptedInternalTestQueues: true,
  queueFlushingReady: false,
  rendererRootsReady: false,
  passiveEffectsReady: false,
  continuationFlushingReady: false,
  publicActExecution: false,
  publicRootExecution: false,
  publicEffectExecution: false,
  executesRendererWork: false,
  executesRendererRoots: false,
  compatibilityClaimed: false
});
const privateSchedulerMockDelayedActRootWorkRecords = freezeArray([
  'DelayedActRootWorkMetadata',
  'DelayedRendererRootWorkMetadata',
  'DelayedCallbackPromotionEvidence',
  'SchedulerMockDelayedActRootWorkDiagnostics',
  'NestedExpiredActRootWorkDrainReport',
  ...privateSchedulerMockExpiredActRootWorkRecords
]);
const privateSchedulerMockDelayedActRootWorkEvidence = freezeArray([
  'worker-835-react-dom-test-utils-act-delayed-scheduler-handoff',
  'preflightSchedulerMockDelayedActRootWorkDiagnostics',
  'drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics',
  'promoted-delayed-callback-to-expired-mock-scheduler-work-for-diagnostics',
  'nested-expired-act-root-work-consumption',
  'scheduler-owned-delayed-act-root-source-proof-required',
  'stale-foreign-tampered-public-claim-delayed-diagnostics-rejected',
  'public-test-utils-act-root-and-scheduler-timing-remain-blocked'
]);
const privateSchedulerMockDelayedActRootWorkDiagnosticSummary = freezeRecord({
  gateId: privateSchedulerMockDelayedActRootWorkDiagnosticGateId,
  status: privateSchedulerMockDelayedActRootWorkDiagnosticStatus,
  workerId: privateSchedulerMockDelayedActRootWorkWorkerId,
  prerequisiteId: privateSchedulerMockDelayedActRootWorkPrerequisiteId,
  reactActPreflightStatus: reactActSchedulerMockDelayedActRootWorkPreflightStatus,
  consumesReactActPrivateDelayedSchedulerDiagnostics: true,
  preflightsSchedulerMockDelayedActRootWorkDiagnostics: true,
  acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics: true,
  acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: false,
  consumesNestedExpiredActRootWorkDiagnostics: true,
  consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
  drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
  consumesAcceptedExpiredActRootWorkRecords: true,
  drainsAcceptedInternalTestQueues: true,
  requiresSchedulerOwnedSourceProof: true,
  rejectsStaleDiagnostics: true,
  rejectsForeignRendererRootEvidence: true,
  rejectsTamperedDiagnostics: true,
  rejectsPublicClaims: true,
  queueFlushingReady: false,
  rendererRootsReady: false,
  passiveEffectsReady: false,
  continuationFlushingReady: false,
  publicActExecution: false,
  publicRootExecution: false,
  publicEffectExecution: false,
  publicActPassiveDrain: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  publicRootSchedulerCompatibilityClaimed: false,
  publicRendererCompatibilityClaimed: false,
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  invokesPublicSchedulerFlushHelper: false,
  publicSchedulerFlushBehaviorExecuted: false,
  executesQueuedWork: false,
  executesEffects: false,
  executesRendererWork: false,
  executesRendererRoots: false,
  compatibilityClaimed: false
});
const privateSchedulerMockDelayedActRootWorkRequiredTrueFields = freezeArray([
  'consumesReactActPrivateDelayedSchedulerDiagnostics',
  'preflightsSchedulerMockDelayedActRootWorkDiagnostics',
  'acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics',
  'consumesNestedExpiredActRootWorkDiagnostics',
  'consumesSchedulerMockExpiredActRootWorkDiagnostics',
  'drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics',
  'consumesAcceptedExpiredActRootWorkRecords',
  'drainsAcceptedInternalTestQueues',
  'requiresSchedulerOwnedSourceProof',
  'rejectsStaleDiagnostics',
  'rejectsForeignRendererRootEvidence',
  'rejectsTamperedDiagnostics',
  'rejectsPublicClaims'
]);
const privateSchedulerMockDelayedActRootWorkRequiredFalseFields = freezeArray([
  'acceptsTopLevelDelayedActRootWorkAsPublicActEvidence',
  'queueFlushingReady',
  'rendererRootsReady',
  'passiveEffectsReady',
  'continuationFlushingReady',
  'publicActExecution',
  'publicRootExecution',
  'publicEffectExecution',
  'publicActPassiveDrain',
  'publicSchedulerTimingCompatibilityClaimed',
  'publicReactActCompatibilityClaimed',
  'publicRootSchedulerCompatibilityClaimed',
  'publicRendererCompatibilityClaimed',
  'drainsPublicSchedulerTaskQueue',
  'drainsPublicReactActQueue',
  'invokesPublicSchedulerFlushHelper',
  'publicSchedulerFlushBehaviorExecuted',
  'executesQueuedWork',
  'executesEffects',
  'executesRendererWork',
  'executesRendererRoots',
  'compatibilityClaimed'
]);
const privateReactActSchedulerDiagnosticsLedgerWorkerIds = freezeArray([
  'worker-747-react-private-act-expired-scheduler-consumer',
  'worker-772-scheduler-delayed-root-producer',
  'worker-773-test-utils-act-expired-scheduler-handoff',
  'worker-775-react-act-delayed-mock-consumer',
  'worker-791-scheduler-source-proof-private-diagnostics',
  'worker-792-react-delayed-renderer-root-preflight',
  'worker-793-delayed-renderer-root-negative-coverage',
  'worker-798-scheduler-private-diagnostics-integrity'
]);
const privateReactActSchedulerDiagnosticsLedgerEvidenceKinds = freezeArray([
  'scheduler-expired-private-diagnostics',
  'scheduler-delayed-renderer-root-private-producer',
  'react-dom-test-utils-expired-private-handoff',
  'react-act-delayed-nested-expired-preflight',
  'scheduler-source-validator-private-diagnostics-object',
  'react-act-delayed-renderer-root-nested-private-preflight',
  'scheduler-delayed-renderer-root-negative-blockers',
  'scheduler-private-diagnostics-integrity-blockers'
]);
const privateReactActSchedulerDiagnosticsLedgerRendererRootScopes = freezeArray([
  'not-applicable',
  'scheduler-produced-delayed-renderer-root-private-only',
  'not-applicable',
  'delayed-act-root-private-context-nested-expired-only',
  'source-validator-private-diagnostics-object',
  'delayed-renderer-root-nested-private-only',
  'delayed-renderer-root-public-blockers-only',
  'delayed-renderer-root-public-blockers-only'
]);
const privateReactActSchedulerDiagnosticsLedgerPublicBlockerFields =
  freezeArray([
    'publicActReady',
    'publicTestUtilsActReady',
    'publicRootBehaviorReady',
    'publicSchedulerTimingReady',
    'publicSchedulerFlushHelperReady',
    'publicSchedulerFlushExecutionAvailable',
    'publicSchedulerFlushBehaviorExecuted',
    'publicRendererCompatibilityClaimed',
    'publicRootSchedulerCompatibilityClaimed',
    'publicReactActCompatibilityClaimed',
    'publicSchedulerTimingCompatibilityClaimed',
    'publicCompatibilityClaimed',
    'publicPackageCompatibilityClaimed',
    'packageCompatibilityClaimed',
    'drainsPublicSchedulerTaskQueue',
    'drainsPublicReactActQueue',
    'invokesPublicSchedulerFlushHelper',
    'routesAcceptedMockSchedulerFlushHelperMetadata',
    'publicActExecution',
    'publicRootExecution',
    'publicEffectExecution',
    'publicActPassiveDrain',
    'rendererExecutionReady',
    'effectsExecutionReady',
    'executesQueuedWork',
    'executesEffects',
    'executesRendererWork',
    'executesRendererRoots',
    'acceptsTopLevelDelayedActRootWorkAsPublicActEvidence',
    'publicDelayedRendererRootAdmissionClaimed',
    'publicFlushHelperValidatorExposed',
    'packageSurfaceChanged',
    'compatibilityClaimed'
  ]);
const privateReactActSchedulerDiagnosticsLedgerRequirementFields = freezeArray([
  'schedulerOwnedDiagnosticsRecognized',
  'sourceValidatorOwnedByScheduler',
  'schedulerValidatorPrivateDiagnosticsOnly',
  'privateEvidenceOnly',
  'staticReadOnlyLedger',
  'sourceTokenChecksOnly',
  'manifestEvaluationOnly',
  'runtimeExecutionClaimed',
  'packageSurfaceChanged',
  'publicCompatibilityClaimed',
  'publicActReady',
  'publicRootBehaviorReady',
  'publicSchedulerTimingReady',
  'publicSchedulerFlushHelperReady',
  'rendererExecutionReady',
  'effectsExecutionReady',
  'packageCompatibilityClaimed',
  'publicFlushHelperValidatorExposed',
  'publicDelayedRendererRootAdmissionClaimed'
]);
const privateReactActSchedulerDiagnosticsLedgerRequiredTrueFields =
  freezeArray([
    'privateDiagnosticsRecognized',
    'evidenceRecognized',
    'evidenceRolesRecognized',
    'durableEvidenceTokensRecognized',
    'diagnosticIdsRecognized',
    'statusesRecognized',
    'evidenceKindsRecognized',
    'rendererRootScopesRecognized',
    'requirementsRecognized',
    'blockedPublicClaimsRecognized',
    'staticReadOnlyRecognized',
    'sourceValidatorOwnershipRecognized',
    'delayedRendererRootPrivateOnlyRecognized',
    'schedulerOwnedDiagnosticsRecognized',
    'sourceValidatorOwnedByScheduler',
    'schedulerValidatorPrivateDiagnosticsOnly',
    'privateEvidenceOnly',
    'staticReadOnlyLedger',
    'sourceTokenChecksOnly',
    'manifestEvaluationOnly',
    'staleEvidenceRejected',
    'rejectsStaleWorkerLedgerMetadata',
    'rejectsForeignWorkerLedgerMetadata',
    'rejectsTamperedPublicClaims'
  ]);
const privateReactActSchedulerDiagnosticsLedgerRequiredFalseFields =
  freezeArray([
    'staleEvidence',
    'compatibilityClaimed',
    'runtimeExecutionClaimed',
    'packageSurfaceChanged',
    'publicCompatibilityClaimed',
    'publicPackageCompatibilityClaimed',
    'packageCompatibilityClaimed',
    'publicActReady',
    'publicReactActReady',
    'publicTestUtilsActReady',
    'publicRootBehaviorReady',
    'publicSchedulerTimingReady',
    'publicSchedulerFlushHelperReady',
    'publicSchedulerFlushExecutionAvailable',
    'publicSchedulerFlushBehaviorExecuted',
    'publicRendererCompatibilityClaimed',
    'publicRootSchedulerCompatibilityClaimed',
    'publicReactActCompatibilityClaimed',
    'publicSchedulerTimingCompatibilityClaimed',
    'drainsPublicSchedulerTaskQueue',
    'drainsPublicReactActQueue',
    'invokesPublicSchedulerFlushHelper',
    'routesAcceptedMockSchedulerFlushHelperMetadata',
    'publicActExecution',
    'publicRootExecution',
    'publicEffectExecution',
    'publicActPassiveDrain',
    'rendererExecutionReady',
    'effectsExecutionReady',
    'publicFlushHelperValidatorExposed',
    'publicDelayedRendererRootAdmissionClaimed',
    'acceptsTopLevelDelayedActRootWorkAsPublicActEvidence',
    'executesQueuedWork',
    'executesEffects',
    'executesPassiveEffects',
    'executesRendererWork',
    'executesRendererRoots'
  ]);
const privateReactActSchedulerDiagnosticsLedgerRequirements = freezeRecord({
  schedulerOwnedDiagnosticsRecognized: true,
  sourceValidatorOwnedByScheduler: true,
  schedulerValidatorPrivateDiagnosticsOnly: true,
  privateEvidenceOnly: true,
  staticReadOnlyLedger: true,
  sourceTokenChecksOnly: true,
  manifestEvaluationOnly: true,
  runtimeExecutionClaimed: false,
  packageSurfaceChanged: false,
  publicCompatibilityClaimed: false,
  publicActReady: false,
  publicRootBehaviorReady: false,
  publicSchedulerTimingReady: false,
  publicSchedulerFlushHelperReady: false,
  rendererExecutionReady: false,
  effectsExecutionReady: false,
  packageCompatibilityClaimed: false,
  publicFlushHelperValidatorExposed: false,
  publicDelayedRendererRootAdmissionClaimed: false
});
const privateReactActSchedulerDiagnosticsLedgerPublicBlockerClaims =
  falseRecord(privateReactActSchedulerDiagnosticsLedgerPublicBlockerFields);
const privateReactActSchedulerDiagnosticsLedgerSummary = freezeRecord({
  gateId: privateReactActSchedulerDiagnosticsLedgerGateId,
  status: privateReactActSchedulerDiagnosticsLedgerStatus,
  workerId: privateReactActSchedulerDiagnosticsLedgerWorkerId,
  workerIds: privateReactActSchedulerDiagnosticsLedgerWorkerIds,
  workerCount: privateReactActSchedulerDiagnosticsLedgerWorkerIds.length,
  source: privateReactActSchedulerDiagnosticsLedgerSource,
  evidenceKinds: privateReactActSchedulerDiagnosticsLedgerEvidenceKinds,
  delayedRendererRootEvidenceScopes:
    privateReactActSchedulerDiagnosticsLedgerRendererRootScopes,
  privateDiagnosticsRecognized: true,
  evidenceRecognized: true,
  evidenceRolesRecognized: true,
  durableEvidenceTokensRecognized: true,
  diagnosticIdsRecognized: true,
  statusesRecognized: true,
  evidenceKindsRecognized: true,
  rendererRootScopesRecognized: true,
  requirementsRecognized: true,
  blockedPublicClaimsRecognized: true,
  staticReadOnlyRecognized: true,
  sourceValidatorOwnershipRecognized: true,
  delayedRendererRootPrivateOnlyRecognized: true,
  schedulerOwnedDiagnosticsRecognized: true,
  sourceValidatorOwnedByScheduler: true,
  schedulerValidatorPrivateDiagnosticsOnly: true,
  privateEvidenceOnly: true,
  staticReadOnlyLedger: true,
  sourceTokenChecksOnly: true,
  manifestEvaluationOnly: true,
  requirements: privateReactActSchedulerDiagnosticsLedgerRequirements,
  publicBlockerClaims:
    privateReactActSchedulerDiagnosticsLedgerPublicBlockerClaims,
  staleEvidence: false,
  staleEvidenceRejected: true,
  rejectsStaleWorkerLedgerMetadata: true,
  rejectsForeignWorkerLedgerMetadata: true,
  rejectsTamperedPublicClaims: true,
  runtimeExecutionClaimed: false,
  packageSurfaceChanged: false,
  publicCompatibilityClaimed: false,
  publicActReady: false,
  publicReactActReady: false,
  publicTestUtilsActReady: false,
  publicRootBehaviorReady: false,
  publicSchedulerTimingReady: false,
  publicSchedulerFlushHelperReady: false,
  publicSchedulerFlushExecutionAvailable: false,
  publicSchedulerFlushBehaviorExecuted: false,
  publicRendererCompatibilityClaimed: false,
  publicRootSchedulerCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicPackageCompatibilityClaimed: false,
  packageCompatibilityClaimed: false,
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  invokesPublicSchedulerFlushHelper: false,
  routesAcceptedMockSchedulerFlushHelperMetadata: false,
  publicActExecution: false,
  publicRootExecution: false,
  publicEffectExecution: false,
  publicActPassiveDrain: false,
  rendererExecutionReady: false,
  effectsExecutionReady: false,
  publicFlushHelperValidatorExposed: false,
  publicDelayedRendererRootAdmissionClaimed: false,
  acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: false,
  executesQueuedWork: false,
  executesEffects: false,
  executesPassiveEffects: false,
  executesRendererWork: false,
  executesRendererRoots: false,
  compatibilityClaimed: false
});
const acceptedPrivatePrerequisitePublicClaimFields = freezeArray([
  'publicActReady',
  'publicReactActReady',
  'publicTestUtilsActReady',
  'publicRootBehaviorReady',
  'publicSchedulerTimingReady',
  'publicSchedulerFlushHelperReady',
  'publicSchedulerFlushHelperCompatibilityClaimed',
  'publicSchedulerFlushExecutionAvailable',
  'compatibilityClaimed',
  'publicCompatibilityClaimed',
  'publicPackageCompatibilityClaimed',
  'packageCompatibilityClaimed',
  'packageSurfaceChanged',
  'publicSchedulerTimingCompatibilityClaimed',
  'publicReactActCompatibilityClaimed',
  'publicActCompatibilityClaimed',
  'publicFlushSyncCompatibilityClaimed',
  'publicRootCompatibilityClaimed',
  'publicRootSchedulerCompatibilityClaimed',
  'publicRenderCompatibilityClaimed',
  'publicRendererCompatibilityClaimed',
  'publicEffectCompatibilityClaimed',
  'publicActExecution',
  'publicFlushSyncExecution',
  'publicRootExecution',
  'publicDomMutation',
  'publicEffectExecution',
  'publicRendererWork',
  'drainsPublicSchedulerTaskQueue',
  'drainsPublicReactActQueue',
  'invokesPublicSchedulerFlushHelper',
  'routesAcceptedMockSchedulerFlushHelperMetadata',
  'publicSchedulerFlushBehaviorExecuted',
  'executesQueuedWork',
  'executesEffects',
  'executesPassiveEffects',
  'executesRendererWork',
  'executesRendererRoots',
  'executesPublicRendererRoots',
  'publicActPassiveDrain',
  'rendererExecutionReady',
  'effectsExecutionReady',
  'acceptsTopLevelDelayedActRootWorkAsPublicActEvidence',
  'publicDelayedRendererRootAdmissionClaimed',
  'publicFlushHelperValidatorExposed',
  'schedulerDrivenPassiveExecution',
  'executesPublicFlushSync'
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
  'passive-effect-root-error-routing-diagnostics',
  privateSchedulerDrivenPassiveEffectPrerequisiteId
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
const privateSchedulerDrivenPassiveEffectRecords = freezeArray([
  'SchedulerActQueueRequest',
  'SyncFlushActPrivateExecutionDiagnosticsForCanary',
  'SchedulerPassiveEffectsFlushRequest',
  'PassiveEffectSchedulerFlushGateRecord',
  'PendingPassiveCommitHandoff',
  'PassiveEffectSchedulerFlushExecutionRecord',
  'PassiveEffectsFlushResult',
  'PassiveEffectFlushRecord',
  'PassiveEffectDestroyCallbackExecutionRecord',
  'PassiveEffectMountCreateCallbackExecutionRecord'
]);
const privateSchedulerDrivenPassiveEffectWorkerIds = freezeArray([
  'worker-836-reconciler-private-act-queue-execution-path',
  'worker-837-scheduler-driven-passive-effect-execution'
]);
const privateSchedulerDrivenPassiveEffectEvidence = freezeArray([
  'worker-836-reconciler-private-act-queue-execution-path',
  'worker-837-scheduler-driven-passive-effect-execution',
  'source-owned-private-passive-effect-diagnostics',
  'scheduler-owned-expired-act-root-source-proof-required',
  'root-commit-passive-handoff-linked-to-act-flush-diagnostics',
  'scheduler-passive-flush-request-consumed',
  'private-destroy-create-callback-executors-observed',
  'public-act-root-scheduler-package-and-effect-compatibility-remains-blocked'
]);
const privateSchedulerDrivenPassiveEffectDiagnosticSummary = freezeRecord({
  gateId: privateSchedulerDrivenPassiveEffectDiagnosticGateId,
  status: privateSchedulerDrivenPassiveEffectDiagnosticStatus,
  prerequisiteId: privateSchedulerDrivenPassiveEffectPrerequisiteId,
  workerIds: privateSchedulerDrivenPassiveEffectWorkerIds,
  consumesReactActPrivateSchedulerDrivenPassiveDiagnostics: true,
  consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
  requiresSchedulerOwnedSourceProof: true,
  requiresSourceOwnedPassiveEvidence: true,
  linksRootCommitPassiveExecutionToActFlushDiagnostics: true,
  consumesRootCommitPassiveExecution: true,
  consumesSchedulerPassiveFlushRequest: true,
  consumesPendingPassiveHandoff: true,
  privateSchedulerDrivenPassiveExecution: true,
  didExecutePrivateCallbackExecutors: true,
  rejectsStaleDiagnostics: true,
  rejectsCrossRootDiagnostics: true,
  rejectsMissingSchedulerSourceProof: true,
  rejectsMissingPassiveOwnership: true,
  schedulerDrivenPassiveExecution: false,
  queueFlushingReady: false,
  rendererRootsReady: false,
  passiveEffectsReady: false,
  continuationFlushingReady: false,
  publicActExecution: false,
  publicRootExecution: false,
  publicEffectExecution: false,
  publicActPassiveDrain: false,
  publicSchedulerTimingCompatibilityClaimed: false,
  publicReactActCompatibilityClaimed: false,
  publicRootSchedulerCompatibilityClaimed: false,
  publicRendererCompatibilityClaimed: false,
  drainsPublicSchedulerTaskQueue: false,
  drainsPublicReactActQueue: false,
  executesQueuedWork: false,
  executesEffects: false,
  executesPassiveEffects: false,
  executesRendererWork: false,
  executesRendererRoots: false,
  compatibilityClaimed: false
});
const passiveEffectDeletedSubtreeRefPassiveOrderingRecords = freezeArray([
  'HostRootDeletionCleanupOrderGateSnapshot',
  'HostRootDeletionCleanupOrderPhase::RefCleanupReturn',
  'HostRootDeletionCleanupOrderPhase::PassiveDestroy',
  'HostRootDeletionCleanupOrderPhase::HostCleanup',
  'deletion_cleanup_order_gate_for_canary',
  'deletion_ref_passive_cleanup_execution',
  'host_work_deletion_executes_passive_destroy_before_host_cleanup_with_ref_order_evidence'
]);
const privatePassiveDiagnosticEvidence = freezeArray([
  'default-flush-remains-metadata-only',
  'committed-fiber-passive-effect-snapshot',
  'scheduler-passive-flush-request-order',
  'scheduler-flush-executes-metadata-only-passive-drain',
  'test-controlled-passive-destroy-callback-execution',
  'test-controlled-passive-mount-create-callback-execution',
  'passive-callback-error-root-capture-metadata',
  'scheduler-driven-passive-effect-private-execution',
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
  privateSchedulerDrivenPassiveExecution: true,
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
  },
  {
    id: privateSchedulerDrivenPassiveEffectPrerequisiteId,
    present: true,
    status: privateSchedulerDrivenPassiveEffectDiagnosticStatus,
    source: 'packages/react/private-act-dispatcher-gate.js',
    recordOnly: false,
    privateDiagnostic: true,
    diagnosticGateId: privateSchedulerDrivenPassiveEffectDiagnosticGateId,
    diagnosticStatus: privateSchedulerDrivenPassiveEffectDiagnosticStatus,
    summary: privateSchedulerDrivenPassiveEffectDiagnosticSummary,
    ...privateSchedulerDrivenPassiveEffectDiagnosticSummary,
    records: privateSchedulerDrivenPassiveEffectRecords,
    evidence: privateSchedulerDrivenPassiveEffectEvidence
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
    id: privateSchedulerMockExpiredActRootWorkPrerequisiteId,
    present: true,
    status: privateSchedulerMockExpiredActRootWorkDiagnosticStatus,
    source: 'packages/react/private-act-dispatcher-gate.js',
    workerId: 'worker-747-react-private-act-expired-scheduler-consumer',
    recordOnly: false,
    privateDiagnostic: true,
    diagnosticGateId: privateSchedulerMockExpiredActRootWorkDiagnosticGateId,
    diagnosticStatus: privateSchedulerMockExpiredActRootWorkDiagnosticStatus,
    consumesReactActPrivateSchedulerDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    requiresSchedulerOwnedSourceProof: true,
    rejectsClonedDiagnostics: true,
    rejectsForgedDiagnostics: true,
    drainsAcceptedInternalTestQueues: true,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    publicActExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    compatibilityClaimed: false,
    records: privateSchedulerMockExpiredActRootWorkRecords,
    evidence: privateSchedulerMockExpiredActRootWorkEvidence
  },
  {
    id: privateReactActSchedulerDiagnosticsLedgerPrerequisiteId,
    present: true,
    recordOnly: false,
    privateDiagnostic: true,
    diagnosticGateId: privateReactActSchedulerDiagnosticsLedgerGateId,
    diagnosticStatus: privateReactActSchedulerDiagnosticsLedgerStatus,
    summary: privateReactActSchedulerDiagnosticsLedgerSummary,
    ...privateReactActSchedulerDiagnosticsLedgerSummary
  },
  {
    id: privateSchedulerMockDelayedActRootWorkPrerequisiteId,
    present: true,
    status: privateSchedulerMockDelayedActRootWorkDiagnosticStatus,
    source: privateSchedulerMockDelayedActRootWorkSource,
    workerId: privateSchedulerMockDelayedActRootWorkWorkerId,
    recordOnly: false,
    privateDiagnostic: true,
    diagnosticGateId: privateSchedulerMockDelayedActRootWorkDiagnosticGateId,
    diagnosticStatus: privateSchedulerMockDelayedActRootWorkDiagnosticStatus,
    summary: privateSchedulerMockDelayedActRootWorkDiagnosticSummary,
    ...privateSchedulerMockDelayedActRootWorkDiagnosticSummary,
    records: privateSchedulerMockDelayedActRootWorkRecords,
    evidence: privateSchedulerMockDelayedActRootWorkEvidence
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
    id: privateNestedActRootContinuationPrerequisiteId,
    present: true,
    status: privateNestedActRootContinuationStatus,
    source:
      'worker-progress/worker-694-sync-flush-nested-act-root-continuation.md',
    workerId: 'worker-694-sync-flush-nested-act-root-continuation',
    recordOnly: false,
    privateDiagnostic: true,
    evidenceFresh: true,
    staleEvidence: false,
    staleEvidenceRejected: true,
    diagnosticGateId: privateSyncFlushRootHandoffDiagnosticGateId,
    diagnosticStatus: privateSyncFlushRootHandoffDiagnosticStatus,
    consumesNestedActContinuationEvidence: true,
    preservesNestedActContinuationOrder: true,
    preservesRemainingLanes: true,
    restoresLaneStateAfterContinuation: true,
    executesPrivateSyncFlushContinuation: true,
    publicActExecution: false,
    publicFlushSyncExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    executesRendererWork: false,
    publicActCompatibilityClaimed: false,
    publicFlushSyncCompatibilityClaimed: false,
    compatibilityClaimed: false,
    records: privateNestedActRootContinuationRecords
  },
  {
    id: privateSyncFlushFinishedWorkHandoffPrerequisiteId,
    present: true,
    status: privateSyncFlushFinishedWorkHandoffStatus,
    source:
      'worker-progress/worker-718-sync-flush-root-scheduler-finished-work-handoff.md',
    workerId: 'worker-718-sync-flush-root-scheduler-finished-work-handoff',
    recordOnly: false,
    privateDiagnostic: true,
    evidenceFresh: true,
    staleEvidence: false,
    staleEvidenceRejected: true,
    diagnosticGateId: privateSyncFlushRootHandoffDiagnosticGateId,
    diagnosticStatus: privateSyncFlushRootHandoffDiagnosticStatus,
    consumesFinishedWorkHandoffEvidence: true,
    requiresFinishedWork: true,
    requiresFinishedLanes: true,
    rejectsMissingFinishedWorkHandoff: true,
    rejectsStaleFinishedWorkHandoff: true,
    rejectsForeignFinishedWorkHandoff: true,
    executesPrivateRootSchedulerCommit: true,
    publicActExecution: false,
    publicFlushSyncExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    executesRendererWork: false,
    publicActCompatibilityClaimed: false,
    publicFlushSyncCompatibilityClaimed: false,
    publicRootCompatibilityClaimed: false,
    compatibilityClaimed: false,
    records: privateSyncFlushFinishedWorkHandoffRecords
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
    blockedByAcceptedPrivateSchedulerMockExpiredActRootWorkDiagnostics: true,
    acceptedPrivateSchedulerMockExpiredActRootWorkPrerequisiteId:
      privateSchedulerMockExpiredActRootWorkPrerequisiteId,
    blockedByAcceptedPrivateSchedulerMockDelayedActRootWorkDiagnostics: true,
    acceptedPrivateSchedulerMockDelayedActRootWorkPrerequisiteId:
      privateSchedulerMockDelayedActRootWorkPrerequisiteId,
    reason:
      'Public React.act remains a FAST_REACT_UNIMPLEMENTED placeholder in the default React entrypoint.'
  },
  {
    id: 'act-queue-flushing-execution',
    present: false,
    requiredBeforePublicAct: true,
    reason:
      'Accepted act queue records still do not drain public queued work or act scheduler continuations, even though private scheduler mock expired act/root, nested continuation, and sync-flush root handoff evidence exists.',
    blockedByAcceptedPrivateSyncFlushRootHandoffDiagnostics: true,
    acceptedPrivateSyncFlushRootHandoffPrerequisiteIds:
      privateSyncFlushRootHandoffPrerequisiteIds,
    blockedByAcceptedPrivateSchedulerMockExpiredActRootWorkDiagnostics: true,
    acceptedPrivateSchedulerMockExpiredActRootWorkPrerequisiteId:
      privateSchedulerMockExpiredActRootWorkPrerequisiteId,
    blockedByAcceptedPrivateSchedulerMockDelayedActRootWorkDiagnostics: true,
    acceptedPrivateSchedulerMockDelayedActRootWorkPrerequisiteId:
      privateSchedulerMockDelayedActRootWorkPrerequisiteId
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
      'Private fake-DOM host-output, warning-boundary, Scheduler mock expired act/root, and sync-flush finished-work handoff diagnostics exist, but public React DOM roots still throw placeholders instead of routing create, render, update, unmount, or warning behavior.',
    blockedByAcceptedPrivateSyncFlushRootHandoffDiagnostics: true,
    acceptedPrivateSyncFlushRootHandoffPrerequisiteIds:
      privateSyncFlushRootHandoffPrerequisiteIds,
    blockedByAcceptedPrivateSchedulerMockExpiredActRootWorkDiagnostics: true,
    acceptedPrivateSchedulerMockExpiredActRootWorkPrerequisiteId:
      privateSchedulerMockExpiredActRootWorkPrerequisiteId,
    blockedByAcceptedPrivateSchedulerMockDelayedActRootWorkDiagnostics: true,
    acceptedPrivateSchedulerMockDelayedActRootWorkPrerequisiteId:
      privateSchedulerMockDelayedActRootWorkPrerequisiteId
  },
  {
    id: 'public-react-dom-flush-sync-execution',
    present: false,
    requiredBeforePublicAct: true,
    blockedByAcceptedPrivateSyncFlushRootHandoffDiagnostics: true,
    acceptedPrivateSyncFlushRootHandoffPrerequisiteIds:
      privateSyncFlushRootHandoffPrerequisiteIds,
    reason:
      'Public React DOM flushSync remains an unsupported placeholder even though private nested act continuation and finished-work/finished-lanes handoff metadata exists.'
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
  executesRendererWork: false,
  executesRendererRoots: false,
  executesPublicRendererRoots: false,
  executesPublicDomMutation: false,
  executesSyncFlush: false,
  executesPublicFlushSync: false,
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
      schedulerMockExpiredActRootWorkDiagnosticsReady: true,
      consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
      drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
      acceptedSchedulerMockExpiredActRootWorkRecords:
        privateSchedulerMockExpiredActRootWorkRecords,
      schedulerMockDelayedActRootWorkDiagnosticsReady: true,
      preflightsSchedulerMockDelayedActRootWorkDiagnostics: true,
      schedulerMockDelayedActRootWorkPreflightStatus:
        reactActSchedulerMockDelayedActRootWorkPreflightStatus,
      acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics:
        true,
      acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: false,
      schedulerDrivenPassiveEffectDiagnosticsReady: true,
      consumesSchedulerDrivenPassiveEffectDiagnostics: true,
      schedulerDrivenPassiveEffectConsumptionStatus:
        reactActSchedulerDrivenPassiveEffectConsumptionStatus,
      acceptedSchedulerDrivenPassiveEffectRecords:
        privateSchedulerDrivenPassiveEffectRecords,
      privateSchedulerDrivenPassiveExecution: true,
      schedulerDrivenPassiveExecution: false,
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
    privateSyncFlushRootHandoffDiagnostics: freezeRecord({
      gateId: privateSyncFlushRootHandoffDiagnosticGateId,
      status: privateSyncFlushRootHandoffDiagnosticStatus,
      workerIds: privateSyncFlushRootHandoffWorkerIds,
      prerequisiteIds: privateSyncFlushRootHandoffPrerequisiteIds,
      acceptedPrerequisiteIds: privateSyncFlushRootHandoffPrerequisiteIds,
      evidence: privateSyncFlushRootHandoffEvidence,
      evidenceRequirements: privateSyncFlushRootHandoffEvidenceRequirements,
      summary: privateSyncFlushRootHandoffDiagnosticSummary,
      nestedActContinuation: freezeRecord({
        id: privateNestedActRootContinuationPrerequisiteId,
        status: privateNestedActRootContinuationStatus,
        workerId: 'worker-694-sync-flush-nested-act-root-continuation',
        records: privateNestedActRootContinuationRecords,
        evidenceFresh: true,
        staleEvidenceRejected: true,
        consumesNestedActContinuationEvidence: true,
        preservesNestedActContinuationOrder: true,
        preservesRemainingLanes: true,
        restoresLaneStateAfterContinuation: true,
        publicActExecution: false,
        publicFlushSyncExecution: false,
        publicRootExecution: false,
        publicEffectExecution: false,
        executesRendererWork: false,
        compatibilityClaimed: false
      }),
      finishedWorkHandoff: freezeRecord({
        id: privateSyncFlushFinishedWorkHandoffPrerequisiteId,
        status: privateSyncFlushFinishedWorkHandoffStatus,
        workerId: 'worker-718-sync-flush-root-scheduler-finished-work-handoff',
        records: privateSyncFlushFinishedWorkHandoffRecords,
        evidenceFresh: true,
        staleEvidenceRejected: true,
        consumesFinishedWorkHandoffEvidence: true,
        requiresFinishedWork: true,
        requiresFinishedLanes: true,
        rejectsMissingFinishedWorkHandoff: true,
        rejectsStaleFinishedWorkHandoff: true,
        rejectsForeignFinishedWorkHandoff: true,
        publicActExecution: false,
        publicFlushSyncExecution: false,
        publicRootExecution: false,
        publicEffectExecution: false,
        executesRendererWork: false,
        compatibilityClaimed: false
      }),
      publicActExecution: false,
      publicFlushSyncExecution: false,
      publicRootExecution: false,
      publicEffectExecution: false,
      executesRendererWork: false,
      compatibilityClaimed: false
    }),
    privateSchedulerMockExpiredActRootWorkDiagnostics: freezeRecord({
      gateId: privateSchedulerMockExpiredActRootWorkDiagnosticGateId,
      status: privateSchedulerMockExpiredActRootWorkDiagnosticStatus,
      workerId: 'worker-747-react-private-act-expired-scheduler-consumer',
      prerequisiteId: privateSchedulerMockExpiredActRootWorkPrerequisiteId,
      acceptedPrerequisiteId:
        privateSchedulerMockExpiredActRootWorkPrerequisiteId,
      records: privateSchedulerMockExpiredActRootWorkRecords,
      evidence: privateSchedulerMockExpiredActRootWorkEvidence,
      summary: privateSchedulerMockExpiredActRootWorkDiagnosticSummary,
      consumesReactActPrivateSchedulerDiagnostics: true,
      consumesAcceptedExpiredActRootWorkRecords: true,
      requiresSchedulerOwnedSourceProof: true,
      rejectsClonedDiagnostics: true,
      rejectsForgedDiagnostics: true,
      drainsAcceptedInternalTestQueues: true,
      queueFlushingReady: false,
      rendererRootsReady: false,
      passiveEffectsReady: false,
      continuationFlushingReady: false,
      publicActExecution: false,
      publicRootExecution: false,
      publicEffectExecution: false,
      executesQueuedWork: false,
      executesEffects: false,
      executesRendererWork: false,
      executesRendererRoots: false,
      publicCompatibilityClaimed: false,
      publicSchedulerTimingCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false,
      publicRootSchedulerCompatibilityClaimed: false,
      publicRendererCompatibilityClaimed: false,
      drainsPublicSchedulerTaskQueue: false,
      drainsPublicReactActQueue: false,
      compatibilityClaimed: false
    }),
    privateSchedulerMockDelayedActRootWorkDiagnostics: freezeRecord({
      gateId: privateSchedulerMockDelayedActRootWorkDiagnosticGateId,
      status: privateSchedulerMockDelayedActRootWorkDiagnosticStatus,
      workerId: privateSchedulerMockDelayedActRootWorkWorkerId,
      prerequisiteId: privateSchedulerMockDelayedActRootWorkPrerequisiteId,
      acceptedPrerequisiteId:
        privateSchedulerMockDelayedActRootWorkPrerequisiteId,
      records: privateSchedulerMockDelayedActRootWorkRecords,
      evidence: privateSchedulerMockDelayedActRootWorkEvidence,
      summary: privateSchedulerMockDelayedActRootWorkDiagnosticSummary,
      reactActPreflightStatus:
        reactActSchedulerMockDelayedActRootWorkPreflightStatus,
      consumesReactActPrivateDelayedSchedulerDiagnostics: true,
      preflightsSchedulerMockDelayedActRootWorkDiagnostics: true,
      acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics:
        true,
      acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: false,
      consumesNestedExpiredActRootWorkDiagnostics: true,
      consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
      drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
      consumesAcceptedExpiredActRootWorkRecords: true,
      drainsAcceptedInternalTestQueues: true,
      requiresSchedulerOwnedSourceProof: true,
      rejectsStaleDiagnostics: true,
      rejectsForeignRendererRootEvidence: true,
      rejectsTamperedDiagnostics: true,
      rejectsPublicClaims: true,
      queueFlushingReady: false,
      rendererRootsReady: false,
      passiveEffectsReady: false,
      continuationFlushingReady: false,
      publicActExecution: false,
      publicRootExecution: false,
      publicEffectExecution: false,
      publicActPassiveDrain: false,
      publicCompatibilityClaimed: false,
      publicSchedulerTimingCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false,
      publicRootSchedulerCompatibilityClaimed: false,
      publicRendererCompatibilityClaimed: false,
      drainsPublicSchedulerTaskQueue: false,
      drainsPublicReactActQueue: false,
      invokesPublicSchedulerFlushHelper: false,
      publicSchedulerFlushBehaviorExecuted: false,
      executesQueuedWork: false,
      executesEffects: false,
      executesRendererWork: false,
      executesRendererRoots: false,
      compatibilityClaimed: false
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
      deletedSubtreeRefPassiveCleanupOrder: freezeRecord({
        status: passiveEffectDeletedSubtreeRefPassiveOrderingStatus,
        records: passiveEffectDeletedSubtreeRefPassiveOrderingRecords,
        source: 'crates/fast-react-reconciler/src/root_commit.rs',
        executionSource:
          'crates/fast-react-reconciler/src/passive_effects.rs',
        consumesDeletionCleanupOrderGate: true,
        consumesRefCleanupExecution: true,
        consumesPassiveDestroyMetadata: true,
        refCleanupBeforePassiveDestroy: true,
        passiveDestroyBeforeHostCleanup: true,
        hostCleanupAfterPassiveDestroy: true,
        publicActPassiveDrain: false,
        publicEffectExecution: false,
        schedulerDrivenPassiveExecution: false,
        publicRootExecution: false,
        compatibilityClaimed: false
      }),
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
    privateSchedulerDrivenPassiveEffectDiagnostics: freezeRecord({
      gateId: privateSchedulerDrivenPassiveEffectDiagnosticGateId,
      status: privateSchedulerDrivenPassiveEffectDiagnosticStatus,
      prerequisiteId: privateSchedulerDrivenPassiveEffectPrerequisiteId,
      acceptedPrerequisiteId: privateSchedulerDrivenPassiveEffectPrerequisiteId,
      workerIds: privateSchedulerDrivenPassiveEffectWorkerIds,
      records: privateSchedulerDrivenPassiveEffectRecords,
      evidence: privateSchedulerDrivenPassiveEffectEvidence,
      summary: privateSchedulerDrivenPassiveEffectDiagnosticSummary,
      consumesReactActPrivateSchedulerDrivenPassiveDiagnostics: true,
      consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
      requiresSchedulerOwnedSourceProof: true,
      requiresSourceOwnedPassiveEvidence: true,
      linksRootCommitPassiveExecutionToActFlushDiagnostics: true,
      consumesRootCommitPassiveExecution: true,
      consumesSchedulerPassiveFlushRequest: true,
      consumesPendingPassiveHandoff: true,
      privateSchedulerDrivenPassiveExecution: true,
      didExecutePrivateCallbackExecutors: true,
      rejectsStaleDiagnostics: true,
      rejectsCrossRootDiagnostics: true,
      rejectsMissingSchedulerSourceProof: true,
      rejectsMissingPassiveOwnership: true,
      schedulerDrivenPassiveExecution: false,
      queueFlushingReady: false,
      rendererRootsReady: false,
      passiveEffectsReady: false,
      continuationFlushingReady: false,
      publicActExecution: false,
      publicRootExecution: false,
      publicEffectExecution: false,
      publicActPassiveDrain: false,
      publicSchedulerTimingCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false,
      publicRootSchedulerCompatibilityClaimed: false,
      publicRendererCompatibilityClaimed: false,
      drainsPublicSchedulerTaskQueue: false,
      drainsPublicReactActQueue: false,
      executesQueuedWork: false,
      executesEffects: false,
      executesPassiveEffects: false,
      executesRendererWork: false,
      executesRendererRoots: false,
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
    ...overrides,
    privateReactActSchedulerDiagnosticsLedger:
      createReactActSchedulerDiagnosticsLedgerGateSurface()
  });
}

function createReactActSchedulerDiagnosticsLedgerGateSurface() {
  return freezeRecord({
    prerequisiteId: privateReactActSchedulerDiagnosticsLedgerPrerequisiteId,
    acceptedPrerequisiteId: privateReactActSchedulerDiagnosticsLedgerPrerequisiteId,
    summary: privateReactActSchedulerDiagnosticsLedgerSummary,
    ...privateReactActSchedulerDiagnosticsLedgerSummary
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
  const acceptedPrivatePrerequisiteIds = acceptedPrivatePrerequisites.map(
    (prerequisite) => prerequisite.id
  );
  const expectedAcceptedPrivatePrerequisiteIds =
    gate.acceptedPrivatePrerequisiteIds;
  const missingExpectedPrivatePrerequisiteIds =
    expectedAcceptedPrivatePrerequisiteIds.filter(
      (prerequisiteId) =>
        !acceptedPrivatePrerequisiteIds.includes(prerequisiteId)
    );
  const unexpectedAcceptedPrivatePrerequisiteIds =
    acceptedPrivatePrerequisiteIds.filter(
      (prerequisiteId) =>
        !expectedAcceptedPrivatePrerequisiteIds.includes(prerequisiteId)
    );
  const duplicateAcceptedPrivatePrerequisiteIds =
    acceptedPrivatePrerequisiteIds.filter(
      (prerequisiteId, index) =>
        acceptedPrivatePrerequisiteIds.indexOf(prerequisiteId) !== index
    );
  const stalePrivatePrerequisites =
    collectStaleAcceptedPrivatePrerequisites(acceptedPrivatePrerequisites);
  const privatePrerequisitePublicClaims =
    collectAcceptedPrivatePrerequisitePublicClaims(acceptedPrivatePrerequisites);
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
  if (
    missingExpectedPrivatePrerequisiteIds.length > 0 ||
    unexpectedAcceptedPrivatePrerequisiteIds.length > 0 ||
    duplicateAcceptedPrivatePrerequisiteIds.length > 0
  ) {
    violations.push(
      createViolation('accepted-private-prerequisite-manifest-mismatch', {
        missingPrerequisiteIds: missingExpectedPrivatePrerequisiteIds,
        unexpectedPrerequisiteIds: unexpectedAcceptedPrivatePrerequisiteIds,
        duplicatePrerequisiteIds: duplicateAcceptedPrivatePrerequisiteIds
      })
    );
  }
  if (stalePrivatePrerequisites.length > 0) {
    violations.push(
      createViolation('accepted-private-prerequisite-stale-evidence', {
        prerequisites: stalePrivatePrerequisites
      })
    );
  }
  if (privatePrerequisitePublicClaims.length > 0) {
    violations.push(
      createViolation('accepted-private-prerequisite-public-claim-detected', {
        claims: privatePrerequisitePublicClaims
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
    stalePrivatePrerequisites,
    privatePrerequisitePublicClaims,
    violations,
    status:
      violations.length === 0
        ? gate.status
        : 'blocked-public-test-utils-act-private-routing-with-violations'
  });
}

function loadReactPrivateActDispatcherGate() {
  return require('../../react/private-act-dispatcher-gate.js');
}

function isAcceptedReactSchedulerMockExpiredActRootWorkConsumption(
  consumption
) {
  return (
    isObjectLike(consumption) &&
    Object.isFrozen(consumption) &&
    consumption.status ===
      reactActSchedulerMockExpiredActRootWorkConsumptionStatus &&
    consumption.accepted === true &&
    consumption.schedulerMockExpiredActRootWorkDiagnosticsReady === true &&
    consumption.consumesSchedulerMockExpiredActRootWorkDiagnostics === true &&
    consumption.drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics ===
      true &&
    consumption.consumesAcceptedExpiredActRootWorkRecords === true &&
    consumption.drainsAcceptedInternalTestQueues === true &&
    consumption.queueFlushingReady === false &&
    consumption.rendererRootsReady === false &&
    consumption.passiveEffectsReady === false &&
    consumption.continuationFlushingReady === false &&
    consumption.publicCompatibilityClaimed === false &&
    consumption.publicSchedulerTimingCompatibilityClaimed === false &&
    consumption.publicReactActCompatibilityClaimed === false &&
    consumption.publicRootSchedulerCompatibilityClaimed === false &&
    consumption.publicRendererCompatibilityClaimed === false &&
    consumption.drainsPublicSchedulerTaskQueue === false &&
    consumption.drainsPublicReactActQueue === false &&
    consumption.invokesPublicSchedulerFlushHelper === false &&
    consumption.publicSchedulerFlushBehaviorExecuted === false &&
    consumption.executesQueuedWork === false &&
    consumption.executesEffects === false &&
    consumption.executesRendererWork === false &&
    consumption.executesRendererRoots === false
  );
}

function isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(report) {
  try {
    const reactGate = loadReactPrivateActDispatcherGate();
    return (
      typeof reactGate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics ===
        'function' &&
      reactGate.isAcceptedSchedulerMockExpiredActRootWorkDiagnostics(report) ===
        true
    );
  } catch (_error) {
    return false;
  }
}

function consumeSchedulerMockExpiredActRootWorkDiagnostics(report) {
  const reactGate = loadReactPrivateActDispatcherGate();
  let reactActConsumptionReport;

  try {
    reactActConsumptionReport =
      reactGate.consumeSchedulerMockExpiredActRootWorkDiagnostics(report);
  } catch (error) {
    throw createSchedulerMockExpiredActRootWorkDiagnosticsGateError(
      getReactActSchedulerMockExpiredActRootWorkRejectionReason(error)
    );
  }

  if (
    !isAcceptedReactSchedulerMockExpiredActRootWorkConsumption(
      reactActConsumptionReport
    )
  ) {
    throw createSchedulerMockExpiredActRootWorkDiagnosticsGateError(
      'react-act-private-consumption-report'
    );
  }

  return freezeRecord({
    status: privateSchedulerMockExpiredActRootWorkConsumptionStatus,
    accepted: true,
    gateId: privateSchedulerMockExpiredActRootWorkDiagnosticGateId,
    diagnosticStatus: privateSchedulerMockExpiredActRootWorkDiagnosticStatus,
    prerequisiteId: privateSchedulerMockExpiredActRootWorkPrerequisiteId,
    workerId: 'worker-747-react-private-act-expired-scheduler-consumer',
    reactActConsumptionStatus: reactActConsumptionReport.status,
    schedulerMockExpiredActRootWorkDiagnosticsStatus:
      reactActConsumptionReport.schedulerMockExpiredActRootWorkDiagnosticsStatus,
    schedulerMockExpiredActRootWorkDiagnosticKind:
      reactActConsumptionReport.schedulerMockExpiredActRootWorkDiagnosticKind,
    schedulerMockExpiredActRootWorkDiagnosticVersion:
      reactActConsumptionReport.schedulerMockExpiredActRootWorkDiagnosticVersion,
    schedulerDiagnosticStatus:
      reactActConsumptionReport.schedulerDiagnosticStatus,
    selectedFlushHelper: reactActConsumptionReport.selectedFlushHelper,
    rootWorkRecordSummary: reactActConsumptionReport.rootWorkRecordSummary,
    actQueueDrainSummary: reactActConsumptionReport.actQueueDrainSummary,
    consumesReactActPrivateSchedulerDiagnostics: true,
    consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
    drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    drainsAcceptedInternalTestQueues: true,
    requiresSchedulerOwnedSourceProof: true,
    rejectsClonedDiagnostics: true,
    rejectsForgedDiagnostics: true,
    privateRoutingReady: false,
    publicReactActReady: false,
    publicTestUtilsActReady: false,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicActExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    publicActPassiveDrain: false,
    schedulerDrivenPassiveExecution: false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesPassiveEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    compatibilityClaimed: false,
    reactActConsumptionReport
  });
}

function isAcceptedReactSchedulerMockDelayedActRootWorkPreflight(
  preflight
) {
  return (
    isObjectLike(preflight) &&
    Object.isFrozen(preflight) &&
    preflight.status === reactActSchedulerMockDelayedActRootWorkPreflightStatus &&
    preflight.accepted === true &&
    preflight.schedulerMockDelayedActRootWorkDiagnosticsReady === true &&
    preflight.preflightsSchedulerMockDelayedActRootWorkDiagnostics === true &&
    preflight.acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics ===
      true &&
    preflight.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence === false &&
    preflight.consumesSchedulerMockExpiredActRootWorkDiagnostics === true &&
    preflight.drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics ===
      true &&
    preflight.consumesAcceptedExpiredActRootWorkRecords === true &&
    preflight.drainsAcceptedInternalTestQueues === true &&
    preflight.queueFlushingReady === false &&
    preflight.rendererRootsReady === false &&
    preflight.passiveEffectsReady === false &&
    preflight.continuationFlushingReady === false &&
    preflight.publicCompatibilityClaimed === false &&
    preflight.publicSchedulerTimingCompatibilityClaimed === false &&
    preflight.publicReactActCompatibilityClaimed === false &&
    preflight.publicRootSchedulerCompatibilityClaimed === false &&
    preflight.publicRendererCompatibilityClaimed === false &&
    preflight.drainsPublicSchedulerTaskQueue === false &&
    preflight.drainsPublicReactActQueue === false &&
    preflight.invokesPublicSchedulerFlushHelper === false &&
    preflight.publicSchedulerFlushBehaviorExecuted === false &&
    preflight.executesQueuedWork === false &&
    preflight.executesEffects === false &&
    preflight.executesRendererWork === false &&
    preflight.executesRendererRoots === false &&
    isAcceptedReactSchedulerMockExpiredActRootWorkConsumption(
      preflight.nestedExpiredActRootWorkConsumption
    )
  );
}

function isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(report) {
  try {
    const reactGate = loadReactPrivateActDispatcherGate();
    return (
      typeof reactGate.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics ===
        'function' &&
      reactGate.isAcceptedSchedulerMockDelayedActRootWorkDiagnostics(report) ===
        true
    );
  } catch (_error) {
    return false;
  }
}

function preflightSchedulerMockDelayedActRootWorkDiagnostics(report) {
  const reactGate = loadReactPrivateActDispatcherGate();
  let reactActPreflightReport;

  try {
    reactActPreflightReport =
      reactGate.preflightSchedulerMockDelayedActRootWorkDiagnostics(report);
  } catch (error) {
    throw createSchedulerMockDelayedActRootWorkDiagnosticsGateError(
      getReactActSchedulerMockDelayedActRootWorkRejectionReason(error)
    );
  }

  if (
    !isAcceptedReactSchedulerMockDelayedActRootWorkPreflight(
      reactActPreflightReport
    )
  ) {
    throw createSchedulerMockDelayedActRootWorkDiagnosticsGateError(
      'react-act-private-scheduler-delayed-preflight-report'
    );
  }

  let nestedExpiredConsumption;
  try {
    nestedExpiredConsumption =
      consumeSchedulerMockExpiredActRootWorkDiagnostics(
        reactActPreflightReport.expiredActRootWorkDrainReport
      );
  } catch (error) {
    throw createSchedulerMockDelayedActRootWorkDiagnosticsGateError(
      `nested-${getReactActSchedulerMockExpiredActRootWorkRejectionReason(
        error
      )}`
    );
  }

  return freezeRecord({
    status: privateSchedulerMockDelayedActRootWorkPreflightStatus,
    accepted: true,
    gateId: privateSchedulerMockDelayedActRootWorkDiagnosticGateId,
    diagnosticStatus: privateSchedulerMockDelayedActRootWorkDiagnosticStatus,
    prerequisiteId: privateSchedulerMockDelayedActRootWorkPrerequisiteId,
    workerId: privateSchedulerMockDelayedActRootWorkWorkerId,
    reactActPreflightStatus: reactActPreflightReport.status,
    schedulerMockDelayedActRootWorkDiagnosticsStatus:
      reactActPreflightReport.schedulerMockDelayedActRootWorkDiagnosticsStatus,
    schedulerMockDelayedActRootWorkDiagnosticKind:
      reactActPreflightReport.schedulerMockDelayedActRootWorkDiagnosticKind,
    schedulerMockDelayedActRootWorkDiagnosticVersion:
      reactActPreflightReport.schedulerMockDelayedActRootWorkDiagnosticVersion,
    schedulerMockExpiredActRootWorkDiagnosticsStatus:
      reactActPreflightReport.schedulerMockExpiredActRootWorkDiagnosticsStatus,
    schedulerMockExpiredActRootWorkDiagnosticKind:
      reactActPreflightReport.schedulerMockExpiredActRootWorkDiagnosticKind,
    schedulerMockExpiredActRootWorkDiagnosticVersion:
      reactActPreflightReport.schedulerMockExpiredActRootWorkDiagnosticVersion,
    schedulerDiagnosticStatus:
      reactActPreflightReport.schedulerDiagnosticStatus,
    delayedCallbackPriorityLevel:
      reactActPreflightReport.delayedCallbackPriorityLevel,
    delayedCallbackPriorityLabel:
      reactActPreflightReport.delayedCallbackPriorityLabel,
    delayedCallbackSchedulerPriority:
      reactActPreflightReport.delayedCallbackSchedulerPriority,
    delayedCallbackScheduledVirtualTime:
      reactActPreflightReport.delayedCallbackScheduledVirtualTime,
    delayedCallbackDelayMs: reactActPreflightReport.delayedCallbackDelayMs,
    delayedCallbackStartTime:
      reactActPreflightReport.delayedCallbackStartTime,
    delayedCallbackExpirationTime:
      reactActPreflightReport.delayedCallbackExpirationTime,
    delayedCallbackPriorityTimeoutMs:
      reactActPreflightReport.delayedCallbackPriorityTimeoutMs,
    delayedCallbackVirtualTimeBefore:
      reactActPreflightReport.delayedCallbackVirtualTimeBefore,
    delayedCallbackVirtualTimeAfterPromotion:
      reactActPreflightReport.delayedCallbackVirtualTimeAfterPromotion,
    delayedCallbackAdvanceTimeBy:
      reactActPreflightReport.delayedCallbackAdvanceTimeBy,
    delayedActRootWorkProducerKind:
      reactActPreflightReport.delayedActRootWorkProducerKind,
    delayedActRootWorkProducerStatus:
      reactActPreflightReport.delayedActRootWorkProducerStatus,
    producedByPrivateDelayedRendererRootProducer:
      reactActPreflightReport.producedByPrivateDelayedRendererRootProducer,
    rendererRootSourceEvidencePresent:
      reactActPreflightReport.rendererRootSourceEvidencePresent,
    rendererRootSourceEvidenceOwned:
      reactActPreflightReport.rendererRootSourceEvidenceOwned,
    selectedFlushHelper: reactActPreflightReport.selectedFlushHelper,
    nestedExpiredActRootWorkConsumption: nestedExpiredConsumption,
    reactActNestedExpiredActRootWorkConsumption:
      reactActPreflightReport.nestedExpiredActRootWorkConsumption,
    rootWorkRecordSummary: reactActPreflightReport.rootWorkRecordSummary,
    actQueueDrainSummary: reactActPreflightReport.actQueueDrainSummary,
    delayedActRootWorkMetadata:
      reactActPreflightReport.delayedActRootWorkMetadata,
    delayedRendererRootMetadata:
      reactActPreflightReport.delayedRendererRootMetadata,
    expiredActRootWorkDrainReport:
      reactActPreflightReport.expiredActRootWorkDrainReport,
    delayedCallbackPromotionEvidence:
      reactActPreflightReport.delayedCallbackPromotionEvidence,
    schedulerMockDelayedActRootWorkDiagnosticsReady: true,
    preflightsSchedulerMockDelayedActRootWorkDiagnostics: true,
    acceptsSchedulerMockDelayedActRootWorkOnlyAsNestedExpiredDiagnostics:
      true,
    acceptsTopLevelDelayedActRootWorkAsPublicActEvidence: false,
    consumesNestedExpiredActRootWorkDiagnostics: true,
    consumesReactActPrivateDelayedSchedulerDiagnostics: true,
    consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
    drainsAcceptedSchedulerMockExpiredActRootWorkDiagnostics: true,
    consumesAcceptedExpiredActRootWorkRecords: true,
    drainsAcceptedInternalTestQueues: true,
    requiresSchedulerOwnedSourceProof: true,
    rejectsStaleDiagnostics: true,
    rejectsForeignRendererRootEvidence: true,
    rejectsTamperedDiagnostics: true,
    rejectsPublicClaims: true,
    privateRoutingReady: false,
    publicReactActReady: false,
    publicTestUtilsActReady: false,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicActExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    publicActPassiveDrain: false,
    schedulerDrivenPassiveExecution: false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    invokesPublicSchedulerFlushHelper: false,
    publicSchedulerFlushBehaviorExecuted: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesPassiveEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    compatibilityClaimed: false,
    reactActPreflightReport
  });
}

function isAcceptedReactSchedulerDrivenPassiveEffectConsumption(
  consumption
) {
  return (
    isObjectLike(consumption) &&
    Object.isFrozen(consumption) &&
    consumption.status ===
      reactActSchedulerDrivenPassiveEffectConsumptionStatus &&
    consumption.accepted === true &&
    consumption.consumesSchedulerMockExpiredActRootWorkDiagnostics ===
      true &&
    consumption.requiresSchedulerOwnedSourceProof === true &&
    consumption.requiresSourceOwnedPassiveEvidence === true &&
    consumption.linksRootCommitPassiveExecutionToActFlushDiagnostics ===
      true &&
    consumption.consumesRootCommitPassiveExecution === true &&
    consumption.consumesSchedulerPassiveFlushRequest === true &&
    consumption.consumesPendingPassiveHandoff === true &&
    consumption.privateSchedulerDrivenPassiveExecution === true &&
    consumption.didExecutePrivateCallbackExecutors === true &&
    consumption.schedulerDrivenPassiveExecution === false &&
    consumption.queueFlushingReady === false &&
    consumption.rendererRootsReady === false &&
    consumption.passiveEffectsReady === false &&
    consumption.continuationFlushingReady === false &&
    consumption.publicCompatibilityClaimed === false &&
    consumption.publicSchedulerTimingCompatibilityClaimed === false &&
    consumption.publicReactActCompatibilityClaimed === false &&
    consumption.publicRootSchedulerCompatibilityClaimed === false &&
    consumption.publicRendererCompatibilityClaimed === false &&
    consumption.drainsPublicSchedulerTaskQueue === false &&
    consumption.drainsPublicReactActQueue === false &&
    consumption.publicActPassiveDrain === false &&
    consumption.publicEffectExecution === false &&
    consumption.publicRootExecution === false &&
    consumption.executesQueuedWork === false &&
    consumption.executesEffects === false &&
    consumption.executesPassiveEffects === false &&
    consumption.executesRendererWork === false &&
    consumption.executesRendererRoots === false &&
    consumption.compatibilityClaimed === false
  );
}

function isAcceptedSchedulerDrivenPassiveEffectDiagnostics(diagnostics) {
  try {
    const reactGate = loadReactPrivateActDispatcherGate();
    return (
      typeof reactGate.isAcceptedSchedulerDrivenPassiveEffectDiagnostics ===
        'function' &&
      reactGate.isAcceptedSchedulerDrivenPassiveEffectDiagnostics(
        diagnostics
      ) === true
    );
  } catch (_error) {
    return false;
  }
}

function consumeSchedulerDrivenPassiveEffectDiagnostics(diagnostics) {
  const reactGate = loadReactPrivateActDispatcherGate();
  let reactActConsumptionReport;

  try {
    reactActConsumptionReport =
      reactGate.consumeSchedulerDrivenPassiveEffectDiagnostics(diagnostics);
  } catch (error) {
    throw createSchedulerDrivenPassiveEffectDiagnosticsGateError(
      getReactActSchedulerDrivenPassiveEffectRejectionReason(error)
    );
  }

  if (
    !isAcceptedReactSchedulerDrivenPassiveEffectConsumption(
      reactActConsumptionReport
    )
  ) {
    throw createSchedulerDrivenPassiveEffectDiagnosticsGateError(
      'react-act-private-scheduler-driven-passive-consumption-report'
    );
  }

  return freezeRecord({
    status: privateSchedulerDrivenPassiveEffectConsumptionStatus,
    accepted: true,
    gateId: privateSchedulerDrivenPassiveEffectDiagnosticGateId,
    diagnosticStatus: privateSchedulerDrivenPassiveEffectDiagnosticStatus,
    prerequisiteId: privateSchedulerDrivenPassiveEffectPrerequisiteId,
    workerIds: privateSchedulerDrivenPassiveEffectWorkerIds,
    reactActConsumptionStatus: reactActConsumptionReport.status,
    schedulerDrivenPassiveEffectDiagnosticsStatus:
      reactActConsumptionReport.schedulerDrivenPassiveEffectDiagnosticsStatus,
    schedulerDrivenPassiveEffectDiagnosticKind:
      reactActConsumptionReport.schedulerDrivenPassiveEffectDiagnosticKind,
    schedulerDrivenPassiveEffectDiagnosticVersion:
      reactActConsumptionReport.schedulerDrivenPassiveEffectDiagnosticVersion,
    schedulerMockExpiredActRootWorkConsumptionStatus:
      reactActConsumptionReport.schedulerMockExpiredActRootWorkConsumptionStatus,
    schedulerMockExpiredActRootWorkDiagnosticsStatus:
      reactActConsumptionReport.schedulerMockExpiredActRootWorkDiagnosticsStatus,
    schedulerMockExpiredActRootWorkDiagnosticKind:
      reactActConsumptionReport.schedulerMockExpiredActRootWorkDiagnosticKind,
    rootId: reactActConsumptionReport.rootId,
    rootLabel: reactActConsumptionReport.rootLabel,
    finishedWorkId: reactActConsumptionReport.finishedWorkId,
    lanes: reactActConsumptionReport.lanes,
    pendingUnmountCount: reactActConsumptionReport.pendingUnmountCount,
    pendingMountCount: reactActConsumptionReport.pendingMountCount,
    pendingRecordCount: reactActConsumptionReport.pendingRecordCount,
    rootCommitPassiveExecution:
      reactActConsumptionReport.rootCommitPassiveExecution,
    pendingPassiveHandoff: reactActConsumptionReport.pendingPassiveHandoff,
    schedulerRequest: reactActConsumptionReport.schedulerRequest,
    schedulerGate: reactActConsumptionReport.schedulerGate,
    schedulerExecution: reactActConsumptionReport.schedulerExecution,
    passiveEffects: reactActConsumptionReport.passiveEffects,
    consumesReactActPrivateSchedulerDrivenPassiveDiagnostics: true,
    consumesSchedulerMockExpiredActRootWorkDiagnostics: true,
    requiresSchedulerOwnedSourceProof: true,
    requiresSourceOwnedPassiveEvidence: true,
    linksRootCommitPassiveExecutionToActFlushDiagnostics: true,
    consumesRootCommitPassiveExecution: true,
    consumesSchedulerPassiveFlushRequest: true,
    consumesPendingPassiveHandoff: true,
    privateSchedulerDrivenPassiveExecution: true,
    didExecutePrivateCallbackExecutors: true,
    rejectsStaleDiagnostics: true,
    rejectsCrossRootDiagnostics: true,
    rejectsMissingSchedulerSourceProof: true,
    rejectsMissingPassiveOwnership: true,
    schedulerDrivenPassiveExecution: false,
    privateRoutingReady: false,
    publicReactActReady: false,
    publicTestUtilsActReady: false,
    queueFlushingReady: false,
    rendererRootsReady: false,
    passiveEffectsReady: false,
    continuationFlushingReady: false,
    publicActExecution: false,
    publicRootExecution: false,
    publicEffectExecution: false,
    publicActPassiveDrain: false,
    publicCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRendererCompatibilityClaimed: false,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesPassiveEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    compatibilityClaimed: false,
    reactActConsumptionReport
  });
}

function getReactActSchedulerMockExpiredActRootWorkRejectionReason(error) {
  if (isObjectLike(error) && typeof error.reason === 'string') {
    return error.reason;
  }

  return 'react-act-private-scheduler-expired-diagnostics';
}

function getReactActSchedulerMockDelayedActRootWorkRejectionReason(error) {
  if (isObjectLike(error) && typeof error.reason === 'string') {
    return error.reason;
  }

  return 'react-act-private-scheduler-delayed-diagnostics';
}

function getReactActSchedulerDrivenPassiveEffectRejectionReason(error) {
  if (isObjectLike(error) && typeof error.reason === 'string') {
    return error.reason;
  }

  return 'react-act-private-scheduler-driven-passive-diagnostics';
}

function createSchedulerMockExpiredActRootWorkDiagnosticsGateError(reason) {
  const error = createUnsupportedError(
    entrypoint,
    `${privateTestUtilsActGateExport}.consumeSchedulerMockExpiredActRootWorkDiagnostics`,
    'rejected Scheduler mock expired act/root work diagnostics',
    'Only React-owned private Scheduler mock expired act/root diagnostics can ' +
      'pass this package-private React DOM test-utils act route.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicRootSchedulerCompatibilityClaimed = false;
  error.publicRendererCompatibilityClaimed = false;
  error.drainsPublicSchedulerTaskQueue = false;
  error.drainsPublicReactActQueue = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  error.executesPassiveEffects = false;
  error.executesRendererWork = false;
  error.executesRendererRoots = false;
  return error;
}

function createSchedulerMockDelayedActRootWorkDiagnosticsGateError(reason) {
  const error = createUnsupportedError(
    entrypoint,
    `${privateTestUtilsActGateExport}.preflightSchedulerMockDelayedActRootWorkDiagnostics`,
    'rejected Scheduler mock delayed act/root work diagnostics',
    'Only React-owned private Scheduler mock delayed act/root diagnostics ' +
      'with nested expired act/root evidence can pass this package-private ' +
      'React DOM test-utils act route.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicRootSchedulerCompatibilityClaimed = false;
  error.publicRendererCompatibilityClaimed = false;
  error.drainsPublicSchedulerTaskQueue = false;
  error.drainsPublicReactActQueue = false;
  error.invokesPublicSchedulerFlushHelper = false;
  error.publicSchedulerFlushBehaviorExecuted = false;
  error.acceptsTopLevelDelayedActRootWorkAsPublicActEvidence = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  error.executesPassiveEffects = false;
  error.executesRendererWork = false;
  error.executesRendererRoots = false;
  return error;
}

function createSchedulerDrivenPassiveEffectDiagnosticsGateError(reason) {
  const error = createUnsupportedError(
    entrypoint,
    `${privateTestUtilsActGateExport}.consumeSchedulerDrivenPassiveEffectDiagnostics`,
    'rejected scheduler-driven passive effect diagnostics',
    'Only React-owned private scheduler-driven passive effect diagnostics linked to accepted Scheduler act/root evidence can pass this package-private React DOM test-utils act route.'
  );
  error.reason = reason;
  error.publicCompatibilityClaimed = false;
  error.publicSchedulerTimingCompatibilityClaimed = false;
  error.publicReactActCompatibilityClaimed = false;
  error.publicRootSchedulerCompatibilityClaimed = false;
  error.publicRendererCompatibilityClaimed = false;
  error.drainsPublicSchedulerTaskQueue = false;
  error.drainsPublicReactActQueue = false;
  error.publicActPassiveDrain = false;
  error.publicEffectExecution = false;
  error.publicRootExecution = false;
  error.executesQueuedWork = false;
  error.executesEffects = false;
  error.executesPassiveEffects = false;
  error.executesRendererWork = false;
  error.executesRendererRoots = false;
  return error;
}

function collectStaleAcceptedPrivatePrerequisites(prerequisites) {
  const prerequisitesById = new Map(
    prerequisites.map((prerequisite) => [prerequisite.id, prerequisite])
  );
  const stalePrerequisites = [];

  for (const requirement of privateSyncFlushRootHandoffEvidenceRequirements) {
    const prerequisite = prerequisitesById.get(requirement.id);
    if (!prerequisite) {
      continue;
    }

    const reasons = [];
    if (prerequisite.workerId !== requirement.workerId) {
      reasons.push('worker-id-mismatch');
    }
    if (prerequisite.status !== requirement.status) {
      reasons.push('status-mismatch');
    }
    if (prerequisite.source !== requirement.source) {
      reasons.push('source-mismatch');
    }
    for (const field of requirement.requiredTrueFields) {
      if (prerequisite[field] !== true) {
        reasons.push(`${field}-not-true`);
      }
    }
    for (const field of requirement.requiredFalseFields) {
      if (prerequisite[field] !== false) {
        reasons.push(`${field}-not-false`);
      }
    }

    if (reasons.length > 0) {
      stalePrerequisites.push(
        freezeRecord({
          prerequisiteId: requirement.id,
          reasons: freezeArray(reasons)
        })
      );
    }
  }

  const ledgerPrerequisite = prerequisitesById.get(
    privateReactActSchedulerDiagnosticsLedgerPrerequisiteId
  );
  if (ledgerPrerequisite) {
    const reasons =
      collectReactActSchedulerDiagnosticsLedgerStaleReasons(
        ledgerPrerequisite
      );
    if (reasons.length > 0) {
      stalePrerequisites.push(
        freezeRecord({
          prerequisiteId:
            privateReactActSchedulerDiagnosticsLedgerPrerequisiteId,
          reasons
        })
      );
    }
  }

  const delayedSchedulerPrerequisite = prerequisitesById.get(
    privateSchedulerMockDelayedActRootWorkPrerequisiteId
  );
  if (delayedSchedulerPrerequisite) {
    const reasons =
      collectSchedulerMockDelayedActRootWorkStaleReasons(
        delayedSchedulerPrerequisite
      );
    if (reasons.length > 0) {
      stalePrerequisites.push(
        freezeRecord({
          prerequisiteId:
            privateSchedulerMockDelayedActRootWorkPrerequisiteId,
          reasons
        })
      );
    }
  }

  return freezeArray(stalePrerequisites);
}

function collectAcceptedPrivatePrerequisitePublicClaims(prerequisites) {
  const claims = [];

  for (const prerequisite of prerequisites) {
    collectPrivatePrerequisitePublicClaimsFromRecord({
      claims,
      prerequisite,
      record: prerequisite,
      prefix: ''
    });
    if (isObjectLike(prerequisite.summary)) {
      collectPrivatePrerequisitePublicClaimsFromRecord({
        claims,
        prerequisite,
        record: prerequisite.summary,
        prefix: 'summary.'
      });
    }
  }

  return freezeArray(claims);
}

function collectSchedulerMockDelayedActRootWorkStaleReasons(prerequisite) {
  const reasons = collectSchedulerMockDelayedActRootWorkRecordReasons({
    record: prerequisite,
    prefix: '',
    validatePrerequisiteRow: true
  });

  if (!isObjectLike(prerequisite.summary)) {
    reasons.push('summary-missing');
  } else {
    reasons.push(
      ...collectSchedulerMockDelayedActRootWorkRecordReasons({
        record: prerequisite.summary,
        prefix: 'summary.',
        validatePrerequisiteRow: false
      })
    );
  }

  return freezeArray(reasons);
}

function collectSchedulerMockDelayedActRootWorkRecordReasons({
  record,
  prefix,
  validatePrerequisiteRow
}) {
  const reasons = [];

  if (record.workerId !== privateSchedulerMockDelayedActRootWorkWorkerId) {
    reasons.push(`${prefix}worker-id-mismatch`);
  }
  if (
    record.status !== privateSchedulerMockDelayedActRootWorkDiagnosticStatus
  ) {
    reasons.push(`${prefix}status-mismatch`);
  }
  if (
    record.gateId !== privateSchedulerMockDelayedActRootWorkDiagnosticGateId
  ) {
    reasons.push(`${prefix}gate-id-mismatch`);
  }
  if (
    record.prerequisiteId !==
    privateSchedulerMockDelayedActRootWorkPrerequisiteId
  ) {
    reasons.push(`${prefix}prerequisite-id-mismatch`);
  }
  if (
    record.reactActPreflightStatus !==
    reactActSchedulerMockDelayedActRootWorkPreflightStatus
  ) {
    reasons.push(`${prefix}react-act-preflight-status-mismatch`);
  }

  if (validatePrerequisiteRow) {
    if (record.source !== privateSchedulerMockDelayedActRootWorkSource) {
      reasons.push(`${prefix}source-mismatch`);
    }
    if (record.recordOnly !== false) {
      reasons.push(`${prefix}recordOnly-not-false`);
    }
    if (record.privateDiagnostic !== true) {
      reasons.push(`${prefix}privateDiagnostic-not-true`);
    }
    if (
      record.diagnosticGateId !==
      privateSchedulerMockDelayedActRootWorkDiagnosticGateId
    ) {
      reasons.push(`${prefix}diagnostic-gate-id-mismatch`);
    }
    if (
      record.diagnosticStatus !==
      privateSchedulerMockDelayedActRootWorkDiagnosticStatus
    ) {
      reasons.push(`${prefix}diagnostic-status-mismatch`);
    }
    if (
      !sameStringArray(
        record.records,
        privateSchedulerMockDelayedActRootWorkRecords
      )
    ) {
      reasons.push(`${prefix}records-mismatch`);
    }
    if (
      !sameStringArray(
        record.evidence,
        privateSchedulerMockDelayedActRootWorkEvidence
      )
    ) {
      reasons.push(`${prefix}evidence-mismatch`);
    }
  }

  for (const field of privateSchedulerMockDelayedActRootWorkRequiredTrueFields) {
    if (record[field] !== true) {
      reasons.push(`${prefix}${field}-not-true`);
    }
  }
  for (const field of privateSchedulerMockDelayedActRootWorkRequiredFalseFields) {
    if (record[field] !== false) {
      reasons.push(`${prefix}${field}-not-false`);
    }
  }

  return reasons;
}

function collectReactActSchedulerDiagnosticsLedgerStaleReasons(prerequisite) {
  const reasons = collectReactActSchedulerDiagnosticsLedgerRecordReasons({
    record: prerequisite,
    prefix: '',
    validateDiagnosticAliases: true
  });

  if (!isObjectLike(prerequisite.summary)) {
    reasons.push('summary-missing');
  } else {
    reasons.push(
      ...collectReactActSchedulerDiagnosticsLedgerRecordReasons({
        record: prerequisite.summary,
        prefix: 'summary.',
        validateDiagnosticAliases: false
      })
    );
  }

  return freezeArray(reasons);
}

function collectReactActSchedulerDiagnosticsLedgerRecordReasons({
  record,
  prefix,
  validateDiagnosticAliases
}) {
  const reasons = [];
  if (record.workerId !== privateReactActSchedulerDiagnosticsLedgerWorkerId) {
    reasons.push(`${prefix}worker-id-mismatch`);
  }
  if (record.status !== privateReactActSchedulerDiagnosticsLedgerStatus) {
    reasons.push(`${prefix}status-mismatch`);
  }
  if (record.source !== privateReactActSchedulerDiagnosticsLedgerSource) {
    reasons.push(`${prefix}source-mismatch`);
  }
  if (record.gateId !== privateReactActSchedulerDiagnosticsLedgerGateId) {
    reasons.push(`${prefix}gate-id-mismatch`);
  }
  if (
    validateDiagnosticAliases &&
    record.diagnosticGateId !== privateReactActSchedulerDiagnosticsLedgerGateId
  ) {
    reasons.push(`${prefix}diagnostic-gate-id-mismatch`);
  }
  if (
    validateDiagnosticAliases &&
    record.diagnosticStatus !== privateReactActSchedulerDiagnosticsLedgerStatus
  ) {
    reasons.push(`${prefix}diagnostic-status-mismatch`);
  }
  if (
    record.workerCount !==
    privateReactActSchedulerDiagnosticsLedgerWorkerIds.length
  ) {
    reasons.push(`${prefix}worker-count-mismatch`);
  }
  if (
    !sameStringArray(
      record.workerIds,
      privateReactActSchedulerDiagnosticsLedgerWorkerIds
    )
  ) {
    reasons.push(`${prefix}worker-ids-mismatch`);
  }
  if (
    !sameStringArray(
      record.evidenceKinds,
      privateReactActSchedulerDiagnosticsLedgerEvidenceKinds
    )
  ) {
    reasons.push(`${prefix}evidence-kinds-mismatch`);
  }
  if (
    !sameStringArray(
      record.delayedRendererRootEvidenceScopes,
      privateReactActSchedulerDiagnosticsLedgerRendererRootScopes
    )
  ) {
    reasons.push(`${prefix}delayed-renderer-root-scopes-mismatch`);
  }
  for (const field of privateReactActSchedulerDiagnosticsLedgerRequiredTrueFields) {
    if (record[field] !== true) {
      reasons.push(`${prefix}${field}-not-true`);
    }
  }
  for (const field of privateReactActSchedulerDiagnosticsLedgerRequiredFalseFields) {
    if (record[field] !== false) {
      reasons.push(`${prefix}${field}-not-false`);
    }
  }

  const requirements = record.requirements;
  collectReactActSchedulerDiagnosticsLedgerRequirementsReasons(
    reasons,
    requirements,
    `${prefix}requirements`
  );

  const publicBlockerClaims = record.publicBlockerClaims;
  collectReactActSchedulerDiagnosticsLedgerPublicBlockerReasons(
    reasons,
    publicBlockerClaims,
    `${prefix}publicBlockerClaims`
  );

  return reasons;
}

function collectReactActSchedulerDiagnosticsLedgerRequirementsReasons(
  reasons,
  requirements,
  label
) {
  if (!isObjectLike(requirements)) {
    reasons.push(`${label}-missing`);
    return;
  }
  if (
    !sameStringSet(
      Object.keys(requirements),
      privateReactActSchedulerDiagnosticsLedgerRequirementFields
    )
  ) {
    reasons.push(`${label}-field-mismatch`);
  }
  for (const field of privateReactActSchedulerDiagnosticsLedgerRequirementFields) {
    if (
      requirements[field] !==
      privateReactActSchedulerDiagnosticsLedgerRequirements[field]
    ) {
      reasons.push(`${label}.${field}-mismatch`);
    }
  }
}

function collectReactActSchedulerDiagnosticsLedgerPublicBlockerReasons(
  reasons,
  publicBlockerClaims,
  label
) {
  if (!isObjectLike(publicBlockerClaims)) {
    reasons.push(`${label}-missing`);
    return;
  }
  if (
    !sameStringSet(
      Object.keys(publicBlockerClaims),
      privateReactActSchedulerDiagnosticsLedgerPublicBlockerFields
    )
  ) {
    reasons.push(`${label}-field-mismatch`);
  }
  for (const field of privateReactActSchedulerDiagnosticsLedgerPublicBlockerFields) {
    if (publicBlockerClaims[field] !== false) {
      reasons.push(`${label}.${field}-not-false`);
    }
  }
}

function collectPrivatePrerequisitePublicClaimsFromRecord({
  claims,
  prerequisite,
  record,
  prefix
}) {
  for (const field of acceptedPrivatePrerequisitePublicClaimFields) {
    if (record[field] === true) {
      claims.push(
        freezeRecord({
          prerequisiteId: prerequisite.id,
          field: `${prefix}${field}`
        })
      );
    }
  }
  if (isObjectLike(record.publicBlockerClaims)) {
    for (const field of privateReactActSchedulerDiagnosticsLedgerPublicBlockerFields) {
      if (record.publicBlockerClaims[field] === true) {
        claims.push(
          freezeRecord({
            prerequisiteId: prerequisite.id,
            field: `${prefix}publicBlockerClaims.${field}`
          })
        );
      }
    }
  }
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

function isObjectLike(value) {
  return (
    (typeof value === 'object' && value !== null) ||
    typeof value === 'function'
  );
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function falseRecord(fields) {
  return freezeRecord(
    Object.fromEntries(fields.map((field) => [field, false]))
  );
}

function freezeArray(array) {
  return Object.freeze(array.slice());
}

function freezeRecords(records) {
  return freezeArray(records.map((record) => freezeRecord(record)));
}

function sameStringArray(actual, expected) {
  return (
    Array.isArray(actual) &&
    Array.isArray(expected) &&
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function sameStringSet(actual, expected) {
  if (!Array.isArray(actual) || !Array.isArray(expected)) {
    return false;
  }
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  return (
    actualSet.size === expectedSet.size &&
    actualSet.size === actual.length &&
    expectedSet.size === expected.length &&
    actual.every((value) => expectedSet.has(value))
  );
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
  consumeSchedulerDrivenPassiveEffectDiagnostics,
  consumeSchedulerMockExpiredActRootWorkDiagnostics,
  entrypoint,
  evaluateReactDomTestUtilsActPrivateRoutingGate,
  getReactDomTestUtilsActPrivateRoutingGate,
  isAcceptedSchedulerDrivenPassiveEffectDiagnostics,
  isAcceptedSchedulerMockDelayedActRootWorkDiagnostics,
  isAcceptedSchedulerMockExpiredActRootWorkDiagnostics,
  passiveEffectDeletedSubtreeRefPassiveOrderingStatus,
  preflightSchedulerMockDelayedActRootWorkDiagnostics,
  privateReactActSchedulerDiagnosticsLedgerGateId,
  privateReactActSchedulerDiagnosticsLedgerPrerequisiteId,
  privateReactActSchedulerDiagnosticsLedgerStatus,
  privateReactActSchedulerDiagnosticsLedgerSummary,
  privateReactActSchedulerDiagnosticsLedgerWorkerId,
  privateReactActSchedulerDiagnosticsLedgerWorkerIds,
  privateSchedulerMockDelayedActRootWorkDiagnosticGateId,
  privateSchedulerMockDelayedActRootWorkDiagnosticStatus,
  privateSchedulerMockDelayedActRootWorkPreflightStatus,
  privateSchedulerMockDelayedActRootWorkPrerequisiteId,
  privateSchedulerMockExpiredActRootWorkConsumptionStatus,
  privateSchedulerMockExpiredActRootWorkDiagnosticGateId,
  privateSchedulerMockExpiredActRootWorkDiagnosticStatus,
  privateSchedulerMockExpiredActRootWorkPrerequisiteId,
  privateSchedulerDrivenPassiveEffectConsumptionStatus,
  privateSchedulerDrivenPassiveEffectDiagnosticGateId,
  privateSchedulerDrivenPassiveEffectDiagnosticStatus,
  privateSchedulerDrivenPassiveEffectPrerequisiteId,
  privateRoutingGateId,
  privateRoutingGateStatus,
  privateTestUtilsActGateExport,
  publicActStatus,
  sideEffectPolicy
};
