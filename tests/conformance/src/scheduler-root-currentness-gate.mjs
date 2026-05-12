import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PRIVATE_ADMISSION_886_GATE_STATUS,
  evaluatePrivateAdmission886Gate
} from "./private-admission-886-scheduler-variant-boundary-ledger.mjs";
import {
  findFastReactSchedulerRootComparison,
  findFastReactSchedulerRootObservation,
  findSchedulerRootObservation,
  readCheckedSchedulerRootOracle
} from "./scheduler-root-oracle.mjs";
import { SCHEDULER_ROOT_SCENARIO_IDS } from "./scheduler-root-scenarios.mjs";
import {
  SCHEDULER_ROOT_FAST_REACT_TARGET,
  SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH,
  SCHEDULER_ROOT_PROBE_MODES,
  SCHEDULER_ROOT_TARGET
} from "./scheduler-root-targets.mjs";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);
const PROBE_TIMEOUT_MS = 15_000;

export const SCHEDULER_ROOT_CURRENTNESS_GATE_ID =
  "scheduler-root-currentness-gate-914-1";
export const SCHEDULER_ROOT_CURRENTNESS_GATE_STATUS =
  "blocked-public-scheduler-compatibility-with-current-local-root-observations";
export const SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS =
  "blocked-public-scheduler-compatibility-with-currentness-violations";

export const SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS = Object.freeze([
  "scheduler-root-export-shape",
  "scheduler-root-task-object-shape",
  "scheduler-root-priority-ordering",
  "scheduler-root-equal-priority-fifo",
  "scheduler-root-delayed-callbacks",
  "scheduler-root-cancellation",
  "scheduler-root-continuations",
  "scheduler-root-did-timeout",
  "scheduler-root-priority-context",
  "scheduler-root-yield-paint-frame-rate",
  "scheduler-root-node-host-transport"
]);

export const SCHEDULER_ROOT_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS =
  Object.freeze([
    "publicSchedulerTimingCompatibilityClaimed",
    "publicRootSchedulerCompatibilityClaimed",
    "publicReactActCompatibilityClaimed",
    "publicNativeCompatibilityClaimed",
    "publicPostTaskCompatibilityClaimed",
    "publicMockSchedulerCompatibilityClaimed",
    "publicPackageCompatibilityClaimed",
    "nativeRuntimeExecutionClaimed",
    "nativePublicBehaviorClaimed",
    "postTaskPublicBehaviorClaimed",
    "mockSchedulerPublicBehaviorClaimed",
    "rootExecutionClaimed",
    "actBehaviorClaimed",
    "packageCompatibilityClaimed"
  ]);

export const SCHEDULER_ROOT_CURRENTNESS_SOURCE_ROW_DEFINITIONS =
  Object.freeze([
    Object.freeze({
      rowId: "scheduler-root-wrapper-source",
      entrypoint: "scheduler",
      sourcePath: "packages/scheduler/index.js",
      sourceRole: "public-root-wrapper",
      behaviorEvidenceAllowed: true,
      requiredTokens: Object.freeze([
        "scheduler.production.js",
        "scheduler.development.js"
      ])
    }),
    Object.freeze({
      rowId: "scheduler-root-development-cjs-source-context",
      entrypoint: "scheduler",
      sourcePath: "packages/scheduler/cjs/scheduler.development.js",
      sourceRole: "mode-selected-cjs-context-only",
      behaviorEvidenceAllowed: false,
      modeId: "default-node-development",
      requiredTokens: Object.freeze(["scheduler.development.js"])
    }),
    Object.freeze({
      rowId: "scheduler-root-production-cjs-source-context",
      entrypoint: "scheduler",
      sourcePath: "packages/scheduler/cjs/scheduler.production.js",
      sourceRole: "mode-selected-cjs-context-only",
      behaviorEvidenceAllowed: false,
      modeId: "default-node-production",
      requiredTokens: Object.freeze(["scheduler.production.js"])
    })
  ]);

export const SCHEDULER_ROOT_CURRENTNESS_BEHAVIOR_EVIDENCE =
  Object.freeze({
    behaviorEvidenceKind: "current-local-root-probe",
    entrypoint: "scheduler",
    sourcePath: "packages/scheduler/index.js",
    directDeepCjsImport: false,
    variantBoundaryEvidence: false,
    privateAdmission886Evidence: false,
    compatibilityClaimed: false
  });

