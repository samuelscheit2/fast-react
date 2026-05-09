'use strict';

const REACT_CONTEXT_TYPE = Symbol.for('react.context');
const REACT_CONSUMER_TYPE = Symbol.for('react.consumer');

const isDevelopment = process.env.NODE_ENV !== 'production';

const createContext = function (defaultValue) {
  const context = {
    $$typeof: REACT_CONTEXT_TYPE,
    _currentValue: defaultValue,
    _currentValue2: defaultValue,
    _threadCount: 0,
    Provider: null,
    Consumer: null
  };

  context.Provider = context;
  context.Consumer = {
    $$typeof: REACT_CONSUMER_TYPE,
    _context: context
  };

  if (isDevelopment) {
    context._currentRenderer = null;
    context._currentRenderer2 = null;
  }

  return context;
};

Object.defineProperty(createContext, 'name', {
  configurable: true,
  value: ''
});

module.exports = {
  createContext
};
