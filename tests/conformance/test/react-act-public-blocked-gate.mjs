import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const React = require("../../../packages/react/index.js");
const reactGate = require("../../../packages/react/private-act-dispatcher-gate.js");
const domTestUtilsGate = require(
  "../../../packages/react-dom/src/test-utils-act-gate.js"
).evaluateReactDomTestUtilsActPrivateRoutingGate();

let callbackInvoked = false;

assert.throws(
  () =>
    React.act(() => {
      callbackInvoked = true;
    }),
  (error) => {
    assert.equal(error.name, "FastReactUnimplementedError");
    assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
    assert.equal(error.entrypoint, "react");
    assert.equal(error.exportName, "act");
    assert.equal(error.compatibilityTarget, "react@19.2.6");
    return true;
  }
);
assert.equal(callbackInvoked, false);

assert.equal(reactGate.publicReactActCompatibilityClaimed, false);
assert.equal(reactGate.queueFlushingReady, false);
assert.equal(reactGate.rendererRootsReady, false);
assert.equal(reactGate.passiveEffectsReady, false);
assert.equal(reactGate.continuationFlushingReady, false);
assert.equal(
  reactGate.requiresSourceOwnedActiveLifecycleRequestBoundary,
  true
);
assert.deepEqual(
  reactGate.acceptedSchedulerDrivenPassiveLifecycleBoundaryRecords,
  [
    "FastReactDomPrivateRootPublicFacadeLifecycleContainerSnapshotRecord",
    "FastReactDomPrivateRootCreateRecord",
    "FastReactDomPrivateRootUpdateRecord"
  ]
);

const schedulerDrivenPassive =
  domTestUtilsGate.privateSchedulerDrivenPassiveEffectDiagnostics;

assert.equal(domTestUtilsGate.publicReactActReady, false);
assert.equal(domTestUtilsGate.publicTestUtilsActReady, false);
assert.equal(domTestUtilsGate.sideEffectPolicy.invokesActCallback, false);
assert.equal(domTestUtilsGate.sideEffectPolicy.executesPassiveEffects, false);
assert.equal(domTestUtilsGate.sideEffectPolicy.executesRendererRoots, false);
assert.equal(
  schedulerDrivenPassive.requiresSourceOwnedActiveLifecycleRequestBoundary,
  true
);
assert.equal(schedulerDrivenPassive.consumesRootLifecycleRequestBoundary, true);
assert.equal(schedulerDrivenPassive.validatesLifecycleRequestEntrypoint, true);
assert.equal(schedulerDrivenPassive.currentRootBoundWork, true);
assert.equal(schedulerDrivenPassive.publicActPassiveDrain, false);
assert.equal(schedulerDrivenPassive.publicRootExecution, false);
assert.equal(schedulerDrivenPassive.executesPassiveEffects, false);
assert.equal(schedulerDrivenPassive.compatibilityClaimed, false);
