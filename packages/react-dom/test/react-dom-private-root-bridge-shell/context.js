'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '../..');
const React = require(path.resolve(packageRoot, '..', 'react', 'index.js'));
const reactDom = require(path.join(packageRoot, 'index.js'));
const reactDomClient = require(path.join(packageRoot, 'client.js'));
const resourceFormGate = require(
  path.join(packageRoot, 'src/resource-form-gates.js')
);
const controlledRestoreQueue = require(
  path.join(packageRoot, 'src/client/controlled-restore-queue.js')
);
const rootBridge = require(path.join(packageRoot, 'src/client/root-bridge.js'));
const hydrationGate = require(
  path.join(packageRoot, 'src/client/hydration-boundary-gate.js')
);
const componentTree = require(
  path.join(packageRoot, 'src/client/component-tree.js')
);
const {
  createDangerousHtmlTextResetDiagnostic
} = require(
  path.join(packageRoot, 'src/client/dom-property-operations.js')
);
const refCallbackGate = require(
  path.join(packageRoot, 'src/client/ref-callback-gate.js')
);
const domHost = require(path.join(packageRoot, 'src/dom-host/mutation.js'));
const rootMarkers = require(
  path.join(packageRoot, 'src/client/root-markers.js')
);
const listenerRegistry = require(
  path.join(packageRoot, 'src/events/listener-registry.js')
);
const eventListener = require(
  path.join(packageRoot, 'src/events/react-dom-event-listener.js')
);
const eventSystemFlags = require(
  path.join(packageRoot, 'src/events/event-system-flags.js')
);
const rootListeners = require(
  path.join(packageRoot, 'src/events/root-listeners.js')
);
const pluginEventSystem = require(
  path.join(packageRoot, 'src/events/plugin-event-system.js')
);
const {
  COMMENT_NODE,
  DOCUMENT_NODE,
  ELEMENT_NODE,
  TEXT_NODE,
  describeContainer
} = require(
  path.join(packageRoot, 'src/client/dom-container.js')
);

const hydrateRootAcceptedPrivateMetadataBlockedPublicFields =
  Object.freeze([
    'compatibilityClaimed',
    'publicRootCompatibilitySurface',
    'publicRootRenderCompatibilityClaimed',
    'publicHydrationCompatibilityClaimed',
    'publicHydrationReplayCompatibilityClaimed',
    'publicEventCompatibilityClaimed',
    'publicResourceCompatibilityClaimed',
    'publicResourceDomInsertionCompatibilityClaimed',
    'publicStylesheetCompatibilityClaimed',
    'publicFormCompatibilityClaimed',
    'publicFormActionCompatibilityClaimed',
    'publicFormResetCompatibilityClaimed',
    'publicControlledInputCompatibilityClaimed'
  ]);
const hydrateRootAcceptedPrivateMetadataRowBlockedPublicFields =
  Object.freeze([
    'compatibilityClaimed',
    'publicCompatibilityClaimed',
    'publicRootRenderCompatibilityClaimed',
    'publicHydrationCompatibilityClaimed',
    'publicResourceCompatibilityClaimed',
    'publicFormCompatibilityClaimed',
    'promotesHydration',
    'promotesRootRender'
  ]);


function assertHydrateRootTamperedEventReplayMetadataRejected() {
  const rootBridgePath = path.join(
    packageRoot,
    'src/client/root-bridge.js'
  );
  const hydrationGatePath = path.join(
    packageRoot,
    'src/client/hydration-boundary-gate.js'
  );
  const rootBridgeCacheKey = require.resolve(rootBridgePath);
  const rootBridgeCacheEntry = require.cache[rootBridgeCacheKey];
  const hydrationGate = require(hydrationGatePath);
  const originalCreateHydrationBoundaryGate =
    hydrationGate.createHydrationBoundaryGate;

  hydrationGate.createHydrationBoundaryGate =
    function createTamperedEventReplayHydrationBoundaryGate(options) {
      const gate = originalCreateHydrationBoundaryGate(options);
      return Object.freeze({
        ...gate,
        createHydrationClaimedReplayTargetDispatchExecutionRecord(...args) {
          const execution =
            gate.createHydrationClaimedReplayTargetDispatchExecutionRecord(
              ...args
            );
          return Object.freeze({...execution});
        }
      });
    };

  delete require.cache[rootBridgeCacheKey];
  try {
    const freshRootBridge = require(rootBridgePath);
    const document = createDocument('tampered-hydrate-event-replay');
    const container = createElement('DIV', document);
    const target = createElement('BUTTON', document);
    const start = createCommentNode('$', document);
    const end = createCommentNode('/$', document);
    start.parentNode = container;
    target.parentNode = container;
    end.parentNode = container;
    container.childNodes = [start, target, end];
    const preflight =
      freshRootBridge.createPrivateHydrateRootPublicFacadePreflight({
        publicFacadeHydratePreflightIdPrefix:
          'hydrate-event-replay-tampered'
      });
    const hydratePreflight = preflight.hydrateRoot(
      container,
      {
        props: {
          children: 'tampered event replay'
        },
        type: 'App'
      },
      {
        identifierPrefix: 'hydrate-event-replay-tampered-'
      }
    );
    const wrapper =
      eventListener.createEventListenerWrapperRecordWithPriority(
        container,
        'click',
        eventSystemFlags.IS_CAPTURE_PHASE
      );
    const dispatchRecord =
      pluginEventSystem.createEventDispatchRecordFromWrapperRecord(
        wrapper,
        {
          target,
          type: 'click'
        }
      );
    const targetClaimPreflight = preflight.preflightTargetClaiming(
      hydratePreflight,
      dispatchRecord
    );

    assert.throws(
      () => preflight.preflightEventReplay(targetClaimPreflight),
      {
        code:
          hydrationGate
            .INVALID_HYDRATION_CLAIMED_REPLAY_TARGET_DISPATCH_EXECUTION_CODE,
        message: /canonical immutable/
      }
    );
    assert.deepEqual(container.__registrations, []);
    assert.deepEqual(document.__registrations, []);
    assert.equal(container.__mutationLog.length, 0);
    assert.equal(document.__mutationLog.length, 0);
    assert.equal(dispatchRecord.hydrationReplay.queued, false);
  } finally {
    hydrationGate.createHydrationBoundaryGate =
      originalCreateHydrationBoundaryGate;
    delete require.cache[rootBridgeCacheKey];
    if (rootBridgeCacheEntry !== undefined) {
      require.cache[rootBridgeCacheKey] = rootBridgeCacheEntry;
    }
  }
}

function assertHydrateRootTamperedAcceptedMetadataRejected({
  metadataOverrides,
  mutateRow
}) {
  const rootBridgePath = path.join(
    packageRoot,
    'src/client/root-bridge.js'
  );
  const hydrationGatePath = path.join(
    packageRoot,
    'src/client/hydration-boundary-gate.js'
  );
  const rootBridgeCacheKey = require.resolve(rootBridgePath);
  const rootBridgeCacheEntry = require.cache[rootBridgeCacheKey];
  const hydrationGate = require(hydrationGatePath);
  const originalCreateHydrationBoundaryGate =
    hydrationGate.createHydrationBoundaryGate;
  const metadataContracts =
    hydrationGate.acceptedHydrationBoundaryMetadataContracts;
  const metadataIds = Object.freeze(
    metadataContracts.map((contract) => contract.metadataId)
  );
  const gateIds = Object.freeze(
    metadataContracts.map((contract) => contract.gateId)
  );
  const acceptedRecordTypes = Object.freeze(
    metadataContracts.map((contract) => contract.recordType)
  );
  const acceptedStatuses = Object.freeze(
    metadataContracts.map((contract) => contract.acceptedStatus)
  );
  const metadataRows = Object.freeze(
    metadataContracts.map((contract, index) =>
      Object.freeze(
        typeof mutateRow === 'function'
          ? mutateRow(createAcceptedPrivateMetadataRow(contract), index)
          : createAcceptedPrivateMetadataRow(contract)
      )
    )
  );

  hydrationGate.createHydrationBoundaryGate =
    function createTamperedHydrationBoundaryGate() {
      return Object.freeze({
        recordUnsupportedHydrateRoot() {
          const recordId = 'tampered-hydration-boundary:1';
          return Object.freeze({
            recordId,
            acceptedPrivateMetadataDiagnostics: Object.freeze({
              kind:
                hydrationGate
                  .HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND,
              gateId:
                hydrationGate.privateHydrationBoundaryAcceptedMetadataGateId,
              status:
                hydrationGate.privateHydrationBoundaryAcceptedMetadataStatus,
              rootRecordId: recordId,
              compatibilityClaimed: false,
              publicRootCompatibilitySurface: false,
              publicRootRenderCompatibilityClaimed: false,
              publicHydrationCompatibilityClaimed: false,
              publicHydrationReplayCompatibilityClaimed: false,
              publicEventCompatibilityClaimed: false,
              publicResourceCompatibilityClaimed: false,
              publicResourceDomInsertionCompatibilityClaimed: false,
              publicStylesheetCompatibilityClaimed: false,
              publicFormCompatibilityClaimed: false,
              publicFormActionCompatibilityClaimed: false,
              publicFormResetCompatibilityClaimed: false,
              publicControlledInputCompatibilityClaimed: false,
              metadataIdCount: metadataRows.length,
              metadataIds,
              gateIds,
              acceptedRecordTypes,
              acceptedStatuses,
              metadataRows,
              ...(metadataOverrides || {})
            }),
            acceptedPrivateMetadataIds: metadataIds,
            acceptedPrivateMetadataGateIds: gateIds
          });
        }
      });
    };

  delete require.cache[rootBridgeCacheKey];
  try {
    const freshRootBridge = require(rootBridgePath);
    const bridge = freshRootBridge.createPrivateRootBridgeShell();

    assert.throws(
      () => bridge.createHydrateRoot({}, null, null),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_BRIDGE_REQUEST',
        message: /without public compatibility claims/
      }
    );
  } finally {
    hydrationGate.createHydrationBoundaryGate =
      originalCreateHydrationBoundaryGate;
    delete require.cache[rootBridgeCacheKey];
    if (rootBridgeCacheEntry !== undefined) {
      require.cache[rootBridgeCacheKey] = rootBridgeCacheEntry;
    }
  }
}

