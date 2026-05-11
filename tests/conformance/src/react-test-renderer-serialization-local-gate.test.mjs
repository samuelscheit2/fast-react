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
const packageRootEntrypoint = "react-test-renderer";
function hasSiblingTextPrivateAdmission(entry) {
  return (
    entry.entrypoint === packageRootEntrypoint ||
    entry.entrypoint.includes("/cjs/")
  );
}
function hasPackageRootOrCjsPrivateAdmission(entry) {
  return (
    entry.entrypoint === packageRootEntrypoint ||
    entry.entrypoint.includes("/cjs/")
  );
}
function hasPackageRootOrDevelopmentRows(entry) {
  return (
    entry.entrypoint === packageRootEntrypoint ||
    entry.entrypoint.endsWith(".development")
  );
}
const expectedToJSONFacadeRustApis = [
  "TestRendererRoot::describe_private_json_serialization_for_canary",
  "TestRendererRoot::describe_private_json_serialization_after_update_for_canary",
  "TestRendererRoot::describe_private_to_json_facade_result_for_canary",
  "TestRendererRoot::describe_private_to_json_facade_result_after_update_for_canary",
  "TestRendererRoot::describe_private_to_json_finished_work_identity_gate_for_canary",
  "TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics",
  "TestRendererPrivateJsonSerializationReport",
  "TestRendererPrivateJsonRenderedRoot",
  "TestRendererPrivateToJsonFacadeResult",
  "TestRendererPrivateSerializationFinishedWorkIdentityGate",
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
  "root_private_to_json_facade_result_canary_wraps_update_serialization_evidence",
  "root_private_to_json_serialization_finished_work_identity_gate_accepts_committed_handoff",
  "root_private_to_json_update_serialization_finished_work_identity_gate_accepts_committed_handoff",
  "root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence",
  "root_private_serialization_finished_work_identity_gate_rejects_missing_evidence",
  "root_private_serialization_finished_work_identity_gate_rejects_foreign_evidence",
  "root_private_serialization_finished_work_identity_gate_rejects_stale_evidence",
  "root_private_serialization_finished_work_identity_gate_rejects_non_committed_identity",
  "root_private_serialization_finished_work_identity_gate_rejects_lane_mismatch"
];
const privateToJSONSerializationFacadeSymbol = Symbol.for(
  "fast.react_test_renderer.private_tojson_serialization_facade"
);
const rootRequestBridgeSymbol = Symbol.for(
  "fast.react_test_renderer.root_request_bridge"
);
const privateToJSONSerializationStatus =
  "private-host-output-diagnostics-serializable-public-tojson-blocked";
const privateToJSONFacadeResultStatus =
  "private-tojson-facade-result-backed-by-rust-host-output-public-blocked";
const privateSerializationFinishedWorkIdentityDiagnosticName =
  "fast-react-test-renderer.serialization.private-finished-work-identity";
const privateSerializationFinishedWorkIdentityStatus =
  "private-serialization-finished-work-identity-validated-public-serialization-blocked";
const privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName =
  "fast-react-test-renderer.tojson.sibling-text.finished-work-identity";
const privateToJSONSiblingTextFinishedWorkIdentityStatus =
  "private-tojson-sibling-text-finished-work-identity-validated-public-tojson-blocked";
const privateToJSONSiblingTextJSAdmissionDiagnosticName =
  "fast-react-test-renderer.tojson.sibling-text.private-js-cjs-admission";
const privateToJSONSiblingTextJSAdmissionStatus =
  "private-tojson-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked";
const privateToTreeSiblingTextJSAdmissionDiagnosticName =
  "fast-react-test-renderer.totree.sibling-text.private-js-cjs-admission";
const privateToTreeSiblingTextJSAdmissionStatus =
  "private-totree-sibling-text-js-cjs-diagnostic-consumes-identity-public-blocked";
const privateRootFinishedLanesHandoffDiagnosticName =
  "react-test-renderer-root-finished-lanes-handoff-private-diagnostic";
const privateRootFinishedLanesHandoffStatus =
  "private-root-finished-work-lanes-handoff-public-serialization-native-blocked";
const privateRootFinishedLanesHandoffAliasKeys = [
  "root_finished_lanes_handoff",
  "finishedLanesHandoff",
  "finished_lanes_handoff",
  "finishedWorkHandoff",
  "finished_work_handoff"
];
const privateToJSONUpdateHostOutputRowId =
  "react-test-renderer-tojson-update-host-output-private-diagnostic";
const privateToJSONNestedUpdateHostOutputRowId =
  "react-test-renderer-tojson-nested-host-output-update-private-diagnostic";
const privateToJSONSiblingTextHostOutputRowId =
  "react-test-renderer-tojson-sibling-text-host-output-private-diagnostic";
const privateToJSONUnmountHostOutputRowId =
  "react-test-renderer-tojson-unmount-host-output-private-diagnostic";
const privateToJSONUpdateUnmountRowStatus =
  "private-tojson-update-unmount-host-output-rows-public-tojson-blocked";
const privateToJSONUpdateUnmountDependencyIds = [
  "react-test-renderer-update-route-private-diagnostic",
  "react-test-renderer-unmount-route-private-diagnostic",
  "react-test-renderer-serialization-private-json-diagnostic"
];
const privateUnmountDeletionCommitHandoffDiagnosticId =
  "react-test-renderer-unmount-deletion-commit-handoff-private-diagnostic";
const privateUnmountDeletionCommitHandoffStatus =
  "private-unmount-deletion-commit-handoff-public-unmount-blocked";
const privateUnmountNativeBridgeAdmissionDiagnosticId =
  "react-test-renderer-unmount-native-bridge-admission-private-diagnostic";
const privateUnmountNativeBridgeAdmissionStatus =
  "private-unmount-native-bridge-admission-public-unmount-blocked";
const privateUnmountNativeBridgeCleanupHandoffDiagnosticId =
  "react-test-renderer-unmount-native-bridge-cleanup-handoff-private-diagnostic";
const privateUnmountNativeBridgeCleanupHandoffStatus =
  "private-unmount-native-bridge-cleanup-handoff-public-unmount-blocked";
const privateUnmountPassiveRefCleanupOrderDiagnosticId =
  "react-test-renderer-unmount-passive-ref-cleanup-order-private-diagnostic";
const privateUnmountPassiveRefCleanupOrderStatus =
  "private-unmount-passive-ref-cleanup-order-public-unmount-blocked";
