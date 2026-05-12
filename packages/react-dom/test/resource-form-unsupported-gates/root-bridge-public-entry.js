'use strict';

const test = require('node:test');
const {
  assert,
  path,
  pathToFileURL,
  packageRoot,
  repoRoot,
  sourceRoot,
  resourceFormGate,
  formActions,
  propertyPayload,
  rootBridge,
  componentTree,
  controlledRestoreQueue,
  eventListener,
  pluginEventSystem,
  rootListeners,
  resourceOracle,
  formActionsOracle,
  controlledInputOracle,
  internalsExport,
  unsupportedCode,
  compatibilityTarget,
  placeholderVersion,
  implementedVersion,
  metadataOnlySourceFiles,
  resourceShape,
  formRootShape,
  formServerRootShape,
  disallowedSourcePatterns,
  assertFunctionMatchesOracle,
  assertPlaceholderMetadata,
  assertUnsupportedThrow,
  replaceDispatcherWithSpies,
  assertCallbackActionPreflightPublicBlockersFailClosed,
  assertCallbackActionPreflightPublicBoundaryFailClosed,
  assertRejectedErrorPreflightPublicBlockersFailClosed,
  assertRejectedErrorPreflightPublicBoundaryFailClosed,
  createPrivateGateScenario,
  createPrivateFormActionCallbackPreflightScenario,
  createRootMapStorageExecutionForRoot,
  createPrivateFulfilledResetExecutionRecord,
  createPrivateRejectedFormActionAsyncExecution,
  createPrivateControlledValueTrackerScenario,
  createPrivateControlledWrapperPropertyPayloadScenario,
  createPrivateRootBridgeAdmission,
  createRootBridgeDocument,
  createRootBridgeElement,
  removeRootBridgeEventRegistration,
  createWrapperMutationIntentSources,
  createWrapperMutationIntentSourceSet,
  createControlledInputEventDispatch,
  createControlledInputChangePreflight,
  createControlledLatestPropsLookup,
  createThrowingFakeResourceDocument,
  createThrowingFakeResourceHead,
  createDeterministicFakeResourceDom,
  createDeterministicFakeResourceElement,
  appendFakeHeadChild,
  createControlledInputFakeDomTarget,
  throwingProxy,
  oracleValue,
  summarizeDispatcherRecord,
  summarizeDispatcherArgument,
  summarizeFakeDomAdapterAdmission,
  summarizeFakeDomInsertion,
  summarizeHeadBoundary,
  summarizeHeadClearRetain,
  summarizePreloadPreinitOrder,
  createResourceMapCommitScenario,
  assertRootMapStoragePreflightAdmissionRejects,
  assertRootMapStorageExecutionAdmissionRejects,
  createRootMapStoragePreflightScenario,
  createDuplicateRootMapStoragePreflightScenario,
  createStylesheetPrecedenceLoadErrorStateScenario,
  fakeResourceSourceUsesNoLoadErrorListeners,
  requireFresh,
  findDisallowedSourceMatches,
  formatSourceMatches,
  listJavaScriptFiles,
  dataDescriptorFields
} = require('./helpers.js');