function assertHydrateRootTamperedMarkerListenerGuardRejected({
  listenerGuardOverrides,
  markerGuardOverrides,
  message
}) {
  const rootBridgePath = path.join(
    packageRoot,
    'src/client/root-bridge.js'
  );
  const hydrationGatePath = path.join(
    packageRoot,
    'src/client/hydration-boundary-gate.js'
  );
  const rootBridgeCacheKey = require.resolve(rootBridgePath);
  const rootBridgeCacheEntry = require.cache[rootBridgeCacheKey];
  const hydrationGate = require(hydrationGatePath);
  const originalCreateHydrationBoundaryGate =
    hydrationGate.createHydrationBoundaryGate;
  const originalIsPrivateHydrationBoundaryRecord =
    hydrationGate.isPrivateHydrationBoundaryRecord;
  const originalGetPrivateHydrationBoundaryRecordPayload =
    hydrationGate.getPrivateHydrationBoundaryRecordPayload;
  const metadataContracts =
    hydrationGate.acceptedHydrationBoundaryMetadataContracts;
  const metadataIds = Object.freeze(
    metadataContracts.map((contract) => contract.metadataId)
  );
  const gateIds = Object.freeze(
    metadataContracts.map((contract) => contract.gateId)
  );
  const acceptedRecordTypes = Object.freeze(
    metadataContracts.map((contract) => contract.recordType)
  );
  const acceptedStatuses = Object.freeze(
    metadataContracts.map((contract) => contract.acceptedStatus)
  );
  const metadataRows = Object.freeze(
    metadataContracts.map((contract) =>
      Object.freeze(createAcceptedPrivateMetadataRow(contract))
    )
  );
  const tamperedPayloads = new WeakMap();

  hydrationGate.createHydrationBoundaryGate =
    function createTamperedHydrationBoundaryGate() {
      return Object.freeze({
        recordUnsupportedHydrateRoot(
          container,
          initialChildren,
          hydrationOptions
        ) {
          const recordId = 'tampered-hydration-marker-listener:1';
          const ownerDocument = container.ownerDocument || null;
          const acceptedPrivateMetadataDiagnostics = Object.freeze({
            kind:
              hydrationGate
                .HYDRATION_BOUNDARY_ACCEPTED_METADATA_DIAGNOSTIC_KIND,
            gateId:
              hydrationGate.privateHydrationBoundaryAcceptedMetadataGateId,
            status:
              hydrationGate.privateHydrationBoundaryAcceptedMetadataStatus,
            rootRecordId: recordId,
            compatibilityClaimed: false,
            publicRootCompatibilitySurface: false,
            publicRootRenderCompatibilityClaimed: false,
            publicHydrationCompatibilityClaimed: false,
            publicHydrationReplayCompatibilityClaimed: false,
            publicEventCompatibilityClaimed: false,
            publicResourceCompatibilityClaimed: false,
            publicResourceDomInsertionCompatibilityClaimed: false,
            publicStylesheetCompatibilityClaimed: false,
            publicFormCompatibilityClaimed: false,
            publicFormActionCompatibilityClaimed: false,
            publicFormResetCompatibilityClaimed: false,
            publicControlledInputCompatibilityClaimed: false,
            metadataIdCount: metadataRows.length,
            metadataIds,
            gateIds,
            acceptedRecordTypes,
            acceptedStatuses,
            metadataRows
          });
          const markerGuard = Object.freeze({
            action: 'defer-mark-container-as-root-for-hydrate-root',
            hasLegacyRootMarker: false,
            isContainerMarkedAsRoot: false,
            rootMarkerSnapshot: Object.freeze({
              inspectable: true,
              nullCount: 0,
              properties: Object.freeze([]),
              propertyCount: 0,
              truthyCount: 0
            }),
            warning: null,
            ...(markerGuardOverrides || {})
          });
          const listenerGuard = Object.freeze({
            action:
              'defer-listen-to-all-supported-events-for-hydrate-root',
            canInstallRootListeners: true,
            hasRootListeningMarker: false,
            ownerDocumentCanInstallSelectionChange: true,
            ownerDocumentHasSelectionChangeMarker: false,
            ownerDocumentInfo:
              ownerDocument === null
                ? null
                : Object.freeze(describeContainer(ownerDocument)),
            rootEventTargetInfo: Object.freeze(describeContainer(container)),
            ...(listenerGuardOverrides || {})
          });
          const record = Object.freeze({
            recordId,
            rootKind: 'unsupported-hydration',
            rootTag: rootBridge.CONCURRENT_ROOT_TAG,
            markerGuard,
            listenerGuard,
            markerDiagnostics: Object.freeze({}),
            markerParserEvidence: Object.freeze({}),
            markerEvidence: Object.freeze({}),
            textMismatchDiagnostics: Object.freeze({}),
            recoverableErrorMetadata: Object.freeze({}),
            replayQueueDiagnostics: Object.freeze({}),
            targetResolutionDiagnostics: Object.freeze({}),
            eventReplayBlockers: Object.freeze([]),
            acceptedPrivateMetadataDiagnostics,
            acceptedPrivateMetadataIds: metadataIds,
            acceptedPrivateMetadataGateIds: gateIds,
            containerInfo: Object.freeze({}),
            initialChildrenInfo: Object.freeze({}),
            optionsInfo: Object.freeze({}),
            oracleInfo: Object.freeze({}),
            blockedOn: Object.freeze([]),
            canHydrate: false,
            publicRootCreated: false,
            containerMarked: false,
            listenersAttached: false,
            domMutated: false,
            eventsReplayed: false,
            rootScheduled: false,
            suspenseHydrationScheduled: false
          });
          tamperedPayloads.set(record, {
            container,
            hydrationOptions,
            initialChildren
          });
          return record;
        }
      });
    };
  hydrationGate.isPrivateHydrationBoundaryRecord =
    function isTamperedPrivateHydrationBoundaryRecord(record) {
      return (
        tamperedPayloads.has(record) ||
        originalIsPrivateHydrationBoundaryRecord(record)
      );
    };
  hydrationGate.getPrivateHydrationBoundaryRecordPayload =
    function getTamperedHydrationBoundaryPayload(record) {
      return (
        tamperedPayloads.get(record) ||
        originalGetPrivateHydrationBoundaryRecordPayload(record)
      );
    };

  delete require.cache[rootBridgeCacheKey];
  try {
    const freshRootBridge = require(rootBridgePath);
    const document = createDocument('tampered-hydrate-marker-listener');
    const container = createElement('DIV', document);
    const preflight =
      freshRootBridge.createPrivateHydrateRootPublicFacadePreflight();

    assert.throws(
      () => preflight.hydrateRoot(container, 'hydrated', {}),
      {
        code: 'FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT',
        message
      }
    );
  } finally {
    hydrationGate.createHydrationBoundaryGate =
      originalCreateHydrationBoundaryGate;
    hydrationGate.isPrivateHydrationBoundaryRecord =
      originalIsPrivateHydrationBoundaryRecord;
    hydrationGate.getPrivateHydrationBoundaryRecordPayload =
      originalGetPrivateHydrationBoundaryRecordPayload;
    delete require.cache[rootBridgeCacheKey];
    if (rootBridgeCacheEntry !== undefined) {
      require.cache[rootBridgeCacheKey] = rootBridgeCacheEntry;
    }
  }
}

function createAcceptedPrivateMetadataRow(contract) {
  return {
    metadataId: contract.metadataId,
    category: contract.category,
    gateId: contract.gateId,
    recordType: contract.recordType,
    acceptedStatus: contract.acceptedStatus,
    blockedReason: contract.blockedReason,
    reason: contract.reason,
    metadataRecognized: true,
    diagnosticOnly: true,
    readOnly: true,
    compatibilityClaimed: false,
    publicCompatibilityClaimed: false,
    publicRootRenderCompatibilityClaimed: false,
    publicHydrationCompatibilityClaimed: false,
    publicResourceCompatibilityClaimed: false,
    publicFormCompatibilityClaimed: false,
    promotesHydration: false,
    promotesRootRender: false
  };
}


function createHostOutputProps(phase) {
  if (phase === 'updated') {
    return {
      id: 'message',
      className: 'root-card updated',
      title: 'updated title',
      'data-phase': 'updated',
      children: 'goodbye'
    };
  }

  return {
    id: 'message',
    className: 'root-card',
    title: 'initial title',
    'data-phase': 'initial',
    children: 'hello'
  };
}

