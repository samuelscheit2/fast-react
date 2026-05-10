import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
  SCHEDULER_MOCK_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS_EXPORT,
  findFastReactSchedulerMockComparison,
  findFastReactSchedulerMockObservation,
  findSchedulerMockObservation,
  readCheckedSchedulerMockOracle,
  readCheckedSchedulerMockOracleText,
  readSchedulerMockPrivateActQueueFlushDiagnostics
} from "../src/scheduler-mock-oracle.mjs";

const oracle = readCheckedSchedulerMockOracle();
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const schedulerMockWorkspaceEntrypoint = "packages/scheduler/unstable_mock.js";
const schedulerMockWorkspaceEntrypoints = [
  schedulerMockWorkspaceEntrypoint,
  "packages/scheduler/cjs/scheduler-unstable_mock.development.js",
  "packages/scheduler/cjs/scheduler-unstable_mock.production.js"
];
const privateActDispatcherGateModule =
  "packages/react/private-act-dispatcher-gate.js";

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

const REACT_TEST_RENDERER_SCHEDULER_FLUSH_HELPER_METADATA = [
  ["unstable_flushAll", { type: "function", name: "", length: 0 }],
  [
    "unstable_flushAllWithoutAsserting",
    {
      type: "function",
      name: "unstable_flushAllWithoutAsserting",
      length: 0
    }
  ],
  ["unstable_flushExpired", { type: "function", name: "", length: 0 }],
  ["unstable_flushNumberOfYields", { type: "function", name: "", length: 1 }],
  ["unstable_flushUntilNextPaint", { type: "function", name: "", length: 0 }]
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
      "exact scheduler npm tarball plus local scheduler implementation copied under an isolated alias into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per target, scenario, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    timingNormalization:
      "scheduler/unstable_mock virtual time is recorded directly; raw wall-clock timestamps and local filesystem paths are omitted; local package metadata is observed but omitted from behavior comparison"
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
    localPackageMetadataExcludedFromBehaviorComparison: true
  });
  assert.deepEqual(
    oracle.implementationComparison.afterWorker120.statusCounts,
    {
      "matched-but-compatibility-not-claimed": 18
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

test("scheduler mock oracle exposes react-test-renderer flush helper metadata from checked export rows", () => {
  assert.equal(oracle.coverage.flushHelpers, true);
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    const schedulerValue = operationValue(
      mode.id,
      "scheduler-mock-export-shape"
    );
    const fastReactValue = fastReactOperationValue(
      mode.id,
      "scheduler-mock-export-shape"
    );

    const scenarioComparison = comparison(
      mode.id,
      "scheduler-mock-export-shape"
    );
    assert.equal(
      scenarioComparison.status,
      "matched-but-compatibility-not-claimed"
    );
    assert.equal(scenarioComparison.compatibilityClaimed, false);

    for (const [key, expectedValue] of
      REACT_TEST_RENDERER_SCHEDULER_FLUSH_HELPER_METADATA) {
      assert.equal(schedulerValue.exportKeys.includes(key), true, key);
      assert.equal(fastReactValue.exportKeys.includes(key), true, key);

      const schedulerDescriptor = descriptorFor(
        schedulerValue.descriptors,
        key
      );
      const fastReactDescriptor = descriptorFor(
        fastReactValue.descriptors,
        key
      );

      assert.equal(schedulerDescriptor.kind, "data", key);
      assert.equal(schedulerDescriptor.configurable, true, key);
      assert.equal(schedulerDescriptor.enumerable, true, key);
      assert.equal(schedulerDescriptor.writable, true, key);
      assert.deepEqual(schedulerDescriptor.value, expectedValue, key);
      assert.deepEqual(fastReactDescriptor, schedulerDescriptor, key);
    }
  }
});

test("scheduler mock private act queue diagnostics drain only accepted internal test queues", () => {
  const reactGate = loadFreshWorkspaceModule(privateActDispatcherGateModule);

  for (const nodeEnv of ["development", "production"]) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    assert.equal(
      Object.keys(Scheduler).includes(
        SCHEDULER_MOCK_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS_EXPORT
      ),
      false,
      nodeEnv
    );
    assert.equal(
      Reflect.ownKeys(Scheduler).includes(
        SCHEDULER_MOCK_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS_EXPORT
      ),
      false,
      nodeEnv
    );

    const diagnostics = readSchedulerMockPrivateActQueueFlushDiagnostics(
      Scheduler
    );
    assertPrivateActQueueFlushDiagnostics(diagnostics, nodeEnv);

    for (const [key] of REACT_TEST_RENDERER_SCHEDULER_FLUSH_HELPER_METADATA) {
      assert.equal(
        Scheduler[key][
          SCHEDULER_MOCK_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS_EXPORT
        ],
        diagnostics,
        `${nodeEnv}:${key}`
      );
      assert.equal(
        Object.getOwnPropertyDescriptor(
          Scheduler[key],
          SCHEDULER_MOCK_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS_EXPORT
        ).enumerable,
        false,
        `${nodeEnv}:${key}`
      );
    }

    Scheduler.reset();
    const scheduledEvents = [];
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      () => {
        scheduledEvents.push("mock-scheduler-callback");
      }
    );

    const queue = reactGate.createInternalActQueueTestQueue([
      reactGate.createInternalActQueueTestTask({
        label: "root-schedule",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "RootSchedule"
      }),
      reactGate.createInternalActQueueTestTask({
        label: "scheduler-callback",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "SchedulerCallback",
        continuationStatus: "PendingContinuation"
      })
    ]);
    assert.equal(reactGate.isAcceptedInternalActQueueTestQueue(queue), true);

    assert.deepEqual(
      diagnostics.describeAcceptedInternalActQueue(queue),
      {
        status: "accepted-internal-test-queue",
        accepted: true,
        rejectionReason: null,
        queueKind: reactGate.internalTestQueueKind,
        pendingCount: 2,
        drainsAcceptedInternalTestQueues: true,
        executesBrandedInternalTestCallbacks: true,
        recordsBrandedInternalTestContinuations: true,
        executesBrandedInternalTestContinuations: true,
        drainsPublicSchedulerTaskQueue: false,
        drainsPublicReactActQueue: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        publicReactActCompatibilityClaimed: false,
        executesQueuedWork: false,
        executesEffects: false
      },
      nodeEnv
    );

    const report = diagnostics.drainAcceptedInternalActQueue(queue);
    assert.equal(report.status, "drained-accepted-internal-test-queue");
    assert.equal(report.pendingBefore, 2);
    assert.equal(report.drainedCount, 2);
    assert.equal(report.executedCallbackCount, 0);
    assert.equal(report.recordedContinuationCount, 0);
    assert.equal(report.executedContinuationCount, 0);
    assert.equal(report.remainingCount, 0);
    assert.deepEqual(report.recordedContinuations, []);
    assert.deepEqual(report.executedContinuations, []);
    assert.deepEqual(
      report.drainedRecords.map((record) => [
        record.index,
        record.label,
        record.recordKind,
        record.taskKind,
        record.continuationStatus,
        record.callbackStatus,
        record.callback,
        record.returnedContinuation,
        record.executesQueuedWork,
        record.executesEffects
      ]),
      [
        [
          0,
          "root-schedule",
          "SchedulerActQueueRequest",
          "RootSchedule",
          "NoContinuation",
          "no-callback",
          null,
          null,
          false,
          false
        ],
        [
          1,
          "scheduler-callback",
          "SchedulerActQueueRequest",
          "SchedulerCallback",
          "PendingContinuation",
          "no-callback",
          null,
          null,
          false,
          false
        ]
      ],
      nodeEnv
    );
    assert.equal(report.mockSchedulerPendingWorkBefore, true, nodeEnv);
    assert.equal(report.mockSchedulerPendingWorkAfter, true, nodeEnv);
    assert.equal(report.mockSchedulerNowBefore, 0, nodeEnv);
    assert.equal(report.mockSchedulerNowAfter, 0, nodeEnv);
    assert.equal(report.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(report.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(
      report.executesBrandedInternalTestCallbacks,
      true,
      nodeEnv
    );
    assert.equal(
      report.recordsBrandedInternalTestContinuations,
      true,
      nodeEnv
    );
    assert.equal(
      report.executesBrandedInternalTestContinuations,
      true,
      nodeEnv
    );
    assert.equal(
      report.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(report.publicReactActCompatibilityClaimed, false, nodeEnv);
    assert.equal(report.executesQueuedWork, false, nodeEnv);
    assert.equal(report.executesEffects, false, nodeEnv);
    assert.equal(queue.records.length, 0, nodeEnv);
    assert.deepEqual(scheduledEvents, [], nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    const privateCallbackEvents = [];
    const privateContinuation = reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        privateCallbackEvents.push([
          "private-continuation",
          didTimeout,
          Scheduler.unstable_now()
        ]);
      },
      {
        label: "private-continuation"
      }
    );
    const privateCallback = reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        privateCallbackEvents.push([
          "private-callback",
          didTimeout,
          Scheduler.unstable_now()
        ]);
        return privateContinuation;
      },
      {
        label: "private-callback"
      }
    );
    const callbackQueue = reactGate.createInternalActQueueTestQueue([
      reactGate.createInternalActQueueTestTask({
        label: "executable-scheduler-callback",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "SchedulerCallback",
        continuationStatus: "PendingContinuation",
        callback: privateCallback
      })
    ]);
    assert.equal(
      reactGate.isAcceptedInternalActQueueTestQueue(callbackQueue),
      true,
      nodeEnv
    );

    const callbackReport =
      diagnostics.drainAcceptedInternalActQueue(callbackQueue);
    assert.equal(callbackReport.status, "drained-accepted-internal-test-queue");
    assert.equal(callbackReport.pendingBefore, 1, nodeEnv);
    assert.equal(callbackReport.drainedCount, 1, nodeEnv);
    assert.equal(callbackReport.executedCallbackCount, 1, nodeEnv);
    assert.equal(callbackReport.recordedContinuationCount, 1, nodeEnv);
    assert.equal(callbackReport.executedContinuationCount, 1, nodeEnv);
    assert.equal(callbackReport.remainingCount, 0, nodeEnv);
    assert.deepEqual(
      privateCallbackEvents,
      [
        ["private-callback", false, 0],
        ["private-continuation", false, 0]
      ],
      nodeEnv
    );
    assert.deepEqual(
      callbackReport.drainedRecords[0],
      {
        index: 0,
        label: "executable-scheduler-callback",
        recordKind: "SchedulerActQueueRequest",
        taskKind: "SchedulerCallback",
        continuationStatus: "PendingContinuation",
        callbackStatus: "executed-branded-internal-test-callback",
        callback: {
          kind: reactGate.internalTestCallbackKind,
          label: "private-callback",
          executesQueuedWork: false,
          executesEffects: false
        },
        returnedContinuation: {
          sourceIndex: 0,
          sourceLabel: "executable-scheduler-callback",
          status: "executed-branded-internal-test-continuation",
          continuation: {
            kind: reactGate.internalTestCallbackKind,
            label: "private-continuation",
            executesQueuedWork: false,
            executesEffects: false
          },
          returnedContinuation: null,
          executesQueuedWork: false,
          executesEffects: false
        },
        executesQueuedWork: false,
        executesEffects: false
      },
      nodeEnv
    );
    assert.deepEqual(
      callbackReport.recordedContinuations,
      [callbackReport.drainedRecords[0].returnedContinuation],
      nodeEnv
    );
    assert.deepEqual(
      callbackReport.executedContinuations,
      [callbackReport.drainedRecords[0].returnedContinuation],
      nodeEnv
    );
    assert.equal(callbackReport.mockSchedulerPendingWorkBefore, true, nodeEnv);
    assert.equal(callbackReport.mockSchedulerPendingWorkAfter, true, nodeEnv);
    assert.equal(callbackReport.mockSchedulerNowBefore, 0, nodeEnv);
    assert.equal(callbackReport.mockSchedulerNowAfter, 0, nodeEnv);
    assert.equal(callbackReport.drainsPublicSchedulerTaskQueue, false, nodeEnv);
    assert.equal(callbackReport.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(
      callbackReport.executesBrandedInternalTestContinuations,
      true,
      nodeEnv
    );
    assert.equal(callbackReport.executesQueuedWork, false, nodeEnv);
    assert.equal(callbackReport.executesEffects, false, nodeEnv);
    assert.equal(callbackQueue.records.length, 0, nodeEnv);
    assert.deepEqual(scheduledEvents, [], nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), true, nodeEnv);

    let unbrandedContinuationInvoked = false;
    const unbrandedContinuationQueue =
      reactGate.createInternalActQueueTestQueue([
        reactGate.createInternalActQueueTestTask({
          label: "returns-unbranded-continuation",
          continuationStatus: "PendingContinuation",
          callback: reactGate.createInternalActQueueTestCallback(
            () =>
              function unbrandedContinuation() {
                unbrandedContinuationInvoked = true;
              },
            {
              label: "returns-unbranded-continuation"
            }
          )
        })
      ]);
    assert.throws(
      () =>
        diagnostics.drainAcceptedInternalActQueue(
          unbrandedContinuationQueue
        ),
      (error) => {
        assert.equal(
          error.name,
          "FastReactSchedulerPrivateActQueueFlushError"
        );
        assert.equal(
          error.code,
          "FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_REJECTED"
        );
        assert.match(
          error.message,
          /record-0-continuation-missing-internal-brand/u
        );
        return true;
      },
      nodeEnv
    );
    assert.equal(unbrandedContinuationInvoked, false, nodeEnv);

    assert.equal(Scheduler.unstable_flushAllWithoutAsserting(), true, nodeEnv);
    assert.deepEqual(scheduledEvents, ["mock-scheduler-callback"], nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), false, nodeEnv);

    const unbrandedCallbackTask = {
      kind: reactGate.internalTestTaskKind,
      version: reactGate.internalTestQueueVersion,
      compatibilityTarget: "react@19.2.6",
      schedulerCompatibilityTarget: "scheduler@0.27.0",
      recordKind: "SchedulerActQueueRequest",
      taskKind: "SchedulerCallback",
      continuationStatus: "NoContinuation",
      label: "unbranded-callback",
      callback() {},
      publicCompatibilityClaimed: false,
      publicSchedulerTimingCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false,
      executesQueuedWork: false,
      executesEffects: false
    };
    Object.defineProperty(
      unbrandedCallbackTask,
      Symbol.for(reactGate.internalTestTaskKind),
      {
        value: true
      }
    );
    const unbrandedCallbackQueue =
      reactGate.createInternalActQueueTestQueue([]);
    unbrandedCallbackQueue.records.push(unbrandedCallbackTask);

    for (const rejectedQueue of [
      [],
      reactGate.createActQueueMetadata(),
      unbrandedCallbackQueue,
      {
        id: 1,
        callback() {},
        priorityLevel: Scheduler.unstable_NormalPriority,
        startTime: 0,
        expirationTime: 5000,
        sortIndex: 5000
      },
      {
        kind: reactGate.internalTestQueueKind,
        version: reactGate.internalTestQueueVersion,
        compatibilityTarget: "react@19.2.6",
        schedulerCompatibilityTarget: "scheduler@0.27.0",
        records: []
      }
    ]) {
      assert.equal(
        diagnostics.describeAcceptedInternalActQueue(rejectedQueue).accepted,
        false,
        nodeEnv
      );
      assert.throws(
        () => diagnostics.drainAcceptedInternalActQueue(rejectedQueue),
        (error) => {
          assert.equal(
            error.name,
            "FastReactSchedulerPrivateActQueueFlushError"
          );
          assert.equal(
            error.code,
            "FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_REJECTED"
          );
          assert.equal(error.entrypoint, "scheduler/unstable_mock");
          assert.equal(error.compatibilityTarget, "scheduler@0.27.0");
          assert.equal(
            error.publicSchedulerTimingCompatibilityClaimed,
            false
          );
          assert.equal(error.publicReactActCompatibilityClaimed, false);
          return true;
        },
        nodeEnv
      );
    }
  }
});

