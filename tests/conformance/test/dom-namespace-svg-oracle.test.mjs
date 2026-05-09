import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  DOM_NAMESPACE_SVG_CLIENT_SCENARIOS,
  DOM_NAMESPACE_SVG_SERVER_SCENARIOS
} from "../src/dom-namespace-svg-scenarios.mjs";
import {
  findDomNamespaceSvgClientObservation,
  findDomNamespaceSvgServerObservation,
  readCheckedDomNamespaceSvgOracle,
  readCheckedDomNamespaceSvgOracleText
} from "../src/dom-namespace-svg-oracle.mjs";
import {
  DOM_NAMESPACE_SVG_NAMESPACES,
  DOM_NAMESPACE_SVG_ORACLE_ARTIFACT_PATH,
  DOM_NAMESPACE_SVG_PROBE_MODES,
  DOM_NAMESPACE_SVG_REACT_DOM_TARGET,
  DOM_NAMESPACE_SVG_SUPPORTING_TARGETS
} from "../src/dom-namespace-svg-targets.mjs";

const oracle = readCheckedDomNamespaceSvgOracle();

test("checked DOM namespace/SVG oracle artifact has expected schema and targets", () => {
  assert.equal(
    DOM_NAMESPACE_SVG_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-dom-namespace-svg-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-dom-namespace-svg-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per probe mode, action, and scenario",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, DOM_NAMESPACE_SVG_REACT_DOM_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    DOM_NAMESPACE_SVG_SUPPORTING_TARGETS
  );
  assert.deepEqual(oracle.namespaces, DOM_NAMESPACE_SVG_NAMESPACES);
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("DOM namespace/SVG oracle keeps Fast React compatibility claims false", () => {
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
      (gap) => gap.id === "client-probes-use-deterministic-fake-dom"
    ),
    true
  );
});

test("DOM namespace/SVG oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, DOM_NAMESPACE_SVG_PROBE_MODES);
  assert.deepEqual(oracle.serverScenarios, DOM_NAMESPACE_SVG_SERVER_SCENARIOS);
  assert.deepEqual(oracle.clientScenarios, DOM_NAMESPACE_SVG_CLIENT_SCENARIOS);

  for (const mode of DOM_NAMESPACE_SVG_PROBE_MODES) {
    assert.equal(
      oracle.serverObservations[mode.id].length,
      DOM_NAMESPACE_SVG_SERVER_SCENARIOS.length
    );
    assert.equal(
      oracle.clientObservations[mode.id].length,
      DOM_NAMESPACE_SVG_CLIENT_SCENARIOS.length
    );

    for (const scenario of DOM_NAMESPACE_SVG_SERVER_SCENARIOS) {
      assert.equal(
        findDomNamespaceSvgServerObservation(oracle, mode.id, scenario.id)
          .status,
        "ok"
      );
    }
    for (const scenario of DOM_NAMESPACE_SVG_CLIENT_SCENARIOS) {
      assert.equal(
        findDomNamespaceSvgClientObservation(oracle, mode.id, scenario.id)
          .status,
        "ok"
      );
    }
  }
});

test("server oracle records SVG attribute aliases and namespaced attributes", () => {
  const observation = findDomNamespaceSvgServerObservation(
    oracle,
    "development",
    "svg-common-attributes"
  );

  assert.deepEqual(observation.console, []);
  assert.equal(
    observation.renderers.renderToStaticMarkup,
    '<svg accent-height="7" alignment-baseline="middle" class="icon" clip-path="url(#clip)" fill-rule="evenodd" focusable="false" stroke-width="2" tabindex="0" viewBox="0 0 10 10" xlink:href="#symbol" xml:lang="en" xml:space="preserve"><use href="#href-target" xlink:href="#xlink-target"></use></svg>'
  );
  assert.equal(
    observation.renderers.renderToString,
    observation.renderers.renderToStaticMarkup
  );
});

test("server oracle records foreignObject and MathML serialized output", () => {
  const foreignObject = findDomNamespaceSvgServerObservation(
    oracle,
    "development",
    "foreignobject-html-boundary"
  );
  assert.equal(
    foreignObject.renderers.renderToStaticMarkup,
    '<svg><foreignObject height="4" width="3" x="1" y="2"><div class="inside"><svg><circle cx="5" stroke-width="2" xlink:href="#circle"></circle></svg></div></foreignObject></svg>'
  );

  const math = findDomNamespaceSvgServerObservation(
    oracle,
    "development",
    "mathml-basic-tree"
  );
  assert.equal(
    math.renderers.renderToStaticMarkup,
    '<math display="block"><mrow><mi mathvariant="bold">x</mi><annotation-xml encoding="application/xhtml+xml"><div class="html-looking-child"><svg><circle></circle></svg></div></annotation-xml></mrow></math>'
  );
});

