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

import { stringifyDomControlledInputOracle } from "./dom-controlled-input-oracle.mjs";
import { DOM_CONTROLLED_INPUT_SCENARIOS } from "./dom-controlled-input-scenarios.mjs";
import {
  DOM_CONTROLLED_INPUT_PROBE_MODES,
  DOM_CONTROLLED_INPUT_REACT_DOM_TARGET,
  DOM_CONTROLLED_INPUT_RUNTIME_INVENTORY_PATH,
  DOM_CONTROLLED_INPUT_SOURCE_DOCUMENTS,
  DOM_CONTROLLED_INPUT_SUPPORTING_TARGETS
} from "./dom-controlled-input-targets.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-dom-controlled-input-oracle-";

export async function generateDomControlledInputOracle() {
  const inventoryText = readFileSync(
    new URL(`../${DOM_CONTROLLED_INPUT_RUNTIME_INVENTORY_PATH}`, import.meta.url),
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
      DOM_CONTROLLED_INPUT_REACT_DOM_TARGET.packageName,
      ...DOM_CONTROLLED_INPUT_SUPPORTING_TARGETS.map(
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

    const probeFile = writeProbeFiles(projectRoot);
    const serverSerializationObservations = {};
    const clientFormStateObservations = {};

    for (const mode of DOM_CONTROLLED_INPUT_PROBE_MODES) {
      serverSerializationObservations[mode.id] =
        DOM_CONTROLLED_INPUT_SCENARIOS.map((scenario) =>
          runDomControlledInputProbe({
            action: "server",
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            scenario
          })
        );
      clientFormStateObservations[mode.id] =
        DOM_CONTROLLED_INPUT_SCENARIOS.map((scenario) =>
          runDomControlledInputProbe({
            action: "client",
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            scenario
          })
        );
    }

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-dom-controlled-input-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 controlled input/select/textarea behavior oracle",
      sources: DOM_CONTROLLED_INPUT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact React, React DOM, and scheduler npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per mode, scenario, and probe kind",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary roots, package roots, file URLs, and local workspace paths are normalized before artifact serialization"
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        serverSerializationProbed: true,
        clientFormStateProbed: true,
        controlledWarningsProbed: true,
        valueAndDefaultValueProbed: true,
        checkedAndDefaultCheckedProbed: true,
        selectMultipleProbed: true,
        textareaChildrenProbed: true,
        updateBehaviorProbed: true,
        deterministicFakeDomSubstrateUsed: true,
        deterministicPathNormalizationApplied: true,
        browserNativeDomUsed: false,
        fastReactComparedToReactDom: false
      },
      conformanceClaims: {
        realReactDomBehaviorProbed: true,
        fastReactComparedToReactDom: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      sourceInventory: {
        path: DOM_CONTROLLED_INPUT_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomTargetMatched: true,
        supportingPackagesMatched: true
      },
      reactDomTarget: DOM_CONTROLLED_INPUT_REACT_DOM_TARGET,
      supportingRuntimePackages: DOM_CONTROLLED_INPUT_SUPPORTING_TARGETS,
      probeModes: DOM_CONTROLLED_INPUT_PROBE_MODES,
      scenarios: DOM_CONTROLLED_INPUT_SCENARIOS,
      packages,
      fakeDomSubstrate: {
        purpose:
          "exercise React DOM client controlled-form wrappers deterministically in Node without adding a DOM dependency to the conformance workspace",
        browserNativeDom: false,
        records: [
          "input value/defaultValue/checked/defaultChecked property writes",
          "select multiple and option selected/defaultSelected property writes",
          "textarea value/defaultValue property writes",
          "setAttribute and removeAttribute calls",
          "textContent and text node value writes",
          "appendChild, insertBefore, and removeChild through child order snapshots"
        ],
        doesNotModel: [
          "native input type value sanitization, selection ranges, focus, reset, or autofill behavior",
          "real event dispatch semantics beyond React listener installation stubs",
          "HTML parsing, layout, CSSOM, accessibility tree, and hydration behavior",
          "browser form submission behavior and user-initiated value tracking changes"
        ]
      },
      serverSerializationObservations,
      clientFormStateObservations,
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM behavior only; Fast React React DOM form control behavior is not implemented in this worker scope."
        },
        {
          id: "fake-dom-client-substrate",
          reason:
            "Client probes execute real React DOM 19.2.6 mutation and form-control code, but the DOM target is a deterministic fake DOM. The oracle records React DOM calls and final fake DOM state, not browser layout, selection, focus, native form reset, autofill, or input type sanitization."
        },
        {
          id: "synchronous-flushsync-only",
          reason:
            "The scenarios use ReactDOM.flushSync for deterministic mount/update observations and do not claim asynchronous scheduling, event replay, composition events, or user input behavior."
        },
        {
          id: "forms-submit-and-radio-groups-out-of-scope",
          reason:
            "Form action APIs, form submission, radio group cross-node behavior, event delegation, hydration, server/static Fizz behavior, and browser-native validation are covered by separate oracle or implementation tracks."
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

  assertInventoryPackageTarget(
    sourceInventory,
    DOM_CONTROLLED_INPUT_REACT_DOM_TARGET
  );
  for (const target of DOM_CONTROLLED_INPUT_SUPPORTING_TARGETS) {
    assertInventoryPackageTarget(sourceInventory, target);
  }

  const reactDomPackage =
    sourceInventory.packages?.[DOM_CONTROLLED_INPUT_REACT_DOM_TARGET.packageName];
  for (const subpath of [".", "./client", "./server"]) {
    if (!reactDomPackage.runtimeSubpaths.includes(subpath)) {
      throw new Error(`react-dom inventory missing runtime subpath ${subpath}`);
    }
  }
}

function assertInventoryPackageTarget(sourceInventory, target) {
  const inventoryPackage = sourceInventory.packages?.[target.packageName];
  if (!inventoryPackage) {
    throw new Error(
      `Checked runtime inventory does not include ${target.packageName}`
    );
  }
  if (inventoryPackage.version !== target.version) {
    throw new Error(
      `${target.packageName} inventory version mismatch: ${inventoryPackage.version}`
    );
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

function writeProbeFiles(projectRoot) {
  const scenariosFile = join(projectRoot, "dom-controlled-input-scenarios.mjs");
  writeFileSync(
    scenariosFile,
    readFileSync(
      new URL("./dom-controlled-input-scenarios.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );

  const probeFile = join(projectRoot, "dom-controlled-input-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./dom-controlled-input-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runDomControlledInputProbe({
  action,
  mode,
  packageRoots,
  probeFile,
  projectRoot,
  scenario
}) {
  const spawnResult = spawnSync(
    process.execPath,
    [...mode.nodeArgs, probeFile, action, scenario.id],
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
  )} ${action} ${scenario.id}`;
  const result = parseProbeOutput(spawnResult, { command });

  return {
    scenarioId: scenario.id,
    action,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    result: normalizeProbeResult({
      packageRoots,
      result
    })
  };
}

function normalizeProbeResult({ packageRoots, result }) {
  return normalizeDeep({
    packageRoots,
    value: result
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

  if (!value || typeof value !== "object") {
    return typeof value === "string"
      ? normalizePathInMessage({
          packageRoots,
          message: value
        })
      : value;
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

function normalizePathInMessage({ packageRoots, message }) {
  if (!message) {
    return message;
  }

  let normalized = message;
  for (const [packageName, packageRoot] of packageRoots) {
    normalized = normalized.replaceAll(
      packageRoot,
      `node_modules/${packageName}`
    );
  }

  return normalizeGenericPath(normalized);
}

function normalizeGenericPath(value) {
  return value
    .replace(/file:\/\/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "file://<temp>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu, "<temp>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
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

export function stringifyGeneratedDomControlledInputOracle(oracle) {
  return stringifyDomControlledInputOracle(oracle);
}
