import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readSchedulerMockPrivateActQueueFlushDiagnostics } from "./scheduler-mock-oracle.mjs";
import { inspectSchedulerPostTaskPriorityDiagnostics } from "./scheduler-post-task-oracle.mjs";
import {
  SCHEDULER_VARIANT_CURRENTNESS_GATE_ID,
  SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS,
  evaluateSchedulerVariantCurrentnessGate
} from "./scheduler-variant-oracle.mjs";

const require = createRequire(import.meta.url);
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const schedulerPackageRoot = path.join(workspaceRoot, "packages/scheduler");
const schedulerMockEntrypoint = path.join(
  schedulerPackageRoot,
  "unstable_mock.js"
);
const schedulerMockCjsEntrypoints = Object.freeze({
  development: path.join(
    schedulerPackageRoot,
    "cjs/scheduler-unstable_mock.development.js"
  ),
  production: path.join(
    schedulerPackageRoot,
    "cjs/scheduler-unstable_mock.production.js"
  )
});

const mockDiagnosticsExport =
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__";
const postTaskDiagnosticsExport =
  "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__";
const postTaskDiagnosticsSymbolDescription =
  "fast-react.scheduler.unstable_post_task.priority-diagnostics";
const sourceOwnedDiagnosticIdentityByObject = new WeakMap();
const moduleOwnedClaimContainers = new WeakSet();
let nextSourceOwnedDiagnosticIdentitySequence = 1;

export const SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_ID =
  "scheduler-variant-boundary-diagnostics-currentness-gate-949-1";
export const SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_STATUS =
  "blocked-public-scheduler-timing-with-current-mock-post-task-boundary-diagnostics";
export const SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS =
  "blocked-public-scheduler-timing-with-stale-variant-boundary-diagnostics";
export const SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_REPORT_KIND =
  "scheduler-variant-boundary-diagnostics-currentness-report";
export const SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_REPORT_ID =
  "scheduler-variant-boundary-diagnostics-currentness-report-949-1";

const requiredRowIds = Object.freeze([
  "scheduler-mock-root-development-boundary-diagnostics",
  "scheduler-mock-root-production-boundary-diagnostics",
  "scheduler-mock-cjs-development-boundary-diagnostics",
  "scheduler-mock-cjs-production-boundary-diagnostics",
  "scheduler-post-task-development-boundary-diagnostics",
  "scheduler-post-task-production-boundary-diagnostics"
]);

const requiredSourceVariantIds = Object.freeze([
  "scheduler-unstable-mock-root",
  "scheduler-cjs-unstable-mock-development",
  "scheduler-cjs-unstable-mock-production",
  "scheduler-unstable-post-task-wrapper",
  "scheduler-cjs-unstable-post-task-development",
  "scheduler-cjs-unstable-post-task-production"
]);

const requiredSourceRowStringFields = Object.freeze([
  "packagePath",
  "canonicalEntrypoint",
  "physicalEntrypoint",
  "sourceFile",
  "sourceSha256"
]);

const boundaryDiagnosticsReportRejectionId =
  "variantCurrentnessGate.[[BoundaryDiagnosticsReport]]";
const rejectedSourceGateReportStatus =
  "rejected-malformed-scheduler-variant-currentness-gate";

const blockedPublicClaimKeys = Object.freeze([
  "compatibilityClaimed",
  "publicCompatibilityClaimed",
  "publicSchedulerCompatibilityClaimed",
  "publicSchedulerTimingCompatibilityClaimed",
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
  "publicActReady",
  "publicReactActReady",
  "publicTestUtilsActReady",
  "publicActCompatibilityClaimed",
  "publicActTimingCompatibilityClaimed",
  "publicActWarningCompatibilityClaimed",
  "publicTestUtilsActCompatibilityClaimed",
  "publicWarningCompatibilityClaimed",
  "publicRootSchedulerCompatibilityClaimed",
  "publicRootCompatibilityClaimed",
  "publicReactRootCompatibilityClaimed",
  "publicRootRenderCompatibilityClaimed",
  "publicRootUpdateCompatibilityClaimed",
  "publicRootUnmountCompatibilityClaimed",
  "publicRootBehaviorReady",
  "publicRootExecutionClaimed",
  "publicRootExecution",
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
  "publicActBehaviorClaimed",
  "publicActExecution",
  "publicActPassiveDrain",
  "publicFlushSyncExecution",
  "publicDomMutation",
  "publicEffectExecution",
  "publicRendererWork",
  "rendererExecutionReady",
  "effectsExecutionReady",
  "reactActBehaviorClaimed",
  "publicPassiveEffectCompatibilityClaimed",
  "publicPassiveEffectsCompatibilityClaimed",
  "acceptsTopLevelDelayedActRootWorkAsPublicActEvidence",
  "publicDelayedRendererRootAdmissionClaimed",
  "publicFlushHelperValidatorExposed",
  "routesAcceptedMockSchedulerFlushHelperMetadata",
  "schedulerTimingAdmissionClaimed",
  "schedulerDelayedActRootAdmissionClaimed",
  "schedulerDelayedRendererRootAdmissionClaimed",
  "packageCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "schedulerPackageCompatibilityClaimed",
  "packageSurfaceChanged",
  "newPublicExportsAdded",
  "publicDiagnosticExportAdded",
  "publicTestRendererCompatibilityClaimed",
  "publicSchedulerTaskCompatibilityClaimed",
  "nativeCompatibilityClaimed",
  "publicNativeCompatibilityClaimed",
  "publicNativeCompatibility",
  "schedulerNativeCompatibilityClaimed",
  "nativeAliasAccepted",
  "nativeExecution",
  "nativeRuntimeExecution",
  "publicNativeExecution",
  "publicNativeExecutionClaimed",
  "nativeRuntimeCompatibilityClaimed",
  "nativePublicBehaviorClaimed",
  "postTaskCompatibilityClaimed",
  "publicPostTaskCompatibilityClaimed",
  "schedulerPostTaskCompatibilityClaimed",
  "postTaskAliasAccepted",
  "browserPostTaskCompatibilityClaimed",
  "browserTaskOrderingCompatibilityClaimed",
  "postTaskPublicBehaviorClaimed",
  "rendererWorkExecuted",
  "reconcilerWorkExecuted",
  "nativeRendererWorkExecuted",
  "mockSchedulerCompatibilityClaimed",
  "publicMockSchedulerCompatibilityClaimed",
  "mockSchedulerPublicBehaviorClaimed",
  "schedulerMockCompatibilityClaimed",
  "mockAliasAccepted",
  "packageAliasAccepted",
  "packageExecution",
  "rootAliasAccepted",
  "actAliasAccepted",
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
  "publicEffectCompatibilityClaimed"
]);
const allowedPublicClaimKeyPatterns = Object.freeze([/Blocked$/]);
const inferredPublicClaimKeyPattern =
  /^public[A-Z].*(?:Compatibility|CompatibilityClaimed|Claimed|Ready|Execution|Behavior|Drain|Flush|Mutation|RendererWork|AliasAccepted|Available|Executed)$/;
const inferredPublicClaimProbeStems = Object.freeze([
  "New",
  "Scheduler",
  "SchedulerTiming",
  "SchedulerFlush",
  "SchedulerFlushHelper",
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
  "TestUtilsAct",
  "TestRenderer",
  "Act",
  "Root",
  "RootRender",
  "RootUpdate",
  "RootUnmount",
  "Effect",
  "PassiveEffect",
  "PassiveEffects",
  "Renderer",
  "Native",
  "NativeRuntime",
  "Package",
  "FlushSync",
  "Render",
  "Dom",
  "Warning",
  "Browser"
]);
const inferredPublicClaimProbeSuffixes = Object.freeze([
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
  "Mutation",
  "RendererWork",
  "AliasAccepted",
  "Available",
  "Executed"
]);
const hiddenPublicClaimProbeKeys = freezeArray([
  ...new Set([
    ...blockedPublicClaimKeys,
    ...inferredPublicClaimProbeStems.flatMap((stem) =>
      inferredPublicClaimProbeSuffixes.map((suffix) => `public${stem}${suffix}`)
    )
  ])
]);

export function createSchedulerVariantBoundaryDiagnosticsReport(options = {}) {
  const factoryOptions = readBoundaryDiagnosticsFactoryOptions(options);
  const variantCurrentnessGate = factoryOptions.variantCurrentnessGate;
  const sourceGate = readVariantCurrentnessGateForBoundaryReport(
    variantCurrentnessGate
  );
  const sourceRowRejectionIds = [];
  const rowsByVariant = readBoundarySourceRowsByVariant(
    sourceGate.rowsByVariant,
    "variantCurrentnessGate.rowsByVariant",
    sourceRowRejectionIds
  );
  const sourceGatePublicClaimIds = findPublicClaimIds(
    variantCurrentnessGate,
    "variantCurrentnessGate"
  );
  const sourceGateUntrustedClaimContainerIds = findUntrustedClaimContainerIds(
    variantCurrentnessGate,
    "variantCurrentnessGate"
  );
  const rejectionIds = [
    ...factoryOptions.violationIds,
    ...sourceGate.rejectionIds,
    ...sourceRowRejectionIds,
    ...sourceGatePublicClaimIds,
    ...sourceGateUntrustedClaimContainerIds
  ];

  if (sourceGate.rowsByVariant === null || rejectionIds.length > 0) {
    return createBoundaryDiagnosticsReportRecord({
      sourceGate,
      rows: freezeArray([]),
      rejectionIds
    });
  }

  try {
    return createBoundaryDiagnosticsReportRecord({
      sourceGate,
      rows: createBoundaryDiagnosticRows(rowsByVariant),
      rejectionIds
    });
  } catch {
    return createBoundaryDiagnosticsReportRecord({
      sourceGate,
      rows: freezeArray([]),
      rejectionIds: [
        ...rejectionIds,
        "variantCurrentnessGate.rowsByVariant.[[BoundaryRows]]"
      ]
    });
  }
}

