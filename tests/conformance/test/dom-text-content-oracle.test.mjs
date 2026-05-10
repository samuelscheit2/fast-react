import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  DOM_TEXT_CONTENT_LOCAL_GATE_STATUS,
  DOM_TEXT_CONTENT_LOCAL_SCENARIO_ADMISSIONS,
  DOM_TEXT_CONTENT_LOCAL_UNBLOCKING_REQUIREMENTS,
  evaluateDomTextContentLocalGate
} from "../src/dom-text-content-local-gate.mjs";
import {
  DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS,
  DOM_TEXT_CONTENT_CONFORMANCE_GATE_ID,
  DOM_TEXT_CONTENT_PRIVATE_SHOULD_SET_ADMISSION_KIND,
  DOM_TEXT_CONTENT_PRIVATE_SHOULD_SET_MATCH_STATUS,
  DOM_TEXT_CONTENT_UNSUPPORTED_DOM_RENDER_STATUS,
  DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_SCENARIOS,
  DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_STATUS,
  evaluateDomTextContentConformanceGate,
  runLocalDomTextContentShouldSetObservations,
  runDomTextContentConformanceGate
} from "../src/dom-text-content-conformance-gate.mjs";
import {
  DOM_TEXT_CONTENT_ORACLE_ARTIFACT_PATH,
  DOM_TEXT_CONTENT_PROBE_MODES,
  DOM_TEXT_CONTENT_SUPPORTING_TARGETS,
  DOM_TEXT_CONTENT_TARGET
} from "../src/dom-text-content-targets.mjs";
import {
  DOM_TEXT_CONTENT_RENDER_SCENARIOS,
  DOM_TEXT_CONTENT_SCENARIO_IDS,
  DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS
} from "../src/dom-text-content-scenarios.mjs";
import {
  findDomTextContentClientObservation,
  findDomTextContentPhase,
  findDomTextContentServerObservation,
  findDomTextContentShouldSetObservation,
  readCheckedDomTextContentOracle,
  readCheckedDomTextContentOracleText
} from "../src/dom-text-content-oracle.mjs";

const oracle = readCheckedDomTextContentOracle();

test("checked DOM text-content oracle artifact has the expected schema and targets", () => {
  assert.equal(
    DOM_TEXT_CONTENT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-dom-text-content-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(oracle.oracleKind, "react-19.2.6-dom-text-content-oracle");
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per mode, render scenario, and probe kind; shouldSetTextContent evaluated from the extracted React DOM development bundle",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, DOM_TEXT_CONTENT_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    DOM_TEXT_CONTENT_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
  assert.equal(
    oracle.shouldSetTextContentSource.bundlePath,
    "cjs/react-dom-client.development.js"
  );
  assert.match(
    oracle.shouldSetTextContentSource.bundleSha256,
    /^[a-f0-9]{64}$/u
  );
  assert.match(
    oracle.shouldSetTextContentSource.functionSha256,
    /^[a-f0-9]{64}$/u
  );
  assert.equal(oracle.shouldSetTextContentSource.sourceIncludedInArtifact, false);
});

test("DOM text-content oracle and local gate keep Fast React compatibility blocked", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomCodeProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.localFastReactStatus.status, DOM_TEXT_CONTENT_LOCAL_GATE_STATUS);
  assert.equal(oracle.localFastReactStatus.behaviorCompatibilityClaimed, false);
  assert.deepEqual(oracle.localFastReactStatus.admittedScenarioIds, []);

  const gate = evaluateDomTextContentLocalGate({ oracle });
  assert.equal(gate.status, DOM_TEXT_CONTENT_LOCAL_GATE_STATUS);
  assert.equal(gate.requiredLocalTargetsReady, false);
  assert.equal(gate.publicCompatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(gate.admittedScenarios, []);
  assert.equal(gate.localChecks.publicReactDomClientRootStillUnsupported, true);
  assert.equal(gate.localChecks.publicReactDomClientRootRenderPathPresent, false);
  assert.equal(gate.localChecks.privateShouldSetTextContentHelperPresent, true);
  assert.equal(gate.localChecks.privateTextMutationHelperPresent, true);
  assert.equal(gate.localChecks.domHostTextCreationHelperPresent, false);
  assert.equal(gate.localChecks.dangerouslySetInnerHtmlPropertyBoundaryPresent, false);
});

