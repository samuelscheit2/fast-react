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

import {
  REACT_TEST_RENDERER_SERIALIZATION_SCENARIOS
} from "./react-test-renderer-serialization-scenarios.mjs";
import {
  REACT_TEST_RENDERER_SERIALIZATION_PACKAGES,
  REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS,
  REACT_TEST_RENDERER_SERIALIZATION_PROBE_MODES,
  REACT_TEST_RENDERER_SERIALIZATION_SOURCE_DOCUMENTS,
  REACT_TEST_RENDERER_SERIALIZATION_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_SERIALIZATION_TARGET
} from "./react-test-renderer-serialization-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX =
  "fast-react-react-test-renderer-serialization-oracle-";

export async function generateReactTestRendererSerializationOracle() {
  const tempRoot = mkdtempSync(join(tmpdir(), ORACLE_TEMP_PREFIX));

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const packages = {};
    const packageRoots = new Map();
    for (const target of REACT_TEST_RENDERER_SERIALIZATION_PACKAGES) {
      const packageEvidence = await fetchAndExtractPackageTarget({
        nodeModulesRoot,
        target,
        tempRoot
      });
      packages[target.packageName] = packageEvidence.inventory;
      packageRoots.set(
        target.packageName,
        realpathSync(packageEvidence.packageRoot)
      );
    }

    const probeFile = writeProbeFile(projectRoot);
    const observations = {};

    for (const mode of REACT_TEST_RENDERER_SERIALIZATION_PROBE_MODES) {
      observations[mode.id] = [];

      for (const scenario of REACT_TEST_RENDERER_SERIALIZATION_SCENARIOS) {
        observations[mode.id].push(
          runReactTestRendererSerializationProbe({
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
      oracleKind:
        "react-19.2.6-react-test-renderer-serialization-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React 19.2.6 react-test-renderer toJSON, toTree, and TestInstance serialization oracle",
      sources: REACT_TEST_RENDERER_SERIALIZATION_SOURCE_DOCUMENTS,
      generation: {
        method:
          "exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per react-test-renderer scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary extraction roots and local workspace paths are normalized before artifact write"
      },
      evidenceClaims: {
        exactTarballUrlsPinned: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballPackageJsonMatchedTargets: true,
        hostNodeSerializationProbed: true,
        textNodeSerializationProbed: true,
        emptyRootSerializationProbed: true,
        hiddenOutputSerializationProbed: true,
        propsWithoutChildrenProbed: true,
        compositeToTreeProbed: true,
        testInstanceFindBasicsProbed: true,
        privateReactTestRendererInternalsRead: false,
        fastReactComparedToReactTestRenderer: false
      },
      conformanceClaims: {
        realReactTestRendererBehaviorProbed: true,
        fastReactComparedToReactTestRenderer: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      reactTestRendererTarget: REACT_TEST_RENDERER_SERIALIZATION_TARGET,
      supportingRuntimePackages:
        REACT_TEST_RENDERER_SERIALIZATION_SUPPORTING_TARGETS,
      localFastReactStatus:
        REACT_TEST_RENDERER_SERIALIZATION_LOCAL_FAST_REACT_STATUS,
      probeModes: REACT_TEST_RENDERER_SERIALIZATION_PROBE_MODES,
      scenarios: REACT_TEST_RENDERER_SERIALIZATION_SCENARIOS,
      packages,
      coverage: {
        toJSONHostNodes: true,
        toJSONTextNodes: true,
        toJSONEmptyRoots: true,
        toJSONHiddenActivityOutput: true,
        toJSONPropsExcludeChildren: true,
        toTreeHostNodes: true,
        toTreeTextNodes: true,
        toTreeCompositeNodes: true,
        toTreeActivityPublicError: true,
        testInstanceRootGetter: true,
        testInstanceFindAndFindAll: true,
        testInstanceFindByType: true,
        testInstanceFindByProps: true,
        developmentActMount: true,
        productionFlushSyncMount: true,
        privateInternalsAvoided: true
      },
      intentionalGaps: [
        {
          id: "no-fast-react-test-renderer-comparison",
          reason:
            "This oracle records pinned react-test-renderer behavior only; Fast React test-renderer implementation work is owned by separate workers."
        },
        {
          id: "no-private-fiber-reads",
          reason:
            "The probe uses only public react-test-renderer exports, renderer object methods, and TestInstance methods. It does not read private Fiber fields."
        },
        {
          id: "no-react-server-serialization-mode",
          reason:
            "react-test-renderer is a client renderer surface and does not provide deterministic mounted serialization behavior under the react-server condition."
        },
        {
          id: "no-effect-or-suspense-scheduling-claims",
          reason:
            "This oracle is scoped to deterministic serialization and TestInstance query behavior. act scheduling, Suspense pinging, and error surfaces are covered by dedicated workers."
        }
      ],
      observations
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function fetchAndExtractPackageTarget({
  nodeModulesRoot,
  target,
  tempRoot
}) {
  const tarballBytes = await fetchBytes(target.registry.distTarball);
  const integrity = verifyTarballIntegrity(
    target.registry.distIntegrity,
    tarballBytes
  );

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
      registry: target.registry,
      tarball: {
        integrityAlgorithm: integrity.algorithm,
        integrityDigest: integrity.digest,
        sha256: createHash("sha256").update(tarballBytes).digest("hex"),
        fileCount: tarballFiles.length,
        filesSha256: createHash("sha256")
          .update(`${tarballFiles.join("\n")}\n`)
          .digest("hex"),
        files: tarballFiles
      },
      packageJson: summarizePackageJson(packageJson)
    }
  };
}

function summarizePackageJson(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    main: packageJson.main ?? null,
    exports: packageJson.exports ?? null,
    dependencies: packageJson.dependencies ?? {},
    peerDependencies: packageJson.peerDependencies ?? {}
  };
}

function writeProbeFile(projectRoot) {
  const probeFile = join(
    projectRoot,
    "react-test-renderer-serialization-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL(
        "./react-test-renderer-serialization-probe-runner.mjs",
        import.meta.url
      ),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactTestRendererSerializationProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenarioId
}) {
  const result = runProbe({
    args: [
      REACT_TEST_RENDERER_SERIALIZATION_TARGET.packageName,
      mode.id,
      scenarioId
    ],
    env: {
      NODE_ENV: mode.nodeEnv
    },
    mode,
    probeFile,
    projectRoot
  });

  assertDeepEqual(
    {
      targetPackage: result.targetPackage,
      modeId: result.modeId,
      scenarioId: result.scenarioId
    },
    {
      targetPackage: REACT_TEST_RENDERER_SERIALIZATION_TARGET.packageName,
      modeId: mode.id,
      scenarioId
    },
    `${mode.id}:${scenarioId} probe identity`
  );

  return {
    scenarioId,
    packageName: REACT_TEST_RENDERER_SERIALIZATION_TARGET.packageName,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    mountStrategy: result.mountStrategy,
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

function runProbe({ args, env = {}, mode, probeFile, projectRoot }) {
  const spawnResult = spawnSync(
    process.execPath,
    [...mode.nodeArgs, probeFile, ...args],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        ...env
      },
      timeout: PROBE_TIMEOUT_MS
    }
  );

  const command = `node ${mode.nodeArgs.join(" ")} ${basename(
    probeFile
  )} ${args.join(" ")}`;
  if (spawnResult.error) {
    throw new Error(`${command} failed: ${spawnResult.error.message}`);
  }
  if (spawnResult.status !== 0) {
    throw new Error(
      `${command} exited ${spawnResult.status}: ${spawnResult.stderr}`
    );
  }

  try {
    return JSON.parse(spawnResult.stdout);
  } catch (error) {
    throw new Error(
      `${command} did not emit JSON: ${spawnResult.stdout}\n${error.message}`
    );
  }
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
    .replace(/\/Users\/[^/\s)'"]+\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
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
