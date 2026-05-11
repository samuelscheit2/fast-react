import {
  SCHEDULER_VARIANT_CURRENTNESS_GATE_ID,
  SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS,
  evaluateSchedulerVariantCurrentnessGate
} from "./scheduler-variant-oracle.mjs";
import {
  SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_ID,
  SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_STATUS,
  evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate
} from "./scheduler-variant-boundary-diagnostics-currentness.mjs";

export const SCHEDULER_PUBLIC_TIMING_BLOCKER_GATE_ID =
  "scheduler-public-timing-blocker-currentness-gate-987-1";
export const SCHEDULER_PUBLIC_TIMING_BLOCKER_GATE_STATUS =
  "blocked-public-scheduler-timing-with-current-variant-source-boundaries";
export const SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS =
  "blocked-public-scheduler-timing-with-currentness-violations";

export const SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS = freezeArray([
  "scheduler-index-wrapper",
  "scheduler-cjs-index-development",
  "scheduler-cjs-index-production",
  "scheduler-unstable-mock-root",
  "scheduler-cjs-unstable-mock-development",
  "scheduler-cjs-unstable-mock-production",
  "scheduler-unstable-post-task-wrapper",
  "scheduler-cjs-unstable-post-task-development",
  "scheduler-cjs-unstable-post-task-production",
  "scheduler-native-wrapper",
  "scheduler-cjs-native-development",
  "scheduler-cjs-native-production"
]);

export const SCHEDULER_PUBLIC_TIMING_REQUIRED_BOUNDARY_DIAGNOSTIC_ROW_IDS =
  freezeArray([
    "scheduler-mock-root-development-boundary-diagnostics",
    "scheduler-mock-root-production-boundary-diagnostics",
    "scheduler-mock-cjs-development-boundary-diagnostics",
    "scheduler-mock-cjs-production-boundary-diagnostics",
    "scheduler-post-task-development-boundary-diagnostics",
    "scheduler-post-task-production-boundary-diagnostics"
  ]);

export const SCHEDULER_PUBLIC_TIMING_BLOCKED_SEMANTICS = freezeArray([
  "unstable_scheduleCallback-callback-execution",
  "unstable_cancelCallback-cancellation",
  "scheduler-yielded-values-and-shouldYield",
  "scheduler-priority-and-current-event-behavior",
  "scheduler-wrapCallback-priority-context",
  "scheduler-runWithPriority-and-next",
  "scheduler-mock-virtual-time-and-yielded-values",
  "scheduler-postTask-browser-task-ordering-and-priority",
  "scheduler-node-host-callback-transport-timing"
]);

export const SCHEDULER_PUBLIC_TIMING_BLOCKED_PUBLIC_CLAIMS = freezeArray([
  "publicCompatibilityClaimed",
  "compatibilityClaimed",
  "schedulerCompatibilityClaimed",
  "schedulerTimingCompatibilityClaimed",
  "publicSchedulerCompatibilityClaimed",
  "publicSchedulerTimingCompatibilityClaimed",
  "publicSchedulerCallbackExecutionClaimed",
  "publicSchedulerCancellationCompatibilityClaimed",
  "publicSchedulerYieldCompatibilityClaimed",
  "publicSchedulerCurrentEventBehaviorCompatibilityClaimed",
  "publicSchedulerPriorityCompatibilityClaimed",
  "publicSchedulerTimingReady",
  "publicSchedulerFlushCompatibilityClaimed",
  "publicSchedulerFlushHelperCompatibilityClaimed",
  "publicSchedulerFlushHelperReady",
  "publicSchedulerFlushBehaviorExecuted",
  "publicSchedulerFlushExecutionAvailable",
  "publicSchedulerFlush",
  "invokesPublicSchedulerFlushHelper",
  "drainsPublicSchedulerTaskQueue",
  "drainsPublicReactActQueue",
  "publicRootSchedulerCompatibilityClaimed",
  "publicRootCompatibilityClaimed",
  "publicReactRootCompatibilityClaimed",
  "publicRootRenderCompatibilityClaimed",
  "publicRootUpdateCompatibilityClaimed",
  "publicRootUnmountCompatibilityClaimed",
  "publicRootBehaviorReady",
  "publicRootExecutionClaimed",
  "publicRootExecution",
  "rootCompatibilityClaimed",
  "rootExecutionClaimed",
  "queueFlushingReady",
  "rendererRootsReady",
  "passiveEffectsReady",
  "continuationFlushingReady",
  "executesQueuedWork",
  "executesEffects",
  "executesPassiveEffects",
  "executesRendererWork",
  "executesRendererRoots",
  "executesPublicSchedulerTasks",
  "executesPublicEffects",
  "executesPublicRendererRoots",
  "executesPublicFlushSync",
  "executesPublicDomMutation",
  "publicReactActCompatibilityClaimed",
  "publicActCompatibilityClaimed",
  "publicActReady",
  "publicReactActReady",
  "publicTestUtilsActReady",
  "publicActTimingCompatibilityClaimed",
  "publicActWarningCompatibilityClaimed",
  "publicTestUtilsActCompatibilityClaimed",
  "publicWarningCompatibilityClaimed",
  "publicActBehaviorClaimed",
  "publicActExecution",
  "publicActPassiveDrain",
  "publicFlushSyncExecution",
  "publicDomMutation",
  "publicEffectExecution",
  "publicRendererWork",
  "rendererExecutionReady",
  "effectsExecutionReady",
  "actCompatibilityClaimed",
  "reactActBehaviorClaimed",
  "actBehaviorClaimed",
  "publicPassiveEffectCompatibilityClaimed",
  "publicPassiveEffectsCompatibilityClaimed",
  "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
  "publicDelayedRendererRootAdmissionClaimed",
  "publicFlushHelperValidatorExposed",
  "routesAcceptedMockSchedulerFlushHelperMetadata",
  "schedulerTimingAdmissionClaimed",
  "schedulerDelayedActRootAdmissionClaimed",
  "schedulerDelayedRendererRootAdmissionClaimed",
  "publicNativeCompatibilityClaimed",
  "nativeCompatibilityClaimed",
  "publicNativeCompatibility",
  "nativeExecution",
  "nativeExecutionClaimed",
  "publicNativeExecution",
  "publicNativeExecutionClaimed",
  "nativeRuntimeCompatibilityClaimed",
  "nativeRuntimeExecutionClaimed",
  "nativePublicBehaviorClaimed",
  "publicPostTaskCompatibilityClaimed",
  "postTaskCompatibilityClaimed",
  "postTaskPublicBehaviorClaimed",
  "browserPostTaskCompatibilityClaimed",
  "browserTaskOrderingCompatibilityClaimed",
  "publicSchedulerPostTaskTimingCompatibilityClaimed",
  "rendererWorkExecuted",
  "reconcilerWorkExecuted",
  "nativeRendererWorkExecuted",
  "publicMockSchedulerCompatibilityClaimed",
  "mockSchedulerCompatibilityClaimed",
  "mockSchedulerPublicBehaviorClaimed",
  "publicSchedulerMockTimingCompatibilityClaimed",
  "schedulerMockCompatibilityClaimed",
  "publicTimingAliasAccepted",
  "publicRootAliasAccepted",
  "publicActAliasAccepted",
  "publicPackageAliasAccepted",
  "publicNativeAliasAccepted",
  "publicPostTaskAliasAccepted",
  "publicMockAliasAccepted",
  "rendererExecutionClaimed",
  "passiveEffectsExecutionClaimed",
  "publicRendererCompatibilityClaimed",
  "publicEffectExecutionClaimed",
  "publicFlushSyncCompatibilityClaimed",
  "publicRenderCompatibilityClaimed",
  "publicEffectCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "packageReady",
  "packageCompatibilityClaimed",
  "packageExecutionClaimed",
  "packageAliasAccepted",
  "packageSurfaceChanged",
  "newPublicExportsAdded"
]);

