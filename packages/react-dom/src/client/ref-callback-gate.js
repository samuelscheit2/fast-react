'use strict';

const componentTree = require('./component-tree.js');

const REF_CALLBACK_COMPONENT_TREE_GATE_STATUS =
  'blocked-until-ref-callback-execution-boundary';
const REF_CALLBACK_ATTACH_DETACH_GATE_STATUS =
  'blocked-until-ref-callback-attach-detach-execution';
const REF_CALLBACK_CONTROLLED_INVOCATION_GATE_STATUS =
  'private-controlled-ref-callback-invocation-recorded';
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
const REF_TOKEN_PHASE_COMMIT = 'commit';
const REF_TOKEN_PHASE_DELETION = 'deletion';
const REF_TOKEN_TARGET_INSTANCE = 'instance';

const privateDomRefCallbackMetadataRecordType =
  'fast.react_dom.private_ref_callback_metadata_record';
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
const gateSnapshotPayloads = new WeakMap();
const gateRecordPayloads = new WeakMap();
const attachDetachGateSnapshotPayloads = new WeakMap();
const attachDetachGateRecordPayloads = new WeakMap();
const controlledInvocationGateSnapshotPayloads = new WeakMap();
const controlledInvocationGateRecordPayloads = new WeakMap();

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
    cleanupInvocationAttemptCount: metrics.cleanupInvocationAttemptCount,
    cleanupInvocationErrorCount: metrics.cleanupInvocationErrorCount,
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

function getPrivateRefCallbackMetadataRecordPayload(record) {
  return isWeakMapKey(record)
    ? metadataRecordPayloads.get(record) || null
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

function isPrivateRefCallbackMetadataRecord(value) {
  return getPrivateRefCallbackMetadataRecordPayload(value) !== null;
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

function createRefCallbackMetadataRecord(options) {
  const action = normalizeAction(options.action);
  const expectedPhase = tokenPhaseForAction(action);
  const detachReason =
    action === REF_ACTION_DETACH
      ? normalizeDetachReason(options.detachReason)
      : null;
  const ref = normalizeRefValue(options.ref);
  const refCleanup = normalizeRefCleanupValue(options.refCleanup);

  if (action === REF_ACTION_ATTACH && options.detachReason != null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_ATTACH_DETACH_REASON',
      'Ref attach metadata must not include a detach reason.'
    );
  }

  if (action === REF_ACTION_ATTACH && refCleanup !== null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_ATTACH_REF_CLEANUP',
      'Ref attach metadata must not include a cleanup return.'
    );
  }

  if (refCleanup !== null && typeof ref !== 'function') {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_OBJECT_REF_CLEANUP',
      'Object ref metadata must not include a callback cleanup return.'
    );
  }

  const payload = freezeRecord({
    action,
    detachReason,
    rootOwner: assertRequiredOption(options.rootOwner, 'rootOwner'),
    hostOwner: assertRequiredOption(options.hostOwner, 'hostOwner'),
    hostInstanceToken: assertRequiredOption(
      options.hostInstanceToken,
      'hostInstanceToken'
    ),
    fiber: assertRequiredOption(options.fiber, 'fiber'),
    stateNode: assertRequiredOption(options.stateNode, 'stateNode'),
    refHandle: assertRequiredOption(options.refHandle, 'refHandle'),
    ref,
    refCleanup,
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

  return normalizeMetadataSnapshot(metadataSnapshot);
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
    cleanupReturnStatus: invocation.cleanupReturnStatus,
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
    refCleanup: payload.refCleanup,
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
      returnValue: undefined,
      cleanupReturn: null,
      error: null
    });
  }

  if (payload.action === REF_ACTION_DETACH && payload.refCleanup !== null) {
    return runControlledCleanupReturn(payload.refCleanup);
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
      returnValue,
      cleanupReturn: cleanupReturnRecorded ? returnValue : null,
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
      returnValue: undefined,
      cleanupReturn: null,
      error
    });
  }
}

function runControlledCleanupReturn(refCleanup) {
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
      returnValue,
      cleanupReturn: refCleanup,
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
      returnValue: undefined,
      cleanupReturn: refCleanup,
      error
    });
  }
}

function summarizeControlledInvocationResults(invocationResults) {
  const metrics = {
    callbackRefRecordCount: 0,
    objectRefRecordCount: 0,
    callbackInvocationAttemptCount: 0,
    callbackInvocationErrorCount: 0,
    callbackCleanupReturnCount: 0,
    cleanupInvocationAttemptCount: 0,
    cleanupInvocationErrorCount: 0,
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

    if (invocation.kind === REF_CALLBACK_INVOCATION_NULL_DETACH) {
      metrics.callbackNullDetachAttemptCount++;
    }

    if (invocation.kind === REF_CALLBACK_INVOCATION_SKIPPED_OBJECT_REF) {
      metrics.objectRefSkippedCount++;
    }
  }

  return metrics;
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

function normalizeRefCleanupValue(refCleanup) {
  if (refCleanup == null) {
    return null;
  }

  if (typeof refCleanup === 'function') {
    return refCleanup;
  }

  throw createRefCallbackGateError(
    'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_REF_CLEANUP',
    'Ref detach metadata cleanup return must be a function.'
  );
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
  REF_CALLBACK_ERROR_PROPAGATION_STATUS,
  REF_CALLBACK_INVOCATION_ATTACH,
  REF_CALLBACK_INVOCATION_CLEANUP_RETURN,
  REF_CALLBACK_INVOCATION_NULL_DETACH,
  REF_CALLBACK_INVOCATION_SKIPPED_OBJECT_REF,
  REF_CALLBACK_INVOCATION_STATUS_OK,
  REF_CALLBACK_INVOCATION_STATUS_SKIPPED,
  REF_CALLBACK_INVOCATION_STATUS_THROWN,
  REF_CALLBACK_PUBLIC_REF_COMPATIBILITY_STATUS,
  REF_CALLBACK_RETURN_CLEANUP,
  REF_CALLBACK_RETURN_NOT_APPLICABLE,
  REF_CALLBACK_RETURN_VALUE,
  REF_CALLBACK_RETURN_VOID,
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
  createRefDetachMetadataRecord,
  getPrivateRefCallbackAttachDetachGateRecordPayload,
  getPrivateRefCallbackAttachDetachGateSnapshotPayload,
  getPrivateRefCallbackComponentTreeGateRecordPayload,
  getPrivateRefCallbackComponentTreeGateSnapshotPayload,
  getPrivateRefCallbackControlledInvocationGateRecordPayload,
  getPrivateRefCallbackControlledInvocationGateSnapshotPayload,
  getPrivateRefCallbackMetadataRecordPayload,
  isPrivateRefCallbackAttachDetachGateRecord,
  isPrivateRefCallbackAttachDetachGateSnapshot,
  isPrivateRefCallbackComponentTreeGateRecord,
  isPrivateRefCallbackComponentTreeGateSnapshot,
  isPrivateRefCallbackControlledInvocationGateRecord,
  isPrivateRefCallbackControlledInvocationGateSnapshot,
  isPrivateRefCallbackMetadataRecord,
  noSideEffects,
  privateDomRefCallbackAttachDetachGateRecordType,
  privateDomRefCallbackAttachDetachGateSnapshotType,
  privateDomRefCallbackComponentTreeGateRecordType,
  privateDomRefCallbackComponentTreeGateSnapshotType,
  privateDomRefCallbackControlledInvocationGateRecordType,
  privateDomRefCallbackControlledInvocationGateSnapshotType,
  privateDomRefCallbackMetadataRecordType
};