function createBoundaryDiagnosticsReportRecord({
  sourceGate,
  rows,
  rejectionIds
}) {
  const sourceGateAcceptedAsCurrentPrivateContext =
    rejectionIds.length === 0 &&
    sourceGate.status === SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS &&
    sourceGate.compatibilityClaimed === false;
  const report = {
    schemaVersion: 1,
    reportKind: SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_REPORT_KIND,
    reportId: SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_REPORT_ID,
    sourceGateId: sourceGate.gateId,
    sourceGateStatus: sourceGate.status,
    sourceGateAcceptedAsCurrentPrivateContext,
    rows,
    rowsById: indexRowsById(rows),
    publicSchedulerTimingCompatibilityClaimed: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicPackageCompatibilityClaimed: false,
    publicCompatibilityClaimed: false,
    publicPostTaskCompatibilityClaimed: false,
    publicMockSchedulerCompatibilityClaimed: false,
    compatibilityClaimed: false
  };

  if (rejectionIds.length > 0) {
    report.sourceGateReportStatus = rejectedSourceGateReportStatus;
    report.sourceGateReportRejectionIds =
      boundaryReportRejectionIds(rejectionIds);
  }

  return freezeRecord(report);
}

function createBoundaryDiagnosticRows(rowsByVariant) {
  return freezeArray([
    createMockRootBoundaryRow({
      nodeEnv: "development",
      rowsByVariant
    }),
    createMockRootBoundaryRow({
      nodeEnv: "production",
      rowsByVariant
    }),
    createMockCjsBoundaryRow({
      nodeEnv: "development",
      rowsByVariant
    }),
    createMockCjsBoundaryRow({
      nodeEnv: "production",
      rowsByVariant
    }),
    createPostTaskBoundaryRow({
      nodeEnv: "development",
      rowsByVariant
    }),
    createPostTaskBoundaryRow({
      nodeEnv: "production",
      rowsByVariant
    })
  ]);
}

function readVariantCurrentnessGateForBoundaryReport(variantCurrentnessGate) {
  const rejectionIds = [];
  const normalizedGate = normalizePlainDataObject(
    variantCurrentnessGate,
    "variantCurrentnessGate",
    rejectionIds
  );
  if (
    normalizedGate.rowsByVariant === null ||
    typeof normalizedGate.rowsByVariant !== "object"
  ) {
    rejectionIds.push("variantCurrentnessGate.rowsByVariant.[[Object]]");
  } else {
    const rowsArrayResult = safeIsArray(
      normalizedGate.rowsByVariant,
      "variantCurrentnessGate.rowsByVariant"
    );
    if (!rowsArrayResult.ok) {
      rejectionIds.push(rowsArrayResult.id);
    } else if (rowsArrayResult.isArray) {
      rejectionIds.push("variantCurrentnessGate.rowsByVariant.[[Record]]");
    }

    const rowsPrototypeResult = safePrototypeOf(
      normalizedGate.rowsByVariant,
      "variantCurrentnessGate.rowsByVariant"
    );
    if (!rowsPrototypeResult.ok) {
      rejectionIds.push(rowsPrototypeResult.id);
    } else if (
      rowsPrototypeResult.prototype !== Object.prototype &&
      rowsPrototypeResult.prototype !== null
    ) {
      rejectionIds.push("variantCurrentnessGate.rowsByVariant.[[Prototype]]");
    }
  }

  return freezeRecord({
    gateId: primitiveSourceGateValue(normalizedGate.gateId),
    status: primitiveSourceGateValue(normalizedGate.status),
    compatibilityClaimed: primitiveSourceGateValue(
      normalizedGate.compatibilityClaimed
    ),
    rowsByVariant:
      normalizedGate.rowsByVariant !== null &&
      typeof normalizedGate.rowsByVariant === "object"
        ? normalizedGate.rowsByVariant
        : null,
    rejectionIds: freezeArray(rejectionIds)
  });
}

function readBoundarySourceRowsByVariant(rowsByVariant, path, rejectionIds) {
  const rows = {};
  if (rowsByVariant === null || typeof rowsByVariant !== "object") {
    return freezeRecord(rows);
  }

  for (const variantId of requiredSourceVariantIds) {
    const rowPath = `${path}.${variantId}`;
    const rowDescriptorResult = safeOwnPropertyDescriptor(
      rowsByVariant,
      variantId,
      path
    );
    if (!rowDescriptorResult.ok) {
      rejectionIds.push(rowDescriptorResult.id);
      continue;
    }
    const descriptor = rowDescriptorResult.descriptor;
    if (descriptor === undefined) {
      rejectionIds.push(`${rowPath}.[[Missing]]`);
      continue;
    }
    if (!("value" in descriptor)) {
      rejectionIds.push(`${rowPath}.[[Accessor]]`);
      continue;
    }

    const normalizedRow = normalizePlainDataObject(
      descriptor.value,
      rowPath,
      rejectionIds
    );
    validateBoundarySourceRow(normalizedRow, rowPath, rejectionIds);
    rows[variantId] = Object.freeze(normalizedRow);
  }

  return freezeRecord(rows);
}

function validateBoundarySourceRow(row, path, rejectionIds) {
  for (const field of requiredSourceRowStringFields) {
    const descriptor = Object.getOwnPropertyDescriptor(row, field);
    if (
      descriptor === undefined ||
      !("value" in descriptor) ||
      typeof descriptor.value !== "string"
    ) {
      rejectionIds.push(`${path}.${field}.[[String]]`);
    }
  }
}

