'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(packageRoot, 'package.json'));
const propertyOperations = require(
  path.join(packageRoot, 'src/client/dom-property-operations.js')
);
const componentTree = require(
  path.join(packageRoot, 'src/client/component-tree.js')
);
const propertyPayload = require(
  path.join(packageRoot, 'src/dom-host/property-payload.js')
);
const domHost = require(path.join(packageRoot, 'src/dom-host/mutation.js'));
const rootBridge = require(path.join(packageRoot, 'src/client/root-bridge.js'));

const {
  DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA,
  createDangerousHtmlTextResetDiagnostic,
  getDangerousHtmlTextResetDiagnosticPayload,
  isDangerousHtmlTextResetDiagnostic
} = propertyOperations;

const {
  ENTRY_NON_PAYLOAD,
  ENTRY_REMOVE_STYLE,
  ENTRY_SET_INNER_HTML,
  ENTRY_SET_STYLE,
  ENTRY_UNSUPPORTED,
  PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_METADATA_KIND,
  PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_KIND,
  PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_METADATA_KIND,
  PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_STATUS,
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

test('private root host-output update records accepted style rows as fake-DOM commit metadata', () => {
  const fixture = createPrivateStyleCommitFixture();
  const nextProps = {
    style: orderedStyle([
      ['color', 'blue'],
      ['width', 12]
    ]),
    children: 'stable'
  };
  const update = fixture.bridge.renderContainer(fixture.create.handle, {
    props: nextProps,
    type: 'div'
  });

  fixture.host.styleLog = [];

  const handoff = fixture.bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: fixture.token,
    nextProps,
    tag: 'div'
  });
  const payload =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);
  const styleCommit = payload.styleObjectDiffCommit;

  assert.equal(
    styleCommit.publicMetadata.kind,
    PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_METADATA_KIND
  );
  assert.equal(
    styleCommit.publicMetadata.status,
    PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_STATUS
  );
  assert.deepEqual(styleCommit.publicMetadata, {
    kind: PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_METADATA_KIND,
    status: PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_STATUS,
    sourceDiagnosticKind: PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_KIND,
    sourceDiagnosticStatus: PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_STATUS,
    sourceRequestId: update.requestId,
    sourceUpdateId: update.updateId,
    propName: 'style',
    payloadRowCount: 4,
    commitMutationRecordCount: 4,
    setStyleCount: 2,
    removeStyleCount: 2,
    propertyAssignmentCount: 3,
    setPropertyCount: 1,
    rowKinds: [ENTRY_REMOVE_STYLE, ENTRY_SET_STYLE],
    propertyPayloadBacked: true,
    payloadRowsAccepted: true,
    fakeDomCommitHandoff: true,
    fakeDomMutation: true,
    realDomStyleMutation: false,
    browserDomMutation: false,
    publicRootCompatibility: false,
    publicStyleCompatibility: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(styleCommit.payloadRows, [
    removeStyle('marginTop', 'propertyAssignment'),
    removeStyle('--gap', 'setProperty'),
    setStyle('color', 'propertyAssignment', 'blue'),
    setStyle('width', 'propertyAssignment', '12px')
  ]);
  assert.deepEqual(styleCommit.mutationRecords, styleCommit.payloadRows);
  assert.equal(styleCommit.diagnostic.payloadRowsAccepted, true);
  assert.equal(styleCommit.diagnostic.sideEffects.fakeDomMutation, false);
  assert.equal(styleCommit.diagnostic.sideEffects.browserDomMutation, false);
  assert.equal(styleCommit.diagnostic.sideEffects.compatibilityClaimed, false);
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.deepEqual(fixture.host.styleLog, [
    ['stylePropertyAssignment', 'marginTop', ''],
    ['styleSetProperty', '--gap', ''],
    ['stylePropertyAssignment', 'color', 'blue'],
    ['stylePropertyAssignment', 'width', '12px']
  ]);
  assert.deepEqual(activeStyleProperties(fixture.host), [
    ['color', 'blue'],
    ['width', '12px']
  ]);

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('blue'), false);
  assert.equal(serialized.includes('12px'), false);

  cleanupPrivateStyleCommitFixture(fixture);
});

