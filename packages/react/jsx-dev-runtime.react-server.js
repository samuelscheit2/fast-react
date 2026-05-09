'use strict';

const { definePlaceholderMetadata } = require('./placeholder-utils.js');
const { Fragment, jsx, jsxDEV, jsxs } = require('./element-factory.js');

const entrypoint = 'react/jsx-dev-runtime';

exports.Fragment = Fragment;
exports.jsx = jsx;
exports.jsxDEV = jsxDEV;
exports.jsxs = jsxs;

definePlaceholderMetadata(module.exports, `${entrypoint} react-server`);
