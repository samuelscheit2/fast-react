import { readFileSync } from "node:fs";

import {
  PRIVATE_ADMISSION_886_GATE_STATUS,
  PRIVATE_ADMISSION_886_ROWS,
  evaluatePrivateAdmission886Gate
} from "./private-admission-886-scheduler-variant-boundary-ledger.mjs";
import {
  SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH,
  SCHEDULER_VARIANT_PROBE_MODES,
  SCHEDULER_VARIANT_SCENARIO_IDS
} from "./scheduler-variant-targets.mjs";

export const SCHEDULER_VARIANT_CURRENTNESS_GATE_ID =
  "scheduler-variant-currentness-gate-937-1";
export const SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS =
  "blocked-public-scheduler-variant-compatibility-with-current-source-boundaries";
export const SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS =
  "blocked-public-scheduler-variant-compatibility-with-currentness-violations";
export const SCHEDULER_VARIANT_CURRENTNESS_REPORT_KIND =
  "scheduler-variant-source-currentness-report";
export const SCHEDULER_VARIANT_CURRENTNESS_REPORT_ID =
  "scheduler-variant-source-currentness-report-937-1";

export const SCHEDULER_VARIANT_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS =
  freezeArray([
    "publicSchedulerTimingCompatibilityClaimed",
    "publicSchedulerFlushBehaviorExecuted",
    "publicRootSchedulerCompatibilityClaimed",
    "publicRootExecutionClaimed",
    "publicReactActCompatibilityClaimed",
    "publicActBehaviorClaimed",
    "publicNativeCompatibilityClaimed",
    "nativeRuntimeCompatibilityClaimed",
    "nativePublicBehaviorClaimed",
    "publicPostTaskCompatibilityClaimed",
    "postTaskPublicBehaviorClaimed",
    "browserPostTaskCompatibilityClaimed",
    "publicMockSchedulerCompatibilityClaimed",
    "mockSchedulerPublicBehaviorClaimed",
    "publicPackageCompatibilityClaimed",
    "packageCompatibilityClaimed",
    "packageSurfaceChanged",
    "newPublicExportsAdded"
  ]);

export const SCHEDULER_VARIANT_CURRENTNESS_REQUIRED_ROWS = freezeArray(
  PRIVATE_ADMISSION_886_ROWS.map((row) =>
    createSchedulerVariantCurrentnessRow(row, row.sourceCurrentness)
  )
);

export const SCHEDULER_VARIANT_CURRENTNESS_REQUIRED_ROWS_BY_VARIANT =
  freezeRecord(
    Object.fromEntries(
      SCHEDULER_VARIANT_CURRENTNESS_REQUIRED_ROWS.map((row) => [
        row.variantId,
        row
      ])
    )
  );

export function stringifySchedulerVariantOracle(oracle) {
  return `${JSON.stringify(oracle, null, 2)}\n`;
}

export function readCheckedSchedulerVariantOracle(baseUrl = import.meta.url) {
  return JSON.parse(readCheckedSchedulerVariantOracleText(baseUrl));
}

export function readCheckedSchedulerVariantOracleText(
  baseUrl = import.meta.url
) {
  return readFileSync(
    new URL(`../${SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH}`, baseUrl),
    "utf8"
  );
}

