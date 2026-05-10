'use strict';

const REACT_ELEMENT_TYPE = Symbol.for('react.transitional.element');
const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
const REACT_PORTAL_TYPE = Symbol.for('react.portal');
const REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
const REACT_PROFILER_TYPE = Symbol.for('react.profiler');
const REACT_CONTEXT_TYPE = Symbol.for('react.context');
const REACT_CONSUMER_TYPE = Symbol.for('react.consumer');
const REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
const REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
const REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
const REACT_MEMO_TYPE = Symbol.for('react.memo');
const REACT_LAZY_TYPE = Symbol.for('react.lazy');
const REACT_ACTIVITY_TYPE = Symbol.for('react.activity');
const REACT_CLIENT_REFERENCE = Symbol.for('react.client.reference');

const hasOwnProperty = Object.prototype.hasOwnProperty;
const isArray = Array.isArray;
const isDevelopment = process.env.NODE_ENV !== 'production';
const createConsoleTask =
  typeof console.createTask === 'function'
    ? console.createTask
    : function createMissingConsoleTask() {
        return null;
      };

let didWarnAboutOldJSXRuntime = false;
let specialPropKeyWarningShown = false;
const didWarnAboutElementRef = Object.create(null);
const didWarnAboutKeySpread = Object.create(null);

function isValidElement(object) {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
}

function makeCreateElement() {
  return function (type, config, children) {
    return createElementImpl(type, config, arguments);
  };
}

function makeCloneElement(options = {}) {
  const reactServer = options.reactServer === true;

  return function (element, config, children) {
    return cloneElementImpl(element, config, arguments, { reactServer });
  };
}

function makeJsx(isStaticChildren) {
  if (!isDevelopment) {
    return jsxProd;
  }

  return function (type, config, maybeKey) {
    return jsxDEVImpl(
      type,
      config,
      maybeKey,
      isStaticChildren,
      Error('react-stack-top-frame'),
      createConsoleTask(getTaskName(type))
    );
  };
}

function makeJsxDEV() {
  if (!isDevelopment) {
    return undefined;
  }

  return function (type, config, maybeKey, isStaticChildren) {
    return jsxDEVImpl(
      type,
      config,
      maybeKey,
      isStaticChildren,
      Error('react-stack-top-frame'),
      createConsoleTask(getTaskName(type))
    );
  };
}

function jsxProd(type, config, maybeKey) {
  let key = null;
  if (maybeKey !== undefined) {
    key = '' + maybeKey;
  }
  if (config.key !== undefined) {
    key = '' + config.key;
  }

  let props;
  if ('key' in config) {
    props = {};
    for (const propName in config) {
      if (propName !== 'key') {
        props[propName] = config[propName];
      }
    }
  } else {
    props = config;
  }

  return createProductionElement(type, key, props);
}

function createElementImpl(type, config, args) {
  if (isDevelopment) {
    for (let index = 2; index < args.length; index += 1) {
      validateChildKeys(args[index]);
    }
  }

  const props = {};
  let key = null;

  if (config !== null && config !== undefined) {
    if (
      isDevelopment &&
      !didWarnAboutOldJSXRuntime &&
      '__self' in config &&
      !('key' in config)
    ) {
      didWarnAboutOldJSXRuntime = true;
      console.warn(
        'Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform'
      );
    }

    if (isDevelopment ? hasValidKey(config) : config.key !== undefined) {
      if (isDevelopment) {
        checkKeyStringCoercion(config.key);
      }
      key = '' + config.key;
    }

    for (const propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        propName !== 'key' &&
        propName !== '__self' &&
        propName !== '__source'
      ) {
        props[propName] = config[propName];
      }
    }
  }

  const childrenLength = args.length - 2;
  if (childrenLength === 1) {
    props.children = args[2];
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let index = 0; index < childrenLength; index += 1) {
      childArray[index] = args[index + 2];
    }
    if (isDevelopment && Object.freeze) {
      Object.freeze(childArray);
    }
    props.children = childArray;
  }

  if (type && type.defaultProps) {
    const defaultProps = type.defaultProps;
    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  if (isDevelopment && key) {
    defineKeyPropWarningGetter(props, getElementWarningName(type));
  }

  return createElementObject({
    type,
    key,
    props,
    owner: null,
    debugStack: isDevelopment ? Error('react-stack-top-frame') : undefined,
    debugTask: isDevelopment ? createConsoleTask(getTaskName(type)) : undefined
  });
}

