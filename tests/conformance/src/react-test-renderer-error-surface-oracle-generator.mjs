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
import { basename, dirname, join } from "node:path";

import {
  REACT_TEST_RENDERER_ERROR_SURFACE_PROBE_MODES,
  REACT_TEST_RENDERER_ERROR_SURFACE_SOURCE_DOCUMENTS,
  REACT_TEST_RENDERER_ERROR_SURFACE_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_ERROR_SURFACE_TARGET
} from "./react-test-renderer-error-surface-targets.mjs";
import {
  REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIOS
} from "./react-test-renderer-error-surface-scenarios.mjs";
import { stringifyReactTestRendererErrorSurfaceOracle } from "./react-test-renderer-error-surface-oracle.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX =
  "fast-react-react-test-renderer-error-surface-oracle-";

export async function generateReactTestRendererErrorSurfaceOracle() {
  const tempRoot = mkdtempSync(join(tmpdir(), ORACLE_TEMP_PREFIX));

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const packageTargets = [
      REACT_TEST_RENDERER_ERROR_SURFACE_TARGET,
      ...REACT_TEST_RENDERER_ERROR_SURFACE_SUPPORTING_TARGETS
    ];
    const packages = {};

    for (const target of packageTargets) {
      packages[target.packageName] = await fetchAndExtractPackage({
        nodeModulesRoot,
        target,
        tempRoot
      });
    }

    validateInstalledPackageRelationships(packages);

    const probeFile = writeProbeFile(projectRoot);
    const reactTestRendererErrorSurfaceObservations = {};

    for (const mode of REACT_TEST_RENDERER_ERROR_SURFACE_PROBE_MODES) {
      reactTestRendererErrorSurfaceObservations[mode.id] =
        REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIOS.map((scenario) =>
          runReactTestRendererErrorSurfaceProbe({
            mode,
            packageName:
              REACT_TEST_RENDERER_ERROR_SURFACE_TARGET.packageName,
            probeFile,
            projectRoot,
            scenarioId: scenario.id
          })
        );
    }

    return {
      schemaVersion: 1,
      oracleKind:
        "react-19.2.6-react-test-renderer-error-surface-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React 19.2.6 react-test-renderer public error surface oracle",
      sources: REACT_TEST_RENDERER_ERROR_SURFACE_SOURCE_DOCUMENTS,
      generation: {
        method:
          "exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation: "one Node child process per scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary roots, package roots, file URLs, stack paths, and local workspace paths are normalized before artifact serialization",
        actEnvironment:
          "probes set IS_REACT_ACT_ENVIRONMENT and wrap create/update/unmount work in react-test-renderer act()"
      },
      evidenceClaims: {
        npmMetadataResolved: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        packageDependencyGraphVerified: true,
        testInstanceQueryErrorsProbed: true,
        unmountedRootAccessProbed: true,
        invalidCreateUpdateInputsProbed: true,
        shallowRemovalProbed: true,
        unsupportedUseMessageProbed: true,
        deterministicPathNormalizationApplied: true,
        fastReactComparedToReactTestRenderer: false
      },
      conformanceClaims: {
        realReactTestRendererBehaviorProbed: true,
        fastReactComparedToReactTestRenderer: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      reactTestRendererTarget: REACT_TEST_RENDERER_ERROR_SURFACE_TARGET,
      supportingRuntimePackages:
        REACT_TEST_RENDERER_ERROR_SURFACE_SUPPORTING_TARGETS,
      probeModes: REACT_TEST_RENDERER_ERROR_SURFACE_PROBE_MODES,
      scenarios: REACT_TEST_RENDERER_ERROR_SURFACE_SCENARIOS,
      packages,
      coverage: {
        invalidFindAndFindByResults: true,
        unmountedRootAccess: true,
        retainedUnmountedTestInstanceAccess: true,
        invalidCreateInputs: true,
        invalidUpdateInputs: true,
        shallowRemoval: true,
        unsupportedMessages: true,
        consoleWarningCapture: true,
        productionBehavior: false,
        fastReactComparison: false
      },
      intentionalGaps: [
        {
          id: "no-fast-react-test-renderer-comparison",
          reason:
            "This oracle records pinned React test renderer public error messages only; Fast React test-renderer JS facade work is outside this worker scope."
        },
        {
          id: "development-act-flushed-public-errors",
          reason:
            "React 19.2.6 production react-test-renderer omits public act(), so this oracle uses development act()-flushed behavior for deterministic public error surfaces."
        },
        {
          id: "no-renderer-implementation-claim",
          reason:
            "The oracle covers public thrown messages and console calls, not reconciler correctness, scheduler timing, tree serialization, or host mutation implementation."
        }
      ],
      reactTestRendererErrorSurfaceObservations
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
      `${target.packageName}@${target.version} dist.integrity did not match pinned evidence`
    );
  }
  if (dist.shasum !== target.expectedDistShasum) {
    throw new Error(
      `${target.packageName}@${target.version} dist.shasum did not match pinned evidence`
    );
  }

  const tarballBytes = await fetchBytes(dist.tarball);
  const integrity = verifyTarballIntegrity(dist.integrity, tarballBytes);
  const tarballsRoot = join(tempRoot, "tarballs");
  mkdirSync(tarballsRoot, { recursive: true });
  const tarballPath = join(
    tarballsRoot,
    `${target.packageName.replaceAll("/", "__")}-${target.version}.tgz`
  );
  writeFileSync(tarballPath, tarballBytes);

  const packageRoot = joinPackagePath(nodeModulesRoot, target.packageName);
  mkdirSync(dirname(packageRoot), { recursive: true });
  mkdirSync(packageRoot, { recursive: true });
  const tarballFiles = listTarballFiles(tarballPath);
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
    packageName: target.packageName,
    version: target.version,
    role: target.role,
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
  };
}

function validateInstalledPackageRelationships(packages) {
  const rendererPackage = packages["react-test-renderer"].packageJson;
  assertDeepEqual(
    rendererPackage.dependencies,
    {
      "react-is": "^19.2.6",
      scheduler: "^0.27.0"
    },
    "react-test-renderer dependencies"
  );
  assertDeepEqual(
    rendererPackage.peerDependencies,
    {
      react: "^19.2.6"
    },
    "react-test-renderer peer dependencies"
  );
}

function writeProbeFile(projectRoot) {
  const probeFile = join(
    projectRoot,
    "react-test-renderer-error-surface-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL(
        "./react-test-renderer-error-surface-probe-runner.mjs",
        import.meta.url
      ),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactTestRendererErrorSurfaceProbe({
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
  return normalizeStringFragments(result);
}

function normalizeStringFragments(value) {
  if (typeof value === "string") {
    return normalizePathFragments(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeStringFragments);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    next[key] = normalizeStringFragments(child);
  }
  return next;
}

function normalizePathFragments(message) {
  return message
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)]+/gu, "<workspace>");
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

function selectPackageJsonFields(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description ?? null,
    main: packageJson.main ?? null,
    exports: packageJson.exports ?? null,
    dependencies: packageJson.dependencies ?? null,
    peerDependencies: packageJson.peerDependencies ?? null,
    license: packageJson.license ?? null,
    files: packageJson.files ?? null
  };
}

function joinPackagePath(nodeModulesRoot, packageName) {
  const segments = packageName.split("/");
  return join(nodeModulesRoot, ...segments);
}

function assertDeepEqual(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${label} mismatch:\nexpected ${expectedJson}\nactual   ${actualJson}`
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

export function stringifyGeneratedReactTestRendererErrorSurfaceOracle(oracle) {
  return stringifyReactTestRendererErrorSurfaceOracle(oracle);
}