export function formatSchedulerVariantOracleAsMarkdown(oracle) {
  const scenarioLines = oracle.scenarios.map(
    (scenario) =>
      `- ${scenario.id}: ${scenario.area}; entrypoints: ${scenario.entrypoints.join(", ")}`
  );

  const modeLines = oracle.probeModes.map((mode) => {
    const observations = oracle.observations[mode.id] ?? {};
    const cjsProbes = observations.deepCjsRequire?.probes ?? [];
    const cjsLoaded = cjsProbes.filter(
      (probe) => probe.require.status === "ok"
    ).length;
    const cjsThrew = cjsProbes.filter(
      (probe) => probe.require.status === "throws"
    ).length;

    return `- ${mode.id}: mock helpers ${
      observations.unstableMock?.exportKeys?.length ?? 0
    } exports, post-task plain import ${
      observations.unstablePostTaskPlainNode?.require?.require?.status ??
      "missing"
    }, CJS deep imports ${cjsLoaded} loaded/${cjsThrew} threw`;
  });

  const decisionLines = oracle.compatibilityGateRecommendations.map(
    (decision) =>
      `- ${decision.surface}: ${decision.recommendation}; ${decision.reason}`
  );

  const claimLines = Object.entries(oracle.conformanceClaims).map(
    ([key, value]) => `- ${key}: ${value}`
  );

  return [
    "# Fast React Scheduler Variant Oracle",
    "",
    "Generated from exact scheduler@0.27.0 artifacts. This oracle records variant and physical deep-import behavior but does not claim Fast React scheduler compatibility.",
    "",
    "## Scenarios",
    "",
    ...scenarioLines,
    "",
    "## Probe Modes",
    "",
    ...modeLines,
    "",
    "## Gate Recommendations",
    "",
    ...decisionLines,
    "",
    "## Conformance Claims",
    "",
    ...claimLines,
    ""
  ].join("\n");
}

export function findSchedulerVariantResolution(oracle, specifier) {
  const probe = oracle.packageResolution.resolution.find(
    (candidate) => candidate.specifier === specifier
  );
  if (!probe) {
    throw new Error(`Missing scheduler variant resolution probe: ${specifier}`);
  }
  return probe;
}

export function findSchedulerVariantDeepCjsProbe(oracle, modeId, specifier) {
  const probe = oracle.observations[modeId]?.deepCjsRequire?.probes.find(
    (candidate) => candidate.specifier === specifier
  );
  if (!probe) {
    throw new Error(
      `Missing scheduler variant deep CJS probe: ${modeId}:${specifier}`
    );
  }
  return probe;
}

export function createSchedulerVariantSourceCurrentnessReport({
  privateVariantBoundaryGate = evaluatePrivateAdmission886Gate()
} = {}) {
  const rows = freezeArray(
    Object.values(privateVariantBoundaryGate?.rowsByVariant ?? {}).map((row) =>
      createSchedulerVariantCurrentnessRow(
        row,
        row.actualSourceCurrentness ?? row.sourceCurrentness
      )
    )
  );

  return freezeRecord({
    schemaVersion: 1,
    reportKind: SCHEDULER_VARIANT_CURRENTNESS_REPORT_KIND,
    reportId: SCHEDULER_VARIANT_CURRENTNESS_REPORT_ID,
    sourceGateId: privateVariantBoundaryGate?.gateId ?? null,
    sourceGateStatus: privateVariantBoundaryGate?.status ?? null,
    sourceGateAcceptedAsPrivateContextOnly:
      privateVariantBoundaryGate?.status === PRIVATE_ADMISSION_886_GATE_STATUS &&
      privateVariantBoundaryGate?.compatibilityClaimed === false,
    sourceGateCompatibilityClaimed:
      privateVariantBoundaryGate?.compatibilityClaimed ?? null,
    source:
      "tests/conformance/src/private-admission-886-scheduler-variant-boundary-ledger.mjs",
    rows,
    blockedPublicClaims: falseRecord(
      SCHEDULER_VARIANT_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS
    ),
    compatibilityClaimed: false
  });
}