test('resource/form root bridge boundary metadata matches accepted blocked root gates', async () => {
  const rootFacadeGate = await import(
    pathToFileURL(
      path.join(
        repoRoot,
        'tests',
        'conformance',
        'src',
        'react-dom-root-render-e2e-conformance-gate.mjs'
      )
    ).href
  );
  const summary = resourceFormGate.describeResourceFormRootBridgeBlockedGate();

  assert.equal(summary.schemaVersion, 1);
  assert.equal(
    summary.gateId,
    resourceFormGate.resourceFormRootBridgeBlockedGateId
  );
  assert.equal(summary.compatibilityTarget, compatibilityTarget);
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(summary.unsupportedCode, unsupportedCode);
  assert.deepEqual(summary.sideEffects, resourceFormGate.rootBoundarySideEffects);
  assert.equal(summary.sideEffects.privateDispatcherInvoked, false);
  assert.equal(summary.sideEffects.documentMutated, false);
  assert.equal(summary.sideEffects.headMutated, false);
  assert.equal(summary.sideEffects.stylesheetPrecedenceApplied, false);
  assert.equal(summary.sideEffects.fizzInstructionEmitted, false);
  assert.equal(summary.sideEffects.fakeDomAdapterInvoked, false);
  assert.equal(summary.sideEffects.fakeDocumentRead, false);
  assert.equal(summary.sideEffects.fakeHeadRead, false);
  assert.equal(summary.sideEffects.fakeResourceElementCreated, false);
  assert.equal(summary.sideEffects.fakeResourceElementInserted, false);
  assert.equal(summary.sideEffects.fakeDomInsertionGateInvoked, false);
  assert.equal(
    summary.sideEffects.fakeResourceElementAttributesApplied,
    false
  );
  assert.equal(summary.sideEffects.fakeHeadBoundaryInvoked, false);
  assert.equal(summary.sideEffects.fakeHeadInsertionObserved, false);
  assert.equal(summary.sideEffects.fakeHeadUpdateApplied, false);
  assert.equal(
    summary.sideEffects.fakeHeadClearRetainDiagnosticInvoked,
    false
  );
  assert.equal(summary.sideEffects.fakeHeadChildrenScanned, false);
  assert.equal(summary.sideEffects.fakeHeadChildRemoved, false);
  assert.equal(
    summary.sideEffects.stylesheetPrecedenceBlockedCapabilitiesRecorded,
    false
  );
  assert.equal(
    summary.sideEffects.fakePreloadPreinitOrderDiagnosticInvoked,
    false
  );
  assert.equal(
    summary.sideEffects.fakeHeadInsertionOrderObserved,
    false
  );
  assert.equal(summary.sideEffects.resourceHintDedupeRowsRecorded, false);
  assert.equal(
    summary.sideEffects.resourceHintPrecedenceRowsRecorded,
    false
  );
  assert.equal(
    summary.sideEffects.resourceHintHeadOrderRowsRecorded,
    false
  );
  assert.equal(
    summary.sideEffects.publicPreloadPreinitDedupeBehavior,
    false
  );
  assert.equal(summary.sideEffects.headSingletonResolved, false);
  assert.equal(summary.sideEffects.publicHeadSingletonBehavior, false);
  assert.equal(summary.sideEffects.realDocumentMutated, false);
  assert.equal(summary.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(
    summary.sideEffects.formDispatcherMetadataRecorded,
    false
  );
  assert.equal(summary.sideEffects.submissionIntentRecorded, false);
  assert.equal(summary.sideEffects.resetIntentRecorded, false);
  assert.equal(summary.sideEffects.realFormInspected, false);
  assert.equal(summary.sideEffects.submitControlInspected, false);
  assert.equal(summary.sideEffects.formDataConstructed, false);
  assert.equal(
    summary.sideEffects.sourceSubmissionIntentConsumed,
    false
  );
  assert.equal(
    summary.sideEffects.eventExtractionMetadataRecorded,
    false
  );
  assert.equal(summary.sideEffects.nativeEventInspected, false);
  assert.equal(summary.sideEffects.syntheticEventCreated, false);
  assert.equal(summary.sideEffects.actionInvoked, false);
  assert.equal(summary.sideEffects.hostTransitionStarted, false);
  assert.equal(summary.sideEffects.realFormReset, false);
  assert.deepEqual(
    summary.privateResourceDispatcherBoundary,
    resourceFormGate.describePrivateResourceDispatcherBoundary(null)
  );
  assert.deepEqual(
    summary.privateResourceDispatcherBoundary,
    resourceFormGate.describePrivateResourceHintDispatcherMetadataGate()
  );
  assert.deepEqual(
    summary.privateFormActionResetDispatcherBoundary,
    resourceFormGate.describePrivateFormActionResetDispatcherBoundary(null)
  );
  assert.deepEqual(
    summary.privateFormActionResetDispatcherBoundary,
    resourceFormGate.describePrivateFormActionResetDispatcherGate()
  );
  assert.deepEqual(
    summary.privateFormActionEventExtractionBoundary,
    resourceFormGate.describePrivateFormActionEventExtractionBoundary(null)
  );
  assert.deepEqual(
    summary.privateFormActionEventExtractionBoundary,
    resourceFormGate.describePrivateFormActionEventExtractionGate()
  );
  assert.deepEqual(
    summary.privateFormActionSubmitDispatchBoundary,
    resourceFormGate.describePrivateFormActionSubmitDispatchBoundary(null)
  );
  assert.deepEqual(
    summary.privateFormActionSubmitDispatchBoundary,
    formActions.describePrivateFormActionSubmitDispatchGate()
  );
  assert.deepEqual(
    summary.privateFormActionSubmitResetExecutionBoundary,
    resourceFormGate
      .describePrivateFormActionSubmitResetExecutionBoundary(null)
  );
  assert.deepEqual(
    summary.privateFormActionSubmitResetExecutionBoundary,
    formActions.describePrivateFormActionSubmitResetExecutionGate()
  );
  assert.deepEqual(
    summary.privateFormActionCallbackActionPreflightBoundary,
    resourceFormGate
      .describePrivateFormActionCallbackActionPreflightBoundary(null)
  );
  assert.deepEqual(
    summary.privateFormActionCallbackActionPreflightBoundary,
    formActions.describePrivateFormActionCallbackActionPreflightGate()
  );
  assert.deepEqual(
    summary.privateFormActionAsyncCallbackExecutionBoundary,
    resourceFormGate
      .describePrivateFormActionAsyncCallbackExecutionBoundary(null)
  );
  assert.deepEqual(
    summary.privateFormActionAsyncCallbackExecutionBoundary,
    formActions.describePrivateFormActionAsyncCallbackExecutionGate()
  );
  assert.deepEqual(
    summary.privateFormActionFulfilledResetExecutionBoundary,
    resourceFormGate
      .describePrivateFormActionFulfilledResetExecutionBoundary(null)
  );
  assert.deepEqual(
    summary.privateFormActionFulfilledResetExecutionBoundary,
    formActions.describePrivateFormActionFulfilledResetExecutionGate()
  );
  assert.deepEqual(
    summary.privateFormActionRejectedErrorPreflightBoundary,
    resourceFormGate
      .describePrivateFormActionRejectedErrorPreflightBoundary(null)
  );
  assert.deepEqual(
    summary.privateFormActionRejectedErrorPreflightBoundary,
    formActions.describePrivateFormActionRejectedErrorPreflightGate()
  );
  assert.deepEqual(
    summary.privateResourceFormRootExecutionConsumerBoundary,
    resourceFormGate.describePrivateResourceFormRootExecutionConsumerBoundary()
  );
  assert.equal(
    summary.privateResourceFormRootExecutionConsumerBoundary.ledgerBoundary
      .ledgerId,
    resourceFormGate.privateResourceFormExecutionAdmissionLedgerId
  );

  assert.deepEqual(summary.publicRootBoundary, {
    gateId: rootFacadeGate.REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_GATE_ID,
    gateStatus: rootFacadeGate.REACT_DOM_ROOT_PUBLIC_FACADE_BLOCKED_STATUS,
    rootObjectCreated: false,
    renderReachable: false,
    unmountReachable: false,
    compatibilityClaimed: false
  });
  assert.equal(
    summary.privateRootBridgeBoundary.gateStatus,
    rootFacadeGate.REACT_DOM_ROOT_PUBLIC_FACADE_BRIDGE_RECORD_ONLY_STATUS
  );
  assert.equal(
    summary.privateRootBridgeBoundary.executionStatus,
    rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
  );
  assert.equal(
    summary.privateRootBridgeBoundary.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.equal(summary.privateRootBridgeBoundary.admittedRootRequest, false);
  assert.equal(summary.privateRootBridgeBoundary.nativeExecution, false);
  assert.equal(summary.privateRootBridgeBoundary.reconcilerExecution, false);
  assert.equal(summary.privateRootBridgeBoundary.domMutation, false);
  assert.equal(summary.privateRootBridgeBoundary.markerWrites, false);
  assert.equal(summary.privateRootBridgeBoundary.listenerInstallation, false);
  assert.equal(summary.privateRootBridgeBoundary.hydration, false);
  assert.equal(summary.privateRootBridgeBoundary.eventDispatch, false);
  assert.equal(summary.privateRootBridgeBoundary.compatibilityClaimed, false);
  assert.deepEqual(
    summary.privateRootBridgeBoundary.blockedCapabilities,
    rootBridge.ROOT_BRIDGE_BLOCKED_CAPABILITIES
  );
  assert.deepEqual(summary.sourceAdapterBoundary, {
    gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
    behaviorArea: null,
    supportedBehaviorAreas: [
      'resource-hint',
      'form-action',
      'controlled-form'
    ],
    adaptersInvoked: false,
    rawTargetCaptured: false,
    publicRootTouched: false,
    compatibilityClaimed: false,
    resourceHintFakeDomAdapterBoundary: {
      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
      behaviorArea: null,
      metadataGateAvailable: true,
      adapterAdmissionRequired: true,
      adapterRecordsAccepted: true,
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
      adapterGate: resourceFormGate.describePrivateResourceHintFakeDomAdapterGate(),
      insertionGate:
        resourceFormGate.describePrivateResourceHintFakeDomInsertionGate(),
      headBoundaryGate:
        resourceFormGate.describePrivateResourceHintHeadBoundaryGate(),
      headClearRetainGate:
        resourceFormGate.describePrivateResourceHintHeadClearRetainGate(),
      preloadPreinitOrderGate:
        resourceFormGate.describePrivateResourceHintPreloadPreinitOrderGate(),
      stylesheetPrecedenceGate:
        resourceFormGate.describePrivateResourceHintStylesheetPrecedenceGate(),
      resourceMapCommitGate:
        resourceFormGate.describePrivateResourceHintResourceMapCommitGate(),
      rootMapStoragePreflightGate:
        resourceFormGate
          .describePrivateResourceHintRootMapStoragePreflightGate(),
      rootMapStorageGate:
        resourceFormGate.describePrivateResourceHintRootMapStorageGate(),
      stylesheetLoadErrorStateGate:
        resourceFormGate
          .describePrivateResourceHintStylesheetLoadErrorStateGate()
    },
    formActionResetDispatcherBoundary: {
      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
      behaviorArea: null,
      supportedBehaviorArea: 'form-action',
      appliesToRequest: false,
      metadataGateAvailable: true,
      dispatcherRecordsAccepted: true,
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
      dispatcherGate:
        resourceFormGate.describePrivateFormActionResetDispatcherGate(),
	      eventExtractionGate:
	        resourceFormGate.describePrivateFormActionEventExtractionGate(),
	      resetQueueCommitGate:
	        resourceFormGate.describePrivateFormActionResetQueueCommitGate(),
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
	    },
	    formActionEventExtractionBoundary: {
      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
      behaviorArea: null,
      supportedBehaviorArea: 'form-action',
      appliesToRequest: false,
      metadataGateAvailable: true,
      sourceRecordsAccepted: true,
      acceptedSourceRecordType:
        resourceFormGate.privateFormActionResetDispatcherRecordType,
      acceptedSourceStatus:
        resourceFormGate.privateFormActionSubmissionIntentRecordedStatus,
      acceptedSubmissionTriggers: ['submit', 'requestSubmit'],
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
	        resourceFormGate.describePrivateFormActionEventExtractionGate()
	    },
	    formActionSubmitDispatchBoundary: {
	      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	      behaviorArea: null,
	      supportedBehaviorArea: 'form-action',
	      appliesToRequest: false,
	      metadataGateAvailable: true,
	      sourceRecordsAccepted: true,
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
	    },
	    formActionSubmitResetExecutionBoundary: {
	      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	      behaviorArea: null,
	      supportedBehaviorArea: 'form-action',
	      appliesToRequest: false,
	      metadataGateAvailable: true,
	      sourceRecordsAccepted: true,
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
	    },
	    formActionCallbackActionPreflightBoundary: {
	      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	      behaviorArea: null,
	      supportedBehaviorArea: 'form-action',
	      appliesToRequest: false,
	      metadataGateAvailable: true,
	      sourceRecordsAccepted: true,
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
	    },
	    formActionAsyncCallbackExecutionBoundary: {
	      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	      behaviorArea: null,
	      supportedBehaviorArea: 'form-action',
	      appliesToRequest: false,
	      metadataGateAvailable: true,
	      sourceRecordsAccepted: true,
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
	    },
	    formActionFulfilledResetExecutionBoundary: {
	      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	      behaviorArea: null,
	      supportedBehaviorArea: 'form-action',
	      appliesToRequest: false,
	      metadataGateAvailable: true,
	      sourceRecordsAccepted: true,
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
	    },
	    formActionRejectedErrorPreflightBoundary: {
	      gateStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	      behaviorArea: null,
	      supportedBehaviorArea: 'form-action',
	      appliesToRequest: false,
	      metadataGateAvailable: true,
	      sourceRecordsAccepted: true,
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
	    },
	    controlledValueTrackerBoundary: {
      gateStatus: resourceFormGate.privateControlledValueTrackerBlockedStatus,
      behaviorArea: null,
      supportedBehaviorArea: 'controlled-form',
      appliesToRequest: false,
      metadataGateAvailable: true,
      trackerRecordsAccepted: true,
      liveHostNodeRequired: false,
      rawTargetCaptured: false,
      trackerAttached: false,
      hostValueRead: false,
      hostValueWritten: false,
      postEventRestoreQueued: false,
      publicControlledBehaviorEnabled: false,
      compatibilityClaimed: false
    }
  });
});

test('resource/form requests stay fail-closed with accepted private root bridge admission', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'root-boundary-gate'
  });
  const { admission, container, document } = createPrivateRootBridgeAdmission();
  const requests = [
    gate.recordResourceHintRequest('preload', [
      'https://fast-react.invalid/app.js',
      throwingProxy('resource options')
    ]),
    gate.recordFormActionRequest('requestFormReset', [
      throwingProxy('form element')
    ]),
    gate.recordControlledFormRequest('input', [
      throwingProxy('controlled props')
    ])
  ];

  const blockedRecords = requests.map((request) =>
    resourceFormGate.recordResourceFormRootBridgeBlockedRequest(request, {
      rootBridgeAdmission: admission
    })
  );

  assert.deepEqual(
    blockedRecords.map((record) => ({
      behaviorArea: record.behaviorArea,
      requestType: record.requestType,
      status: record.status,
      publicRootStatus: record.publicRootBoundary.gateStatus,
      rootBridgeStatus: record.rootBridgeBoundary.gateStatus,
      sourceAdapterStatus: record.sourceAdapterBoundary.gateStatus,
      resourceHintAdapterApplies:
        record.sourceAdapterBoundary.resourceHintFakeDomAdapterBoundary !==
        null,
      formActionDispatcherApplies:
        record.sourceAdapterBoundary.formActionResetDispatcherBoundary !==
        null,
	      formActionEventExtractionApplies:
	        record.sourceAdapterBoundary.formActionEventExtractionBoundary !==
	        null,
	      formActionSubmitDispatchApplies:
	        record.sourceAdapterBoundary.formActionSubmitDispatchBoundary !==
	        null,
	      formActionAsyncCallbackApplies:
	        record.sourceAdapterBoundary
	          .formActionAsyncCallbackExecutionBoundary !== null,
	      formActionFulfilledResetApplies:
	        record.sourceAdapterBoundary
	          .formActionFulfilledResetExecutionBoundary !== null,
	      formActionRejectedErrorPreflightApplies:
	        record.sourceAdapterBoundary
	          .formActionRejectedErrorPreflightBoundary !== null,
	      trackerBoundaryApplies:
	        record.sourceAdapterBoundary.controlledValueTrackerBoundary
          .appliesToRequest
    })),
    [
      {
        behaviorArea: 'resource-hint',
        requestType: 'resource-hint.preload',
        status: resourceFormGate.unsupportedStatus,
        publicRootStatus: resourceFormGate.publicRootFacadeBlockedStatus,
        rootBridgeStatus: resourceFormGate.privateRootBridgeRecordOnlyStatus,
        sourceAdapterStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	        resourceHintAdapterApplies: true,
	        formActionDispatcherApplies: false,
	        formActionEventExtractionApplies: false,
	        formActionSubmitDispatchApplies: false,
	        formActionAsyncCallbackApplies: false,
	        formActionFulfilledResetApplies: false,
	        formActionRejectedErrorPreflightApplies: false,
	        trackerBoundaryApplies: false
	      },
      {
        behaviorArea: 'form-action',
        requestType: 'form-action.requestFormReset',
        status: resourceFormGate.unsupportedStatus,
        publicRootStatus: resourceFormGate.publicRootFacadeBlockedStatus,
        rootBridgeStatus: resourceFormGate.privateRootBridgeRecordOnlyStatus,
        sourceAdapterStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	        resourceHintAdapterApplies: false,
	        formActionDispatcherApplies: true,
	        formActionEventExtractionApplies: true,
	        formActionSubmitDispatchApplies: true,
	        formActionAsyncCallbackApplies: true,
	        formActionFulfilledResetApplies: true,
	        formActionRejectedErrorPreflightApplies: true,
	        trackerBoundaryApplies: false
	      },
      {
        behaviorArea: 'controlled-form',
        requestType: 'controlled-form.input',
        status: resourceFormGate.unsupportedStatus,
        publicRootStatus: resourceFormGate.publicRootFacadeBlockedStatus,
        rootBridgeStatus: resourceFormGate.privateRootBridgeRecordOnlyStatus,
        sourceAdapterStatus: resourceFormGate.privateSourceAdapterBlockedStatus,
	        resourceHintAdapterApplies: false,
	        formActionDispatcherApplies: false,
	        formActionEventExtractionApplies: false,
	        formActionSubmitDispatchApplies: false,
	        formActionAsyncCallbackApplies: false,
	        formActionFulfilledResetApplies: false,
	        formActionRejectedErrorPreflightApplies: false,
	        trackerBoundaryApplies: true
	      }
    ]
  );

  for (const blockedRecord of blockedRecords) {
    assert.equal(Object.isFrozen(blockedRecord), true);
    assert.equal(
      resourceFormGate.isResourceFormRootBridgeBlockedRecord(blockedRecord),
      true
    );
    assert.equal(
      resourceFormGate.getResourceFormRootBridgeBlockedRecordPayload(
        blockedRecord
      ),
      blockedRecord
    );
    assert.equal(blockedRecord.compatibilityTarget, compatibilityTarget);
    assert.equal(blockedRecord.unsupportedCode, unsupportedCode);
    assert.deepEqual(
      blockedRecord.sideEffects,
      resourceFormGate.rootBoundarySideEffects
    );
    assert.equal(blockedRecord.publicRootBoundary.rootObjectCreated, false);
    assert.equal(blockedRecord.publicRootBoundary.renderReachable, false);
    assert.equal(blockedRecord.publicRootBoundary.unmountReachable, false);
    assert.equal(blockedRecord.publicRootBoundary.compatibilityClaimed, false);
    assert.equal(blockedRecord.rootBridgeBoundary.admittedRootRequest, true);
    assert.equal(
      blockedRecord.rootBridgeBoundary.admissionStatus,
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
    );
    assert.equal(
      blockedRecord.rootBridgeBoundary.executionStatus,
      rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
    );
    assert.equal(blockedRecord.rootBridgeBoundary.nativeExecution, false);
    assert.equal(blockedRecord.rootBridgeBoundary.reconcilerExecution, false);
    assert.equal(blockedRecord.rootBridgeBoundary.domMutation, false);
    assert.equal(blockedRecord.rootBridgeBoundary.markerWrites, false);
    assert.equal(blockedRecord.rootBridgeBoundary.listenerInstallation, false);
    assert.equal(blockedRecord.rootBridgeBoundary.hydration, false);
    assert.equal(blockedRecord.rootBridgeBoundary.eventDispatch, false);
    assert.equal(blockedRecord.rootBridgeBoundary.compatibilityClaimed, false);
    if (blockedRecord.behaviorArea === 'resource-hint') {
      assert.deepEqual(
        blockedRecord.privateResourceDispatcherBoundary,
        resourceFormGate.describePrivateResourceHintDispatcherMetadataGate()
      );
    } else {
      assert.equal(blockedRecord.privateResourceDispatcherBoundary, null);
    }
    assert.equal(blockedRecord.sideEffects.privateDispatcherInvoked, false);
    assert.equal(blockedRecord.sideEffects.documentMutated, false);
    assert.equal(blockedRecord.sideEffects.headMutated, false);
    assert.equal(
      blockedRecord.sideEffects.stylesheetPrecedenceApplied,
      false
    );
    assert.equal(blockedRecord.sideEffects.fizzInstructionEmitted, false);
    assert.equal(blockedRecord.sideEffects.fakeDomAdapterInvoked, false);
    assert.equal(blockedRecord.sideEffects.fakeDocumentRead, false);
    assert.equal(blockedRecord.sideEffects.fakeDocumentMutated, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadRead, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadMutated, false);
    assert.equal(blockedRecord.sideEffects.fakeResourceElementCreated, false);
    assert.equal(blockedRecord.sideEffects.fakeResourceElementInserted, false);
    assert.equal(blockedRecord.sideEffects.fakeDomInsertionGateInvoked, false);
    assert.equal(
      blockedRecord.sideEffects.fakeResourceElementAttributesApplied,
      false
    );
    assert.equal(blockedRecord.sideEffects.fakeHeadBoundaryInvoked, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadInsertionObserved, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadUpdateApplied, false);
    assert.equal(
      blockedRecord.sideEffects.fakeHeadClearRetainDiagnosticInvoked,
      false
    );
    assert.equal(blockedRecord.sideEffects.fakeHeadChildrenScanned, false);
    assert.equal(blockedRecord.sideEffects.fakeHeadChildRemoved, false);
    assert.equal(
      blockedRecord.sideEffects.resourceHintClearRetainRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.singletonClearRetainRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects
        .stylesheetPrecedenceBlockedCapabilitiesRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakePreloadPreinitOrderDiagnosticInvoked,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakeHeadInsertionOrderObserved,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.resourceHintDedupeRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.resourceHintPrecedenceRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.resourceHintHeadOrderRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.publicPreloadPreinitDedupeBehavior,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakeStylesheetPrecedenceDiagnosticInvoked,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetPrecedenceDedupeRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetPrecedenceInsertionRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetPrecedenceSingletonOrderRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetPrecedenceResourceMapCreated,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetPrecedenceResourceMapMutated,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakeResourceMapCommitDiagnosticInvoked,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.privateResourceMapCommitRecordsCreated,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.resourceMapCommitRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects
        .fakeScriptModuleCommitExecutionDiagnosticInvoked,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.scriptModuleFakeDomCommitRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.scriptResourceFakeDomCommitRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.modulePreloadFakeDomCommitRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakeScriptModuleResourceOrderingDiagnosticInvoked,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.scriptModuleFakeResourceOrderRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.scriptModuleFakeResourceDedupeStatesRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.scriptModuleFakeResourceOrderingExecuted,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetLoadErrorStateRecordConsumed,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetLoadStateCommitOrderRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetLoadStateCommitTransitionRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakeStylesheetResourceCommitTransitionRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects
        .fakeStylesheetLoadStateCommitExecutionDiagnosticInvoked,
      false
    );
    assert.equal(
      blockedRecord.sideEffects
        .stylesheetLoadStateCommitExecutionRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetLoadStateChangeRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects
        .deterministicStylesheetLoadStateChangesRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakeStylesheetLoadErrorStateDiagnosticInvoked,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.stylesheetLoadingStateRowsRecorded,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.realResourceMapsMutated,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.fakeResourceMapsMutated,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.publicResourceMapCommitBehavior,
      false
    );
    assert.equal(
      blockedRecord.sideEffects.preloadOrStyleDomWorkDispatched,
      false
    );
    assert.equal(blockedRecord.sideEffects.headSingletonResolved, false);
    assert.equal(
      blockedRecord.sideEffects.publicHeadSingletonBehavior,
      false
    );
    assert.equal(blockedRecord.sideEffects.realDocumentMutated, false);
    assert.equal(
      blockedRecord.sideEffects.publicResourceHintDomInsertion,
      false
    );
    assert.equal(blockedRecord.sourceAdapterBoundary.adaptersInvoked, false);
    assert.equal(blockedRecord.sourceAdapterBoundary.rawTargetCaptured, false);
    assert.equal(blockedRecord.sourceAdapterBoundary.publicRootTouched, false);
    assert.equal(
      blockedRecord.sourceAdapterBoundary.compatibilityClaimed,
      false
    );
    if (blockedRecord.behaviorArea === 'resource-hint') {
      const adapterBoundary =
        blockedRecord.sourceAdapterBoundary
          .resourceHintFakeDomAdapterBoundary;
      assert.equal(adapterBoundary.adapterAdmissionRequired, true);
      assert.equal(adapterBoundary.adapterRecordsAccepted, true);
      assert.equal(adapterBoundary.adapterInvoked, false);
      assert.equal(adapterBoundary.fakeDocumentRead, false);
      assert.equal(adapterBoundary.fakeHeadRead, false);
      assert.equal(adapterBoundary.fakeDocumentMutated, false);
      assert.equal(adapterBoundary.fakeHeadMutated, false);
      assert.equal(adapterBoundary.resourceElementCreated, false);
      assert.equal(adapterBoundary.resourceElementInserted, false);
      assert.equal(adapterBoundary.fakeDomInsertionGateInvoked, false);
      assert.equal(
        adapterBoundary.fakeResourceElementAttributesApplied,
        false
      );
      assert.equal(adapterBoundary.fakeHeadBoundaryInvoked, false);
      assert.equal(adapterBoundary.fakeHeadInsertionObserved, false);
      assert.equal(adapterBoundary.fakeHeadUpdateApplied, false);
      assert.equal(
        adapterBoundary.fakeHeadClearRetainDiagnosticInvoked,
        false
      );
      assert.equal(adapterBoundary.fakeHeadChildrenScanned, false);
      assert.equal(adapterBoundary.fakeHeadChildRemoved, false);
      assert.equal(
        adapterBoundary.resourceHintClearRetainRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.singletonClearRetainRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetPrecedenceBlockedCapabilitiesRecorded,
        false
      );
      assert.equal(
        adapterBoundary.fakePreloadPreinitOrderDiagnosticInvoked,
        false
      );
      assert.equal(adapterBoundary.fakeHeadInsertionOrderObserved, false);
      assert.equal(adapterBoundary.resourceHintDedupeRowsRecorded, false);
      assert.equal(
        adapterBoundary.resourceHintPrecedenceRowsRecorded,
        false
      );
      assert.equal(adapterBoundary.resourceHintHeadOrderRowsRecorded, false);
      assert.equal(
        adapterBoundary.publicPreloadPreinitDedupeBehavior,
        false
      );
      assert.equal(
        adapterBoundary.fakeStylesheetPrecedenceDiagnosticInvoked,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetPrecedenceDedupeRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetPrecedenceInsertionRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetPrecedenceSingletonOrderRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetPrecedenceResourceMapCreated,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetPrecedenceResourceMapMutated,
        false
      );
      assert.equal(
        adapterBoundary.fakeResourceMapCommitDiagnosticInvoked,
        false
      );
      assert.equal(
        adapterBoundary.privateResourceMapCommitRecordsCreated,
        false
      );
      assert.equal(adapterBoundary.resourceMapCommitRowsRecorded, false);
      assert.equal(
        adapterBoundary.stylesheetResourceMapCommitRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.preloadResourceMapCommitRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.scriptResourceMapCommitRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.moduleResourceMapOrderRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.moduleResourceMapDedupeKeysRecorded,
        false
      );
      assert.equal(
        adapterBoundary.fakeScriptModuleCommitExecutionDiagnosticInvoked,
        false
      );
      assert.equal(
        adapterBoundary.scriptModuleFakeDomCommitRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.scriptResourceFakeDomCommitRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.modulePreloadFakeDomCommitRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.fakeScriptModuleResourceOrderingDiagnosticInvoked,
        false
      );
      assert.equal(
        adapterBoundary.scriptModuleFakeResourceOrderRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.scriptModuleFakeResourceDedupeStatesRecorded,
        false
      );
      assert.equal(
        adapterBoundary.scriptModuleFakeResourceOrderingExecuted,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetLoadErrorStateRecordConsumed,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetLoadStateCommitOrderRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetLoadStateResourceMapRowsValidated,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetLoadStateCommitTransitionRecorded,
        false
      );
      assert.equal(
        adapterBoundary.fakeStylesheetResourceCommitTransitionRecorded,
        false
      );
      assert.equal(
        adapterBoundary
          .fakeStylesheetLoadStateCommitExecutionDiagnosticInvoked,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetLoadStateCommitExecutionRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetLoadStateChangeRowsRecorded,
        false
      );
      assert.equal(
        adapterBoundary.deterministicStylesheetLoadStateChangesRecorded,
        false
      );
      assert.equal(adapterBoundary.realResourceMapsMutated, false);
      assert.equal(adapterBoundary.fakeResourceMapsMutated, false);
      assert.equal(adapterBoundary.resourceLoadStateMutated, false);
      assert.equal(
        adapterBoundary.fakeStylesheetLoadErrorStateDiagnosticInvoked,
        false
      );
      assert.equal(
        adapterBoundary.stylesheetLoadingStateRowsRecorded,
        false
      );
      assert.equal(adapterBoundary.stylesheetFetchStarted, false);
      assert.equal(adapterBoundary.stylesheetCommitSuspended, false);
      assert.equal(
        adapterBoundary.publicResourceMapCommitBehavior,
        false
      );
      assert.equal(
        adapterBoundary.publicStylesheetLoadStateDispatch,
        false
      );
      assert.equal(adapterBoundary.preloadOrStyleDomWorkDispatched, false);
      assert.equal(adapterBoundary.resourceFetchStarted, false);
      assert.equal(adapterBoundary.realDocumentMutated, false);
      assert.equal(adapterBoundary.publicResourceHintDomInsertion, false);
      assert.deepEqual(
        adapterBoundary.adapterGate,
        resourceFormGate.describePrivateResourceHintFakeDomAdapterGate()
      );
      assert.deepEqual(
        adapterBoundary.insertionGate,
        resourceFormGate.describePrivateResourceHintFakeDomInsertionGate()
      );
      assert.deepEqual(
        adapterBoundary.headBoundaryGate,
        resourceFormGate.describePrivateResourceHintHeadBoundaryGate()
      );
      assert.deepEqual(
        adapterBoundary.headClearRetainGate,
        resourceFormGate.describePrivateResourceHintHeadClearRetainGate()
      );
      assert.deepEqual(
        adapterBoundary.preloadPreinitOrderGate,
        resourceFormGate.describePrivateResourceHintPreloadPreinitOrderGate()
      );
      assert.deepEqual(
        adapterBoundary.stylesheetPrecedenceGate,
        resourceFormGate.describePrivateResourceHintStylesheetPrecedenceGate()
      );
      assert.deepEqual(
        adapterBoundary.resourceMapCommitGate,
        resourceFormGate.describePrivateResourceHintResourceMapCommitGate()
      );
      assert.deepEqual(
        adapterBoundary.stylesheetLoadErrorStateGate,
        resourceFormGate
          .describePrivateResourceHintStylesheetLoadErrorStateGate()
      );
    } else {
      assert.equal(
        blockedRecord.sourceAdapterBoundary.resourceHintFakeDomAdapterBoundary,
        null
      );
    }
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .gateStatus,
      resourceFormGate.privateControlledValueTrackerBlockedStatus
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .trackerAttached,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .hostValueRead,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .hostValueWritten,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .postEventRestoreQueued,
      false
    );
    assert.equal(
      blockedRecord.sourceAdapterBoundary.controlledValueTrackerBoundary
        .publicControlledBehaviorEnabled,
      false
    );
  }

  assert.equal(container.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  assert.throws(
    () =>
      resourceFormGate.recordResourceFormRootBridgeBlockedRequest(requests[0], {
        rootBridgeAdmission: {
          ...admission,
          compatibilityClaimed: true
        }
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidRootMetadataCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.recordResourceFormRootBridgeBlockedRequest(requests[0], {
        publicRootGateStatus: 'matched-react-dom-root'
      }),
    {
      code: resourceFormGate.rootBoundaryInvalidPublicMetadataCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () => resourceFormGate.recordResourceFormRootBridgeBlockedRequest({}),
    {
      code: resourceFormGate.rootBoundaryInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource/form root execution consumer links accepted fake evidence to root boundary only', async () => {
  const { admission, container, document, lifecycleBoundary } =
    createPrivateRootBridgeAdmission();
  const resourceExecution = createRootMapStorageExecutionForRoot(
    'root-execution-consumer',
    admission.rootId,
    {
      admission,
      lifecycleBoundary
    }
  );
  const { fulfilledResetExecution } =
    await createPrivateFulfilledResetExecutionRecord(
      'root-execution-consumer-form',
      {
        admission,
        lifecycleBoundary
      }
    );
  const gate = resourceFormGate.createResourceFormRootExecutionConsumerGate({
    requestIdPrefix: 'root-execution-consumer-gate'
  });
  const consumer = gate.recordRootExecutionConsumer(
    admission,
    lifecycleBoundary,
    resourceExecution,
    fulfilledResetExecution,
    {
      explicitResourceFormRootExecutionConsumer: true
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceFormRootExecutionConsumerBoundary();

  assert.equal(Object.isFrozen(consumer), true);
  assert.equal(
    resourceFormGate.isResourceFormRootExecutionConsumerRecord(consumer),
    true
  );
  assert.equal(
    resourceFormGate.getResourceFormRootExecutionConsumerRecordPayload(
      consumer
    ),
    consumer
  );
  assert.equal(
    consumer.$$typeof,
    resourceFormGate.resourceFormRootExecutionConsumerRecordType
  );
  assert.equal(
    consumer.gateId,
    resourceFormGate.privateResourceFormRootExecutionConsumerGateId
  );
  assert.equal(
    consumer.status,
    resourceFormGate.privateResourceFormRootExecutionConsumerStatus
  );
  assert.equal(
    consumer.compatibilityStatus,
    resourceFormGate
      .privateResourceFormRootExecutionConsumerCompatibilityBlockedStatus
  );
  assert.equal(consumer.consumerId, 'root-execution-consumer-gate:1');
  assert.equal(consumer.rootId, admission.rootId);
  assert.equal(
    consumer.sourceRootBridgeAdmissionId,
    admission.requestId
  );
  assert.equal(consumer.rootBridgeBoundary.admittedRootRequest, true);
  assert.equal(
    consumer.rootBridgeBoundary.executionStatus,
    rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
  );
  assert.equal(
    consumer.sourceRootLifecycleBoundaryId,
    lifecycleBoundary.boundaryId
  );
  assert.equal(
    consumer.rootLifecycleBoundary.boundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(
    consumer.rootLifecycleBoundary.rootId,
    admission.rootId
  );
  assert.equal(
    consumer.rootLifecycleBoundary.sourceOwnedLifecycleBoundaryConsumed,
    true
  );
  assert.equal(
    consumer.rootLifecycleBoundary.requestBoundaryCurrent,
    true
  );
  assert.equal(
    consumer.rootLifecycleBoundary.staleLifecycleSnapshotsRejected,
    true
  );
  assert.equal(consumer.rootLifecycleBoundary.publicRootExecution, false);
  assert.deepEqual(
    consumer.rootLifecycleBoundary.sourceOwnedTokens,
    [
      rootBridge.privateRootLifecycleRequestBoundaryRecordType,
      rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED,
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED,
      'render',
      'created->rendered'
    ]
  );
  assert.deepEqual(consumer.publicRootBoundary, {
    gateId: resourceFormGate.publicRootFacadeBlockedGateId,
    gateStatus: resourceFormGate.publicRootFacadeBlockedStatus,
    rootObjectCreated: false,
    renderReachable: false,
    unmountReachable: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(
    consumer.ledgerBoundary,
    summary.ledgerBoundary
  );
  assert.equal(
    summary.acceptedRootLifecycleRequestBoundaryRecordType,
    rootBridge.privateRootLifecycleRequestBoundaryRecordType
  );
  assert.equal(
    summary.acceptedRootLifecycleRequestBoundaryStatus,
    rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
  );
  assert.equal(
    summary.requiresSourceOwnedActiveRootLifecycleRequestBoundary,
    true
  );
  assert.equal(
    summary.requiresCurrentRenderRootLifecycleRequestBoundary,
    true
  );
  assert.equal(
    summary.requiresExactCurrentPrivateRootExecutionContext,
    true
  );
  assert.equal(summary.requiresSharedRootLifecyclePayload, true);
  assert.equal(summary.requiresSharedRootContainerIdentity, true);
  assert.equal(
    summary.requiresResourceRootMapStorageRootLifecycleIdentity,
    true
  );
  assert.equal(
    summary.requiresFormFulfilledResetRootLifecycleIdentity,
    true
  );
  assert.equal(summary.rejectsWrongRootLifecycleOperation, true);
  assert.equal(summary.rejectsStaleRootLifecycleSnapshots, true);
  assert.equal(summary.consumesFormFulfilledResetCurrentness, true);
  assert.equal(
    summary.acceptedFormResetCurrentnessRecordType,
    formActions.privateFormActionResetCurrentnessRecordType
  );
  assert.equal(
    summary.acceptedFormResetCurrentnessStatus,
    formActions.privateFormActionResetCurrentnessStatus
  );
  assert.equal(
    summary.rejectsFormFulfilledResetReplayAfterGenerationAdvance,
    true
  );
  assert.equal(
    summary.rejectsMalformedRootExecutionCurrentnessShapes,
    true
  );
  assert.equal(summary.rejectsReplayedRootExecutionEvidence, true);
  assert.equal(summary.rejectsCallerBuiltLifecycleSourceRecords, true);
  assert.equal(summary.rejectsRootlessFormFulfilledResetRecords, true);
  assert.equal(
    summary.rejectsRootlessResourceRootMapStorageRecords,
    true
  );
  assert.equal(summary.rejectsCrossContainerResourceRecords, true);
  assert.equal(summary.rejectsCrossContainerFormFulfilledResetRecords, true);
  assert.equal(consumer.ledgerBoundary.runtimeRecordsRequired, true);
  assert.equal(
    consumer.ledgerBoundary.callerSuppliedDiagnosticStringsAccepted,
    false
  );
  assert.deepEqual(consumer.ledgerBoundary.workerIds, [
    'worker-829-resource-root-map-storage-private-execution',
    'worker-952-react-dom-resource-hints-currentness',
    'worker-830-form-action-fulfilled-reset-fake-commit',
    'worker-883-resource-form-lifecycle-boundary-hardening',
    'worker-893-resource-form-reset-lifecycle-execution',
    'worker-942-resource-form-reset-currentness',
    'worker-850-resource-form-execution-admission-ledger'
  ]);
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary.sourceWorkerId,
    resourceFormGate.privateResourceFormRootExecutionCurrentnessWorkerId
  );
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary
      .exactCurrentPrivateRootLifecycleBoundary,
    true
  );
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary.sharedRootLifecyclePayload,
    true
  );
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary.sharedContainer,
    true
  );
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary
      .resourceRootExecutionBoundaryId,
    resourceExecution.rootExecutionBoundary.boundaryId
  );
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary.formRootExecutionBoundaryId,
    fulfilledResetExecution.rootExecutionBoundary.boundaryId
  );
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary.publicRootExecution,
    false
  );
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary.nativeExecution,
    false
  );
  assert.equal(
    consumer.rootExecutionCurrentnessBoundary.domMutation,
    false
  );
  assert.deepEqual(
    consumer.rootExecutionCurrentnessBoundary.sourceOwnedTokens,
    [
      resourceFormGate.privateResourceFormRootExecutionCurrentnessWorkerId,
      rootBridge.privateRootAdmissionRecordType,
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED,
      rootBridge.privateRootLifecycleRequestBoundaryRecordType,
      rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED,
      admission.rootId,
      lifecycleBoundary.boundaryId,
      lifecycleBoundary.lifecycleTransition,
      resourceExecution.rootExecutionBoundary.boundaryId,
      fulfilledResetExecution.rootExecutionBoundary.boundaryId
    ]
  );
  assert.deepEqual(
    consumer.sourceOwnedEvidence.rootExecutionCurrentnessTokens,
    consumer.rootExecutionCurrentnessBoundary.sourceOwnedTokens
  );
  assert.equal(
    consumer.sourceOwnedEvidence
      .currentPrivateRootLifecycleBoundaryConsumed,
    true
  );

  assert.equal(
    consumer.resourceRootMapStorageBoundary.rootMapStorageExecutionId,
    resourceExecution.rootMapStorageExecutionId
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.rootId,
    admission.rootId
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintRootMapStorageRootIdentityPayload(
      resourceExecution
    ).rootExecutionBoundary,
    resourceExecution.rootExecutionBoundary
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.rootExecutionBoundaryId,
    resourceExecution.rootExecutionBoundary.boundaryId
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.rootExecutionBoundaryStatus,
    resourceFormGate
      .privateResourceHintRootMapStorageRootLifecycleBoundaryStatus
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.sourceRootBridgeAdmissionId,
    admission.requestId
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.sourceRootLifecycleBoundaryId,
    lifecycleBoundary.boundaryId
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.rootContainerInfo,
    resourceExecution.rootExecutionBoundary.rootContainerInfo
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.lifecycleTransition,
    lifecycleBoundary.lifecycleTransition
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.lifecycleRequestVersion,
    lifecycleBoundary.lifecycleRequestVersion
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.activeRootLifecycle,
    true
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.requestBoundaryCurrent,
    true
  );
  assert.equal(consumer.resourceRootMapStorageBoundary.rowCount, 3);
  assert.deepEqual(
    consumer.resourceRootMapStorageBoundary.sourceOwnedTokens,
    [
      resourceFormGate.privateResourceHintRootMapStorageGateId,
      resourceFormGate.privateResourceHintRootMapStorageRecordType,
      resourceFormGate.privateResourceHintRootMapStorageStatus,
      resourceFormGate.privateResourceHintRootMapStorageExecutionStatus,
      resourceFormGate
        .privateResourceHintRootMapStorageCompatibilityBlockedStatus,
      'deterministic-private-root-map-storage-execution',
      'react-19.2.6-resource-root-map-storage-private-execution',
      'react-19.2.6-resource-root-map-storage-private-execution-snapshot',
      'validated-private-resource-root-map-storage-execution',
      resourceFormGate
        .privateResourceHintRootMapStorageRootLifecycleBoundaryRecordType,
      resourceFormGate
        .privateResourceHintRootMapStorageRootLifecycleBoundaryStatus,
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED,
      rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED
    ]
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary
      .deterministicFakeRootMapStorageConsumed,
    true
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.realResourceMapsMutated,
    false
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.preloadPropsMapMutated,
    false
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.publicResourceMapCommitBehavior,
    false
  );

  assert.equal(
    consumer.formFulfilledResetBoundary.executionId,
    fulfilledResetExecution.executionId
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.queueExecutionId,
    fulfilledResetExecution.fakeResetStateQueueExecution.queueExecutionId
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.commitExecutionId,
    fulfilledResetExecution.fakeResetCommitExecution.commitExecutionId
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.rootExecutionBoundaryId,
    fulfilledResetExecution.rootExecutionBoundary.boundaryId
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.sourceRootBridgeAdmissionId,
    admission.requestId
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.sourceRootLifecycleBoundaryId,
    lifecycleBoundary.boundaryId
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.resetCurrentnessId,
    fulfilledResetExecution.resetCurrentness.currentnessId
  );
  assert.equal(consumer.formFulfilledResetBoundary.resetGeneration, 1);
  assert.equal(
    consumer.formFulfilledResetBoundary.resetGenerationCurrent,
    true
  );
  assert.equal(
    consumer.formFulfilledResetBoundary
      .replayAfterResetGenerationAdvanceRejected,
    true
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.rootId,
    admission.rootId
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.rootContainerInfo,
    fulfilledResetExecution.rootExecutionBoundary.rootContainerInfo
  );
  assert.deepEqual(
    consumer.formFulfilledResetBoundary.sourceOwnedTokens,
    [
      formActions.privateFormActionFulfilledResetExecutionGateId,
      formActions.privateFormActionFulfilledResetExecutionRecordType,
      formActions.privateFormActionFulfilledResetExecutionRecordedStatus,
      'form-action-fulfilled-reset-execution.fake-commit',
      'form-action-fulfilled-reset-fake-commit',
      formActions.formActionFulfilledResetExecutionDiagnosticKind,
      formActions.formActionFulfilledResetExecutionQueueExecutionKind,
      'after-mutation-form-reset-order',
      formActions.privateFormActionResetCurrentnessRecordType,
      formActions.privateFormActionResetCurrentnessStatus,
      formActions
        .privateFormActionFulfilledResetRootLifecycleBoundaryRecordType,
      formActions
        .privateFormActionFulfilledResetRootLifecycleBoundaryStatus,
      rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED,
      rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED,
      'executed-private-form-action-fulfilled-reset-state-queue-fake',
      'executed-private-form-action-fulfilled-reset-commit-fake'
    ]
  );
  assert.deepEqual(
    consumer.formFulfilledResetBoundary.queueSourceFunctionNames,
    [
      'requestFormReset',
      'ensureFormComponentIsStateful',
      'dispatchSetStateInternal',
      'requestUpdateLane'
    ]
  );
  assert.equal(
    consumer.formFulfilledResetBoundary
      .deterministicFakeResetStateQueueConsumed,
    true
  );
  assert.equal(
    consumer.formFulfilledResetBoundary.deterministicFakeResetCommitConsumed,
    true
  );
  assert.equal(consumer.formFulfilledResetBoundary.reactUpdateQueued, false);
  assert.equal(consumer.formFulfilledResetBoundary.realFormReset, false);
  assert.equal(consumer.formFulfilledResetBoundary.domMutation, false);

  assert.deepEqual(
    consumer.sideEffects,
    resourceFormGate.rootExecutionConsumerSideEffects
  );
  assert.equal(consumer.sideEffects.rootExecutionConsumerInvoked, true);
  assert.equal(
    consumer.sideEffects.formFulfilledResetCurrentnessConsumed,
    true
  );
  assert.equal(consumer.sideEffects.publicRootTouched, false);
  assert.equal(consumer.sideEffects.domMutation, false);
  assert.equal(consumer.publicResourceBoundary.publicResourcesClaimed, false);
  assert.equal(consumer.publicFormBoundary.publicFormsClaimed, false);
  assert.equal(consumer.nativeExecution, false);
  assert.equal(consumer.reconcilerExecution, false);
  assert.equal(consumer.publicRootExecution, false);
  assert.equal(consumer.compatibilityClaimed, false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(document.__mutationLog.length, 0);

  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        admission,
        lifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'resource root-map storage execution was already consumed by a root boundary consumer'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        admission,
        lifecycleBoundary,
        createRootMapStorageExecutionForRoot(
          'root-execution-consumer-replay-form-resource',
          admission.rootId,
          {
            admission,
            lifecycleBoundary
          }
        ),
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'form fulfilled reset execution was already consumed by a root boundary consumer'
    }
  );
});

