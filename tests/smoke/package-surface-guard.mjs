import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);
const packagesRoot = path.join(repoRoot, 'packages');
const nativePackageRoot = path.join(repoRoot, 'bindings', 'node');
const snapshotPath = path.join(
  repoRoot,
  'tests',
  'smoke',
  'package-surface-snapshot.json'
);

process.env.NODE_ENV = 'development';

const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));

const resolverFilePattern = /\.(?:cjs|js|json|mjs|node)$/;
const declarationFilePattern = /\.(?:d\.ts|d\.mts|d\.cts)$/;
const privateImplementationFileIgnorePatterns = [/^test\//u];
const runtimeMetadataKeys = [
  '__FAST_REACT_PLACEHOLDER__',
  '__FAST_REACT_ENTRYPOINT__',
  'compatibilityTarget'
];
const allowedRuntimeMetadataKeys = new Set(runtimeMetadataKeys);
const acceptedNativeDiagnosticRuntimeKeys = new Set([
  'createNativeRootBridgeRequestShapeGate',
  'nativeRootBridgeRequestShape'
]);
const privateDiagnosticRuntimeExportPattern =
  /(?:private|diagnostic|diagnostics|gate|bridge|dispatcher|metadata|route|routes|secret|source)/iu;
const privateDiagnosticPublicFileGuards = {
  react: [
    /(?:^|\/)(?:.*act.*dispatcher.*|.*act.*queue.*|.*dispatcher.*|.*diagnostic.*|.*gate.*|.*metadata.*|.*private.*|.*route.*|.*secret.*|.*source.*)\.(?:js|json|node)$/iu
  ],
  'react-dom': [
    /(?:^|\/)(?:.*diagnostic.*|.*gate.*|.*metadata.*|.*private.*|.*root-bridge.*|.*route.*|.*secret.*|.*source.*)\.(?:js|json|node)$/iu,
    /^src\//u
  ],
  'react-test-renderer': [
    /(?:^|\/)(?:.*diagnostic.*|.*gate.*|.*metadata.*|.*private.*|.*route.*|.*secret.*|.*source.*)\.(?:js|json|node)$/iu,
    /^src\//u
  ],
  scheduler: [
    /(?:^|\/)(?:.*diagnostic.*|.*flush-helper.*|.*gate.*|.*metadata.*|.*private.*|.*react-test-renderer.*helper.*|.*secret.*|.*source.*)\.(?:js|json|node)$/iu,
    /^src\//u
  ],
  native: [
    /(?:^|\/)(?:.*diagnostic.*|.*gate.*|.*metadata.*|.*private.*|.*root-bridge.*|.*route.*|.*secret.*|.*source.*)\.(?:cjs|js|json|mjs|node)$/iu,
    /^src\//u
  ]
};
const exactPrivatePublicFileGuards = {
  react: [
    'children-helper.js',
    'cjs/react.development.js',
    'cjs/react.production.js',
    'component-class.js',
    'context-object.js',
    'element-factory.js',
    'element-type.js',
    'hook-dispatcher.js',
    'placeholder-utils.js',
    'private-act-dispatcher-gate.js',
    'ref-object.js',
    'transition.js',
    'wrapper-object.js'
  ],
  'react-dom': [
    'placeholder-utils.js',
    'src/client/component-tree.js',
    'src/client/controlled-restore-queue.js',
    'src/client/dom-container.js',
    'src/client/dom-host-context.js',
    'src/client/dom-namespaces.js',
    'src/client/hydration-boundary-gate.js',
    'src/client/hydration-marker-parser.js',
    'src/client/ref-callback-gate.js',
    'src/client/root-bridge.js',
    'src/client/root-markers.js',
    'src/dom-host/index.js',
    'src/dom-host/mutation.js',
    'src/dom-host/property-payload.js',
    'src/dom-host/text-content.js',
    'src/events/dispatch.js',
    'src/events/event-names.js',
    'src/events/event-priorities.js',
    'src/events/event-system-flags.js',
    'src/events/get-event-target.js',
    'src/events/listener-registry.js',
    'src/events/plugin-event-system.js',
    'src/events/react-dom-event-listener.js',
    'src/events/root-listeners.js',
    'src/resource-form-gates.js',
    'src/resource-form-internals-gate.js',
    'src/shared/create-portal.js',
    'src/shared/flush-sync-guard.js',
    'src/test-utils-act-gate.js'
  ],
  'react-test-renderer': [
    'cjs/react-test-renderer-private-routes.development.js',
    'cjs/react-test-renderer-private-routes.production.js',
    'create-routing-gate.js',
    'diagnostics.js',
    'private-routes.js',
    'src/act-scheduler-private-gate.js',
    'src/error-surface-local-gate.js',
    'src/private-root-request-bridge.js',
    'src/private-serialization-facade.js',
    'src/test-instance-private-wrapper.js',
    'src/update-unmount-private-bridge.js'
  ],
  scheduler: [
    'cjs/scheduler-unstable_mock.flush-helpers.development.js',
    'cjs/scheduler-unstable_mock.flush-helpers.production.js',
    'src/unstable_mock.js',
    'unstable_mock-flush-helpers.js'
  ],
  native: [
    'native-root-bridge.js',
    'private-root-bridge.js',
    'src/native-root-bridge.js',
    'src/private-root-bridge.js'
  ]
};
const nativeRuntimeKeys = [
  'FastReactNativeBindingUnavailableError',
  'bindingStatus',
  'createNativeRootBridgeRequestShapeGate',
  'getNativeBindingLoadPlan',
  'loadNativeBinding',
  'nativeAddonName',
  'nativeBindingManifest',
  'nativeRootBridgeRequestShape',
  'nativeTargetMatrix',
  'nodeApiVersionFloor',
  'optionalPackagePrefix',
  'packageName',
  'platformArtifactPolicy',
  'platformPackages',
  'supportedNativeTargets',
  'supportedNodeEngineRange',
  'unavailableErrorCode'
];
const expectedNativePackage = {
  packageJsonKeys: [
    'name',
    'version',
    'private',
    'description',
    'type',
    'main',
    'exports',
    'scripts',
    'engines'
  ],
  manifest: {
    name: '@fast-react/native',
    version: '0.0.0',
    private: true,
    type: 'module',
    main: './index.cjs',
    exports: {
      '.': {
        import: './index.mjs',
        require: './index.cjs',
        default: './index.mjs'
      },
      './package.json': './package.json'
    },
    types: null,
    typings: null,
    typesVersions: null,
    files: null,
    bin: null,
    browser: null,
    module: null,
    'react-native': null,
    dependencies: null,
    peerDependencies: null
  },
  packageMetadata: {
    description: 'Node loader placeholder for the Fast React native binding.',
    scripts: {
      build: 'cargo build -p fast-react-napi',
      check:
        'node ./test/native-loader.test.cjs && node ./test/native-no-load-guard.test.cjs && node ./test/native-loader-esm.test.mjs',
      test: 'npm run check'
    },
    engines: {
      node: '>=22.0.0'
    }
  },
  publicResolverFiles: ['index.cjs', 'index.mjs', 'package.json'],
  privateImplementationFiles: [],
  declarationFiles: []
};

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function manifestSurface(packageJson) {
  return Object.fromEntries(
    snapshot.manifestFields.map((field) => [
      field,
      Object.hasOwn(packageJson, field) ? packageJson[field] : null
    ])
  );
}

function collectPackageExportTargets(value, targets = new Set()) {
  if (typeof value === 'string') {
    assert.equal(
      value.startsWith('./'),
      true,
      `package export target ${value} must stay package-relative`
    );
    assert.equal(
      value.includes('..'),
      false,
      `package export target ${value} must not escape the package`
    );
    targets.add(value.slice(2));
    return targets;
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const nestedValue of Object.values(value)) {
      collectPackageExportTargets(nestedValue, targets);
    }
  }

  return targets;
}

