import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REF_OBJECT_FAST_REACT_TARGET,
  REF_OBJECT_ORACLE_ARTIFACT_PATH,
  REF_OBJECT_PROBE_MODES,
  REF_OBJECT_REACT_TARGET
} from "../src/ref-object-targets.mjs";
import {
  REF_OBJECT_SCENARIO_IDS,
  REF_OBJECT_SCENARIOS
} from "../src/ref-object-scenarios.mjs";
import {
  findRefObjectObservation,
  readCheckedRefObjectOracle,
  readCheckedRefObjectOracleText
} from "../src/ref-object-oracle.mjs";

const oracle = readCheckedRefObjectOracle();

test("checked ref-object oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REF_OBJECT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-ref-object-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-ref-object-oracle");
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

  assert.deepEqual(oracle.reactTarget, REF_OBJECT_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, REF_OBJECT_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("ref-object oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactBehaviorCompared: true,
    fastReactComparedToReact: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReact, true);
  assert.equal(oracle.evidenceClaims.fastReactBehaviorCompatible, false);
  assert.equal(oracle.packages["@fast-react/react"].behaviorCompatibilityClaimed, false);
  assert.deepEqual(oracle.implementationComparison, {
    beforeWorker024: {
      source:
        "packages/react/index.js and packages/react/react.react-server.js wired createRef to createUnimplementedFunction before this worker slice",
      generatedProbe: false,
      statusCounts: {
        "unsupported-placeholder": 16
      },
      compatibilityClaimed: false
    },
    afterWorker024: {
      source: "generated fastReactComparisons in this oracle artifact",
      generatedProbe: true,
      statusCounts: {
        "matched-but-compatibility-not-claimed": 16
      },
      compatibilityClaimed: false
    }
  });
});

test("ref-object oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REF_OBJECT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REF_OBJECT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "createRef export",
    "createRef object",
    "createRef invocation",
    "createRef mutability"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of REF_OBJECT_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      REF_OBJECT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      REF_OBJECT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      REF_OBJECT_SCENARIO_IDS.length
    );

    for (const scenarioId of REF_OBJECT_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React oracle captures createRef export and function descriptors", () => {
  const exportShape = operationValue(
    "default-node-development",
    "create-ref-export-shape"
  );

  assert.equal(exportShape.hasOwn, true);
  assert.equal(exportShape.exportKeysInclude, true);
  assert.deepEqual(
    dataDescriptorFields(exportShape.descriptor),
    {
      configurable: true,
      enumerable: true,
      writable: true
    }
  );
  assert.deepEqual(exportShape.descriptor.value, {
    type: "function",
    name: "",
    length: 0,
    isReactWarning: false
  });
  assert.deepEqual(keyValues(exportShape.functionObject.ownKeys), [
    "length",
    "name",
    "prototype"
  ]);
  assert.equal(
    descriptorFor(exportShape.functionObject.descriptors, "name").value.value,
    ""
  );
  assert.equal(
    descriptorFor(exportShape.functionObject.descriptors, "length").value.value,
    0
  );
});

test("React oracle captures development and production ref object shape", () => {
  const developmentRef = operationValue(
    "default-node-development",
    "create-ref-object-shape"
  ).noArgs.value;
  assertRefShape(developmentRef, {
    configurableCurrent: false,
    extensible: false,
    sealed: true
  });

  const productionRef = operationValue(
    "default-node-production",
    "create-ref-object-shape"
  ).noArgs.value;
  assertRefShape(productionRef, {
    configurableCurrent: true,
    extensible: true,
    sealed: false
  });

  const reactServerDevelopmentRef = operationValue(
    "react-server-development",
    "create-ref-object-shape"
  ).noArgs.value;
  assertRefShape(reactServerDevelopmentRef, {
    configurableCurrent: false,
    extensible: false,
    sealed: true
  });

  const reactServerProductionRef = operationValue(
    "react-server-production",
    "create-ref-object-shape"
  ).noArgs.value;
  assertRefShape(reactServerProductionRef, {
    configurableCurrent: true,
    extensible: true,
    sealed: false
  });
});

