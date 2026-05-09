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
import { basename, join } from "node:path";

import { stringifySchedulerMockOracle } from "./scheduler-mock-oracle.mjs";
import {
  SCHEDULER_MOCK_SCENARIOS
} from "./scheduler-mock-scenarios.mjs";
import {
  SCHEDULER_MOCK_FAST_REACT_TARGET,
  SCHEDULER_MOCK_PROBE_MODES,
  SCHEDULER_MOCK_SOURCE_DOCUMENTS,
  SCHEDULER_MOCK_TARGET
} from "./scheduler-mock-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;

export async function generateSchedulerMockOracle() {
  const tempRoot = mkdtempSync(
    join(tmpdir(), "fast-react-scheduler-mock-oracle-")
  );

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const schedulerEvidence = await fetchAndExtractScheduler({
      nodeModulesRoot,
      tempRoot
    });
    copyFastReactSchedulerPackage({ nodeModulesRoot });

    const probeFile = writeProbeFile(projectRoot);
    const schedulerObservations = {};
    const fastReactObservations = {};
    const fastReactComparisons = {};

    for (const mode of SCHEDULER_MOCK_PROBE_MODES) {
      schedulerObservations[mode.id] = [];
      fastReactObservations[mode.id] = [];
      fastReactComparisons[mode.id] = [];

      for (const scenario of SCHEDULER_MOCK_SCENARIOS) {
        const schedulerObservation = runSchedulerMockProbe({
          mode,
          packageName: SCHEDULER_MOCK_TARGET.packageName,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });
        const fastReactObservation = runSchedulerMockProbe({
          mode,
          packageName: SCHEDULER_MOCK_FAST_REACT_TARGET.packageName,
          probeFile,
          projectRoot,
          scenarioId: scenario.id
        });

        schedulerObservations[mode.id].push(schedulerObservation);
        fastReactObservations[mode.id].push(fastReactObservation);
        fastReactComparisons[mode.id].push(
          compareFastReactToScheduler({
            fastReactObservation,
            mode,
            scenarioId: scenario.id,
            schedulerObservation
          })
        );
      }
    }

    const fastReactStatusCounts =
      countComparisonStatuses(fastReactComparisons);

    return {
      schemaVersion: 1,
      oracleKind: "scheduler-0.27.0-mock-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "scheduler@0.27.0 scheduler/unstable_mock behavior oracle",
      sources: SCHEDULER_MOCK_SOURCE_DOCUMENTS,
      generation: {
        method:
          "exact scheduler npm tarball plus local scheduler placeholder copied under an isolated alias into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation: "one Node child process per target, scenario, and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        timingNormalization:
          "scheduler/unstable_mock virtual time is recorded directly; raw wall-clock timestamps and local filesystem paths are omitted"
      },
      evidenceClaims: {
        npmMetadataResolved: true,
        tarballDownloaded: true,
        tarballIntegrityVerified: true,
        schedulerMockBehaviorProbed: true,
        fastReactPlaceholderComparedToScheduler: true,
        fastReactBehaviorCompatible: false
      },
      conformanceClaims: {
        realSchedulerBehaviorProbed: true,
        fastReactComparedToScheduler: true,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      implementationComparison: {
        currentFastReactPlaceholder: {
          source:
            "packages/scheduler/unstable_mock.js and cjs/scheduler-unstable_mock.* are copied under fast-react-scheduler for comparison",
          generatedProbe: true,
          statusCounts: fastReactStatusCounts,
          compatibilityClaimed: false
        }
      },
      schedulerTarget: SCHEDULER_MOCK_TARGET,
      fastReactTarget: SCHEDULER_MOCK_FAST_REACT_TARGET,
      probeModes: SCHEDULER_MOCK_PROBE_MODES,
      scenarios: SCHEDULER_MOCK_SCENARIOS,
      packages: {
        scheduler: schedulerEvidence,
        fastReactScheduler: {
          packageName: SCHEDULER_MOCK_FAST_REACT_TARGET.packageName,
          sourcePackageName:
            SCHEDULER_MOCK_FAST_REACT_TARGET.sourcePackageName,
          version: SCHEDULER_MOCK_FAST_REACT_TARGET.version,
          role: SCHEDULER_MOCK_FAST_REACT_TARGET.role,
          source: "local packages/scheduler copied for placeholder comparison",
          behaviorCompatibilityClaimed: false
        }
      },
      coverage: {
        exportKeysAndDescriptors: true,
        virtualTime: true,
        logs: true,
        disableYieldValue: true,
        taskObjectShape: true,
        priorityContextApis: true,
        priorityFlushOrdering: true,
        flushHelpers: true,
        pendingWork: true,
        delayedAndExpiredWork: true,
        cancellationTombstones: true,
        continuations: true,
        paintYielding: true,
        resets: true,
        fastReactPlaceholderBoundaries: true
      },
      implementationRisks: [
        "The local scheduler package still exposes structured placeholders for mock behavior; compatibility remains false until scheduler/unstable_mock is implemented.",
        "The export-shape comparison can produce a known mismatch without invoking placeholder functions because local package metadata and function names differ before behavior is implemented.",
        "The oracle intentionally covers the mock scheduler only; root scheduler, post-task, native, reconciler lane scheduling, and renderer behavior remain separate compatibility surfaces.",
        "Future upstream React-style tests depend on this mock scheduler being deterministic across reset, virtual time, yielded logs, pending work, and continuation boundaries."
      ],
      schedulerObservations,
      fastReactObservations,
      fastReactComparisons
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function fetchAndExtractScheduler({ nodeModulesRoot, tempRoot }) {
  const metadata = await fetchPackageMetadata(SCHEDULER_MOCK_TARGET);
  const dist = metadata.dist ?? {};
  if (!dist.tarball) {
    throw new Error("scheduler@0.27.0 metadata did not include a tarball URL");
  }

  if (dist.integrity !== SCHEDULER_MOCK_TARGET.expectedDistIntegrity) {
    throw new Error("scheduler@0.27.0 dist.integrity did not match evidence");
  }
  if (dist.shasum !== SCHEDULER_MOCK_TARGET.expectedDistShasum) {
    throw new Error("scheduler@0.27.0 dist.shasum did not match evidence");
  }

  const tarballBytes = await fetchBytes(dist.tarball);
  const integrity = verifyTarballIntegrity(dist.integrity, tarballBytes);
  const tarballsRoot = join(tempRoot, "tarballs");
  mkdirSync(tarballsRoot, { recursive: true });
  const tarballPath = join(tarballsRoot, "scheduler-0.27.0.tgz");
  writeFileSync(tarballPath, tarballBytes);

  const packageRoot = join(nodeModulesRoot, "scheduler");
  mkdirSync(packageRoot, { recursive: true });
  const tarballFiles = listTarballFiles(tarballPath);
  extractTarball(tarballPath, packageRoot);

  const packageJson = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8")
  );
  if (packageJson.name !== SCHEDULER_MOCK_TARGET.packageName) {
    throw new Error(`scheduler tarball package name mismatch: ${packageJson.name}`);
  }
  if (packageJson.version !== SCHEDULER_MOCK_TARGET.version) {
    throw new Error(
      `scheduler tarball package version mismatch: ${packageJson.version}`
    );
  }

  return {
    packageName: SCHEDULER_MOCK_TARGET.packageName,
    version: SCHEDULER_MOCK_TARGET.version,
    role: SCHEDULER_MOCK_TARGET.role,
    targetStatus: SCHEDULER_MOCK_TARGET.targetStatus,
    registry: {
      metadataUrl: registryPackageVersionUrl(SCHEDULER_MOCK_TARGET),
      distTarball: dist.tarball,
      distIntegrity: dist.integrity ?? null,
      distShasum: dist.shasum ?? null,
      unpackedSize: dist.unpackedSize ?? null
    },
    tarball: {
      integrityAlgorithm: integrity.algorithm,
      integrityDigest: integrity.digest,
      integrityVerified: true,
      fileCount: tarballFiles.length,
      files: tarballFiles
    },
    packageJson: selectPackageJsonFields(packageJson)
  };
}

function copyFastReactSchedulerPackage({ nodeModulesRoot }) {
  const sourceRoot = new URL("../../../packages/scheduler", import.meta.url);
  const packageRoot = join(
    nodeModulesRoot,
    SCHEDULER_MOCK_FAST_REACT_TARGET.packageName
  );
  cpSync(sourceRoot, packageRoot, {
    recursive: true,
    dereference: true,
    filter: (source) => basename(source) !== "node_modules"
  });
}

function writeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "scheduler-mock-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./scheduler-mock-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runSchedulerMockProbe({
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

function compareFastReactToScheduler({
  fastReactObservation,
  mode,
  scenarioId,
  schedulerObservation
}) {
  const schedulerComparableResult = comparableProbeResult(
    schedulerObservation.result
  );
  const fastReactComparableResult = comparableProbeResult(
    fastReactObservation.result
  );
  const firstDifferencePath = findFirstDifferencePath(
    schedulerComparableResult,
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
        ? "unexpected-match-compatibility-not-claimed"
        : "known-mismatch",
    compatibilityClaimed: false,
    firstDifferencePath,
    schedulerResultStatus: schedulerObservation.result.result?.status ?? null,
    fastReactResultStatus: fastReactObservation.result.result?.status ?? null,
    reason: fastReactUnsupported
      ? "Fast React currently throws structured placeholder errors for this scheduler/unstable_mock behavior."
      : equal
        ? "Normalized observations matched, but this oracle does not claim Fast React scheduler mock compatibility."
        : "Fast React normalized observation differs from the scheduler@0.27.0 mock oracle."
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
    value.name === "FastReactSchedulerUnimplementedError" ||
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

function selectPackageJsonFields(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description ?? null,
    main: packageJson.main ?? null,
    type: packageJson.type ?? null,
    exports: packageJson.exports ?? null,
    files: packageJson.files ?? null,
    dependencies: packageJson.dependencies ?? null,
    peerDependencies: packageJson.peerDependencies ?? null,
    engines: packageJson.engines ?? null,
    license: packageJson.license ?? null,
    repository: packageJson.repository ?? null,
    bugs: packageJson.bugs ?? null,
    homepage: packageJson.homepage ?? null
  };
}

export function stringifyGeneratedSchedulerMockOracle(oracle) {
  return stringifySchedulerMockOracle(oracle);
}
