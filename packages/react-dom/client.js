'use strict';

const {
  createUnsupportedFunction,
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

const entrypoint = 'react-dom/client';
const createRoot = createUnsupportedFunction(entrypoint, 'createRoot');
const hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot');

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
