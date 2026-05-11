'use strict';

const REACT_CONTEXT_TYPE = Symbol.for('react.context');
const REACT_CONSUMER_TYPE = Symbol.for('react.consumer');

const isDevelopment = process.env.NODE_ENV !== 'production';
const sourceOwnedContextObjects = new WeakSet();
const sourceOwnedContextObjectMetadata = Object.freeze({
  capability: 'fast-react.private.source_owned_context_object',
  compatibilityTarget: 'react@19.2.6',
  source: 'packages/react/context-object.js',
  createContextDirectObjectBehavior: true,
  useContextConsumptionCompatibility: false,
  providerRendererCompatibility: false,
  packageCompatibility: false,
  compatibilityClaimed: false
});

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

  sourceOwnedContextObjects.add(context);
  return context;
};

Object.defineProperty(createContext, 'name', {
  configurable: true,
  value: ''
});

function isSourceOwnedContextObject(context) {
  return sourceOwnedContextObjects.has(context);
}

function getSourceOwnedContextObjectMetadata(context) {
  return isSourceOwnedContextObject(context)
    ? sourceOwnedContextObjectMetadata
    : null;
}

module.exports = {
  createContext,
  getSourceOwnedContextObjectMetadata,
  isSourceOwnedContextObject,
  sourceOwnedContextObjectMetadata
};
