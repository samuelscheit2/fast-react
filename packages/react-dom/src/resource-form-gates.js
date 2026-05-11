'use strict';

const {
  compatibilityTarget,
  unimplementedCode
} = require('../placeholder-utils.js');
const internalsGate = require('./resource-form-internals-gate.js');
const formActions = require('./shared/form-actions.js');
const rootBridge = require('./client/root-bridge.js');

const hasOwn = Object.prototype.hasOwnProperty;

const resourceFormRootBridgeGateSchemaVersion = 1;
const resourceFormRootExecutionConsumerGateSchemaVersion = 1;
const resourceFormRootBridgeBlockedGateId =
  'resource-form-root-bridge-blocked-gate-1';
const privateResourceFormRootExecutionConsumerGateId =
  'resource-form-root-execution-consumer-private-gate-1';
const privateResourceFormRootExecutionConsumerStatus =
  'consumed-private-resource-form-root-execution-evidence';
const privateResourceFormRootExecutionConsumerCompatibilityBlockedStatus =
  'blocked-private-resource-form-root-execution-consumer-compatibility';
const resourceFormRootBoundaryRecordType =
  'fast.react_dom.resource_form_root_boundary_record';
const resourceFormRootExecutionConsumerRecordType =
  'fast.react_dom.resource_form_root_execution_consumer_record';
const resourceFormPortalCommitBoundaryRecordType =
  'fast.react_dom.resource_form_portal_commit_boundary_record';
const resourceFormPortalFakeDomMountBoundaryRecordType =
  'fast.react_dom.resource_form_portal_fake_dom_mount_boundary_record';
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
const privatePortalCommitResourceBlockedStatus =
  'blocked-private-portal-commit-resource-side-effects';
const privatePortalFakeDomMountResourceBlockedStatus =
  'blocked-private-portal-fake-dom-mount-resource-side-effects';
const rootBoundaryInvalidRecordCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ROOT_BOUNDARY_INVALID_RECORD';
const rootBoundaryInvalidPortalCommitHandoffCode =
  'FAST_REACT_DOM_RESOURCE_FORM_PORTAL_COMMIT_INVALID_HANDOFF';
const rootBoundaryInvalidRootMetadataCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ROOT_BOUNDARY_INVALID_ROOT_METADATA';
const rootBoundaryInvalidPublicMetadataCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ROOT_BOUNDARY_INVALID_PUBLIC_METADATA';
const rootBoundaryInvalidRootExecutionConsumerAdmissionCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ROOT_EXECUTION_CONSUMER_INVALID_ADMISSION';
const rootBoundaryInvalidRootExecutionConsumerRecordCode =
  'FAST_REACT_DOM_RESOURCE_FORM_ROOT_EXECUTION_CONSUMER_INVALID_RECORD';
const privateResourceFormExecutionAdmissionLedgerId =
  'private-admission-850-resource-form-execution-ledger-1';
const privateResourceFormExecutionAdmissionLedgerStatus =
  'recognized-worker-829-830-resource-form-private-execution-public-blocked';
const privateResourceFormExecutionAdmissionLedgerSource =
  'tests/conformance/src/private-admission-850-resource-form-execution-ledger.mjs';
const privateResourceFormExecutionAdmissionSourceTokenPolicy =
  'source-owned-identifiers-statuses-functions-fields-and-constants';
const privateResourceFormExecutionAdmissionWorkerIds = freezeArray([
  'worker-829-resource-root-map-storage-private-execution',
  'worker-830-form-action-fulfilled-reset-fake-commit',
  'worker-850-resource-form-execution-admission-ledger'
]);

const boundaryRecordPayloads = new WeakMap();
const rootExecutionConsumerRecordPayloads = new WeakMap();
const portalCommitBoundaryRecordPayloads = new WeakMap();
const portalFakeDomMountBoundaryRecordPayloads = new WeakMap();
const consumedRootMapStorageExecutionRecords = new WeakSet();
const consumedFulfilledResetExecutionRecords = new WeakSet();

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
  ...internalsGate.resourceHintDispatcherSideEffects,
  ...internalsGate.resourceHintFakeDomAdapterSideEffects,
  ...internalsGate.resourceHintFakeDomInsertionBlockedSideEffects,
  ...internalsGate.resourceHintHeadBoundaryBlockedSideEffects,
  ...internalsGate.resourceHintHeadClearRetainBlockedSideEffects,
  ...internalsGate.resourceHintPreloadPreinitOrderBlockedSideEffects,
  ...internalsGate.resourceHintStylesheetPrecedenceBlockedSideEffects,
  ...internalsGate.resourceHintResourceMapCommitBlockedSideEffects,
  ...internalsGate.resourceHintRootMapStoragePreflightBlockedSideEffects,
  ...internalsGate.resourceHintRootMapStorageBlockedSideEffects,
  ...internalsGate.resourceHintStylesheetLoadErrorStateBlockedSideEffects,
  ...internalsGate.formActionResetDispatcherBlockedSideEffects,
  ...internalsGate.formActionEventExtractionBlockedSideEffects,
  ...internalsGate.formActionResetQueueCommitBlockedSideEffects,
  ...formActions.formActionSubmitDispatchBlockedSideEffects,
  ...formActions.formActionSubmitResetExecutionBlockedSideEffects,
  ...formActions.formActionCallbackActionPreflightBlockedSideEffects,
  ...formActions.formActionAsyncCallbackExecutionBlockedSideEffects,
  ...formActions.formActionFulfilledResetExecutionBlockedSideEffects,
  ...formActions.formActionRejectedErrorPreflightBlockedSideEffects,
  ...internalsGate.controlledInputValueTrackerSideEffects,
  privateRootBridgeExecuted: false,
  publicRootFacadeCreated: false,
  sourceAdaptersInvoked: false
});

const portalCommitResourceSideEffects = freezeRecord({
  ...rootBoundarySideEffects,
  portalContainerMutated: false,
  portalContainerChildrenReplaced: false,
  portalFakeDomMountDiagnosticApplied: false,
  portalPrepareMountCalled: false,
  portalListenersInstalled: false
});

const portalFakeDomMountResourceSideEffects = freezeRecord({
  ...rootBoundarySideEffects,
  portalContainerMutated: true,
  portalContainerChildrenReplaced: false,
  portalFakeDomMountDiagnosticApplied: true,
  portalPrepareMountCalled: false,
  portalListenersInstalled: false
});

const rootExecutionConsumerSideEffects = freezeRecord({
  ...rootBoundarySideEffects,
  rootExecutionConsumerInvoked: true,
  worker850AdmissionLedgerBoundaryRecorded: true,
  resourceRootMapStorageExecutionConsumed: true,
  formFulfilledResetExecutionConsumed: true,
  deterministicFakeRootMapStorageConsumed: true,
  deterministicFakeResetStateQueueConsumed: true,
  deterministicFakeResetCommitConsumed: true,
  callerSuppliedSourceTokensAccepted: false,
  publicResourceCompatibilityClaimed: false,
  publicFormCompatibilityClaimed: false,
  publicPackageCompatibilityClaimed: false
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
    privateResourceDispatcherBoundary:
      describePrivateResourceDispatcherBoundary(null),
    privateFormActionResetDispatcherBoundary:
      describePrivateFormActionResetDispatcherBoundary(null),
    privateFormActionEventExtractionBoundary:
      describePrivateFormActionEventExtractionBoundary(null),
    privateFormActionSubmitDispatchBoundary:
      describePrivateFormActionSubmitDispatchBoundary(null),
    privateFormActionSubmitResetExecutionBoundary:
      describePrivateFormActionSubmitResetExecutionBoundary(null),
    privateFormActionCallbackActionPreflightBoundary:
      describePrivateFormActionCallbackActionPreflightBoundary(null),
    privateFormActionAsyncCallbackExecutionBoundary:
      describePrivateFormActionAsyncCallbackExecutionBoundary(null),
    privateFormActionFulfilledResetExecutionBoundary:
      describePrivateFormActionFulfilledResetExecutionBoundary(null),
    privateFormActionRejectedErrorPreflightBoundary:
      describePrivateFormActionRejectedErrorPreflightBoundary(null),
    privateResourceFormRootExecutionConsumerBoundary:
      describePrivateResourceFormRootExecutionConsumerBoundary(),
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
  const privateResourceDispatcherBoundary =
    describePrivateResourceDispatcherBoundary(request.behaviorArea);
  const privateFormActionResetDispatcherBoundary =
    describePrivateFormActionResetDispatcherBoundary(request.behaviorArea);
  const privateFormActionEventExtractionBoundary =
    describePrivateFormActionEventExtractionBoundary(request.behaviorArea);
  const privateFormActionSubmitDispatchBoundary =
    describePrivateFormActionSubmitDispatchBoundary(request.behaviorArea);
  const privateFormActionSubmitResetExecutionBoundary =
    describePrivateFormActionSubmitResetExecutionBoundary(
      request.behaviorArea
    );
  const privateFormActionCallbackActionPreflightBoundary =
    describePrivateFormActionCallbackActionPreflightBoundary(
      request.behaviorArea
    );
  const privateFormActionAsyncCallbackExecutionBoundary =
    describePrivateFormActionAsyncCallbackExecutionBoundary(
      request.behaviorArea
    );
  const privateFormActionFulfilledResetExecutionBoundary =
    describePrivateFormActionFulfilledResetExecutionBoundary(
      request.behaviorArea
    );
  const privateFormActionRejectedErrorPreflightBoundary =
    describePrivateFormActionRejectedErrorPreflightBoundary(
      request.behaviorArea
    );
  const privateResourceFormRootExecutionConsumerBoundary =
    describePrivateResourceFormRootExecutionConsumerBoundary();

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
    privateResourceDispatcherBoundary,
    privateFormActionResetDispatcherBoundary,
    privateFormActionEventExtractionBoundary,
    privateFormActionSubmitDispatchBoundary,
    privateFormActionSubmitResetExecutionBoundary,
    privateFormActionCallbackActionPreflightBoundary,
    privateFormActionAsyncCallbackExecutionBoundary,
    privateFormActionFulfilledResetExecutionBoundary,
    privateFormActionRejectedErrorPreflightBoundary,
    privateResourceFormRootExecutionConsumerBoundary,
    sourceAdapterBoundary,
    sideEffects: rootBoundarySideEffects
  });

  boundaryRecordPayloads.set(payload, payload);
  return payload;
}

