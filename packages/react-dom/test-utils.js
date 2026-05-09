'use strict';

const {
  createUnsupportedFunction,
  definePlaceholderMetadata
} = require('./placeholder-utils.js');

const entrypoint = 'react-dom/test-utils';

exports.act = createUnsupportedFunction(entrypoint, 'act');

definePlaceholderMetadata(module.exports, entrypoint);
