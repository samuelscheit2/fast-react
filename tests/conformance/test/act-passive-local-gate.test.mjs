import assert from "node:assert/strict";
import test from "node:test";

import {
  ACT_PASSIVE_LOCAL_GATE_QUEUE_WORKERS,
  ACT_PASSIVE_LOCAL_GATE_STATUS,
  ACT_PASSIVE_LOCAL_GATE_VIOLATION_STATUS,
  evaluateActPassiveLocalGate,
  readPassiveTimingCanaryManifest
} from "../src/act-passive-local-gate.mjs";

test("act/passive local gate recognizes accepted queue diagnostics without public compatibility", () => {
  const gate = evaluateActPassiveLocalGate();

  assert.equal(gate.status, ACT_PASSIVE_LOCAL_GATE_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.queueWorkers, ACT_PASSIVE_LOCAL_GATE_QUEUE_WORKERS);
  assert.deepEqual(gate.recognizedWorkerIds, ACT_PASSIVE_LOCAL_GATE_QUEUE_WORKERS);
  assert.deepEqual(gate.publicCompatibilityViolationIds, []);

  for (const diagnostic of gate.diagnostics) {
    assert.equal(diagnostic.recognized, true, diagnostic.workerId);
    assert.equal(diagnostic.compatibilityClaimed, false, diagnostic.workerId);
    assert.ok(diagnostic.acceptedDiagnosticIds.length > 0, diagnostic.workerId);
  }

  const passiveDrain =
    gate.diagnosticsByWorker[
      "worker-473-test-renderer-act-passive-effect-drain"
    ];
  assert.deepEqual(passiveDrain.acceptedDiagnosticIds, [
    "passive-effect-flush-metadata",
    "sync-flush-post-passive-private-execution-metadata",
    "passive-effects-flush-with-sync-flush-continuation-result"
  ]);
  assert.equal(passiveDrain.publicActCompatibilityClaimed, false);
  assert.equal(passiveDrain.publicPassiveEffectExecution, false);

  const mountUnmount =
    gate.diagnosticsByWorker[
      "worker-474-passive-effect-mount-unmount-execution-gate"
    ];
  assert.equal(mountUnmount.publicEffectExecutionEnabled, false);
  assert.equal(mountUnmount.schedulerDrivenPassiveExecutionEnabled, false);
  assert.ok(
    mountUnmount.acceptedDiagnosticIds.includes(
      "invoke_passive_effect_callbacks_under_test_control"
    )
  );
  assert.deepEqual(mountUnmount.optionalFutureDiagnosticIds, [
    "PassiveEffectMountCreateCallbackExecutionRecord",
    "PassiveEffectMountCreateCallbackErrorRecord"
  ]);

  const errorRouting =
    gate.diagnosticsByWorker[
      "worker-475-passive-effect-error-routing-gate"
    ];
  assert.deepEqual(errorRouting.optionalFutureDiagnosticIds, [
    "PassiveEffectCallbackExecutionErrorRecord",
    "PassiveEffectCallbackExecutionErrorHandle",
    "PassiveEffectMountCreateCallbackErrorRecord"
  ]);
  assert.ok(
    errorRouting.acceptedDiagnosticIds.includes(
      "PassiveEffectDestroyCallbackErrorRecord"
    )
  );
  assert.equal(errorRouting.publicRootErrorCallbackCompatibilityClaimed, false);
  assert.equal(errorRouting.publicErrorBoundaryCompatibilityClaimed, false);
  assert.equal(errorRouting.publicActErrorAggregationClaimed, false);

  const schedulerFlush =
    gate.diagnosticsByWorker[
      "worker-482-test-renderer-act-scheduler-flush-gate"
    ];
  assert.equal(schedulerFlush.publicSchedulerFlushExecutionAvailable, false);
  assert.equal(schedulerFlush.publicSchedulerTimingCompatibilityClaimed, false);
  assert.ok(
    schedulerFlush.acceptedDiagnosticIds.includes(
      "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
    )
  );

  const flushSync =
    gate.diagnosticsByWorker[
      "worker-483-test-renderer-flush-sync-act-routing-gate"
    ];
  assert.equal(flushSync.publicRootSyncFlushRouteAvailable, false);
  assert.equal(flushSync.publicActCompatibilityClaimed, false);
  assert.ok(
    flushSync.acceptedDiagnosticIds.includes("create().unstable_flushSync")
  );

  assert.equal(gate.testRendererActSchedulerGates.length, 3);
  for (const rendererGate of gate.testRendererActSchedulerGates) {
    assert.equal(rendererGate.recognized, true, rendererGate.entrypoint);
    assert.equal(rendererGate.flushSyncBlocked, true, rendererGate.entrypoint);
    assert.equal(
      rendererGate.flushSyncCallbackInvoked,
      false,
      rendererGate.entrypoint
    );
    assert.equal(rendererGate.compatibilityClaimed, false, rendererGate.entrypoint);
    assert.equal(
      rendererGate.publicSchedulerFlushExecutionAvailable,
      false,
      rendererGate.entrypoint
    );
    assert.deepEqual(rendererGate.recognizedSchedulerMockFlushHelperKeys, [
      "unstable_flushAll",
      "unstable_flushAllWithoutAsserting",
      "unstable_flushExpired",
      "unstable_flushNumberOfYields",
      "unstable_flushUntilNextPaint"
    ]);
    assert.ok(
      rendererGate.recognizedPassiveActFlushRecordIds.includes(
        "passive-effect-callback-invocation-gate-snapshot"
      ),
      rendererGate.entrypoint
    );
    assert.equal(
      rendererGate.sideEffectPolicy.compatibilityClaimed,
      false,
      rendererGate.entrypoint
    );
  }

  assert.deepEqual(gate.reactDomTestUtilsActGate.acceptedPrivatePrerequisiteIds, [
    "react-act-private-dispatcher-gate",
    "scheduler-act-queue-routing-records",
    "scheduler-mock-flush-helper-metadata",
    "sync-flush-act-continuation-records",
    "sync-flush-post-passive-continuation-execution-gate",
    "passive-effects-flush-metadata",
    "passive-effect-callback-handle-metadata",
    "react-dom-private-root-bridge-records",
    "react-dom-private-flush-sync-root-output-diagnostic",
    "react-dom-private-root-warning-boundary-diagnostics",
    "react-dom-private-flush-sync-guard"
  ]);
  assert.equal(
    gate.reactDomTestUtilsActGate.passiveEffectCallbackHandles
      .testControlledInvocationOnly,
    true
  );
  assert.equal(
    gate.reactDomTestUtilsActGate.passiveEffectCallbackHandles
      .publicActCompatibilityClaimed,
    false
  );
  assert.equal(
    gate.reactPrivateActGate.rendererBackedActDrainConsumptionStatus,
    "consumed-accepted-renderer-backed-act-drain-diagnostics"
  );
  assert.deepEqual(
    gate.reactPrivateActGate.acceptedRendererBackedActDrainReconcilerRecords,
    [
      "SyncFlushActContinuationDrainRecord",
      "SyncFlushActPrivateExecutionDiagnosticsForCanary",
      "SyncFlushPostPassiveContinuationExecutionRecord",
      "PassiveEffectsFlushWithSyncFlushContinuationResult"
    ]
  );
});

