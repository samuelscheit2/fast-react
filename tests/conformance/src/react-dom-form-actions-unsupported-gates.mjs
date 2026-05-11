import assert from "node:assert/strict";

import { REACT_DOM_FORM_ACTIONS_API_NAMES } from "./react-dom-form-actions-targets.mjs";
import {
  FAST_REACT_DOM_IMPLEMENTED_VERSION,
  FAST_REACT_DOM_COMPATIBILITY_TARGET,
  FAST_REACT_DOM_INTERNALS_EXPORT,
  FAST_REACT_DOM_PLACEHOLDER_VERSION,
  assertFastReactDomPlaceholderMetadata,
  assertFastReactDomUnsupportedExport,
  assertFastReactDomUnsupportedThrow,
  findDisallowedReactDomSourceMatches,
  formatDisallowedSourceMessage,
  requireReactDomPackageFile
} from "./react-dom-resource-hints-unsupported-gates.mjs";

export const FAST_REACT_FORM_ACTION_PLACEHOLDER_ENTRYPOINTS = [
  {
    entrypoint: "react-dom",
    fileName: "index.js",
    version: FAST_REACT_DOM_IMPLEMENTED_VERSION,
    expectedLengths: {
      requestFormReset: 1,
      useFormState: 3,
      useFormStatus: 0
    }
  },
  {
    entrypoint: "react-dom/profiling",
    fileName: "profiling.js",
    version: FAST_REACT_DOM_IMPLEMENTED_VERSION,
    expectedLengths: {
      requestFormReset: 1,
      useFormState: 3,
      useFormStatus: 0
    }
  }
];

export const FAST_REACT_FORM_ACTION_REACT_SERVER_ENTRYPOINT = {
  entrypoint: "react-dom",
  fileName: "react-dom.react-server.js",
  version: FAST_REACT_DOM_PLACEHOLDER_VERSION
};

export const FAST_REACT_FORM_ACTION_UNSUPPORTED_SOURCE_PATTERNS = [
  {
    id: "public-form-action-forwarder",
    pattern: /\b(?:requestFormReset|useFormStatus|useFormState)\b/u,
    reason:
      "Public form-action APIs must remain package-facade placeholders until client form gates exist."
  },
  {
    id: "form-reset-adapter",
    pattern: /\b(?:resetFormInstance|reset_form_instance)\b/u,
    reason:
      "React-owned form reset needs a host form adapter and client ownership lookup."
  },
  {
    id: "host-transition-status",
    pattern: /\b(?:HostTransition|hostTransition|startHostTransition)\b/u,
    reason:
      "Pending form status requires host transition context and scheduler lane gates."
  },
  {
    id: "form-data-mutation",
    pattern: /\b(?:FormData|submitter|createFormDataWithSubmitter)\b/u,
    reason:
      "Client action submission needs DOM FormData mutation and submitter gates."
  },
  {
    id: "root-form-state",
    pattern: /\b(?:formState|form_state)\b/u,
    reason:
      "Root form state must stay reserved until hydration/client action prerequisites exist."
  }
];

export function assertFastReactFormActionsUnsupportedGate() {
  for (const entrypoint of FAST_REACT_FORM_ACTION_PLACEHOLDER_ENTRYPOINTS) {
    const moduleExports = requireReactDomPackageFile(entrypoint.fileName);
    assertFastReactDomPlaceholderMetadata(
      moduleExports,
      entrypoint.entrypoint
    );
    assert.equal(
      moduleExports.version,
      entrypoint.version,
      `${entrypoint.entrypoint} version`
    );

    for (const apiName of REACT_DOM_FORM_ACTIONS_API_NAMES) {
      assertFastReactDomUnsupportedExport(moduleExports, {
        entrypoint: entrypoint.entrypoint,
        expectedLength: entrypoint.expectedLengths[apiName],
        expectedName: "",
        exportName: apiName
      });
    }

    assertPrivateFormResetDispatcherPlaceholder(moduleExports, {
      entrypoint: entrypoint.entrypoint
    });
  }

  assertPrivateFormActionResetDispatcherGate();

  const reactServerExports = requireReactDomPackageFile(
    FAST_REACT_FORM_ACTION_REACT_SERVER_ENTRYPOINT.fileName
  );
  assertFastReactDomPlaceholderMetadata(
    reactServerExports,
    FAST_REACT_FORM_ACTION_REACT_SERVER_ENTRYPOINT.entrypoint
  );
  assert.equal(
    reactServerExports.version,
    FAST_REACT_FORM_ACTION_REACT_SERVER_ENTRYPOINT.version,
    "react-server version"
  );
  for (const apiName of REACT_DOM_FORM_ACTIONS_API_NAMES) {
    assert.equal(
      Object.hasOwn(reactServerExports, apiName),
      false,
      `react-server must not expose ${apiName}`
    );
  }
}