test("DOM text-content local scenario admission is explicit and closed", () => {
  assert.deepEqual(
    DOM_TEXT_CONTENT_LOCAL_SCENARIO_ADMISSIONS.map(
      (scenario) => scenario.scenarioId
    ),
    DOM_TEXT_CONTENT_SCENARIO_IDS
  );

  for (const scenario of DOM_TEXT_CONTENT_LOCAL_SCENARIO_ADMISSIONS) {
    assert.equal(scenario.status, DOM_TEXT_CONTENT_LOCAL_GATE_STATUS);
    assert.equal(scenario.admittedForFastReactComparison, false);
    assert.equal(scenario.compatibilityClaimed, false);
    assert.deepEqual(
      scenario.unblockRequires,
      DOM_TEXT_CONTENT_LOCAL_UNBLOCKING_REQUIREMENTS.map(
        (requirement) => requirement.id
      )
    );
  }
});

test("DOM text-content dual-run gate compares only admitted private helper rows", () => {
  const gate = runDomTextContentConformanceGate({ checkedOracle: oracle });

  assert.equal(gate.ok, true);
  assert.equal(gate.gate.id, DOM_TEXT_CONTENT_CONFORMANCE_GATE_ID);
  assert.equal(
    gate.summary.admittedPrivateShouldSetRowCount,
    DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS.length
  );
  assert.equal(
    gate.summary.skippedUnsupportedPrivateShouldSetRowCount,
    DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_SCENARIOS.length
  );
  assert.equal(
    gate.summary.skippedUnsupportedDomRenderRowCount,
    DOM_TEXT_CONTENT_RENDER_SCENARIOS.length *
      DOM_TEXT_CONTENT_PROBE_MODES.length *
      2
  );
  assert.equal(gate.summary.failureCount, 0);
  assert.equal(gate.summary.privateTextContentBehaviorCompared, true);
  assert.equal(gate.summary.fullDomTextContentCompatibilityAdmitted, false);
  assert.equal(gate.summary.publicRootCompatibilityClaimed, false);
  assert.equal(gate.summary.serverRenderingCompatibilityClaimed, false);
  assert.equal(gate.summary.hydrationCompatibilityClaimed, false);
  assert.equal(gate.summary.compatibilityClaimed, false);
  assert.deepEqual(
    gate.admittedPrivateShouldSetRows.map((row) => row.scenarioId),
    DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS
  );
  assert.ok(
    gate.admittedPrivateShouldSetRows.some(
      (row) => row.scenarioId === "should-set-bigint-child"
    )
  );
  assert.ok(
    gate.admittedPrivateShouldSetRows.every(
      (row) =>
        row.admissionKind ===
          DOM_TEXT_CONTENT_PRIVATE_SHOULD_SET_ADMISSION_KIND &&
        row.gateStatus === DOM_TEXT_CONTENT_PRIVATE_SHOULD_SET_MATCH_STATUS
    )
  );
  for (const row of gate.admittedPrivateShouldSetRows) {
    assert.equal(row.firstDifferencePath, null);
    assert.deepEqual(row.localResult, row.checkedResult);
  }
  assert.deepEqual(
    gate.skippedUnsupportedPrivateShouldSetRows.map((row) => row.scenarioId),
    ["should-set-textarea-special-case", "should-set-noscript-special-case"]
  );
  assert.ok(
    gate.skippedUnsupportedPrivateShouldSetRows.every(
      (row) =>
        row.gateStatus ===
          DOM_TEXT_CONTENT_UNSUPPORTED_PRIVATE_SHOULD_SET_STATUS &&
        row.checkedResult.status === "ok" &&
        row.checkedResult.value === true &&
        row.localResult.status === "ok" &&
        row.localResult.value === false &&
        row.firstDifferencePath === "$.value"
    )
  );
  assert.ok(
    gate.skippedUnsupportedDomRenderRows.every(
      (row) => row.gateStatus === DOM_TEXT_CONTENT_UNSUPPORTED_DOM_RENDER_STATUS
    )
  );
});