test('private resource/form root execution consumer rejects stale cross-root missing lifecycle and public aliases before consumption', async () => {
  const { admission, bridge, create, lifecycleBoundary } =
    createPrivateRootBridgeAdmission();
  const nextRender = bridge.renderContainer(create.handle, {
    props: {
      children: 'fresh boundary'
    },
    type: 'span'
  });
  const freshAdmission = bridge.admitRequest(nextRender);
  const freshLifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(freshAdmission);
  const foreignRootId = createPrivateRootBridgeAdmission({
    requestIdPrefix: 'foreign-root-execution-consumer-request',
    rootIdPrefix: 'foreign-root-execution-consumer-root',
    updateIdPrefix: 'foreign-root-execution-consumer-update'
  });
  const foreignRootIdResourceExecution =
    createRootMapStorageExecutionForRoot(
      'root-execution-consumer-foreign-root-id',
      foreignRootId.admission.rootId,
      {
        admission: foreignRootId.admission,
        lifecycleBoundary: foreignRootId.lifecycleBoundary
      }
    );
  const resourceExecution = createRootMapStorageExecutionForRoot(
    'root-execution-consumer-negative',
    freshAdmission.rootId,
    {
      admission: freshAdmission,
      lifecycleBoundary: freshLifecycleBoundary
    }
  );
  const { fulfilledResetExecution: rootlessFulfilledResetExecution } =
    await createPrivateFulfilledResetExecutionRecord(
      'root-execution-consumer-negative-form'
    );
  const { fulfilledResetExecution } =
    await createPrivateFulfilledResetExecutionRecord(
      'root-execution-consumer-negative-bound-form',
      {
        admission: freshAdmission,
        lifecycleBoundary: freshLifecycleBoundary
      }
    );
  const foreignRoot = createPrivateRootBridgeAdmission();
  const foreignNextRender = foreignRoot.bridge.renderContainer(
    foreignRoot.create.handle,
    {
      props: {
        children: 'foreign fresh boundary'
      },
      type: 'span'
    }
  );
  const foreignFreshAdmission =
    foreignRoot.bridge.admitRequest(foreignNextRender);
  const foreignFreshLifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(
      foreignFreshAdmission
    );
  const foreignResourceExecution = createRootMapStorageExecutionForRoot(
    'root-execution-consumer-foreign',
    foreignFreshAdmission.rootId,
    {
      admission: foreignFreshAdmission,
      lifecycleBoundary: foreignFreshLifecycleBoundary
    }
  );
  const {
    fulfilledResetExecution: crossContainerFulfilledResetExecution
  } = await createPrivateFulfilledResetExecutionRecord(
    'root-execution-consumer-cross-container-form',
    {
      admission: foreignFreshAdmission,
      lifecycleBoundary: foreignFreshLifecycleBoundary
    }
  );
  const unmountRoot = createPrivateRootBridgeAdmission();
  const unmount = unmountRoot.bridge.unmountContainer(
    unmountRoot.create.handle
  );
  const unmountAdmission = unmountRoot.bridge.admitRequest(unmount);
  const unmountLifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(unmountAdmission);
  const staleResourceRoot = createPrivateRootBridgeAdmission();
  const staleResourceExecution = createRootMapStorageExecutionForRoot(
    'root-execution-consumer-stale-resource',
    staleResourceRoot.admission.rootId,
    {
      admission: staleResourceRoot.admission,
      lifecycleBoundary: staleResourceRoot.lifecycleBoundary
    }
  );
  const {
    fulfilledResetExecution: staleBoundaryFulfilledResetExecution
  } = await createPrivateFulfilledResetExecutionRecord(
    'root-execution-consumer-stale-boundary-form',
    {
      admission: staleResourceRoot.admission,
      lifecycleBoundary: staleResourceRoot.lifecycleBoundary
    }
  );
  const staleResourceLaterRender =
    staleResourceRoot.bridge.renderContainer(
      staleResourceRoot.create.handle,
      {
        props: {
          children: 'fresh resource boundary'
        },
        type: 'span'
      }
    );
  const staleResourceLaterAdmission =
    staleResourceRoot.bridge.admitRequest(staleResourceLaterRender);
  const staleResourceLaterLifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(
      staleResourceLaterAdmission
    );
  const {
    fulfilledResetExecution: staleResourceLaterFulfilledResetExecution
  } = await createPrivateFulfilledResetExecutionRecord(
    'root-execution-consumer-stale-resource-form',
    {
      admission: staleResourceLaterAdmission,
      lifecycleBoundary: staleResourceLaterLifecycleBoundary
    }
  );
  const gate = resourceFormGate.createResourceFormRootExecutionConsumerGate({
    requestIdPrefix: 'root-execution-consumer-negative-gate'
  });
  const callerShapedRootBridgeAdmission = {
    ...freshAdmission,
    requestId: 'caller-shaped-admission:1'
  };
  const clonedLifecycleBoundary = Object.freeze({
    ...freshLifecycleBoundary
  });
  const callerBuiltLifecycleBoundary = {
    $$typeof: rootBridge.privateRootLifecycleRequestBoundaryRecordType,
    kind: 'FastReactDomPrivateRootLifecycleRequestBoundaryRecord',
    boundaryStatus:
      rootBridge.ROOT_BRIDGE_LIFECYCLE_REQUEST_BOUNDARY_ACCEPTED,
    rootId: freshAdmission.rootId,
    rootKind: freshAdmission.rootKind,
    rootTag: freshAdmission.rootTag,
    sourceAdmissionId: freshAdmission.requestId,
    sourceAdmissionStatus: freshAdmission.admissionStatus,
    sourceRequestId: freshAdmission.requestId,
    sourceRequestSequence: freshAdmission.requestSequence,
    sourceRequestType: freshAdmission.requestType,
    sourceOperation: freshAdmission.operation,
    sourceLifecycleStatusBefore:
      freshAdmission.lifecyclePrerequisites.lifecycleStatusBefore,
    sourceLifecycleStatusAfter:
      freshAdmission.lifecyclePrerequisites.lifecycleStatusAfter,
    lifecycleTransition:
      freshAdmission.lifecyclePrerequisites.lifecycleTransition,
    sourceOwned: true,
    activeRootLifecycle: true,
    requestBoundaryCurrent: true,
    publicRootExecution: false,
    nativeExecution: false,
    reconcilerExecution: false,
    domMutation: false,
    markerWrites: false,
    listenerInstallation: false,
    hydration: false,
    eventDispatch: false,
    compatibilityClaimed: false
  };
  const publicRootAlias = {
    render() {},
    unmount() {}
  };

  assert.equal(rootBridge.isPrivateRootBridgeAdmissionRecord(admission), true);
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      freshLifecycleBoundary
    ),
    true
  );
  assert.equal(
    rootBridge.isPrivateRootBridgeAdmissionRecord(
      callerShapedRootBridgeAdmission
    ),
    false
  );
  assert.equal(
    rootBridge.isPrivateRootLifecycleRequestBoundaryRecord(
      clonedLifecycleBoundary
    ),
    false
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      freshAdmission,
      lifecycleBoundary
    ),
    false
  );
  assert.equal(
    rootBridge.isActiveSourceOwnedPrivateRootLifecycleRequestBoundaryForAdmission(
      staleResourceRoot.admission,
      staleResourceRoot.lifecycleBoundary
    ),
    false
  );

  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        admission,
        lifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle request boundary must be source-owned active and match root bridge admission'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        callerShapedRootBridgeAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code: resourceFormGate.rootBoundaryInvalidRootMetadataCode,
      compatibilityTarget
    }
  );

  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        clonedLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle request boundary must be source-owned active and match root bridge admission'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        callerBuiltLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle request boundary must be source-owned active and match root bridge admission'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        publicRootAlias,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle request boundary must be source-owned active and match root bridge admission'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        unmountAdmission,
        unmountLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle request boundary must come from a render operation'
    }
  );

  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        foreignRootIdResourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'resource root-map storage execution rootId must match root bridge admission'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        foreignResourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'resource root-map storage execution root lifecycle identity must match root bridge admission and lifecycle boundary'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        staleResourceRoot.admission,
        staleResourceRoot.lifecycleBoundary,
        staleResourceExecution,
        staleBoundaryFulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'root lifecycle request boundary must be source-owned active and match root bridge admission'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        staleResourceLaterAdmission,
        staleResourceLaterLifecycleBoundary,
        staleResourceExecution,
        staleResourceLaterFulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'resource root-map storage execution root lifecycle identity must match root bridge admission and lifecycle boundary'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        {
          ...resourceExecution,
          rootMapStorageExecutionRows:
            resourceExecution.rootMapStorageExecutionRows.slice(1)
        },
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'resource root-map storage execution record must be source-owned'
    }
  );
  const clonedResourceExecution = {
    ...resourceExecution
  };
  assert.equal(
    resourceFormGate.getPrivateResourceHintRootMapStorageRootIdentityPayload(
      clonedResourceExecution
    ),
    null
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        clonedResourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'resource root-map storage execution record must be source-owned'
    }
  );
  for (const alias of [
    {
      title:
        'private resource root-map storage execution mutates deterministic fake maps only'
    },
    {
      errorMessage:
        'Invalid private React DOM resource root-map storage execution record'
    },
    {
      sourceSyntax:
        'recordRootMapStorageExecution(rootMapStoragePreflight, admission)'
    }
  ]) {
    assert.throws(
      () =>
        gate.recordRootExecutionConsumer(
          freshAdmission,
          freshLifecycleBoundary,
          alias,
          fulfilledResetExecution,
          {
            explicitResourceFormRootExecutionConsumer: true
          }
        ),
      {
        code:
          resourceFormGate
            .rootBoundaryInvalidRootExecutionConsumerRecordCode,
        compatibilityTarget,
        reason:
          'resource root-map storage execution record must be source-owned'
      }
    );
  }
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        {
          ...fulfilledResetExecution,
          fakeResetStateQueueExecution: undefined
        },
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'form fulfilled reset execution record must be source-owned'
    }
  );
  const clonedFulfilledResetExecution = {
    ...fulfilledResetExecution
  };
  assert.equal(
    formActions
      .getPrivateFormActionFulfilledResetExecutionRootIdentityPayload(
        clonedFulfilledResetExecution
      ),
    null
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        clonedFulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'form fulfilled reset execution record must be source-owned'
    }
  );
  for (const alias of [
    {
      title:
        'private fulfilled form action reset execution records deterministic fake queue and commit evidence'
    },
    {
      errorMessage:
        'Invalid private React DOM form action fulfilled reset execution record'
    },
    {
      sourceSyntax:
        'recordFulfilledResetExecution(asyncExecution, submitReset, admission)'
    }
  ]) {
    assert.throws(
      () =>
        gate.recordRootExecutionConsumer(
          freshAdmission,
          freshLifecycleBoundary,
          resourceExecution,
          alias,
          {
            explicitResourceFormRootExecutionConsumer: true
          }
        ),
      {
        code:
          resourceFormGate
            .rootBoundaryInvalidRootExecutionConsumerRecordCode,
        compatibilityTarget,
        reason:
          'form fulfilled reset execution record must be source-owned'
      }
    );
  }
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        rootlessFulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'form fulfilled reset execution root lifecycle identity must be source-owned'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        crossContainerFulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'form fulfilled reset execution root lifecycle identity must match root bridge admission and lifecycle boundary'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true,
          sourceRootLifecycleBoundaryId:
            freshLifecycleBoundary.boundaryId
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerAdmissionCode,
      compatibilityTarget,
      reason:
        'source-owned root execution tokens must come from private records'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true,
          publicPackageCompatibilityClaimed: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerAdmissionCode,
      compatibilityTarget,
      reason:
        'publicPackageCompatibilityClaimed must remain blocked in the root execution consumer gate'
    }
  );
  for (const field of [
    'publicRequestFormResetRequested',
    'publicActionInvocationRequested',
    'publicHeadMutation',
    'realResourceMapsMutated',
    'nativeExecution',
    'rustExecution',
    'nativeRustExecution',
    'publicRootExecution'
  ]) {
    assert.throws(
      () =>
        gate.recordRootExecutionConsumer(
          freshAdmission,
          freshLifecycleBoundary,
          resourceExecution,
          fulfilledResetExecution,
          {
            explicitResourceFormRootExecutionConsumer: true,
            [field]: true
          }
        ),
      {
        code:
          resourceFormGate
            .rootBoundaryInvalidRootExecutionConsumerAdmissionCode,
        compatibilityTarget,
        reason: `${field} must remain blocked in the root execution consumer gate`
      },
      field
    );
  }
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true,
          worker910Evidence: true
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerAdmissionCode,
      compatibilityTarget,
      reason:
        'source-owned root execution tokens must come from private records'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true,
          sourceResourceRootMapStorageExecutionId:
            resourceExecution.rootMapStorageExecutionId
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerAdmissionCode,
      compatibilityTarget,
      reason:
        'source-owned root execution tokens must come from private records'
    }
  );
  assert.throws(
    () =>
      gate.recordRootExecutionConsumer(
        freshAdmission,
        freshLifecycleBoundary,
        resourceExecution,
        fulfilledResetExecution,
        {
          explicitResourceFormRootExecutionConsumer: true,
          ledgerId: resourceFormGate.privateResourceFormExecutionAdmissionLedgerId
        }
      ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerAdmissionCode,
      compatibilityTarget,
      reason:
        'source-owned root execution tokens must come from private records'
    }
  );

  const staleFormRoot = createPrivateRootBridgeAdmission();
  const staleFormNextRender = staleFormRoot.bridge.renderContainer(
    staleFormRoot.create.handle,
    {
      props: {
        children: 'stale form boundary'
      },
      type: 'span'
    }
  );
  const staleFormAdmission =
    staleFormRoot.bridge.admitRequest(staleFormNextRender);
  const staleFormLifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(
      staleFormAdmission
    );
  const { fulfilledResetExecution: staleFormFulfilledResetExecution } =
    await createPrivateFulfilledResetExecutionRecord(
      'root-execution-consumer-stale-form',
      {
        admission: staleFormAdmission,
        lifecycleBoundary: staleFormLifecycleBoundary
      }
    );
  const staleFormLaterRender = staleFormRoot.bridge.renderContainer(
    staleFormRoot.create.handle,
    {
      props: {
        children: 'later form boundary'
      },
      type: 'span'
    }
  );
  const staleFormLaterAdmission =
    staleFormRoot.bridge.admitRequest(staleFormLaterRender);
  const staleFormLaterLifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(
      staleFormLaterAdmission
    );
  const staleFormLaterResourceExecution =
    createRootMapStorageExecutionForRoot(
      'root-execution-consumer-stale-form-resource',
      staleFormLaterAdmission.rootId,
      {
        admission: staleFormLaterAdmission,
        lifecycleBoundary: staleFormLaterLifecycleBoundary
      }
    );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceFormRootExecutionConsumerGate({
          requestIdPrefix: 'root-execution-consumer-stale-form-gate'
        })
        .recordRootExecutionConsumer(
          staleFormLaterAdmission,
          staleFormLaterLifecycleBoundary,
          staleFormLaterResourceExecution,
          staleFormFulfilledResetExecution,
          {
            explicitResourceFormRootExecutionConsumer: true
          }
        ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'form fulfilled reset execution root lifecycle identity must match root bridge admission and lifecycle boundary'
    }
  );

  const staleGenerationRoot = createPrivateRootBridgeAdmission();
  const staleGenerationResourceExecution =
    createRootMapStorageExecutionForRoot(
      'root-execution-consumer-stale-reset-generation-resource',
      staleGenerationRoot.admission.rootId,
      {
        admission: staleGenerationRoot.admission,
        lifecycleBoundary: staleGenerationRoot.lifecycleBoundary
      }
    );
  const staleGenerationScenario =
    await createPrivateFulfilledResetExecutionRecord(
      'root-execution-consumer-stale-reset-generation-form',
      {
        admission: staleGenerationRoot.admission,
        lifecycleBoundary: staleGenerationRoot.lifecycleBoundary
      }
    );
  formActions
    .createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix:
        'root-execution-consumer-stale-reset-generation-later'
    })
    .recordSubmitResetExecution(staleGenerationScenario.dispatch, {
      explicitFormActionSubmitResetExecution: true,
      fakeFormPath: {
        pathId: 'root-execution-consumer-stale-reset-generation-fake',
        pathKind: 'action-completion-submit-reset',
        hostTag: 'form',
        resetMode: 'record-only-fake-reset'
      }
    });
  assert.throws(
    () =>
      resourceFormGate
        .createResourceFormRootExecutionConsumerGate({
          requestIdPrefix:
            'root-execution-consumer-stale-reset-generation-gate'
        })
        .recordRootExecutionConsumer(
          staleGenerationRoot.admission,
          staleGenerationRoot.lifecycleBoundary,
          staleGenerationResourceExecution,
          staleGenerationScenario.fulfilledResetExecution,
          {
            explicitResourceFormRootExecutionConsumer: true
          }
        ),
    {
      code:
        resourceFormGate
          .rootBoundaryInvalidRootExecutionConsumerRecordCode,
      compatibilityTarget,
      reason:
        'form fulfilled reset execution replay is stale for the current reset generation'
    }
  );

  const consumer = gate.recordRootExecutionConsumer(
    freshAdmission,
    freshLifecycleBoundary,
    resourceExecution,
    fulfilledResetExecution,
    {
      explicitResourceFormRootExecutionConsumer: true
    }
  );
  assert.equal(consumer.rootId, freshAdmission.rootId);
  assert.equal(
    consumer.sourceRootLifecycleBoundaryId,
    freshLifecycleBoundary.boundaryId
  );
});