export function evaluateSchedulerRootCurrentnessGate({
  oracle = readCheckedSchedulerRootOracle(),
  localObservationRows = null,
  privateVariantBoundaryGate = null,
  sourceRows = null,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const effectiveLocalObservationRows =
    localObservationRows ??
    collectSchedulerRootCurrentnessRows({
      workspaceRoot
    });
  const effectiveSourceRows =
    sourceRows ??
    inspectSchedulerRootCurrentnessSourceRows({
      workspaceRoot
    });
  const effectivePrivateVariantBoundaryGate =
    privateVariantBoundaryGate ??
    evaluatePrivateAdmission886Gate({
      workspaceRoot
    });
  const blockedPublicClaims = falseRecord(
    SCHEDULER_ROOT_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS
  );
  const privateVariantBoundaryContext = summarizePrivateVariantBoundaryGate(
    effectivePrivateVariantBoundaryGate
  );
  const violations = [];

  if (!schedulerRootOracleSchemaIsCurrent(oracle)) {
    violations.push(
      violation("scheduler-root-currentness-stale-oracle-schema", {
        expectedSchemaVersion: 1,
        actualSchemaVersion: oracle?.schemaVersion ?? null,
        expectedOracleKind: "scheduler-0.27.0-root-oracle",
        actualOracleKind: oracle?.oracleKind ?? null,
        expectedArtifactPath: "oracles/scheduler-0.27.0-root-oracle.json",
        actualArtifactPath: SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH
      })
    );
  }

  const sourceScenarioManifest = compareStringSets(
    SCHEDULER_ROOT_SCENARIO_IDS,
    SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS
  );
  const checkedOracleScenarioManifest = compareStringSets(
    Array.isArray(oracle?.scenarios)
      ? oracle.scenarios.map((scenario) => scenario.id)
      : [],
    SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS
  );
  const missingCurrentnessScenarioIds = uniqueStrings([
    ...sourceScenarioManifest.missing,
    ...checkedOracleScenarioManifest.missing
  ]);
  const unexpectedCurrentnessScenarioIds = uniqueStrings([
    ...sourceScenarioManifest.unexpected,
    ...checkedOracleScenarioManifest.unexpected
  ]);
  if (
    missingCurrentnessScenarioIds.length > 0 ||
    unexpectedCurrentnessScenarioIds.length > 0
  ) {
    violations.push(
      violation("scheduler-root-currentness-scenario-manifest-mismatch", {
        missingScenarioIds: missingCurrentnessScenarioIds,
        unexpectedScenarioIds: unexpectedCurrentnessScenarioIds
      })
    );
  }

  const expectedSourceRowIds =
    SCHEDULER_ROOT_CURRENTNESS_SOURCE_ROW_DEFINITIONS.map(
      (definition) => definition.rowId
    );
  const sourceRowManifest = compareStringSets(
    expectedSourceRowIds,
    effectiveSourceRows.map((row) => row.rowId)
  );
  const sourceRowManifestViolates =
    sourceRowManifest.missing.length > 0 ||
    sourceRowManifest.unexpected.length > 0 ||
    sourceRowManifest.duplicates.length > 0;
  if (sourceRowManifestViolates) {
    violations.push(
      violation("scheduler-root-currentness-source-row-manifest-mismatch", {
        missingRowIds: sourceRowManifest.missing,
        unexpectedRowIds: sourceRowManifest.unexpected,
        duplicateRowIds: sourceRowManifest.duplicates
      })
    );
  }

  const sourceRowsById = new Map(
    effectiveSourceRows.map((row) => [row.rowId, row])
  );
  const sourceRowIdentityMismatchRows =
    SCHEDULER_ROOT_CURRENTNESS_SOURCE_ROW_DEFINITIONS
      .filter((definition) => sourceRowsById.has(definition.rowId))
      .filter(
        (definition) =>
          !sourceRowMatchesDefinition(
            sourceRowsById.get(definition.rowId),
            definition
          )
      )
      .map((definition) => definition.rowId);
  pushIdsViolation(
    violations,
    "scheduler-root-currentness-source-row-identity-mismatch",
    sourceRowIdentityMismatchRows
  );

  const sourceRowViolations = effectiveSourceRows.filter(
    (row) => row.status !== "current-source-row-present"
  );
  if (sourceRowViolations.length > 0) {
    violations.push(
      violation("scheduler-root-currentness-source-row-missing-or-stale", {
        rowIds: sourceRowViolations.map((row) => row.rowId)
      })
    );
  }

  if (!privateVariantBoundaryContext.acceptedAsPrivateContextOnly) {
    violations.push(
      violation("scheduler-root-currentness-private-886-context-not-accepted", {
        status: privateVariantBoundaryContext.status,
        compatibilityClaimed: privateVariantBoundaryContext.compatibilityClaimed
      })
    );
  }

  const expectedLocalObservationRowKeys =
    collectExpectedSchedulerRootCurrentnessRowKeys();
  const localObservationManifest = compareStringSets(
    expectedLocalObservationRowKeys,
    effectiveLocalObservationRows.map((row) => row.rowId)
  );
  if (
    localObservationManifest.missing.length > 0 ||
    localObservationManifest.unexpected.length > 0 ||
    localObservationManifest.duplicates.length > 0
  ) {
    violations.push(
      violation("scheduler-root-currentness-local-observation-manifest-mismatch", {
        missingRowIds: localObservationManifest.missing,
        unexpectedRowIds: localObservationManifest.unexpected,
        duplicateRowIds: localObservationManifest.duplicates
      })
    );
  }

  const localRowsByKey = new Map(
    effectiveLocalObservationRows.map((row) => [rowKey(row), row])
  );
  const currentnessRows = [];
  const missingLocalObservationRowKeys = [];
  const modeMismatchRows = [];
  const behaviorEvidenceViolationRows = [];
  const localObservationMismatchRows = [];
  const missingCheckedOracleRowKeys = [];
  const checkedOracleMismatchRows = [];
  const comparisonClaimViolationRows = [];

  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    for (const scenarioId of SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS) {
      const expectedKey = `${mode.id}:${scenarioId}`;
      const localRow = localRowsByKey.get(expectedKey);
      if (!localRow) {
        missingLocalObservationRowKeys.push(expectedKey);
        currentnessRows.push(
          currentnessViolationRow({
            mode,
            scenarioId,
            status: "missing-current-local-observation-row"
          })
        );
        continue;
      }

      const schedulerObservation = tryFindSchedulerRootObservation(
        oracle,
        mode.id,
        scenarioId
      );
      const checkedLocalObservation =
        tryFindFastReactSchedulerRootObservation(oracle, mode.id, scenarioId);
      const checkedComparison = tryFindFastReactSchedulerRootComparison(
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
            status: "missing-checked-oracle-observation-row"
          })
        );
        continue;
      }

      const modeMatches =
        localRow.modeId === mode.id &&
        localRow.nodeEnv === mode.nodeEnv &&
        localRow.condition === mode.condition;
      const localFirstDifferencePath = findFirstDifferencePath(
        comparableObservation(localRow.observation),
        comparableObservation(checkedLocalObservation.result)
      );
      const checkedOracleFirstDifferencePath = findFirstDifferencePath(
        comparableObservation(checkedLocalObservation.result),
        comparableObservation(schedulerObservation.result)
      );
      const behaviorEvidenceAllowed = isPublicRootBehaviorEvidence(
        localRow.behaviorEvidence
      );
      const checkedComparisonStillBlocked =
        checkedComparison.status === "matched-but-compatibility-not-claimed" &&
        checkedComparison.compatibilityClaimed === false &&
        checkedComparison.firstDifferencePath === null;
      const rowCompatibilityClaimed =
        objectHasPublicClaim(localRow) ||
        objectHasPublicClaim(localRow.behaviorEvidence);
      let status = "current-local-root-observation-matches-checked-oracle";

      if (!modeMatches) {
        modeMismatchRows.push(expectedKey);
        status = "mode-node-env-mismatch";
      } else if (!behaviorEvidenceAllowed) {
        behaviorEvidenceViolationRows.push(expectedKey);
        status = "non-root-or-private-variant-evidence-used";
      } else if (localFirstDifferencePath !== null) {
        localObservationMismatchRows.push(expectedKey);
        status = "current-local-observation-mismatch";
      } else if (checkedOracleFirstDifferencePath !== null) {
        checkedOracleMismatchRows.push(expectedKey);
        status = "checked-local-oracle-row-mismatch";
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
          behaviorEvidence: freezeRecord(localRow.behaviorEvidence),
          status,
          currentResultStatus: localRow.observation?.result?.status ?? null,
          checkedLocalResultStatus:
            checkedLocalObservation.result?.result?.status ?? null,
          checkedSchedulerResultStatus:
            schedulerObservation.result?.result?.status ?? null,
          currentVsCheckedLocalFirstDifferencePath: localFirstDifferencePath,
          checkedLocalVsSchedulerFirstDifferencePath:
            checkedOracleFirstDifferencePath,
          checkedComparisonStatus: checkedComparison.status,
          compatibilityClaimed:
            rowCompatibilityClaimed ||
            checkedComparison.compatibilityClaimed !== false,
          observation: freezeRecord(localRow.observation)
        })
      );
    }
  }

  pushIdsViolation(
    violations,
    "scheduler-root-currentness-missing-local-observation-row",
    missingLocalObservationRowKeys
  );
  pushIdsViolation(
    violations,
    "scheduler-root-currentness-mode-node-env-mismatch",
    modeMismatchRows
  );
  pushIdsViolation(
    violations,
    "scheduler-root-currentness-variant-or-deep-cjs-evidence-used",
    behaviorEvidenceViolationRows
  );
  pushIdsViolation(
    violations,
    "scheduler-root-currentness-local-observation-mismatch",
    localObservationMismatchRows
  );
  pushIdsViolation(
    violations,
    "scheduler-root-currentness-missing-checked-oracle-row",
    missingCheckedOracleRowKeys
  );
  pushIdsViolation(
    violations,
    "scheduler-root-currentness-checked-oracle-row-mismatch",
    checkedOracleMismatchRows
  );
  pushIdsViolation(
    violations,
    "scheduler-root-currentness-row-compatibility-claim-detected",
    comparisonClaimViolationRows
  );

  const publicCompatibilityClaimIds = findPublicCompatibilityClaimIds({
    blockedPublicClaims,
    localObservationRows: effectiveLocalObservationRows,
    oracle
  });
  pushIdsViolation(
    violations,
    "scheduler-root-currentness-public-compatibility-claim-detected",
    publicCompatibilityClaimIds
  );

  const currentnessRowsMatched =
    currentnessRows.length ===
      SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS.length *
        SCHEDULER_ROOT_PROBE_MODES.length &&
    currentnessRows.every(
      (row) =>
        row.status === "current-local-root-observation-matches-checked-oracle"
    );
  const blockedPublicClaimsRecognized =
    publicCompatibilityClaimIds.length === 0;
  const sourceRowsCurrent =
    sourceRowViolations.length === 0 &&
    !sourceRowManifestViolates &&
    sourceRowIdentityMismatchRows.length === 0;
  const acceptedPrivateVariantBoundaryContext =
    privateVariantBoundaryContext.acceptedAsPrivateContextOnly;
  const compatibilityClaimed =
    publicCompatibilityClaimIds.length > 0 ||
    currentnessRows.some((row) => row.compatibilityClaimed !== false);
  const passed =
    violations.length === 0 &&
    currentnessRowsMatched &&
    blockedPublicClaimsRecognized &&
    sourceRowsCurrent &&
    acceptedPrivateVariantBoundaryContext &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: SCHEDULER_ROOT_CURRENTNESS_GATE_ID,
    status: passed
      ? SCHEDULER_ROOT_CURRENTNESS_GATE_STATUS
      : SCHEDULER_ROOT_CURRENTNESS_VIOLATION_STATUS,
    oracleArtifactPath: SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH,
    oracleKind: oracle?.oracleKind ?? null,
    schemaVersion: oracle?.schemaVersion ?? null,
    schedulerTarget: SCHEDULER_ROOT_TARGET,
    fastReactTarget: SCHEDULER_ROOT_FAST_REACT_TARGET,
    probeModes: SCHEDULER_ROOT_PROBE_MODES,
    currentnessScenarioIds: SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS,
    blockedPublicClaims,
    blockedPublicClaimsRecognized,
    sourceRowsCurrent,
    acceptedPrivateVariantBoundaryContext,
    compatibilityClaimed,
    currentnessRowsMatched,
    localObservationRows: freezeArray(effectiveLocalObservationRows),
    currentnessRows: freezeArray(currentnessRows),
    sourceRows: freezeArray(effectiveSourceRows),
    privateVariantBoundaryContext,
    coverage: freezeRecord({
      exportShape: true,
      priorityOrdering: true,
      equalPriorityFifo: true,
      delayedCallbacks: true,
      cancellation: true,
      continuations: true,
      taskObjectShape: true,
      didTimeout: true,
      priorityContextApis: true,
      shouldYieldAndRequestPaint: true,
      nodeHostCallbackTransport: true,
      publicSchedulerTimingCompatibilityBlocked: true,
      rootActNativePostTaskMockBehaviorBlocked: true,
      packageCompatibilityBlocked: true,
      nativeRuntimeExecutionBlocked: true
    }),
    violations: freezeArray(violations)
  });
}

