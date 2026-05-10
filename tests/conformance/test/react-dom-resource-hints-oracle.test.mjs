import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

import {
  REACT_DOM_RESOURCE_HINT_APIS,
  REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH,
  REACT_DOM_RESOURCE_HINT_PRIVATE_DISPATCHER_METHODS,
  REACT_DOM_RESOURCE_HINT_PROBE_MODES,
  REACT_DOM_RESOURCE_HINT_SUPPORTING_TARGETS,
  REACT_DOM_RESOURCE_HINT_TARGET
} from "../src/react-dom-resource-hints-targets.mjs";
import {
  REACT_DOM_RESOURCE_HINT_SCENARIO_IDS,
  REACT_DOM_RESOURCE_HINT_SCENARIOS
} from "../src/react-dom-resource-hints-scenarios.mjs";
import {
  findReactDomResourceHintObservation,
  readCheckedReactDomResourceHintsOracle,
  readCheckedReactDomResourceHintsOracleText
} from "../src/react-dom-resource-hints-oracle.mjs";
import {
  assertFastReactResourceAndSingletonPrerequisiteGate,
  assertFastReactResourceHintUnsupportedGate
} from "../src/react-dom-resource-hints-unsupported-gates.mjs";

const oracle = readCheckedReactDomResourceHintsOracle();
const require = createRequire(import.meta.url);
const resourceFormGate = require(
  "../../../packages/react-dom/src/resource-form-gates.js"
);

test("checked React DOM resource hint oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-resource-hints-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-resource-hints-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per React DOM resource-hint scenario and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_RESOURCE_HINT_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_RESOURCE_HINT_SUPPORTING_TARGETS
  );
  assert.deepEqual(oracle.resourceHintApis, REACT_DOM_RESOURCE_HINT_APIS);
  assert.deepEqual(
    oracle.privateResourceDispatcherMethods,
    REACT_DOM_RESOURCE_HINT_PRIVATE_DISPATCHER_METHODS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM resource hint oracle keeps Fast React compatibility claims false", () => {
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
});

test("Fast React resource hints stay unsupported placeholders until resource adapters exist", () => {
  assertFastReactResourceHintUnsupportedGate();
});

test("Fast React resource and singleton implementation gates stay fail-closed", () => {
  assertFastReactResourceAndSingletonPrerequisiteGate();
});

test("React DOM resource hint oracle covers every scenario in every mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_RESOURCE_HINT_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_DOM_RESOURCE_HINT_SCENARIOS);

  for (const mode of REACT_DOM_RESOURCE_HINT_PROBE_MODES) {
    assert.equal(
      oracle.observations[mode.id].length,
      REACT_DOM_RESOURCE_HINT_SCENARIO_IDS.length
    );

    for (const scenarioId of REACT_DOM_RESOURCE_HINT_SCENARIO_IDS) {
      assert.equal(observation(mode.id, scenarioId).scenarioId, scenarioId);
    }
  }

  assert.deepEqual(
    new Set(oracle.scenarios.map((scenario) => scenario.observationKind)),
    new Set(["public", "private-internals"])
  );
});

test("resource hint export descriptors and default no-op dispatcher shape are recorded", () => {
  const shape = scenarioValue(
    "default-node-development",
    "resource-hint-export-shape"
  );

  assert.deepEqual(shape.module.resourceHintExportKeys, [
    "prefetchDNS",
    "preconnect",
    "preload",
    "preloadModule",
    "preinit",
    "preinitModule"
  ]);

  assert.deepEqual(resourceFunctionLengths(shape), {
    prefetchDNS: 1,
    preconnect: 2,
    preload: 2,
    preloadModule: 2,
    preinit: 2,
    preinitModule: 2
  });

  for (const api of REACT_DOM_RESOURCE_HINT_APIS) {
    assert.deepEqual(
      dataDescriptorFields(shape.module.exports[api].descriptor),
      {
        configurable: true,
        enumerable: true,
        writable: true
      },
      api
    );
  }

  assert.equal(shape.dispatcher.internalsExported, true);
  assert.equal(shape.dispatcher.dispatcherType, "object");
  assert.deepEqual(shape.dispatcher.dispatcherOwnKeys, [
    "f",
    "r",
    "D",
    "C",
    "L",
    "m",
    "X",
    "S",
    "M"
  ]);
});

