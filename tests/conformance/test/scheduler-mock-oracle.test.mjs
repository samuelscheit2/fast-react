import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  SCHEDULER_MOCK_FAST_REACT_TARGET,
  SCHEDULER_MOCK_ORACLE_ARTIFACT_PATH,
  SCHEDULER_MOCK_PROBE_MODES,
  SCHEDULER_MOCK_TARGET
} from "../src/scheduler-mock-targets.mjs";
import {
  SCHEDULER_MOCK_SCENARIO_IDS,
  SCHEDULER_MOCK_SCENARIOS
} from "../src/scheduler-mock-scenarios.mjs";
import {
  findFastReactSchedulerMockComparison,
  findFastReactSchedulerMockObservation,
  findSchedulerMockObservation,
  readCheckedSchedulerMockOracle,
  readCheckedSchedulerMockOracleText
} from "../src/scheduler-mock-oracle.mjs";

const oracle = readCheckedSchedulerMockOracle();

const EXPECTED_MOCK_EXPORT_KEYS = [
  "log",
  "reset",
  "unstable_IdlePriority",
  "unstable_ImmediatePriority",
  "unstable_LowPriority",
  "unstable_NormalPriority",
  "unstable_Profiling",
  "unstable_UserBlockingPriority",
  "unstable_advanceTime",
  "unstable_cancelCallback",
  "unstable_clearLog",
  "unstable_flushAll",
  "unstable_flushAllWithoutAsserting",
  "unstable_flushExpired",
  "unstable_flushNumberOfYields",
  "unstable_flushUntilNextPaint",
  "unstable_forceFrameRate",
  "unstable_getCurrentPriorityLevel",
  "unstable_hasPendingWork",
  "unstable_next",
  "unstable_now",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
  "unstable_setDisableYieldValue",
  "unstable_shouldYield",
  "unstable_wrapCallback"
];

const EXPECTED_TARBALL_FILES = [
  "LICENSE",
  "README.md",
  "cjs/scheduler-unstable_mock.development.js",
  "cjs/scheduler-unstable_mock.production.js",
  "cjs/scheduler-unstable_post_task.development.js",
  "cjs/scheduler-unstable_post_task.production.js",
  "cjs/scheduler.development.js",
  "cjs/scheduler.native.development.js",
  "cjs/scheduler.native.production.js",
  "cjs/scheduler.production.js",
  "index.js",
  "index.native.js",
  "package.json",
  "unstable_mock.js",
  "unstable_post_task.js"
];

test("checked scheduler mock oracle artifact has the expected schema and targets", () => {
  assert.equal(
    SCHEDULER_MOCK_ORACLE_ARTIFACT_PATH,
    "oracles/scheduler-0.27.0-mock-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "scheduler-0.27.0-mock-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact scheduler npm tarball plus local scheduler placeholder copied under an isolated alias into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per target, scenario, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    timingNormalization:
      "scheduler/unstable_mock virtual time is recorded directly; raw wall-clock timestamps and local filesystem paths are omitted"
  });

  assert.deepEqual(oracle.schedulerTarget, SCHEDULER_MOCK_TARGET);
  assert.deepEqual(oracle.fastReactTarget, SCHEDULER_MOCK_FAST_REACT_TARGET);
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages.scheduler.tarball.integrityVerified, true);
  assert.deepEqual(oracle.packages.scheduler.tarball.files, EXPECTED_TARBALL_FILES);
  assert.equal(
    oracle.packages.fastReactScheduler.behaviorCompatibilityClaimed,
    false
  );
});

