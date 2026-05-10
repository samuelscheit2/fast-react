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
const domContainer = require(
  path.join(repoRoot, 'packages/react-dom/src/client/dom-container.js')
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
  assert.equal(componentTree.getAttachedNodeFromHostInstanceToken(token), node);
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
}

{
  const rootOwner = {kind: 'RootForText'};
  const hostOwner = {kind: 'TextHost'};
  const textNode = createTextNode('hello');
  const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);

  assert.equal(componentTree.isHostInstanceNode(textNode), true);
  componentTree.attachHostInstanceNode(textNode, token, null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
  assert.equal(componentTree.detachHostInstanceNode(textNode), token);
  assert.equal(componentTree.getHostInstanceTokenFromNode(textNode), null);
  assert.equal(componentTree.getLatestPropsFromNode(textNode), null);
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
    'attachHostInstanceNode',
    'createHostInstanceToken',
    'detachHostInstanceNode',
    'getHostInstanceTokenFromNode',
    'getLatestPropsFromNode',
    'updateLatestPropsForNode'
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
}

console.log('React DOM private component tree map shell smoke checks passed.');

function createElement(nodeName) {
  return {
    nodeName,
    nodeType: domContainer.ELEMENT_NODE
  };
}

function createTextNode(data) {
  return {
    data,
    nodeName: '#text',
    nodeType: domContainer.TEXT_NODE
  };
}

function createContainer() {
  return {
    nodeName: '#document-fragment',
    nodeType: domContainer.DOCUMENT_FRAGMENT_NODE
  };
}