export function evaluateSchedulerVariantCurrentnessGate({
  oracle = readCheckedSchedulerVariantOracle(),
  sourceCurrentnessReport = null,
  privateVariantBoundaryGate = null
} = {}) {
  const effectivePrivateVariantBoundaryGate =
    privateVariantBoundaryGate ?? evaluatePrivateAdmission886Gate();
  const effectiveReport =
    sourceCurrentnessReport ??
    createSchedulerVariantSourceCurrentnessReport({
      privateVariantBoundaryGate: effectivePrivateVariantBoundaryGate
    });
  const sourceRows = freezeArray(effectiveReport?.rows ?? []);
  const rowsByVariant = indexRowsByVariant(sourceRows);
  const violations = [];

  if (!schedulerVariantOracleSchemaIsCurrent(oracle)) {
    violations.push(
      violation("scheduler-variant-currentness-stale-oracle-schema", {
        expectedSchemaVersion: 1,
        actualSchemaVersion: oracle?.schemaVersion ?? null,
        expectedOracleKind: "scheduler-0.27.0-variant-oracle",
        actualOracleKind: oracle?.oracleKind ?? null,
        expectedArtifactPath: "oracles/scheduler-0.27.0-variant-oracle.json",
        actualArtifactPath: SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH
      })
    );
  }

  if (!schedulerVariantSourceReportSchemaIsCurrent(effectiveReport)) {
    violations.push(
      violation("scheduler-variant-currentness-report-schema-mismatch", {
        expectedSchemaVersion: 1,
        actualSchemaVersion: effectiveReport?.schemaVersion ?? null,
        expectedReportKind: SCHEDULER_VARIANT_CURRENTNESS_REPORT_KIND,
        actualReportKind: effectiveReport?.reportKind ?? null,
        expectedReportId: SCHEDULER_VARIANT_CURRENTNESS_REPORT_ID,
        actualReportId: effectiveReport?.reportId ?? null
      })
    );
  }

  const privateVariantBoundaryContext = summarizePrivateVariantBoundaryGate(
    effectivePrivateVariantBoundaryGate,
    effectiveReport
  );
  if (!privateVariantBoundaryContext.acceptedAsPrivateContextOnly) {
    violations.push(
      violation("scheduler-variant-currentness-private-886-context-not-accepted", {
        status: privateVariantBoundaryContext.status,
        reportStatus: privateVariantBoundaryContext.reportStatus,
        compatibilityClaimed: privateVariantBoundaryContext.compatibilityClaimed
      })
    );
  }

  const manifest = compareStringSets(
    SCHEDULER_VARIANT_CURRENTNESS_REQUIRED_ROWS.map((row) => row.variantId),
    sourceRows.map((row) => row.variantId)
  );
  if (
    manifest.missing.length > 0 ||
    manifest.unexpected.length > 0 ||
    manifest.duplicates.length > 0
  ) {
    violations.push(
      violation("scheduler-variant-currentness-report-manifest-mismatch", {
        missingVariantIds: manifest.missing,
        unexpectedVariantIds: manifest.unexpected,
        duplicateVariantIds: manifest.duplicates
      })
    );
  }

  const rowMismatches = [];
  const wrongModeRows = [];
  const forgedDiagnosticRows = [];
  const packageDeepCjsAliasRows = [];
  const rootEvidenceUsedAsVariantRows = [];
  const variantEvidenceUsedAsRootRows = [];
  const mockPostTaskCrossAliasRows = [];

  for (const expected of SCHEDULER_VARIANT_CURRENTNESS_REQUIRED_ROWS) {
    const actual = rowsByVariant[expected.variantId];
    if (!actual) {
      continue;
    }

    const firstDifferencePath = findFirstDifferencePath(actual, expected);
    if (firstDifferencePath !== null) {
      rowMismatches.push(
        freezeRecord({
          variantId: expected.variantId,
          firstDifferencePath,
          expected,
          actual
        })
      );
    }

    if (
      actual.modeId !== expected.modeId ||
      actual.nodeEnv !== expected.nodeEnv ||
      actual.runtimeMode !== expected.runtimeMode
    ) {
      wrongModeRows.push(
        freezeRecord({
          variantId: expected.variantId,
          expectedModeId: expected.modeId,
          actualModeId: actual.modeId ?? null,
          expectedNodeEnv: expected.nodeEnv,
          actualNodeEnv: actual.nodeEnv ?? null,
          expectedRuntimeMode: expected.runtimeMode,
          actualRuntimeMode: actual.runtimeMode ?? null
        })
      );
    }

    if (!diagnosticBindingMatches(actual, expected)) {
      forgedDiagnosticRows.push(
        freezeRecord({
          variantId: expected.variantId,
          expectedSourceDiagnosticIds: expected.sourceDiagnosticIds,
          actualSourceDiagnosticIds: freezeArray(actual.sourceDiagnosticIds ?? []),
          expectedDiagnosticExportNames: expected.diagnosticExportNames,
          actualDiagnosticExportNames: freezeArray(
            actual.diagnosticExportNames ?? []
          ),
          expectedDiagnosticSymbolOrSourceIds:
            expected.diagnosticSymbolOrSourceIds,
          actualDiagnosticSymbolOrSourceIds: freezeArray(
            actual.diagnosticSymbolOrSourceIds ?? []
          )
        })
      );
    }

    if (!packageAndDeepCjsPathMatches(actual, expected)) {
      packageDeepCjsAliasRows.push(
        freezeRecord({
          variantId: expected.variantId,
          expectedPackagePath: expected.packagePath,
          actualPackagePath: actual.packagePath ?? null,
          expectedDeepCjsPath: expected.deepCjsPath,
          actualDeepCjsPath: actual.deepCjsPath ?? null,
          expectedDirectDeepCjsImport: expected.directDeepCjsImport,
          actualDirectDeepCjsImport: actual.directDeepCjsImport ?? null
        })
      );
    }

    if (rootEvidenceUsedAsVariant(actual, expected)) {
      rootEvidenceUsedAsVariantRows.push(
        freezeRecord({
          variantId: expected.variantId,
          classification: actual.classification ?? null,
          entrypoint: actual.entrypoint ?? null,
          packagePath: actual.packagePath ?? null,
          evidenceScope: freezeRecord(actual.evidenceScope ?? {})
        })
      );
    }

    if (variantEvidenceUsedAsRootBehavior(actual)) {
      variantEvidenceUsedAsRootRows.push(
        freezeRecord({
          variantId: expected.variantId,
          classification: actual.classification ?? null,
          evidenceScope: freezeRecord(actual.evidenceScope ?? {})
        })
      );
    }

    if (mockPostTaskAliasDetected(actual, expected)) {
      mockPostTaskCrossAliasRows.push(
        freezeRecord({
          variantId: expected.variantId,
          expectedClassification: expected.classification,
          actualClassification: actual.classification ?? null,
          actualEntrypoint: actual.entrypoint ?? null,
          actualPackagePath: actual.packagePath ?? null,
          actualSourceDiagnosticIds: freezeArray(actual.sourceDiagnosticIds ?? [])
        })
      );
    }
  }

  pushRowsViolation(
    violations,
    "scheduler-variant-currentness-row-mismatch",
    rowMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-currentness-wrong-mode",
    wrongModeRows
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-currentness-forged-diagnostic-symbol",
    forgedDiagnosticRows
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-currentness-package-deep-cjs-alias",
    packageDeepCjsAliasRows
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-currentness-root-evidence-used-as-variant",
    rootEvidenceUsedAsVariantRows
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-currentness-variant-evidence-used-as-root",
    variantEvidenceUsedAsRootRows
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-currentness-mock-post-task-cross-alias",
    mockPostTaskCrossAliasRows
  );

  const publicCompatibilityClaimIds = findSchedulerVariantPublicClaimIds({
    oracle,
    report: effectiveReport,
    rows: sourceRows
  });
  pushIdsViolation(
    violations,
    "scheduler-variant-currentness-public-compatibility-claim-detected",
    publicCompatibilityClaimIds
  );

  const diagnosticCjsCoverageVariantIds = sourceRows
    .filter(
      (row) =>
        row.directDeepCjsImport === true &&
        row.hasPrivateDiagnostics === true &&
        (row.classification === "mock" || row.classification === "post_task")
    )
    .map((row) => row.variantId);
  const requiredDiagnosticCjsCoverageVariantIds = freezeArray([
    "scheduler-cjs-unstable-mock-development",
    "scheduler-cjs-unstable-mock-production",
    "scheduler-cjs-unstable-post-task-development",
    "scheduler-cjs-unstable-post-task-production"
  ]);
  const cjsDiagnosticCoverage = compareStringSets(
    requiredDiagnosticCjsCoverageVariantIds,
    diagnosticCjsCoverageVariantIds
  );
  if (
    cjsDiagnosticCoverage.missing.length > 0 ||
    cjsDiagnosticCoverage.unexpected.length > 0 ||
    cjsDiagnosticCoverage.duplicates.length > 0
  ) {
    violations.push(
      violation("scheduler-variant-currentness-cjs-diagnostic-coverage-mismatch", {
        expectedVariantIds: requiredDiagnosticCjsCoverageVariantIds,
        actualVariantIds: freezeArray(diagnosticCjsCoverageVariantIds),
        missingVariantIds: cjsDiagnosticCoverage.missing,
        unexpectedVariantIds: cjsDiagnosticCoverage.unexpected,
        duplicateVariantIds: cjsDiagnosticCoverage.duplicates
      })
    );
  }

  const rowCurrentnessRecognized =
    rowMismatches.length === 0 &&
    manifest.missing.length === 0 &&
    manifest.unexpected.length === 0 &&
    manifest.duplicates.length === 0;
  const sourceDiagnosticBindingsRecognized =
    forgedDiagnosticRows.length === 0;
  const packageDeepCjsBoundariesRecognized =
    packageDeepCjsAliasRows.length === 0;
  const rootEvidenceRejectedForVariants =
    rootEvidenceUsedAsVariantRows.length === 0;
  const variantEvidenceRejectedForRootBehavior =
    variantEvidenceUsedAsRootRows.length === 0;
  const mockPostTaskAliasesRejected = mockPostTaskCrossAliasRows.length === 0;
  const blockedPublicClaimsRecognized =
    publicCompatibilityClaimIds.length === 0;
  const cjsDiagnosticCoverageRecognized =
    cjsDiagnosticCoverage.missing.length === 0 &&
    cjsDiagnosticCoverage.unexpected.length === 0 &&
    cjsDiagnosticCoverage.duplicates.length === 0;
  const compatibilityClaimed =
    publicCompatibilityClaimIds.length > 0 ||
    effectiveReport?.compatibilityClaimed !== false;
  const passed =
    violations.length === 0 &&
    rowCurrentnessRecognized &&
    sourceDiagnosticBindingsRecognized &&
    packageDeepCjsBoundariesRecognized &&
    rootEvidenceRejectedForVariants &&
    variantEvidenceRejectedForRootBehavior &&
    mockPostTaskAliasesRejected &&
    blockedPublicClaimsRecognized &&
    cjsDiagnosticCoverageRecognized &&
    privateVariantBoundaryContext.acceptedAsPrivateContextOnly &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: SCHEDULER_VARIANT_CURRENTNESS_GATE_ID,
    status: passed
      ? SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS
      : SCHEDULER_VARIANT_CURRENTNESS_VIOLATION_STATUS,
    oracleArtifactPath: SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH,
    oracleKind: oracle?.oracleKind ?? null,
    schemaVersion: oracle?.schemaVersion ?? null,
    sourceCurrentnessReport: effectiveReport,
    sourceRows,
    rowsByVariant,
    requiredRows: SCHEDULER_VARIANT_CURRENTNESS_REQUIRED_ROWS,
    privateVariantBoundaryContext,
    blockedPublicClaimsRecognized,
    rowCurrentnessRecognized,
    sourceDiagnosticBindingsRecognized,
    packageDeepCjsBoundariesRecognized,
    rootEvidenceRejectedForVariants,
    variantEvidenceRejectedForRootBehavior,
    mockPostTaskAliasesRejected,
    cjsDiagnosticCoverageRecognized,
    compatibilityClaimed,
    publicCompatibilityClaimIds: freezeArray(publicCompatibilityClaimIds),
    diagnosticCjsCoverageVariantIds: freezeArray(
      diagnosticCjsCoverageVariantIds
    ),
    sourceClassifications: freezeArray(
      uniqueInOrder(sourceRows.map((row) => row.classification))
    ),
    violations: freezeArray(violations)
  });
}

