'use strict';

const {types: utilTypes} = require('node:util');
const {
  createUnsupportedError,
  createUnsupportedFunction,
  defineFunctionShape,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');
const {
  createPrivateRootPublicFacadeAdapter,
  createPrivateHydrateRootPublicFacadePreflight,
  createPrivateRootPublicFacadePreflight,
  privateHydrateRootPublicFacadePreflightSymbol,
  privateRootPublicFacadeAdapterSymbol,
  privateRootPublicFacadePreflightSymbol
} = require('./src/client/root-bridge.js');
const {isContainerMarkedAsRoot} = require('./src/client/root-markers.js');

const entrypoint = 'react-dom/client';
const hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot');
const reactElementType = Symbol.for('react.transitional.element');
const legacyReactElementType = Symbol.for('react.element');
const minimalPublicRootContainers = new WeakMap();
const hasOwnProperty = Object.prototype.hasOwnProperty;
const publicHostInheritedNonClaimPropNames = new Set([
  'action',
  'checked',
  'children',
  'className',
  'dangerouslySetInnerHTML',
  'defaultValue',
  'formAction',
  'href',
  'id',
  'key',
  'name',
  'onChange',
  'onClick',
  'onClickCapture',
  'onError',
  'onLoad',
  'onSubmit',
  'publicCreateRootEnabled',
  'publicHydrateRootEnabled',
  'publicHydrateRootSupported',
  'publicRootBehaviorChanged',
  'publicRootExecution',
  'publicRootObjectExposed',
  'ref',
  'rel',
  'src',
  'style',
  'suppressHydrationWarning',
  'type',
  'value'
]);

const createRoot = defineFunctionShape(function createRoot(
  container
) {
  assertCreateRootOptionsUnsupported(arguments);
  assertCreateRootContainerAvailable(container);

  const adapter = createPrivateRootPublicFacadeAdapter();
  const privateRoot = adapter.createRoot(container);
  let hostOutputMounted = false;
  let unmounted = false;
  minimalPublicRootContainers.set(container, true);

  const root = {};
  Object.defineProperties(root, {
    render: {
      enumerable: true,
      value(element) {
        assertRenderArgumentsSupported(arguments);
        if (unmounted) {
          throwUnsupportedRootRender(
            'Rendering after public root.unmount remains blocked for the minimal host-output facade.'
          );
        }
        if (element === null) {
          if (hostOutputMounted) {
            adapter.clearHostOutput(privateRoot);
            hostOutputMounted = false;
          }
          return undefined;
        }

        assertMinimalHostOutputElement(element);

        privateRoot.render(element);
        hostOutputMounted = true;
        return undefined;
      }
    },
    unmount: {
      enumerable: true,
      value() {
        assertUnmountArgumentsSupported(arguments);
        if (unmounted) {
          return undefined;
        }

        privateRoot.unmount();
        minimalPublicRootContainers.delete(container);
        hostOutputMounted = false;
        unmounted = true;
        return undefined;
      }
    }
  });

  return Object.freeze(root);
}, 'createRoot', 0);

function definePrivateSymbolOnlyFacadeGate(target, symbol, value) {
  Object.defineProperty(target, symbol, {
    configurable: false,
    enumerable: false,
    value,
    writable: false
  });
}

definePrivateSymbolOnlyFacadeGate(
  createRoot,
  privateRootPublicFacadeAdapterSymbol,
  createPrivateRootPublicFacadeAdapter
);
definePrivateSymbolOnlyFacadeGate(
  createRoot,
  privateRootPublicFacadePreflightSymbol,
  createPrivateRootPublicFacadePreflight
);
definePrivateSymbolOnlyFacadeGate(
  hydrateRoot,
  privateHydrateRootPublicFacadePreflightSymbol,
  createPrivateHydrateRootPublicFacadePreflight
);

exports.createRoot = createRoot;
exports.hydrateRoot = hydrateRoot;
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);

function assertCreateRootOptionsUnsupported(args) {
  if (args.length > 1) {
    throw createUnsupportedError(
      entrypoint,
      'createRoot',
      'was called',
      'Root options, callbacks, hydration, scheduler hooks, and compatibility claims remain blocked.'
    );
  }
}

function assertRenderArgumentsSupported(args) {
  if (args.length !== 1) {
    throwUnsupportedRootRender(
      'Callbacks, containers, option objects, and scheduler-related render arguments remain blocked.'
    );
  }
}

function assertUnmountArgumentsSupported(args) {
  if (args.length !== 0) {
    throwUnsupportedRootUnmount(
      'Callbacks, containers, option objects, and scheduler-related unmount arguments remain blocked.'
    );
  }
}