test("valid public resource hint calls return undefined without warnings on the default dispatcher", () => {
  for (const modeId of [
    "default-node-development",
    "default-node-production",
    "react-server-development",
    "react-server-production"
  ]) {
    const calls = scenarioValue(modeId, "default-dispatcher-public-calls");
    for (const call of Object.values(calls)) {
      assert.equal(call.status, "ok", `${modeId}:${call.label}`);
      assert.deepEqual(call.value, { type: "undefined" }, call.label);
      assert.deepEqual(call.consoleCalls, [], `${modeId}:${call.label}`);
    }
  }
});

test("development warnings are recorded separately from production behavior", () => {
  const development = scenarioValue(
    "default-node-development",
    "argument-validation-warnings"
  );
  assert.equal(development["prefetchDNS-undefined"].consoleCalls.length, 1);
  assert.deepEqual(
    development["prefetchDNS-undefined"].consoleCalls[0].args[0],
    {
      type: "string",
      value:
        "ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead."
    }
  );
  assert.deepEqual(
    development["prefetchDNS-undefined"].consoleCalls[0].args[1],
    {
      type: "string",
      value: "`undefined`"
    }
  );
  assert.equal(
    development["prefetchDNS-extra-crossOrigin"].consoleCalls.length,
    1
  );
  assert.match(
    development["prefetchDNS-extra-crossOrigin"].consoleCalls[0].args[0].value,
    /Expected only one argument/u
  );
  assert.equal(development["preconnect-null-href"].consoleCalls.length, 1);
  assert.equal(development["preload-missing-options"].consoleCalls.length, 1);
  assert.equal(development["preinit-image-as"].consoleCalls.length, 1);
  assert.equal(development["preinitModule-style-as"].consoleCalls.length, 1);

  const production = scenarioValue(
    "default-node-production",
    "argument-validation-warnings"
  );
  for (const call of Object.values(production)) {
    assert.equal(call.status, "ok", call.label);
    assert.deepEqual(call.value, { type: "undefined" }, call.label);
    assert.deepEqual(call.consoleCalls, [], call.label);
  }
});

test("private dispatcher normalization records method names and normalized arguments without claiming public API", () => {
  const normalization = scenarioValue(
    "default-node-production",
    "private-dispatcher-normalization"
  );

  assert.deepEqual(
    dispatcherCallMethods(normalization["prefetchDNS-extra-options"]),
    ["D"]
  );
  assert.deepEqual(
    dispatcherArgValues(normalization["prefetchDNS-extra-options"])[0],
    "https://dns.example.test"
  );

  assert.deepEqual(
    dispatcherArgValues(normalization["preconnect-no-options"]),
    ["https://connect.example.test", null]
  );
  assert.deepEqual(
    dispatcherArgValues(normalization["preconnect-anonymous"]),
    ["https://connect.example.test", ""]
  );
  assert.deepEqual(
    dispatcherArgValues(normalization["preconnect-use-credentials"]),
    ["https://connect.example.test", "use-credentials"]
  );

  const preloadFont = onlyDispatcherCall(
    normalization["preload-font-use-credentials"]
  );
  assert.equal(preloadFont.method, "L");
  assert.deepEqual(preloadFont.args[0], {
    type: "string",
    value: "/font.woff2"
  });
  assert.deepEqual(preloadFont.args[1], { type: "string", value: "font" });
  assert.deepEqual(describedObjectProperty(preloadFont.args[2], "crossOrigin"), {
    type: "string",
    value: ""
  });
  assert.deepEqual(describedObjectProperty(preloadFont.args[2], "nonce"), {
    type: "string",
    value: "nonce-font"
  });

  const preloadModuleWorker = onlyDispatcherCall(
    normalization["preloadModule-worker"]
  );
  assert.equal(preloadModuleWorker.method, "m");
  assert.deepEqual(describedObjectProperty(preloadModuleWorker.args[1], "as"), {
    type: "string",
    value: "worker"
  });
  assert.deepEqual(
    describedObjectProperty(preloadModuleWorker.args[1], "crossOrigin"),
    {
      type: "string",
      value: ""
    }
  );

  const preinitStyle = onlyDispatcherCall(normalization["preinit-style"]);
  assert.equal(preinitStyle.method, "S");
  assert.deepEqual(
    preinitStyle.args.map(simpleDescribedValue).slice(0, 2),
    ["/style.css", "theme"]
  );
  assert.deepEqual(describedObjectProperty(preinitStyle.args[2], "fetchPriority"), {
    type: "string",
    value: "low"
  });

  const preinitScript = onlyDispatcherCall(normalization["preinit-script"]);
  assert.equal(preinitScript.method, "X");
  assert.deepEqual(describedObjectProperty(preinitScript.args[1], "nonce"), {
    type: "string",
    value: "nonce-script"
  });

  assert.deepEqual(
    dispatcherCallMethods(normalization["preinitModule-no-options"]),
    ["M"]
  );
  assert.deepEqual(
    normalization["preinitModule-style-no-dispatch"].dispatcherCalls,
    []
  );
  assert.deepEqual(
    normalization["preload-empty-as"].value,
    { type: "undefined" },
    "dispatcher spy return values must be ignored"
  );
});