const sourceStringFields = freezeArray([
  "rowId",
  "rowKind",
  "variantId",
  "classification",
  "rootNativeMockPostTaskClassification",
  "variantFamily",
  "entrypoint",
  "canonicalEntrypoint",
  "packagePath",
  "sourceFile",
  "physicalEntrypoint",
  "boundaryKind",
  "modeId",
  "runtimeMode",
  "sourceKind",
  "packageName",
  "packageVersion",
  "compatibilityTarget",
  "sourceSha256"
]);

const sourceNullableStringFields = freezeArray([
  "deepCjsPath",
  "nodeEnv",
  "declaredLicenseFile",
  "readError"
]);

const sourceBooleanFields = freezeArray([
  "directDeepCjsImport",
  "hasPrivateDiagnostics",
  "compatibilityClaimed"
]);

const sourceStringArrayFields = freezeArray([
  "wrapperTargets",
  "diagnosticEntrypoints",
  "diagnosticCompatibilityTargets",
  "sourceDiagnosticIds",
  "sourceDiagnosticStatuses",
  "diagnosticExportNames",
  "diagnosticSymbolOrSourceIds"
]);

const sourceBooleanRecordFields = freezeArray([
  "evidenceScope",
  "publicBlockerClaims"
]);

const sourceRequiredFieldNames = freezeArray([
  ...sourceStringFields,
  ...sourceNullableStringFields,
  ...sourceBooleanFields,
  ...sourceStringArrayFields,
  ...sourceBooleanRecordFields
]);
const sourceRequiredFieldNameSet = new Set(sourceRequiredFieldNames);

const blockedPublicClaimKeySet = new Set(
  SCHEDULER_PUBLIC_TIMING_BLOCKED_PUBLIC_CLAIMS
);
const allowedPublicClaimKeyPatterns = freezeArray([/Blocked$/]);
const inferredPublicClaimKeyPattern =
  /^public[A-Z].*(?:Compatibility|CompatibilityClaimed|Claimed|Ready|Execution|Behavior|Drain|Flush|Mutation|RendererWork|AliasAccepted|Available|Executed)$/;
const inferredCompatibilityAliasKeyPattern =
  /^(?:scheduler|schedulerTiming|schedulerCallbackExecution|schedulerCancellation|schedulerYield|schedulerPriority|schedulerCurrentEvent|schedulerFlush|schedulerTask|schedulerPostTask|schedulerMock|schedulerRoot|root|reactRoot|act|reactAct|native|nativeRuntime|package)(?:[A-Z].*)?(?:Compatibility|CompatibilityClaimed|Claimed|Ready|Execution|ExecutionClaimed|Behavior|BehaviorClaimed|Drain|Flush|Mutation|RendererWork|AliasAccepted|Available|Executed)$/;
const inferredPublicClaimProbeStems = freezeArray([
  "New",
  "Scheduler",
  "SchedulerTiming",
  "SchedulerCallbackExecution",
  "SchedulerCancellation",
  "SchedulerYield",
  "SchedulerPriority",
  "SchedulerCurrentEvent",
  "SchedulerFlush",
  "SchedulerTask",
  "SchedulerPostTask",
  "SchedulerMock",
  "SchedulerRoot",
  "PostTask",
  "BrowserPostTask",
  "MockScheduler",
  "React",
  "ReactAct",
  "ReactRoot",
  "Act",
  "Root",
  "RootRender",
  "RootUpdate",
  "RootUnmount",
  "Effect",
  "PassiveEffect",
  "Renderer",
  "Native",
  "NativeRuntime",
  "Package",
  "FlushSync",
  "Render",
  "Dom",
  "Browser"
]);
const inferredCompatibilityAliasProbeStems = freezeArray([
  "scheduler",
  "schedulerTiming",
  "schedulerCallbackExecution",
  "schedulerCancellation",
  "schedulerYield",
  "schedulerPriority",
  "schedulerCurrentEvent",
  "schedulerFlush",
  "schedulerTask",
  "schedulerPostTask",
  "schedulerMock",
  "schedulerRoot",
  "root",
  "reactRoot",
  "act",
  "reactAct",
  "native",
  "nativeRuntime",
  "package"
]);
const inferredPublicClaimProbeSuffixes = freezeArray([
  "Compatibility",
  "CompatibilityClaimed",
  "Claimed",
  "Ready",
  "Execution",
  "ExecutionClaimed",
  "Behavior",
  "BehaviorClaimed",
  "Drain",
  "Flush",
  "AliasAccepted",
  "Available",
  "Executed"
]);
const hiddenPublicClaimProbeKeys = freezeArray([
  ...new Set([
    ...SCHEDULER_PUBLIC_TIMING_BLOCKED_PUBLIC_CLAIMS,
    ...inferredPublicClaimProbeStems.flatMap((stem) =>
      inferredPublicClaimProbeSuffixes.map((suffix) => `public${stem}${suffix}`)
    ),
    ...inferredCompatibilityAliasProbeStems.flatMap((stem) =>
      inferredPublicClaimProbeSuffixes.map((suffix) => `${stem}${suffix}`)
    )
  ])
]);

const moduleOwnedVariantCurrentnessGates = new WeakSet();
const moduleOwnedBoundaryDiagnosticsGates = new WeakSet();