test('resource hint entrypoints keep accepted public shape but never dispatch resource work', () => {
  for (const entrypoint of [
    {
      entrypoint: 'react-dom',
      fileName: 'index.js'
    },
    {
      entrypoint: 'react-dom/profiling',
      fileName: 'profiling.js'
    }
  ]) {
    const moduleExports = requireFresh(entrypoint.fileName);
    assertPlaceholderMetadata(moduleExports, entrypoint.entrypoint);
    assert.equal(moduleExports.version, implementedVersion);

    assert.deepEqual(
      Object.keys(moduleExports[internalsExport].d),
      resourceShape.dispatcher.dispatcherOwnKeys
    );

    const dispatchCalls = replaceDispatcherWithSpies(moduleExports);

    for (const apiName of resourceOracle.resourceHintApis) {
      assertFunctionMatchesOracle(moduleExports, apiName, {
        descriptor: resourceShape.module.exports[apiName].descriptor,
        entrypoint: entrypoint.entrypoint
      });
      assertUnsupportedThrow(
        () =>
          moduleExports[apiName](
            'https://fast-react.invalid/resource',
            throwingProxy(`${apiName} options`)
          ),
        {
          entrypoint: entrypoint.entrypoint,
          exportName: apiName
        }
      );
    }

    assert.deepEqual(dispatchCalls, [], `${entrypoint.entrypoint} dispatch calls`);
  }
});

