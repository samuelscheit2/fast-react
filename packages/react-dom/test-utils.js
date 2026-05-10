'use strict';

const {
  definePlaceholderMetadata
} = require('./placeholder-utils.js');
const {
  createReactDomTestUtilsActPlaceholder
} = require('./src/test-utils-act-gate.js');

const entrypoint = 'react-dom/test-utils';

exports.act = createReactDomTestUtilsActPlaceholder();

definePlaceholderMetadata(module.exports, entrypoint);