test("act/passive local gate keeps benchmark timing canaries diagnostic-only", () => {
  const gate = evaluateActPassiveLocalGate();
  const benchmark =
    gate.diagnosticsByWorker[
      "worker-498-benchmark-act-passive-timing-canaries"
    ];

  assert.equal(benchmark.timingStatus, "diagnostic-only");
  assert.equal(benchmark.timingDataPolicy, "diagnostic-until-compatible");
  assert.equal(benchmark.comparablePublicTimingClaimed, false);
  assert.deepEqual(benchmark.acceptedDiagnosticIds, [
    "private-passive-flush-gate-timing-canary",
    "react-dom-test-utils-private-passive-flush-diagnostic-gate-1"
  ]);
  assert.deepEqual(gate.passiveTimingCanary.privatePassiveFlushGate, {
    id: "react-dom-test-utils-private-passive-flush-diagnostic-gate-1",
    status: "accepted-private-partial",
    admitted: true,
    compatibilityClaimed: false,
    notes:
      "Private passive flush metadata and test-controlled callback-handle records are admitted for diagnostics while scheduler-driven passive execution, public act, and effect compatibility remain blocked."
  });
  assert.deepEqual(gate.passiveTimingCanary.publicActCompatibilityGate, {
    id: "react-dom-test-utils-act-public-compatibility-blocked-gate-1",
    status: "accepted-blocked",
    admitted: false,
    compatibilityClaimed: false,
    notes:
      "The public react-dom/test-utils.act surface remains a placeholder; public act delegation, passive effect execution, and comparable timing remain blocked."
  });
  assert.equal(gate.passiveTimingCanary.publicActTimingPromotionBlocked, true);
  assert.equal(gate.passiveTimingCanary.publicActTimingPromotionAdmitted, false);
});

