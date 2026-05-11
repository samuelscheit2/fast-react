import assert from "node:assert/strict";
import test from "node:test";

import {
  SCHEDULER_PUBLIC_TIMING_BLOCKED_SEMANTICS,
  SCHEDULER_PUBLIC_TIMING_BLOCKER_GATE_STATUS,
  SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS,
  SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS,
  evaluateSchedulerPublicTimingBlockerCurrentnessGate
} from "../src/scheduler-public-timing-blocker-currentness.mjs";
import {
  SCHEDULER_VARIANT_CURRENTNESS_GATE_ID,
  SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS,
  evaluateSchedulerVariantCurrentnessGate
} from "../src/scheduler-variant-oracle.mjs";
import { evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate } from "../src/scheduler-variant-boundary-diagnostics-currentness.mjs";

let cachedBaselineGate = null;

test("scheduler public timing blocker validates current source rows before consuming variant evidence", () => {
  const gate = baselineGate();

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_GATE_STATUS);
  assert.equal(gate.sourceGateContextRecognized, true);
  assert.equal(gate.boundaryDiagnosticsCurrentnessRecognized, true);
  assert.equal(gate.sourcePackageRowsRecognized, true);
  assert.equal(gate.acceptedVariantCurrentnessEvidenceConsumed, true);
  assert.equal(gate.publicTimingSemanticsBlocked, true);
  assert.equal(gate.publicCompatibilityClaimsBlocked, true);
  assert.equal(gate.compatibilityClaimed, false);
  assert.deepEqual(gate.violations, []);
  assert.deepEqual(
    gate.rows.map((row) => row.variantId),
    SCHEDULER_PUBLIC_TIMING_REQUIRED_VARIANT_IDS
  );

  const root = gate.rowsByVariant["scheduler-index-wrapper"];
  assert.equal(root.surface, "default");
  assert.equal(root.entrypoint, "scheduler");
  assert.equal(root.directDeepCjsImport, false);
  assert.equal(root.sourcePackageRowValidated, true);
  assert.equal(root.acceptedVariantCurrentnessEvidenceConsumed, true);
  assert.equal(root.publicSchedulerTimingCompatibilityClaimed, false);
  assert.equal(root.publicSchedulerCallbackExecutionClaimed, false);
  assert.equal(root.publicSchedulerCancellationCompatibilityClaimed, false);
  assert.equal(
    root.publicSchedulerCurrentEventBehaviorCompatibilityClaimed,
    false
  );
  assert.equal(
    root.blockedTimingSemantics["unstable_scheduleCallback-callback-execution"]
      .blocked,
    true
  );
  assert.equal(
    root.blockedTimingSemantics[
      "scheduler-priority-and-current-event-behavior"
    ].oracleBacked,
    false
  );

  const rootCjs = gate.rowsByVariant["scheduler-cjs-index-production"];
  assert.equal(rootCjs.surface, "default");
  assert.equal(rootCjs.directDeepCjsImport, true);
  assert.equal(rootCjs.entrypoint, "scheduler/cjs/scheduler.production.js");

  const mock = gate.rowsByVariant["scheduler-cjs-unstable-mock-development"];
  assert.equal(mock.surface, "mock");
  assert.equal(
    mock.blockedTimingSemantics[
      "scheduler-mock-virtual-time-and-yielded-values"
    ].compatibilityClaimed,
    false
  );

  const postTask =
    gate.rowsByVariant["scheduler-cjs-unstable-post-task-production"];
  assert.equal(postTask.surface, "postTask");
  assert.equal(
    postTask.blockedTimingSemantics[
      "scheduler-postTask-browser-task-ordering-and-priority"
    ].blocked,
    true
  );

  const native = gate.rowsByVariant["scheduler-native-wrapper"];
  assert.equal(native.surface, "native-blocked-context");
  assert.equal(native.publicNativeCompatibilityClaimed, false);
  assert.equal(gate.coverage.nativeRuntimeCompatibilityBlocked, true);
  assert.equal(gate.coverage.reactRootActNativePackageCompatibilityBlocked, true);
  assert.deepEqual(
    Object.keys(gate.boundaryDiagnosticsRowsById),
    [
      "scheduler-mock-root-development-boundary-diagnostics",
      "scheduler-mock-root-production-boundary-diagnostics",
      "scheduler-mock-cjs-development-boundary-diagnostics",
      "scheduler-mock-cjs-production-boundary-diagnostics",
      "scheduler-post-task-development-boundary-diagnostics",
      "scheduler-post-task-production-boundary-diagnostics"
    ]
  );

  assert.deepEqual(
    Object.keys(gate.blockedTimingSemantics),
    SCHEDULER_PUBLIC_TIMING_BLOCKED_SEMANTICS
  );
  assert.deepEqual(
    Object.values(gate.blockedTimingSemantics).map(
      (semantic) => semantic.oracleBacked
    ),
    SCHEDULER_PUBLIC_TIMING_BLOCKED_SEMANTICS.map(() => false)
  );
});

