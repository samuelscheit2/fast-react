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

Object.defineProperty(createRoot, privateRootPublicFacadeAdapterSymbol, {
  configurable: false,
  enumerable: false,
  value: createPrivateRootPublicFacadeAdapter,
  writable: false
});
Object.defineProperty(createRoot, privateRootPublicFacadePreflightSymbol, {
  configurable: false,
  enumerable: false,
  value: createPrivateRootPublicFacadePreflight,
  writable: false
});
Object.defineProperty(
  hydrateRoot,
  privateHydrateRootPublicFacadePreflightSymbol,
  {
    configurable: false,
    enumerable: false,
    value: createPrivateHydrateRootPublicFacadePreflight,
    writable: false
  }
);

exports.createRoot = createRoot;
exports.hydrateRoot = hydrateRoot;
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);
