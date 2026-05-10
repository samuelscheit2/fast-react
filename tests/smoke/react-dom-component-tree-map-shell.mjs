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
  assert.equal(componentTree.getLatestPropsFromNode(firstNode), firstNextProps);

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
  assert.equal(objectRef.current, 'unchanged');
  assert.equal(snapshot.objectRefsMutated, false);
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
    'commitLatestPropsFromMutationRecord',
    'commitLatestPropsFromMutationRecords',
    'createHostInstanceToken',
    'detachHostInstanceNode',
    'detachHostInstanceToken',
    'getClosestMountedHostInstanceNodeFromNode',
    'getClosestMountedHostInstanceTokenFromNode',
    'getHostInstanceTokenFromNode',
    'getLatestPropsFromNode',
    'getLatestPropsFromHostInstanceToken',
    'getMountedHostInstanceNodeFromToken',
    'getMountedHostInstanceTokenFromNode',
    'updateLatestPropsForHostInstanceToken',
    'updateLatestPropsForNode',
    'createRefAttachMetadataRecord',
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
    childNodes: [],
    nodeName,
    nodeType: domContainer.ELEMENT_NODE,
    parentNode: null
  };
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
