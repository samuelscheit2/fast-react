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

const currentnessReport =
  reactGate.createPublicReactActBlockedCurrentnessReport();
assert.equal(
  reactGate.isAcceptedPublicReactActBlockedCurrentnessReport(
    currentnessReport
  ),
  true
);
const currentnessConsumption =
  reactGate.consumePublicReactActBlockedCurrentnessReport(
    currentnessReport
  );
assert.equal(
  currentnessConsumption.status,
  reactGate.publicReactActBlockedCurrentnessConsumptionStatus
);
assert.equal(
  currentnessConsumption.currentnessStatus,
  reactGate.publicReactActBlockedCurrentnessStatus
);
assert.deepEqual(currentnessConsumption.scenarioIds, [
  "rootless-sync-callback",
  "rootless-async-callback",
  "rootless-error-callback",
  "rootless-thenable-callback"
]);
assert.equal(currentnessConsumption.publicActUnsupportedPlaceholder, true);
assert.equal(currentnessConsumption.callbackInvocationBlocked, true);
assert.equal(currentnessConsumption.thenableReturnBlocked, true);
assert.equal(currentnessConsumption.reactServerActExportBlocked, true);
assert.equal(currentnessConsumption.publicWarningCompatibilityClaimed, false);
assert.equal(
  currentnessConsumption.publicActWarningCompatibilityClaimed,
  false
);
assert.equal(currentnessConsumption.queueFlushingReady, false);
assert.equal(currentnessConsumption.rendererRootsReady, false);
assert.equal(currentnessConsumption.passiveEffectsReady, false);
assert.equal(currentnessConsumption.continuationFlushingReady, false);
assert.equal(currentnessConsumption.drainsPublicReactActQueue, false);
assert.equal(currentnessConsumption.publicActPassiveDrain, false);
assert.equal(currentnessConsumption.publicEffectExecution, false);
assert.equal(currentnessConsumption.publicRootExecution, false);
assert.equal(currentnessConsumption.executesRendererRoots, false);
assert.deepEqual(currentnessConsumption.acceptedBackgroundWorkerIds, [
  "worker-857-react-dom-act-passive-consumer",
  "worker-885-react-act-lifecycle-boundary-gate"
]);
assert.deepEqual(currentnessConsumption.excludedWorkerIds, [
  "worker-902-react-test-renderer-private-act-lifecycle"
]);
assert.equal(
  currentnessConsumption.privatePrerequisites.consumesWorker902Evidence,
  false
);
assert.equal(
  currentnessConsumption.privatePrerequisites
    .schedulerDrivenPassiveEffectDiagnosticsReady,
  true
);
assert.equal(
  currentnessConsumption.privatePrerequisites
    .requiresSourceOwnedActiveLifecycleRequestBoundary,
  true
);
assert.equal(currentnessReport.publicActExport.value.type, "function");
assert.equal(currentnessReport.publicActExport.value.name, "act");
assert.equal(currentnessReport.publicActExport.value.length, 0);
assert.deepEqual(currentnessReport.reactServerAct, {
  hasOwn: false,
  exportKeysInclude: false,
  value: {
    type: "undefined"
  }
});

for (const scenario of currentnessReport.scenarios) {
  assert.equal(scenario.rootless, true, scenario.scenarioId);
  assert.equal(scenario.callbackInvoked, false, scenario.scenarioId);
  assert.equal(scenario.returnedThenable, false, scenario.scenarioId);
  assert.equal(scenario.consoleCalls.length, 0, scenario.scenarioId);
  assert.equal(
    scenario.publicWarningCompatibilityClaimed,
    false,
    scenario.scenarioId
  );
  assert.equal(
    scenario.publicReactActCompatibilityClaimed,
    false,
    scenario.scenarioId
  );
  assert.equal(scenario.callAttempt.status, "throws", scenario.scenarioId);
  assert.equal(
    scenario.callAttempt.error.name,
    "FastReactUnimplementedError",
    scenario.scenarioId
  );
  assert.equal(
    scenario.callAttempt.error.code,
    "FAST_REACT_UNIMPLEMENTED",
    scenario.scenarioId
  );
  assert.equal(scenario.callAttempt.error.exportName, "act", scenario.scenarioId);
}

assertCurrentnessRejected(
  Object.freeze({
    ...currentnessReport
  }),
  "public-react-act-currentness-source-proof"
);
assertCurrentnessRejected(
  reactGate.createPublicReactActBlockedCurrentnessReport({
    publicReactActCompatibilityClaimed: true
  }),
  "public-react-act-currentness-public-claim"
);
assertCurrentnessRejected(
  reactGate.createPublicReactActBlockedCurrentnessReport({
    scenarios: replaceCurrentnessScenario(currentnessReport, 0, {
      callbackInvoked: true
    })
  }),
  "public-react-act-currentness-callback-invoked"
);
assertCurrentnessRejected(
  reactGate.createPublicReactActBlockedCurrentnessReport({
    scenarios: replaceCurrentnessScenario(currentnessReport, 3, {
      callAttempt: {
        status: "ok",
        value: {
          type: "object",
          thenable: true
        }
      },
      returnedThenable: true
    })
  }),
  "public-react-act-currentness-thenable-returned"
);
assertCurrentnessRejected(
  reactGate.createPublicReactActBlockedCurrentnessReport({
    rendererRootsReady: true
  }),
  "public-react-act-currentness-prerequisite-smuggling"
);
assertCurrentnessRejected(
  reactGate.createPublicReactActBlockedCurrentnessReport({
    privatePrerequisites: {
      ...currentnessReport.privatePrerequisites,
      consumesWorker902Evidence: true
    }
  }),
  "public-react-act-currentness-private-prerequisite-boundary"
);
assertCurrentnessRejected(
  reactGate.createPublicReactActBlockedCurrentnessReport({
    publicWarningCompatibilityClaimed: true
  }),
  "public-react-act-currentness-warning-compatibility-claim"
);
assertCurrentnessRejected(
  reactGate.createPublicReactActBlockedCurrentnessReport({
    reactServerAct: {
      hasOwn: true,
      exportKeysInclude: true,
      value: {
        type: "function",
        name: "act",
        length: 1,
        thenable: false
      }
    }
  }),
  "public-react-act-currentness-react-server-act-export"
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

function assertCurrentnessRejected(report, reason) {
  assert.equal(
    reactGate.isAcceptedPublicReactActBlockedCurrentnessReport(report),
    false,
    reason
  );
  assert.throws(
    () => reactGate.consumePublicReactActBlockedCurrentnessReport(report),
    (error) => {
      assert.equal(error.name, "FastReactUnimplementedError");
      assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
      assert.equal(error.entrypoint, "react");
      assert.equal(
        error.exportName,
        "__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__.consumePublicReactActBlockedCurrentnessReport"
      );
      assert.equal(error.compatibilityTarget, "react@19.2.6");
      assert.equal(error.reason, reason);
      assert.equal(error.publicReactActCompatibilityClaimed, false);
      assert.equal(error.publicWarningCompatibilityClaimed, false);
      assert.equal(error.drainsPublicReactActQueue, false);
      assert.equal(error.invokesCallback, false);
      assert.equal(error.returnsThenable, false);
      assert.equal(error.executesRendererRoots, false);
      return true;
    },
    reason
  );
}

function replaceCurrentnessScenario(report, index, overrides) {
  return report.scenarios.map((scenario, scenarioIndex) =>
    scenarioIndex === index
      ? {
          ...scenario,
          ...overrides
        }
      : scenario
  );
}
