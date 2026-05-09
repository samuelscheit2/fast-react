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
import { basename, join } from "node:path";

import {
  REACT_DOM_HYDRATION_MARKER_CLIENT_COMMENT_CONSTANTS,
  REACT_DOM_HYDRATION_MARKER_CONTRACTS,
  REACT_DOM_HYDRATION_MARKER_INLINE_RUNTIME_SNIPPETS,
  REACT_DOM_HYDRATION_MARKER_MISMATCH_CONTRACTS,
  REACT_DOM_HYDRATION_MARKER_PINNED_SOURCE_EXPECTATIONS,
  REACT_DOM_HYDRATION_MARKER_PUBLISHED_BUNDLE_SNIPPETS,
  REACT_DOM_HYDRATION_MARKER_REACT_SOURCE,
  REACT_DOM_HYDRATION_MARKER_RENDER_STATE_PREFIXES,
  REACT_DOM_HYDRATION_MARKER_RUNTIME_INVENTORY_PATH,
  REACT_DOM_HYDRATION_MARKER_SERVER_CHUNKS,
  REACT_DOM_HYDRATION_MARKER_SOURCE_DOCUMENTS,
  REACT_DOM_HYDRATION_MARKER_SOURCE_FILES,
  REACT_DOM_HYDRATION_MARKER_TARGET,
  REACT_DOM_HYDRATION_MARKER_WORKER_INPUTS,
  REACT_DOM_HYDRATION_MARKER_WORKER_RECONCILIATION
} from "./react-dom-hydration-marker-targets.mjs";

const FETCH_TIMEOUT_MS = 30_000;
const TARBALL_TIMEOUT_MS = 10_000;
const TARBALL_MAX_BUFFER_BYTES = 64 * 1024 * 1024;

