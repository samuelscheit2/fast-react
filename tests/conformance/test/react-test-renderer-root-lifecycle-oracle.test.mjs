import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
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
const require = createRequire(import.meta.url);
const privateGetInstanceDiagnosticsSymbol = Symbol.for(
  "fast.react_test_renderer.private_get_instance_diagnostics"
);
const cjsGetInstanceEntrypoints = [
  {
    entrypoint: "react-test-renderer/cjs/react-test-renderer.development",
    specifier:
      "../../../packages/react-test-renderer/cjs/react-test-renderer.development.js"
  },
  {
    entrypoint: "react-test-renderer/cjs/react-test-renderer.production",
    specifier:
      "../../../packages/react-test-renderer/cjs/react-test-renderer.production.js"
  }
];

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

test("Fast React CJS getInstance private diagnostics describe class roots while public getInstance stays blocked", () => {
  for (const entry of cjsGetInstanceEntrypoints) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });
    const error = captureThrown(() => renderer.getInstance());

    assert.equal(error.name, "FastReactTestRendererUnimplementedError");
    assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
    assert.equal(error.entrypoint, entry.entrypoint);
    assert.equal(error.exportName, "create().getInstance");
    assert.match(error.message, /Public instance lookup is intentionally blocked/u);
    assert.equal(error.getInstancePrivateClassRootGate, error.routingGate.getInstancePrivateClassRootGate);
    assert.equal(error.getInstancePrivateClassRootGate.publicGetInstanceAvailable, false);
    assert.equal(error.getInstancePrivateClassRootGate.nativeBridgeAvailable, false);
    assert.equal(error.getInstancePrivateClassRootGate.compatibilityClaimed, false);
    assert.deepEqual(error.getInstancePrivateClassRootGate.acceptedClassRootFiberShape, [
      "HostRoot",
      "ClassComponent",
      "HostComponent",
      "HostText"
    ]);
    assert.deepEqual(error.getInstancePrivateClassRootGate.acceptedHostRootFiberShape, [
      "HostRoot",
      "HostComponent"
    ]);
    assert.deepEqual(
      error.getInstancePrivateClassRootGate.acceptedFunctionRootFiberShape,
      ["HostRoot", "FunctionComponent"]
    );

    const descriptor = Object.getOwnPropertyDescriptor(
      renderer.getInstance,
      privateGetInstanceDiagnosticsSymbol
    );
    assert.notEqual(descriptor, undefined);
    assert.equal(descriptor.enumerable, false);
    assert.equal(descriptor.configurable, false);
    assert.equal(descriptor.writable, false);
    const diagnostics = descriptor.value;
    assert.equal(Object.isFrozen(diagnostics), true);
    assert.equal(
      diagnostics.id,
      "react-test-renderer-get-instance-private-class-root-diagnostics"
    );
    assert.equal(diagnostics.entrypoint, entry.entrypoint);
    assert.equal(diagnostics.publicSurface, "create().getInstance");
    assert.equal(diagnostics.rootRequest, error.rootRequest);
    assert.equal(diagnostics.privateClassRootDiagnosticsAvailable, true);
    assert.equal(diagnostics.publicGetInstanceAvailable, false);
    assert.equal(diagnostics.publicRouteAvailable, false);
    assert.equal(diagnostics.nativeBridgeAvailable, false);
    assert.equal(diagnostics.compatibilityClaimed, false);

    const accepted = createAcceptedGetInstanceClassRootDiagnostic();
    assert.equal(diagnostics.canDescribeAcceptedClassRootDiagnostic(accepted), true);
    const shape = diagnostics.describeAcceptedClassRootDiagnostic(accepted);
    assert.equal(Object.isFrozen(shape), true);
    assert.equal(
      shape.id,
      "react-test-renderer-private-get-instance-class-root-diagnostic"
    );
    assert.equal(shape.publicSurface, "create().getInstance");
    assert.deepEqual(shape.traversal.order, [
      "HostRoot",
      "ClassComponent",
      "HostComponent",
      "HostText"
    ]);
    assert.equal(shape.traversal.classComponentReturnsStateNode, true);
    assert.equal(shape.traversal.functionComponentFailClosed, true);
    assert.equal(shape.traversal.hostComponentFailClosed, true);
    assert.deepEqual(shape.hostRootFailClosed, {
      rootFiberShape: ["HostRoot", "HostComponent"],
      rootChildFiberTag: "HostComponent",
      reactPublicResult: "null-with-default-createNodeMock",
      publicGetInstanceAvailable: false,
      privateClassInstanceAvailable: false,
      publicBehaviorFailClosed: true
    });
    assert.deepEqual(shape.functionRootFailClosed, {
      rootFiberShape: ["HostRoot", "FunctionComponent"],
      rootChildFiberTag: "FunctionComponent",
      reactPublicResult: "null",
      publicGetInstanceAvailable: false,
      privateClassInstanceAvailable: false,
      publicBehaviorFailClosed: true
    });
    assert.deepEqual(shape.classComponent, {
      fiberTag: "ClassComponent",
      componentType: "CanaryClassComponent",
      props: { label: "class-root" },
      stateNodeAvailable: true,
      renderedChildFiberTag: "HostComponent",
      renderedChildCount: 1,
      publicGetInstanceAvailable: false,
      privateClassInstanceDiagnosticAvailable: true
    });
    assert.deepEqual(shape.instance, {
      constructorName: "CanaryClassInstance",
      props: { label: "class-root" },
      state: { marker: "initial-state" },
      reactPublicResult: "class-instance",
      publicGetInstanceAvailable: false,
      privateInstanceAvailable: true
    });
    assert.deepEqual(shape.renderedHostComponent, {
      fiberTag: "HostComponent",
      treeNodeType: "host",
      elementType: "span",
      props: {},
      renderedChildCount: 1,
      renderedText: "hello",
      publicGetInstanceAvailable: false
    });
    assert.deepEqual(shape.renderedHostText, {
      fiberTag: "HostText",
      text: "hello"
    });
    assert.equal(shape.publicGetInstanceAvailable, false);
    assert.equal(shape.publicRouteAvailable, false);
    assert.equal(shape.nativeBridgeAvailable, false);
    assert.equal(shape.compatibilityClaimed, false);

    const rejected = createAcceptedGetInstanceClassRootDiagnostic();
    rejected.functionRootFailClosed.publicBehaviorFailClosed = false;
    assert.equal(diagnostics.canDescribeAcceptedClassRootDiagnostic(rejected), false);
    const privateError = captureThrown(() =>
      diagnostics.describeAcceptedClassRootDiagnostic(rejected)
    );
    assert.equal(
      privateError.name,
      "FastReactTestRendererPrivateGetInstanceDiagnosticError"
    );
    assert.equal(
      privateError.code,
      "FAST_REACT_TEST_RENDERER_PRIVATE_GETINSTANCE_DIAGNOSTIC"
    );
    assert.equal(privateError.entrypoint, entry.entrypoint);
    assert.equal(privateError.exportName, "create().getInstance");
    assert.equal(privateError.publicGetInstanceAvailable, false);
    assert.equal(privateError.nativeBridgeAvailable, false);
    assert.equal(privateError.compatibilityClaimed, false);
  }
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

