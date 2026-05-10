import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  DOM_TEXT_CONTENT_LOCAL_GATE_STATUS,
  DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_ROWS,
  DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_STATUS,
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

test("DOM text-content local gate compares private fake-DOM text-to-element ordering", () => {
  const gate = evaluateDomTextContentLocalGate({ oracle });
  const expectedRowIds = DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_ROWS.map(
    (row) => row.rowId
  );
  const rowsByKey = new Map(
    gate.localChecks.privateTextContentTransitionOrderRows.map((row) => [
      `${row.modeId}:${row.rowId}`,
      row
    ])
  );

  assert.equal(
    gate.localChecks.privateTextContentTransitionOrderGatePresent,
    true
  );
  assert.equal(
    gate.localChecks.privateTextContentTransitionOrderGatePassed,
    true
  );
  assert.deepEqual(
    gate.localChecks.privateTextContentTransitionOrderMismatches,
    []
  );
  assert.deepEqual(
    gate.localChecks.privateTextContentTransitionOrderMetadata
      .textContentMetadata.supportedFakeDomRowIds,
    expectedRowIds
  );
  assert.deepEqual(
    gate.localChecks.privateTextContentTransitionOrderMetadata.mutationMetadata
      .supportedFakeDomRowIds,
    expectedRowIds
  );

  assert.deepEqual(
    rowsByKey.get(
      "default-node-development:text-content-reset-before-managed-child-append"
    ).localResult.mutations,
    [
      { type: "createElement", tagName: "span" },
      { type: "setTextContent", target: "SPAN", value: "Managed child" },
      { type: "createTextNode", value: "Managed child" },
      { type: "appendChild", parent: "SPAN", child: "#text" },
      { type: "setTextContent", target: "SECTION", value: "" },
      { type: "appendChild", parent: "SECTION", child: "SPAN" }
    ]
  );
  assert.deepEqual(
    rowsByKey.get(
      "default-node-development:managed-child-remove-before-text-content-update"
    ).localResult.mutations,
    [
      { type: "removeChild", parent: "SECTION", child: "SPAN", found: true },
      { type: "setTextContent", target: "SECTION", value: "Plain text again" },
      { type: "createTextNode", value: "Plain text again" },
      { type: "appendChild", parent: "SECTION", child: "#text" }
    ]
  );

  for (const row of gate.localChecks.privateTextContentTransitionOrderRows) {
    assert.equal(
      row.status,
      DOM_TEXT_CONTENT_LOCAL_TEXT_TRANSITION_ORDER_STATUS
    );
    assert.equal(row.firstDifferencePath, null);
    assert.deepEqual(row.localResult, row.expectedReactDomResult);
    assert.equal(expectedRowIds.includes(row.rowId), true);
  }
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

test("DOM text-content local gate rejects transition ordering drift from the checked oracle", () => {
  const driftedOracle = JSON.parse(JSON.stringify(oracle));
  const clientObservation = driftedOracle.clientMutationObservations[
    "default-node-development"
  ].find(
    (observation) =>
      observation.scenarioId === "text-content-to-managed-child-boundary"
  );
  const managedChildPhase = clientObservation.result.phases.find(
    (phase) => phase.phaseId === "managed-child"
  );
  managedChildPhase.mutations[4] = managedChildPhase.mutations[5];
  managedChildPhase.mutations.length = 5;

  const gate = evaluateDomTextContentLocalGate({ oracle: driftedOracle });

  assert.equal(gate.status, "blocked-with-violations");
  assert.ok(
    gate.violations.some(
      (violation) =>
        violation.id === "private-text-content-transition-order-oracle-mismatch"
    )
  );
  assert.deepEqual(
    gate.localChecks.privateTextContentTransitionOrderMismatches.map(
      (row) => `${row.modeId}:${row.rowId}`
    ),
    ["default-node-development:text-content-reset-before-managed-child-append"]
  );
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
