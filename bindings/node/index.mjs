import cjsBinding from './index.cjs';

export const {
  FastReactNativeBindingUnavailableError,
  bindingStatus,
  getNativeBindingLoadPlan,
  loadNativeBinding,
  nativeAddonName,
  nodeApiVersionFloor,
  packageName,
  platformPackages,
  supportedNativeTargets,
  supportedNodeEngineRange,
  unavailableErrorCode
} = cjsBinding;

export default cjsBinding;
