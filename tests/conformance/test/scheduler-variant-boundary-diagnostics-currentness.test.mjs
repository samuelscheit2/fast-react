import assert from "node:assert/strict";
import test from "node:test";

import {
  SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_STATUS,
  SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS,
  createSchedulerVariantBoundaryDiagnosticsReport,
  evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate
} from "../src/scheduler-variant-boundary-diagnostics-currentness.mjs";
import { evaluateSchedulerVariantCurrentnessGate } from "../src/scheduler-variant-oracle.mjs";

let cachedBaselineReport = null;
let cachedBaselineGate = null;

test("scheduler mock and postTask boundary diagnostics bind live variant currentness", () => {
  const gate = baselineGate();

  assert.equal(gate.status, SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_GATE_STATUS);
  assert.equal(gate.sourceCurrentnessRecognized, true);
  assert.equal(gate.sourceGateContextRecognized, true);
  assert.equal(gate.entrypointVariantBoundariesRecognized, true);
  assert.equal(gate.diagnosticIdentitiesRecognized, true);
  assert.equal(gate.queueIdentitiesRecognized, true);
  assert.equal(gate.unsupportedStatusRecognized, true);
  assert.equal(gate.rootNativeVariantReuseRejected, true);
  assert.equal(gate.publicCompatibilityClaimsBlocked, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(
    gate.rows.map((row) => row.rowId),
    [
      "scheduler-mock-root-development-boundary-diagnostics",
      "scheduler-mock-root-production-boundary-diagnostics",
      "scheduler-mock-cjs-development-boundary-diagnostics",
      "scheduler-mock-cjs-production-boundary-diagnostics",
      "scheduler-post-task-development-boundary-diagnostics",
      "scheduler-post-task-production-boundary-diagnostics"
    ]
  );

  const mockDevelopment =
    gate.rowsById["scheduler-mock-root-development-boundary-diagnostics"];
  assert.equal(mockDevelopment.classification, "mock");
  assert.equal(mockDevelopment.entrypoint, "scheduler/unstable_mock");
  assert.equal(mockDevelopment.physicalEntryFile, "packages/scheduler/unstable_mock.js");
  assert.equal(
    mockDevelopment.selectedCjsPhysicalEntryFile,
    "packages/scheduler/cjs/scheduler-unstable_mock.development.js"
  );
  assert.equal(
    mockDevelopment.wrapperTarget,
    "cjs/scheduler-unstable_mock.development.js"
  );
  assert.equal(
    mockDevelopment.queueIdentity.queueKind,
    "fast-react.react.private-act-queue-test-queue"
  );
  assert.equal(mockDevelopment.queueIdentity.drainsPublicSchedulerTaskQueue, false);
  assert.equal(mockDevelopment.queueIdentity.executesQueuedWork, false);
  assert.equal(
    mockDevelopment.queueIdentity.publicSchedulerTaskQueueDrainBlocked,
    true
  );
  assert.equal(mockDevelopment.queueIdentity.queuedWorkExecutionBlocked, true);
  assert.equal(mockDevelopment.diagnosticObjectMatchesLive, true);
  assert.equal(Object.isFrozen(mockDevelopment.diagnosticObject), true);
  assert.equal(
    mockDevelopment.unsupportedStatus.publicSchedulerTimingCompatibilityClaimed,
    false
  );
  assert.equal(
    mockDevelopment.unsupportedStatus.mockSchedulerPrivateDiagnosticsOnly,
    true
  );

  const postTaskProduction =
    gate.rowsById["scheduler-post-task-production-boundary-diagnostics"];
  assert.equal(postTaskProduction.classification, "post_task");
  assert.equal(postTaskProduction.entrypoint, "scheduler/unstable_post_task");
  assert.equal(
    postTaskProduction.selectedCjsPhysicalEntryFile,
    "packages/scheduler/cjs/scheduler-unstable_post_task.production.js"
  );
  assert.equal(
    postTaskProduction.wrapperTarget,
    "cjs/scheduler-unstable_post_task.production.js"
  );
  assert.equal(
    postTaskProduction.diagnosticStatus,
    "private-scheduler-post-task-priority-diagnostics"
  );
  assert.equal(
    postTaskProduction.queueIdentity.queueKind,
    "controlled-task-scheduling-api-shim"
  );
  assert.equal(postTaskProduction.queueIdentity.hasSchedulerPostTask, true);
  assert.equal(postTaskProduction.queueIdentity.hasSchedulerYield, false);
  assert.equal(
    postTaskProduction.queueIdentity.actRootWorkHandoffStatus,
    "accepted-private-scheduler-post-task-act-root-work-handoff"
  );
  assert.equal(
    postTaskProduction.unsupportedStatus.browserPostTaskCompatibilityClaimed,
    false
  );
  assert.equal(
    postTaskProduction.unsupportedStatus.postTaskPrivateDiagnosticsOnly,
    true
  );
});

test("scheduler variant boundary diagnostics reject stale source currentness records", () => {
  const report = mutateReport(
    "scheduler-post-task-development-boundary-diagnostics",
    (row) => ({
      ...row,
      selectedSourceCurrentness: {
        ...row.selectedSourceCurrentness,
        sourceSha256: "stale-post-task-source"
      }
    })
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-variant-boundary-diagnostics-source-currentness-mismatch"
    ),
    ["scheduler-post-task-development-boundary-diagnostics"]
  );
});

test("scheduler variant boundary diagnostics reject stale source gate context", () => {
  const report = mutateRows([], {
    sourceGateId: "stale-source-gate",
    sourceGateStatus: "stale-status",
    sourceGateAcceptedAsCurrentPrivateContext: true
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assert.equal(gate.sourceGateContextRecognized, false);
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-source-gate-mismatch"
  );
});

test("scheduler variant boundary diagnostics reject caller-forged source currentness gates", () => {
  const forgedVariantCurrentnessGate = createForgedVariantCurrentnessGate();
  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: forgedVariantCurrentnessGate
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report,
    variantCurrentnessGate: forgedVariantCurrentnessGate
  });

  assert.equal(report.sourceGateId, "stale-source-gate");
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.rowsById, {});
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assert.equal(gate.sourceCurrentnessRecognized, false);
  assert.equal(gate.sourceGateContextRecognized, false);
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-source-gate-mismatch"
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-manifest-mismatch"
  );
});

