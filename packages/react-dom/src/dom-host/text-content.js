'use strict';

function shouldSetTextContent(type, props) {
  if (props == null || typeof props !== 'object') {
    return false;
  }

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
  shouldSetTextContent
};
