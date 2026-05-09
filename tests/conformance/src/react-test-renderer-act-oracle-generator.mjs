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
import { basename, dirname, join, sep } from "node:path";

import { stringifyReactTestRendererActOracle } from "./react-test-renderer-act-oracle.mjs";
import {
  REACT_TEST_RENDERER_ACT_PROBE_MODES,
  REACT_TEST_RENDERER_ACT_SOURCE_DOCUMENTS,
  REACT_TEST_RENDERER_ACT_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_ACT_TARGET
} from "./react-test-renderer-act-targets.mjs";
import {
  REACT_TEST_RENDERER_ACT_SCENARIOS
} from "./react-test-renderer-act-scenarios.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-test-renderer-act-oracle-";

export async function generateReactTestRendererActOracle() {
  const tempRoot = mkdtempSync(join(tmpdir(), ORACLE_TEMP_PREFIX));

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const packageRoots = new Map();
    const packages = {};
    const packageTargets = [
      REACT_TEST_RENDERER_ACT_TARGET,
      ...REACT_TEST_RENDERER_ACT_SUPPORTING_TARGETS
    ];

    for (const target of packageTargets) {
      const evidence = await fetchAndExtractPackage({
        nodeModulesRoot,
        target,
        tempRoot
      });
      packages[target.packageName] = evidence.inventory;
      packageRoots.set(target.packageName, realpathSync(evidence.packageRoot));
    }

    const probeFile = writeProbeFile(projectRoot);
    const reactTestRendererObservations = {};

    for (const mode of REACT_TEST_RENDERER_ACT_PROBE_MODES) {
      reactTestRendererObservations[mode.id] = [];

      for (const scenario of REACT_TEST_RENDERER_ACT_SCENARIOS) {
        reactTestRendererObservations[mode.id].push(
          runReactTestRendererActProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            scenarioId: scenario.id
          })
        );
      }
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-test-renderer-act-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React test renderer 19.2.6 act, Scheduler, and unstable_flushSync behavior oracle",
      sources: REACT_TEST_RENDERER_ACT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "exact npm tarballs extracted into a temporary node_modules tree and probed through isolated Node child processes",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per react-test-renderer act scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary extraction roots and local workspace paths are normalized before artifact write"
      },
      evidenceClaims: {
        npmMetadataResolved: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        packageFileSurfaceProbed: true,
        exportedActProbed: true,
        syncActUpdateFlushingProbed: true,
        asyncActContractsProbed: true,
        deterministicActWarningsProbed: true,
        schedulerExposureProbed: true,
        unstableFlushSyncProbed: true,
        thrownErrorAggregationProbed: true,
        fastReactComparedToReactTestRenderer: false
      },
      conformanceClaims: {
        realReactTestRendererBehaviorProbed: true,
        fastReactComparedToReactTestRenderer: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      reactTestRendererTarget: REACT_TEST_RENDERER_ACT_TARGET,
      supportingRuntimePackages: REACT_TEST_RENDERER_ACT_SUPPORTING_TARGETS,
      probeModes: REACT_TEST_RENDERER_ACT_PROBE_MODES,
      scenarios: REACT_TEST_RENDERER_ACT_SCENARIOS,
      packages,
      coverage: {
        exportedActShape: true,
        productionActUndefinedValue: true,
        syncActUpdateFlushing: true,
        asyncActAwaitedContracts: true,
        asyncActUnawaitedWarning: true,
        missingActEnvironmentWarning: true,
        mockSchedulerExposure: true,
        schedulerLogicalFlush: true,
        rootUnstableFlushSync: true,
        unstableFlushSyncErrorRestoration: true,
        actThrownErrorAggregation: true,
        privateInternalsAvoided: true,
        realTimersAvoided: true
      },
      intentionalGaps: [
        {
          id: "no-fast-react-test-renderer-comparison",
          reason:
            "This oracle records pinned React test renderer behavior only; Fast React test renderer implementation work is owned by separate workers."
        },
        {
          id: "no-private-react-internals-read",
          reason:
            "The probes use public react-test-renderer, React.act, and scheduler/unstable_mock observables. They do not inspect ReactSharedInternals, lanes, or fiber fields."
        },
        {
          id: "no-wall-clock-timing-assertions",
          reason:
            "Async warning checks flush microtasks deterministically and Scheduler checks use mock scheduler logical flush APIs instead of real time."
        },
        {
          id: "no-react-server-condition-claim",
          reason:
            "The act and flushSync scheduling oracle is scoped to default Node development and production behavior; condition-specific package loading belongs in the export oracle track."
        }
      ],
      reactTestRendererObservations
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function fetchAndExtractPackage({ nodeModulesRoot, target, tempRoot }) {
  const metadata = await fetchPackageMetadata(target);
  const dist = metadata.dist ?? {};
  if (!dist.tarball) {
    throw new Error(
      `${target.packageName}@${target.version} metadata did not include a tarball URL`
    );
  }
  if (dist.integrity !== target.expectedDistIntegrity) {
    throw new Error(
      `${target.packageName}@${target.version} dist.integrity did not match evidence`
    );
  }
  if (dist.shasum !== target.expectedDistShasum) {
    throw new Error(
      `${target.packageName}@${target.version} dist.shasum did not match evidence`
    );
  }

  const tarballBytes = await fetchBytes(dist.tarball);
  const integrity = verifyTarballIntegrity(dist.integrity, tarballBytes);
  const tarballRoot = join(tempRoot, "tarballs");
  mkdirSync(tarballRoot, { recursive: true });
  const tarballPath = join(
    tarballRoot,
    `${target.packageName.replaceAll("/", "__")}-${target.version}.tgz`
  );
  writeFileSync(tarballPath, tarballBytes);

  const tarballFiles = listTarballFiles(tarballPath);
  const packageRoot = joinPackagePath(nodeModulesRoot, target.packageName);
  mkdirSync(dirname(packageRoot), { recursive: true });
  mkdirSync(packageRoot, { recursive: true });
  extractTarball(tarballPath, packageRoot);

  const packageJson = JSON.parse(
    readFileSync(join(packageRoot, "package.json"), "utf8")
  );
  if (packageJson.name !== target.packageName) {
    throw new Error(
      `${target.packageName} tarball package name mismatch: ${packageJson.name}`
    );
  }
  if (packageJson.version !== target.version) {
    throw new Error(
      `${target.packageName} tarball package version mismatch: ${packageJson.version}`
    );
  }

  return {
    packageRoot,
    inventory: {
      packageName: target.packageName,
      version: target.version,
      role: target.role,
      targetStatus: target.targetStatus ?? "supporting-runtime-package",
      registry: {
        metadataUrl: registryPackageVersionUrl(target),
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
    }
  };
}

function writeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "react-test-renderer-act-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-test-renderer-act-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactTestRendererActProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenarioId
}) {
  const spawnResult = spawnSync(
    process.execPath,
    [
      ...mode.nodeArgs,
      probeFile,
      REACT_TEST_RENDERER_ACT_TARGET.packageName,
      scenarioId
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

  const command = `node ${mode.nodeArgs.join(" ")} ${basename(
    probeFile
  )} ${REACT_TEST_RENDERER_ACT_TARGET.packageName} ${scenarioId}`;
  const result = parseProbeOutput(spawnResult, { command });

  assertDeepEqual(
    {
      targetPackage: result.targetPackage,
      scenarioId: result.scenarioId
    },
    {
      targetPackage: REACT_TEST_RENDERER_ACT_TARGET.packageName,
      scenarioId
    },
    `${mode.id}:${scenarioId} probe identity`
  );

  return {
    scenarioId,
    packageName: REACT_TEST_RENDERER_ACT_TARGET.packageName,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    result: normalizeProbeResult({
      packageRoots,
      value: result.result
    }),
    consoleCalls: normalizeProbeResult({
      packageRoots,
      value: result.consoleCalls
    })
  };
}

function normalizeProbeResult({ packageRoots, value }) {
  return normalizeDeep({
    packageRoots,
    value
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

  if (typeof value === "string") {
    return normalizePathInString({
      packageRoots,
      value
    });
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const normalized = {};
  for (const [key, child] of Object.entries(value)) {
    normalized[key] = normalizeDeep({
      packageRoots,
      value: child
    });
  }
  return normalized;
}

function normalizePathInString({ packageRoots, value }) {
  let normalized = value;
  for (const [packageName, packageRoot] of packageRoots) {
    normalized = normalized.replaceAll(
      packageRoot,
      `node_modules/${packageName}`
    );
    normalized = normalized.replaceAll(
      packageRoot.split(sep).join("/"),
      `node_modules/${packageName}`
    );
  }

  return normalized
    .replace(/file:\/\/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "file://<temp>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "<temp>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
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

function joinPackagePath(nodeModulesRoot, packageName) {
  return join(nodeModulesRoot, ...packageName.split("/"));
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

function selectPackageJsonFields(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description ?? null,
    main: packageJson.main ?? null,
    type: packageJson.type ?? null,
    exports: packageJson.exports ?? null,
    browser: packageJson.browser ?? null,
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

export { stringifyReactTestRendererActOracle };
