import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DOM_STYLE_DANGEROUS_HTML_ORACLE_ARTIFACT_PATH,
  DOM_STYLE_DANGEROUS_HTML_PROBE_MODES,
  DOM_STYLE_DANGEROUS_HTML_SUPPORTING_TARGETS,
  DOM_STYLE_DANGEROUS_HTML_TARGET
} from "../src/dom-style-dangerous-html-targets.mjs";
import { DOM_STYLE_DANGEROUS_HTML_SCENARIOS } from "../src/dom-style-dangerous-html-scenarios.mjs";
import {
  findDomStyleDangerousHtmlClientObservation,
  findDomStyleDangerousHtmlPhase,
  findDomStyleDangerousHtmlServerObservation,
  readCheckedDomStyleDangerousHtmlOracle,
  readCheckedDomStyleDangerousHtmlOracleText
} from "../src/dom-style-dangerous-html-oracle.mjs";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  ".."
);
const {
  createDangerousHtmlTextResetDiagnostic
} = require(
  path.join(
    repoRoot,
    "packages",
    "react-dom",
    "src",
    "client",
    "dom-property-operations.js"
  )
);
const propertyPayload = require(
  path.join(
    repoRoot,
    "packages",
    "react-dom",
    "src",
    "dom-host",
    "property-payload.js"
  )
);
const {
  ENTRY_REMOVE_STYLE,
  ENTRY_SET_STYLE,
  PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_COMPATIBILITY_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_MUTATION_STATUS,
  recordPrivateDomStyleObjectDiffDiagnostics
} = propertyPayload;

const oracle = readCheckedDomStyleDangerousHtmlOracle();