test("scheduler public timing blocker rejects stale Worker 949 boundary diagnostics input", () => {
  const boundaryGate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate();
  const rowId = "scheduler-post-task-production-boundary-diagnostics";
  const rows = Object.freeze(
    boundaryGate.rows.map((row) =>
      row.rowId === rowId
        ? Object.freeze({
            ...row,
            selectedSourceCurrentness: Object.freeze({
              ...row.selectedSourceCurrentness,
              sourceSha256: "stale-worker-949-post-task-cjs-source"
            })
          })
        : row
    )
  );
  const staleBoundaryGate = Object.freeze({
    ...boundaryGate,
    rows,
    rowsById: Object.freeze(Object.fromEntries(rows.map((row) => [row.rowId, row])))
  });

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    boundaryDiagnosticsGate: staleBoundaryGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assert.equal(gate.boundaryDiagnosticsCurrentnessRecognized, false);
  assert.equal(gate.acceptedVariantCurrentnessEvidenceConsumed, false);
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-boundary-diagnostics-gate-caller-shaped"
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-public-timing-blocker-boundary-diagnostics-source-row-mismatch"
    ).map((row) => [
      row.rowId,
      row.selectedSourceFirstDifferencePath
    ]),
    [[rowId, "$.sourceSha256"]]
  );
});

test("scheduler public timing blocker rejects Worker 949 selected source currentness drift", () => {
  const boundaryGate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate();
  const blockerClaimRowId = "scheduler-mock-root-development-boundary-diagnostics";
  const evidenceScopeRowId = "scheduler-post-task-production-boundary-diagnostics";
  const rows = Object.freeze(
    boundaryGate.rows.map((row) => {
      if (row.rowId === blockerClaimRowId) {
        return Object.freeze({
          ...row,
          selectedSourceCurrentness: Object.freeze({
            ...row.selectedSourceCurrentness,
            publicBlockerClaims: Object.freeze({
              ...row.selectedSourceCurrentness.publicBlockerClaims,
              packageCompatibilityClaimed: true
            })
          })
        });
      }

      if (row.rowId === evidenceScopeRowId) {
        return Object.freeze({
          ...row,
          selectedSourceCurrentness: Object.freeze({
            ...row.selectedSourceCurrentness,
            evidenceScope: Object.freeze({
              ...row.selectedSourceCurrentness.evidenceScope,
              variantEvidenceAcceptedForRootBehavior: true
            })
          })
        });
      }

      return row;
    })
  );
  const staleBoundaryGate = Object.freeze({
    ...boundaryGate,
    rows,
    rowsById: Object.freeze(Object.fromEntries(rows.map((row) => [row.rowId, row])))
  });

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    boundaryDiagnosticsGate: staleBoundaryGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assert.equal(gate.boundaryDiagnosticsCurrentnessRecognized, false);
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-public-timing-blocker-boundary-diagnostics-source-row-mismatch"
    ).map((row) => [row.rowId, row.selectedSourceFirstDifferencePath]),
    [
      [blockerClaimRowId, "$.publicBlockerClaims.packageCompatibilityClaimed"],
      [
        evidenceScopeRowId,
        "$.evidenceScope.variantEvidenceAcceptedForRootBehavior"
      ]
    ]
  );
});

