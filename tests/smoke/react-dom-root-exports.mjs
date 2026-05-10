import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);
const reactDomPackageRoot = path.join(repoRoot, 'packages', 'react-dom');
const oracle = require(
  path.join(
    repoRoot,
    'tests',
    'conformance',
    'oracles',
    'react-19.2.6-react-dom-export-oracle.json'
  )
);

const entrypoints = [
  {
    fileName: 'index.js',
    mode: 'default-node-development',
    subpath: '.',
    unsupportedExports: [
      'flushSync',
      'preconnect',
      'prefetchDNS',
      'preinit',
      'preinitModule',
      'preload',
      'preloadModule',
      'requestFormReset',
      'useFormState',
      'useFormStatus'
    ]
  },
  {
    fileName: 'profiling.js',
    mode: 'default-node-development',
    subpath: './profiling',
    unsupportedExports: [
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
      'useFormState',
      'useFormStatus'
    ]
  },
  {
    fileName: 'test-utils.js',
    mode: 'default-node-development',
    subpath: './test-utils',
    unsupportedExports: ['act']
  }
];

for (const entrypoint of entrypoints) {
  await assertEntrypoint(entrypoint);
}

async function assertEntrypoint(entrypoint) {
  const expected = getOracleObservation(entrypoint.mode, entrypoint.subpath);
  const absolutePath = path.join(reactDomPackageRoot, entrypoint.fileName);
  const actual = require(absolutePath);

  assert.deepEqual(
    Object.keys(actual),
    expected.require.exportKeys,
    `${entrypoint.subpath} export keys`
  );
  assert.equal(
    actual.__FAST_REACT_PLACEHOLDER__,
    true,
    `${entrypoint.subpath} keeps scaffold metadata`
  );
  assert.equal(
    actual.compatibilityTarget,
    'react-dom@19.2.6',
    `${entrypoint.subpath} compatibility target`
  );
  assert.equal(
    Object.keys(actual).includes('__FAST_REACT_PLACEHOLDER__'),
    false,
    `${entrypoint.subpath} metadata is not enumerable`
  );

  const expectedDescriptors = descriptorMap(expected);
  for (const key of expected.require.exportKeys) {
    assertPublicDescriptor(
      actual,
      key,
      expectedDescriptors.get(key),
      entrypoint.subpath
    );
  }

  if (Object.hasOwn(actual, 'unstable_batchedUpdates')) {
    assertBatchedUpdates(actual.unstable_batchedUpdates, entrypoint.subpath);
  }

  for (const exportName of entrypoint.unsupportedExports) {
    assertReactDomUnsupported(
      () => actual[exportName](),
      `${entrypoint.subpath}.${exportName}`
    );
  }

  if (
    Object.hasOwn(
      actual,
      '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'
    )
  ) {
    assertDomInternals(
      actual.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      expectedDescriptors.get(
        '__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE'
      ),
      entrypoint.subpath
    );
  }

  const esmModule = await import(pathToFileURL(absolutePath).href);
  assert.equal(esmModule.default, actual, `${entrypoint.subpath} ESM default`);
  for (const key of expected.require.exportKeys) {
    assert.equal(
      esmModule[key],
      actual[key],
      `${entrypoint.subpath} ESM named export ${key}`
    );
  }
}

function getOracleObservation(mode, subpath) {
  const observation = oracle.runtimeExportObservations[mode].find(
    (candidate) => candidate.subpath === subpath
  );

  assert.ok(observation, `oracle observation for ${mode} ${subpath}`);
  assert.equal(observation.require.status, 'ok', `${subpath} oracle require`);

  return observation;
}

function descriptorMap(observation) {
  return new Map(
    observation.require.descriptors.map(({ key, descriptor }) => [
      key.value,
      descriptor
    ])
  );
}

function assertPublicDescriptor(moduleExports, key, expected, label) {
  const descriptor = Object.getOwnPropertyDescriptor(moduleExports, key);
  assert.deepEqual(
    {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: descriptor.writable
    },
    {
      configurable: expected.configurable,
      enumerable: expected.enumerable,
      writable: expected.writable
    },
    `${label}.${key} descriptor flags`
  );

  const expectedValue = expected.value;
  if (expectedValue.type === 'function') {
    assert.equal(typeof descriptor.value, 'function', `${label}.${key} type`);
    assert.equal(descriptor.value.name, expectedValue.name, `${label}.${key}`);
    assert.equal(
      descriptor.value.length,
      expectedValue.length,
      `${label}.${key} length`
    );
    assert.deepEqual(
      Object.getOwnPropertyNames(descriptor.value),
      expectedValue.ownPropertyNames,
      `${label}.${key} own properties`
    );
    return;
  }

  if (expectedValue.type === 'string') {
    assert.equal(descriptor.value, expectedValue.value, `${label}.${key}`);
    return;
  }

  if (expectedValue.type === 'object') {
    assert.equal(
      Object.prototype.toString.call(descriptor.value),
      expectedValue.objectTag,
      `${label}.${key} object tag`
    );
    assert.equal(
      Object.isExtensible(descriptor.value),
      expectedValue.isExtensible,
      `${label}.${key} extensibility`
    );
  }
}

function assertBatchedUpdates(unstableBatchedUpdates, label) {
  const calls = [];
  const sentinelError = new Error('batched failure');
  function callback(value) {
    calls.push(value);
    return { value };
  }

  assert.deepEqual(
    unstableBatchedUpdates(callback, 'payload'),
    { value: 'payload' },
    `${label}.unstable_batchedUpdates return`
  );
  assert.deepEqual(calls, ['payload'], `${label}.unstable_batchedUpdates call`);
  assert.throws(
    () =>
      unstableBatchedUpdates(() => {
        throw sentinelError;
      }),
    sentinelError,
    `${label}.unstable_batchedUpdates propagates callback errors`
  );
  assert.throws(
    () => unstableBatchedUpdates(null, 'payload'),
    TypeError,
    `${label}.unstable_batchedUpdates invalid callback`
  );
}

function assertDomInternals(actual, expected, label) {
  const expectedInternals = expected.value;
  assert.deepEqual(
    Object.keys(actual),
    expectedInternals.ownPropertyNames,
    `${label}.internals keys`
  );
  assert.deepEqual(
    Reflect.ownKeys(actual),
    expectedInternals.ownKeys.map((key) => key.value),
    `${label}.internals own keys`
  );
  assert.equal(actual.p, 0, `${label}.internals.p`);
  assert.equal(actual.findDOMNode, null, `${label}.internals.findDOMNode`);

  const expectedDispatch = expectedInternals.descriptors.find(
    ({ key }) => key.value === 'd'
  ).descriptor.value;
  assert.deepEqual(
    Object.keys(actual.d),
    expectedDispatch.ownPropertyNames,
    `${label}.internals.d keys`
  );
  for (const key of expectedDispatch.ownPropertyNames) {
    assert.equal(typeof actual.d[key], 'function', `${label}.internals.d.${key}`);
    assertReactDomUnsupported(
      () => actual.d[key](),
      `${label}.internals.d.${key}`
    );
  }
}

function assertReactDomUnsupported(callback, label) {
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
