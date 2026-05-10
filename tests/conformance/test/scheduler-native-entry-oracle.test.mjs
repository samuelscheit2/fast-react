import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findFastReactSchedulerNativeEntryComparison,
  findFastReactSchedulerNativeEntryObservation,
  findSchedulerNativeEntryDirectCjsProbe,
  findSchedulerNativeEntryObservation,
  findSchedulerNativeEntryResolution,
  readCheckedSchedulerNativeEntryOracle,
  readCheckedSchedulerNativeEntryOracleText
} from "../src/scheduler-native-entry-oracle.mjs";
import {
  SCHEDULER_NATIVE_ENTRY_DIRECT_CJS_SPECIFIERS,
  SCHEDULER_NATIVE_ENTRY_FAST_REACT_TARGET,
  SCHEDULER_NATIVE_ENTRY_NATIVE_FILES,
  SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH,
  SCHEDULER_NATIVE_ENTRY_PROBE_MODES,
  SCHEDULER_NATIVE_ENTRY_RESOLUTION_SPECIFIERS,
  SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS,
  SCHEDULER_NATIVE_ENTRY_SCENARIOS,
  SCHEDULER_NATIVE_ENTRY_TARGET
} from "../src/scheduler-native-entry-targets.mjs";

const oracle = readCheckedSchedulerNativeEntryOracle();

const DEFAULT_EXPORT_KEYS = [
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

const NATIVE_EXPORT_KEYS = [
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

test("checked scheduler native entry oracle artifact has the expected schema and target", () => {
  assert.equal(
    SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH,
    "oracles/scheduler-0.27.0-native-entry-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "scheduler-0.27.0-native-entry-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact scheduler npm tarball extracted into a temporary node_modules tree and probed through isolated Node child processes",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per scheduler native entry scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });
  assert.deepEqual(oracle.schedulerTarget, SCHEDULER_NATIVE_ENTRY_TARGET);
  assert.deepEqual(
    oracle.fastReactTarget,
    SCHEDULER_NATIVE_ENTRY_FAST_REACT_TARGET
  );
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
    browser: null,
    reactNative: null,
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
    oracle.packages.fastReactScheduler.behaviorCompatibilityClaimed,
    false
  );
});

test("scheduler native entry oracle keeps compatibility claims false", () => {
  assert.deepEqual(oracle.evidenceClaims, {
    npmMetadataResolved: true,
    tarballDownloaded: true,
    tarballIntegrityVerified: true,
    packageNativeFileSurfaceProbed: true,
    nativeEntrypointBehaviorProbed: true,
    nativeUnsupportedRuntimeBehaviorProbed: true,
    nativeRuntimeDelegationProbed: true,
    defaultEntrypointRelationshipProbed: true,
    fastReactComparedToScheduler: true
  });
  assert.deepEqual(oracle.conformanceClaims, {
    realSchedulerBehaviorProbed: true,
    fastReactComparedToScheduler: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.deepEqual(oracle.coverage, {
    publishedNativeFiles: true,
    nativeFileResolution: true,
    nodeEnvFileSelection: true,
    exportKeysAndDescriptors: true,
    fallbackSchedulingRuntime: true,
    unsupportedPriorityContextHelpers: true,
    nativeRuntimeSchedulerDelegation: true,
    defaultEntrypointRelationship: true,
    directNativeCjsRequire: true,
    localPackageMetadataExcludedFromBehaviorComparison: true
  });
  assert.deepEqual(
    oracle.implementationComparison.afterWorker126.statusCounts,
    {
      "matched-but-compatibility-not-claimed": 14
    }
  );
});

test("scheduler native entry oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, SCHEDULER_NATIVE_ENTRY_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, SCHEDULER_NATIVE_ENTRY_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "Published native file surface and Node resolution",
    "Native wrapper loading behavior",
    "Native export shape and descriptors",
    "Fallback runtime scheduling and unsupported APIs",
    "nativeRuntimeScheduler delegation",
    "Relationship to the default scheduler entrypoint",
    "Direct native CJS file loading behavior"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    const observations = oracle.observations[mode.id];
    assert.ok(observations, `${mode.id} observations should exist`);

    for (const scenarioId of SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS) {
      const observation = findSchedulerNativeEntryObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.status, "ok");

      const fastReactObservation = findFastReactSchedulerNativeEntryObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(fastReactObservation.scenarioId, scenarioId);
      assert.equal(fastReactObservation.status, "ok");
    }
  }
});

test("published native file surface has no condition map and resolves under node_modules", () => {
  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    const surface = observation(mode.id, "native-file-surface");
    assert.deepEqual(surface.packageJson, oracle.packages.scheduler.packageJson);
    assert.deepEqual(surface.nativeConditionFields, {
      exports: null,
      main: null,
      type: null,
      browser: null,
      reactNative: null
    });

    for (const specifier of SCHEDULER_NATIVE_ENTRY_RESOLUTION_SPECIFIERS) {
      const resolution = findSchedulerNativeEntryResolution(
        oracle,
        mode.id,
        specifier
      );
      assert.equal(resolution.status, "ok", specifier);
      assert.match(resolution.path, /^node_modules\/scheduler\//u, specifier);
    }

    for (const nativeFile of SCHEDULER_NATIVE_ENTRY_NATIVE_FILES) {
      assert.ok(
        surface.resolution.some((probe) => probe.path.endsWith(nativeFile)),
        `${nativeFile} should be resolvable`
      );
    }
  }
});

test("native wrapper selects NODE_ENV-specific CJS file and export constants", () => {
  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    const loading = observation(mode.id, "native-entry-loading");
    assert.deepEqual(loading.beforeFiles, []);
    assert.equal(loading.selectedNativeCjsFile, mode.selectedNativeCjsFile);
    assert.ok(loading.afterFiles.includes("node_modules/scheduler/index.native.js"));
    assert.ok(loading.afterFiles.includes(mode.selectedNativeCjsFile));
    assert.deepEqual(loading.module.exportKeys, NATIVE_EXPORT_KEYS);
    assert.deepEqual(loading.priorityConstants, fallbackPriorityConstants());
  }
});

