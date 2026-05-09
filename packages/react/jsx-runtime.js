'use strict';

const {
  createUnimplementedFunction,
  definePlaceholderMetadata
} = require('./placeholder-utils.js');

const entrypoint = 'react/jsx-runtime';
const Fragment = Symbol.for('react.fragment');

exports.Fragment = Fragment;
exports.jsx = createUnimplementedFunction(entrypoint, 'jsx');
exports.jsxs = createUnimplementedFunction(entrypoint, 'jsxs');

definePlaceholderMetadata(module.exports, entrypoint);