export function assertPrivateFormActionResetDispatcherGate() {
  const resourceFormGate = requireReactDomPackageFile(
    "src/resource-form-gates.js"
  );
  const gate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: "conformance-form-dispatcher"
  });
  const submission = gate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: "submit",
    actionKind: "function",
    actionSource: "form",
    submitControlKind: "button",
    defaultPrevented: false,
    transitionScheduled: false
  });
  const reset = gate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: "r",
    resetSource: "requestFormReset",
    formOwnership: "not-inspected",
    transitionContext: "action"
  });
  const summary = resourceFormGate.describePrivateFormActionResetDispatcherGate();

  assert.equal(
    summary.gateId,
    resourceFormGate.privateFormActionResetDispatcherGateId
  );
  assert.equal(
    summary.status,
    resourceFormGate.privateFormActionResetDispatcherStatus
  );
  assert.equal(summary.recordsSubmissionIntentMetadata, true);
  assert.equal(summary.recordsSubmitRequestSubmitActionMetadata, true);
  assert.equal(summary.recordsResetIntentMetadata, true);
  assert.equal(summary.recordsResetDispatcherOrdering, true);
  assert.equal(summary.resetQueueCommitMetadataGateAvailable, true);
  assert.deepEqual(summary.acceptedSubmissionTriggers, [
    "submit",
    "requestSubmit",
    "replay",
    "unknown"
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
  const resetQueueCommit =
    assertPrivateFormResetQueueCommitGate(resourceFormGate, reset);

  assert.equal(
    resourceFormGate.isPrivateFormActionResetDispatcherRecord(submission),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateFormActionResetDispatcherRecordPayload(
      submission
    ),
    submission
  );
  assert.equal(
    resourceFormGate.isPrivateFormActionResetDispatcherRecord(reset),
    true
  );
  assert.equal(submission.status, resourceFormGate.privateFormActionSubmissionIntentRecordedStatus);
  assert.equal(reset.status, resourceFormGate.privateFormActionResetIntentRecordedStatus);
  assert.equal(submission.intent.submissionTrigger, "submit");
  assert.equal(submission.intent.actionMetadata.metadataOnly, true);
  assert.equal(
    submission.intent.actionMetadata.submitterValueWouldBeIncludedInFormData,
    true
  );
  assert.equal(submission.intent.realFormInspected, false);
  assert.equal(submission.intent.submitControlInspected, false);
  assert.equal(submission.intent.formDataConstructed, false);
  assert.equal(submission.intent.actionInvoked, false);
  assert.equal(submission.intent.hostTransitionStarted, false);
  assert.equal(
    submission.sideEffects.submitRequestSubmitActionMetadataRecorded,
    true
  );
  assert.equal(reset.intent.orderingKind, "current-dispatcher-react-owned-first");
  assert.equal(reset.intent.resetDispatcherOrdering.metadataOnly, true);
  assert.equal(
    reset.intent.resetDispatcherOrdering
      .publicRequestFormResetCallsCurrentDispatcherFirst,
    true
  );
  assert.equal(reset.intent.realFormInspected, false);
  assert.equal(reset.intent.formFiberResolved, false);
  assert.equal(reset.intent.resetCommitWouldRun, false);
  assert.equal(reset.intent.realFormReset, false);
  assert.equal(reset.sideEffects.resetDispatcherOrderingRecorded, true);
  assert.equal(submission.sideEffects.actionInvoked, false);
  assert.equal(submission.sideEffects.formDataConstructed, false);
  assert.equal(reset.sideEffects.resetStateQueued, false);
  assert.equal(reset.sideEffects.realFormReset, false);

  const requestSubmit = gate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: "submit",
    submissionTrigger: "requestSubmit",
    actionKind: "function",
    actionSource: "submit-control",
    submitControlKind: "input",
    formActionKind: "string",
    submitterActionKind: "function",
    defaultPrevented: false,
    transitionScheduled: false
  });
  assert.equal(requestSubmit.intent.actionMetadata.metadataOnly, true);
  assert.equal(
    requestSubmit.intent.actionMetadata.requestSubmitWouldDispatchSubmitEvent,
    true
  );
  assert.equal(
    requestSubmit.intent.actionMetadata.submitterActionOverridesFormAction,
    true
  );
  assert.equal(
    requestSubmit.intent.actionMetadata.submitterValueWouldBeIncludedInFormData,
    false
  );
  assert.equal(requestSubmit.intent.realFormInspected, false);

  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: "conformance-form-event-extraction"
  });
  const extraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(requestSubmit);
  const extractionSummary =
    resourceFormGate.describePrivateFormActionEventExtractionGate();
  assert.equal(
    extractionSummary.gateId,
    resourceFormGate.privateFormActionEventExtractionGateId
  );
  assert.equal(
    extractionSummary.status,
    resourceFormGate.privateFormActionEventExtractionStatus
  );
  assert.equal(
    extractionSummary.acceptedSourceRecordType,
    resourceFormGate.privateFormActionResetDispatcherRecordType
  );
  assert.deepEqual(extractionSummary.acceptedSubmissionTriggers, [
    "submit",
    "requestSubmit"
  ]);
  assert.equal(
    extractionSummary.consumesSubmitRequestSubmitActionMetadata,
    true
  );
  assert.equal(extractionSummary.recordsEventExtractionMetadata, true);
  assert.equal(extractionSummary.acceptsRealForms, false);
  assert.equal(extractionSummary.acceptsRawEvents, false);
  assert.equal(extractionSummary.createsSyntheticEvents, false);
  assert.equal(extractionSummary.constructsFormData, false);
  assert.equal(extractionSummary.invokesActions, false);
  assert.equal(extractionSummary.startsHostTransition, false);
  assert.deepEqual(
    extractionSummary.sideEffects,
    resourceFormGate.formActionEventExtractionBlockedSideEffects
  );
  assert.equal(
    resourceFormGate.isPrivateFormActionEventExtractionRecord(extraction),
    true
  );
  assert.equal(
    resourceFormGate.getPrivateFormActionEventExtractionRecordPayload(
      extraction
    ),
    extraction
  );
  assert.equal(
    extraction.status,
    resourceFormGate.privateFormActionEventExtractionRecordedStatus
  );
  assert.equal(extraction.sourceRequestId, requestSubmit.requestId);
  assert.equal(extraction.submissionTrigger, "requestSubmit");
  assert.equal(extraction.sourceActionMetadata.metadataOnly, true);
  assert.equal(
    extraction.eventExtraction.consumedSubmitRequestSubmitActionMetadata,
    true
  );
  assert.equal(
    extraction.eventExtraction.requestSubmitWouldDispatchSubmitEvent,
    true
  );
  assert.equal(extraction.eventExtraction.formDataConstructed, false);
  assert.equal(extraction.eventExtraction.syntheticEventCreated, false);
  assert.equal(extraction.eventExtraction.actionInvoked, false);
  assert.equal(extraction.eventExtraction.hostTransitionStarted, false);
  assert.deepEqual(
    extraction.sideEffects,
    resourceFormGate.formActionEventExtractionMetadataSideEffects
  );
  assert.equal(extraction.sideEffects.formActionEventPluginInvoked, false);
  assert.equal(extraction.sideEffects.nativeEventInspected, false);
  assert.equal(extraction.sideEffects.realFormInspected, false);
  assert.equal(extraction.sideEffects.formDataConstructed, false);

  assertPrivateFormActionSubmitDispatchGate(
    resourceFormGate,
    extraction,
    resetQueueCommit
  );

  const actionCompletionReset = gate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: "r",
    resetSource: "action-completion",
    formOwnership: "react-owned",
    transitionContext: "action"
  });
  assert.equal(
    actionCompletionReset.intent.orderingKind,
    "action-completion-reset-before-action"
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

  let actionCalls = 0;
  const action = () => {
    actionCalls++;
  };
  assert.throws(
    () =>
      gate.recordSubmissionIntent({
        explicitIntent: true,
        eventName: "submit",
        action
      }),
    {
      code: resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "action must not be passed to the metadata gate"
    }
  );
  assert.equal(actionCalls, 0);
  assert.throws(
    () =>
      gate.recordResetIntent({
        explicitIntent: true,
        form: throwingProxy("form")
      }),
    {
      code: resourceFormGate.privateFormActionResetDispatcherInvalidIntentCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "form must not be passed to the metadata gate"
    }
  );
  assert.throws(
    () => extractionGate.recordEventExtractionFromSubmissionIntent(reset),
    {
      code: resourceFormGate.privateFormActionEventExtractionInvalidRecordCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "source record must be a recorded submit action intent"
    }
  );
}

