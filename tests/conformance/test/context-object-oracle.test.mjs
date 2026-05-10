import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  CONTEXT_OBJECT_FAST_REACT_TARGET,
  CONTEXT_OBJECT_ORACLE_ARTIFACT_PATH,
  CONTEXT_OBJECT_PROBE_MODES,
  CONTEXT_OBJECT_REACT_TARGET
} from "../src/context-object-targets.mjs";
import {
  CONTEXT_OBJECT_SCENARIO_IDS,
  CONTEXT_OBJECT_SCENARIOS
} from "../src/context-object-scenarios.mjs";
import {
  CONTEXT_OBJECT_LOCAL_GATE_ROWS,
  CONTEXT_OBJECT_LOCAL_GATE_STATUS,
  CONTEXT_OBJECT_RUNTIME_BLOCKING_REQUIREMENTS,
  evaluateContextObjectLocalGate
} from "../src/context-object-local-gate.mjs";
import {
  findContextObjectObservation,
  readCheckedContextObjectOracle,
  readCheckedContextObjectOracleText
} from "../src/context-object-oracle.mjs";

const oracle = readCheckedContextObjectOracle();

test("checked context-object oracle artifact has the expected schema and targets", () => {
  assert.equal(
    CONTEXT_OBJECT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-context-object-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-context-object-oracle");
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

  assert.deepEqual(oracle.reactTarget, CONTEXT_OBJECT_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, CONTEXT_OBJECT_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("context-object oracle keeps Fast React compatibility claims false", () => {
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
    beforeWorker028: {
      source:
        "packages/react/index.js wired createContext to createUnimplementedFunction, while packages/react/react.react-server.js did not export createContext before this worker slice",
      generatedProbe: false,
      statusCounts: {
        "matched-but-compatibility-not-claimed": 14,
        "known-mismatch": 2,
        "unsupported-placeholder": 12
      },
      compatibilityClaimed: false
    },
    afterWorker028: {
      source: "generated fastReactComparisons in this oracle artifact",
      generatedProbe: true,
      statusCounts: {
        "matched-but-compatibility-not-claimed": 28
      },
      compatibilityClaimed: false
    }
  });
});

test("context-object local gate compares live provider object shape to the accepted React oracle", () => {
  const gate = evaluateContextObjectLocalGate({ oracle });

  assert.equal(gate.status, CONTEXT_OBJECT_LOCAL_GATE_STATUS);
  assert.equal(gate.directObjectProviderShapeMatchesOracle, true);
  assert.equal(gate.requiredRuntimeTargetsReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(
    gate.localComparisonRows.map(({ modeId, scenarioId, status }) => ({
      modeId,
      scenarioId,
      status
    })),
    CONTEXT_OBJECT_LOCAL_GATE_ROWS.map(({ modeId, scenarioId }) => ({
      modeId,
      scenarioId,
      status: "matched-against-checked-react-oracle"
    }))
  );
  assert.ok(gate.localChecks.jsCreateContextDirectObjectPresent);
  assert.equal(gate.localChecks.useContextStillDispatcherOnly, true);
  assert.equal(gate.localChecks.beginWorkRejectsContextProvider, true);
  assert.equal(gate.localChecks.functionComponentContextUnsupported, true);
  assert.equal(gate.localChecks.runtimeContextPropagationPresent, false);
  assert.equal(
    gate.localChecks.reconcilerProviderBeginWorkIntegrationPresent,
    false
  );
  assert.equal(
    gate.localChecks.functionComponentUseContextRenderReadPresent,
    true
  );
});

test("context-object local gate rejects premature compatibility claims", () => {
  const prematureClaimOracle = JSON.parse(JSON.stringify(oracle));
  prematureClaimOracle.conformanceClaims.compatibilityClaimed = true;

  const gate = evaluateContextObjectLocalGate({
    oracle: prematureClaimOracle
  });

  assert.equal(gate.status, "blocked-with-violations");
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    ["compatibility-claimed-before-context-runtime-propagation"]
  );
});

test("context-object local gate keeps runtime unblock requirements explicit", () => {
  assert.deepEqual(
    CONTEXT_OBJECT_LOCAL_GATE_ROWS.map(({ scenarioId }) => scenarioId),
    [
      "context-object-shape",
      "context-provider-consumer-identity",
      "context-display-name",
      "context-mutability-and-slots",
      "context-object-shape",
      "context-provider-consumer-identity",
      "context-display-name",
      "context-mutability-and-slots",
      "context-export-shape",
      "context-export-shape"
    ]
  );
  assert.deepEqual(
    CONTEXT_OBJECT_RUNTIME_BLOCKING_REQUIREMENTS.map(
      (requirement) => requirement.id
    ),
    [
      "runtime-context-value-propagation",
      "reconciler-context-provider-begin-work",
      "function-component-use-context-render-read"
    ]
  );
  for (const requirement of CONTEXT_OBJECT_RUNTIME_BLOCKING_REQUIREMENTS) {
    assert.equal(requirement.requiredBeforeCompatibilityClaim, true);
  }
});

test("context-object oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, CONTEXT_OBJECT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, CONTEXT_OBJECT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "createContext export",
    "createContext default values",
    "createContext object shape",
    "createContext invocation",
    "createContext provider and consumer identity",
    "createContext displayName assignment",
    "createContext mutability and slots"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of CONTEXT_OBJECT_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      CONTEXT_OBJECT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      CONTEXT_OBJECT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      CONTEXT_OBJECT_SCENARIO_IDS.length
    );

    for (const scenarioId of CONTEXT_OBJECT_SCENARIO_IDS) {
      assert.equal(
        reactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React oracle captures createContext export presence and react-server absence", () => {
  const defaultExport = operationValue(
    "default-node-development",
    "context-export-shape"
  );
  assert.equal(defaultExport.hasOwn, true);
  assert.equal(defaultExport.exportKeysInclude, true);
  assert.deepEqual(dataDescriptorFields(defaultExport.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(defaultExport.descriptor.value, {
    type: "function",
    name: "",
    length: 1,
    isReactWarning: false
  });
  assert.deepEqual(keyValues(defaultExport.functionObject.ownKeys), [
    "length",
    "name",
    "prototype"
  ]);

  for (const modeId of [
    "react-server-development",
    "react-server-production"
  ]) {
    const serverExport = operationValue(modeId, "context-export-shape");
    assert.equal(serverExport.hasOwn, false, modeId);
    assert.equal(serverExport.exportKeysInclude, false, modeId);
    assert.equal(serverExport.descriptor, null, modeId);
    assert.deepEqual(serverExport.functionObject, { type: "undefined" });
  }
});

test("React oracle captures development and production context object shape", () => {
  const development = operationValue(
    "default-node-development",
    "context-object-shape"
  );
  assertContextShape(development, {
    ownKeys: [
      "$$typeof",
      "_currentValue",
      "_currentValue2",
      "_threadCount",
      "Provider",
      "Consumer",
      "_currentRenderer",
      "_currentRenderer2"
    ],
    hasRendererSlots: true
  });

  const production = operationValue(
    "default-node-production",
    "context-object-shape"
  );
  assertContextShape(production, {
    ownKeys: [
      "$$typeof",
      "_currentValue",
      "_currentValue2",
      "_threadCount",
      "Provider",
      "Consumer"
    ],
    hasRendererSlots: false
  });
});

test("React oracle captures default value identity and symbol tags", () => {
  const defaults = operationValue(
    "default-node-development",
    "context-default-values"
  );
  const objectCase = caseByLabel(defaults.cases, "object").result.value;
  assert.equal(objectCase.relationships.currentValueEqualsDefault, true);
  assert.equal(objectCase.relationships.currentValue2EqualsDefault, true);

  const symbolCase = caseByLabel(defaults.cases, "symbol").result.value;
  assert.equal(symbolCase.relationships.currentValueEqualsDefault, true);
  assert.deepEqual(symbolCase.selectedValues.currentValue, {
    type: "symbol",
    keyFor: null,
    description: "context-default",
    stringValue: "Symbol(context-default)"
  });

  const contextShape = operationValue(
    "default-node-development",
    "context-object-shape"
  );
  assert.deepEqual(
    descriptorFor(contextShape.context.descriptors, "$$typeof").value,
    {
      type: "symbol",
      keyFor: "react.context",
      description: "react.context",
      stringValue: "Symbol(react.context)"
    }
  );
  assert.deepEqual(
    descriptorFor(contextShape.consumer.object.descriptors, "$$typeof").value,
    {
      type: "symbol",
      keyFor: "react.consumer",
      description: "react.consumer",
      stringValue: "Symbol(react.consumer)"
    }
  );
});

test("React oracle captures invocation and constructor behavior", () => {
  const invocation = operationValue(
    "default-node-development",
    "context-invocation"
  );

  assert.equal(invocation.firstEqualsSecond, false);
  assert.equal(invocation.firstEqualsThirdCall, false);
  assert.equal(invocation.withExtraArgs.status, "ok");
  assert.equal(
    invocation.withExtraArgs.value.relationships.currentValueEqualsDefault,
    true
  );

  for (const key of [
    "callWithNullThis",
    "callWithThis",
    "applyWithUndefinedThis",
    "applyWithThis",
    "boundCall"
  ]) {
    assert.equal(invocation[key].status, "ok", key);
    assert.equal(invocation[key].value.relationships.providerEqualsContext, true);
  }

  assert.deepEqual(invocation.thisArgAfterCalls.objectKeys, ["untouched"]);
  assert.equal(invocation.constructorCall.status, "ok");
  assert.equal(invocation.constructorCall.value.instanceOfCreateContext, false);
  assert.equal(
    invocation.constructorCall.value.instanceOfBoundCreateContext,
    false
  );
  assert.equal(invocation.boundConstructorCall.status, "ok");
  assert.equal(
    invocation.boundConstructorCall.value.instanceOfBoundCreateContext,
    false
  );
});

test("React oracle captures Provider, Consumer, displayName, and mutability", () => {
  const identity = operationValue(
    "default-node-development",
    "context-provider-consumer-identity"
  );
  assert.equal(identity.relationships.providerEqualsContext, true);
  assert.equal(identity.relationships.consumerEqualsContext, false);
  assert.equal(identity.relationships.consumerContextEqualsContext, true);
  assert.deepEqual(keyValues(identity.consumer.object.ownKeys), [
    "$$typeof",
    "_context"
  ]);

  const displayName = operationValue(
    "default-node-development",
    "context-display-name"
  );
  assert.deepEqual(displayName.initial.contextDisplayName, {
    type: "undefined"
  });
  assert.equal(
    displayName.assignContextDisplayName.value.contextDisplayName.value,
    "Ctx"
  );
  assert.equal(
    displayName.assignContextDisplayName.value.providerDisplayName.value,
    "Ctx"
  );
  assert.deepEqual(
    displayName.assignContextDisplayName.value.consumerDisplayName,
    {
      type: "undefined"
    }
  );
  assert.equal(
    displayName.assignConsumerDisplayName.value.consumerDisplayName.value,
    "ConsumerName"
  );
  assert.equal(displayName.deleteContextDisplayName.value.deleted, true);
  assert.equal(displayName.deleteConsumerDisplayName.value.deleted, true);

  const mutability = operationValue(
    "default-node-development",
    "context-mutability-and-slots"
  );
  assert.equal(mutability.assignCurrentValue.status, "ok");
  assert.deepEqual(mutability.assignCurrentValue.value.selectedValues.currentValue, {
    type: "string",
    value: "current-one"
  });
  assert.equal(mutability.assignThreadCount.value.selectedValues.threadCount.value, 7);
  assert.deepEqual(
    mutability.assignRendererSlots.value.selectedValues.currentRenderer,
    {
      type: "string",
      value: "renderer-one"
    }
  );
  assert.equal(mutability.defineExtra.value.defineResult, true);
  assert.equal(mutability.deleteSlots.value.deleteCurrentValue, true);
});

test("context-object oracle has no local path leaks", () => {
  assert.doesNotMatch(
    readCheckedContextObjectOracleText(),
    /\/private\/var|\/var\/folders|fast-react-context-oracle-[A-Za-z0-9]|\/tmp\/|Users\/user|Developer\/Developer/u
  );
});

test("context-object oracle print script reads the checked artifact", () => {
  assert.equal(
    execFileSync(
      process.execPath,
      ["scripts/print-context-object-oracle.mjs", "--format=json"],
      {
        cwd: new URL("..", import.meta.url),
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024
      }
    ),
    readCheckedContextObjectOracleText()
  );
});

function operationValue(modeId, scenarioId) {
  return reactObservation(modeId, scenarioId).result.result.value;
}

function reactObservation(modeId, scenarioId) {
  return findContextObjectObservation(
    oracle,
    modeId,
    CONTEXT_OBJECT_REACT_TARGET.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findContextObjectObservation(
    oracle,
    modeId,
    CONTEXT_OBJECT_FAST_REACT_TARGET.packageName,
    scenarioId
  );
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function descriptorFor(descriptors, key) {
  const descriptor = descriptors.find(
    (candidate) =>
      candidate.key.type === "string" && candidate.key.value === key
  );
  assert.ok(descriptor, `missing descriptor for ${key}`);
  return descriptor;
}

function keyValues(keys) {
  return keys.map((key) => {
    assert.equal(key.type, "string");
    return key.value;
  });
}

function caseByLabel(cases, label) {
  const found = cases.find((candidate) => candidate.label === label);
  assert.ok(found, `missing default-value case ${label}`);
  return found;
}

function assertContextShape(value, { ownKeys, hasRendererSlots }) {
  assert.equal(value.available, true);
  assert.deepEqual(keyValues(value.context.ownKeys), ownKeys);
  assert.deepEqual(value.context.objectKeys, ownKeys);
  assert.deepEqual(value.context.state, {
    frozen: false,
    sealed: false,
    extensible: true,
    objectTag: "[object Object]",
    prototype: {
      type: "Object.prototype"
    }
  });
  assert.equal(value.relationships.providerEqualsContext, true);
  assert.equal(value.relationships.consumerEqualsContext, false);
  assert.equal(value.relationships.consumerContextEqualsContext, true);
  assert.equal(value.relationships.currentValueEqualsDefault, true);
  assert.equal(value.relationships.currentValue2EqualsDefault, true);
  assert.equal(value.consumer.contextMatches, true);
  assert.deepEqual(keyValues(value.consumer.object.ownKeys), [
    "$$typeof",
    "_context"
  ]);
  assert.equal(value.selectedValues.threadCount.value, 0);

  if (hasRendererSlots) {
    assert.deepEqual(value.selectedValues.currentRenderer, { type: "null" });
    assert.deepEqual(value.selectedValues.currentRenderer2, { type: "null" });
  } else {
    assert.deepEqual(value.selectedValues.currentRenderer, { type: "missing" });
    assert.deepEqual(value.selectedValues.currentRenderer2, {
      type: "missing"
    });
  }

  for (const descriptor of value.context.descriptors) {
    assert.equal(descriptor.enumerable, true);
    assert.equal(descriptor.configurable, true);
    assert.equal(descriptor.kind, "data");
    assert.equal(descriptor.writable, true);
  }
}
