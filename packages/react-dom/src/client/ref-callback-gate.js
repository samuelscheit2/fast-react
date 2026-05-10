'use strict';

const componentTree = require('./component-tree.js');

const REF_CALLBACK_COMPONENT_TREE_GATE_STATUS =
  'blocked-until-ref-callback-execution-boundary';
const REF_CALLBACK_ATTACH_DETACH_GATE_STATUS =
  'blocked-until-ref-callback-attach-detach-execution';
const REF_CALLBACK_CONTROLLED_INVOCATION_GATE_STATUS =
  'private-controlled-ref-callback-invocation-recorded';
const REF_CALLBACK_EXECUTION_HANDOFF_STATUS =
  'private-root-commit-ref-callback-execution-handoff-recorded';
const REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_STATUS =
  'private-ref-callback-host-output-ordering-diagnostic-recorded';
const REF_CALLBACK_ROOT_COMMIT_METADATA_SNAPSHOT_STATUS =
  'accepted-private-root-commit-ref-metadata-snapshot';
const REF_CALLBACK_CLEANUP_RETURN_HANDLE_STATUS =
  'recorded-private-ref-callback-cleanup-return-handle';
const REF_CALLBACK_ERROR_PROPAGATION_STATUS =
  'blocked-until-root-error-routing';
const REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS =
  'blocked-until-public-root-ref-commit-integration';
const REF_ACTION_ATTACH = 'attach';
const REF_ACTION_DETACH = 'detach';
const REF_DETACH_REASON_DELETED = 'deleted';
const REF_DETACH_REASON_REF_CHANGED = 'ref-changed';
const REF_KIND_CALLBACK = 'callback';
const REF_KIND_OBJECT = 'object';
const REF_OPERATION_CALLBACK_ATTACH =
  'invoke-callback-ref-with-host-instance';
const REF_OPERATION_CALLBACK_DETACH =
  'invoke-callback-ref-with-null-or-cleanup';
const REF_OPERATION_OBJECT_ATTACH =
  'set-object-ref-current-to-host-instance';
const REF_OPERATION_OBJECT_DETACH = 'clear-object-ref-current-to-null';
const REF_CALLBACK_INVOCATION_ATTACH = 'callback-attach';
const REF_CALLBACK_INVOCATION_NULL_DETACH = 'callback-null-detach';
const REF_CALLBACK_INVOCATION_CLEANUP_RETURN = 'callback-cleanup-return';
const REF_CALLBACK_INVOCATION_SKIPPED_OBJECT_REF =
  'object-ref-not-invoked';
const REF_CALLBACK_INVOCATION_STATUS_OK = 'ok';
const REF_CALLBACK_INVOCATION_STATUS_THROWN = 'threw';
const REF_CALLBACK_INVOCATION_STATUS_SKIPPED = 'skipped';
const REF_CALLBACK_RETURN_CLEANUP = 'cleanup-function';
const REF_CALLBACK_RETURN_VALUE = 'non-function-value';
const REF_CALLBACK_RETURN_VOID = 'void';
const REF_CALLBACK_RETURN_NOT_APPLICABLE = 'not-applicable';
const REF_CLEANUP_SOURCE_DIRECT_FUNCTION = 'direct-function';
const REF_CLEANUP_SOURCE_HANDLE = 'cleanup-return-handle';
const REF_CLEANUP_SOURCE_NONE = 'none';
const REF_TOKEN_PHASE_COMMIT = 'commit';
const REF_TOKEN_PHASE_DELETION = 'deletion';
const REF_TOKEN_TARGET_INSTANCE = 'instance';

const privateDomRefCallbackMetadataRecordType =
  'fast.react_dom.private_ref_callback_metadata_record';
const privateDomRefCallbackRootCommitMetadataSnapshotType =
  'fast.react_dom.private_ref_callback_root_commit_metadata_snapshot';
const privateDomRefCallbackComponentTreeGateSnapshotType =
  'fast.react_dom.private_ref_callback_component_tree_gate_snapshot';
const privateDomRefCallbackComponentTreeGateRecordType =
  'fast.react_dom.private_ref_callback_component_tree_gate_record';
const privateDomRefCallbackAttachDetachGateSnapshotType =
  'fast.react_dom.private_ref_callback_attach_detach_gate_snapshot';
const privateDomRefCallbackAttachDetachGateRecordType =
  'fast.react_dom.private_ref_callback_attach_detach_gate_record';
const privateDomRefCallbackControlledInvocationGateSnapshotType =
  'fast.react_dom.private_ref_callback_controlled_invocation_gate_snapshot';
const privateDomRefCallbackControlledInvocationGateRecordType =
  'fast.react_dom.private_ref_callback_controlled_invocation_gate_record';
const privateDomRefCallbackExecutionHandoffRecordType =
  'fast.react_dom.private_ref_callback_execution_handoff_record';
const privateDomRefCallbackHostOutputOrderingDiagnosticSnapshotType =
  'fast.react_dom.private_ref_callback_host_output_ordering_diagnostic_snapshot';
const privateDomRefCallbackHostOutputOrderingDiagnosticRecordType =
  'fast.react_dom.private_ref_callback_host_output_ordering_diagnostic_record';
const privateDomRefCallbackCleanupReturnHandleType =
  'fast.react_dom.private_ref_callback_cleanup_return_handle';

const blockedCapabilities = freezeArray([
  blockedCapability(
    'callback-ref-invocation',
    'Callback refs require a rooted JS callback trampoline before execution.'
  ),
  blockedCapability(
    'object-ref-mutation',
    'Object ref writes require a ref store and commit-phase mutation boundary.'
  ),
  blockedCapability(
    'layout-effect-execution',
    'Ref attach ordering must stay separate from layout effect execution.'
  ),
  blockedCapability(
    'dom-mutation',
    'The component-tree gate validates existing private maps only.'
  ),
  blockedCapability(
    'public-root-integration',
    'Public React DOM roots remain placeholder-gated and do not route refs.'
  ),
  blockedCapability(
    'root-error-propagation',
    'Ref callback errors require root error callback routing before reporting.'
  ),
  blockedCapability(
    'react-dom-ref-compatibility-claim',
    'React DOM ref compatibility is not claimed by this private gate.'
  )
]);

const controlledInvocationBlockedCapabilities = freezeArray([
  blockedCapability(
    'object-ref-mutation',
    'Object ref writes require a ref store and commit-phase mutation boundary.'
  ),
  blockedCapability(
    'layout-effect-execution',
    'Ref attach ordering must stay separate from layout effect execution.'
  ),
  blockedCapability(
    'dom-mutation',
    'Controlled callback attempts receive fake host nodes, not mounted DOM nodes.'
  ),
  blockedCapability(
    'public-root-integration',
    'Public React DOM roots remain placeholder-gated and do not route refs.'
  ),
  blockedCapability(
    'root-error-propagation',
    'Ref callback errors require root error callback routing before reporting.'
  ),
  blockedCapability(
    'react-dom-ref-compatibility-claim',
    'React DOM ref compatibility is not claimed by this private gate.'
  )
]);

const noSideEffects = freezeRecord({
  callbackRefsInvoked: false,
  objectRefsMutated: false,
  layoutEffectsRun: false,
  domMutated: false,
  publicRootsTouched: false,
  rootErrorsReported: false,
  compatibilityClaimed: false
});

const blockedErrorPropagation = freezeRecord({
  status: REF_CALLBACK_ERROR_PROPAGATION_STATUS,
  willReportRootErrors: false,
  reason: 'Root error callback routing is not connected to this private gate.'
});

const blockedPublicRefCompatibility = freezeRecord({
  status: REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS,
  publicRootsTouched: false,
  compatibilityClaimed: false,
  reason:
    'Controlled private callback attempts are not wired to public React DOM roots.'
});

const attachDetachOrdering = freezeRecord({
  source: 'root-commit-ref-metadata',
  deterministic: true,
  detachRecordsBeforeAttachRecords: true
});

const metadataRecordPayloads = new WeakMap();
const rootCommitMetadataSnapshotPayloads = new WeakMap();
const gateSnapshotPayloads = new WeakMap();
const gateRecordPayloads = new WeakMap();
const attachDetachGateSnapshotPayloads = new WeakMap();
const attachDetachGateRecordPayloads = new WeakMap();
const controlledInvocationGateSnapshotPayloads = new WeakMap();
const controlledInvocationGateRecordPayloads = new WeakMap();
const executionHandoffRecordPayloads = new WeakMap();
const hostOutputOrderingDiagnosticSnapshotPayloads = new WeakMap();
const hostOutputOrderingDiagnosticRecordPayloads = new WeakMap();
const cleanupReturnHandlePayloads = new WeakMap();
const cleanupReturnHandlesByRefHandle = new Map();
const consumedCleanupReturnHandles = new WeakSet();

let nextCleanupReturnHandleSequence = 1;

function createRefAttachMetadataRecord(options) {
  return createRefCallbackMetadataRecord({
    ...assertOptionsObject(options, 'attach metadata'),
    action: REF_ACTION_ATTACH,
    detachReason: null
  });
}

function createRefDetachMetadataRecord(options) {
  const normalizedOptions = assertOptionsObject(options, 'detach metadata');
  return createRefCallbackMetadataRecord({
    ...normalizedOptions,
    action: REF_ACTION_DETACH,
    detachReason: normalizeDetachReason(normalizedOptions.detachReason)
  });
}

function createRefCallbackRootCommitMetadataSnapshot(snapshot) {
  const metadata = normalizeRootCommitRefMetadataSnapshot(snapshot);
  const rootCommitSnapshot = freezeRecord({
    $$typeof: privateDomRefCallbackRootCommitMetadataSnapshotType,
    kind: 'FastReactDomPrivateRefCallbackRootCommitMetadataSnapshot',
    status: REF_CALLBACK_ROOT_COMMIT_METADATA_SNAPSHOT_STATUS,
    recordCount: metadata.detach.length + metadata.attach.length,
    detachCount: metadata.detach.length,
    attachCount: metadata.attach.length,
    ordering: attachDetachOrdering,
    exposesRefValue: false,
    exposesRefCleanup: false,
    exposesHostNode: false,
    exposesLatestProps: false
  });

  rootCommitMetadataSnapshotPayloads.set(
    rootCommitSnapshot,
    freezeRecord({
      attach: freezeArray(metadata.attach.slice()),
      detach: freezeArray(metadata.detach.slice())
    })
  );

  return rootCommitSnapshot;
}

function createRefCallbackComponentTreeGateSnapshot(snapshot) {
  const metadata = normalizeMetadataSnapshot(snapshot);
  const validatedRecords = validateMetadataSnapshotAgainstComponentTree(
    metadata
  );

  const records = freezeArray(
    validatedRecords.map(({payload, componentTreeRecord}, sequence) =>
      createGateRecord(sequence, payload, componentTreeRecord)
    )
  );

  const gateSnapshot = freezeRecord({
    $$typeof: privateDomRefCallbackComponentTreeGateSnapshotType,
    kind: 'FastReactDomPrivateRefCallbackComponentTreeGateSnapshot',
    status: REF_CALLBACK_COMPONENT_TREE_GATE_STATUS,
    recordCount: records.length,
    detachCount: metadata.detach.length,
    attachCount: metadata.attach.length,
    records,
    blockedCapabilities,
    sideEffects: noSideEffects,
    callbackRefsInvoked: false,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    compatibilityClaimed: false
  });

  gateSnapshotPayloads.set(
    gateSnapshot,
    freezeRecord({
      detach: metadata.detach,
      attach: metadata.attach,
      records: validatedRecords
    })
  );

  return gateSnapshot;
}

