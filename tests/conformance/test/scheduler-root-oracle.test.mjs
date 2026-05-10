import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  SCHEDULER_ROOT_FAST_REACT_TARGET,
  SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH,
  SCHEDULER_ROOT_PROBE_MODES,
  SCHEDULER_ROOT_TARGET
} from "../src/scheduler-root-targets.mjs";
import {
  SCHEDULER_ROOT_SCENARIO_IDS,
  SCHEDULER_ROOT_SCENARIOS
} from "../src/scheduler-root-scenarios.mjs";
import {
  findFastReactSchedulerRootComparison,
  findFastReactSchedulerRootObservation,
  findSchedulerRootObservation,
  readCheckedSchedulerRootOracle,
  readCheckedSchedulerRootOracleText
} from "../src/scheduler-root-oracle.mjs";

const oracle = readCheckedSchedulerRootOracle();

const EXPECTED_EXPORT_KEYS = [
  "unstable_now",
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_cancelCallback",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_next",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];

test("checked scheduler root oracle artifact has the expected schema and target", () => {
  assert.equal(
    SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH,
    "oracles/scheduler-0.27.0-root-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "scheduler-0.27.0-root-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact scheduler npm tarball plus local scheduler implementation copied under an isolated alias into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per target, scenario, and mode",
    probeTimeoutMs: 15000,
    generatedTimestampIncluded: false,
    timingNormalization:
      "raw wall-clock timestamps are omitted; probes record logical ordering, timeout buckets, and boolean didTimeout categories; local package metadata is observed but omitted from behavior comparison"
  });
  assert.deepEqual(oracle.schedulerTarget, SCHEDULER_ROOT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, SCHEDULER_ROOT_FAST_REACT_TARGET);
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages.scheduler.tarball.integrityVerified, true);
  assert.equal(oracle.packages.scheduler.tarball.fileCount, 15);
  assert.equal(
    oracle.packages.fastReactScheduler.behaviorCompatibilityClaimed,
    false
  );
});

test("scheduler root oracle keeps compatibility claims scoped to observed scheduler behavior", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realSchedulerBehaviorProbed: true,
    fastReactComparedToScheduler: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.schedulerRootBehaviorProbed, true);
  assert.equal(oracle.evidenceClaims.fastReactComparedToScheduler, true);
  assert.equal(oracle.evidenceClaims.fastReactBehaviorCompatible, false);
  assert.deepEqual(oracle.coverage, {
    exportKeys: true,
    constants: true,
    priorityOrdering: true,
    equalPriorityFifo: true,
    delayedCallbacks: true,
    cancellation: true,
    continuations: true,
    didTimeout: true,
    priorityContextApis: true,
    shouldYield: true,
    requestPaint: true,
    forceFrameRate: true,
    nodeHostCallbackTransport: true,
    localPackageMetadataExcludedFromBehaviorComparison: true
  });
  assert.deepEqual(
    oracle.implementationComparison.afterWorker164.statusCounts,
    {
      "matched-but-compatibility-not-claimed": 22
    }
  );
});

