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
const reactDomPackageRoot = path.join(repoRoot, 'packages', 'react-dom');
const schedulerPackageRoot = path.join(repoRoot, 'packages', 'scheduler');

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
  '@fast-react/react/component-class.js',
  '@fast-react/react/context-object.js',
  '@fast-react/react/element-type.js',
  '@fast-react/react/element-factory.js',
  '@fast-react/react/ref-object.js',
  '@fast-react/react/wrapper-object.js',
  '@fast-react/react/placeholder-utils.js'
];

const defaultReactDomKeys = [
  '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
  'createPortal',
  'flushSync',
  'preconnect',
  'prefetchDNS',
  'preinit',
  'preinitModule',
  'preload',
  'preloadModule',
  'requestFormReset',
  'unstable_batchedUpdates',
  'useFormState',
  'useFormStatus',
  'version'
];

const reactServerReactDomKeys = [
  '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
  'preconnect',
  'prefetchDNS',
  'preinit',
  'preinitModule',
  'preload',
  'preloadModule',
  'version'
];

const reactDomClientKeys = ['createRoot', 'hydrateRoot', 'version'];
const reactDomServerNodeKeys = [
  'version',
  'renderToString',
  'renderToStaticMarkup',
  'renderToPipeableStream',
  'renderToReadableStream',
  'resumeToPipeableStream',
  'resume'
];
const reactDomServerBrowserKeys = [
  'version',
  'renderToString',
  'renderToStaticMarkup',
  'renderToReadableStream',
  'resume'
];
const reactDomServerEdgeKeys = [
  'version',
  'renderToReadableStream',
  'renderToString',
  'renderToStaticMarkup',
  'resume'
];
const reactDomServerBunKeys = [
  'version',
  'renderToReadableStream',
  'resume',
  'renderToString',
  'renderToStaticMarkup'
];
const reactDomStaticNodeKeys = [
  'version',
  'prerenderToNodeStream',
  'prerender',
  'resumeAndPrerenderToNodeStream',
  'resumeAndPrerender'
];
const reactDomStaticBrowserKeys = [
  'version',
  'prerender',
  'resumeAndPrerender'
];
const reactDomPlaceholderVersion = '0.0.0-fast-react-dom-placeholder';
const reactDomImplementedVersion = '19.2.6';
const reactDomProfilingKeys = [
  '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE',
  'createPortal',
  'createRoot',
  'flushSync',
  'hydrateRoot',
  'preconnect',
  'prefetchDNS',
  'preinit',
  'preinitModule',
  'preload',
  'preloadModule',
  'requestFormReset',
  'unstable_batchedUpdates',
  'useFormState',
  'useFormStatus',
  'version'
];
const reactDomTestUtilsKeys = ['act'];

const reactDomDefaultEntrypoints = [
  {
    fileName: 'index.js',
    expectedVersion: reactDomImplementedVersion,
    keys: defaultReactDomKeys,
    resolvedFileName: 'index.js',
    specifier: '@fast-react/react-dom',
    unsupportedExport: 'createPortal'
  },
  {
    fileName: 'client.js',
    keys: reactDomClientKeys,
    resolvedFileName: 'client.js',
    specifier: '@fast-react/react-dom/client',
    unsupportedExport: 'createRoot'
  },
  {
    fileName: 'server.node.js',
    keys: reactDomServerNodeKeys,
    resolvedFileName: 'server.node.js',
    specifier: '@fast-react/react-dom/server',
    unsupportedExport: 'renderToString'
  },
  {
    fileName: 'server.node.js',
    keys: reactDomServerNodeKeys,
    resolvedFileName: 'server.node.js',
    specifier: '@fast-react/react-dom/server.node',
    unsupportedExport: 'renderToPipeableStream'
  },
  {
    fileName: 'server.browser.js',
    keys: reactDomServerBrowserKeys,
    resolvedFileName: 'server.browser.js',
    specifier: '@fast-react/react-dom/server.browser',
    unsupportedExport: 'renderToReadableStream'
  },
  {
    fileName: 'server.edge.js',
    keys: reactDomServerEdgeKeys,
    resolvedFileName: 'server.edge.js',
    specifier: '@fast-react/react-dom/server.edge',
    unsupportedExport: 'renderToReadableStream'
  },
  {
    fileName: 'server.bun.js',
    keys: reactDomServerBunKeys,
    resolvedFileName: 'server.bun.js',
    specifier: '@fast-react/react-dom/server.bun',
    unsupportedExport: 'renderToReadableStream'
  },
  {
    fileName: 'static.node.js',
    keys: reactDomStaticNodeKeys,
    resolvedFileName: 'static.node.js',
    specifier: '@fast-react/react-dom/static',
    unsupportedExport: 'prerender'
  },
  {
    fileName: 'static.node.js',
    keys: reactDomStaticNodeKeys,
    resolvedFileName: 'static.node.js',
    specifier: '@fast-react/react-dom/static.node',
    unsupportedExport: 'prerenderToNodeStream'
  },
  {
    fileName: 'static.browser.js',
    keys: reactDomStaticBrowserKeys,
    resolvedFileName: 'static.browser.js',
    specifier: '@fast-react/react-dom/static.browser',
    unsupportedExport: 'prerender'
  },
  {
    fileName: 'static.edge.js',
    keys: reactDomStaticBrowserKeys,
    resolvedFileName: 'static.edge.js',
    specifier: '@fast-react/react-dom/static.edge',
    unsupportedExport: 'resumeAndPrerender'
  },
  {
    fileName: 'profiling.js',
    expectedVersion: reactDomImplementedVersion,
    keys: reactDomProfilingKeys,
    resolvedFileName: 'profiling.js',
    specifier: '@fast-react/react-dom/profiling',
    unsupportedExport: 'createRoot'
  },
  {
    fileName: 'test-utils.js',
    keys: reactDomTestUtilsKeys,
    resolvedFileName: 'test-utils.js',
    specifier: '@fast-react/react-dom/test-utils',
    unsupportedExport: 'act'
  }
];

const reactDomReactServerEntrypoints = [
  {
    fileName: 'react-dom.react-server.js',
    keys: reactServerReactDomKeys,
    resolvedFileName: 'react-dom.react-server.js',
    specifier: '@fast-react/react-dom',
    unsupportedExport: 'preconnect'
  },
  {
    fileName: 'test-utils.js',
    keys: reactDomTestUtilsKeys,
    resolvedFileName: 'test-utils.js',
    specifier: '@fast-react/react-dom/test-utils',
    unsupportedExport: 'act'
  }
];

const reactDomReactServerThrowingEntrypoints = [
  ['@fast-react/react-dom/client', 'client.react-server.js'],
  ['@fast-react/react-dom/server', 'server.react-server.js'],
  ['@fast-react/react-dom/server.node', 'server.react-server.js'],
  ['@fast-react/react-dom/server.browser', 'server.react-server.js'],
  ['@fast-react/react-dom/server.edge', 'server.react-server.js'],
  ['@fast-react/react-dom/server.bun', 'server.react-server.js'],
  ['@fast-react/react-dom/static', 'static.react-server.js'],
  ['@fast-react/react-dom/static.node', 'static.react-server.js'],
  ['@fast-react/react-dom/static.browser', 'static.react-server.js'],
  ['@fast-react/react-dom/static.edge', 'static.react-server.js'],
  ['@fast-react/react-dom/profiling', 'profiling.react-server.js']
];

const expectedReactDomPackageExports = {
  '.': {
    'react-server': './react-dom.react-server.js',
    default: './index.js'
  },
  './client': {
    'react-server': './client.react-server.js',
    default: './client.js'
  },
  './server': {
    'react-server': './server.react-server.js',
    workerd: './server.edge.js',
    bun: './server.bun.js',
    deno: './server.browser.js',
    worker: './server.browser.js',
    node: './server.node.js',
    'edge-light': './server.edge.js',
    browser: './server.browser.js',
    default: './server.node.js'
  },
  './server.browser': {
    'react-server': './server.react-server.js',
    default: './server.browser.js'
  },
  './server.bun': {
    'react-server': './server.react-server.js',
    default: './server.bun.js'
  },
  './server.edge': {
    'react-server': './server.react-server.js',
    default: './server.edge.js'
  },
  './server.node': {
    'react-server': './server.react-server.js',
    default: './server.node.js'
  },
  './static': {
    'react-server': './static.react-server.js',
    workerd: './static.edge.js',
    deno: './static.browser.js',
    worker: './static.browser.js',
    node: './static.node.js',
    'edge-light': './static.edge.js',
    browser: './static.browser.js',
    default: './static.node.js'
  },
  './static.browser': {
    'react-server': './static.react-server.js',
    default: './static.browser.js'
  },
  './static.edge': {
    'react-server': './static.react-server.js',
    default: './static.edge.js'
  },
  './static.node': {
    'react-server': './static.react-server.js',
    default: './static.node.js'
  },
  './profiling': {
    'react-server': './profiling.react-server.js',
    default: './profiling.js'
  },
  './test-utils': './test-utils.js',
  './package.json': './package.json'
};

