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
const rootBridge = require(
  path.join(repoRoot, "packages", "react-dom", "src", "client", "root-bridge.js")
);
const componentTree = require(
  path.join(
    repoRoot,
    "packages",
    "react-dom",
    "src",
    "client",
    "component-tree.js"
  )
);
const domHost = require(
  path.join(repoRoot, "packages", "react-dom", "src", "dom-host", "mutation.js")
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
  ENTRY_SET_INNER_HTML,
  ENTRY_SET_STYLE,
  PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_METADATA_KIND,
  PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_DIAGNOSTIC_STATUS,
  PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_METADATA_KIND,
  PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_STATUS,
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

test("private root fake-DOM commit metadata accepts oracle style rows without public compatibility", () => {
  const previousStyle = orderedProps([
    ["color", "red"],
    ["marginTop", 4],
    ["opacity", 0.5],
    ["flex", 1],
    ["--gap", "4px"],
    ["--count", 3],
    ["backgroundColor", "yellow"],
    ["borderWidth", 2],
    ["paddingLeft", "1em"]
  ]);
  const nextStyle = orderedProps([
    ["color", null],
    ["marginTop", 0],
    ["opacity", null],
    ["--gap", null],
    ["backgroundColor", "blue"]
  ]);
  const diagnostic = recordPrivateDomStyleObjectDiffDiagnostics(
    previousStyle,
    nextStyle
  );
  const fixture = createStyleCommitBridgeFixture(previousStyle);
  const nextProps = {
    style: nextStyle,
    children: "Styled"
  };
  const update = fixture.bridge.renderContainer(fixture.create.handle, {
    props: nextProps,
    type: "div"
  });
  const updatePhase = clientPhase(
    "default-node-development",
    "style-update-and-removal",
    "update"
  );

  fixture.host.styleLog = [];

  const handoff = fixture.bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: fixture.token,
    nextProps,
    tag: "div"
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);
  const styleCommit = hiddenHandoff.styleObjectDiffCommit;

  assert.equal(
    styleCommit.publicMetadata.kind,
    PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_METADATA_KIND
  );
  assert.equal(
    styleCommit.publicMetadata.status,
    PRIVATE_STYLE_OBJECT_DIFF_FAKE_DOM_COMMIT_STATUS
  );
  assert.equal(styleCommit.publicMetadata.payloadRowsAccepted, true);
  assert.equal(styleCommit.publicMetadata.fakeDomMutation, true);
  assert.equal(styleCommit.publicMetadata.browserDomMutation, false);
  assert.equal(styleCommit.publicMetadata.publicRootCompatibility, false);
  assert.equal(styleCommit.publicMetadata.publicStyleCompatibility, false);
  assert.equal(styleCommit.publicMetadata.compatibilityClaimed, false);
  assert.deepEqual(
    styleCommit.payloadRows.map((row) => [
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
  assert.deepEqual(styleCommit.payloadRows, diagnostic.payloadRows);
  assert.deepEqual(styleCommit.mutationRecords, diagnostic.payloadRows);
  assert.equal(styleCommit.diagnostic.sideEffects.fakeDomMutation, false);
  assert.equal(styleCommit.diagnostic.sideEffects.browserDomMutation, false);
  assert.equal(styleCommit.diagnostic.sideEffects.compatibilityClaimed, false);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.publicRootCreated, false);
  assert.equal(handoff.publicRootObjectExposed, false);
  assert.equal(handoff.compatibilityClaimed, false);

  cleanupStyleCommitBridgeFixture(fixture);
});

test("private root update applies oracle style and dangerous HTML rows without public compatibility", () => {
  const previousStyle = orderedProps([
    ["color", "red"],
    ["marginTop", 4],
    ["opacity", 0.5],
    ["flex", 1],
    ["--gap", "4px"],
    ["--count", 3],
    ["backgroundColor", "yellow"],
    ["borderWidth", 2],
    ["paddingLeft", "1em"]
  ]);
  const nextStyle = orderedProps([
    ["color", null],
    ["marginTop", 0],
    ["opacity", null],
    ["--gap", null],
    ["backgroundColor", "blue"]
  ]);
  const previousProps = {
    style: previousStyle,
    dangerouslySetInnerHTML: { __html: "<span>Before</span>" }
  };
  const nextProps = {
    style: nextStyle,
    dangerouslySetInnerHTML: { __html: "<em>After</em>" }
  };
  const fixture = createStyleDangerousHtmlUpdateBridgeFixture(previousProps);
  const update = fixture.bridge.renderContainer(fixture.create.handle, {
    props: nextProps,
    type: "div"
  });
  const styleUpdatePhase = clientPhase(
    "default-node-development",
    "style-update-and-removal",
    "update"
  );
  const htmlUpdatePhase = clientPhase(
    "default-node-development",
    "dangerously-set-inner-html-update-and-removal",
    "update"
  );

  fixture.host.styleLog = [];
  fixture.host.dangerousWriteLog = [];

  const handoff = fixture.bridge.applyHostOutputUpdate(update, {
    hostInstanceToken: fixture.token,
    nextProps,
    tag: "div"
  });
  const hiddenHandoff =
    rootBridge.getPrivateRootHostOutputUpdateHandoffPayload(handoff);
  const dangerousHtmlCommit = hiddenHandoff.dangerousHtmlUpdateCommit;

  assert.equal(handoff.latestPropsPublished, true);
  assert.equal(handoff.browserDomMutation, false);
  assert.equal(handoff.publicRootObjectExposed, false);
  assert.equal(handoff.compatibilityClaimed, false);
  assert.equal(
    hiddenHandoff.styleObjectDiffCommit.publicMetadata.fakeDomMutation,
    true
  );
  assert.equal(
    dangerousHtmlCommit.publicMetadata.kind,
    PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_METADATA_KIND
  );
  assert.equal(
    dangerousHtmlCommit.publicMetadata.status,
    PRIVATE_DANGEROUS_HTML_UPDATE_FAKE_DOM_COMMIT_STATUS
  );
  assert.equal(dangerousHtmlCommit.publicMetadata.payloadRowsAccepted, true);
  assert.equal(dangerousHtmlCommit.publicMetadata.fakeDomMutation, true);
  assert.equal(
    dangerousHtmlCommit.publicMetadata.fakeDomInnerHTMLWritten,
    true
  );
  assert.equal(
    dangerousHtmlCommit.publicMetadata.realDomInnerHTMLWritten,
    false
  );
  assert.equal(dangerousHtmlCommit.publicMetadata.browserDomMutation, false);
  assert.equal(
    dangerousHtmlCommit.publicMetadata.publicRootCompatibility,
    false
  );
  assert.equal(dangerousHtmlCommit.publicMetadata.compatibilityClaimed, false);
  assert.deepEqual(
    hiddenHandoff.styleObjectDiffCommit.payloadRows.map((row) => [
      styleMutationType(row),
      row.styleName,
      row.value
    ]),
    styleUpdatePhase.mutations
      .filter((mutation) => mutation.type.startsWith("style"))
      .map((mutation) => [
        mutation.type,
        mutation.property ?? mutation.name,
        mutation.value
      ])
  );
  assert.deepEqual(dangerousHtmlCommit.payloadRows, [
    {
      kind: ENTRY_SET_INNER_HTML,
      propName: "dangerouslySetInnerHTML",
      propertyName: "innerHTML",
      value: "<em>After</em>"
    }
  ]);
  assert.deepEqual(
    fixture.host.dangerousWriteLog,
    htmlUpdatePhase.mutations
      .filter((mutation) => mutation.type === "setInnerHTML")
      .map((mutation) => ["setInnerHTML", mutation.value])
  );
  assert.equal(fixture.host.innerHTML, "<em>After</em>");
  assert.deepEqual(
    activeStyleProperties(fixture.host),
    firstRenderedElement(styleUpdatePhase).activeStyleProperties
  );
  assert.equal(
    componentTree.getLatestPropsFromHostInstanceToken(fixture.token),
    nextProps
  );

  const serialized = JSON.stringify(handoff);
  assert.equal(serialized.includes("<span>Before</span>"), false);
  assert.equal(serialized.includes("<em>After</em>"), false);
  cleanupStyleDangerousHtmlUpdateBridgeFixture(fixture);
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

test("private dangerous HTML fake-DOM commit metadata mirrors oracle transitions without DOM writes", () => {
  const updatePreviousProps = {
    dangerouslySetInnerHTML: { __html: "<span>Before</span>" }
  };
  const updateNextProps = {
    dangerouslySetInnerHTML: { __html: "<em>After</em>" }
  };
  const removePreviousProps = {
    dangerouslySetInnerHTML: { __html: "<em>After</em>" }
  };
  const removeNextProps = {
    dangerouslySetInnerHTML: undefined,
    children: "Managed child"
  };

  const updateHandoff = recordDangerousHtmlOracleCommit(
    "oracle-inner-html-update",
    updatePreviousProps,
    updateNextProps
  );
  const removeHandoff = recordDangerousHtmlOracleCommit(
    "oracle-html-to-text",
    removePreviousProps,
    removeNextProps
  );

  assert.deepEqual(
    updateHandoff.fakeDomCommitRows.map((row) => row.commitRowKind),
    ["dangerous-html-set-inner-html"]
  );
  assert.deepEqual(
    removeHandoff.fakeDomCommitRows.map((row) => row.commitRowKind),
    ["dangerous-html-to-managed-text-set-text-content"]
  );

  for (const handoff of [updateHandoff, removeHandoff]) {
    assert.equal(handoff.fakeDomMutation, false);
    assert.equal(handoff.browserDomMutation, false);
    assert.equal(handoff.realDomInnerHTMLWritten, false);
    assert.equal(handoff.realDomTextContentWritten, false);
    assert.equal(handoff.latestPropsPublished, false);
    assert.equal(handoff.publicRootObjectExposed, false);
    assert.equal(handoff.compatibilityClaimed, false);
    assert.equal(
      handoff.handoffStatus,
      rootBridge
        .ROOT_BRIDGE_DANGEROUS_HTML_TEXT_RESET_COMMIT_METADATA_ACCEPTED
    );
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

function recordDangerousHtmlOracleCommit(label, previousProps, nextProps) {
  const document = new DangerousHtmlOracleDocument(label);
  const container = document.createElement("div");
  const bridge = rootBridge.createPrivateRootBridgeShell({
    dangerousHtmlTextResetCommitMetadataIdPrefix: `${label}-commit`,
    sideEffectIdPrefix: `${label}-side-effect`
  });
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialRender = bridge.renderContainer(create.handle, {
    props: { children: "initial" },
    type: "div"
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);

  const host = document.createElement("div");
  const token = componentTree.createHostInstanceToken(
    { kind: "DangerousHtmlOracleHost" },
    create.owner
  );
  componentTree.attachHostInstanceNode(host, token, previousProps);
  const update = bridge.renderContainer(create.handle, {
    props: nextProps,
    type: "div"
  });
  const diagnostic = createDangerousHtmlTextResetDiagnostic(
    "div",
    previousProps,
    nextProps
  );

  try {
    const handoff = bridge.recordDangerousHtmlTextResetCommitMetadata(
      update,
      createDangerousHtmlOracleRootCommitMetadata(),
      diagnostic,
      {
        hostInstanceToken: token,
        nextProps,
        stateNodeRaw: 901,
        tag: "div"
      }
    );
    assert.deepEqual(host.dangerousWriteLog, []);
    assert.equal(
      componentTree.getLatestPropsFromHostInstanceToken(token),
      previousProps
    );
    return handoff;
  } finally {
    componentTree.detachHostInstanceToken(token);
    bridge.revertCreateRootSideEffects(sideEffects);
  }
}

function createDangerousHtmlOracleRootCommitMetadata() {
  return {
    mutationApplyRecords: [
      {
        kind: "commit-host-component-update",
        tag: "HostComponent",
        source: {
          kind: "Update"
        },
        parentTag: "HostRoot",
        stateNodeRaw: 901,
        pendingPropsRaw: 3003,
        memoizedPropsRaw: 3003,
        alternateMemoizedPropsRaw: 3001
      }
    ]
  };
}

class DangerousHtmlOracleEventTarget {
  constructor(fields) {
    Object.assign(this, fields);
    this.__mutationLog = [];
    this.__registrations = [];
    this.__removals = [];
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({ listener, options, type });
  }

  removeEventListener(type, listener, options) {
    this.__removals.push({ listener, options, type });
  }
}

class DangerousHtmlOracleDocument extends DangerousHtmlOracleEventTarget {
  constructor(label) {
    super({
      label,
      nodeName: "#document",
      nodeType: 9
    });
    this.ownerDocument = this;
    this.defaultView = new DangerousHtmlOracleEventTarget({
      label: `${label}-window`
    });
  }

  createElement(nodeName) {
    return new DangerousHtmlOracleElement(String(nodeName), this);
  }
}

class DangerousHtmlOracleElement extends DangerousHtmlOracleEventTarget {
  constructor(nodeName, ownerDocument) {
    super({
      nodeName: nodeName.toUpperCase(),
      nodeType: 1,
      ownerDocument
    });
    this.childNodes = [];
    this.parentNode = null;
    this.dangerousWriteLog = [];
    this._innerHTML = "";
    this._textContent = "";
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this.dangerousWriteLog.push(["innerHTML", String(value)]);
    throw new Error("innerHTML writes must remain blocked");
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this.dangerousWriteLog.push(["textContent", String(value)]);
    throw new Error("textContent writes must remain blocked");
  }
}

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

function createStyleCommitBridgeFixture(initialStyle) {
  const document = new StyleCommitBridgeDocument("style-commit-conformance");
  const container = document.createElement("div");
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialProps = {
    style: initialStyle,
    children: "Styled"
  };
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: "div"
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);

  const host = document.createElement("div");
  const token = componentTree.createHostInstanceToken(
    { kind: "StyleCommitBridgeHost" },
    create.owner
  );
  componentTree.attachHostInstanceNode(host, token, {});
  const propsHandoff = domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "div",
    {},
    initialProps
  );
  componentTree.commitLatestPropsFromMutationHandoff(propsHandoff);

  return {
    bridge,
    create,
    host,
    sideEffects,
    token
  };
}

function cleanupStyleCommitBridgeFixture(fixture) {
  componentTree.detachHostInstanceToken(fixture.token);
  fixture.bridge.revertCreateRootSideEffects(fixture.sideEffects);
}

function createStyleDangerousHtmlUpdateBridgeFixture(initialProps) {
  const document = new StyleCommitBridgeDocument(
    "style-dangerous-html-update-conformance"
  );
  const container = document.createElement("div");
  const bridge = rootBridge.createPrivateRootBridgeShell();
  const create = bridge.createClientRoot(container);
  const sideEffects = bridge.applyCreateRootSideEffects(create);
  const initialRender = bridge.renderContainer(create.handle, {
    props: initialProps,
    type: "div"
  });
  bridge.admitCreateRenderPath(create, sideEffects, initialRender);

  const host = document.createElement("div");
  const token = componentTree.createHostInstanceToken(
    { kind: "StyleDangerousHtmlUpdateBridgeHost" },
    create.owner
  );
  componentTree.attachHostInstanceNode(host, token, {});
  const propsHandoff = domHost.commitDomPropertyUpdateForLatestProps(
    host,
    "div",
    {},
    initialProps
  );
  componentTree.commitLatestPropsFromMutationHandoff(propsHandoff);

  return {
    bridge,
    create,
    host,
    sideEffects,
    token
  };
}

function cleanupStyleDangerousHtmlUpdateBridgeFixture(fixture) {
  componentTree.detachHostInstanceToken(fixture.token);
  fixture.bridge.revertCreateRootSideEffects(fixture.sideEffects);
}

function activeStyleProperties(element) {
  return Array.from(element.style.properties.entries())
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right));
}

class StyleCommitBridgeEventTarget {
  constructor(fields) {
    Object.assign(this, fields);
    this.__registrations = [];
  }

  addEventListener(type, listener, options) {
    this.__registrations.push({ listener, options, type });
  }

  removeEventListener(type, listener, options) {
    const index = this.__registrations.findIndex(
      (entry) =>
        entry.type === type &&
        entry.listener === listener &&
        entry.options === options
    );
    if (index !== -1) {
      this.__registrations.splice(index, 1);
    }
  }
}

class StyleCommitBridgeDocument extends StyleCommitBridgeEventTarget {
  constructor(label) {
    super({
      label,
      nodeName: "#document",
      nodeType: 9
    });
    this.ownerDocument = this;
    this.defaultView = new StyleCommitBridgeEventTarget({
      label: `${label}-window`
    });
  }

  createElement(nodeName) {
    return new StyleCommitBridgeElement(String(nodeName), this);
  }
}

class StyleCommitBridgeElement extends StyleCommitBridgeEventTarget {
  constructor(nodeName, ownerDocument) {
    super({
      nodeName,
      nodeType: 1,
      ownerDocument
    });
    this.childNodes = [];
    this.dangerousWriteLog = [];
    this._innerHTML = "";
    this.styleLog = [];
    this.style = new StyleCommitBridgeStyle(this);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    const stringValue = String(value);
    this.childNodes = [];
    this._innerHTML = stringValue;
    this.dangerousWriteLog.push(["setInnerHTML", stringValue]);
  }
}

class StyleCommitBridgeStyle {
  constructor(ownerElement) {
    this.ownerElement = ownerElement;
    this.properties = new Map();

    return new Proxy(this, {
      set(target, property, value, receiver) {
        if (typeof property === "string" && property !== "ownerElement") {
          const stringValue = String(value);
          target.properties.set(property, stringValue);
          target.ownerElement.styleLog.push([
            "stylePropertyAssignment",
            property,
            stringValue
          ]);
        }
        return Reflect.set(target, property, value, receiver);
      }
    });
  }

  setProperty(name, value) {
    const propertyName = String(name);
    const stringValue = String(value);
    this.properties.set(propertyName, stringValue);
    this.ownerElement.styleLog.push([
      "styleSetProperty",
      propertyName,
      stringValue
    ]);
  }
}
