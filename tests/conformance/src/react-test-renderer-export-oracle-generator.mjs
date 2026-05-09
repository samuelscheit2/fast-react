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
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REACT_TEST_RENDERER_EXPORT_CONDITION_MODES,
  REACT_TEST_RENDERER_EXPORT_CREATE_WARNING_SCENARIOS,
  REACT_TEST_RENDERER_EXPORT_PROBE_MODES,
  REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS,
  REACT_TEST_RENDERER_EXPORT_SHALLOW_SUBPATHS,
  REACT_TEST_RENDERER_EXPORT_SOURCE_DOCUMENTS,
  REACT_TEST_RENDERER_EXPORT_SUPPORTING_TARGETS,
  REACT_TEST_RENDERER_EXPORT_TARGET
} from "./react-test-renderer-export-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-test-renderer-export-oracle-";

const ALL_PACKAGE_TARGETS = [
  REACT_TEST_RENDERER_EXPORT_TARGET,
  ...REACT_TEST_RENDERER_EXPORT_SUPPORTING_TARGETS
];

export async function generateReactTestRendererExportOracle() {
  const tempRoot = mkdtempSync(join(tmpdir(), ORACLE_TEMP_PREFIX));

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const packages = {};
    const packageRoots = new Map();

    for (const target of ALL_PACKAGE_TARGETS) {
      const evidence = await fetchAndExtractPackage({
        nodeModulesRoot,
        target,
        tempRoot
      });
      packages[target.packageName] = evidence.inventory;
      packageRoots.set(target.packageName, realpathSync(evidence.packageRoot));
    }

    validateReactTestRendererPackage(packages["react-test-renderer"]);

    const probeFile = writeProbeFile(projectRoot);
    const runtimeExportObservations = {};
    for (const mode of REACT_TEST_RENDERER_EXPORT_PROBE_MODES) {
      runtimeExportObservations[mode.id] =
        REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS.map((subpath) =>
          runRuntimeProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            subpath
          })
        );
    }

    const conditionResolution = {};
    for (const mode of REACT_TEST_RENDERER_EXPORT_CONDITION_MODES) {
      conditionResolution[mode.id] =
        REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS.map((subpath) =>
          runResolutionProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            subpath
          })
        );
    }

    const createWarningObservations =
      REACT_TEST_RENDERER_EXPORT_CREATE_WARNING_SCENARIOS.map((scenario) =>
        runCreateWarningProbe({
          packageRoots,
          probeFile,
          projectRoot,
          scenario
        })
      );

    const shallowRemovalObservations = {};
    for (const mode of REACT_TEST_RENDERER_EXPORT_PROBE_MODES) {
      shallowRemovalObservations[mode.id] =
        REACT_TEST_RENDERER_EXPORT_SHALLOW_SUBPATHS.map((subpath) =>
          runShallowInvocationProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            subpath
          })
        );
    }

    const loadedDependencyEvidence = describeLoadedDependencyEvidence(
      runtimeExportObservations
    );

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-test-renderer-export-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "react-test-renderer@19.2.6 runtime export and descriptor oracle",
      sources: REACT_TEST_RENDERER_EXPORT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "exact npm tarballs extracted into a temporary node_modules tree and probed through isolated Node child processes",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per react-test-renderer subpath, condition, warning scenario, and shallow invocation mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false
      },
      evidenceClaims: {
        npmMetadataResolved: true,
        exactTarballsDownloaded: true,
        tarballIntegrityVerified: true,
        packageMetadataCaptured: true,
        runtimeExportsProbed: true,
        descriptorShapeProbed: true,
        legacyPhysicalSubpathsProbed: true,
        conditionResolutionProbed: true,
        shallowRemovalProbed: true,
        deprecationWarningSurfaceProbed: true,
        fastReactComparedToReactTestRenderer: false
      },
      conformanceClaims: {
        realReactTestRendererBehaviorProbed: true,
        fastReactComparedToReactTestRenderer: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      reactTestRendererTarget: REACT_TEST_RENDERER_EXPORT_TARGET,
      supportingRuntimePackages: REACT_TEST_RENDERER_EXPORT_SUPPORTING_TARGETS,
      probeModes: REACT_TEST_RENDERER_EXPORT_PROBE_MODES,
      conditionModes: REACT_TEST_RENDERER_EXPORT_CONDITION_MODES,
      createWarningScenarios:
        REACT_TEST_RENDERER_EXPORT_CREATE_WARNING_SCENARIOS,
      runtimeSubpaths: REACT_TEST_RENDERER_EXPORT_RUNTIME_SUBPATHS,
      shallowSubpaths: REACT_TEST_RENDERER_EXPORT_SHALLOW_SUBPATHS,
      packages,
      dependencyEvidence: {
        declaredDependencies:
          packages["react-test-renderer"].packageJson.dependencies,
        declaredPeerDependencies:
          packages["react-test-renderer"].packageJson.peerDependencies,
        exactSupportingPackagesInstalled: true,
        reactPeerLoadedByRendererExports:
          loadedDependencyEvidence.reactPeerLoaded,
        reactIsDeclaredButNotLoadedByExportProbes:
          !loadedDependencyEvidence.reactIsLoaded,
        schedulerMockLoadedByRendererExports:
          loadedDependencyEvidence.schedulerMockLoaded,
        schedulerRootLoadedByRendererExports:
          loadedDependencyEvidence.schedulerRootLoaded
      },
      packageSurface: {
        packageExportsMap: null,
        packageType: null,
        main: "index.js",
        legacyCommonJsPhysicalSubpathsPublic: true,
        blockedPhysicalSubpathsProbed: false
      },
      coverage: {
        packageMetadata: true,
        exportKeys: true,
        propertyDescriptors: true,
        commonJsRequire: true,
        dynamicImportInterop: true,
        nodeEnvBundleSelection: true,
        reactServerConditionFailure: true,
        shallowRemoval: true,
        deprecationWarning: true,
        dependencyLoadEvidence: true,
        fastReactPlaceholderOnly: true
      },
      runtimeExportObservations,
      conditionResolution,
      createWarningObservations,
      shallowRemovalObservations,
      unsupportedFastReactEvidence: {
        packageName: "@fast-react/react-test-renderer",
        status: "unsupported-placeholder",
        comparedToReact: false,
        reason:
          "Fast React has no JS react-test-renderer facade in this write scope; this oracle records React package behavior only."
      },
      intentionalGaps: [
        {
          id: "no-fast-react-react-test-renderer-comparison",
          reason:
            "This oracle records pinned react-test-renderer package behavior only; Fast React test-renderer JS compatibility is not claimed."
        },
        {
          id: "no-renderer-lifecycle-semantics",
          reason:
            "Root lifecycle, update, act scheduling, serialization, and TestInstance behavior are assigned to later react-test-renderer oracle workers."
        },
        {
          id: "node-condition-resolution-only",
          reason:
            "Browser custom-condition evidence is Node resolver evidence, not execution in a browser runtime."
        }
      ]
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

function validateReactTestRendererPackage(packageEvidence) {
  assertDeepEqual(
    packageEvidence.packageJson.dependencies,
    {
      "react-is": "^19.2.6",
      scheduler: "^0.27.0"
    },
    "react-test-renderer dependencies"
  );
  assertDeepEqual(
    packageEvidence.packageJson.peerDependencies,
    {
      react: "^19.2.6"
    },
    "react-test-renderer peer dependencies"
  );
  if (packageEvidence.packageJson.exports !== null) {
    throw new Error("react-test-renderer unexpectedly gained an exports map");
  }
}

function describeLoadedDependencyEvidence(runtimeExportObservations) {
  const loadedFiles = collectLoadedCacheFiles(runtimeExportObservations);
  return {
    reactPeerLoaded: hasLoadedPackageFile(loadedFiles, "react"),
    reactIsLoaded: hasLoadedPackageFile(loadedFiles, "react-is"),
    schedulerMockLoaded: loadedFiles.has(
      "node_modules/scheduler/unstable_mock.js"
    ),
    schedulerRootLoaded: loadedFiles.has("node_modules/scheduler/index.js")
  };
}

function collectLoadedCacheFiles(runtimeExportObservations) {
  const loadedFiles = new Set();

  for (const observations of Object.values(runtimeExportObservations)) {
    for (const observation of observations) {
      for (const file of observation.finalCacheFiles ?? []) {
        loadedFiles.add(file);
      }
    }
  }

  return loadedFiles;
}

function hasLoadedPackageFile(loadedFiles, packageName) {
  const packagePrefix = `node_modules/${packageName}/`;
  for (const file of loadedFiles) {
    if (file.startsWith(packagePrefix)) {
      return true;
    }
  }

  return false;
}

async function fetchAndExtractPackage({ nodeModulesRoot, target, tempRoot }) {
  const metadata = await fetchPackageMetadata(target);
  const dist = metadata.dist ?? {};
  if (!dist.tarball) {
    throw new Error(`${target.packageName}@${target.version} has no tarball`);
  }
  if (dist.integrity !== target.expectedDistIntegrity) {
    throw new Error(
      `${target.packageName}@${target.version} dist.integrity mismatch`
    );
  }
  if (dist.shasum !== target.expectedDistShasum) {
    throw new Error(
      `${target.packageName}@${target.version} dist.shasum mismatch`
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
      targetStatus: target.targetStatus ?? null,
      registry: {
        metadataUrl: registryPackageVersionUrl(target),
        distTarball: dist.tarball,
        distIntegrity: dist.integrity ?? null,
        distShasum: dist.shasum ?? null,
        unpackedSize: dist.unpackedSize ?? null,
        fileCount: dist.fileCount ?? null
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
  const probeFile = join(
    projectRoot,
    "react-test-renderer-export-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-test-renderer-export-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runRuntimeProbe({ mode, packageRoots, probeFile, projectRoot, subpath }) {
  const specifier = packageSpecifier(subpath);
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    args: ["runtime", specifier],
    env: {
      NODE_ENV: mode.nodeEnv
    }
  });
  return {
    id: runtimeProbeId(subpath),
    packageName: REACT_TEST_RENDERER_EXPORT_TARGET.packageName,
    subpath,
    specifier,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    ...normalizeDeep({
      packageRoots,
      value: result
    })
  };
}

function runResolutionProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  subpath
}) {
  const specifier = packageSpecifier(subpath);
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    args: ["resolution", specifier]
  });
  return {
    id: runtimeProbeId(subpath),
    packageName: REACT_TEST_RENDERER_EXPORT_TARGET.packageName,
    subpath,
    specifier,
    conditionMode: mode.id,
    ...normalizeDeep({
      packageRoots,
      value: result
    })
  };
}