const blockedReactDomExtensionSubpaths = [
  '@fast-react/react-dom/index.js',
  '@fast-react/react-dom/react-dom.react-server.js',
  '@fast-react/react-dom/client.js',
  '@fast-react/react-dom/client.react-server.js',
  '@fast-react/react-dom/server.node.js',
  '@fast-react/react-dom/server.browser.js',
  '@fast-react/react-dom/server.edge.js',
  '@fast-react/react-dom/server.bun.js',
  '@fast-react/react-dom/server.react-server.js',
  '@fast-react/react-dom/static.node.js',
  '@fast-react/react-dom/static.browser.js',
  '@fast-react/react-dom/static.edge.js',
  '@fast-react/react-dom/static.react-server.js',
  '@fast-react/react-dom/profiling.js',
  '@fast-react/react-dom/profiling.react-server.js',
  '@fast-react/react-dom/test-utils.js',
  '@fast-react/react-dom/placeholder-utils.js'
];

const schedulerImplementedRootKeys = [
  'unstable_now',
  'unstable_IdlePriority',
  'unstable_ImmediatePriority',
  'unstable_LowPriority',
  'unstable_NormalPriority',
  'unstable_Profiling',
  'unstable_UserBlockingPriority',
  'unstable_cancelCallback',
  'unstable_forceFrameRate',
  'unstable_getCurrentPriorityLevel',
  'unstable_next',
  'unstable_requestPaint',
  'unstable_runWithPriority',
  'unstable_scheduleCallback',
  'unstable_shouldYield',
  'unstable_wrapCallback'
];

const schedulerNativeKeys = [
  'unstable_IdlePriority',
  'unstable_ImmediatePriority',
  'unstable_LowPriority',
  'unstable_NormalPriority',
  'unstable_Profiling',
  'unstable_UserBlockingPriority',
  'unstable_cancelCallback',
  'unstable_forceFrameRate',
  'unstable_getCurrentPriorityLevel',
  'unstable_next',
  'unstable_now',
  'unstable_requestPaint',
  'unstable_runWithPriority',
  'unstable_scheduleCallback',
  'unstable_shouldYield',
  'unstable_wrapCallback'
];

const schedulerPlaceholderRootKeys = [
  'unstable_scheduleCallback',
  'unstable_cancelCallback',
  'unstable_shouldYield',
  'unstable_now',
  'unstable_runWithPriority',
  'unstable_next',
  'unstable_wrapCallback',
  'unstable_requestPaint',
  'unstable_forceFrameRate',
  'unstable_getCurrentPriorityLevel',
  'unstable_Profiling',
  'unstable_ImmediatePriority',
  'unstable_UserBlockingPriority',
  'unstable_NormalPriority',
  'unstable_LowPriority',
  'unstable_IdlePriority'
];

const schedulerMockKeys = [
  'log',
  'reset',
  'unstable_IdlePriority',
  'unstable_ImmediatePriority',
  'unstable_LowPriority',
  'unstable_NormalPriority',
  'unstable_Profiling',
  'unstable_UserBlockingPriority',
  'unstable_advanceTime',
  'unstable_cancelCallback',
  'unstable_clearLog',
  'unstable_flushAll',
  'unstable_flushAllWithoutAsserting',
  'unstable_flushExpired',
  'unstable_flushNumberOfYields',
  'unstable_flushUntilNextPaint',
  'unstable_forceFrameRate',
  'unstable_getCurrentPriorityLevel',
  'unstable_hasPendingWork',
  'unstable_next',
  'unstable_now',
  'unstable_requestPaint',
  'unstable_runWithPriority',
  'unstable_scheduleCallback',
  'unstable_setDisableYieldValue',
  'unstable_shouldYield',
  'unstable_wrapCallback'
];

const schedulerEntrypoints = [
  {
    implementedRoot: true,
    keys: schedulerImplementedRootKeys,
    resolvedFileName: 'index.js',
    specifier: 'scheduler'
  },
  {
    implementedMock: true,
    keys: schedulerMockKeys,
    resolvedFileName: 'unstable_mock.js',
    specifier: 'scheduler/unstable_mock'
  },
  {
    keys: schedulerPlaceholderRootKeys,
    requiresPostTaskWindow: true,
    resolvedFileName: 'unstable_post_task.js',
    specifier: 'scheduler/unstable_post_task'
  },
  {
    implementedNative: true,
    keys: schedulerNativeKeys,
    resolvedFileName: 'index.native.js',
    specifier: 'scheduler/index.native.js',
    unsupportedExport: 'unstable_runWithPriority'
  },
  {
    implementedRoot: true,
    keys: schedulerImplementedRootKeys,
    resolvedFileName: path.join('cjs', 'scheduler.development.js'),
    specifier: 'scheduler/cjs/scheduler.development.js'
  },
  {
    implementedRoot: true,
    keys: schedulerImplementedRootKeys,
    resolvedFileName: path.join('cjs', 'scheduler.production.js'),
    specifier: 'scheduler/cjs/scheduler.production.js'
  },
  {
    implementedNative: true,
    keys: schedulerNativeKeys,
    resolvedFileName: path.join('cjs', 'scheduler.native.development.js'),
    specifier: 'scheduler/cjs/scheduler.native.development.js',
    unsupportedExport: 'unstable_next'
  },
  {
    implementedNative: true,
    keys: schedulerNativeKeys,
    resolvedFileName: path.join('cjs', 'scheduler.native.production.js'),
    specifier: 'scheduler/cjs/scheduler.native.production.js',
    unsupportedExport: 'unstable_wrapCallback'
  },
  {
    implementedMock: true,
    keys: schedulerMockKeys,
    resolvedFileName: path.join(
      'cjs',
      'scheduler-unstable_mock.development.js'
    ),
    specifier: 'scheduler/cjs/scheduler-unstable_mock.development.js'
  },
  {
    implementedMock: true,
    keys: schedulerMockKeys,
    resolvedFileName: path.join(
      'cjs',
      'scheduler-unstable_mock.production.js'
    ),
    specifier: 'scheduler/cjs/scheduler-unstable_mock.production.js'
  },
  {
    keys: schedulerPlaceholderRootKeys,
    requiresPostTaskWindow: true,
    resolvedFileName: path.join(
      'cjs',
      'scheduler-unstable_post_task.development.js'
    ),
    specifier: 'scheduler/cjs/scheduler-unstable_post_task.development.js'
  },
  {
    keys: schedulerPlaceholderRootKeys,
    requiresPostTaskWindow: true,
    resolvedFileName: path.join(
      'cjs',
      'scheduler-unstable_post_task.production.js'
    ),
    specifier: 'scheduler/cjs/scheduler-unstable_post_task.production.js'
  }
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

function assertReactDomPlaceholderMetadata(moduleExports, label) {
  assert.equal(
    moduleExports.__FAST_REACT_PLACEHOLDER__,
    true,
    `${label} should expose non-enumerable placeholder metadata`
  );
  assert.equal(
    moduleExports.compatibilityTarget,
    'react-dom@19.2.6',
    `${label} should expose the React DOM inventory target`
  );
  assert.equal(
    Object.keys(moduleExports).includes('__FAST_REACT_PLACEHOLDER__'),
    false,
    `${label} placeholder marker must not be enumerable`
  );
  assert.equal(
    Object.keys(moduleExports).includes('compatibilityTarget'),
    false,
    `${label} compatibility metadata must not be enumerable`
  );
}

function assertReactDomInventoryKeys(moduleExports, expectedKeys, label) {
  assert.deepEqual(Object.keys(moduleExports), expectedKeys, `${label} keys`);
  assertReactDomPlaceholderMetadata(moduleExports, label);
}

function assertReactDomUnimplemented(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, 'FastReactDomUnimplementedError', label);
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', label);
      assert.equal(error.compatibilityTarget, 'react-dom@19.2.6', label);
      assert.match(
        error.message,
        /no React DOM behavior implementation yet/,
        label
      );
      return true;
    },
    label
  );
}

function assertReactServerUnsupported(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(
        error.name,
        'FastReactDomReactServerUnsupportedError',
        label
      );
      assert.equal(
        error.code,
        'FAST_REACT_REACT_SERVER_UNSUPPORTED',
        label
      );
      assert.equal(error.compatibilityTarget, 'react-dom@19.2.6', label);
      assert.match(
        error.message,
        /is not supported in React Server Components\./,
        label
      );
      return true;
    },
    label
  );
}

function assertSchedulerPlaceholderMetadata(moduleExports, label) {
  assert.equal(
    moduleExports.__FAST_REACT_PLACEHOLDER__,
    true,
    `${label} should expose non-enumerable placeholder metadata`
  );
  assert.equal(
    moduleExports.compatibilityTarget,
    'scheduler@0.27.0',
    `${label} should expose the scheduler inventory target`
  );
  assert.equal(
    Object.keys(moduleExports).includes('__FAST_REACT_PLACEHOLDER__'),
    false,
    `${label} placeholder marker must not be enumerable`
  );
  assert.equal(
    Object.keys(moduleExports).includes('compatibilityTarget'),
    false,
    `${label} compatibility metadata must not be enumerable`
  );
}

function assertSchedulerInventoryKeys(moduleExports, expectedKeys, label) {
  assert.deepEqual(Object.keys(moduleExports), expectedKeys, `${label} keys`);
  assertSchedulerPlaceholderMetadata(moduleExports, label);
}

