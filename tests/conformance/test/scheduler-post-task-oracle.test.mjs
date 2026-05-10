import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findFastReactSchedulerPostTaskComparison,
  findFastReactSchedulerPostTaskObservation,
  findSchedulerPostTaskObservation,
  inspectSchedulerPostTaskPriorityDiagnostics,
  readCheckedSchedulerPostTaskOracle,
  readCheckedSchedulerPostTaskOracleText
} from "../src/scheduler-post-task-oracle.mjs";
import {
  SCHEDULER_POST_TASK_SCENARIO_IDS,
  SCHEDULER_POST_TASK_SCENARIOS
} from "../src/scheduler-post-task-scenarios.mjs";
import {
  SCHEDULER_POST_TASK_FAST_REACT_TARGET,
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
      "exact scheduler npm tarball plus local scheduler implementation copied under an isolated alias into a temporary node_modules tree and probed through isolated Node child processes with controlled Task Scheduling API shims",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per target, scenario, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    timingNormalization:
      "raw wall-clock timestamps are omitted; probes use a controlled window.performance.now shim and record only logical scheduler calls, priority values, delay value categories, abort state, and shouldYield booleans; local package metadata and alias subpath resolution are omitted from behavior comparison"
  });
  assert.deepEqual(oracle.schedulerTarget, SCHEDULER_POST_TASK_TARGET);
  assert.deepEqual(oracle.fastReactTarget, SCHEDULER_POST_TASK_FAST_REACT_TARGET);
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages.scheduler.tarball.integrityVerified, true);
  assert.deepEqual(
    oracle.packages.scheduler.tarball.files,
    EXPECTED_TARBALL_FILES
  );
  assert.equal(
    oracle.packages.fastReactScheduler.behaviorCompatibilityClaimed,
    false
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
    fastReactImplementationComparedToScheduler: true,
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
    localPackageMetadataExcludedFromBehaviorComparison: true,
    localAliasSubpathResolutionExcludedFromBehaviorComparison: true,
    browserTaskOrdering: false,
    rawTiming: false
  });
  assert.deepEqual(
    oracle.implementationComparison.afterWorker125.statusCounts,
    {
      "matched-but-compatibility-not-claimed": 12
    }
  );
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
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      SCHEDULER_POST_TASK_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
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
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
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

test("scheduler post-task oracle records matching Fast React post-task behavior without claiming broad compatibility", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    for (const scenarioId of SCHEDULER_POST_TASK_SCENARIO_IDS) {
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

test("scheduler post-task private priority diagnostics are opt-in and preserve public shape", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const report = inspectSchedulerPostTaskPriorityDiagnostics({
      enableDiagnostics: false,
      nodeEnv: mode.nodeEnv,
      withYield: true
    });

    assert.deepEqual(report.exportKeys, EXPECTED_EXPORT_KEYS);
    for (const entry of report.scheduling) {
      assert.deepEqual(entry.publicNodeKeys, ["_controller"], entry.label);
      assert.equal(entry.privateDiagnosticSymbolPresent, false, entry.label);
      assert.equal(entry.diagnosticsBeforeFlush, null, entry.label);
      assert.equal(entry.diagnosticsAfterFlush, null, entry.label);
    }
    assert.deepEqual(report.cancellation.publicNodeKeys, ["_controller"]);
    assert.equal(report.cancellation.privateDiagnosticSymbolPresent, false);
    assert.equal(report.cancellation.diagnosticsBeforeCancel, null);
    assert.equal(report.cancellation.diagnosticsAfterCancel, null);
    assert.deepEqual(report.continuation.publicNodeKeys, ["_controller"]);
    assert.equal(report.continuation.privateDiagnosticSymbolPresent, false);
    assert.equal(report.continuation.diagnosticsBeforeFlush, null);
    assert.equal(report.continuation.diagnosticsAfterFlush, null);
    assert.deepEqual(report.continuationAbortAfterFallback.publicNodeKeys, [
      "_controller"
    ]);
    assert.equal(
      report.continuationAbortAfterFallback.privateDiagnosticSymbolPresent,
      false
    );
    assert.equal(
      report.continuationAbortAfterFallback.diagnosticsBeforeFlush,
      null
    );
    assert.equal(
      report.continuationAbortAfterFallback.diagnosticsAfterFallback,
      null
    );
    assert.equal(
      report.continuationAbortAfterFallback.diagnosticsAfterCancel,
      null
    );
  }
});