function primitiveSourceGateValue(value) {
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

function boundaryReportRejectionIds(rejectionIds) {
  return freezeArray(
    [...new Set([boundaryDiagnosticsReportRejectionId, ...rejectionIds])]
  );
}

function sourceGateReportRejectionIds(report) {
  if (report === null || typeof report !== "object") {
    return freezeArray([]);
  }
  const rejectionIdsPath = "report.sourceGateReportRejectionIds";
  const descriptorResult = safeOwnPropertyDescriptor(
    report,
    "sourceGateReportRejectionIds",
    "report"
  );
  if (!descriptorResult.ok) {
    return freezeArray([descriptorResult.id]);
  }
  const descriptor = descriptorResult.descriptor;
  if (descriptor === undefined) {
    const hasResult = safeHasProperty(
      report,
      "sourceGateReportRejectionIds",
      "report"
    );
    if (!hasResult.ok) {
      return freezeArray([hasResult.id]);
    }
    if (hasResult.has) {
      return freezeArray([`${rejectionIdsPath}.[[Inherited]]`]);
    }
    const hiddenReadResult = safeReadProperty(
      report,
      "sourceGateReportRejectionIds",
      rejectionIdsPath
    );
    if (!hiddenReadResult.ok) {
      return freezeArray([hiddenReadResult.id]);
    }
    if (hiddenReadResult.value !== undefined) {
      return freezeArray([`${rejectionIdsPath}.[[HiddenGet]]`]);
    }
    return freezeArray([]);
  }
  if (!("value" in descriptor)) {
    return freezeArray([`${rejectionIdsPath}.[[Accessor]]`]);
  }
  const rejectionIds = descriptor.value;
  const ids = [`${rejectionIdsPath}.[[Present]]`];
  const isArrayResult = safeIsArray(rejectionIds, rejectionIdsPath);
  if (!isArrayResult.ok) {
    return freezeArray([...ids, isArrayResult.id]);
  }
  if (!isArrayResult.isArray) {
    return freezeArray([...ids, `${rejectionIdsPath}.[[Array]]`]);
  }
  const filterResult = safeReadProperty(
    rejectionIds,
    "filter",
    `${rejectionIdsPath}.filter`
  );
  if (!filterResult.ok) {
    return freezeArray([...ids, filterResult.id]);
  }
  if (typeof filterResult.value !== "function") {
    return freezeArray([...ids, `${rejectionIdsPath}.filter.[[Function]]`]);
  }
  const lengthResult = safeReadProperty(
    rejectionIds,
    "length",
    `${rejectionIdsPath}.length`
  );
  if (!lengthResult.ok) {
    return freezeArray([...ids, lengthResult.id]);
  }
  if (!Number.isSafeInteger(lengthResult.value) || lengthResult.value < 0) {
    return freezeArray([...ids, `${rejectionIdsPath}.length`]);
  }

  for (let index = 0; index < lengthResult.value; index += 1) {
    const idResult = safeReadProperty(
      rejectionIds,
      index,
      `${rejectionIdsPath}[${index}]`
    );
    if (!idResult.ok) {
      ids.push(idResult.id);
      continue;
    }
    if (typeof idResult.value === "string") {
      ids.push(idResult.value);
    } else {
      ids.push(`${rejectionIdsPath}[${index}].[[String]]`);
    }
  }

  const hiddenIndexProbeKeys = [0, lengthResult.value, lengthResult.value + 1];
  for (const index of new Set(hiddenIndexProbeKeys)) {
    if (index < lengthResult.value) {
      continue;
    }
    const idResult = safeReadProperty(
      rejectionIds,
      index,
      `${rejectionIdsPath}[${index}]`
    );
    if (!idResult.ok) {
      ids.push(idResult.id);
      continue;
    }
    if (idResult.value !== undefined) {
      ids.push(`${rejectionIdsPath}[${index}].[[HiddenIndex]]`);
    }
  }
  return freezeArray(ids);
}

function findSuppliedVariantCurrentnessGatePublicClaimIds(
  variantCurrentnessGate
) {
  if (variantCurrentnessGate === null) {
    return freezeArray([]);
  }
  return freezeArray(
    findPublicClaimIds(variantCurrentnessGate, "variantCurrentnessGate")
  );
}

function findSuppliedVariantCurrentnessGateUntrustedClaimContainerIds(
  variantCurrentnessGate
) {
  if (variantCurrentnessGate === null) {
    return freezeArray([]);
  }
  return freezeArray(
    findUntrustedClaimContainerIds(
      variantCurrentnessGate,
      "variantCurrentnessGate"
    )
  );
}

function readBoundaryDiagnosticsFactoryOptions(options) {
  if (options === undefined) {
    return freezeRecord({
      variantCurrentnessGate: markModuleOwnedClaimContainerTree(
        evaluateSchedulerVariantCurrentnessGate()
      ),
      violationIds: freezeArray([])
    });
  }
  if (options === null || typeof options !== "object") {
    return freezeRecord({
      variantCurrentnessGate: null,
      violationIds: freezeArray(["options.[[Object]]"])
    });
  }

  const publicClaimIds = findPublicClaimIds(options, "options");
  const descriptorResult = safeOwnPropertyDescriptor(
    options,
    "variantCurrentnessGate",
    "options"
  );
  if (!descriptorResult.ok) {
    return freezeRecord({
      variantCurrentnessGate: null,
      violationIds: freezeArray([...publicClaimIds, descriptorResult.id])
    });
  }

  const descriptor = descriptorResult.descriptor;
  if (descriptor === undefined) {
    const hasResult = safeHasProperty(
      options,
      "variantCurrentnessGate",
      "options"
    );
    if (!hasResult.ok) {
      return freezeRecord({
        variantCurrentnessGate: null,
        violationIds: freezeArray([...publicClaimIds, hasResult.id])
      });
    }
    if (hasResult.has) {
      return freezeRecord({
        variantCurrentnessGate: null,
        violationIds: freezeArray([
          ...publicClaimIds,
          "options.variantCurrentnessGate.[[Inherited]]"
        ])
      });
    }
    return freezeRecord({
      variantCurrentnessGate: markModuleOwnedClaimContainerTree(
        evaluateSchedulerVariantCurrentnessGate()
      ),
      violationIds: freezeArray(publicClaimIds)
    });
  }
  if (!("value" in descriptor)) {
    return freezeRecord({
      variantCurrentnessGate: null,
      violationIds: freezeArray([
        ...publicClaimIds,
        "options.variantCurrentnessGate.[[Accessor]]"
      ])
    });
  }
  return freezeRecord({
    variantCurrentnessGate: descriptor.value,
    violationIds: freezeArray(publicClaimIds)
  });
}

function readBoundaryDiagnosticsEvaluatorOptions(options) {
  if (options === undefined) {
    return freezeRecord({
      boundaryDiagnosticsReport: null,
      variantCurrentnessGate: null,
      publicClaimIds: freezeArray([]),
      violationIds: freezeArray([])
    });
  }
  if (options === null || typeof options !== "object") {
    return freezeRecord({
      boundaryDiagnosticsReport: null,
      variantCurrentnessGate: null,
      publicClaimIds: freezeArray([]),
      violationIds: freezeArray(["options.[[Object]]"])
    });
  }

  const publicClaimIds = findPublicClaimIds(options, "options");
  const violationIds = [];
  const boundaryDiagnosticsReport = readEvaluatorOptionValue(
    options,
    "boundaryDiagnosticsReport",
    violationIds
  );
  const variantCurrentnessGate = readEvaluatorOptionValue(
    options,
    "variantCurrentnessGate",
    violationIds
  );

  return freezeRecord({
    boundaryDiagnosticsReport,
    variantCurrentnessGate,
    publicClaimIds: freezeArray(publicClaimIds),
    violationIds: freezeArray(violationIds)
  });
}

function readEvaluatorOptionValue(options, key, violationIds) {
  const descriptorResult = safeOwnPropertyDescriptor(options, key, "options");
  if (!descriptorResult.ok) {
    violationIds.push(descriptorResult.id);
    return null;
  }

  const descriptor = descriptorResult.descriptor;
  if (descriptor === undefined) {
    const hasResult = safeHasProperty(options, key, "options");
    if (!hasResult.ok) {
      violationIds.push(hasResult.id);
    } else if (hasResult.has) {
      violationIds.push(`options.${key}.[[Inherited]]`);
    }
    return null;
  }
  if (!("value" in descriptor)) {
    violationIds.push(`options.${key}.[[Accessor]]`);
    return null;
  }
  return descriptor.value === undefined ? null : descriptor.value;
}

function markModuleOwnedClaimContainer(value) {
  if (claimCarrierIsInspectable(value)) {
    moduleOwnedClaimContainers.add(value);
  }
  return value;
}

function markModuleOwnedClaimContainerTree(value, seen = new Set()) {
  if (!claimCarrierIsInspectable(value) || seen.has(value)) {
    return value;
  }
  seen.add(value);
  markModuleOwnedClaimContainer(value);

  const ownKeysResult = safeOwnKeys(value, "moduleOwnedClaimContainer");
  if (!ownKeysResult.ok) {
    return value;
  }

  for (const key of ownKeysResult.keys) {
    const keyName = propertyKeyName(key);
    if (
      typeof value === "function" &&
      standardFunctionMetadataOwnKeys.includes(keyName)
    ) {
      continue;
    }
    const descriptorResult = safeOwnPropertyDescriptor(
      value,
      key,
      "moduleOwnedClaimContainer"
    );
    if (!descriptorResult.ok) {
      continue;
    }
    const descriptor = descriptorResult.descriptor;
    if (
      descriptor !== undefined &&
      "value" in descriptor &&
      claimCarrierIsInspectable(descriptor.value)
    ) {
      markModuleOwnedClaimContainerTree(descriptor.value, seen);
    }
  }

  return value;
}

function freezeModuleOwnedFunctionClaimCarriers(value, seen = new Set()) {
  if (!claimCarrierIsInspectable(value) || seen.has(value)) {
    return value;
  }
  seen.add(value);
  markModuleOwnedClaimContainer(value);

  if (typeof value === "function") {
    Object.freeze(value);
  }

  const ownKeysResult = safeOwnKeys(value, "moduleOwnedDiagnosticObject");
  if (!ownKeysResult.ok) {
    return value;
  }

  for (const key of ownKeysResult.keys) {
    const keyName = propertyKeyName(key);
    if (
      typeof value === "function" &&
      standardFunctionMetadataOwnKeys.includes(keyName)
    ) {
      continue;
    }
    const descriptorResult = safeOwnPropertyDescriptor(
      value,
      key,
      "moduleOwnedDiagnosticObject"
    );
    if (!descriptorResult.ok) {
      continue;
    }
    const descriptor = descriptorResult.descriptor;
    if (
      typeof value === "function" &&
      keyName === "prototype" &&
      descriptor !== undefined &&
      "value" in descriptor &&
      claimCarrierIsInspectable(descriptor.value)
    ) {
      try {
        Object.freeze(descriptor.value);
        markModuleOwnedClaimContainer(descriptor.value);
      } catch {
        // Module-owned diagnostics are trusted, but keep capture best-effort.
      }
    }
    if (
      descriptor !== undefined &&
      "value" in descriptor &&
      claimCarrierIsInspectable(descriptor.value)
    ) {
      freezeModuleOwnedFunctionClaimCarriers(descriptor.value, seen);
    }
  }

  return value;
}

export function evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate(
  options = {}
) {
  const evaluatorOptions = readBoundaryDiagnosticsEvaluatorOptions(options);
  const boundaryDiagnosticsReport = evaluatorOptions.boundaryDiagnosticsReport;
  const variantCurrentnessGate = evaluatorOptions.variantCurrentnessGate;
  const authoritativeVariantCurrentnessGate =
    evaluateSchedulerVariantCurrentnessGate();
  markModuleOwnedClaimContainerTree(authoritativeVariantCurrentnessGate);
  const expectedReport = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: authoritativeVariantCurrentnessGate
  });
  const candidateReport = selectCandidateBoundaryDiagnosticsReport({
    boundaryDiagnosticsReport,
    expectedReport,
    variantCurrentnessGate
  });
  const normalizedReport = normalizeBoundaryDiagnosticsReport(
    candidateReport.report,
    "report"
  );
  const effectiveReport = normalizedReport.report;
  const expectedRowsById = expectedReport.rowsById;
  const actualRows = freezeArray(effectiveReport.rows);
  const actualRowsById = indexRowsById(actualRows);
  const rawRowsById = indexRawRowsByNormalizedRowIds(
    candidateReport.report,
    actualRows
  );
  const violations = [];

  if (!boundaryDiagnosticsReportSchemaIsCurrent(effectiveReport)) {
    violations.push(
      violation("scheduler-variant-boundary-diagnostics-report-schema-mismatch", {
        expectedSchemaVersion: 1,
        actualSchemaVersion: effectiveReport?.schemaVersion ?? null,
        expectedReportKind: SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_REPORT_KIND,
        actualReportKind: effectiveReport?.reportKind ?? null,
        expectedReportId: SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_REPORT_ID,
        actualReportId: effectiveReport?.reportId ?? null
      })
    );
  }

  const sourceGateMismatch = compareSourceGateContext(
    effectiveReport,
    expectedReport,
    authoritativeVariantCurrentnessGate
  );
  if (sourceGateMismatch !== null) {
    violations.push(
      violation(
        "scheduler-variant-boundary-diagnostics-source-gate-mismatch",
        sourceGateMismatch
      )
    );
  }

  if (
    authoritativeVariantCurrentnessGate.gateId !==
      SCHEDULER_VARIANT_CURRENTNESS_GATE_ID ||
    authoritativeVariantCurrentnessGate.status !==
      SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS ||
    authoritativeVariantCurrentnessGate.compatibilityClaimed !== false ||
    effectiveReport?.sourceGateAcceptedAsCurrentPrivateContext !== true
  ) {
    violations.push(
      violation(
        "scheduler-variant-boundary-diagnostics-source-currentness-context-not-accepted",
        {
          sourceGateId: authoritativeVariantCurrentnessGate.gateId ?? null,
          sourceGateStatus: authoritativeVariantCurrentnessGate.status ?? null,
          reportSourceGateStatus: effectiveReport?.sourceGateStatus ?? null,
          compatibilityClaimed:
            authoritativeVariantCurrentnessGate.compatibilityClaimed ?? null
        }
      )
    );
  }

  const manifest = compareStringSets(
    requiredRowIds,
    actualRows.map((row) => row.rowId)
  );
  if (
    manifest.missing.length > 0 ||
    manifest.unexpected.length > 0 ||
    manifest.duplicates.length > 0
  ) {
    violations.push(
      violation("scheduler-variant-boundary-diagnostics-manifest-mismatch", {
        missingRowIds: manifest.missing,
        unexpectedRowIds: manifest.unexpected,
        duplicateRowIds: manifest.duplicates
      })
    );
  }

  const sourceCurrentnessMismatches = [];
  const entrypointMismatches = [];
  const diagnosticIdentityMismatches = [];
  const queueIdentityMismatches = [];
  const unsupportedStatusMismatches = [];
  const variantReuseRows = [];
  const publicClaimIds = [
    ...evaluatorOptions.publicClaimIds,
    ...findPublicClaimIds(candidateReport.report, "report"),
    ...findSuppliedVariantCurrentnessGatePublicClaimIds(
      variantCurrentnessGate
    )
  ];
  const untrustedClaimContainerIds = [
    ...findUntrustedClaimContainerIds(candidateReport.report, "report"),
    ...findSuppliedVariantCurrentnessGateUntrustedClaimContainerIds(
      variantCurrentnessGate
    )
  ];
  untrustedClaimContainerIds.push(
    ...evaluatorOptions.violationIds,
    ...candidateReport.violationIds,
    ...normalizedReport.violationIds,
    ...sourceGateReportRejectionIds(candidateReport.report)
  );

  for (const rowId of requiredRowIds) {
    const expected = expectedRowsById[rowId];
    const actual = actualRowsById[rowId];
    if (!expected || !actual) {
      continue;
    }

    const sourceDifference = findFirstDifferencePath(
      sourceCurrentnessComparable(actual),
      sourceCurrentnessComparable(expected)
    );
    if (sourceDifference !== null) {
      sourceCurrentnessMismatches.push(
        freezeRecord({
          rowId,
          firstDifferencePath: sourceDifference,
          expected: sourceCurrentnessComparable(expected),
          actual: sourceCurrentnessComparable(actual)
        })
      );
    }

    const entrypointDifference = findFirstDifferencePath(
      entrypointComparable(actual),
      entrypointComparable(expected)
    );
    if (entrypointDifference !== null) {
      entrypointMismatches.push(
        freezeRecord({
          rowId,
          firstDifferencePath: entrypointDifference,
          expected: entrypointComparable(expected),
          actual: entrypointComparable(actual)
        })
      );
    }

    const diagnosticObjectFrozenResult = safeFrozen(
      actual.diagnosticObject,
      `${rowId}.diagnosticObject`
    );
    const diagnosticObjectIsFrozen =
      diagnosticObjectFrozenResult.ok &&
      diagnosticObjectFrozenResult.frozen === true;

    if (
      !diagnosticIdentityMatchesExpected(actual, expected) ||
      !diagnosticObjectIsFrozen ||
      actual.diagnosticObjectFrozen !== true ||
      actual.diagnosticObjectMatchesLive !== true ||
      actual.diagnosticStatus !== expected.diagnosticStatus ||
      actual.diagnosticExportName !== expected.diagnosticExportName ||
      actual.diagnosticSymbolDescription !== expected.diagnosticSymbolDescription
    ) {
      diagnosticIdentityMismatches.push(
        freezeRecord({
          rowId,
          diagnosticObjectMatchesLive:
            actual.diagnosticObject === actual.liveDiagnosticObject,
          diagnosticObjectFrozen: diagnosticObjectFrozenResult.ok
            ? diagnosticObjectFrozenResult.frozen
            : false,
          diagnosticObjectFrozenStatus: diagnosticObjectFrozenResult.ok
            ? null
            : diagnosticObjectFrozenResult.id,
          declaredDiagnosticObjectFrozen:
            actual.diagnosticObjectFrozen ?? null,
          declaredDiagnosticObjectMatchesLive:
            actual.diagnosticObjectMatchesLive ?? null,
          expectedSourceOwnedDiagnosticIdentity:
            comparableDiagnosticIdentity(expected.sourceDiagnosticIdentity),
          actualDiagnosticObjectSourceOwnedIdentity:
            comparableDiagnosticIdentity(
              sourceOwnedDiagnosticIdentityByObject.get(actual.diagnosticObject)
            ),
          actualLiveDiagnosticObjectSourceOwnedIdentity:
            comparableDiagnosticIdentity(
              sourceOwnedDiagnosticIdentityByObject.get(
                actual.liveDiagnosticObject
              )
            ),
          expectedDiagnosticStatus: expected.diagnosticStatus,
          actualDiagnosticStatus: actual.diagnosticStatus ?? null,
          expectedDiagnosticExportName: expected.diagnosticExportName,
          actualDiagnosticExportName: actual.diagnosticExportName ?? null
        })
      );
    }

    const queueDifference = findFirstDifferencePath(
      actual.queueIdentity,
      expected.queueIdentity
    );
    if (queueDifference !== null) {
      queueIdentityMismatches.push(
        freezeRecord({
          rowId,
          firstDifferencePath: queueDifference,
          expected: expected.queueIdentity,
          actual: actual.queueIdentity ?? null
        })
      );
    }

    const unsupportedDifference = findFirstDifferencePath(
      actual.unsupportedStatus,
      expected.unsupportedStatus
    );
    if (unsupportedDifference !== null) {
      unsupportedStatusMismatches.push(
        freezeRecord({
          rowId,
          firstDifferencePath: unsupportedDifference,
          expected: expected.unsupportedStatus,
          actual: actual.unsupportedStatus ?? null
        })
      );
    }

    if (variantReuseDetected(actual, expected)) {
      variantReuseRows.push(
        freezeRecord({
          rowId,
          expectedClassification: expected.classification,
          actualClassification: actual.classification ?? null,
          expectedVariantId: expected.variantId,
          actualVariantId: actual.variantId ?? null,
          expectedSelectedCjsVariantId: expected.selectedCjsVariantId,
          actualSelectedCjsVariantId: actual.selectedCjsVariantId ?? null,
          actualEntrypoint: actual.entrypoint ?? null
        })
      );
    }

    const rawActual = rawRowsById[rowId] ?? actual;
    publicClaimIds.push(...findPublicClaimIds(rawActual, rowId));
    untrustedClaimContainerIds.push(
      ...findUntrustedClaimContainerIds(rawActual, rowId)
    );
  }

  pushRowsViolation(
    violations,
    "scheduler-variant-boundary-diagnostics-source-currentness-mismatch",
    sourceCurrentnessMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-boundary-diagnostics-entrypoint-variant-mismatch",
    entrypointMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-boundary-diagnostics-cloned-diagnostic-record",
    diagnosticIdentityMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-boundary-diagnostics-fake-queue-state",
    queueIdentityMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-boundary-diagnostics-unsupported-status-mismatch",
    unsupportedStatusMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-boundary-diagnostics-root-native-variant-reuse",
    variantReuseRows
  );
  pushIdsViolation(
    violations,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected",
    publicClaimIds
  );
  pushIdsViolation(
    violations,
    "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container",
    untrustedClaimContainerIds
  );

  const sourceCurrentnessRecognized =
    sourceCurrentnessMismatches.length === 0 &&
    manifest.missing.length === 0 &&
    manifest.unexpected.length === 0 &&
    manifest.duplicates.length === 0 &&
    authoritativeVariantCurrentnessGate.gateId ===
      SCHEDULER_VARIANT_CURRENTNESS_GATE_ID &&
    authoritativeVariantCurrentnessGate.status ===
      SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS &&
    authoritativeVariantCurrentnessGate.compatibilityClaimed === false;
  const sourceGateContextRecognized = sourceGateMismatch === null;
  const entrypointVariantBoundariesRecognized =
    entrypointMismatches.length === 0;
  const diagnosticIdentitiesRecognized =
    diagnosticIdentityMismatches.length === 0;
  const queueIdentitiesRecognized = queueIdentityMismatches.length === 0;
  const unsupportedStatusRecognized =
    unsupportedStatusMismatches.length === 0;
  const rootNativeVariantReuseRejected = variantReuseRows.length === 0;
  const publicCompatibilityClaimsBlocked =
    publicClaimIds.length === 0 && untrustedClaimContainerIds.length === 0;
  const compatibilityClaimed =
    publicClaimIds.length > 0 || effectiveReport?.compatibilityClaimed !== false;
  const passed =
    violations.length === 0 &&
    sourceCurrentnessRecognized &&
    sourceGateContextRecognized &&
    entrypointVariantBoundariesRecognized &&
    diagnosticIdentitiesRecognized &&
    queueIdentitiesRecognized &&
    unsupportedStatusRecognized &&
    rootNativeVariantReuseRejected &&
    publicCompatibilityClaimsBlocked &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_ID,
    status: passed
      ? SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_STATUS
      : SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS,
    sourceGateId: authoritativeVariantCurrentnessGate.gateId ?? null,
    sourceGateStatus: authoritativeVariantCurrentnessGate.status ?? null,
    report: effectiveReport,
    expectedReport,
    rows: actualRows,
    rowsById: actualRowsById,
    sourceCurrentnessRecognized,
    sourceGateContextRecognized,
    entrypointVariantBoundariesRecognized,
    diagnosticIdentitiesRecognized,
    queueIdentitiesRecognized,
    unsupportedStatusRecognized,
    rootNativeVariantReuseRejected,
    publicCompatibilityClaimsBlocked,
    compatibilityClaimed,
    publicCompatibilityClaimIds: freezeArray(publicClaimIds),
    untrustedPublicClaimContainerIds: freezeArray(untrustedClaimContainerIds),
    violations: freezeArray(violations)
  });
}