const rootLifecycleUnmountScheduled = "UnmountScheduled";
const rootUpdateKindUnmount = "Unmount";
const rootUpdateOutcomeScheduled = "Scheduled";
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
    privateToJSONFinishedWorkIdentityGatePresent: true,
    privateToJSONSerializationFacadePubliclyBlocked: true,
    privateToTreeHostOutputMetadataGatePresent: true,
    privateToTreePrivateFacadeGatePresent: true,
    privateToTreePrivateFacadeConsumesRustTreeMetadata: true,
    privateToTreeHostOutputMetadataRecognizesMinimalShape: true,
    privateToTreeCompositeFunctionMetadataPresent: true,
    privateToTreeMultiChildMetadataPresent: true,
    privateToTreeCommittedFiberInspectionShapeDiagnosticsPresent: true,
    privateToTreeFinishedWorkIdentityGatePresent: true,
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
      "js-tojson-finished-work-identity-gate",
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
      "js-totree-finished-work-identity-gate",
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
    assert.equal(facadeGate.privateFinishedWorkIdentityGateAvailable, true);
    assert.equal(facadeGate.privateUpdateFinishedWorkIdentityGateAvailable, true);
    if (hasPackageRootOrCjsPrivateAdmission(entry)) {
      assert.equal(
        facadeGate.privateUnmountFinishedWorkIdentityGateAvailable,
        true
      );
      assert.equal(
        facadeGate.unmountNativeExecutionFinishedWorkIdentityAdmissionWorker,
        "worker-733-test-renderer-unmount-finished-work-identity"
      );
      assert.equal(
        facadeGate.unmountNativeExecutionRequiresFinishedWorkIdentity,
        true
      );
      assert.equal(facadeGate.rejectsStaleUnmountFinishedWorkIdentity, true);
      assert.equal(
        facadeGate.requiresUnmountDeletionCleanupHandoffEvidence,
        true
      );
    }
    assert.equal(facadeGate.validatesUpdateRootRequestIdentity, true);
    assert.equal(
      facadeGate.privateFinishedWorkIdentityDiagnosticName,
      privateSerializationFinishedWorkIdentityDiagnosticName
    );
    assert.equal(
      facadeGate.privateFinishedWorkIdentityStatus,
      privateSerializationFinishedWorkIdentityStatus
    );
    assert.equal(
      facadeGate.consumesCommittedHostRootFinishedWorkIdentity,
      true
    );
    assert.equal(facadeGate.consumesCommittedHostRootFinishedWorkLanes, true);
    if (hasSiblingTextPrivateAdmission(entry)) {
      assert.equal(
        facadeGate.privateSiblingTextFinishedWorkIdentityGateAvailable,
        true
      );
      assert.equal(
        facadeGate.privateSiblingTextFinishedWorkIdentityDiagnosticName,
        privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName
      );
      assert.equal(
        facadeGate.privateSiblingTextFinishedWorkIdentityStatus,
        privateToJSONSiblingTextFinishedWorkIdentityStatus
      );
      assert.equal(
        facadeGate.privateSiblingTextJSAdmissionDiagnosticName,
        privateToJSONSiblingTextJSAdmissionDiagnosticName
      );
      assert.equal(
        facadeGate.privateSiblingTextJSAdmissionStatus,
        privateToJSONSiblingTextJSAdmissionStatus
      );
      assert.equal(
        facadeGate.siblingTextJSAdmissionConsumesDedicatedIdentity,
        true
      );
      assert.equal(facadeGate.rejectsGenericSiblingTextFinishedWorkIdentity, true);
      assert.equal(facadeGate.rejectsBroadMultichildFinishedWorkIdentity, true);
    }
    if (hasPackageRootOrCjsPrivateAdmission(entry)) {
      assert.equal(
        facadeGate.siblingTextJSAdmissionConsumesRootFinishedLanesHandoff,
        true
      );
      assert.equal(
        facadeGate.siblingTextJSAdmissionConsumesCommittedFiberInspection,
        true
      );
      assert.equal(
        facadeGate.rejectsMissingSiblingTextCommittedFiberInspection,
        true
      );
      assert.equal(
        facadeGate.rejectsInvalidSiblingTextCommittedFiberInspection,
        true
      );
    }
    if (hasPackageRootOrDevelopmentRows(entry)) {
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
    if (
      entry.entrypoint.includes("/cjs/") &&
      !entry.entrypoint.endsWith(".development")
    ) {
      expectedRustTests.splice(
        expectedRustTests.indexOf(
          "root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence"
        ),
        0,
        "root_private_to_json_update_native_execution_requires_finished_work_identity_gate"
      );
      expectedRustTests.splice(
        expectedRustTests.indexOf(
          "root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence"
        ),
        0,
        "root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate"
      );
      expectedHostOutputUpdateKinds.push("Unmount");
    }
    if (hasPackageRootOrDevelopmentRows(entry)) {
      const expectedFinishedWorkIdentityTests = [
        "root_private_to_json_serialization_finished_work_identity_gate_accepts_committed_handoff",
        "root_private_to_json_update_serialization_finished_work_identity_gate_accepts_committed_handoff",
        "root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence",
        "root_private_serialization_finished_work_identity_gate_rejects_missing_evidence",
        "root_private_serialization_finished_work_identity_gate_rejects_foreign_evidence",
        "root_private_serialization_finished_work_identity_gate_rejects_stale_evidence",
        "root_private_serialization_finished_work_identity_gate_rejects_non_committed_identity",
        "root_private_serialization_finished_work_identity_gate_rejects_lane_mismatch"
      ];
      expectedRustApis.splice(
        expectedRustApis.indexOf(
          "TestRendererRoot::describe_private_to_json_finished_work_identity_gate_for_canary"
        ),
        1
      );
      const nativeExecutionIdentityApis = [
        "TestRendererRoot::describe_private_to_json_host_output_update_row_for_canary",
        "TestRendererRoot::describe_private_to_json_host_output_unmount_row_for_canary",
        "TestRendererRoot::describe_private_to_json_finished_work_identity_gate_for_canary"
      ];
      if (entry.entrypoint === packageRootEntrypoint) {
        nativeExecutionIdentityApis.push(
          "TestRendererRoot::describe_private_to_json_unmount_finished_work_identity_gate_for_canary"
        );
      }
      expectedRustApis.splice(
        expectedRustApis.indexOf(
          "TestRendererRoot::describe_private_to_json_host_shape_from_snapshot_for_diagnostics"
        ),
        0,
        ...nativeExecutionIdentityApis
      );
      expectedRustApis.splice(
        expectedRustApis.indexOf(
          "TestRendererPrivateSerializationFinishedWorkIdentityGate"
        ),
        0,
        "TestRendererPrivateToJsonHostOutputRow"
      );
      expectedRustApis.splice(
        expectedRustApis.indexOf("TestRendererPrivateJsonPublicSurfaceBlockers"),
        0,
        "TestRendererPrivateToJsonHostOutputDependencyDiagnostics"
      );
      for (const identityTest of expectedFinishedWorkIdentityTests) {
        expectedRustTests.splice(expectedRustTests.indexOf(identityTest), 1);
      }
      const nativeExecutionIdentityTests = [
        ...expectedFinishedWorkIdentityTests.slice(0, 2),
        "root_private_to_json_update_native_execution_requires_finished_work_identity_gate"
      ];
      if (entry.entrypoint === packageRootEntrypoint) {
        nativeExecutionIdentityTests.push(
          "root_private_to_json_unmount_finished_work_identity_gate_accepts_ref_passive_cleanup_handoff",
          "root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate"
        );
      }
      nativeExecutionIdentityTests.push(
        ...expectedFinishedWorkIdentityTests.slice(2)
      );
      expectedRustTests.push(
        "root_private_to_json_unmount_host_output_row_records_empty_snapshot_blockers",
        "root_private_to_json_unmount_host_output_row_rejects_stale_snapshot",
        "root_private_to_json_update_host_output_row_rejects_mismatched_row_kind",
        ...nativeExecutionIdentityTests
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
      assert.deepEqual(
        facadeGate.privateNestedUpdateSiblingTextHostOutputRows.map((row) => row.id),
        [
          privateToJSONNestedUpdateHostOutputRowId,
          privateToJSONSiblingTextHostOutputRowId
        ]
      );
      if (entry.entrypoint === packageRootEntrypoint) {
        assert.deepEqual(facadeGate.privateNativeExecutionHostOutputShapes, [
          "SingleHostText",
          "EmptyRoot"
        ]);
        assert.deepEqual(facadeGate.privateNativeExecutionHostOutputRowIds, [
          privateToJSONUpdateHostOutputRowId,
          privateToJSONUnmountHostOutputRowId
        ]);
        assert.equal(facadeGate.multiChildNativeExecutionEvidenceWorker, null);
        assert.equal(facadeGate.multiChildNativeExecutionEvidenceAvailable, false);
      } else {
        assert.deepEqual(facadeGate.privateNativeExecutionHostOutputShapes, [
          "SingleHostText",
          "NestedHostText",
          "SiblingText",
          "EmptyRoot"
        ]);
        assert.deepEqual(facadeGate.privateNativeExecutionHostOutputRowIds, [
          privateToJSONUpdateHostOutputRowId,
          privateToJSONNestedUpdateHostOutputRowId,
          privateToJSONSiblingTextHostOutputRowId,
          privateToJSONUnmountHostOutputRowId
        ]);
        assert.equal(
          facadeGate.multiChildNativeExecutionEvidenceWorker,
          "worker-697-test-renderer-tojson-multichild-native-execution"
        );
      }
      assert.equal(
        facadeGate.updateNativeExecutionFinishedWorkIdentityAdmissionWorker,
        "worker-726-test-renderer-update-native-serialization-identity-admission"
      );
      assert.equal(
        facadeGate.updateNativeExecutionRequiresFinishedWorkIdentity,
        true
      );
      assert.equal(
        facadeGate.unmountNativeExecutionFinishedWorkIdentityAdmissionWorker,
        "worker-733-test-renderer-unmount-finished-work-identity"
      );
      assert.equal(
        facadeGate.unmountNativeExecutionRequiresFinishedWorkIdentity,
        true
      );
      assert.equal(facadeGate.rejectsStaleUpdateFinishedWorkIdentity, true);
      assert.equal(facadeGate.rejectsStaleUnmountFinishedWorkIdentity, true);
      assert.equal(
        facadeGate.requiresUnmountDeletionCleanupHandoffEvidence,
        true
      );
      assert.equal(
        facadeGate.rejectsMultichildUpdateNativeExecutionIdentityAdmission,
        true
      );
      const expectedNativeExecutionRustApis = [
        "TestRendererRoot::describe_private_to_json_after_create_native_execution_for_canary",
        "TestRendererRoot::describe_private_to_json_after_update_native_execution_for_canary",
        ...(entry.entrypoint === packageRootEntrypoint
          ? []
          : [
              "TestRendererRoot::describe_private_to_json_after_nested_update_native_execution_for_canary",
              "TestRendererRoot::describe_private_to_json_sibling_text_update_native_execution_from_snapshot_for_diagnostics"
            ]),
        "TestRendererRoot::describe_private_to_json_after_unmount_native_execution_for_canary",
        "TestRendererRoot::describe_private_to_json_finished_work_identity_gate_for_canary",
        "TestRendererPrivateToJsonNativeExecutionEvidence"
      ];
      const expectedNativeExecutionRustTests = [
        "root_private_to_json_native_execution_evidence_consumes_create_update_unmount_records",
        "root_private_to_json_update_native_execution_requires_finished_work_identity_gate",
        "root_private_to_json_unmount_native_execution_requires_finished_work_identity_gate",
        ...(entry.entrypoint === packageRootEntrypoint
          ? []
          : [
              "root_private_to_json_nested_update_native_execution_evidence_consumes_multichild_row",
              "root_private_to_json_sibling_text_native_execution_evidence_consumes_sibling_row"
            ]),
        "root_private_to_json_native_execution_evidence_rejects_row_id_shape_mismatch",
        "root_private_to_json_native_execution_evidence_rejects_stale_update_record",
        "root_private_to_json_serialization_finished_work_identity_gate_accepts_committed_handoff",
        "root_private_to_json_update_serialization_finished_work_identity_gate_accepts_committed_handoff",
        "root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence",
        "root_private_serialization_finished_work_identity_gate_rejects_missing_evidence",
        "root_private_serialization_finished_work_identity_gate_rejects_foreign_evidence",
        "root_private_serialization_finished_work_identity_gate_rejects_stale_evidence",
        "root_private_serialization_finished_work_identity_gate_rejects_non_committed_identity",
        "root_private_serialization_finished_work_identity_gate_rejects_lane_mismatch"
      ];
      assert.deepEqual(
        facadeGate.nativeExecutionAcceptedRustApis,
        expectedNativeExecutionRustApis
      );
      assert.deepEqual(
        facadeGate.nativeExecutionAcceptedRustTests,
        expectedNativeExecutionRustTests
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
    assert.equal(privateFacade.privateFinishedWorkIdentityGateAvailable, true);
    assert.equal(privateFacade.privateUpdateFinishedWorkIdentityGateAvailable, true);
    if (hasPackageRootOrCjsPrivateAdmission(entry)) {
      assert.equal(
        privateFacade.privateUnmountFinishedWorkIdentityGateAvailable,
        true
      );
      assert.equal(
        privateFacade.unmountNativeExecutionFinishedWorkIdentityAdmissionWorker,
        "worker-733-test-renderer-unmount-finished-work-identity"
      );
      assert.equal(
        privateFacade.unmountNativeExecutionRequiresFinishedWorkIdentity,
        true
      );
      assert.equal(privateFacade.rejectsStaleUnmountFinishedWorkIdentity, true);
      assert.equal(
        privateFacade.requiresUnmountDeletionCleanupHandoffEvidence,
        true
      );
    }
    assert.equal(
      privateFacade.privateFinishedWorkIdentityDiagnosticName,
      privateSerializationFinishedWorkIdentityDiagnosticName
    );
    assert.equal(
      privateFacade.privateFinishedWorkIdentityStatus,
      privateSerializationFinishedWorkIdentityStatus
    );
    assert.equal(
      privateFacade.consumesCommittedHostRootFinishedWorkIdentity,
      true
    );
    assert.equal(privateFacade.consumesCommittedHostRootFinishedWorkLanes, true);
    if (hasSiblingTextPrivateAdmission(entry)) {
      assert.equal(
        privateFacade.privateSiblingTextFinishedWorkIdentityGateAvailable,
        true
      );
      assert.equal(
        privateFacade.privateSiblingTextFinishedWorkIdentityDiagnosticName,
        privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName
      );
      assert.equal(
        privateFacade.privateSiblingTextFinishedWorkIdentityStatus,
        privateToJSONSiblingTextFinishedWorkIdentityStatus
      );
      assert.equal(
        privateFacade.privateSiblingTextJSAdmissionDiagnosticName,
        privateToJSONSiblingTextJSAdmissionDiagnosticName
      );
      assert.equal(
        privateFacade.privateSiblingTextJSAdmissionStatus,
        privateToJSONSiblingTextJSAdmissionStatus
      );
      assert.equal(
        privateFacade.siblingTextJSAdmissionConsumesDedicatedIdentity,
        true
      );
      assert.equal(
        privateFacade.rejectsGenericSiblingTextFinishedWorkIdentity,
        true
      );
      assert.equal(
        privateFacade.rejectsBroadMultichildFinishedWorkIdentity,
        true
      );
      assert.equal(
        privateFacade.privateSiblingTextHostOutputRowId,
        privateToJSONSiblingTextHostOutputRowId
      );
    }
    if (hasPackageRootOrCjsPrivateAdmission(entry)) {
      assert.equal(
        privateFacade.siblingTextJSAdmissionConsumesRootFinishedLanesHandoff,
        true
      );
      assert.equal(
        privateFacade.siblingTextJSAdmissionConsumesCommittedFiberInspection,
        true
      );
      assert.equal(
        privateFacade.rejectsMissingSiblingTextCommittedFiberInspection,
        true
      );
      assert.equal(
        privateFacade.rejectsInvalidSiblingTextCommittedFiberInspection,
        true
      );
    }
    if (hasPackageRootOrDevelopmentRows(entry)) {
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
      assert.deepEqual(
        privateFacade.privateNestedUpdateSiblingTextHostOutputRows.map((row) => row.id),
        [
          privateToJSONNestedUpdateHostOutputRowId,
          privateToJSONSiblingTextHostOutputRowId
        ]
      );
      if (entry.entrypoint === packageRootEntrypoint) {
        assert.deepEqual(privateFacade.privateNativeExecutionHostOutputShapes, [
          "SingleHostText",
          "EmptyRoot"
        ]);
        assert.deepEqual(privateFacade.privateNativeExecutionHostOutputRowIds, [
          privateToJSONUpdateHostOutputRowId,
          privateToJSONUnmountHostOutputRowId
        ]);
        assert.equal(privateFacade.multiChildNativeExecutionEvidenceWorker, null);
        assert.equal(privateFacade.multiChildNativeExecutionEvidenceAvailable, false);
      } else {
        assert.deepEqual(privateFacade.privateNativeExecutionHostOutputShapes, [
          "SingleHostText",
          "NestedHostText",
          "SiblingText",
          "EmptyRoot"
        ]);
        assert.deepEqual(privateFacade.privateNativeExecutionHostOutputRowIds, [
          privateToJSONUpdateHostOutputRowId,
          privateToJSONNestedUpdateHostOutputRowId,
          privateToJSONSiblingTextHostOutputRowId,
          privateToJSONUnmountHostOutputRowId
        ]);
        assert.equal(
          privateFacade.multiChildNativeExecutionEvidenceWorker,
          "worker-697-test-renderer-tojson-multichild-native-execution"
        );
      }
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
    assert.equal(
      typeof privateFacade.validateAcceptedFinishedWorkIdentity,
      "function"
    );
    assert.equal(
      typeof privateFacade.canValidateAcceptedFinishedWorkIdentity,
      "function"
    );
    if (hasSiblingTextPrivateAdmission(entry)) {
      assert.equal(
        typeof privateFacade.createAcceptedSiblingTextDiagnosticResult,
        "function"
      );
      assert.equal(
        typeof privateFacade.canCreateAcceptedSiblingTextDiagnosticResult,
        "function"
      );
    }

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
    if (hasPackageRootOrDevelopmentRows(entry)) {
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
    if (
      entry.entrypoint === packageRootEntrypoint ||
      entry.entrypoint.endsWith(".development")
    ) {
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
    assert.equal(facadeGate.privateFinishedWorkIdentityGateAvailable, true);
    assert.equal(facadeGate.privateUpdateFinishedWorkIdentityGateAvailable, true);
    if (entry.entrypoint.includes("/cjs/")) {
      assert.equal(
        facadeGate.privateUnmountFinishedWorkIdentityGateAvailable,
        true
      );
      assert.equal(
        facadeGate.unmountNativeExecutionFinishedWorkIdentityAdmissionWorker,
        "worker-733-test-renderer-unmount-finished-work-identity"
      );
      assert.equal(
        facadeGate.unmountNativeExecutionRequiresFinishedWorkIdentity,
        true
      );
      assert.equal(facadeGate.rejectsStaleUnmountFinishedWorkIdentity, true);
      assert.equal(
        facadeGate.requiresUnmountDeletionCleanupHandoffEvidence,
        true
      );
    }
    assert.equal(facadeGate.validatesUpdateRootRequestIdentity, true);
    assert.equal(
      facadeGate.privateFinishedWorkIdentityDiagnosticName,
      privateSerializationFinishedWorkIdentityDiagnosticName
    );
    assert.equal(
      facadeGate.privateFinishedWorkIdentityStatus,
      privateSerializationFinishedWorkIdentityStatus
    );
    assert.equal(
      facadeGate.consumesCommittedHostRootFinishedWorkIdentity,
      true
    );
    assert.equal(facadeGate.consumesCommittedHostRootFinishedWorkLanes, true);
    if (hasSiblingTextPrivateAdmission(entry)) {
      assert.equal(
        facadeGate.privateSiblingTextFinishedWorkIdentityGateAvailable,
        true
      );
      assert.equal(
        facadeGate.privateSiblingTextFinishedWorkIdentityDiagnosticName,
        privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName
      );
      assert.equal(
        facadeGate.privateSiblingTextFinishedWorkIdentityStatus,
        privateToJSONSiblingTextFinishedWorkIdentityStatus
      );
      assert.equal(
        facadeGate.privateSiblingTextJSAdmissionDiagnosticName,
        privateToTreeSiblingTextJSAdmissionDiagnosticName
      );
      assert.equal(
        facadeGate.privateSiblingTextJSAdmissionStatus,
        privateToTreeSiblingTextJSAdmissionStatus
      );
      assert.equal(
        facadeGate.siblingTextJSAdmissionConsumesDedicatedIdentity,
        true
      );
      assert.equal(
        facadeGate.siblingTextJSAdmissionConsumesRootFinishedLanesHandoff,
        true
      );
      if (entry.entrypoint === packageRootEntrypoint) {
        assert.equal(
          facadeGate.siblingTextJSAdmissionConsumesCommittedFiberInspection,
          true
        );
      }
      assert.equal(facadeGate.rejectsGenericSiblingTextFinishedWorkIdentity, true);
      assert.equal(facadeGate.rejectsBroadMultichildFinishedWorkIdentity, true);
      assert.equal(
        facadeGate.privateSiblingTextHostOutputRowId,
        privateToJSONSiblingTextHostOutputRowId
      );
    }
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
    const packageRootUnmountIdentity =
      entry.entrypoint === "react-test-renderer";
    const compositeNativeToTreeEvidence =
      nativeToTreeEvidence &&
      facadeGate.nativeExecutionCompositeWorker ===
        "worker-698-test-renderer-totree-composite-native-execution";
    const siblingTextNativeToTreeEvidence =
      hasSiblingTextPrivateAdmission(entry) &&
      entry.entrypoint !== packageRootEntrypoint;
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
            "TestRendererRoot::describe_private_to_tree_after_unmount_native_execution_for_canary",
          ]
        : []),
      ...(siblingTextNativeToTreeEvidence
        ? [
            "TestRendererRoot::describe_private_to_tree_after_sibling_text_update_native_execution_for_canary"
          ]
        : []),
      ...(hasSiblingTextPrivateAdmission(entry)
        ? [
            "TestRendererRoot::describe_private_to_json_sibling_text_finished_work_identity_gate_for_canary"
          ]
        : []),
      "TestRendererRoot::describe_private_to_tree_finished_work_identity_gate_for_canary",
      ...(packageRootUnmountIdentity
        ? [
            "TestRendererRoot::describe_private_to_tree_unmount_finished_work_identity_gate_for_canary"
          ]
        : []),
      "TestRendererPrivateTreeMetadataReport",
      ...(nativeToTreeEvidence
        ? ["TestRendererPrivateToTreeNativeExecutionEvidence"]
        : []),
      "TestRendererPrivateSerializationFinishedWorkIdentityGate",
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
            "root_private_to_tree_native_execution_evidence_consumes_create_update_unmount_records",
            "root_private_to_tree_update_native_execution_requires_finished_work_identity_gate",
            "root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate",
            ...(compositeNativeToTreeEvidence
              ? [
                  "root_private_to_tree_native_execution_evidence_records_composite_host_shape"
                ]
              : []),
          ]
        : []),
      ...(siblingTextNativeToTreeEvidence
        ? [
            "root_private_to_tree_sibling_text_real_output_native_execution_consumes_identity_gate",
            "root_private_to_tree_sibling_text_real_output_native_execution_rejects_missing_or_tampered_identity"
          ]
        : []),
      ...(hasSiblingTextPrivateAdmission(entry)
        ? [
            "root_private_to_tree_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate"
          ]
        : []),
      "root_private_to_tree_serialization_finished_work_identity_gate_accepts_committed_handoff",
      "root_private_to_tree_update_serialization_finished_work_identity_gate_accepts_committed_handoff",
      ...(packageRootUnmountIdentity
        ? [
            "root_private_to_tree_unmount_native_execution_requires_finished_work_identity_gate"
          ]
        : []),
      "root_private_serialization_finished_work_identity_gate_rejects_stale_update_evidence",
      "root_private_tree_metadata_canary_rejects_stale_host_output_snapshot"
    ]);
    if (nativeToTreeEvidence) {
      assert.equal(
        facadeGate.nativeExecutionEvidenceWorker,
        "worker-667-test-renderer-totree-native-execution"
      );
    }
    if (compositeNativeToTreeEvidence) {
      assert.equal(
        facadeGate.privateNativeExecutionFunctionComponentShapeAvailable,
        true
      );
      assert.deepEqual(
        facadeGate.nativeExecutionCompositeAcceptedFiberShape,
        privateToTreeCompositeAcceptedFiberShape
      );
      assert.equal(
        facadeGate.nativeExecutionCompositeWorker,
        "worker-698-test-renderer-totree-composite-native-execution"
      );
    }
    if (
      entry.entrypoint === packageRootEntrypoint ||
      entry.entrypoint.endsWith(".development")
    ) {
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
    if (
      entry.entrypoint === packageRootEntrypoint ||
      entry.entrypoint.endsWith(".development")
    ) {
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
    assert.equal(privateFacade.privateFinishedWorkIdentityGateAvailable, true);
    assert.equal(privateFacade.privateUpdateFinishedWorkIdentityGateAvailable, true);
    if (entry.entrypoint.includes("/cjs/")) {
      assert.equal(
        privateFacade.privateUnmountFinishedWorkIdentityGateAvailable,
        true
      );
      assert.equal(
        privateFacade.unmountNativeExecutionFinishedWorkIdentityAdmissionWorker,
        "worker-733-test-renderer-unmount-finished-work-identity"
      );
      assert.equal(
        privateFacade.unmountNativeExecutionRequiresFinishedWorkIdentity,
        true
      );
      assert.equal(privateFacade.rejectsStaleUnmountFinishedWorkIdentity, true);
      assert.equal(
        privateFacade.requiresUnmountDeletionCleanupHandoffEvidence,
        true
      );
    }
    assert.equal(
      privateFacade.privateFinishedWorkIdentityDiagnosticName,
      privateSerializationFinishedWorkIdentityDiagnosticName
    );
    assert.equal(
      privateFacade.privateFinishedWorkIdentityStatus,
      privateSerializationFinishedWorkIdentityStatus
    );
    assert.equal(
      privateFacade.consumesCommittedHostRootFinishedWorkIdentity,
      true
    );
    assert.equal(privateFacade.consumesCommittedHostRootFinishedWorkLanes, true);
    if (
      entry.entrypoint === packageRootEntrypoint ||
      entry.entrypoint.endsWith(".development")
    ) {
      assert.equal(privateFacade.privateMultiChildTreeMetadataSerializable, true);
    }
    if (
      nativeToTreeEvidence &&
      privateFacade.nativeExecutionCompositeWorker ===
        "worker-698-test-renderer-totree-composite-native-execution"
    ) {
      assert.equal(
        privateFacade.privateNativeExecutionFunctionComponentShapeAvailable,
        true
      );
      assert.deepEqual(
        privateFacade.nativeExecutionCompositeAcceptedFiberShape,
        privateToTreeCompositeAcceptedFiberShape
      );
      assert.equal(
        privateFacade.nativeExecutionCompositeWorker,
        "worker-698-test-renderer-totree-composite-native-execution"
      );
    }
    assert.equal(privateFacade.publicTreeAvailable, false);
    assert.equal(privateFacade.publicRouteAvailable, false);
    assert.equal(privateFacade.nativeBridgeAvailable, false);
    assert.equal(privateFacade.nativeExecution, false);
    assert.equal(privateFacade.compatibilityClaimed, false);
    assert.equal(typeof privateFacade.serializeAcceptedTreeMetadata, "function");
    assert.equal(typeof privateFacade.canSerializeAcceptedTreeMetadata, "function");
    assert.equal(
      typeof privateFacade.validateAcceptedFinishedWorkIdentity,
      "function"
    );
    assert.equal(
      typeof privateFacade.canValidateAcceptedFinishedWorkIdentity,
      "function"
    );
    if (hasSiblingTextPrivateAdmission(entry)) {
      assert.equal(
        typeof privateFacade.createAcceptedSiblingTextDiagnosticResult,
        "function"
      );
      assert.equal(
        typeof privateFacade.canCreateAcceptedSiblingTextDiagnosticResult,
        "function"
      );
    }

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
    if (
      entry.entrypoint === packageRootEntrypoint ||
      entry.entrypoint.endsWith(".development")
    ) {
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

test("react-test-renderer JS private serialization finished-work identity validates committed handoff evidence", () => {
  for (const entry of jsEntrypoints) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });
    const jsonError = captureThrown(() => renderer.toJSON());
    const jsonFacade = Object.getOwnPropertyDescriptor(
      renderer.toJSON,
      privateToJSONSerializationFacadeSymbol
    ).value;
    const jsonReport = createAcceptedMinimalHostOutputDiagnostic();
    const jsonEvidence = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: jsonError.rootRequest,
      publicSurface: "create().toJSON",
      sourceSerializationDiagnosticName:
        "fast-react-test-renderer.serialization.private-json-canary",
      consumesPrivateToJSONEvidence: true,
      consumesPrivateToTreeEvidence: false
    });

    assert.equal(
      jsonFacade.canValidateAcceptedFinishedWorkIdentity(
        jsonEvidence,
        jsonReport
      ),
      true
    );
    const jsonIdentity = jsonFacade.validateAcceptedFinishedWorkIdentity(
      jsonEvidence,
      jsonReport
    );
    assert.equal(Object.isFrozen(jsonIdentity), true);
    assert.equal(
      jsonIdentity.diagnosticName,
      privateSerializationFinishedWorkIdentityDiagnosticName
    );
    assert.equal(
      jsonIdentity.status,
      privateSerializationFinishedWorkIdentityStatus
    );
    assert.equal(jsonIdentity.rootFinishedLanesHandoffAccepted, true);
    assert.equal(
      jsonIdentity.consumesPrivateRootFinishedLanesHandoffGate,
      true
    );
    assert.equal(
      jsonIdentity.rootFinishedLanesHandoffDiagnosticName,
      privateRootFinishedLanesHandoffDiagnosticName
    );
    assert.equal(
      jsonIdentity.rootFinishedLanesHandoffStatus,
      privateRootFinishedLanesHandoffStatus
    );
    assert.equal(Object.isFrozen(jsonIdentity.rootFinishedLanesHandoff), true);
    assert.equal(jsonIdentity.publicSurface, "create().toJSON");
    assert.equal(jsonIdentity.rootRequest, jsonError.rootRequest);
    assert.deepEqual(jsonIdentity.renderCurrent, jsonEvidence.renderCurrent);
    assert.deepEqual(
      jsonIdentity.commitPreviousCurrent,
      jsonEvidence.commitPreviousCurrent
    );
    assert.equal(jsonIdentity.consumesPrivateToJSONEvidence, true);
    assert.equal(jsonIdentity.consumesPrivateToTreeEvidence, false);
    assert.equal(jsonIdentity.publicSerializationAvailable, false);
    assert.equal(jsonIdentity.compatibilityClaimed, false);

    if (hasSiblingTextPrivateAdmission(entry)) {
      const broadIdentityError = captureThrown(() =>
        jsonFacade.validateAcceptedFinishedWorkIdentity(
          jsonEvidence,
          createAcceptedBroaderHostOutputDiagnostic(),
          jsonError.rootRequest
        )
      );
      assert.equal(
        broadIdentityError.name,
        "FastReactTestRendererPrivateToJSONSerializationError"
      );
      assert.match(
        broadIdentityError.message,
        /broad-multichild-identity-unexpectedly-open/u
      );
    }

    const treeCreateRenderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });
    const treeCreateError = captureThrown(() => treeCreateRenderer.toTree());
    const treeCreateFacade = Object.getOwnPropertyDescriptor(
      treeCreateRenderer.toTree,
      privateToTreeFacadeSymbol
    ).value;
    const treeCreateReport = createAcceptedMinimalTreeMetadataDiagnostic();
    const treeCreateEvidence = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: treeCreateError.rootRequest,
      publicSurface: "create().toTree",
      sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
      consumesPrivateToJSONEvidence: false,
      consumesPrivateToTreeEvidence: true
    });

    assert.equal(
      treeCreateFacade.canValidateAcceptedFinishedWorkIdentity(
        treeCreateEvidence,
        treeCreateReport
      ),
      true
    );
    const treeIdentity = treeCreateFacade.validateAcceptedFinishedWorkIdentity(
      treeCreateEvidence,
      treeCreateReport
    );
    assert.equal(treeIdentity.publicSurface, "create().toTree");
    assert.equal(treeIdentity.rootFinishedLanesHandoffAccepted, true);
    assert.equal(
      treeIdentity.consumesPrivateRootFinishedLanesHandoffGate,
      true
    );
    assert.equal(
      treeIdentity.rootFinishedLanesHandoffDiagnosticName,
      privateRootFinishedLanesHandoffDiagnosticName
    );
    assert.equal(
      treeIdentity.rootFinishedLanesHandoffStatus,
      privateRootFinishedLanesHandoffStatus
    );
    assert.deepEqual(treeIdentity.renderCurrent, treeCreateEvidence.renderCurrent);
    assert.deepEqual(
      treeIdentity.commitPreviousCurrent,
      treeCreateEvidence.commitPreviousCurrent
    );
    assert.equal(treeIdentity.consumesPrivateToJSONEvidence, false);
    assert.equal(treeIdentity.consumesPrivateToTreeEvidence, true);
    assert.equal(treeIdentity.publicToTreeAvailable, false);
    assert.equal(treeIdentity.compatibilityClaimed, false);
    const treeReport = treeCreateReport;
    const treeEvidence = treeCreateEvidence;

    const updateError = captureThrown(() =>
      renderer.update({
        type: "span",
        props: {},
        children: ["goodbye"]
      })
    );
    if (
      jsonFacade.canValidateAcceptedFinishedWorkIdentity(
        jsonEvidence,
        jsonReport
      ) === false
    ) {
      const staleCreateIdentityError = captureThrown(() =>
        jsonFacade.validateAcceptedFinishedWorkIdentity(jsonEvidence, jsonReport)
      );
      assert.equal(
        staleCreateIdentityError.name,
        "FastReactTestRendererPrivateToJSONSerializationError"
      );
      assert.match(staleCreateIdentityError.message, /request sequence is stale/u);
    }

    const jsonUpdateReport = createAcceptedMinimalHostOutputDiagnostic({
      hostOutputUpdateKind: "Update",
      text: "goodbye"
    });
    const jsonUpdateEvidence = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: updateError.rootRequest,
      publicSurface: "create().toJSON",
      sourceSerializationDiagnosticName:
        "fast-react-test-renderer.serialization.private-json-canary",
      consumesPrivateToJSONEvidence: true,
      consumesPrivateToTreeEvidence: false,
      hostOutputUpdateKind: "Update"
    });
    assert.equal(
      jsonFacade.canValidateAcceptedFinishedWorkIdentity(
        jsonUpdateEvidence,
        jsonUpdateReport
      ),
      false
    );
    assert.equal(
      jsonFacade.canValidateAcceptedFinishedWorkIdentity(
        jsonUpdateEvidence,
        jsonUpdateReport,
        updateError.rootRequest
      ),
      true
    );
    const jsonUpdateIdentity =
      jsonFacade.validateAcceptedFinishedWorkIdentity(
        jsonUpdateEvidence,
        jsonUpdateReport,
        updateError.rootRequest
      );
    assert.equal(jsonUpdateIdentity.rootRequest, updateError.rootRequest);
    assert.equal(
      jsonUpdateIdentity.rootRequestId,
      updateError.rootRequest.requestId
    );
    assert.equal(
      jsonUpdateIdentity.rootRequestSequence,
      updateError.rootRequest.requestSequence
    );
    assert.equal(jsonUpdateIdentity.rootRequestOperation, "update");
    assert.equal(jsonUpdateIdentity.hostOutputUpdateKind, "Update");

    if (hasPackageRootOrCjsPrivateAdmission(entry)) {
      const mismatchedIdentityRowIdReport = JSON.parse(
        JSON.stringify(jsonUpdateReport)
      );
      mismatchedIdentityRowIdReport.hostOutputRowId =
        privateToJSONUpdateHostOutputRowId;
      mismatchedIdentityRowIdReport.hostOutputRow.id =
        `${privateToJSONUpdateHostOutputRowId}:mismatch`;
      assert.equal(
        jsonFacade.canValidateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          mismatchedIdentityRowIdReport,
          updateError.rootRequest
        ),
        false
      );
      const mismatchedIdentityRowIdError = captureThrown(() =>
        jsonFacade.validateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          mismatchedIdentityRowIdReport,
          updateError.rootRequest
        )
      );
      assert.equal(
        mismatchedIdentityRowIdError.name,
        "FastReactTestRendererPrivateToJSONSerializationError"
      );
      assert.match(
        mismatchedIdentityRowIdError.message,
        /hostOutputRowId to match hostOutputRow\.id/u
      );

      const missingIdentityRowReport = JSON.parse(
        JSON.stringify(jsonUpdateReport)
      );
      missingIdentityRowReport.hostOutputRowId =
        privateToJSONUpdateHostOutputRowId;
      delete missingIdentityRowReport.hostOutputRow;
      assert.equal(
        jsonFacade.canValidateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          missingIdentityRowReport,
          updateError.rootRequest
        ),
        false
      );
      const missingIdentityRowError = captureThrown(() =>
        jsonFacade.validateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          missingIdentityRowReport,
          updateError.rootRequest
        )
      );
      assert.equal(
        missingIdentityRowError.name,
        "FastReactTestRendererPrivateToJSONSerializationError"
      );
      assert.match(missingIdentityRowError.message, /hostOutputRow/u);

      const missingIdentityRowMetadataReport = JSON.parse(
        JSON.stringify(jsonUpdateReport)
      );
      delete missingIdentityRowMetadataReport.hostOutputRow;
      assert.equal(
        jsonFacade.canValidateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          missingIdentityRowMetadataReport,
          updateError.rootRequest
        ),
        false
      );
      const missingIdentityRowMetadataError = captureThrown(() =>
        jsonFacade.validateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          missingIdentityRowMetadataReport,
          updateError.rootRequest
        )
      );
      assert.equal(
        missingIdentityRowMetadataError.name,
        "FastReactTestRendererPrivateToJSONSerializationError"
      );
      assert.match(
        missingIdentityRowMetadataError.message,
        /hostOutputRow/u
      );

      const missingIdentityRowShapeReport = JSON.parse(
        JSON.stringify(jsonUpdateReport)
      );
      delete missingIdentityRowShapeReport.hostOutputRow.hostOutputShape;
      assert.equal(
        jsonFacade.canValidateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          missingIdentityRowShapeReport,
          updateError.rootRequest
        ),
        false
      );
      const missingIdentityRowShapeError = captureThrown(() =>
        jsonFacade.validateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          missingIdentityRowShapeReport,
          updateError.rootRequest
        )
      );
      assert.equal(
        missingIdentityRowShapeError.name,
        "FastReactTestRendererPrivateToJSONSerializationError"
      );
      assert.match(missingIdentityRowShapeError.message, /hostOutputShape/u);
    }

    if (hasSiblingTextPrivateAdmission(entry)) {
      const siblingTextReport = createAcceptedSiblingTextHostOutputDiagnostic();
      const siblingTextIdentity =
        createAcceptedSiblingTextFinishedWorkIdentityEvidence({
          rootRequest: updateError.rootRequest
        });
      assert.equal(
        jsonFacade.canValidateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          siblingTextReport,
          updateError.rootRequest
        ),
        false
      );
      const genericSiblingError = captureThrown(() =>
        jsonFacade.validateAcceptedFinishedWorkIdentity(
          jsonUpdateEvidence,
          siblingTextReport,
          updateError.rootRequest
        )
      );
      assert.equal(
        genericSiblingError.name,
        "FastReactTestRendererPrivateToJSONSerializationError"
      );
      assert.match(
        genericSiblingError.message,
        /sibling-text-finished-work-identity-gate-not-implemented/u
      );
      assert.equal(
        jsonFacade.canCreateAcceptedSiblingTextDiagnosticResult(
          siblingTextReport,
          siblingTextIdentity,
          updateError.rootRequest
        ),
        true
      );
      const siblingTextDiagnostic =
        jsonFacade.createAcceptedSiblingTextDiagnosticResult(
          siblingTextReport,
          siblingTextIdentity,
          updateError.rootRequest
        );
      assert.equal(Object.isFrozen(siblingTextDiagnostic), true);
      assert.equal(
        siblingTextDiagnostic.diagnosticName,
        privateToJSONSiblingTextJSAdmissionDiagnosticName
      );
      assert.equal(
        siblingTextDiagnostic.status,
        privateToJSONSiblingTextJSAdmissionStatus
      );
      assert.equal(
        siblingTextDiagnostic.sourceFinishedWorkIdentityDiagnosticName,
        privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName
      );
      assert.equal(siblingTextDiagnostic.hostOutputUpdateKind, "Update");
      assert.equal(siblingTextDiagnostic.hostOutputShape, "SiblingText");
      assert.equal(
        siblingTextDiagnostic.hostOutputRowId,
        privateToJSONSiblingTextHostOutputRowId
      );
      assert.equal(siblingTextDiagnostic.rootChildCount, 2);
      assert.equal(siblingTextDiagnostic.sourceNodeCount, 3);
      assert.equal(
        siblingTextDiagnostic.consumesPrivateSiblingTextFinishedWorkIdentityGate,
        true
      );
      if (entry.entrypoint.includes("/cjs/")) {
        assert.equal(
          siblingTextDiagnostic.consumesPrivateRootFinishedLanesHandoffGate,
          true
        );
        assert.equal(siblingTextDiagnostic.rootFinishedLanesHandoffAccepted, true);
        assert.equal(
          siblingTextDiagnostic.rootFinishedLanesHandoffDiagnosticName,
          privateRootFinishedLanesHandoffDiagnosticName
        );
        assert.equal(
          siblingTextDiagnostic.rootFinishedLanesHandoffStatus,
          privateRootFinishedLanesHandoffStatus
        );
        assert.equal(
          Object.isFrozen(siblingTextDiagnostic.rootFinishedLanesHandoff),
          true
        );
        assert.equal(
          siblingTextDiagnostic.consumesCommittedFiberInspection,
          true
        );
        assert.deepEqual(
          siblingTextDiagnostic.committedFiberInspection,
          createSiblingTextToJSONCommittedFiberInspectionDiagnostic()
        );
      }
      assert.equal(
        siblingTextDiagnostic.finishedWorkIdentity.rootRequest,
        updateError.rootRequest
      );
      if (entry.entrypoint === packageRootEntrypoint) {
        assert.equal(
          siblingTextDiagnostic.finishedWorkIdentity
            .rootFinishedLanesHandoffAccepted,
          true
        );
        assert.equal(
          siblingTextDiagnostic.finishedWorkIdentity
            .consumesPrivateRootFinishedLanesHandoffGate,
          true
        );
        assert.equal(
          siblingTextDiagnostic.finishedWorkIdentity
            .rootFinishedLanesHandoffDiagnosticName,
          privateRootFinishedLanesHandoffDiagnosticName
        );
        assert.equal(
          siblingTextDiagnostic.finishedWorkIdentity
            .rootFinishedLanesHandoffStatus,
          privateRootFinishedLanesHandoffStatus
        );
        assert.equal(
          Object.isFrozen(
            siblingTextDiagnostic.finishedWorkIdentity.rootFinishedLanesHandoff
          ),
          true
        );
        assert.equal(
          siblingTextDiagnostic.rootFinishedLanesHandoffAccepted,
          true
        );
        assert.equal(
          siblingTextDiagnostic.consumesPrivateRootFinishedLanesHandoffGate,
          true
        );
        assert.equal(
          siblingTextDiagnostic.rootFinishedLanesHandoff,
          siblingTextDiagnostic.finishedWorkIdentity.rootFinishedLanesHandoff
        );
      }
      assert.deepEqual(siblingTextDiagnostic.result, [
        "first sibling",
        {
          type: "span",
          props: {},
          children: ["second sibling"]
        }
      ]);
      assert.equal(siblingTextDiagnostic.publicToJSONAvailable, false);
      assert.equal(siblingTextDiagnostic.nativeBridgeAvailable, false);
      assert.equal(siblingTextDiagnostic.nativeExecution, false);
      assert.equal(siblingTextDiagnostic.packageCompatibilityClaimed, false);
      assert.equal(siblingTextDiagnostic.compatibilityClaimed, false);
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        jsonUpdateEvidence,
        updateError.rootRequest,
        /sibling-text-finished-work-identity-diagnostic-mismatch/u
      );
      if (entry.entrypoint.includes("/cjs/")) {
        assertSiblingTextAdmissionRejection(
          jsonFacade,
          withSiblingTextReportChange(siblingTextReport, (report) => {
            delete report.committedFiberInspection;
          }),
          siblingTextIdentity,
          updateError.rootRequest,
          /committedFiberInspection/u
        );
        assertSiblingTextAdmissionRejection(
          jsonFacade,
          withSiblingTextReportChange(siblingTextReport, (report) => {
            report.committedFiberInspection.compatibilityClaimed = true;
          }),
          siblingTextIdentity,
          updateError.rootRequest,
          /compatibilityClaimed/u
        );
      }
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.rootRequestSequence += 1;
        }),
        updateError.rootRequest,
        /sibling-text-finished-work-identity-stale/u
      );
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        withSiblingTextReportChange(siblingTextReport, (report) => {
          report.hostOutputRow.id = privateToJSONUpdateHostOutputRowId;
        }),
        siblingTextIdentity,
        updateError.rootRequest,
        /sibling-text-report-row-or-shape-mismatch/u
      );
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          delete evidence.rootFinishedLanesHandoff;
        }),
        updateError.rootRequest,
        /rootFinishedLanesHandoff/u
      );
      assertSiblingTextRootFinishedLanesAliasRejections(
        jsonFacade,
        siblingTextReport,
        siblingTextIdentity,
        updateError.rootRequest
      );
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.rootFinishedLanesHandoff.commitFinishedLanesBits = 2;
        }),
        updateError.rootRequest,
        /finished_lanes handoff/u
      );
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.rootFinishedLanesHandoff.nativeBridgeAvailable = true;
        }),
        updateError.rootRequest,
        /public, native, or package compatibility/u
      );
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.broadMultichildIdentityAvailable = true;
        }),
        updateError.rootRequest,
        /broad-multichild-identity-unexpectedly-open/u
      );
      if (entry.entrypoint === packageRootEntrypoint) {
        assertSiblingTextAdmissionRejection(
          jsonFacade,
          siblingTextReport,
          withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
            delete evidence.rootRequestId;
          }),
          updateError.rootRequest,
          /sibling-text-finished-work-identity-stale/u
        );
        assertSiblingTextAdmissionRejection(
          jsonFacade,
          siblingTextReport,
          withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
            evidence.rootRequestId = `${evidence.rootRequestId}:foreign`;
          }),
          updateError.rootRequest,
          /sibling-text-finished-work-identity-stale/u
        );
        assertSiblingTextAdmissionRejection(
          jsonFacade,
          siblingTextReport,
          withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
            delete evidence.rootId;
          }),
          updateError.rootRequest,
          /sibling-text-finished-work-identity-stale/u
        );
        assertSiblingTextAdmissionRejection(
          jsonFacade,
          siblingTextReport,
          withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
            evidence.rootId = `${evidence.rootId}:foreign`;
          }),
          updateError.rootRequest,
          /sibling-text-finished-work-identity-stale/u
        );
        for (const fieldName of [
          "publicToJSONAvailable",
          "publicTestInstanceAvailable",
          "nativeExecution",
          "compatibilityClaimed"
        ]) {
          assertSiblingTextAdmissionRejection(
            jsonFacade,
            withSiblingTextReportChange(siblingTextReport, (report) => {
              report.hostOutputRow[fieldName] = true;
            }),
            siblingTextIdentity,
            updateError.rootRequest,
            /sibling-text-host-output-row-public-native-package-claim/u
          );
        }
        assertSiblingTextAdmissionRejection(
          jsonFacade,
          siblingTextReport,
          withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
            delete evidence.rootFinishedLanesHandoff;
          }),
          updateError.rootRequest,
          /rootFinishedLanesHandoff/u
        );
        assertSiblingTextRootFinishedLanesHandoffAliasRejections(
          jsonFacade,
          siblingTextReport,
          siblingTextIdentity,
          updateError.rootRequest
        );
        assertSiblingTextAdmissionRejection(
          jsonFacade,
          siblingTextReport,
          withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
            evidence.rootFinishedLanesHandoff.commitFinishedLanesBits = 2;
          }),
          updateError.rootRequest,
          /finished_lanes/u
        );
      }
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.publicToJSONAvailable = true;
        }),
        updateError.rootRequest,
        /public-or-native-package-js-compatibility-claim/u
      );
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.nativeBridgeAvailable = true;
        }),
        updateError.rootRequest,
        /public-or-native-package-js-compatibility-claim/u
      );
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.packageCompatibilityClaimed = true;
        }),
        updateError.rootRequest,
        /public-or-native-package-js-compatibility-claim/u
      );
      assertSiblingTextAdmissionRejection(
        jsonFacade,
        siblingTextReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.jsFacadeAvailable = true;
        }),
        updateError.rootRequest,
        /public-or-native-package-js-compatibility-claim/u
      );
    }
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonUpdateEvidence, (evidence) => {
        evidence.rootRequestSequence += 1;
      }),
      jsonUpdateReport,
      "FastReactTestRendererPrivateToJSONSerializationError",
      updateError.rootRequest
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        delete evidence.rootFinishedLanesHandoff;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertRootFinishedLanesHandoffAliasRejections(
      jsonFacade,
      jsonEvidence,
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.commitFinishedLanesBits = 2;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.rootRequestSequence += 1;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.rootId =
          `${evidence.rootFinishedLanesHandoff.rootId}:foreign`;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.nativeBridgeAvailable = true;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.packageCompatibilityClaimed = true;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );

    assertFinishedWorkIdentityRejection(
      jsonFacade,
      null,
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        delete evidence.rootRequestId;
        delete evidence.rootRequestSequence;
        delete evidence.rootId;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.rootRequestSequence += 1;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.rootId = `${evidence.rootId}:foreign`;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      jsonEvidence,
      undefined,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        delete evidence.renderCurrent;
        delete evidence.commitPreviousCurrent;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.commitPreviousCurrent.slot += 1;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.commitCurrent.slot += 1;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
        evidence.commitFinishedLanesBits = 2;
      }),
      jsonReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );

    const treeError = captureThrown(() => renderer.toTree());
    const treeFacade = Object.getOwnPropertyDescriptor(
      renderer.toTree,
      privateToTreeFacadeSymbol
    ).value;
    assert.equal(treeError.rootRequest.rootHandle, updateError.rootRequest.rootHandle);

    const treeUpdateReport = createAcceptedMinimalTreeMetadataDiagnostic({
      hostOutputUpdateKind: "Update",
      text: "goodbye"
    });
    const treeUpdateEvidence = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: updateError.rootRequest,
      publicSurface: "create().toTree",
      sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
      consumesPrivateToJSONEvidence: false,
      consumesPrivateToTreeEvidence: true,
      hostOutputUpdateKind: "Update"
    });
    assert.equal(
      treeFacade.canValidateAcceptedFinishedWorkIdentity(
        treeUpdateEvidence,
        treeUpdateReport
      ),
      false
    );
    assert.equal(
      treeFacade.canValidateAcceptedFinishedWorkIdentity(
        treeUpdateEvidence,
        treeUpdateReport,
        updateError.rootRequest
      ),
      true
    );
    const treeUpdateIdentity =
      treeFacade.validateAcceptedFinishedWorkIdentity(
        treeUpdateEvidence,
        treeUpdateReport,
        updateError.rootRequest
      );
    assert.equal(treeUpdateIdentity.rootRequest, updateError.rootRequest);
    assert.equal(treeUpdateIdentity.rootRequestOperation, "update");
    assert.equal(treeUpdateIdentity.hostOutputUpdateKind, "Update");

    if (hasSiblingTextPrivateAdmission(entry)) {
      const siblingTreeReport = createAcceptedMultiChildTreeMetadataDiagnostic({
        composite: true,
        hostOutputUpdateKind: "Update"
      });
      const siblingTextIdentity =
        createAcceptedSiblingTextFinishedWorkIdentityEvidence({
          rootRequest: updateError.rootRequest
        });
      assert.equal(
        treeFacade.canValidateAcceptedFinishedWorkIdentity(
          treeUpdateEvidence,
          siblingTreeReport,
          updateError.rootRequest
        ),
        false
      );
      const genericSiblingTreeError = captureThrown(() =>
        treeFacade.validateAcceptedFinishedWorkIdentity(
          treeUpdateEvidence,
          siblingTreeReport,
          updateError.rootRequest
        )
      );
      assert.equal(
        genericSiblingTreeError.name,
        "FastReactTestRendererPrivateToTreeMetadataError"
      );
      assert.match(
        genericSiblingTreeError.message,
        /hostOutputRow|broad-multichild-identity-unexpectedly-open/u
      );
      assert.equal(
        treeFacade.canCreateAcceptedSiblingTextDiagnosticResult(
          siblingTreeReport,
          jsonUpdateEvidence,
          updateError.rootRequest
        ),
        false
      );
      assert.equal(
        treeFacade.canCreateAcceptedSiblingTextDiagnosticResult(
          siblingTreeReport,
          siblingTextIdentity,
          updateError.rootRequest
        ),
        true
      );
      const siblingTreeDiagnostic =
        treeFacade.createAcceptedSiblingTextDiagnosticResult(
          siblingTreeReport,
          siblingTextIdentity,
          updateError.rootRequest
        );
      assert.equal(Object.isFrozen(siblingTreeDiagnostic), true);
      assert.equal(
        siblingTreeDiagnostic.diagnosticName,
        privateToTreeSiblingTextJSAdmissionDiagnosticName
      );
      assert.equal(
        siblingTreeDiagnostic.status,
        privateToTreeSiblingTextJSAdmissionStatus
      );
      assert.equal(
        siblingTreeDiagnostic.sourceFinishedWorkIdentityDiagnosticName,
        privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName
      );
      assert.equal(siblingTreeDiagnostic.hostOutputUpdateKind, "Update");
      assert.equal(siblingTreeDiagnostic.hostOutputShape, "SiblingText");
      assert.equal(
        siblingTreeDiagnostic.hostOutputRowId,
        privateToJSONSiblingTextHostOutputRowId
      );
      assert.equal(siblingTreeDiagnostic.rootChildCount, 2);
      assert.equal(siblingTreeDiagnostic.sourceNodeCount, 3);
      assert.equal(
        siblingTreeDiagnostic.sourceFiberCount,
        privateToTreeCompositeMultiChildAcceptedFiberShape.length
      );
      assert.equal(
        siblingTreeDiagnostic.consumesPrivateSiblingTextFinishedWorkIdentityGate,
        true
      );
      assert.equal(
        siblingTreeDiagnostic.consumesPrivateRootFinishedLanesHandoffGate,
        true
      );
      assert.equal(siblingTreeDiagnostic.rootFinishedLanesHandoffAccepted, true);
      assert.equal(
        siblingTreeDiagnostic.rootFinishedLanesHandoffDiagnosticName,
        privateRootFinishedLanesHandoffDiagnosticName
      );
      assert.equal(
        siblingTreeDiagnostic.rootFinishedLanesHandoffStatus,
        privateRootFinishedLanesHandoffStatus
      );
      assert.equal(
        Object.isFrozen(siblingTreeDiagnostic.rootFinishedLanesHandoff),
        true
      );
      assert.equal(
        siblingTreeDiagnostic.finishedWorkIdentity.rootFinishedLanesHandoffAccepted,
        true
      );
      assert.deepEqual(siblingTreeDiagnostic.result, {
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
      assert.equal(siblingTreeDiagnostic.publicToTreeAvailable, false);
      assert.equal(siblingTreeDiagnostic.publicTestInstanceAvailable, false);
      assert.equal(siblingTreeDiagnostic.nativeBridgeAvailable, false);
      assert.equal(siblingTreeDiagnostic.nativeExecution, false);
      assert.equal(siblingTreeDiagnostic.packageCompatibilityClaimed, false);
      assert.equal(siblingTreeDiagnostic.compatibilityClaimed, false);

      assertToTreeSiblingTextAdmissionRejection(
        treeFacade,
        siblingTreeReport,
        jsonUpdateEvidence,
        updateError.rootRequest,
        /sibling-text-finished-work-identity-diagnostic-mismatch/u
      );
      assertToTreeSiblingTextAdmissionRejection(
        treeFacade,
        withSiblingTextReportChange(siblingTreeReport, (report) => {
          delete report.committedFiberInspection;
        }),
        siblingTextIdentity,
        updateError.rootRequest,
        /committedFiberInspection/u
      );
      assertToTreeSiblingTextAdmissionRejection(
        treeFacade,
        withSiblingTextReportChange(siblingTreeReport, (report) => {
          report.committedFiberInspection.compatibilityClaimed = true;
        }),
        siblingTextIdentity,
        updateError.rootRequest,
        /compatibilityClaimed/u
      );
      assertToTreeSiblingTextAdmissionRejection(
        treeFacade,
        siblingTreeReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          delete evidence.rootFinishedLanesHandoff;
        }),
        updateError.rootRequest,
        /rootFinishedLanesHandoff/u
      );
      assertToTreeSiblingTextRootFinishedLanesAliasRejections(
        treeFacade,
        siblingTreeReport,
        siblingTextIdentity,
        updateError.rootRequest
      );
      assertToTreeSiblingTextAdmissionRejection(
        treeFacade,
        siblingTreeReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.rootFinishedLanesHandoff.commitFinishedLanesBits = 2;
        }),
        updateError.rootRequest,
        /finished_lanes handoff/u
      );
      assertToTreeSiblingTextAdmissionRejection(
        treeFacade,
        siblingTreeReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.broadMultichildIdentityAvailable = true;
        }),
        updateError.rootRequest,
        /broad-multichild-identity-unexpectedly-open/u
      );
      assertToTreeSiblingTextAdmissionRejection(
        treeFacade,
        siblingTreeReport,
        withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
          evidence.publicToTreeAvailable = true;
        }),
        updateError.rootRequest,
        /public-or-native-package-js-compatibility-claim/u
      );
    }

    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeUpdateEvidence, (evidence) => {
        evidence.rootRequestSequence += 1;
      }),
      treeUpdateReport,
      "FastReactTestRendererPrivateToTreeMetadataError",
      updateError.rootRequest
    );

    const laterUpdateError = captureThrown(() =>
      renderer.update({
        type: "span",
        props: {},
        children: ["later"]
      })
    );
    const laterJsonUpdateReport = createAcceptedMinimalHostOutputDiagnostic({
      hostOutputUpdateKind: "Update",
      text: "later"
    });
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      jsonUpdateEvidence,
      laterJsonUpdateReport,
      "FastReactTestRendererPrivateToJSONSerializationError",
      updateError.rootRequest
    );
    const laterJsonUpdateEvidence = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: laterUpdateError.rootRequest,
      publicSurface: "create().toJSON",
      sourceSerializationDiagnosticName:
        "fast-react-test-renderer.serialization.private-json-canary",
      consumesPrivateToJSONEvidence: true,
      consumesPrivateToTreeEvidence: false,
      hostOutputUpdateKind: "Update"
    });
    assert.equal(
      jsonFacade.canValidateAcceptedFinishedWorkIdentity(
        laterJsonUpdateEvidence,
        laterJsonUpdateReport,
        laterUpdateError.rootRequest
      ),
      true
    );
    const laterJsonUpdateIdentity =
      jsonFacade.validateAcceptedFinishedWorkIdentity(
        laterJsonUpdateEvidence,
        laterJsonUpdateReport,
        laterUpdateError.rootRequest
      );
    assert.equal(
      laterJsonUpdateIdentity.rootRequest,
      laterUpdateError.rootRequest
    );
    assert.equal(laterJsonUpdateIdentity.rootRequestOperation, "update");
    assert.equal(laterJsonUpdateIdentity.hostOutputUpdateKind, "Update");

    const laterTreeUpdateReport = createAcceptedMinimalTreeMetadataDiagnostic({
      hostOutputUpdateKind: "Update",
      text: "later"
    });
    assertFinishedWorkIdentityRejection(
      treeFacade,
      treeUpdateEvidence,
      laterTreeUpdateReport,
      "FastReactTestRendererPrivateToTreeMetadataError",
      updateError.rootRequest
    );
    const laterTreeUpdateEvidence = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: laterUpdateError.rootRequest,
      publicSurface: "create().toTree",
      sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
      consumesPrivateToJSONEvidence: false,
      consumesPrivateToTreeEvidence: true,
      hostOutputUpdateKind: "Update"
    });
    assert.equal(
      treeFacade.canValidateAcceptedFinishedWorkIdentity(
        laterTreeUpdateEvidence,
        laterTreeUpdateReport,
        laterUpdateError.rootRequest
      ),
      true
    );
    const laterTreeUpdateIdentity =
      treeFacade.validateAcceptedFinishedWorkIdentity(
        laterTreeUpdateEvidence,
        laterTreeUpdateReport,
        laterUpdateError.rootRequest
      );
    assert.equal(
      laterTreeUpdateIdentity.rootRequest,
      laterUpdateError.rootRequest
    );
    assert.equal(laterTreeUpdateIdentity.rootRequestOperation, "update");
    assert.equal(laterTreeUpdateIdentity.hostOutputUpdateKind, "Update");

    assertFinishedWorkIdentityRejection(
      treeFacade,
      null,
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeEvidence, (evidence) => {
        delete evidence.rootRequestId;
        delete evidence.rootRequestSequence;
        delete evidence.rootId;
      }),
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertRootFinishedLanesHandoffAliasRejections(
      treeFacade,
      treeEvidence,
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeEvidence, (evidence) => {
        evidence.rootRequestSequence += 1;
      }),
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeEvidence, (evidence) => {
        evidence.rootId = `${evidence.rootId}:foreign`;
      }),
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      treeEvidence,
      undefined,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeEvidence, (evidence) => {
        delete evidence.renderCurrent;
        delete evidence.commitPreviousCurrent;
      }),
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeEvidence, (evidence) => {
        evidence.commitPreviousCurrent.slot += 1;
      }),
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeEvidence, (evidence) => {
        evidence.commitCurrent.slot += 1;
      }),
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeEvidence, (evidence) => {
        evidence.commitFinishedLanesBits = 2;
      }),
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
    assertFinishedWorkIdentityRejection(
      treeFacade,
      withFinishedWorkIdentityChange(treeEvidence, (evidence) => {
        evidence.consumesPrivateToJSONEvidence = true;
      }),
      treeReport,
      "FastReactTestRendererPrivateToTreeMetadataError"
    );
  }
});