function createRefCallbackAttachDetachGateSnapshot(snapshot) {
  const metadata = normalizeRootCommitRefMetadataSnapshot(snapshot);
  const validatedRecords = validateMetadataSnapshotAgainstComponentTree(
    metadata
  );
  const records = freezeArray(
    validatedRecords.map((validatedRecord, sequence) =>
      createAttachDetachGateRecord(sequence, validatedRecord)
    )
  );

  let callbackRefRecordCount = 0;
  let objectRefRecordCount = 0;
  for (const record of records) {
    if (record.refKind === REF_KIND_CALLBACK) {
      callbackRefRecordCount++;
    } else if (record.refKind === REF_KIND_OBJECT) {
      objectRefRecordCount++;
    }
  }

  const gateSnapshot = freezeRecord({
    $$typeof: privateDomRefCallbackAttachDetachGateSnapshotType,
    kind: 'FastReactDomPrivateRefCallbackAttachDetachGateSnapshot',
    status: REF_CALLBACK_ATTACH_DETACH_GATE_STATUS,
    recordCount: records.length,
    detachCount: metadata.detach.length,
    attachCount: metadata.attach.length,
    callbackRefRecordCount,
    objectRefRecordCount,
    records,
    ordering: attachDetachOrdering,
    errorPropagation: blockedErrorPropagation,
    errorPropagationStatus: REF_CALLBACK_ERROR_PROPAGATION_STATUS,
    blockedCapabilities,
    sideEffects: noSideEffects,
    callbackRefsInvoked: false,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    rootErrorsReported: false,
    compatibilityClaimed: false
  });

  attachDetachGateSnapshotPayloads.set(
    gateSnapshot,
    freezeRecord({
      detach: metadata.detach,
      attach: metadata.attach,
      records: validatedRecords
    })
  );

  return gateSnapshot;
}

function createRefCallbackControlledInvocationGateSnapshot(snapshot) {
  const metadata = normalizeRootCommitRefMetadataSnapshot(snapshot);
  const validatedRecords = validateMetadataSnapshotAgainstComponentTree(
    metadata
  );
  const invocationResults = validatedRecords.map((validatedRecord, sequence) =>
    createControlledInvocationGateRecord(sequence, validatedRecord)
  );
  const records = freezeArray(
    invocationResults.map((invocationResult) => invocationResult.record)
  );
  const metrics = summarizeControlledInvocationResults(invocationResults);

  const gateSnapshot = freezeRecord({
    $$typeof: privateDomRefCallbackControlledInvocationGateSnapshotType,
    kind: 'FastReactDomPrivateRefCallbackControlledInvocationGateSnapshot',
    status: REF_CALLBACK_CONTROLLED_INVOCATION_GATE_STATUS,
    recordCount: records.length,
    detachCount: metadata.detach.length,
    attachCount: metadata.attach.length,
    callbackRefRecordCount: metrics.callbackRefRecordCount,
    objectRefRecordCount: metrics.objectRefRecordCount,
    callbackInvocationAttemptCount: metrics.callbackInvocationAttemptCount,
    callbackInvocationErrorCount: metrics.callbackInvocationErrorCount,
    callbackCleanupReturnCount: metrics.callbackCleanupReturnCount,
    callbackCleanupReturnHandleCount:
      metrics.callbackCleanupReturnHandleCount,
    cleanupInvocationAttemptCount: metrics.cleanupInvocationAttemptCount,
    cleanupInvocationErrorCount: metrics.cleanupInvocationErrorCount,
    cleanupReturnHandleConsumedCount:
      metrics.cleanupReturnHandleConsumedCount,
    callbackNullDetachAttemptCount: metrics.callbackNullDetachAttemptCount,
    objectRefSkippedCount: metrics.objectRefSkippedCount,
    fakeHostNodeRecordCount: metrics.fakeHostNodeRecordCount,
    records,
    ordering: attachDetachOrdering,
    errorPropagation: blockedErrorPropagation,
    errorPropagationStatus: REF_CALLBACK_ERROR_PROPAGATION_STATUS,
    publicRefCompatibility: blockedPublicRefCompatibility,
    publicRefCompatibilityStatus: REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS,
    blockedCapabilities: controlledInvocationBlockedCapabilities,
    sideEffects: freezeRecord({
      callbackRefsInvoked: metrics.callbackInvocationAttemptCount > 0,
      callbackCleanupReturnsInvoked: metrics.cleanupInvocationAttemptCount > 0,
      objectRefsMutated: false,
      layoutEffectsRun: false,
      domMutated: false,
      publicRootsTouched: false,
      rootErrorsReported: false,
      compatibilityClaimed: false
    }),
    callbackRefsInvoked: metrics.callbackInvocationAttemptCount > 0,
    callbackCleanupReturnsInvoked:
      metrics.cleanupInvocationAttemptCount > 0,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    rootErrorsReported: false,
    compatibilityClaimed: false
  });

  controlledInvocationGateSnapshotPayloads.set(
    gateSnapshot,
    freezeRecord({
      detach: metadata.detach,
      attach: metadata.attach,
      records: validatedRecords,
      invocationResults: freezeArray(
        invocationResults.map((invocationResult) => invocationResult.payload)
      )
    })
  );

  return gateSnapshot;
}

function createRefCallbackExecutionHandoffRecord(snapshot) {
  const rootCommitRefMetadata = unwrapRootCommitRefMetadataSnapshot(snapshot);
  const metadata = normalizeRootCommitRefMetadataSnapshot(snapshot);
  const controlledSnapshot =
    createRefCallbackControlledInvocationGateSnapshot({
      rootCommitRefMetadata
    });
  const controlledPayload =
    getPrivateRefCallbackControlledInvocationGateSnapshotPayload(
      controlledSnapshot
    );

  if (controlledPayload === null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_EXECUTION_HANDOFF',
      'Cannot create a ref callback execution handoff without a private controlled invocation snapshot.'
    );
  }

  const ordering = describeExecutionHandoffOrdering(
    controlledSnapshot.records
  );
  const cleanupReturnDetachCount =
    controlledSnapshot.records.filter(
      (record) =>
        record.invocationKind === REF_CALLBACK_INVOCATION_CLEANUP_RETURN
    ).length;
  const callbackAttachInvocationCount =
    controlledSnapshot.records.filter(
      (record) => record.invocationKind === REF_CALLBACK_INVOCATION_ATTACH
    ).length;
  const record = freezeRecord({
    $$typeof: privateDomRefCallbackExecutionHandoffRecordType,
    kind: 'FastReactDomPrivateRootCommitRefCallbackExecutionHandoffRecord',
    status: REF_CALLBACK_EXECUTION_HANDOFF_STATUS,
    handoffStatus: REF_CALLBACK_EXECUTION_HANDOFF_STATUS,
    source: attachDetachOrdering.source,
    rootCommitMetadataStatus: 'accepted-private-root-commit-ref-metadata',
    controlledInvocationStatus: controlledSnapshot.status,
    recordCount: controlledSnapshot.recordCount,
    detachCount: controlledSnapshot.detachCount,
    attachCount: controlledSnapshot.attachCount,
    callbackRefRecordCount: controlledSnapshot.callbackRefRecordCount,
    objectRefRecordCount: controlledSnapshot.objectRefRecordCount,
    callbackInvocationAttemptCount:
      controlledSnapshot.callbackInvocationAttemptCount,
    callbackInvocationErrorCount:
      controlledSnapshot.callbackInvocationErrorCount,
    callbackCleanupReturnCount:
      controlledSnapshot.callbackCleanupReturnCount,
    callbackCleanupReturnHandleCount:
      controlledSnapshot.callbackCleanupReturnHandleCount,
    cleanupInvocationAttemptCount:
      controlledSnapshot.cleanupInvocationAttemptCount,
    cleanupInvocationErrorCount:
      controlledSnapshot.cleanupInvocationErrorCount,
    cleanupReturnHandleConsumedCount:
      controlledSnapshot.cleanupReturnHandleConsumedCount,
    callbackNullDetachAttemptCount:
      controlledSnapshot.callbackNullDetachAttemptCount,
    objectRefSkippedCount: controlledSnapshot.objectRefSkippedCount,
    fakeHostNodeRecordCount: controlledSnapshot.fakeHostNodeRecordCount,
    callbackAttachInvocationCount,
    cleanupReturnDetachCount,
    changedRefDetachBeforeAttach: ordering.changedRefDetachBeforeAttach,
    changedRefDetachSequence: ordering.changedRefDetachSequence,
    changedRefAttachSequence: ordering.changedRefAttachSequence,
    executionSnapshot: controlledSnapshot,
    executionRecords: controlledSnapshot.records,
    ordering,
    errorPropagation: blockedErrorPropagation,
    errorPropagationStatus: REF_CALLBACK_ERROR_PROPAGATION_STATUS,
    publicRefCompatibility: blockedPublicRefCompatibility,
    publicRefCompatibilityStatus: REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS,
    blockedCapabilities: controlledInvocationBlockedCapabilities,
    sideEffects: controlledSnapshot.sideEffects,
    callbackRefsInvoked: controlledSnapshot.callbackRefsInvoked,
    callbackCleanupReturnsInvoked:
      controlledSnapshot.callbackCleanupReturnsInvoked,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    rootErrorsReported: false,
    compatibilityClaimed: false,
    exposesRefValue: false,
    exposesRefCleanup: false,
    exposesHostNode: false,
    exposesFakeHostNode: false,
    exposesLatestProps: false
  });

  executionHandoffRecordPayloads.set(
    record,
    freezeRecord({
      attach: metadata.attach,
      controlledInvocationPayload: controlledPayload,
      controlledInvocationSnapshot: controlledSnapshot,
      detach: metadata.detach,
      rootCommitRefMetadata
    })
  );

  return record;
}

