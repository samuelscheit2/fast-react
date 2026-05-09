import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);
const reactPackageRoot = path.join(repoRoot, 'packages', 'react');

process.env.NODE_ENV = 'development';

const defaultReactKeys = [
  'Activity',
  'Children',
  'Component',
  'Fragment',
  'Profiler',
  'PureComponent',
  'StrictMode',
  'Suspense',
  '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
  '__COMPILER_RUNTIME',
  'act',
  'cache',
  'cacheSignal',
  'captureOwnerStack',
  'cloneElement',
  'createContext',
  'createElement',
  'createRef',
  'forwardRef',
  'isValidElement',
  'lazy',
  'memo',
  'startTransition',
  'unstable_useCacheRefresh',
  'use',
  'useActionState',
  'useCallback',
  'useContext',
  'useDebugValue',
  'useDeferredValue',
  'useEffect',
  'useEffectEvent',
  'useId',
  'useImperativeHandle',
  'useInsertionEffect',
  'useLayoutEffect',
  'useMemo',
  'useOptimistic',
  'useReducer',
  'useRef',
  'useState',
  'useSyncExternalStore',
  'useTransition',
  'version'
];

const reactServerReactKeys = [
  'Children',
  'Fragment',
  'Profiler',
  'StrictMode',
  'Suspense',
  '__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
  'cache',
  'cacheSignal',
  'captureOwnerStack',
  'cloneElement',
  'createElement',
  'createRef',
  'forwardRef',
  'isValidElement',
  'lazy',
  'memo',
  'use',
  'useCallback',
  'useDebugValue',
  'useId',
  'useMemo',
  'version'
];

const jsxRuntimeKeys = ['Fragment', 'jsx', 'jsxs'];
const jsxDevRuntimeKeys = ['Fragment', 'jsxDEV'];
const reactServerJsxRuntimeKeys = ['Fragment', 'jsx', 'jsxDEV', 'jsxs'];
const compilerRuntimeKeys = ['c'];

const defaultEntrypoints = [
  {
    fileName: 'index.js',
    keys: defaultReactKeys,
    resolvedFileName: 'index.js',
    specifier: '@fast-react/react'
  },
  {
    fileName: 'jsx-runtime.js',
    keys: jsxRuntimeKeys,
    resolvedFileName: 'jsx-runtime.js',
    specifier: '@fast-react/react/jsx-runtime'
  },
  {
    fileName: 'jsx-dev-runtime.js',
    keys: jsxDevRuntimeKeys,
    resolvedFileName: 'jsx-dev-runtime.js',
    specifier: '@fast-react/react/jsx-dev-runtime'
  },
  {
    fileName: 'compiler-runtime.js',
    keys: compilerRuntimeKeys,
    resolvedFileName: 'compiler-runtime.js',
    specifier: '@fast-react/react/compiler-runtime'
  }
];

const reactServerEntrypoints = [
  {
    fileName: 'react.react-server.js',
    keys: reactServerReactKeys,
    resolvedFileName: 'react.react-server.js',
    specifier: '@fast-react/react'
  },
  {
    fileName: 'jsx-runtime.react-server.js',
    keys: reactServerJsxRuntimeKeys,
    resolvedFileName: 'jsx-runtime.react-server.js',
    specifier: '@fast-react/react/jsx-runtime'
  },
  {
    fileName: 'jsx-dev-runtime.react-server.js',
    keys: reactServerJsxRuntimeKeys,
    resolvedFileName: 'jsx-dev-runtime.react-server.js',
    specifier: '@fast-react/react/jsx-dev-runtime'
  },
  {
    fileName: 'compiler-runtime.js',
    keys: compilerRuntimeKeys,
    resolvedFileName: 'compiler-runtime.js',
    specifier: '@fast-react/react/compiler-runtime'
  }
];

const expectedPackageExports = {
  '.': {
    'react-server': './react.react-server.js',
    default: './index.js'
  },
  './jsx-runtime': {
    'react-server': './jsx-runtime.react-server.js',
    default: './jsx-runtime.js'
  },
  './jsx-dev-runtime': {
    'react-server': './jsx-dev-runtime.react-server.js',
    default: './jsx-dev-runtime.js'
  },
  './compiler-runtime': {
    'react-server': './compiler-runtime.js',
    default: './compiler-runtime.js'
  },
  './package.json': './package.json'
};

const blockedExtensionSubpaths = [
  '@fast-react/react/index.js',
  '@fast-react/react/jsx-runtime.js',
  '@fast-react/react/jsx-dev-runtime.js',
  '@fast-react/react/compiler-runtime.js',
  '@fast-react/react/react.react-server.js',
  '@fast-react/react/jsx-runtime.react-server.js',
  '@fast-react/react/jsx-dev-runtime.react-server.js',
  '@fast-react/react/children-helper.js',
  '@fast-react/react/context-object.js',
  '@fast-react/react/element-factory.js',
  '@fast-react/react/ref-object.js',
  '@fast-react/react/wrapper-object.js',
  '@fast-react/react/placeholder-utils.js'
];

function assertPlaceholderMetadata(moduleExports, label) {
  assert.equal(
    moduleExports.__FAST_REACT_PLACEHOLDER__,
    true,
    `${label} should expose non-enumerable placeholder metadata`
  );
  assert.equal(
    moduleExports.compatibilityTarget,
    'react@19.2.6',
    `${label} should expose the inventory target as non-enumerable metadata`
  );
  assert.equal(
    Object.keys(moduleExports).includes('__FAST_REACT_PLACEHOLDER__'),
    false,
    `${label} placeholder marker must not be an enumerable runtime export`
  );
  assert.equal(
    Object.keys(moduleExports).includes('compatibilityTarget'),
    false,
    `${label} compatibility metadata must not be an enumerable runtime export`
  );
}