test("checked DOM style/dangerouslySetInnerHTML oracle artifact has the expected schema and targets", () => {
  assert.equal(
    DOM_STYLE_DANGEROUS_HTML_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-dom-style-dangerous-html-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-dom-style-dangerous-html-oracle"
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

  assert.deepEqual(oracle.reactDomTarget, DOM_STYLE_DANGEROUS_HTML_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    DOM_STYLE_DANGEROUS_HTML_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("DOM style/dangerouslySetInnerHTML oracle keeps Fast React compatibility claims false", () => {
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

test("DOM style/dangerouslySetInnerHTML oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, DOM_STYLE_DANGEROUS_HTML_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, DOM_STYLE_DANGEROUS_HTML_SCENARIOS);

  const coverage = new Set(
    oracle.scenarios.flatMap((scenario) => scenario.coverage)
  );
  for (const requiredCoverage of [
    "style-serialization",
    "numeric-unit-behavior",
    "unitless-numeric-styles",
    "css-custom-properties",
    "style-update-behavior",
    "style-removal",
    "invalid-style-warnings",
    "style-shape-validation",
    "dangerously-set-inner-html-serialization",
    "dangerously-set-inner-html-update-behavior",
    "dangerously-set-inner-html-removal",
    "inner-html-shape-validation",
    "children-conflict-validation",
    "update-behavior"
  ]) {
    assert.ok(
      coverage.has(requiredCoverage),
      `missing coverage ${requiredCoverage}`
    );
  }

  for (const mode of DOM_STYLE_DANGEROUS_HTML_PROBE_MODES) {
    assert.equal(
      oracle.serverSerializationObservations[mode.id].length,
      DOM_STYLE_DANGEROUS_HTML_SCENARIOS.length
    );
    assert.equal(
      oracle.clientMutationObservations[mode.id].length,
      DOM_STYLE_DANGEROUS_HTML_SCENARIOS.length
    );

    for (const scenario of DOM_STYLE_DANGEROUS_HTML_SCENARIOS) {
      assert.equal(serverObservation(mode.id, scenario.id).scenarioId, scenario.id);
      assert.equal(clientObservation(mode.id, scenario.id).scenarioId, scenario.id);
    }
  }
});

test("server serialization records style units, custom properties, and raw innerHTML", () => {
  assert.equal(
    serverPhase(
      "default-node-development",
      "style-serialization-numeric-units-and-custom-properties",
      "initial"
    ).result.value,
    '<div style="color:red;margin-top:4px;opacity:0.5;flex:1;line-height:1.2;z-index:2;-webkit-line-clamp:2;-ms-transition:all 1s;--gap:4px;--count:3;background-image:url(&quot;x&amp;y&quot;)">Styled</div>'
  );
  assert.equal(
    serverPhase(
      "default-node-development",
      "style-update-and-removal",
      "update"
    ).result.value,
    '<div style="margin-top:0;background-color:blue">Styled after</div>'
  );
  assert.equal(
    serverPhase(
      "default-node-development",
      "dangerously-set-inner-html-serialization",
      "initial"
    ).result.value,
    '<div><span data-x="1">Raw &amp; safe</span></div>'
  );
  assert.equal(
    serverPhase(
      "default-node-development",
      "dangerously-set-inner-html-null-html",
      "initial"
    ).result.value,
    "<div></div>"
  );
});

test("development warning observations record invalid style diagnostics", () => {
  const invalidServer = serverPhase(
    "default-node-development",
    "invalid-style-development-warnings",
    "initial"
  );
  assert.deepEqual(consoleMessageStrings(invalidServer), [
    "`NaN` is an invalid value for the `%s` css style property.",
    "`Infinity` is an invalid value for the `%s` css style property.",
    "Unsupported style property %s. Did you mean %s?"
  ]);
  assert.deepEqual(
    invalidServer.consoleCalls.flatMap((call) =>
      call.args.slice(1).map((arg) => arg.value)
    ),
    ["width", "height", "background-color", "backgroundColor"]
  );

  assert.equal(
    serverPhase(
      "default-node-production",
      "invalid-style-development-warnings",
      "initial"
    ).consoleCalls.length,
    0
  );
  assert.equal(
    clientPhase(
      "default-node-production",
      "invalid-style-development-warnings",
      "initial"
    ).consoleCalls.length,
    0
  );
});

test("client mutation observations record style assignment, update, and removal behavior", () => {
  const initialElement = firstRenderedElement(
    clientPhase(
      "default-node-development",
      "style-serialization-numeric-units-and-custom-properties",
      "initial"
    )
  );
  assert.deepEqual(initialElement.activeStyleProperties, [
    ["--count", "3"],
    ["--gap", "4px"],
    ["backgroundImage", 'url("x&y")'],
    ["color", "red"],
    ["flex", "1"],
    ["lineHeight", "1.2"],
    ["marginTop", "4px"],
    ["msTransition", "all 1s"],
    ["opacity", "0.5"],
    ["WebkitLineClamp", "2"],
    ["zIndex", "2"]
  ]);

  const updatePhase = clientPhase(
    "default-node-development",
    "style-update-and-removal",
    "update"
  );
  assert.deepEqual(firstRenderedElement(updatePhase).activeStyleProperties, [
    ["backgroundColor", "blue"],
    ["marginTop", "0"]
  ]);
  assert.deepEqual(
    updatePhase.mutations
      .filter((mutation) => mutation.type.startsWith("style"))
      .map((mutation) => [
        mutation.type,
        mutation.property ?? mutation.name,
        mutation.value
      ]),
    [
      ["stylePropertyAssignment", "flex", ""],
      ["styleSetProperty", "--count", ""],
      ["stylePropertyAssignment", "borderWidth", ""],
      ["stylePropertyAssignment", "paddingLeft", ""],
      ["stylePropertyAssignment", "color", ""],
      ["stylePropertyAssignment", "marginTop", "0"],
      ["stylePropertyAssignment", "opacity", ""],
      ["styleSetProperty", "--gap", ""],
      ["stylePropertyAssignment", "backgroundColor", "blue"]
    ]
  );
});

test("private style object diff diagnostics mirror oracle style rows without DOM mutation", () => {
  const diagnostic = recordPrivateDomStyleObjectDiffDiagnostics(
    orderedProps([
      ["color", "red"],
      ["marginTop", 4],
      ["opacity", 0.5],
      ["flex", 1],
      ["--gap", "4px"],
      ["--count", 3],
      ["backgroundColor", "yellow"],
      ["borderWidth", 2],
      ["paddingLeft", "1em"]
    ]),
    orderedProps([
      ["color", null],
      ["marginTop", 0],
      ["opacity", null],
      ["--gap", null],
      ["backgroundColor", "blue"]
    ])
  );
  const updatePhase = clientPhase(
    "default-node-development",
    "style-update-and-removal",
    "update"
  );

  assert.equal(diagnostic.status, PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_STATUS);
  assert.deepEqual(diagnostic.summary, {
    rowCount: 9,
    payloadRowCount: 9,
    setStyleCount: 2,
    removeStyleCount: 7,
    additionRowCount: 0,
    changeRowCount: 2,
    removalRowCount: 7,
    unsupportedRowCount: 0,
    unitlessRowCount: 2,
    unitlessSetRowCount: 0,
    customPropertyRowCount: 2,
    numericWithoutPxRowCount: 1,
    pxAppendedRowCount: 0,
    zeroNumericRowCount: 1,
    propertyAssignmentCount: 7,
    setPropertyCount: 2,
    mutatingRowCount: 0,
    realDomNodeMutated: false,
    browserDomMutation: false,
    fakeDomMutation: false,
    compatibilityClaimed: false,
    publicMutationBlocked: true,
    rowKinds: [ENTRY_REMOVE_STYLE, ENTRY_SET_STYLE]
  });
  assert.deepEqual(
    diagnostic.payloadRows.map((row) => [
      styleMutationType(row),
      row.styleName,
      row.value
    ]),
    updatePhase.mutations
      .filter((mutation) => mutation.type.startsWith("style"))
      .map((mutation) => [
        mutation.type,
        mutation.property ?? mutation.name,
        mutation.value
      ])
  );
  assert.deepEqual(
    diagnostic.styleObjectDiffRows.map((row) => [
      row.styleName,
      row.action,
      row.removalReason,
      row.unitless,
      row.customProperty,
      row.pxAppended,
      row.realDomNodeMutated,
      row.compatibilityClaimed
    ]),
    [
      [
        "flex",
        "remove",
        "omitted-next-style-property",
        true,
        false,
        false,
        false,
        false
      ],
      [
        "--count",
        "remove",
        "omitted-next-style-property",
        false,
        true,
        false,
        false,
        false
      ],
      [
        "borderWidth",
        "remove",
        "omitted-next-style-property",
        false,
        false,
        false,
        false,
        false
      ],
      [
        "paddingLeft",
        "remove",
        "omitted-next-style-property",
        false,
        false,
        false,
        false,
        false
      ],
      [
        "color",
        "remove",
        "nullish-empty-or-boolean-next-value",
        false,
        false,
        false,
        false,
        false
      ],
      ["marginTop", "change", null, false, false, false, false, false],
      [
        "opacity",
        "remove",
        "nullish-empty-or-boolean-next-value",
        true,
        false,
        false,
        false,
        false
      ],
      [
        "--gap",
        "remove",
        "nullish-empty-or-boolean-next-value",
        false,
        true,
        false,
        false,
        false
      ],
      ["backgroundColor", "change", null, false, false, false, false, false]
    ]
  );
  assert.deepEqual(diagnostic.blockedPublicMutation, {
    status: PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_MUTATION_STATUS,
    realDomNodeRequired: false,
    browserDomMutation: false,
    fakeDomMutation: false,
    styleObjectMutated: false,
    propertyAssignmentInvoked: false,
    setPropertyInvoked: false
  });
  assert.equal(
    diagnostic.blockedPublicCompatibility.status,
    PRIVATE_STYLE_OBJECT_DIFF_PUBLIC_COMPATIBILITY_STATUS
  );
  assert.equal(diagnostic.sideEffects.browserDomMutation, false);
  assert.equal(diagnostic.sideEffects.propertyAssignmentInvoked, false);
  assert.equal(diagnostic.sideEffects.setPropertyInvoked, false);
  assert.equal(diagnostic.sideEffects.compatibilityClaimed, false);
});

test("client mutation observations record dangerouslySetInnerHTML update and removal", () => {
  const initialElement = firstRenderedElement(
    clientPhase(
      "default-node-development",
      "dangerously-set-inner-html-update-and-removal",
      "initial"
    )
  );
  assert.equal(initialElement.assignedInnerHTML, "<span>Before</span>");
  assert.deepEqual(initialElement.children, []);

  const updateElement = firstRenderedElement(
    clientPhase(
      "default-node-development",
      "dangerously-set-inner-html-update-and-removal",
      "update"
    )
  );
  assert.equal(updateElement.assignedInnerHTML, "<em>After</em>");
  assert.deepEqual(updateElement.children, []);

  const removeElement = firstRenderedElement(
    clientPhase(
      "default-node-development",
      "dangerously-set-inner-html-update-and-removal",
      "remove"
    )
  );
  assert.equal(removeElement.assignedInnerHTML, null);
  assert.deepEqual(removeElement.children, [
    {
      nodeType: 3,
      nodeName: "#text",
      text: "Managed child"
    }
  ]);
});

test("private dangerous HTML/text reset diagnostics keep oracle HTML transitions blocked", () => {
  const updatePhase = clientPhase(
    "default-node-development",
    "dangerously-set-inner-html-update-and-removal",
    "update"
  );
  const removePhase = clientPhase(
    "default-node-development",
    "dangerously-set-inner-html-update-and-removal",
    "remove"
  );
  const updateDiagnostic = createDangerousHtmlTextResetDiagnostic(
    "div",
    {
      dangerouslySetInnerHTML: { __html: "<span>Before</span>" }
    },
    {
      dangerouslySetInnerHTML: { __html: "<em>After</em>" }
    }
  );
  const removeDiagnostic = createDangerousHtmlTextResetDiagnostic(
    "div",
    {
      dangerouslySetInnerHTML: { __html: "<em>After</em>" }
    },
    {
      dangerouslySetInnerHTML: undefined,
      children: "Managed child"
    }
  );

  assert.equal(updateDiagnostic.previousHtml, "<span>Before</span>");
  assert.equal(updateDiagnostic.nextHtml, "<em>After</em>");
  assert.equal(updateDiagnostic.resetDecision.shouldResetTextContent, false);
  assert.deepEqual(
    updateDiagnostic.blockedMutationRows.map(blockedRowSummary),
    updatePhase.mutations
      .filter((mutation) => mutation.type === "setInnerHTML")
      .map((mutation) => ({
        mutation: "innerHTML",
        value: mutation.value,
        status: "blocked",
        realDomMutation: false,
        compatibilityClaimed: false
      }))
  );

  assert.equal(removeDiagnostic.previousHtml, "<em>After</em>");
  assert.equal(removeDiagnostic.nextText, "Managed child");
  assert.equal(removeDiagnostic.nextHtml, null);
  assert.equal(removeDiagnostic.resetDecision.shouldResetTextContent, false);
  assert.deepEqual(
    removeDiagnostic.blockedMutationRows.map(blockedRowSummary),
    removePhase.mutations
      .filter((mutation) => mutation.type === "setTextContent")
      .map((mutation) => ({
        mutation: "textContent",
        value: mutation.value,
        status: "blocked",
        realDomMutation: false,
        compatibilityClaimed: false
      }))
  );

  for (const diagnostic of [updateDiagnostic, removeDiagnostic]) {
    assert.equal(diagnostic.sideEffects.realDomInnerHTMLWritten, false);
    assert.equal(diagnostic.sideEffects.publicCompatibilityEnabled, false);
    assert.equal(diagnostic.compatibilityClaimed, false);
  }
});

test("shape validation records server throws and client root errors", () => {
  const styleServer = serverPhase(
    "default-node-development",
    "style-prop-shape-validation",
    "initial"
  );
  assert.equal(styleServer.result.status, "throws");
  assert.equal(
    styleServer.result.error.message,
    "The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX."
  );

  const htmlShapeServer = serverPhase(
    "default-node-development",
    "dangerously-set-inner-html-shape-validation-missing-html",
    "initial"
  );
  assert.equal(htmlShapeServer.result.status, "throws");
  assert.equal(
    htmlShapeServer.result.error.message,
    "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://react.dev/link/dangerously-set-inner-html for more information."
  );

  const childrenConflictServer = serverPhase(
    "default-node-development",
    "dangerously-set-inner-html-children-conflict",
    "initial"
  );
  assert.equal(childrenConflictServer.result.status, "throws");
  assert.equal(
    childrenConflictServer.result.error.message,
    "Can only set one of `children` or `props.dangerouslySetInnerHTML`."
  );

  assert.equal(
    firstRootError(
      clientPhase(
        "default-node-development",
        "style-prop-shape-validation",
        "initial"
      )
    ).error.message,
    styleServer.result.error.message
  );
  assert.equal(
    firstRootError(
      clientPhase(
        "default-node-development",
        "dangerously-set-inner-html-shape-validation-string",
        "initial"
      )
    ).error.message,
    htmlShapeServer.result.error.message
  );
  assert.equal(
    firstRootError(
      clientPhase(
        "default-node-development",
        "dangerously-set-inner-html-children-conflict",
        "initial"
      )
    ).error.message,
    childrenConflictServer.result.error.message
  );
});

test("DOM style/dangerouslySetInnerHTML oracle artifact has no temp or local path leaks", () => {
  const text = readCheckedDomStyleDangerousHtmlOracleText();
  assert.equal(
    /\/private\/var|\/var\/folders|\/tmp\/|file:\/\/\/|fast-react-dom-style-dangerous-html-oracle-[A-Za-z0-9]|Users\/user|Developer\/Developer/u.test(
      text
    ),
    false
  );
});

test("print DOM style/dangerouslySetInnerHTML oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-style-dangerous-html-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: readCheckedDomStyleDangerousHtmlOracleText().length + 1024
    }
  );

  assert.equal(output, readCheckedDomStyleDangerousHtmlOracleText());
});

function serverObservation(modeId, scenarioId) {
  return findDomStyleDangerousHtmlServerObservation(oracle, modeId, scenarioId);
}

function clientObservation(modeId, scenarioId) {
  return findDomStyleDangerousHtmlClientObservation(oracle, modeId, scenarioId);
}

function serverPhase(modeId, scenarioId, phaseId) {
  return findDomStyleDangerousHtmlPhase(
    serverObservation(modeId, scenarioId),
    phaseId
  );
}

function clientPhase(modeId, scenarioId, phaseId) {
  return findDomStyleDangerousHtmlPhase(
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

function consoleMessageStrings(phase) {
  return phase.consoleCalls.map((call) => {
    assert.equal(call.method, "error");
    return call.args[0].value;
  });
}

function orderedProps(entries) {
  const props = {};
  for (const [key, value] of entries) {
    props[key] = value;
  }
  return props;
}

function styleMutationType(row) {
  if (row.mutation === "setProperty") {
    return "styleSetProperty";
  }
  return "stylePropertyAssignment";
}

function blockedRowSummary(row) {
  return {
    mutation: row.mutation,
    value: row.value,
    status: row.status,
    realDomMutation: row.realDomMutation,
    compatibilityClaimed: row.compatibilityClaimed
  };
}
