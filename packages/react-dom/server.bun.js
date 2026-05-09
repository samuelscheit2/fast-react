'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/server.bun';

exports.version = placeholderVersion;
exports.renderToReadableStream = createUnsupportedFunction(
  entrypoint,
  'renderToReadableStream'
);
exports.resume = undefined;
exports.renderToString = createUnsupportedFunction(
  entrypoint,
  'renderToString'
);
exports.renderToStaticMarkup = createUnsupportedFunction(
  entrypoint,
  'renderToStaticMarkup'
);

definePlaceholderMetadata(module.exports, entrypoint);
