import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { get } from "node:https";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";

import {
  REACT_DOM_SERVER_STATIC_SCENARIOS
} from "./react-dom-server-static-scenarios.mjs";
import {
  REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET,
  REACT_DOM_SERVER_STATIC_PROBE_MODES,
  REACT_DOM_SERVER_STATIC_REACT_DOM_TARGET,
  REACT_DOM_SERVER_STATIC_RUNTIME_INVENTORY_PATH,
  REACT_DOM_SERVER_STATIC_RUNTIME_SUBPATHS,
  REACT_DOM_SERVER_STATIC_SOURCE_DOCUMENTS,
  REACT_DOM_SERVER_STATIC_STATIC_SUBPATHS,
  REACT_DOM_SERVER_STATIC_SUPPORTING_TARGETS,
  REACT_DOM_SERVER_STATIC_SERVER_SUBPATHS
} from "./react-dom-server-static-targets.mjs";

const PROBE_TIMEOUT_MS = 20_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-server-static-oracle-";
const FAST_REACT_BOUNDARY_CODES = new Set([
  "FAST_REACT_UNIMPLEMENTED",
  "FAST_REACT_REACT_SERVER_UNSUPPORTED"
]);

export async function generateReactDomServerStaticOracle() {
  const inventoryText = readFileSync(
    new URL(`../${REACT_DOM_SERVER_STATIC_RUNTIME_INVENTORY_PATH}`, import.meta.url),
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

    const officialPackageNames = [
      REACT_DOM_SERVER_STATIC_REACT_DOM_TARGET.packageName,
      ...REACT_DOM_SERVER_STATIC_SUPPORTING_TARGETS.map(
        (target) => target.packageName
      )
    ];
    const packages = {};

    for (const packageName of officialPackageNames) {
      const packageEvidence = await fetchAndExtractInventoryPackage({
        nodeModulesRoot,
        packageName,
        sourceInventory,
        tempRoot
      });
      packages[packageName] = packageEvidence;
    }

    copyFastReactPackages({ nodeModulesRoot });

    const probeFile = writeProbeFile(projectRoot);
    const reactDomObservations = {};
    const fastReactDomObservations = {};
    const fastReactDomComparisons = {};

    for (const mode of REACT_DOM_SERVER_STATIC_PROBE_MODES) {
      reactDomObservations[mode.id] = [];
      fastReactDomObservations[mode.id] = [];
      fastReactDomComparisons[mode.id] = [];

      for (const scenario of REACT_DOM_SERVER_STATIC_SCENARIOS) {
        const reactDomObservation = runReactDomServerStaticProbe({
          mode,
          packageName: REACT_DOM_SERVER_STATIC_REACT_DOM_TARGET.packageName,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });
        const fastReactDomObservation = runReactDomServerStaticProbe({
          mode,
          packageName:
            REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET.packageName,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });

        reactDomObservations[mode.id].push(reactDomObservation);
        fastReactDomObservations[mode.id].push(fastReactDomObservation);
        fastReactDomComparisons[mode.id].push(
          compareFastReactDomToReactDom({
            fastReactDomObservation,
            mode,
            reactDomObservation,
            scenarioId: scenario.id
          })
        );
      }
    }

    const statusCounts = countComparisonStatuses(fastReactDomComparisons);

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-server-static-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 server/static behavior surface oracle",
      sources: REACT_DOM_SERVER_STATIC_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs and local Fast React DOM placeholders copied into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per target, server/static scenario, and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        streamNormalization:
          "stream probes record object shapes, callback labels, allReady resolution, and deterministic simple-markup bytes; raw timings are omitted"
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        reactDomServerStaticBehaviorProbed: true,
        fastReactDomComparedToReactDom: true,
        fastReactDomUnsupportedBoundariesCaptured: true,
        fizzImplemented: false
      },
      conformanceClaims: {
        realReactDomBehaviorCompared: true,
        fastReactDomComparedToReactDom: true,
        fastReactDomBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      implementationComparison: {
        currentFastReactDomServerStatic: {
          source:
            "local packages/react-dom server/static entrypoints copied for unsupported placeholder comparison",
          generatedProbe: true,
          statusCounts,
          compatibilityClaimed: false
        }
      },
      coverage: {
        serverStaticExportBehavior: true,
        reactServerConditionThrows: true,
        unsupportedPlaceholderComparisonBoundaries: true,
        legacyServerMarkup: true,
        fizzSuspenseMarkerEvidence: true,
        basicServerStreamShapeEvidence: true,
        basicStaticPrerenderShapeEvidence: true,
        basicErrorShapeEvidence: true,
        deferredResumeFizzBehavior: true,
        fizzImplementationAdded: false
      },
      deferredFizzBehavior: [
        {
          id: "no-fast-react-fizz-request-engine",
          reason:
            "Fast React does not yet implement the Fizz request, task, segment, boundary, abort, postpone, or resume model required by these React DOM APIs."
        },
        {
          id: "server-markup-is-react-evidence-only",
          reason:
            "React DOM legacy markup, Suspense markers, streams, and static prerender output are recorded as target behavior; Fast React observations intentionally stop at structured unsupported placeholders."
        },
        {
          id: "resume-state-remains-opaque",
          reason:
            "Resume and resume-and-prerender scenarios record invalid postponed-state boundaries but do not define or implement a Fast React postponed-state token."
        }
      ],
      sourceInventory: {
        path: REACT_DOM_SERVER_STATIC_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomServerStaticRuntimeSubpathsMatched: true
      },
      reactDomTarget: REACT_DOM_SERVER_STATIC_REACT_DOM_TARGET,
      fastReactDomTarget: REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET,
      supportingRuntimePackages: REACT_DOM_SERVER_STATIC_SUPPORTING_TARGETS,
      probeModes: REACT_DOM_SERVER_STATIC_PROBE_MODES,
      serverSubpaths: REACT_DOM_SERVER_STATIC_SERVER_SUBPATHS,
      staticSubpaths: REACT_DOM_SERVER_STATIC_STATIC_SUBPATHS,
      runtimeSubpaths: REACT_DOM_SERVER_STATIC_RUNTIME_SUBPATHS,
      scenarios: REACT_DOM_SERVER_STATIC_SCENARIOS,
      packages: {
        ...packages,
        "@fast-react/react-dom": {
          packageName:
            REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET.packageName,
          version: REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET.version,
          role: REACT_DOM_SERVER_STATIC_FAST_REACT_DOM_TARGET.role,
          source:
            "local workspace package copied for server/static placeholder comparison",
          behaviorCompatibilityClaimed: false
        },
        "@fast-react/react": {
          packageName: "@fast-react/react",
          version: "0.0.0",
          role: "workspace-fast-react-peer-for-placeholder-elements",
          source:
            "local workspace package copied so Fast React DOM placeholder calls receive Fast React element objects",
          behaviorCompatibilityClaimed: false
        }
      },
      reactDomObservations,
      fastReactDomObservations,
      fastReactDomComparisons
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
    sourceInventory.packages?.[
      REACT_DOM_SERVER_STATIC_REACT_DOM_TARGET.packageName
    ];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }

  for (const subpath of REACT_DOM_SERVER_STATIC_RUNTIME_SUBPATHS) {
    if (!reactDomPackage.runtimeSubpaths.includes(subpath)) {
      throw new Error(
        `Checked runtime inventory missing React DOM server/static subpath ${subpath}`
      );
    }
  }

  for (const target of REACT_DOM_SERVER_STATIC_SUPPORTING_TARGETS) {
    if (!sourceInventory.packages?.[target.packageName]) {
      throw new Error(
        `Checked runtime inventory does not include supporting package ${target.packageName}`
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
  };
}

function copyFastReactPackages({ nodeModulesRoot }) {
  copyWorkspacePackage({
    nodeModulesRoot,
    packageName: "@fast-react/react-dom",
    sourceUrl: new URL("../../../packages/react-dom", import.meta.url)
  });
  copyWorkspacePackage({
    nodeModulesRoot,
    packageName: "@fast-react/react",
    sourceUrl: new URL("../../../packages/react", import.meta.url)
  });
  copyWorkspacePackage({
    nodeModulesRoot,
    packageName: "scheduler",
    sourceUrl: new URL("../../../packages/scheduler", import.meta.url)
  });
}

function copyWorkspacePackage({ nodeModulesRoot, packageName, sourceUrl }) {
  const packageRoot = joinPackagePath(nodeModulesRoot, packageName);
  mkdirSync(dirname(packageRoot), { recursive: true });
  cpSync(sourceUrl, packageRoot, {
    recursive: true,
    dereference: true,
    filter: (source) => basename(source) !== "node_modules"
  });
}

function writeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "react-dom-server-static-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-dom-server-static-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomServerStaticProbe({
  mode,
  packageName,
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
    result: normalizeProbeResult(result)
  };
}

