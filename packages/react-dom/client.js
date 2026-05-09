'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/client';

exports.createRoot = createUnsupportedFunction(entrypoint, 'createRoot');
exports.hydrateRoot = createUnsupportedFunction(entrypoint, 'hydrateRoot');
exports.version = placeholderVersion;

definePlaceholderMetadata(module.exports, entrypoint);
