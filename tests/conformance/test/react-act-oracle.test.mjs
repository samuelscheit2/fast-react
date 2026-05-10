import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  REACT_ACT_FAST_REACT_TARGET,
  REACT_ACT_ORACLE_ARTIFACT_PATH,
  REACT_ACT_PROBE_MODES,
  REACT_ACT_REACT_TARGET
} from "../src/react-act-targets.mjs";
import {
  REACT_ACT_SCENARIO_IDS,
  REACT_ACT_SCENARIOS
} from "../src/react-act-scenarios.mjs";
import {
  findReactActObservation,
  readCheckedReactActOracle,
  readCheckedReactActOracleText
} from "../src/react-act-oracle.mjs";
import {
  REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS,
  REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS,
  REACT_ACT_PUBLIC_UNBLOCKING_REQUIREMENTS,
  evaluateReactActPublicBlockedGate
} from "../src/react-act-public-blocked-gate.mjs";

const oracle = readCheckedReactActOracle();
const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const privateActDispatcherGateExport =
  "__FAST_REACT_PRIVATE_ACT_DISPATCHER_GATE__";
const privateActDispatcherGateStatus =
  "blocked-until-renderer-roots-passive-effects-and-act-continuations";
const publicReactEntrypoints = [
  "packages/react/index.js",
  "packages/react/cjs/react.development.js",
  "packages/react/cjs/react.production.js"
];
const privateActDispatcherGateModule =
  "packages/react/private-act-dispatcher-gate.js";

test("checked React.act oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_ACT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-act-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-react-act-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact react npm tarball plus local Fast React package copied into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per target, scenario, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary extraction roots and local workspace paths are normalized before artifact write"
  });

  assert.deepEqual(oracle.reactTarget, REACT_ACT_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, REACT_ACT_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("React.act oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactBehaviorCompared: true,
    fastReactComparedToReact: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.reactPublicActBehaviorProbed, true);
  assert.equal(oracle.evidenceClaims.rendererBackedFlushingProbed, false);
  assert.equal(oracle.evidenceClaims.fastReactComparedToReact, true);
  assert.equal(oracle.evidenceClaims.fastReactBehaviorCompatible, false);
  assert.equal(
    oracle.packages["@fast-react/react"].behaviorCompatibilityClaimed,
    false
  );
  assert.deepEqual(oracle.implementationComparison, {
    worker097Checked: {
      source:
        "generated fastReactComparisons in this oracle artifact; default Fast React act is still a placeholder and react-server act is absent",
      generatedProbe: true,
      statusCounts: {
        "known-mismatch": 2,
        "unsupported-placeholder": 10,
        "matched-but-compatibility-not-claimed": 12
      },
      compatibilityClaimed: false
    }
  });
});

test("public React.act gate stays blocked until act queue flushing, effects, and renderer roots are ready", () => {
  const gate = evaluateReactActPublicBlockedGate({ oracle });

  assert.equal(gate.status, REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS);
  assert.equal(gate.requiredPrerequisitesReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);

  assert.equal(gate.localChecks.publicActUnsupportedPlaceholder, true);
  assert.equal(gate.localChecks.defaultAct.hasOwn, true);
  assert.equal(gate.localChecks.defaultAct.exportKeysInclude, true);
  assert.deepEqual(gate.localChecks.defaultAct.value, {
    type: "function",
    name: "act",
    length: 0
  });
  assert.equal(gate.localChecks.defaultAct.callAttempt.status, "throws");
  assert.equal(
    gate.localChecks.defaultAct.callAttempt.error.name,
    "FastReactUnimplementedError"
  );
  assert.equal(
    gate.localChecks.defaultAct.callAttempt.error.code,
    "FAST_REACT_UNIMPLEMENTED"
  );
  assert.equal(gate.localChecks.defaultAct.callAttempt.error.entrypoint, "react");
  assert.equal(gate.localChecks.defaultAct.callAttempt.error.exportName, "act");
  assert.equal(
    gate.localChecks.defaultAct.callAttempt.error.compatibilityTarget,
    "react@19.2.6"
  );
  assert.equal(gate.localChecks.defaultAct.callbackInvoked, false);
  assert.deepEqual(gate.localChecks.reactServerAct, {
    hasOwn: false,
    exportKeysInclude: false,
    value: {
      type: "undefined"
    }
  });

  assert.equal(
    gate.localChecks.actQueueStatus,
    "private-records-without-flushing"
  );
  assert.equal(gate.localChecks.actQueueFlushingReady, false);
  assert.equal(
    gate.localChecks.effectExecutionStatus,
    "metadata-only-no-callback-execution"
  );
  assert.equal(gate.localChecks.effectExecutionReady, false);
  assert.equal(
    gate.localChecks.rendererRootStatus,
    "public-renderer-roots-placeholder-blocked"
  );
  assert.equal(gate.localChecks.rendererRootsReady, false);
  assert.equal(gate.localChecks.reactDomClientRootPlaceholder, true);
  assert.equal(gate.localChecks.testRendererRootPlaceholder, true);
});

