import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  WRAPPER_OBJECT_FAST_REACT_TARGET,
  WRAPPER_OBJECT_ORACLE_ARTIFACT_PATH,
  WRAPPER_OBJECT_PROBE_MODES,
  WRAPPER_OBJECT_REACT_TARGET
} from "../src/wrapper-object-targets.mjs";
import {
  WRAPPER_OBJECT_SCENARIO_IDS,
  WRAPPER_OBJECT_SCENARIOS
} from "../src/wrapper-object-scenarios.mjs";
import {
  findWrapperObjectObservation,
  readCheckedWrapperObjectOracle,
  readCheckedWrapperObjectOracleText
} from "../src/wrapper-object-oracle.mjs";

const oracle = readCheckedWrapperObjectOracle();

test("checked wrapper-object oracle artifact has the expected schema and targets", () => {
  assert.equal(
    WRAPPER_OBJECT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-wrapper-object-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-wrapper-object-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact react npm tarball plus local Fast React package copied into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per target, scenario, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactTarget, WRAPPER_OBJECT_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, WRAPPER_OBJECT_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("wrapper-object oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactBehaviorCompared: true,
    fastReactComparedToReact: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReact, true);
  assert.equal(oracle.evidenceClaims.fastReactBehaviorCompatible, false);
  assert.equal(
    oracle.packages["@fast-react/react"].behaviorCompatibilityClaimed,
    false
  );
  assert.deepEqual(oracle.implementationComparison, {
    beforeWorker026: {
      source:
        "packages/react/index.js and packages/react/react.react-server.js wired memo/lazy to createUnimplementedFunction before this worker slice",
      generatedProbe: false,
      statusCounts: {
        "known-mismatch": 4,
        "unsupported-placeholder": 16
      },
      compatibilityClaimed: false
    },
    afterWorker026: {
      source: "generated fastReactComparisons in this oracle artifact",
      generatedProbe: true,
      statusCounts: {
        "matched-but-compatibility-not-claimed": 20
      },
      compatibilityClaimed: false
    }
  });
});

test("wrapper-object oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, WRAPPER_OBJECT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, WRAPPER_OBJECT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "memo/lazy exports",
    "memo wrapper object",
    "memo invocation details",
    "lazy wrapper object",
    "lazy direct _init behavior"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of WRAPPER_OBJECT_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      WRAPPER_OBJECT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      WRAPPER_OBJECT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      WRAPPER_OBJECT_SCENARIO_IDS.length
    );

    for (const scenarioId of WRAPPER_OBJECT_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React oracle captures memo and lazy export descriptors", () => {
  const exportShape = operationValue(
    "default-node-development",
    "wrapper-export-shape"
  );

  assert.deepEqual(dataDescriptorFields(exportShape.memo.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(exportShape.memo.descriptor.value, {
    type: "function",
    name: "",
    length: 2,
    isReactWarning: false
  });
  assert.deepEqual(exportShape.lazy.descriptor.value, {
    type: "function",
    name: "",
    length: 1,
    isReactWarning: false
  });
  assert.deepEqual(keyValues(exportShape.memo.functionObject.ownKeys), [
    "length",
    "name",
    "prototype"
  ]);
  assert.deepEqual(keyValues(exportShape.lazy.functionObject.ownKeys), [
    "length",
    "name",
    "prototype"
  ]);
});

test("React oracle captures memo wrapper object shape and warnings", () => {
  const development = operationValue(
    "default-node-development",
    "memo-wrapper-object"
  );
  assertMemoShape(development.functionType.value, {
    ownKeys: ["$$typeof", "type", "compare", "displayName"],
    tag: "react.memo"
  });
  assert.equal(development.functionType.value.compare.type, "null");
  assert.equal(development.functionType.value.type.name, "FunctionType");
  assert.deepEqual(development.nullType.consoleCalls[0].args, [
    {
      type: "string",
      value: "memo: The first argument must be a component. Instead received: %s"
    },
    {
      type: "string",
      value: "null"
    }
  ]);
  assert.equal(development.undefinedType.consoleCalls.length, 1);
  assert.equal(development.numberType.consoleCalls.length, 0);
  assert.equal(descriptorFor(
    development.functionType.value.object.descriptors,
    "displayName"
  ).kind, "accessor");

  const production = operationValue(
    "default-node-production",
    "memo-wrapper-object"
  );
  assertMemoShape(production.functionType.value, {
    ownKeys: ["$$typeof", "type", "compare"],
    tag: "react.memo"
  });
  assert.equal(production.nullType.consoleCalls.length, 0);
});

test("React oracle captures memo compare, this handling, and displayName behavior", () => {
  const development = operationValue(
    "default-node-development",
    "memo-arguments-and-display-name"
  );
  assert.equal(development.omittedCompare.value.compare.type, "null");
  assert.equal(development.undefinedCompare.value.compare.type, "null");
  assert.equal(development.nullCompare.value.compare.type, "null");
  assert.equal(development.functionCompare.value.compare.name, "compareFn");
  assert.deepEqual(development.thisArgAfterCalls.objectKeys, ["untouched"]);
  assert.equal(development.constructorCall.value.instanceOfMemo, false);
  assert.equal(
    development.displayNameAssignment.assignment.value.type.summary.name,
    "Shown"
  );
  assert.deepEqual(
    development.displayNameAssignment.assignment.value.typeDisplayName,
    {
      type: "string",
      value: "Shown"
    }
  );

  const production = operationValue(
    "default-node-production",
    "memo-arguments-and-display-name"
  );
  assert.equal(
    production.displayNameAssignment.assignment.value.type.summary.name,
    ""
  );
  assert.deepEqual(
    production.displayNameAssignment.assignment.value.wrapper.object.objectKeys,
    ["$$typeof", "type", "compare", "displayName"]
  );
});

test("React oracle captures lazy wrapper and payload shape", () => {
  const development = operationValue(
    "default-node-development",
    "lazy-wrapper-object"
  );
  assertLazyShape(development.functionLoader.value, {
    ownKeys: ["$$typeof", "_payload", "_init", "_debugInfo"],
    payloadKeys: ["_status", "_result", "_ioInfo"],
    debug: true
  });
  assert.equal(development.loaderCallsAfterCreation.length, 0);
  assert.equal(development.nullLoader.consoleCalls.length, 0);
  assert.deepEqual(development.thisArgAfterCalls.objectKeys, ["untouched"]);
  assert.equal(development.constructorCall.value.instanceOfLazy, false);
  assert.equal(development.boundConstructorCall.value.instanceOfBoundLazy, false);

  const production = operationValue(
    "default-node-production",
    "lazy-wrapper-object"
  );
  assertLazyShape(production.functionLoader.value, {
    ownKeys: ["$$typeof", "_payload", "_init"],
    payloadKeys: ["_status", "_result"],
    debug: false
  });
  assert.equal(production.numberLoader.consoleCalls.length, 0);
});

test("React oracle captures direct lazy _init state transitions", () => {
  const development = operationValue(
    "default-node-development",
    "lazy-init-behavior"
  );
  assert.equal(development.fulfilled.init.status, "ok");
  assert.equal(development.fulfilled.init.value.name, "Component");
  assert.deepEqual(development.fulfilled.loaderThisValues, [
    {
      type: "undefined"
    }
  ]);
  assert.equal(development.fulfilled.after.payloadStatus.value, 1);
  assert.deepEqual(development.fulfilled.after.ioInfo.value.status, {
    type: "string",
    value: "fulfilled"
  });

  assert.equal(development.rejected.init.status, "throws");
  assert.equal(development.rejected.after.payloadStatus.value, 2);
  assert.equal(development.pending.init.status, "throws");
  assert.equal(development.pending.after.payloadStatus.value, 0);
  assert.equal(development.throwingLoader.after.payloadStatus.value, -1);
  assert.equal(development.nonThenable.init.error.message, "thenable.then is not a function");
  assert.equal(development.missingDefault.init.status, "ok");
  assert.equal(development.missingDefault.init.consoleCalls.length, 1);
  assert.equal(development.undefinedModule.init.status, "throws");
  assert.match(
    development.undefinedModule.init.error.message,
    /Cannot use 'in' operator/
  );
  assert.deepEqual(development.thenableDisplayName.after.ioInfo.name, {
    type: "string",
    value: "ThenableDisplay"
  });

  const production = operationValue(
    "default-node-production",
    "lazy-init-behavior"
  );
  assert.equal(production.fulfilled.after.payloadStatus.value, 1);
  assert.equal(production.fulfilled.after.ioInfo.type, "undefined");
  assert.equal(production.missingDefault.init.consoleCalls.length, 0);
  assert.match(
    production.undefinedModule.init.error.message,
    /reading 'default'/
  );
});

test("Fast React memo/lazy observations match without compatibility claim", () => {
  const totalCounts = countFastReactComparisonStatuses(
    Object.values(oracle.fastReactComparisons).flat()
  );
  assert.deepEqual(totalCounts, {
    "known-mismatch": 0,
    "matched-but-compatibility-not-claimed": 20,
    "unsupported-placeholder": 0
  });

  for (const mode of WRAPPER_OBJECT_PROBE_MODES) {
    const modeCounts = countFastReactComparisonStatuses(
      oracle.fastReactComparisons[mode.id]
    );
    assert.deepEqual(
      modeCounts,
      {
        "known-mismatch": 0,
        "matched-but-compatibility-not-claimed": 5,
        "unsupported-placeholder": 0
      },
      mode.id
    );

    for (const comparison of oracle.fastReactComparisons[mode.id]) {
      assert.equal(comparison.compatibilityClaimed, false);
      assert.equal(
        comparison.status,
        "matched-but-compatibility-not-claimed",
        `${mode.id}:${comparison.scenarioId}`
      );
      assert.equal(comparison.firstDifferencePath, null);
    }
  }
});

test("wrapper-object oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedWrapperObjectOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /fast-react-wrapper-oracle-[A-Za-z0-9]/u);
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-wrapper-object-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-wrapper-object-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedWrapperObjectOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedWrapperObjectOracleText());
});