function assertMinimalHostOutputElement(element) {
  assertReactElementObject(
    element,
    'Only React element objects created for one HostComponent are supported.'
  );
  assertMinimalHostElementType(element, 'div');
  assertUnkeyedHostElement(element);

  const props = getElementProps(element);
  const propDescriptors = assertOnlySupportedHostProps(props, {
    allowId: true,
    blockedDetail(name) {
      return `The public host-output facade currently supports only the id prop; ${name} remains blocked.`;
    }
  });

  const children = getHostPropValue(propDescriptors, 'children');
  if (typeof children === 'string' || typeof children === 'number') {
    return;
  }

  assertMinimalNestedHostOutputChild(children);
}

function assertMinimalNestedHostOutputChild(element) {
  assertReactElementObject(
    element,
    'Only one nested HostComponent child is supported.'
  );
  assertMinimalHostElementType(element, 'span');
  assertUnkeyedHostElement(element);

  const props = getElementProps(element);
  const propDescriptors = assertOnlySupportedHostProps(props, {
    allowId: false,
    blockedDetail(name) {
      return `Nested public host-output children currently support only primitive children; ${name} remains blocked.`;
    }
  });

  const children = getHostPropValue(propDescriptors, 'children');
  if (typeof children !== 'string' && typeof children !== 'number') {
    throwUnsupportedRootRender(
      'Only one nested HostText string or number child is supported.'
    );
  }
}

function assertReactElementObject(element, detail) {
  if (
    element === null ||
    typeof element !== 'object'
  ) {
    throwUnsupportedRootRender(detail);
  }
  assertNoProxyObject(element, detail);
  const elementType = getOwnDataPropertyValue(
    element,
    '$$typeof',
    detail
  );
  if (
    elementType !== reactElementType &&
    elementType !== legacyReactElementType
  ) {
    throwUnsupportedRootRender(detail);
  }
}

function assertMinimalHostElementType(element, expectedType) {
  const type = getOwnDataPropertyValue(
    element,
    'type',
    'React element type accessors, proxies, and inherited values remain blocked.'
  );
  if (typeof type !== 'string' || type === '') {
    throwUnsupportedRootRender(
      'Only string HostComponent element types are supported.'
    );
  }
  if (type !== expectedType) {
    throwUnsupportedRootRender(
      expectedType === 'div'
        ? 'Only div HostComponent elements are supported by the public host-output facade.'
        : 'Only one nested span HostComponent child is supported by the public host-output facade.'
    );
  }
}

function assertUnkeyedHostElement(element) {
  const key = getOwnDataPropertyValue(
    element,
    'key',
    'React element key accessors, proxies, and inherited values remain blocked.'
  );
  if (key !== null && key !== undefined) {
    throwUnsupportedRootRender('Keyed elements remain blocked.');
  }
}

function getElementProps(element) {
  const props = getOwnDataPropertyValue(
    element,
    'props',
    'React element props accessors, proxies, and inherited values remain blocked.'
  );
  if (props === null || typeof props !== 'object') {
    throwUnsupportedRootRender(
      'React element props must be an own object data property.'
    );
  }
  assertNoProxyObject(
    props,
    'Public host props proxies remain blocked by the minimal host-output facade.'
  );
  return props;
}

function assertOnlySupportedHostProps(props, options) {
  assertNoInheritedHostProps(props);
  const propDescriptors = new Map();
  const propNames = getOwnHostPropNames(props);
  for (const name of propNames) {
    if (typeof name !== 'string') {
      throwUnsupportedRootRender(
        options.blockedDetail(String(name))
      );
    }

    const descriptor = getOwnHostPropDescriptor(props, name);
    if (
      descriptor === undefined ||
      descriptor.enumerable !== true ||
      !hasOwnProperty.call(descriptor, 'value')
    ) {
      throwUnsupportedRootRender(
        'Public host props must be own enumerable data properties.'
      );
    }
    propDescriptors.set(name, descriptor);

    if (name === 'children') {
      continue;
    }
    if (!options.allowId || name !== 'id') {
      throwUnsupportedRootRender(options.blockedDetail(name));
    }
    if (
      typeof descriptor.value !== 'string' &&
      typeof descriptor.value !== 'number'
    ) {
      throwUnsupportedRootRender(
        'The public host-output facade supports only string or number id values.'
      );
    }
  }

  return propDescriptors;
}

function getHostPropValue(propDescriptors, name) {
  const descriptor = propDescriptors.get(name);
  return descriptor === undefined ? undefined : descriptor.value;
}

function getOwnDataPropertyValue(owner, name, detail) {
  assertNoProxyObject(owner, detail);
  const descriptor = getOwnHostPropDescriptor(owner, name);
  if (
    descriptor === undefined ||
    !hasOwnProperty.call(descriptor, 'value')
  ) {
    throwUnsupportedRootRender(detail);
  }
  return descriptor.value;
}