test("DOM text-content dual-run gate fails closed on admitted private mismatches and premature claims", () => {
  const localShouldSetTextContentObservations =
    runLocalDomTextContentShouldSetObservations();
  assert.equal(localShouldSetTextContentObservations.metadata.loaded, true);
  const firstAdmittedObservation =
    localShouldSetTextContentObservations.observations.find(
      (observation) =>
        observation.scenarioId ===
        DOM_TEXT_CONTENT_ADMITTED_PRIVATE_SHOULD_SET_SCENARIO_IDS[0]
    );
  assert.ok(firstAdmittedObservation);
  firstAdmittedObservation.result.value = "wrong";

  const mismatchGate = evaluateDomTextContentConformanceGate({
    checkedOracle: oracle,
    localShouldSetTextContentObservations
  });
  assert.equal(mismatchGate.ok, false);
  assert.equal(
    mismatchGate.failures[0].gateStatus,
    "admitted-private-should-set-output-mismatch"
  );

  const unsupportedMatchObservations =
    runLocalDomTextContentShouldSetObservations();
  for (const scenarioId of [
    "should-set-textarea-special-case",
    "should-set-noscript-special-case"
  ]) {
    const observation = unsupportedMatchObservations.observations.find(
      (candidate) => candidate.scenarioId === scenarioId
    );
    assert.ok(observation, scenarioId);
    observation.result.value = true;
  }
  const unsupportedMatchGate = evaluateDomTextContentConformanceGate({
    checkedOracle: oracle,
    localShouldSetTextContentObservations: unsupportedMatchObservations
  });
  assert.equal(unsupportedMatchGate.ok, false);
  assert.deepEqual(
    unsupportedMatchGate.failures
      .filter(
        (failure) =>
          failure.gateStatus ===
          "private-should-set-row-skipped-despite-local-match"
      )
      .map((failure) => failure.scenarioId),
    ["should-set-textarea-special-case", "should-set-noscript-special-case"]
  );

  const prematureClaimOracle = JSON.parse(JSON.stringify(oracle));
  prematureClaimOracle.conformanceClaims.compatibilityClaimed = true;
  const prematureClaimGate = runDomTextContentConformanceGate({
    checkedOracle: prematureClaimOracle
  });

  assert.equal(prematureClaimGate.ok, false);
  assert.ok(
    prematureClaimGate.failures.some(
      (failure) =>
        failure.gateStatus ===
        "checked-oracle-claims-compatibilityClaimed-while-unsupported-rows-skipped"
    )
  );
});

test("shouldSetTextContent observations cover primitives, special tags, arrays, elements, and dangerous HTML", () => {
  assert.deepEqual(
    oracle.shouldSetTextContentScenarios,
    DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS
  );
  assert.equal(
    oracle.shouldSetTextContentObservations.length,
    DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS.length
  );

  const coverage = new Set(
    oracle.shouldSetTextContentScenarios.flatMap((scenario) => scenario.coverage)
  );
  for (const requiredCoverage of [
    "primitive-string",
    "primitive-number",
    "primitive-bigint",
    "textarea-excluded-local-claim",
    "noscript-excluded-local-claim",
    "array-children",
    "element-child",
    "dangerouslySetInnerHTML",
    "dangerouslySetInnerHTML-nullish",
    "dangerouslySetInnerHTML-invalid-shape",
    "children-conflict"
  ]) {
    assert.ok(
      coverage.has(requiredCoverage),
      `missing shouldSet coverage ${requiredCoverage}`
    );
  }

  for (const scenario of DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS) {
    const observation = findDomTextContentShouldSetObservation(
      oracle,
      scenario.id
    );
    assert.equal(observation.result.status, "ok", scenario.id);
    assert.equal(
      observation.result.value,
      scenario.expectedReactDomValue,
      scenario.id
    );
  }
});

test("DOM text-content oracle covers every render scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, DOM_TEXT_CONTENT_PROBE_MODES);
  assert.deepEqual(oracle.renderScenarios, DOM_TEXT_CONTENT_RENDER_SCENARIOS);

  const coverage = new Set(
    oracle.renderScenarios.flatMap((scenario) => scenario.coverage)
  );
  for (const requiredCoverage of [
    "element-text-content-shortcut",
    "host-text-creation",
    "host-text-update",
    "host-text-deletion",
    "host-text-insertion",
    "resetTextContent",
    "namespace-text",
    "svg-container-context",
    "dangerouslySetInnerHTML-exclusion",
    "children-conflict",
    "root-error"
  ]) {
    assert.ok(
      coverage.has(requiredCoverage),
      `missing render coverage ${requiredCoverage}`
    );
  }

  for (const mode of DOM_TEXT_CONTENT_PROBE_MODES) {
    assert.equal(
      oracle.serverSerializationObservations[mode.id].length,
      DOM_TEXT_CONTENT_RENDER_SCENARIOS.length
    );
    assert.equal(
      oracle.clientMutationObservations[mode.id].length,
      DOM_TEXT_CONTENT_RENDER_SCENARIOS.length
    );

    for (const scenario of DOM_TEXT_CONTENT_RENDER_SCENARIOS) {
      assert.equal(serverObservation(mode.id, scenario.id).scenarioId, scenario.id);
      assert.equal(clientObservation(mode.id, scenario.id).scenarioId, scenario.id);
    }
  }
});

