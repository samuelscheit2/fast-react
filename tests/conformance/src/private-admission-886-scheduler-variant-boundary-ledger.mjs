import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WORKSPACE_ROOT = fileURLToPath(
  new URL("../../../", import.meta.url)
);

export const PRIVATE_ADMISSION_886_GATE_ID =
  "private-admission-886-scheduler-variant-boundary-ledger-1";
export const PRIVATE_ADMISSION_886_GATE_STATUS =
  "recognized-scheduler-variant-private-diagnostic-boundaries-public-blocked";
export const PRIVATE_ADMISSION_886_VIOLATION_STATUS =
  "blocked-scheduler-variant-private-diagnostic-boundaries-with-violations";

export const PRIVATE_ADMISSION_886_VARIANTS = freezeArray([
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

export const PRIVATE_ADMISSION_886_PUBLIC_BLOCKER_FIELDS = freezeArray([
  "publicSchedulerTimingCompatibilityClaimed",
  "publicSchedulerFlushHelperCompatibilityClaimed",
  "publicSchedulerFlushBehaviorExecuted",
  "publicSchedulerFlushExecutionAvailable",
  "drainsPublicSchedulerTaskQueue",
  "publicRootSchedulerCompatibilityClaimed",
  "publicRootExecutionClaimed",
  "rootExecutionClaimed",
  "executesQueuedWork",
  "publicReactActCompatibilityClaimed",
  "publicActBehaviorClaimed",
  "reactActBehaviorClaimed",
  "packageCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "packageSurfaceChanged",
  "newPublicExportsAdded",
  "publicDiagnosticExportAdded",
  "nativeCompatibilityClaimed",
  "publicNativeCompatibilityClaimed",
  "nativeRuntimeCompatibilityClaimed",
  "nativePublicBehaviorClaimed",
  "postTaskCompatibilityClaimed",
  "browserPostTaskCompatibilityClaimed",
  "browserTaskOrderingCompatibilityClaimed",
  "postTaskPublicBehaviorClaimed",
  "mockSchedulerCompatibilityClaimed",
  "mockSchedulerPublicBehaviorClaimed",
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
  "publicEffectExecutionClaimed"
]);

export const PRIVATE_ADMISSION_886_REQUIRED_TRUE_REQUIREMENTS = freezeArray([
  "privateEvidenceOnly",
  "sourceOwnedPackageEntrypoint",
  "sourceOwnedDiagnosticIdentifiers",
  "sourceOwnedDiagnosticRoles",
  "variantBoundaryPinned",
  "crossVariantEvidenceRejected",
  "staticReadOnlyLedger",
  "sourceTokenChecksOnly",
  "manifestEvaluationOnly",
  "packageSurfaceUnchanged"
]);

export const PRIVATE_ADMISSION_886_REQUIRED_FALSE_REQUIREMENTS = freezeArray([
  "runtimeExecutionClaimed",
  "publicSchedulerTimingCompatibilityClaimed",
  "publicRootSchedulerCompatibilityClaimed",
  "publicReactActCompatibilityClaimed",
  "publicPackageCompatibilityClaimed",
  "publicNativeCompatibilityClaimed",
  "publicPostTaskCompatibilityClaimed",
  "publicMockSchedulerCompatibilityClaimed",
  "rootExecutionClaimed",
  "nativePublicBehaviorClaimed",
  "postTaskPublicBehaviorClaimed",
  "mockPublicBehaviorClaimed",
  "newPublicExportsAdded",
  "packageSurfaceChanged"
]);

export const PRIVATE_ADMISSION_886_REQUIRED_REQUIREMENT_FIELDS = freezeArray([
  ...PRIVATE_ADMISSION_886_REQUIRED_TRUE_REQUIREMENTS,
  ...PRIVATE_ADMISSION_886_REQUIRED_FALSE_REQUIREMENTS
]);

export const PRIVATE_ADMISSION_886_DURABLE_EVIDENCE_TOKEN_CLASSES =
  freezeArray([
    freezeRecord({
      id: "js-identifier-field-function-or-constant",
      pattern: /^[$A-Z_a-z][\w$]*$/u
    }),
    freezeRecord({
      id: "private-fast-react-export-marker",
      pattern: /^__FAST_REACT_[A-Z0-9_]+__$/u
    }),
    freezeRecord({
      id: "diagnostic-status-or-private-kind",
      pattern: /^[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*$/u
    }),
    freezeRecord({
      id: "scheduler-package-target",
      pattern: /^scheduler@\d+\.\d+\.\d+$/u
    }),
    freezeRecord({
      id: "scheduler-package-subpath",
      pattern: /^scheduler(?:\/[a-z0-9_.-]+)*$/u
    }),
    freezeRecord({
      id: "scheduler-physical-entrypoint-file",
      pattern: /^[a-z][a-z0-9_-]*(?:[./][a-z0-9_-]+)*\.js$/u
    })
  ]);

export const PRIVATE_ADMISSION_886_NON_DURABLE_EVIDENCE_TOKEN_SHAPES =
  freezeArray([
    freezeRecord({
      id: "object-api-expression",
      pattern: /\bObject\.[A-Za-z_$][\w$]*\s*\(/u
    }),
    freezeRecord({
      id: "source-declaration-snippet",
      pattern: /^\s*(?:const|let|var|function)\s/u
    }),
    freezeRecord({
      id: "field-value-expression",
      pattern: /:\s*(?:true|false|null|undefined|["']|\d)/u
    }),
    freezeRecord({
      id: "string-literal-snippet",
      pattern: /^["'][\s\S]*["']$/u
    }),
    freezeRecord({
      id: "member-call-expression",
      pattern: /\b[$A-Z_a-z][\w$]*\.[_$A-Z_a-z][\w$]*\s*\(/u
    }),
    freezeRecord({
      id: "member-expression-snippet",
      pattern: /\b[$A-Z_a-z][\w$]*\.[_$A-Z_a-z][\w$]*/u
    }),
    freezeRecord({
      id: "block-or-statement-syntax",
      pattern: /[{};]/u
    }),
    freezeRecord({
      id: "prose-test-title-or-error-message",
      pattern: /\s/u
    }),
    freezeRecord({
      id: "unapproved-evidence-token-context",
      pattern: /[\s\S]/u
    })
  ]);

const noPrivateDiagnostics = freezeArray([]);
const noPrivateDiagnosticStatuses = freezeArray([]);
const noPrivateDiagnosticRoles = freezeArray([]);

const mockRootDiagnosticIds = freezeArray([
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
  "fast-react.scheduler.mock-expired-act-root-work-source-validator",
  "fast-react.scheduler.mock-expired-work-diagnostics",
  "fast-react.scheduler.mock-frame-budget-diagnostics",
  "fast-react.scheduler.mock-expired-lane-priority-root-metadata",
  "fast-react.scheduler.mock-expired-lane-flush-diagnostics",
  "fast-react.scheduler.mock-expired-act-root-work-metadata",
  "fast-react.scheduler.mock-expired-act-root-work-diagnostics",
  "fast-react.scheduler.mock-delayed-act-root-work-metadata",
  "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
  "fast-react.scheduler.mock-delayed-renderer-root-work-metadata"
]);

const mockRootDiagnosticStatuses = freezeArray([
  "private-scheduler-act-queue-flush-diagnostics",
  "described-expired-mock-scheduler-work-for-diagnostics",
  "described-mock-scheduler-frame-budget-for-diagnostics",
  "drained-expired-mock-scheduler-work-with-lane-metadata-for-diagnostics",
  "drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
  "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
  "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
  "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff",
  "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata"
]);

const mockRootDiagnosticRoles = freezeArray([
  "mock-private-act-queue-flush-diagnostics",
  "mock-private-expired-work-diagnostics",
  "mock-private-frame-budget-diagnostics",
  "mock-private-expired-lane-diagnostics",
  "mock-private-expired-act-root-diagnostics",
  "mock-private-delayed-act-root-diagnostics",
  "mock-private-delayed-renderer-root-diagnostics"
]);

const mockCjsDiagnosticIds = freezeArray([
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
]);

const mockCjsDiagnosticStatuses = freezeArray([
  "private-scheduler-act-queue-flush-diagnostics"
]);

const mockCjsDiagnosticRoles = freezeArray([
  "mock-cjs-private-act-queue-flush-diagnostics"
]);

const postTaskDiagnosticIds = freezeArray([
  "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
  "fast-react.scheduler.unstable_post_task.priority-diagnostics",
  "fast-react.scheduler.post_task.private-act-root-work-handoff"
]);

const postTaskDiagnosticStatuses = freezeArray([
  "private-scheduler-post-task-priority-diagnostics",
  "scheduler-post-task-private-priority-timeout-diagnostics",
  "accepted-private-scheduler-post-task-act-root-work-handoff",
  "pending-private-root-continuation-execution-route"
]);

const postTaskDiagnosticRoles = freezeArray([
  "post-task-private-priority-diagnostics",
  "post-task-private-act-root-handoff-diagnostics"
]);

const privateDiagnosticForbiddenTokens = freezeArray([
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
  "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
  "private-scheduler-act-queue-flush-diagnostics",
  "private-scheduler-post-task-priority-diagnostics",
  "fast-react.scheduler.mock-expired-act-root-work-diagnostics",
  "fast-react.scheduler.unstable_post_task.priority-diagnostics"
]);

const postTaskForbiddenMockTokens = freezeArray([
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
  "fast-react.scheduler.mock-expired-act-root-work-diagnostics",
  "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
  "fast-react.scheduler.mock-delayed-renderer-root-work-metadata"
]);

const mockCjsForbiddenRootOnlyTokens = freezeArray([
  "fast-react.scheduler.mock-expired-act-root-work-diagnostics",
  "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
  "fast-react.scheduler.mock-delayed-renderer-root-work-metadata"
]);

const schedulerIndexWrapperPath = "packages/scheduler/index.js";
const schedulerMockPath = "packages/scheduler/unstable_mock.js";
const schedulerPostTaskWrapperPath = "packages/scheduler/unstable_post_task.js";
const schedulerNativeWrapperPath = "packages/scheduler/index.native.js";
const schedulerCjsIndexDevelopmentPath =
  "packages/scheduler/cjs/scheduler.development.js";
const schedulerCjsIndexProductionPath =
  "packages/scheduler/cjs/scheduler.production.js";
const schedulerCjsMockDevelopmentPath =
  "packages/scheduler/cjs/scheduler-unstable_mock.development.js";
const schedulerCjsMockProductionPath =
  "packages/scheduler/cjs/scheduler-unstable_mock.production.js";
const schedulerCjsPostTaskDevelopmentPath =
  "packages/scheduler/cjs/scheduler-unstable_post_task.development.js";
const schedulerCjsPostTaskProductionPath =
  "packages/scheduler/cjs/scheduler-unstable_post_task.production.js";
const schedulerCjsNativeDevelopmentPath =
  "packages/scheduler/cjs/scheduler.native.development.js";
const schedulerCjsNativeProductionPath =
  "packages/scheduler/cjs/scheduler.native.production.js";
const schedulerPackageJsonPath = "packages/scheduler/package.json";
const schedulerPackageName = "scheduler";
const schedulerPackageVersion = "0.27.0";

const mockRootPrivateDiagnosticSourceIds = freezeArray([
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
  "fast-react.scheduler.mock-delayed-act-root-work-diagnostics",
  "fast-react.scheduler.mock-delayed-act-root-work-metadata",
  "fast-react.scheduler.mock-delayed-renderer-root-work-metadata",
  "fast-react.scheduler.mock-expired-act-root-work-diagnostics",
  "fast-react.scheduler.mock-expired-act-root-work-metadata",
  "fast-react.scheduler.mock-expired-act-root-work-source-validator",
  "fast-react.scheduler.mock-expired-lane-flush-diagnostics",
  "fast-react.scheduler.mock-expired-lane-priority-root-metadata",
  "fast-react.scheduler.mock-expired-work-diagnostics",
  "fast-react.scheduler.mock-frame-budget-diagnostics"
]);

const mockRootPrivateDiagnosticSourceStatuses = freezeArray([
  "accepted-private-delayed-renderer-root-work-metadata-for-diagnostics",
  "described-expired-mock-scheduler-work-for-diagnostics",
  "described-mock-scheduler-frame-budget-for-diagnostics",
  "drained-delayed-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
  "drained-expired-mock-scheduler-work-with-act-root-metadata-for-diagnostics",
  "drained-expired-mock-scheduler-work-with-lane-metadata-for-diagnostics",
  "private-mock-yield-and-paint-state",
  "private-scheduler-act-queue-flush-diagnostics",
  "produced-private-delayed-act-root-work-metadata-from-accepted-renderer-root-metadata",
  "produced-private-delayed-act-root-work-metadata-from-accepted-root-metadata",
  "produced-private-delayed-renderer-root-work-metadata-for-private-act-root-handoff"
]);

const mockCjsPrivateDiagnosticSourceIds = freezeArray([
  "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__"
]);

const mockCjsPrivateDiagnosticSourceStatuses = freezeArray([
  "drained-accepted-internal-test-queue",
  "drained-expired-mock-scheduler-work-for-diagnostics",
  "private-scheduler-act-queue-flush-diagnostics"
]);

const postTaskPrivateDiagnosticSourceIds = freezeArray([
  "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
  "fast-react.scheduler.post_task.private-act-root-work-handoff",
  "fast-react.scheduler.unstable_post_task.priority-diagnostics"
]);

const postTaskPrivateDiagnosticSourceStatuses = freezeArray([
  "accepted-private-scheduler-post-task-act-queue-handoff",
  "accepted-private-scheduler-post-task-act-root-work-handoff",
  "pending-private-root-continuation-execution-route",
  "private-scheduler-post-task-priority-diagnostics",
  "private-scheduler-post-task-root-continuation-execution-route",
  "scheduler-post-task-private-priority-timeout-diagnostics"
]);

const privateAdmission886Rows = freezeArray([
  ledgerRow({
    variantId: "scheduler-index-wrapper",
    variantFamily: "index",
    entrypoint: "scheduler",
    sourceFile: schedulerIndexWrapperPath,
    physicalEntrypoint: "index.js",
    runtimeMode: "node-env-wrapper",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerIndexWrapperPath,
      physicalEntrypoint: "index.js",
      canonicalEntrypoint: "scheduler",
      variantFamily: "index",
      runtimeMode: "node-env-wrapper",
      sourceKind: "node-env-wrapper",
      sourceSha256:
        "145965504d60007bc25486ab930b0367867dcd5d579ccd343c148d69349a7cfb",
      wrapperTargets: [
        "cjs/scheduler.production.js",
        "cjs/scheduler.development.js"
      ]
    }),
    acceptedDiagnosticIds: noPrivateDiagnostics,
    acceptedDiagnosticStatuses: noPrivateDiagnosticStatuses,
    acceptedDiagnosticRoles: noPrivateDiagnosticRoles,
    evidence: freezeArray([
      evidenceData({
        role: "scheduler-index-wrapper-source",
        path: schedulerIndexWrapperPath,
        tokens: ["scheduler.production.js", "scheduler.development.js"],
        forbiddenTokens: privateDiagnosticForbiddenTokens
      })
    ])
  }),
  ledgerRow({
    variantId: "scheduler-cjs-index-development",
    variantFamily: "index",
    entrypoint: "scheduler/cjs/scheduler.development.js",
    sourceFile: schedulerCjsIndexDevelopmentPath,
    physicalEntrypoint: "cjs/scheduler.development.js",
    runtimeMode: "development",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerCjsIndexDevelopmentPath,
      physicalEntrypoint: "cjs/scheduler.development.js",
      canonicalEntrypoint: "scheduler/cjs/scheduler.development.js",
      variantFamily: "index",
      runtimeMode: "development",
      sourceKind: "cjs-development-guarded",
      sourceSha256:
        "646eb671c8585382baff16daf92fe16a4cdd10dcf1a363c58b2ae1f6bf3a2b8d",
      declaredLicenseFile: "scheduler.development.js"
    }),
    acceptedDiagnosticIds: noPrivateDiagnostics,
    acceptedDiagnosticStatuses: noPrivateDiagnosticStatuses,
    acceptedDiagnosticRoles: noPrivateDiagnosticRoles,
    evidence: freezeArray([
      evidenceData({
        role: "scheduler-cjs-index-development-source",
        path: schedulerCjsIndexDevelopmentPath,
        tokens: ["scheduler.development.js"],
        forbiddenTokens: privateDiagnosticForbiddenTokens
      })
    ])
  }),
  ledgerRow({
    variantId: "scheduler-cjs-index-production",
    variantFamily: "index",
    entrypoint: "scheduler/cjs/scheduler.production.js",
    sourceFile: schedulerCjsIndexProductionPath,
    physicalEntrypoint: "cjs/scheduler.production.js",
    runtimeMode: "production",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerCjsIndexProductionPath,
      physicalEntrypoint: "cjs/scheduler.production.js",
      canonicalEntrypoint: "scheduler/cjs/scheduler.production.js",
      variantFamily: "index",
      runtimeMode: "production",
      sourceKind: "cjs-production",
      sourceSha256:
        "679adff761d31e9426604f80c0e99be44a3e6f4c6834b0218ecf0312a67c171f",
      declaredLicenseFile: "scheduler.production.js"
    }),
    acceptedDiagnosticIds: noPrivateDiagnostics,
    acceptedDiagnosticStatuses: noPrivateDiagnosticStatuses,
    acceptedDiagnosticRoles: noPrivateDiagnosticRoles,
    evidence: freezeArray([
      evidenceData({
        role: "scheduler-cjs-index-production-source",
        path: schedulerCjsIndexProductionPath,
        tokens: ["scheduler.production.js"],
        forbiddenTokens: privateDiagnosticForbiddenTokens
      })
    ])
  }),
  ledgerRow({
    variantId: "scheduler-unstable-mock-root",
    variantFamily: "unstable_mock",
    entrypoint: "scheduler/unstable_mock",
    sourceFile: schedulerMockPath,
    physicalEntrypoint: "unstable_mock.js",
    runtimeMode: "package-root-source",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerMockPath,
      physicalEntrypoint: "unstable_mock.js",
      canonicalEntrypoint: "scheduler/unstable_mock",
      variantFamily: "unstable_mock",
      runtimeMode: "package-root-source",
      sourceKind: "package-root-private-mock-wrapper",
      sourceSha256:
        "5de8b249891e244b1350be48bf7b31288ee50ee90ed30d916c34750e3a531b3b",
      wrapperTargets: [
        "cjs/scheduler-unstable_mock.production.js",
        "cjs/scheduler-unstable_mock.development.js"
      ],
      diagnosticEntrypoints: ["scheduler/unstable_mock"],
      diagnosticCompatibilityTargets: [schedulerPackageVersionTarget()],
      privateDiagnosticSourceIds: mockRootPrivateDiagnosticSourceIds,
      privateDiagnosticSourceStatuses: mockRootPrivateDiagnosticSourceStatuses
    }),
    acceptedDiagnosticIds: mockRootDiagnosticIds,
    acceptedDiagnosticStatuses: mockRootDiagnosticStatuses,
    acceptedDiagnosticRoles: mockRootDiagnosticRoles,
    evidence: freezeArray([
      evidenceData({
        role: "scheduler-unstable-mock-private-diagnostic-ids",
        path: schedulerMockPath,
        tokens: mockRootDiagnosticIds
      }),
      evidenceData({
        role: "scheduler-unstable-mock-private-diagnostic-statuses",
        path: schedulerMockPath,
        tokens: mockRootDiagnosticStatuses
      }),
      evidenceData({
        role: "scheduler-unstable-mock-source-owned-boundary",
        path: schedulerMockPath,
        tokens: [
          "schedulerCompatibilityTarget",
          "scheduler@0.27.0",
          "scheduler/unstable_mock",
          "schedulerMockExpiredActRootWorkSources",
          "schedulerMockExpiredActRootWorkSourceValidator",
          "freezeSchedulerOwnedExpiredActRootWorkSource",
          "isSchedulerMockExpiredActRootWorkSource",
          "providesExpiredActRootWorkSourceValidatorThroughPrivateDiagnostics"
        ],
        forbiddenTokens: ["__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__"]
      })
    ])
  }),
  ledgerRow({
    variantId: "scheduler-cjs-unstable-mock-development",
    variantFamily: "unstable_mock",
    entrypoint: "scheduler/cjs/scheduler-unstable_mock.development.js",
    sourceFile: schedulerCjsMockDevelopmentPath,
    physicalEntrypoint: "cjs/scheduler-unstable_mock.development.js",
    runtimeMode: "development",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerCjsMockDevelopmentPath,
      physicalEntrypoint: "cjs/scheduler-unstable_mock.development.js",
      canonicalEntrypoint:
        "scheduler/cjs/scheduler-unstable_mock.development.js",
      variantFamily: "unstable_mock",
      runtimeMode: "development",
      sourceKind: "cjs-development",
      sourceSha256:
        "ed9e45f83cff393243d81449ef21bf652ff23a6b30cd61308eb7cec4e1d13fb9",
      diagnosticEntrypoints: ["scheduler/unstable_mock"],
      diagnosticCompatibilityTargets: [schedulerPackageVersionTarget()],
      privateDiagnosticSourceIds: mockCjsPrivateDiagnosticSourceIds,
      privateDiagnosticSourceStatuses: mockCjsPrivateDiagnosticSourceStatuses
    }),
    acceptedDiagnosticIds: mockCjsDiagnosticIds,
    acceptedDiagnosticStatuses: mockCjsDiagnosticStatuses,
    acceptedDiagnosticRoles: mockCjsDiagnosticRoles,
    evidence: freezeArray([
      cjsMockEvidence(
        "scheduler-cjs-unstable-mock-development-source",
        schedulerCjsMockDevelopmentPath
      )
    ])
  }),
  ledgerRow({
    variantId: "scheduler-cjs-unstable-mock-production",
    variantFamily: "unstable_mock",
    entrypoint: "scheduler/cjs/scheduler-unstable_mock.production.js",
    sourceFile: schedulerCjsMockProductionPath,
    physicalEntrypoint: "cjs/scheduler-unstable_mock.production.js",
    runtimeMode: "production",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerCjsMockProductionPath,
      physicalEntrypoint: "cjs/scheduler-unstable_mock.production.js",
      canonicalEntrypoint:
        "scheduler/cjs/scheduler-unstable_mock.production.js",
      variantFamily: "unstable_mock",
      runtimeMode: "production",
      sourceKind: "cjs-production",
      sourceSha256:
        "ed9e45f83cff393243d81449ef21bf652ff23a6b30cd61308eb7cec4e1d13fb9",
      diagnosticEntrypoints: ["scheduler/unstable_mock"],
      diagnosticCompatibilityTargets: [schedulerPackageVersionTarget()],
      privateDiagnosticSourceIds: mockCjsPrivateDiagnosticSourceIds,
      privateDiagnosticSourceStatuses: mockCjsPrivateDiagnosticSourceStatuses
    }),
    acceptedDiagnosticIds: mockCjsDiagnosticIds,
    acceptedDiagnosticStatuses: mockCjsDiagnosticStatuses,
    acceptedDiagnosticRoles: mockCjsDiagnosticRoles,
    evidence: freezeArray([
      cjsMockEvidence(
        "scheduler-cjs-unstable-mock-production-source",
        schedulerCjsMockProductionPath
      )
    ])
  }),
  ledgerRow({
    variantId: "scheduler-unstable-post-task-wrapper",
    variantFamily: "unstable_post_task",
    entrypoint: "scheduler/unstable_post_task",
    sourceFile: schedulerPostTaskWrapperPath,
    physicalEntrypoint: "unstable_post_task.js",
    runtimeMode: "node-env-wrapper",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerPostTaskWrapperPath,
      physicalEntrypoint: "unstable_post_task.js",
      canonicalEntrypoint: "scheduler/unstable_post_task",
      variantFamily: "unstable_post_task",
      runtimeMode: "node-env-wrapper",
      sourceKind: "node-env-wrapper",
      sourceSha256:
        "2aa725364b0efa1772c01cd978ac888b655711645768bdcf5e885a0c4e435ef2",
      wrapperTargets: [
        "cjs/scheduler-unstable_post_task.production.js",
        "cjs/scheduler-unstable_post_task.development.js"
      ]
    }),
    acceptedDiagnosticIds: noPrivateDiagnostics,
    acceptedDiagnosticStatuses: noPrivateDiagnosticStatuses,
    acceptedDiagnosticRoles: noPrivateDiagnosticRoles,
    evidence: freezeArray([
      evidenceData({
        role: "scheduler-unstable-post-task-wrapper-source",
        path: schedulerPostTaskWrapperPath,
        tokens: [
          "scheduler-unstable_post_task.production.js",
          "scheduler-unstable_post_task.development.js"
        ],
        forbiddenTokens: privateDiagnosticForbiddenTokens
      })
    ])
  }),
  ledgerRow({
    variantId: "scheduler-cjs-unstable-post-task-development",
    variantFamily: "unstable_post_task",
    entrypoint: "scheduler/unstable_post_task",
    sourceFile: schedulerCjsPostTaskDevelopmentPath,
    physicalEntrypoint: "cjs/scheduler-unstable_post_task.development.js",
    runtimeMode: "development",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerCjsPostTaskDevelopmentPath,
      physicalEntrypoint: "cjs/scheduler-unstable_post_task.development.js",
      canonicalEntrypoint:
        "scheduler/cjs/scheduler-unstable_post_task.development.js",
      variantFamily: "unstable_post_task",
      runtimeMode: "development",
      sourceKind: "cjs-development-guarded",
      sourceSha256:
        "d05654ade272adfcc73486f31125a0d5b8b5781d0a0cf94aea78a48dc1ee1f93",
      declaredLicenseFile: "scheduler-unstable_post_task.development.js",
      diagnosticEntrypoints: ["scheduler/unstable_post_task"],
      diagnosticCompatibilityTargets: [schedulerPackageVersionTarget()],
      privateDiagnosticSourceIds: postTaskPrivateDiagnosticSourceIds,
      privateDiagnosticSourceStatuses: postTaskPrivateDiagnosticSourceStatuses
    }),
    acceptedDiagnosticIds: postTaskDiagnosticIds,
    acceptedDiagnosticStatuses: postTaskDiagnosticStatuses,
    acceptedDiagnosticRoles: postTaskDiagnosticRoles,
    evidence: freezeArray([
      postTaskEvidence(
        "scheduler-cjs-unstable-post-task-development-source",
        schedulerCjsPostTaskDevelopmentPath
      )
    ])
  }),
  ledgerRow({
    variantId: "scheduler-cjs-unstable-post-task-production",
    variantFamily: "unstable_post_task",
    entrypoint: "scheduler/unstable_post_task",
    sourceFile: schedulerCjsPostTaskProductionPath,
    physicalEntrypoint: "cjs/scheduler-unstable_post_task.production.js",
    runtimeMode: "production",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerCjsPostTaskProductionPath,
      physicalEntrypoint: "cjs/scheduler-unstable_post_task.production.js",
      canonicalEntrypoint:
        "scheduler/cjs/scheduler-unstable_post_task.production.js",
      variantFamily: "unstable_post_task",
      runtimeMode: "production",
      sourceKind: "cjs-production",
      sourceSha256:
        "9ffc921ccb13a0a58dbc0c951c248129ff4790b7c4890cde1fbc1dd97cd5aac1",
      declaredLicenseFile: "scheduler-unstable_post_task.production.js",
      diagnosticEntrypoints: ["scheduler/unstable_post_task"],
      diagnosticCompatibilityTargets: [schedulerPackageVersionTarget()],
      privateDiagnosticSourceIds: postTaskPrivateDiagnosticSourceIds,
      privateDiagnosticSourceStatuses: postTaskPrivateDiagnosticSourceStatuses
    }),
    acceptedDiagnosticIds: postTaskDiagnosticIds,
    acceptedDiagnosticStatuses: postTaskDiagnosticStatuses,
    acceptedDiagnosticRoles: postTaskDiagnosticRoles,
    evidence: freezeArray([
      postTaskEvidence(
        "scheduler-cjs-unstable-post-task-production-source",
        schedulerCjsPostTaskProductionPath
      )
    ])
  }),
  ledgerRow({
    variantId: "scheduler-native-wrapper",
    variantFamily: "native",
    entrypoint: "scheduler/index.native.js",
    sourceFile: schedulerNativeWrapperPath,
    physicalEntrypoint: "index.native.js",
    runtimeMode: "node-env-wrapper",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerNativeWrapperPath,
      physicalEntrypoint: "index.native.js",
      canonicalEntrypoint: "scheduler/index.native.js",
      variantFamily: "native",
      runtimeMode: "node-env-wrapper",
      sourceKind: "node-env-wrapper",
      sourceSha256:
        "f1c2fea33a9252ccba1f7c7a9310ea7c0e82f3cff1bc7c693ff153bd54175b25",
      wrapperTargets: [
        "cjs/scheduler.native.production.js",
        "cjs/scheduler.native.development.js"
      ]
    }),
    acceptedDiagnosticIds: noPrivateDiagnostics,
    acceptedDiagnosticStatuses: noPrivateDiagnosticStatuses,
    acceptedDiagnosticRoles: noPrivateDiagnosticRoles,
    evidence: freezeArray([
      evidenceData({
        role: "scheduler-native-wrapper-source",
        path: schedulerNativeWrapperPath,
        tokens: [
          "scheduler.native.production.js",
          "scheduler.native.development.js"
        ],
        forbiddenTokens: privateDiagnosticForbiddenTokens
      })
    ])
  }),
  ledgerRow({
    variantId: "scheduler-cjs-native-development",
    variantFamily: "native",
    entrypoint: "scheduler/cjs/scheduler.native.development.js",
    sourceFile: schedulerCjsNativeDevelopmentPath,
    physicalEntrypoint: "cjs/scheduler.native.development.js",
    runtimeMode: "development",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerCjsNativeDevelopmentPath,
      physicalEntrypoint: "cjs/scheduler.native.development.js",
      canonicalEntrypoint: "scheduler/cjs/scheduler.native.development.js",
      variantFamily: "native",
      runtimeMode: "development",
      sourceKind: "cjs-development-guarded",
      sourceSha256:
        "003f02f0ac053d5f215feff0e9c8a34550059a489a8f31ec1cdbaf671baf6444"
    }),
    acceptedDiagnosticIds: noPrivateDiagnostics,
    acceptedDiagnosticStatuses: noPrivateDiagnosticStatuses,
    acceptedDiagnosticRoles: noPrivateDiagnosticRoles,
    evidence: freezeArray([
      evidenceData({
        role: "scheduler-cjs-native-development-source",
        path: schedulerCjsNativeDevelopmentPath,
        tokens: ["nativeRuntimeScheduler"],
        forbiddenTokens: privateDiagnosticForbiddenTokens
      })
    ])
  }),
  ledgerRow({
    variantId: "scheduler-cjs-native-production",
    variantFamily: "native",
    entrypoint: "scheduler/cjs/scheduler.native.production.js",
    sourceFile: schedulerCjsNativeProductionPath,
    physicalEntrypoint: "cjs/scheduler.native.production.js",
    runtimeMode: "production",
    sourceCurrentness: sourceCurrentnessData({
      sourceFile: schedulerCjsNativeProductionPath,
      physicalEntrypoint: "cjs/scheduler.native.production.js",
      canonicalEntrypoint: "scheduler/cjs/scheduler.native.production.js",
      variantFamily: "native",
      runtimeMode: "production",
      sourceKind: "cjs-production",
      sourceSha256:
        "0dcfdb13779a22a71a60427d8396c7b8b9cf752cec23715eaea016897e5b69ab"
    }),
    acceptedDiagnosticIds: noPrivateDiagnostics,
    acceptedDiagnosticStatuses: noPrivateDiagnosticStatuses,
    acceptedDiagnosticRoles: noPrivateDiagnosticRoles,
    evidence: freezeArray([
      evidenceData({
        role: "scheduler-cjs-native-production-source",
        path: schedulerCjsNativeProductionPath,
        tokens: ["nativeRuntimeScheduler"],
        forbiddenTokens: privateDiagnosticForbiddenTokens
      })
    ])
  })
]);