function createRefCallbackHostOutputOrderingDiagnosticSnapshot(options) {
  const steps = normalizeHostOutputOrderingDiagnosticSteps(options);
  const activeRefsByToken = new Map();
  const records = [];
  const controlledSnapshots = [];
  const stepSummaries = [];
  const metrics = createHostOutputOrderingMetrics();
  const appliedLatestPropsUpdates = [];

  try {
    for (const step of steps) {
      appliedLatestPropsUpdates.push(
        ...applyHostOutputLatestPropsUpdates(step.latestPropsUpdates)
      );
      metrics.latestPropsUpdateCount += step.latestPropsUpdates.length;

      const controlledSnapshot =
        createRefCallbackControlledInvocationGateSnapshot({
          rootCommitRefMetadata: step.rootCommitRefMetadata
        });
      const controlledPayload =
        getPrivateRefCallbackControlledInvocationGateSnapshotPayload(
          controlledSnapshot
        );

      if (controlledPayload === null) {
        throw createRefCallbackGateError(
          'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_CONTROLLED_SNAPSHOT',
          'Cannot create host-output ref ordering diagnostics without a private controlled invocation snapshot.'
        );
      }

      controlledSnapshots.push(controlledSnapshot);
      const detachedRefsByToken = new Map();
      const firstRecordSequence = records.length;

      for (let index = 0; index < controlledSnapshot.records.length; index++) {
        const controlledRecord = controlledSnapshot.records[index];
        const controlledRecordPayload =
          controlledPayload.invocationResults[index];
        const diagnosticRecord = createHostOutputOrderingDiagnosticRecord({
          activeRefsByToken,
          controlledRecord,
          controlledRecordPayload,
          detachedRefsByToken,
          metrics,
          sequence: records.length,
          step
        });
        records.push(diagnosticRecord);
      }

      stepSummaries.push(
        freezeRecord({
          attachCount: controlledSnapshot.attachCount,
          detachCount: controlledSnapshot.detachCount,
          firstRecordSequence,
          hostOutputCanary: step.hostOutputCanary,
          label: step.label,
          lastRecordSequence:
            records.length === firstRecordSequence ? null : records.length - 1,
          latestPropsUpdateCount: step.latestPropsUpdates.length,
          recordCount: controlledSnapshot.recordCount,
          stepSequence: step.sequence
        })
      );

      if (step.hostOutputCanary === 'update-host-output') {
        metrics.updateCanaryStepCount++;
      } else if (step.hostOutputCanary === 'unmount-host-output') {
        metrics.unmountCanaryStepCount++;
      }
    }
  } catch (error) {
    rollbackHostOutputLatestPropsUpdates(appliedLatestPropsUpdates);
    throw error;
  }

  const frozenRecords = freezeArray(records);
  const snapshot = freezeRecord({
    $$typeof: privateDomRefCallbackHostOutputOrderingDiagnosticSnapshotType,
    kind: 'FastReactDomPrivateRefCallbackHostOutputOrderingDiagnosticSnapshot',
    status: REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_STATUS,
    stepCount: steps.length,
    updateCanaryStepCount: metrics.updateCanaryStepCount,
    unmountCanaryStepCount: metrics.unmountCanaryStepCount,
    recordCount: frozenRecords.length,
    attachCount: metrics.attachCount,
    detachCount: metrics.detachCount,
    callbackRefRecordCount: metrics.callbackRefRecordCount,
    objectRefRecordCount: metrics.objectRefRecordCount,
    callbackInvocationAttemptCount: metrics.callbackInvocationAttemptCount,
    callbackNullDetachAttemptCount: metrics.callbackNullDetachAttemptCount,
    callbackCleanupReturnCount: metrics.callbackCleanupReturnCount,
    callbackCleanupReturnHandleCount: metrics.callbackCleanupReturnHandleCount,
    cleanupInvocationAttemptCount: metrics.cleanupInvocationAttemptCount,
    cleanupReturnHandleConsumedCount:
      metrics.cleanupReturnHandleConsumedCount,
    cleanupReturnMatchedCount: metrics.cleanupReturnMatchedCount,
    cleanupReturnMismatchedCount: metrics.cleanupReturnMismatchedCount,
    latestPropsUpdateCount: metrics.latestPropsUpdateCount,
    callbackIdentityStableCount: metrics.callbackIdentityStableCount,
    callbackIdentityChangedCount: metrics.callbackIdentityChangedCount,
    callbackIdentityMissingCount: metrics.callbackIdentityMissingCount,
    hostIdentityReusedAfterDetachCount:
      metrics.hostIdentityReusedAfterDetachCount,
    records: frozenRecords,
    steps: freezeArray(stepSummaries),
    ordering: attachDetachOrdering,
    errorPropagation: blockedErrorPropagation,
    errorPropagationStatus: REF_CALLBACK_ERROR_PROPAGATION_STATUS,
    publicRefCompatibility: blockedPublicRefCompatibility,
    publicRefCompatibilityStatus: REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS,
    blockedCapabilities: controlledInvocationBlockedCapabilities,
    sideEffects: freezeRecord({
      callbackRefsInvoked: metrics.callbackInvocationAttemptCount > 0,
      callbackCleanupReturnsInvoked:
        metrics.cleanupInvocationAttemptCount > 0,
      objectRefsMutated: false,
      layoutEffectsRun: false,
      domMutated: false,
      publicRootsTouched: false,
      rootErrorsReported: false,
      compatibilityClaimed: false
    }),
    callbackRefsInvoked: metrics.callbackInvocationAttemptCount > 0,
    callbackCleanupReturnsInvoked:
      metrics.cleanupInvocationAttemptCount > 0,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    rootErrorsReported: false,
    compatibilityClaimed: false
  });

  hostOutputOrderingDiagnosticSnapshotPayloads.set(
    snapshot,
    freezeRecord({
      controlledSnapshots: freezeArray(controlledSnapshots),
      records: freezeArray(
        frozenRecords.map((record) =>
          getPrivateRefCallbackHostOutputOrderingDiagnosticRecordPayload(record)
        )
      ),
      steps: freezeArray(steps)
    })
  );

  return snapshot;
}

function getPrivateRefCallbackMetadataRecordPayload(record) {
  return isWeakMapKey(record)
    ? metadataRecordPayloads.get(record) || null
    : null;
}

function getPrivateRefCallbackRootCommitMetadataSnapshotPayload(snapshot) {
  return isWeakMapKey(snapshot)
    ? rootCommitMetadataSnapshotPayloads.get(snapshot) || null
    : null;
}

function getPrivateRefCallbackComponentTreeGateSnapshotPayload(snapshot) {
  return isWeakMapKey(snapshot)
    ? gateSnapshotPayloads.get(snapshot) || null
    : null;
}

function getPrivateRefCallbackComponentTreeGateRecordPayload(record) {
  return isWeakMapKey(record) ? gateRecordPayloads.get(record) || null : null;
}

function getPrivateRefCallbackAttachDetachGateSnapshotPayload(snapshot) {
  return isWeakMapKey(snapshot)
    ? attachDetachGateSnapshotPayloads.get(snapshot) || null
    : null;
}

function getPrivateRefCallbackAttachDetachGateRecordPayload(record) {
  return isWeakMapKey(record)
    ? attachDetachGateRecordPayloads.get(record) || null
    : null;
}

function getPrivateRefCallbackControlledInvocationGateSnapshotPayload(
  snapshot
) {
  return isWeakMapKey(snapshot)
    ? controlledInvocationGateSnapshotPayloads.get(snapshot) || null
    : null;
}

function getPrivateRefCallbackControlledInvocationGateRecordPayload(record) {
  return isWeakMapKey(record)
    ? controlledInvocationGateRecordPayloads.get(record) || null
    : null;
}

function getPrivateRefCallbackExecutionHandoffRecordPayload(record) {
  return isWeakMapKey(record)
    ? executionHandoffRecordPayloads.get(record) || null
    : null;
}

function getPrivateRefCallbackHostOutputOrderingDiagnosticSnapshotPayload(
  snapshot
) {
  return isWeakMapKey(snapshot)
    ? hostOutputOrderingDiagnosticSnapshotPayloads.get(snapshot) || null
    : null;
}

function getPrivateRefCallbackHostOutputOrderingDiagnosticRecordPayload(
  record
) {
  return isWeakMapKey(record)
    ? hostOutputOrderingDiagnosticRecordPayloads.get(record) || null
    : null;
}

function getPrivateRefCallbackCleanupReturnHandlePayload(handle) {
  return isWeakMapKey(handle)
    ? cleanupReturnHandlePayloads.get(handle) || null
    : null;
}

function isPrivateRefCallbackMetadataRecord(value) {
  return getPrivateRefCallbackMetadataRecordPayload(value) !== null;
}

function isPrivateRefCallbackRootCommitMetadataSnapshot(value) {
  return (
    getPrivateRefCallbackRootCommitMetadataSnapshotPayload(value) !== null
  );
}

function isPrivateRefCallbackComponentTreeGateSnapshot(value) {
  return getPrivateRefCallbackComponentTreeGateSnapshotPayload(value) !== null;
}

function isPrivateRefCallbackComponentTreeGateRecord(value) {
  return getPrivateRefCallbackComponentTreeGateRecordPayload(value) !== null;
}

function isPrivateRefCallbackAttachDetachGateSnapshot(value) {
  return getPrivateRefCallbackAttachDetachGateSnapshotPayload(value) !== null;
}

function isPrivateRefCallbackAttachDetachGateRecord(value) {
  return getPrivateRefCallbackAttachDetachGateRecordPayload(value) !== null;
}

function isPrivateRefCallbackControlledInvocationGateSnapshot(value) {
  return (
    getPrivateRefCallbackControlledInvocationGateSnapshotPayload(value) !==
    null
  );
}

function isPrivateRefCallbackControlledInvocationGateRecord(value) {
  return (
    getPrivateRefCallbackControlledInvocationGateRecordPayload(value) !== null
  );
}

function isPrivateRefCallbackExecutionHandoffRecord(value) {
  return getPrivateRefCallbackExecutionHandoffRecordPayload(value) !== null;
}

function isPrivateRefCallbackHostOutputOrderingDiagnosticSnapshot(value) {
  return (
    getPrivateRefCallbackHostOutputOrderingDiagnosticSnapshotPayload(value) !==
    null
  );
}

function isPrivateRefCallbackHostOutputOrderingDiagnosticRecord(value) {
  return (
    getPrivateRefCallbackHostOutputOrderingDiagnosticRecordPayload(value) !==
    null
  );
}

function isPrivateRefCallbackCleanupReturnHandle(value) {
  return getPrivateRefCallbackCleanupReturnHandlePayload(value) !== null;
}