function recordResourceFormPortalCommitBlockedRequest(portalCommitHandoff) {
  assertPortalCommitHandoffIsRecordOnly(portalCommitHandoff);

  const payload = freezeRecord({
    $$typeof: resourceFormPortalCommitBoundaryRecordType,
    kind: 'FastReactDomResourceFormPortalCommitBoundaryRecord',
    schemaVersion: resourceFormRootBridgeGateSchemaVersion,
    gateId: resourceFormRootBridgeBlockedGateId,
    compatibilityTarget,
    status: internalsGate.unsupportedStatus,
    unsupportedCode: unimplementedCode,
    resourceSideEffectStatus: privatePortalCommitResourceBlockedStatus,
    portalCommitHandoffId: portalCommitHandoff.commitHandoffId,
    portalCommitHandoffStatus: portalCommitHandoff.handoffStatus,
    portalCommitStatus: portalCommitHandoff.commitStatus,
    portalBoundaryId: portalCommitHandoff.sourceBoundaryId,
    sourceRequestId: portalCommitHandoff.sourceRequestId,
    sourceRequestSequence: portalCommitHandoff.sourceRequestSequence,
    sourceRequestType: portalCommitHandoff.sourceRequestType,
    rootId: portalCommitHandoff.rootId,
    rootKind: portalCommitHandoff.rootKind,
    rootTag: portalCommitHandoff.rootTag,
    rootBridgeBoundary:
      describePrivatePortalCommitRootBridgeBoundary(portalCommitHandoff),
    privateResourceDispatcherBoundary:
      describePrivateResourceDispatcherBoundary('resource-hint'),
    sourceAdapterBoundary: describeSourceAdapterBoundary('resource-hint'),
    sideEffects: portalCommitResourceSideEffects
  });

  portalCommitBoundaryRecordPayloads.set(
    payload,
    freezeRecord({
      portalCommitHandoff
    })
  );
  return payload;
}

function recordResourceFormPortalFakeDomMountBlockedRequest(mountRecord) {
  assertPortalFakeDomMountDiagnosticIsResourceBlocked(mountRecord);

  const payload = freezeRecord({
    $$typeof: resourceFormPortalFakeDomMountBoundaryRecordType,
    kind: 'FastReactDomResourceFormPortalFakeDomMountBoundaryRecord',
    schemaVersion: resourceFormRootBridgeGateSchemaVersion,
    gateId: resourceFormRootBridgeBlockedGateId,
    compatibilityTarget,
    status: internalsGate.unsupportedStatus,
    unsupportedCode: unimplementedCode,
    resourceSideEffectStatus: privatePortalFakeDomMountResourceBlockedStatus,
    portalFakeDomMountDiagnosticId: mountRecord.mountDiagnosticId,
    portalFakeDomMountStatus: mountRecord.mountStatus,
    portalPublicMountStatus: mountRecord.publicMountStatus,
    portalCommitHandoffId: mountRecord.sourceCommitHandoffId,
    portalCommitStatus: mountRecord.sourceCommitStatus,
    portalBoundaryId: mountRecord.sourceBoundaryId,
    sourceRequestId: mountRecord.sourceRequestId,
    sourceRequestSequence: mountRecord.sourceRequestSequence,
    sourceRequestType: mountRecord.sourceRequestType,
    rootId: mountRecord.rootId,
    rootKind: mountRecord.rootKind,
    rootTag: mountRecord.rootTag,
    rootBridgeBoundary:
      describePrivatePortalFakeDomMountRootBridgeBoundary(mountRecord),
    privateResourceDispatcherBoundary:
      describePrivateResourceDispatcherBoundary('resource-hint'),
    sourceAdapterBoundary: describeSourceAdapterBoundary('resource-hint'),
    sideEffects: portalFakeDomMountResourceSideEffects
  });

  portalFakeDomMountBoundaryRecordPayloads.set(
    payload,
    freezeRecord({
      mountRecord
    })
  );
  return payload;
}

function createResourceFormRootExecutionConsumerGate(options) {
  const requestIdPrefix =
    options && typeof options.requestIdPrefix === 'string'
      ? options.requestIdPrefix
      : 'resource-form-root-execution-consumer';
  const gateState = {
    requestIdPrefix,
    nextRequestSequence: 1
  };

  return Object.freeze({
    recordRootExecutionConsumer(
      rootBridgeAdmission,
      resourceRootMapStorageExecutionRecord,
      formFulfilledResetExecutionRecord,
      admission
    ) {
      return recordResourceFormRootExecutionConsumerWithGate(
        gateState,
        rootBridgeAdmission,
        resourceRootMapStorageExecutionRecord,
        formFulfilledResetExecutionRecord,
        admission
      );
    }
  });
}

function recordResourceFormRootExecutionConsumerWithGate(
  gateState,
  rootBridgeAdmission,
  resourceRootMapStorageExecutionRecord,
  formFulfilledResetExecutionRecord,
  admission
) {
  assertRootBridgeAdmissionIsRecordOnly(rootBridgeAdmission);
  const normalizedAdmission =
    normalizeResourceFormRootExecutionConsumerAdmission(admission);
  const resourceExecution =
    assertResourceRootMapStorageExecutionForRootConsumer(
      resourceRootMapStorageExecutionRecord,
      rootBridgeAdmission
    );
  const fulfilledResetExecution =
    assertFormFulfilledResetExecutionForRootConsumer(
      formFulfilledResetExecutionRecord
    );

  if (
    consumedRootMapStorageExecutionRecords.has(
      resourceRootMapStorageExecutionRecord
    )
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'resource root-map storage execution was already consumed by a root boundary consumer'
    );
  }
  if (
    consumedFulfilledResetExecutionRecords.has(
      formFulfilledResetExecutionRecord
    )
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'form fulfilled reset execution was already consumed by a root boundary consumer'
    );
  }

  const consumerSequence = gateState.nextRequestSequence++;
  const consumerId = `${gateState.requestIdPrefix}:${consumerSequence}`;
  const resourceBoundary =
    createResourceRootMapStorageConsumerBoundary(resourceExecution);
  const formBoundary =
    createFormFulfilledResetConsumerBoundary(fulfilledResetExecution);

  const payload = freezeRecord({
    $$typeof: resourceFormRootExecutionConsumerRecordType,
    kind: 'FastReactDomResourceFormRootExecutionConsumerRecord',
    schemaVersion: resourceFormRootExecutionConsumerGateSchemaVersion,
    gateId: privateResourceFormRootExecutionConsumerGateId,
    compatibilityTarget,
    status: privateResourceFormRootExecutionConsumerStatus,
    compatibilityStatus:
      privateResourceFormRootExecutionConsumerCompatibilityBlockedStatus,
    unsupportedCode: unimplementedCode,
    consumerId,
    consumerSequence,
    requestType: 'resource-form-root-execution-consumer.private-fake',
    rootId: rootBridgeAdmission.rootId,
    rootKind: rootBridgeAdmission.rootKind,
    rootTag: rootBridgeAdmission.rootTag,
    sourceRootBridgeAdmissionId: rootBridgeAdmission.requestId,
    sourceRootBridgeAdmissionStatus: rootBridgeAdmission.admissionStatus,
    sourceRootBridgeOperation: rootBridgeAdmission.operation,
    admission: normalizedAdmission,
    rootBridgeBoundary:
      describePrivateRootBridgeBoundary(rootBridgeAdmission),
    publicRootBoundary: describePublicRootBoundary(),
    ledgerBoundary: createResourceFormExecutionAdmissionLedgerBoundary(),
    resourceRootMapStorageBoundary: resourceBoundary,
    formFulfilledResetBoundary: formBoundary,
    sourceOwnedEvidence: freezeRecord({
      workerIds: privateResourceFormExecutionAdmissionWorkerIds,
      sourceTokenPolicy:
        privateResourceFormExecutionAdmissionSourceTokenPolicy,
      resourceRootMapStorageExecutionTokens:
        resourceBoundary.sourceOwnedTokens,
      formFulfilledResetExecutionTokens: formBoundary.sourceOwnedTokens,
      callerSuppliedAliasesAccepted: false,
      clonedEvidenceAccepted: false,
      testTitleEvidenceAccepted: false,
      errorMessageEvidenceAccepted: false,
      sourceSyntaxFragmentEvidenceAccepted: false
    }),
    publicResourceBoundary: freezeRecord({
      publicResourcesClaimed: false,
      publicResourceApisReachable: false,
      publicResourceHintDomInsertion: false,
      publicResourceMapCommitBehavior: false,
      publicResourceCompatibilityClaimed: false
    }),
    publicFormBoundary: freezeRecord({
      publicFormsClaimed: false,
      publicFormActionsEnabled: false,
      publicSubmitDispatchReachable: false,
      publicRequestFormResetReachable: false,
      actionInvoked: false,
      reactUpdateQueued: false,
      formResetCommitted: false,
      realFormReset: false,
      publicFormCompatibilityClaimed: false
    }),
    sideEffects: rootExecutionConsumerSideEffects,
    nativeExecution: false,
    reconcilerExecution: false,
    publicRootExecution: false,
    domMutation: false,
    resourceSideEffects: false,
    formSideEffects: false,
    reactUpdateQueued: false,
    compatibilityClaimed: false
  });

  consumedRootMapStorageExecutionRecords.add(
    resourceRootMapStorageExecutionRecord
  );
  consumedFulfilledResetExecutionRecords.add(
    formFulfilledResetExecutionRecord
  );
  rootExecutionConsumerRecordPayloads.set(payload, payload);
  return payload;
}

function getResourceFormRootBridgeBlockedRecordPayload(record) {
  return boundaryRecordPayloads.get(record) || null;
}

function isResourceFormRootBridgeBlockedRecord(value) {
  return boundaryRecordPayloads.has(value);
}

function getResourceFormRootExecutionConsumerRecordPayload(record) {
  return rootExecutionConsumerRecordPayloads.get(record) || null;
}

function isResourceFormRootExecutionConsumerRecord(value) {
  return rootExecutionConsumerRecordPayloads.has(value);
}