test("scheduler mock oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.evidenceClaims, {
    npmMetadataResolved: true,
    tarballDownloaded: true,
    tarballIntegrityVerified: true,
    schedulerMockBehaviorProbed: true,
    fastReactPlaceholderComparedToScheduler: true,
    fastReactBehaviorCompatible: false
  });
  assert.deepEqual(oracle.conformanceClaims, {
    realSchedulerBehaviorProbed: true,
    fastReactComparedToScheduler: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(oracle.coverage, {
    exportKeysAndDescriptors: true,
    virtualTime: true,
    logs: true,
    disableYieldValue: true,
    taskObjectShape: true,
    priorityContextApis: true,
    priorityFlushOrdering: true,
    flushHelpers: true,
    pendingWork: true,
    delayedAndExpiredWork: true,
    cancellationTombstones: true,
    continuations: true,
    paintYielding: true,
    resets: true,
    fastReactPlaceholderBoundaries: true
  });
  assert.deepEqual(
    oracle.implementationComparison.currentFastReactPlaceholder.statusCounts,
    {
      "known-mismatch": 2,
      "unsupported-placeholder": 16
    }
  );
});

test("scheduler mock oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, SCHEDULER_MOCK_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, SCHEDULER_MOCK_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "Mock exports and constants",
    "Virtual time and logs",
    "Task object shape and virtual timeout buckets",
    "Priority context APIs",
    "Priority ordering and flushAllWithoutAsserting",
    "Flush helper return and assertion behavior",
    "Pending, delayed, expired, and cancelled work",
    "Continuation callbacks and paint yielding",
    "Reset behavior and reset guards"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    assert.equal(
      oracle.schedulerObservations[mode.id].length,
      SCHEDULER_MOCK_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      SCHEDULER_MOCK_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      SCHEDULER_MOCK_SCENARIO_IDS.length
    );

    for (const scenarioId of SCHEDULER_MOCK_SCENARIO_IDS) {
      assert.equal(observation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("scheduler mock oracle captures export keys, constants, descriptors, and package metadata", () => {
  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-mock-export-shape");
    assert.deepEqual(value.packageJson, {
      name: "scheduler",
      version: "0.27.0",
      description: "Cooperative scheduler for the browser environment.",
      main: null,
      type: null,
      exports: null,
      private: null,
      engines: null
    });
    assert.deepEqual(value.exportKeys, EXPECTED_MOCK_EXPORT_KEYS);
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

    assert.deepEqual(
      descriptorFor(value.descriptors, "unstable_scheduleCallback").value,
      {
        type: "function",
        name: "",
        length: 3
      }
    );
    assert.deepEqual(descriptorFor(value.descriptors, "log").value, {
      type: "function",
      name: "",
      length: 1
    });
  }
});

test("scheduler mock oracle captures virtual time, log, and disable-yield-value behavior", () => {
  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-mock-virtual-time-and-logs");
    assert.equal(value.initialNow, 0);
    assert.equal(value.nowAfterAdvance, 7);
    assert.deepEqual(value.manualLog, ["manual"]);
    assert.deepEqual(value.emptyLog, []);
    assert.deepEqual(value.disabledState, {
      now: 7,
      log: []
    });
    assert.deepEqual(value.enabledState, {
      now: 10,
      log: ["enabled"]
    });
  }
});

test("scheduler mock oracle captures task shape, timeout buckets, and cancellation tombstones", () => {
  const expectedTimeouts = new Map([
    ["immediate", "-1ms"],
    ["user-blocking", "250ms"],
    ["normal", "5000ms"],
    ["low", "10000ms"],
    ["idle", "1073741823ms"]
  ]);

  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-mock-task-object-shape");

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

    assert.equal(value.delayedTask.beforeCancel.startTime, 12);
    assert.equal(value.delayedTask.beforeCancel.sortIndexRole, "startTime");
    assert.equal(value.delayedTask.beforeCancel.expirationDelta, "5000ms");
    assert.equal(value.delayedTask.afterCancel.callback.type, "null");
  }
});