function runCreateWarningProbe({
  packageRoots,
  probeFile,
  projectRoot,
  scenario
}) {
  const specifier = packageSpecifier(".");
  const result = runProbe({
    mode: scenario,
    probeFile,
    projectRoot,
    args: [
      "create-warning",
      specifier,
      JSON.stringify({
        reactNativeTestEnvironment: scenario.reactNativeTestEnvironment
      })
    ],
    env: {
      NODE_ENV: scenario.nodeEnv
    }
  });
  return {
    id: scenario.id,
    nodeEnv: scenario.nodeEnv,
    reactNativeTestEnvironment: scenario.reactNativeTestEnvironment,
    ...normalizeDeep({
      packageRoots,
      value: result
    })
  };
}

function runShallowInvocationProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  subpath
}) {
  const specifier = packageSpecifier(subpath);
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    args: ["shallow-invocation", specifier],
    env: {
      NODE_ENV: mode.nodeEnv
    }
  });
  return {
    id: runtimeProbeId(subpath),
    packageName: REACT_TEST_RENDERER_EXPORT_TARGET.packageName,
    subpath,
    specifier,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    ...normalizeDeep({
      packageRoots,
      value: result
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
      env: buildProbeEnv(env),
      timeout: PROBE_TIMEOUT_MS
    }
  );

  const command = `node ${(mode.nodeArgs ?? []).join(" ")} ${basename(
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

function buildProbeEnv(overrides) {
  const base = {};
  for (const key of ["PATH", "SystemRoot", "ComSpec"]) {
    if (process.env[key]) {
      base[key] = process.env[key];
    }
  }

  return {
    ...base,
    ...overrides
  };
}

function packageSpecifier(subpath) {
  if (subpath === ".") {
    return REACT_TEST_RENDERER_EXPORT_TARGET.packageName;
  }

  return `${REACT_TEST_RENDERER_EXPORT_TARGET.packageName}/${subpath.replace(
    /^\.\//u,
    ""
  )}`;
}

function runtimeProbeId(subpath) {
  return `${REACT_TEST_RENDERER_EXPORT_TARGET.packageName}:${subpath}`;
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
    return normalizePathFragment({
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

function normalizePathFragment({ packageRoots, value }) {
  if (value.startsWith("file:")) {
    return `file://${normalizeResolvedPath({
      packageRoots,
      resolvedPath: fileURLToPath(value)
    })}`;
  }

  let normalized = value;
  for (const [packageName, packageRoot] of packageRoots) {
    normalized = normalized.replaceAll(packageRoot, `node_modules/${packageName}`);
  }

  return normalizeGenericPath(normalized);
}

function normalizeResolvedPath({ packageRoots, resolvedPath }) {
  if (!resolvedPath) {
    return null;
  }

  let realResolvedPath = resolvedPath;
  try {
    realResolvedPath = realpathSync(resolvedPath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  for (const [packageName, packageRoot] of packageRoots) {
    const relativePath = relative(packageRoot, realResolvedPath);
    if (!relativePath.startsWith("..") && !relativePath.includes(`..${sep}`)) {
      return `node_modules/${packageName}/${relativePath.split(sep).join("/")}`;
    }
  }

  return normalizeGenericPath(realResolvedPath);
}

function normalizeGenericPath(value) {
  return value
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