function getResourceFormPortalCommitBlockedRecordPayload(record) {
  return portalCommitBoundaryRecordPayloads.get(record) || null;
}

function isResourceFormPortalCommitBlockedRecord(value) {
  return portalCommitBoundaryRecordPayloads.has(value);
}

function getResourceFormPortalFakeDomMountBlockedRecordPayload(record) {
  return portalFakeDomMountBoundaryRecordPayloads.get(record) || null;
}

function isResourceFormPortalFakeDomMountBlockedRecord(value) {
  return portalFakeDomMountBoundaryRecordPayloads.has(value);
}

function normalizeResourceFormRootExecutionConsumerAdmission(admission) {
  if (admission == null || typeof admission !== 'object') {
    throwInvalidRootExecutionConsumerAdmission(
      'root execution consumer admission metadata must be an object'
    );
  }

  if (admission.explicitResourceFormRootExecutionConsumer !== true) {
    throwInvalidRootExecutionConsumerAdmission(
      'explicitResourceFormRootExecutionConsumer must be true'
    );
  }

  assertNoRootExecutionConsumerRawAdmissionFields(admission);
  assertNoRootExecutionConsumerPublicClaims(admission);
  assertNoRootExecutionConsumerCallerSourceTokens(admission);

  return freezeRecord({
    explicitResourceFormRootExecutionConsumer: true,
    sourceOwnedPrivateRecordsRequired: true,
    sourceOwnedLedgerBoundaryRequired: true,
    callerSuppliedSourceTokensAccepted: false,
    deterministicFakeResourceEvidenceOnly: true,
    deterministicFakeFormEvidenceOnly: true,
    publicRootTouched: false,
    publicResourcesClaimed: false,
    publicFormsClaimed: false,
    publicPackageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function assertResourceRootMapStorageExecutionForRootConsumer(
  record,
  rootBridgeAdmission
) {
  const payload =
    internalsGate.getPrivateResourceHintRootMapStorageRecordPayload(record);
  if (payload === null) {
    throwInvalidRootExecutionConsumerRecord(
      'resource root-map storage execution record must be source-owned'
    );
  }

  if (
    payload.$$typeof !==
      internalsGate.privateResourceHintRootMapStorageRecordType ||
    payload.kind !== 'FastReactDomPrivateResourceHintRootMapStorageRecord' ||
    payload.gateId !==
      internalsGate.privateResourceHintRootMapStorageGateId ||
    payload.status !== internalsGate.unsupportedStatus ||
    payload.rootMapStorageStatus !==
      internalsGate.privateResourceHintRootMapStorageStatus ||
    payload.executionStatus !==
      internalsGate.privateResourceHintRootMapStorageExecutionStatus ||
    payload.compatibilityStatus !==
      internalsGate
        .privateResourceHintRootMapStorageCompatibilityBlockedStatus ||
    payload.rootMapStorageExecutionPlan?.storageKind !==
      'react-19.2.6-resource-root-map-storage-private-execution' ||
    payload.rootMapStorageSnapshot?.snapshotKind !==
      'react-19.2.6-resource-root-map-storage-private-execution-snapshot' ||
    payload.storageAdmission?.executionKind !==
      'deterministic-private-root-map-storage-execution'
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'resource root-map storage execution record is missing source-owned Worker 829 tokens'
    );
  }

  if (
    payload.storageAdmission.rootId !== rootBridgeAdmission.rootId ||
    payload.storageAdmission.ownerRootId !== rootBridgeAdmission.rootId ||
    payload.rootMapStorageExecutionPlan.rootId !==
      rootBridgeAdmission.rootId ||
    payload.rootMapStorageExecutionPlan.ownerRootId !==
      rootBridgeAdmission.rootId ||
    payload.rootMapStorageSnapshot.rootId !== rootBridgeAdmission.rootId ||
    payload.rootMapStorageSnapshot.ownerRootId !==
      rootBridgeAdmission.rootId ||
    payload.rootMapStorageValidationBoundary?.rootId !==
      rootBridgeAdmission.rootId ||
    payload.rootMapStorageValidationBoundary?.ownerRootId !==
      rootBridgeAdmission.rootId
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'resource root-map storage execution rootId must match root bridge admission'
    );
  }

  assertResourceRootMapStorageExecutionPlanForRootConsumer(payload);
  return payload;
}

function assertResourceRootMapStorageExecutionPlanForRootConsumer(payload) {
  const rows = payload.rootMapStorageExecutionRows;
  const styleRows = payload.hoistableStylesRootMapExecutionRows;
  const scriptRows = payload.hoistableScriptsRootMapExecutionRows;
  const snapshot = payload.rootMapStorageSnapshot;
  const validation = payload.rootMapStorageValidationBoundary;
  const plan = payload.rootMapStorageExecutionPlan;

  if (
    !Array.isArray(rows) ||
    rows.length === 0 ||
    !Array.isArray(styleRows) ||
    !Array.isArray(scriptRows) ||
    plan.rootMapStorageExecutionRowCount !== rows.length ||
    plan.canonicalRootMapStorageRowCount !== rows.length ||
    snapshot.rootMapStorageExecutionRowCount !== rows.length ||
    snapshot.hoistableStylesMapSize !== styleRows.length ||
    snapshot.hoistableScriptsMapSize !== scriptRows.length ||
    validation?.status !==
      'validated-private-resource-root-map-storage-execution' ||
    validation.checkedRowCount !== rows.length ||
    validation.preflightRecordConsumed !== true ||
    validation.clonedPreflightRecordRejected !== true ||
    validation.fakeRootStorageTargetsRejected !== true ||
    validation.realResourceMapsMutated !== false ||
    validation.preloadPropsMapMutated !== false ||
    validation.compatibilityClaimed !== false
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'resource root-map storage execution rows must match source-owned Worker 829 shape'
    );
  }

  rows.forEach((row, index) => {
    if (
      row == null ||
      row.rowType !== 'root-map-storage-execution' ||
      row.rowId !== `root-map-storage-execution-${index}` ||
      row.storedEntryId !== `root-map-storage-entry-${index}` ||
      row.rootId !== payload.storageAdmission.rootId ||
      row.ownerRootId !== payload.storageAdmission.ownerRootId ||
      row.storedInRootMap !== true ||
      row.canonicalRootMapStorageRow !== true ||
      row.rootStoragePreflighted !== true ||
      row.rootResourceStorageCreated !== true ||
      row.rootResourceStorageMutated !== true ||
      row.fakeRootMapEntryCreated !== true ||
      row.fakeRootMapEntryMutated !== true ||
      row.realResourceMapCreated !== false ||
      row.realResourceMapMutated !== false ||
      row.preloadPropsMapCreated !== false ||
      row.preloadPropsMapMutated !== false ||
      row.publicResourceHintDomInsertion !== false ||
      row.publicResourceMapCommitBehavior !== false ||
      row.publicScriptModuleResourceDispatch !== false ||
      row.publicStylesheetLoadStateDispatch !== false ||
      row.compatibilityClaimed !== false
    ) {
      throwInvalidRootExecutionConsumerRecord(
        'resource root-map storage execution rows must stay canonical fake root-map rows'
      );
    }
  });

  assertRootMapStorageSnapshotEntriesForRootConsumer(
    snapshot.hoistableStylesMapEntries,
    rows
  );
  assertRootMapStorageSnapshotEntriesForRootConsumer(
    snapshot.hoistableScriptsMapEntries,
    rows
  );

  if (
    plan.rootResourceStorageShapeRecorded !== true ||
    plan.rootMapStorageSnapshotRecorded !== true ||
    plan.deterministicFakeRootMapStorageExecuted !== true ||
    plan.rootResourceStorageCreated !== true ||
    plan.rootResourceStorageMutated !== true ||
    plan.fakeResourceMapsCreated !== true ||
    plan.fakeResourceMapsMutated !== true ||
    plan.realResourceMapsCreated !== false ||
    plan.realResourceMapsMutated !== false ||
    plan.preloadPropsMapCreated !== false ||
    plan.preloadPropsMapMutated !== false ||
    plan.publicResourceHintDomInsertion !== false ||
    plan.publicResourceMapCommitBehavior !== false ||
    plan.publicScriptModuleResourceDispatch !== false ||
    plan.publicStylesheetLoadStateDispatch !== false ||
    plan.compatibilityClaimed !== false ||
    payload.rootMapPublicBoundary?.status !==
      'blocked-public-resource-root-map-storage' ||
    payload.rootMapPublicBoundary?.publicResourceApisReachable !== false ||
    payload.rootMapPublicBoundary?.compatibilityClaimed !== false ||
    payload.sideEffects?.rootMapStorageExecutionRecorded !== true ||
    payload.sideEffects?.deterministicFakeRootMapStorageExecuted !== true ||
    payload.sideEffects?.realResourceMapsMutated !== false ||
    payload.sideEffects?.preloadPropsMapMutated !== false ||
    payload.sideEffects?.publicResourceMapCommitBehavior !== false ||
    payload.sideEffects?.compatibilityClaimed !== false
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'resource root-map storage execution must remain fake and public-blocked'
    );
  }
}

function assertRootMapStorageSnapshotEntriesForRootConsumer(entries, rows) {
  if (!Array.isArray(entries)) {
    throwInvalidRootExecutionConsumerRecord(
      'resource root-map storage snapshot entries must be source-owned arrays'
    );
  }

  for (const entry of entries) {
    const sourceRow = rows.find(
      (row) => row.storedEntryId === entry.entryId
    );
    if (
      sourceRow === undefined ||
      entry.sourceRootMapStorageRowId !==
        sourceRow.sourceRootMapStorageRowId ||
      entry.sourceResourceMapCommitRowId !==
        sourceRow.sourceResourceMapCommitRowId ||
      entry.rootMapName !== sourceRow.rootMapName ||
      entry.rootMapDedupeKey !== sourceRow.rootMapDedupeKey ||
      entry.deterministicFakeRootMapStorageOnly !== true ||
      entry.realResourceMapEntry !== false ||
      entry.preloadPropsMapEntry !== false ||
      entry.compatibilityClaimed !== false
    ) {
      throwInvalidRootExecutionConsumerRecord(
        'resource root-map storage snapshot entries must match executed rows'
      );
    }
  }
}