test("native export descriptors are enumerable writable data properties", () => {
  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    const descriptors = observation(mode.id, "native-export-descriptors");
    assert.deepEqual(descriptors.expectedNativeExportKeys, NATIVE_EXPORT_KEYS);
    assert.deepEqual(descriptors.exportKeys, NATIVE_EXPORT_KEYS);
    assert.deepEqual(
      descriptors.ownKeys.map((key) => key.value),
      NATIVE_EXPORT_KEYS
    );
    assert.deepEqual(descriptors.constants, fallbackPriorityConstants());
    assert.deepEqual(descriptors.unstableNoPriority, {
      hasIn: false,
      hasOwn: false
    });

    for (const entry of descriptors.descriptors) {
      assert.equal(entry.descriptor.kind, "data", entry.key);
      assert.equal(entry.descriptor.enumerable, true, entry.key);
      assert.equal(entry.descriptor.configurable, true, entry.key);
      assert.equal(entry.descriptor.writable, true, entry.key);
    }

    assert.deepEqual(
      descriptorFor(descriptors.descriptors, "unstable_scheduleCallback").value,
      {
        type: "function",
        name: "unstable_scheduleCallback$1",
        length: 3
      }
    );
    assert.deepEqual(
      descriptorFor(descriptors.descriptors, "unstable_runWithPriority").value,
      {
        type: "function",
        name: "throwNotImplemented",
        length: 0
      }
    );
  }
});

test("native fallback runtime records task shape and unsupported helper throwers", () => {
  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    const fallback = observation(mode.id, "native-fallback-runtime");
    assert.deepEqual(fallback.exportKeys, NATIVE_EXPORT_KEYS);
    assert.deepEqual(fallback.priorityConstants, fallbackPriorityConstants());
    assert.equal(fallback.nowInitial, 0);
    assert.equal(fallback.currentPriority, 3);
    assert.deepEqual(fallback.shouldYield, {
      beforePaint: false,
      requestPaint: { type: "undefined" },
      afterPaint: true
    });
    assert.deepEqual(fallback.scheduledTask.beforeCancel.ownKeys, [
      "id",
      "callback",
      "priorityLevel",
      "startTime",
      "expirationTime",
      "sortIndex"
    ]);
    assert.equal(fallback.scheduledTask.beforeCancel.priorityLevel, 3);
    assert.equal(fallback.scheduledTask.beforeCancel.startTime, 0);
    assert.equal(fallback.scheduledTask.beforeCancel.expirationTime, 5000);
    assert.equal(fallback.scheduledTask.beforeCancel.sortIndex, 5000);
    assert.equal(
      fallback.scheduledTask.afterCancel.callback.type,
      "null"
    );
    assert.deepEqual(
      fallback.hostEvents.map((event) => event[0]),
      ["setImmediate"]
    );
    assertNativeThrowers(fallback.throwers);
  }
});

test("nativeRuntimeScheduler delegation overrides constants and delegates supported calls", () => {
  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    const delegated = observation(mode.id, "native-runtime-delegation");
    assert.deepEqual(delegated.exportKeys, NATIVE_EXPORT_KEYS);
    assert.deepEqual(delegated.priorityConstants, {
      unstable_ImmediatePriority: 11,
      unstable_UserBlockingPriority: 12,
      unstable_NormalPriority: 13,
      unstable_LowPriority: 14,
      unstable_IdlePriority: 15,
      unstable_Profiling: null
    });
    assert.deepEqual(delegated.scheduledTask, {
      nativeTask: true,
      priority: 12,
      delay: 4
    });
    assert.equal(delegated.currentPriority, 13);
    assert.equal(delegated.shouldYield, "native-should-yield");
    assert.equal(delegated.now, 123);
    assert.deepEqual(delegated.requestPaint, { type: "string", value: "native-request-paint" });
    assert.deepEqual(delegated.nativeRuntimeEvents, [
      [
        "schedule",
        12,
        {
          type: "function",
          name: "",
          length: 0
        },
        4
      ],
      ["cancel", true, 12, 4],
      ["getCurrentPriorityLevel"],
      ["shouldYield"],
      ["now"],
      ["requestPaint"]
    ]);
    assert.deepEqual(delegated.fallbackHostEvents, []);
    assertNativeThrowers(delegated.throwers);
  }
});

