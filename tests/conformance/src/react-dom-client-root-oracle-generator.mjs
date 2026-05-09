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
  REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET,
  REACT_DOM_CLIENT_ROOT_PROBE_MODES,
  REACT_DOM_CLIENT_ROOT_RUNTIME_INVENTORY_PATH,
  REACT_DOM_CLIENT_ROOT_SOURCE_DOCUMENTS,
  REACT_DOM_CLIENT_ROOT_SUPPORTING_TARGETS,
  REACT_DOM_CLIENT_ROOT_TARGET
} from "./react-dom-client-root-targets.mjs";
import {
  REACT_DOM_CLIENT_ROOT_SCENARIOS
} from "./react-dom-client-root-scenarios.mjs";
import {
  stringifyReactDomClientRootOracle
} from "./react-dom-client-root-oracle.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-client-root-oracle-";

export async function generateReactDomClientRootOracle() {
  const inventoryText = readFileSync(
    new URL(`../${REACT_DOM_CLIENT_ROOT_RUNTIME_INVENTORY_PATH}`, import.meta.url),
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
      REACT_DOM_CLIENT_ROOT_TARGET.packageName,
      ...REACT_DOM_CLIENT_ROOT_SUPPORTING_TARGETS.map(
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

    const fastReactPackage = copyFastReactPackage({ nodeModulesRoot });
    packages[REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET.packageName] =
      fastReactPackage.inventory;
    packageRoots.set(
      REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET.packageName,
      realpathSync(fastReactPackage.packageRoot)
    );

    const probeFile = writeProbeFile(projectRoot);
    const reactDomObservations = {};
    const fastReactObservations = {};
    const fastReactComparisons = {};

    for (const mode of REACT_DOM_CLIENT_ROOT_PROBE_MODES) {
      reactDomObservations[mode.id] = [];
      fastReactObservations[mode.id] = [];
      fastReactComparisons[mode.id] = [];

      for (const scenario of REACT_DOM_CLIENT_ROOT_SCENARIOS) {
        const reactDomObservation = runReactDomClientRootProbe({
          mode,
          packageName: REACT_DOM_CLIENT_ROOT_TARGET.packageName,
          packageRoots,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });
        const fastReactObservation = runReactDomClientRootProbe({
          mode,
          packageName: REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET.packageName,
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
      oracleKind: "react-19.2.6-react-dom-client-root-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 client-root public behavior oracle",
      sources: REACT_DOM_CLIENT_ROOT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs and local Fast React React DOM placeholder copied into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per target package, client-root scenario, and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        domEnvironment:
          "controlled minimal DOM shim with normalized React marker summaries"
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        reactDomClientRootBehaviorProbed: true,
        createRootBehaviorProbed: true,
        rootRenderUnmountBehaviorProbed: true,
        containerValidationProbed: true,
        warningBehaviorProbed: true,
        optionStorageProbed: true,
        reactServerClientBranchProbed: true,
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
        path: REACT_DOM_CLIENT_ROOT_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion
      },
      reactDomTarget: REACT_DOM_CLIENT_ROOT_TARGET,
      supportingRuntimePackages: REACT_DOM_CLIENT_ROOT_SUPPORTING_TARGETS,
      fastReactTarget: REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET,
      probeModes: REACT_DOM_CLIENT_ROOT_PROBE_MODES,
      scenarios: REACT_DOM_CLIENT_ROOT_SCENARIOS,
      packages,
      coverage: {
        clientEntrypointShape: true,
        profilingCreateRootBoundary: true,
        validContainers: ["element", "document", "document-fragment"],
        invalidContainers: [
          "null",
          "undefined",
          "text",
          "comment",
          "plain-object"
        ],
        duplicateRootWarnings: true,
        legacyRootWarning: true,
        createRootOptionWarnings: true,
        rootOptionStorage: true,
        rootObjectShape: true,
        renderSecondArgumentWarnings: true,
        renderAfterUnmountError: true,
        unmountNoopAfterFirstUnmount: true,
        reactServerThrowingBranches: true,
        fastReactPlaceholderComparisonBoundaries: true
      },
      domShimCaveats: [
        "The probe uses a controlled DOM shim because the conformance workspace has no DOM test-environment dependency.",
        "The oracle records createRoot public validation, warnings, listener installation counts, marker presence, root object methods, and exposed root option storage; it does not claim browser layout, native event dispatch, or DOM mutation fidelity.",
        "Random React marker suffixes are intentionally normalized to marker counts and value kinds."
      ],
      intentionalGaps: [
        {
          id: "no-real-browser-execution",
          reason:
            "The oracle executes published React DOM in Node with a deterministic DOM shim, not in a browser engine."
        },
        {
          id: "no-hydration-root-semantics",
          reason:
            "hydrateRoot and hydration scheduling are separate public APIs owned by the hydration plan."
        },
        {
          id: "no-dom-mutation-render-output",
          reason:
            "The scenarios exercise root API scheduling boundaries and unmount flushing, but do not assert rendered DOM output."
        },
        {
          id: "no-event-dispatch-semantics",
          reason:
            "createRoot listener installation is recorded, while event plugin dispatch and priority handling remain separate oracle work."
        },
        {
          id: "no-transition-tracing-behavior",
          reason:
            "Stable React DOM 19.2.6 stores no user transition tracing/default indicator option fields for createRoot; transition scheduling behavior needs reconciler/scheduler-specific oracles."
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
    sourceInventory.packages?.[REACT_DOM_CLIENT_ROOT_TARGET.packageName];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }
  if (reactDomPackage.version !== REACT_DOM_CLIENT_ROOT_TARGET.version) {
    throw new Error(
      `react-dom inventory version mismatch: ${reactDomPackage.version}`
    );
  }
  for (const subpath of ["./client", "./profiling"]) {
    if (!reactDomPackage.runtimeSubpaths.includes(subpath)) {
      throw new Error(
        `Checked runtime inventory does not include react-dom ${subpath}`
      );
    }
  }

  for (const target of REACT_DOM_CLIENT_ROOT_SUPPORTING_TARGETS) {
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
    REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET.packageName
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
      packageName: REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET.packageName,
      version: packageJson.version,
      role: REACT_DOM_CLIENT_ROOT_FAST_REACT_TARGET.role,
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

function writeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "react-dom-client-root-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-dom-client-root-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomClientRootProbe({
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

function normalizePathFragments(message) {
  return message
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>");
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
      ? "Fast React React DOM currently throws structured placeholder or react-server unsupported errors for this client-root behavior."
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
      `${context.command} exited ${spawnResult.status}: ${spawnResult.stderr}`
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

export function stringifyGeneratedReactDomClientRootOracle(oracle) {
  return stringifyReactDomClientRootOracle(oracle);
}