test("scheduler variant boundary diagnostics reject caller source gate public claims", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const claimedGate = Object.freeze({
    ...currentGate,
    publicCompatibilityClaimed: true,
    publicPostTaskCompatibilityClaimed: true
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    variantCurrentnessGate: claimedGate
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "variantCurrentnessGate.publicCompatibilityClaimed",
      "variantCurrentnessGate.publicPostTaskCompatibilityClaimed"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject prebuilt reports from claimed source gates", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const claimedGate = Object.freeze({
    ...currentGate,
    publicCompatibilityClaimed: true,
    publicPostTaskCompatibilityClaimed: true
  });
  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: claimedGate
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assertSubset(
    [
      "variantCurrentnessGate.publicCompatibilityClaimed",
      "variantCurrentnessGate.publicPostTaskCompatibilityClaimed"
    ],
    report.sourceGateReportRejectionIds
  );
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.rowsById, {});
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "variantCurrentnessGate.publicCompatibilityClaimed",
      "variantCurrentnessGate.publicPostTaskCompatibilityClaimed"
    ],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject prebuilt reports from hidden inferred source gate claims", () => {
  const hiddenClaimedGate = withHiddenPublicClaimGetRecordProxy(
    evaluateSchedulerVariantCurrentnessGate(),
    {
      publicNewCompatibilityClaimed: true,
      publicNativeCompatibility: true,
      publicNativeExecution: true,
      publicNativeExecutionClaimed: true
    }
  );
  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: hiddenClaimedGate
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assertSubset(
    [
      "variantCurrentnessGate.publicNewCompatibilityClaimed",
      "variantCurrentnessGate.publicNativeCompatibility",
      "variantCurrentnessGate.publicNativeExecution",
      "variantCurrentnessGate.publicNativeExecutionClaimed"
    ],
    report.sourceGateReportRejectionIds
  );
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.rowsById, {});
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "variantCurrentnessGate.publicNewCompatibilityClaimed",
      "variantCurrentnessGate.publicNativeCompatibility",
      "variantCurrentnessGate.publicNativeExecution",
      "variantCurrentnessGate.publicNativeExecutionClaimed"
    ],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject prebuilt reports from hidden inferred source gate namespaces", () => {
  const hiddenClaimedGate = withHiddenPublicClaimGetRecordProxy(
    evaluateSchedulerVariantCurrentnessGate(),
    {
      publicQuantumSchedulerCompatibilityStatus: true,
      publicBrowserTaskOrderingCompatibilityClaimed: true
    }
  );
  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: hiddenClaimedGate
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assertSubset(
    ["variantCurrentnessGate.[[HiddenInferredPublicClaims]]"],
    report.sourceGateReportRejectionIds
  );
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.rowsById, {});
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["variantCurrentnessGate.[[HiddenInferredPublicClaims]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics factory rejects top-level source gate accessors", () => {
  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    get variantCurrentnessGate() {
      throw new TypeError("top-level source gate trap");
    }
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.equal(
    report.sourceGateReportStatus,
    "rejected-malformed-scheduler-variant-currentness-gate"
  );
  assert.deepEqual(report.rows, []);
  assertSubset(
    ["options.variantCurrentnessGate.[[Accessor]]"],
    report.sourceGateReportRejectionIds
  );
});

test("scheduler variant boundary diagnostics factory rejects inherited source gate options", () => {
  const report = createSchedulerVariantBoundaryDiagnosticsReport(
    withInheritedOptionAccessor("variantCurrentnessGate")
  );

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.deepEqual(report.rows, []);
  assertSubset(
    ["options.variantCurrentnessGate.[[Inherited]]"],
    report.sourceGateReportRejectionIds
  );
});

test("scheduler variant boundary diagnostics factory rejects null options", () => {
  const report = createSchedulerVariantBoundaryDiagnosticsReport(null);

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.deepEqual(report.rows, []);
  assertSubset(
    ["options.[[Object]]"],
    report.sourceGateReportRejectionIds
  );
});

test("scheduler variant boundary diagnostics factory rejects top-level options public claims", () => {
  const report = createSchedulerVariantBoundaryDiagnosticsReport(
    Object.freeze({
      publicPackageCompatibilityClaimed: true,
      publicNativeCompatibility: true,
      publicSchedulerTimingCompatibilityClaimed: true
    })
  );

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.equal(
    report.sourceGateReportStatus,
    "rejected-malformed-scheduler-variant-currentness-gate"
  );
  assertSubset(
    [
      "options.publicPackageCompatibilityClaimed",
      "options.publicNativeCompatibility",
      "options.publicSchedulerTimingCompatibilityClaimed"
    ],
    report.sourceGateReportRejectionIds
  );
});

test("scheduler variant boundary diagnostics factory rejects hidden top-level options public claims", () => {
  const report = createSchedulerVariantBoundaryDiagnosticsReport(
    withHiddenPublicClaimGetRecordProxy(Object.freeze({}), {
      publicPackageCompatibilityClaimed: true,
      publicNativeCompatibility: true
    })
  );

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.equal(
    report.sourceGateReportStatus,
    "rejected-malformed-scheduler-variant-currentness-gate"
  );
  assertSubset(
    [
      "options.publicPackageCompatibilityClaimed",
      "options.publicNativeCompatibility"
    ],
    report.sourceGateReportRejectionIds
  );
});

