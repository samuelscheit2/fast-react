import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

const componentTree = require(
  path.join(repoRoot, 'packages/react-dom/src/client/component-tree.js')
);
const refCallbackGate = require(
  path.join(repoRoot, 'packages/react-dom/src/client/ref-callback-gate.js')
);
const domContainer = require(
  path.join(repoRoot, 'packages/react-dom/src/client/dom-container.js')
);
const domHost = require(
  path.join(repoRoot, 'packages/react-dom/src/dom-host/index.js')
);
const rootMarkers = require(
  path.join(repoRoot, 'packages/react-dom/src/client/root-markers.js')
);
const reactDom = require(path.join(repoRoot, 'packages/react-dom/index.js'));
const reactDomClient = require(
  path.join(repoRoot, 'packages/react-dom/client.js')
);
const reactDomPackage = require(
  path.join(repoRoot, 'packages/react-dom/package.json')
);

{
  const rootOwner = {kind: 'FastReactDomRootOwner'};
  const hostOwner = {kind: 'FastReactDomHostOwner'};
  const node = createElement('BUTTON');
  const props = {
    disabled: false,
    onClick() {
      return 'initial';
    }
  };

  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  assert.equal(componentTree.isHostInstanceToken(token), true);
  assert.deepEqual(Object.keys(token), []);

  assert.equal(
    componentTree.attachHostInstanceNode(node, token, props),
    token
  );
  assert.equal(componentTree.getHostInstanceTokenFromNode(node), token);
  assert.equal(componentTree.getMountedHostInstanceTokenFromNode(node), token);
  assert.equal(componentTree.getAttachedNodeFromHostInstanceToken(token), node);
  assert.equal(componentTree.getMountedHostInstanceNodeFromToken(token), node);
  assert.equal(componentTree.assertMountedHostInstanceToken(token), node);
  assert.equal(componentTree.getHostInstanceOwnerFromToken(token), hostOwner);
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(token),
    rootOwner
  );
  assert.equal(componentTree.getHostInstanceOwnerFromNode(node), hostOwner);
  assert.equal(componentTree.getRootOwnerFromNode(node), rootOwner);
  assert.equal(componentTree.getLatestPropsFromNode(node), props);

  const nextProps = {
    disabled: true,
    onClick() {
      return 'updated';
    }
  };
  assert.equal(
    componentTree.updateLatestPropsForNode(node, nextProps),
    nextProps
  );
  assert.equal(componentTree.getLatestPropsFromNode(node), nextProps);
  assert.equal(
    componentTree.getLatestPropsFromHostInstanceToken(token),
    nextProps
  );

  const tokenProps = {
    disabled: false,
    onClick() {
      return 'token updated';
    }
  };
  assert.equal(
    componentTree.updateLatestPropsForHostInstanceToken(token, tokenProps),
    tokenProps
  );
  assert.equal(componentTree.getLatestPropsFromNode(node), tokenProps);

  let eventCallCount = 0;
  const handoffProps = {
    id: 'from-handoff',
    children: 'Handoff label',
    onClick() {
      eventCallCount += 1;
    }
  };
  const handoff = domHost.commitDomPropertyUpdateForLatestProps(
    node,
    'button',
    tokenProps,
    handoffProps
  );
  const hiddenHandoff =
    domHost.getDomPropertyUpdateLatestPropsHandoffPayload(handoff);

  assert.equal(
    handoff.kind,
    domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF
  );
  assert.equal(handoff.mutation, 'propertyUpdate');
  assert.equal(handoff.payloadCount, 4);
  assert.equal(handoff.status, 'mutated');
  assert.equal(Object.hasOwn(handoff, 'node'), false);
  assert.equal(Object.hasOwn(handoff, 'latestProps'), false);
  assert.equal(domHost.isDomPropertyUpdateLatestPropsHandoff(handoff), true);
  assert.equal(
    domHost.isLatestPropsCommitRecord(hiddenHandoff.latestPropsCommitRecord),
    true
  );
  assert.deepEqual(hiddenHandoff.mutationRecords, [
    removeAttributePayloadRecord('disabled'),
    setAttributePayloadRecord('id', 'from-handoff'),
    skippedNonPayload(
      'children',
      'children',
      'children are handled by text-content reconciliation'
    ),
    skippedNonPayload(
      'onClick',
      'event',
      'event props are stored by the future event/latest-props path'
    )
  ]);
  assert.deepEqual(node.attributeLog, [
    ['removeAttribute', 'disabled', false],
    ['setAttribute', 'id', 'from-handoff']
  ]);
  assert.equal(componentTree.getLatestPropsFromNode(node), tokenProps);
  assert.equal(
    componentTree.commitLatestPropsFromMutationHandoff(handoff),
    handoffProps
  );
  assert.equal(componentTree.getLatestPropsFromNode(node), handoffProps);

  const recordProps = {
    disabled: true,
    id: 'from-record',
    onClick() {
      eventCallCount += 1;
    }
  };
  const record = domHost.createLatestPropsCommitRecord(node, recordProps, [
    setAttributePayload('id', 'id', 'from-record'),
    removeAttributePayload('disabled', 'disabled'),
    nonPayload('onClick', 'event')
  ]);
  const hiddenPayload = domHost.getLatestPropsCommitRecordPayload(record);

  assert.equal(record.kind, domHost.LATEST_PROPS_COMMIT_RECORD);
  assert.equal(record.payloadCount, 3);
  assert.equal(record.status, 'safe-for-latest-props');
  assert.deepEqual(Object.keys(record), ['kind', 'payloadCount', 'status']);
  assert.equal(Object.hasOwn(record, 'node'), false);
  assert.equal(Object.hasOwn(record, 'latestProps'), false);
  assert.equal(domHost.isLatestPropsCommitRecord(record), true);
  assert.equal(hiddenPayload.node, node);
  assert.equal(hiddenPayload.latestProps, recordProps);
  assert.equal(Object.isFrozen(hiddenPayload.payloadRecords), true);
  assert.equal(
    componentTree.commitLatestPropsFromMutationRecord(record),
    recordProps
  );
  assert.equal(componentTree.getLatestPropsFromNode(node), recordProps);
  assert.equal(
    componentTree.getLatestPropsFromHostInstanceToken(token),
    recordProps
  );
  const hostNodeRecord =
    componentTree.createMountedHostInstanceNodeRecord(token);
  const hostNodePayload =
    componentTree.getPrivateHostInstanceNodeRecordPayload(hostNodeRecord);
  assert.equal(
    componentTree.isPrivateHostInstanceNodeRecord(hostNodeRecord),
    true
  );
  assert.equal(
    hostNodeRecord.$$typeof,
    componentTree.privateHostInstanceNodeRecordType
  );
  assert.equal(
    hostNodeRecord.kind,
    componentTree.HOST_INSTANCE_NODE_RECORD_KIND
  );
  assert.equal(hostNodeRecord.status, 'mounted-host-instance-node');
  assert.equal(hostNodeRecord.hostInstanceToken, token);
  assert.equal(hostNodeRecord.hostOwner, hostOwner);
  assert.equal(hostNodeRecord.rootOwner, rootOwner);
  assert.equal(hostNodeRecord.latestPropsStatus, 'present');
  assert.equal(hostNodeRecord.latestRefStatus, 'missing');
  assert.equal(hostNodeRecord.exposesHostNode, false);
  assert.equal(hostNodeRecord.exposesLatestProps, false);
  assert.equal(Object.hasOwn(hostNodeRecord, 'node'), false);
  assert.equal(Object.hasOwn(hostNodeRecord, 'latestProps'), false);
  assert.equal(hostNodePayload.node, node);
  assert.equal(hostNodePayload.token, token);
  assert.equal(hostNodePayload.latestProps, recordProps);
  assert.equal(hostNodePayload.hasLatestRef, false);
  assert.equal(eventCallCount, 0);
  assert.equal(
    componentTree.detachHostInstanceToken(token),
    token
  );
  assert.equal(componentTree.getMountedHostInstanceNodeFromToken(token), null);
  assert.equal(componentTree.getHostInstanceTokenFromNode(node), null);
  assert.equal(componentTree.getLatestPropsFromNode(node), null);
}

