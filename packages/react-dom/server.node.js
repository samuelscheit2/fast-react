'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/server.node';

exports.version = placeholderVersion;
exports.renderToString = createUnsupportedFunction(
  entrypoint,
  'renderToString'
);
exports.renderToStaticMarkup = createUnsupportedFunction(
  entrypoint,
  'renderToStaticMarkup'
);
exports.renderToPipeableStream = createUnsupportedFunction(
  entrypoint,
  'renderToPipeableStream'
);
exports.renderToReadableStream = createUnsupportedFunction(
  entrypoint,
  'renderToReadableStream'
);
exports.resumeToPipeableStream = createUnsupportedFunction(
  entrypoint,
  'resumeToPipeableStream'
);
exports.resume = createUnsupportedFunction(entrypoint, 'resume');

definePlaceholderMetadata(module.exports, entrypoint);
