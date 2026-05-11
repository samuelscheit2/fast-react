'use strict';

const {
  compatibilityTarget,
  unimplementedCode
} = require('../placeholder-utils.js');
const internalsGate = require('./resource-form-internals-gate.js');
const formActions = require('./shared/form-actions.js');
const rootBridge = require('./client/root-bridge.js');

const resourceFormRootBridgeGateSchemaVersion = 1;
const resourceFormRootBridgeBlockedGateId =
  'resource-form-root-bridge-blocked-gate-1';
const resourceFormRootBoundaryRecordType =
  'fast.react_dom.resource_form_root_boundary_record';
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

const boundaryRecordPayloads = new WeakMap();
const portalCommitBoundaryRecordPayloads = new WeakMap();
const portalFakeDomMountBoundaryRecordPayloads = new WeakMap();

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
    privateFormActionRejectedErrorPreflightBoundary:
      describePrivateFormActionRejectedErrorPreflightBoundary(null),
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
  const privateFormActionRejectedErrorPreflightBoundary =
    describePrivateFormActionRejectedErrorPreflightBoundary(
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
    privateResourceDispatcherBoundary,
    privateFormActionResetDispatcherBoundary,
    privateFormActionEventExtractionBoundary,
    privateFormActionSubmitDispatchBoundary,
    privateFormActionSubmitResetExecutionBoundary,
    privateFormActionCallbackActionPreflightBoundary,
    privateFormActionAsyncCallbackExecutionBoundary,
    privateFormActionRejectedErrorPreflightBoundary,
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

function getResourceFormRootBridgeBlockedRecordPayload(record) {
  return boundaryRecordPayloads.get(record) || null;
}

function isResourceFormRootBridgeBlockedRecord(value) {
  return boundaryRecordPayloads.has(value);
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
  describePrivateFormActionRejectedErrorPreflightBoundary,
  describePrivateFormActionResetDispatcherBoundary,
  describePrivateFormActionSubmitResetExecutionBoundary,
  describePrivateFormActionSubmitDispatchBoundary,
  describeResourceFormRootBridgeBlockedGate,
  describePrivateResourceDispatcherBoundary,
  getResourceFormPortalCommitBlockedRecordPayload,
  getResourceFormPortalFakeDomMountBlockedRecordPayload,
  getResourceFormRootBridgeBlockedRecordPayload,
  isResourceFormPortalCommitBlockedRecord,
  isResourceFormPortalFakeDomMountBlockedRecord,
  isResourceFormRootBridgeBlockedRecord,
  privatePortalCommitResourceBlockedStatus,
  privatePortalFakeDomMountResourceBlockedStatus,
  privateControlledValueTrackerBlockedStatus,
  privateRootBridgeRecordOnlyStatus,
  privateSourceAdapterBlockedStatus,
  portalCommitResourceSideEffects,
  portalFakeDomMountResourceSideEffects,
  publicRootFacadeBlockedGateId,
  publicRootFacadeBlockedStatus,
  recordResourceFormPortalCommitBlockedRequest,
  recordResourceFormPortalFakeDomMountBlockedRequest,
  recordResourceFormRootBridgeBlockedRequest,
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
