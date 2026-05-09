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
import { basename, dirname, join, sep } from "node:path";

import { stringifyReactDomFlushSyncBatchingOracle } from "./react-dom-flush-sync-batching-oracle.mjs";
import {
  REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS,
  REACT_DOM_FLUSH_SYNC_BATCHING_PROBE_MODES,
  REACT_DOM_FLUSH_SYNC_BATCHING_RUNTIME_INVENTORY_PATH,
  REACT_DOM_FLUSH_SYNC_BATCHING_SOURCE_DOCUMENTS,
  REACT_DOM_FLUSH_SYNC_BATCHING_SUPPORTING_TARGETS,
  REACT_DOM_FLUSH_SYNC_BATCHING_TARGET
} from "./react-dom-flush-sync-batching-targets.mjs";
import {
  REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIOS
} from "./react-dom-flush-sync-batching-scenarios.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-flush-sync-batching-oracle-";

export async function generateReactDomFlushSyncBatchingOracle() {
  const inventoryText = readFileSync(
    new URL(
      `../${REACT_DOM_FLUSH_SYNC_BATCHING_RUNTIME_INVENTORY_PATH}`,
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
      REACT_DOM_FLUSH_SYNC_BATCHING_TARGET.packageName,
      ...REACT_DOM_FLUSH_SYNC_BATCHING_SUPPORTING_TARGETS.map(
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
    const reactDomObservations = {};

    for (const mode of REACT_DOM_FLUSH_SYNC_BATCHING_PROBE_MODES) {
      reactDomObservations[mode.id] = [];

      for (const entrypoint of REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS) {
        for (const scenario of REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIOS) {
          if (!scenario.entrypoints.includes(entrypoint.publicSpecifier)) {
            continue;
          }

          reactDomObservations[mode.id].push(
            runReactDomFlushSyncBatchingProbe({
              entrypoint,
              mode,
              packageRoots,
              probeFile,
              projectRoot,
              scenarioId: scenario.id
            })
          );
        }
      }
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-flush-sync-batching-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 flushSync and unstable_batchedUpdates public behavior oracle",
      sources: REACT_DOM_FLUSH_SYNC_BATCHING_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per React DOM entrypoint, scenario, condition, and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary extraction roots and local workspace paths are normalized before artifact write"
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        flushSyncBehaviorProbed: true,
        unstableBatchedUpdatesBehaviorProbed: true,
        callableShapeProbed: true,
        returnValuesProbed: true,
        errorPropagationProbed: true,
        nestedCallsProbed: true,
        rootlessBehaviorProbed: true,
        publicSchedulerPriorityProbed: true,
        privateReactDomInternalsRead: false,
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
        path: REACT_DOM_FLUSH_SYNC_BATCHING_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomEntrypointsMatched: true,
        supportingPackagesMatched: true
      },
      reactDomTarget: REACT_DOM_FLUSH_SYNC_BATCHING_TARGET,
      supportingRuntimePackages:
        REACT_DOM_FLUSH_SYNC_BATCHING_SUPPORTING_TARGETS,
      probeModes: REACT_DOM_FLUSH_SYNC_BATCHING_PROBE_MODES,
      entrypoints: REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS,
      scenarios: REACT_DOM_FLUSH_SYNC_BATCHING_SCENARIOS,
      packages,
      coverage: {
        callableShape: true,
        callbackReturnValues: true,
        callbackArgumentForwarding: true,
        errorPropagationAndRestoration: true,
        nestedCalls: true,
        rootlessBehavior: true,
        reactServerAbsence: true,
        profilingEntrypoint: true,
        publicSchedulerPriorityObservation: true,
        privateInternalsAvoided: true
      },
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM behavior only; Fast React React DOM implementation work is owned by separate workers."
        },
        {
          id: "no-private-update-priority-reads",
          reason:
            "The priority probe uses only the public scheduler package and callback ordering. It does not read ReactDOMSharedInternals, lanes, or current update priority internals."
        },
        {
          id: "no-dom-root-commit-timing",
          reason:
            "This worker keeps the oracle rootless because the conformance workspace has no checked DOM implementation dependency; createRoot, hydration, and DOM commit behavior are covered by dedicated client-root and DOM workers."
        }
      ],
      reactDomObservations
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

  const reactDomPackage =
    sourceInventory.packages?.[REACT_DOM_FLUSH_SYNC_BATCHING_TARGET.packageName];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }
  if (reactDomPackage.version !== REACT_DOM_FLUSH_SYNC_BATCHING_TARGET.version) {
    throw new Error(
      `Checked runtime inventory has react-dom@${reactDomPackage.version}; expected ${REACT_DOM_FLUSH_SYNC_BATCHING_TARGET.version}`
    );
  }

  for (const entrypoint of REACT_DOM_FLUSH_SYNC_BATCHING_ENTRYPOINTS) {
    if (!reactDomPackage.publicSubpaths.includes(entrypoint.subpath)) {
      throw new Error(
        `Checked runtime inventory does not include React DOM public subpath ${entrypoint.subpath}`
      );
    }
  }

  for (const target of REACT_DOM_FLUSH_SYNC_BATCHING_SUPPORTING_TARGETS) {
    const packageEvidence = sourceInventory.packages?.[target.packageName];
    if (!packageEvidence) {
      throw new Error(
        `Checked runtime inventory does not include supporting package ${target.packageName}`
      );
    }
    if (packageEvidence.version !== target.version) {
      throw new Error(
        `Checked runtime inventory has ${target.packageName}@${packageEvidence.version}; expected ${target.version}`
      );
    }
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
  const probeFile = join(
    projectRoot,
    "react-dom-flush-sync-batching-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL(
        "./react-dom-flush-sync-batching-probe-runner.mjs",
        import.meta.url
      ),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomFlushSyncBatchingProbe({
  entrypoint,
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenarioId
}) {
  const result = runProbe({
    args: [
      REACT_DOM_FLUSH_SYNC_BATCHING_TARGET.packageName,
      entrypoint.id,
      entrypoint.subpath,
      entrypoint.publicSpecifier,
      scenarioId
    ],
    env: {
      NODE_ENV: mode.nodeEnv
    },
    mode,
    probeFile,
    projectRoot
  });

  assertDeepEqual(
    {
      targetPackage: result.targetPackage,
      entrypointId: result.entrypointId,
      entrypointSubpath: result.entrypointSubpath,
      specifier: result.specifier,
      scenarioId: result.scenarioId
    },
    {
      targetPackage: REACT_DOM_FLUSH_SYNC_BATCHING_TARGET.packageName,
      entrypointId: entrypoint.id,
      entrypointSubpath: entrypoint.subpath,
      specifier: entrypoint.publicSpecifier,
      scenarioId
    },
    `${mode.id}:${entrypoint.id}:${scenarioId} probe identity`
  );

  return {
    scenarioId,
    entrypointId: entrypoint.id,
    entrypointSubpath: entrypoint.subpath,
    specifier: entrypoint.publicSpecifier,
    packageName: REACT_DOM_FLUSH_SYNC_BATCHING_TARGET.packageName,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    result: normalizeProbeResult({
      packageRoots,
      value: result.result
    }),
    consoleCalls: normalizeProbeResult({
      packageRoots,
      value: result.consoleCalls
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

function normalizeProbeResult({ packageRoots, value }) {
  return normalizeDeep({
    packageRoots,
    value
  });
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
    return normalizePathInString({
      packageRoots,
      value
    });
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const normalized = {};
  for (const [key, child] of Object.entries(value)) {
    normalized[key] = normalizeDeep({
      packageRoots,
      value: child
    });
  }
  return normalized;
}

function normalizePathInString({ packageRoots, value }) {
  let normalized = value;
  for (const [packageName, packageRoot] of packageRoots) {
    normalized = normalized.replaceAll(
      packageRoot,
      `node_modules/${packageName}`
    );
    normalized = normalized.replaceAll(
      packageRoot.split(sep).join("/"),
      `node_modules/${packageName}`
    );
  }

  return normalized
    .replace(/file:\/\/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "file://<temp>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "<temp>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
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