function assertInventoryKeys(moduleExports, expectedKeys, label) {
  assert.deepEqual(Object.keys(moduleExports), expectedKeys, `${label} keys`);
  assertPlaceholderMetadata(moduleExports, label);
}

function assertUnimplemented(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, 'FastReactUnimplementedError', label);
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', label);
      assert.equal(error.compatibilityTarget, 'react@19.2.6', label);
      assert.match(error.message, /no React behavior implementation yet/, label);
      return true;
    },
    label
  );
}

function assertDevElement(element, label) {
  assert.equal(
    element.$$typeof,
    Symbol.for('react.transitional.element'),
    `${label} should use the React 19 transitional element brand`
  );
  assert.deepEqual(
    Object.keys(element),
    ['$$typeof', 'type', 'key', 'props', '_owner', '_store'],
    `${label} development element keys`
  );
  assert.deepEqual(
    Reflect.ownKeys(element),
    [
      '$$typeof',
      'type',
      'key',
      'props',
      '_owner',
      'ref',
      '_store',
      '_debugInfo',
      '_debugStack',
      '_debugTask'
    ],
    `${label} development own keys`
  );
  assert.equal(Object.isFrozen(element), true, `${label} element frozen`);
  assert.equal(Object.isFrozen(element.props), true, `${label} props frozen`);
  assert.equal(element._owner, null, `${label} direct owner placeholder`);
  assert.equal(
    Object.getOwnPropertyDescriptor(element, 'ref').enumerable,
    false,
    `${label} ref descriptor should be non-enumerable in development`
  );
}

function assertReactElementBehavior(react, label) {
  function WithDefaults() {}
  WithDefaults.defaultProps = { a: 'default-a' };

  const ref = function ref() {};
  const element = react.createElement(
    WithDefaults,
    { key: 7, ref, a: undefined },
    'first',
    'second'
  );
  assertDevElement(element, `${label}.createElement`);
  assert.equal(element.type, WithDefaults);
  assert.equal(element.key, '7');
  assert.equal(element.props.a, 'default-a');
  assert.equal(element.props.ref, ref);
  assert.deepEqual(element.props.children, ['first', 'second']);
  assert.equal(Object.isFrozen(element.props.children), true);
  assert.equal(react.isValidElement(element), true);
  assert.equal(
    react.isValidElement({
      $$typeof: Symbol.for('react.transitional.element')
    }),
    true
  );
  assert.equal(
    react.isValidElement({ $$typeof: Symbol.for('react.element') }),
    false
  );

  const clone = react.cloneElement(element, {
    key: undefined,
    ref: undefined,
    a: 'new-a'
  });
  assertDevElement(clone, `${label}.cloneElement`);
  assert.equal(clone.key, '7');
  assert.equal(clone.props.ref, ref);
  assert.equal(clone.props.a, 'new-a');
}

function assertCreateRefBehavior(react, label, options = {}) {
  const development = options.development !== false;
  const descriptor = Object.getOwnPropertyDescriptor(react, 'createRef');
  assert.equal(descriptor.enumerable, true, `${label}.createRef enumerable`);
  assert.equal(descriptor.configurable, true, `${label}.createRef configurable`);
  assert.equal(descriptor.writable, true, `${label}.createRef writable`);
  assert.equal(typeof react.createRef, 'function');
  assert.equal(react.createRef.name, '', `${label}.createRef name`);
  assert.equal(react.createRef.length, 0, `${label}.createRef length`);

  const first = react.createRef('ignored argument');
  const second = react.createRef();
  assert.notEqual(first, second, `${label}.createRef should return new objects`);
  assert.deepEqual(Object.keys(first), ['current'], `${label}.ref keys`);
  assert.deepEqual(Reflect.ownKeys(first), ['current'], `${label}.ref ownKeys`);
  assert.equal(
    Object.getPrototypeOf(first),
    Object.prototype,
    `${label}.ref prototype`
  );
  assert.equal(first.current, null, `${label}.ref initial current`);
  assert.equal(Object.isFrozen(first), false, `${label}.ref not frozen`);
  assert.equal(Object.isSealed(first), development, `${label}.ref sealed`);
  assert.equal(
    Object.isExtensible(first),
    !development,
    `${label}.ref extensible`
  );

  const currentDescriptor = Object.getOwnPropertyDescriptor(first, 'current');
  assert.deepEqual(currentDescriptor, {
    configurable: !development,
    enumerable: true,
    value: null,
    writable: true
  });

  first.current = 'next-current';
  assert.equal(first.current, 'next-current', `${label}.ref current mutable`);

  assert.equal(
    Reflect.set(first, 'extra', 42),
    !development,
    `${label}.ref extra property addability`
  );
  assert.equal(
    Object.hasOwn(first, 'extra'),
    !development,
    `${label}.ref extra property presence`
  );
  assert.equal(
    Reflect.deleteProperty(first, 'extra'),
    true,
    `${label}.ref extra property deletion`
  );
  assert.equal(
    Reflect.deleteProperty(first, 'current'),
    !development,
    `${label}.ref current configurability`
  );

  const thisArg = { untouched: true };
  const fromCall = react.createRef.call(thisArg);
  assert.deepEqual(thisArg, { untouched: true }, `${label}.createRef this`);
  assert.deepEqual(Object.keys(fromCall), ['current'], `${label}.call result`);

  const fromNew = new react.createRef();
  assert.deepEqual(Object.keys(fromNew), ['current'], `${label}.new result`);
}