test('private root host-output style commit rejects stale and unsupported style rows', () => {
  const staleFixture = createPrivateStyleCommitFixture('stale-style-commit');
  const staleNextProps = {
    style: orderedStyle([['color', 'blue']]),
    children: 'stable'
  };
  const latestNextProps = {
    style: orderedStyle([['height', 10]]),
    children: 'stable'
  };
  const staleUpdate = staleFixture.bridge.renderContainer(
    staleFixture.create.handle,
    {
      props: staleNextProps,
      type: 'div'
    }
  );
  staleFixture.bridge.renderContainer(staleFixture.create.handle, {
    props: latestNextProps,
    type: 'div'
  });
  staleFixture.host.styleLog = [];

  assert.throws(
    () =>
      staleFixture.bridge.applyHostOutputUpdate(staleUpdate, {
        hostInstanceToken: staleFixture.token,
        nextProps: staleNextProps,
        tag: 'div'
      }),
    {
      code: 'FAST_REACT_DOM_INVALID_HOST_OUTPUT_UPDATE_HANDOFF'
    }
  );
  assert.deepEqual(staleFixture.host.styleLog, []);
  assert.deepEqual(activeStyleProperties(staleFixture.host), [
    ['--gap', '4px'],
    ['color', 'red'],
    ['marginTop', '4px']
  ]);
  cleanupPrivateStyleCommitFixture(staleFixture);

  const unsupportedFixture =
    createPrivateStyleCommitFixture('unsupported-style-commit');
  const unsupportedProps = {
    style: orderedStyle([
      ['color', 'blue'],
      ['background-color', 'red']
    ]),
    children: 'stable'
  };
  const unsupportedUpdate = unsupportedFixture.bridge.renderContainer(
    unsupportedFixture.create.handle,
    {
      props: unsupportedProps,
      type: 'div'
    }
  );
  unsupportedFixture.host.styleLog = [];

  assert.throws(
    () =>
      unsupportedFixture.bridge.applyHostOutputUpdate(unsupportedUpdate, {
        hostInstanceToken: unsupportedFixture.token,
        nextProps: unsupportedProps,
        tag: 'div'
      }),
    {
      code: 'FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY'
    }
  );
  assert.deepEqual(unsupportedFixture.host.styleLog, []);
  assert.deepEqual(activeStyleProperties(unsupportedFixture.host), [
    ['--gap', '4px'],
    ['color', 'red'],
    ['marginTop', '4px']
  ]);
  cleanupPrivateStyleCommitFixture(unsupportedFixture);
});

