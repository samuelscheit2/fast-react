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
const reactPackageRoot = path.join(repoRoot, 'packages', 'react');

const entrypoints = [
  ['.', 'index.js'],
  ['./jsx-runtime', 'jsx-runtime.js'],
  ['./jsx-dev-runtime', 'jsx-dev-runtime.js'],
  ['./compiler-runtime', 'compiler-runtime.js']
];

function isMissingPackage(error, specifier) {
  return (
    error?.code === 'MODULE_NOT_FOUND' &&
    typeof error.message === 'string' &&
    error.message.includes(specifier)
  );
}

for (const [subpath, fileName] of entrypoints) {
  const absolutePath = path.join(reactPackageRoot, fileName);
  const cjsModule = require(absolutePath);
  assert.equal(
    typeof cjsModule,
    'object',
    `${subpath} should require as an object`
  );

  const esmModule = await import(pathToFileURL(absolutePath).href);
  assert.ok(esmModule.default, `${subpath} should import through ESM`);
}

for (const [subpath] of entrypoints) {
  const specifier =
    subpath === '.' ? '@fast-react/react' : `@fast-react/react/${subpath.slice(2)}`;

  try {
    const cjsModule = require(specifier);
    assert.equal(
      typeof cjsModule,
      'object',
      `${specifier} should require as an object`
    );

    const esmModule = await import(specifier);
    assert.ok(esmModule.default, `${specifier} should import through ESM`);
  } catch (error) {
    if (!isMissingPackage(error, '@fast-react/react')) {
      throw error;
    }
  }
}

const react = require(path.join(reactPackageRoot, 'index.js'));
const jsxRuntime = require(path.join(reactPackageRoot, 'jsx-runtime.js'));
const jsxDevRuntime = require(path.join(reactPackageRoot, 'jsx-dev-runtime.js'));
const compilerRuntime = require(path.join(reactPackageRoot, 'compiler-runtime.js'));

assert.equal(react.__FAST_REACT_PLACEHOLDER__, true);
assert.equal(react.compatibilityTarget, 'react@19.2.6');
assert.equal(typeof react.createElement, 'function');
assert.throws(() => react.createElement('div'), /not implemented/);

assert.equal(typeof jsxRuntime.jsx, 'function');
assert.throws(() => jsxRuntime.jsx('div', {}), /not implemented/);

assert.equal(typeof jsxDevRuntime.jsxDEV, 'function');
assert.throws(() => jsxDevRuntime.jsxDEV('div', {}), /not implemented/);

assert.equal(typeof compilerRuntime.c, 'function');
assert.throws(() => compilerRuntime.c(0), /not implemented/);

console.log('Fast React placeholder entrypoints import successfully.');