test("scheduler mock oracle captures priority context and flush ordering", () => {
  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const context = operationValue(mode.id, "scheduler-mock-priority-context");
    assert.equal(context.defaultCurrentPriorityLevel, 3);
    assert.deepEqual(
      context.runWithPriority.map((entry) => [
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
      context.invalidRunWithPriority.map((entry) => entry.currentPriorityLevel),
      [3, 3, 3, 3]
    );
    assert.equal(context.restorationAfterThrow.value.currentPriorityLevel, 3);
    assert.deepEqual(
      context.nextByParent.map((entry) => [
        entry.parent,
        entry.currentPriorityLevel
      ]),
      [
        ["immediate", 3],
        ["user-blocking", 3],
        ["normal", 3],
        ["low", 4],
        ["idle", 5]
      ]
    );
    assert.deepEqual(context.wrapCallback.callResult, {
      thisLabel: "receiver",
      args: ["alpha", "beta"],
      currentPriorityLevel: 2
    });

    const flush = operationValue(mode.id, "scheduler-mock-priority-flush-order");
    assert.equal(flush.pendingBeforeFlush, true);
    assert.equal(flush.flushReturned, true);
    assert.deepEqual(flush.runOrder, [
      "immediate",
      "user-blocking",
      "normal",
      "low",
      "idle"
    ]);
    assert.deepEqual(flush.log, flush.runOrder);
    assert.equal(flush.pendingAfterFlush, false);
    assert.deepEqual(flush.equalPriorityFifo.runOrder, [
      "first",
      "second",
      "third",
      "fourth"
    ]);
    assert.equal(flush.equalPriorityFifo.pendingAfterFlush, false);
  }
});

test("scheduler mock oracle captures flush helper returns and assertions", () => {
  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-mock-flush-helpers");
    assert.deepEqual(value.empty.flushAll.value, {
      type: "undefined"
    });
    assert.deepEqual(value.empty.flushAllWithoutAsserting.value, {
      type: "boolean",
      value: false
    });
    assert.deepEqual(value.empty.flushUntilNextPaint.value, {
      type: "boolean",
      value: false
    });
    assert.equal(value.flushAllWithPreExistingLog.status, "throws");
    assert.match(value.flushAllWithPreExistingLog.message, /Log is not empty/u);
    assert.deepEqual(value.preExistingLogAfterThrow, ["pre-existing"]);
    assert.equal(value.flushAllWithYieldedValue.status, "throws");
    assert.match(
      value.flushAllWithYieldedValue.message,
      /something yielded a value/u
    );
    assert.deepEqual(value.yieldedLogAfterThrow, ["yielded"]);

    const yields = value.flushNumberOfYields;
    assert.deepEqual(yields.afterZero.events, []);
    assert.equal(yields.afterZero.hasPendingWork, true);
    assert.deepEqual(yields.afterOne.events, ["first"]);
    assert.equal(yields.afterOne.hasPendingWork, true);
    assert.deepEqual(yields.afterOneAgain.events, [
      "first",
      "first-continuation"
    ]);
    assert.equal(yields.afterOneAgain.hasPendingWork, true);
    assert.deepEqual(yields.afterFinish.events, [
      "first",
      "first-continuation",
      "second"
    ]);
    assert.equal(yields.afterFinish.hasPendingWork, false);
  }
});

test("scheduler mock oracle captures pending, delayed, expired, and cancelled work", () => {
  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-mock-pending-delayed-expired");
    assert.equal(value.delayed.pendingBeforeFirstFlush, true);
    assert.deepEqual(value.delayed.afterFirstFlush.events, [["ready", 0]]);
    assert.equal(value.delayed.afterFirstFlush.hasPendingWork, false);
    assert.equal(value.delayed.afterNine.now, 9);
    assert.equal(value.delayed.afterNine.hasPendingWork, false);
    assert.equal(value.delayed.afterTen.now, 10);
    assert.equal(value.delayed.afterTen.hasPendingWork, true);
    assert.deepEqual(value.delayed.afterSecondFlush.events, [
      ["ready", 0],
      ["delay10", 10, false]
    ]);
    assert.equal(value.delayed.afterSecondFlush.hasPendingWork, false);
    assert.equal(value.delayed.cancelledDelayedTask.callback.type, "null");

    assert.deepEqual(value.expired.afterFlushExpired.events, [
      ["user-blocking", true, 251]
    ]);
    assert.equal(value.expired.afterFlushExpired.hasPendingWork, true);
    assert.deepEqual(value.expired.afterFinishExpired.events, [
      ["user-blocking", true, 251],
      ["normal", false, 251]
    ]);
    assert.equal(value.expired.afterFinishExpired.hasPendingWork, false);
  }
});

