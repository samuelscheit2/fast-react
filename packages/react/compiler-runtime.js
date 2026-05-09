'use strict';

const {
  createUnimplementedFunction,
  definePlaceholderMetadata
} = require('./placeholder-utils.js');

const entrypoint = 'react/compiler-runtime';

exports.c = createUnimplementedFunction(entrypoint, 'c');

definePlaceholderMetadata(module.exports, entrypoint);
