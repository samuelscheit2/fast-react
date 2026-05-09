import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  FORWARD_REF_FAST_REACT_TARGET,
  FORWARD_REF_ORACLE_ARTIFACT_PATH,
  FORWARD_REF_PROBE_MODES,
  FORWARD_REF_REACT_TARGET
} from "../src/forward-ref-targets.mjs";
import {
  FORWARD_REF_SCENARIO_IDS,
  FORWARD_REF_SCENARIOS
} from "../src/forward-ref-scenarios.mjs";
import {
  findForwardRefObservation,
  readCheckedForwardRefOracle,
  readCheckedForwardRefOracleText
} from "../src/forward-ref-oracle.mjs";

const oracle = readCheckedForwardRefOracle();

test("checked forward-ref oracle artifact has the expected schema and targets", () => {
  assert.equal(
    FORWARD_REF_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-forward-ref-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-forward-ref-oracle");
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

  assert.deepEqual(oracle.reactTarget, FORWARD_REF_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, FORWARD_REF_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("forward-ref oracle keeps Fast React compatibility claims false", () => {
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
    beforeWorker027: {
      source:
        "packages/react/index.js and packages/react/react.react-server.js wired forwardRef to createUnimplementedFunction before this worker slice",
      generatedProbe: false,
      statusCounts: {
        "known-mismatch": 4,
        "unsupported-placeholder": 12
      },
      compatibilityClaimed: false
    },
    afterWorker027: {
      source: "generated fastReactComparisons in this oracle artifact",
      generatedProbe: true,
      statusCounts: {
        "matched-but-compatibility-not-claimed": 16
      },
      compatibilityClaimed: false
    }
  });
});

test("forward-ref oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, FORWARD_REF_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, FORWARD_REF_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "forwardRef export",
    "forwardRef wrapper object",
    "forwardRef invocation",
    "forwardRef displayName"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of FORWARD_REF_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      FORWARD_REF_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      FORWARD_REF_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      FORWARD_REF_SCENARIO_IDS.length
    );

    for (const scenarioId of FORWARD_REF_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React oracle captures forwardRef export descriptors", () => {
  const exportShape = operationValue(
    "default-node-development",
    "forward-ref-export-shape"
  );

  assert.equal(exportShape.hasOwn, true);
  assert.equal(exportShape.exportKeysInclude, true);
  assert.deepEqual(dataDescriptorFields(exportShape.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(exportShape.descriptor.value, {
    type: "function",
    name: "",
    length: 1,
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
    1
  );
});

test("React oracle captures forwardRef wrapper shapes and development warnings", () => {
  const development = operationValue(
    "default-node-development",
    "forward-ref-wrapper-object"
  );
  assertForwardRefShape(development.arityTwo.value, {
    ownKeys: ["$$typeof", "render", "displayName"],
    tag: "react.forward_ref"
  });
  assert.equal(development.arityTwo.value.renderIdentity, true);
  assert.equal(development.arityZero.consoleCalls.length, 0);
  assert.deepEqual(development.arityOne.consoleCalls[0].args, [
    {
      type: "string",
      value:
        "forwardRef render functions accept exactly two parameters: props and ref. %s"
    },
    {
      type: "string",
      value: "Did you forget to use the ref parameter?"
    }
  ]);
  assert.deepEqual(development.arityThree.consoleCalls[0].args, [
    {
      type: "string",
      value:
        "forwardRef render functions accept exactly two parameters: props and ref. %s"
    },
    {
      type: "string",
      value: "Any additional parameter will be undefined."
    }
  ]);
  assert.deepEqual(development.defaultProps.consoleCalls[0].args, [
    {
      type: "string",
      value:
        "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
    }
  ]);
  assert.deepEqual(development.nullRender.consoleCalls[0].args, [
    {
      type: "string",
      value: "forwardRef requires a render function but was given %s."
    },
    {
      type: "string",
      value: "null"
    }
  ]);
  assert.deepEqual(development.memoRender.consoleCalls[0].args, [
    {
      type: "string",
      value:
        "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
    }
  ]);
  assert.equal(development.lazyRender.consoleCalls[0].args[1].value, "object");
  assert.equal(development.nullRender.value.render.type, "null");
  assert.equal(development.stringRender.value.render.value, "div");
  assert.equal(
    descriptorFor(development.arityTwo.value.object.descriptors, "displayName")
      .kind,
    "accessor"
  );

  const production = operationValue(
    "default-node-production",
    "forward-ref-wrapper-object"
  );
  assertForwardRefShape(production.arityTwo.value, {
    ownKeys: ["$$typeof", "render"],
    tag: "react.forward_ref"
  });
  assert.equal(production.arityOne.consoleCalls.length, 0);
  assert.equal(production.memoRender.consoleCalls.length, 0);
  assert.equal(production.nullRender.status, "ok");
});

test("React oracle captures forwardRef this, extra-argument, and constructor behavior", () => {
  const invocation = operationValue(
    "default-node-development",
    "forward-ref-invocation"
  );

  for (const key of [
    "normalCall",
    "extraArguments",
    "callWithThis",
    "applyWithThis",
    "boundCall"
  ]) {
    assert.equal(invocation[key].status, "ok", key);
    assertForwardRefShape(invocation[key].value, {
      ownKeys: ["$$typeof", "render", "displayName"],
      tag: "react.forward_ref"
    });
    assert.equal(invocation[key].value.renderIdentity, true, key);
  }

  assert.deepEqual(invocation.thisArgAfterCalls.objectKeys, ["untouched"]);
  assert.equal(invocation.constructorCall.status, "ok");
  assert.equal(invocation.constructorCall.value.instanceOfForwardRef, false);
  assert.equal(
    invocation.constructorCall.value.instanceOfBoundForwardRef,
    false
  );
  assert.equal(invocation.boundConstructorCall.status, "ok");
  assert.equal(
    invocation.boundConstructorCall.value.instanceOfBoundForwardRef,
    false
  );
});

test("React oracle captures forwardRef displayName behavior", () => {
  const development = operationValue(
    "default-node-development",
    "forward-ref-display-name"
  );

  assert.equal(
    development.anonymousRender.assignment.value.wrapper.displayName.value,
    "Shown"
  );
  assert.equal(
    development.anonymousRender.assignment.value.render.summary.name,
    "Shown"
  );
  assert.deepEqual(
    development.anonymousRender.assignment.value.renderDisplayName,
    {
      type: "string",
      value: "Shown"
    }
  );
  assert.equal(
    development.namedRender.assignment.value.render.summary.name,
    "NamedRender"
  );
  assert.deepEqual(
    development.namedRender.assignment.value.renderDisplayName,
    {
      type: "undefined"
    }
  );
  assert.deepEqual(
    development.presetDisplayNameRender.assignment.value.renderDisplayName,
    {
      type: "string",
      value: "Preset"
    }
  );
  assert.equal(development.nullRender.assignment.status, "throws");
  assert.equal(development.nullRender.after.displayName.value, "Shown");
  assert.equal(development.stringRender.assignment.status, "throws");

  const production = operationValue(
    "default-node-production",
    "forward-ref-display-name"
  );
  assert.deepEqual(
    production.anonymousRender.assignment.value.wrapper.object.objectKeys,
    ["$$typeof", "render", "displayName"]
  );
  assert.equal(
    production.anonymousRender.assignment.value.render.summary.name,
    ""
  );
  assert.deepEqual(
    production.anonymousRender.assignment.value.renderDisplayName,
    {
      type: "undefined"
    }
  );
});

test("Fast React forwardRef observations match without compatibility claim", () => {
  const totalCounts = countFastReactComparisonStatuses(
    Object.values(oracle.fastReactComparisons).flat()
  );
  assert.deepEqual(totalCounts, {
    "known-mismatch": 0,
    "matched-but-compatibility-not-claimed": 16,
    "unsupported-placeholder": 0
  });

  for (const mode of FORWARD_REF_PROBE_MODES) {
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

test("forward-ref oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedForwardRefOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /fast-react-forward-ref-oracle-[A-Za-z0-9]/u);
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-forward-ref-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-forward-ref-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedForwardRefOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedForwardRefOracleText());
});

function reactObservation(modeId, scenarioId) {
  return findForwardRefObservation(
    oracle,
    modeId,
    oracle.reactTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findForwardRefObservation(
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

function assertForwardRefShape(forwardRefDescription, expectation) {
  assert.deepEqual(forwardRefDescription.object.objectKeys, [
    "$$typeof",
    "render"
  ]);
  assert.deepEqual(
    keyValues(forwardRefDescription.object.ownKeys),
    expectation.ownKeys
  );
  assert.equal(forwardRefDescription.object.state.frozen, false);
  assert.equal(forwardRefDescription.object.state.sealed, false);
  assert.equal(forwardRefDescription.object.state.extensible, true);
  assert.equal(
    forwardRefDescription.object.state.prototype,
    "Object.prototype"
  );
  assert.equal(forwardRefDescription.tag.keyFor, expectation.tag);
  for (const key of ["$$typeof", "render"]) {
    assert.deepEqual(
      dataDescriptorFields(
        descriptorFor(forwardRefDescription.object.descriptors, key)
      ),
      {
        configurable: true,
        enumerable: true,
        writable: true
      }
    );
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