const boundaryDiagnosticRowDefinitions = freezeArray([
  freezeRecord({
    rowId: "scheduler-mock-root-development-boundary-diagnostics",
    variantId: "scheduler-unstable-mock-root",
    selectedCjsVariantId: "scheduler-cjs-unstable-mock-development"
  }),
  freezeRecord({
    rowId: "scheduler-mock-root-production-boundary-diagnostics",
    variantId: "scheduler-unstable-mock-root",
    selectedCjsVariantId: "scheduler-cjs-unstable-mock-production"
  }),
  freezeRecord({
    rowId: "scheduler-mock-cjs-development-boundary-diagnostics",
    variantId: "scheduler-cjs-unstable-mock-development",
    selectedCjsVariantId: "scheduler-cjs-unstable-mock-development"
  }),
  freezeRecord({
    rowId: "scheduler-mock-cjs-production-boundary-diagnostics",
    variantId: "scheduler-cjs-unstable-mock-production",
    selectedCjsVariantId: "scheduler-cjs-unstable-mock-production"
  }),
  freezeRecord({
    rowId: "scheduler-post-task-development-boundary-diagnostics",
    variantId: "scheduler-unstable-post-task-wrapper",
    selectedCjsVariantId: "scheduler-cjs-unstable-post-task-development"
  }),
  freezeRecord({
    rowId: "scheduler-post-task-production-boundary-diagnostics",
    variantId: "scheduler-unstable-post-task-wrapper",
    selectedCjsVariantId: "scheduler-cjs-unstable-post-task-production"
  })
]);

