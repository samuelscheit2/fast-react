import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_FORM_ACTIONS_API_NAMES,
  REACT_DOM_FORM_ACTIONS_ORACLE_ARTIFACT_PATH,
  REACT_DOM_FORM_ACTIONS_PROBE_MODES,
  REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH,
  REACT_DOM_FORM_ACTIONS_SUPPORTING_TARGETS,
  REACT_DOM_FORM_ACTIONS_TARGET
} from "../src/react-dom-form-actions-targets.mjs";
import {
  REACT_DOM_FORM_ACTIONS_SCENARIO_IDS,
  REACT_DOM_FORM_ACTIONS_SCENARIOS
} from "../src/react-dom-form-actions-scenarios.mjs";
import {
  findReactDomFormActionsObservation,
  readCheckedReactDomFormActionsOracle,
  readCheckedReactDomFormActionsOracleText
} from "../src/react-dom-form-actions-oracle.mjs";
import {
  assertPrivateFormActionResetDispatcherGate,
  assertFastReactFormActionPrerequisiteGate,
  assertFastReactFormActionsUnsupportedGate
} from "../src/react-dom-form-actions-unsupported-gates.mjs";

const oracle = readCheckedReactDomFormActionsOracle();

test("checked React DOM form-actions oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_FORM_ACTIONS_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-form-actions-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-form-actions-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_FORM_ACTIONS_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_FORM_ACTIONS_SUPPORTING_TARGETS
  );
  assert.equal(oracle.runtimeSubpath, REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH);
  assert.deepEqual(oracle.apiNames, REACT_DOM_FORM_ACTIONS_API_NAMES);
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM form-actions oracle keeps compatibility claims intentionally narrow", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorProbed: true,
    fastReactComparedToReactDom: false,
    fastReactBehaviorCompatible: false,
    fullClientFormActionOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.fastReactComparedToReactDom, false);
  assert.equal(oracle.evidenceClaims.requestFormResetPublicErrorsProbed, true);
  assert.equal(oracle.evidenceClaims.hookBoundaryErrorsProbed, true);
  assert.equal(oracle.evidenceClaims.serverRenderHookReturnShapesProbed, true);
  assert.equal(oracle.evidenceClaims.domFormReplayBoundaryProbed, true);
  assert.equal(oracle.evidenceClaims.reactServerConditionAbsenceProbed, true);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-client-rendered-react-owned-form-success-path"
    ),
    true
  );
});

test("Fast React form-action APIs stay unsupported placeholders until form adapters exist", () => {
  assertFastReactFormActionsUnsupportedGate();
});

test("Fast React form-action event extraction stays private metadata-only", () => {
  assertPrivateFormActionResetDispatcherGate();
});

test("Fast React form-action implementation gates stay fail-closed", () => {
  assertFastReactFormActionPrerequisiteGate();
});

test("React DOM form-actions oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_FORM_ACTIONS_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_DOM_FORM_ACTIONS_SCENARIOS);

  const areas = new Set(oracle.scenarios.map((scenario) => scenario.area));
  for (const requiredArea of [
    "public-root-api-shape",
    "requestFormReset-public-errors",
    "hook-boundary-errors",
    "server-render-return-shape",
    "dom-form-dependency-boundary"
  ]) {
    assert.ok(areas.has(requiredArea), `missing scenario area ${requiredArea}`);
  }

  for (const mode of REACT_DOM_FORM_ACTIONS_PROBE_MODES) {
    const observations = oracle.observations[mode.id];
    assert.equal(observations.length, REACT_DOM_FORM_ACTIONS_SCENARIO_IDS.length);

    for (const scenarioId of REACT_DOM_FORM_ACTIONS_SCENARIO_IDS) {
      const observation = findReactDomFormActionsObservation(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(observation.scenarioId, scenarioId);
      assert.equal(observation.packageName, "react-dom");
      assert.equal(observation.specifier, "react-dom");
    }
  }
});

test("root API descriptors and react-server absence are recorded", () => {
  const defaultRoot = operationValue(
    "default-node-development",
    "root-api-descriptors"
  );
  assert.deepEqual(defaultRoot.module.exportKeys, [
    "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
    "createPortal",
    "flushSync",
    "preconnect",
    "prefetchDNS",
    "preinit",
    "preinitModule",
    "preload",
    "preloadModule",
    "requestFormReset",
    "unstable_batchedUpdates",
    "useFormState",
    "useFormStatus",
    "version"
  ]);

  for (const apiName of REACT_DOM_FORM_ACTIONS_API_NAMES) {
    const descriptor = defaultRoot.selectedAPIs[apiName];
    assert.deepEqual(dataDescriptorFields(descriptor), {
      configurable: true,
      enumerable: true,
      writable: true
    });
    assert.equal(descriptor.value.type, "function");
  }
  assert.equal(defaultRoot.selectedAPIs.requestFormReset.value.length, 1);
  assert.equal(defaultRoot.selectedAPIs.useFormState.value.length, 3);
  assert.equal(defaultRoot.selectedAPIs.useFormStatus.value.length, 0);

  const serverRoot = operationValue(
    "react-server-production",
    "root-api-descriptors"
  );
  assert.deepEqual(serverRoot.module.exportKeys, [
    "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
    "preconnect",
    "prefetchDNS",
    "preinit",
    "preinitModule",
    "preload",
    "preloadModule",
    "version"
  ]);
  assert.deepEqual(serverRoot.selectedAPIs, {
    requestFormReset: null,
    useFormState: null,
    useFormStatus: null
  });
});

