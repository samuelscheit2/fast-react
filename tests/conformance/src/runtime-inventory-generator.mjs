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

import {
  CONDITION_RESOLUTION_MODES,
  GENERATED_RUNTIME_TARGETS,
  GENERATED_SUPPORTING_RUNTIME_PACKAGES,
  MANUAL_INVENTORY_FIELDS,
  RUNTIME_PROBE_MODES,
  SOURCE_DOCUMENTS
} from "./inventory-targets.mjs";
import { packageSpecifier, runtimeProbeId } from "./runtime-inventory.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;

export async function generateRuntimeInventory() {
  const tempRoot = mkdtempSync(join(tmpdir(), "fast-react-runtime-inventory-"));

  try {
    const packageTargets = [
      ...GENERATED_RUNTIME_TARGETS,
      ...GENERATED_SUPPORTING_RUNTIME_PACKAGES
    ];
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const packages = {};
    const packageRoots = new Map();

    for (const target of packageTargets) {
      const packageEvidence = await fetchAndExtractPackage({
        target,
        tempRoot,
        nodeModulesRoot
      });

      packages[target.packageName] = packageEvidence.inventory;
      packageRoots.set(
        target.packageName,
        realpathSync(packageEvidence.packageRoot)
      );
    }

    const probeFile = writeRuntimeProbeFile(projectRoot);
    const runtimeProbes = {};

    for (const mode of RUNTIME_PROBE_MODES) {
      runtimeProbes[mode.id] = [];

      for (const target of GENERATED_RUNTIME_TARGETS) {
        const packageEvidence = packages[target.packageName];
        for (const subpath of packageEvidence.runtimeSubpaths) {
          runtimeProbes[mode.id].push(
            runRuntimeProbe({
              mode,
              packageName: target.packageName,
              packageRoots,
              probeFile,
              projectRoot,
              subpath
            })
          );
        }
      }
    }

    const conditionResolution = {};
    const resolutionProbeFile = writeResolutionProbeFile(projectRoot);

    for (const mode of CONDITION_RESOLUTION_MODES) {
      conditionResolution[mode.id] = [];

      for (const target of GENERATED_RUNTIME_TARGETS) {
        const packageEvidence = packages[target.packageName];
        for (const subpath of packageEvidence.publicSubpaths) {
          conditionResolution[mode.id].push(
            runResolutionProbe({
              mode,
              packageName: target.packageName,
              packageRoots,
              probeFile: resolutionProbeFile,
              projectRoot,
              subpath
            })
          );
        }
      }
    }

    const blockedPhysicalSubpathProbes = [];
    const blockedProbeFile = writeResolutionProbeFile(projectRoot);

    for (const target of GENERATED_RUNTIME_TARGETS) {
      const packageEvidence = packages[target.packageName];
      const exportedSubpaths = new Set(packageEvidence.publicSubpaths);
      const rootJavaScriptFiles = packageEvidence.tarball.files.filter(
        (file) => !file.includes("/") && file.endsWith(".js")
      );

      for (const file of rootJavaScriptFiles) {
        const subpath = `./${file}`;
        if (exportedSubpaths.has(subpath)) {
          continue;
        }

        blockedPhysicalSubpathProbes.push(
          runResolutionProbe({
            mode: CONDITION_RESOLUTION_MODES[0],
            packageName: target.packageName,
            packageRoots,
            probeFile: blockedProbeFile,
            projectRoot,
            subpath
          })
        );
      }
    }

    return {
      schemaVersion: 2,
      inventoryKind: "react-19.2.6-runtime-package-inventory",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel: "React 19.2.6 runtime package inventory",
      sources: SOURCE_DOCUMENTS,
      generation: {
        method:
          "npm registry metadata plus exact package tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation: "one Node child process per entrypoint and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false
      },
      evidenceClaims: {
        npmMetadataResolved: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsGenerated: true,
        packageExportMapsParsed: true,
        runtimeExportsProbed: true,
        conditionResolutionProbed: true,
        typeDeclarationsParsed: false,
        fastReactComparedToReact: false
      },
      conformanceClaims: {
        realReactBehaviorCompared: false,
        fastReactComparedToReact: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false
      },
      runtimeTargets: GENERATED_RUNTIME_TARGETS,
      supportingRuntimePackages: GENERATED_SUPPORTING_RUNTIME_PACKAGES,
      manualInventoryFields: MANUAL_INVENTORY_FIELDS,
      runtimeProbeModes: RUNTIME_PROBE_MODES,
      conditionResolutionModes: CONDITION_RESOLUTION_MODES,
      packages,
      runtimeProbes,
      conditionResolution,
      blockedPhysicalSubpathProbes
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function fetchAndExtractPackage({ target, tempRoot, nodeModulesRoot }) {
  const metadata = await fetchPackageMetadata(target);
  const dist = metadata.dist ?? {};
  if (!dist.tarball) {
    throw new Error(`${target.packageName}@${target.version} has no tarball`);
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
      `Tarball package name mismatch for ${target.packageName}: ${packageJson.name}`
    );
  }
  if (packageJson.version !== target.version) {
    throw new Error(
      `Tarball package version mismatch for ${target.packageName}: ${packageJson.version}`
    );
  }

  const publicSubpaths = getPublicSubpaths(packageJson.exports);

  return {
    packageRoot,
    inventory: {
      packageName: target.packageName,
      version: target.version,
      role: target.role,
      targetStatus: target.targetStatus ?? "official-target",
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
      packageJson: selectPackageJsonFields(packageJson),
      publicSubpaths,
      runtimeSubpaths: publicSubpaths.filter(
        (subpath) => subpath !== "./package.json"
      ),
      exportMapRows: createExportMapRows(packageJson.exports)
    }
  };
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

function selectPackageJsonFields(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    main: packageJson.main ?? null,
    type: packageJson.type ?? null,
    exports: packageJson.exports ?? null,
    files: packageJson.files ?? null,
    dependencies: packageJson.dependencies ?? null,
    peerDependencies: packageJson.peerDependencies ?? null,
    engines: packageJson.engines ?? null
  };
}

function getPublicSubpaths(exportsValue) {
  if (typeof exportsValue === "string") {
    return ["."];
  }

  if (!exportsValue || typeof exportsValue !== "object") {
    return [];
  }

  return Object.keys(exportsValue).filter((key) => key.startsWith("."));
}

function createExportMapRows(exportsValue) {
  return getPublicSubpaths(exportsValue).map((subpath) => ({
    subpath,
    conditions: flattenExportTarget(exportsValue[subpath])
  }));
}

function flattenExportTarget(value, conditionPath = []) {
  if (typeof value === "string" || value === null) {
    return [
      {
        conditionPath,
        target: value
      }
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      flattenExportTarget(item, [...conditionPath, `[${index}]`])
    );
  }

  if (typeof value === "object") {
    return Object.entries(value).flatMap(([condition, nested]) =>
      flattenExportTarget(nested, [...conditionPath, condition])
    );
  }

  return [
    {
      conditionPath,
      target: String(value)
    }
  ];
}

function writeRuntimeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "runtime-probe.mjs");
  writeFileSync(
    probeFile,
    `
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const specifier = process.argv[2];

function describeThrown(error) {
  return {
    status: "throws",
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error)
  };
}

function describeValue(value) {
  const valueType = typeof value;
  if (valueType === "function") {
    return {
      type: "function",
      name: value.name,
      length: value.length
    };
  }

  if (valueType === "symbol") {
    return {
      type: "symbol",
      description: value.description ?? null,
      stringValue: String(value)
    };
  }

  if (value === null) {
    return {
      type: "null"
    };
  }

  if (valueType === "object") {
    return {
      type: "object",
      objectTag: Object.prototype.toString.call(value)
    };
  }

  return {
    type: valueType,
    value
  };
}

function describeModule(value) {
  const exportKeys = Object.keys(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);

  return {
    status: "ok",
    exportKeys,
    exportDetails: exportKeys.map((key) => {
      const descriptor = descriptors[key];
      const detail = {
        key,
        enumerable: descriptor?.enumerable ?? null,
        configurable: descriptor?.configurable ?? null
      };

      if (descriptor && "writable" in descriptor) {
        detail.writable = descriptor.writable;
      }

      if (descriptor && "value" in descriptor) {
        detail.value = describeValue(descriptor.value);
      } else {
        detail.accessor = {
          get: typeof descriptor?.get === "function",
          set: typeof descriptor?.set === "function"
        };
      }

      return detail;
    })
  };
}

const result = {
  specifier,
  requireResolve: null,
  require: null,
  dynamicImport: null
};

try {
  result.requireResolve = {
    status: "ok",
    path: require.resolve(specifier)
  };
} catch (error) {
  result.requireResolve = describeThrown(error);
}

try {
  result.require = describeModule(require(specifier));
} catch (error) {
  result.require = describeThrown(error);
}

try {
  result.dynamicImport = describeModule(await import(specifier));
} catch (error) {
  result.dynamicImport = describeThrown(error);
}

process.stdout.write(JSON.stringify(result));
process.exit(0);
`,
    "utf8"
  );

  return probeFile;
}

function writeResolutionProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "resolution-probe.mjs");
  writeFileSync(
    probeFile,
    `
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const specifier = process.argv[2];

try {
  process.stdout.write(
    JSON.stringify({
      specifier,
      status: "ok",
      path: require.resolve(specifier)
    })
  );
} catch (error) {
  process.stdout.write(
    JSON.stringify({
      specifier,
      status: "throws",
      name: error?.name ?? null,
      code: error?.code ?? null,
      message: error?.message ?? String(error)
    })
  );
}

process.exit(0);
`,
    "utf8"
  );

  return probeFile;
}

function runRuntimeProbe({
  mode,
  packageName,
  packageRoots,
  probeFile,
  projectRoot,
  subpath
}) {
  const specifier = packageSpecifier(packageName, subpath);
  const spawnResult = spawnSync(
    process.execPath,
    [...mode.nodeArgs, probeFile, specifier],
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
    command: `node ${mode.nodeArgs.join(" ")} ${basename(probeFile)} ${specifier}`
  });

  return normalizeRuntimeProbeResult({
    mode,
    packageName,
    packageRoots,
    result,
    specifier,
    subpath
  });
}

function runResolutionProbe({
  mode,
  packageName,
  packageRoots,
  probeFile,
  projectRoot,
  subpath
}) {
  const specifier = packageSpecifier(packageName, subpath);
  const spawnResult = spawnSync(
    process.execPath,
    [...mode.nodeArgs, probeFile, specifier],
    {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: PROBE_TIMEOUT_MS
    }
  );
  const result = parseProbeOutput(spawnResult, {
    command: `node ${mode.nodeArgs.join(" ")} ${basename(probeFile)} ${specifier}`
  });

  return {
    id: runtimeProbeId(packageName, subpath),
    packageName,
    subpath,
    specifier,
    status: result.status,
    path: normalizeResolvedPath({
      packageName,
      packageRoots,
      resolvedPath: result.path
    }),
    error:
      result.status === "throws"
        ? {
            name: result.name,
            code: result.code,
            message: normalizePathInMessage({
              packageName,
              packageRoots,
              message: result.message
            })
          }
        : null
  };
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

function normalizeRuntimeProbeResult({
  mode,
  packageName,
  packageRoots,
  result,
  specifier,
  subpath
}) {
  return {
    id: runtimeProbeId(packageName, subpath),
    packageName,
    subpath,
    specifier,
    nodeEnv: mode.nodeEnv,
    requireResolve: normalizeMaybeResolvedPath({
      packageName,
      packageRoots,
      result: result.requireResolve
    }),
    require: normalizeRuntimeLoadResult({
      packageName,
      packageRoots,
      result: result.require
    }),
    dynamicImport: normalizeRuntimeLoadResult({
      packageName,
      packageRoots,
      result: result.dynamicImport
    })
  };
}

function normalizeMaybeResolvedPath({ packageName, packageRoots, result }) {
  if (result?.status !== "ok") {
    return normalizeThrownResult({
      packageName,
      packageRoots,
      result
    });
  }

  return {
    ...result,
    path: normalizeResolvedPath({
      packageName,
      packageRoots,
      resolvedPath: result.path
    })
  };
}

function normalizeRuntimeLoadResult({ packageName, packageRoots, result }) {
  if (result?.status !== "throws") {
    return result;
  }

  return normalizeThrownResult({
    packageName,
    packageRoots,
    result
  });
}

function normalizeThrownResult({ packageName, packageRoots, result }) {
  if (!result || result.status !== "throws") {
    return result;
  }

  return {
    ...result,
    message: normalizePathInMessage({
      packageName,
      packageRoots,
      message: result.message
    })
  };
}

function normalizeResolvedPath({ packageName, packageRoots, resolvedPath }) {
  if (!resolvedPath) {
    return null;
  }

  const packageRoot = packageRoots.get(packageName);
  if (!packageRoot) {
    return resolvedPath;
  }

  const realResolvedPath = realpathSync(resolvedPath);
  const relativePath = relative(packageRoot, realResolvedPath);
  if (relativePath.startsWith("..") || relativePath.includes(`..${sep}`)) {
    return realResolvedPath;
  }

  return `node_modules/${packageName}/${relativePath.split(sep).join("/")}`;
}

function normalizePathInMessage({ packageName, packageRoots, message }) {
  if (!message) {
    return message;
  }

  const packageRoot = packageRoots.get(packageName);
  if (!packageRoot) {
    return message;
  }

  return message.replaceAll(packageRoot, `node_modules/${packageName}`);
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