{
  const rootOwner = {kind: 'RootForText'};
  const hostOwner = {kind: 'TextHost'};
  const textNode = createTextNode('hello');
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);

  assert.equal(componentTree.isHostInstanceNode(textNode), true);
  assert.equal(componentTree.getMountedHostInstanceNodeFromToken(token), null);
  assert.throws(
    () => componentTree.updateLatestPropsForHostInstanceToken(token, {}),
    {
      code: 'FAST_REACT_DOM_UNMOUNTED_HOST_INSTANCE_TOKEN'
    }
  );
  componentTree.attachHostInstanceNode(textNode, token, null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(componentTree.detachHostInstanceNode(textNode), token);
  assert.equal(componentTree.getHostInstanceTokenFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromHostInstanceToken(token), null);
  assert.equal(componentTree.getAttachedNodeFromHostInstanceToken(token), null);
  assert.equal(componentTree.getHostInstanceOwnerFromToken(token), null);
  assert.equal(
    componentTree.getRootOwnerFromHostInstanceToken(token),
    null
  );
  assert.equal(
    textNode[componentTree.internalHostInstanceTokenKey],
    undefined
  );
  assert.equal(textNode[componentTree.internalLatestPropsKey], undefined);

  assert.throws(
    () => componentTree.attachHostInstanceNode(createElement('SPAN'), token, {}),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_INSTANCE_TOKEN'
    }
  );
  assert.throws(
    () => componentTree.updateLatestPropsForHostInstanceToken(token, {}),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_INSTANCE_TOKEN'
    }
  );
}