export function evaluateSchedulerPublicTimingBlockerCurrentnessGate(
  options = undefined
) {
  const evaluatorOptions = readEvaluatorOptions(options);
  const authoritativeVariantCurrentnessGate =
    createAuthoritativeVariantCurrentnessGate();
  const candidateVariantCurrentnessGate =
    evaluatorOptions.callerProvidedVariantCurrentnessGate
      ? evaluatorOptions.variantCurrentnessGate
      : authoritativeVariantCurrentnessGate;
  const authoritativeBoundaryDiagnosticsGate =
    createAuthoritativeBoundaryDiagnosticsGate();
  const candidateBoundaryDiagnosticsGate =
    evaluatorOptions.callerProvidedBoundaryDiagnosticsGate
      ? evaluatorOptions.boundaryDiagnosticsGate
      : authoritativeBoundaryDiagnosticsGate;

  const authoritativeReadViolationIds = [];
  const authoritativeRowsByVariant = readSourcePackageRowsByVariant(
    authoritativeVariantCurrentnessGate?.rowsByVariant,
    "authoritativeVariantCurrentnessGate.rowsByVariant",
    authoritativeReadViolationIds
  );

  const candidateGateReadViolationIds = [];
  const candidateGate = readVariantCurrentnessGate(
    candidateVariantCurrentnessGate,
    "variantCurrentnessGate",
    candidateGateReadViolationIds
  );
  const candidateRowReadViolationIds = [];
  const candidateRowsByVariant = readSourcePackageRowsByVariant(
    candidateGate.rowsByVariant,
    "variantCurrentnessGate.rowsByVariant",
    candidateRowReadViolationIds
  );
  const boundaryDiagnosticsGateReadViolationIds = [];
  const boundaryDiagnosticsGate = readBoundaryDiagnosticsGate(
    candidateBoundaryDiagnosticsGate,
    "boundaryDiagnosticsGate",
    boundaryDiagnosticsGateReadViolationIds
  );
  const boundaryDiagnosticsRowReadViolationIds = [];
  const boundaryDiagnosticsRowsById = readBoundaryDiagnosticsRowsById(
    boundaryDiagnosticsGate.rows,
    "boundaryDiagnosticsGate.rows",
    boundaryDiagnosticsRowReadViolationIds
  );

  const publicCompatibilityClaimIds = [
    ...findPublicClaimIds(candidateVariantCurrentnessGate, "variantCurrentnessGate"),
    ...findPublicClaimIds(
      candidateBoundaryDiagnosticsGate,
      "boundaryDiagnosticsGate"
    )
  ];
  const violations = [];
  const sourcePackageMismatches = [];
  const boundaryDiagnosticsSourceMismatches = [];

  pushIdsViolation(
    violations,
    "scheduler-public-timing-blocker-options-malformed",
    evaluatorOptions.violationIds
  );
  pushIdsViolation(
    violations,
    "scheduler-public-timing-blocker-authoritative-source-row-validation-failed",
    authoritativeReadViolationIds
  );
  pushIdsViolation(
    violations,
    "scheduler-public-timing-blocker-source-gate-malformed",
    candidateGateReadViolationIds
  );
  pushIdsViolation(
    violations,
    "scheduler-public-timing-blocker-source-package-row-validation-failed",
    candidateRowReadViolationIds
  );
  pushIdsViolation(
    violations,
    "scheduler-public-timing-blocker-boundary-diagnostics-gate-malformed",
    boundaryDiagnosticsGateReadViolationIds
  );
  pushIdsViolation(
    violations,
    "scheduler-public-timing-blocker-boundary-diagnostics-row-validation-failed",
    boundaryDiagnosticsRowReadViolationIds
  );

  const sourceGateProofRecognized =
    candidateVariantCurrentnessGate !== null &&
    typeof candidateVariantCurrentnessGate === "object" &&
    moduleOwnedVariantCurrentnessGates.has(candidateVariantCurrentnessGate) &&
    evaluatorOptions.callerProvidedVariantCurrentnessGate === false;
  const sourceGateMetadataRecognized =
    candidateGate.gateId === SCHEDULER_VARIANT_CURRENTNESS_GATE_ID &&
    candidateGate.status === SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS &&
    candidateGate.compatibilityClaimed === false;
  const boundaryDiagnosticsGateProofRecognized =
    candidateBoundaryDiagnosticsGate !== null &&
    typeof candidateBoundaryDiagnosticsGate === "object" &&
    moduleOwnedBoundaryDiagnosticsGates.has(candidateBoundaryDiagnosticsGate) &&
    evaluatorOptions.callerProvidedBoundaryDiagnosticsGate === false;
  const boundaryDiagnosticsGateMetadataRecognized =
    boundaryDiagnosticsGate.gateId ===
      SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_ID &&
    boundaryDiagnosticsGate.status ===
      SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_STATUS &&
    boundaryDiagnosticsGate.sourceCurrentnessRecognized === true &&
    boundaryDiagnosticsGate.sourceGateContextRecognized === true &&
    boundaryDiagnosticsGate.entrypointVariantBoundariesRecognized === true &&
    boundaryDiagnosticsGate.diagnosticIdentitiesRecognized === true &&
    boundaryDiagnosticsGate.queueIdentitiesRecognized === true &&
    boundaryDiagnosticsGate.unsupportedStatusRecognized === true &&
    boundaryDiagnosticsGate.rootNativeVariantReuseRejected === true &&
    boundaryDiagnosticsGate.publicCompatibilityClaimsBlocked === true &&
    boundaryDiagnosticsGate.compatibilityClaimed === false &&
    boundaryDiagnosticsGate.violationCount === 0;

  if (!sourceGateProofRecognized) {
    violations.push(
      violation("scheduler-public-timing-blocker-source-gate-caller-shaped", {
        callerProvidedVariantCurrentnessGate:
          evaluatorOptions.callerProvidedVariantCurrentnessGate,
        sourceGateKnownToModule: moduleOwnedVariantCurrentnessGates.has(
          candidateVariantCurrentnessGate
        )
      })
    );
  }

  if (!sourceGateMetadataRecognized) {
    violations.push(
      violation("scheduler-public-timing-blocker-source-gate-mismatch", {
        expectedGateId: SCHEDULER_VARIANT_CURRENTNESS_GATE_ID,
        actualGateId: candidateGate.gateId,
        expectedStatus: SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS,
        actualStatus: candidateGate.status,
        actualCompatibilityClaimed: candidateGate.compatibilityClaimed
      })
    );
  }

  if (!boundaryDiagnosticsGateProofRecognized) {
    violations.push(
      violation(
        "scheduler-public-timing-blocker-boundary-diagnostics-gate-caller-shaped",
        {
          callerProvidedBoundaryDiagnosticsGate:
            evaluatorOptions.callerProvidedBoundaryDiagnosticsGate,
          boundaryDiagnosticsGateKnownToModule:
            moduleOwnedBoundaryDiagnosticsGates.has(
              candidateBoundaryDiagnosticsGate
            )
        }
      )
    );
  }

  if (!boundaryDiagnosticsGateMetadataRecognized) {
    violations.push(
      violation(
        "scheduler-public-timing-blocker-boundary-diagnostics-gate-mismatch",
        {
          expectedGateId: SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_ID,
          actualGateId: boundaryDiagnosticsGate.gateId,
          expectedStatus: SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_STATUS,
          actualStatus: boundaryDiagnosticsGate.status,
          actualCompatibilityClaimed:
            boundaryDiagnosticsGate.compatibilityClaimed,
          actualViolationCount: boundaryDiagnosticsGate.violationCount
        }
      )
    );
  }

  for (const variantId of SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS) {
    const expected = authoritativeRowsByVariant[variantId];
    const actual = candidateRowsByVariant[variantId];
    if (!expected || !actual) {
      sourcePackageMismatches.push(
        freezeRecord({
          variantId,
          firstDifferencePath: "$",
          expected: expected ?? null,
          actual: actual ?? null
        })
      );
      continue;
    }

    const firstDifferencePath = findFirstDifferencePath(actual, expected);
    if (firstDifferencePath !== null) {
      sourcePackageMismatches.push(
        freezeRecord({
          variantId,
          firstDifferencePath,
          expected,
          actual
        })
      );
    }
  }

  pushRowsViolation(
    violations,
    "scheduler-public-timing-blocker-source-package-row-mismatch",
    sourcePackageMismatches
  );

  for (const definition of boundaryDiagnosticRowDefinitions) {
    const row = boundaryDiagnosticsRowsById[definition.rowId];
    const sourceRow = candidateRowsByVariant[definition.variantId];
    const selectedSourceRow =
      candidateRowsByVariant[definition.selectedCjsVariantId];
    if (!row || !sourceRow || !selectedSourceRow) {
      boundaryDiagnosticsSourceMismatches.push(
        freezeRecord({
          rowId: definition.rowId,
          firstDifferencePath: "$",
          expectedVariantId: definition.variantId,
          actualVariantId: row?.variantId ?? null,
          expectedSelectedCjsVariantId: definition.selectedCjsVariantId,
          actualSelectedCjsVariantId: row?.selectedCjsVariantId ?? null
        })
      );
      continue;
    }

    const sourceDifference = findFirstDifferencePath(
      row.sourceCurrentness,
      sourceRow
    );
    const selectedSourceDifference = findFirstDifferencePath(
      row.selectedSourceCurrentness,
      selectedSourceRow
    );
    if (
      row.variantId !== definition.variantId ||
      row.selectedCjsVariantId !== definition.selectedCjsVariantId ||
      sourceDifference !== null ||
      selectedSourceDifference !== null
    ) {
      boundaryDiagnosticsSourceMismatches.push(
        freezeRecord({
          rowId: definition.rowId,
          firstDifferencePath:
            sourceDifference ??
            selectedSourceDifference ??
            "$.variantBinding",
          expectedVariantId: definition.variantId,
          actualVariantId: row.variantId,
          expectedSelectedCjsVariantId: definition.selectedCjsVariantId,
          actualSelectedCjsVariantId: row.selectedCjsVariantId,
          sourceFirstDifferencePath: sourceDifference,
          selectedSourceFirstDifferencePath: selectedSourceDifference
        })
      );
    }
  }

  pushRowsViolation(
    violations,
    "scheduler-public-timing-blocker-boundary-diagnostics-source-row-mismatch",
    boundaryDiagnosticsSourceMismatches
  );
  pushIdsViolation(
    violations,
    "scheduler-public-timing-blocker-public-compatibility-claim-detected",
    publicCompatibilityClaimIds
  );

  const sourcePackageMismatchVariantIds = new Set(
    sourcePackageMismatches.map((row) => row.variantId)
  );
  const sourceGateContextRecognized =
    sourceGateProofRecognized && sourceGateMetadataRecognized;
  const boundaryDiagnosticsCurrentnessRecognized =
    boundaryDiagnosticsGateProofRecognized &&
    boundaryDiagnosticsGateMetadataRecognized &&
    boundaryDiagnosticsGateReadViolationIds.length === 0 &&
    boundaryDiagnosticsRowReadViolationIds.length === 0 &&
    boundaryDiagnosticsSourceMismatches.length === 0;
  const sourcePackageRowsRecognized =
    authoritativeReadViolationIds.length === 0 &&
    candidateGateReadViolationIds.length === 0 &&
    candidateRowReadViolationIds.length === 0 &&
    sourcePackageMismatches.length === 0;
  const publicCompatibilityClaimsBlocked =
    publicCompatibilityClaimIds.length === 0;
  const timingRows = createTimingBlockerRows({
    expectedRowsByVariant: authoritativeRowsByVariant,
    actualRowsByVariant: candidateRowsByVariant,
    sourcePackageMismatchVariantIds,
    sourceGateContextRecognized:
      sourceGateContextRecognized && boundaryDiagnosticsCurrentnessRecognized
  });
  const publicTimingSemanticsBlocked =
    timingRows.length === SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS.length &&
    timingRows.every(
      (row) =>
        row.publicTimingSemanticsBlocked === true &&
        row.compatibilityClaimed === false
    );
  const compatibilityClaimed =
    publicCompatibilityClaimIds.length > 0 ||
    candidateGate.compatibilityClaimed !== false;
  const acceptedVariantCurrentnessEvidenceConsumed =
    sourceGateContextRecognized &&
    boundaryDiagnosticsCurrentnessRecognized &&
    sourcePackageRowsRecognized &&
    publicCompatibilityClaimsBlocked &&
    compatibilityClaimed === false;
  const passed =
    violations.length === 0 &&
    acceptedVariantCurrentnessEvidenceConsumed &&
    publicTimingSemanticsBlocked;

  return freezeRecord({
    gateId: SCHEDULER_PUBLIC_TIMING_BLOCKER_GATE_ID,
    status: passed
      ? SCHEDULER_PUBLIC_TIMING_BLOCKER_GATE_STATUS
      : SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS,
    sourceGateId: candidateGate.gateId,
    sourceGateStatus: candidateGate.status,
    boundaryDiagnosticsGateId: boundaryDiagnosticsGate.gateId,
    boundaryDiagnosticsGateStatus: boundaryDiagnosticsGate.status,
    sourceGateContextRecognized,
    boundaryDiagnosticsCurrentnessRecognized,
    sourcePackageRowsRecognized,
    acceptedVariantCurrentnessEvidenceConsumed,
    publicTimingSemanticsBlocked,
    publicCompatibilityClaimsBlocked,
    compatibilityClaimed,
    callerProvidedVariantCurrentnessGate:
      evaluatorOptions.callerProvidedVariantCurrentnessGate,
    callerProvidedBoundaryDiagnosticsGate:
      evaluatorOptions.callerProvidedBoundaryDiagnosticsGate,
    blockedPublicClaims: falseRecord(
      SCHEDULER_PUBLIC_TIMING_BLOCKED_PUBLIC_CLAIMS
    ),
    blockedTimingSemantics: createBlockedTimingSemanticsRecord(),
    requiredVariantIds: SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS,
    rows: timingRows,
    rowsByVariant: indexRowsByVariant(timingRows),
    sourcePackageMismatches: freezeArray(sourcePackageMismatches),
    boundaryDiagnosticsRowsById,
    boundaryDiagnosticsSourceMismatches: freezeArray(
      boundaryDiagnosticsSourceMismatches
    ),
    publicCompatibilityClaimIds: freezeArray(publicCompatibilityClaimIds),
    coverage: freezeRecord({
      defaultSchedulerEntrypointsBlocked: true,
      defaultSchedulerDeepCjsEntrypointsBlocked: true,
      mockSchedulerEntrypointsBlocked: true,
      mockSchedulerDeepCjsEntrypointsBlocked: true,
      postTaskEntrypointsBlocked: true,
      postTaskDeepCjsEntrypointsBlocked: true,
      nativeRuntimeCompatibilityBlocked: true,
      publicCallbackExecutionCompatibilityBlocked: true,
      reactRootActNativePackageCompatibilityBlocked: true,
      packageCompatibilityBlocked: true
    }),
    violations: freezeArray(violations)
  });
}