export function collectSchedulerRootCurrentnessRows({
  scenarioIds = SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS,
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  const probeFile = join(
    workspaceRoot,
    "tests/conformance/src/scheduler-root-probe-runner.mjs"
  );
  const targetPackage = join(workspaceRoot, "packages/scheduler");
  const rows = [];

  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    for (const scenarioId of scenarioIds) {
      const observation = runCurrentSchedulerRootProbe({
        mode,
        probeFile,
        scenarioId,
        targetPackage,
        workspaceRoot
      });
      rows.push(
        freezeRecord({
          rowId: `${mode.id}:${scenarioId}`,
          modeId: mode.id,
          scenarioId,
          nodeEnv: mode.nodeEnv,
          condition: mode.condition,
          entrypoint: "scheduler",
          packageName: "scheduler",
          packageSourcePath: "packages/scheduler",
          behaviorEvidence: SCHEDULER_ROOT_CURRENTNESS_BEHAVIOR_EVIDENCE,
          compatibilityClaimed: false,
          observation
        })
      );
    }
  }

  return freezeArray(rows);
}

export function inspectSchedulerRootCurrentnessSourceRows({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT
} = {}) {
  return freezeArray(
    SCHEDULER_ROOT_CURRENTNESS_SOURCE_ROW_DEFINITIONS.map((definition) => {
      const absolutePath = join(workspaceRoot, definition.sourcePath);
      const exists = existsSync(absolutePath);
      const source = exists ? readFileSync(absolutePath, "utf8") : "";
      const missingTokens = definition.requiredTokens.filter(
        (token) => !source.includes(token)
      );

      return freezeRecord({
        ...definition,
        exists,
        missingTokens: freezeArray(missingTokens),
        directDeepCjsImport: /\/cjs\//u.test(definition.sourcePath),
        variantBoundaryEvidence: false,
        privateAdmission886Evidence: false,
        compatibilityClaimed: false,
        status:
          exists && missingTokens.length === 0
            ? "current-source-row-present"
            : "current-source-row-missing-or-stale"
      });
    })
  );
}

