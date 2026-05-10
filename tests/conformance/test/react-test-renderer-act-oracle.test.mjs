import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  findReactTestRendererActObservation,
  readCheckedReactTestRendererActOracle,
  readCheckedReactTestRendererActOracleText
} from "../src/react-test-renderer-act-oracle.mjs";
import {
  REACT_TEST_RENDERER_ACT_ORACLE_ARTIFACT_PATH,
  REACT_TEST_RENDERER_ACT_PROBE_MODES,
  REACT_TEST_RENDERER_ACT_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_ACT_TARGET
} from "../src/react-test-renderer-act-targets.mjs";
import {
  REACT_TEST_RENDERER_ACT_SCENARIO_IDS,
  REACT_TEST_RENDERER_ACT_SCENARIOS
} from "../src/react-test-renderer-act-scenarios.mjs";

const oracle = readCheckedReactTestRendererActOracle();
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const compatibilityTarget = "react-test-renderer@19.2.6";
const actBlockedGateStatus =
  "blocked-until-react-test-renderer-act-queue-effects-and-renderer-roots";
const actSchedulerGateStatus =
  "blocked-private-react-test-renderer-act-scheduler-metadata-only";
const actUnblockingRequirements = [
  {
    id: "react-test-renderer-act-queue-flushing",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Test renderer act must wait for internal act queue task execution and continuation draining."
  },
  {
    id: "react-test-renderer-effect-flushing",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Test renderer act compatibility requires layout/passive effect callbacks to execute during renderer flushes."
  },
  {
    id: "react-test-renderer-public-root-routing",
    requiredBeforeCompatibilityClaim: true,
    reason:
      "Test renderer act needs public create, update, unmount, and serialization routes backed by renderer roots."
  }
];
const localEntrypoints = [
  {
    entrypoint: "react-test-renderer",
    modulePath: "packages/react-test-renderer/index.js",
    nodeEnv: "development",
    actExport: "function"
  },
  {
    entrypoint: "react-test-renderer",
    modulePath: "packages/react-test-renderer/index.js",
    nodeEnv: "production",
    actExport: "undefined"
  },
  {
    entrypoint: "react-test-renderer/cjs/react-test-renderer.development",
    modulePath:
      "packages/react-test-renderer/cjs/react-test-renderer.development.js",
    nodeEnv: "development",
    actExport: "function"
  },
  {
    entrypoint: "react-test-renderer/cjs/react-test-renderer.production",
    modulePath:
      "packages/react-test-renderer/cjs/react-test-renderer.production.js",
    nodeEnv: "production",
    actExport: "undefined"
  }
];

const TEST_RENDERER_EXPORT_KEYS = [
  "_Scheduler",
  "act",
  "create",
  "unstable_batchedUpdates",
  "version"
];

const MOCK_SCHEDULER_KEYS = [
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
const ACT_SCHEDULER_MISSING_BEFORE_EXECUTION = [
  "public-react-test-renderer-act-queue-drain",
  "public-react-test-renderer-scheduler-flush-execution",
  "public-react-test-renderer-root-sync-flush-route",
  "react-test-renderer-renderer-roots-compatibility-admission",
  "react-test-renderer-passive-effect-callback-execution",
  "react-test-renderer-private-root-request-execution"
];
const ACT_SCHEDULER_FLUSH_HELPER_METADATA = [
  [
    "unstable_flushAll",
    {
      type: "function",
      name: "",
      length: 0
    }
  ],
  [
    "unstable_flushAllWithoutAsserting",
    {
      type: "function",
      name: "unstable_flushAllWithoutAsserting",
      length: 0
    }
  ],
  [
    "unstable_flushExpired",
    {
      type: "function",
      name: "",
      length: 0
    }
  ],
  [
    "unstable_flushNumberOfYields",
    {
      type: "function",
      name: "",
      length: 1
    }
  ],
  [
    "unstable_flushUntilNextPaint",
    {
      type: "function",
      name: "",
      length: 0
    }
  ]
];
const ACT_SCHEDULER_ROOT_RECORD_IDS = [
  "act-root-schedule-request",
  "act-render-callback-request"
];
const ACT_SCHEDULER_REACT_DISPATCHER_RECORD_IDS = [
  "react-act-private-dispatcher-gate"
];
const ACT_SCHEDULER_SYNC_FLUSH_RECORD_IDS = [
  "sync-flush-act-continuation-record",
  "sync-flush-act-post-passive-continuation-gate",
  "sync-flush-post-passive-continuation-execution-gate",
  "sync-flush-post-passive-continuation-execution-record",
  "passive-effects-flush-with-sync-flush-continuation-result"
];
const ACT_SCHEDULER_PASSIVE_RECORD_IDS = [
  "pending-passive-commit-handoff",
  "passive-effects-flush-record",
  "function-component-pending-passive-effect-phase-record",
  "passive-effect-callback-invocation-gate-snapshot",
  "passive-effect-destroy-callback-execution-records"
];
const ACT_SCHEDULER_ROOT_FLUSH_RECORD_IDS = [
  "test-renderer-private-root-request-bridge",
  "test-renderer-private-root-update-unmount-lifecycle",
  "test-renderer-private-root-native-canary-metadata",
  "test-renderer-private-tojson-host-output-diagnostic",
  "test-renderer-private-testinstance-query-path"
];
const ACCEPTED_PRIVATE_ACT_FLUSH_PREREQUISITE_IDS = [
  "react-act-private-dispatcher-gate",
  "scheduler-act-queue-routing-records",
  "scheduler-mock-flush-helper-metadata",
  "sync-flush-act-continuation-records",
  "sync-flush-post-passive-continuation-execution-gate",
  "sync-flush-post-passive-private-execution-metadata",
  "passive-effect-flush-metadata",
  "passive-effect-private-callback-execution-metadata",
  "test-renderer-private-root-output-diagnostics",
  "test-renderer-private-root-request-records"
];
const BLOCKED_PRIVATE_ACT_FLUSH_PREREQUISITE_IDS = [
  "private-act-queue-drain-execution",
  "private-scheduler-flush-helper-execution",
  "private-passive-effect-callback-execution",
  "private-test-renderer-root-request-execution",
  "private-test-renderer-host-output-commit"
];

test("checked react-test-renderer act oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_TEST_RENDERER_ACT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-test-renderer-act-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-test-renderer-act-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact npm tarballs extracted into a temporary node_modules tree and probed through isolated Node child processes",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per react-test-renderer act scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary extraction roots and local workspace paths are normalized before artifact write"
  });

  assert.deepEqual(
    oracle.reactTestRendererTarget,
    REACT_TEST_RENDERER_ACT_TARGET
  );
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_TEST_RENDERER_ACT_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-test-renderer"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages["react-is"].version, "19.2.6");
  assert.deepEqual(oracle.packages["react-test-renderer"].tarball.files, [
    "LICENSE",
    "README.md",
    "cjs/react-test-renderer.development.js",
    "cjs/react-test-renderer.production.js",
    "index.js",
    "package.json",
    "shallow.js"
  ]);
});

