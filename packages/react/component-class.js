'use strict';

const isDevelopment = process.env.NODE_ENV !== 'production';

const emptyObject = {};
if (isDevelopment) {
  Object.freeze(emptyObject);
}

const didWarnStateUpdateForUnmountedComponent = {};

const ReactNoopUpdateQueue = isDevelopment
  ? {
      isMounted: function () {
        return false;
      },
      enqueueForceUpdate: function (publicInstance) {
        warnNoop(publicInstance, 'forceUpdate');
      },
      enqueueReplaceState: function (publicInstance) {
        warnNoop(publicInstance, 'replaceState');
      },
      enqueueSetState: function (publicInstance) {
        warnNoop(publicInstance, 'setState');
      }
    }
  : {
      isMounted: function () {
        return false;
      },
      enqueueForceUpdate: function () {},
      enqueueReplaceState: function () {},
      enqueueSetState: function () {}
    };

function warnNoop(publicInstance, callerName) {
  const constructor = publicInstance.constructor;
  const componentName =
    (constructor && (constructor.displayName || constructor.name)) ||
    'ReactClass';
  const warningKey = `${componentName}.${callerName}`;

  if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
    return;
  }

  console.error(
    "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
    callerName,
    componentName
  );
  didWarnStateUpdateForUnmountedComponent[warningKey] = true;
}

function Component(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

Component.prototype.isReactComponent = {};

Component.prototype.setState = function (partialState, callback) {
  if (
    typeof partialState !== 'object' &&
    typeof partialState !== 'function' &&
    partialState != null
  ) {
    throw new Error(
      'takes an object of state variables to update or a function which returns an object of state variables.'
    );
  }

  this.updater.enqueueSetState(this, partialState, callback, 'setState');
};

Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};

if (isDevelopment) {
  defineDeprecationWarning('isMounted', [
    'isMounted',
    'Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks.'
  ]);
  defineDeprecationWarning('replaceState', [
    'replaceState',
    'Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236).'
  ]);
}

function defineDeprecationWarning(methodName, info) {
  Object.defineProperty(Component.prototype, methodName, {
    get: function () {
      console.warn(
        '%s(...) is deprecated in plain JavaScript React classes. %s',
        info[0],
        info[1]
      );
    }
  });
}

function ComponentDummy() {}

ComponentDummy.prototype = Component.prototype;

function PureComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = emptyObject;
  this.updater = updater || ReactNoopUpdateQueue;
}

const pureComponentPrototype = (PureComponent.prototype = new ComponentDummy());
pureComponentPrototype.constructor = PureComponent;
Object.assign(pureComponentPrototype, Component.prototype);
pureComponentPrototype.isPureReactComponent = true;

module.exports = {
  Component,
  PureComponent
};