export function assertPrivateFormActionSubmitDispatchGate(
  resourceFormGate,
  extraction,
  resetQueueCommit
) {
  const formActions = requireReactDomPackageFile(
    "src/shared/form-actions.js"
  );
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: "conformance-submit-dispatch-blocker"
    });
  const dispatchGate =
    formActions.createFormActionSubmitDispatchDiagnosticGate({
      requestIdPrefix: "conformance-submit-dispatch"
    });
  const blocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: { targetKind: "form", hostTag: "form" },
      submitterShape: { controlKind: "input", hostTag: "input" }
    }
  );
  const record = dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
    explicitFormActionSubmitDispatch: true,
    submitControlKind: "input"
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
  assert.equal(summary.recordsActionIdentity, true);
  assert.equal(summary.recordsFormDataBlockerRows, true);
  assert.equal(summary.recordsResetQueueIntent, true);
  assert.equal(summary.recordsDispatchQueueRow, true);
  assert.equal(summary.submitResetExecutionGateAvailable, true);
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
  assert.deepEqual(
    summary.sideEffects,
    formActions.formActionSubmitDispatchBlockedSideEffects
  );
  assert.deepEqual(
    resourceFormGate.describePrivateFormActionSubmitDispatchBoundary(null),
    summary
  );

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
  assert.equal(record.sourceFormDataBlockerId, blocker.blockerId);
  assert.equal(record.sourceEventExtractionId, extraction.extractionId);
  assert.equal(
    record.sourceResetQueueCommitRequestId,
    resetQueueCommit.requestId
  );
  assert.equal(record.actionIdentity.metadataOnly, true);
  assert.equal(record.actionIdentity.resolvedActionKind, "function");
  assert.equal(record.actionIdentity.actionSource, "submit-control");
  assert.equal(record.actionIdentity.submitControlActionKind, "function");
  assert.equal(record.actionIdentity.actionFunctionCaptured, false);
  assert.equal(record.actionIdentity.actionInvoked, false);
  assert.equal(record.formDataBlockerLink.formDataConstructionBlocked, true);
  assert.equal(record.formDataBlockerLink.formDataConstructed, false);
  assert.equal(record.resetQueueIntentLink.resetStateWouldBeQueued, true);
  assert.equal(record.resetQueueIntentLink.resetStateQueued, false);
  assert.equal(record.resetQueueIntentLink.realFormReset, false);
  assert.equal(record.submitDispatchQueue.callbackDispatchBlocked, true);
  assert.equal(record.submitDispatchQueue.syntheticEventCreated, false);
  assert.equal(record.submitDispatchQueue.callbackDispatchExecuted, false);
  assert.equal(record.submitDispatchQueue.submitCallbackInvoked, false);
  assert.equal(record.submitDispatchQueue.actionInvoked, false);
  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(record.publicFormActionBoundary.submitDispatchReachable, false);
  assert.deepEqual(
    record.sideEffects,
    formActions.formActionSubmitDispatchDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.sourceFormDataBlockerAccepted, true);
  assert.equal(record.sideEffects.actionIdentityRecorded, true);
  assert.equal(record.sideEffects.dispatchQueueRowRecorded, true);
  assert.equal(record.sideEffects.resetQueueIntentLinked, true);
  assert.equal(record.sideEffects.liveFormAccepted, false);
  assert.equal(record.sideEffects.unsupportedSubmitControlAccepted, false);
  assert.equal(record.sideEffects.callbackDispatchExecuted, false);
  assert.equal(record.sideEffects.actionInvoked, false);
  assert.equal(record.sideEffects.realFormReset, false);

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
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "callback must not be passed to the submit dispatch metadata gate"
    }
  );
  assert.equal(callbackCalls, 0);
  assert.throws(
    () =>
      dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
        explicitFormActionSubmitDispatch: true,
        form: throwingProxy("form")
      }),
    {
      code:
        formActions.privateFormActionSubmitDispatchInvalidAdmissionCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "form must not be passed to the submit dispatch metadata gate"
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
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "callback dispatch execution must remain blocked"
    }
  );

  const resetDispatcherGate =
    resourceFormGate.createFormActionResetDispatcherGate({
      requestIdPrefix: "conformance-submit-reset-source"
    });
  const resetQueueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: "conformance-submit-reset-queue"
    });
  const actionCompletionReset = resetDispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: "r",
    resetSource: "action-completion",
    formOwnership: "react-owned",
    transitionContext: "action"
  });
  const actionCompletionQueueCommit =
    resetQueueCommitGate.recordResetQueueCommit(actionCompletionReset, {
      explicitAdmission: true,
      queueSource: "action-completion",
      queueKind: "metadata-only-reset-state-queue",
      commitKind: "after-mutation-form-reset-order",
      hostTag: "form"
    });
  const actionCompletionBlocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    actionCompletionQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: { targetKind: "form", hostTag: "form" },
      submitterShape: { controlKind: "input", hostTag: "input" }
    }
  );
  const actionCompletionDispatch =
    dispatchGate.recordSubmitDispatchDiagnostic(actionCompletionBlocker, {
      explicitFormActionSubmitDispatch: true,
      submitControlKind: "input"
    });
  const executionGate =
    formActions.createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix: "conformance-submit-reset-execution"
    });
  const execution = executionGate.recordSubmitResetExecution(
    actionCompletionDispatch,
    {
      explicitFormActionSubmitResetExecution: true,
      fakeFormPath: {
        pathId: "conformance-fake-form-action-completion-reset",
        pathKind: "action-completion-submit-reset",
        hostTag: "form",
        resetMode: "record-only-fake-reset"
      }
    }
  );
  const executionSummary =
    formActions.describePrivateFormActionSubmitResetExecutionGate();

  assert.equal(
    executionSummary.gateId,
    formActions.privateFormActionSubmitResetExecutionGateId
  );
  assert.equal(
    executionSummary.status,
    formActions.privateFormActionSubmitResetExecutionStatus
  );
  assert.equal(
    executionSummary.acceptedSubmitDispatchRecordType,
    formActions.privateFormActionSubmitDispatchRecordType
  );
  assert.equal(
    executionSummary.acceptedResetOrderingKind,
    "action-completion-reset-before-action"
  );
  assert.equal(executionSummary.consumesBlockedFormDataMetadata, true);
  assert.equal(executionSummary.consumesResetIntentMetadata, true);
  assert.equal(executionSummary.executesDeterministicFakeFormResetPath, true);
  assert.equal(executionSummary.admitsExactlyOneFakeFormPath, true);
  assert.equal(executionSummary.acceptsRealForms, false);
  assert.equal(executionSummary.constructsFormData, false);
  assert.equal(executionSummary.dispatchesSubmitCallbacks, false);
  assert.equal(executionSummary.invokesActions, false);
  assert.equal(executionSummary.queuesReactUpdates, false);
  assert.equal(executionSummary.resetsForms, false);
  assert.deepEqual(
    executionSummary.sideEffects,
    formActions.formActionSubmitResetExecutionBlockedSideEffects
  );
  assert.equal(
    formActions.isPrivateFormActionSubmitResetExecutionRecord(execution),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionSubmitResetExecutionRecordPayload(
      execution
    ),
    execution
  );
  assert.equal(
    execution.status,
    formActions.privateFormActionSubmitResetExecutionRecordedStatus
  );
  assert.equal(
    execution.sourceSubmitDispatchId,
    actionCompletionDispatch.dispatchId
  );
  assert.equal(
    execution.sourceFormDataBlockerId,
    actionCompletionBlocker.blockerId
  );
  assert.equal(
    execution.sourceResetIntentRequestId,
    actionCompletionReset.requestId
  );
  assert.equal(
    execution.formDataBlockerConsumption.blockedFormDataConsumed,
    true
  );
  assert.equal(
    execution.formDataBlockerConsumption.formDataConstructed,
    false
  );
  assert.equal(
    execution.resetIntentConsumption.resetIntentMetadataConsumed,
    true
  );
  assert.equal(
    execution.resetIntentConsumption.actionCompletionResetBeforeAction,
    true
  );
  assert.equal(execution.resetIntentConsumption.resetStateQueued, false);
  assert.equal(execution.resetIntentConsumption.realFormReset, false);
  assert.equal(
    execution.fakeFormResetExecution.fakeFormPathId,
    "conformance-fake-form-action-completion-reset"
  );
  assert.equal(
    execution.fakeFormResetExecution.fakeFormResetPathExecuted,
    true
  );
  assert.equal(execution.fakeFormResetExecution.fakeFormResetRecorded, true);
  assert.equal(execution.fakeFormResetExecution.formDataConstructed, false);
  assert.equal(
    execution.fakeFormResetExecution.callbackDispatchExecuted,
    false
  );
  assert.equal(execution.fakeFormResetExecution.actionInvoked, false);
  assert.equal(execution.fakeFormResetExecution.resetStateQueued, false);
  assert.equal(execution.fakeFormResetExecution.realFormReset, false);
  assert.equal(
    execution.publicFormActionBoundary.publicFormActionsEnabled,
    false
  );
  assert.equal(execution.publicFormActionBoundary.realFormReset, false);
  assert.deepEqual(
    execution.sideEffects,
    formActions.formActionSubmitResetExecutionDiagnosticSideEffects
  );
  assert.equal(execution.sideEffects.sourceSubmitDispatchAccepted, true);
  assert.equal(execution.sideEffects.blockedFormDataConsumed, true);
  assert.equal(execution.sideEffects.resetIntentMetadataConsumed, true);
  assert.equal(execution.sideEffects.fakeFormResetPathExecuted, true);
  assert.equal(execution.sideEffects.formDataConstructed, false);
  assert.equal(execution.sideEffects.actionInvoked, false);
  assert.equal(execution.sideEffects.realFormReset, false);

  const preflightGate =
    formActions.createFormActionCallbackActionPreflightDiagnosticGate({
      requestIdPrefix: "conformance-callback-action-preflight"
    });
  const preflight = preflightGate.recordCallbackActionInvocationPreflight(
    actionCompletionDispatch,
    execution,
    {
      explicitFormActionCallbackActionPreflight: true
    }
  );
  const preflightSummary =
    formActions.describePrivateFormActionCallbackActionPreflightGate();

  assert.equal(
    preflightSummary.gateId,
    formActions.privateFormActionCallbackActionPreflightGateId
  );
  assert.equal(
    preflightSummary.status,
    formActions.privateFormActionCallbackActionPreflightStatus
  );
  assert.equal(preflightSummary.consumesSubmitDispatchMetadata, true);
  assert.equal(preflightSummary.consumesSubmitResetExecutionMetadata, true);
  assert.equal(preflightSummary.recordsCallbackQueuePreflight, true);
  assert.equal(preflightSummary.recordsActionInvocationPreflight, true);
  assert.equal(preflightSummary.provesCallbacksRemainUninvoked, true);
  assert.equal(preflightSummary.provesActionsRemainUninvoked, true);
  assert.equal(preflightSummary.acceptsRealForms, false);
  assert.equal(preflightSummary.constructsFormData, false);
  assert.equal(preflightSummary.createsSyntheticEvents, false);
  assert.equal(preflightSummary.dispatchesSubmitCallbacks, false);
  assert.equal(preflightSummary.invokesActions, false);
  assert.equal(preflightSummary.startsHostTransition, false);
  assert.equal(preflightSummary.queuesReactUpdates, false);
  assert.equal(preflightSummary.resetsForms, false);
  assert.deepEqual(
    preflightSummary.sideEffects,
    formActions.formActionCallbackActionPreflightBlockedSideEffects
  );
  assert.equal(
    executionSummary.callbackActionPreflightGateAvailable,
    true
  );
  assert.equal(
    formActions.isPrivateFormActionCallbackActionPreflightRecord(preflight),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionCallbackActionPreflightRecordPayload(
      preflight
    ),
    preflight
  );
  assert.equal(
    preflight.status,
    formActions.privateFormActionCallbackActionPreflightRecordedStatus
  );
  assert.equal(
    preflight.sourceSubmitDispatchId,
    actionCompletionDispatch.dispatchId
  );
  assert.equal(
    preflight.sourceSubmitResetExecutionId,
    execution.executionId
  );
  assert.equal(
    preflight.acceptedMetadataIds.submitDispatchId,
    actionCompletionDispatch.dispatchId
  );
  assert.equal(
    preflight.acceptedMetadataIds.submitResetExecutionId,
    execution.executionId
  );
  assert.equal(preflight.admission.metadataOnly, true);
  assert.equal(preflight.sourceSubmitDispatch.callbackDispatchExecuted, false);
  assert.equal(preflight.sourceSubmitDispatch.actionInvoked, false);
  assert.equal(
    preflight.sourceSubmitResetExecution.fakeFormResetPathExecuted,
    true
  );
  assert.equal(
    preflight.sourceSubmitResetExecution.callbackDispatchExecuted,
    false
  );
  assert.equal(preflight.sourceSubmitResetExecution.actionInvoked, false);
  assert.equal(
    preflight.submitDispatchMetadataConsumption
      .submitDispatchMetadataConsumed,
    true
  );
  assert.equal(
    preflight.submitResetExecutionMetadataConsumption
      .submitResetExecutionMetadataConsumed,
    true
  );
  assert.equal(
    preflight.callbackDispatchPreflight.callbackDispatchPreflighted,
    true
  );
  assert.equal(preflight.callbackDispatchPreflight.syntheticEventCreated, false);
  assert.equal(
    preflight.callbackDispatchPreflight.callbackDispatchExecuted,
    false
  );
  assert.equal(
    preflight.callbackDispatchPreflight.submitCallbackInvoked,
    false
  );
  assert.equal(
    preflight.actionInvocationPreflight.actionInvocationWouldBeScheduled,
    true
  );
  assert.equal(preflight.actionInvocationPreflight.formDataConstructed, false);
  assert.equal(preflight.actionInvocationPreflight.actionInvoked, false);
  assert.equal(
    preflight.actionInvocationPreflight.hostTransitionStarted,
    false
  );
  assert.deepEqual(
    preflight.sideEffects,
    formActions.formActionCallbackActionPreflightDiagnosticSideEffects
  );
  assert.equal(preflight.sideEffects.submitDispatchMetadataConsumed, true);
  assert.equal(
    preflight.sideEffects.submitResetExecutionMetadataConsumed,
    true
  );
  assert.equal(preflight.sideEffects.callbackDispatchExecuted, false);
  assert.equal(preflight.sideEffects.submitCallbackInvoked, false);
  assert.equal(preflight.sideEffects.actionInvoked, false);
  assert.equal(preflight.sideEffects.realFormReset, false);

  const preflightError =
    formActions.createUnsupportedFormActionCallbackActionPreflightError(
      preflight
    );
  assert.equal(
    preflightError.code,
    formActions.privateFormActionCallbackActionPreflightGateErrorCode
  );
  assert.equal(preflightError.preflightId, preflight.preflightId);
  assert.deepEqual(
    preflightError.actionInvocationPreflight,
    preflight.actionInvocationPreflight
  );

  const executionError =
    formActions.createUnsupportedFormActionSubmitResetExecutionError(
      execution
    );
  assert.equal(
    executionError.code,
    formActions.privateFormActionSubmitResetExecutionGateErrorCode
  );
  assert.equal(executionError.executionId, execution.executionId);
  assert.deepEqual(
    executionError.resetIntentConsumption,
    execution.resetIntentConsumption
  );
  assert.throws(
    () =>
      executionGate.recordSubmitResetExecution(actionCompletionDispatch, {
        explicitFormActionSubmitResetExecution: true
      }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidAdmissionCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "fake form reset execution gate admits exactly one fake form path"
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionSubmitResetExecutionDiagnosticGate()
        .recordSubmitResetExecution(record, {
          explicitFormActionSubmitResetExecution: true
        }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidRecordCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "source submit dispatch must be accepted metadata-only action-completion reset dispatch"
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionSubmitResetExecutionDiagnosticGate()
        .recordSubmitResetExecution(actionCompletionDispatch, {
          explicitFormActionSubmitResetExecution: true,
          form: throwingProxy("form")
        }),
    {
      code:
        formActions.privateFormActionSubmitResetExecutionInvalidAdmissionCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "form must not be passed to the submit reset execution fake form gate"
    }
  );
  let preflightCallbackCalls = 0;
  const preflightCallback = () => {
    preflightCallbackCalls++;
  };
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        actionCompletionDispatch,
        execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          callback: preflightCallback
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "callback must not be passed to the callback/action invocation preflight gate"
    }
  );
  assert.equal(preflightCallbackCalls, 0);
  assert.throws(
    () =>
      preflightGate.recordCallbackActionInvocationPreflight(
        actionCompletionDispatch,
        execution,
        {
          explicitFormActionCallbackActionPreflight: true,
          actionInvocationRequested: true
        }
      ),
    {
      code:
        formActions.privateFormActionCallbackActionPreflightInvalidAdmissionCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "action invocation must remain blocked"
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
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "source submit dispatch must be accepted metadata-only submit dispatch"
    }
  );
}