test("native and default scheduler entrypoints expose the same names with different modules", () => {
  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    const relationship = observation(mode.id, "native-default-relationship");
    assert.deepEqual(relationship.defaultExportKeys, DEFAULT_EXPORT_KEYS);
    assert.deepEqual(relationship.nativeExportKeys, NATIVE_EXPORT_KEYS);
    assert.equal(relationship.sortedExportNameSetsEqual, true);
    assert.equal(relationship.exactExportOrderEqual, false);
    assert.deepEqual(relationship.defaultOnlyExportKeys, []);
    assert.deepEqual(relationship.nativeOnlyExportKeys, []);
    assert.equal(relationship.moduleIdentitySame, false);
    assert.equal(relationship.priorityConstantsEqual, true);
    assert.deepEqual(
      relationship.defaultPriorityConstants,
      fallbackPriorityConstants()
    );
    assert.deepEqual(
      relationship.nativePriorityConstants,
      fallbackPriorityConstants()
    );
    assert.ok(
      relationship.functionIdentityEqual.every((entry) => !entry.sameIdentity)
    );
    assert.deepEqual(
      relationship.defaultPriorityHelpers.runWithPriorityUserBlocking.value,
      {
        type: "number",
        value: 2
      }
    );
    assert.deepEqual(
      relationship.defaultPriorityHelpers.nextInsideImmediate.value,
      {
        type: "number",
        value: 3
      }
    );
    assert.deepEqual(
      relationship.defaultPriorityHelpers.wrapCallbackCapturedPriority.value,
      {
        type: "number",
        value: 2
      }
    );
    assert.deepEqual(
      relationship.defaultPriorityHelpers.forceFrameRate.value,
      {
        type: "undefined"
      }
    );
    assertNativeThrowers(relationship.nativePriorityHelpers);
  }
});

test("direct native CJS files are physically loadable with environment-sensitive exports", () => {
  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    for (const specifier of SCHEDULER_NATIVE_ENTRY_DIRECT_CJS_SPECIFIERS) {
      const probe = findSchedulerNativeEntryDirectCjsProbe(
        oracle,
        mode.id,
        specifier
      );
      assert.equal(probe.requireResolve.status, "ok", specifier);
      assert.match(probe.requireResolve.path, /^node_modules\/scheduler\//u);
      assert.equal(probe.require.status, "ok", specifier);

      const developmentFile = specifier.endsWith(
        "scheduler.native.development.js"
      );
      const guardedOff = mode.id === "node-production" && developmentFile;

      if (guardedOff) {
        assert.deepEqual(probe.require.exportKeys, []);
        assert.equal(probe.require.priorityConstants, null);
      } else {
        assert.deepEqual(probe.require.exportKeys, NATIVE_EXPORT_KEYS);
        assert.deepEqual(
          probe.require.priorityConstants,
          fallbackPriorityConstants()
        );
      }
    }
  }
});

test("Fast React native entry behavior matches checked scheduler native observations", () => {
  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    for (const scenarioId of SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS) {
      const scenarioComparison =
        findFastReactSchedulerNativeEntryComparison(
          oracle,
          mode.id,
          scenarioId
        );
      assert.equal(
        scenarioComparison.status,
        "matched-but-compatibility-not-claimed"
      );
      assert.equal(scenarioComparison.compatibilityClaimed, false);
      assert.equal(scenarioComparison.firstDifferencePath, null);
      assert.equal(scenarioComparison.schedulerStatus, "ok");
      assert.equal(scenarioComparison.fastReactStatus, "ok");
    }
  }
});

test("scheduler native entry oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedSchedulerNativeEntryOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|fast-react-scheduler-native-entry-oracle-[A-Za-z0-9]|\/tmp\/|Users\/user|Developer\/Developer/u.test(
      text
    ),
    false
  );
});

test("print-scheduler-native-entry-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-scheduler-native-entry-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedSchedulerNativeEntryOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedSchedulerNativeEntryOracleText());
});

function observation(modeId, scenarioId) {
  return findSchedulerNativeEntryObservation(oracle, modeId, scenarioId);
}

function descriptorFor(descriptors, key) {
  const entry = descriptors.find((descriptor) => descriptor.key === key);
  if (!entry) {
    throw new Error(`Missing descriptor for ${key}`);
  }
  return entry.descriptor;
}

function fallbackPriorityConstants() {
  return {
    unstable_ImmediatePriority: 1,
    unstable_UserBlockingPriority: 2,
    unstable_NormalPriority: 3,
    unstable_LowPriority: 4,
    unstable_IdlePriority: 5,
    unstable_Profiling: null
  };
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