export const PRIVATE_ADMISSION_886_REQUIRED_SOURCE_BOUNDARIES = freezeRecord(
  Object.fromEntries(
    privateAdmission886Rows.map((row) => [
      row.variantId,
      freezeRecord(row.sourceBoundary)
    ])
  )
);

export const PRIVATE_ADMISSION_886_REQUIRED_SOURCE_CURRENTNESS = freezeRecord(
  Object.fromEntries(
    privateAdmission886Rows.map((row) => [
      row.variantId,
      freezeSourceCurrentness(row.sourceCurrentness)
    ])
  )
);

export const PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_IDS = freezeRecord(
  Object.fromEntries(
    privateAdmission886Rows.map((row) => [
      row.variantId,
      freezeArray(row.acceptedDiagnosticIds)
    ])
  )
);

export const PRIVATE_ADMISSION_886_REQUIRED_STATUSES = freezeRecord(
  Object.fromEntries(
    privateAdmission886Rows.map((row) => [
      row.variantId,
      freezeArray(row.acceptedDiagnosticStatuses)
    ])
  )
);

export const PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_ROLES = freezeRecord(
  Object.fromEntries(
    privateAdmission886Rows.map((row) => [
      row.variantId,
      freezeArray(row.acceptedDiagnosticRoles)
    ])
  )
);

