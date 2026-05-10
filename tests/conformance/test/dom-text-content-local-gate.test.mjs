import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  DOM_TEXT_CONTENT_LOCAL_GATE_STATUS,
  DOM_TEXT_CONTENT_LOCAL_UNSUPPORTED_SHOULD_SET_SCENARIO_IDS,
  evaluateDomTextContentLocalGate
} from "../src/dom-text-content-local-gate.mjs";
import {
  readCheckedDomTextContentOracle
} from "../src/dom-text-content-oracle.mjs";
import {
  DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS
} from "../src/dom-text-content-scenarios.mjs";

const oracle = readCheckedDomTextContentOracle();

test("DOM text-content local gate compares the private shouldSetTextContent helper to the React DOM oracle", () => {
  const gate = evaluateDomTextContentLocalGate({ oracle });
  const rowsById = new Map(
    gate.localChecks.privateShouldSetTextContentOracleRows.map((row) => [
      row.scenarioId,
      row
    ])
  );

  assert.equal(gate.status, DOM_TEXT_CONTENT_LOCAL_GATE_STATUS);
  assert.equal(gate.localChecks.privateShouldSetTextContentHelperPresent, true);
  assert.equal(
    gate.localChecks.privateShouldSetTextContentOracleGatePassed,
    true
  );
  assert.deepEqual(
    gate.localChecks.privateShouldSetTextContentOracleMismatches,
    []
  );
  assert.equal(
    gate.localChecks.privateShouldSetTextContentOracleRows.length,
    DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS.length
  );
  assert.deepEqual(
    gate.localChecks.privateShouldSetTextContentUnsupportedScenarioIds,
    DOM_TEXT_CONTENT_LOCAL_UNSUPPORTED_SHOULD_SET_SCENARIO_IDS
  );

  for (const scenario of DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS) {
    const row = rowsById.get(scenario.id);
    assert.ok(row, `missing local helper row for ${scenario.id}`);

    if (
      DOM_TEXT_CONTENT_LOCAL_UNSUPPORTED_SHOULD_SET_SCENARIO_IDS.includes(
        scenario.id
      )
    ) {
      assert.equal(row.expectedReactDomValue, true, scenario.id);
      assert.equal(row.localValue, false, scenario.id);
      assert.equal(
        row.status,
        "blocked-unsupported-local-host-type",
        scenario.id
      );
    } else {
      assert.equal(row.expectedReactDomValue, row.localValue, scenario.id);
      assert.equal(row.status, "matches-react-dom", scenario.id);
    }
  }
});

test("DOM text-content local gate remains blocked while public roots and DOM text commits are unsupported", () => {
  const gate = evaluateDomTextContentLocalGate({ oracle });

  assert.equal(gate.status, DOM_TEXT_CONTENT_LOCAL_GATE_STATUS);
  assert.equal(gate.requiredLocalTargetsReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.admittedScenarios, []);
  assert.equal(gate.localChecks.publicReactDomClientRootStillUnsupported, true);
  assert.equal(
    gate.localChecks.publicReactDomClientRootRenderPathPresent,
    false
  );
  assert.equal(gate.localChecks.domHostTextCreationHelperPresent, false);
  assert.equal(
    gate.localChecks.dangerouslySetInnerHtmlPropertyBoundaryPresent,
    false
  );
});

test("DOM text-content local gate rejects private helper drift from the checked oracle", () => {
  const driftedOracle = JSON.parse(JSON.stringify(oracle));
  const stringChildObservation =
    driftedOracle.shouldSetTextContentObservations.find(
      (observation) => observation.scenarioId === "should-set-string-child"
    );
  stringChildObservation.result.value = false;

  const gate = evaluateDomTextContentLocalGate({ oracle: driftedOracle });

  assert.equal(gate.status, "blocked-with-violations");
  assert.deepEqual(
    gate.violations.map((violation) => violation.id),
    ["private-should-set-text-content-helper-oracle-mismatch"]
  );
  assert.deepEqual(gate.violations[0].scenarioIds, ["should-set-string-child"]);
});

test("DOM text-content local gate CLI reports the closed local status", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-dom-text-content-local-gate.mjs"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.match(
    output,
    /^DOM text-content local gate: blocked-until-dom-host-text-rendering$/mu
  );
  assert.match(output, /^admittedScenarios: 0$/mu);
  assert.match(output, /should-set-textarea-special-case/u);
  assert.match(output, /should-set-noscript-special-case/u);
});