async function listFiles(directory, pattern) {
  const files = [];

  async function walk(relativeDirectory) {
    const entries = await readdir(path.join(directory, relativeDirectory), {
      withFileTypes: true
    });

    for (const entry of entries) {
      const relativePath = path.join(relativeDirectory, entry.name);

      if (entry.isDirectory()) {
        await walk(relativePath);
        continue;
      }

      if (entry.isFile() && pattern.test(entry.name)) {
        files.push(normalizeRelativePath(relativePath));
      }
    }
  }

  await walk('');
  files.sort();
  return files;
}

async function assertFileExists(packageRoot, relativePath, label) {
  const fileStat = await stat(path.join(packageRoot, relativePath));
  assert.equal(fileStat.isFile(), true, `${label} must be a file`);
}

function expectedKeysFor(entry) {
  const keys = snapshot.keySets[entry.keySet];
  assert.notEqual(keys, undefined, `${entry.file} references a known key set`);
  return keys;
}

function assertRuntimeOwnStringKeys(moduleExports, entry, label) {
  if (
    moduleExports === null ||
    (typeof moduleExports !== 'object' && typeof moduleExports !== 'function')
  ) {
    return;
  }

  const actualOwnStringKeys = Reflect.ownKeys(moduleExports).filter(
    (key) => typeof key === 'string'
  );

  if (typeof moduleExports === 'function') {
    assertNoPrivateDiagnosticRuntimeExports(moduleExports, label);
    return;
  }

  const expectedOwnStringKeys = [...expectedKeysFor(entry)];
  if (entry.metadata.placeholder !== false) {
    expectedOwnStringKeys.push(...runtimeMetadataKeys);
  }

  assert.deepEqual(
    actualOwnStringKeys,
    expectedOwnStringKeys,
    `${label} own string keys`
  );
}

function assertPrivateRuntimeFacadeSymbols(
  target,
  expectedSymbols = [],
  label
) {
  assert.deepEqual(
    [...expectedSymbols].sort(),
    expectedSymbols,
    `${label} private runtime facade symbols snapshot must stay sorted`
  );
  assert.equal(
    new Set(expectedSymbols).size,
    expectedSymbols.length,
    `${label} private runtime facade symbols snapshot must stay unique`
  );

  const actualSymbols = Reflect.ownKeys(target).filter(
    (key) => typeof key === 'symbol'
  );
  assert.deepEqual(
    actualSymbols.map((symbol) => symbol.description).sort(),
    expectedSymbols,
    `${label} private runtime facade symbols`
  );

  for (const symbolDescription of expectedSymbols) {
    assert.equal(
      typeof symbolDescription,
      'string',
      `${label} private runtime facade symbol description`
    );
    assert.equal(
      Object.keys(target).includes(symbolDescription),
      false,
      `${label} must not expose private runtime facade ${symbolDescription} as a public key`
    );

    const descriptor = Object.getOwnPropertyDescriptor(
      target,
      Symbol.for(symbolDescription)
    );
    assert.notEqual(
      descriptor,
      undefined,
      `${label} private runtime facade ${symbolDescription} descriptor`
    );
    assert.equal(
      descriptor.enumerable,
      false,
      `${label} private runtime facade ${symbolDescription} enumerable`
    );
    assert.equal(
      descriptor.configurable,
      false,
      `${label} private runtime facade ${symbolDescription} configurable`
    );
    assert.equal(
      descriptor.writable,
      false,
      `${label} private runtime facade ${symbolDescription} writable`
    );
    assert.notEqual(
      descriptor.value,
      undefined,
      `${label} private runtime facade ${symbolDescription} value`
    );
  }
}