test('private root host-output update applies style and dangerous HTML fake-DOM rows', () => {
  const fixture = createPrivateStyleDangerousHtmlUpdateFixture();
  const nextProps = {
    style: orderedStyle([
      ['color', 'blue'],
      ['width', 12]
    ]),
    dangerouslySetInnerHTML: {__html: '<em>After</em>'}
  };
  const update = fixture.bridge.renderContainer(fixture.create.handle, {
    props: nextProps,
    type: 'div'
  });

  fixture.host.styleLog = [];
  fixture.host.innerHTMLLog = [];

  const handoff = fixture.bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: fixture.token,
    nextProps,
    tag: 'div'
  });
  const payload =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);
  const styleCommit = payload.styleObjectDiffCommit;
  const dangerousHtmlCommit = payload.dangerousHtmlUpdateCommit;

  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(handoff.latestPropsPublishOrder, 'after-property-mutation');
  assert.equal(handoff.fakeDomMutation, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.publicRootObjectExposed, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.deepEqual(handoff.propertyMutation.propertyPayloadEvidence, {
    propertyPayloadBacked: true,
    rowCount: 5,
    mutatingRowCount: 5,
    updateRowCount: 3,
    removalRowCount: 2,
    setAttributeCount: 0,
    removeAttributeCount: 0,
    setPropertyCount: 0,
    removePropertyCount: 0,
    setStyleCount: 2,
    removeStyleCount: 2,
    nonPayloadRowCount: 0,
    attributeRowCount: 0,
    propertyRowCount: 0,
    styleRowCount: 4,
    rowKinds: [ENTRY_REMOVE_STYLE, ENTRY_SET_STYLE, ENTRY_SET_INNER_HTML],
    setInnerHTMLCount: 1,
    dangerousHtmlRowCount: 1
  });
  assert.deepEqual(
    handoff.acceptedCapabilities.map((capability) => capability.id),
    [
      'fake-dom-property-update',
      'property-payload-evidence',
      'latest-props-after-mutation',
      'style-payload-rows',
      'dangerous-html-payload-rows'
    ]
  );
  assert.equal(
    styleCommit.publicMetadata.kind,
    PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_METADATA_KIND
  );
  assert.equal(
    styleCommit.publicMetadata.status,
    PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_STATUS
  );
  assert.deepEqual(styleCommit.payloadRows, [
    removeStyle('marginTop', 'propertyAssignment'),
    removeStyle('--gap', 'setProperty'),
    setStyle('color', 'propertyAssignment', 'blue'),
    setStyle('width', 'propertyAssignment', '12px')
  ]);
  assert.equal(
    dangerousHtmlCommit.publicMetadata.kind,
    PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_METADATA_KIND
  );
  assert.equal(
    dangerousHtmlCommit.publicMetadata.status,
    PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_STATUS
  );
  assert.deepEqual(dangerousHtmlCommit.publicMetadata, {
    kind: PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_METADATA_KIND,
    status: PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_STATUS,
    sourceRequestId: update.requestId,
    sourceUpdateId: update.updateId,
    propName: 'dangerouslySetInnerHTML',
    propertyName: 'innerHTML',
    payloadRowCount: 1,
    commitMutationRecordCount: 1,
    setInnerHTMLCount: 1,
    propertyPayloadBacked: true,
    payloadRowsAccepted: true,
    fakeDomCommitHandoff: true,
    fakeDomMutation: true,
    fakeDomInnerHTMLWritten: true,
    realDomInnerHTMLWritten: false,
    browserDomMutation: false,
    publicRootCompatibility: false,
    publicDangerousHtmlCompatibility: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(dangerousHtmlCommit.payloadRows, [
    setInnerHTML('<em>After</em>')
  ]);
  assert.deepEqual(dangerousHtmlCommit.mutationRecords, [
    setInnerHTML('<em>After</em>')
  ]);
  assert.deepEqual(fixture.host.styleLog, [
    ['stylePropertyAssignment', 'marginTop', ''],
    ['styleSetProperty', '--gap', ''],
    ['stylePropertyAssignment', 'color', 'blue'],
    ['stylePropertyAssignment', 'width', '12px']
  ]);
  assert.deepEqual(fixture.host.innerHTMLLog, [
    ['setInnerHTML', '<em>After</em>']
  ]);
  assert.deepEqual(activeStyleProperties(fixture.host), [
    ['color', 'blue'],
    ['width', '12px']
  ]);
  assert.equal(fixture.host.innerHTML, '<em>After</em>');
  assert.equal(
    componentTree.getLatestPropsFromHostInstanceToken(fixture.token),
    nextProps
  );

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes('<span>Before</span>'), false);
  assert.equal(serialized.includes('<em>After</em>'), false);
  cleanupPrivateStyleDangerousHtmlUpdateFixture(fixture);
});

