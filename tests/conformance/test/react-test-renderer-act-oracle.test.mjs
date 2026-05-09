import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

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