test("react-test-renderer JS private root finished-work/lanes handoff clone and tamper audit stays private", () => {
  for (const entry of jsEntrypoints) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });

    const jsonError = captureThrown(() => renderer.toJSON());
    const jsonFacade = Object.getOwnPropertyDescriptor(
      renderer.toJSON,
      privateToJSONSerializationFacadeSymbol
    ).value;
    const jsonReport = createAcceptedMinimalHostOutputDiagnostic();
    const jsonEvidence = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: jsonError.rootRequest,
      publicSurface: "create().toJSON",
      sourceSerializationDiagnosticName:
        "fast-react-test-renderer.serialization.private-json-canary",
      consumesPrivateToJSONEvidence: true,
      consumesPrivateToTreeEvidence: false
    });
    const clonedEvidence = withFinishedWorkIdentityChange(
      jsonEvidence,
      () => {}
    );
    const clonedReport = withHostOutputReportChange(jsonReport, () => {});

    assert.notEqual(
      clonedEvidence.rootFinishedLanesHandoff,
      jsonEvidence.rootFinishedLanesHandoff,
      entry.entrypoint
    );
    assert.notEqual(clonedReport, jsonReport, entry.entrypoint);
    assert.equal(
      jsonFacade.canValidateAcceptedFinishedWorkIdentity(
        clonedEvidence,
        clonedReport
      ),
      true,
      entry.entrypoint
    );

    const identity = jsonFacade.validateAcceptedFinishedWorkIdentity(
      clonedEvidence,
      clonedReport
    );
    assert.equal(Object.isFrozen(identity), true, entry.entrypoint);
    assert.equal(
      Object.isFrozen(identity.rootFinishedLanesHandoff),
      true,
      entry.entrypoint
    );
    assert.equal(identity.publicToJSONAvailable, false, entry.entrypoint);
    assert.equal(identity.publicToTreeAvailable, false, entry.entrypoint);
    assert.equal(
      identity.publicTestInstanceAvailable,
      false,
      entry.entrypoint
    );
    assert.equal(
      identity.publicSerializationAvailable,
      false,
      entry.entrypoint
    );
    assert.equal(identity.compatibilityClaimed, false, entry.entrypoint);
    assertPrivateRootFinishedLanesHandoffBlockers(
      identity.rootFinishedLanesHandoff,
      entry.entrypoint
    );

    assertRootFinishedLanesHandoffAliasRejections(
      jsonFacade,
      clonedEvidence,
      clonedReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(clonedEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.commitFinishedLanesBits = 2;
      }),
      clonedReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(clonedEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.commitCurrent.slot += 1;
      }),
      clonedReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(clonedEvidence, (evidence) => {
        evidence.commitFinishedLanesBits = 2;
      }),
      clonedReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(clonedEvidence, (evidence) => {
        evidence.reportFinishedWork.slot += 1;
      }),
      clonedReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      clonedEvidence,
      withHostOutputReportChange(clonedReport, (report) => {
        report.hostOutputUpdateKind = "Update";
      }),
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      clonedEvidence,
      withHostOutputReportChange(clonedReport, (report) => {
        report.publicBlockers.compatibilityClaimBlocked = false;
      }),
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(clonedEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.nativeBridgeAvailable = true;
      }),
      clonedReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
    assertFinishedWorkIdentityRejection(
      jsonFacade,
      withFinishedWorkIdentityChange(clonedEvidence, (evidence) => {
        evidence.rootFinishedLanesHandoff.packageCompatibilityClaimed = true;
      }),
      clonedReport,
      "FastReactTestRendererPrivateToJSONSerializationError"
    );
  }
});

