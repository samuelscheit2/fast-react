import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findSchedulerVariantDeepCjsProbe,
  findSchedulerVariantResolution,
  readCheckedSchedulerVariantOracle,
  readCheckedSchedulerVariantOracleText
} from "../src/scheduler-variant-oracle.mjs";
import {
  SCHEDULER_VARIANT_DEEP_CJS_SPECIFIERS,
  SCHEDULER_VARIANT_GATE_DECISIONS,
  SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH,
  SCHEDULER_VARIANT_PROBE_MODES,
  SCHEDULER_VARIANT_RESOLUTION_SPECIFIERS,
  SCHEDULER_VARIANT_SCENARIO_IDS,
  SCHEDULER_VARIANT_SCENARIOS,
  SCHEDULER_VARIANT_TARGET
} from "../src/scheduler-variant-targets.mjs";

const oracle = readCheckedSchedulerVariantOracle();

const ROOT_EXPORT_KEYS = [
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

const MOCK_EXPORT_KEYS = [
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

test("checked scheduler variant oracle artifact has the expected schema and target", () => {
  assert.equal(
    SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH,
    "oracles/scheduler-0.27.0-variant-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "scheduler-0.27.0-variant-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact scheduler npm tarball extracted into a temporary node_modules tree and probed through isolated Node child processes",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per scheduler variant scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.schedulerTarget, SCHEDULER_VARIANT_TARGET);
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages.scheduler.tarball.integrityVerified, true);
  assert.deepEqual(
    oracle.packages.scheduler.tarball.files,
    EXPECTED_TARBALL_FILES
  );
  assert.deepEqual(oracle.packages.scheduler.packageJson, {
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
});

test("scheduler variant oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.evidenceClaims, {
    npmMetadataResolved: true,
    tarballDownloaded: true,
    tarballIntegrityVerified: true,
    packageMetadataProbed: true,
    schedulerVariantBehaviorProbed: true,
    physicalDeepImportsProbed: true,
    fastReactComparedToScheduler: false
  });
  assert.deepEqual(oracle.conformanceClaims, {
    realSchedulerBehaviorProbed: true,
    fastReactComparedToScheduler: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(
    oracle.compatibilityGateRecommendations,
    SCHEDULER_VARIANT_GATE_DECISIONS
  );
});

test("scheduler variant oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, SCHEDULER_VARIANT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, SCHEDULER_VARIANT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "package metadata and physical subpath exposure",
    "scheduler/unstable_mock deterministic test scheduler helpers",
    "scheduler/unstable_post_task Task Scheduling API behavior",
    "scheduler/index.native.js fallback behavior",
    "direct physical CJS import behavior"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    const observations = oracle.observations[mode.id];
    assert.ok(observations, `${mode.id} observations should exist`);

    for (const scenarioId of SCHEDULER_VARIANT_SCENARIO_IDS) {
      const observation = observations[scenarioObservationKey(scenarioId)];
      assert.ok(observation, `${mode.id}:${scenarioId} should exist`);
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.status, "ok");
    }
  }
});