function createHostOutputAttributeStyleProps(phase) {
  if (phase === 'updated') {
    return {
      id: 'message',
      className: 'root-card updated',
      style: {
        color: 'blue',
        width: 12
      },
      'data-phase': 'updated',
      children: 'stable'
    };
  }

  return {
    id: 'message',
    className: 'root-card',
    title: 'initial title',
    hidden: true,
    style: {
      color: 'red',
      marginTop: 4,
      '--gap': '4px'
    },
    'data-phase': 'initial',
    children: 'stable'
  };
}

function createRootWorkLoopFinishedWorkMetadata(options) {
  const childTags = options.childTags || ['HostComponent', 'HostText'];
  return {
    source: rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_SOURCE,
    status: rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_STATUS,
    metadataRevision:
      options.metadataRevision ||
      rootBridge.ROOT_WORK_LOOP_FINISHED_WORK_METADATA_REVISION,
    facade: {
      rootId: options.rootId,
      rootTag: options.rootTag,
      renderUpdateId: options.renderUpdateId,
      hostType: options.hostType,
      hostOutputShape: options.hostOutputShape,
      hostComponentCount: options.hostComponentCount,
      hostTextCount: options.hostTextCount,
      textContent: options.textContent
    },
    completeWork: {
      rootChildTag: options.rootChildTag || 'HostComponent',
      completedChildTag: options.completedChildTag || 'HostComponent',
      hostTextChildTag: options.hostTextChildTag || 'HostText',
      childTags
    },
    pending: {
      recordsFinishedWork: true,
      pendingWorkMatchesFinishedWork: true,
      renderLanes: 'Default',
      finishedLanes: 'Default',
      remainingLanes: 'NoLanes'
    },
    commit: {
      commitOrderAfterPendingRecord: true,
      consumedFinishedWorkRecord: true,
      finishedWorkAfterCommit: null,
      finishedLanesAfterCommit: 'NoLanes',
      renderPhaseWorkAfterCommit: null,
      mutationExecutionBlocked: true,
      publicRootRenderingBlocked: true,
      effectsRefsAndHydrationBlocked: true
    },
    placement: {
      tag: options.placementTag || 'HostComponent',
      applyKind:
        options.placementApplyKind || 'append-placement-to-container',
      siblingStatus: 'append'
    }
  };
}

function createRootCommitHostComponentUpdateRecord(options) {
  return {
    kind: 'commit-host-component-update',
    tag: 'HostComponent',
    source: {
      kind: 'Update'
    },
    root: {
      slot: 3
    },
    hostRoot: {
      slot: 4
    },
    parent: {
      slot: 4
    },
    parentTag: 'HostRoot',
    fiber: {
      slot: 12 + (options.recordIndex || 0)
    },
    alternateFiber: {
      slot: 8 + (options.recordIndex || 0)
    },
    stateNodeRaw: options.stateNodeRaw,
    pendingPropsRaw: 3003,
    memoizedPropsRaw: 3003,
    alternateMemoizedPropsRaw: 3001
  };
}

function createRootCommitHostTextUpdateRecord(options) {
  return {
    kind: 'commit-host-text-update',
    tag: 'HostText',
    source: {
      kind: 'Update'
    },
    root: {
      slot: 3
    },
    hostRoot: {
      slot: 4
    },
    parent: {
      slot: 12
    },
    parentTag: 'HostComponent',
    fiber: {
      slot: 40 + (options.recordIndex || 0)
    },
    alternateFiber: {
      slot: 36 + (options.recordIndex || 0)
    },
    stateNodeRaw: options.stateNodeRaw,
    pendingPropsRaw: 4003,
    memoizedPropsRaw: 4003,
    alternateMemoizedPropsRaw: 4001
  };
}

function createRootCommitPropertyTextFixture(label, nextProps) {
  const document = createHostOutputDocument(label);
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = createHostOutputProps('initial');
  const updateProps = nextProps || createHostOutputProps('updated');
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);
  const mounted = mountPrivateHostOutput(container, create.owner, initialProps);
  const update = bridge.renderContainer(create.handle, {
    props: updateProps,
    type: 'div'
  });

  return {
    bridge,
    container,
    create,
    initialProps,
    metadata: {
      mutationApplyRecords: [
        createRootCommitHostComponentUpdateRecord({
          recordIndex: 0,
          stateNodeRaw: 901
        }),
        createRootCommitHostTextUpdateRecord({
          recordIndex: 1,
          stateNodeRaw: 902
        })
      ]
    },
    mounted,
    nextProps: updateProps,
    sideEffects,
    update
  };
}

function cleanupRootCommitPropertyTextFixture(fixture) {
  assert.equal(
    componentTree.detachHostInstanceToken(fixture.mounted.token),
    fixture.mounted.token
  );
  fixture.bridge.revertCreateRootSideEffects(fixture.sideEffects);
}