test("scheduler variant boundary diagnostics reject prebuilt reports from mutable source gates", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const mutableGate = {
    ...currentGate,
    rowsByVariant: {
      ...currentGate.rowsByVariant
    }
  };
  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: mutableGate
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assertSubset(
    ["variantCurrentnessGate.[[Frozen]]"],
    report.sourceGateReportRejectionIds
  );
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.rowsById, {});
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["variantCurrentnessGate.[[Frozen]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics factory fails closed for empty source rows", () => {
  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: {
      rowsByVariant: {}
    }
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.equal(
    report.sourceGateReportStatus,
    "rejected-malformed-scheduler-variant-currentness-gate"
  );
  assert.deepEqual(report.rows, []);
  assert.deepEqual(report.rowsById, {});
  assertSubset(
    [
      "variantCurrentnessGate.[[BoundaryDiagnosticsReport]]",
      "variantCurrentnessGate.rowsByVariant.scheduler-unstable-mock-root.[[Missing]]"
    ],
    report.sourceGateReportRejectionIds
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-manifest-mismatch"
  );
  assertSubset(
    ["variantCurrentnessGate.[[BoundaryDiagnosticsReport]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics factory rejects array-shaped source rows", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const rowsByVariant = Object.freeze(
    Object.assign([], currentGate.rowsByVariant)
  );
  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: Object.freeze({
      ...currentGate,
      rowsByVariant
    })
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.deepEqual(report.rows, []);
  assertSubset(
    ["variantCurrentnessGate.rowsByVariant.[[Record]]"],
    report.sourceGateReportRejectionIds
  );
});

test("scheduler variant boundary diagnostics factory rejects malformed source row descriptors", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const variantId = "scheduler-unstable-mock-root";
  const malformedRow = {
    ...currentGate.rowsByVariant[variantId]
  };
  Object.defineProperty(malformedRow, "physicalEntrypoint", {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error("source row physicalEntrypoint trap");
    }
  });

  const report = createSchedulerVariantBoundaryDiagnosticsReport({
    variantCurrentnessGate: {
      ...currentGate,
      rowsByVariant: {
        ...currentGate.rowsByVariant,
        [variantId]: malformedRow
      }
    }
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.deepEqual(report.rows, []);
  assertSubset(
    [
      "variantCurrentnessGate.[[BoundaryDiagnosticsReport]]",
      `variantCurrentnessGate.rowsByVariant.${variantId}.physicalEntrypoint.[[Accessor]]`
    ],
    report.sourceGateReportRejectionIds
  );
});

test("scheduler variant boundary diagnostics factory rejects inherited source row fields", () => {
  const report = withTemporaryObjectPrototypeProperties(
    {
      packagePath: "scheduler/forged",
      canonicalEntrypoint: "scheduler/forged",
      physicalEntrypoint: "forged.js",
      sourceFile: "packages/scheduler/forged.js",
      sourceSha256: "forged-source-sha"
    },
    () =>
      createSchedulerVariantBoundaryDiagnosticsReport({
        variantCurrentnessGate: Object.freeze({
          ...evaluateSchedulerVariantCurrentnessGate(),
          rowsByVariant: createRowsByVariantWithRequiredRows(() =>
            Object.freeze({})
          )
        })
      })
  );

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(report.sourceGateAcceptedAsCurrentPrivateContext, false);
  assert.deepEqual(report.rows, []);
  assertSubset(
    [
      "variantCurrentnessGate.rowsByVariant.scheduler-unstable-mock-root.packagePath.[[String]]",
      "variantCurrentnessGate.rowsByVariant.scheduler-unstable-mock-root.sourceSha256.[[String]]"
    ],
    report.sourceGateReportRejectionIds
  );
});

test("scheduler variant boundary diagnostics reject wrong entrypoint bindings", () => {
  const report = mutateReport(
    "scheduler-mock-root-production-boundary-diagnostics",
    (row) => ({
      ...row,
      entrypoint: "scheduler",
      canonicalEntrypoint: "scheduler",
      physicalEntrypoint: "index.js",
      physicalEntryFile: "packages/scheduler/index.js"
    })
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-variant-boundary-diagnostics-entrypoint-variant-mismatch"
    ),
    ["scheduler-mock-root-production-boundary-diagnostics"]
  );
});

test("scheduler variant boundary diagnostics reject non-coercible entrypoint values", () => {
  const rowId = "scheduler-mock-root-production-boundary-diagnostics";
  const report = mutateReport(rowId, (row) => ({
    ...row,
    entrypoint: Object.freeze(Object.create(null))
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-entrypoint-variant-mismatch"
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-variant-boundary-diagnostics-root-native-variant-reuse"
    ),
    [rowId]
  );
});

test("scheduler variant boundary diagnostics reject postTask and mock reuse across root/native variants", () => {
  const report = mutateRows([
    [
      "scheduler-mock-root-development-boundary-diagnostics",
      (row) => ({
        ...row,
        variantId: "scheduler-index-wrapper",
        classification: "root",
        rootNativeMockPostTaskClassification: "root",
        entrypoint: "scheduler"
      })
    ],
    [
      "scheduler-post-task-production-boundary-diagnostics",
      (row) => ({
        ...row,
        selectedCjsVariantId: "scheduler-cjs-native-production",
        selectedCjsEntrypoint: "scheduler/cjs/scheduler.native.production.js",
        selectedCjsPhysicalEntrypoint: "cjs/scheduler.native.production.js",
        selectedCjsPhysicalEntryFile:
          "packages/scheduler/cjs/scheduler.native.production.js"
      })
    ]
  ]);

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-variant-boundary-diagnostics-root-native-variant-reuse"
    ),
    [
      "scheduler-mock-root-development-boundary-diagnostics",
      "scheduler-post-task-production-boundary-diagnostics"
    ]
  );
});

test("scheduler variant boundary diagnostics reject cloned diagnostic records", () => {
  const report = mutateReport(
    "scheduler-post-task-development-boundary-diagnostics",
    (row) => {
      const clone = Object.freeze({ ...row.diagnosticObject });
      return {
        ...row,
        diagnosticObject: clone,
        liveDiagnosticObject: clone,
        diagnosticObjectFrozen: true,
        diagnosticObjectMatchesLive: true
      };
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-variant-boundary-diagnostics-cloned-diagnostic-record"
    ),
    ["scheduler-post-task-development-boundary-diagnostics"]
  );
});