function assertCreateContextBehavior(react, label, options = {}) {
  const development = options.development !== false;
  const descriptor = Object.getOwnPropertyDescriptor(react, 'createContext');
  assert.equal(descriptor.enumerable, true, `${label}.createContext enumerable`);
  assert.equal(
    descriptor.configurable,
    true,
    `${label}.createContext configurable`
  );
  assert.equal(descriptor.writable, true, `${label}.createContext writable`);
  assert.equal(typeof react.createContext, 'function');
  assert.equal(react.createContext.name, '', `${label}.createContext name`);
  assert.equal(react.createContext.length, 1, `${label}.createContext length`);

  const objectDefault = { label: 'context-default' };
  const context = react.createContext(objectDefault, 'ignored-extra');
  const expectedKeys = development
    ? [
        '$$typeof',
        '_currentValue',
        '_currentValue2',
        '_threadCount',
        'Provider',
        'Consumer',
        '_currentRenderer',
        '_currentRenderer2'
      ]
    : [
        '$$typeof',
        '_currentValue',
        '_currentValue2',
        '_threadCount',
        'Provider',
        'Consumer'
      ];

  assert.deepEqual(Object.keys(context), expectedKeys, `${label}.context keys`);
  assert.deepEqual(
    Reflect.ownKeys(context),
    expectedKeys,
    `${label}.context ownKeys`
  );
  assert.equal(context.$$typeof, Symbol.for('react.context'), label);
  assert.equal(context._currentValue, objectDefault, label);
  assert.equal(context._currentValue2, objectDefault, label);
  assert.equal(context._threadCount, 0, label);
  assert.equal(context.Provider, context, `${label}.Provider identity`);
  assert.notEqual(context.Consumer, context, `${label}.Consumer identity`);
  assert.equal(context.Consumer.$$typeof, Symbol.for('react.consumer'), label);
  assert.equal(context.Consumer._context, context, `${label}.Consumer._context`);
  assert.deepEqual(Object.keys(context.Consumer), ['$$typeof', '_context']);
  assert.equal(Object.isExtensible(context), true, `${label}.context extensible`);
  assert.equal(Object.isSealed(context), false, `${label}.context sealed`);
  assert.equal(Object.isFrozen(context), false, `${label}.context frozen`);
  assert.equal(
    Object.getPrototypeOf(context),
    Object.prototype,
    `${label}.context prototype`
  );

  if (development) {
    assert.equal(context._currentRenderer, null, label);
    assert.equal(context._currentRenderer2, null, label);
  } else {
    assert.equal(Object.hasOwn(context, '_currentRenderer'), false, label);
    assert.equal(Object.hasOwn(context, '_currentRenderer2'), false, label);
  }

  context.displayName = 'Ctx';
  assert.equal(context.displayName, 'Ctx', label);
  assert.equal(context.Provider.displayName, 'Ctx', label);
  assert.equal(context.Consumer.displayName, undefined, label);
  context.Consumer.displayName = 'ConsumerName';
  assert.equal(context.Consumer.displayName, 'ConsumerName', label);

  context._currentValue = 'current-one';
  context._currentValue2 = 'current-two';
  context._threadCount = 7;
  context._currentRenderer = 'renderer-one';
  assert.equal(context.Provider._currentValue, 'current-one', label);
  assert.equal(context._currentValue2, 'current-two', label);
  assert.equal(context._threadCount, 7, label);
  assert.equal(context._currentRenderer, 'renderer-one', label);

  const fromCall = react.createContext.call({ untouched: true }, null);
  assert.equal(fromCall._currentValue, null, `${label}.call default`);
  const fromNew = new react.createContext(Symbol.for('context-symbol'));
  assert.equal(fromNew instanceof react.createContext, false, label);
  assert.equal(fromNew._currentValue, Symbol.for('context-symbol'), label);
}

function assertChildrenBehavior(react, label, options = {}) {
  const reactServerProduction = options.reactServerProduction === true;
  const expectMapWarning =
    options.expectMapWarning ?? options.development !== false;

  assert.deepEqual(Object.keys(react.Children), [
    'map',
    'forEach',
    'count',
    'toArray',
    'only'
  ]);
  assert.equal(Object.isFrozen(react.Children), false);
  assert.equal(Object.isExtensible(react.Children), true);
  assert.equal(react.Children.map.name, 'mapChildren');
  assert.equal(react.Children.map.length, 3);
  assert.equal(react.Children.forEach.length, 3);
  assert.equal(react.Children.count.length, 1);
  assert.equal(react.Children.toArray.length, 1);
  assert.equal(react.Children.only.length, 1);

  assert.equal(react.Children.count(null), 0, `${label}.count null`);
  assert.equal(react.Children.map(null, () => 'ignored'), null);
  assert.deepEqual(react.Children.toArray(undefined), []);
  assert.equal(react.Children.count([false, , 'text']), 3);

  const callbackCalls = [];
  const context = { marker: 'children-context' };
  const forEachResult = react.Children.forEach(
    [false, , 'text'],
    function (child, index) {
      callbackCalls.push({
        child,
        index,
        thisMatches: this === context
      });
    },
    context
  );
  assert.equal(forEachResult, undefined);
  assert.deepEqual(callbackCalls, [
    { child: null, index: 0, thisMatches: true },
    { child: null, index: 1, thisMatches: true },
    { child: 'text', index: 2, thisMatches: true }
  ]);

  const keyed = react.createElement('span', { key: 'a:b=c' });
  const unkeyed = react.createElement('span', null);
  const nested = [keyed, [unkeyed, 'text'], false];
  const array = react.Children.toArray(nested);
  assert.deepEqual(
    array.map((child) =>
      react.isValidElement(child) ? child.key : child
    ),
    ['.$a=2b=0c', '.1:0', 'text']
  );
  assert.notEqual(array[0], keyed, `${label}.toArray clones keyed element`);

  const mapped = react.Children.map([keyed, unkeyed], (_child, index) =>
    react.createElement('b', { key: `mapped/key${index}` })
  );
  assert.deepEqual(
    mapped.map((child) => child.key),
    ['mapped//key0/.$a=2b=0c', 'mapped//key1/.1']
  );

  const fragment = react.createElement(
    react.Fragment,
    null,
    react.createElement('i', null, 'inside')
  );
  assert.equal(react.Children.count(fragment), 1);
  assert.equal(react.Children.only(fragment), fragment);
  assert.throws(
    () => react.Children.only([fragment]),
    /React.Children.only expected|Minified React error #143/,
    `${label}.only array`
  );

  assert.throws(
    () => react.Children.count({ plain: true }),
    reactServerProduction
      ? /Minified React error #31/
      : /Objects are not valid as a React child/,
    `${label}.invalid object`
  );

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => {
    warnings.push(args);
  };
  try {
    const mappedEntries = react.Children.toArray(
      new Map([
        ['map-key', react.createElement('span', { key: 'value-key' })]
      ])
    );
    assert.deepEqual(
      mappedEntries.map((child) =>
        react.isValidElement(child) ? child.key : child
      ),
      ['map-key', '.0:$value-key']
    );
  } finally {
    console.warn = originalWarn;
  }
  if (expectMapWarning) {
    assert.deepEqual(warnings, [
      [
        'Using Maps as children is not supported. Use an array of keyed ReactElements instead.'
      ]
    ]);
  } else {
    assert.deepEqual(warnings, []);
  }
}