test("react-test-renderer act oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactTestRendererBehaviorProbed: true,
    fastReactComparedToReactTestRenderer: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(
    oracle.evidenceClaims.fastReactComparedToReactTestRenderer,
    false
  );
  assert.equal(oracle.coverage.privateInternalsAvoided, true);
  assert.equal(oracle.coverage.realTimersAvoided, true);
});

test("react-test-renderer act oracle covers every scenario in every mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_TEST_RENDERER_ACT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_TEST_RENDERER_ACT_SCENARIOS);

  for (const mode of REACT_TEST_RENDERER_ACT_PROBE_MODES) {
    const observations = oracle.reactTestRendererObservations[mode.id];
    assert.equal(observations.length, REACT_TEST_RENDERER_ACT_SCENARIOS.length);

    for (const scenarioId of REACT_TEST_RENDERER_ACT_SCENARIO_IDS) {
      const observation = findReactTestRendererActObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.packageName, "react-test-renderer");
      assert.equal(observation.nodeEnv, mode.nodeEnv);
      assert.equal(observation.condition, mode.condition);
    }
  }
});

test("exported act shape differs deterministically between development and production", () => {
  const development = observation(
    "node-development",
    "react-test-renderer-act-export-shape"
  ).result;
  assert.deepEqual(development.exportKeys, TEST_RENDERER_EXPORT_KEYS);
  assert.equal(development.actEqualReactAct, true);
  assertFunctionExport(development.act, {
    key: "act",
    name: "",
    length: 1
  });
  assertFunctionExport(development.create, {
    key: "create",
    name: "",
    length: 2
  });
  assert.equal(development.version.value.value, "19.2.6");
  assert.deepEqual(development.schedulerExportKeys, MOCK_SCHEDULER_KEYS);
  assert.ok(
    development.selectedFiles.includes(
      "node_modules/react-test-renderer/cjs/react-test-renderer.development.js"
    )
  );

  const production = observation(
    "node-production",
    "react-test-renderer-act-export-shape"
  ).result;
  assert.deepEqual(production.exportKeys, TEST_RENDERER_EXPORT_KEYS);
  assert.equal(production.actEqualReactAct, true);
  assert.equal(production.act.hasOwn, true);
  assert.equal(production.act.value.type, "undefined");
  assert.ok(
    production.selectedFiles.includes(
      "node_modules/react-test-renderer/cjs/react-test-renderer.production.js"
    )
  );
});

test("development sync act flushes root updates and effect updates before completion", () => {
  const result = observation(
    "node-development",
    "react-test-renderer-act-sync-update-flushing"
  ).result;
  assert.equal(result.availability.status, "available");
  assert.deepEqual(result.actReturnShape.ownKeys, [
    {
      type: "string",
      value: "then"
    }
  ]);
  assert.deepEqual(result.actThenResolution, {
    type: "string",
    value: "sync-act-return"
  });
  assert.deepEqual(result.events, [
    "inside-after-create:null",
    "render:0",
    "effect:0",
    "effect-scheduled:set-1",
    "render:1",
    "effect:1"
  ]);
  assert.deepEqual(result.finalJSON, textJSON("1"));
  assert.equal(result.rootSchedulerIsPackageScheduler, true);

  const production = observation(
    "node-production",
    "react-test-renderer-act-sync-update-flushing"
  ).result;
  assert.equal(production.availability.status, "missing-act-function");
});

test("awaited async act resolves callback values and flushes work deterministically", () => {
  const result = observation(
    "node-development",
    "react-test-renderer-act-async-contracts"
  ).result;
  assert.equal(result.availability.status, "available");
  assert.deepEqual(result.resolvedValue, {
    type: "string",
    value: "async-act-return"
  });
  assert.deepEqual(result.events, [
    "inside-after-create:null",
    "inside-after-await:null",
    "render:Leaf",
    "effect:Leaf"
  ]);
  assert.deepEqual(result.finalJSON, textJSON("async-leaf"));
  assertDevelopmentDeprecationWarning(
    observation("node-development", "react-test-renderer-act-async-contracts")
      .consoleCalls
  );
});

test("deterministic act warning surfaces are captured without timers", () => {
  const result = observation(
    "node-development",
    "react-test-renderer-act-warning-surfaces"
  ).result;
  assert.equal(result.availability.status, "available");
  assert.equal(result.missingEnvironment.status, "ok");
  assertConsoleMessageIncludes(
    result.missingEnvironmentConsoleCalls,
    "The current testing environment is not configured to support act(...)"
  );
  assert.deepEqual(result.unawaitedThenableShape.ownKeys, [
    {
      type: "string",
      value: "then"
    }
  ]);
  assertConsoleMessageIncludes(
    result.unawaitedConsoleCalls,
    "You called act(async () => ...) without await"
  );
});

