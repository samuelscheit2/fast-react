'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');

const forbiddenLoads = [];
const originalLoad = Module._load;
const originalNodeExtension = Module._extensions['.node'];

function isForbiddenLoad(request) {
  const specifier = String(request);
  return (
    specifier.endsWith('.node') ||
    specifier.startsWith('@fast-react/native-') ||
    specifier === 'child_process' ||
    specifier === 'node:child_process' ||
    specifier === 'http' ||
    specifier === 'node:http' ||
    specifier === 'https' ||
    specifier === 'node:https'
  );
}

function blockForbiddenLoad(kind, request) {
  const attemptedLoad = { kind, request: String(request) };
  forbiddenLoads.push(attemptedLoad);
  const error = new Error(
    `Forbidden native placeholder load attempted: ${attemptedLoad.request}`
  );
  error.attemptedLoad = attemptedLoad;
  throw error;
}

Module._extensions['.node'] = function blockedNodeExtension(module, filename) {
  blockForbiddenLoad('node-extension', filename);
};

Module._load = function guardedModuleLoad(request, parent, isMain) {
  if (isForbiddenLoad(request)) {
    blockForbiddenLoad('module-load', request);
  }

  return originalLoad.call(this, request, parent, isMain);
};

async function main() {
  try {
    const native = require('../index.cjs');

    assert.equal(native.bindingStatus, 'placeholder');
    assert.equal(native.nativeBindingManifest.status, 'placeholder');
    assert.deepEqual(
      native.getNativeBindingLoadPlan({
        platform: 'linux',
        arch: 'x64',
        libc: 'musl'
      }).candidateSpecifiers,
      [
        '@fast-react/native-linux-x64-musl',
        '@fast-react/native-linux-x64-musl/fast_react_napi.linux-x64-musl.node'
      ]
    );
    assert.throws(
      () =>
        native.loadNativeBinding({
          platform: 'linux',
          arch: 'x64',
          libc: 'musl'
        }),
      native.FastReactNativeBindingUnavailableError
    );

    const esmNative = await import('../index.mjs');
    assert.equal(esmNative.default, native);
    assert.equal(esmNative.nativeBindingManifest, native.nativeBindingManifest);
  } finally {
    Module._load = originalLoad;
    Module._extensions['.node'] = originalNodeExtension;
  }

  assert.deepEqual(
    forbiddenLoads,
    [],
    'placeholder imports and loadNativeBinding() must not load native artifacts, platform packages, child_process, or network modules'
  );

  console.log('Fast React native no-load guard checks passed.');
}

main().catch((error) => {
  Module._load = originalLoad;
  Module._extensions['.node'] = originalNodeExtension;
  console.error(error);
  process.exitCode = 1;
});
