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
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REACT_DOM_EXPORT_BLOCKED_SUBPATH_MODES,
  REACT_DOM_EXPORT_CONDITION_MODES,
  REACT_DOM_EXPORT_PUBLIC_SUBPATHS,
  REACT_DOM_EXPORT_RUNTIME_INVENTORY_PATH,
  REACT_DOM_EXPORT_RUNTIME_SUBPATHS,
  REACT_DOM_EXPORT_PROBE_MODES,
  REACT_DOM_EXPORT_SOURCE_DOCUMENTS,
  REACT_DOM_EXPORT_SUPPORTING_TARGETS,
  REACT_DOM_EXPORT_TARGET
} from "./react-dom-export-targets.mjs";
import { packageSpecifier, runtimeProbeId } from "./runtime-inventory.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-export-oracle-";

export async function generateReactDomExportOracle() {
  const inventoryText = readFileSync(
    new URL(`../${REACT_DOM_EXPORT_RUNTIME_INVENTORY_PATH}`, import.meta.url),
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
      REACT_DOM_EXPORT_TARGET.packageName,
      ...REACT_DOM_EXPORT_SUPPORTING_TARGETS.map((target) => target.packageName)
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
    const runtimeExportObservations = {};

    for (const mode of REACT_DOM_EXPORT_PROBE_MODES) {
      runtimeExportObservations[mode.id] = REACT_DOM_EXPORT_RUNTIME_SUBPATHS.map(
        (subpath) =>
          runReactDomRuntimeProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            sourceInventory,
            subpath
          })
      );
    }

    const conditionResolution = {};

    for (const mode of REACT_DOM_EXPORT_CONDITION_MODES) {
      conditionResolution[mode.id] = REACT_DOM_EXPORT_PUBLIC_SUBPATHS.map(
        (subpath) =>
          runReactDomResolutionProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            sourceInventory,
            subpath
          })
      );
    }

    const blockedPhysicalSubpaths = getBlockedPhysicalSubpaths(
      sourceInventory.packages[REACT_DOM_EXPORT_TARGET.packageName]
    );
    const blockedPhysicalSubpathProbes = {};

    for (const mode of REACT_DOM_EXPORT_BLOCKED_SUBPATH_MODES) {
      blockedPhysicalSubpathProbes[mode.id] = blockedPhysicalSubpaths.map(
        (subpath) =>
          runReactDomBlockedSubpathProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            subpath
          })
      );
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-export-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel: "React DOM 19.2.6 runtime export oracle",
      sources: REACT_DOM_EXPORT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per React DOM subpath, condition, and mode",
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
        runtimeExportsProbed: true,
        descriptorShapeProbed: true,
        conditionResolutionProbed: true,
        blockedPhysicalSubpathsProbed: true,
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
        path: REACT_DOM_EXPORT_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomRuntimeExportKeysMatched: true,
        reactDomConditionResolutionMatched: true
      },
      reactDomTarget: REACT_DOM_EXPORT_TARGET,
      supportingRuntimePackages: REACT_DOM_EXPORT_SUPPORTING_TARGETS,
      probeModes: REACT_DOM_EXPORT_PROBE_MODES,
      conditionModes: REACT_DOM_EXPORT_CONDITION_MODES,
      blockedSubpathModes: REACT_DOM_EXPORT_BLOCKED_SUBPATH_MODES,
      runtimeSubpaths: REACT_DOM_EXPORT_RUNTIME_SUBPATHS,
      publicSubpaths: REACT_DOM_EXPORT_PUBLIC_SUBPATHS,
      blockedPhysicalSubpaths,
      packages,
      runtimeExportObservations,
      conditionResolution,
      blockedPhysicalSubpathProbes,
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM package behavior only; Fast React React DOM scaffolds are owned by a separate worker and are not required here."
        },
        {
          id: "node-condition-resolution-only",
          reason:
            "Browser, worker, edge-light, workerd, bun, and deno modes are Node resolver evidence with custom conditions, not execution in those runtimes."
        },
        {
          id: "no-rendering-semantics",
          reason:
            "Client roots, portals, resource dispatch, Fizz, static prerendering, hydration, DOM mutation, and event behavior are outside this export oracle."
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

  const reactDomPackage = sourceInventory.packages?.["react-dom"];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }

  assertDeepEqual(
    reactDomPackage.runtimeSubpaths,
    REACT_DOM_EXPORT_RUNTIME_SUBPATHS,
    "react-dom runtime subpaths"
  );
  assertDeepEqual(
    reactDomPackage.publicSubpaths,
    REACT_DOM_EXPORT_PUBLIC_SUBPATHS,
    "react-dom public subpaths"
  );

  const supportingNames = new Set(
    REACT_DOM_EXPORT_SUPPORTING_TARGETS.map((target) => target.packageName)
  );
  for (const packageName of supportingNames) {
    if (!sourceInventory.packages?.[packageName]) {
      throw new Error(
        `Checked runtime inventory does not include supporting package ${packageName}`
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
  const probeFile = join(projectRoot, "react-dom-export-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-dom-export-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomRuntimeProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  sourceInventory,
  subpath
}) {
  const packageName = REACT_DOM_EXPORT_TARGET.packageName;
  const specifier = packageSpecifier(packageName, subpath);
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    args: ["runtime", specifier],
    env: {
      NODE_ENV: mode.nodeEnv
    }
  });
  const observation = normalizeRuntimeProbeResult({
    mode,
    packageName,
    packageRoots,
    result,
    specifier,
    subpath
  });

  const checkedProbe = findInventoryRuntimeProbe(sourceInventory, mode.id, subpath);
  assertRuntimeProbeMatchesInventory(observation, checkedProbe, mode.id, subpath);

  return observation;
}

function runReactDomResolutionProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  sourceInventory,
  subpath
}) {
  const packageName = REACT_DOM_EXPORT_TARGET.packageName;
  const specifier = packageSpecifier(packageName, subpath);
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    args: ["resolution", specifier]
  });
  const observation = normalizeResolutionProbeResult({
    mode,
    packageName,
    packageRoots,
    result,
    specifier,
    subpath
  });

  const checkedProbe = findInventoryConditionProbe(
    sourceInventory,
    mode.id,
    subpath
  );
  assertConditionProbeMatchesInventory(observation, checkedProbe, mode.id, subpath);

  return observation;
}

function runReactDomBlockedSubpathProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  subpath
}) {
  const packageName = REACT_DOM_EXPORT_TARGET.packageName;
  const specifier = packageSpecifier(packageName, subpath);
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    args: ["resolution", specifier]
  });
  return normalizeResolutionProbeResult({
    mode,
    packageName,
    packageRoots,
    result,
    specifier,
    subpath
  });
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

function normalizeRuntimeProbeResult({
  mode,
  packageName,
  packageRoots,
  result,
  specifier,
  subpath
}) {
  return {
    id: runtimeProbeId(packageName, subpath),
    packageName,
    subpath,
    specifier,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    requireResolve: normalizeMaybeResolvedPath({
      packageName,
      packageRoots,
      result: result.requireResolve
    }),
    require: normalizeRuntimeLoadResult({
      packageName,
      packageRoots,
      result: result.require
    }),
    dynamicImport: normalizeRuntimeLoadResult({
      packageName,
      packageRoots,
      result: result.dynamicImport
    }),
    importInterop: result.importInterop ?? null
  };
}

function normalizeResolutionProbeResult({
  mode,
  packageName,
  packageRoots,
  result,
  specifier,
  subpath
}) {
  return {
    id: runtimeProbeId(packageName, subpath),
    packageName,
    subpath,
    specifier,
    conditionMode: mode.id,
    requireResolve: normalizeMaybeResolvedPath({
      packageName,
      packageRoots,
      result: result.requireResolve
    }),
    importMetaResolve: normalizeMaybeResolvedUrl({
      packageName,
      packageRoots,
      result: result.importMetaResolve
    })
  };
}

function normalizeRuntimeLoadResult({ packageName, packageRoots, result }) {
  if (result?.status === "throws") {
    return normalizeThrownResult({
      packageName,
      packageRoots,
      result
    });
  }

  return normalizeDeep({
    packageName,
    packageRoots,
    value: result
  });
}

function normalizeMaybeResolvedPath({ packageName, packageRoots, result }) {
  if (result?.status !== "ok") {
    return normalizeThrownResult({
      packageName,
      packageRoots,
      result
    });
  }

  return {
    ...result,
    path: normalizeResolvedPath({
      packageName,
      packageRoots,
      resolvedPath: result.path
    })
  };
}

function normalizeMaybeResolvedUrl({ packageName, packageRoots, result }) {
  if (result?.status !== "ok") {
    return normalizeThrownResult({
      packageName,
      packageRoots,
      result
    });
  }

  return {
    ...result,
    url: normalizeResolvedUrl({
      packageName,
      packageRoots,
      url: result.url
    })
  };
}

function normalizeThrownResult({ packageName, packageRoots, result }) {
  if (!result || result.status !== "throws") {
    return result;
  }

  return {
    ...result,
    message: normalizePathInMessage({
      packageName,
      packageRoots,
      message: result.message
    })
  };
}