test("server serialization records primitive text, HostText sibling, namespace, and raw HTML boundaries", () => {
  assert.equal(
    serverPhase(
      "default-node-development",
      "primitive-text-content-shortcut",
      "number"
    ).result.value,
    "<div>42</div>"
  );
  assert.equal(
    serverPhase(
      "default-node-development",
      "host-text-sibling-boundaries",
      "initial"
    ).result.value,
    "<div>left<span>middle</span>right</div>"
  );
  assert.equal(
    serverPhase(
      "default-node-development",
      "namespace-text-content-boundaries",
      "initial"
    ).result.value,
    "<svg><text>Vector</text><foreignObject><div>HTML text</div></foreignObject></svg>"
  );
  assert.equal(
    serverPhase(
      "default-node-development",
      "dangerous-html-exclusion-and-managed-text",
      "raw-html"
    ).result.value,
    "<div><span>Raw</span></div>"
  );
});

test("client mutation records element text-content shortcut updates and clears", () => {
  const initial = clientPhase(
    "default-node-development",
    "primitive-text-content-shortcut",
    "initial"
  );
  assert.deepEqual(
    mutationTypes(initial),
    [
      "createElement",
      "setTextContent",
      "createTextNode",
      "appendChild",
      "setTextContent",
      "appendChild"
    ]
  );
  assert.equal(firstRenderedElement(initial).children[0].text, "Alpha");

  const update = clientPhase(
    "default-node-development",
    "primitive-text-content-shortcut",
    "update"
  );
  assert.deepEqual(mutationTypes(update), ["setNodeValue"]);
  assert.equal(firstRenderedElement(update).children[0].text, "Beta");

  const empty = clientPhase(
    "default-node-development",
    "primitive-text-content-shortcut",
    "empty"
  );
  assert.deepEqual(mutationTypes(empty), ["setTextContent"]);
  assert.deepEqual(firstRenderedElement(empty).children, []);
});

test("client mutation records HostText creation, update, deletion, and insertion boundaries", () => {
  const siblingInitial = clientPhase(
    "default-node-development",
    "host-text-sibling-boundaries",
    "initial"
  );
  assert.deepEqual(
    siblingInitial.mutations
      .filter((mutation) => mutation.type === "createTextNode")
      .map((mutation) => mutation.value),
    ["left", "middle", "right"]
  );

  const siblingUpdate = clientPhase(
    "default-node-development",
    "host-text-sibling-boundaries",
    "update"
  );
  assert.deepEqual(
    siblingUpdate.mutations
      .filter((mutation) => mutation.type === "setNodeValue")
      .map((mutation) => mutation.value),
    ["left!", "middle!", "right!"]
  );

  const siblingDelete = clientPhase(
    "default-node-development",
    "host-text-sibling-boundaries",
    "delete-text-siblings"
  );
  assert.deepEqual(mutationTypes(siblingDelete), ["removeChild", "removeChild"]);

  const prepend = clientPhase(
    "default-node-development",
    "host-text-insertion-before-element",
    "prepend-text"
  );
  assert.deepEqual(mutationTypes(prepend), ["createTextNode", "insertBefore"]);
  assert.equal(firstRenderedElement(prepend).children[0].text, "head");
});

test("client mutation records resetTextContent before managed child append and namespace text updates", () => {
  const managed = clientPhase(
    "default-node-development",
    "text-content-to-managed-child-boundary",
    "managed-child"
  );
  assert.deepEqual(mutationTypes(managed), [
    "createElement",
    "setTextContent",
    "createTextNode",
    "appendChild",
    "setTextContent",
    "appendChild"
  ]);
  assert.equal(
    managed.mutations[4].target,
    "SECTION",
    "section text is reset before appending the managed child"
  );

  const namespaceInitial = clientPhase(
    "default-node-development",
    "namespace-text-content-boundaries",
    "initial"
  );
  assert.deepEqual(
    namespaceInitial.mutations
      .filter((mutation) => mutation.type === "createElementNS")
      .map((mutation) => [mutation.tagName, mutation.namespaceURI]),
    [
      ["text", "http://www.w3.org/2000/svg"],
      ["foreignObject", "http://www.w3.org/2000/svg"],
      ["svg", "http://www.w3.org/2000/svg"]
    ]
  );
  assert.equal(
    firstRenderedElement(namespaceInitial).children[1].children[0].namespaceURI,
    "http://www.w3.org/1999/xhtml"
  );

  const svgContainer = clientPhase(
    "default-node-development",
    "svg-container-text-root",
    "initial"
  );
  assert.equal(
    firstRenderedElement(svgContainer).namespaceURI,
    "http://www.w3.org/2000/svg"
  );
});