function collectExpectedSchedulerRootCurrentnessRowKeys() {
  const rowKeys = [];
  for (const mode of SCHEDULER_ROOT_PROBE_MODES) {
    for (const scenarioId of SCHEDULER_ROOT_CURRENTNESS_SCENARIO_IDS) {
      rowKeys.push(`${mode.id}:${scenarioId}`);
    }
  }
  return freezeArray(rowKeys);
}

function runCurrentSchedulerRootProbe({
  mode,
  probeFile,
  scenarioId,
  targetPackage,
  workspaceRoot
}) {
  const spawnResult = spawnSync(
    process.execPath,
    [probeFile, targetPackage, scenarioId],
    {
      cwd: workspaceRoot,
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
      result: freezeRecord({
        status: "throws",
        label: "current scheduler root probe",
        error: freezeRecord({
          name: spawnResult.error?.name ?? null,
          message:
            spawnResult.error?.message ??
            spawnResult.stderr?.trim() ??
            "Scheduler root probe failed",
          code: spawnResult.error?.code ?? null,
          exitStatus: spawnResult.status
        })
      }),
      consoleCalls: freezeArray([])
    });
  }

  try {
    const parsed = JSON.parse(spawnResult.stdout);
    const { targetPackage: _targetPackage, ...observation } = parsed;
    return freezeRecord(observation);
  } catch (error) {
    return freezeRecord({
      scenarioId,
      result: freezeRecord({
        status: "throws",
        label: "current scheduler root probe output parse",
        error: freezeRecord({
          name: error?.name ?? null,
          message: error?.message ?? null,
          code: error?.code ?? null
        })
      }),
      consoleCalls: freezeArray([])
    });
  }
}