function createRefCallbackMetadataRecord(options) {
  const action = normalizeAction(options.action);
  const expectedPhase = tokenPhaseForAction(action);
  const detachReason =
    action === REF_ACTION_DETACH
      ? normalizeDetachReason(options.detachReason)
      : null;
  const rootOwner = assertRequiredOption(options.rootOwner, 'rootOwner');
  const hostOwner = assertRequiredOption(options.hostOwner, 'hostOwner');
  const hostInstanceToken = assertRequiredOption(
    options.hostInstanceToken,
    'hostInstanceToken'
  );
  const fiber = assertRequiredOption(options.fiber, 'fiber');
  const stateNode = assertRequiredOption(options.stateNode, 'stateNode');
  const refHandle = assertRequiredOption(options.refHandle, 'refHandle');
  const ref = normalizeRefValue(options.ref);
  const refCleanupInput = normalizeRefCleanupInput(options);

  if (action === REF_ACTION_ATTACH && options.detachReason != null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_ATTACH_DETACH_REASON',
      'Ref attach metadata must not include a detach reason.'
    );
  }

  if (
    action === REF_ACTION_ATTACH &&
    (refCleanupInput.refCleanup !== null ||
      refCleanupInput.refCleanupHandle !== null)
  ) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_ATTACH_REF_CLEANUP',
      'Ref attach metadata must not include a cleanup return.'
    );
  }

  if (
    (refCleanupInput.refCleanup !== null ||
      refCleanupInput.refCleanupHandle !== null) &&
    typeof ref !== 'function'
  ) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_OBJECT_REF_CLEANUP',
      'Object ref metadata must not include a callback cleanup return.'
    );
  }

  let refCleanup = null;
  let refCleanupHandle = null;
  let refCleanupSource = REF_CLEANUP_SOURCE_NONE;
  if (action === REF_ACTION_DETACH) {
    const resolvedCleanup = resolveRefCleanupInputForDetachMetadata({
      detachReason,
      fiber,
      hostInstanceToken,
      hostOwner,
      ref,
      refCleanupInput,
      refHandle,
      rootOwner,
      sourceToken: options.sourceToken,
      stateNode
    });
    refCleanup = resolvedCleanup.refCleanup;
    refCleanupHandle = resolvedCleanup.refCleanupHandle;
    refCleanupSource = resolvedCleanup.refCleanupSource;
  }

  const payload = freezeRecord({
    action,
    detachReason,
    rootOwner,
    hostOwner,
    hostInstanceToken,
    fiber,
    stateNode,
    refHandle,
    ref,
    refCleanup,
    refCleanupHandle,
    refCleanupSource,
    expectedLatestRef:
      'expectedLatestRef' in options ? options.expectedLatestRef : ref,
    sourceToken: assertRequiredOption(options.sourceToken, 'sourceToken'),
    tokenPhase:
      options.tokenPhase === undefined ? expectedPhase : options.tokenPhase,
    tokenTarget:
      options.tokenTarget === undefined
        ? REF_TOKEN_TARGET_INSTANCE
        : options.tokenTarget
  });

  const record = freezeRecord({
    $$typeof: privateDomRefCallbackMetadataRecordType,
    kind: 'FastReactDomPrivateRefCallbackMetadataRecord',
    action,
    detachReason,
    tokenPhase: payload.tokenPhase,
    tokenTarget: payload.tokenTarget,
    status: 'accepted-private-root-commit-ref-metadata',
    hasRefCleanup: payload.refCleanup !== null,
    hasRefCleanupHandle: payload.refCleanupHandle !== null,
    refCleanupSource: payload.refCleanupSource,
    exposesRefValue: false,
    exposesRefCleanup: false,
    exposesHostNode: false,
    exposesLatestProps: false
  });

  metadataRecordPayloads.set(record, payload);
  return record;
}

function normalizeMetadataSnapshot(snapshot) {
  if (snapshot == null || typeof snapshot !== 'object') {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_SNAPSHOT',
      'Cannot validate ref callback metadata without a snapshot object.'
    );
  }

  return {
    detach: normalizeMetadataRecordList(snapshot.detach, REF_ACTION_DETACH),
    attach: normalizeMetadataRecordList(snapshot.attach, REF_ACTION_ATTACH)
  };
}

function normalizeRootCommitRefMetadataSnapshot(snapshot) {
  const privatePayload =
    getRootCommitRefMetadataSnapshotPayloadFromInput(snapshot);
  if (privatePayload !== null) {
    return {
      attach: privatePayload.attach,
      detach: privatePayload.detach
    };
  }

  return normalizeMetadataSnapshot(unwrapRootCommitRefMetadataSnapshot(snapshot));
}

function unwrapRootCommitRefMetadataSnapshot(snapshot) {
  if (snapshot == null || typeof snapshot !== 'object') {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_SNAPSHOT',
      'Cannot validate root commit ref metadata without a snapshot object.'
    );
  }

  const metadataSnapshot =
    'rootCommitRefMetadata' in snapshot
      ? snapshot.rootCommitRefMetadata
      : snapshot;
  if (metadataSnapshot == null || typeof metadataSnapshot !== 'object') {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_SNAPSHOT',
      'Cannot validate root commit ref metadata without a metadata object.'
    );
  }

  return metadataSnapshot;
}

function getRootCommitRefMetadataSnapshotPayloadFromInput(snapshot) {
  const directPayload =
    getPrivateRefCallbackRootCommitMetadataSnapshotPayload(snapshot);
  if (directPayload !== null) {
    return directPayload;
  }

  if (
    snapshot !== null &&
    typeof snapshot === 'object' &&
    'rootCommitRefMetadata' in snapshot
  ) {
    return getPrivateRefCallbackRootCommitMetadataSnapshotPayload(
      snapshot.rootCommitRefMetadata
    );
  }

  return null;
}

function normalizeMetadataRecordList(records, expectedAction) {
  if (records == null) {
    return [];
  }

  if (!Array.isArray(records)) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_METADATA_LIST',
      `Cannot validate ${expectedAction} ref metadata from a non-array list.`
    );
  }

  return records.map((record) =>
    assertPrivateMetadataPayload(record, expectedAction)
  );
}

function assertPrivateMetadataPayload(record, expectedAction) {
  const payload = getPrivateRefCallbackMetadataRecordPayload(record);
  if (payload === null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_METADATA_RECORD',
      'Expected a private React DOM ref callback metadata record.'
    );
  }

  if (payload.action !== expectedAction) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_ACTION_MISMATCH',
      `Expected ${expectedAction} ref metadata but received ${payload.action}.`
    );
  }

  return payload;
}

function validateMetadataSnapshotAgainstComponentTree(metadata) {
  const validatedRecords = [];

  for (const payload of metadata.detach) {
    validatedRecords.push(
      validateMetadataPayloadAgainstComponentTree(
        payload,
        REF_ACTION_DETACH,
        validatedRecords.length
      )
    );
  }

  for (const payload of metadata.attach) {
    validatedRecords.push(
      validateMetadataPayloadAgainstComponentTree(
        payload,
        REF_ACTION_ATTACH,
        validatedRecords.length
      )
    );
  }

  return validatedRecords;
}

function validateMetadataPayloadAgainstComponentTree(
  payload,
  expectedAction,
  sequence
) {
  assertTokenScope(payload, expectedAction);

  let hostNodeRecord;
  try {
    hostNodeRecord = componentTree.createMountedHostInstanceNodeRecord(
      payload.hostInstanceToken
    );
  } catch (error) {
    if (
      error &&
      (error.code === 'FAST_REACT_DOM_UNMOUNTED_HOST_INSTANCE_TOKEN' ||
        error.code === 'FAST_REACT_DOM_INVALID_HOST_INSTANCE_TOKEN')
    ) {
      throw createRefCallbackGateError(
        'FAST_REACT_DOM_REF_CALLBACK_GATE_UNMOUNTED_HOST_INSTANCE',
        'Cannot validate ref metadata for an unmounted React DOM host instance token.'
      );
    }
    throw error;
  }

  const hostNodePayload =
    componentTree.getPrivateHostInstanceNodeRecordPayload(hostNodeRecord);
  if (hostNodePayload === null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_HOST_NODE_RECORD',
      'Cannot validate ref metadata without a private component-tree host node record.'
    );
  }

  const rootOwner = hostNodePayload.rootOwner;
  if (rootOwner !== payload.rootOwner) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_ROOT_OWNER_MISMATCH',
      'Ref metadata root owner does not match the component-tree host instance token.'
    );
  }

  const hostOwner = hostNodePayload.hostOwner;
  if (hostOwner !== payload.hostOwner) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_HOST_OWNER_MISMATCH',
      'Ref metadata host owner does not match the component-tree host instance token.'
    );
  }

  const latestProps = hostNodePayload.latestProps;
  if (latestProps == null || typeof latestProps !== 'object') {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_MISSING_LATEST_PROPS',
      'Cannot validate ref metadata without mounted latest props.'
    );
  }

  if (!hostNodePayload.hasLatestRef) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_MISSING_LATEST_REF',
      'Cannot validate ref metadata when latest props have no ref field.'
    );
  }

  if (hostNodePayload.latestRef !== payload.expectedLatestRef) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_LATEST_REF_MISMATCH',
      'Ref metadata does not match the component-tree latest-props ref.'
    );
  }

  const componentTreeRecord = freezeRecord({
    sequence,
    node: hostNodePayload.node,
    hostNodeRecord,
    rootOwner,
    hostOwner,
    latestProps,
    latestRef: hostNodePayload.latestRef,
    status: 'mounted-latest-props-validated'
  });

  return {
    payload,
    componentTreeRecord,
    hostNodeRecord,
    hostNodePayload
  };
}

function assertTokenScope(payload, expectedAction) {
  const expectedPhase = tokenPhaseForAction(expectedAction);

  if (
    payload.tokenPhase !== expectedPhase ||
    payload.tokenTarget !== REF_TOKEN_TARGET_INSTANCE
  ) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_TOKEN_SCOPE_MISMATCH',
      `Ref ${expectedAction} metadata token scope must be ${expectedPhase}/instance.`
    );
  }

  const detachReasonValid =
    expectedAction === REF_ACTION_DETACH
      ? payload.detachReason !== null
      : payload.detachReason === null;
  if (!detachReasonValid) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_DETACH_REASON_MISMATCH',
      'Ref metadata detach reason does not match the ref action.'
    );
  }
}

function createGateRecord(sequence, payload, componentTreeRecord) {
  const record = freezeRecord({
    $$typeof: privateDomRefCallbackComponentTreeGateRecordType,
    kind: 'FastReactDomPrivateRefCallbackComponentTreeGateRecord',
    sequence,
    action: payload.action,
    detachReason: payload.detachReason,
    status: REF_CALLBACK_COMPONENT_TREE_GATE_STATUS,
    tokenPhase: payload.tokenPhase,
    tokenTarget: payload.tokenTarget,
    componentTreeStatus: componentTreeRecord.status,
    hostNodeRecordKind: componentTreeRecord.hostNodeRecord.kind,
    latestRefStatus: 'matches-private-metadata',
    blockedCapabilities,
    sideEffects: noSideEffects,
    callbackRefsInvoked: false,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    compatibilityClaimed: false,
    exposesRefValue: false,
    exposesHostNode: false,
    exposesLatestProps: false
  });

  gateRecordPayloads.set(
    record,
    freezeRecord({
      metadata: payload,
      componentTree: componentTreeRecord
    })
  );

  return record;
}

function createAttachDetachGateRecord(sequence, validatedRecord) {
  const {payload, componentTreeRecord, hostNodeRecord, hostNodePayload} =
    validatedRecord;
  const refKind = refKindForValue(payload.ref);
  const operation = operationForRefAction(refKind, payload.action);
  const ordering = createOperationOrderingRecord(sequence, payload.action);
  const record = freezeRecord({
    $$typeof: privateDomRefCallbackAttachDetachGateRecordType,
    kind: 'FastReactDomPrivateRefCallbackAttachDetachGateRecord',
    sequence,
    action: payload.action,
    detachReason: payload.detachReason,
    refKind,
    operation,
    status: REF_CALLBACK_ATTACH_DETACH_GATE_STATUS,
    rootCommitMetadataStatus: 'accepted-private-root-commit-ref-metadata',
    componentTreeStatus: componentTreeRecord.status,
    hostNodeRecord,
    hostNodeRecordKind: hostNodeRecord.kind,
    latestRefStatus: 'matches-private-metadata',
    tokenPhase: payload.tokenPhase,
    tokenTarget: payload.tokenTarget,
    ordering,
    errorPropagation: blockedErrorPropagation,
    errorPropagationStatus: REF_CALLBACK_ERROR_PROPAGATION_STATUS,
    blockedCapabilities,
    sideEffects: noSideEffects,
    callbackRefsInvoked: false,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    rootErrorsReported: false,
    compatibilityClaimed: false,
    exposesRefValue: false,
    exposesHostNode: false,
    exposesLatestProps: false
  });

  attachDetachGateRecordPayloads.set(
    record,
    freezeRecord({
      metadata: payload,
      componentTree: componentTreeRecord,
      hostNode: hostNodePayload,
      ref: payload.ref
    })
  );

  return record;
}

