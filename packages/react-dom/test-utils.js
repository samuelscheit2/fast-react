'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/test-utils';

exports.act = createUnsupportedFunction(entrypoint, 'act', 1);

definePlaceholderMetadata(module.exports, entrypoint);