test("react-test-renderer CJS dev/prod private toJSON sibling text admission requires handoff and committed fiber inspection", () => {
  const cjsEntries = jsEntrypoints.filter((entry) =>
    entry.entrypoint.includes("/cjs/")
  );
  assert.deepEqual(
    cjsEntries.map((entry) => entry.entrypoint),
    [
      "react-test-renderer/cjs/react-test-renderer.development",
      "react-test-renderer/cjs/react-test-renderer.production"
    ]
  );

  for (const entry of cjsEntries) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });
    const updateError = captureThrown(() =>
      renderer.update({
        type: "span",
        props: {},
        children: ["goodbye"]
      })
    );
    const jsonFacade = Object.getOwnPropertyDescriptor(
      renderer.toJSON,
      privateToJSONSerializationFacadeSymbol
    ).value;
    const siblingTextReport = createAcceptedSiblingTextHostOutputDiagnostic();
    const siblingTextIdentity =
      createAcceptedSiblingTextFinishedWorkIdentityEvidence({
        rootRequest: updateError.rootRequest
      });

    assert.equal(
      jsonFacade.canCreateAcceptedSiblingTextDiagnosticResult(
        siblingTextReport,
        siblingTextIdentity,
        updateError.rootRequest
      ),
      true,
      entry.entrypoint
    );
    const diagnostic = jsonFacade.createAcceptedSiblingTextDiagnosticResult(
      siblingTextReport,
      siblingTextIdentity,
      updateError.rootRequest
    );
    assert.equal(diagnostic.rootFinishedLanesHandoffAccepted, true);
    assert.equal(diagnostic.consumesPrivateRootFinishedLanesHandoffGate, true);
    assert.equal(diagnostic.consumesCommittedFiberInspection, true);
    assert.deepEqual(
      diagnostic.committedFiberInspection,
      createSiblingTextToJSONCommittedFiberInspectionDiagnostic()
    );
    assertSiblingTextAdmissionRejection(
      jsonFacade,
      siblingTextReport,
      createAcceptedFinishedWorkIdentityEvidence({
        rootRequest: updateError.rootRequest,
        publicSurface: "create().toJSON",
        sourceSerializationDiagnosticName:
          "fast-react-test-renderer.serialization.private-json-canary",
        consumesPrivateToJSONEvidence: true,
        consumesPrivateToTreeEvidence: false,
        hostOutputUpdateKind: "Update"
      }),
      updateError.rootRequest,
      /sibling-text-finished-work-identity-diagnostic-mismatch/u
    );
    assertSiblingTextAdmissionRejection(
      jsonFacade,
      withSiblingTextReportChange(siblingTextReport, (report) => {
        delete report.committedFiberInspection;
      }),
      siblingTextIdentity,
      updateError.rootRequest,
      /committedFiberInspection/u
    );
    assertSiblingTextAdmissionRejection(
      jsonFacade,
      withSiblingTextReportChange(siblingTextReport, (report) => {
        report.committedFiberInspection.compatibilityClaimed = true;
      }),
      siblingTextIdentity,
      updateError.rootRequest,
      /compatibilityClaimed/u
    );
    assertSiblingTextAdmissionRejection(
      jsonFacade,
      siblingTextReport,
      withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
        delete evidence.rootFinishedLanesHandoff;
      }),
      updateError.rootRequest,
      /rootFinishedLanesHandoff/u
    );
    assertSiblingTextAdmissionRejection(
      jsonFacade,
      siblingTextReport,
      withInheritedSiblingTextRootFinishedLanesHandoff(siblingTextIdentity),
      updateError.rootRequest,
      /rootFinishedLanesHandoff/u
    );
    assertSiblingTextAdmissionRejection(
      jsonFacade,
      siblingTextReport,
      withSiblingTextIdentityChange(siblingTextIdentity, (evidence) => {
        evidence.rootFinishedLanesHandoff.commitFinishedLanesBits = 2;
      }),
      updateError.rootRequest,
      /finished_lanes handoff/u
    );
  }
});

test("react-test-renderer package-root and CJS private toTree sibling text admission requires committed fiber inspection", () => {
  const siblingAdmissionEntries = jsEntrypoints.filter(
    hasSiblingTextPrivateAdmission
  );
  assert.deepEqual(
    siblingAdmissionEntries.map((entry) => entry.entrypoint),
    [
      "react-test-renderer",
      "react-test-renderer/cjs/react-test-renderer.development",
      "react-test-renderer/cjs/react-test-renderer.production"
    ]
  );

  for (const entry of siblingAdmissionEntries) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });
    const updateError = captureThrown(() =>
      renderer.update({
        type: "span",
        props: {},
        children: ["goodbye"]
      })
    );
    captureThrown(() => renderer.toTree());
    const treeFacade = Object.getOwnPropertyDescriptor(
      renderer.toTree,
      privateToTreeFacadeSymbol
    ).value;
    const siblingTreeReport = createAcceptedMultiChildTreeMetadataDiagnostic({
      composite: true,
      hostOutputUpdateKind: "Update"
    });
    const siblingTextIdentity =
      createAcceptedSiblingTextFinishedWorkIdentityEvidence({
        rootRequest: updateError.rootRequest
      });

    assert.equal(
      treeFacade.canCreateAcceptedSiblingTextDiagnosticResult(
        siblingTreeReport,
        siblingTextIdentity,
        updateError.rootRequest
      ),
      true,
      entry.entrypoint
    );
    assertToTreeSiblingTextAdmissionRejection(
      treeFacade,
      withSiblingTextReportChange(siblingTreeReport, (report) => {
        delete report.committedFiberInspection;
      }),
      siblingTextIdentity,
      updateError.rootRequest,
      /committedFiberInspection/u
    );
    assertToTreeSiblingTextAdmissionRejection(
      treeFacade,
      withSiblingTextReportChange(siblingTreeReport, (report) => {
        report.committedFiberInspection.compatibilityClaimed = true;
      }),
      siblingTextIdentity,
      updateError.rootRequest,
      /compatibilityClaimed/u
    );
  }
});

test("react-test-renderer sibling-text private admissions reject stale identity and public/native claim matrices", () => {
  const packageRootEntry = jsEntrypoints.find(
    (entry) => entry.entrypoint === packageRootEntrypoint
  );
  assert.notEqual(packageRootEntry, undefined);

  {
    const { jsonFacade, updateRootRequest } =
      createSiblingTextAdmissionRuntime(packageRootEntry);
    const siblingTextReport = createAcceptedSiblingTextHostOutputDiagnostic();
    const siblingTextIdentity =
      createAcceptedSiblingTextFinishedWorkIdentityEvidence({
        rootRequest: updateRootRequest
      });
    assertSiblingTextAdmissionNegativeMatrix({
      report: siblingTextReport,
      evidence: siblingTextIdentity,
      sourceRootRequest: updateRootRequest,
      reject(report, evidence, messagePattern) {
        return assertSiblingTextAdmissionRejection(
          jsonFacade,
          report,
          evidence,
          updateRootRequest,
          messagePattern
        );
      },
      includeMissingCanonicalRootIds: true
    });
    assertSiblingTextHostOutputReportClaimRejections({
      report: siblingTextReport,
      evidence: siblingTextIdentity,
      reject(report, evidence, messagePattern) {
        return assertSiblingTextAdmissionRejection(
          jsonFacade,
          report,
          evidence,
          updateRootRequest,
          messagePattern
        );
      }
    });
  }

  const siblingAdmissionEntries = jsEntrypoints.filter(
    hasSiblingTextPrivateAdmission
  );
  for (const entry of siblingAdmissionEntries) {
    const { jsonFacade, treeFacade, updateRootRequest } =
      createSiblingTextAdmissionRuntime(entry);
    const siblingTextReport = createAcceptedSiblingTextHostOutputDiagnostic();
    const siblingTextIdentity =
      createAcceptedSiblingTextFinishedWorkIdentityEvidence({
        rootRequest: updateRootRequest
      });

    assertSiblingTextAdmissionNegativeMatrix({
      report: siblingTextReport,
      evidence: siblingTextIdentity,
      sourceRootRequest: updateRootRequest,
      reject(report, evidence, messagePattern) {
        return assertSiblingTextAdmissionRejection(
          jsonFacade,
          report,
          evidence,
          updateRootRequest,
          messagePattern
        );
      }
    });
    assertSiblingTextHostOutputReportClaimRejections({
      report: siblingTextReport,
      evidence: siblingTextIdentity,
      reject(report, evidence, messagePattern) {
        return assertSiblingTextAdmissionRejection(
          jsonFacade,
          report,
          evidence,
          updateRootRequest,
          messagePattern
        );
      }
    });
    if (entry.entrypoint.includes("/cjs/")) {
      assertSiblingTextCommittedFiberInspectionRejections({
        report: siblingTextReport,
        evidence: siblingTextIdentity,
        reject(report, evidence, messagePattern) {
          return assertSiblingTextAdmissionRejection(
            jsonFacade,
            report,
            evidence,
            updateRootRequest,
            messagePattern
          );
        }
      });
    }

    const siblingTreeReport = createAcceptedMultiChildTreeMetadataDiagnostic({
      composite: true,
      hostOutputUpdateKind: "Update"
    });
    assertSiblingTextAdmissionNegativeMatrix({
      report: siblingTreeReport,
      evidence: siblingTextIdentity,
      sourceRootRequest: updateRootRequest,
      reject(report, evidence, messagePattern) {
        return assertToTreeSiblingTextAdmissionRejection(
          treeFacade,
          report,
          evidence,
          updateRootRequest,
          messagePattern
        );
      }
    });
    assertToTreeSiblingTextReportClaimRejections({
      report: siblingTreeReport,
      evidence: siblingTextIdentity,
      reject(report, evidence, messagePattern) {
        return assertToTreeSiblingTextAdmissionRejection(
          treeFacade,
          report,
          evidence,
          updateRootRequest,
          messagePattern
        );
      }
    });
    assertToTreeSiblingTextCommittedFiberInspectionRejections({
      report: siblingTreeReport,
      evidence: siblingTextIdentity,
      reject(report, evidence, messagePattern) {
        return assertToTreeSiblingTextAdmissionRejection(
          treeFacade,
          report,
          evidence,
          updateRootRequest,
          messagePattern
        );
      }
    });
  }
});

