import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SCHEDULER_VARIANT_CURRENTNESS_GATE_ID,
  SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS,
  evaluateSchedulerVariantCurrentnessGate
} from "./scheduler-variant-oracle.mjs";
import {
  SCHEDULER_NATIVE_ENTRY_DIRECT_CJS_SPECIFIERS,
  SCHEDULER_NATIVE_ENTRY_FAST_REACT_TARGET,
  SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH,
  SCHEDULER_NATIVE_ENTRY_PROBE_MODES,
  SCHEDULER_NATIVE_ENTRY_RESOLUTION_SPECIFIERS,
  SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS,
  SCHEDULER_NATIVE_ENTRY_SCENARIOS,
  SCHEDULER_NATIVE_ENTRY_TARGET
} from "./scheduler-native-entry-targets.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const PROBE_TIMEOUT_MS = 15_000;

export const SCHEDULER_NATIVE_ENTRY_CURRENTNESS_GATE_ID =
  "scheduler-native-entry-currentness-gate-1206-1";
export const SCHEDULER_NATIVE_ENTRY_CURRENTNESS_GATE_STATUS =
  "blocked-public-scheduler-native-entry-compatibility-with-current-local-observations";
export const SCHEDULER_NATIVE_ENTRY_CURRENTNESS_VIOLATION_STATUS =
  "blocked-public-scheduler-native-entry-compatibility-with-currentness-violations";
export const SCHEDULER_NATIVE_ENTRY_CURRENTNESS_SOURCE_VARIANT_IDS =
  freezeArray([
    "scheduler-native-wrapper",
    "scheduler-cjs-native-development",
    "scheduler-cjs-native-production"
  ]);
export const SCHEDULER_NATIVE_ENTRY_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS =
  freezeArray([
    "compatibilityClaimed",
    "publicCompatibilityClaimed",
    "fastReactBehaviorCompatible",
    "fullDualRunOracleExists",
    "publicSchedulerTimingCompatibilityClaimed",
    "publicSchedulerFlushBehaviorExecuted",
    "publicSchedulerFlushExecutionAvailable",
    "publicRootSchedulerCompatibilityClaimed",
    "publicRootExecutionClaimed",
    "rootExecutionClaimed",
    "executesQueuedWork",
    "publicReactActCompatibilityClaimed",
    "publicActBehaviorClaimed",
    "reactActBehaviorClaimed",
    "publicNativeCompatibilityClaimed",
    "nativeCompatibilityClaimed",
    "nativeRuntimeCompatibilityClaimed",
    "nativeRuntimeExecutionClaimed",
    "nativeRuntimeExecution",
    "nativePublicBehaviorClaimed",
    "publicNativeExecutionClaimed",
    "publicNativeExecution",
    "publicPostTaskCompatibilityClaimed",
    "postTaskCompatibilityClaimed",
    "browserPostTaskCompatibilityClaimed",
    "browserTaskOrderingCompatibilityClaimed",
    "postTaskPublicBehaviorClaimed",
    "publicMockSchedulerCompatibilityClaimed",
    "mockSchedulerCompatibilityClaimed",
    "schedulerMockCompatibilityClaimed",
    "mockSchedulerPublicBehaviorClaimed",
    "publicPackageCompatibilityClaimed",
    "packageCompatibilityClaimed",
    "schedulerPackageCompatibilityClaimed",
    "packageSurfaceChanged",
    "newPublicExportsAdded",
    "publicDiagnosticExportAdded",
    "publicTimingAliasAccepted",
    "publicRootAliasAccepted",
    "publicActAliasAccepted",
    "publicPackageAliasAccepted",
    "publicNativeAliasAccepted",
    "publicPostTaskAliasAccepted",
    "publicMockAliasAccepted"
  ]);

export function stringifySchedulerNativeEntryOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedSchedulerNativeEntryOracle(
  baseUrl = import.meta.url
) {
  return JSON.parse(readCheckedSchedulerNativeEntryOracleText(baseUrl));
}

export function readCheckedSchedulerNativeEntryOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatSchedulerNativeEntryOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? {};
    const loadedFile =
      observations.nativeEntryLoading?.selectedNativeCjsFile ?? "missing";
    const directCjs = observations.directNativeCjsLoading?.probes ?? [];
    const directCjsLoaded = directCjs.filter(
      (probe) => probe.require.status === "ok"
    ).length;
    const fastReactStatuses = countStatuses(
      Object.values(oracle.fastReactComparisons?.[mode.id] ?? {})
    );

    return `- ${mode.id}: selected ${loadedFile}; direct native CJS ${directCjsLoaded}/${directCjs.length} loaded; Fast React comparisons ${JSON.stringify(fastReactStatuses)}`;
  });

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  const gapLines = oracle.intentionalGaps.map((gap) => `- ${gap}`);

  return [
    "# Scheduler Native Entry Oracle",
    "",
    "Generated from the exact scheduler@0.27.0 npm artifact and the current local scheduler implementation. This oracle records native entrypoint behavior and keeps broad Fast React scheduler compatibility claims false.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Intentional Gaps",
    "",
    ...gapLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findSchedulerNativeEntryObservation(oracle, modeId, scenarioId) {
  const key = scenarioObservationKey(scenarioId);
  const observation = oracle.observations[modeId]?.[key];
  if (!observation) {
    throw new Error(
      `Missing scheduler native entry observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findSchedulerNativeEntryResolution(oracle, modeId, specifier) {
  const observation = findSchedulerNativeEntryObservation(
    oracle,
    modeId,
    "native-file-surface"
  );
  const probe = observation.resolution.find(
    (candidate) => candidate.specifier === specifier
  );
  if (!probe) {
    throw new Error(
      `Missing scheduler native entry resolution: ${modeId}:${specifier}`
    );
  }
  return probe;
}

export function findSchedulerNativeEntryDirectCjsProbe(
  oracle,
  modeId,
  specifier
) {
  const observation = findSchedulerNativeEntryObservation(
    oracle,
    modeId,
    "direct-native-cjs-loading"
  );
  const probe = observation.probes.find(
    (candidate) => candidate.specifier === specifier
  );
  if (!probe) {
    throw new Error(
      `Missing scheduler native direct CJS probe: ${modeId}:${specifier}`
    );
  }
  return probe;
}

export function findFastReactSchedulerNativeEntryObservation(
  oracle,
  modeId,
  scenarioId
) {
  const key = scenarioObservationKey(scenarioId);
  const observation = oracle.fastReactObservations?.[modeId]?.[key];
  if (!observation) {
    throw new Error(
      `Missing Fast React scheduler native entry observation: ${modeId}:${scenarioId}`
    );
  }
  return observation;
}

export function findFastReactSchedulerNativeEntryComparison(
  oracle,
  modeId,
  scenarioId
) {
  const key = scenarioObservationKey(scenarioId);
  const comparison = oracle.fastReactComparisons?.[modeId]?.[key];
  if (!comparison) {
    throw new Error(
      `Missing Fast React scheduler native entry comparison: ${modeId}:${scenarioId}`
    );
  }
  return comparison;
}

export function evaluateSchedulerNativeEntryCurrentnessGate({
  oracle = readCheckedSchedulerNativeEntryOracle(),
  localObservationRows = null,
  sourceRows = null,
  sourceVariantCurrentnessGate = null,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const expectedVariantCurrentnessGate =
    evaluateSchedulerVariantCurrentnessGate();
  const effectiveSourceVariantCurrentnessGate =
    sourceVariantCurrentnessGate ?? expectedVariantCurrentnessGate;
  const effectiveLocalObservationRows =
    localObservationRows ??
    collectSchedulerNativeEntryCurrentnessRows({
      workspaceRoot
    });
  const expectedNativeSourceRows = nativeSourceRowsFromVariantGate(
    expectedVariantCurrentnessGate
  );
  const effectiveNativeSourceRows =
    sourceRows ??
    nativeSourceRowsFromVariantGate(effectiveSourceVariantCurrentnessGate);
  const blockedPublicClaims = falseRecord(
    SCHEDULER_NATIVE_ENTRY_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS
  );
  const sourceVariantCurrentnessContext = summarizeSourceVariantCurrentnessGate({
    effectiveGate: effectiveSourceVariantCurrentnessGate,
    expectedGate: expectedVariantCurrentnessGate
  });
  const violations = [];

  if (!schedulerNativeEntryOracleSchemaIsCurrent(oracle)) {
    violations.push(
      violation("scheduler-native-entry-currentness-stale-oracle-schema", {
        expectedSchemaVersion: 1,
        actualSchemaVersion: oracle?.schemaVersion ?? null,
        expectedOracleKind: "scheduler-0.27.0-native-entry-oracle",
        actualOracleKind: oracle?.oracleKind ?? null,
        expectedArtifactPath:
          "oracles/scheduler-0.27.0-native-entry-oracle.json",
        actualArtifactPath: SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH
      })
    );
  }

  if (!sourceVariantCurrentnessContext.acceptedAsPrivateContextOnly) {
    violations.push(
      violation(
        "scheduler-native-entry-currentness-variant-937-context-not-accepted",
        {
          gateId: sourceVariantCurrentnessContext.gateId,
          expectedGateId: sourceVariantCurrentnessContext.expectedGateId,
          status: sourceVariantCurrentnessContext.status,
          compatibilityClaimed:
            sourceVariantCurrentnessContext.compatibilityClaimed
        }
      )
    );
  }

  const sourceManifest = compareStringSets(
    SCHEDULER_NATIVE_ENTRY_CURRENTNESS_SOURCE_VARIANT_IDS,
    effectiveNativeSourceRows.map((row) => row.variantId)
  );
  if (
    sourceManifest.missing.length > 0 ||
    sourceManifest.unexpected.length > 0 ||
    sourceManifest.duplicates.length > 0
  ) {
    violations.push(
      violation("scheduler-native-entry-currentness-source-manifest-mismatch", {
        missingVariantIds: sourceManifest.missing,
        unexpectedVariantIds: sourceManifest.unexpected,
        duplicateVariantIds: sourceManifest.duplicates
      })
    );
  }

  const expectedSourceRowsByVariant = indexRowsByVariant(
    expectedNativeSourceRows
  );
  const sourceRowsByVariant = indexRowsByVariant(effectiveNativeSourceRows);
  const staleSourceRows = [];
  const nativeAliasRows = [];
  for (const variantId of SCHEDULER_NATIVE_ENTRY_CURRENTNESS_SOURCE_VARIANT_IDS) {
    const expected = expectedSourceRowsByVariant[variantId];
    const actual = sourceRowsByVariant[variantId];
    if (!expected || !actual) {
      continue;
    }

    const firstDifferencePath = findFirstDifferencePath(actual, expected);
    if (firstDifferencePath !== null) {
      staleSourceRows.push(
        freezeRecord({
          variantId,
          firstDifferencePath,
          expected,
          actual
        })
      );
    }

    if (!nativeSourceBoundaryMatches(actual, expected)) {
      nativeAliasRows.push(
        freezeRecord({
          variantId,
          expectedEntrypoint: expected.entrypoint,
          actualEntrypoint: actual.entrypoint ?? null,
          expectedPackagePath: expected.packagePath,
          actualPackagePath: actual.packagePath ?? null,
          expectedSourceFile: expected.sourceFile,
          actualSourceFile: actual.sourceFile ?? null,
          expectedDirectDeepCjsImport: expected.directDeepCjsImport,
          actualDirectDeepCjsImport: actual.directDeepCjsImport ?? null,
          classification: actual.classification ?? null
        })
      );
    }
  }

  pushRowsViolation(
    violations,
    "scheduler-native-entry-currentness-stale-source-row",
    staleSourceRows
  );
  pushRowsViolation(
    violations,
    "scheduler-native-entry-currentness-native-default-deep-cjs-alias",
    nativeAliasRows
  );

  const localRowsByKey = new Map(
    effectiveLocalObservationRows.map((row) => [rowKey(row), row])
  );
  const currentnessRows = [];
  const missingLocalObservationRowKeys = [];
  const missingCheckedOracleRowKeys = [];
  const modeMismatchRows = [];
  const behaviorEvidenceViolationRows = [];
  const localObservationMismatchRows = [];
  const checkedOracleMismatchRows = [];
  const comparisonClaimViolationRows = [];

  for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
    for (const scenarioId of SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS) {
      const expectedKey = `${mode.id}:${scenarioId}`;
      const localRow = localRowsByKey.get(expectedKey);
      if (!localRow) {
        missingLocalObservationRowKeys.push(expectedKey);
        currentnessRows.push(
          currentnessViolationRow({
            mode,
            scenarioId,
            status: "missing-current-local-native-entry-observation-row"
          })
        );
        continue;
      }

      const schedulerObservation = tryFindSchedulerNativeEntryObservation(
        oracle,
        mode.id,
        scenarioId
      );
      const checkedLocalObservation =
        tryFindFastReactSchedulerNativeEntryObservation(
          oracle,
          mode.id,
          scenarioId
        );
      const checkedComparison = tryFindFastReactSchedulerNativeEntryComparison(
        oracle,
        mode.id,
        scenarioId
      );
      if (!schedulerObservation || !checkedLocalObservation || !checkedComparison) {
        missingCheckedOracleRowKeys.push(expectedKey);
        currentnessRows.push(
          currentnessViolationRow({
            mode,
            scenarioId,
            status: "missing-checked-native-entry-oracle-row"
          })
        );
        continue;
      }

      const modeMatches =
        localRow.modeId === mode.id &&
        localRow.nodeEnv === mode.nodeEnv &&
        localRow.condition === mode.id;
      const behaviorEvidenceAllowed = isNativeEntryBehaviorEvidence(
        localRow.behaviorEvidence,
        scenarioId
      );
      const localFirstDifferencePath = findFirstDifferencePath(
        comparableNativeEntryObservation(localRow.observation, scenarioId),
        comparableNativeEntryObservation(checkedLocalObservation, scenarioId)
      );
      const checkedOracleFirstDifferencePath = findFirstDifferencePath(
        comparableNativeEntryObservation(checkedLocalObservation, scenarioId),
        comparableNativeEntryObservation(schedulerObservation, scenarioId)
      );
      const checkedComparisonStillBlocked =
        checkedComparison.status === "matched-but-compatibility-not-claimed" &&
        checkedComparison.compatibilityClaimed === false &&
        checkedComparison.firstDifferencePath === null;
      const rowCompatibilityClaimed =
        localRow.compatibilityClaimed !== false ||
        localRow.behaviorEvidence?.compatibilityClaimed !== false;
      let status = "current-local-native-entry-observation-matches-checked-oracle";

      if (!modeMatches) {
        modeMismatchRows.push(expectedKey);
        status = "mode-node-env-mismatch";
      } else if (!behaviorEvidenceAllowed) {
        behaviorEvidenceViolationRows.push(expectedKey);
        status = "native-entry-alias-or-public-behavior-evidence-used";
      } else if (localFirstDifferencePath !== null) {
        localObservationMismatchRows.push(expectedKey);
        status = "current-local-native-entry-observation-mismatch";
      } else if (checkedOracleFirstDifferencePath !== null) {
        checkedOracleMismatchRows.push(expectedKey);
        status = "checked-native-entry-oracle-row-mismatch";
      } else if (!checkedComparisonStillBlocked || rowCompatibilityClaimed) {
        comparisonClaimViolationRows.push(expectedKey);
        status = "compatibility-claim-detected";
      }

      currentnessRows.push(
        freezeRecord({
          rowId: expectedKey,
          modeId: mode.id,
          scenarioId,
          nodeEnv: localRow.nodeEnv,
          condition: localRow.condition,
          entrypoint: localRow.entrypoint,
          packageName: localRow.packageName,
          behaviorEvidence: freezeRecord(localRow.behaviorEvidence ?? {}),
          status,
          currentResultStatus: localRow.observation?.status ?? null,
          checkedLocalResultStatus: checkedLocalObservation?.status ?? null,
          checkedSchedulerResultStatus: schedulerObservation?.status ?? null,
          currentVsCheckedLocalFirstDifferencePath: localFirstDifferencePath,
          checkedLocalVsSchedulerFirstDifferencePath:
            checkedOracleFirstDifferencePath,
          checkedComparisonStatus: checkedComparison.status,
          compatibilityClaimed:
            rowCompatibilityClaimed ||
            checkedComparison.compatibilityClaimed !== false,
          observation: freezeRecord(localRow.observation ?? {})
        })
      );
    }
  }

  pushIdsViolation(
    violations,
    "scheduler-native-entry-currentness-missing-local-observation-row",
    missingLocalObservationRowKeys
  );
  pushIdsViolation(
    violations,
    "scheduler-native-entry-currentness-missing-checked-oracle-row",
    missingCheckedOracleRowKeys
  );
  pushIdsViolation(
    violations,
    "scheduler-native-entry-currentness-mode-node-env-mismatch",
    modeMismatchRows
  );
  pushIdsViolation(
    violations,
    "scheduler-native-entry-currentness-native-default-deep-cjs-evidence-used",
    behaviorEvidenceViolationRows
  );
  pushIdsViolation(
    violations,
    "scheduler-native-entry-currentness-local-observation-mismatch",
    localObservationMismatchRows
  );
  pushIdsViolation(
    violations,
    "scheduler-native-entry-currentness-checked-oracle-row-mismatch",
    checkedOracleMismatchRows
  );
  pushIdsViolation(
    violations,
    "scheduler-native-entry-currentness-row-compatibility-claim-detected",
    comparisonClaimViolationRows
  );

  const publicCompatibilityClaimIds = findPublicCompatibilityClaimIds({
    blockedPublicClaims,
    localObservationRows: effectiveLocalObservationRows,
    oracle,
    sourceRows: effectiveNativeSourceRows,
    sourceVariantCurrentnessGate: effectiveSourceVariantCurrentnessGate
  });
  pushIdsViolation(
    violations,
    "scheduler-native-entry-currentness-public-compatibility-claim-detected",
    publicCompatibilityClaimIds
  );

  const currentnessRowsMatched =
    currentnessRows.length ===
      SCHEDULER_NATIVE_ENTRY_PROBE_MODES.length *
        SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS.length &&
    currentnessRows.every(
      (row) =>
        row.status ===
        "current-local-native-entry-observation-matches-checked-oracle"
    );
  const sourceRowsCurrent =
    sourceManifest.missing.length === 0 &&
    sourceManifest.unexpected.length === 0 &&
    sourceManifest.duplicates.length === 0 &&
    staleSourceRows.length === 0 &&
    nativeAliasRows.length === 0;
  const blockedPublicClaimsRecognized =
    publicCompatibilityClaimIds.length === 0;
  const compatibilityClaimed =
    publicCompatibilityClaimIds.length > 0 ||
    currentnessRows.some((row) => row.compatibilityClaimed !== false) ||
    sourceVariantCurrentnessContext.compatibilityClaimed !== false;
  const passed =
    violations.length === 0 &&
    currentnessRowsMatched &&
    sourceRowsCurrent &&
    blockedPublicClaimsRecognized &&
    sourceVariantCurrentnessContext.acceptedAsPrivateContextOnly &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: SCHEDULER_NATIVE_ENTRY_CURRENTNESS_GATE_ID,
    status: passed
      ? SCHEDULER_NATIVE_ENTRY_CURRENTNESS_GATE_STATUS
      : SCHEDULER_NATIVE_ENTRY_CURRENTNESS_VIOLATION_STATUS,
    oracleArtifactPath: SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH,
    oracleKind: oracle?.oracleKind ?? null,
    schemaVersion: oracle?.schemaVersion ?? null,
    schedulerTarget: SCHEDULER_NATIVE_ENTRY_TARGET,
    fastReactTarget: SCHEDULER_NATIVE_ENTRY_FAST_REACT_TARGET,
    probeModes: SCHEDULER_NATIVE_ENTRY_PROBE_MODES,
    currentnessScenarioIds: SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS,
    sourceVariantIds: SCHEDULER_NATIVE_ENTRY_CURRENTNESS_SOURCE_VARIANT_IDS,
    blockedPublicClaims,
    blockedPublicClaimsRecognized,
    sourceRowsCurrent,
    currentnessRowsMatched,
    compatibilityClaimed,
    localObservationRows: freezeArray(effectiveLocalObservationRows),
    currentnessRows: freezeArray(currentnessRows),
    expectedSourceRows: freezeArray(expectedNativeSourceRows),
    sourceRows: freezeArray(effectiveNativeSourceRows),
    sourceRowsByVariant,
    sourceVariantCurrentnessContext,
    publicCompatibilityClaimIds,
    coverage: freezeRecord({
      nativeWrapper: true,
      directNativeCjsDevelopment: true,
      directNativeCjsProduction: true,
      nodeEnvFileSelection: true,
      nativeDefaultRelationship: true,
      nativeRuntimeDelegationObservedButCompatibilityBlocked: true,
      publicSchedulerTimingCompatibilityBlocked: true,
      rootActMockPostTaskPackageCompatibilityBlocked: true,
      genericPackageCompatibilityClaimSmugglingBlocked: true
    }),
    violations: freezeArray(violations)
  });
}

export function collectSchedulerNativeEntryCurrentnessRows({
  scenarioIds = SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const tempRoot = mkdtempSync(
    join(tmpdir(), "fast-react-scheduler-native-entry-currentness-")
  );

  try {
    const projectRoot = join(tempRoot, "scheduler-native-currentness-project");
    const nodeModulesRoot = join(projectRoot, "node_modules");
    const packageRoot = join(
      nodeModulesRoot,
      SCHEDULER_NATIVE_ENTRY_FAST_REACT_TARGET.packageName
    );
    mkdirSync(packageRoot, { recursive: true });
    copySchedulerPackageForCurrentness({ packageRoot, workspaceRoot });
    const probeFile = writeCurrentnessProbeFile(projectRoot);
    const scenarioOptions = {
      resolutionSpecifiers: SCHEDULER_NATIVE_ENTRY_RESOLUTION_SPECIFIERS,
      directCjsSpecifiers: SCHEDULER_NATIVE_ENTRY_DIRECT_CJS_SPECIFIERS
    };
    const rows = [];

    for (const mode of SCHEDULER_NATIVE_ENTRY_PROBE_MODES) {
      for (const scenarioId of scenarioIds) {
        const observation = runCurrentSchedulerNativeEntryProbe({
          mode,
          packageName: SCHEDULER_NATIVE_ENTRY_FAST_REACT_TARGET.packageName,
          probeFile,
          projectRoot,
          scenarioId,
          scenarioOptions
        });
        rows.push(
          freezeRecord({
            rowId: `${mode.id}:${scenarioId}`,
            modeId: mode.id,
            scenarioId,
            nodeEnv: mode.nodeEnv,
            condition: mode.id,
            entrypoint: "scheduler/index.native.js",
            packageName: "scheduler",
            packageSourcePath: "packages/scheduler",
            behaviorEvidence: createNativeEntryBehaviorEvidence(scenarioId),
            compatibilityClaimed: false,
            observation
          })
        );
      }
    }

    return freezeArray(rows);
  } finally {
    rmSync(tempRoot, { force: true, recursive: true });
  }
}

function copySchedulerPackageForCurrentness({ packageRoot, workspaceRoot }) {
  cpSync(join(workspaceRoot, "packages/scheduler"), packageRoot, {
    dereference: true,
    recursive: true,
    filter: (source) => basename(source) !== "node_modules"
  });
}

function writeCurrentnessProbeFile(projectRoot) {
  const probeFile = join(
    projectRoot,
    "scheduler-native-entry-probe-runner.mjs"
  );
  writeFileSync(
    probeFile,
    readFileSync(
      new URL("./scheduler-native-entry-probe-runner.mjs", import.meta.url),
      "utf8"
    ),
    "utf8"
  );
  return probeFile;
}

function runCurrentSchedulerNativeEntryProbe({
  mode,
  packageName,
  probeFile,
  projectRoot,
  scenarioId,
  scenarioOptions
}) {
  const spawnResult = spawnSync(
    process.execPath,
    [
      ...mode.nodeArgs,
      probeFile,
      packageName,
      scenarioId,
      JSON.stringify(scenarioOptions)
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: mode.nodeEnv
      },
      maxBuffer: 4 * 1024 * 1024,
      timeout: PROBE_TIMEOUT_MS
    }
  );

  if (spawnResult.error || spawnResult.status !== 0) {
    return freezeRecord({
      scenarioId,
      status: "throws",
      error: freezeRecord({
        name: spawnResult.error?.name ?? null,
        message:
          spawnResult.error?.message ??
          spawnResult.stderr?.trim() ??
          "Scheduler native-entry currentness probe failed",
        code: spawnResult.error?.code ?? null,
        exitStatus: spawnResult.status
      }),
      consoleCalls: freezeArray([])
    });
  }

  try {
    return normalizeErrorMessages(JSON.parse(spawnResult.stdout));
  } catch (error) {
    return freezeRecord({
      scenarioId,
      status: "throws",
      error: freezeRecord({
        name: error?.name ?? null,
        message: error?.message ?? null,
        code: error?.code ?? null
      }),
      consoleCalls: freezeArray([])
    });
  }
}

function createNativeEntryBehaviorEvidence(scenarioId) {
  const directNativeCjsImport = scenarioId === "direct-native-cjs-loading";
  return freezeRecord({
    behaviorEvidenceKind: "current-local-scheduler-native-entry-probe",
    entrypoint: directNativeCjsImport
      ? "scheduler/cjs/scheduler.native.*.js"
      : "scheduler/index.native.js",
    scenarioId,
    packageName: "scheduler",
    packageSourcePath: "packages/scheduler",
    directNativeCjsImport,
    nativeEntryWrapperEvidence: !directNativeCjsImport,
    directNativeCjsEvidence: directNativeCjsImport,
    defaultEntrypointRelationshipObserved: false,
    defaultEntrypointCompatibilityClaimed: false,
    rootEntryEvidenceClaimed: false,
    rootExecutionClaimed: false,
    mockSchedulerPublicBehaviorClaimed: false,
    postTaskPublicBehaviorClaimed: false,
    nativeRuntimeExecutionClaimed: false,
    nativeRuntimeCompatibilityClaimed: false,
    nativePublicBehaviorClaimed: false,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicNativeCompatibilityClaimed: false,
    publicMockSchedulerCompatibilityClaimed: false,
    publicPostTaskCompatibilityClaimed: false,
    publicPackageCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    compatibilityClaimed: false
  });
}

function nativeSourceRowsFromVariantGate(gate) {
  return freezeArray(
    (gate?.sourceRows ?? [])
      .filter((row) =>
        SCHEDULER_NATIVE_ENTRY_CURRENTNESS_SOURCE_VARIANT_IDS.includes(
          row.variantId
        )
      )
      .map((row) => freezeNativeSourceRow(row))
  );
}

function freezeNativeSourceRow(row) {
  return freezeRecord({
    rowId: row.rowId,
    rowKind: row.rowKind,
    variantId: row.variantId,
    classification: row.classification,
    rootNativeMockPostTaskClassification:
      row.rootNativeMockPostTaskClassification,
    variantFamily: row.variantFamily,
    entrypoint: row.entrypoint,
    canonicalEntrypoint: row.canonicalEntrypoint,
    packagePath: row.packagePath,
    deepCjsPath: row.deepCjsPath,
    sourceFile: row.sourceFile,
    physicalEntrypoint: row.physicalEntrypoint,
    directDeepCjsImport: row.directDeepCjsImport,
    boundaryKind: row.boundaryKind,
    modeId: row.modeId,
    nodeEnv: row.nodeEnv,
    runtimeMode: row.runtimeMode,
    sourceKind: row.sourceKind,
    packageName: row.packageName,
    packageVersion: row.packageVersion,
    compatibilityTarget: row.compatibilityTarget,
    sourceSha256: row.sourceSha256,
    declaredLicenseFile: row.declaredLicenseFile,
    wrapperTargets: freezeArray(row.wrapperTargets ?? []),
    diagnosticEntrypoints: freezeArray(row.diagnosticEntrypoints ?? []),
    diagnosticCompatibilityTargets: freezeArray(
      row.diagnosticCompatibilityTargets ?? []
    ),
    sourceDiagnosticIds: freezeArray(row.sourceDiagnosticIds ?? []),
    sourceDiagnosticStatuses: freezeArray(row.sourceDiagnosticStatuses ?? []),
    diagnosticExportNames: freezeArray(row.diagnosticExportNames ?? []),
    diagnosticSymbolOrSourceIds: freezeArray(
      row.diagnosticSymbolOrSourceIds ?? []
    ),
    hasPrivateDiagnostics: row.hasPrivateDiagnostics,
    readError: row.readError,
    evidenceScope: freezeRecord(row.evidenceScope ?? {}),
    publicBlockerClaims: freezeRecord(row.publicBlockerClaims ?? {}),
    compatibilityClaimed: row.compatibilityClaimed
  });
}

function summarizeSourceVariantCurrentnessGate({ effectiveGate, expectedGate }) {
  return freezeRecord({
    gateId: effectiveGate?.gateId ?? null,
    expectedGateId: SCHEDULER_VARIANT_CURRENTNESS_GATE_ID,
    status: effectiveGate?.status ?? null,
    expectedStatus: SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS,
    role: "private-scheduler-variant-currentness-context-only",
    acceptedAsPrivateContextOnly:
      effectiveGate === expectedGate &&
      effectiveGate?.gateId === SCHEDULER_VARIANT_CURRENTNESS_GATE_ID &&
      effectiveGate?.status === SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS &&
      effectiveGate?.compatibilityClaimed === false &&
      effectiveGate?.sourceReportSourceProofRecognized === true &&
      effectiveGate?.privateVariantBoundaryContext
        ?.acceptedAsPrivateContextOnly === true,
    compatibilityClaimed: effectiveGate?.compatibilityClaimed ?? null,
    sourceReportSourceProofRecognized:
      effectiveGate?.sourceReportSourceProofRecognized ?? false,
    privateVariantBoundaryAccepted:
      effectiveGate?.privateVariantBoundaryContext
        ?.acceptedAsPrivateContextOnly ?? false,
    behaviorEvidenceUsed: false,
    nativeRuntimeExecutionAllowed: false,
    publicSchedulerTimingCompatibilityAllowed: false,
    publicNativeCompatibilityAllowed: false,
    packageCompatibilityAllowed: false
  });
}

function schedulerNativeEntryOracleSchemaIsCurrent(oracle) {
  return (
    oracle?.schemaVersion === 1 &&
    oracle?.oracleKind === "scheduler-0.27.0-native-entry-oracle" &&
    oracle?.generatedArtifacts === true &&
    oracle?.deterministic === true &&
    SCHEDULER_NATIVE_ENTRY_ORACLE_ARTIFACT_PATH ===
      "oracles/scheduler-0.27.0-native-entry-oracle.json" &&
    sameStringArray(
      oracle?.probeModes?.map((mode) => mode.id) ?? [],
      SCHEDULER_NATIVE_ENTRY_PROBE_MODES.map((mode) => mode.id)
    ) &&
    sameStringArray(
      oracle?.scenarios?.map((scenario) => scenario.id) ?? [],
      SCHEDULER_NATIVE_ENTRY_SCENARIO_IDS
    )
  );
}

function nativeSourceBoundaryMatches(actual, expected) {
  return (
    actual?.classification === "native" &&
    actual?.rootNativeMockPostTaskClassification === "native" &&
    actual?.variantFamily === "native" &&
    actual?.entrypoint === expected.entrypoint &&
    actual?.canonicalEntrypoint === expected.canonicalEntrypoint &&
    actual?.packagePath === expected.packagePath &&
    actual?.deepCjsPath === expected.deepCjsPath &&
    actual?.sourceFile === expected.sourceFile &&
    actual?.physicalEntrypoint === expected.physicalEntrypoint &&
    actual?.directDeepCjsImport === expected.directDeepCjsImport &&
    actual?.boundaryKind === expected.boundaryKind &&
    actual?.packageName === "scheduler" &&
    actual?.compatibilityTarget === "scheduler@0.27.0" &&
    actual?.evidenceScope?.rootEntryEvidenceAcceptedForVariant === false &&
    actual?.evidenceScope?.variantEvidenceAcceptedForRootBehavior === false &&
    actual?.evidenceScope?.behaviorEvidenceClaimed === false &&
    actual?.evidenceScope?.rootBehaviorEvidenceClaimed === false &&
    actual?.evidenceScope?.variantBehaviorEvidenceClaimed === false &&
    actual?.evidenceScope?.packageCompatibilityClaimed === false
  );
}

function isNativeEntryBehaviorEvidence(evidence, scenarioId) {
  const directNativeCjsImport = scenarioId === "direct-native-cjs-loading";
  const expectedEntrypoint = directNativeCjsImport
    ? "scheduler/cjs/scheduler.native.*.js"
    : "scheduler/index.native.js";
  return (
    evidence?.behaviorEvidenceKind ===
      "current-local-scheduler-native-entry-probe" &&
    evidence?.entrypoint === expectedEntrypoint &&
    evidence?.scenarioId === scenarioId &&
    evidence?.packageName === "scheduler" &&
    evidence?.packageSourcePath === "packages/scheduler" &&
    evidence?.directNativeCjsImport === directNativeCjsImport &&
    evidence?.nativeEntryWrapperEvidence === !directNativeCjsImport &&
    evidence?.directNativeCjsEvidence === directNativeCjsImport &&
    evidence?.defaultEntrypointRelationshipObserved === false &&
    evidence?.defaultEntrypointCompatibilityClaimed === false &&
    evidence?.rootEntryEvidenceClaimed === false &&
    evidence?.rootExecutionClaimed === false &&
    evidence?.mockSchedulerPublicBehaviorClaimed === false &&
    evidence?.postTaskPublicBehaviorClaimed === false &&
    evidence?.nativeRuntimeExecutionClaimed === false &&
    evidence?.nativeRuntimeCompatibilityClaimed === false &&
    evidence?.nativePublicBehaviorClaimed === false &&
    evidence?.publicSchedulerTimingCompatibilityClaimed === false &&
    evidence?.publicRootSchedulerCompatibilityClaimed === false &&
    evidence?.publicReactActCompatibilityClaimed === false &&
    evidence?.publicNativeCompatibilityClaimed === false &&
    evidence?.publicMockSchedulerCompatibilityClaimed === false &&
    evidence?.publicPostTaskCompatibilityClaimed === false &&
    evidence?.publicPackageCompatibilityClaimed === false &&
    evidence?.packageCompatibilityClaimed === false &&
    evidence?.compatibilityClaimed === false
  );
}

function tryFindSchedulerNativeEntryObservation(oracle, modeId, scenarioId) {
  try {
    return findSchedulerNativeEntryObservation(oracle, modeId, scenarioId);
  } catch {
    return null;
  }
}

function tryFindFastReactSchedulerNativeEntryObservation(
  oracle,
  modeId,
  scenarioId
) {
  try {
    return findFastReactSchedulerNativeEntryObservation(
      oracle,
      modeId,
      scenarioId
    );
  } catch {
    return null;
  }
}

function tryFindFastReactSchedulerNativeEntryComparison(
  oracle,
  modeId,
  scenarioId
) {
  try {
    return findFastReactSchedulerNativeEntryComparison(
      oracle,
      modeId,
      scenarioId
    );
  } catch {
    return null;
  }
}

function comparableNativeEntryObservation(observation, scenarioId) {
  const comparable = cloneJson(observation);
  if (scenarioId === "native-file-surface" && comparable) {
    delete comparable.packageJson;
  }
  return comparable;
}

function currentnessViolationRow({ mode, scenarioId, status }) {
  return freezeRecord({
    rowId: `${mode.id}:${scenarioId}`,
    modeId: mode.id,
    scenarioId,
    nodeEnv: mode.nodeEnv,
    condition: mode.id,
    entrypoint: "scheduler/index.native.js",
    packageName: "scheduler",
    behaviorEvidence: createNativeEntryBehaviorEvidence(scenarioId),
    status,
    currentResultStatus: null,
    checkedLocalResultStatus: null,
    checkedSchedulerResultStatus: null,
    currentVsCheckedLocalFirstDifferencePath: "$",
    checkedLocalVsSchedulerFirstDifferencePath: null,
    checkedComparisonStatus: null,
    compatibilityClaimed: false,
    observation: null
  });
}

function findPublicCompatibilityClaimIds({
  blockedPublicClaims,
  localObservationRows,
  oracle,
  sourceRows,
  sourceVariantCurrentnessGate
}) {
  const claimIds = [];
  const seen = new WeakSet();
  collectPublicClaimIds(
    blockedPublicClaims,
    "blockedPublicClaims",
    claimIds,
    seen
  );
  collectPublicClaimIds(oracle, "oracle", claimIds, seen);
  collectPublicClaimIds(
    localObservationRows,
    "localObservationRows",
    claimIds,
    seen
  );
  collectPublicClaimIds(sourceRows, "sourceRows", claimIds, seen);
  collectPublicClaimIds(
    sourceVariantCurrentnessGate,
    "sourceVariantCurrentnessGate",
    claimIds,
    seen
  );
  return freezeArray(claimIds);
}

function collectPublicClaimIds(value, path, claimIds, seen) {
  if (value === null || typeof value !== "object") {
    return;
  }
  if (seen.has(value)) {
    return;
  }
  seen.add(value);

  for (const key of Reflect.ownKeys(value)) {
    const keyPath =
      typeof key === "symbol" ? `${path}[${String(key)}]` : `${path}.${key}`;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor) {
      continue;
    }

    const claimKey =
      typeof key === "string" && isBlockedPublicClaimKey(key);
    if (!Object.prototype.hasOwnProperty.call(descriptor, "value")) {
      if (claimKey) {
        claimIds.push(keyPath);
      }
      continue;
    }

    const child = descriptor.value;
    if (claimKey && child !== false) {
      claimIds.push(keyPath);
    }
    collectPublicClaimIds(child, keyPath, claimIds, seen);
  }
}

function isBlockedPublicClaimKey(key) {
  if (
    [
      "blockedPublicClaims",
      "publicBlockerClaims",
      "publicCompatibilityClaimIds"
    ].includes(key)
  ) {
    return false;
  }
  if (SCHEDULER_NATIVE_ENTRY_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS.includes(key)) {
    return true;
  }
  if (
    key === "sourceGateCompatibilityClaimed" ||
    key === "behaviorCompatibilityClaimed"
  ) {
    return true;
  }
  if (/^public[A-Z]/u.test(key)) {
    return !/Blocked$/u.test(key);
  }
  if (
    /(?:CompatibilityClaimed|BehaviorClaimed|ExecutionClaimed|Ready|Available|Executed)$/u.test(
      key
    )
  ) {
    return /(?:scheduler|timing|root|act|native|postTask|mock|package|renderer|effect|browser)/iu.test(
      key
    );
  }
  return /^(?:packageSurfaceChanged|newPublicExportsAdded|nativeRuntimeExecution|nativeRuntimeExecutionClaimed)$/u.test(
    key
  );
}

function normalizeErrorMessages(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeErrorMessages);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return freezeRecord(
    Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        key === "message" && typeof child === "string"
          ? normalizePathFragments(child)
          : normalizeErrorMessages(child)
      ])
    )
  );
}

function normalizePathFragments(message) {
  return message
    .replace(/file:\/\/[^\s)]+/gu, "file://<path>")
    .replace(/(?:\/private\/var|\/var\/folders|\/tmp)\/[^\s)]+/gu, "<path>");
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function indexRowsByVariant(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((row) => [row.variantId, row]))
  );
}

function compareStringSets(expected, actual) {
  return freezeRecord({
    missing: freezeArray(expected.filter((value) => !actual.includes(value))),
    unexpected: freezeArray(actual.filter((value) => !expected.includes(value))),
    duplicates: freezeArray(
      actual.filter((value, index) => actual.indexOf(value) !== index)
    )
  });
}

function findFirstDifferencePath(left, right, path = "$") {
  if (Object.is(left, right)) {
    return null;
  }

  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return path;
  }

  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  if (leftIsArray !== rightIsArray) {
    return path;
  }

  if (leftIsArray) {
    if (left.length !== right.length) {
      return `${path}.length`;
    }
    for (let index = 0; index < left.length; index += 1) {
      const childPath = findFirstDifferencePath(
        left[index],
        right[index],
        `${path}[${index}]`
      );
      if (childPath) {
        return childPath;
      }
    }
    return null;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return `${path}.keys`;
  }
  for (let index = 0; index < leftKeys.length; index += 1) {
    if (leftKeys[index] !== rightKeys[index]) {
      return `${path}.keys[${index}]`;
    }
  }
  for (const key of leftKeys) {
    const childPath = findFirstDifferencePath(
      left[key],
      right[key],
      `${path}.${key}`
    );
    if (childPath) {
      return childPath;
    }
  }
  return null;
}

function rowKey(row) {
  return `${row.modeId}:${row.scenarioId}`;
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(violation(id, { rows: freezeArray(rows) }));
  }
}

function pushIdsViolation(violations, id, rowIds) {
  if (rowIds.length > 0) {
    violations.push(violation(id, { rowIds: freezeArray(rowIds) }));
  }
}

function violation(id, fields = {}) {
  return freezeRecord({
    id,
    ...fields
  });
}

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function countStatuses(comparisons) {
  const counts = {};
  for (const comparison of comparisons) {
    counts[comparison.status] = (counts[comparison.status] ?? 0) + 1;
  }
  return counts;
}

function scenarioObservationKey(scenarioId) {
  return scenarioId.replace(/-([a-z])/gu, (_, letter) => letter.toUpperCase());
}

function sameStringArray(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze({ ...record });
}