test("scheduler mock oracle captures continuations, paint yielding, and reset guards", () => {
  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const continuation = operationValue(
      mode.id,
      "scheduler-mock-continuations-and-paint"
    );
    assert.deepEqual(continuation.continuation.afterOneYield.events, [
      "normal-start"
    ]);
    assert.equal(continuation.continuation.afterOneYield.hasPendingWork, true);
    assert.deepEqual(continuation.continuation.afterFinish.events, [
      "normal-start",
      "normal-continuation",
      "low"
    ]);
    assert.equal(continuation.continuation.afterFinish.hasPendingWork, false);
    assert.deepEqual(continuation.paint.afterFlushUntilNextPaint.events, [
      "paint-start"
    ]);
    assert.equal(continuation.paint.afterFlushUntilNextPaint.hasPendingWork, true);
    assert.deepEqual(continuation.paint.afterFinish.events, [
      "paint-start",
      "paint-continuation",
      "after-paint"
    ]);
    assert.equal(continuation.paint.afterFinish.hasPendingWork, false);

    const reset = operationValue(mode.id, "scheduler-mock-reset-behavior");
    assert.deepEqual(reset.afterReset, {
      now: 0,
      log: [],
      hasPendingWork: false
    });
    assert.equal(reset.resetDuringFlush.events[0].status, "throws");
    assert.equal(
      reset.resetDuringFlush.events[0].message,
      "Cannot reset while already flushing work."
    );
    assert.deepEqual(reset.resetWithPendingWork, {
      pendingBeforeReset: true,
      resetWithPending: {
        status: "returned",
        value: {
          type: "undefined"
        }
      },
      pendingAfterReset: false,
      pendingAfterNewSchedule: false,
      flushAfterNewSchedule: {
        status: "returned",
        value: {
          type: "boolean",
          value: false
        }
      },
      events: [],
      now: 0
    });
  }
});

test("scheduler mock oracle records current Fast React placeholder boundaries", () => {
  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const exportComparison = comparison(
      mode.id,
      "scheduler-mock-export-shape"
    );
    assert.equal(exportComparison.status, "known-mismatch");
    assert.equal(
      exportComparison.firstDifferencePath,
      "$.result.value.packageJson.description"
    );

    for (const scenarioId of SCHEDULER_MOCK_SCENARIO_IDS.filter(
      (id) => id !== "scheduler-mock-export-shape"
    )) {
      const scenarioComparison = comparison(mode.id, scenarioId);
      assert.equal(scenarioComparison.status, "unsupported-placeholder");
      assert.equal(scenarioComparison.fastReactResultStatus, "throws");
    }
  }
});

test("scheduler mock oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedSchedulerMockOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|fast-react-scheduler-mock-oracle-[A-Za-z0-9]|\/tmp\/|Users\/user|Developer\/Developer|file:\/\/\//u.test(
      text
    ),
    false
  );
});

test("print-scheduler-mock-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-scheduler-mock-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedSchedulerMockOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedSchedulerMockOracleText());
});

function observation(modeId, scenarioId) {
  return findSchedulerMockObservation(oracle, modeId, scenarioId);
}

function fastReactObservation(modeId, scenarioId) {
  return findFastReactSchedulerMockObservation(oracle, modeId, scenarioId);
}

function comparison(modeId, scenarioId) {
  return findFastReactSchedulerMockComparison(oracle, modeId, scenarioId);
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