function createSchedulerVariantCurrentnessRow(row, sourceCurrentness) {
  const effectiveSourceCurrentness =
    sourceCurrentness ?? row.actualSourceCurrentness ?? row.sourceCurrentness;
  const variantFamily =
    effectiveSourceCurrentness?.variantFamily ?? row.sourceBoundary.variantFamily;
  const classification = classifySchedulerVariantFamily(variantFamily);
  const runtimeMode =
    effectiveSourceCurrentness?.runtimeMode ?? row.sourceBoundary.runtimeMode;
  const modeId = modeIdFromRuntimeMode(runtimeMode);
  const physicalEntrypoint =
    effectiveSourceCurrentness?.physicalEntrypoint ??
    row.sourceBoundary.physicalEntrypoint;
  const packagePath =
    effectiveSourceCurrentness?.canonicalEntrypoint ?? row.sourceBoundary.entrypoint;
  const directDeepCjsImport =
    typeof physicalEntrypoint === "string" &&
    physicalEntrypoint.startsWith("cjs/");
  const sourceDiagnosticIds = freezeArray(
    effectiveSourceCurrentness?.privateDiagnosticSourceIds ?? []
  );

  return freezeCurrentnessRow({
    rowId: `${row.variantId}:${modeId}:${packagePath}`,
    rowKind: "source-owned-scheduler-variant-boundary-currentness",
    variantId: row.variantId,
    classification,
    rootNativeMockPostTaskClassification: classification,
    variantFamily,
    entrypoint: row.sourceBoundary.entrypoint,
    canonicalEntrypoint: packagePath,
    packagePath,
    deepCjsPath: directDeepCjsImport ? packagePath : null,
    sourceFile:
      effectiveSourceCurrentness?.sourceFile ?? row.sourceBoundary.sourceFile,
    physicalEntrypoint,
    directDeepCjsImport,
    boundaryKind: directDeepCjsImport
      ? "deep-cjs-entrypoint"
      : "package-entrypoint",
    modeId,
    nodeEnv: nodeEnvFromRuntimeMode(runtimeMode),
    runtimeMode,
    sourceKind: effectiveSourceCurrentness?.sourceKind ?? null,
    packageName: effectiveSourceCurrentness?.packageName ?? null,
    packageVersion: effectiveSourceCurrentness?.packageVersion ?? null,
    compatibilityTarget: "scheduler@0.27.0",
    sourceSha256: effectiveSourceCurrentness?.sourceSha256 ?? null,
    declaredLicenseFile: effectiveSourceCurrentness?.declaredLicenseFile ?? null,
    wrapperTargets: freezeArray(effectiveSourceCurrentness?.wrapperTargets ?? []),
    diagnosticEntrypoints: freezeArray(
      effectiveSourceCurrentness?.diagnosticEntrypoints ?? []
    ),
    diagnosticCompatibilityTargets: freezeArray(
      effectiveSourceCurrentness?.diagnosticCompatibilityTargets ?? []
    ),
    sourceDiagnosticIds,
    sourceDiagnosticStatuses: freezeArray(
      effectiveSourceCurrentness?.privateDiagnosticSourceStatuses ?? []
    ),
    diagnosticExportNames: freezeArray(
      sourceDiagnosticIds.filter((id) => id.startsWith("__FAST_REACT_PRIVATE"))
    ),
    diagnosticSymbolOrSourceIds: freezeArray(
      sourceDiagnosticIds.filter((id) =>
        id.startsWith("fast-react.scheduler.")
      )
    ),
    hasPrivateDiagnostics: sourceDiagnosticIds.length > 0,
    readError: effectiveSourceCurrentness?.readError ?? null,
    evidenceScope: freezeRecord({
      sourceOwnedCurrentnessReport: true,
      sourceOwnedPackageEntrypoint: true,
      sourceOwnedDiagnosticIdentifiers: true,
      sourceOwnedDiagnosticRoles: true,
      rootEntryEvidenceAcceptedForVariant: false,
      variantEvidenceAcceptedForRootBehavior: false,
      behaviorEvidenceClaimed: false,
      rootBehaviorEvidenceClaimed: false,
      variantBehaviorEvidenceClaimed: false,
      directDeepCjsBehaviorEvidenceClaimed: false,
      packageCompatibilityClaimed: false
    }),
    publicBlockerClaims: falseRecord(
      SCHEDULER_VARIANT_CURRENTNESS_BLOCKED_PUBLIC_CLAIMS
    ),
    compatibilityClaimed: false
  });
}

