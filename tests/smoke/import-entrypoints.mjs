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
  assertUnimplemented(() => react.createElement('div'), `${label}.createElement`);
  assertUnimplemented(() => react.Children.count([]), `${label}.Children.count`);

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
  assertUnimplemented(
    () => jsxRuntime.jsx('div', {}),
    'react/jsx-runtime.jsx'
  );

  const jsxDevRuntime = require(
    path.join(reactPackageRoot, 'jsx-dev-runtime.js')
  );
  assertUnimplemented(
    () => jsxDevRuntime.jsxDEV('div', {}),
    'react/jsx-dev-runtime.jsxDEV'
  );

  const compilerRuntime = require(
    path.join(reactPackageRoot, 'compiler-runtime.js')
  );
  assertUnimplemented(() => compilerRuntime.c(0), 'react/compiler-runtime.c');
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

console.log('Fast React placeholder entrypoints match the accepted inventory.');
