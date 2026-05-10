'use strict';

const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
const REACT_PROFILER_TYPE = Symbol.for('react.profiler');
const REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
const REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
const REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
const REACT_ACTIVITY_TYPE = Symbol.for('react.activity');
const REACT_CONTEXT_TYPE = Symbol.for('react.context');
const REACT_CONSUMER_TYPE = Symbol.for('react.consumer');
const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
const REACT_MEMO_TYPE = Symbol.for('react.memo');
const REACT_LAZY_TYPE = Symbol.for('react.lazy');
const REACT_CLIENT_REFERENCE = Symbol.for('react.client.reference');

function isValidElementType(type) {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  }

  if (
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    type === REACT_ACTIVITY_TYPE
  ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    const $$typeof = type.$$typeof;
    return (
      $$typeof === REACT_LAZY_TYPE ||
      $$typeof === REACT_MEMO_TYPE ||
      $$typeof === REACT_CONTEXT_TYPE ||
      $$typeof === REACT_CONSUMER_TYPE ||
      $$typeof === REACT_FORWARD_REF_TYPE ||
      $$typeof === REACT_CLIENT_REFERENCE ||
      type.getModuleId !== undefined
    );
  }

  return false;
}

module.exports = {
  REACT_FORWARD_REF_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  isValidElementType
};
