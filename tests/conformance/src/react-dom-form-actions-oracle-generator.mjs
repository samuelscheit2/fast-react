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
import { basename, dirname, join } from "node:path";

import {
  REACT_DOM_FORM_ACTIONS_API_NAMES,
  REACT_DOM_FORM_ACTIONS_PROBE_MODES,
  REACT_DOM_FORM_ACTIONS_RUNTIME_INVENTORY_PATH,
  REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH,
  REACT_DOM_FORM_ACTIONS_SOURCE_DOCUMENTS,
  REACT_DOM_FORM_ACTIONS_SUPPORTING_TARGETS,
  REACT_DOM_FORM_ACTIONS_TARGET
} from "./react-dom-form-actions-targets.mjs";
import {
  REACT_DOM_FORM_ACTIONS_SCENARIO_IDS,
  REACT_DOM_FORM_ACTIONS_SCENARIOS
} from "./react-dom-form-actions-scenarios.mjs";
import { packageSpecifier, runtimeProbeId } from "./runtime-inventory.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-form-actions-oracle-";

export async function generateReactDomFormActionsOracle() {
  const inventoryText = readFileSync(
    new URL(`../${REACT_DOM_FORM_ACTIONS_RUNTIME_INVENTORY_PATH}`, import.meta.url),
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

    const packageNames = [
      REACT_DOM_FORM_ACTIONS_TARGET.packageName,
      ...REACT_DOM_FORM_ACTIONS_SUPPORTING_TARGETS.map(
        (target) => target.packageName
      )
    ];
    const packageRoots = new Map();
    const packages = {};

    for (const packageName of packageNames) {
      const packageEvidence = await fetchAndExtractInventoryPackage({
        nodeModulesRoot,
        packageName,
        sourceInventory,
        tempRoot
      });
      packages[packageName] = packageEvidence.inventory;
      packageRoots.set(packageName, realpathSync(packageEvidence.packageRoot));
    }

    const probeFile = writeProbeFile(projectRoot);
    const observations = {};

    for (const mode of REACT_DOM_FORM_ACTIONS_PROBE_MODES) {
      observations[mode.id] = REACT_DOM_FORM_ACTIONS_SCENARIO_IDS.map(
        (scenarioId) =>
          runReactDomFormActionsProbe({
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            scenarioId
          })
      );
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-form-actions-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel: "React DOM 19.2.6 form actions oracle",
      sources: REACT_DOM_FORM_ACTIONS_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation: "one Node child process per scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        rootFormApiDescriptorsProbed: true,
        requestFormResetPublicErrorsProbed: true,
        hookBoundaryErrorsProbed: true,
        serverRenderHookReturnShapesProbed: true,
        domFormReplayBoundaryProbed: true,
        reactServerConditionAbsenceProbed: true,
        fastReactComparedToReactDom: false
      },
      conformanceClaims: {
        realReactDomBehaviorProbed: true,
        fastReactComparedToReactDom: false,
        fastReactBehaviorCompatible: false,
        fullClientFormActionOracleExists: false,
        compatibilityClaimed: false
      },
      sourceInventory: {
        path: REACT_DOM_FORM_ACTIONS_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomRootRuntimeProbeMatched: true
      },
      reactDomTarget: REACT_DOM_FORM_ACTIONS_TARGET,
      supportingRuntimePackages: REACT_DOM_FORM_ACTIONS_SUPPORTING_TARGETS,
      runtimeSubpath: REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH,
      runtimeProbeId: runtimeProbeId(
        REACT_DOM_FORM_ACTIONS_TARGET.packageName,
        REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH
      ),
      apiNames: REACT_DOM_FORM_ACTIONS_API_NAMES,
      probeModes: REACT_DOM_FORM_ACTIONS_PROBE_MODES,
      scenarios: REACT_DOM_FORM_ACTIONS_SCENARIOS,
      packages,
      observations,
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM behavior only; Fast React React DOM placeholders and implementation are owned by separate workers."
        },
        {
          id: "no-client-rendered-react-owned-form-success-path",
          reason:
            "requestFormReset success requires a React-owned live DOM form, reconciler host instances, and client commit state. This oracle intentionally covers rootless and non-React-owned invalid inputs only."
        },
        {
          id: "no-browser-form-submission-or-pending-transition-flow",
          reason:
            "The probes do not dispatch browser submit/reset events, mutate real FormData, or observe a pending host transition. They only capture server-render output and non-pending hook shapes."
        },
        {
          id: "no-profiling-entrypoint-behavior-probe",
          reason:
            "The checked React DOM export oracle already records that profiling exposes these APIs. This oracle focuses on the root form API behavior surface."
        }
      ]
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

  const reactDomPackage =
    sourceInventory.packages?.[REACT_DOM_FORM_ACTIONS_TARGET.packageName];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }

  if (reactDomPackage.version !== REACT_DOM_FORM_ACTIONS_TARGET.version) {
    throw new Error(
      `Expected react-dom ${REACT_DOM_FORM_ACTIONS_TARGET.version}, found ${reactDomPackage.version}`
    );
  }

  const checkedRootProbe = findInventoryRuntimeProbe(
    sourceInventory,
    "default-node-development",
    REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH
  );
  assertDeepEqual(
    selectApiExportPresence(checkedRootProbe.require),
    {
      requestFormReset: "function",
      useFormState: "function",
      useFormStatus: "function"
    },
    "default react-dom root form API export presence"
  );

  const checkedServerRootProbe = findInventoryRuntimeProbe(
    sourceInventory,
    "react-server-development",
    REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH
  );
  assertDeepEqual(
    selectApiExportPresence(checkedServerRootProbe.require),
    {
      requestFormReset: "absent",
      useFormState: "absent",
      useFormStatus: "absent"
    },
    "react-server react-dom root form API export absence"
  );

  for (const target of REACT_DOM_FORM_ACTIONS_SUPPORTING_TARGETS) {
    const packageEvidence = sourceInventory.packages?.[target.packageName];
    if (!packageEvidence) {
      throw new Error(
        `Checked runtime inventory does not include supporting package ${target.packageName}`
      );
    }
    if (packageEvidence.version !== target.version) {
      throw new Error(
        `Expected ${target.packageName} ${target.version}, found ${packageEvidence.version}`
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

  const tarballRoot = join(tempRoot, "tarballs");
  mkdirSync(tarballRoot, { recursive: true });
  const tarballPath = join(
    tarballRoot,
    `${packageName.replaceAll("/", "__")}-${inventoryPackage.version}.tgz`
  );
  writeFileSync(tarballPath, tarballBytes);

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

function writeProbeFile(projectRoot) {
  const probeFile = join(projectRoot, "react-dom-form-actions-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-dom-form-actions-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runReactDomFormActionsProbe({
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenarioId
}) {
  const result = runProbe({
    mode,
    probeFile,
    projectRoot,
    args: [scenarioId],
    env: {
      NODE_ENV: mode.nodeEnv
    }
  });

  return normalizeDeep({
    packageRoots,
    value: {
      scenarioId,
      packageName: REACT_DOM_FORM_ACTIONS_TARGET.packageName,
      specifier: packageSpecifier(
        REACT_DOM_FORM_ACTIONS_TARGET.packageName,
        REACT_DOM_FORM_ACTIONS_RUNTIME_SUBPATH
      ),
      nodeEnv: mode.nodeEnv,
      condition: mode.condition,
      result: result.result,
      consoleCalls: result.consoleCalls
    }
  });
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
    return normalizePathFragments({ packageRoots, text: value });
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

function normalizePathFragments({ packageRoots, text }) {
  let normalized = text;
  for (const [packageName, packageRoot] of packageRoots) {
    normalized = normalized.replaceAll(
      packageRoot,
      `node_modules/${packageName}`
    );
  }

  return normalized
    .replace(
      /file:\/\/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu,
      "file://<temp>"
    )
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "<temp>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
}

function findInventoryRuntimeProbe(sourceInventory, modeId, subpath) {
  const probe = sourceInventory.runtimeProbes?.[modeId]?.find(
    (candidate) =>
      candidate.packageName === REACT_DOM_FORM_ACTIONS_TARGET.packageName &&
      candidate.subpath === subpath
  );
  if (!probe) {
    throw new Error(`Missing checked runtime probe ${modeId}:${subpath}`);
  }
  return probe;
}

function selectApiExportPresence(loadResult) {
  if (loadResult?.status !== "ok") {
    return Object.fromEntries(
      REACT_DOM_FORM_ACTIONS_API_NAMES.map((apiName) => [apiName, "load-throws"])
    );
  }

  const detailByName = new Map(
    (loadResult.exportDetails ?? [])
      .filter((entry) => typeof entry.key === "string")
      .map((entry) => [entry.key, entry])
  );

  return Object.fromEntries(
    REACT_DOM_FORM_ACTIONS_API_NAMES.map((apiName) => {
      const detail = detailByName.get(apiName);
      return [
        apiName,
        detail?.value ? detail.value.type ?? "unknown" : detail ? "unknown" : "absent"
      ];
    })
  );
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
