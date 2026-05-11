'use strict';

const {
  createBatchedUpdates,
  createPrivateInternalsPlaceholder,
  createUnsupportedFunction,
  definePlaceholderMetadata,
  reactDomVersion
} = require('./placeholder-utils.js');
const {
  createPrivateRootPublicFacadeAdapter,
  createPrivateRootPublicFacadePreflight,
  privateRootPublicFacadeAdapterSymbol,
  privateRootPublicFacadePreflightSymbol
} = require('./src/client/root-bridge.js');
const {createPortal} = require('./src/shared/create-portal.js');

const entrypoint = 'react-dom/profiling';
const createRoot = createUnsupportedFunction(entrypoint, 'createRoot', 2);

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

exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
  createPrivateInternalsPlaceholder(
    entrypoint,
    '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
    'react-dom-export-oracle-shape'
  );
exports.createPortal = createPortal;
exports.createRoot = createRoot;
exports.flushSync = createUnsupportedFunction(entrypoint, 'flushSync', 1);
exports.hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot', 3);
exports.preconnect = createUnsupportedFunction(entrypoint, 'preconnect', 2);
exports.prefetchDNS = createUnsupportedFunction(entrypoint, 'prefetchDNS', 1);
exports.preinit = createUnsupportedFunction(entrypoint, 'preinit', 2);
exports.preinitModule = createUnsupportedFunction(
  entrypoint,
  'preinitModule',
  2
);
exports.preload = createUnsupportedFunction(entrypoint, 'preload', 2);
exports.preloadModule = createUnsupportedFunction(
  entrypoint,
  'preloadModule',
  2
);
exports.requestFormReset = createUnsupportedFunction(
  entrypoint,
  'requestFormReset',
  1
);
exports.unstable_batchedUpdates = createBatchedUpdates();
exports.useFormState = createUnsupportedFunction(entrypoint, 'useFormState', 3);
exports.useFormStatus = createUnsupportedFunction(
  entrypoint,
  'useFormStatus',
  0
);
exports.version = reactDomVersion;

definePlaceholderMetadata(module.exports, entrypoint);
