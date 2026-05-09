import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
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

import {
  stringifyReactDomRootRenderE2EOracle
} from "./react-dom-root-render-e2e-oracle.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_SCENARIOS
} from "./react-dom-root-render-e2e-scenarios.mjs";
import {
  REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET,
  REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES,
  REACT_DOM_ROOT_RENDER_E2E_RUNTIME_INVENTORY_PATH,
  REACT_DOM_ROOT_RENDER_E2E_SOURCE_DOCUMENTS,
  REACT_DOM_ROOT_RENDER_E2E_SUPPORTING_TARGETS,
  REACT_DOM_ROOT_RENDER_E2E_TARGET
} from "./react-dom-root-render-e2e-targets.mjs";

const PROBE_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-root-render-e2e-oracle-";

export async function generateReactDomRootRenderE2EOracle() {
  const inventoryText = readFileSync(
    new URL(
      `../${REACT_DOM_ROOT_RENDER_E2E_RUNTIME_INVENTORY_PATH}`,
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
      "react",
      REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName,
      ...REACT_DOM_ROOT_RENDER_E2E_SUPPORTING_TARGETS.map(
        (target) => target.packageName
      ).filter((packageName) => packageName !== "react")
    ];
    const packages = {};
    const packageRoots = new Map();

    for (const packageName of new Set(packageNames)) {
      const packageEvidence = await fetchAndExtractInventoryPackage({
        nodeModulesRoot,
        packageName,
        sourceInventory,
        tempRoot
      });
      packages[packageName] = packageEvidence.inventory;
      packageRoots.set(packageName, realpathSync(packageEvidence.packageRoot));
    }

    const fastReactPackage = copyFastReactPackage({ nodeModulesRoot });
    packages[REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName] =
      fastReactPackage.inventory;
    packageRoots.set(
      REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName,
      realpathSync(fastReactPackage.packageRoot)
    );

    const probeFile = writeProbeFiles(projectRoot);
    const reactDomObservations = {};
    const fastReactObservations = {};
    const fastReactComparisons = {};

    for (const mode of REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES) {
      reactDomObservations[mode.id] = [];
      fastReactObservations[mode.id] = [];
      fastReactComparisons[mode.id] = [];

      for (const scenario of REACT_DOM_ROOT_RENDER_E2E_SCENARIOS) {
        const reactDomObservation = runReactDomRootRenderE2EProbe({
          mode,
          packageName: REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName,
          packageRoots,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });
        const fastReactObservation = runReactDomRootRenderE2EProbe({
          mode,
          packageName: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName,
          packageRoots,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });

        reactDomObservations[mode.id].push(reactDomObservation);
        fastReactObservations[mode.id].push(fastReactObservation);
        fastReactComparisons[mode.id].push(
          compareFastReactToReactDom({
            fastReactObservation,
            mode,
            reactDomObservation,
            scenarioId: scenario.id
          })
        );
      }
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-root-render-e2e-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 root render/update/unmount e2e oracle",
      sources: REACT_DOM_ROOT_RENDER_E2E_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs and local Fast React React DOM placeholder copied into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per target package, root-render-e2e scenario, and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        domEnvironment:
          "controlled minimal DOM shim with deterministic mutation logs, sorted snapshots, and normalized React private marker summaries",
        pathNormalization:
          "temporary extraction paths, workspace paths, package paths, and React randomized private marker suffixes are not serialized"
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        reactDomCreateRootProbed: true,
        rootRenderReturnValuesProbed: true,
        rootUpdateBehaviorProbed: true,
        rootUnmountBehaviorProbed: true,
        containerChildMutationBehaviorProbed: true,
        markerCleanupProbed: true,
        warningBehaviorProbed: true,
        focusedErrorSurfaceProbed: true,
        fastReactComparedToReactDom: true
      },
      conformanceClaims: {
        realReactDomBehaviorCompared: true,
        fastReactComparedToReactDom: true,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      sourceInventory: {
        path: REACT_DOM_ROOT_RENDER_E2E_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomClientRuntimeExportMatched: true,
        reactDomRootRuntimeExportMatched: true
      },
      reactDomTarget: REACT_DOM_ROOT_RENDER_E2E_TARGET,
      supportingRuntimePackages: REACT_DOM_ROOT_RENDER_E2E_SUPPORTING_TARGETS,
      fastReactTarget: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET,
      probeModes: REACT_DOM_ROOT_RENDER_E2E_PROBE_MODES,
      scenarios: REACT_DOM_ROOT_RENDER_E2E_SCENARIOS,
      packages,
      coverage: {
        createRootNoRender: true,
        rootRenderReturnValues: true,
        initialHostRender: true,
        updateHostRender: true,
        replaceHostTree: true,
        renderNullClearsContainer: true,
        rootUnmountMarkerCleanup: true,
        doubleUnmountNoop: true,
        renderAfterUnmountError: true,
        flushSyncRootCommit: true,
        crossRootFlushSyncCallback: true,
        developmentWarnings: true,
        fastReactPlaceholderComparisonBoundaries: true
      },
      intentionalGaps: [
        {
          id: "no-browser-engine-execution",
          reason:
            "The oracle executes published React DOM in Node with a deterministic DOM shim, not a browser engine or jsdom."
        },
        {
          id: "no-hydration",
          reason:
            "hydrateRoot, hydration mismatch behavior, and hydration replay belong to separate hydration oracle work."
        },
        {
          id: "no-event-dispatch",
          reason:
            "Root listener installation may occur as a lifecycle side effect, but event plugin extraction, dispatch, bubbling, batching, and priority are separate oracle surfaces."
        },
        {
          id: "no-controlled-forms-or-resources",
          reason:
            "Controlled inputs/selects/textareas, form actions, resources, singletons, and Fizz/server behavior are outside this host-only root render path."
        },
        {
          id: "no-component-lifecycle-claim",
          reason:
            "The scenarios use host elements and text only, with no hooks, effects, refs, class lifecycle, Suspense, portals, or context behavior claims."
        },
        {
          id: "no-browser-layout-focus-selection-claim",
          reason:
            "The deterministic DOM shim does not model parser, layout, accessibility, focus, selection, CSS cascade, or custom element lifecycle behavior."
        }
      ],
      reactDomObservations,
      fastReactObservations,
      fastReactComparisons
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
    sourceInventory.packages?.[REACT_DOM_ROOT_RENDER_E2E_TARGET.packageName];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }
  if (reactDomPackage.version !== REACT_DOM_ROOT_RENDER_E2E_TARGET.version) {
    throw new Error(
      `react-dom inventory version mismatch: ${reactDomPackage.version}`
    );
  }
  for (const subpath of [".", "./client"]) {
    if (!reactDomPackage.runtimeSubpaths.includes(subpath)) {
      throw new Error(
        `Checked runtime inventory does not include react-dom ${subpath}`
      );
    }
  }

  for (const target of REACT_DOM_ROOT_RENDER_E2E_SUPPORTING_TARGETS) {
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

function copyFastReactPackage({ nodeModulesRoot }) {
  const sourceRoot = new URL("../../../packages/react-dom", import.meta.url);
  const packageRoot = joinPackagePath(
    nodeModulesRoot,
    REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName
  );
  mkdirSync(dirname(packageRoot), { recursive: true });
  cpSync(sourceRoot, packageRoot, {
    recursive: true,
    dereference: true,
    filter: (source) => basename(source) !== "node_modules"
  });

  const packageJson = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8")
  );

  return {
    packageRoot,
    inventory: {
      packageName: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.packageName,
      version: packageJson.version,
      role: REACT_DOM_ROOT_RENDER_E2E_FAST_REACT_TARGET.role,
      source: "local workspace package copied for placeholder behavior comparison",
      packageJson: {
        name: packageJson.name,
        version: packageJson.version,
        type: packageJson.type ?? null,
        main: packageJson.main ?? null,
        exports: packageJson.exports ?? null,
        dependencies: packageJson.dependencies ?? null,
        peerDependencies: packageJson.peerDependencies ?? null
      },
      behaviorCompatibilityClaimed: false
    }
  };
}

function writeProbeFiles(projectRoot) {
  const scenarioFile = join(projectRoot, "react-dom-root-render-e2e-scenarios.mjs");
  writeFileSync(
    scenarioFile,
    readFileSync(
      new URL("./react-dom-root-render-e2e-scenarios.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );

  const probeFile = join(projectRoot, "react-dom-root-render-e2e-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-dom-root-render-e2e-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomRootRenderE2EProbe({
  mode,
  packageName,
  packageRoots,
  probeFile,
  projectRoot,
  scenarioId
}) {
  const spawnResult = spawnSync(
    process.execPath,
    [...mode.nodeArgs, probeFile, packageName, scenarioId],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: mode.nodeEnv
      },
      timeout: PROBE_TIMEOUT_MS
    }
  );

  const result = parseProbeOutput(spawnResult, {
    command: `node ${mode.nodeArgs.join(" ")} ${basename(
      probeFile
    )} ${packageName} ${scenarioId}`
  });

  return {
    scenarioId,
    packageName,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    result: normalizeProbeResult(result, packageRoots)
  };
}

function normalizeProbeResult(result, packageRoots) {
  return normalizePackagePaths(normalizeErrorMessages(result), packageRoots);
}

function normalizeErrorMessages(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeErrorMessages);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "message" && typeof child === "string") {
      next[key] = normalizePathFragments(child);
    } else {
      next[key] = normalizeErrorMessages(child);
    }
  }
  return next;
}