export const PRIVATE_ADMISSION_886_REQUIRED_EVIDENCE_ROLES = freezeRecord(
  Object.fromEntries(
    privateAdmission886Rows.map((row) => [
      row.variantId,
      freezeArray(row.evidence.map((evidenceRow) => evidenceRow.role))
    ])
  )
);

export const PRIVATE_ADMISSION_886_APPROVED_EVIDENCE_CONTEXTS_BY_ROLE =
  freezeRecord(
    Object.fromEntries(
      privateAdmission886Rows.flatMap((row) =>
        row.evidence.map((evidenceRow) => [
          evidenceRow.role,
          freezeRecord({
            variantId: row.variantId,
            path: evidenceRow.path,
            tokens: freezeArray(evidenceRow.tokens)
          })
        ])
      )
    )
  );

export const PRIVATE_ADMISSION_886_ROWS = freezeArray(
  privateAdmission886Rows.map((row) => freezeLedgerRow(row))
);

export function evaluatePrivateAdmission886Gate({
  workspaceRoot = DEFAULT_WORKSPACE_ROOT,
  rowOverrides = {}
} = {}) {
  const fileCache = new Map();
  const rows = PRIVATE_ADMISSION_886_ROWS.map((row) =>
    mergeRowOverride(row, rowOverrides[row.variantId] ?? {})
  );
  const evaluatedRows = rows.map((row) =>
    evaluateLedgerRow({ fileCache, row, workspaceRoot })
  );
  const manifestVariantIds = evaluatedRows.map((row) => row.variantId);
  const manifest = freezeRecord({
    variantIds: freezeArray(manifestVariantIds),
    missingVariantIds: freezeArray(
      PRIVATE_ADMISSION_886_VARIANTS.filter(
        (variantId) => !manifestVariantIds.includes(variantId)
      )
    ),
    unexpectedVariantIds: freezeArray(
      manifestVariantIds.filter(
        (variantId) => !PRIVATE_ADMISSION_886_VARIANTS.includes(variantId)
      )
    ),
    duplicateVariantIds: freezeArray(
      manifestVariantIds.filter(
        (variantId, index) => manifestVariantIds.indexOf(variantId) !== index
      )
    )
  });

  const evidenceMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter(
        (evidenceRow) =>
          evidenceRow.missingTokens.length > 0 ||
          evidenceRow.forbiddenTokensPresent.length > 0 ||
          evidenceRow.readError !== null ||
          evidenceRow.approvedContextPathMismatch === true
      )
      .map((evidenceRow) =>
        freezeRecord({
          variantId: row.variantId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          expectedPath: evidenceRow.expectedPath,
          missingTokens: evidenceRow.missingTokens,
          forbiddenTokensPresent: evidenceRow.forbiddenTokensPresent,
          readError: evidenceRow.readError
        })
      )
  );
  const nonDurableEvidenceTokenMismatches = evaluatedRows.flatMap((row) =>
    row.evidence
      .filter((evidenceRow) => evidenceRow.nonDurableTokens.length > 0)
      .map((evidenceRow) =>
        freezeRecord({
          variantId: row.variantId,
          role: evidenceRow.role,
          path: evidenceRow.path,
          nonDurableTokens: evidenceRow.nonDurableTokens
        })
      )
  );
  const evidenceRoleMismatches = evaluatedRows.flatMap((row) => {
    const expectedRoles =
      PRIVATE_ADMISSION_886_REQUIRED_EVIDENCE_ROLES[row.variantId] ??
      freezeArray([]);
    const actualRoles = row.evidence.map((evidenceRow) => evidenceRow.role);
    const duplicateRoles = actualRoles.filter(
      (role, index) => actualRoles.indexOf(role) !== index
    );
    const missingRoles = expectedRoles.filter(
      (role) => !actualRoles.includes(role)
    );
    const unexpectedRoles = actualRoles.filter(
      (role) => !expectedRoles.includes(role)
    );

    if (
      actualRoles.length > 0 &&
      missingRoles.length === 0 &&
      unexpectedRoles.length === 0 &&
      duplicateRoles.length === 0 &&
      sameStringArray(actualRoles, expectedRoles)
    ) {
      return [];
    }

    return [
      freezeRecord({
        variantId: row.variantId,
        expectedEvidenceRoles: expectedRoles,
        actualEvidenceRoles: freezeArray(actualRoles),
        missingEvidenceRoles: freezeArray(missingRoles),
        unexpectedEvidenceRoles: freezeArray(unexpectedRoles),
        duplicateEvidenceRoles: freezeArray(duplicateRoles)
      })
    ];
  });
  const sourceBoundaryMismatches = evaluatedRows.flatMap((row) => {
    const expected =
      PRIVATE_ADMISSION_886_REQUIRED_SOURCE_BOUNDARIES[row.variantId];
    if (
      expected &&
      sameStringRecord(row.sourceBoundary, expected, [
        "packageName",
        "compatibilityTarget",
        "variantFamily",
        "entrypoint",
        "sourceFile",
        "physicalEntrypoint",
        "runtimeMode"
      ])
    ) {
      return [];
    }
    return [
      freezeRecord({
        variantId: row.variantId,
        expectedSourceBoundary: expected ?? null,
        actualSourceBoundary: freezeRecord(row.sourceBoundary)
      })
    ];
  });
  const sourceCurrentnessMismatches = evaluatedRows.flatMap((row) => {
    const expected =
      PRIVATE_ADMISSION_886_REQUIRED_SOURCE_CURRENTNESS[row.variantId];
    const declaredMatches =
      expected !== undefined &&
      sameSourceCurrentness(row.sourceCurrentness, expected);
    const actualMatches =
      expected !== undefined &&
      sameSourceCurrentness(row.actualSourceCurrentness, expected);

    if (declaredMatches && actualMatches) {
      return [];
    }

    return [
      freezeRecord({
        variantId: row.variantId,
        expectedSourceCurrentness: expected ?? null,
        declaredSourceCurrentness: row.sourceCurrentness,
        actualSourceCurrentness: row.actualSourceCurrentness,
        declaredSourceCurrentnessMatches: declaredMatches,
        actualSourceCurrentnessMatches: actualMatches
      })
    ];
  });
  const diagnosticMismatches = compareRequiredArrayByVariant({
    rows: evaluatedRows,
    requiredByVariant: PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_IDS,
    actualKey: "acceptedDiagnosticIds",
    expectedKey: "expectedAcceptedDiagnosticIds",
    actualKeyForViolation: "actualAcceptedDiagnosticIds"
  });
  const statusMismatches = compareRequiredArrayByVariant({
    rows: evaluatedRows,
    requiredByVariant: PRIVATE_ADMISSION_886_REQUIRED_STATUSES,
    actualKey: "acceptedDiagnosticStatuses",
    expectedKey: "expectedAcceptedDiagnosticStatuses",
    actualKeyForViolation: "actualAcceptedDiagnosticStatuses"
  });
  const diagnosticRoleMismatches = compareRequiredArrayByVariant({
    rows: evaluatedRows,
    requiredByVariant: PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_ROLES,
    actualKey: "acceptedDiagnosticRoles",
    expectedKey: "expectedAcceptedDiagnosticRoles",
    actualKeyForViolation: "actualAcceptedDiagnosticRoles"
  });
  const crossVariantDiagnosticRows = findCrossVariantDiagnosticRows(
    evaluatedRows
  );
  const requirementMismatches = evaluatedRows.flatMap((row) => {
    const mismatches = [];
    for (const key of PRIVATE_ADMISSION_886_REQUIRED_TRUE_REQUIREMENTS) {
      if (row.requirements[key] !== true) {
        mismatches.push(
          freezeRecord({
            variantId: row.variantId,
            requirement: key,
            expected: true,
            actual: row.requirements[key]
          })
        );
      }
    }
    for (const key of PRIVATE_ADMISSION_886_REQUIRED_FALSE_REQUIREMENTS) {
      if (row.requirements[key] !== false) {
        mismatches.push(
          freezeRecord({
            variantId: row.variantId,
            requirement: key,
            expected: false,
            actual: row.requirements[key]
          })
        );
      }
    }
    return mismatches;
  });
  const requirementFieldMismatches = evaluatedRows.flatMap((row) => {
    const actualFields = Object.keys(row.requirements ?? {});
    const missingFields = PRIVATE_ADMISSION_886_REQUIRED_REQUIREMENT_FIELDS.filter(
      (field) => !actualFields.includes(field)
    );
    const unexpectedFields = actualFields.filter(
      (field) =>
        !PRIVATE_ADMISSION_886_REQUIRED_REQUIREMENT_FIELDS.includes(field)
    );

    if (
      missingFields.length === 0 &&
      unexpectedFields.length === 0 &&
      sameStringSet(
        PRIVATE_ADMISSION_886_REQUIRED_REQUIREMENT_FIELDS,
        actualFields
      )
    ) {
      return [];
    }

    return [
      freezeRecord({
        variantId: row.variantId,
        expectedRequirementFields:
          PRIVATE_ADMISSION_886_REQUIRED_REQUIREMENT_FIELDS,
        actualRequirementFields: freezeArray(actualFields),
        missingRequirementFields: freezeArray(missingFields),
        unexpectedRequirementFields: freezeArray(unexpectedFields)
      })
    ];
  });
  const publicBlockerFieldMismatches = evaluatedRows.flatMap((row) => {
    const actualFields = Object.keys(row.publicBlockerClaims ?? {});
    if (sameStringSet(PRIVATE_ADMISSION_886_PUBLIC_BLOCKER_FIELDS, actualFields)) {
      return [];
    }
    return [
      freezeRecord({
        variantId: row.variantId,
        expectedPublicBlockerFields: PRIVATE_ADMISSION_886_PUBLIC_BLOCKER_FIELDS,
        actualPublicBlockerFields: freezeArray(actualFields)
      })
    ];
  });
  const publicBlockerClaimViolationIds = evaluatedRows.flatMap((row) =>
    Object.entries(row.publicBlockerClaims ?? {})
      .filter(([, claimed]) => claimed !== false)
      .map(([field]) => `${row.variantId}.${field}`)
  );
  const publicCompatibilityAliasClaimIds = publicBlockerClaimViolationIds.filter(
    (claimId) =>
      /(?:publicTimingAliasAccepted|publicRootAliasAccepted|publicActAliasAccepted|publicPackageAliasAccepted|publicNativeAliasAccepted|publicPostTaskAliasAccepted|publicMockAliasAccepted)$/.test(
        claimId
      )
  );
  const publicVariantBehaviorClaimIds = publicBlockerClaimViolationIds.filter(
    (claimId) =>
      /(?:nativeCompatibilityClaimed|publicNativeCompatibilityClaimed|nativeRuntimeCompatibilityClaimed|nativePublicBehaviorClaimed|postTaskCompatibilityClaimed|browserPostTaskCompatibilityClaimed|browserTaskOrderingCompatibilityClaimed|postTaskPublicBehaviorClaimed|mockSchedulerCompatibilityClaimed|mockSchedulerPublicBehaviorClaimed|schedulerMockCompatibilityClaimed)$/.test(
        claimId
      )
  );
  const publicPackageSurfaceClaimIds = publicBlockerClaimViolationIds.filter(
    (claimId) =>
      /(?:packageCompatibilityClaimed|publicPackageCompatibilityClaimed|packageSurfaceChanged|newPublicExportsAdded|publicDiagnosticExportAdded)$/.test(
        claimId
      )
  );
  const staticReadOnlyViolationIds = evaluatedRows
    .filter(
      (row) =>
        row.ledgerEvaluationMode !== "source-token-checks-and-manifest-only" ||
        row.requirements.staticReadOnlyLedger !== true ||
        row.requirements.sourceTokenChecksOnly !== true ||
        row.requirements.manifestEvaluationOnly !== true ||
        row.requirements.runtimeExecutionClaimed !== false
    )
    .map((row) => row.variantId);
  const sourceOwnedBoundaryViolationIds = evaluatedRows
    .filter(
      (row) =>
        row.requirements.sourceOwnedPackageEntrypoint !== true ||
        row.requirements.sourceOwnedDiagnosticIdentifiers !== true ||
        row.requirements.sourceOwnedDiagnosticRoles !== true ||
        row.requirements.variantBoundaryPinned !== true
    )
    .map((row) => row.variantId);

  const violations = [];
  if (
    manifest.missingVariantIds.length > 0 ||
    manifest.unexpectedVariantIds.length > 0 ||
    manifest.duplicateVariantIds.length > 0
  ) {
    violations.push(
      createViolation("scheduler-variant-manifest-mismatch", {
        missingVariantIds: manifest.missingVariantIds,
        unexpectedVariantIds: manifest.unexpectedVariantIds,
        duplicateVariantIds: manifest.duplicateVariantIds
      })
    );
  }
  pushRowsViolation(
    violations,
    "scheduler-variant-source-token-missing-or-context-mismatch",
    evidenceMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-non-durable-evidence-token",
    nonDurableEvidenceTokenMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-evidence-role-mismatch",
    evidenceRoleMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-boundary-mismatch",
    sourceBoundaryMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-source-currentness-mismatch",
    sourceCurrentnessMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-private-diagnostic-id-mismatch",
    diagnosticMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-private-diagnostic-status-mismatch",
    statusMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-private-diagnostic-role-mismatch",
    diagnosticRoleMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-cross-variant-private-diagnostic-row",
    crossVariantDiagnosticRows
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-requirement-mismatch",
    requirementMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-requirement-field-mismatch",
    requirementFieldMismatches
  );
  pushRowsViolation(
    violations,
    "scheduler-variant-public-blocker-field-mismatch",
    publicBlockerFieldMismatches
  );
  pushIdsViolation(
    violations,
    "scheduler-variant-public-compatibility-claim-detected",
    publicBlockerClaimViolationIds
  );
  pushIdsViolation(
    violations,
    "scheduler-variant-public-alias-claim-detected",
    publicCompatibilityAliasClaimIds
  );
  pushIdsViolation(
    violations,
    "scheduler-variant-public-behavior-claim-detected",
    publicVariantBehaviorClaimIds
  );
  pushIdsViolation(
    violations,
    "scheduler-variant-package-surface-claim-detected",
    publicPackageSurfaceClaimIds
  );
  pushIdsViolation(
    violations,
    "scheduler-variant-static-read-only-claim-mismatch",
    staticReadOnlyViolationIds
  );
  pushIdsViolation(
    violations,
    "scheduler-variant-source-owned-boundary-requirement-mismatch",
    sourceOwnedBoundaryViolationIds
  );

  const evidenceRecognized =
    evidenceMismatches.length === 0 && evidenceRoleMismatches.length === 0;
  const durableEvidenceTokensRecognized =
    nonDurableEvidenceTokenMismatches.length === 0;
  const evidenceRolesRecognized = evidenceRoleMismatches.length === 0;
  const sourceCurrentnessRecognized =
    sourceCurrentnessMismatches.length === 0;
  const sourceOwnedPackageEntrypointsRecognized =
    sourceBoundaryMismatches.length === 0 &&
    sourceCurrentnessRecognized &&
    sourceOwnedBoundaryViolationIds.length === 0;
  const privateDiagnosticIdsRecognized = diagnosticMismatches.length === 0;
  const privateDiagnosticStatusesRecognized = statusMismatches.length === 0;
  const privateDiagnosticRolesRecognized =
    diagnosticRoleMismatches.length === 0;
  const crossVariantRowsRejected = crossVariantDiagnosticRows.length === 0;
  const requirementsRecognized =
    requirementMismatches.length === 0 && requirementFieldMismatches.length === 0;
  const blockedPublicClaimsRecognized =
    publicBlockerFieldMismatches.length === 0 &&
    publicBlockerClaimViolationIds.length === 0;
  const publicCompatibilityAliasesBlocked =
    publicCompatibilityAliasClaimIds.length === 0;
  const publicVariantBehaviorClaimsBlocked =
    publicVariantBehaviorClaimIds.length === 0;
  const packageSurfaceBlocked = publicPackageSurfaceClaimIds.length === 0;
  const staticReadOnlyRecognized = staticReadOnlyViolationIds.length === 0;
  const compatibilityClaimed = publicBlockerClaimViolationIds.length > 0;
  const privateDiagnosticsRecognized =
    manifest.missingVariantIds.length === 0 &&
    manifest.unexpectedVariantIds.length === 0 &&
    manifest.duplicateVariantIds.length === 0 &&
    evidenceRecognized &&
    durableEvidenceTokensRecognized &&
    sourceCurrentnessRecognized &&
    sourceOwnedPackageEntrypointsRecognized &&
    privateDiagnosticIdsRecognized &&
    privateDiagnosticStatusesRecognized &&
    privateDiagnosticRolesRecognized &&
    crossVariantRowsRejected &&
    requirementsRecognized &&
    blockedPublicClaimsRecognized &&
    publicCompatibilityAliasesBlocked &&
    publicVariantBehaviorClaimsBlocked &&
    packageSurfaceBlocked &&
    staticReadOnlyRecognized &&
    compatibilityClaimed === false;

  return freezeRecord({
    gateId: PRIVATE_ADMISSION_886_GATE_ID,
    status: privateDiagnosticsRecognized
      ? PRIVATE_ADMISSION_886_GATE_STATUS
      : PRIVATE_ADMISSION_886_VIOLATION_STATUS,
    privateDiagnosticsRecognized,
    evidenceRecognized,
    evidenceRolesRecognized,
    durableEvidenceTokensRecognized,
    sourceCurrentnessRecognized,
    sourceOwnedPackageEntrypointsRecognized,
    privateDiagnosticIdsRecognized,
    privateDiagnosticStatusesRecognized,
    privateDiagnosticRolesRecognized,
    crossVariantRowsRejected,
    requirementsRecognized,
    blockedPublicClaimsRecognized,
    publicCompatibilityAliasesBlocked,
    publicVariantBehaviorClaimsBlocked,
    packageSurfaceBlocked,
    staticReadOnlyRecognized,
    compatibilityClaimed,
    queueVariants: PRIVATE_ADMISSION_886_VARIANTS,
    recognizedVariantIds: freezeArray(
      evaluatedRows.map((row) => row.variantId)
    ),
    publicBlockerClaimViolationIds: freezeArray(
      publicBlockerClaimViolationIds
    ),
    publicCompatibilityAliasClaimIds: freezeArray(
      publicCompatibilityAliasClaimIds
    ),
    publicVariantBehaviorClaimIds: freezeArray(publicVariantBehaviorClaimIds),
    publicPackageSurfaceClaimIds: freezeArray(publicPackageSurfaceClaimIds),
    nonDurableEvidenceTokenViolationIds: freezeArray(
      nonDurableEvidenceTokenMismatches.map(
        (mismatch) => `${mismatch.variantId}.${mismatch.role}`
      )
    ),
    evidenceRoleViolationIds: freezeArray(
      evidenceRoleMismatches.map((mismatch) => mismatch.variantId)
    ),
    sourceBoundaryViolationIds: freezeArray(
      sourceBoundaryMismatches.map((mismatch) => mismatch.variantId)
    ),
    sourceCurrentnessViolationIds: freezeArray(
      sourceCurrentnessMismatches.map((mismatch) => mismatch.variantId)
    ),
    requirementFieldViolationIds: freezeArray(
      requirementFieldMismatches.map((mismatch) => mismatch.variantId)
    ),
    staticReadOnlyViolationIds: freezeArray(staticReadOnlyViolationIds),
    sourceOwnedBoundaryViolationIds: freezeArray(
      sourceOwnedBoundaryViolationIds
    ),
    crossVariantDiagnosticViolationIds: freezeArray(
      crossVariantDiagnosticRows.map((row) => row.variantId)
    ),
    manifest,
    rows: freezeArray(evaluatedRows),
    rowsByVariant: indexRowsByVariant(evaluatedRows),
    violations: freezeArray(violations)
  });
}

