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
  '$$typeof',
  '_owner',
  '_self',
  '_source',
  '_store',
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
  'props',
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
const rootBridgeCapabilityClaimFieldNames = new Set([
  'browserDomMutation',
  'browserDomMutationClaimed',
  'browser_dom_mutation',
  'browser_dom_mutation_claimed',
  'compatibilityClaimed',
  'compatibility_claimed',
  'domMutation',
  'domMutationClaimed',
  'dom_mutation',
  'dom_mutation_claimed',
  'eventDispatch',
  'eventDispatchClaimed',
  'event_dispatch',
  'event_dispatch_claimed',
  'fakeDomMutation',
  'fakeDomMutationClaimed',
  'fake_dom_mutation',
  'fake_dom_mutation_claimed',
  'hydration',
  'hydrationClaimed',
  'hydration_claimed',
  'listenerInstallation',
  'listenerInstallationClaimed',
  'listener_installation',
  'listener_installation_claimed',
  'markerWrites',
  'markerWritesClaimed',
  'marker_writes',
  'marker_writes_claimed',
  'nativeExecution',
  'nativeExecutionClaimed',
  'native_execution',
  'native_execution_claimed',
  'publicCompatibilityClaimed',
  'publicCreateRootCompatibilityClaimed',
  'publicDomMutationCompatibilityClaimed',
  'publicEventCompatibilityClaimed',
  'publicHydrateRootCompatibilityClaimed',
  'publicHydrationCompatibilityClaimed',
  'publicResourceCompatibilityClaimed',
  'publicResourceDomInsertionCompatibilityClaimed',
  'publicStylesheetCompatibilityClaimed',
  'publicFormCompatibilityClaimed',
  'publicFormActionCompatibilityClaimed',
  'publicFormResetCompatibilityClaimed',
  'publicControlledInputCompatibilityClaimed',
  'publicNativeCompatibility',
  'publicNativeCompatibilityClaimed',
  'publicNativeCompatibilitySurface',
  'public_compatibility_claimed',
  'public_create_root_compatibility_claimed',
  'public_dom_mutation_compatibility_claimed',
  'public_event_compatibility_claimed',
  'public_hydrate_root_compatibility_claimed',
  'public_hydration_compatibility_claimed',
  'public_native_compatibility',
  'public_native_compatibility_claimed',
  'public_native_compatibility_surface',
  'public_root_compatibility_surface',
  'public_root_execution',
  'public_root_render_compatibility_claimed',
  'public_root_unmount_compatibility_claimed',
  'public_root_update_compatibility_claimed',
  'public_test_renderer_compatibility_claimed',
  'publicRootCompatibilitySurface',
  'publicRootExecution',
  'publicRootRenderCompatibilityClaimed',
  'publicRootUnmountCompatibilityClaimed',
  'publicRootUpdateCompatibilityClaimed',
  'publicTestRendererCompatibilityClaimed',
  'reconcilerExecution',
  'reconcilerExecutionClaimed',
  'reconciler_execution',
  'reconciler_execution_claimed',
  'refEffects',
  'refEffectsClaimed',
  'ref_effects',
  'ref_effects_claimed',
  'rootScheduled',
  'rootScheduledClaimed',
  'root_scheduled',
  'root_scheduled_claimed',
  'rustExecution',
  'rustExecutionClaimed',
  'rust_execution',
  'rust_execution_claimed'
]);
const rootBridgeCapabilityClaimNormalizedNames = new Set(
  [...rootBridgeCapabilityClaimFieldNames].map(normalizePublicHostPropName)
);

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

  const root = Object.create(null);
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
  assertNoInheritedElementProps(element);
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