function assertPrivateRuntimeFacadeStringProperties(
  target,
  expectedProperties = [],
  label
) {
  assert.deepEqual(
    [...expectedProperties].sort(),
    expectedProperties,
    `${label} private runtime facade string properties snapshot must stay sorted`
  );
  assert.equal(
    new Set(expectedProperties).size,
    expectedProperties.length,
    `${label} private runtime facade string properties snapshot must stay unique`
  );

  assert.notEqual(target, null, `${label} private runtime facade target`);
  assert.equal(
    typeof target === 'object' || typeof target === 'function',
    true,
    `${label} private runtime facade target type`
  );

  const actualProperties = Reflect.ownKeys(target)
    .filter(
      (key) =>
        typeof key === 'string' &&
        !allowedRuntimeMetadataKeys.has(key) &&
        privateDiagnosticRuntimeExportPattern.test(key)
    )
    .sort();

  assert.deepEqual(
    actualProperties,
    expectedProperties,
    `${label} private runtime facade string properties`
  );

  for (const propertyName of expectedProperties) {
    assert.equal(
      Object.keys(target).includes(propertyName),
      false,
      `${label} must not expose private runtime facade ${propertyName} as a public key`
    );

    const descriptor = Object.getOwnPropertyDescriptor(target, propertyName);
    assert.notEqual(
      descriptor,
      undefined,
      `${label} private runtime facade ${propertyName} descriptor`
    );
    assert.equal(
      descriptor.enumerable,
      false,
      `${label} private runtime facade ${propertyName} enumerable`
    );
    assert.equal(
      descriptor.configurable,
      false,
      `${label} private runtime facade ${propertyName} configurable`
    );
    assert.equal(
      descriptor.writable,
      false,
      `${label} private runtime facade ${propertyName} writable`
    );
    assert.notEqual(
      descriptor.value,
      undefined,
      `${label} private runtime facade ${propertyName} value`
    );
    assert.equal(
      descriptor.value !== null && typeof descriptor.value === 'object',
      true,
      `${label} private runtime facade ${propertyName} value type`
    );
    assert.equal(
      Object.isFrozen(descriptor.value),
      true,
      `${label} private runtime facade ${propertyName} value frozen`
    );
    if (Object.hasOwn(descriptor.value, 'exportName')) {
      assert.equal(
        descriptor.value.exportName,
        propertyName,
        `${label} private runtime facade ${propertyName} export name`
      );
    }
  }
}

function assertPrivateRuntimeFacadeStringPropertyMap(
  container,
  expectedPropertiesByName = {},
  label
) {
  const expectedNames = Object.keys(expectedPropertiesByName);
  assert.deepEqual(
    [...expectedNames].sort(),
    expectedNames,
    `${label} private runtime facade string property map snapshot must stay sorted`
  );
  assert.equal(
    new Set(expectedNames).size,
    expectedNames.length,
    `${label} private runtime facade string property map snapshot must stay unique`
  );

  for (const expectedName of expectedNames) {
    assert.equal(
      Object.hasOwn(container, expectedName),
      true,
      `${label}.${expectedName} private runtime facade owner`
    );
    assert.equal(
      typeof container[expectedName],
      'function',
      `${label}.${expectedName} private runtime facade owner type`
    );
  }

  for (const publicName of Object.keys(container)) {
    if (typeof container[publicName] !== 'function') {
      continue;
    }

    assertPrivateRuntimeFacadeStringProperties(
      container[publicName],
      expectedPropertiesByName[publicName] ?? [],
      `${label}.${publicName}`
    );
  }
}

function assertRuntimeEntrypointPrivateFacades(moduleExports, entry, label) {
  const expectedSymbolsByName = entry.privateRuntimeFacadeSymbols ?? {};
  const expectedSymbolNames = Object.keys(expectedSymbolsByName);
  assert.deepEqual(
    [...expectedSymbolNames].sort(),
    expectedSymbolNames,
    `${label} private runtime facade symbol map snapshot must stay sorted`
  );
  assert.equal(
    new Set(expectedSymbolNames).size,
    expectedSymbolNames.length,
    `${label} private runtime facade symbol map snapshot must stay unique`
  );

  for (const publicName of expectedSymbolNames) {
    assert.equal(
      Object.hasOwn(moduleExports, publicName),
      true,
      `${label}.${publicName} private runtime facade owner`
    );
    assertPrivateRuntimeFacadeSymbols(
      moduleExports[publicName],
      expectedSymbolsByName[publicName],
      `${label}.${publicName}`
    );
  }

  if (entry.privateRuntimeFacadeStringProperties !== undefined) {
    assertPrivateRuntimeFacadeStringPropertyMap(
      moduleExports,
      entry.privateRuntimeFacadeStringProperties,
      label
    );
  }
}

function assertPlaceholderMetadata(moduleExports, expected, label) {
  const placeholder = Object.getOwnPropertyDescriptor(
    moduleExports,
    '__FAST_REACT_PLACEHOLDER__'
  );
  const entrypoint = Object.getOwnPropertyDescriptor(
    moduleExports,
    '__FAST_REACT_ENTRYPOINT__'
  );
  const compatibilityTarget = Object.getOwnPropertyDescriptor(
    moduleExports,
    'compatibilityTarget'
  );

  if (expected.placeholder === false) {
    assert.equal(placeholder, undefined, `${label} placeholder marker`);
    assert.equal(entrypoint, undefined, `${label} placeholder entrypoint`);
    assert.equal(
      compatibilityTarget,
      undefined,
      `${label} compatibility target`
    );
    return;
  }

  assert.equal(placeholder?.value, true, `${label} placeholder marker`);
  assert.equal(placeholder?.enumerable, false, `${label} marker enumerable`);
  assert.equal(
    entrypoint?.value,
    expected.entrypoint,
    `${label} placeholder entrypoint`
  );
  assert.equal(entrypoint?.enumerable, false, `${label} entrypoint enumerable`);
  assert.equal(
    compatibilityTarget?.value,
    expected.compatibilityTarget,
    `${label} compatibility target`
  );
  assert.equal(
    compatibilityTarget?.enumerable,
    false,
    `${label} target enumerable`
  );
}

function assertNoPrivateDiagnosticRuntimeExports(
  moduleExports,
  label,
  allowedPrivateDiagnosticKeys = new Set()
) {
  if (
    moduleExports === null ||
    (typeof moduleExports !== 'object' && typeof moduleExports !== 'function')
  ) {
    return;
  }

  for (const key of Reflect.ownKeys(moduleExports)) {
    if (
      typeof key !== 'string' ||
      allowedRuntimeMetadataKeys.has(key) ||
      allowedPrivateDiagnosticKeys.has(key)
    ) {
      continue;
    }

    assert.equal(
      privateDiagnosticRuntimeExportPattern.test(key),
      false,
      `${label} must not expose private diagnostic export ${key}`
    );
  }
}