function assertFormFulfilledResetExecutionForRootConsumer(record) {
  const payload =
    formActions.getPrivateFormActionFulfilledResetExecutionRecordPayload(
      record
    );
  if (payload === null) {
    throwInvalidRootExecutionConsumerRecord(
      'form fulfilled reset execution record must be source-owned'
    );
  }

  if (
    payload.$$typeof !==
      formActions.privateFormActionFulfilledResetExecutionRecordType ||
    payload.kind !==
      'FastReactDomPrivateFormActionFulfilledResetExecutionRecord' ||
    payload.gateId !==
      formActions.privateFormActionFulfilledResetExecutionGateId ||
    payload.status !==
      formActions.privateFormActionFulfilledResetExecutionRecordedStatus ||
    payload.requestType !==
      'form-action-fulfilled-reset-execution.fake-commit' ||
    payload.contractId !== 'form-action-fulfilled-reset-fake-commit' ||
    payload.admission?.diagnosticKind !==
      formActions.formActionFulfilledResetExecutionDiagnosticKind ||
    payload.admission?.queueExecutionKind !==
      formActions.formActionFulfilledResetExecutionQueueExecutionKind ||
    payload.admission?.commitKind !== 'after-mutation-form-reset-order' ||
    payload.admission?.deterministicFakeResetCommitOnly !== true ||
    payload.admission?.postFulfillmentOnly !== true
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'form fulfilled reset execution record is missing source-owned Worker 830 tokens'
    );
  }

  assertFormFulfilledResetExecutionPlanForRootConsumer(payload);
  return payload;
}

function assertFormFulfilledResetExecutionPlanForRootConsumer(payload) {
  const asyncSource = payload.sourceAsyncCallbackExecution;
  const submitResetSource = payload.sourceSubmitResetExecution;
  const fulfilledResult = payload.fulfilledActionResult;
  const queue = payload.fakeResetStateQueueExecution;
  const commit = payload.fakeResetCommitExecution;

  if (
    asyncSource?.callbackExecutionStatus !==
      'executed-private-form-action-async-callback-fulfilled' ||
    asyncSource.fulfilled !== true ||
    asyncSource.rejected !== false ||
    asyncSource.failClosed !== false ||
    asyncSource.publicActionInvoked !== false ||
    asyncSource.reactUpdateQueued !== false ||
    asyncSource.realFormReset !== false ||
    submitResetSource?.fakeFormResetPathExecuted !== true ||
    submitResetSource.fakeFormResetRecorded !== true ||
    submitResetSource.callbackDispatchExecuted !== false ||
    submitResetSource.actionInvoked !== false ||
    submitResetSource.reactUpdateQueued !== false ||
    submitResetSource.realFormReset !== false ||
    fulfilledResult?.status !==
      'recorded-private-form-action-fulfilled-result-metadata' ||
    fulfilledResult.metadataOnly !== true ||
    fulfilledResult.fulfilled !== true ||
    fulfilledResult.actionResultExposed !== false ||
    fulfilledResult.publicActionInvoked !== false ||
    fulfilledResult.reactUpdateQueued !== false ||
    fulfilledResult.realFormReset !== false
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'form fulfilled reset execution sources must stay accepted fake metadata'
    );
  }

  if (
    queue?.status !==
      'executed-private-form-action-fulfilled-reset-state-queue-fake' ||
    queue.queueExecutionKind !==
      formActions.formActionFulfilledResetExecutionQueueExecutionKind ||
    !sameStringArray(queue.sourceFunctionNames, [
      'request' + 'FormReset',
      'ensureFormComponentIsStateful',
      'dispatchSetStateInternal',
      'requestUpdateLane'
    ]) ||
    queue.requestUpdateLaneRecorded !== true ||
    queue.dispatchSetStateInternalRecorded !== true ||
    queue.fakeResetStateQueueExecuted !== true ||
    queue.fakeResetStateUpdateQueued !== true ||
    queue.resetQueuePendingMutated !== false ||
    queue.realReactUpdateQueued !== false ||
    queue.resetStateQueued !== false ||
    queue.resetUpdateEnqueued !== false ||
    queue.reactUpdateQueued !== false ||
    queue.updateQueueCaptured !== false ||
    commit?.status !==
      'executed-private-form-action-fulfilled-reset-commit-fake' ||
    commit.commitKind !== 'after-mutation-form-reset-order' ||
    !sameStringArray(commit.sourceFunctionNames, [
      'request' + 'FormReset',
      'resetForm' + 'Instance'
    ]) ||
    commit.fakeResetStateQueueExecutionId !== queue.queueExecutionId ||
    commit.fakeResetStateUpdateId !== queue.resetStateUpdateId ||
    commit.fakeResetCommitExecuted !== true ||
    commit.fakeFormResetCommitRecorded !== true ||
    commit.fakeResetFormInstanceCallRecorded !== true ||
    commit.resetFormInstanceCalled !== false ||
    commit.formResetCommitted !== false ||
    commit.realFormReset !== false ||
    commit.domMutation !== false
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'form fulfilled reset fake queue and commit evidence must remain source-owned'
    );
  }

  if (
    payload.publicFormActionBoundary?.publicFormActionsEnabled !== false ||
    payload.publicFormActionBoundary?.publicSubmitDispatchReachable !==
      false ||
    payload.publicFormActionBoundary?.publicRequestFormResetReachable !==
      false ||
    payload.publicFormActionBoundary?.actionInvoked !== false ||
    payload.publicFormActionBoundary?.reactUpdateQueued !== false ||
    payload.publicFormActionBoundary?.domMutation !== false ||
    payload.publicFormActionBoundary?.realFormReset !== false ||
    payload.sideEffects?.fakeResetStateQueueExecuted !== true ||
    payload.sideEffects?.fakeResetCommitExecuted !== true ||
    payload.sideEffects?.privateAsyncActionCallbackInvoked !== false ||
    payload.sideEffects?.actionInvoked !== false ||
    payload.sideEffects?.reactUpdateQueued !== false ||
    payload.sideEffects?.realFormReset !== false ||
    payload.sideEffects?.domMutation !== false ||
    payload.sideEffects?.compatibilityClaimed !== false
  ) {
    throwInvalidRootExecutionConsumerRecord(
      'form fulfilled reset execution must remain fake and public-blocked'
    );
  }
}

function createResourceRootMapStorageConsumerBoundary(resourceExecution) {
  const plan = resourceExecution.rootMapStorageExecutionPlan;
  const snapshot = resourceExecution.rootMapStorageSnapshot;
  return freezeRecord({
    status: privateResourceFormRootExecutionConsumerStatus,
    sourceWorkerId:
      'worker-829-resource-root-map-storage-private-execution',
    gateId: resourceExecution.gateId,
    recordType: resourceExecution.$$typeof,
    rootMapStorageStatus: resourceExecution.rootMapStorageStatus,
    executionStatus: resourceExecution.executionStatus,
    compatibilityStatus: resourceExecution.compatibilityStatus,
    rootMapStorageExecutionId:
      resourceExecution.rootMapStorageExecutionId,
    sourceRootMapStoragePreflightId:
      resourceExecution.sourceRootMapStoragePreflightId,
    rootId: plan.rootId,
    rootKind: plan.rootKind,
    ownerRootId: plan.ownerRootId,
    rowCount: resourceExecution.rootMapStorageExecutionRows.length,
    hoistableStylesRowCount: snapshot.hoistableStylesMapSize,
    hoistableScriptsRowCount: snapshot.hoistableScriptsMapSize,
    executionRowIds: freezeArray(
      resourceExecution.rootMapStorageExecutionRows.map((row) => row.rowId)
    ),
    storedEntryIds: freezeArray(
      resourceExecution.rootMapStorageExecutionRows.map(
        (row) => row.storedEntryId
      )
    ),
    sourceOwnedTokens: freezeArray([
      resourceExecution.gateId,
      resourceExecution.$$typeof,
      resourceExecution.rootMapStorageStatus,
      resourceExecution.executionStatus,
      resourceExecution.compatibilityStatus,
      resourceExecution.storageAdmission.executionKind,
      plan.storageKind,
      snapshot.snapshotKind,
      resourceExecution.rootMapStorageValidationBoundary.status
    ]),
    sourceOwnedRowsConsumed: true,
    deterministicFakeRootMapStorageConsumed: true,
    rootResourceStorageMutated: plan.rootResourceStorageMutated,
    fakeRootResourceStorageMutated: plan.rootResourceStorageMutated,
    fakeHoistableStylesMapMutated: plan.hoistableStylesMapMutated,
    fakeHoistableScriptsMapMutated: plan.hoistableScriptsMapMutated,
    realResourceMapsMutated: false,
    preloadPropsMapMutated: false,
    publicResourceHintDomInsertion: false,
    publicResourceMapCommitBehavior: false,
    publicScriptModuleResourceDispatch: false,
    publicStylesheetLoadStateDispatch: false,
    compatibilityClaimed: false
  });
}

function createFormFulfilledResetConsumerBoundary(fulfilledResetExecution) {
  const queue = fulfilledResetExecution.fakeResetStateQueueExecution;
  const commit = fulfilledResetExecution.fakeResetCommitExecution;
  return freezeRecord({
    status: privateResourceFormRootExecutionConsumerStatus,
    sourceWorkerId:
      'worker-830-form-action-fulfilled-reset-fake-commit',
    gateId: fulfilledResetExecution.gateId,
    recordType: fulfilledResetExecution.$$typeof,
    executionStatus: fulfilledResetExecution.status,
    executionId: fulfilledResetExecution.executionId,
    sourceAsyncCallbackExecutionId:
      fulfilledResetExecution.sourceAsyncCallbackExecutionId,
    sourceSubmitResetExecutionId:
      fulfilledResetExecution.sourceSubmitResetExecutionId,
    queueExecutionId: queue.queueExecutionId,
    resetStateUpdateId: queue.resetStateUpdateId,
    commitExecutionId: commit.commitExecutionId,
    fakeFormResetCommitId: commit.fakeFormResetCommitId,
    sourceOwnedTokens: freezeArray([
      fulfilledResetExecution.gateId,
      fulfilledResetExecution.$$typeof,
      fulfilledResetExecution.status,
      fulfilledResetExecution.requestType,
      fulfilledResetExecution.contractId,
      fulfilledResetExecution.admission.diagnosticKind,
      fulfilledResetExecution.admission.queueExecutionKind,
      fulfilledResetExecution.admission.commitKind,
      queue.status,
      commit.status
    ]),
    queueSourceFunctionNames: queue.sourceFunctionNames,
    commitSourceFunctionNames: commit.sourceFunctionNames,
    sourceOwnedQueueAndCommitConsumed: true,
    deterministicFakeResetStateQueueConsumed: true,
    deterministicFakeResetCommitConsumed: true,
    fulfilledActionResultConsumed: true,
    privateAsyncActionCallbackInvoked: false,
    actionInvoked: false,
    publicActionInvoked: false,
    resetStateQueued: false,
    resetUpdateEnqueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    domMutation: false,
    compatibilityClaimed: false
  });
}