export async function assertPrivateFormActionAsyncCallbackExecutionGate() {
  const resourceFormGate = requireReactDomPackageFile(
    "src/resource-form-gates.js"
  );
  const formActions = requireReactDomPackageFile(
    "src/shared/form-actions.js"
  );
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: "conformance-async-callback-source"
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: "conformance-async-callback-extraction"
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: "conformance-async-callback-queue"
    });
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: "conformance-async-callback-blocker"
    });
  const dispatchGate =
    formActions.createFormActionSubmitDispatchDiagnosticGate({
      requestIdPrefix: "conformance-async-callback-dispatch"
    });
  const resetExecutionGate =
    formActions.createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix: "conformance-async-callback-reset-execution"
    });
  const preflightGate =
    formActions.createFormActionCallbackActionPreflightDiagnosticGate({
      requestIdPrefix: "conformance-async-callback-preflight"
    });
  const asyncExecutionGate =
    formActions.createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: "conformance-async-callback-execution"
    });
  const submission = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: "submit",
    submissionTrigger: "requestSubmit",
    actionKind: "function",
    actionSource: "form",
    submitControlKind: "button",
    formActionKind: "function",
    submitterActionKind: "none",
    defaultPrevented: false,
    transitionScheduled: false
  });
  const extraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(submission);
  const reset = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: "r",
    resetSource: "action-completion",
    formOwnership: "react-owned",
    transitionContext: "action"
  });
  const resetQueueCommit = queueCommitGate.recordResetQueueCommit(reset, {
    explicitAdmission: true,
    queueSource: "action-completion",
    queueKind: "metadata-only-reset-state-queue",
    commitKind: "after-mutation-form-reset-order",
    hostTag: "form"
  });
  const blocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: { targetKind: "form", hostTag: "form" },
      submitterShape: { controlKind: "button", hostTag: "button" }
    }
  );
  const dispatch = dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
    explicitFormActionSubmitDispatch: true,
    submitControlKind: "button"
  });
  const resetExecution = resetExecutionGate.recordSubmitResetExecution(
    dispatch,
    {
      explicitFormActionSubmitResetExecution: true,
      fakeFormPath: {
        pathId: "conformance-async-callback-fake-reset",
        pathKind: "action-completion-submit-reset",
        hostTag: "form",
        resetMode: "record-only-fake-reset"
      }
    }
  );
  const preflight = preflightGate.recordCallbackActionInvocationPreflight(
    dispatch,
    resetExecution,
    {
      explicitFormActionCallbackActionPreflight: true
    }
  );
  let callbackCalls = 0;
  const record = await asyncExecutionGate.recordAsyncCallbackExecution(
    preflight,
    {
      explicitFormActionAsyncCallbackExecution: true,
      async asyncActionCallback(payload) {
        callbackCalls++;
        assert.equal(Object.isFrozen(payload), true);
        assert.equal(payload.formDataConstructed, false);
        await Promise.resolve();
        return "ok";
      }
    }
  );
  const summary =
    formActions.describePrivateFormActionAsyncCallbackExecutionGate();

  assert.equal(
    summary.gateId,
    formActions.privateFormActionAsyncCallbackExecutionGateId
  );
  assert.equal(
    summary.status,
    formActions.privateFormActionAsyncCallbackExecutionStatus
  );
  assert.equal(summary.recordsPendingStatusMetadata, true);
  assert.equal(summary.recordsResetMetadata, true);
  assert.equal(summary.admitsPrivateAsyncActionCallbacks, true);
  assert.equal(summary.executesPrivateAsyncActionCallbacks, true);
  assert.equal(summary.failClosedErrorsRecorded, true);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.dispatchesSubmitCallbacks, false);
  assert.equal(summary.invokesActions, false);
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
  assert.equal(
    formActions.isPrivateFormActionAsyncCallbackExecutionRecord(record),
    true
  );
  assert.equal(
    formActions.getPrivateFormActionAsyncCallbackExecutionRecordPayload(
      record
    ),
    record
  );
  assert.equal(
    record.status,
    formActions.privateFormActionAsyncCallbackExecutionRecordedStatus
  );
  assert.equal(
    record.sourceCallbackActionPreflightId,
    preflight.preflightId
  );
  assert.equal(record.sourceSubmitDispatchId, dispatch.dispatchId);
  assert.equal(
    record.sourceSubmitResetExecutionId,
    resetExecution.executionId
  );
  assert.equal(record.pendingStatusMetadata.pendingStatusWouldBeSet, true);
  assert.equal(record.pendingStatusMetadata.pending, true);
  assert.equal(record.pendingStatusMetadata.formDataConstructed, false);
  assert.equal(record.pendingStatusMetadata.hostTransitionStarted, false);
  assert.equal(record.resetMetadata.resetIntentMetadataConsumed, true);
  assert.equal(record.resetMetadata.fakeResetMetadataConsumed, true);
  assert.equal(
    record.resetMetadata.resetWouldRunBeforeActionInvocation,
    true
  );
  assert.equal(record.resetMetadata.resetStateQueued, false);
  assert.equal(record.resetMetadata.realFormReset, false);
  assert.equal(
    record.callbackExecution.status,
    "executed-private-form-action-async-callback-fulfilled"
  );
  assert.equal(record.callbackExecution.thenableObserved, true);
  assert.equal(record.callbackExecution.finalThenableStatus, "fulfilled");
  assert.equal(record.callbackExecution.publicActionInvoked, false);
  assert.equal(record.callbackExecution.hostTransitionStarted, false);
  assert.equal(record.callbackExecution.reactUpdateQueued, false);
  assert.equal(record.callbackExecution.realFormReset, false);
  assert.deepEqual(
    record.sideEffects,
    formActions.formActionAsyncCallbackExecutionFulfilledSideEffects
  );

  const rejected = await formActions
    .createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: "conformance-async-callback-rejected"
    })
    .recordAsyncCallbackExecution(preflight, {
      explicitFormActionAsyncCallbackExecution: true,
      async asyncActionCallback() {
        throw new Error("conformance async callback boom");
      }
    });
  assert.equal(rejected.callbackExecution.rejected, true);
  assert.equal(rejected.callbackExecution.failClosed, true);
  assert.equal(
    rejected.callbackExecution.errorInfo.message,
    "conformance async callback boom"
  );
  assert.deepEqual(
    rejected.sideEffects,
    formActions.formActionAsyncCallbackExecutionRejectedSideEffects
  );
  const synchronousThrow = await formActions
    .createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: "conformance-async-callback-sync-throw"
    })
    .recordAsyncCallbackExecution(preflight, {
      explicitFormActionAsyncCallbackExecution: true,
      asyncActionCallback() {
        throw new Error("conformance async callback sync throw");
      }
    });
  assert.equal(
    synchronousThrow.callbackExecution.status,
    "failed-private-form-action-async-callback-threw"
  );
  assert.equal(
    synchronousThrow.callbackExecution.callbackOutcome,
    "threw"
  );
  assert.equal(synchronousThrow.callbackExecution.thenableObserved, false);
  assert.equal(
    synchronousThrow.callbackExecution.initialThenableStatus,
    "not-created"
  );
  assert.equal(
    synchronousThrow.callbackExecution.finalThenableStatus,
    "threw"
  );
  assert.equal(synchronousThrow.callbackExecution.synchronousThrow, true);
  assert.equal(synchronousThrow.callbackExecution.rejected, false);
  assert.equal(synchronousThrow.callbackExecution.failClosed, true);
  assert.equal(
    synchronousThrow.callbackExecution.errorInfo.message,
    "conformance async callback sync throw"
  );
  assert.deepEqual(
    synchronousThrow.sideEffects,
    formActions.formActionAsyncCallbackExecutionSynchronousThrowSideEffects
  );
  assert.equal(
    synchronousThrow.sideEffects.asyncCallbackSynchronousThrowCaptured,
    true
  );
  assert.equal(synchronousThrow.sideEffects.actionInvoked, false);
  assert.equal(synchronousThrow.sideEffects.realFormReset, false);

  const nonThenable = await formActions
    .createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: "conformance-async-callback-non-thenable"
    })
    .recordAsyncCallbackExecution(preflight, {
      explicitFormActionAsyncCallbackExecution: true,
      asyncActionCallback() {
        return "sync-result";
      }
    });
  assert.equal(
    nonThenable.callbackExecution.status,
    "failed-private-form-action-async-callback-non-thenable"
  );
  assert.equal(
    nonThenable.callbackExecution.callbackOutcome,
    "non-thenable"
  );
  assert.equal(nonThenable.callbackExecution.thenableObserved, false);
  assert.equal(nonThenable.callbackExecution.nonThenable, true);
  assert.equal(nonThenable.callbackExecution.rejected, false);
  assert.equal(nonThenable.callbackExecution.failClosed, true);
  assert.equal(
    nonThenable.callbackExecution.finalThenableStatus,
    "not-thenable"
  );
  assert.deepEqual(nonThenable.callbackExecution.valueInfo, {
    type: "string",
    length: "sync-result".length
  });
  assert.deepEqual(
    nonThenable.sideEffects,
    formActions.formActionAsyncCallbackExecutionNonThenableSideEffects
  );
  assert.equal(
    nonThenable.sideEffects.asyncCallbackNonThenableReturned,
    true
  );
  assert.equal(nonThenable.sideEffects.actionInvoked, false);
  assert.equal(nonThenable.sideEffects.realFormReset, false);

  await assert.rejects(
    () =>
      asyncExecutionGate.recordAsyncCallbackExecution(preflight, {
        explicitFormActionAsyncCallbackExecution: true,
        asyncActionCallback() {
          return Promise.resolve();
        },
        form: throwingProxy("form")
      }),
    {
      code:
        formActions
          .privateFormActionAsyncCallbackExecutionInvalidAdmissionCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "form must not be passed to the async callback execution gate"
    }
  );
  await assert.rejects(
    () =>
      asyncExecutionGate.recordAsyncCallbackExecution(dispatch, {
        explicitFormActionAsyncCallbackExecution: true,
        asyncActionCallback() {
          return Promise.resolve();
        }
      }),
    {
      code:
        formActions.privateFormActionAsyncCallbackExecutionInvalidRecordCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "source callback/action preflight must be accepted metadata-only preflight"
    }
  );
}