function normalizePackagePaths(value, packageRoots) {
  if (Array.isArray(value)) {
    return value.map((child) => normalizePackagePaths(child, packageRoots));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    if ((key === "path" || key === "url") && typeof child === "string") {
      next[key] = normalizePackagePath(child, packageRoots);
    } else {
      next[key] = normalizePackagePaths(child, packageRoots);
    }
  }
  return next;
}

function normalizePackagePath(value, packageRoots) {
  const pathValue = value.startsWith("file://")
    ? new URL(value).pathname
    : value;

  for (const packageRoot of packageRoots.values()) {
    if (pathValue === packageRoot || pathValue.startsWith(`${packageRoot}${sep}`)) {
      const relativePath = relative(dirname(packageRoot), pathValue)
        .split(sep)
        .join("/");
      return value.startsWith("file://")
        ? `file://node_modules/${relativePath}`
        : `node_modules/${relativePath}`;
    }
  }

  return normalizePathFragments(value);
}

function normalizePathFragments(message) {
  return String(message)
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)]+/gu, "<workspace>");
}

function compareFastReactToReactDom({
  fastReactObservation,
  mode,
  reactDomObservation,
  scenarioId
}) {
  const reactComparableResult = comparableProbeResult(reactDomObservation.result);
  const fastReactComparableResult = comparableProbeResult(
    fastReactObservation.result
  );
  const firstDifferencePath = findFirstDifferencePath(
    reactComparableResult,
    fastReactComparableResult
  );
  const equal = firstDifferencePath === null;
  const fastReactUnsupported = containsFastReactDomPlaceholder(
    fastReactObservation.result
  );

  return {
    scenarioId,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    status: fastReactUnsupported
      ? "unsupported-placeholder"
      : equal
        ? "unexpected-match-compatibility-not-claimed"
        : "known-mismatch",
    compatibilityClaimed: false,
    firstDifferencePath,
    reactDomResultStatus: reactDomObservation.result.result?.status ?? null,
    fastReactResultStatus: fastReactObservation.result.result?.status ?? null,
    reason: fastReactUnsupported
      ? "Fast React React DOM currently throws structured placeholder errors for this root render e2e behavior."
      : equal
        ? "Normalized observations matched, but this oracle does not claim Fast React React DOM compatibility."
        : "Fast React React DOM normalized observation differs from the React DOM 19.2.6 oracle."
  };
}