export async function generateReactDomHydrationMarkerOracle() {
  const inventoryText = readFileSync(
    new URL(
      `../${REACT_DOM_HYDRATION_MARKER_RUNTIME_INVENTORY_PATH}`,
      import.meta.url
    ),
    "utf8"
  );
  const runtimeInventory = JSON.parse(inventoryText);
  const runtimeInventorySha256 = sha256(inventoryText);
  const reactDomPackage = validateRuntimeInventory(runtimeInventory);
  const workerInputs = readAndValidateWorkerInputs();

  const tempRoot = mkdtempSync(
    join(tmpdir(), "fast-react-react-dom-hydration-marker-oracle-")
  );

  try {
    mkdirSync(join(tempRoot, "tarballs"), { recursive: true });
    const tarballBytes = await fetchBytes(reactDomPackage.registry.distTarball);
    const tarballIntegrity = verifyTarballIntegrity(
      reactDomPackage.registry.distIntegrity,
      tarballBytes
    );
    assertDeepEqual(
      tarballIntegrity,
      {
        algorithm: reactDomPackage.tarball.integrityAlgorithm,
        digest: reactDomPackage.tarball.integrityDigest
      },
      "react-dom tarball integrity"
    );

    const tarballPath = join(
      tempRoot,
      "tarballs",
      "react-dom-19.2.6.tgz"
    );
    writeFileSync(tarballPath, tarballBytes);
    const tarballFiles = listTarballFiles(tarballPath);
    assertDeepEqual(
      tarballFiles,
      reactDomPackage.tarball.files,
      "react-dom tarball file list"
    );

    const publishedBundleEvidence = readPublishedBundleEvidence(tarballPath);
    const sourceEvidence = await readPinnedSourceEvidence();
    const extractedEvidence = extractAndValidateSourceEvidence(sourceEvidence);

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-hydration-marker-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 hydration marker and mismatch evidence oracle",
      sources: REACT_DOM_HYDRATION_MARKER_SOURCE_DOCUMENTS,
      generation: {
        method:
          "checked runtime inventory, exact react-dom npm tarball, accepted worker reports, and React source files pinned to the v19.2.6 commit",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        hydrationOrDomCodeExecuted: false,
        reactDomRuntimeRenderingExecuted: false,
        generatedTimestampIncluded: false,
        tarballTimeoutMs: TARBALL_TIMEOUT_MS,
        fetchTimeoutMs: FETCH_TIMEOUT_MS
      },
      evidenceClaims: {
        checkedRuntimeInventoryRead: true,
        exactTarballUrlFromInventory: true,
        tarballDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListMatchedInventory: true,
        publishedBundleSnippetsValidated: true,
        worker033EvidenceRead: true,
        worker042EvidenceRead: true,
        worker043EvidenceRead: true,
        worker042And043EvidenceCoRecorded: true,
        pinnedReactSourceFilesFetched: true,
        pinnedReactSourceFingerprintsVerified: true,
        clientMarkerConstantsExtracted: true,
        serverFizzMarkerChunksExtracted: true,
        inlineFizzRuntimeMutationsValidated: true,
        mismatchContractsExtracted: true,
        fastReactComparedToReactDom: false
      },
      conformanceClaims: {
        realReactDomSourceEvidenceCaptured: true,
        realReactDomRuntimeBehaviorProbed: false,
        fastReactComparedToReactDom: false,
        fastReactHydrationCompatible: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      sourceInventory: {
        path: REACT_DOM_HYDRATION_MARKER_RUNTIME_INVENTORY_PATH,
        sha256: runtimeInventorySha256,
        inventoryKind: runtimeInventory.inventoryKind,
        schemaVersion: runtimeInventory.schemaVersion,
        reactDomVersionMatched: true
      },
      reactDomTarget: REACT_DOM_HYDRATION_MARKER_TARGET,
      reactSource: REACT_DOM_HYDRATION_MARKER_REACT_SOURCE,
      packageEvidence: {
        "react-dom": {
          packageName: reactDomPackage.packageName,
          version: reactDomPackage.version,
          role: reactDomPackage.role,
          targetStatus: reactDomPackage.targetStatus,
          registry: reactDomPackage.registry,
          tarball: {
            integrityAlgorithm: tarballIntegrity.algorithm,
            integrityDigest: tarballIntegrity.digest,
            integrityVerified: true,
            fileCount: tarballFiles.length,
            files: tarballFiles
          },
          packageJson: reactDomPackage.packageJson,
          runtimeSubpaths: reactDomPackage.runtimeSubpaths,
          publicSubpaths: reactDomPackage.publicSubpaths
        }
      },
      workerInputs,
      workerEvidenceReconciliation:
        REACT_DOM_HYDRATION_MARKER_WORKER_RECONCILIATION,
      pinnedSourceFiles: sourceEvidence.files,
      publishedBundleEvidence,
      extractedEvidence,
      markerContracts: REACT_DOM_HYDRATION_MARKER_CONTRACTS,
      mismatchContracts: REACT_DOM_HYDRATION_MARKER_MISMATCH_CONTRACTS,
      fastReactContracts: [
        {
          id: "marker-generation-owned-by-fizz",
          contract:
            "Server/Fizz work owns emitting marker bytes; client hydration owns recognizing DOM comments/templates and acting on typed marker evidence."
        },
        {
          id: "mismatch-evidence-is-structured",
          contract:
            "Hydration mismatches require structured internal evidence, recoverable-error queueing, and dev diff data; Fast React must not reduce them to console strings."
        },
        {
          id: "no-hydration-implementation-claimed",
          contract:
            "This oracle captures evidence and contracts only. It does not implement hydrateRoot, DOM matching, event replay, Suspense hydration, or Fizz rendering."
        }
      ],
      intentionalGaps: [
        {
          id: "no-dom-fixture-hydration",
          reason:
            "This worker is scoped to marker and mismatch evidence; DOM fixture hydration requires future DOM/hydration implementation work."
        },
        {
          id: "no-fast-react-comparison",
          reason:
            "Fast React has no hydration or DOM implementation in this scope, so compatibility claims remain false."
        },
        {
          id: "source-contract-not-runtime-render-oracle",
          reason:
            "The oracle validates pinned source and published bundle evidence. It does not execute React DOM rendering or hydrateRoot flows."
        }
      ]
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

function validateRuntimeInventory(runtimeInventory) {
  if (runtimeInventory.inventoryKind !== "react-19.2.6-runtime-package-inventory") {
    throw new Error(
      `Unexpected source inventory kind: ${runtimeInventory.inventoryKind}`
    );
  }

  const reactDomPackage =
    runtimeInventory.packages?.[REACT_DOM_HYDRATION_MARKER_TARGET.packageName];
  if (!reactDomPackage) {
    throw new Error("Checked runtime inventory does not include react-dom");
  }
  if (reactDomPackage.version !== REACT_DOM_HYDRATION_MARKER_TARGET.version) {
    throw new Error(
      `Expected react-dom@${REACT_DOM_HYDRATION_MARKER_TARGET.version}, got ${reactDomPackage.version}`
    );
  }
  if (!reactDomPackage.registry?.distTarball) {
    throw new Error("Checked react-dom inventory has no tarball URL");
  }
  if (!reactDomPackage.registry?.distIntegrity) {
    throw new Error("Checked react-dom inventory has no dist.integrity");
  }
  return reactDomPackage;
}

function readAndValidateWorkerInputs() {
  return REACT_DOM_HYDRATION_MARKER_WORKER_INPUTS.map((input) => {
    const text = readFileSync(new URL(`../../../${input.path}`, import.meta.url), "utf8");
    const evidenceLines = input.requiredPhrases.map((phrase) => {
      const line = findLine(text, phrase);
      if (line === null) {
        throw new Error(`${input.path} does not contain required phrase ${phrase}`);
      }
      return { phrase, line };
    });

    return {
      id: input.id,
      path: input.path,
      sha256: sha256(text),
      evidenceLines
    };
  });
}

async function readPinnedSourceEvidence() {
  const files = [];
  const textById = {};

  for (const sourceFile of REACT_DOM_HYDRATION_MARKER_SOURCE_FILES) {
    const url = sourceFileUrl(sourceFile.path);
    const text = await fetchText(url);
    const fingerprint = {
      sha256: sha256(text),
      lineCount: text.split("\n").length
    };
    assertDeepEqual(
      fingerprint,
      REACT_DOM_HYDRATION_MARKER_PINNED_SOURCE_EXPECTATIONS[sourceFile.id],
      `pinned source fingerprint ${sourceFile.id}`
    );
    textById[sourceFile.id] = text;
    files.push({
      id: sourceFile.id,
      path: sourceFile.path,
      url,
      role: sourceFile.role,
      sha256: fingerprint.sha256,
      lineCount: fingerprint.lineCount,
      evidenceLines: sourceEvidenceLines(sourceFile.id, text)
    });
  }

  return { files, textById };
}

function extractAndValidateSourceEvidence(sourceEvidence) {
  const clientText = sourceEvidence.textById["react-fiber-config-dom"];
  const serverText = sourceEvidence.textById["react-fizz-config-dom"];
  const hydrationText =
    sourceEvidence.textById["react-fiber-hydration-context"];
  const inlineRuntimeText =
    sourceEvidence.textById["react-dom-fizz-inline-runtime"];

  const clientCommentConstants = {};
  for (const [name, expected] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_CLIENT_COMMENT_CONSTANTS
  )) {
    clientCommentConstants[name] = {
      value: extractConstString(clientText, name),
      sourceLine: findLine(clientText, `const ${name}`)
    };
    assertDeepEqual(
      clientCommentConstants[name].value,
      expected,
      `client marker constant ${name}`
    );
  }

  const serverChunks = {};
  for (const [name, expected] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_SERVER_CHUNKS
  )) {
    serverChunks[name] = {
      value: extractPrecomputedChunk(serverText, name),
      sourceLine: findLine(serverText, `const ${name}`)
    };
    assertDeepEqual(serverChunks[name].value, expected, `server chunk ${name}`);
  }

  const renderStatePrefixes = {};
  for (const [name, expected] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_RENDER_STATE_PREFIXES
  )) {
    renderStatePrefixes[name] = {
      suffix: extractRenderStatePrefix(serverText, name),
      sourceLine: findLine(serverText, `${name}: stringToPrecomputedChunk`)
    };
    assertDeepEqual(
      renderStatePrefixes[name].suffix,
      expected,
      `render state prefix ${name}`
    );
  }

  const inlineRuntimeMutations = {};
  for (const [exportName, snippets] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_INLINE_RUNTIME_SNIPPETS
  )) {
    inlineRuntimeMutations[exportName] = {
      sourceLine: findLine(inlineRuntimeText, `export const ${exportName}`),
      snippets: snippets.map((snippet) => {
        if (!inlineRuntimeText.includes(snippet)) {
          throw new Error(
            `Inline Fizz runtime ${exportName} missing snippet ${snippet}`
          );
        }
        return {
          snippet,
          present: true,
          line: findLine(inlineRuntimeText, snippet)
        };
      })
    };
  }

  const mismatchEvidence = {
    hydrationMismatchException: {
      sourceLine: findLine(hydrationText, "HydrationMismatchException"),
      messagePrefix:
        "Hydration Mismatch Exception: This is not a real error, and should not leak into userspace.",
      present:
        hydrationText.includes("Hydration Mismatch Exception: This is not a real error")
    },
    fatalMismatchMessageTemplate: {
      sourceLine: findLine(hydrationText, "Hydration failed because"),
      htmlPrefix:
        "Hydration failed because the server rendered HTML didn't match the client.",
      textPrefix:
        "Hydration failed because the server rendered text didn't match the client.",
      link: "https://react.dev/link/hydration-mismatch",
      queuesBeforeThrow:
        findLine(hydrationText, "queueHydrationError(createCapturedValueAtFiber") >
        findLine(hydrationText, "Hydration failed because"),
      throwsInternalSentinel: hydrationText.includes(
        "throw HydrationMismatchException"
      )
    },
    recoverableQueue: {
      queueFunctionLine: findLine(hydrationText, "export function queueHydrationError"),
      upgradeFunctionLine: findLine(
        hydrationText,
        "export function upgradeHydrationErrorsToRecoverable"
      ),
      queuesRecoverableErrors: hydrationText.includes(
        "queueRecoverableErrors(queuedErrors)"
      )
    },
    devSuccessfulHydrationWarning: {
      sourceLine: findLine(hydrationText, "A tree hydrated but some attributes"),
      messagePrefix:
        "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up.",
      consoleError: hydrationText.includes("console.error(")
    },
    suppressHydrationWarningTextDiff: {
      sourceLine: findLine(clientText, "diffHydratedTextForDevWarnings"),
      propName: "suppressHydrationWarning",
      returnsNullWhenSuppressed:
        clientText.includes("parentProps[SUPPRESS_HYDRATION_WARNING] !== true") &&
        clientText.includes("return null;")
    },
    formMarkerMismatchPath: {
      sourceLine: findLine(
        hydrationText,
        "export function tryToClaimNextHydratableFormMarkerInstance"
      ),
      fallsThroughToThrowOnHydrationMismatch: hydrationText.includes(
        "throwOnHydrationMismatch(fiber);\n  return false;"
      )
    }
  };

  for (const [key, value] of Object.entries(mismatchEvidence)) {
    if (value.sourceLine === null && key !== "fatalMismatchMessageTemplate") {
      throw new Error(`Missing mismatch evidence line for ${key}`);
    }
  }
  if (!mismatchEvidence.hydrationMismatchException.present) {
    throw new Error("HydrationMismatchException message was not found");
  }
  if (!mismatchEvidence.fatalMismatchMessageTemplate.throwsInternalSentinel) {
    throw new Error("Fatal mismatch path did not throw HydrationMismatchException");
  }
  if (!mismatchEvidence.fatalMismatchMessageTemplate.queuesBeforeThrow) {
    throw new Error("Fatal mismatch path did not queue before sentinel throw");
  }
  if (!mismatchEvidence.recoverableQueue.queuesRecoverableErrors) {
    throw new Error("Recoverable hydration queue evidence was not found");
  }
  if (!mismatchEvidence.devSuccessfulHydrationWarning.consoleError) {
    throw new Error("Dev successful hydration warning console.error not found");
  }
  if (
    !mismatchEvidence.suppressHydrationWarningTextDiff.returnsNullWhenSuppressed
  ) {
    throw new Error("suppressHydrationWarning text diff suppression not found");
  }
  if (!mismatchEvidence.formMarkerMismatchPath.fallsThroughToThrowOnHydrationMismatch) {
    throw new Error("Form marker mismatch path did not call throwOnHydrationMismatch");
  }

  return {
    clientCommentConstants,
    serverFizzChunks: serverChunks,
    renderStatePrefixes,
    inlineRuntimeMutations,
    mismatchEvidence
  };
}