{
  const rootOwner = {kind: 'SubtreeDetachRoot'};
  const hostOwner = {kind: 'SubtreeDetachHost'};
  const textOwner = {kind: 'SubtreeDetachText'};
  const hostNode = createElement('DIV');
  const textNode = createTextNode('subtree');
  const hostToken = componentTree.createHostInstanceToken(
    hostOwner,
    rootOwner
  );
  const textToken = componentTree.createHostInstanceToken(
    textOwner,
    rootOwner
  );

  appendChild(hostNode, textNode);
  componentTree.attachHostInstanceNode(hostNode, hostToken, {id: 'subtree'});
  componentTree.attachHostInstanceNode(textNode, textToken, null);

  assert.equal(componentTree.getRootOwnerFromNode(hostNode), rootOwner);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), rootOwner);
  assert.equal(componentTree.detachHostInstanceSubtree(hostNode), 2);
  assert.equal(componentTree.getRootOwnerFromNode(hostNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(hostNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(componentTree.detachHostInstanceSubtree(hostNode), 0);
}

{
  const rootOwner = {kind: 'WrongNodeRoot'};
  const hostOwner = {kind: 'WrongNodeHost'};
  const ownedNode = createElement('DIV');
  const wrongNode = createElement('DIV');
  const props = {id: 'owned'};
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);

  componentTree.attachHostInstanceNode(ownedNode, token, props);
  wrongNode[componentTree.internalHostInstanceTokenKey] = token;
  wrongNode[componentTree.internalLatestPropsKey] = {id: 'wrong'};

  assert.equal(componentTree.getHostInstanceTokenFromNode(wrongNode), null);
  assert.equal(componentTree.getHostInstanceOwnerFromNode(wrongNode), null);
  assert.equal(componentTree.getRootOwnerFromNode(wrongNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(wrongNode), null);
  assert.equal(componentTree.detachHostInstanceNode(wrongNode), null);
  assert.equal(
    wrongNode[componentTree.internalHostInstanceTokenKey],
    undefined
  );
  assert.equal(wrongNode[componentTree.internalLatestPropsKey], undefined);

  assert.equal(componentTree.getHostInstanceTokenFromNode(ownedNode), token);
  assert.equal(componentTree.getLatestPropsFromNode(ownedNode), props);
  assert.equal(componentTree.detachHostInstanceNode(ownedNode), token);
}

{
  const rootOwner = {kind: 'EventListenerLookupRoot'};
  const hostOwner = {kind: 'EventListenerLookupHost'};
  const node = createElement('BUTTON');
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  let clickCallCount = 0;
  const props = {
    disabled: false,
    onClick() {
      clickCallCount += 1;
    }
  };

  componentTree.attachHostInstanceNode(node, token, props);
  const targetRecord = componentTree.createEventTargetNormalizationRecord(node);
  const dispatchPathRecord =
    componentTree.createEventTargetDispatchPathRecord(targetRecord);
  const lookupRecord = componentTree.createEventListenerTargetLookupRecord(
    targetRecord,
    'onClick'
  );
  const lookupPayload =
    componentTree.getEventListenerTargetLookupRecordPayload(lookupRecord);

  assert.equal(
    lookupRecord.kind,
    componentTree.EVENT_LISTENER_TARGET_LOOKUP_RECORD_KIND
  );
  assert.equal(
    dispatchPathRecord.kind,
    componentTree.EVENT_TARGET_DISPATCH_PATH_RECORD_KIND
  );
  assert.equal(Object.isFrozen(dispatchPathRecord), true);
  assert.equal(
    Object.isFrozen(dispatchPathRecord.entries),
    true
  );
  assert.equal(
    dispatchPathRecord.status,
    'resolved-component-tree-dispatch-path'
  );
  assert.equal(dispatchPathRecord.length, 1);
  assert.equal(dispatchPathRecord.targetInst, token);
  assert.equal(
    dispatchPathRecord.targetInstStatus,
    'resolved-component-tree-host-instance'
  );
  assert.equal(
    dispatchPathRecord.entries[0].kind,
    componentTree.EVENT_TARGET_DISPATCH_PATH_ENTRY_RECORD_KIND
  );
  assert.equal(dispatchPathRecord.entries[0].targetHostInstanceNode, node);
  assert.equal(dispatchPathRecord.entries[0].targetHostInstanceToken, token);
  assert.equal(dispatchPathRecord.entries[0].hostOwner, hostOwner);
  assert.equal(dispatchPathRecord.entries[0].rootOwner, rootOwner);
  assert.equal(dispatchPathRecord.browserDomEventCompatibilityClaimed, false);
  assert.equal(Object.isFrozen(lookupRecord), true);
  assert.equal(lookupRecord.status, 'blocked');
  assert.equal(
    lookupRecord.blockedReason,
    componentTree.EVENT_LISTENER_TARGET_LOOKUP_BLOCKED_CODE
  );
  assert.equal(lookupRecord.componentTreeStatus, 'mounted-host-instance');
  assert.equal(lookupRecord.registrationName, 'onClick');
  assert.equal(lookupRecord.latestPropsStatus, 'present');
  assert.equal(lookupRecord.listenerStatus, 'present');
  assert.equal(lookupRecord.listenerFound, true);
  assert.equal(lookupRecord.listenerType, 'function');
  assert.equal(lookupRecord.listenerInvocationCount, 0);
  assert.equal(lookupRecord.willInvokeListener, false);
  assert.equal(lookupRecord.exposesLatestProps, false);
  assert.equal(lookupRecord.exposesListener, false);
  assert.equal(lookupRecord.targetHostInstanceNode, node);
  assert.equal(lookupRecord.targetHostInstanceToken, token);
  assert.equal(lookupRecord.hostOwner, hostOwner);
  assert.equal(lookupRecord.rootOwner, rootOwner);
  assert.equal(Object.hasOwn(lookupRecord, 'latestProps'), false);
  assert.equal(Object.hasOwn(lookupRecord, 'listener'), false);
  assert.equal(componentTree.isEventListenerTargetLookupRecord(lookupRecord), true);
  assert.equal(lookupPayload.latestProps, props);
  assert.equal(lookupPayload.listener, props.onClick);
  assert.equal(lookupPayload.hostInstanceNode, node);
  assert.equal(lookupPayload.hostInstanceToken, token);

  const disabledProps = {
    disabled: true,
    onClick() {
      clickCallCount += 1;
    }
  };
  componentTree.updateLatestPropsForNode(node, disabledProps);
  const disabledLookup = componentTree.createEventListenerTargetLookupRecord(
    targetRecord,
    'onClick'
  );
  const disabledPayload =
    componentTree.getEventListenerTargetLookupRecordPayload(disabledLookup);

  assert.equal(disabledLookup.listenerStatus, 'disabled-interactive-blocked');
  assert.equal(disabledLookup.listenerFound, false);
  assert.equal(disabledLookup.listenerType, 'blocked');
  assert.equal(disabledPayload.latestProps, disabledProps);
  assert.equal(disabledPayload.listener, null);
  assert.equal(clickCallCount, 0);

  const wrongNode = createElement('BUTTON');
  const wrongTargetRecord = Object.freeze({
    ...targetRecord,
    closestMountedHostInstanceNode: wrongNode,
    targetNode: wrongNode
  });
  assert.throws(
    () =>
      componentTree.createEventListenerTargetLookupRecord(
        wrongTargetRecord,
        'onClick'
      ),
    {
      code: componentTree.EVENT_LISTENER_TARGET_LOOKUP_NODE_MISMATCH_CODE
    }
  );
  assert.throws(
    () => componentTree.createEventListenerTargetLookupRecord({}, 'onClick'),
    {
      code: componentTree.INVALID_EVENT_TARGET_NORMALIZATION_RECORD_CODE
    }
  );
  assert.equal(clickCallCount, 0);
  assert.equal(componentTree.getLatestPropsFromNode(node), disabledProps);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
}

{
  const rootOwner = {kind: 'CommitBatchRoot'};
  const firstHostOwner = {kind: 'CommitBatchFirst'};
  const secondHostOwner = {kind: 'CommitBatchSecond'};
  const firstNode = createElement('DIV');
  const secondNode = createElement('DIV');
  const firstToken = componentTree.createHostInstanceToken(
    firstHostOwner,
    rootOwner
  );
  const secondToken = componentTree.createHostInstanceToken(
    secondHostOwner,
    rootOwner
  );
  const firstInitialProps = {id: 'first-initial'};
  const secondInitialProps = {id: 'second-initial'};
  const firstNextProps = {id: 'first-next'};
  const secondNextProps = {id: 'second-next'};

  componentTree.attachHostInstanceNode(
    firstNode,
    firstToken,
    firstInitialProps
  );
  componentTree.attachHostInstanceNode(
    secondNode,
    secondToken,
    secondInitialProps
  );

  assert.equal(
    componentTree.commitLatestPropsFromMutationRecords([
      domHost.createLatestPropsCommitRecord(firstNode, firstNextProps, [
        setAttributePayload('id', 'id', 'first-next')
      ]),
      domHost.createLatestPropsCommitRecord(secondNode, secondNextProps, [
        setAttributePayload('id', 'id', 'second-next')
      ])
    ]),
    2
  );
  assert.equal(componentTree.getLatestPropsFromNode(firstNode), firstNextProps);
  assert.equal(
    componentTree.getLatestPropsFromNode(secondNode),
    secondNextProps
  );

  const firstHandoffProps = {id: 'first-handoff'};
  const secondHandoffProps = {id: 'second-handoff'};
  assert.equal(
    componentTree.commitLatestPropsFromMutationHandoffs([
      domHost.commitDomPropertyUpdateForLatestProps(
        firstNode,
        'div',
        firstNextProps,
        firstHandoffProps
      ),
      domHost.commitDomPropertyUpdateForLatestProps(
        secondNode,
        'div',
        secondNextProps,
        secondHandoffProps
      )
    ]),
    2
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(firstNode),
    firstHandoffProps
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(secondNode),
    secondHandoffProps
  );
  assert.deepEqual(attributeEntries(firstNode), [['id', 'first-handoff']]);
  assert.deepEqual(attributeEntries(secondNode), [['id', 'second-handoff']]);

  const firstBlockedProps = {id: 'first-blocked'};
  const invalidBatchRecord = {kind: 'latestPropsCommit'};
  assert.throws(
    () =>
      componentTree.commitLatestPropsFromMutationRecords([
        domHost.createLatestPropsCommitRecord(firstNode, firstBlockedProps, [
          setAttributePayload('id', 'id', 'first-blocked')
        ]),
        invalidBatchRecord
      ]),
    {
      code: 'FAST_REACT_DOM_INVALID_LATEST_PROPS_COMMIT_RECORD'
    }
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(firstNode),
    firstHandoffProps
  );
  assert.deepEqual(attributeEntries(firstNode), [['id', 'first-handoff']]);

  const firstBlockedHandoffProps = {id: 'first-blocked-handoff'};
  assert.throws(
    () =>
      componentTree.commitLatestPropsFromMutationHandoffs([
        domHost.commitDomPropertyUpdateForLatestProps(
          firstNode,
          'div',
          firstHandoffProps,
          firstBlockedHandoffProps
        ),
        {kind: 'domPropertyUpdateLatestPropsHandoff'}
      ]),
    {
      code: 'FAST_REACT_DOM_INVALID_LATEST_PROPS_MUTATION_HANDOFF'
    }
  );
  assert.equal(
    componentTree.getLatestPropsFromNode(firstNode),
    firstHandoffProps
  );
  assert.deepEqual(attributeEntries(firstNode), [['id', 'first-handoff']]);

  assert.equal(componentTree.detachHostInstanceToken(firstToken), firstToken);
  assert.equal(componentTree.detachHostInstanceToken(secondToken), secondToken);
}

{
  const rootOwner = {kind: 'CommitRecordGuardsRoot'};
  const hostOwner = {kind: 'CommitRecordGuardsHost'};
  const node = createElement('DIV');
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const initialProps = {id: 'initial'};

  componentTree.attachHostInstanceNode(node, token, initialProps);

  assert.throws(
    () =>
      domHost.createLatestPropsCommitRecord(node, {id: 'unsafe-style'}, [
        {
          kind: 'setStyle',
          mutation: 'propertyAssignment',
          propName: 'style',
          styleName: 'color',
          value: 'red'
        }
      ]),
    {
      code: 'FAST_REACT_DOM_UNSAFE_LATEST_PROPS_PAYLOAD_RECORD'
    }
  );
  assert.throws(
    () =>
      domHost.createLatestPropsCommitRecord(node, {id: 'unsafe-html'}, [
        {
          kind: 'setInnerHTML',
          propName: 'dangerouslySetInnerHTML',
          propertyName: 'innerHTML',
          value: '<span>raw</span>'
        }
      ]),
    {
      code: 'FAST_REACT_DOM_UNSAFE_LATEST_PROPS_PAYLOAD_RECORD'
    }
  );
  assert.throws(
    () =>
      domHost.createLatestPropsCommitRecord(node, {id: 'bad-shape'}, [
        {
          attributeName: 'id',
          kind: 'setAttribute',
          value: 'bad-shape'
        }
      ]),
    {
      code: 'FAST_REACT_DOM_INVALID_LATEST_PROPS_PAYLOAD_RECORD'
    }
  );
  assert.throws(
    () => domHost.createLatestPropsCommitRecord(node, {id: 'not-array'}, {}),
    {
      code: 'FAST_REACT_DOM_INVALID_LATEST_PROPS_PAYLOAD'
    }
  );
  assert.throws(
    () => componentTree.commitLatestPropsFromMutationRecords({}),
    {
      code: 'FAST_REACT_DOM_INVALID_LATEST_PROPS_COMMIT_BATCH'
    }
  );

  assert.equal(componentTree.detachHostInstanceToken(token), token);

  const detachedRecord = domHost.createLatestPropsCommitRecord(
    node,
    {id: 'detached'},
    [setAttributePayload('id', 'id', 'detached')]
  );
  assert.throws(
    () => componentTree.commitLatestPropsFromMutationRecord(detachedRecord),
    {
      code: 'FAST_REACT_DOM_UNATTACHED_HOST_INSTANCE_NODE'
    }
  );
  assert.equal(componentTree.getLatestPropsFromNode(node), null);
}

{
  const rootOwner = {kind: 'RefGateRoot'};
  const hostOwner = {kind: 'RefGateHost'};
  const node = createElement('DIV');
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  let refCallCount = 0;

  function firstRef() {
    refCallCount += 1;
  }

  function secondRef() {
    refCallCount += 1;
  }

  const firstProps = {
    id: 'first',
    onClick() {
      refCallCount += 10;
    },
    ref: firstRef
  };
  const secondProps = {
    id: 'second',
    onClick() {
      refCallCount += 10;
    },
    ref: secondRef
  };

  componentTree.attachHostInstanceNode(node, token, firstProps);
  componentTree.commitLatestPropsFromMutationRecord(
    domHost.createLatestPropsCommitRecord(node, secondProps, [
      setAttributePayload('id', 'id', 'second'),
      nonPayload('onClick', 'event'),
      nonPayload('ref', 'ref')
    ])
  );

  const detachRecord = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'current-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: {id: 'first-ref-handle'},
    ref: firstRef,
    expectedLatestRef: secondRef,
    sourceToken: 'deletion-token:1',
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_DELETION,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE,
    detachReason: refCallbackGate.REF_DETACH_REASON_REF_CHANGED
  });
  const attachRecord = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'finished-fiber'},
    stateNode: {id: 'state-node'},
    refHandle: {id: 'second-ref-handle'},
    ref: secondRef,
    sourceToken: 'commit-token:2',
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_COMMIT,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE
  });

  assert.equal(
    refCallbackGate.isPrivateRefCallbackMetadataRecord(detachRecord),
    true
  );
  assert.equal(Object.hasOwn(detachRecord, 'ref'), false);
  assert.equal(Object.hasOwn(detachRecord, 'hostInstanceToken'), false);
  assert.equal(Object.hasOwn(detachRecord, 'latestProps'), false);

  const snapshot =
    refCallbackGate.createRefCallbackComponentTreeGateSnapshot({
      detach: [detachRecord],
      attach: [attachRecord]
    });

  assert.equal(
    refCallbackGate.isPrivateRefCallbackComponentTreeGateSnapshot(snapshot),
    true
  );
  assert.equal(
    snapshot.$$typeof,
    refCallbackGate.privateDomRefCallbackComponentTreeGateSnapshotType
  );
  assert.equal(
    snapshot.status,
    refCallbackGate.REF_CALLBACK_COMPONENT_TREE_GATE_STATUS
  );
  assert.equal(snapshot.recordCount, 2);
  assert.equal(snapshot.detachCount, 1);
  assert.equal(snapshot.attachCount, 1);
  assert.equal(snapshot.callbackRefsInvoked, false);
  assert.equal(snapshot.objectRefsMutated, false);
  assert.equal(snapshot.layoutEffectsRun, false);
  assert.equal(snapshot.domMutated, false);
  assert.equal(snapshot.publicRootsTouched, false);
  assert.equal(snapshot.compatibilityClaimed, false);
  assert.deepEqual(
    snapshot.blockedCapabilities.map((capability) => capability.id),
    [
      'callback-ref-invocation',
      'object-ref-mutation',
      'layout-effect-execution',
      'dom-mutation',
      'public-root-integration',
      'root-error-propagation',
      'react-dom-ref-compatibility-claim'
    ]
  );
  assert.deepEqual(
    snapshot.records.map((record) => [
      record.sequence,
      record.action,
      record.detachReason,
      record.tokenPhase,
      record.tokenTarget,
      record.componentTreeStatus,
      record.hostNodeRecordKind,
      record.latestRefStatus,
      record.compatibilityClaimed
    ]),
    [
      [
        0,
        refCallbackGate.REF_ACTION_DETACH,
        refCallbackGate.REF_DETACH_REASON_REF_CHANGED,
        refCallbackGate.REF_TOKEN_PHASE_DELETION,
        refCallbackGate.REF_TOKEN_TARGET_INSTANCE,
        'mounted-latest-props-validated',
        componentTree.HOST_INSTANCE_NODE_RECORD_KIND,
        'matches-private-metadata',
        false
      ],
      [
        1,
        refCallbackGate.REF_ACTION_ATTACH,
        null,
        refCallbackGate.REF_TOKEN_PHASE_COMMIT,
        refCallbackGate.REF_TOKEN_TARGET_INSTANCE,
        'mounted-latest-props-validated',
        componentTree.HOST_INSTANCE_NODE_RECORD_KIND,
        'matches-private-metadata',
        false
      ]
    ]
  );

  for (const record of snapshot.records) {
    assert.equal(
      refCallbackGate.isPrivateRefCallbackComponentTreeGateRecord(record),
      true
    );
    assert.equal(Object.hasOwn(record, 'ref'), false);
    assert.equal(Object.hasOwn(record, 'node'), false);
    assert.equal(Object.hasOwn(record, 'latestProps'), false);
    assert.equal(record.callbackRefsInvoked, false);
    assert.equal(record.objectRefsMutated, false);
    assert.equal(record.layoutEffectsRun, false);
    assert.equal(record.domMutated, false);
    assert.equal(record.publicRootsTouched, false);
  }

  const firstPayload =
    refCallbackGate.getPrivateRefCallbackComponentTreeGateRecordPayload(
      snapshot.records[0]
    );
  const secondPayload =
    refCallbackGate.getPrivateRefCallbackComponentTreeGateRecordPayload(
      snapshot.records[1]
    );
  assert.equal(firstPayload.componentTree.node, node);
  assert.equal(firstPayload.componentTree.latestProps, secondProps);
  assert.equal(firstPayload.componentTree.latestRef, secondRef);
  assert.equal(firstPayload.metadata.ref, firstRef);
  assert.equal(secondPayload.componentTree.node, node);
  assert.equal(secondPayload.componentTree.latestProps, secondProps);
  assert.equal(secondPayload.metadata.ref, secondRef);
  assert.equal(refCallCount, 0);
  assert.deepEqual(node.childNodes, []);

  const attachDetachSnapshot =
    refCallbackGate.createRefCallbackAttachDetachGateSnapshot({
      rootCommitRefMetadata: {
        detach: [detachRecord],
        attach: [attachRecord]
      }
    });

  assert.equal(
    refCallbackGate.isPrivateRefCallbackAttachDetachGateSnapshot(
      attachDetachSnapshot
    ),
    true
  );
  assert.equal(
    attachDetachSnapshot.$$typeof,
    refCallbackGate.privateDomRefCallbackAttachDetachGateSnapshotType
  );
  assert.equal(
    attachDetachSnapshot.status,
    refCallbackGate.REF_CALLBACK_ATTACH_DETACH_GATE_STATUS
  );
  assert.equal(attachDetachSnapshot.recordCount, 2);
  assert.equal(attachDetachSnapshot.callbackRefRecordCount, 2);
  assert.equal(attachDetachSnapshot.objectRefRecordCount, 0);
  assert.equal(
    attachDetachSnapshot.errorPropagationStatus,
    refCallbackGate.REF_CALLBACK_ERROR_PROPAGATION_STATUS
  );
  assert.equal(
    attachDetachSnapshot.errorPropagation.willReportRootErrors,
    false
  );
  assert.equal(attachDetachSnapshot.ordering.source, 'root-commit-ref-metadata');
  assert.equal(
    attachDetachSnapshot.ordering.detachRecordsBeforeAttachRecords,
    true
  );
  assert.equal(attachDetachSnapshot.rootErrorsReported, false);
  assert.equal(attachDetachSnapshot.callbackRefsInvoked, false);
  assert.equal(attachDetachSnapshot.objectRefsMutated, false);
  assert.deepEqual(
    attachDetachSnapshot.records.map((record) => [
      record.sequence,
      record.action,
      record.refKind,
      record.operation,
      record.ordering.phase,
      record.errorPropagationStatus,
      record.hostNodeRecordKind,
      record.callbackRefsInvoked,
      record.objectRefsMutated,
      record.rootErrorsReported
    ]),
    [
      [
        0,
        refCallbackGate.REF_ACTION_DETACH,
        refCallbackGate.REF_KIND_CALLBACK,
        refCallbackGate.REF_OPERATION_CALLBACK_DETACH,
        'mutation-ref-detach',
        refCallbackGate.REF_CALLBACK_ERROR_PROPAGATION_STATUS,
        componentTree.HOST_INSTANCE_NODE_RECORD_KIND,
        false,
        false,
        false
      ],
      [
        1,
        refCallbackGate.REF_ACTION_ATTACH,
        refCallbackGate.REF_KIND_CALLBACK,
        refCallbackGate.REF_OPERATION_CALLBACK_ATTACH,
        'layout-ref-attach',
        refCallbackGate.REF_CALLBACK_ERROR_PROPAGATION_STATUS,
        componentTree.HOST_INSTANCE_NODE_RECORD_KIND,
        false,
        false,
        false
      ]
    ]
  );

  for (const record of attachDetachSnapshot.records) {
    assert.equal(
      refCallbackGate.isPrivateRefCallbackAttachDetachGateRecord(record),
      true
    );
    assert.equal(Object.hasOwn(record, 'ref'), false);
    assert.equal(Object.hasOwn(record, 'node'), false);
    assert.equal(Object.hasOwn(record, 'latestProps'), false);
    assert.equal(
      componentTree.isPrivateHostInstanceNodeRecord(record.hostNodeRecord),
      true
    );
  }

  const attachDetachPayload =
    refCallbackGate.getPrivateRefCallbackAttachDetachGateRecordPayload(
      attachDetachSnapshot.records[0]
    );
  assert.equal(attachDetachPayload.hostNode.node, node);
  assert.equal(attachDetachPayload.hostNode.latestProps, secondProps);
  assert.equal(attachDetachPayload.metadata.ref, firstRef);
  assert.equal(refCallCount, 0);

  assert.equal(componentTree.detachHostInstanceToken(token), token);
}