test("public React.act scenario admission stays explicit and closed", () => {
  assert.deepEqual(
    REACT_ACT_PUBLIC_UNBLOCKING_REQUIREMENTS.map(
      (requirement) => requirement.id
    ),
    [
      "reconciler-act-queue-flushing",
      "effect-execution",
      "renderer-roots"
    ]
  );
  assert.deepEqual(
    REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS.map((scenario) => scenario.scenarioId),
    REACT_ACT_SCENARIO_IDS
  );

  for (const scenario of REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS) {
    assert.equal(scenario.status, REACT_ACT_PUBLIC_BLOCKED_GATE_STATUS);
    assert.equal(scenario.admittedForFastReactComparison, false);
    assert.equal(scenario.compatibilityClaimed, false);
    assert.deepEqual(
      scenario.unblockRequires,
      REACT_ACT_PUBLIC_UNBLOCKING_REQUIREMENTS.map(
        (requirement) => requirement.id
      )
    );
  }

  const gate = evaluateReactActPublicBlockedGate({ oracle });
  assert.deepEqual(gate.admittedScenarios, []);
  assert.equal(gate.defaultActBehaviorRows.length, 10);
  assert.equal(gate.unsupportedDefaultBehaviorRows.length, 10);
});

test("public React.act gate rejects premature compatibility claims and scenario admissions", () => {
  const prematureClaimOracle = JSON.parse(JSON.stringify(oracle));
  prematureClaimOracle.conformanceClaims.compatibilityClaimed = true;

  const claimGate = evaluateReactActPublicBlockedGate({
    oracle: prematureClaimOracle
  });
  assert.equal(claimGate.status, "blocked-with-violations");
  assert.deepEqual(
    claimGate.violations.map((violation) => violation.id),
    ["compatibility-claimed-before-act-prerequisites"]
  );

  const admittedScenarios = REACT_ACT_PUBLIC_SCENARIO_ADMISSIONS.map(
    (scenario, index) =>
      index === 0
        ? {
            ...scenario,
            admittedForFastReactComparison: true
          }
        : scenario
  );
  const admissionGate = evaluateReactActPublicBlockedGate({
    oracle,
    scenarioAdmissions: admittedScenarios
  });
  assert.equal(admissionGate.status, "blocked-with-violations");
  assert.deepEqual(
    admissionGate.violations.map((violation) => violation.id),
    ["scenario-admitted-before-act-prerequisites"]
  );
  assert.deepEqual(admissionGate.violations[0].scenarioIds, [
    "react-act-export-shape"
  ]);
});

