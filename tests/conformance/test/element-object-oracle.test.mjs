import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  ELEMENT_OBJECT_FAST_REACT_TARGET,
  ELEMENT_OBJECT_ORACLE_ARTIFACT_PATH,
  ELEMENT_OBJECT_PROBE_MODES,
  ELEMENT_OBJECT_REACT_TARGET
} from "../src/element-object-targets.mjs";
import {
  ELEMENT_OBJECT_SCENARIO_IDS,
  ELEMENT_OBJECT_SCENARIOS
} from "../src/element-object-scenarios.mjs";
import {
  findElementObjectObservation,
  readCheckedElementObjectOracle,
  readCheckedElementObjectOracleText
} from "../src/element-object-oracle.mjs";

const oracle = readCheckedElementObjectOracle();

test("checked element-object oracle artifact has the expected schema and targets", () => {
  assert.equal(
    ELEMENT_OBJECT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-element-object-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-element-object-oracle");
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

  assert.deepEqual(oracle.reactTarget, ELEMENT_OBJECT_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, ELEMENT_OBJECT_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("element-object oracle keeps Fast React compatibility claims false", () => {
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
});

test("element-object oracle covers every scenario in every probe mode for React and Fast React", () => {
  assert.deepEqual(oracle.probeModes, ELEMENT_OBJECT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, ELEMENT_OBJECT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "createElement",
    "cloneElement",
    "jsx",
    "jsxs",
    "jsxDEV",
    "isValidElement",
    "entrypoints"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of ELEMENT_OBJECT_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      ELEMENT_OBJECT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      ELEMENT_OBJECT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      ELEMENT_OBJECT_SCENARIO_IDS.length
    );

    for (const scenarioId of ELEMENT_OBJECT_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React oracle captures development and production element object shape", () => {
  const developmentElement = operationValue(
    "default-node-development",
    "create-basic-no-config"
  );
  assert.equal(developmentElement.brand.keyFor, "react.transitional.element");
  assert.deepEqual(developmentElement.element.objectKeys, [
    "$$typeof",
    "type",
    "key",
    "props",
    "_owner",
    "_store"
  ]);
  assert.deepEqual(keyValues(developmentElement.element.ownKeys), [
    "$$typeof",
    "type",
    "key",
    "props",
    "_owner",
    "ref",
    "_store",
    "_debugInfo",
    "_debugStack",
    "_debugTask"
  ]);
  assert.equal(developmentElement.element.state.frozen, true);
  assert.equal(developmentElement.props.state.frozen, true);
  assert.equal(developmentElement.store.state.frozen, false);

  const productionElement = operationValue(
    "default-node-production",
    "create-basic-no-config"
  );
  assert.deepEqual(productionElement.element.objectKeys, [
    "$$typeof",
    "type",
    "key",
    "ref",
    "props"
  ]);
  assert.equal(productionElement.element.state.frozen, false);
  assert.equal(productionElement.props.state.frozen, false);
});

test("React oracle captures key/ref warning getters and raw console calls", () => {
  const keyProbe = reactObservation(
    "default-node-development",
    "create-key-warning-access"
  ).result;
  const keyValue = unwrapNestedOperation(keyProbe.result.value);
  assertKeyWarningGetter(keyValue.before.props.descriptors);
  assertUndefinedAccess(keyValue.keyAccess);
  assert.equal(keyProbe.consoleCalls.length, 1);
  assert.equal(keyProbe.consoleCalls[0].method, "error");
  assert.match(keyProbe.consoleCalls[0].args[0].value, /`key` is not a prop/u);

  const refProbe = reactObservation(
    "default-node-development",
    "create-ref-warning-access"
  ).result;
  const refValue = unwrapNestedOperation(refProbe.result.value);
  assertRefWarningGetter(refValue.before.refDescriptor);
  assertFunctionAccess(refValue.refAccess, "refFn");
  assert.equal(refProbe.consoleCalls.length, 1);
  assert.equal(refProbe.consoleCalls[0].method, "error");
  assert.match(refProbe.consoleCalls[0].args[0].value, /element\.ref/u);

  const cloneProbe = reactObservation(
    "default-node-development",
    "clone-key-ref-warning-access"
  ).result;
  const cloneValue = unwrapNestedOperation(cloneProbe.result.value);
  assert.equal(maybeDescriptorFor(cloneValue.before.props.descriptors, "key"), null);
  assertUndefinedAccess(cloneValue.keyAccess);
  assertRefWarningGetter(cloneValue.before.refDescriptor);
  assertFunctionAccess(cloneValue.refAccess, "cloneRef");
  assert.equal(cloneProbe.consoleCalls.length, 1);
  assert.equal(cloneProbe.consoleCalls[0].method, "error");
  assert.match(cloneProbe.consoleCalls[0].args[0].value, /element\.ref/u);

  for (const [scenarioId, refName] of [
    ["jsx-key-ref-warning-access", "jsxRef"],
    ["jsxs-key-ref-warning-access", "jsxsRef"],
    ["jsxdev-key-ref-warning-access", "jsxDEVRef"]
  ]) {
    const probe = reactObservation("default-node-development", scenarioId).result;
    const value = unwrapNestedOperation(probe.result.value);
    assertKeyWarningGetter(value.before.props.descriptors);
    assertUndefinedAccess(value.keyAccess);
    assertRefWarningGetter(value.before.refDescriptor);
    assertFunctionAccess(value.refAccess, refName);
    assert.equal(value.propsIsConfig, true, scenarioId);
    assert.equal(probe.consoleCalls.length, 2, scenarioId);
    assert.equal(probe.consoleCalls[0].method, "error", scenarioId);
    assert.match(probe.consoleCalls[0].args[0].value, /`key` is not a prop/u);
    assert.equal(probe.consoleCalls[1].method, "error", scenarioId);
    assert.match(probe.consoleCalls[1].args[0].value, /element\.ref/u);
  }

  for (const scenarioId of [
    "create-key-warning-access",
    "create-ref-warning-access",
    "clone-key-ref-warning-access",
    "jsx-key-ref-warning-access",
    "jsxs-key-ref-warning-access",
    "jsxdev-key-ref-warning-access"
  ]) {
    const comparison = fastReactComparison(
      "default-node-development",
      scenarioId
    );
    assert.equal(
      comparison.status,
      "unexpected-match-compatibility-not-claimed",
      scenarioId
    );
    assert.equal(comparison.compatibilityClaimed, false, scenarioId);
    assert.equal(comparison.firstDifferencePath, null, scenarioId);
  }
});

test("React oracle captures JSX runtime identity, child-array, and jsxDEV condition behavior", () => {
  const jsxIdentity = operationValue(
    "default-node-development",
    "jsx-no-key-reuses-config"
  );
  assert.equal(jsxIdentity.propsIsConfig, true);
  assert.equal(jsxIdentity.config.state.frozen, true);
  assert.ok(
    keyValues(jsxIdentity.config.ownKeys).includes(
      "Symbol(fast-react.probe.jsx.identity-symbol)"
    )
  );

  const developmentJsxs = operationValue(
    "default-node-development",
    "jsxs-static-children-array"
  );
  assert.equal(developmentJsxs.childrenIsInput, true);
  assert.equal(developmentJsxs.childrenInput.state.frozen, true);

  const productionJsxs = operationValue(
    "default-node-production",
    "jsxs-static-children-array"
  );
  assert.equal(productionJsxs.childrenIsInput, true);
  assert.equal(productionJsxs.childrenInput.state.frozen, false);

  const productionJsxDev = operationValue(
    "default-node-production",
    "jsxdev-basic"
  );
  assert.deepEqual(productionJsxDev.jsxDEV, { type: "undefined" });
  assert.equal(productionJsxDev.callSkippedBecauseNotFunction, true);

  const productionJsxDevWarningAccess = operationValue(
    "default-node-production",
    "jsxdev-key-ref-warning-access"
  );
  assert.deepEqual(productionJsxDevWarningAccess.jsxDEV, { type: "undefined" });
  assert.equal(
    productionJsxDevWarningAccess.callSkippedBecauseNotFunction,
    true
  );

  const reactServerExports = operationValue(
    "react-server-production",
    "entrypoint-export-shape"
  );
  assert.deepEqual(reactServerExports.jsxRuntime.exportKeys, [
    "Fragment",
    "jsx",
    "jsxDEV",
    "jsxs"
  ]);
  assert.deepEqual(reactServerExports.jsxDevRuntime.exportKeys, [
    "Fragment",
    "jsx",
    "jsxDEV",
    "jsxs"
  ]);
});

test("element-object oracle captures cloneElement child-array freeze states", () => {
  for (const modeId of ["default-node-development", "react-server-development"]) {
    const reactClone = operationValue(modeId, "clone-multiple-children");
    const fastReactClone = fastOperationValue(modeId, "clone-multiple-children");
    const comparison = fastReactComparison(modeId, "clone-multiple-children");

    assert.equal(reactClone.childArray.state.frozen, false, modeId);
    assert.equal(fastReactClone.childArray.state.frozen, true, modeId);
    assert.equal(comparison.status, "known-mismatch", modeId);
    assert.equal(comparison.compatibilityClaimed, false, modeId);
    assert.notEqual(comparison.firstDifferencePath, null, modeId);
  }

  for (const modeId of ["default-node-production", "react-server-production"]) {
    const reactClone = operationValue(modeId, "clone-multiple-children");
    const fastReactClone = fastOperationValue(modeId, "clone-multiple-children");
    const comparison = fastReactComparison(modeId, "clone-multiple-children");

    assert.equal(reactClone.childArray.state.frozen, false, modeId);
    assert.equal(fastReactClone.childArray.state.frozen, false, modeId);
    assert.equal(
      comparison.status,
      "unexpected-match-compatibility-not-claimed",
      modeId
    );
    assert.equal(comparison.compatibilityClaimed, false, modeId);
    assert.equal(comparison.firstDifferencePath, null, modeId);
  }
});

test("Fast React comparisons distinguish exact normalized matches from compatibility claims", () => {
  const allowedStatuses = new Set([
    "known-mismatch",
    "unexpected-match-compatibility-not-claimed",
    "unsupported-placeholder"
  ]);

  for (const mode of ELEMENT_OBJECT_PROBE_MODES) {
    for (const comparison of oracle.fastReactComparisons[mode.id]) {
      assert.equal(comparison.compatibilityClaimed, false);
      assert.ok(
        allowedStatuses.has(comparison.status),
        `${mode.id}:${comparison.scenarioId} had unexpected status ${comparison.status}`
      );
      if (comparison.status === "unexpected-match-compatibility-not-claimed") {
        assert.equal(comparison.firstDifferencePath, null);
      } else {
        assert.notEqual(comparison.firstDifferencePath, null);
      }
    }
  }
});

test("Fast React comparison status counts stay focused on matched element behavior", () => {
  const totalCounts = countFastReactComparisonStatuses(
    Object.values(oracle.fastReactComparisons).flat()
  );
  assert.deepEqual(totalCounts, {
    "known-mismatch": 6,
    "unexpected-match-compatibility-not-claimed": 98,
    "unsupported-placeholder": 0
  });

  for (const mode of ELEMENT_OBJECT_PROBE_MODES) {
    const modeCounts = countFastReactComparisonStatuses(
      oracle.fastReactComparisons[mode.id]
    );
    assert.deepEqual(
      modeCounts,
      mode.nodeEnv === "development"
        ? {
            "known-mismatch": 2,
            "unexpected-match-compatibility-not-claimed": 24,
            "unsupported-placeholder": 0
          }
        : {
            "known-mismatch": 1,
            "unexpected-match-compatibility-not-claimed": 25,
            "unsupported-placeholder": 0
          },
      mode.id
    );
  }
});

test("element-object oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedElementObjectOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /fast-react-element-oracle-[A-Za-z0-9]/u);
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-element-object-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-element-object-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedElementObjectOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedElementObjectOracleText());
});

function reactObservation(modeId, scenarioId) {
  return findElementObjectObservation(
    oracle,
    modeId,
    oracle.reactTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findElementObjectObservation(
    oracle,
    modeId,
    oracle.fastReactTarget.packageName,
    scenarioId
  );
}

function operationValue(modeId, scenarioId) {
  const operation = reactObservation(modeId, scenarioId).result.result;
  assert.equal(operation.status, "ok", `${modeId}:${scenarioId} should be ok`);
  return unwrapNestedOperation(operation.value);
}

function fastOperationValue(modeId, scenarioId) {
  const operation = fastReactObservation(modeId, scenarioId).result.result;
  assert.equal(operation.status, "ok", `${modeId}:${scenarioId} should be ok`);
  return unwrapNestedOperation(operation.value);
}

function fastReactComparison(modeId, scenarioId) {
  const comparison = oracle.fastReactComparisons[modeId].find(
    (candidate) => candidate.scenarioId === scenarioId
  );
  assert.ok(comparison, `missing comparison ${modeId}:${scenarioId}`);
  return comparison;
}

function unwrapNestedOperation(value) {
  if (
    value &&
    typeof value === "object" &&
    typeof value.status === "string" &&
    Object.hasOwn(value, "value")
  ) {
    assert.equal(value.status, "ok");
    return value.value;
  }

  return value;
}

function keyValues(keys) {
  return keys.map((key) =>
    key.type === "symbol" ? key.stringValue : key.value
  );
}

function descriptorFor(descriptors, key) {
  const descriptor = maybeDescriptorFor(descriptors, key);
  assert.ok(descriptor, `missing descriptor ${key}`);
  return descriptor;
}

function maybeDescriptorFor(descriptors, key) {
  return descriptors.find(
    (candidate) =>
      candidate.key.type === "string" && candidate.key.value === key
  ) ?? null;
}

function assertKeyWarningGetter(descriptors) {
  const keyDescriptor = descriptorFor(descriptors, "key");
  assert.equal(keyDescriptor.kind, "accessor");
  assert.equal(keyDescriptor.get.name, "warnAboutAccessingKey");
  assert.equal(keyDescriptor.get.isReactWarning, true);
}

function assertRefWarningGetter(refDescriptor) {
  assert.equal(refDescriptor.kind, "accessor");
  assert.equal(
    refDescriptor.get.name,
    "elementRefGetterWithDeprecationWarning"
  );
}

function assertUndefinedAccess(operation) {
  assert.equal(operation.status, "ok");
  assert.deepEqual(operation.value, { type: "undefined" });
}

function assertFunctionAccess(operation, name) {
  assert.equal(operation.status, "ok");
  assert.deepEqual(operation.value, {
    type: "function",
    name,
    length: 0,
    isReactWarning: false
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
      "unexpected-match-compatibility-not-claimed": 0,
      "unsupported-placeholder": 0
    }
  );
}