function readPublishedBundleEvidence(tarballPath) {
  const evidence = {};

  for (const [file, snippets] of Object.entries(
    REACT_DOM_HYDRATION_MARKER_PUBLISHED_BUNDLE_SNIPPETS
  )) {
    const text = extractTarballFile(tarballPath, `package/${file}`);
    evidence[file] = {
      sha256: sha256(text),
      lineCount: text.split("\n").length,
      snippets: snippets.map((snippet) => {
        if (!text.includes(snippet)) {
          throw new Error(`${file} missing required snippet ${snippet}`);
        }
        return {
          snippet,
          present: true,
          line: findLine(text, snippet)
        };
      })
    };
  }

  return evidence;
}

function sourceEvidenceLines(sourceId, text) {
  const needlesBySource = {
    "react-fiber-config-dom": [
      "const ACTIVITY_START_DATA",
      "const SUSPENSE_QUEUED_START_DATA",
      "const FORM_STATE_IS_MATCHING",
      "export function getNextHydratable",
      "export function diffHydratedTextForDevWarnings"
    ],
    "react-fizz-config-dom": [
      "const formStateMarkerIsMatching",
      "const startActivityBoundary",
      "const startCompletedSuspenseBoundary",
      "const startPendingSuspenseBoundary1",
      "const startClientRenderedSuspenseBoundary",
      "const completeSegmentData1",
      "const completeBoundaryWithStylesData1",
      "const clientRenderData1"
    ],
    "react-fiber-hydration-context": [
      "HydrationMismatchException",
      "function throwOnHydrationMismatch",
      "export function queueHydrationError",
      "export function emitPendingHydrationWarnings"
    ],
    "react-dom-fizz-inline-runtime": [
      "export const clientRenderBoundary",
      "export const completeBoundary",
      "export const completeBoundaryWithStyles",
      "export const completeSegment",
      "export const formReplaying"
    ]
  };

  return (needlesBySource[sourceId] ?? []).map((needle) => ({
    needle,
    line: requireLine(text, needle)
  }));
}