test("scheduler root oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, SCHEDULER_ROOT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, SCHEDULER_ROOT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "Root exports and constants",
    "Scheduled task object shape and timeout categories",
    "Priority ordering",
    "Equal-priority FIFO",
    "Delayed callbacks",
    "Cancellation tombstones",
    "Continuation callbacks",
    "didTimeout callback argument",
    "Priority context APIs",
    "Yield, paint, and frame-rate APIs",
    "Node host callback transport"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    assert.equal(
      oracle.schedulerObservations[mode.id].length,
      SCHEDULER_ROOT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      SCHEDULER_ROOT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      SCHEDULER_ROOT_SCENARIO_IDS.length
    );

    for (const scenarioId of SCHEDULER_ROOT_SCENARIO_IDS) {
      assert.equal(observation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(observation(mode.id, scenarioId).packageName, "scheduler");
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("scheduler root oracle captures export keys, constants, and descriptors", () => {
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-root-export-shape");
    assert.deepEqual(value.packageJson, {
      name: "scheduler",
      version: "0.27.0",
      main: null,
      type: null,
      exports: null
    });
    assert.deepEqual(value.exportKeys, EXPECTED_EXPORT_KEYS);
    assert.deepEqual(value.constants, {
      unstable_ImmediatePriority: 1,
      unstable_UserBlockingPriority: 2,
      unstable_NormalPriority: 3,
      unstable_LowPriority: 4,
      unstable_IdlePriority: 5,
      unstable_Profiling: null
    });
    assert.deepEqual(value.unstableNoPriority, {
      hasIn: false,
      hasOwn: false
    });

    const descriptor = descriptorFor(value.descriptors, "unstable_scheduleCallback");
    assert.equal(descriptor.kind, "data");
    assert.equal(descriptor.enumerable, true);
    assert.equal(descriptor.configurable, true);
    assert.equal(descriptor.writable, true);
    assert.deepEqual(descriptor.value, {
      type: "function",
      name: "",
      length: 3
    });
  }
});

test("scheduler root oracle captures task shape, timeout buckets, and cancellation tombstones", () => {
  const expectedTimeouts = new Map([
    ["immediate", "-1ms"],
    ["user-blocking", "250ms"],
    ["normal", "5000ms"],
    ["low", "10000ms"],
    ["idle", "1073741823ms"]
  ]);

  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-root-task-object-shape");

    for (const task of value.readyTasks) {
      assert.deepEqual(task.beforeCancel.objectKeys, [
        "id",
        "callback",
        "priorityLevel",
        "startTime",
        "expirationTime",
        "sortIndex"
      ]);
      assert.equal(task.beforeCancel.callback.type, "function");
      assert.equal(task.afterCancel.callback.type, "null");
      assert.equal(task.beforeCancel.sortIndexRole, "expirationTime");
      assert.equal(
        task.beforeCancel.expirationDelta,
        expectedTimeouts.get(task.label)
      );
    }

    assert.equal(
      value.delayedTask.beforeCancel.startTime,
      "delayed-future-start"
    );
    assert.equal(value.delayedTask.beforeCancel.sortIndexRole, "startTime");
    assert.equal(value.delayedTask.beforeCancel.expirationDelta, "5000ms");
    assert.equal(value.delayedTask.afterCancel.callback.type, "null");
  }
});

test("scheduler root oracle captures priority ordering and equal-priority FIFO", () => {
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const priority = operationValue(
      mode.id,
      "scheduler-root-priority-ordering"
    );
    assert.deepEqual(priority.scheduledOrder, [
      "idle",
      "low",
      "normal",
      "user-blocking",
      "immediate"
    ]);
    assert.deepEqual(priority.runOrder, [
      "immediate",
      "user-blocking",
      "normal",
      "low",
      "idle"
    ]);
    assert.deepEqual(
      priority.events.map((event) => event.currentPriorityLevel),
      [1, 2, 3, 4, 5]
    );

    const fifo = operationValue(
      mode.id,
      "scheduler-root-equal-priority-fifo"
    );
    assert.deepEqual(fifo.runOrder, ["first", "second", "third", "fourth"]);
    assert.deepEqual(
      fifo.events.map((event) => event.currentPriorityLevel),
      [3, 3, 3, 3]
    );
  }
});

test("scheduler root oracle captures delayed callbacks, cancellation, and continuations", () => {
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const delayed = operationValue(mode.id, "scheduler-root-delayed-callbacks");
    assert.deepEqual(delayed.runOrder, ["ready-normal", "delayed-normal"]);
    assert.equal(delayed.events[1].didTimeout, false);
    assert.equal(delayed.cancelledDelayedCallbackAfterCancel.type, "null");
    assert.equal(delayed.cancelledDelayedRan, false);

    const cancellation = operationValue(mode.id, "scheduler-root-cancellation");
    assert.equal(cancellation.beforeCancelCallback.type, "function");
    assert.equal(cancellation.afterCancelCallback.type, "null");
    assert.deepEqual(cancellation.runOrder, ["first", "third"]);
    assert.equal(cancellation.cancelledTask.callback.type, "null");

    const continuations = operationValue(
      mode.id,
      "scheduler-root-continuations"
    );
    assert.deepEqual(continuations.runOrder, [
      "first-callback",
      "first-continuation",
      "second-callback"
    ]);
    assert.deepEqual(
      continuations.events.map((event) => event.currentPriorityLevel),
      [3, 3, 3]
    );
  }
});

test("scheduler root oracle captures didTimeout categories", () => {
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-root-did-timeout");
    assert.deepEqual(value.runOrder, [
      "immediate",
      "user-blocking-expired",
      "normal-after-block"
    ]);
    assert.deepEqual(value.didTimeoutByLabel, {
      immediate: true,
      "user-blocking-expired": true,
      "normal-after-block": false
    });
    assert.equal(value.blockDurationCategory, ">=400ms-and-<normal-timeout");
  }
});

