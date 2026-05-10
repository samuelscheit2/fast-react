'use strict';

const mutation = require('./mutation.js');
const textContent = require('./text-content.js');

module.exports = {
  ...mutation,
  ...textContent
};
