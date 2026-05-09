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

import { readCheckedRuntimeInventory } from "./runtime-inventory.mjs";
import {
  createReactDomDeclarationRows,
  sortSubpaths
} from "./react-dom-type-declaration-parser.mjs";
import {
  REACT_DECLARATION_TARGET,
  REACT_DOM_DECLARATION_TARGET,
  REACT_DOM_TYPE_COMPATIBILITY_POLICY,
  REACT_DOM_TYPE_RUNTIME_TARGET,
  REACT_DOM_TYPE_SOURCE_DOCUMENTS
} from "./react-dom-type-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const DEFAULT_RUNTIME_MODE_ID = "default-node-development";
const REACT_SERVER_RUNTIME_MODE_ID = "react-server-production";

export async function generateReactDomTypeInventory() {
  const runtimeInventory = readCheckedRuntimeInventory();
  validateRuntimeInventory(runtimeInventory);

  const tempRoot = mkdtempSync(join(tmpdir(), "fast-react-dom-type-inventory-"));

  try {
    const nodeModulesRoot = join(tempRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const reactDomTypesPackage = await fetchAndExtractPackage({
      nodeModulesRoot,
      target: REACT_DOM_DECLARATION_TARGET,
      tempRoot
    });
    const reactTypesPackage = await fetchAndExtractPackage({
      nodeModulesRoot,
      target: REACT_DECLARATION_TARGET,
      tempRoot
    });

    const declarationRows = createReactDomDeclarationRows({
      filesByPath: reactDomTypesPackage.filesByPath,
      externalDeclarationPackages: {
        react: {
          filesByPath: reactTypesPackage.filesByPath,
          packageJson: reactTypesPackage.packageJsonFull
        }
      },
      packageJson: reactDomTypesPackage.packageJsonFull
    });
    const subpathComparisons = createSubpathComparisons({
      declarationRows,
      runtimeInventory
    });
    const gaps = summarizeGaps({ runtimeInventory, subpathComparisons });

    return {
      schemaVersion: 1,
      inventoryKind: "react-19.2.6-react-dom-type-inventory",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "@types/react-dom 19.2.3 declaration inventory against React DOM 19.2.6 runtime subpaths",
      sources: REACT_DOM_TYPE_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked React DOM runtime inventory plus exact @types tarballs parsed with deterministic structured declaration parsing",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        runtimePackageCodeExecutedByThisGenerator: false,
        runtimePackageEvidenceSource:
          "tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json",
        declarationParsing:
          "structured export-map and declaration export parser; TypeScript compiler API not required",
        typescriptCompilerApiUsed: false,
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false
      },
      evidenceClaims: {
        runtimePackageInventoryRead: true,
        npmMetadataResolved: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        declarationExportMapParsed: true,
        declarationFilesParsed: true,
        runtimeDeclarationsCompared: true,
        runtimePackageCompatibilitySeparatedFromTypeScriptDeclarations: true,
        fastReactComparedToReact: false
      },
      conformanceClaims: {
        realReactRuntimeComparedToDeclarations: true,
        fastReactComparedToReact: false,
        fastReactRuntimeCompatible: false,
        fastReactTypeDeclarationsCompatible: false,
        compatibilityClaimed: false
      },
      compatibilityPolicy: REACT_DOM_TYPE_COMPATIBILITY_POLICY,
      targets: {
        runtime: REACT_DOM_TYPE_RUNTIME_TARGET,
        reactDomDeclarations: REACT_DOM_DECLARATION_TARGET,
        reactDeclarations: REACT_DECLARATION_TARGET
      },
      packages: {
        "react-dom": selectReactDomRuntimeEvidence(runtimeInventory),
        "@types/react-dom": {
          ...reactDomTypesPackage.inventory,
          declarationRows,
          publicSubpaths: declarationRows.map((row) => row.subpath),
          declarationSubpaths: declarationRows
            .filter((row) => row.targetKind === "declaration-file")
            .map((row) => row.subpath)
        },
        "@types/react": reactTypesPackage.inventory
      },
      subpathComparisons,
      gaps
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

function validateRuntimeInventory(runtimeInventory) {
  const reactDomPackage = runtimeInventory.packages?.["react-dom"];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }
  if (reactDomPackage.version !== REACT_DOM_TYPE_RUNTIME_TARGET.version) {
    throw new Error(
      `Expected react-dom@${REACT_DOM_TYPE_RUNTIME_TARGET.version}, got ${reactDomPackage.version}`
    );
  }
}

async function fetchAndExtractPackage({ nodeModulesRoot, target, tempRoot }) {
  const metadata = await fetchJson(registryPackageVersionUrl(target));
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

  const filesByPath = {};
  for (const file of tarballFiles) {
    if (file.endsWith(".d.ts")) {
      filesByPath[file] = readFileSync(join(packageRoot, file), "utf8");
    }
  }

  return {
    packageJsonFull: packageJson,
    filesByPath,
    inventory: {
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
      packageJson: selectTypePackageJsonFields(packageJson)
    }
  };
}

function createSubpathComparisons({ declarationRows, runtimeInventory }) {
  const runtimePackage = runtimeInventory.packages["react-dom"];
  const runtimePublicSubpaths = new Set(runtimePackage.publicSubpaths);
  const runtimeSubpaths = new Set(runtimePackage.runtimeSubpaths);
  const declarationRowsBySubpath = new Map(
    declarationRows.map((row) => [row.subpath, row])
  );
  const defaultRuntimeProbes = new Map(
    runtimeInventory.runtimeProbes[DEFAULT_RUNTIME_MODE_ID]
      .filter((probe) => probe.packageName === "react-dom")
      .map((probe) => [probe.subpath, probe])
  );
  const reactServerRuntimeProbes = new Map(
    runtimeInventory.runtimeProbes[REACT_SERVER_RUNTIME_MODE_ID]
      .filter((probe) => probe.packageName === "react-dom")
      .map((probe) => [probe.subpath, probe])
  );
  const allSubpaths = sortSubpaths([
    ...new Set([...runtimePublicSubpaths, ...declarationRowsBySubpath.keys()])
  ]);

  return allSubpaths.map((subpath) => {
    const declarationRow = declarationRowsBySubpath.get(subpath) ?? null;
    const defaultProbe = defaultRuntimeProbes.get(subpath) ?? null;
    const reactServerProbe = reactServerRuntimeProbes.get(subpath) ?? null;
    const runtimeExportKeys =
      defaultProbe?.require?.status === "ok" ? defaultProbe.require.exportKeys : [];
    const declarationValueExportNames =
      declarationRow?.resolved?.valueExportNames ?? [];

    const missingDeclarationExports = runtimeExportKeys.filter(
      (exportName) => !declarationValueExportNames.includes(exportName)
    );
    const declarationValueExportsWithoutRuntime =
      subpath === "./package.json"
        ? []
        : declarationValueExportNames.filter(
            (exportName) => !runtimeExportKeys.includes(exportName)
          );

    return {
      subpath,
      status: classifySubpathComparison({
        declarationRow,
        missingDeclarationExports,
        runtimePublic: runtimePublicSubpaths.has(subpath),
        subpath
      }),
      runtime: {
        publicSubpath: runtimePublicSubpaths.has(subpath),
        executableSubpath: runtimeSubpaths.has(subpath),
        defaultProbe: summarizeRuntimeProbe(defaultProbe),
        reactServerProbe: summarizeRuntimeProbe(reactServerProbe)
      },
      declarations: summarizeDeclarationRow(declarationRow),
      missingDeclarationExports: missingDeclarationExports.map((exportName) => ({
        exportName,
        runtimeValue: describeRuntimeExport(defaultProbe, exportName)
      })),
      declarationValueExportsWithoutRuntime
    };
  });
}

function summarizeGaps({ runtimeInventory, subpathComparisons }) {
  const runtimeOnlySubpaths = subpathComparisons
    .filter((comparison) => comparison.status === "runtime-subpath-missing-declarations")
    .map((comparison) => comparison.subpath);
  const declarationOnlySubpaths = subpathComparisons
    .filter((comparison) => comparison.status === "declaration-only-subpath")
    .map((comparison) => comparison.subpath);
  const missingRuntimeDeclarations = subpathComparisons.flatMap((comparison) =>
    comparison.missingDeclarationExports.map((gap) => ({
      subpath: comparison.subpath,
      exportName: gap.exportName,
      runtimeValue: gap.runtimeValue,
      note: missingDeclarationNote(comparison.subpath, gap)
    }))
  );

  return {
    runtimeOnlySubpaths,
    declarationOnlySubpaths,
    missingRuntimeDeclarations,
    reactServerConditionGaps: createReactServerConditionGaps({
      runtimeInventory,
      subpathComparisons
    }),
    compatibilitySummary: {
      runtimePackageCompatibility:
        "React DOM runtime package surface comes from react-dom@19.2.6.",
      typescriptDeclarationCompatibility:
        "@types/react-dom@19.2.3 is not a complete runtime export mirror and must be tracked separately.",
      recommendedDeclarationPolicy:
        "Fast React should either reference @types/react-dom with explicit known gaps or ship declarations with separate conformance checks; runtime placeholder scaffolds must not claim TypeScript declaration parity."
    }
  };
}

function createReactServerConditionGaps({ runtimeInventory, subpathComparisons }) {
  const gaps = [];

  for (const comparison of subpathComparisons) {
    const reactServerProbe = comparison.runtime.reactServerProbe;
    if (!comparison.runtime.publicSubpath || !comparison.runtime.executableSubpath) {
      continue;
    }

    if (reactServerProbe?.status === "throws") {
      gaps.push({
        subpath: comparison.subpath,
        status: "react-server-runtime-throws-but-declarations-are-default",
        runtimeMessage: reactServerProbe.message,
        declarationFile: comparison.declarations.declarationFile,
        declarationValueExportNames: comparison.declarations.valueExportNames
      });
      continue;
    }

    if (comparison.subpath === ".") {
      const defaultKeys = comparison.runtime.defaultProbe?.exportKeys ?? [];
      const reactServerKeys = reactServerProbe?.exportKeys ?? [];
      const declaredButAbsentInReactServer =
        comparison.declarations.valueExportNames.filter(
          (exportName) => !reactServerKeys.includes(exportName)
        );
      if (declaredButAbsentInReactServer.length > 0) {
        gaps.push({
          subpath: ".",
          status: "react-server-root-narrower-than-default-declarations",
          defaultRuntimeExportKeys: defaultKeys,
          reactServerRuntimeExportKeys: reactServerKeys,
          declaredButAbsentInReactServer
        });
      }
    }
  }

  return gaps;
}

function classifySubpathComparison({
  declarationRow,
  missingDeclarationExports,
  runtimePublic,
  subpath
}) {
  if (subpath === "./package.json" && runtimePublic && declarationRow) {
    return "metadata-subpath";
  }
  if (runtimePublic && !declarationRow) {
    return "runtime-subpath-missing-declarations";
  }
  if (!runtimePublic && declarationRow) {
    return "declaration-only-subpath";
  }
  if (missingDeclarationExports.length > 0) {
    return "runtime-exports-missing-declarations";
  }
  return "runtime-and-declarations-covered";
}

function summarizeRuntimeProbe(probe) {
  if (!probe) {
    return null;
  }

  const summary = {
    status: probe.require.status
  };

  if (probe.require.status === "ok") {
    summary.exportKeys = probe.require.exportKeys;
    summary.exportDetails = probe.require.exportDetails.map((detail) => ({
      key: detail.key,
      value: detail.value ?? null
    }));
  } else {
    summary.name = probe.require.name ?? null;
    summary.code = probe.require.code ?? null;
    summary.message = probe.require.message ?? null;
  }

  return summary;
}

function summarizeDeclarationRow(row) {
  if (!row) {
    return {
      publicSubpath: false,
      targetKind: "missing",
      declarationFile: null,
      valueExportNames: [],
      typeExportNames: [],
      allExportNames: []
    };
  }

  if (row.targetKind !== "declaration-file") {
    return {
      publicSubpath: true,
      targetKind: row.targetKind,
      declarationFile: row.declarationFile,
      valueExportNames: [],
      typeExportNames: [],
      allExportNames: []
    };
  }

  return {
    publicSubpath: true,
    targetKind: row.targetKind,
    declarationFile: row.declarationFile,
    valueExportNames: row.resolved.valueExportNames,
    typeExportNames: row.resolved.typeExportNames,
    allExportNames: row.resolved.allExportNames,
    unknownExportNames: row.resolved.unknownExportNames,
    globalNamespaceExports: row.parsed.globalNamespaceExports,
    importSources: row.parsed.importSources
  };
}

function describeRuntimeExport(probe, exportName) {
  const detail = probe?.require?.exportDetails?.find(
    (candidate) => candidate.key === exportName
  );
  if (!detail) {
    return null;
  }
  return detail.value ?? null;
}

function missingDeclarationNote(subpath, gap) {
  if (subpath === "./profiling") {
    return "react-dom/profiling is a public runtime subpath with no @types/react-dom declaration subpath";
  }
  if (gap.exportName === "version") {
    return "runtime exports version but this declaration subpath omits it";
  }
  if (gap.exportName === "resume" && gap.runtimeValue?.type === "undefined") {
    return "runtime key exists with undefined value in the Bun wrapper";
  }
  if (gap.exportName === "resume") {
    return "runtime exports resume but this declaration subpath omits it";
  }
  if (gap.exportName === "resumeAndPrerender") {
    return "runtime exports resumeAndPrerender but this declaration subpath omits it";
  }
  return null;
}

function selectReactDomRuntimeEvidence(runtimeInventory) {
  const reactDomPackage = runtimeInventory.packages["react-dom"];
  return {
    packageName: reactDomPackage.packageName,
    version: reactDomPackage.version,
    role: reactDomPackage.role,
    sourceInventoryKind: runtimeInventory.inventoryKind,
    sourceInventorySchemaVersion: runtimeInventory.schemaVersion,
    registry: reactDomPackage.registry,
    publicSubpaths: reactDomPackage.publicSubpaths,
    runtimeSubpaths: reactDomPackage.runtimeSubpaths,
    exportMapRows: reactDomPackage.exportMapRows
  };
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
    .map((file) => file.replace(/^[^/]+\//u, ""))
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

function assertSuccessfulSpawn(result, command) {
  if (result.status === 0 && !result.error) {
    return;
  }

  throw new Error(
    `${command} failed: ${result.error?.message ?? result.stderr ?? result.stdout}`
  );
}

function selectTypePackageJsonFields(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    main: packageJson.main ?? null,
    types: packageJson.types ?? null,
    typings: packageJson.typings ?? null,
    exports: packageJson.exports ?? null,
    dependencies: packageJson.dependencies ?? null,
    peerDependencies: packageJson.peerDependencies ?? null,
    typeScriptVersion: packageJson.typeScriptVersion ?? null,
    typesPublisherContentHash: packageJson.typesPublisherContentHash ?? null
  };
}

function registryPackageVersionUrl(target) {
  return `https://registry.npmjs.org/${encodeURIComponent(
    target.packageName
  )}/${encodeURIComponent(target.version)}`;
}

function joinPackagePath(nodeModulesRoot, packageName) {
  return join(nodeModulesRoot, ...packageName.split("/"));
}