test("private dispatcher absence failure shape is captured as internal-only evidence", () => {
  const absence = scenarioValue(
    "default-node-production",
    "private-dispatcher-absence"
  );
  assert.match(absence.caveat, /private internals/u);

  for (const probe of Object.values(absence.missingMethod)) {
    assert.equal(probe.privateDispatcherMutated, true);
    assert.equal(probe.status, "throws", probe.label);
    assert.equal(probe.error.name, "TypeError", probe.label);
    assert.match(probe.error.message, /not a function/u, probe.label);
    assert.deepEqual(probe.dispatcherCalls, [], probe.label);
  }

  assert.equal(absence.nullDispatcher.status, "throws");
  assert.equal(absence.nullDispatcher.error.name, "TypeError");
  assert.match(absence.nullDispatcher.error.message, /Cannot read/u);
});

test("private fake-DOM insertion diagnostics stay separate from public resource hint behavior", () => {
  const dispatcherGate = resourceFormGate.createResourceFormActionInternalsGate({
    requestIdPrefix: "resource-conformance-dispatcher"
  });
  const adapterGate = resourceFormGate.createResourceHintFakeDomAdapterGate({
    requestIdPrefix: "resource-conformance-adapter"
  });
  const insertionGate = resourceFormGate.createResourceHintFakeDomInsertionGate({
    requestIdPrefix: "resource-conformance-insertion"
  });
  const headBoundaryGate =
    resourceFormGate.createResourceHintHeadBoundaryGate({
      requestIdPrefix: "resource-conformance-head-boundary"
    });
  const headClearRetainGate =
    resourceFormGate.createResourceHintHeadClearRetainGate({
      requestIdPrefix: "resource-conformance-head-clear-retain"
    });
  const fakeDom = createDeterministicResourceHintDom();
  const dispatcherRecord = dispatcherGate.recordResourceHintDispatcherRequest(
    "C",
    ["https://connect.example.test", ""]
  );
  const headRecord = dispatcherGate.recordSingletonRequest("head", [
    { title: "blocked-head-singleton-props" }
  ]);
  const adapterAdmission = adapterGate.admitDispatcherRecord(
    dispatcherRecord,
    {
      explicitAdmission: true,
      adapterKind: "deterministic-fake-dom",
      targetKind: "document-head"
    }
  );
  const insertion = insertionGate.insertAdapterAdmissionRecord(
    adapterAdmission,
    {
      explicitInsertion: true,
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const headBoundary = headBoundaryGate.recordInsertionUpdateBoundary(
    insertion,
    headRecord,
    {
      explicitBoundary: true,
      boundaryKind:
        "deterministic-fake-dom-head-singleton-insertion-update",
      targetKind: "document-head",
      hostTag: "head",
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );
  const stylesheet = fakeDom.document.createElement("link");
  stylesheet.setAttribute("rel", "stylesheet");
  stylesheet.setAttribute("data-precedence", "theme");
  fakeDom.head.appendChild(stylesheet);
  const clearRetain = headClearRetainGate.recordHeadClearRetainDiagnostic(
    headBoundary,
    {
      explicitClearRetain: true,
      clearRetainKind: "deterministic-fake-dom-head-clear-retain",
      targetKind: "document-head",
      hostTag: "head",
      fakeDocument: fakeDom.document,
      fakeHead: fakeDom.head
    }
  );

  assert.equal(insertion.contractId, "preconnect");
  assert.equal(
    insertion.insertionStatus,
    resourceFormGate.privateResourceHintFakeDomInsertionStatus
  );
  assert.equal(insertion.sideEffects.fakeResourceElementInserted, true);
  assert.equal(insertion.sideEffects.resourceFetchStarted, false);
  assert.equal(insertion.sideEffects.publicResourceHintDomInsertion, false);
  assert.equal(insertion.sideEffects.compatibilityClaimed, false);
  assert.equal(
    insertion.publicResourceBoundary.publicResourceHintCallsReachable,
    false
  );
  assert.equal(insertion.publicResourceBoundary.realDocumentMutated, false);
  assert.deepEqual(fakeDom.head.childNodes[0].attributes, {
    rel: "preconnect",
    href: "[fast-react-redacted-resource-hint:href]",
    crossOrigin: "",
    "data-fast-react-head-boundary":
      "[fast-react-head-boundary:resource-hint-insertion-update]"
  });
  assert.equal(headBoundary.hostTag, "head");
  assert.equal(headBoundary.sourceHeadRequestType, "host-singleton.head");
  assert.equal(headBoundary.headContractId, "head-singleton");
  assert.equal(
    headBoundary.boundaryStatus,
    resourceFormGate.privateResourceHintHeadBoundaryStatus
  );
  assert.equal(
    headBoundary.executionStatus,
    resourceFormGate.privateResourceHintHeadBoundaryExecutionStatus
  );
  assert.equal(headBoundary.sideEffects.fakeHeadBoundaryInvoked, true);
  assert.equal(headBoundary.sideEffects.fakeHeadInsertionObserved, true);
  assert.equal(headBoundary.sideEffects.fakeHeadUpdateApplied, true);
  assert.equal(headBoundary.sideEffects.singletonsResolved, false);
  assert.equal(headBoundary.sideEffects.headSingletonResolved, false);
  assert.equal(headBoundary.sideEffects.publicHeadSingletonBehavior, false);
  assert.equal(headBoundary.sideEffects.realDocumentMutated, false);
  assert.equal(
    headBoundary.sideEffects.publicResourceHintDomInsertion,
    false
  );
  assert.equal(
    headBoundary.publicHeadBoundary.publicSingletonBehavior,
    false
  );
  assert.equal(
    headBoundary.resourceElementPlan.singletonOwnershipClaimed,
    false
  );
  assert.equal(
    headBoundary.resourceElementPlan.updateAttributeNames[0],
    "data-fast-react-head-boundary"
  );
  assert.equal(
    clearRetain.clearRetainStatus,
    resourceFormGate.privateResourceHintHeadClearRetainStatus
  );
  assert.equal(
    clearRetain.executionStatus,
    resourceFormGate.privateResourceHintHeadClearRetainExecutionStatus
  );
  assert.equal(clearRetain.singletonRows[0].rowType, "host-singleton");
  assert.equal(clearRetain.singletonRows[0].retainedChildCount, 1);
  assert.equal(clearRetain.singletonRows[0].clearableChildCount, 1);
  assert.equal(clearRetain.resourceHintRows[0].rowType, "resource-hint");
  assert.equal(clearRetain.resourceHintRows[0].contractId, "preconnect");
  assert.equal(
    clearRetain.resourceHintRows[0].clearRetainDecision,
    "clear"
  );
  assert.equal(
    clearRetain.resourceHintRows[0].resourceHoistableRetentionBlocked,
    true
  );
  assert.equal(clearRetain.sideEffects.fakeHeadChildrenScanned, true);
  assert.equal(clearRetain.sideEffects.fakeHeadMutated, false);
  assert.equal(clearRetain.sideEffects.headChildrenCleared, false);
  assert.equal(
    clearRetain.stylesheetPrecedenceBoundary.status,
    resourceFormGate.privateResourceHintHeadStylesheetPrecedenceBlockedStatus
  );
  assert.equal(
    clearRetain.stylesheetPrecedenceBoundary.stylesheetPrecedenceRowsObserved,
    true
  );
  assert.deepEqual(
    clearRetain.stylesheetPrecedenceBoundary.blockedCapabilities,
    resourceFormGate.resourceHintHeadStylesheetPrecedenceBlockedCapabilities
  );
  assert.deepEqual(
    clearRetain.blockedCapabilities,
    resourceFormGate.resourceHintHeadClearRetainBlockedCapabilities
  );
  assert.equal(clearRetain.publicHeadBoundary.headChildrenCleared, false);
  assert.equal(clearRetain.publicHeadBoundary.publicSingletonBehavior, false);
  assert.equal(JSON.stringify(insertion).includes("connect.example"), false);
  assert.equal(
    JSON.stringify(headBoundary).includes("connect.example"),
    false
  );
  assert.equal(JSON.stringify(clearRetain).includes("connect.example"), false);
  assert.equal(JSON.stringify(clearRetain).includes("theme"), false);
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-dom-or-server-rendering-resource-effects"
    ),
    true
  );
  assert.equal(oracle.conformanceClaims.compatibilityClaimed, false);
});

test("React DOM resource hint oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactDomResourceHintsOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-resource-hints-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /Users\/user/u);
  assert.doesNotMatch(oracleText, /Developer\/Developer/u);
});