test("client oracle records setAttributeNS for xlink and xml SVG attributes", () => {
  const observation = findDomNamespaceSvgClientObservation(
    oracle,
    "development",
    "client-svg-common-attributes"
  );
  const operations = observation.output.operations;

  assert.deepEqual(observation.console, []);
  assert.ok(
    operations.some(
      (operation) =>
        operation.type === "createElementNS" &&
        operation.namespaceURI === DOM_NAMESPACE_SVG_NAMESPACES.svg &&
        operation.name === "svg"
    )
  );
  assert.ok(
    operations.some(
      (operation) =>
        operation.type === "setAttribute" &&
        operation.targetNodeName === "svg" &&
        operation.name === "stroke-width" &&
        operation.value === "2"
    )
  );
  assert.ok(
    operations.some(
      (operation) =>
        operation.type === "setAttributeNS" &&
        operation.namespaceURI === DOM_NAMESPACE_SVG_NAMESPACES.xlink &&
        operation.name === "xlink:href" &&
        operation.value === "#symbol"
    )
  );
  assert.ok(
    operations.some(
      (operation) =>
        operation.type === "setAttributeNS" &&
        operation.namespaceURI === DOM_NAMESPACE_SVG_NAMESPACES.xml &&
        operation.name === "xml:space" &&
        operation.value === "preserve"
    )
  );
});

test("client oracle records foreignObject returning descendants to HTML namespace", () => {
  const observation = findDomNamespaceSvgClientObservation(
    oracle,
    "development",
    "client-html-svg-foreignobject-html-svg"
  );
  const outerSvg = onlyChild(observation.output.container);
  const foreignObject = onlyChild(outerSvg);
  const htmlDiv = onlyChild(foreignObject);
  const nestedSvg = onlyChild(htmlDiv);
  const circle = onlyChild(nestedSvg);

  assert.equal(outerSvg.nodeName, "svg");
  assert.equal(outerSvg.namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.svg);
  assert.equal(foreignObject.nodeName, "foreignObject");
  assert.equal(foreignObject.namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.svg);
  assert.equal(htmlDiv.nodeName, "DIV");
  assert.equal(htmlDiv.namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.html);
  assert.equal(nestedSvg.nodeName, "svg");
  assert.equal(nestedSvg.namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.svg);
  assert.equal(circle.nodeName, "circle");
  assert.equal(circle.namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.svg);
});

test("client oracle records SVG and MathML container namespace context", () => {
  const svgContainer = findDomNamespaceSvgClientObservation(
    oracle,
    "development",
    "client-svg-container-child-context"
  );
  const g = onlyChild(svgContainer.output.container);
  assert.equal(g.nodeName, "g");
  assert.equal(g.namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.svg);
  assert.equal(childNamed(g, "text").namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.svg);
  assert.equal(
    childNamed(childNamed(g, "foreignObject"), "DIV").namespaceURI,
    DOM_NAMESPACE_SVG_NAMESPACES.html
  );

  const math = findDomNamespaceSvgClientObservation(
    oracle,
    "development",
    "client-mathml-tree"
  );
  const mathRoot = onlyChild(math.output.container);
  const mrow = onlyChild(mathRoot);
  const annotation = childNamed(mrow, "annotation-xml");
  assert.equal(mathRoot.namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.mathml);
  assert.equal(childNamed(mrow, "mi").namespaceURI, DOM_NAMESPACE_SVG_NAMESPACES.mathml);
  assert.equal(
    childNamed(annotation, "div").namespaceURI,
    DOM_NAMESPACE_SVG_NAMESPACES.mathml
  );
});

test("DOM namespace/SVG oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedDomNamespaceSvgOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-dom-namespace-svg-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(oracleText, /\/Users\/user\/Developer\/Developer/u);
});

test("print DOM namespace/SVG oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-dom-namespace-svg-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedDomNamespaceSvgOracleText());
});

function onlyChild(node) {
  assert.equal(node.children.length, 1, node.nodeName);
  return node.children[0];
}

function childNamed(node, nodeName) {
  const child = node.children.find((candidate) => candidate.nodeName === nodeName);
  assert.ok(child, `missing child ${nodeName} under ${node.nodeName}`);
  return child;
}