test("package metadata and resolution prove physical subpath exposure", () => {
  assert.equal(oracle.packageResolution.packageJson.exports, null);
  assert.equal(oracle.packageResolution.packageJson.main, null);
  assert.equal(oracle.packageResolution.packageJson.type, null);
  assert.equal(oracle.packageResolution.packageJsonRequire.require.status, "ok");

  for (const specifier of SCHEDULER_VARIANT_RESOLUTION_SPECIFIERS) {
    const resolution = findSchedulerVariantResolution(oracle, specifier);
    assert.equal(resolution.status, "ok", specifier);
    assert.match(resolution.path, /^node_modules\/scheduler\//u, specifier);
  }

  for (const specifier of [
    "scheduler/index.js",
    "scheduler/index.native.js",
    "scheduler/unstable_mock.js",
    "scheduler/unstable_post_task.js"
  ]) {
    assert.equal(
      findSchedulerVariantResolution(oracle, specifier).status,
      "ok",
      `${specifier} should be physically resolvable without an exports map`
    );
  }
});

test("unstable_mock oracle captures deterministic helper behavior", () => {
  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    const mock = oracle.observations[mode.id].unstableMock;
    assert.deepEqual(mock.exportKeys, MOCK_EXPORT_KEYS);
    assert.deepEqual(mock.expectedRootExportKeysSubset, ROOT_EXPORT_KEYS);
    assert.deepEqual(mock.priorityConstants, {
      unstable_ImmediatePriority: 1,
      unstable_UserBlockingPriority: 2,
      unstable_NormalPriority: 3,
      unstable_LowPriority: 4,
      unstable_IdlePriority: 5,
      unstable_Profiling: null
    });
    assert.deepEqual(mock.timeAndLog, {
      initialNow: 0,
      nowAfterAdvance: 7,
      manualLog: ["manual"],
      emptyLog: [],
      disabledLog: []
    });
    assert.deepEqual(mock.priorityContext, {
      defaultPriority: 3,
      runWithPriorityInvalid: 3,
      nextInsideUserBlocking: 3,
      nextInsideLow: 4,
      wrapCallbackCapturedPriority: 2
    });
    assert.deepEqual(mock.priorityScheduling.order, [
      ["immediate", true, 1],
      ["user-blocking", false, 2],
      ["normal", false, 3],
      ["low", false, 4]
    ]);
    assert.deepEqual(mock.priorityScheduling.log, [
      "immediate",
      "user-blocking",
      "normal",
      "low"
    ]);
    assert.deepEqual(mock.delayedScheduling.afterSecondFlush.events, [
      ["ready", 0],
      ["delay10", 10]
    ]);
    assert.deepEqual(
      mock.continuationScheduling.afterFlushAll.events,
      ["normal-start", "normal-continuation", "low"]
    );
    assert.deepEqual(mock.paintYielding.afterFlushAll.events, [
      "paint-start",
      "paint-continuation",
      "after-paint"
    ]);
    assert.deepEqual(mock.expiredScheduling, [["user-blocking", true, 251]]);
    assert.equal(mock.cancellation.taskCallbackAfterCancel.type, "null");
    assert.equal(mock.flushAllWithUnassertedLog.status, "throws");
    assert.equal(mock.resetState.hasPendingWork, false);
  }
});

test("unstable_post_task oracle captures plain Node failure and shimmed behavior", () => {
  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    const plain = oracle.observations[mode.id].unstablePostTaskPlainNode;
    assert.equal(plain.require.requireResolve.status, "ok");
    assert.equal(plain.require.require.status, "throws");
    assert.equal(plain.require.require.name, "ReferenceError");
    assert.equal(plain.require.require.message, "window is not defined");

    const shimmed = oracle.observations[mode.id].unstablePostTaskShimmed;
    assert.deepEqual(shimmed.exportKeys, ROOT_EXPORT_KEYS);
    assert.deepEqual(
      shimmed.priorityMapping.map((entry) => [
        entry.label,
        entry.returnedNode.signal.priority,
        entry.events[1].delay
      ]),
      [
        ["immediate", "user-blocking", 0],
        ["user-blocking", "user-blocking", 0],
        ["normal", "user-visible", 0],
        ["low", "user-visible", 7],
        ["idle", "background", 0],
        ["invalid", "user-visible", 0]
      ]
    );
    assert.deepEqual(shimmed.cancellation.flush, [
      {
        type: "skip-aborted",
        signalId: 7
      }
    ]);
    assert.equal(shimmed.cancellation.callbackRan, false);
    assert.deepEqual(shimmed.callbackObservation.events, [
      ["immediate", false, 1, false],
      ["after-deadline", true]
    ]);
    assert.deepEqual(shimmed.continuationWithYield.events, [
      ["idle-start", 5],
      ["idle-continuation", 5]
    ]);
    assert.deepEqual(
      shimmed.continuationWithYield.shimEvents.map((event) => event.type),
      ["yield", "yield.then"]
    );
    assert.equal(shimmed.noops.requestPaint.type, "undefined");
    assert.equal(shimmed.noops.forceFrameRate.type, "undefined");

    const withoutYield =
      oracle.observations[mode.id].unstablePostTaskWithoutYield;
    assert.deepEqual(withoutYield.events, [
      ["normal-start", 3],
      ["normal-continuation", 3]
    ]);
    assert.deepEqual(withoutYield.postContinuationEvents, [
      {
        type: "postTask",
        delay: null,
        signalId: 1,
        signalAborted: false
      }
    ]);
  }
});

