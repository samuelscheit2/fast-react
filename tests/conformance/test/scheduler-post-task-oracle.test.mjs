import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findSchedulerPostTaskObservation,
  readCheckedSchedulerPostTaskOracle,
  readCheckedSchedulerPostTaskOracleText
} from "../src/scheduler-post-task-oracle.mjs";
import {
  SCHEDULER_POST_TASK_SCENARIO_IDS,
  SCHEDULER_POST_TASK_SCENARIOS
} from "../src/scheduler-post-task-scenarios.mjs";
import {
  SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH,
  SCHEDULER_POST_TASK_PROBE_MODES,
  SCHEDULER_POST_TASK_TARGET
} from "../src/scheduler-post-task-targets.mjs";

const oracle = readCheckedSchedulerPostTaskOracle();

const EXPECTED_EXPORT_KEYS = [
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
  "unstable_now",
  "unstable_requestPaint",
  "unstable_runWithPriority",
  "unstable_scheduleCallback",
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

test("checked scheduler post-task oracle artifact has the expected schema and target", () => {
  assert.equal(
    SCHEDULER_POST_TASK_ORACLE_ARTIFACT_PATH,
    "oracles/scheduler-0.27.0-post-task-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "scheduler-0.27.0-post-task-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact scheduler npm tarball extracted into a temporary node_modules tree and probed through isolated Node child processes with controlled Task Scheduling API shims",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per scheduler/unstable_post_task scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    timingNormalization:
      "raw wall-clock timestamps are omitted; probes use a controlled window.performance.now shim and record only logical scheduler calls, priority values, delay value categories, abort state, and shouldYield booleans"
  });
  assert.deepEqual(oracle.schedulerTarget, SCHEDULER_POST_TASK_TARGET);
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages.scheduler.tarball.integrityVerified, true);
  assert.deepEqual(
    oracle.packages.scheduler.tarball.files,
    EXPECTED_TARBALL_FILES
  );
});

test("scheduler post-task oracle keeps compatibility claims scoped", () => {
  assert.deepEqual(oracle.evidenceClaims, {
    npmMetadataResolved: true,
    tarballDownloaded: true,
    tarballIntegrityVerified: true,
    schedulerPostTaskBehaviorProbed: true,
    plainNodeUnsupportedBehaviorProbed: true,
    controlledTaskSchedulingApiShimUsed: true,
    exportDescriptorBehaviorProbed: true,
    fastReactComparedToScheduler: false
  });
  assert.deepEqual(oracle.conformanceClaims, {
    realSchedulerBehaviorProbed: true,
    fastReactComparedToScheduler: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(oracle.coverage, {
    exportKeys: true,
    exportDescriptors: true,
    environmentFeatureAccess: true,
    plainNodeUnsupportedImport: true,
    missingTaskSchedulingApiUnsupportedBehavior: true,
    noopPaintAndFrameRateApis: true,
    priorityContextApis: true,
    priorityToPostTaskPriorityMapping: true,
    delayOptionNormalization: true,
    returnedTaskNodeDescriptors: true,
    cancellationAbortSignal: true,
    deadlineShouldYieldWithControlledTime: true,
    continuationWithSchedulerYield: true,
    continuationPostTaskFallbackWithoutYield: true,
    browserTaskOrdering: false,
    rawTiming: false
  });
});

test("scheduler post-task oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, SCHEDULER_POST_TASK_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, SCHEDULER_POST_TASK_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "post-task export shape and descriptors",
    "post-task environment feature access",
    "post-task priority context APIs",
    "post-task scheduling calls under a controlled Task Scheduling API shim",
    "post-task cancellation through TaskController.abort",
    "post-task continuation scheduling fallback"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    assert.equal(
      oracle.schedulerObservations[mode.id].length,
      SCHEDULER_POST_TASK_SCENARIO_IDS.length
    );

    for (const scenarioId of SCHEDULER_POST_TASK_SCENARIO_IDS) {
      const observation = findSchedulerPostTaskObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.packageName, "scheduler");
      assert.equal(observation.result.status, "returned");
    }
  }
});

