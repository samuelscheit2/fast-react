'use strict';

const {
  createUnimplementedFunction,
  definePlaceholderMetadata
} = require('./placeholder-utils.js');

const entrypoint = 'react/jsx-dev-runtime';

exports.Fragment = Symbol.for('react.fragment');
exports.jsx = createUnimplementedFunction(entrypoint, 'jsx');
exports.jsxDEV = createUnimplementedFunction(entrypoint, 'jsxDEV');
exports.jsxs = createUnimplementedFunction(entrypoint, 'jsxs');

definePlaceholderMetadata(module.exports, `${entrypoint} react-server`);
