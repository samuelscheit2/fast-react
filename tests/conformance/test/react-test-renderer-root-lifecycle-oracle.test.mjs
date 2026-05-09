import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  findReactTestRendererRootLifecycleObservation,
  readCheckedReactTestRendererRootLifecycleOracle,
  readCheckedReactTestRendererRootLifecycleOracleText
} from "../src/react-test-renderer-root-lifecycle-oracle.mjs";
import {
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_ORACLE_ARTIFACT_PATH,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_PROBE_MODES,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_RUNTIME_INVENTORY_PATH,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET
} from "../src/react-test-renderer-root-lifecycle-targets.mjs";
import {
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIO_IDS,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIOS
} from "../src/react-test-renderer-root-lifecycle-scenarios.mjs";

const oracle = readCheckedReactTestRendererRootLifecycleOracle();

test("checked React Test Renderer root lifecycle oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_TEST_RENDERER_ROOT_LIFECYCLE_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-test-renderer-root-lifecycle-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-test-renderer-root-lifecycle-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact react-test-renderer npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per react-test-renderer root lifecycle scenario and mode",
    probeTimeoutMs: 15000,
    generatedTimestampIncluded: false,
    pathNormalization:
      "temporary extraction roots and local workspace paths are normalized before artifact write"
  });

  assert.deepEqual(
    oracle.reactTestRendererTarget,
    REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET
  );
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_TEST_RENDERER_ROOT_LIFECYCLE_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-test-renderer"].version, "19.2.6");
  assert.equal(oracle.packages["react-test-renderer"].tarball.fileCount, 7);
  assert.equal(oracle.packages["react-test-renderer"].packageJson.main, "index.js");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages["react-is"].version, "19.2.6");
  assert.equal(oracle.packages["react-is"].tarball.fileCount, 6);
  assert.equal(oracle.sourceInventory.path, REACT_TEST_RENDERER_ROOT_LIFECYCLE_RUNTIME_INVENTORY_PATH);
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React Test Renderer root lifecycle oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactTestRendererBehaviorProbed: true,
    fastReactComparedToReactTestRenderer: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.privateReactTestRendererInternalsRead, false);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-fast-react-react-test-renderer-comparison"
    ),
    true
  );
  assert.deepEqual(oracle.coverage, {
    moduleExportShape: true,
    createRawActBoundary: true,
    createUpdateUnmountFlow: true,
    rootAccessBoundaries: true,
    getInstanceBoundaries: true,
    createNodeMockRefLifecycle: true,
    strictModeOption: true,
    concurrentOption: true,
    reactNativeTestEnvironmentBranch: true,
    postUnmountErrors: true,
    developmentAndProductionModes: true,
    privateInternalsAvoided: true
  });
});

test("React Test Renderer root lifecycle oracle covers every scenario in every mode", () => {
  assert.deepEqual(
    oracle.probeModes,
    REACT_TEST_RENDERER_ROOT_LIFECYCLE_PROBE_MODES
  );
  assert.deepEqual(oracle.scenarios, REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIOS);

  for (const mode of REACT_TEST_RENDERER_ROOT_LIFECYCLE_PROBE_MODES) {
    const observations = oracle.rootLifecycleObservations[mode.id];
    assert.equal(observations.length, REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIO_IDS.length);

    for (const scenarioId of REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIO_IDS) {
      const item = observation(mode.id, scenarioId);
      assert.equal(item.scenarioId, scenarioId);
      assert.equal(item.packageName, "react-test-renderer");
      assert.equal(item.nodeEnv, mode.nodeEnv);
      assert.equal(item.condition, mode.condition);
      assert.equal(item.result.status, "ok", `${mode.id}:${scenarioId}`);
    }
  }
});

test("root module and renderer object shapes match React Test Renderer 19.2.6", () => {
  const dev = scenarioValue("default-node-development", "renderer-object-shape");
  assert.deepEqual(dev.moduleShape.object.objectKeys, [
    "_Scheduler",
    "act",
    "create",
    "unstable_batchedUpdates",
    "version"
  ]);
  assertFunctionDescriptor(dev.moduleShape.exports.create, { length: 2 });
  assertFunctionDescriptor(dev.moduleShape.exports.act, { length: 1 });
  assert.deepEqual(dev.moduleShape.exports.version.value, {
    type: "string",
    value: "19.2.6"
  });

  assert.deepEqual(dev.renderer.object.objectKeys, [
    "_Scheduler",
    "root",
    "toJSON",
    "toTree",
    "update",
    "unmount",
    "getInstance",
    "unstable_flushSync"
  ]);
  const descriptors = descriptorMap(dev.renderer.object.descriptors);
  assert.equal(descriptors.root.kind, "accessor");
  assert.equal(descriptors.root.get.length, 0);
  assert.equal(descriptors.toJSON.value.length, 0);
  assert.equal(descriptors.toTree.value.length, 0);
  assert.equal(descriptors.update.value.length, 1);
  assert.equal(descriptors.unmount.value.length, 0);
  assert.equal(descriptors.getInstance.value.length, 0);
  assert.equal(descriptors.unstable_flushSync.value.length, 1);

  const prod = scenarioValue("default-node-production", "renderer-object-shape");
  assert.deepEqual(prod.actAvailability, {
    reactAct: { type: "undefined" },
    testRendererAct: { type: "undefined" }
  });
});