test("react-test-renderer package-root private unmount finished-work identity requires matching handoff evidence", () => {
  const entry = jsEntrypoints.find(
    (candidate) => candidate.entrypoint === "react-test-renderer"
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.specifier);
  const renderer = moduleExports.create({
    type: "span",
    props: {},
    children: ["hello"]
  });
  const jsonFacade = Object.getOwnPropertyDescriptor(
    renderer.toJSON,
    privateToJSONSerializationFacadeSymbol
  ).value;
  const treeFacade = Object.getOwnPropertyDescriptor(
    renderer.toTree,
    privateToTreeFacadeSymbol
  ).value;
  const unmountError = captureThrown(() => renderer.unmount());

  assert.equal(jsonFacade.privateUnmountFinishedWorkIdentityGateAvailable, true);
  assert.equal(jsonFacade.validatesUnmountRootRequestIdentity, true);
  assert.equal(
    jsonFacade.validatesUnmountDeletionAndCleanupHandoffIdentity,
    true
  );
  assert.equal(treeFacade.privateUnmountFinishedWorkIdentityGateAvailable, true);
  assert.equal(treeFacade.validatesUnmountRootRequestIdentity, true);
  assert.equal(
    treeFacade.validatesUnmountDeletionAndCleanupHandoffIdentity,
    true
  );

  const jsonReport = createAcceptedEmptyRootHostOutputDiagnostic({
    hostOutputUpdateKind: "Unmount"
  });
  const jsonEvidence = createAcceptedFinishedWorkIdentityEvidence({
    rootRequest: unmountError.rootRequest,
    publicSurface: "create().toJSON",
    sourceSerializationDiagnosticName:
      "fast-react-test-renderer.serialization.private-json-canary",
    consumesPrivateToJSONEvidence: true,
    consumesPrivateToTreeEvidence: false,
    hostOutputUpdateKind: "Unmount",
    unmountCleanupVariant: "host-only"
  });

  assert.equal(
    jsonFacade.canValidateAcceptedFinishedWorkIdentity(
      jsonEvidence,
      jsonReport
    ),
    false
  );
  assert.equal(
    jsonFacade.canValidateAcceptedFinishedWorkIdentity(
      jsonEvidence,
      jsonReport,
      unmountError.rootRequest
    ),
    true
  );
  const jsonIdentity = jsonFacade.validateAcceptedFinishedWorkIdentity(
    jsonEvidence,
    jsonReport,
    unmountError.rootRequest
  );
  assert.equal(jsonIdentity.rootRequest, unmountError.rootRequest);
  assert.equal(jsonIdentity.rootRequestOperation, "unmount");
  assert.equal(jsonIdentity.rootRequestUpdateKind, "Unmount");
  assert.equal(jsonIdentity.hostOutputUpdateKind, "Unmount");
  assert.equal(jsonIdentity.unmountDeletionCommitHandoffAccepted, true);
  assert.equal(jsonIdentity.unmountCleanupHandoffAccepted, true);
  assert.equal(jsonIdentity.cleanupHandoffVariant, "host-only");
  assert.equal(jsonIdentity.hostNodeCleanupCount, 2);
  assert.equal(jsonIdentity.refCleanupReturnCount, 0);
  assert.equal(jsonIdentity.passiveDestroyCount, 0);
  assert.equal(jsonIdentity.cleanupOrderRecordCount, 2);
  assert.equal(jsonIdentity.minimalTreeCleanupHandoff, true);
  assert.equal(jsonIdentity.publicSerializationAvailable, false);
  assert.equal(jsonIdentity.compatibilityClaimed, false);

  assertFinishedWorkIdentityRejection(
    jsonFacade,
    withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
      delete evidence.deletionCommitHandoff;
      delete evidence.cleanupHandoff.deletionCommitHandoff;
    }),
    jsonReport,
    "FastReactTestRendererPrivateToJSONSerializationError",
    unmountError.rootRequest
  );
  assertFinishedWorkIdentityRejection(
    jsonFacade,
    withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
      delete evidence.deletionCommitHandoff;
    }),
    jsonReport,
    "FastReactTestRendererPrivateToJSONSerializationError",
    unmountError.rootRequest
  );
  assertFinishedWorkIdentityRejection(
    jsonFacade,
    withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
      evidence.cleanupHandoff.deletionCommitHandoff.hostNodeCleanupCount = 3;
      evidence.cleanupHandoff.deletionCommitHandoff.cleanupOrderRecordCount = 3;
    }),
    jsonReport,
    "FastReactTestRendererPrivateToJSONSerializationError",
    unmountError.rootRequest
  );
  assertFinishedWorkIdentityRejection(
    jsonFacade,
    withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
      evidence.cleanupHandoff.deletionCommitHandoff.status =
        "private-unmount-deletion-commit-handoff-stale";
    }),
    jsonReport,
    "FastReactTestRendererPrivateToJSONSerializationError",
    unmountError.rootRequest
  );
  assertFinishedWorkIdentityRejection(
    jsonFacade,
    withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
      evidence.cleanupHandoff.rootRequestSequence += 1;
    }),
    jsonReport,
    "FastReactTestRendererPrivateToJSONSerializationError",
    unmountError.rootRequest
  );
  assertFinishedWorkIdentityRejection(
    jsonFacade,
    withFinishedWorkIdentityChange(jsonEvidence, (evidence) => {
      evidence.rootRequestSequence += 1;
    }),
    jsonReport,
    "FastReactTestRendererPrivateToJSONSerializationError",
    unmountError.rootRequest
  );

  const treeReport = createAcceptedUnmountTreeMetadataDiagnostic();
  const treeEvidence = createAcceptedFinishedWorkIdentityEvidence({
    rootRequest: unmountError.rootRequest,
    publicSurface: "create().toTree",
    sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
    consumesPrivateToJSONEvidence: false,
    consumesPrivateToTreeEvidence: true,
    hostOutputUpdateKind: "Unmount",
    unmountCleanupVariant: "ref-passive"
  });
  assert.equal(
    treeFacade.canValidateAcceptedFinishedWorkIdentity(
      treeEvidence,
      treeReport,
      unmountError.rootRequest
    ),
    true
  );
  const treeIdentity = treeFacade.validateAcceptedFinishedWorkIdentity(
    treeEvidence,
    treeReport,
    unmountError.rootRequest
  );
  assert.equal(treeIdentity.cleanupHandoffVariant, "ref-passive");
  assert.equal(treeIdentity.refCleanupReturnCount, 1);
  assert.equal(treeIdentity.passiveDestroyCount, 1);
  assert.equal(treeIdentity.cleanupOrderRecordCount, 4);
  assert.equal(treeIdentity.minimalTreeCleanupHandoff, false);
  assert.equal(treeIdentity.publicToTreeAvailable, false);
  assert.equal(treeIdentity.compatibilityClaimed, false);

  const foreignRenderer = moduleExports.create({
    type: "span",
    props: {},
    children: ["foreign"]
  });
  const foreignUnmountError = captureThrown(() => foreignRenderer.unmount());
  const foreignEvidence = createAcceptedFinishedWorkIdentityEvidence({
    rootRequest: foreignUnmountError.rootRequest,
    publicSurface: "create().toTree",
    sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
    consumesPrivateToJSONEvidence: false,
    consumesPrivateToTreeEvidence: true,
    hostOutputUpdateKind: "Unmount",
    unmountCleanupVariant: "host-only"
  });
  assertFinishedWorkIdentityRejection(
    treeFacade,
    foreignEvidence,
    treeReport,
    "FastReactTestRendererPrivateToTreeMetadataError",
    foreignUnmountError.rootRequest
  );
});

test("react-test-renderer package-root private native create/update serialization consumes accepted records", () => {
  const entry = jsEntrypoints.find(
    (candidate) => candidate.entrypoint === packageRootEntrypoint
  );
  assert.notEqual(entry, undefined);

  const moduleExports = loadFresh(entry.specifier);
  const renderer = moduleExports.create({
    type: "span",
    props: {},
    children: ["hello"]
  });
  const jsonError = captureThrown(() => renderer.toJSON());
  const jsonFacade = Object.getOwnPropertyDescriptor(
    renderer.toJSON,
    privateToJSONSerializationFacadeSymbol
  ).value;
  const treeError = captureThrown(() => renderer.toTree());
  const treeFacade = Object.getOwnPropertyDescriptor(
    renderer.toTree,
    privateToTreeFacadeSymbol
  ).value;
  const createRequest = jsonError.rootRequest;
  assert.equal(treeError.rootRequest.rootHandle, createRequest.rootHandle);

  const createJSONRecord = createAcceptedNativeExecutionRecord(
    moduleExports,
    createRequest
  );
  const createJSONReport = createAcceptedMinimalHostOutputDiagnostic({
    hostOutputUpdateKind: "Create"
  });
  const createJSONIdentity = createAcceptedFinishedWorkIdentityEvidence({
    rootRequest: createRequest,
    publicSurface: "create().toJSON",
    sourceSerializationDiagnosticName:
      "fast-react-test-renderer.serialization.private-json-canary",
    consumesPrivateToJSONEvidence: true,
    consumesPrivateToTreeEvidence: false,
    hostOutputUpdateKind: "Create"
  });
  const createJSONResult =
    jsonFacade.createAcceptedNativeExecutionDiagnosticResult(
      createJSONRecord,
      createJSONReport,
      createJSONIdentity
    );
  assert.equal(createJSONResult.operation, "create");
  assert.equal(createJSONResult.hostOutputUpdateKind, "Create");
  assert.equal(createJSONResult.hostOutputShape, "SingleHostText");
  assert.equal(createJSONResult.hostOutputRowId, null);
  assert.equal(createJSONResult.consumesAcceptedNativeCreateExecutionRecord, true);
  assert.equal(createJSONResult.consumesAcceptedFinishedWorkIdentityGate, true);
  assert.equal(createJSONResult.nativeExecution, false);

  const createTreeResult =
    treeFacade.createAcceptedNativeExecutionDiagnosticResult(
      createAcceptedNativeExecutionRecord(moduleExports, createRequest),
      createAcceptedMinimalTreeMetadataDiagnostic({
        hostOutputUpdateKind: "Create",
        compositeNativeExecution: true
      }),
      createAcceptedFinishedWorkIdentityEvidence({
        rootRequest: createRequest,
        publicSurface: "create().toTree",
        sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
        consumesPrivateToJSONEvidence: false,
        consumesPrivateToTreeEvidence: true,
        hostOutputUpdateKind: "Create"
      })
    );
  assert.equal(createTreeResult.operation, "create");
  assert.equal(createTreeResult.hostOutputUpdateKind, "Create");
  assert.equal(createTreeResult.functionComponentAboveHostOutputShape, true);
  assert.equal(createTreeResult.publicTreeAvailable, false);
  assert.equal(createTreeResult.nativeExecution, false);

  const updateError = captureThrown(() =>
    renderer.update({
      type: "span",
      props: { "data-state": "new", children: "goodbye" }
    })
  );
  const updateRequest = updateError.rootRequest;
  const updateRecord = createAcceptedNativeExecutionRecord(
    moduleExports,
    updateRequest
  );
  assert.equal(
    jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
      createJSONRecord,
      createJSONReport,
      createJSONIdentity
    ),
    false
  );
  const staleCreateJSONRecordError = captureThrown(() =>
    jsonFacade.createAcceptedNativeExecutionDiagnosticResult(
      createJSONRecord,
      createJSONReport,
      createJSONIdentity
    )
  );
  assert.equal(
    staleCreateJSONRecordError.name,
    "FastReactTestRendererPrivateToJSONSerializationError"
  );
  assert.match(staleCreateJSONRecordError.message, /request sequence is stale/u);

  const updateJSONResult =
    jsonFacade.createAcceptedNativeExecutionDiagnosticResult(
      updateRecord,
      createAcceptedMinimalHostOutputDiagnostic({
        hostOutputUpdateKind: "Update",
        propsAttributes: { "data-state": "new" },
        text: "goodbye"
      }),
      createAcceptedFinishedWorkIdentityEvidence({
        rootRequest: updateRequest,
        publicSurface: "create().toJSON",
        sourceSerializationDiagnosticName:
          "fast-react-test-renderer.serialization.private-json-canary",
        consumesPrivateToJSONEvidence: true,
        consumesPrivateToTreeEvidence: false,
        hostOutputUpdateKind: "Update"
      })
    );
  assert.equal(updateJSONResult.operation, "update");
  assert.equal(updateJSONResult.hostOutputUpdateKind, "Update");
  assert.equal(updateJSONResult.hostOutputRowId, privateToJSONUpdateHostOutputRowId);
  assert.equal(updateJSONResult.consumesAcceptedNativeUpdateExecutionRecord, true);
  assert.equal(updateJSONResult.acceptedHostOutputRowShape, true);
  assert.equal(updateJSONResult.nativeExecution, false);

  const updateJSONIdentity = createAcceptedFinishedWorkIdentityEvidence({
    rootRequest: updateRequest,
    publicSurface: "create().toJSON",
    sourceSerializationDiagnosticName:
      "fast-react-test-renderer.serialization.private-json-canary",
    consumesPrivateToJSONEvidence: true,
    consumesPrivateToTreeEvidence: false,
    hostOutputUpdateKind: "Update"
  });
  assert.equal(
    jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
      updateRecord,
      createAcceptedNestedHostOutputDiagnostic(),
      updateJSONIdentity
    ),
    false
  );
  assert.equal(
    jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
      updateRecord,
      createAcceptedSiblingTextHostOutputDiagnostic(),
      createAcceptedSiblingTextFinishedWorkIdentityEvidence({
        rootRequest: updateRequest
      })
    ),
    false
  );
  const clonedExecutionRecord = {
    ...updateRecord
  };
  assert.equal(
    jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
      clonedExecutionRecord,
      createAcceptedMinimalHostOutputDiagnostic({
        hostOutputUpdateKind: "Update",
        propsAttributes: { "data-state": "new" },
        text: "goodbye"
      }),
      updateJSONIdentity
    ),
    false
  );
  const missingExecutionKindStatusRecord = {
    ...updateRecord
  };
  delete missingExecutionKindStatusRecord.kind;
  delete missingExecutionKindStatusRecord.status;
  const missingExecutionKindStatusError = captureThrown(() =>
    jsonFacade.createAcceptedNativeExecutionDiagnosticResult(
      missingExecutionKindStatusRecord,
      createAcceptedMinimalHostOutputDiagnostic({
        hostOutputUpdateKind: "Update",
        propsAttributes: { "data-state": "new" },
        text: "goodbye"
      }),
      updateJSONIdentity
    )
  );
  assert.equal(
    missingExecutionKindStatusError.name,
    "FastReactTestRendererPrivateToJSONSerializationError"
  );
  assert.match(
    missingExecutionKindStatusError.message,
    /FastReactTestRendererPrivateRootExecutionResult/u
  );
  const missingTreeExecutionKindStatusError = captureThrown(() =>
    treeFacade.createAcceptedNativeExecutionDiagnosticResult(
      missingExecutionKindStatusRecord,
      createAcceptedMinimalTreeMetadataDiagnostic({
        hostOutputUpdateKind: "Update",
        text: "goodbye",
        compositeNativeExecution: true
      }),
      createAcceptedFinishedWorkIdentityEvidence({
        rootRequest: updateRequest,
        publicSurface: "create().toTree",
        sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
        consumesPrivateToJSONEvidence: false,
        consumesPrivateToTreeEvidence: true,
        hostOutputUpdateKind: "Update"
      })
    )
  );
  assert.equal(
    missingTreeExecutionKindStatusError.name,
    "FastReactTestRendererPrivateToTreeMetadataError"
  );
  assert.match(
    missingTreeExecutionKindStatusError.message,
    /FastReactTestRendererPrivateRootExecutionResult/u
  );

  const mismatchedDirectRowId = createAcceptedMinimalHostOutputDiagnostic({
    hostOutputUpdateKind: "Update",
    text: "mismatch"
  });
  mismatchedDirectRowId.hostOutputRowId =
    privateToJSONSiblingTextHostOutputRowId;
  assert.equal(
    jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
      updateRecord,
      mismatchedDirectRowId,
      updateJSONIdentity
    ),
    false
  );
  const mismatchedDirectRowIdError = captureThrown(() =>
    jsonFacade.createAcceptedNativeExecutionDiagnosticResult(
      updateRecord,
      mismatchedDirectRowId,
      updateJSONIdentity
    )
  );
  assert.equal(
    mismatchedDirectRowIdError.name,
    "FastReactTestRendererPrivateToJSONSerializationError"
  );
  assert.match(
    mismatchedDirectRowIdError.message,
    /hostOutputRowId to match hostOutputRow\.id/u
  );
  const missingNativeRowShape = createAcceptedMinimalHostOutputDiagnostic({
    hostOutputUpdateKind: "Update",
    text: "missing shape"
  });
  delete missingNativeRowShape.hostOutputRow.hostOutputShape;
  const missingNativeRowShapeError = captureThrown(() =>
    jsonFacade.createAcceptedNativeExecutionDiagnosticResult(
      updateRecord,
      missingNativeRowShape,
      updateJSONIdentity
    )
  );
  assert.equal(
    missingNativeRowShapeError.name,
    "FastReactTestRendererPrivateToJSONSerializationError"
  );
  assert.match(missingNativeRowShapeError.message, /hostOutputShape/u);

  const updateTreeResult =
    treeFacade.createAcceptedNativeExecutionDiagnosticResult(
      updateRecord,
      createAcceptedMinimalTreeMetadataDiagnostic({
        hostOutputUpdateKind: "Update",
        text: "goodbye",
        compositeNativeExecution: true
      }),
      createAcceptedFinishedWorkIdentityEvidence({
        rootRequest: updateRequest,
        publicSurface: "create().toTree",
        sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
        consumesPrivateToJSONEvidence: false,
        consumesPrivateToTreeEvidence: true,
        hostOutputUpdateKind: "Update"
      })
    );
  assert.equal(updateTreeResult.operation, "update");
  assert.equal(updateTreeResult.hostOutputUpdateKind, "Update");
  assert.equal(updateTreeResult.hostOutputRowId, privateToJSONUpdateHostOutputRowId);
  assert.equal(updateTreeResult.consumesAcceptedNativeUpdateExecutionRecord, true);
  assert.equal(updateTreeResult.functionComponentAboveHostOutputShape, true);
  assert.equal(updateTreeResult.nativeExecution, false);
});

