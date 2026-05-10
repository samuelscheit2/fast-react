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
const snapshotPath = path.join(
  repoRoot,
  'tests',
  'smoke',
  'package-surface-snapshot.json'
);

process.env.NODE_ENV = 'development';

const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));

const resolverFilePattern = /\.(?:js|json|node)$/;
const declarationFilePattern = /\.(?:d\.ts|d\.mts|d\.cts)$/;
const allowedRuntimeMetadataKeys = new Set([
  '__FAST_REACT_ENTRYPOINT__',
  '__FAST_REACT_PLACEHOLDER__',
  'compatibilityTarget'
]);
const privateDiagnosticRuntimeExportPattern =
  /(?:private|diagnostic|diagnostics|gate|bridge|dispatcher|metadata|route|routes|secret)/iu;
const privateDiagnosticPublicFileGuards = {
  react: [
    /(?:^|\/)(?:.*act.*dispatcher.*|.*act.*queue.*|.*dispatcher.*|.*diagnostic.*|.*gate.*|.*metadata.*|.*private.*|.*route.*|.*secret.*)\.(?:js|json|node)$/iu
  ],
  'react-dom': [
    /(?:^|\/)(?:.*diagnostic.*|.*gate.*|.*metadata.*|.*private.*|.*root-bridge.*|.*route.*|.*secret.*)\.(?:js|json|node)$/iu,
    /^src\//u
  ],
  'react-test-renderer': [
    /(?:^|\/)(?:.*diagnostic.*|.*gate.*|.*metadata.*|.*private.*|.*route.*|.*secret.*)\.(?:js|json|node)$/iu,
    /^src\//u
  ],
  scheduler: [
    /(?:^|\/)(?:.*diagnostic.*|.*flush-helper.*|.*gate.*|.*metadata.*|.*private.*|.*react-test-renderer.*helper.*|.*secret.*)\.(?:js|json|node)$/iu,
    /^src\//u
  ]
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

function assertNoPrivateDiagnosticRuntimeExports(moduleExports, label) {
  if (
    moduleExports === null ||
    (typeof moduleExports !== 'object' && typeof moduleExports !== 'function')
  ) {
    return;
  }

  for (const key of Reflect.ownKeys(moduleExports)) {
    if (typeof key !== 'string' || allowedRuntimeMetadataKeys.has(key)) {
      continue;
    }

    assert.equal(
      privateDiagnosticRuntimeExportPattern.test(key),
      false,
      `${label} must not expose private diagnostic export ${key}`
    );
  }
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

function assertNoPrivateDiagnosticPublicFiles(publicResolverFiles, packageName) {
  const guards = privateDiagnosticPublicFileGuards[packageName] ?? [];
  for (const publicFile of publicResolverFiles) {
    for (const guard of guards) {
      assert.equal(
        guard.test(publicFile),
        false,
        `${packageName}/${publicFile} must not be a public private-diagnostic subpath`
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
  assertNoPrivateDiagnosticRuntimeExports(moduleExports, label);
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

console.log('package surface snapshot guard passed');