function normalizeProbeResult(result) {
  return normalizeErrorMessages(result);
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

function compareFastReactDomToReactDom({
  fastReactDomObservation,
  mode,
  reactDomObservation,
  scenarioId
}) {
  const reactComparableResult = comparableProbeResult(
    reactDomObservation.result
  );
  const fastReactComparableResult = comparableProbeResult(
    fastReactDomObservation.result
  );
  const firstDifferencePath = findFirstDifferencePath(
    reactComparableResult,
    fastReactComparableResult
  );
  const equal = firstDifferencePath === null;
  const fastReactBoundary = containsFastReactUnsupportedBoundary(
    fastReactDomObservation.result
  );

  return {
    scenarioId,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    status: fastReactBoundary
      ? "unsupported-placeholder"
      : equal
        ? "matched-but-compatibility-not-claimed"
        : "known-mismatch",
    compatibilityClaimed: false,
    firstDifferencePath,
    reactDomResultStatus: reactDomObservation.result.result?.status ?? null,
    fastReactDomResultStatus:
      fastReactDomObservation.result.result?.status ?? null,
    reason: fastReactBoundary
      ? "Fast React DOM currently exposes structured unsupported server/static placeholders instead of implementing Fizz behavior."
      : equal
        ? "Normalized observations matched, but this oracle does not claim Fast React DOM server/static compatibility."
        : "Fast React DOM observation differs from React DOM 19.2.6 behavior outside a recognized unsupported placeholder boundary."
  };
}

function comparableProbeResult(result) {
  return result;
}

function containsFastReactUnsupportedBoundary(value) {
  if (Array.isArray(value)) {
    return value.some(containsFastReactUnsupportedBoundary);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  if (
    value.isFastReactPlaceholder === true ||
    FAST_REACT_BOUNDARY_CODES.has(value.code)
  ) {
    return true;
  }

  if (
    typeof value.message === "string" &&
    value.message.includes("[fast-react]")
  ) {
    return true;
  }

  return Object.values(value).some(containsFastReactUnsupportedBoundary);
}

function countComparisonStatuses(comparisonsByMode) {
  const counts = {};
  for (const comparisons of Object.values(comparisonsByMode)) {
    for (const comparison of comparisons) {
      counts[comparison.status] = (counts[comparison.status] ?? 0) + 1;
    }
  }
  return counts;
}

function findFirstDifferencePath(left, right, path = "$") {
  if (Object.is(left, right)) {
    return null;
  }

  if (
    !left ||
    !right ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return path;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right)) {
      return path;
    }
    if (left.length !== right.length) {
      return `${path}.length`;
    }
    for (let index = 0; index < left.length; index += 1) {
      const difference = findFirstDifferencePath(
        left[index],
        right[index],
        `${path}[${index}]`
      );
      if (difference) {
        return difference;
      }
    }
    return null;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return `${path}.keys`;
  }

  for (const key of leftKeys) {
    if (!Object.hasOwn(right, key)) {
      return `${path}.${key}`;
    }
    const difference = findFirstDifferencePath(
      left[key],
      right[key],
      `${path}.${key}`
    );
    if (difference) {
      return difference;
    }
  }

  return null;
}

