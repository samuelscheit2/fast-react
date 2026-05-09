'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/server.edge';

exports.version = placeholderVersion;
exports.renderToReadableStream = createUnsupportedFunction(
  entrypoint,
  'renderToReadableStream'
);
exports.renderToString = createUnsupportedFunction(
  entrypoint,
  'renderToString'
);
exports.renderToStaticMarkup = createUnsupportedFunction(
  entrypoint,
  'renderToStaticMarkup'
);
exports.resume = createUnsupportedFunction(entrypoint, 'resume');

definePlaceholderMetadata(module.exports, entrypoint);
