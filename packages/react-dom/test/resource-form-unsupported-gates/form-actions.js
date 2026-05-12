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

test('private form action/reset dispatcher gate records intent metadata only', () => {
  const gate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'form-dispatcher-gate'
  });
  const records = [
    gate.recordSubmissionIntent({
      explicitIntent: true,
      eventName: 'submit',
      actionKind: 'function',
      actionSource: 'form',
      submitControlKind: 'button',
      defaultPrevented: false,
      transitionScheduled: false,
      replayed: false
    }),
    gate.recordResetIntent({
      explicitIntent: true,
      dispatcherKey: 'r',
      resetSource: 'requestFormReset',
      formOwnership: 'not-inspected',
      transitionContext: 'action'
    })
  ];
  const summary =
    resourceFormGate.describePrivateFormActionResetDispatcherGate();

  assert.deepEqual(
    records.map((record) => ({
      requestId: record.requestId,
      requestType: record.requestType,
      intentKind: record.intentKind,
      contractId: record.contractId,
      status: record.status,
      eventName: record.eventName,
      dispatcherName: record.dispatcherName,
      privateDispatcherKey: record.privateDispatcherKey,
      intent: record.intent
    })),
    [
      {
        requestId: 'form-dispatcher-gate:1',
        requestType: 'form-action-reset-dispatcher.submission',
        intentKind: 'submission',
        contractId: 'form-action-submission-intent',
        status:
          resourceFormGate.privateFormActionSubmissionIntentRecordedStatus,
        eventName: 'submit',
        dispatcherName: 'form-action-event-plugin',
        privateDispatcherKey: null,
        intent: {
          explicitIntent: true,
          intentKind: 'submission',
          eventName: 'submit',
          submissionTrigger: 'submit',
          actionKind: 'function',
          actionSource: 'form',
          submitControlKind: 'button',
          formActionKind: 'function',
          submitterActionKind: 'none',
          submitterActionOverridesFormAction: false,
          defaultPrevented: false,
          transitionScheduled: false,
          replayed: false,
          actionMetadata: {
            metadataOnly: true,
            submissionTrigger: 'submit',
            eventName: 'submit',
            requestSubmitWouldDispatchSubmitEvent: false,
            replayed: false,
            resolvedActionKind: 'function',
            formActionKind: 'function',
            submitterActionKind: 'none',
            actionSource: 'form',
            submitControlKind: 'button',
            submitterActionOverridesFormAction: false,
            submitterValueWouldBeIncludedInFormData: true,
            nativeNavigationWouldBePrevented: true,
            pendingStatusWouldBeSet: true,
            actionInvocationWouldBeScheduled: true,
            formPropsRead: false,
            submitterPropsRead: false,
            submitterAttributeRead: false,
            rawFormCaptured: false,
            rawEventCaptured: false,
            rawSubmitterCaptured: false,
            realFormInspected: false,
            submitControlInspected: false,
            formDataConstructed: false,
            syntheticEventCreated: false,
            defaultPreventedByGate: false,
            actionInvoked: false,
            hostTransitionStarted: false,
            compatibilityClaimed: false
          },
          formCaptured: false,
          rawEventCaptured: false,
          rawActionCaptured: false,
          realFormInspected: false,
          submitControlInspected: false,
          formDataConstructed: false,
          syntheticEventCreated: false,
          defaultPreventedByGate: false,
          nativeNavigationWouldBePrevented: true,
          pendingStatusWouldBeSet: true,
          actionInvocationWouldBeScheduled: true,
          actionInvoked: false,
          hostTransitionStarted: false,
          compatibilityClaimed: false
        }
      },
      {
        requestId: 'form-dispatcher-gate:2',
        requestType: 'form-action-reset-dispatcher.reset',
        intentKind: 'reset',
        contractId: 'form-action-reset-intent',
        status: resourceFormGate.privateFormActionResetIntentRecordedStatus,
        eventName: null,
        dispatcherName: 'request-form-reset-dispatcher',
        privateDispatcherKey: 'r',
        intent: {
          explicitIntent: true,
          intentKind: 'reset',
          dispatcherKey: 'r',
          orderingKind: 'current-dispatcher-react-owned-first',
          resetSource: 'requestFormReset',
          formOwnership: 'not-inspected',
          transitionContext: 'action',
          resetDispatcherOrdering: {
            metadataOnly: true,
            orderingKind: 'current-dispatcher-react-owned-first',
            dispatcherKey: 'r',
            resetSource: 'requestFormReset',
            formOwnership: 'not-inspected',
            transitionContext: 'action',
            steps: [
              'public-requestFormReset-current-dispatcher',
              'dom-dispatcher-form-ownership-check',
              'react-owned-requestFormResetOnFiber',
              'previous-dispatcher-fallback-after-ownership-miss',
              'action-completion-request-reset-before-action',
              'commit-after-mutation-resetFormInstance'
            ],
            publicRequestFormResetCallsCurrentDispatcherFirst: true,
            domDispatcherChecksReactFormOwnershipBeforeFallback: true,
            previousDispatcherFallbackWouldFollowOwnershipMiss: true,
            actionCompletionRequestsResetBeforeActionInvocation: false,
            resetStateWouldBeQueuedBeforeCommit: true,
            commitResetWouldRunAfterMutationEffects: true,
            formCaptured: false,
            rawDispatcherArgumentCaptured: false,
            realFormInspected: false,
            formFiberResolved: false,
            previousDispatcherCalled: false,
            resetStateQueued: false,
            actionInvoked: false,
            formResetCommitted: false,
            realFormReset: false,
            compatibilityClaimed: false
          },
          formCaptured: false,
          rawDispatcherArgumentCaptured: false,
          realFormInspected: false,
          formFiberResolved: false,
          previousDispatcherCalled: false,
          resetWouldBeRequested: true,
          resetStateWouldBeQueued: true,
          resetCommitWouldRun: false,
          realFormReset: false,
          compatibilityClaimed: false
        }
      }
    ]
  );

  assert.equal(summary.gateId, resourceFormGate.privateFormActionResetDispatcherGateId);
  assert.equal(summary.status, resourceFormGate.privateFormActionResetDispatcherStatus);
  assert.equal(summary.recordsSubmissionIntentMetadata, true);
  assert.equal(summary.recordsSubmitRequestSubmitActionMetadata, true);
  assert.equal(summary.recordsResetIntentMetadata, true);
  assert.equal(summary.recordsResetDispatcherOrdering, true);
  assert.equal(summary.resetQueueCommitMetadataGateAvailable, true);
  assert.deepEqual(summary.acceptedSubmissionTriggers, [
    'submit',
    'requestSubmit',
    'replay',
    'unknown'
  ]);
  assert.deepEqual(summary.acceptedResetOrderingKinds, [
    'current-dispatcher-react-owned-first',
    'action-completion-reset-before-action',
    'previous-dispatcher-fallback',
    'unknown'
  ]);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.acceptsRawEvents, false);
  assert.equal(summary.acceptsActionFunctions, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.startsHostTransition, false);
  assert.equal(summary.resetsForms, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.formActionResetDispatcherBlockedSideEffects
  );
  assert.deepEqual(
    summary.resetQueueCommit,
    resourceFormGate.describePrivateFormActionResetQueueCommitGate()
  );
  assert.deepEqual(
    summary.contracts.map((contract) => ({
      id: contract.id,
      intentKind: contract.intentKind,
      eventName: contract.eventName,
      dispatcherName: contract.dispatcherName,
      privateDispatcherKey: contract.privateDispatcherKey,
      acceptsRealForms: contract.acceptsRealForms,
      acceptsActionFunctions: contract.acceptsActionFunctions,
      recordsSubmitRequestSubmitActionMetadata:
        contract.recordsSubmitRequestSubmitActionMetadata,
      recordsResetDispatcherOrdering: contract.recordsResetDispatcherOrdering
    })),
    [
      {
        id: 'form-action-submission-intent',
        intentKind: 'submission',
        eventName: 'submit',
        dispatcherName: 'form-action-event-plugin',
        privateDispatcherKey: null,
        acceptsRealForms: false,
        acceptsActionFunctions: false,
        recordsSubmitRequestSubmitActionMetadata: true,
        recordsResetDispatcherOrdering: false
      },
      {
        id: 'form-action-reset-intent',
        intentKind: 'reset',
        eventName: null,
        dispatcherName: 'request-form-reset-dispatcher',
        privateDispatcherKey: 'r',
        acceptsRealForms: false,
        acceptsActionFunctions: false,
        recordsSubmitRequestSubmitActionMetadata: false,
        recordsResetDispatcherOrdering: true
      }
    ]
  );

  for (const record of records) {
    assert.equal(Object.isFrozen(record), true, record.requestType);
    assert.equal(
      resourceFormGate.isPrivateFormActionResetDispatcherRecord(record),
      true,
      record.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateFormActionResetDispatcherRecordPayload(
        record
      ),
      record,
      record.requestType
    );
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.dispatcherBoundary.recordsIntentMetadata, true);
    assert.equal(
      record.dispatcherBoundary.recordsSubmitRequestSubmitActionMetadata,
      record.intentKind === 'submission'
    );
    assert.equal(
      record.dispatcherBoundary.recordsResetDispatcherOrdering,
      record.intentKind === 'reset'
    );
    assert.equal(record.dispatcherBoundary.acceptsRealForms, false);
    assert.equal(record.dispatcherBoundary.acceptsRawEvents, false);
    assert.equal(record.dispatcherBoundary.acceptsActionFunctions, false);
    assert.equal(record.dispatcherBoundary.realFormInspected, false);
    assert.equal(record.dispatcherBoundary.submitControlInspected, false);
    assert.equal(record.dispatcherBoundary.formDataConstructed, false);
    assert.equal(record.dispatcherBoundary.syntheticEventCreated, false);
    assert.equal(record.dispatcherBoundary.defaultPrevented, false);
    assert.equal(record.dispatcherBoundary.actionInvoked, false);
    assert.equal(record.dispatcherBoundary.hostTransitionStarted, false);
    assert.equal(record.dispatcherBoundary.resetFiberResolved, false);
    assert.equal(record.dispatcherBoundary.resetStateQueued, false);
    assert.equal(record.dispatcherBoundary.formResetCommitted, false);
    assert.equal(record.dispatcherBoundary.realFormReset, false);
    assert.equal(record.dispatcherBoundary.compatibilityClaimed, false);
  }

  assert.deepEqual(
    records[0].sideEffects,
    resourceFormGate.formActionSubmissionIntentSideEffects
  );
  assert.equal(records[0].sideEffects.formDispatcherMetadataRecorded, true);
  assert.equal(records[0].sideEffects.submissionIntentRecorded, true);
  assert.equal(
    records[0].sideEffects.submitRequestSubmitActionMetadataRecorded,
    true
  );
  assert.equal(records[0].sideEffects.resetIntentRecorded, false);
  assert.equal(records[0].sideEffects.resetDispatcherOrderingRecorded, false);
  assert.equal(records[0].sideEffects.formActionEventPluginInvoked, false);
  assert.equal(records[0].sideEffects.realFormInspected, false);
  assert.equal(records[0].sideEffects.submitControlInspected, false);
  assert.equal(records[0].sideEffects.formDataConstructed, false);
  assert.equal(records[0].sideEffects.actionInvoked, false);
  assert.equal(records[0].sideEffects.hostTransitionStarted, false);

  assert.deepEqual(
    records[1].sideEffects,
    resourceFormGate.formActionResetIntentSideEffects
  );
  assert.equal(records[1].sideEffects.formDispatcherMetadataRecorded, true);
  assert.equal(records[1].sideEffects.submissionIntentRecorded, false);
  assert.equal(
    records[1].sideEffects.submitRequestSubmitActionMetadataRecorded,
    false
  );
  assert.equal(records[1].sideEffects.resetIntentRecorded, true);
  assert.equal(records[1].sideEffects.resetDispatcherOrderingRecorded, true);
  assert.equal(records[1].sideEffects.requestFormResetDispatcherInvoked, false);
  assert.equal(records[1].sideEffects.resetFiberResolved, false);
  assert.equal(records[1].sideEffects.resetStateQueued, false);
  assert.equal(records[1].sideEffects.formResetCommitted, false);
  assert.equal(records[1].sideEffects.realFormReset, false);

  const requestSubmitRecord = gate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    submissionTrigger: 'requestSubmit',
    actionKind: 'function',
    actionSource: 'submit-control',
    submitControlKind: 'input',
    formActionKind: 'string',
    submitterActionKind: 'function',
    defaultPrevented: false,
    transitionScheduled: false
  });
  assert.equal(requestSubmitRecord.intent.submissionTrigger, 'requestSubmit');
  assert.equal(
    requestSubmitRecord.intent.actionMetadata
      .requestSubmitWouldDispatchSubmitEvent,
    true
  );
  assert.equal(
    requestSubmitRecord.intent.actionMetadata
      .submitterActionOverridesFormAction,
    true
  );
  assert.equal(
    requestSubmitRecord.intent.actionMetadata
      .submitterValueWouldBeIncludedInFormData,
    false
  );
  assert.equal(requestSubmitRecord.intent.realFormInspected, false);
  assert.equal(requestSubmitRecord.intent.formDataConstructed, false);

  const actionCompletionReset = gate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'action-completion',
    formOwnership: 'react-owned',
    transitionContext: 'action'
  });
  assert.equal(
    actionCompletionReset.intent.orderingKind,
    'action-completion-reset-before-action'
  );
  assert.equal(
    actionCompletionReset.intent.resetDispatcherOrdering
      .actionCompletionRequestsResetBeforeActionInvocation,
    true
  );
  assert.equal(
    actionCompletionReset.intent.resetDispatcherOrdering.previousDispatcherCalled,
    false
  );
  assert.equal(actionCompletionReset.intent.resetStateWouldBeQueued, true);
  assert.equal(
    actionCompletionReset.intent.resetDispatcherOrdering.resetStateQueued,
    false
  );
  assert.equal(actionCompletionReset.intent.realFormReset, false);
});

