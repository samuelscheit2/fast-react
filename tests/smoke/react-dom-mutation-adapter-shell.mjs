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

const domHost = require(
  path.join(repoRoot, 'packages/react-dom/src/dom-host/index.js')
);
const reactDomClient = require(
  path.join(repoRoot, 'packages/react-dom/client.js')
);

function runSmokeChecks() {
  assert.equal(typeof reactDomClient.createRoot, 'function');
  assert.throws(() => reactDomClient.createRoot({nodeType: 1}), {
    code: 'FAST_REACT_UNIMPLEMENTED'
  });

  assert.equal(domHost.shouldSetTextContent('div', {children: 'hello'}), true);
  assert.equal(domHost.shouldSetTextContent('div', {children: ''}), true);
  assert.equal(domHost.shouldSetTextContent('div', {children: 0}), true);
  assert.equal(domHost.shouldSetTextContent('div', {children: false}), false);
  assert.equal(domHost.shouldSetTextContent('div', {children: ['a']}), false);
  assert.equal(
    domHost.shouldSetTextContent('div', {
      dangerouslySetInnerHTML: {__html: '<span>hello</span>'}
    }),
    true
  );
  assert.equal(
    domHost.shouldSetTextContent('div', {
      dangerouslySetInnerHTML: {__html: null}
    }),
    false
  );
  assert.equal(
    domHost.shouldSetTextContent('textarea', {children: 'text'}),
    false
  );
  assert.equal(
    domHost.shouldSetTextContent('noscript', {children: 'text'}),
    false
  );

  {
    const parent = createElement('section');
    const first = createElement('p');
    const second = createElement('span');

    assert.equal(domHost.appendInitialChild(parent, first), first);
    assert.deepEqual(childNames(parent), ['p']);
    assert.equal(first.parentNode, parent);

    assert.equal(domHost.appendChild(parent, second), second);
    assert.deepEqual(childNames(parent), ['p', 'span']);
  }

  {
    const oldParent = createElement('old-parent');
    const newParent = createElement('new-parent');
    const before = createElement('before');
    const moved = createElement('moved');

    oldParent.appendChild(moved);
    newParent.appendChild(before);
    assert.equal(domHost.insertBefore(newParent, moved, before), moved);

    assert.deepEqual(childNames(oldParent), []);
    assert.deepEqual(childNames(newParent), ['moved', 'before']);
    assert.equal(moved.parentNode, newParent);
  }

  {
    const parent = createElement('ul');
    const child = createElement('li');
    const wrongBefore = createElement('other');

    parent.appendChild(child);
    assert.throws(
      () => domHost.insertBefore(parent, createElement('new'), wrongBefore),
      {
        code: 'FAST_REACT_DOM_MISSING_INSERTION_TARGET'
      }
    );
    assert.deepEqual(childNames(parent), ['li']);
    assert.equal(child.parentNode, parent);
  }

  {
    const container = createElement('div');
    const child = createElement('article');

    assert.equal(domHost.appendChildToContainer(container, child), child);
    assert.deepEqual(childNames(container), ['article']);

    assert.equal(domHost.removeChildFromContainer(container, child), child);
    assert.deepEqual(childNames(container), []);
    assert.equal(child.parentNode, null);
  }

  {
    const parent = createElement('ol');
    const child = createElement('li');
    const wrongChild = createElement('li');

    parent.appendChild(child);
    assert.throws(() => domHost.removeChild(parent, wrongChild), {
      code: 'FAST_REACT_DOM_MISSING_REMOVAL_TARGET'
    });
    assert.deepEqual(childNames(parent), ['li']);
    assert.equal(child.parentNode, parent);
  }

  {
    const container = createElement('main');
    const first = createElement('header');
    const second = createElement('section');
    const third = createElement('footer');

    container.appendChild(first);
    container.appendChild(second);
    container.appendChild(third);

    assert.equal(domHost.clearContainer(container), undefined);
    assert.deepEqual(childNames(container), []);
    assert.equal(first.parentNode, null);
    assert.equal(second.parentNode, null);
    assert.equal(third.parentNode, null);
  }

  {
    const text = createText('old');

    assert.equal(domHost.commitTextUpdate(text, 'old', 'new'), undefined);
    assert.equal(text.data, 'new');
    assert.equal(text.nodeValue, 'new');
    assert.equal(text.textContent, 'new');
  }

  {
    const parent = createElement('div');
    parent.appendChild(createText('managed'));
    assert.equal(parent.textContent, 'managed');

    assert.equal(domHost.resetTextContent(parent), undefined);
    assert.equal(parent.textContent, '');
    assert.deepEqual(childNames(parent), []);

    assert.equal(domHost.setTextContent(parent, 123), undefined);
    assert.equal(parent.textContent, '123');
  }

  {
    const parent = createElement('div');
    const child = createElement('span');
    const grandchild = createElement('em');

    child.appendChild(grandchild);
    parent.appendChild(child);

    assert.throws(() => domHost.appendChild(grandchild, parent), {
      code: 'FAST_REACT_DOM_INVALID_MUTATION_TARGET'
    });
    assert.deepEqual(childNames(parent), ['span']);
    assert.deepEqual(childNames(child), ['em']);
  }

  console.log('React DOM private mutation adapter shell smoke checks passed.');
}