{
  const rootOwner = {kind: 'RefGateDeletedRoot'};
  const hostOwner = {kind: 'RefGateDeletedHost'};
  const node = createElement('SPAN');
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  const objectRef = {current: 'unchanged'};
  const props = {ref: objectRef};

  componentTree.attachHostInstanceNode(node, token, props);

  const detachRecord = refCallbackGate.createRefDetachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'deleted-fiber'},
    stateNode: {id: 'deleted-state-node'},
    refHandle: {id: 'object-ref-handle'},
    ref: objectRef,
    sourceToken: 'deletion-token:object',
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_DELETION,
    tokenTarget: refCallbackGate.REF_TOKEN_TARGET_INSTANCE,
    detachReason: refCallbackGate.REF_DETACH_REASON_DELETED
  });
  const snapshot =
    refCallbackGate.createRefCallbackComponentTreeGateSnapshot({
      detach: [detachRecord],
      attach: []
    });

  assert.equal(snapshot.records.length, 1);
  assert.equal(
    snapshot.records[0].detachReason,
    refCallbackGate.REF_DETACH_REASON_DELETED
  );
  const attachDetachSnapshot =
    refCallbackGate.createRefCallbackAttachDetachGateSnapshot({
      rootCommitRefMetadata: {
        detach: [detachRecord],
        attach: []
      }
    });
  assert.equal(attachDetachSnapshot.records.length, 1);
  assert.equal(attachDetachSnapshot.callbackRefRecordCount, 0);
  assert.equal(attachDetachSnapshot.objectRefRecordCount, 1);
  assert.equal(
    attachDetachSnapshot.records[0].refKind,
    refCallbackGate.REF_KIND_OBJECT
  );
  assert.equal(
    attachDetachSnapshot.records[0].operation,
    refCallbackGate.REF_OPERATION_OBJECT_DETACH
  );
  assert.equal(attachDetachSnapshot.records[0].objectRefsMutated, false);
  assert.equal(
    refCallbackGate.getPrivateRefCallbackAttachDetachGateRecordPayload(
      attachDetachSnapshot.records[0]
    ).ref,
    objectRef
  );
  assert.equal(objectRef.current, 'unchanged');
  assert.equal(snapshot.objectRefsMutated, false);
  assert.equal(attachDetachSnapshot.objectRefsMutated, false);
  assert.equal(componentTree.detachHostInstanceToken(token), token);
}