test('private form action event-extraction gate consumes submit metadata only', () => {
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'form-event-source'
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: 'form-event-extraction'
  });
  const submitIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    actionKind: 'function',
    actionSource: 'form',
    submitControlKind: 'button',
    defaultPrevented: false,
    transitionScheduled: false
  });
  const requestSubmitIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    submissionTrigger: 'requestSubmit',
    actionKind: 'function',
    actionSource: 'submit-control',
    submitControlKind: 'input',
    formActionKind: 'string',
    submitterActionKind: 'function',
    defaultPrevented: false,
    transitionScheduled: false
  });
  const records = [
    extractionGate.recordEventExtractionFromSubmissionIntent(submitIntent),
    extractionGate.recordEventExtractionFromSubmissionIntent(
      requestSubmitIntent
    )
  ];
  const summary =
    resourceFormGate.describePrivateFormActionEventExtractionGate();

  assert.equal(
    summary.gateId,
    resourceFormGate.privateFormActionEventExtractionGateId
  );
  assert.equal(
    summary.status,
    resourceFormGate.privateFormActionEventExtractionStatus
  );
  assert.equal(
    summary.acceptedSourceRecordType,
    resourceFormGate.privateFormActionResetDispatcherRecordType
  );
  assert.equal(
    summary.acceptedSourceGateId,
    resourceFormGate.privateFormActionResetDispatcherGateId
  );
  assert.equal(
    summary.acceptedSourceStatus,
    resourceFormGate.privateFormActionSubmissionIntentRecordedStatus
  );
  assert.deepEqual(summary.acceptedSubmissionTriggers, [
    'submit',
    'requestSubmit'
  ]);
  assert.equal(summary.consumesSubmitRequestSubmitActionMetadata, true);
  assert.equal(summary.recordsEventExtractionMetadata, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.acceptsRawEvents, false);
  assert.equal(summary.createsSyntheticEvents, false);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.startsHostTransition, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.formActionEventExtractionBlockedSideEffects
  );

  assert.deepEqual(
    records.map((record) => ({
      extractionId: record.extractionId,
      extractionSequence: record.extractionSequence,
      sourceRequestId: record.sourceRequestId,
      sourceRequestSequence: record.sourceRequestSequence,
      requestType: record.requestType,
      status: record.status,
      eventName: record.eventName,
      submissionTrigger: record.submissionTrigger,
      actionKind: record.actionKind,
      actionSource: record.actionSource,
      submitControlKind: record.submitControlKind,
      formActionKind: record.formActionKind,
      submitterActionKind: record.submitterActionKind,
      submitterActionOverridesFormAction:
        record.submitterActionOverridesFormAction,
      eventExtraction: {
        metadataOnly: record.eventExtraction.metadataOnly,
        sourceMetadataOnly: record.eventExtraction.sourceMetadataOnly,
        consumedSubmitRequestSubmitActionMetadata:
          record.eventExtraction.consumedSubmitRequestSubmitActionMetadata,
        requestSubmitWouldDispatchSubmitEvent:
          record.eventExtraction.requestSubmitWouldDispatchSubmitEvent,
        nativeNavigationWouldBePrevented:
          record.eventExtraction.nativeNavigationWouldBePrevented,
        pendingStatusWouldBeSet:
          record.eventExtraction.pendingStatusWouldBeSet,
        actionInvocationWouldBeScheduled:
          record.eventExtraction.actionInvocationWouldBeScheduled,
        submitterValueWouldBeIncludedInFormData:
          record.eventExtraction.submitterValueWouldBeIncludedInFormData,
        formDataConstructed: record.eventExtraction.formDataConstructed,
        syntheticEventCreated: record.eventExtraction.syntheticEventCreated,
        listenerDispatchStarted:
          record.eventExtraction.listenerDispatchStarted,
        actionInvoked: record.eventExtraction.actionInvoked,
        hostTransitionStarted: record.eventExtraction.hostTransitionStarted,
        compatibilityClaimed: record.eventExtraction.compatibilityClaimed
      }
    })),
    [
      {
        extractionId: 'form-event-extraction:1',
        extractionSequence: 1,
        sourceRequestId: 'form-event-source:1',
        sourceRequestSequence: 1,
        requestType: 'form-action-event-extraction.submit',
        status: resourceFormGate.privateFormActionEventExtractionRecordedStatus,
        eventName: 'submit',
        submissionTrigger: 'submit',
        actionKind: 'function',
        actionSource: 'form',
        submitControlKind: 'button',
        formActionKind: 'function',
        submitterActionKind: 'none',
        submitterActionOverridesFormAction: false,
        eventExtraction: {
          metadataOnly: true,
          sourceMetadataOnly: true,
          consumedSubmitRequestSubmitActionMetadata: true,
          requestSubmitWouldDispatchSubmitEvent: false,
          nativeNavigationWouldBePrevented: true,
          pendingStatusWouldBeSet: true,
          actionInvocationWouldBeScheduled: true,
          submitterValueWouldBeIncludedInFormData: true,
          formDataConstructed: false,
          syntheticEventCreated: false,
          listenerDispatchStarted: false,
          actionInvoked: false,
          hostTransitionStarted: false,
          compatibilityClaimed: false
        }
      },
      {
        extractionId: 'form-event-extraction:2',
        extractionSequence: 2,
        sourceRequestId: 'form-event-source:2',
        sourceRequestSequence: 2,
        requestType: 'form-action-event-extraction.submit',
        status: resourceFormGate.privateFormActionEventExtractionRecordedStatus,
        eventName: 'submit',
        submissionTrigger: 'requestSubmit',
        actionKind: 'function',
        actionSource: 'submit-control',
        submitControlKind: 'input',
        formActionKind: 'string',
        submitterActionKind: 'function',
        submitterActionOverridesFormAction: true,
        eventExtraction: {
          metadataOnly: true,
          sourceMetadataOnly: true,
          consumedSubmitRequestSubmitActionMetadata: true,
          requestSubmitWouldDispatchSubmitEvent: true,
          nativeNavigationWouldBePrevented: true,
          pendingStatusWouldBeSet: true,
          actionInvocationWouldBeScheduled: true,
          submitterValueWouldBeIncludedInFormData: false,
          formDataConstructed: false,
          syntheticEventCreated: false,
          listenerDispatchStarted: false,
          actionInvoked: false,
          hostTransitionStarted: false,
          compatibilityClaimed: false
        }
      }
    ]
  );

  for (const record of records) {
    assert.equal(Object.isFrozen(record), true, record.extractionId);
    assert.equal(
      resourceFormGate.isPrivateFormActionEventExtractionRecord(record),
      true,
      record.extractionId
    );
    assert.equal(
      resourceFormGate.getPrivateFormActionEventExtractionRecordPayload(
        record
      ),
      record,
      record.extractionId
    );
    assert.deepEqual(
      record.sideEffects,
      resourceFormGate.formActionEventExtractionMetadataSideEffects
    );
    assert.equal(record.sideEffects.sourceSubmissionIntentConsumed, true);
    assert.equal(record.sideEffects.eventExtractionMetadataRecorded, true);
    assert.equal(record.sideEffects.formActionEventPluginInvoked, false);
    assert.equal(record.sideEffects.nativeEventInspected, false);
    assert.equal(record.sideEffects.realFormInspected, false);
    assert.equal(record.sideEffects.submitControlInspected, false);
    assert.equal(record.sideEffects.formDataConstructed, false);
    assert.equal(record.sideEffects.syntheticEventCreated, false);
    assert.equal(record.sideEffects.actionInvoked, false);
    assert.equal(record.sideEffects.hostTransitionStarted, false);
    assert.equal(record.eventExtractionBoundary.acceptsRealForms, false);
    assert.equal(record.eventExtractionBoundary.acceptsRawEvents, false);
    assert.equal(
      record.eventExtractionBoundary.consumesSubmitRequestSubmitActionMetadata,
      true
    );
    assert.equal(record.eventExtractionBoundary.syntheticEventCreated, false);
    assert.equal(record.eventExtractionBoundary.formDataConstructed, false);
    assert.equal(record.eventExtractionBoundary.actionInvoked, false);
    assert.equal(record.eventExtractionBoundary.hostTransitionStarted, false);
  }

  const error =
    resourceFormGate.createUnsupportedFormActionEventExtractionError(
      records[0]
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateFormActionEventExtractionGateErrorCode
  );
  assert.equal(error.extractionId, 'form-event-extraction:1');
  assert.equal(error.sourceRequestId, 'form-event-source:1');
  assert.equal(error.status, records[0].status);
  assert.deepEqual(error.sideEffects, records[0].sideEffects);
  assert.match(
    error.message,
    /private form action event-extraction gate records submit metadata only/u
  );

  const resetIntent = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'requestFormReset',
    formOwnership: 'not-inspected',
    transitionContext: 'action'
  });
  assert.throws(
    () => extractionGate.recordEventExtractionFromSubmissionIntent(resetIntent),
    {
      code: resourceFormGate.privateFormActionEventExtractionInvalidRecordCode,
      compatibilityTarget,
      reason: 'source record must be a recorded submit action intent'
    }
  );

  const replayIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    replayed: true,
    actionKind: 'function',
    actionSource: 'replay',
    submitControlKind: 'none'
  });
  assert.throws(
    () => extractionGate.recordEventExtractionFromSubmissionIntent(replayIntent),
    {
      code: resourceFormGate.privateFormActionEventExtractionInvalidRecordCode,
      compatibilityTarget,
      reason: 'source action metadata must be for submit or requestSubmit'
    }
  );
  assert.throws(
    () => resourceFormGate.createUnsupportedFormActionEventExtractionError({}),
    {
      code: resourceFormGate.privateFormActionEventExtractionInvalidRecordCode,
      compatibilityTarget
    }
  );
});


test('private form reset queue/commit gate records boundary metadata only', () => {
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'form-reset-source'
  });
  const reset = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'requestFormReset',
    formOwnership: 'react-owned',
    transitionContext: 'transition'
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: 'form-reset-queue-commit'
    });
  const record = queueCommitGate.recordResetQueueCommit(reset, {
    explicitAdmission: true,
    queueSource: 'requestFormResetOnFiber',
    queueKind: 'metadata-only-reset-state-queue',
    commitKind: 'after-mutation-form-reset-order',
    hostTag: 'form'
  });
  const summary =
    resourceFormGate.describePrivateFormActionResetQueueCommitGate();

  assert.equal(summary.gateId, resourceFormGate.privateFormActionResetQueueCommitGateId);
  assert.equal(summary.status, resourceFormGate.privateFormActionResetQueueCommitStatus);
  assert.equal(
    summary.acceptedSourceRecordType,
    resourceFormGate.privateFormActionResetDispatcherRecordType
  );
  assert.equal(summary.acceptedSourceIntentKind, 'reset');
  assert.equal(
    summary.acceptedSourceStatus,
    resourceFormGate.privateFormActionResetIntentRecordedStatus
  );
  assert.deepEqual(summary.acceptedQueueSources, [
    'requestFormResetOnFiber',
    'action-completion',
    'transition',
    'unknown'
  ]);
  assert.deepEqual(summary.commitOrderPhases, [
    'request-reset',
    'queue-reset-state-update',
    'render-detect-reset-state-change',
    'after-mutation-effects',
    'recursive-form-reset',
    'reset-form-instance'
  ]);
  assert.equal(summary.recordsResetQueueMetadata, true);
  assert.equal(summary.recordsResetCommitOrderMetadata, true);
  assert.equal(summary.recordsRenderFlagHandoffMetadata, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.acceptsFormFibers, false);
  assert.equal(summary.acceptsResetQueues, false);
  assert.equal(summary.acceptsHostInstances, false);
  assert.equal(summary.callsPreviousDispatchers, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.marksFiberFlags, false);
  assert.equal(summary.commitsFormResets, false);
  assert.equal(summary.callsResetFormInstance, false);
  assert.equal(summary.callsFormReset, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.formActionResetQueueCommitBlockedSideEffects
  );

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    resourceFormGate.isPrivateFormActionResetQueueCommitRecord(record),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateFormActionResetQueueCommitRecordPayload(record),
    record
  );
  assert.equal(
    record.status,
    resourceFormGate.privateFormActionResetQueueCommitRecordedStatus
  );
  assert.equal(record.requestId, 'form-reset-queue-commit:1');
  assert.equal(record.sourceResetRequestId, 'form-reset-source:1');
  assert.equal(record.sourceResetOrderingKind, 'current-dispatcher-react-owned-first');
  assert.equal(record.sourceResetSource, 'requestFormReset');
  assert.equal(record.sourceTransitionContext, 'transition');
  assert.equal(record.sourceResetIntent.resetStateWouldBeQueued, true);
  assert.equal(record.sourceResetIntent.resetStateQueued, false);
  assert.equal(record.sourceResetIntent.formResetCommitted, false);
  assert.equal(record.sourceResetIntent.realFormReset, false);

  assert.equal(record.admission.metadataOnly, true);
  assert.equal(record.admission.rawFormCaptured, false);
  assert.equal(record.admission.rawFiberCaptured, false);
  assert.equal(record.admission.rawQueueCaptured, false);
  assert.equal(record.admission.realFormInspected, false);
  assert.equal(record.admission.formFiberResolved, false);
  assert.equal(record.admission.previousDispatcherCalled, false);
  assert.equal(record.admission.compatibilityClaimed, false);

  assert.equal(record.queueBoundary.status, 'blocked-private-form-reset-state-queue');
  assert.equal(record.queueBoundary.resetStateWouldBeQueued, true);
  assert.equal(record.queueBoundary.statefulHostComponentWouldBeEnsured, true);
  assert.equal(record.queueBoundary.resetStateHookWouldBeUsed, true);
  assert.equal(record.queueBoundary.resetStateObjectWouldChange, true);
  assert.equal(record.queueBoundary.updateLaneWouldBeRequested, true);
  assert.equal(record.queueBoundary.renderWouldDetectResetStateChange, true);
  assert.equal(record.queueBoundary.formResetFlagWouldBeMarked, true);
  assert.equal(record.queueBoundary.realFormInspected, false);
  assert.equal(record.queueBoundary.formFiberResolved, false);
  assert.equal(record.queueBoundary.stateHookCreated, false);
  assert.equal(record.queueBoundary.resetStateQueueResolved, false);
  assert.equal(record.queueBoundary.updateLaneRequested, false);
  assert.equal(record.queueBoundary.resetUpdateEnqueued, false);
  assert.equal(record.queueBoundary.reactUpdateQueued, false);
  assert.equal(record.queueBoundary.renderFormResetFlagMarked, false);
  assert.equal(record.queueBoundary.previousDispatcherCalled, false);
  assert.equal(record.queueBoundary.compatibilityClaimed, false);

  assert.equal(record.commitBoundary.status, 'blocked-private-form-reset-after-mutation-commit');
  assert.equal(record.commitBoundary.resetFlagWouldBeDetectedDuringMutationEffects, true);
  assert.equal(record.commitBoundary.needsFormResetWouldBeSet, true);
  assert.equal(record.commitBoundary.resetTraversalWouldRunAfterMutationEffects, true);
  assert.equal(record.commitBoundary.defaultValueUpdatesWouldPrecedeReset, true);
  assert.equal(record.commitBoundary.resetFormInstanceWouldCallFormReset, true);
  assert.equal(record.commitBoundary.afterMutationEffectsVisited, false);
  assert.equal(record.commitBoundary.recursivelyResetFormsCalled, false);
  assert.equal(record.commitBoundary.resetFormInstanceCalled, false);
  assert.equal(record.commitBoundary.formResetCommitted, false);
  assert.equal(record.commitBoundary.realFormReset, false);
  assert.equal(record.commitBoundary.compatibilityClaimed, false);
  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(record.publicFormActionBoundary.publicRequestFormResetReachable, false);
  assert.equal(record.publicFormActionBoundary.reactUpdateQueued, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.equal(record.publicFormActionBoundary.compatibilityClaimed, false);

  assert.deepEqual(
    record.sideEffects,
    resourceFormGate.formActionResetQueueCommitDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.sourceResetIntentAccepted, true);
  assert.equal(record.sideEffects.resetQueueCommitMetadataRecorded, true);
  assert.equal(record.sideEffects.resetQueueBoundaryRecorded, true);
  assert.equal(record.sideEffects.resetCommitOrderRecorded, true);
  assert.equal(record.sideEffects.realFormInspected, false);
  assert.equal(record.sideEffects.formFiberResolved, false);
  assert.equal(record.sideEffects.resetStateQueueResolved, false);
  assert.equal(record.sideEffects.resetUpdateEnqueued, false);
  assert.equal(record.sideEffects.reactUpdateQueued, false);
  assert.equal(record.sideEffects.resetFormInstanceCalled, false);
  assert.equal(record.sideEffects.formResetCommitted, false);
  assert.equal(record.sideEffects.realFormReset, false);
  assert.equal(record.sideEffects.previousDispatcherCalled, false);
  assert.equal(record.sideEffects.compatibilityClaimed, false);

  const error =
    resourceFormGate.createUnsupportedFormActionResetQueueCommitError(record);
  assert.equal(
    error.code,
    resourceFormGate.privateFormActionResetQueueCommitGateErrorCode
  );
  assert.equal(error.requestId, 'form-reset-queue-commit:1');
  assert.equal(error.sourceResetRequestId, 'form-reset-source:1');
  assert.deepEqual(error.queueBoundary, record.queueBoundary);
  assert.match(
    error.message,
    /private form reset queue\/commit gate records boundary metadata only/u
  );

  const submission = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    actionKind: 'none',
    actionSource: 'none',
    submitControlKind: 'none'
  });
  assert.throws(
    () => queueCommitGate.recordResetQueueCommit(submission, {
      explicitAdmission: true
    }),
    {
      code:
        resourceFormGate.privateFormActionResetQueueCommitInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () => queueCommitGate.recordResetQueueCommit(reset, {
      explicitAdmission: true,
      form: throwingProxy('form')
    }),
    {
      code:
        resourceFormGate.privateFormActionResetQueueCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'form must not be passed to the queue/commit metadata gate'
    }
  );
  assert.throws(
    () => queueCommitGate.recordResetQueueCommit(reset, {
      explicitAdmission: true,
      queueKind: 'real-reset-state-queue'
    }),
    {
      code:
        resourceFormGate.privateFormActionResetQueueCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'queueKind must be metadata-only-reset-state-queue'
    }
  );
});

