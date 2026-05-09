import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
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
  REACT_DOM_EVENT_PRIORITY_COMPILED_PACKAGE_FILES,
  REACT_DOM_EVENT_PRIORITY_FAST_REACT_TARGETS,
  REACT_DOM_EVENT_PRIORITY_REACT_SOURCE_TARGET,
  REACT_DOM_EVENT_PRIORITY_RUNTIME_INVENTORY_PATH,
  REACT_DOM_EVENT_PRIORITY_SOURCE_DOCUMENTS,
  REACT_DOM_EVENT_PRIORITY_SOURCE_FILES,
  REACT_DOM_EVENT_PRIORITY_SUPPORTING_TARGETS,
  REACT_DOM_EVENT_PRIORITY_TARGET
} from "./react-dom-event-priority-targets.mjs";
import {
  REACT_DOM_EVENT_PRIORITY_EXPECTED_CONTINUOUS_EVENTS,
  REACT_DOM_EVENT_PRIORITY_EXPECTED_DISCRETE_EVENTS,
  REACT_DOM_EVENT_PRIORITY_MESSAGE_PRIORITY_CASES,
  REACT_DOM_EVENT_PRIORITY_RESOLVE_UPDATE_PRIORITY_CASES,
  REACT_DOM_EVENT_PRIORITY_SCENARIOS
} from "./react-dom-event-priority-scenarios.mjs";

const FETCH_TIMEOUT_MS = 30_000;
const PROBE_TIMEOUT_MS = 10_000;
const ORACLE_TEMP_PREFIX = "fast-react-react-dom-event-priority-oracle-";

const SOURCE_FILE_PATHS = new Map([
  [
    "ReactVersions.js",
    "ReactVersions.js"
  ],
  [
    "ReactDOMEventListener.js",
    "packages/react-dom-bindings/src/events/ReactDOMEventListener.js"
  ],
  [
    "DOMEventNames.js",
    "packages/react-dom-bindings/src/events/DOMEventNames.js"
  ],
  [
    "ReactDOMUpdatePriority.js",
    "packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js"
  ],
  [
    "ReactEventPriorities.js",
    "packages/react-reconciler/src/ReactEventPriorities.js"
  ],
  [
    "ReactFiberLane.js",
    "packages/react-reconciler/src/ReactFiberLane.js"
  ]
]);

const PRIORITY_ORDER = [
  "NoEventPriority",
  "DiscreteEventPriority",
  "ContinuousEventPriority",
  "DefaultEventPriority",
  "IdleEventPriority"
];

const EVENT_PRIORITY_LABELS = {
  NoEventPriority: "none",
  DiscreteEventPriority: "discrete",
  ContinuousEventPriority: "continuous",
  DefaultEventPriority: "default",
  IdleEventPriority: "idle"
};

const SCHEDULER_PRIORITY_VALUES = {
  ImmediateSchedulerPriority: 1,
  UserBlockingSchedulerPriority: 2,
  NormalSchedulerPriority: 3,
  LowSchedulerPriority: 4,
  IdleSchedulerPriority: 5,
  UnknownSchedulerPriority: null
};