{
  const rootOwner = {kind: 'RefGateFailureRoot'};
  const hostOwner = {kind: 'RefGateFailureHost'};
  const node = createElement('DIV');
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
  function expectedRef() {}
  function actualRef() {}

  componentTree.attachHostInstanceNode(node, token, {ref: actualRef});

  const mismatchedLatestRef = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'latest-ref-mismatch'},
    stateNode: {id: 'state-node'},
    refHandle: {id: 'expected-ref-handle'},
    ref: expectedRef,
    sourceToken: 'commit-token:mismatch'
  });
  assert.throws(
    () =>
      refCallbackGate.createRefCallbackComponentTreeGateSnapshot({
        detach: [],
        attach: [mismatchedLatestRef]
      }),
    {
      code: 'FAST_REACT_DOM_REF_CALLBACK_GATE_LATEST_REF_MISMATCH'
    }
  );
  assert.equal(refCallbackGate.noSideEffects.callbackRefsInvoked, false);

  const wrongScope = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'wrong-scope'},
    stateNode: {id: 'state-node'},
    refHandle: {id: 'actual-ref-handle'},
    ref: actualRef,
    sourceToken: 'deletion-token:wrong-scope',
    tokenPhase: refCallbackGate.REF_TOKEN_PHASE_DELETION
  });
  assert.throws(
    () =>
      refCallbackGate.createRefCallbackComponentTreeGateSnapshot({
        detach: [],
        attach: [wrongScope]
      }),
    {
      code: 'FAST_REACT_DOM_REF_CALLBACK_GATE_TOKEN_SCOPE_MISMATCH'
    }
  );

  assert.throws(
    () =>
      refCallbackGate.createRefCallbackComponentTreeGateSnapshot({
        detach: [wrongScope],
        attach: []
      }),
    {
      code: 'FAST_REACT_DOM_REF_CALLBACK_GATE_ACTION_MISMATCH'
    }
  );

  const unmountedRecord = refCallbackGate.createRefAttachMetadataRecord({
    rootOwner,
    hostOwner,
    hostInstanceToken: token,
    fiber: {id: 'unmounted'},
    stateNode: {id: 'state-node'},
    refHandle: {id: 'actual-ref-handle'},
    ref: actualRef,
    sourceToken: 'commit-token:unmounted'
  });
  assert.equal(componentTree.detachHostInstanceToken(token), token);
  assert.throws(
    () =>
      refCallbackGate.createRefCallbackComponentTreeGateSnapshot({
        detach: [],
        attach: [unmountedRecord]
      }),
    {
      code: 'FAST_REACT_DOM_REF_CALLBACK_GATE_UNMOUNTED_HOST_INSTANCE'
    }
  );

  assert.throws(
    () =>
      refCallbackGate.createRefCallbackComponentTreeGateSnapshot({
        detach: [{}],
        attach: []
      }),
    {
      code: 'FAST_REACT_DOM_REF_CALLBACK_GATE_INVALID_METADATA_RECORD'
    }
  );
}