function loadFresh(specifier) {
  const resolved = require.resolve(specifier);
  delete require.cache[resolved];
  return require(resolved);
}

function captureThrown(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }

  assert.fail("Expected callback to throw");
}

function createAcceptedGetInstanceClassRootDiagnostic({
  hostOutputSnapshotCurrent = true,
  hostOutputUpdateKind = "Create",
  text = "hello"
} = {}) {
  return {
    diagnosticName:
      "fast-react-test-renderer.get-instance.private-class-root-canary",
    sourceTreeDiagnosticName:
      "fast-react-test-renderer.serialization.private-tree-canary",
    hostOutputUpdateKind,
    hostOutputSnapshotCurrent,
    gate: {
      status: "ReadyForPrivateSerializationDiagnostics"
    },
    acceptedClassFiberShape: [
      "HostRoot",
      "ClassComponent",
      "HostComponent",
      "HostText"
    ],
    hostRootFailClosed: {
      rootFiberShape: ["HostRoot", "HostComponent"],
      rootChildFiberTag: "HostComponent",
      reactPublicResult: "null-with-default-createNodeMock",
      publicGetInstanceAvailable: false,
      privateClassInstanceAvailable: false,
      publicBehaviorFailClosed: true
    },
    functionRootFailClosed: {
      rootFiberShape: ["HostRoot", "FunctionComponent"],
      rootChildFiberTag: "FunctionComponent",
      reactPublicResult: "null",
      publicGetInstanceAvailable: false,
      privateClassInstanceAvailable: false,
      publicBehaviorFailClosed: true
    },
    classComponent: {
      fiberTag: "ClassComponent",
      componentType: "CanaryClassComponent",
      props: {
        attributes: {
          label: "class-root"
        },
        textContent: null
      },
      stateNodeAvailable: true,
      renderedChildFiberTag: "HostComponent",
      renderedChildCount: 1,
      instance: {
        constructorName: "CanaryClassInstance",
        props: {
          attributes: {
            label: "class-root"
          },
          textContent: null
        },
        state: {
          marker: "initial-state"
        },
        privateInstanceAvailable: true,
        publicGetInstanceAvailable: false,
        reactPublicResult: "class-instance"
      },
      publicGetInstanceAvailable: false
    },
    renderedHostComponent: {
      fiberTag: "HostComponent",
      nodeType: "host",
      elementType: { name: "span" },
      props: {
        attributes: {},
        textContent: null
      },
      instanceAvailable: false,
      renderedChildCount: 1,
      renderedText: text,
      publicTreeObjectAvailable: false
    },
    renderedHostText: {
      fiberTag: "HostText",
      text,
      returnsTextValue: true,
      publicTreeObjectAvailable: false
    },
    publicBlockers: {
      jsonMethodBlocked: true,
      treeMethodBlocked: true,
      instanceWrapperBlocked: true,
      jsFacadeRoutingBlocked: true,
      publicActBlocked: true,
      compatibilityClaimBlocked: true
    },
    publicGetInstanceAvailable: false,
    nativeBridgeAvailable: false,
    compatibilityClaimed: false
  };
}

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
