'use strict';

const {
  compatibilityTarget,
  unimplementedCode
} = require('../placeholder-utils.js');
const internalsGate = require('./resource-form-internals-gate.js');
const rootBridge = require('./client/root-bridge.js');

const resourceFormRootBridgeGateSchemaVersion = 1;
const resourceFormRootBridgeBlockedGateId =
  'resource-form-root-bridge-blocked-gate-1';
const resourceFormRootBoundaryRecordType =
  'fast.react_dom.resource_form_root_boundary_record';
const publicRootFacadeBlockedGateId =
  'react-dom-root-public-facade-blocked-gate-1';
const publicRootFacadeBlockedStatus =
  'blocked-public-root-facade-placeholder';
const privateRootBridgeRecordOnlyStatus =
  'blocked-private-root-bridge-record-only';
const privateSourceAdapterBlockedStatus =
  'blocked-private-source-adapter';
const privateControlledValueTrackerBlockedStatus =
  'blocked-private-controlled-value-tracker-metadata-only';
const rootBoundaryInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ROOT_BOUNDARY_INVALID_RECORD';
const rootBoundaryInvalidRootMetadataCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ROOT_BOUNDARY_INVALID_ROOT_METADATA';
const rootBoundaryInvalidPublicMetadataCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ROOT_BOUNDARY_INVALID_PUBLIC_METADATA';

const boundaryRecordPayloads = new WeakMap();

const rootBlockedFlagFields = freezeArray([
  'nativeExecution',
  'reconcilerExecution',
  'domMutation',
  'markerWrites',
  'listenerInstallation',
  'hydration',
  'eventDispatch',
  'compatibilityClaimed'
]);

const sourceAdapterBehaviorAreas = freezeArray([
  'resource-hint',
  'form-action',
  'controlled-form'
]);

const rootBoundarySideEffects = freezeRecord({
  ...internalsGate.noSideEffects,
  privateRootBridgeExecuted: false,
  publicRootFacadeCreated: false,
  sourceAdaptersInvoked: false
});

function describeResourceFormRootBridgeBlockedGate() {
  return freezeRecord({
    schemaVersion: resourceFormRootBridgeGateSchemaVersion,
    gateId: resourceFormRootBridgeBlockedGateId,
    compatibilityTarget,
    status: internalsGate.unsupportedStatus,
    unsupportedCode: unimplementedCode,
    publicRootBoundary: describePublicRootBoundary(),
    privateRootBridgeBoundary: describePrivateRootBridgeBoundary(),
    sourceAdapterBoundary: describeSourceAdapterBoundary(null),
    sideEffects: rootBoundarySideEffects
  });
}

function recordResourceFormRootBridgeBlockedRequest(record, options) {
  const request = assertResourceFormGateRecord(record);
  const rootBridgeBoundary = describePrivateRootBridgeBoundary(
    options && options.rootBridgeAdmission
  );
  const publicRootBoundary = describePublicRootBoundary(options);
  const sourceAdapterBoundary = describeSourceAdapterBoundary(
    request.behaviorArea
  );

  const payload = freezeRecord({
    $$typeof: resourceFormRootBoundaryRecordType,
    kind: 'FastReactDomResourceFormRootBoundaryRecord',
    schemaVersion: resourceFormRootBridgeGateSchemaVersion,
    gateId: resourceFormRootBridgeBlockedGateId,
    compatibilityTarget,
    status: internalsGate.unsupportedStatus,
    unsupportedCode: unimplementedCode,
    requestId: request.requestId,
    requestSequence: request.requestSequence,
    requestType: request.requestType,
    behaviorArea: request.behaviorArea,
    contractId: request.contractId,
    oracleKind: request.oracleKind,
    rootBridgeBoundary,
    publicRootBoundary,
    sourceAdapterBoundary,
    sideEffects: rootBoundarySideEffects
  });

  boundaryRecordPayloads.set(payload, payload);
  return payload;
}

function getResourceFormRootBridgeBlockedRecordPayload(record) {
  return boundaryRecordPayloads.get(record) || null;
}

function isResourceFormRootBridgeBlockedRecord(value) {
  return boundaryRecordPayloads.has(value);
}