test('private root host-output dangerous HTML update rolls back prior style rows', () => {
  const fixture = createPrivateStyleDangerousHtmlUpdateFixture(
    'dangerous-html-rollback'
  );
  const nextProps = {
    style: orderedStyle([
      ['color', 'blue'],
      ['width', 12]
    ]),
    dangerouslySetInnerHTML: {__html: '<em>After</em>'}
  };
  const update = fixture.bridge.renderContainer(fixture.create.handle, {
    props: nextProps,
    type: 'div'
  });
  const thrownError = new Error('fake innerHTML update failed');
  fixture.host.innerHTMLFailure = thrownError;
  fixture.host.styleLog = [];
  fixture.host.innerHTMLLog = [];

  let caughtError = null;
  assert.throws(
    () =>
      fixture.bridge.applyHostOutputUpdate(update, {
        hostInstanceToken: fixture.token,
        nextProps,
        tag: 'div'
      }),
    (error) => {
      caughtError = error;
      return error === thrownError;
    }
  );
  assert.deepEqual(caughtError.domPropertyRollbackEvidence, {
    kind: 'FastReactDomLatestPropsPropertyRollbackEvidence',
    mutation: 'propertyUpdate',
    latestPropsPublished: false,
    normalizedEntryCount: 5,
    mutationAttempted: true,
    appliedMutationCount: 5,
    rollbackSupported: true,
    rollbackAttempted: true,
    rollbackApplied: true,
    rollbackRecordCount: 5,
    unsupportedPropertyPayloadRejected: false,
    rollbackError: null
  });
  assert.deepEqual(caughtError.privateRootUpdateRollbackEvidence, {
    kind: 'FastReactDomPrivateRootUpdateRollbackEvidence',
    latestPropsPublished: false,
    latestPropsHandoffStale: false,
    latestPropsRestoredToPrevious: true,
    propertyMutationAttempted: true,
    propertyRollbackAttempted: true,
    propertyRollbackApplied: true,
    propertyRollbackRecordCount: 5,
    textMutationRequested: false,
    textMutationApplied: false,
    textRollbackAttempted: false,
    textRollbackApplied: false,
    unsupportedPropertyPayloadRejected: false,
    propertyRollbackError: null,
    textRollbackError: null
  });
  assert.deepEqual(fixture.host.innerHTMLLog, [
    ['setInnerHTML', '<em>After</em>', 'throw']
  ]);
  assert.deepEqual(activeStyleProperties(fixture.host), [
    ['--gap', '4px'],
    ['color', 'red'],
    ['marginTop', '4px']
  ]);
  assert.equal(fixture.host.innerHTML, '<span>Before</span>');
  assert.equal(
    componentTree.getLatestPropsFromHostInstanceToken(fixture.token),
    fixture.initialProps
  );
  cleanupPrivateStyleDangerousHtmlUpdateFixture(fixture);
});