test("dangerouslySetInnerHTML observations record leaf exclusions and root errors", () => {
  const rawHtml = clientPhase(
    "default-node-development",
    "dangerous-html-exclusion-and-managed-text",
    "raw-html"
  );
  assert.deepEqual(
    rawHtml.mutations
      .filter((mutation) => mutation.type === "setInnerHTML")
      .map((mutation) => mutation.value),
    ["<span>Raw</span>"]
  );
  assert.deepEqual(firstRenderedElement(rawHtml).children, []);
  assert.equal(firstRenderedElement(rawHtml).assignedInnerHTML, "<span>Raw</span>");

  const managedText = clientPhase(
    "default-node-development",
    "dangerous-html-exclusion-and-managed-text",
    "managed-text"
  );
  assert.deepEqual(mutationTypes(managedText), [
    "setTextContent",
    "createTextNode",
    "appendChild"
  ]);
  assert.equal(firstRenderedElement(managedText).assignedInnerHTML, null);

  const nullHtml = clientPhase(
    "default-node-development",
    "dangerous-html-nullish-does-not-shortcut",
    "null-html"
  );
  assert.equal(firstRenderedElement(nullHtml).assignedInnerHTML, null);

  assert.equal(
    firstRootError(
      clientPhase(
        "default-node-development",
        "dangerous-html-children-conflict",
        "conflict"
      )
    ).error.message,
    "Can only set one of `children` or `props.dangerouslySetInnerHTML`."
  );
  assert.equal(
    firstRootError(
      clientPhase(
        "default-node-development",
        "dangerous-html-shape-validation",
        "missing-html-key"
      )
    ).error.message,
    "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://react.dev/link/dangerously-set-inner-html for more information."
  );
});

test("DOM text-content oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedDomTextContentOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|\/tmp\/|file:\/\/\/|fast-react-dom-text-content-oracle-[A-Za-z0-9]|Users\/user|Developer\/Developer/u.test(
      text
    ),
    false
  );
});

test("print DOM text-content oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-text-content-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedDomTextContentOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedDomTextContentOracleText());
});

test("DOM text-content conformance gate CLI reports the focused fail-closed gate", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/check-dom-text-content-conformance.mjs"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.match(output, /^DOM text-content conformance gate: PASS/u);
  assert.match(output, /Gate: dom-text-content-dual-run-gate-1/u);
  assert.match(
    output,
    /Skipped unsupported DOM render\/mutation rows: 40/u
  );
  assert.match(output, /Public root compatibility claimed: false/u);
});

test("print DOM text-content oracle markdown is readable", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-text-content-oracle.mjs", "--format=markdown"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.match(output, /^# Fast React DOM Text Content Oracle/u);
  assert.match(output, /## shouldSetTextContent/u);
  assert.match(output, /primitive-text-content-shortcut/u);
  assert.match(output, /compatibilityClaimed: false/u);
});

function serverObservation(modeId, scenarioId) {
  return findDomTextContentServerObservation(oracle, modeId, scenarioId);
}

function clientObservation(modeId, scenarioId) {
  return findDomTextContentClientObservation(oracle, modeId, scenarioId);
}

function serverPhase(modeId, scenarioId, phaseId) {
  return findDomTextContentPhase(
    serverObservation(modeId, scenarioId),
    phaseId
  );
}

function clientPhase(modeId, scenarioId, phaseId) {
  return findDomTextContentPhase(
    clientObservation(modeId, scenarioId),
    phaseId
  );
}

function firstRenderedElement(phase) {
  assert.equal(phase.result.status, "ok");
  assert.equal(phase.container.children.length, 1);
  return phase.container.children[0];
}

function firstRootError(phase) {
  assert.equal(phase.result.status, "ok");
  assert.equal(phase.rootErrors.length, 1);
  assert.equal(phase.rootErrors[0].channel, "onUncaughtError");
  return phase.rootErrors[0];
}

function mutationTypes(phase) {
  return phase.mutations.map((mutation) => mutation.type);
}
