'use strict';

const {
  ENTRY_NON_PAYLOAD,
  ENTRY_SET_INNER_HTML,
  ENTRY_UNSUPPORTED,
  diffDomPropertyPayload
} = require('../dom-host/property-payload.js');
const {
  shouldSetTextContent
} = require('../dom-host/text-content.js');

const DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA = Object.freeze({
  gateVersion: 1,
  target: 'packages/react-dom/src/client/dom-property-operations.js',
  privatePropertyPayloadBridge:
    'packages/react-dom/src/dom-host/property-payload.js#diffDomPropertyPayload',
  privateTextContentBridge:
    'packages/react-dom/src/dom-host/text-content.js#shouldSetTextContent',
  privateFakeDomCommitMetadataBridge:
    'packages/react-dom/src/client/root-bridge.js#recordPrivateRootDangerousHtmlTextResetCommitMetadata',
  publicRootsCompared: false,
  serverRenderingCompared: false,
  hydrationCompared: false,
  browserDomCompared: false,
  realDomInnerHTMLWrites: false,
  fakeDomCommitMetadata: true,
  publicDomMutation: false,
  compatibilityClaimed: false,
  supportedBlockedRowIds: Object.freeze([
    'dangerous-html-set-inner-html-blocked',
    'dangerous-html-to-managed-text-set-text-content-blocked',
    'dangerous-html-to-managed-child-reset-text-content-blocked',
    'managed-text-to-dangerous-html-set-inner-html-blocked'
  ])
});

const dangerousHtmlTextResetDiagnosticPayloads = new WeakMap();

function createDangerousHtmlTextResetDiagnostic(
  tag,
  previousProps,
  nextProps
) {
  if (typeof tag !== 'string' || tag === '') {
    throw createDomPropertyOperationsError(
      'FAST_REACT_DOM_INVALID_HOST_TAG',
      'Cannot create a DOM property operations diagnostic without a host tag.'
    );
  }

  const previous = describeTextOrHtmlProps(tag, previousProps, 'previous');
  const next = describeTextOrHtmlProps(tag, nextProps, 'next');
  const propertyPayloadRows = freezeArray(
    diffDomPropertyPayload(tag, previous.props, next.props).map(clonePayloadRow)
  );
  const resetDecision = createTextResetDecision(previous, next);
  const blockedMutationRows = freezeArray(
    createBlockedHostUpdateRows(next, resetDecision, propertyPayloadRows)
  );
  const propertyPayloadRowsAccepted = propertyPayloadRows.every(
    (row) => row.kind !== ENTRY_UNSUPPORTED
  );

  const diagnostic = freezeRecord({
    kind: 'FastReactDomDangerousHtmlTextResetDiagnostic',
    status: 'blocked-host-update',
    hostTag: tag,
    previousText: previous.text,
    previousHtml: previous.html,
    previousContentSource: previous.contentSource,
    previousShouldSetTextContent: previous.shouldSetTextContent,
    nextText: next.text,
    nextHtml: next.html,
    nextContentSource: next.contentSource,
    nextShouldSetTextContent: next.shouldSetTextContent,
    resetDecision,
    propertyPayloadRows,
    propertyPayloadRowsAccepted,
    blockedMutationRows,
    blockedMutationRowCount: blockedMutationRows.length,
    fakeDomCommitMetadataAvailable:
      propertyPayloadRowsAccepted && blockedMutationRows.length > 0,
    sideEffects: freezeRecord({
      realDomMutated: false,
      realDomInnerHTMLWritten: false,
      realDomTextContentWritten: false,
      publicRootTouched: false,
      publicCompatibilityEnabled: false,
      compatibilityClaimed: false
    }),
    publicCompatibilityEnabled: false,
    compatibilityClaimed: false
  });

  dangerousHtmlTextResetDiagnosticPayloads.set(
    diagnostic,
    freezeRecord({
      blockedMutationRows,
      hostTag: tag,
      nextProps: next.props,
      previousProps: previous.props,
      propertyPayloadRows,
      propertyPayloadRowsAccepted,
      resetDecision
    })
  );

  return diagnostic;
}

function describeTextOrHtmlProps(tag, props, phase) {
  const normalizedProps = normalizeProps(props, phase);
  const text = getPrimitiveChildrenText(normalizedProps);
  const html = getDangerousHtmlText(normalizedProps);
  let contentSource = 'none';
  if (text !== null && html !== null) {
    contentSource = 'children-and-dangerouslySetInnerHTML';
  } else if (text !== null) {
    contentSource = 'children';
  } else if (html !== null) {
    contentSource = 'dangerouslySetInnerHTML';
  } else if (hasDangerousHtmlProp(normalizedProps)) {
    contentSource = 'dangerouslySetInnerHTML-nullish-or-unsupported';
  } else if (Object.prototype.hasOwnProperty.call(normalizedProps, 'children')) {
    contentSource = 'children-non-text';
  }

  return {
    contentSource,
    html,
    phase,
    props: normalizedProps,
    shouldSetTextContent: shouldSetTextContent(tag, normalizedProps),
    text
  };
}

