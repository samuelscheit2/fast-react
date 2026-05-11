import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const schedulerPackageRoot = path.join(repoRoot, "packages", "scheduler");

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

const POST_TASK_EXPORT_KEYS = [
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

const PRIVATE_MOCK_DIAGNOSTICS_KEY =
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__";
const PRIVATE_POST_TASK_DIAGNOSTICS_SYMBOL_DESCRIPTION =
  "fast-react.scheduler.unstable_post_task.priority-diagnostics";
const PRIVATE_POST_TASK_DIAGNOSTICS_SYMBOL = Symbol.for(
  PRIVATE_POST_TASK_DIAGNOSTICS_SYMBOL_DESCRIPTION
);
const PRIVATE_RUNTIME_STRING_PATTERN =
  /(?:^__FAST_REACT_PRIVATE|private|diagnostic|diagnostics|gate|bridge|dispatcher|metadata|route|routes|secret|source)/iu;
const MOCK_OR_POST_TASK_FILE_PATTERN =
  /(?:scheduler-unstable_mock|scheduler-unstable_post_task|unstable_mock\.js|unstable_post_task\.js)/u;
const MOCK_PRIVATE_DIAGNOSTIC_FUNCTIONS = [
  "unstable_flushAll",
  "unstable_flushAllWithoutAsserting",
  "unstable_flushExpired",
  "unstable_flushNumberOfYields",
  "unstable_flushUntilNextPaint"
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
    assertNoLoadedMockOrPostTaskFiles(loading.afterFiles, mode.id);
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
    assertNoLoadedMockOrPostTaskFiles(relationship.loadedFiles, mode.id);
  }
});

test("local scheduler native and root entries do not expose mock or post-task private diagnostics", () => {
  for (const entrypoint of [
    {
      file: "index.js",
      label: "scheduler/index.js",
      keys: DEFAULT_EXPORT_KEYS
    },
    {
      file: "cjs/scheduler.development.js",
      label: "scheduler/cjs/scheduler.development.js",
      keys: DEFAULT_EXPORT_KEYS
    },
    {
      file: "cjs/scheduler.production.js",
      label: "scheduler/cjs/scheduler.production.js",
      keys: DEFAULT_EXPORT_KEYS
    },
    {
      file: "index.native.js",
      label: "scheduler/index.native.js",
      keys: NATIVE_EXPORT_KEYS
    },
    {
      file: "cjs/scheduler.native.development.js",
      label: "scheduler/cjs/scheduler.native.development.js",
      keys: NATIVE_EXPORT_KEYS
    },
    {
      file: "cjs/scheduler.native.production.js",
      label: "scheduler/cjs/scheduler.native.production.js",
      keys: NATIVE_EXPORT_KEYS
    }
  ]) {
    const moduleExports = requireFreshSchedulerFile(entrypoint.file);

    assert.deepEqual(
      Object.keys(moduleExports),
      entrypoint.keys,
      entrypoint.label
    );
    assertNoPrivateSchedulerDiagnostics(moduleExports, entrypoint.label);
  }
});

