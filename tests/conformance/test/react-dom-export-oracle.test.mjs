import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_DOM_EXPORT_BLOCKED_SUBPATH_MODES,
  REACT_DOM_EXPORT_CONDITION_MODES,
  REACT_DOM_EXPORT_ORACLE_ARTIFACT_PATH,
  REACT_DOM_EXPORT_PROBE_MODES,
  REACT_DOM_EXPORT_PUBLIC_SUBPATHS,
  REACT_DOM_EXPORT_RUNTIME_SUBPATHS,
  REACT_DOM_EXPORT_SUPPORTING_TARGETS,
  REACT_DOM_EXPORT_TARGET
} from "../src/react-dom-export-targets.mjs";
import {
  findReactDomBlockedSubpathProbe,
  findReactDomConditionResolution,
  findReactDomExportObservation,
  readCheckedReactDomExportOracle,
  readCheckedReactDomExportOracleText
} from "../src/react-dom-export-oracle.mjs";

const oracle = readCheckedReactDomExportOracle();

test("checked React DOM export oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_DOM_EXPORT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-dom-export-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-dom-export-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per React DOM subpath, condition, and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(oracle.reactDomTarget, REACT_DOM_EXPORT_TARGET);
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_DOM_EXPORT_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-dom"].version, "19.2.6");
  assert.equal(oracle.packages["react"].version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(
    oracle.sourceInventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
});

test("React DOM export oracle keeps Fast React compatibility claims false", () => {
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

test("React DOM export oracle covers runtime subpaths in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_DOM_EXPORT_PROBE_MODES);
  assert.deepEqual(oracle.runtimeSubpaths, REACT_DOM_EXPORT_RUNTIME_SUBPATHS);

  for (const mode of REACT_DOM_EXPORT_PROBE_MODES) {
    const observations = oracle.runtimeExportObservations[mode.id];
    assert.equal(observations.length, REACT_DOM_EXPORT_RUNTIME_SUBPATHS.length);

    for (const subpath of REACT_DOM_EXPORT_RUNTIME_SUBPATHS) {
      assert.equal(
        findReactDomExportObservation(oracle, mode.id, subpath).subpath,
        subpath
      );
    }
  }
});

test("React DOM root, client, profiling, and test-utils exports are recorded", () => {
  const root = findReactDomExportObservation(
    oracle,
    "default-node-development",
    "."
  );
  assert.deepEqual(root.require.exportKeys, [
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
  assert.deepEqual(dataDescriptorFields(descriptorFor(root.require, "version")), {
    configurable: true,
    enumerable: true,
    writable: true
  });
  assert.deepEqual(descriptorFor(root.require, "version").value, {
    type: "string",
    value: "19.2.6"
  });
  assert.equal(descriptorFor(root.require, "flushSync").value.length, 1);

  const client = findReactDomExportObservation(
    oracle,
    "default-node-development",
    "./client"
  );
  assert.deepEqual(client.require.exportKeys, [
    "createRoot",
    "hydrateRoot",
    "version"
  ]);
  assert.equal(descriptorFor(client.require, "createRoot").value.length, 2);
  assert.equal(descriptorFor(client.require, "hydrateRoot").value.length, 3);

  const profiling = findReactDomExportObservation(
    oracle,
    "default-node-development",
    "./profiling"
  );
  assert.ok(profiling.require.exportKeys.includes("createRoot"));
  assert.ok(profiling.require.exportKeys.includes("hydrateRoot"));
  assert.ok(profiling.require.exportKeys.includes("createPortal"));

  const testUtils = findReactDomExportObservation(
    oracle,
    "default-node-development",
    "./test-utils"
  );
  assert.deepEqual(testUtils.require.exportKeys, ["act"]);
  assert.equal(descriptorFor(testUtils.require, "act").value.length, 1);
});

test("React DOM server and static variants include Node, browser, edge, and Bun surfaces", () => {
  assert.deepEqual(
    exportKeys("default-node-development", "./server"),
    [
      "version",
      "renderToString",
      "renderToStaticMarkup",
      "renderToPipeableStream",
      "renderToReadableStream",
      "resumeToPipeableStream",
      "resume"
    ]
  );
  assert.deepEqual(
    exportKeys("default-node-development", "./server.browser"),
    [
      "version",
      "renderToString",
      "renderToStaticMarkup",
      "renderToReadableStream",
      "resume"
    ]
  );
  assert.deepEqual(
    exportKeys("default-node-development", "./server.edge"),
    [
      "version",
      "renderToReadableStream",
      "renderToString",
      "renderToStaticMarkup",
      "resume"
    ]
  );

  const serverBun = findReactDomExportObservation(
    oracle,
    "default-node-development",
    "./server.bun"
  );
  assert.deepEqual(serverBun.require.exportKeys, [
    "version",
    "renderToReadableStream",
    "resume",
    "renderToString",
    "renderToStaticMarkup"
  ]);
  assert.deepEqual(descriptorFor(serverBun.require, "resume").value, {
    type: "undefined"
  });

  assert.deepEqual(
    exportKeys("default-node-development", "./static"),
    [
      "version",
      "prerenderToNodeStream",
      "prerender",
      "resumeAndPrerenderToNodeStream",
      "resumeAndPrerender"
    ]
  );
  assert.deepEqual(exportKeys("default-node-development", "./static.browser"), [
    "version",
    "prerender",
    "resumeAndPrerender"
  ]);
  assert.deepEqual(exportKeys("default-node-development", "./static.edge"), [
    "version",
    "prerender",
    "resumeAndPrerender"
  ]);
});

test("react-server condition narrows root exports and records throwing branches", () => {
  const serverRoot = findReactDomExportObservation(
    oracle,
    "react-server-production",
    "."
  );
  assert.deepEqual(serverRoot.require.exportKeys, [
    "__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE",
    "preconnect",
    "prefetchDNS",
    "preinit",
    "preinitModule",
    "preload",
    "preloadModule",
    "version"
  ]);

  for (const [subpath, message] of [
    ["./client", "react-dom/client is not supported in React Server Components."],
    ["./server", "react-dom/server is not supported in React Server Components."],
    [
      "./server.browser",
      "react-dom/server is not supported in React Server Components."
    ],
    [
      "./server.bun",
      "react-dom/server is not supported in React Server Components."
    ],
    [
      "./server.edge",
      "react-dom/server is not supported in React Server Components."
    ],
    [
      "./server.node",
      "react-dom/server is not supported in React Server Components."
    ],
    ["./static", "react-dom/static is not supported in React Server Components."],
    [
      "./static.browser",
      "react-dom/static is not supported in React Server Components."
    ],
    [
      "./static.edge",
      "react-dom/static is not supported in React Server Components."
    ],
    [
      "./static.node",
      "react-dom/static is not supported in React Server Components."
    ],
    [
      "./profiling",
      "react-dom/profiling is not supported in React Server Components."
    ]
  ]) {
    const observation = findReactDomExportObservation(
      oracle,
      "react-server-production",
      subpath
    );
    assert.equal(observation.require.status, "throws", subpath);
    assert.equal(observation.require.message, message, subpath);
    assert.equal(observation.dynamicImport.status, "throws", subpath);
    assert.equal(observation.dynamicImport.message, message, subpath);
  }

  const testUtils = findReactDomExportObservation(
    oracle,
    "react-server-production",
    "./test-utils"
  );
  assert.deepEqual(testUtils.require.exportKeys, ["act"]);
});

test("condition resolution covers public subpaths and custom condition caveats", () => {
  assert.deepEqual(oracle.conditionModes, REACT_DOM_EXPORT_CONDITION_MODES);
  assert.deepEqual(oracle.publicSubpaths, REACT_DOM_EXPORT_PUBLIC_SUBPATHS);

  for (const mode of REACT_DOM_EXPORT_CONDITION_MODES) {
    const resolutions = oracle.conditionResolution[mode.id];
    assert.equal(resolutions.length, REACT_DOM_EXPORT_PUBLIC_SUBPATHS.length);

    for (const subpath of REACT_DOM_EXPORT_PUBLIC_SUBPATHS) {
      assert.equal(
        findReactDomConditionResolution(oracle, mode.id, subpath).subpath,
        subpath
      );
    }
  }

  assert.equal(
    findReactDomConditionResolution(oracle, "default-node", "./server")
      .requireResolve.path,
    "node_modules/react-dom/server.node.js"
  );
  assert.equal(
    findReactDomConditionResolution(oracle, "browser", "./server").requireResolve
      .path,
    "node_modules/react-dom/server.node.js"
  );
  assert.equal(
    findReactDomConditionResolution(oracle, "bun", "./server").requireResolve
      .path,
    "node_modules/react-dom/server.bun.js"
  );
  assert.equal(
    findReactDomConditionResolution(oracle, "bun", "./static").requireResolve
      .path,
    "node_modules/react-dom/static.node.js"
  );
  assert.equal(
    findReactDomConditionResolution(oracle, "react-server", "./profiling")
      .requireResolve.path,
    "node_modules/react-dom/profiling.react-server.js"
  );
});

test("physical .js and CJS React DOM subpaths stay blocked by package exports", () => {
  assert.deepEqual(
    oracle.blockedSubpathModes,
    REACT_DOM_EXPORT_BLOCKED_SUBPATH_MODES
  );
  assert.ok(oracle.blockedPhysicalSubpaths.includes("./client.js"));
  assert.ok(oracle.blockedPhysicalSubpaths.includes("./server.js"));
  assert.ok(oracle.blockedPhysicalSubpaths.includes("./test-utils.js"));
  assert.ok(
    oracle.blockedPhysicalSubpaths.includes(
      "./cjs/react-dom-server.node.development.js"
    )
  );

  for (const mode of REACT_DOM_EXPORT_BLOCKED_SUBPATH_MODES) {
    const probes = oracle.blockedPhysicalSubpathProbes[mode.id];
    assert.equal(probes.length, oracle.blockedPhysicalSubpaths.length);

    for (const subpath of oracle.blockedPhysicalSubpaths) {
      const probe = findReactDomBlockedSubpathProbe(oracle, mode.id, subpath);
      assert.equal(probe.requireResolve.status, "throws", subpath);
      assert.equal(probe.requireResolve.code, "ERR_PACKAGE_PATH_NOT_EXPORTED");
      assert.equal(probe.importMetaResolve.status, "throws", subpath);
      assert.equal(
        probe.importMetaResolve.code,
        "ERR_PACKAGE_PATH_NOT_EXPORTED"
      );
    }
  }
});

test("React DOM export oracle artifact does not leak temporary generation paths", () => {
  const oracleText = readCheckedReactDomExportOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-dom-export-oracle-[A-Za-z0-9]/u
  );

  for (const observations of Object.values(oracle.runtimeExportObservations)) {
    for (const observation of observations) {
      if (observation.requireResolve.status === "ok") {
        assert.match(observation.requireResolve.path, /^node_modules\//u);
      }
    }
  }

  for (const resolutions of Object.values(oracle.conditionResolution)) {
    for (const resolution of resolutions) {
      if (resolution.requireResolve.status === "ok") {
        assert.match(resolution.requireResolve.path, /^node_modules\//u);
      }
    }
  }
});

test("print React DOM export oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-dom-export-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedReactDomExportOracleText());
});

function exportKeys(modeId, subpath) {
  return findReactDomExportObservation(oracle, modeId, subpath).require
    .exportKeys;
}

function descriptorFor(loadResult, key) {
  const match = loadResult.descriptors.find(
    (entry) => entry.key.type === "string" && entry.key.value === key
  );
  assert.ok(match, `missing descriptor for ${key}`);
  return match.descriptor;
}

function dataDescriptorFields(descriptor) {
  assert.equal(descriptor.kind, "data");
  return {
    configurable: descriptor.configurable,
    enumerable: descriptor.enumerable,
    writable: descriptor.writable
  };
}
