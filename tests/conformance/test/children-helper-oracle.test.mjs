import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  CHILDREN_HELPER_FAST_REACT_TARGET,
  CHILDREN_HELPER_ORACLE_ARTIFACT_PATH,
  CHILDREN_HELPER_PROBE_MODES,
  CHILDREN_HELPER_REACT_TARGET
} from "../src/children-helper-targets.mjs";
import {
  CHILDREN_HELPER_SCENARIO_IDS,
  CHILDREN_HELPER_SCENARIOS
} from "../src/children-helper-scenarios.mjs";
import {
  findChildrenHelperObservation,
  readCheckedChildrenHelperOracle,
  readCheckedChildrenHelperOracleText
} from "../src/children-helper-oracle.mjs";

const oracle = readCheckedChildrenHelperOracle();

test("checked children-helper oracle artifact has the expected schema and targets", () => {
  assert.equal(
    CHILDREN_HELPER_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-children-helper-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-children-helper-oracle");
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

  assert.deepEqual(oracle.reactTarget, CHILDREN_HELPER_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, CHILDREN_HELPER_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("children-helper oracle keeps Fast React compatibility claims false", () => {
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
    beforeWorker025: {
      source:
        "packages/react/index.js and packages/react/react.react-server.js wired Children helpers to createUnimplementedFunction before this worker slice",
      generatedProbe: false,
      statusCounts: {
        "known-mismatch": 4,
        "unsupported-placeholder": 36
      },
      compatibilityClaimed: false
    },
    afterWorker025: {
      source: "generated fastReactComparisons in this oracle artifact",
      generatedProbe: true,
      statusCounts: {
        "matched-but-compatibility-not-claimed": 40
      },
      compatibilityClaimed: false
    }
  });
});

test("children-helper oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, CHILDREN_HELPER_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, CHILDREN_HELPER_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "Children helper export",
    "Children nullish and empty-ish values",
    "Children scalar values",
    "Children array traversal",
    "Children element and fragment leaves",
    "Children.map return handling",
    "Children.toArray key synthesis",
    "Children iterable traversal",
    "Children thenable traversal",
    "Children thrown errors"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of CHILDREN_HELPER_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      CHILDREN_HELPER_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      CHILDREN_HELPER_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      CHILDREN_HELPER_SCENARIO_IDS.length
    );

    for (const scenarioId of CHILDREN_HELPER_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React oracle captures Children helper object and function descriptors", () => {
  const exportShape = operationValue(
    "default-node-development",
    "children-helper-export-shape"
  );

  assert.deepEqual(exportShape.childrenObject.objectKeys, [
    "map",
    "forEach",
    "count",
    "toArray",
    "only"
  ]);
  assert.equal(exportShape.childrenObject.state.frozen, false);
  assert.equal(exportShape.childrenObject.state.sealed, false);
  assert.equal(exportShape.childrenObject.state.extensible, true);
  assert.deepEqual(helperDescriptorValue(exportShape, "map"), {
    type: "function",
    name: "mapChildren",
    length: 3,
    isReactWarning: false
  });
  assert.deepEqual(helperDescriptorValue(exportShape, "forEach"), {
    type: "function",
    name: "forEach",
    length: 3,
    isReactWarning: false
  });
  assert.deepEqual(helperDescriptorValue(exportShape, "count"), {
    type: "function",
    name: "count",
    length: 1,
    isReactWarning: false
  });
  assert.deepEqual(helperDescriptorValue(exportShape, "toArray"), {
    type: "function",
    name: "toArray",
    length: 1,
    isReactWarning: false
  });
  assert.deepEqual(helperDescriptorValue(exportShape, "only"), {
    type: "function",
    name: "only",
    length: 1,
    isReactWarning: false
  });
});

test("React oracle captures nullish, boolean, scalar, and array traversal", () => {
  const nullish = operationValue(
    "default-node-development",
    "children-nullish-and-empty-values"
  );
  assert.equal(nullish.nullChild.count.value.value, 0);
  assert.equal(nullish.nullChild.mapIdentity.value.type, "null");
  assert.equal(nullish.undefinedChild.mapIdentity.value.type, "undefined");
  assert.equal(nullish.falseChild.count.value.value, 1);
  assert.deepEqual(nullish.falseChild.mapCalls, [
    {
      child: { type: "null" },
      index: 0
    }
  ]);
  assert.equal(nullish.symbolChild.count.value.value, 0);
  assert.equal(nullish.functionChild.count.value.value, 0);

  const scalars = operationValue(
    "default-node-development",
    "children-scalar-values"
  );
  assert.deepEqual(scalars.stringChild.mapCalls[0], {
    child: { type: "string", value: "text-child" },
    index: 0
  });
  assert.deepEqual(scalars.numberChild.mapCalls[0].child, {
    type: "number",
    value: 42
  });
  assert.deepEqual(scalars.bigintChild.mapCalls[0].child, {
    type: "bigint",
    value: "9007199254740993"
  });

  const arrayTraversal = operationValue(
    "default-node-development",
    "children-array-and-nested-traversal"
  );
  assert.equal(arrayTraversal.nested.count.value.value, 6);
  assert.deepEqual(
    arrayTraversal.nested.mapCalls.map((call) => [call.child.type, call.index]),
    [
      ["string", 0],
      ["null", 1],
      ["null", 2],
      ["string", 3],
      ["null", 4],
      ["string", 5]
    ]
  );
  assert.equal(arrayTraversal.forEachResult.type, "undefined");
  assert.equal(
    arrayTraversal.forEachCalls.every((call) => call.thisMatchesContext),
    true
  );
});

test("React oracle captures fragments as leaves and Children.only behavior", () => {
  const leaves = operationValue(
    "default-node-development",
    "children-element-and-fragment-leaves"
  );

  assert.equal(leaves.count.value.value, 2);
  assert.equal(leaves.fragment.type.keyFor, "react.fragment");
  assert.equal(leaves.fragment.props.children.summary.reactElement, true);
  assert.equal(leaves.toArray.value.items[1].type.keyFor, "react.fragment");
  assert.equal(leaves.mappedElementIdentity[0].sameAsElement, false);
  assert.equal(leaves.mappedElementIdentity[1].sameAsFragment, false);
  assert.equal(leaves.portal.properties.$$typeof.keyFor, "react.portal");
  assert.equal(leaves.portalCount.value.value, 1);
  assert.equal(leaves.portalToArraySameIdentity, true);
  assert.equal(leaves.portalMapSameIdentity, true);
  assert.equal(leaves.onlyElement.status, "ok");
  assert.equal(leaves.onlyFragment.status, "ok");
  assert.equal(leaves.onlyArray.status, "throws");
  assert.equal(leaves.onlyNull.status, "throws");
});

test("React oracle captures map return filtering and key synthesis", () => {
  const mapReturn = operationValue(
    "default-node-development",
    "children-map-return-handling-and-keys"
  );
  assert.equal(mapReturn.mapToNull.value.length, 0);
  assert.equal(mapReturn.mapToUndefined.value.length, 0);
  assert.deepEqual(mapReturn.mapToFalse.value.items, [
    { type: "boolean", value: false },
    { type: "boolean", value: false },
    { type: "boolean", value: false },
    { type: "boolean", value: false }
  ]);
  assert.deepEqual(childKeys(mapReturn.mapToSameElement.value.items), [
    ".$orig",
    ".1",
    null
  ]);
  assert.deepEqual(childKeys(mapReturn.mapToNewElements.value.items), [
    "mapped//key0/.$orig",
    "mapped//key1/.1",
    "mapped//key2/.2",
    "mapped//key3/.3"
  ]);
  assert.deepEqual(childKeys(mapReturn.mapToArrays.value.items), [
    ".$orig/.$inner/key",
    ".$orig/.1"
  ]);

  const toArray = operationValue(
    "default-node-development",
    "children-to-array-key-synthesis"
  );
  assert.deepEqual(childKeys(toArray.nestedToArray.value.items), [
    ".$a=2b=0c",
    ".1:0",
    null,
    ".3:0:$slash/key"
  ]);
  assert.equal(toArray.unkeyedToArray.items[0].key.value, ".0");
  assert.equal(toArray.unkeyedResultIdentity, false);
});

test("React oracle captures iterable and thenable behavior", () => {
  const iterables = operationValue(
    "default-node-development",
    "children-iterable-values"
  );
  assert.deepEqual(childKeys(iterables.setToArray.value.items), [
    ".$set-key",
    null
  ]);
  assert.deepEqual(childKeys(iterables.generatorToArray.value.items), [
    ".0",
    null
  ]);
  assert.deepEqual(childKeys(iterables.mapToArray.value.items), [
    null,
    ".0:$map-key",
    null,
    null
  ]);
  assert.deepEqual(
    reactObservation("default-node-development", "children-iterable-values")
      .result.consoleCalls,
    [
      {
        method: "warn",
        args: [
          {
            type: "string",
            value:
              "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          }
        ]
      }
    ]
  );
  assert.deepEqual(
    reactObservation("default-node-production", "children-iterable-values")
      .result.consoleCalls,
    []
  );

  const thenables = operationValue(
    "default-node-development",
    "children-thenable-values"
  );
  assert.deepEqual(childKeys(thenables.fulfilledToArray.value.items), [
    ".$fulfilled",
    null
  ]);
  assert.equal(thenables.syncFulfilledAfter.properties.status.value, "fulfilled");
  assert.equal(thenables.rejectedToArray.status, "throws");
  assert.equal(thenables.rejectedToArray.error.message, "rejected child");
  assert.equal(thenables.pendingToArray.status, "throws");
  assert.equal(thenables.pendingToArray.error.thrownValue.type, "object");
  assert.equal(thenables.pendingAfter.properties.status.value, "pending");
});

test("React oracle captures thrown Children errors including react-server production minification", () => {
  const developmentErrors = operationValue(
    "default-node-development",
    "children-error-behavior"
  );
  assert.equal(developmentErrors.plainObject.status, "throws");
  assert.match(
    developmentErrors.plainObject.error.message,
    /Objects are not valid as a React child/
  );
  assert.equal(developmentErrors.mapMissingCallback.error.name, "TypeError");
  assert.equal(
    developmentErrors.callbackThrows.error.message,
    "callback exploded"
  );
  assert.equal(
    developmentErrors.iteratorThrows.error.message,
    "iterator exploded"
  );
  assert.equal(developmentErrors.onlyString.status, "throws");
  assert.match(
    developmentErrors.onlyString.error.message,
    /React.Children.only expected/
  );

  const serverProductionErrors = operationValue(
    "react-server-production",
    "children-error-behavior"
  );
  assert.match(serverProductionErrors.plainObject.error.message, /#31/);
  assert.match(
    serverProductionErrors.plainObject.error.message,
    /args\[]=object%20with%20keys%20%7Ba%2C%20b%7D/
  );
  assert.match(serverProductionErrors.onlyString.error.message, /#143/);
});

test("Fast React Children helper observations match without compatibility claim", () => {
  const totalCounts = countFastReactComparisonStatuses(
    Object.values(oracle.fastReactComparisons).flat()
  );
  assert.deepEqual(totalCounts, {
    "known-mismatch": 0,
    "matched-but-compatibility-not-claimed": 40,
    "unsupported-placeholder": 0
  });

  for (const mode of CHILDREN_HELPER_PROBE_MODES) {
    const modeCounts = countFastReactComparisonStatuses(
      oracle.fastReactComparisons[mode.id]
    );
    assert.deepEqual(
      modeCounts,
      {
        "known-mismatch": 0,
        "matched-but-compatibility-not-claimed": 10,
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

test("children-helper oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedChildrenHelperOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /fast-react-children-oracle-[A-Za-z0-9]/u);
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-children-helper-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-children-helper-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedChildrenHelperOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedChildrenHelperOracleText());
});

function reactObservation(modeId, scenarioId) {
  return findChildrenHelperObservation(
    oracle,
    modeId,
    oracle.reactTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findChildrenHelperObservation(
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

function descriptorFor(descriptors, key) {
  const descriptor = descriptors.find(
    (candidate) =>
      candidate.key.type === "string" && candidate.key.value === key
  );
  assert.ok(descriptor, `missing descriptor ${key}`);
  return descriptor;
}

function helperDescriptorValue(exportShape, key) {
  const descriptor = descriptorFor(exportShape.childrenObject.descriptors, key);
  assert.deepEqual(dataDescriptorFields(descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  return descriptor.value;
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function childKeys(items) {
  return items.map((item) => {
    if (!item || !item.key) {
      return null;
    }
    if (item.key.type === "string") {
      return item.key.value;
    }
    return null;
  });
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
