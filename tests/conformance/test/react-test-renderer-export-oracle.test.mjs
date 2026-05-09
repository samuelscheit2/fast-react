import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  REACT_TEST_RENDERER_EXPORT_CONDITION_MODES,
  REACT_TEST_RENDERER_EXPORT_CREATE_WARNING_SCENARIOS,
  REACT_TEST_RENDERER_EXPORT_ORACLE_ARTIFACT_PATH,
  REACT_TEST_RENDERER_EXPORT_PROBE_MODES,
  REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS,
  REACT_TEST_RENDERER_EXPORT_SHALLOW_SUBPATHS,
  REACT_TEST_RENDERER_EXPORT_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_EXPORT_TARGET
} from "../src/react-test-renderer-export-targets.mjs";
import {
  findReactTestRendererConditionResolution,
  findReactTestRendererCreateWarningObservation,
  findReactTestRendererExportObservation,
  findReactTestRendererShallowRemovalObservation,
  readCheckedReactTestRendererExportOracle,
  readCheckedReactTestRendererExportOracleText
} from "../src/react-test-renderer-export-oracle.mjs";

const oracle = readCheckedReactTestRendererExportOracle();

test("checked React Test Renderer export oracle artifact has the expected schema and targets", () => {
  assert.equal(
    REACT_TEST_RENDERER_EXPORT_ORACLE_ARTIFACT_PATH,
    "oracles/react-19.2.6-react-test-renderer-export-oracle.json"
  );
  assert.equal(oracle.schemaVersion, 1);
  assert.equal(
    oracle.oracleKind,
    "react-19.2.6-react-test-renderer-export-oracle"
  );
  assert.equal(oracle.generatedArtifacts, true);
  assert.equal(oracle.deterministic, true);
  assert.deepEqual(oracle.generation, {
    method:
      "exact npm tarballs extracted into a temporary node_modules tree and probed through isolated Node child processes",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation:
      "one Node child process per react-test-renderer subpath, condition, warning scenario, and shallow invocation mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(
    oracle.reactTestRendererTarget,
    REACT_TEST_RENDERER_EXPORT_TARGET
  );
  assert.deepEqual(
    oracle.supportingRuntimePackages,
    REACT_TEST_RENDERER_EXPORT_SUPPORTING_TARGETS
  );
  assert.equal(oracle.packages["react-test-renderer"].version, "19.2.6");
  assert.equal(oracle.packages.react.version, "19.2.6");
  assert.equal(oracle.packages.scheduler.version, "0.27.0");
  assert.equal(oracle.packages["react-is"].version, "19.2.6");
});

test("React Test Renderer export oracle keeps Fast React compatibility claims false", () => {
  assert.deepEqual(oracle.conformanceClaims, {
    realReactTestRendererBehaviorProbed: true,
    fastReactComparedToReactTestRenderer: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false,
    compatibilityClaimed: false
  });
  assert.equal(
    oracle.evidenceClaims.fastReactComparedToReactTestRenderer,
    false
  );
  assert.equal(
    oracle.unsupportedFastReactEvidence.status,
    "unsupported-placeholder"
  );
  assert.equal(
    oracle.intentionalGaps.some(
      (gap) => gap.id === "no-fast-react-react-test-renderer-comparison"
    ),
    true
  );
});

test("React Test Renderer package metadata and dependency surface are recorded", () => {
  const packageEvidence = oracle.packages["react-test-renderer"];

  assert.deepEqual(packageEvidence.registry, {
    metadataUrl: "https://registry.npmjs.org/react-test-renderer/19.2.6",
    distTarball:
      "https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz",
    distIntegrity:
      "sha512-GbS6V23YduFTPiWJ5xICbKEjRcqx1Z90js/V5miqhz7qp/d6xSe9Dd6NjSQODFRdzdsqRMPW82E/sFpPRbY5Mw==",
    distShasum: "42e9f9fcc4fe11d4bbf7acff536a2e5b8a8cfd45",
    unpackedSize: 987992,
    fileCount: 7
  });
  assert.deepEqual(packageEvidence.tarball.files, [
    "LICENSE",
    "README.md",
    "cjs/react-test-renderer.development.js",
    "cjs/react-test-renderer.production.js",
    "index.js",
    "package.json",
    "shallow.js"
  ]);
  assert.equal(packageEvidence.tarball.integrityVerified, true);

  assert.deepEqual(packageEvidence.packageJson.dependencies, {
    "react-is": "^19.2.6",
    scheduler: "^0.27.0"
  });
  assert.deepEqual(packageEvidence.packageJson.peerDependencies, {
    react: "^19.2.6"
  });
  assert.equal(packageEvidence.packageJson.main, "index.js");
  assert.equal(packageEvidence.packageJson.exports, null);
  assert.equal(oracle.packageSurface.legacyCommonJsPhysicalSubpathsPublic, true);
  assert.deepEqual(oracle.dependencyEvidence.declaredDependencies, {
    "react-is": "^19.2.6",
    scheduler: "^0.27.0"
  });
  assert.equal(oracle.dependencyEvidence.reactPeerLoadedByRendererExports, true);
  assert.equal(
    oracle.dependencyEvidence.reactIsDeclaredButNotLoadedByExportProbes,
    true
  );
  assert.equal(
    oracle.dependencyEvidence.schedulerMockLoadedByRendererExports,
    true
  );
  assert.equal(
    oracle.dependencyEvidence.schedulerRootLoadedByRendererExports,
    true
  );
});

test("React Test Renderer export oracle covers runtime subpaths in every probe mode", () => {
  assert.deepEqual(oracle.probeModes, REACT_TEST_RENDERER_EXPORT_PROBE_MODES);
  assert.deepEqual(
    oracle.runtimeSubpaths,
    REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS
  );

  for (const mode of REACT_TEST_RENDERER_EXPORT_PROBE_MODES) {
    const observations = oracle.runtimeExportObservations[mode.id];
    assert.equal(
      observations.length,
      REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS.length
    );

    for (const subpath of REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS) {
      assert.equal(
        findReactTestRendererExportObservation(oracle, mode.id, subpath)
          .subpath,
        subpath
      );
    }
  }
});

test("React Test Renderer root export keys, descriptors, and CJS import interop are recorded", () => {
  for (const modeId of ["default-node-development", "default-node-production"]) {
    const root = findReactTestRendererExportObservation(oracle, modeId, ".");

    assert.equal(root.requireResolve.path, "node_modules/react-test-renderer/index.js");
    assert.deepEqual(root.require.exportKeys, [
      "_Scheduler",
      "act",
      "create",
      "unstable_batchedUpdates",
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
    if (modeId === "default-node-development") {
      assert.equal(descriptorFor(root.require, "act").value.length, 1);
    } else {
      assert.deepEqual(descriptorFor(root.require, "act").value, {
        type: "undefined"
      });
    }
    assert.equal(descriptorFor(root.require, "create").value.length, 2);
    assert.equal(
      descriptorFor(root.require, "unstable_batchedUpdates").value.length,
      2
    );
    assert.ok(
      descriptorFor(root.require, "_Scheduler").value.ownPropertyNames.includes(
        "unstable_scheduleCallback"
      )
    );

    assert.deepEqual(root.dynamicImport.exportKeys, [
      "_Scheduler",
      "act",
      "create",
      "default",
      "module.exports",
      "unstable_batchedUpdates",
      "version"
    ]);
    assert.equal(root.importInterop.defaultEqualsRequire, true);
    assert.equal(root.importInterop.moduleExportsEqualsRequire, true);
    assert.equal(
      root.importInterop.namedExportEqualsRequireValue.every(
        (entry) => entry.equal === true
      ),
      true
    );
  }
});

test("react-server condition records deterministic unsupported renderer load behavior", () => {
  for (const modeId of ["react-server-development", "react-server-production"]) {
    for (const subpath of [".", "./index.js"]) {
      const observation = findReactTestRendererExportObservation(
        oracle,
        modeId,
        subpath
      );
      assert.equal(observation.require.status, "throws");
      assert.equal(
        observation.require.message,
        "Cannot read properties of undefined (reading 'S')"
      );
      assert.equal(observation.dynamicImport.status, "throws");
      assert.equal(
        observation.dynamicImport.message,
        "Cannot read properties of undefined (reading 'S')"
      );
    }

    assert.equal(
      findReactTestRendererExportObservation(oracle, modeId, "./shallow").require
        .status,
      "ok"
    );
    assert.equal(
      findReactTestRendererExportObservation(oracle, modeId, "./shallow.js")
        .require.status,
      "ok"
    );
  }

  const directDevelopmentCjs = findReactTestRendererExportObservation(
    oracle,
    "react-server-production",
    "./cjs/react-test-renderer.development.js"
  );
  assert.equal(directDevelopmentCjs.require.status, "ok");
});

test("condition resolution captures no-exports-map physical CommonJS behavior", () => {
  assert.deepEqual(
    oracle.conditionModes,
    REACT_TEST_RENDERER_EXPORT_CONDITION_MODES
  );

  for (const mode of REACT_TEST_RENDERER_EXPORT_CONDITION_MODES) {
    const resolutions = oracle.conditionResolution[mode.id];
    assert.equal(resolutions.length, REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS.length);

    for (const subpath of REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS) {
      assert.equal(
        findReactTestRendererConditionResolution(oracle, mode.id, subpath)
          .subpath,
        subpath
      );
    }
  }

  assert.equal(
    findReactTestRendererConditionResolution(oracle, "default-node", ".")
      .requireResolve.path,
    "node_modules/react-test-renderer/index.js"
  );
  assert.equal(
    findReactTestRendererConditionResolution(oracle, "react-server", ".")
      .requireResolve.path,
    "node_modules/react-test-renderer/index.js"
  );
  assert.equal(
    findReactTestRendererConditionResolution(oracle, "browser", "./shallow")
      .requireResolve.path,
    "node_modules/react-test-renderer/shallow.js"
  );
  assert.equal(
    findReactTestRendererConditionResolution(oracle, "deno", ".").requireResolve
      .path,
    "node_modules/react-test-renderer/index.js"
  );
});

test("create() deprecation warning surface and React Native test global branch are recorded", () => {
  assert.deepEqual(
    oracle.createWarningScenarios,
    REACT_TEST_RENDERER_EXPORT_CREATE_WARNING_SCENARIOS
  );

  const developmentDefault = findReactTestRendererCreateWarningObservation(
    oracle,
    "development-default-global"
  );
  assert.deepEqual(developmentDefault.warnings, [
    [
      "react-test-renderer is deprecated. See https://react.dev/warnings/react-test-renderer"
    ]
  ]);

  for (const scenario of [
    "development-react-native-test-global",
    "production-default-global",
    "production-react-native-test-global"
  ]) {
    assert.deepEqual(
      findReactTestRendererCreateWarningObservation(oracle, scenario).warnings,
      []
    );
  }

  for (const observation of oracle.createWarningObservations) {
    assert.equal(observation.create.status, "ok", observation.id);
    assert.deepEqual(observation.create.renderer.exportKeys, [
      "_Scheduler",
      "root",
      "toJSON",
      "toTree",
      "update",
      "unmount",
      "getInstance",
      "unstable_flushSync"
    ]);
    assert.deepEqual(observation.create.rootDescriptor, {
      kind: "accessor",
      enumerable: true,
      configurable: true,
      get: {
        type: "function",
        name: "get",
        length: 0
      },
      set: {
        type: "undefined"
      }
    });
  }
});

test("shallow removal is captured for both shallow entrypoints in every mode", () => {
  assert.deepEqual(
    oracle.shallowSubpaths,
    REACT_TEST_RENDERER_EXPORT_SHALLOW_SUBPATHS
  );

  for (const mode of REACT_TEST_RENDERER_EXPORT_PROBE_MODES) {
    const observations = oracle.shallowRemovalObservations[mode.id];
    assert.equal(
      observations.length,
      REACT_TEST_RENDERER_EXPORT_SHALLOW_SUBPATHS.length
    );

    for (const subpath of REACT_TEST_RENDERER_EXPORT_SHALLOW_SUBPATHS) {
      const observation = findReactTestRendererShallowRemovalObservation(
        oracle,
        mode.id,
        subpath
      );
      assert.equal(observation.require.status, "ok");
      assert.equal(observation.require.objectTag, "[object Function]");
      assert.deepEqual(observation.require.exportKeys, []);
      assert.deepEqual(observation.callWithoutNew, shallowRemovedError());
      assert.deepEqual(observation.constructWithNew, shallowRemovedError());
    }
  }
});

test("React Test Renderer export oracle artifact does not leak generation paths", () => {
  const oracleText = readCheckedReactTestRendererExportOracleText();
  assert.doesNotMatch(oracleText, /\/private\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/var\/folders/u);
  assert.doesNotMatch(oracleText, /\/tmp\//u);
  assert.doesNotMatch(
    oracleText,
    /fast-react-react-test-renderer-export-oracle-[A-Za-z0-9]/u
  );
  assert.doesNotMatch(
    oracleText,
    /\/Users\/user\/Developer\/Developer/u
  );

  for (const observations of Object.values(oracle.runtimeExportObservations)) {
    for (const observation of observations) {
      if (observation.requireResolve.status === "ok") {
        assert.match(observation.requireResolve.path, /^node_modules\//u);
      }
      for (const file of observation.finalCacheFiles ?? []) {
        assert.match(file, /^node_modules\//u);
      }
    }
  }

  for (const resolutions of Object.values(oracle.conditionResolution)) {
    for (const resolution of resolutions) {
      if (resolution.requireResolve.status === "ok") {
        assert.match(resolution.requireResolve.path, /^node_modules\//u);
      }
      if (resolution.importMetaResolve.status === "ok") {
        assert.match(resolution.importMetaResolve.url, /^file:\/\/node_modules\//u);
      }
    }
  }
});

test("print React Test Renderer export oracle CLI emits the checked-in artifact", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-react-test-renderer-export-oracle.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024
    }
  );

  assert.equal(output, readCheckedReactTestRendererExportOracleText());
});

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

function shallowRemovedError() {
  return {
    status: "throws",
    name: "Error",
    code: null,
    message:
      "react-test-renderer/shallow has been removed. See https://react.dev/warnings/react-test-renderer."
  };
}