test("package-private React act dispatcher gate recognizes accepted metadata without flushing", () => {
  for (const relativeModulePath of publicReactEntrypoints) {
    const React = loadFreshWorkspaceModule(relativeModulePath);
    const descriptor = Object.getOwnPropertyDescriptor(
      React,
      privateActDispatcherGateExport
    );

    assert.equal(
      Object.keys(React).includes(privateActDispatcherGateExport),
      false,
      relativeModulePath
    );
    assert.equal(descriptor, undefined, relativeModulePath);

    let publicActCallbackInvoked = false;
    const publicActError = captureThrown(() =>
      React.act(() => {
        publicActCallbackInvoked = true;
      })
    );
    assertReactActPlaceholderError(publicActError);
    assert.equal(publicActCallbackInvoked, false, relativeModulePath);

    assertReactHookDispatcherGuardUnchanged(React, relativeModulePath);
  }

  const gate = loadFreshWorkspaceModule(privateActDispatcherGateModule);
  assert.equal(gate.status, privateActDispatcherGateStatus);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.equal(gate.queueFlushingReady, false);
  assert.equal(gate.rendererRootsReady, false);
  assert.equal(gate.passiveEffectsReady, false);
  assert.equal(gate.continuationFlushingReady, false);
  assert.equal(gate.executesQueuedWork, false);
  assert.equal(gate.executesEffects, false);
  assert.deepEqual(gate.requiredRecords, [
    "SchedulerActQueueRequest",
    "SchedulerActScopeBoundaryRecord",
    "SyncFlushActContinuationRecord"
  ]);
  assert.deepEqual(gate.requiredTaskKinds, [
    "RootSchedule",
    "SchedulerCallback"
  ]);
  assert.deepEqual(gate.requiredContinuationStatuses, [
    "NoContinuation",
    "PendingContinuation"
  ]);

  let queuedTaskInvoked = false;
  const metadata = gate.createActQueueMetadata({
    queuedTasks: [
      function queuedActTaskMustNotRun() {
        queuedTaskInvoked = true;
      }
    ]
  });
  const dispatcher = {
    [gate.metadataSymbol]: metadata
  };

  assert.equal(gate.isAcceptedActQueueMetadata(metadata), true);
  assert.equal(gate.isPrivateActDispatcher(dispatcher), false);
  assert.equal(gate.getPrivateActQueueMetadata(dispatcher), null);
  assert.equal(gate.markPrivateActDispatcher(dispatcher), dispatcher);
  assert.equal(gate.isPrivateActDispatcher(dispatcher), true);
  assert.equal(gate.getPrivateActQueueMetadata(dispatcher), metadata);
  assert.equal(queuedTaskInvoked, false);

  for (const rejectedMetadata of [
    gate.createActQueueMetadata({
      publicCompatibilityClaimed: true
    }),
    gate.createActQueueMetadata({
      queueFlushingReady: true
    }),
    gate.createActQueueMetadata({
      passiveEffectsReady: true
    }),
    gate.createActQueueMetadata({
      continuationFlushingReady: true
    }),
    gate.createActQueueMetadata({
      acceptedRecords: ["SchedulerActQueueRequest"]
    })
  ]) {
    const rejectedDispatcher = {
      [gate.metadataSymbol]: rejectedMetadata
    };
    assert.equal(gate.isAcceptedActQueueMetadata(rejectedMetadata), false);
    assert.throws(
      () => gate.markPrivateActDispatcher(rejectedDispatcher),
      (error) => {
        assert.equal(error.name, "FastReactUnimplementedError");
        assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
        assert.equal(error.entrypoint, "react");
        assert.equal(
          error.exportName,
          `${privateActDispatcherGateExport}.markPrivateActDispatcher`
        );
        assert.equal(error.compatibilityTarget, "react@19.2.6");
        return true;
      }
    );
    assert.equal(gate.isPrivateActDispatcher(rejectedDispatcher), false);
  }
});