function getOwnHostPropNames(props) {
  try {
    return Reflect.ownKeys(props);
  } catch (_error) {
    throwUnsupportedRootRender(
      'Public host props proxies remain blocked by the minimal host-output facade.'
    );
  }
}

function getOwnHostPropDescriptor(props, name) {
  try {
    return Object.getOwnPropertyDescriptor(props, name);
  } catch (_error) {
    throwUnsupportedRootRender(
      'Public host props accessors and proxies remain blocked by the minimal host-output facade.'
    );
  }
}

function assertNoInheritedHostProps(props) {
  try {
    for (const name in props) {
      if (!hasOwnProperty.call(props, name)) {
        throwUnsupportedRootRender(
          `Inherited public host prop ${name} remains blocked.`
        );
      }
    }
  } catch (error) {
    if (error?.code === 'FAST_REACT_UNIMPLEMENTED') {
      throw error;
    }
    throwUnsupportedRootRender(
      'Public host props prototype enumeration remains blocked.'
    );
  }

  let prototype = getHostPropPrototype(props);
  while (prototype !== null) {
    assertNoProxyObject(
      prototype,
      'Public host props proxy prototypes remain blocked.'
    );

    let inheritedNames;
    try {
      inheritedNames = Object.getOwnPropertyNames(prototype);
    } catch (_error) {
      throwUnsupportedRootRender(
        'Public host props prototype inspection remains blocked.'
      );
    }
    for (const name of inheritedNames) {
      if (
        publicHostInheritedNonClaimPropNames.has(name) ||
        isPublicHostCompatibilityAliasName(name)
      ) {
        throwUnsupportedRootRender(
          `Inherited public host prop ${name} remains blocked.`
        );
      }
    }

    prototype = getHostPropPrototype(prototype);
  }
}

function getHostPropPrototype(value) {
  try {
    return Object.getPrototypeOf(value);
  } catch (_error) {
    throwUnsupportedRootRender(
      'Public host props prototype access remains blocked.'
    );
  }
}

function isPublicHostCompatibilityAliasName(name) {
  if (typeof name !== 'string') {
    return false;
  }

  const normalized = name.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  if (normalized === '') {
    return false;
  }

  if (
    normalized === 'compatibilityclaimed' ||
    normalized === 'packagecompatibilityclaimed' ||
    normalized === 'packagesurfacechanged' ||
    normalized === 'nativeexecution' ||
    normalized === 'nativeexecutionclaimed' ||
    normalized === 'publicdommutation' ||
    normalized === 'publicrootcompatibilitysurface' ||
    normalized === 'publicrootexecution'
  ) {
    return true;
  }

  if (
    normalized.includes('compatibilityclaimed') ||
    normalized.includes('compatibilitysurface') ||
    normalized.includes('compatibilitytarget')
  ) {
    return true;
  }

  const hasClaimSignal =
    normalized.endsWith('claim') ||
    normalized.endsWith('claimed') ||
    normalized.includes('compatibility') ||
    normalized.includes('surfacechanged');
  if (!hasClaimSignal) {
    return false;
  }

  return (
    normalized.startsWith('public') ||
    normalized.startsWith('browser') ||
    normalized.startsWith('native') ||
    normalized.startsWith('package') ||
    normalized.startsWith('reactdom') ||
    normalized.startsWith('scheduler') ||
    normalized.startsWith('rust') ||
    normalized.includes('root') ||
    normalized.includes('dom') ||
    normalized.includes('hydration') ||
    normalized.includes('hydrate') ||
    normalized.includes('event') ||
    normalized.includes('resource') ||
    normalized.includes('form') ||
    normalized.includes('controlled') ||
    normalized.includes('renderer') ||
    normalized.includes('act') ||
    normalized.includes('flushsync')
  );
}

function assertNoProxyObject(value, detail) {
  if (
    (value !== null &&
      (typeof value === 'object' || typeof value === 'function')) &&
    utilTypes.isProxy(value)
  ) {
    throwUnsupportedRootRender(detail);
  }
}

function throwUnsupportedRootRender(detail) {
  throw createUnsupportedError(
    entrypoint,
    'createRoot().render',
    'was called',
    detail
  );
}

function throwUnsupportedRootUnmount(detail) {
  throw createUnsupportedError(
    entrypoint,
    'createRoot().unmount',
    'was called',
    detail
  );
}

function assertCreateRootContainerAvailable(container) {
  if (
    container !== null &&
    (typeof container === 'object' || typeof container === 'function') &&
    minimalPublicRootContainers.has(container)
  ) {
    throw createUnsupportedError(
      entrypoint,
      'createRoot',
      'was called',
      'Duplicate public roots for the same container remain blocked.'
    );
  }
  if (isContainerMarkedAsRoot(container)) {
    throw createUnsupportedError(
      entrypoint,
      'createRoot',
      'was called',
      'Containers with existing React root markers remain blocked.'
    );
  }
}