function sourceFileUrl(sourcePath) {
  return `https://raw.githubusercontent.com/${REACT_DOM_HYDRATION_MARKER_REACT_SOURCE.repository}/${REACT_DOM_HYDRATION_MARKER_REACT_SOURCE.commit}/${sourcePath}`;
}

function extractConstString(text, name) {
  const match = text.match(
    new RegExp(`const\\s+${escapeRegExp(name)}\\s*=\\s*'([^']*)';`, "u")
  );
  if (!match) {
    throw new Error(`Missing string constant ${name}`);
  }
  return match[1];
}

function extractPrecomputedChunk(text, name) {
  const match = text.match(
    new RegExp(
      `const\\s+${escapeRegExp(
        name
      )}\\s*=\\s*stringToPrecomputedChunk\\(\\s*'([\\s\\S]*?)'\\s*,?\\s*\\);`,
      "u"
    )
  );
  if (!match) {
    throw new Error(`Missing precomputed chunk ${name}`);
  }
  return match[1];
}

function extractRenderStatePrefix(text, name) {
  const match = text.match(
    new RegExp(
      `${escapeRegExp(
        name
      )}:\\s*stringToPrecomputedChunk\\(idPrefix \\+ '([^']+)'\\)`,
      "u"
    )
  );
  if (!match) {
    throw new Error(`Missing render state prefix ${name}`);
  }
  return match[1];
}

