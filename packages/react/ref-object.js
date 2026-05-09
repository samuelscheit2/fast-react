'use strict';

const isDevelopment = process.env.NODE_ENV !== 'production';

function createRef() {
  const refObject = {
    current: null
  };

  if (isDevelopment) {
    Object.seal(refObject);
  }

  return refObject;
}

Object.defineProperty(createRef, 'name', {
  configurable: true,
  value: ''
});

module.exports = {
  createRef
};