function cloneElementImpl(element, config, args, options) {
  if (element === null || element === undefined) {
    throwInvalidCloneElementError(element, options);
  }

  const props = Object.assign({}, element.props);
  let key = element.key;
  let owner = element._owner;

  if (config !== null && config !== undefined) {
    if (isDevelopment ? hasValidRef(config) : config.ref !== undefined) {
      owner = null;
    }

    if (isDevelopment ? hasValidKey(config) : config.key !== undefined) {
      if (isDevelopment) {
        checkKeyStringCoercion(config.key);
      }
      key = '' + config.key;
    }

    for (const propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        propName !== 'key' &&
        propName !== '__self' &&
        propName !== '__source' &&
        !(propName === 'ref' && config.ref === undefined)
      ) {
        props[propName] = config[propName];
      }
    }
  }

  const childrenLength = args.length - 2;
  if (childrenLength === 1) {
    props.children = args[2];
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let index = 0; index < childrenLength; index += 1) {
      childArray[index] = args[index + 2];
    }
    if (isDevelopment && Object.freeze) {
      Object.freeze(childArray);
    }
    props.children = childArray;
  }

  const cloned = createElementObject({
    type: element.type,
    key,
    props,
    owner,
    debugStack: element._debugStack,
    debugTask: element._debugTask
  });

  if (isDevelopment) {
    for (let index = 2; index < args.length; index += 1) {
      validateChildKeys(args[index]);
    }
  }

  return cloned;
}

function cloneAndReplaceKey(oldElement, newKey) {
  const cloned = createElementObject({
    type: oldElement.type,
    key: newKey,
    props: oldElement.props,
    owner: oldElement._owner,
    debugStack: oldElement._debugStack,
    debugTask: oldElement._debugTask
  });

  if (isDevelopment && oldElement._store && cloned._store) {
    cloned._store.validated = oldElement._store.validated;
  }

  return cloned;
}

function jsxDEVImpl(
  type,
  config,
  maybeKey,
  isStaticChildren,
  debugStack,
  debugTask
) {
  const children = config.children;
  if (children !== undefined) {
    if (isStaticChildren) {
      if (isArray(children)) {
        for (let index = 0; index < children.length; index += 1) {
          validateChildKeys(children[index]);
        }
        if (Object.freeze) {
          Object.freeze(children);
        }
      } else {
        console.error(
          'React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.'
        );
      }
    } else {
      validateChildKeys(children);
    }
  }

  if (hasOwnProperty.call(config, 'key')) {
    const componentName = getComponentNameFromType(type);
    const keys = Object.keys(config).filter((key) => key !== 'key');
    const beforeExample =
      keys.length > 0
        ? `{key: someKey, ${keys.join(': ..., ')}: ...}`
        : '{key: someKey}';
    const warningKey = componentName + beforeExample;

    if (!didWarnAboutKeySpread[warningKey]) {
      const afterExample =
        keys.length > 0 ? `{${keys.join(': ..., ')}: ...}` : '{}';
      console.error(
        'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
        beforeExample,
        componentName,
        afterExample,
        componentName
      );
      didWarnAboutKeySpread[warningKey] = true;
    }
  }

  let key = null;
  if (maybeKey !== undefined) {
    checkKeyStringCoercion(maybeKey);
    key = '' + maybeKey;
  }
  if (hasValidKey(config)) {
    checkKeyStringCoercion(config.key);
    key = '' + config.key;
  }

  let props;
  if ('key' in config) {
    props = {};
    for (const propName in config) {
      if (propName !== 'key') {
        props[propName] = config[propName];
      }
    }
  } else {
    props = config;
  }

  if (key) {
    defineKeyPropWarningGetter(props, getElementWarningName(type));
  }

  return createElementObject({
    type,
    key,
    props,
    owner: null,
    debugStack,
    debugTask
  });
}

function createElementObject({
  type,
  key,
  props,
  owner,
  debugStack,
  debugTask
}) {
  if (!isDevelopment) {
    return createProductionElement(type, key, props);
  }

  const refProp = props.ref;
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    props,
    _owner: owner
  };

  if ((refProp !== undefined ? refProp : null) !== null) {
    Object.defineProperty(element, 'ref', {
      enumerable: false,
      get: elementRefGetterWithDeprecationWarning
    });
  } else {
    Object.defineProperty(element, 'ref', {
      enumerable: false,
      value: null
    });
  }

  element._store = {};
  Object.defineProperty(element._store, 'validated', {
    configurable: false,
    enumerable: false,
    writable: true,
    value: 0
  });
  Object.defineProperty(element, '_debugInfo', {
    configurable: false,
    enumerable: false,
    writable: true,
    value: null
  });
  Object.defineProperty(element, '_debugStack', {
    configurable: false,
    enumerable: false,
    writable: true,
    value: debugStack
  });
  Object.defineProperty(element, '_debugTask', {
    configurable: false,
    enumerable: false,
    writable: true,
    value: debugTask
  });

  if (Object.freeze) {
    Object.freeze(element.props);
    Object.freeze(element);
  }

  return element;
}

function createProductionElement(type, key, props) {
  const refProp = props.ref;
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref: refProp !== undefined ? refProp : null,
    props
  };
}

