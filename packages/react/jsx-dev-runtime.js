'use strict';

const { definePlaceholderMetadata } = require('./placeholder-utils.js');
const { Fragment, jsxDEV } = require('./element-factory.js');

const entrypoint = 'react/jsx-dev-runtime';

exports.Fragment = Fragment;
exports.jsxDEV = jsxDEV;

definePlaceholderMetadata(module.exports, entrypoint);