function createControlledInvocationGateRecord(sequence, validatedRecord) {
  const {payload, componentTreeRecord, hostNodeRecord, hostNodePayload} =
    validatedRecord;
  const refKind = refKindForValue(payload.ref);
  const operation = operationForRefAction(refKind, payload.action);
  const ordering = createOperationOrderingRecord(sequence, payload.action);
  const fakeHostNodeRecord =
    refKind === REF_KIND_CALLBACK
      ? componentTree.createRefCallbackFakeHostNodeRecord(hostNodeRecord)
      : null;
  const fakeHostNodePayload =
    fakeHostNodeRecord === null
      ? null
      : componentTree.getPrivateRefCallbackFakeHostNodeRecordPayload(
          fakeHostNodeRecord
        );

  if (fakeHostNodeRecord !== null && fakeHostNodePayload === null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_FAKE_HOST_NODE_RECORD',
      'Cannot run controlled ref callback invocation without a private fake host node record.'
    );
  }

  const invocation = runControlledInvocation(payload, fakeHostNodePayload);
  const record = freezeRecord({
    $$typeof: privateDomRefCallbackControlledInvocationGateRecordType,
    kind: 'FastReactDomPrivateRefCallbackControlledInvocationGateRecord',
    sequence,
    action: payload.action,
    detachReason: payload.detachReason,
    refKind,
    operation,
    status: REF_CALLBACK_CONTROLLED_INVOCATION_GATE_STATUS,
    rootCommitMetadataStatus: 'accepted-private-root-commit-ref-metadata',
    componentTreeStatus: componentTreeRecord.status,
    hostNodeRecord,
    hostNodeRecordKind: hostNodeRecord.kind,
    fakeHostNodeRecord,
    fakeHostNodeRecordKind:
      fakeHostNodeRecord === null ? null : fakeHostNodeRecord.kind,
    fakeHostNodeStatus:
      fakeHostNodeRecord === null ? 'not-applicable' : fakeHostNodeRecord.status,
    latestRefStatus: 'matches-private-metadata',
    tokenPhase: payload.tokenPhase,
    tokenTarget: payload.tokenTarget,
    ordering,
    invocationKind: invocation.kind,
    invocationStatus: invocation.status,
    invocationAttempted: invocation.attempted,
    callbackRefInvocationAttempted: invocation.callbackAttempted,
    cleanupReturnInvocationAttempted: invocation.cleanupAttempted,
    callbackReturnStatus: invocation.callbackReturnStatus,
    callbackCleanupReturnRecorded: invocation.cleanupReturnRecorded,
    cleanupReturnHandleRecorded: invocation.cleanupReturnHandleRecorded,
    cleanupReturnHandleConsumed: invocation.cleanupReturnHandleConsumed,
    cleanupReturnStatus: invocation.cleanupReturnStatus,
    refCleanupSource: invocation.refCleanupSource,
    invocationErrorCaptured: invocation.error !== null,
    errorPropagation: blockedErrorPropagation,
    errorPropagationStatus: REF_CALLBACK_ERROR_PROPAGATION_STATUS,
    publicRefCompatibility: blockedPublicRefCompatibility,
    publicRefCompatibilityStatus: REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS,
    blockedCapabilities: controlledInvocationBlockedCapabilities,
    callbackRefsInvoked: invocation.callbackAttempted,
    callbackCleanupReturnsInvoked: invocation.cleanupAttempted,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    rootErrorsReported: false,
    compatibilityClaimed: false,
    exposesRefValue: false,
    exposesRefCleanup: false,
    exposesHostNode: false,
    exposesFakeHostNode: false,
    exposesLatestProps: false
  });

  const hiddenPayload = freezeRecord({
    metadata: payload,
    componentTree: componentTreeRecord,
    hostNode: hostNodePayload,
    fakeHostNode:
      fakeHostNodePayload === null ? null : fakeHostNodePayload.fakeHostNode,
    fakeHostNodeRecord,
    ref: payload.ref,
    refCleanup: invocation.refCleanup,
    refCleanupHandle: invocation.refCleanupHandle,
    refCleanupSource: invocation.refCleanupSource,
    callbackReturn: invocation.returnValue,
    cleanupReturn: invocation.cleanupReturn,
    error: invocation.error,
    invocation
  });

  controlledInvocationGateRecordPayloads.set(record, hiddenPayload);
  return {
    record,
    payload: hiddenPayload,
    invocation,
    refKind,
    fakeHostNodeRecord
  };
}

function runControlledInvocation(payload, fakeHostNodePayload) {
  if (typeof payload.ref !== 'function') {
    return freezeRecord({
      kind: REF_CALLBACK_INVOCATION_SKIPPED_OBJECT_REF,
      status: REF_CALLBACK_INVOCATION_STATUS_SKIPPED,
      attempted: false,
      callbackAttempted: false,
      cleanupAttempted: false,
      callbackReturnStatus: REF_CALLBACK_RETURN_NOT_APPLICABLE,
      cleanupReturnStatus: REF_CALLBACK_RETURN_NOT_APPLICABLE,
      cleanupReturnRecorded: false,
      cleanupReturnHandleRecorded: false,
      cleanupReturnHandleConsumed: false,
      returnValue: undefined,
      cleanupReturn: null,
      refCleanup: null,
      refCleanupHandle: null,
      refCleanupSource: REF_CLEANUP_SOURCE_NONE,
      error: null
    });
  }

  if (payload.action === REF_ACTION_DETACH) {
    const cleanup = resolveRefCleanupForDetachPayload(payload);
    if (cleanup.refCleanup !== null) {
      return runControlledCleanupReturn(
        cleanup.refCleanup,
        cleanup.refCleanupHandle,
        cleanup.refCleanupSource
      );
    }
  }

  const invocationKind =
    payload.action === REF_ACTION_ATTACH
      ? REF_CALLBACK_INVOCATION_ATTACH
      : REF_CALLBACK_INVOCATION_NULL_DETACH;
  const argument =
    payload.action === REF_ACTION_ATTACH
      ? fakeHostNodePayload.fakeHostNode
      : null;

  try {
    const returnValue = payload.ref(argument);
    const cleanupReturnRecorded =
      payload.action === REF_ACTION_ATTACH &&
      typeof returnValue === 'function';
    const cleanupReturnHandle = cleanupReturnRecorded
      ? recordRefCleanupReturnHandle(payload, returnValue)
      : null;
    return freezeRecord({
      kind: invocationKind,
      status: REF_CALLBACK_INVOCATION_STATUS_OK,
      attempted: true,
      callbackAttempted: true,
      cleanupAttempted: false,
      callbackReturnStatus: callbackReturnStatusForValue(returnValue),
      cleanupReturnStatus: cleanupReturnRecorded
        ? REF_CALLBACK_RETURN_CLEANUP
        : REF_CALLBACK_RETURN_NOT_APPLICABLE,
      cleanupReturnRecorded,
      cleanupReturnHandleRecorded: cleanupReturnHandle !== null,
      cleanupReturnHandleConsumed: false,
      returnValue,
      cleanupReturn: cleanupReturnRecorded ? returnValue : null,
      refCleanup: null,
      refCleanupHandle: cleanupReturnHandle,
      refCleanupSource:
        cleanupReturnHandle === null
          ? REF_CLEANUP_SOURCE_NONE
          : REF_CLEANUP_SOURCE_HANDLE,
      error: null
    });
  } catch (error) {
    return freezeRecord({
      kind: invocationKind,
      status: REF_CALLBACK_INVOCATION_STATUS_THROWN,
      attempted: true,
      callbackAttempted: true,
      cleanupAttempted: false,
      callbackReturnStatus: REF_CALLBACK_RETURN_NOT_APPLICABLE,
      cleanupReturnStatus: REF_CALLBACK_RETURN_NOT_APPLICABLE,
      cleanupReturnRecorded: false,
      cleanupReturnHandleRecorded: false,
      cleanupReturnHandleConsumed: false,
      returnValue: undefined,
      cleanupReturn: null,
      refCleanup: null,
      refCleanupHandle: null,
      refCleanupSource: REF_CLEANUP_SOURCE_NONE,
      error
    });
  }
}

function resolveRefCleanupForDetachPayload(payload) {
  if (payload.refCleanup !== null) {
    if (payload.refCleanupHandle !== null) {
      assertRefCleanupHandleForMetadata(payload.refCleanupHandle, payload);
    }
    return freezeRecord({
      refCleanup: payload.refCleanup,
      refCleanupHandle: payload.refCleanupHandle,
      refCleanupSource: payload.refCleanupSource
    });
  }

  return resolveStoredRefCleanupForDetachPayload(payload);
}

function runControlledCleanupReturn(
  refCleanup,
  refCleanupHandle,
  refCleanupSource
) {
  try {
    const returnValue = refCleanup();
    return freezeRecord({
      kind: REF_CALLBACK_INVOCATION_CLEANUP_RETURN,
      status: REF_CALLBACK_INVOCATION_STATUS_OK,
      attempted: true,
      callbackAttempted: false,
      cleanupAttempted: true,
      callbackReturnStatus: REF_CALLBACK_RETURN_NOT_APPLICABLE,
      cleanupReturnStatus: callbackReturnStatusForValue(returnValue),
      cleanupReturnRecorded: false,
      cleanupReturnHandleRecorded: false,
      cleanupReturnHandleConsumed: refCleanupHandle !== null,
      returnValue,
      cleanupReturn: refCleanup,
      refCleanup,
      refCleanupHandle,
      refCleanupSource,
      error: null
    });
  } catch (error) {
    return freezeRecord({
      kind: REF_CALLBACK_INVOCATION_CLEANUP_RETURN,
      status: REF_CALLBACK_INVOCATION_STATUS_THROWN,
      attempted: true,
      callbackAttempted: false,
      cleanupAttempted: true,
      callbackReturnStatus: REF_CALLBACK_RETURN_NOT_APPLICABLE,
      cleanupReturnStatus: REF_CALLBACK_RETURN_NOT_APPLICABLE,
      cleanupReturnRecorded: false,
      cleanupReturnHandleRecorded: false,
      cleanupReturnHandleConsumed: refCleanupHandle !== null,
      returnValue: undefined,
      cleanupReturn: refCleanup,
      refCleanup,
      refCleanupHandle,
      refCleanupSource,
      error
    });
  } finally {
    markRefCleanupReturnHandleConsumed(refCleanupHandle);
  }
}