function createNativeDiagnosticRecords() {
  const rootHandle = Object.freeze({
    environmentId: 532,
    generation: 1,
    kind: 'root',
    slot: 1
  });

  return [
    {
      environmentId: 532,
      kind: 'create',
      requestId: 1,
      rootHandle,
      rootHandleState: 'active',
      rootId: 1,
      valueHandle: Object.freeze({
        environmentId: 532,
        generation: 1,
        kind: 'value',
        slot: 2
      })
    },
    {
      environmentId: 532,
      kind: 'render',
      requestId: 2,
      rootHandle,
      rootHandleState: 'active',
      rootId: 1,
      valueHandle: Object.freeze({
        environmentId: 532,
        generation: 1,
        kind: 'value',
        slot: 3
      })
    },
    {
      environmentId: 532,
      kind: 'unmount',
      requestId: 3,
      rootHandle,
      rootHandleState: 'retired',
      rootId: 1,
      valueHandle: null
    }
  ];
}

function assertNativeNoExecutionFlags(record, label) {
  assert.equal(record.nativeAddonLoaded, false, `${label} native addon`);
  assert.equal(record.nativeExecution, false, `${label} native execution`);
  assert.equal(record.rendererExecution, false, `${label} renderer execution`);
  assert.equal(
    record.reconcilerExecution,
    false,
    `${label} reconciler execution`
  );
  if (Object.hasOwn(record, 'reactBehaviorError')) {
    assert.equal(
      record.reactBehaviorError,
      false,
      `${label} React behavior error`
    );
  }
}

function assertNativePackageDiagnosticSurface(nativeRuntime) {
  const requestShape = nativeRuntime.nativeRootBridgeRequestShape;
  const batchMetadata =
    requestShape.jsonTransportSmoke.parserGate.batchedRecordGate;
  const runtimeGate = nativeRuntime.createNativeRootBridgeRequestShapeGate(
    createNativeDiagnosticRecords()
  );
  const batchGate =
    runtimeGate.jsonTransportSmoke.parserGate.batchedRecordGate;
  const teardownGate = requestShape.crossEnvironmentTeardownGate;

  assert.equal(
    batchMetadata.batchGateStatus,
    'validated-native-root-bridge-batched-json-transport-records',
    'native batched JSON metadata status'
  );
  assert.deepEqual(
    batchMetadata.jsonTransportBatchErrorCaseIds,
    [
      'batch-render-before-create-lifecycle-order',
      'batch-root-handle-state-mismatch',
      'batch-create-after-create-lifecycle-order',
      'batch-request-after-unmount-lifecycle-order',
      'batch-request-id-out-of-order'
    ],
    'native batched JSON deterministic error case ids'
  );
  assert.deepEqual(
    batchGate.lifecycleRows.map((row) => row.lifecycleTransition),
    ['none->active', 'active->active', 'active->retired'],
    'native batched JSON accepted lifecycle transitions'
  );
  assert.deepEqual(
    batchGate.errorRows.map((row) => row.code),
    [
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_MUST_START_WITH_CREATE',
      'FAST_REACT_NAPI_ROOT_REQUEST_RECORD_HANDLE_STATE_MISMATCH',
      'FAST_REACT_NAPI_ROOT_REQUEST_CREATE_AFTER_ROOT_CREATED',
      'FAST_REACT_NAPI_ROOT_REQUEST_AFTER_UNMOUNT',
      'FAST_REACT_NAPI_ROOT_REQUEST_SEQUENCE_OUT_OF_ORDER'
    ],
    'native batched JSON deterministic error codes'
  );
  for (const row of [...batchGate.lifecycleRows, ...batchGate.errorRows]) {
    assert.deepEqual(
      Object.keys(row),
      batchGate.jsonTransportBatchLifecycleRowFields,
      `native batched JSON row fields ${row.id}`
    );
    assertNativeNoExecutionFlags(row, `native batched JSON ${row.id}`);
  }

  assert.equal(
    teardownGate.teardownGateStatus,
    'diagnosed-native-root-bridge-cross-environment-teardown-isolation',
    'native teardown status'
  );
  assert.deepEqual(
    teardownGate.mismatchedTeardown,
    {
      requestedEnvironmentId: 1496,
      tableEnvironmentId: 496,
      environmentMatched: false,
      rootHandlesInvalidated: 0,
      valueHandlesInvalidated: 0,
      totalHandlesInvalidated: 0,
      toreDownHandles: false
    },
    'native mismatched teardown summary'
  );
  assert.deepEqual(
    teardownGate.matchedTeardown,
    {
      requestedEnvironmentId: 496,
      tableEnvironmentId: 496,
      environmentMatched: true,
      rootHandlesInvalidated: 1,
      valueHandlesInvalidated: 1,
      totalHandlesInvalidated: 2,
      toreDownHandles: true
    },
    'native matched teardown summary'
  );
  assert.deepEqual(
    teardownGate.rows.map((row) => row.id),
    [
      'first-root-active-after-mismatched-teardown',
      'first-value-active-after-mismatched-teardown',
      'first-root-stale-after-own-teardown',
      'first-value-stale-after-own-teardown',
      'first-root-wrong-environment-in-peer-table',
      'first-value-wrong-environment-in-peer-table',
      'peer-root-active-after-first-teardown',
      'peer-value-active-after-first-teardown',
      'first-root-stale-after-slot-reuse',
      'first-value-stale-after-slot-reuse',
      'replacement-root-active-after-slot-reuse',
      'replacement-value-active-after-slot-reuse'
    ],
    'native teardown row ids'
  );
  assert.deepEqual(
    teardownGate.rows.map((row) => row.errorCode),
    [
      null,
      null,
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
      'FAST_REACT_NAPI_WRONG_ENVIRONMENT',
      null,
      null,
      'FAST_REACT_NAPI_STALE_HANDLE',
      'FAST_REACT_NAPI_STALE_HANDLE',
      null,
      null
    ],
    'native teardown row error codes'
  );
  for (const row of teardownGate.rows) {
    assert.deepEqual(
      Object.keys(row),
      teardownGate.teardownDiagnosticRowFields,
      `native teardown row fields ${row.id}`
    );
    assertNativeNoExecutionFlags(row, `native teardown ${row.id}`);
  }
  assertNativeNoExecutionFlags(teardownGate, 'native teardown gate');
}