function createResourceFormExecutionAdmissionLedgerBoundary() {
  return freezeRecord({
    ledgerId: privateResourceFormExecutionAdmissionLedgerId,
    ledgerStatus: privateResourceFormExecutionAdmissionLedgerStatus,
    ledgerSource: privateResourceFormExecutionAdmissionLedgerSource,
    workerIds: privateResourceFormExecutionAdmissionWorkerIds,
    sourceTokenPolicy:
      privateResourceFormExecutionAdmissionSourceTokenPolicy,
    staticLedgerAccepted: true,
    runtimeRecordsRequired: true,
    sourceOwnedEvidenceRequired: true,
    workerProgressEvidenceAccepted: false,
    testTitleEvidenceAccepted: false,
    errorMessageEvidenceAccepted: false,
    sourceSyntaxFragmentEvidenceAccepted: false,
    callerSuppliedDiagnosticStringsAccepted: false,
    publicCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
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

function describePrivatePortalCommitRootBridgeBoundary(portalCommitHandoff) {
  return freezeRecord({
    gateStatus: privateRootBridgeRecordOnlyStatus,
    admittedPortalCommitHandoff: true,
    handoffStatus: portalCommitHandoff.handoffStatus,
    commitStatus: portalCommitHandoff.commitStatus,
    portalContainerOwnershipStatus:
      portalCommitHandoff.portalContainerOwnership.ownershipStatus,
    sourceRequestType: portalCommitHandoff.sourceRequestType,
    rootKind: portalCommitHandoff.rootKind,
    rootTag: portalCommitHandoff.rootTag,
    blockedCapabilities: summarizeBlockedCapabilities(
      portalCommitHandoff.blockedCapabilities,
      rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_BLOCKED_CAPABILITIES
    ),
    fakeDomCommitApplied: false,
    portalContainerChildrenReplaced: false,
    preparePortalMount: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  });
}

function describePrivatePortalFakeDomMountRootBridgeBoundary(mountRecord) {
  return freezeRecord({
    gateStatus: privateRootBridgeRecordOnlyStatus,
    admittedPortalFakeDomMountDiagnostic: true,
    mountStatus: mountRecord.mountStatus,
    publicMountStatus: mountRecord.publicMountStatus,
    portalCommitHandoffStatus: mountRecord.sourceCommitHandoffStatus,
    portalCommitStatus: mountRecord.sourceCommitStatus,
    portalContainerOwnershipStatus:
      mountRecord.portalContainerOwnership.ownershipStatus,
    sourceRequestType: mountRecord.sourceRequestType,
    rootKind: mountRecord.rootKind,
    rootTag: mountRecord.rootTag,
    blockedCapabilities: summarizeBlockedCapabilities(
      mountRecord.blockedCapabilities,
      rootBridge.ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_BLOCKED_CAPABILITIES
    ),
    fakeDomCommitApplied: true,
    fakeDomPortalMountDiagnostic: true,
    explicitPortalHostChildMounted: true,
    portalContainerChildrenReplaced: false,
    preparePortalMount: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: true,
    publicDomMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    resourceSideEffects: false,
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
    resourceHintFakeDomAdapterBoundary:
      describeResourceHintFakeDomAdapterBoundary(behaviorArea),
    formActionResetDispatcherBoundary:
      describeFormActionResetDispatcherBoundary(behaviorArea),
    formActionEventExtractionBoundary:
      describeFormActionEventExtractionBoundary(behaviorArea),
    formActionSubmitDispatchBoundary:
      describeFormActionSubmitDispatchBoundary(behaviorArea),
    formActionSubmitResetExecutionBoundary:
      describeFormActionSubmitResetExecutionBoundary(behaviorArea),
    formActionCallbackActionPreflightBoundary:
      describeFormActionCallbackActionPreflightBoundary(behaviorArea),
    formActionAsyncCallbackExecutionBoundary:
      describeFormActionAsyncCallbackExecutionBoundary(behaviorArea),
    formActionFulfilledResetExecutionBoundary:
      describeFormActionFulfilledResetExecutionBoundary(behaviorArea),
    formActionRejectedErrorPreflightBoundary:
      describeFormActionRejectedErrorPreflightBoundary(behaviorArea),
    controlledValueTrackerBoundary:
      describeControlledValueTrackerBoundary(behaviorArea)
  });
}

function describeResourceHintFakeDomAdapterBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'resource-hint') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    metadataGateAvailable: true,
    adapterAdmissionRequired: true,
    adapterRecordsAccepted:
      behaviorArea === null || behaviorArea === 'resource-hint',
    fakeDomOnly: true,
    rawTargetCaptured: false,
    adapterInvoked: false,
    fakeDocumentRead: false,
    fakeHeadRead: false,
    fakeDocumentMutated: false,
    fakeHeadMutated: false,
    resourceElementCreated: false,
    resourceElementInserted: false,
    fakeDomInsertionGateInvoked: false,
    fakeResourceElementAttributesApplied: false,
    fakeHeadBoundaryInvoked: false,
    fakeHeadInsertionObserved: false,
    fakeHeadUpdateApplied: false,
    fakeHeadClearRetainDiagnosticInvoked: false,
    fakeHeadRetainPolicyEvaluated: false,
    fakeHeadChildrenScanned: false,
    fakeHeadClearableChildrenObserved: false,
    fakeHeadRetainedChildrenObserved: false,
    fakeHeadChildRemoved: false,
    fakeHeadChildRetained: false,
    resourceHintClearRetainRowsRecorded: false,
    singletonClearRetainRowsRecorded: false,
    stylesheetPrecedenceBlockedCapabilitiesRecorded: false,
    stylesheetPrecedenceOrderQueried: false,
    stylesheetPrecedenceOrderMutated: false,
    publicStylesheetPrecedenceBehavior: false,
    fakePreloadPreinitOrderDiagnosticInvoked: false,
    fakeHeadInsertionOrderObserved: false,
    fakeHeadInsertionOrderMutated: false,
    resourceHintDedupeRowsRecorded: false,
    resourceHintPrecedenceRowsRecorded: false,
    resourceHintHeadOrderRowsRecorded: false,
    preloadPreinitResourceMapCreated: false,
    preloadPreinitResourceMapMutated: false,
    publicPreloadPreinitDedupeBehavior: false,
    fakeStylesheetPrecedenceDiagnosticInvoked: false,
    stylesheetPrecedenceDedupeRowsRecorded: false,
    stylesheetPrecedenceInsertionRowsRecorded: false,
    stylesheetPrecedenceSingletonOrderRowsRecorded: false,
    stylesheetPrecedenceResourceMapCreated: false,
    stylesheetPrecedenceResourceMapMutated: false,
    fakeResourceMapCommitDiagnosticInvoked: false,
    privateResourceMapCommitRecordsCreated: false,
    resourceMapCommitRowsRecorded: false,
    stylesheetResourceMapCommitRowsRecorded: false,
    preloadResourceMapCommitRowsRecorded: false,
    scriptResourceMapCommitRowsRecorded: false,
    moduleResourceMapOrderRowsRecorded: false,
    moduleResourceMapDedupeKeysRecorded: false,
    fakeScriptModuleCommitExecutionDiagnosticInvoked: false,
    scriptModuleFakeDomCommitRowsRecorded: false,
    scriptResourceFakeDomCommitRowsRecorded: false,
    modulePreloadFakeDomCommitRowsRecorded: false,
    fakeScriptModuleResourceOrderingDiagnosticInvoked: false,
    scriptModuleFakeResourceOrderRowsRecorded: false,
    scriptModuleFakeResourceDedupeStatesRecorded: false,
    scriptModuleFakeResourceOrderingExecuted: false,
    stylesheetLoadErrorStateRecordConsumed: false,
    stylesheetLoadStateCommitOrderRowsRecorded: false,
    stylesheetLoadStateResourceMapRowsValidated: false,
    stylesheetLoadStateCommitTransitionRecorded: false,
    fakeStylesheetResourceCommitTransitionRecorded: false,
    fakeStylesheetLoadStateCommitExecutionDiagnosticInvoked: false,
    stylesheetLoadStateCommitExecutionRowsRecorded: false,
    stylesheetLoadStateChangeRowsRecorded: false,
    deterministicStylesheetLoadStateChangesRecorded: false,
    rootMapStoragePreflightRecorded: false,
    rootMapStorageRowsRecorded: false,
    canonicalRootMapStorageRowsRecorded: false,
    rootResourceStorageShapeRecorded: false,
    hoistableStylesRootMapRowsRecorded: false,
    hoistableScriptsRootMapRowsRecorded: false,
    preloadPropsRootMapRowsSkipped: false,
    rootMapStorageValidationRecorded: false,
    duplicateRootMapStorageRowsRejected: false,
    staleRootMapStorageRowsRejected: false,
    foreignRootMapStorageRowsRejected: false,
    rootMapStorageExecutionRecorded: false,
    rootMapStorageExecutionRowsRecorded: false,
    canonicalRootMapStorageRowsExecuted: false,
    rootMapStorageSnapshotRecorded: false,
    deterministicFakeRootMapStorageExecuted: false,
    rootResourceStorageCreated: false,
    rootResourceStorageMutated: false,
    hoistableStylesMapCreated: false,
    hoistableStylesMapMutated: false,
    hoistableScriptsMapCreated: false,
    hoistableScriptsMapMutated: false,
    fakeRootResourceStorageCreated: false,
    fakeRootResourceStorageMutated: false,
    fakeHoistableStylesMapCreated: false,
    fakeHoistableStylesMapMutated: false,
    fakeHoistableScriptsMapCreated: false,
    fakeHoistableScriptsMapMutated: false,
    preloadPropsMapCreated: false,
    preloadPropsMapMutated: false,
    duplicateStylesheetPrecedenceRowsRejected: false,
    staleStylesheetResourceMapEntriesRejected: false,
    realResourceMapsCreated: false,
    realResourceMapsMutated: false,
    fakeResourceMapsCreated: false,
    fakeResourceMapsMutated: false,
    stylesheetRecordOwnershipClaimed: false,
    preloadRecordStarted: false,
    scriptRecordLoaded: false,
    resourceLoadStateMutated: false,
    preloadOrStyleDomWorkDispatched: false,
    publicStylesheetLoadStateDispatch: false,
    publicResourceMapCommitBehavior: false,
    fakeStylesheetLoadErrorStateDiagnosticInvoked: false,
    stylesheetResourceStateRowsRecorded: false,
    stylesheetLoadingStateRowsRecorded: false,
    stylesheetPreloadStateRowsRecorded: false,
    stylesheetCommitSuspensionRowsRecorded: false,
    stylesheetLoadListenerInstalled: false,
    stylesheetErrorListenerInstalled: false,
    stylesheetPromiseCreated: false,
    stylesheetPreloadListenerInstalled: false,
    stylesheetFetchStarted: false,
    stylesheetCommitSuspended: false,
    stylesheetRealTimerScheduled: false,
    resourceFetchStarted: false,
    realDocumentMutated: false,
    publicResourceHintDomInsertion: false,
    compatibilityClaimed: false,
    adapterGate: internalsGate.describePrivateResourceHintFakeDomAdapterGate(),
    insertionGate:
      internalsGate.describePrivateResourceHintFakeDomInsertionGate(),
    headBoundaryGate:
      internalsGate.describePrivateResourceHintHeadBoundaryGate(),
    headClearRetainGate:
      internalsGate.describePrivateResourceHintHeadClearRetainGate(),
    preloadPreinitOrderGate:
      internalsGate.describePrivateResourceHintPreloadPreinitOrderGate(),
    stylesheetPrecedenceGate:
      internalsGate.describePrivateResourceHintStylesheetPrecedenceGate(),
    resourceMapCommitGate:
      internalsGate.describePrivateResourceHintResourceMapCommitGate(),
    rootMapStoragePreflightGate:
      internalsGate.describePrivateResourceHintRootMapStoragePreflightGate(),
    rootMapStorageGate:
      internalsGate.describePrivateResourceHintRootMapStorageGate(),
    stylesheetLoadErrorStateGate:
      internalsGate.describePrivateResourceHintStylesheetLoadErrorStateGate()
  });
}

function describeFormActionResetDispatcherBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'form-action',
    appliesToRequest: behaviorArea === 'form-action',
    metadataGateAvailable: true,
    dispatcherRecordsAccepted:
      behaviorArea === null || behaviorArea === 'form-action',
    submitRequestSubmitActionMetadataRecorded: true,
    resetDispatcherOrderingRecorded: true,
    resetQueueCommitMetadataRecorded: true,
    resetQueueBoundaryRecorded: true,
    resetCommitOrderRecorded: true,
    submitDispatchMetadataRecorded: true,
    submitResetExecutionMetadataRecorded: true,
    callbackActionPreflightMetadataRecorded: true,
    asyncCallbackExecutionMetadataRecorded: true,
    fulfilledResetExecutionMetadataRecorded: true,
    rejectedErrorPreflightMetadataRecorded: true,
    realFormAccepted: false,
    rawTargetCaptured: false,
    formInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    privateAsyncActionCallbackInvoked: false,
    actionInvoked: false,
    transitionStarted: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    resetUpdateEnqueued: false,
    reactUpdateQueued: false,
    renderFormResetFlagMarked: false,
    afterMutationEffectsVisited: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    compatibilityClaimed: false,
    dispatcherGate: internalsGate.describePrivateFormActionResetDispatcherGate(),
    eventExtractionGate:
      internalsGate.describePrivateFormActionEventExtractionGate(),
    resetQueueCommitGate:
      internalsGate.describePrivateFormActionResetQueueCommitGate(),
    submitDispatchGate:
      formActions.describePrivateFormActionSubmitDispatchGate(),
    submitResetExecutionGate:
      formActions.describePrivateFormActionSubmitResetExecutionGate(),
    callbackActionPreflightGate:
      formActions.describePrivateFormActionCallbackActionPreflightGate(),
    asyncCallbackExecutionGate:
      formActions.describePrivateFormActionAsyncCallbackExecutionGate(),
    fulfilledResetExecutionGate:
      formActions.describePrivateFormActionFulfilledResetExecutionGate(),
    rejectedErrorPreflightGate:
      formActions.describePrivateFormActionRejectedErrorPreflightGate()
  });
}

function describeFormActionEventExtractionBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'form-action',
    appliesToRequest: behaviorArea === 'form-action',
    metadataGateAvailable: true,
    sourceRecordsAccepted:
      behaviorArea === null || behaviorArea === 'form-action',
    acceptedSourceRecordType:
      internalsGate.privateFormActionResetDispatcherRecordType,
    acceptedSourceStatus:
      internalsGate.privateFormActionSubmissionIntentRecordedStatus,
    acceptedSubmissionTriggers: freezeArray(['submit', 'requestSubmit']),
    consumesSubmitRequestSubmitActionMetadata: true,
    eventExtractionMetadataRecorded: true,
    realFormAccepted: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    nativeEventInspected: false,
    formInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    actionInvoked: false,
    transitionStarted: false,
    resetStateQueued: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    extractionGate:
      internalsGate.describePrivateFormActionEventExtractionGate()
  });
}

function describeFormActionSubmitDispatchBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'form-action',
    appliesToRequest: behaviorArea === 'form-action',
    metadataGateAvailable: true,
    sourceRecordsAccepted:
      behaviorArea === null || behaviorArea === 'form-action',
    acceptedSourceRecordType:
      formActions.privateFormActionFormDataBlockerRecordType,
    acceptedSourceStatus:
      formActions.privateFormActionFormDataBlockerRecordedStatus,
    recordsActionIdentity: true,
    recordsFormDataBlockerRows: true,
    recordsResetQueueIntent: true,
    recordsDispatchQueueRow: true,
    submitResetExecutionGateAvailable: true,
    callbackActionPreflightGateAvailable: true,
    asyncCallbackExecutionGateAvailable: true,
    fulfilledResetExecutionGateAvailable: true,
    rejectedErrorPreflightGateAvailable: true,
    rejectsLiveForms: true,
    rejectsUnsupportedSubmitControls: true,
    callbackDispatchExecutionBlocked: true,
    realFormAccepted: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    nativeEventInspected: false,
    formInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionInvoked: false,
    transitionStarted: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    submitDispatchGate:
      formActions.describePrivateFormActionSubmitDispatchGate()
  });
}

function describeFormActionSubmitResetExecutionBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'form-action',
    appliesToRequest: behaviorArea === 'form-action',
    metadataGateAvailable: true,
    sourceRecordsAccepted:
      behaviorArea === null || behaviorArea === 'form-action',
    acceptedSourceRecordType:
      formActions.privateFormActionSubmitDispatchRecordType,
    acceptedSourceStatus:
      formActions.privateFormActionSubmitDispatchRecordedStatus,
    consumesBlockedFormDataMetadata: true,
    consumesResetIntentMetadata: true,
    executesDeterministicFakeFormResetPath: true,
    admitsExactlyOneFakeFormPath: true,
    callbackActionPreflightGateAvailable: true,
    rejectsStaleSubmitDispatchMetadata: true,
    rejectsPublicResetRequest: true,
    rejectsActionInvocation: true,
    rejectsPublicDomMutation: true,
    rejectsPackageCompatibilityClaims: true,
    realFormAccepted: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    nativeEventInspected: false,
    formInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionInvoked: false,
    transitionStarted: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    submitResetExecutionGate:
      formActions.describePrivateFormActionSubmitResetExecutionGate()
  });
}

function describeFormActionCallbackActionPreflightBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'form-action',
    appliesToRequest: behaviorArea === 'form-action',
    metadataGateAvailable: true,
    sourceRecordsAccepted:
      behaviorArea === null || behaviorArea === 'form-action',
    acceptedSubmitDispatchRecordType:
      formActions.privateFormActionSubmitDispatchRecordType,
    acceptedSubmitDispatchStatus:
      formActions.privateFormActionSubmitDispatchRecordedStatus,
    acceptedSubmitResetExecutionRecordType:
      formActions.privateFormActionSubmitResetExecutionRecordType,
    acceptedSubmitResetExecutionStatus:
      formActions.privateFormActionSubmitResetExecutionRecordedStatus,
    consumesSubmitDispatchMetadata: true,
    consumesSubmitResetExecutionMetadata: true,
    recordsCallbackQueuePreflight: true,
    recordsActionInvocationPreflight: true,
    recordsResetActionPublicBlockers: true,
    rejectsStaleSubmitDispatchMetadata: true,
    rejectsStaleSubmitResetExecutionMetadata: true,
    rejectsForeignSubmitResetExecutionMetadata: true,
    rejectsPublicResetRequest: true,
    rejectsActionInvocation: true,
    rejectsPublicDomMutation: true,
    rejectsPackageCompatibilityClaims: true,
    realFormAccepted: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    nativeEventInspected: false,
    formInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionInvoked: false,
    publicActionInvoked: false,
    transitionStarted: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    callbackActionPreflightGate:
      formActions.describePrivateFormActionCallbackActionPreflightGate()
  });
}

function describeFormActionAsyncCallbackExecutionBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'form-action',
    appliesToRequest: behaviorArea === 'form-action',
    metadataGateAvailable: true,
    sourceRecordsAccepted:
      behaviorArea === null || behaviorArea === 'form-action',
    acceptedSourceRecordType:
      formActions.privateFormActionCallbackActionPreflightRecordType,
    acceptedSourceStatus:
      formActions.privateFormActionCallbackActionPreflightRecordedStatus,
    recordsPendingStatusMetadata: true,
    recordsResetMetadata: true,
    admitsPrivateAsyncActionCallbacks: true,
    executesPrivateAsyncActionCallbacks: true,
    failClosedErrorsRecorded: true,
    fulfilledResetExecutionGateAvailable: true,
    rejectedErrorPreflightGateAvailable: true,
    rejectsLiveForms: true,
    rejectsPublicDispatch: true,
    realFormAccepted: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    nativeEventInspected: false,
    formInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    privateAsyncActionCallbackInvoked: false,
    actionInvoked: false,
    transitionStarted: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    asyncCallbackExecutionGate:
      formActions.describePrivateFormActionAsyncCallbackExecutionGate()
  });
}

function describeFormActionFulfilledResetExecutionBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'form-action',
    appliesToRequest: behaviorArea === 'form-action',
    metadataGateAvailable: true,
    sourceRecordsAccepted:
      behaviorArea === null || behaviorArea === 'form-action',
    acceptedSourceRecordType:
      formActions.privateFormActionAsyncCallbackExecutionRecordType,
    acceptedSourceStatus:
      formActions.privateFormActionAsyncCallbackExecutionRecordedStatus,
    acceptedFulfilledCallbackStatus:
      'executed-private-form-action-async-callback-fulfilled',
    acceptedSubmitResetExecutionRecordType:
      formActions.privateFormActionSubmitResetExecutionRecordType,
    acceptedSubmitResetExecutionStatus:
      formActions.privateFormActionSubmitResetExecutionRecordedStatus,
    consumesFulfilledAsyncCallbackExecution: true,
    consumesSubmitResetExecutionMetadata: true,
    consumesResetMetadata: true,
    recordsFulfilledActionResultMetadata: true,
    executesDeterministicFakeResetStateQueue: true,
    recordsDeterministicFakeResetCommit: true,
    rejectsStaleFulfilledCallbacks: true,
    rejectsStaleSubmitResetExecutionMetadata: true,
    rejectsForeignSubmitResetExecutionMetadata: true,
    rejectsPublicResetRequest: true,
    rejectsActionInvocation: true,
    rejectsPublicDomMutation: true,
    rejectsPackageCompatibilityClaims: true,
    realFormAccepted: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    nativeEventInspected: false,
    formInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    privateAsyncActionCallbackInvoked: false,
    actionInvoked: false,
    publicActionInvoked: false,
    transitionStarted: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    resetUpdateEnqueued: false,
    reactUpdateQueued: false,
    afterMutationEffectsVisited: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    fulfilledResetExecutionGate:
      formActions.describePrivateFormActionFulfilledResetExecutionGate()
  });
}

function describeFormActionRejectedErrorPreflightBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return freezeRecord({
    gateStatus: privateSourceAdapterBlockedStatus,
    behaviorArea,
    supportedBehaviorArea: 'form-action',
    appliesToRequest: behaviorArea === 'form-action',
    metadataGateAvailable: true,
    sourceRecordsAccepted:
      behaviorArea === null || behaviorArea === 'form-action',
    acceptedSourceRecordType:
      formActions.privateFormActionAsyncCallbackExecutionRecordType,
    acceptedSourceStatus:
      formActions.privateFormActionAsyncCallbackExecutionRecordedStatus,
    acceptedRejectedCallbackStatus:
      'failed-private-form-action-async-callback-rejected',
    rejectedErrorMetadataRecorded: true,
    actionErrorPreflightRecorded: true,
    resetActionPublicBlockersRecorded: true,
    preflightOnly: true,
    rejectsLiveForms: true,
    rejectsPublicDispatch: true,
    rejectsPublicErrorRouting: true,
    realFormAccepted: false,
    rawTargetCaptured: false,
    rawEventCaptured: false,
    rawErrorCaptured: false,
    nativeEventInspected: false,
    formInspected: false,
    submitControlInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    listenerDispatchStarted: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    privateAsyncActionCallbackInvoked: false,
    actionInvoked: false,
    publicActionInvoked: false,
    publicErrorRoutingStarted: false,
    publicRootErrorCallbackInvoked: false,
    transitionStarted: false,
    resetStateQueued: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    realFormReset: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    rejectedErrorPreflightGate:
      formActions.describePrivateFormActionRejectedErrorPreflightGate()
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

function describePrivateResourceFormRootExecutionConsumerBoundary() {
  return freezeRecord({
    gateId: privateResourceFormRootExecutionConsumerGateId,
    gateStatus: privateResourceFormRootExecutionConsumerStatus,
    compatibilityStatus:
      privateResourceFormRootExecutionConsumerCompatibilityBlockedStatus,
    ledgerBoundary: createResourceFormExecutionAdmissionLedgerBoundary(),
    acceptedRootBridgeAdmissionStatus:
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED,
    acceptedResourceRootMapStorageRecordType:
      internalsGate.privateResourceHintRootMapStorageRecordType,
    acceptedResourceRootMapStorageStatus:
      internalsGate.privateResourceHintRootMapStorageStatus,
    acceptedResourceRootMapStorageExecutionStatus:
      internalsGate.privateResourceHintRootMapStorageExecutionStatus,
    acceptedFormFulfilledResetRecordType:
      formActions.privateFormActionFulfilledResetExecutionRecordType,
    acceptedFormFulfilledResetStatus:
      formActions.privateFormActionFulfilledResetExecutionRecordedStatus,
    consumesRootBridgeAdmission: true,
    consumesResourceRootMapStorageExecution: true,
    consumesFormFulfilledResetExecution: true,
    requiresSourceOwnedPrivateRecords: true,
    requiresWorker850AdmissionLedgerBoundary: true,
    rejectsStaleRootMapStorageRecords: true,
    rejectsCrossRootResourceRecords: true,
    rejectsClonedRecords: true,
    rejectsCallerSuppliedSourceTokens: true,
    rejectsPublicCompatibilityAliases: true,
    deterministicFakeResourceEvidenceOnly: true,
    deterministicFakeFormEvidenceOnly: true,
    publicRootExecution: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    resourceSideEffects: false,
    formSideEffects: false,
    reactUpdateQueued: false,
    realFormReset: false,
    compatibilityClaimed: false
  });
}

function describePrivateResourceDispatcherBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'resource-hint') {
    return null;
  }

  return internalsGate.describePrivateResourceHintDispatcherMetadataGate();
}

function describePrivateFormActionResetDispatcherBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return internalsGate.describePrivateFormActionResetDispatcherGate();
}

function describePrivateFormActionEventExtractionBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return internalsGate.describePrivateFormActionEventExtractionGate();
}

function describePrivateFormActionSubmitDispatchBoundary(behaviorArea) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return formActions.describePrivateFormActionSubmitDispatchGate();
}

function describePrivateFormActionSubmitResetExecutionBoundary(
  behaviorArea
) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return formActions.describePrivateFormActionSubmitResetExecutionGate();
}

function describePrivateFormActionCallbackActionPreflightBoundary(
  behaviorArea
) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return formActions.describePrivateFormActionCallbackActionPreflightGate();
}

function describePrivateFormActionAsyncCallbackExecutionBoundary(
  behaviorArea
) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return formActions.describePrivateFormActionAsyncCallbackExecutionGate();
}

function describePrivateFormActionFulfilledResetExecutionBoundary(
  behaviorArea
) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return formActions.describePrivateFormActionFulfilledResetExecutionGate();
}