function summarizeControlledInvocationResults(invocationResults) {
  const metrics = {
    callbackRefRecordCount: 0,
    objectRefRecordCount: 0,
    callbackInvocationAttemptCount: 0,
    callbackInvocationErrorCount: 0,
    callbackCleanupReturnCount: 0,
    callbackCleanupReturnHandleCount: 0,
    cleanupInvocationAttemptCount: 0,
    cleanupInvocationErrorCount: 0,
    cleanupReturnHandleConsumedCount: 0,
    callbackNullDetachAttemptCount: 0,
    objectRefSkippedCount: 0,
    fakeHostNodeRecordCount: 0
  };

  for (const result of invocationResults) {
    if (result.refKind === REF_KIND_CALLBACK) {
      metrics.callbackRefRecordCount++;
    } else if (result.refKind === REF_KIND_OBJECT) {
      metrics.objectRefRecordCount++;
    }

    if (result.fakeHostNodeRecord !== null) {
      metrics.fakeHostNodeRecordCount++;
    }

    const invocation = result.invocation;
    if (invocation.callbackAttempted) {
      metrics.callbackInvocationAttemptCount++;
      if (invocation.status === REF_CALLBACK_INVOCATION_STATUS_THROWN) {
        metrics.callbackInvocationErrorCount++;
      }
    }

    if (invocation.cleanupAttempted) {
      metrics.cleanupInvocationAttemptCount++;
      if (invocation.status === REF_CALLBACK_INVOCATION_STATUS_THROWN) {
        metrics.cleanupInvocationErrorCount++;
      }
    }

    if (invocation.cleanupReturnRecorded) {
      metrics.callbackCleanupReturnCount++;
    }
    if (invocation.cleanupReturnHandleRecorded) {
      metrics.callbackCleanupReturnHandleCount++;
    }
    if (invocation.cleanupReturnHandleConsumed) {
      metrics.cleanupReturnHandleConsumedCount++;
    }

    if (invocation.kind === REF_CALLBACK_INVOCATION_NULL_DETACH) {
      metrics.callbackNullDetachAttemptCount++;
    }

    if (invocation.kind === REF_CALLBACK_INVOCATION_SKIPPED_OBJECT_REF) {
      metrics.objectRefSkippedCount++;
    }
  }

  return metrics;
}

function normalizeHostOutputOrderingDiagnosticSteps(options) {
  const steps =
    Array.isArray(options)
      ? options
      : options && typeof options === 'object'
        ? options.steps
        : null;

  if (!Array.isArray(steps) || steps.length === 0) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_HOST_OUTPUT_STEPS',
      'Cannot create host-output ref ordering diagnostics without a non-empty steps array.'
    );
  }

  return freezeArray(
    steps.map((step, sequence) => {
      if (step == null || typeof step !== 'object') {
        throw createRefCallbackGateError(
          'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_HOST_OUTPUT_STEP',
          'Host-output ref ordering diagnostic steps must be objects.'
        );
      }

      const rootCommitRefMetadata =
        'rootCommitRefMetadata' in step
          ? step.rootCommitRefMetadata
          : step.refMetadata;
      if (rootCommitRefMetadata == null || typeof rootCommitRefMetadata !== 'object') {
        throw createRefCallbackGateError(
          'FAST_REACT_DOM_REF_CALLBACK_GATE_MISSING_HOST_OUTPUT_REF_METADATA',
          'Host-output ref ordering diagnostic steps require root commit ref metadata.'
        );
      }

      return freezeRecord({
        hostOutputCanary: normalizeHostOutputCanary(step.hostOutputCanary),
        label: normalizeHostOutputStepLabel(step.label, sequence),
        latestPropsUpdates: normalizeHostOutputLatestPropsUpdates(
          step.latestPropsUpdates
        ),
        rootCommitRefMetadata,
        sequence
      });
    })
  );
}

function normalizeHostOutputLatestPropsUpdates(updates) {
  if (updates == null) {
    return freezeArray([]);
  }

  if (!Array.isArray(updates)) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_LATEST_PROPS_UPDATES',
      'Host-output ref ordering latest-props updates must be an array.'
    );
  }

  return freezeArray(
    updates.map((update) => {
      if (update == null || typeof update !== 'object') {
        throw createRefCallbackGateError(
          'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_LATEST_PROPS_UPDATE',
          'Host-output ref ordering latest-props updates must be objects.'
        );
      }

      return freezeRecord({
        hostInstanceToken: assertRequiredOption(
          update.hostInstanceToken,
          'hostInstanceToken'
        ),
        latestProps: assertRequiredOption(update.latestProps, 'latestProps')
      });
    })
  );
}

function applyHostOutputLatestPropsUpdates(updates) {
  const appliedUpdates = [];
  for (const update of updates) {
    const previousLatestProps =
      componentTree.getLatestPropsFromHostInstanceToken(
        update.hostInstanceToken
      );
    componentTree.updateLatestPropsForHostInstanceToken(
      update.hostInstanceToken,
      update.latestProps
    );
    appliedUpdates.push(
      freezeRecord({
        hostInstanceToken: update.hostInstanceToken,
        previousLatestProps
      })
    );
  }
  return appliedUpdates;
}

function rollbackHostOutputLatestPropsUpdates(updates) {
  for (let index = updates.length - 1; index >= 0; index--) {
    try {
      componentTree.updateLatestPropsForHostInstanceToken(
        updates[index].hostInstanceToken,
        updates[index].previousLatestProps
      );
    } catch (error) {
      // The original private diagnostic error is more useful than rollback noise.
    }
  }
}

function createHostOutputOrderingMetrics() {
  return {
    attachCount: 0,
    callbackCleanupReturnCount: 0,
    callbackCleanupReturnHandleCount: 0,
    callbackIdentityChangedCount: 0,
    callbackIdentityMissingCount: 0,
    callbackIdentityStableCount: 0,
    callbackInvocationAttemptCount: 0,
    callbackNullDetachAttemptCount: 0,
    callbackRefRecordCount: 0,
    cleanupInvocationAttemptCount: 0,
    cleanupReturnHandleConsumedCount: 0,
    cleanupReturnMatchedCount: 0,
    cleanupReturnMismatchedCount: 0,
    detachCount: 0,
    hostIdentityReusedAfterDetachCount: 0,
    latestPropsUpdateCount: 0,
    objectRefRecordCount: 0,
    unmountCanaryStepCount: 0,
    updateCanaryStepCount: 0
  };
}

function createHostOutputOrderingDiagnosticRecord({
  activeRefsByToken,
  controlledRecord,
  controlledRecordPayload,
  detachedRefsByToken,
  metrics,
  sequence,
  step
}) {
  const metadata = controlledRecordPayload.metadata;
  const token = metadata.hostInstanceToken;
  const activeRef = activeRefsByToken.get(token) || null;
  const detachedRef = detachedRefsByToken.get(token) || null;
  const refKind = controlledRecord.refKind;
  const identity = describeHostOutputRefIdentity({
    activeRef,
    detachedRef,
    metadata
  });
  const hostIdentityStatus = describeHostOutputHostIdentity({
    activeRef,
    detachedRef,
    hostNode: controlledRecordPayload.hostNode.node,
    metadata
  });
  const cleanup = describeHostOutputCleanupIdentity({
    activeRef,
    metadata,
    invocation: controlledRecordPayload.invocation
  });

  updateHostOutputOrderingMetrics({
    cleanup,
    controlledRecord,
    hostIdentityStatus,
    identity,
    metrics
  });

  if (metadata.action === REF_ACTION_DETACH) {
    activeRefsByToken.delete(token);
    detachedRefsByToken.set(
      token,
      freezeRecord({
        cleanupReturn: activeRef === null ? null : activeRef.cleanupReturn,
        cleanupReturnHandle:
          activeRef === null ? null : activeRef.cleanupReturnHandle,
        hostNode: controlledRecordPayload.hostNode.node,
        ref: metadata.ref
      })
    );
  } else {
    activeRefsByToken.set(
      token,
      freezeRecord({
        cleanupReturn: controlledRecordPayload.cleanupReturn,
        cleanupReturnHandle: controlledRecordPayload.refCleanupHandle,
        hostNode: controlledRecordPayload.hostNode.node,
        ref: metadata.ref
      })
    );
  }

  const record = freezeRecord({
    $$typeof: privateDomRefCallbackHostOutputOrderingDiagnosticRecordType,
    kind: 'FastReactDomPrivateRefCallbackHostOutputOrderingDiagnosticRecord',
    sequence,
    stepSequence: step.sequence,
    stepLabel: step.label,
    hostOutputCanary: step.hostOutputCanary,
    action: controlledRecord.action,
    detachReason: controlledRecord.detachReason,
    refKind,
    operation: controlledRecord.operation,
    status: REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_STATUS,
    controlledInvocationStatus: controlledRecord.status,
    invocationKind: controlledRecord.invocationKind,
    invocationStatus: controlledRecord.invocationStatus,
    invocationAttempted: controlledRecord.invocationAttempted,
    callbackRefInvocationAttempted:
      controlledRecord.callbackRefInvocationAttempted,
    cleanupReturnInvocationAttempted:
      controlledRecord.cleanupReturnInvocationAttempted,
    callbackReturnStatus: controlledRecord.callbackReturnStatus,
    callbackCleanupReturnRecorded:
      controlledRecord.callbackCleanupReturnRecorded,
    cleanupReturnHandleRecorded:
      controlledRecord.cleanupReturnHandleRecorded,
    cleanupReturnHandleConsumed:
      controlledRecord.cleanupReturnHandleConsumed,
    cleanupReturnStatus: controlledRecord.cleanupReturnStatus,
    callbackIdentityStatus: identity.status,
    callbackIdentityMatchedPreviousActive:
      identity.matchedPreviousActiveRef,
    callbackIdentityChangedFromDetached:
      identity.changedFromDetachedRef,
    cleanupReturnExpectedFromPreviousAttach:
      cleanup.expectedFromPreviousAttach,
    cleanupReturnMatchesPreviousAttach:
      cleanup.matchesPreviousAttach,
    cleanupReturnHandleMatchesPreviousAttach:
      cleanup.matchesPreviousAttachHandle,
    cleanupReturnInvoked: cleanup.invoked,
    hostIdentityStatus,
    hostIdentityReusedAfterDetach:
      hostIdentityStatus === 'reused-from-detach',
    ordering: controlledRecord.ordering,
    errorPropagation: blockedErrorPropagation,
    errorPropagationStatus: REF_CALLBACK_ERROR_PROPAGATION_STATUS,
    publicRefCompatibility: blockedPublicRefCompatibility,
    publicRefCompatibilityStatus: REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS,
    blockedCapabilities: controlledInvocationBlockedCapabilities,
    callbackRefsInvoked: controlledRecord.callbackRefsInvoked,
    callbackCleanupReturnsInvoked:
      controlledRecord.callbackCleanupReturnsInvoked,
    objectRefsMutated: false,
    layoutEffectsRun: false,
    domMutated: false,
    publicRootsTouched: false,
    rootErrorsReported: false,
    compatibilityClaimed: false,
    exposesRefValue: false,
    exposesRefCleanup: false,
    exposesHostNode: false,
    exposesFakeHostNode: false,
    exposesLatestProps: false
  });

  hostOutputOrderingDiagnosticRecordPayloads.set(
    record,
    freezeRecord({
      activeRefBeforeRecord: activeRef,
      cleanup,
      controlledRecord,
      controlledRecordPayload,
      detachedRefBeforeRecord: detachedRef,
      identity,
      metadata,
      step
    })
  );

  return record;
}