function assertWrapperObjectBehavior(react, label, options = {}) {
  const development = options.development !== false;

  assert.equal(react.memo.name, '', `${label}.memo name`);
  assert.equal(react.memo.length, 2, `${label}.memo length`);
  assert.equal(react.lazy.name, '', `${label}.lazy name`);
  assert.equal(react.lazy.length, 1, `${label}.lazy length`);

  function Component() {}
  function compare() {
    return true;
  }

  const memo = react.memo(Component, compare, 'ignored-extra');
  assert.deepEqual(Object.keys(memo), ['$$typeof', 'type', 'compare']);
  assert.deepEqual(
    Reflect.ownKeys(memo),
    development
      ? ['$$typeof', 'type', 'compare', 'displayName']
      : ['$$typeof', 'type', 'compare']
  );
  assert.equal(memo.$$typeof, Symbol.for('react.memo'));
  assert.equal(memo.type, Component);
  assert.equal(memo.compare, compare);
  assert.equal(Object.isExtensible(memo), true);
  assert.equal(Object.isSealed(memo), false);
  assert.equal(Object.isFrozen(memo), false);
  assert.equal(react.memo(Component).compare, null);
  assert.equal(react.memo(Component, undefined).compare, null);
  assert.equal(react.memo(Component, false).compare, false);

  if (development) {
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => {
      errors.push(args);
    };
    try {
      react.memo(null);
      react.memo(undefined);
      react.memo(42);
    } finally {
      console.error = originalError;
    }
    assert.deepEqual(errors, [
      [
        'memo: The first argument must be a component. Instead received: %s',
        'null'
      ],
      [
        'memo: The first argument must be a component. Instead received: %s',
        'undefined'
      ]
    ]);

    const anonymous = function () {};
    Object.defineProperty(anonymous, 'name', {
      configurable: true,
      value: ''
    });
    const namedMemo = react.memo(anonymous);
    namedMemo.displayName = 'Shown';
    assert.equal(namedMemo.displayName, 'Shown');
    assert.equal(anonymous.name, 'Shown');
    assert.equal(anonymous.displayName, 'Shown');
  }

  let loaderCalls = 0;
  const lazy = react.lazy(function loader() {
    loaderCalls += 1;
    return {
      then(resolve) {
        resolve({ default: Component });
      }
    };
  }, 'ignored-extra');
  assert.equal(loaderCalls, 0, `${label}.lazy should not invoke loader`);
  assert.deepEqual(
    Object.keys(lazy),
    development
      ? ['$$typeof', '_payload', '_init', '_debugInfo']
      : ['$$typeof', '_payload', '_init']
  );
  assert.deepEqual(
    Object.keys(lazy._payload),
    development ? ['_status', '_result', '_ioInfo'] : ['_status', '_result']
  );
  assert.equal(lazy.$$typeof, Symbol.for('react.lazy'));
  assert.equal(lazy._payload._status, -1);
  assert.equal(lazy._payload._result.name, 'loader');
  assert.equal(lazy._init(lazy._payload), Component);
  assert.equal(lazy._payload._status, 1);
  assert.equal(loaderCalls, 1, `${label}.lazy _init invokes loader once`);

  const pending = react.lazy(() => ({ then() {} }));
  assert.throws(() => pending._init(pending._payload), /\[object Object\]/);
  assert.equal(pending._payload._status, 0);
}