test('private form action FormData blocker records target, submitter, and accepted metadata ids only', () => {
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'formdata-source'
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: 'formdata-extraction'
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: 'formdata-reset'
    });
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: 'formdata-blocker'
    });
  const submitIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    submissionTrigger: 'requestSubmit',
    actionKind: 'function',
    actionSource: 'form',
    submitControlKind: 'button',
    formActionKind: 'function',
    submitterActionKind: 'none',
    defaultPrevented: false,
    transitionScheduled: false
  });
  const extraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(submitIntent);
  const resetIntent = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'action-completion',
    formOwnership: 'react-owned',
    transitionContext: 'action'
  });
  const resetQueueCommit = queueCommitGate.recordResetQueueCommit(
    resetIntent,
    {
      explicitAdmission: true,
      queueSource: 'action-completion',
      queueKind: 'metadata-only-reset-state-queue',
      commitKind: 'after-mutation-form-reset-order',
      hostTag: 'form'
    }
  );
  const record = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: {
        targetKind: 'form',
        hostTag: 'form',
        methodKind: 'post',
        encodingKind: 'multipart'
      },
      submitterShape: {
        controlKind: 'button',
        hostTag: 'button',
        nameKind: 'string',
        valueKind: 'string'
      }
    }
  );
  const summary =
    formActions.describePrivateFormActionFormDataBlockerGate();

  assert.equal(
    summary.gateId,
    formActions.privateFormActionFormDataBlockerGateId
  );
  assert.equal(
    summary.status,
    formActions.privateFormActionFormDataBlockerStatus
  );
  assert.equal(
    summary.acceptedEventExtractionRecordType,
    resourceFormGate.privateFormActionEventExtractionRecordType
  );
  assert.equal(
    summary.acceptedResetQueueCommitRecordType,
    resourceFormGate.privateFormActionResetQueueCommitRecordType
  );
  assert.equal(summary.recordsAcceptedMetadataIds, true);
  assert.equal(summary.recordsFormTargetShape, true);
  assert.equal(summary.recordsSubmitterShape, true);
  assert.equal(summary.blocksFormDataConstruction, true);
  assert.equal(summary.blocksActionInvocation, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.acceptsRawEvents, false);
  assert.equal(summary.acceptsActionFunctions, false);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.startsHostTransition, false);
  assert.equal(summary.callsPreviousDispatchers, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.commitsFormResets, false);
  assert.equal(summary.resetsForms, false);
  assert.deepEqual(
    summary.sideEffects,
    formActions.formActionFormDataBlockerBlockedSideEffects
  );

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    formActions.isPrivateFormActionFormDataBlockerRecord(record),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionFormDataBlockerRecordPayload(record),
    record
  );
  assert.equal(
    record.status,
    formActions.privateFormActionFormDataBlockerRecordedStatus
  );
  assert.equal(record.blockerId, 'formdata-blocker:1');
  assert.equal(record.sourceEventExtractionId, extraction.extractionId);
  assert.equal(
    record.sourceResetQueueCommitRequestId,
    resetQueueCommit.requestId
  );
  assert.deepEqual(record.acceptedMetadataIds, {
    eventExtractionId: extraction.extractionId,
    eventExtractionSequence: extraction.extractionSequence,
    submissionIntentRequestId: extraction.sourceRequestId,
    submissionIntentRequestSequence: extraction.sourceRequestSequence,
    resetQueueCommitRequestId: resetQueueCommit.requestId,
    resetQueueCommitRequestSequence: resetQueueCommit.requestSequence,
    resetIntentRequestId: resetQueueCommit.sourceResetRequestId,
    resetIntentRequestSequence: resetQueueCommit.sourceResetRequestSequence,
    eventExtractionGateId: extraction.gateId,
    resetQueueCommitGateId: resetQueueCommit.gateId
  });

  assert.equal(record.formTargetShape.targetKind, 'form');
  assert.equal(record.formTargetShape.hostTag, 'form');
  assert.equal(record.formTargetShape.methodKind, 'post');
  assert.equal(record.formTargetShape.encodingKind, 'multipart');
  assert.equal(record.formTargetShape.formPropsWouldBeRead, true);
  assert.equal(record.formTargetShape.realFormInspected, false);
  assert.equal(record.formTargetShape.formDataConstructed, false);
  assert.equal(record.submitterShape.controlKind, 'button');
  assert.equal(record.submitterShape.hostTag, 'button');
  assert.equal(record.submitterShape.valueWouldBeIncludedInFormData, true);
  assert.equal(record.submitterShape.temporaryControlWouldBeInserted, true);
  assert.equal(record.submitterShape.submitControlInspected, false);
  assert.equal(record.submitterShape.propsRead, false);
  assert.equal(record.submitterShape.attributeRead, false);

  assert.equal(
    record.formDataConstructionBlocker.status,
    'blocked-private-form-action-formdata-construction'
  );
  assert.equal(
    record.formDataConstructionBlocker.wouldConstructForPendingStatus,
    true
  );
  assert.equal(
    record.formDataConstructionBlocker.wouldConstructForActionInvocation,
    true
  );
  assert.equal(
    record.formDataConstructionBlocker.wouldUseSubmitControlValue,
    true
  );
  assert.equal(
    record.formDataConstructionBlocker.wouldInsertTemporarySubmitControl,
    true
  );
  assert.equal(record.formDataConstructionBlocker.constructorCallBlocked, true);
  assert.equal(record.formDataConstructionBlocker.realFormInspected, false);
  assert.equal(record.formDataConstructionBlocker.formDataConstructed, false);
  assert.equal(
    record.formDataConstructionBlocker.temporarySubmitControlInserted,
    false
  );
  assert.equal(record.actionInvocationBlocker.status, 'blocked-private-form-action-invocation');
  assert.equal(record.actionInvocationBlocker.actionInvocationWouldBeScheduled, true);
  assert.equal(record.actionInvocationBlocker.defaultPreventedByGate, false);
  assert.equal(record.actionInvocationBlocker.actionFunctionCaptured, false);
  assert.equal(record.actionInvocationBlocker.actionInvoked, false);
  assert.equal(record.actionInvocationBlocker.hostTransitionStarted, false);
  assert.equal(record.resetExecutionBlocker.previousDispatcherCalled, false);
  assert.equal(record.resetExecutionBlocker.resetStateQueued, false);
  assert.equal(record.resetExecutionBlocker.reactUpdateQueued, false);
  assert.equal(record.resetExecutionBlocker.resetFormInstanceCalled, false);
  assert.equal(record.resetExecutionBlocker.formResetCommitted, false);
  assert.equal(record.resetExecutionBlocker.realFormReset, false);
  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(record.publicFormActionBoundary.formDataConstructed, false);
  assert.equal(record.publicFormActionBoundary.actionInvoked, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.deepEqual(
    record.sideEffects,
    formActions.formActionFormDataBlockerDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.sourceEventExtractionAccepted, true);
  assert.equal(record.sideEffects.sourceResetQueueCommitAccepted, true);
  assert.equal(record.sideEffects.acceptedMetadataIdsRecorded, true);
  assert.equal(record.sideEffects.targetShapeRecorded, true);
  assert.equal(record.sideEffects.submitterShapeRecorded, true);
  assert.equal(record.sideEffects.formDataConstructionBlocked, true);
  assert.equal(record.sideEffects.formDataConstructed, false);
  assert.equal(record.sideEffects.actionFunctionCaptured, false);
  assert.equal(record.sideEffects.actionInvoked, false);
  assert.equal(record.sideEffects.hostTransitionStarted, false);
  assert.equal(record.sideEffects.previousDispatcherCalled, false);
  assert.equal(record.sideEffects.resetStateQueued, false);
  assert.equal(record.sideEffects.formResetCommitted, false);
  assert.equal(record.sideEffects.realFormReset, false);

  const error =
    formActions.createUnsupportedFormActionFormDataBlockerError(record);
  assert.equal(
    error.code,
    formActions.privateFormActionFormDataBlockerGateErrorCode
  );
  assert.equal(error.blockerId, 'formdata-blocker:1');
  assert.deepEqual(error.acceptedMetadataIds, record.acceptedMetadataIds);
  assert.deepEqual(
    error.formDataConstructionBlocker,
    record.formDataConstructionBlocker
  );
  assert.match(
    error.message,
    /private form action data blocker records shape and blocker metadata only/u
  );

  let actionCalls = 0;
  const action = () => {
    actionCalls++;
  };
  assert.throws(
    () =>
      blockerGate.recordFormDataBlockerDiagnostic(
        extraction,
        resetQueueCommit,
        {
          explicitFormActionFormDataBlocker: true,
          action
        }
      ),
    {
      code:
        formActions.privateFormActionFormDataBlockerInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'action must not be passed to the form action data blocker gate'
    }
  );
  assert.equal(actionCalls, 0);

  assert.throws(
    () =>
      blockerGate.recordFormDataBlockerDiagnostic(
        extraction,
        resetQueueCommit,
        {
          explicitFormActionFormDataBlocker: true,
          submitter: throwingProxy('submitter')
        }
      ),
    {
      code:
        formActions.privateFormActionFormDataBlockerInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'submitter must not be passed to the form action data blocker gate'
    }
  );

  assert.throws(
    () =>
      blockerGate.recordFormDataBlockerDiagnostic(
        resetIntent,
        resetQueueCommit,
        {
          explicitFormActionFormDataBlocker: true
        }
      ),
    {
      code:
        formActions.privateFormActionFormDataBlockerInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source event extraction must be accepted metadata-only submit extraction'
    }
  );
  assert.throws(
    () =>
      blockerGate.recordFormDataBlockerDiagnostic(
        extraction,
        resetIntent,
        {
          explicitFormActionFormDataBlocker: true
        }
      ),
    {
      code:
        formActions.privateFormActionFormDataBlockerInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source reset queue/commit must be accepted metadata-only reset boundary'
    }
  );
  assert.throws(
    () => formActions.createUnsupportedFormActionFormDataBlockerError({}),
    {
      code:
        formActions.privateFormActionFormDataBlockerInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private form action submit dispatch gate links blocker, action identity, and reset intent metadata only', () => {
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'submit-dispatch-source'
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: 'submit-dispatch-extraction'
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: 'submit-dispatch-reset'
    });
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: 'submit-dispatch-blocker'
    });
  const dispatchGate =
    formActions.createFormActionSubmitDispatchDiagnosticGate({
      requestIdPrefix: 'submit-dispatch'
    });
  const submitIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    submissionTrigger: 'requestSubmit',
    actionKind: 'function',
    actionSource: 'form',
    submitControlKind: 'button',
    formActionKind: 'function',
    submitterActionKind: 'none',
    defaultPrevented: false,
    transitionScheduled: false
  });
  const extraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(submitIntent);
  const resetIntent = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'action-completion',
    formOwnership: 'react-owned',
    transitionContext: 'action'
  });
  const resetQueueCommit = queueCommitGate.recordResetQueueCommit(
    resetIntent,
    {
      explicitAdmission: true,
      queueSource: 'action-completion',
      queueKind: 'metadata-only-reset-state-queue',
      commitKind: 'after-mutation-form-reset-order',
      hostTag: 'form'
    }
  );
  const blocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: {
        targetKind: 'form',
        hostTag: 'form'
      },
      submitterShape: {
        controlKind: 'button',
        hostTag: 'button'
      }
    }
  );
  const record = dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
    explicitFormActionSubmitDispatch: true,
    submitControlKind: 'button'
  });
  const summary =
    formActions.describePrivateFormActionSubmitDispatchGate();

  assert.equal(
    summary.gateId,
    formActions.privateFormActionSubmitDispatchGateId
  );
  assert.equal(
    summary.status,
    formActions.privateFormActionSubmitDispatchStatus
  );
  assert.equal(
    summary.acceptedFormDataBlockerRecordType,
    formActions.privateFormActionFormDataBlockerRecordType
  );
  assert.equal(
    summary.acceptedEventExtractionRecordType,
    resourceFormGate.privateFormActionEventExtractionRecordType
  );
  assert.equal(
    summary.acceptedResetQueueCommitRecordType,
    resourceFormGate.privateFormActionResetQueueCommitRecordType
  );
  assert.equal(summary.recordsActionIdentity, true);
  assert.equal(summary.recordsFormDataBlockerRows, true);
  assert.equal(summary.recordsResetQueueIntent, true);
  assert.equal(summary.recordsDispatchQueueRow, true);
  assert.equal(summary.rejectsLiveForms, true);
  assert.equal(summary.rejectsUnsupportedSubmitControls, true);
  assert.equal(summary.blocksCallbackDispatchExecution, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.acceptsRawEvents, false);
  assert.equal(summary.acceptsActionFunctions, false);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.createsSyntheticEvents, false);
  assert.equal(summary.dispatchesSubmitCallbacks, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.startsHostTransition, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.resetsForms, false);
  assert.deepEqual(
    summary.sideEffects,
    formActions.formActionSubmitDispatchBlockedSideEffects
  );
  assert.deepEqual(
    resourceFormGate.describePrivateFormActionSubmitDispatchBoundary(null),
    summary
  );

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    formActions.isPrivateFormActionSubmitDispatchRecord(record),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionSubmitDispatchRecordPayload(record),
    record
  );
  assert.equal(
    record.status,
    formActions.privateFormActionSubmitDispatchRecordedStatus
  );
  assert.equal(record.dispatchId, 'submit-dispatch:1');
  assert.equal(record.sourceFormDataBlockerId, blocker.blockerId);
  assert.equal(record.sourceEventExtractionId, extraction.extractionId);
  assert.equal(
    record.sourceResetQueueCommitRequestId,
    resetQueueCommit.requestId
  );
  assert.equal(record.sourceResetIntentRequestId, resetIntent.requestId);
  assert.deepEqual(record.acceptedMetadataIds, blocker.acceptedMetadataIds);

  assert.equal(record.actionIdentity.metadataOnly, true);
  assert.equal(record.actionIdentity.sourceFormDataBlockerId, blocker.blockerId);
  assert.equal(record.actionIdentity.submissionTrigger, 'requestSubmit');
  assert.equal(record.actionIdentity.resolvedActionKind, 'function');
  assert.equal(record.actionIdentity.actionSource, 'form');
  assert.equal(record.actionIdentity.formActionKind, 'function');
  assert.equal(record.actionIdentity.submitControlActionKind, 'none');
  assert.equal(record.actionIdentity.submitControlOverridesFormAction, false);
  assert.equal(record.actionIdentity.nativeNavigationWouldBePrevented, true);
  assert.equal(record.actionIdentity.pendingStatusWouldBeSet, true);
  assert.equal(record.actionIdentity.actionInvocationWouldBeScheduled, true);
  assert.equal(record.actionIdentity.actionFunctionCaptured, false);
  assert.equal(record.actionIdentity.actionInvoked, false);
  assert.equal(record.actionIdentity.hostTransitionStarted, false);

  assert.equal(record.formDataBlockerLink.blockerId, blocker.blockerId);
  assert.equal(record.formDataBlockerLink.formDataConstructionBlocked, true);
  assert.equal(record.formDataBlockerLink.formDataConstructed, false);
  assert.equal(record.formDataBlockerLink.realFormInspected, false);
  assert.equal(record.formDataBlockerLink.submitControlInspected, false);

  assert.equal(
    record.resetQueueIntentLink.sourceResetQueueCommitRequestId,
    resetQueueCommit.requestId
  );
  assert.equal(
    record.resetQueueIntentLink.sourceResetIntentRequestId,
    resetIntent.requestId
  );
  assert.equal(
    record.resetQueueIntentLink.sourceResetOrderingKind,
    'action-completion-reset-before-action'
  );
  assert.equal(record.resetQueueIntentLink.actionCompletionResetBeforeAction, true);
  assert.equal(record.resetQueueIntentLink.resetStateWouldBeQueued, true);
  assert.equal(record.resetQueueIntentLink.previousDispatcherCalled, false);
  assert.equal(record.resetQueueIntentLink.resetStateQueued, false);
  assert.equal(record.resetQueueIntentLink.reactUpdateQueued, false);
  assert.equal(record.resetQueueIntentLink.resetFormInstanceCalled, false);
  assert.equal(record.resetQueueIntentLink.realFormReset, false);

  assert.equal(
    record.submitDispatchQueue.status,
    'blocked-private-form-action-submit-dispatch'
  );
  assert.equal(record.submitDispatchQueue.dispatchQueueEntryWouldBeCreated, true);
  assert.equal(record.submitDispatchQueue.callbackDispatchBlocked, true);
  assert.equal(record.submitDispatchQueue.syntheticEventCreated, false);
  assert.equal(record.submitDispatchQueue.listenerDispatchStarted, false);
  assert.equal(record.submitDispatchQueue.callbackDispatchExecuted, false);
  assert.equal(record.submitDispatchQueue.submitCallbackInvoked, false);
  assert.equal(record.submitDispatchQueue.formDataConstructed, false);
  assert.equal(record.submitDispatchQueue.actionFunctionCaptured, false);
  assert.equal(record.submitDispatchQueue.actionInvoked, false);
  assert.equal(record.submitDispatchQueue.hostTransitionStarted, false);
  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(record.publicFormActionBoundary.submitDispatchReachable, false);
  assert.equal(record.publicFormActionBoundary.actionInvoked, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);

  assert.deepEqual(
    record.sideEffects,
    formActions.formActionSubmitDispatchDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.sourceFormDataBlockerAccepted, true);
  assert.equal(record.sideEffects.sourceEventExtractionAccepted, true);
  assert.equal(record.sideEffects.sourceResetQueueIntentAccepted, true);
  assert.equal(record.sideEffects.actionIdentityRecorded, true);
  assert.equal(record.sideEffects.dispatchQueueRowRecorded, true);
  assert.equal(record.sideEffects.resetQueueIntentLinked, true);
  assert.equal(record.sideEffects.liveFormAccepted, false);
  assert.equal(record.sideEffects.unsupportedSubmitControlAccepted, false);
  assert.equal(record.sideEffects.formDataConstructed, false);
  assert.equal(record.sideEffects.callbackDispatchExecuted, false);
  assert.equal(record.sideEffects.submitCallbackInvoked, false);
  assert.equal(record.sideEffects.actionInvoked, false);
  assert.equal(record.sideEffects.hostTransitionStarted, false);
  assert.equal(record.sideEffects.resetStateQueued, false);
  assert.equal(record.sideEffects.realFormReset, false);

  const error =
    formActions.createUnsupportedFormActionSubmitDispatchError(record);
  assert.equal(
    error.code,
    formActions.privateFormActionSubmitDispatchGateErrorCode
  );
  assert.equal(error.dispatchId, 'submit-dispatch:1');
  assert.deepEqual(error.actionIdentity, record.actionIdentity);
  assert.deepEqual(error.formDataBlockerLink, record.formDataBlockerLink);
  assert.deepEqual(error.resetQueueIntentLink, record.resetQueueIntentLink);
  assert.match(
    error.message,
    /private form action submit dispatch gate records identity and blocker metadata only/u
  );

  let callbackCalls = 0;
  const callback = () => {
    callbackCalls++;
  };
  assert.throws(
    () =>
      dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
        explicitFormActionSubmitDispatch: true,
        callback
      }),
    {
      code:
        formActions.privateFormActionSubmitDispatchInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'callback must not be passed to the submit dispatch metadata gate'
    }
  );
  assert.equal(callbackCalls, 0);

  assert.throws(
    () =>
      dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
        explicitFormActionSubmitDispatch: true,
        form: throwingProxy('form')
      }),
    {
      code:
        formActions.privateFormActionSubmitDispatchInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'form must not be passed to the submit dispatch metadata gate'
    }
  );
  assert.throws(
    () =>
      dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
        explicitFormActionSubmitDispatch: true,
        callbackDispatchExecutionRequested: true
      }),
    {
      code:
        formActions.privateFormActionSubmitDispatchInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'callback dispatch execution must remain blocked'
    }
  );
  assert.throws(
    () =>
      dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
        explicitFormActionSubmitDispatch: true,
        submitControlKind: 'input'
      }),
    {
      code:
        formActions.privateFormActionSubmitDispatchInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'submitControlKind must match the source blocker metadata'
    }
  );

  const unknownSubmitIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    actionKind: 'function',
    actionSource: 'form',
    submitControlKind: 'unknown',
    formActionKind: 'function',
    submitterActionKind: 'none',
    defaultPrevented: false,
    transitionScheduled: false
  });
  const unknownExtraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(unknownSubmitIntent);
  const unknownBlocker = blockerGate.recordFormDataBlockerDiagnostic(
    unknownExtraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      submitterShape: {
        controlKind: 'unknown',
        hostTag: 'unknown'
      }
    }
  );
  assert.throws(
    () =>
      dispatchGate.recordSubmitDispatchDiagnostic(unknownBlocker, {
        explicitFormActionSubmitDispatch: true
      }),
    {
      code:
        formActions.privateFormActionSubmitDispatchInvalidRecordCode,
      compatibilityTarget,
      reason: 'source submit control kind must be button, input, or none'
    }
  );
  assert.throws(
    () => formActions.createUnsupportedFormActionSubmitDispatchError({}),
    {
      code:
        formActions.privateFormActionSubmitDispatchInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private form action submit reset execution consumes one fake form path only', () => {
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'submit-reset-source'
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: 'submit-reset-extraction'
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: 'submit-reset-queue'
    });
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: 'submit-reset-blocker'
    });
  const dispatchGate =
    formActions.createFormActionSubmitDispatchDiagnosticGate({
      requestIdPrefix: 'submit-reset-dispatch'
    });
  const executionGate =
    formActions.createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix: 'submit-reset-execution'
    });
  const submitIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    submissionTrigger: 'requestSubmit',
    actionKind: 'function',
    actionSource: 'form',
    submitControlKind: 'button',
    formActionKind: 'function',
    submitterActionKind: 'none',
    defaultPrevented: false,
    transitionScheduled: false
  });
  const extraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(submitIntent);
  const resetIntent = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'action-completion',
    formOwnership: 'react-owned',
    transitionContext: 'action'
  });
  const resetQueueCommit = queueCommitGate.recordResetQueueCommit(
    resetIntent,
    {
      explicitAdmission: true,
      queueSource: 'action-completion',
      queueKind: 'metadata-only-reset-state-queue',
      commitKind: 'after-mutation-form-reset-order',
      hostTag: 'form'
    }
  );
  const blocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: {
        targetKind: 'form',
        hostTag: 'form',
        methodKind: 'post'
      },
      submitterShape: {
        controlKind: 'button',
        hostTag: 'button',
        nameKind: 'string',
        valueKind: 'string'
      }
    }
  );
  const dispatch = dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
    explicitFormActionSubmitDispatch: true,
    submitControlKind: 'button'
  });
  const record = executionGate.recordSubmitResetExecution(dispatch, {
    explicitFormActionSubmitResetExecution: true,
    fakeFormPath: {
      pathId: 'fake-form-action-completion-reset-path',
      pathKind: 'action-completion-submit-reset',
      hostTag: 'form',
      resetMode: 'record-only-fake-reset'
    }
  });
  const summary =
    formActions.describePrivateFormActionSubmitResetExecutionGate();

  assert.equal(
    summary.gateId,
    formActions.privateFormActionSubmitResetExecutionGateId
  );
  assert.equal(
    summary.status,
    formActions.privateFormActionSubmitResetExecutionStatus
  );
  assert.equal(
    summary.acceptedSubmitDispatchRecordType,
    formActions.privateFormActionSubmitDispatchRecordType
  );
  assert.equal(
    summary.acceptedSubmitDispatchStatus,
    formActions.privateFormActionSubmitDispatchRecordedStatus
  );
  assert.equal(
    summary.acceptedFormDataBlockerRecordType,
    formActions.privateFormActionFormDataBlockerRecordType
  );
  assert.equal(
    summary.acceptedResetOrderingKind,
    'action-completion-reset-before-action'
  );
  assert.equal(summary.recordsAcceptedMetadataIds, true);
  assert.equal(summary.consumesBlockedFormDataMetadata, true);
  assert.equal(summary.consumesResetIntentMetadata, true);
  assert.equal(summary.executesDeterministicFakeFormResetPath, true);
  assert.equal(summary.admitsExactlyOneFakeFormPath, true);
  assert.equal(summary.rejectsStaleSubmitDispatchMetadata, true);
  assert.equal(summary.rejectsLiveForms, true);
  assert.equal(summary.rejectsCallbackExecution, true);
  assert.equal(summary.rejectsPublicSubmitDispatch, true);
  assert.equal(summary.rejectsPublicFormSubmission, true);
  assert.equal(summary.rejectsPublicResetRequest, true);
  assert.equal(summary.rejectsActionInvocation, true);
  assert.equal(summary.rejectsPublicDomMutation, true);
  assert.equal(summary.rejectsPackageCompatibilityClaims, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.createsSyntheticEvents, false);
  assert.equal(summary.dispatchesSubmitCallbacks, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.startsHostTransition, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.callsResetFormInstance, false);
  assert.equal(summary.resetsForms, false);
  assert.deepEqual(
    summary.sideEffects,
    formActions.formActionSubmitResetExecutionBlockedSideEffects
  );
  assert.equal(
    formActions.describePrivateFormActionSubmitDispatchGate()
      .submitResetExecutionGateAvailable,
    true
  );

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    formActions.isPrivateFormActionSubmitResetExecutionRecord(record),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionSubmitResetExecutionRecordPayload(record),
    record
  );
  assert.equal(
    record.status,
    formActions.privateFormActionSubmitResetExecutionRecordedStatus
  );
  assert.equal(record.executionId, 'submit-reset-execution:1');
  assert.equal(record.sourceSubmitDispatchId, dispatch.dispatchId);
  assert.equal(record.sourceFormDataBlockerId, blocker.blockerId);
  assert.equal(record.sourceEventExtractionId, extraction.extractionId);
  assert.equal(
    record.sourceResetQueueCommitRequestId,
    resetQueueCommit.requestId
  );
  assert.equal(record.sourceResetIntentRequestId, resetIntent.requestId);
  assert.deepEqual(record.acceptedMetadataIds, dispatch.acceptedMetadataIds);
  assert.equal(record.admission.deterministicFakeFormOnly, true);
  assert.equal(
    record.admission.fakeFormPath.pathId,
    'fake-form-action-completion-reset-path'
  );
  assert.equal(record.admission.fakeFormPath.hostTag, 'form');
  assert.equal(record.admission.fakeFormPath.formDataBlockerConsumed, true);
  assert.equal(
    record.admission.fakeFormPath.resetIntentMetadataConsumed,
    true
  );
  assert.equal(record.admission.fakeFormPath.realFormReset, false);

  assert.equal(record.sourceSubmitDispatch.dispatchId, dispatch.dispatchId);
  assert.equal(record.sourceSubmitDispatch.resolvedActionKind, 'function');
  assert.equal(record.sourceSubmitDispatch.formDataConstructionBlocked, true);
  assert.equal(record.sourceSubmitDispatch.resetStateWouldBeQueued, true);
  assert.equal(
    record.sourceSubmitDispatch.actionCompletionResetBeforeAction,
    true
  );
  assert.equal(record.sourceSubmitDispatch.callbackDispatchExecuted, false);
  assert.equal(record.sourceSubmitDispatch.actionInvoked, false);
  assert.equal(record.sourceSubmitDispatch.realFormReset, false);

  assert.equal(
    record.formDataBlockerConsumption.sourceFormDataBlockerId,
    blocker.blockerId
  );
  assert.equal(
    record.formDataBlockerConsumption.formDataConstructionBlocked,
    true
  );
  assert.equal(record.formDataBlockerConsumption.blockedFormDataConsumed, true);
  assert.equal(record.formDataBlockerConsumption.formDataConstructed, false);
  assert.equal(record.formDataBlockerConsumption.realFormInspected, false);

  assert.equal(
    record.resetIntentConsumption.sourceResetIntentRequestId,
    resetIntent.requestId
  );
  assert.equal(
    record.resetIntentConsumption.sourceResetOrderingKind,
    'action-completion-reset-before-action'
  );
  assert.equal(
    record.resetIntentConsumption.actionCompletionResetBeforeAction,
    true
  );
  assert.equal(record.resetIntentConsumption.resetStateWouldBeQueued, true);
  assert.equal(record.resetIntentConsumption.resetIntentMetadataConsumed, true);
  assert.equal(record.resetIntentConsumption.resetStateQueued, false);
  assert.equal(record.resetIntentConsumption.reactUpdateQueued, false);
  assert.equal(record.resetIntentConsumption.resetFormInstanceCalled, false);
  assert.equal(record.resetIntentConsumption.realFormReset, false);

  assert.equal(
    record.fakeFormResetExecution.status,
    'executed-private-form-action-submit-reset-fake-form-path'
  );
  assert.equal(
    record.fakeFormResetExecution.fakeFormPathId,
    'fake-form-action-completion-reset-path'
  );
  assert.equal(record.fakeFormResetExecution.deterministicFakeFormOnly, true);
  assert.equal(record.fakeFormResetExecution.blockedFormDataConsumed, true);
  assert.equal(
    record.fakeFormResetExecution.resetIntentMetadataConsumed,
    true
  );
  assert.equal(
    record.fakeFormResetExecution.actionCompletionResetBeforeAction,
    true
  );
  assert.equal(record.fakeFormResetExecution.fakeFormResetPathExecuted, true);
  assert.equal(record.fakeFormResetExecution.fakeFormResetRecorded, true);
  assert.equal(record.fakeFormResetExecution.formDataConstructed, false);
  assert.equal(record.fakeFormResetExecution.callbackDispatchExecuted, false);
  assert.equal(record.fakeFormResetExecution.actionInvoked, false);
  assert.equal(record.fakeFormResetExecution.hostTransitionStarted, false);
  assert.equal(record.fakeFormResetExecution.resetStateQueued, false);
  assert.equal(record.fakeFormResetExecution.resetFormInstanceCalled, false);
  assert.equal(record.fakeFormResetExecution.realFormReset, false);
  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(
    record.publicFormActionBoundary.publicFormSubmissionReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicSubmitDispatchReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicRequestFormResetReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicActionInvocationReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicDomMutationReachable,
    false
  );
  assert.equal(record.publicFormActionBoundary.submitDispatchReachable, false);
  assert.equal(record.publicFormActionBoundary.formDataConstructed, false);
  assert.equal(record.publicFormActionBoundary.actionInvoked, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.equal(
    record.publicFormActionBoundary.packageCompatibilityClaimed,
    false
  );

  assert.deepEqual(
    record.sideEffects,
    formActions.formActionSubmitResetExecutionDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.sourceSubmitDispatchAccepted, true);
  assert.equal(record.sideEffects.sourceFormDataBlockerAccepted, true);
  assert.equal(record.sideEffects.sourceResetQueueIntentAccepted, true);
  assert.equal(record.sideEffects.blockedFormDataConsumed, true);
  assert.equal(record.sideEffects.resetIntentMetadataConsumed, true);
  assert.equal(record.sideEffects.fakeFormResetPathExecuted, true);
  assert.equal(record.sideEffects.formDataConstructed, false);
  assert.equal(record.sideEffects.callbackDispatchExecuted, false);
  assert.equal(record.sideEffects.actionInvoked, false);
  assert.equal(record.sideEffects.resetStateQueued, false);
  assert.equal(record.sideEffects.realFormReset, false);

  const error =
    formActions.createUnsupportedFormActionSubmitResetExecutionError(record);
  assert.equal(
    error.code,
    formActions.privateFormActionSubmitResetExecutionGateErrorCode
  );
  assert.equal(error.executionId, 'submit-reset-execution:1');
  assert.equal(error.sourceSubmitDispatchId, dispatch.dispatchId);
  assert.deepEqual(
    error.formDataBlockerConsumption,
    record.formDataBlockerConsumption
  );
  assert.deepEqual(
    error.resetIntentConsumption,
    record.resetIntentConsumption
  );
  assert.match(
    error.message,
    /private form action submit reset execution gate records one fake form path only/u
  );

  assert.throws(
    () =>
      executionGate.recordSubmitResetExecution(dispatch, {
        explicitFormActionSubmitResetExecution: true
      }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'fake form reset execution gate admits exactly one fake form path'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionSubmitResetExecutionDiagnosticGate()
        .recordSubmitResetExecution(dispatch, {
          explicitFormActionSubmitResetExecution: true,
          form: throwingProxy('form')
        }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'form must not be passed to the submit reset execution fake form gate'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionSubmitResetExecutionDiagnosticGate()
        .recordSubmitResetExecution(dispatch, {
          explicitFormActionSubmitResetExecution: true,
          callbackDispatchExecutionRequested: true
        }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'callback dispatch execution must remain blocked'
    }
  );

  const requestResetIntent = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'requestFormReset',
    formOwnership: 'react-owned',
    transitionContext: 'action'
  });
  const requestResetQueueCommit = queueCommitGate.recordResetQueueCommit(
    requestResetIntent,
    {
      explicitAdmission: true,
      queueSource: 'requestFormResetOnFiber',
      queueKind: 'metadata-only-reset-state-queue',
      commitKind: 'after-mutation-form-reset-order',
      hostTag: 'form'
    }
  );
  const requestResetBlocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    requestResetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      submitterShape: {
        controlKind: 'button',
        hostTag: 'button'
      }
    }
  );
  const requestResetDispatch =
    dispatchGate.recordSubmitDispatchDiagnostic(requestResetBlocker, {
      explicitFormActionSubmitDispatch: true,
      submitControlKind: 'button'
    });
  assert.throws(
    () =>
      formActions
        .createFormActionSubmitResetExecutionDiagnosticGate()
        .recordSubmitResetExecution(requestResetDispatch, {
          explicitFormActionSubmitResetExecution: true
        }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit dispatch must be accepted metadata-only action-completion reset dispatch'
    }
  );
  assert.throws(
    () =>
      formActions.createUnsupportedFormActionSubmitResetExecutionError({}),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private form action callback/action invocation preflight consumes submit and reset metadata only', () => {
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'callback-preflight-source'
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: 'callback-preflight-extraction'
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: 'callback-preflight-queue'
    });
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: 'callback-preflight-blocker'
    });
  const dispatchGate =
    formActions.createFormActionSubmitDispatchDiagnosticGate({
      requestIdPrefix: 'callback-preflight-dispatch'
    });
  const executionGate =
    formActions.createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix: 'callback-preflight-execution'
    });
  const preflightGate =
    formActions.createFormActionCallbackActionPreflightDiagnosticGate({
      requestIdPrefix: 'callback-preflight'
    });
  const submitIntent = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    submissionTrigger: 'requestSubmit',
    actionKind: 'function',
    actionSource: 'form',
    submitControlKind: 'button',
    formActionKind: 'function',
    submitterActionKind: 'none',
    defaultPrevented: false,
    transitionScheduled: false
  });
  const extraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(submitIntent);
  const resetIntent = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: 'r',
    resetSource: 'action-completion',
    formOwnership: 'react-owned',
    transitionContext: 'action'
  });
  const resetQueueCommit = queueCommitGate.recordResetQueueCommit(
    resetIntent,
    {
      explicitAdmission: true,
      queueSource: 'action-completion',
      queueKind: 'metadata-only-reset-state-queue',
      commitKind: 'after-mutation-form-reset-order',
      hostTag: 'form'
    }
  );
  const blocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: {
        targetKind: 'form',
        hostTag: 'form'
      },
      submitterShape: {
        controlKind: 'button',
        hostTag: 'button'
      }
    }
  );
  const dispatch = dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
    explicitFormActionSubmitDispatch: true,
    submitControlKind: 'button'
  });
  const execution = executionGate.recordSubmitResetExecution(dispatch, {
    explicitFormActionSubmitResetExecution: true,
    fakeFormPath: {
      pathId: 'callback-preflight-fake-reset',
      pathKind: 'action-completion-submit-reset',
      hostTag: 'form',
      resetMode: 'record-only-fake-reset'
    }
  });
  const record = preflightGate.recordCallbackActionInvocationPreflight(
    dispatch,
    execution,
    {
      explicitFormActionCallbackActionPreflight: true
    }
  );
  const summary =
    formActions.describePrivateFormActionCallbackActionPreflightGate();

  assert.equal(
    summary.gateId,
    formActions.privateFormActionCallbackActionPreflightGateId
  );
  assert.equal(
    summary.status,
    formActions.privateFormActionCallbackActionPreflightStatus
  );
  assert.equal(
    summary.acceptedSubmitDispatchRecordType,
    formActions.privateFormActionSubmitDispatchRecordType
  );
  assert.equal(
    summary.acceptedSubmitDispatchStatus,
    formActions.privateFormActionSubmitDispatchRecordedStatus
  );
  assert.equal(
    summary.acceptedSubmitResetExecutionRecordType,
    formActions.privateFormActionSubmitResetExecutionRecordType
  );
  assert.equal(
    summary.acceptedSubmitResetExecutionStatus,
    formActions.privateFormActionSubmitResetExecutionRecordedStatus
  );
  assert.equal(summary.consumesSubmitDispatchMetadata, true);
  assert.equal(summary.consumesSubmitResetExecutionMetadata, true);
  assert.equal(summary.recordsAcceptedMetadataIds, true);
  assert.equal(summary.recordsCallbackQueuePreflight, true);
  assert.equal(summary.recordsActionInvocationPreflight, true);
  assert.equal(summary.recordsResetActionPublicBlockers, true);
  assert.equal(summary.provesCallbacksRemainUninvoked, true);
  assert.equal(summary.provesActionsRemainUninvoked, true);
  assert.equal(summary.rejectsStaleSubmitDispatchMetadata, true);
  assert.equal(summary.rejectsStaleSubmitResetExecutionMetadata, true);
  assert.equal(summary.rejectsForeignSubmitResetExecutionMetadata, true);
  assert.equal(summary.rejectsLiveForms, true);
  assert.equal(summary.rejectsCallbackExecution, true);
  assert.equal(summary.rejectsActionInvocation, true);
  assert.equal(summary.rejectsPublicSubmitDispatch, true);
  assert.equal(summary.rejectsPublicFormSubmission, true);
  assert.equal(summary.rejectsPublicResetRequest, true);
  assert.equal(summary.rejectsPublicDomMutation, true);
  assert.equal(summary.rejectsPackageCompatibilityClaims, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.acceptsRawEvents, false);
  assert.equal(summary.acceptsActionFunctions, false);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.createsSyntheticEvents, false);
  assert.equal(summary.dispatchesSubmitCallbacks, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.startsHostTransition, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.callsResetFormInstance, false);
  assert.equal(summary.resetsForms, false);
  assert.deepEqual(
    summary.sideEffects,
    formActions.formActionCallbackActionPreflightBlockedSideEffects
  );
  assert.equal(
    formActions.describePrivateFormActionSubmitResetExecutionGate()
      .callbackActionPreflightGateAvailable,
    true
  );

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    formActions.isPrivateFormActionCallbackActionPreflightRecord(record),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionCallbackActionPreflightRecordPayload(record),
    record
  );
  assert.equal(
    record.status,
    formActions.privateFormActionCallbackActionPreflightRecordedStatus
  );
  assert.equal(record.preflightId, 'callback-preflight:1');
  assert.equal(record.sourceSubmitDispatchId, dispatch.dispatchId);
  assert.equal(record.sourceSubmitResetExecutionId, execution.executionId);
  assert.equal(record.sourceFormDataBlockerId, blocker.blockerId);
  assert.equal(record.sourceEventExtractionId, extraction.extractionId);
  assert.equal(record.sourceResetIntentRequestId, resetIntent.requestId);
  assert.equal(record.acceptedMetadataIds.submitDispatchId, dispatch.dispatchId);
  assert.equal(
    record.acceptedMetadataIds.submitResetExecutionId,
    execution.executionId
  );
  assert.equal(record.admission.metadataOnly, true);
  assert.equal(record.admission.callbackDispatchExecutionRequested, false);
  assert.equal(record.admission.callbackInvocationRequested, false);
  assert.equal(record.admission.actionInvocationRequested, false);
  assert.equal(record.admission.formDataConstructed, false);
  assert.equal(record.admission.syntheticEventCreated, false);
  assert.equal(record.admission.actionInvoked, false);
  assert.equal(record.admission.realFormReset, false);

  assert.equal(record.sourceSubmitDispatch.dispatchId, dispatch.dispatchId);
  assert.equal(record.sourceSubmitDispatch.resolvedActionKind, 'function');
  assert.equal(record.sourceSubmitDispatch.formDataConstructionBlocked, true);
  assert.equal(record.sourceSubmitDispatch.callbackDispatchExecuted, false);
  assert.equal(record.sourceSubmitDispatch.submitCallbackInvoked, false);
  assert.equal(record.sourceSubmitDispatch.actionInvoked, false);
  assert.equal(record.sourceSubmitDispatch.hostTransitionStarted, false);
  assert.equal(record.sourceSubmitResetExecution.executionId, execution.executionId);
  assert.equal(
    record.sourceSubmitResetExecution.fakeFormResetPathExecuted,
    true
  );
  assert.equal(record.sourceSubmitResetExecution.callbackDispatchExecuted, false);
  assert.equal(record.sourceSubmitResetExecution.actionInvoked, false);
  assert.equal(record.sourceSubmitResetExecution.realFormReset, false);

  assert.equal(
    record.submitDispatchMetadataConsumption.sourceSubmitDispatchId,
    dispatch.dispatchId
  );
  assert.equal(
    record.submitDispatchMetadataConsumption.submitDispatchMetadataConsumed,
    true
  );
  assert.equal(
    record.submitDispatchMetadataConsumption.callbackDispatchExecuted,
    false
  );
  assert.equal(
    record.submitResetExecutionMetadataConsumption
      .sourceSubmitResetExecutionId,
    execution.executionId
  );
  assert.equal(
    record.submitResetExecutionMetadataConsumption
      .submitResetExecutionMetadataConsumed,
    true
  );
  assert.equal(
    record.submitResetExecutionMetadataConsumption.fakeFormResetPathExecuted,
    true
  );
  assert.equal(
    record.submitResetExecutionMetadataConsumption.actionInvoked,
    false
  );

  assert.equal(
    record.callbackDispatchPreflight.status,
    'preflighted-private-form-action-callback-dispatch-blocked'
  );
  assert.equal(record.callbackDispatchPreflight.callbackDispatchPreflighted, true);
  assert.equal(record.callbackDispatchPreflight.syntheticEventCreated, false);
  assert.equal(record.callbackDispatchPreflight.callbackDispatchExecuted, false);
  assert.equal(record.callbackDispatchPreflight.submitCallbackInvoked, false);
  assert.equal(record.callbackDispatchPreflight.actionInvoked, false);
  assert.equal(
    record.actionInvocationPreflight.status,
    'preflighted-private-form-action-invocation-blocked'
  );
  assert.equal(
    record.actionInvocationPreflight.actionInvocationWouldBeScheduled,
    true
  );
  assert.equal(record.actionInvocationPreflight.fakeResetMetadataConsumed, true);
  assert.equal(record.actionInvocationPreflight.formDataConstructed, false);
  assert.equal(record.actionInvocationPreflight.actionFunctionCaptured, false);
  assert.equal(record.actionInvocationPreflight.actionInvoked, false);
  assert.equal(record.actionInvocationPreflight.hostTransitionStarted, false);
  assertCallbackActionPreflightPublicBlockersFailClosed(record);
  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(
    record.publicFormActionBoundary.publicFormSubmissionReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicSubmitDispatchReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicRequestFormResetReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicActionInvocationReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicDomMutationReachable,
    false
  );
  assert.equal(record.publicFormActionBoundary.callbackDispatchExecuted, false);
  assert.equal(record.publicFormActionBoundary.actionInvoked, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.equal(
    record.publicFormActionBoundary.packageCompatibilityClaimed,
    false
  );

  assert.deepEqual(
    record.sideEffects,
    formActions.formActionCallbackActionPreflightDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.sourceSubmitDispatchAccepted, true);
  assert.equal(record.sideEffects.sourceSubmitResetExecutionAccepted, true);
  assert.equal(record.sideEffects.submitDispatchMetadataConsumed, true);
  assert.equal(record.sideEffects.submitResetExecutionMetadataConsumed, true);
  assert.equal(record.sideEffects.callbackQueuePreflightRecorded, true);
  assert.equal(record.sideEffects.actionInvocationPreflightRecorded, true);
  assert.equal(record.sideEffects.resetActionPublicBlockersRecorded, true);
  assert.equal(record.sideEffects.formDataConstructed, false);
  assert.equal(record.sideEffects.syntheticEventCreated, false);
  assert.equal(record.sideEffects.callbackDispatchExecuted, false);
  assert.equal(record.sideEffects.submitCallbackInvoked, false);
  assert.equal(record.sideEffects.actionFunctionCaptured, false);
  assert.equal(record.sideEffects.actionInvoked, false);
  assert.equal(record.sideEffects.hostTransitionStarted, false);
  assert.equal(record.sideEffects.realFormReset, false);

  const error =
    formActions.createUnsupportedFormActionCallbackActionPreflightError(record);
  assert.equal(
    error.code,
    formActions.privateFormActionCallbackActionPreflightGateErrorCode
  );
  assert.equal(error.preflightId, 'callback-preflight:1');
  assert.equal(error.sourceSubmitDispatchId, dispatch.dispatchId);
  assert.equal(error.sourceSubmitResetExecutionId, execution.executionId);
  assert.deepEqual(
    error.callbackDispatchPreflight,
    record.callbackDispatchPreflight
  );
  assert.deepEqual(
    error.actionInvocationPreflight,
    record.actionInvocationPreflight
  );
  assert.match(
    error.message,
    /private form action callback\/action invocation preflight records metadata only/u
  );

  let callbackCalls = 0;
  const callback = () => {
    callbackCalls++;
  };
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        dispatch,
        execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          callback
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'callback must not be passed to the callback/action invocation preflight gate'
    }
  );
  assert.equal(callbackCalls, 0);

  let actionCalls = 0;
  const action = () => {
    actionCalls++;
  };
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        dispatch,
        execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          action
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'action must not be passed to the callback/action invocation preflight gate'
    }
  );
  assert.equal(actionCalls, 0);

  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        dispatch,
        execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          callbackDispatchExecutionRequested: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'callback dispatch execution must remain blocked'
    }
  );
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        dispatch,
        execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          actionInvocationRequested: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'action invocation must remain blocked'
    }
  );
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        dispatch,
        execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          formDataConstructionRequested: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'form data construction must remain blocked'
    }
  );
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        execution,
        execution,
        {
          explicitFormActionCallbackActionPreflight: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit dispatch must be accepted metadata-only submit dispatch'
    }
  );
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        dispatch,
        dispatch,
        {
          explicitFormActionCallbackActionPreflight: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit reset execution must be accepted metadata-only fake reset execution'
    }
  );
  assert.throws(
    () =>
      formActions.createUnsupportedFormActionCallbackActionPreflightError({}),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private form reset/action preflight negative matrix rejects stale public and fake metadata', () => {
  const scenario = createPrivateFormActionCallbackPreflightScenario(
    'reset-action-preflight-negative'
  );
  const foreign = createPrivateFormActionCallbackPreflightScenario(
    'reset-action-preflight-foreign'
  );

  assert.equal(
    scenario.preflight.acceptedMetadataIds.submitDispatchId,
    scenario.dispatch.dispatchId
  );
  assert.equal(
    scenario.preflight.acceptedMetadataIds.submitResetExecutionId,
    scenario.execution.executionId
  );
  assertCallbackActionPreflightPublicBlockersFailClosed(scenario.preflight);
  assertCallbackActionPreflightPublicBoundaryFailClosed(
    scenario.preflight.publicFormActionBoundary
  );

  for (const value of [
    scenario.dispatch,
    scenario.dispatch.acceptedMetadataIds,
    scenario.execution,
    scenario.execution.acceptedMetadataIds,
    scenario.execution.fakeFormResetExecution,
    scenario.preflight,
    scenario.preflight.acceptedMetadataIds,
    scenario.preflight.submitDispatchMetadataConsumption,
    scenario.preflight.submitResetExecutionMetadataConsumption,
    scenario.preflight.callbackDispatchPreflight,
    scenario.preflight.actionInvocationPreflight,
    scenario.preflight.resetActionPublicBlockers,
    scenario.preflight.publicFormActionBoundary
  ]) {
    assert.equal(Object.isFrozen(value), true);
  }

  for (const mutate of [
    () => {
      scenario.dispatch.actionIdentity.actionInvoked = true;
    },
    () => {
      scenario.execution.fakeFormResetExecution.realFormReset = true;
    },
    () => {
      scenario.preflight.acceptedMetadataIds.submitDispatchId =
        'stale-submit-dispatch';
    },
    () => {
      scenario.preflight.callbackDispatchPreflight.callbackDispatchExecuted =
        true;
    },
    () => {
      scenario.preflight.actionInvocationPreflight.actionInvoked = true;
    },
    () => {
      scenario.preflight.resetActionPublicBlockers
        .publicRequestFormResetReachable = true;
    },
    () => {
      scenario.preflight.publicFormActionBoundary.compatibilityClaimed =
        true;
    }
  ]) {
    assert.throws(mutate, TypeError);
  }

  const preflightGate =
    formActions.createFormActionCallbackActionPreflightDiagnosticGate({
      requestIdPrefix: 'reset-action-preflight-negative-gate'
    });
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        scenario.dispatch,
        scenario.execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          sourceSubmitDispatchId: 'stale-submit-dispatch'
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'sourceSubmitDispatchId must match the submit dispatch record'
    }
  );
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        scenario.dispatch,
        scenario.execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          sourceSubmitResetExecutionId: 'stale-submit-reset-execution'
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'sourceSubmitResetExecutionId must match the submit reset execution record'
    }
  );
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        scenario.dispatch,
        foreign.execution,
        {
          explicitFormActionCallbackActionPreflight: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit reset execution must be accepted metadata-only fake reset execution'
    }
  );

  const fakeDispatch = {
    ...scenario.dispatch
  };
  const fakeExecution = {
    ...scenario.execution
  };
  assert.equal(
    formActions.isPrivateFormActionSubmitDispatchRecord(fakeDispatch),
    false
  );
  assert.equal(
    formActions.isPrivateFormActionSubmitResetExecutionRecord(fakeExecution),
    false
  );
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        fakeDispatch,
        scenario.execution,
        {
          explicitFormActionCallbackActionPreflight: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit dispatch must be accepted metadata-only submit dispatch'
    }
  );
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        scenario.dispatch,
        fakeExecution,
        {
          explicitFormActionCallbackActionPreflight: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source submit reset execution must be accepted metadata-only fake reset execution'
    }
  );

  assert.throws(
    () =>
      formActions
        .createFormActionSubmitResetExecutionDiagnosticGate()
        .recordSubmitResetExecution(scenario.dispatch, {
          explicitFormActionSubmitResetExecution: true,
          sourceSubmitDispatchId: 'stale-submit-dispatch'
        }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'sourceSubmitDispatchId must match the submit dispatch record'
    }
  );
  for (const {field, reason} of [
    {
      field: 'publicSubmitDispatchRequested',
      reason: 'public submit dispatch must remain blocked'
    },
    {
      field: 'publicSubmitDispatchReachable',
      reason: 'public submit dispatch must remain blocked'
    },
    {
      field: 'publicFormSubmissionRequested',
      reason: 'public form submission must remain blocked'
    },
    {
      field: 'publicFormSubmissionReachable',
      reason: 'public form submission must remain blocked'
    },
    {
      field: 'publicRequestFormResetRequested',
      reason: 'public reset request must remain blocked'
    },
    {
      field: 'publicRequestFormResetReachable',
      reason: 'public reset request must remain blocked'
    },
    {
      field: 'publicActionInvocationRequested',
      reason: 'action invocation must remain blocked'
    },
    {
      field: 'publicActionInvocationReachable',
      reason: 'action invocation must remain blocked'
    },
    {
      field: 'formDataConstructionRequested',
      reason: 'form data construction must remain blocked'
    },
    {
      field: 'hostTransitionRequested',
      reason: 'host transition start must remain blocked'
    },
    {
      field: 'reactUpdateRequested',
      reason: 'react update queueing must remain blocked'
    },
    {
      field: 'reactUpdate',
      reason: 'react update queueing must remain blocked'
    },
    {
      field: 'updateQueue',
      reason: 'react update queueing must remain blocked'
    },
    {
      field: 'resetExecutionRequested',
      reason: 'reset execution must remain blocked'
    },
    {
      field: 'domMutationRequested',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'domMutation',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'publicDomMutationEnabled',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'packageCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    },
    {
      field: 'publicPackageCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    },
    {
      field: 'packageExportCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    }
  ]) {
    assert.throws(
      () =>
        formActions
          .createFormActionSubmitResetExecutionDiagnosticGate()
          .recordSubmitResetExecution(scenario.dispatch, {
            explicitFormActionSubmitResetExecution: true,
            [field]: true
          }),
      {
        code:
          formActions
            .privateFormActionSubmitResetExecutionInvalidAdmissionCode,
        compatibilityTarget,
        reason
      },
      field
    );
  }
  assert.throws(
    () =>
      formActions
        .createFormActionSubmitResetExecutionDiagnosticGate()
        .recordSubmitResetExecution(scenario.dispatch, {
          explicitFormActionSubmitResetExecution: true,
          fakeFormPath: {
            pathKind: 'action-completion-submit-reset',
            hostTag: 'form',
            resetMode: 'record-only-fake-reset',
            realFormReset: true
          }
        }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fakeFormPath.realFormReset must remain blocked'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionSubmitResetExecutionDiagnosticGate()
        .recordSubmitResetExecution(scenario.dispatch, {
          explicitFormActionSubmitResetExecution: true,
          fakeFormPath: {
            pathKind: 'action-completion-submit-reset',
            hostTag: 'form',
            resetMode: 'record-only-fake-reset',
            form: throwingProxy('fake form path form')
          }
        }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'fakeFormPath.form must not be passed to the submit reset execution fake form gate'
    }
  );

  for (const {field, reason} of [
    {
      field: 'publicSubmitDispatchRequested',
      reason: 'public submit dispatch must remain blocked'
    },
    {
      field: 'publicSubmitDispatchReachable',
      reason: 'public submit dispatch must remain blocked'
    },
    {
      field: 'publicFormSubmissionRequested',
      reason: 'public form submission must remain blocked'
    },
    {
      field: 'publicFormSubmissionReachable',
      reason: 'public form submission must remain blocked'
    },
    {
      field: 'publicRequestFormResetRequested',
      reason: 'public reset request must remain blocked'
    },
    {
      field: 'publicRequestFormResetReachable',
      reason: 'public reset request must remain blocked'
    },
    {
      field: 'publicActionInvocationRequested',
      reason: 'action invocation must remain blocked'
    },
    {
      field: 'publicActionInvocationReachable',
      reason: 'action invocation must remain blocked'
    },
    {
      field: 'reactUpdateRequested',
      reason: 'react update queueing must remain blocked'
    },
    {
      field: 'reactUpdate',
      reason: 'react update queueing must remain blocked'
    },
    {
      field: 'updateQueue',
      reason: 'react update queueing must remain blocked'
    },
    {
      field: 'domMutationRequested',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'domMutation',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'publicDomMutationEnabled',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'publicFormActionCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    },
    {
      field: 'publicPackageCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    },
    {
      field: 'packageExportCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    }
  ]) {
    assert.throws(
      () =>
        formActions
          .createFormActionCallbackActionPreflightDiagnosticGate()
          .recordCallbackActionInvocationPreflight(
            scenario.dispatch,
            scenario.execution,
            {
              explicitFormActionCallbackActionPreflight: true,
              [field]: true
            }
          ),
      {
        code:
          formActions
            .privateFormActionCallbackActionPreflightInvalidAdmissionCode,
        compatibilityTarget,
        reason
      },
      field
    );
  }
});

test('private form action async callback execution records pending/reset metadata and fail-closed errors', async () => {
  const scenario =
    createPrivateFormActionCallbackPreflightScenario('async-callback');
  const executionGate =
    formActions.createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: 'async-callback-execution'
    });
  const summary =
    formActions.describePrivateFormActionAsyncCallbackExecutionGate();
  let callbackCalls = 0;
  let observedPayload = null;

  const record = await executionGate.recordAsyncCallbackExecution(
    scenario.preflight,
    {
      explicitFormActionAsyncCallbackExecution: true,
      async asyncActionCallback(payload) {
        callbackCalls++;
        observedPayload = payload;
        await Promise.resolve();
        return { ok: true };
      }
    }
  );

  assert.equal(
    summary.gateId,
    formActions.privateFormActionAsyncCallbackExecutionGateId
  );
  assert.equal(
    summary.status,
    formActions.privateFormActionAsyncCallbackExecutionStatus
  );
  assert.equal(
    summary.acceptedCallbackActionPreflightRecordType,
    formActions.privateFormActionCallbackActionPreflightRecordType
  );
  assert.equal(
    summary.acceptedCallbackActionPreflightStatus,
    formActions.privateFormActionCallbackActionPreflightRecordedStatus
  );
  assert.equal(summary.recordsPendingStatusMetadata, true);
  assert.equal(summary.recordsResetMetadata, true);
  assert.equal(summary.admitsPrivateAsyncActionCallbacks, true);
  assert.equal(summary.executesPrivateAsyncActionCallbacks, true);
  assert.equal(summary.recordsFulfilledThenableMetadata, true);
  assert.equal(summary.recordsRejectedThenableMetadata, true);
  assert.equal(summary.failClosedErrorsRecorded, true);
  assert.equal(summary.rejectsLiveForms, true);
  assert.equal(summary.rejectsPublicDispatch, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.acceptsActionFunctions, false);
  assert.equal(summary.acceptsPrivateAsyncActionCallbacks, true);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.createsSyntheticEvents, false);
  assert.equal(summary.dispatchesSubmitCallbacks, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.invokesPrivateAsyncActionCallbacks, true);
  assert.equal(summary.startsHostTransition, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.resetsForms, false);
  assert.deepEqual(
    summary.sideEffects,
    formActions.formActionAsyncCallbackExecutionBlockedSideEffects
  );
  assert.deepEqual(
    resourceFormGate.describePrivateFormActionAsyncCallbackExecutionBoundary(
      null
    ),
    summary
  );

  assert.equal(callbackCalls, 1);
  assert.equal(Object.isFrozen(observedPayload), true);
  assert.equal(
    observedPayload.$$typeof,
    'fast.react_dom.private_form_action_async_callback_payload'
  );
  assert.equal(observedPayload.formDataConstructed, false);
  assert.equal(observedPayload.syntheticEventCreated, false);
  assert.equal(observedPayload.actionInvoked, false);
  assert.equal(observedPayload.hostTransitionStarted, false);
  assert.equal(observedPayload.realFormReset, false);

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    formActions.isPrivateFormActionAsyncCallbackExecutionRecord(record),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionAsyncCallbackExecutionRecordPayload(record),
    record
  );
  assert.equal(
    record.status,
    formActions.privateFormActionAsyncCallbackExecutionRecordedStatus
  );
  assert.equal(record.executionId, 'async-callback-execution:1');
  assert.equal(
    record.sourceCallbackActionPreflightId,
    scenario.preflight.preflightId
  );
  assert.equal(record.sourceSubmitDispatchId, scenario.dispatch.dispatchId);
  assert.equal(
    record.sourceSubmitResetExecutionId,
    scenario.execution.executionId
  );
  assert.equal(
    record.acceptedMetadataIds.callbackActionPreflightId,
    scenario.preflight.preflightId
  );
  assert.equal(record.admission.deterministicFakeCallbackOnly, true);
  assert.equal(record.admission.asyncActionCallbackAccepted, true);
  assert.equal(record.admission.asyncActionCallbackDeclaredAsync, true);
  assert.equal(record.admission.pendingStatusMetadataRequested, true);
  assert.equal(record.admission.resetMetadataRequested, true);
  assert.equal(record.admission.publicDispatchRequested, false);
  assert.equal(record.admission.formDataConstructed, false);
  assert.equal(record.admission.actionInvoked, false);

  assert.equal(
    record.sourceCallbackActionPreflight.callbackQueuePreflighted,
    true
  );
  assert.equal(
    record.sourceCallbackActionPreflight.actionInvocationPreflighted,
    true
  );
  assert.equal(
    record.sourceCallbackActionPreflight.pendingStatusWouldBeSet,
    true
  );
  assert.equal(
    record.submitDispatchMetadataConsumption.submitDispatchMetadataConsumed,
    true
  );
  assert.equal(
    record.submitResetExecutionMetadataConsumption
      .submitResetExecutionMetadataConsumed,
    true
  );
  assert.equal(
    record.pendingStatusMetadata.status,
    'recorded-private-form-action-pending-status-metadata'
  );
  assert.equal(record.pendingStatusMetadata.pendingStatusWouldBeSet, true);
  assert.equal(record.pendingStatusMetadata.pending, true);
  assert.equal(
    record.pendingStatusMetadata.dataWouldUseBlockedFormDataMetadata,
    true
  );
  assert.equal(record.pendingStatusMetadata.formDataConstructed, false);
  assert.equal(record.pendingStatusMetadata.hostTransitionStarted, false);
  assert.equal(
    record.resetMetadata.status,
    'recorded-private-form-action-reset-metadata'
  );
  assert.equal(record.resetMetadata.resetIntentMetadataConsumed, true);
  assert.equal(record.resetMetadata.fakeResetMetadataConsumed, true);
  assert.equal(
    record.resetMetadata.resetWouldRunBeforeActionInvocation,
    true
  );
  assert.equal(record.resetMetadata.resetStateWouldBeQueued, true);
  assert.equal(record.resetMetadata.resetStateQueued, false);
  assert.equal(record.resetMetadata.resetFormInstanceCalled, false);
  assert.equal(record.resetMetadata.realFormReset, false);

  assert.equal(
    record.callbackExecution.status,
    'executed-private-form-action-async-callback-fulfilled'
  );
  assert.equal(record.callbackExecution.asyncActionCallbackInvoked, true);
  assert.equal(record.callbackExecution.pendingStatusMetadataRecorded, true);
  assert.equal(record.callbackExecution.resetMetadataConsumed, true);
  assert.equal(record.callbackExecution.thenableObserved, true);
  assert.equal(record.callbackExecution.finalThenableStatus, 'fulfilled');
  assert.equal(record.callbackExecution.callbackOutcome, 'fulfilled');
  assert.equal(record.callbackExecution.fulfilled, true);
  assert.equal(record.callbackExecution.failClosed, false);
  assert.equal(record.callbackExecution.formDataConstructed, false);
  assert.equal(record.callbackExecution.publicActionInvoked, false);
  assert.equal(record.callbackExecution.hostTransitionStarted, false);
  assert.equal(record.callbackExecution.reactUpdateQueued, false);
  assert.equal(record.callbackExecution.resetFormInstanceCalled, false);
  assert.equal(record.callbackExecution.realFormReset, false);
  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(
    record.publicFormActionBoundary.privateAsyncActionCallbackPubliclyReachable,
    false
  );
  assert.equal(record.publicFormActionBoundary.actionInvoked, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.deepEqual(
    record.sideEffects,
    formActions.formActionAsyncCallbackExecutionFulfilledSideEffects
  );
  assert.equal(record.sideEffects.privateAsyncActionCallbackInvoked, true);
  assert.equal(record.sideEffects.asyncCallbackThenableFulfilled, true);
  assert.equal(record.sideEffects.callbackDispatchExecuted, false);
  assert.equal(record.sideEffects.submitCallbackInvoked, false);
  assert.equal(record.sideEffects.actionInvoked, false);
  assert.equal(record.sideEffects.hostTransitionStarted, false);
  assert.equal(record.sideEffects.realFormReset, false);

  const error =
    formActions.createUnsupportedFormActionAsyncCallbackExecutionError(record);
  assert.equal(
    error.code,
    formActions.privateFormActionAsyncCallbackExecutionGateErrorCode
  );
  assert.equal(error.executionId, record.executionId);
  assert.equal(
    error.sourceCallbackActionPreflightId,
    scenario.preflight.preflightId
  );
  assert.deepEqual(error.pendingStatusMetadata, record.pendingStatusMetadata);
  assert.deepEqual(error.resetMetadata, record.resetMetadata);
  assert.deepEqual(error.callbackExecution, record.callbackExecution);
  assert.match(
    error.message,
    /private form action async callback execution gate records fake callback metadata only/u
  );

  const rejectedRecord = await formActions
    .createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: 'async-callback-rejected'
    })
    .recordAsyncCallbackExecution(scenario.preflight, {
      explicitFormActionAsyncCallbackExecution: true,
      async asyncActionCallback() {
        await Promise.resolve();
        throw new Error('private async callback boom');
      }
    });
  assert.equal(
    rejectedRecord.callbackExecution.status,
    'failed-private-form-action-async-callback-rejected'
  );
  assert.equal(rejectedRecord.callbackExecution.rejected, true);
  assert.equal(rejectedRecord.callbackExecution.failClosed, true);
  assert.deepEqual(rejectedRecord.callbackExecution.errorInfo, {
    type: 'error',
    name: 'Error',
    message: 'private async callback boom'
  });
  assert.deepEqual(
    rejectedRecord.sideEffects,
    formActions.formActionAsyncCallbackExecutionRejectedSideEffects
  );
  assert.equal(rejectedRecord.sideEffects.failClosedErrorRecorded, true);
  assert.equal(rejectedRecord.sideEffects.actionInvoked, false);
  assert.equal(rejectedRecord.sideEffects.realFormReset, false);

  const syncThrowRecord = await formActions
    .createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: 'async-callback-sync-throw'
    })
    .recordAsyncCallbackExecution(scenario.preflight, {
      explicitFormActionAsyncCallbackExecution: true,
      asyncActionCallback() {
        throw new Error('private async callback sync throw');
      }
    });
  assert.equal(
    syncThrowRecord.callbackExecution.status,
    'failed-private-form-action-async-callback-threw'
  );
  assert.equal(syncThrowRecord.callbackExecution.callbackOutcome, 'threw');
  assert.equal(syncThrowRecord.callbackExecution.thenableObserved, false);
  assert.equal(
    syncThrowRecord.callbackExecution.initialThenableStatus,
    'not-created'
  );
  assert.equal(
    syncThrowRecord.callbackExecution.finalThenableStatus,
    'threw'
  );
  assert.equal(syncThrowRecord.callbackExecution.synchronousThrow, true);
  assert.equal(syncThrowRecord.callbackExecution.rejected, false);
  assert.equal(syncThrowRecord.callbackExecution.failClosed, true);
  assert.deepEqual(syncThrowRecord.callbackExecution.errorInfo, {
    type: 'error',
    name: 'Error',
    message: 'private async callback sync throw'
  });
  assert.deepEqual(
    syncThrowRecord.sideEffects,
    formActions.formActionAsyncCallbackExecutionSynchronousThrowSideEffects
  );
  assert.equal(syncThrowRecord.sideEffects.failClosedErrorRecorded, true);
  assert.equal(
    syncThrowRecord.sideEffects.asyncCallbackSynchronousThrowCaptured,
    true
  );
  assert.equal(syncThrowRecord.sideEffects.actionInvoked, false);
  assert.equal(syncThrowRecord.sideEffects.realFormReset, false);

  const nonThenableRecord = await formActions
    .createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: 'async-callback-non-thenable'
    })
    .recordAsyncCallbackExecution(scenario.preflight, {
      explicitFormActionAsyncCallbackExecution: true,
      asyncActionCallback() {
        return 'sync-result';
      }
    });
  assert.equal(
    nonThenableRecord.callbackExecution.status,
    'failed-private-form-action-async-callback-non-thenable'
  );
  assert.equal(
    nonThenableRecord.callbackExecution.callbackOutcome,
    'non-thenable'
  );
  assert.equal(nonThenableRecord.callbackExecution.thenableObserved, false);
  assert.equal(nonThenableRecord.callbackExecution.nonThenable, true);
  assert.equal(nonThenableRecord.callbackExecution.rejected, false);
  assert.equal(nonThenableRecord.callbackExecution.failClosed, true);
  assert.equal(
    nonThenableRecord.callbackExecution.finalThenableStatus,
    'not-thenable'
  );
  assert.deepEqual(nonThenableRecord.callbackExecution.valueInfo, {
    type: 'string',
    length: 'sync-result'.length
  });
  assert.deepEqual(
    nonThenableRecord.sideEffects,
    formActions.formActionAsyncCallbackExecutionNonThenableSideEffects
  );
  assert.equal(nonThenableRecord.sideEffects.failClosedErrorRecorded, true);
  assert.equal(
    nonThenableRecord.sideEffects.asyncCallbackNonThenableReturned,
    true
  );

  let blockedCallbackCalls = 0;
  await assert.rejects(
    () =>
      formActions
        .createFormActionAsyncCallbackExecutionDiagnosticGate()
        .recordAsyncCallbackExecution(scenario.preflight, {
          explicitFormActionAsyncCallbackExecution: true,
          asyncActionCallback() {
            blockedCallbackCalls++;
            return Promise.resolve();
          },
          form: throwingProxy('form')
        }),
    {
      code:
        formActions
          .privateFormActionAsyncCallbackExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'form must not be passed to the async callback execution gate'
    }
  );
  assert.equal(blockedCallbackCalls, 0);

  await assert.rejects(
    () =>
      formActions
        .createFormActionAsyncCallbackExecutionDiagnosticGate()
        .recordAsyncCallbackExecution(scenario.preflight, {
          explicitFormActionAsyncCallbackExecution: true,
          asyncActionCallback: null
        }),
    {
      code:
        formActions
          .privateFormActionAsyncCallbackExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'asyncActionCallback must be a function'
    }
  );
  await assert.rejects(
    () =>
      formActions
        .createFormActionAsyncCallbackExecutionDiagnosticGate()
        .recordAsyncCallbackExecution(scenario.preflight, {
          explicitFormActionAsyncCallbackExecution: true,
          asyncActionCallback() {
            return Promise.resolve();
          },
          publicDispatchRequested: true
        }),
    {
      code:
        formActions
          .privateFormActionAsyncCallbackExecutionInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'public submit dispatch must remain blocked'
    }
  );
  await assert.rejects(
    () =>
      formActions
        .createFormActionAsyncCallbackExecutionDiagnosticGate()
        .recordAsyncCallbackExecution(scenario.dispatch, {
          explicitFormActionAsyncCallbackExecution: true,
          asyncActionCallback() {
            return Promise.resolve();
          }
        }),
    {
      code:
        formActions.privateFormActionAsyncCallbackExecutionInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source callback/action preflight must be accepted metadata-only preflight'
    }
  );
  assert.throws(
    () => formActions.createUnsupportedFormActionAsyncCallbackExecutionError({}),
    {
      code:
        formActions.privateFormActionAsyncCallbackExecutionInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private form action rejected-error preflight records rejected async action metadata only', async () => {
  const scenario =
    createPrivateFormActionCallbackPreflightScenario('rejected-error');
  const asyncExecutionGate =
    formActions.createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: 'rejected-error-async-execution'
    });
  const rejectedExecution =
    await asyncExecutionGate.recordAsyncCallbackExecution(
      scenario.preflight,
      {
        explicitFormActionAsyncCallbackExecution: true,
        async asyncActionCallback() {
          await Promise.resolve();
          throw new Error('private rejected action preflight boom');
        }
      }
    );
  const preflightGate =
    formActions.createFormActionRejectedErrorPreflightDiagnosticGate({
      requestIdPrefix: 'rejected-error-preflight'
    });
  const record = preflightGate.recordRejectedErrorPreflight(
    rejectedExecution,
    {
      explicitFormActionRejectedErrorPreflight: true,
      sourceAsyncCallbackExecutionId: rejectedExecution.executionId
    }
  );
  const summary =
    formActions.describePrivateFormActionRejectedErrorPreflightGate();

  assert.equal(
    summary.gateId,
    formActions.privateFormActionRejectedErrorPreflightGateId
  );
  assert.equal(
    summary.status,
    formActions.privateFormActionRejectedErrorPreflightStatus
  );
  assert.equal(
    summary.acceptedAsyncCallbackExecutionRecordType,
    formActions.privateFormActionAsyncCallbackExecutionRecordType
  );
  assert.equal(
    summary.acceptedAsyncCallbackExecutionStatus,
    formActions.privateFormActionAsyncCallbackExecutionRecordedStatus
  );
  assert.equal(summary.consumesRejectedAsyncActionErrorMetadata, true);
  assert.equal(summary.recordsActionErrorPreflight, true);
  assert.equal(summary.recordsResetActionPublicBlockers, true);
  assert.equal(summary.preflightOnly, true);
  assert.equal(summary.rejectsStaleRejections, true);
  assert.equal(summary.rejectsForeignRejections, true);
  assert.equal(summary.rejectsMalformedRejections, true);
  assert.equal(summary.rejectsPublicErrorRouting, true);
  assert.equal(summary.rejectsPublicDomMutation, true);
  assert.equal(summary.rejectsPackageCompatibilityClaims, true);
  assert.equal(summary.acceptsRealForms, false);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.createsSyntheticEvents, false);
  assert.equal(summary.dispatchesSubmitCallbacks, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.invokesPrivateAsyncActionCallbacks, false);
  assert.equal(summary.routesErrors, false);
  assert.equal(summary.startsHostTransition, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.resetsForms, false);
  assert.equal(summary.publicFormSubmissionEnabled, false);
  assert.equal(summary.publicDomMutationEnabled, false);
  assert.equal(summary.publicFormActionCompatibilityClaimed, false);
  assert.deepEqual(
    summary.sideEffects,
    formActions.formActionRejectedErrorPreflightBlockedSideEffects
  );
  assert.deepEqual(
    resourceFormGate.describePrivateFormActionRejectedErrorPreflightBoundary(
      null
    ),
    summary
  );

  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    formActions.isPrivateFormActionRejectedErrorPreflightRecord(record),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionRejectedErrorPreflightRecordPayload(
      record
    ),
    record
  );
  assert.equal(
    record.status,
    formActions.privateFormActionRejectedErrorPreflightRecordedStatus
  );
  assert.equal(record.preflightId, 'rejected-error-preflight:1');
  assert.equal(
    record.sourceAsyncCallbackExecutionId,
    rejectedExecution.executionId
  );
  assert.equal(
    record.sourceCallbackActionPreflightId,
    scenario.preflight.preflightId
  );
  assert.equal(record.sourceSubmitDispatchId, scenario.dispatch.dispatchId);
  assert.equal(
    record.sourceSubmitResetExecutionId,
    scenario.execution.executionId
  );
  assert.equal(
    record.acceptedMetadataIds.asyncCallbackExecutionId,
    rejectedExecution.executionId
  );
  assert.equal(record.admission.metadataOnly, true);
  assert.equal(record.admission.preflightOnly, true);
  assert.equal(record.admission.publicDispatchRequested, false);
  assert.equal(record.admission.publicErrorRoutingRequested, false);
  assert.equal(record.admission.actionInvocationRequested, false);
  assert.equal(record.admission.resetExecutionRequested, false);
  assert.equal(record.admission.publicRequestFormResetRequested, false);
  assert.equal(record.admission.rawErrorCaptured, false);

  assert.equal(
    record.sourceAsyncCallbackExecution.callbackExecutionStatus,
    'failed-private-form-action-async-callback-rejected'
  );
  assert.equal(record.sourceAsyncCallbackExecution.rejected, true);
  assert.equal(record.sourceAsyncCallbackExecution.failClosed, true);
  assert.equal(record.sourceAsyncCallbackExecution.publicActionInvoked, false);
  assert.equal(record.sourceAsyncCallbackExecution.reactUpdateQueued, false);
  assert.equal(record.sourceAsyncCallbackExecution.realFormReset, false);
  assert.equal(
    record.rejectedAsyncActionError.status,
    'preflighted-private-form-action-rejected-error-metadata'
  );
  assert.equal(record.rejectedAsyncActionError.metadataOnly, true);
  assert.equal(record.rejectedAsyncActionError.rejected, true);
  assert.equal(record.rejectedAsyncActionError.failClosed, true);
  assert.deepEqual(record.rejectedAsyncActionError.errorInfo, {
    type: 'error',
    name: 'Error',
    message: 'private rejected action preflight boom'
  });
  assert.equal(record.rejectedAsyncActionError.rawErrorCaptured, false);
  assert.equal(
    record.rejectedAsyncActionError.publicErrorRoutingStarted,
    false
  );
  assert.equal(
    record.rejectedAsyncActionError.publicRootErrorCallbackInvoked,
    false
  );
  assert.equal(
    record.actionErrorPreflight.status,
    'preflighted-private-form-action-rejected-action-error-blocked'
  );
  assert.equal(
    record.actionErrorPreflight.actionInvocationWouldBeScheduled,
    true
  );
  assert.equal(record.actionErrorPreflight.rejected, true);
  assert.equal(record.actionErrorPreflight.failClosed, true);
  assert.equal(record.actionErrorPreflight.formDataConstructed, false);
  assert.equal(record.actionErrorPreflight.actionInvoked, false);
  assert.equal(record.actionErrorPreflight.publicActionInvoked, false);
  assert.equal(record.actionErrorPreflight.hostTransitionStarted, false);
  assert.equal(record.actionErrorPreflight.reactUpdateQueued, false);
  assert.equal(record.actionErrorPreflight.rootErrorUpdateScheduled, false);
  assert.equal(
    record.actionErrorPreflight.publicRootErrorCallbackInvoked,
    false
  );
  assert.equal(record.actionErrorPreflight.errorBoundaryScheduled, false);
  assert.equal(
    record.resetActionPublicBlockers.publicFormActionsEnabled,
    false
  );
  assert.equal(
    record.resetActionPublicBlockers.publicFormSubmissionReachable,
    false
  );
  assert.equal(
    record.resetActionPublicBlockers.publicSubmitDispatchReachable,
    false
  );
  assert.equal(
    record.resetActionPublicBlockers.publicRequestFormResetReachable,
    false
  );
  assert.equal(
    record.resetActionPublicBlockers.publicActionInvocationReachable,
    false
  );
  assert.equal(
    record.resetActionPublicBlockers.publicErrorRoutingReachable,
    false
  );
  assert.equal(record.resetActionPublicBlockers.actionInvoked, false);
  assert.equal(record.resetActionPublicBlockers.publicActionInvoked, false);
  assert.equal(record.resetActionPublicBlockers.resetStateQueued, false);
  assert.equal(record.resetActionPublicBlockers.reactUpdateQueued, false);
  assert.equal(
    record.resetActionPublicBlockers.resetFormInstanceCalled,
    false
  );
  assert.equal(record.resetActionPublicBlockers.realFormReset, false);
  assertRejectedErrorPreflightPublicBlockersFailClosed(record);
  assert.equal(
    record.publicFormActionBoundary.publicFormSubmissionReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicSubmitDispatchReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicRequestFormResetReachable,
    false
  );
  assert.equal(record.publicFormActionBoundary.actionInvoked, false);
  assert.equal(record.publicFormActionBoundary.publicActionInvoked, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.equal(
    record.publicFormActionBoundary.publicErrorRoutingReachable,
    false
  );
  assertRejectedErrorPreflightPublicBoundaryFailClosed(
    record.publicFormActionBoundary
  );
  assert.deepEqual(
    record.sideEffects,
    formActions.formActionRejectedErrorPreflightDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.sourceAsyncCallbackExecutionAccepted, true);
  assert.equal(record.sideEffects.sourceRejectedAsyncErrorAccepted, true);
  assert.equal(record.sideEffects.rejectedAsyncErrorMetadataRecorded, true);
  assert.equal(record.sideEffects.actionErrorPreflightRecorded, true);
  assert.equal(record.sideEffects.resetActionPublicBlockersRecorded, true);
  assert.equal(record.sideEffects.privateAsyncActionCallbackInvoked, false);
  assert.equal(record.sideEffects.actionInvoked, false);
  assert.equal(record.sideEffects.publicActionInvoked, false);
  assert.equal(record.sideEffects.publicErrorRoutingStarted, false);
  assert.equal(record.sideEffects.reactUpdateQueued, false);
  assert.equal(record.sideEffects.realFormReset, false);

  const error =
    formActions.createUnsupportedFormActionRejectedErrorPreflightError(record);
  assert.equal(
    error.code,
    formActions.privateFormActionRejectedErrorPreflightGateErrorCode
  );
  assert.equal(error.preflightId, record.preflightId);
  assert.deepEqual(
    error.rejectedAsyncActionError,
    record.rejectedAsyncActionError
  );
  assert.deepEqual(
    error.resetActionPublicBlockers,
    record.resetActionPublicBlockers
  );
  assert.match(
    error.message,
    /private form action rejected-error preflight records rejected action error metadata only/u
  );

  assert.throws(
    () =>
      preflightGate.recordRejectedErrorPreflight(rejectedExecution, {
        explicitFormActionRejectedErrorPreflight: true
      }),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source rejected async callback execution was already consumed by this preflight gate'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          sourceAsyncCallbackExecutionId: rejectedExecution.executionId
        }),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source rejected async callback execution was already consumed by a rejected-error preflight gate'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(
          {
            ...rejectedExecution,
            callbackExecution: {
              ...rejectedExecution.callbackExecution
            }
          },
          {
            explicitFormActionRejectedErrorPreflight: true
          }
        ),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source async callback execution must be an accepted rejected fake callback execution'
    }
  );

  const fulfilledExecution =
    await formActions
      .createFormActionAsyncCallbackExecutionDiagnosticGate({
        requestIdPrefix: 'rejected-error-fulfilled-source'
      })
      .recordAsyncCallbackExecution(scenario.preflight, {
        explicitFormActionAsyncCallbackExecution: true,
        async asyncActionCallback() {
          return 'ok';
        }
      });
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(fulfilledExecution, {
          explicitFormActionRejectedErrorPreflight: true
        }),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source async callback execution must be an accepted rejected fake callback execution'
    }
  );

  const syncThrowExecution =
    await formActions
      .createFormActionAsyncCallbackExecutionDiagnosticGate({
        requestIdPrefix: 'rejected-error-sync-throw-source'
      })
      .recordAsyncCallbackExecution(scenario.preflight, {
        explicitFormActionAsyncCallbackExecution: true,
        asyncActionCallback() {
          throw new Error('private rejected action sync throw');
        }
      });
  assert.equal(syncThrowExecution.callbackExecution.synchronousThrow, true);
  assert.equal(syncThrowExecution.callbackExecution.rejected, false);
  assert.equal(syncThrowExecution.callbackExecution.failClosed, true);
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(syncThrowExecution, {
          explicitFormActionRejectedErrorPreflight: true
        }),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source async callback execution must be an accepted rejected fake callback execution'
    }
  );

  const nonThenableExecution =
    await formActions
      .createFormActionAsyncCallbackExecutionDiagnosticGate({
        requestIdPrefix: 'rejected-error-non-thenable-source'
      })
      .recordAsyncCallbackExecution(scenario.preflight, {
        explicitFormActionAsyncCallbackExecution: true,
        asyncActionCallback() {
          return 'sync-result';
        }
      });
  assert.equal(nonThenableExecution.callbackExecution.nonThenable, true);
  assert.equal(nonThenableExecution.callbackExecution.rejected, false);
  assert.equal(nonThenableExecution.callbackExecution.failClosed, true);
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(nonThenableExecution, {
          explicitFormActionRejectedErrorPreflight: true
        }),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source async callback execution must be an accepted rejected fake callback execution'
    }
  );

  let blockedCallbackCalls = 0;
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          asyncActionCallback() {
            blockedCallbackCalls++;
          }
        }),
    {
      code:
        formActions
          .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'asyncActionCallback must not be passed to the rejected-error preflight gate'
    }
  );
  assert.equal(blockedCallbackCalls, 0);

  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          sourceAsyncCallbackExecutionId: 'stale-rejected-execution'
        }),
    {
      code:
        formActions
          .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'sourceAsyncCallbackExecutionId must match the rejected async callback execution record'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          publicDispatchRequested: true
        }),
    {
      code:
        formActions
          .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'public submit dispatch must remain blocked'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          publicErrorRoutingRequested: true
        }),
    {
      code:
        formActions
          .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'public error routing must remain blocked'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          actionInvocationRequested: true
        }),
    {
      code:
        formActions
          .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'action invocation must remain blocked'
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          publicRequestFormResetRequested: true
        }),
    {
      code:
        formActions
          .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'public reset request must remain blocked'
    }
  );
  for (const {field, reason} of [
    {
      field: 'publicSubmitDispatchRequested',
      reason: 'public submit dispatch must remain blocked'
    },
    {
      field: 'publicSubmitDispatchReachable',
      reason: 'public submit dispatch must remain blocked'
    },
    {
      field: 'publicFormSubmissionRequested',
      reason: 'public form submission must remain blocked'
    },
    {
      field: 'publicFormSubmissionReachable',
      reason: 'public form submission must remain blocked'
    },
    {
      field: 'publicActionInvocationRequested',
      reason: 'action invocation must remain blocked'
    },
    {
      field: 'publicActionInvocationReachable',
      reason: 'action invocation must remain blocked'
    },
    {
      field: 'publicRequestFormResetReachable',
      reason: 'public reset request must remain blocked'
    },
    {
      field: 'reactUpdate',
      reason: 'reactUpdate must not be passed to the rejected-error preflight gate'
    },
    {
      field: 'updateQueue',
      reason: 'updateQueue must not be passed to the rejected-error preflight gate'
    },
    {
      field: 'domMutationRequested',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'publicDomMutationRequested',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'domMutation',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'publicDomMutationEnabled',
      reason: 'DOM mutation must remain blocked'
    },
    {
      field: 'compatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    },
    {
      field: 'publicFormActionCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    },
    {
      field: 'packageCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    },
    {
      field: 'publicPackageCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    },
    {
      field: 'packageExportCompatibilityClaimed',
      reason: 'package compatibility must remain unclaimed'
    }
  ]) {
    assert.throws(
      () =>
        formActions
          .createFormActionRejectedErrorPreflightDiagnosticGate()
          .recordRejectedErrorPreflight(rejectedExecution, {
            explicitFormActionRejectedErrorPreflight: true,
            [field]: true
          }),
      {
        code:
          formActions
            .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
        compatibilityTarget,
        reason
      },
      field
    );
  }
  assert.throws(
    () =>
      formActions.createUnsupportedFormActionRejectedErrorPreflightError({}),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private form action rejected-error preflight blocks public submit dispatch directly', async () => {
  const scenario = createPrivateFormActionCallbackPreflightScenario(
    'rejected-error-submit-dispatch-blocker'
  );
  const rejectedExecution =
    await formActions
      .createFormActionAsyncCallbackExecutionDiagnosticGate({
        requestIdPrefix: 'rejected-error-submit-dispatch-async-execution'
      })
      .recordAsyncCallbackExecution(scenario.preflight, {
        explicitFormActionAsyncCallbackExecution: true,
        async asyncActionCallback() {
          throw new Error('public submit dispatch blocked');
        }
      });
  const record =
    formActions
      .createFormActionRejectedErrorPreflightDiagnosticGate({
        requestIdPrefix: 'rejected-error-submit-dispatch-preflight'
      })
      .recordRejectedErrorPreflight(rejectedExecution, {
        explicitFormActionRejectedErrorPreflight: true,
        sourceAsyncCallbackExecutionId: rejectedExecution.executionId
      });

  assert.equal(
    record.resetActionPublicBlockers.publicSubmitDispatchReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicSubmitDispatchReachable,
    false
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          publicDispatchRequested: true
        }),
    {
      code:
        formActions
          .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'public submit dispatch must remain blocked'
    }
  );
});

test('private form rejected-error fake metadata negative matrix stays fail-closed after accepted preflight', async () => {
  const {
    rejectedExecution
  } = await createPrivateRejectedFormActionAsyncExecution(
    'rejected-error-fake-metadata-negative',
    'private fake metadata negative matrix boom'
  );
  const preflightGate =
    formActions.createFormActionRejectedErrorPreflightDiagnosticGate({
      requestIdPrefix: 'rejected-error-fake-metadata-negative-preflight'
    });
  const record = preflightGate.recordRejectedErrorPreflight(
    rejectedExecution,
    {
      explicitFormActionRejectedErrorPreflight: true,
      sourceAsyncCallbackExecutionId: rejectedExecution.executionId
    }
  );

  assert.equal(
    record.acceptedMetadataIds.asyncCallbackExecutionId,
    record.sourceAsyncCallbackExecutionId
  );
  assert.equal(
    record.acceptedMetadataIds.callbackActionPreflightId,
    record.sourceCallbackActionPreflightId
  );
  assert.equal(
    record.acceptedMetadataIds.submitDispatchId,
    record.sourceSubmitDispatchId
  );
  assert.equal(
    record.acceptedMetadataIds.submitResetExecutionId,
    record.sourceSubmitResetExecutionId
  );
  assert.equal(
    record.acceptedMetadataIds.resetIntentRequestId,
    record.sourceResetIntentRequestId
  );
  assert.equal(record.rejectedAsyncActionError.rawErrorCaptured, false);
  assert.equal(record.rejectedAsyncActionError.errorObjectExposed, false);
  assert.equal(
    record.rejectedAsyncActionError.publicErrorRoutingStarted,
    false
  );
  assert.equal(record.actionErrorPreflight.rootErrorUpdateScheduled, false);
  assert.equal(
    record.actionErrorPreflight.publicRootErrorCallbackInvoked,
    false
  );
  assertRejectedErrorPreflightPublicBlockersFailClosed(record);
  assertRejectedErrorPreflightPublicBoundaryFailClosed(
    record.publicFormActionBoundary
  );

  for (const value of [
    rejectedExecution,
    rejectedExecution.acceptedMetadataIds,
    rejectedExecution.callbackExecution,
    record,
    record.acceptedMetadataIds,
    record.admission,
    record.sourceAsyncCallbackExecution,
    record.rejectedAsyncActionError,
    record.actionErrorPreflight,
    record.resetActionPublicBlockers,
    record.publicFormActionBoundary
  ]) {
    assert.equal(Object.isFrozen(value), true);
  }

  for (const mutate of [
    () => {
      rejectedExecution.sourceSubmitDispatchId = 'stale-submit-dispatch';
    },
    () => {
      rejectedExecution.callbackExecution.rejected = false;
    },
    () => {
      record.acceptedMetadataIds.submitDispatchId =
        'wrong-submit-dispatch';
    },
    () => {
      record.resetActionPublicBlockers.publicSubmitDispatchReachable =
        true;
    },
    () => {
      record.resetActionPublicBlockers.publicRequestFormResetReachable =
        true;
    },
    () => {
      record.publicFormActionBoundary.publicFormActionsEnabled = true;
    },
    () => {
      record.rejectedAsyncActionError.publicErrorRoutingStarted = true;
    },
    () => {
      record.actionErrorPreflight.publicRootErrorCallbackInvoked = true;
    }
  ]) {
    assert.throws(mutate, TypeError);
  }

  const tamperedExecution = {
    ...rejectedExecution,
    sourceSubmitDispatchId: 'wrong-submit-dispatch',
    callbackExecution: {
      ...rejectedExecution.callbackExecution,
      rejected: false
    }
  };
  assert.equal(
    formActions.isPrivateFormActionAsyncCallbackExecutionRecord(
      tamperedExecution
    ),
    false
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(tamperedExecution, {
          explicitFormActionRejectedErrorPreflight: true
        }),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget,
      reason:
        'source async callback execution must be an accepted rejected fake callback execution'
    }
  );

  let callbackCalls = 0;
  const negativeAdmissions = [
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        sourceAsyncCallbackExecutionId: 'stale-async-execution'
      },
      reason:
        'sourceAsyncCallbackExecutionId must match the rejected async callback execution record'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        asyncActionCallback() {
          callbackCalls++;
        }
      },
      reason:
        'asyncActionCallback must not be passed to the rejected-error preflight gate'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        form: throwingProxy('rejected-error form')
      },
      reason: 'form must not be passed to the rejected-error preflight gate'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        publicDispatchRequested: true
      },
      reason: 'public submit dispatch must remain blocked'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        publicSubmitDispatchRequested: true
      },
      reason: 'public submit dispatch must remain blocked'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        publicRequestFormResetRequested: true
      },
      reason: 'public reset request must remain blocked'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        publicErrorRoutingRequested: true
      },
      reason: 'public error routing must remain blocked'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        domMutationRequested: true
      },
      reason: 'DOM mutation must remain blocked'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        packageCompatibilityClaimed: true
      },
      reason: 'package compatibility must remain unclaimed'
    },
    {
      admission: {
        explicitFormActionRejectedErrorPreflight: true,
        publicFormActionCompatibilityClaimed: true
      },
      reason: 'package compatibility must remain unclaimed'
    }
  ];

  for (const {admission, reason} of negativeAdmissions) {
    assert.throws(
      () =>
        formActions
          .createFormActionRejectedErrorPreflightDiagnosticGate()
          .recordRejectedErrorPreflight(rejectedExecution, admission),
      {
        code:
          formActions
            .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
        compatibilityTarget,
        reason
      },
      reason
    );
  }
  assert.equal(callbackCalls, 0);
});
