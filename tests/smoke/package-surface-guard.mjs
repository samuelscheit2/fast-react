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

  if (Object.hasOwn(expected, 'message')) {
    assert.equal(error.message, expected.message, `${label} error message`);
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
  assertPlaceholderMetadata(moduleExports, entry.metadata, label);
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

  assert.deepEqual(
    surfaceManifest,
    expectedPackage.manifest,
    `${packageName} package.json public surface`
  );

  const actualPublicFiles = await publicResolverFiles(packageRoot, surfaceManifest);
  assert.deepEqual(
    actualPublicFiles,
    expectedPackage.publicResolverFiles,
    `${packageName} public resolver files`
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