function summarizePrivateVariantBoundaryGate(gate) {
  return freezeRecord({
    gateId: gate?.gateId ?? null,
    status: gate?.status ?? null,
    role: "private-scheduler-variant-boundary-context-only",
    acceptedAsPrivateContextOnly:
      gate?.status === PRIVATE_ADMISSION_886_GATE_STATUS &&
      gate?.compatibilityClaimed === false,
    compatibilityClaimed: gate?.compatibilityClaimed ?? null,
    recognizedVariantIds: freezeArray(gate?.recognizedVariantIds ?? []),
    behaviorEvidenceUsed: false,
    rootBehaviorEvidenceAllowed: false
  });
}

function schedulerRootOracleSchemaIsCurrent(oracle) {
  return (
    oracle?.schemaVersion === 1 &&
    oracle?.oracleKind === "scheduler-0.27.0-root-oracle" &&
    oracle?.generatedArtifacts === true &&
    oracle?.deterministic === true &&
    SCHEDULER_ROOT_ORACLE_ARTIFACT_PATH ===
      "oracles/scheduler-0.27.0-root-oracle.json" &&
    sameStringArray(
      oracle?.probeModes?.map((mode) => mode.id) ?? [],
      SCHEDULER_ROOT_PROBE_MODES.map((mode) => mode.id)
    )
  );
}