function ledgerRow({
  variantId,
  variantFamily,
  entrypoint,
  sourceFile,
  physicalEntrypoint,
  runtimeMode,
  sourceCurrentness,
  acceptedDiagnosticIds,
  acceptedDiagnosticStatuses,
  acceptedDiagnosticRoles,
  evidence
}) {
  return freezeRecord({
    variantId,
    sourceBoundary: freezeRecord({
      packageName: "scheduler",
      compatibilityTarget: "scheduler@0.27.0",
      variantFamily,
      entrypoint,
      sourceFile,
      physicalEntrypoint,
      runtimeMode
    }),
    sourceCurrentness: freezeSourceCurrentness(sourceCurrentness),
    privateAdmission:
      acceptedDiagnosticIds.length === 0
        ? "scheduler-variant-boundary-no-private-diagnostic-admission"
        : "accepted-private-scheduler-variant-diagnostic-boundary",
    acceptedDiagnosticIds,
    acceptedDiagnosticStatuses,
    acceptedDiagnosticRoles,
    evidence,
    ledgerEvaluationMode: "source-token-checks-and-manifest-only",
    requirements: freezeRecord({
      privateEvidenceOnly: true,
      sourceOwnedPackageEntrypoint: true,
      sourceOwnedDiagnosticIdentifiers: true,
      sourceOwnedDiagnosticRoles: true,
      variantBoundaryPinned: true,
      crossVariantEvidenceRejected: true,
      staticReadOnlyLedger: true,
      sourceTokenChecksOnly: true,
      manifestEvaluationOnly: true,
      packageSurfaceUnchanged: true,
      runtimeExecutionClaimed: false,
      publicSchedulerTimingCompatibilityClaimed: false,
      publicRootSchedulerCompatibilityClaimed: false,
      publicReactActCompatibilityClaimed: false,
      publicPackageCompatibilityClaimed: false,
      publicNativeCompatibilityClaimed: false,
      publicPostTaskCompatibilityClaimed: false,
      publicMockSchedulerCompatibilityClaimed: false,
      rootExecutionClaimed: false,
      nativePublicBehaviorClaimed: false,
      postTaskPublicBehaviorClaimed: false,
      mockPublicBehaviorClaimed: false,
      newPublicExportsAdded: false,
      packageSurfaceChanged: false
    }),
    publicBlockerClaims: falseRecord(PRIVATE_ADMISSION_886_PUBLIC_BLOCKER_FIELDS)
  });
}

