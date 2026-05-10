import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET,
  REACT_DOM_CLIENT_ROOT_ORACLE_ARTIFACT_PATH,
  REACT_DOM_CLIENT_ROOT_PROBE_MODES,
  REACT_DOM_CLIENT_ROOT_SUPPORTING_TARGETS,
  REACT_DOM_CLIENT_ROOT_TARGET
} from "../src/react-dom-client-root-targets.mjs";
import {
  REACT_DOM_CLIENT_ROOT_SCENARIO_IDS,
  REACT_DOM_CLIENT_ROOT_SCENARIOS
} from "../src/react-dom-client-root-scenarios.mjs";
import {
  findReactDomClientRootObservation,
  readCheckedReactDomClientRootOracle,
  readCheckedReactDomClientRootOracleText
} from "../src/react-dom-client-root-oracle.mjs";

const oracle = readCheckedReactDomClientRootOracle();

test("checked React DOM client-root oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_CLIENT_ROOT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-client-root-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-client-root-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs and local Fast React React DOM placeholder copied into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per target package, client-root scenario, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false,
    domEnvironment:
      "controlled minimal DOM shim with normalized React marker summaries"
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_CLIENT_ROOT_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_CLIENT_ROOT_SUPPORTING_TARGETS
  );
  assert.deepEqual(
    oracle.fastReactTarget,
    REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(
    oracle.packages["react-dom"].version,
    oracle.reactDomTarget.version
  );
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages["@fast-react/react-dom"].version, "0.0.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM client-root oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorCompared: true,
    fastReactComparedToReactDom: true,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, true);
  assert.equal(
    oracle.packages["@fast-react/react-dom"].behaviorCompatibilityClaimed,
    false
  );
});

test("React DOM client-root oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_CLIENT_ROOT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_DOM_CLIENT_ROOT_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "Entrypoint surface",
    "Container validation",
    "Development warnings",
    "Root options",
    "Root object",
    "Root render",
    "Root lifecycle",
    "Profiling entrypoint boundary"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of REACT_DOM_CLIENT_ROOT_PROBE_MODES) {
    assert.equal(
      oracle.reactDomObservations[mode.id].length,
      REACT_DOM_CLIENT_ROOT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactObservations[mode.id].length,
      REACT_DOM_CLIENT_ROOT_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactComparisons[mode.id].length,
      REACT_DOM_CLIENT_ROOT_SCENARIO_IDS.length
    );

    for (const scenarioId of REACT_DOM_CLIENT_ROOT_SCENARIO_IDS) {
      assert.equal(reactObservation(mode.id, scenarioId).scenarioId, scenarioId);
      assert.equal(
        fastReactObservation(mode.id, scenarioId).scenarioId,
        scenarioId
      );
    }
  }
});