function assertLoadError(error, expected, label) {
  assert.equal(error.name, expected.name, `${label} error name`);

  if (Object.hasOwn(expected, 'code')) {
    assert.equal(error.code, expected.code, `${label} error code`);
  } else {
    assert.equal(Object.hasOwn(error, 'code'), false, `${label} error code`);
  }

  if (Object.hasOwn(expected, 'compatibilityTarget')) {
    assert.equal(
      error.compatibilityTarget,
      expected.compatibilityTarget,
      `${label} compatibility target`
    );
  } else {
    assert.equal(
      Object.hasOwn(error, 'compatibilityTarget'),
      false,
      `${label} compatibility target`
    );
  }

  if (Object.hasOwn(expected, 'entrypoint')) {
    assert.equal(error.entrypoint, expected.entrypoint, `${label} entrypoint`);
  } else {
    assert.equal(
      Object.hasOwn(error, 'entrypoint'),
      false,
      `${label} entrypoint`
    );
  }

  if (Object.hasOwn(expected, 'message')) {
    assert.equal(error.message, expected.message, `${label} error message`);
  }
}

function assertRuntimeVersion(moduleExports, entry, label) {
  if (!Object.hasOwn(entry, 'version')) {
    return;
  }

  assert.equal(
    Object.hasOwn(moduleExports, 'version'),
    true,
    `${label} version export`
  );
  assert.equal(moduleExports.version, entry.version, `${label} version`);
}

function assertUndefinedExports(moduleExports, entry, label) {
  for (const exportName of entry.undefinedExports ?? []) {
    assert.equal(
      Object.hasOwn(moduleExports, exportName),
      true,
      `${label}.${exportName} export presence`
    );
    assert.equal(
      moduleExports[exportName],
      undefined,
      `${label}.${exportName} must stay undefined`
    );
  }
}

function expectedUnsupportedErrorName(compatibilityTarget) {
  if (compatibilityTarget.startsWith('react-dom@')) {
    return 'FastReactDomUnimplementedError';
  }

  if (compatibilityTarget.startsWith('react-test-renderer@')) {
    return 'FastReactTestRendererUnimplementedError';
  }

  throw new Error(`No unsupported error expectation for ${compatibilityTarget}`);
}

function expectedUnsupportedMessageFragment(compatibilityTarget) {
  if (compatibilityTarget.startsWith('react-dom@')) {
    return 'no React DOM behavior implementation yet';
  }

  if (compatibilityTarget.startsWith('react-test-renderer@')) {
    return 'no React Test Renderer behavior implementation yet';
  }

  throw new Error(
    `No unsupported message expectation for ${compatibilityTarget}`
  );
}

function assertUnsupportedPlaceholderError(error, expected, label) {
  assert.equal(
    error.name,
    expectedUnsupportedErrorName(expected.compatibilityTarget),
    `${label} error name`
  );
  assert.equal(error.code, 'FAST_REACT_UNIMPLEMENTED', `${label} error code`);
  assert.equal(
    error.entrypoint,
    expected.entrypoint,
    `${label} error entrypoint`
  );
  assert.equal(
    error.exportName,
    expected.exportName,
    `${label} error export name`
  );
  assert.equal(
    error.compatibilityTarget,
    expected.compatibilityTarget,
    `${label} compatibility target`
  );
  assert.equal(
    error.message.includes(
      `${expected.entrypoint}.${expected.exportName} ${expected.action}`
    ),
    true,
    `${label} error message should name the boundary`
  );
  assert.equal(
    error.message.includes(
      expectedUnsupportedMessageFragment(expected.compatibilityTarget)
    ),
    true,
    `${label} error message should stay unsupported`
  );
}

function assertUnsupportedExport(moduleExports, entry, expectedExport, label) {
  const exportName = expectedExport.exportName;
  const exportValue = moduleExports[exportName];
  const entrypoint = entry.metadata.entrypoint;
  const compatibilityTarget = entry.metadata.compatibilityTarget;

  assert.equal(
    typeof exportValue,
    'function',
    `${label}.${exportName} placeholder type`
  );
  assert.equal(
    exportValue.name,
    expectedExport.functionName,
    `${label}.${exportName} placeholder name`
  );
  assert.equal(
    exportValue.length,
    expectedExport.length,
    `${label}.${exportName} placeholder length`
  );

  assert.throws(
    () => exportValue(),
    (error) => {
      assertUnsupportedPlaceholderError(
        error,
        {
          action: 'was called',
          compatibilityTarget,
          entrypoint,
          exportName
        },
        `${label}.${exportName}`
      );
      return true;
    },
    `${label}.${exportName} should remain an unsupported placeholder`
  );

  if (expectedExport.failClosed !== undefined) {
    assertFailClosedUnsupportedExport(
      exportValue,
      entrypoint,
      compatibilityTarget,
      expectedExport,
      label
    );
  }
}

function assertFailClosedUnsupportedExport(
  exportValue,
  entrypoint,
  compatibilityTarget,
  expectedExport,
  label
) {
  const expected = expectedExport.failClosed;
  const exportName = expectedExport.exportName;

  assert.equal(
    expected.compatibilityClaimed,
    false,
    `${label}.${exportName} compatibility claim`
  );
  assert.equal(
    expected.status,
    'unsupported-placeholder',
    `${label}.${exportName} fail-closed status`
  );
  assert.equal(
    expected.oracleKind,
    'react-19.2.6-react-dom-test-utils-act-oracle',
    `${label}.${exportName} accepted oracle`
  );

  const consoleCalls = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  let callbackCalls = 0;

  console.error = (...args) => {
    consoleCalls.push(['error', ...args]);
  };
  console.warn = (...args) => {
    consoleCalls.push(['warn', ...args]);
  };

  try {
    assert.throws(
      () =>
        exportValue(() => {
          callbackCalls += 1;
          return 'unexpected-act-callback-result';
        }),
      (error) => {
        assert.equal(
          error.name,
          'FastReactDomUnimplementedError',
          `${label}.${exportName} callback error name`
        );
        assert.equal(
          error.code,
          'FAST_REACT_UNIMPLEMENTED',
          `${label}.${exportName} callback error code`
        );
        assert.equal(
          error.entrypoint,
          entrypoint,
          `${label}.${exportName} callback error entrypoint`
        );
        assert.equal(
          error.exportName,
          exportName,
          `${label}.${exportName} callback error export name`
        );
        assert.equal(
          error.compatibilityTarget,
          compatibilityTarget,
          `${label}.${exportName} callback compatibility target`
        );
        assert.equal(
          error.message.includes('do not treat it as React DOM-compatible'),
          true,
          `${label}.${exportName} callback error should deny compatibility`
        );
        return true;
      },
      `${label}.${exportName} callback call should stay blocked`
    );
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }

  assert.equal(
    callbackCalls,
    expected.callbackCalls,
    `${label}.${exportName} callback calls`
  );
  assert.deepEqual(
    consoleCalls,
    expected.consoleCalls,
    `${label}.${exportName} console calls`
  );
}