test("scheduler public timing blocker rejects broken Worker 949 boundary diagnostics status", () => {
  const boundaryGate = evaluateSchedulerVariantBoundaryDiagnosticsCurrentnessGate();
  const brokenBoundaryGate = Object.freeze({
    ...boundaryGate,
    status: "stale-worker-949-boundary-diagnostics",
    sourceCurrentnessRecognized: false,
    violations: Object.freeze([Object.freeze({ id: "stale-worker-949" })])
  });

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    boundaryDiagnosticsGate: brokenBoundaryGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assert.equal(gate.boundaryDiagnosticsCurrentnessRecognized, false);
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-boundary-diagnostics-gate-mismatch"
  );
});

test("scheduler public timing blocker returns structured violations for null variant currentness gates", () => {
  let gate = null;
  assert.doesNotThrow(() => {
    gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
      variantCurrentnessGate: null
    });
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assert.equal(gate.sourceGateContextRecognized, false);
  assert.equal(gate.sourcePackageRowsRecognized, false);
  assert.equal(gate.acceptedVariantCurrentnessEvidenceConsumed, false);
  assertViolation(gate, "scheduler-public-timing-blocker-source-gate-malformed");
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-source-package-row-validation-failed"
  );
  assertSubset(
    [
      "variantCurrentnessGate.[[Object]]",
      "variantCurrentnessGate.rowsByVariant.[[Object]]",
      "variantCurrentnessGate.rowsByVariant.[[Object]]"
    ],
    allViolationIds(gate)
  );
});

test("scheduler public timing blocker returns structured violations for malformed rowsByVariant", () => {
  const malformedRowsByVariant = new Proxy(
    {},
    {
      getOwnPropertyDescriptor() {
        throw new TypeError("rows unavailable");
      }
    }
  );
  const malformedGate = Object.freeze({
    gateId: SCHEDULER_VARIANT_CURRENTNESS_GATE_ID,
    status: SCHEDULER_VARIANT_CURRENTNESS_GATE_STATUS,
    compatibilityClaimed: false,
    rowsByVariant: malformedRowsByVariant
  });

  let gate = null;
  assert.doesNotThrow(() => {
    gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
      variantCurrentnessGate: malformedGate
    });
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assert.equal(gate.sourcePackageRowsRecognized, false);
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-source-package-row-validation-failed"
  );
  assertSubset(
    [
      "variantCurrentnessGate.rowsByVariant.scheduler-index-wrapper.[[Descriptor]]"
    ],
    allViolationIds(gate)
  );
});

test("scheduler public timing blocker rejects caller-shaped cloned variant currentness gates", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const clonedGate = Object.freeze({
    ...currentGate,
    rowsByVariant: currentGate.rowsByVariant
  });

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    variantCurrentnessGate: clonedGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assert.equal(gate.sourcePackageRowsRecognized, true);
  assert.equal(gate.sourceGateContextRecognized, false);
  assert.equal(gate.acceptedVariantCurrentnessEvidenceConsumed, false);
  assert.equal(
    gate.rowsByVariant["scheduler-index-wrapper"]
      .acceptedVariantCurrentnessEvidenceConsumed,
    false
  );
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-source-gate-caller-shaped"
  );
});

test("scheduler public timing blocker rejects stale source package rows", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const variantId = "scheduler-cjs-index-production";
  const staleRowsByVariant = Object.freeze({
    ...currentGate.rowsByVariant,
    [variantId]: Object.freeze({
      ...currentGate.rowsByVariant[variantId],
      sourceSha256: "stale-default-cjs-source"
    })
  });
  const staleGate = Object.freeze({
    ...currentGate,
    rowsByVariant: staleRowsByVariant
  });

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    variantCurrentnessGate: staleGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assert.equal(gate.sourcePackageRowsRecognized, false);
  assert.equal(gate.rowsByVariant[variantId].sourcePackageRowValidated, false);
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-public-timing-blocker-source-package-row-mismatch"
    ).map((row) => [row.variantId, row.firstDifferencePath]),
    [[variantId, "$.sourceSha256"]]
  );
});

