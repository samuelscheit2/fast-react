'use strict';

const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const sourceRoot = path.join(packageRoot, 'src');
const resourceFormGate = require(path.join(
  sourceRoot,
  'resource-form-gates.js'
));
const formActions = require(path.join(
  sourceRoot,
  'shared',
  'form-actions.js'
));
const propertyPayload = require(path.join(
  sourceRoot,
  'dom-host',
  'property-payload.js'
));
const rootBridge = require(path.join(sourceRoot, 'client', 'root-bridge.js'));
const componentTree = require(path.join(
  sourceRoot,
  'client',
  'component-tree.js'
));
const controlledRestoreQueue = require(path.join(
  sourceRoot,
  'client',
  'controlled-restore-queue.js'
));
const eventListener = require(path.join(
  sourceRoot,
  'events',
  'react-dom-event-listener.js'
));
const pluginEventSystem = require(path.join(
  sourceRoot,
  'events',
  'plugin-event-system.js'
));

const resourceOracle = require(path.join(
  repoRoot,
  'tests',
  'conformance',
  'oracles',
  'react-19.2.6-react-dom-resource-hints-oracle.json'
));
const formActionsOracle = require(path.join(
  repoRoot,
  'tests',
  'conformance',
  'oracles',
  'react-19.2.6-react-dom-form-actions-oracle.json'
));
const controlledInputOracle = require(path.join(
  repoRoot,
  'tests',
  'conformance',
  'oracles',
  'react-19.2.6-dom-controlled-input-oracle.json'
));

const internalsExport =
  '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE';
const unsupportedCode = 'FAST_REACT_UNIMPLEMENTED';
const compatibilityTarget = 'react-dom@19.2.6';
const placeholderVersion = '0.0.0-fast-react-dom-placeholder';
const implementedVersion = '19.2.6';
const metadataOnlySourceFiles = new Set(['src/resource-form-internals-gate.js']);

const resourceShape = oracleValue(
  resourceOracle,
  'default-node-development',
  'resource-hint-export-shape'
);
const formRootShape = oracleValue(
  formActionsOracle,
  'default-node-development',
  'root-api-descriptors'
);
const formServerRootShape = oracleValue(
  formActionsOracle,
  'react-server-production',
  'root-api-descriptors'
);

const disallowedSourcePatterns = [
  {
    id: 'resource-or-singleton-adapter',
    pattern:
      /\b(?:HostHoistable|HostSingleton|hoistable|Hoistable|singleton|Singleton|getResource|acquireResource|releaseResource|preloadResource|suspendResource|resolveSingletonInstance|acquireSingletonInstance|releaseSingletonInstance)\b/u
  },
  {
    id: 'form-action-adapter',
    pattern:
      /\b(?:requestFormReset|useFormStatus|useFormState|resetFormInstance|reset_form_instance|HostTransition|hostTransition|startHostTransition|FormData|submitter|createFormDataWithSubmitter|formState|form_state)\b/u
  },
  {
    id: 'controlled-control-adapter',
    pattern:
      /\b(?:inputValueTracking|trackValueOnNode|updateValueIfChanged|getTracker|_valueTracker|enqueueStateRestore|restoreStateIfNeeded|restoreControlledState|restoreControlledInputState|restoreControlledSelectState|restoreControlledTextareaState|initInput|updateInput|hydrateInput|validateInputProps|initSelect|updateSelect|postUpdateSelect|validateSelectProps|initTextarea|updateTextarea|hydrateTextarea|validateTextareaProps|internalPropsKey|getFiberCurrentPropsFromNode|updateFiberProps|getInstanceFromNode|ChangeEventPlugin|BeforeInputEventPlugin|SelectEventPlugin)\b/u
  }
];

test('accepted resource, form, and controlled-control oracles remain non-compatibility evidence', () => {
  assert.equal(resourceOracle.conformanceClaims.realReactDomBehaviorProbed, true);
  assert.equal(resourceOracle.conformanceClaims.fastReactComparedToReactDom, false);
  assert.equal(resourceOracle.conformanceClaims.compatibilityClaimed, false);
  assert.equal(resourceOracle.evidenceClaims.fastReactComparedToReactDom, false);

  assert.equal(formActionsOracle.conformanceClaims.realReactDomBehaviorProbed, true);
  assert.equal(
    formActionsOracle.conformanceClaims.fullClientFormActionOracleExists,
    false
  );
  assert.equal(formActionsOracle.conformanceClaims.compatibilityClaimed, false);
  assert.equal(
    formActionsOracle.evidenceClaims.fastReactComparedToReactDom,
    false
  );

  assert.equal(controlledInputOracle.conformanceClaims.realReactDomBehaviorProbed, true);
  assert.equal(
    controlledInputOracle.conformanceClaims.fastReactComparedToReactDom,
    false
  );
  assert.equal(controlledInputOracle.conformanceClaims.compatibilityClaimed, false);
  assert.equal(controlledInputOracle.evidenceClaims.browserNativeDomUsed, false);
  assert.equal(
    controlledInputOracle.evidenceClaims.deterministicFakeDomSubstrateUsed,
    true
  );
});

test('private resource/form internals gate records deterministic unsupported metadata only', () => {
  const first = createPrivateGateScenario();
  const second = createPrivateGateScenario();

  assert.deepEqual(first.records, second.records);
  assert.deepEqual(first.summary, second.summary);

  for (const record of first.records) {
    assert.equal(Object.isFrozen(record), true, record.requestType);
    assert.equal(
      resourceFormGate.isPrivateResourceFormActionGateRecord(record),
      true,
      record.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateResourceFormActionGateRecordPayload(record),
      record,
      record.requestType
    );
    assert.equal(record.status, resourceFormGate.unsupportedStatus);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.deepEqual(record.sideEffects, resourceFormGate.noSideEffects);
    assert.equal(record.sideEffects.resourcesDispatched, false);
    assert.equal(record.sideEffects.singletonsResolved, false);
    assert.equal(record.sideEffects.formsSubmitted, false);
    assert.equal(record.sideEffects.formsReset, false);
    assert.equal(record.sideEffects.controlsTracked, false);
    assert.equal(record.sideEffects.publicRootTouched, false);
    assert.equal(record.sideEffects.compatibilityClaimed, false);
  }

  assert.deepEqual(
    first.records.map((record) => ({
      argumentInfo: record.argumentInfo,
      behaviorArea: record.behaviorArea,
      contractId: record.contractId,
      hostTag: record.hostTag,
      oracleKind: record.oracleKind,
      privateDispatcherKey: record.privateDispatcherKey,
      publicName: record.publicName,
      requestId: record.requestId,
      requestName: record.requestName,
      requestSequence: record.requestSequence,
      requestType: record.requestType
    })),
    [
      {
        argumentInfo: {
          count: 2,
          values: [
            {type: 'string', empty: false},
            {type: 'object'}
          ]
        },
        behaviorArea: 'resource-hint',
        contractId: 'preload',
        hostTag: null,
        oracleKind: 'react-19.2.6-react-dom-resource-hints-oracle',
        privateDispatcherKey: 'L',
        publicName: 'preload',
        requestId: 'gate:1',
        requestName: 'preload',
        requestSequence: 1,
        requestType: 'resource-hint.preload'
      },
      {
        argumentInfo: {
          count: 1,
          values: [{type: 'object'}]
        },
        behaviorArea: 'host-singleton',
        contractId: 'head-singleton',
        hostTag: 'head',
        oracleKind: 'react-19.2.6-react-dom-resource-hints-oracle',
        privateDispatcherKey: null,
        publicName: null,
        requestId: 'gate:2',
        requestName: 'head',
        requestSequence: 2,
        requestType: 'host-singleton.head'
      },
      {
        argumentInfo: {
          count: 1,
          values: [{type: 'object'}]
        },
        behaviorArea: 'form-action',
        contractId: 'request-form-reset',
        hostTag: null,
        oracleKind: 'react-19.2.6-react-dom-form-actions-oracle',
        privateDispatcherKey: 'r',
        publicName: 'requestFormReset',
        requestId: 'gate:3',
        requestName: 'requestFormReset',
        requestSequence: 3,
        requestType: 'form-action.requestFormReset'
      },
      {
        argumentInfo: {
          count: 1,
          values: [{type: 'object'}]
        },
        behaviorArea: 'controlled-form',
        contractId: 'input-controlled-value',
        hostTag: 'input',
        oracleKind: 'react-19.2.6-dom-controlled-input-oracle',
        privateDispatcherKey: null,
        publicName: null,
        requestId: 'gate:4',
        requestName: 'input',
        requestSequence: 4,
        requestType: 'controlled-form.input'
      }
    ]
  );

  assert.equal(first.summary.compatibilityTarget, compatibilityTarget);
  assert.equal(first.summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(first.summary.unsupportedCode, unsupportedCode);
  assert.deepEqual(first.summary.sideEffects, resourceFormGate.noSideEffects);
  assert.deepEqual(
    first.summary.oracleEvidence.map((evidence) => ({
      compatibilityClaimed: evidence.compatibilityClaimed,
      fastReactComparedToReactDom: evidence.fastReactComparedToReactDom,
      oracleKind: evidence.oracleKind
    })),
    [
      {
        compatibilityClaimed: false,
        fastReactComparedToReactDom: false,
        oracleKind: 'react-19.2.6-react-dom-resource-hints-oracle'
      },
      {
        compatibilityClaimed: false,
        fastReactComparedToReactDom: false,
        oracleKind: 'react-19.2.6-react-dom-form-actions-oracle'
      },
      {
        compatibilityClaimed: false,
        fastReactComparedToReactDom: false,
        oracleKind: 'react-19.2.6-dom-controlled-input-oracle'
      }
    ]
  );
});

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

test('private controlled input value-tracker gate records deterministic metadata only', () => {
  const first = createPrivateControlledValueTrackerScenario();
  const second = createPrivateControlledValueTrackerScenario();

  assert.deepEqual(first.records, second.records);
  assert.deepEqual(first.summary, second.summary);

  for (const record of first.records) {
    assert.equal(Object.isFrozen(record), true, record.scenarioId);
    assert.equal(
      resourceFormGate.isPrivateControlledInputValueTrackerRecord(record),
      true,
      record.scenarioId
    );
    assert.equal(
      resourceFormGate.getPrivateControlledInputValueTrackerRecordPayload(
        record
      ),
      record,
      record.scenarioId
    );
    assert.equal(record.status, resourceFormGate.unsupportedStatus);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.deepEqual(
      record.sideEffects,
      resourceFormGate.controlledInputValueTrackerSideEffects
    );
    assert.equal(record.sideEffects.controlsTracked, false);
    assert.equal(record.sideEffects.trackerAttached, false);
    assert.equal(record.sideEffects.hostValueRead, false);
    assert.equal(record.sideEffects.hostValueWritten, false);
    assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
    assert.equal(record.sideEffects.changeEventsObserved, false);
    assert.equal(record.sideEffects.postEventRestoreQueued, false);
    assert.equal(
      record.sideEffects.publicControlledBehaviorEnabled,
      false
    );
    assert.equal(record.sideEffects.publicRootTouched, false);
    assert.equal(record.sideEffects.compatibilityClaimed, false);
    assert.equal(record.trackerMetadata.deterministicMetadataOnly, true);
    assert.equal(record.trackerMetadata.liveHostNodeRequired, false);
    assert.equal(record.trackerMetadata.rawTargetCaptured, false);
    assert.equal(record.trackerMetadata.trackerAttached, false);
    assert.equal(record.trackerMetadata.currentValueSnapshot, null);
    assert.equal(record.postEventRestoreBoundary.latestPropsLookup, false);
    assert.equal(record.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(record.postEventRestoreBoundary.restoreFlushed, false);
    assert.equal(
      record.publicControlledBehaviorBoundary.rootRenderReachable,
      false
    );
    assert.equal(
      record.publicControlledBehaviorBoundary.hostWrapperWrites,
      false
    );
    assert.equal(
      record.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
  }

  assert.deepEqual(
    first.records.map((record) => ({
      requestId: record.requestId,
      requestSequence: record.requestSequence,
      scenarioId: record.scenarioId,
      phaseId: record.phaseId,
      hostTag: record.hostTag,
      inputType: record.inputType,
      multiple: record.multiple,
      controlKind: record.controlKind,
      contractId: record.contractId,
      trackerMetadata: {
        trackedField: record.trackerMetadata.trackedField,
        valueKind: record.trackerMetadata.valueKind,
        expectedPropKeys: record.trackerMetadata.expectedPropKeys,
        observedPropKeys: record.trackerMetadata.observedPropKeys,
        propSummary: record.trackerMetadata.propSummary
      }
    })),
    [
      {
        requestId: 'tracker-gate:1',
        requestSequence: 1,
        scenarioId: 'input-text-controlled-value-update',
        phaseId: 'initial',
        hostTag: 'input',
        inputType: 'text',
        multiple: false,
        controlKind: 'value',
        contractId: 'input-value-tracker',
        trackerMetadata: {
          trackedField: 'value',
          valueKind: 'string-current-value',
          expectedPropKeys: ['type', 'value', 'defaultValue', 'onChange'],
          observedPropKeys: ['type', 'value', 'onChange'],
          propSummary: {
            type: {present: true, value: {type: 'string', empty: false}},
            value: {present: true, value: {type: 'string', empty: false}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      },
      {
        requestId: 'tracker-gate:2',
        requestSequence: 2,
        scenarioId: 'checkbox-controlled-checked-update',
        phaseId: 'initial',
        hostTag: 'input',
        inputType: 'checkbox',
        multiple: false,
        controlKind: 'checked',
        contractId: 'input-checked-tracker',
        trackerMetadata: {
          trackedField: 'checked',
          valueKind: 'boolean-string-current-value',
          expectedPropKeys: ['type', 'checked', 'defaultChecked', 'onChange'],
          observedPropKeys: ['type', 'checked', 'onChange'],
          propSummary: {
            type: {present: true, value: {type: 'string', empty: false}},
            checked: {present: true, value: {type: 'boolean'}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      },
      {
        requestId: 'tracker-gate:3',
        requestSequence: 3,
        scenarioId: 'select-single-controlled-update',
        phaseId: 'initial',
        hostTag: 'select',
        inputType: null,
        multiple: false,
        controlKind: 'single',
        contractId: 'select-single-value-tracker',
        trackerMetadata: {
          trackedField: 'selectedOptions',
          valueKind: 'single-option-value',
          expectedPropKeys: ['value', 'defaultValue', 'onChange'],
          observedPropKeys: ['value', 'onChange'],
          propSummary: {
            value: {present: true, value: {type: 'string', empty: false}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      },
      {
        requestId: 'tracker-gate:4',
        requestSequence: 4,
        scenarioId: 'select-multiple-controlled-update',
        phaseId: 'update',
        hostTag: 'select',
        inputType: null,
        multiple: true,
        controlKind: 'multiple',
        contractId: 'select-multiple-value-tracker',
        trackerMetadata: {
          trackedField: 'selectedOptions',
          valueKind: 'array-option-values',
          expectedPropKeys: [
            'multiple',
            'value',
            'defaultValue',
            'onChange'
          ],
          observedPropKeys: ['multiple', 'value', 'onChange'],
          propSummary: {
            multiple: {present: true, value: {type: 'boolean'}},
            value: {present: true, value: {type: 'object'}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      },
      {
        requestId: 'tracker-gate:5',
        requestSequence: 5,
        scenarioId: 'textarea-controlled-value-update',
        phaseId: 'initial',
        hostTag: 'textarea',
        inputType: null,
        multiple: false,
        controlKind: 'value',
        contractId: 'textarea-value-tracker',
        trackerMetadata: {
          trackedField: 'value',
          valueKind: 'string-current-value',
          expectedPropKeys: [
            'value',
            'defaultValue',
            'children',
            'onChange'
          ],
          observedPropKeys: ['value', 'onChange'],
          propSummary: {
            value: {present: true, value: {type: 'string', empty: false}},
            onChange: {present: true, value: {type: 'function'}}
          }
        }
      }
    ]
  );

  assert.equal(
    first.summary.gateId,
    resourceFormGate.controlledInputValueTrackerGateId
  );
  assert.equal(first.summary.compatibilityTarget, compatibilityTarget);
  assert.equal(first.summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(first.summary.unsupportedCode, unsupportedCode);
  assert.deepEqual(
    first.summary.sideEffects,
    resourceFormGate.controlledInputValueTrackerSideEffects
  );
  assert.deepEqual(
    first.summary.oracleCoverage,
    [
      {
        hostTag: 'input',
        scenarioCount: 12,
        trackedFields: ['value', 'checked'],
        compatibilityClaimed: false
      },
      {
        hostTag: 'select',
        scenarioCount: 6,
        trackedFields: ['selectedOptions'],
        compatibilityClaimed: false
      },
      {
        hostTag: 'textarea',
        scenarioCount: 7,
        trackedFields: ['value'],
        compatibilityClaimed: false
      }
    ]
  );
});

test('private controlled input fake-DOM value-tracker diagnostic installs observes and detaches record state only', () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'fake-tracker'
  });
  const fakeInput = createControlledInputFakeDomTarget({
    value: 'alpha'
  });
  const descriptorBefore = Object.getOwnPropertyDescriptor(fakeInput, 'value');
  const install = gate.installFakeDomTracker(
    {
      scenarioId: 'input-text-controlled-value-fake-dom-diagnostic',
      phaseId: 'diagnostic',
      hostTag: 'input',
      inputType: 'text',
      props: {
        type: 'text',
        value: 'alpha',
        onChange() {}
      }
    },
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'fake-input-diagnostic',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: fakeInput
    }
  );

  fakeInput.value = 'beta';
  const observe = gate.observeFakeDomTracker(install);
  const detach = gate.detachFakeDomTracker(observe);
  const records = [install, observe, detach];
  const summary =
    resourceFormGate.describeControlledInputValueTrackerFakeDomDiagnosticGate();

  for (const record of records) {
    assert.equal(Object.isFrozen(record), true, record.operation);
    assert.equal(
      resourceFormGate.isPrivateControlledInputValueTrackerFakeDomDiagnosticRecord(
        record
      ),
      true,
      record.operation
    );
    assert.equal(
      resourceFormGate.getPrivateControlledInputValueTrackerFakeDomDiagnosticRecordPayload(
        record
      ),
      record,
      record.operation
    );
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.trackerRecord.fakeDomOnly, true);
    assert.equal(record.trackerRecord.fakeTargetCaptured, false);
    assert.equal(record.trackerRecord.realDomNodeTouched, false);
    assert.equal(record.trackerRecord.propertyDescriptorInstalled, false);
    assert.equal(record.sideEffects.hostValueRead, false);
    assert.equal(record.sideEffects.hostValueWritten, false);
    assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
    assert.equal(record.sideEffects.changeEventsObserved, false);
    assert.equal(record.sideEffects.postEventRestoreQueued, false);
    assert.equal(record.sideEffects.publicControlledBehaviorEnabled, false);
    assert.equal(record.sideEffects.publicRootTouched, false);
    assert.equal(record.sideEffects.compatibilityClaimed, false);
    assert.equal(record.sideEffects.fakeDomValueWritten, false);
    assert.equal(record.sideEffects.fakeDomDescriptorInstalled, false);
    assert.equal(record.sideEffects.fakeDomTargetCaptured, false);
    assert.equal(record.sideEffects.realDomNodeTouched, false);
    assert.equal(record.trackerMetadata.deterministicFakeDomOnly, true);
    assert.equal(record.trackerMetadata.liveHostNodeRequired, false);
    assert.equal(record.trackerMetadata.rawTargetCaptured, false);
    assert.equal(record.trackerMetadata.realDomNodeTouched, false);
    assert.equal(record.trackerMetadata.propertyDescriptorInstalled, false);
    assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(
      record.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
  }

  assert.deepEqual(
    records.map((record) => ({
      requestId: record.requestId,
      requestSequence: record.requestSequence,
      lifecycleId: record.lifecycleId,
      operation: record.operation,
      status: record.status,
      attachedBefore: record.trackerRecord.attachedBefore,
      attachedAfter: record.trackerRecord.attachedAfter,
      changed: record.trackerRecord.changed,
      observedCount: record.trackerRecord.observedCount,
      previousValueSnapshot: record.trackerRecord.previousValueSnapshot,
      currentValueSnapshot: record.trackerRecord.currentValueSnapshot,
      fakeDomTrackerRecordInstalled:
        record.sideEffects.fakeDomTrackerRecordInstalled,
      fakeDomTrackerRecordObserved:
        record.sideEffects.fakeDomTrackerRecordObserved,
      fakeDomTrackerRecordDetached:
        record.sideEffects.fakeDomTrackerRecordDetached,
      fakeDomValueRead: record.sideEffects.fakeDomValueRead,
      trackerAttached: record.trackerMetadata.trackerAttached
    })),
    [
      {
        requestId: 'fake-tracker:1',
        requestSequence: 1,
        lifecycleId: 'fake-tracker:1',
        operation: 'install',
        status:
          resourceFormGate.controlledInputValueTrackerFakeDomInstalledStatus,
        attachedBefore: false,
        attachedAfter: true,
        changed: false,
        observedCount: 0,
        previousValueSnapshot: null,
        currentValueSnapshot: 'alpha',
        fakeDomTrackerRecordInstalled: true,
        fakeDomTrackerRecordObserved: false,
        fakeDomTrackerRecordDetached: false,
        fakeDomValueRead: true,
        trackerAttached: true
      },
      {
        requestId: 'fake-tracker:2',
        requestSequence: 2,
        lifecycleId: 'fake-tracker:1',
        operation: 'observe',
        status:
          resourceFormGate.controlledInputValueTrackerFakeDomObservedStatus,
        attachedBefore: true,
        attachedAfter: true,
        changed: true,
        observedCount: 1,
        previousValueSnapshot: 'alpha',
        currentValueSnapshot: 'beta',
        fakeDomTrackerRecordInstalled: false,
        fakeDomTrackerRecordObserved: true,
        fakeDomTrackerRecordDetached: false,
        fakeDomValueRead: true,
        trackerAttached: true
      },
      {
        requestId: 'fake-tracker:3',
        requestSequence: 3,
        lifecycleId: 'fake-tracker:1',
        operation: 'detach',
        status:
          resourceFormGate.controlledInputValueTrackerFakeDomDetachedStatus,
        attachedBefore: true,
        attachedAfter: false,
        changed: false,
        observedCount: 1,
        previousValueSnapshot: 'beta',
        currentValueSnapshot: 'beta',
        fakeDomTrackerRecordInstalled: false,
        fakeDomTrackerRecordObserved: false,
        fakeDomTrackerRecordDetached: true,
        fakeDomValueRead: false,
        trackerAttached: false
      }
    ]
  );

  assert.equal(install.admission.adapterId, 'fake-input-diagnostic');
  assert.equal(install.admission.rawTargetCaptured, false);
  assert.equal(install.admission.propertyDescriptorInstallationAllowed, false);
  assert.equal(observe.admission, null);
  assert.equal(detach.admission, null);
  assert.equal(Object.hasOwn(fakeInput, '_valueTracker'), false);
  assert.equal(descriptorBefore.get, undefined);
  assert.equal(descriptorBefore.set, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, 'value').get,
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, 'value').set,
    undefined
  );
  assert.equal(
    summary.gateId,
    resourceFormGate.controlledInputValueTrackerFakeDomDiagnosticGateId
  );
  assert.equal(
    summary.status,
    resourceFormGate.controlledInputValueTrackerFakeDomDiagnosticStatus
  );
  assert.deepEqual(summary.acceptedOperations, ['install', 'observe', 'detach']);
  assert.equal(summary.deterministicFakeDomOnly, true);
  assert.equal(summary.liveDomDescriptorInstallation, false);
  assert.equal(summary.realDomNodeAccepted, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.controlledInputValueTrackerFakeDomDiagnosticNoSideEffects
  );
  assert.throws(() => gate.observeFakeDomTracker(install), {
    code:
      resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInactiveRecordCode,
    compatibilityTarget
  });
});

test('private controlled input restore queue diagnostic records fake-DOM observation intent only', () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'fake-restore'
  });
  const fakeInput = createControlledInputFakeDomTarget({
    value: 'alpha'
  });
  const descriptorBefore = Object.getOwnPropertyDescriptor(fakeInput, 'value');
  const install = gate.installFakeDomTracker(
    {
      scenarioId: 'input-text-controlled-value-update',
      phaseId: 'update',
      hostTag: 'input',
      inputType: 'text',
      props: {
        type: 'text',
        value: 'alpha',
        onChange() {}
      }
    },
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'fake-input-restore-diagnostic',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: fakeInput
    }
  );

  fakeInput.value = 'beta';
  const changedObservation = gate.observeFakeDomTracker(install);
  const changedIntent =
    gate.recordPostEventRestoreIntentFromFakeDomObservation(
      changedObservation,
      {
        explicitAdmission: true,
        queueKind: 'deterministic-fake-dom-post-event-restore-queue',
        queueId: 'fake-input-restore-queue',
        eventName: 'input',
        targetKind: 'controlled-input-restore-queue'
      }
    );
  const unchangedObservation = gate.observeFakeDomTracker(changedObservation);
  const unchangedIntent =
    gate.recordPostEventRestoreIntentFromFakeDomObservation(
      unchangedObservation,
      {
        explicitAdmission: true,
        queueKind: 'deterministic-fake-dom-post-event-restore-queue',
        targetKind: 'controlled-input-restore-queue'
      }
    );
  const detach = gate.detachFakeDomTracker(unchangedObservation);
  const summary =
    resourceFormGate.describeControlledInputPrivateRestoreQueueDiagnosticGate();

  assert.equal(
    propertyPayload.CONTROLLED_RESTORE_QUEUE_FAKE_DOM_DIAGNOSTIC_STATUS,
    resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticStatus
  );
  assert.deepEqual(
    [changedIntent, unchangedIntent].map((record) => ({
      requestId: record.requestId,
      requestSequence: record.requestSequence,
      sourceTrackerRequestId: record.sourceTrackerRequestId,
      sourceTrackerOperation: record.sourceTrackerOperation,
      status: record.status,
      sourceChanged: record.restoreIntent.sourceChanged,
      intentRecorded: record.restoreIntent.intentRecorded,
      restoreTargetWouldBeQueued:
        record.restoreIntent.restoreTargetWouldBeQueued,
      queuePosition: record.restoreIntent.queuePosition,
      latestPropsLookupRequired:
        record.restoreIntent.latestPropsLookupRequired,
      eventPluginDispatchRequired:
        record.restoreIntent.eventPluginDispatchRequired,
      previousValueSnapshot:
        record.trackerObservation.previousValueSnapshot,
      currentValueSnapshot: record.trackerObservation.currentValueSnapshot,
      fakeDomRestoreIntentRecorded:
        record.sideEffects.fakeDomRestoreIntentRecorded,
      fakeDomRestoreIntentSkipped:
        record.sideEffects.fakeDomRestoreIntentSkipped,
      restoreQueueRecordCreated:
        record.sideEffects.restoreQueueRecordCreated
    })),
    [
      {
        requestId: 'fake-restore:3',
        requestSequence: 3,
        sourceTrackerRequestId: 'fake-restore:2',
        sourceTrackerOperation: 'observe',
        status:
          resourceFormGate.controlledInputPrivateRestoreQueueIntentRecordedStatus,
        sourceChanged: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        latestPropsLookupRequired: true,
        eventPluginDispatchRequired: true,
        previousValueSnapshot: 'alpha',
        currentValueSnapshot: 'beta',
        fakeDomRestoreIntentRecorded: true,
        fakeDomRestoreIntentSkipped: false,
        restoreQueueRecordCreated: true
      },
      {
        requestId: 'fake-restore:5',
        requestSequence: 5,
        sourceTrackerRequestId: 'fake-restore:4',
        sourceTrackerOperation: 'observe',
        status:
          resourceFormGate.controlledInputPrivateRestoreQueueIntentSkippedStatus,
        sourceChanged: false,
        intentRecorded: false,
        restoreTargetWouldBeQueued: false,
        queuePosition: null,
        latestPropsLookupRequired: false,
        eventPluginDispatchRequired: false,
        previousValueSnapshot: 'beta',
        currentValueSnapshot: 'beta',
        fakeDomRestoreIntentRecorded: false,
        fakeDomRestoreIntentSkipped: true,
        restoreQueueRecordCreated: true
      }
    ]
  );

  for (const record of [changedIntent, unchangedIntent]) {
    assert.equal(Object.isFrozen(record), true, record.requestId);
    assert.equal(
      resourceFormGate.isPrivateControlledInputRestoreQueueDiagnosticRecord(
        record
      ),
      true,
      record.requestId
    );
    assert.equal(
      resourceFormGate.getPrivateControlledInputRestoreQueueDiagnosticRecordPayload(
        record
      ),
      record,
      record.requestId
    );
    assert.equal(
      record.gateId,
      resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticGateId
    );
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.trackerObservation.fakeDomOnly, true);
    assert.equal(record.trackerObservation.propertyDescriptorInstalled, false);
    assert.equal(record.trackerObservation.rawTargetCaptured, false);
    assert.equal(record.trackerObservation.realDomNodeTouched, false);
    assert.equal(record.restoreIntent.latestPropsLookupPerformed, false);
    assert.equal(record.restoreIntent.eventPluginDispatchPerformed, false);
    assert.equal(record.restoreIntent.restoreQueueWritten, false);
    assert.equal(record.restoreIntent.restoreStateIfNeededInvoked, false);
    assert.equal(record.restoreIntent.restoreControlledStateInvoked, false);
    assert.equal(record.restoreIntent.restoreFlushed, false);
    assert.equal(record.restoreIntent.rawTargetCaptured, false);
    assert.equal(record.restoreIntent.rawEventCaptured, false);
    assert.equal(record.restoreIntent.realDomNodeTouched, false);
    assert.equal(
      record.restoreIntent.publicControlledBehaviorEnabled,
      false
    );
    assert.equal(record.restoreIntent.compatibilityClaimed, false);
    assert.equal(record.postEventRestoreBoundary.latestPropsLookup, false);
    assert.equal(record.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(record.postEventRestoreBoundary.restoreFlushed, false);
    assert.equal(record.sideEffects.changeEventsObserved, false);
    assert.equal(record.sideEffects.postEventRestoreQueued, false);
    assert.equal(record.sideEffects.restoreQueueWritten, false);
    assert.equal(record.sideEffects.latestPropsLookup, false);
    assert.equal(record.sideEffects.eventPluginDispatch, false);
    assert.equal(record.sideEffects.restoreStateIfNeededInvoked, false);
    assert.equal(record.sideEffects.restoreControlledStateInvoked, false);
    assert.equal(record.sideEffects.restoreFlushed, false);
    assert.equal(record.sideEffects.hostWrapperInvoked, false);
    assert.equal(record.sideEffects.hostValueWritten, false);
    assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
    assert.equal(
      record.sideEffects.publicControlledBehaviorEnabled,
      false
    );
    assert.equal(record.sideEffects.compatibilityClaimed, false);
    assert.equal(
      record.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
  }

  assert.equal(changedIntent.admission.queueId, 'fake-input-restore-queue');
  assert.equal(changedIntent.admission.eventName, 'input');
  assert.equal(changedIntent.admission.rawTargetCaptured, false);
  assert.equal(changedIntent.admission.rawEventCaptured, false);
  assert.equal(changedIntent.admission.restoreQueueWriteAllowed, false);
  assert.equal(Object.hasOwn(fakeInput, '_valueTracker'), false);
  assert.equal(descriptorBefore.get, undefined);
  assert.equal(descriptorBefore.set, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, 'value').get,
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(fakeInput, 'value').set,
    undefined
  );
  assert.equal(detach.status, resourceFormGate.controlledInputValueTrackerFakeDomDetachedStatus);

  assert.equal(
    summary.gateId,
    resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticGateId
  );
  assert.equal(
    summary.status,
    resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticStatus
  );
  assert.equal(
    summary.acceptedSourceRecordType,
    resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticRecordType
  );
  assert.equal(summary.acceptedSourceOperation, 'observe');
  assert.equal(summary.recordsPostEventRestoreIntent, true);
  assert.equal(summary.deterministicFakeDomOnly, true);
  assert.equal(summary.writesRestoreQueue, false);
  assert.equal(summary.flushesRestoreQueue, false);
  assert.equal(summary.latestPropsLookup, false);
  assert.equal(summary.eventPluginDispatch, false);
  assert.equal(summary.liveDomDescriptorInstallation, false);
  assert.equal(summary.realDomNodeAccepted, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.controlledInputPrivateRestoreQueueDiagnosticNoSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedControlledInputRestoreQueueDiagnosticError(
      changedIntent
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateControlledInputRestoreQueueDiagnosticGateErrorCode
  );
  assert.equal(error.exportName, 'controlled-restore-queue.input');
  assert.equal(error.requestId, 'fake-restore:3');
  assert.equal(error.sourceTrackerRequestId, 'fake-restore:2');
  assert.equal(error.restoreIntent.intentRecorded, true);
  assert.deepEqual(error.sideEffects, changedIntent.sideEffects);
});

test('private controlled input post-event restore queue gate records event/latest-props intent only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'event-restore'
    });
  const controlled = createControlledInputEventDispatch({
    domEventName: 'input',
    latestProps: {
      type: 'text',
      value: 'alpha',
      onChange() {},
      onInput() {}
    },
    nodeName: 'INPUT',
    value: 'browser-mutated'
  });
  const descriptorBefore = Object.getOwnPropertyDescriptor(
    controlled.targetNode,
    'value'
  );
  const intent =
    gate.recordPostEventRestoreIntentFromEventLatestProps(
      controlled.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: 'event-latest-props-restore-queue',
        eventName: 'input',
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
  const skippedControlled = createControlledInputEventDispatch({
    domEventName: 'click',
    latestProps: {
      type: 'text',
      value: 'alpha',
      onClick() {}
    },
    nodeName: 'INPUT',
    value: 'browser-mutated'
  });
  const skipped = gate.recordPostEventRestoreIntentFromEventLatestProps(
    skippedControlled.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();

  assert.equal(
    propertyPayload.CONTROLLED_POST_EVENT_RESTORE_QUEUE_STATUS,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueStatus
  );
  assert.equal(Object.isFrozen(intent), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueRecord(
      intent
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueRecordPayload(
      intent
    ),
    intent
  );
  assert.deepEqual(
    [intent, skipped].map((record) => ({
      requestId: record.requestId,
      requestSequence: record.requestSequence,
      status: record.status,
      domEventName: record.domEventName,
      hostTag: record.hostTag,
      controlKind: record.controlKind,
      controlledPropName: record.controlledPropName,
      latestPropsEvidenceAccepted:
        record.restoreIntent.latestPropsEvidenceAccepted,
      supportedEventName: record.restoreIntent.supportedEventName,
      intentRecorded: record.restoreIntent.intentRecorded,
      restoreTargetWouldBeQueued:
        record.restoreIntent.restoreTargetWouldBeQueued,
      queuePosition: record.restoreIntent.queuePosition,
      latestPropsLookupPerformed:
        record.restoreIntent.latestPropsLookupPerformed,
      eventDispatchRecordAccepted:
        record.restoreIntent.eventDispatchRecordAccepted,
      eventPluginDispatchPerformed:
        record.restoreIntent.eventPluginDispatchPerformed,
      restoreQueueWritten: record.restoreIntent.restoreQueueWritten,
      restoreQueueWriteOrderRecorded:
        record.restoreIntent.restoreQueueWriteOrderRecorded,
      restoreQueueFlushOrderRecorded:
        record.restoreIntent.restoreQueueFlushOrderRecorded,
      acceptedRestoreKind:
        record.restoreQueueOrdering.acceptedRestoreKind,
      queueSlot: record.restoreQueueOrdering.writeOrder.queueSlot,
      flushWouldBeRequiredAfterWrite:
        record.restoreQueueOrdering.flushOrder.flushWouldBeRequiredAfterWrite,
      hostWrapperOperation:
        record.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
      controlledStateRestoreInvoked:
        record.restoreIntent.controlledStateRestoreInvoked,
      postEventRestoreIntentRecorded:
        record.sideEffects.postEventRestoreIntentRecorded,
      postEventRestoreIntentSkipped:
        record.sideEffects.postEventRestoreIntentSkipped,
      latestPropsMetadataRead: record.sideEffects.latestPropsMetadataRead
    })),
    [
      {
        requestId: 'event-restore:1',
        requestSequence: 1,
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        domEventName: 'input',
        hostTag: 'input',
        controlKind: 'value',
        controlledPropName: 'value',
        latestPropsEvidenceAccepted: true,
        supportedEventName: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        latestPropsLookupPerformed: true,
        eventDispatchRecordAccepted: true,
        eventPluginDispatchPerformed: false,
        restoreQueueWritten: false,
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: 'input-text-value',
        queueSlot: 'primary',
        flushWouldBeRequiredAfterWrite: true,
        hostWrapperOperation: 'input-value-sync',
        controlledStateRestoreInvoked: false,
        postEventRestoreIntentRecorded: true,
        postEventRestoreIntentSkipped: false,
        latestPropsMetadataRead: true
      },
      {
        requestId: 'event-restore:2',
        requestSequence: 2,
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentSkippedStatus,
        domEventName: 'click',
        hostTag: 'input',
        controlKind: 'value',
        controlledPropName: 'value',
        latestPropsEvidenceAccepted: true,
        supportedEventName: false,
        intentRecorded: false,
        restoreTargetWouldBeQueued: false,
        queuePosition: null,
        latestPropsLookupPerformed: true,
        eventDispatchRecordAccepted: true,
        eventPluginDispatchPerformed: false,
        restoreQueueWritten: false,
        restoreQueueWriteOrderRecorded: false,
        restoreQueueFlushOrderRecorded: false,
        acceptedRestoreKind: null,
        queueSlot: null,
        flushWouldBeRequiredAfterWrite: false,
        hostWrapperOperation: 'input-value-sync',
        controlledStateRestoreInvoked: false,
        postEventRestoreIntentRecorded: false,
        postEventRestoreIntentSkipped: true,
        latestPropsMetadataRead: true
      }
    ]
  );

  assert.equal(
    intent.gateId,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueGateId
  );
  assert.equal(intent.compatibilityTarget, compatibilityTarget);
  assert.equal(intent.unsupportedCode, unsupportedCode);
  assert.equal(
    intent.eventEvidence.sourceRecordKind,
    'FastReactDomEventDispatchRecord'
  );
  assert.equal(intent.eventEvidence.targetResolutionStatus, 'resolved');
  assert.equal(
    intent.eventEvidence.controlledStateRestoreBlockedReason,
    'FAST_REACT_DOM_CONTROLLED_STATE_RESTORE_BLOCKED'
  );
  assert.equal(intent.latestPropsEvidence.latestPropsStatus, 'present');
  assert.equal(intent.latestPropsEvidence.exposesLatestProps, false);
  assert.equal(intent.latestPropsEvidence.rawLatestPropsRetained, false);
  assert.deepEqual(intent.latestPropsEvidence.propKeys, [
    'type',
    'value',
    'onChange',
    'onInput'
  ]);
  assert.deepEqual(intent.latestPropsEvidence.controlledPropSummary.value, {
    present: true,
    value: {type: 'string', empty: false}
  });
  assert.equal(intent.controlledTarget.liveValueTrackerInstalled, false);
  assert.equal(intent.controlledTarget.valueTrackerFieldWritten, false);
  assert.equal(intent.controlledTarget.propertyDescriptorInstalled, false);
  assert.equal(intent.controlledTarget.hostValueRead, false);
  assert.equal(intent.controlledTarget.hostValueWritten, false);
  assert.equal(intent.restoreIntent.rawTargetCaptured, false);
  assert.equal(intent.restoreIntent.rawEventCaptured, false);
  assert.equal(intent.restoreIntent.rawLatestPropsRetained, false);
  assert.equal(
    intent.restoreQueueOrdering.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWriteFlushOrderingStatus
  );
  assert.equal(intent.restoreQueueOrdering.metadataOnly, true);
  assert.equal(intent.restoreQueueOrdering.acceptedRestoreMetadata, true);
  assert.deepEqual(intent.restoreQueueOrdering.writeOrder.writeSequence, [
    'accept-restore-metadata',
    'record-latest-props-evidence',
    'would-store-primary-restore-target',
    'would-defer-controlled-restore-until-batch-exit'
  ]);
  assert.deepEqual(intent.restoreQueueOrdering.flushOrder.flushSequence, [
    'event-batch-exit',
    'pending-restore-check',
    'synchronous-work-flush',
    'snapshot-and-clear-private-queue',
    'restore-primary-target',
    'restore-additional-targets-in-order',
    'host-wrapper-restore-dispatch'
  ]);
  assert.equal(intent.restoreQueueOrdering.actualQueueWritePerformed, false);
  assert.equal(intent.restoreQueueOrdering.actualQueueFlushPerformed, false);
  assert.equal(intent.restoreQueueOrdering.hostWrapperInvoked, false);
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperRan,
    false
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.wrapperWritePerformed,
    false
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.valueTrackerFieldWritten,
    false
  );
  assert.equal(
    intent.restoreQueueOrdering.hostWrapperOrder.browserInputMutated,
    false
  );
  assert.equal(intent.postEventRestoreBoundary.latestPropsLookup, true);
  assert.equal(intent.postEventRestoreBoundary.eventPluginDispatch, false);
  assert.equal(
    intent.postEventRestoreBoundary.restoreQueueWriteOrderRecorded,
    true
  );
  assert.equal(
    intent.postEventRestoreBoundary.restoreQueueFlushOrderRecorded,
    true
  );
  assert.equal(
    intent.postEventRestoreBoundary.hostWrapperRestoreOrderRecorded,
    true
  );
  assert.equal(intent.postEventRestoreBoundary.restoreQueued, false);
  assert.equal(intent.postEventRestoreBoundary.restoreFlushed, false);
  assert.equal(intent.sideEffects.eventDispatchRecordAccepted, true);
  assert.equal(intent.sideEffects.latestPropsEvidenceAccepted, true);
  assert.equal(intent.sideEffects.restoreQueueRecordCreated, true);
  assert.equal(intent.sideEffects.restoreQueueWritten, false);
  assert.equal(intent.sideEffects.restoreQueueFlushed, false);
  assert.equal(intent.sideEffects.controlledStateRestoreScheduled, false);
  assert.equal(intent.sideEffects.controlledStateRestoreInvoked, false);
  assert.equal(intent.sideEffects.liveValueTrackerInstalled, false);
  assert.equal(intent.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(intent.sideEffects.propertyDescriptorInstalled, false);
  assert.equal(intent.sideEffects.hostValueRead, false);
  assert.equal(intent.sideEffects.hostValueWritten, false);
  assert.equal(intent.sideEffects.browserInputMutated, false);
  assert.equal(intent.sideEffects.rawLatestPropsRetained, false);
  assert.equal(
    intent.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(controlled.targetNode, '_valueTracker'), false);
  assert.equal(descriptorBefore.get, undefined);
  assert.equal(descriptorBefore.set, undefined);
  assert.equal(
    Object.getOwnPropertyDescriptor(controlled.targetNode, 'value').get,
    undefined
  );
  assert.equal(
    Object.getOwnPropertyDescriptor(controlled.targetNode, 'value').set,
    undefined
  );

  assert.equal(
    summary.gateId,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueGateId
  );
  assert.equal(
    summary.acceptedSourceRecordType,
    'FastReactDomEventDispatchRecord'
  );
  assert.equal(summary.consumesEventDispatchEvidence, true);
  assert.equal(summary.consumesLatestPropsEvidence, true);
  assert.equal(summary.recordsRestoreQueueWriteFlushOrdering, true);
  assert.deepEqual(summary.acceptedRestoreMetadataKinds, [
    'input-text-value',
    'input-checkbox-checked',
    'input-radio-checked',
    'select-single-value',
    'select-multiple-value',
    'textarea-value'
  ]);
  assert.equal(summary.restoreQueueOrdering.recordsQueueWriteOrder, true);
  assert.equal(summary.restoreQueueOrdering.recordsQueueFlushOrder, true);
  assert.equal(summary.restoreQueueOrdering.hostWrapperInvocations, false);
  assert.equal(summary.restoreQueueOrdering.valueTrackerWrites, false);
  assert.equal(summary.restoreQueueOrdering.liveDomMutations, false);
  assert.equal(summary.installsLiveDescriptors, false);
  assert.equal(summary.writesValueTrackerField, false);
  assert.equal(summary.writesRestoreQueue, false);
  assert.equal(summary.flushesRestoreQueue, false);
  assert.equal(summary.publicControlledBehaviorEnabled, false);
  assert.deepEqual(
    summary.sideEffects,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueNoSideEffects
  );

  const error =
    controlledRestoreQueue.createUnsupportedControlledInputPostEventRestoreQueueError(
      intent
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueGateErrorCode
  );
  assert.equal(error.exportName, 'controlled-post-event-restore.input');
  assert.equal(error.requestId, 'event-restore:1');
  assert.equal(error.restoreIntent.intentRecorded, true);
  assert.deepEqual(error.sideEffects, intent.sideEffects);

  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromEventLatestProps(
        {},
        {explicitAdmission: true}
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidEventCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromEventLatestProps(
        controlled.dispatchRecord,
        {
          queueKind:
            'deterministic-event-latest-props-post-event-restore-queue'
        }
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'explicitAdmission must be true'
    }
  );

  componentTree.detachHostInstanceToken(controlled.token);
  componentTree.detachHostInstanceToken(skippedControlled.token);
});

test('private controlled checkbox and radio restore queue gate records checkable metadata only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'checkable-restore'
    });
  const rows = [
    {
      domEventName: 'click',
      latestProps: {
        type: 'checkbox',
        checked: true,
        name: 'accepted',
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'checkbox-checkable-restore'
    },
    {
      domEventName: 'click',
      latestProps: {
        type: 'radio',
        checked: true,
        name: 'choice',
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'radio-checkable-restore'
    }
  ];
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch(row);
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent};
  });

  assert.deepEqual(
    records.map(({intent}) => ({
      status: intent.status,
      inputType: intent.inputType,
      controlKind: intent.controlKind,
      trackedField: intent.trackedField,
      checkableStatus: intent.checkableRestoreMetadata.status,
      radioGroupRestoreRequired:
        intent.checkableRestoreMetadata.radioGroupRestoreRequired,
      radioGroupIntentRecorded:
        intent.checkableRestoreMetadata.radioGroupIntentRecorded,
      groupIntentStatus: intent.groupIntentRecords[0].status,
      groupKind: intent.groupIntentRecords[0].groupKind,
      skipReason: intent.groupIntentRecords[0].skipReason,
      acceptedRestoreKind:
        intent.restoreQueueOrdering.acceptedRestoreKind,
      hostWrapperOperation:
        intent.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
      primaryHostWrapperWouldRun:
        intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperWouldRun,
      primaryHostWrapperRan:
        intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperRan,
      radioGroupRestoreWouldFollowPrimaryInputRestore:
        intent.restoreQueueOrdering.hostWrapperOrder
          .radioGroupRestoreWouldFollowPrimaryInputRestore,
      radioValueTrackerRefreshWouldFollowSiblingRestore:
        intent.restoreQueueOrdering.hostWrapperOrder
          .radioValueTrackerRefreshWouldFollowSiblingRestore,
      groupLookupRequired:
        intent.groupIntentRecords[0].groupLookupRequired,
      groupLookupPerformed:
        intent.groupIntentRecords[0].groupLookupPerformed,
      siblingLatestPropsLookupPerformed:
        intent.groupIntentRecords[0].siblingLatestPropsLookupPerformed,
      siblingInputRestorePerformed:
        intent.groupIntentRecords[0].siblingInputRestorePerformed,
      valueTrackerRefreshed:
        intent.groupIntentRecords[0].valueTrackerRefreshed,
      radioGroupRestoreIntentRecorded:
        intent.sideEffects.radioGroupRestoreIntentRecorded,
      radioGroupLookupPerformed:
        intent.sideEffects.radioGroupLookupPerformed,
      radioGroupMembersEnumerated:
        intent.sideEffects.radioGroupMembersEnumerated,
      radioGroupValueTrackerRefreshed:
        intent.sideEffects.radioGroupValueTrackerRefreshed
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        inputType: 'checkbox',
        controlKind: 'checked',
        trackedField: 'checked',
        checkableStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
        radioGroupRestoreRequired: false,
        radioGroupIntentRecorded: false,
        groupIntentStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus,
        groupKind: 'single-checkable',
        skipReason: 'checkboxes-do-not-restore-radio-groups',
        acceptedRestoreKind: 'input-checkbox-checked',
        hostWrapperOperation: 'input-checked-sync',
        primaryHostWrapperWouldRun: true,
        primaryHostWrapperRan: false,
        radioGroupRestoreWouldFollowPrimaryInputRestore: false,
        radioValueTrackerRefreshWouldFollowSiblingRestore: false,
        groupLookupRequired: false,
        groupLookupPerformed: false,
        siblingLatestPropsLookupPerformed: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        radioGroupRestoreIntentRecorded: false,
        radioGroupLookupPerformed: false,
        radioGroupMembersEnumerated: false,
        radioGroupValueTrackerRefreshed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        inputType: 'radio',
        controlKind: 'checked',
        trackedField: 'checked',
        checkableStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
        radioGroupRestoreRequired: true,
        radioGroupIntentRecorded: true,
        groupIntentStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus,
        groupKind: 'radio-group',
        skipReason: null,
        acceptedRestoreKind: 'input-radio-checked',
        hostWrapperOperation: 'input-checked-sync',
        primaryHostWrapperWouldRun: true,
        primaryHostWrapperRan: false,
        radioGroupRestoreWouldFollowPrimaryInputRestore: true,
        radioValueTrackerRefreshWouldFollowSiblingRestore: true,
        groupLookupRequired: true,
        groupLookupPerformed: false,
        siblingLatestPropsLookupPerformed: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        radioGroupRestoreIntentRecorded: true,
        radioGroupLookupPerformed: false,
        radioGroupMembersEnumerated: false,
        radioGroupValueTrackerRefreshed: false
      }
    ]
  );

  for (const {dispatch, intent} of records) {
    assert.equal(intent.restoreIntent.intentRecorded, true);
    assert.equal(intent.checkableRestoreMetadata.primaryInputRestorePerformed, false);
    assert.equal(intent.checkableRestoreMetadata.checkedWritePerformed, false);
    assert.equal(intent.checkableRestoreMetadata.radioGroupLookupPerformed, false);
    assert.equal(intent.checkableRestoreMetadata.radioGroupMembersEnumerated, false);
    assert.equal(intent.checkableRestoreMetadata.radioValueTrackerRefreshed, false);
    assert.equal(intent.groupIntentRecords[0].realDomQueried, false);
    assert.equal(intent.groupIntentRecords[0].hostValueRead, false);
    assert.equal(intent.groupIntentRecords[0].hostValueWritten, false);
    assert.equal(intent.groupIntentRecords[0].browserInputMutated, false);
    assert.equal(intent.groupIntentRecords[0].rawGroupNodesCaptured, false);
    assert.equal(intent.groupIntentRecords[0].rawNameRetained, false);
    assert.equal(intent.groupIntentRecords[0].compatibilityClaimed, false);
    assert.equal(
      intent.restoreQueueOrdering.writeOrder.restoreQueueWritten,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.flushOrder.restoreQueueFlushed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.wrapperWritePerformed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.radioGroupLookupPerformed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.radioValueTrackerRefreshed,
      false
    );
    assert.equal(intent.sideEffects.hostValueRead, false);
    assert.equal(intent.sideEffects.hostValueWritten, false);
    assert.equal(intent.sideEffects.browserInputMutated, false);
    assert.equal(intent.sideEffects.publicControlledBehaviorEnabled, false);
    assert.equal(intent.sideEffects.compatibilityClaimed, false);
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
});

test('private controlled radio sibling-props lookup diagnostics stay metadata-only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'radio-sibling-props'
    });
  const latestProps = {
    type: 'radio',
    name: 'choice',
    checked: true,
    onChange() {},
    onClick() {}
  };
  const dispatch = createControlledInputEventDispatch({
    domEventName: 'click',
    latestProps,
    nodeName: 'INPUT'
  });
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    dispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'radio-sibling-props-restore',
      eventName: 'click',
      targetKind: 'controlled-input-post-event-restore-queue',
      radioGroupFormKey: 'form:checkout',
      radioGroupSiblingProps: [
        {
          formKey: 'form:checkout',
          props: {
            type: 'radio',
            name: 'choice',
            checked: false,
            defaultChecked: false,
            value: 'card',
            onChange() {}
          }
        },
        {
          formKey: 'form:other',
          props: {
            type: 'radio',
            name: 'choice',
            checked: false,
            onChange() {}
          }
        },
        {
          formKey: 'form:checkout',
          props: {
            type: 'radio',
            name: 'shipping',
            checked: false,
            onChange() {}
          }
        },
        {
          formKey: 'form:checkout',
          isPrimary: true,
          props: latestProps
        }
      ]
    }
  );
  const lookup = intent.radioGroupSiblingPropsLookup;
  const groupIntent = intent.groupIntentRecords[0];

  assert.equal(Object.isFrozen(lookup), true);
  assert.equal(Object.isFrozen(lookup.records), true);
  for (const record of lookup.records) {
    assert.equal(Object.isFrozen(record), true);
    assert.equal(Object.isFrozen(record.nameProp), true);
    assert.equal(Object.isFrozen(record.controlledPropSummary), true);
  }
  assert.deepEqual(intent.admission.radioGroupSiblingPropsEvidence, {
    provided: true,
    candidateCount: 4,
    primaryFormKeyStatus: {present: true, empty: false},
    deterministicMetadataOnly: true,
    propsRedacted: true,
    rawSiblingPropsRetained: false,
    rawFormRetained: false,
    livePropsLookupAllowed: false,
    formTraversalAllowed: false,
    wrapperExecutionAllowed: false
  });
  assert.equal(
    lookup.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsLookupRecordedStatus
  );
  assert.equal(lookup.groupRestoreRequired, true);
  assert.equal(lookup.groupRestoreIntentRecorded, true);
  assert.equal(lookup.candidateCount, 4);
  assert.equal(lookup.acceptedSameNameSameFormCount, 1);
  assert.equal(lookup.acceptedSiblingPropsEvidenceCount, 1);
  assert.equal(lookup.skippedCandidateCount, 3);
  assert.deepEqual(
    lookup.records.map((record) => ({
      status: record.status,
      targetRole: record.targetRole,
      hostTag: record.hostTag,
      inputType: record.inputType,
      sameName: record.sameName,
      sameForm: record.sameForm,
      sameTarget: record.sameTarget,
      skipReason: record.skipReason,
      siblingWouldReceiveRestore: record.siblingWouldReceiveRestore,
      siblingLatestPropsLookupPerformed:
        record.siblingLatestPropsLookupPerformed,
      livePropsLookupPerformed: record.livePropsLookupPerformed,
      formTraversalPerformed: record.formTraversalPerformed,
      wrapperExecuted: record.wrapperExecuted,
      siblingInputRestorePerformed: record.siblingInputRestorePerformed,
      valueTrackerRefreshed: record.valueTrackerRefreshed,
      realDomQueried: record.realDomQueried,
      rawLatestPropsRetained: record.rawLatestPropsRetained,
      rawFormRetained: record.rawFormRetained,
      rawNameRetained: record.rawNameRetained,
      compatibilityClaimed: record.compatibilityClaimed
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceAcceptedStatus,
        targetRole: 'sibling',
        hostTag: 'input',
        inputType: 'radio',
        sameName: true,
        sameForm: true,
        sameTarget: false,
        skipReason: null,
        siblingWouldReceiveRestore: true,
        siblingLatestPropsLookupPerformed: false,
        livePropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        rawFormRetained: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
        targetRole: 'sibling',
        hostTag: 'input',
        inputType: 'radio',
        sameName: true,
        sameForm: false,
        sameTarget: false,
        skipReason: 'sibling-radio-form-does-not-match',
        siblingWouldReceiveRestore: false,
        siblingLatestPropsLookupPerformed: false,
        livePropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        rawFormRetained: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
        targetRole: 'sibling',
        hostTag: 'input',
        inputType: 'radio',
        sameName: false,
        sameForm: true,
        sameTarget: false,
        skipReason: 'sibling-radio-name-does-not-match',
        siblingWouldReceiveRestore: false,
        siblingLatestPropsLookupPerformed: false,
        livePropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        rawFormRetained: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      },
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioSiblingPropsEvidenceSkippedStatus,
        targetRole: 'primary',
        hostTag: 'input',
        inputType: 'radio',
        sameName: true,
        sameForm: true,
        sameTarget: true,
        skipReason: 'primary-radio-is-not-a-sibling',
        siblingWouldReceiveRestore: false,
        siblingLatestPropsLookupPerformed: false,
        livePropsLookupPerformed: false,
        formTraversalPerformed: false,
        wrapperExecuted: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        realDomQueried: false,
        rawLatestPropsRetained: false,
        rawFormRetained: false,
        rawNameRetained: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.equal(groupIntent.siblingPropsLookup, lookup);
  assert.equal(groupIntent.groupLookupPerformed, false);
  assert.equal(groupIntent.siblingLatestPropsLookupPerformed, false);
  assert.equal(groupIntent.siblingInputRestorePerformed, false);
  assert.equal(groupIntent.valueTrackerRefreshed, false);
  assert.equal(intent.sideEffects.radioGroupSiblingMetadataRead, true);
  assert.equal(intent.sideEffects.radioGroupSiblingPropsEvidenceAccepted, true);
  assert.equal(
    intent.sideEffects.radioGroupSiblingPropsSameNameSameFormRecorded,
    true
  );
  assert.equal(intent.sideEffects.radioGroupFormBoundaryMetadataRead, true);
  assert.equal(intent.sideEffects.radioGroupLivePropsLookupPerformed, false);
  assert.equal(intent.sideEffects.radioGroupFormTraversalPerformed, false);
  assert.equal(intent.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(intent.sideEffects.radioGroupMembersEnumerated, false);
  assert.equal(intent.sideEffects.radioGroupValueTrackerRefreshed, false);
  assert.equal(intent.sideEffects.hostWrapperInvoked, false);
  assert.equal(intent.sideEffects.browserInputMutated, false);
  assert.equal(intent.sideEffects.compatibilityClaimed, false);
  assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);

  componentTree.detachHostInstanceToken(dispatch.token);
});

test('private controlled input post-event restore queue gate records select and textarea fake-DOM latest-props intent only', () => {
  const trackerGate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'select-textarea-tracker'
  });
  const restoreGate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'select-textarea-restore'
    });

  const rows = [
    {
      controlKind: 'single',
      eventName: 'change',
      fakeInitial: {value: 'b'},
      fakeNext: {value: 'c'},
      hostTag: 'select',
      latestProps: {
        value: 'c',
        onChange() {}
      },
      nodeName: 'SELECT',
      queueId: 'select-single-fake-dom-latest-props-restore',
      scenarioId: 'select-single-controlled-update'
    },
    {
      controlKind: 'multiple',
      eventName: 'change',
      fakeInitial: {selectedValues: ['b', 'c']},
      fakeNext: {selectedValues: ['a']},
      hostTag: 'select',
      latestProps: {
        multiple: true,
        value: ['a'],
        onChange() {}
      },
      multiple: true,
      nodeName: 'SELECT',
      queueId: 'select-multiple-fake-dom-latest-props-restore',
      scenarioId: 'select-multiple-controlled-update'
    },
    {
      controlKind: 'value',
      eventName: 'input',
      fakeInitial: {value: 'alpha'},
      fakeNext: {value: 'beta'},
      hostTag: 'textarea',
      latestProps: {
        value: 'beta',
        onChange() {},
        onInput() {}
      },
      nodeName: 'TEXTAREA',
      queueId: 'textarea-fake-dom-latest-props-restore',
      scenarioId: 'textarea-controlled-value-update'
    }
  ];

  const records = [];
  const cleanupTokens = [];

  for (const row of rows) {
    const fakeTarget = createControlledInputFakeDomTarget(row.fakeInitial);
    const descriptorBefore = Object.getOwnPropertyDescriptor(
      fakeTarget,
      row.hostTag === 'select' && row.controlKind === 'multiple'
        ? 'selectedValues'
        : 'value'
    );
    const install = trackerGate.installFakeDomTracker(
      {
        scenarioId: row.scenarioId,
        phaseId: 'post-event',
        hostTag: row.hostTag,
        multiple: row.multiple === true,
        controlKind: row.controlKind,
        props: row.latestProps
      },
      {
        explicitAdmission: true,
        adapterKind: 'deterministic-fake-dom',
        adapterId: `${row.scenarioId}-fake-target`,
        targetKind: 'controlled-input-value-tracker',
        fakeTarget
      }
    );
    Object.assign(fakeTarget, row.fakeNext);
    const observation = trackerGate.observeFakeDomTracker(install);
    const latestProps = createControlledLatestPropsLookup({
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      registrationName: row.eventName === 'input' ? 'onInput' : 'onChange'
    });
    cleanupTokens.push(latestProps.token);

    const intent =
      restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
        observation,
        latestProps.lookupRecord,
        {
          explicitAdmission: true,
          queueKind:
            'deterministic-fake-dom-latest-props-post-event-restore-queue',
          queueId: row.queueId,
          eventName: row.eventName,
          targetKind: 'controlled-input-post-event-restore-queue'
        }
      );

    records.push({
      descriptorBefore,
      fakeTarget,
      intent,
      latestProps,
      observation,
      row
    });
  }

  assert.deepEqual(
    records.map(({intent, row}) => ({
      requestId: intent.requestId,
      requestSequence: intent.requestSequence,
      sourceKind: intent.sourceKind,
      status: intent.status,
      domEventName: intent.domEventName,
      hostTag: intent.hostTag,
      multiple: intent.multiple,
      controlKind: intent.controlKind,
      controlledPropName: intent.controlledPropName,
      trackedField: intent.trackedField,
      sourceChanged: intent.restoreIntent.sourceChanged,
      latestPropsEvidenceAccepted:
        intent.restoreIntent.latestPropsEvidenceAccepted,
      latestPropsTargetHostTag:
        intent.restoreIntent.latestPropsTargetHostTag,
      sourceMatchesLatestPropsTarget:
        intent.restoreIntent.sourceMatchesLatestPropsTarget,
      supportedEventName: intent.restoreIntent.supportedEventName,
      intentRecorded: intent.restoreIntent.intentRecorded,
      restoreTargetWouldBeQueued:
        intent.restoreIntent.restoreTargetWouldBeQueued,
      queuePosition: intent.restoreIntent.queuePosition,
      eventDispatchRecordAccepted:
        intent.restoreIntent.eventDispatchRecordAccepted,
      fakeDomTrackerObservationAccepted:
        intent.restoreIntent.fakeDomTrackerObservationAccepted,
      latestPropsLookupPerformed:
        intent.restoreIntent.latestPropsLookupPerformed,
      restoreQueueWritten: intent.restoreIntent.restoreQueueWritten,
      restoreQueueWriteOrderRecorded:
        intent.restoreIntent.restoreQueueWriteOrderRecorded,
      restoreQueueFlushOrderRecorded:
        intent.restoreIntent.restoreQueueFlushOrderRecorded,
      acceptedRestoreKind:
        intent.restoreQueueOrdering.acceptedRestoreKind,
      queueSlot: intent.restoreQueueOrdering.writeOrder.queueSlot,
      flushWouldBeRequiredAfterWrite:
        intent.restoreQueueOrdering.flushOrder.flushWouldBeRequiredAfterWrite,
      hostWrapperOperation:
        intent.restoreQueueOrdering.hostWrapperOrder.wrapperOperation,
      controlledStateRestoreInvoked:
        intent.restoreIntent.controlledStateRestoreInvoked,
      latestPropsMetadataRead: intent.sideEffects.latestPropsMetadataRead,
      fakeDomValueChangeObserved:
        intent.sideEffects.fakeDomValueChangeObserved
    })),
    [
      {
        requestId: 'select-textarea-restore:1',
        requestSequence: 1,
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        domEventName: 'change',
        hostTag: 'select',
        multiple: false,
        controlKind: 'single',
        controlledPropName: 'value',
        trackedField: 'selectedOptions',
        sourceChanged: true,
        latestPropsEvidenceAccepted: true,
        latestPropsTargetHostTag: 'select',
        sourceMatchesLatestPropsTarget: true,
        supportedEventName: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true,
        latestPropsLookupPerformed: true,
        restoreQueueWritten: false,
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: 'select-single-value',
        queueSlot: 'primary',
        flushWouldBeRequiredAfterWrite: true,
        hostWrapperOperation: 'select-single-options-sync',
        controlledStateRestoreInvoked: false,
        latestPropsMetadataRead: true,
        fakeDomValueChangeObserved: true
      },
      {
        requestId: 'select-textarea-restore:2',
        requestSequence: 2,
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        domEventName: 'change',
        hostTag: 'select',
        multiple: true,
        controlKind: 'multiple',
        controlledPropName: 'value',
        trackedField: 'selectedOptions',
        sourceChanged: true,
        latestPropsEvidenceAccepted: true,
        latestPropsTargetHostTag: 'select',
        sourceMatchesLatestPropsTarget: true,
        supportedEventName: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true,
        latestPropsLookupPerformed: true,
        restoreQueueWritten: false,
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: 'select-multiple-value',
        queueSlot: 'primary',
        flushWouldBeRequiredAfterWrite: true,
        hostWrapperOperation: 'select-multiple-options-sync',
        controlledStateRestoreInvoked: false,
        latestPropsMetadataRead: true,
        fakeDomValueChangeObserved: true
      },
      {
        requestId: 'select-textarea-restore:3',
        requestSequence: 3,
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        domEventName: 'input',
        hostTag: 'textarea',
        multiple: false,
        controlKind: 'value',
        controlledPropName: 'value',
        trackedField: 'value',
        sourceChanged: true,
        latestPropsEvidenceAccepted: true,
        latestPropsTargetHostTag: 'textarea',
        sourceMatchesLatestPropsTarget: true,
        supportedEventName: true,
        intentRecorded: true,
        restoreTargetWouldBeQueued: true,
        queuePosition: 'primary',
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true,
        latestPropsLookupPerformed: true,
        restoreQueueWritten: false,
        restoreQueueWriteOrderRecorded: true,
        restoreQueueFlushOrderRecorded: true,
        acceptedRestoreKind: 'textarea-value',
        queueSlot: 'primary',
        flushWouldBeRequiredAfterWrite: true,
        hostWrapperOperation: 'textarea-value-sync',
        controlledStateRestoreInvoked: false,
        latestPropsMetadataRead: true,
        fakeDomValueChangeObserved: true
      }
    ]
  );

  for (const {descriptorBefore, fakeTarget, intent, latestProps, row} of records) {
    assert.equal(Object.isFrozen(intent), true, row.scenarioId);
    assert.equal(
      controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueRecord(
        intent
      ),
      true,
      row.scenarioId
    );
    assert.equal(
      controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueRecordPayload(
        intent
      ),
      intent,
      row.scenarioId
    );
    assert.equal(intent.eventEvidence, null);
    assert.equal(intent.fakeDomObservationEvidence.changed, true);
    assert.equal(intent.latestPropsEvidence.latestPropsStatus, 'present');
    assert.equal(intent.latestPropsEvidence.exposesLatestProps, false);
    assert.equal(intent.latestPropsEvidence.rawLatestPropsRetained, false);
    assert.equal(intent.controlledTarget.liveValueTrackerInstalled, false);
    assert.equal(intent.controlledTarget.valueTrackerFieldWritten, false);
    assert.equal(intent.controlledTarget.propertyDescriptorInstalled, false);
    assert.equal(intent.controlledTarget.hostValueRead, false);
    assert.equal(intent.controlledTarget.hostValueWritten, false);
    assert.equal(intent.restoreIntent.eventPluginDispatchPerformed, false);
    assert.equal(intent.restoreIntent.rawTargetCaptured, false);
    assert.equal(intent.restoreIntent.rawEventCaptured, false);
    assert.equal(intent.restoreIntent.rawLatestPropsRetained, false);
    assert.equal(intent.restoreQueueOrdering.metadataOnly, true);
    assert.equal(
      intent.restoreQueueOrdering.writeOrder.restoreQueueWritten,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.flushOrder.restoreQueueFlushed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.primaryHostWrapperRan,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.wrapperWritePerformed,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.hostValueWritten,
      false
    );
    assert.equal(
      intent.restoreQueueOrdering.hostWrapperOrder.browserInputMutated,
      false
    );
    assert.equal(intent.postEventRestoreBoundary.latestPropsLookup, true);
    assert.equal(intent.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(intent.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(intent.postEventRestoreBoundary.restoreFlushed, false);
    assert.equal(intent.sideEffects.eventDispatchRecordAccepted, false);
    assert.equal(intent.sideEffects.fakeDomTrackerObservationAccepted, true);
    assert.equal(intent.sideEffects.latestPropsEvidenceAccepted, true);
    assert.equal(intent.sideEffects.restoreQueueRecordCreated, true);
    assert.equal(intent.sideEffects.restoreQueueWritten, false);
    assert.equal(intent.sideEffects.restoreQueueFlushed, false);
    assert.equal(intent.sideEffects.controlledStateRestoreScheduled, false);
    assert.equal(intent.sideEffects.controlledStateRestoreInvoked, false);
    assert.equal(intent.sideEffects.hostWrapperInvoked, false);
    assert.equal(intent.sideEffects.hostValueRead, false);
    assert.equal(intent.sideEffects.hostValueWritten, false);
    assert.equal(intent.sideEffects.browserInputMutated, false);
    assert.equal(intent.sideEffects.rawLatestPropsRetained, false);
    assert.equal(
      intent.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
    assert.equal(Object.hasOwn(fakeTarget, '_valueTracker'), false);
    assert.equal(Object.hasOwn(latestProps.targetNode, '_valueTracker'), false);
    assert.equal(descriptorBefore.get, undefined);
    assert.equal(descriptorBefore.set, undefined);
  }

  const skipTarget = createControlledInputFakeDomTarget({value: 'alpha'});
  const skipInstall = trackerGate.installFakeDomTracker(
    {
      scenarioId: 'textarea-default-value-update',
      phaseId: 'post-event',
      hostTag: 'textarea',
      props: {
        defaultValue: 'alpha',
        onChange() {}
      }
    },
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'textarea-uncontrolled-fake-target',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: skipTarget
    }
  );
  skipTarget.value = 'beta';
  const skipObservation = trackerGate.observeFakeDomTracker(skipInstall);
  const skipLatestProps = createControlledLatestPropsLookup({
    latestProps: {
      defaultValue: 'alpha',
      onChange() {}
    },
    nodeName: 'TEXTAREA',
    registrationName: 'onChange'
  });
  cleanupTokens.push(skipLatestProps.token);
  const skipped =
    restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
      skipObservation,
      skipLatestProps.lookupRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-fake-dom-latest-props-post-event-restore-queue',
        queueId: 'textarea-uncontrolled-fake-dom-latest-props-restore',
        eventName: 'input',
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );

  assert.equal(
    skipped.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentSkippedStatus
  );
  assert.equal(skipped.restoreIntent.sourceChanged, true);
  assert.equal(skipped.restoreIntent.controlledPropPresent, false);
  assert.equal(skipped.restoreIntent.intentRecorded, false);
  assert.equal(skipped.restoreIntent.restoreTargetWouldBeQueued, false);
  assert.equal(skipped.restoreIntent.queuePosition, null);
  assert.equal(skipped.sideEffects.postEventRestoreIntentRecorded, false);
  assert.equal(skipped.sideEffects.postEventRestoreIntentSkipped, true);
  assert.equal(skipped.sideEffects.restoreQueueWritten, false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(
    summary.acceptedFakeDomObservationRecordType,
    resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticRecordType
  );
  assert.equal(summary.acceptedFakeDomObservationOperation, 'observe');
  assert.equal(summary.consumesFakeDomTrackerObservation, true);
  assert.equal(summary.consumesLatestPropsEvidence, true);
  assert.equal(summary.consumesEventDispatchEvidence, true);
  assert.equal(summary.writesRestoreQueue, false);
  assert.equal(summary.flushesRestoreQueue, false);

  assert.throws(
    () =>
      restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
        {},
        records[0].latestProps.lookupRecord,
        {explicitAdmission: true}
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidFakeDomObservationCode,
      compatibilityTarget
    }
  );

  for (const token of cleanupTokens) {
    componentTree.detachHostInstanceToken(token);
  }
});

test('private controlled checkbox and radio fake-DOM latest-props restore records group intent only', () => {
  const trackerGate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'checkable-fake-tracker'
  });
  const restoreGate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'checkable-fake-restore'
    });
  const rows = [
    {
      eventName: 'click',
      fakeInitial: {checked: false},
      fakeNext: {checked: true},
      inputType: 'checkbox',
      latestProps: {
        type: 'checkbox',
        checked: true,
        onChange() {},
        onClick() {}
      },
      queueId: 'checkbox-fake-latest-props-restore',
      scenarioId: 'checkbox-controlled-checked-update'
    },
    {
      eventName: 'click',
      fakeInitial: {checked: false},
      fakeNext: {checked: true},
      inputType: 'radio',
      latestProps: {
        type: 'radio',
        name: 'choice',
        checked: true,
        onChange() {},
        onClick() {}
      },
      queueId: 'radio-fake-latest-props-restore',
      scenarioId: 'radio-controlled-checked-restore-diagnostic'
    }
  ];
  const cleanupTokens = [];
  const records = rows.map((row) => {
    const fakeTarget = createControlledInputFakeDomTarget(row.fakeInitial);
    const install = trackerGate.installFakeDomTracker(
      {
        scenarioId: row.scenarioId,
        phaseId: 'post-event',
        hostTag: 'input',
        inputType: row.inputType,
        props: row.latestProps
      },
      {
        explicitAdmission: true,
        adapterKind: 'deterministic-fake-dom',
        adapterId: `${row.scenarioId}-fake-target`,
        targetKind: 'controlled-input-value-tracker',
        fakeTarget
      }
    );
    Object.assign(fakeTarget, row.fakeNext);
    const observation = trackerGate.observeFakeDomTracker(install);
    const latestProps = createControlledLatestPropsLookup({
      latestProps: row.latestProps,
      nodeName: 'INPUT',
      registrationName: 'onClick'
    });
    cleanupTokens.push(latestProps.token);
    const intent =
      restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
        observation,
        latestProps.lookupRecord,
        {
          explicitAdmission: true,
          queueKind:
            'deterministic-fake-dom-latest-props-post-event-restore-queue',
          queueId: row.queueId,
          eventName: row.eventName,
          targetKind: 'controlled-input-post-event-restore-queue'
        }
      );

    return {fakeTarget, intent, latestProps, row};
  });

  assert.deepEqual(
    records.map(({intent}) => ({
      sourceKind: intent.sourceKind,
      status: intent.status,
      inputType: intent.inputType,
      controlKind: intent.controlKind,
      sourceChanged: intent.restoreIntent.sourceChanged,
      sourceMatchesLatestPropsTarget:
        intent.restoreIntent.sourceMatchesLatestPropsTarget,
      checkableStatus: intent.checkableRestoreMetadata.status,
      radioGroupRestoreRequired:
        intent.checkableRestoreMetadata.radioGroupRestoreRequired,
      groupIntentStatus: intent.groupIntentRecords[0].status,
      groupKind: intent.groupIntentRecords[0].groupKind,
      skipReason: intent.groupIntentRecords[0].skipReason,
      groupLookupRequired:
        intent.groupIntentRecords[0].groupLookupRequired,
      siblingInputRestorePerformed:
        intent.groupIntentRecords[0].siblingInputRestorePerformed,
      valueTrackerRefreshed:
        intent.groupIntentRecords[0].valueTrackerRefreshed,
      eventDispatchRecordAccepted:
        intent.restoreIntent.eventDispatchRecordAccepted,
      fakeDomTrackerObservationAccepted:
        intent.restoreIntent.fakeDomTrackerObservationAccepted
    })),
    [
      {
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        inputType: 'checkbox',
        controlKind: 'checked',
        sourceChanged: true,
        sourceMatchesLatestPropsTarget: true,
        checkableStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
        radioGroupRestoreRequired: false,
        groupIntentStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentSkippedStatus,
        groupKind: 'single-checkable',
        skipReason: 'checkboxes-do-not-restore-radio-groups',
        groupLookupRequired: false,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true
      },
      {
        sourceKind: 'private-fake-dom-observation-latest-props-evidence',
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueIntentRecordedStatus,
        inputType: 'radio',
        controlKind: 'checked',
        sourceChanged: true,
        sourceMatchesLatestPropsTarget: true,
        checkableStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueCheckableRestoreMetadataStatus,
        radioGroupRestoreRequired: true,
        groupIntentStatus:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueRadioGroupIntentRecordedStatus,
        groupKind: 'radio-group',
        skipReason: null,
        groupLookupRequired: true,
        siblingInputRestorePerformed: false,
        valueTrackerRefreshed: false,
        eventDispatchRecordAccepted: false,
        fakeDomTrackerObservationAccepted: true
      }
    ]
  );

  for (const {fakeTarget, intent, latestProps} of records) {
    assert.equal(intent.eventEvidence, null);
    assert.equal(intent.sideEffects.fakeDomTrackerObservationAccepted, true);
    assert.equal(intent.sideEffects.checkableRestoreMetadataRecorded, true);
    assert.equal(intent.sideEffects.radioGroupLookupPerformed, false);
    assert.equal(intent.sideEffects.radioGroupMembersEnumerated, false);
    assert.equal(intent.sideEffects.radioGroupValueTrackerRefreshed, false);
    assert.equal(intent.sideEffects.hostValueRead, false);
    assert.equal(intent.sideEffects.hostValueWritten, false);
    assert.equal(intent.sideEffects.browserInputMutated, false);
    assert.equal(intent.groupIntentRecords[0].realDomQueried, false);
    assert.equal(intent.groupIntentRecords[0].rawGroupNodesCaptured, false);
    assert.equal(intent.groupIntentRecords[0].rawNameRetained, false);
    assert.equal(Object.hasOwn(fakeTarget, '_valueTracker'), false);
    assert.equal(Object.hasOwn(latestProps.targetNode, '_valueTracker'), false);
  }

  for (const token of cleanupTokens) {
    componentTree.detachHostInstanceToken(token);
  }
});

test('private controlled restore queue write preflight records deterministic write intents only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'write-preflight'
    });
  const rows = [
    {
      domEventName: 'input',
      expectedRestoreKind: 'input-text-value',
      expectedWrapperOperation: 'input-value-sync',
      latestProps: {
        type: 'text',
        value: 'alpha',
        onChange() {},
        onInput() {}
      },
      nodeName: 'INPUT',
      queueId: 'text-write-preflight'
    },
    {
      domEventName: 'click',
      expectedRestoreKind: 'input-checkbox-checked',
      expectedWrapperOperation: 'input-checked-sync',
      latestProps: {
        type: 'checkbox',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'checkbox-write-preflight'
    },
    {
      domEventName: 'click',
      expectedRestoreKind: 'input-radio-checked',
      expectedWrapperOperation: 'input-checked-sync',
      latestProps: {
        type: 'radio',
        name: 'choice',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'radio-write-preflight'
    },
    {
      domEventName: 'change',
      expectedRestoreKind: 'select-single-value',
      expectedWrapperOperation: 'select-single-options-sync',
      latestProps: {
        value: 'b',
        onChange() {}
      },
      nodeName: 'SELECT',
      queueId: 'select-single-write-preflight'
    },
    {
      domEventName: 'change',
      expectedRestoreKind: 'select-multiple-value',
      expectedWrapperOperation: 'select-multiple-options-sync',
      latestProps: {
        multiple: true,
        value: ['a', 'c'],
        onChange() {}
      },
      nodeName: 'SELECT',
      queueId: 'select-multiple-write-preflight'
    },
    {
      domEventName: 'input',
      expectedRestoreKind: 'textarea-value',
      expectedWrapperOperation: 'textarea-value-sync',
      latestProps: {
        value: 'body',
        onChange() {},
        onInput() {}
      },
      nodeName: 'TEXTAREA',
      queueId: 'textarea-write-preflight'
    }
  ];
  const admission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'controlled-write-preflight-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  };
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent, row};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    admission
  );

  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWritePreflightRecord(
      preflight
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueWritePreflightRecordPayload(
      preflight
    ),
    preflight
  );
  assert.equal(
    preflight.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueWritePreflightRecordType
  );
  assert.equal(
    preflight.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWritePreflightStatus
  );
  assert.equal(preflight.requestId, 'write-preflight:7');
  assert.equal(preflight.acceptedRecordCount, 6);
  assert.deepEqual(
    preflight.acceptedRestoreKinds,
    rows.map((row) => row.expectedRestoreKind)
  );
  assert.deepEqual(preflight.sourceRequestIds, [
    'write-preflight:1',
    'write-preflight:2',
    'write-preflight:3',
    'write-preflight:4',
    'write-preflight:5',
    'write-preflight:6'
  ]);
  assert.deepEqual(
    preflight.writeIntentRows.map((row) => ({
      rowId: row.rowId,
      rowSequence: row.rowSequence,
      sourceRequestId: row.sourceRequestId,
      sourceQueueId: row.sourceQueueId,
      queueSlot: row.queueSlot,
      queueSlotIndex: row.queueSlotIndex,
      restoreTargetWouldBeSet: row.restoreTargetWouldBeSet,
      restoreQueueWouldBeAppended: row.restoreQueueWouldBeAppended,
      restoreQueueLengthBeforeWrite: row.restoreQueueLengthBeforeWrite,
      restoreQueueLengthAfterWrite: row.restoreQueueLengthAfterWrite,
      acceptedRestoreKind: row.acceptedRestoreKind,
      hostWrapperOperation: row.hostWrapperOperation,
      radioGroupLookupRequired: row.radioGroupLookupRequired,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: 'write-preflight:7:row:1',
        rowSequence: 1,
        sourceRequestId: 'write-preflight:1',
        sourceQueueId: 'text-write-preflight',
        queueSlot: 'restore-target',
        queueSlotIndex: 0,
        restoreTargetWouldBeSet: true,
        restoreQueueWouldBeAppended: false,
        restoreQueueLengthBeforeWrite: 0,
        restoreQueueLengthAfterWrite: 0,
        acceptedRestoreKind: 'input-text-value',
        hostWrapperOperation: 'input-value-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:2',
        rowSequence: 2,
        sourceRequestId: 'write-preflight:2',
        sourceQueueId: 'checkbox-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 0,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 0,
        restoreQueueLengthAfterWrite: 1,
        acceptedRestoreKind: 'input-checkbox-checked',
        hostWrapperOperation: 'input-checked-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:3',
        rowSequence: 3,
        sourceRequestId: 'write-preflight:3',
        sourceQueueId: 'radio-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 1,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 1,
        restoreQueueLengthAfterWrite: 2,
        acceptedRestoreKind: 'input-radio-checked',
        hostWrapperOperation: 'input-checked-sync',
        radioGroupLookupRequired: true,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:4',
        rowSequence: 4,
        sourceRequestId: 'write-preflight:4',
        sourceQueueId: 'select-single-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 2,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 2,
        restoreQueueLengthAfterWrite: 3,
        acceptedRestoreKind: 'select-single-value',
        hostWrapperOperation: 'select-single-options-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:5',
        rowSequence: 5,
        sourceRequestId: 'write-preflight:5',
        sourceQueueId: 'select-multiple-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 3,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 3,
        restoreQueueLengthAfterWrite: 4,
        acceptedRestoreKind: 'select-multiple-value',
        hostWrapperOperation: 'select-multiple-options-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-preflight:7:row:6',
        rowSequence: 6,
        sourceRequestId: 'write-preflight:6',
        sourceQueueId: 'textarea-write-preflight',
        queueSlot: 'restore-queue',
        queueSlotIndex: 4,
        restoreTargetWouldBeSet: false,
        restoreQueueWouldBeAppended: true,
        restoreQueueLengthBeforeWrite: 4,
        restoreQueueLengthAfterWrite: 5,
        acceptedRestoreKind: 'textarea-value',
        hostWrapperOperation: 'textarea-value-sync',
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(preflight.writePlan.writeSequence, [
    'validate-queueable-restore-records',
    'record-restore-target-write-intent',
    'record-additional-restore-queue-write-intents',
    'keep-post-event-controlled-restore-flush-blocked'
  ]);
  assert.equal(preflight.writePlan.flushWouldBeRequiredAfterWrite, true);
  assert.equal(preflight.writePlan.restoreQueueWritten, false);
  assert.equal(preflight.writePlan.restoreQueueFlushed, false);
  assert.equal(preflight.writePlan.hostWrapperInvoked, false);
  assert.equal(preflight.writePlan.radioGroupLookupPerformed, false);
  assert.equal(preflight.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(preflight.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(preflight.postEventRestoreBoundary.hostWrapperInvoked, false);
  assert.equal(preflight.sideEffects.restoreQueueWritePreflightRecorded, true);
  assert.equal(preflight.sideEffects.restoreQueueWriteIntentRowCount, 6);
  assert.equal(preflight.sideEffects.restoreQueueWritten, false);
  assert.equal(preflight.sideEffects.restoreQueueFlushed, false);
  assert.equal(preflight.sideEffects.hostWrapperInvoked, false);
  assert.equal(preflight.sideEffects.radioGroupLookupRequired, true);
  assert.equal(preflight.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(preflight.sideEffects.radioGroupMembersEnumerated, false);
  assert.equal(preflight.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(preflight.sideEffects.browserInputMutated, false);

  const flushBlocker = gate.recordRestoreQueueFlushBlocker(preflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'controlled-flush-blocker-queue',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  });

  assert.equal(Object.isFrozen(flushBlocker), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueFlushBlockerRecord(
      flushBlocker
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueFlushBlockerRecordPayload(
      flushBlocker
    ),
    flushBlocker
  );
  assert.equal(
    flushBlocker.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueFlushBlockerRecordType
  );
  assert.equal(
    flushBlocker.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueFlushBlockerStatus
  );
  assert.equal(flushBlocker.requestId, 'write-preflight:8');
  assert.equal(flushBlocker.sourcePreflightRequestId, 'write-preflight:7');
  assert.equal(flushBlocker.acceptedRecordCount, 6);
  assert.deepEqual(
    flushBlocker.queueSnapshot.wrapperOperationNames,
    rows.map((row) => row.expectedWrapperOperation)
  );
  assert.deepEqual(
    {
      status: flushBlocker.queueSnapshot.status,
      metadataOnly: flushBlocker.queueSnapshot.metadataOnly,
      snapshotSource: flushBlocker.queueSnapshot.snapshotSource,
      snapshotEntryCount: flushBlocker.queueSnapshot.snapshotEntryCount,
      restoreQueueLength: flushBlocker.queueSnapshot.restoreQueueLength,
      restoreTargetKind:
        flushBlocker.queueSnapshot.restoreTarget.acceptedRestoreKind,
      restoreTargetWrapper:
        flushBlocker.queueSnapshot.restoreTarget.hostWrapperOperation,
      restoreQueueKinds: flushBlocker.queueSnapshot.restoreQueue.map(
        (entry) => entry.acceptedRestoreKind
      ),
      actualRestoreQueueRead:
        flushBlocker.queueSnapshot.actualRestoreQueueRead,
      actualRestoreQueueCleared:
        flushBlocker.queueSnapshot.actualRestoreQueueCleared,
      restoreQueueWritten: flushBlocker.queueSnapshot.restoreQueueWritten,
      restoreQueueFlushed: flushBlocker.queueSnapshot.restoreQueueFlushed,
      hostWrapperInvoked: flushBlocker.queueSnapshot.hostWrapperInvoked,
      radioGroupLookupPerformed:
        flushBlocker.queueSnapshot.radioGroupLookupPerformed,
      browserInputMutated: flushBlocker.queueSnapshot.browserInputMutated
    },
    {
      status: 'blocked-post-event-controlled-restore-queue-snapshot',
      metadataOnly: true,
      snapshotSource: 'accepted-write-preflight-metadata',
      snapshotEntryCount: 6,
      restoreQueueLength: 5,
      restoreTargetKind: 'input-text-value',
      restoreTargetWrapper: 'input-value-sync',
      restoreQueueKinds: [
        'input-checkbox-checked',
        'input-radio-checked',
        'select-single-value',
        'select-multiple-value',
        'textarea-value'
      ],
      actualRestoreQueueRead: false,
      actualRestoreQueueCleared: false,
      restoreQueueWritten: false,
      restoreQueueFlushed: false,
      hostWrapperInvoked: false,
      radioGroupLookupPerformed: false,
      browserInputMutated: false
    }
  );
  assert.deepEqual(
    flushBlocker.intendedFlushOrder.targetFlushOrder.map((entry) => ({
      flushIndex: entry.flushIndex,
      sourceRequestId: entry.sourceRequestId,
      acceptedRestoreKind: entry.acceptedRestoreKind,
      hostWrapperOperation: entry.hostWrapperOperation,
      flushStep: entry.flushStep,
      hostWrapperInvoked: entry.hostWrapperInvoked,
      wrapperWritePerformed: entry.wrapperWritePerformed,
      radioGroupLookupPerformed: entry.radioGroupLookupPerformed,
      browserInputMutated: entry.browserInputMutated
    })),
    [
      {
        flushIndex: 0,
        sourceRequestId: 'write-preflight:1',
        acceptedRestoreKind: 'input-text-value',
        hostWrapperOperation: 'input-value-sync',
        flushStep: 'restore-primary-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 1,
        sourceRequestId: 'write-preflight:2',
        acceptedRestoreKind: 'input-checkbox-checked',
        hostWrapperOperation: 'input-checked-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 2,
        sourceRequestId: 'write-preflight:3',
        acceptedRestoreKind: 'input-radio-checked',
        hostWrapperOperation: 'input-checked-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 3,
        sourceRequestId: 'write-preflight:4',
        acceptedRestoreKind: 'select-single-value',
        hostWrapperOperation: 'select-single-options-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 4,
        sourceRequestId: 'write-preflight:5',
        acceptedRestoreKind: 'select-multiple-value',
        hostWrapperOperation: 'select-multiple-options-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      },
      {
        flushIndex: 5,
        sourceRequestId: 'write-preflight:6',
        acceptedRestoreKind: 'textarea-value',
        hostWrapperOperation: 'textarea-value-sync',
        flushStep: 'restore-additional-target',
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupPerformed: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(flushBlocker.intendedFlushOrder.flushSequence, [
    'event-batch-exit',
    'pending-restore-check',
    'synchronous-work-flush',
    'snapshot-and-clear-private-queue',
    'restore-primary-target',
    'restore-additional-targets-in-order',
    'host-wrapper-restore-dispatch'
  ]);
  assert.deepEqual(flushBlocker.wrapperRestoreBlocker.blockerReasons, [
    'metadata-only-diagnostic',
    'accepted-write-metadata-did-not-write-live-queue',
    'restore-flush-execution-disabled',
    'host-wrapper-invocation-disabled',
    'live-host-node-not-accepted',
    'public-controlled-behavior-disabled',
    'radio-group-lookup-disabled'
  ]);
  assert.deepEqual(
    flushBlocker.wrapperRestoreBlocker.wrapperRows.map((row) => ({
      sourceRequestId: row.sourceRequestId,
      acceptedRestoreKind: row.acceptedRestoreKind,
      hostWrapperOperation: row.hostWrapperOperation,
      wrapperInvocationBlocked: row.wrapperInvocationBlocked,
      actualWrapperRestoreBlockedReason:
        row.actualWrapperRestoreBlockedReason,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    rows.map((row, index) => ({
      sourceRequestId: `write-preflight:${index + 1}`,
      acceptedRestoreKind: row.expectedRestoreKind,
      hostWrapperOperation: row.expectedWrapperOperation,
      wrapperInvocationBlocked: true,
      actualWrapperRestoreBlockedReason:
        'controlled-restore-flush-execution-remains-blocked',
      hostWrapperInvoked: false,
      wrapperWritePerformed: false,
      radioGroupLookupPerformed: false,
      valueTrackerFieldWritten: false,
      hostValueWritten: false,
      browserInputMutated: false
    }))
  );
  assert.equal(
    flushBlocker.wrapperRestoreBlocker.restoreFlushExecutionAllowed,
    false
  );
  assert.equal(
    flushBlocker.wrapperRestoreBlocker.hostWrapperInvocationAllowed,
    false
  );
  assert.equal(flushBlocker.wrapperRestoreBlocker.radioGroupLookupAllowed, false);
  assert.equal(flushBlocker.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(flushBlocker.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(flushBlocker.postEventRestoreBoundary.hostWrapperInvoked, false);
  assert.equal(
    flushBlocker.postEventRestoreBoundary.radioGroupLookupPerformed,
    false
  );
  assert.equal(flushBlocker.sideEffects.restoreQueueFlushBlockerRecorded, true);
  assert.equal(flushBlocker.sideEffects.restoreQueueSnapshotRecorded, true);
  assert.equal(
    flushBlocker.sideEffects.restoreQueueIntendedFlushOrderRecorded,
    true
  );
  assert.equal(flushBlocker.sideEffects.restoreQueueWritten, false);
  assert.equal(flushBlocker.sideEffects.restoreQueueFlushed, false);
  assert.equal(flushBlocker.sideEffects.hostWrapperInvoked, false);
  assert.equal(flushBlocker.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(flushBlocker.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(flushBlocker.sideEffects.hostValueWritten, false);
  assert.equal(flushBlocker.sideEffects.browserInputMutated, false);
  assert.equal(
    flushBlocker.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(summary.recordsRestoreQueueWritePreflight, true);
  assert.equal(summary.recordsRestoreQueueFlushBlocker, true);
  assert.equal(
    summary.restoreQueueWritePreflight.recordsWriteIntentRows,
    true
  );
  assert.equal(
    summary.restoreQueueWritePreflight.actualQueueWrites,
    false
  );
  assert.equal(
    summary.restoreQueueWritePreflight.actualQueueFlushes,
    false
  );
  assert.equal(
    summary.restoreQueueWritePreflight.hostWrapperInvocations,
    false
  );
  assert.equal(summary.restoreQueueWritePreflight.radioGroupQueries, false);
  assert.equal(summary.restoreQueueWritePreflight.liveDomMutations, false);
  assert.equal(
    summary.restoreQueueFlushBlocker.recordsQueueSnapshot,
    true
  );
  assert.equal(
    summary.restoreQueueFlushBlocker.recordsIntendedFlushOrder,
    true
  );
  assert.equal(
    summary.restoreQueueFlushBlocker.recordsWrapperOperationNames,
    true
  );
  assert.equal(
    summary.restoreQueueFlushBlocker.recordsWrapperBlockerReasons,
    true
  );
  assert.equal(summary.restoreQueueFlushBlocker.actualQueueFlushes, false);
  assert.equal(summary.restoreQueueFlushBlocker.hostWrapperInvocations, false);
  assert.equal(summary.restoreQueueFlushBlocker.radioGroupQueries, false);
  assert.equal(summary.restoreQueueFlushBlocker.liveDomMutations, false);

  const skippedDispatch = createControlledInputEventDispatch({
    domEventName: 'click',
    latestProps: {
      type: 'text',
      value: 'alpha',
      onClick() {}
    },
    nodeName: 'INPUT',
    value: 'browser-mutated'
  });
  const skipped = gate.recordPostEventRestoreIntentFromEventLatestProps(
    skippedDispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'skipped-write-preflight',
      eventName: 'click',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  assert.throws(
    () => gate.preflightRestoreQueueWrites([skipped], admission),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWritePreflightCode,
      compatibilityTarget,
      reason: 'restore-intent-not-recorded',
      sourceRequestId: 'write-preflight:9'
    }
  );

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
  assert.equal(Object.hasOwn(skippedDispatch.targetNode, '_valueTracker'), false);
  componentTree.detachHostInstanceToken(skippedDispatch.token);
});

test('private input/change controlled restore bridge records latest-props links only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'input-change-bridge'
    });
  const bridgeAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-input-change-event-controlled-restore-bridge',
    queueId: 'input-change-controlled-restore-bridge',
    targetKind: 'controlled-input-change-event-restore-queue-bridge'
  };
  const rows = [
    {
      domEventName: 'input',
      latestProps: {
        type: 'text',
        value: 'alpha',
        onChange() {},
        onInput() {}
      },
      nodeName: 'INPUT',
      queueId: 'text-input-change-bridge'
    },
    {
      domEventName: 'click',
      latestProps: {
        type: 'checkbox',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'checkbox-input-change-bridge'
    }
  ];
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const inputPreflight =
      pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
        dispatch.dispatchRecord
      );
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, inputPreflight, intent, row};
  });
  const writePreflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-queue-write-preflight',
      queueId: 'input-change-bridge-write-preflight',
      targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
    }
  );
  const bridge = gate.recordInputChangeEventControlledRestoreBridge(
    records[1].inputPreflight,
    records[1].intent,
    writePreflight,
    bridgeAdmission
  );

  assert.equal(Object.isFrozen(bridge), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecord(
      bridge
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueInputChangeBridgeRecordPayload(
      bridge
    ),
    bridge
  );
  assert.equal(
    bridge.$$typeof,
    controlledRestoreQueue
      .privateControlledInputPostEventRestoreQueueInputChangeBridgeRecordType
  );
  assert.equal(
    bridge.status,
    controlledRestoreQueue
      .controlledInputPostEventRestoreQueueInputChangeBridgeStatus
  );
  assert.equal(bridge.requestId, 'input-change-bridge:4');
  assert.equal(
    bridge.sourceInputChangePreflight.sourceRecordKind,
    pluginEventSystem.INPUT_CHANGE_EVENT_EXTRACTION_PREFLIGHT_RECORD_KIND
  );
  assert.equal(
    bridge.sourceInputChangePreflight.controlledRestoreBridgeEligible,
    true
  );
  assert.equal(
    bridge.sourceRestoreQueueRecord.requestId,
    'input-change-bridge:2'
  );
  assert.equal(
    bridge.sourceWritePreflight.matchedRowId,
    'input-change-bridge:3:row:2'
  );
  assert.deepEqual(bridge.bridgeRows.map((row) => ({
    rowId: row.rowId,
    sourceRestoreRequestId: row.sourceRestoreRequestId,
    sourceWriteIntentRowId: row.sourceWriteIntentRowId,
    domEventName: row.domEventName,
    inputType: row.inputType,
    controlKind: row.controlKind,
    acceptedRestoreKind: row.acceptedRestoreKind,
    queueSlot: row.queueSlot,
    queueSlotIndex: row.queueSlotIndex,
    latestPropsEvidenceLinked: row.latestPropsEvidenceLinked,
    latestPropsEvidenceMatch: row.latestPropsEvidenceMatch,
    restoreWritePreflightFresh: row.restoreWritePreflightFresh,
    eventDispatch: row.eventDispatch,
    syntheticEventCreated: row.syntheticEventCreated,
    valueTrackerFieldWritten: row.valueTrackerFieldWritten,
    restoreQueueWritten: row.restoreQueueWritten,
    restoreQueueFlushed: row.restoreQueueFlushed,
    hostWrapperInvoked: row.hostWrapperInvoked,
    browserInputMutated: row.browserInputMutated
  })), [
    {
      rowId: 'input-change-bridge:4:row:1',
      sourceRestoreRequestId: 'input-change-bridge:2',
      sourceWriteIntentRowId: 'input-change-bridge:3:row:2',
      domEventName: 'click',
      inputType: 'checkbox',
      controlKind: 'checked',
      acceptedRestoreKind: 'input-checkbox-checked',
      queueSlot: 'restore-queue',
      queueSlotIndex: 0,
      latestPropsEvidenceLinked: true,
      latestPropsEvidenceMatch: true,
      restoreWritePreflightFresh: true,
      eventDispatch: false,
      syntheticEventCreated: false,
      valueTrackerFieldWritten: false,
      restoreQueueWritten: false,
      restoreQueueFlushed: false,
      hostWrapperInvoked: false,
      browserInputMutated: false
    }
  ]);
  assert.equal(
    bridge.latestPropsEvidenceBridge.latestPropsEvidenceLinked,
    true
  );
  assert.equal(
    bridge.latestPropsEvidenceBridge.latestPropsEvidenceMatch,
    true
  );
  assert.deepEqual(bridge.latestPropsEvidenceBridge.restorePropKeys, [
    'checked',
    'onChange',
    'onClick',
    'type'
  ]);
  assert.equal(bridge.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(bridge.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(bridge.sideEffects.inputChangeEventExtractionPreflightAccepted, true);
  assert.equal(bridge.sideEffects.inputChangeControlledRestoreBridgeRecorded, true);
  assert.equal(bridge.sideEffects.inputChangeControlledRestoreBridgeRowsCreated, true);
  assert.equal(bridge.sideEffects.latestPropsEvidenceAccepted, true);
  assert.equal(bridge.sideEffects.restoreQueueWritten, false);
  assert.equal(bridge.sideEffects.restoreQueueFlushed, false);
  assert.equal(bridge.sideEffects.hostWrapperInvoked, false);
  assert.equal(bridge.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(bridge.sideEffects.browserInputMutated, false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(
    summary.recordsInputChangeEventControlledRestoreBridge,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreBridge
      .consumesChangeEventExtractionPreflight,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreBridge
      .consumesControlledRestoreLatestPropsEvidence,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreBridge.restoreQueueWrites,
    false
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreBridge.liveDomMutations,
    false
  );

  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreBridge(
        {},
        records[0].intent,
        writePreflight,
        bridgeAdmission
      ),
    {
      code:
        controlledRestoreQueue
          .controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode,
      compatibilityTarget,
      reason:
        'expected a private input/change event extraction preflight record'
    }
  );

  const unsupportedDispatch = createControlledInputEventDispatch({
    domEventName: 'change',
    latestProps: {
      type: 'file',
      value: 'ignored',
      onChange() {}
    },
    nodeName: 'INPUT'
  });
  const unsupportedPreflight =
    pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
      unsupportedDispatch.dispatchRecord
    );
  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreBridge(
        unsupportedPreflight,
        records[0].intent,
        writePreflight,
        bridgeAdmission
      ),
    {
      code:
        controlledRestoreQueue
          .controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode,
      compatibilityTarget,
      reason: 'unsupported-input-change-target-or-event'
    }
  );

  const staleDispatch = createControlledInputEventDispatch({
    domEventName: 'input',
    latestProps: {
      type: 'text',
      value: 'fresh',
      onChange() {},
      onInput() {}
    },
    nodeName: 'INPUT'
  });
  const stalePreflight =
    pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
      staleDispatch.dispatchRecord
    );
  const staleIntent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    staleDispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'stale-input-change-bridge',
      eventName: 'input',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreBridge(
        stalePreflight,
        staleIntent,
        writePreflight,
        bridgeAdmission
      ),
    {
      code:
        controlledRestoreQueue
          .controlledInputPostEventRestoreQueueInvalidInputChangeBridgeCode,
      compatibilityTarget,
      reason: 'stale-restore-queue-preflight-source-missing'
    }
  );

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
  assert.equal(Object.hasOwn(unsupportedDispatch.targetNode, '_valueTracker'), false);
  assert.equal(Object.hasOwn(staleDispatch.targetNode, '_valueTracker'), false);
  componentTree.detachHostInstanceToken(unsupportedDispatch.token);
  componentTree.detachHostInstanceToken(staleDispatch.token);
});

test('private controlled restore queue write execution records mutation intent only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'write-execution'
    });
  const rows = [
    {
      domEventName: 'input',
      latestProps: {
        type: 'text',
        value: 'alpha',
        onChange() {},
        onInput() {}
      },
      nodeName: 'INPUT',
      queueId: 'text-write-execution'
    },
    {
      domEventName: 'click',
      latestProps: {
        type: 'radio',
        name: 'choice',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'radio-write-execution'
    },
    {
      domEventName: 'input',
      latestProps: {
        value: 'body',
        onChange() {},
        onInput() {}
      },
      nodeName: 'TEXTAREA',
      queueId: 'textarea-write-execution'
    }
  ];
  const preflightAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'controlled-write-execution-preflight-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  };
  const executionAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'controlled-write-execution-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  };
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    preflightAdmission
  );
  const execution = gate.recordRestoreQueueWriteExecution(
    preflight,
    executionAdmission
  );

  assert.equal(Object.isFrozen(execution), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWriteExecutionRecord(
      execution
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueWriteExecutionRecordPayload(
      execution
    ),
    execution
  );
  assert.equal(
    execution.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueWriteExecutionRecordType
  );
  assert.equal(
    execution.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWriteExecutionStatus
  );
  assert.equal(execution.requestId, 'write-execution:5');
  assert.equal(execution.sourcePreflightRequestId, 'write-execution:4');
  assert.equal(execution.sourceWriteIntentRowCount, 3);
  assert.deepEqual(execution.acceptedRestoreKinds, [
    'input-text-value',
    'input-radio-checked',
    'textarea-value'
  ]);
  assert.deepEqual(
    execution.sourcePreflightRows.map((row) => ({
      rowId: row.rowId,
      sourceRequestId: row.sourceRequestId,
      queueSlot: row.queueSlot,
      queueSlotIndex: row.queueSlotIndex,
      hostTag: row.hostTag,
      controlKind: row.controlKind,
      acceptedRestoreKind: row.acceptedRestoreKind,
      writeWouldRun: row.writeWouldRun,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: 'write-execution:4:row:1',
        sourceRequestId: 'write-execution:1',
        queueSlot: 'restore-target',
        queueSlotIndex: 0,
        hostTag: 'input',
        controlKind: 'value',
        acceptedRestoreKind: 'input-text-value',
        writeWouldRun: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-execution:4:row:2',
        sourceRequestId: 'write-execution:2',
        queueSlot: 'restore-queue',
        queueSlotIndex: 0,
        hostTag: 'input',
        controlKind: 'checked',
        acceptedRestoreKind: 'input-radio-checked',
        writeWouldRun: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-execution:4:row:3',
        sourceRequestId: 'write-execution:3',
        queueSlot: 'restore-queue',
        queueSlotIndex: 1,
        hostTag: 'textarea',
        controlKind: 'value',
        acceptedRestoreKind: 'textarea-value',
        writeWouldRun: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(
    execution.writeExecutionRows.map((row) => ({
      rowId: row.rowId,
      sourcePreflightRowId: row.sourcePreflightRowId,
      sourceRequestId: row.sourceRequestId,
      writeOrder: row.writeOrder,
      queueSlot: row.queueSlot,
      queueMutationKind: row.queueMutationKind,
      restoreTargetWriteOrder: row.restoreTargetWriteOrder,
      restoreQueueWriteOrder: row.restoreQueueWriteOrder,
      restoreTargetMutationRecorded:
        row.restoreTargetMutationRecorded,
      restoreQueueAppendMutationRecorded:
        row.restoreQueueAppendMutationRecorded,
      metadataRestoreTargetWritten: row.metadataRestoreTargetWritten,
      metadataRestoreQueueWritten: row.metadataRestoreQueueWritten,
      hostTag: row.hostTag,
      controlKind: row.controlKind,
      acceptedRestoreKind: row.acceptedRestoreKind,
      radioGroupLookupRequired: row.radioGroupLookupRequired,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      hostValueRead: row.hostValueRead,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: 'write-execution:5:row:1',
        sourcePreflightRowId: 'write-execution:4:row:1',
        sourceRequestId: 'write-execution:1',
        writeOrder: 1,
        queueSlot: 'restore-target',
        queueMutationKind: 'set-restore-target',
        restoreTargetWriteOrder: 1,
        restoreQueueWriteOrder: null,
        restoreTargetMutationRecorded: true,
        restoreQueueAppendMutationRecorded: false,
        metadataRestoreTargetWritten: true,
        metadataRestoreQueueWritten: false,
        hostTag: 'input',
        controlKind: 'value',
        acceptedRestoreKind: 'input-text-value',
        radioGroupLookupRequired: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-execution:5:row:2',
        sourcePreflightRowId: 'write-execution:4:row:2',
        sourceRequestId: 'write-execution:2',
        writeOrder: 2,
        queueSlot: 'restore-queue',
        queueMutationKind: 'append-restore-queue',
        restoreTargetWriteOrder: null,
        restoreQueueWriteOrder: 1,
        restoreTargetMutationRecorded: false,
        restoreQueueAppendMutationRecorded: true,
        metadataRestoreTargetWritten: false,
        metadataRestoreQueueWritten: true,
        hostTag: 'input',
        controlKind: 'checked',
        acceptedRestoreKind: 'input-radio-checked',
        radioGroupLookupRequired: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: 'write-execution:5:row:3',
        sourcePreflightRowId: 'write-execution:4:row:3',
        sourceRequestId: 'write-execution:3',
        writeOrder: 3,
        queueSlot: 'restore-queue',
        queueMutationKind: 'append-restore-queue',
        restoreTargetWriteOrder: null,
        restoreQueueWriteOrder: 2,
        restoreTargetMutationRecorded: false,
        restoreQueueAppendMutationRecorded: true,
        metadataRestoreTargetWritten: false,
        metadataRestoreQueueWritten: true,
        hostTag: 'textarea',
        controlKind: 'value',
        acceptedRestoreKind: 'textarea-value',
        radioGroupLookupRequired: false,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(
    {
      slot: execution.restoreTargetMutation.slot,
      mutationKind: execution.restoreTargetMutation.mutationKind,
      writeOrder: execution.restoreTargetMutation.writeOrder,
      sourceRequestId: execution.restoreTargetMutation.sourceRequestId,
      acceptedRestoreKind:
        execution.restoreTargetMutation.acceptedRestoreKind,
      metadataRestoreTargetWritten:
        execution.restoreTargetMutation.metadataRestoreTargetWritten,
      restoreQueueWritten:
        execution.restoreTargetMutation.restoreQueueWritten,
      hostWrapperInvoked:
        execution.restoreTargetMutation.hostWrapperInvoked
    },
    {
      slot: 'restoreTarget',
      mutationKind: 'set-restore-target',
      writeOrder: 1,
      sourceRequestId: 'write-execution:1',
      acceptedRestoreKind: 'input-text-value',
      metadataRestoreTargetWritten: true,
      restoreQueueWritten: false,
      hostWrapperInvoked: false
    }
  );
  assert.deepEqual(
    execution.restoreQueueMutations.map((row) => ({
      slot: row.slot,
      mutationKind: row.mutationKind,
      writeOrder: row.writeOrder,
      appendOrder: row.appendOrder,
      queueIndex: row.queueIndex,
      sourceRequestId: row.sourceRequestId,
      acceptedRestoreKind: row.acceptedRestoreKind,
      metadataRestoreQueueWritten: row.metadataRestoreQueueWritten,
      restoreQueueWritten: row.restoreQueueWritten,
      hostWrapperInvoked: row.hostWrapperInvoked
    })),
    [
      {
        slot: 'restoreQueue',
        mutationKind: 'append-restore-queue',
        writeOrder: 2,
        appendOrder: 1,
        queueIndex: 0,
        sourceRequestId: 'write-execution:2',
        acceptedRestoreKind: 'input-radio-checked',
        metadataRestoreQueueWritten: true,
        restoreQueueWritten: false,
        hostWrapperInvoked: false
      },
      {
        slot: 'restoreQueue',
        mutationKind: 'append-restore-queue',
        writeOrder: 3,
        appendOrder: 2,
        queueIndex: 1,
        sourceRequestId: 'write-execution:3',
        acceptedRestoreKind: 'textarea-value',
        metadataRestoreQueueWritten: true,
        restoreQueueWritten: false,
        hostWrapperInvoked: false
      }
    ]
  );
  assert.deepEqual(execution.queueMutationPlan.writeSequence, [
    'consume-restore-queue-write-preflight',
    'record-restore-target-mutation-intent',
    'record-restore-queue-append-mutation-intents',
    'keep-post-event-controlled-restore-flush-blocked',
    'keep-host-wrapper-restore-blocked'
  ]);
  assert.equal(execution.queueMutationPlan.restoreTargetWriteRecorded, true);
  assert.equal(execution.queueMutationPlan.restoreQueueAppendRecorded, true);
  assert.equal(execution.queueMutationPlan.restoreQueueAppendCount, 2);
  assert.equal(execution.queueMutationPlan.postEventFlushBlocked, true);
  assert.equal(execution.queueMutationPlan.hostWrapperInvocationBlocked, true);
  assert.equal(execution.queueMutationPlan.restoreQueueWritten, false);
  assert.equal(execution.queueMutationPlan.restoreQueueFlushed, false);
  assert.equal(execution.queueMutationPlan.hostWrapperInvoked, false);
  assert.equal(execution.queueMutationPlan.radioGroupLookupPerformed, false);
  assert.equal(execution.postEventRestoreBoundary.sourcePreflightAccepted, true);
  assert.equal(
    execution.postEventRestoreBoundary.restoreQueueWriteExecutionRecorded,
    true
  );
  assert.equal(execution.postEventRestoreBoundary.restoreQueueWritten, false);
  assert.equal(execution.postEventRestoreBoundary.restoreQueueFlushed, false);
  assert.equal(execution.postEventRestoreBoundary.hostWrapperInvoked, false);
  assert.equal(
    execution.sideEffects.sourceRestoreQueueWritePreflightAccepted,
    true
  );
  assert.equal(execution.sideEffects.restoreQueueWriteExecutionRecorded, true);
  assert.equal(execution.sideEffects.restoreQueueMutationIntentRecorded, true);
  assert.equal(execution.sideEffects.restoreTargetMutationRecorded, true);
  assert.equal(execution.sideEffects.restoreQueueAppendMutationRecorded, true);
  assert.equal(execution.sideEffects.metadataRestoreTargetWritten, true);
  assert.equal(execution.sideEffects.metadataRestoreQueueWritten, true);
  assert.equal(execution.sideEffects.restoreQueueWritten, false);
  assert.equal(execution.sideEffects.restoreQueueFlushed, false);
  assert.equal(execution.sideEffects.hostWrapperInvoked, false);
  assert.equal(execution.sideEffects.radioGroupLookupRequired, true);
  assert.equal(execution.sideEffects.radioGroupLookupPerformed, false);
  assert.equal(execution.sideEffects.hostValueRead, false);
  assert.equal(execution.sideEffects.hostValueWritten, false);
  assert.equal(execution.sideEffects.browserInputMutated, false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(summary.recordsRestoreQueueWriteExecution, true);
  assert.equal(
    summary.restoreQueueWriteExecution.consumesWritePreflightRows,
    true
  );
  assert.equal(
    summary.restoreQueueWriteExecution.recordsRestoreTargetVsRestoreQueueOrder,
    true
  );
  assert.equal(summary.restoreQueueWriteExecution.actualQueueWrites, false);
  assert.equal(summary.restoreQueueWriteExecution.actualQueueFlushes, false);
  assert.equal(
    summary.restoreQueueWriteExecution.hostWrapperInvocations,
    false
  );
  assert.equal(summary.restoreQueueWriteExecution.radioGroupQueries, false);
  assert.equal(summary.restoreQueueWriteExecution.liveDomMutations, false);

  assert.throws(
    () =>
      gate.recordRestoreQueueWriteExecution(
        records[0].intent,
        executionAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWriteExecutionCode,
      compatibilityTarget,
      reason:
        'expected a private controlled restore queue write preflight record'
    }
  );

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
});

test('private controlled restore wrapper mutation intent consumes execution and flush blockers only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'wrapper-intent'
    });
  const rows = [
    {
      domEventName: 'input',
      latestProps: {
        type: 'text',
        value: 'alpha',
        onChange() {},
        onInput() {}
      },
      nodeName: 'INPUT',
      queueId: 'text-wrapper-intent'
    },
    {
      domEventName: 'click',
      latestProps: {
        type: 'radio',
        name: 'choice',
        checked: true,
        onChange() {},
        onClick() {}
      },
      nodeName: 'INPUT',
      queueId: 'radio-wrapper-intent'
    },
    {
      domEventName: 'change',
      latestProps: {
        multiple: true,
        value: ['a', 'c'],
        onChange() {}
      },
      nodeName: 'SELECT',
      queueId: 'select-wrapper-intent'
    }
  ];
  const preflightAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'controlled-wrapper-intent-preflight-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  };
  const executionAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'controlled-wrapper-intent-execution-queue',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  };
  const flushBlockerAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'controlled-wrapper-intent-flush-blocker-queue',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  };
  const wrapperIntentAdmission = {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent',
    queueId: 'controlled-wrapper-mutation-intent-queue',
    targetKind: 'controlled-input-post-event-restore-wrapper-mutation-intent'
  };
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    preflightAdmission
  );
  const execution = gate.recordRestoreQueueWriteExecution(
    preflight,
    executionAdmission
  );
  const flushBlocker = gate.recordRestoreQueueFlushBlocker(
    preflight,
    flushBlockerAdmission
  );
  const wrapperIntent = gate.recordRestoreQueueWrapperMutationIntent(
    execution,
    flushBlocker,
    wrapperIntentAdmission
  );

  assert.equal(Object.isFrozen(wrapperIntent), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecord(
      wrapperIntent
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordPayload(
      wrapperIntent
    ),
    wrapperIntent
  );
  assert.equal(
    wrapperIntent.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueWrapperMutationIntentRecordType
  );
  assert.equal(
    wrapperIntent.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueWrapperMutationIntentStatus
  );
  assert.equal(wrapperIntent.requestId, 'wrapper-intent:7');
  assert.equal(wrapperIntent.sourceWriteExecutionRequestId, 'wrapper-intent:5');
  assert.equal(wrapperIntent.sourceFlushBlockerRequestId, 'wrapper-intent:6');
  assert.equal(wrapperIntent.sourcePreflightRequestId, 'wrapper-intent:4');
  assert.deepEqual(wrapperIntent.wrapperOperationNames, [
    'input-value-sync',
    'input-checked-sync',
    'select-multiple-options-sync'
  ]);
  assert.deepEqual(
    wrapperIntent.wrapperMutationIntentRows.map((row) => ({
      rowId: row.rowId,
      sourceWriteExecutionRowId: row.sourceWriteExecutionRowId,
      sourceFlushIndex: row.sourceFlushIndex,
      sourceRequestId: row.sourceRequestId,
      acceptedRestoreKind: row.acceptedRestoreKind,
      wrapperOperationName: row.wrapperOperationName,
      wrapperMutationKind: row.wrapperMutationKind,
      hostTag: row.hostTag,
      controlKind: row.controlKind,
      trackedField: row.trackedField,
      controlledPropName: row.controlledPropName,
      intendedUpdateKind: row.intendedUpdateKind,
      valueTargetField: row.intendedValueUpdate?.targetField || null,
      valueKind: row.intendedValueUpdate?.valueKind || null,
      checkedTargetField: row.intendedCheckedUpdate?.targetField || null,
      checkedValueKind: row.intendedCheckedUpdate?.valueKind || null,
      wrapperInvocationBlocked: row.wrapperInvocationBlocked,
      wrapperWriteBlocked: row.wrapperWriteBlocked,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      radioGroupLookupRequired: row.radioGroupLookupRequired,
      radioGroupLookupPerformed: row.radioGroupLookupPerformed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      hostValueRead: row.hostValueRead,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        rowId: 'wrapper-intent:7:row:1',
        sourceWriteExecutionRowId: 'wrapper-intent:5:row:1',
        sourceFlushIndex: 0,
        sourceRequestId: 'wrapper-intent:1',
        acceptedRestoreKind: 'input-text-value',
        wrapperOperationName: 'input-value-sync',
        wrapperMutationKind: 'value-property-sync',
        hostTag: 'input',
        controlKind: 'value',
        trackedField: 'value',
        controlledPropName: 'value',
        intendedUpdateKind: 'value',
        valueTargetField: 'value',
        valueKind: 'string-current-value',
        checkedTargetField: null,
        checkedValueKind: null,
        wrapperInvocationBlocked: true,
        wrapperWriteBlocked: true,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: 'wrapper-intent:7:row:2',
        sourceWriteExecutionRowId: 'wrapper-intent:5:row:2',
        sourceFlushIndex: 1,
        sourceRequestId: 'wrapper-intent:2',
        acceptedRestoreKind: 'input-radio-checked',
        wrapperOperationName: 'input-checked-sync',
        wrapperMutationKind: 'checked-property-sync',
        hostTag: 'input',
        controlKind: 'checked',
        trackedField: 'checked',
        controlledPropName: 'checked',
        intendedUpdateKind: 'checked',
        valueTargetField: null,
        valueKind: null,
        checkedTargetField: 'checked',
        checkedValueKind: 'boolean-string-current-value',
        wrapperInvocationBlocked: true,
        wrapperWriteBlocked: true,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupRequired: true,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      },
      {
        rowId: 'wrapper-intent:7:row:3',
        sourceWriteExecutionRowId: 'wrapper-intent:5:row:3',
        sourceFlushIndex: 2,
        sourceRequestId: 'wrapper-intent:3',
        acceptedRestoreKind: 'select-multiple-value',
        wrapperOperationName: 'select-multiple-options-sync',
        wrapperMutationKind: 'multiple-option-selection-sync',
        hostTag: 'select',
        controlKind: 'multiple',
        trackedField: 'selectedOptions',
        controlledPropName: 'value',
        intendedUpdateKind: 'value',
        valueTargetField: 'selectedOptions',
        valueKind: 'array-option-values',
        checkedTargetField: null,
        checkedValueKind: null,
        wrapperInvocationBlocked: true,
        wrapperWriteBlocked: true,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        radioGroupLookupRequired: false,
        radioGroupLookupPerformed: false,
        valueTrackerFieldWritten: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(wrapperIntent.wrapperMutationPlan.wrapperSequence, [
    'consume-restore-queue-write-execution',
    'consume-restore-queue-flush-blocker',
    'cross-check-shared-source-preflight',
    'record-wrapper-operation-mutation-intents',
    'keep-wrapper-invocation-blocked',
    'keep-live-wrapper-writes-blocked'
  ]);
  assert.equal(wrapperIntent.wrapperMutationPlan.valueUpdateIntentCount, 2);
  assert.equal(wrapperIntent.wrapperMutationPlan.checkedUpdateIntentCount, 1);
  assert.equal(wrapperIntent.wrapperMutationPlan.restoreQueueFlushed, false);
  assert.equal(wrapperIntent.wrapperMutationPlan.hostWrapperInvoked, false);
  assert.equal(wrapperIntent.wrapperMutationPlan.wrapperWritePerformed, false);
  assert.equal(wrapperIntent.blockedSideEffects.liveDomReadBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.liveDomWriteBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.valueTrackerWriteBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.queueFlushBlocked, true);
  assert.equal(wrapperIntent.blockedSideEffects.hostWrapperInvoked, false);
  assert.equal(wrapperIntent.blockedSideEffects.hostValueWritten, false);
  assert.equal(wrapperIntent.blockedSideEffects.browserInputMutated, false);
  assert.equal(
    wrapperIntent.postEventRestoreBoundary.sourceRecordsSharePreflight,
    true
  );
  assert.equal(
    wrapperIntent.sideEffects.sourceRestoreQueueWriteExecutionAccepted,
    true
  );
  assert.equal(
    wrapperIntent.sideEffects.sourceRestoreQueueFlushBlockerAccepted,
    true
  );
  assert.equal(
    wrapperIntent.sideEffects.restoreWrapperMutationIntentRecorded,
    true
  );
  assert.equal(wrapperIntent.sideEffects.wrapperMutationIntentRowCount, 3);
  assert.equal(
    wrapperIntent.sideEffects.wrapperIntendedValueUpdateRecorded,
    true
  );
  assert.equal(
    wrapperIntent.sideEffects.wrapperIntendedCheckedUpdateRecorded,
    true
  );
  assert.equal(wrapperIntent.sideEffects.wrapperSideEffectsBlocked, true);
  assert.equal(wrapperIntent.sideEffects.restoreQueueFlushed, false);
  assert.equal(wrapperIntent.sideEffects.hostWrapperInvoked, false);
  assert.equal(wrapperIntent.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(wrapperIntent.sideEffects.hostValueWritten, false);
  assert.equal(wrapperIntent.sideEffects.browserInputMutated, false);
  assert.equal(
    wrapperIntent.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(summary.recordsRestoreWrapperMutationIntent, true);
  assert.equal(
    summary.restoreWrapperMutationIntent.acceptsWriteExecutionMetadata,
    true
  );
  assert.equal(
    summary.restoreWrapperMutationIntent.acceptsFlushBlockerMetadata,
    true
  );
  assert.equal(
    summary.restoreWrapperMutationIntent.recordsIntendedCheckedUpdates,
    true
  );
  assert.equal(
    summary.restoreWrapperMutationIntent.rejectsStaleSourcePairs,
    true
  );
  assert.equal(summary.restoreWrapperMutationIntent.wrapperWrites, false);
  assert.equal(summary.restoreWrapperMutationIntent.hostValueWrites, false);
  assert.equal(summary.restoreWrapperMutationIntent.liveDomMutations, false);

  assert.throws(
    () =>
      gate.recordRestoreQueueWrapperMutationIntent(
        preflight,
        flushBlocker,
        wrapperIntentAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget,
      reason:
        'expected a private controlled restore queue write execution record'
    }
  );
  assert.throws(
    () =>
      gate.recordRestoreQueueWrapperMutationIntent(
        execution,
        execution,
        wrapperIntentAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget,
      reason: 'expected a private controlled restore queue flush blocker record'
    }
  );

  const stale = createWrapperMutationIntentSources('stale-wrapper', rows);
  assert.throws(
    () =>
      stale.gate.recordRestoreQueueWrapperMutationIntent(
        stale.later.execution,
        stale.earlier.flushBlocker,
        wrapperIntentAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget,
      reason: 'stale-flush-blocker-source'
    }
  );
  const foreignASources = createWrapperMutationIntentSources(
    'foreign-wrapper-a',
    rows
  );
  const foreignBSources = createWrapperMutationIntentSources(
    'foreign-wrapper-b',
    rows
  );
  const foreignA = foreignASources.earlier;
  const foreignB = foreignBSources.earlier;
  assert.throws(
    () =>
      foreignA.gate.recordRestoreQueueWrapperMutationIntent(
        foreignA.execution,
        foreignB.flushBlocker,
        wrapperIntentAdmission
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidWrapperMutationIntentCode,
      compatibilityTarget,
      reason: 'foreign-source-preflight'
    }
  );

  for (const {dispatch} of records) {
    assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);
    componentTree.detachHostInstanceToken(dispatch.token);
  }
  stale.cleanup();
  foreignASources.cleanup();
  foreignBSources.cleanup();
});

test('private input/change controlled restore execution consumes fake-DOM text path only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'input-change-execution'
    });
  const dispatch = createControlledInputEventDispatch({
    domEventName: 'input',
    latestProps: {
      type: 'text',
      value: 'alpha',
      onChange() {},
      onInput() {}
    },
    nodeName: 'INPUT',
    value: 'browser-mutated'
  });
  const inputPreflight =
    pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
      dispatch.dispatchRecord
    );
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    dispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'input-change-execution-restore',
      eventName: 'input',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  const writePreflight = gate.preflightRestoreQueueWrites([intent], {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'input-change-execution-preflight',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  });
  const bridge = gate.recordInputChangeEventControlledRestoreBridge(
    inputPreflight,
    intent,
    writePreflight,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-input-change-event-controlled-restore-bridge',
      queueId: 'input-change-execution-bridge',
      targetKind: 'controlled-input-change-event-restore-queue-bridge'
    }
  );
  const execution = gate.recordRestoreQueueWriteExecution(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'input-change-execution-write',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  });
  const flushBlocker = gate.recordRestoreQueueFlushBlocker(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'input-change-execution-flush',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  });
  const wrapperIntent = gate.recordRestoreQueueWrapperMutationIntent(
    execution,
    flushBlocker,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent',
      queueId: 'input-change-execution-wrapper',
      targetKind: 'controlled-input-post-event-restore-wrapper-mutation-intent'
    }
  );
  const fakeTarget = createControlledInputFakeDomTarget({
    value: 'browser-mutated'
  });
  const restoreExecution =
    gate.recordInputChangeEventControlledRestoreExecution(
      inputPreflight,
      bridge,
      execution,
      flushBlocker,
      wrapperIntent,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-input-change-event-controlled-restore-execution',
        queueId: 'input-change-execution-final',
        targetKind: 'controlled-input-change-event-restore-queue-execution',
        fakeDomTarget: fakeTarget
      }
    );

  assert.equal(
    restoreExecution.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueInputChangeExecutionStatus
  );
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecord(
      restoreExecution
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueInputChangeExecutionRecordPayload(
      restoreExecution
    ),
    restoreExecution
  );
  assert.equal(fakeTarget.value, 'alpha');
  assert.equal(dispatch.targetNode.value, 'browser-mutated');
  assert.equal(restoreExecution.executionRowCount, 1);
  assert.deepEqual(
    restoreExecution.inputChangeRestoreExecutionRows.map((row) => ({
      acceptedRestoreKind: row.acceptedRestoreKind,
      targetField: row.targetField,
      beforeValueSnapshot: row.beforeValueSnapshot,
      nextValueSnapshot: row.nextValueSnapshot,
      afterValueSnapshot: row.afterValueSnapshot,
      fakeDomTargetAccepted: row.fakeDomTargetAccepted,
      latestPropsEvidenceMatch: row.latestPropsEvidenceMatch,
      restoreQueueWriteExecutionAccepted:
        row.restoreQueueWriteExecutionAccepted,
      flushIntentAccepted: row.flushIntentAccepted,
      wrapperMutationExecutionRecorded:
        row.wrapperMutationExecutionRecorded,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      fakeDomInputMutated: row.fakeDomInputMutated,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        acceptedRestoreKind: 'input-text-value',
        targetField: 'value',
        beforeValueSnapshot: 'browser-mutated',
        nextValueSnapshot: 'alpha',
        afterValueSnapshot: 'alpha',
        fakeDomTargetAccepted: true,
        latestPropsEvidenceMatch: true,
        restoreQueueWriteExecutionAccepted: true,
        flushIntentAccepted: true,
        wrapperMutationExecutionRecorded: true,
        restoreQueueWritten: true,
        restoreQueueFlushed: true,
        hostWrapperInvoked: true,
        wrapperWritePerformed: true,
        fakeDomInputMutated: true,
        browserInputMutated: false
      }
    ]
  );
  assert.equal(
    restoreExecution.latestPropsValidation.staleLatestPropsRejected,
    true
  );
  assert.equal(
    restoreExecution.latestPropsValidation.latestPropsValidationAccepted,
    true
  );
  assert.equal(
    restoreExecution.latestPropsValidation.currentLatestPropsFresh,
    true
  );
  assert.equal(
    restoreExecution.wrapperMutationExecutionEvidence
      .wrapperMutationExecutionRecorded,
    true
  );
  assert.equal(
    restoreExecution.wrapperMutationExecutionEvidence.wrapperWritePerformed,
    true
  );
  assert.equal(restoreExecution.postEventRestoreBoundary.fakeDomOnly, true);
  assert.equal(
    restoreExecution.postEventRestoreBoundary.restoreQueueWritten,
    true
  );
  assert.equal(
    restoreExecution.postEventRestoreBoundary.restoreQueueFlushed,
    true
  );
  assert.equal(restoreExecution.sideEffects.restoreQueueWritten, false);
  assert.equal(restoreExecution.sideEffects.restoreQueueFlushed, false);
  assert.equal(restoreExecution.sideEffects.privateRestoreQueueWritten, true);
  assert.equal(restoreExecution.sideEffects.privateRestoreQueueFlushed, true);
  assert.equal(restoreExecution.sideEffects.hostWrapperInvoked, true);
  assert.equal(restoreExecution.sideEffects.fakeDomInputMutated, true);
  assert.equal(restoreExecution.sideEffects.browserInputMutated, false);
  assert.equal(
    restoreExecution.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(
    summary.recordsInputChangeEventControlledRestoreExecution,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreExecution
      .rejectsLiveDomNodesBeforeMutation,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreExecution.liveDomMutations,
    false
  );
  assert.equal(
    summary.recordsLiveControlledRestoreMutationPreflight,
    true
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight
      .acceptsLiveDomNodePreflight,
    true
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight
      .liveDomTargetCaptured,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.restoreQueueWrites,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.hostValueReads,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.hostValueWrites,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.valueTrackerWrites,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.valueTrackerAccess,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.descriptorAccess,
    false
  );
  assert.equal(
    summary.liveControlledRestoreMutationPreflight.liveDomMutations,
    false
  );

  const restoreDiagnosticSummary =
    resourceFormGate.describeControlledInputPrivateRestoreQueueDiagnosticGate();
  assert.equal(
    restoreDiagnosticSummary.liveRestoreMutationPreflight
      .acceptsLiveDomNodePreflight,
    true
  );
  assert.equal(
    restoreDiagnosticSummary.liveRestoreMutationPreflight
      .liveDomTargetCaptured,
    false
  );
  assert.equal(
    restoreDiagnosticSummary.liveRestoreMutationPreflight
      .valueTrackerFieldWritten,
    false
  );
  assert.equal(
    restoreDiagnosticSummary.liveRestoreMutationPreflight
      .browserInputMutated,
    false
  );

  const preflightDocument = createRootBridgeDocument();
  preflightDocument.defaultView = {};
  const preflightLiveNode = createRootBridgeElement(
    'INPUT',
    preflightDocument
  );
  const guardedReads = [];
  const guardedWrites = [];
  const guardedDescriptorReads = [];
  const guardedPresenceChecks = [];
  const guardedLiveNode = new Proxy(preflightLiveNode, {
    defineProperty(target, property, descriptor) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedWrites.push(String(property));
        throw new Error(`Unexpected live preflight define ${String(property)}`);
      }
      return Reflect.defineProperty(target, property, descriptor);
    },
    getOwnPropertyDescriptor(target, property) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedDescriptorReads.push(String(property));
        throw new Error(
          `Unexpected live preflight descriptor ${String(property)}`
        );
      }
      return Reflect.getOwnPropertyDescriptor(target, property);
    },
    get(target, property, receiver) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedReads.push(String(property));
        throw new Error(`Unexpected live preflight read ${String(property)}`);
      }
      return Reflect.get(target, property, receiver);
    },
    has(target, property) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedPresenceChecks.push(String(property));
        throw new Error(`Unexpected live preflight has ${String(property)}`);
      }
      return Reflect.has(target, property);
    },
    set(target, property, value, receiver) {
      if (
        property === 'value' ||
        property === 'checked' ||
        property === '_valueTracker'
      ) {
        guardedWrites.push(String(property));
        throw new Error(`Unexpected live preflight write ${String(property)}`);
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
  const livePreflight =
    gate.preflightLiveControlledInputRestoreMutation(
      inputPreflight,
      bridge,
      execution,
      flushBlocker,
      wrapperIntent,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-controlled-input-post-event-restore-live-mutation-preflight',
        queueId: 'input-change-live-preflight',
        targetKind:
          'controlled-input-post-event-restore-live-mutation-preflight',
        liveDomTarget: guardedLiveNode
      }
    );

  assert.deepEqual(guardedReads, []);
  assert.deepEqual(guardedWrites, []);
  assert.deepEqual(guardedDescriptorReads, []);
  assert.deepEqual(guardedPresenceChecks, []);
  assert.equal(Object.hasOwn(preflightLiveNode, '_valueTracker'), false);
  assert.equal(Object.isFrozen(livePreflight), true);
  assert.equal(
    controlledRestoreQueue.isPrivateControlledInputPostEventRestoreQueueLiveMutationPreflightRecord(
      livePreflight
    ),
    true
  );
  assert.equal(
    controlledRestoreQueue.getPrivateControlledInputPostEventRestoreQueueLiveMutationPreflightRecordPayload(
      livePreflight
    ),
    livePreflight
  );
  assert.equal(
    livePreflight.$$typeof,
    controlledRestoreQueue.privateControlledInputPostEventRestoreQueueLiveMutationPreflightRecordType
  );
  assert.equal(
    livePreflight.status,
    controlledRestoreQueue.controlledInputPostEventRestoreQueueLiveMutationPreflightStatus
  );
  assert.equal(livePreflight.admission.liveDomNodeAccepted, true);
  assert.equal(livePreflight.admission.liveDomTargetCaptured, false);
  assert.equal(livePreflight.admission.realDomMutationAllowed, false);
  assert.equal(livePreflight.admission.hostValueReadAllowed, false);
  assert.equal(livePreflight.admission.hostValueWriteAllowed, false);
  assert.equal(livePreflight.admission.liveDescriptorAccessAllowed, false);
  assert.equal(livePreflight.admission.valueTrackerFieldAccessAllowed, false);
  assert.equal(
    livePreflight.admission.valueTrackerFieldWriteAllowed,
    false
  );
  assert.deepEqual(
    livePreflight.liveMutationPreflightRows.map((row) => ({
      status: row.status,
      acceptedRestoreKind: row.acceptedRestoreKind,
      targetField: row.targetField,
      nextValueSnapshot: row.nextValueSnapshot,
      liveDomNodeAccepted: row.liveDomNodeAccepted,
      liveDomTargetCaptured: row.liveDomTargetCaptured,
      liveMutationBlocked: row.liveMutationBlocked,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      valueTrackerAccessBlocked: row.valueTrackerAccessBlocked,
      valueTrackerFieldAccessed: row.valueTrackerFieldAccessed,
      valueTrackerFieldWritten: row.valueTrackerFieldWritten,
      descriptorAccessBlocked: row.descriptorAccessBlocked,
      propertyDescriptorAccessed: row.propertyDescriptorAccessed,
      propertyDescriptorInstalled: row.propertyDescriptorInstalled,
      hostValueRead: row.hostValueRead,
      hostValueWritten: row.hostValueWritten,
      browserInputMutated: row.browserInputMutated
    })),
    [
      {
        status:
          controlledRestoreQueue.controlledInputPostEventRestoreQueueLiveMutationPreflightRowStatus,
        acceptedRestoreKind: 'input-text-value',
        targetField: 'value',
        nextValueSnapshot: 'alpha',
        liveDomNodeAccepted: true,
        liveDomTargetCaptured: false,
        liveMutationBlocked: true,
        restoreQueueWritten: false,
        restoreQueueFlushed: false,
        hostWrapperInvoked: false,
        wrapperWritePerformed: false,
        valueTrackerAccessBlocked: true,
        valueTrackerFieldAccessed: false,
        valueTrackerFieldWritten: false,
        descriptorAccessBlocked: true,
        propertyDescriptorAccessed: false,
        propertyDescriptorInstalled: false,
        hostValueRead: false,
        hostValueWritten: false,
        browserInputMutated: false
      }
    ]
  );
  assert.deepEqual(livePreflight.blockerEvidence.blockerReasons, [
    'live-host-node-admitted-for-preflight-only',
    'accepted-write-execution-did-not-write-live-queue',
    'accepted-flush-blocker-kept-queue-flush-disabled',
    'host-wrapper-invocation-disabled',
    'wrapper-property-write-disabled',
    'host-value-read-disabled',
    'host-value-write-disabled',
    'live-descriptor-access-disabled',
    'live-descriptor-installation-disabled',
    'value-tracker-access-disabled',
    'value-tracker-write-disabled',
    'browser-input-mutation-disabled',
    'public-controlled-behavior-disabled'
  ]);
  assert.equal(
    livePreflight.blockerEvidence.liveDomNodeAcceptedForPreflight,
    true
  );
  assert.equal(livePreflight.blockerEvidence.liveDomTargetCaptured, false);
  assert.equal(
    livePreflight.blockerEvidence.liveMutationExecutionBlocked,
    true
  );
  assert.equal(livePreflight.blockerEvidence.hostValueRead, false);
  assert.equal(livePreflight.blockerEvidence.hostValueWritten, false);
  assert.equal(
    livePreflight.blockerEvidence.valueTrackerAccessBlocked,
    true
  );
  assert.equal(
    livePreflight.blockerEvidence.valueTrackerFieldAccessed,
    false
  );
  assert.equal(
    livePreflight.blockerEvidence.valueTrackerFieldWritten,
    false
  );
  assert.equal(
    livePreflight.blockerEvidence.descriptorAccessBlocked,
    true
  );
  assert.equal(
    livePreflight.blockerEvidence.propertyDescriptorAccessed,
    false
  );
  assert.equal(
    livePreflight.blockerEvidence.propertyDescriptorInstalled,
    false
  );
  assert.equal(livePreflight.blockerEvidence.browserInputMutated, false);
  assert.equal(
    livePreflight.postEventRestoreBoundary.liveMutationExecutionBlocked,
    true
  );
  assert.equal(
    livePreflight.postEventRestoreBoundary.restoreQueueWritten,
    false
  );
  assert.equal(livePreflight.postEventRestoreBoundary.hostValueRead, false);
  assert.equal(livePreflight.postEventRestoreBoundary.hostValueWritten, false);
  assert.equal(
    livePreflight.postEventRestoreBoundary.valueTrackerFieldAccessed,
    false
  );
  assert.equal(
    livePreflight.postEventRestoreBoundary.propertyDescriptorAccessed,
    false
  );
  assert.equal(livePreflight.sideEffects.liveMutationPreflightRecorded, true);
  assert.equal(livePreflight.sideEffects.liveMutationPreflightRowCount, 1);
  assert.equal(livePreflight.sideEffects.restoreQueueWritten, false);
  assert.equal(livePreflight.sideEffects.restoreQueueFlushed, false);
  assert.equal(livePreflight.sideEffects.hostWrapperInvoked, false);
  assert.equal(livePreflight.sideEffects.valueTrackerFieldAccessed, false);
  assert.equal(livePreflight.sideEffects.valueTrackerFieldWritten, false);
  assert.equal(livePreflight.sideEffects.propertyDescriptorAccessed, false);
  assert.equal(livePreflight.sideEffects.propertyDescriptorInstalled, false);
  assert.equal(livePreflight.sideEffects.hostValueRead, false);
  assert.equal(livePreflight.sideEffects.hostValueWritten, false);
  assert.equal(livePreflight.sideEffects.browserInputMutated, false);
  assert.equal(
    livePreflight.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );

  const liveDocument = createRootBridgeDocument();
  liveDocument.defaultView = {};
  const liveNode = createRootBridgeElement('INPUT', liveDocument);
  liveNode[resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker] =
    true;
  assert.throws(
    () =>
      gate.recordInputChangeEventControlledRestoreExecution(
        inputPreflight,
        bridge,
        execution,
        flushBlocker,
        wrapperIntent,
        {
          explicitAdmission: true,
          queueKind:
            'deterministic-input-change-event-controlled-restore-execution',
          queueId: 'input-change-live-reject',
          targetKind:
            'controlled-input-change-event-restore-queue-execution',
          fakeDomTarget: liveNode
        }
      ),
    {
      code:
        controlledRestoreQueue.controlledInputPostEventRestoreQueueInvalidInputChangeExecutionCode,
      compatibilityTarget,
      reason: 'unsupported-live-dom-node'
    }
  );

  componentTree.detachHostInstanceToken(dispatch.token);
});

test('private input/change controlled restore execution consumes fake-DOM checkbox path only', () => {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: 'checkbox-input-change-execution'
    });
  const dispatch = createControlledInputEventDispatch({
    domEventName: 'click',
    latestProps: {
      type: 'checkbox',
      checked: false,
      onChange() {}
    },
    nodeName: 'INPUT'
  });
  const inputPreflight =
    pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
      dispatch.dispatchRecord
    );
  const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
    dispatch.dispatchRecord,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-event-latest-props-post-event-restore-queue',
      queueId: 'checkbox-input-change-execution-restore',
      eventName: 'click',
      targetKind: 'controlled-input-post-event-restore-queue'
    }
  );
  const writePreflight = gate.preflightRestoreQueueWrites([intent], {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: 'checkbox-input-change-execution-preflight',
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  });
  const bridge = gate.recordInputChangeEventControlledRestoreBridge(
    inputPreflight,
    intent,
    writePreflight,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-input-change-event-controlled-restore-bridge',
      queueId: 'checkbox-input-change-execution-bridge',
      targetKind: 'controlled-input-change-event-restore-queue-bridge'
    }
  );
  const execution = gate.recordRestoreQueueWriteExecution(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: 'checkbox-input-change-execution-write',
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  });
  const flushBlocker = gate.recordRestoreQueueFlushBlocker(writePreflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: 'checkbox-input-change-execution-flush',
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  });
  const wrapperIntent = gate.recordRestoreQueueWrapperMutationIntent(
    execution,
    flushBlocker,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent',
      queueId: 'checkbox-input-change-execution-wrapper',
      targetKind: 'controlled-input-post-event-restore-wrapper-mutation-intent'
    }
  );
  const fakeTarget = createControlledInputFakeDomTarget({
    checked: true
  });
  const restoreExecution =
    gate.recordInputChangeEventControlledRestoreExecution(
      inputPreflight,
      bridge,
      execution,
      flushBlocker,
      wrapperIntent,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-input-change-event-controlled-restore-execution',
        queueId: 'checkbox-input-change-execution-final',
        targetKind: 'controlled-input-change-event-restore-queue-execution',
        fakeDomTarget: fakeTarget
      }
    );

  assert.equal(fakeTarget.checked, false);
  assert.equal(restoreExecution.executionRowCount, 1);
  assert.deepEqual(
    restoreExecution.inputChangeRestoreExecutionRows.map((row) => ({
      acceptedRestoreKind: row.acceptedRestoreKind,
      targetField: row.targetField,
      valueRestoreExecuted: row.valueRestoreExecuted,
      checkedRestoreExecuted: row.checkedRestoreExecuted,
      beforeValueSnapshot: row.beforeValueSnapshot,
      nextValueSnapshot: row.nextValueSnapshot,
      afterValueSnapshot: row.afterValueSnapshot,
      hostWrapperOperation: row.hostWrapperOperation,
      wrapperMutationKind: row.wrapperMutationKind,
      intendedUpdateKind: row.intendedUpdateKind,
      fakeDomTargetAccepted: row.fakeDomTargetAccepted,
      restoreQueueWritten: row.restoreQueueWritten,
      restoreQueueFlushed: row.restoreQueueFlushed,
      hostWrapperInvoked: row.hostWrapperInvoked,
      wrapperWritePerformed: row.wrapperWritePerformed,
      fakeDomInputMutated: row.fakeDomInputMutated,
      browserInputMutated: row.browserInputMutated,
      compatibilityClaimed: row.compatibilityClaimed
    })),
    [
      {
        acceptedRestoreKind: 'input-checkbox-checked',
        targetField: 'checked',
        valueRestoreExecuted: false,
        checkedRestoreExecuted: true,
        beforeValueSnapshot: true,
        nextValueSnapshot: false,
        afterValueSnapshot: false,
        hostWrapperOperation: 'input-checked-sync',
        wrapperMutationKind: 'checked-property-sync',
        intendedUpdateKind: 'checked',
        fakeDomTargetAccepted: true,
        restoreQueueWritten: true,
        restoreQueueFlushed: true,
        hostWrapperInvoked: true,
        wrapperWritePerformed: true,
        fakeDomInputMutated: true,
        browserInputMutated: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.equal(
    restoreExecution.wrapperMutationExecutionEvidence.targetField,
    'checked'
  );
  assert.equal(
    restoreExecution.wrapperMutationExecutionEvidence.nextValueSnapshot,
    false
  );
  assert.equal(
    restoreExecution.postEventRestoreBoundary.restoreQueueWritten,
    true
  );
  assert.equal(
    restoreExecution.postEventRestoreBoundary.restoreQueueFlushed,
    true
  );
  assert.equal(restoreExecution.sideEffects.restoreQueueWritten, false);
  assert.equal(restoreExecution.sideEffects.restoreQueueFlushed, false);
  assert.equal(restoreExecution.sideEffects.privateRestoreQueueWritten, true);
  assert.equal(restoreExecution.sideEffects.privateRestoreQueueFlushed, true);
  assert.equal(restoreExecution.sideEffects.hostWrapperInvoked, true);
  assert.equal(restoreExecution.sideEffects.fakeDomInputMutated, true);
  assert.equal(restoreExecution.sideEffects.browserInputMutated, false);

  const summary =
    controlledRestoreQueue.describeControlledInputPostEventRestoreQueueGate();
  assert.equal(
    summary.inputChangeEventControlledRestoreExecution
      .acceptsCheckboxCheckedFakeDomPath,
    true
  );
  assert.equal(
    summary.inputChangeEventControlledRestoreExecution
      .acceptedRestoreMetadataKinds.includes('input-checkbox-checked'),
    true
  );
  assert.equal(
    restoreExecution.publicControlledBehaviorBoundary.compatibilityClaimed,
    false
  );
  assert.equal(Object.hasOwn(dispatch.targetNode, '_valueTracker'), false);

  componentTree.detachHostInstanceToken(dispatch.token);
});

test('private controlled input fake-DOM value-tracker diagnostic rejects live DOM-like or inactive records', () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'fake-tracker-error'
  });
  const fakeInput = createControlledInputFakeDomTarget({
    value: 'alpha'
  });

  assert.throws(
    () =>
      gate.installFakeDomTracker(
        {
          hostTag: 'input',
          inputType: 'text'
        },
        {
          explicitAdmission: true,
          adapterKind: 'deterministic-fake-dom',
          targetKind: 'controlled-input-value-tracker',
          fakeTarget: {
            [resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker]:
              true,
            nodeType: 1,
            value: 'live-like'
          }
        }
      ),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fakeTarget must not be a DOM-like node'
    }
  );

  assert.throws(
    () =>
      gate.installFakeDomTracker(
        {hostTag: 'input', inputType: 'text'},
        {
          explicitAdmission: true,
          adapterKind: 'deterministic-fake-dom',
          targetKind: 'controlled-input-value-tracker',
          fakeTarget: {value: 'missing marker'}
        }
      ),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fakeTarget must carry the private fake DOM marker'
    }
  );

  assert.throws(() => gate.observeFakeDomTracker({}), {
    code:
      resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInvalidRecordCode,
    compatibilityTarget
  });

  const install = gate.installFakeDomTracker(
    {hostTag: 'input', inputType: 'text'},
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: fakeInput
    }
  );

  assert.throws(
    () =>
      gate.installFakeDomTracker(
        {hostTag: 'input', inputType: 'text'},
        {
          explicitAdmission: true,
          adapterKind: 'deterministic-fake-dom',
          targetKind: 'controlled-input-value-tracker',
          fakeTarget: fakeInput
        }
      ),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fakeTarget already has an active private fake DOM tracker record'
    }
  );

  const detach = gate.detachFakeDomTracker(install);
  assert.throws(() => gate.detachFakeDomTracker(detach), {
    code:
      resourceFormGate.privateControlledInputValueTrackerFakeDomDiagnosticInactiveRecordCode,
    compatibilityTarget
  });
  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromFakeDomObservation(install, {
        explicitAdmission: true
      }),
    {
      code:
        resourceFormGate.privateControlledInputRestoreQueueDiagnosticInvalidObservationCode,
      compatibilityTarget,
      operation: 'install',
      reason: 'source record must be an observed fake DOM tracker record'
    }
  );
  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromFakeDomObservation({}, {
        explicitAdmission: true
      }),
    {
      code:
        resourceFormGate.privateControlledInputRestoreQueueDiagnosticInvalidRecordCode,
      compatibilityTarget
    }
  );
  const freshInstall = gate.installFakeDomTracker(
    {hostTag: 'input', inputType: 'text'},
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget: createControlledInputFakeDomTarget({value: 'fresh'})
    }
  );
  const freshObservation = gate.observeFakeDomTracker(freshInstall);
  assert.throws(
    () =>
      gate.recordPostEventRestoreIntentFromFakeDomObservation(
        freshObservation,
        {
          queueKind: 'deterministic-fake-dom-post-event-restore-queue'
        }
      ),
    {
      code:
        resourceFormGate.privateControlledInputRestoreQueueDiagnosticInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'explicitAdmission must be true'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedControlledInputRestoreQueueDiagnosticError(
        {}
      ),
    {
      code:
        resourceFormGate.privateControlledInputRestoreQueueDiagnosticInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private controlled input wrapper property-payload gate records blocked rows only', () => {
  const first = createPrivateControlledWrapperPropertyPayloadScenario();
  const second = createPrivateControlledWrapperPropertyPayloadScenario();

  assert.deepEqual(first.records, second.records);
  assert.deepEqual(first.summary, second.summary);

  for (const record of first.records) {
    assert.equal(Object.isFrozen(record), true, record.requestType);
    assert.equal(
      resourceFormGate.isPrivateControlledInputWrapperPropertyPayloadRecord(
        record
      ),
      true,
      record.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateControlledInputWrapperPropertyPayloadRecordPayload(
        record
      ),
      record,
      record.requestType
    );
    assert.equal(record.status, resourceFormGate.unsupportedStatus);
    assert.equal(record.unsupportedCode, unsupportedCode);
    assert.equal(record.compatibilityTarget, compatibilityTarget);
    assert.equal(
      record.gateId,
      resourceFormGate.controlledInputPrivateWrapperGateId
    );
    assert.deepEqual(
      record.sideEffects,
      resourceFormGate.controlledInputPrivateWrapperSideEffects
    );
    assert.equal(record.sideEffects.controlsTracked, false);
    assert.equal(record.sideEffects.trackerAttached, false);
    assert.equal(record.sideEffects.hostValueRead, false);
    assert.equal(record.sideEffects.hostValueWritten, false);
    assert.equal(record.sideEffects.propertyDescriptorInstalled, false);
    assert.equal(record.sideEffects.hostWrapperInvoked, false);
    assert.equal(record.sideEffects.wrapperValidationInvoked, false);
    assert.equal(record.sideEffects.wrapperPropertyWritten, false);
    assert.equal(record.sideEffects.postEventRestoreQueued, false);
    assert.equal(record.sideEffects.latestPropsLookup, false);
    assert.equal(record.wrapperMetadata.deterministicMetadataOnly, true);
    assert.equal(record.wrapperMetadata.propertyPayloadRowAccepted, false);
    assert.equal(record.wrapperMetadata.ordinaryPayloadAccepted, false);
    assert.equal(record.wrapperMetadata.sourceAdapterInvoked, false);
    assert.equal(record.wrapperMetadata.liveHostNodeRequired, false);
    assert.equal(record.wrapperMetadata.rawTargetCaptured, false);
    assert.equal(record.wrapperMetadata.hostWrapperInvoked, false);
    assert.equal(record.wrapperMetadata.wrapperPropertyWritten, false);
    assert.equal(record.wrapperMetadata.trackerAttached, false);
    assert.equal(record.valueTrackerMetadata.trackerAttached, false);
    assert.equal(record.valueTrackerMetadata.currentValueSnapshot, null);
    assert.equal(record.postEventRestoreBoundary.latestPropsLookup, false);
    assert.equal(record.postEventRestoreBoundary.eventPluginDispatch, false);
    assert.equal(record.postEventRestoreBoundary.restoreQueued, false);
    assert.equal(record.postEventRestoreBoundary.restoreFlushed, false);
    assert.equal(
      record.publicControlledBehaviorBoundary.hostWrapperWrites,
      false
    );
    assert.equal(
      record.publicControlledBehaviorBoundary.compatibilityClaimed,
      false
    );
  }

  assert.deepEqual(
    first.records.map((record) => ({
      requestType: record.requestType,
      hostTag: record.hostTag,
      propName: record.propName,
      inputType: record.inputType,
      multiple: record.multiple,
      controlKind: record.controlKind,
      contractId: record.contractId,
      wrapperKind: record.wrapperMetadata.wrapperKind,
      wrapperOperations: record.wrapperMetadata.wrapperOperations,
      valueTrackerContractId:
        record.wrapperMetadata.valueTrackerContractId,
      trackedField: record.wrapperMetadata.trackedField,
      observedPropKeys: record.wrapperMetadata.observedPropKeys,
      propSummary: record.wrapperMetadata.propSummary
    })),
    [
      {
        requestType: 'controlled-wrapper.input.value',
        hostTag: 'input',
        propName: 'value',
        inputType: 'text',
        multiple: false,
        controlKind: 'value',
        contractId: 'input-wrapper-value-payload',
        wrapperKind: 'input-host-wrapper',
        wrapperOperations: ['validateInputProps', 'initInput', 'updateInput'],
        valueTrackerContractId: 'input-value-tracker',
        trackedField: 'value',
        observedPropKeys: ['type', 'value', 'onChange'],
        propSummary: {
          type: {present: true, value: {type: 'string', empty: false}},
          value: {present: true, value: {type: 'string', empty: false}},
          onChange: {present: true, value: {type: 'function'}}
        }
      },
      {
        requestType: 'controlled-wrapper.input.checked',
        hostTag: 'input',
        propName: 'checked',
        inputType: 'checkbox',
        multiple: false,
        controlKind: 'checked',
        contractId: 'input-wrapper-checked-payload',
        wrapperKind: 'input-host-wrapper',
        wrapperOperations: [
          'validateInputProps',
          'initInput',
          'updateInput',
          'restoreControlledInputState'
        ],
        valueTrackerContractId: 'input-checked-tracker',
        trackedField: 'checked',
        observedPropKeys: ['type', 'checked', 'onChange'],
        propSummary: {
          type: {present: true, value: {type: 'string', empty: false}},
          checked: {present: true, value: {type: 'boolean'}},
          onChange: {present: true, value: {type: 'function'}}
        }
      },
      {
        requestType: 'controlled-wrapper.select.multiple',
        hostTag: 'select',
        propName: 'multiple',
        inputType: null,
        multiple: true,
        controlKind: 'multiple',
        contractId: 'select-wrapper-multiple-payload',
        wrapperKind: 'select-host-wrapper',
        wrapperOperations: ['validateSelectProps', 'initSelect', 'updateSelect'],
        valueTrackerContractId: 'select-multiple-value-tracker',
        trackedField: 'selectedOptions',
        observedPropKeys: ['multiple', 'value', 'onChange'],
        propSummary: {
          multiple: {present: true, value: {type: 'boolean'}},
          value: {present: true, value: {type: 'object'}},
          onChange: {present: true, value: {type: 'function'}}
        }
      },
      {
        requestType: 'controlled-wrapper.textarea.value',
        hostTag: 'textarea',
        propName: 'value',
        inputType: null,
        multiple: false,
        controlKind: 'value',
        contractId: 'textarea-wrapper-value-payload',
        wrapperKind: 'textarea-host-wrapper',
        wrapperOperations: [
          'validateTextareaProps',
          'initTextarea',
          'updateTextarea'
        ],
        valueTrackerContractId: 'textarea-value-tracker',
        trackedField: 'value',
        observedPropKeys: ['value', 'onChange'],
        propSummary: {
          value: {present: true, value: {type: 'string', empty: false}},
          onChange: {present: true, value: {type: 'function'}}
        }
      }
    ]
  );

  assert.equal(
    first.summary.gateId,
    resourceFormGate.controlledInputPrivateWrapperGateId
  );
  assert.equal(first.summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(first.summary.contracts.length, 11);
  assert.deepEqual(
    first.summary.contracts.map((contract) => contract.id),
    [
      'input-wrapper-type-payload',
      'input-wrapper-name-payload',
      'input-wrapper-value-payload',
      'input-wrapper-default-value-payload',
      'input-wrapper-checked-payload',
      'input-wrapper-default-checked-payload',
      'select-wrapper-value-payload',
      'select-wrapper-default-value-payload',
      'select-wrapper-multiple-payload',
      'textarea-wrapper-value-payload',
      'textarea-wrapper-default-value-payload'
    ]
  );
  assert.deepEqual(
    first.summary.sideEffects,
    resourceFormGate.controlledInputPrivateWrapperSideEffects
  );
  assert.deepEqual(
    first.summary.postEventRestoreBoundary,
    resourceFormGate.describeControlledInputValueTrackerGate()
      .postEventRestoreBoundary
  );
});

test('private resource hint dispatcher metadata gate validates normalized shapes without dispatching', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-dispatcher-gate'
  });
  const records = [
    gate.recordResourceHintDispatcherRequest('C', [
      'https://connect.example.test',
      null
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: 'sha256-font',
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: 'high',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: 'print'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('m', [
      '/module-worker.mjs',
      {
        as: 'worker',
        crossOrigin: '',
        integrity: 'sha256-module-worker'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'low'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('X', [
      '/script.js',
      {
        crossOrigin: 'use-credentials',
        integrity: 'sha256-script',
        fetchPriority: 'high',
        nonce: 'nonce-script'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('M', [
      '/module-entry.mjs',
      {
        crossOrigin: '',
        integrity: 'sha256-module',
        nonce: 'nonce-module'
      }
    ])
  ];
  const summary =
    resourceFormGate.describePrivateResourceHintDispatcherMetadataGate();

  assert.deepEqual(records.map(summarizeDispatcherRecord), [
    {
      requestId: 'resource-dispatcher-gate:1',
      requestType: 'resource-hint-dispatcher.preconnect',
      contractId: 'preconnect',
      publicName: 'preconnect',
      privateDispatcherKey: 'C',
      argumentNames: ['href', 'crossOrigin'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {name: 'crossOrigin', type: 'null'}
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:2',
      requestType: 'resource-hint-dispatcher.preload',
      contractId: 'preload',
      publicName: 'preload',
      privateDispatcherKey: 'L',
      argumentNames: ['href', 'as', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {name: 'as', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: [
            'crossOrigin',
            'integrity',
            'nonce',
            'type',
            'fetchPriority',
            'referrerPolicy',
            'imageSrcSet',
            'imageSizes',
            'media'
          ],
          fields: [
            {name: 'crossOrigin', type: 'string', empty: true},
            {name: 'integrity', type: 'string', empty: false},
            {name: 'nonce', type: 'undefined'},
            {name: 'type', type: 'string', empty: false},
            {name: 'fetchPriority', type: 'string', empty: false},
            {name: 'referrerPolicy', type: 'undefined'},
            {name: 'imageSrcSet', type: 'undefined'},
            {name: 'imageSizes', type: 'undefined'},
            {name: 'media', type: 'string', empty: false}
          ]
        }
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:3',
      requestType: 'resource-hint-dispatcher.preload-module',
      contractId: 'preload-module',
      publicName: 'preloadModule',
      privateDispatcherKey: 'm',
      argumentNames: ['href', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: ['as', 'crossOrigin', 'integrity'],
          fields: [
            {name: 'as', type: 'string', empty: false},
            {name: 'crossOrigin', type: 'string', empty: true},
            {name: 'integrity', type: 'string', empty: false}
          ]
        }
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:4',
      requestType: 'resource-hint-dispatcher.preinit-style',
      contractId: 'preinit-style',
      publicName: 'preinit',
      privateDispatcherKey: 'S',
      argumentNames: ['href', 'precedence', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {name: 'precedence', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: ['crossOrigin', 'integrity', 'fetchPriority'],
          fields: [
            {name: 'crossOrigin', type: 'string', empty: true},
            {name: 'integrity', type: 'string', empty: false},
            {name: 'fetchPriority', type: 'string', empty: false}
          ]
        }
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:5',
      requestType: 'resource-hint-dispatcher.preinit-script',
      contractId: 'preinit-script',
      publicName: 'preinit',
      privateDispatcherKey: 'X',
      argumentNames: ['href', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: [
            'crossOrigin',
            'integrity',
            'fetchPriority',
            'nonce'
          ],
          fields: [
            {name: 'crossOrigin', type: 'string', empty: false},
            {name: 'integrity', type: 'string', empty: false},
            {name: 'fetchPriority', type: 'string', empty: false},
            {name: 'nonce', type: 'string', empty: false}
          ]
        }
      ]
    },
    {
      requestId: 'resource-dispatcher-gate:6',
      requestType: 'resource-hint-dispatcher.preinit-module-script',
      contractId: 'preinit-module-script',
      publicName: 'preinitModule',
      privateDispatcherKey: 'M',
      argumentNames: ['href', 'options'],
      argumentSummaries: [
        {name: 'href', type: 'string', empty: false},
        {
          name: 'options',
          type: 'object',
          exactOwnKeys: ['crossOrigin', 'integrity', 'nonce'],
          fields: [
            {name: 'crossOrigin', type: 'string', empty: true},
            {name: 'integrity', type: 'string', empty: false},
            {name: 'nonce', type: 'string', empty: false}
          ]
        }
      ]
    }
  ]);

  for (const record of records) {
    assert.equal(Object.isFrozen(record), true, record.requestType);
    assert.equal(
      resourceFormGate.isPrivateResourceHintDispatcherMetadataRecord(record),
      true,
      record.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateResourceHintDispatcherMetadataRecordPayload(
        record
      ),
      record,
      record.requestType
    );
    assert.equal(record.status, resourceFormGate.unsupportedStatus);
    assert.deepEqual(
      record.sideEffects,
      resourceFormGate.resourceHintDispatcherSideEffects
    );
    assert.equal(record.sideEffects.resourcesDispatched, false);
    assert.equal(record.sideEffects.privateDispatcherInvoked, false);
    assert.equal(record.sideEffects.sourceAdapterInvoked, false);
    assert.equal(record.sideEffects.documentMutated, false);
    assert.equal(record.sideEffects.headMutated, false);
    assert.equal(record.sideEffects.resourceElementCreated, false);
    assert.equal(record.sideEffects.stylesheetPrecedenceApplied, false);
    assert.equal(record.sideEffects.fizzInstructionEmitted, false);
    assert.equal(record.sideEffects.compatibilityClaimed, false);
  }

  assert.equal(summary.gateId, resourceFormGate.privateResourceHintDispatcherMetadataGateId);
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.deepEqual(summary.sideEffects, resourceFormGate.resourceHintDispatcherSideEffects);
  assert.deepEqual(
    summary.contracts.map((contract) => ({
      id: contract.id,
      publicName: contract.publicName,
      privateDispatcherKey: contract.privateDispatcherKey,
      argumentNames: contract.argumentNames
    })),
    [
      {
        id: 'preconnect',
        publicName: 'preconnect',
        privateDispatcherKey: 'C',
        argumentNames: ['href', 'crossOrigin']
      },
      {
        id: 'preload',
        publicName: 'preload',
        privateDispatcherKey: 'L',
        argumentNames: ['href', 'as', 'options']
      },
      {
        id: 'preload-module',
        publicName: 'preloadModule',
        privateDispatcherKey: 'm',
        argumentNames: ['href', 'options']
      },
      {
        id: 'preinit-style',
        publicName: 'preinit',
        privateDispatcherKey: 'S',
        argumentNames: ['href', 'precedence', 'options']
      },
      {
        id: 'preinit-script',
        publicName: 'preinit',
        privateDispatcherKey: 'X',
        argumentNames: ['href', 'options']
      },
      {
        id: 'preinit-module-script',
        publicName: 'preinitModule',
        privateDispatcherKey: 'M',
        argumentNames: ['href', 'options']
      }
    ]
  );
  assert.equal(JSON.stringify(records).includes('/font.woff2'), false);
  assert.equal(JSON.stringify(records).includes('sha256-script'), false);
  assert.equal(JSON.stringify(records).includes('/module-entry.mjs'), false);
  assert.equal(JSON.stringify(records).includes('nonce-module'), false);
});

test('private resource hint fake-DOM adapter gate admits normalized dispatcher records without side effects', () => {
  const dispatcherGate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-dispatcher-adapter-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'fake-dom-adapter'
  });
  const fakeDomLog = [];
  const fakeDocument = createThrowingFakeResourceDocument(fakeDomLog);
  const fakeHead = createThrowingFakeResourceHead(fakeDomLog);
  const records = [
    dispatcherGate.recordResourceHintDispatcherRequest('C', [
      'https://connect.example.test',
      null
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: 'sha256-font',
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: 'high',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: 'print'
      }
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('m', [
      '/module-worker.mjs',
      {
        as: 'worker',
        crossOrigin: '',
        integrity: 'sha256-module-worker'
      }
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'low'
      }
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('X', [
      '/script.js',
      {
        crossOrigin: 'use-credentials',
        integrity: 'sha256-script',
        fetchPriority: 'high',
        nonce: 'nonce-script'
      }
    ]),
    dispatcherGate.recordResourceHintDispatcherRequest('M', [
      '/module-entry.mjs',
      {
        crossOrigin: '',
        integrity: 'sha256-module',
        nonce: 'nonce-module'
      }
    ])
  ];
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'resource-hint-test-adapter',
      targetKind: 'document-head',
      fakeDocument,
      fakeHead
    })
  );
  const summary = resourceFormGate.describePrivateResourceHintFakeDomAdapterGate();

  assert.deepEqual(admissions.map(summarizeFakeDomAdapterAdmission), [
    {
      adapterAdmissionId: 'fake-dom-adapter:1',
      sourceRequestId: 'resource-dispatcher-adapter-source:1',
      requestType: 'resource-hint-fake-dom-adapter.preconnect',
      contractId: 'preconnect',
      privateDispatcherKey: 'C',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'link',
        relationship: 'preconnect',
        attributeNames: ['rel', 'href', 'crossOrigin']
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:2',
      sourceRequestId: 'resource-dispatcher-adapter-source:2',
      requestType: 'resource-hint-fake-dom-adapter.preload',
      contractId: 'preload',
      privateDispatcherKey: 'L',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'link',
        relationship: 'preload',
        attributeNames: [
          'rel',
          'href',
          'as',
          'crossOrigin',
          'integrity',
          'nonce',
          'type',
          'fetchPriority',
          'referrerPolicy',
          'imageSrcSet',
          'imageSizes',
          'media'
        ]
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:3',
      sourceRequestId: 'resource-dispatcher-adapter-source:3',
      requestType: 'resource-hint-fake-dom-adapter.preload-module',
      contractId: 'preload-module',
      privateDispatcherKey: 'm',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'link',
        relationship: 'modulepreload',
        attributeNames: ['rel', 'href', 'as', 'crossOrigin', 'integrity']
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:4',
      sourceRequestId: 'resource-dispatcher-adapter-source:4',
      requestType: 'resource-hint-fake-dom-adapter.preinit-style',
      contractId: 'preinit-style',
      privateDispatcherKey: 'S',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'link',
        relationship: 'stylesheet',
        attributeNames: [
          'rel',
          'href',
          'precedence',
          'crossOrigin',
          'integrity',
          'fetchPriority'
        ]
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:5',
      sourceRequestId: 'resource-dispatcher-adapter-source:5',
      requestType: 'resource-hint-fake-dom-adapter.preinit-script',
      contractId: 'preinit-script',
      privateDispatcherKey: 'X',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'script',
        relationship: 'script',
        attributeNames: [
          'src',
          'async',
          'crossOrigin',
          'integrity',
          'fetchPriority',
          'nonce'
        ]
      }
    },
    {
      adapterAdmissionId: 'fake-dom-adapter:6',
      sourceRequestId: 'resource-dispatcher-adapter-source:6',
      requestType: 'resource-hint-fake-dom-adapter.preinit-module-script',
      contractId: 'preinit-module-script',
      privateDispatcherKey: 'M',
      admissionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus,
      executionStatus:
        resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus,
      elementPlan: {
        elementTag: 'script',
        relationship: 'module-script',
        attributeNames: [
          'src',
          'async',
          'type',
          'crossOrigin',
          'integrity',
          'nonce'
        ]
      }
    }
  ]);

  for (let index = 0; index < admissions.length; index++) {
    const admission = admissions[index];
    assert.equal(Object.isFrozen(admission), true, admission.requestType);
    assert.equal(
      resourceFormGate.isPrivateResourceHintFakeDomAdapterAdmissionRecord(
        admission
      ),
      true,
      admission.requestType
    );
    assert.equal(
      resourceFormGate.getPrivateResourceHintFakeDomAdapterAdmissionRecordPayload(
        admission
      ),
      admission,
      admission.requestType
    );
    assert.equal(admission.status, resourceFormGate.unsupportedStatus);
    assert.equal(admission.unsupportedCode, unsupportedCode);
    assert.equal(admission.compatibilityTarget, compatibilityTarget);
    assert.equal(
      admission.compatibilityStatus,
      resourceFormGate.privateResourceHintFakeDomAdapterCompatibilityBlockedStatus
    );
    assert.deepEqual(
      admission.dispatcherShape,
      records[index].dispatcherShape
    );
    assert.deepEqual(
      admission.sideEffects,
      resourceFormGate.resourceHintFakeDomAdapterSideEffects
    );
    assert.equal(admission.sideEffects.fakeDomAdapterInvoked, false);
    assert.equal(admission.sideEffects.fakeDocumentRead, false);
    assert.equal(admission.sideEffects.fakeDocumentMutated, false);
    assert.equal(admission.sideEffects.fakeHeadRead, false);
    assert.equal(admission.sideEffects.fakeHeadMutated, false);
    assert.equal(admission.sideEffects.fakeResourceElementCreated, false);
    assert.equal(admission.sideEffects.fakeResourceElementInserted, false);
    assert.equal(admission.sideEffects.resourceFetchStarted, false);
    assert.equal(admission.sideEffects.resourceRecordCommitted, false);
    assert.equal(admission.sideEffects.compatibilityClaimed, false);
    assert.equal(admission.adapterAdmission.explicitAdmission, true);
    assert.equal(admission.adapterAdmission.deterministicFakeDomOnly, true);
    assert.equal(admission.adapterAdmission.rawAdapterCaptured, false);
    assert.equal(admission.adapterAdmission.rawDocumentCaptured, false);
    assert.equal(admission.adapterAdmission.rawHeadCaptured, false);
    assert.equal(admission.adapterAdmission.mutationMethodsCalled, false);
    assert.equal(admission.resourceElementPlan.rawValuesRetained, false);
    assert.equal(admission.resourceElementPlan.elementCreated, false);
    assert.equal(admission.resourceElementPlan.elementInserted, false);
    assert.equal(admission.resourceElementPlan.resourceFetchStarted, false);
    assert.equal(
      admission.resourceElementPlan.stylesheetPrecedenceApplied,
      false
    );
  }

  assert.equal(fakeDomLog.length, 0);
  assert.equal(summary.gateId, resourceFormGate.privateResourceHintFakeDomAdapterGateId);
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate.privateResourceHintFakeDomAdapterAdmissionRequiredStatus
  );
  assert.equal(
    summary.executionStatus,
    resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus
  );
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintFakeDomAdapterSideEffects
  );
  assert.deepEqual(
    summary.contracts.map((contract) => ({
      id: contract.id,
      privateDispatcherKey: contract.privateDispatcherKey,
      elementTag: contract.elementTag,
      relationship: contract.relationship
    })),
    [
      {
        id: 'preconnect',
        privateDispatcherKey: 'C',
        elementTag: 'link',
        relationship: 'preconnect'
      },
      {
        id: 'preload',
        privateDispatcherKey: 'L',
        elementTag: 'link',
        relationship: 'preload'
      },
      {
        id: 'preload-module',
        privateDispatcherKey: 'm',
        elementTag: 'link',
        relationship: 'modulepreload'
      },
      {
        id: 'preinit-style',
        privateDispatcherKey: 'S',
        elementTag: 'link',
        relationship: 'stylesheet'
      },
      {
        id: 'preinit-script',
        privateDispatcherKey: 'X',
        elementTag: 'script',
        relationship: 'script'
      },
      {
        id: 'preinit-module-script',
        privateDispatcherKey: 'M',
        elementTag: 'script',
        relationship: 'module-script'
      }
    ]
  );
  assert.equal(JSON.stringify(admissions).includes('/font.woff2'), false);
  assert.equal(JSON.stringify(admissions).includes('sha256-style'), false);
  assert.equal(JSON.stringify(admissions).includes('nonce-script'), false);
  assert.equal(JSON.stringify(admissions).includes('/module-entry.mjs'), false);
  assert.equal(JSON.stringify(admissions).includes('nonce-module'), false);
});

test('private resource hint fake-DOM insertion gate admits one deterministic preload record only', () => {
  const dispatcherGate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-dispatcher-insertion-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'fake-dom-insertion-adapter'
  });
  const insertionGate = resourceFormGate.createResourceHintFakeDomInsertionGate({
    requestIdPrefix: 'fake-dom-insertion'
  });
  const fakeDom = createDeterministicFakeResourceDom();
  const dispatcherRecord = dispatcherGate.recordResourceHintDispatcherRequest(
    'L',
    [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: 'sha256-font',
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: 'high',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: 'print'
      }
    ]
  );
  const adapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherRecord,
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'resource-hint-insertion-adapter',
      targetKind: 'document-head'
    }
  );
  const insertion = insertionGate.insertAdapterAdmissionRecord(
    adapterAdmission,
    {
      explicitInsertion: true,
      insertionKind: 'deterministic-fake-dom-head-append',
      insertionId: 'preload-font-private-diagnostic',
      targetKind: 'document-head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintFakeDomInsertionGate();

  assert.equal(Object.isFrozen(insertion), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintFakeDomInsertionRecord(insertion),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintFakeDomInsertionRecordPayload(
      insertion
    ),
    insertion
  );
  assert.deepEqual(summarizeFakeDomInsertion(insertion), {
    insertionId: 'fake-dom-insertion:1',
    sourceAdapterAdmissionId: 'fake-dom-insertion-adapter:1',
    sourceRequestId: 'resource-dispatcher-insertion-source:1',
    requestType: 'resource-hint-fake-dom-insertion.preload',
    contractId: 'preload',
    privateDispatcherKey: 'L',
    insertionStatus:
      resourceFormGate.privateResourceHintFakeDomInsertionStatus,
    executionStatus:
      resourceFormGate.privateResourceHintFakeDomInsertionExecutionStatus,
    elementPlan: {
      elementTag: 'link',
      relationship: 'preload',
      insertionMethod: 'appendChild',
      attributeNames: [
        'rel',
        'href',
        'as',
        'crossOrigin',
        'integrity',
        'type',
        'fetchPriority',
        'media'
      ]
    }
  });
  assert.equal(insertion.status, resourceFormGate.unsupportedStatus);
  assert.equal(insertion.unsupportedCode, unsupportedCode);
  assert.equal(insertion.compatibilityTarget, compatibilityTarget);
  assert.equal(
    insertion.compatibilityStatus,
    resourceFormGate.privateResourceHintFakeDomInsertionCompatibilityBlockedStatus
  );
  assert.deepEqual(
    insertion.sideEffects,
    resourceFormGate.resourceHintFakeDomInsertionSideEffects
  );
  assert.equal(insertion.sideEffects.fakeDomInsertionGateInvoked, true);
  assert.equal(insertion.sideEffects.fakeHeadMutated, true);
  assert.equal(insertion.sideEffects.fakeResourceElementCreated, true);
  assert.equal(insertion.sideEffects.fakeResourceElementInserted, true);
  assert.equal(
    insertion.sideEffects.fakeResourceElementAttributesApplied,
    true
  );
  assert.equal(insertion.sideEffects.resourceFetchStarted, false);
  assert.equal(insertion.sideEffects.realDocumentMutated, false);
  assert.equal(insertion.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(insertion.sideEffects.publicRootTouched, false);
  assert.equal(insertion.sideEffects.compatibilityClaimed, false);
  assert.equal(insertion.insertionAdmission.explicitInsertion, true);
  assert.equal(
    insertion.insertionAdmission.deterministicFakeDomOnly,
    true
  );
  assert.equal(insertion.insertionAdmission.rawDocumentCaptured, false);
  assert.equal(insertion.insertionAdmission.rawHeadCaptured, false);
  assert.equal(insertion.insertionAdmission.rawElementCaptured, false);
  assert.equal(insertion.resourceElementPlan.rawValuesRetained, false);
  assert.equal(insertion.resourceElementPlan.elementCreated, true);
  assert.equal(insertion.resourceElementPlan.elementInserted, true);
  assert.equal(insertion.resourceElementPlan.resourceFetchStarted, false);
  assert.equal(
    insertion.resourceElementPlan.publicResourceHintDomInsertion,
    false
  );
  assert.equal(
    insertion.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(insertion.publicResourceBoundary.publicDispatcherInvoked, false);
  assert.equal(insertion.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(insertion.publicResourceBoundary.realHeadMutated, false);
  assert.equal(insertion.publicResourceBoundary.compatibilityClaimed, false);
  assert.equal(fakeDom.head.childNodes.length, 1);
  assert.equal(fakeDom.head.childNodes[0].nodeName, 'LINK');
  assert.deepEqual(fakeDom.head.childNodes[0].attributes, {
    rel: 'preload',
    href: '[fast-react-redacted-resource-hint:href]',
    as: '[fast-react-redacted-resource-hint:as]',
    crossOrigin: '',
    integrity: '[fast-react-redacted-resource-hint:integrity]',
    type: '[fast-react-redacted-resource-hint:type]',
    fetchPriority: '[fast-react-redacted-resource-hint:fetchPriority]',
    media: '[fast-react-redacted-resource-hint:media]'
  });
  assert.deepEqual(fakeDom.log.map((entry) => entry.type), [
    'document.createElement',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'head.appendChild'
  ]);
  assert.equal(JSON.stringify(insertion).includes('/font.woff2'), false);
  assert.equal(JSON.stringify(insertion).includes('sha256-font'), false);
  assert.equal(JSON.stringify(insertion).includes('font/woff2'), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintFakeDomInsertionGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate.privateResourceHintFakeDomInsertionAdmissionRequiredStatus
  );
  assert.deepEqual(summary.acceptsContractIds, ['preconnect', 'preload']);
  assert.equal(summary.maxInsertionsPerGate, 1);
  assert.equal(summary.publicResourceHintDomInsertion, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintFakeDomInsertionBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintFakeDomInsertionError(
      insertion
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintFakeDomInsertionGateErrorCode
  );
  assert.equal(error.exportName, 'resource-hint-fake-dom-insertion.preload');
  assert.equal(error.insertionId, 'fake-dom-insertion:1');
  assert.equal(error.sourceAdapterAdmissionId, 'fake-dom-insertion-adapter:1');
  assert.equal(error.contractId, 'preload');
  assert.equal(
    error.executionStatus,
    resourceFormGate.privateResourceHintFakeDomInsertionExecutionStatus
  );
  assert.deepEqual(
    error.sideEffects,
    resourceFormGate.resourceHintFakeDomInsertionSideEffects
  );

  assert.throws(
    () =>
      insertionGate.insertAdapterAdmissionRecord(adapterAdmission, {
        explicitInsertion: true,
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head
      }),
    {
      code:
        resourceFormGate.privateResourceHintFakeDomInsertionInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'fake DOM insertion gate admits exactly one record'
    }
  );

  const preinitAdapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherGate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'low'
      }
    ]),
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintFakeDomInsertionGate()
        .insertAdapterAdmissionRecord(preinitAdapterAdmission, {
          explicitInsertion: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head
        }),
    {
      code:
        resourceFormGate.privateResourceHintFakeDomInsertionInvalidRecordCode,
      compatibilityTarget,
      contractId: 'preinit-style'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintFakeDomInsertionGate()
        .insertAdapterAdmissionRecord(adapterAdmission, {
          explicitInsertion: true,
          fakeDocument: {
            createElement() {
              return {};
            }
          },
          fakeHead: {
            appendChild() {}
          }
        }),
    {
      code:
        resourceFormGate.privateResourceHintFakeDomInsertionInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'fakeDocument must be an explicit deterministic fake resource document'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintFakeDomInsertionError({}),
    {
      code:
        resourceFormGate.privateResourceHintFakeDomInsertionInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint head-singleton boundary observes fake-DOM insertion and update only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'head-boundary-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'head-boundary-adapter'
  });
  const insertionGate = resourceFormGate.createResourceHintFakeDomInsertionGate({
    requestIdPrefix: 'head-boundary-insertion'
  });
  const headBoundaryGate =
    resourceFormGate.createResourceHintHeadBoundaryGate({
      requestIdPrefix: 'head-boundary'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const dispatcherRecord = gate.recordResourceHintDispatcherRequest('C', [
    'https://connect.example.test',
    ''
  ]);
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('head singleton props')
  ]);
  const adapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherRecord,
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      adapterId: 'head-boundary-resource-adapter',
      targetKind: 'document-head'
    }
  );
  const insertion = insertionGate.insertAdapterAdmissionRecord(
    adapterAdmission,
    {
      explicitInsertion: true,
      insertionKind: 'deterministic-fake-dom-head-append',
      insertionId: 'preconnect-head-boundary-insertion',
      targetKind: 'document-head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const boundary = headBoundaryGate.recordInsertionUpdateBoundary(
    insertion,
    headRecord,
    {
      explicitBoundary: true,
      boundaryKind:
        'deterministic-fake-dom-head-singleton-insertion-update',
      boundaryId: 'preconnect-head-boundary-update',
      targetKind: 'document-head',
      hostTag: 'head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintHeadBoundaryGate();

  assert.equal(Object.isFrozen(boundary), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintHeadBoundaryRecord(boundary),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintHeadBoundaryRecordPayload(
      boundary
    ),
    boundary
  );
  assert.deepEqual(summarizeHeadBoundary(boundary), {
    boundaryId: 'head-boundary:1',
    sourceInsertionId: 'head-boundary-insertion:1',
    sourceHeadRequestId: 'head-boundary-source:2',
    requestType: 'resource-hint-head-singleton-boundary.preconnect',
    contractId: 'preconnect',
    boundaryContractId: 'preconnect-head-singleton-boundary',
    headContractId: 'head-singleton',
    hostTag: 'head',
    boundaryStatus: resourceFormGate.privateResourceHintHeadBoundaryStatus,
    executionStatus:
      resourceFormGate.privateResourceHintHeadBoundaryExecutionStatus,
    elementPlan: {
      elementTag: 'link',
      relationship: 'preconnect',
      insertedElementObserved: true,
      updateApplied: true,
      updateAttributeNames: ['data-fast-react-head-boundary']
    }
  });
  assert.equal(boundary.status, resourceFormGate.unsupportedStatus);
  assert.equal(boundary.unsupportedCode, unsupportedCode);
  assert.equal(boundary.compatibilityTarget, compatibilityTarget);
  assert.equal(
    boundary.compatibilityStatus,
    resourceFormGate.privateResourceHintHeadBoundaryCompatibilityBlockedStatus
  );
  assert.deepEqual(
    boundary.sideEffects,
    resourceFormGate.resourceHintHeadBoundarySideEffects
  );
  assert.equal(boundary.sideEffects.singletonsResolved, false);
  assert.equal(boundary.sideEffects.fakeHeadBoundaryInvoked, true);
  assert.equal(boundary.sideEffects.fakeHeadInsertionObserved, true);
  assert.equal(boundary.sideEffects.fakeHeadUpdateApplied, true);
  assert.equal(boundary.sideEffects.fakeHeadMutated, true);
  assert.equal(boundary.sideEffects.fakeResourceElementInserted, false);
  assert.equal(
    boundary.sideEffects.fakeResourceElementAttributesApplied,
    true
  );
  assert.equal(boundary.sideEffects.headSingletonResolved, false);
  assert.equal(boundary.sideEffects.headSingletonAcquired, false);
  assert.equal(boundary.sideEffects.headSingletonReleased, false);
  assert.equal(boundary.sideEffects.headChildrenCleared, false);
  assert.equal(boundary.sideEffects.publicHeadSingletonBehavior, false);
  assert.equal(boundary.sideEffects.realDocumentMutated, false);
  assert.equal(boundary.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(boundary.sideEffects.publicRootTouched, false);
  assert.equal(boundary.sideEffects.compatibilityClaimed, false);
  assert.equal(boundary.sourceInsertion.elementInserted, true);
  assert.equal(
    boundary.sourceInsertion.publicResourceHintDomInsertion,
    false
  );
  assert.equal(boundary.sourceHeadRequest.singletonsResolved, false);
  assert.equal(
    boundary.sourceHeadRequest.compatibilityClaimed,
    false
  );
  assert.equal(boundary.boundaryAdmission.rawDocumentCaptured, false);
  assert.equal(boundary.boundaryAdmission.rawHeadCaptured, false);
  assert.equal(boundary.boundaryAdmission.rawElementCaptured, false);
  assert.equal(
    boundary.boundaryAdmission.singletonResolutionAllowed,
    false
  );
  assert.equal(
    boundary.boundaryAdmission.publicHeadSingletonBehavior,
    false
  );
  assert.equal(boundary.resourceElementPlan.rawValuesRetained, false);
  assert.equal(
    boundary.resourceElementPlan.singletonResolutionAllowed,
    false
  );
  assert.equal(
    boundary.resourceElementPlan.singletonOwnershipClaimed,
    false
  );
  assert.equal(
    boundary.resourceElementPlan.publicHeadSingletonBehavior,
    false
  );
  assert.equal(
    boundary.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(boundary.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(
    boundary.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(
    boundary.publicHeadBoundary.singletonResolutionReachable,
    false
  );
  assert.equal(boundary.publicHeadBoundary.realDocumentMutated, false);
  assert.equal(boundary.publicHeadBoundary.compatibilityClaimed, false);
  assert.equal(fakeDom.head.childNodes.length, 1);
  assert.deepEqual(fakeDom.head.childNodes[0].attributes, {
    rel: 'preconnect',
    href: '[fast-react-redacted-resource-hint:href]',
    crossOrigin: '',
    'data-fast-react-head-boundary':
      '[fast-react-head-boundary:resource-hint-insertion-update]'
  });
  assert.deepEqual(fakeDom.log.map((entry) => entry.type), [
    'document.createElement',
    'element.setAttribute',
    'element.setAttribute',
    'element.setAttribute',
    'head.appendChild',
    'element.setAttribute'
  ]);
  assert.equal(JSON.stringify(boundary).includes('connect.example'), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintHeadBoundaryGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate.privateResourceHintHeadBoundaryAdmissionRequiredStatus
  );
  assert.deepEqual(summary.acceptsContractIds, ['preconnect', 'preload']);
  assert.equal(summary.acceptedHostTag, 'head');
  assert.equal(summary.maxBoundariesPerGate, 1);
  assert.equal(summary.publicResourceHintDomInsertion, false);
  assert.equal(summary.publicHeadSingletonBehavior, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintHeadBoundaryBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintHeadBoundaryError(boundary);
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintHeadBoundaryGateErrorCode
  );
  assert.equal(
    error.exportName,
    'resource-hint-head-singleton-boundary.preconnect'
  );
  assert.equal(error.boundaryId, 'head-boundary:1');
  assert.equal(error.sourceInsertionId, 'head-boundary-insertion:1');
  assert.equal(error.sourceHeadRequestId, 'head-boundary-source:2');
  assert.equal(error.boundaryContractId, 'preconnect-head-singleton-boundary');
  assert.equal(error.hostTag, 'head');
  assert.deepEqual(
    error.sideEffects,
    resourceFormGate.resourceHintHeadBoundarySideEffects
  );

  assert.throws(
    () =>
      headBoundaryGate.recordInsertionUpdateBoundary(insertion, headRecord, {
        explicitBoundary: true,
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head
      }),
    {
      code:
        resourceFormGate.privateResourceHintHeadBoundaryInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'head boundary gate admits exactly one insertion/update record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintHeadBoundaryGate()
        .recordInsertionUpdateBoundary(
          insertion,
          gate.recordSingletonRequest('body', []),
          {
            explicitBoundary: true,
            fakeDocument: fakeDom.document,
            fakeHead: fakeDom.head
          }
        ),
    {
      code: resourceFormGate.privateResourceHintHeadBoundaryInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintHeadBoundaryGate()
        .recordInsertionUpdateBoundary(insertion, headRecord, {
          explicitBoundary: true,
          fakeDocument: createDeterministicFakeResourceDom().document,
          fakeHead: createDeterministicFakeResourceDom().head
        }),
    {
      code:
        resourceFormGate.privateResourceHintHeadBoundaryInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'fakeHead must belong to the deterministic fake resource document'
    }
  );
  assert.throws(
    () => resourceFormGate.createUnsupportedResourceHintHeadBoundaryError({}),
    {
      code: resourceFormGate.privateResourceHintHeadBoundaryInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint head clear/retain diagnostic records singleton and resource rows only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'head-clear-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'head-clear-adapter'
  });
  const insertionGate = resourceFormGate.createResourceHintFakeDomInsertionGate({
    requestIdPrefix: 'head-clear-insertion'
  });
  const headBoundaryGate =
    resourceFormGate.createResourceHintHeadBoundaryGate({
      requestIdPrefix: 'head-clear-boundary'
    });
  const clearRetainGate =
    resourceFormGate.createResourceHintHeadClearRetainGate({
      requestIdPrefix: 'head-clear-retain'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const dispatcherRecord = gate.recordResourceHintDispatcherRequest('C', [
    'https://connect.example.test',
    ''
  ]);
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('head clear props')
  ]);
  const adapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherRecord,
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    }
  );
  const insertion = insertionGate.insertAdapterAdmissionRecord(
    adapterAdmission,
    {
      explicitInsertion: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const boundary = headBoundaryGate.recordInsertionUpdateBoundary(
    insertion,
    headRecord,
    {
      explicitBoundary: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  appendFakeHeadChild(fakeDom, 'script');
  appendFakeHeadChild(fakeDom, 'style');
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme'
  });
  appendFakeHeadChild(fakeDom, 'meta', {
    name: 'description'
  });

  const diagnostic = clearRetainGate.recordHeadClearRetainDiagnostic(
    boundary,
    {
      explicitClearRetain: true,
      clearRetainKind: 'deterministic-fake-dom-head-clear-retain',
      clearRetainId: 'preconnect-head-clear-retain',
      targetKind: 'document-head',
      hostTag: 'head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintHeadClearRetainGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintHeadClearRetainRecord(diagnostic),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintHeadClearRetainRecordPayload(
      diagnostic
    ),
    diagnostic
  );
  assert.deepEqual(summarizeHeadClearRetain(diagnostic), {
    clearRetainId: 'head-clear-retain:1',
    sourceBoundaryId: 'head-clear-boundary:1',
    sourceInsertionId: 'head-clear-insertion:1',
    sourceHeadRequestId: 'head-clear-source:2',
    requestType: 'resource-hint-head-clear-retain.preconnect',
    contractId: 'preconnect',
    hostTag: 'head',
    clearRetainStatus:
      resourceFormGate.privateResourceHintHeadClearRetainStatus,
    executionStatus:
      resourceFormGate.privateResourceHintHeadClearRetainExecutionStatus,
    singletonRow: {
      rowType: 'host-singleton',
      retainedChildCount: 3,
      clearableChildCount: 2,
      actualHeadChildrenCleared: false
    },
    resourceHintRow: {
      rowType: 'resource-hint',
      childIndex: 0,
      nodeName: 'LINK',
      relationship: 'preconnect',
      clearRetainDecision: 'clear',
      clearReason: 'resource-hint-hoistable-marker-blocked',
      resourceHoistableRetentionBlocked: true
    },
    fakeHeadPlan: {
      childCount: 5,
      retainedChildCount: 3,
      clearableChildCount: 2,
      clearApplied: false
    }
  });
  assert.equal(diagnostic.status, resourceFormGate.unsupportedStatus);
  assert.equal(diagnostic.unsupportedCode, unsupportedCode);
  assert.equal(diagnostic.compatibilityTarget, compatibilityTarget);
  assert.equal(
    diagnostic.compatibilityStatus,
    resourceFormGate.privateResourceHintHeadClearRetainCompatibilityBlockedStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintHeadClearRetainSideEffects
  );
  assert.equal(diagnostic.sideEffects.fakeHeadRead, true);
  assert.equal(
    diagnostic.sideEffects.fakeHeadClearRetainDiagnosticInvoked,
    true
  );
  assert.equal(diagnostic.sideEffects.fakeHeadChildrenScanned, true);
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, false);
  assert.equal(diagnostic.sideEffects.fakeHeadChildRemoved, false);
  assert.equal(diagnostic.sideEffects.headChildrenCleared, false);
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceApplied,
    false
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceBlockedCapabilitiesRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.realDocumentMutated, false);
  assert.equal(diagnostic.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(diagnostic.sideEffects.publicHeadSingletonBehavior, false);
  assert.equal(diagnostic.sideEffects.compatibilityClaimed, false);
  assert.equal(diagnostic.clearRetainAdmission.rawDocumentCaptured, false);
  assert.equal(diagnostic.clearRetainAdmission.rawHeadCaptured, false);
  assert.equal(diagnostic.clearRetainAdmission.fakeHeadRemovalAllowed, false);
  assert.equal(
    diagnostic.clearRetainAdmission.stylesheetPrecedenceAllowed,
    false
  );
  assert.deepEqual(
    diagnostic.headChildRows.map((row) => ({
      childIndex: row.childIndex,
      nodeName: row.nodeName,
      relationship: row.relationship,
      sourceResourceHint: row.sourceResourceHint,
      clearRetainDecision: row.clearRetainDecision,
      retainReason: row.retainReason,
      clearReason: row.clearReason,
      stylesheetPrecedenceCandidate:
        row.stylesheetPrecedenceCandidate,
      actualNodeRemoved: row.actualNodeRemoved
    })),
    [
      {
        childIndex: 0,
        nodeName: 'LINK',
        relationship: 'preconnect',
        sourceResourceHint: true,
        clearRetainDecision: 'clear',
        retainReason: null,
        clearReason: 'resource-hint-hoistable-marker-blocked',
        stylesheetPrecedenceCandidate: false,
        actualNodeRemoved: false
      },
      {
        childIndex: 1,
        nodeName: 'SCRIPT',
        relationship: null,
        sourceResourceHint: false,
        clearRetainDecision: 'retain',
        retainReason: 'script',
        clearReason: null,
        stylesheetPrecedenceCandidate: false,
        actualNodeRemoved: false
      },
      {
        childIndex: 2,
        nodeName: 'STYLE',
        relationship: null,
        sourceResourceHint: false,
        clearRetainDecision: 'retain',
        retainReason: 'style',
        clearReason: null,
        stylesheetPrecedenceCandidate: false,
        actualNodeRemoved: false
      },
      {
        childIndex: 3,
        nodeName: 'LINK',
        relationship: 'stylesheet',
        sourceResourceHint: false,
        clearRetainDecision: 'retain',
        retainReason: 'stylesheet-link',
        clearReason: null,
        stylesheetPrecedenceCandidate: true,
        actualNodeRemoved: false
      },
      {
        childIndex: 4,
        nodeName: 'META',
        relationship: null,
        sourceResourceHint: false,
        clearRetainDecision: 'clear',
        retainReason: null,
        clearReason: 'unretained-head-child',
        stylesheetPrecedenceCandidate: false,
        actualNodeRemoved: false
      }
    ]
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.stylesheetPrecedenceRowsObserved,
    true
  );
  assert.equal(diagnostic.stylesheetPrecedenceBoundary.stylesheetRowCount, 1);
  assert.deepEqual(
    diagnostic.stylesheetPrecedenceBoundary.blockedCapabilities,
    resourceFormGate.resourceHintHeadStylesheetPrecedenceBlockedCapabilities
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintHeadClearRetainBlockedCapabilities
  );
  assert.equal(
    diagnostic.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(
    diagnostic.publicHeadBoundary.headChildrenCleared,
    false
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(fakeDom.head.childNodes.length, 5);
  assert.equal(fakeDom.head.childNodes[4].nodeName, 'META');
  assert.equal(JSON.stringify(diagnostic).includes('connect.example'), false);
  assert.equal(JSON.stringify(diagnostic).includes('theme'), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintHeadClearRetainGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate.privateResourceHintHeadClearRetainAdmissionRequiredStatus
  );
  assert.deepEqual(summary.acceptsContractIds, ['preconnect', 'preload']);
  assert.equal(summary.maxDiagnosticsPerGate, 1);
  assert.equal(summary.mutatesFakeHead, false);
  assert.equal(summary.mutatesRealHead, false);
  assert.equal(summary.clearsHeadChildren, false);
  assert.equal(summary.recordsSingletonRows, true);
  assert.equal(summary.recordsResourceHintRows, true);
  assert.deepEqual(
    summary.blockedCapabilities,
    resourceFormGate.resourceHintHeadClearRetainBlockedCapabilities
  );
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintHeadClearRetainBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintHeadClearRetainError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintHeadClearRetainGateErrorCode
  );
  assert.equal(
    error.exportName,
    'resource-hint-head-clear-retain.preconnect'
  );
  assert.equal(error.clearRetainId, 'head-clear-retain:1');
  assert.equal(error.sourceBoundaryId, 'head-clear-boundary:1');
  assert.equal(error.sourceInsertionId, 'head-clear-insertion:1');
  assert.equal(error.sourceHeadRequestId, 'head-clear-source:2');
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintHeadClearRetainBlockedCapabilities
  );

  assert.throws(
    () =>
      clearRetainGate.recordHeadClearRetainDiagnostic(boundary, {
        explicitClearRetain: true,
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head
      }),
    {
      code:
        resourceFormGate.privateResourceHintHeadClearRetainInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'head clear/retain gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintHeadClearRetainGate()
        .recordHeadClearRetainDiagnostic(insertion, {
          explicitClearRetain: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head
        }),
    {
      code: resourceFormGate.privateResourceHintHeadClearRetainInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintHeadClearRetainGate()
        .recordHeadClearRetainDiagnostic(boundary, {
          explicitClearRetain: true,
          fakeDocument: createDeterministicFakeResourceDom().document,
          fakeHead: createDeterministicFakeResourceDom().head
        }),
    {
      code:
        resourceFormGate.privateResourceHintHeadClearRetainInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'fakeHead must belong to the deterministic fake resource document'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintHeadClearRetainError({}),
    {
      code: resourceFormGate.privateResourceHintHeadClearRetainInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint preload/preinit order diagnostic records dedupe and precedence evidence only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'preload-preinit-order-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'preload-preinit-order-adapter'
  });
  const orderGate =
    resourceFormGate.createResourceHintPreloadPreinitOrderGate({
      requestIdPrefix: 'preload-preinit-order'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const records = [
    gate.recordResourceHintDispatcherRequest('L', [
      '/style.css',
      'style',
      {
        crossOrigin: undefined,
        integrity: undefined,
        nonce: undefined,
        type: undefined,
        fetchPriority: 'low',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style-dupe',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/script.js',
      'script',
      {
        crossOrigin: undefined,
        integrity: 'sha256-script-preload',
        nonce: undefined,
        type: undefined,
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('X', [
      '/script.js',
      {
        crossOrigin: undefined,
        integrity: 'sha256-script',
        fetchPriority: 'high',
        nonce: 'nonce-script'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('m', [
      '/module.mjs',
      {
        as: undefined,
        crossOrigin: '',
        integrity: 'sha256-module-preload'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('M', [
      '/module.mjs',
      {
        crossOrigin: '',
        integrity: 'sha256-module',
        nonce: 'nonce-module'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: undefined,
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ])
  ];
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    })
  );
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'style-main',
    'data-fast-react-precedence-key': 'precedence-theme'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'style',
    'data-fast-react-resource-key': 'style-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'script',
    'data-fast-react-resource-key': 'script-main'
  });
  appendFakeHeadChild(fakeDom, 'script', {
    'data-fast-react-resource-key': 'script-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'modulepreload',
    'data-fast-react-resource-key': 'module-main'
  });
  appendFakeHeadChild(fakeDom, 'script', {
    type: 'module',
    'data-fast-react-resource-key': 'module-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'font',
    'data-fast-react-resource-key': 'font-main'
  });

  const diagnostic = orderGate.recordPreloadPreinitOrderDiagnostic(
    admissions,
    {
      explicitOrderDiagnostic: true,
      orderKind: 'deterministic-fake-dom-preload-preinit-dedupe-order',
      orderId: 'preload-preinit-dedupe-order',
      targetKind: 'document-head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head,
      resourceDescriptors: [
        {
          sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main'
        },
        {
          sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-theme'
        },
        {
          sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-theme'
        },
        {
          sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'script-main'
        },
        {
          sourceAdapterAdmissionId: admissions[4].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'script-main'
        },
        {
          sourceAdapterAdmissionId: admissions[5].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'module-main'
        },
        {
          sourceAdapterAdmissionId: admissions[6].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'module-main'
        },
        {
          sourceAdapterAdmissionId: admissions[7].adapterAdmissionId,
          resourceKind: 'font',
          resourceKey: 'font-main'
        }
      ]
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintPreloadPreinitOrderGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintPreloadPreinitOrderRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintPreloadPreinitOrderRecordPayload(
      diagnostic
    ),
    diagnostic
  );
  assert.deepEqual(summarizePreloadPreinitOrder(diagnostic), {
    orderDiagnosticId: 'preload-preinit-order:1',
    requestType: 'resource-hint-preload-preinit-dedupe-order',
    orderStatus:
      resourceFormGate.privateResourceHintPreloadPreinitOrderStatus,
    executionStatus:
      resourceFormGate.privateResourceHintPreloadPreinitOrderExecutionStatus,
    dedupeActions: [
      'insert-preload',
      'preinit-adopts-preload',
      'dedupe-preinit',
      'insert-preload',
      'preinit-adopts-preload',
      'insert-preload',
      'preinit-adopts-preload',
      'insert-preload'
    ],
    plannedContractIds: [
      'preinit-style',
      'preload',
      'preload',
      'preinit-script',
      'preload-module',
      'preinit-module-script',
      'preload'
    ],
    observedNodeNames: [
      'LINK',
      'LINK',
      'LINK',
      'SCRIPT',
      'LINK',
      'SCRIPT',
      'LINK'
    ],
    resourceMapPlan: {
      uniqueResourceCount: 4,
      preloadResourceCount: 4,
      preinitResourceCount: 3,
      scriptModuleRowCount: 4,
      dedupedRowCount: 1
    }
  });
  assert.equal(diagnostic.status, resourceFormGate.unsupportedStatus);
  assert.equal(diagnostic.unsupportedCode, unsupportedCode);
  assert.equal(diagnostic.compatibilityTarget, compatibilityTarget);
  assert.equal(
    diagnostic.compatibilityStatus,
    resourceFormGate
      .privateResourceHintPreloadPreinitOrderCompatibilityBlockedStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintPreloadPreinitOrderSideEffects
  );
  assert.equal(diagnostic.sideEffects.fakeHeadRead, true);
  assert.equal(diagnostic.sideEffects.fakeHeadChildrenScanned, true);
  assert.equal(
    diagnostic.sideEffects.fakePreloadPreinitOrderDiagnosticInvoked,
    true
  );
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, false);
  assert.equal(
    diagnostic.sideEffects.fakeHeadInsertionOrderObserved,
    true
  );
  assert.equal(
    diagnostic.sideEffects.fakeHeadInsertionOrderMutated,
    false
  );
  assert.equal(diagnostic.sideEffects.resourceHintDedupeRowsRecorded, true);
  assert.equal(
    diagnostic.sideEffects.resourceHintPrecedenceRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.resourceHintHeadOrderRowsRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.scriptModulePreinitRowsRecorded, true);
  assert.equal(
    diagnostic.sideEffects.scriptModuleFakeHeadOrderRowsRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.modulePreloadStarted, false);
  assert.equal(diagnostic.sideEffects.scriptPreinitStarted, false);
  assert.equal(diagnostic.sideEffects.moduleScriptPreinitStarted, false);
  assert.equal(diagnostic.sideEffects.scriptExecutionStarted, false);
  assert.equal(
    diagnostic.sideEffects.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(diagnostic.sideEffects.preloadPreinitResourceMapCreated, false);
  assert.equal(diagnostic.sideEffects.preloadPreinitResourceMapMutated, false);
  assert.equal(diagnostic.sideEffects.realDocumentMutated, false);
  assert.equal(diagnostic.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(
    diagnostic.sideEffects.publicPreloadPreinitDedupeBehavior,
    false
  );
  assert.equal(diagnostic.sideEffects.compatibilityClaimed, false);
  assert.equal(diagnostic.orderAdmission.rawDocumentCaptured, false);
  assert.equal(diagnostic.orderAdmission.rawHeadCaptured, false);
  assert.equal(diagnostic.orderAdmission.resourceMapCreationAllowed, false);
  assert.equal(diagnostic.orderAdmission.fakeHeadMutationAllowed, false);
  assert.equal(diagnostic.orderAdmission.realHeadMutationAllowed, false);
  assert.deepEqual(
    diagnostic.dedupeRows.map((row) => ({
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      resourceStage: row.resourceStage,
      resourceKind: row.resourceKind,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      dedupeAction: row.dedupeAction,
      dedupeMatched: row.dedupeMatched,
      wouldInsertIntoHead: row.wouldInsertIntoHead,
      resourceMapMutated: row.resourceMapMutated
    })),
    [
      {
        inputIndex: 0,
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        dedupeMatched: false,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 1,
        contractId: 'preinit-style',
        resourceStage: 'preinit',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-theme',
        dedupeAction: 'preinit-adopts-preload',
        dedupeMatched: true,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 2,
        contractId: 'preinit-style',
        resourceStage: 'preinit',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-theme',
        dedupeAction: 'dedupe-preinit',
        dedupeMatched: true,
        wouldInsertIntoHead: false,
        resourceMapMutated: false
      },
      {
        inputIndex: 3,
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKind: 'script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        dedupeMatched: false,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 4,
        contractId: 'preinit-script',
        resourceStage: 'preinit',
        resourceKind: 'script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        dedupeAction: 'preinit-adopts-preload',
        dedupeMatched: true,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 5,
        contractId: 'preload-module',
        resourceStage: 'preload',
        resourceKind: 'script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        dedupeMatched: false,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 6,
        contractId: 'preinit-module-script',
        resourceStage: 'preinit',
        resourceKind: 'script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        dedupeAction: 'preinit-adopts-preload',
        dedupeMatched: true,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      },
      {
        inputIndex: 7,
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKind: 'font',
        resourceKey: 'font:font-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        dedupeMatched: false,
        wouldInsertIntoHead: true,
        resourceMapMutated: false
      }
    ]
  );
  assert.deepEqual(diagnostic.precedenceRows, [
    {
      rowId: 'stylesheet-precedence-0',
      precedenceIndex: 0,
      precedenceKey: 'precedence-theme',
      sourceAdapterAdmissionIds: [admissions[1].adapterAdmissionId],
      resourceKeys: ['style:style-main'],
      plannedStylesheetCount: 1,
      orderingApplied: false,
      precedenceMapCreated: false,
      precedenceQueryRun: false,
      rawPrecedenceValueRetained: false,
      compatibilityClaimed: false
    }
  ]);
  assert.deepEqual(
    diagnostic.plannedHeadInsertionOrder.rows.map((row) => ({
      headOrderIndex: row.headOrderIndex,
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      placementKind: row.placementKind,
      insertionMethod: row.insertionMethod,
      insertionApplied: row.insertionApplied
    })),
    [
      {
        headOrderIndex: 0,
        inputIndex: 1,
        contractId: 'preinit-style',
        placementKind: 'stylesheet-precedence',
        insertionMethod: 'insert-before-or-after-precedence-peer',
        insertionApplied: false
      },
      {
        headOrderIndex: 1,
        inputIndex: 0,
        contractId: 'preload',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 2,
        inputIndex: 3,
        contractId: 'preload',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 3,
        inputIndex: 4,
        contractId: 'preinit-script',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 4,
        inputIndex: 5,
        contractId: 'preload-module',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 5,
        inputIndex: 6,
        contractId: 'preinit-module-script',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      },
      {
        headOrderIndex: 6,
        inputIndex: 7,
        contractId: 'preload',
        placementKind: 'append',
        insertionMethod: 'appendChild',
        insertionApplied: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.observedHeadOrder.rows.map((row) => ({
      childIndex: row.childIndex,
      nodeName: row.nodeName,
      relationship: row.relationship,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      stylesheetPrecedenceCandidate: row.stylesheetPrecedenceCandidate,
      orderMutated: row.orderMutated
    })),
    [
      {
        childIndex: 0,
        nodeName: 'LINK',
        relationship: 'stylesheet',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-theme',
        stylesheetPrecedenceCandidate: true,
        orderMutated: false
      },
      {
        childIndex: 1,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKey: 'style-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 2,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKey: 'script-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 3,
        nodeName: 'SCRIPT',
        relationship: null,
        resourceKey: 'script-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 4,
        nodeName: 'LINK',
        relationship: 'modulepreload',
        resourceKey: 'module-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 5,
        nodeName: 'SCRIPT',
        relationship: null,
        resourceKey: 'module-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      },
      {
        childIndex: 6,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKey: 'font-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        orderMutated: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModulePreinitRows.map((row) => ({
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      resourceStage: row.resourceStage,
      resourceKind: row.resourceKind,
      scriptKind: row.scriptKind,
      dedupeKey: row.dedupeKey,
      dedupeAction: row.dedupeAction,
      modulePreload: row.modulePreload,
      moduleScriptPreinit: row.moduleScriptPreinit,
      publicResourceDispatchBlocked: row.publicResourceDispatchBlocked,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch,
      scriptExecutionStarted: row.scriptExecutionStarted
    })),
    [
      {
        inputIndex: 3,
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKind: 'script',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        dedupeAction: 'insert-preload',
        modulePreload: false,
        moduleScriptPreinit: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        inputIndex: 4,
        contractId: 'preinit-script',
        resourceStage: 'preinit',
        resourceKind: 'script',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        dedupeAction: 'preinit-adopts-preload',
        modulePreload: false,
        moduleScriptPreinit: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        inputIndex: 5,
        contractId: 'preload-module',
        resourceStage: 'preload',
        resourceKind: 'script',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        dedupeAction: 'insert-preload',
        modulePreload: true,
        moduleScriptPreinit: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        inputIndex: 6,
        contractId: 'preinit-module-script',
        resourceStage: 'preinit',
        resourceKind: 'script',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        dedupeAction: 'preinit-adopts-preload',
        modulePreload: false,
        moduleScriptPreinit: true,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModuleHeadOrder.plannedRows.map((row) => ({
      headOrderIndex: row.headOrderIndex,
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      resourceKind: row.resourceKind,
      scriptKind: row.scriptKind,
      resourceKey: row.resourceKey,
      insertionApplied: row.insertionApplied,
      publicResourceDispatchBlocked: row.publicResourceDispatchBlocked
    })),
    [
      {
        headOrderIndex: 2,
        inputIndex: 3,
        contractId: 'preload',
        resourceKind: 'script',
        scriptKind: 'classic',
        resourceKey: 'script:script-main',
        insertionApplied: false,
        publicResourceDispatchBlocked: true
      },
      {
        headOrderIndex: 3,
        inputIndex: 4,
        contractId: 'preinit-script',
        resourceKind: 'script',
        scriptKind: 'classic',
        resourceKey: 'script:script-main',
        insertionApplied: false,
        publicResourceDispatchBlocked: true
      },
      {
        headOrderIndex: 4,
        inputIndex: 5,
        contractId: 'preload-module',
        resourceKind: 'script',
        scriptKind: 'module',
        resourceKey: 'script:module-main',
        insertionApplied: false,
        publicResourceDispatchBlocked: true
      },
      {
        headOrderIndex: 5,
        inputIndex: 6,
        contractId: 'preinit-module-script',
        resourceKind: 'script',
        scriptKind: 'module',
        resourceKey: 'script:module-main',
        insertionApplied: false,
        publicResourceDispatchBlocked: true
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModuleHeadOrder.observedRows.map((row) => ({
      childIndex: row.childIndex,
      nodeName: row.nodeName,
      relationship: row.relationship,
      resourceKind: row.resourceKind,
      scriptKind: row.scriptKind,
      resourceKey: row.resourceKey,
      orderMutated: row.orderMutated
    })),
    [
      {
        childIndex: 2,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKind: 'script',
        scriptKind: 'classic',
        resourceKey: 'script-main',
        orderMutated: false
      },
      {
        childIndex: 3,
        nodeName: 'SCRIPT',
        relationship: null,
        resourceKind: 'script',
        scriptKind: 'classic',
        resourceKey: 'script-main',
        orderMutated: false
      },
      {
        childIndex: 4,
        nodeName: 'LINK',
        relationship: 'modulepreload',
        resourceKind: 'script',
        scriptKind: 'module',
        resourceKey: 'module-main',
        orderMutated: false
      },
      {
        childIndex: 5,
        nodeName: 'SCRIPT',
        relationship: null,
        resourceKind: 'script',
        scriptKind: 'module',
        resourceKey: 'module-main',
        orderMutated: false
      }
    ]
  );
  assert.equal(diagnostic.scriptModuleHeadOrder.fakeHeadMutated, false);
  assert.equal(
    diagnostic.scriptModuleHeadOrder.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(diagnostic.scriptModuleHeadOrder.scriptExecutionStarted, false);
  assert.deepEqual(diagnostic.publicScriptModuleDispatchBoundary, {
    status: 'blocked-public-script-module-resource-dispatch',
    scriptModuleRowCount: 4,
    scriptModuleRowsRecorded: true,
    publicResourceDispatchBlocked: true,
    publicScriptModuleResourceDispatch: false,
    publicDispatcherInvoked: false,
    publicResourceApisReachable: false,
    previousDispatcherInvoked: false,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    networkFetchStarted: false,
    realDocumentMutated: false,
    realHeadMutated: false,
    compatibilityClaimed: false,
    blockedCapabilities:
      resourceFormGate.resourceHintPreloadPreinitOrderBlockedCapabilities
  });
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.stylesheetPrecedenceRowsObserved,
    true
  );
  assert.equal(diagnostic.stylesheetPrecedenceBoundary.stylesheetRowCount, 1);
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.observedStylesheetRowCount,
    1
  );
  assert.deepEqual(
    diagnostic.stylesheetPrecedenceBoundary.blockedCapabilities,
    resourceFormGate.resourceHintHeadStylesheetPrecedenceBlockedCapabilities
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintPreloadPreinitOrderBlockedCapabilities
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(diagnostic.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(
    diagnostic.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(diagnostic.publicHeadBoundary.realDocumentMutated, false);
  assert.equal(fakeDom.head.childNodes.length, 7);
  assert.equal(
    JSON.stringify(diagnostic).includes('/style.css'),
    false
  );
  assert.equal(
    JSON.stringify(diagnostic).includes('sha256-style'),
    false
  );
  assert.equal(JSON.stringify(diagnostic).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(diagnostic).includes('nonce-module'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintPreloadPreinitOrderGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate
      .privateResourceHintPreloadPreinitOrderAdmissionRequiredStatus
  );
  assert.deepEqual(summary.acceptsContractIds, [
    'preload',
    'preload-module',
    'preinit-style',
    'preinit-script',
    'preinit-module-script'
  ]);
  assert.equal(summary.mutatesFakeHead, false);
  assert.equal(summary.mutatesRealHead, false);
  assert.equal(summary.recordsDedupeRows, true);
  assert.equal(summary.recordsPrecedenceRows, true);
  assert.equal(summary.recordsHeadOrderRows, true);
  assert.equal(summary.recordsScriptModulePreinitRows, true);
  assert.equal(summary.recordsScriptModuleHeadOrderRows, true);
  assert.equal(summary.publicScriptModuleResourceDispatch, false);
  assert.deepEqual(
    summary.blockedCapabilities,
    resourceFormGate.resourceHintPreloadPreinitOrderBlockedCapabilities
  );
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintPreloadPreinitOrderBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintPreloadPreinitOrderError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintPreloadPreinitOrderGateErrorCode
  );
  assert.equal(
    error.exportName,
    'resource-hint-preload-preinit-dedupe-order'
  );
  assert.equal(error.orderDiagnosticId, 'preload-preinit-order:1');
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintPreloadPreinitOrderBlockedCapabilities
  );

  assert.throws(
    () =>
      orderGate.recordPreloadPreinitOrderDiagnostic(admissions, {
        explicitOrderDiagnostic: true,
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head,
        resourceDescriptors: []
      }),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'preload/preinit order gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintPreloadPreinitOrderGate()
        .recordPreloadPreinitOrderDiagnostic(admissions, {
          explicitOrderDiagnostic: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head,
          resourceDescriptors: []
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'resourceDescriptors must match the adapter admission count'
    }
  );
  const preconnectAdmission = adapterGate.admitDispatcherRecord(
    gate.recordResourceHintDispatcherRequest('C', [
      'https://connect.example.test',
      ''
    ]),
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintPreloadPreinitOrderGate()
        .recordPreloadPreinitOrderDiagnostic(
          [preconnectAdmission],
          {
            explicitOrderDiagnostic: true,
            fakeDocument: fakeDom.document,
            fakeHead: fakeDom.head,
            resourceDescriptors: [
              {
                sourceAdapterAdmissionId:
                  preconnectAdmission.adapterAdmissionId,
                resourceKind: 'other',
                resourceKey: 'connect-main'
              }
            ]
          }
        ),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidRecordCode,
      compatibilityTarget,
      contractId: 'preconnect'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintPreloadPreinitOrderGate()
        .recordPreloadPreinitOrderDiagnostic([admissions[1]], {
          explicitOrderDiagnostic: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head,
          resourceDescriptors: [
            {
              sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
              resourceKind: 'style',
              resourceKey: 'style-main'
            }
          ]
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'preinit-style descriptors must include precedenceKey'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintPreloadPreinitOrderError(
        {}
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintPreloadPreinitOrderInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint stylesheet precedence diagnostic records style dedupe and head order only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'stylesheet-precedence-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'stylesheet-precedence-adapter'
  });
  const orderGate =
    resourceFormGate.createResourceHintPreloadPreinitOrderGate({
      requestIdPrefix: 'stylesheet-precedence-order'
    });
  const stylesheetGate =
    resourceFormGate.createResourceHintStylesheetPrecedenceGate({
      requestIdPrefix: 'stylesheet-precedence'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const records = [
    gate.recordResourceHintDispatcherRequest('L', [
      '/style.css',
      'style',
      {
        crossOrigin: undefined,
        integrity: undefined,
        nonce: undefined,
        type: undefined,
        fetchPriority: 'low',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style-dupe',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: undefined,
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ])
  ];
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('stylesheet precedence head props')
  ]);
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    })
  );

  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'style-main',
    'data-fast-react-precedence-key': 'precedence-main'
  });
  appendFakeHeadChild(fakeDom, 'style', {
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'inline-main',
    'data-fast-react-precedence-key': 'precedence-main'
  });
  appendFakeHeadChild(fakeDom, 'meta', {
    name: 'description'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'style',
    'data-fast-react-resource-key': 'style-main'
  });

  const order = orderGate.recordPreloadPreinitOrderDiagnostic(
    admissions,
    {
      explicitOrderDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head,
      resourceDescriptors: [
        {
          sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main'
        },
        {
          sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-main'
        },
        {
          sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-main'
        },
        {
          sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
          resourceKind: 'font',
          resourceKey: 'font-main'
        }
      ]
    }
  );
  const diagnostic = stylesheetGate.recordStylesheetPrecedenceDiagnostic(
    order,
    headRecord,
    {
      explicitStylesheetPrecedenceDiagnostic: true,
      precedenceKind: 'deterministic-fake-dom-stylesheet-precedence-order',
      precedenceId: 'stylesheet-precedence-order',
      targetKind: 'document-head',
      hostTag: 'head',
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintStylesheetPrecedenceGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintStylesheetPrecedenceRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintStylesheetPrecedenceRecordPayload(
      diagnostic
    ),
    diagnostic
  );
  assert.equal(diagnostic.stylesheetPrecedenceId, 'stylesheet-precedence:1');
  assert.equal(
    diagnostic.stylesheetPrecedenceStatus,
    resourceFormGate.privateResourceHintStylesheetPrecedenceStatus
  );
  assert.equal(
    diagnostic.executionStatus,
    resourceFormGate.privateResourceHintStylesheetPrecedenceExecutionStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintStylesheetPrecedenceSideEffects
  );
  assert.equal(
    diagnostic.sideEffects.fakeStylesheetPrecedenceDiagnosticInvoked,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceDedupeRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceInsertionRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetPrecedenceSingletonOrderRowsRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, false);
  assert.equal(diagnostic.sideEffects.realDocumentMutated, false);
  assert.equal(diagnostic.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(diagnostic.precedenceAdmission.rawDocumentCaptured, false);
  assert.equal(diagnostic.precedenceAdmission.rawHeadCaptured, false);
  assert.equal(
    diagnostic.precedenceAdmission.stylesheetResourceMapCreationAllowed,
    false
  );
  assert.equal(
    diagnostic.precedenceAdmission.headSingletonOrderingAllowed,
    false
  );
  assert.deepEqual(
    diagnostic.stylesheetDedupeRows.map((row) => ({
      contractId: row.contractId,
      resourceStage: row.resourceStage,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      dedupeAction: row.dedupeAction,
      wouldInsertIntoHead: row.wouldInsertIntoHead
    })),
    [
      {
        contractId: 'preload',
        resourceStage: 'preload',
        resourceKey: 'style:style-main',
        precedenceKey: null,
        dedupeAction: 'insert-preload',
        wouldInsertIntoHead: true
      },
      {
        contractId: 'preinit-style',
        resourceStage: 'preinit',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-main',
        dedupeAction: 'preinit-adopts-preload',
        wouldInsertIntoHead: true
      },
      {
        contractId: 'preinit-style',
        resourceStage: 'preinit',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-main',
        dedupeAction: 'dedupe-preinit',
        wouldInsertIntoHead: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.precedenceRows.map((row) => ({
      precedenceKey: row.precedenceKey,
      plannedStylesheetCount: row.plannedStylesheetCount,
      observedStylesheetCount: row.observedStylesheetCount,
      firstObservedHeadIndex: row.firstObservedHeadIndex,
      orderingApplied: row.orderingApplied,
      precedenceMapCreated: row.precedenceMapCreated
    })),
    [
      {
        precedenceKey: 'precedence-main',
        plannedStylesheetCount: 1,
        observedStylesheetCount: 2,
        firstObservedHeadIndex: 0,
        orderingApplied: false,
        precedenceMapCreated: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.plannedStylesheetOrder.rows.map((row) => ({
      plannedStylesheetIndex: row.plannedStylesheetIndex,
      inputIndex: row.inputIndex,
      contractId: row.contractId,
      precedenceKey: row.precedenceKey,
      insertionApplied: row.insertionApplied
    })),
    [
      {
        plannedStylesheetIndex: 0,
        inputIndex: 1,
        contractId: 'preinit-style',
        precedenceKey: 'precedence-main',
        insertionApplied: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.observedStylesheetOrder.rows.map((row) => ({
      childIndex: row.childIndex,
      nodeName: row.nodeName,
      relationship: row.relationship,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      stylesheetPrecedenceCandidate: row.stylesheetPrecedenceCandidate,
      clearRetainDecision: row.clearRetainDecision,
      orderMutated: row.orderMutated
    })),
    [
      {
        childIndex: 0,
        nodeName: 'LINK',
        relationship: 'stylesheet',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main',
        stylesheetPrecedenceCandidate: true,
        clearRetainDecision: 'retain',
        orderMutated: false
      },
      {
        childIndex: 1,
        nodeName: 'STYLE',
        relationship: null,
        resourceKey: 'inline-main',
        precedenceKey: 'precedence-main',
        stylesheetPrecedenceCandidate: true,
        clearRetainDecision: 'retain',
        orderMutated: false
      },
      {
        childIndex: 2,
        nodeName: 'META',
        relationship: null,
        resourceKey: null,
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        clearRetainDecision: 'clear',
        orderMutated: false
      },
      {
        childIndex: 3,
        nodeName: 'LINK',
        relationship: 'preload',
        resourceKey: 'style-main',
        precedenceKey: null,
        stylesheetPrecedenceCandidate: false,
        clearRetainDecision: 'clear',
        orderMutated: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.headSingletonOrderBoundary,
    {
      rowId: 'head-singleton-stylesheet-order',
      rowType: 'host-singleton',
      hostTag: 'head',
      sourceHeadRequestId: headRecord.requestId,
      sourceOrderDiagnosticId: order.orderDiagnosticId,
      headContractId: 'head-singleton',
      plannedStylesheetRowCount: 1,
      observedStylesheetRowCount: 2,
      retainedChildCount: 2,
      clearableChildCount: 2,
      clearHeadWouldRun: true,
      clearHeadWouldRetainStylesheets: true,
      releaseSingletonWouldRun: true,
      headSingletonResolved: false,
      headSingletonAcquired: false,
      headSingletonReleased: false,
      headChildrenCleared: false,
      singletonOrderingApplied: false,
      publicHeadSingletonBehavior: false,
      rawValuesRetained: false,
      compatibilityClaimed: false,
      blockedCapabilities:
        resourceFormGate.resourceHintStylesheetPrecedenceBlockedCapabilities
    }
  );
  assert.deepEqual(
    diagnostic.stylesheetResourceMapPlan,
    {
      resourceMapKind:
        'react-19.2.6-stylesheet-precedence-resource-map-diagnostic',
      stylesheetResourceMapCreated: false,
      stylesheetResourceMapMutated: false,
      inputRowCount: 3,
      uniqueStylesheetResourceCount: 1,
      preloadStyleResourceCount: 1,
      preinitStyleResourceCount: 2,
      dedupedStyleRowCount: 1,
      rawValuesRetained: false,
      compatibilityClaimed: false
    }
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.stylesheetPrecedenceRowsObserved,
    true
  );
  assert.equal(diagnostic.stylesheetPrecedenceBoundary.stylesheetRowCount, 1);
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.observedStylesheetRowCount,
    2
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetPrecedenceBlockedCapabilities
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(
    diagnostic.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(fakeDom.head.childNodes.length, 4);
  assert.equal(JSON.stringify(diagnostic).includes('/style.css'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-style'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintStylesheetPrecedenceGateId
  );
  assert.equal(summary.status, resourceFormGate.unsupportedStatus);
  assert.equal(
    summary.admissionStatus,
    resourceFormGate
      .privateResourceHintStylesheetPrecedenceAdmissionRequiredStatus
  );
  assert.equal(summary.recordsStylesheetDedupeRows, true);
  assert.equal(summary.recordsStylesheetInsertionRows, true);
  assert.equal(summary.recordsHeadSingletonOrderRows, true);
  assert.deepEqual(
    summary.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetPrecedenceBlockedCapabilities
  );
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintStylesheetPrecedenceBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintStylesheetPrecedenceError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintStylesheetPrecedenceGateErrorCode
  );
  assert.equal(error.exportName, 'resource-hint-stylesheet-precedence-order');
  assert.equal(error.stylesheetPrecedenceId, 'stylesheet-precedence:1');
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetPrecedenceBlockedCapabilities
  );

  assert.throws(
    () =>
      stylesheetGate.recordStylesheetPrecedenceDiagnostic(
        order,
        headRecord,
        {
          explicitStylesheetPrecedenceDiagnostic: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetPrecedenceInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stylesheet precedence gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintStylesheetPrecedenceGate()
        .recordStylesheetPrecedenceDiagnostic(order, {}, {
          explicitStylesheetPrecedenceDiagnostic: true,
          fakeDocument: fakeDom.document,
          fakeHead: fakeDom.head
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetPrecedenceInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintStylesheetPrecedenceError(
        {}
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetPrecedenceInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource hint resource-map commit diagnostic executes script/module fake-resource ordering only', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-map-commit-source'
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'resource-map-commit-adapter'
  });
  const orderGate =
    resourceFormGate.createResourceHintPreloadPreinitOrderGate({
      requestIdPrefix: 'resource-map-commit-order'
    });
  const stylesheetGate =
    resourceFormGate.createResourceHintStylesheetPrecedenceGate({
      requestIdPrefix: 'resource-map-commit-stylesheet'
    });
  const loadStateGate =
    resourceFormGate.createResourceHintStylesheetLoadErrorStateGate({
      requestIdPrefix: 'resource-map-commit-load-state'
    });
  const commitGate =
    resourceFormGate.createResourceHintResourceMapCommitGate({
      requestIdPrefix: 'resource-map-commit'
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const records = [
    gate.recordResourceHintDispatcherRequest('L', [
      '/style.css',
      'style',
      {
        crossOrigin: undefined,
        integrity: undefined,
        nonce: undefined,
        type: undefined,
        fetchPriority: 'low',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'high'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/script.js',
      'script',
      {
        crossOrigin: undefined,
        integrity: 'sha256-script-preload',
        nonce: undefined,
        type: undefined,
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('X', [
      '/script.js',
      {
        crossOrigin: undefined,
        integrity: 'sha256-script',
        fetchPriority: 'high',
        nonce: 'nonce-script'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('m', [
      '/module.mjs',
      {
        as: undefined,
        crossOrigin: '',
        integrity: 'sha256-module-preload'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('M', [
      '/module.mjs',
      {
        crossOrigin: '',
        integrity: 'sha256-module',
        nonce: 'nonce-module'
      }
    ]),
    gate.recordResourceHintDispatcherRequest('L', [
      '/font.woff2',
      'font',
      {
        crossOrigin: '',
        integrity: undefined,
        nonce: undefined,
        type: 'font/woff2',
        fetchPriority: undefined,
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ])
  ];
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('resource map commit head props')
  ]);
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    })
  );

  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'style-main',
    'data-fast-react-precedence-key': 'precedence-main'
  });
  appendFakeHeadChild(fakeDom, 'script', {
    'data-fast-react-resource-key': 'script-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'modulepreload',
    'data-fast-react-resource-key': 'module-main'
  });
  appendFakeHeadChild(fakeDom, 'script', {
    type: 'module',
    'data-fast-react-resource-key': 'module-main'
  });

  const order = orderGate.recordPreloadPreinitOrderDiagnostic(
    admissions,
    {
      explicitOrderDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head,
      resourceDescriptors: [
        {
          sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main'
        },
        {
          sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-main'
        },
        {
          sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'script-main'
        },
        {
          sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'script-main'
        },
        {
          sourceAdapterAdmissionId: admissions[4].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'module-main'
        },
        {
          sourceAdapterAdmissionId: admissions[5].adapterAdmissionId,
          resourceKind: 'script',
          resourceKey: 'module-main'
        },
        {
          sourceAdapterAdmissionId: admissions[6].adapterAdmissionId,
          resourceKind: 'font',
          resourceKey: 'font-main'
        }
      ]
    }
  );
  const stylesheet = stylesheetGate.recordStylesheetPrecedenceDiagnostic(
    order,
    headRecord,
    {
      explicitStylesheetPrecedenceDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const loadState = loadStateGate.recordStylesheetLoadErrorStateDiagnostic(
    stylesheet,
    {
      explicitStylesheetLoadErrorStateDiagnostic: true,
      stateKind: 'deterministic-fake-stylesheet-load-error-state',
      stateId: 'resource-map-commit-load-state',
      targetKind: 'stylesheet-resource-state'
    }
  );
  const diagnostic = commitGate.recordResourceMapCommitDiagnostic(
    order,
    stylesheet,
    {
      explicitResourceMapCommitDiagnostic: true,
      commitKind: 'deterministic-private-resource-map-commit',
      commitId: 'resource-map-commit-plan',
      targetKind: 'document-head',
      hostTag: 'head'
    },
    loadState
  );
  const summary =
    resourceFormGate.describePrivateResourceHintResourceMapCommitGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintResourceMapCommitRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintResourceMapCommitRecordPayload(
      diagnostic
    ),
    diagnostic
  );
  assert.equal(diagnostic.resourceMapCommitId, 'resource-map-commit:1');
  assert.equal(
    diagnostic.resourceMapCommitStatus,
    resourceFormGate.privateResourceHintResourceMapCommitStatus
  );
  assert.equal(
    diagnostic.executionStatus,
    resourceFormGate.privateResourceHintResourceMapCommitExecutionStatus
  );
  assert.equal(
    diagnostic.compatibilityStatus,
    resourceFormGate
      .privateResourceHintResourceMapCommitCompatibilityBlockedStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintResourceMapCommitSideEffects
  );
  assert.equal(
    diagnostic.sideEffects.fakeResourceMapCommitDiagnosticInvoked,
    true
  );
  assert.equal(
    diagnostic.sideEffects.privateResourceMapCommitRecordsCreated,
    true
  );
  assert.equal(diagnostic.sideEffects.fakeHeadRead, false);
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, false);
  assert.equal(diagnostic.sideEffects.realResourceMapsCreated, false);
  assert.equal(diagnostic.sideEffects.realResourceMapsMutated, false);
  assert.equal(diagnostic.sideEffects.fakeResourceMapsCreated, false);
  assert.equal(diagnostic.sideEffects.fakeResourceMapsMutated, false);
  assert.equal(
    diagnostic.sideEffects.stylesheetRecordOwnershipClaimed,
    false
  );
  assert.equal(diagnostic.sideEffects.preloadRecordStarted, false);
  assert.equal(diagnostic.sideEffects.scriptRecordLoaded, false);
  assert.equal(diagnostic.sideEffects.modulePreloadStarted, false);
  assert.equal(diagnostic.sideEffects.scriptPreinitStarted, false);
  assert.equal(diagnostic.sideEffects.moduleScriptPreinitStarted, false);
  assert.equal(
    diagnostic.sideEffects.moduleResourceMapOrderRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.moduleResourceMapDedupeKeysRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.fakeScriptModuleCommitExecutionDiagnosticInvoked,
    true
  );
  assert.equal(
    diagnostic.sideEffects.scriptModuleFakeDomCommitRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.scriptResourceFakeDomCommitRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.modulePreloadFakeDomCommitRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadErrorStateRecordConsumed,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateCommitOrderRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateResourceMapRowsValidated,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateCommitTransitionRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.fakeStylesheetResourceCommitTransitionRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects
      .fakeStylesheetLoadStateCommitExecutionDiagnosticInvoked,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateCommitExecutionRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.stylesheetLoadStateChangeRowsRecorded,
    true
  );
  assert.equal(
    diagnostic.sideEffects.deterministicStylesheetLoadStateChangesRecorded,
    true
  );
  assert.equal(diagnostic.sideEffects.scriptExecutionStarted, false);
  assert.equal(
    diagnostic.sideEffects.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(diagnostic.sideEffects.resourceLoadStateMutated, false);
  assert.equal(diagnostic.sideEffects.resourceFetchStarted, false);
  assert.equal(
    diagnostic.sideEffects.preloadOrStyleDomWorkDispatched,
    false
  );
  assert.equal(diagnostic.commitAdmission.rawResourceMapCaptured, false);
  assert.equal(
    diagnostic.commitAdmission.realResourceMapMutationAllowed,
    false
  );
  assert.equal(
    diagnostic.commitAdmission.fakeResourceMapMutationAllowed,
    false
  );
  assert.equal(
    diagnostic.commitAdmission.privateResourceMapRecordCreationAllowed,
    true
  );
  assert.deepEqual(
    diagnostic.acceptedContractIds,
    [
      'preload',
      'preinit-style',
      'preinit-script',
      'preload-module',
      'preinit-module-script'
    ]
  );
  assert.deepEqual(diagnostic.resourceMapCommitPlan, {
    resourceMapKind:
      'react-19.2.6-resource-map-commit-diagnostic',
    targetKind: 'document-head',
    hostTag: 'head',
    privateResourceMapRecordCount: 7,
    uniquePrivateResourceRecordCount: 7,
    stylesheetRecordCount: 1,
    preloadRecordCount: 4,
    scriptRecordCount: 2,
    modulePreloadRecordCount: 1,
    moduleScriptRecordCount: 1,
    moduleResourceMapOrderRowCount: 4,
    moduleResourceMapDedupeKeyCount: 2,
    scriptModuleFakeDomCommitExecutionRowCount: 4,
    scriptResourceFakeDomCommitExecutionRowCount: 2,
    modulePreloadFakeDomCommitExecutionRowCount: 1,
    scriptModuleFakeResourceOrderExecutionRowCount: 4,
    scriptModuleFakeResourceOrderDedupeStateCount: 2,
    scriptModuleFakeResourceOrderPreloadPropsRecordCount: 2,
    scriptModuleFakeResourceOrderHoistableScriptRecordCount: 2,
    scriptModuleFakeResourceOrderPreloadPropsAdoptionCount: 2,
    stylesheetLoadStateCommitOrderRowCount: 1,
    stylesheetLoadStateResourceCount: 1,
    stylesheetLoadStateCommitTransitionCount: 1,
    stylesheetLoadStateCommitTransitionResourceCount: 1,
    stylesheetLoadStateCommitExecutionRowCount: 1,
    stylesheetLoadStateChangeRowCount: 3,
    unmatchedStylesheetLoadStateResourceCount: 0,
    malformedModuleRowCount: 0,
    conflictingDuplicateRecordCount: 0,
    duplicateStylesheetPrecedenceRowCount: 0,
    staleResourceMapEntryCount: 0,
    dedupedRecordCount: 0,
    wouldInsertRecordCount: 7,
    realResourceMapsCreated: false,
    realResourceMapsMutated: false,
    fakeResourceMapsCreated: false,
    fakeResourceMapsMutated: false,
    hoistableStylesMapCreated: false,
    hoistableStylesMapMutated: false,
    hoistableScriptsMapCreated: false,
    hoistableScriptsMapMutated: false,
    preloadPropsMapCreated: false,
    preloadPropsMapMutated: false,
    scriptModuleFakeDomCommitEvidenceRecorded: true,
    stylesheetLoadStateCommitExecutionRecorded: true,
    deterministicStylesheetLoadStateChangesRecorded: true,
    fakeDomCommitApplied: false,
    scriptModuleFakeResourceOrderingExecuted: true,
    scriptModuleFakeResourceOrderingApplied: true,
    modulePreloadStarted: false,
    scriptPreinitStarted: false,
    moduleScriptPreinitStarted: false,
    scriptExecutionStarted: false,
    publicScriptModuleResourceDispatch: false,
    preloadOrStyleDomWorkDispatched: false,
    publicResourceMapCommitBehavior: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(
    diagnostic.privateResourceMapRecords.map((row) => ({
      recordKind: row.recordKind,
      mapKind: row.mapKind,
      contractId: row.contractId,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      privateRecordCreated: row.privateRecordCreated,
      realResourceMapMutated: row.realResourceMapMutated,
      fakeResourceMapMutated: row.fakeResourceMapMutated,
      fetchStarted: row.fetchStarted,
      preloadStarted: row.preloadStarted,
      loadEventSubscribed: row.loadEventSubscribed,
      loadingStateMutated: row.loadingStateMutated
    })),
    [
      {
        recordKind: 'preload',
        mapKind: 'preload-props',
        contractId: 'preload',
        resourceKey: 'style:style-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'stylesheet',
        mapKind: 'hoistable-styles',
        contractId: 'preinit-style',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-main',
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'preload',
        mapKind: 'preload-props',
        contractId: 'preload',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        contractId: 'preinit-script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'preload',
        mapKind: 'preload-props',
        contractId: 'preload-module',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        contractId: 'preinit-module-script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      },
      {
        recordKind: 'preload',
        mapKind: 'preload-props',
        contractId: 'preload',
        resourceKey: 'font:font-main',
        precedenceKey: null,
        privateRecordCreated: true,
        realResourceMapMutated: false,
        fakeResourceMapMutated: false,
        fetchStarted: false,
        preloadStarted: false,
        loadEventSubscribed: false,
        loadingStateMutated: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.privateResourceMapRecords
      .filter((row) =>
        [
          'preload',
          'preinit-script',
          'preload-module',
          'preinit-module-script'
        ].includes(row.contractId)
      )
      .map((row) => ({
        contractId: row.contractId,
        resourceKey: row.resourceKey,
        dedupeKey: row.dedupeKey,
        resourceMapDedupeKey: row.resourceMapDedupeKey,
        scriptKind: row.scriptKind,
        modulePreload: row.modulePreload,
        moduleScript: row.moduleScript,
        publicResourceDispatchBlocked: row.publicResourceDispatchBlocked,
        publicScriptModuleResourceDispatch:
          row.publicScriptModuleResourceDispatch,
        modulePreloadStarted: row.modulePreloadStarted,
        scriptPreinitStarted: row.scriptPreinitStarted,
        moduleScriptPreinitStarted: row.moduleScriptPreinitStarted,
        scriptExecutionStarted: row.scriptExecutionStarted
      })),
    [
      {
        contractId: 'preload',
        resourceKey: 'style:style-main',
        dedupeKey: 'style:style-main',
        resourceMapDedupeKey: 'preload-props:style:style-main',
        scriptKind: null,
        modulePreload: false,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preload',
        resourceKey: 'script:script-main',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'preload-props:script:script-main',
        scriptKind: 'classic',
        modulePreload: false,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preinit-script',
        resourceKey: 'script:script-main',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:script-main',
        scriptKind: 'classic',
        modulePreload: false,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preload-module',
        resourceKey: 'script:module-main',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'preload-props:script:module-main',
        scriptKind: 'module',
        modulePreload: true,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preinit-module-script',
        resourceKey: 'script:module-main',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:module-main',
        scriptKind: 'module',
        modulePreload: false,
        moduleScript: true,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      },
      {
        contractId: 'preload',
        resourceKey: 'font:font-main',
        dedupeKey: 'font:font-main',
        resourceMapDedupeKey: 'preload-props:font:font-main',
        scriptKind: null,
        modulePreload: false,
        moduleScript: false,
        publicResourceDispatchBlocked: true,
        publicScriptModuleResourceDispatch: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.moduleResourceMapOrder.rows.map((row) => ({
      moduleOrderIndex: row.moduleOrderIndex,
      resourceMapOrderIndex: row.resourceMapOrderIndex,
      contractId: row.contractId,
      recordKind: row.recordKind,
      mapKind: row.mapKind,
      scriptKind: row.scriptKind,
      dedupeKey: row.dedupeKey,
      resourceMapDedupeKey: row.resourceMapDedupeKey,
      modulePreload: row.modulePreload,
      moduleScript: row.moduleScript,
      headInsertionApplied: row.headInsertionApplied,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch,
      scriptExecutionStarted: row.scriptExecutionStarted
    })),
    [
      {
        moduleOrderIndex: 0,
        resourceMapOrderIndex: 2,
        contractId: 'preload',
        recordKind: 'preload',
        mapKind: 'preload-props',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'preload-props:script:script-main',
        modulePreload: false,
        moduleScript: false,
        headInsertionApplied: false,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        moduleOrderIndex: 1,
        resourceMapOrderIndex: 3,
        contractId: 'preinit-script',
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:script-main',
        modulePreload: false,
        moduleScript: false,
        headInsertionApplied: false,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        moduleOrderIndex: 2,
        resourceMapOrderIndex: 4,
        contractId: 'preload-module',
        recordKind: 'preload',
        mapKind: 'preload-props',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'preload-props:script:module-main',
        modulePreload: true,
        moduleScript: false,
        headInsertionApplied: false,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        moduleOrderIndex: 3,
        resourceMapOrderIndex: 5,
        contractId: 'preinit-module-script',
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:module-main',
        modulePreload: false,
        moduleScript: true,
        headInsertionApplied: false,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.moduleResourceMapOrder.dedupeKeys.map((row) => ({
      dedupeKey: row.dedupeKey,
      rowCount: row.rowCount,
      resourceMapDedupeKeys: row.resourceMapDedupeKeys,
      contractIdsInOrder: row.contractIdsInOrder,
      recordKindsInOrder: row.recordKindsInOrder,
      scriptKindsInOrder: row.scriptKindsInOrder,
      hasClassicScriptPreload: row.hasClassicScriptPreload,
      hasModulePreload: row.hasModulePreload,
      hasClassicScriptPreinit: row.hasClassicScriptPreinit,
      hasModuleScriptPreinit: row.hasModuleScriptPreinit,
      conflictStatus: row.conflictStatus
    })),
    [
      {
        dedupeKey: 'script:script-main',
        rowCount: 2,
        resourceMapDedupeKeys: [
          'preload-props:script:script-main',
          'hoistable-scripts:script:script-main'
        ],
        contractIdsInOrder: ['preload', 'preinit-script'],
        recordKindsInOrder: ['preload', 'script'],
        scriptKindsInOrder: ['classic', 'classic'],
        hasClassicScriptPreload: true,
        hasModulePreload: false,
        hasClassicScriptPreinit: true,
        hasModuleScriptPreinit: false,
        conflictStatus: 'validated-no-conflicting-duplicates'
      },
      {
        dedupeKey: 'script:module-main',
        rowCount: 2,
        resourceMapDedupeKeys: [
          'preload-props:script:module-main',
          'hoistable-scripts:script:module-main'
        ],
        contractIdsInOrder: [
          'preload-module',
          'preinit-module-script'
        ],
        recordKindsInOrder: ['preload', 'script'],
        scriptKindsInOrder: ['module', 'module'],
        hasClassicScriptPreload: false,
        hasModulePreload: true,
        hasClassicScriptPreinit: false,
        hasModuleScriptPreinit: true,
        conflictStatus: 'validated-no-conflicting-duplicates'
      }
    ]
  );
  assert.deepEqual(
    {
      executionKind:
        diagnostic.scriptModuleFakeDomCommitExecution.executionKind,
      rowCount: diagnostic.scriptModuleFakeDomCommitExecution.rowCount,
      scriptResourceMapRowCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .scriptResourceMapRowCount,
      modulePreloadResourceMapRowCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .modulePreloadResourceMapRowCount,
      fakeResourceOrderExecutionRowCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecutionRowCount,
      fakeResourceOrderDedupeStateCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderDedupeStateCount,
      fakeResourceOrderPreloadPropsRecordCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderPreloadPropsRecordCount,
      fakeResourceOrderHoistableScriptRecordCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderHoistableScriptRecordCount,
      fakeResourceOrderPreloadPropsAdoptionCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderPreloadPropsAdoptionCount,
      fakeDomCommitEvidenceRecorded:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeDomCommitEvidenceRecorded,
      fakeDomCommitApplied:
        diagnostic.scriptModuleFakeDomCommitExecution.fakeDomCommitApplied,
      fakeResourceOrderingExecuted:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderingExecuted,
      fakeResourceOrderingApplied:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderingApplied,
      publicScriptModuleResourceDispatch:
        diagnostic.scriptModuleFakeDomCommitExecution
          .publicScriptModuleResourceDispatch,
      scriptExecutionStarted:
        diagnostic.scriptModuleFakeDomCommitExecution
          .scriptExecutionStarted
    },
    {
      executionKind:
        'react-19.2.6-script-modulepreload-fake-dom-commit-execution-diagnostic',
      rowCount: 4,
      scriptResourceMapRowCount: 2,
      modulePreloadResourceMapRowCount: 1,
      fakeResourceOrderExecutionRowCount: 4,
      fakeResourceOrderDedupeStateCount: 2,
      fakeResourceOrderPreloadPropsRecordCount: 2,
      fakeResourceOrderHoistableScriptRecordCount: 2,
      fakeResourceOrderPreloadPropsAdoptionCount: 2,
      fakeDomCommitEvidenceRecorded: true,
      fakeDomCommitApplied: false,
      fakeResourceOrderingExecuted: true,
      fakeResourceOrderingApplied: true,
      publicScriptModuleResourceDispatch: false,
      scriptExecutionStarted: false
    }
  );
  assert.deepEqual(
    diagnostic.scriptModuleFakeDomCommitExecution.rows.map((row) => ({
      executionOrderIndex: row.executionOrderIndex,
      moduleOrderIndex: row.moduleOrderIndex,
      sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
      sourceModuleDedupeKeyRowId: row.sourceModuleDedupeKeyRowId,
      contractId: row.contractId,
      recordKind: row.recordKind,
      mapKind: row.mapKind,
      scriptKind: row.scriptKind,
      dedupeKey: row.dedupeKey,
      resourceMapDedupeKey: row.resourceMapDedupeKey,
      fakeDomCommitOperation: row.fakeDomCommitOperation,
      wouldCreatePreloadPropsRecord:
        row.wouldCreatePreloadPropsRecord,
      wouldCreateHoistableScriptResource:
        row.wouldCreateHoistableScriptResource,
      wouldAdoptPreloadProps: row.wouldAdoptPreloadProps,
      fakeDomCommitApplied: row.fakeDomCommitApplied,
      dedupeOrderPreserved: row.dedupeOrderPreserved,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch,
      scriptExecutionStarted: row.scriptExecutionStarted
    })),
    [
      {
        executionOrderIndex: 0,
        moduleOrderIndex: 0,
        sourceResourceMapCommitRowId: 'resource-map-commit-2',
        sourceModuleDedupeKeyRowId: 'module-resource-map-dedupe-key-0',
        contractId: 'preload',
        recordKind: 'preload',
        mapKind: 'preload-props',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'preload-props:script:script-main',
        fakeDomCommitOperation:
          'record-classic-script-preload-props-fake-dom-commit',
        wouldCreatePreloadPropsRecord: true,
        wouldCreateHoistableScriptResource: false,
        wouldAdoptPreloadProps: false,
        fakeDomCommitApplied: false,
        dedupeOrderPreserved: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        executionOrderIndex: 1,
        moduleOrderIndex: 1,
        sourceResourceMapCommitRowId: 'resource-map-commit-3',
        sourceModuleDedupeKeyRowId: 'module-resource-map-dedupe-key-0',
        contractId: 'preinit-script',
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:script-main',
        fakeDomCommitOperation:
          'record-classic-script-hoistable-script-fake-dom-commit',
        wouldCreatePreloadPropsRecord: false,
        wouldCreateHoistableScriptResource: true,
        wouldAdoptPreloadProps: true,
        fakeDomCommitApplied: false,
        dedupeOrderPreserved: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        executionOrderIndex: 2,
        moduleOrderIndex: 2,
        sourceResourceMapCommitRowId: 'resource-map-commit-4',
        sourceModuleDedupeKeyRowId: 'module-resource-map-dedupe-key-1',
        contractId: 'preload-module',
        recordKind: 'preload',
        mapKind: 'preload-props',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'preload-props:script:module-main',
        fakeDomCommitOperation:
          'record-modulepreload-preload-props-fake-dom-commit',
        wouldCreatePreloadPropsRecord: true,
        wouldCreateHoistableScriptResource: false,
        wouldAdoptPreloadProps: false,
        fakeDomCommitApplied: false,
        dedupeOrderPreserved: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      },
      {
        executionOrderIndex: 3,
        moduleOrderIndex: 3,
        sourceResourceMapCommitRowId: 'resource-map-commit-5',
        sourceModuleDedupeKeyRowId: 'module-resource-map-dedupe-key-1',
        contractId: 'preinit-module-script',
        recordKind: 'script',
        mapKind: 'hoistable-scripts',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        resourceMapDedupeKey: 'hoistable-scripts:script:module-main',
        fakeDomCommitOperation:
          'record-module-script-hoistable-script-fake-dom-commit',
        wouldCreatePreloadPropsRecord: false,
        wouldCreateHoistableScriptResource: true,
        wouldAdoptPreloadProps: true,
        fakeDomCommitApplied: false,
        dedupeOrderPreserved: true,
        publicScriptModuleResourceDispatch: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModuleFakeDomCommitExecution.dedupeOrderBoundary,
    {
      status:
        'preserved-private-script-module-resource-map-dedupe-order-blocker',
      sourceModuleResourceMapOrderRowCount: 4,
      sourceModuleResourceMapDedupeKeyCount: 2,
      executionRowCount: 4,
      consumedDedupeKeyCount: 2,
      sourceDedupeKeyRowIds: [
        'module-resource-map-dedupe-key-0',
        'module-resource-map-dedupe-key-1'
      ],
      sourceDedupeKeys: [
        'script:script-main',
        'script:module-main'
      ],
      dedupeRowsMutated: false,
      orderRowsMutated: false,
      conflictingDuplicateRecordCount: 0,
      malformedModuleRowCount: 0,
      publicScriptModuleResourceDispatch: false,
      rawValuesRetained: false,
      compatibilityClaimed: false
    }
  );
  assert.deepEqual(
    {
      executionKind:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.executionKind,
      rowCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.rowCount,
      dedupeStateCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.dedupeStateCount,
      preloadPropsRecordCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.preloadPropsRecordCount,
      hoistableScriptResourceCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.hoistableScriptResourceCount,
      preloadPropsAdoptionCount:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.preloadPropsAdoptionCount,
      fakeResourceOrderingExecuted:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.fakeResourceOrderingExecuted,
      fakeResourceOrderingApplied:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.fakeResourceOrderingApplied,
      preloadPropsMapMutated:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.preloadPropsMapMutated,
      hoistableScriptsMapMutated:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.hoistableScriptsMapMutated,
      scriptExecutionStarted:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.scriptExecutionStarted,
      publicScriptModuleResourceDispatch:
        diagnostic.scriptModuleFakeDomCommitExecution
          .fakeResourceOrderExecution.publicScriptModuleResourceDispatch
    },
    {
      executionKind:
        'react-19.2.6-script-modulepreload-fake-resource-order-execution-diagnostic',
      rowCount: 4,
      dedupeStateCount: 2,
      preloadPropsRecordCount: 2,
      hoistableScriptResourceCount: 2,
      preloadPropsAdoptionCount: 2,
      fakeResourceOrderingExecuted: true,
      fakeResourceOrderingApplied: true,
      preloadPropsMapMutated: false,
      hoistableScriptsMapMutated: false,
      scriptExecutionStarted: false,
      publicScriptModuleResourceDispatch: false
    }
  );
  assert.deepEqual(
    diagnostic.scriptModuleFakeDomCommitExecution
      .fakeResourceOrderExecution.rows.map((row) => ({
        fakeResourceOrderIndex: row.fakeResourceOrderIndex,
        sourceScriptModuleFakeDomCommitRowId:
          row.sourceScriptModuleFakeDomCommitRowId,
        contractId: row.contractId,
        recordKind: row.recordKind,
        scriptKind: row.scriptKind,
        dedupeKey: row.dedupeKey,
        fakeResourceOrderOperation: row.fakeResourceOrderOperation,
        preloadPropsRecordObservedBefore:
          row.preloadPropsRecordObservedBefore,
        hoistableScriptResourceObservedBefore:
          row.hoistableScriptResourceObservedBefore,
        fakePreloadPropsRecordCreated:
          row.fakePreloadPropsRecordCreated,
        fakeHoistableScriptResourceCreated:
          row.fakeHoistableScriptResourceCreated,
        fakePreloadPropsAdopted: row.fakePreloadPropsAdopted,
        fakeResourceOrderingExecuted:
          row.fakeResourceOrderingExecuted,
        preloadPropsMapMutated: row.preloadPropsMapMutated,
        hoistableScriptsMapMutated: row.hoistableScriptsMapMutated,
        scriptExecutionStarted: row.scriptExecutionStarted
      })),
    [
      {
        fakeResourceOrderIndex: 0,
        sourceScriptModuleFakeDomCommitRowId:
          'script-module-fake-dom-commit-0',
        contractId: 'preload',
        recordKind: 'preload',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        fakeResourceOrderOperation:
          'execute-classic-script-preload-props-fake-resource-order',
        preloadPropsRecordObservedBefore: false,
        hoistableScriptResourceObservedBefore: false,
        fakePreloadPropsRecordCreated: true,
        fakeHoistableScriptResourceCreated: false,
        fakePreloadPropsAdopted: false,
        fakeResourceOrderingExecuted: true,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      },
      {
        fakeResourceOrderIndex: 1,
        sourceScriptModuleFakeDomCommitRowId:
          'script-module-fake-dom-commit-1',
        contractId: 'preinit-script',
        recordKind: 'script',
        scriptKind: 'classic',
        dedupeKey: 'script:script-main',
        fakeResourceOrderOperation:
          'execute-classic-script-hoistable-script-fake-resource-order',
        preloadPropsRecordObservedBefore: true,
        hoistableScriptResourceObservedBefore: false,
        fakePreloadPropsRecordCreated: false,
        fakeHoistableScriptResourceCreated: true,
        fakePreloadPropsAdopted: true,
        fakeResourceOrderingExecuted: true,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      },
      {
        fakeResourceOrderIndex: 2,
        sourceScriptModuleFakeDomCommitRowId:
          'script-module-fake-dom-commit-2',
        contractId: 'preload-module',
        recordKind: 'preload',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        fakeResourceOrderOperation:
          'execute-modulepreload-preload-props-fake-resource-order',
        preloadPropsRecordObservedBefore: false,
        hoistableScriptResourceObservedBefore: false,
        fakePreloadPropsRecordCreated: true,
        fakeHoistableScriptResourceCreated: false,
        fakePreloadPropsAdopted: false,
        fakeResourceOrderingExecuted: true,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      },
      {
        fakeResourceOrderIndex: 3,
        sourceScriptModuleFakeDomCommitRowId:
          'script-module-fake-dom-commit-3',
        contractId: 'preinit-module-script',
        recordKind: 'script',
        scriptKind: 'module',
        dedupeKey: 'script:module-main',
        fakeResourceOrderOperation:
          'execute-module-script-hoistable-script-fake-resource-order',
        preloadPropsRecordObservedBefore: true,
        hoistableScriptResourceObservedBefore: false,
        fakePreloadPropsRecordCreated: false,
        fakeHoistableScriptResourceCreated: true,
        fakePreloadPropsAdopted: true,
        fakeResourceOrderingExecuted: true,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.scriptModuleFakeDomCommitExecution
      .fakeResourceOrderExecution.dedupeStates.map((row) => ({
        dedupeKey: row.dedupeKey,
        rowCount: row.rowCount,
        sourceScriptModuleFakeDomCommitRowIds:
          row.sourceScriptModuleFakeDomCommitRowIds,
        contractIdsInOrder: row.contractIdsInOrder,
        scriptKindsInOrder: row.scriptKindsInOrder,
        preloadPropsRecordCreated:
          row.preloadPropsRecordCreated,
        hoistableScriptResourceCreated:
          row.hoistableScriptResourceCreated,
        preloadPropsAdoptionCount: row.preloadPropsAdoptionCount,
        preloadPropsMapMutated: row.preloadPropsMapMutated,
        hoistableScriptsMapMutated: row.hoistableScriptsMapMutated,
        scriptExecutionStarted: row.scriptExecutionStarted
      })),
    [
      {
        dedupeKey: 'script:script-main',
        rowCount: 2,
        sourceScriptModuleFakeDomCommitRowIds: [
          'script-module-fake-dom-commit-0',
          'script-module-fake-dom-commit-1'
        ],
        contractIdsInOrder: ['preload', 'preinit-script'],
        scriptKindsInOrder: ['classic', 'classic'],
        preloadPropsRecordCreated: true,
        hoistableScriptResourceCreated: true,
        preloadPropsAdoptionCount: 1,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      },
      {
        dedupeKey: 'script:module-main',
        rowCount: 2,
        sourceScriptModuleFakeDomCommitRowIds: [
          'script-module-fake-dom-commit-2',
          'script-module-fake-dom-commit-3'
        ],
        contractIdsInOrder: [
          'preload-module',
          'preinit-module-script'
        ],
        scriptKindsInOrder: ['module', 'module'],
        preloadPropsRecordCreated: true,
        hoistableScriptResourceCreated: true,
        preloadPropsAdoptionCount: 1,
        preloadPropsMapMutated: false,
        hoistableScriptsMapMutated: false,
        scriptExecutionStarted: false
      }
    ]
  );
  assert.deepEqual(
    {
      status: diagnostic.resourceMapConflictBoundary.status,
      checkedScriptModuleRecordCount:
        diagnostic.resourceMapConflictBoundary
          .checkedScriptModuleRecordCount,
      checkedDedupeKeyCount:
        diagnostic.resourceMapConflictBoundary.checkedDedupeKeyCount,
      checkedStylesheetPrecedenceRecordCount:
        diagnostic.resourceMapConflictBoundary
          .checkedStylesheetPrecedenceRecordCount,
      checkedStylesheetPrecedenceKeyCount:
        diagnostic.resourceMapConflictBoundary
          .checkedStylesheetPrecedenceKeyCount,
      malformedModuleRowCount:
        diagnostic.resourceMapConflictBoundary.malformedModuleRowCount,
      conflictingDuplicateRecordCount:
        diagnostic.resourceMapConflictBoundary
          .conflictingDuplicateRecordCount,
      duplicateStylesheetPrecedenceRowCount:
        diagnostic.resourceMapConflictBoundary
          .duplicateStylesheetPrecedenceRowCount,
      validationMutatedRecords:
        diagnostic.resourceMapConflictBoundary.validationMutatedRecords
    },
    {
      status: 'validated-private-resource-map-commit-record-conflicts',
      checkedScriptModuleRecordCount: 4,
      checkedDedupeKeyCount: 4,
      checkedStylesheetPrecedenceRecordCount: 1,
      checkedStylesheetPrecedenceKeyCount: 1,
      malformedModuleRowCount: 0,
      conflictingDuplicateRecordCount: 0,
      duplicateStylesheetPrecedenceRowCount: 0,
      validationMutatedRecords: false
    }
  );
  assert.equal(diagnostic.stylesheetResourceMapRecords.length, 1);
  assert.equal(diagnostic.preloadResourceMapRecords.length, 4);
  assert.equal(diagnostic.scriptResourceMapRecords.length, 2);
  assert.deepEqual(
    diagnostic.stylesheetLoadStateCommitOrder.rows.map((row) => ({
      resourceMapOrderIndex: row.resourceMapOrderIndex,
      resourceIndex: row.resourceIndex,
      resourceKey: row.resourceKey,
      resourceMapDedupeKey: row.resourceMapDedupeKey,
      precedenceKey: row.precedenceKey,
      fakeLoadingStateLabels: row.fakeLoadingStateLabels,
      fakeLoadingStateBitmasks: row.fakeLoadingStateBitmasks,
      beforeCommitLoadingStateLabel: row.beforeCommitLoadingStateLabel,
      beforeCommitLoadingStateBitmask:
        row.beforeCommitLoadingStateBitmask,
      afterCommitInsertionLoadingStateLabel:
        row.afterCommitInsertionLoadingStateLabel,
      afterCommitInsertionLoadingStateBitmask:
        row.afterCommitInsertionLoadingStateBitmask,
      afterLoadLoadingStateLabel: row.afterLoadLoadingStateLabel,
      afterLoadLoadingStateBitmask: row.afterLoadLoadingStateBitmask,
      afterErrorLoadingStateLabel: row.afterErrorLoadingStateLabel,
      afterErrorLoadingStateBitmask: row.afterErrorLoadingStateBitmask,
      preloadWouldBeTracked: row.preloadWouldBeTracked,
      preinitSeenBefore: row.preinitSeenBefore,
      commitOrderConsumesFakeLoadState:
        row.commitOrderConsumesFakeLoadState,
      deterministicLoadStateChangesRecorded:
        row.deterministicLoadStateChangesRecorded,
      publicStylesheetLoadStateDispatch:
        row.publicStylesheetLoadStateDispatch
    })),
    [
      {
        resourceMapOrderIndex: 1,
        resourceIndex: 0,
        resourceKey: 'style:style-main',
        resourceMapDedupeKey: 'hoistable-styles:style:style-main',
        precedenceKey: 'precedence-main',
        fakeLoadingStateLabels: [
          'not-loaded',
          'loaded',
          'errored',
          'inserted-not-settled',
          'inserted-loaded',
          'inserted-errored'
        ],
        fakeLoadingStateBitmasks: [0, 1, 2, 4, 5, 6],
        beforeCommitLoadingStateLabel: 'not-loaded',
        beforeCommitLoadingStateBitmask: 0,
        afterCommitInsertionLoadingStateLabel: 'inserted-not-settled',
        afterCommitInsertionLoadingStateBitmask: 4,
        afterLoadLoadingStateLabel: 'inserted-loaded',
        afterLoadLoadingStateBitmask: 5,
        afterErrorLoadingStateLabel: 'inserted-errored',
        afterErrorLoadingStateBitmask: 6,
        preloadWouldBeTracked: true,
        preinitSeenBefore: true,
        commitOrderConsumesFakeLoadState: true,
        deterministicLoadStateChangesRecorded: true,
        publicStylesheetLoadStateDispatch: false
      }
    ]
  );
  assert.deepEqual(
    {
      loadStateConsumed:
        diagnostic.stylesheetLoadStateCommitOrder.loadStateConsumed,
      resourceMapEntriesValidated:
        diagnostic.stylesheetLoadStateCommitOrder
          .resourceMapEntriesValidated,
      rowCount: diagnostic.stylesheetLoadStateCommitOrder.rowCount,
      staleResourceMapEntryCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .staleResourceMapEntryCount,
      commitTransitionCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionCount,
      commitTransitionResourceCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionResourceCount,
      commitTransitionExecutionRowCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionExecutionRowCount,
      loadingStateChangeRowCount:
        diagnostic.stylesheetLoadStateCommitOrder
          .loadingStateChangeRowCount,
      commitTransitionRecorded:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionRecorded,
      fakeResourceCommitTransitionRecorded:
        diagnostic.stylesheetLoadStateCommitOrder
          .fakeResourceCommitTransitionRecorded,
      commitTransitionExecutionRecorded:
        diagnostic.stylesheetLoadStateCommitOrder
          .commitTransitionExecutionRecorded,
      deterministicLoadStateChangesRecorded:
        diagnostic.stylesheetLoadStateCommitOrder
          .deterministicLoadStateChangesRecorded,
      publicStylesheetLoadStateDispatch:
        diagnostic.stylesheetLoadStateCommitOrder
          .publicStylesheetLoadStateDispatch
    },
    {
      loadStateConsumed: true,
      resourceMapEntriesValidated: true,
      rowCount: 1,
      staleResourceMapEntryCount: 0,
      commitTransitionCount: 1,
      commitTransitionResourceCount: 1,
      commitTransitionExecutionRowCount: 1,
      loadingStateChangeRowCount: 3,
      commitTransitionRecorded: true,
      fakeResourceCommitTransitionRecorded: true,
      commitTransitionExecutionRecorded: true,
      deterministicLoadStateChangesRecorded: true,
      publicStylesheetLoadStateDispatch: false
    }
  );
  assert.deepEqual(
    {
      transitionKind:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .transitionKind,
      transitionStatus:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .transitionStatus,
      sourceStylesheetLoadErrorStateId:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .sourceStylesheetLoadErrorStateId,
      sourceResourceMapCommitRowIds:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .sourceResourceMapCommitRowIds,
      sourceStylesheetLoadErrorStateRowIds:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .sourceStylesheetLoadErrorStateRowIds,
      fakeResourceKeys:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceKeys,
      fakeResourceMapDedupeKeys:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceMapDedupeKeys,
      fakeResourceRows:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceRows,
      transitionCount:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .transitionCount,
      fakeResourceCount:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceCount,
      fakeResourceCommitTransitionRecorded:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .fakeResourceCommitTransitionRecorded,
      preloadElementCreated:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .preloadElementCreated,
      preloadElementInserted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .preloadElementInserted,
      preloadFetchStarted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .preloadFetchStarted,
      stylesheetElementCreated:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .stylesheetElementCreated,
      stylesheetElementInserted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .stylesheetElementInserted,
      loadEventSubscribed:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .loadEventSubscribed,
      errorEventSubscribed:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .errorEventSubscribed,
      loadingStateMutated:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .loadingStateMutated,
      publicStylesheetLoadStateDispatch:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransition
          .publicStylesheetLoadStateDispatch
    },
    {
      transitionKind:
        'react-19.2.6-stylesheet-load-state-fake-resource-map-commit-transition',
      transitionStatus:
        resourceFormGate
          .privateResourceHintStylesheetLoadStateCommitTransitionStatus,
      sourceStylesheetLoadErrorStateId:
        'resource-map-commit-load-state:1',
      sourceResourceMapCommitRowIds: ['resource-map-commit-1'],
      sourceStylesheetLoadErrorStateRowIds: [
        'stylesheet-resource-state-0'
      ],
      fakeResourceKeys: ['style:style-main'],
      fakeResourceMapDedupeKeys: [
        'hoistable-styles:style:style-main'
      ],
      fakeResourceRows: [
        {
          sourceResourceMapCommitRowId: 'resource-map-commit-1',
          sourceStylesheetLoadErrorStateRowId:
            'stylesheet-resource-state-0',
          resourceKey: 'style:style-main',
          resourceMapDedupeKey: 'hoistable-styles:style:style-main',
          precedenceKey: 'precedence-main',
          fakeLoadingStateLabels: [
            'not-loaded',
            'loaded',
            'errored',
            'inserted-not-settled',
            'inserted-loaded',
            'inserted-errored'
          ],
          fakeLoadingStateBitmasks: [0, 1, 2, 4, 5, 6],
          preloadWouldBeTracked: true,
          commitOrderConsumesFakeLoadState: true
        }
      ],
      transitionCount: 1,
      fakeResourceCount: 1,
      fakeResourceCommitTransitionRecorded: true,
      preloadElementCreated: false,
      preloadElementInserted: false,
      preloadFetchStarted: false,
      stylesheetElementCreated: false,
      stylesheetElementInserted: false,
      loadEventSubscribed: false,
      errorEventSubscribed: false,
      loadingStateMutated: false,
      publicStylesheetLoadStateDispatch: false
    }
  );
  assert.deepEqual(
    {
      executionKind:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .executionKind,
      executionStatus:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .executionStatus,
      sourceTransitionId:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .sourceTransitionId,
      rowCount:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .rowCount,
      loadingStateChangeCount:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .loadingStateChangeCount,
      fakeResourceKeys:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .fakeResourceKeys,
      deterministicLoadStateChangesRecorded:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .deterministicLoadStateChangesRecorded,
      fakeResourceCommitTransitionExecuted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .fakeResourceCommitTransitionExecuted,
      stylesheetElementInserted:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .stylesheetElementInserted,
      loadEventSubscribed:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .loadEventSubscribed,
      loadEventDispatched:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .loadEventDispatched,
      loadingStateMutated:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .loadingStateMutated,
      publicStylesheetLoadStateDispatch:
        diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
          .publicStylesheetLoadStateDispatch
    },
    {
      executionKind:
        'react-19.2.6-stylesheet-load-state-fake-dom-commit-execution-diagnostic',
      executionStatus:
        resourceFormGate
          .privateResourceHintStylesheetLoadStateCommitExecutionStatus,
      sourceTransitionId:
        'resource-map-commit-load-state:1:resource-map-commit-transition',
      rowCount: 1,
      loadingStateChangeCount: 3,
      fakeResourceKeys: ['style:style-main'],
      deterministicLoadStateChangesRecorded: true,
      fakeResourceCommitTransitionExecuted: true,
      stylesheetElementInserted: false,
      loadEventSubscribed: false,
      loadEventDispatched: false,
      loadingStateMutated: false,
      publicStylesheetLoadStateDispatch: false
    }
  );
  assert.deepEqual(
    diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
      .rows.map((row) => ({
        sourceStylesheetLoadStateCommitOrderRowId:
          row.sourceStylesheetLoadStateCommitOrderRowId,
        sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
        resourceKey: row.resourceKey,
        beforeCommitLoadingState: row.beforeCommitLoadingState,
        afterCommitInsertionLoadingState:
          row.afterCommitInsertionLoadingState,
        afterLoadLoadingState: row.afterLoadLoadingState,
        afterErrorLoadingState: row.afterErrorLoadingState,
        loadingStateChangeCount: row.loadingStateChangeCount,
        deterministicLoadStateChangesRecorded:
          row.deterministicLoadStateChangesRecorded,
        loadingStateMutated: row.loadingStateMutated,
        publicStylesheetLoadStateDispatch:
          row.publicStylesheetLoadStateDispatch
      })),
    [
      {
        sourceStylesheetLoadStateCommitOrderRowId:
          'stylesheet-load-state-commit-order-0',
        sourceResourceMapCommitRowId: 'resource-map-commit-1',
        resourceKey: 'style:style-main',
        beforeCommitLoadingState: {
          label: 'not-loaded',
          bitmask: 0,
          notLoaded: true,
          loaded: false,
          errored: false,
          settled: false,
          inserted: false,
          loadListenerInstalled: false,
          errorListenerInstalled: false,
          promiseCreated: false,
          eventDispatched: false,
          compatibilityClaimed: false
        },
        afterCommitInsertionLoadingState: {
          label: 'inserted-not-settled',
          bitmask: 4,
          notLoaded: false,
          loaded: false,
          errored: false,
          settled: false,
          inserted: true,
          loadListenerInstalled: false,
          errorListenerInstalled: false,
          promiseCreated: false,
          eventDispatched: false,
          compatibilityClaimed: false
        },
        afterLoadLoadingState: {
          label: 'inserted-loaded',
          bitmask: 5,
          notLoaded: false,
          loaded: true,
          errored: false,
          settled: true,
          inserted: true,
          loadListenerInstalled: false,
          errorListenerInstalled: false,
          promiseCreated: false,
          eventDispatched: false,
          compatibilityClaimed: false
        },
        afterErrorLoadingState: {
          label: 'inserted-errored',
          bitmask: 6,
          notLoaded: false,
          loaded: false,
          errored: true,
          settled: true,
          inserted: true,
          loadListenerInstalled: false,
          errorListenerInstalled: false,
          promiseCreated: false,
          eventDispatched: false,
          compatibilityClaimed: false
        },
        loadingStateChangeCount: 3,
        deterministicLoadStateChangesRecorded: true,
        loadingStateMutated: false,
        publicStylesheetLoadStateDispatch: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.stylesheetLoadStateCommitOrder.commitTransitionExecution
      .loadingStateChanges.map((row) => ({
        triggerKind: row.triggerKind,
        fromLoadingStateLabel: row.fromLoadingStateLabel,
        fromLoadingStateBitmask: row.fromLoadingStateBitmask,
        toLoadingStateLabel: row.toLoadingStateLabel,
        toLoadingStateBitmask: row.toLoadingStateBitmask,
        insertedBitSet: row.insertedBitSet,
        loadedBitSet: row.loadedBitSet,
        erroredBitSet: row.erroredBitSet,
        loadEventDispatched: row.loadEventDispatched,
        errorEventDispatched: row.errorEventDispatched,
        loadingStateMutated: row.loadingStateMutated
      })),
    [
      {
        triggerKind: 'commit-insertion',
        fromLoadingStateLabel: 'not-loaded',
        fromLoadingStateBitmask: 0,
        toLoadingStateLabel: 'inserted-not-settled',
        toLoadingStateBitmask: 4,
        insertedBitSet: true,
        loadedBitSet: false,
        erroredBitSet: false,
        loadEventDispatched: false,
        errorEventDispatched: false,
        loadingStateMutated: false
      },
      {
        triggerKind: 'load-event',
        fromLoadingStateLabel: 'inserted-not-settled',
        fromLoadingStateBitmask: 4,
        toLoadingStateLabel: 'inserted-loaded',
        toLoadingStateBitmask: 5,
        insertedBitSet: false,
        loadedBitSet: true,
        erroredBitSet: false,
        loadEventDispatched: false,
        errorEventDispatched: false,
        loadingStateMutated: false
      },
      {
        triggerKind: 'error-event',
        fromLoadingStateLabel: 'inserted-not-settled',
        fromLoadingStateBitmask: 4,
        toLoadingStateLabel: 'inserted-errored',
        toLoadingStateBitmask: 6,
        insertedBitSet: false,
        loadedBitSet: false,
        erroredBitSet: true,
        loadEventDispatched: false,
        errorEventDispatched: false,
        loadingStateMutated: false
      }
    ]
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    diagnostic.stylesheetPrecedenceBoundary.precedenceInsertionApplied,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.singletonOwnershipClaimed,
    false
  );
  assert.equal(diagnostic.resourceLifecycleBoundary.modulePreloadRecordCount, 1);
  assert.equal(diagnostic.resourceLifecycleBoundary.moduleScriptRecordCount, 1);
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeDomCommitExecutionRowCount,
    4
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptResourceFakeDomCommitExecutionRowCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .modulePreloadFakeDomCommitExecutionRowCount,
    1
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderExecutionRowCount,
    4
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderDedupeStateCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderPreloadPropsRecordCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderHoistableScriptRecordCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderPreloadPropsAdoptionCount,
    2
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeDomCommitEvidenceRecorded,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.fakeDomCommitApplied,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderingExecuted,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .scriptModuleFakeResourceOrderingApplied,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitOrderRowCount,
    1
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitTransitionCount,
    1
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitExecutionRowCount,
    1
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.stylesheetLoadStateChangeRowCount,
    3
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.stylesheetLoadStateRecordConsumed,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateResourceMapRowsValidated,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitTransitionRecorded,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .stylesheetLoadStateCommitExecutionRecorded,
    true
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary
      .deterministicStylesheetLoadStateChangesRecorded,
    true
  );
  assert.equal(diagnostic.resourceLifecycleBoundary.fetchStarted, false);
  assert.equal(diagnostic.resourceLifecycleBoundary.preloadStarted, false);
  assert.equal(diagnostic.resourceLifecycleBoundary.modulePreloadStarted, false);
  assert.equal(diagnostic.resourceLifecycleBoundary.scriptExecutionStarted, false);
  assert.equal(
    diagnostic.resourceLifecycleBoundary.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.loadEventSubscribed,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.loadStateMutated,
    false
  );
  assert.equal(
    diagnostic.resourceLifecycleBoundary.preloadOrStyleDomWorkDispatched,
    false
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(diagnostic.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(
    diagnostic.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintResourceMapCommitBlockedCapabilities
  );
  assert.equal(fakeDom.head.childNodes.length, 4);
  assert.equal(JSON.stringify(diagnostic).includes('/style.css'), false);
  assert.equal(JSON.stringify(diagnostic).includes('/script.js'), false);
  assert.equal(JSON.stringify(diagnostic).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-style'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-script'), false);
  assert.equal(JSON.stringify(diagnostic).includes('nonce-module'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintResourceMapCommitGateId
  );
  assert.deepEqual(summary.acceptedRecordKinds, [
    'stylesheet',
    'preload',
    'script'
  ]);
  assert.equal(summary.mutatesRealResourceMaps, false);
  assert.equal(summary.mutatesFakeResourceMaps, false);
  assert.equal(summary.claimsSingletonOwnership, false);
  assert.equal(summary.startsFetchOrPreload, false);
  assert.equal(summary.startsScriptExecution, false);
  assert.equal(summary.mutatesLoadState, false);
  assert.equal(summary.recordsModulePreloadRows, true);
  assert.equal(summary.recordsModuleScriptRows, true);
  assert.equal(summary.recordsModuleResourceMapOrderRows, true);
  assert.equal(summary.recordsModuleResourceMapDedupeKeys, true);
  assert.equal(
    summary.recordsScriptModuleFakeDomCommitExecutionRows,
    true
  );
  assert.equal(summary.recordsScriptFakeDomCommitExecutionRows, true);
  assert.equal(
    summary.recordsModulePreloadFakeDomCommitExecutionRows,
    true
  );
  assert.equal(
    summary.recordsScriptModuleFakeResourceOrderExecutionRows,
    true
  );
  assert.equal(
    summary.recordsScriptModuleFakeResourceDedupeStateRows,
    true
  );
  assert.equal(
    summary.executesPrivateScriptModuleFakeResourceOrdering,
    true
  );
  assert.equal(summary.consumesStylesheetLoadErrorState, true);
  assert.equal(summary.recordsStylesheetLoadStateCommitOrderRows, true);
  assert.equal(
    summary.validatesStylesheetLoadStateResourceMapRows,
    true
  );
  assert.equal(summary.recordsStylesheetLoadStateCommitTransition, true);
  assert.equal(summary.recordsOneFakeResourceMapCommitTransition, true);
  assert.equal(
    summary.recordsStylesheetLoadStateCommitExecutionRows,
    true
  );
  assert.equal(summary.recordsStylesheetLoadStateChangeRows, true);
  assert.equal(
    summary.recordsDeterministicStylesheetLoadStateChanges,
    true
  );
  assert.equal(summary.rejectsMalformedModuleRows, true);
  assert.equal(summary.rejectsConflictingDuplicateRecords, true);
  assert.equal(summary.rejectsDuplicateStylesheetPrecedenceRows, true);
  assert.equal(summary.rejectsStaleStylesheetResourceMapEntries, true);
  assert.equal(summary.rejectsPublicResourceDispatchClaims, true);
  assert.equal(summary.publicScriptModuleResourceDispatch, false);
  assert.equal(summary.dispatchesPreloadOrStyleDomWork, false);
  assert.equal(summary.publicStylesheetLoadStateDispatch, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintResourceMapCommitBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintResourceMapCommitError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintResourceMapCommitGateErrorCode
  );
  assert.equal(error.exportName, 'resource-hint-resource-map-commit');
  assert.equal(error.resourceMapCommitId, 'resource-map-commit:1');
  assert.equal(
    error.sourceStylesheetLoadErrorStateId,
    'resource-map-commit-load-state:1'
  );
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintResourceMapCommitBlockedCapabilities
  );

  assert.throws(
    () =>
      commitGate.recordResourceMapCommitDiagnostic(order, stylesheet, {
        explicitResourceMapCommitDiagnostic: true
      }),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'resource-map commit gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintResourceMapCommitGate()
        .recordResourceMapCommitDiagnostic(order, stylesheet, {
          explicitResourceMapCommitDiagnostic: true,
          resourceMap: throwingProxy('real resource map')
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'resourceMap must not be passed to the resource-map commit gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintResourceMapCommitGate()
        .recordResourceMapCommitDiagnostic(order, stylesheet, {
          explicitResourceMapCommitDiagnostic: true,
          publicResourceHintDomInsertion: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'publicResourceHintDomInsertion must not claim public resource dispatch in the resource-map commit gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintResourceMapCommitGate()
        .recordResourceMapCommitDiagnostic({}, stylesheet, {
          explicitResourceMapCommitDiagnostic: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintResourceMapCommitError(
        {}
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource-map commit rejects duplicate stylesheet precedence rows', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-duplicate-stylesheet',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style-again',
            fetchPriority: 'high'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      }
    ]
  );

  assert.throws(
    () =>
      scenario.commitGate.recordResourceMapCommitDiagnostic(
        scenario.order,
        scenario.stylesheet,
        {
          explicitResourceMapCommitDiagnostic: true
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'duplicate stylesheet precedence rows for hoistable-styles:style:style-main'
    }
  );
  assert.equal(scenario.fakeDom.head.childNodes.length, 1);
});

test('private resource root-map storage preflight records canonical rows only', () => {
  const scenario = createRootMapStoragePreflightScenario(
    'root-map-storage-canonical'
  );
  const preflight = scenario.storageGate.recordRootMapStoragePreflight(
    scenario.commit,
    {
      explicitRootMapStoragePreflight: true,
      preflightId: 'canonical-root-map-storage',
      rootId: 'canonical-resource-root',
      expectedSourceResourceMapCommitRowIds: [
        'resource-map-commit-1',
        'resource-map-commit-3',
        'resource-map-commit-4'
      ]
    }
  );
  const summary =
    resourceFormGate.describePrivateResourceHintRootMapStoragePreflightGate();

  assert.equal(Object.isFrozen(preflight), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintRootMapStoragePreflightRecord(
      preflight
    ),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintRootMapStoragePreflightRecordPayload(
      preflight
    ),
    preflight
  );
  assert.equal(
    preflight.rootMapStoragePreflightId,
    'root-map-storage-canonical-storage:1'
  );
  assert.equal(
    preflight.rootMapStoragePreflightStatus,
    resourceFormGate.privateResourceHintRootMapStoragePreflightStatus
  );
  assert.equal(
    preflight.executionStatus,
    resourceFormGate
      .privateResourceHintRootMapStoragePreflightExecutionStatus
  );
  assert.equal(
    preflight.compatibilityStatus,
    resourceFormGate
      .privateResourceHintRootMapStoragePreflightCompatibilityBlockedStatus
  );
  assert.equal(
    preflight.sourceResourceMapCommitId,
    scenario.commit.resourceMapCommitId
  );
  assert.deepEqual(preflight.acceptedContractIds, [
    'preinit-style',
    'preinit-script',
    'preinit-module-script'
  ]);
  assert.deepEqual(preflight.rootMapStoragePlan, {
    storageKind:
      'react-19.2.6-resource-root-map-storage-preflight',
    targetKind: 'document-head',
    hostTag: 'head',
    rootId: 'canonical-resource-root',
    rootKind: 'document-or-shadow-root',
    ownerRootId: 'canonical-resource-root',
    rootMapStorageRowCount: 3,
    canonicalRootMapStorageRowCount: 3,
    hoistableStylesRootMapRowCount: 1,
    hoistableScriptsRootMapRowCount: 2,
    skippedPreloadPropsRowCount: 2,
    checkedRootMapDedupeKeyCount: 3,
    duplicateRootMapStorageRowCount: 0,
    staleRootMapStorageRowCount: 0,
    foreignRootMapStorageRowCount: 0,
    expectedSourceRowsValidated: true,
    rootOwnerValidated: true,
    rootResourceStorageShapeRecorded: true,
    rootResourceStorageCreated: false,
    rootResourceStorageMutated: false,
    hoistableStylesMapCreated: false,
    hoistableStylesMapMutated: false,
    hoistableScriptsMapCreated: false,
    hoistableScriptsMapMutated: false,
    preloadPropsMapCreated: false,
    preloadPropsMapMutated: false,
    realResourceMapsCreated: false,
    realResourceMapsMutated: false,
    fakeResourceMapsCreated: false,
    fakeResourceMapsMutated: false,
    publicResourceHintDomInsertion: false,
    publicResourceMapCommitBehavior: false,
    publicScriptModuleResourceDispatch: false,
    publicStylesheetLoadStateDispatch: false,
    rawValuesRetained: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(
    preflight.rootMapStorageRows.map((row) => ({
      rowId: row.rowId,
      sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
      rootMapName: row.rootMapName,
      rootMapDedupeKey: row.rootMapDedupeKey,
      recordKind: row.recordKind,
      resourceShapeKind: row.resourceShapeKind,
      resourceKey: row.resourceKey,
      scriptKind: row.scriptKind,
      wouldStoreInRootMap: row.wouldStoreInRootMap,
      canonicalRootMapStorageRow: row.canonicalRootMapStorageRow,
      rootResourceStorageMutated: row.rootResourceStorageMutated,
      hoistableStylesMapMutated: row.hoistableStylesMapMutated,
      hoistableScriptsMapMutated: row.hoistableScriptsMapMutated,
      publicResourceHintDomInsertion: row.publicResourceHintDomInsertion,
      publicResourceMapCommitBehavior: row.publicResourceMapCommitBehavior,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch
    })),
    [
      {
        rowId: 'root-map-storage-preflight-0',
        sourceResourceMapCommitRowId: 'resource-map-commit-1',
        rootMapName: 'hoistableStyles',
        rootMapDedupeKey: 'hoistableStyles:style:style-main',
        recordKind: 'stylesheet',
        resourceShapeKind: 'stylesheet-resource',
        resourceKey: 'style:style-main',
        scriptKind: null,
        wouldStoreInRootMap: true,
        canonicalRootMapStorageRow: true,
        rootResourceStorageMutated: false,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        rowId: 'root-map-storage-preflight-1',
        sourceResourceMapCommitRowId: 'resource-map-commit-3',
        rootMapName: 'hoistableScripts',
        rootMapDedupeKey: 'hoistableScripts:script:script-main',
        recordKind: 'script',
        resourceShapeKind: 'script-resource',
        resourceKey: 'script:script-main',
        scriptKind: 'classic',
        wouldStoreInRootMap: true,
        canonicalRootMapStorageRow: true,
        rootResourceStorageMutated: false,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        rowId: 'root-map-storage-preflight-2',
        sourceResourceMapCommitRowId: 'resource-map-commit-4',
        rootMapName: 'hoistableScripts',
        rootMapDedupeKey: 'hoistableScripts:script:module-main',
        recordKind: 'script',
        resourceShapeKind: 'script-resource',
        resourceKey: 'script:module-main',
        scriptKind: 'module',
        wouldStoreInRootMap: true,
        canonicalRootMapStorageRow: true,
        rootResourceStorageMutated: false,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      }
    ]
  );
  assert.deepEqual(
    preflight.skippedPreloadPropsRows.map((row) => ({
      sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
      mapKind: row.mapKind,
      resourceKey: row.resourceKey,
      skippedReason: row.skippedReason,
      wouldStoreInRootMap: row.wouldStoreInRootMap,
      preloadPropsMapMutated: row.preloadPropsMapMutated
    })),
    [
      {
        sourceResourceMapCommitRowId: 'resource-map-commit-0',
        mapKind: 'preload-props',
        resourceKey: 'style:style-main',
        skippedReason: 'preload-props-map-is-not-root-owned-storage',
        wouldStoreInRootMap: false,
        preloadPropsMapMutated: false
      },
      {
        sourceResourceMapCommitRowId: 'resource-map-commit-2',
        mapKind: 'preload-props',
        resourceKey: 'script:script-main',
        skippedReason: 'preload-props-map-is-not-root-owned-storage',
        wouldStoreInRootMap: false,
        preloadPropsMapMutated: false
      }
    ]
  );
  assert.deepEqual(
    {
      hasHoistableStylesMap:
        preflight.rootResourceStorageShape.hasHoistableStylesMap,
      hasHoistableScriptsMap:
        preflight.rootResourceStorageShape.hasHoistableScriptsMap,
      privateInternalRootResourcesKeyWritten:
        preflight.rootResourceStorageShape
          .privateInternalRootResourcesKeyWritten,
      rootResourceStorageMutated:
        preflight.rootResourceStorageShape.rootResourceStorageMutated,
      hoistableStylesMapMutated:
        preflight.rootResourceStorageShape.hoistableStylesMapMutated,
      hoistableScriptsMapMutated:
        preflight.rootResourceStorageShape.hoistableScriptsMapMutated
    },
    {
      hasHoistableStylesMap: true,
      hasHoistableScriptsMap: true,
      privateInternalRootResourcesKeyWritten: false,
      rootResourceStorageMutated: false,
      hoistableStylesMapMutated: false,
      hoistableScriptsMapMutated: false
    }
  );
  assert.equal(
    preflight.rootMapStorageValidationBoundary.status,
    'validated-private-resource-root-map-storage-preflight'
  );
  assert.equal(
    preflight.rootMapStorageValidationBoundary.expectedSourceRowsValidated,
    true
  );
  assert.equal(
    preflight.rootMapPublicBoundary.publicResourceApisReachable,
    false
  );
  assert.equal(
    preflight.rootMapPublicBoundary.rootResourceStorageMutated,
    false
  );
  assert.equal(
    preflight.rootMapPublicBoundary.publicResourceMapCommitBehavior,
    false
  );
  assert.equal(
    preflight.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(preflight.publicResourceBoundary.realDocumentMutated, false);
  assert.equal(preflight.publicHeadBoundary.publicSingletonBehavior, false);
  assert.equal(preflight.sideEffects.rootMapStoragePreflightRecorded, true);
  assert.equal(preflight.sideEffects.rootMapStorageRowsRecorded, true);
  assert.equal(
    preflight.sideEffects.canonicalRootMapStorageRowsRecorded,
    true
  );
  assert.equal(preflight.sideEffects.rootResourceStorageShapeRecorded, true);
  assert.equal(preflight.sideEffects.hoistableStylesRootMapRowsRecorded, true);
  assert.equal(preflight.sideEffects.hoistableScriptsRootMapRowsRecorded, true);
  assert.equal(preflight.sideEffects.preloadPropsRootMapRowsSkipped, true);
  assert.equal(preflight.sideEffects.rootMapStorageValidationRecorded, true);
  assert.equal(preflight.sideEffects.rootResourceStorageMutated, false);
  assert.equal(preflight.sideEffects.hoistableStylesMapMutated, false);
  assert.equal(preflight.sideEffects.hoistableScriptsMapMutated, false);
  assert.equal(preflight.sideEffects.preloadPropsMapMutated, false);
  assert.equal(preflight.sideEffects.realResourceMapsMutated, false);
  assert.equal(preflight.sideEffects.fakeResourceMapsMutated, false);
  assert.equal(preflight.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(preflight.sideEffects.publicResourceMapCommitBehavior, false);
  assert.equal(
    preflight.sideEffects.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(preflight.sideEffects.compatibilityClaimed, false);
  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintRootMapStoragePreflightGateId
  );
  assert.deepEqual(summary.acceptedRootMapNames, [
    'hoistableStyles',
    'hoistableScripts'
  ]);
  assert.equal(summary.recordsCanonicalRootMapStorageRows, true);
  assert.equal(summary.skipsPreloadPropsRootStorage, true);
  assert.equal(summary.mutatesRootResourceStorage, false);
  assert.equal(summary.publicResourceMapCommitBehavior, false);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintRootMapStoragePreflightBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintRootMapStoragePreflightError(
      preflight
    );
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintRootMapStoragePreflightGateErrorCode
  );
  assert.equal(
    error.rootMapStoragePreflightId,
    preflight.rootMapStoragePreflightId
  );
  assert.equal(
    error.sourceResourceMapCommitId,
    scenario.commit.resourceMapCommitId
  );
  assert.equal(error.rootMapStoragePlan.rootMapStorageRowCount, 3);
  assert.equal(JSON.stringify(preflight).includes('/style.css'), false);
  assert.equal(JSON.stringify(preflight).includes('/script.js'), false);
  assert.equal(JSON.stringify(preflight).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(preflight).includes('sha256-style'), false);
  assert.equal(JSON.stringify(preflight).includes('nonce-module'), false);
});

test('private resource root-map fake metadata negative matrix stays fail-closed after accepted preflight', () => {
  const scenario = createRootMapStoragePreflightScenario(
    'root-map-storage-fake-metadata-negative'
  );
  const headChildCount = scenario.fakeDom.head.childNodes.length;
  const preflight = scenario.storageGate.recordRootMapStoragePreflight(
    scenario.commit,
    {
      explicitRootMapStoragePreflight: true,
      preflightId: 'fake-metadata-negative-root-map',
      rootId: 'fake-metadata-resource-root',
      expectedSourceResourceMapCommitRowIds: [
        'resource-map-commit-1',
        'resource-map-commit-3',
        'resource-map-commit-4'
      ]
    }
  );

  assert.equal(scenario.fakeDom.head.childNodes.length, headChildCount);
  assert.equal(preflight.rootMapStorageRows.length, 3);
  assert.equal(preflight.skippedPreloadPropsRows.length, 2);

  for (const row of preflight.rootMapStorageRows) {
    assert.equal(Object.isFrozen(row), true, row.rowId);
    assert.equal(row.wouldStoreInRootMap, true, row.rowId);
    assert.equal(row.canonicalRootMapStorageRow, true, row.rowId);
    assert.equal(row.rootResourceStorageMutated, false, row.rowId);
    assert.equal(row.hoistableStylesMapMutated, false, row.rowId);
    assert.equal(row.hoistableScriptsMapMutated, false, row.rowId);
    assert.equal(row.preloadPropsMapMutated, false, row.rowId);
    assert.equal(row.fetchStarted, false, row.rowId);
    assert.equal(row.loadEventSubscribed, false, row.rowId);
    assert.equal(row.loadingStateMutated, false, row.rowId);
    assert.equal(row.scriptExecutionStarted, false, row.rowId);
    assert.equal(row.publicResourceHintDomInsertion, false, row.rowId);
    assert.equal(row.publicResourceMapCommitBehavior, false, row.rowId);
    assert.equal(row.publicScriptModuleResourceDispatch, false, row.rowId);
    assert.equal(row.compatibilityClaimed, false, row.rowId);
  }

  for (const row of preflight.skippedPreloadPropsRows) {
    assert.equal(Object.isFrozen(row), true, row.rowId);
    assert.equal(row.mapKind, 'preload-props', row.rowId);
    assert.equal(row.wouldStoreInRootMap, false, row.rowId);
    assert.equal(row.preloadPropsMapMutated, false, row.rowId);
    assert.equal(row.publicResourceDispatchBlocked, true, row.rowId);
    assert.equal(row.publicResourceHintDomInsertion, false, row.rowId);
    assert.equal(row.publicResourceMapCommitBehavior, false, row.rowId);
    assert.equal(row.compatibilityClaimed, false, row.rowId);
  }

  for (const mutate of [
    () => {
      preflight.rootMapStorageRows[0].rootResourceStorageMutated = true;
    },
    () => {
      preflight.rootMapStorageRows[1].loadingStateMutated = true;
    },
    () => {
      preflight.rootMapStorageRows[2].scriptExecutionStarted = true;
    },
    () => {
      preflight.skippedPreloadPropsRows[0].wouldStoreInRootMap = true;
    },
    () => {
      scenario.commit.privateResourceMapRecords[1].fetchStarted = true;
    },
    () => {
      scenario.commit.privateResourceMapRecords[3].scriptExecutionStarted =
        true;
    }
  ]) {
    assert.throws(mutate, TypeError);
  }

  const tamperedLifecycleCommit = {
    ...scenario.commit,
    privateResourceMapRecords:
      scenario.commit.privateResourceMapRecords.map((row, index) =>
        index === 3
          ? {
              ...row,
              scriptExecutionStarted: true
            }
          : row
      )
  };
  assert.equal(
    resourceFormGate.isPrivateResourceHintResourceMapCommitRecord(
      tamperedLifecycleCommit
    ),
    false
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(tamperedLifecycleCommit, {
          explicitRootMapStoragePreflight: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidRecordCode,
      compatibilityTarget
    }
  );

  const negativeAdmissions = [
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: [
          'resource-map-commit-1',
          'resource-map-commit-3',
          'resource-map-commit-0'
        ]
      },
      reason:
        'stale root-map storage rows: expected source row ids must match canonical storage rows'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        preloadPropsMapMutated: true
      },
      reason:
        'preloadPropsMapMutated must not claim root resource-map storage or preload-props mutation in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        scriptExecutionStarted: true
      },
      reason:
        'scriptExecutionStarted must not claim stylesheet or script lifecycle execution in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        publicHeadMutation: true
      },
      reason:
        'publicHeadMutation must not claim public head or DOM mutation in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        packageExportCompatibilityClaimed: true
      },
      reason:
        'packageExportCompatibilityClaimed must not claim package/export compatibility in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        publicResourceHintDomInsertion: true
      },
      reason:
        'publicResourceHintDomInsertion must not claim public resource dispatch in the root-map storage preflight gate'
    },
    {
      admission: {
        explicitRootMapStoragePreflight: true,
        rootResources: throwingProxy('fake root resources')
      },
      reason:
        'rootResources must not be passed to the root-map storage preflight gate'
    }
  ];

  for (const {admission, reason} of negativeAdmissions) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      admission,
      reason
    );
  }

  assert.equal(JSON.stringify(preflight).includes('/style.css'), false);
  assert.equal(JSON.stringify(preflight).includes('/script.js'), false);
  assert.equal(JSON.stringify(preflight).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(preflight).includes('sha256-style'), false);
  assert.equal(JSON.stringify(preflight).includes('nonce-module'), false);
});

test('private resource root-map storage execution mutates deterministic fake maps only', () => {
  const scenario = createRootMapStoragePreflightScenario(
    'root-map-storage-private-execution'
  );
  const preflight = scenario.storageGate.recordRootMapStoragePreflight(
    scenario.commit,
    {
      explicitRootMapStoragePreflight: true,
      preflightId: 'private-execution-root-map-preflight',
      rootId: 'private-execution-resource-root',
      expectedSourceResourceMapCommitRowIds: [
        'resource-map-commit-1',
        'resource-map-commit-3',
        'resource-map-commit-4'
      ]
    }
  );
  const storageGate = resourceFormGate.createResourceHintRootMapStorageGate({
    requestIdPrefix: 'root-map-storage-private-execution-run'
  });
  const execution = storageGate.recordRootMapStorageExecution(preflight, {
    explicitRootMapStorageExecution: true,
    executionId: 'private-execution-root-map-storage',
    rootId: 'private-execution-resource-root',
    expectedRootMapStorageRowIds: [
      'root-map-storage-preflight-0',
      'root-map-storage-preflight-1',
      'root-map-storage-preflight-2'
    ]
  });
  const summary =
    resourceFormGate.describePrivateResourceHintRootMapStorageGate();

  assert.equal(
    resourceFormGate.isPrivateResourceHintRootMapStorageRecord(execution),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateResourceHintRootMapStorageRecordPayload(
      execution
    ),
    execution
  );
  assert.equal(
    execution.rootMapStorageStatus,
    resourceFormGate.privateResourceHintRootMapStorageStatus
  );
  assert.equal(
    execution.executionStatus,
    resourceFormGate.privateResourceHintRootMapStorageExecutionStatus
  );
  assert.equal(
    execution.compatibilityStatus,
    resourceFormGate
      .privateResourceHintRootMapStorageCompatibilityBlockedStatus
  );
  assert.equal(
    execution.sourceRootMapStoragePreflightId,
    preflight.rootMapStoragePreflightId
  );
  assert.equal(preflight.rootMapStoragePlan.rootResourceStorageMutated, false);
  assert.equal(preflight.rootMapStoragePlan.fakeResourceMapsMutated, false);
  assert.equal(preflight.sideEffects.rootResourceStorageMutated, false);
  assert.equal(execution.rootMapStorageExecutionRows.length, 3);
  assert.deepEqual(
    execution.rootMapStorageExecutionRows.map((row) => ({
      sourceRootMapStorageRowId: row.sourceRootMapStorageRowId,
      sourceResourceMapCommitRowId: row.sourceResourceMapCommitRowId,
      rootMapName: row.rootMapName,
      rootMapDedupeKey: row.rootMapDedupeKey,
      storedInRootMap: row.storedInRootMap,
      rootResourceStorageMutated: row.rootResourceStorageMutated,
      hoistableStylesMapMutated: row.hoistableStylesMapMutated,
      hoistableScriptsMapMutated: row.hoistableScriptsMapMutated,
      preloadPropsMapMutated: row.preloadPropsMapMutated,
      publicResourceMapCommitBehavior: row.publicResourceMapCommitBehavior,
      compatibilityClaimed: row.compatibilityClaimed
    })),
    [
      {
        sourceRootMapStorageRowId: 'root-map-storage-preflight-0',
        sourceResourceMapCommitRowId: 'resource-map-commit-1',
        rootMapName: 'hoistableStyles',
        rootMapDedupeKey: 'hoistableStyles:style:style-main',
        storedInRootMap: true,
        rootResourceStorageMutated: true,
        hoistableStylesMapMutated: true,
        hoistableScriptsMapMutated: false,
        preloadPropsMapMutated: false,
        publicResourceMapCommitBehavior: false,
        compatibilityClaimed: false
      },
      {
        sourceRootMapStorageRowId: 'root-map-storage-preflight-1',
        sourceResourceMapCommitRowId: 'resource-map-commit-3',
        rootMapName: 'hoistableScripts',
        rootMapDedupeKey: 'hoistableScripts:script:script-main',
        storedInRootMap: true,
        rootResourceStorageMutated: true,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: true,
        preloadPropsMapMutated: false,
        publicResourceMapCommitBehavior: false,
        compatibilityClaimed: false
      },
      {
        sourceRootMapStorageRowId: 'root-map-storage-preflight-2',
        sourceResourceMapCommitRowId: 'resource-map-commit-4',
        rootMapName: 'hoistableScripts',
        rootMapDedupeKey: 'hoistableScripts:script:module-main',
        storedInRootMap: true,
        rootResourceStorageMutated: true,
        hoistableStylesMapMutated: false,
        hoistableScriptsMapMutated: true,
        preloadPropsMapMutated: false,
        publicResourceMapCommitBehavior: false,
        compatibilityClaimed: false
      }
    ]
  );
  assert.deepEqual(execution.rootMapStorageSnapshot.hoistableStylesMapKeys, [
    'hoistableStyles:style:style-main'
  ]);
  assert.deepEqual(execution.rootMapStorageSnapshot.hoistableScriptsMapKeys, [
    'hoistableScripts:script:script-main',
    'hoistableScripts:script:module-main'
  ]);
  assert.equal(
    execution.rootMapStorageExecutionPlan.rootResourceStorageMutated,
    true
  );
  assert.equal(
    execution.rootMapStorageExecutionPlan.fakeResourceMapsMutated,
    true
  );
  assert.equal(
    execution.rootMapStorageExecutionPlan.realResourceMapsMutated,
    false
  );
  assert.equal(
    execution.rootMapStorageExecutionPlan.preloadPropsMapMutated,
    false
  );
  assert.equal(
    execution.rootMapStorageExecutionPlan.publicResourceMapCommitBehavior,
    false
  );
  assert.equal(execution.sideEffects.rootMapStorageExecutionRecorded, true);
  assert.equal(
    execution.sideEffects.deterministicFakeRootMapStorageExecuted,
    true
  );
  assert.equal(execution.sideEffects.fakeResourceMapsMutated, true);
  assert.equal(execution.sideEffects.realResourceMapsMutated, false);
  assert.equal(execution.sideEffects.preloadPropsMapMutated, false);
  assert.equal(execution.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(execution.sideEffects.publicResourceMapCommitBehavior, false);
  assert.equal(execution.sideEffects.publicScriptModuleResourceDispatch, false);
  assert.equal(execution.sideEffects.publicStylesheetLoadStateDispatch, false);
  assert.equal(execution.sideEffects.scriptExecutionStarted, false);
  assert.equal(execution.sideEffects.resourceLoadStateMutated, false);
  assert.equal(execution.sideEffects.packageExportsMutated, false);
  assert.equal(execution.sideEffects.compatibilityClaimed, false);
  assert.equal(summary.gateId, resourceFormGate.privateResourceHintRootMapStorageGateId);
  assert.equal(summary.mutatesFakeRootResourceStorage, true);
  assert.equal(summary.mutatesRealRootResourceStorage, false);
  assert.equal(summary.mutatesPreloadPropsMap, false);
  assert.equal(summary.publicResourceMapCommitBehavior, false);
  assert.deepEqual(
    summary.blockedCapabilities,
    resourceFormGate.resourceHintRootMapStorageBlockedCapabilities
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintRootMapStorageError(
      execution
    );
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintRootMapStorageGateErrorCode
  );
  assert.equal(
    error.rootMapStorageExecutionId,
    execution.rootMapStorageExecutionId
  );
  assert.equal(JSON.stringify(execution).includes('/style.css'), false);
  assert.equal(JSON.stringify(execution).includes('/script.js'), false);
  assert.equal(JSON.stringify(execution).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(execution).includes('sha256-style'), false);
  assert.equal(JSON.stringify(execution).includes('nonce-module'), false);

  assert.throws(
    () =>
      storageGate.recordRootMapStorageExecution(preflight, {
        explicitRootMapStorageExecution: true
      }),
    {
      code:
        resourceFormGate.privateResourceHintRootMapStorageInvalidAdmissionCode,
      compatibilityTarget
    }
  );

  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      sourceRootMapStoragePreflightId: 'stale-root-map-preflight'
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      rootId: 'foreign-resource-root'
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      expectedRootMapStorageRowIds: [
        'root-map-storage-preflight-0',
        'stale-root-map-storage-preflight-row',
        'root-map-storage-preflight-2'
      ]
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      fakeRootResources: throwingProxy('fake root resources')
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      publicResourceHintDomInsertion: true
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      packageExportCompatibilityClaimed: true
    }
  );
  assertRootMapStorageExecutionAdmissionRejects(
    preflight,
    {
      explicitRootMapStorageExecution: true,
      scriptExecutionStarted: true
    }
  );
  for (const field of [
    'publicResourceRootMapStorageCompatibilityClaimed',
    'publicResourceMapCommitCompatibilityClaimed',
    'publicResourceDispatchCompatibilityClaimed',
    'publicPackageCompatibilityClaimed',
    'publicPackageExportsCompatibilityClaimed'
  ]) {
    assertRootMapStorageExecutionAdmissionRejects(
      preflight,
      {
        explicitRootMapStorageExecution: true,
        [field]: true
      }
    );
  }
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStorageGate()
        .recordRootMapStorageExecution({...preflight}, {
          explicitRootMapStorageExecution: true
        }),
    {
      code: resourceFormGate.privateResourceHintRootMapStorageInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintRootMapStorageError(
        {...execution}
      ),
    {
      code: resourceFormGate.privateResourceHintRootMapStorageInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource root-map storage preflight rejects stale duplicate and foreign rows', () => {
  const staleScenario = createRootMapStoragePreflightScenario(
    'root-map-storage-stale'
  );
  assert.throws(
    () =>
      staleScenario.storageGate.recordRootMapStoragePreflight(
        staleScenario.commit,
        {
          explicitRootMapStoragePreflight: true,
          rootId: 'stale-resource-root',
          expectedSourceResourceMapCommitRowIds: [
            'resource-map-commit-1',
            'resource-map-commit-3',
            'stale-resource-map-commit-row'
          ]
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stale root-map storage rows: expected source row ids must match canonical storage rows'
    }
  );

  const foreignScenario = createRootMapStoragePreflightScenario(
    'root-map-storage-foreign'
  );
  assert.throws(
    () =>
      foreignScenario.storageGate.recordRootMapStoragePreflight(
        foreignScenario.commit,
        {
          explicitRootMapStoragePreflight: true,
          rootId: 'canonical-resource-root',
          ownerRootId: 'foreign-resource-root'
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'foreign root-map storage owner must match rootId'
    }
  );

  const duplicateScenario = createDuplicateRootMapStoragePreflightScenario();
  assert.throws(
    () =>
      duplicateScenario.storageGate.recordRootMapStoragePreflight(
        duplicateScenario.commit,
        {
          explicitRootMapStoragePreflight: true,
          rootId: 'duplicate-resource-root'
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'duplicate root-map storage row for hoistableScripts:script:script-main'
    }
  );

  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(staleScenario.commit, {
          explicitRootMapStoragePreflight: true,
          sourceResourceMapCommitId: 'foreign-resource-map-commit:1'
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stale root-map storage preflight source must reference the resource-map commit record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(staleScenario.commit, {
          explicitRootMapStoragePreflight: true,
          rootResources: throwingProxy('root resources')
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'rootResources must not be passed to the root-map storage preflight gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight({}, {
          explicitRootMapStoragePreflight: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintRootMapStoragePreflightError(
        {}
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidRecordCode,
      compatibilityTarget
    }
  );

  const tamperedMixedKindCommit = {
    ...staleScenario.commit,
    privateResourceMapRecords:
      staleScenario.commit.privateResourceMapRecords.map((row, index) =>
        index === 1
          ? {
              ...row,
              recordKind: 'script',
              mapKind: 'hoistable-styles',
              resourceKind: 'script',
              contractId: 'preinit-script',
              scriptKind: 'classic'
            }
          : row
      )
  };
  assert.equal(
    resourceFormGate.isPrivateResourceHintResourceMapCommitRecord(
      tamperedMixedKindCommit
    ),
    false
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(tamperedMixedKindCommit, {
          explicitRootMapStoragePreflight: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () => {
      staleScenario.commit.privateResourceMapRecords[1].mapKind =
        'hoistable-scripts';
    },
    TypeError
  );
});

test('private resource root-map storage preflight rejects public claims raw targets and malformed admissions', () => {
  const scenario = createRootMapStoragePreflightScenario(
    'root-map-storage-public-claims'
  );
  const headChildCount = scenario.fakeDom.head.childNodes.length;
  const expectedReactDomPackageExportKeys = [
    '.',
    './client',
    './server',
    './server.browser',
    './server.bun',
    './server.edge',
    './server.node',
    './static',
    './static.browser',
    './static.edge',
    './static.node',
    './profiling',
    './test-utils',
    './package.json'
  ];
  const publicClaimFields = [
    'publicResourceHintDomInsertion',
    'publicResourceMapCommitBehavior',
    'publicStylesheetResourceBehavior',
    'publicStylesheetLoadStateDispatch',
    'publicStylesheetPrecedenceBehavior',
    'publicScriptModuleResourceDispatch',
    'publicResourceApisReachable',
    'compatibilityClaimed'
  ];
  const rootStorageClaimFields = [
    'rootResourceStorageMutated',
    'hoistableStylesMapMutated',
    'hoistableScriptsMapMutated',
    'preloadPropsMapMutated',
    'realResourceMapsMutated',
    'fakeResourceMapsMutated'
  ];
  const headMutationClaimFields = [
    'publicHeadSingletonBehavior',
    'publicSingletonBehavior',
    'singletonResolutionReachable',
    'headChildrenCleared',
    'realDocumentMutated',
    'realHeadMutated',
    'fakeHeadMutated'
  ];
  const lifecycleClaimFields = [
    'resourceFetchStarted',
    'preloadStarted',
    'modulePreloadStarted',
    'scriptPreinitStarted',
    'moduleScriptPreinitStarted',
    'scriptExecutionStarted',
    'resourceLoadStateMutated',
    'stylesheetLoadStateMutated',
    'preloadOrStyleDomWorkDispatched',
    'loadEventSubscribed',
    'errorEventSubscribed'
  ];
  const packageClaimFields = [
    'packageCompatibilityClaimed',
    'packageExportCompatibilityClaimed',
    'packageExportsMutated',
    'packageJsonExportsMutated',
    'rootManifestsOrLockfilesMutated',
    'resourceFormGatesExported',
    'exportsPrivateResourceHintRootMapStoragePreflight'
  ];
  const blockedTargetFields = [
    'root',
    'document',
    'fakeDocument',
    'head',
    'fakeHead',
    'resourceRoot',
    'rootResources',
    'resourceMap',
    'realResourceMap',
    'fakeResourceMap',
    'hoistableStyles',
    'hoistableScripts',
    'stylesheetMap',
    'scriptMap',
    'preloadMap',
    'preloadPropsMap',
    'instance',
    'node',
    'element'
  ];
  const malformedAdmissionCases = [
    [
      null,
      'root-map storage preflight admission metadata must be an object'
    ],
    [
      {},
      'explicitRootMapStoragePreflight must be true'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        preflightKind: 'public-root-map-storage'
      },
      'preflightKind must be deterministic-private-root-map-storage-preflight'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        targetKind: 'document-body'
      },
      'targetKind must be document-head'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        hostTag: 'body'
      },
      'hostTag must be head'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        rootKind: 'live-document'
      },
      'rootKind must be document-or-shadow-root'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: 'resource-map-commit-1'
      },
      'expectedSourceResourceMapCommitRowIds must be an array when provided'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: [
          'resource-map-commit-1',
          ''
        ]
      },
      'expectedSourceResourceMapCommitRowIds must contain non-empty strings'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: [
          'resource-map-commit-1',
          1
        ]
      },
      'expectedSourceResourceMapCommitRowIds must contain non-empty strings'
    ],
    [
      {
        explicitRootMapStoragePreflight: true,
        expectedSourceResourceMapCommitRowIds: [
          'resource-map-commit-1',
          'resource-map-commit-1'
        ]
      },
      'duplicate expected root-map storage source row resource-map-commit-1'
    ]
  ];

  for (const field of publicClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim public resource dispatch in ` +
        'the root-map storage preflight gate'
    );
  }

  for (const field of rootStorageClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim root resource-map storage or ` +
        'preload-props mutation in the root-map storage preflight gate'
    );
  }

  for (const field of headMutationClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim public head or DOM mutation in ` +
        'the root-map storage preflight gate'
    );
  }

  for (const field of lifecycleClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim stylesheet or script lifecycle ` +
        'execution in the root-map storage preflight gate'
    );
  }

  for (const field of packageClaimFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: true
      },
      `${field} must not claim package/export compatibility in ` +
        'the root-map storage preflight gate'
    );
  }

  for (const field of blockedTargetFields) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      {
        explicitRootMapStoragePreflight: true,
        [field]: throwingProxy(`root-map ${field}`)
      },
      `${field} must not be passed to the root-map storage preflight gate`
    );
  }

  for (const [admission, reason] of malformedAdmissionCases) {
    assertRootMapStoragePreflightAdmissionRejects(
      scenario.commit,
      admission,
      reason
    );
  }

  const summary =
    resourceFormGate.describePrivateResourceHintRootMapStoragePreflightGate();
  const packageJson = require(path.join(packageRoot, 'package.json'));
  assert.equal(scenario.fakeDom.head.childNodes.length, headChildCount);
  assert.equal(summary.publicResourceHintDomInsertion, false);
  assert.equal(summary.publicResourceMapCommitBehavior, false);
  assert.equal(summary.publicScriptModuleResourceDispatch, false);
  assert.equal(summary.publicStylesheetLoadStateDispatch, false);
  assert.equal(summary.rejectsMixedRootMapRowKinds, true);
  assert.equal(summary.rejectsPreloadPropsRootStorageClaims, true);
  assert.equal(summary.rejectsPublicHeadMutationClaims, true);
  assert.equal(summary.rejectsStylesheetScriptLifecycleClaims, true);
  assert.equal(summary.rejectsPackageCompatibilityClaims, true);
  assert.equal(summary.sideEffects.rootResourceStorageMutated, false);
  assert.equal(summary.sideEffects.realResourceMapsMutated, false);
  assert.equal(summary.sideEffects.fakeResourceMapsMutated, false);
  assert.equal(summary.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(summary.sideEffects.publicResourceMapCommitBehavior, false);
  assert.equal(summary.sideEffects.compatibilityClaimed, false);
  assert.deepEqual(
    Object.keys(packageJson.exports),
    expectedReactDomPackageExportKeys
  );
});

test('private resource-map commit executes deduped preload/preinit/script fake-head order', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-fake-head-load-order',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'L',
        [
          '/script.js',
          'script',
          {
            crossOrigin: undefined,
            integrity: 'sha256-script-preload',
            nonce: undefined,
            type: undefined,
            fetchPriority: undefined,
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'X',
        [
          '/script.js',
          {
            crossOrigin: undefined,
            integrity: 'sha256-script',
            fetchPriority: 'high',
            nonce: 'nonce-script'
          }
        ]
      ],
      [
        'm',
        [
          '/module.mjs',
          {
            as: undefined,
            crossOrigin: '',
            integrity: 'sha256-module-preload'
          }
        ]
      ],
      [
        'M',
        [
          '/module.mjs',
          {
            crossOrigin: '',
            integrity: 'sha256-module',
            nonce: 'nonce-module'
          }
        ]
      ],
      [
        'L',
        [
          '/font.woff2',
          'font',
          {
            crossOrigin: '',
            integrity: undefined,
            nonce: undefined,
            type: 'font/woff2',
            fetchPriority: undefined,
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'script-main'
      },
      {
        sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'script-main'
      },
      {
        sourceAdapterAdmissionId: admissions[4].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'module-main'
      },
      {
        sourceAdapterAdmissionId: admissions[5].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'module-main'
      },
      {
        sourceAdapterAdmissionId: admissions[6].adapterAdmissionId,
        resourceKind: 'font',
        resourceKey: 'font-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'existing-style',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      },
      {
        tagName: 'meta',
        attributes: {
          name: 'description'
        }
      }
    ]
  );
  const diagnostic = scenario.commitGate.recordResourceMapCommitDiagnostic(
    scenario.order,
    scenario.stylesheet,
    {
      explicitResourceMapCommitDiagnostic: true,
      fakeHeadExecution: {
        explicitFakeHeadExecution: true,
        executionId: 'dedupe-load-order-fake-head',
        fakeDocument: scenario.fakeDom.document,
        fakeHead: scenario.fakeDom.head
      }
    }
  );

  assert.equal(
    diagnostic.preloadPreinitFakeHeadExecution.executionStatus,
    resourceFormGate.privateResourceHintPreloadPreinitFakeHeadExecutionStatus
  );
  assert.equal(diagnostic.commitAdmission.fakeHeadExecutionAllowed, true);
  assert.equal(
    diagnostic.commitAdmission.fakeHeadExecution.rawHeadCaptured,
    false
  );
  assert.deepEqual(
    {
      rowCount: diagnostic.preloadPreinitFakeHeadExecution.rowCount,
      insertedElementCount:
        diagnostic.preloadPreinitFakeHeadExecution.insertedElementCount,
      preloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.preloadRowCount,
      preinitRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.preinitRowCount,
      stylesheetPreloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .stylesheetPreloadRowCount,
      stylesheetPreinitRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .stylesheetPreinitRowCount,
      classicScriptPreloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .classicScriptPreloadRowCount,
      classicScriptPreinitRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .classicScriptPreinitRowCount,
      modulePreloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.modulePreloadRowCount,
      moduleScriptPreinitRowCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .moduleScriptPreinitRowCount,
      otherPreloadRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.otherPreloadRowCount,
      skippedDedupedRecordCount:
        diagnostic.preloadPreinitFakeHeadExecution
          .skippedDedupedRecordCount,
      beforeRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.fakeHeadBeforeOrder
          .rowCount,
      afterRowCount:
        diagnostic.preloadPreinitFakeHeadExecution.fakeHeadAfterOrder
          .rowCount
    },
    {
      rowCount: 7,
      insertedElementCount: 7,
      preloadRowCount: 4,
      preinitRowCount: 3,
      stylesheetPreloadRowCount: 1,
      stylesheetPreinitRowCount: 1,
      classicScriptPreloadRowCount: 1,
      classicScriptPreinitRowCount: 1,
      modulePreloadRowCount: 1,
      moduleScriptPreinitRowCount: 1,
      otherPreloadRowCount: 1,
      skippedDedupedRecordCount: 0,
      beforeRowCount: 2,
      afterRowCount: 9
    }
  );
  assert.deepEqual(
    diagnostic.preloadPreinitFakeHeadExecution.rows.map((row) => ({
      contractId: row.contractId,
      recordKind: row.recordKind,
      resourceKind: row.resourceKind,
      resourceKey: row.resourceKey,
      precedenceKey: row.precedenceKey,
      elementTag: row.elementTag,
      relationshipApplied: row.relationshipApplied,
      fakeDomCommitOperation: row.fakeDomCommitOperation,
      insertionMethod: row.insertionMethod,
      fakeDomCommitApplied: row.fakeDomCommitApplied,
      stylesheetPrecedenceApplied: row.stylesheetPrecedenceApplied,
      modulePreloadStarted: row.modulePreloadStarted,
      scriptPreinitStarted: row.scriptPreinitStarted,
      moduleScriptPreinitStarted: row.moduleScriptPreinitStarted,
      scriptExecutionStarted: row.scriptExecutionStarted,
      publicResourceHintDomInsertion: row.publicResourceHintDomInsertion,
      publicResourceMapCommitBehavior: row.publicResourceMapCommitBehavior,
      publicScriptModuleResourceDispatch:
        row.publicScriptModuleResourceDispatch
    })),
    [
      {
        contractId: 'preload',
        recordKind: 'preload',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: null,
        elementTag: 'link',
        relationshipApplied: 'preload',
        fakeDomCommitOperation: 'append-stylesheet-preload-link-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preinit-style',
        recordKind: 'stylesheet',
        resourceKind: 'style',
        resourceKey: 'style:style-main',
        precedenceKey: 'precedence-main',
        elementTag: 'link',
        relationshipApplied: 'stylesheet',
        fakeDomCommitOperation:
          'insert-stylesheet-preinit-with-precedence-fake-head',
        insertionMethod: 'insertBefore',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: true,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preload',
        recordKind: 'preload',
        resourceKind: 'script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        elementTag: 'link',
        relationshipApplied: 'preload',
        fakeDomCommitOperation:
          'append-classic-script-preload-link-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preinit-script',
        recordKind: 'script',
        resourceKind: 'script',
        resourceKey: 'script:script-main',
        precedenceKey: null,
        elementTag: 'script',
        relationshipApplied: 'script',
        fakeDomCommitOperation: 'append-classic-script-preinit-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preload-module',
        recordKind: 'preload',
        resourceKind: 'script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        elementTag: 'link',
        relationshipApplied: 'modulepreload',
        fakeDomCommitOperation: 'append-modulepreload-link-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preinit-module-script',
        recordKind: 'script',
        resourceKind: 'script',
        resourceKey: 'script:module-main',
        precedenceKey: null,
        elementTag: 'script',
        relationshipApplied: 'module-script',
        fakeDomCommitOperation: 'append-module-script-preinit-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      },
      {
        contractId: 'preload',
        recordKind: 'preload',
        resourceKind: 'font',
        resourceKey: 'font:font-main',
        precedenceKey: null,
        elementTag: 'link',
        relationshipApplied: 'preload',
        fakeDomCommitOperation: 'append-font-preload-link-fake-head',
        insertionMethod: 'appendChild',
        fakeDomCommitApplied: true,
        stylesheetPrecedenceApplied: false,
        modulePreloadStarted: false,
        scriptPreinitStarted: false,
        moduleScriptPreinitStarted: false,
        scriptExecutionStarted: false,
        publicResourceHintDomInsertion: false,
        publicResourceMapCommitBehavior: false,
        publicScriptModuleResourceDispatch: false
      }
    ]
  );
  assert.deepEqual(
    scenario.fakeDom.head.childNodes.map((node) => ({
      nodeName: node.nodeName,
      rel: node.attributes.rel || null,
      as: node.attributes.as || null,
      type: node.attributes.type || null,
      resourceKey: node.attributes['data-fast-react-resource-key'] || null,
      precedenceKey:
        node.attributes['data-fast-react-precedence-key'] || null
    })),
    [
      {
        nodeName: 'LINK',
        rel: 'stylesheet',
        as: null,
        type: null,
        resourceKey: 'existing-style',
        precedenceKey: 'precedence-main'
      },
      {
        nodeName: 'LINK',
        rel: 'stylesheet',
        as: null,
        type: null,
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        nodeName: 'META',
        rel: null,
        as: null,
        type: null,
        resourceKey: null,
        precedenceKey: null
      },
      {
        nodeName: 'LINK',
        rel: 'preload',
        as: 'style',
        type: null,
        resourceKey: 'style-main',
        precedenceKey: null
      },
      {
        nodeName: 'LINK',
        rel: 'preload',
        as: 'script',
        type: null,
        resourceKey: 'script-main',
        precedenceKey: null
      },
      {
        nodeName: 'SCRIPT',
        rel: null,
        as: null,
        type: null,
        resourceKey: 'script-main',
        precedenceKey: null
      },
      {
        nodeName: 'LINK',
        rel: 'modulepreload',
        as: null,
        type: null,
        resourceKey: 'module-main',
        precedenceKey: null
      },
      {
        nodeName: 'SCRIPT',
        rel: null,
        as: null,
        type: 'module',
        resourceKey: 'module-main',
        precedenceKey: null
      },
      {
        nodeName: 'LINK',
        rel: 'preload',
        as: 'font',
        type: null,
        resourceKey: 'font-main',
        precedenceKey: null
      }
    ]
  );
  assert.equal(
    scenario.fakeDom.head.childNodes[1].attributes.href,
    '[fast-react-redacted-resource-hint:href]'
  );
  assert.equal(
    scenario.fakeDom.head.childNodes[1].attributes['data-precedence'],
    '[fast-react-redacted-resource-hint:precedence]'
  );
  assert.equal(diagnostic.resourceMapCommitPlan.fakeDomCommitApplied, true);
  assert.equal(diagnostic.resourceLifecycleBoundary.fakeDomCommitApplied, true);
  assert.equal(diagnostic.resourceLifecycleBoundary.hostNodeInserted, true);
  assert.equal(diagnostic.sideEffects.fakeHeadMutated, true);
  assert.equal(diagnostic.sideEffects.fakeResourceElementCreated, true);
  assert.equal(diagnostic.sideEffects.fakeResourceElementInserted, true);
  assert.equal(
    diagnostic.sideEffects.publicScriptModuleResourceDispatch,
    false
  );
  assert.equal(diagnostic.sideEffects.scriptExecutionStarted, false);
  assert.equal(
    diagnostic.sideEffects.preloadOrStyleDomWorkDispatched,
    false
  );
  assert.equal(diagnostic.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(
    diagnostic.sideEffects.publicResourceMapCommitBehavior,
    false
  );
  assert.equal(JSON.stringify(diagnostic).includes('/style.css'), false);
  assert.equal(JSON.stringify(diagnostic).includes('/script.js'), false);
  assert.equal(JSON.stringify(diagnostic).includes('/module.mjs'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-style'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-script'), false);
  assert.equal(JSON.stringify(diagnostic).includes('nonce-module'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);
});

test('private resource-map commit rejects conflicting script and modulepreload duplicate records', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-conflicting-module',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'L',
        [
          '/shared.js',
          'script',
          {
            crossOrigin: undefined,
            integrity: 'sha256-shared-classic',
            nonce: undefined,
            type: undefined,
            fetchPriority: undefined,
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'm',
        [
          '/shared.js',
          {
            as: undefined,
            crossOrigin: '',
            integrity: 'sha256-shared-module'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'shared'
      },
      {
        sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'shared'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'preload',
          as: 'script',
          'data-fast-react-resource-key': 'shared'
        }
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'modulepreload',
          'data-fast-react-resource-key': 'shared'
        }
      }
    ]
  );

  assert.throws(
    () =>
      scenario.commitGate.recordResourceMapCommitDiagnostic(
        scenario.order,
        scenario.stylesheet,
        {
          explicitResourceMapCommitDiagnostic: true
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'duplicate conflicting resource-map records for preload-props:script:shared'
    }
  );
  assert.equal(scenario.fakeDom.head.childNodes.length, 3);
});

test('private resource-map commit rejects malformed non-script modulepreload rows', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-malformed-module',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'm',
        [
          '/worker.mjs',
          {
            as: 'worker',
            crossOrigin: '',
            integrity: 'sha256-worker-module'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'worker',
        resourceKey: 'worker-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      },
      {
        tagName: 'link',
        attributes: {
          rel: 'modulepreload',
          as: 'worker',
          'data-fast-react-resource-key': 'worker-main'
        }
      }
    ]
  );

  assert.throws(
    () =>
      scenario.commitGate.recordResourceMapCommitDiagnostic(
        scenario.order,
        scenario.stylesheet,
        {
          explicitResourceMapCommitDiagnostic: true
        }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'modulepreload resource-map commit rows must describe script module preload records'
    }
  );
  assert.equal(scenario.order.scriptModulePreinitRows.length, 0);
  assert.equal(scenario.fakeDom.head.childNodes.length, 2);
});

test('private resource-map commit rejects stale stylesheet load-state records', () => {
  const scenario = createResourceMapCommitScenario(
    'resource-map-stale-load-state',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      }
    ]
  );
  const staleScenario = createStylesheetPrecedenceLoadErrorStateScenario(
    'resource-map-stale-load-state-other'
  );
  const staleLoadStateGate =
    resourceFormGate.createResourceHintStylesheetLoadErrorStateGate({
      requestIdPrefix: 'resource-map-stale-load-state-other'
    });
  const staleLoadState =
    staleLoadStateGate.recordStylesheetLoadErrorStateDiagnostic(
      staleScenario.stylesheetPrecedence,
      {
        explicitStylesheetLoadErrorStateDiagnostic: true
      }
    );

  assert.throws(
    () =>
      scenario.commitGate.recordResourceMapCommitDiagnostic(
        scenario.order,
        scenario.stylesheet,
        {
          explicitResourceMapCommitDiagnostic: true
        },
        staleLoadState
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintResourceMapCommitInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stale resource-map entries: stylesheet load/error state record must reference the source stylesheet precedence record'
    }
  );
  assert.equal(scenario.fakeDom.head.childNodes.length, 1);
});


test('private stylesheet load/error state diagnostic records fake resource state only', () => {
  const scenario = createStylesheetPrecedenceLoadErrorStateScenario(
    'stylesheet-load-state'
  );
  const loadStateGate =
    resourceFormGate.createResourceHintStylesheetLoadErrorStateGate({
      requestIdPrefix: 'stylesheet-load-state'
    });
  const diagnostic =
    loadStateGate.recordStylesheetLoadErrorStateDiagnostic(
      scenario.stylesheetPrecedence,
      {
        explicitStylesheetLoadErrorStateDiagnostic: true,
        stateKind: 'deterministic-fake-stylesheet-load-error-state',
        stateId: 'stylesheet-load-state',
        targetKind: 'stylesheet-resource-state'
      }
    );
  const summary =
    resourceFormGate
      .describePrivateResourceHintStylesheetLoadErrorStateGate();

  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(
    resourceFormGate.isPrivateResourceHintStylesheetLoadErrorStateRecord(
      diagnostic
    ),
    true
  );
  assert.equal(
    resourceFormGate
      .getPrivateResourceHintStylesheetLoadErrorStateRecordPayload(
        diagnostic
      ),
    diagnostic
  );
  assert.equal(
    diagnostic.stylesheetLoadErrorStateId,
    'stylesheet-load-state:1'
  );
  assert.equal(
    diagnostic.stylesheetLoadErrorStateStatus,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateStatus
  );
  assert.equal(
    diagnostic.executionStatus,
    resourceFormGate
      .privateResourceHintStylesheetLoadErrorStateExecutionStatus
  );
  assert.deepEqual(
    diagnostic.sideEffects,
    resourceFormGate.resourceHintStylesheetLoadErrorStateSideEffects
  );
  assert.equal(
    diagnostic.sideEffects.fakeStylesheetLoadErrorStateDiagnosticInvoked,
    true
  );
  assert.equal(diagnostic.sideEffects.stylesheetFetchStarted, false);
  assert.equal(diagnostic.sideEffects.stylesheetLoadListenerInstalled, false);
  assert.equal(diagnostic.sideEffects.stylesheetErrorListenerInstalled, false);
  assert.equal(diagnostic.sideEffects.stylesheetPromiseCreated, false);
  assert.equal(diagnostic.sideEffects.stylesheetCommitSuspended, false);
  assert.equal(diagnostic.sideEffects.stylesheetRealTimerScheduled, false);
  assert.deepEqual(
    diagnostic.loadingStateBits.map((row) => [row.name, row.bitmask]),
    [
      ['NotLoaded', 0],
      ['Loaded', 1],
      ['Errored', 2],
      ['Settled', 3],
      ['Inserted', 4]
    ]
  );
  assert.deepEqual(
    diagnostic.resourceStateRows.map((row) => ({
      resourceKey: row.resourceKey,
      type: row.reactResourceShape.type,
      instance: row.reactResourceShape.instance,
      count: row.reactResourceShape.count,
      loading: row.stateShape.loading,
      preload: row.stateShape.preload,
      preloadSeenBefore: row.preloadSeenBefore,
      preinitSeenBefore: row.preinitSeenBefore,
      plannedInsertionCount: row.plannedInsertionCount,
      loadListenerInstalled: row.loadListenerInstalled,
      errorListenerInstalled: row.errorListenerInstalled,
      loadingPromiseCreated: row.loadingPromiseCreated,
      resourceFetchStarted: row.resourceFetchStarted
    })),
    [
      {
        resourceKey: 'style:style-main',
        type: 'stylesheet',
        instance: null,
        count: 1,
        loading: 0,
        preload: null,
        preloadSeenBefore: true,
        preinitSeenBefore: true,
        plannedInsertionCount: 1,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false,
        resourceFetchStarted: false
      }
    ]
  );
  assert.deepEqual(
    diagnostic.loadingStateRows.map((row) => ({
      label: row.label,
      bitmask: row.bitmask,
      loaded: row.snapshot.loaded,
      errored: row.snapshot.errored,
      inserted: row.snapshot.inserted,
      loadListenerInstalled: row.loadListenerInstalled,
      errorListenerInstalled: row.errorListenerInstalled,
      loadingPromiseCreated: row.loadingPromiseCreated
    })),
    [
      {
        label: 'not-loaded',
        bitmask: 0,
        loaded: false,
        errored: false,
        inserted: false,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'loaded',
        bitmask: 1,
        loaded: true,
        errored: false,
        inserted: false,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'errored',
        bitmask: 2,
        loaded: false,
        errored: true,
        inserted: false,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'inserted-not-settled',
        bitmask: 4,
        loaded: false,
        errored: false,
        inserted: true,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'inserted-loaded',
        bitmask: 5,
        loaded: true,
        errored: false,
        inserted: true,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      },
      {
        label: 'inserted-errored',
        bitmask: 6,
        loaded: false,
        errored: true,
        inserted: true,
        loadListenerInstalled: false,
        errorListenerInstalled: false,
        loadingPromiseCreated: false
      }
    ]
  );
  assert.equal(diagnostic.preloadStateRows[0].preloadWouldBeTracked, true);
  assert.equal(
    diagnostic.preloadStateRows[0].preloadLoadListenerInstalled,
    false
  );
  assert.equal(
    diagnostic.preloadStateRows[0].preloadErrorListenerInstalled,
    false
  );
  assert.equal(diagnostic.preloadStateRows[0].preloadFetchStarted, false);
  assert.equal(
    diagnostic.commitSuspensionRows[0].maySuspendCommitIfNotInserted,
    true
  );
  assert.equal(diagnostic.commitSuspensionRows[0].stylesheetsMapCreated, false);
  assert.equal(
    diagnostic.commitSuspensionRows[0].suspendedStateCountIncremented,
    false
  );
  assert.equal(diagnostic.commitSuspensionRows[0].timerScheduled, false);
  assert.equal(diagnostic.commitSuspensionRows[0].commitSuspended, false);
  assert.deepEqual(diagnostic.suspendedCommitBoundary.stateShape, {
    stylesheets: null,
    count: 0,
    unsuspend: null
  });
  assert.equal(
    diagnostic.suspendedCommitBoundary.realTimerScheduled,
    false
  );
  assert.equal(
    diagnostic.suspendedCommitBoundary.suspendedCommitStarted,
    false
  );
  assert.deepEqual(
    diagnostic.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetLoadErrorStateBlockedCapabilities
  );
  assert.equal(
    diagnostic.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(fakeResourceSourceUsesNoLoadErrorListeners(), true);
  assert.equal(scenario.fakeDom.head.childNodes.length, 2);
  assert.equal(JSON.stringify(diagnostic).includes('/style.css'), false);
  assert.equal(JSON.stringify(diagnostic).includes('sha256-style'), false);
  assert.equal(/"theme"/u.test(JSON.stringify(diagnostic)), false);

  assert.equal(
    summary.gateId,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateGateId
  );
  assert.equal(summary.recordsStylesheetResourceShape, true);
  assert.equal(summary.recordsLoadingBitmasks, true);
  assert.equal(summary.installsLoadListeners, false);
  assert.equal(summary.installsErrorListeners, false);
  assert.equal(summary.createsLoadingPromises, false);
  assert.equal(summary.fetchesStylesheets, false);
  assert.equal(summary.suspendsCommits, false);
  assert.equal(summary.rejectsPublicResourceDispatchClaims, true);
  assert.deepEqual(
    summary.sideEffects,
    resourceFormGate.resourceHintStylesheetLoadErrorStateBlockedSideEffects
  );

  const error =
    resourceFormGate.createUnsupportedResourceHintStylesheetLoadErrorStateError(
      diagnostic
    );
  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintStylesheetLoadErrorStateGateErrorCode
  );
  assert.equal(error.exportName, 'resource-hint-stylesheet-load-error-state');
  assert.equal(error.stylesheetLoadErrorStateId, 'stylesheet-load-state:1');
  assert.deepEqual(
    error.blockedCapabilities,
    resourceFormGate.resourceHintStylesheetLoadErrorStateBlockedCapabilities
  );

  assert.throws(
    () =>
      loadStateGate.recordStylesheetLoadErrorStateDiagnostic(
        scenario.stylesheetPrecedence,
        { explicitStylesheetLoadErrorStateDiagnostic: true }
      ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'stylesheet load/error state gate admits exactly one diagnostic record'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintStylesheetLoadErrorStateGate()
        .recordStylesheetLoadErrorStateDiagnostic({}, {
          explicitStylesheetLoadErrorStateDiagnostic: true
        }),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintStylesheetLoadErrorStateGate()
        .recordStylesheetLoadErrorStateDiagnostic(
          scenario.stylesheetPrecedence,
          {
            explicitStylesheetLoadErrorStateDiagnostic: true,
            element: {}
          }
        ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'element must not be passed to the metadata gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintStylesheetLoadErrorStateGate()
        .recordStylesheetLoadErrorStateDiagnostic(
          scenario.stylesheetPrecedence,
          {
            explicitStylesheetLoadErrorStateDiagnostic: true,
            publicStylesheetResourceBehavior: true
          }
        ),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidAdmissionCode,
      compatibilityTarget,
      reason:
        'publicStylesheetResourceBehavior must not claim public resource dispatch in the stylesheet load/error state metadata gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createUnsupportedResourceHintStylesheetLoadErrorStateError({}),
    {
      code:
        resourceFormGate
          .privateResourceHintStylesheetLoadErrorStateInvalidRecordCode,
      compatibilityTarget
    }
  );
});


test('private resource hint dispatcher metadata rejects malformed or dispatching shapes', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'resource-dispatcher-error-gate'
  });
  const record = gate.recordResourceHintDispatcherRequest('preconnect', [
    'https://connect.example.test',
    ''
  ]);
  const error =
    resourceFormGate.createUnsupportedResourceHintDispatcherMetadataError(
      record
    );

  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateResourceHintDispatcherMetadataGateErrorCode
  );
  assert.equal(error.entrypoint, 'react-dom/private-internals');
  assert.equal(error.exportName, 'resource-hint-dispatcher.preconnect');
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.equal(error.requestId, 'resource-dispatcher-error-gate:1');
  assert.equal(error.requestSequence, 1);
  assert.equal(error.requestType, 'resource-hint-dispatcher.preconnect');
  assert.equal(error.contractId, 'preconnect');
  assert.equal(error.privateDispatcherKey, 'C');
  assert.deepEqual(error.sideEffects, resourceFormGate.resourceHintDispatcherSideEffects);

  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: 'fake-dom-adapter-error-gate'
  });
  const adapterAdmission = adapterGate.admitDispatcherRecord(record, {
    explicitAdmission: true,
    adapterKind: 'deterministic-fake-dom',
    adapterId: 'resource-hint-error-adapter',
    targetKind: 'document-head'
  });
  const adapterError =
    resourceFormGate.createUnsupportedResourceHintFakeDomAdapterError(
      adapterAdmission
    );

  assert.equal(adapterError.name, 'FastReactDomUnimplementedError');
  assert.equal(
    adapterError.code,
    resourceFormGate.privateResourceHintFakeDomAdapterGateErrorCode
  );
  assert.equal(adapterError.entrypoint, 'react-dom/private-internals');
  assert.equal(adapterError.exportName, 'resource-hint-fake-dom-adapter.preconnect');
  assert.equal(adapterError.compatibilityTarget, compatibilityTarget);
  assert.equal(adapterError.adapterAdmissionId, 'fake-dom-adapter-error-gate:1');
  assert.equal(adapterError.adapterAdmissionSequence, 1);
  assert.equal(adapterError.sourceRequestId, 'resource-dispatcher-error-gate:1');
  assert.equal(adapterError.sourceRequestSequence, 1);
  assert.equal(adapterError.contractId, 'preconnect');
  assert.equal(adapterError.privateDispatcherKey, 'C');
  assert.equal(
    adapterError.admissionStatus,
    resourceFormGate.privateResourceHintFakeDomAdapterAdmissionStatus
  );
  assert.equal(
    adapterError.executionStatus,
    resourceFormGate.privateResourceHintFakeDomAdapterExecutionBlockedStatus
  );
  assert.deepEqual(
    adapterError.sideEffects,
    resourceFormGate.resourceHintFakeDomAdapterSideEffects
  );

  assert.throws(
    () => gate.recordResourceHintDispatcherRequest('L', ['/asset.js', 'script']),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preload',
      privateDispatcherKey: 'L'
    }
  );
  assert.throws(
    () =>
      gate.recordResourceHintDispatcherRequest('L', [
        '/font.woff2',
        'font',
        {
          crossOrigin: undefined,
          integrity: undefined,
          nonce: undefined,
          type: undefined,
          fetchPriority: undefined,
          referrerPolicy: undefined,
          imageSrcSet: undefined,
          imageSizes: undefined,
          media: undefined
        }
      ]),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preload',
      privateDispatcherKey: 'L'
    }
  );
  assert.throws(
    () =>
      gate.recordResourceHintDispatcherRequest('S', [
        '/style.css',
        'theme',
        {
          crossOrigin: '',
          integrity: 'sha256-style'
        }
      ]),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preinit-style',
      privateDispatcherKey: 'S'
    }
  );
  assert.throws(
    () =>
      gate.recordResourceHintDispatcherRequest('C', [
        'https://connect.example.test',
        'anonymous'
      ]),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preconnect',
      privateDispatcherKey: 'C'
    }
  );
  assert.throws(
    () => gate.recordResourceHintDispatcherRequest('M', ['/module.mjs', null]),
    {
      code: resourceFormGate.privateResourceHintDispatcherMetadataInvalidShapeCode,
      compatibilityTarget,
      contractId: 'preinit-module-script',
      privateDispatcherKey: 'M'
    }
  );
  assert.throws(
    () => adapterGate.admitDispatcherRecord(record, {
      adapterKind: 'deterministic-fake-dom'
    }),
    {
      code: resourceFormGate.privateResourceHintFakeDomAdapterInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'explicitAdmission must be true'
    }
  );
  assert.throws(
    () => adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'real-dom',
      targetKind: 'document-head'
    }),
    {
      code: resourceFormGate.privateResourceHintFakeDomAdapterInvalidAdmissionCode,
      compatibilityTarget,
      reason: 'adapterKind must be deterministic-fake-dom'
    }
  );
  assert.throws(
    () =>
      adapterGate.admitDispatcherRecord(
        gate.recordResourceHintRequest('preload', []),
        {
          explicitAdmission: true,
          adapterKind: 'deterministic-fake-dom',
          targetKind: 'document-head'
        }
      ),
    {
      code: resourceFormGate.privateResourceHintFakeDomAdapterInvalidRecordCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintDispatcherMetadataError({}),
    {
      code:
        'FAST_REACT_DOM_RESOURCE_HINT_DISPATCHER_METADATA_INVALID_RECORD',
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceHintFakeDomAdapterError({}),
    {
      code: resourceFormGate.privateResourceHintFakeDomAdapterInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private form action/reset dispatcher gate rejects real form and action inputs', () => {
  const gate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: 'form-dispatcher-error-gate'
  });
  let actionCalls = 0;
  const action = () => {
    actionCalls++;
  };
  const record = gate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: 'submit',
    actionKind: 'none',
    actionSource: 'none',
    submitControlKind: 'none'
  });
  const error =
    resourceFormGate.createUnsupportedFormActionResetDispatcherError(record);

  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateFormActionResetDispatcherGateErrorCode
  );
  assert.equal(error.entrypoint, 'react-dom/private-internals');
  assert.equal(
    error.exportName,
    'form-action-reset-dispatcher.submission'
  );
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.equal(error.requestId, 'form-dispatcher-error-gate:1');
  assert.equal(error.requestSequence, 1);
  assert.equal(error.intentKind, 'submission');
  assert.equal(error.contractId, 'form-action-submission-intent');
  assert.equal(
    error.status,
    resourceFormGate.privateFormActionSubmissionIntentRecordedStatus
  );
  assert.deepEqual(
    error.sideEffects,
    resourceFormGate.formActionSubmissionIntentSideEffects
  );
  assert.match(
    error.message,
    /private form action\/reset dispatcher gate records intent metadata only/u
  );

  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: 'submit',
        actionKind: 'function',
        action
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      contractId: 'form-action-submission-intent',
      intentKind: 'submission',
      reason: 'action must not be passed to the metadata gate'
    }
  );
  assert.equal(actionCalls, 0);
  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: 'submit',
        form: throwingProxy('real form')
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      reason: 'form must not be passed to the metadata gate'
    }
  );
  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: 'submit',
        submitter: throwingProxy('submitter')
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      reason: 'submitter must not be passed to the metadata gate'
    }
  );
  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: 'reset'
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      reason: 'eventName must be submit'
    }
  );
  assert.throws(
    () =>
      gate.recordResetIntent({
        explicitIntent: true,
        dispatcherKey: 'x'
      }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      contractId: 'form-action-reset-intent',
      intentKind: 'reset',
      reason: 'dispatcherKey must be r'
    }
  );
  assert.throws(
    () =>
      resourceFormGate
        .createResourceFormActionInternalsGate()
        .recordFormActionResetIntent({
          explicitIntent: true,
          form: throwingProxy('reset form')
        }),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget,
      contractId: 'form-action-reset-intent',
      intentKind: 'reset',
      reason: 'form must not be passed to the metadata gate'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedFormActionResetDispatcherError({}),
    {
      code:
        resourceFormGate.privateFormActionResetDispatcherInvalidRecordCode,
      compatibilityTarget
    }
  );
});

test('private resource/form internals gate errors are deterministic and fail closed', () => {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'error-gate'
  });
  const record = gate.recordFormActionRequest('useFormStatus', []);
  const error =
    resourceFormGate.createUnsupportedResourceFormActionInternalsError(record);

  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(error.code, resourceFormGate.privateResourceFormActionGateErrorCode);
  assert.equal(error.entrypoint, 'react-dom/private-internals');
  assert.equal(error.exportName, 'form-action.useFormStatus');
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.equal(error.requestId, 'error-gate:1');
  assert.equal(error.requestSequence, 1);
  assert.equal(error.requestType, 'form-action.useFormStatus');
  assert.equal(error.behaviorArea, 'form-action');
  assert.equal(error.requestName, 'useFormStatus');
  assert.equal(error.status, resourceFormGate.unsupportedStatus);
  assert.deepEqual(error.sideEffects, resourceFormGate.noSideEffects);
  assert.match(
    error.message,
    /private resource\/form action internals gate records metadata only/u
  );

  assert.throws(
    () => gate.recordResourceHintRequest('unknown-resource', []),
    {
      code: resourceFormGate.privateResourceFormActionGateUnknownRequestCode,
      compatibilityTarget,
      behaviorArea: 'resource-hint',
      requestName: 'unknown-resource'
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedResourceFormActionInternalsError({
        requestId: 'not-a-private-record'
      }),
    {
      code: 'FAST_REACT_DOM_RESOURCE_FORM_ACTION_GATE_INVALID_RECORD',
      compatibilityTarget
    }
  );
});

test('private controlled input value-tracker gate errors are deterministic and fail closed', () => {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'tracker-error-gate'
  });
  const record = gate.recordTrackerScenario({
    scenarioId: 'textarea-controlled-value-update',
    phaseId: 'initial',
    hostTag: 'textarea',
    props: {
      value: 'locked',
      onChange() {}
    }
  });
  const error =
    resourceFormGate.createUnsupportedControlledInputValueTrackerError(
      record
    );

  assert.equal(error.name, 'FastReactDomUnimplementedError');
  assert.equal(
    error.code,
    resourceFormGate.privateControlledInputValueTrackerGateErrorCode
  );
  assert.equal(error.entrypoint, 'react-dom/private-internals');
  assert.equal(error.exportName, 'controlled-value-tracker.textarea');
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.equal(error.requestId, 'tracker-error-gate:1');
  assert.equal(error.requestSequence, 1);
  assert.equal(error.scenarioId, 'textarea-controlled-value-update');
  assert.equal(error.phaseId, 'initial');
  assert.equal(error.hostTag, 'textarea');
  assert.equal(error.controlKind, 'value');
  assert.equal(error.status, resourceFormGate.unsupportedStatus);
  assert.deepEqual(
    error.sideEffects,
    resourceFormGate.controlledInputValueTrackerSideEffects
  );
  assert.match(
    error.message,
    /controlled input value-tracker gate records metadata only/u
  );

  assert.throws(
    () => gate.recordTrackerScenario({hostTag: 'input', controlKind: 'range'}),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerGateUnknownScenarioCode,
      compatibilityTarget,
      hostTag: 'input',
      controlKind: 'range'
    }
  );
  assert.throws(
    () => gate.recordTrackerScenario({hostTag: 'button'}),
    {
      code:
        resourceFormGate.privateControlledInputValueTrackerGateInvalidScenarioCode,
      compatibilityTarget
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedControlledInputValueTrackerError({
        requestId: 'not-a-private-record'
      }),
    {
      code:
        'FAST_REACT_DOM_CONTROLLED_INPUT_VALUE_TRACKER_GATE_INVALID_RECORD',
      compatibilityTarget
    }
  );
});

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
    admission.rootId
  );
  const { fulfilledResetExecution } =
    await createPrivateFulfilledResetExecutionRecord(
      'root-execution-consumer-form'
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
  assert.equal(summary.rejectsStaleRootLifecycleSnapshots, true);
  assert.equal(summary.rejectsCallerBuiltLifecycleSourceRecords, true);
  assert.equal(consumer.ledgerBoundary.runtimeRecordsRequired, true);
  assert.equal(
    consumer.ledgerBoundary.callerSuppliedDiagnosticStringsAccepted,
    false
  );
  assert.deepEqual(consumer.ledgerBoundary.workerIds, [
    'worker-829-resource-root-map-storage-private-execution',
    'worker-830-form-action-fulfilled-reset-fake-commit',
    'worker-850-resource-form-execution-admission-ledger'
  ]);

  assert.equal(
    consumer.resourceRootMapStorageBoundary.rootMapStorageExecutionId,
    resourceExecution.rootMapStorageExecutionId
  );
  assert.equal(
    consumer.resourceRootMapStorageBoundary.rootId,
    admission.rootId
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
      'validated-private-resource-root-map-storage-execution'
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
  const resourceExecution = createRootMapStorageExecutionForRoot(
    'root-execution-consumer-negative',
    admission.rootId
  );
  const foreignResourceExecution = createRootMapStorageExecutionForRoot(
    'root-execution-consumer-foreign',
    'foreign-root-execution-consumer-root'
  );
  const { fulfilledResetExecution } =
    await createPrivateFulfilledResetExecutionRecord(
      'root-execution-consumer-negative-form'
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
        'resource root-map storage execution rootId must match root bridge admission'
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

function assertFunctionMatchesOracle(moduleExports, exportName, expected) {
  const descriptor = Object.getOwnPropertyDescriptor(moduleExports, exportName);
  assert.ok(descriptor, `${expected.entrypoint}.${exportName} descriptor`);
  assert.deepEqual(dataDescriptorFields(descriptor), {
    configurable: expected.descriptor.configurable,
    enumerable: expected.descriptor.enumerable,
    writable: expected.descriptor.writable
  });
  assert.equal(typeof descriptor.value, 'function');
  assert.equal(
    descriptor.value.length,
    expected.descriptor.value.length,
    `${expected.entrypoint}.${exportName} length`
  );
  assert.equal(
    descriptor.value.name,
    expected.descriptor.value.name,
    `${expected.entrypoint}.${exportName} name`
  );
  assert.deepEqual(
    Object.getOwnPropertyNames(descriptor.value),
    expected.descriptor.value.ownPropertyNames,
    `${expected.entrypoint}.${exportName} own property names`
  );
}

function assertPlaceholderMetadata(moduleExports, entrypoint) {
  assert.equal(moduleExports.__FAST_REACT_PLACEHOLDER__, true, entrypoint);
  assert.equal(moduleExports.__FAST_REACT_ENTRYPOINT__, entrypoint, entrypoint);
  assert.equal(moduleExports.compatibilityTarget, compatibilityTarget, entrypoint);
  assert.equal(
    Object.keys(moduleExports).includes('__FAST_REACT_PLACEHOLDER__'),
    false
  );
  assert.equal(
    Object.keys(moduleExports).includes('__FAST_REACT_ENTRYPOINT__'),
    false
  );
  assert.equal(Object.keys(moduleExports).includes('compatibilityTarget'), false);
}

function assertUnsupportedThrow(callback, { entrypoint, exportName }) {
  assert.throws(callback, (error) => {
    assert.equal(error.name, 'FastReactDomUnimplementedError', exportName);
    assert.equal(error.code, unsupportedCode, exportName);
    assert.equal(error.entrypoint, entrypoint, exportName);
    assert.equal(error.exportName, exportName, exportName);
    assert.equal(error.compatibilityTarget, compatibilityTarget, exportName);
    assert.match(
      error.message,
      /placeholder has no React DOM behavior implementation yet/u,
      exportName
    );
    return true;
  });
}

function replaceDispatcherWithSpies(moduleExports) {
  const dispatchCalls = [];
  const dispatcher = moduleExports[internalsExport].d;
  for (const key of Object.keys(dispatcher)) {
    dispatcher[key] = function fastReactUnexpectedDispatcherCall(...args) {
      dispatchCalls.push({
        args,
        key
      });
    };
  }
  return dispatchCalls;
}

function assertCallbackActionPreflightPublicBlockersFailClosed(record) {
  assert.deepEqual(record.resetActionPublicBlockers, {
    status: 'blocked-public-form-action-reset-and-action-preflight',
    metadataOnly: true,
    sourceSubmitDispatchId: record.sourceSubmitDispatchId,
    sourceSubmitResetExecutionId: record.sourceSubmitResetExecutionId,
    sourceResetIntentRequestId: record.sourceResetIntentRequestId,
    publicFormActionsEnabled: false,
    publicFormSubmissionReachable: false,
    publicSubmitDispatchReachable: false,
    publicRequestFormResetReachable: false,
    publicActionInvocationReachable: false,
    publicDomMutationReachable: false,
    publicRootTouched: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    publicActionInvoked: false,
    hostTransitionStarted: false,
    previousDispatcherCalled: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    resetUpdateEnqueued: false,
    reactUpdateQueued: false,
    afterMutationEffectsVisited: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    domMutation: false,
    publicFormActionCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
  assert.equal(Object.isFrozen(record.resetActionPublicBlockers), true);
}

function assertCallbackActionPreflightPublicBoundaryFailClosed(boundary) {
  assert.deepEqual(boundary, {
    status:
      'blocked-public-form-action-callback-action-preflight-compatibility',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicFormSubmissionReachable: false,
    publicSubmitDispatchReachable: false,
    publicActionInvocationReachable: false,
    publicDomMutationReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    submitDispatchReachable: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    hostTransitionStarted: false,
    reactUpdateQueued: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    publicActionInvoked: false,
    domMutation: false,
    publicFormActionCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
  assert.equal(Object.isFrozen(boundary), true);
}

function assertRejectedErrorPreflightPublicBlockersFailClosed(record) {
  assert.deepEqual(record.resetActionPublicBlockers, {
    status: 'blocked-public-form-action-reset-and-rejected-error-routing',
    metadataOnly: true,
    sourceAsyncCallbackExecutionId: record.sourceAsyncCallbackExecutionId,
    sourceSubmitResetExecutionId: record.sourceSubmitResetExecutionId,
    sourceResetIntentRequestId: record.sourceResetIntentRequestId,
    publicFormActionsEnabled: false,
    publicFormSubmissionReachable: false,
    publicSubmitDispatchReachable: false,
    publicRequestFormResetReachable: false,
    publicActionInvocationReachable: false,
    publicErrorRoutingReachable: false,
    publicDomMutationReachable: false,
    publicRootTouched: false,
    formDataConstructed: false,
    actionInvoked: false,
    publicActionInvoked: false,
    hostTransitionStarted: false,
    previousDispatcherCalled: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    resetUpdateEnqueued: false,
    reactUpdateQueued: false,
    afterMutationEffectsVisited: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    rootErrorUpdateScheduled: false,
    publicRootErrorCallbackInvoked: false,
    errorBoundaryScheduled: false,
    domMutation: false,
    publicFormActionCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
  assert.equal(Object.isFrozen(record.resetActionPublicBlockers), true);
}

function assertRejectedErrorPreflightPublicBoundaryFailClosed(boundary) {
  assert.deepEqual(boundary, {
    status:
      'blocked-public-form-action-rejected-error-preflight-compatibility',
    publicFormActionsEnabled: false,
    publicRequestFormResetReachable: false,
    publicFormSubmissionReachable: false,
    publicSubmitDispatchReachable: false,
    publicActionInvocationReachable: false,
    publicErrorRoutingReachable: false,
    publicDomMutationReachable: false,
    publicRootTouched: false,
    realFormAccepted: false,
    realFormInspected: false,
    formDataConstructed: false,
    syntheticEventCreated: false,
    callbackDispatchExecuted: false,
    submitCallbackInvoked: false,
    actionFunctionCaptured: false,
    actionInvoked: false,
    publicActionInvoked: false,
    privateAsyncActionCallbackPubliclyReachable: false,
    hostTransitionStarted: false,
    previousDispatcherCalled: false,
    resetFiberResolved: false,
    resetStateQueued: false,
    resetUpdateEnqueued: false,
    reactUpdateQueued: false,
    afterMutationEffectsVisited: false,
    resetFormInstanceCalled: false,
    formResetCommitted: false,
    realFormReset: false,
    rootErrorUpdateScheduled: false,
    publicRootErrorCallbackInvoked: false,
    errorBoundaryScheduled: false,
    domMutation: false,
    publicFormActionCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
  assert.equal(Object.isFrozen(boundary), true);
}

function createPrivateGateScenario() {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: 'gate'
  });
  const records = [
    gate.recordResourceHintRequest('preload', [
      'https://fast-react.invalid/app.js',
      throwingProxy('resource options')
    ]),
    gate.recordSingletonRequest('head', [throwingProxy('singleton props')]),
    gate.recordFormActionRequest('requestFormReset', [
      throwingProxy('form element')
    ]),
    gate.recordControlledFormRequest('input', [
      throwingProxy('controlled props')
    ])
  ];

  return {
    records,
    summary: resourceFormGate.describeResourceFormActionInternalsGate()
  };
}

function createPrivateFormActionCallbackPreflightScenario(prefix) {
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: `${prefix}-source`
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: `${prefix}-extraction`
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: `${prefix}-queue`
    });
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: `${prefix}-blocker`
    });
  const dispatchGate =
    formActions.createFormActionSubmitDispatchDiagnosticGate({
      requestIdPrefix: `${prefix}-dispatch`
    });
  const executionGate =
    formActions.createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix: `${prefix}-reset-execution`
    });
  const preflightGate =
    formActions.createFormActionCallbackActionPreflightDiagnosticGate({
      requestIdPrefix: `${prefix}-preflight`
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
      pathId: `${prefix}-fake-reset`,
      pathKind: 'action-completion-submit-reset',
      hostTag: 'form',
      resetMode: 'record-only-fake-reset'
    }
  });
  const preflight = preflightGate.recordCallbackActionInvocationPreflight(
    dispatch,
    execution,
    {
      explicitFormActionCallbackActionPreflight: true
    }
  );

  return {
    blocker,
    dispatch,
    execution,
    extraction,
    preflight,
    resetIntent,
    resetQueueCommit,
    submitIntent
  };
}

function createRootMapStorageExecutionForRoot(prefix, rootId) {
  const scenario = createRootMapStoragePreflightScenario(prefix);
  const preflight = scenario.storageGate.recordRootMapStoragePreflight(
    scenario.commit,
    {
      explicitRootMapStoragePreflight: true,
      preflightId: `${prefix}-preflight`,
      rootId,
      expectedSourceResourceMapCommitRowIds: [
        'resource-map-commit-1',
        'resource-map-commit-3',
        'resource-map-commit-4'
      ]
    }
  );

  return resourceFormGate
    .createResourceHintRootMapStorageGate({
      requestIdPrefix: `${prefix}-execution`
    })
    .recordRootMapStorageExecution(preflight, {
      explicitRootMapStorageExecution: true,
      executionId: `${prefix}-root-map-storage-execution`,
      rootId,
      expectedRootMapStorageRowIds: [
        'root-map-storage-preflight-0',
        'root-map-storage-preflight-1',
        'root-map-storage-preflight-2'
      ]
    });
}

async function createPrivateFulfilledResetExecutionRecord(prefix) {
  const scenario = createPrivateFormActionCallbackPreflightScenario(prefix);
  const asyncExecution = await formActions
    .createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: `${prefix}-async`
    })
    .recordAsyncCallbackExecution(scenario.preflight, {
      explicitFormActionAsyncCallbackExecution: true,
      async asyncActionCallback(payload) {
        assert.equal(Object.isFrozen(payload), true);
        assert.equal(payload.formDataConstructed, false);
        await Promise.resolve();
        return { ok: true };
      }
    });
  const fulfilledResetExecution = formActions
    .createFormActionFulfilledResetExecutionDiagnosticGate({
      requestIdPrefix: `${prefix}-fulfilled-reset`
    })
    .recordFulfilledResetExecution(
      asyncExecution,
      scenario.execution,
      {
        explicitFormActionFulfilledResetExecution: true,
        sourceAsyncCallbackExecutionId: asyncExecution.executionId,
        sourceSubmitResetExecutionId: scenario.execution.executionId
      }
    );

  return {
    ...scenario,
    asyncExecution,
    fulfilledResetExecution
  };
}

async function createPrivateRejectedFormActionAsyncExecution(prefix, message) {
  const scenario = createPrivateFormActionCallbackPreflightScenario(prefix);
  const rejectedExecution =
    await formActions
      .createFormActionAsyncCallbackExecutionDiagnosticGate({
        requestIdPrefix: `${prefix}-async-execution`
      })
      .recordAsyncCallbackExecution(scenario.preflight, {
        explicitFormActionAsyncCallbackExecution: true,
        async asyncActionCallback() {
          await Promise.resolve();
          throw new Error(message);
        }
      });

  return {
    ...scenario,
    rejectedExecution
  };
}

function createPrivateControlledValueTrackerScenario() {
  const gate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: 'tracker-gate'
  });
  const records = [
    gate.recordTrackerScenario({
      scenarioId: 'input-text-controlled-value-update',
      phaseId: 'initial',
      hostTag: 'input',
      inputType: 'text',
      props: {
        type: 'text',
        value: 'alpha',
        onChange() {}
      },
      target: throwingProxy('input target')
    }),
    gate.recordTrackerScenario({
      scenarioId: 'checkbox-controlled-checked-update',
      phaseId: 'initial',
      hostTag: 'input',
      inputType: 'checkbox',
      props: {
        type: 'checkbox',
        checked: true,
        onChange() {}
      },
      target: throwingProxy('checkbox target')
    }),
    gate.recordTrackerScenario({
      scenarioId: 'select-single-controlled-update',
      phaseId: 'initial',
      hostTag: 'select',
      props: {
        value: 'b',
        onChange() {}
      },
      target: throwingProxy('select target')
    }),
    gate.recordTrackerScenario({
      scenarioId: 'select-multiple-controlled-update',
      phaseId: 'update',
      hostTag: 'select',
      multiple: true,
      props: {
        multiple: true,
        value: ['a'],
        onChange() {}
      },
      target: throwingProxy('select multiple target')
    }),
    gate.recordTrackerScenario({
      scenarioId: 'textarea-controlled-value-update',
      phaseId: 'initial',
      hostTag: 'textarea',
      props: {
        value: 'alpha',
        onChange() {}
      },
      target: throwingProxy('textarea target')
    })
  ];

  return {
    records,
    summary: resourceFormGate.describeControlledInputValueTrackerGate()
  };
}

function createPrivateControlledWrapperPropertyPayloadScenario() {
  const records = [
    resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: 'input',
      propName: 'value',
      props: {
        type: 'text',
        value: 'alpha',
        onChange() {}
      },
      target: throwingProxy('input wrapper target')
    }),
    resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: 'input',
      propName: 'checked',
      props: {
        type: 'checkbox',
        checked: true,
        onChange() {}
      },
      target: throwingProxy('checkbox wrapper target')
    }),
    resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: 'select',
      propName: 'multiple',
      props: {
        multiple: true,
        value: ['a'],
        onChange() {}
      },
      target: throwingProxy('select wrapper target')
    }),
    resourceFormGate.createControlledInputPrivateWrapperPropertyPayloadRecord({
      hostTag: 'textarea',
      propName: 'value',
      props: {
        value: 'alpha',
        onChange() {}
      },
      target: throwingProxy('textarea wrapper target')
    })
  ];

  return {
    records,
    summary:
      resourceFormGate.describeControlledInputPrivateWrapperPropertyPayloadGate()
  };
}

function createPrivateRootBridgeAdmission() {
  const document = createRootBridgeDocument();
  const container = createRootBridgeElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    requestIdPrefix: 'root-gate-request',
    rootIdPrefix: 'root-gate',
    updateIdPrefix: 'root-gate-update'
  });
  const create = bridge.createClientRoot(container, {
    identifierPrefix: 'resource-form-'
  });
  const render = bridge.renderContainer(create.handle, {
    props: {
      children: 'blocked'
    },
    type: 'span'
  });
  const admission = bridge.admitRequest(render);
  const lifecycleBoundary =
    rootBridge.createPrivateRootLifecycleRequestBoundary(admission);

  return {
    admission,
    bridge,
    create,
    container,
    document,
    lifecycleBoundary,
    render
  };
}

function createRootBridgeDocument() {
  const document = {
    nodeName: '#document',
    nodeType: 9,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener) {
      this.__registrations.push({ listener, type });
    }
  };
  document.ownerDocument = document;
  return document;
}

function createRootBridgeElement(nodeName, ownerDocument) {
  return {
    nodeName,
    localName: nodeName.toLowerCase(),
    nodeType: 1,
    ownerDocument,
    parentNode: null,
    __mutationLog: [],
    __registrations: [],
    addEventListener(type, listener) {
      this.__registrations.push({ listener, type });
    }
  };
}

function createWrapperMutationIntentSources(prefix, rows) {
  const gate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: prefix
    });
  const earlier = createWrapperMutationIntentSourceSet(gate, rows);
  const later = createWrapperMutationIntentSourceSet(gate, rows);

  return {
    gate,
    earlier,
    later,
    cleanup() {
      earlier.cleanup();
      later.cleanup();
    }
  };
}

function createWrapperMutationIntentSourceSet(gate, rows) {
  const records = rows.map((row) => {
    const dispatch = createControlledInputEventDispatch({
      domEventName: row.domEventName,
      latestProps: row.latestProps,
      nodeName: row.nodeName,
      value: 'browser-mutated'
    });
    const intent = gate.recordPostEventRestoreIntentFromEventLatestProps(
      dispatch.dispatchRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-event-latest-props-post-event-restore-queue',
        queueId: row.queueId,
        eventName: row.domEventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
    return {dispatch, intent};
  });
  const preflight = gate.preflightRestoreQueueWrites(
    records.map(({intent}) => intent),
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-queue-write-preflight',
      queueId: `${records[0].intent.requestId}-preflight`,
      targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
    }
  );
  const execution = gate.recordRestoreQueueWriteExecution(preflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-execution',
    queueId: `${preflight.requestId}-execution`,
    targetKind: 'controlled-input-post-event-restore-queue-write-execution'
  });
  const flushBlocker = gate.recordRestoreQueueFlushBlocker(preflight, {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
    queueId: `${preflight.requestId}-flush-blocker`,
    targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
  });

  return {
    gate,
    preflight,
    execution,
    flushBlocker,
    cleanup() {
      for (const {dispatch} of records) {
        componentTree.detachHostInstanceToken(dispatch.token);
      }
    }
  };
}

function createControlledInputEventDispatch(options) {
  const document = createRootBridgeDocument();
  const container = createRootBridgeElement('DIV', document);
  const targetNode = createRootBridgeElement(options.nodeName, document);
  targetNode.parentNode = container;
  if (Object.hasOwn(options, 'value')) {
    targetNode.value = options.value;
  }
  const token = componentTree.createHostInstanceToken(
    {kind: 'ControlledEventHost'},
    {kind: 'ControlledEventRoot'}
  );
  componentTree.attachHostInstanceNode(
    targetNode,
    token,
    options.latestProps
  );
  const wrapperRecord =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      options.domEventName,
      0
    );

  return {
    container,
    dispatchRecord: eventListener.dispatchEvent(wrapperRecord, {
      target: targetNode,
      type: options.domEventName
    }),
    document,
    targetNode,
    token
  };
}

function createControlledLatestPropsLookup(options) {
  const document = createRootBridgeDocument();
  const targetNode = createRootBridgeElement(options.nodeName, document);
  const token = componentTree.createHostInstanceToken(
    {kind: 'ControlledLatestPropsHost'},
    {kind: 'ControlledLatestPropsRoot'}
  );
  componentTree.attachHostInstanceNode(
    targetNode,
    token,
    options.latestProps
  );
  const normalizationRecord =
    componentTree.createEventTargetNormalizationRecord(targetNode);
  const lookupRecord = componentTree.createEventListenerTargetLookupRecord(
    normalizationRecord,
    options.registrationName
  );

  return {
    document,
    lookupRecord,
    normalizationRecord,
    targetNode,
    token
  };
}

function createThrowingFakeResourceDocument(log) {
  return {
    get head() {
      log.push('document.head');
      throw new Error('Unexpected fake resource document head read');
    },
    createElement(tagName) {
      log.push(`document.createElement:${tagName}`);
      throw new Error('Unexpected fake resource element creation');
    },
    querySelector(selector) {
      log.push(`document.querySelector:${selector}`);
      throw new Error('Unexpected fake resource document query');
    }
  };
}

function createThrowingFakeResourceHead(log) {
  return {
    appendChild(child) {
      log.push(['head.appendChild', child]);
      throw new Error('Unexpected fake resource head append');
    },
    insertBefore(child, before) {
      log.push(['head.insertBefore', child, before]);
      throw new Error('Unexpected fake resource head insert');
    },
    querySelector(selector) {
      log.push(`head.querySelector:${selector}`);
      throw new Error('Unexpected fake resource head query');
    }
  };
}

function createDeterministicFakeResourceDom() {
  const log = [];
  const document = {
    __fastReactFakeResourceDocument: true,
    nodeName: '#document',
    nodeType: 9,
    createElement(tagName) {
      log.push({tagName, type: 'document.createElement'});
      return createDeterministicFakeResourceElement(tagName, document, log);
    }
  };
  const head = {
    __fastReactFakeResourceHead: true,
    nodeName: 'HEAD',
    nodeType: 1,
    ownerDocument: document,
    childNodes: [],
    appendChild(child) {
      this.childNodes.push(child);
      child.parentNode = this;
      log.push({child: child.nodeName, type: 'head.appendChild'});
      return child;
    },
    insertBefore(child, before) {
      const index = this.childNodes.indexOf(before);
      if (index < 0) {
        throw new Error('Unexpected fake resource head insert target');
      }
      this.childNodes.splice(index, 0, child);
      child.parentNode = this;
      log.push({
        before: before.nodeName,
        child: child.nodeName,
        type: 'head.insertBefore'
      });
      return child;
    }
  };
  document.head = head;

  return {
    document,
    head,
    log
  };
}

function createDeterministicFakeResourceElement(tagName, ownerDocument, log) {
  const nodeName = tagName.toUpperCase();
  return {
    __fastReactFakeResourceElement: true,
    nodeName,
    tagName: nodeName,
    ownerDocument,
    parentNode: null,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      log.push({name, type: 'element.setAttribute', value: String(value)});
    }
  };
}

function appendFakeHeadChild(fakeDom, tagName, attributes = {}) {
  const element = fakeDom.document.createElement(tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  fakeDom.head.appendChild(element);
  return element;
}

function createControlledInputFakeDomTarget(fields) {
  return {
    [resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker]: true,
    ...fields
  };
}

function throwingProxy(label) {
  return new Proxy(Object.create(null), {
    get(_target, property) {
      throw new Error(`Unexpected ${label}.${String(property)} read`);
    },
    getPrototypeOf() {
      throw new Error(`Unexpected ${label} prototype read`);
    },
    has(_target, property) {
      throw new Error(`Unexpected ${label}.${String(property)} presence check`);
    },
    ownKeys() {
      throw new Error(`Unexpected ${label} key enumeration`);
    },
    set(_target, property) {
      throw new Error(`Unexpected ${label}.${String(property)} write`);
    }
  });
}

function oracleValue(oracle, modeId, scenarioId) {
  const observation = oracle.observations[modeId].find(
    (entry) => entry.scenarioId === scenarioId
  );
  assert.ok(observation, `${modeId}:${scenarioId}`);
  assert.equal(observation.result.status, 'ok', `${modeId}:${scenarioId}`);
  return observation.result.value;
}

function summarizeDispatcherRecord(record) {
  return {
    requestId: record.requestId,
    requestType: record.requestType,
    contractId: record.contractId,
    publicName: record.publicName,
    privateDispatcherKey: record.privateDispatcherKey,
    argumentNames: record.dispatcherShape.argumentNames,
    argumentSummaries: record.dispatcherShape.arguments.map(
      summarizeDispatcherArgument
    )
  };
}

function summarizeDispatcherArgument(argument) {
  const summary = {
    name: argument.name,
    type: argument.type
  };

  if (Object.hasOwn(argument, 'empty')) {
    summary.empty = argument.empty;
  }
  if (Object.hasOwn(argument, 'exactOwnKeys')) {
    summary.exactOwnKeys = argument.exactOwnKeys;
  }
  if (Object.hasOwn(argument, 'fields')) {
    summary.fields = argument.fields.map(summarizeDispatcherArgument);
  }

  return summary;
}

function summarizeFakeDomAdapterAdmission(admission) {
  return {
    adapterAdmissionId: admission.adapterAdmissionId,
    sourceRequestId: admission.sourceRequestId,
    requestType: admission.requestType,
    contractId: admission.contractId,
    privateDispatcherKey: admission.privateDispatcherKey,
    admissionStatus: admission.admissionStatus,
    executionStatus: admission.executionStatus,
    elementPlan: {
      elementTag: admission.resourceElementPlan.elementTag,
      relationship: admission.resourceElementPlan.relationship,
      attributeNames: admission.resourceElementPlan.attributeNames
    }
  };
}

function summarizeFakeDomInsertion(insertion) {
  return {
    insertionId: insertion.insertionId,
    sourceAdapterAdmissionId: insertion.sourceAdapterAdmissionId,
    sourceRequestId: insertion.sourceRequestId,
    requestType: insertion.requestType,
    contractId: insertion.contractId,
    privateDispatcherKey: insertion.privateDispatcherKey,
    insertionStatus: insertion.insertionStatus,
    executionStatus: insertion.executionStatus,
    elementPlan: {
      elementTag: insertion.resourceElementPlan.elementTag,
      relationship: insertion.resourceElementPlan.relationship,
      insertionMethod: insertion.resourceElementPlan.insertionMethod,
      attributeNames: insertion.resourceElementPlan.attributeNames
    }
  };
}

function summarizeHeadBoundary(boundary) {
  return {
    boundaryId: boundary.boundaryId,
    sourceInsertionId: boundary.sourceInsertionId,
    sourceHeadRequestId: boundary.sourceHeadRequestId,
    requestType: boundary.requestType,
    contractId: boundary.contractId,
    boundaryContractId: boundary.boundaryContractId,
    headContractId: boundary.headContractId,
    hostTag: boundary.hostTag,
    boundaryStatus: boundary.boundaryStatus,
    executionStatus: boundary.executionStatus,
    elementPlan: {
      elementTag: boundary.resourceElementPlan.elementTag,
      relationship: boundary.resourceElementPlan.relationship,
      insertedElementObserved:
        boundary.resourceElementPlan.insertedElementObserved,
      updateApplied: boundary.resourceElementPlan.updateApplied,
      updateAttributeNames:
        boundary.resourceElementPlan.updateAttributeNames
    }
  };
}

function summarizeHeadClearRetain(diagnostic) {
  const singletonRow = diagnostic.singletonRows[0];
  const resourceHintRow = diagnostic.resourceHintRows[0];
  return {
    clearRetainId: diagnostic.clearRetainId,
    sourceBoundaryId: diagnostic.sourceBoundaryId,
    sourceInsertionId: diagnostic.sourceInsertionId,
    sourceHeadRequestId: diagnostic.sourceHeadRequestId,
    requestType: diagnostic.requestType,
    contractId: diagnostic.contractId,
    hostTag: diagnostic.hostTag,
    clearRetainStatus: diagnostic.clearRetainStatus,
    executionStatus: diagnostic.executionStatus,
    singletonRow: {
      rowType: singletonRow.rowType,
      retainedChildCount: singletonRow.retainedChildCount,
      clearableChildCount: singletonRow.clearableChildCount,
      actualHeadChildrenCleared: singletonRow.actualHeadChildrenCleared
    },
    resourceHintRow: {
      rowType: resourceHintRow.rowType,
      childIndex: resourceHintRow.childIndex,
      nodeName: resourceHintRow.nodeName,
      relationship: resourceHintRow.relationship,
      clearRetainDecision: resourceHintRow.clearRetainDecision,
      clearReason: resourceHintRow.clearReason,
      resourceHoistableRetentionBlocked:
        resourceHintRow.resourceHoistableRetentionBlocked
    },
    fakeHeadPlan: {
      childCount: diagnostic.fakeHeadPlan.childCount,
      retainedChildCount: diagnostic.fakeHeadPlan.retainedChildCount,
      clearableChildCount: diagnostic.fakeHeadPlan.clearableChildCount,
      clearApplied: diagnostic.fakeHeadPlan.clearApplied
    }
  };
}

function summarizePreloadPreinitOrder(diagnostic) {
  return {
    orderDiagnosticId: diagnostic.orderDiagnosticId,
    requestType: diagnostic.requestType,
    orderStatus: diagnostic.orderStatus,
    executionStatus: diagnostic.executionStatus,
    dedupeActions: diagnostic.dedupeRows.map((row) => row.dedupeAction),
    plannedContractIds: diagnostic.plannedHeadInsertionOrder.rows.map(
      (row) => row.contractId
    ),
    observedNodeNames: diagnostic.observedHeadOrder.rows.map(
      (row) => row.nodeName
    ),
    resourceMapPlan: {
      uniqueResourceCount: diagnostic.resourceMapPlan.uniqueResourceCount,
      preloadResourceCount: diagnostic.resourceMapPlan.preloadResourceCount,
      preinitResourceCount: diagnostic.resourceMapPlan.preinitResourceCount,
      scriptModuleRowCount: diagnostic.resourceMapPlan.scriptModuleRowCount,
      dedupedRowCount: diagnostic.resourceMapPlan.dedupedRowCount
    }
  };
}

function createResourceMapCommitScenario(
  prefix,
  dispatcherRequests,
  createResourceDescriptors,
  headChildren
) {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: `${prefix}-source`
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: `${prefix}-adapter`
  });
  const orderGate =
    resourceFormGate.createResourceHintPreloadPreinitOrderGate({
      requestIdPrefix: `${prefix}-order`
    });
  const stylesheetGate =
    resourceFormGate.createResourceHintStylesheetPrecedenceGate({
      requestIdPrefix: `${prefix}-stylesheet`
    });
  const commitGate =
    resourceFormGate.createResourceHintResourceMapCommitGate({
      requestIdPrefix: `${prefix}-commit`
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const records = dispatcherRequests.map(([dispatcherKey, args]) =>
    gate.recordResourceHintDispatcherRequest(dispatcherKey, args)
  );
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy(`${prefix} head props`)
  ]);
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    })
  );

  for (const child of headChildren) {
    appendFakeHeadChild(fakeDom, child.tagName, child.attributes);
  }

  const order = orderGate.recordPreloadPreinitOrderDiagnostic(
    admissions,
    {
      explicitOrderDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head,
      resourceDescriptors: createResourceDescriptors(admissions)
    }
  );
  const stylesheet = stylesheetGate.recordStylesheetPrecedenceDiagnostic(
    order,
    headRecord,
    {
      explicitStylesheetPrecedenceDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );

  return {
    admissions,
    commitGate,
    fakeDom,
    order,
    stylesheet
  };
}

function assertRootMapStoragePreflightAdmissionRejects(
  resourceMapCommit,
  admission,
  reason
) {
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStoragePreflightGate()
        .recordRootMapStoragePreflight(resourceMapCommit, admission),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStoragePreflightInvalidAdmissionCode,
      compatibilityTarget,
      reason
    }
  );
}

function assertRootMapStorageExecutionAdmissionRejects(
  rootMapStoragePreflight,
  admission
) {
  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStorageGate()
        .recordRootMapStorageExecution(rootMapStoragePreflight, admission),
    {
      code:
        resourceFormGate
          .privateResourceHintRootMapStorageInvalidAdmissionCode,
      compatibilityTarget
    }
  );
}

function createRootMapStoragePreflightScenario(prefix) {
  const scenario = createResourceMapCommitScenario(
    prefix,
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'L',
        [
          '/script.js',
          'script',
          {
            crossOrigin: undefined,
            integrity: 'sha256-script-preload',
            nonce: undefined,
            type: undefined,
            fetchPriority: undefined,
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'X',
        [
          '/script.js',
          {
            crossOrigin: undefined,
            integrity: 'sha256-script',
            fetchPriority: 'high',
            nonce: 'nonce-script'
          }
        ]
      ],
      [
        'M',
        [
          '/module.mjs',
          {
            crossOrigin: '',
            integrity: 'sha256-module',
            nonce: 'nonce-module'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'script-main'
      },
      {
        sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'script-main'
      },
      {
        sourceAdapterAdmissionId: admissions[4].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'module-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      }
    ]
  );

  const commit = scenario.commitGate.recordResourceMapCommitDiagnostic(
    scenario.order,
    scenario.stylesheet,
    {
      explicitResourceMapCommitDiagnostic: true
    }
  );
  const storageGate =
    resourceFormGate.createResourceHintRootMapStoragePreflightGate({
      requestIdPrefix: `${prefix}-storage`
    });

  return {
    ...scenario,
    commit,
    storageGate
  };
}

function createDuplicateRootMapStoragePreflightScenario() {
  const scenario = createResourceMapCommitScenario(
    'root-map-storage-duplicate',
    [
      [
        'L',
        [
          '/style.css',
          'style',
          {
            crossOrigin: undefined,
            integrity: undefined,
            nonce: undefined,
            type: undefined,
            fetchPriority: 'low',
            referrerPolicy: undefined,
            imageSrcSet: undefined,
            imageSizes: undefined,
            media: undefined
          }
        ]
      ],
      [
        'S',
        [
          '/style.css',
          'theme',
          {
            crossOrigin: '',
            integrity: 'sha256-style',
            fetchPriority: 'high'
          }
        ]
      ],
      [
        'X',
        [
          '/script.js',
          {
            crossOrigin: undefined,
            integrity: 'sha256-script',
            fetchPriority: 'high',
            nonce: 'nonce-script'
          }
        ]
      ],
      [
        'X',
        [
          '/script.js',
          {
            crossOrigin: undefined,
            integrity: 'sha256-script-duplicate',
            fetchPriority: 'high',
            nonce: 'nonce-script-duplicate'
          }
        ]
      ]
    ],
    (admissions) => [
      {
        sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main'
      },
      {
        sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
        resourceKind: 'style',
        resourceKey: 'style-main',
        precedenceKey: 'precedence-main'
      },
      {
        sourceAdapterAdmissionId: admissions[2].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'script-main'
      },
      {
        sourceAdapterAdmissionId: admissions[3].adapterAdmissionId,
        resourceKind: 'script',
        resourceKey: 'script-main'
      }
    ],
    [
      {
        tagName: 'link',
        attributes: {
          rel: 'stylesheet',
          'data-precedence': 'theme',
          'data-fast-react-resource-key': 'style-main',
          'data-fast-react-precedence-key': 'precedence-main'
        }
      }
    ]
  );
  const commit = scenario.commitGate.recordResourceMapCommitDiagnostic(
    scenario.order,
    scenario.stylesheet,
    {
      explicitResourceMapCommitDiagnostic: true
    }
  );
  const storageGate =
    resourceFormGate.createResourceHintRootMapStoragePreflightGate({
      requestIdPrefix: 'root-map-storage-duplicate-storage'
    });

  return {
    ...scenario,
    commit,
    storageGate
  };
}

function createStylesheetPrecedenceLoadErrorStateScenario(prefix) {
  const gate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: `${prefix}-source`
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: `${prefix}-adapter`
  });
  const orderGate =
    resourceFormGate.createResourceHintPreloadPreinitOrderGate({
      requestIdPrefix: `${prefix}-order`
    });
  const stylesheetGate =
    resourceFormGate.createResourceHintStylesheetPrecedenceGate({
      requestIdPrefix: `${prefix}-precedence`
    });
  const fakeDom = createDeterministicFakeResourceDom();
  const records = [
    gate.recordResourceHintDispatcherRequest('L', [
      '/style.css',
      'style',
      {
        crossOrigin: undefined,
        integrity: undefined,
        nonce: undefined,
        type: undefined,
        fetchPriority: 'low',
        referrerPolicy: undefined,
        imageSrcSet: undefined,
        imageSizes: undefined,
        media: undefined
      }
    ]),
    gate.recordResourceHintDispatcherRequest('S', [
      '/style.css',
      'theme',
      {
        crossOrigin: '',
        integrity: 'sha256-style',
        fetchPriority: 'high'
      }
    ])
  ];
  const headRecord = gate.recordSingletonRequest('head', [
    throwingProxy('stylesheet load state head props')
  ]);
  const admissions = records.map((record) =>
    adapterGate.admitDispatcherRecord(record, {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'document-head'
    })
  );

  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'stylesheet',
    'data-precedence': 'theme',
    'data-fast-react-resource-key': 'style-main',
    'data-fast-react-precedence-key': 'precedence-main'
  });
  appendFakeHeadChild(fakeDom, 'link', {
    rel: 'preload',
    as: 'style',
    'data-fast-react-resource-key': 'style-main'
  });

  const order = orderGate.recordPreloadPreinitOrderDiagnostic(
    admissions,
    {
      explicitOrderDiagnostic: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head,
      resourceDescriptors: [
        {
          sourceAdapterAdmissionId: admissions[0].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main'
        },
        {
          sourceAdapterAdmissionId: admissions[1].adapterAdmissionId,
          resourceKind: 'style',
          resourceKey: 'style-main',
          precedenceKey: 'precedence-main'
        }
      ]
    }
  );
  const stylesheetPrecedence =
    stylesheetGate.recordStylesheetPrecedenceDiagnostic(
      order,
      headRecord,
      {
        explicitStylesheetPrecedenceDiagnostic: true,
        precedenceKind: 'deterministic-fake-dom-stylesheet-precedence-order',
        precedenceId: `${prefix}-precedence`,
        targetKind: 'document-head',
        hostTag: 'head',
        fakeDocument: fakeDom.document,
        fakeHead: fakeDom.head
      }
    );

  return { fakeDom, stylesheetPrecedence };
}

function fakeResourceSourceUsesNoLoadErrorListeners() {
  const source = readFileSync(
    path.join(sourceRoot, 'resource-form-internals-gate.js'),
    'utf8'
  );
  assert.doesNotMatch(
    source,
    /addEventListener\(\s*['"](?:load|error)['"]/u
  );
  assert.doesNotMatch(source, /\.(?:onload|onerror)\s*=/u);
  assert.doesNotMatch(source, /\bsetTimeout\s*\(/u);
  return true;
}

function requireFresh(fileName) {
  const absolutePath = path.join(packageRoot, fileName);
  delete require.cache[require.resolve(absolutePath)];
  return require(absolutePath);
}

function findDisallowedSourceMatches() {
  const matches = [];
  for (const filePath of listJavaScriptFiles(sourceRoot)) {
    const packageRelativeFile = path
      .relative(packageRoot, filePath)
      .split(path.sep)
      .join('/');
    if (metadataOnlySourceFiles.has(packageRelativeFile)) {
      continue;
    }

    const contents = readFileSync(filePath, 'utf8');
    for (const { id, pattern } of disallowedSourcePatterns) {
      const match = pattern.exec(contents);
      if (match !== null) {
        matches.push({
          file: path.relative(repoRoot, filePath).split(path.sep).join('/'),
          id,
          match: match[0]
        });
      }
    }
  }
  return matches;
}

function formatSourceMatches(matches) {
  if (matches.length === 0) {
    return 'React DOM resource/form/control unsupported source gate passed.';
  }
  return [
    'React DOM resource/form/control unsupported source gate found implementation tokens:',
    ...matches.map(
      (match) =>
        `${match.file}: ${match.id} matched ${JSON.stringify(match.match)}`
    )
  ].join('\n');
}

function listJavaScriptFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry);
    const entryStat = statSync(entryPath);
    if (entryStat.isDirectory()) {
      files.push(...listJavaScriptFiles(entryPath));
    } else if (entryStat.isFile() && entryPath.endsWith('.js')) {
      files.push(entryPath);
    }
  }
  return files;
}

function dataDescriptorFields(descriptor) {
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}
