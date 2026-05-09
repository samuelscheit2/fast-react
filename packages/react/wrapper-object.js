'use strict';

const REACT_MEMO_TYPE = Symbol.for('react.memo');
const REACT_LAZY_TYPE = Symbol.for('react.lazy');

const isDevelopment = process.env.NODE_ENV !== 'production';
const createConsoleTask =
  typeof console.createTask === 'function'
    ? console.createTask
    : function createMissingConsoleTask() {
        return null;
      };

function memo(type, compare) {
  if (isDevelopment && type == null) {
    console.error(
      'memo: The first argument must be a component. Instead received: %s',
      type === null ? 'null' : typeof type
    );
  }

  const elementType = {
    $$typeof: REACT_MEMO_TYPE,
    type,
    compare: compare === undefined ? null : compare
  };

  if (isDevelopment) {
    let ownName;
    Object.defineProperty(elementType, 'displayName', {
      enumerable: false,
      configurable: true,
      get() {
        return ownName;
      },
      set(name) {
        ownName = name;
        if (!type.name && !type.displayName) {
          Object.defineProperty(type, 'name', { value: name });
          type.displayName = name;
        }
      }
    });
  }

  return elementType;
}

function lazy(ctor) {
  const payload = {
    _status: -1,
    _result: ctor
  };

  const lazyType = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: payload,
    _init: lazyInitializer
  };

  if (isDevelopment) {
    const ioInfo = {
      name: 'lazy',
      start: -1,
      end: -1,
      value: null,
      owner: null,
      debugStack: Error('react-stack-top-frame'),
      debugTask: createConsoleTask('lazy()')
    };
    payload._ioInfo = ioInfo;
    lazyType._debugInfo = [{ awaited: ioInfo }];
  }

  return lazyType;
}

function lazyInitializer(payload) {
  if (isDevelopment) {
    return lazyInitializerDevelopment(payload);
  }

  return lazyInitializerProduction(payload);
}

function lazyInitializerDevelopment(payload) {
  let ioInfo;

  if (payload._status === -1) {
    ioInfo = payload._ioInfo;
    if (ioInfo != null) {
      ioInfo.start = ioInfo.end = performance.now();
    }

    ioInfo = payload._result;
    const thenable = ioInfo();
    thenable.then(
      function (moduleObject) {
        if (payload._status === 0 || payload._status === -1) {
          payload._status = 1;
          payload._result = moduleObject;
          const nextIoInfo = payload._ioInfo;
          if (nextIoInfo != null) {
            nextIoInfo.end = performance.now();
          }
          if (thenable.status === undefined) {
            thenable.status = 'fulfilled';
            thenable.value = moduleObject;
          }
        }
      },
      function (error) {
        if (payload._status === 0 || payload._status === -1) {
          payload._status = 2;
          payload._result = error;
          const nextIoInfo = payload._ioInfo;
          if (nextIoInfo != null) {
            nextIoInfo.end = performance.now();
          }
          if (thenable.status === undefined) {
            thenable.status = 'rejected';
            thenable.reason = error;
          }
        }
      }
    );

    ioInfo = payload._ioInfo;
    if (ioInfo != null) {
      ioInfo.value = thenable;
      const displayName = thenable.displayName;
      if (typeof displayName === 'string') {
        ioInfo.name = displayName;
      }
    }

    if (payload._status === -1) {
      payload._status = 0;
      payload._result = thenable;
    }
  }

  if (payload._status === 1) {
    ioInfo = payload._result;
    if (ioInfo === undefined) {
      console.error(
        "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
        ioInfo
      );
    }
    if (!('default' in ioInfo)) {
      console.error(
        "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
        ioInfo
      );
    }
    return ioInfo.default;
  }

  throw payload._result;
}

function lazyInitializerProduction(payload) {
  if (payload._status === -1) {
    let ctor = payload._result;
    ctor = ctor();
    ctor.then(
      function (moduleObject) {
        if (payload._status === 0 || payload._status === -1) {
          payload._status = 1;
          payload._result = moduleObject;
        }
      },
      function (error) {
        if (payload._status === 0 || payload._status === -1) {
          payload._status = 2;
          payload._result = error;
        }
      }
    );

    if (payload._status === -1) {
      payload._status = 0;
      payload._result = ctor;
    }
  }

  if (payload._status === 1) {
    return payload._result.default;
  }

  throw payload._result;
}

Object.defineProperty(memo, 'name', {
  configurable: true,
  value: ''
});

Object.defineProperty(lazy, 'name', {
  configurable: true,
  value: ''
});

module.exports = {
  lazy,
  memo
};
