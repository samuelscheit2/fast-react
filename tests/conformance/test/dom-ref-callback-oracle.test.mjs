import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH,
  DOM_REF_CALLBACK_PROBE_MODES,
  DOM_REF_CALLBACK_REACT_DOM_TARGET,
  DOM_REF_CALLBACK_SUPPORTING_TARGETS
} from "../src/dom-ref-callback-targets.mjs";
import {
  DOM_REF_CALLBACK_SCENARIO_IDS,
  DOM_REF_CALLBACK_SCENARIOS
} from "../src/dom-ref-callback-scenarios.mjs";
import {
  formatDomRefCallbackOracleAsMarkdown,
  findDomRefCallbackObservation,
  readCheckedDomRefCallbackOracle,
  readCheckedDomRefCallbackOracleText
} from "../src/dom-ref-callback-oracle.mjs";

const oracle = readCheckedDomRefCallbackOracle();

test("checked React DOM ref callback oracle artifact has expected schema and targets", () => {
  assert.equal(
    DOM_REF_CALLBACK_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-dom-ref-callback-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-dom-ref-callback-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact React, React DOM, and scheduler npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, DOM_REF_CALLBACK_REACT_DOM_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    DOM_REF_CALLBACK_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM ref callback oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-fast-react-react-dom-comparison"
    ),
    true
  );
  assert.equal(
    oracle.intentionalGaps.some((gap) => gap.id === "synchronous-flushsync-only"),
    true
  );
});

test("React DOM ref callback oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, DOM_REF_CALLBACK_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, DOM_REF_CALLBACK_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "host callback ref ordering",
    "callback ref updates",
    "callback ref cleanup return",
    "object refs",
    "StrictMode ref behavior",
    "error propagation"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of DOM_REF_CALLBACK_PROBE_MODES) {
    assert.equal(
      oracle.observations[mode.id].length,
      DOM_REF_CALLBACK_SCENARIO_IDS.length
    );

    for (const scenarioId of DOM_REF_CALLBACK_SCENARIO_IDS) {
      const observation = observationFor(mode.id, scenarioId);
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.nodeEnv, mode.nodeEnv);
      assert.equal(observation.condition, mode.condition);
      assert.equal(observation.result.scenarioId, scenarioId);
      assert.equal(observation.result.result.status, "ok");
      assert.deepEqual(observation.result.consoleCalls, []);
    }
  }
});

test("nested host callback refs attach child before parent and detach parent before child", () => {
  for (const mode of modeIds()) {
    const value = resultValue(mode, "nested-host-callback-ref-mount-unmount");

    assert.deepEqual(operationStatuses(value), {
      mount: "ok",
      unmount: "ok"
    });
    assert.deepEqual(eventSignatures(value.events), [
      "callback-ref:child:attach:div",
      "callback-ref:parent:attach:section",
      "callback-ref:parent:detach:null",
      "callback-ref:child:detach:null"
    ]);
    assert.deepEqual(value.finalContainer, {
      childCount: 0,
      children: []
    });
  }
});

test("stable and replaced callback ref updates record deterministic attach/detach ordering", () => {
  for (const mode of modeIds()) {
    const stable = resultValue(mode, "stable-callback-ref-update");
    assert.deepEqual(eventSignatures(stable.events), [
      "callback-ref:stable:attach:div",
      "callback-ref:stable:detach:null"
    ]);
    assert.equal(stable.operations[1].label, "update");
    assert.equal(stable.operations[1].status, "ok");

    const identity = resultValue(mode, "callback-ref-identity-update");
    assert.deepEqual(eventSignatures(identity.events), [
      "callback-ref:first:attach:div",
      "callback-ref:first:detach:null",
      "callback-ref:second:attach:div",
      "callback-ref:second:detach:null"
    ]);
    assert.equal(
      identity.events[0].node.id,
      identity.events[2].node.id,
      "host node identity should be reused when only the callback ref changes"
    );

    const replacement = resultValue(mode, "host-type-replacement-update");
    assert.deepEqual(eventSignatures(replacement.events), [
      "callback-ref:host:attach:div",
      "callback-ref:host:detach:null",
      "callback-ref:host:attach:span",
      "callback-ref:host:detach:null"
    ]);
    assert.notEqual(
      replacement.events[0].node.id,
      replacement.events[2].node.id,
      "host type replacement should attach a new host node"
    );
  }
});

test("callback cleanup returns replace null detach calls on update and unmount", () => {
  for (const mode of modeIds()) {
    const value = resultValue(mode, "callback-cleanup-return-update-unmount");

    assert.deepEqual(eventSignatures(value.events), [
      "callback-ref:first-cleanup:attach:div",
      "callback-cleanup:first-cleanup::div",
      "callback-ref:second-cleanup:attach:div",
      "callback-cleanup:second-cleanup::div"
    ]);
    assert.equal(
      value.events.some((event) => event.phase === "detach"),
      false,
      "cleanup-return refs should not receive null detach calls here"
    );
  }
});

