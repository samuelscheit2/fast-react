'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');
const {
  createPrivateRootPublicFacadeAdapter,
  privateRootPublicFacadeAdapterSymbol
} = require('./src/client/root-bridge.js');

const entrypoint = 'react-dom/client';
const createRoot = createUnsupportedFunction(entrypoint, 'createRoot');

Object.defineProperty(createRoot, privateRootPublicFacadeAdapterSymbol, {
  configurable: false,
  enumerable: false,
  value: createPrivateRootPublicFacadeAdapter,
  writable: false
});

exports.createRoot = createRoot;
exports.hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);