function selectCandidateBoundaryDiagnosticsReport({
  boundaryDiagnosticsReport,
  expectedReport,
  variantCurrentnessGate
}) {
  if (boundaryDiagnosticsReport !== null) {
    return freezeRecord({
      report: boundaryDiagnosticsReport,
      violationIds: freezeArray([])
    });
  }
  if (variantCurrentnessGate === null) {
    return freezeRecord({
      report: expectedReport,
      violationIds: freezeArray([])
    });
  }

  try {
    return freezeRecord({
      report: createSchedulerVariantBoundaryDiagnosticsReport({
        variantCurrentnessGate
      }),
      violationIds: freezeArray([])
    });
  } catch {
    return freezeRecord({
      report: expectedReport,
      violationIds: freezeArray([
        "variantCurrentnessGate.[[BoundaryDiagnosticsReport]]"
      ])
    });
  }
}

function normalizeBoundaryDiagnosticsReport(report, path) {
  const violationIds = [];
  const normalizedReport = normalizePlainDataObject(report, path, violationIds);
  const rows = normalizeRowsValue(
    normalizedReport.rows,
    `${path}.rows`,
    violationIds
  );
  normalizedReport.rows = rows;
  normalizedReport.rowsById = indexRowsById(rows);

  return freezeRecord({
    report: Object.freeze(normalizedReport),
    violationIds: freezeArray(violationIds)
  });
}

