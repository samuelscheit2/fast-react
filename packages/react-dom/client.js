'use strict';

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

        assertMinimalHostTextElement(element);

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

function assertMinimalHostTextElement(element) {
  if (
    element === null ||
    typeof element !== 'object' ||
    (element.$$typeof !== reactElementType &&
      element.$$typeof !== legacyReactElementType)
  ) {
    throwUnsupportedRootRender(
      'Only React element objects created for one HostComponent are supported.'
    );
  }
  if (typeof element.type !== 'string' || element.type === '') {
    throwUnsupportedRootRender(
      'Only string HostComponent element types are supported.'
    );
  }
  if (element.type !== 'div') {
    throwUnsupportedRootRender(
      'Only div HostComponent elements are supported by the public host-output facade.'
    );
  }
  if (element.key !== null && element.key !== undefined) {
    throwUnsupportedRootRender('Keyed elements remain blocked.');
  }

  const props =
    element.props !== null && typeof element.props === 'object'
      ? element.props
      : {};
  const propNames = Object.keys(props);
  for (const name of propNames) {
    if (name === 'children') {
      continue;
    }
    if (name !== 'id') {
      throwUnsupportedRootRender(
        `The public host-output facade currently supports only the id prop; ${name} remains blocked.`
      );
    }
    if (
      typeof props[name] !== 'string' &&
      typeof props[name] !== 'number'
    ) {
      throwUnsupportedRootRender(
        'The public host-output facade supports only string or number id values.'
      );
    }
  }

  const children = props.children;
  if (typeof children !== 'string' && typeof children !== 'number') {
    throwUnsupportedRootRender(
      'Only one HostText string or number child is supported.'
    );
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
