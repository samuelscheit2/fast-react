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
const componentTree = require(
  path.join(repoRoot, 'packages/react-dom/src/client/component-tree.js')
);
const propertyPayload = require(
  path.join(repoRoot, 'packages/react-dom/src/dom-host/property-payload.js')
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
    const element = createElement('button');
    const previousProps = orderedProps([
      ['id', 'mutable'],
      ['className', 'alpha'],
      ['disabled', true],
      ['title', 'first'],
      ['data-state', 'open'],
      ['aria-hidden', true],
      ['custom-attr', 'initial']
    ]);
    const nextProps = orderedProps([
      ['id', 'mutable'],
      ['className', undefined],
      ['disabled', false],
      ['title', 'second'],
      ['data-state', null],
      ['aria-hidden', false],
      ['custom-attr', undefined]
    ]);

    assert.deepEqual(
      domHost.applyDomPropertyPayload(
        element,
        propertyPayload.diffDomPropertyPayload('button', {}, previousProps)
      ),
      [
        appliedSetAttribute('id', 'mutable'),
        appliedSetAttribute('class', 'alpha'),
        appliedSetAttribute('disabled', ''),
        appliedSetAttribute('title', 'first'),
        appliedSetAttribute('data-state', 'open'),
        appliedSetAttribute('aria-hidden', 'true'),
        appliedSetAttribute('custom-attr', 'initial')
      ]
    );
    assert.deepEqual(attributeEntries(element), [
      ['aria-hidden', 'true'],
      ['class', 'alpha'],
      ['custom-attr', 'initial'],
      ['data-state', 'open'],
      ['disabled', ''],
      ['id', 'mutable'],
      ['title', 'first']
    ]);

    assert.deepEqual(
      domHost.applyDomPropertyPayload(
        element,
        propertyPayload.diffDomPropertyPayload(
          'button',
          previousProps,
          nextProps
        )
      ),
      [
        appliedRemoveAttribute('class'),
        appliedRemoveAttribute('disabled'),
        appliedSetAttribute('title', 'second'),
        appliedRemoveAttribute('data-state'),
        appliedSetAttribute('aria-hidden', 'false'),
        appliedRemoveAttribute('custom-attr')
      ]
    );
    assert.deepEqual(attributeEntries(element), [
      ['aria-hidden', 'false'],
      ['id', 'mutable'],
      ['title', 'second']
    ]);
    assert.deepEqual(element.attributeLog, [
      ['setAttribute', 'id', 'mutable'],
      ['setAttribute', 'class', 'alpha'],
      ['setAttribute', 'disabled', ''],
      ['setAttribute', 'title', 'first'],
      ['setAttribute', 'data-state', 'open'],
      ['setAttribute', 'aria-hidden', 'true'],
      ['setAttribute', 'custom-attr', 'initial'],
      ['removeAttribute', 'class', true],
      ['removeAttribute', 'disabled', true],
      ['setAttribute', 'title', 'second'],
      ['removeAttribute', 'data-state', true],
      ['setAttribute', 'aria-hidden', 'false'],
      ['removeAttribute', 'custom-attr', true]
    ]);
  }

  {
    const element = createElement('fast-widget');
    const value = {answer: 42};

    assert.deepEqual(
      domHost.applyDomPropertyPayload(element, [
        {
          kind: propertyPayload.ENTRY_SET_PROPERTY,
          propertyName: 'boolProp',
          value: true
        },
        {
          kind: propertyPayload.ENTRY_SET_PROPERTY,
          propertyName: 'objectProp',
          value
        },
        {
          kind: propertyPayload.ENTRY_REMOVE_PROPERTY,
          propertyName: 'boolProp'
        }
      ]),
      [
        appliedSetProperty('boolProp', true),
        appliedSetProperty('objectProp', value),
        appliedRemoveProperty('boolProp')
      ]
    );
    assert.equal(element.boolProp, null);
    assert.equal(element.objectProp, value);
    assert.deepEqual(element.propertyLog, [
      ['setProperty', 'boolProp', true],
      ['setProperty', 'objectProp', value],
      ['setProperty', 'boolProp', null]
    ]);
  }

  {
    const element = createElement('button');
    element.setAttribute('title', 'old-title');
    element.setAttribute('hidden', '');
    element.attributeLog = [];

    assert.deepEqual(
      domHost.commitDomPropertyUpdate(
        element,
        'button',
        orderedProps([
          ['title', 'old-title'],
          ['hidden', true],
          ['children', 'Old label']
        ]),
        orderedProps([
          ['id', 'next-id'],
          ['title', 'new-title'],
          ['children', 'New label'],
          ['data-state', 'ready']
        ])
      ),
      [
        appliedRemoveAttribute('hidden'),
        appliedSetAttribute('id', 'next-id'),
        appliedSetAttribute('title', 'new-title'),
        skippedNonPayload(
          'children',
          'children',
          'children are handled by text-content reconciliation'
        ),
        appliedSetAttribute('data-state', 'ready')
      ]
    );
    assert.deepEqual(attributeEntries(element), [
      ['data-state', 'ready'],
      ['id', 'next-id'],
      ['title', 'new-title']
    ]);
    assert.deepEqual(element.attributeLog, [
      ['removeAttribute', 'hidden', true],
      ['setAttribute', 'id', 'next-id'],
      ['setAttribute', 'title', 'new-title'],
      ['setAttribute', 'data-state', 'ready']
    ]);
  }

  {
    const rootOwner = {kind: 'LatestPropsMutationRoot'};
    const hostOwner = {kind: 'LatestPropsMutationHost'};
    const element = createElement('button');
    const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
    const initialProps = orderedProps([
      ['title', 'old-title'],
      ['hidden', true],
      ['onClick', () => 'old']
    ]);
    const nextProps = orderedProps([
      ['id', 'next-id'],
      ['title', 'new-title'],
      ['onClick', () => 'new'],
      ['data-state', 'ready']
    ]);

    element.setAttribute('title', 'old-title');
    element.setAttribute('hidden', '');
    element.attributeLog = [];
    componentTree.attachHostInstanceNode(element, token, initialProps);

    const handoff = domHost.commitDomPropertyUpdateForLatestProps(
      element,
      'button',
      initialProps,
      nextProps
    );
    const hiddenHandoff =
      domHost.getDomPropertyUpdateLatestPropsHandoffPayload(handoff);

    assert.equal(
      handoff.kind,
      domHost.DOM_PROPERTY_UPDATE_LATEST_PROPS_HANDOFF
    );
    assert.equal(handoff.payloadCount, 5);
    assert.equal(Object.hasOwn(handoff, 'node'), false);
    assert.equal(Object.hasOwn(handoff, 'latestProps'), false);
    assert.equal(domHost.isDomPropertyUpdateLatestPropsHandoff(handoff), true);
    assert.deepEqual(hiddenHandoff.mutationRecords, [
      appliedRemoveAttribute('hidden'),
      appliedSetAttribute('id', 'next-id'),
      appliedSetAttribute('title', 'new-title'),
      skippedNonPayload(
        'onClick',
        'event',
        'event props are stored by the future event/latest-props path'
      ),
      appliedSetAttribute('data-state', 'ready')
    ]);
    assert.deepEqual(element.attributeLog, [
      ['removeAttribute', 'hidden', true],
      ['setAttribute', 'id', 'next-id'],
      ['setAttribute', 'title', 'new-title'],
      ['setAttribute', 'data-state', 'ready']
    ]);
    assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
    assert.equal(
      componentTree.commitLatestPropsFromMutationHandoff(handoff),
      nextProps
    );
    assert.equal(componentTree.getLatestPropsFromNode(element), nextProps);
    assert.equal(componentTree.detachHostInstanceToken(token), token);
  }

  {
    const rootOwner = {kind: 'LatestPropsDeferredRollbackRoot'};
    const hostOwner = {kind: 'LatestPropsDeferredRollbackHost'};
    const element = createElement('button');
    const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
    const initialProps = orderedProps([
      ['title', 'old-title'],
      ['children', 'Old label']
    ]);
    const nextProps = orderedProps([
      ['id', 'next-id'],
      ['title', 'new-title'],
      ['children', 'New label'],
      ['data-state', 'ready']
    ]);

    element.setAttribute('title', 'old-title');
    element.attributeLog = [];
    componentTree.attachHostInstanceNode(element, token, initialProps);

    const handoff = domHost.commitDomPropertyUpdateForLatestProps(
      element,
      'button',
      initialProps,
      nextProps
    );

    assert.deepEqual(attributeEntries(element), [
      ['data-state', 'ready'],
      ['id', 'next-id'],
      ['title', 'new-title']
    ]);
    assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
    assert.equal(
      domHost.rollbackDomPropertyUpdateLatestPropsHandoff(handoff),
      3
    );
    assert.deepEqual(attributeEntries(element), [['title', 'old-title']]);
    assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
    assert.equal(componentTree.detachHostInstanceToken(token), token);
  }

  {
    const element = createElement('fast-widget');
    const value = {answer: 42};

    assert.deepEqual(
      domHost.applyAdmittedDomPropertyPayload(element, [
        {
          kind: propertyPayload.ENTRY_SET_PROPERTY,
          propertyName: 'objectProp',
          value
        },
        {
          kind: propertyPayload.ENTRY_NON_PAYLOAD,
          propName: 'onClick',
          category: 'event',
          reason: 'event props are stored by the future event/latest-props path'
        },
        {
          kind: propertyPayload.ENTRY_REMOVE_PROPERTY,
          propertyName: 'objectProp'
        }
      ]),
      [
        appliedSetProperty('objectProp', value),
        skippedNonPayload(
          'onClick',
          'event',
          'event props are stored by the future event/latest-props path'
        ),
        appliedRemoveProperty('objectProp')
      ]
    );
    assert.equal(element.objectProp, null);
    assert.deepEqual(element.propertyLog, [
      ['setProperty', 'objectProp', value],
      ['setProperty', 'objectProp', null]
    ]);
  }

  {
    const element = createElement('div');

    assert.deepEqual(
      domHost.commitDomPropertyUpdate(
        element,
        'div',
        {},
        orderedProps([
          ['id', 'mixed'],
          ['style', {color: 'red'}],
          ['dangerouslySetInnerHTML', {__html: '<span>raw</span>'}]
        ])
      ),
      [
        appliedSetAttribute('id', 'mixed'),
        styleSet('color', 'propertyAssignment', 'red'),
        innerHtmlSet('<span>raw</span>')
      ]
    );
    assert.deepEqual(element.attributeLog, [['setAttribute', 'id', 'mixed']]);
    assert.deepEqual(element.styleLog, [
      ['stylePropertyAssignment', 'color', 'red'],
      ['setInnerHTML', '<span>raw</span>']
    ]);
    assert.equal(element.assignedInnerHTML, '<span>raw</span>');
  }

  {
    const element = createElement('div');
    const blockedPayloads = [
      propertyPayload.diffDomPropertyPayload(
        'div',
        {},
        orderedProps([['style', {color: 'red'}]])
      ),
      propertyPayload.diffDomPropertyPayload(
        'div',
        {},
        orderedProps([
          ['dangerouslySetInnerHTML', {__html: '<span>raw</span>'}]
        ])
      ),
      propertyPayload.diffDomPropertyPayload(
        'div',
        {},
        orderedProps([['onClick', () => {}]])
      ),
      propertyPayload.diffDomPropertyPayload(
        'input',
        {},
        orderedProps([['value', 'Ada']])
      ),
      [
        {
          kind: propertyPayload.ENTRY_SET_PROPERTY,
          propertyName: 'onClick',
          value: null
        }
      ]
    ];

    for (const payload of blockedPayloads) {
      const error = captureThrown(() =>
        domHost.applyDomPropertyPayload(element, [
          {
            kind: propertyPayload.ENTRY_SET_ATTRIBUTE,
            attributeName: 'id',
            value: 'must-not-apply'
          },
          ...payload
        ])
      );
      assert.ok(error);
      assert.match(
        error.code,
        /^FAST_REACT_DOM_(BLOCKED|INVALID)_PROPERTY_PAYLOAD_ENTRY$/u
      );
    }

    assert.equal(element.getAttribute('id'), null);
    assert.deepEqual(element.attributeLog, []);
    assert.deepEqual(element.propertyLog, []);
  }

  {
    const element = createElement('input');
    const rootOwner = {kind: 'LatestPropsControlledRoot'};
    const hostOwner = {kind: 'LatestPropsControlledHost'};
    const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
    const initialProps = {};

    componentTree.attachHostInstanceNode(element, token, initialProps);

    assert.throws(
      () =>
        domHost.commitDomPropertyUpdateForLatestProps(
          element,
          'input',
          {},
          orderedProps([
            ['id', 'must-not-apply'],
            ['value', 'Ada']
          ])
        ),
      {
        code: 'FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY'
      }
    );
    assert.deepEqual(element.attributeLog, []);
    assert.deepEqual(element.propertyLog, []);
    assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
    assert.equal(componentTree.detachHostInstanceToken(token), token);
  }

  {
    const element = createElement('div');
    const rootOwner = {kind: 'LatestPropsStyleRoot'};
    const hostOwner = {kind: 'LatestPropsStyleHost'};
    const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
    const initialStyle = orderedProps([
      ['color', 'red'],
      ['--gap', '4px']
    ]);
    const initialProps = orderedProps([['style', initialStyle]]);
    const nextProps = orderedProps([
      [
        'style',
        orderedProps([
          ['color', 'blue'],
          ['width', 12]
        ])
      ]
    ]);

    domHost.applyStyleDangerousHtmlPayload(
      element,
      propertyPayload.diffDomPropertyPayload(
        'div',
        {},
        orderedProps([['style', initialStyle]])
      )
    );
    element.styleLog = [];
    componentTree.attachHostInstanceNode(element, token, initialProps);

    const handoff = domHost.commitDomPropertyUpdateForLatestProps(
      element,
      'div',
      initialProps,
      nextProps
    );
    const hiddenHandoff =
      domHost.getDomPropertyUpdateLatestPropsHandoffPayload(handoff);

    assert.deepEqual(hiddenHandoff.mutationRecords, [
      {
        kind: propertyPayload.ENTRY_REMOVE_STYLE,
        propName: 'style',
        styleName: '--gap',
        mutation: 'setProperty',
        value: ''
      },
      styleSet('color', 'propertyAssignment', 'blue'),
      styleSet('width', 'propertyAssignment', '12px')
    ]);
    assert.deepEqual(element.styleLog, [
      ['styleSetProperty', '--gap', ''],
      ['stylePropertyAssignment', 'color', 'blue'],
      ['stylePropertyAssignment', 'width', '12px']
    ]);
    assert.deepEqual(element.activeStyleProperties(), [
      ['color', 'blue'],
      ['width', '12px']
    ]);
    assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
    assert.equal(
      componentTree.commitLatestPropsFromMutationHandoff(handoff),
      nextProps
    );
    assert.equal(componentTree.getLatestPropsFromNode(element), nextProps);
    assert.equal(componentTree.detachHostInstanceToken(token), token);
  }

  {
    const element = createElement('div');
    const rootOwner = {kind: 'LatestPropsInvalidStyleRoot'};
    const hostOwner = {kind: 'LatestPropsInvalidStyleHost'};
    const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
    const initialProps = {};

    componentTree.attachHostInstanceNode(element, token, initialProps);

    assert.throws(
      () =>
        domHost.commitDomPropertyUpdateForLatestProps(
          element,
          'div',
          {},
          orderedProps([
            ['id', 'must-not-apply'],
            ['style', {width: Number.NaN}]
          ])
        ),
      {
        code: 'FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY'
      }
    );
    assert.deepEqual(element.attributeLog, []);
    assert.deepEqual(element.styleLog, []);
    assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
    assert.equal(componentTree.detachHostInstanceToken(token), token);
  }

  {
    const element = createElement('div');
    const rootOwner = {kind: 'LatestPropsThrowingMutationRoot'};
    const hostOwner = {kind: 'LatestPropsThrowingMutationHost'};
    const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
    const initialProps = {};
    const thrownError = new Error('fake setAttribute failed');

    element.setAttribute = function setAttribute() {
      throw thrownError;
    };
    componentTree.attachHostInstanceNode(element, token, initialProps);

    assert.throws(
      () =>
        domHost.commitDomPropertyUpdateForLatestProps(
          element,
          'div',
          {},
          orderedProps([['id', 'must-not-apply']])
        ),
      (error) => error === thrownError
    );
    assert.deepEqual(element.attributeLog, []);
    assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
    assert.equal(componentTree.detachHostInstanceToken(token), token);
  }

  {
    const element = createElement('div');
    const rootOwner = {kind: 'LatestPropsRollbackRoot'};
    const hostOwner = {kind: 'LatestPropsRollbackHost'};
    const token = componentTree.createHostInstanceToken(hostOwner, rootOwner);
    const initialProps = orderedProps([['title', 'old-title']]);
    const nextProps = orderedProps([
      ['id', 'temporary-id'],
      ['data-state', 'ready']
    ]);
    const thrownError = new Error('fake setAttribute failed after mutation');
    const originalSetAttribute = element.setAttribute;

    element.setAttribute('title', 'old-title');
    element.attributeLog = [];
    element.setAttribute = function setAttribute(name, value) {
      originalSetAttribute.call(this, name, value);
      if (String(name) === 'data-state') {
        throw thrownError;
      }
    };
    componentTree.attachHostInstanceNode(element, token, initialProps);

    assert.throws(
      () =>
        domHost.commitDomPropertyUpdateForLatestProps(
          element,
          'div',
          initialProps,
          nextProps
        ),
      (error) => error === thrownError
    );
    assert.deepEqual(attributeEntries(element), [['title', 'old-title']]);
    assert.deepEqual(element.attributeLog, [
      ['removeAttribute', 'title', true],
      ['setAttribute', 'id', 'temporary-id'],
      ['setAttribute', 'data-state', 'ready'],
      ['removeAttribute', 'data-state', true],
      ['removeAttribute', 'id', true],
      ['setAttribute', 'title', 'old-title']
    ]);
    assert.equal(componentTree.getLatestPropsFromNode(element), initialProps);
    assert.equal(componentTree.detachHostInstanceToken(token), token);
  }

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
    const parent = createElement('div');
    const before = createElement('span');
    const text = createText('head');

    parent.appendChild(before);
    assert.equal(domHost.insertBefore(parent, text, before), text);
    assert.deepEqual(childNames(parent), ['#text', 'span']);
    assert.equal(parent.textContent, 'head');
    assert.equal(text.parentNode, parent);
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
    const parent = createElement('div');
    const first = createText('first');
    const second = createText('second');

    parent.appendChild(first);
    parent.appendChild(second);

    assert.equal(domHost.removeChild(parent, first), first);
    assert.deepEqual(childNames(parent), ['#text']);
    assert.equal(parent.textContent, 'second');
    assert.equal(first.parentNode, null);
    assert.equal(second.parentNode, parent);
  }

  {
    const container = createElement('main');
    const first = createText('intro');
    const second = createElement('section');
    const third = createText('outro');

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
    const container = createElement('main');
    const first = createElement('section');
    const second = createText('outro');

    container.appendChild(first);
    container.appendChild(second);

    const clearRecord = domHost.clearContainerForRootUnmount(container);
    const clearPayload =
      domHost.getClearContainerForRootUnmountRecordPayload(clearRecord);

    assert.equal(
      clearRecord.kind,
      domHost.CLEAR_CONTAINER_FOR_ROOT_UNMOUNT_RECORD
    );
    assert.equal(clearRecord.mutation, 'clearContainer');
    assert.equal(clearRecord.status, 'cleared');
    assert.equal(clearRecord.removedChildCount, 2);
    assert.equal(domHost.isClearContainerForRootUnmountRecord(clearRecord), true);
    assert.deepEqual(clearPayload.removedChildren, [first, second]);
    assert.equal(clearPayload.container, container);
    assert.deepEqual(childNames(container), []);
    assert.equal(first.parentNode, null);
    assert.equal(second.parentNode, null);
  }

  {
    const text = createText('old');

    assert.equal(domHost.commitTextUpdate(text, 'old', 'new'), undefined);
    assert.equal(text.data, 'new');
    assert.equal(text.nodeValue, 'new');
    assert.equal(text.textContent, 'new');
    assert.deepEqual(text.writeLog, [['nodeValue', 'new']]);
  }

  {
    const document = new FakeDocument();
    const parent = createElement('div', document);
    const host = domHost.createDomHostElementInstance('section', parent);
    const text = domHost.createDomHostTextInstance('created', parent);
    const documentHost = domHost.createDomHostElementInstance('aside', document);
    const documentText = domHost.createDomHostTextInstance(9, document);

    assert.equal(host.nodeName, 'section');
    assert.equal(host.ownerDocument, document);
    assert.equal(documentHost.nodeName, 'aside');
    assert.equal(documentHost.ownerDocument, document);
    assert.equal(text.nodeName, '#text');
    assert.equal(text.ownerDocument, document);
    assert.equal(text.textContent, 'created');
    assert.equal(documentText.textContent, '9');
    assert.deepEqual(document.createdTextNodes, ['created', '9']);

    assert.equal(domHost.appendChild(parent, text), text);
    assert.deepEqual(childNames(parent), ['#text']);
    assert.equal(parent.textContent, 'created');

    assert.throws(() => domHost.createDomHostTextInstance('missing', {}), {
      code: 'FAST_REACT_DOM_INVALID_TEXT_CREATION_TARGET'
    });
    assert.throws(() => domHost.createDomHostElementInstance('', parent), {
      code: 'FAST_REACT_DOM_INVALID_ELEMENT_TYPE'
    });
    assert.throws(() => domHost.createDomHostElementInstance('main', {}), {
      code: 'FAST_REACT_DOM_INVALID_TEXT_CREATION_TARGET'
    });
  }

  {
    const parent = createElement('div');
    const text = createText('managed');

    parent.appendChild(text);
    assert.equal(parent.textContent, 'managed');

    assert.equal(domHost.setTextContent(parent, 'updated'), undefined);
    assert.equal(parent.firstChild, text);
    assert.deepEqual(childNames(parent), ['#text']);
    assert.equal(parent.textContent, 'updated');
    assert.deepEqual(text.writeLog, [['nodeValue', 'updated']]);

    assert.equal(domHost.resetTextContent(parent), undefined);
    assert.equal(parent.textContent, '');
    assert.deepEqual(childNames(parent), []);
    assert.equal(text.parentNode, null);

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

  {
    const element = createElement('div');
    const payload = [
      {
        kind: 'setStyle',
        propName: 'style',
        styleName: 'color',
        mutation: 'propertyAssignment',
        value: 'red'
      },
      {
        kind: 'setStyle',
        propName: 'style',
        styleName: '--gap',
        mutation: 'setProperty',
        value: '4px'
      },
      {
        kind: 'removeStyle',
        propName: 'style',
        styleName: 'color',
        mutation: 'propertyAssignment',
        value: ''
      },
      {
        kind: 'setInnerHTML',
        propName: 'dangerouslySetInnerHTML',
        propertyName: 'innerHTML',
        value: '<span>raw</span>'
      }
    ];

    assert.deepEqual(
      domHost.applyStyleDangerousHtmlPayload(element, payload),
      payload
    );
    assert.deepEqual(element.styleLog, [
      ['stylePropertyAssignment', 'color', 'red'],
      ['styleSetProperty', '--gap', '4px'],
      ['stylePropertyAssignment', 'color', ''],
      ['setInnerHTML', '<span>raw</span>']
    ]);
    assert.deepEqual(element.activeStyleProperties(), [['--gap', '4px']]);
    assert.equal(element.assignedInnerHTML, '<span>raw</span>');
    assert.deepEqual(childNames(element), []);
  }

  {
    const element = createElement('div');
    const child = createElement('span', element.ownerDocument);

    element.style.color = 'green';
    element.assignedInnerHTML = '<em>old</em>';
    element.appendChild(child);
    element.styleLog = [];

    const mutationRecords = domHost.applyStyleDangerousHtmlPayload(element, [
      styleSet('color', 'propertyAssignment', 'red'),
      innerHtmlSet('<span>raw</span>')
    ]);
    const diagnostic =
      domHost.getDomPropertyPayloadMutationRecordsPayload(mutationRecords);

    assert.equal(
      domHost.isDomPropertyPayloadMutationRecords(mutationRecords),
      true
    );
    assert.equal(diagnostic.rollbackRecordCount, 2);
    assert.equal(diagnostic.node, element);
    assert.equal(Object.hasOwn(mutationRecords, 'node'), false);
    assert.deepEqual(element.activeStyleProperties(), [['color', 'red']]);
    assert.equal(element.assignedInnerHTML, '<span>raw</span>');
    assert.deepEqual(childNames(element), []);

    assert.equal(
      domHost.rollbackDomPropertyPayloadMutationRecords(mutationRecords),
      2
    );
    assert.deepEqual(element.activeStyleProperties(), [['color', 'green']]);
    assert.equal(element.assignedInnerHTML, '<em>old</em>');
    assert.deepEqual(childNames(element), ['span']);
    assert.equal(child.parentNode, element);
  }

  {
    const element = createElement('div');
    const thrownError = new Error('fake innerHTML failed after mutation');

    element.style.color = 'green';
    element.assignedInnerHTML = '<em>old</em>';
    element.throwNextInnerHTMLAfterAssign = thrownError;
    element.styleLog = [];

    assert.throws(
      () =>
        domHost.applyStyleDangerousHtmlPayload(element, [
          styleSet('color', 'propertyAssignment', 'red'),
          innerHtmlSet('<span>raw</span>')
        ]),
      (error) => error === thrownError
    );
    assert.deepEqual(element.activeStyleProperties(), [['color', 'green']]);
    assert.equal(element.assignedInnerHTML, '<em>old</em>');
    assert.deepEqual(element.styleLog, [
      ['stylePropertyAssignment', 'color', 'red'],
      ['setInnerHTML', '<span>raw</span>'],
      ['setInnerHTML', '<em>old</em>'],
      ['stylePropertyAssignment', 'color', 'green']
    ]);
  }

  {
    const element = createElement('div');

    assert.throws(
      () =>
        domHost.applyStyleDangerousHtmlPayload(element, [
          {
            kind: 'setAttribute',
            propName: 'id',
            attributeName: 'id',
            value: 'ordinary-attribute'
          }
        ]),
      {
        code: 'FAST_REACT_DOM_UNSUPPORTED_PAYLOAD_ENTRY'
      }
    );
    assert.deepEqual(element.styleLog, []);
    assert.deepEqual(element.activeStyleProperties(), []);
    assert.equal(element.assignedInnerHTML, null);
  }

  console.log('React DOM private mutation adapter shell smoke checks passed.');
}