{
  const rootOwner = {kind: 'ClosestRoot'};
  const parentOwner = {kind: 'ClosestParentHost'};
  const childOwner = {kind: 'ClosestChildHost'};
  const parent = createElement('SECTION');
  const child = createElement('BUTTON');
  const unmanagedLeaf = createElement('SPAN');
  const parentToken = componentTree.createHostInstanceToken(
    parentOwner,
    rootOwner
  );
  const childToken = componentTree.createHostInstanceToken(
    childOwner,
    rootOwner
  );

  appendChild(parent, child);
  appendChild(child, unmanagedLeaf);
  componentTree.attachHostInstanceNode(parent, parentToken, {
    id: 'parent'
  });
  componentTree.attachHostInstanceNode(child, childToken, {
    id: 'child'
  });

  assert.equal(
    componentTree.getClosestMountedHostInstanceTokenFromNode(unmanagedLeaf),
    childToken
  );
  assert.equal(
    componentTree.getClosestMountedHostInstanceNodeFromNode(unmanagedLeaf),
    child
  );

  assert.equal(componentTree.detachHostInstanceNode(child), childToken);
  assert.equal(
    componentTree.getClosestMountedHostInstanceTokenFromNode(unmanagedLeaf),
    parentToken
  );
  assert.equal(
    componentTree.getClosestMountedHostInstanceNodeFromNode(unmanagedLeaf),
    parent
  );
  assert.equal(componentTree.detachHostInstanceNode(parent), parentToken);
  assert.equal(
    componentTree.getClosestMountedHostInstanceTokenFromNode(unmanagedLeaf),
    null
  );
}

