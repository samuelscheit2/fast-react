import assert from "node:assert/strict";
import test from "node:test";

import {
  DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS,
  DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_ADMISSION_KIND,
  DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_MATCH_STATUS,
  DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_HOST_TEXT_COMMIT_SCENARIOS,
  evaluateDomTextContentConformanceGate,
  runDomTextContentConformanceGate,
  runLocalDomHostTextCommitObservations
} from "../src/dom-text-content-conformance-gate.mjs";
import { readCheckedDomTextContentOracle } from "../src/dom-text-content-oracle.mjs";
import { DOM_TEXT_CONTENT_PROBE_MODES } from "../src/dom-text-content-targets.mjs";

const oracle = readCheckedDomTextContentOracle();

test("DOM HostText commit gate compares only admitted private fake-DOM rows", () => {
  const gate = runDomTextContentConformanceGate({ checkedOracle: oracle });
  const admittedRowIds = DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS.map(
    (row) => row.rowId
  );

  assert.equal(gate.ok, true);
  assert.equal(
    gate.summary.admittedPrivateHostTextCommitRowCount,
    admittedRowIds.length * DOM_TEXT_CONTENT_PROBE_MODES.length
  );
  assert.equal(gate.summary.privateHostTextCommitBehaviorCompared, true);
  assert.equal(gate.summary.fullDomTextContentCompatibilityAdmitted, false);
  assert.equal(gate.summary.publicRootCompatibilityClaimed, false);
  assert.equal(gate.summary.serverRenderingCompatibilityClaimed, false);
  assert.equal(gate.summary.hydrationCompatibilityClaimed, false);
  assert.equal(gate.summary.compatibilityClaimed, false);
  assert.equal(
    gate.gate.unsupportedDomRenderPaths.publicRootCompatibilityClaimed,
    false
  );
  assert.deepEqual(
    gate.localHostTextCommitObservationMetadata.gateMetadata.supportedFakeDomRowIds,
    admittedRowIds
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.publicRootsCompared,
    false
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.serverRenderingCompared,
    false
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.hydrationCompared,
    false
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.browserDomCompared,
    false
  );
  assert.equal(
    gate.localHostTextCommitObservationMetadata.gateMetadata.compatibilityClaimed,
    false
  );
  for (const row of gate.admittedPrivateHostTextCommitRows) {
    const admission = DOM_TEXT_CONTENT_ADMITTED_PRIVATE_HOST_TEXT_COMMIT_ROWS.find(
      (candidate) => candidate.rowId === row.rowId
    );
    assert.ok(admission, row.rowId);
    assert.equal(
      row.admissionKind,
      DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_ADMISSION_KIND
    );
    assert.equal(
      row.gateStatus,
      DOM_TEXT_CONTENT_PRIVATE_HOST_TEXT_COMMIT_MATCH_STATUS
    );
    assert.equal(row.localProbe, admission.localProbe);
    assert.equal(row.oracleExtractor, admission.oracleExtractor);
    assert.deepEqual(row.coverage, admission.coverage);
    assert.equal(row.reason, admission.reason);
    assert.deepEqual(row.localResult, row.reactOracleResult);
    assert.equal(row.firstDifferencePath, null);
    assert.equal(row.publicRootCompatibilityClaimed, false);
    assert.equal(row.serverRenderingCompatibilityClaimed, false);
    assert.equal(row.hydrationCompatibilityClaimed, false);
    assert.equal(row.compatibilityClaimed, false);
  }
  assert.deepEqual(
    gate.skippedUnsupportedPrivateHostTextCommitScenarioRows.map(
      (row) => row.scenarioId
    ),
    DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_HOST_TEXT_COMMIT_SCENARIOS.map(
      (scenario) => scenario.scenarioId
    )
  );
});

test("DOM HostText commit gate fails closed on admitted row drift and metadata claims", () => {
  const mismatchingObservations = cloneLocalHostTextCommitObservations();
  mismatchingObservations.observations[0].result.mutations[0].value = "wrong";

  const mismatchGate = evaluateDomTextContentConformanceGate({
    checkedOracle: oracle,
    localHostTextCommitObservations: mismatchingObservations
  });
  assert.equal(mismatchGate.ok, false);
  assert.ok(
    mismatchGate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "admitted-private-host-text-commit-output-mismatch"
    )
  );

  const claimingObservations = cloneLocalHostTextCommitObservations();
  claimingObservations.metadata.gateMetadata.compatibilityClaimed = true;
  const claimingGate = evaluateDomTextContentConformanceGate({
    checkedOracle: oracle,
    localHostTextCommitObservations: claimingObservations
  });
  assert.equal(claimingGate.ok, false);
  assert.ok(
    claimingGate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "local-host-text-commit-metadata-compatibilityClaimed-mismatch"
    )
  );

  const baseline = runDomTextContentConformanceGate({ checkedOracle: oracle });
  const publicRootGate = evaluateDomTextContentConformanceGate({
    checkedOracle: oracle,
    localChecks: {
      ...baseline.localChecks,
      publicReactDomClientRootStillUnsupported: false,
      publicReactDomClientRootRenderPathPresent: true
    }
  });
  assert.equal(publicRootGate.ok, false);
  assert.ok(
    publicRootGate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "local-public-react-dom-root-render-path-present-during-private-gate"
    )
  );
});

function cloneLocalHostTextCommitObservations() {
  return JSON.parse(JSON.stringify(runLocalDomHostTextCommitObservations()));
}

test("local DOM HostText commit probes normalize create, update, delete, insert, and reset rows", () => {
  const local = runLocalDomHostTextCommitObservations();
  const byRow = new Map(
    local.observations.map((observation) => [observation.rowId, observation])
  );

  assert.equal(local.metadata.loaded, true);
  assert.deepEqual(byRow.get("host-text-create-append").result.mutations, [
    { type: "createTextNode", value: "left" },
    { type: "createTextNode", value: "right" },
    { type: "appendChild", parent: "DIV", child: "#text" },
    { type: "appendChild", parent: "DIV", child: "#text" }
  ]);
  assert.deepEqual(byRow.get("host-text-update-node-value").result.mutations, [
    { type: "setNodeValue", target: "#text", value: "left!" },
    { type: "setNodeValue", target: "#text", value: "right!" }
  ]);
  assert.deepEqual(byRow.get("host-text-delete-remove-child").result.mutations, [
    { type: "removeChild", parent: "DIV", child: "#text", found: true },
    { type: "removeChild", parent: "DIV", child: "#text", found: true }
  ]);
  assert.deepEqual(byRow.get("host-text-insert-before").result.mutations, [
    { type: "createTextNode", value: "head" },
    {
      type: "insertBefore",
      parent: "DIV",
      child: "#text",
      before: "SPAN",
      beforeFound: true
    }
  ]);
  assert.deepEqual(
    byRow.get("reset-text-content-before-managed-child").result.mutations,
    [{ type: "setTextContent", target: "SECTION", value: "" }]
  );
});