function createElement(nodeName, ownerDocument = new FakeDocument()) {
  return ownerDocument.createElement(nodeName);
}

function createText(text, ownerDocument = new FakeDocument()) {
  return ownerDocument.createTextNode(text);
}

function childNames(parent) {
  return parent.childNodes.map((child) => child.nodeName);
}

function orderedProps(entries) {
  const props = {};
  for (const [key, value] of entries) {
    props[key] = value;
  }
  return props;
}

function attributeEntries(element) {
  return [...element.attributes.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function appliedSetAttribute(attributeName, value) {
  return {
    kind: propertyPayload.ENTRY_SET_ATTRIBUTE,
    attributeName,
    value
  };
}

function appliedRemoveAttribute(attributeName) {
  return {
    kind: propertyPayload.ENTRY_REMOVE_ATTRIBUTE,
    attributeName
  };
}

function appliedSetProperty(propertyName, value) {
  return {
    kind: propertyPayload.ENTRY_SET_PROPERTY,
    propertyName,
    value
  };
}

function appliedRemoveProperty(propertyName) {
  return {
    kind: propertyPayload.ENTRY_REMOVE_PROPERTY,
    propertyName,
    value: null
  };
}

function skippedNonPayload(propName, category, reason) {
  return {
    kind: propertyPayload.ENTRY_NON_PAYLOAD,
    propName,
    category,
    reason,
    status: 'skipped'
  };
}

function styleSet(styleName, mutation, value) {
  return {
    kind: propertyPayload.ENTRY_SET_STYLE,
    propName: 'style',
    styleName,
    mutation,
    value
  };
}

function innerHtmlSet(value) {
  return {
    kind: propertyPayload.ENTRY_SET_INNER_HTML,
    propName: 'dangerouslySetInnerHTML',
    propertyName: 'innerHTML',
    value
  };
}

function captureThrown(operation) {
  try {
    operation();
  } catch (error) {
    return error;
  }
  return null;
}

class FakeNode {
  constructor(nodeName, nodeType, ownerDocument) {
    this.childNodes = [];
    this.nodeName = nodeName;
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
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

class FakeDocument {
  constructor() {
    this.createdTextNodes = [];
    this.nodeName = '#document';
    this.nodeType = 9;
    this.ownerDocument = this;
  }

  createElement(nodeName) {
    return new FakeElement(nodeName, this);
  }

  createTextNode(text) {
    const textNode = new FakeText(text, this);
    this.createdTextNodes.push(String(text));
    return textNode;
  }
}

class FakeElement extends FakeNode {
  constructor(nodeName, ownerDocument) {
    super(nodeName, 1, ownerDocument);
    this._textContent = '';
    this._boolProp = null;
    this._objectProp = null;
    this.assignedInnerHTML = null;
    this.attributes = new Map();
    this.attributeLog = [];
    this.propertyLog = [];
    this.styleLog = [];
    this.style = new FakeStyle(this);
    this.throwNextInnerHTMLAfterAssign = null;
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
    this.assignedInnerHTML = null;
  }

  get innerHTML() {
    return this.assignedInnerHTML ?? '';
  }

  set innerHTML(value) {
    const html = String(value);
    for (const child of [...this.childNodes]) {
      detachFromParent(child);
    }
    this.assignedInnerHTML = html;
    this.styleLog.push(['setInnerHTML', html]);
    if (this.throwNextInnerHTMLAfterAssign !== null) {
      const error = this.throwNextInnerHTMLAfterAssign;
      this.throwNextInnerHTMLAfterAssign = null;
      throw error;
    }
  }

  activeStyleProperties() {
    return Array.from(this.style.properties.entries())
      .filter(([, value]) => value !== '')
      .sort(([left], [right]) => left.localeCompare(right));
  }

  get boolProp() {
    return this._boolProp;
  }

  set boolProp(value) {
    this.propertyLog.push(['setProperty', 'boolProp', value]);
    this._boolProp = value;
  }

  get objectProp() {
    return this._objectProp;
  }

  set objectProp(value) {
    this.propertyLog.push(['setProperty', 'objectProp', value]);
    this._objectProp = value;
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

class FakeStyle {
  constructor(ownerElement) {
    this.ownerElement = ownerElement;
    this.properties = new Map();

    return new Proxy(this, {
      set(target, property, value, receiver) {
        if (shouldRecordStyleProperty(property)) {
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

class FakeText extends FakeNode {
  constructor(text, ownerDocument) {
    super('#text', 3, ownerDocument);
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

function shouldRecordStyleProperty(property) {
  return (
    typeof property === 'string' &&
    !property.startsWith('_') &&
    !['ownerElement', 'properties', 'setProperty'].includes(property)
  );
}

runSmokeChecks();