function parseProbeOutput(spawnResult, context) {
  if (spawnResult.error) {
    throw new Error(
      `${context.command} failed to start: ${spawnResult.error.message}`
    );
  }

  if (spawnResult.signal) {
    throw new Error(`${context.command} terminated by signal ${spawnResult.signal}`);
  }

  if (spawnResult.status !== 0 && !spawnResult.stdout) {
    throw new Error(
      `${context.command} exited with ${spawnResult.status}: ${spawnResult.stderr}`
    );
  }

  try {
    return JSON.parse(spawnResult.stdout);
  } catch (error) {
    throw new Error(
      `${context.command} did not produce JSON: ${error.message}\nstdout:\n${spawnResult.stdout}\nstderr:\n${spawnResult.stderr}`
    );
  }
}

function fetchBytes(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      const statusCode = response.statusCode ?? 0;
      if (
        statusCode >= 300 &&
        statusCode < 400 &&
        typeof response.headers.location === "string"
      ) {
        response.resume();
        resolve(fetchBytes(new URL(response.headers.location, url).toString()));
        return;
      }

      if (statusCode !== 200) {
        response.resume();
        reject(new Error(`GET ${url} returned HTTP ${statusCode}`));
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => {
        chunks.push(chunk);
      });
      response.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    request.setTimeout(FETCH_TIMEOUT_MS, () => {
      request.destroy(new Error(`GET ${url} timed out`));
    });
    request.on("error", reject);
  });
}

function verifyTarballIntegrity(distIntegrity, tarballBytes) {
  const delimiter = distIntegrity.indexOf("-");
  if (delimiter === -1) {
    throw new Error(`Unsupported integrity format: ${distIntegrity}`);
  }

  const algorithm = distIntegrity.slice(0, delimiter);
  const expectedDigest = distIntegrity.slice(delimiter + 1);
  const digest = createHash(algorithm).update(tarballBytes).digest("base64");
  if (digest !== expectedDigest) {
    throw new Error(
      `Tarball integrity mismatch for ${algorithm}: expected ${expectedDigest}, received ${digest}`
    );
  }

  return { algorithm, digest };
}

function listTarballFiles(tarballPath) {
  const result = spawnSync("tar", ["-tzf", tarballPath], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`tar -tzf failed: ${result.stderr}`);
  }

  return result.stdout
    .split("\n")
    .filter(Boolean)
    .map((entry) => entry.replace(/^package\//u, ""))
    .filter((entry) => entry.length > 0)
    .sort();
}

function extractTarball(tarballPath, packageRoot) {
  const result = spawnSync(
    "tar",
    ["-xzf", tarballPath, "-C", packageRoot, "--strip-components=1"],
    {
      encoding: "utf8"
    }
  );
  if (result.status !== 0) {
    throw new Error(`tar -xzf failed: ${result.stderr}`);
  }
}

function joinPackagePath(nodeModulesRoot, packageName) {
  if (!packageName.startsWith("@")) {
    return join(nodeModulesRoot, packageName);
  }

  const [scope, name] = packageName.split("/");
  return join(nodeModulesRoot, scope, name);
}

function assertDeepEqual(actual, expected, label) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(
      `${label} mismatch:\nexpected ${expectedText}\nreceived ${actualText}`
    );
  }
}
