import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET,
  REACT_DOM_SERVER_STATIC_ORACLE_ARTIFACT_PATH,
  REACT_DOM_SERVER_STATIC_PROBE_MODES,
  REACT_DOM_SERVER_STATIC_REACT_DOM_TARGET,
  REACT_DOM_SERVER_STATIC_RUNTIME_SUBPATHS,
  REACT_DOM_SERVER_STATIC_STATIC_SUBPATHS,
  REACT_DOM_SERVER_STATIC_SUPPORTING_TARGETS,
  REACT_DOM_SERVER_STATIC_SERVER_SUBPATHS
} from "../src/react-dom-server-static-targets.mjs";
import {
  REACT_DOM_SERVER_STATIC_SCENARIO_IDS,
  REACT_DOM_SERVER_STATIC_SCENARIOS
} from "../src/react-dom-server-static-scenarios.mjs";
import {
  findReactDomServerStaticComparison,
  findReactDomServerStaticObservation,
  readCheckedReactDomServerStaticOracle,
  readCheckedReactDomServerStaticOracleText
} from "../src/react-dom-server-static-oracle.mjs";

const oracle = readCheckedReactDomServerStaticOracle();
const DEFAULT_MODE = "default-node-development";
const REACT_SERVER_MODE = "react-server-production";

const SIMPLE_MARKUP =
  '<div id="root" class="greeting" title="5 &gt; 3 &amp; &quot;yes&quot;\" data-mode="server-static">Hello <span>Fizz</span> &amp; static</div>';
const SIMPLE_STREAM_MARKUP =
  '<main id="stream-root" data-kind="readable"><h1>Stream</h1><p>ready</p></main>';
const SIMPLE_STATIC_MARKUP =
  '<section id="static-root" data-kind="prerender"><strong>Static</strong> prelude</section>';

test("checked React DOM server/static oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_SERVER_STATIC_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-server-static-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-server-static-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs and local Fast React DOM placeholders copied into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per target, server/static scenario, and mode",
    probeTimeoutMs: 20000,
    generatedTimestampIncluded: false,
    streamNormalization:
      "stream probes record object shapes, callback labels, allReady resolution, and deterministic simple-markup bytes; raw timings are omitted"
  });

  assert.deepEqual(
    oracle.reactDomTarget,
    REACT_DOM_SERVER_STATIC_REACT_DOM_TARGET
  );
  assert.deepEqual(
    oracle.fastReactDomTarget,
    REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET
  );
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_SERVER_STATIC_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages["@fast-react/react-dom"].version, "0.0.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM server/static oracle keeps Fizz implementation and compatibility claims deferred", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactDomBehaviorCompared: true,
    fastReactDomComparedToReactDom: true,
    fastReactDomBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(oracle.evidenceClaims.reactDomServerStaticBehaviorProbed, true);
  assert.equal(oracle.evidenceClaims.fastReactDomComparedToReactDom, true);
  assert.equal(
    oracle.evidenceClaims.fastReactDomUnsupportedBoundariesCaptured,
    true
  );
  assert.equal(oracle.evidenceClaims.fizzImplemented, false);
  assert.deepEqual(oracle.coverage, {
    serverStaticExportBehavior: true,
    reactServerConditionThrows: true,
    unsupportedPlaceholderComparisonBoundaries: true,
    legacyServerMarkup: true,
    fizzSuspenseMarkerEvidence: true,
    basicServerStreamShapeEvidence: true,
    basicStaticPrerenderShapeEvidence: true,
    basicErrorShapeEvidence: true,
    deferredResumeFizzBehavior: true,
    fizzImplementationAdded: false
  });
  assert.deepEqual(
    oracle.deferredFizzBehavior.map((item) => item.id),
    [
      "no-fast-react-fizz-request-engine",
      "server-markup-is-react-evidence-only",
      "resume-state-remains-opaque"
    ]
  );
});