function sourceCurrentnessData({
  sourceFile,
  physicalEntrypoint,
  canonicalEntrypoint,
  variantFamily,
  runtimeMode,
  sourceKind,
  sourceSha256,
  declaredLicenseFile = null,
  wrapperTargets = [],
  diagnosticEntrypoints = [],
  diagnosticCompatibilityTargets = [],
  privateDiagnosticSourceIds = [],
  privateDiagnosticSourceStatuses = []
}) {
  return freezeSourceCurrentness({
    packageName: schedulerPackageName,
    packageVersion: schedulerPackageVersion,
    sourceFile,
    physicalEntrypoint,
    canonicalEntrypoint,
    variantFamily,
    runtimeMode,
    sourceKind,
    sourceSha256,
    declaredLicenseFile,
    wrapperTargets,
    diagnosticEntrypoints,
    diagnosticCompatibilityTargets,
    privateDiagnosticSourceIds,
    privateDiagnosticSourceStatuses,
    readError: null
  });
}

function schedulerPackageVersionTarget() {
  return `${schedulerPackageName}@${schedulerPackageVersion}`;
}

function cjsMockEvidence(role, path) {
  return evidenceData({
    role,
    path,
    tokens: [
      "__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__",
      "private-scheduler-act-queue-flush-diagnostics",
      "schedulerCompatibilityTarget",
      "scheduler@0.27.0",
      "scheduler/unstable_mock"
    ],
    forbiddenTokens: mockCjsForbiddenRootOnlyTokens
  });
}

