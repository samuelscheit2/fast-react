import assert from "node:assert/strict";
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
  REACT_TEST_RENDERER_SERIALIZATION_PUBLIC_COMPATIBILITY_STATUS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS,
  evaluateReactTestRendererSerializationLocalGate
} from "./react-test-renderer-serialization-local-gate.mjs";

const oracle = readCheckedReactTestRendererSerializationOracle();

test("react-test-renderer serialization gate is ready for private diagnostics while public compatibility stays blocked", () => {
  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });

  assert.equal(gate.status, REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS);
  assert.equal(gate.requiredLocalTargetsReady, true);
  assert.equal(gate.privateDiagnosticsReady, true);
  assert.deepEqual(gate.privateDiagnosticBlockers, []);
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
    publicToJSONAvailable: false,
    publicToTreeAvailable: false,
    publicTestInstanceWrappersPresent: false,
    publicJsFacadeRoutingPresent: false
  });
});

test("react-test-renderer serialization scenario admission is explicit and blocked for public rows", () => {
  assert.deepEqual(
    REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS.map(
      (scenario) => scenario.scenarioId
    ),
    REACT_TEST_RENDERER_SERIALIZATION_SCENARIO_IDS
  );

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

test("react-test-renderer serialization React oracle generation remains React-only while public compatibility is blocked", () => {
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
