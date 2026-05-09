import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import nativeDefault, {
  FastReactNativeBindingUnavailableError,
  bindingStatus,
  getNativeBindingLoadPlan,
  loadNativeBinding,
  nativeAddonName,
  nativeBindingManifest,
  nativeTargetMatrix,
  packageName,
  platformArtifactPolicy,
  platformPackages,
  supportedNativeTargets,
  unavailableErrorCode
} from '../index.mjs';

const require = createRequire(import.meta.url);
const cjsBinding = require('../index.cjs');

assert.equal(nativeDefault, cjsBinding);
assert.equal(
  FastReactNativeBindingUnavailableError,
  cjsBinding.FastReactNativeBindingUnavailableError
);
assert.equal(bindingStatus, 'placeholder');
assert.equal(packageName, '@fast-react/native');
assert.equal(nativeAddonName, 'fast_react_napi');
assert.equal(nativeBindingManifest, cjsBinding.nativeBindingManifest);
assert.equal(nativeTargetMatrix, cjsBinding.nativeTargetMatrix);
assert.equal(getNativeBindingLoadPlan, cjsBinding.getNativeBindingLoadPlan);
assert.equal(loadNativeBinding, cjsBinding.loadNativeBinding);
assert.equal(platformArtifactPolicy, cjsBinding.platformArtifactPolicy);
assert.equal(platformPackages, cjsBinding.platformPackages);
assert.equal(supportedNativeTargets, cjsBinding.supportedNativeTargets);
assert.equal(unavailableErrorCode, cjsBinding.unavailableErrorCode);

const plan = getNativeBindingLoadPlan({
  platform: 'win32',
  arch: 'x64'
});

assert.equal(plan.nativeTarget, 'win32-x64-msvc');
assert.equal(plan.platformPackageName, '@fast-react/native-win32-x64-msvc');

assert.throws(
  () => loadNativeBinding({ platform: 'win32', arch: 'x64' }),
  FastReactNativeBindingUnavailableError
);

console.log('Fast React native ESM loader placeholder checks passed.');