test("scheduler post-task oracle captures export keys, constants, and descriptors", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-post-task-export-shape");
    assert.deepEqual(value.packageJson, {
      name: "scheduler",
      version: "0.27.0",
      description: "Cooperative scheduler for the browser environment.",
      main: null,
      type: null,
      exports: null,
      files: [
        "LICENSE",
        "README.md",
        "index.js",
        "index.native.js",
        "unstable_mock.js",
        "unstable_post_task.js",
        "cjs/"
      ],
      dependencies: null,
      peerDependencies: null,
      engines: null,
      license: "MIT",
      repository: {
        type: "git",
        url: "https://github.com/facebook/react.git",
        directory: "packages/scheduler"
      },
      bugs: {
        url: "https://github.com/facebook/react/issues"
      },
      homepage: "https://react.dev/"
    });
    assert.equal(
      value.requireResolution.path,
      "node_modules/scheduler/unstable_post_task.js"
    );
    assert.deepEqual(value.exportKeys, EXPECTED_EXPORT_KEYS);
    assert.deepEqual(value.constants, {
      unstable_ImmediatePriority: 1,
      unstable_UserBlockingPriority: 2,
      unstable_NormalPriority: 3,
      unstable_LowPriority: 4,
      unstable_IdlePriority: 5,
      unstable_Profiling: null
    });
    assert.equal(value.initialNow, 100);
    assert.equal(value.initialShouldYield, true);
    assert.equal(value.noops.requestPaint.type, "undefined");
    assert.equal(value.noops.forceFrameRate.type, "undefined");

    assert.deepEqual(
      value.descriptors.map((entry) => [
        entry.key,
        entry.descriptor.kind,
        entry.descriptor.enumerable,
        entry.descriptor.configurable,
        entry.descriptor.writable
      ]),
      EXPECTED_EXPORT_KEYS.map((key) => [key, "data", true, true, true])
    );

    const scheduleDescriptor = descriptorFor(
      value.descriptors,
      "unstable_scheduleCallback"
    );
    assert.deepEqual(scheduleDescriptor, {
      kind: "data",
      configurable: true,
      enumerable: true,
      writable: true,
      value: {
        type: "function",
        name: "",
        length: 3
      }
    });
    assert.deepEqual(
      value.functionExports.map((entry) => [
        entry.key,
        entry.value.name,
        entry.value.length
      ]),
      [
        ["unstable_cancelCallback", "", 1],
        ["unstable_forceFrameRate", "", 0],
        ["unstable_getCurrentPriorityLevel", "", 0],
        ["unstable_next", "", 1],
        ["unstable_now", "bound now", 0],
        ["unstable_requestPaint", "", 0],
        ["unstable_runWithPriority", "", 2],
        ["unstable_scheduleCallback", "", 3],
        ["unstable_shouldYield", "", 0],
        ["unstable_wrapCallback", "", 1]
      ]
    );
  }
});

test("scheduler post-task oracle captures environment feature failures", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const value = operationValue(
      mode.id,
      "scheduler-post-task-environment-require"
    );
    assert.deepEqual(
      value.cases.map((entry) => [
        entry.label,
        entry.require.require.status,
        entry.require.require.name ?? null,
        entry.require.require.message ?? null
      ]),
      [
        [
          "plain-node-missing-window",
          "throws",
          "ReferenceError",
          "window is not defined"
        ],
        [
          "window-without-performance",
          "throws",
          "TypeError",
          "Cannot read properties of undefined (reading 'now')"
        ],
        ["minimal-window-without-task-controller", "ok", null, null],
        ["task-controller-without-global-scheduler", "ok", null, null],
        ["scheduler-without-post-task", "ok", null, null]
      ]
    );

    assert.deepEqual(value.cases[2].operation.value.scheduleCallback, {
      status: "throws",
      name: "ReferenceError",
      code: null,
      message: "TaskController is not defined"
    });
    assert.deepEqual(value.cases[3].operation.value.scheduleCallback, {
      status: "throws",
      name: "TypeError",
      code: null,
      message: "Cannot read properties of undefined (reading 'postTask')"
    });
    assert.deepEqual(value.cases[4].operation.value.scheduleCallback, {
      status: "throws",
      name: "TypeError",
      code: null,
      message: "scheduler.postTask is not a function"
    });
  }
});

test("scheduler post-task oracle captures priority context behavior", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const value = operationValue(
      mode.id,
      "scheduler-post-task-priority-context"
    );
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
      value.invalidRunWithPriority.map((entry) => [
        entry.input.value,
        entry.currentPriorityLevel,
        entry.afterReturnPriorityLevel
      ]),
      [
        [0, 0, 3],
        [6, 6, 3],
        [99, 99, 3]
      ]
    );
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
    assert.deepEqual(value.wrapCallback, {
      beforeCallPriorityLevel: 4,
      callResult: {
        status: "ok",
        value: {
          thisType: "undefined",
          thisIsUndefined: true,
          thisLabel: null,
          args: [null, null],
          currentPriorityLevel: 2
        }
      },
      afterCallPriorityLevel: 4,
      wrappedFunction: {
        type: "function",
        name: "",
        length: 0
      }
    });
  }
});