function postTaskEvidence(role, path) {
  return evidenceData({
    role,
    path,
    tokens: [
      "__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__",
      "fast-react.scheduler.unstable_post_task.priority-diagnostics",
      "fast-react.scheduler.post_task.private-act-root-work-handoff",
      "private-scheduler-post-task-priority-diagnostics",
      "scheduler-post-task-private-priority-timeout-diagnostics",
      "accepted-private-scheduler-post-task-act-root-work-handoff",
      "pending-private-root-continuation-execution-route",
      "schedulerCompatibilityTarget",
      "scheduler@0.27.0",
      "scheduler/unstable_post_task",
      "actRootWorkHandoffDiagnostics",
      "rootContinuationExecutionRouteDiagnostics"
    ],
    forbiddenTokens: postTaskForbiddenMockTokens
  });
}

function evidenceData({ role, path, tokens, forbiddenTokens = [] }) {
  return freezeRecord({
    role,
    path,
    tokens: freezeArray(tokens),
    forbiddenTokens: freezeArray(forbiddenTokens)
  });
}

function freezeLedgerRow(row) {
  return freezeRecord({
    ...row,
    sourceBoundary: freezeRecord(row.sourceBoundary),
    sourceCurrentness: freezeSourceCurrentness(row.sourceCurrentness),
    acceptedDiagnosticIds: freezeArray(row.acceptedDiagnosticIds),
    acceptedDiagnosticStatuses: freezeArray(row.acceptedDiagnosticStatuses),
    acceptedDiagnosticRoles: freezeArray(row.acceptedDiagnosticRoles),
    evidence: freezeArray(row.evidence.map((evidenceRow) => evidenceData(evidenceRow))),
    requirements: freezeRecord(row.requirements),
    publicBlockerClaims: freezeRecord(row.publicBlockerClaims)
  });
}