function throwInvalidCloneElementError(element, options) {
  if (options.reactServer && !isDevelopment) {
    throw new Error(
      `Minified React error #267; visit https://react.dev/errors/267?args[]=${element} for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
    );
  }

  throw new Error(
    `The argument must be a React element, but you passed ${element}.`
  );
}

function hasValidKey(config) {
  if (hasOwnProperty.call(config, 'key')) {
    const getter = Object.getOwnPropertyDescriptor(config, 'key').get;
    if (getter && getter.isReactWarning) {
      return false;
    }
  }
  return config.key !== undefined;
}

function hasValidRef(config) {
  if (hasOwnProperty.call(config, 'ref')) {
    const getter = Object.getOwnPropertyDescriptor(config, 'ref').get;
    if (getter && getter.isReactWarning) {
      return false;
    }
  }
  return config.ref !== undefined;
}

function defineKeyPropWarningGetter(props, displayName) {
  function warnAboutAccessingKey() {
    if (!specialPropKeyWarningShown) {
      specialPropKeyWarningShown = true;
      console.error(
        '%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)',
        displayName
      );
    }
  }

  warnAboutAccessingKey.isReactWarning = true;
  Object.defineProperty(props, 'key', {
    get: warnAboutAccessingKey,
    configurable: true
  });
}

function elementRefGetterWithDeprecationWarning() {
  const componentName = getComponentNameFromType(this.type);
  if (!didWarnAboutElementRef[componentName]) {
    didWarnAboutElementRef[componentName] = true;
    console.error(
      'Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release.'
    );
  }

  const refProp = this.props.ref;
  return refProp !== undefined ? refProp : null;
}

function validateChildKeys(node) {
  if (isValidElement(node)) {
    if (node._store) {
      node._store.validated = 1;
    }
    return;
  }

  if (
    typeof node === 'object' &&
    node !== null &&
    node.$$typeof === REACT_LAZY_TYPE &&
    node._store
  ) {
    node._store.validated = 1;
  }
}

function checkKeyStringCoercion(value) {
  try {
    testStringCoercion(value);
  } catch (_error) {
    console.error(
      'The provided key is an unsupported type %s. This value must be coerced to a string before using it here.',
      getUnsupportedKeyTypeName(value)
    );
    return testStringCoercion(value);
  }

  return undefined;
}

function testStringCoercion(value) {
  return '' + value;
}

function getUnsupportedKeyTypeName(value) {
  return (
    (typeof Symbol === 'function' &&
      Symbol.toStringTag &&
      value &&
      value[Symbol.toStringTag]) ||
    value?.constructor?.name ||
    'Object'
  );
}

function getElementWarningName(type) {
  return typeof type === 'function'
    ? type.displayName || type.name || 'Unknown'
    : type;
}

function getTaskName(type) {
  if (type === REACT_FRAGMENT_TYPE) {
    return '<>';
  }
  if (
    typeof type === 'object' &&
    type !== null &&
    type.$$typeof === REACT_LAZY_TYPE
  ) {
    return '<...>';
  }

  try {
    const name = getComponentNameFromType(type);
    return name ? `<${name}>` : '<...>';
  } catch (_error) {
    return '<...>';
  }
}

function getComponentNameFromType(type) {
  if (type == null) {
    return null;
  }
  if (typeof type === 'function') {
    return type.$$typeof === REACT_CLIENT_REFERENCE
      ? null
      : type.displayName || type.name || null;
  }
  if (typeof type === 'string') {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return 'Fragment';
    case REACT_PROFILER_TYPE:
      return 'Profiler';
    case REACT_STRICT_MODE_TYPE:
      return 'StrictMode';
    case REACT_SUSPENSE_TYPE:
      return 'Suspense';
    case REACT_SUSPENSE_LIST_TYPE:
      return 'SuspenseList';
    case REACT_ACTIVITY_TYPE:
      return 'Activity';
    default:
      break;
  }

  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_PORTAL_TYPE:
        return 'Portal';
      case REACT_CONTEXT_TYPE:
        return type.displayName || 'Context';
      case REACT_CONSUMER_TYPE:
        return `${type._context.displayName || 'Context'}.Consumer`;
      case REACT_FORWARD_REF_TYPE: {
        const innerType = type.render;
        const displayName = type.displayName;
        if (displayName) {
          return displayName;
        }
        const innerName = innerType.displayName || innerType.name || '';
        return innerName !== '' ? `ForwardRef(${innerName})` : 'ForwardRef';
      }
      case REACT_MEMO_TYPE:
        return type.displayName || getComponentNameFromType(type.type) || 'Memo';
      case REACT_LAZY_TYPE:
        try {
          return getComponentNameFromType(type._init(type._payload));
        } catch (_error) {
          return null;
        }
      default:
        break;
    }
  }

  return null;
}

module.exports = {
  Fragment: REACT_FRAGMENT_TYPE,
  REACT_ELEMENT_TYPE,
  cloneAndReplaceKey,
  createElement: makeCreateElement(),
  cloneElement: makeCloneElement(),
  cloneElementReactServer: makeCloneElement({ reactServer: true }),
  isValidElement,
  jsx: makeJsx(false),
  jsxs: makeJsx(true),
  jsxDEV: makeJsxDEV()
};