{
  const outerRootOwner = {kind: 'OuterRoot'};
  const outerHostOwner = {kind: 'OuterHost'};
  const innerRootOwner = {kind: 'InnerRoot'};
  const outerNode = createElement('ARTICLE');
  const innerContainer = createElement('DIV');
  const unmanagedInnerChild = createElement('SPAN');
  const outerToken = componentTree.createHostInstanceToken(
    outerHostOwner,
    outerRootOwner
  );

  appendChild(outerNode, innerContainer);
  appendChild(innerContainer, unmanagedInnerChild);
  componentTree.attachHostInstanceNode(outerNode, outerToken, {
    id: 'outer'
  });
  rootMarkers.markContainerAsRoot(innerRootOwner, innerContainer);

  assert.equal(
    componentTree.getClosestMountedHostInstanceTokenFromNode(
      unmanagedInnerChild
    ),
    null
  );
  assert.equal(
    componentTree.getClosestMountedHostInstanceNodeFromNode(
      unmanagedInnerChild
    ),
    null
  );

  rootMarkers.unmarkContainerAsRoot(innerContainer);
  assert.equal(
    componentTree.getClosestMountedHostInstanceTokenFromNode(
      unmanagedInnerChild
    ),
    outerToken
  );
  assert.equal(componentTree.detachHostInstanceToken(outerToken), outerToken);
}