test("React DOM server/static oracle covers every scenario in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_SERVER_STATIC_PROBE_MODES);
  assert.deepEqual(oracle.scenarios, REACT_DOM_SERVER_STATIC_SCENARIOS);
  assert.deepEqual(
    oracle.serverSubpaths,
    REACT_DOM_SERVER_STATIC_SERVER_SUBPATHS
  );
  assert.deepEqual(
    oracle.staticSubpaths,
    REACT_DOM_SERVER_STATIC_STATIC_SUBPATHS
  );
  assert.deepEqual(
    oracle.runtimeSubpaths,
    REACT_DOM_SERVER_STATIC_RUNTIME_SUBPATHS
  );

  for (const mode of REACT_DOM_SERVER_STATIC_PROBE_MODES) {
    assert.equal(
      oracle.reactDomObservations[mode.id].length,
      REACT_DOM_SERVER_STATIC_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactDomObservations[mode.id].length,
      REACT_DOM_SERVER_STATIC_SCENARIO_IDS.length
    );
    assert.equal(
      oracle.fastReactDomComparisons[mode.id].length,
      REACT_DOM_SERVER_STATIC_SCENARIO_IDS.length
    );

    for (const scenarioId of REACT_DOM_SERVER_STATIC_SCENARIO_IDS) {
      assert.equal(
        reactObservation(mode.id, scenarioId).packageName,
        "react-dom"
      );
      assert.equal(
        fastObservation(mode.id, scenarioId).packageName,
        "@fast-react/react-dom"
      );
      assert.equal(
        findReactDomServerStaticComparison(oracle, mode.id, scenarioId).status,
        "unsupported-placeholder"
      );
    }
  }

  assert.deepEqual(
    oracle.implementationComparison.currentFastReactDomServerStatic.statusCounts,
    {
      "unsupported-placeholder":
        REACT_DOM_SERVER_STATIC_PROBE_MODES.length *
        REACT_DOM_SERVER_STATIC_SCENARIO_IDS.length
    }
  );
});

test("React DOM server/static export behavior and react-server throwing modules are recorded", () => {
  assert.deepEqual(exportKeys(DEFAULT_MODE, "./server"), [
    "version",
    "renderToString",
    "renderToStaticMarkup",
    "renderToPipeableStream",
    "renderToReadableStream",
    "resumeToPipeableStream",
    "resume"
  ]);
  assert.deepEqual(exportKeys(DEFAULT_MODE, "./server.browser"), [
    "version",
    "renderToString",
    "renderToStaticMarkup",
    "renderToReadableStream",
    "resume"
  ]);
  assert.deepEqual(exportKeys(DEFAULT_MODE, "./server.edge"), [
    "version",
    "renderToReadableStream",
    "renderToString",
    "renderToStaticMarkup",
    "resume"
  ]);
  assert.deepEqual(exportKeys(DEFAULT_MODE, "./server.bun"), [
    "version",
    "renderToReadableStream",
    "resume",
    "renderToString",
    "renderToStaticMarkup"
  ]);
  assert.deepEqual(descriptorFor(DEFAULT_MODE, "./server.bun", "resume").value, {
    type: "undefined"
  });
  assert.deepEqual(exportKeys(DEFAULT_MODE, "./static"), [
    "version",
    "prerenderToNodeStream",
    "prerender",
    "resumeAndPrerenderToNodeStream",
    "resumeAndPrerender"
  ]);
  assert.deepEqual(exportKeys(DEFAULT_MODE, "./static.browser"), [
    "version",
    "prerender",
    "resumeAndPrerender"
  ]);

  for (const subpath of REACT_DOM_SERVER_STATIC_SERVER_SUBPATHS) {
    const row = exportShapeSubpath(REACT_SERVER_MODE, subpath);
    assert.equal(row.require.status, "throws");
    assert.equal(
      row.require.error.message,
      "react-dom/server is not supported in React Server Components."
    );
  }

  for (const subpath of REACT_DOM_SERVER_STATIC_STATIC_SUBPATHS) {
    const row = exportShapeSubpath(REACT_SERVER_MODE, subpath);
    assert.equal(row.require.status, "throws");
    assert.equal(
      row.require.error.message,
      "react-dom/static is not supported in React Server Components."
    );
  }
});