function listTarballFiles(tarballPath) {
  const result = spawnSync("tar", ["-tzf", tarballPath], {
    encoding: "utf8",
    maxBuffer: TARBALL_MAX_BUFFER_BYTES,
    timeout: TARBALL_TIMEOUT_MS
  });
  if (result.error) {
    throw new Error(`tar list failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`tar list exited ${result.status}: ${result.stderr}`);
  }

  return result.stdout
    .split("\n")
    .filter(Boolean)
    .map((file) => file.replace(/^package\//u, ""))
    .filter((file) => file !== "")
    .sort();
}

function extractTarballFile(tarballPath, filePath) {
  const result = spawnSync("tar", ["-xOzf", tarballPath, filePath], {
    encoding: "utf8",
    maxBuffer: TARBALL_MAX_BUFFER_BYTES,
    timeout: TARBALL_TIMEOUT_MS
  });
  if (result.error) {
    throw new Error(`tar extract ${basename(filePath)} failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `tar extract ${basename(filePath)} exited ${result.status}: ${result.stderr}`
    );
  }
  return result.stdout;
}

async function fetchText(url) {
  return (await fetchBytes(url)).toString("utf8");
}

function fetchBytes(url, redirectsRemaining = 3) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      const status = response.statusCode ?? 0;
      if (
        status >= 300 &&
        status < 400 &&
        response.headers.location &&
        redirectsRemaining > 0
      ) {
        response.resume();
        resolve(
          fetchBytes(new URL(response.headers.location, url).href, redirectsRemaining - 1)
        );
        return;
      }

      if (status !== 200) {
        response.resume();
        reject(new Error(`GET ${url} returned HTTP ${status}`));
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
    });
    request.setTimeout(FETCH_TIMEOUT_MS, () => {
      request.destroy(new Error(`GET ${url} timed out`));
    });
    request.on("error", reject);
  });
}

function verifyTarballIntegrity(integrity, bytes) {
  const match = integrity?.match(/^([a-z0-9]+)-(.+)$/u);
  if (!match) {
    throw new Error(`Unsupported integrity string: ${integrity}`);
  }
  const [, algorithm, expectedDigest] = match;
  const digest = createHash(algorithm).update(bytes).digest("base64");
  if (digest !== expectedDigest) {
    throw new Error(`Integrity mismatch for ${algorithm} tarball digest`);
  }
  return { algorithm, digest };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function findLine(text, needle) {
  const lines = text.split("\n");
  const index = lines.findIndex((line) => line.includes(needle));
  return index === -1 ? null : index + 1;
}

function requireLine(text, needle) {
  const line = findLine(text, needle);
  if (line === null) {
    throw new Error(`Missing source evidence line: ${needle}`);
  }
  return line;
}

function assertDeepEqual(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `${label} mismatch:\nactual ${actualJson}\nexpected ${expectedJson}`
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
