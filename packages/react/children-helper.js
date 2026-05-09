'use strict';

const {
  REACT_ELEMENT_TYPE,
  cloneAndReplaceKey,
  isValidElement
} = require('./element-factory.js');

const REACT_PORTAL_TYPE = Symbol.for('react.portal');
const MAYBE_ITERATOR_SYMBOL = Symbol.iterator;

const isArray = Array.isArray;
const isDevelopment = process.env.NODE_ENV !== 'production';
const userProvidedKeyEscapeRegex = /\/+/g;

let didWarnAboutMaps = false;

function createChildrenHelpers(options = {}) {
  const reactServer = options.reactServer === true;
  const traversalOptions = { reactServer };
  function mapChildren(children, func, context) {
    return mapChildrenImpl(children, func, context, traversalOptions);
  }

  return {
    map: mapChildren,
    forEach: function forEach(children, forEachFunc, forEachContext) {
      mapChildren(
        children,
        function () {
          forEachFunc.apply(this, arguments);
        },
        forEachContext
      );
    },
    count: function count(children) {
      let count = 0;
      mapChildren(children, function () {
        count += 1;
      });
      return count;
    },
    toArray: function toArray(children) {
      return (
        mapChildren(children, function (child) {
          return child;
        }) || []
      );
    },
    only: function only(children) {
      if (!isValidElement(children)) {
        throwInvalidOnlyChildError({ reactServer });
      }

      return children;
    }
  };
}

function mapChildrenImpl(children, func, context, options) {
  if (children === null || children === undefined) {
    return children;
  }

  const result = [];
  let count = 0;
  mapIntoArray(children, result, '', '', function (child) {
    return func.call(context, child, count++);
  }, options);
  return result;
}

function mapIntoArray(
  children,
  array,
  escapedPrefix,
  nameSoFar,
  callback,
  options
) {
  let type = typeof children;
  if (type === 'undefined' || type === 'boolean') {
    children = null;
  }

  let invokeCallback = false;
  if (children === null) {
    invokeCallback = true;
  } else {
    switch (type) {
      case 'bigint':
      case 'string':
      case 'number':
        invokeCallback = true;
        break;
      case 'object':
        switch (children.$$typeof) {
          case REACT_ELEMENT_TYPE:
          case REACT_PORTAL_TYPE:
            invokeCallback = true;
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
  }

  if (invokeCallback) {
    const child = children;
    let mappedChild = callback(child);
    const childKey =
      nameSoFar === '' ? `.${getElementKey(child, 0)}` : nameSoFar;

    if (isArray(mappedChild)) {
      let escapedChildKey = '';
      if (childKey !== null) {
        escapedChildKey =
          childKey.replace(userProvidedKeyEscapeRegex, '$&/') + '/';
      }
      mapIntoArray(
        mappedChild,
        array,
        escapedChildKey,
        '',
        function (c) {
          return c;
        },
        options
      );
    } else if (mappedChild !== null && mappedChild !== undefined) {
      if (isValidElement(mappedChild)) {
        if (
          mappedChild.key != null &&
          (!child || child.key !== mappedChild.key)
        ) {
          checkKeyStringCoercion(mappedChild.key);
        }

        let newKey =
          escapedPrefix +
          (mappedChild.key == null || (child && child.key === mappedChild.key)
            ? ''
            : `${String(mappedChild.key).replace(
                userProvidedKeyEscapeRegex,
                '$&/'
              )}/`) +
          childKey;
        mappedChild = cloneAndReplaceKey(mappedChild, newKey);

        if (
          isDevelopment &&
          nameSoFar !== '' &&
          child !== null &&
          isValidElement(child) &&
          child.key === null &&
          child._store &&
          !child._store.validated
        ) {
          mappedChild._store.validated = 2;
        }
      }
      array.push(mappedChild);
    }

    return 1;
  }

  let subtreeCount = 0;
  const nextNamePrefix = nameSoFar === '' ? '.' : `${nameSoFar}:`;

  if (isArray(children)) {
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      const nextName = nextNamePrefix + getElementKey(child, index);
      subtreeCount += mapIntoArray(
        child,
        array,
        escapedPrefix,
        nextName,
        callback,
        options
      );
    }
  } else {
    const iteratorFn = getIteratorFn(children);
    if (typeof iteratorFn === 'function') {
      if (isDevelopment && iteratorFn === children.entries) {
        if (!didWarnAboutMaps) {
          console.warn(
            'Using Maps as children is not supported. Use an array of keyed ReactElements instead.'
          );
        }
        didWarnAboutMaps = true;
      }

      const iterator = iteratorFn.call(children);
      let index = 0;
      let step;
      while (!(step = iterator.next()).done) {
        const child = step.value;
        const nextName = nextNamePrefix + getElementKey(child, index++);
        subtreeCount += mapIntoArray(
          child,
          array,
          escapedPrefix,
          nextName,
          callback,
          options
        );
      }
    } else if (type === 'object') {
      if (typeof children.then === 'function') {
        return mapIntoArray(
          resolveThenable(children),
          array,
          escapedPrefix,
          nameSoFar,
          callback,
          options
        );
      }

      const childrenString = String(children);
      throwInvalidObjectChildError(children, childrenString, options);
    }
  }

  return subtreeCount;
}

function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }

  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable['@@iterator'];
  return typeof maybeIterator === 'function' ? maybeIterator : null;
}