test('form action entrypoints keep accepted public shape but never inspect forms or reset dispatchers', () => {
  for (const entrypoint of [
    {
      entrypoint: 'react-dom',
      fileName: 'index.js'
    },
    {
      entrypoint: 'react-dom/profiling',
      fileName: 'profiling.js'
    }
  ]) {
    const moduleExports = requireFresh(entrypoint.fileName);
    assertPlaceholderMetadata(moduleExports, entrypoint.entrypoint);
    assert.equal(moduleExports.version, implementedVersion);

    const dispatchCalls = replaceDispatcherWithSpies(moduleExports);

    for (const apiName of formActionsOracle.apiNames) {
      assertFunctionMatchesOracle(moduleExports, apiName, {
        descriptor: formRootShape.selectedAPIs[apiName],
        entrypoint: entrypoint.entrypoint
      });
    }

    assertUnsupportedThrow(
      () => moduleExports.requestFormReset(throwingProxy('form element')),
      {
        entrypoint: entrypoint.entrypoint,
        exportName: 'requestFormReset'
      }
    );
    assertUnsupportedThrow(
      () =>
        moduleExports.useFormState(
          throwingProxy('form action'),
          throwingProxy('initial state'),
          throwingProxy('permalink')
        ),
      {
        entrypoint: entrypoint.entrypoint,
        exportName: 'useFormState'
      }
    );
    assertUnsupportedThrow(
      () => moduleExports.useFormStatus(throwingProxy('unexpected argument')),
      {
        entrypoint: entrypoint.entrypoint,
        exportName: 'useFormStatus'
      }
    );

    assert.deepEqual(dispatchCalls, [], `${entrypoint.entrypoint} dispatch calls`);
  }
});

