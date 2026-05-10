import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import {
  readCheckedReactTestRendererSerializationOracle
} from "./react-test-renderer-serialization-oracle.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS
} from "./react-test-renderer-serialization-scenarios.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS,
  REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTIC_REQUIREMENTS,
  REACT_TEST_RENDERER_TOJSON_PRIVATE_FACADE_REQUIREMENTS,
  REACT_TEST_RENDERER_SERIALIZATION_PUBLIC_COMPATIBILITY_STATUS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS,
  evaluateReactTestRendererSerializationLocalGate
} from "./react-test-renderer-serialization-local-gate.mjs";

const require = createRequire(import.meta.url);
const oracle = readCheckedReactTestRendererSerializationOracle();
const jsEntrypoints = [
  {
    entrypoint: "react-test-renderer",
    specifier: "../../../packages/react-test-renderer/index.js"
  },
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
const expectedToJSONFacadeRustApis = [
  "TestRendererRoot::describe_private_json_serialization_for_canary",
  "TestRendererPrivateJsonSerializationReport",
  "TestRendererPrivateJsonPublicSurfaceBlockers"
];
const expectedToJSONFacadeRustTests = [
  "root_private_json_serialization_canary_describes_minimal_host_component_with_text",
  "root_private_json_serialization_canary_rejects_stale_host_output_snapshot",
  "root_private_json_serialization_canary_rejects_stale_commit_after_same_shape_update",
  "root_private_json_serialization_canary_rejects_non_minimal_snapshot_shapes"
];
const privateToJSONSerializationFacadeSymbol = Symbol.for(
  "fast.react_test_renderer.private_tojson_serialization_facade"
);
const privateToJSONSerializationStatus =
  "private-host-output-diagnostics-serializable-public-tojson-blocked";

test("react-test-renderer serialization gate is ready for private diagnostics while public compatibility stays blocked", () => {
  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });

  assert.equal(gate.status, REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS);
  assert.equal(gate.requiredLocalTargetsReady, true);
  assert.equal(gate.privateDiagnosticsReady, true);
  assert.deepEqual(gate.privateDiagnosticBlockers, []);
  assert.equal(gate.privateToJSONFacadeGateReady, true);
  assert.deepEqual(gate.privateToJSONFacadeBlockers, []);
  assert.equal(gate.publicCompatibilityReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.publicCompatibilityBlockers, [
    "public-to-json-api",
    "public-to-tree-api",
    "public-test-instance-wrappers",
    "public-js-react-test-renderer-routing"
  ]);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.localChecks, {
    publicJsReactTestRendererFacadePresent: true,
    publicJsReactTestRendererFacadePlaceholder: true,
    publicJsReactTestRendererFacadeStatus: "placeholder-present",
    rustTestRendererRootFacadePresent: true,
    committedTestRendererHostOutputPresent: true,
    committedFiberInspectionPresent: true,
    privateJsonDiagnosticsPresent: true,
    privateToJSONSerializationFacadeGatePresent: true,
    privateToJSONSerializationFacadeRecognizesRustDiagnostics: true,
    privateToJSONSerializationFacadeSerializesHostOutputDiagnostics: true,
    privateToJSONSerializationFacadePubliclyBlocked: true,
    privateRecordOnlyTestInstanceWrapperPresent: true,
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicTestInstanceWrappersPresent: false,
    publicJsFacadeRoutingPresent: false
  });
});

