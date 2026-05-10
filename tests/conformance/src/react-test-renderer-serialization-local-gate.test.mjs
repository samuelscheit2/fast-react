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
  REACT_TEST_RENDERER_TOTREE_PRIVATE_METADATA_REQUIREMENTS,
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
  "TestRendererRoot::describe_private_json_serialization_after_update_for_canary",
  "TestRendererRoot::describe_private_to_json_facade_result_for_canary",
  "TestRendererRoot::describe_private_to_json_facade_result_after_update_for_canary",
  "TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics",
  "TestRendererPrivateJsonSerializationReport",
  "TestRendererPrivateJsonRenderedRoot",
  "TestRendererPrivateToJsonFacadeResult",
  "TestRendererPrivateJsonPublicSurfaceBlockers"
];
const expectedToJSONFacadeRustTests = [
  "root_private_json_serialization_canary_describes_minimal_host_component_with_text",
  "root_private_json_serialization_canary_describes_updated_host_component_text_after_commit",
  "root_private_json_serialization_canary_rejects_stale_host_output_snapshot",
  "root_private_json_serialization_canary_rejects_stale_updated_host_output_snapshot",
  "root_private_json_serialization_canary_rejects_stale_commit_after_same_shape_update",
  "root_private_json_serialization_canary_rejects_non_minimal_snapshot_shapes",
  "root_private_to_json_shape_diagnostics_serialize_empty_root_as_null",
  "root_private_to_json_shape_diagnostics_serialize_multiple_host_children_and_text_siblings",
  "root_private_to_json_shape_diagnostics_elide_children_prop",
  "root_private_to_json_facade_result_canary_wraps_create_serialization_evidence",
  "root_private_to_json_facade_result_canary_wraps_update_serialization_evidence"
];
const privateToJSONSerializationFacadeSymbol = Symbol.for(
  "fast.react_test_renderer.private_tojson_serialization_facade"
);
const privateToJSONSerializationStatus =
  "private-host-output-diagnostics-serializable-public-tojson-blocked";
const privateToJSONFacadeResultStatus =
  "private-tojson-facade-result-backed-by-rust-host-output-public-blocked";
const privateToJSONUpdateHostOutputRowId =
  "react-test-renderer-tojson-update-host-output-private-diagnostic";
const privateToJSONUnmountHostOutputRowId =
  "react-test-renderer-tojson-unmount-host-output-private-diagnostic";
const privateToJSONUpdateUnmountRowStatus =
  "private-tojson-update-unmount-host-output-rows-public-tojson-blocked";
const privateToJSONUpdateUnmountDependencyIds = [
  "react-test-renderer-update-route-private-diagnostic",
  "react-test-renderer-unmount-route-private-diagnostic",
  "react-test-renderer-serialization-private-json-diagnostic"
];
const privateToTreeHostOutputMetadataSymbol = Symbol.for(
  "fast.react_test_renderer.private_totree_host_output_metadata"
);
const privateToTreeHostOutputMetadataStatus =
  "private-host-output-totree-metadata-ready-public-totree-blocked";
const privateToTreeFacadeSymbol = Symbol.for(
  "fast.react_test_renderer.private_totree_facade"
);
const privateToTreeFacadeStatus =
  "private-tree-diagnostics-serializable-public-totree-blocked";
const privateToTreeAcceptedDiagnosticName =
  "fast-react-test-renderer.serialization.private-tree-canary";
const privateToTreeCommittedFiberInspectionDiagnosticName =
  "fast-react-test-renderer.serialization.private-tree-committed-fiber-inspection-canary";
const privateToTreeCompositeAcceptedFiberShape = [
  "HostRoot",
  "FunctionComponent",
  "HostComponent",
  "HostText"
];
const privateToTreeMultiChildAcceptedFiberShape = [
  "HostRoot",
  "HostText",
  "HostComponent",
  "HostText"
];
const privateToTreeCompositeMultiChildAcceptedFiberShape = [
  "HostRoot",
  "FunctionComponent",
  "HostText",
  "HostComponent",
  "HostText"
];
const privateToTreeFunctionComponentType = "CanaryFunctionComponent";