function normalizeRowsValue(rowsValue, path, violationIds) {
  if (rowsValue === null || rowsValue === undefined) {
    return freezeArray([]);
  }

  const isArrayResult = safeIsArray(rowsValue, path);
  if (!isArrayResult.ok) {
    violationIds.push(isArrayResult.id);
    return freezeArray([]);
  }
  if (!isArrayResult.isArray) {
    violationIds.push(`${path}.[[Array]]`);
    return freezeArray([]);
  }

  const lengthResult = safeReadProperty(rowsValue, "length", `${path}.length`);
  if (!lengthResult.ok) {
    violationIds.push(lengthResult.id);
    return freezeArray([]);
  }
  if (!Number.isSafeInteger(lengthResult.value) || lengthResult.value < 0) {
    violationIds.push(`${path}.length`);
    return freezeArray([]);
  }

  const rows = [];
  for (let index = 0; index < lengthResult.value; index += 1) {
    const rowPath = `${path}[${index}]`;
    const rowResult = safeReadProperty(rowsValue, index, rowPath);
    if (!rowResult.ok) {
      violationIds.push(rowResult.id);
      rows.push(freezeRecord({}));
      continue;
    }
    rows.push(normalizeBoundaryRow(rowResult.value, rowPath, violationIds));
  }
  return freezeArray(rows);
}

function normalizeBoundaryRow(row, path, violationIds) {
  const normalizedRow = normalizePlainDataObject(row, path, violationIds);
  return Object.freeze(normalizedRow);
}