test("act/passive local gate rejects public compatibility claims", () => {
  const gate = evaluateActPassiveLocalGate({
    compatibilityOverrides: {
      compatibilityClaimed: true,
      publicActBehaviorAvailable: true
    }
  });

  assert.equal(gate.status, ACT_PASSIVE_LOCAL_GATE_VIOLATION_STATUS);
  assert.equal(gate.compatibilityClaimed, true);
  assert.deepEqual(gate.violations, [
    {
      id: "public-compatibility-or-execution-claim-detected",
      claimIds: ["override.compatibilityClaimed", "override.publicActBehaviorAvailable"]
    }
  ]);
});

test("act/passive local gate rejects private diagnostics that promote compatibility", () => {
  const gate = evaluateActPassiveLocalGate({
    diagnosticOverridesByWorker: {
      "worker-482-test-renderer-act-scheduler-flush-gate": {
        compatibilityClaimed: true
      }
    }
  });

  assert.equal(gate.status, ACT_PASSIVE_LOCAL_GATE_VIOLATION_STATUS);
  assert.deepEqual(gate.violations, [
    {
      id: "private-diagnostic-claimed-compatibility",
      workerIds: ["worker-482-test-renderer-act-scheduler-flush-gate"]
    },
    {
      id: "public-compatibility-or-execution-claim-detected",
      claimIds: [
        "worker-482-test-renderer-act-scheduler-flush-gate.compatibilityClaimed"
      ]
    }
  ]);
});

test("act/passive local gate rejects missing accepted queue diagnostics", () => {
  const gate = evaluateActPassiveLocalGate({
    diagnosticOverridesByWorker: {
      "worker-473-test-renderer-act-passive-effect-drain": {
        recognized: false
      }
    }
  });

  assert.equal(gate.status, ACT_PASSIVE_LOCAL_GATE_VIOLATION_STATUS);
  assert.equal(gate.privateDiagnosticsRecognized, false);
  assert.deepEqual(gate.violations, [
    {
      id: "required-private-diagnostic-not-recognized",
      workerIds: ["worker-473-test-renderer-act-passive-effect-drain"]
    }
  ]);
});

test("act/passive local gate rejects benchmark public timing promotion", () => {
  const manifest = readPassiveTimingCanaryManifest();
  const publicGate = manifest.conformanceGates.find(
    (gate) => gate.id === "react-dom-test-utils-act-public-compatibility"
  );
  publicGate.acceptedGate = {
    ...publicGate.acceptedGate,
    admitted: true,
    compatibilityClaimed: true
  };

  const gate = evaluateActPassiveLocalGate({
    benchmarkManifest: manifest
  });

  assert.equal(gate.status, ACT_PASSIVE_LOCAL_GATE_VIOLATION_STATUS);
  assert.equal(
    gate.diagnosticsByWorker[
      "worker-498-benchmark-act-passive-timing-canaries"
    ].recognized,
    false
  );
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    [
      "required-private-diagnostic-not-recognized",
      "public-compatibility-or-execution-claim-detected"
    ]
  );
  assert.deepEqual(gate.publicCompatibilityViolationIds, [
    "benchmark.public-act-timing-promotion-admitted",
    "benchmark.public-act-timing-compatibility-claimed"
  ]);
});
