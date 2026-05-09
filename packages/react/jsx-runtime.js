'use strict';

const { definePlaceholderMetadata } = require('./placeholder-utils.js');
const { Fragment, jsx, jsxs } = require('./element-factory.js');

const entrypoint = 'react/jsx-runtime';

exports.Fragment = Fragment;
exports.jsx = jsx;
exports.jsxs = jsxs;

definePlaceholderMetadata(module.exports, entrypoint);
