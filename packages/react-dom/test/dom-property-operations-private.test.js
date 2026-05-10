'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(packageRoot, 'package.json'));
const propertyOperations = require(
  path.join(packageRoot, 'src/client/dom-property-operations.js')
);
const propertyPayload = require(
  path.join(packageRoot, 'src/dom-host/property-payload.js')
);

const {
  DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA,
  createDangerousHtmlTextResetDiagnostic
} = propertyOperations;
const {
  ENTRY_NON_PAYLOAD,
  ENTRY_SET_INNER_HTML,
  ENTRY_UNSUPPORTED
} = propertyPayload;

test('private dangerous HTML/text reset gate records metadata without public export', () => {
  assert.equal(
    Object.keys(packageJson.exports).includes(
      './src/client/dom-property-operations'
    ),
    false
  );
  assert.equal(DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA.gateVersion, 1);
  assert.equal(
    DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA.realDomInnerHTMLWrites,
    false
  );
  assert.equal(
    DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA.publicDomMutation,
    false
  );
  assert.equal(
    DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA.compatibilityClaimed,
    false
  );
  assert.deepEqual(
    DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA.supportedBlockedRowIds,
    [
      'dangerous-html-set-inner-html-blocked',
      'dangerous-html-to-managed-text-set-text-content-blocked',
      'dangerous-html-to-managed-child-reset-text-content-blocked',
      'managed-text-to-dangerous-html-set-inner-html-blocked'
    ]
  );
});