function createAuthoritativeVariantCurrentnessGate() {
  const gate = evaluateSchedulerVariantCurrentnessGate();
  if (gate !== null && typeof gate === "object") {
    moduleOwnedVariantCurrentnessGates.add(gate);
  }
  return gate;
}

function createAuthoritativeBoundaryDiagnosticsGate() {
  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate();
  if (gate !== null && typeof gate === "object") {
    moduleOwnedBoundaryDiagnosticsGates.add(gate);
  }
  return gate;
}

function readEvaluatorOptions(options) {
  if (options === undefined) {
    return freezeRecord({
      callerProvidedVariantCurrentnessGate: false,
      variantCurrentnessGate: null,
      callerProvidedBoundaryDiagnosticsGate: false,
      boundaryDiagnosticsGate: null,
      violationIds: freezeArray([])
    });
  }
  if (options === null || typeof options !== "object") {
    return freezeRecord({
      callerProvidedVariantCurrentnessGate: true,
      variantCurrentnessGate: null,
      callerProvidedBoundaryDiagnosticsGate: true,
      boundaryDiagnosticsGate: null,
      violationIds: freezeArray(["options.[[Object]]"])
    });
  }

  const violationIds = [];
  const variantCurrentnessGate = readEvaluatorOptionValue(
    options,
    "variantCurrentnessGate",
    violationIds
  );
  const boundaryDiagnosticsGate = readEvaluatorOptionValue(
    options,
    "boundaryDiagnosticsGate",
    violationIds
  );

  return freezeRecord({
    callerProvidedVariantCurrentnessGate: variantCurrentnessGate.present,
    variantCurrentnessGate: variantCurrentnessGate.value,
    callerProvidedBoundaryDiagnosticsGate: boundaryDiagnosticsGate.present,
    boundaryDiagnosticsGate: boundaryDiagnosticsGate.value,
    violationIds: freezeArray(violationIds)
  });
}

function readEvaluatorOptionValue(options, key, violationIds) {
  const descriptorResult = safeOwnPropertyDescriptor(options, key, "options");
  if (!descriptorResult.ok) {
    violationIds.push(descriptorResult.id);
    return freezeRecord({
      present: true,
      value: null
    });
  }

  const descriptor = descriptorResult.descriptor;
  if (descriptor === undefined) {
    return freezeRecord({
      present: false,
      value: null
    });
  }
  if (!("value" in descriptor)) {
    violationIds.push(`options.${key}.[[Accessor]]`);
    return freezeRecord({
      present: true,
      value: null
    });
  }

  return freezeRecord({
    present: true,
    value: descriptor.value ?? null
  });
}

function readVariantCurrentnessGate(value, path, violationIds) {
  const normalizedGate = normalizePlainDataObject(value, path, violationIds);
  if (
    normalizedGate.rowsByVariant === null ||
    typeof normalizedGate.rowsByVariant !== "object"
  ) {
    violationIds.push(`${path}.rowsByVariant.[[Object]]`);
  }

  return freezeRecord({
    gateId: primitiveGateValue(normalizedGate.gateId),
    status: primitiveGateValue(normalizedGate.status),
    compatibilityClaimed: primitiveGateValue(
      normalizedGate.compatibilityClaimed
    ),
    rowsByVariant:
      normalizedGate.rowsByVariant !== null &&
      typeof normalizedGate.rowsByVariant === "object"
        ? normalizedGate.rowsByVariant
        : null
  });
}

function readBoundaryDiagnosticsGate(value, path, violationIds) {
  const normalizedGate = normalizePlainDataObject(value, path, violationIds);
  const violationCount = readArrayLength(
    normalizedGate.violations,
    `${path}.violations`,
    violationIds
  );

  return freezeRecord({
    gateId: primitiveGateValue(normalizedGate.gateId),
    status: primitiveGateValue(normalizedGate.status),
    sourceCurrentnessRecognized: primitiveGateValue(
      normalizedGate.sourceCurrentnessRecognized
    ),
    sourceGateContextRecognized: primitiveGateValue(
      normalizedGate.sourceGateContextRecognized
    ),
    entrypointVariantBoundariesRecognized: primitiveGateValue(
      normalizedGate.entrypointVariantBoundariesRecognized
    ),
    diagnosticIdentitiesRecognized: primitiveGateValue(
      normalizedGate.diagnosticIdentitiesRecognized
    ),
    queueIdentitiesRecognized: primitiveGateValue(
      normalizedGate.queueIdentitiesRecognized
    ),
    unsupportedStatusRecognized: primitiveGateValue(
      normalizedGate.unsupportedStatusRecognized
    ),
    rootNativeVariantReuseRejected: primitiveGateValue(
      normalizedGate.rootNativeVariantReuseRejected
    ),
    publicCompatibilityClaimsBlocked: primitiveGateValue(
      normalizedGate.publicCompatibilityClaimsBlocked
    ),
    compatibilityClaimed: primitiveGateValue(
      normalizedGate.compatibilityClaimed
    ),
    violationCount,
    rows: normalizedGate.rows ?? null
  });
}

