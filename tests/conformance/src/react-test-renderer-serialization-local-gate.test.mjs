import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  readCheckedReactTestRendererSerializationOracle
} from "./react-test-renderer-serialization-oracle.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS
} from "./react-test-renderer-serialization-scenarios.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS,
  evaluateReactTestRendererSerializationLocalGate
} from "./react-test-renderer-serialization-local-gate.mjs";

const oracle = readCheckedReactTestRendererSerializationOracle();

test("react-test-renderer serialization compatibility stays blocked while public TestInstance serialization surfaces are unsupported", () => {
  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });

  assert.equal(gate.status, REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS);
  assert.equal(gate.requiredLocalTargetsReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.localChecks, {
    publicJsReactTestRendererFacadePresent: true,
    publicJsReactTestRendererFacadePlaceholder: true,
    publicJsReactTestRendererFacadeStatus: "placeholder-present",
    rustTestRendererRootFacadePresent: true,
    committedTestRendererHostOutputPresent: false,
    committedFiberInspectionPresent: false,
    rustSerializationApiPresent: false
  });
});

test("react-test-renderer serialization gate records accepted Rust-private prerequisites without public TestInstance admission", () => {
  assert.deepEqual(inspectAcceptedRustPrivatePrerequisites(), [
    {
      id: "rust-test-renderer-root-facade",
      acceptedPrivatePrerequisite: true,
      publicJsSurfaceSupported: false,
      compatibilityClaimed: false
    },
    {
      id: "test-renderer-host-output-create-update-unmount-canary",
      acceptedPrivatePrerequisite: true,
      publicJsSurfaceSupported: false,
      compatibilityClaimed: false
    },
    {
      id: "committed-fiber-inspection-api",
      acceptedPrivatePrerequisite: true,
      publicJsSurfaceSupported: false,
      compatibilityClaimed: false
    },
    {
      id: "private-json-serialization-diagnostic",
      acceptedPrivatePrerequisite: true,
      publicJsSurfaceSupported: false,
      compatibilityClaimed: false
    }
  ]);

  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });
  assert.equal(gate.requiredLocalTargetsReady, false);
  assert.equal(
    gate.localChecks.publicJsReactTestRendererFacadeStatus,
    "placeholder-present"
  );
  assert.equal(gate.localChecks.rustSerializationApiPresent, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.admittedScenarios, []);
});

test("react-test-renderer serialization scenario admission is explicit before any Fast React comparison", () => {
  assert.deepEqual(
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS.map(
      (scenario) => scenario.scenarioId
    ),
    REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS
  );

  for (const scenario of REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS) {
    assert.equal(scenario.status, REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS);
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

test("react-test-renderer serialization gate rejects premature compatibility claims before local root and commit output", () => {
  const prematureClaimOracle = JSON.parse(JSON.stringify(oracle));
  prematureClaimOracle.conformanceClaims.compatibilityClaimed = true;

  const gate = evaluateReactTestRendererSerializationLocalGate({
    oracle: prematureClaimOracle
  });

  assert.equal(gate.status, "blocked-with-violations");
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    ["compatibility-claimed-before-rust-root-and-commit-output"]
  );
});

function inspectAcceptedRustPrivatePrerequisites() {
  const sources = {
    testRenderer: readRepoText("crates/fast-react-test-renderer/src/lib.rs"),
    reconciler: readRepoText("crates/fast-react-reconciler/src/lib.rs"),
    fiberInspection: readRepoText(
      "crates/fast-react-reconciler/src/private_fiber_inspection.rs"
    )
  };

  return [
    {
      id: "rust-test-renderer-root-facade",
      acceptedPrivatePrerequisite: hasAllSourcePatterns([
        [sources.testRenderer, /\bpub struct TestRendererRoot\b/u],
        [sources.testRenderer, /\bpub fn create\b/u],
        [
          sources.testRenderer,
          /\bpub fn create_host_component_with_text_for_canary\b/u
        ]
      ]),
      publicJsSurfaceSupported: false,
      compatibilityClaimed: false
    },
    {
      id: "test-renderer-host-output-create-update-unmount-canary",
      acceptedPrivatePrerequisite: hasAllSourcePatterns([
        [
          sources.testRenderer,
          /\bpub struct TestRendererCommittedHostOutput\b/u
        ],
        [
          sources.testRenderer,
          /\bpub struct TestRendererUpdatedHostOutput\b/u
        ],
        [
          sources.testRenderer,
          /\bpub struct TestRendererUnmountedHostOutput\b/u
        ],
        [
          sources.testRenderer,
          /\bpub fn render_and_commit_host_output_for_canary\b/u
        ],
        [
          sources.testRenderer,
          /\bpub fn render_and_commit_host_output_update_for_canary\b/u
        ],
        [
          sources.testRenderer,
          /\bpub fn render_and_commit_host_output_unmount_for_canary\b/u
        ]
      ]),
      publicJsSurfaceSupported: false,
      compatibilityClaimed: false
    },
    {
      id: "committed-fiber-inspection-api",
      acceptedPrivatePrerequisite: hasAllSourcePatterns([
        [sources.reconciler, /\bpub use private_fiber_inspection::/u],
        [
          sources.fiberInspection,
          /\bpub struct TestRendererCommittedFiberTreeInspection\b/u
        ],
        [
          sources.fiberInspection,
          /\bpub fn inspect_test_renderer_committed_fiber_tree\b/u
        ],
        [
          sources.testRenderer,
          /\bpub fn describe_committed_fiber_tree_for_canary\b/u
        ]
      ]),
      publicJsSurfaceSupported: false,
      compatibilityClaimed: false
    },
    {
      id: "private-json-serialization-diagnostic",
      acceptedPrivatePrerequisite: hasAllSourcePatterns([
        [
          sources.testRenderer,
          /\bTEST_RENDERER_PRIVATE_JSON_SERIALIZATION_DIAGNOSTIC_NAME\b/u
        ],
        [
          sources.testRenderer,
          /\bpub struct TestRendererPrivateJsonSerializationReport\b/u
        ],
        [
          sources.testRenderer,
          /\bpub struct TestRendererPrivateJsonPublicSurfaceBlockers\b/u
        ],
        [
          sources.testRenderer,
          /\bpub fn describe_private_json_serialization_for_canary\b/u
        ],
        [sources.testRenderer, /\bjson_method_blocked: true\b/u],
        [sources.testRenderer, /\btree_method_blocked: true\b/u],
        [sources.testRenderer, /\binstance_wrapper_blocked: true\b/u],
        [sources.testRenderer, /\bjs_facade_routing_blocked: true\b/u],
        [sources.testRenderer, /\bcompatibility_claim_blocked: true\b/u]
      ]),
      publicJsSurfaceSupported: false,
      compatibilityClaimed: false
    }
  ];
}

function readRepoText(relativePath) {
  return readFileSync(
    new URL(`../../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

function hasAllSourcePatterns(sourcePatterns) {
  return sourcePatterns.every(([source, pattern]) => pattern.test(source));
}

test("react-test-renderer serialization React oracle generation remains React-only while the local gate is closed", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactTestRendererBehaviorProbed: true,
    fastReactComparedToReactTestRenderer: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(
    oracle.localFastReactStatus.status,
    "not-present-in-workspace"
  );
  assert.equal(
    oracle.localFastReactStatus.behaviorCompatibilityClaimed,
    false
  );
  assert.equal(
    oracle.localFastReactStatus.comparedToReactTestRenderer,
    false
  );
});