function createDangerousHtmlTextResetExecutionFixture(
  label,
  previousProps,
  nextProps,
  options
) {
  const document = createHostOutputDocument(label);
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    dangerousHtmlTextResetCommitIdPrefix: `${label}-execution`,
    sideEffectIdPrefix: `${label}-side-effect`
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialRender = bridge.renderContainer(create.handle, {
    props: previousProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);

  const host = document.createElement('div');
  installDangerousHtmlTextResetAccessors(host, previousProps);
  if (options == null || options.admitFakeDomTarget !== false) {
    domHost.markDangerousHtmlTextResetFakeDomTarget(host);
  }
  const token = componentTree.createHostInstanceToken(
    {kind: 'PrivateRootDangerousHtmlTextResetHost'},
    create.owner
  );
  componentTree.attachHostInstanceNode(host, token, previousProps);
  domHost.appendChildToContainer(container, host);

  return {
    bridge,
    container,
    create,
    diagnostic: createDangerousHtmlTextResetDiagnostic(
      'div',
      previousProps,
      nextProps
    ),
    host,
    metadata: {
      mutationApplyRecords: [
        createRootCommitHostComponentUpdateRecord({
          recordIndex: 0,
          stateNodeRaw: 901
        })
      ]
    },
    nextProps,
    previousProps,
    sideEffects,
    token,
    update: bridge.renderContainer(create.handle, {
      props: nextProps,
      type: 'div'
    })
  };
}

function cleanupDangerousHtmlTextResetExecutionFixture(fixture) {
  assert.equal(
    componentTree.detachHostInstanceToken(fixture.token),
    fixture.token
  );
  fixture.bridge.revertCreateRootSideEffects(fixture.sideEffects);
}

function installDangerousHtmlTextResetAccessors(host, previousProps) {
  let innerHTML = getDangerousHtmlFixtureInitialHtml(previousProps);
  let textContent = getDangerousHtmlFixtureInitialText(previousProps);
  host.dangerousWriteLog = [];
  host.onDangerousWrite = null;

  Object.defineProperties(host, {
    innerHTML: {
      configurable: true,
      enumerable: true,
      get() {
        return innerHTML;
      },
      set(value) {
        const html = String(value);
        for (const child of [...this.childNodes]) {
          detachHostOutputChild(child);
        }
        innerHTML = html;
        textContent = '';
        this.dangerousWriteLog.push(['innerHTML', html]);
        this.__mutationLog.push({type: 'innerHTML', value: html});
        if (typeof this.onDangerousWrite === 'function') {
          this.onDangerousWrite('innerHTML', html);
        }
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        if (this.childNodes.length > 0) {
          return this.childNodes.map((child) => child.textContent).join('');
        }
        return textContent;
      },
      set(value) {
        const text = String(value);
        for (const child of [...this.childNodes]) {
          detachHostOutputChild(child);
        }
        textContent = text;
        innerHTML = '';
        this.dangerousWriteLog.push(['textContent', text]);
        this.__mutationLog.push({type: 'textContent', value: text});
        if (typeof this.onDangerousWrite === 'function') {
          this.onDangerousWrite('textContent', text);
        }
      }
    }
  });
}

function getDangerousHtmlFixtureInitialHtml(props) {
  const html = props && props.dangerouslySetInnerHTML;
  if (
    html !== null &&
    typeof html === 'object' &&
    typeof html.__html === 'string'
  ) {
    return html.__html;
  }
  return '';
}

function getDangerousHtmlFixtureInitialText(props) {
  if (props == null || typeof props !== 'object') {
    return '';
  }
  const children = props.children;
  const childrenType = typeof children;
  if (childrenType === 'string' || childrenType === 'number') {
    return String(children);
  }
  return '';
}

function mountPrivateHostOutput(container, rootOwner, initialProps) {
  const host = container.ownerDocument.createElement('div');
  const text = container.ownerDocument.createTextNode(initialProps.children);
  const token = componentTree.createHostInstanceToken(
    {kind: 'PrivateRootHostOutputHost'},
    rootOwner
  );

  componentTree.attachHostInstanceNode(host, token, {});
  const propsHandoff = domHost.commitDomPropertyUpdateForLatestProps(
    host,
    'div',
    {},
    initialProps
  );
  componentTree.commitLatestPropsFromMutationHandoff(propsHandoff);
  domHost.appendInitialChild(host, text);
  domHost.appendChildToContainer(container, host);

  return {
    host,
    text,
    token
  };
}

function activeHostOutputAttributes(element) {
  return Array.from(element.attributes.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function activeHostOutputStyleProperties(element) {
  return Array.from(element.style.properties.entries())
    .filter(([, value]) => value !== '')
    .sort(([left], [right]) => left.localeCompare(right));
}

function assertNativeHandoff(handoff, expected) {
  assert.equal(Object.isFrozen(handoff), true);
  assert.equal(Object.isFrozen(handoff.nativeRequestRecord), true);
  assert.equal(handoff.$$typeof, rootBridge.privateRootNativeHandoffRecordType);
  assert.equal(
    handoff.kind,
    'FastReactDomPrivateRootNativeRequestHandoffRecord'
  );
  assert.equal(
    handoff.handoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(handoff.operation, expected.operation);
  assert.equal(handoff.handoffId, expected.handoffId);
  assert.equal(handoff.handoffSequence, expected.handoffSequence);
  assert.equal(handoff.sourceRequestId, expected.sourceRequestId);
  assert.equal(handoff.sourceRequestSequence, expected.sourceRequestSequence);
  assert.equal(handoff.sourceRequestType, expected.sourceRequestType);
  assert.equal(
    handoff.sourceLifecycleStatusBefore,
    expected.sourceLifecycleStatusBefore
  );
  assert.equal(
    handoff.sourceLifecycleStatusAfter,
    expected.sourceLifecycleStatusAfter
  );
  assert.equal(handoff.rootId, 'root:1');
  assert.equal(handoff.rootKind, rootBridge.CLIENT_ROOT_KIND);
  assert.equal(handoff.rootTag, rootBridge.CONCURRENT_ROOT_TAG);
  assert.equal(handoff.nativeExecution, false);
  assert.equal(handoff.reconcilerExecution, false);
  assert.equal(handoff.domMutation, false);
  assert.equal(handoff.markerWrites, false);
  assert.equal(handoff.listenerInstallation, false);
  assert.equal(handoff.hydration, false);
  assert.equal(handoff.eventDispatch, false);
  assert.equal(handoff.compatibilityClaimed, false);
}

function assertNativeRequestRecord(record, expected) {
  assert.equal(record.requestId, expected.requestId);
  assert.equal(record.kind, expected.kind);
  assert.equal(record.environmentId, 269);
  assert.equal(record.rootId, expected.rootValue);
  assert.equal(record.rootHandleState, expected.rootHandleState);
  assert.equal(Object.isFrozen(record.rootHandle), true);
  assert.deepEqual(record.rootHandle, {
    $$typeof: rootBridge.privateRootNativeBridgeHandleType,
    environmentId: 269,
    generation: 1,
    kind: rootBridge.NATIVE_ROOT_BRIDGE_HANDLE_ROOT,
    slot: expected.rootSlot
  });
  if (expected.valueSlot === null) {
    assert.equal(record.valueHandle, null);
  } else {
    assert.equal(Object.isFrozen(record.valueHandle), true);
    assert.deepEqual(record.valueHandle, {
      $$typeof: rootBridge.privateRootNativeBridgeHandleType,
      environmentId: 269,
      generation: 1,
      kind: rootBridge.NATIVE_ROOT_BRIDGE_HANDLE_VALUE,
      slot: expected.valueSlot
    });
  }
}

function assertHiddenNativePayload(handoff) {
  assert.equal(Object.keys(handoff).includes('sourceRecord'), false);
  assert.equal(Object.keys(handoff).includes('sourcePayload'), false);
  assert.equal(Object.keys(handoff).includes('value'), false);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('__mutationLog'), false);
  assert.equal(serialized.includes('__registrations'), false);
  assert.equal(serialized.includes('afterRootUpdate'), false);
}

function assertPrivatePublicFacadePreflightRecord(record, expected) {
  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    record.$$typeof,
    rootBridge.privateRootPublicFacadePreflightRecordType
  );
  assert.equal(
    record.kind,
    'FastReactDomPrivateRootPublicFacadePreflightRecord'
  );
  assert.equal(record.operation, expected.operation);
  assert.equal(record.facadeCall, expected.facadeCall);
  assert.equal(record.entrypoint, 'react-dom/client');
  assert.equal(record.preflightId, expected.preflightId);
  assert.equal(
    record.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED
  );
  assert.equal(record.executionStatus, rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED);
  assert.equal(
    record.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.equal(record.requestId, expected.requestId);
  assert.equal(record.requestType, expected.requestType);
  assert.equal(
    record.requestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    record.requestAdmission.admissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    record.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(record.nativeHandoffRecord.handoffId, expected.nativeHandoffId);
  assert.equal(
    record.nativeHandoffRecord.handoffStatus,
    rootBridge.ROOT_BRIDGE_NATIVE_HANDOFF_MIRRORED
  );
  assert.equal(
    record.nativeHandoffRecord.nativeRequestRecord.environmentId,
    427
  );
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      'private-root-bridge-request-admission',
      'private-native-request-handoff-mirror'
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      'public-root-execution',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'marker-writes',
      'listener-installation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(
    rootBridge.isPrivateRootPublicFacadePreflightRecord(record),
    true
  );
  assert.equal(record.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(record.publicCreateRootEnabled, false);
  assert.equal(record.publicHydrateRootEnabled, false);
  assert.equal(record.publicRootObjectExposed, false);
  assert.equal(record.publicRootCompatibilitySurface, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.rootScheduled, false);
  assert.equal(record.domMutation, false);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);
}

function assertPrivateHydrateRootPublicFacadePreflightRecord(record, expected) {
  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    record.$$typeof,
    rootBridge.privateHydrateRootPublicFacadePreflightRecordType
  );
  assert.equal(
    record.kind,
    'FastReactDomPrivateHydrateRootPublicFacadePreflightRecord'
  );
  assert.equal(record.operation, 'hydrate');
  assert.equal(record.facadeCall, 'hydrateRoot');
  assert.equal(record.entrypoint, 'react-dom/client');
  assert.equal(record.preflightId, expected.preflightId);
  assert.equal(
    record.preflightStatus,
    rootBridge.ROOT_BRIDGE_PUBLIC_FACADE_PREFLIGHT_ACCEPTED
  );
  assert.equal(record.executionStatus, rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED);
  assert.equal(
    record.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.equal(record.requestId, expected.requestId);
  assert.equal(record.requestType, 'hydrateRoot');
  assert.equal(record.hydrateId, expected.hydrateId);
  assert.equal(record.rootId, null);
  assert.equal(record.rootKind, 'unsupported-hydration');
  assert.equal(
    record.lifecycleStatusAfter,
    rootBridge.ROOT_LIFECYCLE_UNSUPPORTED_HYDRATION
  );
  assert.equal(record.status, 'unsupported');
  assert.equal(
    record.requestAdmissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(
    record.requestAdmission.admissionStatus,
    rootBridge.ROOT_BRIDGE_REQUEST_ADMITTED
  );
  assert.equal(record.nativeHandoffRecord, null);
  assert.equal(
    record.nativeHandoffStatus,
    rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED
  );
  assert.equal(
    record.nativeHandoffBlockedReason,
    'hydrate-root-records-are-diagnostic-only'
  );
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      'private-hydrate-root-bridge-request-admission',
      'hydrate-root-lifecycle-request-boundary',
      'unsupported-hydration-boundary-diagnostics',
      'hydrate-root-marker-listener-preflight-diagnostics',
      'hydrate-root-recoverable-error-preflight-diagnostics'
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      'public-hydrate-root-execution',
      'public-root-object',
      'native-request-handoff',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'marker-writes',
      'listener-installation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics,
    record.hydrationBoundaryRecord.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics.rootRecordId,
    record.hydrationBoundaryRecord.recordId
  );
  assert.equal(
    record.acceptedPrivateMetadataIds,
    record.acceptedPrivateMetadataDiagnostics.metadataIds
  );
  assert.equal(
    record.acceptedPrivateMetadataGateIds,
    record.acceptedPrivateMetadataDiagnostics.gateIds
  );
  assert.equal(
    record.markerListenerPreflightId,
    `${expected.preflightId}:marker-listener`
  );
  assert.equal(
    record.markerListenerPreflightStatus,
    rootBridge.ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED
  );
  assert.equal(record.markerListenerPreconditionsAccepted, true);
  assert.equal(record.markerListenerStateUnchanged, true);
  assertPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord(
    record.markerListenerPreflight,
    expected
  );
  assert.equal(
    Object.isFrozen(record.acceptedPrivateMetadataDiagnostics),
    true
  );
  assertHydrateRootAcceptedPrivateMetadataBlocked(
    record.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics.compatibilityClaimed,
    false
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics
      .publicHydrationCompatibilityClaimed,
    false
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics
      .publicHydrationReplayCompatibilityClaimed,
    false
  );
  assert.equal(
    record.acceptedPrivateMetadataDiagnostics
      .publicRootRenderCompatibilityClaimed,
    false
  );
  assert.equal(
    record.recoverableErrorPreflight.recoverableErrorMetadata,
    record.recoverableErrorMetadata
  );
  assert.equal(
    record.recoverableErrorPreflight.acceptedBoundaryMetadataDiagnostics,
    record.acceptedPrivateMetadataDiagnostics
  );
  assert.equal(
    record.recoverableErrorPreflightStatus,
    hydrationGate.privateHydrationTextMismatchRecoverableErrorPreflightStatus
  );
  assert.equal(record.recoverableErrorPreflightAccepted, true);
  assert.equal(record.recoverableErrorMetadataAccepted, true);
  assert.equal(record.recoverableErrorMetadataCount, 1);
  assert.equal(record.queuedRecoverableErrorCount, 0);
  assert.equal(record.wouldQueueRecoverableErrorCount, 1);
  assert.equal(record.recoverableErrorsQueued, false);
  assert.equal(record.willQueueRecoverableErrors, false);
  assert.equal(record.onRecoverableErrorConfigured, true);
  assert.equal(record.onRecoverableErrorInvoked, false);
  assert.equal(record.publicOnRecoverableErrorInvoked, false);
  assert.equal(record.rootErrorCallbackInvocationCount, 0);
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadePreflightRecord(record),
    true
  );
  assert.equal(record.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(record.hydrateRootRequestRecorded, true);
  assert.equal(record.hydrationRequested, true);
  assert.equal(record.canHydrate, false);
  assert.equal(record.publicRootCreated, false);
  assert.equal(record.publicRootObjectExposed, false);
  assert.equal(record.publicCreateRootEnabled, false);
  assert.equal(record.publicHydrateRootEnabled, false);
  assert.equal(record.publicRootCompatibilitySurface, false);
  assert.equal(record.containerMarked, false);
  assert.equal(record.listenersAttached, false);
  assert.equal(record.domMutated, false);
  assert.equal(record.eventsReplayed, false);
  assert.equal(record.rootScheduled, false);
  assert.equal(record.suspenseHydrationScheduled, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.domMutation, false);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.compatibilityClaimed, false);
}

function assertPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord(
  record,
  expected
) {
  assert.equal(Object.isFrozen(record), true);
  assert.equal(
    record.$$typeof,
    rootBridge
      .privateHydrateRootPublicFacadeMarkerListenerPreflightRecordType
  );
  assert.equal(
    record.kind,
    'FastReactDomPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord'
  );
  assert.equal(record.operation, 'hydrate-root-marker-listener-preflight');
  assert.equal(record.facadeCall, 'hydrateRoot');
  assert.equal(record.entrypoint, 'react-dom/client');
  assert.equal(record.preflightId, expected.preflightId);
  assert.equal(
    record.markerListenerPreflightId,
    `${expected.preflightId}:marker-listener`
  );
  assert.equal(
    record.preflightStatus,
    rootBridge.ROOT_BRIDGE_HYDRATE_ROOT_PUBLIC_FACADE_MARKER_LISTENER_PREFLIGHTED
  );
  assert.equal(record.executionStatus, rootBridge.ROOT_BRIDGE_EXECUTION_BLOCKED);
  assert.equal(
    record.compatibilityStatus,
    rootBridge.ROOT_BRIDGE_COMPATIBILITY_BLOCKED
  );
  assert.equal(record.requestId, expected.requestId);
  assert.equal(record.requestType, 'hydrateRoot');
  assert.equal(record.hydrateId, expected.hydrateId);
  assert.equal(record.rootId, null);
  assert.equal(record.rootKind, 'unsupported-hydration');
  assert.equal(
    record.markerGuard.action,
    'defer-mark-container-as-root-for-hydrate-root'
  );
  assert.equal(
    record.listenerGuard.action,
    'defer-listen-to-all-supported-events-for-hydrate-root'
  );
  assert.equal(record.preconditions.accepted, true);
  assert.equal(record.preconditions.stateUnchanged, true);
  assert.equal(record.preconditions.markerGuardMatchesContainerState, true);
  assert.equal(record.preconditions.listenerGuardMatchesContainerState, true);
  assert.equal(record.preconditions.hasLegacyRootMarker, false);
  assert.equal(record.preconditions.isContainerMarkedAsRoot, false);
  assert.equal(record.preconditions.rootMarkerPropertyCount, 0);
  assert.equal(record.preconditions.rootMarkerTruthyCount, 0);
  assert.equal(record.preconditions.canInstallRootListeners, true);
  assert.equal(record.preconditions.rootListeningMarkerPresent, false);
  assert.equal(record.preconditions.rootListeningMarkerPropertyCount, 0);
  assert.equal(
    record.preconditions.ownerDocumentCanInstallSelectionChange,
    true
  );
  assert.equal(
    record.preconditions.ownerDocumentListeningMarkerPresent,
    false
  );
  assert.equal(
    record.preconditions.ownerDocumentListeningMarkerPropertyCount,
    0
  );
  assert.equal(record.preconditions.rootListenerRegistrationCount, 0);
  assert.equal(
    record.preconditions.ownerDocumentListenerRegistrationCount,
    0
  );
  assert.equal(record.preconditions.rootMutationCount, 0);
  assert.equal(record.preconditions.ownerDocumentMutationCount, 0);
  assert.equal(record.blockerEvidence.rootMarkerWriteBlocked, true);
  assert.equal(record.blockerEvidence.rootListenerInstallationBlocked, true);
  assert.equal(
    record.blockerEvidence.hydrationMarkerConsumptionBlocked,
    true
  );
  assert.equal(record.blockerEvidence.eventReplayBlocked, true);
  assert.equal(record.blockerEvidence.recoverableErrorRoutingBlocked, true);
  assert.equal(record.blockerEvidence.publicHydrateRootBlocked, true);
  assert.equal(record.blockerEvidence.compatibilityClaimed, false);
  assert.deepEqual(
    record.acceptedCapabilities.map((capability) => capability.id),
    [
      'hydrate-root-marker-guard-snapshot',
      'hydrate-root-lifecycle-request-boundary-required',
      'hydrate-root-listener-guard-snapshot',
      'hydrate-root-marker-listener-state-unchanged'
    ]
  );
  assert.deepEqual(
    record.blockedCapabilities.map((capability) => capability.id),
    [
      'public-hydrate-root-execution',
      'public-root-object',
      'native-request-handoff',
      'native-execution',
      'reconciler-execution',
      'dom-mutation',
      'marker-writes',
      'listener-installation',
      'hydration',
      'events',
      'compatibility-claims'
    ]
  );
  assert.equal(
    rootBridge.isPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord(
      record
    ),
    true
  );
  assert.equal(record.acceptedPrivateBridgeDiagnostics, true);
  assert.equal(record.hydrateRootRequestRecorded, true);
  assert.equal(record.hydrationRequested, true);
  assert.equal(record.canHydrate, false);
  assert.equal(record.publicRootCreated, false);
  assert.equal(record.publicRootObjectExposed, false);
  assert.equal(record.publicCreateRootEnabled, false);
  assert.equal(record.publicHydrateRootEnabled, false);
  assert.equal(record.publicRootCompatibilitySurface, false);
  assert.equal(record.containerMarked, false);
  assert.equal(record.listenersAttached, false);
  assert.equal(record.domMutated, false);
  assert.equal(record.eventsReplayed, false);
  assert.equal(record.rootScheduled, false);
  assert.equal(record.suspenseHydrationScheduled, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.reconcilerExecution, false);
  assert.equal(record.domMutation, false);
  assert.equal(record.markerWrites, false);
  assert.equal(record.listenerInstallation, false);
  assert.equal(record.hydration, false);
  assert.equal(record.eventDispatch, false);
  assert.equal(record.recoverableErrorRouting, false);
  assert.equal(record.compatibilityClaimed, false);
}

function assertHydrateRootAcceptedPrivateMetadataBlocked(metadata) {
  for (const field of hydrateRootAcceptedPrivateMetadataBlockedPublicFields) {
    assert.equal(metadata[field], false, field);
  }

  assert.equal(Array.isArray(metadata.metadataRows), true);
  assert.equal(metadata.metadataRows.length, metadata.metadataIdCount);
  for (let index = 0; index < metadata.metadataRows.length; index++) {
    const row = metadata.metadataRows[index];
    assert.equal(row.metadataId, metadata.metadataIds[index]);
    assert.equal(row.gateId, metadata.gateIds[index]);
    assert.equal(row.recordType, metadata.acceptedRecordTypes[index]);
    assert.equal(row.acceptedStatus, metadata.acceptedStatuses[index]);
    assert.equal(row.metadataRecognized, true);
    assert.equal(row.diagnosticOnly, true);
    assert.equal(row.readOnly, true);
    for (
      const field of
        hydrateRootAcceptedPrivateMetadataRowBlockedPublicFields
    ) {
      assert.equal(row[field], false, field);
    }
  }
}

function assertHydrateRootPreflightRowsBlocked(rows) {
  const blockedBooleanFields = [
    'browserDomEventCompatibilityClaimed',
    'canHydrate',
    'compatibilityClaimed',
    'containerMarked',
    'domMutated',
    'domMutation',
    'eventDispatch',
    'eventReplayDispatchAttempted',
    'eventReplayInstalled',
    'eventReplaySupported',
    'eventsReplayed',
    'hydrateInstanceCalled',
    'hydrateTextInstanceCalled',
    'hydration',
    'hydrationReplaySupported',
    'listenerInstallation',
    'listenersAttached',
    'markerWrites',
    'nativeEventRedispatched',
    'onRecoverableErrorInvoked',
    'pluginDispatchEventForPluginEventSystemCalled',
    'publicDispatchEnabled',
    'publicHydrateRootEnabled',
    'publicHydrateRootSupported',
    'publicHydrationCompatibilityClaimed',
    'publicHydrationReplayCompatibilityClaimed',
    'publicHydrationTargetClaimed',
    'publicOnRecoverableErrorInvoked',
    'publicRootBehaviorChanged',
    'publicRootCompatibilitySurface',
    'publicRootCreated',
    'publicRootObjectExposed',
    'queueMutationAllowed',
    'queued',
    'recoverableErrorsQueued',
    'replayQueueDrained',
    'replayQueuesDrained',
    'rootScheduled',
    'suspenseHydrationScheduled',
    'syntheticEventCreated',
    'targetClaimExecuted',
    'targetDispatchExecuted',
    'willDispatch',
    'willDrainReplayQueues',
    'willHydrate',
    'willInvokeListeners',
    'willQueueRecoverableErrors',
    'willReplay'
  ];

  for (const row of rows) {
    assert.equal(Object.isFrozen(row), true);
    const rowLabel = row.kind || row.operation || row.status;
    for (const field of blockedBooleanFields) {
      if (Object.prototype.hasOwnProperty.call(row, field)) {
        assert.equal(row[field], false, `${rowLabel}.${field}`);
      }
    }
    if (Object.prototype.hasOwnProperty.call(row, 'listenerInvocationCount')) {
      assert.equal(row.listenerInvocationCount, 0, rowLabel);
    }
    if (
      Object.prototype.hasOwnProperty.call(
        row,
        'rootErrorCallbackInvocationCount'
      )
    ) {
      assert.equal(row.rootErrorCallbackInvocationCount, 0, rowLabel);
    }
  }
}

function assertBridgeDidNotTouchContainer(container, document) {
  assert.equal(
    rootMarkers.inspectContainerRootMarker(container).propertyCount,
    0
  );
  assert.equal(rootMarkers.isContainerMarkedAsRoot(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(container), false);
  assert.equal(listenerRegistry.hasListeningMarker(document), false);
  assert.equal(container.__registrations.length, 0);
  assert.equal(document.__registrations.length, 0);
  assert.equal(container.__mutationLog.length, 0);
  assert.equal(document.__mutationLog.length, 0);
}

function createRootBridgeControlledFakeDomRestoreExecution(options) {
  const trackerGate = resourceFormGate.createControlledInputValueTrackerGate({
    requestIdPrefix: `${options.scenarioId}-tracker`
  });
  const restoreGate =
    controlledRestoreQueue.createControlledInputPostEventRestoreQueueGate({
      requestIdPrefix: `${options.scenarioId}-restore`
    });
  const fakeTarget = {
    [resourceFormGate.controlledInputValueTrackerFakeDomTargetMarker]: true,
    ...options.fakeInitial
  };
  const install = trackerGate.installFakeDomTracker(
    {
      scenarioId: options.scenarioId,
      phaseId: 'post-event-execution',
      hostTag: options.hostTag,
      multiple: options.multiple === true,
      controlKind: options.controlKind,
      props: options.latestProps
    },
    {
      explicitAdmission: true,
      adapterKind: 'deterministic-fake-dom',
      targetKind: 'controlled-input-value-tracker',
      fakeTarget
    }
  );
  Object.assign(fakeTarget, options.fakeObserved);
  const observation = trackerGate.observeFakeDomTracker(install);
  const latestPropsLookup = createRootBridgeControlledLatestPropsLookup({
    label: options.scenarioId,
    latestProps: options.latestProps,
    nodeName: options.nodeName,
    registrationName: options.eventName === 'input' ? 'onInput' : 'onChange'
  });
  const intent =
    restoreGate.recordPostEventRestoreIntentFromFakeDomObservationLatestProps(
      observation,
      latestPropsLookup.lookupRecord,
      {
        explicitAdmission: true,
        queueKind:
          'deterministic-fake-dom-latest-props-post-event-restore-queue',
        queueId: `${options.scenarioId}-intent`,
        eventName: options.eventName,
        targetKind: 'controlled-input-post-event-restore-queue'
      }
    );
  const writePreflight = restoreGate.preflightRestoreQueueWrites([intent], {
    explicitAdmission: true,
    queueKind:
      'deterministic-controlled-input-post-event-restore-queue-write-preflight',
    queueId: `${options.scenarioId}-write-preflight`,
    targetKind: 'controlled-input-post-event-restore-queue-write-preflight'
  });
  const writeExecution = restoreGate.recordRestoreQueueWriteExecution(
    writePreflight,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-queue-write-execution',
      queueId: `${options.scenarioId}-write`,
      targetKind: 'controlled-input-post-event-restore-queue-write-execution'
    }
  );
  const flushBlocker = restoreGate.recordRestoreQueueFlushBlocker(
    writePreflight,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-queue-flush-blocker',
      queueId: `${options.scenarioId}-flush`,
      targetKind: 'controlled-input-post-event-restore-queue-flush-blocker'
    }
  );
  const wrapperIntent = restoreGate.recordRestoreQueueWrapperMutationIntent(
    writeExecution,
    flushBlocker,
    {
      explicitAdmission: true,
      queueKind:
        'deterministic-controlled-input-post-event-restore-wrapper-mutation-intent',
      queueId: `${options.scenarioId}-wrapper`,
      targetKind:
        'controlled-input-post-event-restore-wrapper-mutation-intent'
    }
  );
  const execution = restoreGate.recordFakeDomControlledRestoreExecution(
    latestPropsLookup.lookupRecord,
    intent,
    writeExecution,
    flushBlocker,
    wrapperIntent,
    {
      explicitAdmission: true,
      queueKind: 'deterministic-fake-dom-controlled-restore-execution',
      queueId: `${options.scenarioId}-execution`,
      targetKind: 'controlled-input-post-event-restore-fake-dom-execution',
      fakeDomTarget: fakeTarget
    }
  );

  return {
    execution,
    fakeTarget,
    flushBlocker,
    intent,
    latestPropsLookup,
    restoreGate,
    wrapperIntent,
    writeExecution
  };
}

function createRootBridgeControlledLatestPropsLookup(options) {
  const document = createDocument(`${options.label}-latest-props`);
  const targetNode = createElement(options.nodeName, document);
  const token = componentTree.createHostInstanceToken(
    {kind: `${options.label}:host`},
    {kind: `${options.label}:root`}
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

function isControlledRestoreLiveValueKey(property) {
  return (
    property === 'value' ||
    property === 'selectedValues' ||
    property === '_valueTracker'
  );
}

function createLiveRootContainerPreflightTarget(label) {
  const rawDocument = createDocument(`${label}-document`);
  const document = guardLiveRootPreflightTarget(
    rawDocument,
    `${label}-document`
  );
  rawDocument.ownerDocument = document;
  const rawContainer = createElement('DIV', document);
  const container = guardLiveRootPreflightTarget(
    rawContainer,
    `${label}-container`
  );
  return {container, document};
}

function guardLiveRootPreflightTarget(target, label) {
  function fail(operation) {
    throw new Error(`Unexpected live root preflight ${operation} on ${label}`);
  }

  target.addEventListener = function addEventListener() {
    fail('addEventListener');
  };
  target.removeEventListener = function removeEventListener() {
    fail('removeEventListener');
  };
  target.appendChild = function appendChild() {
    fail('appendChild');
  };
  target.insertBefore = function insertBefore() {
    fail('insertBefore');
  };
  target.removeChild = function removeChild() {
    fail('removeChild');
  };
  target.createElement = function createElement() {
    fail('createElement');
  };
  target.createTextNode = function createTextNode() {
    fail('createTextNode');
  };
  Object.defineProperty(target, 'textContent', {
    configurable: true,
    enumerable: true,
    get() {
      return '';
    },
    set() {
      fail('textContent write');
    }
  });

  return new Proxy(target, {
    defineProperty(source, property, descriptor) {
      if (isLiveRootPreflightWriteKey(property)) {
        fail(`define ${String(property)}`);
      }
      return Reflect.defineProperty(source, property, descriptor);
    },
    deleteProperty(source, property) {
      if (isLiveRootPreflightWriteKey(property)) {
        fail(`delete ${String(property)}`);
      }
      return Reflect.deleteProperty(source, property);
    },
    set(source, property, value, receiver) {
      if (isLiveRootPreflightWriteKey(property)) {
        fail(`write ${String(property)}`);
      }
      return Reflect.set(source, property, value, receiver);
    }
  });
}

function isLiveRootPreflightWriteKey(property) {
  const key = String(property);
  return (
    key.startsWith('__reactContainer$') ||
    key.startsWith('__reactEvents$') ||
    key.startsWith('_reactListening')
  );
}

function createHostOutputDocument(label) {
  return new HostOutputDocument(label);
}

class HostOutputEventTarget {
  constructor(fields) {
    Object.assign(this, fields);
    this.__mutationLog = [];
    this.__removals = [];
    this.__registrations = [];
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({
      listener,
      options,
      type
    });
  }

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
    this.__removals.push({
      listener,
      options,
      type
    });
  }
}

class HostOutputDocument extends HostOutputEventTarget {
  constructor(label) {
    super({
      label,
      nodeName: '#document',
      nodeType: DOCUMENT_NODE
    });
    this.ownerDocument = this;
    this.defaultView = new HostOutputEventTarget({
      label: `${label}-window`
    });
  }

  createElement(nodeName) {
    return new HostOutputElement(String(nodeName), this);
  }

  createTextNode(text) {
    return new HostOutputText(text, this);
  }
}

class HostOutputNode extends HostOutputEventTarget {
  constructor(nodeName, nodeType, ownerDocument) {
    super({
      nodeName,
      nodeType,
      ownerDocument
    });
    this.childNodes = [];
    this.parentNode = null;
    this._textContent = '';
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }

  get textContent() {
    if (this.childNodes.length === 0) {
      return this._textContent;
    }
    return this.childNodes.map((child) => child.textContent).join('');
  }

  set textContent(value) {
    for (const child of [...this.childNodes]) {
      detachHostOutputChild(child);
    }
    this._textContent = String(value);
    this.__mutationLog.push({type: 'textContent', value: String(value)});
  }

  appendChild(child) {
    assertHostOutputChild(child);
    assertHostOutputCanAcceptChild(this, child);
    detachHostOutputChild(child);
    this.childNodes.push(child);
    child.parentNode = this;
    this.__mutationLog.push({child, type: 'appendChild'});
    return child;
  }

  insertBefore(child, beforeChild) {
    assertHostOutputChild(child);
    assertHostOutputCanAcceptChild(this, child);
    if (beforeChild.parentNode !== this) {
      throw new Error('Host-output insert target is not a child.');
    }
    if (child === beforeChild) {
      return child;
    }
    detachHostOutputChild(child);
    const insertionIndex = this.childNodes.indexOf(beforeChild);
    this.childNodes.splice(insertionIndex, 0, child);
    child.parentNode = this;
    this.__mutationLog.push({beforeChild, child, type: 'insertBefore'});
    return child;
  }

  removeChild(child) {
    if (child.parentNode !== this) {
      throw new Error('Host-output remove target is not a child.');
    }
    detachHostOutputChild(child);
    this.__mutationLog.push({child, type: 'removeChild'});
    return child;
  }
}

class HostOutputElement extends HostOutputNode {
  constructor(nodeName, ownerDocument) {
    super(nodeName, ELEMENT_NODE, ownerDocument);
    this.attributes = new Map();
    this.attributeLog = [];
    this.styleLog = [];
    this.style = new HostOutputStyle(this);
  }

  setAttribute(name, value) {
    const attributeName = String(name);
    const stringValue = String(value);
    this.attributeLog.push(['setAttribute', attributeName, stringValue]);
    this.attributes.set(attributeName, stringValue);
  }

  removeAttribute(name) {
    const attributeName = String(name);
    this.attributeLog.push([
      'removeAttribute',
      attributeName,
      this.attributes.has(attributeName)
    ]);
    this.attributes.delete(attributeName);
  }

  getAttribute(name) {
    const attributeName = String(name);
    return this.attributes.has(attributeName)
      ? this.attributes.get(attributeName)
      : null;
  }

  hasAttribute(name) {
    return this.attributes.has(String(name));
  }
}

class HostOutputStyle {
  constructor(ownerElement) {
    this.ownerElement = ownerElement;
    this.properties = new Map();

    return new Proxy(this, {
      set(target, property, value, receiver) {
        if (shouldRecordHostOutputStyleProperty(property)) {
          const stringValue = String(value);
          target.properties.set(property, stringValue);
          target.ownerElement.styleLog.push([
            'stylePropertyAssignment',
            property,
            stringValue
          ]);
        }
        return Reflect.set(target, property, value, receiver);
      }
    });
  }

  setProperty(name, value) {
    const propertyName = String(name);
    const stringValue = String(value);
    this.properties.set(propertyName, stringValue);
    this.ownerElement.styleLog.push([
      'styleSetProperty',
      propertyName,
      stringValue
    ]);
  }
}

function shouldRecordHostOutputStyleProperty(property) {
  return (
    typeof property === 'string' &&
    !property.startsWith('_') &&
    !['ownerElement', 'properties', 'setProperty'].includes(property)
  );
}

class HostOutputText extends HostOutputNode {
  constructor(text, ownerDocument) {
    super('#text', TEXT_NODE, ownerDocument);
    this._data = String(text);
    this.writeLog = [];
  }

  get data() {
    return this._data;
  }

  set data(value) {
    const text = String(value);
    this.writeLog.push(['data', text]);
    this._data = text;
  }

  get nodeValue() {
    return this._data;
  }

  set nodeValue(value) {
    const text = String(value);
    this.writeLog.push(['nodeValue', text]);
    this._data = text;
  }

  get textContent() {
    return this._data;
  }

  set textContent(value) {
    const text = String(value);
    this.writeLog.push(['textContent', text]);
    this._data = text;
  }
}

function assertHostOutputChild(child) {
  if (child === null || typeof child !== 'object') {
    throw new Error('Host-output child must be a node.');
  }
}

function assertHostOutputCanAcceptChild(parent, child) {
  let current = parent;
  while (current !== null) {
    if (current === child) {
      throw new Error('Host-output cannot insert an ancestor.');
    }
    current = current.parentNode;
  }
}

function detachHostOutputChild(child) {
  if (child.parentNode === null) {
    return;
  }
  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

function createFocusBlurNativeEvent(type, target) {
  return {
    defaultPrevented: false,
    preventDefaultCallCount: 0,
    returnValue: true,
    stopPropagationCallCount: 0,
    target,
    type,
    preventDefault() {
      this.defaultPrevented = true;
      this.preventDefaultCallCount++;
      this.returnValue = false;
    },
    stopPropagation() {
      this.stopPropagationCallCount++;
    }
  };
}

function createDocument(label) {
  const document = createEventTarget({
    label,
    nodeName: '#document',
    nodeType: DOCUMENT_NODE
  });
  document.ownerDocument = document;
  document.defaultView = createEventTarget({label: `${label}-window`});
  document.createElement = function createFakeElement(tagName) {
    const nodeName = String(tagName).toUpperCase();
    this.__mutationLog.push({
      nodeName,
      type: 'createElement'
    });
    return createElement(nodeName, this);
  };
  document.createTextNode = function createFakeTextNode(text) {
    const value = String(text);
    this.__mutationLog.push({
      type: 'createTextNode',
      value
    });
    return createTextNode(value, this);
  };
  return document;
}

function createElement(nodeName, ownerDocument) {
  return createEventTarget({
    nodeName,
    nodeType: ELEMENT_NODE,
    ownerDocument
  });
}

function createTextNode(text, ownerDocument) {
  const target = createEventTarget({
    nodeName: '#text',
    nodeType: TEXT_NODE,
    ownerDocument
  });
  let textValue = String(text);
  target.writeLog = [];
  Object.defineProperties(target, {
    data: {
      configurable: true,
      enumerable: true,
      get() {
        return textValue;
      },
      set(value) {
        textValue = String(value);
        this.writeLog.push(['data', textValue]);
      }
    },
    nodeValue: {
      configurable: true,
      enumerable: true,
      get() {
        return textValue;
      },
      set(value) {
        textValue = String(value);
        this.writeLog.push(['nodeValue', textValue]);
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        return textValue;
      },
      set(value) {
        textValue = String(value);
        this.writeLog.push(['textContent', textValue]);
      }
    }
  });
  return target;
}

function createCommentNode(data, ownerDocument) {
  return createEventTarget({
    data,
    nodeName: '#comment',
    nodeType: COMMENT_NODE,
    ownerDocument
  });
}

function createEventTarget(fields) {
  const target = {
    ...fields,
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    __mutationLog: [],
    __removals: [],
    __registrations: [],
    mutationLog: [],
    parentNode: null,
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
      this.__removals.push({
        listener,
        options,
        type
      });
    },
    appendChild(child) {
      detachChildFromParent(child);
      this.childNodes.push(child);
      child.parentNode = this;
      this.__mutationLog.push({child, type: 'appendChild'});
      this.mutationLog.push(['appendChild', child.nodeName]);
      return child;
    },
    insertBefore(child, beforeChild) {
      if (beforeChild.parentNode !== this) {
        throw new Error('Cannot insert before a child from another parent.');
      }
      detachChildFromParent(child);
      const index = this.childNodes.indexOf(beforeChild);
      this.childNodes.splice(index, 0, child);
      child.parentNode = this;
      this.__mutationLog.push({beforeChild, child, type: 'insertBefore'});
      this.mutationLog.push([
        'insertBefore',
        child.nodeName,
        beforeChild.nodeName
      ]);
      return child;
    },
    removeChild(child) {
      if (child.parentNode !== this) {
        throw new Error('Cannot remove a child from another parent.');
      }
      detachChildFromParent(child);
      this.__mutationLog.push({child, type: 'removeChild'});
      this.mutationLog.push(['removeChild', child.nodeName]);
      return child;
    },
    setAttribute(name, value) {
      const attributeName = String(name);
      const stringValue = String(value);
      this.attributes.set(attributeName, stringValue);
      this.attributeLog.push(['setAttribute', attributeName, stringValue]);
    },
    removeAttribute(name) {
      const attributeName = String(name);
      const hadAttribute = this.attributes.has(attributeName);
      this.attributes.delete(attributeName);
      this.attributeLog.push(['removeAttribute', attributeName, hadAttribute]);
    },
    hasAttribute(name) {
      return this.attributes.has(String(name));
    },
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    }
  };
  let textContent = '';
  Object.defineProperties(target, {
    firstChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[0] || null;
      }
    },
    lastChild: {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes[this.childNodes.length - 1] || null;
      }
    },
    textContent: {
      configurable: true,
      enumerable: true,
      get() {
        if (this.childNodes.length > 0) {
          return this.childNodes.map((child) => child.textContent).join('');
        }
        return textContent;
      },
      set(value) {
        for (const child of [...this.childNodes]) {
          detachChildFromParent(child);
        }
        textContent = String(value);
        this.__mutationLog.push({type: 'textContent', value});
        this.mutationLog.push(['textContent', textContent]);
      }
    }
  });
  return target;
}