function readBoundaryDiagnosticsRowsById(rowsValue, path, violationIds) {
  const rowsById = {};
  const isArrayResult = safeIsArray(rowsValue, path);
  if (!isArrayResult.ok) {
    violationIds.push(isArrayResult.id);
    return freezeRecord(rowsById);
  }
  if (!isArrayResult.isArray) {
    violationIds.push(`${path}.[[Array]]`);
    return freezeRecord(rowsById);
  }

  const lengthResult = safeReadProperty(rowsValue, "length", `${path}.length`);
  if (!lengthResult.ok) {
    violationIds.push(lengthResult.id);
    return freezeRecord(rowsById);
  }
  if (!Number.isSafeInteger(lengthResult.value) || lengthResult.value < 0) {
    violationIds.push(`${path}.length`);
    return freezeRecord(rowsById);
  }

  for (let index = 0; index < lengthResult.value; index += 1) {
    const rowResult = safeReadProperty(rowsValue, index, `${path}[${index}]`);
    if (!rowResult.ok) {
      violationIds.push(rowResult.id);
      continue;
    }
    const row = normalizeBoundaryDiagnosticsRow(
      rowResult.value,
      `${path}[${index}]`,
      violationIds
    );
    if (typeof row.rowId === "string") {
      rowsById[row.rowId] = row;
    }
  }

  for (const rowId of SCHEDULER_PUBLIC_TIMING_REQUIRED_BOUNDARY_DIAGNOSTIC_ROW_IDS) {
    if (!Object.hasOwn(rowsById, rowId)) {
      violationIds.push(`${path}.${rowId}.[[Missing]]`);
    }
  }

  return freezeRecord(rowsById);
}

function normalizeBoundaryDiagnosticsRow(value, path, violationIds) {
  const source = normalizePlainDataObject(value, path, violationIds);
  const rowId = source.rowId;
  const variantId = source.variantId;
  const selectedCjsVariantId = source.selectedCjsVariantId;
  if (typeof rowId !== "string") {
    violationIds.push(`${path}.rowId.[[String]]`);
  }
  if (typeof variantId !== "string") {
    violationIds.push(`${path}.variantId.[[String]]`);
  }
  if (
    selectedCjsVariantId !== null &&
    typeof selectedCjsVariantId !== "string"
  ) {
    violationIds.push(`${path}.selectedCjsVariantId.[[StringOrNull]]`);
  }

  return freezeRecord({
    rowId: typeof rowId === "string" ? rowId : null,
    variantId: typeof variantId === "string" ? variantId : null,
    selectedCjsVariantId:
      typeof selectedCjsVariantId === "string" ? selectedCjsVariantId : null,
    sourceCurrentness: normalizeSourcePackageRow(
      source.sourceCurrentness,
      `${path}.sourceCurrentness`,
      violationIds
    ),
    selectedSourceCurrentness: normalizeSourcePackageRow(
      source.selectedSourceCurrentness,
      `${path}.selectedSourceCurrentness`,
      violationIds
    )
  });
}

function readSourcePackageRowsByVariant(rowsByVariant, path, violationIds) {
  const rows = {};
  if (rowsByVariant === null || typeof rowsByVariant !== "object") {
    violationIds.push(`${path}.[[Object]]`);
    return freezeRecord(rows);
  }

  const ownKeysResult = safeOwnKeys(rowsByVariant, path);
  if (!ownKeysResult.ok) {
    violationIds.push(ownKeysResult.id);
  } else {
    const required = new Set(SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS);
    for (const key of ownKeysResult.keys) {
      const keyName = propertyKeyName(key);
      if (!required.has(keyName)) {
        violationIds.push(`${path}.${formatPathKey(key)}.[[Unexpected]]`);
      }
    }
  }

  for (const variantId of SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS) {
    const rowPath = `${path}.${variantId}`;
    const descriptorResult = safeOwnPropertyDescriptor(
      rowsByVariant,
      variantId,
      path
    );
    if (!descriptorResult.ok) {
      violationIds.push(descriptorResult.id);
      continue;
    }
    const descriptor = descriptorResult.descriptor;
    if (descriptor === undefined) {
      violationIds.push(`${rowPath}.[[Missing]]`);
      continue;
    }
    if (!("value" in descriptor)) {
      violationIds.push(`${rowPath}.[[Accessor]]`);
      continue;
    }
    rows[variantId] = normalizeSourcePackageRow(
      descriptor.value,
      rowPath,
      violationIds
    );
  }

  return freezeRecord(rows);
}

function normalizeSourcePackageRow(value, path, violationIds) {
  const source = normalizePlainDataObject(value, path, violationIds);
  const row = {};

  validateExactStringFieldSet(
    source,
    path,
    sourceRequiredFieldNames,
    sourceRequiredFieldNameSet,
    violationIds
  );

  for (const field of sourceStringFields) {
    const fieldValue = source[field];
    if (typeof fieldValue !== "string") {
      violationIds.push(`${path}.${field}.[[String]]`);
    }
    row[field] = typeof fieldValue === "string" ? fieldValue : null;
  }

  for (const field of sourceNullableStringFields) {
    const fieldValue = source[field];
    if (fieldValue !== null && typeof fieldValue !== "string") {
      violationIds.push(`${path}.${field}.[[StringOrNull]]`);
    }
    row[field] = typeof fieldValue === "string" ? fieldValue : null;
  }

  for (const field of sourceBooleanFields) {
    const fieldValue = source[field];
    if (typeof fieldValue !== "boolean") {
      violationIds.push(`${path}.${field}.[[Boolean]]`);
    }
    row[field] = typeof fieldValue === "boolean" ? fieldValue : null;
  }

  for (const field of sourceStringArrayFields) {
    row[field] = readStringArray(source[field], `${path}.${field}`, violationIds);
  }

  for (const field of sourceBooleanRecordFields) {
    row[field] = readBooleanRecord(
      source[field],
      `${path}.${field}`,
      violationIds
    );
  }

  return freezeRecord(row);
}

function validateExactStringFieldSet(
  source,
  path,
  requiredFieldNames,
  requiredFieldNameSet,
  violationIds
) {
  const seen = new Set();

  for (const key of Reflect.ownKeys(source)) {
    const keyName = propertyKeyName(key);
    if (typeof key !== "string" || !requiredFieldNameSet.has(keyName)) {
      violationIds.push(`${path}.${formatPathKey(key)}.[[Unexpected]]`);
      continue;
    }
    seen.add(keyName);
  }

  for (const field of requiredFieldNames) {
    if (!seen.has(field)) {
      violationIds.push(`${path}.${field}.[[Missing]]`);
    }
  }
}

