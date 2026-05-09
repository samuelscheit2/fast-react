import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  CONDITION_RESOLUTION_MODES,
  GENERATED_RUNTIME_TARGETS,
  INVENTORY_ARTIFACT_PATH,
  MANUAL_INVENTORY_FIELDS,
  RUNTIME_PROBE_MODES
} from "../src/inventory-targets.mjs";
import {
  readCheckedRuntimeInventory,
  readCheckedRuntimeInventoryText
} from "../src/runtime-inventory.mjs";

const inventory = readCheckedRuntimeInventory();

test("checked runtime inventory artifact has the expected schema and targets", () => {
  assert.equal(
    INVENTORY_ARTIFACT_PATH,
    "inventory/react-19.2.6-runtime-package-inventory.json"
  );
  assert.equal(inventory.schemaVersion, 2);
  assert.equal(
    inventory.inventoryKind,
    "react-19.2.6-runtime-package-inventory"
  );
  assert.equal(inventory.generatedArtifacts, true);
  assert.equal(inventory.deterministic, true);
  assert.deepEqual(inventory.generation, {
    method:
      "npm registry metadata plus exact package tarballs extracted into a temporary node_modules tree",
    lifecycleScriptsExecuted: false,
    rootManifestsOrLockfilesMutated: false,
    probeIsolation: "one Node child process per entrypoint and mode",
    probeTimeoutMs: 10000,
    generatedTimestampIncluded: false
  });

  assert.deepEqual(inventory.runtimeTargets, GENERATED_RUNTIME_TARGETS);
  assert.equal(inventory.packages.react.version, "19.2.6");
  assert.equal(inventory.packages["react-dom"].version, "19.2.6");
  assert.equal(inventory.packages.scheduler.version, "0.27.0");

  assert.ok(
    inventory.packages.react.tarball.fileCount > 0,
    "react tarball file list should be generated"
  );
  assert.ok(
    inventory.packages["react-dom"].tarball.fileCount > 0,
    "react-dom tarball file list should be generated"
  );
  assert.equal(inventory.packages.react.tarball.integrityVerified, true);
  assert.equal(inventory.packages["react-dom"].tarball.integrityVerified, true);
});

test("runtime inventory keeps Fast React conformance claims false", () => {
  assert.deepEqual(inventory.conformanceClaims, {
    realReactBehaviorCompared: false,
    fastReactComparedToReact: false,
    fastReactBehaviorCompatible: false,
    fullDualRunOracleExists: false
  });
  assert.equal(inventory.evidenceClaims.typeDeclarationsParsed, false);
  assert.equal(inventory.evidenceClaims.fastReactComparedToReact, false);
  assert.deepEqual(inventory.manualInventoryFields, MANUAL_INVENTORY_FIELDS);
});

test("package export maps are generated for public React and React DOM subpaths", () => {
  assert.deepEqual(inventory.packages.react.publicSubpaths, [
    ".",
    "./package.json",
    "./jsx-runtime",
    "./jsx-dev-runtime",
    "./compiler-runtime"
  ]);
  assert.deepEqual(inventory.packages["react-dom"].publicSubpaths, [
    ".",
    "./client",
    "./server",
    "./server.browser",
    "./server.bun",
    "./server.edge",
    "./server.node",
    "./static",
    "./static.browser",
    "./static.edge",
    "./static.node",
    "./profiling",
    "./test-utils",
    "./package.json"
  ]);

  const reactDomServer = inventory.packages["react-dom"].exportMapRows.find(
    (row) => row.subpath === "./server"
  );
  assert.ok(reactDomServer, "react-dom/server export-map row should exist");
  assert.ok(
    reactDomServer.conditions.some(
      (condition) =>
        condition.conditionPath.join("/") === "react-server" &&
        condition.target === "./server.react-server.js"
    ),
    "react-dom/server should record the react-server target"
  );
  assert.ok(
    reactDomServer.conditions.some(
      (condition) =>
        condition.conditionPath.join("/") === "browser" &&
        condition.target === "./server.browser.js"
    ),
    "react-dom/server should record the browser target"
  );
});

