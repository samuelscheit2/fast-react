import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  COMPONENT_CLASS_FAST_REACT_TARGET,
  COMPONENT_CLASS_ORACLE_ARTIFACT_PATH,
  COMPONENT_CLASS_PROBE_MODES,
  COMPONENT_CLASS_REACT_TARGET
} from "../src/component-class-targets.mjs";
import {
  COMPONENT_CLASS_SCENARIO_IDS,
  COMPONENT_CLASS_SCENARIOS
} from "../src/component-class-scenarios.mjs";
import {
  findComponentClassObservation,
  readCheckedComponentClassOracle,
  readCheckedComponentClassOracleText
} from "../src/component-class-oracle.mjs";

const oracle = readCheckedComponentClassOracle();

test("checked component-class oracle artifact has the expected schema and targets", () => {
  assert.equal(
    COMPONENT_CLASS_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-component-class-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-component-class-oracle");
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

  assert.deepEqual(oracle.reactTarget, COMPONENT_CLASS_REACT_TARGET);
  assert.deepEqual(oracle.fastReactTarget, COMPONENT_CLASS_FAST_REACT_TARGET);
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.react.tarball.integrityVerified, true);
  assert.ok(oracle.packages.react.tarball.fileCount > 0);
});

test("component-class oracle keeps Fast React compatibility claims false", () => {
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
    beforeWorker029: {
      source:
        "packages/react/index.js exported throwing Component and PureComponent placeholder classes, while packages/react/react.react-server.js already omitted both exports before this worker slice",
      generatedProbe: false,
      statusCounts: {
        "matched-but-compatibility-not-claimed": 14,
        "known-mismatch": 2,
        "unsupported-placeholder": 12
      },
      compatibilityClaimed: false
    },
    afterWorker029: {
      source: "generated fastReactComparisons in this oracle artifact",
      generatedProbe: true,
      statusCounts: {
        "matched-but-compatibility-not-claimed": 28
      },
      compatibilityClaimed: false
    }
  });
});