test("local scheduler mock diagnostics stay hidden on mock flush helpers only", () => {
  const SchedulerMock = requireFreshSchedulerFile("unstable_mock.js");

  assert.deepEqual(Object.keys(SchedulerMock), MOCK_EXPORT_KEYS);
  assertNoPrivateRuntimeKeys(
    SchedulerMock,
    "scheduler/unstable_mock module"
  );

  for (const key of MOCK_EXPORT_KEYS) {
    if (typeof SchedulerMock[key] !== "function") {
      continue;
    }

    const expectedKeys = MOCK_PRIVATE_DIAGNOSTIC_FUNCTIONS.includes(key)
      ? [PRIVATE_MOCK_DIAGNOSTICS_KEY]
      : [];
    assert.deepEqual(
      privateStringKeys(SchedulerMock[key]),
      expectedKeys,
      `scheduler/unstable_mock ${key} private diagnostic keys`
    );
    assert.deepEqual(
      privateSymbolDescriptions(SchedulerMock[key]),
      [],
      `scheduler/unstable_mock ${key} private diagnostic symbols`
    );

    if (expectedKeys.length > 0) {
      const descriptor = Object.getOwnPropertyDescriptor(
        SchedulerMock[key],
        PRIVATE_MOCK_DIAGNOSTICS_KEY
      );
      assert.equal(descriptor.enumerable, false, key);
      assert.equal(descriptor.configurable, false, key);
      assert.equal(descriptor.writable, false, key);
      assert.equal(Object.isFrozen(descriptor.value), true, key);
      assert.equal(
        descriptor.value.exportName,
        PRIVATE_MOCK_DIAGNOSTICS_KEY,
        key
      );
      assert.equal(
        descriptor.value.compatibilityTarget,
        "scheduler@0.27.0",
        key
      );
      assert.equal(
        descriptor.value.publicSchedulerTimingCompatibilityClaimed,
        false,
        key
      );
      assert.equal(
        descriptor.value.publicReactActCompatibilityClaimed,
        false,
        key
      );
      assert.equal(
        descriptor.value
          .providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics,
        true,
        key
      );
      assert.equal(
        descriptor.value.schedulerMockExpiredActRootWorkSourceValidator !==
          null &&
          typeof descriptor.value
            .schedulerMockExpiredActRootWorkSourceValidator === "object",
        true,
        key
      );
      assert.equal(
        descriptor.value.schedulerMockExpiredActRootWorkSourceValidator.status,
        "fast-react.scheduler.mock-expired-act-root-work-source-validator",
        key
      );
      assert.equal(
        descriptor.value.schedulerMockExpiredActRootWorkSourceValidator.isSchedulerMockExpiredActRootWorkSource(
          descriptor.value
        ),
        true,
        key
      );
      assertSchedulerMockSourceValidatorOnlyThroughPrivateDiagnostics(
        SchedulerMock[key],
        descriptor.value,
        key
      );
    }
  }

  for (const entrypoint of [
    "index.js",
    "index.native.js",
    "cjs/scheduler.native.development.js",
    "cjs/scheduler.native.production.js"
  ]) {
    const moduleExports = requireFreshSchedulerFile(entrypoint);
    assert.equal(
      Reflect.ownKeys(moduleExports).includes(PRIVATE_MOCK_DIAGNOSTICS_KEY),
      false,
      `${entrypoint} must not expose mock diagnostics on the module`
    );
    for (const key of Object.keys(moduleExports)) {
      if (typeof moduleExports[key] === "function") {
        assert.equal(
          Reflect.ownKeys(moduleExports[key]).includes(
            PRIVATE_MOCK_DIAGNOSTICS_KEY
          ),
          false,
          `${entrypoint} ${key} must not expose mock diagnostics`
        );
      }
    }
  }
});