function assertNoInheritedElementProps(element) {
  let prototype = getElementPrototype(element);
  while (prototype !== null) {
    assertNoProxyObject(
      prototype,
      'Public React element proxy prototypes remain blocked.'
    );

    let inheritedKeys;
    try {
      inheritedKeys = Reflect.ownKeys(prototype);
    } catch (_error) {
      throwUnsupportedRootRender(
        'Public React element prototype inspection remains blocked.'
      );
    }
    for (const name of inheritedKeys) {
      const descriptor = getInheritedElementPropDescriptor(prototype, name);
      if (descriptor?.enumerable === true) {
        throwUnsupportedRootRender(
          `Inherited public React element prop ${String(name)} remains blocked.`
        );
      }
      if (
        typeof name === 'string' &&
        (publicHostInheritedNonClaimPropNames.has(name) ||
          isPublicHostCompatibilityAliasName(name))
      ) {
        throwUnsupportedRootRender(
          `Inherited public React element prop ${name} remains blocked.`
        );
      }
    }

    prototype = getElementPrototype(prototype);
  }
}

function getInheritedElementPropDescriptor(prototype, name) {
  try {
    return Object.getOwnPropertyDescriptor(prototype, name);
  } catch (_error) {
    throwUnsupportedRootRender(
      'Public React element prototype descriptor inspection remains blocked.'
    );
  }
}

function getElementPrototype(value) {
  try {
    return Object.getPrototypeOf(value);
  } catch (_error) {
    throwUnsupportedRootRender(
      'Public React element prototype access remains blocked.'
    );
  }
}

function assertNoInheritedHostProps(props) {
  let prototype = getHostPropPrototype(props);
  while (prototype !== null) {
    assertNoProxyObject(
      prototype,
      'Public host props proxy prototypes remain blocked.'
    );

    let inheritedKeys;
    try {
      inheritedKeys = Reflect.ownKeys(prototype);
    } catch (_error) {
      throwUnsupportedRootRender(
        'Public host props prototype inspection remains blocked.'
      );
    }
    for (const name of inheritedKeys) {
      const descriptor = getInheritedHostPropDescriptor(prototype, name);
      if (descriptor?.enumerable === true) {
        throwUnsupportedRootRender(
          `Inherited public host prop ${String(name)} remains blocked.`
        );
      }
      if (
        typeof name === 'string' &&
        (publicHostInheritedNonClaimPropNames.has(name) ||
          isPublicHostCompatibilityAliasName(name)
        )
      ) {
        throwUnsupportedRootRender(
          `Inherited public host prop ${name} remains blocked.`
        );
      }
    }

    prototype = getHostPropPrototype(prototype);
  }
}

function getInheritedHostPropDescriptor(prototype, name) {
  try {
    return Object.getOwnPropertyDescriptor(prototype, name);
  } catch (_error) {
    throwUnsupportedRootRender(
      'Public host props prototype descriptor inspection remains blocked.'
    );
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

  if (rootBridgeCapabilityClaimFieldNames.has(name)) {
    return true;
  }

  const normalized = normalizePublicHostPropName(name);
  if (normalized === '') {
    return false;
  }

  if (normalized.startsWith('public')) {
    return true;
  }

  if (rootBridgeCapabilityClaimNormalizedNames.has(normalized)) {
    return true;
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
    normalized.endsWith('execution') ||
    normalized.endsWith('mutation') ||
    normalized.endsWith('scheduled') ||
    normalized.endsWith('effects') ||
    normalized.includes('compatibility') ||
    normalized.includes('surfacechanged');
  if (!hasClaimSignal) {
    return false;
  }

  return (
    normalized.startsWith('browser') ||
    normalized.startsWith('native') ||
    normalized.startsWith('package') ||
    normalized.startsWith('reactdom') ||
    normalized.startsWith('scheduler') ||
    normalized.startsWith('rust') ||
    normalized.includes('root') ||
    normalized.includes('dom') ||
    normalized.includes('fake') ||
    normalized.includes('hydration') ||
    normalized.includes('hydrate') ||
    normalized.includes('event') ||
    normalized.includes('listener') ||
    normalized.includes('marker') ||
    normalized.includes('mutation') ||
    normalized.includes('resource') ||
    normalized.includes('form') ||
    normalized.includes('controlled') ||
    normalized.includes('reconciler') ||
    normalized.includes('ref') ||
    normalized.includes('renderer') ||
    normalized.includes('scheduled') ||
    normalized.includes('act') ||
    normalized.includes('flushsync')
  );
}

function normalizePublicHostPropName(name) {
  return String(name).replace(/[^A-Za-z0-9]/g, '').toLowerCase();
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