test("scheduler post-task private priority diagnostics capture shimmed TaskController scheduling and cancellation", () => {
  const expectedScheduling = [
    ["immediate", 1, "user-blocking", "number", 0],
    ["user-blocking", 2, "user-blocking", "number", 0],
    ["normal", 3, "user-visible", "undefined", null],
    ["low-delay", 4, "user-visible", "number", 7],
    ["idle-zero-delay", 5, "background", "number", 0],
    ["invalid-delay", 99, "user-visible", "number", 2]
  ];
  const expectedPriorityMappings = [
    [
      "immediate",
      "unstable_ImmediatePriority",
      true,
      "user-blocking",
      "immediate-and-user-blocking-map-to-user-blocking"
    ],
    [
      "user-blocking",
      "unstable_UserBlockingPriority",
      true,
      "user-blocking",
      "immediate-and-user-blocking-map-to-user-blocking"
    ],
    [
      "normal",
      "unstable_NormalPriority",
      true,
      "user-visible",
      "normal-and-low-map-to-user-visible"
    ],
    [
      "low-delay",
      "unstable_LowPriority",
      true,
      "user-visible",
      "normal-and-low-map-to-user-visible"
    ],
    [
      "idle-zero-delay",
      "unstable_IdlePriority",
      true,
      "background",
      "idle-maps-to-background"
    ],
    [
      "invalid-delay",
      "unknown",
      false,
      "user-visible",
      "unknown-priority-defaults-to-user-visible"
    ]
  ];
  const expectedEnvironmentCapabilities = {
    status: "controlled-task-scheduling-api-capability-snapshot",
    hasWindow: true,
    hasWindowPerformance: true,
    hasWindowPerformanceNow: true,
    hasWindowSetTimeout: true,
    hasTaskController: true,
    taskControllerConstructorName: "TaskController",
    hasScheduler: true,
    hasSchedulerPostTask: true,
    hasSchedulerYield: true,
    schedulerOwnKeys: ["postTask", "yield"],
    browserPostTaskCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };

  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const report = inspectSchedulerPostTaskPriorityDiagnostics({
      nodeEnv: mode.nodeEnv,
      withYield: true
    });

    assert.deepEqual(report.exportKeys, EXPECTED_EXPORT_KEYS);
    assert.deepEqual(
      report.scheduling.map((entry) => [
        entry.label,
        entry.diagnosticsBeforeFlush.schedule.priorityLevel,
        entry.diagnosticsBeforeFlush.schedule.postTaskPriority,
        entry.diagnosticsBeforeFlush.schedule.delay.type,
        entry.diagnosticsBeforeFlush.schedule.delay.value
      ]),
      expectedScheduling
    );
    assert.deepEqual(
      report.scheduling.map((entry) => [
        entry.label,
        entry.diagnosticsBeforeFlush.schedule.delay.delayClassification
      ]),
      [
        ["immediate", "zero-delay-task"],
        ["user-blocking", "zero-delay-task"],
        ["normal", "no-delay-value"],
        ["low-delay", "delayed-task"],
        ["idle-zero-delay", "zero-delay-task"],
        ["invalid-delay", "delayed-task"]
      ]
    );
    assert.deepEqual(
      report.scheduling.map((entry) => [
        entry.label,
        entry.diagnosticsBeforeFlush.priorityMapping.schedulerPriorityName,
        entry.diagnosticsBeforeFlush.priorityMapping.recognizedPriority,
        entry.diagnosticsBeforeFlush.priorityMapping.taskControllerPriority,
        entry.diagnosticsBeforeFlush.priorityMapping.mappingReason
      ]),
      expectedPriorityMappings
    );

    for (const entry of report.scheduling) {
      assert.deepEqual(entry.publicNodeKeys, ["_controller"], entry.label);
      assert.equal(entry.privateDiagnosticSymbolPresent, true, entry.label);
      assert.equal(Object.isFrozen(entry.diagnosticsBeforeFlush), true);
      assert.equal(entry.diagnosticsBeforeFlush.compatibilityClaimed, false);
      assert.equal(
        entry.diagnosticsBeforeFlush.browserPostTaskCompatibilityClaimed,
        false
      );
      assert.equal(
        entry.diagnosticsBeforeFlush.publicSchedulerTimingCompatibilityClaimed,
        false
      );
      assert.equal(
        entry.diagnosticsBeforeFlush.environmentCapabilityDiagnostics,
        true
      );
      assert.equal(entry.diagnosticsBeforeFlush.priorityMappingDiagnostics, true);
      assert.deepEqual(
        entry.diagnosticsBeforeFlush.environmentCapabilities,
        expectedEnvironmentCapabilities
      );
      assert.deepEqual(
        entry.diagnosticsBeforeFlush.schedule.environmentCapabilities,
        expectedEnvironmentCapabilities
      );
      assert.deepEqual(
        entry.diagnosticsBeforeFlush.schedule.priorityMapping,
        entry.diagnosticsBeforeFlush.priorityMapping
      );
      assert.equal(
        entry.diagnosticsBeforeFlush.priorityMapping.browserPostTaskCompatibilityClaimed,
        false
      );
      assert.equal(
        entry.diagnosticsBeforeFlush.schedule.status,
        "scheduled-shimmed-task-controller"
      );
      assert.equal(entry.diagnosticsBeforeFlush.diagnosticEventCount, 1);
      assert.equal(
        entry.diagnosticsBeforeFlush.schedule.diagnosticEventIndex,
        0
      );
      assert.equal(
        entry.diagnosticsBeforeFlush.schedule.controller.constructorName,
        "TaskController"
      );
      assert.deepEqual(entry.diagnosticsBeforeFlush.schedule.controller.ownKeys, [
        "priority",
        "signal"
      ]);
      assert.deepEqual(entry.diagnosticsBeforeFlush.schedule.signal.ownKeys, [
        "id",
        "aborted",
        "priority"
      ]);
      assert.equal(entry.diagnosticsBeforeFlush.callbackRuns.length, 0);
      assert.equal(
        entry.diagnosticsBeforeFlush.taskControllerAbortOrderingDiagnostics,
        false
      );
      assert.equal(
        entry.diagnosticsBeforeFlush.continuationFallbackMetadataDiagnostics,
        false
      );
      assert.equal(entry.diagnosticsAfterFlush.diagnosticEventCount, 2);
      assert.equal(entry.diagnosticsAfterFlush.callbackRuns.length, 1);
      assert.equal(
        entry.diagnosticsAfterFlush.callbackRuns[0].diagnosticEventIndex,
        1
      );
      assert.equal(
        entry.diagnosticsAfterFlush.callbackRuns[0].priorityLevel,
        entry.priorityLevel
      );
      assert.equal(
        entry.diagnosticsAfterFlush.callbackRuns[0].postTaskPriority,
        entry.diagnosticsBeforeFlush.schedule.postTaskPriority
      );
      assert.equal(entry.diagnosticsAfterFlush.callbackRuns[0].didTimeout, false);
      assert.equal(
        entry.diagnosticsAfterFlush.callbackRuns[0].shouldYieldAtStart,
        false
      );
      assert.deepEqual(
        entry.diagnosticsAfterFlush.callbackRuns[0].scheduledDelay,
        entry.diagnosticsBeforeFlush.schedule.delay
      );
      assert.equal(
        entry.diagnosticsAfterFlush.callbackRuns[0].continuationStatus,
        "completed-without-continuation"
      );
    }

    assert.deepEqual(
      report.schedulingFlush.map((entry) => [
        entry.type,
        entry.signal.priority,
        entry.signal.aborted
      ]),
      [
        ["run-post-task", "user-blocking", false],
        ["run-post-task", "user-blocking", false],
        ["run-post-task", "user-visible", false],
        ["run-post-task", "user-visible", false],
        ["run-post-task", "background", false],
        ["run-post-task", "user-visible", false]
      ]
    );
    assert.deepEqual(report.schedulingPostFlushEvents, []);

    assert.equal(
      report.cancellation.diagnosticsBeforeCancel.schedule.postTaskPriority,
      "user-visible"
    );
    assert.equal(
      report.cancellation.diagnosticsBeforeCancel.schedule.priorityLevel,
      4
    );
    assert.deepEqual(
      report.cancellation.diagnosticsBeforeCancel.schedule.delay,
      expectedPostTaskDelayDiagnostic("number", 13, "delayed-task")
    );
    assert.equal(report.cancellation.diagnosticsBeforeCancel.cancellation, null);
    assert.equal(report.cancellation.cancelReturnType, "undefined");
    assert.equal(
      report.cancellation.diagnosticsAfterCancel.shimmedTaskControllerCancellation,
      true
    );
    assert.equal(
      report.cancellation.diagnosticsAfterCancel.taskControllerAbortOrderingDiagnostics,
      true
    );
    assert.equal(report.cancellation.diagnosticsAfterCancel.diagnosticEventCount, 3);
    assert.equal(
      report.cancellation.diagnosticsAfterCancel.delayAbortOrderingDiagnostics,
      true
    );
    assert.equal(
      report.cancellation.diagnosticsAfterCancel
        .fallbackEnvironmentClassificationDiagnostics,
      true
    );
    assert.equal(
      report.cancellation.diagnosticsAfterCancel.cancellation.status,
      "cancelled-shimmed-task-controller"
    );
    assert.deepEqual(
      report.cancellation.diagnosticsAfterCancel.cancellation.delayAbortOrdering,
      expectedDelayAbortOrdering({
        requestEventIndex: 1,
        completionEventIndex: 2,
        delay: expectedPostTaskDelayDiagnostic(
          "number",
          13,
          "delayed-task"
        ),
        priorityLevel: 4,
        postTaskPriority: "user-visible",
        signalId: 7,
        signalPriority: "user-visible",
        withYield: true,
        continuationStatus: expectedContinuationStatus({
          status: "no-callback-runs-before-abort",
          callbackRunCount: 0,
          continuationFallbackCount: 0,
          lastCallbackRunIndex: null,
          lastCallbackContinuationStatus: null,
          lastContinuationFallbackIndex: null
        })
      })
    );
    assert.deepEqual(
      report.cancellation.diagnosticsAfterCancel.cancellation.abortMetadata,
      {
        status: "shimmed-task-controller-abort-metadata",
        controller: {
          type: "object",
          constructorName: "TaskController",
          ownKeys: ["priority", "signal"]
        },
        signalSource: "node._controller.signal",
        signalAbortedBeforeAbort: false,
        signalAbortedAfterAbort: true,
        callbackRunCountBeforeAbort: 0,
        callbackRunCountAfterAbort: 0,
        continuationFallbackCountBeforeAbort: 0,
        continuationFallbackCountAfterAbort: 0,
        abortMarkedSignalAborted: true,
        browserPostTaskCompatibilityClaimed: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        compatibilityClaimed: false
      }
    );
    assert.deepEqual(
      report.cancellation.diagnosticsAfterCancel.cancellation.abortOrdering,
      {
        status: "task-controller-abort-observed-after-abort-call",
        requestEventIndex: 1,
        completionEventIndex: 2,
        signalAbortedBeforeAbort: false,
        signalAbortedAfterAbort: true,
        callbackRunCountAtRequest: 0,
        callbackRunCountAtCompletion: 0,
        continuationFallbackCountAtRequest: 0,
        continuationFallbackCountAtCompletion: 0
      }
    );
    assert.equal(
      report.cancellation.diagnosticsAfterCancel.cancellation.signalBeforeAbort
        .aborted,
      false
    );
    assert.equal(
      report.cancellation.diagnosticsAfterCancel.cancellation.signalAfterAbort
        .aborted,
      true
    );
    assert.equal(
      report.cancellation.diagnosticsAfterCancel.cancellation.abortObserved,
      true
    );
    assert.equal(
      report.cancellation.diagnosticsAfterCancel.cancellation.signal.aborted,
      true
    );
    assert.deepEqual(report.cancellation.cancellationEvents, [
      {
        type: "abort",
        priority: "user-visible",
        signalId: 7
      }
    ]);
    assert.deepEqual(report.cancellation.cancellationFlush, [
      {
        type: "skip-aborted",
        signal: {
          id: 7,
          priority: "user-visible",
          aborted: true
        }
      }
    ]);
  }
});

