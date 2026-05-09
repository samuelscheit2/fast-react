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
  stringifyReactDomRootListenerInstallationOracle
} from "./react-dom-root-listener-installation-oracle.mjs";
import {
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS
} from "./react-dom-root-listener-installation-scenarios.mjs";
import {
  REACT_DOM_ROOT_LISTENER_INSTALLATION_DELEGATED_EVENT_EXAMPLES,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_NON_DELEGATED_EVENT_EXAMPLES,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_RUNTIME_INVENTORY_PATH,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SOURCE_DOCUMENTS,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_SUPPORTING_TARGETS,
  REACT_DOM_ROOT_LISTENER_INSTALLATION_TARGET
} from "./react-dom-root-listener-installation-targets.mjs";

const PROBE_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX =
  "fast-react-react-dom-root-listener-installation-oracle-";

export async function generateReactDomRootListenerInstallationOracle() {
  const inventoryText = readFileSync(
    new URL(
      `../${REACT_DOM_ROOT_LISTENER_INSTALLATION_RUNTIME_INVENTORY_PATH}`,
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

    const packageNames = [
      "react",
      REACT_DOM_ROOT_LISTENER_INSTALLATION_TARGET.packageName,
      ...REACT_DOM_ROOT_LISTENER_INSTALLATION_SUPPORTING_TARGETS.map(
        (target) => target.packageName
      ).filter((packageName) => packageName !== "react")
    ];
    const packages = {};

    for (const packageName of packageNames) {
      const packageEvidence = await fetchAndExtractInventoryPackage({
        nodeModulesRoot,
        packageName,
        sourceInventory,
        tempRoot
      });
      packages[packageName] = packageEvidence.inventory;
    }

    const probeFile = writeProbeFiles(projectRoot);
    const listenerInstallationObservations = {};

    for (const mode of REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES) {
      listenerInstallationObservations[mode.id] =
        REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS.map((scenario) =>
          runProbe({
            args: [scenario.id],
            mode,
            probeFile,
            projectRoot
          })
        );
    }

    return {
      schemaVersion: 1,
      oracleKind:
        "react-19.2.6-react-dom-root-listener-installation-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 root and portal listener installation oracle",
      sources: REACT_DOM_ROOT_LISTENER_INSTALLATION_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree and probed through a deterministic minimal DOM host",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per React DOM listener-installation scenario and mode",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        pathNormalization:
          "temporary extraction paths and React randomized listener marker names are not serialized"
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        reactDomClientCreateRootProbed: true,
        reactDomClientHydrateRootProbed: true,
        rootListenerRegistrationProbed: true,
        ownerDocumentSelectionChangeRegistrationProbed: true,
        nonDelegatedCaptureOnlyRegistrationProbed: true,
        listenerMarkerDedupeProbed: true,
        portalListenerInstallationProbed: true,
        crossDocumentPortalOwnerDocumentProbed: true,
        passiveListenerOptionsObserved: true,
        pluginDispatchBehaviorProbed: false,
        syntheticEventDispatchProbed: false,
        eventPriorityLaneClaimsIncluded: false,
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
        path: REACT_DOM_ROOT_LISTENER_INSTALLATION_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomClientRuntimeExportMatched: true
      },
      reactDomTarget: REACT_DOM_ROOT_LISTENER_INSTALLATION_TARGET,
      supportingRuntimePackages:
        REACT_DOM_ROOT_LISTENER_INSTALLATION_SUPPORTING_TARGETS,
      probeModes: REACT_DOM_ROOT_LISTENER_INSTALLATION_PROBE_MODES,
      scenarios: REACT_DOM_ROOT_LISTENER_INSTALLATION_SCENARIOS,
      delegatedEventExamples:
        REACT_DOM_ROOT_LISTENER_INSTALLATION_DELEGATED_EVENT_EXAMPLES,
      nonDelegatedEventExamples:
        REACT_DOM_ROOT_LISTENER_INSTALLATION_NON_DELEGATED_EVENT_EXAMPLES,
      selectionEvent: REACT_DOM_ROOT_LISTENER_INSTALLATION_SELECTION_EVENT,
      packages,
      listenerInstallationObservations,
      coverage: {
        rootContainerListenerRegistration: true,
        hydrationRootContainerListenerRegistration: true,
        ownerDocumentSelectionChangeRegistration: true,
        delegatedCaptureAndBubbleExamples: true,
        passiveWheelAndTouchListenerOptions: true,
        nonDelegatedCaptureOnlyExamples: true,
        sameContainerCreateRootDedupe: true,
        sameContainerHydrateRootDedupe: true,
        sameContainerCreateThenHydrateRootDedupe: true,
        sameDocumentSelectionChangeDedupe: true,
        sameDocumentPortalListenerInstallation: true,
        crossDocumentPortalListenerInstallation: true,
        pluginDispatchBehaviorExcluded: true
      },
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM 19.2.6 behavior only; Fast React DOM listener implementation is outside this worker scope."
        },
        {
          id: "no-plugin-dispatch-behavior",
          reason:
            "The oracle intentionally stops at root and portal listener installation side effects. Synthetic event extraction, dispatch order, batching, and prevent/propagation behavior are covered by separate event oracles."
        },
        {
          id: "no-event-priority-lane-claims",
          reason:
            "Listener wrapper priority is not asserted here because worker 048 owns the React DOM event-priority oracle surface."
        },
        {
          id: "minimal-dom-host-not-browser-matrix",
          reason:
            "The deterministic host implements only the DOM APIs needed for createRoot, flushSync, and portal listener installation; browser matrix behavior belongs in later browser-backed event oracles."
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

  const requiredPackages = [
    "react",
    REACT_DOM_ROOT_LISTENER_INSTALLATION_TARGET.packageName,
    ...REACT_DOM_ROOT_LISTENER_INSTALLATION_SUPPORTING_TARGETS.map(
      (target) => target.packageName
    )
  ];

  for (const packageName of new Set(requiredPackages)) {
    if (!sourceInventory.packages?.[packageName]) {
      throw new Error(
        `Checked runtime inventory does not include ${packageName}`
      );
    }
  }

  const clientProbe = sourceInventory.runtimeProbes?.[
    "default-node-development"
  ]?.find(
    (probe) =>
      probe.packageName ===
        REACT_DOM_ROOT_LISTENER_INSTALLATION_TARGET.packageName &&
      probe.subpath === "./client"
  );
  if (!clientProbe || clientProbe.require.status !== "ok") {
    throw new Error(
      "Checked runtime inventory does not include a loadable react-dom/client probe"
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
  const scenarioFile = join(
    projectRoot,
    "react-dom-root-listener-installation-scenarios.mjs"
  );
  writeFileSync(
    scenarioFile,
    readFileSync(
      new URL(
        "./react-dom-root-listener-installation-scenarios.mjs",
        import.meta.url
      ),
      "utf8"
    ),
    "utf8"
  );

  const probeFile = join(
    projectRoot,
    "react-dom-root-listener-installation-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL(
        "./react-dom-root-listener-installation-probe-runner.mjs",
        import.meta.url
      ),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runProbe({ args, mode, probeFile, projectRoot }) {
  const spawnResult = spawnSync(
    process.execPath,
    [...mode.nodeArgs, probeFile, ...args],
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
  )} ${args.join(" ")}`;
  if (spawnResult.error) {
    throw new Error(`${command} failed: ${spawnResult.error.message}`);
  }
  if (spawnResult.status !== 0) {
    throw new Error(
      `${command} exited ${spawnResult.status}: ${normalizeGenericPath(
        spawnResult.stderr
      )}`
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

function normalizeGenericPath(value) {
  return String(value)
    .replace(
      /(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)'"]+/gu,
      "<temp>"
    )
    .replace(
      /\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu,
      "<workspace>"
    );
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