test("react-test-renderer CJS private native serialization rejects malformed execution records", () => {
  const cjsNativeSerializationEntries = jsEntrypoints.filter((entry) =>
    entry.entrypoint.includes("/cjs/")
  );
  assert.equal(cjsNativeSerializationEntries.length, 2);

  const rejectedExecutionRecords = [
    {
      label: "missing kind",
      mutate(record) {
        delete record.kind;
      },
      messagePattern: /FastReactTestRendererPrivateRootExecutionResult/u
    },
    {
      label: "missing status",
      mutate(record) {
        delete record.status;
      },
      messagePattern: /accepted private root execution result status/u
    },
    {
      label: "missing kind and status",
      mutate(record) {
        delete record.kind;
        delete record.status;
      },
      messagePattern: /FastReactTestRendererPrivateRootExecutionResult/u
    },
    {
      label: "wrong kind",
      mutate(record) {
        record.kind = "CallerBuiltRootExecutionResult";
      },
      messagePattern: /FastReactTestRendererPrivateRootExecutionResult/u
    },
    {
      label: "wrong status",
      mutate(record) {
        record.status = "caller-built-root-execution-result";
      },
      messagePattern: /accepted private root execution result status/u
    },
    {
      label: "caller-built clone",
      mutate() {},
      messagePattern: /source-owned private native root execution result/u
    }
  ];

  for (const entry of cjsNativeSerializationEntries) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: { children: "hello" }
    });
    const jsonFacade = Object.getOwnPropertyDescriptor(
      renderer.toJSON,
      privateToJSONSerializationFacadeSymbol
    ).value;
    const treeFacade = Object.getOwnPropertyDescriptor(
      renderer.toTree,
      privateToTreeFacadeSymbol
    ).value;
    const updateError = captureThrown(() =>
      renderer.update({
        type: "span",
        props: { children: "goodbye" }
      })
    );
    const updateRequest = updateError.rootRequest;
    const updateRecord = createAcceptedNativeExecutionRecord(
      moduleExports,
      updateRequest
    );
    const jsonReport = createAcceptedMinimalHostOutputDiagnostic({
      hostOutputUpdateKind: "Update",
      text: "goodbye"
    });
    const jsonIdentity = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: updateRequest,
      publicSurface: "create().toJSON",
      sourceSerializationDiagnosticName:
        "fast-react-test-renderer.serialization.private-json-canary",
      consumesPrivateToJSONEvidence: true,
      consumesPrivateToTreeEvidence: false,
      hostOutputUpdateKind: "Update"
    });
    const treeReport = createAcceptedMinimalTreeMetadataDiagnostic({
      hostOutputUpdateKind: "Update",
      text: "goodbye",
      compositeNativeExecution: true
    });
    const treeIdentity = createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: updateRequest,
      publicSurface: "create().toTree",
      sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
      consumesPrivateToJSONEvidence: false,
      consumesPrivateToTreeEvidence: true,
      hostOutputUpdateKind: "Update"
    });

    assert.equal(
      jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
        updateRecord,
        jsonReport,
        jsonIdentity
      ),
      true,
      `${entry.entrypoint} accepts source-owned toJSON record`
    );
    assert.equal(
      treeFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
        updateRecord,
        treeReport,
        treeIdentity
      ),
      true,
      `${entry.entrypoint} accepts source-owned toTree record`
    );

    for (const rejected of rejectedExecutionRecords) {
      const executionRecord = { ...updateRecord };
      rejected.mutate(executionRecord);

      assertNativeExecutionIdentityRejection({
        facade: jsonFacade,
        executionRecord,
        report: jsonReport,
        identityEvidence: jsonIdentity,
        errorName: "FastReactTestRendererPrivateToJSONSerializationError",
        messagePattern: rejected.messagePattern,
        label: `${entry.entrypoint} toJSON ${rejected.label}`
      });
      assertNativeExecutionIdentityRejection({
        facade: treeFacade,
        executionRecord,
        report: treeReport,
        identityEvidence: treeIdentity,
        errorName: "FastReactTestRendererPrivateToTreeMetadataError",
        messagePattern: rejected.messagePattern,
        label: `${entry.entrypoint} toTree ${rejected.label}`
      });
    }
  }
});

test("react-test-renderer JS private native unmount serialization accepts strict finished-work identity evidence", () => {
  const nativeUnmountEntrypoints = jsEntrypoints.filter((entry) =>
    entry.entrypoint === packageRootEntrypoint ||
    entry.entrypoint.startsWith("react-test-renderer/cjs/")
  );

  for (const entry of nativeUnmountEntrypoints) {
    const moduleExports = loadFresh(entry.specifier);
    const renderer = moduleExports.create({
      type: "span",
      props: {},
      children: ["hello"]
    });
    const jsonError = captureThrown(() => renderer.toJSON());
    const jsonFacade = Object.getOwnPropertyDescriptor(
      renderer.toJSON,
      privateToJSONSerializationFacadeSymbol
    ).value;
    const treeError = captureThrown(() => renderer.toTree());
    const treeFacade = Object.getOwnPropertyDescriptor(
      renderer.toTree,
      privateToTreeFacadeSymbol
    ).value;
    const unmountError = captureThrown(() => renderer.unmount());
    const unmountExecutionRecord = createAcceptedNativeExecutionRecord(
      moduleExports,
      unmountError.rootRequest
    );

    const jsonUnmountReport = createAcceptedEmptyRootHostOutputDiagnostic({
      hostOutputUpdateKind: "Unmount"
    });
    assert.equal(
      jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
        unmountExecutionRecord,
        jsonUnmountReport
      ),
      false
    );

    const jsonUnmountIdentityEvidence =
      createAcceptedFinishedWorkIdentityEvidence({
        rootRequest: unmountError.rootRequest,
        publicSurface: "create().toJSON",
        sourceSerializationDiagnosticName:
          "fast-react-test-renderer.serialization.private-json-canary",
        consumesPrivateToJSONEvidence: true,
        consumesPrivateToTreeEvidence: false,
        hostOutputUpdateKind: "Unmount"
      });
    assert.equal(
      jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
        unmountExecutionRecord,
        jsonUnmountReport,
        jsonUnmountIdentityEvidence
      ),
      true
    );
    const jsonUnmountResult =
      jsonFacade.createAcceptedNativeExecutionDiagnosticResult(
        unmountExecutionRecord,
        jsonUnmountReport,
        jsonUnmountIdentityEvidence
      );
    assert.equal(jsonUnmountResult.operation, "unmount");
    assert.equal(jsonUnmountResult.rootId, unmountError.rootRequest.rootId);
    assert.equal(jsonUnmountResult.hostOutputUpdateKind, "Unmount");
    assert.equal(jsonUnmountResult.hostOutputShape, "EmptyRoot");
    assert.equal(jsonUnmountResult.hostOutputRowId, privateToJSONUnmountHostOutputRowId);
    assert.equal(jsonUnmountResult.sourceNodeCount, 0);
    assert.equal(jsonUnmountResult.rootChildCount, 0);
    assert.equal(jsonUnmountResult.result, null);
    assert.equal(
      jsonUnmountResult.consumesAcceptedFinishedWorkIdentityGate,
      true
    );
    assert.equal(
      jsonUnmountResult.finishedWorkIdentity.rootRequestOperation,
      "unmount"
    );
    assert.equal(
      jsonUnmountResult.finishedWorkIdentity.rootRequestId,
      unmountError.rootRequest.requestId
    );
    assert.equal(jsonUnmountResult.publicSerializationAvailable, false);
    assert.equal(jsonUnmountResult.nativeExecution, false);
    assert.equal(jsonUnmountResult.compatibilityClaimed, false);

    const refPassiveUnmountExecutionRecord = createAcceptedNativeExecutionRecord(
      moduleExports,
      unmountError.rootRequest,
      { refPassiveCleanup: true }
    );
    assert.equal(
      jsonFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
        refPassiveUnmountExecutionRecord,
        jsonUnmountReport,
        jsonUnmountIdentityEvidence
      ),
      true
    );
    const jsonRefPassiveUnmountResult =
      jsonFacade.createAcceptedNativeExecutionDiagnosticResult(
        refPassiveUnmountExecutionRecord,
        jsonUnmountReport,
        jsonUnmountIdentityEvidence
      );
    assert.equal(jsonRefPassiveUnmountResult.operation, "unmount");
    assert.equal(
      jsonRefPassiveUnmountResult.publicSerializationAvailable,
      false
    );
    assert.equal(jsonRefPassiveUnmountResult.publicRouteAvailable, false);
    assert.equal(jsonRefPassiveUnmountResult.nativeBridgeAvailable, false);
    assert.equal(jsonRefPassiveUnmountResult.nativeExecution, false);
    assert.equal(jsonRefPassiveUnmountResult.compatibilityClaimed, false);
    assertPrivateUnmountExecutionEvidenceBlocked(
      refPassiveUnmountExecutionRecord
    );
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        refPassiveUnmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeAdmission.deletionCommitHandoff
            .passiveRefCleanupOrder.hostCleanupFollowsPassiveDestroy = false;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        refPassiveUnmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff
            .minimalTreeCleanupHandoff = true;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          delete record.privateUnmountNativeBridgeCleanupHandoff
            .passiveRefCleanupOrder;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff
            .passiveRefCleanupOrder.rootId =
            `${unmountError.rootRequest.rootId}:foreign`;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        refPassiveUnmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff
            .passiveRefCleanupOrder.firstHostNodeCleanupOrder = 0;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        refPassiveUnmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff.refCleanupReturnCount =
            0;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        refPassiveUnmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff.passiveDestroyCount =
            0;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        refPassiveUnmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff
            .nativeCleanupAfterRefAndPassiveOrdering = false;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });

    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: unmountExecutionRecord,
      report: jsonUnmountReport,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: unmountExecutionRecord,
      report: jsonUnmountReport,
      identityEvidence: withFinishedWorkIdentityChange(
        jsonUnmountIdentityEvidence,
        (evidence) => {
          evidence.rootRequestId = `${evidence.rootRequestId}:stale`;
        }
      ),
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: unmountExecutionRecord,
      report: jsonUnmountReport,
      identityEvidence: withFinishedWorkIdentityChange(
        jsonUnmountIdentityEvidence,
        (evidence) => {
          evidence.rootId = `${evidence.rootId}:foreign`;
        }
      ),
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: unmountExecutionRecord,
      report: jsonUnmountReport,
      identityEvidence: withFinishedWorkIdentityChange(
        jsonUnmountIdentityEvidence,
        (evidence) => {
          evidence.hostOutputUpdateKind = "Update";
        }
      ),
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: unmountExecutionRecord,
      report: jsonUnmountReport,
      identityEvidence: withFinishedWorkIdentityChange(
        jsonUnmountIdentityEvidence,
        (evidence) => {
          evidence.publicSerializationAvailable = true;
        }
      ),
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.nativeExecution = true;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeAdmission.cleanupHandoffAccepted =
            false;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          delete record.privateUnmountNativeBridgeAdmission
            .deletionCommitHandoff.requestId;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          delete record.privateUnmountNativeBridgeAdmission
            .deletionCommitHandoff.requestSequence;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeAdmission.deletionCommitHandoff
            .requestSequence = unmountError.rootRequest.requestSequence + 1;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeAdmission.deletionCommitHandoff
            .requestId = `${unmountError.rootRequest.requestId}:foreign`;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          delete record.privateUnmountNativeBridgeAdmission
            .deletionCommitHandoff.rootId;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeAdmission.deletionCommitHandoff
            .rootId = `${unmountError.rootRequest.rootId}:foreign`;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          delete record.privateUnmountNativeBridgeCleanupHandoff.requestId;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff.requestId =
            `${unmountError.rootRequest.requestId}:foreign`;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          delete record.privateUnmountNativeBridgeCleanupHandoff
            .requestSequence;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          delete record.privateUnmountNativeBridgeCleanupHandoff.rootId;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff.rootId =
            `${unmountError.rootRequest.rootId}:foreign`;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          delete record.privateUnmountNativeBridgeAdmission
            .deletionCommitHandoff.passiveRefCleanupOrder.rootId;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });
    assertNativeExecutionIdentityRejection({
      facade: jsonFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeAdmission.deletionCommitHandoff
            .passiveRefCleanupOrder.rootId =
            `${unmountError.rootRequest.rootId}:foreign`;
        }
      ),
      report: jsonUnmountReport,
      identityEvidence: jsonUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToJSONSerializationError"
    });

    const treeUnmountReport = createAcceptedUnmountTreeMetadataDiagnostic();
    assert.equal(
      treeFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
        unmountExecutionRecord,
        treeUnmountReport
      ),
      false
    );

    const treeUnmountIdentityEvidence =
      createAcceptedFinishedWorkIdentityEvidence({
        rootRequest: unmountError.rootRequest,
        publicSurface: "create().toTree",
        sourceSerializationDiagnosticName: privateToTreeAcceptedDiagnosticName,
        consumesPrivateToJSONEvidence: false,
        consumesPrivateToTreeEvidence: true,
        hostOutputUpdateKind: "Unmount"
      });
    assert.equal(
      treeFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
        unmountExecutionRecord,
        treeUnmountReport,
        treeUnmountIdentityEvidence
      ),
      true
    );
    const treeUnmountResult =
      treeFacade.createAcceptedNativeExecutionDiagnosticResult(
        unmountExecutionRecord,
        treeUnmountReport,
        treeUnmountIdentityEvidence
      );
    assert.equal(treeUnmountResult.operation, "unmount");
    assert.equal(treeUnmountResult.rootId, unmountError.rootRequest.rootId);
    assert.equal(treeUnmountResult.hostOutputUpdateKind, "Unmount");
    assert.equal(treeUnmountResult.hostOutputShape, "EmptyRoot");
    assert.equal(treeUnmountResult.hostOutputRowId, privateToJSONUnmountHostOutputRowId);
    assert.equal(treeUnmountResult.sourceFiberCount, 0);
    assert.equal(treeUnmountResult.rootChildCount, 0);
    assert.equal(treeUnmountResult.result, null);
    assert.equal(
      treeUnmountResult.consumesAcceptedFinishedWorkIdentityGate,
      true
    );
    assert.equal(
      treeUnmountResult.finishedWorkIdentity.rootRequestOperation,
      "unmount"
    );
    assert.equal(treeUnmountResult.publicTreeAvailable, false);
    assert.equal(treeUnmountResult.nativeExecution, false);
    assert.equal(treeUnmountResult.compatibilityClaimed, false);
    assert.equal(
      treeFacade.canCreateAcceptedNativeExecutionDiagnosticResult(
        refPassiveUnmountExecutionRecord,
        treeUnmountReport,
        treeUnmountIdentityEvidence
      ),
      true
    );
    const treeRefPassiveUnmountResult =
      treeFacade.createAcceptedNativeExecutionDiagnosticResult(
        refPassiveUnmountExecutionRecord,
        treeUnmountReport,
        treeUnmountIdentityEvidence
      );
    assert.equal(treeRefPassiveUnmountResult.operation, "unmount");
    assert.equal(treeRefPassiveUnmountResult.publicTreeAvailable, false);
    assert.equal(treeRefPassiveUnmountResult.publicRouteAvailable, false);
    assert.equal(treeRefPassiveUnmountResult.nativeBridgeAvailable, false);
    assert.equal(treeRefPassiveUnmountResult.nativeExecution, false);
    assert.equal(treeRefPassiveUnmountResult.compatibilityClaimed, false);
    assertPrivateUnmountExecutionEvidenceBlocked(
      refPassiveUnmountExecutionRecord
    );
    assertNativeExecutionIdentityRejection({
      facade: treeFacade,
      executionRecord: unmountExecutionRecord,
      report: treeUnmountReport,
      errorName: "FastReactTestRendererPrivateToTreeMetadataError"
    });
    assertNativeExecutionIdentityRejection({
      facade: treeFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.requestSequence += 1;
        }
      ),
      report: treeUnmountReport,
      identityEvidence: treeUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToTreeMetadataError"
    });
    assertNativeExecutionIdentityRejection({
      facade: treeFacade,
      executionRecord: unmountExecutionRecord,
      report: treeUnmountReport,
      identityEvidence: withFinishedWorkIdentityChange(
        treeUnmountIdentityEvidence,
        (evidence) => {
          evidence.compatibilityClaimed = true;
        }
      ),
      errorName: "FastReactTestRendererPrivateToTreeMetadataError"
    });
    assertNativeExecutionIdentityRejection({
      facade: treeFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeAdmission = null;
        }
      ),
      report: treeUnmountReport,
      identityEvidence: treeUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToTreeMetadataError"
    });
    assertNativeExecutionIdentityRejection({
      facade: treeFacade,
      executionRecord: withNativeExecutionRecordChange(
        unmountExecutionRecord,
        (record) => {
          record.privateUnmountNativeBridgeCleanupHandoff.requestSequence += 1;
          record.privateUnmountNativeBridgeAdmission.cleanupHandoff =
            record.privateUnmountNativeBridgeCleanupHandoff;
        }
      ),
      report: treeUnmountReport,
      identityEvidence: treeUnmountIdentityEvidence,
      errorName: "FastReactTestRendererPrivateToTreeMetadataError"
    });
    assert.equal(
      jsonError.rootRequest.rootHandle,
      treeError.rootRequest.rootHandle
    );
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