function classifySchedulerVariantFamily(variantFamily) {
  switch (variantFamily) {
    case "index":
      return "root";
    case "native":
      return "native";
    case "unstable_mock":
      return "mock";
    case "unstable_post_task":
      return "post_task";
    default:
      return "unknown";
  }
}

function modeIdFromRuntimeMode(runtimeMode) {
  if (runtimeMode === "development") {
    return "node-development";
  }
  if (runtimeMode === "production") {
    return "node-production";
  }
  return runtimeMode ?? null;
}

function nodeEnvFromRuntimeMode(runtimeMode) {
  if (runtimeMode === "development") {
    return "development";
  }
  if (runtimeMode === "production") {
    return "production";
  }
  return null;
}

function schedulerVariantOracleSchemaIsCurrent(oracle) {
  return (
    oracle?.schemaVersion === 1 &&
    oracle?.oracleKind === "scheduler-0.27.0-variant-oracle" &&
    oracle?.generatedArtifacts === true &&
    oracle?.deterministic === true &&
    SCHEDULER_VARIANT_ORACLE_ARTIFACT_PATH ===
      "oracles/scheduler-0.27.0-variant-oracle.json" &&
    sameStringArray(
      oracle?.probeModes?.map((mode) => mode.id) ?? [],
      SCHEDULER_VARIANT_PROBE_MODES.map((mode) => mode.id)
    ) &&
    sameStringArray(
      oracle?.scenarios?.map((scenario) => scenario.id) ?? [],
      SCHEDULER_VARIANT_SCENARIO_IDS
    )
  );
}