test('react-server root stays fail-closed for resources and omits form action APIs', () => {
  const moduleExports = requireFresh('react-dom.react-server.js');
  assertPlaceholderMetadata(moduleExports, 'react-dom');
  assert.equal(moduleExports.version, placeholderVersion);

  for (const apiName of resourceOracle.resourceHintApis) {
    assert.equal(typeof moduleExports[apiName], 'function', apiName);
    assert.equal(moduleExports[apiName].length, 0, apiName);
    assert.equal(moduleExports[apiName].name, apiName, apiName);
    assertUnsupportedThrow(
      () => moduleExports[apiName](throwingProxy(`${apiName} href`)),
      {
        entrypoint: 'react-dom',
        exportName: apiName
      }
    );
  }

  for (const apiName of formActionsOracle.apiNames) {
    assert.equal(
      Object.hasOwn(moduleExports, apiName),
      false,
      `react-server must omit ${apiName}`
    );
  }
  assert.deepEqual(
    Object.keys(moduleExports),
    formServerRootShape.module.exportKeys
  );
});

test('controlled-control paths stay blocked at public roots and source adapter boundaries', () => {
  const client = requireFresh('client.js');
  assertPlaceholderMetadata(client, 'react-dom/client');
  assert.equal(client.version, placeholderVersion);

  assertUnsupportedThrow(
    () =>
      client.createRoot(
        throwingProxy('controlled root container'),
        throwingProxy('root options')
      ),
    {
      entrypoint: 'react-dom/client',
      exportName: 'createRoot'
    }
  );
  assertUnsupportedThrow(
    () =>
      client.hydrateRoot(
        throwingProxy('controlled root container'),
        {
          type: 'input',
          props: {
            value: 'blocked'
          }
        },
        throwingProxy('hydrate options')
      ),
    {
      entrypoint: 'react-dom/client',
      exportName: 'hydrateRoot'
    }
  );

  const matches = findDisallowedSourceMatches();
  assert.deepEqual(matches, [], formatSourceMatches(matches));
});