function mergeRowOverride(row, override) {
  const sourceCurrentness = Object.hasOwn(override, "sourceCurrentness")
    ? override.sourceCurrentness
    : row.sourceCurrentness;
  return freezeLedgerRow({
    ...row,
    ...override,
    sourceBoundary: freezeRecord({
      ...row.sourceBoundary,
      ...(override.sourceBoundary ?? {})
    }),
    sourceCurrentness: freezeSourceCurrentness(sourceCurrentness),
    acceptedDiagnosticIds: freezeArray(
      override.acceptedDiagnosticIds ?? row.acceptedDiagnosticIds
    ),
    acceptedDiagnosticStatuses: freezeArray(
      override.acceptedDiagnosticStatuses ?? row.acceptedDiagnosticStatuses
    ),
    acceptedDiagnosticRoles: freezeArray(
      override.acceptedDiagnosticRoles ?? row.acceptedDiagnosticRoles
    ),
    evidence: freezeArray(
      (override.evidence ?? row.evidence).map((evidenceRow) =>
        evidenceData(evidenceRow)
      )
    ),
    requirements: freezeRecord({
      ...row.requirements,
      ...(override.requirements ?? {})
    }),
    publicBlockerClaims: freezeRecord({
      ...row.publicBlockerClaims,
      ...(override.publicBlockerClaims ?? {})
    })
  });
}

function evaluateLedgerRow({ fileCache, row, workspaceRoot }) {
  const evidence = row.evidence.map((evidenceRow) =>
    evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot })
  );
  const actualSourceCurrentness = inspectSourceCurrentness({
    fileCache,
    row,
    workspaceRoot
  });
  return freezeRecord({
    ...row,
    actualSourceCurrentness,
    evidence: freezeArray(evidence),
    evidenceRecognized: evidence.every((evidenceRow) => evidenceRow.recognized)
  });
}

function evaluateEvidenceRow({ evidenceRow, fileCache, workspaceRoot }) {
  const approvedContext =
    PRIVATE_ADMISSION_886_APPROVED_EVIDENCE_CONTEXTS_BY_ROLE[
      evidenceRow.role
    ] ?? null;
  const expectedPath = approvedContext?.path ?? null;
  const approvedTokens = approvedContext?.tokens ?? freezeArray([]);
  const approvedContextPathMismatch =
    expectedPath !== null && expectedPath !== evidenceRow.path;
  let text = "";
  let readError = null;

  try {
    text = readCachedFile(fileCache, workspaceRoot, evidenceRow.path);
  } catch (error) {
    readError = error instanceof Error ? error.message : String(error);
  }

  const missingTokens =
    readError === null
      ? evidenceRow.tokens.filter((token) => !text.includes(token))
      : freezeArray(evidenceRow.tokens);
  const forbiddenTokensPresent =
    readError === null
      ? evidenceRow.forbiddenTokens.filter((token) => text.includes(token))
      : freezeArray([]);
  const nonDurableTokens = evidenceRow.tokens.flatMap((token) => {
    const shapeId = classifyNonDurableEvidenceToken(token, approvedTokens);
    if (shapeId === null) {
      return [];
    }
    return [
      freezeRecord({
        token,
        shapeId
      })
    ];
  });

  return freezeRecord({
    ...evidenceRow,
    expectedPath,
    approvedContextPathMismatch,
    missingTokens: freezeArray(missingTokens),
    forbiddenTokensPresent: freezeArray(forbiddenTokensPresent),
    nonDurableTokens: freezeArray(nonDurableTokens),
    readError,
    recognized:
      readError === null &&
      approvedContext !== null &&
      approvedContextPathMismatch === false &&
      missingTokens.length === 0 &&
      forbiddenTokensPresent.length === 0 &&
      nonDurableTokens.length === 0
  });
}

function inspectSourceCurrentness({ fileCache, row, workspaceRoot }) {
  let packageName = null;
  let packageVersion = null;
  let text = "";
  const readErrors = [];
  const sourceFile = row.sourceBoundary?.sourceFile ?? null;
  const physicalEntrypoint = physicalEntrypointFromSourceFile(sourceFile);

  try {
    const packageJson = JSON.parse(
      readCachedFile(fileCache, workspaceRoot, schedulerPackageJsonPath)
    );
    packageName = packageJson.name ?? null;
    packageVersion = packageJson.version ?? null;
  } catch (error) {
    readErrors.push(`package.json: ${errorMessage(error)}`);
  }

  try {
    text = readCachedFile(fileCache, workspaceRoot, sourceFile);
  } catch (error) {
    readErrors.push(`${sourceFile}: ${errorMessage(error)}`);
  }

  const wrapperTargets = readErrors.length === 0 ? extractWrapperTargets(text) : [];
  const runtimeMode = deriveRuntimeMode(physicalEntrypoint, wrapperTargets);
  const sourceKind =
    readErrors.length === 0
      ? deriveSourceKind({
          physicalEntrypoint,
          runtimeMode,
          text,
          wrapperTargets
        })
      : null;

  return freezeSourceCurrentness({
    packageName,
    packageVersion,
    sourceFile,
    physicalEntrypoint,
    canonicalEntrypoint: canonicalEntrypointFromPhysical(physicalEntrypoint),
    variantFamily: variantFamilyFromPhysical(physicalEntrypoint),
    runtimeMode,
    sourceKind,
    sourceSha256:
      readErrors.length === 0
        ? createHash("sha256").update(text, "utf8").digest("hex")
        : null,
    declaredLicenseFile:
      readErrors.length === 0 ? extractDeclaredLicenseFile(text) : null,
    wrapperTargets,
    diagnosticEntrypoints:
      readErrors.length === 0 ? extractDiagnosticEntrypoints(text) : [],
    diagnosticCompatibilityTargets:
      readErrors.length === 0
        ? extractSchedulerCompatibilityTargets(text)
        : [],
    privateDiagnosticSourceIds:
      readErrors.length === 0 ? extractPrivateDiagnosticSourceIds(text) : [],
    privateDiagnosticSourceStatuses:
      readErrors.length === 0
        ? extractPrivateDiagnosticSourceStatuses(text)
        : [],
    readError: readErrors.length === 0 ? null : readErrors.join("; ")
  });
}

function physicalEntrypointFromSourceFile(sourceFile) {
  const prefix = "packages/scheduler/";
  return typeof sourceFile === "string" && sourceFile.startsWith(prefix)
    ? sourceFile.slice(prefix.length)
    : null;
}

function canonicalEntrypointFromPhysical(physicalEntrypoint) {
  if (physicalEntrypoint === null) {
    return null;
  }
  if (physicalEntrypoint === "index.js") {
    return "scheduler";
  }
  if (physicalEntrypoint === "unstable_mock.js") {
    return "scheduler/unstable_mock";
  }
  if (physicalEntrypoint === "unstable_post_task.js") {
    return "scheduler/unstable_post_task";
  }
  return `scheduler/${physicalEntrypoint}`;
}

function variantFamilyFromPhysical(physicalEntrypoint) {
  if (physicalEntrypoint === null) {
    return null;
  }
  if (physicalEntrypoint.includes("unstable_mock")) {
    return "unstable_mock";
  }
  if (physicalEntrypoint.includes("unstable_post_task")) {
    return "unstable_post_task";
  }
  if (physicalEntrypoint.includes("native")) {
    return "native";
  }
  return "index";
}

function deriveRuntimeMode(physicalEntrypoint, wrapperTargets) {
  if (physicalEntrypoint === null) {
    return null;
  }
  if (physicalEntrypoint === "unstable_mock.js") {
    return "package-root-source";
  }
  if (!physicalEntrypoint.startsWith("cjs/") && wrapperTargets.length > 0) {
    return "node-env-wrapper";
  }
  if (physicalEntrypoint.endsWith(".development.js")) {
    return "development";
  }
  if (physicalEntrypoint.endsWith(".production.js")) {
    return "production";
  }
  return null;
}

