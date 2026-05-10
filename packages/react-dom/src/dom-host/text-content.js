'use strict';

const DOM_TEXT_CONTENT_RESET_UPDATE_GATE_METADATA = Object.freeze({
  gateVersion: 1,
  target: 'packages/react-dom/src/dom-host/text-content.js',
  privateMutationBridge:
    'packages/react-dom/src/dom-host/mutation.js#setTextContent/resetTextContent/removeChild/appendChild',
  publicRootsCompared: false,
  serverRenderingCompared: false,
  hydrationCompared: false,
  browserDomCompared: false,
  compatibilityClaimed: false,
  supportedFakeDomRowIds: Object.freeze([
    'text-content-reset-before-managed-child-append',
    'managed-child-remove-before-text-content-update'
  ])
});

function shouldSetTextContent(type, props) {
  if (props == null || typeof props !== 'object') {
    return false;
  }

  // React DOM's private predicate returns true for these host types. Fast React
  // keeps them blocked here until textarea/form and noscript behavior exists.
  if (type === 'textarea' || type === 'noscript') {
    return false;
  }

  const children = props.children;
  if (
    typeof children === 'string' ||
    typeof children === 'number' ||
    typeof children === 'bigint'
  ) {
    return true;
  }

  const html = props.dangerouslySetInnerHTML;
  return (
    html != null &&
    typeof html === 'object' &&
    html.__html != null
  );
}

module.exports = {
  DOM_TEXT_CONTENT_RESET_UPDATE_GATE_METADATA,
  shouldSetTextContent
};