function comparableProbeResult(result) {
  const { targetPackage: _targetPackage, ...behaviorResult } = result;
  return behaviorResult;
}

function containsFastReactDomPlaceholder(value) {
  if (Array.isArray(value)) {
    return value.some(containsFastReactDomPlaceholder);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  if (
    value.name === "FastReactDomUnimplementedError" ||
    value.name === "FastReactDomReactServerUnsupportedError" ||
    value.code === "FAST_REACT_UNIMPLEMENTED" ||
    value.code === "FAST_REACT_REACT_SERVER_UNSUPPORTED"
  ) {
    return true;
  }

  return Object.values(value).some(containsFastReactDomPlaceholder);
}

function findFirstDifferencePath(left, right, path = "$") {
  if (Object.is(left, right)) {
    return null;
  }

  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return path;
  }

  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  if (leftIsArray !== rightIsArray) {
    return path;
  }

  if (leftIsArray) {
    if (left.length !== right.length) {
      return `${path}.length`;
    }
    for (let index = 0; index < left.length; index += 1) {
      const childPath = findFirstDifferencePath(
        left[index],
        right[index],
        `${path}[${index}]`
      );
      if (childPath) {
        return childPath;
      }
    }
    return null;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return `${path}.keys`;
  }
  for (let index = 0; index < leftKeys.length; index += 1) {
    if (leftKeys[index] !== rightKeys[index]) {
      return `${path}.keys[${index}]`;
    }
  }
  for (const key of leftKeys) {
    const childPath = findFirstDifferencePath(
      left[key],
      right[key],
      `${path}.${key}`
    );
    if (childPath) {
      return childPath;
    }
  }
  return null;
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
  if (!integrity) {
    throw new Error("Package metadata did not include dist.integrity");
  }

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

function parseProbeOutput(spawnResult, context) {
  if (spawnResult.error) {
    throw new Error(`${context.command} failed: ${spawnResult.error.message}`);
  }
  if (spawnResult.status !== 0) {
    throw new Error(
      `${context.command} exited ${spawnResult.status}: ${normalizePathFragments(
        spawnResult.stderr
      )}`
    );
  }

  try {
    return JSON.parse(spawnResult.stdout);
  } catch (error) {
    throw new Error(
      `${context.command} did not emit JSON: ${spawnResult.stdout}\n${error.message}`
    );
  }
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
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${label} mismatch:\nactual: ${actualJson}\nexpected: ${expectedJson}`
    );
  }
}

function joinPackagePath(nodeModulesRoot, packageName) {
  return join(nodeModulesRoot, ...packageName.split("/"));
}

export function stringifyGeneratedReactDomRootRenderE2EOracle(oracle) {
  return stringifyReactDomRootRenderE2EOracle(oracle);
}
