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

import {
  DOM_NAMESPACE_SVG_CLIENT_SCENARIOS,
  DOM_NAMESPACE_SVG_SERVER_SCENARIOS
} from "./dom-namespace-svg-scenarios.mjs";
import {
  DOM_NAMESPACE_SVG_NAMESPACES,
  DOM_NAMESPACE_SVG_PROBE_MODES,
  DOM_NAMESPACE_SVG_REACT_DOM_TARGET,
  DOM_NAMESPACE_SVG_RUNTIME_INVENTORY_PATH,
  DOM_NAMESPACE_SVG_SOURCE_DOCUMENTS,
  DOM_NAMESPACE_SVG_SUPPORTING_TARGETS
} from "./dom-namespace-svg-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-dom-namespace-svg-oracle-";

export async function generateDomNamespaceSvgOracle() {
  const inventoryText = readFileSync(
    new URL(`../${DOM_NAMESPACE_SVG_RUNTIME_INVENTORY_PATH}`, import.meta.url),
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
      DOM_NAMESPACE_SVG_REACT_DOM_TARGET.packageName,
      ...DOM_NAMESPACE_SVG_SUPPORTING_TARGETS.map((target) => target.packageName)
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

    const probeFile = writeProbeFiles(projectRoot);
    const serverObservations = {};
    const clientObservations = {};

    for (const mode of DOM_NAMESPACE_SVG_PROBE_MODES) {
      serverObservations[mode.id] = DOM_NAMESPACE_SVG_SERVER_SCENARIOS.map(
        (scenario) =>
          runDomNamespaceSvgProbe({
            action: "server",
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            scenarioId: scenario.id
          })
      );
      clientObservations[mode.id] = DOM_NAMESPACE_SVG_CLIENT_SCENARIOS.map(
        (scenario) =>
          runDomNamespaceSvgProbe({
            action: "client",
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            scenarioId: scenario.id
          })
      );
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-dom-namespace-svg-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 namespace, SVG, and MathML host output oracle",
      sources: DOM_NAMESPACE_SVG_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per probe mode, action, and scenario",
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
        reactDomServerOutputProbed: true,
        reactDomClientFakeDomHostOutputProbed: true,
        namespaceCreationObserved: true,
        namespacedAttributeOperationsObserved: true,
        consoleWarningsCaptured: true,
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
        path: DOM_NAMESPACE_SVG_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomRuntimeInventoryMatched: true
      },
      reactDomTarget: DOM_NAMESPACE_SVG_REACT_DOM_TARGET,
      supportingRuntimePackages: DOM_NAMESPACE_SVG_SUPPORTING_TARGETS,
      namespaces: DOM_NAMESPACE_SVG_NAMESPACES,
      probeModes: DOM_NAMESPACE_SVG_PROBE_MODES,
      serverScenarios: DOM_NAMESPACE_SVG_SERVER_SCENARIOS,
      clientScenarios: DOM_NAMESPACE_SVG_CLIENT_SCENARIOS,
      packages,
      serverObservations,
      clientObservations,
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM behavior only; Fast React React DOM rendering behavior is not implemented in this worker scope."
        },
        {
          id: "client-probes-use-deterministic-fake-dom",
          reason:
            "Client probes record React DOM host API calls against a deterministic fake DOM so namespace and attribute decisions are observable without adding jsdom or browser dependencies. They do not claim browser parser, layout, focus, event, or platform API parity."
        },
        {
          id: "no-hydration-or-update-diffing",
          reason:
            "Hydration, mismatch handling, event delegation, resource hints, controlled forms, style diffing, and update/removal behavior are separate oracle tracks."
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

  const expectedTargets = [
    DOM_NAMESPACE_SVG_REACT_DOM_TARGET,
    ...DOM_NAMESPACE_SVG_SUPPORTING_TARGETS
  ];

  for (const target of expectedTargets) {
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
    sourceInventory.packages[DOM_NAMESPACE_SVG_REACT_DOM_TARGET.packageName];
  for (const subpath of ["./client", "./server", "./server.node"]) {
    if (!reactDomPackage.runtimeSubpaths.includes(subpath)) {
      throw new Error(
        `react-dom inventory is missing required runtime subpath ${subpath}`
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

function writeProbeFiles(projectRoot) {
  const probeFile = join(projectRoot, "dom-namespace-svg-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./dom-namespace-svg-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  writeFileSync(
    join(projectRoot, "dom-namespace-svg-scenarios.mjs"),
    readFileSync(
      new URL("./dom-namespace-svg-scenarios.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  writeFileSync(
    join(projectRoot, "dom-namespace-svg-targets.mjs"),
    readFileSync(
      new URL("./dom-namespace-svg-targets.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runDomNamespaceSvgProbe({
  action,
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenarioId
}) {
  const result = runProbe({
    args: [action, scenarioId],
    env: {
      NODE_ENV: mode.nodeEnv
    },
    probeFile,
    projectRoot
  });

  return normalizeProbeResult({
    packageName: DOM_NAMESPACE_SVG_REACT_DOM_TARGET.packageName,
    packageRoots,
    result
  });
}

function runProbe({ args, env = {}, probeFile, projectRoot }) {
  const spawnResult = spawnSync(process.execPath, [probeFile, ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env
    },
    timeout: PROBE_TIMEOUT_MS
  });

  const command = `node ${basename(probeFile)} ${args.join(" ")}`;
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

function normalizeProbeResult({ packageName, packageRoots, result }) {
  return normalizeDeep({
    packageName,
    packageRoots,
    value: result
  });
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

  if (typeof value === "string") {
    return normalizePathInMessage({
      packageName,
      packageRoots,
      message: value
    });
  }

  if (!value || typeof value !== "object") {
    return value;
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