test("object ref current is set before sibling callback attach and cleared before detach", () => {
  for (const mode of modeIds()) {
    const value = resultValue(mode, "object-ref-relative-order-and-replacement");

    assert.equal(value.events[0].label, "observer");
    assert.equal(value.events[0].phase, "attach");
    assert.equal(value.events[0].node.localName, "span");
    assert.equal(value.events[0].objectRefCurrent.localName, "div");

    assert.equal(operationByLabel(value, "after-mount").value.current.localName, "div");
    assert.equal(
      operationByLabel(value, "after-replace").value.current.localName,
      "section"
    );
    assert.equal(value.events[3].label, "observer");
    assert.equal(value.events[3].phase, "detach");
    assert.deepEqual(value.events[3].objectRefCurrent, {
      type: "null"
    });
    assert.deepEqual(operationByLabel(value, "after-unmount").value.current, {
      type: "null"
    });
  }
});

test("StrictMode ref replay is captured only in development", () => {
  const nullDetachDevelopment = resultValue(
    "default-node-development",
    "strict-mode-callback-null-detach-cycle"
  );
  assert.deepEqual(eventSignatures(nullDetachDevelopment.events), [
    "callback-ref:strict-null:attach:div",
    "callback-ref:strict-null:detach:null",
    "callback-ref:strict-null:attach:div",
    "callback-ref:strict-null:detach:null"
  ]);

  const nullDetachProduction = resultValue(
    "default-node-production",
    "strict-mode-callback-null-detach-cycle"
  );
  assert.deepEqual(eventSignatures(nullDetachProduction.events), [
    "callback-ref:strict-null:attach:div",
    "callback-ref:strict-null:detach:null"
  ]);

  const cleanupDevelopment = resultValue(
    "default-node-development",
    "strict-mode-callback-cleanup-cycle"
  );
  assert.deepEqual(eventSignatures(cleanupDevelopment.events), [
    "callback-ref:strict-cleanup:attach:div",
    "callback-cleanup:strict-cleanup::div",
    "callback-ref:strict-cleanup:attach:div",
    "callback-cleanup:strict-cleanup::div"
  ]);

  const cleanupProduction = resultValue(
    "default-node-production",
    "strict-mode-callback-cleanup-cycle"
  );
  assert.deepEqual(eventSignatures(cleanupProduction.events), [
    "callback-ref:strict-cleanup:attach:div",
    "callback-cleanup:strict-cleanup::div"
  ]);
});

test("callback ref attach and cleanup errors propagate through root onUncaughtError", () => {
  for (const mode of modeIds()) {
    const attachError = resultValue(
      mode,
      "callback-ref-attach-error-propagation"
    );
    assert.deepEqual(eventSignatures(attachError.events), [
      "callback-ref:throwing-attach:attach:div",
      "callback-ref:throwing-attach:detach:null",
      "root-error:onUncaughtError::"
    ]);
    assert.deepEqual(rootErrorMessages(attachError), [
      "throwing-attach attach error"
    ]);

    const cleanupError = resultValue(
      mode,
      "callback-ref-cleanup-error-propagation"
    );
    assert.deepEqual(eventSignatures(cleanupError.events), [
      "callback-ref:throwing-cleanup:attach:div",
      "callback-cleanup:throwing-cleanup::div",
      "root-error:onUncaughtError::"
    ]);
    assert.deepEqual(rootErrorMessages(cleanupError), [
      "throwing-cleanup cleanup error"
    ]);
  }
});

test("React DOM ref callback oracle artifact has no temp or local path leaks", () => {
  const oracleText = readCheckedDomRefCallbackOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-dom-ref-callback-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print-dom-ref-callback-oracle CLI emits the checked-in oracle", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-ref-callback-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedDomRefCallbackOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedDomRefCallbackOracleText());
});

test("DOM ref callback oracle markdown summarizes observed root errors", () => {
  const markdown = formatDomRefCallbackOracleAsMarkdown(oracle);
  assert.match(
    markdown,
    /default-node-development: 10 observations, 2 root error reports/u
  );
  assert.match(
    markdown,
    /default-node-production: 10 observations, 2 root error reports/u
  );
});

function modeIds() {
  return DOM_REF_CALLBACK_PROBE_MODES.map((mode) => mode.id);
}

function observationFor(modeId, scenarioId) {
  return findDomRefCallbackObservation(oracle, modeId, scenarioId);
}

function resultValue(modeId, scenarioId) {
  const result = observationFor(modeId, scenarioId).result.result;
  assert.equal(result.status, "ok", `${modeId}:${scenarioId}`);
  return result.value;
}

function eventSignatures(events) {
  return events.map((event) => {
    const node = event.node?.type === "element" ? event.node.localName : event.node?.type ?? "";
    return `${event.event}:${event.label ?? event.channel}:${event.phase ?? ""}:${node}`;
  });
}

function operationStatuses(value) {
  return Object.fromEntries(
    value.operations.map((operation) => [operation.label, operation.status])
  );
}

function operationByLabel(value, label) {
  const operation = value.operations.find((candidate) => candidate.label === label);
  assert.ok(operation, `missing operation ${label}`);
  assert.equal(operation.status, "ok", label);
  return operation;
}

function rootErrorMessages(value) {
  return value.rootErrors.map((error) => error.error.message);
}