export async function generateReactDomEventPriorityOracle() {
  const inventoryText = readFileSync(
    new URL(`../${REACT_DOM_EVENT_PRIORITY_RUNTIME_INVENTORY_PATH}`, import.meta.url),
    "utf8"
  );
  const sourceInventory = JSON.parse(inventoryText);
  const sourceInventorySha256 = createHash("sha256")
    .update(inventoryText)
    .digest("hex");

  validateCheckedInventory(sourceInventory);

  const sourceFiles = await fetchReactSourceFiles();
  const sourceEvidence = buildSourceEvidence(sourceFiles);
  const laneConstants = parseLaneConstants(sourceFiles["ReactFiberLane.js"].text);
  const eventPriorityConstants = parseEventPriorityConstants({
    laneConstants,
    sourceText: sourceFiles["ReactEventPriorities.js"].text
  });
  const eventPriorityTable = parseEventPriorityTable({
    eventListenerSource: sourceFiles["ReactDOMEventListener.js"].text,
    domEventNamesSource: sourceFiles["DOMEventNames.js"].text,
    eventPriorityConstants
  });
  const messageSchedulerPriorityMapping = buildMessageSchedulerPriorityMapping(
    eventPriorityConstants
  );
  const resolveUpdatePriority = buildResolveUpdatePriority({
    eventPriorityConstants,
    updatePrioritySource: sourceFiles["ReactDOMUpdatePriority.js"].text
  });

  const tempRoot = mkdtempSync(join(tmpdir(), ORACLE_TEMP_PREFIX));

  try {
    const projectRoot = join(tempRoot, "project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    mkdirSync(nodeModulesRoot, { recursive: true });

    const packageNames = [
      REACT_DOM_EVENT_PRIORITY_TARGET.packageName,
      ...REACT_DOM_EVENT_PRIORITY_SUPPORTING_TARGETS.map(
        (target) => target.packageName
      )
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

    const compiledPackageEvidence = inspectCompiledReactDomPackage({
      packageRoot: joinPackagePath(
        nodeModulesRoot,
        REACT_DOM_EVENT_PRIORITY_TARGET.packageName
      )
    });

    copyFastReactPackage({
      nodeModulesRoot,
      packageName: "@fast-react/react-dom",
      sourceRelativePath: "../../../packages/react-dom"
    });
    copyFastReactPackage({
      nodeModulesRoot,
      packageName: "scheduler",
      sourceRelativePath: "../../../packages/scheduler"
    });

    const probeFile = writeProbeFile(projectRoot);
    const fastReactComparisonBoundaries = runFastReactBoundaryProbe({
      probeFile,
      projectRoot
    }).boundaries.map(normalizeBoundaryObservation);

    return {
      schemaVersion: 1,
      oracleKind: "react-19.2.6-react-dom-event-priority-oracle",
      deterministic: true,
      generatedArtifacts: true,
      compatibilityLabel:
        "React DOM 19.2.6 event-name and update-priority oracle",
      sources: REACT_DOM_EVENT_PRIORITY_SOURCE_DOCUMENTS,
      sourceFileTargets: REACT_DOM_EVENT_PRIORITY_SOURCE_FILES,
      generation: {
        method:
          "pinned React source files plus checked runtime inventory tarballs and local Fast React placeholder probes",
        lifecycleScriptsExecuted: false,
        rootManifestsOrLockfilesMutated: false,
        sourceFetch:
          "raw GitHub files fetched by immutable React source commit",
        packageEvidence:
          "exact npm tarballs from checked runtime inventory with integrity and file-list validation",
        probeIsolation:
          "one Node child process probing copied local Fast React React DOM and scheduler placeholders",
        probeTimeoutMs: PROBE_TIMEOUT_MS,
        generatedTimestampIncluded: false,
        timingNormalization:
          "no wall-clock timings are recorded; message priority rows are source-derived Scheduler priority cases"
      },
      evidenceClaims: {
        worker041PlanUsed: true,
        checkedRuntimeInventoryRead: true,
        checkedRuntimeInventoryMatched: true,
        reactSourceCommitFetched: true,
        reactSourceEventPriorityParsed: true,
        reactSourceUpdatePriorityParsed: true,
        exactTarballUrlsFromInventory: true,
        tarballsDownloaded: true,
        tarballIntegrityVerified: true,
        tarballFileListsMatchedInventory: true,
        compiledReactDomPackageChecked: true,
        fastReactPlaceholderBoundariesProbed: true
      },
      conformanceClaims: {
        realReactDomSourceMapped: true,
        realReactDomPackageEvidenceChecked: true,
        fastReactComparedToReactDom: false,
        fastReactBehaviorCompatible: false,
        domEventImplementationExists: false,
        fullDualRunOracleExists: false,
        compatibilityClaimed: false
      },
      sourceInventory: {
        path: REACT_DOM_EVENT_PRIORITY_RUNTIME_INVENTORY_PATH,
        sha256: sourceInventorySha256,
        inventoryKind: sourceInventory.inventoryKind,
        schemaVersion: sourceInventory.schemaVersion,
        reactDomPackageMatched: true,
        schedulerPackageMatched: true,
        reactPackageMatched: true
      },
      reactSourceTarget: REACT_DOM_EVENT_PRIORITY_REACT_SOURCE_TARGET,
      reactDomTarget: REACT_DOM_EVENT_PRIORITY_TARGET,
      supportingRuntimePackages: REACT_DOM_EVENT_PRIORITY_SUPPORTING_TARGETS,
      fastReactTargets: REACT_DOM_EVENT_PRIORITY_FAST_REACT_TARGETS,
      sourceEvidence,
      packages,
      compiledPackageEvidence,
      scenarios: REACT_DOM_EVENT_PRIORITY_SCENARIOS,
      priorityConstants: {
        eventPriorities: eventPriorityConstants,
        schedulerPriorities: SCHEDULER_PRIORITY_VALUES,
        eventPriorityToLaneIdentity: true
      },
      eventPriorityTable,
      messageSchedulerPriorityMapping,
      resolveUpdatePriority,
      fastReactComparisonBoundaries,
      coverage: {
        discreteEventNames: true,
        continuousEventNames: true,
        defaultEventNames: true,
        unknownEventFallback: true,
        messageSchedulerPriorityBridge: true,
        idlePriorityViaMessageSchedulerPriority: true,
        laneBackedEventPriorityConstants: true,
        resolveUpdatePriorityFallbackOrder: true,
        fastReactPlaceholderComparisonBoundaries: true
      },
      intentionalGaps: [
        {
          id: "source-derived-private-internals",
          reason:
            "React DOM event priority and resolveUpdatePriority are private internals, so this oracle derives their behavior from pinned React 19.2.6 source instead of public runtime exports."
        },
        {
          id: "no-dom-event-implementation",
          reason:
            "This worker only records oracle evidence; it does not implement root listeners, plugin dispatch, hydration replay, or update scheduling in Fast React."
        },
        {
          id: "fast-react-placeholders-not-dual-run-compatible",
          reason:
            "Current Fast React React DOM and scheduler packages expose placeholder surfaces, so the oracle records comparison boundaries without claiming behavior compatibility."
        }
      ]
    };
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

async function fetchReactSourceFiles() {
  const files = {};
  for (const [fileName, sourcePath] of SOURCE_FILE_PATHS) {
    files[fileName] = {
      sourcePath,
      text: await fetchText(sourceUrl(sourcePath))
    };
  }
  return files;
}

function sourceUrl(sourcePath) {
  return `https://raw.githubusercontent.com/facebook/react/${REACT_DOM_EVENT_PRIORITY_REACT_SOURCE_TARGET.commit}/${sourcePath}`;
}

function buildSourceEvidence(sourceFiles) {
  const evidence = {};
  for (const [fileName, file] of Object.entries(sourceFiles)) {
    evidence[fileName] = {
      sourcePath: file.sourcePath,
      sourceUrl: sourceUrl(file.sourcePath),
      sha256: createHash("sha256").update(file.text).digest("hex"),
      lineCount: file.text.split("\n").length
    };
  }

  const versionsSource = sourceFiles["ReactVersions.js"].text;
  evidence["ReactVersions.js"].versionChecks = {
    react:
      versionsSource.includes("ReactVersion = '19.2.6'") &&
      versionsSource.includes("react: ReactVersion"),
    reactDom: versionsSource.includes("'react-dom': ReactVersion"),
    scheduler: versionsSource.includes("scheduler: '0.27.0'")
  };

  return evidence;
}

function parseLaneConstants(sourceText) {
  const laneNames = [
    "NoLane",
    "SyncLane",
    "InputContinuousLane",
    "DefaultLane",
    "IdleLane"
  ];
  const laneConstants = {};

  for (const laneName of laneNames) {
    const match = sourceText.match(
      new RegExp(
        `export const ${laneName}: Lane =\\s*(?:/\\*[^*]*\\*/\\s*)?(0b[01]+|\\d+);`,
        "u"
      )
    );
    if (!match) {
      throw new Error(`Could not parse ReactFiberLane constant ${laneName}`);
    }
    laneConstants[laneName] = {
      laneName,
      value: Number.parseInt(
        match[1].startsWith("0b") ? match[1].slice(2) : match[1],
        match[1].startsWith("0b") ? 2 : 10
      ),
      binary: match[1].startsWith("0b")
        ? match[1]
        : `0b${Number(match[1]).toString(2)}`
    };
  }

  return laneConstants;
}

function parseEventPriorityConstants({ laneConstants, sourceText }) {
  const constants = {};

  for (const priorityName of PRIORITY_ORDER) {
    const match = sourceText.match(
      new RegExp(
        `export const ${priorityName}: EventPriority = ([A-Za-z0-9_]+);`,
        "u"
      )
    );
    if (!match) {
      throw new Error(
        `Could not parse ReactEventPriorities constant ${priorityName}`
      );
    }
    const laneName = match[1];
    const lane = laneConstants[laneName];
    if (!lane) {
      throw new Error(`${priorityName} references unknown lane ${laneName}`);
    }
    constants[priorityName] = {
      priorityName,
      label: EVENT_PRIORITY_LABELS[priorityName],
      laneName,
      value: lane.value,
      binary: lane.binary
    };
  }

  for (const needle of [
    "export opaque type EventPriority = Lane;",
    "export function eventPriorityToLane",
    "return updatePriority;",
    "export function lanesToEventPriority"
  ]) {
    if (!sourceText.includes(needle)) {
      throw new Error(`ReactEventPriorities source missing ${needle}`);
    }
  }

  return constants;
}

function parseEventPriorityTable({
  domEventNamesSource,
  eventListenerSource,
  eventPriorityConstants
}) {
  const discreteEvents = parseEventCasesBeforeReturn({
    returnExpression: "return DiscreteEventPriority;",
    sourceText: eventListenerSource,
    startNeedle: "switch (domEventName)"
  });
  assertDeepEqual(
    discreteEvents,
    REACT_DOM_EVENT_PRIORITY_EXPECTED_DISCRETE_EVENTS,
    "ReactDOMEventListener discrete events"
  );

  const continuousEvents = parseEventCasesBeforeReturn({
    returnExpression: "return ContinuousEventPriority;",
    sourceText: eventListenerSource,
    startNeedle: "return DiscreteEventPriority;"
  });
  assertDeepEqual(
    continuousEvents,
    REACT_DOM_EVENT_PRIORITY_EXPECTED_CONTINUOUS_EVENTS,
    "ReactDOMEventListener continuous events"
  );

  const domEventNames = parseDomEventNameUnion(domEventNamesSource);
  const handledEvents = new Set([
    ...discreteEvents,
    ...continuousEvents,
    "message"
  ]);
  const defaultEvents = domEventNames.filter(
    (eventName) => !handledEvents.has(eventName)
  );

  return {
    sourceFiles: [
      "packages/react-dom-bindings/src/events/ReactDOMEventListener.js",
      "packages/react-dom-bindings/src/events/DOMEventNames.js"
    ],
    extractedFrom: "getEventPriority(domEventName)",
    domEventNameUnion: domEventNames,
    buckets: {
      discrete: makeEventEntries({
        eventNames: discreteEvents,
        priority: eventPriorityConstants.DiscreteEventPriority
      }),
      continuous: makeEventEntries({
        eventNames: continuousEvents,
        priority: eventPriorityConstants.ContinuousEventPriority
      }),
      default: makeEventEntries({
        eventNames: defaultEvents,
        priority: eventPriorityConstants.DefaultEventPriority
      })
    },
    specialCases: {
      message: {
        eventName: "message",
        prioritySource:
          "getCurrentSchedulerPriorityLevel() switch inside getEventPriority",
        mappingsRecordedIn: "messageSchedulerPriorityMapping"
      },
      unknownEventFallback: {
        eventName: "unknown-fast-react-probe-event",
        priorityName: "DefaultEventPriority",
        priorityValue: eventPriorityConstants.DefaultEventPriority.value,
        laneName: eventPriorityConstants.DefaultEventPriority.laneName,
        source: "default branch of getEventPriority"
      }
    }
  };
}

function parseEventCasesBeforeReturn({
  returnExpression,
  sourceText,
  startNeedle
}) {
  const start = sourceText.indexOf(startNeedle);
  if (start === -1) {
    throw new Error(`Could not find getEventPriority segment: ${startNeedle}`);
  }
  const end = sourceText.indexOf(returnExpression, start);
  if (end === -1) {
    throw new Error(
      `Could not find getEventPriority return expression: ${returnExpression}`
    );
  }
  return [...sourceText.slice(start, end).matchAll(/case '([^']+)':/gu)].map(
    (match) => match[1]
  );
}

function parseDomEventNameUnion(sourceText) {
  const match = sourceText.match(/export type DOMEventName =([\s\S]*?);/u);
  if (!match) {
    throw new Error("Could not parse DOMEventName union");
  }
  return [...match[1].matchAll(/\| '([^']+)'/gu)].map((entry) => entry[1]);
}

function makeEventEntries({ eventNames, priority }) {
  return eventNames.map((eventName, index) => ({
    eventName,
    priorityName: priority.priorityName,
    priorityLabel: priority.label,
    priorityValue: priority.value,
    laneName: priority.laneName,
    sourceCaseIndex: index
  }));
}

function buildMessageSchedulerPriorityMapping(eventPriorityConstants) {
  return REACT_DOM_EVENT_PRIORITY_MESSAGE_PRIORITY_CASES.map((entry) => {
    const priority = eventPriorityConstants[entry.eventPriorityName];
    return {
      ...entry,
      schedulerValue:
        entry.schedulerValue ??
        SCHEDULER_PRIORITY_VALUES[entry.schedulerPriorityName],
      eventName: "message",
      eventPriorityValue: priority.value,
      eventPriorityLabel: priority.label,
      laneName: priority.laneName,
      source:
        "ReactDOMEventListener.getEventPriority maps message through current Scheduler priority"
    };
  });
}

function buildResolveUpdatePriority({
  eventPriorityConstants,
  updatePrioritySource
}) {
  const requiredNeedles = [
    "const updatePriority = ReactDOMSharedInternals.p;",
    "if (updatePriority !== NoEventPriority)",
    "const currentEvent = window.event;",
    "if (currentEvent === undefined)",
    "return DefaultEventPriority;",
    "return getEventPriority(currentEvent.type);",
    "export function runWithPriority"
  ];
  for (const needle of requiredNeedles) {
    if (!updatePrioritySource.includes(needle)) {
      throw new Error(`ReactDOMUpdatePriority source missing ${needle}`);
    }
  }

  return {
    sourceFile:
      "packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js",
    storage: {
      internalField:
        "ReactDOMSharedInternals.p /* currentUpdatePriority */",
      initialPriorityName: "NoEventPriority",
      initialPriorityValue: eventPriorityConstants.NoEventPriority.value
    },
    fallbackOrder: [
      "return stored current update priority when it is not NoEventPriority",
      "otherwise read window.event",
      "return DefaultEventPriority when window.event is undefined",
      "otherwise map window.event.type through getEventPriority"
    ],
    runWithPriorityRestoresPreviousPriority: true,
    cases: REACT_DOM_EVENT_PRIORITY_RESOLVE_UPDATE_PRIORITY_CASES.map(
      (entry) => ({
        ...entry,
        expectedPriorityValue:
          eventPriorityConstants[entry.expectedPriorityName].value,
        expectedLaneName:
          eventPriorityConstants[entry.expectedPriorityName].laneName
      })
    )
  };
}

function validateCheckedInventory(sourceInventory) {
  if (
    sourceInventory.inventoryKind !==
    "react-19.2.6-runtime-package-inventory"
  ) {
    throw new Error(
      `Unexpected source inventory kind: ${sourceInventory.inventoryKind}`
    );
  }

  for (const target of [
    REACT_DOM_EVENT_PRIORITY_TARGET,
    ...REACT_DOM_EVENT_PRIORITY_SUPPORTING_TARGETS
  ]) {
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
      runtimeSubpaths: inventoryPackage.runtimeSubpaths
    }
  };
}

function inspectCompiledReactDomPackage({ packageRoot }) {
  return Object.fromEntries(
    REACT_DOM_EVENT_PRIORITY_COMPILED_PACKAGE_FILES.map((relativePath) => {
      const fileText = readFileSync(join(packageRoot, relativePath), "utf8");
      return [
        relativePath,
        {
          sha256: createHash("sha256").update(fileText).digest("hex"),
          lineCount: fileText.split("\n").length,
          containsGetEventPriority: fileText.includes("getEventPriority"),
          containsResolveUpdatePriority: fileText.includes(
            "resolveUpdatePriority"
          ),
          containsMessagePriorityBridge: fileText.includes("message"),
          containsReactDomSharedInternalsPrioritySlot:
            fileText.includes("ReactDOMSharedInternals.p") ||
            fileText.includes("ReactDOMSharedInternals")
        }
      ];
    })
  );
}

function copyFastReactPackage({
  nodeModulesRoot,
  packageName,
  sourceRelativePath
}) {
  const sourceRoot = new URL(sourceRelativePath, import.meta.url);
  const packageRoot = joinPackagePath(nodeModulesRoot, packageName);
  mkdirSync(dirname(packageRoot), { recursive: true });
  rmSync(packageRoot, { force: true, recursive: true });
  cpSync(sourceRoot, packageRoot, {
    recursive: true,
    dereference: true,
    filter: (source) => basename(source) !== "node_modules"
  });
}

function writeProbeFile(projectRoot) {
  const probeFile = join(
    projectRoot,
    "react-dom-event-priority-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./react-dom-event-priority-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runFastReactBoundaryProbe({ probeFile, projectRoot }) {
  const spawnResult = spawnSync(process.execPath, [probeFile], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_ENV: "development"
    },
    timeout: PROBE_TIMEOUT_MS
  });

  return parseProbeOutput(spawnResult, {
    command: `node ${basename(probeFile)}`
  });
}

function normalizeBoundaryObservation(value) {
  return normalizeErrorMessages(value);
}

function normalizeErrorMessages(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeErrorMessages);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "message" && typeof child === "string") {
      next[key] = normalizePathFragments(child);
    } else {
      next[key] = normalizeErrorMessages(child);
    }
  }
  return next;
}

function normalizePathFragments(message) {
  return message
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>")
    .replace(/\/Users\/user\/Developer\/Developer\/[^\s)'"]+/gu, "<workspace>");
}

function fetchText(url) {
  return fetchBytes(url).then((bytes) => bytes.toString("utf8"));
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
      `${label} mismatch:\nactual ${actualText}\nexpected ${expectedText}`
    );
  }
}

function joinPackagePath(nodeModulesRoot, packageName) {
  return join(nodeModulesRoot, ...packageName.split("/"));
}