function assertSchedulerImplementedRootKeys(moduleExports, expectedKeys, label) {
  assert.deepEqual(Object.keys(moduleExports), expectedKeys, `${label} keys`);
  assert.equal(
    Object.hasOwn(moduleExports, '__FAST_REACT_PLACEHOLDER__'),
    false,
    `${label} should not expose placeholder metadata`
  );
  assert.equal(
    Object.hasOwn(moduleExports, 'compatibilityTarget'),
    false,
    `${label} should not expose placeholder compatibility metadata`
  );
}

function assertSchedulerImplementedMockKeys(moduleExports, expectedKeys, label) {
  assert.deepEqual(Object.keys(moduleExports), expectedKeys, `${label} keys`);
  assert.equal(
    Object.hasOwn(moduleExports, '__FAST_REACT_PLACEHOLDER__'),
    false,
    `${label} should not expose placeholder metadata`
  );
  assert.equal(
    Object.hasOwn(moduleExports, 'compatibilityTarget'),
    false,
    `${label} should not expose placeholder compatibility metadata`
  );
}

function assertSchedulerImplementedNativeKeys(moduleExports, expectedKeys, label) {
  assert.deepEqual(Object.keys(moduleExports), expectedKeys, `${label} keys`);
  assert.equal(
    Object.hasOwn(moduleExports, '__FAST_REACT_PLACEHOLDER__'),
    false,
    `${label} should not expose placeholder metadata`
  );
  assert.equal(
    Object.hasOwn(moduleExports, 'compatibilityTarget'),
    false,
    `${label} should not expose placeholder compatibility metadata`
  );
}

function assertSchedulerImplementedRootBehavior(moduleExports, label) {
  assert.equal(
    typeof moduleExports.unstable_now,
    'function',
    `${label}.unstable_now`
  );
  assert.equal(
    moduleExports.unstable_getCurrentPriorityLevel(),
    moduleExports.unstable_NormalPriority,
    `${label} default priority`
  );

  const userBlockingPriority = moduleExports.unstable_runWithPriority(
    moduleExports.unstable_UserBlockingPriority,
    () => moduleExports.unstable_getCurrentPriorityLevel()
  );
  assert.equal(
    userBlockingPriority,
    moduleExports.unstable_UserBlockingPriority,
    `${label}.unstable_runWithPriority`
  );
  assert.equal(
    moduleExports.unstable_getCurrentPriorityLevel(),
    moduleExports.unstable_NormalPriority,
    `${label} priority restoration`
  );

  const nextFromImmediate = moduleExports.unstable_runWithPriority(
    moduleExports.unstable_ImmediatePriority,
    () =>
      moduleExports.unstable_next(() =>
        moduleExports.unstable_getCurrentPriorityLevel()
      )
  );
  assert.equal(
    nextFromImmediate,
    moduleExports.unstable_NormalPriority,
    `${label}.unstable_next`
  );

  const wrapped = moduleExports.unstable_runWithPriority(
    moduleExports.unstable_UserBlockingPriority,
    () =>
      moduleExports.unstable_wrapCallback(function schedulerSmokeWrapped(
        first,
        second
      ) {
        return {
          args: [first, second],
          priority: moduleExports.unstable_getCurrentPriorityLevel(),
          receiver: this.receiver
        };
      })
  );
  const wrappedResult = moduleExports.unstable_runWithPriority(
    moduleExports.unstable_LowPriority,
    () => wrapped.call({ receiver: 'root-smoke' }, 'a', 'b')
  );
  assert.deepEqual(
    wrappedResult,
    {
      args: ['a', 'b'],
      priority: moduleExports.unstable_UserBlockingPriority,
      receiver: 'root-smoke'
    },
    `${label}.unstable_wrapCallback`
  );

  const beforeNow = moduleExports.unstable_now();
  const task = moduleExports.unstable_scheduleCallback(
    moduleExports.unstable_NormalPriority,
    () => {}
  );
  assert.deepEqual(
    Object.keys(task),
    [
      'id',
      'callback',
      'priorityLevel',
      'startTime',
      'expirationTime',
      'sortIndex'
    ],
    `${label} task shape`
  );
  assert.equal(task.priorityLevel, moduleExports.unstable_NormalPriority);
  assert.equal(typeof task.callback, 'function', `${label} task callback`);
  assert.equal(task.sortIndex, task.expirationTime, `${label} ready sortIndex`);
  assert.equal(task.startTime >= beforeNow, true, `${label} startTime`);
  moduleExports.unstable_cancelCallback(task);
  assert.equal(task.callback, null, `${label}.unstable_cancelCallback`);

  const delayedTask = moduleExports.unstable_scheduleCallback(
    moduleExports.unstable_NormalPriority,
    () => {},
    { delay: 40 }
  );
  assert.equal(
    delayedTask.sortIndex,
    delayedTask.startTime,
    `${label} delayed sortIndex`
  );
  moduleExports.unstable_cancelCallback(delayedTask);
}

function assertSchedulerNativeThrower(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, 'Error', label);
      assert.equal(error.message, 'Not implemented.', label);
      assert.equal(Object.hasOwn(error, 'code'), false, label);
      assert.equal(Object.hasOwn(error, 'compatibilityTarget'), false, label);
      return true;
    },
    label
  );
}

function assertSchedulerImplementedNativeBehavior(moduleExports, label) {
  assert.equal(
    typeof moduleExports.unstable_now,
    'function',
    `${label}.unstable_now`
  );
  assert.equal(
    moduleExports.unstable_getCurrentPriorityLevel(),
    moduleExports.unstable_NormalPriority,
    `${label} default priority`
  );
  assert.equal(
    moduleExports.unstable_requestPaint(),
    undefined,
    `${label}.unstable_requestPaint`
  );
  assert.equal(
    moduleExports.unstable_shouldYield(),
    true,
    `${label}.unstable_shouldYield after requestPaint`
  );

  const beforeNow = moduleExports.unstable_now();
  const task = moduleExports.unstable_scheduleCallback(
    moduleExports.unstable_NormalPriority,
    () => {}
  );
  assert.deepEqual(
    Object.keys(task),
    [
      'id',
      'callback',
      'priorityLevel',
      'startTime',
      'expirationTime',
      'sortIndex'
    ],
    `${label} task shape`
  );
  assert.equal(task.priorityLevel, moduleExports.unstable_NormalPriority);
  assert.equal(typeof task.callback, 'function', `${label} task callback`);
  assert.equal(task.sortIndex, task.expirationTime, `${label} ready sortIndex`);
  assert.equal(task.startTime >= beforeNow, true, `${label} startTime`);
  moduleExports.unstable_cancelCallback(task);
  assert.equal(task.callback, null, `${label}.unstable_cancelCallback`);

  const delayedTask = moduleExports.unstable_scheduleCallback(
    moduleExports.unstable_NormalPriority,
    () => {},
    { delay: 40 }
  );
  assert.equal(
    delayedTask.sortIndex,
    delayedTask.startTime,
    `${label} delayed sortIndex`
  );
  moduleExports.unstable_cancelCallback(delayedTask);

  for (const unsupportedExport of [
    'unstable_runWithPriority',
    'unstable_next',
    'unstable_wrapCallback',
    'unstable_forceFrameRate'
  ]) {
    assertSchedulerNativeThrower(
      () => moduleExports[unsupportedExport](),
      `${label}.${unsupportedExport}`
    );
  }
}

function assertSchedulerImplementedMockBehavior(moduleExports, label) {
  assert.equal(moduleExports.unstable_scheduleCallback.name, '', label);
  assert.equal(moduleExports.unstable_scheduleCallback.length, 3, label);
  assert.equal(moduleExports.unstable_shouldYield.name, 'shouldYieldToHost', label);
  assert.equal(moduleExports.unstable_forceFrameRate.length, 0, label);

  moduleExports.reset();
  assert.equal(moduleExports.unstable_now(), 0, `${label}.unstable_now`);
  assert.equal(
    moduleExports.unstable_getCurrentPriorityLevel(),
    moduleExports.unstable_NormalPriority,
    `${label} default priority`
  );
  moduleExports.unstable_advanceTime(5);
  assert.equal(moduleExports.unstable_now(), 5, `${label}.unstable_advanceTime`);
  moduleExports.log('manual');
  assert.deepEqual(moduleExports.unstable_clearLog(), ['manual'], `${label}.log`);

  moduleExports.unstable_setDisableYieldValue(true);
  moduleExports.unstable_advanceTime(10);
  moduleExports.log('disabled');
  assert.equal(moduleExports.unstable_now(), 5, `${label} disabled time`);
  assert.deepEqual(moduleExports.unstable_clearLog(), [], `${label} disabled log`);
  moduleExports.unstable_setDisableYieldValue(false);

  const cancelledTask = moduleExports.unstable_scheduleCallback(
    moduleExports.unstable_NormalPriority,
    () => {
      throw new Error(`${label} cancelled callback should not run`);
    }
  );
  assert.deepEqual(
    Object.keys(cancelledTask),
    [
      'id',
      'callback',
      'priorityLevel',
      'startTime',
      'expirationTime',
      'sortIndex'
    ],
    `${label} task shape`
  );
  assert.equal(cancelledTask.sortIndex, cancelledTask.expirationTime, label);
  moduleExports.unstable_cancelCallback(cancelledTask);
  assert.equal(cancelledTask.callback, null, `${label}.unstable_cancelCallback`);
  assert.equal(
    moduleExports.unstable_flushAllWithoutAsserting(),
    true,
    `${label} flush cancelled task`
  );
  assert.equal(moduleExports.unstable_hasPendingWork(), false, label);

  const events = [];
  moduleExports.unstable_scheduleCallback(
    moduleExports.unstable_NormalPriority,
    (didTimeout) => {
      events.push(['normal', didTimeout]);
      moduleExports.log('normal');
    }
  );
  moduleExports.unstable_scheduleCallback(
    moduleExports.unstable_ImmediatePriority,
    (didTimeout) => {
      events.push(['immediate', didTimeout]);
      moduleExports.log('immediate');
    }
  );
  assert.equal(moduleExports.unstable_hasPendingWork(), true, label);
  assert.equal(moduleExports.unstable_flushAllWithoutAsserting(), true, label);
  assert.deepEqual(events, [
    ['immediate', true],
    ['normal', false]
  ]);
  assert.deepEqual(moduleExports.unstable_clearLog(), ['immediate', 'normal']);
  assert.equal(moduleExports.unstable_hasPendingWork(), false, label);
}