test("component-class oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, COMPONENT_CLASS_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, COMPONENT_CLASS_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "Component and PureComponent exports",
    "Component and PureComponent prototypes",
    "Component and PureComponent construction",
    "Component and PureComponent direct invocation",
    "Component and PureComponent custom updater forwarding",
    "Component and PureComponent default no-op updater",
    "Component deprecated accessors"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of COMPONENT_CLASS_PROBE_MODES) {
    assert.equal(
      oracle.reactObservations[mode.id].length,
      COMPONENT_CLASS_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      COMPONENT_CLASS_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      COMPONENT_CLASS_SCENARIO_IDS.length
    );

    for (const scenarioId of COMPONENT_CLASS_SCENARIO_IDS) {
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

test("React oracle captures default-root exports and react-server absence", () => {
  const exportShape = operationValue(
    "default-node-development",
    "component-class-export-shape"
  );
  assert.equal(exportShape.component.hasOwn, true);
  assert.equal(exportShape.pureComponent.hasOwn, true);
  assert.deepEqual(dataDescriptorFields(exportShape.component.descriptor), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(exportShape.component.descriptor.value, {
    type: "function",
    name: "Component",
    length: 3,
    isReactWarning: false
  });
  assert.deepEqual(exportShape.pureComponent.descriptor.value, {
    type: "function",
    name: "PureComponent",
    length: 3,
    isReactWarning: false
  });
  assert.deepEqual(keyValues(exportShape.component.functionObject.ownKeys), [
    "length",
    "name",
    "prototype"
  ]);

  for (const modeId of [
    "react-server-development",
    "react-server-production"
  ]) {
    const serverExport = operationValue(
      modeId,
      "component-class-export-shape"
    );
    assert.equal(serverExport.component.hasOwn, false, modeId);
    assert.equal(serverExport.pureComponent.hasOwn, false, modeId);
    assert.equal(serverExport.componentInReact, false, modeId);
    assert.equal(serverExport.pureComponentInReact, false, modeId);
    assert.deepEqual(serverExport.filteredExportKeys, [], modeId);
    assert.equal(serverExport.absentConstruction.status, "throws", modeId);
    assert.equal(serverExport.absentConstruction.error.name, "TypeError", modeId);
    assert.equal(serverExport.absentCall.status, "throws", modeId);
    assert.equal(serverExport.absentCall.error.name, "TypeError", modeId);
  }
});

test("React oracle captures prototype descriptors and inheritance", () => {
  const development = operationValue(
    "default-node-development",
    "component-class-prototype-shape"
  );
  assert.deepEqual(keyValues(development.componentPrototype.ownKeys), [
    "constructor",
    "isReactComponent",
    "setState",
    "forceUpdate",
    "isMounted",
    "replaceState"
  ]);
  assert.deepEqual(development.componentPrototype.objectKeys, [
    "isReactComponent",
    "setState",
    "forceUpdate"
  ]);
  assert.deepEqual(
    descriptorFor(development.componentPrototype.descriptors, "setState").value,
    {
      type: "function",
      name: "",
      length: 2,
      isReactWarning: false
    }
  );
  assert.deepEqual(
    descriptorFor(development.componentPrototype.descriptors, "forceUpdate")
      .value,
    {
      type: "function",
      name: "",
      length: 1,
      isReactWarning: false
    }
  );
  assert.equal(
    descriptorFor(development.componentPrototype.descriptors, "isMounted").kind,
    "accessor"
  );
  assert.equal(
    descriptorFor(development.componentPrototype.descriptors, "isMounted")
      .configurable,
    false
  );
  assert.deepEqual(development.pureComponentPrototype.objectKeys, [
    "constructor",
    "isReactComponent",
    "setState",
    "forceUpdate",
    "isPureReactComponent"
  ]);
  assert.equal(
    descriptorFor(development.pureComponentPrototype.descriptors, "constructor")
      .enumerable,
    true
  );
  assert.equal(
    descriptorFor(
      development.pureComponentPrototype.descriptors,
      "isPureReactComponent"
    ).value.value,
    true
  );
  assert.equal(
    development.relationships.purePrototypePrototypeIsComponentPrototype,
    true
  );
  assert.equal(development.relationships.pureSetStateSame, true);
  assert.equal(development.relationships.pureForceUpdateSame, true);
  assert.equal(development.relationships.pureIsReactComponentSame, true);

  const production = operationValue(
    "default-node-production",
    "component-class-prototype-shape"
  );
  assert.deepEqual(keyValues(production.componentPrototype.ownKeys), [
    "constructor",
    "isReactComponent",
    "setState",
    "forceUpdate"
  ]);
});

test("React oracle captures construction, refs, and default updater differences", () => {
  const development = operationValue(
    "default-node-development",
    "component-class-construction"
  );
  assertInstanceShape(development.component, {
    prototype: "React.Component.prototype",
    instanceOfComponent: true,
    instanceOfPureComponent: false
  });
  assertInstanceShape(development.pureComponent, {
    prototype: "React.PureComponent.prototype",
    instanceOfComponent: true,
    instanceOfPureComponent: true
  });
  assert.equal(development.component.relationships.propsMatchesExpected, true);
  assert.equal(development.component.relationships.contextMatchesExpected, true);
  assert.equal(development.component.relationships.updaterMatchesExpected, true);
  assert.equal(development.sharedIdentity.allRefsSame, true);
  assert.equal(development.sharedIdentity.defaultUpdaterSame, true);
  assert.equal(development.sharedIdentity.customUpdaterPreserved, true);
  assert.deepEqual(refsState(development), {
    frozen: true,
    sealed: true,
    extensible: false
  });
  assert.equal(development.refsMutability.reflectSetExtra.value.setResult, false);
  assert.equal(development.refsMutability.reflectDefineExtra.value.defineResult, false);
  assert.equal(development.refsMutability.objectDefineExtra.status, "throws");
  assert.deepEqual(defaultUpdaterMethodLengths(development), {
    isMounted: 0,
    enqueueForceUpdate: 1,
    enqueueReplaceState: 1,
    enqueueSetState: 1
  });

  const production = operationValue(
    "default-node-production",
    "component-class-construction"
  );
  assert.deepEqual(refsState(production), {
    frozen: false,
    sealed: false,
    extensible: true
  });
  assert.equal(production.refsMutability.reflectSetExtra.value.setResult, true);
  assert.equal(
    production.refsMutability.reflectDefineExtra.value.defineResult,
    true
  );
  assert.equal(production.refsMutability.objectDefineExtra.status, "ok");
  assert.deepEqual(defaultUpdaterMethodLengths(production), {
    isMounted: 0,
    enqueueForceUpdate: 0,
    enqueueReplaceState: 0,
    enqueueSetState: 0
  });
});

test("React oracle captures invocation, custom updater, no-op updater, and deprecated accessors", () => {
  const invocation = operationValue(
    "default-node-development",
    "component-class-invocation"
  );
  assert.equal(invocation.variableComponentCall.status, "throws");
  assert.equal(invocation.variableComponentCall.error.name, "TypeError");
  assert.equal(invocation.componentCallObject.status, "ok");
  assert.equal(
    invocation.componentCallObject.value.selectedValues.props.value,
    "call-props"
  );
  assert.equal(
    invocation.componentCallObject.value.relationships.prototypeStillObject,
    true
  );
  assert.equal(invocation.pureApplyObject.status, "ok");
  assert.equal(invocation.boundComponentCall.status, "ok");
  assert.equal(
    invocation.boundComponentCall.value.boundFunction.name,
    "bound Component"
  );
  assert.equal(invocation.boundComponentConstructor.status, "ok");
  assert.equal(
    invocation.boundComponentConstructor.value.instance.relationships
      .instanceOfComponent,
    true
  );
  assert.equal(
    invocation.boundComponentConstructor.value.instanceOfBoundComponent,
    true
  );

  const customUpdater = operationValue(
    "default-node-development",
    "component-class-custom-updater"
  );
  assert.equal(customUpdater.callbackCallCount, 0);
  assert.equal(customUpdater.updaterIdentityPreserved, true);
  assert.deepEqual(
    customUpdater.updaterCalls.map((call) => call.method),
    [
      "enqueueSetState",
      "enqueueForceUpdate",
      "enqueueSetState",
      "enqueueForceUpdate"
    ]
  );
  assert.deepEqual(
    customUpdater.updaterCalls[0].args.map((arg) => arg.value),
    ["component", "partialState", "callback", "setState"]
  );

  const noopDevelopment = operationValue(
    "default-node-development",
    "component-class-noop-updater"
  );
  assert.equal(noopDevelopment.defaultUpdaterIsMounted.value.value, false);
  assert.equal(noopDevelopment.setStateObject.status, "ok");
  assert.equal(noopDevelopment.setStateObject.consoleCalls.length, 1);
  assert.deepEqual(noopDevelopment.setStateObject.consoleCalls[0].args.slice(1), [
    { type: "string", value: "setState" },
    { type: "string", value: "Component" }
  ]);
  assert.deepEqual(noopDevelopment.setStateFunction.consoleCalls, []);
  assert.equal(noopDevelopment.forceUpdate.consoleCalls.length, 1);
  assert.deepEqual(noopDevelopment.dedupeSameComponent.consoleCalls, []);
  assert.deepEqual(
    noopDevelopment.pureComponentWarnings.consoleCalls.map((call) =>
      call.args.slice(1).map((arg) => arg.value)
    ),
    [
      ["setState", "PureComponent"],
      ["forceUpdate", "PureComponent"]
    ]
  );
  assert.equal(noopDevelopment.callbackCallCount, 0);
  assert.equal(noopDevelopment.invalidSetState.string.status, "throws");
  assert.equal(noopDevelopment.invalidSetState.string.error.name, "Error");

  const noopProduction = operationValue(
    "default-node-production",
    "component-class-noop-updater"
  );
  assert.deepEqual(noopProduction.setStateObject.consoleCalls, []);
  assert.deepEqual(noopProduction.forceUpdate.consoleCalls, []);
  assert.deepEqual(noopProduction.pureComponentWarnings.consoleCalls, []);

  const deprecated = operationValue(
    "default-node-development",
    "component-class-deprecated-accessors"
  );
  assert.equal(deprecated.componentDescriptors.isMounted.kind, "accessor");
  assert.equal(deprecated.pureOwnDescriptors.isMounted, null);
  assert.equal(deprecated.componentIsMountedAccess.consoleCalls[0].method, "warn");
  assert.equal(
    deprecated.componentReplaceStateAccess.consoleCalls[0].args[1].value,
    "replaceState"
  );

  const productionDeprecated = operationValue(
    "default-node-production",
    "component-class-deprecated-accessors"
  );
  assert.equal(productionDeprecated.componentDescriptors.isMounted, null);
  assert.deepEqual(productionDeprecated.componentIsMountedAccess.consoleCalls, []);
});

test("component-class oracle records exact Fast React matches without compatibility claims", () => {
  const counts = {};
  for (const comparisons of Object.values(oracle.fastReactComparisons)) {
    for (const comparison of comparisons) {
      counts[comparison.status] = (counts[comparison.status] ?? 0) + 1;
      assert.equal(comparison.compatibilityClaimed, false);
      assert.equal(comparison.firstDifferencePath, null);
    }
  }

  assert.deepEqual(counts, {
    "matched-but-compatibility-not-claimed": 28
  });
});

test("component-class oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedComponentClassOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|fast-react-component-oracle-[A-Za-z0-9]|\/tmp\/|Users\/user|Developer\/Developer/u.test(
      text
    ),
    false
  );
});