function assertReactTestRendererSchedulerPlaceholder(
  scheduler,
  entry,
  exportName,
  label
) {
  const propertyName = exportName.slice('_Scheduler.'.length);
  const expectedSchedulerKeys = snapshot.keySets['scheduler.mock'];
  const expectedPrivateStringProperties =
    entry.reactTestRendererRoot?.schedulerPrivateRuntimeFacadeStringProperties ??
    {};

  assert.deepEqual(
    Object.keys(scheduler),
    expectedSchedulerKeys,
    `${label} scheduler keys`
  );
  assert.deepEqual(
    Reflect.ownKeys(scheduler),
    expectedSchedulerKeys,
    `${label} scheduler ownKeys`
  );
  assertNoPrivateDiagnosticRuntimeExports(scheduler, `${label} scheduler`);
  assertPrivateRuntimeFacadeStringPropertyMap(
    scheduler,
    expectedPrivateStringProperties,
    `${label} scheduler`
  );
  assert.equal(
    typeof scheduler[propertyName],
    'function',
    `${label}.${exportName} type`
  );
  assert.throws(
    () => scheduler[propertyName](),
    (error) => {
      assertUnsupportedPlaceholderError(
        error,
        {
          action: 'was called',
          compatibilityTarget: entry.metadata.compatibilityTarget,
          entrypoint: entry.metadata.entrypoint,
          exportName
        },
        `${label}.${exportName}`
      );
      return true;
    },
    `${label}.${exportName} should remain scheduler-blocked`
  );
}

function assertReactTestRendererRootBehavior(moduleExports, entry, label) {
  const expectedRoot = entry.reactTestRendererRoot;
  if (!expectedRoot) {
    return;
  }

  assert.equal(
    moduleExports.create.name,
    expectedRoot.createFunction.functionName,
    `${label}.create name`
  );
  assert.equal(
    moduleExports.create.length,
    expectedRoot.createFunction.length,
    `${label}.create length`
  );
  assertNoPrivateDiagnosticRuntimeExports(moduleExports.create, `${label}.create`);
  assertPrivateRuntimeFacadeSymbols(
    moduleExports.create,
    expectedRoot.privateRuntimeFacadeSymbols?.create,
    `${label}.create`
  );
  assertReactTestRendererSchedulerPlaceholder(
    moduleExports._Scheduler,
    entry,
    expectedRoot.schedulerProbe,
    label
  );

  const renderer = moduleExports.create(null);
  assert.deepEqual(
    Object.keys(renderer),
    snapshot.keySets[expectedRoot.rendererKeySet],
    `${label}.create() renderer keys`
  );
  assertNoPrivateDiagnosticRuntimeExports(renderer, `${label}.create()`);
  assertPrivateRuntimeFacadeSymbols(
    renderer,
    expectedRoot.privateRuntimeFacadeSymbols?.renderer,
    `${label}.create()`
  );
  assertReactTestRendererSchedulerPlaceholder(
    renderer._Scheduler,
    entry,
    expectedRoot.rendererSchedulerProbe,
    `${label}.create()`
  );

  const rootDescriptor = Object.getOwnPropertyDescriptor(renderer, 'root');
  assert.equal(
    rootDescriptor.enumerable,
    expectedRoot.rootAccessor.enumerable,
    `${label}.root enumerable`
  );
  assert.equal(
    rootDescriptor.configurable,
    expectedRoot.rootAccessor.configurable,
    `${label}.root configurable`
  );
  assert.equal(
    rootDescriptor.get.length,
    expectedRoot.rootAccessor.getterLength,
    `${label}.root getter length`
  );
  assert.equal(rootDescriptor.set, undefined, `${label}.root setter`);
  assert.throws(
    () => renderer.root,
    (error) => {
      assertUnsupportedPlaceholderError(
        error,
        {
          action: 'was accessed',
          compatibilityTarget: entry.metadata.compatibilityTarget,
          entrypoint: entry.metadata.entrypoint,
          exportName: expectedRoot.rootAccessor.exportName
        },
        `${label}.root`
      );
      return true;
    },
    `${label}.root should remain unsupported`
  );

  for (const expectedFunction of expectedRoot.rendererFunctions) {
    const rendererFunction = renderer[expectedFunction.property];
    assertNoPrivateDiagnosticRuntimeExports(
      rendererFunction,
      `${label}.${expectedFunction.property}`
    );
    assert.equal(
      rendererFunction.name,
      expectedFunction.functionName,
      `${label}.${expectedFunction.property} name`
    );
    assert.equal(
      rendererFunction.length,
      expectedFunction.length,
      `${label}.${expectedFunction.property} length`
    );
    assert.throws(
      () => rendererFunction(),
      (error) => {
        assertUnsupportedPlaceholderError(
          error,
          {
            action: 'was called',
            compatibilityTarget: entry.metadata.compatibilityTarget,
            entrypoint: entry.metadata.entrypoint,
            exportName: expectedFunction.exportName
          },
          `${label}.${expectedFunction.property}`
        );
        return true;
      },
      `${label}.${expectedFunction.property} should remain unsupported`
    );
  }

  assertPrivateRuntimeFacadeSymbols(
    renderer.toJSON,
    expectedRoot.privateRuntimeFacadeSymbols?.toJSON,
    `${label}.create().toJSON`
  );
  assertPrivateRuntimeFacadeSymbols(
    renderer.toTree,
    expectedRoot.privateRuntimeFacadeSymbols?.toTree,
    `${label}.create().toTree`
  );
  assertPrivateRuntimeFacadeSymbols(
    renderer.getInstance,
    expectedRoot.privateRuntimeFacadeSymbols?.getInstance,
    `${label}.create().getInstance`
  );
  assertPrivateRuntimeFacadeSymbols(
    renderer.unstable_flushSync,
    expectedRoot.privateRuntimeFacadeSymbols?.unstableFlushSync,
    `${label}.create().unstable_flushSync`
  );
}

