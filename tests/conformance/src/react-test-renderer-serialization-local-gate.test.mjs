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
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_SCENARIO_ADMISSIONS,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_UNBLOCKING_REQUIREMENTS,
  evaluateReactTestRendererSerializationLocalGate
} from "./react-test-renderer-serialization-local-gate.mjs";

const oracle = readCheckedReactTestRendererSerializationOracle();

test("react-test-renderer serialization compatibility stays blocked until Rust TestRendererRoot and committed host output exist", () => {
  const gate = evaluateReactTestRendererSerializationLocalGate({ oracle });

  assert.equal(gate.status, REACT_TEST_RENDERER_SERIALIZATION_LOCAL_GATE_STATUS);
  assert.equal(gate.requiredLocalTargetsReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.localChecks, {
    publicJsReactTestRendererFacadePresent: false,
    rustTestRendererRootFacadePresent: false,
    committedTestRendererHostOutputPresent: false,
    committedFiberInspectionPresent: false,
    rustSerializationApiPresent: false
  });
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