test("React.act oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_ACT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_ACT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "React.act export",
    "Synchronous callback behavior",
    "Asynchronous callback behavior",
    "Unawaited async act warning",
    "Thrown and rejected errors",
    "Thenable handling"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of REACT_ACT_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      REACT_ACT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      REACT_ACT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      REACT_ACT_SCENARIO_IDS.length
    );

    for (const scenarioId of REACT_ACT_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React oracle captures public act availability by condition and mode", () => {
  const developmentExport = operationValue(
    "default-node-development",
    "react-act-export-shape"
  );
  assert.equal(developmentExport.availability.status, "available");
  assert.equal(developmentExport.availability.hasOwn, true);
  assert.equal(developmentExport.availability.exportKeysInclude, true);
  assert.deepEqual(dataDescriptorFields(developmentExport.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(developmentExport.descriptor.value, {
    type: "function",
    name: "",
    length: 1,
    isReactWarning: false
  });
  assert.deepEqual(keyValues(developmentExport.functionObject.ownKeys), [
    "length",
    "name",
    "prototype"
  ]);

  for (const modeId of [
    "default-node-production",
    "react-server-development",
    "react-server-production"
  ]) {
    const exportShape = operationValue(modeId, "react-act-export-shape");
    assert.equal(exportShape.availability.status, "unavailable", modeId);
    assert.equal(exportShape.availability.hasOwn, false, modeId);
    assert.equal(exportShape.availability.exportKeysInclude, false, modeId);
    assert.equal(exportShape.descriptor, null, modeId);

    const syncCall = operationValue(modeId, "react-act-sync-callback-behavior");
    assert.equal(syncCall.callAttempt.status, "throws", modeId);
    assert.equal(syncCall.callAttempt.error.name, "TypeError", modeId);
    assert.equal(
      syncCall.callAttempt.error.message,
      "React.act is not a function",
      modeId
    );
  }
});

test("React oracle captures rootless sync and async act callback behavior", () => {
  const sync = operationValue(
    "default-node-development",
    "react-act-sync-callback-behavior"
  );
  assert.deepEqual(
    sync.events.map((event) => event.phase),
    ["callback", "after-act-call", "after-await"]
  );
  assert.deepEqual(sync.events[0].thisValue, { type: "undefined" });
  assert.equal(sync.events[0].argCount, 0);
  assert.deepEqual(sync.awaitedValue, {
    type: "string",
    value: "sync-return"
  });
  assertActReturnThenableShape(sync.returnShape);
  assertActReturnThenableShape(sync.unawaitedSyncReturnShape);
  assert.deepEqual(sync.unawaitedSyncConsoleCalls, []);

  const asyncAct = operationValue(
    "default-node-development",
    "react-act-async-callback-behavior"
  );
  assert.deepEqual(
    asyncAct.events.map((event) => event.phase),
    [
      "callback-start",
      "after-act-call",
      "callback-after-microtask",
      "after-await"
    ]
  );
  assert.deepEqual(asyncAct.awaitedValue, {
    type: "string",
    value: "async-return"
  });
  assertActReturnThenableShape(asyncAct.returnShape);
  assert.deepEqual(asyncAct.consoleCallsDuringScenario, []);
});

test("React oracle captures unawaited async act warning and error propagation", () => {
  const unawaited = operationValue(
    "default-node-development",
    "react-act-unawaited-async-warning"
  );
  assertActReturnThenableShape(unawaited.firstReturnShape);
  assertActReturnThenableShape(unawaited.secondReturnShape);
  assert.equal(unawaited.consoleCallsAfterFirst.length, 1);
  assert.equal(unawaited.consoleCallsAfterSecond.length, 1);
  assert.match(
    unawaited.consoleCallsAfterFirst[0].args[0].value,
    /without await/u
  );

  const errors = operationValue(
    "default-node-development",
    "react-act-error-propagation"
  );
  assert.equal(errors.syncThrow.status, "throws");
  assert.equal(errors.syncThrow.error.name, "Error");
  assert.equal(errors.syncThrow.error.message, "sync act failure");
  assert.equal(errors.afterSyncThrow.status, "ok");
  assert.deepEqual(errors.afterSyncThrow.value, {
    type: "string",
    value: "after-sync-throw"
  });
  assert.equal(errors.asyncReject.status, "throws");
  assert.equal(errors.asyncReject.error.name, "TypeError");
  assert.equal(errors.asyncReject.error.message, "async act rejection");
  assert.equal(errors.customThenableReject.status, "throws");
  assert.equal(errors.customThenableReject.error.name, "RangeError");
  assert.equal(
    errors.customThenableReject.error.message,
    "custom act thenable rejection"
  );
});

test("React oracle captures deterministic thenable handling", () => {
  const thenables = operationValue(
    "default-node-development",
    "react-act-thenable-handling"
  );

  assertActReturnThenableShape(thenables.customThenable.actReturnShape);
  assert.deepEqual(thenables.customThenable.thenCalls, [
    {
      thisMatchesThenable: true,
      resolveType: "function",
      rejectType: "function"
    }
  ]);
  assert.deepEqual(thenables.customThenable.resolution.settlement, {
    status: "fulfilled",
    value: {
      type: "string",
      value: "custom-thenable-resolution"
    }
  });

  assertActReturnThenableShape(thenables.nonCallableThenObject.actReturnShape);
  assert.equal(
    thenables.nonCallableThenObject.resolution.settlement.status,
    "fulfilled"
  );
  assert.equal(
    thenables.nonCallableThenObject.resolution.settlement.value.sameObject,
    true
  );
  assert.deepEqual(
    thenables.nonCallableThenObject.resolution.settlement.value.value.properties,
    {
      label: {
        type: "string",
        value: "non-callable-then"
      },
      then: {
        type: "string",
        value: "not-a-function"
      }
    }
  );

  assertActReturnThenableShape(thenables.functionWithThenProperty.actReturnShape);
  assert.equal(
    thenables.functionWithThenProperty.resolution.settlement.status,
    "fulfilled"
  );
  assert.deepEqual(thenables.functionWithThenProperty.resolution.settlement.value, {
    value: {
      type: "function",
      name: "functionWithThenProperty",
      length: 0,
      isReactWarning: false
    },
    sameFunction: true
  });
});

test("Fast React public act observations are unsupported or known mismatch evidence only", () => {
  const totalCounts = countFastReactComparisonStatuses(
    Object.values(oracle.fastReactComparisons).flat()
  );
  assert.deepEqual(totalCounts, {
    "known-mismatch": 2,
    "matched-but-compatibility-not-claimed": 12,
    "unsupported-placeholder": 10
  });

  assert.deepEqual(
    countFastReactComparisonStatuses(
      oracle.fastReactComparisons["default-node-development"]
    ),
    {
      "known-mismatch": 1,
      "matched-but-compatibility-not-claimed": 0,
      "unsupported-placeholder": 5
    }
  );
  assert.deepEqual(
    countFastReactComparisonStatuses(
      oracle.fastReactComparisons["default-node-production"]
    ),
    {
      "known-mismatch": 1,
      "matched-but-compatibility-not-claimed": 0,
      "unsupported-placeholder": 5
    }
  );

  for (const modeId of ["react-server-development", "react-server-production"]) {
    assert.deepEqual(
      countFastReactComparisonStatuses(oracle.fastReactComparisons[modeId]),
      {
        "known-mismatch": 0,
        "matched-but-compatibility-not-claimed": 6,
        "unsupported-placeholder": 0
      },
      modeId
    );
  }

  for (const comparison of Object.values(oracle.fastReactComparisons).flat()) {
    assert.equal(comparison.compatibilityClaimed, false);
  }
});

test("React.act oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactActOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-act-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-react-act-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-act-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedReactActOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedReactActOracleText());
});

