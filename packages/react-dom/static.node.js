'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata,
  placeholderVersion
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/static.node';

exports.version = placeholderVersion;
exports.prerenderToNodeStream = createUnsupportedFunction(
  entrypoint,
  'prerenderToNodeStream'
);
exports.prerender = createUnsupportedFunction(entrypoint, 'prerender');
exports.resumeAndPrerenderToNodeStream = createUnsupportedFunction(
  entrypoint,
  'resumeAndPrerenderToNodeStream'
);
exports.resumeAndPrerender = createUnsupportedFunction(
  entrypoint,
  'resumeAndPrerender'
);

definePlaceholderMetadata(module.exports, entrypoint);