function createTextResetDecision(previous, next) {
  const shouldResetTextContent =
    previous.shouldSetTextContent && !next.shouldSetTextContent;
  let reason = 'no-text-content-reset';
  if (shouldResetTextContent) {
    reason = 'previous-direct-text-or-html-to-managed-children';
  } else if (previous.shouldSetTextContent && next.shouldSetTextContent) {
    reason = 'next-direct-text-or-html-overwrites-previous-content';
  } else if (!previous.shouldSetTextContent && next.shouldSetTextContent) {
    reason = 'next-direct-text-or-html-update';
  }

  return freezeRecord({
    previousShouldSetTextContent: previous.shouldSetTextContent,
    nextShouldSetTextContent: next.shouldSetTextContent,
    shouldResetTextContent,
    contentResetFlagBlocked: shouldResetTextContent,
    reason,
    realDomResetApplied: false,
    compatibilityClaimed: false
  });
}

function createBlockedHostUpdateRows(next, resetDecision, propertyPayloadRows) {
  const rows = [];
  const unsupportedRows = propertyPayloadRows.filter(
    (row) => row.kind === ENTRY_UNSUPPORTED
  );

  if (unsupportedRows.length > 0) {
    return unsupportedRows.map((row) =>
      createBlockedMutationRow({
        id: 'unsupported-property-payload-blocked',
        kind: row.kind,
        mutation: 'unsupportedPropertyPayload',
        propName: row.propName,
        category: row.category,
        reason: row.reason
      })
    );
  }

  if (resetDecision.shouldResetTextContent) {
    rows.push(
      createBlockedMutationRow({
        id: 'dangerous-html-to-managed-child-reset-text-content-blocked',
        kind: 'resetTextContent',
        mutation: 'textContent',
        propertyName: 'textContent',
        value: ''
      })
    );
  }

  for (const row of propertyPayloadRows) {
    if (row.kind === ENTRY_SET_INNER_HTML) {
      rows.push(
        createBlockedMutationRow({
          id: 'dangerous-html-set-inner-html-blocked',
          kind: row.kind,
          mutation: 'innerHTML',
          propertyName: row.propertyName,
          propName: row.propName,
          value: row.value
        })
      );
    }
  }

  if (next.text !== null) {
    rows.push(
      createBlockedMutationRow({
        id: 'dangerous-html-to-managed-text-set-text-content-blocked',
        kind: 'setTextContent',
        mutation: 'textContent',
        propertyName: 'textContent',
        propName: 'children',
        value: next.text
      })
    );
  }

  return rows;
}

function createBlockedMutationRow(row) {
  return freezeRecord({
    ...row,
    status: 'blocked',
    realDomMutation: false,
    publicCompatibilityEnabled: false,
    compatibilityClaimed: false
  });
}

function normalizeProps(props, phase) {
  if (props == null) {
    return {};
  }

  const propsType = typeof props;
  if (propsType !== 'object' && propsType !== 'function') {
    throw createDomPropertyOperationsError(
      'FAST_REACT_DOM_INVALID_HOST_PROPS',
      `Cannot create a DOM property operations diagnostic with invalid ${phase} props.`
    );
  }

  return props;
}

function getPrimitiveChildrenText(props) {
  if (!Object.prototype.hasOwnProperty.call(props, 'children')) {
    return null;
  }

  const children = props.children;
  const childrenType = typeof children;
  if (
    childrenType === 'string' ||
    childrenType === 'number' ||
    childrenType === 'bigint'
  ) {
    return String(children);
  }

  return null;
}

function getDangerousHtmlText(props) {
  if (!hasDangerousHtmlProp(props)) {
    return null;
  }

  const html = props.dangerouslySetInnerHTML;
  if (
    html === null ||
    typeof html !== 'object' ||
    !Object.prototype.hasOwnProperty.call(html, '__html') ||
    html.__html == null ||
    typeof html.__html !== 'string'
  ) {
    return null;
  }

  return html.__html;
}

function hasDangerousHtmlProp(props) {
  return Object.prototype.hasOwnProperty.call(
    props,
    'dangerouslySetInnerHTML'
  );
}

function clonePayloadRow(row) {
  if (row.kind === ENTRY_UNSUPPORTED) {
    return freezeRecord({...row});
  }
  if (row.kind === ENTRY_NON_PAYLOAD) {
    return freezeRecord({...row});
  }
  return freezeRecord({...row});
}

function freezeArray(values) {
  return Object.freeze(values.slice());
}

function freezeRecord(record) {
  return Object.freeze(record);
}

function createDomPropertyOperationsError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getDangerousHtmlTextResetDiagnosticPayload(record) {
  if (record === null || typeof record !== 'object') {
    return null;
  }
  return dangerousHtmlTextResetDiagnosticPayloads.get(record) || null;
}

function isDangerousHtmlTextResetDiagnostic(record) {
  return getDangerousHtmlTextResetDiagnosticPayload(record) !== null;
}

module.exports = {
  DOM_DANGEROUS_HTML_TEXT_RESET_GATE_METADATA,
  createDangerousHtmlTextResetDiagnostic,
  getDangerousHtmlTextResetDiagnosticPayload,
  isDangerousHtmlTextResetDiagnostic
};