export async function assertPrivateFormActionRejectedErrorPreflightGate() {
  const resourceFormGate = requireReactDomPackageFile(
    "src/resource-form-gates.js"
  );
  const formActions = requireReactDomPackageFile(
    "src/shared/form-actions.js"
  );
  const dispatcherGate = resourceFormGate.createFormActionResetDispatcherGate({
    requestIdPrefix: "conformance-rejected-error-source"
  });
  const extractionGate = resourceFormGate.createFormActionEventExtractionGate({
    requestIdPrefix: "conformance-rejected-error-extraction"
  });
  const queueCommitGate =
    resourceFormGate.createFormActionResetQueueCommitGate({
      requestIdPrefix: "conformance-rejected-error-queue"
    });
  const blockerGate =
    formActions.createFormActionFormDataBlockerDiagnosticGate({
      requestIdPrefix: "conformance-rejected-error-blocker"
    });
  const dispatchGate =
    formActions.createFormActionSubmitDispatchDiagnosticGate({
      requestIdPrefix: "conformance-rejected-error-dispatch"
    });
  const resetExecutionGate =
    formActions.createFormActionSubmitResetExecutionDiagnosticGate({
      requestIdPrefix: "conformance-rejected-error-reset"
    });
  const callbackPreflightGate =
    formActions.createFormActionCallbackActionPreflightDiagnosticGate({
      requestIdPrefix: "conformance-rejected-error-callback-preflight"
    });
  const asyncExecutionGate =
    formActions.createFormActionAsyncCallbackExecutionDiagnosticGate({
      requestIdPrefix: "conformance-rejected-error-async-execution"
    });
  const rejectedErrorPreflightGate =
    formActions.createFormActionRejectedErrorPreflightDiagnosticGate({
      requestIdPrefix: "conformance-rejected-error-preflight"
    });

  const submission = dispatcherGate.recordSubmissionIntent({
    explicitIntent: true,
    eventName: "submit",
    submissionTrigger: "requestSubmit",
    actionKind: "function",
    actionSource: "form",
    submitControlKind: "button",
    formActionKind: "function",
    submitterActionKind: "none",
    defaultPrevented: false,
    transitionScheduled: false
  });
  const extraction =
    extractionGate.recordEventExtractionFromSubmissionIntent(submission);
  const reset = dispatcherGate.recordResetIntent({
    explicitIntent: true,
    dispatcherKey: "r",
    resetSource: "action-completion",
    formOwnership: "react-owned",
    transitionContext: "action"
  });
  const resetQueueCommit = queueCommitGate.recordResetQueueCommit(reset, {
    explicitAdmission: true,
    queueSource: "action-completion",
    queueKind: "metadata-only-reset-state-queue",
    commitKind: "after-mutation-form-reset-order",
    hostTag: "form"
  });
  const blocker = blockerGate.recordFormDataBlockerDiagnostic(
    extraction,
    resetQueueCommit,
    {
      explicitFormActionFormDataBlocker: true,
      formTargetShape: { targetKind: "form", hostTag: "form" },
      submitterShape: { controlKind: "button", hostTag: "button" }
    }
  );
  const dispatch = dispatchGate.recordSubmitDispatchDiagnostic(blocker, {
    explicitFormActionSubmitDispatch: true,
    submitControlKind: "button"
  });
  const resetExecution = resetExecutionGate.recordSubmitResetExecution(
    dispatch,
    {
      explicitFormActionSubmitResetExecution: true,
      fakeFormPath: {
        pathId: "conformance-rejected-error-fake-reset",
        pathKind: "action-completion-submit-reset",
        hostTag: "form",
        resetMode: "record-only-fake-reset"
      }
    }
  );
  const callbackPreflight =
    callbackPreflightGate.recordCallbackActionInvocationPreflight(
      dispatch,
      resetExecution,
      {
        explicitFormActionCallbackActionPreflight: true
      }
    );
  const rejectedExecution =
    await asyncExecutionGate.recordAsyncCallbackExecution(
      callbackPreflight,
      {
        explicitFormActionAsyncCallbackExecution: true,
        async asyncActionCallback() {
          await Promise.resolve();
          throw new Error("conformance rejected action boom");
        }
      }
    );
  const record =
    rejectedErrorPreflightGate.recordRejectedErrorPreflight(
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
  assert.equal(summary.consumesRejectedAsyncActionErrorMetadata, true);
  assert.equal(summary.recordsActionErrorPreflight, true);
  assert.equal(summary.recordsResetActionPublicBlockers, true);
  assert.equal(summary.preflightOnly, true);
  assert.equal(summary.rejectsStaleRejections, true);
  assert.equal(summary.rejectsForeignRejections, true);
  assert.equal(summary.rejectsMalformedRejections, true);
  assert.equal(summary.rejectsPublicErrorRouting, true);
  assert.equal(summary.constructsFormData, false);
  assert.equal(summary.invokesActions, false);
  assert.equal(summary.invokesPrivateAsyncActionCallbacks, false);
  assert.equal(summary.routesErrors, false);
  assert.equal(summary.queuesReactUpdates, false);
  assert.equal(summary.resetsForms, false);
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
  assert.equal(
    record.sourceAsyncCallbackExecutionId,
    rejectedExecution.executionId
  );
  assert.equal(
    record.sourceCallbackActionPreflightId,
    callbackPreflight.preflightId
  );
  assert.equal(record.rejectedAsyncActionError.rejected, true);
  assert.equal(record.rejectedAsyncActionError.failClosed, true);
  assert.equal(
    record.rejectedAsyncActionError.errorInfo.message,
    "conformance rejected action boom"
  );
  assert.equal(record.rejectedAsyncActionError.rawErrorCaptured, false);
  assert.equal(record.actionErrorPreflight.actionInvoked, false);
  assert.equal(record.actionErrorPreflight.publicActionInvoked, false);
  assert.equal(record.actionErrorPreflight.reactUpdateQueued, false);
  assert.equal(record.actionErrorPreflight.rootErrorUpdateScheduled, false);
  assert.equal(
    record.actionErrorPreflight.publicRootErrorCallbackInvoked,
    false
  );
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
  assert.equal(record.resetActionPublicBlockers.reactUpdateQueued, false);
  assert.equal(record.resetActionPublicBlockers.realFormReset, false);
  assert.equal(
    record.publicFormActionBoundary.publicFormSubmissionReachable,
    false
  );
  assert.equal(
    record.publicFormActionBoundary.publicSubmitDispatchReachable,
    false
  );
  assert.equal(record.publicFormActionBoundary.actionInvoked, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.deepEqual(
    record.sideEffects,
    formActions.formActionRejectedErrorPreflightDiagnosticSideEffects
  );

  assert.throws(
    () =>
      rejectedErrorPreflightGate.recordRejectedErrorPreflight(
        rejectedExecution,
        {
          explicitFormActionRejectedErrorPreflight: true
        }
      ),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "source rejected async callback execution was already consumed by this preflight gate"
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight({ ...rejectedExecution }, {
          explicitFormActionRejectedErrorPreflight: true
        }),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "source async callback execution must be an accepted rejected fake callback execution"
    }
  );
  const fulfilledExecution =
    await formActions
      .createFormActionAsyncCallbackExecutionDiagnosticGate({
        requestIdPrefix: "conformance-rejected-error-fulfilled"
      })
      .recordAsyncCallbackExecution(callbackPreflight, {
        explicitFormActionAsyncCallbackExecution: true,
        async asyncActionCallback() {
          return "ok";
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
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "source async callback execution must be an accepted rejected fake callback execution"
    }
  );
  const synchronousThrowExecution =
    await formActions
      .createFormActionAsyncCallbackExecutionDiagnosticGate({
        requestIdPrefix: "conformance-rejected-error-sync-throw"
      })
      .recordAsyncCallbackExecution(callbackPreflight, {
        explicitFormActionAsyncCallbackExecution: true,
        asyncActionCallback() {
          throw new Error("conformance rejected sync throw");
        }
      });
  assert.equal(
    synchronousThrowExecution.callbackExecution.synchronousThrow,
    true
  );
  assert.equal(
    synchronousThrowExecution.callbackExecution.rejected,
    false
  );
  assert.equal(
    synchronousThrowExecution.callbackExecution.failClosed,
    true
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(synchronousThrowExecution, {
          explicitFormActionRejectedErrorPreflight: true
        }),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "source async callback execution must be an accepted rejected fake callback execution"
    }
  );

  const nonThenableExecution =
    await formActions
      .createFormActionAsyncCallbackExecutionDiagnosticGate({
        requestIdPrefix: "conformance-rejected-error-non-thenable"
      })
      .recordAsyncCallbackExecution(callbackPreflight, {
        explicitFormActionAsyncCallbackExecution: true,
        asyncActionCallback() {
          return "sync-result";
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
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "source async callback execution must be an accepted rejected fake callback execution"
    }
  );
  assert.throws(
    () =>
      formActions
        .createFormActionRejectedErrorPreflightDiagnosticGate()
        .recordRejectedErrorPreflight(rejectedExecution, {
          explicitFormActionRejectedErrorPreflight: true,
          sourceAsyncCallbackExecutionId: "stale-rejected-execution"
        }),
    {
      code:
        formActions
          .privateFormActionRejectedErrorPreflightInvalidAdmissionCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason:
        "sourceAsyncCallbackExecutionId must match the rejected async callback execution record"
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
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "public submit dispatch must remain blocked"
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
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "public error routing must remain blocked"
    }
  );
  assert.throws(
    () =>
      formActions.createUnsupportedFormActionRejectedErrorPreflightError({}),
    {
      code:
        formActions.privateFormActionRejectedErrorPreflightInvalidRecordCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET
    }
  );
}

export function assertPrivateFormResetQueueCommitGate(
  resourceFormGate,
  reset
) {
  const summary =
    resourceFormGate.describePrivateFormActionResetQueueCommitGate();
  const gate = resourceFormGate.createFormActionResetQueueCommitGate({
    requestIdPrefix: "conformance-form-reset-queue"
  });
  const record = gate.recordResetQueueCommit(reset, {
    explicitAdmission: true,
    queueSource: "requestFormResetOnFiber",
    queueKind: "metadata-only-reset-state-queue",
    commitKind: "after-mutation-form-reset-order",
    hostTag: "form"
  });

  assert.equal(
    summary.gateId,
    resourceFormGate.privateFormActionResetQueueCommitGateId
  );
  assert.equal(
    summary.status,
    resourceFormGate.privateFormActionResetQueueCommitStatus
  );
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
  assert.equal(record.sourceResetRequestId, reset.requestId);
  assert.equal(record.sourceResetOrderingKind, reset.intent.orderingKind);
  assert.equal(record.queueBoundary.resetStateWouldBeQueued, true);
  assert.equal(record.queueBoundary.updateLaneWouldBeRequested, true);
  assert.equal(record.queueBoundary.renderWouldDetectResetStateChange, true);
  assert.equal(record.queueBoundary.formResetFlagWouldBeMarked, true);
  assert.equal(record.queueBoundary.realFormInspected, false);
  assert.equal(record.queueBoundary.formFiberResolved, false);
  assert.equal(record.queueBoundary.resetStateQueueResolved, false);
  assert.equal(record.queueBoundary.resetUpdateEnqueued, false);
  assert.equal(record.queueBoundary.reactUpdateQueued, false);
  assert.equal(record.queueBoundary.renderFormResetFlagMarked, false);
  assert.equal(record.queueBoundary.previousDispatcherCalled, false);
  assert.equal(
    record.commitBoundary.resetTraversalWouldRunAfterMutationEffects,
    true
  );
  assert.equal(record.commitBoundary.defaultValueUpdatesWouldPrecedeReset, true);
  assert.equal(record.commitBoundary.resetFormInstanceWouldCallFormReset, true);
  assert.equal(record.commitBoundary.afterMutationEffectsVisited, false);
  assert.equal(record.commitBoundary.resetFormInstanceCalled, false);
  assert.equal(record.commitBoundary.formResetCommitted, false);
  assert.equal(record.commitBoundary.realFormReset, false);
  assert.equal(record.publicFormActionBoundary.publicFormActionsEnabled, false);
  assert.equal(
    record.publicFormActionBoundary.publicRequestFormResetReachable,
    false
  );
  assert.equal(record.publicFormActionBoundary.reactUpdateQueued, false);
  assert.equal(record.publicFormActionBoundary.realFormReset, false);
  assert.deepEqual(
    record.sideEffects,
    resourceFormGate.formActionResetQueueCommitDiagnosticSideEffects
  );
  assert.equal(record.sideEffects.resetQueueCommitMetadataRecorded, true);
  assert.equal(record.sideEffects.resetQueueBoundaryRecorded, true);
  assert.equal(record.sideEffects.resetCommitOrderRecorded, true);
  assert.equal(record.sideEffects.realFormInspected, false);
  assert.equal(record.sideEffects.resetUpdateEnqueued, false);
  assert.equal(record.sideEffects.reactUpdateQueued, false);
  assert.equal(record.sideEffects.resetFormInstanceCalled, false);
  assert.equal(record.sideEffects.formResetCommitted, false);
  assert.equal(record.sideEffects.realFormReset, false);

  assert.throws(
    () =>
      gate.recordResetQueueCommit(reset, {
        explicitAdmission: true,
        form: throwingProxy("form")
      }),
    {
      code:
        resourceFormGate.privateFormActionResetQueueCommitInvalidAdmissionCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET,
      reason: "form must not be passed to the queue/commit metadata gate"
    }
  );
  assert.throws(
    () =>
      resourceFormGate.createUnsupportedFormActionResetQueueCommitError({}),
    {
      code:
        resourceFormGate.privateFormActionResetQueueCommitInvalidRecordCode,
      compatibilityTarget: FAST_REACT_DOM_COMPATIBILITY_TARGET
    }
  );

  return record;
}

export function assertFastReactFormActionPrerequisiteGate() {
  const matches = findDisallowedReactDomSourceMatches(
    FAST_REACT_FORM_ACTION_UNSUPPORTED_SOURCE_PATTERNS
  );
  assert.deepEqual(
    matches,
    [],
    formatDisallowedSourceMessage(matches)
  );
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

function assertPrivateFormResetDispatcherPlaceholder(
  moduleExports,
  { entrypoint }
) {
  const dispatcher = moduleExports[FAST_REACT_DOM_INTERNALS_EXPORT].d;
  const descriptor = Object.getOwnPropertyDescriptor(dispatcher, "r");
  assert.ok(descriptor, `${entrypoint} private form reset dispatcher`);
  assert.equal(descriptor.value.length, 0, `${entrypoint}.d.r length`);
  assert.equal(
    descriptor.value.name,
    `${FAST_REACT_DOM_INTERNALS_EXPORT}.d.r`,
    `${entrypoint}.d.r name`
  );
  assertFastReactDomUnsupportedThrow(
    () => dispatcher.r("fast-react-placeholder-gate"),
    {
      entrypoint,
      exportName: `${FAST_REACT_DOM_INTERNALS_EXPORT}.d.r`
    }
  );
}