test("react-test-renderer serialization gate records accepted Rust-private prerequisites without public TestInstance admission", () => {
  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });

  assert.deepEqual(
    REACT_TEST_RENDERER_SERIALIZATION_PRIVATE_DIAGNOSTIC_REQUIREMENTS.map(
      (requirement) => requirement.id
    ),
    [
      "rust-test-renderer-root-facade",
      "committed-test-renderer-host-output",
      "committed-fiber-inspection-api",
      "private-json-diagnostics"
    ]
  );
  assert.equal(gate.requiredLocalTargetsReady, true);
  assert.equal(gate.privateDiagnosticsReady, true);
  assert.deepEqual(gate.privateDiagnosticBlockers, []);
  assert.deepEqual(
    REACT_TEST_RENDERER_TOJSON_PRIVATE_FACADE_REQUIREMENTS.map(
      (requirement) => requirement.id
    ),
    [
      "js-tojson-private-serialization-facade-gate",
      "js-tojson-accepted-rust-private-json-diagnostics",
      "js-tojson-serializes-accepted-host-output-diagnostics",
      "js-tojson-public-serialization-blocked"
    ]
  );
  assert.equal(gate.privateToJSONFacadeGateReady, true);
  assert.deepEqual(gate.privateToJSONFacadeBlockers, []);
  assert.equal(gate.publicCompatibilityReady, false);
  assert.equal(gate.localChecks.privateRecordOnlyTestInstanceWrapperPresent, true);
  assert.equal(gate.localChecks.publicTestInstanceWrappersPresent, false);
  assert.equal(gate.localChecks.publicJsFacadeRoutingPresent, false);
  assert.deepEqual(gate.admittedScenarios, []);
});

