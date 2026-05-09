import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH,
  REACT_DOM_TEST_UTILS_ACT_PROBE_MODES,
  REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS,
  REACT_DOM_TEST_UTILS_ACT_TARGET
} from "../src/react-dom-test-utils-act-targets.mjs";
import {
  REACT_DOM_TEST_UTILS_ACT_SCENARIO_IDS,
  REACT_DOM_TEST_UTILS_ACT_SCENARIOS
} from "../src/react-dom-test-utils-act-scenarios.mjs";
import {
  findReactDomTestUtilsActObservation,
  readCheckedReactDomTestUtilsActOracle,
  readCheckedReactDomTestUtilsActOracleText
} from "../src/react-dom-test-utils-act-oracle.mjs";

const oracle = readCheckedReactDomTestUtilsActOracle();

test("checked react-dom/test-utils.act oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_TEST_UTILS_ACT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-test-utils-act-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-test-utils-act-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per act scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_TEST_UTILS_ACT_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("react-dom/test-utils.act oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-fast-react-react-dom-comparison"
    ),
    true
  );
  assert.equal(
    oracle.intentionalGaps.some((gap) => gap.id === "no-renderer-flush-semantics"),
    true
  );
});

test("react-dom/test-utils.act oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_TEST_UTILS_ACT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_DOM_TEST_UTILS_ACT_SCENARIOS);

  for (const mode of REACT_DOM_TEST_UTILS_ACT_PROBE_MODES) {
    const observations = oracle.actObservations[mode.id];
    assert.equal(observations.length, REACT_DOM_TEST_UTILS_ACT_SCENARIO_IDS.length);

    for (const scenarioId of REACT_DOM_TEST_UTILS_ACT_SCENARIO_IDS) {
      const observation = findReactDomTestUtilsActObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.specifier, "react-dom/test-utils");
      assert.equal(observation.subpath, "./test-utils");
      assert.deepEqual(observation.processEvents, []);
    }
  }
});

test("React DOM test-utils act export shape and React.act relationship are recorded", () => {
  const development = resultFor("default-node-development", "module-export-shape");
  assert.deepEqual(development.requireModule.objectKeys, ["act"]);
  assert.deepEqual(keyValues(development.requireModule.ownKeys), ["act"]);
  assert.deepEqual(
    dataDescriptorFields(
      descriptorFor(development.requireModule.descriptors, "act")
    ),
    {
      configurable: true,
      enumerable: true,
      writable: true
    }
  );
  assert.deepEqual(
    descriptorFor(development.requireModule.descriptors, "act").value,
    {
      type: "function",
      name: "",
      length: 1,
      isAsync: false,
      ownPropertyNames: ["length", "name", "prototype"],
      ownKeys: [
        { type: "string", value: "length" },
        { type: "string", value: "name" },
        { type: "string", value: "prototype" }
      ]
    }
  );
  assert.deepEqual(keyValues(development.dynamicImportModule.ownKeys), [
    "act",
    "default",
    "module.exports",
    "Symbol.toStringTag"
  ]);
  assert.equal(development.relationships.testUtilsActEqualsReactAct, false);
  assert.equal(development.relationships.importedActEqualsRequiredAct, true);
  assert.equal(development.relationships.importedDefaultEqualsRequire, true);
  assert.equal(development.relationships.reactActType, "function");

  const production = resultFor("default-node-production", "module-export-shape");
  assert.equal(production.reactActExport.hasOwn, false);
  assert.equal(production.relationships.reactActType, "undefined");

  const server = resultFor("react-server-development", "module-export-shape");
  assert.equal(server.reactActExport.hasOwn, false);
  assert.equal(server.relationships.reactActType, "undefined");
});