function normalizePlainDataObject(value, path, violationIds) {
  const normalized = {};
  if (value === null || typeof value !== "object") {
    violationIds.push(`${path}.[[Object]]`);
    return normalized;
  }

  const ownKeysResult = safeOwnKeys(value, path);
  if (!ownKeysResult.ok) {
    violationIds.push(ownKeysResult.id);
    return normalized;
  }

  for (const key of ownKeysResult.keys) {
    const descriptorResult = safeOwnPropertyDescriptor(value, key, path);
    if (!descriptorResult.ok) {
      violationIds.push(descriptorResult.id);
      continue;
    }
    const descriptor = descriptorResult.descriptor;
    if (descriptor === undefined) {
      continue;
    }
    if (!("value" in descriptor)) {
      violationIds.push(`${path}.${formatPathKey(key)}.[[Accessor]]`);
      continue;
    }
    Object.defineProperty(normalized, key, {
      configurable: true,
      enumerable: true,
      value: descriptor.value,
      writable: true
    });
  }

  return normalized;
}

function readStringArray(value, path, violationIds) {
  const isArrayResult = safeIsArray(value, path);
  if (!isArrayResult.ok) {
    violationIds.push(isArrayResult.id);
    return freezeArray([]);
  }
  if (!isArrayResult.isArray) {
    violationIds.push(`${path}.[[Array]]`);
    return freezeArray([]);
  }

  const lengthResult = safeReadProperty(value, "length", `${path}.length`);
  if (!lengthResult.ok) {
    violationIds.push(lengthResult.id);
    return freezeArray([]);
  }
  if (!Number.isSafeInteger(lengthResult.value) || lengthResult.value < 0) {
    violationIds.push(`${path}.length`);
    return freezeArray([]);
  }

  const values = [];
  for (let index = 0; index < lengthResult.value; index += 1) {
    const itemResult = safeReadProperty(value, index, `${path}[${index}]`);
    if (!itemResult.ok) {
      violationIds.push(itemResult.id);
      continue;
    }
    if (typeof itemResult.value !== "string") {
      violationIds.push(`${path}[${index}].[[String]]`);
      continue;
    }
    values.push(itemResult.value);
  }
  return freezeArray(values);
}

function readBooleanRecord(value, path, violationIds) {
  const source = normalizePlainDataObject(value, path, violationIds);
  const row = {};
  const keys = [];

  for (const key of Reflect.ownKeys(source)) {
    if (typeof key !== "string") {
      violationIds.push(`${path}.${formatPathKey(key)}.[[StringKey]]`);
      continue;
    }
    keys.push(key);
  }

  keys.sort();
  for (const key of keys) {
    const fieldValue = source[key];
    if (typeof fieldValue !== "boolean") {
      violationIds.push(`${path}.${formatPathKey(key)}.[[Boolean]]`);
    }
    row[key] = typeof fieldValue === "boolean" ? fieldValue : null;
  }

  return freezeRecord(row);
}

function readArrayLength(value, path, violationIds) {
  const isArrayResult = safeIsArray(value, path);
  if (!isArrayResult.ok) {
    violationIds.push(isArrayResult.id);
    return null;
  }
  if (!isArrayResult.isArray) {
    violationIds.push(`${path}.[[Array]]`);
    return null;
  }

  const lengthResult = safeReadProperty(value, "length", `${path}.length`);
  if (!lengthResult.ok) {
    violationIds.push(lengthResult.id);
    return null;
  }
  if (!Number.isSafeInteger(lengthResult.value) || lengthResult.value < 0) {
    violationIds.push(`${path}.length`);
    return null;
  }
  return lengthResult.value;
}

function createTimingBlockerRows({
  expectedRowsByVariant,
  actualRowsByVariant,
  sourcePackageMismatchVariantIds,
  sourceGateContextRecognized
}) {
  return freezeArray(
    SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS.map((variantId) => {
      const expected = expectedRowsByVariant[variantId] ?? null;
      const actual = actualRowsByVariant[variantId] ?? null;
      const sourcePackageRowValidated =
        actual !== null &&
        !sourcePackageMismatchVariantIds.has(variantId) &&
        sourceGateContextRecognized;

      return createTimingBlockerRow({
        variantId,
        expected,
        actual,
        sourcePackageRowValidated,
        sourceGateContextRecognized
      });
    })
  );
}

function createTimingBlockerRow({
  variantId,
  expected,
  actual,
  sourcePackageRowValidated,
  sourceGateContextRecognized
}) {
  const source = expected ?? actual ?? {};
  const surface = timingSurfaceForClassification(source.classification);
  return freezeRecord({
    rowId: `${variantId}:public-scheduler-timing-blocker`,
    rowKind: "private-scheduler-public-timing-blocker-currentness",
    variantId,
    classification: source.classification ?? null,
    surface,
    entrypoint: source.packagePath ?? null,
    canonicalEntrypoint: source.canonicalEntrypoint ?? null,
    sourceFile: source.sourceFile ?? null,
    physicalEntrypoint: source.physicalEntrypoint ?? null,
    modeId: source.modeId ?? null,
    runtimeMode: source.runtimeMode ?? null,
    nodeEnv: source.nodeEnv ?? null,
    packageName: source.packageName ?? null,
    packageVersion: source.packageVersion ?? null,
    compatibilityTarget: source.compatibilityTarget ?? null,
    directDeepCjsImport: source.directDeepCjsImport ?? null,
    boundaryKind: source.boundaryKind ?? null,
    sourceSha256: source.sourceSha256 ?? null,
    sourcePackageRowValidated,
    sourceGateContextRecognized,
    acceptedVariantCurrentnessEvidenceConsumed: sourcePackageRowValidated,
    publicTimingSemanticsBlocked: true,
    separateOracleRequiredForTimingCompatibility: true,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicSchedulerCallbackExecutionClaimed: false,
    publicSchedulerCancellationCompatibilityClaimed: false,
    publicSchedulerYieldCompatibilityClaimed: false,
    publicSchedulerCurrentEventBehaviorCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicNativeCompatibilityClaimed: false,
    publicPostTaskCompatibilityClaimed: false,
    publicMockSchedulerCompatibilityClaimed: false,
    publicPackageCompatibilityClaimed: false,
    compatibilityClaimed: false,
    blockedTimingSemantics: createBlockedTimingSemanticsRecord(),
    oracleBackedTimingSemantics: falseRecord(
      SCHEDULER_PUBLIC_TIMING_BLOCKED_SEMANTICS
    ),
    blockedPublicClaims: falseRecord(
      SCHEDULER_PUBLIC_TIMING_BLOCKED_PUBLIC_CLAIMS
    ),
    unsupportedStatus: freezeRecord({
      status: "public-scheduler-timing-semantics-blocked",
      unstableScheduleCallbackCompatibilityClaimed: false,
      callbackExecutionCompatibilityClaimed: false,
      cancellationCompatibilityClaimed: false,
      yieldedValuesCompatibilityClaimed: false,
      mockTimingCompatibilityClaimed: false,
      postTaskTimingCompatibilityClaimed: false,
      priorityCurrentEventBehaviorCompatibilityClaimed: false,
      rootActNativePackageCompatibilityClaimed: false,
      nativeRuntimeExecutionClaimed: false,
      packageCompatibilityClaimed: false
    })
  });
}

