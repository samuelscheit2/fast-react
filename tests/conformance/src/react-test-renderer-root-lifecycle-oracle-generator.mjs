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
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_PROBE_MODES,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_RUNTIME_INVENTORY_PATH,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_SOURCE_DOCUMENTS,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET
} from "./react-test-renderer-root-lifecycle-targets.mjs";
import {
  REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIOS
} from "./react-test-renderer-root-lifecycle-scenarios.mjs";

const PROBE_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX =
  "fast-react-react-test-renderer-root-lifecycle-oracle-";

export async function generateReactTestRendererRootLifecycleOracle() {
  const inventoryText = readFileSync(
    new URL(
      `../${REACT_TEST_RENDERER_ROOT_LIFECYCLE_RUNTIME_INVENTORY_PATH}`,
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

    const allTargets = [
      REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET,
      ...REACT_TEST_RENDERER_ROOT_LIFECYCLE_SUPPORTING_TARGETS
    ];
    const packageRoots = new Map();
    const packages = {};

    for (const target of allTargets) {
      const packageEvidence = sourceInventory.packages?.[target.packageName]
        ? await fetchAndExtractInventoryPackage({
            nodeModulesRoot,
            packageName: target.packageName,
            sourceInventory,
            tempRoot
          })
        : await fetchAndExtractRegistryPackage({
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
    const rootLifecycleObservations = {};

    for (const mode of REACT_TEST_RENDERER_ROOT_LIFECYCLE_PROBE_MODES) {
      rootLifecycleObservations[mode.id] = [];

      for (const scenario of REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIOS) {
        rootLifecycleObservations[mode.id].push(
          runReactTestRendererRootLifecycleProbe({
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
      oracleKind: "react-19.2.6-react-test-renderer-root-lifecycle-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React Test Renderer 19.2.6 create/update/unmount root lifecycle behavior oracle",
      sources: REACT_TEST_RENDERER_ROOT_LIFECYCLE_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact react-test-renderer npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per react-test-renderer root lifecycle scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary extraction roots and local workspace paths are normalized before artifact write"
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactReactAndSchedulerTarballUrlsFromInventory: true,
        reactTestRendererMetadataResolved: true,
        reactIsMetadataResolved: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        createUpdateUnmountBehaviorProbed: true,
        rootAccessBehaviorProbed: true,
        getInstanceBehaviorProbed: true,
        createNodeMockBehaviorProbed: true,
        strictAndConcurrentOptionsProbed: true,
        postUnmountErrorsProbed: true,
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
      sourceInventory: {
        path: REACT_TEST_RENDERER_ROOT_LIFECYCLE_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactAndSchedulerPackagesMatched: true
      },
      reactTestRendererTarget: REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET,
      supportingRuntimePackages:
        REACT_TEST_RENDERER_ROOT_LIFECYCLE_SUPPORTING_TARGETS,
      probeModes: REACT_TEST_RENDERER_ROOT_LIFECYCLE_PROBE_MODES,
      scenarios: REACT_TEST_RENDERER_ROOT_LIFECYCLE_SCENARIOS,
      packages,
      coverage: {
        moduleExportShape: true,
        createRawActBoundary: true,
        createUpdateUnmountFlow: true,
        rootAccessBoundaries: true,
        getInstanceBoundaries: true,
        createNodeMockRefLifecycle: true,
        strictModeOption: true,
        concurrentOption: true,
        reactNativeTestEnvironmentBranch: true,
        postUnmountErrors: true,
        developmentAndProductionModes: true,
        privateInternalsAvoided: true
      },
      intentionalGaps: [
        {
          id: "no-fast-react-react-test-renderer-comparison",
          reason:
            "This oracle records pinned React Test Renderer package behavior only; Fast React test-renderer facade implementation is owned by separate workers."
        },
        {
          id: "no-private-fiber-or-root-reads",
          reason:
            "The probes use only public react-test-renderer root APIs, public React act, console diagnostics, refs, and serialization outputs."
        },
        {
          id: "no-wall-clock-scheduling-claims",
          reason:
            "The oracle records logical post-create/update/unmount states and act boundaries; it does not assert raw task timing."
        }
      ],
      rootLifecycleObservations
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

  for (const target of REACT_TEST_RENDERER_ROOT_LIFECYCLE_SUPPORTING_TARGETS) {
    if (!["react", "scheduler"].includes(target.packageName)) {
      continue;
    }

    const inventoryPackage = sourceInventory.packages?.[target.packageName];
    if (!inventoryPackage) {
      throw new Error(
        `Checked runtime inventory does not include package ${target.packageName}`
      );
    }
    if (inventoryPackage.version !== target.version) {
      throw new Error(
        `Checked runtime inventory has ${target.packageName}@${inventoryPackage.version}; expected ${target.version}`
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

  const tarballPath = writeTarball({
    packageName,
    tempRoot,
    version: inventoryPackage.version,
    bytes: tarballBytes
  });
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

async function fetchAndExtractRegistryPackage({
  nodeModulesRoot,
  target,
  tempRoot
}) {
  const metadata = await fetchPackageMetadata(target);
  if (metadata.name !== target.packageName) {
    throw new Error(
      `${target.packageName} metadata package name mismatch: ${metadata.name}`
    );
  }
  if (metadata.version !== target.version) {
    throw new Error(
      `${target.packageName} metadata package version mismatch: ${metadata.version}`
    );
  }

  const dist = metadata.dist ?? {};
  if (!dist.tarball) {
    throw new Error(
      `${target.packageName}@${target.version} metadata did not include a tarball URL`
    );
  }
  if (!dist.integrity) {
    throw new Error(
      `${target.packageName}@${target.version} metadata did not include dist.integrity`
    );
  }
  if (
    target.expectedDistIntegrity &&
    dist.integrity !== target.expectedDistIntegrity
  ) {
    throw new Error(
      `${target.packageName}@${target.version} dist.integrity did not match pinned evidence`
    );
  }

  const tarballBytes = await fetchBytes(dist.tarball);
  const integrity = verifyTarballIntegrity(dist.integrity, tarballBytes);
  const tarballPath = writeTarball({
    packageName: target.packageName,
    tempRoot,
    version: target.version,
    bytes: tarballBytes
  });
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
      targetStatus: "pinned-npm-package-target",
      registry: {
        metadataUrl: registryPackageVersionUrl(target),
        distTarball: dist.tarball,
        distIntegrity: dist.integrity,
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
      packageJson: selectPackageJsonFields(packageJson),
      publicSubpaths: packageJson.exports
        ? Object.keys(packageJson.exports).sort()
        : null,
      runtimeSubpaths: tarballFiles
        .filter((file) => file.endsWith(".js"))
        .map((file) => `./${file}`)
        .sort()
    }
  };
}

function writeTarball({ packageName, tempRoot, version, bytes }) {
  const tarballRoot = join(tempRoot, "tarballs");
  mkdirSync(tarballRoot, { recursive: true });
  const tarballPath = join(
    tarballRoot,
    `${packageName.replaceAll("/", "__")}-${version}.tgz`
  );
  writeFileSync(tarballPath, bytes);
  return tarballPath;
}

function writeProbeFile(projectRoot) {
  const probeFile = join(
    projectRoot,
    "react-test-renderer-root-lifecycle-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL(
        "./react-test-renderer-root-lifecycle-probe-runner.mjs",
        import.meta.url
      ),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactTestRendererRootLifecycleProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenarioId
}) {
  const parsed = runProbe({
    args: [REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET.packageName, scenarioId],
    env: {
      NODE_ENV: mode.nodeEnv
    },
    mode,
    probeFile,
    projectRoot
  });

  assertDeepEqual(
    {
      targetPackage: parsed.targetPackage,
      scenarioId: parsed.scenarioId
    },
    {
      targetPackage: REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET.packageName,
      scenarioId
    },
    `${mode.id}:${scenarioId} probe identity`
  );

  return {
    scenarioId,
    packageName: REACT_TEST_RENDERER_ROOT_LIFECYCLE_TARGET.packageName,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    result: normalizeProbeResult({
      packageRoots,
      value: parsed.result
    }),
    consoleCalls: normalizeProbeResult({
      packageRoots,
      value: parsed.consoleCalls
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
    throw new Error(`${command} exited ${spawnResult.status}: ${spawnResult.stderr}`);
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
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
}

function fetchPackageMetadata(target) {
  return fetchJson(registryPackageVersionUrl(target));
}

function registryPackageVersionUrl(target) {
  return `https://registry.npmjs.org/${encodeURIComponent(
    target.packageName
  )}/${target.version}`;
}

async function fetchJson(url) {
  const bytes = await fetchBytes(url);
  return JSON.parse(bytes.toString("utf8"));
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
    peerDependencies: packageJson.peerDependencies ?? null
  };
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
