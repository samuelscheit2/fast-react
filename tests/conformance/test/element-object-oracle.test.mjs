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
  const keyDescriptor = descriptorFor(keyValue.before.props.descriptors, "key");
  assert.equal(keyDescriptor.kind, "accessor");
  assert.equal(keyDescriptor.get.name, "warnAboutAccessingKey");
  assert.equal(keyDescriptor.get.isReactWarning, true);
  assert.equal(keyProbe.consoleCalls[0].method, "error");
  assert.match(keyProbe.consoleCalls[0].args[0].value, /`key` is not a prop/u);

  const refProbe = reactObservation(
    "default-node-development",
    "create-ref-warning-access"
  ).result;
  const refValue = unwrapNestedOperation(refProbe.result.value);
  assert.equal(refValue.before.refDescriptor.kind, "accessor");
  assert.equal(
    refValue.before.refDescriptor.get.name,
    "elementRefGetterWithDeprecationWarning"
  );
  assert.equal(refProbe.consoleCalls[0].method, "error");
  assert.match(refProbe.consoleCalls[0].args[0].value, /element\.ref/u);
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

test("Fast React comparisons remain explicit mismatches or unsupported placeholders", () => {
  const allowedStatuses = new Set(["known-mismatch", "unsupported-placeholder"]);

  for (const mode of ELEMENT_OBJECT_PROBE_MODES) {
    for (const comparison of oracle.fastReactComparisons[mode.id]) {
      assert.equal(comparison.compatibilityClaimed, false);
      assert.ok(
        allowedStatuses.has(comparison.status),
        `${mode.id}:${comparison.scenarioId} had unexpected status ${comparison.status}`
      );
      assert.notEqual(comparison.firstDifferencePath, null);
    }
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
  const descriptor = descriptors.find(
    (candidate) =>
      candidate.key.type === "string" && candidate.key.value === key
  );
  assert.ok(descriptor, `missing descriptor ${key}`);
  return descriptor;
}