function assertForwardRefBehavior(react, label, options = {}) {
  const development = options.development !== false;

  assert.equal(react.forwardRef.name, '', `${label}.forwardRef name`);
  assert.equal(react.forwardRef.length, 1, `${label}.forwardRef length`);

  function Render(_props, _ref) {}
  const forwardRef = react.forwardRef(Render, 'ignored-extra');
  assert.deepEqual(Object.keys(forwardRef), ['$$typeof', 'render'], label);
  assert.deepEqual(
    Reflect.ownKeys(forwardRef),
    development
      ? ['$$typeof', 'render', 'displayName']
      : ['$$typeof', 'render'],
    label
  );
  assert.equal(forwardRef.$$typeof, Symbol.for('react.forward_ref'), label);
  assert.equal(forwardRef.render, Render, label);
  assert.equal(Object.isExtensible(forwardRef), true, label);
  assert.equal(Object.isSealed(forwardRef), false, label);
  assert.equal(Object.isFrozen(forwardRef), false, label);

  const thisArg = { untouched: true };
  const fromCall = react.forwardRef.call(thisArg, Render);
  assert.equal(fromCall.render, Render, `${label}.forwardRef call`);
  assert.deepEqual(thisArg, { untouched: true }, `${label}.forwardRef this`);

  const fromNew = new react.forwardRef(Render);
  assert.equal(fromNew.render, Render, `${label}.new forwardRef render`);
  assert.equal(
    fromNew instanceof react.forwardRef,
    false,
    `${label}.new forwardRef instance`
  );

  if (development) {
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => {
      errors.push(args);
    };
    try {
      function MissingRef(_props) {}
      function TooMany(_props, _ref, _extra) {}
      function WithDefaultProps(_props, _ref) {}
      WithDefaultProps.defaultProps = { label: 'default' };
      react.forwardRef(MissingRef);
      react.forwardRef(TooMany);
      react.forwardRef(WithDefaultProps);
      react.forwardRef(null);
      react.forwardRef(react.memo(Render));
    } finally {
      console.error = originalError;
    }
    assert.deepEqual(errors, [
      [
        'forwardRef render functions accept exactly two parameters: props and ref. %s',
        'Did you forget to use the ref parameter?'
      ],
      [
        'forwardRef render functions accept exactly two parameters: props and ref. %s',
        'Any additional parameter will be undefined.'
      ],
      [
        'forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?'
      ],
      ['forwardRef requires a render function but was given %s.', 'null'],
      [
        'forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).'
      ]
    ]);

    const anonymous = function () {};
    Object.defineProperty(anonymous, 'name', {
      configurable: true,
      value: ''
    });
    const namedForwardRef = react.forwardRef(anonymous);
    namedForwardRef.displayName = 'Shown';
    assert.equal(namedForwardRef.displayName, 'Shown');
    assert.equal(anonymous.name, 'Shown');
    assert.equal(anonymous.displayName, 'Shown');
  } else {
    forwardRef.displayName = 'Shown';
    assert.equal(forwardRef.displayName, 'Shown');
    assert.deepEqual(Object.keys(forwardRef), [
      '$$typeof',
      'render',
      'displayName'
    ]);
  }
}

function assertJsxRuntimeBehavior(runtime, label) {
  const config = { children: 'child' };
  const element = runtime.jsx('div', config);
  assertDevElement(element, `${label}.jsx`);
  assert.equal(element.type, 'div');
  assert.equal(element.key, null);
  assert.equal(element.props, config, `${label}.jsx should reuse keyless config`);
  assert.equal(Object.isFrozen(config), true);

  const children = ['first', 'second'];
  const staticElement = runtime.jsxs('div', { children });
  assertDevElement(staticElement, `${label}.jsxs`);
  assert.equal(staticElement.props.children, children);
  assert.equal(Object.isFrozen(children), true);
}

function assertJsxDevRuntimeBehavior(runtime, label) {
  const element = runtime.jsxDEV(
    'div',
    { id: 'dev-id' },
    'dev-key',
    false,
    { fileName: 'source.js', lineNumber: 1, columnNumber: 1 },
    undefined
  );
  assertDevElement(element, `${label}.jsxDEV`);
  assert.equal(element.type, 'div');
  assert.equal(element.key, 'dev-key');
  assert.equal(element.props.id, 'dev-id');
}

async function assertFileEntrypoint(entrypoint, labelPrefix) {
  const absolutePath = path.join(reactPackageRoot, entrypoint.fileName);
  const cjsModule = require(absolutePath);
  assertInventoryKeys(cjsModule, entrypoint.keys, `${labelPrefix} CJS`);

  const esmModule = await import(pathToFileURL(absolutePath).href);
  assert.equal(esmModule.default, cjsModule, `${labelPrefix} ESM default`);

  for (const key of entrypoint.keys) {
    assert.equal(
      esmModule[key],
      cjsModule[key],
      `${labelPrefix} should expose ${key} through Node CJS named import interop`
    );
  }
}

function assertReactPlaceholderBehavior(react, label, options = {}) {
  assert.equal(react.version, '0.0.0-fast-react-placeholder');
  assert.equal(typeof react.createElement, 'function');
  assertReactElementBehavior(react, label);
  if (Object.hasOwn(react, 'createContext')) {
    assertCreateContextBehavior(react, label, options);
  } else {
    assert.equal(react.createContext, undefined, `${label}.createContext`);
  }
  assertCreateRefBehavior(react, label);
  assertChildrenBehavior(react, label, options);
  assertWrapperObjectBehavior(react, label, options);
  assertForwardRefBehavior(react, label, options);

  if (Object.hasOwn(react, 'useRef')) {
    assertUnimplemented(() => react.useRef(null), `${label}.useRef`);
  }

  if (Object.hasOwn(react, 'Component')) {
    assertUnimplemented(() => new react.Component(), `${label}.Component`);
  }

  const privateInternals =
    react.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ??
    react.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  assert.equal(typeof privateInternals, 'object');
  assert.deepEqual(Object.keys(privateInternals), []);
  assert.deepEqual(Reflect.ownKeys(privateInternals), []);
  assertUnimplemented(
    () => privateInternals.Dispatcher,
    `${label}.privateInternals.Dispatcher`
  );
}

