import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_PORTAL_ORACLE_ARTIFACT_PATH,
  REACT_DOM_PORTAL_PROBE_MODES,
  REACT_DOM_PORTAL_SUPPORTING_TARGETS,
  REACT_DOM_PORTAL_TARGET
} from "../src/react-dom-portal-targets.mjs";
import {
  REACT_DOM_PORTAL_SCENARIO_IDS,
  REACT_DOM_PORTAL_SCENARIOS
} from "../src/react-dom-portal-scenarios.mjs";
import {
  findReactDomPortalObservation,
  readCheckedReactDomPortalOracle,
  readCheckedReactDomPortalOracleText
} from "../src/react-dom-portal-oracle.mjs";

const oracle = readCheckedReactDomPortalOracle();

test("checked React DOM portal oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_PORTAL_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-portal-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-portal-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per createPortal scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary roots, package roots, file URLs, and local workspace paths are normalized before artifact serialization"
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_PORTAL_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_PORTAL_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM portal oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.evidenceClaims.createPortalExportDescriptorsProbed, true);
  assert.equal(oracle.evidenceClaims.validContainerBehaviorProbed, true);
  assert.equal(oracle.evidenceClaims.invalidContainerBehaviorProbed, true);
  assert.equal(oracle.evidenceClaims.keyHandlingProbed, true);
  assert.equal(oracle.evidenceClaims.portalObjectShapeProbed, true);
  assert.equal(oracle.evidenceClaims.unsupportedContextBoundariesProbed, true);
  assert.equal(
    oracle.evidenceClaims.deterministicPathNormalizationApplied,
    true
  );
});

test("React DOM portal oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_PORTAL_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_DOM_PORTAL_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "exports",
    "container validation",
    "keys",
    "object shape",
    "invocation"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of REACT_DOM_PORTAL_PROBE_MODES) {
    const observations = oracle.portalBehaviorObservations[mode.id];
    assert.equal(observations.length, REACT_DOM_PORTAL_SCENARIO_IDS.length);

    for (const scenarioId of REACT_DOM_PORTAL_SCENARIO_IDS) {
      const observation = findReactDomPortalObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.packageName, "react-dom");
      assert.equal(observation.result.targetPackage, "react-dom");
      assert.equal(observation.result.scenarioId, scenarioId);
      assert.equal(observation.result.result.status, "ok");
    }
  }
});

test("React DOM portal oracle captures root and unsupported-context export descriptors", () => {
  const defaultExports = scenarioValue(
    "default-node-development",
    "portal-export-descriptors"
  );

  assert.equal(defaultExports.root.status, "ok");
  assert.equal(defaultExports.root.value.createPortalInModule, true);
  assert.deepEqual(
    dataDescriptorFields(defaultExports.root.value.createPortalDescriptor),
    {
      configurable: true,
      enumerable: true,
      writable: true
    }
  );
  assert.deepEqual(defaultExports.root.value.createPortalDescriptor.value, {
    type: "function",
    name: "",
    length: 2,
    isAsync: false,
    ownPropertyNames: ["length", "name", "prototype"],
    hasOwnPrototype: true
  });
  assert.deepEqual(defaultExports.root.value.versionDescriptor.value, {
    type: "string",
    value: "19.2.6"
  });

  assert.equal(defaultExports.profiling.status, "ok");
  assert.equal(defaultExports.profiling.value.createPortalInModule, true);
  assert.equal(defaultExports.client.status, "ok");
  assert.equal(defaultExports.client.value.createPortalInModule, false);
  assert.equal(defaultExports.client.value.createPortalDescriptor, null);

  const serverExports = scenarioValue(
    "react-server-development",
    "portal-export-descriptors"
  );
  assert.equal(serverExports.root.status, "ok");
  assert.equal(serverExports.root.value.createPortalInModule, false);
  assert.equal(serverExports.root.value.createPortalDescriptor, null);
  assert.equal(serverExports.profiling.status, "throws");
  assert.equal(
    serverExports.profiling.message,
    "react-dom/profiling is not supported in React Server Components."
  );
  assert.equal(serverExports.client.status, "throws");
  assert.equal(
    serverExports.client.message,
    "react-dom/client is not supported in React Server Components."
  );
});