test("react-test-renderer serialization gate is ready for private diagnostics while public compatibility stays blocked", () => {
  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });

  assert.equal(gate.status, REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS);
  assert.equal(gate.requiredLocalTargetsReady, true);
  assert.equal(gate.privateDiagnosticsReady, true);
  assert.deepEqual(gate.privateDiagnosticBlockers, []);
  assert.equal(gate.privateToJSONFacadeGateReady, true);
  assert.deepEqual(gate.privateToJSONFacadeBlockers, []);
  assert.equal(gate.privateToTreeMetadataGateReady, true);
  assert.deepEqual(gate.privateToTreeMetadataBlockers, []);
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
    privateTreeMetadataPresent: true,
    privateToJSONSerializationFacadeGatePresent: true,
    privateToJSONSerializationFacadeRecognizesRustDiagnostics: true,
    privateToJSONSerializationFacadeSerializesHostOutputDiagnostics: true,
    privateToJSONSerializationFacadeCoversBroaderHostShapes: true,
    privateToJSONSerializationFacadeExposesDiagnosticResult: true,
    privateToJSONUpdateUnmountRowsPresent: true,
    privateToJSONUpdatePropAndTextDiagnosticsPresent: true,
    privateToJSONSerializationFacadePubliclyBlocked: true,
    privateToTreeHostOutputMetadataGatePresent: true,
    privateToTreePrivateFacadeGatePresent: true,
    privateToTreePrivateFacadeConsumesRustTreeMetadata: true,
    privateToTreeHostOutputMetadataRecognizesMinimalShape: true,
    privateToTreeCompositeFunctionMetadataPresent: true,
    privateToTreeMultiChildMetadataPresent: true,
    privateToTreeCommittedFiberInspectionShapeDiagnosticsPresent: true,
    privateToTreeHostOutputMetadataPubliclyBlocked: true,
    privateRecordOnlyTestInstanceWrapperPresent: true,
    privateRecordOnlyTestInstanceQueryPathPresent: true,
    privateTestInstanceBridgeQueryDiagnosticsPresent: true,
    privateTestInstanceFindAllQueryDiagnosticsPresent: true,
    privateTestInstanceFindByQueryDiagnosticsPresent: true,
    privateTestInstanceQueryBridgePreflightPresent: true,
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
      "js-tojson-broader-host-shape-diagnostics",
      "js-tojson-exposes-private-diagnostic-result",
      "js-tojson-update-unmount-host-output-rows",
      "js-tojson-update-prop-and-text-diagnostics",
      "js-tojson-public-serialization-blocked"
    ]
  );
  assert.equal(gate.privateToJSONFacadeGateReady, true);
  assert.deepEqual(gate.privateToJSONFacadeBlockers, []);
  assert.deepEqual(
    REACT_TEST_RENDERER_TOTREE_PRIVATE_METADATA_REQUIREMENTS.map(
      (requirement) => requirement.id
    ),
    [
      "js-totree-private-host-output-metadata-gate",
      "js-totree-private-facade-gate",
      "js-totree-consumes-accepted-rust-private-tree-metadata",
      "js-totree-recognizes-accepted-minimal-host-output-shape",
      "js-totree-private-composite-function-metadata",
      "js-totree-private-multi-child-metadata",
      "js-totree-private-committed-fiber-shape-diagnostics",
      "js-totree-public-tree-blocked"
    ]
  );
  assert.equal(gate.privateToTreeMetadataGateReady, true);
  assert.deepEqual(gate.privateToTreeMetadataBlockers, []);
  assert.equal(gate.publicCompatibilityReady, false);
  assert.equal(gate.localChecks.privateRecordOnlyTestInstanceWrapperPresent, true);
  assert.equal(
    gate.localChecks.privateRecordOnlyTestInstanceQueryPathPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceBridgeQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceFindAllQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceFindByQueryDiagnosticsPresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTestInstanceQueryBridgePreflightPresent,
    true
  );
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
    assert.equal(facadeGate.privateDiagnosticResultAvailable, true);
    assert.equal(
      facadeGate.privateDiagnosticResultStatus,
      privateToJSONFacadeResultStatus
    );
    if (entry.entrypoint.endsWith(".development")) {
      assert.equal(
        facadeGate.privateUpdateHostComponentPropSerializationEvidenceAvailable,
        true
      );
      assert.equal(
        facadeGate.acceptedUpdateHostComponentPropPayloadShape,
        "HostComponentPropPlusTextUpdate"
      );
      assert.equal(
        facadeGate.updatePropSerializationWorker,
        "worker-671-test-renderer-root-update-serialization-props"
      );
    }
    assert.equal(facadeGate.acceptedRustPrivateJsonDiagnostics, true);
    assert.equal(facadeGate.acceptedRustPrivateToJSONFacadeResult, true);
    assert.equal(facadeGate.publicSerializationAvailable, false);
    assert.equal(facadeGate.publicRouteAvailable, false);
    assert.equal(facadeGate.nativeBridgeAvailable, false);
    assert.equal(facadeGate.nativeExecution, false);
    assert.equal(facadeGate.compatibilityClaimed, false);
    assert.equal(
      facadeGate.acceptedWorker,
      "worker-265-test-renderer-private-json-ready-diagnostics"
    );
    assert.equal(
      facadeGate.broaderHostShapesWorker,
      "worker-424-test-renderer-tojson-broader-host-shapes"
    );
    assert.equal(facadeGate.acceptedRustCrate, "fast-react-test-renderer");
    assert.equal(
      facadeGate.acceptedRustDiagnosticName,
      "fast-react-test-renderer.serialization.private-json-canary"
    );
    assert.equal(
      facadeGate.acceptedRustDiagnosticResultName,
      "fast-react-test-renderer.tojson.private-facade-result"
    );
    const expectedRustApis = expectedToJSONFacadeRustApis.slice();
    const expectedRustTests = expectedToJSONFacadeRustTests.slice();
    const expectedHostOutputUpdateKinds = ["Create", "Update"];
    if (entry.entrypoint.endsWith(".development")) {
      expectedRustApis.splice(
        expectedRustApis.indexOf(
          "TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics"
        ),
        0,
        "TestRendererRoot::describe_private_to_json_host_output_update_row_for_canary",
        "TestRendererRoot::describe_private_to_json_host_output_unmount_row_for_canary"
      );
      expectedRustApis.splice(
        expectedRustApis.indexOf("TestRendererPrivateJsonPublicSurfaceBlockers"),
        0,
        "TestRendererPrivateToJsonHostOutputRow",
        "TestRendererPrivateToJsonHostOutputDependencyDiagnostics"
      );
      expectedRustTests.push(
        "root_private_to_json_unmount_host_output_row_records_empty_snapshot_blockers",
        "root_private_to_json_unmount_host_output_row_rejects_stale_snapshot",
        "root_private_to_json_update_host_output_row_rejects_mismatched_row_kind"
      );
      expectedHostOutputUpdateKinds.push("Unmount");
      assert.equal(
        facadeGate.privateUpdateHostOutputRowId,
        privateToJSONUpdateHostOutputRowId
      );
      assert.equal(
        facadeGate.privateUnmountHostOutputRowId,
        privateToJSONUnmountHostOutputRowId
      );
      assert.equal(facadeGate.mismatchedUpdateUnmountRecordRejection, true);
      assert.deepEqual(
        facadeGate.privateUpdateUnmountDependencyMetadata
          .acceptedPrivateDiagnosticDependencyIds,
        privateToJSONUpdateUnmountDependencyIds
      );
      assert.deepEqual(
        facadeGate.privateUpdateUnmountHostOutputRows.map((row) => row.id),
        [privateToJSONUpdateHostOutputRowId, privateToJSONUnmountHostOutputRowId]
      );
    }
    assert.deepEqual(
      facadeGate.acceptedRustApis,
      expectedRustApis
    );
    assert.deepEqual(
      facadeGate.acceptedRustNodeKinds,
      ["HostComponent", "Text"]
    );
    assert.deepEqual(facadeGate.acceptedHostRootShapes, [
      "EmptyRoot",
      "SingleHostChild",
      "MultipleHostChildren",
      "TextSibling"
    ]);
    assert.deepEqual(facadeGate.acceptedHostOutputUpdateKinds, [
      ...expectedHostOutputUpdateKinds
    ]);
    assert.equal(facadeGate.propElisionFromSerializedProps, true);
    assert.equal(facadeGate.hostOutputSnapshotFreshnessRequired, true);
    assert.equal(facadeGate.staleSnapshotRejection, true);
    assert.deepEqual(
      facadeGate.acceptedRustTests,
      expectedRustTests
    );
    assert.equal(
      facadeGate.acceptedFacadeResultWorker,
      "worker-391-test-renderer-public-tojson-private-facade"
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
    assert.equal(privateFacade.privateDiagnosticResultAvailable, true);
    if (entry.entrypoint.endsWith(".development")) {
      assert.equal(
        privateFacade.privateUpdateHostComponentPropSerializationEvidenceAvailable,
        true
      );
      assert.equal(
        privateFacade.acceptedUpdateHostComponentPropPayloadShape,
        "HostComponentPropPlusTextUpdate"
      );
      assert.equal(
        privateFacade.updatePropSerializationWorker,
        "worker-671-test-renderer-root-update-serialization-props"
      );
      assert.equal(privateFacade.mismatchedUpdateUnmountRecordRejection, true);
      assert.deepEqual(
        privateFacade.privateUpdateUnmountDependencyMetadata
          .acceptedPrivateDiagnosticDependencyIds,
        privateToJSONUpdateUnmountDependencyIds
      );
      assert.deepEqual(
        privateFacade.privateUpdateUnmountHostOutputRows.map((row) => row.id),
        [privateToJSONUpdateHostOutputRowId, privateToJSONUnmountHostOutputRowId]
      );
    }
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
    assert.equal(
      typeof privateFacade.createAcceptedHostOutputDiagnosticResult,
      "function"
    );
    assert.equal(
      typeof privateFacade.canCreateAcceptedHostOutputDiagnosticResult,
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
    const updatedPrivateJson = privateFacade.serializeAcceptedHostOutputDiagnostic(
      createAcceptedMinimalHostOutputDiagnostic({
        hostOutputUpdateKind: "Update",
        propsAttributes: { "data-state": "new" },
        text: "goodbye"
      })
    );
    assert.deepEqual(updatedPrivateJson, {
      type: "span",
      props: { "data-state": "new" },
      children: ["goodbye"]
    });
    const broadPrivateJson = privateFacade.serializeAcceptedHostOutputDiagnostic(
      createAcceptedBroaderHostOutputDiagnostic()
    );
    assert.equal(Object.isFrozen(broadPrivateJson), true);
    assert.equal(Object.isFrozen(broadPrivateJson[0]), true);
    assert.equal(Object.isFrozen(broadPrivateJson[0].props), true);
    assert.equal(Object.isFrozen(broadPrivateJson[0].children), true);
    assert.equal(Object.isFrozen(broadPrivateJson[2]), true);
    assert.equal(Object.isFrozen(broadPrivateJson[2].props), true);
    assert.equal(Object.isFrozen(broadPrivateJson[2].children), true);
    assert.deepEqual(broadPrivateJson, [
      {
        type: "div",
        props: {
          id: "first"
        },
        children: ["one"]
      },
      "tail",
      {
        type: "span",
        props: {
          className: "tag"
        },
        children: ["two", "three"]
      }
    ]);
    const emptyPrivateJson = privateFacade.serializeAcceptedHostOutputDiagnostic(
      createAcceptedEmptyRootHostOutputDiagnostic()
    );
    assert.equal(emptyPrivateJson, null);
    assert.equal(
      privateFacade.canSerializeAcceptedHostOutputDiagnostic(
        createAcceptedMinimalHostOutputDiagnostic()
      ),
      true
    );
    assert.equal(
      privateFacade.canSerializeAcceptedHostOutputDiagnostic(
        createAcceptedMinimalHostOutputDiagnostic({
          hostOutputUpdateKind: "Update",
          propsAttributes: { "data-state": "new" },
          text: "goodbye"
        })
      ),
      true
    );
    assert.equal(
      privateFacade.canSerializeAcceptedHostOutputDiagnostic(
        createAcceptedBroaderHostOutputDiagnostic()
      ),
      true
    );
    assert.equal(
      privateFacade.canSerializeAcceptedHostOutputDiagnostic(
        createAcceptedEmptyRootHostOutputDiagnostic()
      ),
      true
    );
    const privateDiagnosticResult =
      privateFacade.createAcceptedHostOutputDiagnosticResult(
        createAcceptedMinimalHostOutputDiagnostic()
      );
    assert.equal(Object.isFrozen(privateDiagnosticResult), true);
    assert.equal(
      privateDiagnosticResult.id,
      "react-test-renderer-private-tojson-diagnostic-result"
    );
    assert.equal(
      privateDiagnosticResult.diagnosticName,
      "fast-react-test-renderer.tojson.private-facade-result"
    );
    assert.equal(privateDiagnosticResult.status, privateToJSONFacadeResultStatus);
    assert.equal(privateDiagnosticResult.entrypoint, entry.entrypoint);
    assert.equal(privateDiagnosticResult.publicSurface, "create().toJSON");
    assert.equal(
      privateDiagnosticResult.sourceDiagnostic,
      "fast-react-test-renderer.serialization.private-json-canary"
    );
    assert.equal(privateDiagnosticResult.hostOutputUpdateKind, "Create");
    assert.equal(privateDiagnosticResult.hostOutputSnapshotCurrent, true);
    assert.equal(privateDiagnosticResult.sourceNodeCount, 2);
    assert.deepEqual(privateDiagnosticResult.result, {
      type: "span",
      props: {},
      children: ["hello"]
    });
    assert.equal(Object.isFrozen(privateDiagnosticResult.result), true);
    assert.equal(Object.isFrozen(privateDiagnosticResult.result.props), true);
    assert.equal(Object.isFrozen(privateDiagnosticResult.result.children), true);
    assert.deepEqual(privateDiagnosticResult.publicBlockers, {
      jsonMethodBlocked: true,
      treeMethodBlocked: true,
      instanceWrapperBlocked: true,
      jsFacadeRoutingBlocked: true,
      publicActBlocked: true,
      compatibilityClaimBlocked: true
    });
    assert.equal(privateDiagnosticResult.publicSerializationAvailable, false);
    assert.equal(privateDiagnosticResult.publicRouteAvailable, false);
    assert.equal(privateDiagnosticResult.nativeBridgeAvailable, false);
    assert.equal(privateDiagnosticResult.nativeExecution, false);
    assert.equal(privateDiagnosticResult.compatibilityClaimed, false);
    const updatedPrivateDiagnosticResult =
      privateFacade.createAcceptedHostOutputDiagnosticResult(
        createAcceptedMinimalHostOutputDiagnostic({
          hostOutputUpdateKind: "Update",
          propsAttributes: { "data-state": "new" },
          text: "goodbye"
        })
      );
    assert.equal(
      updatedPrivateDiagnosticResult.hostOutputUpdateKind,
      "Update"
    );
    assert.deepEqual(updatedPrivateDiagnosticResult.result, {
      type: "span",
      props: { "data-state": "new" },
      children: ["goodbye"]
    });
    const broadPrivateDiagnosticResult =
      privateFacade.createAcceptedHostOutputDiagnosticResult(
        createAcceptedBroaderHostOutputDiagnostic()
      );
    assert.equal(broadPrivateDiagnosticResult.sourceNodeCount, 6);
    assert.deepEqual(broadPrivateDiagnosticResult.result, broadPrivateJson);
    const emptyPrivateDiagnosticResult =
      privateFacade.createAcceptedHostOutputDiagnosticResult(
        createAcceptedEmptyRootHostOutputDiagnostic()
      );
    assert.equal(emptyPrivateDiagnosticResult.sourceNodeCount, 0);
    assert.equal(emptyPrivateDiagnosticResult.result, null);
    if (entry.entrypoint.endsWith(".development")) {
      const unmountPrivateJson =
        privateFacade.serializeAcceptedHostOutputDiagnostic(
          createAcceptedEmptyRootHostOutputDiagnostic({
            hostOutputUpdateKind: "Unmount"
          })
        );
      assert.equal(unmountPrivateJson, null);
      const unmountPrivateDiagnosticResult =
        privateFacade.createAcceptedHostOutputDiagnosticResult(
          createAcceptedEmptyRootHostOutputDiagnostic({
            hostOutputUpdateKind: "Unmount"
          })
        );
      assert.equal(
        unmountPrivateDiagnosticResult.hostOutputRowId,
        privateToJSONUnmountHostOutputRowId
      );
      assert.equal(
        unmountPrivateDiagnosticResult.hostOutputRow.hostOutputUpdateKind,
        "Unmount"
      );
      assert.deepEqual(
        unmountPrivateDiagnosticResult.hostOutputRow.dependencyMetadata
          .acceptedPrivateDiagnosticDependencyIds,
        privateToJSONUpdateUnmountDependencyIds
      );
      assert.equal(unmountPrivateDiagnosticResult.sourceNodeCount, 0);
      assert.equal(unmountPrivateDiagnosticResult.result, null);

      const mismatchedUpdateRow = createAcceptedMinimalHostOutputDiagnostic({
        hostOutputUpdateKind: "Update",
        text: "goodbye"
      });
      mismatchedUpdateRow.hostOutputRow = {
        ...mismatchedUpdateRow.hostOutputRow,
        id: privateToJSONUnmountHostOutputRowId,
        hostOutputUpdateKind: "Unmount"
      };
      assert.equal(
        privateFacade.canSerializeAcceptedHostOutputDiagnostic(
          mismatchedUpdateRow
        ),
        false
      );
      const mismatchedUpdateError = captureThrown(() =>
        privateFacade.serializeAcceptedHostOutputDiagnostic(mismatchedUpdateRow)
      );
      assert.match(
        mismatchedUpdateError.message,
        /Expected private JSON Update row id/u
      );
    }
    assert.equal(
      privateFacade.canCreateAcceptedHostOutputDiagnosticResult(
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
    assert.equal(
      privateFacade.canCreateAcceptedHostOutputDiagnosticResult(
        rejectedDiagnostic
      ),
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

    const staleSnapshotDiagnostic = createAcceptedMinimalHostOutputDiagnostic({
      hostOutputSnapshotCurrent: false,
      hostOutputUpdateKind: "Update",
      text: "goodbye"
    });
    assert.equal(
      privateFacade.canSerializeAcceptedHostOutputDiagnostic(
        staleSnapshotDiagnostic
      ),
      false
    );
    const staleSnapshotError = captureThrown(() =>
      privateFacade.serializeAcceptedHostOutputDiagnostic(
        staleSnapshotDiagnostic
      )
    );
    assert.equal(
      staleSnapshotError.name,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assert.match(
      staleSnapshotError.message,
      /hostOutputSnapshotCurrent to be true/u
    );
  }
});

test("react-test-renderer JS toTree private metadata records the accepted minimal host shape while public toTree stays blocked", () => {
  for (const entry of jsEntrypoints) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });
    const error = captureThrown(() => renderer.toTree());

    assert.equal(error.name, "FastReactTestRendererUnimplementedError");
    assert.equal(error.code, "FAST_REACT_UNIMPLEMENTED");
    assert.equal(error.entrypoint, entry.entrypoint);
    assert.equal(error.exportName, "create().toTree");
    assert.equal(error.compatibilityTarget, "react-test-renderer@19.2.6");
    assert.match(error.message, /Fiber tree inspection is intentionally blocked/u);
    assert.equal(error.serializationAvailable, false);
    assert.equal(error.nativeBridgeAvailable, false);
    assert.equal(error.compatibilityClaimed, false);

    const metadataGate = error.toTreeHostOutputMetadataGate;
    assert.equal(metadataGate, error.routingGate.toTreeHostOutputMetadataGate);
    assert.equal(
      error.toTreePrivateFacadeGate,
      error.routingGate.toTreePrivateFacadeGate
    );
    assert.equal(Object.isFrozen(metadataGate), true);
    assert.equal(
      metadataGate.id,
      "react-test-renderer-totree-private-host-output-metadata-gate"
    );
    assert.equal(metadataGate.publicSurface, "create().toTree");
    assert.equal(
      metadataGate.status,
      "ready-for-private-diagnostics-public-totree-blocked"
    );
    assert.equal(metadataGate.privateHostOutputTreeMetadataAvailable, true);
    assert.equal(
      metadataGate.privateMetadataSymbol,
      privateToTreeHostOutputMetadataSymbol.description
    );
    assert.equal(
      metadataGate.privateMetadataStatus,
      privateToTreeHostOutputMetadataStatus
    );
    assert.equal(
      metadataGate.privateFacadeSymbol,
      privateToTreeFacadeSymbol.description
    );
    assert.equal(metadataGate.privateFacadeStatus, privateToTreeFacadeStatus);
    assert.deepEqual(metadataGate.acceptedMinimalFiberShape, [
      "HostRoot",
      "HostComponent",
      "HostText"
    ]);
    assert.deepEqual(
      metadataGate.acceptedCompositeFiberShape,
      privateToTreeCompositeAcceptedFiberShape
    );
    assert.equal(metadataGate.acceptedReactSourceAlgorithm, "ReactTestRenderer.js toTree");
    assert.match(metadataGate.functionComponentBehavior, /nodeType 'component'/u);
    assert.equal(metadataGate.acceptedRustPrivateJsonDiagnostics, true);
    assert.equal(metadataGate.acceptedRustPrivateTreeMetadata, true);
    assert.equal(metadataGate.acceptedRustPrivateCompositeTreeMetadata, true);
    assert.equal(metadataGate.acceptedCommittedFiberInspection, true);
    assert.equal(metadataGate.privateCompositeFunctionMetadataAvailable, true);
    assert.equal(metadataGate.publicTreeAvailable, false);
    assert.equal(metadataGate.publicRouteAvailable, false);
    assert.equal(metadataGate.nativeBridgeAvailable, false);
    assert.equal(metadataGate.nativeExecution, false);
    assert.equal(metadataGate.compatibilityClaimed, false);
    assert.equal(
      metadataGate.acceptedWorker,
      "worker-364-test-renderer-totree-private-host-output"
    );
    const expectedMetadataRustWorkers = [
      "worker-235-test-renderer-private-fiber-inspection",
      "worker-265-test-renderer-private-json-ready-diagnostics"
    ];
    const expectedMetadataRustApis = [
      "inspect_test_renderer_committed_fiber_tree",
      "TestRendererCommittedFiberTreeInspection::host_root",
      "TestRendererCommittedFiberTreeInspection::host_component",
      "TestRendererCommittedFiberTreeInspection::host_text",
      "TestRendererRoot::describe_private_json_serialization_for_canary",
      "TestRendererRoot::describe_private_tree_metadata_for_canary",
      "TestRendererRoot::describe_private_tree_metadata_after_update_for_canary",
      "TestRendererPrivateJsonSerializationReport",
      "TestRendererPrivateTreeMetadataReport",
      "TestRendererPrivateTreeFunctionComponentDiagnostic"
    ];
    const expectedMetadataRustTests = [
      "committed_fiber_inspection_describes_host_root_component_and_text",
      "root_private_json_serialization_canary_describes_minimal_host_component_with_text",
      "root_private_tree_metadata_canary_describes_minimal_host_component_with_text",
      "root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit",
      "root_private_tree_metadata_canary_describes_function_component_above_host_output"
    ];
    if (entry.entrypoint.endsWith(".development")) {
      expectedMetadataRustWorkers.push(
        "worker-516-test-renderer-committed-fiber-tree-inspection"
      );
      expectedMetadataRustApis.splice(
        1,
        0,
        "TestRendererCommittedFiberTreeInspection::shape_name",
        "TestRendererCommittedFiberTreeInspection::nodes",
        "TestRendererCommittedFiberTreeInspection::root_children",
        "TestRendererCommittedFiberTreeInspection::host_children",
        "TestRendererCommittedFiberTreeInspection::function_component",
        "TestRendererCommittedFiberTreeInspection::host_components",
        "TestRendererCommittedFiberTreeInspection::host_texts",
        "TestRendererCommittedFiberTreeInspection::fiber_tag_order"
      );
      expectedMetadataRustApis.splice(
        expectedMetadataRustApis.indexOf("TestRendererPrivateJsonSerializationReport"),
        0,
        "TestRendererRoot::describe_private_tree_committed_fiber_inspection_for_canary"
      );
      expectedMetadataRustApis.splice(
        expectedMetadataRustApis.indexOf(
          "TestRendererPrivateTreeFunctionComponentDiagnostic"
        ),
        0,
        "TestRendererPrivateTreeCommittedFiberInspectionReport"
      );
      expectedMetadataRustTests.splice(
        1,
        0,
        "committed_fiber_inspection_describes_multi_child_host_root_shape",
        "committed_fiber_inspection_describes_function_component_above_host_shape",
        "committed_fiber_inspection_describes_function_component_above_multi_child_shape"
      );
      expectedMetadataRustTests.push(
        "root_private_tree_committed_fiber_inspection_records_minimal_shape_privately"
      );
      assert.equal(
        metadataGate.acceptedCommittedFiberInspectionDiagnosticName,
        privateToTreeCommittedFiberInspectionDiagnosticName
      );
      assert.equal(
        metadataGate.privateCommittedFiberInspectionShapeDiagnosticsAvailable,
        true
      );
      assert.equal(
        metadataGate.privateMultiChildCommittedFiberInspectionAvailable,
        true
      );
      assert.equal(
        metadataGate.privateFunctionComponentCommittedFiberInspectionAvailable,
        true
      );
      assert.deepEqual(
        metadataGate.acceptedMultiChildFiberShape,
        privateToTreeMultiChildAcceptedFiberShape
      );
      assert.deepEqual(
        metadataGate.acceptedCompositeMultiChildFiberShape,
        privateToTreeCompositeMultiChildAcceptedFiberShape
      );
      assert.equal(
        metadataGate.privateMultiChildHostOutputTreeMetadataAvailable,
        true
      );
      assert.equal(
        metadataGate.multiChildAcceptedWorker,
        "worker-485-test-renderer-totree-multichild-gate"
      );
    }
    assert.deepEqual(metadataGate.acceptedRustWorkers, expectedMetadataRustWorkers);
    assert.deepEqual(metadataGate.acceptedRustApis, expectedMetadataRustApis);
    assert.deepEqual(metadataGate.acceptedRustTests, expectedMetadataRustTests);
    assert.deepEqual(metadataGate.blockedPublicSurfaces, [
      "create().toTree",
      "create().toJSON",
      "create().root",
      "ReactTestInstance",
      "public-js-react-test-renderer-routing",
      "compatibility-claim"
    ]);

    const facadeGate = error.toTreePrivateFacadeGate;
    assert.equal(Object.isFrozen(facadeGate), true);
    assert.equal(
      facadeGate.id,
      "react-test-renderer-totree-private-facade-gate"
    );
    assert.equal(facadeGate.publicSurface, "create().toTree");
    assert.equal(
      facadeGate.status,
      "ready-for-private-diagnostics-public-totree-blocked"
    );
    assert.equal(facadeGate.privateFacadeGateAvailable, true);
    assert.equal(facadeGate.privateTreeMetadataSerializable, true);
    assert.equal(facadeGate.privateCompositeFunctionMetadataSerializable, true);
    assert.equal(
      facadeGate.privateFacadeSymbol,
      privateToTreeFacadeSymbol.description
    );
    assert.equal(facadeGate.privateFacadeStatus, privateToTreeFacadeStatus);
    assert.equal(facadeGate.acceptedRustPrivateTreeMetadata, true);
    assert.equal(facadeGate.acceptedRustPrivateCompositeTreeMetadata, true);
    assert.equal(
      facadeGate.acceptedRustDiagnosticName,
      privateToTreeAcceptedDiagnosticName
    );
    assert.deepEqual(facadeGate.acceptedMinimalFiberShape, [
      "HostRoot",
      "HostComponent",
      "HostText"
    ]);
    assert.deepEqual(
      facadeGate.acceptedCompositeFiberShape,
      privateToTreeCompositeAcceptedFiberShape
    );
    const nativeToTreeEvidence =
      facadeGate.privateNativeExecutionEvidenceAvailable === true;
    assert.deepEqual(
      facadeGate.acceptedHostOutputUpdateKinds,
      nativeToTreeEvidence ? ["Create", "Update", "Unmount"] : ["Create", "Update"]
    );
    assert.equal(facadeGate.hostOutputSnapshotFreshnessRequired, true);
    assert.equal(facadeGate.staleSnapshotRejection, true);
    assert.equal(facadeGate.publicTreeAvailable, false);
    assert.equal(facadeGate.publicRouteAvailable, false);
    assert.equal(facadeGate.nativeBridgeAvailable, false);
    assert.equal(facadeGate.nativeExecution, false);
    assert.equal(facadeGate.compatibilityClaimed, false);
    assert.equal(
      facadeGate.acceptedWorker,
      "worker-392-test-renderer-public-totree-private-facade"
    );
    assert.deepEqual(facadeGate.acceptedRustApis, [
      "TestRendererRoot::describe_private_tree_metadata_for_canary",
      "TestRendererRoot::describe_private_tree_metadata_after_update_for_canary",
      ...(nativeToTreeEvidence
        ? [
            "TestRendererRoot::describe_private_to_tree_after_create_native_execution_for_canary",
            "TestRendererRoot::describe_private_to_tree_after_update_native_execution_for_canary",
            "TestRendererRoot::describe_private_to_tree_after_unmount_native_execution_for_canary"
          ]
        : []),
      "TestRendererPrivateTreeMetadataReport",
      ...(nativeToTreeEvidence
        ? ["TestRendererPrivateToTreeNativeExecutionEvidence"]
        : []),
      "TestRendererPrivateTreeFunctionComponentDiagnostic",
      "TestRendererPrivateTreeHostComponentDiagnostic",
      "TestRendererPrivateTreeHostTextDiagnostic"
    ]);
    assert.deepEqual(facadeGate.acceptedRustTests, [
      "root_private_tree_metadata_canary_describes_minimal_host_component_with_text",
      "root_private_tree_metadata_canary_describes_updated_host_component_text_after_commit",
      "root_private_tree_metadata_canary_describes_function_component_above_host_output",
      ...(nativeToTreeEvidence
        ? [
            "root_private_to_tree_native_execution_evidence_consumes_create_update_unmount_records"
          ]
        : []),
      "root_private_tree_metadata_canary_rejects_stale_host_output_snapshot"
    ]);
    if (nativeToTreeEvidence) {
      assert.equal(
        facadeGate.nativeExecutionEvidenceWorker,
        "worker-667-test-renderer-totree-native-execution"
      );
    }
    if (entry.entrypoint.endsWith(".development")) {
      assert.equal(facadeGate.privateMultiChildTreeMetadataSerializable, true);
      assert.equal(
        facadeGate.multiChildAcceptedWorker,
        "worker-485-test-renderer-totree-multichild-gate"
      );
      assert.deepEqual(facadeGate.multiChildAcceptedRustApis, [
        "TestRendererRoot::describe_private_to_tree_host_shape_from_snapshot_for_diagnostics",
        "TestRendererRoot::describe_private_to_tree_composite_above_host_shape_from_snapshot_for_diagnostics",
        "TestRendererCommittedFiberTreeInspection::host_child_tags",
        "TestRendererCommittedFiberTreeInspection::has_function_component_wrapper",
        "TestRendererPrivateTreeRenderedRoot",
        "TestRendererPrivateTreeRenderedHostComponent",
        "TestRendererPrivateTreeRenderedFunctionComponent"
      ]);
      assert.deepEqual(facadeGate.multiChildAcceptedRustTests, [
        "root_private_to_tree_shape_diagnostics_serialize_multiple_host_children_and_text_siblings",
        "root_private_to_tree_shape_diagnostics_wrap_composite_above_multi_child_host_output"
      ]);
    }
    assert.deepEqual(facadeGate.blockedPublicSurfaces, [
      "create().toTree",
      "create().toJSON",
      "create().root",
      "ReactTestInstance",
      "public-js-react-test-renderer-routing",
      "compatibility-claim"
    ]);

    const descriptor = Object.getOwnPropertyDescriptor(
      renderer.toTree,
      privateToTreeHostOutputMetadataSymbol
    );
    assert.notEqual(descriptor, undefined);
    assert.equal(descriptor.enumerable, false);
    assert.equal(descriptor.configurable, false);
    assert.equal(descriptor.writable, false);
    const privateMetadata = descriptor.value;
    assert.equal(Object.isFrozen(privateMetadata), true);
    assert.equal(
      privateMetadata.id,
      "react-test-renderer-totree-private-host-output-metadata"
    );
    assert.equal(privateMetadata.status, privateToTreeHostOutputMetadataStatus);
    assert.equal(privateMetadata.entrypoint, entry.entrypoint);
    assert.equal(privateMetadata.publicSurface, "create().toTree");
    assert.equal(
      privateMetadata.symbol,
      privateToTreeHostOutputMetadataSymbol.description
    );
    assert.equal(privateMetadata.gate, metadataGate);
    assert.equal(privateMetadata.rootRequest, error.rootRequest);
    assert.equal(privateMetadata.privateHostOutputTreeMetadataAvailable, true);
    assert.equal(privateMetadata.privateCompositeFunctionMetadataAvailable, true);
    if (entry.entrypoint.endsWith(".development")) {
      assert.equal(
        privateMetadata.privateMultiChildHostOutputTreeMetadataAvailable,
        true
      );
    }
    assert.equal(privateMetadata.publicTreeAvailable, false);
    assert.equal(privateMetadata.publicRouteAvailable, false);
    assert.equal(privateMetadata.nativeBridgeAvailable, false);
    assert.equal(privateMetadata.nativeExecution, false);
    assert.equal(privateMetadata.compatibilityClaimed, false);
    assert.equal(
      typeof privateMetadata.describeAcceptedHostOutputDiagnostic,
      "function"
    );
    assert.equal(
      typeof privateMetadata.canDescribeAcceptedHostOutputDiagnostic,
      "function"
    );

    const shape = privateMetadata.describeAcceptedHostOutputDiagnostic(
      createAcceptedMinimalTreeMetadataDiagnostic()
    );
    assert.equal(Object.isFrozen(shape), true);
    assert.equal(
      shape.id,
      "react-test-renderer-private-totree-minimal-host-output-metadata"
    );
    assert.equal(shape.status, privateToTreeHostOutputMetadataStatus);
    assert.equal(shape.publicSurface, "create().toTree");
    assert.deepEqual(shape.acceptedMinimalFiberShape, [
      "HostRoot",
      "HostComponent",
      "HostText"
    ]);
    assert.deepEqual(
      shape.acceptedCompositeFiberShape,
      privateToTreeCompositeAcceptedFiberShape
    );
    assert.deepEqual(shape.traversal.order, [
      "HostRoot",
      "FunctionComponent",
      "HostComponent",
      "HostText"
    ]);
    assert.deepEqual(shape.traversal.committedHostOutputOrder, [
      "HostRoot",
      "HostComponent",
      "HostText"
    ]);
    assert.equal(
      shape.traversal.functionComponentProducesComponentNodeMetadata,
      true
    );
    assert.equal(
      shape.traversal.functionComponentRendersCommittedHostOutput,
      true
    );
    assert.equal(shape.hostRoot.fiberTag, "HostRoot");
    assert.equal(shape.hostRoot.delegatesToChild, true);
    assert.equal(shape.hostRoot.childFiberTag, "HostComponent");
    assert.equal(shape.hostRoot.compositeChildFiberTag, "FunctionComponent");
    assert.equal(shape.hostRoot.publicTreeObject, false);
    assert.deepEqual(shape.functionComponent, {
      fiberTag: "FunctionComponent",
      source: "ReactTestRenderer.js toTree FunctionComponent",
      treeNodeType: "component",
      componentType: privateToTreeFunctionComponentType,
      props: {},
      instanceAvailable: false,
      renderedChildFiberTag: "HostComponent",
      renderedChildNodeType: "host",
      renderedChildCount: 1,
      wrapsCommittedHostOutput: true,
      publicTreeObject: false
    });
    assert.deepEqual(shape.hostComponent, {
      fiberTag: "HostComponent",
      source: "ReactTestRenderer.js toTree HostComponent",
      treeNodeType: "host",
      elementType: "span",
      props: {},
      renderedChildCount: 1,
      renderedText: "hello",
      publicTreeObject: false
    });
    assert.deepEqual(shape.hostText, {
      fiberTag: "HostText",
      source: "ReactTestRenderer.js toTree HostText",
      text: "hello",
      returnsTextValue: true,
      publicTreeObject: false
    });
    assert.equal(shape.publicTreeObjectAvailable, false);
    assert.equal(Object.hasOwn(shape.functionComponent, "rendered"), false);
    assert.equal(Object.hasOwn(shape.functionComponent, "instance"), false);
    assert.equal(Object.hasOwn(shape.hostComponent, "rendered"), false);
    assert.equal(Object.hasOwn(shape.hostComponent, "instance"), false);
    assert.equal(
      privateMetadata.canDescribeAcceptedHostOutputDiagnostic(
        createAcceptedMinimalTreeMetadataDiagnostic()
      ),
      true
    );

    const rejectedDiagnostic = createAcceptedMinimalTreeMetadataDiagnostic();
    rejectedDiagnostic.publicBlockers.treeMethodBlocked = false;
    assert.equal(
      privateMetadata.canDescribeAcceptedHostOutputDiagnostic(
        rejectedDiagnostic
      ),
      false
    );
    const privateError = captureThrown(() =>
      privateMetadata.describeAcceptedHostOutputDiagnostic(rejectedDiagnostic)
    );
    assert.equal(
      privateError.name,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assert.equal(
      privateError.code,
      "FAST_REACT_TEST_RENDERER_PRIVATE_TOTREE_METADATA"
    );
    assert.equal(privateError.entrypoint, entry.entrypoint);
    assert.equal(privateError.exportName, "create().toTree");
    assert.equal(privateError.publicTreeAvailable, false);
    assert.equal(privateError.nativeBridgeAvailable, false);
    assert.equal(privateError.nativeExecution, false);
    assert.equal(privateError.compatibilityClaimed, false);

    const facadeDescriptor = Object.getOwnPropertyDescriptor(
      renderer.toTree,
      privateToTreeFacadeSymbol
    );
    assert.notEqual(facadeDescriptor, undefined);
    assert.equal(facadeDescriptor.enumerable, false);
    assert.equal(facadeDescriptor.configurable, false);
    assert.equal(facadeDescriptor.writable, false);
    const privateFacade = facadeDescriptor.value;
    assert.equal(Object.isFrozen(privateFacade), true);
    assert.equal(privateFacade.id, "react-test-renderer-totree-private-facade");
    assert.equal(privateFacade.status, privateToTreeFacadeStatus);
    assert.equal(privateFacade.entrypoint, entry.entrypoint);
    assert.equal(privateFacade.publicSurface, "create().toTree");
    assert.equal(privateFacade.symbol, privateToTreeFacadeSymbol.description);
    assert.equal(privateFacade.gate, error.toTreePrivateFacadeGate);
    assert.equal(privateFacade.metadataGate, metadataGate);
    assert.equal(privateFacade.rootRequest, error.rootRequest);
    assert.equal(privateFacade.privateTreeMetadataSerializable, true);
    assert.equal(privateFacade.privateCompositeFunctionMetadataSerializable, true);
    if (entry.entrypoint.endsWith(".development")) {
      assert.equal(privateFacade.privateMultiChildTreeMetadataSerializable, true);
    }
    assert.equal(privateFacade.publicTreeAvailable, false);
    assert.equal(privateFacade.publicRouteAvailable, false);
    assert.equal(privateFacade.nativeBridgeAvailable, false);
    assert.equal(privateFacade.nativeExecution, false);
    assert.equal(privateFacade.compatibilityClaimed, false);
    assert.equal(typeof privateFacade.serializeAcceptedTreeMetadata, "function");
    assert.equal(typeof privateFacade.canSerializeAcceptedTreeMetadata, "function");

    const privateTree = privateFacade.serializeAcceptedTreeMetadata(
      createAcceptedMinimalTreeMetadataDiagnostic()
    );
    assert.equal(Object.isFrozen(privateTree), true);
    assert.equal(Object.isFrozen(privateTree.props), true);
    assert.equal(Object.isFrozen(privateTree.rendered), true);
    assert.equal(Object.isFrozen(privateTree.rendered.props), true);
    assert.equal(Object.isFrozen(privateTree.rendered.rendered), true);
    assert.deepEqual(privateTree, {
      nodeType: "component",
      type: privateToTreeFunctionComponentType,
      props: {},
      instance: null,
      rendered: {
        nodeType: "host",
        type: "span",
        props: {},
        instance: null,
        rendered: ["hello"]
      }
    });
    const updatedPrivateTree = privateFacade.serializeAcceptedTreeMetadata(
      createAcceptedMinimalTreeMetadataDiagnostic({
        hostOutputUpdateKind: "Update",
        text: "goodbye"
      })
    );
    assert.deepEqual(updatedPrivateTree, {
      nodeType: "component",
      type: privateToTreeFunctionComponentType,
      props: {},
      instance: null,
      rendered: {
        nodeType: "host",
        type: "span",
        props: {},
        instance: null,
        rendered: ["goodbye"]
      }
    });
    if (entry.entrypoint.endsWith(".development")) {
      const multiChildShape = privateMetadata.describeAcceptedHostOutputDiagnostic(
        createAcceptedMultiChildTreeMetadataDiagnostic()
      );
      assert.equal(Object.isFrozen(multiChildShape), true);
      assert.equal(
        multiChildShape.id,
        "react-test-renderer-private-totree-multi-child-host-output-metadata"
      );
      assert.deepEqual(
        multiChildShape.acceptedMultiChildFiberShape,
        privateToTreeMultiChildAcceptedFiberShape
      );
      assert.deepEqual(
        multiChildShape.acceptedCompositeMultiChildFiberShape,
        privateToTreeCompositeMultiChildAcceptedFiberShape
      );
      assert.deepEqual(multiChildShape.traversal.order, [
        "HostRoot",
        "HostText",
        "HostComponent",
        "HostText"
      ]);
      assert.equal(
        multiChildShape.traversal.hostRootReturnsArrayForMultipleChildren,
        true
      );
      assert.equal(multiChildShape.hostRoot.rootChildCount, 2);
      assert.deepEqual(multiChildShape.committedFiberInspection, {
        diagnosticName: privateToTreeCommittedFiberInspectionDiagnosticName,
        sourceTreeDiagnosticName: privateToTreeAcceptedDiagnosticName,
        fiberShape: privateToTreeMultiChildAcceptedFiberShape,
        rootChildFiberTags: ["HostText", "HostComponent"],
        hostChildFiberTags: ["HostText", "HostComponent"],
        rootChildCount: 2,
        hostChildCount: 2,
        hostComponentCount: 1,
        hostTextCount: 2,
        functionComponentFiberTag: null,
        functionComponentPresent: false,
        wrapsCommittedHostOutput: false,
        publicTreeObjectAvailable: false,
        compatibilityClaimed: false
      });
      assert.equal(Object.isFrozen(multiChildShape.hostChildren), true);
      assert.deepEqual(multiChildShape.hostChildren[0], {
        fiberTag: "HostText",
        source: "ReactTestRenderer.js toTree HostText",
        text: "first sibling",
        returnsTextValue: true,
        publicTreeObject: false
      });
      assert.deepEqual(multiChildShape.hostChildren[1], {
        fiberTag: "HostComponent",
        source: "ReactTestRenderer.js toTree HostComponent",
        treeNodeType: "host",
        elementType: "span",
        props: {},
        instanceAvailable: false,
        renderedChildCount: 1,
        renderedChildren: [
          {
            fiberTag: "HostText",
            source: "ReactTestRenderer.js toTree HostText",
            text: "second sibling",
            returnsTextValue: true,
            publicTreeObject: false
          }
        ],
        publicTreeObject: false
      });

      const multiChildPrivateTree = privateFacade.serializeAcceptedTreeMetadata(
        createAcceptedMultiChildTreeMetadataDiagnostic()
      );
      assert.equal(Object.isFrozen(multiChildPrivateTree), true);
      assert.equal(Object.isFrozen(multiChildPrivateTree[1]), true);
      assert.equal(Object.isFrozen(multiChildPrivateTree[1].props), true);
      assert.equal(Object.isFrozen(multiChildPrivateTree[1].rendered), true);
      assert.deepEqual(multiChildPrivateTree, [
        "first sibling",
        {
          nodeType: "host",
          type: "span",
          props: {},
          instance: null,
          rendered: ["second sibling"]
        }
      ]);

      const compositeMultiChildShape =
        privateMetadata.describeAcceptedHostOutputDiagnostic(
          createAcceptedMultiChildTreeMetadataDiagnostic({
            composite: true
          })
        );
      assert.deepEqual(compositeMultiChildShape.committedFiberInspection, {
        diagnosticName: privateToTreeCommittedFiberInspectionDiagnosticName,
        sourceTreeDiagnosticName: privateToTreeAcceptedDiagnosticName,
        fiberShape: privateToTreeCompositeMultiChildAcceptedFiberShape,
        rootChildFiberTags: ["FunctionComponent"],
        hostChildFiberTags: ["HostText", "HostComponent"],
        rootChildCount: 1,
        hostChildCount: 2,
        hostComponentCount: 1,
        hostTextCount: 2,
        functionComponentFiberTag: "FunctionComponent",
        functionComponentPresent: true,
        wrapsCommittedHostOutput: true,
        publicTreeObjectAvailable: false,
        compatibilityClaimed: false
      });

      const compositeMultiChildPrivateTree =
        privateFacade.serializeAcceptedTreeMetadata(
          createAcceptedMultiChildTreeMetadataDiagnostic({
            composite: true
          })
        );
      assert.equal(Object.isFrozen(compositeMultiChildPrivateTree), true);
      assert.equal(
        Object.isFrozen(compositeMultiChildPrivateTree.rendered),
        true
      );
      assert.deepEqual(compositeMultiChildPrivateTree, {
        nodeType: "component",
        type: privateToTreeFunctionComponentType,
        props: {},
        instance: null,
        rendered: [
          "first sibling",
          {
            nodeType: "host",
            type: "span",
            props: {},
            instance: null,
            rendered: ["second sibling"]
          }
        ]
      });

      const staleMultiChildTreeMetadata =
        createAcceptedMultiChildTreeMetadataDiagnostic({
          hostOutputSnapshotCurrent: false
        });
      assert.equal(
        privateFacade.canSerializeAcceptedTreeMetadata(staleMultiChildTreeMetadata),
        false
      );
    }
    assert.equal(
      privateFacade.canSerializeAcceptedTreeMetadata(
        createAcceptedMinimalTreeMetadataDiagnostic()
      ),
      true
    );
    assert.equal(
      privateFacade.canSerializeAcceptedTreeMetadata(
        createAcceptedMinimalHostOutputDiagnostic()
      ),
      false
    );

    const staleTreeMetadata = createAcceptedMinimalTreeMetadataDiagnostic({
      hostOutputSnapshotCurrent: false
    });
    assert.equal(
      privateFacade.canSerializeAcceptedTreeMetadata(staleTreeMetadata),
      false
    );
    const staleTreeError = captureThrown(() =>
      privateFacade.serializeAcceptedTreeMetadata(staleTreeMetadata)
    );
    assert.equal(
      staleTreeError.name,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assert.match(staleTreeError.message, /hostOutputSnapshotCurrent to be true/u);

    const compositeTreeMetadata = createAcceptedMinimalTreeMetadataDiagnostic();
    compositeTreeMetadata.hostComponent.nodeType = "component";
    assert.equal(
      privateFacade.canSerializeAcceptedTreeMetadata(compositeTreeMetadata),
      false
    );
    const compositeTreeError = captureThrown(() =>
      privateFacade.serializeAcceptedTreeMetadata(compositeTreeMetadata)
    );
    assert.equal(
      compositeTreeError.name,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assert.match(compositeTreeError.message, /nodeType to be host/u);
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

function createCommittedFiberInspectionDiagnostic({
  fiberShape,
  rootChildFiberTags,
  hostChildFiberTags,
  rootChildCount,
  hostChildCount,
  hostTextCount,
  functionComponentPresent,
  wrapsCommittedHostOutput
}) {
  return {
    diagnosticName: privateToTreeCommittedFiberInspectionDiagnosticName,
    sourceTreeDiagnosticName: privateToTreeAcceptedDiagnosticName,
    fiberShape,
    rootChildFiberTags,
    hostChildFiberTags,
    rootChildCount,
    hostChildCount,
    hostComponentCount: 1,
    hostTextCount,
    functionComponentFiberTag: functionComponentPresent
      ? "FunctionComponent"
      : null,
    functionComponentPresent,
    wrapsCommittedHostOutput,
    publicTreeObjectAvailable: false,
    compatibilityClaimed: false
  };
}

function captureThrown(callback) {
  try {
    callback();
  } catch (error) {
    return error;
  }

  assert.fail("Expected callback to throw");
}

function createAcceptedMinimalHostOutputDiagnostic({
  hostOutputSnapshotCurrent = true,
  hostOutputUpdateKind = "Create",
  propsAttributes = {},
  text = "hello"
} = {}) {
  const diagnostic = {
    diagnosticName: "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind,
    hostOutputSnapshotCurrent,
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
          attributes: propsAttributes,
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
        text,
        hidden: false,
        detached: false
      }
    ],
    component: {
      nodeKind: "HostComponent",
      elementType: { name: "span" },
      props: {
        attributes: propsAttributes,
        textContent: null
      },
      hidden: false,
      detached: false,
      childCount: 1,
      textChild: {
        nodeKind: "Text",
        text,
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
  attachToJSONUpdateUnmountRow(diagnostic, {
    previousRootChildCount: 1,
    currentRootChildCount: 1
  });
  return diagnostic;
}

function createAcceptedBroaderHostOutputDiagnostic({
  hostOutputSnapshotCurrent = true,
  hostOutputUpdateKind = "Create"
} = {}) {
  const diagnostic = {
    diagnosticName: "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind,
    hostOutputSnapshotCurrent,
    rootChildCount: 3,
    rootNodeKind: "MultipleHostChildren",
    nodes: [
      {
        ordinal: 0,
        nodeKind: "HostComponent",
        parentOrdinal: null,
        childOrdinals: [1],
        elementType: { name: "div" },
        props: {
          attributes: {
            children: "prop child",
            id: "first"
          },
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
        text: "one",
        hidden: false,
        detached: false
      },
      {
        ordinal: 2,
        nodeKind: "Text",
        parentOrdinal: null,
        childOrdinals: [],
        elementType: null,
        props: null,
        text: "tail",
        hidden: false,
        detached: false
      },
      {
        ordinal: 3,
        nodeKind: "HostComponent",
        parentOrdinal: null,
        childOrdinals: [4, 5],
        elementType: { name: "span" },
        props: {
          attributes: {
            className: "tag"
          },
          textContent: null
        },
        text: null,
        hidden: false,
        detached: false
      },
      {
        ordinal: 4,
        nodeKind: "Text",
        parentOrdinal: 3,
        childOrdinals: [],
        elementType: null,
        props: null,
        text: "two",
        hidden: false,
        detached: false
      },
      {
        ordinal: 5,
        nodeKind: "Text",
        parentOrdinal: 3,
        childOrdinals: [],
        elementType: null,
        props: null,
        text: "three",
        hidden: false,
        detached: false
      }
    ],
    publicBlockers: createAcceptedPrivateJsonPublicBlockers()
  };
  attachToJSONUpdateUnmountRow(diagnostic, {
    previousRootChildCount: 3,
    currentRootChildCount: 3
  });
  return diagnostic;
}

function createAcceptedEmptyRootHostOutputDiagnostic({
  hostOutputSnapshotCurrent = true,
  hostOutputUpdateKind = "Create"
} = {}) {
  const diagnostic = {
    diagnosticName: "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind,
    hostOutputSnapshotCurrent,
    rootChildCount: 0,
    rootNodeKind: "EmptyRoot",
    nodes: [],
    publicBlockers: createAcceptedPrivateJsonPublicBlockers()
  };
  attachToJSONUpdateUnmountRow(diagnostic, {
    previousRootChildCount: hostOutputUpdateKind === "Unmount" ? 1 : 0,
    currentRootChildCount: 0
  });
  return diagnostic;
}

function attachToJSONUpdateUnmountRow(
  diagnostic,
  { previousRootChildCount, currentRootChildCount }
) {
  if (diagnostic.hostOutputUpdateKind === "Create") {
    return;
  }
  diagnostic.hostOutputRow = createAcceptedToJSONUpdateUnmountRow({
    hostOutputUpdateKind: diagnostic.hostOutputUpdateKind,
    previousRootChildCount,
    currentRootChildCount
  });
}

function createAcceptedToJSONUpdateUnmountRow({
  hostOutputUpdateKind,
  previousRootChildCount,
  currentRootChildCount
}) {
  const rowId =
    hostOutputUpdateKind === "Unmount"
      ? privateToJSONUnmountHostOutputRowId
      : privateToJSONUpdateHostOutputRowId;
  return {
    id: rowId,
    status: privateToJSONUpdateUnmountRowStatus,
    hostOutputUpdateKind,
    previousRootChildCount,
    currentRootChildCount,
    dependencyMetadata: {
      acceptedPrivateDiagnosticDependencyIds:
        privateToJSONUpdateUnmountDependencyIds,
      updateRouteDiagnosticsAvailable: true,
      unmountRouteDiagnosticsAvailable: true,
      serializationDiagnosticsAvailable: true,
      hostOutputSnapshotFreshnessRequired: true,
      staleSnapshotRejection: true,
      mismatchedUpdateUnmountRecordRejection: true,
      publicToJSONAvailable: false,
      publicTestInstanceAvailable: false,
      nativeExecutionAvailable: false,
      compatibilityClaimed: false
    },
    publicToJSONAvailable: false,
    publicTestInstanceAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  };
}

function createAcceptedPrivateJsonPublicBlockers() {
  return {
    jsonMethodBlocked: true,
    treeMethodBlocked: true,
    instanceWrapperBlocked: true,
    jsFacadeRoutingBlocked: true,
    publicActBlocked: true,
    compatibilityClaimBlocked: true
  };
}

function createAcceptedMinimalTreeMetadataDiagnostic({
  hostOutputSnapshotCurrent = true,
  hostOutputUpdateKind = "Create",
  text = "hello"
} = {}) {
  const diagnostic = {
    diagnosticName: privateToTreeAcceptedDiagnosticName,
    sourceJsonDiagnosticName:
      "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind,
    hostOutputSnapshotCurrent,
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
    acceptedFiberShape: ["HostRoot", "HostComponent", "HostText"],
    acceptedCompositeFiberShape: privateToTreeCompositeAcceptedFiberShape,
    rootChildCount: 1,
    hostRoot: {
      fiberTag: "HostRoot",
      delegatesToChild: true,
      childFiberTag: "HostComponent",
      publicTreeObjectAvailable: false
    },
    functionComponent: {
      fiberTag: "FunctionComponent",
      nodeType: "component",
      componentType: privateToTreeFunctionComponentType,
      props: {
        attributes: {},
        textContent: null
      },
      instanceAvailable: false,
      renderedChildFiberTag: "HostComponent",
      renderedChildNodeType: "host",
      renderedChildCount: 1,
      wrapsCommittedHostOutput: true,
      publicTreeObjectAvailable: false
    },
    hostComponent: {
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
    hostText: {
      fiberTag: "HostText",
      text,
      returnsTextValue: true,
      publicTreeObjectAvailable: false
    },
    committedFiberInspection: createCommittedFiberInspectionDiagnostic({
      fiberShape: ["HostRoot", "HostComponent", "HostText"],
      rootChildFiberTags: ["HostComponent"],
      hostChildFiberTags: ["HostComponent"],
      rootChildCount: 1,
      hostChildCount: 1,
      hostTextCount: 1,
      functionComponentPresent: false,
      wrapsCommittedHostOutput: false
    }),
    publicBlockers: {
      jsonMethodBlocked: true,
      treeMethodBlocked: true,
      instanceWrapperBlocked: true,
      jsFacadeRoutingBlocked: true,
      publicActBlocked: true,
      compatibilityClaimBlocked: true
    },
    publicTreeObjectAvailable: false
  };
  attachToJSONUpdateUnmountRow(diagnostic, {
    previousRootChildCount: 1,
    currentRootChildCount: 1
  });
  return diagnostic;
}

function createAcceptedMultiChildTreeMetadataDiagnostic({
  composite = false,
  hostOutputSnapshotCurrent = true,
  hostOutputUpdateKind = "Create"
} = {}) {
  const report = {
    diagnosticName: privateToTreeAcceptedDiagnosticName,
    sourceJsonDiagnosticName:
      "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind,
    hostOutputSnapshotCurrent,
    acceptedFiberShape: privateToTreeMultiChildAcceptedFiberShape,
    acceptedMultiChildFiberShape: privateToTreeMultiChildAcceptedFiberShape,
    acceptedCompositeMultiChildFiberShape:
      privateToTreeCompositeMultiChildAcceptedFiberShape,
    rootChildCount: 2,
    hostRoot: {
      fiberTag: "HostRoot",
      delegatesToChild: true,
      childFiberTags: ["HostText", "HostComponent"],
      publicTreeObjectAvailable: false
    },
    hostChildren: [
      {
        fiberTag: "HostText",
        text: "first sibling",
        returnsTextValue: true,
        publicTreeObjectAvailable: false
      },
      {
        fiberTag: "HostComponent",
        nodeType: "host",
        elementType: { name: "span" },
        props: {
          attributes: {},
          textContent: null
        },
        instanceAvailable: false,
        renderedChildCount: 1,
        renderedChildren: [
          {
            fiberTag: "HostText",
            text: "second sibling",
            returnsTextValue: true,
            publicTreeObjectAvailable: false
          }
        ],
        publicTreeObjectAvailable: false
      }
    ],
    committedFiberInspection: createCommittedFiberInspectionDiagnostic({
      fiberShape: composite
        ? privateToTreeCompositeMultiChildAcceptedFiberShape
        : privateToTreeMultiChildAcceptedFiberShape,
      rootChildFiberTags: composite
        ? ["FunctionComponent"]
        : ["HostText", "HostComponent"],
      hostChildFiberTags: ["HostText", "HostComponent"],
      rootChildCount: composite ? 1 : 2,
      hostChildCount: 2,
      hostTextCount: 2,
      functionComponentPresent: composite,
      wrapsCommittedHostOutput: composite
    }),
    publicBlockers: {
      jsonMethodBlocked: true,
      treeMethodBlocked: true,
      instanceWrapperBlocked: true,
      jsFacadeRoutingBlocked: true,
      publicActBlocked: true,
      compatibilityClaimBlocked: true
    },
    publicTreeObjectAvailable: false
  };

  if (composite) {
    report.functionComponent = {
      fiberTag: "FunctionComponent",
      nodeType: "component",
      componentType: privateToTreeFunctionComponentType,
      props: {
        attributes: {},
        textContent: null
      },
      instanceAvailable: false,
      renderedChildFiberTags: ["HostText", "HostComponent"],
      renderedChildCount: 2,
      wrapsCommittedHostOutput: true,
      publicTreeObjectAvailable: false
    };
  }

  return report;
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