test("react-test-renderer JS toJSON private facade recognizes Rust diagnostics without public serialization", () => {
  for (const entry of jsEntrypoints) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });
    const error = captureThrown(() => renderer.toJSON());

    assert.equal(error.name, "FastReactTestRendererUnimplementedError");
    assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
    assert.equal(error.entrypoint, entry.entrypoint);
    assert.equal(error.exportName, "create().toJSON");
    assert.equal(error.compatibilityTarget, "react-test-renderer@19.2.6");
    assert.match(error.message, /Serialization is intentionally blocked/u);
    assert.match(error.message, /no native bridge/u);
    assert.equal(error.serializationAvailable, false);
    assert.equal(error.nativeBridgeAvailable, false);
    assert.equal(error.compatibilityClaimed, false);

    const facadeGate = error.toJSONSerializationFacadeGate;
    assert.equal(facadeGate, error.routingGate.toJSONSerializationFacadeGate);
    assert.equal(Object.isFrozen(facadeGate), true);
    assert.equal(
      facadeGate.id,
      "react-test-renderer-tojson-private-serialization-facade-gate"
    );
    assert.equal(facadeGate.publicSurface, "create().toJSON");
    assert.equal(
      facadeGate.status,
      "ready-for-private-diagnostics-public-tojson-blocked"
    );
    assert.equal(facadeGate.privateFacadeGateAvailable, true);
    assert.equal(facadeGate.privateHostOutputDiagnosticsSerializable, true);
    assert.equal(
      facadeGate.privateSerializationFacadeSymbol,
      privateToJSONSerializationFacadeSymbol.description
    );
    assert.equal(
      facadeGate.privateSerializationStatus,
      privateToJSONSerializationStatus
    );
    assert.equal(facadeGate.acceptedRustPrivateJsonDiagnostics, true);
    assert.equal(facadeGate.publicSerializationAvailable, false);
    assert.equal(facadeGate.publicRouteAvailable, false);
    assert.equal(facadeGate.nativeBridgeAvailable, false);
    assert.equal(facadeGate.nativeExecution, false);
    assert.equal(facadeGate.compatibilityClaimed, false);
    assert.equal(
      facadeGate.acceptedWorker,
      "worker-265-test-renderer-private-json-ready-diagnostics"
    );
    assert.equal(facadeGate.acceptedRustCrate, "fast-react-test-renderer");
    assert.equal(
      facadeGate.acceptedRustDiagnosticName,
      "fast-react-test-renderer.serialization.private-json-canary"
    );
    assert.deepEqual(
      facadeGate.acceptedRustApis,
      expectedToJSONFacadeRustApis
    );
    assert.deepEqual(
      facadeGate.acceptedRustNodeKinds,
      ["HostComponent", "Text"]
    );
    assert.deepEqual(
      facadeGate.acceptedRustTests,
      expectedToJSONFacadeRustTests
    );
    assert.deepEqual(facadeGate.blockedPublicSurfaces, [
      "create().toJSON",
      "create().toTree",
      "create().root",
      "ReactTestInstance",
      "public-js-react-test-renderer-routing",
      "compatibility-claim"
    ]);
    assert.deepEqual(facadeGate.missingPrerequisites, [
      "rust-native-test-renderer-create-bridge",
      "public-react-test-renderer-tojson-bridge",
      "public-test-instance-and-totree-serialization-contract"
    ]);

    const descriptor = Object.getOwnPropertyDescriptor(
      renderer.toJSON,
      privateToJSONSerializationFacadeSymbol
    );
    assert.notEqual(descriptor, undefined);
    assert.equal(descriptor.enumerable, false);
    assert.equal(descriptor.configurable, false);
    assert.equal(descriptor.writable, false);
    const privateFacade = descriptor.value;
    assert.equal(Object.isFrozen(privateFacade), true);
    assert.equal(
      privateFacade.id,
      "react-test-renderer-tojson-private-host-output-serializer"
    );
    assert.equal(privateFacade.status, privateToJSONSerializationStatus);
    assert.equal(privateFacade.entrypoint, entry.entrypoint);
    assert.equal(privateFacade.publicSurface, "create().toJSON");
    assert.equal(
      privateFacade.symbol,
      privateToJSONSerializationFacadeSymbol.description
    );
    assert.equal(privateFacade.gate, facadeGate);
    assert.equal(privateFacade.rootRequest, error.rootRequest);
    assert.equal(privateFacade.privateHostOutputDiagnosticsSerializable, true);
    assert.equal(privateFacade.publicSerializationAvailable, false);
    assert.equal(privateFacade.publicRouteAvailable, false);
    assert.equal(privateFacade.nativeBridgeAvailable, false);
    assert.equal(privateFacade.nativeExecution, false);
    assert.equal(privateFacade.compatibilityClaimed, false);
    assert.equal(
      typeof privateFacade.serializeAcceptedHostOutputDiagnostic,
      "function"
    );
    assert.equal(
      typeof privateFacade.canSerializeAcceptedHostOutputDiagnostic,
      "function"
    );

    const privateJson = privateFacade.serializeAcceptedHostOutputDiagnostic(
      createAcceptedMinimalHostOutputDiagnostic()
    );
    assert.equal(Object.isFrozen(privateJson), true);
    assert.equal(Object.isFrozen(privateJson.props), true);
    assert.equal(Object.isFrozen(privateJson.children), true);
    assert.deepEqual(privateJson, {
      type: "span",
      props: {},
      children: ["hello"]
    });
    assert.equal(
      privateFacade.canSerializeAcceptedHostOutputDiagnostic(
        createAcceptedMinimalHostOutputDiagnostic()
      ),
      true
    );

    const rejectedDiagnostic = createAcceptedMinimalHostOutputDiagnostic();
    rejectedDiagnostic.publicBlockers.jsonMethodBlocked = false;
    assert.equal(
      privateFacade.canSerializeAcceptedHostOutputDiagnostic(rejectedDiagnostic),
      false
    );
    const privateError = captureThrown(() =>
      privateFacade.serializeAcceptedHostOutputDiagnostic(rejectedDiagnostic)
    );
    assert.equal(
      privateError.name,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assert.equal(
      privateError.code,
      "FAST_REACT_TEST_RENDERER_PRIVATE_TOJSON_SERIALIZATION"
    );
    assert.equal(privateError.entrypoint, entry.entrypoint);
    assert.equal(privateError.exportName, "create().toJSON");
    assert.equal(privateError.publicSerializationAvailable, false);
    assert.equal(privateError.nativeBridgeAvailable, false);
    assert.equal(privateError.nativeExecution, false);
    assert.equal(privateError.compatibilityClaimed, false);
  }
});