test("CommonJS descriptors are mutable while dynamic import namespace bindings reject writes", () => {
  const result = resultFor("default-node-development", "descriptor-mutability");
  assert.deepEqual(dataDescriptorFields(result.requireBefore.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(dataDescriptorFields(result.importBefore.descriptor), {
    configurable: false,
    enumerable: true,
    writable: true
  });
  assert.equal(result.importAssignment.status, "throws");
  assert.equal(result.importAssignment.error.name, "TypeError");
  assert.match(result.importAssignment.error.message, /Cannot assign/u);
  assert.equal(result.importDelete.status, "throws");
  assert.equal(result.importDelete.error.name, "TypeError");
  assert.match(result.importDelete.error.message, /Cannot delete/u);
  assert.equal(result.requireAssignment.status, "ok");
  assert.equal(
    describedObjectPropertyValue(
      result.requireAssignment.value,
      "actEqualsReplacement"
    ).value,
    true
  );
  assert.equal(
    describedObjectPropertyValue(
      result.requireAssignment.value,
      "importedNamedActEqualsReplacement"
    ).value,
    false
  );
  assert.equal(
    describedObjectPropertyValue(
      result.requireAssignment.value,
      "importedDefaultActEqualsReplacement"
    ).value,
    true
  );
  assert.equal(result.requireDelete.status, "ok");
  assert.equal(result.requireDelete.value.value, true);
  assert.deepEqual(result.requireAfterDelete.objectKeys, []);
  assert.equal(
    result.relationshipsAfterMutation.importedNamedActEqualsOriginal,
    true
  );
  assert.equal(result.relationshipsAfterMutation.importedDefaultHasAct, false);
});

test("deprecation and async no-await warnings are deterministic", () => {
  const warningText =
    "`ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.";

  const dedup = observationFor(
    "default-node-development",
    "deprecation-warning-dedup"
  );
  assert.deepEqual(consoleMessages(dedup), [warningText]);
  assert.equal(dedup.result.first.callbackCallCount, 1);
  assert.equal(dedup.result.second.callbackCallCount, 1);

  const productionDedup = observationFor(
    "default-node-production",
    "deprecation-warning-dedup"
  );
  assert.deepEqual(consoleMessages(productionDedup), [warningText]);
  assert.equal(productionDedup.result.first.callbackCallCount, 0);
  assert.equal(productionDedup.result.first.call.status, "throws");
  assert.equal(
    productionDedup.result.first.call.error.message,
    "React.act is not a function"
  );

  const unawaited = observationFor(
    "default-node-development",
    "async-not-awaited-warning"
  );
  assert.deepEqual(consoleMessages(unawaited), [
    warningText,
    "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
  ]);
  assert.equal(unawaited.result.callbackEvents.length, 1);
  assert.equal(unawaited.result.call.status, "ok");
});

test("sync and async callback returns settle through act thenables in default development", () => {
  const sync = resultFor("default-node-development", "sync-callback-return");
  assertActResolved(sync.testUtils, "sync-return-value");
  assertActResolved(sync.reactAct, "sync-return-value");
  assert.equal(sync.comparison.callStatusesEqual, true);
  assert.equal(sync.comparison.callbackCallCountsEqual, true);
  assert.equal(sync.comparison.settlementStatusesEqual, true);

  const asyncReturn = resultFor(
    "default-node-development",
    "async-callback-return"
  );
  assertActResolved(asyncReturn.testUtils, "async-return-value");
  assertActResolved(asyncReturn.reactAct, "async-return-value");
  assert.equal(asyncReturn.comparison.callStatusesEqual, true);
  assert.equal(asyncReturn.comparison.settlementStatusesEqual, true);

  const production = resultFor("default-node-production", "sync-callback-return");
  assert.equal(production.testUtils.call.status, "throws");
  assert.equal(production.testUtils.callbackCallCount, 0);
  assert.equal(production.testUtils.call.error.message, "React.act is not a function");

  const server = resultFor("react-server-development", "sync-callback-return");
  assert.equal(server.testUtils.call.status, "throws");
  assert.equal(server.testUtils.callbackCallCount, 0);
  assert.equal(server.testUtils.call.error.message, "React.act is not a function");
});

test("synchronous throws and async rejections are captured", () => {
  const syncThrow = resultFor("default-node-development", "callback-throws");
  assert.equal(syncThrow.testUtils.call.status, "throws");
  assert.equal(syncThrow.testUtils.call.error.name, "ProbeSyncError");
  assert.equal(syncThrow.testUtils.call.error.message, "sync callback boom");
  assert.equal(syncThrow.testUtils.callbackCallCount, 1);
  assert.equal(syncThrow.reactAct.call.status, "throws");
  assert.equal(syncThrow.reactAct.call.error.name, "ProbeSyncError");
  assert.equal(syncThrow.comparison.callStatusesEqual, true);

  const asyncReject = resultFor(
    "default-node-development",
    "async-callback-rejects"
  );
  assert.equal(asyncReject.testUtils.call.status, "ok");
  assert.equal(asyncReject.testUtils.settlement.status, "rejected");
  assert.equal(asyncReject.testUtils.settlement.error.name, "ProbeAsyncError");
  assert.equal(
    asyncReject.testUtils.settlement.error.message,
    "async callback boom"
  );
  assert.equal(asyncReject.reactAct.settlement.status, "rejected");

  const production = resultFor("default-node-production", "callback-throws");
  assert.equal(production.testUtils.call.status, "throws");
  assert.equal(production.testUtils.call.error.name, "TypeError");
  assert.equal(production.testUtils.callbackCallCount, 0);
});

test("thenable classification records object thenables and sync fallback returns", () => {
  const result = resultFor("default-node-development", "thenable-classification");
  assert.deepEqual(result.testUtils.events, ["object-then-called"]);
  assertActResolved(result.testUtils.objectThenable, "object-then-value");
  assert.equal(result.testUtils.functionThenable.settlement.status, "resolved");
  assert.equal(
    result.testUtils.functionThenable.settlement.value.name,
    "functionThenableValue"
  );
  assert.equal(
    result.testUtils.functionThenable.settlement.value.type,
    "function"
  );
  assert.equal(result.testUtils.nonFunctionThen.settlement.status, "resolved");
  assert.equal(
    result.testUtils.nonFunctionThen.settlement.value.objectTag,
    "[object Object]"
  );
  assert.equal(result.testUtils.nullReturn.settlement.status, "resolved");
  assert.deepEqual(result.testUtils.nullReturn.settlement.value, {
    type: "null"
  });

  const production = resultFor("default-node-production", "thenable-classification");
  assert.equal(production.testUtils.objectThenable.call.status, "throws");
  assert.equal(production.testUtils.objectThenable.callbackCallCount, 0);
  assert.deepEqual(production.testUtils.events, []);
});

test("react-dom/test-utils.act oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactDomTestUtilsActOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/Users\/user\/Developer\/Developer/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-test-utils-act-oracle-[A-Za-z0-9]/u
  );
});