test("mock Scheduler exposure supports deterministic logical flushing", () => {
  for (const mode of ["node-development", "node-production"]) {
    const result = observation(
      mode,
      "react-test-renderer-act-scheduler-exposure"
    ).result;
    assert.equal(result.availability.status, "available");
    assert.deepEqual(result.exportKeys, MOCK_SCHEDULER_KEYS);
    assert.deepEqual(result.priorityConstants, {
      Immediate: 1,
      UserBlocking: 2,
      Normal: 3,
      Low: 4,
      Idle: 5
    });
    assert.deepEqual(result.currentPriority, {
      level: 3,
      label: "Normal"
    });
    assert.equal(result.now, 0);
    assert.deepEqual(result.logAndClear.value, ["first-yield"]);
    assert.equal(result.scheduleAndFlush.value.pendingBeforeFlush, true);
    assert.equal(result.scheduleAndFlush.value.flushReturn, true);
    assert.deepEqual(result.scheduleAndFlush.value.yielded, [
      "scheduled-callback"
    ]);
    assert.equal(result.scheduleAndFlush.value.pendingAfterFlush, false);
    assert.deepEqual(result.runWithPriority.value, {
      level: 4,
      label: "Low"
    });
  }
});

test("root unstable_flushSync flushes updates after the callback and restores after errors", () => {
  const development = observation(
    "node-development",
    "react-test-renderer-act-unstable-flush-sync"
  ).result;
  assert.equal(development.availability.status, "available");
  assert.equal(development.availability.actIsCallable, true);
  assertFunctionExport(development.rootShape.unstableFlushSync, {
    key: "unstable_flushSync",
    name: "flushSyncFromReconciler",
    length: 1
  });
  assert.deepEqual(development.beforeFlushJSON, textJSON("A"));
  assert.deepEqual(development.flushUpdate.value.before, textJSON("A"));
  assert.deepEqual(
    development.flushUpdate.value.callbackReturn.duringBeforeUpdate,
    textJSON("A")
  );
  assert.deepEqual(
    development.flushUpdate.value.callbackReturn.duringAfterUpdate,
    textJSON("A")
  );
  assert.deepEqual(development.flushUpdate.value.after, textJSON("B"));
  assertOkUndefined(development.noCallback);
  assertOkUndefined(development.nullCallback);
  assertOkUndefined(development.falseCallback);
  assertThrowsTypeError(development.truthyNonFunction, "fn is not a function");
  assertThrowsErrorWithCode(
    development.callbackThrows,
    "Error",
    "test renderer unstable_flushSync sentinel",
    "TEST_RENDERER_FLUSH_SYNC_SENTINEL"
  );
  assert.equal(development.afterThrow.value, "after-throw-return");
  assert.deepEqual(development.finalJSON, textJSON("C"));
  assertConsoleMessageIncludes(
    observation("node-development", "react-test-renderer-act-unstable-flush-sync")
      .consoleCalls,
    "An update to %s inside a test was not wrapped in act(...)"
  );

  const production = observation(
    "node-production",
    "react-test-renderer-act-unstable-flush-sync"
  ).result;
  assert.equal(production.availability.status, "available");
  assert.equal(production.availability.actIsCallable, false);
  assert.deepEqual(production.beforeFlushJSON, null);
  assert.deepEqual(production.flushUpdate.value.before, null);
  assert.deepEqual(production.flushUpdate.value.after, textJSON("B"));
  assert.deepEqual(production.finalJSON, textJSON("C"));
});