test("scheduler post-task private priority diagnostics capture continuation fallbacks without browser compatibility claims", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    for (const withYield of [true, false]) {
      const report = inspectSchedulerPostTaskPriorityDiagnostics({
        nodeEnv: mode.nodeEnv,
        withYield
      });
      const expectedFallback = withYield
        ? "scheduler.yield"
        : "scheduler.postTask";

      assert.deepEqual(report.continuation.publicNodeKeys, ["_controller"]);
      assert.equal(report.continuation.privateDiagnosticSymbolPresent, true);
      assert.equal(
        report.continuation.diagnosticsBeforeFlush.continuationFallbacks.length,
        0
      );
      assert.deepEqual(report.continuation.events, [
        {
          label: "start",
          currentPriorityLevel: 3
        },
        {
          label: "continuation",
          currentPriorityLevel: 3
        }
      ]);
      assert.deepEqual(
        report.continuation.flush.map((entry) => entry.type),
        withYield
          ? ["run-post-task"]
          : ["run-post-task", "run-post-task"]
      );
      assert.deepEqual(
        report.continuation.postFlushEvents.map((entry) => entry.type),
        withYield ? ["yield", "yield.then"] : ["postTask"]
      );

      const diagnostics = report.continuation.diagnosticsAfterFlush;
      assert.equal(diagnostics.compatibilityClaimed, false);
      assert.equal(diagnostics.browserPostTaskCompatibilityClaimed, false);
      assert.equal(diagnostics.browserTaskOrderingCompatibilityClaimed, false);
      assert.equal(
        diagnostics.publicSchedulerTimingCompatibilityClaimed,
        false
      );
      assert.equal(diagnostics.environmentCapabilityDiagnostics, true);
      assert.equal(diagnostics.priorityMappingDiagnostics, true);
      assert.equal(
        diagnostics.environmentCapabilities.hasSchedulerYield,
        withYield
      );
      assert.equal(diagnostics.environmentCapabilities.hasSchedulerPostTask, true);
      assert.deepEqual(
        diagnostics.priorityMapping,
        diagnostics.schedule.priorityMapping
      );
      assert.equal(diagnostics.continuationFallbackDiagnostics, true);
      assert.equal(diagnostics.continuationFallbackMetadataDiagnostics, true);
      assert.equal(diagnostics.continuationSignalValidationDiagnostics, true);
      assert.equal(diagnostics.continuationAbortOrderingDiagnostics, false);
      assert.equal(
        diagnostics.fallbackEnvironmentClassificationDiagnostics,
        true
      );
      assert.equal(diagnostics.taskControllerAbortOrderingDiagnostics, false);
      assert.equal(diagnostics.diagnosticEventCount, 4);
      assert.equal(diagnostics.callbackRuns.length, 2);
      assert.deepEqual(
        diagnostics.callbackRuns.map((entry) => [
          entry.runIndex,
          entry.diagnosticEventIndex,
          entry.priorityLevel,
          entry.postTaskPriority,
          entry.currentPriorityLevel,
          entry.signal.priority,
          entry.scheduledDelay.delayClassification,
          entry.continuationStatus,
          entry.returnedContinuationType,
          entry.continuationFallbackIndex
        ]),
        [
          [
            0,
            1,
            3,
            "user-visible",
            3,
            "user-visible",
            "zero-delay-task",
            "scheduled-continuation-fallback",
            "function",
            0
          ],
          [
            1,
            3,
            3,
            "user-visible",
            3,
            "user-visible",
            "zero-delay-task",
            "completed-without-continuation",
            "undefined",
            null
          ]
        ]
      );
      assert.deepEqual(
        diagnostics.callbackRuns[0].fallbackEnvironmentClassification,
        expectedFallbackEnvironmentClassification(withYield)
      );
      assert.equal(
        diagnostics.callbackRuns[1].fallbackEnvironmentClassification,
        null
      );
      assert.deepEqual(diagnostics.continuationFallbacks, [
        {
          status: "scheduled-shimmed-post-task-continuation",
          diagnosticEventIndex: 2,
          continuationIndex: 0,
          sourceCallbackRunIndex: 0,
          callbackRunCountAtSchedule: 1,
          fallback: expectedFallback,
          priorityLevel: 3,
          postTaskPriority: "user-visible",
          continuationOptions: {
            hasSignalProperty: true,
            hasDelayProperty: false,
            ownKeys: ["signal"],
            signalMatchesTaskController: true,
            signalAbortedAtSchedule: false
          },
          continuationStatus: "scheduled-continuation-fallback",
          continuationMetadata: {
            status: "shimmed-post-task-continuation-metadata",
            continuationStatus: "scheduled-continuation-fallback",
            selectedFallback: expectedFallback,
            schedulerYieldAvailableAtSchedule: withYield,
            schedulerPostTaskAvailableAtSchedule: true,
            sourceCallbackRunIndex: 0,
            callbackRunCountAtSchedule: 1,
            reusesOriginalSignal: true,
            signalAbortedAtSchedule: false,
            signalValidationStatus:
              "validated-shimmed-post-task-continuation-signal",
            signalValidationRejectionReason: null,
            abortOrderingStatus:
              "continuation-abort-ordering-pending-abort-call",
            fallbackEnvironmentClassification:
              expectedFallbackEnvironmentClassification(withYield)
                .classification,
            fallbackEnvironmentKind: "controlled-task-scheduling-api-shim",
            browserPostTaskCompatibilityClaimed: false,
            publicSchedulerTimingCompatibilityClaimed: false,
            compatibilityClaimed: false
          },
          fallbackEnvironmentClassification:
            expectedFallbackEnvironmentClassification(withYield),
          signalValidation: expectedContinuationSignalValidation(
            8,
            "user-visible"
          ),
          abortOrdering: expectedContinuationAbortOrderingPending({
            signalId: 8,
            signalPriority: "user-visible"
          }),
          reusesOriginalSignal: true,
          signalAtSchedule: {
            id: 8,
            priority: "user-visible",
            aborted: false,
            ownKeys: ["id", "aborted", "priority"]
          },
          signal: {
            id: 8,
            priority: "user-visible",
            aborted: false,
            ownKeys: ["id", "aborted", "priority"]
          },
          browserPostTaskCompatibilityClaimed: false,
          publicSchedulerTimingCompatibilityClaimed: false,
          compatibilityClaimed: false
        }
      ]);
    }
  }
});

