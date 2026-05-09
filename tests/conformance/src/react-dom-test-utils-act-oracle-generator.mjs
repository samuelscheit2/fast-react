import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { get } from "node:https";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";

import { REACT_DOM_TEST_UTILS_ACT_SCENARIOS } from "./react-dom-test-utils-act-scenarios.mjs";
import {
  REACT_DOM_TEST_UTILS_ACT_PROBE_MODES,
  REACT_DOM_TEST_UTILS_ACT_RUNTIME_INVENTORY_PATH,
  REACT_DOM_TEST_UTILS_ACT_SOURCE_DOCUMENTS,
  REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS,
  REACT_DOM_TEST_UTILS_ACT_TARGET
} from "./react-dom-test-utils-act-targets.mjs";
import { packageSpecifier, runtimeProbeId } from "./runtime-inventory.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-test-utils-act-oracle-";

export async function generateReactDomTestUtilsActOracle() {
  const inventoryText = readFileSync(
    new URL(
      `../${REACT_DOM_TEST_UTILS_ACT_RUNTIME_INVENTORY_PATH}`,
      import.meta.url
    ),
    "utf8"
  );
  const sourceInventory = JSON.parse(inventoryText);
  const sourceInventorySha256 = createHash("sha256")
    .update(inventoryText)
    .digest("hex");

  validateCheckedInventory(sourceInventory);

  const tempRoot = mkdtempSync(join(tmpdir(), ORACLE_TEMP_PREFIX));

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const packageNames = [
      REACT_DOM_TEST_UTILS_ACT_TARGET.packageName,
      ...REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS.map(
        (target) => target.packageName
      )
    ];
    const packageRoots = new Map();
    const packages = {};

    for (const packageName of packageNames) {
      const packageEvidence = await fetchAndExtractInventoryPackage({
        nodeModulesRoot,
        packageName,
        sourceInventory,
        tempRoot
      });
      packages[packageName] = packageEvidence.inventory;
      packageRoots.set(packageName, realpathSync(packageEvidence.packageRoot));
    }

    const probeFile = writeProbeFile(projectRoot);
    const actObservations = {};

    for (const mode of REACT_DOM_TEST_UTILS_ACT_PROBE_MODES) {
      actObservations[mode.id] = REACT_DOM_TEST_UTILS_ACT_SCENARIOS.map(
        (scenario) =>
          runReactDomTestUtilsActProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            scenarioId: scenario.id
          })
      );
    }

    const checkedTestUtilsProbe = {};
    for (const mode of REACT_DOM_TEST_UTILS_ACT_PROBE_MODES) {
      const checkedProbe = findInventoryRuntimeProbe(
        sourceInventory,
        mode.id,
        REACT_DOM_TEST_UTILS_ACT_TARGET.subpath
      );
      checkedTestUtilsProbe[mode.id] = {
        requireResolve: checkedProbe.requireResolve,
        require: selectLoadSummary(checkedProbe.require),
        dynamicImport: selectLoadSummary(checkedProbe.dynamicImport)
      };
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-test-utils-act-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 react-dom/test-utils.act behavior oracle",
      sources: REACT_DOM_TEST_UTILS_ACT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation: "one Node child process per act scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        testUtilsActExportShapeProbed: true,
        descriptorBehaviorProbed: true,
        syncCallbackReturnProbed: true,
        asyncCallbackReturnProbed: true,
        thrownErrorsProbed: true,
        warningsProbed: true,
        thenableBehaviorProbed: true,
        publicReactActRelationshipProbed: true,
        fastReactComparedToReactDom: false
      },
      conformanceClaims: {
        realReactDomBehaviorProbed: true,
        fastReactComparedToReactDom: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      sourceInventory: {
        path: REACT_DOM_TEST_UTILS_ACT_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomTestUtilsRuntimeExportKeysMatched: true
      },
      reactDomTarget: REACT_DOM_TEST_UTILS_ACT_TARGET,
      supportingRuntimePackages: REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS,
      probeModes: REACT_DOM_TEST_UTILS_ACT_PROBE_MODES,
      scenarios: REACT_DOM_TEST_UTILS_ACT_SCENARIOS,
      packages,
      checkedTestUtilsProbe,
      actObservations,
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM test-utils behavior only; local Fast React React DOM behavior is not compared in this worker slice."
        },
        {
          id: "no-renderer-flush-semantics",
          reason:
            "The scenarios avoid DOM roots, component rendering, fake timers, Suspense rendering, and renderer work queues; those need separate renderer-backed oracles."
        },
        {
          id: "no-react-act-implementation-claim",
          reason:
            "The oracle observes the relationship to public React.act where exported, but implementing React.act itself belongs to the React package/runtime behavior surface."
        }
      ]
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