test("React DOM server/static oracle records legacy markup and deferred Suspense marker behavior", () => {
  const legacy = scenarioValue(DEFAULT_MODE, "server-legacy-markup").subpaths;
  for (const row of legacy) {
    assert.equal(row.renderToString.status, "ok", row.subpath);
    assert.equal(row.renderToString.value.text, SIMPLE_MARKUP, row.subpath);
    assert.equal(row.renderToStaticMarkup.value.text, SIMPLE_MARKUP, row.subpath);
  }

  const suspense = scenarioValue(
    DEFAULT_MODE,
    "server-fizz-suspense-markers"
  ).subpaths;
  for (const row of suspense) {
    assert.equal(row.renderToString.status, "ok", row.subpath);
    assert.equal(
      row.renderToString.value.markers.clientRenderedSuspenseStart,
      true,
      row.subpath
    );
    assert.equal(row.renderToString.value.markers.suspenseEnd, true, row.subpath);
    assert.equal(row.renderToString.value.markers.hasDataMessage, true);
    assert.equal(row.renderToStaticMarkup.value.text, "<em>loading</em>");
    assert.equal(
      row.renderToStaticMarkup.value.markers.clientRenderedSuspenseStart,
      false
    );
  }
});

test("React DOM server/static oracle records stream and prerender result shapes", () => {
  const stream = scenarioValue(DEFAULT_MODE, "server-stream-result-shape");
  for (const row of stream.pipeable) {
    assert.equal(row.operation.status, "ok", row.subpath);
    assert.deepEqual(row.operation.value.pipeableShape.objectKeys, [
      "pipe",
      "abort"
    ]);
    assert.equal(row.operation.value.output.text, SIMPLE_STREAM_MARKUP);
    assert.equal(row.operation.value.secondPipe.status, "throws");
    assert.equal(
      row.operation.value.secondPipe.error.message,
      "React currently only supports piping to one writable stream."
    );
  }

  for (const row of stream.readable) {
    assert.equal(row.operation.status, "ok", row.subpath);
    if (row.subpath === "./server.bun") {
      assert.equal(row.operation.value.notExecutedInNode, true);
    } else {
      assert.equal(row.operation.value.output.text, SIMPLE_STREAM_MARKUP);
      assert.equal(row.operation.value.allReady.value, "resolved");
      assert.deepEqual(row.operation.value.streamShape.objectKeys, [
        "allReady"
      ]);
    }
  }

  const staticShape = scenarioValue(
    DEFAULT_MODE,
    "static-prerender-result-shape"
  );
  for (const row of staticShape.prerender) {
    assert.equal(row.operation.status, "ok", row.subpath);
    assert.deepEqual(row.operation.value.objectKeys, ["postponed", "prelude"]);
    assert.deepEqual(row.operation.value.postponed, { type: "null" });
    assert.equal(row.operation.value.preludeOutput.text, SIMPLE_STATIC_MARKUP);
  }
  for (const row of staticShape.prerenderToNodeStream) {
    assert.equal(row.operation.status, "ok", row.subpath);
    assert.equal(row.operation.value.preludeOutput.text, SIMPLE_STATIC_MARKUP);
  }
});

test("React DOM server/static oracle records basic error and resume boundary evidence", () => {
  const errors = scenarioValue(DEFAULT_MODE, "server-static-error-shape");
  for (const row of errors.renderToString) {
    assert.equal(row.operation.status, "ok", row.subpath);
    assert.equal(row.operation.value.status, "throws");
    assert.equal(row.operation.value.error.name, "ServerStaticBoomError");
    assert.equal(row.operation.value.error.message, "server-static boom");
  }
  for (const row of errors.renderToReadableStream) {
    assert.equal(row.operation.status, "ok", row.subpath);
    assert.equal(row.operation.value.events[0].name, "ServerStaticBoomError");
  }
  for (const row of errors.prerender) {
    assert.equal(row.operation.status, "ok", row.subpath);
    assert.equal(row.operation.value.result.status, "throws");
    assert.equal(row.operation.value.events[0].message, "server-static boom");
  }

  const resume = scenarioValue(
    DEFAULT_MODE,
    "server-static-resume-deferred-boundary"
  );
  for (const row of resume.resume) {
    assert.equal(row.operation.status, "ok", row.subpath);
    if (row.subpath === "./server.bun") {
      assert.deepEqual(row.operation.value.resume, { type: "undefined" });
    } else {
      assert.equal(row.operation.value.status, "throws");
      assert.equal(row.operation.value.error.name, "TypeError");
      assert.equal(
        row.operation.value.error.message,
        "Cannot read properties of null (reading 'resumableState')"
      );
    }
  }
  for (const collection of [
    resume.resumeToPipeableStream,
    resume.resumeAndPrerender,
    resume.resumeAndPrerenderToNodeStream
  ]) {
    for (const row of collection) {
      assert.equal(row.operation.status, "ok", row.subpath);
      assert.equal(row.operation.value.status, "throws");
      assert.equal(row.operation.value.error.name, "TypeError");
    }
  }
});