function timingSurfaceForClassification(classification) {
  switch (classification) {
    case "root":
      return "default";
    case "mock":
      return "mock";
    case "post_task":
      return "postTask";
    case "native":
      return "native-blocked-context";
    default:
      return "unknown";
  }
}

function primitiveGateValue(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    typeof value === "number"
  ) {
    return value ?? null;
  }
  return null;
}

function createBlockedTimingSemanticsRecord() {
  return freezeRecord(
    Object.fromEntries(
      SCHEDULER_PUBLIC_TIMING_BLOCKED_SEMANTICS.map((semanticId) => [
        semanticId,
        freezeRecord({
          blocked: true,
          oracleBacked: false,
          compatibilityClaimed: false
        })
      ])
    )
  );
}

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function indexRowsByVariant(rows) {
  return freezeRecord(Object.fromEntries(rows.map((row) => [row.variantId, row])));
}

function findPublicClaimIds(value, path, seen = new Set()) {
  const ids = [];
  if (!claimCarrierIsInspectable(value)) {
    return ids;
  }
  if (seen.has(value)) {
    return ids;
  }
  seen.add(value);
  ids.push(...findInheritedPublicClaimIds(value, path));

  const ownKeysResult = safeOwnKeys(value, path);
  if (!ownKeysResult.ok) {
    ids.push(ownKeysResult.id);
    return ids;
  }

  ids.push(...findHiddenPublicClaimGetIds(value, path, ownKeysResult.keys));

  for (const key of ownKeysResult.keys) {
    const keyName = propertyKeyName(key);
    const descriptorResult = safeOwnPropertyDescriptor(value, key, path);
    if (!descriptorResult.ok) {
      ids.push(descriptorResult.id);
      continue;
    }
    const descriptor = descriptorResult.descriptor;
    const nextPath = `${path}.${formatPathKey(key)}`;
    if (descriptor === undefined) {
      if (publicClaimKeyIsBlocked(keyName)) {
        ids.push(nextPath);
      }
      continue;
    }
    if (
      publicClaimKeyIsBlocked(keyName) &&
      !descriptorValueIsAcceptedFalse(descriptor)
    ) {
      ids.push(nextPath);
    }
    if ("value" in descriptor) {
      ids.push(...findPublicClaimIds(descriptor.value, nextPath, seen));
    }
  }

  return ids;
}

function findInheritedPublicClaimIds(value, path) {
  const ids = [];
  let prototypeResult = safePrototypeOf(value, path);
  let depth = 0;

  while (prototypeResult.ok && prototypeResult.prototype !== null) {
    const prototype = prototypeResult.prototype;
    const prototypePath = `${path}.[[Prototype]]`;
    const ownKeysResult = safeOwnKeys(prototype, prototypePath);
    if (!ownKeysResult.ok) {
      ids.push(ownKeysResult.id);
      return ids;
    }
    for (const key of ownKeysResult.keys) {
      const keyName = propertyKeyName(key);
      if (!publicClaimKeyIsBlocked(keyName)) {
        continue;
      }
      const descriptorResult = safeOwnPropertyDescriptor(
        prototype,
        key,
        prototypePath
      );
      if (!descriptorResult.ok) {
        ids.push(descriptorResult.id);
        continue;
      }
      if (!descriptorValueIsAcceptedFalse(descriptorResult.descriptor)) {
        ids.push(`${prototypePath}.${formatPathKey(key)}`);
      }
    }

    depth += 1;
    if (depth > 32) {
      ids.push(`${path}.[[PrototypeDepth]]`);
      return ids;
    }
    prototypeResult = safePrototypeOf(prototype, prototypePath);
  }

  if (!prototypeResult.ok) {
    ids.push(prototypeResult.id);
  }
  return ids;
}

function findHiddenPublicClaimGetIds(value, path, ownKeys) {
  const ids = [];
  const ownKeyNames = new Set(ownKeys.map((key) => propertyKeyName(key)));
  for (const claimKey of hiddenPublicClaimProbeKeys) {
    if (ownKeyNames.has(claimKey)) {
      continue;
    }
    const readResult = safeReadProperty(value, claimKey, `${path}.${claimKey}`);
    if (!readResult.ok) {
      ids.push(readResult.id);
      continue;
    }
    if (readResult.value !== undefined && readResult.value !== false) {
      ids.push(`${path}.${claimKey}`);
    }
  }
  return ids;
}

function publicClaimKeyIsBlocked(keyName) {
  if (allowedPublicClaimKeyPatterns.some((pattern) => pattern.test(keyName))) {
    return false;
  }
  return (
    blockedPublicClaimKeySet.has(keyName) ||
    inferredPublicClaimKeyPattern.test(keyName) ||
    inferredCompatibilityAliasKeyPattern.test(keyName)
  );
}

function descriptorValueIsAcceptedFalse(descriptor) {
  return (
    descriptor !== undefined &&
    Object.prototype.hasOwnProperty.call(descriptor, "value") &&
    descriptor.value === false
  );
}

function claimCarrierIsInspectable(value) {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function")
  );
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
      if (childPath !== null) {
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
    if (childPath !== null) {
      return childPath;
    }
  }
  return null;
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

function safeOwnKeys(value, path) {
  try {
    return {
      ok: true,
      keys: Reflect.ownKeys(value)
    };
  } catch {
    return {
      ok: false,
      id: `${path}.[[OwnKeys]]`
    };
  }
}

function safeOwnPropertyDescriptor(value, key, path) {
  try {
    return {
      ok: true,
      descriptor: Object.getOwnPropertyDescriptor(value, key)
    };
  } catch {
    return {
      ok: false,
      id: `${path}.${formatPathKey(key)}.[[Descriptor]]`
    };
  }
}

function safePrototypeOf(value, path) {
  try {
    return {
      ok: true,
      prototype: Object.getPrototypeOf(value)
    };
  } catch {
    return {
      ok: false,
      id: `${path}.[[Prototype]]`
    };
  }
}

function safeReadProperty(value, key, path) {
  try {
    return {
      ok: true,
      value: value[key]
    };
  } catch {
    return {
      ok: false,
      id: `${path}.[[Get]]`
    };
  }
}

function safeIsArray(value, path) {
  try {
    return {
      ok: true,
      isArray: Array.isArray(value)
    };
  } catch {
    return {
      ok: false,
      id: `${path}.[[ArrayIsArray]]`
    };
  }
}

function propertyKeyName(key) {
  if (typeof key === "symbol") {
    return key.description ?? String(key);
  }
  return String(key);
}

function formatPathKey(key) {
  if (typeof key === "symbol") {
    return String(key);
  }
  return String(key);
}

function freezeArray(value) {
  return Object.freeze([...value]);
}

function freezeRecord(value) {
  return Object.freeze(value);
}