function normalizePlainDataObject(value, path, violationIds) {
  const normalized = Object.create(null);
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

function indexRawRowsByNormalizedRowIds(report, normalizedRows) {
  if (report === null || typeof report !== "object") {
    return freezeRecord({});
  }

  const rowsDescriptorResult = safeOwnPropertyDescriptor(report, "rows", "report");
  if (!rowsDescriptorResult.ok) {
    return freezeRecord({});
  }
  const rowsDescriptor = rowsDescriptorResult.descriptor;
  if (rowsDescriptor === undefined || !("value" in rowsDescriptor)) {
    return freezeRecord({});
  }

  const rowsValue = rowsDescriptor.value;
  const rowsById = {};
  for (let index = 0; index < normalizedRows.length; index += 1) {
    const normalizedRow = normalizedRows[index];
    const rowId = normalizedRow?.rowId;
    if (typeof rowId !== "string") {
      continue;
    }
    const rowResult = safeReadProperty(
      rowsValue,
      index,
      `report.rows[${index}]`
    );
    if (rowResult.ok) {
      rowsById[rowId] = rowResult.value;
    }
  }
  return freezeRecord(rowsById);
}

function createMockRootBoundaryRow({ nodeEnv, rowsByVariant }) {
  const wrapperRow = rowsByVariant["scheduler-unstable-mock-root"];
  const selectedCjsVariantId = mockCjsVariantId(nodeEnv);
  const selectedCjsRow = rowsByVariant[selectedCjsVariantId];
  const Scheduler = loadFreshSchedulerMock({ nodeEnv, directCjs: false });
  const diagnostics = freezeModuleOwnedFunctionClaimCarriers(
    readSchedulerMockPrivateActQueueFlushDiagnostics(Scheduler)
  );

  return createMockBoundaryRow({
    rowId: `scheduler-mock-root-${nodeEnv}-boundary-diagnostics`,
    entrypointKind: "package-wrapper",
    nodeEnv,
    variantId: "scheduler-unstable-mock-root",
    wrapperVariantId: "scheduler-unstable-mock-root",
    selectedCjsVariantId,
    sourceCurrentness: wrapperRow,
    selectedSourceCurrentness: selectedCjsRow,
    diagnostics,
    liveDiagnosticObject: diagnostics
  });
}

function createMockCjsBoundaryRow({ nodeEnv, rowsByVariant }) {
  const selectedCjsVariantId = mockCjsVariantId(nodeEnv);
  const selectedCjsRow = rowsByVariant[selectedCjsVariantId];
  const Scheduler = loadFreshSchedulerMock({ nodeEnv, directCjs: true });
  const diagnostics = freezeModuleOwnedFunctionClaimCarriers(
    readSchedulerMockPrivateActQueueFlushDiagnostics(Scheduler)
  );

  return createMockBoundaryRow({
    rowId: `scheduler-mock-cjs-${nodeEnv}-boundary-diagnostics`,
    entrypointKind: "direct-cjs",
    nodeEnv,
    variantId: selectedCjsVariantId,
    wrapperVariantId: null,
    selectedCjsVariantId,
    sourceCurrentness: selectedCjsRow,
    selectedSourceCurrentness: selectedCjsRow,
    diagnostics,
    liveDiagnosticObject: diagnostics
  });
}

function createMockBoundaryRow({
  rowId,
  entrypointKind,
  nodeEnv,
  variantId,
  wrapperVariantId,
  selectedCjsVariantId,
  sourceCurrentness,
  selectedSourceCurrentness,
  diagnostics,
  liveDiagnosticObject
}) {
  const wrapperTarget = mockWrapperTarget(nodeEnv);

  return freezeBoundaryRowWithDiagnosticIdentity({
    rowId,
    rowKind: "scheduler-mock-variant-boundary-diagnostic-currentness",
    entrypointKind,
    variantId,
    wrapperVariantId,
    selectedCjsVariantId,
    classification: "mock",
    rootNativeMockPostTaskClassification: "mock",
    nodeEnv,
    runtimeMode: nodeEnv,
    modeId: `node-${nodeEnv}`,
    packageName: "scheduler",
    packageVersion: "0.27.0",
    compatibilityTarget: "scheduler@0.27.0",
    entrypoint:
      entrypointKind === "direct-cjs"
        ? selectedSourceCurrentness.packagePath
        : "scheduler/unstable_mock",
    canonicalEntrypoint:
      entrypointKind === "direct-cjs"
        ? selectedSourceCurrentness.canonicalEntrypoint
        : "scheduler/unstable_mock",
    physicalEntrypoint: sourceCurrentness.physicalEntrypoint,
    physicalEntryFile: sourceCurrentness.sourceFile,
    selectedCjsEntrypoint: selectedSourceCurrentness.canonicalEntrypoint,
    selectedCjsPhysicalEntrypoint:
      selectedSourceCurrentness.physicalEntrypoint,
    selectedCjsPhysicalEntryFile: selectedSourceCurrentness.sourceFile,
    wrapperTarget,
    sourceSha256: sourceCurrentness.sourceSha256,
    selectedCjsSourceSha256: selectedSourceCurrentness.sourceSha256,
    sourceCurrentness,
    selectedSourceCurrentness,
    diagnosticStatus: diagnostics.status,
    diagnosticExportName: mockDiagnosticsExport,
    diagnosticSymbolDescription: mockDiagnosticsExport,
    diagnosticObject: diagnostics,
    liveDiagnosticObject,
    diagnosticObjectFrozen: Object.isFrozen(diagnostics),
    diagnosticObjectMatchesLive: diagnostics === liveDiagnosticObject,
    queueIdentity: freezeRecord({
      status: "recognized-private-mock-act-queue-boundary",
      queueKind: diagnostics.queueKind,
      taskKind: diagnostics.taskKind,
      callbackKind: diagnostics.callbackKind,
      queueVersion: diagnostics.queueVersion,
      reactCompatibilityTarget: diagnostics.compatibilityTarget,
      schedulerCompatibilityTarget: diagnostics.schedulerCompatibilityTarget,
      helperExportName: mockDiagnosticsExport,
      entrypoint: "scheduler/unstable_mock",
      selectedCjsEntrypoint: selectedSourceCurrentness.canonicalEntrypoint,
      drainsAcceptedInternalTestQueues:
        diagnostics.drainsAcceptedInternalTestQueues === true,
      privateTestQueueFlushDiagnosticsReady:
        diagnostics.privateTestQueueFlushDiagnosticsReady === true,
      publicSchedulerTaskQueueDrainBlocked:
        diagnostics.drainsPublicSchedulerTaskQueue === false,
      publicReactActQueueDrainBlocked:
        diagnostics.drainsPublicReactActQueue === false,
      queuedWorkExecutionBlocked: diagnostics.executesQueuedWork === false,
      effectExecutionBlocked: diagnostics.executesEffects === false,
      drainsPublicSchedulerTaskQueue: diagnostics.drainsPublicSchedulerTaskQueue,
      drainsPublicReactActQueue: diagnostics.drainsPublicReactActQueue,
      executesQueuedWork: diagnostics.executesQueuedWork,
      executesEffects: diagnostics.executesEffects
    }),
    unsupportedStatus: unsupportedBoundaryStatus({
      mock: true,
      postTask: false
    })
  });
}

function createPostTaskBoundaryRow({ nodeEnv, rowsByVariant }) {
  const wrapperRow = rowsByVariant["scheduler-unstable-post-task-wrapper"];
  const selectedCjsVariantId = postTaskCjsVariantId(nodeEnv);
  const selectedCjsRow = rowsByVariant[selectedCjsVariantId];
  const postTaskReport = inspectSchedulerPostTaskPriorityDiagnostics({
    nodeEnv,
    withYield: false
  });
  const diagnostics =
    freezeModuleOwnedFunctionClaimCarriers(
      postTaskReport.delayedContinuationActRootHandoff.diagnosticsAfterFallback
    );

  return freezeBoundaryRowWithDiagnosticIdentity({
    rowId: `scheduler-post-task-${nodeEnv}-boundary-diagnostics`,
    rowKind: "scheduler-post-task-variant-boundary-diagnostic-currentness",
    entrypointKind: "package-wrapper-to-cjs",
    variantId: "scheduler-unstable-post-task-wrapper",
    wrapperVariantId: "scheduler-unstable-post-task-wrapper",
    selectedCjsVariantId,
    classification: "post_task",
    rootNativeMockPostTaskClassification: "post_task",
    nodeEnv,
    runtimeMode: nodeEnv,
    modeId: `node-${nodeEnv}`,
    packageName: "scheduler",
    packageVersion: "0.27.0",
    compatibilityTarget: "scheduler@0.27.0",
    entrypoint: "scheduler/unstable_post_task",
    canonicalEntrypoint: "scheduler/unstable_post_task",
    physicalEntrypoint: wrapperRow.physicalEntrypoint,
    physicalEntryFile: wrapperRow.sourceFile,
    selectedCjsEntrypoint: selectedCjsRow.canonicalEntrypoint,
    selectedCjsPhysicalEntrypoint: selectedCjsRow.physicalEntrypoint,
    selectedCjsPhysicalEntryFile: selectedCjsRow.sourceFile,
    wrapperTarget: postTaskWrapperTarget(nodeEnv),
    sourceSha256: wrapperRow.sourceSha256,
    selectedCjsSourceSha256: selectedCjsRow.sourceSha256,
    sourceCurrentness: wrapperRow,
    selectedSourceCurrentness: selectedCjsRow,
    diagnosticStatus: diagnostics.status,
    diagnosticExportName: postTaskDiagnosticsExport,
    diagnosticSymbolDescription: postTaskDiagnosticsSymbolDescription,
    diagnosticObject: diagnostics,
    liveDiagnosticObject: diagnostics,
    diagnosticObjectFrozen: Object.isFrozen(diagnostics),
    diagnosticObjectMatchesLive: true,
    queueIdentity: freezeRecord({
      status: "recognized-private-post-task-shim-boundary",
      queueKind: "controlled-task-scheduling-api-shim",
      scheduleStatus: diagnostics.schedule.status,
      entrypoint: diagnostics.entrypoint,
      selectedCjsEntrypoint: selectedCjsRow.canonicalEntrypoint,
      environmentStatus: diagnostics.environmentCapabilities.status,
      hasTaskController: diagnostics.environmentCapabilities.hasTaskController,
      hasSchedulerPostTask:
        diagnostics.environmentCapabilities.hasSchedulerPostTask,
      hasSchedulerYield: diagnostics.environmentCapabilities.hasSchedulerYield,
      postTaskPriority: diagnostics.priorityMapping.postTaskPriority,
      taskControllerPriority:
        diagnostics.priorityMapping.taskControllerPriority,
      priorityTimeoutStatus: diagnostics.priorityTimeout.status,
      signalId: diagnostics.schedule.signal.id,
      rootContinuationExecutionRouteStatus:
        diagnostics.rootContinuationExecutionRoute.status,
      actRootWorkHandoffStatus:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff.status,
      publicSchedulerTaskQueueDrainBlocked:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff
          .drainsPublicSchedulerTaskQueue === false,
      publicReactActQueueDrainBlocked:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff
          .drainsPublicReactActQueue === false,
      queuedWorkExecutionBlocked:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff
          .executesQueuedWork === false,
      rendererWorkExecutionBlocked:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff
          .executesRendererWork === false,
      drainsPublicSchedulerTaskQueue:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff
          .drainsPublicSchedulerTaskQueue,
      drainsPublicReactActQueue:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff
          .drainsPublicReactActQueue,
      executesQueuedWork:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff
          .executesQueuedWork,
      executesRendererWork:
        diagnostics.rootContinuationExecutionRoute.actRootWorkHandoff
          .executesRendererWork
    }),
    unsupportedStatus: unsupportedBoundaryStatus({
      mock: false,
      postTask: true
    })
  });
}

function loadFreshSchedulerMock({ nodeEnv, directCjs }) {
  const previousNodeEnv = process.env.NODE_ENV;
  clearSchedulerPackageCache();
  process.env.NODE_ENV = nodeEnv;
  try {
    return require(
      directCjs ? schedulerMockCjsEntrypoints[nodeEnv] : schedulerMockEntrypoint
    );
  } finally {
    clearSchedulerPackageCache();
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  }
}

function clearSchedulerPackageCache() {
  for (const id of Object.keys(require.cache)) {
    if (id.startsWith(schedulerPackageRoot)) {
      delete require.cache[id];
    }
  }
}

function mockCjsVariantId(nodeEnv) {
  return `scheduler-cjs-unstable-mock-${nodeEnv}`;
}

function postTaskCjsVariantId(nodeEnv) {
  return `scheduler-cjs-unstable-post-task-${nodeEnv}`;
}

function mockWrapperTarget(nodeEnv) {
  return `cjs/scheduler-unstable_mock.${nodeEnv}.js`;
}

function postTaskWrapperTarget(nodeEnv) {
  return `cjs/scheduler-unstable_post_task.${nodeEnv}.js`;
}

function unsupportedBoundaryStatus({ mock, postTask }) {
  return freezeRecord({
    status: "unsupported-public-scheduler-timing-boundary",
    privateDiagnosticsOnly: true,
    sourceCurrentnessRequired: true,
    publicSchedulerTimingCompatibilityClaimed: false,
    publicSchedulerFlushHelperCompatibilityClaimed: false,
    publicSchedulerFlushBehaviorExecuted: false,
    publicRootSchedulerCompatibilityClaimed: false,
    publicRootExecutionClaimed: false,
    publicReactActCompatibilityClaimed: false,
    publicActBehaviorClaimed: false,
    publicCompatibilityClaimed: false,
    publicPackageCompatibilityClaimed: false,
    packageCompatibilityClaimed: false,
    nativeRuntimeCompatibilityClaimed: false,
    nativeRuntimeExecutionBlocked: true,
    publicPostTaskCompatibilityClaimed: false,
    browserPostTaskCompatibilityClaimed: false,
    browserTaskOrderingCompatibilityClaimed: false,
    postTaskPublicBehaviorClaimed: false,
    postTaskPrivateDiagnosticsOnly: postTask,
    publicMockSchedulerCompatibilityClaimed: false,
    mockSchedulerPublicBehaviorClaimed: false,
    mockSchedulerPrivateDiagnosticsOnly: mock,
    drainsPublicSchedulerTaskQueue: false,
    drainsPublicReactActQueue: false,
    executesQueuedWork: false,
    executesEffects: false,
    executesRendererWork: false,
    executesRendererRoots: false,
    compatibilityClaimed: false
  });
}

function boundaryDiagnosticsReportSchemaIsCurrent(report) {
  return (
    report?.schemaVersion === 1 &&
    report?.reportKind === SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_REPORT_KIND &&
    report?.reportId === SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_REPORT_ID &&
    report?.compatibilityClaimed === false
  );
}

function compareSourceGateContext(report, expectedReport, gate) {
  const expected = freezeRecord({
    sourceGateId: expectedReport?.sourceGateId ?? gate?.gateId ?? null,
    sourceGateStatus: expectedReport?.sourceGateStatus ?? gate?.status ?? null,
    sourceGateAcceptedAsCurrentPrivateContext:
      expectedReport?.sourceGateAcceptedAsCurrentPrivateContext ??
      (gate?.status === SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS &&
        gate?.compatibilityClaimed === false)
  });
  const actual = freezeRecord({
    sourceGateId: report?.sourceGateId ?? null,
    sourceGateStatus: report?.sourceGateStatus ?? null,
    sourceGateAcceptedAsCurrentPrivateContext:
      report?.sourceGateAcceptedAsCurrentPrivateContext ?? null
  });
  const firstDifferencePath = findFirstDifferencePath(actual, expected);

  if (firstDifferencePath === null) {
    return null;
  }
  return freezeRecord({
    firstDifferencePath,
    expected,
    actual,
    expectedCurrentSourceGateId: gate?.gateId ?? null,
    expectedCurrentSourceGateStatus: gate?.status ?? null,
    expectedCurrentCompatibilityClaimed: gate?.compatibilityClaimed ?? null
  });
}

function sourceCurrentnessComparable(row) {
  return freezeRecord({
    sourceCurrentness: row.sourceCurrentness ?? null,
    selectedSourceCurrentness: row.selectedSourceCurrentness ?? null,
    sourceSha256: row.sourceSha256 ?? null,
    selectedCjsSourceSha256: row.selectedCjsSourceSha256 ?? null
  });
}

function entrypointComparable(row) {
  return freezeRecord({
    rowKind: row.rowKind ?? null,
    entrypointKind: row.entrypointKind ?? null,
    variantId: row.variantId ?? null,
    wrapperVariantId: row.wrapperVariantId ?? null,
    selectedCjsVariantId: row.selectedCjsVariantId ?? null,
    classification: row.classification ?? null,
    rootNativeMockPostTaskClassification:
      row.rootNativeMockPostTaskClassification ?? null,
    nodeEnv: row.nodeEnv ?? null,
    runtimeMode: row.runtimeMode ?? null,
    modeId: row.modeId ?? null,
    packageName: row.packageName ?? null,
    packageVersion: row.packageVersion ?? null,
    compatibilityTarget: row.compatibilityTarget ?? null,
    entrypoint: row.entrypoint ?? null,
    canonicalEntrypoint: row.canonicalEntrypoint ?? null,
    physicalEntrypoint: row.physicalEntrypoint ?? null,
    physicalEntryFile: row.physicalEntryFile ?? null,
    selectedCjsEntrypoint: row.selectedCjsEntrypoint ?? null,
    selectedCjsPhysicalEntrypoint: row.selectedCjsPhysicalEntrypoint ?? null,
    selectedCjsPhysicalEntryFile: row.selectedCjsPhysicalEntryFile ?? null,
    wrapperTarget: row.wrapperTarget ?? null
  });
}

function diagnosticIdentityMatchesExpected(actual, expected) {
  const expectedIdentity = comparableDiagnosticIdentity(
    expected.sourceDiagnosticIdentity
  );
  const diagnosticObjectIdentity = comparableDiagnosticIdentity(
    sourceOwnedDiagnosticIdentityByObject.get(actual?.diagnosticObject)
  );
  const liveDiagnosticObjectIdentity = comparableDiagnosticIdentity(
    sourceOwnedDiagnosticIdentityByObject.get(actual?.liveDiagnosticObject)
  );

  return (
    actual?.diagnosticObject === actual?.liveDiagnosticObject &&
    sameDiagnosticIdentity(diagnosticObjectIdentity, expectedIdentity) &&
    sameDiagnosticIdentity(liveDiagnosticObjectIdentity, expectedIdentity)
  );
}

function sameDiagnosticIdentity(left, right) {
  return (
    left !== null &&
    right !== null &&
    findFirstDifferencePath(left, right) === null
  );
}

function comparableDiagnosticIdentity(identity) {
  if (identity === null || typeof identity !== "object") {
    return null;
  }
  return freezeRecord({
    identityKind: identity.identityKind ?? null,
    rowId: identity.rowId ?? null,
    variantId: identity.variantId ?? null,
    wrapperVariantId: identity.wrapperVariantId ?? null,
    selectedCjsVariantId: identity.selectedCjsVariantId ?? null,
    classification: identity.classification ?? null,
    entrypoint: identity.entrypoint ?? null,
    selectedCjsEntrypoint: identity.selectedCjsEntrypoint ?? null,
    diagnosticStatus: identity.diagnosticStatus ?? null,
    diagnosticExportName: identity.diagnosticExportName ?? null,
    diagnosticSymbolDescription: identity.diagnosticSymbolDescription ?? null
  });
}

function variantReuseDetected(actual, expected) {
  const expectedClassification = expected.classification;
  const actualClassification = actual?.classification;
  const actualVariantId = actual?.variantId;
  const actualSelectedCjsVariantId = actual?.selectedCjsVariantId;
  const actualEntrypoint = actual?.entrypoint;

  if (
    expectedClassification !== "mock" &&
    expectedClassification !== "post_task"
  ) {
    return true;
  }
  if (actualClassification !== expectedClassification) {
    return true;
  }
  if (
    actualVariantId === "scheduler-index-wrapper" ||
    actualVariantId === "scheduler-native-wrapper" ||
    actualSelectedCjsVariantId === "scheduler-cjs-index-development" ||
    actualSelectedCjsVariantId === "scheduler-cjs-index-production" ||
    actualSelectedCjsVariantId === "scheduler-cjs-native-development" ||
    actualSelectedCjsVariantId === "scheduler-cjs-native-production"
  ) {
    return true;
  }
  if (
    expectedClassification === "mock" &&
    !stringIncludes(actualEntrypoint, "unstable_mock")
  ) {
    return true;
  }
  if (
    expectedClassification === "post_task" &&
    !stringIncludes(actualEntrypoint, "unstable_post_task")
  ) {
    return true;
  }
  return false;
}

function stringIncludes(value, searchString) {
  return typeof value === "string" && value.includes(searchString);
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

function findUntrustedClaimContainerIds(value, path, seen = new Set()) {
  const ids = [];
  if (typeof value === "function") {
    return findUntrustedFunctionClaimContainerIds(value, path, seen);
  }
  if (value === null || typeof value !== "object") {
    ids.push(`${path}.[[Object]]`);
    return ids;
  }
  if (seen.has(value)) {
    return ids;
  }
  seen.add(value);

  if (!moduleOwnedClaimContainers.has(value)) {
    ids.push(`${path}.[[HiddenInferredPublicClaims]]`);
  }

  const frozenResult = safeFrozen(value, path);
  if (!frozenResult.ok) {
    ids.push(frozenResult.id);
  } else if (!frozenResult.frozen) {
    ids.push(`${path}.[[Frozen]]`);
  }

  const prototypeResult = safePrototypeOf(value, path);
  if (!prototypeResult.ok) {
    ids.push(prototypeResult.id);
  } else if (!claimContainerPrototypeIsTrusted(value, prototypeResult.prototype)) {
    ids.push(`${path}.[[Prototype]]`);
  }

  const ownKeysResult = safeOwnKeys(value, path);
  if (!ownKeysResult.ok) {
    ids.push(ownKeysResult.id);
    return ids;
  }

  ids.push(
    ...findHiddenPublicClaimGetContainerIds(value, path, ownKeysResult.keys)
  );

  for (const key of ownKeysResult.keys) {
    const descriptorResult = safeOwnPropertyDescriptor(value, key, path);
    if (!descriptorResult.ok) {
      ids.push(descriptorResult.id);
      continue;
    }
    const descriptor = descriptorResult.descriptor;
    const nextPath = `${path}.${formatPathKey(key)}`;
    if (descriptor === undefined) {
      ids.push(`${nextPath}.[[Descriptor]]`);
      continue;
    }

    if (!("value" in descriptor)) {
      ids.push(`${nextPath}.[[Accessor]]`);
      continue;
    }
    const readResult = safeReadProperty(value, key, nextPath);
    if (!readResult.ok) {
      ids.push(readResult.id);
      continue;
    }
    if (!Object.is(readResult.value, descriptor.value)) {
      ids.push(`${nextPath}.[[GetValue]]`);
      continue;
    }
    if (claimCarrierIsInspectable(descriptor.value)) {
      ids.push(
        ...findUntrustedClaimContainerIds(descriptor.value, nextPath, seen)
      );
    }
  }

  return ids;
}

function findUntrustedFunctionClaimContainerIds(value, path, seen) {
  const ids = [];
  if (seen.has(value)) {
    return ids;
  }
  seen.add(value);

  if (!moduleOwnedClaimContainers.has(value)) {
    ids.push(`${path}.[[HiddenInferredPublicClaims]]`);
  }

  const frozenResult = safeFrozen(value, path);
  if (!frozenResult.ok) {
    ids.push(frozenResult.id);
  } else if (!frozenResult.frozen) {
    ids.push(`${path}.[[Frozen]]`);
  }

  const prototypeResult = safePrototypeOf(value, path);
  if (!prototypeResult.ok) {
    ids.push(prototypeResult.id);
  } else if (!claimContainerPrototypeIsTrusted(value, prototypeResult.prototype)) {
    ids.push(`${path}.[[Prototype]]`);
  }

  const ownKeysResult = safeOwnKeys(value, path);
  if (!ownKeysResult.ok) {
    ids.push(ownKeysResult.id);
    return ids;
  }

  ids.push(
    ...findHiddenPublicClaimGetContainerIds(value, path, ownKeysResult.keys)
  );

  for (const key of ownKeysResult.keys) {
    const descriptorResult = safeOwnPropertyDescriptor(value, key, path);
    if (!descriptorResult.ok) {
      ids.push(descriptorResult.id);
      continue;
    }
    const descriptor = descriptorResult.descriptor;
    const nextPath = `${path}.${formatPathKey(key)}`;
    if (descriptor === undefined) {
      ids.push(`${nextPath}.[[Descriptor]]`);
      continue;
    }
    if (!("value" in descriptor)) {
      ids.push(`${nextPath}.[[Accessor]]`);
      continue;
    }
    const readResult = safeReadProperty(value, key, nextPath);
    if (!readResult.ok) {
      ids.push(readResult.id);
      continue;
    }
    if (!Object.is(readResult.value, descriptor.value)) {
      ids.push(`${nextPath}.[[GetValue]]`);
      continue;
    }
    if (
      !standardFunctionMetadataOwnKeys.includes(propertyKeyName(key)) &&
      claimCarrierIsInspectable(descriptor.value)
    ) {
      ids.push(
        ...findUntrustedClaimContainerIds(descriptor.value, nextPath, seen)
      );
    }
  }

  return ids;
}

const standardFunctionMetadataOwnKeys = Object.freeze([
  "arguments",
  "caller",
  "length",
  "name"
]);

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

function findHiddenPublicClaimGetContainerIds(value, path, ownKeys) {
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
    if (readResult.value !== undefined) {
      ids.push(`${path}.${claimKey}.[[HiddenGet]]`);
    }
  }
  return ids;
}

function claimCarrierIsInspectable(value) {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function")
  );
}