function validateCheckedInventory(sourceInventory) {
  if (sourceInventory.inventoryKind !== "react-19.2.6-runtime-package-inventory") {
    throw new Error(
      `Unexpected source inventory kind: ${sourceInventory.inventoryKind}`
    );
  }

  for (const target of [
    REACT_DOM_TEST_UTILS_ACT_TARGET,
    ...REACT_DOM_TEST_UTILS_ACT_SUPPORTING_TARGETS
  ]) {
    const inventoryPackage = sourceInventory.packages?.[target.packageName];
    if (!inventoryPackage) {
      throw new Error(
        `Checked runtime inventory does not include ${target.packageName}`
      );
    }
    if (inventoryPackage.version !== target.version) {
      throw new Error(
        `${target.packageName} inventory version mismatch: ${inventoryPackage.version}`
      );
    }
  }

  const reactDomPackage =
    sourceInventory.packages?.[REACT_DOM_TEST_UTILS_ACT_TARGET.packageName];
  if (
    !reactDomPackage.runtimeSubpaths.includes(
      REACT_DOM_TEST_UTILS_ACT_TARGET.subpath
    )
  ) {
    throw new Error("Checked runtime inventory does not include ./test-utils");
  }

  for (const mode of REACT_DOM_TEST_UTILS_ACT_PROBE_MODES) {
    const checkedProbe = findInventoryRuntimeProbe(
      sourceInventory,
      mode.id,
      REACT_DOM_TEST_UTILS_ACT_TARGET.subpath
    );
    assertDeepEqual(
      selectLoadSummary(checkedProbe.require),
      {
        status: "ok",
        exportKeys: ["act"]
      },
      `${mode.id}: checked react-dom/test-utils require exports`
    );
    assertDeepEqual(
      selectLoadSummary(checkedProbe.dynamicImport),
      {
        status: "ok",
        exportKeys: ["act", "default", "module.exports"]
      },
      `${mode.id}: checked react-dom/test-utils dynamic import exports`
    );
  }
}