test("scheduler post-task private priority diagnostics capture abort ordering around queued continuation fallback", () => {
  for (const mode of SCHEDULER_POST_TASK_PROBE_MODES) {
    const report = inspectSchedulerPostTaskPriorityDiagnostics({
      nodeEnv: mode.nodeEnv,
      withYield: false
    });
    const flow = report.continuationAbortAfterFallback;

    assert.deepEqual(flow.publicNodeKeys, ["_controller"]);
    assert.equal(flow.privateDiagnosticSymbolPresent, true);
    assert.deepEqual(
      flow.initialFlush.map((entry) => entry.type),
      ["run-post-task"]
    );
    assert.deepEqual(flow.fallbackEvents, [
      {
        type: "postTask",
        hasDelayProperty: false,
        delay: {
          type: "undefined",
          value: null
        },
        signal: {
          id: 9,
          priority: "user-visible",
          aborted: false
        }
      }
    ]);
    assert.deepEqual(flow.events, [
      {
        label: "start",
        currentPriorityLevel: 3
      }
    ]);

    const afterFallback = flow.diagnosticsAfterFallback;
    assert.equal(afterFallback.diagnosticEventCount, 3);
    assert.equal(afterFallback.continuationFallbackMetadataDiagnostics, true);
    assert.equal(afterFallback.continuationSignalValidationDiagnostics, true);
    assert.equal(afterFallback.continuationAbortOrderingDiagnostics, false);
    assert.equal(afterFallback.taskControllerAbortOrderingDiagnostics, false);
    assert.deepEqual(
      afterFallback.callbackRuns.map((entry) => [
        entry.runIndex,
        entry.diagnosticEventIndex
      ]),
      [[0, 1]]
    );
    assert.deepEqual(
      afterFallback.continuationFallbacks.map((entry) => [
        entry.continuationIndex,
        entry.diagnosticEventIndex,
        entry.sourceCallbackRunIndex,
        entry.callbackRunCountAtSchedule,
        entry.fallback,
        entry.continuationStatus,
        entry.fallbackEnvironmentClassification.classification,
        entry.continuationOptions.signalMatchesTaskController,
        entry.continuationOptions.signalAbortedAtSchedule
      ]),
      [
        [
          0,
          2,
          0,
          1,
          "scheduler.postTask",
          "scheduled-continuation-fallback",
          "controlled-shim-scheduler-post-task-continuation",
          true,
          false
        ]
      ]
    );

    const afterCancel = flow.diagnosticsAfterCancel;
    assert.equal(afterCancel.compatibilityClaimed, false);
    assert.equal(afterCancel.browserPostTaskCompatibilityClaimed, false);
    assert.equal(afterCancel.browserTaskOrderingCompatibilityClaimed, false);
    assert.equal(
      afterCancel.publicSchedulerTimingCompatibilityClaimed,
      false
    );
    assert.equal(afterCancel.taskControllerAbortOrderingDiagnostics, true);
    assert.equal(afterCancel.continuationFallbackMetadataDiagnostics, true);
    assert.equal(afterCancel.continuationSignalValidationDiagnostics, true);
    assert.equal(afterCancel.continuationAbortOrderingDiagnostics, true);
    assert.equal(afterCancel.delayAbortOrderingDiagnostics, true);
    assert.equal(
      afterCancel.fallbackEnvironmentClassificationDiagnostics,
      true
    );
    assert.equal(afterCancel.diagnosticEventCount, 5);
    assert.deepEqual(
      afterCancel.cancellation.delayAbortOrdering,
      expectedDelayAbortOrdering({
        requestEventIndex: 3,
        completionEventIndex: 4,
        delay: expectedPostTaskDelayDiagnostic("number", 0, "zero-delay-task"),
        priorityLevel: 3,
        postTaskPriority: "user-visible",
        signalId: 9,
        signalPriority: "user-visible",
        withYield: false,
        continuationStatus: expectedContinuationStatus({
          status: "continuation-fallback-scheduled",
          callbackRunCount: 1,
          continuationFallbackCount: 1,
          lastCallbackRunIndex: 0,
          lastCallbackContinuationStatus: "scheduled-continuation-fallback",
          lastContinuationFallbackIndex: 0
        })
      })
    );
    assert.deepEqual(afterCancel.cancellation.abortMetadata, {
      status: "shimmed-task-controller-abort-metadata",
      controller: {
        type: "object",
        constructorName: "TaskController",
        ownKeys: ["priority", "signal"]
      },
      signalSource: "node._controller.signal",
      signalAbortedBeforeAbort: false,
      signalAbortedAfterAbort: true,
      callbackRunCountBeforeAbort: 1,
      callbackRunCountAfterAbort: 1,
      continuationFallbackCountBeforeAbort: 1,
      continuationFallbackCountAfterAbort: 1,
      abortMarkedSignalAborted: true,
      browserPostTaskCompatibilityClaimed: false,
      publicSchedulerTimingCompatibilityClaimed: false,
      compatibilityClaimed: false
    });
    assert.deepEqual(afterCancel.cancellation.abortOrdering, {
      status: "task-controller-abort-observed-after-abort-call",
      requestEventIndex: 3,
      completionEventIndex: 4,
      signalAbortedBeforeAbort: false,
      signalAbortedAfterAbort: true,
      callbackRunCountAtRequest: 1,
      callbackRunCountAtCompletion: 1,
      continuationFallbackCountAtRequest: 1,
      continuationFallbackCountAtCompletion: 1
    });
    assert.deepEqual(
      afterCancel.continuationFallbacks[0].abortOrdering,
      expectedContinuationAbortOrderingObserved({
        requestEventIndex: 3,
        completionEventIndex: 4,
        signalId: 9,
        signalPriority: "user-visible"
      })
    );
    assert.deepEqual(
      afterCancel.continuationFallbacks[0].signalValidation,
      expectedContinuationSignalValidation(9, "user-visible")
    );
    assert.deepEqual(flow.cancellationEvents, [
      {
        type: "abort",
        priority: "user-visible",
        signalId: 9
      }
    ]);
    assert.deepEqual(flow.finalFlush, [
      {
        type: "skip-aborted",
        signal: {
          id: 9,
          priority: "user-visible",
          aborted: true
        }
      }
    ]);
    assert.equal(
      flow.diagnosticsAfterFinalFlush.callbackRuns.length,
      1
    );
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

function expectedPostTaskDelayDiagnostic(type, value, delayClassification) {
  return {
    hasDelayProperty: true,
    type,
    value,
    normalizedDelayType: type,
    normalizedDelayValue: value,
    delayClassification,
    browserPostTaskCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function expectedFallbackEnvironmentClassification(withYield) {
  return {
    status: "controlled-shim-fallback-environment-classification",
    environmentKind: "controlled-task-scheduling-api-shim",
    classification: withYield
      ? "controlled-shim-scheduler-yield-continuation"
      : "controlled-shim-scheduler-post-task-continuation",
    selectedFallback: withYield ? "scheduler.yield" : "scheduler.postTask",
    hasSchedulerPostTask: true,
    hasSchedulerYield: withYield,
    usesSchedulerYield: withYield,
    usesSchedulerPostTaskFallback: !withYield,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function expectedContinuationSignalValidation(signalId, signalPriority) {
  return {
    status: "validated-shimmed-post-task-continuation-signal",
    signalSource: "continuationOptions.signal",
    hasSignalProperty: true,
    hasSignal: true,
    signalMatchesTaskController: true,
    signalId,
    signalPriority,
    signalAbortedAtSchedule: false,
    signalOwnKeys: ["id", "aborted", "priority"],
    rejectionReason: null,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function expectedContinuationAbortOrderingPending({
  signalId,
  signalPriority
}) {
  return {
    status: "continuation-abort-ordering-pending-abort-call",
    requestEventIndex: null,
    completionEventIndex: null,
    continuationIndex: 0,
    sourceCallbackRunIndex: 0,
    callbackRunCountAtSchedule: 1,
    callbackRunCountAtAbortRequest: null,
    callbackRunCountAtAbortCompletion: null,
    continuationFallbackCountAtSchedule: 1,
    continuationFallbackCountAtAbortRequest: null,
    continuationFallbackCountAtAbortCompletion: null,
    signalAtSchedule: expectedPostTaskSignal(signalId, signalPriority, false),
    signalBeforeAbort: null,
    signalAfterAbort: null,
    abortSignalStateAfterAbort: null,
    cancellationStatus: null,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function expectedContinuationAbortOrderingObserved({
  requestEventIndex,
  completionEventIndex,
  signalId,
  signalPriority
}) {
  return {
    status: "continuation-abort-ordering-observed-after-abort-call",
    requestEventIndex,
    completionEventIndex,
    continuationIndex: 0,
    sourceCallbackRunIndex: 0,
    callbackRunCountAtSchedule: 1,
    callbackRunCountAtAbortRequest: 1,
    callbackRunCountAtAbortCompletion: 1,
    continuationFallbackCountAtSchedule: 1,
    continuationFallbackCountAtAbortRequest: 1,
    continuationFallbackCountAtAbortCompletion: 1,
    signalAtSchedule: expectedPostTaskSignal(signalId, signalPriority, false),
    signalBeforeAbort: expectedPostTaskSignal(signalId, signalPriority, false),
    signalAfterAbort: expectedPostTaskSignal(signalId, signalPriority, true),
    abortSignalStateAfterAbort: "aborted",
    cancellationStatus: "cancelled-shimmed-task-controller",
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function expectedContinuationStatus({
  status,
  callbackRunCount,
  continuationFallbackCount,
  lastCallbackRunIndex,
  lastCallbackContinuationStatus,
  lastContinuationFallbackIndex
}) {
  return {
    status,
    callbackRunCount,
    continuationFallbackCount,
    lastCallbackRunIndex,
    lastCallbackContinuationStatus,
    lastContinuationFallbackIndex,
    browserPostTaskCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function expectedDelayAbortOrdering({
  requestEventIndex,
  completionEventIndex,
  delay,
  priorityLevel,
  postTaskPriority,
  signalId,
  signalPriority,
  withYield,
  continuationStatus
}) {
  const signalBeforeAbort = expectedPostTaskSignal(
    signalId,
    signalPriority,
    false
  );
  const signalAfterAbort = expectedPostTaskSignal(
    signalId,
    signalPriority,
    true
  );

  return {
    status: "delay-abort-ordering-observed-after-abort-call",
    requestEventIndex,
    completionEventIndex,
    scheduledDelay: delay,
    scheduledPriority: {
      priorityLevel,
      postTaskPriority
    },
    signalBeforeAbort,
    signalAfterAbort,
    abortSignalStateAfterAbort: "aborted",
    continuationStatusAtRequest: continuationStatus,
    continuationStatusAtCompletion: continuationStatus,
    fallbackEnvironmentClassification:
      expectedFallbackEnvironmentClassification(withYield),
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function expectedPostTaskSignal(id, priority, aborted) {
  return {
    id,
    priority,
    aborted,
    ownKeys: ["id", "aborted", "priority"]
  };
}

function operationValue(modeId, scenarioId) {
  const result = observation(modeId, scenarioId).result;
  assert.equal(result.status, "returned", `${modeId}:${scenarioId}`);
  return result.value;
}

function observation(modeId, scenarioId) {
  return findSchedulerPostTaskObservation(oracle, modeId, scenarioId);
}

function fastReactObservation(modeId, scenarioId) {
  return findFastReactSchedulerPostTaskObservation(oracle, modeId, scenarioId);
}

function comparison(modeId, scenarioId) {
  return findFastReactSchedulerPostTaskComparison(oracle, modeId, scenarioId);
}

function descriptorFor(descriptors, key) {
  const entry = descriptors.find((descriptor) => descriptor.key === key);
  if (!entry) {
    throw new Error(`Missing descriptor for ${key}`);
  }
  return entry.descriptor;
}