function sourceRowMatchesDefinition(row, definition) {
  if (!row || typeof row !== "object") {
    return false;
  }

  const keyManifest = compareStringSets(
    expectedSourceRowKeys(definition),
    Object.keys(row)
  );
  const modeMatches =
    definition.modeId === undefined
      ? row.modeId === undefined
      : row.modeId === definition.modeId;

  return (
    keyManifest.missing.length === 0 &&
    keyManifest.unexpected.length === 0 &&
    row.rowId === definition.rowId &&
    row.entrypoint === definition.entrypoint &&
    row.sourcePath === definition.sourcePath &&
    row.sourceRole === definition.sourceRole &&
    row.behaviorEvidenceAllowed === definition.behaviorEvidenceAllowed &&
    modeMatches &&
    row.exists === true &&
    Array.isArray(row.requiredTokens) &&
    sameStringArray(row.requiredTokens, definition.requiredTokens) &&
    Array.isArray(row.missingTokens) &&
    row.missingTokens.length === 0 &&
    row.directDeepCjsImport === /\/cjs\//u.test(definition.sourcePath) &&
    row.variantBoundaryEvidence === false &&
    row.privateAdmission886Evidence === false &&
    row.compatibilityClaimed === false &&
    row.status === "current-source-row-present"
  );
}

function expectedSourceRowKeys(definition) {
  const keys = [
    "rowId",
    "entrypoint",
    "sourcePath",
    "sourceRole",
    "behaviorEvidenceAllowed",
    "requiredTokens",
    "exists",
    "missingTokens",
    "directDeepCjsImport",
    "variantBoundaryEvidence",
    "privateAdmission886Evidence",
    "compatibilityClaimed",
    "status"
  ];

  if (definition.modeId !== undefined) {
    keys.push("modeId");
  }

  return freezeArray(keys);
}

function tryFindSchedulerRootObservation(oracle, modeId, scenarioId) {
  try {
    return findSchedulerRootObservation(oracle, modeId, scenarioId);
  } catch {
    return null;
  }
}

function tryFindFastReactSchedulerRootObservation(oracle, modeId, scenarioId) {
  try {
    return findFastReactSchedulerRootObservation(oracle, modeId, scenarioId);
  } catch {
    return null;
  }
}

function tryFindFastReactSchedulerRootComparison(oracle, modeId, scenarioId) {
  try {
    return findFastReactSchedulerRootComparison(oracle, modeId, scenarioId);
  } catch {
    return null;
  }
}