function assertSchedulerUnimplemented(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, 'FastReactSchedulerUnimplementedError', label);
      assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', label);
      assert.equal(error.compatibilityTarget, 'scheduler@0.27.0', label);
      assert.match(
        error.message,
        /no .*scheduler .*implementation yet/,
        label
      );
      return true;
    },
    label
  );
}

function assertSchedulerPostTaskPlainNodeUnsupported(callback, label) {
  assert.throws(
    callback,
    (error) => {
      assert.equal(error.name, 'ReferenceError', label);
      assert.equal(error.message, 'window is not defined', label);
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
      ],
      [
        'memo: The first argument must be a component. Instead received: %s',
        'number'
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

function assertComponentClassBehavior(react, label, options = {}) {
  const development = options.development !== false;

  for (const exportName of ['Component', 'PureComponent']) {
    const descriptor = Object.getOwnPropertyDescriptor(react, exportName);
    assert.equal(descriptor.enumerable, true, `${label}.${exportName}`);
    assert.equal(descriptor.configurable, true, `${label}.${exportName}`);
    assert.equal(descriptor.writable, true, `${label}.${exportName}`);
    assert.equal(typeof react[exportName], 'function', `${label}.${exportName}`);
    assert.equal(react[exportName].name, exportName, `${label}.${exportName}`);
    assert.equal(react[exportName].length, 3, `${label}.${exportName}`);
    assert.deepEqual(Reflect.ownKeys(react[exportName]), [
      'length',
      'name',
      'prototype'
    ]);
  }

  assert.deepEqual(
    Reflect.ownKeys(react.Component.prototype),
    development
      ? [
          'constructor',
          'isReactComponent',
          'setState',
          'forceUpdate',
          'isMounted',
          'replaceState'
        ]
      : ['constructor', 'isReactComponent', 'setState', 'forceUpdate'],
    `${label}.Component.prototype ownKeys`
  );
  assert.deepEqual(Object.keys(react.Component.prototype), [
    'isReactComponent',
    'setState',
    'forceUpdate'
  ]);
  assert.deepEqual(Object.keys(react.PureComponent.prototype), [
    'constructor',
    'isReactComponent',
    'setState',
    'forceUpdate',
    'isPureReactComponent'
  ]);
  assert.equal(
    Object.getPrototypeOf(react.PureComponent.prototype),
    react.Component.prototype,
    `${label}.PureComponent prototype chain`
  );
  assert.equal(
    react.PureComponent.prototype.setState,
    react.Component.prototype.setState,
    `${label}.setState identity`
  );
  assert.equal(
    react.PureComponent.prototype.forceUpdate,
    react.Component.prototype.forceUpdate,
    `${label}.forceUpdate identity`
  );
  assert.equal(
    react.PureComponent.prototype.isReactComponent,
    react.Component.prototype.isReactComponent,
    `${label}.isReactComponent identity`
  );
  assert.equal(react.PureComponent.prototype.isPureReactComponent, true, label);
  assert.equal(react.Component.prototype.setState.name, '', label);
  assert.equal(react.Component.prototype.setState.length, 2, label);
  assert.equal(react.Component.prototype.forceUpdate.name, '', label);
  assert.equal(react.Component.prototype.forceUpdate.length, 1, label);

  const props = { label: 'props' };
  const context = { label: 'context' };
  const updaterCalls = [];
  const updater = {
    enqueueSetState() {
      updaterCalls.push(['setState', ...arguments]);
      return 'ignored-return';
    },
    enqueueForceUpdate() {
      updaterCalls.push(['forceUpdate', ...arguments]);
      return 'ignored-return';
    }
  };
  const component = new react.Component(props, context, updater, 'ignored');
  const pureComponent = new react.PureComponent(
    props,
    context,
    updater,
    'ignored'
  );

  assert.deepEqual(Object.keys(component), [
    'props',
    'context',
    'refs',
    'updater'
  ]);
  assert.deepEqual(Object.keys(pureComponent), [
    'props',
    'context',
    'refs',
    'updater'
  ]);
  assert.equal(component.props, props, `${label}.props identity`);
  assert.equal(component.context, context, `${label}.context identity`);
  assert.equal(component.updater, updater, `${label}.updater identity`);
  assert.equal(pureComponent.props, props, `${label}.pure props identity`);
  assert.equal(pureComponent.context, context, `${label}.pure context identity`);
  assert.equal(pureComponent.updater, updater, `${label}.pure updater identity`);
  assert.equal(component instanceof react.Component, true, label);
  assert.equal(pureComponent instanceof react.PureComponent, true, label);
  assert.equal(pureComponent instanceof react.Component, true, label);
  assert.equal(component.refs, pureComponent.refs, `${label}.refs shared`);

  const defaultComponent = new react.Component('default-props', 'default-ctx');
  const secondDefault = new react.Component('second-props', 'second-ctx');
  const defaultPure = new react.PureComponent('pure-props', 'pure-ctx');
  assert.equal(defaultComponent.refs, secondDefault.refs, label);
  assert.equal(defaultComponent.refs, defaultPure.refs, label);
  assert.equal(defaultComponent.updater, secondDefault.updater, label);
  assert.equal(defaultComponent.updater, defaultPure.updater, label);
  assert.deepEqual(Object.keys(defaultComponent.refs), [], label);
  assert.equal(Object.isFrozen(defaultComponent.refs), development, label);
  assert.equal(Object.isSealed(defaultComponent.refs), development, label);
  assert.equal(Object.isExtensible(defaultComponent.refs), !development, label);
  assert.deepEqual(Object.keys(defaultComponent.updater), [
    'isMounted',
    'enqueueForceUpdate',
    'enqueueReplaceState',
    'enqueueSetState'
  ]);
  assert.equal(defaultComponent.updater.isMounted(), false, label);
  assert.equal(
    defaultComponent.updater.enqueueSetState.length,
    development ? 1 : 0,
    label
  );
  assert.equal(
    defaultComponent.updater.enqueueForceUpdate.length,
    development ? 1 : 0,
    label
  );

  const callback = function callback() {
    throw new Error('callback should not be called by Component directly');
  };
  assert.equal(component.setState({ next: true }, callback), undefined, label);
  assert.equal(component.forceUpdate(callback), undefined, label);
  assert.equal(pureComponent.setState(null, 'string-callback'), undefined, label);
  assert.equal(updaterCalls.length, 3, `${label}.custom updater calls`);
  assert.equal(updaterCalls[0][0], 'setState', label);
  assert.equal(updaterCalls[0][1], component, label);
  assert.deepEqual(updaterCalls[0][4], 'setState', label);
  assert.equal(updaterCalls[1][0], 'forceUpdate', label);
  assert.equal(updaterCalls[1][1], component, label);
  assert.equal(updaterCalls[1][3], 'forceUpdate', label);
  assert.equal(updaterCalls[2][0], 'setState', label);
  assert.equal(updaterCalls[2][1], pureComponent, label);

  assert.throws(
    () => defaultComponent.setState('bad'),
    /takes an object of state variables/,
    `${label}.invalid setState`
  );

  const callTarget = { existing: true };
  assert.equal(
    react.Component.call(callTarget, 'call-props', 'call-context'),
    undefined,
    label
  );
  assert.equal(callTarget.props, 'call-props', label);
  assert.equal(callTarget.context, 'call-context', label);
  assert.equal(Object.getPrototypeOf(callTarget), Object.prototype, label);
  assert.equal(callTarget instanceof react.Component, false, label);
  assert.throws(() => {
    const Component = react.Component;
    Component('var-props', 'var-context');
  }, /Cannot set properties of undefined/);
  assert.throws(
    () => react.Component.call(null, 'null-props', 'null-context'),
    /Cannot set properties of null/
  );
  const boundTarget = { existing: true };
  const BoundComponent = react.Component.bind(boundTarget);
  assert.equal(BoundComponent.name, 'bound Component', label);
  assert.equal(BoundComponent('bound-props', 'bound-context'), undefined, label);
  assert.equal(boundTarget.props, 'bound-props', label);
  const boundInstance = new BoundComponent('new-props', 'new-context');
  assert.equal(boundInstance instanceof react.Component, true, label);
  assert.equal(boundInstance instanceof BoundComponent, true, label);
  assert.equal(boundInstance.props, 'new-props', label);

  if (development) {
    const errors = [];
    const warns = [];
    const originalError = console.error;
    const originalWarn = console.warn;
    console.error = (...args) => {
      errors.push(args);
    };
    console.warn = (...args) => {
      warns.push(args);
    };
    try {
      const noopComponent = new react.Component('noop-props', 'noop-context');
      const noopPure = new react.PureComponent('pure-props', 'pure-context');
      assert.equal(noopComponent.setState({ value: 1 }), undefined, label);
      assert.equal(noopComponent.setState({ value: 2 }), undefined, label);
      assert.equal(noopComponent.forceUpdate(), undefined, label);
      assert.equal(noopComponent.forceUpdate(), undefined, label);
      assert.equal(noopPure.setState({ pure: true }), undefined, label);
      assert.equal(noopPure.forceUpdate(), undefined, label);
      assert.equal(noopComponent.isMounted, undefined, label);
      assert.equal(noopComponent.replaceState, undefined, label);
    } finally {
      console.error = originalError;
      console.warn = originalWarn;
    }
    assert.deepEqual(
      errors.map((args) => args.slice(1)),
      [
        ['setState', 'Component'],
        ['forceUpdate', 'Component'],
        ['setState', 'PureComponent'],
        ['forceUpdate', 'PureComponent']
      ],
      `${label}.noop warnings`
    );
    assert.deepEqual(
      warns.map((args) => args[1]),
      ['isMounted', 'replaceState'],
      `${label}.deprecated warnings`
    );
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

async function assertReactDomFileEntrypoint(entrypoint, labelPrefix) {
  const absolutePath = path.join(reactDomPackageRoot, entrypoint.fileName);
  const cjsModule = require(absolutePath);
  assertReactDomInventoryKeys(cjsModule, entrypoint.keys, `${labelPrefix} CJS`);
  if (Object.hasOwn(cjsModule, 'version')) {
    assert.equal(
      cjsModule.version,
      entrypoint.expectedVersion ?? reactDomPlaceholderVersion
    );
  }
  assertReactDomUnimplemented(
    () => cjsModule[entrypoint.unsupportedExport](),
    `${labelPrefix}.${entrypoint.unsupportedExport}`
  );

  if (entrypoint.specifier === '@fast-react/react-dom/server.bun') {
    assert.equal(cjsModule.resume, undefined, `${labelPrefix}.resume`);
  }

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

async function assertSchedulerFileEntrypoint(entrypoint, labelPrefix) {
  const absolutePath = path.join(schedulerPackageRoot, entrypoint.resolvedFileName);
  if (entrypoint.requiresPostTaskWindow) {
    assertSchedulerPostTaskPlainNodeUnsupported(
      () => require(absolutePath),
      `${labelPrefix} CJS`
    );
    await assert.rejects(
      import(pathToFileURL(absolutePath).href),
      (error) =>
        error?.name === 'ReferenceError' &&
        error?.message === 'window is not defined',
      `${labelPrefix} ESM`
    );
    return;
  }

  const cjsModule = require(absolutePath);
  if (entrypoint.implementedRoot) {
    assertSchedulerImplementedRootKeys(
      cjsModule,
      entrypoint.keys,
      `${labelPrefix} CJS`
    );
  } else if (entrypoint.implementedMock) {
    assertSchedulerImplementedMockKeys(
      cjsModule,
      entrypoint.keys,
      `${labelPrefix} CJS`
    );
  } else if (entrypoint.implementedNative) {
    assertSchedulerImplementedNativeKeys(
      cjsModule,
      entrypoint.keys,
      `${labelPrefix} CJS`
    );
  } else {
    assertSchedulerInventoryKeys(cjsModule, entrypoint.keys, `${labelPrefix} CJS`);
  }
  assert.equal(cjsModule.unstable_ImmediatePriority, 1, labelPrefix);
  assert.equal(cjsModule.unstable_UserBlockingPriority, 2, labelPrefix);
  assert.equal(cjsModule.unstable_NormalPriority, 3, labelPrefix);
  assert.equal(cjsModule.unstable_LowPriority, 4, labelPrefix);
  assert.equal(cjsModule.unstable_IdlePriority, 5, labelPrefix);
  assert.equal(cjsModule.unstable_Profiling, null, labelPrefix);
  if (entrypoint.implementedRoot) {
    assertSchedulerImplementedRootBehavior(cjsModule, labelPrefix);
  } else if (entrypoint.implementedMock) {
    assertSchedulerImplementedMockBehavior(cjsModule, labelPrefix);
  } else if (entrypoint.implementedNative) {
    assertSchedulerImplementedNativeBehavior(cjsModule, labelPrefix);
  } else {
    assertSchedulerUnimplemented(
      () => cjsModule[entrypoint.unsupportedExport](),
      `${labelPrefix}.${entrypoint.unsupportedExport}`
    );
  }

  const esmModule = await import(pathToFileURL(absolutePath).href);
  assert.equal(esmModule.default, cjsModule, `${labelPrefix} ESM default`);
}

async function assertReactDomDirectFileEntrypoints() {
  for (const entrypoint of reactDomDefaultEntrypoints) {
    await assertReactDomFileEntrypoint(
      entrypoint,
      `react-dom ${entrypoint.fileName}`
    );
  }

  for (const entrypoint of reactDomReactServerEntrypoints) {
    await assertReactDomFileEntrypoint(
      entrypoint,
      `react-dom react-server ${entrypoint.fileName}`
    );
  }

  for (const [specifier, fileName] of reactDomReactServerThrowingEntrypoints) {
    assertReactServerUnsupported(
      () => require(path.join(reactDomPackageRoot, fileName)),
      `${specifier} direct file`
    );
  }
}

async function assertSchedulerDirectFileEntrypoints() {
  for (const entrypoint of schedulerEntrypoints) {
    await assertSchedulerFileEntrypoint(
      entrypoint,
      `scheduler ${entrypoint.resolvedFileName}`
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

  if (Object.hasOwn(react, 'Component')) {
    assertComponentClassBehavior(react, label, options);
  } else {
    assert.equal(react.Component, undefined, `${label}.Component`);
    assert.equal(react.PureComponent, undefined, `${label}.PureComponent`);
  }

  if (Object.hasOwn(react, 'useRef')) {
    assertUnimplemented(() => react.useRef(null), `${label}.useRef`);
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
  await assertReactDomDirectFileEntrypoints();
  await assertSchedulerDirectFileEntrypoints();
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

      if (label === 'react') {
        assert.equal(React.Component.name, 'Component', label);
        assert.equal(React.Component.length, 3, label);
        assert.equal(React.PureComponent.name, 'PureComponent', label);
        assert.equal(React.PureComponent.length, 3, label);
        assert.deepEqual(Reflect.ownKeys(React.Component.prototype), [
          'constructor',
          'isReactComponent',
          'setState',
          'forceUpdate'
        ], label);
        assert.deepEqual(Object.keys(React.PureComponent.prototype), [
          'constructor',
          'isReactComponent',
          'setState',
          'forceUpdate',
          'isPureReactComponent'
        ], label);
        assert.equal(
          Object.getPrototypeOf(React.PureComponent.prototype),
          React.Component.prototype,
          label
        );
        const props = { label: 'prod-props' };
        const context = { label: 'prod-context' };
        const calls = [];
        const updater = {
          enqueueSetState() {
            calls.push(['setState', ...arguments]);
          },
          enqueueForceUpdate() {
            calls.push(['forceUpdate', ...arguments]);
          }
        };
        const component = new React.Component(props, context, updater, 'ignored');
        const pure = new React.PureComponent(props, context, updater, 'ignored');
        assert.deepEqual(Object.keys(component), [
          'props',
          'context',
          'refs',
          'updater'
        ], label);
        assert.equal(component.props, props, label);
        assert.equal(component.context, context, label);
        assert.equal(component.updater, updater, label);
        assert.equal(component.refs, pure.refs, label);
        assert.equal(pure instanceof React.PureComponent, true, label);
        assert.equal(pure instanceof React.Component, true, label);
        const defaultComponent = new React.Component('props', 'context');
        const secondDefault = new React.Component('props2', 'context2');
        assert.equal(defaultComponent.refs, secondDefault.refs, label);
        assert.equal(Object.isFrozen(defaultComponent.refs), false, label);
        assert.equal(Object.isSealed(defaultComponent.refs), false, label);
        assert.equal(Object.isExtensible(defaultComponent.refs), true, label);
        assert.deepEqual(Object.keys(defaultComponent.updater), [
          'isMounted',
          'enqueueForceUpdate',
          'enqueueReplaceState',
          'enqueueSetState'
        ], label);
        assert.equal(defaultComponent.updater.enqueueSetState.length, 0, label);
        assert.equal(defaultComponent.updater.enqueueForceUpdate.length, 0, label);
        assert.equal(defaultComponent.setState({ value: 1 }), undefined, label);
        assert.equal(defaultComponent.forceUpdate(), undefined, label);
        assert.equal(component.setState({ next: true }, 'callback'), undefined, label);
        assert.equal(component.forceUpdate('callback'), undefined, label);
        assert.equal(calls.length, 2, label);
        assert.equal(calls[0][0], 'setState', label);
        assert.equal(calls[0][1], component, label);
        assert.equal(calls[0].at(-1), 'setState', label);
        assert.equal(calls[1][0], 'forceUpdate', label);
        assert.equal(calls[1][1], component, label);
        assert.equal(calls[1].at(-1), 'forceUpdate', label);
        assert.throws(
          () => defaultComponent.setState('bad'),
          /takes an object of state variables/,
          label
        );
        const callTarget = {};
        assert.equal(
          React.Component.call(callTarget, 'call-props', 'call-context'),
          undefined,
          label
        );
        assert.equal(callTarget.props, 'call-props', label);
        const BoundComponent = React.Component.bind({});
        const boundInstance = new BoundComponent('bound-props', 'bound-context');
        assert.equal(boundInstance instanceof React.Component, true, label);
        assert.equal(boundInstance instanceof BoundComponent, true, label);
        assert.equal(defaultComponent.isMounted, undefined, label);
        assert.equal(defaultComponent.replaceState, undefined, label);
      } else {
        assert.equal(Object.hasOwn(React, 'Component'), false, label);
        assert.equal(Object.hasOwn(React, 'PureComponent'), false, label);
        assert.equal(React.Component, undefined, label);
        assert.equal(React.PureComponent, undefined, label);
      }
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

  const reactDomPackageJson = require(
    path.join(reactDomPackageRoot, 'package.json')
  );
  assert.deepEqual(reactDomPackageJson.exports, expectedReactDomPackageExports);
  assert.deepEqual(reactDomPackageJson.dependencies, {
    scheduler: '^0.27.0'
  });
  assert.deepEqual(reactDomPackageJson.peerDependencies, {
    '@fast-react/react': '0.0.0'
  });

  const schedulerPackageJson = require(
    path.join(schedulerPackageRoot, 'package.json')
  );
  assert.equal(schedulerPackageJson.name, 'scheduler');
  assert.equal(schedulerPackageJson.version, '0.27.0');
  assert.equal(Object.hasOwn(schedulerPackageJson, 'exports'), false);
  assert.equal(Object.hasOwn(schedulerPackageJson, 'main'), false);
}

async function assertPackageSpecifierEntrypoints() {
  const tempRoot = await mkdtemp(path.join(tmpdir(), 'fast-react-smoke-'));
  const scopedPackageRoot = path.join(
    tempRoot,
    'node_modules',
    '@fast-react'
  );
  const tempReactPackageRoot = path.join(scopedPackageRoot, 'react');
  const tempReactDomPackageRoot = path.join(scopedPackageRoot, 'react-dom');
  const tempSchedulerPackageRoot = path.join(tempRoot, 'node_modules', 'scheduler');

  try {
    await mkdir(scopedPackageRoot, { recursive: true });
    await cp(reactPackageRoot, tempReactPackageRoot, {
      recursive: true,
      verbatimSymlinks: false
    });
    await cp(reactDomPackageRoot, tempReactDomPackageRoot, {
      recursive: true,
      verbatimSymlinks: false
    });
    await cp(schedulerPackageRoot, tempSchedulerPackageRoot, {
      recursive: true,
      verbatimSymlinks: false
    });

    await runPackageProbe(tempRoot, [], defaultEntrypoints);
    await runPackageProbe(tempRoot, ['--conditions=react-server'], [
      ...reactServerEntrypoints
    ]);
    await runReactDomPackageProbe(
      tempRoot,
      [],
      reactDomDefaultEntrypoints,
      []
    );
    await runReactDomPackageProbe(
      tempRoot,
      ['--conditions=react-server'],
      reactDomReactServerEntrypoints,
      reactDomReactServerThrowingEntrypoints
    );
    await runReactDomConditionProbe(tempRoot, ['--conditions=workerd'], [
      ['@fast-react/react-dom/server', 'server.edge.js'],
      ['@fast-react/react-dom/static', 'static.edge.js']
    ]);
    await runReactDomConditionProbe(tempRoot, ['--conditions=bun'], [
      ['@fast-react/react-dom/server', 'server.bun.js'],
      ['@fast-react/react-dom/static', 'static.node.js']
    ]);
    await runReactDomConditionProbe(tempRoot, ['--conditions=deno'], [
      ['@fast-react/react-dom/server', 'server.browser.js'],
      ['@fast-react/react-dom/static', 'static.browser.js']
    ]);
    await runReactDomConditionProbe(tempRoot, ['--conditions=browser'], [
      ['@fast-react/react-dom/server', 'server.node.js'],
      ['@fast-react/react-dom/static', 'static.node.js']
    ]);
    await runSchedulerPackageProbe(tempRoot);
  } finally {
    await rm(tempRoot, { force: true, recursive: true });
  }
}

async function runReactDomPackageProbe(
  tempRoot,
  nodeArgs,
  entrypoints,
  throwingEntrypoints
) {
  const probePath = path.join(tempRoot, 'react-dom-probe.cjs');
  const probeSource = `
    'use strict';

    const assert = require('node:assert/strict');
    const path = require('node:path');

    const entrypoints = ${JSON.stringify(
      entrypoints.map(
        ({
          expectedVersion,
          keys,
          resolvedFileName,
          specifier,
          unsupportedExport
        }) => ({
          expectedVersion,
          keys,
          resolvedFileName,
          specifier,
          unsupportedExport
        })
      )
    )};
    const throwingEntrypoints = ${JSON.stringify(throwingEntrypoints)};
    const blockedExtensionSubpaths = ${JSON.stringify(
      blockedReactDomExtensionSubpaths
    )};
    const placeholderVersion = ${JSON.stringify(reactDomPlaceholderVersion)};

    function assertInventoryKeys(moduleExports, expectedKeys, label) {
      assert.deepEqual(Object.keys(moduleExports), expectedKeys, label);
      assert.equal(moduleExports.__FAST_REACT_PLACEHOLDER__, true, label);
      assert.equal(moduleExports.compatibilityTarget, 'react-dom@19.2.6', label);
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

    function assertUnimplemented(callback, label) {
      assert.throws(
        callback,
        (error) => {
          assert.equal(error.name, 'FastReactDomUnimplementedError', label);
          assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', label);
          assert.equal(error.compatibilityTarget, 'react-dom@19.2.6', label);
          assert.match(error.message, /no React DOM behavior implementation yet/, label);
          return true;
        },
        label
      );
    }

    function assertReactServerUnsupported(callback, label) {
      assert.throws(
        callback,
        (error) => {
          assert.equal(error.name, 'FastReactDomReactServerUnsupportedError', label);
          assert.equal(error.code, 'FAST_REACT_REACT_SERVER_UNSUPPORTED', label);
          assert.equal(error.compatibilityTarget, 'react-dom@19.2.6', label);
          assert.match(error.message, /is not supported in React Server Components\\./, label);
          return true;
        },
        label
      );
    }

    (async () => {
      for (const { expectedVersion, keys, resolvedFileName, specifier, unsupportedExport } of entrypoints) {
        assert.equal(
          require.resolve(specifier),
          path.join(
            process.cwd(),
            'node_modules',
            '@fast-react',
            'react-dom',
            resolvedFileName
          ),
          specifier
        );

        const cjsModule = require(specifier);
        assertInventoryKeys(cjsModule, keys, specifier);
        if (Object.hasOwn(cjsModule, 'version')) {
          assert.equal(cjsModule.version, expectedVersion ?? placeholderVersion);
        }
        if (specifier === '@fast-react/react-dom/server.bun') {
          assert.equal(cjsModule.resume, undefined, specifier);
        }
        assertUnimplemented(
          () => cjsModule[unsupportedExport](),
          specifier + ' ' + unsupportedExport
        );

        const esmModule = await import(specifier);
        assert.equal(esmModule.default, cjsModule, specifier);
        for (const key of keys) {
          assert.equal(esmModule[key], cjsModule[key], specifier + ' ' + key);
        }
      }

      for (const [specifier, resolvedFileName] of throwingEntrypoints) {
        assert.equal(
          require.resolve(specifier),
          path.join(
            process.cwd(),
            'node_modules',
            '@fast-react',
            'react-dom',
            resolvedFileName
          ),
          specifier
        );
        assertReactServerUnsupported(() => require(specifier), specifier);
        await assert.rejects(
          import(specifier),
          (error) => {
            assert.equal(
              error.name,
              'FastReactDomReactServerUnsupportedError',
              specifier
            );
            assert.equal(
              error.code,
              'FAST_REACT_REACT_SERVER_UNSUPPORTED',
              specifier
            );
            return true;
          },
          specifier
        );
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
    `react-dom package probe failed:\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
}

async function runReactDomConditionProbe(tempRoot, nodeArgs, expectedResolutions) {
  const probePath = path.join(tempRoot, 'react-dom-condition-probe.cjs');
  const probeSource = `
    'use strict';

    const assert = require('node:assert/strict');
    const path = require('node:path');

    const expectedResolutions = ${JSON.stringify(expectedResolutions)};

    for (const [specifier, resolvedFileName] of expectedResolutions) {
      assert.equal(
        require.resolve(specifier),
        path.join(
          process.cwd(),
          'node_modules',
          '@fast-react',
          'react-dom',
          resolvedFileName
        ),
        specifier
      );
    }
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
    `react-dom condition probe failed:\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
}

async function runSchedulerPackageProbe(tempRoot) {
  const probePath = path.join(tempRoot, 'scheduler-probe.cjs');
  const probeSource = `
    'use strict';

    const assert = require('node:assert/strict');
    const path = require('node:path');

    const entrypoints = ${JSON.stringify(schedulerEntrypoints)};

    function assertInventoryKeys(moduleExports, expectedKeys, label) {
      assert.deepEqual(Object.keys(moduleExports), expectedKeys, label);
      assert.equal(moduleExports.__FAST_REACT_PLACEHOLDER__, true, label);
      assert.equal(moduleExports.compatibilityTarget, 'scheduler@0.27.0', label);
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

    function assertImplementedRootKeys(moduleExports, expectedKeys, label) {
      assert.deepEqual(Object.keys(moduleExports), expectedKeys, label);
      assert.equal(
        Object.hasOwn(moduleExports, '__FAST_REACT_PLACEHOLDER__'),
        false,
        label
      );
      assert.equal(
        Object.hasOwn(moduleExports, 'compatibilityTarget'),
        false,
        label
      );
    }

    function assertImplementedMockKeys(moduleExports, expectedKeys, label) {
      assert.deepEqual(Object.keys(moduleExports), expectedKeys, label);
      assert.equal(
        Object.hasOwn(moduleExports, '__FAST_REACT_PLACEHOLDER__'),
        false,
        label
      );
      assert.equal(
        Object.hasOwn(moduleExports, 'compatibilityTarget'),
        false,
        label
      );
    }

    function assertImplementedNativeKeys(moduleExports, expectedKeys, label) {
      assert.deepEqual(Object.keys(moduleExports), expectedKeys, label);
      assert.equal(
        Object.hasOwn(moduleExports, '__FAST_REACT_PLACEHOLDER__'),
        false,
        label
      );
      assert.equal(
        Object.hasOwn(moduleExports, 'compatibilityTarget'),
        false,
        label
      );
    }

    function assertImplementedRootBehavior(moduleExports, label) {
      assert.equal(typeof moduleExports.unstable_now, 'function', label);
      assert.equal(
        moduleExports.unstable_getCurrentPriorityLevel(),
        moduleExports.unstable_NormalPriority,
        label
      );

      const userBlockingPriority = moduleExports.unstable_runWithPriority(
        moduleExports.unstable_UserBlockingPriority,
        () => moduleExports.unstable_getCurrentPriorityLevel()
      );
      assert.equal(
        userBlockingPriority,
        moduleExports.unstable_UserBlockingPriority,
        label
      );
      assert.equal(
        moduleExports.unstable_getCurrentPriorityLevel(),
        moduleExports.unstable_NormalPriority,
        label
      );

      const nextFromImmediate = moduleExports.unstable_runWithPriority(
        moduleExports.unstable_ImmediatePriority,
        () =>
          moduleExports.unstable_next(() =>
            moduleExports.unstable_getCurrentPriorityLevel()
          )
      );
      assert.equal(nextFromImmediate, moduleExports.unstable_NormalPriority, label);

      const wrapped = moduleExports.unstable_runWithPriority(
        moduleExports.unstable_UserBlockingPriority,
        () =>
          moduleExports.unstable_wrapCallback(function schedulerSmokeWrapped(
            first,
            second
          ) {
            return {
              args: [first, second],
              priority: moduleExports.unstable_getCurrentPriorityLevel(),
              receiver: this.receiver
            };
          })
      );
      const wrappedResult = moduleExports.unstable_runWithPriority(
        moduleExports.unstable_LowPriority,
        () => wrapped.call({ receiver: 'root-smoke' }, 'a', 'b')
      );
      assert.deepEqual(
        wrappedResult,
        {
          args: ['a', 'b'],
          priority: moduleExports.unstable_UserBlockingPriority,
          receiver: 'root-smoke'
        },
        label
      );

      const beforeNow = moduleExports.unstable_now();
      const task = moduleExports.unstable_scheduleCallback(
        moduleExports.unstable_NormalPriority,
        () => {}
      );
      assert.deepEqual(
        Object.keys(task),
        [
          'id',
          'callback',
          'priorityLevel',
          'startTime',
          'expirationTime',
          'sortIndex'
        ],
        label
      );
      assert.equal(task.priorityLevel, moduleExports.unstable_NormalPriority);
      assert.equal(typeof task.callback, 'function', label);
      assert.equal(task.sortIndex, task.expirationTime, label);
      assert.equal(task.startTime >= beforeNow, true, label);
      moduleExports.unstable_cancelCallback(task);
      assert.equal(task.callback, null, label);

      const delayedTask = moduleExports.unstable_scheduleCallback(
        moduleExports.unstable_NormalPriority,
        () => {},
        { delay: 40 }
      );
      assert.equal(delayedTask.sortIndex, delayedTask.startTime, label);
      moduleExports.unstable_cancelCallback(delayedTask);
    }

    function assertNativeThrower(callback, label) {
      assert.throws(
        callback,
        (error) => {
          assert.equal(error.name, 'Error', label);
          assert.equal(error.message, 'Not implemented.', label);
          assert.equal(Object.hasOwn(error, 'code'), false, label);
          assert.equal(Object.hasOwn(error, 'compatibilityTarget'), false, label);
          return true;
        },
        label
      );
    }

    function assertImplementedNativeBehavior(moduleExports, label) {
      assert.equal(typeof moduleExports.unstable_now, 'function', label);
      assert.equal(
        moduleExports.unstable_getCurrentPriorityLevel(),
        moduleExports.unstable_NormalPriority,
        label
      );
      assert.equal(moduleExports.unstable_requestPaint(), undefined, label);
      assert.equal(moduleExports.unstable_shouldYield(), true, label);

      const beforeNow = moduleExports.unstable_now();
      const task = moduleExports.unstable_scheduleCallback(
        moduleExports.unstable_NormalPriority,
        () => {}
      );
      assert.deepEqual(
        Object.keys(task),
        [
          'id',
          'callback',
          'priorityLevel',
          'startTime',
          'expirationTime',
          'sortIndex'
        ],
        label
      );
      assert.equal(task.priorityLevel, moduleExports.unstable_NormalPriority);
      assert.equal(typeof task.callback, 'function', label);
      assert.equal(task.sortIndex, task.expirationTime, label);
      assert.equal(task.startTime >= beforeNow, true, label);
      moduleExports.unstable_cancelCallback(task);
      assert.equal(task.callback, null, label);

      const delayedTask = moduleExports.unstable_scheduleCallback(
        moduleExports.unstable_NormalPriority,
        () => {},
        { delay: 40 }
      );
      assert.equal(delayedTask.sortIndex, delayedTask.startTime, label);
      moduleExports.unstable_cancelCallback(delayedTask);

      for (const unsupportedExport of [
        'unstable_runWithPriority',
        'unstable_next',
        'unstable_wrapCallback',
        'unstable_forceFrameRate'
      ]) {
        assertNativeThrower(
          () => moduleExports[unsupportedExport](),
          label + ' ' + unsupportedExport
        );
      }
    }

    function assertImplementedMockBehavior(moduleExports, label) {
      assert.equal(moduleExports.unstable_scheduleCallback.name, '', label);
      assert.equal(moduleExports.unstable_scheduleCallback.length, 3, label);
      assert.equal(moduleExports.unstable_shouldYield.name, 'shouldYieldToHost', label);
      assert.equal(moduleExports.unstable_forceFrameRate.length, 0, label);

      moduleExports.reset();
      assert.equal(moduleExports.unstable_now(), 0, label);
      assert.equal(
        moduleExports.unstable_getCurrentPriorityLevel(),
        moduleExports.unstable_NormalPriority,
        label
      );
      moduleExports.unstable_advanceTime(5);
      assert.equal(moduleExports.unstable_now(), 5, label);
      moduleExports.log('manual');
      assert.deepEqual(moduleExports.unstable_clearLog(), ['manual'], label);

      moduleExports.unstable_setDisableYieldValue(true);
      moduleExports.unstable_advanceTime(10);
      moduleExports.log('disabled');
      assert.equal(moduleExports.unstable_now(), 5, label);
      assert.deepEqual(moduleExports.unstable_clearLog(), [], label);
      moduleExports.unstable_setDisableYieldValue(false);

      const cancelledTask = moduleExports.unstable_scheduleCallback(
        moduleExports.unstable_NormalPriority,
        () => {
          throw new Error(label + ' cancelled callback should not run');
        }
      );
      assert.deepEqual(
        Object.keys(cancelledTask),
        [
          'id',
          'callback',
          'priorityLevel',
          'startTime',
          'expirationTime',
          'sortIndex'
        ],
        label
      );
      assert.equal(cancelledTask.sortIndex, cancelledTask.expirationTime, label);
      moduleExports.unstable_cancelCallback(cancelledTask);
      assert.equal(cancelledTask.callback, null, label);
      assert.equal(moduleExports.unstable_flushAllWithoutAsserting(), true, label);
      assert.equal(moduleExports.unstable_hasPendingWork(), false, label);

      const events = [];
      moduleExports.unstable_scheduleCallback(
        moduleExports.unstable_NormalPriority,
        (didTimeout) => {
          events.push(['normal', didTimeout]);
          moduleExports.log('normal');
        }
      );
      moduleExports.unstable_scheduleCallback(
        moduleExports.unstable_ImmediatePriority,
        (didTimeout) => {
          events.push(['immediate', didTimeout]);
          moduleExports.log('immediate');
        }
      );
      assert.equal(moduleExports.unstable_hasPendingWork(), true, label);
      assert.equal(moduleExports.unstable_flushAllWithoutAsserting(), true, label);
      assert.deepEqual(events, [
        ['immediate', true],
        ['normal', false]
      ], label);
      assert.deepEqual(moduleExports.unstable_clearLog(), ['immediate', 'normal'], label);
      assert.equal(moduleExports.unstable_hasPendingWork(), false, label);
    }

    function assertUnimplemented(callback, label) {
      assert.throws(
        callback,
        (error) => {
          assert.equal(error.name, 'FastReactSchedulerUnimplementedError', label);
          assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', label);
          assert.equal(error.compatibilityTarget, 'scheduler@0.27.0', label);
          assert.match(error.message, /no .*scheduler .*implementation yet/, label);
          return true;
        },
        label
      );
    }

    function assertPostTaskPlainNodeUnsupported(callback, label) {
      assert.throws(
        callback,
        (error) => {
          assert.equal(error.name, 'ReferenceError', label);
          assert.equal(error.message, 'window is not defined', label);
          return true;
        },
        label
      );
    }

    (async () => {
      const packageJson = require('scheduler/package.json');
      assert.equal(packageJson.name, 'scheduler');
      assert.equal(packageJson.version, '0.27.0');
      assert.equal(Object.hasOwn(packageJson, 'exports'), false);
      assert.equal(Object.hasOwn(packageJson, 'main'), false);
      assert.equal(
        require.resolve('scheduler/package.json'),
        path.join(process.cwd(), 'node_modules', 'scheduler', 'package.json')
      );

      for (const {
        implementedNative,
        implementedMock,
        implementedRoot,
        keys,
        requiresPostTaskWindow,
        resolvedFileName,
        specifier,
        unsupportedExport
      } of entrypoints) {
        assert.equal(
          require.resolve(specifier),
          path.join(process.cwd(), 'node_modules', 'scheduler', resolvedFileName),
          specifier
        );

        if (requiresPostTaskWindow) {
          assertPostTaskPlainNodeUnsupported(() => require(specifier), specifier);
          if (specifier === 'scheduler/unstable_post_task') {
            await assert.rejects(
              import(specifier),
              (error) => error?.code === 'ERR_MODULE_NOT_FOUND',
              specifier
            );
          } else {
            await assert.rejects(
              import(specifier),
              (error) =>
                error?.name === 'ReferenceError' &&
                error?.message === 'window is not defined',
              specifier
            );
          }
          continue;
        }

        const cjsModule = require(specifier);
        if (implementedRoot) {
          assertImplementedRootKeys(cjsModule, keys, specifier);
        } else if (implementedMock) {
          assertImplementedMockKeys(cjsModule, keys, specifier);
        } else if (implementedNative) {
          assertImplementedNativeKeys(cjsModule, keys, specifier);
        } else {
          assertInventoryKeys(cjsModule, keys, specifier);
        }
        assert.equal(cjsModule.unstable_ImmediatePriority, 1, specifier);
        assert.equal(cjsModule.unstable_UserBlockingPriority, 2, specifier);
        assert.equal(cjsModule.unstable_NormalPriority, 3, specifier);
        assert.equal(cjsModule.unstable_LowPriority, 4, specifier);
        assert.equal(cjsModule.unstable_IdlePriority, 5, specifier);
        assert.equal(cjsModule.unstable_Profiling, null, specifier);
        if (implementedRoot) {
          assertImplementedRootBehavior(cjsModule, specifier);
        } else if (implementedMock) {
          assertImplementedMockBehavior(cjsModule, specifier);
        } else if (implementedNative) {
          assertImplementedNativeBehavior(cjsModule, specifier);
        } else {
          assertUnimplemented(
            () => cjsModule[unsupportedExport](),
            specifier + ' ' + unsupportedExport
          );
        }

        if (
          specifier === 'scheduler/unstable_mock' ||
          specifier === 'scheduler/unstable_post_task'
        ) {
          await assert.rejects(
            import(specifier),
            (error) => error?.code === 'ERR_MODULE_NOT_FOUND',
            specifier
          );
        } else {
          const esmModule = await import(specifier);
          assert.equal(esmModule.default, cjsModule, specifier);
        }
      }

      assert.equal(
        require.resolve('scheduler/index.js'),
        path.join(process.cwd(), 'node_modules', 'scheduler', 'index.js')
      );
      assert.equal(
        require.resolve('scheduler/unstable_mock.js'),
        path.join(process.cwd(), 'node_modules', 'scheduler', 'unstable_mock.js')
      );
      assert.equal(
        require.resolve('scheduler/unstable_post_task.js'),
        path.join(
          process.cwd(),
          'node_modules',
          'scheduler',
          'unstable_post_task.js'
        )
      );
    })().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  `;

  await writeFile(probePath, probeSource);

  const result = spawnSync(process.execPath, [probePath], {
    cwd: tempRoot,
    encoding: 'utf8',
    stdio: 'pipe'
  });

  assert.equal(
    result.status,
    0,
    `scheduler package probe failed:\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
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

    function assertDevComponentClasses(moduleExports, label) {
      assert.equal(moduleExports.Component.name, 'Component', label);
      assert.equal(moduleExports.Component.length, 3, label);
      assert.equal(moduleExports.PureComponent.name, 'PureComponent', label);
      assert.equal(moduleExports.PureComponent.length, 3, label);
      assert.deepEqual(Reflect.ownKeys(moduleExports.Component.prototype), [
        'constructor',
        'isReactComponent',
        'setState',
        'forceUpdate',
        'isMounted',
        'replaceState'
      ], label);
      assert.deepEqual(Object.keys(moduleExports.PureComponent.prototype), [
        'constructor',
        'isReactComponent',
        'setState',
        'forceUpdate',
        'isPureReactComponent'
      ], label);
      assert.equal(
        Object.getPrototypeOf(moduleExports.PureComponent.prototype),
        moduleExports.Component.prototype,
        label
      );
      const props = { label: 'dev-props' };
      const context = { label: 'dev-context' };
      const calls = [];
      const updater = {
        enqueueSetState() {
          calls.push(['setState', ...arguments]);
        },
        enqueueForceUpdate() {
          calls.push(['forceUpdate', ...arguments]);
        }
      };
      const component = new moduleExports.Component(
        props,
        context,
        updater,
        'ignored'
      );
      const pure = new moduleExports.PureComponent(
        props,
        context,
        updater,
        'ignored'
      );
      assert.deepEqual(Object.keys(component), [
        'props',
        'context',
        'refs',
        'updater'
      ], label);
      assert.equal(component.props, props, label);
      assert.equal(component.context, context, label);
      assert.equal(component.updater, updater, label);
      assert.equal(component.refs, pure.refs, label);
      assert.equal(pure instanceof moduleExports.PureComponent, true, label);
      assert.equal(pure instanceof moduleExports.Component, true, label);
      const defaultComponent = new moduleExports.Component('props', 'context');
      const secondDefault = new moduleExports.Component('props2', 'context2');
      assert.equal(defaultComponent.refs, secondDefault.refs, label);
      assert.equal(Object.isFrozen(defaultComponent.refs), true, label);
      assert.equal(Object.isSealed(defaultComponent.refs), true, label);
      assert.equal(Object.isExtensible(defaultComponent.refs), false, label);
      assert.deepEqual(Object.keys(defaultComponent.updater), [
        'isMounted',
        'enqueueForceUpdate',
        'enqueueReplaceState',
        'enqueueSetState'
      ], label);
      assert.equal(defaultComponent.updater.enqueueSetState.length, 1, label);
      assert.equal(component.setState({ next: true }, 'callback'), undefined, label);
      assert.equal(component.forceUpdate('callback'), undefined, label);
      assert.equal(calls.length, 2, label);
      assert.equal(calls[0][0], 'setState', label);
      assert.equal(calls[0][1], component, label);
      assert.equal(calls[0].at(-1), 'setState', label);
      assert.equal(calls[1][0], 'forceUpdate', label);
      assert.equal(calls[1][1], component, label);
      assert.equal(calls[1].at(-1), 'forceUpdate', label);
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
          if (Object.hasOwn(cjsModule, 'Component')) {
            assertDevComponentClasses(cjsModule, specifier);
          } else {
            assert.equal(cjsModule.Component, undefined, specifier);
            assert.equal(cjsModule.PureComponent, undefined, specifier);
          }
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

console.log('Fast React entrypoints match the accepted inventory and element/context/ref/Children/memo/lazy/forwardRef/component-class smoke checks.');