test("scheduler public timing blocker rejects Worker 937 currentness row field drift", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const evidenceScopeVariantId = "scheduler-index-wrapper";
  const blockerClaimVariantId = "scheduler-cjs-index-production";
  const staleRowsByVariant = Object.freeze({
    ...currentGate.rowsByVariant,
    [evidenceScopeVariantId]: Object.freeze({
      ...currentGate.rowsByVariant[evidenceScopeVariantId],
      evidenceScope: Object.freeze({
        ...currentGate.rowsByVariant[evidenceScopeVariantId].evidenceScope,
        variantEvidenceAcceptedForRootBehavior: true
      })
    }),
    [blockerClaimVariantId]: Object.freeze({
      ...currentGate.rowsByVariant[blockerClaimVariantId],
      publicBlockerClaims: Object.freeze({
        ...currentGate.rowsByVariant[blockerClaimVariantId].publicBlockerClaims,
        packageCompatibilityClaimed: true
      })
    })
  });
  const staleGate = Object.freeze({
    ...currentGate,
    rowsByVariant: staleRowsByVariant
  });

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    variantCurrentnessGate: staleGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assert.equal(gate.sourcePackageRowsRecognized, false);
  assert.equal(
    gate.rowsByVariant[evidenceScopeVariantId].sourcePackageRowValidated,
    false
  );
  assert.equal(
    gate.rowsByVariant[blockerClaimVariantId].sourcePackageRowValidated,
    false
  );
  assert.deepEqual(
    violationRows(
      gate,
      "scheduler-public-timing-blocker-source-package-row-mismatch"
    ).map((row) => [row.variantId, row.firstDifferencePath]),
    [
      [
        evidenceScopeVariantId,
        "$.evidenceScope.variantEvidenceAcceptedForRootBehavior"
      ],
      [blockerClaimVariantId, "$.publicBlockerClaims.packageCompatibilityClaimed"]
    ]
  );
});

test("scheduler public timing blocker rejects caller public compatibility claims", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const claimedGate = {
    ...currentGate,
    rowsByVariant: currentGate.rowsByVariant
  };
  Object.defineProperty(claimedGate, "publicSchedulerTimingCompatibilityClaimed", {
    configurable: true,
    enumerable: false,
    value: true
  });
  Object.freeze(claimedGate);

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    variantCurrentnessGate: claimedGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assertSubset(
    ["variantCurrentnessGate.publicSchedulerTimingCompatibilityClaimed"],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-public-compatibility-claim-detected"
  );
});

test("scheduler public timing blocker rejects proxy-hidden public compatibility claims", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const hiddenClaimRow = new Proxy(
    {
      ...currentGate.rowsByVariant["scheduler-index-wrapper"]
    },
    {
      get(target, key, receiver) {
        if (key === "publicSchedulerCallbackExecutionClaimed") {
          return true;
        }
        return Reflect.get(target, key, receiver);
      }
    }
  );
  const rowsByVariant = Object.freeze({
    ...currentGate.rowsByVariant,
    "scheduler-index-wrapper": hiddenClaimRow
  });
  const hiddenClaimGate = new Proxy(
    {
      ...currentGate,
      rowsByVariant
    },
    {
      get(target, key, receiver) {
        if (key === "publicPackageCompatibilityClaimed") {
          return true;
        }
        return Reflect.get(target, key, receiver);
      }
    }
  );

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    variantCurrentnessGate: hiddenClaimGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assertSubset(
    [
      "variantCurrentnessGate.publicPackageCompatibilityClaimed",
      "variantCurrentnessGate.rowsByVariant.scheduler-index-wrapper.publicSchedulerCallbackExecutionClaimed"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-public-compatibility-claim-detected"
  );
});

