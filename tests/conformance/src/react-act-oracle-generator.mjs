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

import { stringifyReactActOracle } from "./react-act-oracle.mjs";
import { REACT_ACT_SCENARIOS } from "./react-act-scenarios.mjs";
import {
  REACT_ACT_FAST_REACT_TARGET,
  REACT_ACT_PROBE_MODES,
  REACT_ACT_REACT_TARGET,
  REACT_ACT_SOURCE_DOCUMENTS
} from "./react-act-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-act-oracle-";

export async function generateReactActOracle() {
  const tempRoot = mkdtempSync(join(tmpdir(), ORACLE_TEMP_PREFIX));

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const reactEvidence = await fetchAndExtractReact({
      nodeModulesRoot,
      tempRoot
    });
    copyFastReactPackage({ nodeModulesRoot });

    const probeFile = writeProbeFile(projectRoot);
    const reactObservations = {};
    const fastReactObservations = {};
    const fastReactComparisons = {};

    for (const mode of REACT_ACT_PROBE_MODES) {
      reactObservations[mode.id] = [];
      fastReactObservations[mode.id] = [];
      fastReactComparisons[mode.id] = [];

      for (const scenario of REACT_ACT_SCENARIOS) {
        const reactObservation = runReactActProbe({
          mode,
          packageName: REACT_ACT_REACT_TARGET.packageName,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });
        const fastReactObservation = runReactActProbe({
          mode,
          packageName: REACT_ACT_FAST_REACT_TARGET.packageName,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });

        reactObservations[mode.id].push(reactObservation);
        fastReactObservations[mode.id].push(fastReactObservation);
        fastReactComparisons[mode.id].push(
          compareFastReactToReact({
            fastReactObservation,
            mode,
            reactObservation,
            scenarioId: scenario.id
          })
        );
      }
    }

    const fastReactStatusCounts = countComparisonStatuses(
      fastReactComparisons
    );

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-act-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel: "React 19.2.6 public React.act behavior oracle",
      sources: REACT_ACT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "exact react npm tarball plus local Fast React package copied into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation: "one Node child process per target, scenario, and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary extraction roots and local workspace paths are normalized before artifact write"
      },
      evidenceClaims: {
        npmMetadataResolved: true,
        tarballDownloaded: true,
        tarballIntegrityVerified: true,
        reactPublicActBehaviorProbed: true,
        rendererBackedFlushingProbed: false,
        fastReactComparedToReact: true,
        fastReactBehaviorCompatible: false
      },
      conformanceClaims: {
        realReactBehaviorCompared: true,
        fastReactComparedToReact: true,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      implementationComparison: {
        worker097Checked: {
          source:
            "generated fastReactComparisons in this oracle artifact; default Fast React act is still a placeholder and react-server act is absent",
          generatedProbe: true,
          statusCounts: fastReactStatusCounts,
          compatibilityClaimed: false
        }
      },
      reactTarget: REACT_ACT_REACT_TARGET,
      fastReactTarget: REACT_ACT_FAST_REACT_TARGET,
      probeModes: REACT_ACT_PROBE_MODES,
      scenarios: REACT_ACT_SCENARIOS,
      packages: {
        react: reactEvidence,
        "@fast-react/react": {
          packageName: REACT_ACT_FAST_REACT_TARGET.packageName,
          version: REACT_ACT_FAST_REACT_TARGET.version,
          role: REACT_ACT_FAST_REACT_TARGET.role,
          source:
            "local workspace package copied for public React.act behavior comparison",
          behaviorCompatibilityClaimed: false
        }
      },
      coverage: {
        exportDescriptors: true,
        developmentAvailability: true,
        productionAvailability: true,
        reactServerAbsence: true,
        syncCallbackBehavior: true,
        asyncCallbackBehavior: true,
        noAwaitWarnings: true,
        thrownAndRejectedErrors: true,
        deterministicThenableHandling: true,
        rendererBackedFlushing: false
      },
      intentionalGaps: [
        {
          id: "no-renderer-backed-flushing",
          reason:
            "React DOM test-utils and react-test-renderer wrappers own renderer-backed act queue flushing evidence."
        },
        {
          id: "no-private-internals-reads",
          reason:
            "The probe uses only the public React root export and does not inspect ReactSharedInternals.actQueue."
        },
        {
          id: "no-compatibility-claim",
          reason:
            "Local Fast React comparisons are recorded only as unsupported, known mismatch, or matched-without-claim evidence."
        }
      ],
      reactObservations,
      fastReactObservations,
      fastReactComparisons
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function fetchAndExtractReact({ nodeModulesRoot, tempRoot }) {
  const metadata = await fetchPackageMetadata(REACT_ACT_REACT_TARGET);
  const dist = metadata.dist ?? {};
  if (!dist.tarball) {
    throw new Error("react@19.2.6 metadata did not include a tarball URL");
  }

  const tarballBytes = await fetchBytes(dist.tarball);
  const integrity = verifyTarballIntegrity(dist.integrity, tarballBytes);
  const tarballRoot = join(tempRoot, "tarballs");
  mkdirSync(tarballRoot, { recursive: true });
  const tarballPath = join(tarballRoot, "react-19.2.6.tgz");
  writeFileSync(tarballPath, tarballBytes);

  const packageRoot = join(nodeModulesRoot, "react");
  mkdirSync(packageRoot, { recursive: true });
  const tarballFiles = listTarballFiles(tarballPath);
  extractTarball(tarballPath, packageRoot);

  const packageJson = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8")
  );
  if (packageJson.name !== REACT_ACT_REACT_TARGET.packageName) {
    throw new Error(`react tarball package name mismatch: ${packageJson.name}`);
  }
  if (packageJson.version !== REACT_ACT_REACT_TARGET.version) {
    throw new Error(
      `react tarball package version mismatch: ${packageJson.version}`
    );
  }

  return {
    packageName: REACT_ACT_REACT_TARGET.packageName,
    version: REACT_ACT_REACT_TARGET.version,
    role: REACT_ACT_REACT_TARGET.role,
    registry: {
      metadataUrl: registryPackageVersionUrl(REACT_ACT_REACT_TARGET),
      distTarball: dist.tarball,
      distIntegrity: dist.integrity ?? null,
      distShasum: dist.shasum ?? null
    },
    tarball: {
      integrityAlgorithm: integrity.algorithm,
      integrityDigest: integrity.digest,
      integrityVerified: true,
      fileCount: tarballFiles.length,
      files: tarballFiles
    },
    packageJson: {
      name: packageJson.name,
      version: packageJson.version,
      main: packageJson.main ?? null,
      exports: packageJson.exports ?? null
    }
  };
}