test("requestFormReset invalid input errors stay rootless and non-React-owned", () => {
  for (const [modeId, messagePattern] of [
    [
      "default-node-development",
      /Invalid form element\. requestFormReset must be passed a form that was rendered by React\./u
    ],
    ["default-node-production", /Minified React error #522/u]
  ]) {
    const observation = findReactDomFormActionsObservation(
      oracle,
      modeId,
      "request-form-reset-invalid-inputs"
    );

    assert.equal(observation.result.length, 6);
    for (const entry of observation.result) {
      assert.equal(entry.operation.status, "throws", `${modeId}:${entry.id}`);
      assert.equal(entry.operation.name, "Error", `${modeId}:${entry.id}`);
      assert.match(entry.operation.message, messagePattern, `${modeId}:${entry.id}`);
    }
  }
});

test("form hooks outside render record dispatcher-null throws and dev hook diagnostics", () => {
  const developmentObservation = findReactDomFormActionsObservation(
    oracle,
    "default-node-development",
    "hook-calls-outside-render"
  );
  const development = developmentObservation.result;
  assert.equal(development.useFormStatus.status, "throws");
  assert.equal(development.useFormStatus.name, "TypeError");
  assert.equal(development.useFormState.status, "throws");
  assert.equal(development.useFormState.name, "TypeError");
  assert.match(
    development.useFormStatus.message,
    /Cannot read properties of null \(reading 'useHostTransitionStatus'\)/u
  );
  assert.match(
    development.useFormState.message,
    /Cannot read properties of null \(reading 'useFormState'\)/u
  );
  assert.equal(developmentObservation.consoleCalls.length, 2);
  for (const call of developmentObservation.consoleCalls) {
    assert.equal(call.method, "error");
    assert.match(call.args[0].value, /Invalid hook call/u);
  }

  const productionObservation = findReactDomFormActionsObservation(
    oracle,
    "default-node-production",
    "hook-calls-outside-render"
  );
  const production = productionObservation.result;
  assert.equal(production.useFormStatus.status, "throws");
  assert.equal(production.useFormState.status, "throws");
  assert.match(
    production.useFormStatus.message,
    /Cannot read properties of null \(reading 'useHostTransitionStatus'\)/u
  );
  assert.match(
    production.useFormState.message,
    /Cannot read properties of null \(reading 'useFormState'\)/u
  );
  assert.equal(productionObservation.consoleCalls.length, 0);
});

test("server render captures non-pending useFormStatus and useFormState shapes", () => {
  for (const modeId of ["default-node-development", "default-node-production"]) {
    const statusValue = operationValue(modeId, "server-render-use-form-status");
    assert.deepEqual(statusValue.status.objectKeys, [
      "pending",
      "data",
      "method",
      "action"
    ]);
    assert.deepEqual(statusValue.status.pending, {
      type: "boolean",
      value: false
    });
    assert.deepEqual(statusValue.status.data, { type: "null" });
    assert.deepEqual(statusValue.status.method, { type: "null" });
    assert.deepEqual(statusValue.status.action, { type: "null" });
    assert.equal(statusValue.html.value, '<output data-pending="false">not-pending</output>');

    const stateValue = operationValue(modeId, "server-render-use-form-state");
    assert.equal(stateValue.tuple.isArray, true);
    assert.equal(stateValue.tuple.length, 3);
    assert.deepEqual(stateValue.tuple.state, {
      type: "string",
      value: "initial-state"
    });
    assert.equal(stateValue.tuple.dispatch.type, "function");
    assert.equal(stateValue.tuple.pending.type, "boolean");
    assert.equal(stateValue.tuple.pending.value, false);
    assert.equal(stateValue.html.value, "<output>initial-state</output>");
  }
});

test("server-rendered function form action exposes replay boundary without claiming client action semantics", () => {
  for (const modeId of ["default-node-development", "default-node-production"]) {
    const value = operationValue(
      modeId,
      "server-render-function-form-action-boundary"
    );
    assert.deepEqual(value.status.pending, {
      type: "boolean",
      value: false
    });
    assert.equal(value.formBoundary.hasUnexpectedSubmitAction, true);
    assert.equal(value.formBoundary.hasSubmitReplayScript, true);
    assert.equal(value.formBoundary.hasSubmitListener, true);
    assert.equal(value.formBoundary.hasFormDataCapture, true);
    assert.equal(value.html.includesJavascriptThrowAction, true);
  }
});

test("react-server condition records API absence and unsupported server-render branches", () => {
  const hookBoundary = observationResult(
    "react-server-production",
    "hook-calls-outside-render"
  );
  assert.equal(hookBoundary.useFormStatus.status, "throws");
  assert.match(hookBoundary.useFormStatus.message, /ReactDOM\.useFormStatus is not a function/u);
  assert.equal(hookBoundary.useFormState.status, "throws");
  assert.match(hookBoundary.useFormState.message, /ReactDOM\.useFormState is not a function/u);

  for (const scenarioId of [
    "server-render-use-form-status",
    "server-render-use-form-state",
    "server-render-function-form-action-boundary"
  ]) {
    const result = findReactDomFormActionsObservation(
      oracle,
      "react-server-production",
      scenarioId
    ).result;
    assert.equal(result.status, "throws", scenarioId);
    assert.equal(
      result.message,
      "react-dom/server is not supported in React Server Components.",
      scenarioId
    );
  }
});

test("React DOM form-actions oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactDomFormActionsOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\/fast-react/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-form-actions-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /\/Users\/user\/Developer\/Developer/u);
});

test("print React DOM form-actions oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-form-actions-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedReactDomFormActionsOracleText());
});

function observationResult(modeId, scenarioId) {
  return findReactDomFormActionsObservation(oracle, modeId, scenarioId).result;
}

function operationValue(modeId, scenarioId) {
  const result = observationResult(modeId, scenarioId);
  assert.equal(result.status, "ok", `${modeId}:${scenarioId}`);
  return result.value;
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}