function createElement(nodeName) {
  return new FakeElement(nodeName);
}

function createText(text) {
  return new FakeText(text);
}

function childNames(parent) {
  return parent.childNodes.map((child) => child.nodeName);
}

class FakeNode {
  constructor(nodeName, nodeType) {
    this.childNodes = [];
    this.nodeName = nodeName;
    this.nodeType = nodeType;
    this.parentNode = null;
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  appendChild(child) {
    assertValidChild(child);
    assertCanAcceptChild(this, child);
    detachFromParent(child);
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }

  insertBefore(child, beforeChild) {
    assertValidChild(child);
    assertCanAcceptChild(this, child);
    if (beforeChild.parentNode !== this) {
      throw new Error('Fake DOM insertBefore target is not a child.');
    }

    if (child === beforeChild) {
      return child;
    }

    detachFromParent(child);
    const insertionIndex = this.childNodes.indexOf(beforeChild);
    this.childNodes.splice(insertionIndex, 0, child);
    child.parentNode = this;
    return child;
  }

  removeChild(child) {
    if (child.parentNode !== this) {
      throw new Error('Fake DOM removeChild target is not a child.');
    }

    detachFromParent(child);
    return child;
  }
}

class FakeElement extends FakeNode {
  constructor(nodeName) {
    super(nodeName, 1);
    this._textContent = '';
  }

  get textContent() {
    if (this.childNodes.length === 0) {
      return this._textContent;
    }
    return this.childNodes.map((child) => child.textContent).join('');
  }

  set textContent(value) {
    for (const child of [...this.childNodes]) {
      detachFromParent(child);
    }
    this._textContent = String(value);
  }
}

class FakeText extends FakeNode {
  constructor(text) {
    super('#text', 3);
    this._data = String(text);
  }

  get data() {
    return this._data;
  }

  set data(value) {
    this._data = String(value);
  }

  get nodeValue() {
    return this._data;
  }

  set nodeValue(value) {
    this._data = String(value);
  }

  get textContent() {
    return this._data;
  }

  set textContent(value) {
    this._data = String(value);
  }
}

function assertValidChild(child) {
  if (child == null || typeof child !== 'object') {
    throw new Error('Fake DOM child must be a node.');
  }
}

function assertCanAcceptChild(parent, child) {
  let current = parent;
  while (current !== null) {
    if (current === child) {
      throw new Error('Fake DOM cannot insert an ancestor into a descendant.');
    }
    current = current.parentNode;
  }
}

function detachFromParent(child) {
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

runSmokeChecks();