test("React oracle captures createRef identity, this handling, and constructor behavior", () => {
  const invocation = operationValue(
    "default-node-development",
    "create-ref-identity-and-invocation"
  );

  assert.equal(invocation.firstEqualsSecond, false);
  assert.equal(invocation.firstEqualsThirdCall, false);
  for (const key of [
    "callWithNullThis",
    "callWithThis",
    "applyWithUndefinedThis",
    "applyWithThis",
    "boundCall"
  ]) {
    assert.equal(invocation[key].status, "ok", key);
    assertRefShape(invocation[key].value, {
      configurableCurrent: false,
      extensible: false,
      sealed: true
    });
  }

  assert.deepEqual(invocation.thisArgAfterCalls.objectKeys, ["untouched"]);
  assert.equal(invocation.constructorCall.status, "ok");
  assert.equal(invocation.constructorCall.value.instanceOfCreateRef, false);
  assert.equal(invocation.constructorCall.value.instanceOfBoundCreateRef, false);
  assert.equal(invocation.boundConstructorCall.status, "ok");
  assert.equal(
    invocation.boundConstructorCall.value.instanceOfBoundCreateRef,
    false
  );
});

test("React oracle captures createRef mutability differences", () => {
  const development = operationValue(
    "default-node-development",
    "create-ref-mutability"
  );
  assert.equal(development.assignCurrent.status, "ok");
  assert.deepEqual(development.assignCurrent.value.current, {
    type: "string",
    value: "assigned-current"
  });
  assert.equal(development.reflectSetExtra.value.setResult, false);
  assert.equal(development.defineExtra.value.defineResult, false);
  assert.equal(development.objectDefineExtra.status, "throws");
  assert.equal(development.objectDefineExtra.error.name, "TypeError");
  assert.equal(development.directAssignExtra.status, "throws");
  assert.equal(development.directAssignExtra.error.name, "TypeError");
  assert.equal(development.deleteCurrent.value.currentDeleted, false);
  assert.equal(development.strictDeleteCurrent.status, "throws");
  assert.equal(development.strictDeleteCurrent.error.name, "TypeError");

  const production = operationValue(
    "default-node-production",
    "create-ref-mutability"
  );
  assert.equal(production.assignCurrent.status, "ok");
  assert.equal(production.reflectSetExtra.value.setResult, true);
  assert.equal(production.defineExtra.value.defineResult, true);
  assert.equal(production.objectDefineExtra.status, "ok");
  assert.equal(production.directAssignExtra.status, "ok");
  assert.equal(production.deleteExtra.value.extraDeleted, true);
  assert.equal(production.deleteExtra.value.definedExtraDeleted, true);
  assert.equal(production.deleteExtra.value.directExtraDeleted, true);
  assert.equal(production.deleteCurrent.value.currentDeleted, true);
  assert.equal(production.strictDeleteCurrent.value, true);
});

test("Fast React createRef observations match without compatibility claim", () => {
  const totalCounts = countFastReactComparisonStatuses(
    Object.values(oracle.fastReactComparisons).flat()
  );
  assert.deepEqual(totalCounts, {
    "known-mismatch": 0,
    "matched-but-compatibility-not-claimed": 16,
    "unsupported-placeholder": 0
  });

  for (const mode of REF_OBJECT_PROBE_MODES) {
    const modeCounts = countFastReactComparisonStatuses(
      oracle.fastReactComparisons[mode.id]
    );
    assert.deepEqual(
      modeCounts,
      {
        "known-mismatch": 0,
        "matched-but-compatibility-not-claimed": 4,
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

test("ref-object oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedRefObjectOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /fast-react-ref-oracle-[A-Za-z0-9]/u);
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-ref-object-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-ref-object-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedRefObjectOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedRefObjectOracleText());
});

function reactObservation(modeId, scenarioId) {
  return findRefObjectObservation(
    oracle,
    modeId,
    oracle.reactTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findRefObjectObservation(
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

function assertRefShape(refDescription, expectation) {
  assert.deepEqual(refDescription.object.objectKeys, ["current"]);
  assert.deepEqual(keyValues(refDescription.object.ownKeys), ["current"]);
  assert.equal(refDescription.object.state.frozen, false);
  assert.equal(refDescription.object.state.sealed, expectation.sealed);
  assert.equal(refDescription.object.state.extensible, expectation.extensible);
  assert.equal(refDescription.object.state.prototype, "Object.prototype");
  assert.deepEqual(refDescription.current, { type: "null" });
  assert.deepEqual(dataDescriptorFields(refDescription.currentDescriptor), {
    configurable: expectation.configurableCurrent,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(refDescription.currentDescriptor.value, { type: "null" });
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