test("React DOM client entrypoint and react-server throw behavior are recorded", () => {
  const clientShape = reactValue(
    "default-node-development",
    "client-entrypoint-shape"
  ).client;
  assert.equal(clientShape.status, "ok");
  assert.deepEqual(clientShape.value.exportKeys, [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.equal(descriptorFor(clientShape.value, "createRoot").value.length, 2);
  assert.equal(descriptorFor(clientShape.value, "hydrateRoot").value.length, 3);
  assert.deepEqual(descriptorFor(clientShape.value, "version").value, {
    type: "string",
    value: "19.2.6"
  });

  const reactServer = reactValue(
    "react-server-production",
    "client-entrypoint-shape"
  );
  assert.equal(reactServer.client.status, "throws");
  assert.equal(
    reactServer.client.thrown.message,
    "react-dom/client is not supported in React Server Components."
  );
  assert.equal(reactServer.profiling.status, "throws");
  assert.equal(
    reactServer.profiling.thrown.message,
    "react-dom/profiling is not supported in React Server Components."
  );
});

test("Fast React client-root placeholder keeps createRoot and hydrateRoot non-compatible", () => {
  const clientShape = fastReactValue(
    "default-node-development",
    "client-entrypoint-shape"
  ).client.value;
  assert.equal(descriptorFor(clientShape, "createRoot").value.length, 0);
  assert.equal(descriptorFor(clientShape, "hydrateRoot").value.length, 0);
  assert.deepEqual(descriptorFor(clientShape, "__FAST_REACT_PLACEHOLDER__").value, {
    type: "boolean",
    value: true
  });
  assert.deepEqual(descriptorFor(clientShape, "compatibilityTarget").value, {
    type: "string",
    value: "react-dom@19.2.6"
  });

  const comparison = oracle.fastReactComparisons[
    "default-node-development"
  ].find((candidate) => candidate.scenarioId === "client-entrypoint-shape");
  assert.equal(comparison.status, "known-mismatch");
  assert.equal(comparison.compatibilityClaimed, false);
  assert.notEqual(comparison.firstDifferencePath, null);
});

test("React DOM createRoot validates containers and records marker/listener boundaries", () => {
  const valid = reactValue(
    "default-node-development",
    "create-root-valid-containers"
  ).behavior;
  for (const kind of ["element", "document", "fragment"]) {
    assert.equal(valid[kind].createRoot.status, "ok", kind);
    assert.deepEqual(valid[kind].containerAfterCreate.markers, {
      reactContainerMarkerCount: 1,
      reactContainerMarkerValueKinds: ["object"],
      reactListeningMarkerCount: 1,
      reactListeningMarkerValueKinds: ["boolean:true"],
      legacyRootContainerValueKind: "absent"
    });
    assert.equal(valid[kind].containerAfterCreate.listeners.count, 138);
    assert.equal(valid[kind].containerAfterCreate.listeners.uniqueTypeCount, 85);
    assert.equal(valid[kind].unmount.status, "ok");
    assert.deepEqual(
      valid[kind].containerAfterUnmount.markers.reactContainerMarkerValueKinds,
      ["null"]
    );
  }
  assert.equal(
    valid.element.containerAfterCreate.ownerDocumentListeners.count,
    1
  );
  assert.equal(
    valid.fragment.containerAfterCreate.ownerDocumentListeners.count,
    1
  );
  assert.equal(valid.document.containerAfterCreate.ownerDocumentListeners, null);

  const invalid = reactValue(
    "default-node-development",
    "create-root-invalid-containers"
  ).behavior;
  for (const kind of ["null", "undefined", "text", "comment", "plainObject"]) {
    assert.equal(invalid[kind].status, "throws", kind);
    assert.equal(
      invalid[kind].thrown.message,
      "Target container is not a DOM element.",
      kind
    );
  }
});

test("React DOM development warnings for duplicate roots, options, and render arguments are captured", () => {
  const duplicate = reactValue(
    "default-node-development",
    "create-root-duplicate-warnings"
  ).behavior;
  assert.match(
    firstConsoleString(duplicate.duplicate.second),
    /already been passed to createRoot/u
  );
  assert.match(
    firstConsoleString(duplicate.legacy.second),
    /previously passed to ReactDOM\.render/u
  );
  assert.equal(duplicate.duplicate.second.status, "ok");
  assert.equal(duplicate.legacy.second.status, "ok");

  const optionWarnings = reactValue(
    "default-node-development",
    "create-root-option-warnings"
  ).behavior;
  assert.match(firstConsoleString(optionWarnings.hydrateOption), /deprecated/u);
  assert.match(firstConsoleString(optionWarnings.jsxOption), /JSX element/u);

  const renderWarnings = reactValue(
    "default-node-development",
    "root-render-second-argument-warnings"
  ).behavior;
  assert.equal(renderWarnings.oneArgument.status, "ok");
  assert.deepEqual(renderWarnings.oneArgument.value, {
    type: "undefined"
  });
  assert.equal(renderWarnings.oneArgument.consoleCalls.length, 0);
  assert.match(
    firstConsoleString(renderWarnings.callbackSecondArg),
    /second callback argument/u
  );
  assert.match(
    firstConsoleString(renderWarnings.containerSecondArg),
    /passed a container/u
  );
  assert.match(
    firstConsoleString(renderWarnings.genericSecondArg),
    /only accepts one argument/u
  );

  const productionWarnings = reactValue(
    "default-node-production",
    "root-render-second-argument-warnings"
  ).behavior;
  assert.equal(productionWarnings.callbackSecondArg.consoleCalls.length, 0);
  assert.equal(productionWarnings.containerSecondArg.consoleCalls.length, 0);
  assert.equal(productionWarnings.genericSecondArg.consoleCalls.length, 0);
});

test("React DOM createRoot option storage and stable gated-option omissions are recorded", () => {
  const storage = reactValue(
    "default-node-development",
    "create-root-options-stored"
  ).behavior.optionStorage;

  assert.equal(storage.identifierPrefix, "fast-react-root-");
  assert.equal(storage.tag, 1);
  assert.equal(storage.currentMode, 27);
  assert.equal(storage.callbacks.onUncaughtError.isExpectedInput, true);
  assert.equal(storage.callbacks.onCaughtError.isExpectedInput, true);
  assert.equal(storage.callbacks.onRecoverableError.isExpectedInput, true);
  assert.equal(
    storage.callbacks.onUncaughtError.actual.name,
    "onUncaughtError"
  );
  assert.deepEqual(storage.gatedOptionFields, {
    hasTransitionCallbacksField: false,
    transitionCallbacksType: "undefined",
    transitionCallbacksIsInput: false,
    hasOnDefaultTransitionIndicatorField: false,
    onDefaultTransitionIndicatorType: "undefined",
    onDefaultTransitionIndicatorIsInput: false
  });

  const productionStorage = reactValue(
    "default-node-production",
    "create-root-options-stored"
  ).behavior.optionStorage;
  assert.equal(productionStorage.identifierPrefix, "fast-react-root-");
  assert.equal(productionStorage.currentMode, 25);
});

test("React DOM root object render and unmount public lifecycle behavior is recorded", () => {
  const rootShape = reactValue(
    "default-node-development",
    "root-object-shape"
  ).behavior.createRoot.value;
  assert.deepEqual(rootShape.ownPropertyNames, ["_internalRoot"]);
  assert.equal(rootShape.descriptors[0].descriptor.enumerable, true);
  assert.equal(rootShape.prototype.constructorName, "ReactDOMRoot");
  assert.deepEqual(
    rootShape.prototype.descriptors.map((entry) => [
      entry.key.value,
      entry.descriptor.enumerable,
      entry.descriptor.value.name,
      entry.descriptor.value.length
    ]),
    [
      ["constructor", false, "ReactDOMRoot", 1],
      ["render", true, "", 1],
      ["unmount", true, "", 0]
    ]
  );

  const afterUnmount = reactValue(
    "default-node-development",
    "root-render-after-unmount"
  ).behavior;
  assert.equal(afterUnmount.unmount.status, "ok");
  assert.deepEqual(afterUnmount.rootAfterUnmount.descriptors[0].descriptor.value, {
    type: "null"
  });
  assert.equal(afterUnmount.renderAfterUnmount.status, "throws");
  assert.equal(
    afterUnmount.renderAfterUnmount.thrown.message,
    "Cannot update an unmounted root."
  );
  assert.deepEqual(
    afterUnmount.containerAfterUnmount.markers.reactContainerMarkerValueKinds,
    ["null"]
  );

  const unmount = reactValue(
    "default-node-development",
    "root-unmount-behavior"
  ).behavior;
  assert.match(firstConsoleString(unmount.callbackUnmount), /callback argument/u);
  assert.equal(unmount.callbackUnmount.status, "ok");
  assert.equal(unmount.secondUnmount.status, "ok");
  assert.deepEqual(unmount.rootAfterSecondUnmount.descriptors[0].descriptor.value, {
    type: "null"
  });
});

test("React DOM profiling createRoot boundary is covered", () => {
  const profiling = reactValue(
    "default-node-development",
    "profiling-create-root-boundary"
  );
  assert.equal(profiling.profiling.status, "ok");
  assert.ok(profiling.profiling.value.exportKeys.includes("createRoot"));
  assert.ok(profiling.profiling.value.exportKeys.includes("flushSync"));
  assert.equal(profiling.createRoot.status, "ok");
  assert.equal(profiling.containerAfterCreate.listeners.count, 138);
  assert.deepEqual(profiling.containerAfterCreate.markers, {
    reactContainerMarkerCount: 1,
    reactContainerMarkerValueKinds: ["object"],
    reactListeningMarkerCount: 1,
    reactListeningMarkerValueKinds: ["boolean:true"],
    legacyRootContainerValueKind: "absent"
  });
});

test("Fast React placeholder comparisons stay explicit and non-compatible", () => {
  const totalCounts = countFastReactComparisonStatuses(
    Object.values(oracle.fastReactComparisons).flat()
  );
  assert.deepEqual(totalCounts, {
    "known-mismatch": 2,
    "unexpected-match-compatibility-not-claimed": 0,
    "unsupported-placeholder": 42
  });

  for (const mode of REACT_DOM_CLIENT_ROOT_PROBE_MODES) {
    for (const comparison of oracle.fastReactComparisons[mode.id]) {
      assert.equal(comparison.compatibilityClaimed, false);
      assert.notEqual(comparison.firstDifferencePath, null);
    }
  }

  assert.deepEqual(
    countFastReactComparisonStatuses(
      oracle.fastReactComparisons["default-node-development"]
    ),
    {
      "known-mismatch": 1,
      "unexpected-match-compatibility-not-claimed": 0,
      "unsupported-placeholder": 10
    }
  );
});

test("React DOM client-root oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactDomClientRootOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-client-root-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print React DOM client-root oracle CLI emits the checked-in artifact", () => {
  const checkedText = readCheckedReactDomClientRootOracleText();
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-client-root-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: checkedText.length + 1024
    }
  );

  assert.equal(output, checkedText);
});

