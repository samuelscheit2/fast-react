'use strict';

const {
  compatibilityTarget,
  createUnsupportedFunction
} = require('../placeholder-utils.js');

const entrypoint = 'react-dom/test-utils';

const privateRoutingGateId =
  'react-dom-test-utils-act-private-routing-gate-3';
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
const privateRootHostOutputDiagnosticGateId =
  'root-render-private-host-output-diagnostic-gate-1';
const privateRootHostOutputDiagnosticStatus =
  'accepted-private-root-host-output-diagnostic-without-public-root-execution';
const privateRootHostOutputBlockedDiagnosticStatus =
  'blocked-private-root-host-output-diagnostic';
const privateRootHostOutputPublicPrerequisiteStatus =
  'blocked-accepted-private-root-host-output-until-public-root-execution';

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
  'render-after-unmount'
]);
const privateRootHostOutputBlockedScenarios = freezeArray([
  'flush-sync-cross-root-render',
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
  'private-render-after-unmount-guard-no-extra-mutation'
]);
const privateRootHostOutputDiagnosticSummary = freezeRecord({
  admittedScenarioIds: privateRootHostOutputDiagnosticScenarios,
  blockedScenarioIds: privateRootHostOutputBlockedScenarios,
  admittedScenarioModeRowCount: 16,
  blockedScenarioModeRowCount: 4,
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
    fakeDomHostOutputOnly: true,
    publicRootExecution: false,
    publicDomMutation: false,
    records: rootBridgeRequestRecords
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
    reason:
      'Passive create and destroy callbacks can run only through explicit private test controls; scheduler-driven passive execution and public act integration remain disabled.'
  },
  {
    id: 'public-react-dom-root-execution',
    present: false,
    requiredBeforePublicAct: true,
    blockedByAcceptedPrivateRootHostOutputDiagnostics: true,
    privateHostOutputDiagnosticGateId:
      privateRootHostOutputDiagnosticGateId,
    privateHostOutputDiagnosticStatus: privateRootHostOutputDiagnosticStatus,
    acceptedPrivateHostOutputDiagnosticScenarios:
      privateRootHostOutputDiagnosticScenarios,
    unsupportedPrivateHostOutputDiagnosticScenarios:
      privateRootHostOutputBlockedScenarios,
    acceptedPrivateHostOutputScenarioModeRowCount: 16,
    unsupportedPrivateHostOutputScenarioModeRowCount: 4,
    reason:
      'Private fake-DOM host-output diagnostics exist, but public React DOM roots still throw placeholders instead of routing create, render, update, or unmount work.'
  },
  {
    id: 'public-react-dom-flush-sync-execution',
    present: false,
    requiredBeforePublicAct: true,
    reason:
      'Public React DOM flushSync remains an unsupported placeholder even though private sync-flush metadata exists.'
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
    acceptedPrivatePrerequisiteIds: acceptedPrivatePrerequisites.map(
      (prerequisite) => prerequisite.id
    ),
    blockedPublicPrerequisiteIds: blockedPublicPrerequisites.map(
      (prerequisite) => prerequisite.id
    ),
    blockedPrivateRootHostOutputPrerequisiteIds:
      privateRootHostOutputBlockedPrerequisiteIds,
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
      nativeExecution: false,
      reconcilerExecution: false,
      domMutation: false,
      markerWrites: false,
      listenerInstallation: false,
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

  return freezeRecord({
    ...gate,
    publicCompatibilityClaimed,
    publicReactActReady,
    publicTestUtilsActReady,
    privateRoutingReady,
    privatePrerequisitesPresent: missingPrivatePrerequisites.length === 0,
    publicPrerequisitesStillBlocked,
    privateRootHostOutputPrerequisitesStillBlocked,
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
  blockedPrivateRootHostOutputPrerequisites:
    privateRootHostOutputBlockedPrerequisites,
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