function schedulerVariantSourceReportSchemaIsCurrent(report) {
  return (
    report?.schemaVersion === 1 &&
    report?.reportKind === SCHEDULER_VARIANT_CURRENTNESS_REPORT_KIND &&
    report?.reportId === SCHEDULER_VARIANT_CURRENTNESS_REPORT_ID &&
    report?.source ===
      "tests/conformance/src/private-admission-886-scheduler-variant-boundary-ledger.mjs" &&
    report?.compatibilityClaimed === false
  );
}

function summarizePrivateVariantBoundaryGate(gate, report) {
  return freezeRecord({
    gateId: gate?.gateId ?? null,
    status: gate?.status ?? null,
    reportStatus: report?.sourceGateStatus ?? null,
    role: "private-scheduler-variant-boundary-currentness-context-only",
    acceptedAsPrivateContextOnly:
      gate?.status === PRIVATE_ADMISSION_886_GATE_STATUS &&
      gate?.compatibilityClaimed === false &&
      report?.sourceGateAcceptedAsPrivateContextOnly === true &&
      report?.sourceGateCompatibilityClaimed === false,
    compatibilityClaimed:
      gate?.compatibilityClaimed ?? report?.sourceGateCompatibilityClaimed ?? null,
    behaviorEvidenceUsed: false,
    rootBehaviorEvidenceAllowed: false
  });
}