test("development create(), update(), unmount(), and post-unmount behavior are recorded", () => {
  const raw = scenarioValue("default-node-development", "raw-create-act-boundary");
  assert.equal(raw.beforeAct.root.status, "throws");
  assert.equal(raw.beforeAct.root.message, "Can't access .root on unmounted test renderer");
  assert.equal(raw.emptyActFlush.value.usedAct, true);
  assert.equal(raw.afterEmptyAct.root.status, "ok");
  assert.equal(raw.afterEmptyAct.toJSON.value.props.id.value, "raw");

  const flow = scenarioValue(
    "default-node-development",
    "create-update-unmount-flow"
  );
  assert.equal(flow.create.value.usedAct, true);
  assert.equal(flow.afterCreate.toJSON.value.type.value, "root-leaf");
  assert.equal(flow.afterCreate.toJSON.value.props.id.value, "created");
  assert.equal(flow.afterUpdate.toJSON.value.props.id.value, "updated");
  assert.deepEqual(flow.afterUnmount.toJSON.value, { type: "null" });
  assert.equal(flow.afterUnmount.root.status, "throws");
  assert.equal(
    flow.afterUnmount.root.message,
    "Can't access .root on unmounted test renderer"
  );
  assert.equal(flow.afterUnmount.getInstance.value.type, "null");
  assert.deepEqual(flow.afterUnmount.update, {
    label: "update after unmount",
    status: "ok",
    value: "returned"
  });
  assert.deepEqual(flow.afterUnmount.unmountAgain, {
    label: "unmount again",
    status: "ok",
    value: "returned"
  });
});

test(".root and getInstance boundaries distinguish empty, multi-child, host, function, and class roots", () => {
  const roots = scenarioValue(
    "default-node-development",
    "root-access-boundaries"
  );
  assert.equal(roots.nullRoot.root.status, "throws");
  assert.equal(roots.nullRoot.getInstance.value.type, "null");
  assert.equal(roots.arrayRoot.root.status, "ok");
  assert.deepEqual(roots.arrayRoot.root.value.type, { type: "null" });
  assert.deepEqual(
    roots.arrayRoot.root.value.children.map((child) => child.type.value),
    ["first-root", "second-root"]
  );
  assert.equal(roots.fragmentRoot.root.status, "ok");
  assert.deepEqual(roots.fragmentRoot.root.value.type, { type: "null" });
  assert.deepEqual(
    roots.fragmentRoot.root.value.children.map((child) => child.type.value),
    ["first-fragment-root", "second-fragment-root"]
  );

  const instances = scenarioValue(
    "default-node-development",
    "get-instance-boundaries"
  );
  assert.deepEqual(instances.hostRoot.getInstance.value, { type: "null" });
  assert.deepEqual(instances.functionRoot.getInstance.value, { type: "null" });
  assert.equal(instances.classRoot.getInstance.value.constructorName, "RootClass");
  assert.deepEqual(instances.classRoot.getInstance.value.props, {
    label: {
      type: "string",
      value: "class-root"
    }
  });
  assert.deepEqual(instances.classRoot.getInstance.value.state, {
    marker: {
      type: "string",
      value: "initial-state"
    }
  });
});