test("print React DOM resource hints oracle CLI emits the checked-in artifact", () => {
  const checkedText = readCheckedReactDomResourceHintsOracleText();
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-resource-hints-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: checkedText.length + 1024
    }
  );

  assert.equal(output, checkedText);
});

function observation(modeId, scenarioId) {
  return findReactDomResourceHintObservation(oracle, modeId, scenarioId);
}

function scenarioValue(modeId, scenarioId) {
  const result = observation(modeId, scenarioId).result;
  assert.equal(result.status, "ok", `${modeId}:${scenarioId}`);
  return result.value;
}

function resourceFunctionLengths(shape) {
  return Object.fromEntries(
    Object.entries(shape.module.exports).map(([key, value]) => [
      key,
      value.descriptor.value.length
    ])
  );
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}

function dispatcherCallMethods(call) {
  return call.dispatcherCalls.map((dispatcherCall) => dispatcherCall.method);
}

function dispatcherArgValues(call) {
  return onlyDispatcherCall(call).args.map(simpleDescribedValue);
}

function onlyDispatcherCall(call) {
  assert.equal(call.status, "ok", call.label);
  assert.deepEqual(call.value, { type: "undefined" }, call.label);
  assert.equal(call.dispatcherCalls.length, 1, call.label);
  return call.dispatcherCalls[0];
}

function simpleDescribedValue(value) {
  if (value.type === "null" || value.type === "undefined") {
    return null;
  }
  return value.value;
}

function describedObjectProperty(objectDescription, key) {
  assert.equal(objectDescription.type, "object");
  const entry = objectDescription.descriptors.find(
    (descriptor) =>
      descriptor.key.type === "string" && descriptor.key.value === key
  );
  assert.ok(entry, `missing object property ${key}`);
  return entry.descriptor.value;
}

function createDeterministicResourceHintDom() {
  const document = {
    __fastReactFakeResourceDocument: true,
    createElement(tagName) {
      return {
        __fastReactFakeResourceElement: true,
        nodeName: tagName.toUpperCase(),
        ownerDocument: document,
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        }
      };
    }
  };
  const head = {
    __fastReactFakeResourceHead: true,
    ownerDocument: document,
    childNodes: [],
    appendChild(child) {
      this.childNodes.push(child);
      child.parentNode = this;
      return child;
    }
  };
  return { document, head };
}