function diagnosticBindingMatches(actual, expected) {
  return (
    sameStringArray(
      actual?.sourceDiagnosticIds ?? [],
      expected.sourceDiagnosticIds
    ) &&
    sameStringArray(
      actual?.sourceDiagnosticStatuses ?? [],
      expected.sourceDiagnosticStatuses
    ) &&
    sameStringArray(
      actual?.diagnosticExportNames ?? [],
      expected.diagnosticExportNames
    ) &&
    sameStringArray(
      actual?.diagnosticSymbolOrSourceIds ?? [],
      expected.diagnosticSymbolOrSourceIds
    ) &&
    sameStringArray(
      actual?.diagnosticEntrypoints ?? [],
      expected.diagnosticEntrypoints
    ) &&
    sameStringArray(
      actual?.diagnosticCompatibilityTargets ?? [],
      expected.diagnosticCompatibilityTargets
    )
  );
}

function packageAndDeepCjsPathMatches(actual, expected) {
  return (
    actual?.packagePath === expected.packagePath &&
    actual?.canonicalEntrypoint === expected.canonicalEntrypoint &&
    actual?.deepCjsPath === expected.deepCjsPath &&
    actual?.directDeepCjsImport === expected.directDeepCjsImport &&
    actual?.boundaryKind === expected.boundaryKind &&
    actual?.sourceFile === expected.sourceFile &&
    actual?.physicalEntrypoint === expected.physicalEntrypoint
  );
}

function rootEvidenceUsedAsVariant(actual, expected) {
  return (
    expected.classification !== "root" &&
    (actual?.entrypoint === "scheduler" ||
      actual?.packagePath === "scheduler" ||
      actual?.sourceFile === "packages/scheduler/index.js" ||
      actual?.evidenceScope?.rootEntryEvidenceAcceptedForVariant !== false)
  );
}