function describePrivateFormActionRejectedErrorPreflightBoundary(
  behaviorArea
) {
  if (behaviorArea !== null && behaviorArea !== 'form-action') {
    return null;
  }

  return formActions.describePrivateFormActionRejectedErrorPreflightGate();
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

function assertNoRootExecutionConsumerRawAdmissionFields(admission) {
  for (const field of [
    'root',
    'container',
    'document',
    'head',
    'fakeHead',
    'resourceRoot',
    'rootResources',
    'resourceMap',
    'hoistableStyles',
    'hoistableScripts',
    'form',
    'formElement',
    'target',
    'nativeEvent',
    'event',
    'action',
    'formData',
    'queue',
    'updateQueue',
    'domNode',
    'instance'
  ]) {
    if (hasOwn.call(admission, field)) {
      throwInvalidRootExecutionConsumerAdmission(
        `${field} must not be passed to the root execution consumer gate`
      );
    }
  }
}

function assertNoRootExecutionConsumerPublicClaims(admission) {
  for (const field of [
    'publicResourceApisReachable',
    'publicResourceHintCallsReachable',
    'publicResourceHintDomInsertion',
    'publicResourceMapCommitBehavior',
    'publicResourceDispatchCompatibilityClaimed',
    'publicResourceRootMapStorageCompatibilityClaimed',
    'publicResourceMapCommitCompatibilityClaimed',
    'publicFormActionsEnabled',
    'publicFormSubmissionReachable',
    'publicSubmitDispatchReachable',
    'publicRequestFormResetReachable',
    'publicRequestFormResetRequested',
    'publicActionInvocationReachable',
    'publicActionInvocationRequested',
    'actionInvocationRequested',
    'actionInvoked',
    'publicActionInvoked',
    'reactUpdateRequested',
    'reactUpdateQueued',
    'realReactUpdateQueued',
    'updateQueueCaptured',
    'resetUpdateEnqueued',
    'resetFormInstanceCalled',
    'formResetCommitted',
    'realFormReset',
    'domMutation',
    'domMutationRequested',
    'publicDomMutationRequested',
    'publicPackageCompatibilityClaimed',
    'publicPackageExportsCompatibilityClaimed',
    'packageCompatibilityClaimed',
    'packageExportCompatibilityClaimed',
    'packageExportsMutated',
    'packageJsonExportsMutated',
    'publicCompatibilityClaimed',
    'compatibilityClaimed'
  ]) {
    if (admission[field] === true) {
      throwInvalidRootExecutionConsumerAdmission(
        `${field} must remain blocked in the root execution consumer gate`
      );
    }
  }
}

function assertNoRootExecutionConsumerCallerSourceTokens(admission) {
  for (const field of [
    'sourceRootBridgeAdmissionId',
    'sourceResourceRootMapStorageExecutionId',
    'sourceFormFulfilledResetExecutionId',
    'sourceRootMapStoragePreflightId',
    'sourceAsyncCallbackExecutionId',
    'sourceSubmitResetExecutionId',
    'rootMapStorageExecutionRows',
    'fakeResetStateQueueExecution',
    'fakeResetCommitExecution',
    'ledgerId',
    'ledgerStatus',
    'workerId',
    'workerIds',
    'sourceTokenPolicy',
    'executionKind',
    'storageKind',
    'snapshotKind',
    'diagnosticKind',
    'queueExecutionKind',
    'commitKind'
  ]) {
    if (hasOwn.call(admission, field)) {
      throwInvalidRootExecutionConsumerAdmission(
        'source-owned root execution tokens must come from private records'
      );
    }
  }
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

function assertPortalCommitHandoffIsRecordOnly(portalCommitHandoff) {
  if (
    !rootBridge.isPrivateRootPortalCommitHandoffRecord(portalCommitHandoff) ||
    portalCommitHandoff.handoffStatus !==
      rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_HANDOFF_ADMITTED ||
    portalCommitHandoff.commitStatus !==
      rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_MUTATION_BLOCKED ||
    portalCommitHandoff.rootKind !== rootBridge.CLIENT_ROOT_KIND ||
    portalCommitHandoff.rootTag !== rootBridge.CONCURRENT_ROOT_TAG ||
    portalCommitHandoff.portalContainerOwnership?.ownershipStatus !==
      rootBridge.ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED ||
    portalCommitHandoff.listenerSideEffects?.preparePortalMount !== false ||
    portalCommitHandoff.listenerSideEffects?.listenerInstallation !== false
  ) {
    throwInvalidPortalCommitHandoff();
  }

  for (const field of rootBlockedFlagFields) {
    if (portalCommitHandoff[field] !== false) {
      throwInvalidPortalCommitHandoff();
    }
  }

  if (
    portalCommitHandoff.fakeDomCommitApplied !== false ||
    portalCommitHandoff.portalContainerChildrenReplaced !== false ||
    portalCommitHandoff.preparePortalMount !== false ||
    portalCommitHandoff.resourceSideEffects !== false ||
    portalCommitHandoff.compatibilityClaimed !== false
  ) {
    throwInvalidPortalCommitHandoff();
  }

  assertBlockedCapabilities(
    portalCommitHandoff.blockedCapabilities,
    rootBridge.ROOT_BRIDGE_PORTAL_COMMIT_BLOCKED_CAPABILITIES
  );
}

function assertPortalFakeDomMountDiagnosticIsResourceBlocked(mountRecord) {
  if (
    !rootBridge.isPrivateRootPortalFakeDomMountRecord(mountRecord) ||
    mountRecord.mountStatus !==
      rootBridge.ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_APPLIED ||
    mountRecord.publicMountStatus !==
      rootBridge.ROOT_BRIDGE_PORTAL_PUBLIC_MOUNT_BLOCKED ||
    mountRecord.rootKind !== rootBridge.CLIENT_ROOT_KIND ||
    mountRecord.rootTag !== rootBridge.CONCURRENT_ROOT_TAG ||
    mountRecord.portalContainerOwnership?.ownershipStatus !==
      rootBridge.ROOT_BRIDGE_PORTAL_CONTAINER_OWNERSHIP_VALIDATED ||
    mountRecord.listenerSideEffects?.preparePortalMount !== false ||
    mountRecord.listenerSideEffects?.listenerInstallation !== false
  ) {
    throwInvalidPortalCommitHandoff();
  }

  if (
    mountRecord.nativeExecution !== false ||
    mountRecord.reconcilerExecution !== false ||
    mountRecord.domMutation !== true ||
    mountRecord.publicDomMutation !== false ||
    mountRecord.markerWrites !== false ||
    mountRecord.listenerInstallation !== false ||
    mountRecord.hydration !== false ||
    mountRecord.eventDispatch !== false ||
    mountRecord.compatibilityClaimed !== false
  ) {
    throwInvalidPortalCommitHandoff();
  }

  if (
    mountRecord.fakeDomCommitApplied !== true ||
    mountRecord.fakeDomPortalMountDiagnostic !== true ||
    mountRecord.explicitPortalHostChildMounted !== true ||
    mountRecord.portalContainerChildrenReplaced !== false ||
    mountRecord.preparePortalMount !== false ||
    mountRecord.resourceSideEffects !== false ||
    mountRecord.compatibilityClaimed !== false
  ) {
    throwInvalidPortalCommitHandoff();
  }

  assertBlockedCapabilities(
    mountRecord.blockedCapabilities,
    rootBridge.ROOT_BRIDGE_PORTAL_FAKE_DOM_MOUNT_BLOCKED_CAPABILITIES
  );
}

function assertBlockedCapabilities(
  capabilities,
  expectedCapabilities = rootBridge.ROOT_BRIDGE_BLOCKED_CAPABILITIES
) {
  if (!Array.isArray(capabilities)) {
    throwInvalidBlockedCapabilities(expectedCapabilities);
  }

  const expectedById = new Map(
    expectedCapabilities.map((capability) => [
      capability.id,
      capability
    ])
  );

  if (capabilities.length !== expectedById.size) {
    throwInvalidBlockedCapabilities(expectedCapabilities);
  }

  for (const capability of capabilities) {
    const expected = expectedById.get(capability && capability.id);
    if (
      expected === undefined ||
      capability.blocked !== true ||
      capability.reason !== expected.reason
    ) {
      throwInvalidBlockedCapabilities(expectedCapabilities);
    }
  }
}

function throwInvalidBlockedCapabilities(expectedCapabilities) {
  if (expectedCapabilities === rootBridge.ROOT_BRIDGE_BLOCKED_CAPABILITIES) {
    throwInvalidRootBridgeMetadata();
  }
  throwInvalidPortalCommitHandoff();
}

function summarizeBlockedCapabilities(
  capabilities,
  expectedCapabilities = rootBridge.ROOT_BRIDGE_BLOCKED_CAPABILITIES
) {
  assertBlockedCapabilities(capabilities, expectedCapabilities);
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

function sameStringArray(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    return false;
  }
  return expected.every((value, index) => actual[index] === value);
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

function throwInvalidRootExecutionConsumerAdmission(reason) {
  const error = new Error(
    'Invalid private React DOM resource/form root execution consumer admission.'
  );
  error.name = 'FastReactDomResourceFormRootExecutionConsumerError';
  error.code = rootBoundaryInvalidRootExecutionConsumerAdmissionCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidRootExecutionConsumerRecord(reason) {
  const error = new Error(
    'Invalid private React DOM resource/form root execution consumer record.'
  );
  error.name = 'FastReactDomResourceFormRootExecutionConsumerError';
  error.code = rootBoundaryInvalidRootExecutionConsumerRecordCode;
  error.compatibilityTarget = compatibilityTarget;
  error.reason = reason;
  throw error;
}

function throwInvalidPortalCommitHandoff() {
  const error = new Error(
    'Expected private portal commit handoff metadata to remain record-only.'
  );
  error.name = 'FastReactDomResourceFormRootBoundaryError';
  error.code = rootBoundaryInvalidPortalCommitHandoffCode;
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
  describePrivateFormActionAsyncCallbackExecutionBoundary,
  describePrivateFormActionCallbackActionPreflightBoundary,
  describePrivateFormActionEventExtractionBoundary,
  describePrivateFormActionFulfilledResetExecutionBoundary,
  describePrivateFormActionRejectedErrorPreflightBoundary,
  describePrivateResourceFormRootExecutionConsumerBoundary,
  describePrivateFormActionResetDispatcherBoundary,
  describePrivateFormActionSubmitResetExecutionBoundary,
  describePrivateFormActionSubmitDispatchBoundary,
  describeResourceFormRootBridgeBlockedGate,
  describePrivateResourceDispatcherBoundary,
  createResourceFormRootExecutionConsumerGate,
  getResourceFormPortalCommitBlockedRecordPayload,
  getResourceFormPortalFakeDomMountBlockedRecordPayload,
  getResourceFormRootBridgeBlockedRecordPayload,
  getResourceFormRootExecutionConsumerRecordPayload,
  isResourceFormPortalCommitBlockedRecord,
  isResourceFormPortalFakeDomMountBlockedRecord,
  isResourceFormRootBridgeBlockedRecord,
  isResourceFormRootExecutionConsumerRecord,
  privateResourceFormExecutionAdmissionLedgerId,
  privateResourceFormExecutionAdmissionLedgerSource,
  privateResourceFormExecutionAdmissionLedgerStatus,
  privateResourceFormExecutionAdmissionSourceTokenPolicy,
  privateResourceFormExecutionAdmissionWorkerIds,
  privateResourceFormRootExecutionConsumerCompatibilityBlockedStatus,
  privateResourceFormRootExecutionConsumerGateId,
  privateResourceFormRootExecutionConsumerStatus,
  privatePortalCommitResourceBlockedStatus,
  privatePortalFakeDomMountResourceBlockedStatus,
  privateControlledValueTrackerBlockedStatus,
  privateRootBridgeRecordOnlyStatus,
  privateSourceAdapterBlockedStatus,
  portalCommitResourceSideEffects,
  portalFakeDomMountResourceSideEffects,
  publicRootFacadeBlockedGateId,
  publicRootFacadeBlockedStatus,
  rootBoundaryInvalidRootExecutionConsumerAdmissionCode,
  rootBoundaryInvalidRootExecutionConsumerRecordCode,
  rootExecutionConsumerSideEffects,
  recordResourceFormPortalCommitBlockedRequest,
  recordResourceFormPortalFakeDomMountBlockedRequest,
  recordResourceFormRootBridgeBlockedRequest,
  resourceFormRootExecutionConsumerGateSchemaVersion,
  resourceFormRootExecutionConsumerRecordType,
  resourceFormPortalCommitBoundaryRecordType,
  resourceFormPortalFakeDomMountBoundaryRecordType,
  resourceFormRootBoundaryRecordType,
  resourceFormRootBridgeBlockedGateId,
  resourceFormRootBridgeGateSchemaVersion,
  rootBoundaryInvalidPortalCommitHandoffCode,
  rootBoundaryInvalidPublicMetadataCode,
  rootBoundaryInvalidRecordCode,
  rootBoundaryInvalidRootMetadataCode,
  rootBoundarySideEffects
});