async function assertDirectFileEntrypoints() {
  for (const entrypoint of defaultEntrypoints) {
    await assertFileEntrypoint(entrypoint, `default ${entrypoint.fileName}`);
  }

  for (const entrypoint of reactServerEntrypoints) {
    await assertFileEntrypoint(
      entrypoint,
      `react-server ${entrypoint.fileName}`
    );
  }

  const react = require(path.join(reactPackageRoot, 'index.js'));
  assertReactPlaceholderBehavior(react, 'react');

  const reactServer = require(
    path.join(reactPackageRoot, 'react.react-server.js')
  );
  assertReactPlaceholderBehavior(reactServer, 'react react-server', {
    expectMapWarning: false
  });

  const jsxRuntime = require(path.join(reactPackageRoot, 'jsx-runtime.js'));
  assertJsxRuntimeBehavior(jsxRuntime, 'react/jsx-runtime');

  const jsxDevRuntime = require(
    path.join(reactPackageRoot, 'jsx-dev-runtime.js')
  );
  assertJsxDevRuntimeBehavior(jsxDevRuntime, 'react/jsx-dev-runtime');

  const reactServerJsxRuntime = require(
    path.join(reactPackageRoot, 'jsx-runtime.react-server.js')
  );
  assertJsxRuntimeBehavior(
    reactServerJsxRuntime,
    'react-server react/jsx-runtime'
  );
  assertJsxDevRuntimeBehavior(
    reactServerJsxRuntime,
    'react-server react/jsx-runtime'
  );

  const reactServerJsxDevRuntime = require(
    path.join(reactPackageRoot, 'jsx-dev-runtime.react-server.js')
  );
  assertJsxRuntimeBehavior(
    reactServerJsxDevRuntime,
    'react-server react/jsx-dev-runtime'
  );
  assertJsxDevRuntimeBehavior(
    reactServerJsxDevRuntime,
    'react-server react/jsx-dev-runtime'
  );

  const compilerRuntime = require(
    path.join(reactPackageRoot, 'compiler-runtime.js')
  );
  assertUnimplemented(() => compilerRuntime.c(0), 'react/compiler-runtime.c');
  await assertProductionJsxDevUndefined();
}

