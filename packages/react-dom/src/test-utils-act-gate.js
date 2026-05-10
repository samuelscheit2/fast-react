'use strict';

const {
  compatibilityTarget,
  createUnsupportedFunction
} = require('../placeholder-utils.js');

const entrypoint = 'react-dom/test-utils';

const privateRoutingGateId =
  'react-dom-test-utils-act-private-routing-gate-2';
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
  'private-sync-flush-post-passive-continuation-execution-gate-record-only';
const schedulerMockFlushHelperStatus =
  'accepted-scheduler-mock-flush-helper-metadata';
const passiveEffectsFlushMetadataStatus =
  'metadata-only-passive-flush-without-callback-execution';
const passiveEffectCallbackHandleStatus =
  'data-only-passive-effect-callback-handles-without-invocation';

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
const rootBridgeRequestRecords = freezeArray([
  'FastReactDomPrivateRootCreateRecord',
  'FastReactDomPrivateRootUpdateRecord',
  'FastReactDomPrivateRootAdmissionRecord',
  'FastReactDomPrivateRootNativeRequestHandoffRecord'
]);
const syncFlushContinuationRecords = freezeArray([
  'SchedulerActContinuationRecord',
  'SyncFlushActPostPassiveContinuationGateRecord',
  'SyncFlushRootRecord.act_continuation',
  'SyncFlushRootRecord.act_post_passive_continuation_gate'
]);
const syncFlushPostPassiveContinuationExecutionRecords = freezeArray([
  'SyncFlushPostPassiveContinuationExecutionGateRecord',
  'SyncFlushPostPassiveContinuationRootRecord',
  'sync_flush_post_passive_continuation_execution_gate',
  'observe_sync_flush_post_passive_continuation_execution_gate_after_commit',
  'SyncFlushRootRecord.post_passive_continuation_execution_gate'
]);
const passiveEffectsFlushRecords = freezeArray([
  'PendingPassiveCommitHandoff',
  'PassiveEffectsFlushResult',
  'PassiveEffectFlushRecord',
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
const passiveEffectCallbackPhaseRules = freezeArray([
  'unmount-phase-carries-destroy-handle-without-create-handle',
  'mount-phase-carries-create-handle-without-destroy-handle',
  'callback-invoked-accessors-return-false'
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
    executesScheduledCallbacks: false,
    helpers: schedulerMockFlushHelpers
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
    recordOnly: true,
    observesPendingPassiveHandoff: true,
    collectsContinuationRoots: true,
    consumesPendingPassive: false,
    rendersContinuationRoots: false,
    commitsContinuationRoots: false,
    executesSyncFlush: false,
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
    recordOnly: true,
    carriesCreateCallbackHandles: true,
    carriesDestroyCallbackHandles: true,
    invokesCreateCallbacks: false,
    invokesDestroyCallbacks: false,
    effectCallbackExecutionReady: false,
    records: passiveEffectCallbackHandleRecords,
    phaseRules: passiveEffectCallbackPhaseRules
  },
  {
    id: 'react-dom-private-root-bridge-records',
    present: true,
    status: rootBridgeRecordOnlyStatus,
    source: 'packages/react-dom/src/client/root-bridge.js',
    recordOnly: true,
    executesRendererRoots: false,
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
      'Accepted act queue records do not drain queued work or scheduler continuations.'
  },
  {
    id: 'passive-effect-callback-execution',
    present: false,
    requiredBeforePublicAct: true,
    reason:
      'Passive effect flush records now carry create and destroy callback handles, but callback invocation remains explicitly false.'
  },
  {
    id: 'public-react-dom-root-execution',
    present: false,
    requiredBeforePublicAct: true,
    reason:
      'Public React DOM roots still throw placeholders instead of routing create, render, or unmount work.'
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
    acceptedPrivatePrerequisiteIds: acceptedPrivatePrerequisites.map(
      (prerequisite) => prerequisite.id
    ),
    blockedPublicPrerequisiteIds: blockedPublicPrerequisites.map(
      (prerequisite) => prerequisite.id
    ),
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
      consumesPendingPassive: false,
      rendersContinuationRoots: false,
      commitsContinuationRoots: false,
      executesSyncFlush: false,
      executesPassiveEffects: false,
      invokesCallbacks: false
    }),
    passiveEffects: freezeRecord({
      status: passiveEffectsFlushMetadataStatus,
      records: passiveEffectsFlushRecords,
      consumesPendingPassiveMetadata: true,
      discoversCommittedFiberEffects: false,
      executesPassiveEffects: false,
      invokesCreateCallbacks: false,
      invokesDestroyCallbacks: false
    }),
    passiveEffectCallbackHandles: freezeRecord({
      status: passiveEffectCallbackHandleStatus,
      records: passiveEffectCallbackHandleRecords,
      phaseRules: passiveEffectCallbackPhaseRules,
      carriesCreateCallbackHandles: true,
      carriesDestroyCallbackHandles: true,
      invokesCreateCallbacks: false,
      invokesDestroyCallbacks: false,
      effectCallbackExecutionReady: false
    }),
    reactDomRootBridge: freezeRecord({
      status: rootBridgeRecordOnlyStatus,
      records: rootBridgeRequestRecords,
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

  return freezeRecord({
    ...gate,
    publicCompatibilityClaimed,
    publicReactActReady,
    publicTestUtilsActReady,
    privateRoutingReady,
    privatePrerequisitesPresent: missingPrivatePrerequisites.length === 0,
    publicPrerequisitesStillBlocked,
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
