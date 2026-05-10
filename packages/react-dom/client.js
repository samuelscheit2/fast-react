'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');
const {
  createPrivateRootPublicFacadeAdapter,
  createPrivateRootPublicFacadePreflight,
  privateRootPublicFacadeAdapterSymbol,
  privateRootPublicFacadePreflightSymbol
} = require('./src/client/root-bridge.js');

const entrypoint = 'react-dom/client';
const createRoot = createUnsupportedFunction(entrypoint, 'createRoot');

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

exports.createRoot = createRoot;
exports.hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);