test("scheduler public timing blocker rejects broad non-public compatibility aliases", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const schedulerAliasRow = {
    ...currentGate.rowsByVariant["scheduler-index-wrapper"]
  };
  Object.defineProperty(schedulerAliasRow, "schedulerCompatibilityClaimed", {
    configurable: true,
    enumerable: false,
    value: true
  });
  Object.defineProperty(
    schedulerAliasRow,
    "schedulerTimingCompatibilityClaimed",
    {
      configurable: true,
      enumerable: false,
      get() {
        return true;
      }
    }
  );

  const rootAliasPrototype = Object.freeze({
    rootCompatibilityClaimed: true
  });
  const rootAliasRow = Object.assign(
    Object.create(rootAliasPrototype),
    currentGate.rowsByVariant["scheduler-cjs-index-development"]
  );

  const actAliasSymbol = Symbol("actCompatibilityClaimed");
  const actAliasRow = {
    ...currentGate.rowsByVariant["scheduler-cjs-index-production"]
  };
  Object.defineProperty(actAliasRow, actAliasSymbol, {
    configurable: true,
    enumerable: false,
    value: true
  });

  function aliasCarrier() {}
  aliasCarrier.nativeExecutionClaimed = true;
  const nativeAliasRow = {
    ...currentGate.rowsByVariant["scheduler-native-wrapper"],
    aliasCarrier
  };

  const packageAliasRow = {
    ...currentGate.rowsByVariant["scheduler-cjs-native-production"],
    packageExecutionClaimed: true
  };
  Object.defineProperty(packageAliasRow, "packageReady", {
    configurable: true,
    enumerable: false,
    value: true
  });

  const rowsByVariant = Object.freeze({
    ...currentGate.rowsByVariant,
    "scheduler-index-wrapper": Object.freeze(schedulerAliasRow),
    "scheduler-cjs-index-development": Object.freeze(rootAliasRow),
    "scheduler-cjs-index-production": Object.freeze(actAliasRow),
    "scheduler-native-wrapper": Object.freeze(nativeAliasRow),
    "scheduler-cjs-native-production": Object.freeze(packageAliasRow)
  });
  const claimedGate = {
    ...currentGate,
    rowsByVariant
  };
  Object.defineProperty(claimedGate, "packageAliasAccepted", {
    configurable: true,
    enumerable: false,
    value: true
  });

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    variantCurrentnessGate: Object.freeze(claimedGate)
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assertSubset(
    [
      "variantCurrentnessGate.packageAliasAccepted",
      "variantCurrentnessGate.rowsByVariant.scheduler-index-wrapper.schedulerCompatibilityClaimed",
      "variantCurrentnessGate.rowsByVariant.scheduler-index-wrapper.schedulerTimingCompatibilityClaimed",
      "variantCurrentnessGate.rowsByVariant.scheduler-cjs-index-development.[[Prototype]].rootCompatibilityClaimed",
      "variantCurrentnessGate.rowsByVariant.scheduler-cjs-index-production.Symbol(actCompatibilityClaimed)",
      "variantCurrentnessGate.rowsByVariant.scheduler-native-wrapper.aliasCarrier.nativeExecutionClaimed",
      "variantCurrentnessGate.rowsByVariant.scheduler-cjs-native-production.packageReady",
      "variantCurrentnessGate.rowsByVariant.scheduler-cjs-native-production.packageExecutionClaimed"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-public-compatibility-claim-detected"
  );
});

