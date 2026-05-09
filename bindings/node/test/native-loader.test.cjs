'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');
const native = require('../index.cjs');
const packageJson = require('../package.json');

assert.equal(native.packageName, '@fast-react/native');
assert.equal(native.bindingStatus, 'placeholder');
assert.equal(native.nativeAddonName, 'fast_react_napi');
assert.equal(native.nodeApiVersionFloor, 8);
assert.equal(native.supportedNodeEngineRange, '>=22.0.0');
assert.equal(packageJson.engines.node, native.supportedNodeEngineRange);
assert.ok(Object.isFrozen(native.platformPackages));
assert.ok(Object.isFrozen(native.supportedNativeTargets));

const darwinPlan = native.getNativeBindingLoadPlan({
  platform: 'darwin',
  arch: 'arm64'
});

assert.equal(darwinPlan.nativeTarget, 'darwin-arm64');
assert.equal(
  darwinPlan.platformPackageName,
  '@fast-react/native-darwin-arm64'
);
assert.equal(darwinPlan.nativeFileName, 'fast_react_napi.darwin-arm64.node');
assert.deepEqual(darwinPlan.candidateSpecifiers, [
  '@fast-react/native-darwin-arm64',
  '@fast-react/native-darwin-arm64/fast_react_napi.darwin-arm64.node'
]);
assert.ok(Object.isFrozen(darwinPlan));
assert.ok(Object.isFrozen(darwinPlan.candidateSpecifiers));

const linuxMuslPlan = native.getNativeBindingLoadPlan({
  platform: 'linux',
  arch: 'x64',
  libc: 'musl'
});

assert.equal(linuxMuslPlan.nativeTarget, 'linux-x64-musl');
assert.equal(
  linuxMuslPlan.platformPackageName,
  '@fast-react/native-linux-x64-musl'
);

const unsupportedPlan = native.getNativeBindingLoadPlan({
  platform: 'freebsd',
  arch: 'x64'
});

assert.equal(unsupportedPlan.nativeTarget, null);
assert.equal(unsupportedPlan.platformPackageName, null);
assert.deepEqual(unsupportedPlan.candidateSpecifiers, []);

assert.throws(
  () => native.loadNativeBinding({ platform: 'freebsd', arch: 'x64' }),
  (error) => {
    assert.equal(error.name, 'FastReactNativeBindingUnavailableError');
    assert.equal(error.code, native.unavailableErrorCode);
    assert.equal(error.nativeTarget, null);
    assert.match(error.message, /not implemented/);
    assert.match(error.message, /supportedTargets=/);
    return true;
  }
);

const originalLoad = Module._load;
const attemptedPlatformLoads = [];

Module._load = function patchedModuleLoad(request, parent, isMain) {
  if (String(request).startsWith('@fast-react/native-')) {
    attemptedPlatformLoads.push(request);
  }

  return originalLoad.call(this, request, parent, isMain);
};

try {
  assert.throws(
    () => native.loadNativeBinding({ platform: 'darwin', arch: 'arm64' }),
    (error) => {
      assert.equal(error.name, 'FastReactNativeBindingUnavailableError');
      assert.equal(error.code, native.unavailableErrorCode);
      assert.equal(error.packageName, '@fast-react/native');
      assert.equal(error.nativeTarget, 'darwin-arm64');
      assert.equal(
        error.platformPackageName,
        '@fast-react/native-darwin-arm64'
      );
      assert.equal(
        error.nativeFileName,
        'fast_react_napi.darwin-arm64.node'
      );
      assert.deepEqual(error.loadPlan, darwinPlan);
      assert.match(error.message, /@fast-react\/native-darwin-arm64/);
      assert.match(error.message, /fast_react_napi\.darwin-arm64\.node/);
      return true;
    }
  );
} finally {
  Module._load = originalLoad;
}

assert.deepEqual(
  attemptedPlatformLoads,
  [],
  'placeholder loader must not attempt platform package loading yet'
);

console.log('Fast React native CJS loader placeholder checks passed.');