function assertReactTestRendererShallowBehavior(moduleExports, entry, label) {
  const expectedShallow = entry.reactTestRendererShallow;
  if (!expectedShallow) {
    return;
  }

  assert.equal(typeof moduleExports, 'function', `${label} type`);
  assert.equal(moduleExports.name, expectedShallow.functionName, `${label} name`);
  assert.equal(moduleExports.length, expectedShallow.length, `${label} length`);

  for (const [action, callback] of [
    ['was called', () => moduleExports()],
    ['was constructed', () => new moduleExports()]
  ]) {
    assert.throws(
      callback,
      (error) => {
        assert.equal(
          error.name,
          'FastReactTestRendererShallowUnsupportedError',
          `${label} ${action} error name`
        );
        assert.equal(
          error.code,
          'FAST_REACT_TEST_RENDERER_SHALLOW_UNSUPPORTED',
          `${label} ${action} error code`
        );
        assert.equal(
          error.entrypoint,
          entry.metadata.entrypoint,
          `${label} ${action} entrypoint`
        );
        assert.equal(
          error.compatibilityTarget,
          entry.metadata.compatibilityTarget,
          `${label} ${action} compatibility target`
        );
        assert.equal(
          Object.hasOwn(error, 'exportName'),
          false,
          `${label} ${action} export name`
        );
        assert.equal(
          error.message.includes('public package subpath'),
          true,
          `${label} ${action} message`
        );
        return true;
      },
      `${label} ${action} should remain unsupported`
    );
  }
}

function assertUnsupportedExports(moduleExports, entry, label) {
  for (const expectedExport of entry.unsupportedExports ?? []) {
    assertUnsupportedExport(moduleExports, entry, expectedExport, label);
  }
}

function assertPackageMetadata(packageJson, expectedPackage, packageName) {
  if (expectedPackage.packageJsonKeys) {
    assert.deepEqual(
      Object.keys(packageJson),
      expectedPackage.packageJsonKeys,
      `${packageName} package.json keys`
    );
  }

  for (const [field, expectedValue] of Object.entries(
    expectedPackage.packageMetadata ?? {}
  )) {
    assert.deepEqual(
      packageJson[field],
      expectedValue,
      `${packageName} package.json ${field}`
    );
  }
}

function assertPhysicalNoExportsSubpaths(
  surfaceManifest,
  publicResolverFiles,
  expectedPackage,
  packageName
) {
  if (!expectedPackage.physicalNoExportsSubpaths) {
    return;
  }

  assert.equal(
    surfaceManifest.exports,
    null,
    `${packageName} must keep no exports map for physical subpaths`
  );

  const physicalFiles = [
    ...new Set(
      expectedPackage.physicalNoExportsSubpaths.map((subpath) => subpath.file)
    )
  ].sort();
  assert.deepEqual(
    physicalFiles,
    publicResolverFiles,
    `${packageName} physical no-exports file set`
  );

  for (const subpath of expectedPackage.physicalNoExportsSubpaths) {
    assert.equal(
      subpath.specifier.startsWith(surfaceManifest.name),
      true,
      `${packageName} physical subpath ${subpath.specifier}`
    );
    assert.equal(
      publicResolverFiles.includes(subpath.file),
      true,
      `${packageName} physical subpath ${subpath.specifier} target`
    );
  }
}

function isIgnoredPrivateImplementationFile(relativePath) {
  return privateImplementationFileIgnorePatterns.some((pattern) =>
    pattern.test(relativePath)
  );
}

async function collectPrivateImplementationFiles(
  packageRoot,
  publicResolverFiles
) {
  const publicResolverFileSet = new Set(publicResolverFiles);
  return (await listFiles(packageRoot, resolverFilePattern)).filter(
    (relativePath) =>
      !publicResolverFileSet.has(relativePath) &&
      !isIgnoredPrivateImplementationFile(relativePath)
  );
}

async function assertPrivateImplementationFiles(
  packageRoot,
  publicResolverFiles,
  expectedPackage,
  packageName
) {
  const expectedPrivateFiles = expectedPackage.privateImplementationFiles ?? [];

  assert.deepEqual(
    [...expectedPrivateFiles].sort(),
    expectedPrivateFiles,
    `${packageName} private implementation files snapshot must stay sorted`
  );
  assert.equal(
    new Set(expectedPrivateFiles).size,
    expectedPrivateFiles.length,
    `${packageName} private implementation files snapshot must stay unique`
  );

  const actualPrivateFiles = await collectPrivateImplementationFiles(
    packageRoot,
    publicResolverFiles
  );
  assert.deepEqual(
    actualPrivateFiles,
    expectedPrivateFiles,
    `${packageName} private implementation file inventory`
  );

  for (const privateFile of expectedPrivateFiles) {
    assert.equal(
      publicResolverFiles.includes(privateFile),
      false,
      `${packageName}/${privateFile} must remain a non-public private implementation file`
    );
    await assertFileExists(
      packageRoot,
      privateFile,
      `${packageName}/${privateFile}`
    );
  }
}

function assertNoPrivateDiagnosticPublicFiles(publicResolverFiles, packageName) {
  const guards = privateDiagnosticPublicFileGuards[packageName] ?? [];
  const exactPrivateFiles = exactPrivatePublicFileGuards[packageName] ?? [];
  for (const publicFile of publicResolverFiles) {
    assert.equal(
      exactPrivateFiles.includes(publicFile),
      false,
      `${packageName}/${publicFile} must remain a direct-file-only private fixture`
    );

    for (const guard of guards) {
      assert.equal(
        guard.test(publicFile),
        false,
        `${packageName}/${publicFile} must not be a public private-diagnostic subpath`
      );
    }
  }
}

