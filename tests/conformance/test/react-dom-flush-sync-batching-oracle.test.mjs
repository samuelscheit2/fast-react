import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findReactDomFlushSyncBatchingObservation,
  readCheckedReactDomFlushSyncBatchingOracle,
  readCheckedReactDomFlushSyncBatchingOracleText
} from "../src/react-dom-flush-sync-batching-oracle.mjs";
import {
  REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS,
  REACT_DOM_FLUSH_SYNC_BATCHING_ORACLE_ARTIFACT_PATH,
  REACT_DOM_FLUSH_SYNC_BATCHING_PROBE_MODES,
  REACT_DOM_FLUSH_SYNC_BATCHING_SUPPORTING_TARGETS,
  REACT_DOM_FLUSH_SYNC_BATCHING_TARGET
} from "../src/react-dom-flush-sync-batching-targets.mjs";
import {
  REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIO_IDS,
  REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIOS
} from "../src/react-dom-flush-sync-batching-scenarios.mjs";

const oracle = readCheckedReactDomFlushSyncBatchingOracle();

test("checked React DOM flushSync/batching oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_FLUSH_SYNC_BATCHING_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-flush-sync-batching-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-flush-sync-batching-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per React DOM entrypoint, scenario, condition, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary extraction roots and local workspace paths are normalized before artifact write"
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_FLUSH_SYNC_BATCHING_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_FLUSH_SYNC_BATCHING_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM flushSync/batching oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.evidenceClaims.privateReactDomInternalsRead, false);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-private-update-priority-reads"
    ),
    true
  );
});

test("React DOM flushSync/batching oracle covers every scenario for each mode and entrypoint", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_FLUSH_SYNC_BATCHING_PROBE_MODES);
  assert.deepEqual(oracle.entrypoints, REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS);
  assert.deepEqual(oracle.scenarios, REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIOS);

  for (const mode of REACT_DOM_FLUSH_SYNC_BATCHING_PROBE_MODES) {
    const observations = oracle.reactDomObservations[mode.id];
    assert.equal(
      observations.length,
      REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS.length *
        REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIOS.length
    );

    for (const entrypoint of REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS) {
      for (const scenarioId of REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIO_IDS) {
        const observation = findReactDomFlushSyncBatchingObservation(
          oracle,
          mode.id,
          entrypoint.id,
          scenarioId
        );
        assert.equal(observation.entrypointSubpath, entrypoint.subpath);
        assert.equal(observation.specifier, entrypoint.publicSpecifier);
        assert.equal(observation.packageName, "react-dom");
        assert.equal(observation.nodeEnv, mode.nodeEnv);
        assert.equal(observation.condition, mode.condition);
        assert.deepEqual(observation.consoleCalls, []);
      }
    }
  }
});

test("default React DOM root exports callable flushSync and unstable_batchedUpdates shapes", () => {
  const root = observation(
    "default-node-development",
    "root",
    "react-dom-flush-sync-batching-export-shape"
  ).result;
  assert.deepEqual(root.exportKeys, [
    "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
    "createPortal",
    "flushSync",
    "preconnect",
    "prefetchDNS",
    "preinit",
    "preinitModule",
    "preload",
    "preloadModule",
    "requestFormReset",
    "unstable_batchedUpdates",
    "useFormState",
    "useFormStatus",
    "version"
  ]);
  assertFunctionExport(root.flushSync, {
    key: "flushSync",
    length: 1
  });
  assertFunctionExport(root.unstable_batchedUpdates, {
    key: "unstable_batchedUpdates",
    length: 2
  });

  const profiling = observation(
    "default-node-production",
    "profiling",
    "react-dom-flush-sync-batching-export-shape"
  ).result;
  assert.ok(profiling.exportKeys.includes("createRoot"));
  assert.ok(profiling.exportKeys.includes("hydrateRoot"));
  assertFunctionExport(profiling.flushSync, {
    key: "flushSync",
    length: 1
  });
  assertFunctionExport(profiling.unstable_batchedUpdates, {
    key: "unstable_batchedUpdates",
    length: 2
  });
});