async function assertProductionJsxDevUndefined() {
  const probeSource = `
    'use strict';
    const assert = require('node:assert/strict');
    const react = require(${JSON.stringify(
      path.join(reactPackageRoot, 'index.js')
    )});
    const reactServer = require(${JSON.stringify(
      path.join(reactPackageRoot, 'react.react-server.js')
    )});
    const jsxDevRuntime = require(${JSON.stringify(
      path.join(reactPackageRoot, 'jsx-dev-runtime.js')
    )});
    const reactServerJsxRuntime = require(${JSON.stringify(
      path.join(reactPackageRoot, 'jsx-runtime.react-server.js')
    )});
    assert.equal(Object.hasOwn(jsxDevRuntime, 'jsxDEV'), true);
    assert.equal(jsxDevRuntime.jsxDEV, undefined);
    assert.equal(Object.hasOwn(reactServerJsxRuntime, 'jsxDEV'), true);
    assert.equal(reactServerJsxRuntime.jsxDEV, undefined);

    for (const [label, React] of [['react', react], ['react-server', reactServer]]) {
      if (label === 'react') {
        assert.equal(React.createContext.name, '', label);
        assert.equal(React.createContext.length, 1, label);
        const context = React.createContext({ label: 'prod-default' });
        assert.deepEqual(Object.keys(context), [
          '$$typeof',
          '_currentValue',
          '_currentValue2',
          '_threadCount',
          'Provider',
          'Consumer'
        ], label);
        assert.deepEqual(Reflect.ownKeys(context), [
          '$$typeof',
          '_currentValue',
          '_currentValue2',
          '_threadCount',
          'Provider',
          'Consumer'
        ], label);
        assert.equal(context.$$typeof, Symbol.for('react.context'), label);
        assert.equal(context.Provider, context, label);
        assert.equal(context.Consumer.$$typeof, Symbol.for('react.consumer'), label);
        assert.equal(context.Consumer._context, context, label);
        assert.equal(Object.hasOwn(context, '_currentRenderer'), false, label);
        assert.equal(Object.hasOwn(context, '_currentRenderer2'), false, label);
        context.displayName = 'ProdContext';
        assert.equal(context.Provider.displayName, 'ProdContext', label);
        context.Consumer.displayName = 'ProdConsumer';
        assert.equal(context.Consumer.displayName, 'ProdConsumer', label);
        const constructed = new React.createContext(Symbol.for('prod-context'));
        assert.equal(constructed instanceof React.createContext, false, label);
        assert.equal(constructed._currentValue, Symbol.for('prod-context'), label);
      } else {
        assert.equal(Object.hasOwn(React, 'createContext'), false, label);
        assert.equal(React.createContext, undefined, label);
      }

      assert.equal(React.createRef.name, '', label);
      assert.equal(React.createRef.length, 0, label);
      const ref = React.createRef('ignored');
      assert.deepEqual(Object.keys(ref), ['current'], label);
      assert.equal(Object.isSealed(ref), false, label);
      assert.equal(Object.isExtensible(ref), true, label);
      assert.deepEqual(Object.getOwnPropertyDescriptor(ref, 'current'), {
        configurable: true,
        enumerable: true,
        value: null,
        writable: true
      });
      ref.current = 'next';
      ref.extra = 42;
      assert.equal(ref.current, 'next', label);
      assert.equal(ref.extra, 42, label);
      assert.equal(delete ref.extra, true, label);
      assert.equal(delete ref.current, true, label);
      assert.deepEqual(Object.keys(new React.createRef()), ['current'], label);

      assert.deepEqual(Object.keys(React.Children), [
        'map',
        'forEach',
        'count',
        'toArray',
        'only'
      ]);
      assert.equal(React.Children.map.name, 'mapChildren', label);
      assert.equal(React.Children.map.length, 3, label);
      assert.equal(React.Children.count([false, , 'text']), 3, label);
      const childCalls = [];
      React.Children.forEach([false, , 'text'], (child, index) => {
        childCalls.push([child, index]);
      });
      assert.deepEqual(childCalls, [[null, 0], [null, 1], ['text', 2]], label);
      const keyed = React.createElement('span', { key: 'a:b=c' });
      const unkeyed = React.createElement('span', null);
      assert.deepEqual(
        React.Children.toArray([keyed, [unkeyed], false]).map((child) =>
          React.isValidElement(child) ? child.key : child
        ),
        ['.$a=2b=0c', '.1:0'],
        label
      );
      const mapped = React.Children.map([keyed, unkeyed], (_child, index) =>
        React.createElement('b', { key: 'mapped/key' + index })
      );
      assert.deepEqual(
        mapped.map((child) => child.key),
        ['mapped//key0/.$a=2b=0c', 'mapped//key1/.1'],
        label
      );
      assert.throws(
        () => React.Children.count({ plain: true }),
        label === 'react-server'
          ? /Minified React error #31/
          : /Objects are not valid as a React child/,
        label
      );

      function Component() {}
      function compare() {
        return true;
      }
      const memo = React.memo(Component, compare, 'ignored-extra');
      assert.deepEqual(Object.keys(memo), ['$$typeof', 'type', 'compare'], label);
      assert.deepEqual(Reflect.ownKeys(memo), ['$$typeof', 'type', 'compare'], label);
      assert.equal(memo.$$typeof, Symbol.for('react.memo'), label);
      assert.equal(memo.type, Component, label);
      assert.equal(memo.compare, compare, label);
      assert.equal(React.memo(Component).compare, null, label);

      const lazy = React.lazy(() => ({
        then(resolve) {
          resolve({ default: Component });
        }
      }));
      assert.deepEqual(Object.keys(lazy), ['$$typeof', '_payload', '_init'], label);
      assert.deepEqual(Object.keys(lazy._payload), ['_status', '_result'], label);
      assert.equal(lazy.$$typeof, Symbol.for('react.lazy'), label);
      assert.equal(lazy._payload._status, -1, label);
      assert.equal(lazy._init(lazy._payload), Component, label);
      assert.equal(lazy._payload._status, 1, label);
      const pending = React.lazy(() => ({ then() {} }));
      assert.throws(() => pending._init(pending._payload), /\\[object Object\\]/, label);
      assert.equal(pending._payload._status, 0, label);

      const forwardRef = React.forwardRef(Component, 'ignored-extra');
      assert.deepEqual(Object.keys(forwardRef), ['$$typeof', 'render'], label);
      assert.deepEqual(Reflect.ownKeys(forwardRef), ['$$typeof', 'render'], label);
      assert.equal(forwardRef.$$typeof, Symbol.for('react.forward_ref'), label);
      assert.equal(forwardRef.render, Component, label);
      assert.equal(Object.isExtensible(forwardRef), true, label);
      assert.equal(Object.isSealed(forwardRef), false, label);
      assert.equal(Object.isFrozen(forwardRef), false, label);
      forwardRef.displayName = 'Shown';
      assert.equal(forwardRef.displayName, 'Shown', label);
      assert.deepEqual(Object.keys(forwardRef), ['$$typeof', 'render', 'displayName'], label);
      const forwardRefFromNew = new React.forwardRef(Component);
      assert.equal(forwardRefFromNew.render, Component, label);
      assert.equal(forwardRefFromNew instanceof React.forwardRef, false, label);
    }
  `;

  const result = spawnSync(process.execPath, ['-e', probeSource], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    },
    stdio: 'pipe'
  });

  assert.equal(
    result.status,
    0,
    `production jsxDEV probe failed:\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
}

async function assertPackageMetadata() {
  const packageJson = require(path.join(reactPackageRoot, 'package.json'));
  assert.deepEqual(packageJson.exports, expectedPackageExports);
}

async function assertPackageSpecifierEntrypoints() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'fast-react-smoke-'));
  const scopedPackageRoot = path.join(
    tempRoot,
    'node_modules',
    '@fast-react'
  );
  const tempReactPackageRoot = path.join(scopedPackageRoot, 'react');

  try {
    await mkdir(scopedPackageRoot, { recursive: true });
    await cp(reactPackageRoot, tempReactPackageRoot, {
      recursive: true,
      verbatimSymlinks: false
    });

    await runPackageProbe(tempRoot, [], defaultEntrypoints);
    await runPackageProbe(tempRoot, ['--conditions=react-server'], [
      ...reactServerEntrypoints
    ]);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

async function runPackageProbe(tempRoot, nodeArgs, entrypoints) {
  const probePath = path.join(tempRoot, 'probe.cjs');
  const probeSource = `
    'use strict';

    const assert = require('node:assert/strict');

    const entrypoints = ${JSON.stringify(
      entrypoints.map(({ keys, resolvedFileName, specifier }) => ({
        keys,
        resolvedFileName,
        specifier
      }))
    )};
    const blockedExtensionSubpaths = ${JSON.stringify(blockedExtensionSubpaths)};

    function assertInventoryKeys(moduleExports, expectedKeys, label) {
      assert.deepEqual(Object.keys(moduleExports), expectedKeys, label);
      assert.equal(moduleExports.__FAST_REACT_PLACEHOLDER__, true, label);
      assert.equal(moduleExports.compatibilityTarget, 'react@19.2.6', label);
      assert.equal(
        Object.keys(moduleExports).includes('__FAST_REACT_PLACEHOLDER__'),
        false,
        label
      );
      assert.equal(
        Object.keys(moduleExports).includes('compatibilityTarget'),
        false,
        label
      );
    }

    function assertDevCreateRef(moduleExports, label) {
      assert.equal(moduleExports.createRef.name, '', label);
      assert.equal(moduleExports.createRef.length, 0, label);
      const ref = moduleExports.createRef('ignored');
      assert.deepEqual(Object.keys(ref), ['current'], label);
      assert.equal(Object.isSealed(ref), true, label);
      assert.equal(Object.isExtensible(ref), false, label);
      assert.deepEqual(Object.getOwnPropertyDescriptor(ref, 'current'), {
        configurable: false,
        enumerable: true,
        value: null,
        writable: true
      });
      ref.current = 'next';
      assert.equal(ref.current, 'next', label);
      assert.equal(Reflect.set(ref, 'extra', 42), false, label);
      assert.equal(Reflect.deleteProperty(ref, 'current'), false, label);
    }

    function assertDevChildren(moduleExports, label) {
      assert.deepEqual(Object.keys(moduleExports.Children), [
        'map',
        'forEach',
        'count',
        'toArray',
        'only'
      ]);
      assert.equal(moduleExports.Children.map.name, 'mapChildren', label);
      assert.equal(moduleExports.Children.map.length, 3, label);
      assert.equal(moduleExports.Children.count([false, , 'text']), 3, label);
      const keyed = moduleExports.createElement('span', { key: 'a:b=c' });
      const unkeyed = moduleExports.createElement('span', null);
      assert.deepEqual(
        moduleExports.Children.toArray([keyed, [unkeyed], false]).map((child) =>
          moduleExports.isValidElement(child) ? child.key : child
        ),
        ['.$a=2b=0c', '.1:0'],
        label
      );
    }

    function assertDevWrappers(moduleExports, label) {
      function Component() {}
      const memo = moduleExports.memo(Component);
      assert.deepEqual(Object.keys(memo), ['$$typeof', 'type', 'compare'], label);
      assert.deepEqual(
        Reflect.ownKeys(memo),
        ['$$typeof', 'type', 'compare', 'displayName'],
        label
      );
      assert.equal(memo.$$typeof, Symbol.for('react.memo'), label);
      assert.equal(memo.type, Component, label);
      assert.equal(memo.compare, null, label);

      const lazy = moduleExports.lazy(() => ({
        then(resolve) {
          resolve({ default: Component });
        }
      }));
      assert.deepEqual(
        Object.keys(lazy),
        ['$$typeof', '_payload', '_init', '_debugInfo'],
        label
      );
      assert.deepEqual(
        Object.keys(lazy._payload),
        ['_status', '_result', '_ioInfo'],
        label
      );
      assert.equal(lazy.$$typeof, Symbol.for('react.lazy'), label);
      assert.equal(lazy._init(lazy._payload), Component, label);

      const forwardRef = moduleExports.forwardRef(Component);
      assert.deepEqual(Object.keys(forwardRef), ['$$typeof', 'render'], label);
      assert.deepEqual(
        Reflect.ownKeys(forwardRef),
        ['$$typeof', 'render', 'displayName'],
        label
      );
      assert.equal(forwardRef.$$typeof, Symbol.for('react.forward_ref'), label);
      assert.equal(forwardRef.render, Component, label);
      assert.equal(
        new moduleExports.forwardRef(Component) instanceof
          moduleExports.forwardRef,
        false,
        label
      );
    }

    function assertDevContext(moduleExports, label) {
      assert.equal(moduleExports.createContext.name, '', label);
      assert.equal(moduleExports.createContext.length, 1, label);
      const objectDefault = { label: 'dev-context' };
      const context = moduleExports.createContext(objectDefault);
      assert.deepEqual(Object.keys(context), [
        '$$typeof',
        '_currentValue',
        '_currentValue2',
        '_threadCount',
        'Provider',
        'Consumer',
        '_currentRenderer',
        '_currentRenderer2'
      ], label);
      assert.equal(context.$$typeof, Symbol.for('react.context'), label);
      assert.equal(context._currentValue, objectDefault, label);
      assert.equal(context._currentValue2, objectDefault, label);
      assert.equal(context._threadCount, 0, label);
      assert.equal(context.Provider, context, label);
      assert.equal(context.Consumer.$$typeof, Symbol.for('react.consumer'), label);
      assert.equal(context.Consumer._context, context, label);
      assert.equal(context._currentRenderer, null, label);
      assert.equal(context._currentRenderer2, null, label);
    }

    (async () => {
      for (const { keys, resolvedFileName, specifier } of entrypoints) {
        assert.equal(
          require.resolve(specifier),
          require('node:path').join(
            process.cwd(),
            'node_modules',
            '@fast-react',
            'react',
            resolvedFileName
          ),
          specifier
        );

        const cjsModule = require(specifier);
        assertInventoryKeys(cjsModule, keys, specifier);
        if (specifier === '@fast-react/react') {
          if (Object.hasOwn(cjsModule, 'createContext')) {
            assertDevContext(cjsModule, specifier);
          } else {
            assert.equal(cjsModule.createContext, undefined, specifier);
          }
          assertDevCreateRef(cjsModule, specifier);
          assertDevChildren(cjsModule, specifier);
          assertDevWrappers(cjsModule, specifier);
        }

        const esmModule = await import(specifier);
        assert.equal(esmModule.default, cjsModule, specifier);

        for (const key of keys) {
          assert.equal(esmModule[key], cjsModule[key], specifier + ' ' + key);
        }
      }

      for (const specifier of blockedExtensionSubpaths) {
        assert.throws(
          () => require(specifier),
          (error) => error?.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED',
          specifier
        );
      }
    })().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  `;

  await writeFile(probePath, probeSource);

  const result = spawnSync(process.execPath, [...nodeArgs, probePath], {
    cwd: tempRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  assert.equal(
    result.status,
    0,
    `package probe failed:\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
}

await assertPackageMetadata();
await assertDirectFileEntrypoints();
await assertPackageSpecifierEntrypoints();

console.log('Fast React entrypoints match the accepted inventory and element/context/ref/Children/memo/lazy/forwardRef smoke checks.');