test("React DOM portal oracle captures accepted and rejected containers", () => {
  const valid = scenarioValue(
    "default-node-development",
    "portal-valid-containers"
  );

  assertAcceptedContainer(valid.element, 1, "element-key");
  assertAcceptedContainer(valid.document, 9, "document-key");
  assertAcceptedContainer(valid.documentFragment, 11, "fragment-key");

  const invalid = scenarioValue(
    "default-node-development",
    "portal-invalid-containers"
  );
  for (const [caseId, result] of Object.entries(invalid)) {
    assert.equal(result.status, "throws", caseId);
    assert.equal(result.name, "Error", caseId);
    assert.equal(result.code, null, caseId);
    assert.equal(result.message, "Target container is not a DOM element.");
  }
});

test("React DOM portal oracle captures key coercion and Symbol key behavior", () => {
  const development = portalKeyHandling("default-node-development");
  assert.deepEqual(portalKey(development.operations.omitted), { type: "null" });
  assert.deepEqual(portalKey(development.operations.undefined), {
    type: "null"
  });
  assert.deepEqual(portalKey(development.operations.null), { type: "null" });
  assert.deepEqual(portalKey(development.operations.emptyString), {
    type: "string",
    value: ""
  });
  assert.deepEqual(portalKey(development.operations.string), {
    type: "string",
    value: "portal-key"
  });
  assert.deepEqual(portalKey(development.operations.number), {
    type: "string",
    value: "12"
  });
  assert.deepEqual(portalKey(development.operations.booleanTrue), {
    type: "string",
    value: "true"
  });
  assert.deepEqual(portalKey(development.operations.booleanFalse), {
    type: "string",
    value: "false"
  });
  assert.deepEqual(portalKey(development.operations.bigint), {
    type: "string",
    value: "10"
  });
  assert.deepEqual(portalKey(development.operations.objectToString), {
    type: "string",
    value: "object-key"
  });
  assert.equal(development.objectKeyToStringCalls, 2);
  assert.equal(development.operations.symbol.status, "throws");
  assert.equal(development.operations.symbol.name, "TypeError");
  assert.equal(
    development.operations.symbol.message,
    "Cannot convert a Symbol value to a string"
  );

  const developmentObservation = observation(
    "default-node-development",
    "portal-key-handling"
  );
  assert.deepEqual(developmentObservation.result.consoleCalls, [
    {
      method: "error",
      args: [
        {
          type: "string",
          value:
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here."
        },
        {
          type: "string",
          value: "Symbol"
        }
      ]
    }
  ]);

  const production = portalKeyHandling("default-node-production");
  assert.equal(production.objectKeyToStringCalls, 1);
  assert.equal(production.operations.symbol.status, "throws");
  assert.deepEqual(
    observation("default-node-production", "portal-key-handling").result
      .consoleCalls,
    []
  );
});

test("React DOM portal oracle captures portal object shape and mutability", () => {
  const shape = scenarioValue(
    "default-node-development",
    "portal-object-shape"
  );
  assertPortalShape(shape.before, "shape-key");
  assert.deepEqual(shape.reactIsValidElement, {
    type: "boolean",
    value: false
  });

  assert.equal(shape.mutations.assignKey.status, "ok");
  assert.deepEqual(shape.mutations.assignKey.value.selectedValues.key, {
    type: "string",
    value: "mutated-key"
  });
  assert.equal(shape.mutations.addExtra.status, "ok");
  assert.deepEqual(keyValues(shape.mutations.addExtra.value.object.ownKeys), [
    "$$typeof",
    "key",
    "children",
    "containerInfo",
    "implementation",
    "extra"
  ]);
  assert.equal(shape.mutations.deleteImplementation.status, "ok");
  assert.equal(shape.mutations.deleteImplementation.value.deleted, true);
  assert.deepEqual(
    shape.mutations.deleteImplementation.value.portal.selectedValues
      .implementation,
    {
      type: "undefined"
    }
  );
  assert.equal(
    shape.mutations.deleteImplementation.value.portal.relationships
      .implementationIsNull,
    false
  );
});

