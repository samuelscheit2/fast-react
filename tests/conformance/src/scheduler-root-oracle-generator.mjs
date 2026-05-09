import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { get } from "node:https";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import { stringifySchedulerRootOracle } from "./scheduler-root-oracle.mjs";
import {
  SCHEDULER_ROOT_SCENARIOS
} from "./scheduler-root-scenarios.mjs";
import {
  SCHEDULER_ROOT_PROBE_MODES,
  SCHEDULER_ROOT_SOURCE_DOCUMENTS,
  SCHEDULER_ROOT_TARGET
} from "./scheduler-root-targets.mjs";

const PROBE_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 30_000;

export async function generateSchedulerRootOracle() {
  const tempRoot = mkdtempSync(join(tmpdir(), "fast-react-scheduler-oracle-"));

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const schedulerEvidence = await fetchAndExtractScheduler({
      nodeModulesRoot,
      tempRoot
    });
    const probeFile = writeProbeFile(projectRoot);
    const schedulerObservations = {};

    for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
      schedulerObservations[mode.id] = [];

      for (const scenario of SCHEDULER_ROOT_SCENARIOS) {
        schedulerObservations[mode.id].push(
          runSchedulerRootProbe({
            mode,
            packageName: SCHEDULER_ROOT_TARGET.packageName,
            probeFile,
            projectRoot,
            scenarioId: scenario.id
          })
        );
      }
    }

    return {
      schemaVersion: 1,
      oracleKind: "scheduler-0.27.0-root-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "scheduler 0.27.0 public root entrypoint behavior oracle",
      sources: SCHEDULER_ROOT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "exact scheduler npm tarball extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation: "one Node child process per scheduler scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        timingNormalization:
          "raw wall-clock timestamps are omitted; probes record logical ordering, timeout buckets, and boolean didTimeout categories"
      },
      evidenceClaims: {
        npmMetadataResolved: true,
        tarballDownloaded: true,
        tarballIntegrityVerified: true,
        schedulerRootBehaviorProbed: true,
        nodeSetImmediateTransportObserved: true,
        fastReactComparedToScheduler: false
      },
      conformanceClaims: {
        realSchedulerBehaviorProbed: true,
        fastReactComparedToScheduler: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      schedulerTarget: SCHEDULER_ROOT_TARGET,
      probeModes: SCHEDULER_ROOT_PROBE_MODES,
      scenarios: SCHEDULER_ROOT_SCENARIOS,
      packages: {
        scheduler: schedulerEvidence
      },
      coverage: {
        exportKeys: true,
        constants: true,
        priorityOrdering: true,
        equalPriorityFifo: true,
        delayedCallbacks: true,
        cancellation: true,
        continuations: true,
        didTimeout: true,
        priorityContextApis: true,
        shouldYield: true,
        requestPaint: true,
        forceFrameRate: true,
        nodeHostCallbackTransport: true
      },
      timingCaveats: [
        "The checked artifact intentionally omits raw times and absolute timestamps.",
        "The didTimeout scenario blocks the event loop for at least 400ms, comfortably beyond UserBlocking's 250ms timeout and far below Normal's 5000ms timeout.",
        "Delayed callback probes assert execution order and cancellation behavior, not precise millisecond delivery."
      ],
      schedulerObservations
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function fetchAndExtractScheduler({ nodeModulesRoot, tempRoot }) {
  const metadata = await fetchPackageMetadata(SCHEDULER_ROOT_TARGET);
  const dist = metadata.dist ?? {};
  if (!dist.tarball) {
    throw new Error("scheduler@0.27.0 metadata did not include a tarball URL");
  }

  const tarballBytes = await fetchBytes(dist.tarball);
  const integrity = verifyTarballIntegrity(dist.integrity, tarballBytes);
  const tarballRoot = join(tempRoot, "tarballs");
  mkdirSync(tarballRoot, { recursive: true });
  const tarballPath = join(tarballRoot, "scheduler-0.27.0.tgz");
  writeFileSync(tarballPath, tarballBytes);

  const packageRoot = join(nodeModulesRoot, "scheduler");
  mkdirSync(packageRoot, { recursive: true });
  const tarballFiles = listTarballFiles(tarballPath);
  extractTarball(tarballPath, packageRoot);

  const packageJson = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8")
  );
  if (packageJson.name !== SCHEDULER_ROOT_TARGET.packageName) {
    throw new Error(`scheduler tarball package name mismatch: ${packageJson.name}`);
  }
  if (packageJson.version !== SCHEDULER_ROOT_TARGET.version) {
    throw new Error(
      `scheduler tarball package version mismatch: ${packageJson.version}`
    );
  }

  return {
    packageName: SCHEDULER_ROOT_TARGET.packageName,
    version: SCHEDULER_ROOT_TARGET.version,
    role: SCHEDULER_ROOT_TARGET.role,
    registry: {
      metadataUrl: registryPackageVersionUrl(SCHEDULER_ROOT_TARGET),
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
      type: packageJson.type ?? null,
      exports: packageJson.exports ?? null
    }
  };
}

function writeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "scheduler-root-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./scheduler-root-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runSchedulerRootProbe({
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

export function stringifyGeneratedSchedulerRootOracle(oracle) {
  return stringifySchedulerRootOracle(oracle);
}