function variantEvidenceUsedAsRootBehavior(actual) {
  return (
    actual?.evidenceScope?.variantEvidenceAcceptedForRootBehavior !== false ||
    actual?.evidenceScope?.rootBehaviorEvidenceClaimed !== false ||
    actual?.evidenceScope?.variantBehaviorEvidenceClaimed !== false ||
    actual?.evidenceScope?.behaviorEvidenceClaimed !== false ||
    actual?.evidenceScope?.directDeepCjsBehaviorEvidenceClaimed !== false
  );
}

function mockPostTaskAliasDetected(actual, expected) {
  const actualDiagnosticIds = actual?.sourceDiagnosticIds ?? [];
  const actualHasMockDiagnostic = actualDiagnosticIds.some(
    (id) =>
      id === "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__" ||
      id.includes(".mock-")
  );
  const actualHasPostTaskDiagnostic = actualDiagnosticIds.some(
    (id) =>
      id === "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__" ||
      id.includes("post_task") ||
      id.includes("unstable_post_task")
  );

  return (
    ((expected.classification === "mock" || actual?.classification === "mock") &&
      actualHasPostTaskDiagnostic) ||
    ((expected.classification === "post_task" ||
      actual?.classification === "post_task") &&
      actualHasMockDiagnostic) ||
    ((expected.classification === "mock" ||
      expected.classification === "post_task") &&
      actual?.classification !== expected.classification)
  );
}

function findSchedulerVariantPublicClaimIds({ oracle, report, rows }) {
  const claimIds = [];

  if (report?.compatibilityClaimed !== false) {
    claimIds.push("sourceCurrentnessReport.compatibilityClaimed");
  }

  for (const [claim, value] of Object.entries(
    report?.blockedPublicClaims ?? {}
  )) {
    if (value !== false) {
      claimIds.push(`sourceCurrentnessReport.blockedPublicClaims.${claim}`);
    }
  }

  for (const [claim, value] of Object.entries(oracle?.conformanceClaims ?? {})) {
    if (
      value === true &&
      [
        "fastReactComparedToScheduler",
        "fastReactBehaviorCompatible",
        "fullDualRunOracleExists",
        "compatibilityClaimed"
      ].includes(claim)
    ) {
      claimIds.push(`oracle.conformanceClaims.${claim}`);
    }
  }

  if (oracle?.evidenceClaims?.fastReactComparedToScheduler === true) {
    claimIds.push("oracle.evidenceClaims.fastReactComparedToScheduler");
  }

  if (oracle?.packages?.fastReactScheduler?.behaviorCompatibilityClaimed) {
    claimIds.push(
      "oracle.packages.fastReactScheduler.behaviorCompatibilityClaimed"
    );
  }

  for (const row of rows) {
    if (row.compatibilityClaimed !== false) {
      claimIds.push(`${row.variantId}.compatibilityClaimed`);
    }
    for (const [claim, value] of Object.entries(row.publicBlockerClaims ?? {})) {
      if (value !== false) {
        claimIds.push(`${row.variantId}.publicBlockerClaims.${claim}`);
      }
    }
    for (const [claim, value] of Object.entries(row.evidenceScope ?? {})) {
      if (/CompatibilityClaimed|BehaviorClaimed|EvidenceClaimed/u.test(claim)) {
        if (value !== false) {
          claimIds.push(`${row.variantId}.evidenceScope.${claim}`);
        }
      }
    }
  }

  return freezeArray(claimIds);
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

function indexRowsByVariant(rows) {
  return freezeRecord(Object.fromEntries(rows.map((row) => [row.variantId, row])));
}

function uniqueInOrder(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(violation(id, { rows: freezeArray(rows) }));
  }
}

function pushIdsViolation(violations, id, ids) {
  if (ids.length > 0) {
    violations.push(violation(id, { ids: freezeArray(ids) }));
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

function freezeCurrentnessRow(row) {
  return freezeRecord({
    ...row,
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
    evidenceScope: freezeRecord(row.evidenceScope ?? {}),
    publicBlockerClaims: freezeRecord(row.publicBlockerClaims ?? {})
  });
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