test("Fast React react-test-renderer act stays blocked behind accepted package and reconciler metadata", () => {
  assert.equal(
    oracle.conformanceClaims.fastReactComparedToReactTestRenderer,
    false
  );
  assert.equal(oracle.conformanceClaims.fastReactBehaviorCompatible, false);
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);

  const localGate = inspectLocalReactTestRendererActBlockedGate();
  assert.equal(localGate.status, actBlockedGateStatus);
  assert.deepEqual(localGate.unblockRequires, [
    "react-test-renderer-act-queue-flushing",
    "react-test-renderer-effect-flushing",
    "react-test-renderer-public-root-routing"
  ]);
  assert.equal(
    localGate.actQueueStatus,
    "private-flush-execution-metadata-without-public-act-drain"
  );
  assert.equal(
    localGate.effectExecutionStatus,
    "private-callback-execution-metadata-without-public-effect-execution"
  );
  assert.equal(
    localGate.rendererRootStatus,
    "private-root-output-diagnostics-with-public-renderer-roots-blocked"
  );
  assert.equal(localGate.actQueueFlushingReady, false);
  assert.equal(localGate.effectExecutionReady, false);
  assert.equal(localGate.rendererRootsReady, false);
  assert.equal(localGate.actSchedulerPrivateGatePresent, true);
  assert.equal(localGate.reactActPrivateDispatcherGateAccepted, true);
  assert.equal(localGate.schedulerMockFlushHelperMetadataAccepted, true);
  assert.equal(localGate.rootActRecordsAccepted, true);
  assert.equal(localGate.syncFlushActRecordsAccepted, true);
  assert.equal(localGate.postPassiveContinuationExecutionGateAccepted, true);
  assert.equal(localGate.privateSyncFlushExecutionMetadataPresent, true);
  assert.equal(localGate.privatePassiveCallbackExecutionMetadataPresent, true);
  assert.equal(localGate.privatePassiveDestroyExecutionMetadataPresent, true);
  assert.equal(localGate.passiveActFlushMetadataAccepted, true);
  assert.equal(localGate.rootRequestRecordsAccepted, true);
  assert.equal(localGate.privateRootOutputDiagnosticsAccepted, true);
  assert.equal(localGate.privateFlushExecutionMetadataAccepted, true);
  assert.equal(localGate.compatibilityClaimed, false);

  for (const requirement of actUnblockingRequirements) {
    assert.equal(requirement.requiredBeforeCompatibilityClaim, true);
    assert.equal(
      localGate.unblockRequires.includes(requirement.id),
      true,
      requirement.id
    );
    assert.match(requirement.reason, /Test renderer act/u);
  }

  for (const entry of localEntrypoints) {
    const moduleExports = loadFreshLocalEntrypoint(entry);
    assert.deepEqual(Object.keys(moduleExports), TEST_RENDERER_EXPORT_KEYS);
    assert.equal(moduleExports.__FAST_REACT_PLACEHOLDER__, true);
    assert.equal(moduleExports.__FAST_REACT_ENTRYPOINT__, entry.entrypoint);
    assert.equal(moduleExports.compatibilityTarget, compatibilityTarget);
    assert.deepEqual(
      Object.keys(moduleExports._Scheduler),
      MOCK_SCHEDULER_KEYS
    );
    assert.deepEqual(
      Reflect.ownKeys(moduleExports._Scheduler),
      MOCK_SCHEDULER_KEYS
    );

    const renderer = moduleExports.create(null);
    assert.equal(renderer._Scheduler, moduleExports._Scheduler);
    assert.equal(renderer.unstable_flushSync.length, 1);
    let flushSyncCallbackInvoked = false;
    const flushSyncError = captureThrown(() =>
      renderer.unstable_flushSync(() => {
        flushSyncCallbackInvoked = true;
      })
    );
    assert.equal(flushSyncCallbackInvoked, false, entry.entrypoint);
    assertReactTestRendererUnimplementedError(
      flushSyncError,
      entry.entrypoint,
      "create().unstable_flushSync"
    );
    assert.equal(
      flushSyncError.actSchedulerGate,
      flushSyncError.routingGate.actSchedulerGate
    );
    assertActSchedulerGate(
      flushSyncError.actSchedulerGate,
      entry.entrypoint
    );
    assertSchedulerFlushHelperDescriptorsMatchGate(
      moduleExports._Scheduler,
      flushSyncError.actSchedulerGate
    );
    assertActSurface(entry, moduleExports);
    assertSchedulerSurfaceBlocked(entry, moduleExports._Scheduler);
  }
});

test("development act propagates callback errors and aggregates multiple render errors", () => {
  const result = observation(
    "node-development",
    "react-test-renderer-act-error-aggregation"
  ).result;
  assert.equal(result.availability.status, "available");
  assertThrowsErrorWithCode(
    result.syncCallbackThrows,
    "Error",
    "sync act sentinel",
    "SYNC_ACT_SENTINEL"
  );
  assert.equal(result.asyncCallbackRejects.status, "rejected");
  assert.equal(result.asyncCallbackRejects.error.name, "TypeError");
  assert.equal(result.asyncCallbackRejects.error.message, "async act sentinel");
  assert.equal(result.asyncCallbackRejects.error.code, "ASYNC_ACT_SENTINEL");

  assert.equal(result.multiRootRenderThrows.status, "throws");
  assert.equal(result.multiRootRenderThrows.error.name, "AggregateError");
  assert.deepEqual(
    result.multiRootRenderThrows.error.errors.map((error) => ({
      name: error.name,
      message: error.message,
      code: error.code
    })),
    [
      {
        name: "Error",
        message: "render ONE",
        code: "ONE"
      },
      {
        name: "Error",
        message: "render TWO",
        code: "TWO"
      }
    ]
  );

  const production = observation(
    "node-production",
    "react-test-renderer-act-error-aggregation"
  ).result;
  assert.equal(production.availability.status, "missing-act-function");
});

test("react-test-renderer act oracle artifact does not leak temporary or local paths", () => {
  const oracleText = readCheckedReactTestRendererActOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\/fast-react-/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-test-renderer-act-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /\/Users\/user\/Developer\/Developer/u);
});

test("print react-test-renderer act oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-test-renderer-act-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedReactTestRendererActOracleText());
});

function observation(modeId, scenarioId) {
  return findReactTestRendererActObservation(oracle, modeId, scenarioId);
}

function textJSON(value) {
  return {
    type: "text",
    props: {},
    children: [value]
  };
}