test("react-test-renderer serialization scenario admission is explicit and blocked for public rows", () => {
  assert.deepEqual(
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS.map(
      (scenario) => scenario.scenarioId
    ),
    REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS
  );

  for (const scenario of REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS) {
    assert.equal(
      scenario.status,
      REACT_TEST_RENDERER_SERIALIZATION_PUBLIC_COMPATIBILITY_STATUS
    );
    assert.equal(scenario.readyForPrivateDiagnostics, true);
    assert.equal(scenario.publicComparisonBlocked, true);
    assert.equal(scenario.admittedForFastReactComparison, false);
    assert.equal(scenario.compatibilityClaimed, false);
    assert.deepEqual(
      scenario.unblockRequires,
      REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS.map(
        (requirement) => requirement.id
      )
    );
  }

  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });
  assert.deepEqual(gate.admittedScenarios, []);
});

test("react-test-renderer serialization gate rejects premature public compatibility claims", () => {
  const prematureClaimOracle = JSON.parse(JSON.stringify(oracle));
  prematureClaimOracle.conformanceClaims.compatibilityClaimed = true;

  const gate = evaluateReactTestRendererSerializationLocalGate({
    oracle: prematureClaimOracle
  });

  assert.equal(gate.status, "blocked-with-violations");
  assert.equal(gate.privateDiagnosticsReady, true);
  assert.equal(gate.publicCompatibilityReady, false);
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    ["compatibility-claimed-before-public-serialization-support"]
  );
  assert.deepEqual(
    gate.violations[0].blockers,
    [
      "public-to-json-api",
      "public-to-tree-api",
      "public-test-instance-wrappers",
      "public-js-react-test-renderer-routing"
    ]
  );
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

function createAcceptedMinimalHostOutputDiagnostic() {
  return {
    diagnosticName: "fast-react-test-renderer.serialization.private-json-canary",
    gate: {
      status: "ReadyForPrivateSerializationDiagnostics",
      requirements: {
        rootCommitDiagnosticsAvailable: true,
        realHostOutputAvailable: true,
        committedFiberInspectionAvailable: true
      },
      hostOutput: {
        containerChildCount: 1,
        instanceCount: 1,
        textCount: 1,
        realHostOutputAvailable: true
      }
    },
    rootChildCount: 1,
    rootNodeKind: "HostComponent",
    nodes: [
      {
        ordinal: 0,
        nodeKind: "HostComponent",
        parentOrdinal: null,
        childOrdinals: [1],
        elementType: { name: "span" },
        props: {
          attributes: {},
          textContent: null
        },
        text: null,
        hidden: false,
        detached: false
      },
      {
        ordinal: 1,
        nodeKind: "Text",
        parentOrdinal: 0,
        childOrdinals: [],
        elementType: null,
        props: null,
        text: "hello",
        hidden: false,
        detached: false
      }
    ],
    component: {
      nodeKind: "HostComponent",
      elementType: { name: "span" },
      props: {
        attributes: {},
        textContent: null
      },
      hidden: false,
      detached: false,
      childCount: 1,
      textChild: {
        nodeKind: "Text",
        text: "hello",
        hidden: false
      }
    },
    publicBlockers: {
      jsonMethodBlocked: true,
      treeMethodBlocked: true,
      instanceWrapperBlocked: true,
      jsFacadeRoutingBlocked: true,
      publicActBlocked: true,
      compatibilityClaimBlocked: true
    }
  };
}

test("react-test-renderer serialization React oracle generation remains React-only while public compatibility is blocked", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactTestRendererBehaviorProbed: true,
    fastReactComparedToReactTestRenderer: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.localFastReactStatus.status, "not-present-in-workspace");
  assert.equal(
    oracle.localFastReactStatus.behaviorCompatibilityClaimed,
    false
  );
  assert.equal(
    oracle.localFastReactStatus.comparedToReactTestRenderer,
    false
  );
});