test('private dangerous HTML diagnostics record blocked innerHTML update rows', () => {
  const diagnostic = createDangerousHtmlTextResetDiagnostic(
    'div',
    {
      dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
    },
    {
      dangerouslySetInnerHTML: {__html: '<em>After</em>'}
    }
  );

  assert.equal(diagnostic.previousText, null);
  assert.equal(diagnostic.previousHtml, '<span>Before</span>');
  assert.equal(diagnostic.nextText, null);
  assert.equal(diagnostic.nextHtml, '<em>After</em>');
  assert.equal(diagnostic.previousShouldSetTextContent, true);
  assert.equal(diagnostic.nextShouldSetTextContent, true);
  assert.deepEqual(diagnostic.resetDecision, {
    previousShouldSetTextContent: true,
    nextShouldSetTextContent: true,
    shouldResetTextContent: false,
    contentResetFlagBlocked: false,
    reason: 'next-direct-text-or-html-overwrites-previous-content',
    realDomResetApplied: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(diagnostic.propertyPayloadRows, [
    {
      kind: ENTRY_SET_INNER_HTML,
      propName: 'dangerouslySetInnerHTML',
      propertyName: 'innerHTML',
      value: '<em>After</em>'
    }
  ]);
  assert.deepEqual(diagnostic.blockedMutationRows, [
    {
      id: 'dangerous-html-set-inner-html-blocked',
      kind: ENTRY_SET_INNER_HTML,
      mutation: 'innerHTML',
      propertyName: 'innerHTML',
      propName: 'dangerouslySetInnerHTML',
      value: '<em>After</em>',
      status: 'blocked',
      realDomMutation: false,
      publicCompatibilityEnabled: false,
      compatibilityClaimed: false
    }
  ]);
  assertCompatibilityFalse(diagnostic);
});

test('private dangerous HTML diagnostics record blocked HTML-to-text rows', () => {
  const diagnostic = createDangerousHtmlTextResetDiagnostic(
    'div',
    {
      dangerouslySetInnerHTML: {__html: '<em>After</em>'}
    },
    {
      dangerouslySetInnerHTML: undefined,
      children: 'Managed child'
    }
  );

  assert.equal(diagnostic.previousHtml, '<em>After</em>');
  assert.equal(diagnostic.nextText, 'Managed child');
  assert.equal(diagnostic.nextHtml, null);
  assert.equal(diagnostic.resetDecision.shouldResetTextContent, false);
  assert.deepEqual(diagnostic.propertyPayloadRows, [
    {
      kind: ENTRY_NON_PAYLOAD,
      propName: 'dangerouslySetInnerHTML',
      category: 'dangerouslySetInnerHTML-nullish',
      reason:
        'nullish dangerouslySetInnerHTML does not assign innerHTML; managed children and text-content paths own clearing'
    },
    {
      kind: ENTRY_NON_PAYLOAD,
      propName: 'children',
      category: 'children',
      reason: 'children are handled by text-content reconciliation'
    }
  ]);
  assert.deepEqual(diagnostic.blockedMutationRows, [
    {
      id: 'dangerous-html-to-managed-text-set-text-content-blocked',
      kind: 'setTextContent',
      mutation: 'textContent',
      propertyName: 'textContent',
      propName: 'children',
      value: 'Managed child',
      status: 'blocked',
      realDomMutation: false,
      publicCompatibilityEnabled: false,
      compatibilityClaimed: false
    }
  ]);
  assertCompatibilityFalse(diagnostic);
});

test('private dangerous HTML diagnostics record blocked text-to-HTML rows', () => {
  const diagnostic = createDangerousHtmlTextResetDiagnostic(
    'div',
    {children: 'Managed text'},
    {
      dangerouslySetInnerHTML: {__html: '<em>Raw again</em>'}
    }
  );

  assert.equal(diagnostic.previousText, 'Managed text');
  assert.equal(diagnostic.previousHtml, null);
  assert.equal(diagnostic.nextText, null);
  assert.equal(diagnostic.nextHtml, '<em>Raw again</em>');
  assert.equal(diagnostic.resetDecision.shouldResetTextContent, false);
  assert.deepEqual(diagnostic.blockedMutationRows, [
    {
      id: 'dangerous-html-set-inner-html-blocked',
      kind: ENTRY_SET_INNER_HTML,
      mutation: 'innerHTML',
      propertyName: 'innerHTML',
      propName: 'dangerouslySetInnerHTML',
      value: '<em>Raw again</em>',
      status: 'blocked',
      realDomMutation: false,
      publicCompatibilityEnabled: false,
      compatibilityClaimed: false
    }
  ]);
  assertCompatibilityFalse(diagnostic);
});

test('private dangerous HTML diagnostics record reset decisions without mutating DOM', () => {
  const mutationLog = [];
  const hostNode = {
    get innerHTML() {
      return '<span>Before</span>';
    },
    set innerHTML(value) {
      mutationLog.push(['setInnerHTML', value]);
      throw new Error('real DOM innerHTML setter must not be called');
    },
    set textContent(value) {
      mutationLog.push(['setTextContent', value]);
      throw new Error('real DOM textContent setter must not be called');
    }
  };

  const diagnostic = createDangerousHtmlTextResetDiagnostic(
    'section',
    {
      dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
    },
    {
      children: [{type: 'span', props: {children: 'Managed child'}}]
    },
    {hostNode}
  );

  assert.deepEqual(mutationLog, []);
  assert.equal(diagnostic.previousHtml, '<span>Before</span>');
  assert.equal(diagnostic.nextText, null);
  assert.equal(diagnostic.nextHtml, null);
  assert.equal(diagnostic.nextContentSource, 'children-non-text');
  assert.deepEqual(diagnostic.resetDecision, {
    previousShouldSetTextContent: true,
    nextShouldSetTextContent: false,
    shouldResetTextContent: true,
    contentResetFlagBlocked: true,
    reason: 'previous-direct-text-or-html-to-managed-children',
    realDomResetApplied: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(diagnostic.blockedMutationRows, [
    {
      id: 'dangerous-html-to-managed-child-reset-text-content-blocked',
      kind: 'resetTextContent',
      mutation: 'textContent',
      propertyName: 'textContent',
      value: '',
      status: 'blocked',
      realDomMutation: false,
      publicCompatibilityEnabled: false,
      compatibilityClaimed: false
    }
  ]);
  assertCompatibilityFalse(diagnostic);
});

test('private dangerous HTML diagnostics fail closed for children conflicts', () => {
  const diagnostic = createDangerousHtmlTextResetDiagnostic(
    'div',
    {},
    {
      dangerouslySetInnerHTML: {__html: '<strong>bad</strong>'},
      children: 'conflict'
    }
  );

  assert.equal(diagnostic.nextText, 'conflict');
  assert.equal(diagnostic.nextHtml, '<strong>bad</strong>');
  assert.equal(
    diagnostic.nextContentSource,
    'children-and-dangerouslySetInnerHTML'
  );
  assert.deepEqual(diagnostic.blockedMutationRows, [
    {
      id: 'unsupported-property-payload-blocked',
      kind: ENTRY_UNSUPPORTED,
      mutation: 'unsupportedPropertyPayload',
      propName: 'dangerouslySetInnerHTML',
      category: 'dangerouslySetInnerHTML-children-conflict',
      reason: 'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
      status: 'blocked',
      realDomMutation: false,
      publicCompatibilityEnabled: false,
      compatibilityClaimed: false
    }
  ]);
  assertCompatibilityFalse(diagnostic);
});

function assertCompatibilityFalse(diagnostic) {
  assert.equal(diagnostic.sideEffects.realDomMutated, false);
  assert.equal(diagnostic.sideEffects.realDomInnerHTMLWritten, false);
  assert.equal(diagnostic.sideEffects.realDomTextContentWritten, false);
  assert.equal(diagnostic.sideEffects.publicRootTouched, false);
  assert.equal(diagnostic.sideEffects.publicCompatibilityEnabled, false);
  assert.equal(diagnostic.sideEffects.compatibilityClaimed, false);
  assert.equal(diagnostic.publicCompatibilityEnabled, false);
  assert.equal(diagnostic.compatibilityClaimed, false);
  for (const row of diagnostic.blockedMutationRows) {
    assert.equal(row.realDomMutation, false, row.id);
    assert.equal(row.publicCompatibilityEnabled, false, row.id);
    assert.equal(row.compatibilityClaimed, false, row.id);
  }
}
