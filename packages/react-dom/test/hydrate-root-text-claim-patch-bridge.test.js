'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const rootBridge = require(path.join(
  packageRoot,
  'src/client/root-bridge.js'
));
const domContainer = require(path.join(
  packageRoot,
  'src/client/dom-container.js'
));
const rootMarkers = require(path.join(
  packageRoot,
  'src/client/root-markers.js'
));
const listenerRegistry = require(path.join(
  packageRoot,
  'src/events/listener-registry.js'
));
const eventListener = require(path.join(
  packageRoot,
  'src/events/react-dom-event-listener.js'
));
const eventSystemFlags = require(path.join(
  packageRoot,
  'src/events/event-system-flags.js'
));
const pluginEventSystem = require(path.join(
  packageRoot,
  'src/events/plugin-event-system.js'
));

test(
  'private hydrateRoot post-preflight execution applies one fake text claim patch',
  () => {
    let recoverableErrorCalls = 0;
    const {
      container,
      dispatchRecord,
      document,
      executionPreflightRecord,
      hydrateRecord,
      hydrationOptions,
      preflight,
      textNode
    } = createHydrateRootTextClaimPatchBridgeScenario(
      'hydrate-text-claim-patch-bridge',
      {
        onRecoverableError() {
          recoverableErrorCalls++;
        }
      }
    );
    const mismatchRow = hydrateRecord.textMismatchDiagnostics.mismatchRows[0];
    const bridgeExecution = preflight.postPreflightExecution(
      executionPreflightRecord,
      {
        claimLabel: 'bridge-text',
        hydrationOptions,
        mismatchRow,
        source: 'package-hydrate-root-text-claim-patch-bridge'
      }
    );
    const bridgePayload =
      rootBridge
        .getPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionPayload(
          bridgeExecution
        );
    const textPatchRecord =
      bridgeExecution.textNodeClaimPatchExecutionRecord;
    const textPatchPayload =
      rootBridge.getPrivateHydrationTextNodeClaimPatchExecutionPayload(
        textPatchRecord
      );
    const preflightPayload =
      rootBridge.getPrivateHydrateRootPublicFacadePreflightPayload(
        preflight
      );

    assert.equal(Object.isFrozen(bridgeExecution), true);
    assert.equal(
      bridgeExecution.$$typeof,
      rootBridge
        .privateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecordType
    );
    assert.equal(
      bridgeExecution.kind,
      'FastReactDomPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord'
    );
    assert.equal(
      bridgeExecution.executionStatus,
      rootBridge
        .ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_TEXT_NODE_CLAIM_PATCH_EXECUTED
    );
    assert.equal(
      rootBridge
        .isPrivateHydrateRootPublicFacadeTextNodeClaimPatchExecutionRecord(
          bridgeExecution
        ),
      true
    );
    assert.equal(
      bridgeExecution.textNodeClaimPatchExecutionId,
      'hydrate-text-claim-patch-bridge-preflight:1:execution:1:text-node-claim-patch:1'
    );
    assert.equal(bridgeExecution.executionPreflight, executionPreflightRecord);
    assert.equal(bridgeExecution.executionPreflightAccepted, true);
    assert.equal(bridgeExecution.privateExecutionPreflight, false);
    assert.equal(bridgeExecution.privateExecution, true);
    assert.equal(bridgeExecution.fakeDomOnly, true);
    assert.equal(bridgeExecution.fakeDomMutation, true);
    assert.equal(bridgeExecution.fakeTextNodeClaimed, true);
    assert.equal(bridgeExecution.fakeTextNodePatched, true);
    assert.equal(bridgeExecution.textNodeClaimExecuted, true);
    assert.equal(bridgeExecution.textPatchApplied, true);
    assert.equal(bridgeExecution.textPatched, true);
    assert.equal(bridgeExecution.expectedText, 'client text');
    assert.equal(bridgeExecution.actualTextBefore, 'server text');
    assert.equal(bridgeExecution.actualTextAfter, 'client text');
    assert.equal(bridgeExecution.claimedTextNodePath, 'container.childNodes[2]');
    assert.equal(bridgeExecution.claimLabel, 'bridge-text');
    assert.equal(bridgeExecution.publicHydrateRootEnabled, false);
    assert.equal(bridgeExecution.publicHydrateRootSupported, false);
    assert.equal(bridgeExecution.publicRootObjectExposed, false);
    assert.equal(bridgeExecution.nativeExecution, false);
    assert.equal(bridgeExecution.reconcilerExecution, false);
    assert.equal(bridgeExecution.domMutation, false);
    assert.equal(bridgeExecution.browserDomMutated, false);
    assert.equal(bridgeExecution.hydration, false);
    assert.equal(bridgeExecution.eventDispatch, false);
    assert.equal(bridgeExecution.recoverableErrorsQueued, false);
    assert.equal(bridgeExecution.onRecoverableErrorInvoked, false);
    assert.equal(bridgeExecution.publicOnRecoverableErrorInvoked, false);
    assert.equal(bridgeExecution.compatibilityClaimed, false);
    assert.deepEqual(
      bridgeExecution.acceptedCapabilities.map((capability) => capability.id),
      [
        'hydrate-root-execution-preflight-required',
        'hydrate-root-lifecycle-request-boundary-required',
        'hydrate-root-text-node-claim-patch-execution-record',
        'hydrate-root-text-node-claim-patch-options-owned',
        'hydrate-root-text-node-claim-patch-state-unchanged'
      ]
    );
    assert.equal(bridgeExecution.lifecycleRequestBoundaryAccepted, true);
    assert.equal(
      bridgeExecution.lifecycleRequestBoundarySourceOwned,
      true
    );
    assert.equal(bridgeExecution.lifecycleContainerSnapshotOwned, true);
    assert.equal(
      rootBridge
        .isPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryRecord(
          bridgeExecution.lifecycleRequestBoundary
        ),
      true
    );
    assert.equal(
      bridgeExecution.lifecycleRequestBoundaryStatus,
      rootBridge
        .ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_LIFECYCLE_BOUNDARY_ACCEPTED
    );

    assert.equal(
      rootBridge.isPrivateHydrationTextNodeClaimPatchExecutionRecord(
        textPatchRecord
      ),
      true
    );
    assert.equal(
      textPatchRecord.kind,
      rootBridge.HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION_RECORD_KIND
    );
    assert.equal(
      textPatchRecord.gateId,
      rootBridge.privateHydrationTextNodeClaimPatchExecutionGateId
    );
    assert.equal(
      textPatchRecord.status,
      rootBridge.privateHydrationTextNodeClaimPatchExecutionStatus
    );
    assert.equal(textPatchRecord.textMismatchRow, mismatchRow);
    assert.equal(textPatchRecord.actualTextBefore, 'server text');
    assert.equal(textPatchRecord.actualTextAfter, 'client text');
    assert.equal(textPatchRecord.claimLabel, 'bridge-text');
    assert.equal(textPatchPayload.hydrationOptions, hydrationOptions);
    assert.equal(textPatchPayload.hydrationBoundaryRecord, hydrateRecord.hydrationBoundaryRecord);
    assert.equal(textPatchPayload.claimedTextNode, textNode);

    assert.equal(bridgePayload.preflight, preflight);
    assert.equal(bridgePayload.executionPreflight, executionPreflightRecord);
    assert.equal(
      bridgePayload.textNodeClaimPatchExecutionRecord,
      textPatchRecord
    );
    assert.equal(
      bridgePayload.textNodeClaimPatchExecutionPayload,
      textPatchPayload
    );
    assert.equal(
      bridgePayload.lifecycleRequestBoundary,
      bridgeExecution.lifecycleRequestBoundary
    );
    const lifecyclePayload =
      rootBridge
        .getPrivateHydrateRootPublicFacadeLifecycleRequestBoundaryPayload(
          bridgeExecution.lifecycleRequestBoundary
        );
    assert.equal(lifecyclePayload.requestRecord, bridgePayload.requestRecord);
    assert.equal(
      lifecyclePayload.requestAdmission,
      hydrateRecord.requestAdmission
    );
    assert.deepEqual(
      preflight.getHydrateRootTextNodeClaimPatchExecutionRecords(),
      [bridgeExecution]
    );
    assert.deepEqual(
      preflightPayload.textNodeClaimPatchExecutionRecords,
      [bridgeExecution]
    );
    assert.deepEqual(
      preflightPayload.lifecycleRequestBoundaryRecords,
      [bridgeExecution.lifecycleRequestBoundary]
    );
    assert.equal(preflightPayload.lifecycleRequestBoundaryRecordCount, 1);
    assert.equal(preflightPayload.textNodeClaimPatchExecutionRecordCount, 1);
    assert.equal(textNode.nodeValue, 'client text');
    assert.equal(recoverableErrorCalls, 0);
    assert.equal(dispatchRecord.hydrationReplay.queued, false);
    assert.equal(rootMarkers.getContainerRoot(container), null);
    assert.equal(listenerRegistry.hasListeningMarker(container), false);
    assert.equal(listenerRegistry.hasListeningMarker(document), false);
    assert.deepEqual(container.__registrations, []);
    assert.deepEqual(document.__registrations, []);
    assert.deepEqual(container.__mutationLog, []);
    assert.deepEqual(document.__mutationLog, []);
  }
);