function assertNoPrivateDiagnosticExportKeys(exportsMap, packageName) {
  if (exportsMap === null) {
    return;
  }

  for (const key of Object.keys(exportsMap)) {
    if (key.startsWith('.')) {
      assert.equal(
        privateDiagnosticRuntimeExportPattern.test(key),
        false,
        `${packageName} package exports must not expose private diagnostic subpath ${key}`
      );
    }
  }
}

function loadFresh(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

async function assertRuntimeEntrypoint(packageRoot, entry, packageName) {
  const label = `${packageName}/${entry.file}`;
  const modulePath = path.join(packageRoot, entry.file);

  if (entry.error) {
    assert.throws(
      () => loadFresh(modulePath),
      (error) => {
        assertLoadError(error, entry.error, label);
        return true;
      },
      `${label} should preserve its current load failure`
    );
    return;
  }

  const moduleExports = loadFresh(modulePath);
  assert.deepEqual(Object.keys(moduleExports), expectedKeysFor(entry), label);
  assertRuntimeOwnStringKeys(moduleExports, entry, label);
  assertNoPrivateDiagnosticRuntimeExports(moduleExports, label);
  assertRuntimeEntrypointPrivateFacades(moduleExports, entry, label);
  assertPlaceholderMetadata(moduleExports, entry.metadata, label);
  assertRuntimeVersion(moduleExports, entry, label);
  assertUndefinedExports(moduleExports, entry, label);
  assertUnsupportedExports(moduleExports, entry, label);
  assertReactTestRendererRootBehavior(moduleExports, entry, label);
  assertReactTestRendererShallowBehavior(moduleExports, entry, label);
}

async function publicResolverFiles(packageRoot, packageJson) {
  if (packageJson.exports === null) {
    return listFiles(packageRoot, resolverFilePattern);
  }

  const files = collectPackageExportTargets(packageJson.exports);
  if (packageJson.main !== null) {
    assert.equal(
      packageJson.main.startsWith('./'),
      true,
      `main target ${packageJson.main} must stay package-relative`
    );
    files.add(packageJson.main.slice(2));
  }

  return [...files].sort();
}

const actualPackageDirectories = (
  await readdir(packagesRoot, { withFileTypes: true })
)
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

assert.deepEqual(
  actualPackageDirectories,
  snapshot.packageDirectories,
  'guarded package directories'
);

for (const packageName of snapshot.packageDirectories) {
  const expectedPackage = snapshot.packages[packageName];
  const packageRoot = path.join(packagesRoot, packageName);
  const packageJson = JSON.parse(
    await readFile(path.join(packageRoot, 'package.json'), 'utf8')
  );
  const surfaceManifest = manifestSurface(packageJson);

  assertPackageMetadata(packageJson, expectedPackage, packageName);

  assert.deepEqual(
    surfaceManifest,
    expectedPackage.manifest,
    `${packageName} package.json public surface`
  );
  assertNoPrivateDiagnosticExportKeys(surfaceManifest.exports, packageName);

  const actualPublicFiles = await publicResolverFiles(
    packageRoot,
    surfaceManifest
  );
  assert.deepEqual(
    actualPublicFiles,
    expectedPackage.publicResolverFiles,
    `${packageName} public resolver files`
  );
  assertNoPrivateDiagnosticPublicFiles(actualPublicFiles, packageName);
  await assertPrivateImplementationFiles(
    packageRoot,
    actualPublicFiles,
    expectedPackage,
    packageName
  );
  assertPhysicalNoExportsSubpaths(
    surfaceManifest,
    actualPublicFiles,
    expectedPackage,
    packageName
  );

  for (const publicFile of expectedPackage.publicResolverFiles) {
    await assertFileExists(
      packageRoot,
      publicFile,
      `${packageName}/${publicFile}`
    );
  }

  assert.deepEqual(
    await listFiles(packageRoot, declarationFilePattern),
    expectedPackage.declarationFiles,
    `${packageName} declaration files`
  );

  for (const entry of expectedPackage.runtimeEntrypoints) {
    await assertRuntimeEntrypoint(packageRoot, entry, packageName);
  }
}

const nativePackageJson = JSON.parse(
  await readFile(path.join(nativePackageRoot, 'package.json'), 'utf8')
);
const nativeSurfaceManifest = manifestSurface(nativePackageJson);
assertPackageMetadata(nativePackageJson, expectedNativePackage, 'native');
assert.deepEqual(
  nativeSurfaceManifest,
  expectedNativePackage.manifest,
  'native package.json public surface'
);
assertNoPrivateDiagnosticExportKeys(nativeSurfaceManifest.exports, 'native');

const nativePublicFiles = await publicResolverFiles(
  nativePackageRoot,
  nativeSurfaceManifest
);
assert.deepEqual(
  nativePublicFiles,
  expectedNativePackage.publicResolverFiles,
  'native public resolver files'
);
assertNoPrivateDiagnosticPublicFiles(nativePublicFiles, 'native');
await assertPrivateImplementationFiles(
  nativePackageRoot,
  nativePublicFiles,
  expectedNativePackage,
  'native'
);

for (const publicFile of expectedNativePackage.publicResolverFiles) {
  await assertFileExists(nativePackageRoot, publicFile, `native/${publicFile}`);
}

assert.deepEqual(
  await listFiles(nativePackageRoot, declarationFilePattern),
  expectedNativePackage.declarationFiles,
  'native declaration files'
);

const nativeRuntime = loadFresh(path.join(nativePackageRoot, 'index.cjs'));
assert.deepEqual(Object.keys(nativeRuntime), nativeRuntimeKeys, 'native/index.cjs');
assertNoPrivateDiagnosticRuntimeExports(
  nativeRuntime,
  'native/index.cjs',
  acceptedNativeDiagnosticRuntimeKeys
);
assertNativePackageDiagnosticSurface(nativeRuntime);

console.log('package surface snapshot guard passed');
