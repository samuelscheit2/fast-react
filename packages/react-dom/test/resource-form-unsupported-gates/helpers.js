'use strict';

const assert = require('node:assert/strict');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const packageRoot = path.resolve(__dirname, '..', '..');
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
const rootListeners = require(path.join(
  sourceRoot,
  'events',
  'root-listeners.js'
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

function createRootMapStorageExecutionForRoot(
  prefix,
  rootId,
  rootLifecycleBinding
) {
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
    .recordRootMapStorageExecution(
      preflight,
      {
        explicitRootMapStorageExecution: true,
        executionId: `${prefix}-root-map-storage-execution`,
        rootId,
        expectedRootMapStorageRowIds: [
          'root-map-storage-preflight-0',
          'root-map-storage-preflight-1',
          'root-map-storage-preflight-2'
        ]
      },
      rootLifecycleBinding == null
        ? undefined
        : {
            rootBridgeAdmission: rootLifecycleBinding.admission,
            rootLifecycleRequestBoundary:
              rootLifecycleBinding.lifecycleBoundary
          }
    );
}

async function createPrivateFulfilledResetExecutionRecord(
  prefix,
  rootLifecycleBinding
) {
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
      },
      rootLifecycleBinding == null
        ? undefined
        : {
            rootBridgeAdmission: rootLifecycleBinding.admission,
            rootLifecycleRequestBoundary:
              rootLifecycleBinding.lifecycleBoundary
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

function createPrivateRootBridgeAdmission(options) {
  const requestIdPrefix =
    options && options.requestIdPrefix
      ? options.requestIdPrefix
      : 'root-gate-request';
  const rootIdPrefix =
    options && options.rootIdPrefix ? options.rootIdPrefix : 'root-gate';
  const updateIdPrefix =
    options && options.updateIdPrefix
      ? options.updateIdPrefix
      : 'root-gate-update';
  const document = createRootBridgeDocument();
  const container = createRootBridgeElement('DIV', document);
  const bridge = rootBridge.createPrivateRootBridgeShell({
    requestIdPrefix,
    rootIdPrefix,
    updateIdPrefix
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
    addEventListener(type, listener, options) {
      this.__registrations.push({ listener, options, type });
    },
    removeEventListener(type, listener) {
      removeRootBridgeEventRegistration(this.__registrations, type, listener);
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
    addEventListener(type, listener, options) {
      this.__registrations.push({ listener, options, type });
    },
    removeEventListener(type, listener) {
      removeRootBridgeEventRegistration(this.__registrations, type, listener);
    }
  };
}

function removeRootBridgeEventRegistration(registrations, type, listener) {
  for (let index = registrations.length - 1; index >= 0; index--) {
    const registration = registrations[index];
    if (registration.type === type && registration.listener === listener) {
      registrations.splice(index, 1);
      return;
    }
  }
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
  const rootRegistration =
    rootListeners.registerRootListenersForPrivateRoot(container);
  const rootListenerCurrentnessGateRecord =
    rootListeners.createPrivateRootListenerCurrentnessGateRecord(
      rootRegistration,
      {
        sourceKind: 'createRoot',
        sourceRecord: {
          operation: 'createRoot',
          requestId: `controlled-input-${options.domEventName}-root-listener-currentness`,
          requestType: 'createRoot'
        }
      }
    );

  return {
    container,
    dispatchRecord: eventListener.dispatchEvent(wrapperRecord, {
      target: targetNode,
      type: options.domEventName
    }),
    document,
    rootListenerCurrentnessGateRecord,
    rootRegistration,
    targetNode,
    token
  };
}

function createControlledInputChangePreflight(dispatch, requestId) {
  return pluginEventSystem.createInputChangeEventExtractionPreflightRecord(
    dispatch.dispatchRecord,
    {
      rootListenerCurrentnessGateRecord:
        dispatch.rootListenerCurrentnessGateRecord,
      sourceRecord: {
        operation: 'createRoot',
        requestId,
        requestType: 'createRoot'
      }
    }
  );
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
  admission,
  rootLifecycleBinding,
  reason
) {
  const expected = {
    code:
      resourceFormGate
        .privateResourceHintRootMapStorageInvalidAdmissionCode,
    compatibilityTarget
  };
  if (reason !== undefined) {
    expected.reason = reason;
  }

  assert.throws(
    () =>
      resourceFormGate
        .createResourceHintRootMapStorageGate()
        .recordRootMapStorageExecution(
          rootMapStoragePreflight,
          admission,
          rootLifecycleBinding
        ),
    expected
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

module.exports = {
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
};