function reactObservation(modeId, scenarioId) {
  return findWrapperObjectObservation(
    oracle,
    modeId,
    oracle.reactTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findWrapperObjectObservation(
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

function assertMemoShape(memoDescription, expectation) {
  assert.deepEqual(memoDescription.object.objectKeys, [
    "$$typeof",
    "type",
    "compare"
  ]);
  assert.deepEqual(keyValues(memoDescription.object.ownKeys), expectation.ownKeys);
  assert.equal(memoDescription.object.state.frozen, false);
  assert.equal(memoDescription.object.state.sealed, false);
  assert.equal(memoDescription.object.state.extensible, true);
  assert.equal(memoDescription.object.state.prototype, "Object.prototype");
  assert.equal(memoDescription.tag.keyFor, expectation.tag);
  for (const key of ["$$typeof", "type", "compare"]) {
    assert.deepEqual(
      dataDescriptorFields(descriptorFor(memoDescription.object.descriptors, key)),
      {
        configurable: true,
        enumerable: true,
        writable: true
      }
    );
  }
}

function assertLazyShape(lazyDescription, expectation) {
  assert.deepEqual(lazyDescription.object.objectKeys, expectation.ownKeys);
  assert.deepEqual(keyValues(lazyDescription.object.ownKeys), expectation.ownKeys);
  assert.deepEqual(lazyDescription.payload.objectKeys, expectation.payloadKeys);
  assert.equal(lazyDescription.object.state.prototype, "Object.prototype");
  assert.equal(lazyDescription.payload.state.prototype, "Object.prototype");
  assert.equal(lazyDescription.object.state.extensible, true);
  assert.equal(lazyDescription.payloadStatus.value, -1);
  assert.equal(lazyDescription.payloadResult.name, "validLoader");
  assert.equal(lazyDescription.init.summary.name, "lazyInitializer");
  assert.equal(lazyDescription.init.summary.length, 1);
  if (expectation.debug) {
    assert.equal(lazyDescription.debugInfo.summary.arrayLength, 1);
    assert.equal(lazyDescription.debugAwaitedSame, true);
    assert.deepEqual(lazyDescription.ioInfo.name, {
      type: "string",
      value: "lazy"
    });
  } else {
    assert.equal(lazyDescription.debugInfo.type, "undefined");
    assert.equal(lazyDescription.ioInfo.type, "undefined");
  }
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

function descriptorFor(descriptors, key) {
  const descriptor = descriptors.find(
    (candidate) =>
      candidate.key.type === "string" && candidate.key.value === key
  );
  assert.ok(descriptor, `missing descriptor ${key}`);
  return descriptor;
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