async function fetchAndExtractInventoryPackage({
  nodeModulesRoot,
  packageName,
  sourceInventory,
  tempRoot
}) {
  const inventoryPackage = sourceInventory.packages[packageName];
  const registry = inventoryPackage.registry ?? {};
  if (!registry.distTarball) {
    throw new Error(`${packageName} inventory did not include a tarball URL`);
  }
  if (!registry.distIntegrity) {
    throw new Error(`${packageName} inventory did not include dist.integrity`);
  }

  const tarballBytes = await fetchBytes(registry.distTarball);
  const integrity = verifyTarballIntegrity(
    registry.distIntegrity,
    tarballBytes
  );
  assertDeepEqual(
    integrity,
    {
      algorithm: inventoryPackage.tarball.integrityAlgorithm,
      digest: inventoryPackage.tarball.integrityDigest
    },
    `${packageName} tarball integrity`
  );

  const tarballRoot = join(tempRoot, "tarballs");
  mkdirSync(tarballRoot, { recursive: true });
  const tarballPath = join(
    tarballRoot,
    `${packageName.replaceAll("/", "__")}-${inventoryPackage.version}.tgz`
  );
  writeFileSync(tarballPath, tarballBytes);

  const tarballFiles = listTarballFiles(tarballPath);
  assertDeepEqual(
    tarballFiles,
    inventoryPackage.tarball.files,
    `${packageName} tarball file list`
  );

  const packageRoot = joinPackagePath(nodeModulesRoot, packageName);
  mkdirSync(dirname(packageRoot), { recursive: true });
  mkdirSync(packageRoot, { recursive: true });
  extractTarball(tarballPath, packageRoot);

  const packageJson = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8")
  );
  if (packageJson.name !== inventoryPackage.packageName) {
    throw new Error(
      `${packageName} tarball package name mismatch: ${packageJson.name}`
    );
  }
  if (packageJson.version !== inventoryPackage.version) {
    throw new Error(
      `${packageName} tarball package version mismatch: ${packageJson.version}`
    );
  }

  return {
    packageRoot,
    inventory: {
      packageName: inventoryPackage.packageName,
      version: inventoryPackage.version,
      role: inventoryPackage.role,
      targetStatus: inventoryPackage.targetStatus,
      registry: inventoryPackage.registry,
      tarball: inventoryPackage.tarball,
      packageJson: inventoryPackage.packageJson,
      publicSubpaths: inventoryPackage.publicSubpaths,
      runtimeSubpaths: inventoryPackage.runtimeSubpaths,
      exportMapRows: inventoryPackage.exportMapRows
    }
  };
}

function writeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "react-dom-test-utils-act-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-dom-test-utils-act-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomTestUtilsActProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenarioId
}) {
  const result = runProbe({
    args: [scenarioId],
    env: {
      NODE_ENV: mode.nodeEnv
    },
    mode,
    probeFile,
    projectRoot
  });

  return {
    scenarioId,
    packageName: REACT_DOM_TEST_UTILS_ACT_TARGET.packageName,
    subpath: REACT_DOM_TEST_UTILS_ACT_TARGET.subpath,
    specifier: REACT_DOM_TEST_UTILS_ACT_TARGET.specifier,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    result: normalizeDeep({
      packageRoots,
      value: result.result
    }),
    consoleCalls: normalizeDeep({
      packageRoots,
      value: result.consoleCalls
    }),
    processEvents: normalizeDeep({
      packageRoots,
      value: result.processEvents
    })
  };
}

function runProbe({ args, env = {}, mode, probeFile, projectRoot }) {
  const spawnResult = spawnSync(
    process.execPath,
    [...mode.nodeArgs, probeFile, ...args],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        ...env
      },
      timeout: PROBE_TIMEOUT_MS
    }
  );

  const command = `node ${mode.nodeArgs.join(" ")} ${basename(
    probeFile
  )} ${args.join(" ")}`;
  if (spawnResult.error) {
    throw new Error(`${command} failed: ${spawnResult.error.message}`);
  }
  if (spawnResult.status !== 0) {
    throw new Error(`${command} exited ${spawnResult.status}: ${spawnResult.stderr}`);
  }

  try {
    return JSON.parse(spawnResult.stdout);
  } catch (error) {
    throw new Error(
      `${command} did not emit JSON: ${spawnResult.stdout}\n${error.message}`
    );
  }
}

function normalizeDeep({ packageRoots, value }) {
  if (Array.isArray(value)) {
    return value.map((child) =>
      normalizeDeep({
        packageRoots,
        value: child
      })
    );
  }

  if (typeof value === "string") {
    return normalizePathFragments({ packageRoots, value });
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const normalized = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "rawValue") {
      continue;
    }
    normalized[key] = normalizeDeep({
      packageRoots,
      value: child
    });
  }
  return normalized;
}

function normalizePathFragments({ packageRoots, value }) {
  let normalized = value;
  for (const [packageName, packageRoot] of packageRoots) {
    normalized = normalized.replaceAll(
      packageRoot,
      `node_modules/${packageName}`
    );
  }
  return normalizeGenericPath(normalized);
}