test("component-class oracle print script reads the checked artifact", () => {
  const printed = execFileSync(
    process.execPath,
    ["scripts/print-component-class-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );
  assert.deepEqual(JSON.parse(printed), oracle);
});

function reactObservation(modeId, scenarioId) {
  return findComponentClassObservation(
    oracle,
    modeId,
    COMPONENT_CLASS_REACT_TARGET.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findComponentClassObservation(
    oracle,
    modeId,
    COMPONENT_CLASS_FAST_REACT_TARGET.packageName,
    scenarioId
  );
}

function operationValue(modeId, scenarioId) {
  const observation = reactObservation(modeId, scenarioId);
  assert.equal(observation.result.result.status, "ok");
  return observation.result.result.value;
}

function dataDescriptorFields(descriptor) {
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function keyValues(keys) {
  return keys.map((key) => {
    assert.equal(key.type, "string");
    return key.value;
  });
}

function descriptorFor(descriptors, key) {
  const descriptor = descriptors.find(
    (candidate) => candidate.key.type === "string" && candidate.key.value === key
  );
  assert.ok(descriptor, `missing descriptor ${key}`);
  return descriptor;
}

function assertInstanceShape(instance, expected) {
  assert.deepEqual(instance.object.objectKeys, [
    "props",
    "context",
    "refs",
    "updater"
  ]);
  assert.equal(
    instance.object.state.prototype.type,
    expected.prototype
  );
  assert.equal(
    instance.relationships.instanceOfComponent,
    expected.instanceOfComponent
  );
  assert.equal(
    instance.relationships.instanceOfPureComponent,
    expected.instanceOfPureComponent
  );
}

function refsState(construction) {
  return {
    frozen: construction.refsObject.state.frozen,
    sealed: construction.refsObject.state.sealed,
    extensible: construction.refsObject.state.extensible
  };
}

function defaultUpdaterMethodLengths(construction) {
  const descriptors = construction.defaultUpdater.descriptors;
  return Object.fromEntries(
    ["isMounted", "enqueueForceUpdate", "enqueueReplaceState", "enqueueSetState"].map(
      (key) => [key, descriptorFor(descriptors, key).value.length]
    )
  );
}