test("scheduler root oracle captures priority context APIs", () => {
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-root-priority-context");
    assert.equal(value.defaultCurrentPriorityLevel, 3);
    assert.deepEqual(
      value.runWithPriority.map((entry) => [
        entry.label,
        entry.returnValue.currentPriorityLevel,
        entry.afterReturnPriorityLevel
      ]),
      [
        ["immediate", 1, 3],
        ["user-blocking", 2, 3],
        ["normal", 3, 3],
        ["low", 4, 3],
        ["idle", 5, 3]
      ]
    );
    assert.deepEqual(
      value.invalidRunWithPriority.map((entry) => entry.currentPriorityLevel),
      [3, 3, 3, 3]
    );
    assert.equal(value.restorationAfterThrow.status, "returned");
    assert.equal(value.restorationAfterThrow.value.currentPriorityLevel, 3);
    assert.deepEqual(
      value.nextByParent.map((entry) => [
        entry.parent,
        entry.currentPriorityLevel,
        entry.afterReturnPriorityLevel
      ]),
      [
        ["immediate", 3, 3],
        ["user-blocking", 3, 3],
        ["normal", 3, 3],
        ["low", 4, 3],
        ["idle", 5, 3]
      ]
    );
    assert.deepEqual(value.wrapCallback.callResult, {
      thisLabel: "receiver",
      args: ["alpha", "beta"],
      currentPriorityLevel: 2
    });
    assert.equal(value.wrapCallback.beforeCallPriorityLevel, 4);
    assert.equal(value.wrapCallback.afterCallPriorityLevel, 4);
  }
});

test("scheduler root oracle captures shouldYield, requestPaint, and forceFrameRate", () => {
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const value = operationValue(
      mode.id,
      "scheduler-root-yield-paint-frame-rate"
    );
    assert.deepEqual(value.runOrder, ["first", "second"]);
    assert.equal(value.events[0].shouldYieldBeforePaint, false);
    assert.equal(value.events[0].shouldYieldAfterTwentyMsAtOneFps, false);
    assert.equal(value.events[0].shouldYieldAfterRequestPaint, true);
    assert.equal(value.events[1].shouldYieldAtSecondCallbackStart, false);
    assert.equal(value.forceFrameRateConsoleErrors.length, 2);
    assert.equal(value.forceFrameRateConsoleErrors[0].method, "error");
  }
});

test("scheduler root oracle captures Node setImmediate host callback transport", () => {
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-root-node-host-transport");
    assert.equal(value.setImmediateAvailable, true);
    assert.equal(value.firstTransport, "setImmediate");
    assert.deepEqual(value.runOrder, ["normal-callback"]);
    assert.equal(value.transportCalls.length, 1);
    assert.deepEqual(value.transportCalls[0], {
      transport: "setImmediate",
      callbackType: "function",
      argumentCount: 0
    });
  }
});

test("scheduler root oracle records matching Fast React root behavior without claiming broad compatibility", () => {
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    for (const scenarioId of SCHEDULER_ROOT_SCENARIO_IDS) {
      const scenarioComparison = comparison(mode.id, scenarioId);
      assert.equal(
        scenarioComparison.status,
        "matched-but-compatibility-not-claimed"
      );
      assert.equal(scenarioComparison.compatibilityClaimed, false);
      assert.equal(scenarioComparison.firstDifferencePath, null);
      assert.equal(scenarioComparison.schedulerResultStatus, "returned");
      assert.equal(scenarioComparison.fastReactResultStatus, "returned");
    }
  }
});

test("scheduler root oracle artifact has no local temp path leaks", () => {
  const oracleText = readCheckedSchedulerRootOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /file:\/\/\//u);
  assert.doesNotMatch(oracleText, /fast-react-scheduler-oracle-[A-Za-z0-9]/u);
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-scheduler-root-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-scheduler-root-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedSchedulerRootOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedSchedulerRootOracleText());
});

function observation(modeId, scenarioId) {
  return findSchedulerRootObservation(oracle, modeId, scenarioId);
}

function fastReactObservation(modeId, scenarioId) {
  return findFastReactSchedulerRootObservation(oracle, modeId, scenarioId);
}

function comparison(modeId, scenarioId) {
  return findFastReactSchedulerRootComparison(oracle, modeId, scenarioId);
}

function operationValue(modeId, scenarioId) {
  const result = observation(modeId, scenarioId).result.result;
  assert.equal(result.status, "returned", `${modeId}:${scenarioId}`);
  return result.value;
}

function descriptorFor(descriptors, key) {
  const entry = descriptors.find((descriptor) => descriptor.key === key);
  if (!entry) {
    throw new Error(`Missing descriptor for ${key}`);
  }
  return entry.descriptor;
}
