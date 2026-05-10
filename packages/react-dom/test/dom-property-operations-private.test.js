'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const propertyPayload = require(path.join(
  __dirname,
  '..',
  'src',
  'dom-host',
  'property-payload.js'
));

const {
  ENTRY_REMOVE_STYLE,
  ENTRY_SET_STYLE,
  ENTRY_UNSUPPORTED,
  PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_KIND,
  PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_COMPATIBILITY_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_MUTATION_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_ROW_KIND,
  PRIVATE_STYLE_OBJECT_DIFF_UNSUPPORTED_ROW_KIND,
  PRIVATE_STYLE_OBJECT_DIFF_UNSUPPORTED_STATUS,
  recordPrivateDomStyleObjectDiffDiagnostics
} = propertyPayload;

test('private DOM style object diff diagnostics record set/remove rows without DOM writes', () => {
  const previousStyle = orderedStyle([
    ['color', 'red'],
    ['marginTop', 4],
    ['opacity', 0.5],
    ['flex', 1],
    ['--gap', '4px'],
    ['paddingLeft', '1em']
  ]);
  const nextStyle = orderedStyle([
    ['color', 'blue'],
    ['marginTop', 0],
    ['lineHeight', 1.2],
    ['flex', 2],
    ['--gap', null],
    ['width', 12],
    ['zIndex', 3]
  ]);

  const diagnostic = recordPrivateDomStyleObjectDiffDiagnostics(
    previousStyle,
    nextStyle
  );

  assert.equal(diagnostic.kind, PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_KIND);
  assert.equal(diagnostic.status, PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_STATUS);
  assert.equal(diagnostic.compatibilityTarget, 'react-dom@19.2.6');
  assert.equal(diagnostic.propertyPayloadBacked, true);
  assert.equal(diagnostic.payloadRowsAccepted, true);
  assert.equal(Object.isFrozen(diagnostic), true);
  assert.deepEqual(diagnostic.payloadRows, [
    removeStyle('opacity', 'propertyAssignment'),
    removeStyle('paddingLeft', 'propertyAssignment'),
    setStyle('color', 'propertyAssignment', 'blue'),
    setStyle('marginTop', 'propertyAssignment', '0'),
    setStyle('lineHeight', 'propertyAssignment', '1.2'),
    setStyle('flex', 'propertyAssignment', '2'),
    removeStyle('--gap', 'setProperty'),
    setStyle('width', 'propertyAssignment', '12px'),
    setStyle('zIndex', 'propertyAssignment', '3')
  ]);
  assert.deepEqual(diagnostic.summary, {
    rowCount: 9,
    payloadRowCount: 9,
    setStyleCount: 6,
    removeStyleCount: 3,
    additionRowCount: 3,
    changeRowCount: 3,
    removalRowCount: 3,
    unsupportedRowCount: 0,
    unitlessRowCount: 4,
    unitlessSetRowCount: 3,
    customPropertyRowCount: 1,
    numericWithoutPxRowCount: 4,
    pxAppendedRowCount: 1,
    zeroNumericRowCount: 1,
    propertyAssignmentCount: 8,
    setPropertyCount: 1,
    mutatingRowCount: 0,
    realDomNodeMutated: false,
    browserDomMutation: false,
    fakeDomMutation: false,
    compatibilityClaimed: false,
    publicMutationBlocked: true,
    rowKinds: [ENTRY_REMOVE_STYLE, ENTRY_SET_STYLE]
  });
  assert.deepEqual(
    diagnostic.styleObjectDiffRows.map((row) => ({
      kind: row.kind,
      payloadKind: row.payloadKind,
      styleName: row.styleName,
      action: row.action,
      removalReason: row.removalReason,
      mutation: row.mutation,
      value: row.value,
      customProperty: row.customProperty,
      unitless: row.unitless,
      numericValue: row.numericValue,
      unitlessNumber: row.unitlessNumber,
      numericWithoutPx: row.numericWithoutPx,
      pxAppended: row.pxAppended,
      zeroNumericValue: row.zeroNumericValue,
      realDomNodeMutated: row.realDomNodeMutated,
      publicMutationBlocked: row.publicMutationBlocked,
      compatibilityClaimed: row.compatibilityClaimed
    })),
    [
      row('opacity', ENTRY_REMOVE_STYLE, 'remove', 'propertyAssignment', '', {
        removalReason: 'omitted-next-style-property',
        unitless: true
      }),
      row(
        'paddingLeft',
        ENTRY_REMOVE_STYLE,
        'remove',
        'propertyAssignment',
        '',
        {removalReason: 'omitted-next-style-property'}
      ),
      row('color', ENTRY_SET_STYLE, 'change', 'propertyAssignment', 'blue'),
      row('marginTop', ENTRY_SET_STYLE, 'change', 'propertyAssignment', '0', {
        numericValue: true,
        numericWithoutPx: true,
        zeroNumericValue: true
      }),
      row('lineHeight', ENTRY_SET_STYLE, 'add', 'propertyAssignment', '1.2', {
        numericValue: true,
        unitless: true,
        unitlessNumber: true,
        numericWithoutPx: true
      }),
      row('flex', ENTRY_SET_STYLE, 'change', 'propertyAssignment', '2', {
        numericValue: true,
        unitless: true,
        unitlessNumber: true,
        numericWithoutPx: true
      }),
      row('--gap', ENTRY_REMOVE_STYLE, 'remove', 'setProperty', '', {
        removalReason: 'nullish-empty-or-boolean-next-value',
        customProperty: true
      }),
      row('width', ENTRY_SET_STYLE, 'add', 'propertyAssignment', '12px', {
        numericValue: true,
        pxAppended: true
      }),
      row('zIndex', ENTRY_SET_STYLE, 'add', 'propertyAssignment', '3', {
        numericValue: true,
        unitless: true,
        unitlessNumber: true,
        numericWithoutPx: true
      })
    ]
  );

  const colorRow = diagnostic.styleObjectDiffRows[2];
  const lineHeightRow = diagnostic.styleObjectDiffRows[4];
  const customRemovalRow = diagnostic.styleObjectDiffRows[6];
  assert.deepEqual(colorRow.previousValue, {
    present: true,
    type: 'string',
    empty: false
  });
  assert.deepEqual(colorRow.nextValue, {
    present: true,
    type: 'string',
    empty: false
  });
  assert.deepEqual(lineHeightRow.previousValue, {
    present: false,
    type: 'missing'
  });
  assert.deepEqual(customRemovalRow.nextValue, {
    present: true,
    type: 'null'
  });

  assert.deepEqual(diagnostic.blockedCapabilities, [
    {
      id: 'real-browser-dom-style-mutation',
      blocked: true,
      status: PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_MUTATION_STATUS,
      reason:
        'The diagnostic records property-payload style rows without writing to a browser DOM node.'
    },
    {
      id: 'public-style-compatibility',
      blocked: true,
      status: PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_COMPATIBILITY_STATUS,
      reason:
        'The diagnostic is private metadata and does not claim React DOM style compatibility.'
    }
  ]);
  assert.deepEqual(diagnostic.blockedPublicMutation, {
    status: PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_MUTATION_STATUS,
    realDomNodeRequired: false,
    browserDomMutation: false,
    fakeDomMutation: false,
    styleObjectMutated: false,
    propertyAssignmentInvoked: false,
    setPropertyInvoked: false
  });
  assert.deepEqual(diagnostic.blockedPublicCompatibility, {
    status: PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_COMPATIBILITY_STATUS,
    reactDomCompared: false,
    browserDomCompared: false,
    serverRenderingCompared: false,
    publicStyleCompatibility: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(diagnostic.sideEffects, {
    realDomNodeMutated: false,
    browserDomMutation: false,
    fakeDomMutation: false,
    styleObjectMutated: false,
    latestPropsPublished: false,
    propertyAssignmentInvoked: false,
    setPropertyInvoked: false,
    compatibilityClaimed: false
  });
});

test('private DOM style object diff diagnostics fail closed for unsupported rows', () => {
  const diagnostic = recordPrivateDomStyleObjectDiffDiagnostics(
    null,
    orderedStyle([
      ['width', Number.NaN],
      ['background-color', 'red']
    ])
  );

  assert.equal(diagnostic.status, PRIVATE_STYLE_OBJECT_DIFF_UNSUPPORTED_STATUS);
  assert.equal(diagnostic.payloadRowsAccepted, false);
  assert.deepEqual(diagnostic.summary, {
    rowCount: 2,
    payloadRowCount: 2,
    setStyleCount: 0,
    removeStyleCount: 0,
    additionRowCount: 0,
    changeRowCount: 0,
    removalRowCount: 0,
    unsupportedRowCount: 2,
    unitlessRowCount: 0,
    unitlessSetRowCount: 0,
    customPropertyRowCount: 0,
    numericWithoutPxRowCount: 0,
    pxAppendedRowCount: 0,
    zeroNumericRowCount: 0,
    propertyAssignmentCount: 0,
    setPropertyCount: 0,
    mutatingRowCount: 0,
    realDomNodeMutated: false,
    browserDomMutation: false,
    fakeDomMutation: false,
    compatibilityClaimed: false,
    publicMutationBlocked: true,
    rowKinds: [ENTRY_UNSUPPORTED]
  });
  assert.deepEqual(diagnostic.styleObjectDiffRows, [
    {
      kind: PRIVATE_STYLE_OBJECT_DIFF_UNSUPPORTED_ROW_KIND,
      payloadKind: ENTRY_UNSUPPORTED,
      propName: 'style',
      action: 'blocked',
      category: 'style-non-finite-number',
      reason:
        'non-finite numeric style values require warning diagnostics outside this data-only helper',
      styleName: 'width',
      realDomNodeMutated: false,
      publicMutationBlocked: true,
      compatibilityClaimed: false
    },
    {
      kind: PRIVATE_STYLE_OBJECT_DIFF_UNSUPPORTED_ROW_KIND,
      payloadKind: ENTRY_UNSUPPORTED,
      propName: 'style',
      action: 'blocked',
      category: 'unsupported-style-name',
      reason:
        'this data-only style slice only covers oracle-backed style names and CSS custom properties',
      styleName: 'background-color',
      realDomNodeMutated: false,
      publicMutationBlocked: true,
      compatibilityClaimed: false
    }
  ]);

  const shapeDiagnostic = recordPrivateDomStyleObjectDiffDiagnostics(
    null,
    'color:red'
  );
  assert.equal(
    shapeDiagnostic.status,
    PRIVATE_STYLE_OBJECT_DIFF_UNSUPPORTED_STATUS
  );
  assert.equal(shapeDiagnostic.summary.unsupportedRowCount, 1);
  assert.equal(
    shapeDiagnostic.styleObjectDiffRows[0].category,
    'style-shape-validation'
  );
  assert.equal(shapeDiagnostic.sideEffects.browserDomMutation, false);
  assert.equal(shapeDiagnostic.blockedPublicMutation.browserDomMutation, false);
  assert.equal(
    shapeDiagnostic.blockedPublicCompatibility.compatibilityClaimed,
    false
  );
});

function orderedStyle(entries) {
  const style = {};
  for (const [key, value] of entries) {
    style[key] = value;
  }
  return style;
}

function setStyle(styleName, mutation, value) {
  return {
    kind: ENTRY_SET_STYLE,
    propName: 'style',
    styleName,
    mutation,
    value
  };
}

function removeStyle(styleName, mutation) {
  return {
    kind: ENTRY_REMOVE_STYLE,
    propName: 'style',
    styleName,
    mutation,
    value: ''
  };
}

function row(styleName, payloadKind, action, mutation, value, options) {
  return {
    kind: PRIVATE_STYLE_OBJECT_DIFF_ROW_KIND,
    payloadKind,
    styleName,
    action,
    removalReason: options?.removalReason ?? null,
    mutation,
    value,
    customProperty: options?.customProperty ?? false,
    unitless: options?.unitless ?? false,
    numericValue: options?.numericValue ?? false,
    unitlessNumber: options?.unitlessNumber ?? false,
    numericWithoutPx: options?.numericWithoutPx ?? false,
    pxAppended: options?.pxAppended ?? false,
    zeroNumericValue: options?.zeroNumericValue ?? false,
    realDomNodeMutated: false,
    publicMutationBlocked: true,
    compatibilityClaimed: false
  };
}