test("scheduler mock private diagnostics drain expired callbacks and continuations in React order", () => {
  const reactGate = loadFreshWorkspaceModule(privateActDispatcherGateModule);

  for (const nodeEnv of ["development", "production"]) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readSchedulerMockPrivateActQueueFlushDiagnostics(
      Scheduler,
      "unstable_flushExpired"
    );
    assertPrivateActQueueFlushDiagnostics(diagnostics, nodeEnv);

    Scheduler.reset();
    const events = [];
    const createCallback = (label, continuation = null) =>
      reactGate.createInternalActQueueTestCallback(
        (didTimeout) => {
          events.push([
            label,
            didTimeout,
            Scheduler.unstable_getCurrentPriorityLevel(),
            Scheduler.unstable_now()
          ]);
          Scheduler.log(label);
          return continuation;
        },
        { label }
      );

    const expiredNested = createCallback("expired-a-nested");
    const expiredContinuation = createCallback(
      "expired-a-continuation",
      expiredNested
    );
    const expiredStart = createCallback(
      "expired-a-start",
      expiredContinuation
    );
    const expiredSecond = createCallback("expired-b");
    const normalReady = createCallback("normal-ready");
    const cancelledExpired = createCallback("cancelled-expired");

    const cancelledTask = Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      cancelledExpired
    );
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      expiredStart
    );
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_UserBlockingPriority,
      expiredSecond
    );
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      normalReady
    );
    Scheduler.unstable_cancelCallback(cancelledTask);
    Scheduler.unstable_advanceTime(251);

    const report = Scheduler.unstable_runWithPriority(
      Scheduler.unstable_LowPriority,
      () => diagnostics.drainExpiredMockSchedulerWork()
    );

    assert.equal(
      report.status,
      "drained-expired-mock-scheduler-work-for-diagnostics",
      nodeEnv
    );
    assert.equal(report.pendingBefore, true, nodeEnv);
    assert.equal(report.pendingAfter, true, nodeEnv);
    assert.equal(report.flushedExpiredWork, true, nodeEnv);
    assert.equal(report.hasMoreWorkAfterDrain, true, nodeEnv);
    assert.equal(report.nowBefore, 251, nodeEnv);
    assert.equal(report.nowAfter, 251, nodeEnv);
    assert.equal(
      report.priorityLevelBefore,
      Scheduler.unstable_LowPriority,
      nodeEnv
    );
    assert.equal(
      report.priorityLevelAfter,
      Scheduler.unstable_LowPriority,
      nodeEnv
    );
    assert.equal(report.expiredCallbackCountBefore, 2, nodeEnv);
    assert.equal(report.expiredCallbackCountAfter, 0, nodeEnv);
    assert.equal(report.cancelledTombstoneCountBefore, 1, nodeEnv);
    assert.equal(report.cancelledTombstoneCountAfter, 0, nodeEnv);
    assert.deepEqual(
      report.taskQueueBefore.map((task) => [
        task.callbackStatus,
        task.callback.label ?? null,
        task.priorityLevel,
        task.expired
      ]),
      [
        [
          "cancelled-tombstone",
          null,
          Scheduler.unstable_UserBlockingPriority,
          true
        ],
        [
          "pending-callback",
          "expired-a-start",
          Scheduler.unstable_UserBlockingPriority,
          true
        ],
        [
          "pending-callback",
          "expired-b",
          Scheduler.unstable_UserBlockingPriority,
          true
        ],
        [
          "pending-callback",
          "normal-ready",
          Scheduler.unstable_NormalPriority,
          false
        ]
      ],
      nodeEnv
    );
    assert.deepEqual(
      report.taskQueueAfter.map((task) => [
        task.callbackStatus,
        task.callback.label ?? null,
        task.priorityLevel,
        task.expired
      ]),
      [
        [
          "pending-callback",
          "normal-ready",
          Scheduler.unstable_NormalPriority,
          false
        ]
      ],
      nodeEnv
    );
    assert.equal(report.drainsExpiredMockSchedulerWork, true, nodeEnv);
    assert.equal(report.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(
      report.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(report.publicReactActCompatibilityClaimed, false, nodeEnv);

    assert.deepEqual(
      events,
      [
        ["expired-a-start", true, Scheduler.unstable_UserBlockingPriority, 251],
        [
          "expired-a-continuation",
          true,
          Scheduler.unstable_UserBlockingPriority,
          251
        ],
        [
          "expired-a-nested",
          true,
          Scheduler.unstable_UserBlockingPriority,
          251
        ],
        ["expired-b", true, Scheduler.unstable_UserBlockingPriority, 251]
      ],
      nodeEnv
    );
    assert.deepEqual(Scheduler.unstable_clearLog(), [
      "expired-a-start",
      "expired-a-continuation",
      "expired-a-nested",
      "expired-b"
    ]);
    assert.equal(
      Scheduler.unstable_getCurrentPriorityLevel(),
      Scheduler.unstable_NormalPriority,
      nodeEnv
    );

    assert.equal(Scheduler.unstable_flushAllWithoutAsserting(), true, nodeEnv);
    assert.deepEqual(events.at(-1), [
      "normal-ready",
      false,
      Scheduler.unstable_NormalPriority,
      251
    ]);
    assert.deepEqual(Scheduler.unstable_clearLog(), ["normal-ready"], nodeEnv);
    assert.equal(Scheduler.unstable_hasPendingWork(), false, nodeEnv);
  }
});

