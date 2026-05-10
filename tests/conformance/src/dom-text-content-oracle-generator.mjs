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
import { runInNewContext } from "node:vm";

import {
  DOM_TEXT_CONTENT_RENDER_SCENARIOS,
  DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS,
  materializeProps
} from "./dom-text-content-scenarios.mjs";
import {
  DOM_TEXT_CONTENT_PROBE_MODES,
  DOM_TEXT_CONTENT_RUNTIME_INVENTORY_PATH,
  DOM_TEXT_CONTENT_SOURCE_DOCUMENTS,
  DOM_TEXT_CONTENT_SUPPORTING_TARGETS,
  DOM_TEXT_CONTENT_TARGET
} from "./dom-text-content-targets.mjs";
import { stringifyDomTextContentOracle } from "./dom-text-content-oracle.mjs";

const PROBE_TIMEOUT_MS = 10_000;
const FETCH_TIMEOUT_MS = 30_000;
const ORACLE_TEMP_PREFIX = "fast-react-dom-text-content-oracle-";
const REACT_DOM_CLIENT_DEVELOPMENT_BUNDLE =
  "cjs/react-dom-client.development.js";

const SHOULD_SET_REACT_STUB = Object.freeze({
  createElement(elementType, props) {
    return {
      $$typeof: "react.element.placeholder",
      type: elementType,
      props
    };
  }
});