test("React DOM portal oracle captures invocation and react-server boundaries", () => {
  const invocation = scenarioValue(
    "default-node-development",
    "portal-invocation-boundaries"
  );
  for (const [key, expectedKey] of [
    ["callNullThis", "call-key"],
    ["applyReceiver", "apply-key"],
    ["extraArgument", "extra-key"],
    ["constructorInvocation", "new-key"]
  ]) {
    assert.equal(invocation[key].status, "ok", key);
    assertPortalShape(invocation[key].value, expectedKey);
  }

  const serverBoundary = scenarioValue(
    "react-server-production",
    "portal-invocation-boundaries"
  );
  assert.equal(serverBoundary.unavailable, true);
  assert.equal(serverBoundary.exportShape.createPortalInModule, false);
  assert.equal(serverBoundary.directCall.status, "throws");
  assert.equal(serverBoundary.directCall.name, "TypeError");
  assert.equal(
    serverBoundary.directCall.message,
    "rootModule.createPortal is not a function"
  );
});

test("React DOM portal oracle artifact has no temp or local path leaks", () => {
  const oracleText = readCheckedReactDomPortalOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-portal-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print React DOM portal oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-portal-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedReactDomPortalOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedReactDomPortalOracleText());
});

function observation(modeId, scenarioId) {
  return findReactDomPortalObservation(oracle, modeId, scenarioId);
}

function scenarioValue(modeId, scenarioId) {
  return observation(modeId, scenarioId).result.result.value;
}

function portalKeyHandling(modeId) {
  return scenarioValue(modeId, "portal-key-handling");
}

function portalKey(operation) {
  assert.equal(operation.status, "ok");
  return operation.value.selectedValues.key;
}

function assertAcceptedContainer(operation, nodeType, expectedKey) {
  assert.equal(operation.status, "ok");
  assertPortalShape(operation.value, expectedKey);
  assert.equal(operation.value.selectedValues.containerInfo.nodeType.value, nodeType);
  assert.equal(operation.value.relationships.containerInfoSameAsInput, true);
}

function assertPortalShape(portal, expectedKey) {
  assert.deepEqual(portal.brand, {
    type: "symbol",
    keyFor: "react.portal",
    description: "react.portal",
    stringValue: "Symbol(react.portal)"
  });
  assert.deepEqual(keyValues(portal.object.ownKeys), [
    "$$typeof",
    "key",
    "children",
    "containerInfo",
    "implementation"
  ]);
  assert.deepEqual(portal.object.state, {
    extensible: true,
    sealed: false,
    frozen: false
  });
  for (const key of [
    "$$typeof",
    "key",
    "children",
    "containerInfo",
    "implementation"
  ]) {
    assert.deepEqual(dataDescriptorFields(descriptorFor(portal.object, key)), {
      configurable: true,
      enumerable: true,
      writable: true
    });
  }
  assert.deepEqual(portal.selectedValues.key, {
    type: "string",
    value: expectedKey
  });
  assert.equal(portal.relationships.childrenSameAsInput, true);
  assert.equal(portal.relationships.containerInfoSameAsInput, true);
  assert.equal(portal.relationships.implementationIsNull, true);
  assert.deepEqual(portal.selectedValues.implementation, {
    type: "null"
  });
}

function descriptorFor(objectShape, key) {
  const match = objectShape.descriptors.find(
    (entry) => entry.key.type === "string" && entry.key.value === key
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

function keyValues(keys) {
  return keys.map((key) => {
    assert.equal(key.type, "string");
    return key.value;
  });
}