function detachChildFromParent(child) {
  if (child == null || typeof child !== 'object') {
    throw new Error('Expected a fake-DOM child object.');
  }
  if (child.parentNode === null || child.parentNode === undefined) {
    child.parentNode = null;
    return;
  }

  const siblings = child.parentNode.childNodes;
  const index = siblings.indexOf(child);
  if (index !== -1) {
    siblings.splice(index, 1);
  }
  child.parentNode = null;
}

function attributeEntries(node) {
  return [...node.attributes.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function installPublicObservableFakeDom(document) {
  const createElement = document.createElement;
  const createTextNode = document.createTextNode;

  document.createElement = function createPublicObservableElement(tagName) {
    return decoratePublicObservableNode(createElement.call(this, tagName));
  };
  document.createTextNode = function createPublicObservableTextNode(text) {
    return decoratePublicObservableNode(createTextNode.call(this, text));
  };

  return function restorePublicObservableFakeDom() {
    document.createElement = createElement;
    document.createTextNode = createTextNode;
  };
}

function decoratePublicObservableNode(node) {
  if (node == null || typeof node !== 'object') {
    return node;
  }
  if (!Object.prototype.hasOwnProperty.call(node, 'children')) {
    Object.defineProperty(node, 'children', {
      configurable: true,
      enumerable: true,
      get() {
        return this.childNodes.filter(
          (child) => child.nodeType === ELEMENT_NODE
        );
      }
    });
  }
  if (!Object.prototype.hasOwnProperty.call(node, 'firstElementChild')) {
    Object.defineProperty(node, 'firstElementChild', {
      configurable: true,
      enumerable: true,
      get() {
        return this.children[0] || null;
      }
    });
  }
  if (!Object.prototype.hasOwnProperty.call(node, 'innerHTML')) {
    Object.defineProperty(node, 'innerHTML', {
      configurable: true,
      enumerable: true,
      get() {
        if (this.childNodes.length > 0) {
          return this.childNodes.map(serializePublicObservableNode).join('');
        }
        return escapePublicObservableText(this.textContent);
      }
    });
  }
  if (
    node.nodeType === ELEMENT_NODE &&
    !Object.prototype.hasOwnProperty.call(node, 'tagName')
  ) {
    Object.defineProperty(node, 'tagName', {
      configurable: true,
      enumerable: true,
      get() {
        return this.nodeName;
      }
    });
  }
  return node;
}

function serializePublicObservableNode(node) {
  if (node?.nodeType === TEXT_NODE) {
    return escapePublicObservableText(node.textContent);
  }
  if (node?.nodeType === ELEMENT_NODE) {
    const tagName = String(node.nodeName).toLowerCase();
    return `<${tagName}${serializePublicObservableAttributes(node)}>${node.innerHTML}</${tagName}>`;
  }
  return '';
}

function serializePublicObservableAttributes(node) {
  if (!(node.attributes instanceof Map) || node.attributes.size === 0) {
    return '';
  }
  return [...node.attributes.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([name, value]) =>
        ` ${name}="${escapePublicObservableAttributeValue(String(value))}"`
    )
    .join('');
}

function escapePublicObservableText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapePublicObservableAttributeValue(value) {
  return escapePublicObservableText(value).replaceAll('"', '&quot;');
}

function assertPublicCreateRootMinimalHostOutput(document) {
  const restorePublicObservableFakeDom =
    installPublicObservableFakeDom(document);

  try {
    const container = document.createElement('div');
    const root = reactDomClient.createRoot(container);
    const escapedPublicId = 'app&<>"';

    assert.deepEqual(Object.keys(root), ['render', 'unmount']);
    assert.equal(root.render.length, 1);
    assert.equal(root.unmount.length, 0);
    assert.equal(
      root.render(
        React.createElement('div', {id: escapedPublicId}, 'hello & < >')
      ),
      undefined
    );
    assert.equal(container.childNodes.length, 1);
    assert.equal(container.children.length, 1);
    assert.equal(container.firstElementChild, container.firstChild);
    assert.equal(container.firstChild.nodeName, 'DIV');
    assert.equal(container.firstChild.tagName, 'DIV');
    assert.equal(container.firstChild.getAttribute('id'), escapedPublicId);
    assert.deepEqual(attributeEntries(container.firstChild), [
      ['id', escapedPublicId]
    ]);
    assert.equal(container.firstChild.textContent, 'hello & < >');
    assert.equal(container.firstChild.innerHTML, 'hello &amp; &lt; &gt;');
    assert.equal(container.textContent, 'hello & < >');
    assert.equal(
      container.innerHTML,
      '<div id="app&amp;&lt;&gt;&quot;">hello &amp; &lt; &gt;</div>'
    );
    const hostNode = container.firstChild;
    assert.equal(
      root.render(
        React.createElement('div', {id: escapedPublicId}, 'again & < >')
      ),
      undefined
    );
    assert.equal(container.childNodes.length, 1);
    assert.equal(container.children.length, 1);
    assert.equal(container.firstElementChild, hostNode);
    assert.equal(container.firstChild, hostNode);
    assert.equal(container.firstChild.getAttribute('id'), escapedPublicId);
    assert.deepEqual(attributeEntries(container.firstChild), [
      ['id', escapedPublicId]
    ]);
    assert.equal(container.firstChild.textContent, 'again & < >');
    assert.equal(container.firstChild.innerHTML, 'again &amp; &lt; &gt;');
    assert.equal(container.textContent, 'again & < >');
    assert.equal(
      container.innerHTML,
      '<div id="app&amp;&lt;&gt;&quot;">again &amp; &lt; &gt;</div>'
    );
    assert.equal(root.unmount(), undefined);
    assert.equal(container.childNodes.length, 0);
    assert.equal(container.children.length, 0);
    assert.equal(container.firstElementChild, null);
    assert.equal(container.textContent, '');
    assert.equal(container.innerHTML, '');
    assert.throws(
      () => root.render(React.createElement('div', null, 'stale')),
      {
        code: 'FAST_REACT_UNIMPLEMENTED',
        entrypoint: 'react-dom/client',
        exportName: 'createRoot().render'
      }
    );
    assert.equal(root.unmount(), undefined);
    assert.equal(container.childNodes.length, 0);
    assert.equal(container.children.length, 0);
    assert.equal(container.firstElementChild, null);
    assert.equal(container.textContent, '');
    assert.equal(container.innerHTML, '');
    const recreatedRoot = reactDomClient.createRoot(container);
    assert.equal(
      recreatedRoot.render(React.createElement('div', null, 42)),
      undefined
    );
    assert.equal(container.childNodes.length, 1);
    assert.equal(container.children.length, 1);
    assert.equal(container.firstElementChild, container.firstChild);
    assert.equal(container.textContent, '42');
    assert.equal(container.innerHTML, '<div>42</div>');
    assert.equal(recreatedRoot.unmount(), undefined);
    assert.equal(container.childNodes.length, 0);
    assert.equal(container.children.length, 0);
    assert.equal(container.firstElementChild, null);
    assert.equal(container.innerHTML, '');
  } finally {
    restorePublicObservableFakeDom();
  }
}

module.exports = {
  assert,
  path,
  test,
  React,
  packageRoot,
  reactDom,
  reactDomClient,
  resourceFormGate,
  controlledRestoreQueue,
  rootBridge,
  hydrationGate,
  componentTree,
  createDangerousHtmlTextResetDiagnostic,
  refCallbackGate,
  domHost,
  rootMarkers,
  listenerRegistry,
  eventListener,
  eventSystemFlags,
  rootListeners,
  pluginEventSystem,
  COMMENT_NODE,
  DOCUMENT_NODE,
  ELEMENT_NODE,
  TEXT_NODE,
  describeContainer,
  hydrateRootAcceptedPrivateMetadataBlockedPublicFields,
  hydrateRootAcceptedPrivateMetadataRowBlockedPublicFields,
  assertHydrateRootTamperedEventReplayMetadataRejected,
  assertHydrateRootTamperedAcceptedMetadataRejected,
  assertHydrateRootTamperedMarkerListenerGuardRejected,
  createAcceptedPrivateMetadataRow,
  createHostOutputProps,
  createHostOutputAttributeStyleProps,
  createRootWorkLoopFinishedWorkMetadata,
  createRootCommitHostComponentUpdateRecord,
  createRootCommitHostTextUpdateRecord,
  createRootCommitPropertyTextFixture,
  cleanupRootCommitPropertyTextFixture,
  createDangerousHtmlTextResetExecutionFixture,
  cleanupDangerousHtmlTextResetExecutionFixture,
  installDangerousHtmlTextResetAccessors,
  getDangerousHtmlFixtureInitialHtml,
  getDangerousHtmlFixtureInitialText,
  mountPrivateHostOutput,
  activeHostOutputAttributes,
  activeHostOutputStyleProperties,
  assertNativeHandoff,
  assertNativeRequestRecord,
  assertHiddenNativePayload,
  assertPrivatePublicFacadePreflightRecord,
  assertPrivateHydrateRootPublicFacadePreflightRecord,
  assertPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord,
  assertHydrateRootAcceptedPrivateMetadataBlocked,
  assertHydrateRootPreflightRowsBlocked,
  assertBridgeDidNotTouchContainer,
  createRootBridgeControlledFakeDomRestoreExecution,
  createRootBridgeControlledLatestPropsLookup,
  isControlledRestoreLiveValueKey,
  createLiveRootContainerPreflightTarget,
  guardLiveRootPreflightTarget,
  isLiveRootPreflightWriteKey,
  createHostOutputDocument,
  HostOutputEventTarget,
  HostOutputDocument,
  HostOutputNode,
  HostOutputElement,
  HostOutputStyle,
  shouldRecordHostOutputStyleProperty,
  HostOutputText,
  assertHostOutputChild,
  assertHostOutputCanAcceptChild,
  detachHostOutputChild,
  createFocusBlurNativeEvent,
  createDocument,
  createElement,
  createTextNode,
  createCommentNode,
  createEventTarget,
  detachChildFromParent,
  attributeEntries,
  assertPublicCreateRootMinimalHostOutput
};