test("native variant oracle captures fallback and nativeRuntimeScheduler delegation", () => {
  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    const fallback = oracle.observations[mode.id].nativeFallback;
    assert.deepEqual(fallback.exportKeys, ROOT_EXPORT_KEYS);
    assert.deepEqual(fallback.priorityConstants, {
      unstable_ImmediatePriority: 1,
      unstable_UserBlockingPriority: 2,
      unstable_NormalPriority: 3,
      unstable_LowPriority: 4,
      unstable_IdlePriority: 5,
      unstable_Profiling: null
    });
    assert.deepEqual(fallback.shouldYield, {
      beforePaint: false,
      afterPaint: true
    });
    assert.deepEqual(fallback.scheduledTask.ownKeys, [
      "id",
      "callback",
      "priorityLevel",
      "startTime",
      "expirationTime",
      "sortIndex"
    ]);
    assert.equal(fallback.scheduledTask.expirationTime, 5000);
    assert.equal(fallback.taskCallbackAfterCancel.type, "null");
    assert.deepEqual(fallback.hostEvents, [["setImmediate"]]);
    assertNativeThrowers(fallback.throwers);

    const delegated = oracle.observations[mode.id].nativeRuntimeDelegation;
    assert.deepEqual(delegated.priorityConstants, {
      unstable_ImmediatePriority: 11,
      unstable_UserBlockingPriority: 12,
      unstable_NormalPriority: 13,
      unstable_LowPriority: 14,
      unstable_IdlePriority: 15,
      unstable_Profiling: null
    });
    assert.equal(delegated.currentPriority, 13);
    assert.equal(delegated.shouldYield, "native-should-yield");
    assert.equal(delegated.now, 123);
    assert.deepEqual(delegated.events, [
      ["schedule", 12, 4],
      ["cancel", true, 12],
      ["getCurrentPriorityLevel"],
      ["shouldYield"],
      ["now"],
      ["requestPaint"]
    ]);
    assertNativeThrowers(delegated.throwers);
  }
});

test("physical CJS deep imports are resolved and their require behavior is explicit", () => {
  for (const mode of SCHEDULER_VARIANT_PROBE_MODES) {
    for (const specifier of SCHEDULER_VARIANT_DEEP_CJS_SPECIFIERS) {
      const probe = findSchedulerVariantDeepCjsProbe(
        oracle,
        mode.id,
        specifier
      );
      assert.equal(probe.requireResolve.status, "ok", specifier);
      assert.match(probe.requireResolve.path, /^node_modules\/scheduler\//u);

      const postTaskThrows =
        specifier.endsWith("scheduler-unstable_post_task.production.js") ||
        (mode.id === "node-development" &&
          specifier.endsWith("scheduler-unstable_post_task.development.js"));

      if (postTaskThrows) {
        assert.equal(probe.require.status, "throws", specifier);
        assert.equal(probe.require.name, "ReferenceError");
        assert.equal(probe.require.message, "window is not defined");
      } else {
        assert.equal(probe.require.status, "ok", specifier);
        assert.ok(Array.isArray(probe.require.exportKeys), specifier);
      }
    }
  }
});

test("scheduler variant oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedSchedulerVariantOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|fast-react-scheduler-variant-oracle-[A-Za-z0-9]|\/tmp\/|Users\/user|Developer\/Developer/u.test(
      text
    ),
    false
  );
});

test("print-scheduler-variant-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-scheduler-variant-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedSchedulerVariantOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedSchedulerVariantOracleText());
});

function scenarioObservationKey(scenarioId) {
  return scenarioId.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}

function assertNativeThrowers(throwers) {
  for (const key of [
    "unstable_runWithPriority",
    "unstable_next",
    "unstable_wrapCallback",
    "unstable_forceFrameRate"
  ]) {
    assert.deepEqual(throwers[key], {
      status: "throws",
      name: "Error",
      code: null,
      message: "Not implemented."
    });
  }
}