function claimContainerPrototypeIsTrusted(value, prototype) {
  if (typeof value === "function") {
    return prototype === Function.prototype || prototype === null;
  }
  if (Array.isArray(value)) {
    return prototype === Array.prototype;
  }
  return prototype === Object.prototype || prototype === null;
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

function safeFrozen(value, path) {
  try {
    return {
      ok: true,
      frozen: Object.isFrozen(value)
    };
  } catch {
    return {
      ok: false,
      id: `${path}.[[Frozen]]`
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

function safeHasProperty(value, key, path) {
  try {
    return {
      ok: true,
      has: key in value
    };
  } catch {
    return {
      ok: false,
      id: `${path}.${formatPathKey(key)}.[[Has]]`
    };
  }
}

function propertyKeyName(key) {
  return typeof key === "symbol" ? key.description ?? String(key) : key;
}

function formatPathKey(key) {
  return typeof key === "symbol" ? `[${String(key)}]` : key;
}

function descriptorValueIsAcceptedFalse(descriptor) {
  return (
    descriptor !== undefined &&
    "value" in descriptor &&
    descriptor.value === false
  );
}

function publicClaimKeyIsBlocked(keyName) {
  if (blockedPublicClaimKeys.includes(keyName)) {
    return true;
  }
  if (typeof keyName !== "string") {
    return false;
  }
  if (
    allowedPublicClaimKeyPatterns.some((pattern) => pattern.test(keyName))
  ) {
    return false;
  }
  return inferredPublicClaimKeyPattern.test(keyName);
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

function findFirstDifferencePath(left, right, pathName = "$") {
  if (Object.is(left, right)) {
    return null;
  }
  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  ) {
    return pathName;
  }

  const leftIsArrayResult = safeIsArray(left, pathName);
  if (!leftIsArrayResult.ok) {
    return leftIsArrayResult.id;
  }
  const rightIsArrayResult = safeIsArray(right, pathName);
  if (!rightIsArrayResult.ok) {
    return rightIsArrayResult.id;
  }
  const leftIsArray = leftIsArrayResult.isArray;
  const rightIsArray = rightIsArrayResult.isArray;
  if (leftIsArray !== rightIsArray) {
    return pathName;
  }
  if (leftIsArray) {
    const leftLengthResult = safeReadProperty(
      left,
      "length",
      `${pathName}.length`
    );
    if (!leftLengthResult.ok) {
      return leftLengthResult.id;
    }
    const rightLengthResult = safeReadProperty(
      right,
      "length",
      `${pathName}.length`
    );
    if (!rightLengthResult.ok) {
      return rightLengthResult.id;
    }
    if (leftLengthResult.value !== rightLengthResult.value) {
      return `${pathName}.length`;
    }
    for (let index = 0; index < leftLengthResult.value; index += 1) {
      const childPath = `${pathName}[${index}]`;
      const leftChildResult = safeReadProperty(left, index, childPath);
      if (!leftChildResult.ok) {
        return leftChildResult.id;
      }
      const rightChildResult = safeReadProperty(right, index, childPath);
      if (!rightChildResult.ok) {
        return rightChildResult.id;
      }
      const childDifferencePath = findFirstDifferencePath(
        leftChildResult.value,
        rightChildResult.value,
        childPath
      );
      if (childDifferencePath !== null) {
        return childDifferencePath;
      }
    }
    return null;
  }

  const leftKeysResult = safeEnumerableStringKeys(left, pathName);
  if (!leftKeysResult.ok) {
    return leftKeysResult.id;
  }
  const rightKeysResult = safeEnumerableStringKeys(right, pathName);
  if (!rightKeysResult.ok) {
    return rightKeysResult.id;
  }
  const leftKeys = leftKeysResult.keys;
  const rightKeys = rightKeysResult.keys;
  if (leftKeys.length !== rightKeys.length) {
    return `${pathName}.keys`;
  }
  for (let index = 0; index < leftKeys.length; index += 1) {
    if (leftKeys[index] !== rightKeys[index]) {
      return `${pathName}.keys[${index}]`;
    }
  }
  for (const key of leftKeys) {
    const childPath = `${pathName}.${key}`;
    const leftChildResult = safeReadProperty(left, key, childPath);
    if (!leftChildResult.ok) {
      return leftChildResult.id;
    }
    const rightChildResult = safeReadProperty(right, key, childPath);
    if (!rightChildResult.ok) {
      return rightChildResult.id;
    }
    const childDifferencePath = findFirstDifferencePath(
      leftChildResult.value,
      rightChildResult.value,
      childPath
    );
    if (childDifferencePath !== null) {
      return childDifferencePath;
    }
  }
  return null;
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
      id: `${path}.[[IsArray]]`
    };
  }
}

function safeEnumerableStringKeys(value, path) {
  try {
    return {
      ok: true,
      keys: Object.keys(value)
    };
  } catch {
    return {
      ok: false,
      id: `${path}.[[OwnKeys]]`
    };
  }
}

function indexRowsById(rows) {
  return freezeRecord(
    Object.fromEntries(
      rows
        .filter((row) => typeof row?.rowId === "string")
        .map((row) => [row.rowId, row])
    )
  );
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

function freezeBoundaryRowWithDiagnosticIdentity(row) {
  const sourceDiagnosticIdentity = createSourceOwnedDiagnosticIdentity(row);
  if (
    row.diagnosticObject !== null &&
    typeof row.diagnosticObject === "object"
  ) {
    sourceOwnedDiagnosticIdentityByObject.set(
      row.diagnosticObject,
      sourceDiagnosticIdentity
    );
  }
  return freezeBoundaryRow({
    ...row,
    sourceDiagnosticIdentity
  });
}

function createSourceOwnedDiagnosticIdentity(row) {
  return freezeRecord({
    identityKind:
      "scheduler-variant-boundary-diagnostics-source-owned-diagnostic-identity",
    sequence: nextSourceOwnedDiagnosticIdentitySequence++,
    rowId: row.rowId ?? null,
    variantId: row.variantId ?? null,
    wrapperVariantId: row.wrapperVariantId ?? null,
    selectedCjsVariantId: row.selectedCjsVariantId ?? null,
    classification: row.classification ?? null,
    entrypoint: row.entrypoint ?? null,
    selectedCjsEntrypoint: row.selectedCjsEntrypoint ?? null,
    diagnosticStatus: row.diagnosticStatus ?? null,
    diagnosticExportName: row.diagnosticExportName ?? null,
    diagnosticSymbolDescription: row.diagnosticSymbolDescription ?? null
  });
}

function freezeBoundaryRow(row) {
  return freezeRecord({
    ...row,
    sourceCurrentness: freezeRecord(row.sourceCurrentness ?? {}),
    selectedSourceCurrentness: freezeRecord(row.selectedSourceCurrentness ?? {}),
    queueIdentity: freezeRecord(row.queueIdentity ?? {}),
    unsupportedStatus: freezeRecord(row.unsupportedStatus ?? {})
  });
}

function freezeArray(values) {
  return markModuleOwnedClaimContainer(Object.freeze([...values]));
}

function freezeRecord(record) {
  return markModuleOwnedClaimContainer(Object.freeze({ ...record }));
}