test("scheduler public timing blocker rejects proxy-hidden broad scheduler aliases", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const hiddenSchedulerAliasRow = new Proxy(
    {
      ...currentGate.rowsByVariant["scheduler-index-wrapper"]
    },
    {
      get(target, key, receiver) {
        if (key === "schedulerCompatibilityClaimed") {
          return true;
        }
        return Reflect.get(target, key, receiver);
      }
    }
  );
  const rowsByVariant = Object.freeze({
    ...currentGate.rowsByVariant,
    "scheduler-index-wrapper": hiddenSchedulerAliasRow
  });
  const hiddenSchedulerAliasGate = new Proxy(
    {
      ...currentGate,
      rowsByVariant
    },
    {
      get(target, key, receiver) {
        if (key === "schedulerCompatibilityClaimed") {
          return true;
        }
        if (key === "packageAliasAccepted") {
          return true;
        }
        return Reflect.get(target, key, receiver);
      }
    }
  );

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    variantCurrentnessGate: hiddenSchedulerAliasGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assertSubset(
    [
      "variantCurrentnessGate.schedulerCompatibilityClaimed",
      "variantCurrentnessGate.packageAliasAccepted",
      "variantCurrentnessGate.rowsByVariant.scheduler-index-wrapper.schedulerCompatibilityClaimed"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-public-compatibility-claim-detected"
  );
});

test("scheduler public timing blocker rejects scheduler root act native alias claims", () => {
  const currentGate = evaluateSchedulerVariantCurrentnessGate();
  const rootClaimRow = {
    ...currentGate.rowsByVariant["scheduler-index-wrapper"]
  };
  Object.defineProperty(rootClaimRow, "drainsPublicSchedulerTaskQueue", {
    configurable: true,
    enumerable: false,
    value: true
  });
  const hiddenExecutionRow = new Proxy(
    {
      ...currentGate.rowsByVariant["scheduler-cjs-index-production"]
    },
    {
      get(target, key, receiver) {
        if (key === "executesQueuedWork") {
          return true;
        }
        return Reflect.get(target, key, receiver);
      }
    }
  );
  const rowsByVariant = Object.freeze({
    ...currentGate.rowsByVariant,
    "scheduler-index-wrapper": Object.freeze(rootClaimRow),
    "scheduler-cjs-index-production": hiddenExecutionRow
  });
  const claimedGate = new Proxy(
    {
      ...currentGate,
      rowsByVariant,
      reactActBehaviorClaimed: true
    },
    {
      get(target, key, receiver) {
        if (key === "nativeExecution") {
          return true;
        }
        return Reflect.get(target, key, receiver);
      }
    }
  );

  const gate = evaluateSchedulerPublicTimingBlockerCurrentnessGate({
    variantCurrentnessGate: claimedGate
  });

  assert.equal(gate.status, SCHEDULER_PUBLIC_TIMING_BLOCKER_VIOLATION_STATUS);
  assertSubset(
    [
      "variantCurrentnessGate.nativeExecution",
      "variantCurrentnessGate.reactActBehaviorClaimed",
      "variantCurrentnessGate.rowsByVariant.scheduler-index-wrapper.drainsPublicSchedulerTaskQueue",
      "variantCurrentnessGate.rowsByVariant.scheduler-cjs-index-production.executesQueuedWork"
    ],
    gate.publicCompatibilityClaimIds
  );
  assertViolation(
    gate,
    "scheduler-public-timing-blocker-public-compatibility-claim-detected"
  );
});

function baselineGate() {
  if (cachedBaselineGate === null) {
    cachedBaselineGate = evaluateSchedulerPublicTimingBlockerCurrentnessGate();
  }
  return cachedBaselineGate;
}

function assertViolation(gate, id) {
  assert.ok(
    gate.violations.some((violation) => violation.id === id),
    `Expected violation ${id}`
  );
}

function violationRows(gate, id) {
  const violation = gate.violations.find((candidate) => candidate.id === id);
  assert.ok(violation, `Expected violation ${id}`);
  return violation.rows;
}

function allViolationIds(gate) {
  return gate.violations.flatMap((violation) => [
    violation.id,
    ...(violation.ids ?? []),
    ...((violation.rows ?? []).flatMap((row) =>
      row.firstDifferencePath ? [`${row.variantId}:${row.firstDifferencePath}`] : []
    ) ?? [])
  ]);
}

function assertSubset(expected, actual) {
  for (const value of expected) {
    assert.ok(actual.includes(value), `Expected ${value} in ${actual.join(", ")}`);
  }
}
