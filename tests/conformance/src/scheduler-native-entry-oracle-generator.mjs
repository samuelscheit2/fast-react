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

import { stringifySchedulerNativeEntryOracle } from "./scheduler-native-entry-oracle.mjs";
import {
  SCHEDULER_NATIVE_ENTRY_DIRECT_CJS_SPECIFIERS,
  SCHEDULER_NATIVE_ENTRY_PROBE_MODES,
  SCHEDULER_NATIVE_ENTRY_RESOLUTION_SPECIFIERS,
  SCHEDULER_NATIVE_ENTRY_SCENARIOS,
  SCHEDULER_NATIVE_ENTRY_SOURCE_DOCUMENTS,
  SCHEDULER_NATIVE_ENTRY_TARGET
} from "./scheduler-native-entry-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;

export async function generateSchedulerNativeEntryOracle() {
  const tempRoot = mkdtempSync(
    join(tmpdir(), "fast-react-scheduler-native-entry-oracle-")
  );

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const schedulerEvidence = await fetchAndExtractScheduler({
      nodeModulesRoot,
      tempRoot
    });
    const probeFile = writeProbeFile(projectRoot);
    const scenarioOptions = {
      resolutionSpecifiers: SCHEDULER_NATIVE_ENTRY_RESOLUTION_SPECIFIERS,
      directCjsSpecifiers: SCHEDULER_NATIVE_ENTRY_DIRECT_CJS_SPECIFIERS
    };
    const observations = {};

    for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
      observations[mode.id] = {};

      for (const scenario of SCHEDULER_NATIVE_ENTRY_SCENARIOS) {
        observations[mode.id][scenarioObservationKey(scenario.id)] =
          runSchedulerNativeEntryProbe({
            mode,
            packageName: SCHEDULER_NATIVE_ENTRY_TARGET.packageName,
            probeFile,
            projectRoot,
            scenarioId: scenario.id,
            scenarioOptions
          });
      }
    }

    return {
      schemaVersion: 1,
      oracleKind: "scheduler-0.27.0-native-entry-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "scheduler@0.27.0 native entrypoint behavior oracle",
      sources: SCHEDULER_NATIVE_ENTRY_SOURCE_DOCUMENTS,
      generation: {
        method:
          "exact scheduler npm tarball extracted into a temporary node_modules tree and probed through isolated Node child processes",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per scheduler native entry scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false
      },
      evidenceClaims: {
        npmMetadataResolved: true,
        tarballDownloaded: true,
        tarballIntegrityVerified: true,
        packageNativeFileSurfaceProbed: true,
        nativeEntrypointBehaviorProbed: true,
        nativeUnsupportedRuntimeBehaviorProbed: true,
        nativeRuntimeDelegationProbed: true,
        defaultEntrypointRelationshipProbed: true,
        fastReactComparedToScheduler: false
      },
      conformanceClaims: {
        realSchedulerBehaviorProbed: true,
        fastReactComparedToScheduler: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      schedulerTarget: SCHEDULER_NATIVE_ENTRY_TARGET,
      probeModes: SCHEDULER_NATIVE_ENTRY_PROBE_MODES,
      scenarios: SCHEDULER_NATIVE_ENTRY_SCENARIOS,
      packages: {
        scheduler: schedulerEvidence
      },
      coverage: {
        publishedNativeFiles: true,
        nativeFileResolution: true,
        nodeEnvFileSelection: true,
        exportKeysAndDescriptors: true,
        fallbackSchedulingRuntime: true,
        unsupportedPriorityContextHelpers: true,
        nativeRuntimeSchedulerDelegation: true,
        defaultEntrypointRelationship: true,
        directNativeCjsRequire: true
      },
      intentionalGaps: [
        "This oracle does not compare Fast React to scheduler because native scheduler implementation work is out of scope.",
        "This oracle runs in Node child processes with controlled globals; it does not claim React Native host integration compatibility.",
        "Timing assertions are restricted to deterministic logical values and task object fields, not wall-clock latency."
      ],
      observations
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function fetchAndExtractScheduler({ nodeModulesRoot, tempRoot }) {
  const metadata = await fetchPackageMetadata(SCHEDULER_NATIVE_ENTRY_TARGET);
  const dist = metadata.dist ?? {};
  if (!dist.tarball) {
    throw new Error("scheduler@0.27.0 metadata did not include a tarball URL");
  }

  if (dist.integrity !== SCHEDULER_NATIVE_ENTRY_TARGET.expectedDistIntegrity) {
    throw new Error("scheduler@0.27.0 dist.integrity did not match evidence");
  }
  if (dist.shasum !== SCHEDULER_NATIVE_ENTRY_TARGET.expectedDistShasum) {
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
  if (packageJson.name !== SCHEDULER_NATIVE_ENTRY_TARGET.packageName) {
    throw new Error(`scheduler tarball package name mismatch: ${packageJson.name}`);
  }
  if (packageJson.version !== SCHEDULER_NATIVE_ENTRY_TARGET.version) {
    throw new Error(
      `scheduler tarball package version mismatch: ${packageJson.version}`
    );
  }

  return {
    packageName: SCHEDULER_NATIVE_ENTRY_TARGET.packageName,
    version: SCHEDULER_NATIVE_ENTRY_TARGET.version,
    role: SCHEDULER_NATIVE_ENTRY_TARGET.role,
    targetStatus: SCHEDULER_NATIVE_ENTRY_TARGET.targetStatus,
    registry: {
      metadataUrl: registryPackageVersionUrl(SCHEDULER_NATIVE_ENTRY_TARGET),
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

function writeProbeFile(projectRoot) {
  const probeFile = join(
    projectRoot,
    "scheduler-native-entry-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./scheduler-native-entry-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runSchedulerNativeEntryProbe({
  mode,
  packageName,
  probeFile,
  projectRoot,
  scenarioId,
  scenarioOptions
}) {
  const spawnResult = spawnSync(
    process.execPath,
    [
      ...mode.nodeArgs,
      probeFile,
      packageName,
      scenarioId,
      JSON.stringify(scenarioOptions)
    ],
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

  return normalizeProbeResult(result);
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

function scenarioObservationKey(scenarioId) {
  return scenarioId.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
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
    browser: packageJson.browser ?? null,
    reactNative: packageJson["react-native"] ?? packageJson.reactNative ?? null,
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