test("scheduler post-task oracle captures scheduling calls and callback observations", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-post-task-scheduling");
    assert.deepEqual(
      value.scheduled.map((entry) => [
        entry.label,
        entry.returnedNode.signal.priority,
        entry.scheduleEvents[1].delay
      ]),
      [
        ["immediate", "user-blocking", { type: "number", value: 0 }],
        [
          "user-blocking-null-options",
          "user-blocking",
          { type: "number", value: 0 }
        ],
        ["normal-empty-options", "user-visible", { type: "undefined" }],
        ["low-delay", "user-visible", { type: "number", value: 7 }],
        ["idle-zero-delay", "background", { type: "number", value: 0 }],
        ["invalid-delay", "user-visible", { type: "number", value: 2 }]
      ]
    );
    for (const entry of value.scheduled) {
      assert.deepEqual(entry.returnedNode.ownKeys, ["_controller"]);
      assert.deepEqual(
        descriptorFor(entry.returnedNode.descriptors, "_controller"),
        {
          kind: "data",
          configurable: true,
          enumerable: true,
          writable: true,
          value: {
            type: "object",
            objectTag: "[object Object]",
            ownKeys: ["priority", "signal"]
          }
        }
      );
      assert.deepEqual(entry.returnedNode.controllerOwnKeys, [
        "priority",
        "signal"
      ]);
      assert.deepEqual(entry.returnedNode.signal.ownKeys, [
        "id",
        "aborted",
        "priority"
      ]);
    }
    assert.deepEqual(
      value.flush.map((entry) => [
        entry.type,
        entry.signalId,
        entry.signalPriority
      ]),
      [
        ["run-post-task", 1, "user-blocking"],
        ["run-post-task", 2, "user-blocking"],
        ["run-post-task", 3, "user-visible"],
        ["run-post-task", 4, "user-visible"],
        ["run-post-task", 5, "background"],
        ["run-post-task", 6, "user-visible"]
      ]
    );
    assert.deepEqual(
      value.callbackEvents.map((entry) => [
        entry.label,
        entry.didTimeout ?? null,
        entry.currentPriorityLevel ?? null,
        entry.shouldYieldAtCallbackStart ?? entry.shouldYieldAtDeadline
      ]),
      [
        ["immediate", false, 1, false],
        ["immediate-at-deadline", null, null, true],
        ["user-blocking-null-options", false, 2, false],
        ["normal-empty-options", false, 3, false],
        ["low-delay", false, 4, false],
        ["idle-zero-delay", false, 5, false],
        ["invalid-delay", false, 99, false]
      ]
    );
    assert.equal(value.pendingPostTaskCount, 0);
    assert.deepEqual(value.shimEventsAfterFlush, []);
  }
});

test("scheduler post-task oracle captures cancellation through TaskController.abort", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-post-task-cancellation");
    assert.equal(value.beforeCancel.signal.aborted, false);
    assert.equal(value.beforeCancel.signal.priority, "user-visible");
    assert.equal(value.cancelReturn.type, "undefined");
    assert.equal(value.afterCancel.signal.aborted, true);
    assert.deepEqual(value.abortEvents, [
      {
        type: "abort",
        priority: "user-visible",
        signalId: 1
      }
    ]);
    assert.deepEqual(value.flush, [
      {
        type: "skip-aborted",
        signalId: 1,
        signalPriority: "user-visible"
      }
    ]);
    assert.equal(value.callbackRan, false);
    assert.equal(value.pendingPostTaskCount, 0);
  }
});

test("scheduler post-task oracle captures continuation scheduling fallback", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const value = operationValue(mode.id, "scheduler-post-task-continuations");
    assert.deepEqual(value.withSchedulerYield.events, [
      {
        label: "normal-start",
        currentPriorityLevel: 3
      },
      {
        label: "normal-continuation",
        currentPriorityLevel: 3
      }
    ]);
    assert.deepEqual(
      value.withSchedulerYield.postFlushShimEvents.map((entry) => entry.type),
      ["yield", "yield.then"]
    );
    assert.deepEqual(
      value.withSchedulerYield.postFlushShimEvents.map((entry) => [
        entry.signalId,
        entry.signalPriority,
        entry.signalAborted
      ]),
      [
        [1, "user-visible", false],
        [1, "user-visible", false]
      ]
    );

    assert.deepEqual(value.withoutSchedulerYield.events, [
      {
        label: "normal-start",
        currentPriorityLevel: 3
      },
      {
        label: "normal-continuation",
        currentPriorityLevel: 3
      }
    ]);
    assert.deepEqual(value.withoutSchedulerYield.postFlushShimEvents, [
      {
        type: "postTask",
        hasDelayProperty: false,
        delay: {
          type: "undefined"
        },
        signalId: 1,
        signalPriority: "user-visible",
        signalAborted: false
      }
    ]);
    assert.deepEqual(
      value.withoutSchedulerYield.flush.map((entry) => entry.type),
      ["run-post-task", "run-post-task"]
    );
    assert.equal(value.withSchedulerYield.pendingPostTaskCount, 0);
    assert.equal(value.withoutSchedulerYield.pendingPostTaskCount, 0);
  }
});

test("scheduler post-task oracle artifact has no local temp path leaks", () => {
  const oracleText = readCheckedSchedulerPostTaskOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /file:\/\/\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-scheduler-post-task-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-scheduler-post-task-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-scheduler-post-task-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedSchedulerPostTaskOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedSchedulerPostTaskOracleText());
});

function operationValue(modeId, scenarioId) {
  const result = observation(modeId, scenarioId).result;
  assert.equal(result.status, "returned", `${modeId}:${scenarioId}`);
  return result.value;
}

function observation(modeId, scenarioId) {
  return findSchedulerPostTaskObservation(oracle, modeId, scenarioId);
}

function descriptorFor(descriptors, key) {
  const entry = descriptors.find((descriptor) => descriptor.key === key);
  if (!entry) {
    throw new Error(`Missing descriptor for ${key}`);
  }
  return entry.descriptor;
}