function getPrivateRootRequestBridge(moduleExports) {
  const descriptor = Object.getOwnPropertyDescriptor(
    moduleExports.create,
    rootRequestBridgeSymbol
  );
  assert.notEqual(descriptor, undefined);
  return descriptor.value;
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

function createSiblingTextToJSONCommittedFiberInspectionDiagnostic() {
  return {
    diagnosticName: privateToTreeCommittedFiberInspectionDiagnosticName,
    sourceJsonDiagnosticName: "fast-react-test-renderer.serialization.private-json-canary",
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

function createAcceptedNativeExecutionRecord(
  moduleExports,
  rootRequest,
  options = {}
) {
  const bridge = getPrivateRootRequestBridge(moduleExports);
  const source = {
    rustLifecycleDiagnostic: createRustLifecycleDiagnosticSource(rootRequest),
    nativeAddonLoaded: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    rustExecution: true
  };
  if (rootRequest.operation === "unmount") {
    const deletionCommitHandoff =
      createAcceptedUnmountDeletionCommitHandoff(rootRequest, options);
    const cleanupHandoff = createAcceptedUnmountCleanupHandoff(
      rootRequest,
      deletionCommitHandoff,
      options
    );
    const admission = createAcceptedUnmountNativeBridgeAdmission(
      rootRequest,
      cleanupHandoff,
      deletionCommitHandoff
    );
    source.privateUnmountDeletionCommitHandoff = deletionCommitHandoff;
    source.privateUnmountNativeBridgeCleanupHandoff = cleanupHandoff;
    source.privateUnmountPassiveRefCleanupOrder =
      deletionCommitHandoff.passiveRefCleanupOrder;
    source.privateUnmountNativeBridgeAdmission = admission;
  }

  return bridge.consumeRootExecutionResult(rootRequest, source);
}

function createRustLifecycleDiagnosticSource(rootRequest) {
  return {
    operation: rootRequest.operation,
    updateKind: rootRequest.updateKind,
    updateOutcome: rootRequest.rustOutcome,
    lifecycleStatusBefore: normalizeExpectedRustLifecycle(
      rootRequest.lifecycleStatusBefore
    ),
    lifecycleStatusAfter: normalizeExpectedRustLifecycle(
      rootRequest.lifecycleStatusAfter
    ),
    scheduledUpdate: rootRequest.scheduled
      ? {
          kind: rootRequest.updateKind,
          element: rootRequest.rootElementHandle.isNone
            ? {
                kind: "RootElementHandle::NONE",
                isNone: true
              }
            : {
                kind: "RootElementHandle",
                isNone: false
              },
          containerUpdate: {
            api: rootRequest.containerUpdateApi
          },
          rootSchedule: {
            api: "ensure_root_is_scheduled"
          }
        }
      : null
  };
}

function normalizeExpectedRustLifecycle(value) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value === "active" || value === "Active") {
    return "Active";
  }
  if (value === "unmount-scheduled" || value === "UnmountScheduled") {
    return "UnmountScheduled";
  }
  return value;
}

function createAcceptedUnmountDeletionCommitHandoff(rootRequest, options = {}) {
  const variant =
    options.variant ?? (options.refPassiveCleanup === true ? "ref-passive" : "host-only");
  const {
    hostNodeCleanupCount,
    refCleanupReturnCount,
    passiveDestroyCount,
    cleanupOrderRecordCount
  } = getUnmountCleanupCounts(variant);
  const refPassiveCleanup =
    refCleanupReturnCount > 0 || passiveDestroyCount > 0;
  const passiveRefCleanupOrder = {
    diagnosticId: privateUnmountPassiveRefCleanupOrderDiagnosticId,
    status: privateUnmountPassiveRefCleanupOrderStatus,
    rootId: rootRequest.rootId,
    refCleanupReturnCount,
    passiveDestroyCount,
    hostNodeCleanupCount,
    cleanupOrderRecordCount,
    firstHostNodeCleanupOrder: refPassiveCleanup ? 2 : 0,
    lastRefCleanupReturnOrder: refPassiveCleanup ? 0 : null,
    firstPassiveDestroyOrder: refPassiveCleanup ? 1 : null,
    lastPassiveDestroyOrder: refPassiveCleanup ? 1 : null,
    refCleanupReturnPrecedesPassiveDestroy: true,
    hostCleanupFollowsRefCleanupReturn: true,
    hostCleanupFollowsPassiveDestroy: true,
    nativeCleanupAfterRefAndPassiveOrdering: true,
    minimalTreeOrderingIsHostCleanupOnly: !refPassiveCleanup,
    refCleanupReturnCallbacksInvoked: false,
    passiveDestroyCallbacksInvoked: false,
    publicEffectsFlushed: false,
    publicRefOrEffectCompatibilityClaimed: false,
    publicUnmountCompatibilityClaimed: false,
    actFlushingClaimed: false
  };

  return {
    diagnosticId: privateUnmountDeletionCommitHandoffDiagnosticId,
    status: privateUnmountDeletionCommitHandoffStatus,
    requestId: rootRequest.requestId,
    requestSequence: rootRequest.requestSequence,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootId: rootRequest.rootId,
    operation: rootRequest.operation,
    updateKind: rootRequest.updateKind,
    lifecycle: rootLifecycleUnmountScheduled,
    scheduledUpdateKind: rootUpdateKindUnmount,
    scheduledElementIsNone: true,
    commitCurrentIsStoreCurrent: true,
    renderCurrentMatchesCommitPreviousCurrent: true,
    renderFinishedWorkMatchesCommitCurrent: true,
    deletionListCount: 1,
    deletedRootCount: 1,
    hostNodeCleanupCount,
    cleanupRecordsMatchDeletionCommit: true,
    cleanupOrderRecordCount,
    publicUnmountCompatibilityClaimed: false,
    publicHostTeardownCompatibilityClaimed: false,
    actFlushingClaimed: false,
    hostChildDetachmentBlockers: {
      detachedInstance: true,
      detachedInstanceChildCount: 0,
      hostNodeCleanupInvalidatedCount: hostNodeCleanupCount,
      hostNodeCleanupAlreadyInactiveCount: 0,
      hostNodeCleanupMissingHostNodeCount: 0,
      hostNodeCleanupMissingStateNodeCount: 0,
      broadHostChildDetachmentBlocked: true,
      publicHostTeardownCompatibilityClaimed: false,
      publicUnmountCompatibilityClaimed: false,
      actFlushingClaimed: false
    },
    passiveRefCleanupOrder
  };
}

function createAcceptedUnmountCleanupHandoff(
  rootRequest,
  deletionCommitHandoff,
  options = {}
) {
  const variant =
    options.variant ?? (options.refPassiveCleanup === true ? "ref-passive" : "host-only");
  const {
    hostNodeCleanupCount,
    refCleanupReturnCount,
    passiveDestroyCount,
    cleanupOrderRecordCount
  } = getUnmountCleanupCounts(variant);
  const refPassiveCleanup =
    refCleanupReturnCount > 0 || passiveDestroyCount > 0;
  return {
    diagnosticId: privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
    status: privateUnmountNativeBridgeCleanupHandoffStatus,
    requestId: rootRequest.requestId,
    requestSequence: rootRequest.requestSequence,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootId: rootRequest.rootId,
    operation: rootRequest.operation,
    updateKind: rootRequest.updateKind,
    routeOutcome: rootUpdateOutcomeScheduled,
    routeDependencyId: "react-test-renderer-unmount-route-private-diagnostic",
    deletionCommitHandoffId: privateUnmountDeletionCommitHandoffDiagnosticId,
    admissionDiagnosticId: privateUnmountNativeBridgeAdmissionDiagnosticId,
    lifecycle: rootLifecycleUnmountScheduled,
    scheduledUpdateKind: rootUpdateKindUnmount,
    scheduledElementIsNone: true,
    previousRootChildCount: 1,
    currentRootChildCount: 0,
    detachedInstance: true,
    detachedInstanceChildCount: 0,
    hostNodeCleanupCount,
    refCleanupReturnCount,
    passiveDestroyCount,
    cleanupOrderRecordCount,
    nativeCleanupAfterRefAndPassiveOrdering: true,
    minimalTreeCleanupHandoff: !refPassiveCleanup,
    rustUnmountCleanupHandoffExecuted: true,
    hostOutputProduced: true,
    publicUnmountCompatibilityClaimed: false,
    publicHostTeardownCompatibilityClaimed: false,
    actFlushingClaimed: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    passiveRefCleanupOrder: deletionCommitHandoff.passiveRefCleanupOrder,
    deletionCommitHandoff
  };
}

function createAcceptedUnmountNativeBridgeAdmission(
  rootRequest,
  cleanupHandoff,
  deletionCommitHandoff
) {
  return {
    id: privateUnmountNativeBridgeAdmissionDiagnosticId,
    kind: "FastReactTestRendererPrivateUnmountNativeBridgeAdmission",
    status: privateUnmountNativeBridgeAdmissionStatus,
    operation: "unmount",
    publicSurface: "create().unmount",
    request: rootRequest,
    requestId: rootRequest.requestId,
    requestSequence: rootRequest.requestSequence,
    rootId: rootRequest.rootId,
    rootSequence: rootRequest.rootSequence,
    updateKind: rootUpdateKindUnmount,
    updateOutcome: rootUpdateOutcomeScheduled,
    scheduled: true,
    lifecycleStatusBefore: rootRequest.lifecycleStatusBefore,
    lifecycleStatusAfter: rootRequest.lifecycleStatusAfter,
    cleanupHandoff,
    cleanupHandoffDiagnosticId: privateUnmountNativeBridgeCleanupHandoffDiagnosticId,
    deletionCommitHandoff,
    deletionCommitHandoffDiagnosticId:
      privateUnmountDeletionCommitHandoffDiagnosticId,
    passiveRefCleanupOrder: deletionCommitHandoff.passiveRefCleanupOrder,
    passiveRefCleanupOrderDiagnosticId:
      privateUnmountPassiveRefCleanupOrderDiagnosticId,
    consumesPrivateUnmountRouteMetadata: true,
    consumesAcceptedRustLifecycleDiagnostics: true,
    consumesAcceptedDeletionCommitHandoff: true,
    consumesActualRustCleanupHandoff: true,
    requiresActualRustCleanupHandoff: true,
    validatesLifecycleEvidence: true,
    validatesCleanupBlockers: true,
    validatesPassiveRefCleanupOrder: true,
    validatesMinimalTreeCleanupHandoff: true,
    tiesNativeCleanupToRefDetachmentAndPassiveDestroyOrder: true,
    deletionCommitHandoffAccepted: true,
    cleanupHandoffAccepted: true,
    lifecycleEvidenceAccepted: true,
    cleanupBlockersAccepted: true,
    passiveRefCleanupOrderAccepted: true,
    hostNodeCleanupCount: deletionCommitHandoff.hostNodeCleanupCount,
    refCleanupReturnCount: cleanupHandoff.refCleanupReturnCount,
    passiveDestroyCount: cleanupHandoff.passiveDestroyCount,
    cleanupOrderRecordCount: deletionCommitHandoff.cleanupOrderRecordCount,
    nativeCleanupAfterRefAndPassiveOrdering: true,
    rustUnmountCleanupHandoffExecuted: true,
    hostOutputProduced: true,
    minimalTreeCleanupHandoff: cleanupHandoff.minimalTreeCleanupHandoff,
    rejectsAlreadyUnmountedRoots: true,
    rejectsStaleDeletionHandoffs: true,
    rejectsMissingCleanupBlockers: true,
    publicRouteAvailable: false,
    publicUnmountCompatibilityClaimed: false,
    publicHostTeardownCompatibilityClaimed: false,
    actFlushingClaimed: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    compatibilityClaimed: false
  };
}

function createAcceptedFinishedWorkIdentityEvidence({
  rootRequest,
  publicSurface,
  sourceSerializationDiagnosticName,
  consumesPrivateToJSONEvidence,
  consumesPrivateToTreeEvidence,
  hostOutputUpdateKind = "Create",
  unmountCleanupVariant = undefined
}) {
  const current = { arenaId: 1, slot: 10, generation: 1 };
  const finishedWork = { arenaId: 1, slot: 11, generation: 1 };
  const evidence = {
    diagnosticName: privateSerializationFinishedWorkIdentityDiagnosticName,
    status: privateSerializationFinishedWorkIdentityStatus,
    publicSurface,
    sourceSerializationDiagnosticName,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootId: rootRequest.rootId,
    hostOutputUpdateKind,
    renderCurrent: current,
    renderFinishedWork: finishedWork,
    commitPreviousCurrent: current,
    commitCurrent: finishedWork,
    reportFinishedWork: finishedWork,
    renderLanesBits: 1,
    commitFinishedLanesBits: 1,
    reportFinishedLanesBits: 1,
    commitRemainingLanesBits: 0,
    commitPendingLanesBits: 0,
    commitCurrentMatchesRenderFinishedWork: true,
    commitPreviousCurrentMatchesRenderCurrent: true,
    commitLanesMatchRenderLanes: true,
    reportFinishedWorkMatchesCommitCurrent: true,
    reportLanesMatchCommitLanes: true,
    committedFiberInspectionCurrentMatchesCommit: true,
    hostOutputSnapshotCurrent: true,
    consumesCommittedHostRootFinishedWorkIdentity: true,
    consumesCommittedHostRootFinishedWorkLanes: true,
    consumesPrivateToJSONEvidence,
    consumesPrivateToTreeEvidence,
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicTestInstanceAvailable: false,
    publicSerializationAvailable: false,
    compatibilityClaimed: false
  };
  evidence.rootFinishedLanesHandoff = createAcceptedRootFinishedLanesHandoff(
    rootRequest,
    evidence
  );
  if (hostOutputUpdateKind === "Unmount") {
    const deletionCommitHandoff =
      createAcceptedUnmountDeletionCommitHandoff(rootRequest, {
        variant: unmountCleanupVariant
      });
    evidence.rootRequestOperation = rootRequest.operation;
    evidence.rootRequestUpdateKind = rootRequest.updateKind;
    evidence.deletionCommitHandoff = deletionCommitHandoff;
    evidence.cleanupHandoff = createAcceptedUnmountCleanupHandoff(
      rootRequest,
      deletionCommitHandoff,
      {
        variant: unmountCleanupVariant
      }
    );
  }
  return evidence;
}

function createAcceptedRootFinishedLanesHandoff(rootRequest, evidence) {
  return {
    diagnosticName: privateRootFinishedLanesHandoffDiagnosticName,
    status: privateRootFinishedLanesHandoffStatus,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootId: rootRequest.rootId,
    operation: rootRequest.operation,
    updateKind: rootRequest.updateKind,
    hostOutputUpdateKind: evidence.hostOutputUpdateKind,
    renderCurrent: evidence.renderCurrent,
    renderFinishedWork: evidence.renderFinishedWork,
    commitPreviousCurrent: evidence.commitPreviousCurrent,
    commitCurrent: evidence.commitCurrent,
    renderLanesBits: evidence.renderLanesBits,
    commitFinishedLanesBits: evidence.commitFinishedLanesBits,
    commitRemainingLanesBits: evidence.commitRemainingLanesBits,
    commitPendingLanesBits: evidence.commitPendingLanesBits,
    commitCurrentMatchesRenderFinishedWork:
      evidence.commitCurrentMatchesRenderFinishedWork,
    commitPreviousCurrentMatchesRenderCurrent:
      evidence.commitPreviousCurrentMatchesRenderCurrent,
    commitLanesMatchRenderLanes: evidence.commitLanesMatchRenderLanes,
    consumesFinishedWork: true,
    consumesFinishedLanes: true,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecution: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
}

function createAcceptedSiblingTextFinishedWorkIdentityEvidence({
  rootRequest
}) {
  const current = { arenaId: 1, slot: 20, generation: 1 };
  const finishedWork = { arenaId: 1, slot: 21, generation: 1 };
  const evidence = {
    diagnosticName: privateToJSONSiblingTextFinishedWorkIdentityDiagnosticName,
    status: privateToJSONSiblingTextFinishedWorkIdentityStatus,
    publicSurface: "create().update -> create().toJSON",
    sourceExecutionRecordId:
      "react-test-renderer-update-route-root-work-loop-private-admission",
    sourceExecutionStatus:
      "accepted-private-update-route-root-work-loop-admission-public-update-blocked",
    sourceSerializationDiagnosticName:
      "fast-react-test-renderer.serialization.private-json-canary",
    worker738ReportRowId: privateToJSONSiblingTextHostOutputRowId,
    rootRequestId: rootRequest.requestId,
    rootRequestSequence: rootRequest.requestSequence,
    rootId: rootRequest.rootId,
    hostOutputUpdateKind: "Update",
    hostOutputShape: "SiblingText",
    rootNodeKind: "RootArray",
    rootChildCount: 2,
    sourceNodeCount: 3,
    routeRenderCurrent: current,
    routeRenderFinishedWork: finishedWork,
    routeCommitPreviousCurrent: current,
    routeCommitCurrent: finishedWork,
    renderCurrent: current,
    renderFinishedWork: finishedWork,
    commitPreviousCurrent: current,
    commitCurrent: finishedWork,
    reportFinishedWork: finishedWork,
    routeRenderLanesBits: 1,
    routeCommitFinishedLanesBits: 1,
    renderLanesBits: 1,
    commitFinishedLanesBits: 1,
    reportFinishedLanesBits: 1,
    commitRemainingLanesBits: 0,
    commitPendingLanesBits: 0,
    routeHandlesMatchCommittedUpdate: true,
    routeLanesMatchCommittedUpdate: true,
    commitCurrentMatchesRenderFinishedWork: true,
    commitPreviousCurrentMatchesRenderCurrent: true,
    commitLanesMatchRenderLanes: true,
    reportFinishedWorkMatchesCommitCurrent: true,
    reportLanesMatchCommitLanes: true,
    committedFiberInspectionCurrentMatchesCommit: true,
    committedSiblingTextFiberInspectionAvailable: true,
    committedSiblingTextReportShapeAvailable: true,
    committedSiblingTextInspectionMatchesOutput: true,
    hostOutputSnapshotCurrent: true,
    reportHostOutputRowMatchesOutput: true,
    reportRootArraySourceNodesMatchCurrentSnapshot: true,
    realSiblingTextHandoffAvailable: true,
    consumesUpdateRouteAdmission: true,
    consumesSiblingTextHostOutput: true,
    consumesPrivateToJSONEvidence: true,
    consumesWorker738ReportRow: true,
    consumesCommittedHostRootFinishedWorkIdentity: true,
    consumesCommittedHostRootFinishedWorkLanes: true,
    identityAdmissionAvailable: true,
    broadMultichildIdentityAvailable: false,
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicTestInstanceAvailable: false,
    publicSerializationAvailable: false,
    publicRouteAvailable: false,
    nativeBridgeLoadingAvailable: false,
    nativeBridgeAvailable: false,
    nativeExecutionAvailable: false,
    jsFacadeAvailable: false,
    cjsFacadeAvailable: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  };
  evidence.rootFinishedLanesHandoff = createAcceptedRootFinishedLanesHandoff(
    rootRequest,
    evidence
  );
  return evidence;
}

function getUnmountCleanupCounts(variant) {
  if (variant === "ref-passive") {
    return {
      hostNodeCleanupCount: 2,
      refCleanupReturnCount: 1,
      passiveDestroyCount: 1,
      cleanupOrderRecordCount: 4
    };
  }
  return {
    hostNodeCleanupCount: 2,
    refCleanupReturnCount: 0,
    passiveDestroyCount: 0,
    cleanupOrderRecordCount: 2
  };
}

function withFinishedWorkIdentityChange(evidence, mutate) {
  const clone = JSON.parse(JSON.stringify(evidence));
  mutate(clone);
  return clone;
}

function withNativeExecutionRecordChange(record, mutate) {
  const deletionCommitHandoff =
    record.privateUnmountDeletionCommitHandoff == null
      ? record.privateUnmountDeletionCommitHandoff
      : JSON.parse(JSON.stringify(record.privateUnmountDeletionCommitHandoff));
  const cleanupHandoff =
    record.privateUnmountNativeBridgeCleanupHandoff == null
      ? record.privateUnmountNativeBridgeCleanupHandoff
      : {
          ...JSON.parse(
            JSON.stringify(record.privateUnmountNativeBridgeCleanupHandoff)
          ),
          deletionCommitHandoff:
            deletionCommitHandoff == null
              ? record.privateUnmountNativeBridgeCleanupHandoff
                  .deletionCommitHandoff
              : deletionCommitHandoff
        };
  const clone = {
    ...record,
    privateUnmountDeletionCommitHandoff: deletionCommitHandoff,
    privateUnmountPassiveRefCleanupOrder:
      deletionCommitHandoff == null
        ? record.privateUnmountPassiveRefCleanupOrder
        : deletionCommitHandoff.passiveRefCleanupOrder,
    privateUnmountNativeBridgeAdmission:
      record.privateUnmountNativeBridgeAdmission == null
        ? record.privateUnmountNativeBridgeAdmission
        : {
            ...JSON.parse(
              JSON.stringify(record.privateUnmountNativeBridgeAdmission)
            ),
            request: record.privateUnmountNativeBridgeAdmission.request,
            cleanupHandoff,
            deletionCommitHandoff,
            passiveRefCleanupOrder:
              deletionCommitHandoff == null
                ? record.privateUnmountNativeBridgeAdmission
                    .passiveRefCleanupOrder
                : deletionCommitHandoff.passiveRefCleanupOrder
          },
    privateUnmountNativeBridgeCleanupHandoff: cleanupHandoff
  };
  const admission = clone.privateUnmountNativeBridgeAdmission;
  const passiveRefCleanupOrder =
    clone.privateUnmountPassiveRefCleanupOrder ??
    clone.privateUnmountNativeBridgeCleanupHandoff?.passiveRefCleanupOrder ??
    admission?.passiveRefCleanupOrder;
  if (
    admission?.deletionCommitHandoff != null &&
    admission.deletionCommitHandoff.passiveRefCleanupOrder == null &&
    passiveRefCleanupOrder != null
  ) {
    admission.deletionCommitHandoff.passiveRefCleanupOrder =
      passiveRefCleanupOrder;
  }
  mutate(clone);
  return clone;
}

function withSiblingTextIdentityChange(evidence, mutate) {
  const clone = JSON.parse(JSON.stringify(evidence));
  mutate(clone);
  return clone;
}

function withInheritedSiblingTextRootFinishedLanesHandoff(evidence) {
  const clone = JSON.parse(JSON.stringify(evidence));
  const rootFinishedLanesHandoff = clone.rootFinishedLanesHandoff;
  delete clone.rootFinishedLanesHandoff;
  const inheritedEvidence = Object.assign(
    Object.create({ rootFinishedLanesHandoff }),
    clone
  );
  assert.equal(
    Object.hasOwn(inheritedEvidence, "rootFinishedLanesHandoff"),
    false
  );
  return inheritedEvidence;
}

function withSiblingTextReportChange(report, mutate) {
  const clone = JSON.parse(JSON.stringify(report));
  mutate(clone);
  return clone;
}

function createSiblingTextAdmissionRuntime(entry) {
  const moduleExports = loadFresh(entry.specifier);
  const renderer = moduleExports.create({
    type: "span",
    props: {},
    children: ["hello"]
  });
  const updateError = captureThrown(() =>
    renderer.update({
      type: "span",
      props: {},
      children: ["goodbye"]
    })
  );

  return {
    updateRootRequest: updateError.rootRequest,
    jsonFacade: Object.getOwnPropertyDescriptor(
      renderer.toJSON,
      privateToJSONSerializationFacadeSymbol
    ).value,
    treeFacade: Object.getOwnPropertyDescriptor(
      renderer.toTree,
      privateToTreeFacadeSymbol
    ).value
  };
}

function assertSiblingTextAdmissionNegativeMatrix({
  report,
  evidence,
  sourceRootRequest,
  reject,
  includeMissingCanonicalRootIds = false
}) {
  for (const alias of privateRootFinishedLanesHandoffAliasKeys) {
    reject(
      report,
      withSiblingTextIdentityChange(evidence, (changedEvidence) => {
        const handoff = changedEvidence.rootFinishedLanesHandoff;
        delete changedEvidence.rootFinishedLanesHandoff;
        changedEvidence[alias] = handoff;
      }),
      /rootFinishedLanesHandoff/u
    );
  }
  reject(
    report,
    withInheritedSiblingTextRootFinishedLanesHandoff(evidence),
    /rootFinishedLanesHandoff/u
  );

  for (const fieldName of ["rootRequestId", "rootId"]) {
    reject(
      report,
      withSiblingTextIdentityChange(evidence, (changedEvidence) => {
        changedEvidence[fieldName] = `${changedEvidence[fieldName]}:stale`;
      }),
      /sibling-text-finished-work-identity-stale/u
    );
  }
  reject(
    report,
    withSiblingTextIdentityChange(evidence, (changedEvidence) => {
      changedEvidence.rootRequestSequence += 1;
    }),
    /sibling-text-finished-work-identity-stale/u
  );
  if (includeMissingCanonicalRootIds) {
    for (const fieldName of ["rootRequestId", "rootId"]) {
      reject(
        report,
        withSiblingTextIdentityChange(evidence, (changedEvidence) => {
          delete changedEvidence[fieldName];
        }),
        /sibling-text-finished-work-identity-stale/u
      );
    }
  }

  for (const fieldName of [
    "rootRequestId",
    "rootId"
  ]) {
    reject(
      report,
      withSiblingTextIdentityChange(evidence, (changedEvidence) => {
        changedEvidence.rootFinishedLanesHandoff[fieldName] =
          `${changedEvidence.rootFinishedLanesHandoff[fieldName]}:stale`;
      }),
      /private root request/u
    );
  }
  reject(
    report,
    withSiblingTextIdentityChange(evidence, (changedEvidence) => {
      changedEvidence.rootFinishedLanesHandoff.rootRequestSequence += 1;
    }),
    /private root request/u
  );
  reject(
    report,
    withSiblingTextIdentityChange(evidence, (changedEvidence) => {
      changedEvidence.rootFinishedLanesHandoff.commitCurrent.slot += 1;
    }),
    /committed HostRoot identity/u
  );
  reject(
    report,
    withSiblingTextIdentityChange(evidence, (changedEvidence) => {
      changedEvidence.rootFinishedLanesHandoff.commitFinishedLanesBits = 2;
    }),
    /finished_lanes handoff/u
  );

  for (const fieldName of [
    "publicSerializationAvailable",
    "publicRouteAvailable",
    "nativeBridgeAvailable",
    "nativeExecution",
    "packageCompatibilityClaimed",
    "compatibilityClaimed"
  ]) {
    reject(
      report,
      withSiblingTextIdentityChange(evidence, (changedEvidence) => {
        changedEvidence.rootFinishedLanesHandoff[fieldName] = true;
      }),
      /public, native, or package compatibility/u
    );
  }

  reject(
    report,
    createAcceptedFinishedWorkIdentityEvidence({
      rootRequest: sourceRootRequest,
      publicSurface: "create().toJSON",
      sourceSerializationDiagnosticName:
        "fast-react-test-renderer.serialization.private-json-canary",
      consumesPrivateToJSONEvidence: true,
      consumesPrivateToTreeEvidence: false,
      hostOutputUpdateKind: "Update"
    }),
    /sibling-text-finished-work-identity-diagnostic-mismatch/u
  );
  reject(
    report,
    withSiblingTextIdentityChange(evidence, (changedEvidence) => {
      changedEvidence.broadMultichildIdentityAvailable = true;
    }),
    /broad-multichild-identity-unexpectedly-open/u
  );

  for (const fieldName of [
    "publicToJSONAvailable",
    "publicToTreeAvailable",
    "publicTestInstanceAvailable",
    "publicSerializationAvailable",
    "publicRouteAvailable",
    "nativeBridgeLoadingAvailable",
    "nativeBridgeAvailable",
    "nativeExecutionAvailable",
    "jsFacadeAvailable",
    "cjsFacadeAvailable",
    "packageCompatibilityClaimed",
    "compatibilityClaimed"
  ]) {
    reject(
      report,
      withSiblingTextIdentityChange(evidence, (changedEvidence) => {
        changedEvidence[fieldName] = true;
      }),
      /public-or-native-package-js-compatibility-claim/u
    );
  }
}

function assertSiblingTextHostOutputReportClaimRejections({
  report,
  evidence,
  reject
}) {
  for (const fieldName of [
    "publicToJSONAvailable",
    "publicTestInstanceAvailable",
    "nativeExecution",
    "compatibilityClaimed"
  ]) {
    reject(
      withSiblingTextReportChange(report, (changedReport) => {
        changedReport.hostOutputRow[fieldName] = true;
      }),
      evidence,
      /sibling-text-host-output-row-public-native-package-claim/u
    );
  }
  for (const fieldName of [
    "publicToJSONAvailable",
    "publicTestInstanceAvailable",
    "nativeExecutionAvailable",
    "compatibilityClaimed"
  ]) {
    reject(
      withSiblingTextReportChange(report, (changedReport) => {
        changedReport.hostOutputRow.dependencyMetadata[fieldName] = true;
      }),
      evidence,
      /public|native|compatibility/u
    );
  }
  reject(
    withSiblingTextReportChange(report, (changedReport) => {
      changedReport.publicBlockers.compatibilityClaimBlocked = false;
    }),
    evidence,
    /compatibility/u
  );
}

function assertSiblingTextCommittedFiberInspectionRejections({
  report,
  evidence,
  reject
}) {
  reject(
    withSiblingTextReportChange(report, (changedReport) => {
      changedReport.committedFiberInspection.fiberShape =
        privateToTreeCompositeMultiChildAcceptedFiberShape;
    }),
    evidence,
    /committedFiberInspection|fiberShape/u
  );
  reject(
    withSiblingTextReportChange(report, (changedReport) => {
      changedReport.committedFiberInspection.rootChildFiberTags = [
        "FunctionComponent"
      ];
    }),
    evidence,
    /committedFiberInspection|rootChildFiberTags/u
  );
  reject(
    withSiblingTextReportChange(report, (changedReport) => {
      changedReport.committedFiberInspection.functionComponentPresent = true;
      changedReport.committedFiberInspection.functionComponentFiberTag =
        "FunctionComponent";
    }),
    evidence,
    /functionComponentPresent|FunctionComponent|committedFiberInspection/u
  );
}

function assertToTreeSiblingTextReportClaimRejections({
  report,
  evidence,
  reject
}) {
  for (const mutate of [
    (changedReport) => {
      changedReport.publicTreeObjectAvailable = true;
    },
    (changedReport) => {
      changedReport.hostRoot.publicTreeObjectAvailable = true;
    },
    (changedReport) => {
      changedReport.functionComponent.publicTreeObjectAvailable = true;
    },
    (changedReport) => {
      changedReport.hostChildren[0].publicTreeObjectAvailable = true;
    },
    (changedReport) => {
      changedReport.hostChildren[1].publicTreeObjectAvailable = true;
    }
  ]) {
    reject(
      withSiblingTextReportChange(report, mutate),
      evidence,
      /publicTreeObjectAvailable|public tree/u
    );
  }
  reject(
    withSiblingTextReportChange(report, (changedReport) => {
      changedReport.publicBlockers.compatibilityClaimBlocked = false;
    }),
    evidence,
    /compatibility/u
  );
}

function assertToTreeSiblingTextCommittedFiberInspectionRejections({
  report,
  evidence,
  reject
}) {
  reject(
    withSiblingTextReportChange(report, (changedReport) => {
      changedReport.committedFiberInspection.fiberShape =
        privateToTreeMultiChildAcceptedFiberShape;
    }),
    evidence,
    /committedFiberInspection|fiberShape/u
  );
  reject(
    withSiblingTextReportChange(report, (changedReport) => {
      changedReport.committedFiberInspection.rootChildFiberTags = [
        "HostText",
        "HostComponent"
      ];
    }),
    evidence,
    /committedFiberInspection|rootChildFiberTags/u
  );
  reject(
    withSiblingTextReportChange(report, (changedReport) => {
      changedReport.committedFiberInspection.wrapsCommittedHostOutput = false;
    }),
    evidence,
    /committedFiberInspection|wrapsCommittedHostOutput/u
  );
}

function withHostOutputReportChange(report, mutate) {
  const clone = JSON.parse(JSON.stringify(report));
  mutate(clone);
  return clone;
}

function assertPrivateRootFinishedLanesHandoffBlockers(handoff, label) {
  assert.equal(handoff.publicSerializationAvailable, false, label);
  assert.equal(handoff.publicRouteAvailable, false, label);
  assert.equal(handoff.nativeBridgeAvailable, false, label);
  assert.equal(handoff.nativeExecution, false, label);
  assert.equal(handoff.packageCompatibilityClaimed, false, label);
  assert.equal(handoff.compatibilityClaimed, false, label);
}

function assertNativeExecutionIdentityRejection({
  facade,
  executionRecord,
  report,
  identityEvidence = undefined,
  errorName,
  messagePattern = undefined,
  label = undefined
}) {
  assert.equal(
    facade.canCreateAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      identityEvidence
    ),
    false,
    label
  );
  const error = captureThrown(() =>
    facade.createAcceptedNativeExecutionDiagnosticResult(
      executionRecord,
      report,
      identityEvidence
    )
  );
  assert.equal(error.name, errorName, label);
  if (messagePattern !== undefined) {
    assert.match(error.message, messagePattern, label);
  }
  assert.equal(error.nativeBridgeAvailable, false, label);
  assert.equal(error.nativeExecution, false, label);
  assert.equal(error.compatibilityClaimed, false, label);
}

function assertPrivateUnmountExecutionEvidenceBlocked(record) {
  assert.equal(record.serializationAvailable, false);
  assert.equal(record.publicRouteAvailable, false);
  assert.equal(record.publicCreateUpdateUnmountBehaviorAvailable, false);
  assert.equal(record.nativeAddonLoaded, false);
  assert.equal(record.nativeBridgeAvailable, false);
  assert.equal(record.nativeExecution, false);
  assert.equal(record.compatibilityClaimed, false);

  const admission = record.privateUnmountNativeBridgeAdmission;
  assert.equal(admission.publicRouteAvailable, false);
  assert.equal(admission.publicUnmountCompatibilityClaimed, false);
  assert.equal(admission.publicHostTeardownCompatibilityClaimed, false);
  assert.equal(admission.actFlushingClaimed, false);
  assert.equal(admission.nativeBridgeAvailable, false);
  assert.equal(admission.nativeExecution, false);
  assert.equal(admission.compatibilityClaimed, false);

  const cleanupHandoff = record.privateUnmountNativeBridgeCleanupHandoff;
  assert.equal(cleanupHandoff.publicUnmountCompatibilityClaimed, false);
  assert.equal(cleanupHandoff.publicHostTeardownCompatibilityClaimed, false);
  assert.equal(cleanupHandoff.actFlushingClaimed, false);
  assert.equal(cleanupHandoff.nativeBridgeAvailable, false);
  assert.equal(cleanupHandoff.nativeExecution, false);

  const deletionCommitHandoff = admission.deletionCommitHandoff;
  assert.equal(deletionCommitHandoff.publicUnmountCompatibilityClaimed, false);
  assert.equal(
    deletionCommitHandoff.publicHostTeardownCompatibilityClaimed,
    false
  );
  assert.equal(deletionCommitHandoff.actFlushingClaimed, false);

  const passiveRefCleanupOrder = deletionCommitHandoff.passiveRefCleanupOrder;
  assert.equal(passiveRefCleanupOrder.publicEffectsFlushed, false);
  assert.equal(
    passiveRefCleanupOrder.publicRefOrEffectCompatibilityClaimed,
    false
  );
  assert.equal(passiveRefCleanupOrder.publicUnmountCompatibilityClaimed, false);
  assert.equal(passiveRefCleanupOrder.actFlushingClaimed, false);
}

function assertRootFinishedLanesHandoffAliasRejections(
  privateFacade,
  evidence,
  report,
  errorName,
  sourceRootRequest = undefined
) {
  for (const alias of privateRootFinishedLanesHandoffAliasKeys) {
    assertFinishedWorkIdentityRejection(
      privateFacade,
      withFinishedWorkIdentityChange(evidence, (changedEvidence) => {
        const handoff = changedEvidence.rootFinishedLanesHandoff;
        delete changedEvidence.rootFinishedLanesHandoff;
        changedEvidence[alias] = handoff;
      }),
      report,
      errorName,
      sourceRootRequest
    );
  }
}

function assertSiblingTextRootFinishedLanesHandoffAliasRejections(
  privateFacade,
  report,
  evidence,
  sourceRootRequest
) {
  for (const alias of privateRootFinishedLanesHandoffAliasKeys) {
    assertSiblingTextAdmissionRejection(
      privateFacade,
      report,
      withSiblingTextIdentityChange(evidence, (changedEvidence) => {
        const handoff = changedEvidence.rootFinishedLanesHandoff;
        delete changedEvidence.rootFinishedLanesHandoff;
        changedEvidence[alias] = handoff;
      }),
      sourceRootRequest,
      /rootFinishedLanesHandoff/u
    );
  }
}

function assertFinishedWorkIdentityRejection(
  privateFacade,
  evidence,
  report,
  errorName,
  sourceRootRequest = undefined
) {
  assert.equal(
    privateFacade.canValidateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest
    ),
    false
  );
  const error = captureThrown(() =>
    privateFacade.validateAcceptedFinishedWorkIdentity(
      evidence,
      report,
      sourceRootRequest
    )
  );
  assert.equal(error.name, errorName);
  assert.equal(error.nativeBridgeAvailable, false);
  assert.equal(error.nativeExecution, false);
  assert.equal(error.compatibilityClaimed, false);
  return error;
}