test("callback return values and arguments match React DOM 19.2.6", () => {
  const result = observation(
    "default-node-development",
    "root",
    "react-dom-flush-sync-batching-callback-contracts"
  ).result;

  assert.equal(result.availability.status, "available");
  assert.equal(result.flushSync.status, "ok");
  assert.deepEqual(result.flushSync.value.callbackThis, { type: "undefined" });
  assert.deepEqual(result.flushSync.value.callbackArgs, []);
  assert.equal(result.flushSync.value.callbackArgCount, 0);
  assert.equal(result.flushSync.value.returnedSameObject, true);

  assert.equal(result.unstable_batchedUpdates.status, "ok");
  assert.deepEqual(result.unstable_batchedUpdates.value.callbackThis, {
    type: "undefined"
  });
  assert.equal(result.unstable_batchedUpdates.value.callbackArgCount, 1);
  assert.equal(
    result.unstable_batchedUpdates.value.firstArgumentSameObject,
    true
  );
  assert.equal(
    result.unstable_batchedUpdates.value.ignoredExtraArgumentReceived,
    false
  );
  assert.equal(result.unstable_batchedUpdates.value.returnedSameObject, true);
});

test("rootless inputs do not require DOM globals and distinguish falsy callbacks", () => {
  const result = observation(
    "default-node-production",
    "root",
    "react-dom-flush-sync-batching-rootless-inputs"
  ).result;

  assert.equal(result.availability.status, "available");
  assert.deepEqual(result.beforeGlobals, {
    hasWindow: false,
    hasDocument: false,
    hasHTMLElement: false,
    hasNode: false
  });
  assert.deepEqual(result.afterGlobals, result.beforeGlobals);
  assert.equal(result.domGlobalsUnchanged, true);

  assertOkUndefined(result.flushSyncNoCallback);
  assertOkUndefined(result.flushSyncUndefinedCallback);
  assertOkUndefined(result.flushSyncNullCallback);
  assertOkUndefined(result.flushSyncFalseCallback);
  assertThrowsTypeError(result.flushSyncTruthyNonFunction, "fn is not a function");

  assertThrowsTypeError(result.batchedUpdatesNoCallback, "fn is not a function");
  assertThrowsTypeError(result.batchedUpdatesNullCallback, "fn is not a function");
  assertThrowsTypeError(
    result.batchedUpdatesTruthyNonFunction,
    "fn is not a function"
  );
  assert.deepEqual(result.batchedUpdatesUndefinedArg.value.callbackArgs, [
    { type: "undefined" }
  ]);
});

test("callback errors propagate and later calls still restore callable state", () => {
  const result = observation(
    "default-node-development",
    "profiling",
    "react-dom-flush-sync-batching-error-propagation"
  ).result;

  assert.equal(result.availability.status, "available");
  assert.deepEqual(result.schedulerPriorityBefore, {
    level: 3,
    label: "Normal"
  });
  assertThrowsErrorWithCode(
    result.flushSyncThrowsCallbackError,
    "Error",
    "flushSync sentinel error",
    "FLUSH_SYNC_SENTINEL"
  );
  assert.deepEqual(result.flushSyncAfterThrow.value, {
    type: "string",
    value: "flush-after-throw"
  });
  assertThrowsErrorWithCode(
    result.batchedUpdatesThrowsCallbackError,
    "TypeError",
    "batchedUpdates sentinel error",
    "BATCHED_UPDATES_SENTINEL"
  );
  assert.deepEqual(result.batchedUpdatesAfterThrow.value, {
    type: "string",
    value: "batched-after-throw:ok"
  });
  assert.deepEqual(result.schedulerPriorityAfter, {
    level: 3,
    label: "Normal"
  });
});

test("nested flushSync and unstable_batchedUpdates calls are synchronous passthroughs", () => {
  const result = observation(
    "default-node-development",
    "root",
    "react-dom-flush-sync-batching-nested-calls"
  ).result;

  assert.deepEqual(result.nestedFlushSync.value.events, [
    "flush-outer-start",
    "flush-inner",
    "flush-inner-return:flush-inner-return",
    "flush-outer-end"
  ]);
  assert.deepEqual(result.nestedFlushSync.value.outerReturn, {
    type: "string",
    value: "flush-outer-return"
  });

  assert.deepEqual(result.nestedBatchedUpdates.value.events, [
    "batch-outer-start:outer-arg",
    "batch-inner:inner-arg",
    "batch-inner-return:batch-inner-return",
    "batch-outer-end"
  ]);
  assert.deepEqual(result.nestedBatchedUpdates.value.outerReturn, {
    type: "string",
    value: "batch-outer-return"
  });

  assert.deepEqual(result.flushInsideBatchedUpdates.value.events, [
    "batch-before-flush:batch-arg",
    "flush-inside-batch",
    "flush-return:flush-inside-batch-return"
  ]);
  assert.deepEqual(result.batchedUpdatesInsideFlushSync.value.events, [
    "flush-before-batch",
    "batch-inside-flush:batch-arg",
    "batch-return:batch-inside-flush-return"
  ]);
});