function describeHostOutputRefIdentity({activeRef, detachedRef, metadata}) {
  if (metadata.action === REF_ACTION_DETACH) {
    if (activeRef === null) {
      return freezeRecord({
        changedFromDetachedRef: false,
        matchedPreviousActiveRef: false,
        status: 'missing-active-ref'
      });
    }

    const matched = activeRef.ref === metadata.ref;
    return freezeRecord({
      changedFromDetachedRef: false,
      matchedPreviousActiveRef: matched,
      status: matched ? 'matches-active-ref' : 'differs-from-active-ref'
    });
  }

  if (detachedRef !== null) {
    const changed = detachedRef.ref !== metadata.ref;
    return freezeRecord({
      changedFromDetachedRef: changed,
      matchedPreviousActiveRef: false,
      status: changed ? 'changed-from-detached-ref' : 'same-as-detached-ref'
    });
  }

  if (activeRef !== null) {
    const matched = activeRef.ref === metadata.ref;
    return freezeRecord({
      changedFromDetachedRef: !matched,
      matchedPreviousActiveRef: matched,
      status: matched ? 'same-as-active-ref' : 'changed-from-active-ref'
    });
  }

  return freezeRecord({
    changedFromDetachedRef: false,
    matchedPreviousActiveRef: false,
    status: 'new-active-ref'
  });
}

function describeHostOutputHostIdentity({activeRef, detachedRef, hostNode, metadata}) {
  if (metadata.action === REF_ACTION_DETACH) {
    if (activeRef === null) {
      return 'missing-active-host';
    }
    return activeRef.hostNode === hostNode
      ? 'matches-active-host'
      : 'differs-from-active-host';
  }

  if (detachedRef !== null) {
    return detachedRef.hostNode === hostNode
      ? 'reused-from-detach'
      : 'replaced-after-detach';
  }

  if (activeRef !== null) {
    return activeRef.hostNode === hostNode
      ? 'same-as-active-host'
      : 'changed-from-active-host';
  }

  return 'new-host';
}

function describeHostOutputCleanupIdentity({activeRef, metadata, invocation}) {
  if (metadata.action !== REF_ACTION_DETACH) {
    return freezeRecord({
      expectedFromPreviousAttach: false,
      invoked: false,
      matchesPreviousAttach: null,
      matchesPreviousAttachHandle: null
    });
  }

  const expectedCleanup =
    activeRef === null ? null : activeRef.cleanupReturn;
  const expectedCleanupHandle =
    activeRef === null ? null : activeRef.cleanupReturnHandle;
  const expectedFromPreviousAttach = expectedCleanup !== null;
  const matchesPreviousAttachHandle =
    expectedCleanupHandle !== null &&
    invocation.refCleanupHandle === expectedCleanupHandle;
  return freezeRecord({
    expectedFromPreviousAttach,
    invoked: invocation.cleanupAttempted,
    matchesPreviousAttach:
      expectedFromPreviousAttach &&
      (matchesPreviousAttachHandle || invocation.refCleanup === expectedCleanup),
    matchesPreviousAttachHandle
  });
}

function updateHostOutputOrderingMetrics({
  cleanup,
  controlledRecord,
  hostIdentityStatus,
  identity,
  metrics
}) {
  if (controlledRecord.action === REF_ACTION_ATTACH) {
    metrics.attachCount++;
  } else {
    metrics.detachCount++;
  }

  if (controlledRecord.refKind === REF_KIND_CALLBACK) {
    metrics.callbackRefRecordCount++;
  } else if (controlledRecord.refKind === REF_KIND_OBJECT) {
    metrics.objectRefRecordCount++;
  }

  if (controlledRecord.callbackRefInvocationAttempted) {
    metrics.callbackInvocationAttemptCount++;
  }
  if (controlledRecord.cleanupReturnInvocationAttempted) {
    metrics.cleanupInvocationAttemptCount++;
  }
  if (controlledRecord.callbackCleanupReturnRecorded) {
    metrics.callbackCleanupReturnCount++;
  }
  if (controlledRecord.cleanupReturnHandleRecorded) {
    metrics.callbackCleanupReturnHandleCount++;
  }
  if (controlledRecord.cleanupReturnHandleConsumed) {
    metrics.cleanupReturnHandleConsumedCount++;
  }
  if (
    controlledRecord.invocationKind === REF_CALLBACK_INVOCATION_NULL_DETACH
  ) {
    metrics.callbackNullDetachAttemptCount++;
  }

  if (
    identity.status === 'matches-active-ref' ||
    identity.status === 'same-as-detached-ref' ||
    identity.status === 'same-as-active-ref'
  ) {
    metrics.callbackIdentityStableCount++;
  } else if (
    identity.status === 'changed-from-detached-ref' ||
    identity.status === 'changed-from-active-ref' ||
    identity.status === 'differs-from-active-ref'
  ) {
    metrics.callbackIdentityChangedCount++;
  } else if (identity.status === 'missing-active-ref') {
    metrics.callbackIdentityMissingCount++;
  }

  if (cleanup.expectedFromPreviousAttach) {
    if (cleanup.matchesPreviousAttach) {
      metrics.cleanupReturnMatchedCount++;
    } else {
      metrics.cleanupReturnMismatchedCount++;
    }
  }

  if (hostIdentityStatus === 'reused-from-detach') {
    metrics.hostIdentityReusedAfterDetachCount++;
  }
}

function normalizeHostOutputCanary(hostOutputCanary) {
  if (
    hostOutputCanary === 'initial-host-output' ||
    hostOutputCanary === 'update-host-output' ||
    hostOutputCanary === 'unmount-host-output'
  ) {
    return hostOutputCanary;
  }

  throw createRefCallbackGateError(
    'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_HOST_OUTPUT_CANARY',
    'Host-output ref ordering diagnostics require an accepted host-output canary label.'
  );
}

function normalizeHostOutputStepLabel(label, sequence) {
  if (label === undefined) {
    return `step:${sequence}`;
  }

  if (typeof label === 'string' && label.length > 0) {
    return label;
  }

  throw createRefCallbackGateError(
    'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_HOST_OUTPUT_STEP_LABEL',
    'Host-output ref ordering diagnostic step labels must be non-empty strings.'
  );
}

function createOperationOrderingRecord(sequence, action) {
  return freezeRecord({
    sequence,
    action,
    phase:
      action === REF_ACTION_DETACH
        ? 'mutation-ref-detach'
        : 'layout-ref-attach',
    source: attachDetachOrdering.source,
    detachRecordsBeforeAttachRecords:
      attachDetachOrdering.detachRecordsBeforeAttachRecords,
    deterministic: attachDetachOrdering.deterministic
  });
}

function describeExecutionHandoffOrdering(records) {
  let sawChangedRefDetach = false;
  let changedRefDetachSequence = null;
  let changedRefAttachSequence = null;

  for (const record of records) {
    if (
      record.action === REF_ACTION_DETACH &&
      record.detachReason === REF_DETACH_REASON_REF_CHANGED
    ) {
      sawChangedRefDetach = true;
      if (changedRefDetachSequence === null) {
        changedRefDetachSequence = record.sequence;
      }
    } else if (record.action === REF_ACTION_ATTACH && sawChangedRefDetach) {
      if (changedRefAttachSequence === null) {
        changedRefAttachSequence = record.sequence;
      }
      break;
    }
  }

  return freezeRecord({
    source: attachDetachOrdering.source,
    deterministic: attachDetachOrdering.deterministic,
    detachRecordsBeforeAttachRecords:
      attachDetachOrdering.detachRecordsBeforeAttachRecords,
    changedRefDetachBeforeAttach:
      changedRefDetachSequence !== null && changedRefAttachSequence !== null,
    changedRefDetachSequence,
    changedRefAttachSequence
  });
}

function assertOptionsObject(options, label) {
  if (options == null || typeof options !== 'object') {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_OPTIONS',
      `Cannot create ref callback ${label} without an options object.`
    );
  }
  return options;
}

function assertRequiredOption(value, fieldName) {
  if (value == null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_MISSING_METADATA_FIELD',
      `Cannot create ref callback metadata without ${fieldName}.`
    );
  }
  return value;
}

function normalizeAction(action) {
  if (action === REF_ACTION_ATTACH || action === REF_ACTION_DETACH) {
    return action;
  }

  throw createRefCallbackGateError(
    'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_ACTION',
    'Ref callback metadata action must be attach or detach.'
  );
}

function normalizeDetachReason(detachReason) {
  if (
    detachReason === REF_DETACH_REASON_DELETED ||
    detachReason === REF_DETACH_REASON_REF_CHANGED
  ) {
    return detachReason;
  }

  throw createRefCallbackGateError(
    'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_DETACH_REASON',
    'Ref detach metadata must include an accepted detach reason.'
  );
}

function normalizeRefValue(ref) {
  if (ref !== null && (typeof ref === 'function' || typeof ref === 'object')) {
    return ref;
  }

  throw createRefCallbackGateError(
    'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_REF',
    'Ref callback metadata requires a callback or object ref value.'
  );
}

function normalizeRefCleanupInput(options) {
  const hasDirectCleanup =
    Object.prototype.hasOwnProperty.call(options, 'refCleanup') &&
    options.refCleanup != null;
  const hasCleanupHandle =
    Object.prototype.hasOwnProperty.call(options, 'refCleanupHandle') &&
    options.refCleanupHandle != null;

  if (hasDirectCleanup && hasCleanupHandle) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_REF_CLEANUP_CONFLICT',
      'Ref detach metadata must not include both a cleanup return and a cleanup return handle.'
    );
  }

  if (hasDirectCleanup) {
    if (typeof options.refCleanup === 'function') {
      return freezeRecord({
        refCleanup: options.refCleanup,
        refCleanupHandle: null
      });
    }

    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_REF_CLEANUP',
      'Ref detach metadata cleanup return must be a function.'
    );
  }

  if (hasCleanupHandle) {
    if (isPrivateRefCallbackCleanupReturnHandle(options.refCleanupHandle)) {
      return freezeRecord({
        refCleanup: null,
        refCleanupHandle: options.refCleanupHandle
      });
    }

    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_REF_CLEANUP_HANDLE',
      'Ref detach metadata cleanup return handle must come from a private callback attach return.'
    );
  }

  return freezeRecord({
    refCleanup: null,
    refCleanupHandle: null
  });
}

function resolveRefCleanupInputForDetachMetadata({
  detachReason,
  fiber,
  hostInstanceToken,
  hostOwner,
  ref,
  refCleanupInput,
  refHandle,
  rootOwner,
  sourceToken,
  stateNode
}) {
  if (refCleanupInput.refCleanup !== null) {
    return freezeRecord({
      refCleanup: refCleanupInput.refCleanup,
      refCleanupHandle: null,
      refCleanupSource: REF_CLEANUP_SOURCE_DIRECT_FUNCTION
    });
  }

  if (refCleanupInput.refCleanupHandle !== null) {
    const handlePayload = assertRefCleanupHandleForMetadata(
      refCleanupInput.refCleanupHandle,
      {
        action: REF_ACTION_DETACH,
        detachReason,
        fiber,
        hostInstanceToken,
        hostOwner,
        ref,
        refHandle,
        rootOwner,
        sourceToken,
        stateNode
      }
    );
    return freezeRecord({
      refCleanup: handlePayload.cleanupReturn,
      refCleanupHandle: refCleanupInput.refCleanupHandle,
      refCleanupSource: REF_CLEANUP_SOURCE_HANDLE
    });
  }

  return freezeRecord({
    refCleanup: null,
    refCleanupHandle: null,
    refCleanupSource: REF_CLEANUP_SOURCE_NONE
  });
}

