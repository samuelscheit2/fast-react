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
  '@fast-react/react/element-factory.js',
  '@fast-react/react/ref-object.js',
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

function assertReactPlaceholderBehavior(react, label) {
  assert.equal(react.version, '0.0.0-fast-react-placeholder');
  assert.equal(typeof react.createElement, 'function');
  assertReactElementBehavior(react, label);
  assertCreateRefBehavior(react, label);
  assertUnimplemented(() => react.Children.count([]), `${label}.Children.count`);
  assertUnimplemented(() => react.forwardRef(() => null), `${label}.forwardRef`);

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
  assertReactPlaceholderBehavior(reactServer, 'react react-server');

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
          assertDevCreateRef(cjsModule, specifier);
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

console.log('Fast React entrypoints match the accepted inventory and element/ref smoke checks.');