function getElementKey(element, index) {
  if (typeof element === 'object' && element !== null && element.key != null) {
    checkKeyStringCoercion(element.key);
    return escapeKey(String(element.key));
  }

  return index.toString(36);
}

function escapeKey(key) {
  const escaperLookup = {
    '=': '=0',
    ':': '=2'
  };
  return (
    '$' +
    key.replace(/[=:]/g, function (match) {
      return escaperLookup[match];
    })
  );
}

function resolveThenable(thenable) {
  switch (thenable.status) {
    case 'fulfilled':
      return thenable.value;
    case 'rejected':
      throw thenable.reason;
    default:
      if (typeof thenable.status === 'string') {
        thenable.then(noop, noop);
      } else {
        thenable.status = 'pending';
        thenable.then(
          function (fulfilledValue) {
            if (thenable.status === 'pending') {
              thenable.status = 'fulfilled';
              thenable.value = fulfilledValue;
            }
          },
          function (error) {
            if (thenable.status === 'pending') {
              thenable.status = 'rejected';
              thenable.reason = error;
            }
          }
        );
      }

      switch (thenable.status) {
        case 'fulfilled':
          return thenable.value;
        case 'rejected':
          throw thenable.reason;
        default:
          throw thenable;
      }
  }
}

function noop() {}

function throwInvalidObjectChildError(children, childrenString, options) {
  const childDescription =
    childrenString === '[object Object]'
      ? `object with keys {${Object.keys(children).join(', ')}}`
      : childrenString;

  if (isReactServerProduction(options)) {
    throw new Error(formatProdErrorMessage(31, childDescription));
  }

  throw new Error(
    'Objects are not valid as a React child (found: ' +
      childDescription +
      '). If you meant to render a collection of children, use an array instead.'
  );
}

function throwInvalidOnlyChildError(options) {
  if (options.reactServer && !isDevelopment) {
    throw new Error(formatProdErrorMessage(143));
  }

  throw new Error(
    'React.Children.only expected to receive a single React element child.'
  );
}

function isReactServerProduction(options) {
  return options?.reactServer === true && !isDevelopment;
}

function formatProdErrorMessage(code, ...args) {
  let url = `https://react.dev/errors/${code}`;
  if (args.length > 0) {
    url += `?args[]=${encodeURIComponent(args[0])}`;
    for (let index = 1; index < args.length; index += 1) {
      url += `&args[]=${encodeURIComponent(args[index])}`;
    }
  }

  return (
    `Minified React error #${code}; visit ${url} for the full message or ` +
    'use the non-minified dev environment for full errors and additional helpful warnings.'
  );
}

function checkKeyStringCoercion(value) {
  try {
    testStringCoercion(value);
  } catch (_error) {
    if (isDevelopment) {
      console.error(
        'The provided key is an unsupported type %s. This value must be coerced to a string before using it here.',
        getUnsupportedKeyTypeName(value)
      );
    }
    return testStringCoercion(value);
  }

  return undefined;
}

function testStringCoercion(value) {
  return '' + value;
}

function getUnsupportedKeyTypeName(value) {
  return (
    (typeof Symbol === 'function' &&
      Symbol.toStringTag &&
      value &&
      value[Symbol.toStringTag]) ||
    value?.constructor?.name ||
    'Object'
  );
}

module.exports = {
  createChildrenHelpers
};