test(
  'private hydrateRoot post-preflight execution consumes an execution preflight once',
  () => {
    const {
      executionPreflightRecord,
      hydrateRecord,
      hydrationOptions,
      preflight,
      textNodes
    } = createHydrateRootMultiTextClaimPatchBridgeScenario(
      'hydrate-text-claim-patch-bridge-one-shot'
    );
    const mismatchRows = hydrateRecord.textMismatchDiagnostics.mismatchRows;

    assert.equal(mismatchRows.length, 2);
    const bridgeExecution = preflight.postPreflightExecution(
      executionPreflightRecord,
      {
        hydrationOptions,
        mismatchRow: mismatchRows[0]
      }
    );
    assert.equal(bridgeExecution.textPatchApplied, true);
    assert.equal(textNodes[0].nodeValue, 'client text one');
    assert.equal(textNodes[1].nodeValue, 'server text two');

    assert.throws(
      () =>
        preflight.postPreflightExecution(executionPreflightRecord, {
          hydrationOptions,
          mismatchRow: mismatchRows[1]
        }),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    assert.equal(textNodes[1].nodeValue, 'server text two');
    assert.equal(
      rootBridge
        .getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
        .textNodeClaimPatchExecutionRecordCount,
      1
    );
  }
);

test(
  'private hydrateRoot post-preflight execution rejects writeLog-only fake text ownership',
  () => {
    const spoofTextNode = createWriteLogOnlyText('server text');
    const {
      executionPreflightRecord,
      hydrateRecord,
      hydrationOptions,
      preflight
    } = createHydrateRootTextClaimPatchBridgeScenario(
      'hydrate-text-claim-patch-bridge-write-log-spoof',
      {
        textNode: spoofTextNode
      }
    );

    assert.throws(
      () =>
        preflight.postPreflightExecution(executionPreflightRecord, {
          hydrationOptions,
          mismatchRow: hydrateRecord.textMismatchDiagnostics.mismatchRows[0]
        }),
      {
        code:
          'FAST_REACT_DOM_INVALID_HYDRATION_TEXT_NODE_CLAIM_PATCH_EXECUTION'
      }
    );
    assert.equal(spoofTextNode.nodeValue, 'server text');
    assert.deepEqual(spoofTextNode.writeLog, []);
    assert.equal(
      rootBridge
        .getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
        .textNodeClaimPatchExecutionRecordCount,
      0
    );
  }
);

test(
  'private hydrateRoot post-preflight execution rejects stale foreign public and wrong-stage records',
  () => {
    const {
      container,
      dispatchRecord,
      document,
      eventReplayRecord,
      executionPreflightRecord,
      hydrateRecord,
      hydrationOptions,
      preflight,
      targetClaimRecord,
      textNode
    } = createHydrateRootTextClaimPatchBridgeScenario(
      'hydrate-text-claim-patch-bridge-negative'
    );

    assert.throws(
      () => preflight.postPreflightExecution(eventReplayRecord),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    assert.throws(
      () =>
        preflight.postPreflightExecution(
          Object.freeze({...executionPreflightRecord})
        ),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    assert.throws(
      () =>
        preflight.postPreflightExecution(
          Object.freeze({
            ...executionPreflightRecord,
            publicHydrateRootSupported: true
          })
        ),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    assert.throws(
      () =>
        preflight.postPreflightExecution(executionPreflightRecord, {
          hydrationOptions: {}
        }),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    const executionPayload =
      rootBridge.getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(
        executionPreflightRecord
      );
    const lifecycleRequestBoundary =
      executionPayload.lifecycleRequestBoundary;
    const mismatchRow = hydrateRecord.textMismatchDiagnostics.mismatchRows[0];
    assert.throws(
      () =>
        preflight.postPreflightExecution(executionPreflightRecord, {
          hydrationOptions,
          lifecycleRequestBoundary: Object.freeze({
            ...lifecycleRequestBoundary
          }),
          mismatchRow
        }),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    assert.throws(
      () =>
        preflight.postPreflightExecution(executionPreflightRecord, {
          hydrationOptions,
          lifecycleContainerSnapshot: Object.freeze({
            ...lifecycleRequestBoundary.lifecycleContainerSnapshot
          }),
          mismatchRow
        }),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    assert.throws(
      () =>
        preflight.postPreflightExecution(executionPreflightRecord, {
          hydrationOptions,
          lifecycleRequestBoundary:
            'hydrate-root-lifecycle-request-boundary-required',
          mismatchRow
        }),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );

    const foreign =
      createHydrateRootTextClaimPatchBridgeScenario(
        'hydrate-text-claim-patch-bridge-foreign'
      );
    assert.throws(
      () =>
        preflight.postPreflightExecution(
          foreign.executionPreflightRecord
        ),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    const foreignExecutionPayload =
      rootBridge.getPrivateHydrateRootPublicFacadeExecutionPreflightPayload(
        foreign.executionPreflightRecord
      );
    assert.throws(
      () =>
        preflight.postPreflightExecution(executionPreflightRecord, {
          hydrationOptions,
          lifecycleRequestBoundary:
            foreignExecutionPayload.lifecycleRequestBoundary,
          mismatchRow
        }),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );

    const staleStateBridge = rootBridge.createPrivateRootBridgeShell({
      sideEffectIdPrefix: 'hydrate-text-claim-patch-stale-state'
    });
    const staleStateCreateRecord =
      staleStateBridge.createClientRoot(container);
    const staleStateSideEffects =
      staleStateBridge.applyCreateRootSideEffects(staleStateCreateRecord);
    assert.throws(
      () => preflight.postPreflightExecution(executionPreflightRecord),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    staleStateBridge.revertCreateRootSideEffects(staleStateSideEffects);
    assert.equal(textNode.nodeValue, 'server text');

    const bridgeExecution = preflight.postPreflightExecution(
      executionPreflightRecord,
      {
        hydrationOptions,
        mismatchRow
      }
    );
    assert.equal(bridgeExecution.textPatchApplied, true);
    assert.throws(
      () => preflight.postPreflightExecution(executionPreflightRecord),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
    assert.equal(
      rootBridge
        .getPrivateHydrateRootPublicFacadePreflightPayload(preflight)
        .textNodeClaimPatchExecutionRecordCount,
      1
    );
    assert.equal(dispatchRecord.hydrationReplay.queued, false);
    assert.equal(foreign.dispatchRecord.hydrationReplay.queued, false);
    assert.deepEqual(container.__registrations, []);
    assert.deepEqual(document.__registrations, []);
    assert.deepEqual(foreign.container.__registrations, []);
    assert.deepEqual(foreign.document.__registrations, []);
    assert.deepEqual(container.__mutationLog, []);
    assert.deepEqual(document.__mutationLog, []);
    assert.deepEqual(foreign.container.__mutationLog, []);
    assert.deepEqual(foreign.document.__mutationLog, []);
    assert.throws(
      () => preflight.postPreflightExecution(targetClaimRecord),
    {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT'
      }
    );
  }
);

function createHydrateRootTextClaimPatchBridgeScenario(label, options) {
  const normalizedOptions = options || {};
  const document = createDocument(label);
  const container = createElement('DIV', document);
  const start = createComment('$');
  const target = createElement('BUTTON', document);
  const textNode = normalizedOptions.textNode || createText('server text');
  const end = createComment('/$');
  start.parentNode = container;
  target.parentNode = container;
  textNode.parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, textNode, end];
  const hydrationOptions = {
    identifierPrefix: `${label}-`,
    ...(typeof normalizedOptions.onRecoverableError === 'function'
      ? {onRecoverableError: normalizedOptions.onRecoverableError}
      : {})
  };
  const initialChildren = {
    props: {
      children: 'client text'
    },
    type: 'App'
  };
  const preflight =
    rootBridge.createPrivateHydrateRootPublicFacadePreflight({
      hydrateIdPrefix: `${label}-root`,
      publicFacadeHydratePreflightIdPrefix: `${label}-preflight`,
      requestIdPrefix: `${label}-request`
    });
  const hydrateRecord = preflight.hydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const dispatchRecord = createDispatchRecord(container, target);
  const targetClaimRecord = preflight.preflightTargetClaiming(
    hydrateRecord,
    dispatchRecord,
    {
      source: `${label}-target-claiming`
    }
  );
  const eventReplayRecord = preflight.preflightEventReplay(
    targetClaimRecord,
    {
      source: `${label}-event-replay`
    }
  );
  const executionPreflightRecord = preflight.preflightExecution(
    eventReplayRecord,
    {
      source: `${label}-execution-preflight`
    }
  );

  return {
    container,
    dispatchRecord,
    document,
    eventReplayRecord,
    executionPreflightRecord,
    hydrateRecord,
    hydrationOptions,
    preflight,
    targetClaimRecord,
    textNode
  };
}

function createHydrateRootMultiTextClaimPatchBridgeScenario(label) {
  const document = createDocument(label);
  const container = createElement('DIV', document);
  const start = createComment('$');
  const target = createElement('BUTTON', document);
  const textNodes = [
    createText('server text one'),
    createText('server text two')
  ];
  const end = createComment('/$');
  start.parentNode = container;
  target.parentNode = container;
  textNodes[0].parentNode = container;
  textNodes[1].parentNode = container;
  end.parentNode = container;
  container.childNodes = [start, target, textNodes[0], textNodes[1], end];
  const hydrationOptions = {
    identifierPrefix: `${label}-`
  };
  const initialChildren = {
    props: {
      children: ['client text one', 'client text two']
    },
    type: 'App'
  };
  const preflight =
    rootBridge.createPrivateHydrateRootPublicFacadePreflight({
      hydrateIdPrefix: `${label}-root`,
      publicFacadeHydratePreflightIdPrefix: `${label}-preflight`,
      requestIdPrefix: `${label}-request`
    });
  const hydrateRecord = preflight.hydrateRoot(
    container,
    initialChildren,
    hydrationOptions
  );
  const dispatchRecord = createDispatchRecord(container, target);
  const targetClaimRecord = preflight.preflightTargetClaiming(
    hydrateRecord,
    dispatchRecord,
    {
      source: `${label}-target-claiming`
    }
  );
  const eventReplayRecord = preflight.preflightEventReplay(
    targetClaimRecord,
    {
      source: `${label}-event-replay`
    }
  );
  const executionPreflightRecord = preflight.preflightExecution(
    eventReplayRecord,
    {
      source: `${label}-execution-preflight`
    }
  );

  return {
    container,
    dispatchRecord,
    document,
    eventReplayRecord,
    executionPreflightRecord,
    hydrateRecord,
    hydrationOptions,
    preflight,
    targetClaimRecord,
    textNodes
  };
}

function createDispatchRecord(container, target) {
  const wrapper =
    eventListener.createEventListenerWrapperRecordWithPriority(
      container,
      'click',
      eventSystemFlags.IS_CAPTURE_PHASE
    );

  return pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
    wrapper,
    {
      target,
      type: 'click'
    }
  );
}

function createComment(data) {
  return {
    data,
    nodeType: domContainer.COMMENT_NODE,
    parentNode: null
  };
}

function createText(nodeValue) {
  return {
    __fastReactFakeHydrationTextNode: true,
    nodeName: '#text',
    nodeType: domContainer.TEXT_NODE,
    nodeValue,
    parentNode: null
  };
}

function createWriteLogOnlyText(nodeValue) {
  const textNode = {
    nodeName: '#text',
    nodeType: domContainer.TEXT_NODE,
    parentNode: null,
    writeLog: []
  };
  let textValue = nodeValue;
  Object.defineProperty(textNode, 'nodeValue', {
    configurable: true,
    enumerable: true,
    get() {
      return textValue;
    },
    set(value) {
      textValue = String(value);
      this.writeLog.push(['nodeValue', textValue]);
    }
  });
  return textNode;
}

function createDocument(label) {
  const document = createEventTarget({
    __mutationLog: [],
    label,
    nodeName: '#document',
    nodeType: domContainer.DOCUMENT_NODE,
    parentNode: null
  });
  document.defaultView = createEventTarget({
    __mutationLog: [],
    label: `${label}-window`,
    parentNode: null
  });
  document.ownerDocument = document;
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    __mutationLog: [],
    childNodes: [],
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    ownerDocument,
    parentNode: null
  });
}

function createEventTarget(fields) {
  return {
    ...fields,
    __registrations: [],
    addEventListener(type, listener, options) {
      this.__registrations.push({
        listener,
        options,
        type
      });
    },
    removeEventListener(type, listener, options) {
      const index = this.__registrations.findIndex(
        (entry) =>
          entry.type === type &&
          entry.listener === listener &&
          entry.options === options
      );
      if (index !== -1) {
        this.__registrations.splice(index, 1);
      }
    }
  };
}