function reactObservation(modeId, scenarioId) {
  return findReactActObservation(
    oracle,
    modeId,
    oracle.reactTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findReactActObservation(
    oracle,
    modeId,
    oracle.fastReactTarget.packageName,
    scenarioId
  );
}

function operationValue(modeId, scenarioId) {
  const operation = reactObservation(modeId, scenarioId).result.result;
  assert.equal(operation.status, "ok", `${modeId}:${scenarioId} should be ok`);
  return operation.value;
}

function assertActReturnThenableShape(thenableShape) {
  assert.equal(thenableShape.summary.type, "object");
  assert.deepEqual(thenableShape.object.objectKeys, ["then"]);
  assert.deepEqual(keyValues(thenableShape.object.ownKeys), ["then"]);
  assert.deepEqual(dataDescriptorFields(thenableShape.thenDescriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(thenableShape.thenDescriptor.value, {
    type: "function",
    name: "then",
    length: 2,
    isReactWarning: false
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

function keyValues(keys) {
  return keys.map((key) =>
    key.type === "symbol" ? key.stringValue : key.value
  );
}

function countFastReactComparisonStatuses(comparisons) {
  return comparisons.reduce(
    (counts, comparison) => {
      counts[comparison.status] += 1;
      return counts;
    },
    {
      "known-mismatch": 0,
      "matched-but-compatibility-not-claimed": 0,
      "unsupported-placeholder": 0
    }
  );
}

function loadFreshWorkspaceModule(relativeModulePath) {
  const modulePath = path.join(repoRoot, relativeModulePath);
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(resolved);
}

function captureThrown(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  assert.fail("Expected operation to throw");
}

function assertReactActPlaceholderError(error) {
  assert.equal(error.name, "FastReactUnimplementedError");
  assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
  assert.equal(error.entrypoint, "react");
  assert.equal(error.exportName, "act");
  assert.equal(error.compatibilityTarget, "react@19.2.6");
}

function assertReactHookDispatcherGuardUnchanged(React, label) {
  const useRefError = captureThrown(() => React.useRef(null));
  assert.equal(useRefError.name, "Error", `${label}.useRef error name`);
  assert.equal(
    useRefError.code,
    "FAST_REACT_INVALID_HOOK_CALL",
    `${label}.useRef code`
  );

  const useStateError = captureThrown(() => React.useState(null));
  assert.equal(
    useStateError.name,
    "Error",
    `${label}.useState error name`
  );
  assert.equal(
    useStateError.code,
    "FAST_REACT_INVALID_HOOK_CALL",
    `${label}.useState code`
  );
}