function deriveSourceKind({
  physicalEntrypoint,
  runtimeMode,
  text,
  wrapperTargets
}) {
  if (physicalEntrypoint === "unstable_mock.js") {
    return "package-root-private-mock-wrapper";
  }
  if (
    physicalEntrypoint !== null &&
    !physicalEntrypoint.startsWith("cjs/") &&
    wrapperTargets.length > 0
  ) {
    return "node-env-wrapper";
  }
  if (runtimeMode === "development" && hasDevelopmentModeGuard(text)) {
    return "cjs-development-guarded";
  }
  if (runtimeMode === "development") {
    return "cjs-development";
  }
  if (runtimeMode === "production") {
    return "cjs-production";
  }
  return null;
}

function hasDevelopmentModeGuard(text) {
  return (
    /"production"\s*!==\s*process\.env\.NODE_ENV/u.test(text) ||
    /process\.env\.NODE_ENV\s*!==\s*['"]production['"]/u.test(text)
  );
}

function extractWrapperTargets(text) {
  return uniqueInOrder(
    [...text.matchAll(/require\(['"]\.\/(cjs\/[^'"]+)['"]\)/gu)].map(
      (match) => match[1]
    )
  );
}

function extractDeclaredLicenseFile(text) {
  return text.match(/^\s*\*\s+(scheduler[^\n]*\.js)\s*$/mu)?.[1] ?? null;
}

function extractDiagnosticEntrypoints(text) {
  return uniqueSorted(
    [...text.matchAll(/(?:\bentrypoint:\s*['"]([^'"]+)['"]|\.entrypoint\s*=\s*['"]([^'"]+)['"])/gu)]
      .map((match) => match[1] ?? match[2])
      .filter((value) => value.startsWith("scheduler/"))
  );
}

function extractSchedulerCompatibilityTargets(text) {
  return uniqueSorted(
    extractStringLiterals(text).filter((value) =>
      /^scheduler@\d+\.\d+\.\d+$/u.test(value)
    )
  );
}

function extractPrivateDiagnosticSourceIds(text) {
  return uniqueSorted(
    extractStringLiterals(text).filter(
      (value) =>
        value.startsWith("__FAST_REACT_PRIVATE") ||
        /^fast-react\.scheduler\.(?:mock|unstable_post_task|post_task)/u.test(
          value
        )
    )
  );
}

function extractPrivateDiagnosticSourceStatuses(text) {
  return uniqueSorted(
    extractStringLiterals(text).filter((value) =>
      /(?:^private-|^described-|^drained-|^accepted-private|^produced-private|^pending-private|^scheduler-post-task-private)/u.test(
        value
      )
    )
  );
}

function extractStringLiterals(text) {
  return [...text.matchAll(/['"]([^'"\n]+)['"]/gu)].map((match) => match[1]);
}

function uniqueInOrder(values) {
  const seen = new Set();
  return freezeArray(
    values.filter((value) => {
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    })
  );
}

function uniqueSorted(values) {
  return freezeArray([...new Set(values)].sort());
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function classifyNonDurableEvidenceToken(token, approvedTokens) {
  if (approvedTokens.includes(token)) {
    for (const tokenClass of PRIVATE_ADMISSION_886_DURABLE_EVIDENCE_TOKEN_CLASSES) {
      if (tokenClass.pattern.test(token)) {
        return null;
      }
    }
  }

  for (const shape of PRIVATE_ADMISSION_886_NON_DURABLE_EVIDENCE_TOKEN_SHAPES) {
    if (
      shape.id !== "unapproved-evidence-token-context" &&
      shape.pattern.test(token)
    ) {
      return shape.id;
    }
  }

  if (!approvedTokens.includes(token)) {
    return "unapproved-evidence-token-context";
  }

  return "unapproved-evidence-token-context";
}

function readCachedFile(fileCache, workspaceRoot, relativePath) {
  const absolutePath = join(workspaceRoot, relativePath);
  if (!fileCache.has(absolutePath)) {
    fileCache.set(absolutePath, readFileSync(absolutePath, "utf8"));
  }
  return fileCache.get(absolutePath);
}

function compareRequiredArrayByVariant({
  rows,
  requiredByVariant,
  actualKey,
  expectedKey,
  actualKeyForViolation
}) {
  return rows.flatMap((row) => {
    const expected = requiredByVariant[row.variantId] ?? freezeArray([]);
    const actual = row[actualKey] ?? freezeArray([]);
    if (sameStringArray(actual, expected)) {
      return [];
    }
    return [
      freezeRecord({
        variantId: row.variantId,
        [expectedKey]: expected,
        [actualKeyForViolation]: freezeArray(actual),
        missingValues: freezeArray(
          expected.filter((value) => !actual.includes(value))
        ),
        unexpectedValues: freezeArray(
          actual.filter((value) => !expected.includes(value))
        )
      })
    ];
  });
}

function findCrossVariantDiagnosticRows(rows) {
  const diagnosticOwners = new Map();
  for (const [variantId, diagnosticIds] of Object.entries(
    PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_IDS
  )) {
    for (const diagnosticId of diagnosticIds) {
      if (!diagnosticOwners.has(diagnosticId)) {
        diagnosticOwners.set(diagnosticId, []);
      }
      diagnosticOwners.get(diagnosticId).push(variantId);
    }
  }

  return rows.flatMap((row) => {
    const expected = PRIVATE_ADMISSION_886_REQUIRED_DIAGNOSTIC_IDS[row.variantId];
    const crossVariantDiagnostics = row.acceptedDiagnosticIds.flatMap(
      (diagnosticId) => {
        if (expected?.includes(diagnosticId)) {
          return [];
        }
        const ownerVariants = diagnosticOwners.get(diagnosticId) ?? [];
        if (ownerVariants.length === 0) {
          return [];
        }
        return [
          freezeRecord({
            diagnosticId,
            ownerVariants: freezeArray(ownerVariants)
          })
        ];
      }
    );

    if (crossVariantDiagnostics.length === 0) {
      return [];
    }

    return [
      freezeRecord({
        variantId: row.variantId,
        sourceBoundary: row.sourceBoundary,
        crossVariantDiagnostics: freezeArray(crossVariantDiagnostics)
      })
    ];
  });
}

function sameStringArray(actual, expected) {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

function sameStringSet(expected, actual) {
  return (
    expected.length === actual.length &&
    expected.every((value) => actual.includes(value))
  );
}

function sameStringRecord(actual, expected, keys) {
  return keys.every((key) => actual?.[key] === expected?.[key]);
}

function sameSourceCurrentness(actual, expected) {
  return (
    sameStringRecord(actual, expected, [
      "packageName",
      "packageVersion",
      "sourceFile",
      "physicalEntrypoint",
      "canonicalEntrypoint",
      "variantFamily",
      "runtimeMode",
      "sourceKind",
      "sourceSha256",
      "declaredLicenseFile",
      "readError"
    ]) &&
    sameStringArray(actual?.wrapperTargets ?? [], expected.wrapperTargets) &&
    sameStringArray(
      actual?.diagnosticEntrypoints ?? [],
      expected.diagnosticEntrypoints
    ) &&
    sameStringArray(
      actual?.diagnosticCompatibilityTargets ?? [],
      expected.diagnosticCompatibilityTargets
    ) &&
    sameStringArray(
      actual?.privateDiagnosticSourceIds ?? [],
      expected.privateDiagnosticSourceIds
    ) &&
    sameStringArray(
      actual?.privateDiagnosticSourceStatuses ?? [],
      expected.privateDiagnosticSourceStatuses
    )
  );
}

function indexRowsByVariant(rows) {
  return freezeRecord(
    Object.fromEntries(rows.map((row) => [row.variantId, row]))
  );
}

function createViolation(id, fields = {}) {
  return freezeRecord({
    id,
    ...fields
  });
}

function pushRowsViolation(violations, id, rows) {
  if (rows.length > 0) {
    violations.push(createViolation(id, { rows: freezeArray(rows) }));
  }
}

function pushIdsViolation(violations, id, ids) {
  if (ids.length > 0) {
    violations.push(createViolation(id, { ids: freezeArray(ids) }));
  }
}

function falseRecord(keys) {
  return freezeRecord(Object.fromEntries(keys.map((key) => [key, false])));
}

function freezeSourceCurrentness(sourceCurrentness = {}) {
  const value = sourceCurrentness ?? {};
  return freezeRecord({
    packageName: value.packageName ?? null,
    packageVersion: value.packageVersion ?? null,
    sourceFile: value.sourceFile ?? null,
    physicalEntrypoint: value.physicalEntrypoint ?? null,
    canonicalEntrypoint: value.canonicalEntrypoint ?? null,
    variantFamily: value.variantFamily ?? null,
    runtimeMode: value.runtimeMode ?? null,
    sourceKind: value.sourceKind ?? null,
    sourceSha256: value.sourceSha256 ?? null,
    declaredLicenseFile: value.declaredLicenseFile ?? null,
    wrapperTargets: freezeArray(value.wrapperTargets ?? []),
    diagnosticEntrypoints: freezeArray(value.diagnosticEntrypoints ?? []),
    diagnosticCompatibilityTargets: freezeArray(
      value.diagnosticCompatibilityTargets ?? []
    ),
    privateDiagnosticSourceIds: freezeArray(
      value.privateDiagnosticSourceIds ?? []
    ),
    privateDiagnosticSourceStatuses: freezeArray(
      value.privateDiagnosticSourceStatuses ?? []
    ),
    readError: value.readError ?? null
  });
}

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeRecord(record) {
  return Object.freeze({ ...record });
}