test("public Scheduler priority observations stay scoped to public Scheduler state", () => {
  const result = observation(
    "default-node-production",
    "root",
    "react-dom-flush-sync-batching-public-scheduler-priority"
  ).result;

  assert.deepEqual(result.defaultPriorityBefore, {
    level: 3,
    label: "Normal"
  });
  assert.deepEqual(result.flushSyncDefaultPriority.value.returnedPriority, {
    level: 3,
    label: "Normal"
  });
  assert.deepEqual(
    result.flushSyncInsideUserBlockingPriority.value.returnedPriority,
    {
      level: 2,
      label: "UserBlocking"
    }
  );
  assert.deepEqual(result.priorityAfterUserBlockingFlushSync, {
    level: 3,
    label: "Normal"
  });
  assert.deepEqual(result.batchedUpdatesDefaultPriority.value.returnedPriority, {
    level: 3,
    label: "Normal"
  });
  assert.deepEqual(result.batchedUpdatesInsideLowPriority.value.returnedPriority, {
    level: 4,
    label: "Low"
  });
  assert.deepEqual(result.priorityAfterLowPriorityBatchedUpdates, {
    level: 3,
    label: "Normal"
  });
});

test("react-server condition records root API absence and profiling entrypoint rejection", () => {
  const rootShape = observation(
    "react-server-production",
    "root",
    "react-dom-flush-sync-batching-export-shape"
  ).result;
  assert.deepEqual(rootShape.exportKeys, [
    "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
    "preconnect",
    "prefetchDNS",
    "preinit",
    "preinitModule",
    "preload",
    "preloadModule",
    "version"
  ]);
  assert.equal(rootShape.flushSync.hasOwn, false);
  assert.equal(rootShape.unstable_batchedUpdates.hasOwn, false);

  const rootBehavior = observation(
    "react-server-production",
    "root",
    "react-dom-flush-sync-batching-callback-contracts"
  ).result;
  assert.equal(rootBehavior.availability.status, "missing-required-functions");

  const profilingShape = observation(
    "react-server-production",
    "profiling",
    "react-dom-flush-sync-batching-export-shape"
  ).result;
  assert.equal(profilingShape.moduleLoad.status, "throws");
  assert.equal(
    profilingShape.moduleLoad.message,
    "react-dom/profiling is not supported in React Server Components."
  );

  const profilingBehavior = observation(
    "react-server-production",
    "profiling",
    "react-dom-flush-sync-batching-rootless-inputs"
  ).result;
  assert.equal(profilingBehavior.availability.status, "module-load-throws");
});

test("React DOM flushSync/batching oracle artifact does not leak temporary or local paths", () => {
  const oracleText = readCheckedReactDomFlushSyncBatchingOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\/fast-react-/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-flush-sync-batching-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /\/Users\/user\/Developer\/Developer/u);
});

test("print React DOM flushSync/batching oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-flush-sync-batching-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedReactDomFlushSyncBatchingOracleText());
});

function observation(modeId, entrypointId, scenarioId) {
  return findReactDomFlushSyncBatchingObservation(
    oracle,
    modeId,
    entrypointId,
    scenarioId
  );
}

function assertFunctionExport(exportObservation, { key, length }) {
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
    name: "",
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

function assertOkUndefined(operation) {
  assert.equal(operation.status, "ok");
  assert.deepEqual(operation.value, { type: "undefined" });
}

function assertThrowsTypeError(operation, message) {
  assertThrowsErrorWithCode(operation, "TypeError", message, null);
}

function assertThrowsErrorWithCode(operation, name, message, code) {
  assert.equal(operation.status, "throws");
  assert.equal(operation.error.name, name);
  assert.equal(operation.error.message, message);
  assert.equal(operation.error.code, code);
  assert.equal(operation.error.constructorName, name);
}
