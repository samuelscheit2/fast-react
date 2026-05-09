'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/static.edge';

exports.version = placeholderVersion;
exports.prerender = createUnsupportedFunction(entrypoint, 'prerender');
exports.resumeAndPrerender = createUnsupportedFunction(
  entrypoint,
  'resumeAndPrerender'
);

definePlaceholderMetadata(module.exports, entrypoint);