function copyFastReactPackage({ nodeModulesRoot }) {
  const sourceRoot = new URL("../../../packages/react", import.meta.url);
  const packageRoot = join(nodeModulesRoot, "@fast-react", "react");
  mkdirSync(dirname(packageRoot), { recursive: true });
  cpSync(sourceRoot, packageRoot, {
    recursive: true,
    dereference: true,
    filter: (source) => basename(source) !== "node_modules"
  });
}

function writeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "react-act-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(new URL("./react-act-probe-runner.mjs", import.meta.url), "utf8"),
    "utf8"
  );
  return probeFile;
}

function runReactActProbe({
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
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)]+/gu, "<workspace>");
}

function compareFastReactToReact({
  fastReactObservation,
  mode,
  reactObservation,
  scenarioId
}) {
  const reactComparableResult = comparableProbeResult(reactObservation.result);
  const fastReactComparableResult = comparableProbeResult(
    fastReactObservation.result
  );
  const firstDifferencePath = findFirstDifferencePath(
    reactComparableResult,
    fastReactComparableResult
  );
  const equal = firstDifferencePath === null;
  const fastReactUnsupported = containsFastReactUnimplemented(
    fastReactObservation.result
  );

  return {
    scenarioId,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    status: fastReactUnsupported
      ? "unsupported-placeholder"
      : equal
        ? "matched-but-compatibility-not-claimed"
        : "known-mismatch",
    compatibilityClaimed: false,
    firstDifferencePath,
    reactResultStatus: reactObservation.result.result?.status ?? null,
    fastReactResultStatus: fastReactObservation.result.result?.status ?? null,
    reason: fastReactUnsupported
      ? "Fast React currently throws structured placeholder errors for this public React.act behavior."
      : equal
        ? "Normalized observations matched, but this oracle does not claim Fast React compatibility."
        : "Fast React normalized observation differs from the React 19.2.6 public React.act oracle."
  };
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

function comparableProbeResult(result) {
  const { targetPackage: _targetPackage, ...behaviorResult } = result;
  return behaviorResult;
}

function containsFastReactUnimplemented(value) {
  if (Array.isArray(value)) {
    return value.some(containsFastReactUnimplemented);
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  if (
    value.name === "FastReactUnimplementedError" ||
    value.code === "FAST_REACT_UNIMPLEMENTED"
  ) {
    return true;
  }

  return Object.values(value).some(containsFastReactUnimplemented);
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

function fetchPackageMetadata(target) {
  return fetchJson(registryPackageVersionUrl(target));
}

function registryPackageVersionUrl(target) {
  return `https://registry.npmjs.org/${encodeURIComponent(
    target.packageName
  )}/${encodeURIComponent(target.version)}`;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = get(
      url,
      {
        headers: {
          accept: "application/json"
        },
        timeout: FETCH_TIMEOUT_MS
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`GET ${url} returned ${response.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    request.on("timeout", () => {
      request.destroy(
        new Error(`GET ${url} timed out after ${FETCH_TIMEOUT_MS}ms`)
      );
    });
    request.on("error", reject);
  });
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
    ["-xzf", tarballPath, "--strip-components=1", "-C", packageRoot],
    {
      encoding: "utf8",
      timeout: PROBE_TIMEOUT_MS
    }
  );
  assertSuccessfulSpawn(result, `tar -xzf ${basename(tarballPath)}`);
}

function parseProbeOutput(spawnResult, { command }) {
  assertSuccessfulSpawn(spawnResult, command);
  try {
    return JSON.parse(spawnResult.stdout);
  } catch (error) {
    throw new Error(
      `Could not parse probe output from ${command}: ${error.message}\n${spawnResult.stdout}`
    );
  }
}

function assertSuccessfulSpawn(result, command) {
  if (result.error) {
    throw new Error(`${command} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} exited with ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
}

export { stringifyReactActOracle };