function describePublicRootBoundary(options) {
  const gateId = getPublicRootOption(
    options,
    'publicRootGateId',
    publicRootFacadeBlockedGateId
  );
  const gateStatus = getPublicRootOption(
    options,
    'publicRootGateStatus',
    publicRootFacadeBlockedStatus
  );
  const compatibilityClaimed =
    options && Object.hasOwn(options, 'publicRootCompatibilityClaimed')
      ? options.publicRootCompatibilityClaimed
      : false;

  if (
    gateId !== publicRootFacadeBlockedGateId ||
    gateStatus !== publicRootFacadeBlockedStatus ||
    compatibilityClaimed !== false
  ) {
    throwInvalidPublicRootMetadata();
  }

  return freezeRecord({
    gateId,
    gateStatus,
    rootObjectCreated: false,
    renderReachable: false,
    unmountReachable: false,
    compatibilityClaimed: false
  });
}

function describePrivateRootBridgeBoundary(admission) {
  if (admission == null) {
    return freezeRecord({
      gateStatus: privateRootBridgeRecordOnlyStatus,
      admissionStatus: null,
      executionStatus: rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED,
      compatibilityStatus: rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED,
      admittedRootRequest: false,
      rootRequestType: null,
      operation: null,
      rootKind: rootBridge.CLIENT_ROOT_KIND,
      rootTag: rootBridge.CONCURRENT_ROOT_TAG,
      blockedCapabilities: summarizeBlockedCapabilities(
        rootBridge.ROOT_BRIDGE_BLOCKED_CAPABILITIES
      ),
      nativeExecution: false,
      reconcilerExecution: false,
      domMutation: false,
      markerWrites: false,
      listenerInstallation: false,
      hydration: false,
      eventDispatch: false,
      compatibilityClaimed: false
    });
  }

  assertRootBridgeAdmissionIsRecordOnly(admission);

  return freezeRecord({
    gateStatus: privateRootBridgeRecordOnlyStatus,
    admissionStatus: admission.admissionStatus,
    executionStatus: admission.executionStatus,
    compatibilityStatus: admission.compatibilityStatus,
    admittedRootRequest: true,
    rootRequestType: admission.requestType,
    operation: admission.operation,
    rootKind: admission.rootKind,
    rootTag: admission.rootTag,
    lifecyclePrerequisites: freezeRecord({
      accepted: admission.lifecyclePrerequisites.accepted,
      lifecycleStatusBefore:
        admission.lifecyclePrerequisites.lifecycleStatusBefore,
      lifecycleStatusAfter:
        admission.lifecyclePrerequisites.lifecycleStatusAfter,
      lifecycleTransition:
        admission.lifecyclePrerequisites.lifecycleTransition,
      operation: admission.lifecyclePrerequisites.operation,
      rootKind: admission.lifecyclePrerequisites.rootKind,
      rootTag: admission.lifecyclePrerequisites.rootTag
    }),
    blockedCapabilities: summarizeBlockedCapabilities(
      admission.blockedCapabilities
    ),
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });
}

function describeSourceAdapterBoundary(behaviorArea) {
  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorAreas: sourceAdapterBehaviorAreas,
    adaptersInvoked: false,
    rawTargetCaptured: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    controlledValueTrackerBoundary:
      describeControlledValueTrackerBoundary(behaviorArea)
  });
}

function describeControlledValueTrackerBoundary(behaviorArea) {
  return freezeRecord({
    gateStatus: privateControlledValueTrackerBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'controlled-form',
    appliesToRequest: behaviorArea === 'controlled-form',
    metadataGateAvailable: true,
    trackerRecordsAccepted:
      behaviorArea === null || behaviorArea === 'controlled-form',
    liveHostNodeRequired: false,
    rawTargetCaptured: false,
    trackerAttached: false,
    hostValueRead: false,
    hostValueWritten: false,
    postEventRestoreQueued: false,
    publicControlledBehaviorEnabled: false,
    compatibilityClaimed: false
  });
}

