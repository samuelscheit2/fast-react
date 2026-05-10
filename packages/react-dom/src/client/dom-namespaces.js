'use strict';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function normalizeDOMNamespace(namespaceURI) {
  switch (namespaceURI) {
    case SVG_NAMESPACE:
      return SVG_NAMESPACE;
    case MATH_NAMESPACE:
      return MATH_NAMESPACE;
    default:
      return HTML_NAMESPACE;
  }
}

function getDOMElementNamespace(parentNamespaceURI, type) {
  const parentNamespace = normalizeDOMNamespace(parentNamespaceURI);

  if (parentNamespace === HTML_NAMESPACE) {
    switch (type) {
      case 'svg':
        return SVG_NAMESPACE;
      case 'math':
        return MATH_NAMESPACE;
      default:
        return HTML_NAMESPACE;
    }
  }

  return parentNamespace;
}

function getChildDOMNamespace(parentNamespaceURI, type) {
  const parentNamespace = normalizeDOMNamespace(parentNamespaceURI);

  if (parentNamespace === HTML_NAMESPACE) {
    switch (type) {
      case 'svg':
        return SVG_NAMESPACE;
      case 'math':
        return MATH_NAMESPACE;
      default:
        return HTML_NAMESPACE;
    }
  }

  if (parentNamespace === SVG_NAMESPACE && type === 'foreignObject') {
    return HTML_NAMESPACE;
  }

  return parentNamespace;
}

module.exports = {
  HTML_NAMESPACE,
  MATH_NAMESPACE,
  SVG_NAMESPACE,
  getChildDOMNamespace,
  getDOMElementNamespace,
  normalizeDOMNamespace
};