test("scheduler variant boundary diagnostics reject diagnostic object frozen traps", () => {
  const rowId = "scheduler-post-task-development-boundary-diagnostics";
  const diagnosticObject = withThrowingOwnKeysFrozenProxy(
    baselineReport().rowsById[rowId].diagnosticObject
  );
  const report = withRowReplacement(rowId, {
    ...baselineReport().rowsById[rowId],
    diagnosticObject,
    liveDiagnosticObject: diagnosticObject,
    diagnosticObjectFrozen: true,
    diagnosticObjectMatchesLive: true
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-cloned-diagnostic-record"
  );
  assertSubset(
    [`${rowId}.diagnosticObject.[[Frozen]]`],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject fake queue state", () => {
  const report = mutateReport(
    "scheduler-mock-cjs-development-boundary-diagnostics",
    (row) => ({
      ...row,
      queueIdentity: {
        ...row.queueIdentity,
        queueKind: "fast-react.fake.scheduler-queue",
        publicSchedulerTaskQueueDrainBlocked: false
      }
    })
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-variant-boundary-diagnostics-fake-queue-state"
    ),
    ["scheduler-mock-cjs-development-boundary-diagnostics"]
  );
});

test("scheduler variant boundary diagnostics reject public Scheduler timing claims", () => {
  const report = mutateReport(
    "scheduler-post-task-production-boundary-diagnostics",
    (row) => ({
      ...row,
      unsupportedStatus: {
        ...row.unsupportedStatus,
        publicSchedulerTimingCompatibilityClaimed: true
      }
    }),
    {
      compatibilityClaimed: true,
      publicSchedulerTimingCompatibilityClaimed: true
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "report.publicSchedulerTimingCompatibilityClaimed",
      "scheduler-post-task-production-boundary-diagnostics.unsupportedStatus.publicSchedulerTimingCompatibilityClaimed"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-variant-boundary-diagnostics-unsupported-status-mismatch"
    ),
    ["scheduler-post-task-production-boundary-diagnostics"]
  );
});

test("scheduler variant boundary diagnostics reject generic public compatibility claims", () => {
  const report = mutateRows([], {
    compatibilityClaimed: false,
    publicCompatibilityClaimed: true
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.publicCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject Scheduler act root execution claim aliases", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = mutateFrozenReport(
    rowId,
    (row) => ({
      ...row,
      queueIdentity: Object.freeze({
        ...row.queueIdentity,
        drainsPublicReactActQueue: true,
        executesEffects: true,
        executesPassiveEffects: true,
        executesRendererWork: true,
        executesRendererRoots: true,
        publicActPassiveDrain: true,
        publicRootExecution: true,
        publicRootRenderCompatibilityClaimed: true,
        publicPassiveEffectCompatibilityClaimed: true
      })
    }),
    {
      compatibilityClaimed: false,
      publicSchedulerCompatibilityClaimed: true,
      publicActCompatibilityClaimed: true,
      publicNativeCompatibility: true,
      publicReactActReady: true,
      executesPublicSchedulerTasks: true,
      executesPublicEffects: true
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "report.publicSchedulerCompatibilityClaimed",
      "report.publicActCompatibilityClaimed",
      "report.publicNativeCompatibility",
      "report.publicReactActReady",
      "report.executesPublicSchedulerTasks",
      "report.executesPublicEffects",
      `${rowId}.queueIdentity.drainsPublicReactActQueue`,
      `${rowId}.queueIdentity.executesEffects`,
      `${rowId}.queueIdentity.executesPassiveEffects`,
      `${rowId}.queueIdentity.executesRendererWork`,
      `${rowId}.queueIdentity.executesRendererRoots`,
      `${rowId}.queueIdentity.publicActPassiveDrain`,
      `${rowId}.queueIdentity.publicRootExecution`,
      `${rowId}.queueIdentity.publicRootRenderCompatibilityClaimed`,
      `${rowId}.queueIdentity.publicPassiveEffectCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject native and package alias claims", () => {
  const packageSymbolClaim = Symbol("publicPackageCompatibilityClaimed");
  const report = mutateRows([], {
    compatibilityClaimed: false,
    nativeAliasAccepted: true,
    packageAliasAccepted: true,
    nativeRuntimeExecution: true,
    packageExecution: true,
    schedulerPackageCompatibilityClaimed: true,
    schedulerNativeCompatibilityClaimed: true,
    [packageSymbolClaim]: true
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "report.nativeAliasAccepted",
      "report.packageAliasAccepted",
      "report.nativeRuntimeExecution",
      "report.packageExecution",
      "report.schedulerPackageCompatibilityClaimed",
      "report.schedulerNativeCompatibilityClaimed",
      "report.[Symbol(publicPackageCompatibilityClaimed)]"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject hidden native public claim aliases", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = withHiddenPublicClaimGetRecordProxy(
    mutateFrozenReport(rowId, (row) => ({
      ...row,
      queueIdentity: withHiddenPublicClaimGetRecordProxy(row.queueIdentity, {
        publicNativeExecution: true,
        publicNativeCompatibility: true
      })
    })),
    {
      publicNativeExecution: true,
      publicNativeCompatibility: true
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "report.publicNativeExecution",
      "report.publicNativeCompatibility",
      `${rowId}.queueIdentity.publicNativeExecution`,
      `${rowId}.queueIdentity.publicNativeCompatibility`
    ],
    gate.publicCompatibilityClaimIds
  );
  assertSubset(
    [
      "report.publicNativeExecution.[[HiddenGet]]",
      "report.publicNativeCompatibility.[[HiddenGet]]",
      `${rowId}.queueIdentity.publicNativeExecution.[[HiddenGet]]`,
      `${rowId}.queueIdentity.publicNativeCompatibility.[[HiddenGet]]`
    ],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject ownKeys-hidden inferred row public claim aliases", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = mutateFrozenReport(rowId, (row) =>
    withHiddenPublicClaimGetRecordProxy(row, {
      publicSchedulerPostTaskCompatibilityClaimed: true,
      publicSchedulerMockCompatibilityClaimed: true,
      publicSchedulerRootCompatibilityClaimed: true,
      publicReactRootExecutionClaimed: true,
      publicPostTaskReady: true,
      publicMockSchedulerReady: true,
      publicBrowserPostTaskCompatibilityClaimed: true
    })
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      `${rowId}.publicSchedulerPostTaskCompatibilityClaimed`,
      `${rowId}.publicSchedulerMockCompatibilityClaimed`,
      `${rowId}.publicSchedulerRootCompatibilityClaimed`,
      `${rowId}.publicReactRootExecutionClaimed`,
      `${rowId}.publicPostTaskReady`,
      `${rowId}.publicMockSchedulerReady`,
      `${rowId}.publicBrowserPostTaskCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
  assertSubset(
    [
      `${rowId}.publicSchedulerPostTaskCompatibilityClaimed.[[HiddenGet]]`,
      `${rowId}.publicSchedulerMockCompatibilityClaimed.[[HiddenGet]]`,
      `${rowId}.publicSchedulerRootCompatibilityClaimed.[[HiddenGet]]`,
      `${rowId}.publicReactRootExecutionClaimed.[[HiddenGet]]`,
      `${rowId}.publicPostTaskReady.[[HiddenGet]]`,
      `${rowId}.publicMockSchedulerReady.[[HiddenGet]]`,
      `${rowId}.publicBrowserPostTaskCompatibilityClaimed.[[HiddenGet]]`
    ],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject hidden inferred row public claim namespaces", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = mutateFrozenReport(rowId, (row) =>
    withHiddenPublicClaimGetRecordProxy(row, {
      publicQuantumSchedulerCompatibilityStatus: true,
      publicBrowserTaskOrderingCompatibilityClaimed: true
    })
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.[[HiddenInferredPublicClaims]]`],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject top-level evaluator option accessors", () => {
  for (const [key, id] of [
    [
      "boundaryDiagnosticsReport",
      "options.boundaryDiagnosticsReport.[[Accessor]]"
    ],
    ["variantCurrentnessGate", "options.variantCurrentnessGate.[[Accessor]]"]
  ]) {
    const options = {};
    Object.defineProperty(options, key, {
      configurable: true,
      enumerable: true,
      get() {
        throw new TypeError(`top-level ${key} trap`);
      }
    });

    const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate(
      options
    );

    assert.equal(
      gate.status,
      SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
    );
    assertSubset(
      [id],
      violationIds(
        gate,
        "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
      )
    );
  }
});

test("scheduler variant boundary diagnostics reject inherited evaluator options", () => {
  for (const [key, id] of [
    [
      "boundaryDiagnosticsReport",
      "options.boundaryDiagnosticsReport.[[Inherited]]"
    ],
    ["variantCurrentnessGate", "options.variantCurrentnessGate.[[Inherited]]"]
  ]) {
    const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate(
      withInheritedOptionAccessor(key)
    );

    assert.equal(
      gate.status,
      SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
    );
    assertSubset(
      [id],
      violationIds(
        gate,
        "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
      )
    );
  }
});

test("scheduler variant boundary diagnostics reject null evaluator options", () => {
  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate(null);

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["options.[[Object]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject top-level evaluator options public claims", () => {
  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate(
    Object.freeze({
      publicPackageCompatibilityClaimed: true,
      publicNativeCompatibility: true,
      publicSchedulerTimingCompatibilityClaimed: true
    })
  );

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "options.publicPackageCompatibilityClaimed",
      "options.publicNativeCompatibility",
      "options.publicSchedulerTimingCompatibilityClaimed"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject hidden top-level evaluator options public claims", () => {
  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate(
    withHiddenPublicClaimGetRecordProxy(Object.freeze({}), {
      publicPackageCompatibilityClaimed: true,
      publicNativeCompatibility: true
    })
  );

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "options.publicPackageCompatibilityClaimed",
      "options.publicNativeCompatibility"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject live diagnostic object public claims", () => {
  const rowId = "scheduler-mock-root-development-boundary-diagnostics";
  const liveDiagnosticObject = Object.freeze({
    publicCompatibilityClaimed: true
  });
  const reportLiveDiagnosticObject = Object.freeze({
    publicCompatibilityClaimed: true
  });
  const rowReport = mutateFrozenReport(rowId, (row) => ({
    ...row,
    liveDiagnosticObject,
    diagnosticObjectMatchesLive: false
  }));
  const report = Object.freeze({
    ...rowReport,
    liveDiagnosticObject: reportLiveDiagnosticObject
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "report.liveDiagnosticObject.publicCompatibilityClaimed",
      `${rowId}.liveDiagnosticObject.publicCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject row function public claim carriers", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const functionClaimCarrier = createFunctionClaimCarrier(
    "publicCompatibilityClaimed",
    true
  );
  const report = mutateFrozenReport(rowId, (row) => ({
    ...row,
    hiddenFunctionClaimCarrier: functionClaimCarrier
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.hiddenFunctionClaimCarrier.publicCompatibilityClaimed`],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject mutable function public claim carriers", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const mutableFunctionClaimCarrier = createMutableFunctionClaimCarrier(
    "publicCompatibilityClaimed",
    false
  );
  const report = mutateFrozenReport(rowId, (row) => ({
    ...row,
    mutableFunctionClaimCarrier
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(Object.isFrozen(mutableFunctionClaimCarrier), false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.mutableFunctionClaimCarrier.[[Frozen]]`],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );

  mutableFunctionClaimCarrier.publicCompatibilityClaimed = true;
  assert.equal(mutableFunctionClaimCarrier.publicCompatibilityClaimed, true);
});

test("scheduler variant boundary diagnostics reject mutable function prototype claim surfaces", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  function prototypeClaimCarrier() {}
  Object.freeze(prototypeClaimCarrier);
  const report = mutateFrozenReport(rowId, (row) => ({
    ...row,
    prototypeClaimCarrier
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(Object.isFrozen(prototypeClaimCarrier), true);
  assert.equal(Object.isFrozen(prototypeClaimCarrier.prototype), false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.prototypeClaimCarrier.prototype.[[Frozen]]`],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );

  prototypeClaimCarrier.prototype.publicCompatibilityClaimed = true;
  assert.equal(
    prototypeClaimCarrier.prototype.publicCompatibilityClaimed,
    true
  );
});

test("scheduler variant boundary diagnostics reject top-level and nested function public claim carriers", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const reportFunctionClaimCarrier = createFunctionClaimCarrier(
    "publicMockSchedulerCompatibilityClaimed",
    true,
    { enumerable: false }
  );
  const nestedFunctionClaimCarrier = createFunctionClaimCarrier(
    "publicPackageCompatibilityClaimed",
    true
  );
  const report = mutateFrozenReport(
    rowId,
    (row) => ({
      ...row,
      queueIdentity: Object.freeze({
        ...row.queueIdentity,
        nestedFunctionClaimCarrier
      })
    }),
    {
      reportFunctionClaimCarrier
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    Object.keys(reportFunctionClaimCarrier).includes(
      "publicMockSchedulerCompatibilityClaimed"
    ),
    false
  );
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      "report.reportFunctionClaimCarrier.publicMockSchedulerCompatibilityClaimed",
      `${rowId}.queueIdentity.nestedFunctionClaimCarrier.publicPackageCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject function claim carrier traps", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = mutateFrozenReport(rowId, (row) => ({
    ...row,
    functionClaimCarrier: withThrowingOwnKeysFunctionProxy()
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.functionClaimCarrier.[[OwnKeys]]`],
    gate.publicCompatibilityClaimIds
  );
  assertSubset(
    [`${rowId}.functionClaimCarrier.[[OwnKeys]]`],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject ownKeys-hidden public claim get proxies", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = mutateFrozenReport(rowId, (row) => ({
    ...row,
    hiddenGetClaimCarrier: withOwnKeysHiddenPublicClaimGetProxy(
      "publicCompatibilityClaimed",
      true
    )
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.hiddenGetClaimCarrier.publicCompatibilityClaimed`],
    gate.publicCompatibilityClaimIds
  );
  assertSubset(
    [`${rowId}.hiddenGetClaimCarrier.publicCompatibilityClaimed.[[HiddenGet]]`],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject ownKeys-hidden inferred public claim get proxies", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = mutateFrozenReport(rowId, (row) => ({
    ...row,
    hiddenInferredGetClaimCarrier: withOwnKeysHiddenPublicClaimGetProxy(
      "publicNewCompatibilityClaimed",
      true
    )
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.hiddenInferredGetClaimCarrier.publicNewCompatibilityClaimed`],
    gate.publicCompatibilityClaimIds
  );
  assertSubset(
    [
      `${rowId}.hiddenInferredGetClaimCarrier.publicNewCompatibilityClaimed.[[HiddenGet]]`
    ],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject ownKeys-hidden false public claim object proxies", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const hiddenFalseObjectProxy =
    createOwnKeysHiddenPublicClaimGetProxyController(
      "publicCompatibilityClaimed",
      false
    );
  const report = mutateFrozenReport(rowId, (row) => ({
    ...row,
    hiddenFalseObjectProxy: hiddenFalseObjectProxy.carrier
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(Object.isFrozen(hiddenFalseObjectProxy.carrier), true);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      `${rowId}.hiddenFalseObjectProxy.publicCompatibilityClaimed.[[HiddenGet]]`
    ],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );

  hiddenFalseObjectProxy.setValue(true);
  assert.equal(hiddenFalseObjectProxy.carrier.publicCompatibilityClaimed, true);
});

test("scheduler variant boundary diagnostics reject ownKeys-hidden false public claim function proxies", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const hiddenFalseFunctionProxy =
    createOwnKeysHiddenPublicClaimGetProxyController(
      "publicCompatibilityClaimed",
      false,
      { functionCarrier: true }
    );
  const report = mutateFrozenReport(rowId, (row) => ({
    ...row,
    hiddenFalseFunctionProxy: hiddenFalseFunctionProxy.carrier
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(Object.isFrozen(hiddenFalseFunctionProxy.carrier), true);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      `${rowId}.hiddenFalseFunctionProxy.publicCompatibilityClaimed.[[HiddenGet]]`
    ],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );

  hiddenFalseFunctionProxy.setValue(true);
  assert.equal(
    hiddenFalseFunctionProxy.carrier.publicCompatibilityClaimed,
    true
  );
});

test("scheduler variant boundary diagnostics reject inherited generic public compatibility claims", () => {
  const report = withInheritedOwnProperty(
    mutateRows([], {
      compatibilityClaimed: false
    }),
    "publicCompatibilityClaimed",
    true
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(Object.hasOwn(report, "publicCompatibilityClaimed"), false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.[[Prototype]].publicCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertSubset(
    ["report.[[Prototype]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject proxy-hidden public compatibility claims", () => {
  const report = withProxyHiddenOwnProperty(
    mutateRows([], {
      compatibilityClaimed: false
    }),
    "publicCompatibilityClaimed",
    true
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.publicCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
  assertSubset(
    ["report.publicCompatibilityClaimed.[[Descriptor]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject throwing public claim proxies", () => {
  const report = withThrowingOwnKeysProxy(
    mutateRows([], {
      compatibilityClaimed: false
    })
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(["report.[[OwnKeys]]"], gate.publicCompatibilityClaimIds);
  assertSubset(
    ["report.[[Frozen]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject top-level get throwing reports", () => {
  const report = withThrowingGetProxy(baselineReport());

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertIdMatching(
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    ),
    (id) => id.startsWith("report.") && id.endsWith(".[[Get]]")
  );
});

test("scheduler variant boundary diagnostics reject public postTask compatibility claims", () => {
  const report = mutateRows([], {
    compatibilityClaimed: false,
    publicPostTaskCompatibilityClaimed: true
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.publicPostTaskCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject non-false public postTask compatibility claims", () => {
  const report = mutateRows([], {
    compatibilityClaimed: false,
    publicPostTaskCompatibilityClaimed: "claimed"
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.publicPostTaskCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject hidden public postTask compatibility claims", () => {
  const report = withHiddenOwnProperty(
    mutateRows([], {
      compatibilityClaimed: false
    }),
    "publicPostTaskCompatibilityClaimed",
    true
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    Object.keys(report).includes("publicPostTaskCompatibilityClaimed"),
    false
  );
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.publicPostTaskCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject public mock compatibility claims", () => {
  const report = mutateRows([], {
    compatibilityClaimed: false,
    publicMockSchedulerCompatibilityClaimed: true
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.publicMockSchedulerCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject non-false public mock compatibility claims", () => {
  const report = mutateRows([], {
    compatibilityClaimed: false,
    publicMockSchedulerCompatibilityClaimed: "claimed"
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.publicMockSchedulerCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject hidden public mock compatibility claims", () => {
  const report = withHiddenOwnProperty(
    mutateRows([], {
      compatibilityClaimed: false
    }),
    "publicMockSchedulerCompatibilityClaimed",
    true
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    Object.keys(report).includes("publicMockSchedulerCompatibilityClaimed"),
    false
  );
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.publicMockSchedulerCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject nested proxy-hidden compatibility claims", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = mutateReport(rowId, (row) => ({
    ...row,
    unsupportedStatus: withProxyHiddenOwnProperty(
      row.unsupportedStatus,
      "nativeCompatibilityClaimed",
      true
    ),
    queueIdentity: withProxyHiddenOwnProperty(
      row.queueIdentity,
      "publicPackageCompatibilityClaimed",
      true
    ),
    sourceCurrentness: withProxyHiddenOwnProperty(
      row.sourceCurrentness,
      "publicMockSchedulerCompatibilityClaimed",
      true
    )
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [
      `${rowId}.unsupportedStatus.nativeCompatibilityClaimed`,
      `${rowId}.queueIdentity.publicPackageCompatibilityClaimed`,
      `${rowId}.sourceCurrentness.publicMockSchedulerCompatibilityClaimed`
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
  assertSubset(
    [
      `${rowId}.unsupportedStatus.nativeCompatibilityClaimed.[[Descriptor]]`,
      `${rowId}.queueIdentity.publicPackageCompatibilityClaimed.[[Descriptor]]`,
      `${rowId}.sourceCurrentness.publicMockSchedulerCompatibilityClaimed.[[Descriptor]]`
    ],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject nested ownKeys throwing claim containers", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";

  for (const field of nestedClaimContainerFields()) {
    const report = mutateFrozenReport(rowId, (row) => ({
      ...row,
      [field]: withThrowingOwnKeysProxy(row[field])
    }));

    const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
      boundaryDiagnosticsReport: report
    });

    assert.equal(
      gate.status,
      SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
    );
    assertSubset(
      [`${rowId}.${field}.[[OwnKeys]]`],
      gate.publicCompatibilityClaimIds
    );
    assertSubset(
      [`${rowId}.${field}.[[OwnKeys]]`],
      violationIds(
        gate,
        "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
      )
    );
  }
});

test("scheduler variant boundary diagnostics reject nested get throwing claim containers", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";

  for (const field of nestedClaimContainerFields()) {
    const report = mutateFrozenReport(rowId, (row) => ({
      ...row,
      [field]: withThrowingGetProxy(row[field])
    }));

    const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
      boundaryDiagnosticsReport: report
    });

    assert.equal(
      gate.status,
      SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
    );
    assertIdMatching(
      violationIds(
        gate,
        "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
      ),
      (id) => id.startsWith(`${rowId}.${field}.`) && id.endsWith(".[[Get]]")
    );
  }
});

test("scheduler variant boundary diagnostics reject mutable nested claim containers", () => {
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const report = mutateReport(rowId, (row) => ({
    ...row,
    unsupportedStatus: {
      ...row.unsupportedStatus
    }
  }));

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    Object.isFrozen(report.rowsById[rowId].unsupportedStatus),
    false
  );
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.unsupportedStatus.[[Frozen]]`],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject row-level compatibility claims", () => {
  const rowId = "scheduler-mock-root-development-boundary-diagnostics";
  const report = mutateReport(
    rowId,
    (row) => ({
      ...row,
      compatibilityClaimed: true
    }),
    {
      compatibilityClaimed: false
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.compatibilityClaimed`],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject row id get throwing proxies", () => {
  const rowId = "scheduler-mock-root-development-boundary-diagnostics";
  const report = withRowReplacement(
    rowId,
    withThrowingGetForKeyProxy(baselineReport().rowsById[rowId], "rowId")
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertIdMatching(
    gate.untrustedPublicClaimContainerIds,
    (id) => id.endsWith(".rowId.[[Get]]")
  );
});

test("scheduler variant boundary diagnostics reject row field get throwing proxies", () => {
  const rowId = "scheduler-mock-root-development-boundary-diagnostics";
  const report = withRowReplacement(
    rowId,
    withThrowingGetForKeyProxy(
      baselineReport().rowsById[rowId],
      "classification"
    )
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertIdMatching(
    gate.untrustedPublicClaimContainerIds,
    (id) => id.endsWith(".classification.[[Get]]")
  );
});

test("scheduler variant boundary diagnostics reject inherited row-level compatibility claims", () => {
  const rowId = "scheduler-mock-root-development-boundary-diagnostics";
  const report = mutateReport(
    rowId,
    (row) => withInheritedOwnProperty(row, "compatibilityClaimed", true),
    {
      compatibilityClaimed: false
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    Object.hasOwn(report.rowsById[rowId], "compatibilityClaimed"),
    false
  );
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.[[Prototype]].compatibilityClaimed`],
    gate.publicCompatibilityClaimIds
  );
  assertSubset(
    [`${rowId}.[[Prototype]]`],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject malformed caller source gates", () => {
  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    variantCurrentnessGate: {
      rowsByVariant: {}
    }
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["variantCurrentnessGate.[[BoundaryDiagnosticsReport]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject source gate rejection id filter traps", () => {
  const report = Object.freeze({
    ...baselineReport(),
    sourceGateReportRejectionIds: withThrowingFilterArrayProxy([])
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.sourceGateReportRejectionIds.filter.[[Get]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject inherited source gate rejection ids", () => {
  const report = withInheritedOwnProperty(
    baselineReport(),
    "sourceGateReportRejectionIds",
    Object.freeze(["variantCurrentnessGate.rowsByVariant.[[Forged]]"])
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.sourceGateReportRejectionIds.[[Inherited]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject hidden source gate rejection ids", () => {
  const report = withHiddenPublicClaimGetRecordProxy(baselineReport(), {
    sourceGateReportRejectionIds: Object.freeze([
      "variantCurrentnessGate.rowsByVariant.[[Forged]]"
    ])
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.sourceGateReportRejectionIds.[[HiddenGet]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject source gate rejection id object-like arrays", () => {
  const report = Object.freeze({
    ...baselineReport(),
    sourceGateReportRejectionIds: Object.freeze({
      0: "variantCurrentnessGate.rowsByVariant.[[Forged]]",
      length: 1,
      filter: Object.freeze(() => [])
    })
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.sourceGateReportRejectionIds.[[Array]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject source gate rejection id non-string entries", () => {
  const report = Object.freeze({
    ...baselineReport(),
    sourceGateReportRejectionIds: Object.freeze([
      "variantCurrentnessGate.rowsByVariant.[[Forged]]",
      Object.freeze({})
    ])
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.sourceGateReportRejectionIds[1].[[String]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject source gate rejection id accessors", () => {
  const report = Object.freeze({
    ...baselineReport(),
    sourceGateReportRejectionIds: withThrowingIndexArrayProxy()
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.sourceGateReportRejectionIds[0].[[Get]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject source gate rejection id hidden index proxies", () => {
  const report = Object.freeze({
    ...baselineReport(),
    sourceGateReportRejectionIds: withLengthZeroHiddenIndexArrayProxy(
      Object.freeze({})
    )
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.sourceGateReportRejectionIds[0].[[HiddenIndex]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject source gate rejection id high hidden index proxies", () => {
  const report = Object.freeze({
    ...baselineReport(),
    sourceGateReportRejectionIds: withLengthZeroHiddenIndexArrayProxy(
      Object.freeze({ forged: true }),
      5
    )
  });

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    ["report.sourceGateReportRejectionIds.[[Present]]"],
    violationIds(
      gate,
      "scheduler-variant-boundary-diagnostics-untrusted-public-claim-container"
    )
  );
});

test("scheduler variant boundary diagnostics reject non-false row-level compatibility claims", () => {
  const rowId = "scheduler-mock-root-development-boundary-diagnostics";
  const report = mutateReport(
    rowId,
    (row) => ({
      ...row,
      compatibilityClaimed: "claimed"
    }),
    {
      compatibilityClaimed: false
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.compatibilityClaimed`],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

test("scheduler variant boundary diagnostics reject hidden row-level compatibility claims", () => {
  const rowId = "scheduler-mock-root-development-boundary-diagnostics";
  const report = mutateReport(
    rowId,
    (row) => withHiddenOwnProperty(row, "compatibilityClaimed", true),
    {
      compatibilityClaimed: false
    }
  );

  const gate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
    boundaryDiagnosticsReport: report
  });

  assert.equal(report.compatibilityClaimed, false);
  assert.equal(
    Object.keys(report.rowsById[rowId]).includes("compatibilityClaimed"),
    false
  );
  assert.equal(
    gate.status,
    SCHEDULER_VARIANT_BOUNDARY_DIAGNOSTICS_VIOLATION_STATUS
  );
  assertSubset(
    [`${rowId}.compatibilityClaimed`],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-variant-boundary-diagnostics-public-compatibility-claim-detected"
  );
});

function baselineReport() {
  if (cachedBaselineReport === null) {
    cachedBaselineReport = createSchedulerVariantBoundaryDiagnosticsReport();
  }
  return cachedBaselineReport;
}

function baselineGate() {
  if (cachedBaselineGate === null) {
    cachedBaselineGate =
      evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate({
        boundaryDiagnosticsReport: baselineReport()
      });
  }
  return cachedBaselineGate;
}

function createForgedVariantCurrentnessGate() {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const staleVariantId = "scheduler-cjs-unstable-post-task-development";
  const staleRow = Object.freeze({
    ...currentGate.rowsByVariant[staleVariantId],
    sourceSha256: "stale-forged-post-task-source"
  });
  const rowsByVariant = Object.freeze({
    ...currentGate.rowsByVariant,
    [staleVariantId]: staleRow
  });

  return Object.freeze({
    ...currentGate,
    gateId: "stale-source-gate",
    rowsByVariant,
    sourceRows: Object.freeze(currentGate.sourceRows.map((row) =>
      row.variantId === staleVariantId ? staleRow : row
    ))
  });
}

function mutateReport(rowId, mutateRow, reportOverrides = {}) {
  return mutateRows([[rowId, mutateRow]], reportOverrides);
}

function withRowReplacement(rowId, replacementRow, reportOverrides = {}) {
  const source = baselineReport();
  const rows = source.rows.map((row) =>
    row.rowId === rowId ? replacementRow : row
  );

  return {
    ...source,
    ...reportOverrides,
    rows,
    rowsById: {
      ...source.rowsById,
      [rowId]: replacementRow
    }
  };
}

function mutateFrozenReport(rowId, mutateRow, reportOverrides = {}) {
  const source = baselineReport();
  const rows = Object.freeze(
    source.rows.map((row) =>
      row.rowId === rowId ? Object.freeze(mutateRow(row)) : row
    )
  );

  return Object.freeze({
    ...source,
    ...reportOverrides,
    rows,
    rowsById: Object.freeze(
      Object.fromEntries(rows.map((row) => [row.rowId, row]))
    )
  });
}

function nestedClaimContainerFields() {
  return ["sourceCurrentness", "queueIdentity", "unsupportedStatus"];
}

function requiredSourceVariantIdsForBoundaryDiagnostics() {
  return [
    "scheduler-unstable-mock-root",
    "scheduler-cjs-unstable-mock-development",
    "scheduler-cjs-unstable-mock-production",
    "scheduler-unstable-post-task-wrapper",
    "scheduler-cjs-unstable-post-task-development",
    "scheduler-cjs-unstable-post-task-production"
  ];
}

function createRowsByVariantWithRequiredRows(createRow) {
  return Object.freeze(
    Object.fromEntries(
      requiredSourceVariantIdsForBoundaryDiagnostics().map((variantId) => [
        variantId,
        createRow(variantId)
      ])
    )
  );
}

function withInheritedOptionAccessor(key) {
  const prototype = {};
  Object.defineProperty(prototype, key, {
    configurable: true,
    enumerable: true,
    get() {
      throw new TypeError(`inherited ${key} trap`);
    }
  });
  return Object.create(prototype);
}

function withTemporaryObjectPrototypeProperties(properties, callback) {
  const previousDescriptors = new Map();
  for (const [key, value] of Object.entries(properties)) {
    previousDescriptors.set(
      key,
      Object.getOwnPropertyDescriptor(Object.prototype, key)
    );
    Object.defineProperty(Object.prototype, key, {
      configurable: true,
      enumerable: false,
      value,
      writable: true
    });
  }

  try {
    return callback();
  } finally {
    for (const [key, descriptor] of previousDescriptors) {
      if (descriptor === undefined) {
        delete Object.prototype[key];
      } else {
        Object.defineProperty(Object.prototype, key, descriptor);
      }
    }
  }
}

function createFunctionClaimCarrier(
  key,
  value,
  { enumerable = true } = {}
) {
  function claimCarrier() {}
  Object.defineProperty(claimCarrier, key, {
    configurable: true,
    enumerable,
    value,
    writable: true
  });
  return Object.freeze(claimCarrier);
}

function createMutableFunctionClaimCarrier(key, value) {
  function claimCarrier() {}
  Object.defineProperty(claimCarrier, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true
  });
  return claimCarrier;
}

function withHiddenOwnProperty(record, key, value) {
  const clone = { ...record };
  Object.defineProperty(clone, key, {
    configurable: true,
    enumerable: false,
    value,
    writable: true
  });
  return clone;
}

function withInheritedOwnProperty(record, key, value) {
  const prototype = Object.create(Object.prototype);
  Object.defineProperty(prototype, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true
  });
  const clone = Object.create(prototype);
  for (const ownKey of Reflect.ownKeys(record)) {
    if (ownKey === key) {
      continue;
    }
    Object.defineProperty(
      clone,
      ownKey,
      Object.getOwnPropertyDescriptor(record, ownKey)
    );
  }
  return Object.freeze(clone);
}

function withProxyHiddenOwnProperty(record, key, value) {
  const target = {
    ...record
  };
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true
  });
  return new Proxy(target, {
    getOwnPropertyDescriptor(proxyTarget, propertyKey) {
      if (propertyKey === key) {
        return undefined;
      }
      return Reflect.getOwnPropertyDescriptor(proxyTarget, propertyKey);
    }
  });
}

function withOwnKeysHiddenPublicClaimGetProxy(key, value) {
  return createOwnKeysHiddenPublicClaimGetProxyController(key, value).carrier;
}

function withHiddenPublicClaimGetRecordProxy(record, claimValues) {
  const claimMap = new Map(Object.entries(claimValues));
  return new Proxy(record, {
    get(proxyTarget, propertyKey, receiver) {
      if (typeof propertyKey === "string" && claimMap.has(propertyKey)) {
        return claimMap.get(propertyKey);
      }
      return Reflect.get(proxyTarget, propertyKey, receiver);
    },
    getOwnPropertyDescriptor(proxyTarget, propertyKey) {
      if (typeof propertyKey === "string" && claimMap.has(propertyKey)) {
        return undefined;
      }
      return Reflect.getOwnPropertyDescriptor(proxyTarget, propertyKey);
    },
    ownKeys(proxyTarget) {
      return Reflect.ownKeys(proxyTarget).filter(
        (propertyKey) =>
          typeof propertyKey !== "string" || !claimMap.has(propertyKey)
      );
    }
  });
}

function withThrowingFilterArrayProxy(values) {
  const target = Object.freeze([...values]);
  return new Proxy(target, {
    get(proxyTarget, propertyKey, receiver) {
      if (propertyKey === "filter") {
        throw new Error("filter trap");
      }
      return Reflect.get(proxyTarget, propertyKey, receiver);
    }
  });
}

function withThrowingIndexArrayProxy() {
  const target = [];
  Object.defineProperty(target, 0, {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error("source gate rejection id get trap");
    }
  });
  return Object.freeze(target);
}

function withLengthZeroHiddenIndexArrayProxy(value, index = 0) {
  const target = Object.freeze([]);
  const hiddenKey = String(index);
  return new Proxy(target, {
    get(proxyTarget, propertyKey, receiver) {
      if (propertyKey === hiddenKey) {
        return value;
      }
      return Reflect.get(proxyTarget, propertyKey, receiver);
    }
  });
}

function createOwnKeysHiddenPublicClaimGetProxyController(
  key,
  value,
  { functionCarrier = false } = {}
) {
  let currentValue = value;
  const target = functionCarrier ? function claimCarrier() {} : {};
  Object.freeze(target);
  return {
    carrier: new Proxy(target, {
      get(proxyTarget, propertyKey, receiver) {
        if (propertyKey === key) {
          return currentValue;
        }
        return Reflect.get(proxyTarget, propertyKey, receiver);
      },
      ownKeys(proxyTarget) {
        return Reflect.ownKeys(proxyTarget).filter(
          (propertyKey) => propertyKey !== key
        );
      }
    }),
    setValue(nextValue) {
      currentValue = nextValue;
    }
  };
}

function withThrowingOwnKeysFrozenProxy(record) {
  const target = Object.preventExtensions({
    ...record
  });
  return new Proxy(target, {
    ownKeys() {
      throw new Error("diagnostic object ownKeys trap");
    }
  });
}

function withThrowingOwnKeysFunctionProxy() {
  function claimCarrier() {}
  return new Proxy(claimCarrier, {
    ownKeys() {
      throw new Error("function claim carrier ownKeys trap");
    }
  });
}

function withThrowingOwnKeysProxy(record) {
  return new Proxy(record, {
    ownKeys() {
      throw new Error("claim scanner ownKeys trap");
    }
  });
}

function withThrowingGetProxy(record) {
  return new Proxy(record, {
    get() {
      throw new Error("claim scanner get trap");
    }
  });
}

function withThrowingGetForKeyProxy(record, throwingKey) {
  return new Proxy(record, {
    get(proxyTarget, propertyKey, receiver) {
      if (propertyKey === throwingKey) {
        throw new Error(`claim scanner ${String(propertyKey)} get trap`);
      }
      return Reflect.get(proxyTarget, propertyKey, receiver);
    }
  });
}

function mutateRows(mutations, reportOverrides = {}) {
  const mutationMap = new Map(mutations);
  const source = baselineReport();
  const rows = source.rows.map((row) => {
    const mutate = mutationMap.get(row.rowId);
    return mutate ? mutate(row) : row;
  });

  return {
    ...source,
    ...reportOverrides,
    rows,
    rowsById: Object.fromEntries(rows.map((row) => [row.rowId, row]))
  };
}

function assertViolation(gate, id) {
  assert.ok(
    gate.violations.some((violation) => violation.id === id),
    `missing violation ${id}`
  );
}

function violationRows(gate, id) {
  const violation = gate.violations.find((candidate) => candidate.id === id);
  assert.ok(violation, `missing violation ${id}`);
  return violation.rows.map((row) => row.rowId);
}

function violationIds(gate, id) {
  const violation = gate.violations.find((candidate) => candidate.id === id);
  assert.ok(violation, `missing violation ${id}`);
  return violation.ids;
}

function assertSubset(expected, actual) {
  for (const value of expected) {
    assert.ok(actual.includes(value), `missing ${value}`);
  }
}

function assertIdMatching(ids, predicate) {
  assert.ok(ids.some(predicate), `missing matching id in ${ids.join(", ")}`);
}