function reactObservation(modeId, scenarioId) {
  return findReactDomClientRootObservation(
    oracle,
    modeId,
    oracle.reactDomTarget.packageName,
    scenarioId
  );
}

function fastReactObservation(modeId, scenarioId) {
  return findReactDomClientRootObservation(
    oracle,
    modeId,
    oracle.fastReactTarget.packageName,
    scenarioId
  );
}

function reactValue(modeId, scenarioId) {
  const result = reactObservation(modeId, scenarioId).result.result;
  assert.equal(result.status, "ok", `${modeId}:${scenarioId} should be ok`);
  return result.value;
}

function fastReactValue(modeId, scenarioId) {
  const result = fastReactObservation(modeId, scenarioId).result.result;
  assert.equal(result.status, "ok", `${modeId}:${scenarioId} should be ok`);
  return result.value;
}

function descriptorFor(moduleShape, key) {
  const descriptor = moduleShape.descriptors.find(
    (candidate) =>
      candidate.key.type === "string" && candidate.key.value === key
  );
  assert.ok(descriptor, `missing descriptor ${key}`);
  return descriptor.descriptor;
}

function firstConsoleString(operation) {
  const firstArg = operation.consoleCalls[0]?.args[0];
  assert.equal(firstArg?.type, "string");
  return firstArg.value;
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