export async function generateDomTextContentOracle() {
  const inventoryText = readFileSync(
    new URL(`../${DOM_TEXT_CONTENT_RUNTIME_INVENTORY_PATH}`, import.meta.url),
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
      DOM_TEXT_CONTENT_TARGET.packageName,
      ...DOM_TEXT_CONTENT_SUPPORTING_TARGETS.map((target) => target.packageName)
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

    const reactDomPackageRoot = packageRoots.get(
      DOM_TEXT_CONTENT_TARGET.packageName
    );
    const shouldSetTextContentSourceEvidence =
      readShouldSetTextContentSourceEvidence(reactDomPackageRoot);
    const shouldSetTextContent = compileShouldSetTextContent(
      shouldSetTextContentSourceEvidence.source
    );
    const shouldSetTextContentObservations =
      DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS.map((scenario) =>
        runShouldSetTextContentProbe({
          scenario,
          shouldSetTextContent
        })
      );

    const probeFile = writeProbeFiles(projectRoot);
    const serverSerializationObservations = {};
    const clientMutationObservations = {};

    for (const mode of DOM_TEXT_CONTENT_PROBE_MODES) {
      serverSerializationObservations[mode.id] =
        DOM_TEXT_CONTENT_RENDER_SCENARIOS.map((scenario) =>
          runDomTextContentProbe({
            action: "server",
            mode,
            packageRoots,
            probeFile,
            projectRoot,
            scenario
          })
        );
      clientMutationObservations[mode.id] =
        DOM_TEXT_CONTENT_RENDER_SCENARIOS.map((scenario) =>
          runDomTextContentProbe({
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
      oracleKind: "react-19.2.6-dom-text-content-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 DOM text-content, HostText boundary, and dangerouslySetInnerHTML exclusion oracle",
      sources: DOM_TEXT_CONTENT_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory plus exact npm tarballs extracted into a temporary node_modules tree",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        probeIsolation:
          "one Node child process per mode, render scenario, and probe kind; shouldSetTextContent evaluated from the extracted React DOM development bundle",
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
        internalShouldSetTextContentSourceProbed: true,
        serverSerializationProbed: true,
        clientMutationProbed: true,
        rootErrorBoundariesProbed: true,
        deterministicFakeDomSubstrateUsed: true,
        browserNativeDomUsed: false,
        fastReactComparedToReactDom: false
      },
      conformanceClaims: {
        realReactDomCodeProbed: true,
        fastReactComparedToReactDom: false,
        fastReactBehaviorCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      localFastReactStatus: {
        status: "blocked-until-dom-host-text-rendering",
        comparedToReactDom: false,
        behaviorCompatibilityClaimed: false,
        admittedScenarioIds: [],
        reason:
          "Fast React has no public DOM root render path or wired HostText create/update/reset behavior for these oracle scenarios."
      },
      sourceInventory: {
        path: DOM_TEXT_CONTENT_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomPackageMatched: true,
        supportingPackagesMatched: true
      },
      reactDomTarget: DOM_TEXT_CONTENT_TARGET,
      supportingRuntimePackages: DOM_TEXT_CONTENT_SUPPORTING_TARGETS,
      probeModes: DOM_TEXT_CONTENT_PROBE_MODES,
      shouldSetTextContentSource: {
        bundlePath: REACT_DOM_CLIENT_DEVELOPMENT_BUNDLE,
        bundleSha256: shouldSetTextContentSourceEvidence.bundleSha256,
        functionSha256: shouldSetTextContentSourceEvidence.functionSha256,
        sourceIncludedInArtifact: false
      },
      shouldSetTextContentScenarios: DOM_TEXT_CONTENT_SHOULD_SET_SCENARIOS,
      renderScenarios: DOM_TEXT_CONTENT_RENDER_SCENARIOS,
      packages,
      fakeDomSubstrate: {
        purpose:
          "exercise React DOM text-content and HostText mutation calls deterministically in Node without adding a DOM dependency to the conformance workspace",
        browserNativeDom: false,
        browserAttributeNameNormalizationMode:
          "HTML namespace setAttribute/removeAttribute names are lowercased by the fake DOM before final tree snapshots",
        innerHTMLParsingMode:
          "innerHTML assignment is recorded as an assignment and is not parsed into child nodes",
        doesNotModel: [
          "native HTML parsing and browser outerHTML serialization",
          "layout, CSS cascade, focus, selection, and accessibility tree behavior",
          "custom element lifecycle callbacks and browser upgrade timing",
          "event dispatch and listener semantics",
          "controlled form wrappers, textarea value tracking, selection restoration, and noscript browser behavior"
        ]
      },
      shouldSetTextContentObservations,
      serverSerializationObservations,
      clientMutationObservations,
      intentionalGaps: [
        {
          id: "no-fast-react-react-dom-comparison",
          reason:
            "This oracle records pinned React DOM behavior only; Fast React DOM text mutation behavior is not implemented or compared in this worker."
        },
        {
          id: "fake-dom-client-substrate",
          reason:
            "Client probes execute real React DOM 19.2.6 mutation code, but the DOM target is a deterministic fake DOM. The oracle records React DOM calls and final fake DOM state, not browser parser, layout, CSSOM, focus, or custom-element reactions."
        },
        {
          id: "textarea-noscript-and-forms-not-claimed-locally",
          reason:
            "React DOM's internal shouldSetTextContent predicate includes textarea and noscript, but Fast React keeps controlled forms, textarea value tracking, and noscript browser/server behavior excluded until dedicated implementation work exists."
        },
        {
          id: "dangerously-set-inner-html-is-not-text-compatibility",
          reason:
            "dangerouslySetInnerHTML is recorded only as a leaf shortcut and exclusion from managed text children. This artifact does not implement or claim raw HTML parsing or browser DOM compatibility."
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

  for (const target of [
    DOM_TEXT_CONTENT_TARGET,
    ...DOM_TEXT_CONTENT_SUPPORTING_TARGETS
  ]) {
    const inventoryPackage = sourceInventory.packages?.[target.packageName];
    if (!inventoryPackage) {
      throw new Error(
        `Checked runtime inventory does not include ${target.packageName}`
      );
    }
    if (inventoryPackage.version !== target.version) {
      throw new Error(
        `${target.packageName} version mismatch: ${inventoryPackage.version}`
      );
    }
  }

  const reactDomPackage =
    sourceInventory.packages[DOM_TEXT_CONTENT_TARGET.packageName];
  for (const subpath of ["./client", "./server", "./server.node"]) {
    if (!reactDomPackage.runtimeSubpaths.includes(subpath)) {
      throw new Error(
        `react-dom inventory is missing required runtime subpath ${subpath}`
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

function readShouldSetTextContentSourceEvidence(reactDomPackageRoot) {
  const bundlePath = join(
    reactDomPackageRoot,
    REACT_DOM_CLIENT_DEVELOPMENT_BUNDLE
  );
  const bundleText = readFileSync(bundlePath, "utf8");
  const source = extractShouldSetTextContentSource(bundleText);

  return {
    source,
    bundleSha256: createHash("sha256").update(bundleText).digest("hex"),
    functionSha256: createHash("sha256").update(source).digest("hex")
  };
}

function extractShouldSetTextContentSource(bundleText) {
  const marker = "function shouldSetTextContent(type, props) {";
  const start = bundleText.indexOf(marker);
  if (start === -1) {
    throw new Error(
      "Unable to find shouldSetTextContent in react-dom client development bundle"
    );
  }

  const nextFunction = "\n    function shouldAttemptEagerTransition";
  const end = bundleText.indexOf(nextFunction, start);
  if (end === -1) {
    throw new Error(
      "Unable to find end of shouldSetTextContent in react-dom client development bundle"
    );
  }

  return bundleText.slice(start, end).trim();
}

function compileShouldSetTextContent(source) {
  const fn = runInNewContext(`(${source})`, Object.create(null), {
    timeout: PROBE_TIMEOUT_MS
  });
  if (typeof fn !== "function") {
    throw new Error("Extracted shouldSetTextContent source did not compile");
  }
  return fn;
}

function runShouldSetTextContentProbe({ scenario, shouldSetTextContent }) {
  const props = materializeProps(SHOULD_SET_REACT_STUB, scenario.props);
  try {
    return {
      scenarioId: scenario.id,
      action: "shouldSetTextContent",
      hostType: scenario.hostType,
      expectedReactDomValue: scenario.expectedReactDomValue,
      result: {
        status: "ok",
        value: Boolean(shouldSetTextContent(scenario.hostType, props))
      }
    };
  } catch (error) {
    return {
      scenarioId: scenario.id,
      action: "shouldSetTextContent",
      hostType: scenario.hostType,
      expectedReactDomValue: scenario.expectedReactDomValue,
      result: {
        status: "throws",
        error: describeThrown(error)
      }
    };
  }
}

function writeProbeFiles(projectRoot) {
  writeFileSync(
    join(projectRoot, "dom-text-content-targets.mjs"),
    readFileSync(
      new URL("./dom-text-content-targets.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  writeFileSync(
    join(projectRoot, "dom-text-content-scenarios.mjs"),
    readFileSync(
      new URL("./dom-text-content-scenarios.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );

  const probeFile = join(projectRoot, "dom-text-content-probe-runner.mjs");
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./dom-text-content-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runDomTextContentProbe({
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

function describeThrown(error) {
  return {
    name: error?.name ?? null,
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    stack: typeof error?.stack === "string" ? error.stack : null
  };
}

export function stringifyGeneratedDomTextContentOracle(oracle) {
  return stringifyDomTextContentOracle(oracle);
}
