import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  DOM_ATTRIBUTE_PROPERTY_ORACLE_ARTIFACT_PATH,
  DOM_ATTRIBUTE_PROPERTY_PROBE_MODES,
  DOM_ATTRIBUTE_PROPERTY_SUPPORTING_TARGETS,
  DOM_ATTRIBUTE_PROPERTY_TARGET
} from "../src/dom-attribute-property-targets.mjs";
import { DOM_ATTRIBUTE_PROPERTY_SCENARIOS } from "../src/dom-attribute-property-scenarios.mjs";
import {
  findDomAttributePropertyClientObservation,
  findDomAttributePropertyPhase,
  findDomAttributePropertyServerObservation,
  readCheckedDomAttributePropertyOracle,
  readCheckedDomAttributePropertyOracleText
} from "../src/dom-attribute-property-oracle.mjs";

const oracle = readCheckedDomAttributePropertyOracle();

test("checked DOM attribute/property oracle artifact has the expected schema and targets", () => {
  assert.equal(
    DOM_ATTRIBUTE_PROPERTY_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-dom-attribute-property-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-dom-attribute-property-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per mode, scenario, and probe kind",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, DOM_ATTRIBUTE_PROPERTY_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    DOM_ATTRIBUTE_PROPERTY_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("DOM attribute/property oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomCodeProbed: true,
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

test("DOM attribute/property oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, DOM_ATTRIBUTE_PROPERTY_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, DOM_ATTRIBUTE_PROPERTY_SCENARIOS);

  const coverage = new Set(
    oracle.scenarios.flatMap((scenario) => scenario.coverage)
  );
  for (const requiredCoverage of [
    "common-host-props",
    "booleanish-attributes",
    "custom-attributes",
    "warnings",
    "unknown-props",
    "className",
    "htmlFor",
    "data-props",
    "aria-props",
    "removal-behavior",
    "update-behavior"
  ]) {
    assert.ok(
      coverage.has(requiredCoverage),
      `missing coverage ${requiredCoverage}`
    );
  }

  for (const mode of DOM_ATTRIBUTE_PROPERTY_PROBE_MODES) {
    assert.equal(
      oracle.serverSerializationObservations[mode.id].length,
      DOM_ATTRIBUTE_PROPERTY_SCENARIOS.length
    );
    assert.equal(
      oracle.clientMutationObservations[mode.id].length,
      DOM_ATTRIBUTE_PROPERTY_SCENARIOS.length
    );

    for (const scenario of DOM_ATTRIBUTE_PROPERTY_SCENARIOS) {
      assert.equal(serverObservation(mode.id, scenario.id).scenarioId, scenario.id);
      assert.equal(clientObservation(mode.id, scenario.id).scenarioId, scenario.id);
    }
  }
});

test("server serialization records common aliases, booleanish attributes, data, and aria props", () => {
  assert.equal(
    serverPhase(
      "default-node-development",
      "common-host-props-and-aliases",
      "initial"
    ).result.value,
    '<label id="user-label" class="primary label" for="user-input" title="User name" role="presentation" tabindex="3" dir="ltr">Name</label>'
  );
  assert.equal(
    serverPhase(
      "default-node-development",
      "boolean-and-booleanish-attributes",
      "initial"
    ).result.value,
    '<button disabled="" hidden="" contentEditable="true" spellCheck="false" draggable="true" translate="no">Save</button>'
  );
  assert.equal(
    serverPhase(
      "default-node-development",
      "data-and-aria-attributes",
      "initial"
    ).result.value,
    '<section data-test-id="alpha" data-count="5" data-empty="" aria-hidden="true" aria-label="Alpha section" aria-current="page">Accessible</section>'
  );
  assert.equal(
    serverPhase(
      "default-node-production",
      "custom-element-attribute-property-routing",
      "initial"
    ).result.value,
    '<x-widget id="widget" class="widget-card" foo-bar="dash" fooBar="camel" boolProp="">Widget</x-widget>'
  );
});

test("development warning observations record invalid aria, unknown props, and contentEditable children", () => {
  const booleanishServer = serverPhase(
    "default-node-development",
    "boolean-and-booleanish-attributes",
    "initial"
  );
  assert.deepEqual(consoleMessageStrings(booleanishServer), [
    "A component is `contentEditable` and contains `children` managed by React. It is now your responsibility to guarantee that none of those nodes are unexpectedly modified or duplicated. This is probably not intentional."
  ]);

  const unknownServer = serverPhase(
    "default-node-development",
    "custom-and-unknown-attributes",
    "initial"
  );
  assert.deepEqual(consoleMessageStrings(unknownServer), [
    "Invalid aria prop %s on <%s> tag. For details, see https://react.dev/link/invalid-aria-props",
    "React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element.",
    "React does not recognize the `%s` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `%s` instead. If you accidentally passed it from a parent component, remove it from the DOM element."
  ]);
  assert.deepEqual(
    unknownServer.consoleCalls.flatMap((call) =>
      call.args.slice(1).map((arg) => arg.value)
    ),
    ["`aria-labl`", "div", "unknownProp", "unknownprop", "customAttr", "customattr"]
  );

  for (const scenarioId of [
    "boolean-and-booleanish-attributes",
    "custom-and-unknown-attributes"
  ]) {
    assert.equal(
      serverPhase("default-node-production", scenarioId, "initial").consoleCalls
        .length,
      0
    );
    assert.equal(
      clientPhase("default-node-production", scenarioId, "initial").consoleCalls
        .length,
      0
    );
  }
});

test("client mutation observations record attribute names and final fake DOM state", () => {
  assert.deepEqual(
    firstRenderedElement(
      clientPhase(
        "default-node-development",
        "common-host-props-and-aliases",
        "initial"
      )
    ).attributes,
    [
      ["class", "primary label"],
      ["dir", "ltr"],
      ["for", "user-input"],
      ["id", "user-label"],
      ["role", "presentation"],
      ["tabindex", "3"],
      ["title", "User name"]
    ]
  );
  assert.deepEqual(
    firstRenderedElement(
      clientPhase(
        "default-node-development",
        "boolean-and-booleanish-attributes",
        "initial"
      )
    ).attributes,
    [
      ["contenteditable", "true"],
      ["disabled", ""],
      ["draggable", "true"],
      ["hidden", ""],
      ["spellcheck", "false"],
      ["translate", "no"]
    ]
  );
  assert.deepEqual(
    firstRenderedElement(
      clientPhase("default-node-development", "data-and-aria-attributes", "initial")
    ).attributes,
    [
      ["aria-current", "page"],
      ["aria-hidden", "true"],
      ["aria-label", "Alpha section"],
      ["data-count", "5"],
      ["data-empty", ""],
      ["data-test-id", "alpha"]
    ]
  );
});

test("custom element observations distinguish attribute and property routing", () => {
  const phase = clientPhase(
    "default-node-development",
    "custom-element-attribute-property-routing",
    "initial"
  );
  const element = firstRenderedElement(phase);

  assert.deepEqual(element.attributes, [
    ["classname", "widget-card"],
    ["foo-bar", "dash"],
    ["foobar", "camel"],
    ["id", "widget"]
  ]);
  assert.deepEqual(element.propertyWrites, [
    ["boolProp", { type: "boolean", value: true }],
    ["falseProp", { type: "boolean", value: false }],
    [
      "objectProp",
      {
        type: "object",
        objectTag: "[object Object]",
        isArray: false,
        ownKeys: [{ type: "string", value: "answer" }],
        entries: [["answer", { type: "number", value: 42 }]]
      }
    ]
  ]);
  assert.deepEqual(
    phase.mutations
      .filter((mutation) => mutation.type === "setProperty")
      .map((mutation) => mutation.property),
    ["objectProp", "boolProp", "falseProp"]
  );
});

test("update observations record removals, retained attributes, and text mutation", () => {
  const serverUpdate = serverPhase(
    "default-node-development",
    "attribute-update-and-removal",
    "update"
  );
  assert.equal(
    serverUpdate.result.value,
    '<button id="mutable" title="second" aria-hidden="false">Second</button>'
  );

  const clientUpdate = clientPhase(
    "default-node-development",
    "attribute-update-and-removal",
    "update"
  );
  assert.deepEqual(firstRenderedElement(clientUpdate).attributes, [
    ["aria-hidden", "false"],
    ["id", "mutable"],
    ["title", "second"]
  ]);
  assert.deepEqual(
    clientUpdate.mutations.map((mutation) => mutation.type),
    [
      "removeAttribute",
      "removeAttribute",
      "setAttribute",
      "removeAttribute",
      "setAttribute",
      "removeAttribute",
      "setNodeValue"
    ]
  );
  assert.deepEqual(
    clientUpdate.mutations
      .filter((mutation) => mutation.type === "removeAttribute")
      .map((mutation) => [mutation.name, mutation.hadAttribute]),
    [
      ["class", true],
      ["disabled", true],
      ["data-state", true],
      ["custom-attr", true]
    ]
  );
});

test("DOM attribute/property oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedDomAttributePropertyOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|\/tmp\/|file:\/\/\/|fast-react-dom-attribute-property-oracle-[A-Za-z0-9]|Users\/user|Developer\/Developer/u.test(
      text
    ),
    false
  );
});

test("print DOM attribute/property oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-attribute-property-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedDomAttributePropertyOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedDomAttributePropertyOracleText());
});

function serverObservation(modeId, scenarioId) {
  return findDomAttributePropertyServerObservation(oracle, modeId, scenarioId);
}

function clientObservation(modeId, scenarioId) {
  return findDomAttributePropertyClientObservation(oracle, modeId, scenarioId);
}

function serverPhase(modeId, scenarioId, phaseId) {
  return findDomAttributePropertyPhase(
    serverObservation(modeId, scenarioId),
    phaseId
  );
}

function clientPhase(modeId, scenarioId, phaseId) {
  return findDomAttributePropertyPhase(
    clientObservation(modeId, scenarioId),
    phaseId
  );
}

function firstRenderedElement(phase) {
  assert.equal(phase.result.status, "ok");
  assert.equal(phase.container.children.length, 1);
  return phase.container.children[0];
}

function consoleMessageStrings(phase) {
  return phase.consoleCalls.map((call) => {
    assert.equal(call.method, "error");
    return call.args[0].value;
  });
}