function findPublicCompatibilityClaimIds({
  blockedPublicClaims,
  localObservationRows,
  oracle
}) {
  const claimIds = [];

  for (const [claim, value] of Object.entries(blockedPublicClaims)) {
    if (value !== false) {
      claimIds.push(`blockedPublicClaims.${claim}`);
    }
  }

  for (const [claim, value] of Object.entries(oracle?.conformanceClaims ?? {})) {
    if (isCompatibilityClaimName(claim) && value === true) {
      claimIds.push(`oracle.conformanceClaims.${claim}`);
    }
  }

  for (const [claim, value] of Object.entries(oracle?.evidenceClaims ?? {})) {
    if (isCompatibilityClaimName(claim) && value === true) {
      claimIds.push(`oracle.evidenceClaims.${claim}`);
    }
  }

  if (oracle?.packages?.fastReactScheduler?.behaviorCompatibilityClaimed) {
    claimIds.push(
      "oracle.packages.fastReactScheduler.behaviorCompatibilityClaimed"
    );
  }

  for (const [comparisonId, comparison] of Object.entries(
    oracle?.implementationComparison ?? {}
  )) {
    if (comparison?.compatibilityClaimed === true) {
      claimIds.push(
        `oracle.implementationComparison.${comparisonId}.compatibilityClaimed`
      );
    }
  }

  for (const row of localObservationRows) {
    pushObjectPublicClaimIds(claimIds, row, rowKey(row));
    pushObjectPublicClaimIds(
      claimIds,
      row.behaviorEvidence,
      `${rowKey(row)}.behaviorEvidence`
    );
  }

  return freezeArray(uniqueStrings(claimIds));
}

function isCompatibilityClaimName(claim) {
  return /compatible|compatibilityClaimed/ui.test(claim);
}

function isBlockedPublicClaimName(claim) {
  return (
    SCHEDULER_ROOT_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS.includes(claim) ||
    isCompatibilityClaimName(claim)
  );
}

function objectHasPublicClaim(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.entries(value).some(
    ([claim, claimValue]) =>
      isBlockedPublicClaimName(claim) && claimValue !== false
  );
}

function pushObjectPublicClaimIds(claimIds, value, prefix) {
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [claim, claimValue] of Object.entries(value)) {
    if (isBlockedPublicClaimName(claim) && claimValue !== false) {
      claimIds.push(`${prefix}.${claim}`);
    }
  }
}

function comparableObservation(observation) {
  if (!observation || typeof observation !== "object") {
    return observation;
  }

  const { targetPackage: _targetPackage, ...comparable } = observation;
  return comparable;
}

function isPublicRootBehaviorEvidence(evidence) {
  return (
    evidence?.behaviorEvidenceKind === "current-local-root-probe" &&
    evidence?.entrypoint === "scheduler" &&
    evidence?.sourcePath === "packages/scheduler/index.js" &&
    evidence?.directDeepCjsImport === false &&
    evidence?.variantBoundaryEvidence === false &&
    evidence?.privateAdmission886Evidence === false &&
    evidence?.compatibilityClaimed === false
  );
}

function currentnessViolationRow({ mode, scenarioId, status }) {
  return freezeRecord({
    rowId: `${mode.id}:${scenarioId}`,
    modeId: mode.id,
    scenarioId,
    nodeEnv: mode.nodeEnv,
    condition: mode.condition,
    entrypoint: "scheduler",
    packageName: "scheduler",
    behaviorEvidence: SCHEDULER_ROOT_CURRENTNESS_BEHAVIOR_EVIDENCE,
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

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function pushIdsViolation(violations, id, rowIds) {
  if (rowIds.length > 0) {
    violations.push(
      violation(id, {
        rowIds: freezeArray(rowIds)
      })
    );
  }
}

function violation(id, details) {
  return freezeRecord({
    id,
    ...details
  });
}

function compareStringSets(expected, actual) {
  return {
    missing: freezeArray(expected.filter((value) => !actual.includes(value))),
    unexpected: freezeArray(actual.filter((value) => !expected.includes(value))),
    duplicates: findDuplicateStrings(actual)
  };
}

function uniqueStrings(values) {
  return freezeArray([...new Set(values)]);
}

function findDuplicateStrings(values) {
  const seen = new Set();
  const duplicates = [];

  for (const value of values) {
    if (seen.has(value) && !duplicates.includes(value)) {
      duplicates.push(value);
    }
    seen.add(value);
  }

  return freezeArray(duplicates);
}

function sameStringArray(left, right) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