test("createNodeMock, strict mode, concurrent option, and production act absence are recorded", () => {
  const mock = scenarioValue(
    "default-node-development",
    "create-node-mock-ref-lifecycle"
  );
  assert.deepEqual(mock.afterCreate.refCurrent.fields.mockId, {
    type: "number",
    value: 1
  });
  assert.equal(mock.afterCreate.getInstance.value.fields.mockId.value, 2);
  assert.equal(mock.afterSameTypeUpdate.refCurrent.fields.mockId.value, 1);
  assert.equal(mock.afterSameTypeUpdate.getInstance.value.fields.label.value, "two");
  assert.equal(mock.afterTypeChange.refCurrent.fields.mockId.value, 6);
  assert.equal(mock.afterTypeChange.refCurrent.fields.type.value, "mock-host-next");
  assert.deepEqual(mock.afterUnmount.refCurrent, { type: "null" });
  assert.deepEqual(mock.afterUnmount.getInstance.value, { type: "null" });
  assert.deepEqual(
    mock.afterUnmount.createNodeMockCalls.map((call) => call.returnedMockId),
    [1, 2, 3, 4, 5, 6, 7, 8]
  );

  const options = scenarioValue(
    "default-node-development",
    "strict-and-concurrent-options"
  );
  assert.deepEqual(options.reactNativeTestEnvironment, {
    type: "boolean",
    value: true
  });
  assert.deepEqual(options.strictFalse.renderLog, ["strict-false"]);
  assert.deepEqual(options.strictTrue.renderLog, ["strict-true", "strict-true"]);
  assert.equal(
    options.concurrentOptions.omitted.state.toJSON.value.props.id.value,
    "concurrent-omitted"
  );
  assert.equal(
    options.concurrentOptions.falseValue.state.toJSON.value.props.id.value,
    "concurrent-false"
  );
  assert.equal(
    options.concurrentOptions.trueValue.state.toJSON.value.props.id.value,
    "concurrent-true"
  );

  const productionRaw = scenarioValue(
    "default-node-production",
    "raw-create-act-boundary"
  );
  assert.equal(productionRaw.emptyActFlush.value.usedAct, false);
  assert.equal(productionRaw.afterEmptyAct.root.status, "throws");
  const productionOptions = scenarioValue(
    "default-node-production",
    "strict-and-concurrent-options"
  );
  assert.deepEqual(productionOptions.strictFalse.renderLog, []);
  assert.deepEqual(productionOptions.strictTrue.renderLog, []);
});

test("development diagnostics are recorded separately from production silence", () => {
  assert.deepEqual(consoleMessages("default-node-development", "renderer-object-shape"), [
    ["react-test-renderer is deprecated. See https://react.dev/warnings/react-test-renderer"]
  ]);
  const rawMessages = consoleMessages(
    "default-node-development",
    "raw-create-act-boundary"
  );
  assert.equal(rawMessages.length, 2);
  assert.equal(
    rawMessages[0][0],
    "react-test-renderer is deprecated. See https://react.dev/warnings/react-test-renderer"
  );
  assert.match(rawMessages[1][0], /not wrapped in act/u);
  assert.equal(rawMessages[1][1], "Root");

  for (const mode of REACT_TEST_RENDERER_ROOT_LIFECYCLE_PROBE_MODES) {
    if (mode.id !== "default-node-production") {
      continue;
    }
    for (const scenarioId of REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIO_IDS) {
      assert.deepEqual(consoleMessages(mode.id, scenarioId), []);
    }
  }
});

test("React Test Renderer root lifecycle oracle artifact does not leak temporary or local paths", () => {
  const oracleText = readCheckedReactTestRendererRootLifecycleOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\/fast-react-/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-test-renderer-root-lifecycle-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /\/Users\/user\/Developer\/Developer/u);
});

test("print React Test Renderer root lifecycle oracle CLI emits the checked-in artifact", () => {
  const checkedText = readCheckedReactTestRendererRootLifecycleOracleText();
  const output = execFileSync(
    process.execPath,
    [
      "scripts/print-react-test-renderer-root-lifecycle-oracle.mjs",
      "--format=json"
    ],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: checkedText.length + 1024
    }
  );

  assert.equal(output, checkedText);
});

function observation(modeId, scenarioId) {
  return findReactTestRendererRootLifecycleObservation(
    oracle,
    modeId,
    scenarioId
  );
}

function scenarioValue(modeId, scenarioId) {
  const result = observation(modeId, scenarioId).result;
  assert.equal(result.status, "ok", `${modeId}:${scenarioId}`);
  return result.value;
}

function consoleMessages(modeId, scenarioId) {
  return observation(modeId, scenarioId).consoleCalls.map((call) =>
    call.args.map((arg) => arg.value ?? arg.type)
  );
}

function descriptorMap(descriptors) {
  return Object.fromEntries(
    descriptors.map((entry) => [entry.key.value, entry.descriptor])
  );
}

function assertFunctionDescriptor(descriptor, { length }) {
  assert.equal(descriptor.kind, "data");
  assert.equal(descriptor.enumerable, true);
  assert.equal(descriptor.configurable, true);
  assert.equal(descriptor.writable, true);
  assert.equal(descriptor.value.type, "function");
  assert.equal(descriptor.value.length, length);
}