test('private root host-output dangerous HTML update fails closed for unsupported rows', () => {
  const fixture = createPrivateStyleDangerousHtmlUpdateFixture(
    'dangerous-html-unsupported'
  );
  const nextProps = {
    style: orderedStyle([['color', 'blue']]),
    dangerouslySetInnerHTML: '<em>After</em>'
  };
  const update = fixture.bridge.renderContainer(fixture.create.handle, {
    props: nextProps,
    type: 'div'
  });
  fixture.host.styleLog = [];
  fixture.host.innerHTMLLog = [];

  assert.throws(
    () =>
      fixture.bridge.applyHostOutputUpdate(update, {
        hostInstanceToken: fixture.token,
        nextProps,
        tag: 'div'
      }),
    {
      code: 'FAST_REACT_DOM_BLOCKED_PROPERTY_PAYLOAD_ENTRY'
    }
  );
  assert.deepEqual(fixture.host.styleLog, []);
  assert.deepEqual(fixture.host.innerHTMLLog, []);
  assert.deepEqual(activeStyleProperties(fixture.host), [
    ['--gap', '4px'],
    ['color', 'red'],
    ['marginTop', '4px']
  ]);
  assert.equal(fixture.host.innerHTML, '<span>Before</span>');
  assert.equal(
    componentTree.getLatestPropsFromHostInstanceToken(fixture.token),
    fixture.initialProps
  );
  cleanupPrivateStyleDangerousHtmlUpdateFixture(fixture);
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

function setInnerHTML(value) {
  return {
    kind: ENTRY_SET_INNER_HTML,
    propName: 'dangerouslySetInnerHTML',
    propertyName: 'innerHTML',
    value
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
    DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA.fakeDomCommitMetadata,
    true
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

test('private dangerous HTML diagnostics expose hidden validation payloads', () => {
  const previousProps = {
    dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
  };
  const nextProps = {
    dangerouslySetInnerHTML: {__html: '<em>After</em>'}
  };
  const diagnostic = createDangerousHtmlTextResetDiagnostic(
    'div',
    previousProps,
    nextProps
  );
  const hiddenPayload =
    getDangerousHtmlTextResetDiagnosticPayload(diagnostic);

  assert.equal(isDangerousHtmlTextResetDiagnostic(diagnostic), true);
  assert.equal(isDangerousHtmlTextResetDiagnostic({}), false);
  assert.equal(hiddenPayload.hostTag, 'div');
  assert.equal(hiddenPayload.previousProps, previousProps);
  assert.equal(hiddenPayload.nextProps, nextProps);
  assert.equal(hiddenPayload.propertyPayloadRowsAccepted, true);
  assert.equal(diagnostic.propertyPayloadRowsAccepted, true);
  assert.equal(diagnostic.fakeDomCommitMetadataAvailable, true);
  assert.equal(getDangerousHtmlTextResetDiagnosticPayload({}), null);
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

test('private root bridge records dangerous HTML/text reset rows as fake-DOM commit metadata only', () => {
  const scenarios = [
    {
      expectedRowKind: 'dangerous-html-set-inner-html',
      name: 'innerHTML set',
      nextProps: {
        dangerouslySetInnerHTML: {__html: '<em>After</em>'}
      },
      previousProps: {
        dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
      }
    },
    {
      expectedRowKind:
        'dangerous-html-to-managed-text-set-text-content',
      name: 'HTML-to-text',
      nextProps: {
        dangerouslySetInnerHTML: undefined,
        children: 'Managed child'
      },
      previousProps: {
        dangerouslySetInnerHTML: {__html: '<em>After</em>'}
      }
    },
    {
      expectedRowKind:
        'managed-text-to-dangerous-html-set-inner-html',
      name: 'text-to-HTML',
      nextProps: {
        dangerouslySetInnerHTML: {__html: '<strong>Raw</strong>'}
      },
      previousProps: {
        children: 'Managed text'
      }
    },
    {
      expectedRowKind:
        'dangerous-html-to-managed-child-reset-text-content',
      name: 'resetTextContent',
      nextProps: {
        children: [{type: 'span', props: {children: 'Managed child'}}]
      },
      previousProps: {
        dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
      }
    }
  ];

  for (const scenario of scenarios) {
    const setup = createDangerousHtmlCommitSetup(
      scenario.previousProps,
      scenario.name
    );
    try {
      const diagnostic = createDangerousHtmlTextResetDiagnostic(
        'div',
        scenario.previousProps,
        scenario.nextProps
      );
      const handoff = setup.recordCommitMetadata(
        scenario.nextProps,
        diagnostic
      );
      const hiddenHandoff =
        rootBridge.getPrivateRootDangerousHtmlTextResetCommitMetadataPayload(
          handoff
        );

      assert.equal(
        handoff.$$typeof,
        rootBridge.privateRootDangerousHtmlTextResetCommitMetadataRecordType
      );
      assert.equal(
        handoff.kind,
        'FastReactDomPrivateRootDangerousHtmlTextResetCommitMetadataRecord'
      );
      assert.equal(
        handoff.handoffStatus,
        rootBridge
          .ROOT_BRIDGE_DANGEROUS_HTML_TEXT_RESET_COMMIT_METADATA_ACCEPTED
      );
      assert.equal(handoff.hostTag, 'div');
      assert.equal(handoff.rootCommitMetadataRecordCount, 1);
      assert.equal(handoff.rootCommitHostComponentUpdateRecordCount, 1);
      assert.equal(handoff.fakeDomCommitRowCount, 1);
      assert.deepEqual(
        handoff.fakeDomCommitRows.map((row) => row.commitRowKind),
        [scenario.expectedRowKind]
      );
      assert.deepEqual(
        handoff.fakeDomCommitRows.map((row) => ({
          fakeDomCommitMetadata: row.fakeDomCommitMetadata,
          fakeDomMutation: row.fakeDomMutation,
          latestPropsPublished: row.latestPropsPublished,
          realDomInnerHTMLWritten: row.realDomInnerHTMLWritten,
          realDomTextContentWritten: row.realDomTextContentWritten
        })),
        [
          {
            fakeDomCommitMetadata: true,
            fakeDomMutation: false,
            latestPropsPublished: false,
            realDomInnerHTMLWritten: false,
            realDomTextContentWritten: false
          }
        ]
      );
      assert.equal(handoff.fakeDomMutation, false);
      assert.equal(handoff.domMutation, false);
      assert.equal(handoff.browserDomMutation, false);
      assert.equal(handoff.realDomInnerHTMLWritten, false);
      assert.equal(handoff.realDomTextContentWritten, false);
      assert.equal(handoff.publicRootObjectExposed, false);
      assert.equal(handoff.nativeExecution, false);
      assert.equal(handoff.reconcilerExecution, false);
      assert.equal(handoff.compatibilityClaimed, false);
      assert.deepEqual(
        handoff.acceptedCapabilities.map((capability) => capability.id),
        [
          'root-commit-host-component-update-metadata',
          'dangerous-html-text-reset-diagnostic',
          'fake-dom-dangerous-html-text-reset-commit-metadata'
        ]
      );
      assert.deepEqual(
        handoff.blockedCapabilities.map((capability) => capability.id),
        [
          'real-dom-inner-html-write',
          'real-dom-text-content-write',
          'latest-props-publication',
          'public-root-execution',
          'native-execution',
          'reconciler-execution',
          'browser-dom-compatibility',
          'compatibility-claims'
        ]
      );
      assert.equal(
        rootBridge.isPrivateRootDangerousHtmlTextResetCommitMetadataRecord(
          handoff
        ),
        true
      );
      assert.equal(
        rootBridge.isPrivateRootDangerousHtmlTextResetCommitMetadataRecord({}),
        false
      );
      assert.equal(hiddenHandoff.sourceRecord, setup.update);
      assert.equal(hiddenHandoff.diagnostic, diagnostic);
      assert.equal(hiddenHandoff.previousProps, scenario.previousProps);
      assert.equal(hiddenHandoff.nextProps, scenario.nextProps);
      assert.equal(hiddenHandoff.hostInstanceNode, setup.host);
      assert.equal(
        componentTree.getLatestPropsFromHostInstanceToken(setup.token),
        scenario.previousProps
      );
      assert.deepEqual(setup.host.dangerousWriteLog, []);

      const serialized = JSON.stringify(handoff);
      assert.equal(serialized.includes('<span>Before</span>'), false);
      assert.equal(serialized.includes('<em>After</em>'), false);
      assert.equal(serialized.includes('<strong>Raw</strong>'), false);
    } finally {
      setup.cleanup();
    }
  }
});

test('private root bridge rejects stale or unsupported dangerous HTML commit metadata', () => {
  const previousProps = {
    dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
  };
  const nextProps = {
    dangerouslySetInnerHTML: {__html: '<em>After</em>'}
  };
  const staleNextProps = {
    dangerouslySetInnerHTML: {__html: '<strong>Stale</strong>'}
  };
  const staleSetup = createDangerousHtmlCommitSetup(
    previousProps,
    'stale-dangerous-html'
  );
  try {
    const staleDiagnostic = createDangerousHtmlTextResetDiagnostic(
      'div',
      previousProps,
      nextProps
    );
    assert.throws(
      () =>
        staleSetup.recordCommitMetadata(
          staleNextProps,
          staleDiagnostic
        ),
      {
        code:
          'FAST_REACT_DOM_INVALID_DANGEROUS_HTML_TEXT_RESET_COMMIT_METADATA'
      }
    );
    assert.deepEqual(staleSetup.host.dangerousWriteLog, []);
  } finally {
    staleSetup.cleanup();
  }

  const conflictNextProps = {
    dangerouslySetInnerHTML: {__html: '<strong>bad</strong>'},
    children: 'conflict'
  };
  const conflictSetup = createDangerousHtmlCommitSetup(
    {},
    'conflict-dangerous-html'
  );
  try {
    const conflictDiagnostic = createDangerousHtmlTextResetDiagnostic(
      'div',
      {},
      conflictNextProps
    );
    assert.equal(conflictDiagnostic.propertyPayloadRowsAccepted, false);
    assert.equal(conflictDiagnostic.fakeDomCommitMetadataAvailable, false);
    assert.equal(
      conflictDiagnostic.blockedMutationRows[0].category,
      'dangerouslySetInnerHTML-children-conflict'
    );
    assert.throws(
      () =>
        conflictSetup.recordCommitMetadata(
          conflictNextProps,
          conflictDiagnostic
        ),
      {
        code:
          'FAST_REACT_DOM_INVALID_DANGEROUS_HTML_TEXT_RESET_COMMIT_METADATA'
      }
    );
    assert.deepEqual(conflictSetup.host.dangerousWriteLog, []);
  } finally {
    conflictSetup.cleanup();
  }
});

function createDangerousHtmlCommitSetup(previousProps, label) {
  const document = new DangerousHtmlCommitDocument(label);
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    dangerousHtmlTextResetCommitMetadataIdPrefix:
      `dangerous-html-commit-${label}`,
    sideEffectIdPrefix: `dangerous-html-side-effect-${label}`
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialRender = bridge.renderContainer(create.handle, {
    props: {children: 'initial'},
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);

  const host = document.createElement('div');
  const token = componentTree.createHostInstanceToken(
    {kind: 'DangerousHtmlTextResetCommitHost'},
    create.owner
  );
  componentTree.attachHostInstanceNode(host, token, previousProps);
  const metadata = createDangerousHtmlRootCommitMetadata();
  const setup = {
    cleanup() {
      componentTree.detachHostInstanceToken(token);
      bridge.revertCreateRootSideEffects(sideEffects);
    },
    host,
    recordCommitMetadata(nextProps, diagnostic) {
      const update = bridge.renderContainer(create.handle, {
        props: nextProps,
        type: 'div'
      });
      setup.update = update;
      return bridge.recordDangerousHtmlTextResetCommitMetadata(
        update,
        metadata,
        diagnostic,
        {
          hostInstanceToken: token,
          nextProps,
          stateNodeRaw: 901,
          tag: 'div'
        }
      );
    },
    token,
    update: null
  };
  return setup;
}

function createDangerousHtmlRootCommitMetadata() {
  return {
    mutationApplyRecords: [
      {
        kind: 'commit-host-component-update',
        tag: 'HostComponent',
        source: {
          kind: 'Update'
        },
        parentTag: 'HostRoot',
        stateNodeRaw: 901,
        pendingPropsRaw: 3003,
        memoizedPropsRaw: 3003,
        alternateMemoizedPropsRaw: 3001
      }
    ]
  };
}

class DangerousHtmlCommitEventTarget {
  constructor(fields) {
    Object.assign(this, fields);
    this.__mutationLog = [];
    this.__registrations = [];
    this.__removals = [];
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({listener, options, type});
  }

  removeEventListener(type, listener, options) {
    this.__removals.push({listener, options, type});
  }
}

class DangerousHtmlCommitDocument extends DangerousHtmlCommitEventTarget {
  constructor(label) {
    super({
      label,
      nodeName: '#document',
      nodeType: 9
    });
    this.ownerDocument = this;
    this.defaultView = new DangerousHtmlCommitEventTarget({
      label: `${label}-window`
    });
  }

  createElement(nodeName) {
    return new DangerousHtmlCommitElement(String(nodeName), this);
  }
}

class DangerousHtmlCommitElement extends DangerousHtmlCommitEventTarget {
  constructor(nodeName, ownerDocument) {
    super({
      nodeName: nodeName.toUpperCase(),
      nodeType: 1,
      ownerDocument
    });
    this.childNodes = [];
    this.parentNode = null;
    this.dangerousWriteLog = [];
    this._innerHTML = '';
    this._textContent = '';
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this.dangerousWriteLog.push(['innerHTML', String(value)]);
    throw new Error('innerHTML writes must remain blocked');
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this.dangerousWriteLog.push(['textContent', String(value)]);
    throw new Error('textContent writes must remain blocked');
  }
}

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

function createPrivateStyleCommitFixture(label = 'style-commit') {
  const document = new PrivateStyleCommitDocument(label);
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = {
    style: orderedStyle([
      ['color', 'red'],
      ['marginTop', 4],
      ['--gap', '4px']
    ]),
    children: 'stable'
  };
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);

  const host = document.createElement('div');
  const token = componentTree.createHostInstanceToken(
    {kind: 'PrivateStyleCommitHost'},
    create.owner
  );
  componentTree.attachHostInstanceNode(host, token, {});
  const propsHandoff = domHost.commitDomPropertyUpdateForLatestProps(
    host,
    'div',
    {},
    initialProps
  );
  componentTree.commitLatestPropsFromMutationHandoff(propsHandoff);

  return {
    bridge,
    create,
    document,
    host,
    initialProps,
    sideEffects,
    token
  };
}

function cleanupPrivateStyleCommitFixture(fixture) {
  componentTree.detachHostInstanceToken(fixture.token);
  fixture.bridge.revertCreateRootSideEffects(fixture.sideEffects);
}

function createPrivateStyleDangerousHtmlUpdateFixture(
  label = 'style-dangerous-html-update'
) {
  const document = new PrivateStyleDangerousHtmlUpdateDocument(label);
  const container = document.createElement('div');
  const bridge = rootBridge.createPrivateRootBridgeShell({
    hostOutputUpdateIdPrefix: `${label}-host-update`,
    sideEffectIdPrefix: `${label}-side-effect`
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = {
    style: orderedStyle([
      ['color', 'red'],
      ['marginTop', 4],
      ['--gap', '4px']
    ]),
    dangerouslySetInnerHTML: {__html: '<span>Before</span>'}
  };
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: 'div'
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);

  const host = document.createElement('div');
  const token = componentTree.createHostInstanceToken(
    {kind: 'PrivateStyleDangerousHtmlUpdateHost'},
    create.owner
  );
  componentTree.attachHostInstanceNode(host, token, {});
  const propsHandoff = domHost.commitDomPropertyUpdateForLatestProps(
    host,
    'div',
    {},
    initialProps
  );
  componentTree.commitLatestPropsFromMutationHandoff(propsHandoff);

  return {
    bridge,
    create,
    host,
    initialProps,
    sideEffects,
    token
  };
}

function cleanupPrivateStyleDangerousHtmlUpdateFixture(fixture) {
  componentTree.detachHostInstanceToken(fixture.token);
  fixture.bridge.revertCreateRootSideEffects(fixture.sideEffects);
}

function activeStyleProperties(element) {
  return Array.from(element.style.properties.entries())
    .filter(([, value]) => value !== '')
    .sort(([left], [right]) => left.localeCompare(right));
}

class PrivateStyleDangerousHtmlUpdateEventTarget {
  constructor(fields) {
    Object.assign(this, fields);
    this.__registrations = [];
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({listener, options, type});
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
  }
}

class PrivateStyleDangerousHtmlUpdateDocument
  extends PrivateStyleDangerousHtmlUpdateEventTarget {
  constructor(label) {
    super({
      label,
      nodeName: '#document',
      nodeType: 9
    });
    this.ownerDocument = this;
    this.defaultView = new PrivateStyleDangerousHtmlUpdateEventTarget({
      label: `${label}-window`
    });
  }

  createElement(nodeName) {
    return new PrivateStyleDangerousHtmlUpdateElement(
      String(nodeName),
      this
    );
  }
}

class PrivateStyleDangerousHtmlUpdateElement
  extends PrivateStyleDangerousHtmlUpdateEventTarget {
  constructor(nodeName, ownerDocument) {
    super({
      nodeName,
      nodeType: 1,
      ownerDocument
    });
    this.childNodes = [];
    this.innerHTMLFailure = null;
    this.innerHTMLLog = [];
    this._innerHTML = '';
    this.styleLog = [];
    this.style = new PrivateStyleDangerousHtmlUpdateStyle(this);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    const stringValue = String(value);
    if (this.innerHTMLFailure !== null) {
      this.innerHTMLLog.push(['setInnerHTML', stringValue, 'throw']);
      throw this.innerHTMLFailure;
    }
    this.childNodes = [];
    this._innerHTML = stringValue;
    this.innerHTMLLog.push(['setInnerHTML', stringValue]);
  }
}

class PrivateStyleDangerousHtmlUpdateStyle {
  constructor(ownerElement) {
    this.ownerElement = ownerElement;
    this.properties = new Map();

    return new Proxy(this, {
      set(target, property, value, receiver) {
        if (typeof property === 'string' && property !== 'ownerElement') {
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

class PrivateStyleCommitEventTarget {
  constructor(fields) {
    Object.assign(this, fields);
    this.__registrations = [];
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({listener, options, type});
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
  }
}

class PrivateStyleCommitDocument extends PrivateStyleCommitEventTarget {
  constructor(label) {
    super({
      label,
      nodeName: '#document',
      nodeType: 9
    });
    this.ownerDocument = this;
    this.defaultView = new PrivateStyleCommitEventTarget({
      label: `${label}-window`
    });
  }

  createElement(nodeName) {
    return new PrivateStyleCommitElement(String(nodeName), this);
  }
}

class PrivateStyleCommitElement extends PrivateStyleCommitEventTarget {
  constructor(nodeName, ownerDocument) {
    super({
      nodeName,
      nodeType: 1,
      ownerDocument
    });
    this.styleLog = [];
    this.style = new PrivateStyleCommitStyle(this);
  }
}

class PrivateStyleCommitStyle {
  constructor(ownerElement) {
    this.ownerElement = ownerElement;
    this.properties = new Map();

    return new Proxy(this, {
      set(target, property, value, receiver) {
        if (typeof property === 'string' && property !== 'ownerElement') {
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