function assertSiblingTextAdmissionRejection(
  privateFacade,
  report,
  evidence,
  sourceRootRequest,
  messagePattern
) {
  assert.equal(
    privateFacade.canCreateAcceptedSiblingTextDiagnosticResult(
      report,
      evidence,
      sourceRootRequest
    ),
    false
  );
  const error = captureThrown(() =>
    privateFacade.createAcceptedSiblingTextDiagnosticResult(
      report,
      evidence,
      sourceRootRequest
    )
  );
  assert.equal(
    error.name,
    "FastReactTestRendererPrivateToJSONSerializationError"
  );
  assert.match(error.message, messagePattern);
  assert.equal(error.nativeBridgeAvailable, false);
  assert.equal(error.nativeExecution, false);
  assert.equal(error.compatibilityClaimed, false);
  return error;
}

function assertSiblingTextRootFinishedLanesAliasRejections(
  privateFacade,
  report,
  evidence,
  sourceRootRequest
) {
  for (const alias of privateRootFinishedLanesHandoffAliasKeys) {
    assertSiblingTextAdmissionRejection(
      privateFacade,
      report,
      withSiblingTextIdentityChange(evidence, (changedEvidence) => {
        const handoff = changedEvidence.rootFinishedLanesHandoff;
        delete changedEvidence.rootFinishedLanesHandoff;
        changedEvidence[alias] = handoff;
      }),
      sourceRootRequest,
      /rootFinishedLanesHandoff/u
    );
  }
}

function assertToTreeSiblingTextRootFinishedLanesAliasRejections(
  privateFacade,
  report,
  evidence,
  sourceRootRequest
) {
  for (const alias of privateRootFinishedLanesHandoffAliasKeys) {
    assertToTreeSiblingTextAdmissionRejection(
      privateFacade,
      report,
      withSiblingTextIdentityChange(evidence, (changedEvidence) => {
        const handoff = changedEvidence.rootFinishedLanesHandoff;
        delete changedEvidence.rootFinishedLanesHandoff;
        changedEvidence[alias] = handoff;
      }),
      sourceRootRequest,
      /rootFinishedLanesHandoff/u
    );
  }
}

function assertToTreeSiblingTextAdmissionRejection(
  privateFacade,
  report,
  evidence,
  sourceRootRequest,
  messagePattern
) {
  assert.equal(
    privateFacade.canCreateAcceptedSiblingTextDiagnosticResult(
      report,
      evidence,
      sourceRootRequest
    ),
    false
  );
  const error = captureThrown(() =>
    privateFacade.createAcceptedSiblingTextDiagnosticResult(
      report,
      evidence,
      sourceRootRequest
    )
  );
  assert.equal(
    error.name,
    "FastReactTestRendererPrivateToTreeMetadataError"
  );
  assert.match(error.message, messagePattern);
  assert.equal(error.nativeBridgeAvailable, false);
  assert.equal(error.nativeExecution, false);
  assert.equal(error.compatibilityClaimed, false);
  return error;
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

function createAcceptedNestedHostOutputDiagnostic({
  hostOutputSnapshotCurrent = true
} = {}) {
  return {
    diagnosticName: "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind: "Update",
    hostOutputSnapshotCurrent,
    rootChildCount: 1,
    rootNodeKind: "HostComponent",
    hostOutputRow: {
      id: privateToJSONNestedUpdateHostOutputRowId,
      status: privateToJSONUpdateUnmountRowStatus,
      hostOutputUpdateKind: "Update",
      hostOutputShape: "NestedHostText",
      previousRootChildCount: 1,
      currentRootChildCount: 1,
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
    },
    nodes: [
      {
        ordinal: 0,
        nodeKind: "HostComponent",
        parentOrdinal: null,
        childOrdinals: [1],
        elementType: { name: "section" },
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
        nodeKind: "HostComponent",
        parentOrdinal: 0,
        childOrdinals: [2, 3],
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
        ordinal: 2,
        nodeKind: "Text",
        parentOrdinal: 1,
        childOrdinals: [],
        elementType: null,
        props: null,
        text: "stable",
        hidden: false,
        detached: false
      },
      {
        ordinal: 3,
        nodeKind: "Text",
        parentOrdinal: 1,
        childOrdinals: [],
        elementType: null,
        props: null,
        text: "inserted",
        hidden: false,
        detached: false
      }
    ],
    publicBlockers: createAcceptedPrivateJsonPublicBlockers()
  };
}

function createAcceptedSiblingTextHostOutputDiagnostic({
  hostOutputSnapshotCurrent = true
} = {}) {
  return {
    diagnosticName: "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind: "Update",
    hostOutputSnapshotCurrent,
    rootChildCount: 2,
    rootNodeKind: "MultipleHostChildren",
    hostOutputRow: {
      id: privateToJSONSiblingTextHostOutputRowId,
      status: privateToJSONUpdateUnmountRowStatus,
      hostOutputUpdateKind: "Update",
      hostOutputShape: "SiblingText",
      previousRootChildCount: 1,
      currentRootChildCount: 2,
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
    },
    committedFiberInspection:
      createSiblingTextToJSONCommittedFiberInspectionDiagnostic(),
    nodes: [
      {
        ordinal: 0,
        nodeKind: "Text",
        parentOrdinal: null,
        childOrdinals: [],
        elementType: null,
        props: null,
        text: "first sibling",
        hidden: false,
        detached: false
      },
      {
        ordinal: 1,
        nodeKind: "HostComponent",
        parentOrdinal: null,
        childOrdinals: [2],
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
        ordinal: 2,
        nodeKind: "Text",
        parentOrdinal: 1,
        childOrdinals: [],
        elementType: null,
        props: null,
        text: "second sibling",
        hidden: false,
        detached: false
      }
    ],
    publicBlockers: createAcceptedPrivateJsonPublicBlockers()
  };
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
    hostOutputShape:
      hostOutputUpdateKind === "Unmount" ? "EmptyRoot" : "SingleHostText",
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
  compositeNativeExecution = false,
  text = "hello"
} = {}) {
  const committedFiberShape = compositeNativeExecution
    ? privateToTreeCompositeAcceptedFiberShape
    : ["HostRoot", "HostComponent", "HostText"];
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
      fiberShape: committedFiberShape,
      rootChildFiberTags: compositeNativeExecution
        ? ["FunctionComponent"]
        : ["HostComponent"],
      hostChildFiberTags: ["HostComponent"],
      rootChildCount: 1,
      hostChildCount: 1,
      hostTextCount: 1,
      functionComponentPresent: compositeNativeExecution,
      wrapsCommittedHostOutput: compositeNativeExecution
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

function createAcceptedUnmountTreeMetadataDiagnostic() {
  const diagnostic = {
    diagnosticName: privateToTreeAcceptedDiagnosticName,
    sourceJsonDiagnosticName:
      "fast-react-test-renderer.serialization.private-json-canary",
    hostOutputUpdateKind: "Unmount",
    hostOutputSnapshotCurrent: true,
    rootChildCount: 0,
    publicBlockers: createAcceptedPrivateJsonPublicBlockers(),
    publicTreeObjectAvailable: false
  };
  attachToJSONUpdateUnmountRow(diagnostic, {
    previousRootChildCount: 1,
    currentRootChildCount: 0
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
