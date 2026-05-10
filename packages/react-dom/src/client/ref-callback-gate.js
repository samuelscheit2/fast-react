'use strict';

const componentTree = require('./component-tree.js');

const REF_CALLBACK_COMPONENT_TREE_GATE_STATUS =
  'blocked-until-ref-callback-execution-boundary';
const REF_ACTION_ATTACH = 'attach';
const REF_ACTION_DETACH = 'detach';
const REF_DETACH_REASON_DELETED = 'deleted';
const REF_DETACH_REASON_REF_CHANGED = 'ref-changed';
const REF_TOKEN_PHASE_COMMIT = 'commit';
const REF_TOKEN_PHASE_DELETION = 'deletion';
const REF_TOKEN_TARGET_INSTANCE = 'instance';

const privateDomRefCallbackMetadataRecordType =
  'fast.react_dom.private_ref_callback_metadata_record';
const privateDomRefCallbackComponentTreeGateSnapshotType =
  'fast.react_dom.private_ref_callback_component_tree_gate_snapshot';
const privateDomRefCallbackComponentTreeGateRecordType =
  'fast.react_dom.private_ref_callback_component_tree_gate_record';

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
  compatibilityClaimed: false
});

const metadataRecordPayloads = new WeakMap();
const gateSnapshotPayloads = new WeakMap();
const gateRecordPayloads = new WeakMap();

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

function isPrivateRefCallbackMetadataRecord(value) {
  return getPrivateRefCallbackMetadataRecordPayload(value) !== null;
}

function isPrivateRefCallbackComponentTreeGateSnapshot(value) {
  return getPrivateRefCallbackComponentTreeGateSnapshotPayload(value) !== null;
}

function isPrivateRefCallbackComponentTreeGateRecord(value) {
  return getPrivateRefCallbackComponentTreeGateRecordPayload(value) !== null;
}

function createRefCallbackMetadataRecord(options) {
  const action = normalizeAction(options.action);
  const expectedPhase = tokenPhaseForAction(action);
  const detachReason =
    action === REF_ACTION_DETACH
      ? normalizeDetachReason(options.detachReason)
      : null;

  if (action === REF_ACTION_ATTACH && options.detachReason != null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_ATTACH_DETACH_REASON',
      'Ref attach metadata must not include a detach reason.'
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
    ref: normalizeRefValue(options.ref),
    expectedLatestRef:
      'expectedLatestRef' in options ? options.expectedLatestRef : options.ref,
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
    status: 'accepted-private-ref-metadata',
    exposesRefValue: false,
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

function validateMetadataPayloadAgainstComponentTree(
  payload,
  expectedAction,
  sequence
) {
  assertTokenScope(payload, expectedAction);

  const node = componentTree.getMountedHostInstanceNodeFromToken(
    payload.hostInstanceToken
  );
  if (node === null) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_UNMOUNTED_HOST_INSTANCE',
      'Cannot validate ref metadata for an unmounted React DOM host instance token.'
    );
  }

  const rootOwner = componentTree.getRootOwnerFromHostInstanceToken(
    payload.hostInstanceToken
  );
  if (rootOwner !== payload.rootOwner) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_ROOT_OWNER_MISMATCH',
      'Ref metadata root owner does not match the component-tree host instance token.'
    );
  }

  const hostOwner = componentTree.getHostInstanceOwnerFromToken(
    payload.hostInstanceToken
  );
  if (hostOwner !== payload.hostOwner) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_HOST_OWNER_MISMATCH',
      'Ref metadata host owner does not match the component-tree host instance token.'
    );
  }

  const latestProps = componentTree.getLatestPropsFromHostInstanceToken(
    payload.hostInstanceToken
  );
  if (latestProps == null || typeof latestProps !== 'object') {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_MISSING_LATEST_PROPS',
      'Cannot validate ref metadata without mounted latest props.'
    );
  }

  if (!Object.prototype.hasOwnProperty.call(latestProps, 'ref')) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_MISSING_LATEST_REF',
      'Cannot validate ref metadata when latest props have no ref field.'
    );
  }

  if (latestProps.ref !== payload.expectedLatestRef) {
    throw createRefCallbackGateError(
      'FAST_REACT_DOM_REF_CALLBACK_GATE_LATEST_REF_MISMATCH',
      'Ref metadata does not match the component-tree latest-props ref.'
    );
  }

  const componentTreeRecord = freezeRecord({
    sequence,
    node,
    rootOwner,
    hostOwner,
    latestProps,
    latestRef: latestProps.ref,
    status: 'mounted-latest-props-validated'
  });

  return {payload, componentTreeRecord};
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
  REF_CALLBACK_COMPONENT_TREE_GATE_STATUS,
  REF_DETACH_REASON_DELETED,
  REF_DETACH_REASON_REF_CHANGED,
  REF_TOKEN_PHASE_COMMIT,
  REF_TOKEN_PHASE_DELETION,
  REF_TOKEN_TARGET_INSTANCE,
  blockedCapabilities,
  createRefAttachMetadataRecord,
  createRefCallbackComponentTreeGateSnapshot,
  createRefDetachMetadataRecord,
  getPrivateRefCallbackComponentTreeGateRecordPayload,
  getPrivateRefCallbackComponentTreeGateSnapshotPayload,
  getPrivateRefCallbackMetadataRecordPayload,
  isPrivateRefCallbackComponentTreeGateRecord,
  isPrivateRefCallbackComponentTreeGateSnapshot,
  isPrivateRefCallbackMetadataRecord,
  noSideEffects,
  privateDomRefCallbackComponentTreeGateRecordType,
  privateDomRefCallbackComponentTreeGateSnapshotType,
  privateDomRefCallbackMetadataRecordType
};