function assertResourceFormGateRecord(record) {
  const request =
    internalsGate.getPrivateResourceFormActionGateRecordPayload(record);
  if (request !== null) {
    return request;
  }

  const error = new Error(
    'Expected a private React DOM resource/form gate request record.'
  );
  error.name = 'FastReactDomResourceFormRootBoundaryError';
  error.code = rootBoundaryInvalidRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function assertRootBridgeAdmissionIsRecordOnly(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidRootBridgeMetadata();
  }

  if (
    admission.admissionStatus !== rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED ||
    admission.executionStatus !== rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED ||
    admission.compatibilityStatus !==
      rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED ||
    admission.rootKind !== rootBridge.CLIENT_ROOT_KIND ||
    admission.rootTag !== rootBridge.CONCURRENT_ROOT_TAG
  ) {
    throwInvalidRootBridgeMetadata();
  }

  for (const field of rootBlockedFlagFields) {
    if (admission[field] !== false) {
      throwInvalidRootBridgeMetadata();
    }
  }

  const lifecycle = admission.lifecyclePrerequisites;
  if (
    lifecycle == null ||
    lifecycle.accepted !== true ||
    lifecycle.rootKind !== rootBridge.CLIENT_ROOT_KIND ||
    lifecycle.rootTag !== rootBridge.CONCURRENT_ROOT_TAG
  ) {
    throwInvalidRootBridgeMetadata();
  }

  assertBlockedCapabilities(admission.blockedCapabilities);
}

function assertBlockedCapabilities(capabilities) {
  if (!Array.isArray(capabilities)) {
    throwInvalidRootBridgeMetadata();
  }

  const expectedById = new Map(
    rootBridge.ROOT_BRIDGE_BLOCKED_CAPABILITIES.map((capability) => [
      capability.id,
      capability
    ])
  );

  if (capabilities.length !== expectedById.size) {
    throwInvalidRootBridgeMetadata();
  }

  for (const capability of capabilities) {
    const expected = expectedById.get(capability && capability.id);
    if (
      expected === undefined ||
      capability.blocked !== true ||
      capability.reason !== expected.reason
    ) {
      throwInvalidRootBridgeMetadata();
    }
  }
}

function summarizeBlockedCapabilities(capabilities) {
  assertBlockedCapabilities(capabilities);
  return freezeArray(
    capabilities.map((capability) =>
      freezeRecord({
        id: capability.id,
        blocked: true,
        reason: capability.reason
      })
    )
  );
}

function getPublicRootOption(options, key, fallback) {
  if (options == null || !Object.hasOwn(options, key)) {
    return fallback;
  }
  return options[key];
}

function throwInvalidRootBridgeMetadata() {
  const error = new Error(
    'Expected accepted private root bridge metadata to remain record-only.'
  );
  error.name = 'FastReactDomResourceFormRootBoundaryError';
  error.code = rootBoundaryInvalidRootMetadataCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function throwInvalidPublicRootMetadata() {
  const error = new Error(
    'Expected public root facade metadata to remain blocked.'
  );
  error.name = 'FastReactDomResourceFormRootBoundaryError';
  error.code = rootBoundaryInvalidPublicMetadataCode;
  error.compatibilityTarget = compatibilityTarget;
  throw error;
}

function freezeArray(value) {
  return Object.freeze(value.slice());
}

function freezeRecord(value) {
  return Object.freeze(value);
}

module.exports = Object.assign({}, internalsGate, {
  describeResourceFormRootBridgeBlockedGate,
  getResourceFormRootBridgeBlockedRecordPayload,
  isResourceFormRootBridgeBlockedRecord,
  privateControlledValueTrackerBlockedStatus,
  privateRootBridgeRecordOnlyStatus,
  privateSourceAdapterBlockedStatus,
  publicRootFacadeBlockedGateId,
  publicRootFacadeBlockedStatus,
  recordResourceFormRootBridgeBlockedRequest,
  resourceFormRootBoundaryRecordType,
  resourceFormRootBridgeBlockedGateId,
  resourceFormRootBridgeGateSchemaVersion,
  rootBoundaryInvalidPublicMetadataCode,
  rootBoundaryInvalidRecordCode,
  rootBoundaryInvalidRootMetadataCode,
  rootBoundarySideEffects
});