function normalizeDeep({ packageName, packageRoots, value }) {
  if (Array.isArray(value)) {
    return value.map((child) =>
      normalizeDeep({
        packageName,
        packageRoots,
        value: child
      })
    );
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const normalized = {};
  for (const [key, child] of Object.entries(value)) {
    normalized[key] =
      typeof child === "string"
        ? normalizePathInMessage({
            packageName,
            packageRoots,
            message: child
          })
        : normalizeDeep({
            packageName,
            packageRoots,
            value: child
          });
  }
  return normalized;
}

function normalizeResolvedUrl({ packageName, packageRoots, url }) {
  if (!url || !url.startsWith("file:")) {
    return url;
  }

  return `file://${normalizeResolvedPath({
    packageName,
    packageRoots,
    resolvedPath: fileURLToPath(url)
  })}`;
}

function normalizeResolvedPath({ packageName, packageRoots, resolvedPath }) {
  if (!resolvedPath) {
    return null;
  }

  const packageRoot = packageRoots.get(packageName);
  if (!packageRoot) {
    return normalizeGenericPath(resolvedPath);
  }

  const realResolvedPath = realpathSync(resolvedPath);
  const relativePath = relative(packageRoot, realResolvedPath);
  if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
    return normalizeGenericPath(realResolvedPath);
  }

  return `node_modules/${packageName}/${relativePath.split(sep).join("/")}`;
}

function normalizePathInMessage({ packageName, packageRoots, message }) {
  if (!message) {
    return message;
  }

  let normalized = message;
  for (const [currentPackageName, packageRoot] of packageRoots) {
    normalized = normalized.replaceAll(
      packageRoot,
      `node_modules/${currentPackageName}`
    );
  }

  const packageRoot = packageRoots.get(packageName);
  if (packageRoot) {
    normalized = normalized.replaceAll(packageRoot, `node_modules/${packageName}`);
  }

  return normalizeGenericPath(normalized);
}

function normalizeGenericPath(value) {
  return value
    .replace(/file:\/\/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "file://<temp>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "<temp>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
}

function assertRuntimeProbeMatchesInventory(
  observation,
  checkedProbe,
  modeId,
  subpath
) {
  assertDeepEqual(
    observation.requireResolve,
    checkedProbe.requireResolve,
    `${modeId}:${subpath} require.resolve`
  );
  assertDeepEqual(
    selectLoadSummary(observation.require),
    selectLoadSummary(checkedProbe.require),
    `${modeId}:${subpath} require export summary`
  );
  assertDeepEqual(
    selectLoadSummary(observation.dynamicImport),
    selectLoadSummary(checkedProbe.dynamicImport),
    `${modeId}:${subpath} dynamic import export summary`
  );
}

function assertConditionProbeMatchesInventory(
  observation,
  checkedProbe,
  modeId,
  subpath
) {
  assertDeepEqual(
    selectResolutionSummary(observation.requireResolve),
    {
      status: checkedProbe.status,
      path: checkedProbe.path,
      errorCode: checkedProbe.error?.code ?? null
    },
    `${modeId}:${subpath} condition require.resolve`
  );
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

function selectResolutionSummary(result) {
  if (result?.status === "throws") {
    return {
      status: result.status,
      path: null,
      errorCode: result.code ?? null
    };
  }

  return {
    status: result?.status,
    path: result?.path ?? null,
    errorCode: null
  };
}

function findInventoryRuntimeProbe(sourceInventory, modeId, subpath) {
  const probe = sourceInventory.runtimeProbes?.[modeId]?.find(
    (candidate) =>
      candidate.packageName === REACT_DOM_EXPORT_TARGET.packageName &&
      candidate.subpath === subpath
  );
  if (!probe) {
    throw new Error(`Missing checked runtime probe ${modeId}:${subpath}`);
  }
  return probe;
}

function findInventoryConditionProbe(sourceInventory, modeId, subpath) {
  const probe = sourceInventory.conditionResolution?.[modeId]?.find(
    (candidate) =>
      candidate.packageName === REACT_DOM_EXPORT_TARGET.packageName &&
      candidate.subpath === subpath
  );
  if (!probe) {
    throw new Error(`Missing checked condition probe ${modeId}:${subpath}`);
  }
  return probe;
}

function getBlockedPhysicalSubpaths(reactDomPackage) {
  const publicSubpaths = new Set(reactDomPackage.publicSubpaths);
  return reactDomPackage.tarball.files
    .filter((file) => file.endsWith(".js"))
    .map((file) => `./${file}`)
    .filter((subpath) => !publicSubpaths.has(subpath))
    .sort();
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