test("print react-dom/test-utils.act oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-test-utils-act-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedReactDomTestUtilsActOracleText());
});

function observationFor(modeId, scenarioId) {
  return findReactDomTestUtilsActObservation(oracle, modeId, scenarioId);
}

function resultFor(modeId, scenarioId) {
  return observationFor(modeId, scenarioId).result;
}

function descriptorFor(descriptors, key) {
  const match = descriptors.find(
    (entry) =>
      (entry.key.type === "string" && entry.key.value === key) ||
      (entry.key.type === "symbol" && entry.key.description === key)
  );
  assert.ok(match, `missing descriptor for ${key}`);
  return match.descriptor;
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function describedObjectPropertyValue(objectDescription, key) {
  return descriptorFor(objectDescription.descriptors, key).value;
}

function keyValues(keys) {
  return keys.map((key) =>
    key.type === "symbol" ? key.description : key.value
  );
}

function consoleMessages(observation) {
  return observation.consoleCalls.map((call) => call.args[0].value);
}

function assertActResolved(actObservation, expectedValue) {
  assert.equal(actObservation.call.status, "ok");
  assert.equal(actObservation.callbackCallCount, 1);
  assert.deepEqual(actObservation.call.value, {
    type: "object",
    objectTag: "[object Object]",
    isArray: false,
    isExtensible: true,
    objectKeys: ["then"],
    ownPropertyNames: ["then"],
    ownSymbolKeys: [],
    ownKeys: [{ type: "string", value: "then" }],
    descriptors: [
      {
        key: { type: "string", value: "then" },
        descriptor: {
          kind: "data",
          enumerable: true,
          configurable: true,
          writable: true,
          value: {
            type: "function",
            name: "then",
            length: 2,
            isAsync: false,
            ownPropertyNames: ["length", "name", "prototype"],
            ownKeys: [
              { type: "string", value: "length" },
              { type: "string", value: "name" },
              { type: "string", value: "prototype" }
            ]
          }
        }
      }
    ]
  });
  assert.equal(actObservation.settlement.status, "resolved");
  assert.deepEqual(actObservation.settlement.value, {
    type: "string",
    value: expectedValue
  });
}
