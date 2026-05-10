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