test("React DOM server/static oracle records Fast React unsupported placeholder boundaries", () => {
  const exportShape = fastScenarioValue(DEFAULT_MODE, "server-static-export-shape");
  for (const row of exportShape.subpaths) {
    if (row.require.status === "ok") {
      assert.equal(
        row.require.value.placeholderMetadata.isFastReactPlaceholder,
        true,
        row.subpath
      );
    } else {
      assert.match(
        row.require.error.message,
        /is not supported in React Server Components/u
      );
      assert.equal(row.require.error.code, "FAST_REACT_REACT_SERVER_UNSUPPORTED");
    }
  }

  const legacy = fastScenarioValue(DEFAULT_MODE, "server-legacy-markup");
  for (const row of legacy.subpaths) {
    assert.equal(row.load.placeholderMetadata.isFastReactPlaceholder, true);
    assert.equal(row.renderToString.status, "throws");
    assert.equal(row.renderToString.error.code, "FAST_REACT_UNIMPLEMENTED");
  }

  for (const mode of REACT_DOM_SERVER_STATIC_PROBE_MODES) {
    for (const scenarioId of REACT_DOM_SERVER_STATIC_SCENARIO_IDS) {
      const comparison = findReactDomServerStaticComparison(
        oracle,
        mode.id,
        scenarioId
      );
      assert.equal(comparison.compatibilityClaimed, false);
      assert.equal(
        comparison.reason,
        "Fast React DOM currently exposes structured unsupported server/static placeholders instead of implementing Fizz behavior."
      );
    }
  }
});

test("React DOM server/static oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactDomServerStaticOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(oracleText, /\/Users\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-server-static-oracle-[A-Za-z0-9]/u
  );
});

test("print React DOM server/static oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-server-static-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024
    }
  );

  assert.equal(output, readCheckedReactDomServerStaticOracleText());
});

function reactObservation(modeId, scenarioId) {
  return findReactDomServerStaticObservation(
    oracle,
    modeId,
    "react-dom",
    scenarioId
  );
}

function fastObservation(modeId, scenarioId) {
  return findReactDomServerStaticObservation(
    oracle,
    modeId,
    "@fast-react/react-dom",
    scenarioId
  );
}

function scenarioValue(modeId, scenarioId) {
  const observation = reactObservation(modeId, scenarioId);
  assert.equal(observation.result.result.status, "ok");
  return observation.result.result.value;
}

function fastScenarioValue(modeId, scenarioId) {
  const observation = fastObservation(modeId, scenarioId);
  assert.equal(observation.result.result.status, "ok");
  return observation.result.result.value;
}

function exportShapeSubpath(modeId, subpath) {
  const row = scenarioValue(modeId, "server-static-export-shape").subpaths.find(
    (candidate) => candidate.subpath === subpath
  );
  assert.ok(row, `missing export-shape row for ${modeId}:${subpath}`);
  return row;
}

function exportKeys(modeId, subpath) {
  const row = exportShapeSubpath(modeId, subpath);
  assert.equal(row.require.status, "ok");
  return row.require.value.exportKeys;
}

function descriptorFor(modeId, subpath, key) {
  const row = exportShapeSubpath(modeId, subpath);
  assert.equal(row.require.status, "ok");
  const descriptor = row.require.value.descriptors.find(
    (entry) => entry.key === key
  );
  assert.ok(descriptor, `missing descriptor for ${modeId}:${subpath}:${key}`);
  return descriptor.descriptor;
}