function normalizeGenericPath(value) {
  return value
    .replace(
      /file:\/\/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu,
      "file://<temp>"
    )
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "<temp>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
}

function selectLoadSummary(result) {
  if (result?.status === "throws") {
    return {
      status: result.status,
      name: result.name,
      code: result.code ?? null,
      message: result.message
    };
  }

  return {
    status: result?.status,
    exportKeys: result?.exportKeys ?? null
  };
}

function findInventoryRuntimeProbe(sourceInventory, modeId, subpath) {
  const probe = sourceInventory.runtimeProbes?.[modeId]?.find(
    (candidate) =>
      candidate.packageName === REACT_DOM_TEST_UTILS_ACT_TARGET.packageName &&
      candidate.subpath === subpath &&
      candidate.id ===
        runtimeProbeId(REACT_DOM_TEST_UTILS_ACT_TARGET.packageName, subpath) &&
      candidate.specifier ===
        packageSpecifier(REACT_DOM_TEST_UTILS_ACT_TARGET.packageName, subpath)
  );
  if (!probe) {
    throw new Error(`Missing checked runtime probe ${modeId}:${subpath}`);
  }
  return probe;
}

function fetchBytes(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, { timeout: FETCH_TIMEOUT_MS }, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        fetchBytes(new URL(response.headers.location, url).href)
          .then(resolve, reject);
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`GET ${url} returned ${response.statusCode}`));
          return;
        }

        resolve(Buffer.concat(chunks));
      });
    });
    request.on("timeout", () => {
      request.destroy(
        new Error(`GET ${url} timed out after ${FETCH_TIMEOUT_MS}ms`)
      );
    });
    request.on("error", reject);
  });
}

function verifyTarballIntegrity(integrity, bytes) {
  for (const part of integrity.split(/\s+/u)) {
    const separatorIndex = part.indexOf("-");
    if (separatorIndex === -1) {
      continue;
    }

    const algorithm = part.slice(0, separatorIndex);
    const expectedDigest = part.slice(separatorIndex + 1);
    if (!["sha512", "sha384", "sha256", "sha1"].includes(algorithm)) {
      continue;
    }

    const actualDigest = createHash(algorithm).update(bytes).digest("base64");
    if (actualDigest === expectedDigest) {
      return {
        algorithm,
        digest: actualDigest
      };
    }
  }

  throw new Error("Tarball integrity verification failed");
}

function listTarballFiles(tarballPath) {
  const result = spawnSync("tar", ["-tzf", tarballPath], {
    encoding: "utf8",
    timeout: PROBE_TIMEOUT_MS
  });
  assertSuccessfulSpawn(result, `tar -tzf ${basename(tarballPath)}`);

  return result.stdout
    .split("\n")
    .filter(Boolean)
    .map((file) => file.replace(/^package\//u, ""))
    .filter(Boolean)
    .sort();
}

function extractTarball(tarballPath, packageRoot) {
  const result = spawnSync(
    "tar",
    ["-xzf", tarballPath, "-C", packageRoot, "--strip-components=1"],
    {
      encoding: "utf8",
      timeout: PROBE_TIMEOUT_MS
    }
  );
  assertSuccessfulSpawn(result, `tar -xzf ${basename(tarballPath)}`);
}

function joinPackagePath(nodeModulesRoot, packageName) {
  return join(nodeModulesRoot, ...packageName.split("/"));
}

function assertSuccessfulSpawn(result, command) {
  if (result.error) {
    throw new Error(`${command} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${command} exited ${result.status}: ${result.stderr}`);
  }
}

function assertDeepEqual(actual, expected, label) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(
      `${label} mismatch\nactual: ${JSON.stringify(
        actual,
        null,
        2
      )}\nexpected: ${JSON.stringify(expected, null, 2)}`
    );
  }
}