test("runtime probes cover default and react-server development and production modes", () => {
  assert.deepEqual(inventory.runtimeProbeModes, RUNTIME_PROBE_MODES);

  for (const mode of RUNTIME_PROBE_MODES) {
    const probes = inventory.runtimeProbes[mode.id];
    assert.ok(Array.isArray(probes), `${mode.id} probes should exist`);

    for (const target of GENERATED_RUNTIME_TARGETS) {
      const runtimeSubpaths =
        inventory.packages[target.packageName].runtimeSubpaths;
      for (const subpath of runtimeSubpaths) {
        assert.ok(
          probes.some(
            (probe) =>
              probe.packageName === target.packageName &&
              probe.subpath === subpath
          ),
          `${mode.id} should probe ${target.packageName}:${subpath}`
        );
      }
    }
  }

  const developmentReact = findRuntimeProbe(
    "default-node-development",
    "react",
    "."
  );
  const productionReact = findRuntimeProbe(
    "default-node-production",
    "react",
    "."
  );

  assert.equal(developmentReact.require.status, "ok");
  assert.equal(productionReact.require.status, "ok");
  assert.ok(developmentReact.require.exportKeys.includes("act"));
  assert.ok(developmentReact.require.exportKeys.includes("captureOwnerStack"));
  assert.equal(productionReact.require.exportKeys.includes("act"), false);
  assert.equal(
    productionReact.require.exportKeys.includes("captureOwnerStack"),
    false
  );
});

test("react-server runtime probes record narrower surfaces and unsupported React DOM modules", () => {
  const reactServerReact = findRuntimeProbe(
    "react-server-production",
    "react",
    "."
  );
  assert.equal(reactServerReact.require.status, "ok");
  assert.equal(reactServerReact.require.exportKeys.includes("useState"), false);
  assert.ok(reactServerReact.require.exportKeys.includes("use"));
  assert.ok(
    reactServerReact.require.exportKeys.includes(
      "__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE"
    )
  );

  for (const subpath of [
    "./client",
    "./server",
    "./server.browser",
    "./server.bun",
    "./server.edge",
    "./server.node",
    "./static",
    "./static.browser",
    "./static.edge",
    "./static.node",
    "./profiling"
  ]) {
    const probe = findRuntimeProbe(
      "react-server-production",
      "react-dom",
      subpath
    );
    assert.equal(probe.require.status, "throws");
    assert.match(
      probe.require.message,
      /is not supported in React Server Components\./u
    );
  }
});

test("condition-resolution and blocked physical subpath evidence is explicit", () => {
  assert.deepEqual(inventory.conditionResolutionModes, CONDITION_RESOLUTION_MODES);

  for (const mode of CONDITION_RESOLUTION_MODES) {
    assert.ok(
      inventory.conditionResolution[mode.id].some(
        (probe) =>
          probe.packageName === "react-dom" && probe.subpath === "./server"
      ),
      `${mode.id} should include react-dom/server resolution evidence`
    );
  }

  assert.ok(
    inventory.blockedPhysicalSubpathProbes.some(
      (probe) =>
        probe.packageName === "react" &&
        probe.subpath === "./index.js" &&
        probe.status === "throws" &&
        probe.error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED"
    ),
    "react/index.js should be recorded as an unexported physical subpath"
  );
  assert.ok(
    inventory.blockedPhysicalSubpathProbes.some(
      (probe) =>
        probe.packageName === "react-dom" &&
        probe.subpath === "./server.js" &&
        probe.status === "throws" &&
        probe.error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED"
    ),
    "react-dom/server.js should be recorded as an unexported physical subpath"
  );
});

test("runtime inventory artifact does not leak temporary generation paths", () => {
  const inventoryText = readCheckedRuntimeInventoryText();
  assert.doesNotMatch(inventoryText, /\/private\/var\/folders/u);
  assert.doesNotMatch(inventoryText, /\/var\/folders/u);
  assert.doesNotMatch(
    inventoryText,
    /fast-react-runtime-inventory-[A-Za-z0-9]/u
  );

  for (const probes of Object.values(inventory.runtimeProbes)) {
    for (const probe of probes) {
      if (probe.requireResolve.status === "ok") {
        assert.match(probe.requireResolve.path, /^node_modules\//u);
      }
    }
  }

  for (const probes of Object.values(inventory.conditionResolution)) {
    for (const probe of probes) {
      if (probe.status === "ok") {
        assert.match(probe.path, /^node_modules\//u);
      }
    }
  }
});

test("print-inventory CLI emits the checked-in runtime inventory", () => {
  const output = execFileSync(
    process.execPath,
    ["scripts/print-inventory.mjs", "--format=json"],
    {
      cwd: new URL("..", import.meta.url),
      encoding: "utf8"
    }
  );

  assert.equal(output, readCheckedRuntimeInventoryText());
});

function findRuntimeProbe(modeId, packageName, subpath) {
  const probe = inventory.runtimeProbes[modeId]?.find(
    (candidate) =>
      candidate.packageName === packageName && candidate.subpath === subpath
  );
  assert.ok(probe, `missing runtime probe ${modeId}:${packageName}:${subpath}`);
  return probe;
}