function recordRefCleanupReturnHandle(metadata, cleanupReturn) {
  const sequence = nextCleanupReturnHandleSequence++;
  const handle = freezeRecord({
    $$typeof: privateDomRefCallbackCleanupReturnHandleType,
    kind: 'FastReactDomPrivateRefCallbackCleanupReturnHandle',
    status: REF_CALLBACK_CLEANUP_RETURN_HANDLE_STATUS,
    handleSequence: sequence,
    sourceAction: REF_ACTION_ATTACH,
    sourceTokenPhase: metadata.tokenPhase,
    sourceTokenTarget: metadata.tokenTarget,
    exposesRefValue: false,
    exposesRefCleanup: false,
    exposesHostNode: false,
    exposesLatestProps: false
  });

  cleanupReturnHandlePayloads.set(
    handle,
    freezeRecord({
      cleanupReturn,
      fiber: metadata.fiber,
      hostInstanceToken: metadata.hostInstanceToken,
      hostOwner: metadata.hostOwner,
      ref: metadata.ref,
      refHandle: metadata.refHandle,
      rootOwner: metadata.rootOwner,
      sourceToken: metadata.sourceToken,
      stateNode: metadata.stateNode
    })
  );
  const previousHandle = cleanupReturnHandlesByRefHandle.get(
    metadata.refHandle
  );
  if (previousHandle !== undefined) {
    markRefCleanupReturnHandleConsumed(previousHandle);
  }
  cleanupReturnHandlesByRefHandle.set(metadata.refHandle, handle);
  return handle;
}

function resolveStoredRefCleanupForDetachPayload(payload) {
  if (payload.refCleanup !== null) {
    return freezeRecord({
      refCleanup: payload.refCleanup,
      refCleanupHandle: payload.refCleanupHandle,
      refCleanupSource: payload.refCleanupSource
    });
  }

  const storedHandle = cleanupReturnHandlesByRefHandle.get(payload.refHandle);
  if (storedHandle === undefined) {
    return freezeRecord({
      refCleanup: null,
      refCleanupHandle: null,
      refCleanupSource: REF_CLEANUP_SOURCE_NONE
    });
  }

  const handlePayload = assertRefCleanupHandleForMetadata(storedHandle, payload);
  return freezeRecord({
    refCleanup: handlePayload.cleanupReturn,
    refCleanupHandle: storedHandle,
    refCleanupSource: REF_CLEANUP_SOURCE_HANDLE
  });
}

function assertRefCleanupHandleForMetadata(handle, metadata) {
  const handlePayload = getPrivateRefCallbackCleanupReturnHandlePayload(handle);
  if (handlePayload === null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_REF_CLEANUP_HANDLE',
      'Ref detach metadata cleanup return handle must come from a private callback attach return.'
    );
  }

  if (consumedCleanupReturnHandles.has(handle)) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_CONSUMED_REF_CLEANUP_HANDLE',
      'Ref cleanup return handles cannot be consumed more than once.'
    );
  }

  if (
    handlePayload.rootOwner !== metadata.rootOwner ||
    handlePayload.hostOwner !== metadata.hostOwner ||
    handlePayload.hostInstanceToken !== metadata.hostInstanceToken ||
    handlePayload.refHandle !== metadata.refHandle ||
    handlePayload.ref !== metadata.ref
  ) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_REF_CLEANUP_HANDLE_MISMATCH',
      'Ref cleanup return handle does not match the detach metadata identity.'
    );
  }

  return handlePayload;
}

function markRefCleanupReturnHandleConsumed(handle) {
  if (handle === null) {
    return;
  }

  const handlePayload = getPrivateRefCallbackCleanupReturnHandlePayload(handle);
  if (handlePayload !== null) {
    const storedHandle = cleanupReturnHandlesByRefHandle.get(
      handlePayload.refHandle
    );
    if (storedHandle === handle) {
      cleanupReturnHandlesByRefHandle.delete(handlePayload.refHandle);
    }
  }
  consumedCleanupReturnHandles.add(handle);
}

function refKindForValue(ref) {
  return typeof ref === 'function' ? REF_KIND_CALLBACK : REF_KIND_OBJECT;
}

function callbackReturnStatusForValue(value) {
  if (typeof value === 'function') {
    return REF_CALLBACK_RETURN_CLEANUP;
  }

  if (value === undefined) {
    return REF_CALLBACK_RETURN_VOID;
  }

  return REF_CALLBACK_RETURN_VALUE;
}

function operationForRefAction(refKind, action) {
  if (refKind === REF_KIND_CALLBACK) {
    return action === REF_ACTION_ATTACH
      ? REF_OPERATION_CALLBACK_ATTACH
      : REF_OPERATION_CALLBACK_DETACH;
  }

  return action === REF_ACTION_ATTACH
    ? REF_OPERATION_OBJECT_ATTACH
    : REF_OPERATION_OBJECT_DETACH;
}

function tokenPhaseForAction(action) {
  return action === REF_ACTION_ATTACH
    ? REF_TOKEN_PHASE_COMMIT
    : REF_TOKEN_PHASE_DELETION;
}

function createRefCallbackGateError(code, message) {
  const error = new Error(message);
  error.name = 'FastReactDomRefCallbackGateError';
  error.code = code;
  return error;
}

function blockedCapability(id, reason) {
  return freezeRecord({
    id,
    blocked: true,
    reason
  });
}

function isWeakMapKey(value) {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function')
  );
}

function freezeArray(value) {
  return Object.freeze(value);
}

function freezeRecord(value) {
  return Object.freeze(value);
}

module.exports = {
  REF_ACTION_ATTACH,
  REF_ACTION_DETACH,
  REF_CALLBACK_ATTACH_DETACH_GATE_STATUS,
  REF_CALLBACK_COMPONENT_TREE_GATE_STATUS,
  REF_CALLBACK_CONTROLLED_INVOCATION_GATE_STATUS,
  REF_CALLBACK_CLEANUP_RETURN_HANDLE_STATUS,
  REF_CALLBACK_EXECUTION_HANDOFF_STATUS,
  REF_CALLBACK_ERROR_PROPAGATION_STATUS,
  REF_CALLBACK_HOST_OUTPUT_ORDERING_DIAGNOSTIC_STATUS,
  REF_CALLBACK_INVOCATION_ATTACH,
  REF_CALLBACK_INVOCATION_CLEANUP_RETURN,
  REF_CALLBACK_INVOCATION_NULL_DETACH,
  REF_CALLBACK_INVOCATION_SKIPPED_OBJECT_REF,
  REF_CALLBACK_INVOCATION_STATUS_OK,
  REF_CALLBACK_INVOCATION_STATUS_SKIPPED,
  REF_CALLBACK_INVOCATION_STATUS_THROWN,
  REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS,
  REF_CALLBACK_ROOT_COMMIT_METADATA_SNAPSHOT_STATUS,
  REF_CALLBACK_RETURN_CLEANUP,
  REF_CALLBACK_RETURN_NOT_APPLICABLE,
  REF_CALLBACK_RETURN_VALUE,
  REF_CALLBACK_RETURN_VOID,
  REF_CLEANUP_SOURCE_DIRECT_FUNCTION,
  REF_CLEANUP_SOURCE_HANDLE,
  REF_CLEANUP_SOURCE_NONE,
  REF_DETACH_REASON_DELETED,
  REF_DETACH_REASON_REF_CHANGED,
  REF_KIND_CALLBACK,
  REF_KIND_OBJECT,
  REF_OPERATION_CALLBACK_ATTACH,
  REF_OPERATION_CALLBACK_DETACH,
  REF_OPERATION_OBJECT_ATTACH,
  REF_OPERATION_OBJECT_DETACH,
  REF_TOKEN_PHASE_COMMIT,
  REF_TOKEN_PHASE_DELETION,
  REF_TOKEN_TARGET_INSTANCE,
  attachDetachOrdering,
  blockedErrorPropagation,
  blockedPublicRefCompatibility,
  blockedCapabilities,
  controlledInvocationBlockedCapabilities,
  createRefAttachMetadataRecord,
  createRefCallbackAttachDetachGateSnapshot,
  createRefCallbackComponentTreeGateSnapshot,
  createRefCallbackControlledInvocationGateSnapshot,
  createRefCallbackExecutionHandoffRecord,
  createRefCallbackHostOutputOrderingDiagnosticSnapshot,
  createRefCallbackRootCommitMetadataSnapshot,
  createRefDetachMetadataRecord,
  getPrivateRefCallbackAttachDetachGateRecordPayload,
  getPrivateRefCallbackAttachDetachGateSnapshotPayload,
  getPrivateRefCallbackComponentTreeGateRecordPayload,
  getPrivateRefCallbackComponentTreeGateSnapshotPayload,
  getPrivateRefCallbackControlledInvocationGateRecordPayload,
  getPrivateRefCallbackControlledInvocationGateSnapshotPayload,
  getPrivateRefCallbackCleanupReturnHandlePayload,
  getPrivateRefCallbackExecutionHandoffRecordPayload,
  getPrivateRefCallbackHostOutputOrderingDiagnosticRecordPayload,
  getPrivateRefCallbackHostOutputOrderingDiagnosticSnapshotPayload,
  getPrivateRefCallbackMetadataRecordPayload,
  getPrivateRefCallbackRootCommitMetadataSnapshotPayload,
  isPrivateRefCallbackAttachDetachGateRecord,
  isPrivateRefCallbackAttachDetachGateSnapshot,
  isPrivateRefCallbackComponentTreeGateRecord,
  isPrivateRefCallbackComponentTreeGateSnapshot,
  isPrivateRefCallbackControlledInvocationGateRecord,
  isPrivateRefCallbackControlledInvocationGateSnapshot,
  isPrivateRefCallbackCleanupReturnHandle,
  isPrivateRefCallbackExecutionHandoffRecord,
  isPrivateRefCallbackHostOutputOrderingDiagnosticRecord,
  isPrivateRefCallbackHostOutputOrderingDiagnosticSnapshot,
  isPrivateRefCallbackMetadataRecord,
  isPrivateRefCallbackRootCommitMetadataSnapshot,
  noSideEffects,
  privateDomRefCallbackAttachDetachGateRecordType,
  privateDomRefCallbackAttachDetachGateSnapshotType,
  privateDomRefCallbackComponentTreeGateRecordType,
  privateDomRefCallbackComponentTreeGateSnapshotType,
  privateDomRefCallbackControlledInvocationGateRecordType,
  privateDomRefCallbackControlledInvocationGateSnapshotType,
  privateDomRefCallbackCleanupReturnHandleType,
  privateDomRefCallbackExecutionHandoffRecordType,
  privateDomRefCallbackHostOutputOrderingDiagnosticRecordType,
  privateDomRefCallbackHostOutputOrderingDiagnosticSnapshotType,
  privateDomRefCallbackMetadataRecordType,
  privateDomRefCallbackRootCommitMetadataSnapshotType
};