test("scheduler mock private diagnostics record yields, paint, and continuation order", () => {
  const reactGate = loadFreshWorkspaceModule(privateActDispatcherGateModule);

  for (const nodeEnv of ["development", "production"]) {
    const Scheduler = loadFreshSchedulerMock(nodeEnv);
    const diagnostics = readSchedulerMockPrivateActQueueFlushDiagnostics(
      Scheduler,
      "unstable_flushNumberOfYields"
    );
    assertPrivateActQueueFlushDiagnostics(diagnostics, nodeEnv);

    Scheduler.reset();
    assert.deepEqual(
      diagnostics.describeMockSchedulerYieldPaintState(),
      {
        status: "mock-scheduler-yield-paint-state-for-diagnostics",
        now: 0,
        pendingWork: false,
        yieldedValues: [],
        yieldedValueCount: 0,
        expectedNumberOfYields: -1,
        didStop: false,
        needsPaint: false,
        shouldYieldForPaint: false,
        recordsMockSchedulerYieldedValues: true,
        recordsMockSchedulerRequestPaint: true,
        recordsMockSchedulerContinuationOrdering: true,
        drainsPublicReactActQueue: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        publicReactActCompatibilityClaimed: false
      },
      nodeEnv
    );

    const yieldEvents = [];
    const createCallback = (label, continuation = null) =>
      reactGate.createInternalActQueueTestCallback(
        (didTimeout) => {
          yieldEvents.push([
            label,
            didTimeout,
            Scheduler.unstable_getCurrentPriorityLevel(),
            Scheduler.unstable_now()
          ]);
          Scheduler.log(label);
          return continuation;
        },
        { label }
      );

    const normalContinuation = createCallback("normal-continuation");
    const normalStart = createCallback(
      "normal-start",
      normalContinuation
    );
    const low = createCallback("low");

    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      normalStart
    );
    Scheduler.unstable_scheduleCallback(Scheduler.unstable_LowPriority, low);

    const firstYieldReport =
      diagnostics.flushNumberOfYieldsForDiagnostics(1);
    assert.equal(
      firstYieldReport.status,
      "flushed-number-of-yields-for-diagnostics",
      nodeEnv
    );
    assert.equal(firstYieldReport.count, 1, nodeEnv);
    assert.equal(firstYieldReport.flushReturnedUndefined, true, nodeEnv);
    assert.equal(firstYieldReport.pendingBefore, true, nodeEnv);
    assert.equal(firstYieldReport.pendingAfter, true, nodeEnv);
    assert.deepEqual(firstYieldReport.yieldedValuesBefore, [], nodeEnv);
    assert.deepEqual(firstYieldReport.yieldedValuesAfter, [
      "normal-start"
    ]);
    assert.deepEqual(firstYieldReport.yieldedValuesAdded, [
      "normal-start"
    ]);
    assert.equal(firstYieldReport.needsPaintBefore, false, nodeEnv);
    assert.equal(firstYieldReport.needsPaintAfter, false, nodeEnv);
    assert.deepEqual(
      firstYieldReport.taskQueueBefore.map((task) => [
        task.callbackStatus,
        task.callback.label ?? null,
        task.priorityLevel,
        task.expired
      ]),
      [
        [
          "pending-callback",
          "normal-start",
          Scheduler.unstable_NormalPriority,
          false
        ],
        [
          "pending-callback",
          "low",
          Scheduler.unstable_LowPriority,
          false
        ]
      ],
      nodeEnv
    );
    assert.deepEqual(
      firstYieldReport.taskQueueAfter.map((task) => [
        task.callbackStatus,
        task.callback.label ?? null,
        task.priorityLevel,
        task.expired
      ]),
      [
        [
          "pending-callback",
          "normal-continuation",
          Scheduler.unstable_NormalPriority,
          false
        ],
        [
          "pending-callback",
          "low",
          Scheduler.unstable_LowPriority,
          false
        ]
      ],
      nodeEnv
    );
    assert.deepEqual(
      yieldEvents,
      [["normal-start", false, Scheduler.unstable_NormalPriority, 0]],
      nodeEnv
    );
    assert.equal(
      firstYieldReport.recordsMockSchedulerYieldedValues,
      true,
      nodeEnv
    );
    assert.equal(
      firstYieldReport.recordsMockSchedulerContinuationOrdering,
      true,
      nodeEnv
    );
    assert.equal(firstYieldReport.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(
      firstYieldReport.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(
      firstYieldReport.publicReactActCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.deepEqual(Scheduler.unstable_clearLog(), ["normal-start"]);

    const secondYieldReport =
      diagnostics.flushNumberOfYieldsForDiagnostics(1);
    assert.deepEqual(secondYieldReport.yieldedValuesAdded, [
      "normal-continuation"
    ]);
    assert.deepEqual(
      secondYieldReport.taskQueueBefore.map((task) => [
        task.callback.label ?? null,
        task.priorityLevel
      ]),
      [
        ["normal-continuation", Scheduler.unstable_NormalPriority],
        ["low", Scheduler.unstable_LowPriority]
      ],
      nodeEnv
    );
    assert.deepEqual(
      secondYieldReport.taskQueueAfter.map((task) => [
        task.callback.label ?? null,
        task.priorityLevel
      ]),
      [["low", Scheduler.unstable_LowPriority]],
      nodeEnv
    );
    assert.deepEqual(
      yieldEvents,
      [
        ["normal-start", false, Scheduler.unstable_NormalPriority, 0],
        ["normal-continuation", false, Scheduler.unstable_NormalPriority, 0]
      ],
      nodeEnv
    );
    assert.deepEqual(Scheduler.unstable_clearLog(), [
      "normal-continuation"
    ]);

    const finalYieldReport =
      diagnostics.flushNumberOfYieldsForDiagnostics(1);
    assert.deepEqual(finalYieldReport.yieldedValuesAdded, ["low"]);
    assert.deepEqual(finalYieldReport.taskQueueAfter, [], nodeEnv);
    assert.equal(finalYieldReport.pendingAfter, false, nodeEnv);
    assert.deepEqual(
      yieldEvents,
      [
        ["normal-start", false, Scheduler.unstable_NormalPriority, 0],
        ["normal-continuation", false, Scheduler.unstable_NormalPriority, 0],
        ["low", false, Scheduler.unstable_LowPriority, 0]
      ],
      nodeEnv
    );
    assert.deepEqual(Scheduler.unstable_clearLog(), ["low"]);

    Scheduler.reset();
    const paintEvents = [];
    const requestPaintReports = [];
    const paintContinuation = reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        paintEvents.push([
          "paint-continuation",
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log("paint-continuation");
      },
      { label: "paint-continuation" }
    );
    const paintStart = reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        paintEvents.push([
          "paint-start",
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log("paint-start");
        requestPaintReports.push(diagnostics.requestPaintForDiagnostics());
        return paintContinuation;
      },
      { label: "paint-start" }
    );
    const afterPaint = reactGate.createInternalActQueueTestCallback(
      (didTimeout) => {
        paintEvents.push([
          "after-paint",
          didTimeout,
          Scheduler.unstable_getCurrentPriorityLevel(),
          Scheduler.unstable_now()
        ]);
        Scheduler.log("after-paint");
      },
      { label: "after-paint" }
    );

    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      paintStart
    );
    Scheduler.unstable_scheduleCallback(
      Scheduler.unstable_NormalPriority,
      afterPaint
    );

    const paintReport = diagnostics.flushUntilNextPaintForDiagnostics();
    assert.equal(
      paintReport.status,
      "flushed-until-next-paint-for-diagnostics",
      nodeEnv
    );
    assert.equal(paintReport.flushReturnValue, false, nodeEnv);
    assert.equal(paintReport.pendingBefore, true, nodeEnv);
    assert.equal(paintReport.pendingAfter, true, nodeEnv);
    assert.equal(paintReport.needsPaintBefore, false, nodeEnv);
    assert.equal(paintReport.needsPaintAfter, true, nodeEnv);
    assert.equal(paintReport.shouldYieldForPaintBefore, false, nodeEnv);
    assert.equal(paintReport.shouldYieldForPaintAfter, false, nodeEnv);
    assert.deepEqual(paintReport.yieldedValuesAdded, ["paint-start"]);
    assert.deepEqual(
      paintReport.taskQueueBefore.map((task) => task.callback.label),
      ["paint-start", "after-paint"],
      nodeEnv
    );
    assert.deepEqual(
      paintReport.taskQueueAfter.map((task) => task.callback.label),
      ["paint-continuation", "after-paint"],
      nodeEnv
    );
    assert.equal(
      paintReport.recordsMockSchedulerRequestPaint,
      true,
      nodeEnv
    );
    assert.equal(
      paintReport.recordsMockSchedulerContinuationOrdering,
      true,
      nodeEnv
    );
    assert.equal(paintReport.drainsPublicReactActQueue, false, nodeEnv);
    assert.equal(
      paintReport.publicSchedulerTimingCompatibilityClaimed,
      false,
      nodeEnv
    );
    assert.equal(
      paintReport.publicReactActCompatibilityClaimed,
      false,
      nodeEnv
    );

    assert.equal(requestPaintReports.length, 1, nodeEnv);
    assert.deepEqual(
      requestPaintReports[0],
      {
        status: "requested-paint-for-diagnostics",
        requestPaintReturnedUndefined: true,
        nowBefore: 0,
        nowAfter: 0,
        pendingBefore: true,
        pendingAfter: true,
        yieldedValuesBefore: ["paint-start"],
        yieldedValuesAfter: ["paint-start"],
        yieldedValuesAdded: [],
        yieldedValueCountBefore: 1,
        yieldedValueCountAfter: 1,
        needsPaintBefore: false,
        needsPaintAfter: true,
        shouldYieldForPaintBefore: true,
        shouldYieldForPaintAfter: true,
        drainsMockSchedulerWork: false,
        drainsPublicReactActQueue: false,
        publicSchedulerTimingCompatibilityClaimed: false,
        publicReactActCompatibilityClaimed: false
      },
      nodeEnv
    );
    assert.deepEqual(
      paintEvents,
      [["paint-start", false, Scheduler.unstable_NormalPriority, 0]],
      nodeEnv
    );
    assert.deepEqual(Scheduler.unstable_clearLog(), ["paint-start"], nodeEnv);

    assert.equal(Scheduler.unstable_flushAllWithoutAsserting(), true, nodeEnv);
    assert.deepEqual(
      paintEvents,
      [
        ["paint-start", false, Scheduler.unstable_NormalPriority, 0],
        [
          "paint-continuation",
          false,
          Scheduler.unstable_NormalPriority,
          0
        ],
        ["after-paint", false, Scheduler.unstable_NormalPriority, 0]
      ],
      nodeEnv
    );
    assert.deepEqual(Scheduler.unstable_clearLog(), [
      "paint-continuation",
      "after-paint"
    ]);
    assert.equal(Scheduler.unstable_hasPendingWork(), false, nodeEnv);
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

test("scheduler mock oracle records matching Fast React mock behavior without claiming broad compatibility", () => {
  for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
    for (const scenarioId of SCHEDULER_MOCK_SCENARIO_IDS) {
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

function fastReactOperationValue(modeId, scenarioId) {
  const result = fastReactObservation(modeId, scenarioId).result.result;
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

function loadFreshWorkspaceModule(relativeModulePath) {
  const modulePath = path.join(repoRoot, relativeModulePath);
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function loadFreshSchedulerMock(nodeEnv) {
  const previousNodeEnv = process.env.NODE_ENV;

  for (const relativeModulePath of schedulerMockWorkspaceEntrypoints) {
    const resolved = require.resolve(path.join(repoRoot, relativeModulePath));
    delete require.cache[resolved];
  }

  process.env.NODE_ENV = nodeEnv;
  try {
    return require(path.join(repoRoot, schedulerMockWorkspaceEntrypoint));
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function assertPrivateActQueueFlushDiagnostics(diagnostics, label) {
  assert.equal(
    diagnostics.status,
    "private-scheduler-act-queue-flush-diagnostics",
    label
  );
  assert.equal(
    diagnostics.exportName,
    SCHEDULER_MOCK_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS_EXPORT
  );
  assert.equal(
    diagnostics.queueKind,
    "fast-react.react.private-act-queue-test-queue",
    label
  );
  assert.equal(
    diagnostics.taskKind,
    "fast-react.react.private-act-queue-test-task",
    label
  );
  assert.equal(
    diagnostics.callbackKind,
    "fast-react.react.private-act-queue-test-callback",
    label
  );
  assert.equal(diagnostics.queueVersion, 1, label);
  assert.equal(diagnostics.compatibilityTarget, "scheduler@0.27.0", label);
  assert.equal(diagnostics.reactCompatibilityTarget, "react@19.2.6", label);
  assert.deepEqual(diagnostics.acceptedRecordKinds, [
    "SchedulerActQueueRequest",
    "SchedulerActScopeBoundaryRecord",
    "SyncFlushActContinuationRecord"
  ]);
  assert.deepEqual(diagnostics.acceptedTaskKinds, [
    "RootSchedule",
    "SchedulerCallback"
  ]);
  assert.deepEqual(diagnostics.acceptedContinuationStatuses, [
    "NoContinuation",
    "PendingContinuation"
  ]);
  assert.equal(diagnostics.drainsAcceptedInternalTestQueues, true, label);
  assert.equal(
    diagnostics.executesBrandedInternalTestCallbacks,
    true,
    label
  );
  assert.equal(
    diagnostics.recordsBrandedInternalTestContinuations,
    true,
    label
  );
  assert.equal(
    diagnostics.executesBrandedInternalTestContinuations,
    true,
    label
  );
  assert.equal(
    diagnostics.mockSchedulerExpiredWorkDiagnosticsReady,
    true,
    label
  );
  assert.equal(diagnostics.drainsExpiredMockSchedulerWork, true, label);
  assert.equal(
    diagnostics.mockSchedulerYieldPaintDiagnosticsReady,
    true,
    label
  );
  assert.equal(
    diagnostics.recordsMockSchedulerYieldedValues,
    true,
    label
  );
  assert.equal(
    diagnostics.recordsMockSchedulerRequestPaint,
    true,
    label
  );
  assert.equal(
    diagnostics.recordsMockSchedulerContinuationOrdering,
    true,
    label
  );
  assert.equal(diagnostics.drainsPublicSchedulerTaskQueue, false, label);
  assert.equal(diagnostics.drainsPublicReactActQueue, false, label);
  assert.equal(
    diagnostics.publicSchedulerTimingCompatibilityClaimed,
    false,
    label
  );
  assert.equal(diagnostics.publicReactActCompatibilityClaimed, false, label);
  assert.equal(diagnostics.executesQueuedWork, false, label);
  assert.equal(diagnostics.executesEffects, false, label);
  assert.equal(typeof diagnostics.describeAcceptedInternalActQueue, "function");
  assert.equal(typeof diagnostics.drainAcceptedInternalActQueue, "function");
  assert.equal(typeof diagnostics.drainExpiredMockSchedulerWork, "function");
  assert.equal(
    typeof diagnostics.describeMockSchedulerYieldPaintState,
    "function"
  );
  assert.equal(typeof diagnostics.requestPaintForDiagnostics, "function");
  assert.equal(
    typeof diagnostics.flushNumberOfYieldsForDiagnostics,
    "function"
  );
  assert.equal(
    typeof diagnostics.flushUntilNextPaintForDiagnostics,
    "function"
  );
}
