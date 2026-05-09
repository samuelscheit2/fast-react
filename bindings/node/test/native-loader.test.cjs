'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');
const native = require('../index.cjs');
const packageJson = require('../package.json');

const expectedNativeTargetMatrix = [
  {
    target: 'darwin-arm64',
    platform: 'darwin',
    arch: 'arm64',
    libc: null,
    toolchain: null,
    optionalPackageName: '@fast-react/native-darwin-arm64',
    nativeFileName: 'fast_react_napi.darwin-arm64.node'
  },
  {
    target: 'darwin-x64',
    platform: 'darwin',
    arch: 'x64',
    libc: null,
    toolchain: null,
    optionalPackageName: '@fast-react/native-darwin-x64',
    nativeFileName: 'fast_react_napi.darwin-x64.node'
  },
  {
    target: 'linux-arm64-gnu',
    platform: 'linux',
    arch: 'arm64',
    libc: 'gnu',
    toolchain: null,
    optionalPackageName: '@fast-react/native-linux-arm64-gnu',
    nativeFileName: 'fast_react_napi.linux-arm64-gnu.node'
  },
  {
    target: 'linux-arm64-musl',
    platform: 'linux',
    arch: 'arm64',
    libc: 'musl',
    toolchain: null,
    optionalPackageName: '@fast-react/native-linux-arm64-musl',
    nativeFileName: 'fast_react_napi.linux-arm64-musl.node'
  },
  {
    target: 'linux-x64-gnu',
    platform: 'linux',
    arch: 'x64',
    libc: 'gnu',
    toolchain: null,
    optionalPackageName: '@fast-react/native-linux-x64-gnu',
    nativeFileName: 'fast_react_napi.linux-x64-gnu.node'
  },
  {
    target: 'linux-x64-musl',
    platform: 'linux',
    arch: 'x64',
    libc: 'musl',
    toolchain: null,
    optionalPackageName: '@fast-react/native-linux-x64-musl',
    nativeFileName: 'fast_react_napi.linux-x64-musl.node'
  },
  {
    target: 'win32-arm64-msvc',
    platform: 'win32',
    arch: 'arm64',
    libc: null,
    toolchain: 'msvc',
    optionalPackageName: '@fast-react/native-win32-arm64-msvc',
    nativeFileName: 'fast_react_napi.win32-arm64-msvc.node'
  },
  {
    target: 'win32-x64-msvc',
    platform: 'win32',
    arch: 'x64',
    libc: null,
    toolchain: 'msvc',
    optionalPackageName: '@fast-react/native-win32-x64-msvc',
    nativeFileName: 'fast_react_napi.win32-x64-msvc.node'
  }
];

const expectedPlatformPackages = Object.fromEntries(
  expectedNativeTargetMatrix.map((target) => [
    target.target,
    target.optionalPackageName
  ])
);

const expectedPackageExports = {
  '.': {
    import: './index.mjs',
    require: './index.cjs',
    default: './index.mjs'
  },
  './package.json': './package.json'
};

assert.equal(native.packageName, '@fast-react/native');
assert.equal(native.bindingStatus, 'placeholder');
assert.equal(native.nativeAddonName, 'fast_react_napi');
assert.equal(native.nodeApiVersionFloor, 8);
assert.equal(native.supportedNodeEngineRange, '>=22.0.0');
assert.equal(native.platformArtifactPolicy, 'future per-platform optional npm packages; no native addon is built or loaded yet');
assert.equal(native.optionalPackagePrefix, '@fast-react/native-');
assert.equal(packageJson.name, native.packageName);
assert.equal(packageJson.type, 'module');
assert.equal(packageJson.main, './index.cjs');
assert.deepEqual(packageJson.exports, expectedPackageExports);
assert.equal(packageJson.engines.node, native.supportedNodeEngineRange);
assert.equal(packageJson.scripts.build, 'cargo build -p fast-react-napi');
assert.equal(
  packageJson.scripts.check,
  'node ./test/native-loader.test.cjs && node ./test/native-no-load-guard.test.cjs && node ./test/native-loader-esm.test.mjs'
);
for (const lifecycleScript of ['preinstall', 'install', 'postinstall', 'prepare']) {
  assert.equal(
    packageJson.scripts[lifecycleScript],
    undefined,
    `${lifecycleScript} must not create an install-time native build/download path`
  );
}
for (const dependencyField of [
  'dependencies',
  'optionalDependencies',
  'devDependencies',
  'bundleDependencies',
  'bundledDependencies'
]) {
  assert.equal(
    packageJson[dependencyField],
    undefined,
    `${dependencyField} must stay absent while the binding is a placeholder`
  );
}
assert.ok(Object.isFrozen(native.platformPackages));
assert.ok(Object.isFrozen(native.supportedNativeTargets));
assert.ok(Object.isFrozen(native.nativeTargetMatrix));
assert.ok(Object.isFrozen(native.nativeBindingManifest));
assert.deepEqual(native.nativeTargetMatrix, expectedNativeTargetMatrix);
assert.deepEqual(
  native.supportedNativeTargets,
  expectedNativeTargetMatrix.map((target) => target.target)
);
assert.deepEqual(native.platformPackages, expectedPlatformPackages);
assert.equal(native.nativeBindingManifest.nativeTargetMatrix, native.nativeTargetMatrix);
assert.equal(native.nativeBindingManifest.platformPackages, native.platformPackages);
assert.equal(
  native.nativeBindingManifest.supportedNativeTargets,
  native.supportedNativeTargets
);
assert.equal(native.nativeBindingManifest.nodeApiVersionFloor, native.nodeApiVersionFloor);
assert.equal(
  native.nativeBindingManifest.supportedNodeEngineRange,
  native.supportedNodeEngineRange
);
for (const target of native.nativeTargetMatrix) {
  assert.ok(Object.isFrozen(target));
}

for (const expectedTarget of expectedNativeTargetMatrix) {
  const plan = native.getNativeBindingLoadPlan({
    platform: expectedTarget.platform,
    arch: expectedTarget.arch,
    libc: expectedTarget.libc
  });

  assert.equal(plan.nativeTarget, expectedTarget.target);
  assert.deepEqual(plan.nativeTargetMetadata, expectedTarget);
  assert.equal(plan.platformPackageName, expectedTarget.optionalPackageName);
  assert.equal(plan.nativeFileName, expectedTarget.nativeFileName);
  assert.equal(plan.nodeApiVersionFloor, native.nodeApiVersionFloor);
  assert.equal(plan.supportedNodeEngineRange, native.supportedNodeEngineRange);
  assert.equal(plan.platformArtifactPolicy, native.platformArtifactPolicy);
  assert.deepEqual(plan.candidateSpecifiers, [
    expectedTarget.optionalPackageName,
    `${expectedTarget.optionalPackageName}/${expectedTarget.nativeFileName}`
  ]);
}

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

const linuxGnuPlan = native.getNativeBindingLoadPlan({
  platform: 'linux',
  arch: 'arm64',
  libc: 'glibc'
});

assert.equal(linuxGnuPlan.nativeTarget, 'linux-arm64-gnu');
assert.equal(linuxGnuPlan.nativeTargetMetadata.libc, 'gnu');
assert.equal(
  linuxGnuPlan.platformPackageName,
  '@fast-react/native-linux-arm64-gnu'
);

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
      assert.equal(error.bindingStatus, 'placeholder');
      assert.equal(error.nodeApiVersionFloor, 8);
      assert.equal(error.supportedNodeEngineRange, '>=22.0.0');
      assert.match(error.reason, /not built or loaded/);
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
