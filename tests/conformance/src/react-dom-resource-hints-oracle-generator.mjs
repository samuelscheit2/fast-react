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

import { REACT_DOM_RESOURCE_HINT_SCENARIOS } from "./react-dom-resource-hints-scenarios.mjs";
import {
  REACT_DOM_RESOURCE_HINT_APIS,
  REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH,
  REACT_DOM_RESOURCE_HINT_PRIVATE_DISPATCHER_METHODS,
  REACT_DOM_RESOURCE_HINT_PROBE_MODES,
  REACT_DOM_RESOURCE_HINT_RUNTIME_INVENTORY_PATH,
  REACT_DOM_RESOURCE_HINT_SOURCE_DOCUMENTS,
  REACT_DOM_RESOURCE_HINT_SUPPORTING_TARGETS,
  REACT_DOM_RESOURCE_HINT_TARGET
} from "./react-dom-resource-hints-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-resource-hints-oracle-";

export async function generateReactDomResourceHintsOracle() {
  const inventoryText = readFileSync(
    new URL(`../${REACT_DOM_RESOURCE_HINT_RUNTIME_INVENTORY_PATH}`, import.meta.url),
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
      REACT_DOM_RESOURCE_HINT_TARGET.packageName,
      ...REACT_DOM_RESOURCE_HINT_SUPPORTING_TARGETS.map(
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
    const observations = {};

    for (const mode of REACT_DOM_RESOURCE_HINT_PROBE_MODES) {
      observations[mode.id] = REACT_DOM_RESOURCE_HINT_SCENARIOS.map((scenario) =>
        runReactDomResourceHintProbe({
          mode,
          packageRoots,
          probeFile,
          projectRoot,
          scenario
        })
      );
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-resource-hints-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel: "React DOM 19.2.6 resource hint API oracle",
      sources: REACT_DOM_RESOURCE_HINT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per React DOM resource-hint scenario and mode",
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
        publicResourceHintCallsProbed: true,
        publicReturnValuesProbed: true,
        developmentDiagnosticsProbed: true,
        productionWarningAbsenceProbed: true,
        defaultNoopDispatcherBehaviorProbed: true,
        privateDispatcherNormalizationProbed: true,
        privateDispatcherAbsenceFailureShapeProbed: true,
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
        path: REACT_DOM_RESOURCE_HINT_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomRootResourceHintExportsMatched: true
      },
      reactDomTarget: REACT_DOM_RESOURCE_HINT_TARGET,
      supportingRuntimePackages: REACT_DOM_RESOURCE_HINT_SUPPORTING_TARGETS,
      resourceHintApis: REACT_DOM_RESOURCE_HINT_APIS,
      privateResourceDispatcherMethods:
        REACT_DOM_RESOURCE_HINT_PRIVATE_DISPATCHER_METHODS,
      probeModes: REACT_DOM_RESOURCE_HINT_PROBE_MODES,
      scenarios: REACT_DOM_RESOURCE_HINT_SCENARIOS,
      packages,
      observations,
      privateInternalsPolicy: {
        publicCompatibilitySurface:
          "Function descriptors, warning calls, thrown values, and return values from ReactDOM public resource hint APIs.",
        privateEvidenceOnly:
          "ReactDOMSharedInternals.d method names and normalized dispatcher arguments are recorded only to identify implementation root causes. They are not public API compatibility promises."
      },
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM package behavior only; Fast React React DOM implementation is owned by separate workers and remains unclaimed here."
        },
        {
          id: "private-dispatcher-normalization-is-not-public-api",
          reason:
            "Argument normalization is observed by mutating React DOM private internals. The public contract is limited to call outcomes, warnings, throws, and return values."
        },
        {
          id: "no-dom-or-server-rendering-resource-effects",
          reason:
            "The oracle does not create DOM nodes, render roots, run Fizz, assert inserted preload/link tags, or assert response headers."
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

  const reactDomPackage =
    sourceInventory.packages?.[REACT_DOM_RESOURCE_HINT_TARGET.packageName];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }

  for (const packageName of [
    REACT_DOM_RESOURCE_HINT_TARGET.packageName,
    ...REACT_DOM_RESOURCE_HINT_SUPPORTING_TARGETS.map(
      (target) => target.packageName
    )
  ]) {
    if (!sourceInventory.packages?.[packageName]) {
      throw new Error(
        `Checked runtime inventory does not include package ${packageName}`
      );
    }
  }

  for (const mode of REACT_DOM_RESOURCE_HINT_PROBE_MODES) {
    const rootProbe = sourceInventory.runtimeProbes?.[mode.id]?.find(
      (probe) =>
        probe.packageName === REACT_DOM_RESOURCE_HINT_TARGET.packageName &&
        probe.subpath === "."
    );
    if (!rootProbe || rootProbe.require.status !== "ok") {
      throw new Error(`Missing checked React DOM root probe for ${mode.id}`);
    }

    for (const api of REACT_DOM_RESOURCE_HINT_APIS) {
      if (!rootProbe.require.exportKeys.includes(api)) {
        throw new Error(
          `Checked React DOM root probe ${mode.id} is missing export ${api}`
        );
      }
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
  const probeFile = join(projectRoot, "react-dom-resource-hints-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-dom-resource-hints-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomResourceHintProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenario
}) {
  const packageName = REACT_DOM_RESOURCE_HINT_TARGET.packageName;
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    args: [packageName, scenario.id],
    env: {
      NODE_ENV: mode.nodeEnv
    }
  });

  return {
    scenarioId: scenario.id,
    packageName,
    specifier: packageName,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    observationKind: scenario.observationKind,
    result: normalizeDeep({
      packageName,
      packageRoots,
      value: result.result
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
    return typeof value === "string"
      ? normalizePathInMessage({
          packageName,
          packageRoots,
          message: value
        })
      : value;
  }

  const normalized = {};
  for (const [key, child] of Object.entries(value)) {
    normalized[key] = normalizeDeep({
      packageName,
      packageRoots,
      value: child
    });
  }
  return normalized;
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
    .replace(
      /file:\/\/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu,
      "file://<temp>"
    )
    .replace(
      /(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu,
      "<temp>"
    )
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

export { REACT_DOM_RESOURCE_HINT_ORACLE_ARTIFACT_PATH };