{
  assert.equal(componentTree.isHostInstanceNode(createElement('DIV')), true);
  assert.equal(componentTree.isHostInstanceNode(createTextNode('text')), true);
  assert.equal(componentTree.isHostInstanceNode(createContainer()), false);
  assert.equal(componentTree.isHostInstanceNode(null), false);

  assert.throws(() => componentTree.assertHostInstanceNode(createContainer()), {
    code: 'FAST_REACT_DOM_INVALID_HOST_INSTANCE_NODE'
  });
  assert.throws(
    () => componentTree.createHostInstanceToken(null, {kind: 'Root'}),
    {
      code: 'FAST_REACT_DOM_MISSING_HOST_OWNER'
    }
  );
  assert.throws(
    () => componentTree.createHostInstanceToken({kind: 'Host'}, null),
    {
      code: 'FAST_REACT_DOM_MISSING_ROOT_OWNER'
    }
  );
  assert.throws(
    () => componentTree.updateLatestPropsForNode(createElement('DIV'), {}),
    {
      code: 'FAST_REACT_DOM_UNATTACHED_HOST_INSTANCE_NODE'
    }
  );
}

{
  const privateHelperNames = [
    'assertMountedHostInstanceToken',
    'attachHostInstanceNode',
    'commitLatestPropsFromMutationHandoff',
    'commitLatestPropsFromMutationHandoffs',
    'commitLatestPropsFromMutationRecord',
    'commitLatestPropsFromMutationRecords',
    'createHostInstanceToken',
    'createMountedHostInstanceNodeRecord',
    'detachHostInstanceNode',
    'detachHostInstanceToken',
    'getClosestMountedHostInstanceNodeFromNode',
    'getClosestMountedHostInstanceTokenFromNode',
    'getHostInstanceTokenFromNode',
    'getLatestPropsFromNode',
    'getLatestPropsFromHostInstanceToken',
    'getMountedHostInstanceNodeFromToken',
    'getMountedHostInstanceTokenFromNode',
    'getPrivateHostInstanceNodeRecordPayload',
    'updateLatestPropsForHostInstanceToken',
    'updateLatestPropsForNode',
    'createRefAttachMetadataRecord',
    'createRefCallbackAttachDetachGateSnapshot',
    'createRefCallbackComponentTreeGateSnapshot',
    'createRefDetachMetadataRecord'
  ];

  for (const name of privateHelperNames) {
    assert.equal(Object.hasOwn(reactDom, name), false, name);
    assert.equal(Object.hasOwn(reactDomClient, name), false, name);
  }

  assert.equal(reactDom.__FAST_REACT_PLACEHOLDER__, true);
  assert.equal(reactDomClient.__FAST_REACT_PLACEHOLDER__, true);
  assert.equal(
    Object.hasOwn(reactDomPackage.exports, './src/client/component-tree'),
    false
  );
  assert.equal(
    Object.hasOwn(reactDomPackage.exports, './src/client/component-tree.js'),
    false
  );
  assert.equal(
    Object.hasOwn(reactDomPackage.exports, './src/client/ref-callback-gate'),
    false
  );
  assert.equal(
    Object.hasOwn(reactDomPackage.exports, './src/client/ref-callback-gate.js'),
    false
  );
}

console.log('React DOM private component tree map shell smoke checks passed.');

function setAttributePayload(propName, attributeName, value) {
  return {
    attributeName,
    kind: 'setAttribute',
    propName,
    value
  };
}

function removeAttributePayload(propName, attributeName) {
  return {
    attributeName,
    kind: 'removeAttribute',
    propName
  };
}

function setAttributePayloadRecord(attributeName, value) {
  return {
    attributeName,
    kind: 'setAttribute',
    value
  };
}

function removeAttributePayloadRecord(attributeName) {
  return {
    attributeName,
    kind: 'removeAttribute'
  };
}

function skippedNonPayload(propName, category, reason) {
  return {
    category,
    kind: 'nonPayload',
    propName,
    reason,
    status: 'skipped'
  };
}

function nonPayload(propName, category) {
  return {
    category,
    kind: 'nonPayload',
    propName,
    reason: `${propName} is stored by the latest-props map`
  };
}

function createElement(nodeName) {
  return {
    attributeLog: [],
    attributes: new Map(),
    childNodes: [],
    getAttribute(name) {
      const attributeName = String(name);
      return this.attributes.has(attributeName)
        ? this.attributes.get(attributeName)
        : null;
    },
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    parentNode: null,
    removeAttribute(name) {
      const attributeName = String(name);
      this.attributeLog.push([
        'removeAttribute',
        attributeName,
        this.attributes.has(attributeName)
      ]);
      this.attributes.delete(attributeName);
    },
    setAttribute(name, value) {
      const attributeName = String(name);
      const stringValue = String(value);
      this.attributeLog.push(['setAttribute', attributeName, stringValue]);
      this.attributes.set(attributeName, stringValue);
    }
  };
}

function attributeEntries(node) {
  return Array.from(node.attributes.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function createTextNode(data) {
  return {
    childNodes: [],
    data,
    nodeName: '#text',
    nodeType: domContainer.TEXT_NODE,
    parentNode: null
  };
}

function createContainer() {
  return {
    childNodes: [],
    nodeName: '#document-fragment',
    nodeType: domContainer.DOCUMENT_FRAGMENT_NODE,
    parentNode: null
  };
}

function appendChild(parent, child) {
  parent.childNodes.push(child);
  child.parentNode = parent;
  return child;
}
