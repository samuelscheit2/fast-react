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
  REACT_DOM_CONTAINER_ROOT_MARKERS_INVALID_CONTAINER_CASES,
  REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES,
  REACT_DOM_CONTAINER_ROOT_MARKERS_RUNTIME_INVENTORY_PATH,
  REACT_DOM_CONTAINER_ROOT_MARKERS_SOURCE_DOCUMENTS,
  REACT_DOM_CONTAINER_ROOT_MARKERS_SUPPORTING_TARGETS,
  REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET,
  REACT_DOM_CONTAINER_ROOT_MARKERS_VALID_CONTAINER_CASES
} from "./react-dom-container-root-markers-targets.mjs";
import {
  stringifyReactDomContainerRootMarkersOracle
} from "./react-dom-container-root-markers-oracle.mjs";

const PROBE_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX =
  "fast-react-react-dom-container-root-markers-oracle-";

export async function generateReactDomContainerRootMarkersOracle() {
  const inventoryText = readFileSync(
    new URL(
      `../${REACT_DOM_CONTAINER_ROOT_MARKERS_RUNTIME_INVENTORY_PATH}`,
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
      REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET.packageName,
      ...REACT_DOM_CONTAINER_ROOT_MARKERS_SUPPORTING_TARGETS.map(
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
    const containerRootMarkerObservations = {};

    for (const mode of REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES) {
      containerRootMarkerObservations[mode.id] =
        runReactDomContainerRootMarkersProbe({
          mode,
          packageRoots,
          probeFile,
          projectRoot
        });
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-container-root-markers-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 createRoot container validation and root marker oracle",
      sources: REACT_DOM_CONTAINER_ROOT_MARKERS_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree and probed through a deterministic minimal DOM host",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per React DOM container root marker mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary roots, package roots, workspace paths, and randomized React container marker suffixes are normalized before artifact serialization"
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        reactDomClientCreateRootProbed: true,
        containerValidationProbed: true,
        duplicateRootWarningProbed: true,
        legacyRootWarningProbed: true,
        markerCleanupAfterUnmountProbed: true,
        noDirectDomChildMutationBeforeRenderProbed: true,
        deterministicMinimalDomUsed: true,
        deterministicPathNormalizationApplied: true,
        randomizedReactMarkerSuffixesSerialized: false,
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
        path: REACT_DOM_CONTAINER_ROOT_MARKERS_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomClientRuntimeExportMatched: true
      },
      reactDomTarget: REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET,
      supportingRuntimePackages:
        REACT_DOM_CONTAINER_ROOT_MARKERS_SUPPORTING_TARGETS,
      probeModes: REACT_DOM_CONTAINER_ROOT_MARKERS_PROBE_MODES,
      validContainerCases: REACT_DOM_CONTAINER_ROOT_MARKERS_VALID_CONTAINER_CASES,
      invalidContainerCases:
        REACT_DOM_CONTAINER_ROOT_MARKERS_INVALID_CONTAINER_CASES,
      packages,
      containerRootMarkerObservations,
      coverage: {
        validContainerCaseCount:
          REACT_DOM_CONTAINER_ROOT_MARKERS_VALID_CONTAINER_CASES.length,
        invalidContainerCaseCount:
          REACT_DOM_CONTAINER_ROOT_MARKERS_INVALID_CONTAINER_CASES.length,
        duplicateRootWarningProbe: true,
        legacyRootWarningProbe: true,
        unmountMarkerCleanupProbe: true,
        createRootNoRenderMutationProbe: true,
        privateRootMarkerPresenceSummarized: true,
        privateRootMarkerSuffixesOmitted: true
      },
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM 19.2.6 behavior only; Fast React DOM root implementation work is outside this worker scope."
        },
        {
          id: "minimal-dom-host-not-browser-matrix",
          reason:
            "The probe host implements deterministic DOM APIs needed for createRoot validation, marker writes, unmount cleanup, and listener installation side effects. Browser layout, parser, focus, selection, custom elements, and accessibility behavior are outside this oracle."
        },
        {
          id: "listener-installation-not-asserted",
          reason:
            "createRoot necessarily installs delegated listeners, but exact listener registration behavior belongs to the separate root-listener oracle track."
        },
        {
          id: "no-render-or-hydration-claim",
          reason:
            "The oracle probes createRoot before any root.render call and root.unmount after an empty root only; DOM commits, hydration, resources, forms, and event dispatch are separate React DOM surfaces."
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
    REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET,
    ...REACT_DOM_CONTAINER_ROOT_MARKERS_SUPPORTING_TARGETS
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

  const clientProbe = sourceInventory.runtimeProbes?.[
    "default-node-development"
  ]?.find(
    (probe) =>
      probe.packageName ===
        REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET.packageName &&
      probe.subpath === "./client"
  );
  if (!clientProbe || clientProbe.require.status !== "ok") {
    throw new Error(
      "Checked runtime inventory does not include a loadable react-dom/client probe"
    );
  }

  const reactDomPackage =
    sourceInventory.packages?.[
      REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET.packageName
    ];
  if (!reactDomPackage.runtimeSubpaths.includes("./client")) {
    throw new Error("react-dom inventory missing runtime subpath ./client");
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
    "react-dom-container-root-markers-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL(
        "./react-dom-container-root-markers-probe-runner.mjs",
        import.meta.url
      ),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomContainerRootMarkersProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot
}) {
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    env: {
      NODE_ENV: mode.nodeEnv
    }
  });

  return {
    packageName: REACT_DOM_CONTAINER_ROOT_MARKERS_TARGET.packageName,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    result: normalizeProbeResult({
      packageRoots,
      result
    })
  };
}

function runProbe({ env = {}, mode, probeFile, projectRoot }) {
  const spawnResult = spawnSync(process.execPath, [...mode.nodeArgs, probeFile], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env
    },
    timeout: PROBE_TIMEOUT_MS
  });

  const command = `node ${mode.nodeArgs.join(" ")} ${basename(probeFile)}`;
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

function normalizeProbeResult({ packageRoots, result }) {
  return normalizeDeep({
    packageRoots,
    value: result
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

  if (!value || typeof value !== "object") {
    return typeof value === "string"
      ? normalizePathInMessage({
          packageRoots,
          message: value
        })
      : value;
  }

  const normalized = {};
  for (const [key, child] of Object.entries(value)) {
    normalized[key] =
      typeof child === "string"
        ? normalizePathInMessage({
            packageRoots,
            message: child
          })
        : normalizeDeep({
            packageRoots,
            value: child
          });
  }
  return normalized;
}

function normalizePathInMessage({ packageRoots, message }) {
  if (!message) {
    return message;
  }

  let normalized = message;
  for (const [packageName, packageRoot] of packageRoots) {
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
    .replace(
      /\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu,
      "<workspace>"
    );
}

function fetchBytes(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, { timeout: FETCH_TIMEOUT_MS }, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        fetchBytes(new URL(response.headers.location, url).href).then(
          resolve,
          reject
        );
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

export function stringifyGeneratedReactDomContainerRootMarkersOracle(oracle) {
  return stringifyReactDomContainerRootMarkersOracle(oracle);
}
