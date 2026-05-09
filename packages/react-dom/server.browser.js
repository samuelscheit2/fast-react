'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/server.browser';

exports.version = placeholderVersion;
exports.renderToString = createUnsupportedFunction(
  entrypoint,
  'renderToString'
);
exports.renderToStaticMarkup = createUnsupportedFunction(
  entrypoint,
  'renderToStaticMarkup'
);
exports.renderToReadableStream = createUnsupportedFunction(
  entrypoint,
  'renderToReadableStream'
);
exports.resume = createUnsupportedFunction(entrypoint, 'resume');

definePlaceholderMetadata(module.exports, entrypoint);