test("local scheduler post-task diagnostics are opt-in and scoped to returned browser task nodes", () => {
  withPostTaskGlobals({ enableDiagnostics: false }, () => {
    const PostTaskScheduler = requireFreshSchedulerFile("unstable_post_task.js");
    assert.deepEqual(Object.keys(PostTaskScheduler), POST_TASK_EXPORT_KEYS);
    assertNoPrivateSchedulerDiagnostics(
      PostTaskScheduler,
      "scheduler/unstable_post_task module without diagnostics"
    );

    const task = PostTaskScheduler.unstable_scheduleCallback(
      PostTaskScheduler.unstable_NormalPriority,
      () => {}
    );
    assert.deepEqual(Object.keys(task), ["_controller"]);
    assert.deepEqual(
      Reflect.ownKeys(task),
      ["_controller"],
      "post-task returned node without diagnostics"
    );
  });

  withPostTaskGlobals({ enableDiagnostics: true }, () => {
    const PostTaskScheduler = requireFreshSchedulerFile("unstable_post_task.js");
    assert.deepEqual(Object.keys(PostTaskScheduler), POST_TASK_EXPORT_KEYS);
    assertNoPrivateSchedulerDiagnostics(
      PostTaskScheduler,
      "scheduler/unstable_post_task module with diagnostics"
    );

    const task = PostTaskScheduler.unstable_scheduleCallback(
      PostTaskScheduler.unstable_UserBlockingPriority,
      () => {}
    );
    assert.deepEqual(Object.keys(task), ["_controller"]);
    assert.deepEqual(
      privateSymbolDescriptions(task),
      [PRIVATE_POST_TASK_DIAGNOSTICS_SYMBOL_DESCRIPTION]
    );

    const descriptor = Object.getOwnPropertyDescriptor(
      task,
      PRIVATE_POST_TASK_DIAGNOSTICS_SYMBOL
    );
    assert.equal(descriptor.enumerable, false);
    assert.equal(descriptor.configurable, false);
    assert.equal(descriptor.writable, false);
    assert.equal(typeof descriptor.value, "function");

    const diagnostics = descriptor.value();
    assert.equal(
      diagnostics.exportName,
      "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__"
    );
    assert.equal(diagnostics.entrypoint, "scheduler/unstable_post_task");
    assert.equal(diagnostics.compatibilityTarget, "scheduler@0.27.0");
    assert.equal(diagnostics.browserPostTaskCompatibilityClaimed, false);
    assert.equal(diagnostics.publicSchedulerTimingCompatibilityClaimed, false);
    assert.equal(diagnostics.compatibilityClaimed, false);
  });

  for (const entrypoint of [
    "index.js",
    "index.native.js",
    "unstable_mock.js",
    "cjs/scheduler.native.development.js",
    "cjs/scheduler.native.production.js"
  ]) {
    const moduleExports = requireFreshSchedulerFile(entrypoint);
    assert.equal(
      Reflect.ownKeys(moduleExports).includes(
        PRIVATE_POST_TASK_DIAGNOSTICS_SYMBOL
      ),
      false,
      `${entrypoint} must not expose post-task diagnostics on the module`
    );
    for (const key of Object.keys(moduleExports)) {
      if (typeof moduleExports[key] === "function") {
        assert.equal(
          Reflect.ownKeys(moduleExports[key]).includes(
            PRIVATE_POST_TASK_DIAGNOSTICS_SYMBOL
          ),
          false,
          `${entrypoint} ${key} must not expose post-task diagnostics`
        );
      }
    }
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

function requireFreshSchedulerFile(file, nodeEnv = "development") {
  clearSchedulerPackageCache();
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  try {
    return require(path.join(schedulerPackageRoot, file));
  } finally {
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function clearSchedulerPackageCache() {
  const schedulerRootWithSeparator = `${schedulerPackageRoot}${path.sep}`;
  for (const cachePath of Object.keys(require.cache)) {
    if (cachePath.startsWith(schedulerRootWithSeparator)) {
      delete require.cache[cachePath];
    }
  }
}

function assertNoLoadedMockOrPostTaskFiles(files, label) {
  assert.equal(
    files.some((file) => MOCK_OR_POST_TASK_FILE_PATTERN.test(file)),
    false,
    `${label} must not load mock or post-task variant files`
  );
}

function assertNoPrivateSchedulerDiagnostics(moduleExports, label) {
  assertNoPrivateRuntimeKeys(moduleExports, label);

  for (const key of Object.keys(moduleExports)) {
    if (typeof moduleExports[key] === "function") {
      assertNoPrivateRuntimeKeys(moduleExports[key], `${label}.${key}`);
    }
  }
}

function assertNoPrivateRuntimeKeys(target, label) {
  assert.deepEqual(
    privateStringKeys(target),
    [],
    `${label} private diagnostic string properties`
  );
  assert.deepEqual(
    privateSymbolDescriptions(target),
    [],
    `${label} private diagnostic symbols`
  );
}

function privateStringKeys(target) {
  return Reflect.ownKeys(target)
    .filter(
      (key) =>
        typeof key === "string" && PRIVATE_RUNTIME_STRING_PATTERN.test(key)
    )
    .sort();
}

function privateSymbolDescriptions(target) {
  return Reflect.ownKeys(target)
    .filter((key) => typeof key === "symbol")
    .map((symbol) => symbol.description)
    .sort();
}

function assertSchedulerMockSourceValidatorOnlyThroughPrivateDiagnostics(
  helper,
  diagnostics,
  label
) {
  const validator =
    diagnostics.schedulerMockExpiredActRootWorkSourceValidator;

  assert.equal(Object.isFrozen(helper), true, label);
  assert.equal(Object.isFrozen(diagnostics), true, label);
  assert.equal(Object.isFrozen(validator), true, label);
  assert.equal(
    Object.hasOwn(helper, "schedulerMockExpiredActRootWorkSourceValidator"),
    false,
    label
  );
  assert.equal(
    Object.hasOwn(helper, "isSchedulerMockExpiredActRootWorkSource"),
    false,
    label
  );
  assert.deepEqual(
    Reflect.ownKeys(helper).filter(
      (key) =>
        typeof key === "string" &&
        key !== PRIVATE_MOCK_DIAGNOSTICS_KEY &&
        /(?:source|validator)/iu.test(key)
    ),
    [],
    label
  );
  assert.deepEqual(privateSymbolDescriptions(helper), [], label);
  assert.equal(
    helper[
      Symbol.for(
        "fast-react.scheduler.mock-expired-act-root-work-source-validator"
      )
    ],
    undefined,
    label
  );
  assert.equal(
    validator.isSchedulerMockExpiredActRootWorkSource(diagnostics),
    true,
    label
  );
  assert.equal(
    validator.isSchedulerMockExpiredActRootWorkSource(
      Object.freeze({ ...diagnostics })
    ),
    false,
    label
  );
  assert.equal(
    validator.isSchedulerMockExpiredActRootWorkSource(
      createOldGlobalSchedulerMockExpiredActRootWorkSourceClone(diagnostics)
    ),
    false,
    label
  );
  assert.equal(
    validator.isSchedulerMockExpiredActRootWorkSource(
      Object.freeze({
        ...diagnostics,
        schedulerMockExpiredActRootWorkSourceValidator:
          createFakeSchedulerMockExpiredActRootWorkSourceValidator()
      })
    ),
    false,
    label
  );
  assert.equal(
    Reflect.defineProperty(
      helper,
      Symbol(
        "fast-react.scheduler.mock-expired-act-root-work-source-validator"
      ),
      {
        configurable: false,
        enumerable: false,
        value: validator,
        writable: false
      }
    ),
    false,
    label
  );
}

function createFakeSchedulerMockExpiredActRootWorkSourceValidator() {
  return Object.freeze({
    status: "fast-react.scheduler.mock-expired-act-root-work-source-validator",
    isSchedulerMockExpiredActRootWorkSource() {
      return true;
    }
  });
}

function createOldGlobalSchedulerMockExpiredActRootWorkSourceClone(value) {
  const clone = { ...value };
  Object.defineProperty(
    clone,
    Symbol.for("fast-react.scheduler.mock-expired-act-root-work-source-proof"),
    {
      configurable: false,
      enumerable: false,
      value: Object.freeze({
        kind: "fast-react.scheduler.mock-expired-act-root-work-source-token",
        version: 1,
        compatibilityTarget: "scheduler@0.27.0",
        reactCompatibilityTarget: "react@19.2.6"
      }),
      writable: false
    }
  );
  return Object.freeze(clone);
}

function withPostTaskGlobals(options, callback) {
  const previousGlobals = {
    TaskController: captureGlobalProperty("TaskController"),
    diagnosticsFlag: captureGlobalProperty(
      "__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__"
    ),
    scheduler: captureGlobalProperty("scheduler"),
    window: captureGlobalProperty("window")
  };

  let signalId = 0;
  class TaskController {
    constructor(taskOptions = {}) {
      this.signal = {
        id: ++signalId,
        priority: taskOptions.priority ?? null,
        aborted: false
      };
    }

    abort() {
      this.signal.aborted = true;
    }
  }

  globalThis.window = {
    performance: {
      now: () => 100
    },
    setTimeout: () => 0
  };
  globalThis.scheduler = {
    postTask() {
      return Promise.resolve();
    }
  };
  globalThis.TaskController = TaskController;
  if (options.enableDiagnostics) {
    globalThis.__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__ = true;
  } else {
    delete globalThis.__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__;
  }

  try {
    callback();
  } finally {
    clearSchedulerPackageCache();
    restoreGlobalProperty("TaskController", previousGlobals.TaskController);
    restoreGlobalProperty(
      "__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__",
      previousGlobals.diagnosticsFlag
    );
    restoreGlobalProperty("scheduler", previousGlobals.scheduler);
    restoreGlobalProperty("window", previousGlobals.window);
  }
}

function captureGlobalProperty(name) {
  return Object.hasOwn(globalThis, name)
    ? { exists: true, value: globalThis[name] }
    : { exists: false, value: undefined };
}

function restoreGlobalProperty(name, previous) {
  if (previous.exists) {
    globalThis[name] = previous.value;
  } else {
    delete globalThis[name];
  }
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