function assertFunctionExport(exportObservation, { key, name, length }) {
  assert.equal(exportObservation.key, key);
  assert.equal(exportObservation.hasOwn, true);
  assert.equal(exportObservation.hasIn, true);
  assert.deepEqual(dataDescriptorFields(exportObservation.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(exportObservation.value, {
    type: "function",
    name,
    length,
    isAsync: false,
    ownKeys: [
      {
        type: "string",
        value: "length"
      },
      {
        type: "string",
        value: "name"
      },
      {
        type: "string",
        value: "prototype"
      }
    ]
  });
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function assertDevelopmentDeprecationWarning(consoleCalls) {
  assertConsoleMessageIncludes(
    consoleCalls,
    "react-test-renderer is deprecated. See https://react.dev/warnings/react-test-renderer"
  );
}

function assertConsoleMessageIncludes(consoleCalls, text) {
  assert.ok(
    consoleCalls.some((call) =>
      call.args.some(
        (arg) => arg.type === "string" && arg.value.includes(text)
      )
    ),
    `expected console call including ${text}`
  );
}

function assertOkUndefined(operation) {
  assert.equal(operation.status, "ok");
  assert.deepEqual(operation.value, {
    type: "undefined"
  });
}

function assertThrowsTypeError(operation, message) {
  assert.equal(operation.status, "throws");
  assert.equal(operation.error.name, "TypeError");
  assert.equal(operation.error.message, message);
}

function assertThrowsErrorWithCode(operation, name, message, code) {
  assert.equal(operation.status, "throws");
  assert.equal(operation.error.name, name);
  assert.equal(operation.error.message, message);
  assert.equal(operation.error.code, code);
}

function loadFreshLocalEntrypoint(entry) {
  const absolutePath = path.join(repoRoot, entry.modulePath);
  const resolved = require.resolve(absolutePath);
  const previousNodeEnv = process.env.NODE_ENV;

  if (entry.nodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = entry.nodeEnv;
  }

  delete require.cache[resolved];

  try {
    return require(resolved);
  } finally {
    delete require.cache[resolved];
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function inspectLocalReactTestRendererActBlockedGate() {
  const schedulerBridgeSource = readWorkspaceFile(
    "crates/fast-react-reconciler/src/scheduler_bridge.rs"
  );
  const rootSchedulerSource = readWorkspaceFile(
    "crates/fast-react-reconciler/src/root_scheduler.rs"
  );
  const syncFlushSource = readWorkspaceFile(
    "crates/fast-react-reconciler/src/sync_flush.rs"
  );
  const passiveEffectsSource = readWorkspaceFile(
    "crates/fast-react-reconciler/src/passive_effects.rs"
  );
  const reactPrivateActDispatcherSource = readWorkspaceFile(
    "packages/react/private-act-dispatcher-gate.js"
  );
  const reactDomClientSource = readWorkspaceFile("packages/react-dom/client.js");
  const testRendererSource = readWorkspaceFile(
    "packages/react-test-renderer/index.js"
  );
  const actQueueSource = [
    schedulerBridgeSource,
    rootSchedulerSource,
    syncFlushSource
  ].join("\n");
  const actQueueRecordsPresent =
    /\bSchedulerActQueueRequest\b/u.test(actQueueSource) &&
    /\bSchedulerActQueueTaskKind\b/u.test(actQueueSource) &&
    /\bFAKE_ACT_CALLBACK_NODE\b/u.test(actQueueSource);
  const actContinuationMetadataPresent =
    /\bSchedulerActContinuationRecord\b/u.test(actQueueSource) &&
    /\brecord_sync_flush_act_continuation\b/u.test(actQueueSource);
  const postPassiveContinuationExecutionGatePresent =
    /\bSyncFlushPostPassiveContinuationExecutionGateRecord\b/u.test(
      rootSchedulerSource
    ) &&
    /\bsync_flush_post_passive_continuation_execution_gate\b/u.test(
      rootSchedulerSource
    );
  const privateSyncFlushExecutionMetadataPresent =
    /\bSyncFlushPostPassiveContinuationExecutionRecord\b/u.test(
      syncFlushSource
    ) &&
    /\bflush_sync_post_passive_continuation_after_passive_effects\b/u.test(
      syncFlushSource
    ) &&
    /\bPassiveEffectsFlushWithSyncFlushContinuationResult\b/u.test(
      passiveEffectsSource
    ) &&
    /\bflush_passive_effects_after_commit_and_sync_flush_continuation\b/u.test(
      passiveEffectsSource
    );
  const actFlushExecutionPresent =
    /\b(?:flush|drain)_act_queue\b|\b(?:flush|drain)ActQueue\b|\brecursivelyFlushAsyncActWork\b/u.test(
      actQueueSource
    );
  const passiveEffectMetadataOnly =
    /does not traverse hook rings, invoke create\/destroy callbacks/u.test(
      passiveEffectsSource
    ) ||
    /default flush path remains metadata-only/u.test(passiveEffectsSource) ||
    /detached from public effect execution/u.test(passiveEffectsSource);
  const privatePassiveCallbackExecutionMetadataPresent =
    /\bPassiveEffectCallbackInvocationGateSnapshot\b/u.test(
      passiveEffectsSource
    ) &&
    /\binvoke_passive_effect_callbacks_under_test_control\b/u.test(
      passiveEffectsSource
    ) &&
    /\bPASSIVE_EFFECT_CALLBACK_INVOCATION_GATE_BLOCKERS\b/u.test(
      passiveEffectsSource
    );
  const privatePassiveDestroyExecutionMetadataPresent =
    /\bPassiveEffectDestroyCallbackExecutionRecord\b/u.test(
      passiveEffectsSource
    ) &&
    /\bflush_passive_effects_after_commit_with_destroy_executor\b/u.test(
      passiveEffectsSource
    );
  const publicEffectCallbackExecutionPresent =
    /\bpublic_effect_execution_enabled\(&self\) -> bool \{\s*true\s*\}/u.test(
      passiveEffectsSource
    );
  const reactDomClientRootPlaceholder =
    /createUnsupportedFunction\(entrypoint, 'createRoot'/u.test(
      reactDomClientSource
    );
  const testRendererRootPlaceholder =
    /\bFastReactTestRendererUnimplementedError\b/u.test(testRendererSource) &&
    /Root updates are intentionally blocked/u.test(testRendererSource) &&
    /Synchronous flushing is intentionally blocked/u.test(testRendererSource);
  const actSchedulerPrivateGatePresent =
    /react-test-renderer-act-scheduler-private-gate/u.test(
      testRendererSource
    ) &&
    /blocked-private-react-test-renderer-act-scheduler-metadata-only/u.test(
      testRendererSource
    );
  const schedulerMockFlushHelperMetadataAccepted =
    actSchedulerPrivateGatePresent &&
    /unstable_flushAllWithoutAsserting/u.test(testRendererSource) &&
    /scheduler-mock-export-shape/u.test(testRendererSource);
  const reactActPrivateDispatcherGateAccepted =
    actSchedulerPrivateGatePresent &&
    /__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__/u.test(testRendererSource) &&
    /fast-react\.react\.act-queue-metadata/u.test(
      reactPrivateActDispatcherSource
    );
  const rootActRecordsAccepted =
    actSchedulerPrivateGatePresent &&
    /SchedulerActQueueRequest/u.test(testRendererSource) &&
    /SchedulerActQueueTaskKind::RootSchedule/u.test(testRendererSource) &&
    /SchedulerActQueueTaskKind::RenderCallback/u.test(testRendererSource);
  const syncFlushActRecordsAccepted =
    actSchedulerPrivateGatePresent &&
    /SchedulerActContinuationRecord/u.test(testRendererSource) &&
    /SyncFlushActPostPassiveContinuationGateRecord/u.test(
      testRendererSource
    ) &&
    /SyncFlushPostPassiveContinuationExecutionGateRecord/u.test(
      testRendererSource
    );
  const passiveActFlushMetadataAccepted =
    actSchedulerPrivateGatePresent &&
    /PassiveEffectFlushRecord/u.test(testRendererSource) &&
    /FunctionComponentPendingPassiveEffectPhaseCommitRecord/u.test(
      testRendererSource
    );
  const rootRequestRecordsAccepted =
    actSchedulerPrivateGatePresent &&
    /FastReactTestRendererPrivateRootRequestRecord/u.test(testRendererSource) &&
    /fast\.react_test_renderer\.root_request_bridge/u.test(
      testRendererSource
    );
  const privateRootOutputDiagnosticsAccepted =
    actSchedulerPrivateGatePresent &&
    /FastReactTestRendererCurrentRustCanaryMetadata/u.test(
      testRendererSource
    ) &&
    /TestRendererHostOutputDiagnostics/u.test(testRendererSource) &&
    /TestRendererPrivateJsonSerializationReport/u.test(testRendererSource) &&
    /TestRendererCommittedFiberTreeInspection/u.test(testRendererSource);
  const actQueueFlushingReady = actFlushExecutionPresent;
  const effectExecutionReady = publicEffectCallbackExecutionPresent;
  const rendererRootsReady =
    !reactDomClientRootPlaceholder && !testRendererRootPlaceholder;

  return {
    status: actBlockedGateStatus,
    unblockRequires: actUnblockingRequirements.map(
      (requirement) => requirement.id
    ),
    actQueueStatus: actQueueFlushingReady
      ? "flush-execution-token-present-needs-explicit-admission"
      : privateSyncFlushExecutionMetadataPresent
        ? "private-flush-execution-metadata-without-public-act-drain"
        : actQueueRecordsPresent && actContinuationMetadataPresent
        ? "private-records-and-continuation-metadata-without-flushing"
        : "missing-private-act-queue-metadata",
    effectExecutionStatus: effectExecutionReady
      ? "public-effect-callback-execution-enabled-needs-explicit-admission"
      : privatePassiveCallbackExecutionMetadataPresent ||
          privatePassiveDestroyExecutionMetadataPresent
        ? "private-callback-execution-metadata-without-public-effect-execution"
      : passiveEffectMetadataOnly
        ? "metadata-only-no-callback-execution"
        : "effect-callback-execution-not-detected",
    rendererRootStatus: rendererRootsReady
      ? "public-renderer-roots-need-explicit-admission"
      : privateRootOutputDiagnosticsAccepted
        ? "private-root-output-diagnostics-with-public-renderer-roots-blocked"
      : "public-renderer-roots-placeholder-blocked",
    actQueueRecordsPresent,
    actContinuationMetadataPresent,
    postPassiveContinuationExecutionGatePresent,
    privateSyncFlushExecutionMetadataPresent,
    privatePassiveCallbackExecutionMetadataPresent,
    privatePassiveDestroyExecutionMetadataPresent,
    actSchedulerPrivateGatePresent,
    reactActPrivateDispatcherGateAccepted,
    schedulerMockFlushHelperMetadataAccepted,
    rootActRecordsAccepted,
    syncFlushActRecordsAccepted,
    postPassiveContinuationExecutionGateAccepted:
      postPassiveContinuationExecutionGatePresent &&
      /sync-flush-post-passive-continuation-execution-gate/u.test(
        testRendererSource
      ),
    passiveActFlushMetadataAccepted,
    rootRequestRecordsAccepted,
    privateRootOutputDiagnosticsAccepted,
    privateFlushExecutionMetadataAccepted:
      privateSyncFlushExecutionMetadataPresent &&
      (privatePassiveCallbackExecutionMetadataPresent ||
        privatePassiveDestroyExecutionMetadataPresent) &&
      privateRootOutputDiagnosticsAccepted,
    actQueueFlushingReady,
    effectExecutionReady,
    rendererRootsReady,
    compatibilityClaimed: false
  };
}

function assertActSurface(entry, moduleExports) {
  if (entry.actExport === "undefined") {
    assert.equal(moduleExports.act, undefined, entry.entrypoint);
    return;
  }

  let callbackInvoked = false;
  const error = captureThrown(() =>
    moduleExports.act(() => {
      callbackInvoked = true;
      throw new Error("act callback must not run");
    })
  );

  assert.equal(callbackInvoked, false, entry.entrypoint);
  assertReactTestRendererUnimplementedError(error, entry.entrypoint, "act");
  assert.equal(Object.hasOwn(error, "routingGate"), false);
  assert.equal(Object.hasOwn(error, "missingPrerequisites"), false);
  assertActSchedulerGate(error.actSchedulerGate, entry.entrypoint);
  assert.equal(error.queuedWorkExecution, false);
  assert.equal(error.reactActPrivateDispatcherGateAccepted, true);
  assert.equal(error.postPassiveContinuationExecutionGateAccepted, true);
  assert.equal(error.passiveActFlushMetadataAccepted, true);
  assert.equal(error.rootRequestRecordsAccepted, true);
  assert.equal(error.privateFlushExecutionMetadataAccepted, true);
  assert.equal(error.privateSyncFlushExecutionMetadataAccepted, true);
  assert.equal(error.privatePassiveCallbackExecutionMetadataAccepted, true);
  assert.equal(error.privateRootOutputDiagnosticsAccepted, true);
  assert.equal(error.privateFlushExecutionReady, false);
  assert.equal(error.publicSchedulerFlushExecutionAvailable, false);
  assert.equal(error.schedulerFlushCompatibilityClaimed, false);
  assert.equal(error.passiveEffectExecution, false);
  assert.equal(error.effectCallbackExecution, false);
  assert.equal(error.rootRequestExecution, false);
  assert.equal(error.privateRootRequestExecutionAvailable, false);
  assert.equal(error.rendererRootsCompatibilityClaimed, false);
}

function assertSchedulerSurfaceBlocked(entry, scheduler) {
  assert.deepEqual(
    {
      Immediate: scheduler.unstable_ImmediatePriority,
      UserBlocking: scheduler.unstable_UserBlockingPriority,
      Normal: scheduler.unstable_NormalPriority,
      Low: scheduler.unstable_LowPriority,
      Idle: scheduler.unstable_IdlePriority,
      Profiling: scheduler.unstable_Profiling
    },
    {
      Immediate: 1,
      UserBlocking: 2,
      Normal: 3,
      Low: 4,
      Idle: 5,
      Profiling: null
    }
  );

  let scheduledCallbackInvoked = false;
  const scheduleError = captureThrown(() =>
    scheduler.unstable_scheduleCallback(
      scheduler.unstable_NormalPriority,
      () => {
        scheduledCallbackInvoked = true;
      }
    )
  );
  assert.equal(scheduledCallbackInvoked, false, entry.entrypoint);
  assertReactTestRendererUnimplementedError(
    scheduleError,
    entry.entrypoint,
    "_Scheduler.unstable_scheduleCallback"
  );
  assert.equal(Object.hasOwn(scheduleError, "routingGate"), false);
  assertActSchedulerGate(scheduleError.actSchedulerGate, entry.entrypoint);
  assert.equal(scheduledCallbackInvoked, false, entry.entrypoint);

  for (const method of [
    "unstable_flushAll",
    "unstable_flushNumberOfYields",
    "unstable_clearLog"
  ]) {
    const error = captureThrown(() => scheduler[method]());
    assertReactTestRendererUnimplementedError(
      error,
      entry.entrypoint,
      `_Scheduler.${method}`
    );
    assert.equal(Object.hasOwn(error, "routingGate"), false);
    assertActSchedulerGate(error.actSchedulerGate, entry.entrypoint);
  }
}

function assertActSchedulerGate(gate, entrypoint) {
  assert.equal(Object.isFrozen(gate), true, entrypoint);
  assert.equal(gate.id, "react-test-renderer-act-scheduler-private-gate");
  assert.equal(gate.status, actSchedulerGateStatus);
  assert.equal(gate.entrypoint, entrypoint);
  assert.equal(gate.deterministic, true);
  assert.deepEqual(gate.acceptedWorkers, [
    "worker-176-act-queue-routing-skeleton",
    "worker-252-sync-flush-act-continuation-skeleton",
    "worker-277-react-act-queue-private-dispatcher-gate",
    "worker-280-scheduler-mock-flush-helper-gate",
    "worker-285-sync-flush-act-continuation-post-passive-gate",
    "worker-296-passive-effect-callback-handle-flush-gate",
    "worker-301-hook-effect-destroy-handoff-metadata",
    "worker-303-sync-flush-passive-continuation-execution-gate",
    "worker-304-test-renderer-js-private-root-request-bridge",
    "worker-307-test-renderer-update-unmount-private-js-bridge",
    "worker-326-passive-effect-create-destroy-callback-invocation-gate",
    "worker-331-sync-flush-passive-continuation-execution",
    "worker-332-test-renderer-js-private-root-native-bridge",
    "worker-333-test-renderer-tojson-host-output-private-path",
    "worker-334-test-renderer-testinstance-private-query-path",
    "worker-349-hook-effect-destroy-callback-execution-private"
  ]);
  assert.equal(gate.publicActBehaviorAvailable, false);
  assert.equal(gate.publicSchedulerFlushExecutionAvailable, false);
  assert.equal(gate.publicRootSyncFlushRouteAvailable, false);
  assert.equal(gate.publicPassiveEffectFlushExecutionAvailable, false);
  assert.equal(gate.privateRootRequestExecutionAvailable, false);
  assert.equal(gate.schedulerFlushCompatibilityClaimed, false);
  assert.equal(gate.schedulerMockFlushExecution, false);
  assert.equal(gate.queuedWorkExecution, false);
  assert.equal(gate.passiveEffectExecution, false);
  assert.equal(gate.effectCallbackExecution, false);
  assert.equal(gate.rootRequestExecution, false);
  assert.equal(gate.hostOutputMutation, false);
  assert.equal(gate.rendererRootsCompatibilityClaimed, false);
  assert.equal(gate.compatibilityClaimed, false);
  assert.equal(gate.reactActPrivateDispatcherGateAccepted, true);
  assert.equal(gate.schedulerMockFlushHelperMetadataAccepted, true);
  assert.equal(gate.rootActRecordsAccepted, true);
  assert.equal(gate.syncFlushActRecordsAccepted, true);
  assert.equal(gate.postPassiveContinuationExecutionGateAccepted, true);
  assert.equal(gate.passiveActFlushMetadataAccepted, true);
  assert.equal(gate.rootRequestRecordsAccepted, true);
  assert.equal(gate.privateFlushExecutionMetadataAccepted, true);
  assert.equal(gate.privateSyncFlushExecutionMetadataAccepted, true);
  assert.equal(gate.privatePassiveCallbackExecutionMetadataAccepted, true);
  assert.equal(gate.privateRootOutputDiagnosticsAccepted, true);
  assert.equal(gate.privateFlushPrerequisitesPresent, true);
  assert.equal(gate.privateFlushExecutionReady, false);
  assert.deepEqual(
    gate.recognizedReactActPrivateDispatcherRecords.map((record) => record.id),
    ACT_SCHEDULER_REACT_DISPATCHER_RECORD_IDS
  );
  assert.deepEqual(
    gate.recognizedSchedulerMockFlushHelpers.map((record) => [
      record.key,
      record.descriptor.value
    ]),
    ACT_SCHEDULER_FLUSH_HELPER_METADATA
  );
  assert.deepEqual(
    gate.recognizedRootActRecords.map((record) => record.id),
    ACT_SCHEDULER_ROOT_RECORD_IDS
  );
  assert.deepEqual(
    gate.recognizedSyncFlushActRecords.map((record) => record.id),
    ACT_SCHEDULER_SYNC_FLUSH_RECORD_IDS
  );
  assert.deepEqual(
    gate.recognizedPassiveActFlushRecords.map((record) => record.id),
    ACT_SCHEDULER_PASSIVE_RECORD_IDS
  );
  assert.deepEqual(
    gate.recognizedRootActFlushRecords.map((record) => record.id),
    ACT_SCHEDULER_ROOT_FLUSH_RECORD_IDS
  );
  assert.deepEqual(
    gate.acceptedPrivateFlushPrerequisiteIds,
    ACCEPTED_PRIVATE_ACT_FLUSH_PREREQUISITE_IDS
  );
  assert.deepEqual(
    gate.blockedPrivateFlushPrerequisiteIds,
    BLOCKED_PRIVATE_ACT_FLUSH_PREREQUISITE_IDS
  );
  assert.deepEqual(
    gate.acceptedPrivateFlushPrerequisites.map((record) => record.id),
    ACCEPTED_PRIVATE_ACT_FLUSH_PREREQUISITE_IDS
  );
  assert.deepEqual(
    gate.blockedPrivateFlushPrerequisites.map((record) => record.id),
    BLOCKED_PRIVATE_ACT_FLUSH_PREREQUISITE_IDS
  );
  assert.deepEqual(gate.sideEffectPolicy, {
    invokesActCallback: false,
    executesQueuedWork: false,
    executesScheduledCallbacks: false,
    executesSyncFlush: false,
    executesPassiveEffects: false,
    executesRootRequests: false,
    mutatesHostOutput: false,
    acceptsPrivateFlushExecutionMetadata: true,
    executesPublicSchedulerTasks: false,
    compatibilityClaimed: false
  });

  for (const record of [
    ...gate.recognizedReactActPrivateDispatcherRecords,
    ...gate.recognizedRootActRecords,
    ...gate.recognizedSyncFlushActRecords,
    ...gate.recognizedPassiveActFlushRecords,
    ...gate.recognizedRootActFlushRecords
  ]) {
    assert.equal(Object.isFrozen(record), true, record.id);
    if (Object.hasOwn(record, "queuedWorkExecution")) {
      assert.equal(record.queuedWorkExecution, false, record.id);
    }
    if (Object.hasOwn(record, "acceptedFields")) {
      assert.equal(Object.isFrozen(record.acceptedFields), true, record.id);
    }
  }

  assert.equal(
    gate.recognizedSyncFlushActRecords[1].passiveEffectExecution,
    false
  );
  assert.equal(
    gate.recognizedSyncFlushActRecords[2].syncFlushExecution,
    false
  );
  assert.equal(
    gate.recognizedSyncFlushActRecords[3].privateFlushExecutionMetadata,
    true
  );
  assert.equal(
    gate.recognizedSyncFlushActRecords[4].publicSchedulerTaskExecution,
    false
  );
  assert.equal(
    gate.recognizedPassiveActFlushRecords[1].createCallbackInvoked,
    false
  );
  assert.equal(
    gate.recognizedPassiveActFlushRecords[1].destroyCallbackInvoked,
    false
  );
  assert.equal(
    gate.recognizedPassiveActFlushRecords[3].testControlOnly,
    true
  );
  assert.equal(
    gate.recognizedPassiveActFlushRecords[4].privateDestroyExecutionMetadata,
    true
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[0].privateRootRequestExecution,
    false
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[2].privateHostOutputDiagnosticsAccepted,
    true
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[3].privateHostOutputDiagnosticsSerializable,
    true
  );
  assert.equal(
    gate.recognizedRootActFlushRecords[4].publicTestInstanceObjectAvailable,
    false
  );
  assert.equal(Object.isFrozen(gate.missingBeforeExecution), true);
  assert.deepEqual(
    gate.missingBeforeExecution,
    ACT_SCHEDULER_MISSING_BEFORE_EXECUTION
  );
}

function assertSchedulerFlushHelperDescriptorsMatchGate(scheduler, gate) {
  for (const helper of gate.recognizedSchedulerMockFlushHelpers) {
    const descriptor = Object.getOwnPropertyDescriptor(scheduler, helper.key);
    assert.deepEqual(
      {
        kind: "value" in descriptor ? "data" : "accessor",
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        writable: descriptor.writable,
        value: {
          type: typeof descriptor.value,
          name: descriptor.value.name,
          length: descriptor.value.length
        }
      },
      helper.descriptor,
      helper.key
    );
  }
}

function assertReactTestRendererUnimplementedError(
  error,
  entrypoint,
  exportName
) {
  assert.equal(error.name, "FastReactTestRendererUnimplementedError");
  assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
  assert.equal(error.entrypoint, entrypoint);
  assert.equal(error.exportName, exportName);
  assert.equal(error.compatibilityTarget, compatibilityTarget);
  assert.match(
    error.message,
    /no React Test Renderer behavior implementation yet/
  );
}

function captureThrown(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }

  assert.fail("Expected callback to throw");
}

function readWorkspaceFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}
